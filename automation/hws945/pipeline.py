#!/usr/bin/env python
"""HWS945 range export and daily import. Export mode never writes to PostgreSQL."""
from __future__ import annotations

import argparse
import hashlib
import json
import logging
import os
import sys
from contextlib import ExitStack, contextmanager
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from automation.hws945.source import ELEMENTS, Source, atomic_json, sha256
from automation.hws945.sql_export import TABLES, export_sql

LOG = logging.getLogger("hws945")
CHINA = timezone(timedelta(hours=8))


def parse_day(value):
    return datetime.strptime(value.replace("-", ""), "%Y%m%d").date()


def parser():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--mode", choices=("export", "import"), default="export")
    group = p.add_mutually_exclusive_group(required=True)
    group.add_argument("--date", type=parse_day)
    group.add_argument("--start-date", type=parse_day)
    group.add_argument("--latest", action="store_true")
    p.add_argument("--end-date", type=parse_day)
    p.add_argument("--datasets", choices=("wave", "wind", "wind,wave"), default="wave")
    p.add_argument("--elements", help="Explicit comma-separated elements; only their metrics are written")
    p.add_argument("--source-config", type=Path, help="Local JSON: URL templates, optional cookie_file/headers")
    p.add_argument("--db-config", type=Path, help="Local JSON: libpq host/port/dbname/user/password; never logged")
    p.add_argument("--definitions-json", type=Path, help="Previously exported region/site definition snapshot")
    p.add_argument("--raw-dir", type=Path, default=ROOT / "data" / "hws945" / "raw")
    p.add_argument("--output-dir", type=Path, default=ROOT / "data" / "hws945" / "exports")
    p.add_argument("--probe-only", action="store_true", help="Only create availability report; no downloads/DB access")
    p.add_argument("--no-proxy", action="store_true", help="Connect without environment HTTP proxies")
    p.add_argument("--refresh-existing", action="store_true", help="Re-download files, including same-date revisions")
    p.add_argument("--regional-subset", action="store_true", help="Fetch exact native cells required by active regions/sites via HTTP ranges")
    p.add_argument("--lookback-days", type=int, default=7, help="Latest discovery scan if source date index is empty")
    return p


def db_options(config: Path | None):
    data = json.loads(config.read_text(encoding="utf-8")) if config else {}
    allowed = {"host", "port", "dbname", "user", "password", "sslmode", "connect_timeout", "passfile"}
    if set(data) - allowed:
        raise ValueError("Unsupported database configuration keys")
    for key, env in (("host", "DB_HOST"), ("port", "DB_PORT"), ("dbname", "DB_NAME"),
                     ("user", "DB_USER"), ("password", "DB_PASSWORD")):
        if os.getenv(env):
            data[key] = os.environ[env]
    data.setdefault("connect_timeout", 15)
    data.setdefault("dbname", "ship_monitoring")
    return data


def read_definitions(config: Path | None):
    import psycopg2
    # The read-only transaction is set before the first SQL statement.
    conn = psycopg2.connect(**db_options(config))
    try:
        conn.set_session(readonly=True, isolation_level="REPEATABLE READ")
        with conn.cursor() as cur:
            cur.execute("SELECT id,region_code,region_name,ST_AsGeoJSON(geometry,15) "
                        "FROM mining_regions WHERE is_active ORDER BY id")
            regions = [dict(region_id=r[0], region_code=r[1], region_name=r[2],
                            geometry_geojson=json.loads(r[3])) for r in cur.fetchall()]
            cur.execute("SELECT s.id,s.region_id,s.site_code,s.site_name,s.lng,s.lat "
                        "FROM forecast_sites s JOIN mining_regions r ON r.id=s.region_id "
                        "WHERE s.is_active AND r.is_active ORDER BY s.id")
            sites = [dict(site_id=r[0], region_id=r[1], site_code=r[2], site_name=r[3],
                          lng=float(r[4]), lat=float(r[5])) for r in cur.fetchall()]
        return validate_definitions({"regions": regions, "sites": sites})
    finally:
        conn.rollback()
        conn.close()


