"""Read exact required native grid cells from fixed-size NetCDF3 HTTP byte ranges.

The local file is explicitly a derived regional subset, NOT a complete global
download. Native coordinates, packed values, scale/offset and all times are kept;
unrequested cells are masked. Only the existing region masks and site nearest
neighbours are used, so overview statistics equal processing the full source.
"""
from __future__ import annotations

import email.policy
import json
import logging
import os
import re
import struct
import shutil
import tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from email.parser import BytesParser
from pathlib import Path

import numpy as np

LOG = logging.getLogger("hws945")
TYPE_BYTES = {1: 1, 2: 1, 3: 2, 4: 4, 5: 4, 6: 8}
DTYPES = {1: ">i1", 3: ">i2", 4: ">i4", 5: ">f4", 6: ">f8"}


class RangeUnsupported(ValueError):
    """The source is valid for full download but not this optional fast path."""


def classic_header(data):
    if data[:4] not in (b"CDF\x01", b"CDF\x02"):
        raise RangeUnsupported("Regional range mode requires NetCDF3 classic/64-bit-offset")
    version = data[3]
    pos = 4
    def uint():
        nonlocal pos
        result = struct.unpack_from(">I", data, pos)[0]
        pos += 4
        return result
    def name():
        nonlocal pos
        size = uint()
        value = data[pos:pos + size].decode("utf-8")
        pos += (size + 3) // 4 * 4
        return value
    def attrs():
        nonlocal pos
        tag, count = uint(), uint()
        if tag not in (0, 12):
            raise ValueError("Invalid NetCDF attribute list")
        for _ in range(count):
            name()
            kind, length = uint(), uint()
            if kind not in TYPE_BYTES:
                raise ValueError("Unsupported NetCDF attribute type")
            pos += (TYPE_BYTES[kind] * length + 3) // 4 * 4
    records = uint()
    tag, count = uint(), uint()
    if tag != 10:
        raise ValueError("Invalid NetCDF dimension list")
    dimensions = [(name(), uint()) for _ in range(count)]
    if records or any(size == 0 for _, size in dimensions):
        raise RangeUnsupported("Record/unlimited variables require full download mode")
    attrs()
    tag, count = uint(), uint()
    if tag != 11:
        raise ValueError("Invalid NetCDF variable list")
    variables = {}
    for _ in range(count):
        key = name()
        dim_ids = [uint() for _ in range(uint())]
        attrs()
        kind, size = uint(), uint()
        begin = uint() if version == 1 else (uint() << 32) | uint()
        variables[key] = dict(dimensions=tuple(dimensions[i][0] for i in dim_ids),
                              shape=tuple(dimensions[i][1] for i in dim_ids),
                              kind=kind, size=size, begin=begin)
    return variables


def byte_range(source, url, ranges, etag=None):
    header = "bytes=" + ",".join(f"{a}-{b}" for a, b in ranges)
    extra = {"Range": header}
    if etag:
        extra["If-Match"] = etag
    with source.request(url, extra_headers=extra) as response:
        if response.status != 206:
            raise RangeUnsupported("Source did not honor HTTP byte ranges")
        if etag and response.headers.get("ETag") not in (None, etag):
            raise ValueError("Source changed during range download")
        max_bytes = sum(b - a + 1 for a, b in ranges) + 1024 * len(ranges) + 4096
        body = response.read(max_bytes + 1)
        if len(body) > max_bytes:
            raise ValueError("Unexpected oversized range response")
        content_type = response.headers.get("Content-Type", "")
        if content_type.lower().startswith("multipart/byteranges"):
            msg = BytesParser(policy=email.policy.default).parsebytes(
                ("Content-Type: " + content_type + "\r\nMIME-Version: 1.0\r\n\r\n").encode("ascii") + body)
            parts = [(part["Content-Range"], part.get_payload(decode=True)) for part in msg.iter_parts()]
        else:
            parts = [(response.headers.get("Content-Range"), body)]
        result = {}
        for descriptor, payload in parts:
            match = re.fullmatch(r"bytes (\d+)-(\d+)/(\d+)", descriptor or "")
            if not match:
                raise ValueError("Invalid range response descriptor")
            span = int(match[1]), int(match[2])
            if span not in ranges or len(payload) != span[1] - span[0] + 1 or span in result:
                raise ValueError("Missing, duplicate or truncated range response")
            result[span] = payload
        if set(result) != set(ranges):
            raise ValueError("Incomplete multipart range response")
        return result, response.headers.get("ETag")


