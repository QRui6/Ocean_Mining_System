CREATE TABLE IF NOT EXISTS region_current_forecasts_hourly (
    id BIGSERIAL PRIMARY KEY,
    region_id BIGINT NOT NULL REFERENCES mining_regions(id) ON DELETE CASCADE,
    base_date DATE NOT NULL,
    run_cycle VARCHAR(10) NOT NULL,
    forecast_date DATE NOT NULL,
    forecast_time TIMESTAMPTZ NOT NULL,
    forecast_hour INTEGER NOT NULL,
    current_speed_avg NUMERIC(8,3),
    current_speed_max NUMERIC(8,3),
    current_dir_mean NUMERIC(8,3),
    source_file_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_latest BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_region_current_forecasts_hourly UNIQUE (region_id, base_date, run_cycle, forecast_time)
);

CREATE TABLE IF NOT EXISTS region_current_forecasts_daily (
    id BIGSERIAL PRIMARY KEY,
    region_id BIGINT NOT NULL REFERENCES mining_regions(id) ON DELETE CASCADE,
    base_date DATE NOT NULL,
    run_cycle VARCHAR(10) NOT NULL,
    forecast_date DATE NOT NULL,
    current_speed_avg NUMERIC(8,3),
    current_speed_max NUMERIC(8,3),
    current_dir_mean NUMERIC(8,3),
    hour_count INTEGER NOT NULL DEFAULT 0,
    source_file_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_latest BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_region_current_forecasts_daily UNIQUE (region_id, base_date, run_cycle, forecast_date)
);

CREATE TABLE IF NOT EXISTS site_current_forecasts_hourly (
    id BIGSERIAL PRIMARY KEY,
    site_id BIGINT NOT NULL REFERENCES forecast_sites(id) ON DELETE CASCADE,
    region_id BIGINT NOT NULL REFERENCES mining_regions(id) ON DELETE CASCADE,
    base_date DATE NOT NULL,
    run_cycle VARCHAR(10) NOT NULL,
    forecast_date DATE NOT NULL,
    forecast_time TIMESTAMPTZ NOT NULL,
    forecast_hour INTEGER NOT NULL,
    current_speed NUMERIC(8,3),
    current_dir NUMERIC(8,3),
    source_file_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_latest BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_site_current_forecasts_hourly UNIQUE (site_id, base_date, run_cycle, forecast_time)
);

CREATE TABLE IF NOT EXISTS site_current_forecasts_daily (
    id BIGSERIAL PRIMARY KEY,
    site_id BIGINT NOT NULL REFERENCES forecast_sites(id) ON DELETE CASCADE,
    region_id BIGINT NOT NULL REFERENCES mining_regions(id) ON DELETE CASCADE,
    base_date DATE NOT NULL,
    run_cycle VARCHAR(10) NOT NULL,
    forecast_date DATE NOT NULL,
    current_speed_avg NUMERIC(8,3),
    current_speed_max NUMERIC(8,3),
    current_dir_mean NUMERIC(8,3),
    hour_count INTEGER NOT NULL DEFAULT 0,
    source_file_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_latest BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_site_current_forecasts_daily UNIQUE (site_id, base_date, run_cycle, forecast_date)
);

CREATE INDEX IF NOT EXISTS idx_region_current_forecasts_hourly_latest
    ON region_current_forecasts_hourly (region_id, is_latest, forecast_time);
CREATE INDEX IF NOT EXISTS idx_region_current_forecasts_daily_latest
    ON region_current_forecasts_daily (region_id, is_latest, forecast_date);
CREATE INDEX IF NOT EXISTS idx_site_current_forecasts_hourly_latest
    ON site_current_forecasts_hourly (site_id, is_latest, forecast_time);
CREATE INDEX IF NOT EXISTS idx_site_current_forecasts_daily_latest
    ON site_current_forecasts_daily (site_id, is_latest, forecast_date);

DROP TRIGGER IF EXISTS update_region_current_forecasts_hourly_updated_at ON region_current_forecasts_hourly;
CREATE TRIGGER update_region_current_forecasts_hourly_updated_at
    BEFORE UPDATE ON region_current_forecasts_hourly
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_region_current_forecasts_daily_updated_at ON region_current_forecasts_daily;
CREATE TRIGGER update_region_current_forecasts_daily_updated_at
    BEFORE UPDATE ON region_current_forecasts_daily
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_site_current_forecasts_hourly_updated_at ON site_current_forecasts_hourly;
CREATE TRIGGER update_site_current_forecasts_hourly_updated_at
    BEFORE UPDATE ON site_current_forecasts_hourly
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_site_current_forecasts_daily_updated_at ON site_current_forecasts_daily;
CREATE TRIGGER update_site_current_forecasts_daily_updated_at
    BEFORE UPDATE ON site_current_forecasts_daily
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
