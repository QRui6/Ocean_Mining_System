#!/usr/bin/env python
"""Attempt each HWS945 wind/wave element independently; import only successful data."""
from __future__ import annotations

import argparse
import json
import logging
import sys
from contextlib import ExitStack
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from automation.hws945 import pipeline
from automation.hws945.source import ELEMENTS, atomic_json

LOG = logging.getLogger("hws945.daily")
SUCCESS = ("applied", "already_applied", "exported", "available")


def parser():
    p = pipeline.parser()
    p.description = __doc__
    p.set_defaults(mode="import", datasets="wind,wave", regional_subset=True)
    return p


def run(args):
    args.output_dir.mkdir(parents=True, exist_ok=True)
    requested = [(dataset, element) for dataset in args.datasets.split(",") for element in ELEMENTS[dataset]]
    if args.elements is not None:
        selected = [e.strip() for e in args.elements.split(",") if e.strip()]
        if not selected or len(set(selected)) != len(selected) or not set(selected).issubset(e for _, e in requested):
            raise ValueError("Invalid daily element selection")
        requested = [(ds, e) for ds, e in requested if e in selected]
    report = {"task_kind": "hws945_daily_independent_elements", "mode": args.mode,
              "generated_at": datetime.now(pipeline.CHINA).isoformat(),
              "requested_elements": [e for _, e in requested], "elements": [], "database_writes": False}
    report_path = args.output_dir / "report.json"
    atomic_json(report_path, report)
    snapshot = None
    if not args.probe_only:
        try:
            definitions = (pipeline.validate_definitions(json.loads(args.definitions_json.read_text("utf-8")))
                           if args.definitions_json else pipeline.read_definitions(args.db_config))
            snapshot = args.output_dir / "definitions.json"
            atomic_json(snapshot, definitions)
        except Exception as exc:
            report.update(status="failed", error_type=type(exc).__name__, reason="definition_snapshot_failed")
            atomic_json(report_path, report)
            LOG.error("Cannot read region/site definitions (%s)", type(exc).__name__)
            return 1
    for dataset, element in requested:
        result = {"dataset": dataset, "element": element}
        report["elements"].append(result)
        child = argparse.Namespace(**vars(args))
        child.datasets, child.elements = dataset, element
        child.output_dir = args.output_dir / "elements" / element
        child.definitions_json = snapshot
        LOG.info("Attempting %s (%s)", element, dataset)
        try:
            code = pipeline.run(child)
            detail_path = child.output_dir / "report.json"
            detail = json.loads(detail_path.read_text("utf-8"))
            result.update(exit_code=code, report_file=str(detail_path.resolve()), batches=detail.get("batches", []))
            report["database_writes"] |= detail.get("database_writes", False)
            successes = [b for b in detail.get("batches", []) if b.get("status") in SUCCESS]
            if successes:
                newest = max(successes, key=lambda b: b["date"])
                result["status"] = newest["status"]
                result["batch_date"] = newest["date"]
                result["sql_file"] = newest.get("sql_file")
            elif any(b.get("status") == "failed" for b in detail.get("batches", [])):
                result["status"] = "failed"
            else:
                result["status"] = "skipped"
                result["reason"] = "no_available_data_in_requested_dates"
        except Exception as exc:
            result.update(status="failed", error_type=type(exc).__name__)
            LOG.warning("Skipping %s after %s", element, type(exc).__name__)
        finally:
            atomic_json(report_path, report)
    report["success_count"] = sum(e["status"] in SUCCESS for e in report["elements"])
    report["skipped_count"] = sum(e["status"] == "skipped" for e in report["elements"])
    report["failed_count"] = sum(e["status"] == "failed" for e in report["elements"])
    report["status"] = "completed" if report["success_count"] else "no_successful_elements"
    report["latest_element_batches"] = {e["element"]: e["batch_date"] for e in report["elements"] if e["status"] in SUCCESS}
    atomic_json(report_path, report)
    LOG.info("Finished: success=%s skipped=%s failed=%s", report["success_count"], report["skipped_count"], report["failed_count"])
    return 0 if report["success_count"] else 2


def main(argv=None):
    args = parser().parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    try:
        with ExitStack() as locks:
            locks.enter_context(pipeline.process_lock(args.output_dir / ".hws945.lock"))
            if not args.probe_only and args.raw_dir.resolve() != args.output_dir.resolve():
                locks.enter_context(pipeline.process_lock(args.raw_dir / ".hws945.lock"))
            return run(args)
    except Exception as exc:
        LOG.error("Daily update stopped (%s)", type(exc).__name__)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
