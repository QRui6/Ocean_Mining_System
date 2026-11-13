import argparse
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from typing import Iterable

import numpy as np
import psycopg2
from psycopg2.extras import Json, RealDictCursor
from shapely.geometry import box, shape, mapping

try:
    import rasterio
    from rasterio.mask import mask
except ImportError as exc:  # pragma: no cover
    raise SystemExit(
        "Missing dependency: rasterio. Install with `pip install rasterio` before running this script."
    ) from exc


DATASET_CODE = "gebco_2025"
DEFAULT_TILE_DIR = Path("data/bathymetry/raw")
DEFAULT_TILE_PATTERNS = (
    "gebco_2025_*.tif",
)


@dataclass
class TileHandle:
    path: Path
    dataset: "rasterio.io.DatasetReader"

    @property
    def bounds_polygon(self):
        bounds = self.dataset.bounds
        return box(bounds.left, bounds.bottom, bounds.right, bounds.top)


def parse_args():
    parser = argparse.ArgumentParser(description="Import Pacific mining bathymetry from GEBCO tiles.")
    parser.add_argument("--db-host", required=True)
    parser.add_argument("--db-port", type=int, default=5432)
    parser.add_argument("--db-name", required=True)
    parser.add_argument("--db-user", required=True)
    parser.add_argument("--db-password", required=True)
    parser.add_argument(
        "--tile",
        action="append",
        dest="tiles",
        help="Explicit GEBCO GeoTIFF file path. Can be provided multiple times.",
    )
    parser.add_argument(
        "--tile-dir",
        default=str(DEFAULT_TILE_DIR),
        help="Directory to scan when --tile is not provided.",
    )
    parser.add_argument(
        "--region-name-keyword",
        default="太平洋",
        help="Only process regions whose name contains this keyword.",
    )
    parser.add_argument(
        "--region-id",
        type=int,
        action="append",
        dest="region_ids",
        help="Explicit region id to process. Can be provided multiple times.",
    )
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def discover_tiles(explicit_tiles: list[str] | None, tile_dir: str) -> list[Path]:
    if explicit_tiles:
        paths = [Path(item).resolve() for item in explicit_tiles]
    else:
        base = Path(tile_dir)
        paths = []
        for pattern in DEFAULT_TILE_PATTERNS:
            paths.extend(base.glob(pattern))
        paths = [item.resolve() for item in sorted(set(paths))]
    existing = [item for item in paths if item.exists()]
    if not existing:
        raise SystemExit(
            "No GEBCO GeoTIFF tiles found. Put files under data/bathymetry/raw or pass --tile explicitly."
        )
    return existing


def open_tiles(paths: Iterable[Path]) -> list[TileHandle]:
    return [TileHandle(path=item, dataset=rasterio.open(item)) for item in paths]


def close_tiles(handles: Iterable[TileHandle]):
    for handle in handles:
        handle.dataset.close()


def connect_db(args):
    return psycopg2.connect(
        host=args.db_host,
        port=args.db_port,
        dbname=args.db_name,
        user=args.db_user,
        password=args.db_password,
    )


def build_region_filters(keyword: str, region_ids: list[int] | None):
    if region_ids:
        placeholders = ",".join(["%s"] * len(region_ids))
        return f"id IN ({placeholders})", tuple(region_ids)
    return "region_name LIKE %s", (f"%{keyword}%",)


def load_regions(conn, keyword: str, region_ids: list[int] | None):
    filter_sql, filter_params = build_region_filters(keyword, region_ids)
    sql = f"""
        SELECT
            id,
            region_code,
            region_name,
            center_lng,
            center_lat,
            ST_AsGeoJSON(geometry) AS geometry_json
        FROM mining_regions
        WHERE is_active = TRUE
          AND {filter_sql}
          AND geometry IS NOT NULL
        ORDER BY id
    """
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(sql, filter_params)
        rows = cursor.fetchall()
    for row in rows:
        row["geometry"] = shape(json.loads(row["geometry_json"]))
    return rows


