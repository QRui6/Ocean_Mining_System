"""Portable PostgreSQL DML: resolve IDs on the target, preserve non-HWS metrics."""
from __future__ import annotations

import json
import math
import os
from datetime import date, datetime, timezone
from pathlib import Path

TABLES = ("region_forecasts_hourly", "region_forecasts_daily",
          "site_forecasts_hourly", "site_forecasts_daily")
REGION_METRICS = ("wind_speed_avg", "wind_speed_max", "wind_dir_mean", "gust_max",
                  "wave_height_avg", "wave_height_max", "wave_period_avg", "wave_dir_mean")
SITE_METRICS = ("wind_speed", "wind_dir", "gust", "wave_height", "wave_period", "wave_dir")
ELEMENT_METRICS = {
    "wspd": ("wind_speed_avg", "wind_speed_max"), "wdir": ("wind_dir_mean",), "gust": ("gust_max",),
    "sigh": ("wave_height_avg", "wave_height_max"), "perd": ("wave_period_avg",), "dire": ("wave_dir_mean",),
}
SITE_ELEMENT_METRICS = {"wspd": ("wind_speed",), "wdir": ("wind_dir",), "gust": ("gust",),
                        "sigh": ("wave_height",), "perd": ("wave_period",), "dire": ("wave_dir",)}


class Expression(str):
    pass


def literal(value):
    if isinstance(value, Expression):
        return str(value)
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return literal(value.isoformat()) + "::timestamptz"
    if isinstance(value, date):
        return literal(value.isoformat()) + "::date"
    if isinstance(value, (int, float)):
        if not math.isfinite(value):
            return "NULL"
        return repr(value)
    if isinstance(value, (dict, list)):
        return literal(json.dumps(value, ensure_ascii=False, allow_nan=False)) + "::jsonb"
    value = str(value)
    if "\x00" in value:
        raise ValueError("NUL cannot be stored in PostgreSQL text")
    return "'" + value.replace("'", "''") + "'"


def insert_statement(table, values, conflict, updates):
    columns = list(values)
    return (f"INSERT INTO {table} ({', '.join(columns)}) VALUES "
            f"({', '.join(literal(values[c]) for c in columns)})\n"
            f"ON CONFLICT ({', '.join(conflict)}) DO UPDATE SET "
            + ", ".join(f"{c} = EXCLUDED.{c}" for c in updates))


