#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Import overview static data from the bundled GeoJSON file.

Rules:
1. One large region = one location
2. Large region name = location
3. Small mining areas under the same location become forecast sites
4. One forecast site is represented by one centroid point
"""

from __future__ import annotations

import json
import os
from collections import defaultdict
from pathlib import Path

import psycopg2
from psycopg2.extras import Json


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_GEOJSON = (
    PROJECT_ROOT
    / "java"
    / "src"
    / "main"
    / "resources"
    / "static"
    / "data"
    / "ocean_mining_final.geojson"
)


def load_features(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8", errors="replace") as file_obj:
        data = json.load(file_obj)
    return data.get("features", [])


def group_regions_by_location(features: list[dict]) -> dict[str, list[dict]]:
    grouped: dict[str, list[dict]] = defaultdict(list)
    for feature in features:
        props = feature.get("properties", {})
        geometry = feature.get("geometry", {})
        location = props.get("location")
        if not location or geometry.get("type") != "Polygon":
            continue
        grouped[location].append(feature)
    return grouped


def group_sites_by_location_and_id(features: list[dict]) -> dict[tuple[str, str], list[dict]]:
    grouped: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for feature in features:
        props = feature.get("properties", {})
        geometry = feature.get("geometry", {})
        location = props.get("location")
        site_code = props.get("id")
        if not location or not site_code or geometry.get("type") != "Polygon":
            continue
        grouped[(location, site_code)].append(feature)
    return grouped


def multipolygon_coordinates(features: list[dict]) -> list:
    return [feature["geometry"]["coordinates"] for feature in features]


def build_region_record(location: str, features: list[dict]) -> dict:
    coordinates = multipolygon_coordinates(features)
    return {
        "region_code": location,
        "region_name": location,
        "boundary_polygon": coordinates,
        "geometry_geojson": {
            "type": "MultiPolygon",
            "coordinates": coordinates,
        },
        "is_active": True,
    }


def build_site_record(location: str, site_code: str, features: list[dict]) -> dict:
    props = features[0]["properties"]
    coordinates = multipolygon_coordinates(features)
    return {
        "location": location,
        "site_code": site_code,
        "site_name": props.get("contractor") or site_code,
        "geometry_geojson": {
            "type": "MultiPolygon",
            "coordinates": coordinates,
        },
        "is_active": True,
    }


def upsert_regions(cur, grouped_regions: dict[str, list[dict]]) -> dict[str, int]:
    region_id_map: dict[str, int] = {}

    cur.execute(
        """
        ALTER TABLE mining_regions
        ALTER COLUMN geometry TYPE geometry(MULTIPOLYGON, 4326)
        USING ST_Multi(geometry)
        """
    )

    for location in sorted(grouped_regions.keys()):
        record = build_region_record(location, grouped_regions[location])
        cur.execute(
            """
            INSERT INTO mining_regions (
                region_code,
                region_name,
                center_lng,
                center_lat,
                boundary_polygon,
                geometry,
                is_active
            )
            VALUES (
                %(region_code)s,
                %(region_name)s,
                ST_X(ST_Centroid(ST_SetSRID(ST_GeomFromGeoJSON(%(geometry_geojson)s), 4326))),
                ST_Y(ST_Centroid(ST_SetSRID(ST_GeomFromGeoJSON(%(geometry_geojson)s), 4326))),
                %(boundary_polygon)s,
                ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(%(geometry_geojson)s), 4326)),
                %(is_active)s
            )
            ON CONFLICT (region_code)
            DO UPDATE SET
                region_name = EXCLUDED.region_name,
                center_lng = EXCLUDED.center_lng,
                center_lat = EXCLUDED.center_lat,
                boundary_polygon = EXCLUDED.boundary_polygon,
                geometry = EXCLUDED.geometry,
                is_active = EXCLUDED.is_active,
                updated_at = CURRENT_TIMESTAMP
            RETURNING id
            """,
            {
                "region_code": record["region_code"],
                "region_name": record["region_name"],
                "boundary_polygon": Json(record["boundary_polygon"]),
                "geometry_geojson": json.dumps(record["geometry_geojson"], ensure_ascii=False),
                "is_active": record["is_active"],
            },
        )
        region_id_map[location] = cur.fetchone()[0]

    return region_id_map


def upsert_sites(cur, grouped_sites: dict[tuple[str, str], list[dict]], region_id_map: dict[str, int]) -> int:
    imported = 0
    valid_pairs: list[tuple[int, str]] = []

    for (location, site_code), features in sorted(grouped_sites.items()):
        region_id = region_id_map.get(location)
        if region_id is None:
            continue
        record = build_site_record(location, site_code, features)
        cur.execute(
            """
            INSERT INTO forecast_sites (
                region_id,
                site_code,
                site_name,
                lng,
                lat,
                point_geom,
                is_active
            )
            VALUES (
                %(region_id)s,
                %(site_code)s,
                %(site_name)s,
                ST_X(ST_Centroid(ST_SetSRID(ST_GeomFromGeoJSON(%(geometry_geojson)s), 4326))),
                ST_Y(ST_Centroid(ST_SetSRID(ST_GeomFromGeoJSON(%(geometry_geojson)s), 4326))),
                ST_Centroid(ST_SetSRID(ST_GeomFromGeoJSON(%(geometry_geojson)s), 4326)),
                %(is_active)s
            )
            ON CONFLICT (region_id, site_code)
            DO UPDATE SET
                site_name = EXCLUDED.site_name,
                lng = EXCLUDED.lng,
                lat = EXCLUDED.lat,
                point_geom = EXCLUDED.point_geom,
                is_active = EXCLUDED.is_active,
                updated_at = CURRENT_TIMESTAMP
            """,
            {
                "region_id": region_id,
                "site_code": record["site_code"],
                "site_name": record["site_name"],
                "geometry_geojson": json.dumps(record["geometry_geojson"], ensure_ascii=False),
                "is_active": record["is_active"],
            },
        )
        valid_pairs.append((region_id, site_code))
        imported += 1

    if valid_pairs:
        values_sql = ",".join(cur.mogrify("(%s,%s)", pair).decode("utf-8") for pair in valid_pairs)
        cur.execute(
            f"""
            DELETE FROM forecast_sites
            WHERE (region_id, site_code) NOT IN ({values_sql})
            """
        )
    else:
        cur.execute("DELETE FROM forecast_sites")

    return imported


def delete_stale_regions(cur, valid_region_codes: list[str]) -> None:
    cur.execute(
        """
        DELETE FROM mining_regions
        WHERE region_code <> ALL(%s)
        """,
        (valid_region_codes,),
    )


def main() -> int:
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = int(os.getenv("DB_PORT", "5432"))
    db_name = os.getenv("DB_NAME", "ship_monitoring")
    db_user = os.getenv("DB_USER", "postgres")
    db_password = os.getenv("DB_PASSWORD", "030525")

    features = load_features(DEFAULT_GEOJSON)
    if not features:
        raise RuntimeError(f"No valid features found in {DEFAULT_GEOJSON}")

    grouped_regions = group_regions_by_location(features)
    grouped_sites = group_sites_by_location_and_id(features)

    conn = psycopg2.connect(
        host=db_host,
        port=db_port,
        dbname=db_name,
        user=db_user,
        password=db_password,
    )
    conn.autocommit = False

    try:
        with conn.cursor() as cur:
            region_id_map = upsert_regions(cur, grouped_regions)
            site_count = upsert_sites(cur, grouped_sites, region_id_map)
            delete_stale_regions(cur, sorted(grouped_regions.keys()))
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    print(
        f"done: upserted {len(grouped_regions)} mining_regions and "
        f"{site_count} forecast_sites from {DEFAULT_GEOJSON}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