def needed_mask(lon, lat, definitions):
    from shapely.geometry import shape
    from automation.mining_overview.process_forecasts_batch import (
        build_region_window, normalize_geometry_longitudes, normalize_lon_value)
    mask = np.zeros((len(lon), len(lat)), dtype=bool)
    for region in definitions["regions"]:
        window = build_region_window(normalize_geometry_longitudes(shape(region["geometry_geojson"])), lon, lat)
        mask[window.lon_slice, window.lat_slice] |= window.mask
    for site in definitions["sites"]:
        mask[np.argmin(abs(lon - normalize_lon_value(site["lng"]))), np.argmin(abs(lat - site["lat"]))] = True
    return mask


def extract(source, day, element, directory, definitions, refresh=False):
    from netCDF4 import Dataset
    from automation.hws945.source import atomic_json, sha256, validate_file
    from automation.hws945.pipeline import fingerprint
    url = source.url(day, element)
    path = directory / f"{element}_{day:%Y%m%d}_t12.nc"
    provenance = path.with_suffix(".subset.json")
    definition_hash = fingerprint(definitions)
    if path.exists() and provenance.exists() and not refresh:
        info = json.loads(provenance.read_text("utf-8"))
        if info.get("definition_sha256") == definition_hash and info.get("local_sha256") == sha256(path):
            validate_file(path, day)
            return path
    prefix, etag = byte_range(source, url, [(0, 32767)])
    header = prefix[(0, 32767)]
    entries = classic_header(header)
    data_names = [n for n in entries if n not in ("time", "lon", "lat", "depth")]
    if len(data_names) != 1:
        raise ValueError("Expected exactly one NetCDF data variable")
    name = data_names[0]
    layout = entries[name]
    if layout["dimensions"] != ("time", "lon", "lat") or layout["kind"] not in DTYPES:
        raise RangeUnsupported("Unsupported byte-range variable layout; use full download mode")
    if any(entries[n]["begin"] + entries[n]["size"] > len(header) for n in ("time", "lon", "lat")):
        raise RangeUnsupported("Coordinate arrays exceed initial range header")
    total_size = max(v["begin"] + v["size"] for v in entries.values())
    with Dataset("hws945-header", memory=header + bytes(max(0, total_size - len(header)))) as ds:
        coordinates = {n: np.asarray(ds.variables[n][:]) for n in ("time", "lon", "lat")}
        coordinate_attrs = {n: {a: ds.variables[n].getncattr(a) for a in ds.variables[n].ncattrs()
                               if a != "_FillValue"} for n in coordinates}
        attrs = {a: ds.variables[name].getncattr(a) for a in ds.variables[name].ncattrs()}
    mask = needed_mask(coordinates["lon"], coordinates["lat"], definitions)
    cells = np.flatnonzero(mask.ravel())
    dtype = np.dtype(DTYPES[layout["kind"]])
    width = dtype.itemsize
    starts = cells * width
    # Coalesce small gaps to bound HTTP requests; only requested cells are retained.
    gap = int(source.config.get("subset_merge_gap_bytes", 32))
    cuts = np.flatnonzero(np.diff(starts) > width + gap)
    span_starts = np.r_[starts[0], starts[cuts + 1]]
    span_ends = np.r_[starts[cuts] + width - 1, starts[-1] + width - 1]
    count, lon_count, lat_count = layout["shape"]
    frame_bytes = lon_count * lat_count * width
    ranges = [(int(layout["begin"] + t * frame_bytes + a), int(layout["begin"] + t * frame_bytes + b))
              for t in range(count) for a, b in zip(span_starts, span_ends)]
    offsets = (layout["begin"] + np.arange(count)[:, None] * frame_bytes + starts[None, :]).ravel()
    packed = np.empty(len(offsets), dtype=dtype)
    seen = np.zeros(len(offsets), dtype=bool)
    batches, batch = [], []
    for span in ranges:
        if batch and (len(batch) >= 300 or len(str(batch)) + len(str(span)) > 6500):
            batches.append(batch)
            batch = []
        batch.append(span)
    if batch:
        batches.append(batch)
    cache_key = fingerprint({"etag": etag, "header_sha256": __import__("hashlib").sha256(header).hexdigest(),
                             "definitions": definition_hash, "gap": gap})[:24]
    cache_dir = directory / ".range_cache" / f"{element}_{cache_key}"
    cache_dir.mkdir(parents=True, exist_ok=True)
    def fetch_group(item):
        index, group = item
        cache = cache_dir / f"{index:04d}.npz"
        expected = np.concatenate([np.arange(*np.searchsorted(offsets, (a, b + 1))) for a, b in group])
        if cache.exists() and not refresh:
            with np.load(cache, allow_pickle=False) as saved:
                if np.array_equal(saved["indices"], expected) and len(saved["values"]) == len(expected):
                    return expected, saved["values"]
        for attempt in range(int(source.config.get("range_retries", 2))):
            try:
                parts, _ = byte_range(source, url, group, etag)
                break
            except Exception:
                if attempt + 1 == int(source.config.get("range_retries", 2)):
                    raise
        indices_list, values_list = [], []
        for (a, b), payload in sorted(parts.items()):
            left, right = np.searchsorted(offsets, (a, b + 1))
            indices_list.append(np.arange(left, right))
            values_list.append(np.frombuffer(payload, dtype=dtype)[((offsets[left:right] - a) // width).astype(int)])
        indices = np.concatenate(indices_list)
        values = np.concatenate(values_list)
        cache_part = cache.with_suffix(".npz.part")
        with cache_part.open("wb") as stream:
            np.savez_compressed(stream, indices=indices, values=values)
        os.replace(cache_part, cache)
        return indices, values
    workers = min(8, max(1, int(source.config.get("download_workers", 4))))
    LOG.info("%s %s retrieving %s native cells in %s small HTTP groups", day, element, len(cells), len(batches))
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = [pool.submit(fetch_group, item) for item in enumerate(batches)]
        completed = 0
        try:
            for future in as_completed(futures):
                indices, values = future.result()
                packed[indices] = values
                seen[indices] = True
                completed += 1
                if completed % 20 == 0 or completed == len(batches):
                    LOG.info("%s %s HTTP groups %s/%s", day, element, completed, len(batches))
        except Exception:
            # Do not drain dozens of queued network requests after the first failure.
            for future in futures:
                future.cancel()
            raise
    if not np.all(seen):
        raise ValueError("Required regional cells were not all received")
    directory.mkdir(parents=True, exist_ok=True)
    part = path.with_suffix(".nc.part")
    fill = attrs.get("_FillValue", -32767 if dtype.kind == "i" else -9999.0)
    # Some Windows netCDF/HDF5 builds cannot create files under non-ASCII paths.
    with tempfile.TemporaryDirectory(prefix="hws945_subset_") as work:
        ascii_path = Path(work) / "subset.nc"
        with Dataset(str(ascii_path), "w", format="NETCDF4") as ds:
            for coordinate, values in coordinates.items():
                ds.createDimension(coordinate, len(values))
                var = ds.createVariable(coordinate, values.dtype, (coordinate,))
                var.setncatts(coordinate_attrs[coordinate])
                var[:] = values
            tile_lon, tile_lat = min(16, lon_count), min(16, lat_count)
            var = ds.createVariable(name, dtype.newbyteorder("="), layout["dimensions"],
                                    fill_value=fill, zlib=True, complevel=2,
                                    chunksizes=(count, tile_lon, tile_lat))
            var.setncatts({k: v for k, v in attrs.items() if k != "_FillValue"})
            var.set_auto_maskandscale(False)
            # Store only populated spatial tiles, each containing all times. This
            # avoids repeatedly decompressing global time slabs for 48 site queries.
            cell_lon, cell_lat = cells // lat_count, cells % lat_count
            tiles_per_row = (lat_count + tile_lat - 1) // tile_lat
            tile_keys = (cell_lon // tile_lon) * tiles_per_row + cell_lat // tile_lat
            matrix = packed.reshape(count, len(cells))
            for key in np.unique(tile_keys):
                selected = np.flatnonzero(tile_keys == key)
                lo = int(key // tiles_per_row) * tile_lon
                la = int(key % tiles_per_row) * tile_lat
                height, width = min(tile_lon, lon_count - lo), min(tile_lat, lat_count - la)
                block = np.full((count, height, width), fill, dtype=dtype)
                block[:, cell_lon[selected] - lo, cell_lat[selected] - la] = matrix[:, selected]
                var[:, lo:lo + height, la:la + width] = block
            ds.setncattr("hws945_scope", "regional_subset_native_grid; other cells are masked")
            ds.setncattr("hws945_definition_sha256", definition_hash)
        shutil.copyfile(ascii_path, part)
    validate_file(part, day)
    os.replace(part, path)
    atomic_json(provenance, {"scope": "regional_subset_native_grid", "definition_sha256": definition_hash,
                            "source_etag": etag, "source_bytes": total_size,
                            "received_bytes": len(header) + sum(b - a + 1 for a, b in ranges),
                            "selected_cells": len(cells), "local_sha256": sha256(path)})
    LOG.info("%s %s subset: %s cells, %s source bytes fetched", day, element, len(cells),
             len(header) + sum(b - a + 1 for a, b in ranges))
    return path
