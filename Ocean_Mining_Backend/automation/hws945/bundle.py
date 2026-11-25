"""Package verified real SQL, availability evidence and derived wave files; no DB access."""
from __future__ import annotations

import argparse
import json
import shutil
import sys
import zipfile
from datetime import timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from automation.hws945.pipeline import parse_day
from automation.hws945.source import atomic_json, sha256
from automation.hws945.sql_export import TABLES


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--export-dir", type=Path, required=True)
    p.add_argument("--probe-report", type=Path, required=True)
    p.add_argument("--start-date", type=parse_day, required=True)
    p.add_argument("--end-date", type=parse_day, required=True)
    p.add_argument("--output-dir", type=Path, required=True)
    p.add_argument("--raw-dir", type=Path, default=ROOT / "data" / "hws945" / "raw")
    args = p.parse_args()
    current = json.loads((args.export_dir / "report.json").read_text("utf-8"))
    probe = json.loads(args.probe_report.read_text("utf-8"))
    if "complete_count" not in current or current.get("mode") != "export" or current.get("database_writes"):
        raise ValueError("Expected a finished export-only report")
    args.output_dir.mkdir(parents=True, exist_ok=True)
    copied = []
    def copy(source, relative):
        target = args.output_dir / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
        copied.append(target)
        return target
    evidence = {b["date"]: b for b in probe["batches"]}
    fresh = {b["date"]: b for b in current["batches"]}
    summary = {"requested_start": str(args.start_date), "requested_end": str(args.end_date),
               "datasets": ["wave"], "elements": ["sigh", "dire", "perd"],
               "database_writes": False, "forecast_time_basis": "UTC",
               "tables": {t: 0 for t in ("weather_files", "weather_file_metadata") + TABLES},
               "batches": [], "exported_dates": [], "not_exported_dates": []}
    for i in range((args.end_date - args.start_date).days + 1):
        day = args.start_date + timedelta(days=i)
        key = str(day)
        record = fresh.get(key, evidence.get(key, {"date": key, "status": "not_checked"})).copy()
        if record.get("status") == "exported":
            source = Path(record["sql_file"])
            if source.name != f"hws945_{day:%Y%m%d}_t12_wave.sql" or sha256(source) != record["sql_sha256"]:
                raise ValueError("SQL verification failed: " + key)
            target = copy(source, Path("sql") / source.name)
            record["sql_file"] = target.relative_to(args.output_dir).as_posix()
            for table in TABLES:
                summary["tables"][table] += record["row_counts"][table]
            summary["tables"]["weather_files"] += 3
            summary["tables"]["weather_file_metadata"] += 3
            raw = args.raw_dir / day.strftime("%Y/%m/%d")
            for element in ("sigh", "dire", "perd"):
                name = f"{element}_{day:%Y%m%d}_t12.nc"
                if sha256(raw / name) != record["sha256"][name]:
                    raise ValueError("Derived source verification failed: " + name)
                relative = Path("backend/data/hws945/raw") / day.strftime("%Y/%m/%d") / name
                copy(raw / name, relative)
                copy((raw / name).with_suffix(".subset.json"), relative.with_suffix(".subset.json"))
            summary["exported_dates"].append(key)
        else:
            summary["not_exported_dates"].append(key)
        summary["batches"].append(record)
    combined = args.output_dir / "all_batches.sql"
    with combined.open("w", encoding="utf-8", newline="\n") as stream:
        stream.write("-- HWS945 real wave forecasts only; each batch is an independent transaction.\n")
        stream.write(f"-- Requested batch dates: {args.start_date} through {args.end_date}; missing dates are in report.json.\n")
        for record in summary["batches"]:
            if record.get("status") == "exported":
                stream.write((args.output_dir / record["sql_file"]).read_text("utf-8") + "\n")
    copied.append(combined)
    copy(args.export_dir / "definitions.json", Path("definitions.json"))
    copy(args.probe_report, Path("availability_report.json"))
    proof = ROOT / "data/hws945/source_sample_verification.json"
    if proof.exists():
        copy(proof, Path(proof.name))
    # Only explicitly listed public scripts/examples; never package *.local.* credentials.
    script_dir = Path(__file__).parent
    for name in ("pipeline.py", "daily.py", "source.py", "regional_subset.py", "sql_export.py", "bundle.py",
                 "run_daily.ps1", "install_daily_task.ps1", "remove_daily_task.ps1", "daily.example.ps1",
                 "database.example.json", "source.example.json", "requirements.txt", "README.md"):
        copy(script_dir / name, Path("backend/automation/hws945") / name)
    copy(script_dir / "processor-mask.patch", Path("backend/automation/hws945/processor-mask.patch"))
    summary["exported_count"] = len(summary["exported_dates"])
    summary["not_exported_count"] = len(summary["not_exported_dates"])
    summary["total_forecast_rows"] = sum(summary["tables"][t] for t in TABLES)
    atomic_json(args.output_dir / "report.json", summary)
    copied.append(args.output_dir / "report.json")
    readme = args.output_dir / "使用说明.txt"
    readme.write_text(
        "HWS945 海浪手动更新包\n\n"
        f"请求起报日期：{args.start_date} 至 {args.end_date}。\n"
        f"真实导出 {summary['exported_count']} 个批次，未导出 {summary['not_exported_count']} 天，详见 report.json。\n"
        f"预报结果 {summary['total_forecast_rows']:,} 行，另外每批 3 条文件登记、3 条文件元数据。\n\n"
        "执行 all_batches.sql 可导入全部实际可用批次；sql/ 下也有分日期文件，二者择一即可。\n"
        "本次没有执行业务入库。文件为 PostgreSQL SQL，每批独立事务。\n"
        "目标库需已有项目表结构、PostGIS、区域和站点数据；脚本会检查几何/坐标并按编码重新匹配 ID。\n"
        "只更新海浪字段，保留同键已有风场和洋流值；新批次不会伪造缺少的风场值。\n"
        "不更新 weather_metadata/wind_data/wave_data 地图网格，不生成公报预警。\n"
        "原始精度区域派生文件位于 backend/data/hws945/raw，未请求的全球网格为缺测，不是全球完整文件。\n"
        "如需另一台机器重处理，将该目录复制到现有项目 backend 的同一路径。\n"
        "backend/automation/hws945 是新增脚本，依赖现有项目的 mining_overview/process_forecasts_batch.py 和 wind_wave/register_weather_batch.py。\n"
        "迁移脚本到其他机器时，还需同步 processor-mask.patch 中的 NetCDF 缺测值修复；当前工作区已应用。\n"
        "每日任务脚本已经准备，但本次没有安装或启用；先完成手动更新，再按 README.md 配置和安装。\n"
        "每日任务逐一尝试风速、风向、阵风、波高、波向和周期；某项异常只跳过该项，其他可用数据照常处理入库。\n"
        "本包不包含本机数据库密码、Cookie 或 *.local.* 配置。\n",
        encoding="utf-8")
    copied.append(readme)
    sums = args.output_dir / "SHA256SUMS.txt"
    sums.write_text("\n".join(sha256(f) + "  " + f.relative_to(args.output_dir).as_posix() for f in sorted(copied)) + "\n", encoding="utf-8")
    copied.append(sums)
    archive = args.output_dir.with_suffix(".zip")
    with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as out:
        for f in copied:
            out.write(f, f.relative_to(args.output_dir))
    print(json.dumps({"archive": str(archive.resolve()), "sql": str(combined.resolve()),
                      "batches": summary["exported_count"], "missing_dates": summary["not_exported_count"],
                      "row_counts": summary["tables"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