def load_sites(conn, keyword: str, region_ids: list[int] | None):
    filter_sql, filter_params = build_region_filters(keyword, region_ids)
    sql = f"""
        SELECT
            s.id,
            s.region_id,
            s.site_code,
            s.site_name,
            s.lng,
            s.lat,
            r.region_name
        FROM forecast_sites s
        JOIN mining_regions r ON r.id = s.region_id
        WHERE s.is_active = TRUE
          AND r.is_active = TRUE
          AND r.{filter_sql}
        ORDER BY s.id
    """
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(sql, filter_params)
        return cursor.fetchall()


def round_decimal(value: float | None) -> Decimal | None:
    if value is None:
        return None
    return Decimal(str(value)).quantize(Decimal("0.001"), rounding=ROUND_HALF_UP)


def normalize_depth(elevation: float | None) -> float | None:
    if elevation is None:
        return None
    if np.isnan(elevation):
        return None
    if elevation >= 0:
        return None
    return float(abs(elevation))


def sample_point_from_tile(tile: TileHandle, lon: float, lat: float):
    value = next(tile.dataset.sample([(lon, lat)]))[0]
    if tile.dataset.nodata is not None and np.isclose(value, tile.dataset.nodata):
        return None, None
    elevation = float(value)
    depth = normalize_depth(elevation)
    return elevation, depth


def find_covering_tile(tiles: list[TileHandle], lon: float, lat: float):
    for tile in tiles:
        bounds = tile.dataset.bounds
        if bounds.left <= lon <= bounds.right and bounds.bottom <= lat <= bounds.top:
            return tile
    return None


def sample_site_bathymetry(tiles: list[TileHandle], site: dict):
    lon = float(site["lng"])
    lat = float(site["lat"])
    tile = find_covering_tile(tiles, lon, lat)
    if tile is None:
        return {
            "site_id": site["id"],
            "region_id": site["region_id"],
            "dataset_code": DATASET_CODE,
            "depth_m": None,
            "elevation_m": None,
            "source_file_name": None,
            "sampled_at": datetime.now(timezone.utc),
        }

    elevation, depth = sample_point_from_tile(tile, lon, lat)
    return {
        "site_id": site["id"],
        "region_id": site["region_id"],
        "dataset_code": DATASET_CODE,
        "depth_m": round_decimal(depth),
        "elevation_m": round_decimal(elevation),
        "source_file_name": tile.path.name,
        "sampled_at": datetime.now(timezone.utc),
    }


def summarize_region_bathymetry(tiles: list[TileHandle], region: dict):
    geom = region["geometry"]
    overlapping_tiles = [tile for tile in tiles if tile.bounds_polygon.intersects(geom)]
    source_files = [tile.path.name for tile in overlapping_tiles]
    values = []
    for tile in overlapping_tiles:
        try:
            data, _ = mask(tile.dataset, [mapping(geom)], crop=True, filled=True)
        except ValueError:
            continue
        band = data[0].astype(float)
        nodata = tile.dataset.nodata
        if nodata is not None:
            band[np.isclose(band, nodata)] = np.nan
        band[band >= 0] = np.nan
        band = np.abs(band)
        valid = band[~np.isnan(band)]
        if valid.size > 0:
            values.append(valid)

    flat = np.concatenate(values) if values else np.array([])
    center_depth = None
    if region["center_lng"] is not None and region["center_lat"] is not None:
        tile = find_covering_tile(tiles, float(region["center_lng"]), float(region["center_lat"]))
        if tile is not None:
            _, center_depth = sample_point_from_tile(tile, float(region["center_lng"]), float(region["center_lat"]))

    return {
        "region_id": region["id"],
        "dataset_code": DATASET_CODE,
        "depth_min_m": round_decimal(float(np.min(flat))) if flat.size else None,
        "depth_max_m": round_decimal(float(np.max(flat))) if flat.size else None,
        "depth_avg_m": round_decimal(float(np.mean(flat))) if flat.size else None,
        "center_depth_m": round_decimal(center_depth),
        "sample_count": int(flat.size),
        "source_files": source_files,
        "coverage_note": f"keyword={region['region_name']}",
    }


