#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Download and normalize Copernicus Marine surface current forecasts.

This module is source-specific. It downloads hourly global surface current data
from Copernicus Marine, keeps only the surface layer and down-samples it to the
project's 3-hour granularity, then writes normalized NetCDF files that match
the existing raw weather batch conventions:

    data/raw/YYYY/MM/DD/curu_YYYYMMDD_t08.nc
    data/raw/YYYY/MM/DD/curv_YYYYMMDD_t08.nc

The output can then be registered with automation/wind_wave/register_weather_batch.py
and processed with automation/mining_overview/process_forecasts_batch.py --data-types current.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
import tempfile
from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from pathlib import Path

import h5netcdf
import numpy as np
import xarray as xr
from netCDF4 import num2date


PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
os.environ.setdefault("HDF5_USE_FILE_LOCKING", "FALSE")

DOWNLOAD_ROOT = PROJECT_ROOT / "data" / "current_surface" / "downloads"
RAW_ROOT = PROJECT_ROOT / "data" / "raw"
LOCAL_CREDENTIALS = PROJECT_ROOT / "automation" / "current_surface" / "copernicusmarine.local.json"

PRODUCT_ID = "GLOBAL_ANALYSISFORECAST_PHY_001_024"
DATASET_ID = "cmems_mod_glo_phy_anfc_0.083deg_PT1H-m"
DEFAULT_RUN_CYCLE = "t08"
DEFAULT_STEP_HOURS = 3
DEFAULT_DAYS = 11
SURFACE_DEPTH_METERS = 0.49402499198913574
U_VAR_CANDIDATES = ("uo", "water_u", "current_u")
V_VAR_CANDIDATES = ("vo", "water_v", "current_v")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--date",
        help="Batch base date in YYYY-MM-DD or YYYYMMDD. Defaults to current UTC date.",
    )
    parser.add_argument(
        "--run-cycle",
        default=os.getenv("CURRENT_RUN_CYCLE", DEFAULT_RUN_CYCLE),
        help=f"Batch run cycle stored in output file names. Defaults to {DEFAULT_RUN_CYCLE}.",
    )
    parser.add_argument(
        "--days",
        type=int,
        default=DEFAULT_DAYS,
        help="Number of forecast days to keep including the base date. Defaults to 11.",
    )
    parser.add_argument(
        "--step-hours",
        type=int,
        default=DEFAULT_STEP_HOURS,
        help="Temporal granularity to keep after download. Defaults to 3 hours.",
    )
    parser.add_argument(
        "--username",
        default=os.getenv("COPERNICUSMARINE_USERNAME"),
        help="Copernicus Marine username. Can also come from COPERNICUSMARINE_USERNAME.",
    )
    parser.add_argument(
        "--password",
        default=os.getenv("COPERNICUSMARINE_PASSWORD"),
        help="Copernicus Marine password. Can also come from COPERNICUSMARINE_PASSWORD.",
    )
    parser.add_argument(
        "--source-file",
        help="Use an existing local source NetCDF instead of downloading from Copernicus Marine.",
    )
    parser.add_argument(
        "--keep-source",
        action="store_true",
        help="Keep the downloaded combined source file under data/current_surface/downloads.",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite existing normalized files.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the resolved plan without downloading or writing files.",
    )
    return parser.parse_args()


def normalize_date_arg(date_arg: str | None) -> date:
    if not date_arg:
        return datetime.now(UTC).date()
    normalized = date_arg.replace("-", "")
    if len(normalized) != 8 or not normalized.isdigit():
        raise ValueError("Date must be YYYY-MM-DD or YYYYMMDD")
    return datetime.strptime(normalized, "%Y%m%d").date()


def normalize_run_cycle(value: str) -> str:
    if not value.startswith("t") or not value[1:].isdigit():
        raise ValueError("run-cycle must match tNN, for example t08 or t12")
    return value


def load_credentials(args: argparse.Namespace) -> tuple[str, str]:
    username = args.username
    password = args.password
    if LOCAL_CREDENTIALS.exists():
        payload = json.loads(LOCAL_CREDENTIALS.read_text(encoding="utf-8"))
        username = username or payload.get("username")
        password = password or payload.get("password")
    if not username or not password:
        raise ValueError(
            "Missing Copernicus Marine credentials. Pass --username/--password, set "
            "COPERNICUSMARINE_USERNAME/COPERNICUSMARINE_PASSWORD, or create "
            "automation/current_surface/copernicusmarine.local.json."
        )
    return username, password


