#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Import downloaded ERA5 monthly wind GRIB files into the independent historical
wind database tables.

This importer stores one row per year-month with raw Float32 grid bytes for:
- u10
- v10
- i10fg
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


PROJECT_ROOT = Path(__file__).resolve().parents[2]
RAW_ROOT = PROJECT_ROOT / "data" / "historical_wind" / "raw"
DATASET_CODE = "era5_monthly_wind"
DATASET_NAME = "ERA5 monthly averaged reanalysis wind fields"
PRODUCT_TYPE = "monthly_averaged_reanalysis"
DATA_FORMAT = "grib"
VARIABLES = ["10m_u_component_of_wind", "10m_v_component_of_wind", "instantaneous_10m_wind_gust"]
TIME_ZONE = "UTC"
FREQUENCY_NOTE = "Monthly averaged reanalysis, time=00:00"
SOURCE_NOTE = "Independent historical monthly wind module; not linked to forecast tables"


@dataclass
class MonthlyWindRecord:
    year: int
    month: int
    month_label: str
    month_start: date
    u_time: object | None
    u_valid_time: object | None
    gust_time: object | None
    gust_step_hours: float | None
    gust_valid_time: object | None
    u_component: bytes
    v_component: bytes
    gust_component: bytes
    u_min: float
    u_max: float
    v_min: float
    v_max: float
    gust_min: float
    gust_max: float
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
    parser.add_argument("--year", type=int, required=True, help="Target year to import")
    parser.add_argument(
        "--months",
        default=None,
        help="Optional months to import. Examples: 1-12, 1,2,3, 6-8,11,12",
    )
    parser.add_argument("--db-host", default=os.getenv("DB_HOST", "localhost"))
    parser.add_argument("--db-port", type=int, default=int(os.getenv("DB_PORT", "5432")))
    parser.add_argument("--db-name", default=os.getenv("DB_NAME", "ship_monitoring"))
    parser.add_argument("--db-user", default=os.getenv("DB_USER", "postgres"))
    parser.add_argument("--db-password", default=os.getenv("DB_PASSWORD", "030525"))
    parser.add_argument(
        "--raw-root",
        default=str(RAW_ROOT),
        help="Root directory where monthly GRIB files are stored",
    )
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


def ensure_grib_stack():
    try:
        import cfgrib  # noqa: F401
        import xarray as xr  # type: ignore
    except ImportError as exc:
        raise SystemExit(
            "Missing GRIB dependencies. Install `cfgrib` and `eccodes` before running this importer."
        ) from exc
    return xr


def iter_year_files(raw_root: Path, year: int, months: list[str] | None = None) -> Iterable[Path]:
    year_dir = raw_root / str(year)
    if not year_dir.exists():
        raise FileNotFoundError(f"Year directory not found: {year_dir}")
    if months is None:
        return sorted(year_dir.glob(f"era5_monthly_wind_{year}_*.grib"))
    return [year_dir / f"era5_monthly_wind_{year}_{month}.grib" for month in months]


def open_month_datasets(xr, path: Path):
    datasets = xr.backends.api.open_dataset  # touch xarray import for type checkers
    del datasets
    import cfgrib

    ds_list = cfgrib.open_datasets(str(path))
    uv = None
    gust = None
    for ds in ds_list:
        vars_set = set(ds.data_vars.keys())
        if {"u10", "v10"}.issubset(vars_set):
            uv = ds
        if "i10fg" in vars_set:
            gust = ds
    if uv is None or gust is None:
        raise RuntimeError(f"Could not find uv/gust datasets in {path}")
    return uv, gust


def to_python_datetime(value):
    if value is None:
        return None
    if hasattr(value, "values"):
        value = value.values
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


def to_step_hours(value) -> float | None:
    if value is None:
        return None
    if hasattr(value, "values"):
        value = value.values
    try:
        nanos = value.astype("timedelta64[ns]").astype(np.int64)
        return float(nanos) / 3_600_000_000_000.0
    except Exception:
        return None


