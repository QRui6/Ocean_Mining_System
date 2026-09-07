#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Register one downloaded wind/wave/current batch into weather_files and
weather_file_metadata.

What it does:
1. Finds one date directory under project-root/data/raw
2. Reads NetCDF metadata from each .nc file
3. Upserts raw file records into weather_files
4. Upserts extracted metadata into weather_file_metadata
"""

from __future__ import annotations

import argparse
import os
import re
import shutil
import tempfile
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Iterable

import psycopg2
from netCDF4 import Dataset, num2date


PROJECT_ROOT = Path(__file__).resolve().parents[2]
RAW_ROOT = PROJECT_ROOT / "data" / "raw"

FILENAME_RE = re.compile(r"^(?P<element>[a-z0-9]+)_(?P<base_date>\d{8})_(?P<run_cycle>t\d+)\.nc$")

ELEMENT_CONFIG = {
    "curu": {"data_type": "current", "dataset_kind": "global_current"},
    "curv": {"data_type": "current", "dataset_kind": "global_current"},
    "gust": {"data_type": "wind", "dataset_kind": "global_wind"},
    "wdir": {"data_type": "wind", "dataset_kind": "global_wind"},
    "wspd": {"data_type": "wind", "dataset_kind": "global_wind"},
    "dire": {"data_type": "wave", "dataset_kind": "global_wave"},
    "perd": {"data_type": "wave", "dataset_kind": "global_wave"},
    "sigh": {"data_type": "wave", "dataset_kind": "global_wave"},
}


@dataclass
class ParsedFile:
    path: Path
    relative_path: str
    file_name: str
    element_code: str
    data_type: str
    dataset_kind: str
    base_date: date
    run_cycle: str
    file_size_bytes: int
    downloaded_at: datetime
    variable_name: str
    units: str | None
    grid_width: int
    grid_height: int
    lon_min: float
    lon_max: float
    lat_min: float
    lat_max: float
    time_start: datetime | None
    time_end: datetime | None
    time_step_hours: int | None
    time_count: int


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--date",
        help="Target raw directory date in YYYY-MM-DD or YYYYMMDD format. Defaults to latest local batch.",
    )
    parser.add_argument("--db-host", default=os.getenv("DB_HOST", "localhost"))
    parser.add_argument("--db-port", type=int, default=int(os.getenv("DB_PORT", "5432")))
    parser.add_argument("--db-name", default=os.getenv("DB_NAME", "ship_monitoring"))
    parser.add_argument("--db-user", default=os.getenv("DB_USER", "postgres"))
    parser.add_argument("--db-password", default=os.getenv("DB_PASSWORD", "030525"))
    return parser.parse_args()


def resolve_batch_dir(raw_root: Path, date_arg: str | None) -> Path:
    if date_arg:
        normalized = date_arg.replace("-", "")
        if len(normalized) != 8 or not normalized.isdigit():
            raise ValueError("Date must be YYYY-MM-DD or YYYYMMDD")
        return raw_root / normalized[0:4] / normalized[4:6] / normalized[6:8]

    candidates = sorted(
        (path for path in raw_root.glob("*/*/*") if path.is_dir()),
        key=lambda path: path.as_posix(),
    )
    if not candidates:
        raise FileNotFoundError(f"No batch directories found under {raw_root}")
    return candidates[-1]


def find_data_variable(dataset: Dataset) -> str:
    candidates = [name for name in dataset.variables.keys() if name not in {"lon", "lat", "time", "depth"}]
    if len(candidates) != 1:
        raise ValueError(f"Expected exactly one data variable, got: {candidates}")
    return candidates[0]


def to_datetime(value) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if hasattr(value, "year"):
        return datetime(
            value.year,
            value.month,
            value.day,
            getattr(value, "hour", 0),
            getattr(value, "minute", 0),
            getattr(value, "second", 0),
        )
    return None


def convert_time_values(time_values, units: str, calendar: str):
    try:
        return num2date(
            time_values,
            units=units,
            calendar=calendar,
            only_use_cftime_datetimes=False,
            only_use_python_datetimes=True,
        )
    except Exception:
        match = re.match(r"^hours since (\d{8})$", units.strip())
        if not match:
            raise
        base = datetime.strptime(match.group(1), "%Y%m%d")
        return [base + timedelta(hours=float(value)) for value in time_values]


def parse_nc_file(path: Path) -> ParsedFile:
    match = FILENAME_RE.match(path.name)
    if not match:
        raise ValueError(f"Unexpected file name format: {path.name}")

    element_code = match.group("element")
    if element_code not in ELEMENT_CONFIG:
        raise ValueError(f"Unsupported element code: {element_code}")

    config = ELEMENT_CONFIG[element_code]
    base_date = datetime.strptime(match.group("base_date"), "%Y%m%d").date()
    run_cycle = match.group("run_cycle")

    with open_dataset_safe(path) as dataset:
        lon_var = dataset.variables["lon"]
        lat_var = dataset.variables["lat"]
        time_var = dataset.variables["time"]
        data_var_name = find_data_variable(dataset)
        data_var = dataset.variables[data_var_name]

        lon_values = lon_var[:]
        lat_values = lat_var[:]
        time_values = time_var[:]
        converted_times = convert_time_values(
            time_values,
            units=time_var.units,
            calendar=getattr(time_var, "calendar", "standard"),
        )

        time_start = to_datetime(converted_times[0]) if len(converted_times) > 0 else None
        time_end = to_datetime(converted_times[-1]) if len(converted_times) > 0 else None
        time_step_hours = None
        if len(time_values) >= 2:
            time_step_hours = int(round(float(time_values[1] - time_values[0])))

        return ParsedFile(
            path=path,
            relative_path=path.relative_to(PROJECT_ROOT).as_posix(),
            file_name=path.name,
            element_code=element_code,
            data_type=config["data_type"],
            dataset_kind=config["dataset_kind"],
            base_date=base_date,
            run_cycle=run_cycle,
            file_size_bytes=path.stat().st_size,
            downloaded_at=datetime.fromtimestamp(path.stat().st_mtime),
            variable_name=data_var_name,
            units=getattr(data_var, "units", None),
            grid_width=len(lon_values),
            grid_height=len(lat_values),
            lon_min=float(lon_values.min()),
            lon_max=float(lon_values.max()),
            lat_min=float(lat_values.min()),
            lat_max=float(lat_values.max()),
            time_start=time_start,
            time_end=time_end,
            time_step_hours=time_step_hours,
            time_count=len(time_values),
        )


class SafeDataset:
    def __init__(self, dataset: Dataset, temp_dir: tempfile.TemporaryDirectory[str] | None):
        self.dataset = dataset
        self.temp_dir = temp_dir

    def __enter__(self) -> Dataset:
        return self.dataset

    def __exit__(self, exc_type, exc, tb) -> None:
        self.dataset.close()
        if self.temp_dir is not None:
            self.temp_dir.cleanup()


def open_dataset_safe(path: Path) -> SafeDataset:
    try:
        return SafeDataset(Dataset(path), None)
    except OSError:
        temp_dir = tempfile.TemporaryDirectory(prefix="wind_wave_nc_")
        temp_path = Path(temp_dir.name) / path.name
        shutil.copy2(path, temp_path)
        return SafeDataset(Dataset(temp_path), temp_dir)


def iter_nc_files(batch_dir: Path) -> Iterable[Path]:
    return sorted(path for path in batch_dir.glob("*.nc") if path.is_file())


def upsert_weather_file(cur, parsed: ParsedFile) -> int:
    cur.execute(
        """
        INSERT INTO weather_files (
            file_name,
            data_type,
            element_code,
            base_date,
            run_cycle,
            storage_type,
            object_key,
            file_size_bytes,
            download_status,
            downloaded_at,
            is_latest
        )
        VALUES (%s, %s, %s, %s, %s, 'local', %s, %s, 'success', %s, TRUE)
        ON CONFLICT (data_type, element_code, base_date, run_cycle)
        DO UPDATE SET
            file_name = EXCLUDED.file_name,
            storage_type = EXCLUDED.storage_type,
            object_key = EXCLUDED.object_key,
            file_size_bytes = EXCLUDED.file_size_bytes,
            download_status = EXCLUDED.download_status,
            downloaded_at = EXCLUDED.downloaded_at,
            is_latest = TRUE
        RETURNING id
        """,
        (
            parsed.file_name,
            parsed.data_type,
            parsed.element_code,
            parsed.base_date,
            parsed.run_cycle,
            parsed.relative_path,
            parsed.file_size_bytes,
            parsed.downloaded_at,
        ),
    )
    file_id = cur.fetchone()[0]

    cur.execute(
        """
        UPDATE weather_files
        SET is_latest = FALSE
        WHERE data_type = %s
          AND element_code = %s
          AND id <> %s
        """,
        (parsed.data_type, parsed.element_code, file_id),
    )
    return file_id


def upsert_weather_file_metadata(cur, file_id: int, parsed: ParsedFile) -> None:
    cur.execute(
        """
        INSERT INTO weather_file_metadata (
            file_id,
            dataset_kind,
            variable_name,
            units,
            grid_width,
            grid_height,
            lon_min,
            lon_max,
            lat_min,
            lat_max,
            time_start,
            time_end,
            time_step_hours,
            time_count
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (file_id)
        DO UPDATE SET
            dataset_kind = EXCLUDED.dataset_kind,
            variable_name = EXCLUDED.variable_name,
            units = EXCLUDED.units,
            grid_width = EXCLUDED.grid_width,
            grid_height = EXCLUDED.grid_height,
            lon_min = EXCLUDED.lon_min,
            lon_max = EXCLUDED.lon_max,
            lat_min = EXCLUDED.lat_min,
            lat_max = EXCLUDED.lat_max,
            time_start = EXCLUDED.time_start,
            time_end = EXCLUDED.time_end,
            time_step_hours = EXCLUDED.time_step_hours,
            time_count = EXCLUDED.time_count
        """,
        (
            file_id,
            parsed.dataset_kind,
            parsed.variable_name,
            parsed.units,
            parsed.grid_width,
            parsed.grid_height,
            parsed.lon_min,
            parsed.lon_max,
            parsed.lat_min,
            parsed.lat_max,
            parsed.time_start,
            parsed.time_end,
            parsed.time_step_hours,
            parsed.time_count,
        ),
    )


def main() -> int:
    args = parse_args()
    batch_dir = resolve_batch_dir(RAW_ROOT, args.date)
    files = list(iter_nc_files(batch_dir))
    if not files:
        raise FileNotFoundError(f"No .nc files found in {batch_dir}")

    parsed_files = [parse_nc_file(path) for path in files]

    conn = psycopg2.connect(
        host=args.db_host,
        port=args.db_port,
        dbname=args.db_name,
        user=args.db_user,
        password=args.db_password,
    )
    conn.autocommit = False

    try:
        with conn.cursor() as cur:
            for parsed in parsed_files:
                file_id = upsert_weather_file(cur, parsed)
                upsert_weather_file_metadata(cur, file_id, parsed)
                print(
                    f"registered: {parsed.file_name} -> "
                    f"weather_files.id={file_id}, variable={parsed.variable_name}"
                )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    print(f"done: registered {len(parsed_files)} files from {batch_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