def batch_paths(base_date: date, run_cycle: str) -> tuple[Path, Path, Path]:
    yyyymmdd = base_date.strftime("%Y%m%d")
    raw_dir = RAW_ROOT / yyyymmdd[0:4] / yyyymmdd[4:6] / yyyymmdd[6:8]
    raw_dir.mkdir(parents=True, exist_ok=True)

    curu_path = raw_dir / f"curu_{yyyymmdd}_{run_cycle}.nc"
    curv_path = raw_dir / f"curv_{yyyymmdd}_{run_cycle}.nc"

    download_dir = DOWNLOAD_ROOT / yyyymmdd[0:4] / yyyymmdd[4:6] / yyyymmdd[6:8]
    download_dir.mkdir(parents=True, exist_ok=True)
    source_path = download_dir / f"surface_current_{yyyymmdd}_{run_cycle}_combined.nc"
    return source_path, curu_path, curv_path


def time_window(base_date: date, days: int) -> tuple[datetime, datetime]:
    start_dt = datetime.combine(base_date, time(0, 0), tzinfo=UTC)
    end_dt = start_dt + timedelta(days=days) - timedelta(hours=1)
    return start_dt, end_dt


def resolve_dataset_max_time() -> datetime | None:
    import copernicusmarine

    catalogue = copernicusmarine.describe(dataset_id=DATASET_ID, disable_progress_bar=True)
    for product in getattr(catalogue, "products", []):
        for dataset in getattr(product, "datasets", []):
            if getattr(dataset, "dataset_id", None) != DATASET_ID:
                continue
            for version in getattr(dataset, "versions", []):
                for part in getattr(version, "parts", []):
                    for service in getattr(part, "services", []):
                        for variable in getattr(service, "variables", []):
                            if getattr(variable, "short_name", None) != "uo":
                                continue
                            for coordinate in getattr(variable, "coordinates", []):
                                if getattr(coordinate, "axis", None) == "t" and getattr(coordinate, "maximum_value", None) is not None:
                                    max_millis = float(coordinate.maximum_value)
                                    return datetime.fromtimestamp(max_millis / 1000.0, tz=UTC)
    return None


def clamp_end_datetime(start_dt: datetime, end_dt: datetime) -> datetime:
    max_time = resolve_dataset_max_time()
    if max_time is None:
        return end_dt
    if end_dt > max_time:
        print(f"clamping end time from {end_dt.isoformat()} to dataset max {max_time.isoformat()}")
        return max_time
    return end_dt


def download_source_file(
    output_path: Path,
    start_dt: datetime,
    end_dt: datetime,
    username: str,
    password: str,
    overwrite: bool,
) -> None:
    if output_path.exists() and not overwrite:
        print(f"skip existing source: {output_path}")
        return

    import copernicusmarine

    print(
        "downloading Copernicus Marine surface current: "
        f"dataset={DATASET_ID}, start={start_dt.isoformat()}, end={end_dt.isoformat()}"
    )
    copernicusmarine.subset(
        dataset_id=DATASET_ID,
        username=username,
        password=password,
        variables=["uo", "vo"],
        start_datetime=start_dt.isoformat(),
        end_datetime=end_dt.isoformat(),
        minimum_depth=SURFACE_DEPTH_METERS,
        maximum_depth=SURFACE_DEPTH_METERS,
        output_filename=output_path.name,
        output_directory=str(output_path.parent),
        overwrite=overwrite,
        disable_progress_bar=False,
        file_format="netcdf",
    )


def pick_variable(dataset: xr.Dataset, candidates: tuple[str, ...], label: str) -> xr.DataArray:
    for name in candidates:
        if name in dataset.data_vars:
            return dataset[name]
    raise KeyError(f"Could not find {label} variable in dataset. Available: {list(dataset.data_vars)}")


