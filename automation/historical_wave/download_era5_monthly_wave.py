#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Download ERA5 monthly wave fields one month at a time.

This module mirrors the historical wind downloader but stores independent
monthly wave files under data/historical_wave/raw/YYYY/.
"""

from __future__ import annotations

import argparse
import json
import time
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
RAW_ROOT = PROJECT_ROOT / "data" / "historical_wave" / "raw"
MANIFEST_ROOT = PROJECT_ROOT / "data" / "historical_wave" / "manifests"
DATASET = "reanalysis-era5-single-levels-monthly-means"
DEFAULT_VARIABLES = (
    "significant_height_of_combined_wind_waves_and_swell",
    "mean_wave_period",
    "mean_wave_direction",
)
DEFAULT_TIME = "00:00"
DEFAULT_PRODUCT_TYPE = "monthly_averaged_reanalysis"
DEFAULT_DATA_FORMAT = "grib"
DEFAULT_DOWNLOAD_FORMAT = "unarchived"
DEFAULT_CDS_CONFIG = PROJECT_ROOT / "automation" / "historical_wind" / "cdsapi.local"


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


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, required=True)
    parser.add_argument("--months", default="1-12")
    parser.add_argument("--output-root", default=str(RAW_ROOT))
    parser.add_argument("--cds-config", default=str(DEFAULT_CDS_CONFIG))
    parser.add_argument("--overwrite", action="store_true")
    parser.add_argument("--retries", type=int, default=3)
    parser.add_argument("--retry-wait-seconds", type=int, default=20)
    parser.add_argument("--sleep-seconds", type=int, default=3)
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def ensure_cdsapi():
    try:
        import cdsapi  # type: ignore
    except ImportError as exc:  # pragma: no cover
        raise SystemExit("Missing dependency: cdsapi. Install with `pip install cdsapi`.") from exc
    return cdsapi


def load_cds_credentials(path: Path) -> tuple[str, str]:
    if not path.exists():
        raise FileNotFoundError(f"CDS config file not found: {path}")
    values: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        key, value = line.split(":", 1)
        values[key.strip()] = value.strip()
    return values["url"], values["key"]


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
    return output_root / str(year) / f"era5_monthly_wave_{year}_{month}.grib"


def should_skip(path: Path, overwrite: bool) -> bool:
    return not overwrite and path.exists() and path.stat().st_size > 1024


def log(message: str) -> None:
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}", flush=True)


def download_one_month(client, year: int, month: str, output_path: Path, retries: int, retry_wait_seconds: int, dry_run: bool):
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
        except Exception as exc:  # pragma: no cover
            if attempt > retries:
                raise RuntimeError(f"Failed to download year={year} month={month} after {retries} retries") from exc
            wait_seconds = retry_wait_seconds * attempt
            log(f"download failed for year={year} month={month}, retry {attempt}/{retries} in {wait_seconds}s: {exc}")
            time.sleep(wait_seconds)


def write_manifest(year: int, records: list[DownloadRecord]) -> Path:
    MANIFEST_ROOT.mkdir(parents=True, exist_ok=True)
    manifest_path = MANIFEST_ROOT / f"era5_monthly_wave_{year}.json"
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
    months = parse_months(args.months)
    output_root = Path(args.output_root)
    client = None
    if not args.dry_run:
        cdsapi = ensure_cdsapi()
        url, key = load_cds_credentials(Path(args.cds_config))
        client = cdsapi.Client(url=url, key=key, quiet=False)

    records: list[DownloadRecord] = []
    skipped = 0
    for month in months:
        output_path = build_output_path(output_root, args.year, month)
        if should_skip(output_path, args.overwrite):
            log(f"skip existing year={args.year} month={month}: {output_path}")
            skipped += 1
            continue
        record = download_one_month(client, args.year, month, output_path, args.retries, args.retry_wait_seconds, args.dry_run)
        if record is not None:
            records.append(record)
        if not args.dry_run and args.sleep_seconds > 0:
            time.sleep(args.sleep_seconds)

    manifest_path = write_manifest(args.year, records)
    log(f"done year={args.year}, downloaded={len(records)}, skipped={skipped}, manifest={manifest_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
