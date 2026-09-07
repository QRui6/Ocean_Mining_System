#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Download Copernicus Marine historical monthly surface current files one month at a time.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass
from datetime import date, datetime
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
RAW_ROOT = PROJECT_ROOT / "data" / "historical_current" / "raw"
MANIFEST_ROOT = PROJECT_ROOT / "data" / "historical_current" / "manifests"
LOCAL_CREDENTIALS = PROJECT_ROOT / "automation" / "current_surface" / "copernicusmarine.local.json"
PRODUCT_ID = "GLOBAL_MULTIYEAR_PHY_001_030"
DATASET_ID = "cmems_mod_glo_phy_my_0.083deg_P1M-m"
VARIABLES = ("uo", "vo")
SURFACE_MIN_DEPTH = 0
SURFACE_MAX_DEPTH = 1


@dataclass
class DownloadRecord:
    year: int
    month: str
    path: str
    file_size_bytes: int
    downloaded_at: str
    product_id: str
    dataset_id: str
    variables: list[str]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, required=True)
    parser.add_argument("--months", default="1-12")
    parser.add_argument("--output-root", default=str(RAW_ROOT))
    parser.add_argument("--username")
    parser.add_argument("--password")
    parser.add_argument("--overwrite", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--sleep-seconds", type=int, default=0)
    return parser.parse_args()


def parse_months(value: str) -> list[str]:
    selected: set[int] = set()
    for part in value.split(","):
        item = part.strip()
        if not item:
            continue
        if "-" in item:
            start_text, end_text = item.split("-", 1)
            selected.update(range(int(start_text), int(end_text) + 1))
        else:
            selected.add(int(item))
    if not selected:
        raise ValueError("At least one month must be selected")
    invalid = [month for month in sorted(selected) if month < 1 or month > 12]
    if invalid:
        raise ValueError(f"Invalid months: {invalid}")
    return [f"{month:02d}" for month in sorted(selected)]


def ensure_client():
    try:
        import copernicusmarine  # type: ignore
    except ImportError as exc:  # pragma: no cover
        raise SystemExit("Missing dependency: copernicusmarine.") from exc
    return copernicusmarine


def load_credentials(args: argparse.Namespace) -> tuple[str, str]:
    username = args.username
    password = args.password
    if LOCAL_CREDENTIALS.exists():
        payload = json.loads(LOCAL_CREDENTIALS.read_text(encoding="utf-8"))
        username = username or payload.get("username")
        password = password or payload.get("password")
    if not username or not password:
        raise ValueError("Missing Copernicus Marine credentials.")
    return username, password


def build_output_path(output_root: Path, year: int, month: str) -> Path:
    return output_root / str(year) / f"copernicus_monthly_current_{year}_{month}.nc"


def should_skip(path: Path, overwrite: bool) -> bool:
    return not overwrite and path.exists() and path.stat().st_size > 1024


def month_window(year: int, month: int) -> tuple[str, str]:
    month_start = date(year, month, 1)
    if month == 12:
        next_month = date(year + 1, 1, 1)
    else:
        next_month = date(year, month + 1, 1)
    month_end = next_month.fromordinal(next_month.toordinal() - 1)
    return (
        f"{month_start.isoformat()}T00:00:00",
        f"{month_end.isoformat()}T23:59:59",
    )


def download_one_month(client, username: str, password: str, year: int, month: str, output_path: Path, dry_run: bool):
    start_datetime, end_datetime = month_window(year, int(month))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if dry_run:
        print(json.dumps({
            "datasetId": DATASET_ID,
            "year": year,
            "month": month,
            "start": start_datetime,
            "end": end_datetime,
            "path": str(output_path),
        }, ensure_ascii=False, indent=2))
        return None

    client.subset(
        dataset_id=DATASET_ID,
        username=username,
        password=password,
        variables=list(VARIABLES),
        start_datetime=start_datetime,
        end_datetime=end_datetime,
        minimum_depth=SURFACE_MIN_DEPTH,
        maximum_depth=SURFACE_MAX_DEPTH,
        output_filename=output_path.name,
        output_directory=str(output_path.parent),
        overwrite=True,
        disable_progress_bar=False,
        file_format="netcdf",
    )
    return DownloadRecord(
        year=year,
        month=month,
        path=str(output_path.relative_to(PROJECT_ROOT).as_posix()),
        file_size_bytes=output_path.stat().st_size,
        downloaded_at=datetime.now().isoformat(timespec="seconds"),
        product_id=PRODUCT_ID,
        dataset_id=DATASET_ID,
        variables=list(VARIABLES),
    )


def write_manifest(year: int, records: list[DownloadRecord]) -> Path:
    MANIFEST_ROOT.mkdir(parents=True, exist_ok=True)
    manifest_path = MANIFEST_ROOT / f"copernicus_monthly_current_{year}.json"
    payload = {
        "year": year,
        "product_id": PRODUCT_ID,
        "dataset_id": DATASET_ID,
        "variables": list(VARIABLES),
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "records": [asdict(record) for record in records],
    }
    manifest_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return manifest_path


def main() -> int:
    args = parse_args()
    months = parse_months(args.months)
    output_root = Path(args.output_root)
    client = ensure_client()
    username, password = ("", "")
    if not args.dry_run:
        username, password = load_credentials(args)

    records: list[DownloadRecord] = []
    skipped = 0
    for month in months:
        output_path = build_output_path(output_root, args.year, month)
        if should_skip(output_path, args.overwrite):
            print(f"skip existing year={args.year} month={month}: {output_path}", flush=True)
            skipped += 1
            continue
        record = download_one_month(client, username, password, args.year, month, output_path, args.dry_run)
        if record is not None:
            records.append(record)
        if not args.dry_run and args.sleep_seconds > 0:
            import time
            time.sleep(args.sleep_seconds)

    manifest_path = write_manifest(args.year, records)
    print(f"done year={args.year}, downloaded={len(records)}, skipped={skipped}, manifest={manifest_path}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
