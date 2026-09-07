#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Run the full wind/wave forecast pipeline for one batch.

Pipeline:
1. Download the latest or requested wind/wave files
2. Register the raw batch into weather_files and weather_file_metadata
3. Process the batch into region/site hourly and daily forecast tables
4. Optionally delete the raw batch files after a successful run

This script is intended to be called manually.
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from automation.wind_wave.download_daily_wind_wave import RAW_DIR, download_batch, normalize_date_arg


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--date",
        help="Target batch date in YYYY-MM-DD or YYYYMMDD format. Defaults to the latest available date.",
    )
    parser.add_argument(
        "--run-cycle",
        default=os.getenv("RUN_CYCLE", "t12"),
        help="Forecast run cycle. Defaults to t12.",
    )
    parser.add_argument("--db-host", default=os.getenv("DB_HOST", "localhost"))
    parser.add_argument("--db-port", type=int, default=int(os.getenv("DB_PORT", "5432")))
    parser.add_argument("--db-name", default=os.getenv("DB_NAME", "ship_monitoring"))
    parser.add_argument("--db-user", default=os.getenv("DB_USER", "postgres"))
    parser.add_argument("--db-password", default=os.getenv("DB_PASSWORD", "030525"))
    parser.add_argument(
        "--cleanup-raw",
        action="store_true",
        help="Delete the downloaded raw batch directory after a successful register+process run.",
    )
    return parser.parse_args()


def log(message: str) -> None:
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{now}] {message}", flush=True)


def batch_dir_for(date_yyyymmdd: str) -> Path:
    return RAW_DIR / date_yyyymmdd[0:4] / date_yyyymmdd[4:6] / date_yyyymmdd[6:8]


def run_command(command: list[str]) -> None:
    safe_command = command[:]
    if "--db-password" in safe_command:
        password_index = safe_command.index("--db-password") + 1
        if password_index < len(safe_command):
            safe_command[password_index] = "******"
    log("running: " + " ".join(safe_command))
    subprocess.run(command, check=True, cwd=PROJECT_ROOT)


def build_db_args(args: argparse.Namespace) -> list[str]:
    return [
        "--db-host",
        args.db_host,
        "--db-port",
        str(args.db_port),
        "--db-name",
        args.db_name,
        "--db-user",
        args.db_user,
        "--db-password",
        args.db_password,
    ]


def main() -> int:
    args = parse_args()
    requested_date = normalize_date_arg(args.date)

    log("step 1/3: downloading wind/wave batch")
    batch_date, paths = download_batch(requested_date)
    if not paths:
        raise RuntimeError("No files were downloaded or resolved for this batch")
    log(f"downloaded batch_date={batch_date}, file_count={len(paths)}")

    db_args = build_db_args(args)

    log("step 2/3: registering raw batch into weather_files and weather_file_metadata")
    run_command(
        [
            sys.executable,
            str(PROJECT_ROOT / "automation" / "wind_wave" / "register_weather_batch.py"),
            "--date",
            batch_date,
            *db_args,
        ]
    )

    log("step 3/3: processing batch into overview forecast tables")
    run_command(
        [
            sys.executable,
            str(PROJECT_ROOT / "automation" / "mining_overview" / "process_forecasts_batch.py"),
            "--date",
            batch_date,
            "--run-cycle",
            args.run_cycle,
            *db_args,
        ]
    )

    if args.cleanup_raw:
        raw_batch_dir = batch_dir_for(batch_date)
        if raw_batch_dir.exists():
            shutil.rmtree(raw_batch_dir)
            log(f"deleted raw batch directory: {raw_batch_dir}")

    log(f"pipeline completed successfully for batch_date={batch_date}, run_cycle={args.run_cycle}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