def upsert_region_summaries(conn, rows: list[dict]):
    if not rows:
        return
    sql = """
        INSERT INTO region_bathymetry_summary (
            region_id,
            dataset_code,
            depth_min_m,
            depth_max_m,
            depth_avg_m,
            center_depth_m,
            sample_count,
            source_files,
            coverage_note
        ) VALUES (
            %(region_id)s,
            %(dataset_code)s,
            %(depth_min_m)s,
            %(depth_max_m)s,
            %(depth_avg_m)s,
            %(center_depth_m)s,
            %(sample_count)s,
            %(source_files)s,
            %(coverage_note)s
        )
        ON CONFLICT (region_id) DO UPDATE SET
            dataset_code = EXCLUDED.dataset_code,
            depth_min_m = EXCLUDED.depth_min_m,
            depth_max_m = EXCLUDED.depth_max_m,
            depth_avg_m = EXCLUDED.depth_avg_m,
            center_depth_m = EXCLUDED.center_depth_m,
            sample_count = EXCLUDED.sample_count,
            source_files = EXCLUDED.source_files,
            coverage_note = EXCLUDED.coverage_note,
            updated_at = CURRENT_TIMESTAMP
    """
    payload = [
        {
            **row,
            "source_files": Json(row["source_files"]),
        }
        for row in rows
    ]
    with conn.cursor() as cursor:
        cursor.executemany(sql, payload)


def upsert_site_samples(conn, rows: list[dict]):
    if not rows:
        return
    sql = """
        INSERT INTO site_bathymetry (
            site_id,
            region_id,
            dataset_code,
            depth_m,
            elevation_m,
            source_file_name,
            sampled_at
        ) VALUES (
            %(site_id)s,
            %(region_id)s,
            %(dataset_code)s,
            %(depth_m)s,
            %(elevation_m)s,
            %(source_file_name)s,
            %(sampled_at)s
        )
        ON CONFLICT (site_id) DO UPDATE SET
            region_id = EXCLUDED.region_id,
            dataset_code = EXCLUDED.dataset_code,
            depth_m = EXCLUDED.depth_m,
            elevation_m = EXCLUDED.elevation_m,
            source_file_name = EXCLUDED.source_file_name,
            sampled_at = EXCLUDED.sampled_at,
            updated_at = CURRENT_TIMESTAMP
    """
    with conn.cursor() as cursor:
        cursor.executemany(sql, rows)


def main():
    args = parse_args()
    tile_paths = discover_tiles(args.tiles, args.tile_dir)
    tiles = open_tiles(tile_paths)
    try:
        conn = connect_db(args)
        try:
            regions = load_regions(conn, args.region_name_keyword, args.region_ids)
            sites = load_sites(conn, args.region_name_keyword, args.region_ids)
            region_rows = [summarize_region_bathymetry(tiles, region) for region in regions]
            site_rows = [sample_site_bathymetry(tiles, site) for site in sites]

            print(f"tiles={len(tile_paths)} regions={len(region_rows)} sites={len(site_rows)} dry_run={args.dry_run}")
            for row in region_rows:
                print(
                    f"region {row['region_id']}: avg={row['depth_avg_m']} min={row['depth_min_m']} "
                    f"max={row['depth_max_m']} center={row['center_depth_m']} samples={row['sample_count']}"
                )

            if args.dry_run:
                conn.rollback()
                return

            upsert_region_summaries(conn, region_rows)
            upsert_site_samples(conn, site_rows)
            conn.commit()
            print("bathymetry import complete")
        finally:
            conn.close()
    finally:
        close_tiles(tiles)


if __name__ == "__main__":
    main()
