#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Daily downloader for HWS945 wind/wave NetCDF data.

What it does:
1. Queries the latest available date for each target dataset
2. Downloads wind and wave .nc files for that date
3. Stores files under project-root/data/raw/YYYY/MM/DD/

Run manually:
    python automation/wind_wave/download_daily_wind_wave.py
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from urllib.parse import urlencode
from urllib.request import Request, urlopen


PROJECT_ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = PROJECT_ROOT / "data" / "raw"

SITE_BASE = "https://www.hws945.com"
LATEST_DAYS_API = f"{SITE_BASE}/file/getLatestDaysHaveFiles"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Referer": f"{SITE_BASE}/web/download#",
}


TASKS = [
    {
        "label": "wind",
        "condition": "atmo",
        "area": "ncfile_12z",
        "type": "atmo",
        "elements": ["gust", "wdir", "wspd"],
        "time_suffix": "t12",
    },
    {
        "label": "wave",
        "condition": "wave",
        "area": "ncfile_12z",
        "type": "wave",
        "elements": ["dire", "perd", "sigh"],
        "time_suffix": "t12",
    },
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--date",
        help="Target date in YYYY-MM-DD or YYYYMMDD format. Defaults to the latest available date.",
    )
    return parser.parse_args()


def normalize_date_arg(date_arg: str | None) -> str | None:
    if not date_arg:
        return None
    normalized = date_arg.replace("-", "")
    if len(normalized) != 8 or not normalized.isdigit():
        raise ValueError("Date must be YYYY-MM-DD or YYYYMMDD")
    return normalized


def parse_jsonp(text: str) -> Dict:
    match = re.search(r"fileHandler\((.*)\)\s*;?\s*$", text, re.S)
    if not match:
        raise ValueError("Unexpected JSONP response")
    payload_text = match.group(1).strip()
    payload_text = re.sub(r",\s*}", "}", payload_text)
    payload_text = re.sub(r",\s*]", "]", payload_text)
    payload_text = re.sub(
        r"([{\s,])([A-Za-z_][A-Za-z0-9_]*)\s*:",
        r'\1"\2":',
        payload_text,
    )
    return json.loads(payload_text)


def latest_date(condition: str, area: str, file_name: str) -> Optional[str]:
    params = {
        "condition": condition,
        "area": area,
        "fileName": file_name,
        "callback": "fileHandler",
        "_": int(datetime.now().timestamp() * 1000),
    }

    url = f"{LATEST_DAYS_API}?{urlencode(params)}"
    req = Request(url, headers=HEADERS, method="GET")
    with urlopen(req, timeout=30) as resp:
        text = resp.read().decode("utf-8", errors="replace")

    payload = parse_jsonp(text)
    data = payload.get("data") or []
    return data[0] if data else None


def build_file_url(
    area: str,
    data_type: str,
    date_yyyymmdd: str,
    element: str,
    time_suffix: str,
) -> str:
    return (
        f"{SITE_BASE}/{area}/{data_type}/{date_yyyymmdd}/"
        f"{element}_{date_yyyymmdd}_{time_suffix}.nc"
    )


def download_file(url: str, out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    req = Request(url, headers=HEADERS, method="GET")
    with urlopen(req, timeout=300) as resp:
        with out_path.open("wb") as file_obj:
            while True:
                chunk = resp.read(1024 * 1024)
                if not chunk:
                    break
                file_obj.write(chunk)


def run_task(task: Dict, target_date: str | None = None) -> tuple[str | None, List[Path]]:
    saved_paths: List[Path] = []
    if target_date:
        latest = target_date
        print(f"\n[{task['label']}] using target date: {latest}")
    else:
        print(f"\n[{task['label']}] checking latest date...")
        latest = latest_date(task["condition"], task["area"], task["elements"][0])

    if not latest:
        print(f"[{task['label']}] no available date found")
        return None, saved_paths

    if not target_date:
        print(f"[{task['label']}] latest date: {latest}")
    year = latest[:4]
    month = latest[4:6]
    day = latest[6:8]
    out_dir = RAW_DIR / year / month / day

    for element in task["elements"]:
        filename = f"{element}_{latest}_{task['time_suffix']}.nc"
        out_path = out_dir / filename
        if out_path.exists() and out_path.stat().st_size > 1024:
            print(f"[{task['label']}] skip existing: {out_path}")
            saved_paths.append(out_path)
            continue

        url = build_file_url(
            task["area"],
            task["type"],
            latest,
            element,
            task["time_suffix"],
        )
        print(f"[{task['label']}] downloading: {url}")
        download_file(url, out_path)
        print(f"[{task['label']}] saved: {out_path}")
        saved_paths.append(out_path)

    return latest, saved_paths


def download_batch(target_date: str | None = None) -> tuple[str, List[Path]]:
    all_paths: List[Path] = []
    resolved_dates: dict[str, str] = {}

    for task in TASKS:
        resolved_date, paths = run_task(task, target_date=target_date)
        if resolved_date:
            resolved_dates[task["label"]] = resolved_date
        all_paths.extend(paths)

    if not resolved_dates:
        raise RuntimeError("No datasets were downloaded")

    unique_dates = sorted(set(resolved_dates.values()))
    if len(unique_dates) != 1:
        raise RuntimeError(
            "Wind and wave resolved to different batch dates: "
            + ", ".join(f"{label}={date}" for label, date in resolved_dates.items())
        )

    return unique_dates[0], all_paths


def main() -> int:
    args = parse_args()
    try:
        resolved_date, all_paths = download_batch(normalize_date_arg(args.date))
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    print(f"\nDone. batch_date={resolved_date}")
    for path in all_paths:
        print(path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
