-- ========================================
-- 历史台风表（事件 + 轨迹点）
-- 说明：原建表脚本里缺失这两张表（数据库里存在，但脚本无法重建），
--       本文件按 2026-11-13 本机库 ship_monitoring 的实际结构补全。
-- 依赖：PostGIS（geom 为 geometry(Point,4326)）
-- 执行顺序：放在 database_mining_areas.sql 之后、optimize_typhoon_queries.sql 之前
-- ========================================

CREATE TABLE IF NOT EXISTS typhoon_events (
    sid          VARCHAR(50) PRIMARY KEY,   -- IBTrACS 事件编号，如 2010169N13266
    season       INTEGER,                   -- 年份
    number       INTEGER,                   -- 当年序号
    basin        VARCHAR(10),
    subbasin     VARCHAR(10),
    name         VARCHAR(100),
    start_time   TIMESTAMPTZ,
    end_time     TIMESTAMPTZ,
    max_wind     NUMERIC,
    min_pres     NUMERIC,
    point_count  INTEGER,
    created_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS typhoon_track_points (
    id           BIGSERIAL PRIMARY KEY,
    sid          VARCHAR(50) REFERENCES typhoon_events(sid) ON DELETE CASCADE,
    iso_time     TIMESTAMPTZ,
    lat          NUMERIC(9,5),
    lon          NUMERIC(9,5),
    geom         GEOMETRY(Point,4326),
    nature       VARCHAR(20),
    wmo_wind     NUMERIC,
    wmo_pres     NUMERIC,
    dist2land    NUMERIC,
    landfall     NUMERIC,
    storm_speed  NUMERIC,
    storm_dir    NUMERIC
);

CREATE INDEX IF NOT EXISTS idx_typhoon_events_season ON typhoon_events (season);
CREATE INDEX IF NOT EXISTS idx_typhoon_events_season_sid ON typhoon_events (season, sid);
CREATE INDEX IF NOT EXISTS idx_typhoon_events_basin ON typhoon_events (basin);
CREATE INDEX IF NOT EXISTS idx_typhoon_events_name ON typhoon_events (name);

CREATE INDEX IF NOT EXISTS idx_typhoon_track_sid_time ON typhoon_track_points (sid, iso_time);
CREATE INDEX IF NOT EXISTS idx_typhoon_track_time ON typhoon_track_points (iso_time);
CREATE INDEX IF NOT EXISTS idx_typhoon_track_geom ON typhoon_track_points USING GIST (geom);
-- geography 索引由 optimize_typhoon_queries.sql 创建

COMMENT ON TABLE typhoon_events IS '历史台风事件（IBTrACS）';
COMMENT ON TABLE typhoon_track_points IS '历史台风轨迹点';
COMMENT ON COLUMN typhoon_track_points.geom IS '轨迹点位置，WGS84 点';
