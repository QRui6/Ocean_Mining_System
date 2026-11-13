#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Import downloaded Copernicus Marine monthly surface current NetCDF files into
independent historical current tables.
"""

from __future__ import annotations

import argparse
import os
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Iterable

import numpy as np
import psycopg2
from psycopg2.extras import Json
import xarray as xr


PROJECT_ROOT = Path(__file__).resolve().parents[2]
RAW_ROOT = PROJECT_ROOT / "data" / "historical_current" / "raw"
DATASET_CODE = "copernicus_monthly_current"
DATASET_NAME = "Copernicus Marine monthly mean surface current"
PRODUCT_ID = "GLOBAL_MULTIYEAR_PHY_001_030"
DATASET_ID = "cmems_mod_glo_phy_my_0.083deg_P1M-m"
DATA_FORMAT = "netcdf"
VARIABLES = ["uo", "vo"]
TIME_ZONE = "UTC"
FREQUENCY_NOTE = "Monthly mean reanalysis"
SOURCE_NOTE = "Independent historical monthly current module; not linked to forecast tables"


@dataclass
class MonthlyCurrentRecord:
    year: int
    month: int
    month_label: str
    month_start: date
    data_time: object | None
    depth_m: float | None
    u_component: bytes
    v_component: bytes
    u_min: float
    u_max: float
    v_min: float
    v_max: float
    data_size: int
    grid_width: int
    grid_height: int
    lon_min: float
    lon_max: float
    lat_min: float
    lat_max: float
    lon_step: float | None
    lat_step: float | None
    source_file_name: str
    source_file_path: str
    source_file_size_bytes: int


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, required=True)
    parser.add_argument("--months", default=None)
    parser.add_argument("--db-host", default=os.getenv("DB_HOST", "localhost"))
    parser.add_argument("--db-port", type=int, default=int(os.getenv("DB_PORT", "5432")))
    parser.add_argument("--db-name", default=os.getenv("DB_NAME", "ship_monitoring"))
    parser.add_argument("--db-user", default=os.getenv("DB_USER", "postgres"))
    parser.add_argument("--db-password", default=os.getenv("DB_PASSWORD", "030525"))
    parser.add_argument("--raw-root", default=str(RAW_ROOT))
    return parser.parse_args()


def parse_months(value: str | None) -> list[str] | None:
    if value is None:
        return None
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


def iter_year_files(raw_root: Path, year: int, months: list[str] | None = None) -> Iterable[Path]:
    year_dir = raw_root / str(year)
    if not year_dir.exists():
        raise FileNotFoundError(f"Year directory not found: {year_dir}")
    if months is None:
        return sorted(year_dir.glob(f"copernicus_monthly_current_{year}_*.nc"))
    return [year_dir / f"copernicus_monthly_current_{year}_{month}.nc" for month in months]


def to_python_datetime(value):
    if value is None:
        return None
    if hasattr(value, "values"):
        value = value.values
    if isinstance(value, np.ndarray):
        if value.size == 0:
            return None
        if value.size == 1:
            return to_python_datetime(value.reshape(-1)[0])
    if isinstance(value, np.datetime64):
        return value.astype("datetime64[us]").tolist()
    try:
        item = value.item()
        if isinstance(item, np.datetime64):
            return item.astype("datetime64[us]").tolist()
        if hasattr(item, "to_pydatetime"):
            return item.to_pydatetime()
        return item
    except AttributeError:
        pass
    if hasattr(value, "to_pydatetime"):
        return value.to_pydatetime()
    return value


def parse_month_file(path: Path) -> MonthlyCurrentRecord:
    path = path.resolve()
    ds = xr.open_dataset(path, engine="h5netcdf")
    try:
        file_name = path.name
        year = int(file_name[27:31])
        month = int(file_name[32:34])
        month_label = f"{year}-{month:02d}"
        month_start = date(year, month, 1)

        u_values = np.asarray(ds["uo"].values, dtype=np.float32)[0, 0, :, :]
        v_values = np.asarray(ds["vo"].values, dtype=np.float32)[0, 0, :, :]
        lat_values = np.asarray(ds["latitude"].values, dtype=np.float64)
        lon_values = np.asarray(ds["longitude"].values, dtype=np.float64)
        depth_values = np.asarray(ds["depth"].values, dtype=np.float64)

        return MonthlyCurrentRecord(
            year=year,
            month=month,
            month_label=month_label,
            month_start=month_start,
            data_time=to_python_datetime(ds.coords.get("time")),
            depth_m=float(depth_values[0]) if depth_values.size > 0 else None,
            u_component=u_values.tobytes(),
            v_component=v_values.tobytes(),
            u_min=float(np.nanmin(u_values)),
            u_max=float(np.nanmax(u_values)),
            v_min=float(np.nanmin(v_values)),
            v_max=float(np.nanmax(v_values)),
            data_size=int(u_values.size),
            grid_width=int(u_values.shape[1]),
            grid_height=int(u_values.shape[0]),
            lon_min=float(np.nanmin(lon_values)),
            lon_max=float(np.nanmax(lon_values)),
            lat_min=float(np.nanmin(lat_values)),
            lat_max=float(np.nanmax(lat_values)),
            lon_step=float(lon_values[1] - lon_values[0]) if len(lon_values) > 1 else None,
            lat_step=float(abs(lat_values[1] - lat_values[0])) if len(lat_values) > 1 else None,
            source_file_name=file_name,
            source_file_path=str(path.relative_to(PROJECT_ROOT).as_posix()),
            source_file_size_bytes=path.stat().st_size,
        )
    finally:
        ds.close()


def ensure_schema(cur) -> None:
    cur.execute(
        """
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN ('historical_current_metadata', 'historical_current_monthly_data')
        GROUP BY table_schema
        HAVING COUNT(*) = 2
        """
    )
    if cur.fetchone() is None:
        raise RuntimeError(
            "Historical current tables are missing. Please run database_historical_current.sql first."
        )


def upsert_metadata(cur, record: MonthlyCurrentRecord) -> int:
    cur.execute(
        """
        INSERT INTO historical_current_metadata (
            dataset_code, dataset_name, product_id, dataset_id, data_format, variables,
            grid_width, grid_height, lon_min, lon_max, lat_min, lat_max,
            lon_step, lat_step, depth_m, time_zone, frequency_note, source_note
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (dataset_code)
        DO UPDATE SET
            dataset_name = EXCLUDED.dataset_name,
            product_id = EXCLUDED.product_id,
            dataset_id = EXCLUDED.dataset_id,
            data_format = EXCLUDED.data_format,
            variables = EXCLUDED.variables,
            grid_width = EXCLUDED.grid_width,
            grid_height = EXCLUDED.grid_height,
            lon_min = EXCLUDED.lon_min,
            lon_max = EXCLUDED.lon_max,
            lat_min = EXCLUDED.lat_min,
            lat_max = EXCLUDED.lat_max,
            lon_step = EXCLUDED.lon_step,
            lat_step = EXCLUDED.lat_step,
            depth_m = EXCLUDED.depth_m,
            time_zone = EXCLUDED.time_zone,
            frequency_note = EXCLUDED.frequency_note,
            source_note = EXCLUDED.source_note,
            updated_at = CURRENT_TIMESTAMP
        RETURNING id
        """,
        (
            DATASET_CODE,
            DATASET_NAME,
            PRODUCT_ID,
            DATASET_ID,
            DATA_FORMAT,
            Json(VARIABLES),
            record.grid_width,
            record.grid_height,
            record.lon_min,
            record.lon_max,
            record.lat_min,
            record.lat_max,
            record.lon_step,
            record.lat_step,
            record.depth_m,
            TIME_ZONE,
            FREQUENCY_NOTE,
            SOURCE_NOTE,
        ),
    )
    return cur.fetchone()[0]


def upsert_month(cur, metadata_id: int, record: MonthlyCurrentRecord) -> None:
    cur.execute(
        """
        INSERT INTO historical_current_monthly_data (
            metadata_id, year, month, month_label, month_start, data_time, depth_m,
            u_component, v_component, u_min, u_max, v_min, v_max, data_size,
            source_file_name, source_file_path, source_file_size_bytes
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (metadata_id, year, month)
        DO UPDATE SET
            month_label = EXCLUDED.month_label,
            month_start = EXCLUDED.month_start,
            data_time = EXCLUDED.data_time,
            depth_m = EXCLUDED.depth_m,
            u_component = EXCLUDED.u_component,
            v_component = EXCLUDED.v_component,
            u_min = EXCLUDED.u_min,
            u_max = EXCLUDED.u_max,
            v_min = EXCLUDED.v_min,
            v_max = EXCLUDED.v_max,
            data_size = EXCLUDED.data_size,
            source_file_name = EXCLUDED.source_file_name,
            source_file_path = EXCLUDED.source_file_path,
            source_file_size_bytes = EXCLUDED.source_file_size_bytes,
            imported_at = CURRENT_TIMESTAMP
        """,
        (
            metadata_id,
            record.year,
            record.month,
            record.month_label,
            record.month_start,
            record.data_time,
            record.depth_m,
            psycopg2.Binary(record.u_component),
            psycopg2.Binary(record.v_component),
            record.u_min,
            record.u_max,
            record.v_min,
            record.v_max,
            record.data_size,
            record.source_file_name,
            record.source_file_path,
            record.source_file_size_bytes,
        ),
    )


def main() -> int:
    args = parse_args()
    months = parse_months(args.months)
    files = list(iter_year_files(Path(args.raw_root), args.year, months))
    missing = [str(path) for path in files if not path.exists()]
    if missing:
        raise RuntimeError(f"Missing monthly NetCDF files for {args.year}: {missing}")
    if not files:
        raise RuntimeError(f"No monthly NetCDF files found for {args.year}")
    records = [parse_month_file(path) for path in files]

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
            ensure_schema(cur)
            metadata_id = upsert_metadata(cur, records[0])
            for record in records:
                upsert_month(cur, metadata_id, record)
                print(f"imported {record.month_label} -> grid={record.grid_width}x{record.grid_height}, points={record.data_size}")
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    print(f"done: imported {len(records)} monthly current files for {args.year}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