def normalize_to_files(
    source_path: Path,
    curu_path: Path,
    curv_path: Path,
    base_date: date,
    run_cycle: str,
    days: int,
    step_hours: int,
) -> tuple[int, int, int]:
    start_dt, end_dt = time_window(base_date, days)
    temp_dir: tempfile.TemporaryDirectory[str] | None = None
    source_for_open = source_path
    try:
        dataset = xr.open_dataset(source_for_open, engine="h5netcdf", decode_times=False)
    except OSError:
        temp_dir = tempfile.TemporaryDirectory(prefix="surface_current_")
        temp_source_path = Path(temp_dir.name) / source_path.name
        shutil.copy2(source_path, temp_source_path)
        source_for_open = temp_source_path
        dataset = xr.open_dataset(source_for_open, engine="h5netcdf", decode_times=False)
    try:
        time_name = "time"
        lat_name = "lat" if "lat" in dataset.coords else "latitude"
        lon_name = "lon" if "lon" in dataset.coords else "longitude"
        time_values = np.asarray(dataset[time_name].values)
        time_units = dataset[time_name].attrs.get("units", "hours since 2000-01-01 00:00:00")
        time_calendar = dataset[time_name].attrs.get("calendar", "standard")
        decoded_times = np.asarray([
            np.datetime64(value.replace(tzinfo=None))
            for value in num2date(
                time_values,
                units=time_units,
                calendar=time_calendar,
                only_use_cftime_datetimes=False,
                only_use_python_datetimes=True,
            )
        ])
        start_np = np.datetime64(start_dt.replace(tzinfo=None).isoformat())
        end_np = np.datetime64(end_dt.replace(tzinfo=None).isoformat())
        time_mask = (decoded_times >= start_np) & (decoded_times <= end_np)
        if not np.any(time_mask):
            raise ValueError(f"No time points remain after slicing {start_dt} to {end_dt}")

        time_hours = np.asarray([int(str(value)[11:13]) for value in decoded_times[time_mask]], dtype=int)
        selected_positions = np.where(time_mask)[0][(time_hours % step_hours) == 0]
        if selected_positions.size == 0:
            raise ValueError(f"No time points remain after applying {step_hours}-hour sampling")

        u_var = pick_variable(dataset, U_VAR_CANDIDATES, "u/current_u")
        v_var = pick_variable(dataset, V_VAR_CANDIDATES, "v/current_v")

        lon_values_raw = np.asarray(dataset[lon_name].values, dtype=np.float64)
        lon_values = np.mod(lon_values_raw, 360.0).astype(np.float32)
        lon_sort_index = np.argsort(lon_values)
        lon_values = lon_values[lon_sort_index]
        lat_values = np.asarray(dataset[lat_name].values, dtype=np.float32)
        selected_time_values = time_values[selected_positions]

        for path in (curu_path, curv_path):
            if path.exists():
                path.unlink()

        common_attrs = {
            "title": "Normalized surface current forecast for project current pipeline",
            "source": "Copernicus Marine",
            "product_id": PRODUCT_ID,
            "dataset_id": DATASET_ID,
            "base_date": base_date.isoformat(),
            "run_cycle": run_cycle,
            "time_step_hours": step_hours,
            "normalized_at": datetime.now(UTC).isoformat(timespec="seconds"),
        }
        time_attrs = {
            "units": time_units,
            "calendar": time_calendar,
            "long_name": dataset[time_name].attrs.get("long_name", "time"),
        }

        with h5netcdf.File(curu_path, "w") as u_out, h5netcdf.File(curv_path, "w") as v_out:
            for out_file in (u_out, v_out):
                out_file.dimensions = {
                    "time": int(selected_positions.size),
                    "lat": int(lat_values.shape[0]),
                    "lon": int(lon_values.shape[0]),
                }
                out_file.attrs.update(common_attrs)

                lon_var = out_file.create_variable("lon", ("lon",), np.float32)
                lon_var[:] = lon_values
                lon_var.attrs.update({"units": "degrees_east", "long_name": "Longitude"})

                lat_var = out_file.create_variable("lat", ("lat",), np.float32)
                lat_var[:] = lat_values
                lat_var.attrs.update({"units": "degrees_north", "long_name": "Latitude"})

                time_var = out_file.create_variable("time", ("time",), selected_time_values.dtype)
                time_var[:] = selected_time_values
                time_var.attrs.update(time_attrs)

            u_out_var = u_out.create_variable("water_u", ("time", "lat", "lon"), np.float32)
            u_out_var.attrs.update({"units": "m/s", "long_name": "Eastward Water Velocity"})
            v_out_var = v_out.create_variable("water_v", ("time", "lat", "lon"), np.float32)
            v_out_var.attrs.update({"units": "m/s", "long_name": "Northward Water Velocity"})

            if "depth" in u_var.dims:
                depth_axis_u = u_var.dims.index("depth")
            else:
                depth_axis_u = None
            if "depth" in v_var.dims:
                depth_axis_v = v_var.dims.index("depth")
            else:
                depth_axis_v = None

            for out_index, src_index in enumerate(selected_positions.tolist()):
                u_slice = u_var.isel(time=src_index)
                v_slice = v_var.isel(time=src_index)
                if depth_axis_u is not None:
                    u_slice = u_slice.isel(depth=0)
                if depth_axis_v is not None:
                    v_slice = v_slice.isel(depth=0)

                u_array = np.asarray(u_slice.values, dtype=np.float32)
                v_array = np.asarray(v_slice.values, dtype=np.float32)
                if u_slice.dims != (lat_name, lon_name):
                    u_array = np.asarray(u_slice.transpose(lat_name, lon_name).values, dtype=np.float32)
                if v_slice.dims != (lat_name, lon_name):
                    v_array = np.asarray(v_slice.transpose(lat_name, lon_name).values, dtype=np.float32)

                u_out_var[out_index, :, :] = u_array[:, lon_sort_index]
                v_out_var[out_index, :, :] = v_array[:, lon_sort_index]

                if (out_index + 1) % 8 == 0 or out_index == selected_positions.size - 1:
                    print(f"normalized {out_index + 1}/{selected_positions.size} time slices")

        return int(selected_positions.size), int(lon_values.shape[0]), int(lat_values.shape[0])
    finally:
        dataset.close()
        if temp_dir is not None:
            temp_dir.cleanup()


