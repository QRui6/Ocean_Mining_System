#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Process one registered weather batch into overview forecast tables.

The batch may contain any subset of wind, wave, and current files. Metrics are
only filled when the raw elements needed for that metric are available.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import sys
from contextlib import ExitStack
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Iterable

import numpy as np
import psycopg2
from psycopg2.extras import Json
from shapely.geometry import shape
from shapely.ops import transform

try:
    from shapely import contains_xy as shapely_contains_xy
except ImportError:  # pragma: no cover
    from shapely.vectorized import contains as shapely_contains_xy


PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from automation.wind_wave.register_weather_batch import (
    convert_time_values,
    find_data_variable,
    open_dataset_safe,
)

WIND_ELEMENTS = ("wspd", "wdir", "gust")
WAVE_ELEMENTS = ("sigh", "perd", "dire")
CURRENT_ELEMENTS = ("curu", "curv")
SUPPORTED_ELEMENTS = WIND_ELEMENTS + WAVE_ELEMENTS + CURRENT_ELEMENTS
REFERENCE_PRIORITY = ("wspd", "sigh", "curu", "wdir", "perd", "dire", "gust", "curv")
WAVE_INVALID_THRESHOLD = -3000.0


@dataclass
class BatchFile:
    file_id: int
    element_code: str
    data_type: str
    base_date: date
    run_cycle: str
    object_key: str


@dataclass
class ForecastField:
    file_id: int
    element_code: str
    data_type: str
    base_date: date
    run_cycle: str
    dataset: object
    variable_name: str
    data_var: object
    dimensions: tuple[str, ...]
    lon_values: np.ndarray
    lat_values: np.ndarray
    forecast_times: list[datetime]
    forecast_hours: np.ndarray


@dataclass
class RegionDefinition:
    region_id: int
    region_code: str
    region_name: str
    geometry_geojson: dict


@dataclass
class SiteDefinition:
    site_id: int
    region_id: int
    site_code: str
    site_name: str
    lng: float
    lat: float


@dataclass
class RegionWindow:
    lon_slice: slice
    lat_slice: slice
    mask: np.ndarray


@dataclass
class RegionSpatialIndex:
    region_id: int
    region_name: str
    wind_window: RegionWindow | None
    wave_window: RegionWindow | None
    current_window: RegionWindow | None


@dataclass
class SiteSpatialIndex:
    site_id: int
    region_id: int
    site_code: str
    wind_lon_index: int | None
    wind_lat_index: int | None
    wave_lon_index: int | None
    wave_lat_index: int | None
    current_lon_index: int | None
    current_lat_index: int | None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--date",
        help="Target batch base date in YYYY-MM-DD or YYYYMMDD format. Defaults to latest registered batch.",
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
        "--data-types",
        default="wind,wave,current",
        help="Comma-separated data types to process. Supported: wind,wave,current. Default: all.",
    )
    return parser.parse_args()


def normalize_date_arg(date_arg: str | None) -> date | None:
    if not date_arg:
        return None
    normalized = date_arg.replace("-", "")
    if len(normalized) != 8 or not normalized.isdigit():
        raise ValueError("Date must be YYYY-MM-DD or YYYYMMDD")
    return datetime.strptime(normalized, "%Y%m%d").date()


def normalize_lon_value(value: float) -> float:
    lon = float(value)
    if lon < 0:
        lon += 360.0
    if lon >= 360.0:
        lon -= 360.0
    return lon


def normalize_geometry_longitudes(geom):
    def _transform(x, y, z=None):
        if np.isscalar(x):
            return normalize_lon_value(float(x)), float(y)
        x_arr = np.asarray(x, dtype=float)
        y_arr = np.asarray(y, dtype=float)
        x_arr = np.where(x_arr < 0, x_arr + 360.0, x_arr)
        x_arr = np.where(x_arr >= 360.0, x_arr - 360.0, x_arr)
        return x_arr, y_arr

    return transform(_transform, geom)


def parse_data_types(value: str) -> tuple[str, ...]:
    data_types = tuple(part.strip().lower() for part in value.split(",") if part.strip())
    if not data_types:
        raise ValueError("At least one data type must be provided")
    invalid = [item for item in data_types if item not in {"wind", "wave", "current"}]
    if invalid:
        raise ValueError(f"Unsupported data types: {', '.join(invalid)}")
    return data_types


def latest_batch_key(cur, data_types: tuple[str, ...]) -> tuple[date, str]:
    cur.execute(
        """
        SELECT base_date, run_cycle
        FROM weather_files
        WHERE download_status = 'success'
          AND data_type = ANY(%s)
        ORDER BY base_date DESC, run_cycle DESC
        LIMIT 1
        """,
        (list(data_types),),
    )
    row = cur.fetchone()
    if row is None:
        raise RuntimeError("No registered weather batches found in weather_files")
    return row[0], row[1]


def load_batch_files(cur, base_date: date, run_cycle: str, data_types: tuple[str, ...]) -> dict[str, BatchFile]:
    cur.execute(
        """
        SELECT id, element_code, data_type, base_date, run_cycle, object_key
        FROM weather_files
        WHERE base_date = %s
          AND run_cycle = %s
          AND download_status = 'success'
          AND data_type = ANY(%s)
        ORDER BY element_code
        """,
        (base_date, run_cycle, list(data_types)),
    )
    files = {
        row[1]: BatchFile(
            file_id=row[0],
            element_code=row[1],
            data_type=row[2],
            base_date=row[3],
            run_cycle=row[4],
            object_key=row[5],
        )
        for row in cur.fetchall()
        if row[1] in SUPPORTED_ELEMENTS
    }
    if not files:
        raise RuntimeError(f"Batch {base_date} {run_cycle} has no supported weather files")
    return files


def load_region_definitions(cur) -> list[RegionDefinition]:
    cur.execute(
        """
        SELECT id, region_code, region_name, ST_AsGeoJSON(geometry)
        FROM mining_regions
        WHERE is_active = TRUE
        ORDER BY id
        """
    )
    return [
        RegionDefinition(
            region_id=row[0],
            region_code=row[1],
            region_name=row[2],
            geometry_geojson=json.loads(row[3]),
        )
        for row in cur.fetchall()
    ]


def load_site_definitions(cur) -> list[SiteDefinition]:
    cur.execute(
        """
        SELECT id, region_id, site_code, site_name, lng, lat
        FROM forecast_sites
        WHERE is_active = TRUE
        ORDER BY id
        """
    )
    return [
        SiteDefinition(
            site_id=row[0],
            region_id=row[1],
            site_code=row[2],
            site_name=row[3],
            lng=float(row[4]),
            lat=float(row[5]),
        )
        for row in cur.fetchall()
    ]


