CREATE TABLE IF NOT EXISTS historical_current_region_cache (
    region_id BIGINT NOT NULL,
    region_name VARCHAR(100) NOT NULL,
    lat NUMERIC(10,6) NOT NULL,
    lon NUMERIC(10,6) NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    month_label VARCHAR(7) NOT NULL,
    month_start DATE NOT NULL,
    data_time TIMESTAMPTZ,
    depth_m NUMERIC(10,6),
    u_value DOUBLE PRECISION,
    v_value DOUBLE PRECISION,
    speed_value DOUBLE PRECISION,
    direction_value DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (region_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_historical_current_region_cache_lat_lon
    ON historical_current_region_cache (lat, lon);
