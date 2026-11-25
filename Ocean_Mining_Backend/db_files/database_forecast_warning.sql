BEGIN;

CREATE TABLE IF NOT EXISTS forecast_bulletins (
    id BIGSERIAL PRIMARY KEY,
    region_id BIGINT NOT NULL REFERENCES mining_regions(id),
    time_range VARCHAR(10) NOT NULL,
    base_date DATE NOT NULL,
    run_cycle VARCHAR(10) NOT NULL,
    bulletin_text TEXT NOT NULL,
    wind_avg NUMERIC(8,3),
    wind_max NUMERIC(8,3),
    wave_avg NUMERIC(8,3),
    wave_max NUMERIC(8,3),
    current_avg NUMERIC(8,3),
    current_max NUMERIC(8,3),
    risk_level VARCHAR(20) NOT NULL,
    data_complete BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_forecast_bulletin_range
        CHECK (time_range IN ('12h', '7d', '15d')),
    CONSTRAINT uq_forecast_bulletin_batch
        UNIQUE (region_id, time_range, base_date, run_cycle)
);

CREATE INDEX IF NOT EXISTS idx_forecast_bulletins_latest
    ON forecast_bulletins (region_id, time_range, base_date DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS weather_warnings (
    id BIGSERIAL PRIMARY KEY,
    region_id BIGINT NOT NULL REFERENCES mining_regions(id),
    time_range VARCHAR(10) NOT NULL,
    base_date DATE NOT NULL,
    run_cycle VARCHAR(10) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    trigger_type VARCHAR(100) NOT NULL,
    trigger_detail JSONB NOT NULL,
    warning_message TEXT NOT NULL,
    bulletin_text TEXT NOT NULL,
    forecast_data JSONB,
    wind_threshold NUMERIC(8,3),
    wave_threshold NUMERIC(8,3),
    current_threshold NUMERIC(8,3),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ,
    CONSTRAINT chk_weather_warning_range
        CHECK (time_range IN ('12h', '7d', '15d')),
    CONSTRAINT chk_weather_warning_severity
        CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
    CONSTRAINT chk_weather_warning_status
        CHECK (status IN ('ACTIVE', 'RESOLVED', 'EXPIRED')),
    CONSTRAINT uq_weather_warning_batch
        UNIQUE (region_id, time_range, base_date, run_cycle)
);

CREATE INDEX IF NOT EXISTS idx_weather_warnings_filter
    ON weather_warnings (status, severity, time_range, region_id, created_at DESC);

COMMIT;