def open_forecast_field(batch_file: BatchFile, stack: ExitStack) -> ForecastField:
    dataset_path = PROJECT_ROOT / Path(batch_file.object_key)
    dataset = stack.enter_context(open_dataset_safe(dataset_path))

    variable_name = find_data_variable(dataset)
    data_var = dataset.variables[variable_name]
    time_var = dataset.variables["time"]
    forecast_times = [
        value
        for value in convert_time_values(
            time_var[:],
            units=time_var.units,
            calendar=getattr(time_var, "calendar", "standard"),
        )
    ]
    base_dt = datetime.combine(batch_file.base_date, datetime.min.time())
    forecast_hours = np.asarray(
        [
            int(round((value - base_dt).total_seconds() / 3600.0))
            for value in forecast_times
        ],
        dtype=int,
    )

    return ForecastField(
        file_id=batch_file.file_id,
        element_code=batch_file.element_code,
        data_type=batch_file.data_type,
        base_date=batch_file.base_date,
        run_cycle=batch_file.run_cycle,
        dataset=dataset,
        variable_name=variable_name,
        data_var=data_var,
        dimensions=tuple(data_var.dimensions),
        lon_values=np.asarray(dataset.variables["lon"][:], dtype=float),
        lat_values=np.asarray(dataset.variables["lat"][:], dtype=float),
        forecast_times=forecast_times,
        forecast_hours=forecast_hours,
    )


def nearest_index(values: np.ndarray, target: float) -> int:
    return int(np.argmin(np.abs(values - target)))


def build_region_window(geom, lon_values: np.ndarray, lat_values: np.ndarray) -> RegionWindow:
    min_lon, min_lat, max_lon, max_lat = geom.bounds
    lon_indices = np.where((lon_values >= min_lon) & (lon_values <= max_lon))[0]
    lat_indices = np.where((lat_values >= min_lat) & (lat_values <= max_lat))[0]

    if len(lon_indices) == 0 or len(lat_indices) == 0:
        point = geom.representative_point()
        lon_index = nearest_index(lon_values, point.x)
        lat_index = nearest_index(lat_values, point.y)
        return RegionWindow(
            lon_slice=slice(lon_index, lon_index + 1),
            lat_slice=slice(lat_index, lat_index + 1),
            mask=np.ones((1, 1), dtype=bool),
        )

    lon_slice = slice(int(lon_indices[0]), int(lon_indices[-1]) + 1)
    lat_slice = slice(int(lat_indices[0]), int(lat_indices[-1]) + 1)
    lon_subset = lon_values[lon_slice]
    lat_subset = lat_values[lat_slice]
    grid_lon, grid_lat = np.meshgrid(lon_subset, lat_subset, indexing="ij")
    mask = shapely_contains_xy(geom, grid_lon.ravel(), grid_lat.ravel()).reshape(grid_lon.shape)

    if not mask.any():
        point = geom.representative_point()
        lon_index = nearest_index(lon_values, point.x)
        lat_index = nearest_index(lat_values, point.y)
        return RegionWindow(
            lon_slice=slice(lon_index, lon_index + 1),
            lat_slice=slice(lat_index, lat_index + 1),
            mask=np.ones((1, 1), dtype=bool),
        )

    return RegionWindow(lon_slice=lon_slice, lat_slice=lat_slice, mask=mask)


def pick_reference_field(fields: dict[str, ForecastField], candidates: tuple[str, ...]) -> ForecastField | None:
    best_field = None
    best_score = None
    for rank, element in enumerate(candidates):
        field = fields.get(element)
        if field is None:
            continue
        score = (len(field.forecast_times), -rank)
        if best_score is None or score > best_score:
            best_field = field
            best_score = score
    if best_field is not None:
        return best_field
    return None


def build_region_spatial_indices(
    regions: Iterable[RegionDefinition],
    wind_reference: ForecastField | None,
    wave_reference: ForecastField | None,
    current_reference: ForecastField | None,
) -> list[RegionSpatialIndex]:
    indices: list[RegionSpatialIndex] = []
    for region in regions:
        normalized_geom = normalize_geometry_longitudes(shape(region.geometry_geojson))
        indices.append(
            RegionSpatialIndex(
                region_id=region.region_id,
                region_name=region.region_name,
                wind_window=(
                    build_region_window(normalized_geom, wind_reference.lon_values, wind_reference.lat_values)
                    if wind_reference is not None
                    else None
                ),
                wave_window=(
                    build_region_window(normalized_geom, wave_reference.lon_values, wave_reference.lat_values)
                    if wave_reference is not None
                    else None
                ),
                current_window=(
                    build_region_window(
                        normalized_geom,
                        current_reference.lon_values,
                        current_reference.lat_values,
                    )
                    if current_reference is not None
                    else None
                ),
            )
        )
    return indices


def build_site_spatial_indices(
    sites: Iterable[SiteDefinition],
    wind_reference: ForecastField | None,
    wave_reference: ForecastField | None,
    current_reference: ForecastField | None,
) -> list[SiteSpatialIndex]:
    indices: list[SiteSpatialIndex] = []
    for site in sites:
        normalized_lon = normalize_lon_value(site.lng)
        indices.append(
            SiteSpatialIndex(
                site_id=site.site_id,
                region_id=site.region_id,
                site_code=site.site_code,
                wind_lon_index=(
                    nearest_index(wind_reference.lon_values, normalized_lon)
                    if wind_reference is not None
                    else None
                ),
                wind_lat_index=(
                    nearest_index(wind_reference.lat_values, site.lat)
                    if wind_reference is not None
                    else None
                ),
                wave_lon_index=(
                    nearest_index(wave_reference.lon_values, normalized_lon)
                    if wave_reference is not None
                    else None
                ),
                wave_lat_index=(
                    nearest_index(wave_reference.lat_values, site.lat)
                    if wave_reference is not None
                    else None
                ),
                current_lon_index=(
                    nearest_index(current_reference.lon_values, normalized_lon)
                    if current_reference is not None
                    else None
                ),
                current_lat_index=(
                    nearest_index(current_reference.lat_values, site.lat)
                    if current_reference is not None
                    else None
                ),
            )
        )
    return indices


def _read_values(field: ForecastField, lon_selector, lat_selector) -> tuple[np.ndarray, list[str]]:
    selectors = []
    remaining_dims: list[str] = []
    for dim in field.dimensions:
        if dim == "time":
            selectors.append(slice(None))
            remaining_dims.append(dim)
        elif dim == "lon":
            selectors.append(lon_selector)
            if isinstance(lon_selector, slice):
                remaining_dims.append(dim)
        elif dim == "lat":
            selectors.append(lat_selector)
            if isinstance(lat_selector, slice):
                remaining_dims.append(dim)
        elif dim == "depth":
            selectors.append(0)
        else:
            axis = field.dimensions.index(dim)
            if field.data_var.shape[axis] == 1:
                selectors.append(0)
            else:
                raise ValueError(
                    f"Unsupported dimension order for {field.element_code}: {field.dimensions}"
                )

    values = np.asarray(field.data_var[tuple(selectors)], dtype=np.float64)
    if field.data_type == "wave":
        values[values <= WAVE_INVALID_THRESHOLD] = np.nan

    if remaining_dims:
        desired_dims = [dim for dim in ("time", "lon", "lat") if dim in remaining_dims]
        axes = [remaining_dims.index(dim) for dim in desired_dims]
        values = np.transpose(values, axes=axes)
        remaining_dims = desired_dims
    return values, remaining_dims