def validate_definitions(data):
    if not data.get("regions") or not data.get("sites"):
        raise ValueError("Active regions and sites are required")
    regions = data["regions"]
    sites = data["sites"]
    if len({r["region_id"] for r in regions}) != len(regions) or len({r["region_code"] for r in regions}) != len(regions):
        raise ValueError("Duplicate region identity")
    ids = {r["region_id"] for r in regions}
    if any(s["region_id"] not in ids for s in sites):
        raise ValueError("Site references unknown region")
    if len({s["site_id"] for s in sites}) != len(sites) or len({(s["region_id"], s["site_code"]) for s in sites}) != len(sites):
        raise ValueError("Duplicate site identity")
    return data


def fingerprint(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, default=str).encode("utf-8")).hexdigest()


def processing_version():
    files = [Path(__file__), Path(__file__).with_name("source.py"),
             Path(__file__).with_name("sql_export.py"), Path(__file__).with_name("regional_subset.py"),
             ROOT / "automation" / "mining_overview" / "process_forecasts_batch.py"]
    if Path(__file__).with_name("daily.py").exists():
        files.append(Path(__file__).with_name("daily.py"))
    return fingerprint({p.name: sha256(p) for p in files})


def compute(paths, definitions):
    import numpy as np
    import automation.mining_overview.process_forecasts_batch as proc
    from automation.wind_wave.register_weather_batch import parse_nc_file
    parsed = [parse_nc_file(path.resolve()) for path in paths]
    for p in parsed:
        p.downloaded_at = datetime.fromtimestamp(p.path.stat().st_mtime, timezone.utc)
        if p.path.with_suffix(".subset.json").exists():
            p.dataset_kind += "_regional_subset"
    regions = [proc.RegionDefinition(**r) for r in definitions["regions"]]
    sites = [proc.SiteDefinition(**s) for s in definitions["sites"]]
    with ExitStack() as stack:
        fields = {p.element_code: proc.open_forecast_field(
            proc.BatchFile(i + 1, p.element_code, p.data_type, p.base_date, p.run_cycle, str(p.path.resolve())), stack)
                  for i, p in enumerate(parsed)}
        for dataset in {p.data_type for p in parsed}:
            members = [f for f in fields.values() if f.data_type == dataset]
            ref = members[0]
            for f in members[1:]:
                if (not np.array_equal(f.lon_values, ref.lon_values) or
                    not np.array_equal(f.lat_values, ref.lat_values) or f.forecast_times != ref.forecast_times):
                    raise ValueError("Mismatched grids/time axes within " + dataset)
        wind = proc.pick_reference_field(fields, proc.WIND_ELEMENTS)
        wave = proc.pick_reference_field(fields, proc.WAVE_ELEMENTS)
        region_indices = proc.build_region_spatial_indices(regions, wind, wave, None)
        site_indices = proc.build_site_spatial_indices(sites, wind, wave, None)
        region_rows = proc.build_region_hourly_rows(region_indices, fields, [])
        site_rows = proc.build_site_hourly_rows(site_indices, fields, [])
        # Preserve all available forecast times, including partial first/last days.
        results = dict(zip(TABLES, (region_rows, proc.build_region_daily_rows(region_rows),
                                   site_rows, proc.build_site_daily_rows(site_rows))))
    if any(not results[t] for t in TABLES):
        raise ValueError("No forecast rows produced for one or more tables")
    return parsed, results


def apply_sql(path: Path, config: Path | None):
    import psycopg2
    conn = psycopg2.connect(**db_options(config))
    try:
        # SQL itself contains BEGIN/COMMIT and the shared advisory lock.
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute(path.read_text(encoding="utf-8"))
    finally:
        conn.close()