def main() -> int:
    args = parse_args()
    base_date = normalize_date_arg(args.date)
    run_cycle = normalize_run_cycle(args.run_cycle)
    source_path, curu_path, curv_path = batch_paths(base_date, run_cycle)
    start_dt, end_dt = time_window(base_date, args.days)
    end_dt = clamp_end_datetime(start_dt, end_dt)
    yyyymmdd = base_date.strftime("%Y%m%d")

    if args.dry_run:
        print(
            json.dumps(
                {
                    "datasetId": DATASET_ID,
                    "productId": PRODUCT_ID,
                    "baseDate": base_date.isoformat(),
                    "runCycle": run_cycle,
                    "start": start_dt.isoformat(),
                    "end": end_dt.isoformat(),
                    "stepHours": args.step_hours,
                    "sourceFile": str(Path(args.source_file)) if args.source_file else str(source_path),
                    "curuFile": str(curu_path),
                    "curvFile": str(curv_path),
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return 0

    actual_source_path = Path(args.source_file) if args.source_file else source_path
    if args.source_file:
        if not actual_source_path.exists():
            raise FileNotFoundError(f"source file not found: {actual_source_path}")
    else:
        username, password = load_credentials(args)
        download_source_file(
            output_path=actual_source_path,
            start_dt=start_dt,
            end_dt=end_dt,
            username=username,
            password=password,
            overwrite=args.overwrite,
        )

    if curu_path.exists() and curv_path.exists() and not args.overwrite:
        print(f"skip existing normalized files: {curu_path} and {curv_path}")
        return 0

    time_count, lon_count, lat_count = normalize_to_files(
        source_path=actual_source_path,
        curu_path=curu_path,
        curv_path=curv_path,
        base_date=base_date,
        run_cycle=run_cycle,
        days=args.days,
        step_hours=args.step_hours,
    )
    print(f"saved: {curu_path}")
    print(f"saved: {curv_path}")
    print(
        f"done: normalized current batch {yyyymmdd} {run_cycle}; "
        f"time_count={time_count}, lon={lon_count}, lat={lat_count}"
    )

    if not args.keep_source and not args.source_file and actual_source_path.exists():
        actual_source_path.unlink()
        print(f"deleted temporary source file: {actual_source_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
