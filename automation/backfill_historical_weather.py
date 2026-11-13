#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Batch backfill historical monthly wind, wave, and current datasets.

This driver is resumable:
- existing raw files are skipped by the downloaders
- imports use UPSERT logic

Current default plan uses the latest month actually available from each source:
- wind:   2002-2025 full years, 2026 months 1-5
- wave:   2001-2025 full years, 2026 months 1-5
- current:2001-2025 full years, 2026 months 1-4
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--db-host", default="121.194.93.61")
    parser.add_argument("--db-port", default="5432")
    parser.add_argument("--db-name", default="ship_monitoring")
    parser.add_argument("--db-user", default="postgres")
    parser.add_argument("--db-password", default="jcf0326_103")
    parser.add_argument(
        "--datasets",
        default="wind,wave,current",
        help="Comma-separated datasets to process: wind,wave,current",
    )
    parser.add_argument("--wind-start-year", type=int, default=2002)
    parser.add_argument("--wave-start-year", type=int, default=2001)
    parser.add_argument("--current-start-year", type=int, default=2001)
    parser.add_argument("--download-only", action="store_true")
    parser.add_argument("--import-only", action="store_true")
    parser.add_argument(
        "--continue-on-error",
        action="store_true",
        default=True,
        help="Continue with later years when one year fails.",
    )
    return parser.parse_args()


def run_command(args: list[str]) -> None:
    print(f"\n>>> {' '.join(args)}", flush=True)
    subprocess.run(args, cwd=PROJECT_ROOT, check=True)


def process_year(
    download_script: str,
    import_script: str,
    year: int,
    months: str,
    args: argparse.Namespace,
) -> None:
    if not args.import_only:
        run_command(
            [
                sys.executable,
                download_script,
                "--year",
                str(year),
                "--months",
                months,
                "--sleep-seconds",
                "0",
            ]
        )

    if not args.download_only:
        run_command(
            [
                sys.executable,
                import_script,
                "--year",
                str(year),
                "--months",
                months,
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


def process_month(
    download_script: str,
    import_script: str,
    year: int,
    month: int,
    args: argparse.Namespace,
) -> None:
    process_year(
        download_script=download_script,
        import_script=import_script,
        year=year,
        months=str(month),
        args=args,
    )


def main() -> int:
    args = parse_args()
    if args.download_only and args.import_only:
        raise ValueError("--download-only and --import-only cannot be used together")

    datasets = {item.strip() for item in args.datasets.split(",") if item.strip()}
    failures: list[str] = []

    def run_year(download_script: str, import_script: str, year: int, months: str) -> None:
        label = f"{Path(download_script).parent.name}:{year}:{months}"
        try:
            process_year(download_script, import_script, year, months, args)
        except Exception as exc:
            message = f"{label} failed: {exc}"
            print(f"\n!!! {message}", flush=True)
            failures.append(message)
            if not args.continue_on_error:
                raise

    def run_month(download_script: str, import_script: str, year: int, month: int) -> None:
        label = f"{Path(download_script).parent.name}:{year}:{month:02d}"
        try:
            process_month(download_script, import_script, year, month, args)
        except Exception as exc:
            message = f"{label} failed: {exc}"
            print(f"\n!!! {message}", flush=True)
            failures.append(message)
            if not args.continue_on_error:
                raise

    if "wind" in datasets:
        for year in range(args.wind_start_year, 2026):
            run_year(
                "automation/historical_wind/download_era5_monthly_wind.py",
                "automation/historical_wind/import_era5_monthly_wind_to_db.py",
                year,
                "1-12",
            )
        run_year(
            "automation/historical_wind/download_era5_monthly_wind.py",
            "automation/historical_wind/import_era5_monthly_wind_to_db.py",
            2026,
            "1-5",
        )

    if "wave" in datasets:
        for year in range(args.wave_start_year, 2026):
            for month in range(1, 13):
                run_month(
                    "automation/historical_wave/download_era5_monthly_wave.py",
                    "automation/historical_wave/import_era5_monthly_wave_to_db.py",
                    year,
                    month,
                )
        for month in range(1, 6):
            run_month(
                "automation/historical_wave/download_era5_monthly_wave.py",
                "automation/historical_wave/import_era5_monthly_wave_to_db.py",
                2026,
                month,
            )

    if "current" in datasets:
        for year in range(args.current_start_year, 2026):
            run_year(
                "automation/historical_current/download_copernicus_monthly_current.py",
                "automation/historical_current/import_copernicus_monthly_current_to_db.py",
                year,
                "1-12",
            )
        run_year(
            "automation/historical_current/download_copernicus_monthly_current.py",
            "automation/historical_current/import_copernicus_monthly_current_to_db.py",
            2026,
            "1-4",
        )

    if failures:
        print("\nBackfill completed with failures:", flush=True)
        for failure in failures:
            print(f"- {failure}", flush=True)
        return 1

    print("\nAll requested historical backfill tasks completed.", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