def read_subset(field: ForecastField, window: RegionWindow) -> np.ndarray:
    values, dims = _read_values(field, window.lon_slice, window.lat_slice)
    if dims != ["time", "lon", "lat"]:
        raise ValueError(f"Unexpected subset dimensions for {field.element_code}: {dims}")
    return values


def read_site_series(field: ForecastField, lon_index: int, lat_index: int) -> np.ndarray:
    values, dims = _read_values(field, lon_index, lat_index)
    if dims != ["time"]:
        raise ValueError(f"Unexpected site dimensions for {field.element_code}: {dims}")
    return values


def circular_mean_rows(values: np.ndarray) -> np.ndarray:
    valid = np.isfinite(values)
    counts = valid.sum(axis=1)
    result = np.full(values.shape[0], np.nan, dtype=np.float64)
    if not np.any(counts):
        return result

    radians = np.deg2rad(np.mod(values, 360.0))
    sin_sum = np.nansum(np.where(valid, np.sin(radians), np.nan), axis=1)
    cos_sum = np.nansum(np.where(valid, np.cos(radians), np.nan), axis=1)
    mask = counts > 0
    result[mask] = (np.degrees(np.arctan2(sin_sum[mask], cos_sum[mask])) + 360.0) % 360.0
    return result


def masked_spatial_mean_max(values: np.ndarray, mask: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    selected = values.reshape(values.shape[0], -1)[:, mask.ravel()]
    valid_counts = np.isfinite(selected).sum(axis=1)
    mean_values = np.full(selected.shape[0], np.nan, dtype=np.float64)
    max_values = np.full(selected.shape[0], np.nan, dtype=np.float64)

    valid_rows = valid_counts > 0
    if np.any(valid_rows):
        with np.errstate(invalid="ignore"):
            mean_values[valid_rows] = np.nanmean(selected[valid_rows], axis=1)
            max_values[valid_rows] = np.nanmax(selected[valid_rows], axis=1)
    return mean_values, max_values


def masked_spatial_direction_mean(values: np.ndarray, mask: np.ndarray) -> np.ndarray:
    selected = values.reshape(values.shape[0], -1)[:, mask.ravel()]
    return circular_mean_rows(selected)


def uv_to_speed_direction(u_values: np.ndarray, v_values: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    speed = np.sqrt(np.square(u_values) + np.square(v_values))
    direction = (np.degrees(np.arctan2(u_values, v_values)) + 360.0) % 360.0
    invalid = ~np.isfinite(u_values) | ~np.isfinite(v_values)
    speed[invalid] = np.nan
    direction[invalid] = np.nan
    return speed, direction


def float_or_none(value: float | np.floating | None) -> float | None:
    if value is None:
        return None
    if isinstance(value, (float, np.floating)) and (math.isnan(float(value)) or math.isinf(float(value))):
        return None
    return round(float(value), 3)


def daily_circular_mean(values: list[float | None]) -> float | None:
    cleaned = np.asarray([value for value in values if value is not None], dtype=np.float64)
    if cleaned.size == 0:
        return None
    return float_or_none(circular_mean_rows(cleaned.reshape(1, -1))[0])


def daily_mean(values: list[float | None]) -> float | None:
    cleaned = [value for value in values if value is not None]
    if not cleaned:
        return None
    return float_or_none(sum(cleaned) / len(cleaned))


def daily_max(values: list[float | None]) -> float | None:
    cleaned = [value for value in values if value is not None]
    if not cleaned:
        return None
    return float_or_none(max(cleaned))


def forecast_time_key(value: datetime) -> str:
    return value.strftime("%Y-%m-%d %H:%M:%S")


def build_forecast_time_index(field: ForecastField | None) -> dict[str, int]:
    if field is None:
        return {}
    return {forecast_time_key(forecast_time): index for index, forecast_time in enumerate(field.forecast_times)}


def value_at_forecast_time(
    values: np.ndarray | None,
    time_index: dict[str, int],
    forecast_time: datetime,
) -> float | None:
    if values is None:
        return None
    index = time_index.get(forecast_time_key(forecast_time))
    if index is None:
        return None
    return float_or_none(values[index])


def build_region_hourly_rows(
    region_indices: Iterable[RegionSpatialIndex],
    fields: dict[str, ForecastField],
    source_file_ids: list[int],
) -> list[dict]:
    reference = pick_reference_field(fields, REFERENCE_PRIORITY)
    if reference is None:
        return []

    rows: list[dict] = []
    for region in region_indices:
        wind_speed_avg = wind_speed_max = wind_dir_mean = gust_max = None
        wave_height_avg = wave_height_max = wave_period_avg = wave_dir_mean = None
        current_speed_avg = current_speed_max = current_dir_mean = None
        wind_time_index = wave_time_index = current_time_index = {}

        if fields.get("wspd") is not None and region.wind_window is not None:
            wind_speed_avg, wind_speed_max = masked_spatial_mean_max(
                read_subset(fields["wspd"], region.wind_window),
                region.wind_window.mask,
            )
            wind_time_index = build_forecast_time_index(fields["wspd"])
        if fields.get("gust") is not None and region.wind_window is not None:
            gust_max = masked_spatial_mean_max(
                read_subset(fields["gust"], region.wind_window),
                region.wind_window.mask,
            )[1]
            if not wind_time_index:
                wind_time_index = build_forecast_time_index(fields["gust"])
        if fields.get("wdir") is not None and region.wind_window is not None:
            wind_dir_mean = masked_spatial_direction_mean(
                read_subset(fields["wdir"], region.wind_window),
                region.wind_window.mask,
            )
            if not wind_time_index:
                wind_time_index = build_forecast_time_index(fields["wdir"])
        if fields.get("sigh") is not None and region.wave_window is not None:
            wave_height_avg, wave_height_max = masked_spatial_mean_max(
                read_subset(fields["sigh"], region.wave_window),
                region.wave_window.mask,
            )
            wave_time_index = build_forecast_time_index(fields["sigh"])
        if fields.get("perd") is not None and region.wave_window is not None:
            wave_period_avg, _ = masked_spatial_mean_max(
                read_subset(fields["perd"], region.wave_window),
                region.wave_window.mask,
            )
            if not wave_time_index:
                wave_time_index = build_forecast_time_index(fields["perd"])
        if fields.get("dire") is not None and region.wave_window is not None:
            wave_dir_mean = masked_spatial_direction_mean(
                read_subset(fields["dire"], region.wave_window),
                region.wave_window.mask,
            )
            if not wave_time_index:
                wave_time_index = build_forecast_time_index(fields["dire"])
        if (
            fields.get("curu") is not None
            and fields.get("curv") is not None
            and region.current_window is not None
        ):
            current_speed, current_dir = uv_to_speed_direction(
                read_subset(fields["curu"], region.current_window),
                read_subset(fields["curv"], region.current_window),
            )
            current_speed_avg, current_speed_max = masked_spatial_mean_max(
                current_speed,
                region.current_window.mask,
            )
            current_dir_mean = masked_spatial_direction_mean(
                current_dir,
                region.current_window.mask,
            )
            current_time_index = build_forecast_time_index(fields["curu"])

        for index, forecast_time in enumerate(reference.forecast_times):
            rows.append(
                {
                    "region_id": region.region_id,
                    "base_date": reference.base_date,
                    "run_cycle": reference.run_cycle,
                    "forecast_date": forecast_time.date(),
                    "forecast_time": forecast_time,
                    "forecast_hour": int(reference.forecast_hours[index]),
                    "wind_speed_avg": value_at_forecast_time(wind_speed_avg, wind_time_index, forecast_time),
                    "wind_speed_max": value_at_forecast_time(wind_speed_max, wind_time_index, forecast_time),
                    "wind_dir_mean": value_at_forecast_time(wind_dir_mean, wind_time_index, forecast_time),
                    "gust_max": value_at_forecast_time(gust_max, wind_time_index, forecast_time),
                    "wave_height_avg": value_at_forecast_time(wave_height_avg, wave_time_index, forecast_time),
                    "wave_height_max": value_at_forecast_time(wave_height_max, wave_time_index, forecast_time),
                    "wave_period_avg": value_at_forecast_time(wave_period_avg, wave_time_index, forecast_time),
                    "wave_dir_mean": value_at_forecast_time(wave_dir_mean, wave_time_index, forecast_time),
                    "current_speed_avg": value_at_forecast_time(current_speed_avg, current_time_index, forecast_time),
                    "current_speed_max": value_at_forecast_time(current_speed_max, current_time_index, forecast_time),
                    "current_dir_mean": value_at_forecast_time(current_dir_mean, current_time_index, forecast_time),
                    "source_file_ids": source_file_ids,
                    "is_latest": True,
                }
            )
    return rows


def build_site_hourly_rows(
    site_indices: Iterable[SiteSpatialIndex],
    fields: dict[str, ForecastField],
    source_file_ids: list[int],
) -> list[dict]:
    reference = pick_reference_field(fields, REFERENCE_PRIORITY)
    if reference is None:
        return []

    rows: list[dict] = []
    for site in site_indices:
        wind_speed = wind_dir = gust_values = None
        wave_height = wave_period = wave_dir = None
        current_speed = current_dir = None
        wind_time_index = wave_time_index = current_time_index = {}

        if fields.get("wspd") is not None and site.wind_lon_index is not None and site.wind_lat_index is not None:
            wind_speed = read_site_series(fields["wspd"], site.wind_lon_index, site.wind_lat_index)
            wind_time_index = build_forecast_time_index(fields["wspd"])
        if fields.get("wdir") is not None and site.wind_lon_index is not None and site.wind_lat_index is not None:
            wind_dir = read_site_series(fields["wdir"], site.wind_lon_index, site.wind_lat_index)
            if not wind_time_index:
                wind_time_index = build_forecast_time_index(fields["wdir"])
        if fields.get("gust") is not None and site.wind_lon_index is not None and site.wind_lat_index is not None:
            gust_values = read_site_series(fields["gust"], site.wind_lon_index, site.wind_lat_index)
            if not wind_time_index:
                wind_time_index = build_forecast_time_index(fields["gust"])
        if fields.get("sigh") is not None and site.wave_lon_index is not None and site.wave_lat_index is not None:
            wave_height = read_site_series(fields["sigh"], site.wave_lon_index, site.wave_lat_index)
            wave_time_index = build_forecast_time_index(fields["sigh"])
        if fields.get("perd") is not None and site.wave_lon_index is not None and site.wave_lat_index is not None:
            wave_period = read_site_series(fields["perd"], site.wave_lon_index, site.wave_lat_index)
            if not wave_time_index:
                wave_time_index = build_forecast_time_index(fields["perd"])
        if fields.get("dire") is not None and site.wave_lon_index is not None and site.wave_lat_index is not None:
            wave_dir = read_site_series(fields["dire"], site.wave_lon_index, site.wave_lat_index)
            if not wave_time_index:
                wave_time_index = build_forecast_time_index(fields["dire"])
        if (
            fields.get("curu") is not None
            and fields.get("curv") is not None
            and site.current_lon_index is not None
            and site.current_lat_index is not None
        ):
            current_speed, current_dir = uv_to_speed_direction(
                read_site_series(fields["curu"], site.current_lon_index, site.current_lat_index),
                read_site_series(fields["curv"], site.current_lon_index, site.current_lat_index),
            )
            current_time_index = build_forecast_time_index(fields["curu"])

        for index, forecast_time in enumerate(reference.forecast_times):
            rows.append(
                {
                    "site_id": site.site_id,
                    "region_id": site.region_id,
                    "base_date": reference.base_date,
                    "run_cycle": reference.run_cycle,
                    "forecast_date": forecast_time.date(),
                    "forecast_time": forecast_time,
                    "forecast_hour": int(reference.forecast_hours[index]),
                    "wind_speed": value_at_forecast_time(wind_speed, wind_time_index, forecast_time),
                    "wind_dir": value_at_forecast_time(wind_dir, wind_time_index, forecast_time),
                    "gust": value_at_forecast_time(gust_values, wind_time_index, forecast_time),
                    "wave_height": value_at_forecast_time(wave_height, wave_time_index, forecast_time),
                    "wave_period": value_at_forecast_time(wave_period, wave_time_index, forecast_time),
                    "wave_dir": value_at_forecast_time(wave_dir, wave_time_index, forecast_time),
                    "current_speed": value_at_forecast_time(current_speed, current_time_index, forecast_time),
                    "current_dir": value_at_forecast_time(current_dir, current_time_index, forecast_time),
                    "source_file_ids": source_file_ids,
                    "is_latest": True,
                }
            )
    return rows


def filter_full_day_rows(hourly_rows: Iterable[dict]) -> list[dict]:
    rows = list(hourly_rows)
    if not rows:
        return rows

    daily_counts: dict[date, int] = {}
    for row in rows:
        forecast_date = row["forecast_date"]
        daily_counts[forecast_date] = daily_counts.get(forecast_date, 0) + 1

    max_count = max(daily_counts.values())
    valid_dates = {forecast_date for forecast_date, count in daily_counts.items() if count == max_count}
    return [row for row in rows if row["forecast_date"] in valid_dates]


def build_region_daily_rows(hourly_rows: Iterable[dict]) -> list[dict]:
    grouped: dict[tuple[int, date, str, date], list[dict]] = {}
    for row in hourly_rows:
        key = (row["region_id"], row["base_date"], row["run_cycle"], row["forecast_date"])
        grouped.setdefault(key, []).append(row)

    rows: list[dict] = []
    for key in sorted(grouped.keys()):
        region_id, base_date, run_cycle, forecast_date = key
        items = grouped[key]
        rows.append(
            {
                "region_id": region_id,
                "base_date": base_date,
                "run_cycle": run_cycle,
                "forecast_date": forecast_date,
                "wind_speed_avg": daily_mean([item["wind_speed_avg"] for item in items]),
                "wind_speed_max": daily_max([item["wind_speed_max"] for item in items]),
                "gust_max": daily_max([item["gust_max"] for item in items]),
                "wave_height_avg": daily_mean([item["wave_height_avg"] for item in items]),
                "wave_height_max": daily_max([item["wave_height_max"] for item in items]),
                "wave_period_avg": daily_mean([item["wave_period_avg"] for item in items]),
                "wind_dir_mean": daily_circular_mean([item["wind_dir_mean"] for item in items]),
                "wave_dir_mean": daily_circular_mean([item["wave_dir_mean"] for item in items]),
                "current_speed_avg": daily_mean([item["current_speed_avg"] for item in items]),
                "current_speed_max": daily_max([item["current_speed_max"] for item in items]),
                "current_dir_mean": daily_circular_mean([item["current_dir_mean"] for item in items]),
                "hour_count": len(items),
                "source_file_ids": items[0]["source_file_ids"],
                "is_latest": True,
            }
        )
    return rows


def build_site_daily_rows(hourly_rows: Iterable[dict]) -> list[dict]:
    grouped: dict[tuple[int, int, date, str, date], list[dict]] = {}
    for row in hourly_rows:
        key = (
            row["site_id"],
            row["region_id"],
            row["base_date"],
            row["run_cycle"],
            row["forecast_date"],
        )
        grouped.setdefault(key, []).append(row)

    rows: list[dict] = []
    for key in sorted(grouped.keys()):
        site_id, region_id, base_date, run_cycle, forecast_date = key
        items = grouped[key]
        rows.append(
            {
                "site_id": site_id,
                "region_id": region_id,
                "base_date": base_date,
                "run_cycle": run_cycle,
                "forecast_date": forecast_date,
                "wind_speed_avg": daily_mean([item["wind_speed"] for item in items]),
                "wind_speed_max": daily_max([item["wind_speed"] for item in items]),
                "gust_max": daily_max([item["gust"] for item in items]),
                "wave_height_avg": daily_mean([item["wave_height"] for item in items]),
                "wave_height_max": daily_max([item["wave_height"] for item in items]),
                "wave_period_avg": daily_mean([item["wave_period"] for item in items]),
                "wind_dir_mean": daily_circular_mean([item["wind_dir"] for item in items]),
                "wave_dir_mean": daily_circular_mean([item["wave_dir"] for item in items]),
                "current_speed_avg": daily_mean([item["current_speed"] for item in items]),
                "current_speed_max": daily_max([item["current_speed"] for item in items]),
                "current_dir_mean": daily_circular_mean([item["current_dir"] for item in items]),
                "hour_count": len(items),
                "source_file_ids": items[0]["source_file_ids"],
                "is_latest": True,
            }
        )
    return rows


def has_region_current_values(row: dict) -> bool:
    return any(
        row.get(key) is not None
        for key in ("current_speed_avg", "current_speed_max", "current_dir_mean")
    )


def has_site_current_values(row: dict) -> bool:
    return any(row.get(key) is not None for key in ("current_speed", "current_dir"))


def build_region_current_hourly_rows(hourly_rows: Iterable[dict]) -> list[dict]:
    return [
        {
            "region_id": row["region_id"],
            "base_date": row["base_date"],
            "run_cycle": row["run_cycle"],
            "forecast_date": row["forecast_date"],
            "forecast_time": row["forecast_time"],
            "forecast_hour": row["forecast_hour"],
            "current_speed_avg": row["current_speed_avg"],
            "current_speed_max": row["current_speed_max"],
            "current_dir_mean": row["current_dir_mean"],
            "source_file_ids": row["source_file_ids"],
            "is_latest": True,
        }
        for row in hourly_rows
        if has_region_current_values(row)
    ]


def build_region_current_daily_rows(hourly_rows: Iterable[dict]) -> list[dict]:
    grouped: dict[tuple[int, date, str, date], list[dict]] = {}
    for row in hourly_rows:
        if not has_region_current_values(row):
            continue
        key = (row["region_id"], row["base_date"], row["run_cycle"], row["forecast_date"])
        grouped.setdefault(key, []).append(row)

    rows: list[dict] = []
    for key in sorted(grouped.keys()):
        region_id, base_date, run_cycle, forecast_date = key
        items = grouped[key]
        rows.append(
            {
                "region_id": region_id,
                "base_date": base_date,
                "run_cycle": run_cycle,
                "forecast_date": forecast_date,
                "current_speed_avg": daily_mean([item["current_speed_avg"] for item in items]),
                "current_speed_max": daily_max([item["current_speed_max"] for item in items]),
                "current_dir_mean": daily_circular_mean([item["current_dir_mean"] for item in items]),
                "hour_count": len(items),
                "source_file_ids": items[0]["source_file_ids"],
                "is_latest": True,
            }
        )
    return rows


def build_site_current_hourly_rows(hourly_rows: Iterable[dict]) -> list[dict]:
    return [
        {
            "site_id": row["site_id"],
            "region_id": row["region_id"],
            "base_date": row["base_date"],
            "run_cycle": row["run_cycle"],
            "forecast_date": row["forecast_date"],
            "forecast_time": row["forecast_time"],
            "forecast_hour": row["forecast_hour"],
            "current_speed": row["current_speed"],
            "current_dir": row["current_dir"],
            "source_file_ids": row["source_file_ids"],
            "is_latest": True,
        }
        for row in hourly_rows
        if has_site_current_values(row)
    ]


def build_site_current_daily_rows(hourly_rows: Iterable[dict]) -> list[dict]:
    grouped: dict[tuple[int, int, date, str, date], list[dict]] = {}
    for row in hourly_rows:
        if not has_site_current_values(row):
            continue
        key = (
            row["site_id"],
            row["region_id"],
            row["base_date"],
            row["run_cycle"],
            row["forecast_date"],
        )
        grouped.setdefault(key, []).append(row)

    rows: list[dict] = []
    for key in sorted(grouped.keys()):
        site_id, region_id, base_date, run_cycle, forecast_date = key
        items = grouped[key]
        rows.append(
            {
                "site_id": site_id,
                "region_id": region_id,
                "base_date": base_date,
                "run_cycle": run_cycle,
                "forecast_date": forecast_date,
                "current_speed_avg": daily_mean([item["current_speed"] for item in items]),
                "current_speed_max": daily_max([item["current_speed"] for item in items]),
                "current_dir_mean": daily_circular_mean([item["current_dir"] for item in items]),
                "hour_count": len(items),
                "source_file_ids": items[0]["source_file_ids"],
                "is_latest": True,
            }
        )
    return rows


def mark_previous_batches_not_latest(cur, base_date: date, run_cycle: str) -> None:
    cur.execute(
        """
        UPDATE region_forecasts_hourly
        SET is_latest = FALSE
        WHERE base_date <> %s OR run_cycle <> %s
        """,
        (base_date, run_cycle),
    )
    cur.execute(
        """
        UPDATE region_forecasts_daily
        SET is_latest = FALSE
        WHERE base_date <> %s OR run_cycle <> %s
        """,
        (base_date, run_cycle),
    )
    cur.execute(
        """
        UPDATE site_forecasts_hourly
        SET is_latest = FALSE
        WHERE base_date <> %s OR run_cycle <> %s
        """,
        (base_date, run_cycle),
    )
    cur.execute(
        """
        UPDATE site_forecasts_daily
        SET is_latest = FALSE
        WHERE base_date <> %s OR run_cycle <> %s
        """,
        (base_date, run_cycle),
    )


def mark_previous_current_batches_not_latest(cur, base_date: date, run_cycle: str) -> None:
    cur.execute(
        """
        UPDATE region_current_forecasts_hourly
        SET is_latest = FALSE
        WHERE base_date <> %s OR run_cycle <> %s
        """,
        (base_date, run_cycle),
    )
    cur.execute(
        """
        UPDATE region_current_forecasts_daily
        SET is_latest = FALSE
        WHERE base_date <> %s OR run_cycle <> %s
        """,
        (base_date, run_cycle),
    )
    cur.execute(
        """
        UPDATE site_current_forecasts_hourly
        SET is_latest = FALSE
        WHERE base_date <> %s OR run_cycle <> %s
        """,
        (base_date, run_cycle),
    )
    cur.execute(
        """
        UPDATE site_current_forecasts_daily
        SET is_latest = FALSE
        WHERE base_date <> %s OR run_cycle <> %s
        """,
        (base_date, run_cycle),
    )


def delete_current_batch_rows(cur, base_date: date, run_cycle: str) -> None:
    cur.execute(
        "DELETE FROM region_forecasts_hourly WHERE base_date = %s AND run_cycle = %s",
        (base_date, run_cycle),
    )
    cur.execute(
        "DELETE FROM region_forecasts_daily WHERE base_date = %s AND run_cycle = %s",
        (base_date, run_cycle),
    )
    cur.execute(
        "DELETE FROM site_forecasts_hourly WHERE base_date = %s AND run_cycle = %s",
        (base_date, run_cycle),
    )
    cur.execute(
        "DELETE FROM site_forecasts_daily WHERE base_date = %s AND run_cycle = %s",
        (base_date, run_cycle),
    )


def delete_current_batch_current_rows(cur, base_date: date, run_cycle: str) -> None:
    cur.execute(
        "DELETE FROM region_current_forecasts_hourly WHERE base_date = %s AND run_cycle = %s",
        (base_date, run_cycle),
    )
    cur.execute(
        "DELETE FROM region_current_forecasts_daily WHERE base_date = %s AND run_cycle = %s",
        (base_date, run_cycle),
    )
    cur.execute(
        "DELETE FROM site_current_forecasts_hourly WHERE base_date = %s AND run_cycle = %s",
        (base_date, run_cycle),
    )
    cur.execute(
        "DELETE FROM site_current_forecasts_daily WHERE base_date = %s AND run_cycle = %s",
        (base_date, run_cycle),
    )


def upsert_region_hourly_rows(cur, rows: Iterable[dict]) -> int:
    count = 0
    for row in rows:
        cur.execute(
            """
            INSERT INTO region_forecasts_hourly (
                region_id,
                base_date,
                run_cycle,
                forecast_date,
                forecast_time,
                forecast_hour,
                wind_speed_avg,
                wind_speed_max,
                wind_dir_mean,
                gust_max,
                wave_height_avg,
                wave_height_max,
                wave_period_avg,
                wave_dir_mean,
                current_speed_avg,
                current_speed_max,
                current_dir_mean,
                source_file_ids,
                is_latest
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (region_id, base_date, run_cycle, forecast_time)
            DO UPDATE SET
                forecast_date = EXCLUDED.forecast_date,
                forecast_hour = EXCLUDED.forecast_hour,
                wind_speed_avg = EXCLUDED.wind_speed_avg,
                wind_speed_max = EXCLUDED.wind_speed_max,
                wind_dir_mean = EXCLUDED.wind_dir_mean,
                gust_max = EXCLUDED.gust_max,
                wave_height_avg = EXCLUDED.wave_height_avg,
                wave_height_max = EXCLUDED.wave_height_max,
                wave_period_avg = EXCLUDED.wave_period_avg,
                wave_dir_mean = EXCLUDED.wave_dir_mean,
                current_speed_avg = EXCLUDED.current_speed_avg,
                current_speed_max = EXCLUDED.current_speed_max,
                current_dir_mean = EXCLUDED.current_dir_mean,
                source_file_ids = EXCLUDED.source_file_ids,
                is_latest = EXCLUDED.is_latest,
                updated_at = CURRENT_TIMESTAMP
            """,
            (
                row["region_id"],
                row["base_date"],
                row["run_cycle"],
                row["forecast_date"],
                row["forecast_time"],
                row["forecast_hour"],
                row["wind_speed_avg"],
                row["wind_speed_max"],
                row["wind_dir_mean"],
                row["gust_max"],
                row["wave_height_avg"],
                row["wave_height_max"],
                row["wave_period_avg"],
                row["wave_dir_mean"],
                row["current_speed_avg"],
                row["current_speed_max"],
                row["current_dir_mean"],
                Json(row["source_file_ids"]),
                row["is_latest"],
            ),
        )
        count += 1
    return count


def upsert_region_daily_rows(cur, rows: Iterable[dict]) -> int:
    count = 0
    for row in rows:
        cur.execute(
            """
            INSERT INTO region_forecasts_daily (
                region_id,
                base_date,
                run_cycle,
                forecast_date,
                wind_speed_avg,
                wind_speed_max,
                gust_max,
                wave_height_avg,
                wave_height_max,
                wave_period_avg,
                wind_dir_mean,
                wave_dir_mean,
                current_speed_avg,
                current_speed_max,
                current_dir_mean,
                hour_count,
                source_file_ids,
                is_latest
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (region_id, base_date, run_cycle, forecast_date)
            DO UPDATE SET
                wind_speed_avg = EXCLUDED.wind_speed_avg,
                wind_speed_max = EXCLUDED.wind_speed_max,
                gust_max = EXCLUDED.gust_max,
                wave_height_avg = EXCLUDED.wave_height_avg,
                wave_height_max = EXCLUDED.wave_height_max,
                wave_period_avg = EXCLUDED.wave_period_avg,
                wind_dir_mean = EXCLUDED.wind_dir_mean,
                wave_dir_mean = EXCLUDED.wave_dir_mean,
                current_speed_avg = EXCLUDED.current_speed_avg,
                current_speed_max = EXCLUDED.current_speed_max,
                current_dir_mean = EXCLUDED.current_dir_mean,
                hour_count = EXCLUDED.hour_count,
                source_file_ids = EXCLUDED.source_file_ids,
                is_latest = EXCLUDED.is_latest,
                updated_at = CURRENT_TIMESTAMP
            """,
            (
                row["region_id"],
                row["base_date"],
                row["run_cycle"],
                row["forecast_date"],
                row["wind_speed_avg"],
                row["wind_speed_max"],
                row["gust_max"],
                row["wave_height_avg"],
                row["wave_height_max"],
                row["wave_period_avg"],
                row["wind_dir_mean"],
                row["wave_dir_mean"],
                row["current_speed_avg"],
                row["current_speed_max"],
                row["current_dir_mean"],
                row["hour_count"],
                Json(row["source_file_ids"]),
                row["is_latest"],
            ),
        )
        count += 1
    return count


def upsert_site_hourly_rows(cur, rows: Iterable[dict]) -> int:
    count = 0
    for row in rows:
        cur.execute(
            """
            INSERT INTO site_forecasts_hourly (
                site_id,
                region_id,
                base_date,
                run_cycle,
                forecast_date,
                forecast_time,
                forecast_hour,
                wind_speed,
                wind_dir,
                gust,
                wave_height,
                wave_period,
                wave_dir,
                current_speed,
                current_dir,
                source_file_ids,
                is_latest
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (site_id, base_date, run_cycle, forecast_time)
            DO UPDATE SET
                region_id = EXCLUDED.region_id,
                forecast_date = EXCLUDED.forecast_date,
                forecast_hour = EXCLUDED.forecast_hour,
                wind_speed = EXCLUDED.wind_speed,
                wind_dir = EXCLUDED.wind_dir,
                gust = EXCLUDED.gust,
                wave_height = EXCLUDED.wave_height,
                wave_period = EXCLUDED.wave_period,
                wave_dir = EXCLUDED.wave_dir,
                current_speed = EXCLUDED.current_speed,
                current_dir = EXCLUDED.current_dir,
                source_file_ids = EXCLUDED.source_file_ids,
                is_latest = EXCLUDED.is_latest,
                updated_at = CURRENT_TIMESTAMP
            """,
            (
                row["site_id"],
                row["region_id"],
                row["base_date"],
                row["run_cycle"],
                row["forecast_date"],
                row["forecast_time"],
                row["forecast_hour"],
                row["wind_speed"],
                row["wind_dir"],
                row["gust"],
                row["wave_height"],
                row["wave_period"],
                row["wave_dir"],
                row["current_speed"],
                row["current_dir"],
                Json(row["source_file_ids"]),
                row["is_latest"],
            ),
        )
        count += 1
    return count


def upsert_site_daily_rows(cur, rows: Iterable[dict]) -> int:
    count = 0
    for row in rows:
        cur.execute(
            """
            INSERT INTO site_forecasts_daily (
                site_id,
                region_id,
                base_date,
                run_cycle,
                forecast_date,
                wind_speed_avg,
                wind_speed_max,
                gust_max,
                wave_height_avg,
                wave_height_max,
                wave_period_avg,
                wind_dir_mean,
                wave_dir_mean,
                current_speed_avg,
                current_speed_max,
                current_dir_mean,
                hour_count,
                source_file_ids,
                is_latest
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (site_id, base_date, run_cycle, forecast_date)
            DO UPDATE SET
                region_id = EXCLUDED.region_id,
                wind_speed_avg = EXCLUDED.wind_speed_avg,
                wind_speed_max = EXCLUDED.wind_speed_max,
                gust_max = EXCLUDED.gust_max,
                wave_height_avg = EXCLUDED.wave_height_avg,
                wave_height_max = EXCLUDED.wave_height_max,
                wave_period_avg = EXCLUDED.wave_period_avg,
                wind_dir_mean = EXCLUDED.wind_dir_mean,
                wave_dir_mean = EXCLUDED.wave_dir_mean,
                current_speed_avg = EXCLUDED.current_speed_avg,
                current_speed_max = EXCLUDED.current_speed_max,
                current_dir_mean = EXCLUDED.current_dir_mean,
                hour_count = EXCLUDED.hour_count,
                source_file_ids = EXCLUDED.source_file_ids,
                is_latest = EXCLUDED.is_latest,
                updated_at = CURRENT_TIMESTAMP
            """,
            (
                row["site_id"],
                row["region_id"],
                row["base_date"],
                row["run_cycle"],
                row["forecast_date"],
                row["wind_speed_avg"],
                row["wind_speed_max"],
                row["gust_max"],
                row["wave_height_avg"],
                row["wave_height_max"],
                row["wave_period_avg"],
                row["wind_dir_mean"],
                row["wave_dir_mean"],
                row["current_speed_avg"],
                row["current_speed_max"],
                row["current_dir_mean"],
                row["hour_count"],
                Json(row["source_file_ids"]),
                row["is_latest"],
            ),
        )
        count += 1
    return count


def upsert_region_current_hourly_rows(cur, rows: Iterable[dict]) -> int:
    count = 0
    for row in rows:
        cur.execute(
            """
            INSERT INTO region_current_forecasts_hourly (
                region_id,
                base_date,
                run_cycle,
                forecast_date,
                forecast_time,
                forecast_hour,
                current_speed_avg,
                current_speed_max,
                current_dir_mean,
                source_file_ids,
                is_latest
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (region_id, base_date, run_cycle, forecast_time)
            DO UPDATE SET
                forecast_date = EXCLUDED.forecast_date,
                forecast_hour = EXCLUDED.forecast_hour,
                current_speed_avg = EXCLUDED.current_speed_avg,
                current_speed_max = EXCLUDED.current_speed_max,
                current_dir_mean = EXCLUDED.current_dir_mean,
                source_file_ids = EXCLUDED.source_file_ids,
                is_latest = EXCLUDED.is_latest,
                updated_at = CURRENT_TIMESTAMP
            """,
            (
                row["region_id"],
                row["base_date"],
                row["run_cycle"],
                row["forecast_date"],
                row["forecast_time"],
                row["forecast_hour"],
                row["current_speed_avg"],
                row["current_speed_max"],
                row["current_dir_mean"],
                Json(row["source_file_ids"]),
                row["is_latest"],
            ),
        )
        count += 1
    return count


def upsert_region_current_daily_rows(cur, rows: Iterable[dict]) -> int:
    count = 0
    for row in rows:
        cur.execute(
            """
            INSERT INTO region_current_forecasts_daily (
                region_id,
                base_date,
                run_cycle,
                forecast_date,
                current_speed_avg,
                current_speed_max,
                current_dir_mean,
                hour_count,
                source_file_ids,
                is_latest
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (region_id, base_date, run_cycle, forecast_date)
            DO UPDATE SET
                current_speed_avg = EXCLUDED.current_speed_avg,
                current_speed_max = EXCLUDED.current_speed_max,
                current_dir_mean = EXCLUDED.current_dir_mean,
                hour_count = EXCLUDED.hour_count,
                source_file_ids = EXCLUDED.source_file_ids,
                is_latest = EXCLUDED.is_latest,
                updated_at = CURRENT_TIMESTAMP
            """,
            (
                row["region_id"],
                row["base_date"],
                row["run_cycle"],
                row["forecast_date"],
                row["current_speed_avg"],
                row["current_speed_max"],
                row["current_dir_mean"],
                row["hour_count"],
                Json(row["source_file_ids"]),
                row["is_latest"],
            ),
        )
        count += 1
    return count


def upsert_site_current_hourly_rows(cur, rows: Iterable[dict]) -> int:
    count = 0
    for row in rows:
        cur.execute(
            """
            INSERT INTO site_current_forecasts_hourly (
                site_id,
                region_id,
                base_date,
                run_cycle,
                forecast_date,
                forecast_time,
                forecast_hour,
                current_speed,
                current_dir,
                source_file_ids,
                is_latest
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (site_id, base_date, run_cycle, forecast_time)
            DO UPDATE SET
                region_id = EXCLUDED.region_id,
                forecast_date = EXCLUDED.forecast_date,
                forecast_hour = EXCLUDED.forecast_hour,
                current_speed = EXCLUDED.current_speed,
                current_dir = EXCLUDED.current_dir,
                source_file_ids = EXCLUDED.source_file_ids,
                is_latest = EXCLUDED.is_latest,
                updated_at = CURRENT_TIMESTAMP
            """,
            (
                row["site_id"],
                row["region_id"],
                row["base_date"],
                row["run_cycle"],
                row["forecast_date"],
                row["forecast_time"],
                row["forecast_hour"],
                row["current_speed"],
                row["current_dir"],
                Json(row["source_file_ids"]),
                row["is_latest"],
            ),
        )
        count += 1
    return count


def upsert_site_current_daily_rows(cur, rows: Iterable[dict]) -> int:
    count = 0
    for row in rows:
        cur.execute(
            """
            INSERT INTO site_current_forecasts_daily (
                site_id,
                region_id,
                base_date,
                run_cycle,
                forecast_date,
                current_speed_avg,
                current_speed_max,
                current_dir_mean,
                hour_count,
                source_file_ids,
                is_latest
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (site_id, base_date, run_cycle, forecast_date)
            DO UPDATE SET
                region_id = EXCLUDED.region_id,
                current_speed_avg = EXCLUDED.current_speed_avg,
                current_speed_max = EXCLUDED.current_speed_max,
                current_dir_mean = EXCLUDED.current_dir_mean,
                hour_count = EXCLUDED.hour_count,
                source_file_ids = EXCLUDED.source_file_ids,
                is_latest = EXCLUDED.is_latest,
                updated_at = CURRENT_TIMESTAMP
            """,
            (
                row["site_id"],
                row["region_id"],
                row["base_date"],
                row["run_cycle"],
                row["forecast_date"],
                row["current_speed_avg"],
                row["current_speed_max"],
                row["current_dir_mean"],
                row["hour_count"],
                Json(row["source_file_ids"]),
                row["is_latest"],
            ),
        )
        count += 1
    return count


def main() -> int:
    args = parse_args()
    target_date = normalize_date_arg(args.date)
    selected_data_types = parse_data_types(args.data_types)

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
            if target_date is None:
                target_date, run_cycle = latest_batch_key(cur, selected_data_types)
            else:
                run_cycle = args.run_cycle

            batch_files = load_batch_files(cur, target_date, run_cycle, selected_data_types)
            regions = load_region_definitions(cur)
            sites = load_site_definitions(cur)

        with ExitStack() as stack:
            fields = {
                element: open_forecast_field(batch_file, stack)
                for element, batch_file in batch_files.items()
            }

            wind_reference = pick_reference_field(fields, WIND_ELEMENTS)
            wave_reference = pick_reference_field(fields, WAVE_ELEMENTS)
            current_reference = pick_reference_field(fields, CURRENT_ELEMENTS)
            process_wind_wave = wind_reference is not None or wave_reference is not None
            process_current = current_reference is not None

            region_indices = build_region_spatial_indices(
                regions,
                wind_reference=wind_reference,
                wave_reference=wave_reference,
                current_reference=current_reference,
            )
            site_indices = build_site_spatial_indices(
                sites,
                wind_reference=wind_reference,
                wave_reference=wave_reference,
                current_reference=current_reference,
            )
            source_file_ids = [batch_files[element].file_id for element in sorted(batch_files.keys())]

            region_hourly_rows = build_region_hourly_rows(region_indices, fields, source_file_ids)
            region_hourly_rows = filter_full_day_rows(region_hourly_rows)
            region_daily_rows = build_region_daily_rows(region_hourly_rows)
            region_current_hourly_rows = build_region_current_hourly_rows(region_hourly_rows)
            region_current_daily_rows = build_region_current_daily_rows(region_hourly_rows)
            site_hourly_rows = build_site_hourly_rows(site_indices, fields, source_file_ids)
            site_hourly_rows = filter_full_day_rows(site_hourly_rows)
            site_daily_rows = build_site_daily_rows(site_hourly_rows)
            site_current_hourly_rows = build_site_current_hourly_rows(site_hourly_rows)
            site_current_daily_rows = build_site_current_daily_rows(site_hourly_rows)

        with conn.cursor() as cur:
            if process_wind_wave:
                mark_previous_batches_not_latest(cur, target_date, run_cycle)
                delete_current_batch_rows(cur, target_date, run_cycle)
            if process_current:
                mark_previous_current_batches_not_latest(cur, target_date, run_cycle)
                delete_current_batch_current_rows(cur, target_date, run_cycle)
            region_current_hourly_count = 0
            region_current_daily_count = 0
            site_current_hourly_count = 0
            site_current_daily_count = 0
            region_hourly_count = 0
            region_daily_count = 0
            site_hourly_count = 0
            site_daily_count = 0
            if process_wind_wave:
                region_hourly_count = upsert_region_hourly_rows(cur, region_hourly_rows)
                region_daily_count = upsert_region_daily_rows(cur, region_daily_rows)
                site_hourly_count = upsert_site_hourly_rows(cur, site_hourly_rows)
                site_daily_count = upsert_site_daily_rows(cur, site_daily_rows)
            if process_current:
                region_current_hourly_count = upsert_region_current_hourly_rows(cur, region_current_hourly_rows)
                region_current_daily_count = upsert_region_current_daily_rows(cur, region_current_daily_rows)
                site_current_hourly_count = upsert_site_current_hourly_rows(cur, site_current_hourly_rows)
                site_current_daily_count = upsert_site_current_daily_rows(cur, site_current_daily_rows)

        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    print(
        "done: processed batch "
        f"{target_date} {run_cycle}; "
        f"region_hourly={region_hourly_count}, "
        f"region_daily={region_daily_count}, "
        f"site_hourly={site_hourly_count}, "
        f"site_daily={site_daily_count}, "
        f"region_current_hourly={region_current_hourly_count}, "
        f"region_current_daily={region_current_daily_count}, "
        f"site_current_hourly={site_current_hourly_count}, "
        f"site_current_daily={site_current_daily_count}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