@contextmanager
def process_lock(path):
    path.parent.mkdir(parents=True, exist_ok=True)
    stream = path.open("a+b")
    try:
        stream.seek(0, 2)
        if stream.tell() == 0:
            stream.write(b"0")
            stream.flush()
        stream.seek(0)
        if os.name == "nt":
            import msvcrt
            msvcrt.locking(stream.fileno(), msvcrt.LK_NBLCK, 1)
        else:
            import fcntl
            fcntl.flock(stream.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        yield
    finally:
        stream.close()


def run(args):
    if args.start_date and not args.end_date:
        raise ValueError("--start-date requires --end-date")
    if args.end_date and not args.start_date:
        raise ValueError("--end-date requires --start-date")
    if args.lookback_days < 1 or args.lookback_days > 60:
        raise ValueError("--lookback-days must be between 1 and 60")
    config = json.loads(args.source_config.read_text(encoding="utf-8")) if args.source_config else {}
    source = Source(config, no_proxy=args.no_proxy)
    datasets = tuple(args.datasets.split(","))
    elements = [e for ds in datasets for e in ELEMENTS[ds]]
    selected_elements = None
    if args.elements is not None:
        selected_elements = tuple(e.strip() for e in args.elements.split(",") if e.strip())
        if not selected_elements or len(set(selected_elements)) != len(selected_elements) or not set(selected_elements).issubset(elements):
            raise ValueError("--elements must be unique elements belonging to --datasets")
        elements = list(selected_elements)
    today = datetime.now(CHINA).date()
    if args.latest:
        # Also probe recent dates: an empty/stale date index must not hide new files.
        days = sorted({d for d in source.available_dates(datasets) if today - timedelta(days=args.lookback_days - 1) <= d <= today}
                      | {today - timedelta(days=i) for i in range(args.lookback_days)}, reverse=True)
    else:
        start, end = args.date or args.start_date, args.date or args.end_date
        if start > end or (end - start).days > 366:
            raise ValueError("Invalid date range (maximum 367 batches)")
        days = [start + timedelta(days=i) for i in range((end - start).days + 1)]
    args.output_dir.mkdir(parents=True, exist_ok=True)
    state_path = args.output_dir / "applied_state.json"
    state = json.loads(state_path.read_text("utf-8")) if state_path.exists() else {}
    report = {"mode": args.mode, "datasets": datasets, "elements": elements, "generated_at": datetime.now(CHINA).isoformat(),
              "requested_dates": [str(d) for d in days], "batches": [],
              "database_writes": False, "sql_files": [],
              "note": "Availability is reported explicitly; missing dates are never fabricated."}
    definitions = None
    version = processing_version()
    target_identity = None
    if args.mode == "import":
        options = db_options(args.db_config)
        target_identity = {key: options.get(key, os.getenv(env, fallback)) for key, env, fallback in (
            ("host", "PGHOST", "localhost"), ("port", "PGPORT", "5432"),
            ("dbname", "PGDATABASE", "ship_monitoring"), ("user", "PGUSER", os.getenv("USERNAME", "")))}
    failures = 0
    for day in days:
        directory = args.raw_dir / day.strftime("%Y/%m/%d")
        batch = {"date": str(day), "cycle": "t12"}
        report["batches"].append(batch)
        try:
            found = source.probe(day, elements, directory, check_remote=args.latest or args.refresh_existing)
            batch["files"] = found
            complete = all(f["status"] in ("available", "local_valid") for f in found)
            if not complete:
                batch["status"] = "incomplete"
                failures += 1
                LOG.warning("%s incomplete: %s", day, ", ".join(f["element"] + "=" + f["status"] for f in found))
                continue
            batch["estimated_download_bytes"] = sum(f.get("bytes", 0) for f in found if f["status"] == "available")
            if args.probe_only:
                batch["status"] = "available"
                LOG.info("%s available (%s bytes)", day, batch["estimated_download_bytes"])
                if args.latest:
                    break
                continue
            if definitions is None:
                definitions = validate_definitions(json.loads(args.definitions_json.read_text("utf-8"))) if args.definitions_json else read_definitions(args.db_config)
                atomic_json(args.output_dir / "definitions.json", definitions)
            key = f"{day}_t12_{args.datasets}" + ("_" + "_".join(elements) if selected_elements is not None else "")
            signature = fingerprint({"files": found, "definitions": definitions,
                                     "processing_version": version, "target": target_identity, "elements": elements,
                                     "source": {k: config.get(k) for k in ("base_url", "url_templates")}})
            if (args.mode == "import" and not args.refresh_existing and state.get(key, {}).get("signature") == signature):
                batch["status"] = "already_applied"
                LOG.info("%s already applied", day)
                if args.latest:
                    break
                continue
            previous = state.get(key, {})
            refresh = args.refresh_existing or (args.latest and bool(previous) and previous.get("signature") != signature)
            paths = []
            for element in elements:
                LOG.info("%s downloading/validating %s", day, element)
                if args.regional_subset:
                    from automation.hws945.regional_subset import extract, RangeUnsupported
                    try:
                        paths.append(extract(source, day, element, directory, definitions, refresh=refresh))
                    except RangeUnsupported:
                        LOG.warning("%s %s requires full-file download", day, element)
                        paths.append(source.download(day, element, directory, refresh=refresh))
                else:
                    paths.append(source.download(day, element, directory, refresh=refresh))
            batch["sha256"] = {p.name: sha256(p) for p in paths}
            parsed, results = compute(paths, definitions)
            if args.latest and max(p.time_end for p in parsed).replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
                raise ValueError("Latest available batch has expired; refusing automatic publication")
            tag = args.datasets.replace(',', '_') + ("_" + "_".join(elements) if selected_elements is not None else "")
            sql_path = args.output_dir / f"hws945_{day:%Y%m%d}_t12_{tag}.sql"
            batch["row_counts"] = export_sql(sql_path, parsed, results, definitions, day, datasets, selected_elements)
            batch["processing_version"] = version
            batch["null_wave_height_rows"] = {
                table: sum(row.get("wave_height" if table == "site_forecasts_hourly" else "wave_height_avg") is None
                           for row in results[table]) for table in TABLES}
            batch["sql_file"] = str(sql_path.resolve())
            batch["sql_sha256"] = sha256(sql_path)
            batch["time_start"] = min(p.time_start for p in parsed).isoformat()
            batch["time_end"] = max(p.time_end for p in parsed).isoformat()
            report["sql_files"].append(str(sql_path.resolve()))
            if args.mode == "import":
                apply_sql(sql_path, args.db_config)
                report["database_writes"] = True
                state[key] = {"signature": signature, "sql_sha256": batch["sql_sha256"],
                              "applied_at": datetime.now(CHINA).isoformat()}
                atomic_json(state_path, state)
                batch["status"] = "applied"
            else:
                batch["status"] = "exported"
            LOG.info("%s %s: %s", day, batch["status"], batch["row_counts"])
            if args.latest:
                break
        except Exception as exc:
            # Never print exception text from libpq/HTTP clients: it may contain credentials/URLs.
            batch["status"] = "failed"
            batch["error_type"] = type(exc).__name__
            if isinstance(exc, ValueError):
                batch["reason"] = str(exc)
            failures += 1
            LOG.error("%s failed (%s)", day, type(exc).__name__)
        finally:
            atomic_json(args.output_dir / "report.json", report)
    if report["sql_files"] and args.mode == "export":
        combined = args.output_dir / "all_batches.sql"
        part = combined.with_suffix(".sql.part")
        with part.open("w", encoding="utf-8", newline="\n") as out:
            out.write("-- Generated real batches only. Each batch has its own transaction.\n")
            for name in report["sql_files"]:
                out.write(Path(name).read_text("utf-8") + "\n")
        os.replace(part, combined)
        report["combined_sql"] = str(combined.resolve())
    report["complete_count"] = sum(b["status"] in ("available", "exported", "applied", "already_applied") for b in report["batches"])
    report["missing_or_failed_count"] = sum(b["status"] in ("incomplete", "failed") for b in report["batches"])
    atomic_json(args.output_dir / "report.json", report)
    if args.latest and report["complete_count"]:
        return 0
    return 2 if failures or not report["complete_count"] else 0


def main(argv=None):
    args = parser().parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    try:
        with ExitStack() as locks:
            locks.enter_context(process_lock(args.output_dir / ".hws945.lock"))
            if not args.probe_only and args.raw_dir.resolve() != args.output_dir.resolve():
                locks.enter_context(process_lock(args.raw_dir / ".hws945.lock"))
            return run(args)
    except Exception as exc:
        LOG.error("HWS945 pipeline stopped (%s)", type(exc).__name__)
        if isinstance(exc, ValueError):
            LOG.error("%s", exc)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