def export_sql(path: Path, parsed_files, rows_by_table, definitions, batch_day: date, datasets=("wave",), elements=None):
    regions = {r["region_id"]: r for r in definitions["regions"]}
    sites = {s["site_id"]: s for s in definitions["sites"]}
    temp = path.with_suffix(".sql.part")
    path.parent.mkdir(parents=True, exist_ok=True)
    with temp.open("w", encoding="utf-8", newline="\n") as stream:
        def emit(sql):
            stream.write(sql + "\n")
        emit(f"-- HWS945 {'elements ' + ','.join(elements) if elements else 'complete ' + '/'.join(datasets)} batch; UTF-8 PostgreSQL SQL.")
        emit("-- Resolves region/site/file IDs at execution; never hard-codes exported database IDs.")
        emit("-- All file times are interpreted as UTC. Execute the entire file in one session.")
        emit(f"-- Batch: {batch_day} t12; generated: {datetime.now(timezone.utc).isoformat()}")
        emit("BEGIN;\nSET LOCAL TIME ZONE 'UTC';\nSET LOCAL standard_conforming_strings = on;")
        emit("SELECT pg_advisory_xact_lock(945, 12);")
        emit("CREATE TEMP TABLE _hws945_file_map (element_code TEXT PRIMARY KEY, file_id INTEGER NOT NULL) ON COMMIT DROP;")
        # Fail atomically if definitions were changed/missing on the target database.
        guard_tag = "$hws945_guard$"
        while guard_tag in json.dumps(definitions, ensure_ascii=False):
            guard_tag = guard_tag[:-1] + "_$"
        emit(f"DO {guard_tag} BEGIN")
        for r in regions.values():
            emit(f"IF (SELECT count(*) FROM mining_regions WHERE region_code={literal(r['region_code'])} "
                 f"AND is_active AND ST_AsGeoJSON(geometry,12)::jsonb = "
                 f"ST_AsGeoJSON(ST_SetSRID(ST_GeomFromGeoJSON("
                 f"{literal(json.dumps(r['geometry_geojson']))}),4326),12)::jsonb) <> 1 THEN "
                 f"RAISE EXCEPTION 'HWS945 region missing, inactive, or geometry changed: %', {literal(r['region_code'])}; END IF;")
        for s in sites.values():
            code = regions[s["region_id"]]["region_code"]
            emit(f"IF (SELECT count(*) FROM forecast_sites s JOIN mining_regions r ON r.id=s.region_id "
                 f"WHERE r.region_code={literal(code)} AND s.site_code={literal(s['site_code'])} "
                 f"AND s.is_active AND abs(s.lng-({literal(s['lng'])}))<0.000001 "
                 f"AND abs(s.lat-({literal(s['lat'])}))<0.000001) <> 1 THEN "
                 f"RAISE EXCEPTION 'HWS945 site missing, inactive, or moved: %', {literal(code + '/' + s['site_code'])}; END IF;")
        emit(f"END {guard_tag};")
        for p in parsed_files:
            values = dict(file_name=p.file_name, data_type=p.data_type, element_code=p.element_code,
                          base_date=p.base_date, run_cycle=p.run_cycle, storage_type="local",
                          object_key=p.relative_path, file_size_bytes=p.file_size_bytes,
                          download_status="success", downloaded_at=p.downloaded_at, is_latest=False)
            stmt = insert_statement("weather_files", values,
                                    ("data_type", "element_code", "base_date", "run_cycle"),
                                    [c for c in values if c not in ("data_type", "element_code", "base_date", "run_cycle", "is_latest")])
            emit(f"WITH f AS ({stmt} RETURNING id) INSERT INTO _hws945_file_map SELECT {literal(p.element_code)}, id FROM f;")
            meta = {"file_id": Expression(f"(SELECT file_id FROM _hws945_file_map WHERE element_code={literal(p.element_code)})")}
            for field in ("dataset_kind", "variable_name", "units", "grid_width", "grid_height", "lon_min",
                          "lon_max", "lat_min", "lat_max", "time_start", "time_end", "time_step_hours", "time_count"):
                meta[field] = getattr(p, field)
            emit(insert_statement("weather_file_metadata", meta, ("file_id",), [c for c in meta if c != "file_id"]) + ";")
        file_ids = Expression("(SELECT jsonb_agg(file_id ORDER BY element_code) FROM _hws945_file_map)")
        for table in TABLES:
            rows = rows_by_table[table]
            if not rows:
                raise ValueError("Refusing to export an empty forecast table: " + table)
            hourly = table.endswith("hourly")
            is_site = table.startswith("site_")
            metrics = SITE_METRICS if is_site and hourly else REGION_METRICS
            if elements is not None:
                mapping = SITE_ELEMENT_METRICS if is_site and hourly else ELEMENT_METRICS
                selected = {c for element in elements for c in mapping[element]}
                metrics = tuple(c for c in metrics if c in selected)
            else:
                metrics = tuple(c for c in metrics if (
                    ("wave" in datasets and c.startswith("wave_")) or
                    ("wind" in datasets and (c.startswith("wind_") or c.startswith("gust")))))
            columns = (["site_id"] if is_site else []) + ["region_id", "base_date", "run_cycle", "forecast_date"]
            columns += ["forecast_time", "forecast_hour"] if hourly else ["hour_count"]
            columns += list(metrics) + ["source_file_ids", "is_latest"]
            key_columns = (["site_id"] if is_site else ["region_id"]) + ["base_date", "run_cycle", "forecast_time" if hourly else "forecast_date"]
            entity_column = "site_id" if is_site else "region_id"
            stage = "_hws945_" + table
            emit(f"CREATE TEMP TABLE {stage} ON COMMIT DROP AS SELECT {', '.join(columns)} FROM {table} WITH NO DATA;")
            for row in rows:
                region_code = regions[row["region_id"]]["region_code"]
                values = {c: row[c] for c in columns}
                values["region_id"] = Expression(f"(SELECT id FROM mining_regions WHERE region_code={literal(region_code)})")
                if is_site:
                    site = sites[row["site_id"]]
                    values["site_id"] = Expression(f"(SELECT s.id FROM forecast_sites s JOIN mining_regions r ON r.id=s.region_id "
                                                   f"WHERE r.region_code={literal(region_code)} AND s.site_code={literal(site['site_code'])})")
                values["source_file_ids"] = file_ids
                values["is_latest"] = False
                emit(f"INSERT INTO {stage} ({', '.join(columns)}) VALUES ({', '.join(literal(values[c]) for c in columns)});")
            update_columns = [c for c in columns if c not in key_columns + ["is_latest", "source_file_ids"]]
            update_sql = ", ".join(f"{c}=EXCLUDED.{c}" for c in update_columns)
            # Keep any existing current values and references in these shared tables.
            source_union = (f"(SELECT jsonb_agg(DISTINCT x) FROM jsonb_array_elements("
                            f"COALESCE({table}.source_file_ids,'[]'::jsonb)||EXCLUDED.source_file_ids) x)")
            emit(f"INSERT INTO {table} ({', '.join(columns)}) SELECT {', '.join(columns)} FROM {stage} WHERE TRUE "
                 f"ON CONFLICT ({', '.join(key_columns)}) DO UPDATE SET {update_sql}, "
                 f"source_file_ids={source_union}, updated_at=CURRENT_TIMESTAMP;")
            stale = (f"t.base_date={literal(batch_day)} AND t.run_cycle='t12' "
                     f"AND t.{entity_column} IN (SELECT {entity_column} FROM {stage}) "
                     f"AND NOT EXISTS (SELECT 1 FROM {stage} s WHERE "
                     + " AND ".join(f"s.{c}=t.{c}" for c in key_columns) + ")")
            current_columns = ("current_speed", "current_dir") if is_site and hourly else (
                "current_speed_avg", "current_speed_max", "current_dir_mean")
            other_metrics = tuple(c for c in (SITE_METRICS if is_site and hourly else REGION_METRICS) if c not in metrics)
            preserved_columns = current_columns + other_metrics
            emit(f"DELETE FROM {table} t WHERE {stale} AND " + " AND ".join(f"t.{c} IS NULL" for c in preserved_columns) + ";")
            emit(f"UPDATE {table} t SET " + ", ".join(f"{c}=NULL" for c in metrics) + f", is_latest=FALSE WHERE {stale};")
            if elements is not None and not hourly:
                partner = table.replace("daily", "hourly")
                hourly_metrics = SITE_METRICS if is_site else REGION_METRICS
                any_hourly = " OR ".join(f"h.{c} IS NOT NULL" for c in hourly_metrics)
                emit(f"UPDATE {table} t SET hour_count=(SELECT count(*) FROM {partner} h "
                     f"WHERE h.{entity_column}=t.{entity_column} AND h.base_date=t.base_date "
                     f"AND h.run_cycle=t.run_cycle AND h.forecast_date=t.forecast_date AND ({any_hourly})) "
                     f"WHERE t.base_date={literal(batch_day)} AND t.run_cycle='t12' "
                     f"AND t.{entity_column} IN (SELECT {entity_column} FROM {stage});")
            # Select by batch date, never by insertion order. Historical backfill cannot demote a newer batch.
            required = []
            suffix = "" if is_site and hourly else "_avg"
            if elements is not None:
                # Shared is_latest cannot represent a separate version per element.
                # Always select the newest actual weather batch, even when importing
                # an older counterpart after newer wind/wave has already arrived.
                required.append("(" + " OR ".join(f"q.{c} IS NOT NULL" for c in (
                    SITE_METRICS if is_site and hourly else REGION_METRICS)) + ")")
            elif "wind" in datasets:
                required.append(f"q.wind_speed{suffix} IS NOT NULL")
            if elements is None and "wave" in datasets:
                required.append(f"q.wave_height{suffix} IS NOT NULL")
            emit(f"UPDATE {table} t SET is_latest=COALESCE(((t.base_date,t.run_cycle)=(SELECT q.base_date,q.run_cycle FROM {table} q "
                 f"WHERE q.{entity_column}=t.{entity_column} AND {' AND '.join(required)} "
                 f"ORDER BY q.base_date DESC,q.run_cycle DESC LIMIT 1)), FALSE) "
                 f"WHERE t.{entity_column} IN (SELECT {entity_column} FROM {stage});")
        emit("UPDATE weather_files f SET is_latest=((f.base_date,f.run_cycle)=(SELECT q.base_date,q.run_cycle FROM weather_files q "
             "WHERE q.data_type=f.data_type AND q.element_code=f.element_code AND q.download_status='success' "
             "ORDER BY q.base_date DESC,q.run_cycle DESC LIMIT 1)) WHERE (f.data_type,f.element_code) IN "
             "(SELECT data_type,element_code FROM weather_files WHERE id IN (SELECT file_id FROM _hws945_file_map));")
        emit("COMMIT;")
    os.replace(temp, path)
    return {table: len(rows_by_table[table]) for table in TABLES}
