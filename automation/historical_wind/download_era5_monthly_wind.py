#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Download ERA5 monthly wind fields one month at a time.

This script is intentionally independent from the existing forecast pipeline.
It downloads monthly averaged reanalysis wind data from CDS/Copernicus and
stores raw GRIB files under data/historical_wind/raw/YYYY/.

Default variables:
- 10m_u_component_of_wind
- 10m_v_component_of_wind
- instantaneous_10m_wind_gust

Usage examples:
    python automation/historical_wind/download_era5_monthly_wind.py --year 2000
    python automation/historical_wind/download_era5_monthly_wind.py --year 2000 --months 1,2,3
    python automation/historical_wind/download_era5_monthly_wind.py --year 2000 --overwrite

Prerequisites:
1. Install cdsapi: pip install cdsapi
2. Configure automation/historical_wind/cdsapi.local
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
RAW_ROOT = PROJECT_ROOT / "data" / "historical_wind" / "raw"
MANIFEST_ROOT = PROJECT_ROOT / "data" / "historical_wind" / "manifests"
DATASET = "reanalysis-era5-single-levels-monthly-means"
DEFAULT_VARIABLES = (
    "10m_u_component_of_wind",
    "10m_v_component_of_wind",
    "instantaneous_10m_wind_gust",
)
DEFAULT_TIME = "00:00"
DEFAULT_PRODUCT_TYPE = "monthly_averaged_reanalysis"
DEFAULT_DATA_FORMAT = "grib"
DEFAULT_DOWNLOAD_FORMAT = "unarchived"
DEFAULT_CDS_CONFIG = Path(__file__).resolve().parent / "cdsapi.local"


@dataclass
class DownloadRecord:
    year: int
    month: str
    path: str
    file_size_bytes: int
    downloaded_at: str
    dataset: str
    variables: list[str]
    product_type: str
    time: str
    data_format: str
    download_format: str


@dataclass
class CdsCredentials:
    url: str
    key: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, required=True, help="Target year, for example 2000")
    parser.add_argument(
        "--months",
        default="1-12",
        help="Months to download. Examples: 1-12, 1,2,3, 6-8,11,12",
    )
    parser.add_argument(
        "--output-root",
        default=str(RAW_ROOT),
        help="Root directory for downloaded GRIB files",
    )
    parser.add_argument(
        "--cds-config",
        default=str(DEFAULT_CDS_CONFIG),
        help="Path to project-local CDS config file",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Redownload even if the target file already exists",
    )
    parser.add_argument(
        "--retries",
        type=int,
        default=3,
        help="Number of retries per month when CDS download fails",
    )
    parser.add_argument(
        "--retry-wait-seconds",
        type=int,
        default=20,
        help="Base wait time before retrying a failed month download",
    )
    parser.add_argument(
        "--sleep-seconds",
        type=int,
        default=3,
        help="Wait time between successful monthly requests",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print requests without downloading files",
    )
    return parser.parse_args()


def ensure_cdsapi():
    try:
        import cdsapi  # type: ignore
    except ImportError as exc:
        raise SystemExit(
            "Missing dependency: cdsapi. Install it with `pip install cdsapi`, "
            "then configure automation/historical_wind/cdsapi.local before running this script."
        ) from exc
    return cdsapi


def load_cds_credentials(path: Path) -> CdsCredentials:
    if not path.exists():
        raise FileNotFoundError(
            f"CDS config file not found: {path}. "
            "Create it with two lines: `url: ...` and `key: ...`."
        )

    values: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if ":" not in line:
            raise ValueError(f"Invalid CDS config line: {raw_line}")
        key, value = line.split(":", 1)
        values[key.strip()] = value.strip()

    url = values.get("url")
    key = values.get("key")
    if not url or not key:
        raise ValueError(f"CDS config file must contain both `url` and `key`: {path}")

    return CdsCredentials(url=url, key=key)


def normalize_year(year: int) -> int:
    current_year = datetime.utcnow().year
    if year < 1940 or year > current_year:
        raise ValueError(f"year must be between 1940 and {current_year}")
    return year


def parse_months(value: str) -> list[str]:
    selected: set[int] = set()
    for part in value.split(","):
        item = part.strip()
        if not item:
            continue
        if "-" in item:
            start_text, end_text = item.split("-", 1)
            start = int(start_text)
            end = int(end_text)
            if start > end:
                raise ValueError(f"Invalid month range: {item}")
            selected.update(range(start, end + 1))
        else:
            selected.add(int(item))

    if not selected:
        raise ValueError("At least one month must be selected")

    invalid = [month for month in sorted(selected) if month < 1 or month > 12]
    if invalid:
        raise ValueError(f"Invalid months: {invalid}")

    return [f"{month:02d}" for month in sorted(selected)]


