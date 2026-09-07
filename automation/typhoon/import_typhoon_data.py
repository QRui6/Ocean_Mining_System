#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
IBTrACS 台风历史数据处理与入库脚本。

默认行为：
1. 读取 dataDownlaod/ibtracs.since1980.list.v04r01.csv
2. 跳过第 2 行单位说明
3. 清洗字段、转换类型、删除无效经纬度
4. 生成两份适合系统使用的 CSV：
   - processed/typhoon_events.csv，一场台风一行
   - processed/typhoon_track_points.csv，一个轨迹时间点一行

可选行为：
- 加 --import-db 后，自动建表并导入 PostgreSQL/PostGIS。
- 加 --basin WP 可只处理西北太平洋数据；默认处理全部海盆。
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path
from typing import Iterable

import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_CSV = BASE_DIR / "dataDownlaod" / "ibtracs.since1980.list.v04r01.csv"
DEFAULT_OUT_DIR = BASE_DIR / "dataDownlaod" / "processed"

DB_CONFIG = {
    "host": os.getenv("PGHOST", "127.0.0.1"),
    "port": int(os.getenv("PGPORT", "5432")),
    "database": os.getenv("PGDATABASE", "ship_monitoring"),
    "user": os.getenv("PGUSER", "postgres"),
    "password": os.getenv("PGPASSWORD", ""),
}

KEEP_COLUMNS = [
    "SID",
    "SEASON",
    "NUMBER",
    "BASIN",
    "SUBBASIN",
    "NAME",
    "ISO_TIME",
    "NATURE",
    "LAT",
    "LON",
    "WMO_WIND",
    "WMO_PRES",
    "DIST2LAND",
    "LANDFALL",
    "STORM_SPEED",
    "STORM_DIR",
]

NUMERIC_COLUMNS = [
    "SEASON",
    "NUMBER",
    "LAT",
    "LON",
    "WMO_WIND",
    "WMO_PRES",
    "DIST2LAND",
    "LANDFALL",
    "STORM_SPEED",
    "STORM_DIR",
]

EVENT_COLUMNS = [
    "sid",
    "season",
    "number",
    "basin",
    "subbasin",
    "name",
    "start_time",
    "end_time",
    "max_wind",
    "min_pres",
    "point_count",
]

POINT_COLUMNS = [
    "sid",
    "iso_time",
    "lat",
    "lon",
    "nature",
    "wmo_wind",
    "wmo_pres",
    "dist2land",
    "landfall",
    "storm_speed",
    "storm_dir",
]


def read_and_clean(csv_path: Path, basin: str | None = None, start_year: int | None = None, end_year: int | None = None) -> pd.DataFrame:
    """读取并清洗 IBTrACS 原始 CSV。"""
    print(f"读取原始文件: {csv_path}")
    df = pd.read_csv(csv_path, skiprows=[1], low_memory=False)

    missing = [col for col in KEEP_COLUMNS if col not in df.columns]
    if missing:
        raise ValueError(f"原始文件缺少字段: {missing}")

    df = df[KEEP_COLUMNS].copy()

    for col in NUMERIC_COLUMNS:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df["ISO_TIME"] = pd.to_datetime(df["ISO_TIME"], errors="coerce", utc=True)

    before = len(df)
    df = df.dropna(subset=["SID", "ISO_TIME", "LAT", "LON"])
    df = df[(df["LON"] >= -180) & (df["LON"] <= 360)]
    df = df[(df["LAT"] >= -90) & (df["LAT"] <= 90)]

    if basin:
        df = df[df["BASIN"] == basin]

    if start_year is not None:
        df = df[df["SEASON"] >= start_year]

    if end_year is not None:
        df = df[df["SEASON"] <= end_year]

    df = df.sort_values(["SID", "ISO_TIME"]).reset_index(drop=True)
    print(f"清洗完成: 原始 {before} 行 -> 有效 {len(df)} 行")
    if basin:
        print(f"已筛选海盆: {basin}")
    if start_year is not None or end_year is not None:
        print(f"已筛选年份: {start_year or ''} - {end_year or ''}")
    return df


def build_events(df: pd.DataFrame) -> pd.DataFrame:
    """将轨迹点按 SID 聚合成台风事件表。"""
    events = (
        df.groupby("SID", as_index=False)
        .agg(
            SEASON=("SEASON", "first"),
            NUMBER=("NUMBER", "first"),
            BASIN=("BASIN", "first"),
            SUBBASIN=("SUBBASIN", "first"),
            NAME=("NAME", "first"),
            start_time=("ISO_TIME", "min"),
            end_time=("ISO_TIME", "max"),
            max_wind=("WMO_WIND", "max"),
            min_pres=("WMO_PRES", "min"),
            point_count=("SID", "size"),
        )
        .rename(
            columns={
                "SID": "sid",
                "SEASON": "season",
                "NUMBER": "number",
                "BASIN": "basin",
                "SUBBASIN": "subbasin",
                "NAME": "name",
            }
        )
    )

    events["season"] = events["season"].astype("Int64")
    events["number"] = events["number"].astype("Int64")
    events["point_count"] = events["point_count"].astype("Int64")
    return events[EVENT_COLUMNS]


def build_track_points(df: pd.DataFrame) -> pd.DataFrame:
    """生成轨迹点表。"""
    points = df.rename(
        columns={
            "SID": "sid",
            "ISO_TIME": "iso_time",
            "LAT": "lat",
            "LON": "lon",
            "NATURE": "nature",
            "WMO_WIND": "wmo_wind",
            "WMO_PRES": "wmo_pres",
            "DIST2LAND": "dist2land",
            "LANDFALL": "landfall",
            "STORM_SPEED": "storm_speed",
            "STORM_DIR": "storm_dir",
        }
    )
    return points[POINT_COLUMNS]