def parse_month_file(xr, path: Path) -> MonthlyWindRecord:
    path = path.resolve()
    uv_ds, gust_ds = open_month_datasets(xr, path)

    file_name = path.name
    year = int(file_name[18:22])
    month = int(file_name[23:25])
    month_label = f"{year}-{month:02d}"
    month_start = date(year, month, 1)

    u_values = np.asarray(uv_ds["u10"].values, dtype=np.float32)
    v_values = np.asarray(uv_ds["v10"].values, dtype=np.float32)
    gust_values = np.asarray(gust_ds["i10fg"].values, dtype=np.float32)

    lat_values = np.asarray(uv_ds["latitude"].values, dtype=np.float64)
    lon_values = np.asarray(uv_ds["longitude"].values, dtype=np.float64)

    if u_values.shape != v_values.shape or u_values.shape != gust_values.shape:
        raise RuntimeError(f"Shape mismatch in {path}: u={u_values.shape}, v={v_values.shape}, gust={gust_values.shape}")

    return MonthlyWindRecord(
        year=year,
        month=month,
        month_label=month_label,
        month_start=month_start,
        u_time=to_python_datetime(uv_ds.coords.get("time")),
        u_valid_time=to_python_datetime(uv_ds.coords.get("valid_time")),
        gust_time=to_python_datetime(gust_ds.coords.get("time")),
        gust_step_hours=to_step_hours(gust_ds.coords.get("step")),
        gust_valid_time=to_python_datetime(gust_ds.coords.get("valid_time")),
        u_component=u_values.tobytes(),
        v_component=v_values.tobytes(),
        gust_component=gust_values.tobytes(),
        u_min=float(np.nanmin(u_values)),
        u_max=float(np.nanmax(u_values)),
        v_min=float(np.nanmin(v_values)),
        v_max=float(np.nanmax(v_values)),
        gust_min=float(np.nanmin(gust_values)),
        gust_max=float(np.nanmax(gust_values)),
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


def ensure_schema(cur) -> None:
    sql_path = PROJECT_ROOT / "database_historical_wind.sql"
    sql_text = sql_path.read_text(encoding="utf-8")
    cur.execute(sql_text)


def upsert_metadata(cur, record: MonthlyWindRecord) -> int:
    cur.execute(
        """
        INSERT INTO historical_wind_metadata (
            dataset_code,
            dataset_name,
            product_type,
            data_format,
            variables,
            grid_width,
            grid_height,
            lon_min,
            lon_max,
            lat_min,
            lat_max,
            lon_step,
            lat_step,
            time_zone,
            frequency_note,
            source_note
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (dataset_code)
        DO UPDATE SET
            dataset_name = EXCLUDED.dataset_name,
            product_type = EXCLUDED.product_type,
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
            time_zone = EXCLUDED.time_zone,
            frequency_note = EXCLUDED.frequency_note,
            source_note = EXCLUDED.source_note,
            updated_at = CURRENT_TIMESTAMP
        RETURNING id
        """,
        (
            DATASET_CODE,
            DATASET_NAME,
            PRODUCT_TYPE,
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
            TIME_ZONE,
            FREQUENCY_NOTE,
            SOURCE_NOTE,
        ),
    )
    return cur.fetchone()[0]


def upsert_month(cur, metadata_id: int, record: MonthlyWindRecord) -> None:
    cur.execute(
        """
        INSERT INTO historical_wind_monthly_data (
            metadata_id,
            year,
            month,
            month_label,
            month_start,
            u_time,
            u_valid_time,
            gust_time,
            gust_step_hours,
            gust_valid_time,
            u_component,
            v_component,
            gust_component,
            u_min,
            u_max,
            v_min,
            v_max,
            gust_min,
            gust_max,
            data_size,
            source_file_name,
            source_file_path,
            source_file_size_bytes
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (metadata_id, year, month)
        DO UPDATE SET
            month_label = EXCLUDED.month_label,
            month_start = EXCLUDED.month_start,
            u_time = EXCLUDED.u_time,
            u_valid_time = EXCLUDED.u_valid_time,
            gust_time = EXCLUDED.gust_time,
            gust_step_hours = EXCLUDED.gust_step_hours,
            gust_valid_time = EXCLUDED.gust_valid_time,
            u_component = EXCLUDED.u_component,
            v_component = EXCLUDED.v_component,
            gust_component = EXCLUDED.gust_component,
            u_min = EXCLUDED.u_min,
            u_max = EXCLUDED.u_max,
            v_min = EXCLUDED.v_min,
            v_max = EXCLUDED.v_max,
            gust_min = EXCLUDED.gust_min,
            gust_max = EXCLUDED.gust_max,
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
            record.u_time,
            record.u_valid_time,
            record.gust_time,
            record.gust_step_hours,
            record.gust_valid_time,
            psycopg2.Binary(record.u_component),
            psycopg2.Binary(record.v_component),
            psycopg2.Binary(record.gust_component),
            record.u_min,
            record.u_max,
            record.v_min,
            record.v_max,
            record.gust_min,
            record.gust_max,
            record.data_size,
            record.source_file_name,
            record.source_file_path,
            record.source_file_size_bytes,
        ),
    )


def main() -> int:
    args = parse_args()
    xr = ensure_grib_stack()
    months = parse_months(args.months)
    files = list(iter_year_files(Path(args.raw_root), args.year, months))
    missing = [str(path) for path in files if not path.exists()]
    if missing:
        raise RuntimeError(f"Missing monthly GRIB files for {args.year}: {missing}")
    if not files:
        raise RuntimeError(f"No monthly GRIB files found for {args.year}")

    records = [parse_month_file(xr, path) for path in files]

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
                print(
                    f"imported {record.month_label} -> "
                    f"grid={record.grid_width}x{record.grid_height}, points={record.data_size}"
                )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    print(f"done: imported {len(records)} monthly wind files for {args.year}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
