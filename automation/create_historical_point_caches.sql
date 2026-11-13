CREATE TABLE IF NOT EXISTS historical_current_site_cache (
    site_id BIGINT NOT NULL,
    site_code VARCHAR(50) NOT NULL,
    site_name VARCHAR(100) NOT NULL,
    region_id BIGINT NOT NULL,
    lat NUMERIC(10, 6) NOT NULL,
    lon NUMERIC(10, 6) NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    month_label VARCHAR(7) NOT NULL,
    month_start DATE NOT NULL,
    data_time TIMESTAMPTZ,
    depth_m NUMERIC(10, 6),
    u_value DOUBLE PRECISION,
    v_value DOUBLE PRECISION,
    speed_value DOUBLE PRECISION,
    direction_value DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (site_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_historical_current_site_cache_lat_lon
    ON historical_current_site_cache (lat, lon);

CREATE TABLE IF NOT EXISTS historical_wave_region_cache (
    region_id BIGINT NOT NULL,
    region_name VARCHAR(100) NOT NULL,
    lat NUMERIC(10, 6) NOT NULL,
    lon NUMERIC(10, 6) NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    month_label VARCHAR(7) NOT NULL,
    month_start DATE NOT NULL,
    wave_time TIMESTAMPTZ,
    wave_valid_time TIMESTAMPTZ,
    wave_step_hours NUMERIC(10, 3),
    swh_value DOUBLE PRECISION,
    mwp_value DOUBLE PRECISION,
    mwd_value DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (region_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_historical_wave_region_cache_lat_lon
    ON historical_wave_region_cache (lat, lon);

CREATE TABLE IF NOT EXISTS historical_wave_site_cache (
    site_id BIGINT NOT NULL,
    site_code VARCHAR(50) NOT NULL,
    site_name VARCHAR(100) NOT NULL,
    region_id BIGINT NOT NULL,
    lat NUMERIC(10, 6) NOT NULL,
    lon NUMERIC(10, 6) NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    month_label VARCHAR(7) NOT NULL,
    month_start DATE NOT NULL,
    wave_time TIMESTAMPTZ,
    wave_valid_time TIMESTAMPTZ,
    wave_step_hours NUMERIC(10, 3),
    swh_value DOUBLE PRECISION,
    mwp_value DOUBLE PRECISION,
    mwd_value DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (site_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_historical_wave_site_cache_lat_lon
    ON historical_wave_site_cache (lat, lon);
