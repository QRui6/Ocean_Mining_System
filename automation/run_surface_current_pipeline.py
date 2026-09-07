#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Run the full surface-current pipeline for one batch.

Pipeline:
1. Download and normalize one Copernicus Marine surface-current batch
2. Register normalized curu/curv files into weather_files/weather_file_metadata
3. Process current-only region/site forecast tables
"""

from __future__ import annotations

import argparse
import os
import psycopg2
import subprocess
import sys
from datetime import date, datetime
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", help="Batch base date in YYYY-MM-DD or YYYYMMDD. Defaults to latest wind/wave batch date in weather_files.")
    parser.add_argument("--run-cycle", help="Batch run cycle. Defaults to latest wind/wave batch run cycle in weather_files.")
    parser.add_argument("--days", type=int, help="Forecast days to keep. Defaults to the matched wind/wave batch horizon.")
    parser.add_argument("--step-hours", type=int, default=3)
    parser.add_argument("--username", default=os.getenv("COPERNICUSMARINE_USERNAME"))
    parser.add_argument("--password", default=os.getenv("COPERNICUSMARINE_PASSWORD"))
    parser.add_argument("--source-file", help="Use an existing local source NetCDF instead of downloading.")
    parser.add_argument("--overwrite", action="store_true")
    parser.add_argument("--db-host", default=os.getenv("DB_HOST", "localhost"))
    parser.add_argument("--db-port", type=int, default=int(os.getenv("DB_PORT", "5432")))
    parser.add_argument("--db-name", default=os.getenv("DB_NAME", "ship_monitoring"))
    parser.add_argument("--db-user", default=os.getenv("DB_USER", "postgres"))
    parser.add_argument("--db-password", default=os.getenv("DB_PASSWORD", "030525"))
    return parser.parse_args()


def log(message: str) -> None:
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}", flush=True)


def run_command(command: list[str]) -> None:
    safe_command = command[:]
    if "--db-password" in safe_command:
        safe_command[safe_command.index("--db-password") + 1] = "******"
    if "--password" in safe_command:
        safe_command[safe_command.index("--password") + 1] = "******"
    log("running: " + " ".join(safe_command))
    subprocess.run(command, check=True, cwd=PROJECT_ROOT)


def normalize_date_arg(date_arg: str | None) -> str | None:
    if not date_arg:
        return None
    normalized = date_arg.replace("-", "")
    if len(normalized) != 8 or not normalized.isdigit():
        raise ValueError("Date must be YYYY-MM-DD or YYYYMMDD")
    return normalized


def resolve_reference_wind_wave_batch(
    args: argparse.Namespace,
    batch_date: date | None,
    run_cycle: str | None,
) -> tuple[date, str, int]:
    conn = psycopg2.connect(
        host=args.db_host,
        port=args.db_port,
        dbname=args.db_name,
        user=args.db_user,
        password=args.db_password,
    )
    try:
        with conn.cursor() as cur:
            if batch_date is None or not run_cycle:
                cur.execute(
                    """
                    SELECT base_date, run_cycle
                    FROM weather_files
                    WHERE download_status = 'success'
                      AND data_type IN ('wind', 'wave')
                    ORDER BY base_date DESC, run_cycle DESC
                    LIMIT 1
                    """
                )
                row = cur.fetchone()
                if row is None:
                    raise RuntimeError("No successful wind/wave batch found in weather_files")
                batch_date = batch_date or row[0]
                run_cycle = run_cycle or row[1]

            cur.execute(
                """
                SELECT MAX(forecast_date)
                FROM region_forecasts_daily
                WHERE base_date = %s
                  AND run_cycle = %s
                """,
                (batch_date, run_cycle),
            )
            row = cur.fetchone()
            max_forecast_date = row[0]
            if max_forecast_date is None:
                raise RuntimeError(f"No processed region_forecasts_daily rows found for wind/wave batch {batch_date} {run_cycle}")
            days = (max_forecast_date - batch_date).days + 1
            if days <= 0:
                raise RuntimeError(f"Invalid wind/wave horizon for batch {batch_date} {run_cycle}: days={days}")
            return batch_date, run_cycle, days
    finally:
        conn.close()


def main() -> int:
    args = parse_args()
    batch_date = normalize_date_arg(args.date)
    run_cycle = args.run_cycle
    resolved_date = datetime.strptime(batch_date, "%Y%m%d").date() if batch_date else None
    reference_date, reference_run_cycle, reference_days = resolve_reference_wind_wave_batch(
        args,
        resolved_date,
        run_cycle,
    )
    if batch_date is None:
        batch_date = reference_date.strftime("%Y%m%d")
    if not run_cycle:
        run_cycle = reference_run_cycle
    days = args.days if args.days is not None else reference_days
    log(
        "resolved current target from wind/wave batch: "
        f"date={batch_date}, run_cycle={run_cycle}, days={days}"
    )

    log("step 1/3: downloading and normalizing surface current batch")
    command = [
        sys.executable,
        str(PROJECT_ROOT / "automation" / "current_surface" / "download_surface_current.py"),
        "--run-cycle",
        run_cycle,
        "--days",
        str(days),
        "--step-hours",
        str(args.step_hours),
    ]
    if batch_date:
        command.extend(["--date", batch_date])
    if args.username:
        command.extend(["--username", args.username])
    if args.password:
        command.extend(["--password", args.password])
    if args.source_file:
        command.extend(["--source-file", args.source_file])
    if args.overwrite:
        command.append("--overwrite")
    run_command(command)

    resolved_batch_date = batch_date or datetime.utcnow().strftime("%Y%m%d")

    log("step 2/3: registering normalized current files")
    run_command(
        [
            sys.executable,
            str(PROJECT_ROOT / "automation" / "wind_wave" / "register_weather_batch.py"),
            "--date",
            resolved_batch_date,
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
    )

    log("step 3/3: processing current-only forecast tables")
    run_command(
        [
            sys.executable,
            str(PROJECT_ROOT / "automation" / "mining_overview" / "process_forecasts_batch.py"),
            "--date",
            resolved_batch_date,
            "--run-cycle",
            run_cycle,
            "--data-types",
            "current",
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
    )

    log(f"surface current pipeline completed successfully for batch_date={resolved_batch_date}, run_cycle={run_cycle}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
