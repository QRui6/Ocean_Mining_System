"""Verify real exported SQL in an isolated loopback PostgreSQL test cluster."""
from __future__ import annotations

import argparse
import json
import os
import sys
import uuid
from pathlib import Path

import psycopg2
from psycopg2.extensions import parse_dsn

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
from automation.hws945.sql_export import TABLES


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--definitions", type=Path, required=True)
    p.add_argument("--sql-dir", type=Path, required=True)
    args = p.parse_args()
    dsn = os.environ.get("HWS945_TEST_DSN", "")
    options = parse_dsn(dsn)
    if options.get("host") not in ("127.0.0.1", "localhost") or options.get("user") != "hws945_test":
        raise ValueError("Verification requires an isolated loopback test server/user")
    definitions = json.loads(args.definitions.read_text("utf-8"))
    files = sorted(args.sql_dir.glob("hws945_*_t12_wave.sql"))
    if not files:
        raise ValueError("No real batch SQL files found")
    schema = "hws945_real_" + uuid.uuid4().hex
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            cur.execute("CREATE SCHEMA " + schema)
            cur.execute("SET search_path TO " + schema + ",public")
            ddl = (ROOT / "database_mining_overview.sql").read_text("utf-8")
            cur.execute("\n".join(line for line in ddl.splitlines() if not line.startswith("\\")))
            region_map = {}
            for index, r in enumerate(definitions["regions"]):
                target_id = 1000 + index
                region_map[r["region_id"]] = target_id
                if r.get("geometry_ewkb_hex"):
                    cur.execute("INSERT INTO mining_regions(id,region_code,region_name,boundary_polygon,geometry) "
                                "VALUES(%s,%s,%s,'[]',ST_GeomFromEWKB(%s))",
                                (target_id, r["region_code"], r["region_name"], bytes.fromhex(r["geometry_ewkb_hex"])))
                else:
                    cur.execute("INSERT INTO mining_regions(id,region_code,region_name,boundary_polygon,geometry) "
                                "VALUES(%s,%s,%s,'[]',ST_SetSRID(ST_GeomFromGeoJSON(%s),4326))",
                                (target_id, r["region_code"], r["region_name"], json.dumps(r["geometry_geojson"])))
            for index, s in enumerate(definitions["sites"]):
                cur.execute("INSERT INTO forecast_sites(id,region_id,site_code,site_name,lng,lat) VALUES(%s,%s,%s,%s,%s,%s)",
                            (10000 + index, region_map[s["region_id"]], s["site_code"], s["site_name"], s["lng"], s["lat"]))
            for file in files:
                cur.execute(file.read_text("utf-8"))
                print("Validated", file.name, flush=True)
            counts = {}
            for table in ("weather_files", "weather_file_metadata") + TABLES:
                cur.execute("SELECT count(*) FROM " + table)
                counts[table] = cur.fetchone()[0]
            print(json.dumps({"batches": len(files), "row_counts": counts}, ensure_ascii=False), flush=True)
    finally:
        with conn.cursor() as cur:
            cur.execute("ROLLBACK")
            cur.execute("SET search_path TO public")
            cur.execute("DROP SCHEMA " + schema + " CASCADE")
        conn.close()


if __name__ == "__main__":
    main()