def write_outputs(events: pd.DataFrame, points: pd.DataFrame, out_dir: Path) -> tuple[Path, Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    events_path = out_dir / "typhoon_events.csv"
    points_path = out_dir / "typhoon_track_points.csv"

    events.to_csv(events_path, index=False, encoding="utf-8")
    points.to_csv(points_path, index=False, encoding="utf-8")

    print(f"事件表已输出: {events_path} ({len(events)} 行)")
    print(f"轨迹点表已输出: {points_path} ({len(points)} 行)")
    return events_path, points_path


def connect_db():
    try:
        import psycopg2
    except ImportError as exc:
        raise RuntimeError("未安装 psycopg2，入库前请先运行: pip install psycopg2-binary") from exc
    return psycopg2.connect(**DB_CONFIG)


def create_tables(conn) -> None:
    """创建台风事件表和轨迹点表。"""
    ddl = """
    CREATE EXTENSION IF NOT EXISTS postgis;

    CREATE TABLE IF NOT EXISTS typhoon_events (
        sid VARCHAR(50) PRIMARY KEY,
        season INTEGER,
        number INTEGER,
        basin VARCHAR(10),
        subbasin VARCHAR(10),
        name VARCHAR(100),
        start_time TIMESTAMP WITH TIME ZONE,
        end_time TIMESTAMP WITH TIME ZONE,
        max_wind DECIMAL(8, 2),
        min_pres DECIMAL(8, 2),
        point_count INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS typhoon_track_points (
        id BIGSERIAL PRIMARY KEY,
        sid VARCHAR(50) REFERENCES typhoon_events(sid) ON DELETE CASCADE,
        iso_time TIMESTAMP WITH TIME ZONE,
        lat DECIMAL(9, 5),
        lon DECIMAL(9, 5),
        geom GEOMETRY(POINT, 4326),
        nature VARCHAR(20),
        wmo_wind DECIMAL(8, 2),
        wmo_pres DECIMAL(8, 2),
        dist2land DECIMAL(10, 2),
        landfall DECIMAL(10, 2),
        storm_speed DECIMAL(8, 2),
        storm_dir DECIMAL(8, 2)
    );

    CREATE INDEX IF NOT EXISTS idx_typhoon_events_season ON typhoon_events(season);
    CREATE INDEX IF NOT EXISTS idx_typhoon_events_basin ON typhoon_events(basin);
    CREATE INDEX IF NOT EXISTS idx_typhoon_events_name ON typhoon_events(name);
    CREATE INDEX IF NOT EXISTS idx_typhoon_track_sid_time ON typhoon_track_points(sid, iso_time);
    CREATE INDEX IF NOT EXISTS idx_typhoon_track_time ON typhoon_track_points(iso_time);
    CREATE INDEX IF NOT EXISTS idx_typhoon_track_geom ON typhoon_track_points USING GIST(geom);
    """
    with conn.cursor() as cur:
        cur.execute(ddl)
    conn.commit()
    print("数据库表结构已准备完成")


def truncate_tables(conn) -> None:
    with conn.cursor() as cur:
        cur.execute("TRUNCATE TABLE typhoon_track_points, typhoon_events RESTART IDENTITY CASCADE;")
    conn.commit()
    print("已清空旧台风数据")


def copy_csv(conn, table: str, columns: Iterable[str], csv_path: Path) -> None:
    cols = ", ".join(columns)
    sql = f"COPY {table} ({cols}) FROM STDIN WITH CSV HEADER NULL ''"
    with conn.cursor() as cur:
        with csv_path.open("r", encoding="utf-8") as f:
            cur.copy_expert(sql, f)
    conn.commit()


def import_to_db(events_path: Path, points_path: Path, truncate: bool = False) -> None:
    print("连接 PostgreSQL 数据库...")
    conn = connect_db()
    try:
        create_tables(conn)
        if truncate:
            truncate_tables(conn)

        print("导入 typhoon_events...")
        copy_csv(conn, "typhoon_events", EVENT_COLUMNS, events_path)

        print("导入 typhoon_track_points...")
        copy_csv(conn, "typhoon_track_points", POINT_COLUMNS, points_path)

        print("生成 PostGIS 点几何字段 geom...")
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE typhoon_track_points
                SET geom = ST_SetSRID(ST_MakePoint(lon, lat), 4326)
                WHERE geom IS NULL;
                """
            )
        conn.commit()
        print("数据库导入完成")
    finally:
        conn.close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="处理并导入 IBTrACS 台风历史数据")
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV, help="IBTrACS 原始 CSV 路径")
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR, help="处理后 CSV 输出目录")
    parser.add_argument("--basin", default=None, help="只处理指定海盆，例如 WP；不传则处理全部")
    parser.add_argument("--start-year", type=int, default=None, help="起始年份，例如 2000")
    parser.add_argument("--end-year", type=int, default=None, help="结束年份，例如 2025；不传则到最新年份")
    parser.add_argument("--import-db", action="store_true", help="处理完成后导入 PostgreSQL/PostGIS")
    parser.add_argument("--truncate", action="store_true", help="入库前清空旧台风数据")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.csv.exists():
        raise FileNotFoundError(f"找不到原始 CSV: {args.csv}")

    df = read_and_clean(args.csv, basin=args.basin, start_year=args.start_year, end_year=args.end_year)
    events = build_events(df)
    points = build_track_points(df)
    events_path, points_path = write_outputs(events, points, args.out_dir)

    print("\n处理结果预览:")
    print(events.head().to_string(index=False))

    if args.import_db:
        import_to_db(events_path, points_path, truncate=args.truncate)
    else:
        print("\n未执行入库。如需入库，请加参数: --import-db")


if __name__ == "__main__":
    main()