def build_request(year: int, month: str) -> dict[str, object]:
    return {
        "product_type": [DEFAULT_PRODUCT_TYPE],
        "variable": list(DEFAULT_VARIABLES),
        "year": [str(year)],
        "month": [month],
        "time": [DEFAULT_TIME],
        "data_format": DEFAULT_DATA_FORMAT,
        "download_format": DEFAULT_DOWNLOAD_FORMAT,
    }


def build_output_path(output_root: Path, year: int, month: str) -> Path:
    return output_root / str(year) / f"era5_monthly_wind_{year}_{month}.grib"


def should_skip(path: Path, overwrite: bool) -> bool:
    return not overwrite and path.exists() and path.stat().st_size > 1024


def log(message: str) -> None:
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{now}] {message}", flush=True)


def download_one_month(
    client,
    year: int,
    month: str,
    output_path: Path,
    retries: int,
    retry_wait_seconds: int,
    dry_run: bool,
) -> DownloadRecord | None:
    request = build_request(year, month)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if dry_run:
        log(f"dry-run month={month} request={json.dumps(request, ensure_ascii=False)}")
        return None

    attempt = 0
    while True:
        attempt += 1
        try:
            log(f"downloading year={year} month={month} -> {output_path}")
            client.retrieve(DATASET, request, str(output_path))
            if not output_path.exists() or output_path.stat().st_size <= 1024:
                raise RuntimeError(f"Downloaded file looks invalid: {output_path}")

            return DownloadRecord(
                year=year,
                month=month,
                path=str(output_path.relative_to(PROJECT_ROOT).as_posix()),
                file_size_bytes=output_path.stat().st_size,
                downloaded_at=datetime.now().isoformat(timespec="seconds"),
                dataset=DATASET,
                variables=list(DEFAULT_VARIABLES),
                product_type=DEFAULT_PRODUCT_TYPE,
                time=DEFAULT_TIME,
                data_format=DEFAULT_DATA_FORMAT,
                download_format=DEFAULT_DOWNLOAD_FORMAT,
            )
        except Exception as exc:  # pragma: no cover - depends on network/CDS state
            if attempt > retries:
                raise RuntimeError(
                    f"Failed to download year={year} month={month} after {retries} retries"
                ) from exc

            wait_seconds = retry_wait_seconds * attempt
            log(
                f"download failed for year={year} month={month}, "
                f"retry {attempt}/{retries} in {wait_seconds}s: {exc}"
            )
            time.sleep(wait_seconds)


def write_manifest(year: int, records: list[DownloadRecord]) -> Path:
    MANIFEST_ROOT.mkdir(parents=True, exist_ok=True)
    manifest_path = MANIFEST_ROOT / f"era5_monthly_wind_{year}.json"
    payload = {
        "year": year,
        "dataset": DATASET,
        "variables": list(DEFAULT_VARIABLES),
        "product_type": DEFAULT_PRODUCT_TYPE,
        "time": DEFAULT_TIME,
        "data_format": DEFAULT_DATA_FORMAT,
        "download_format": DEFAULT_DOWNLOAD_FORMAT,
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "records": [asdict(record) for record in records],
    }
    manifest_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return manifest_path


def main() -> int:
    args = parse_args()
    year = normalize_year(args.year)
    months = parse_months(args.months)
    output_root = Path(args.output_root)
    cds_config_path = Path(args.cds_config)

    client = None
    if not args.dry_run:
        cdsapi = ensure_cdsapi()
        credentials = load_cds_credentials(cds_config_path)
        client = cdsapi.Client(url=credentials.url, key=credentials.key, quiet=False)

    records: list[DownloadRecord] = []
    skipped = 0

    for month in months:
        output_path = build_output_path(output_root, year, month)
        if should_skip(output_path, args.overwrite):
            log(f"skip existing year={year} month={month}: {output_path}")
            skipped += 1
            continue

        record = download_one_month(
            client=client,
            year=year,
            month=month,
            output_path=output_path,
            retries=args.retries,
            retry_wait_seconds=args.retry_wait_seconds,
            dry_run=args.dry_run,
        )
        if record is not None:
            records.append(record)

        if not args.dry_run and args.sleep_seconds > 0:
            time.sleep(args.sleep_seconds)

    manifest_path = write_manifest(year, records)
    log(
        f"done year={year}, downloaded={len(records)}, skipped={skipped}, "
        f"manifest={manifest_path}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
