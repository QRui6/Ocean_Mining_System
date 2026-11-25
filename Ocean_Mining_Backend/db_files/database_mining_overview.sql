-- Mining overview forecast schema
-- For large-region and site-level wind/wave/current forecast summaries

\c ship_monitoring;

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================== 1. Large mining regions ====================
CREATE TABLE IF NOT EXISTS mining_regions (
    id SERIAL PRIMARY KEY,
    region_code VARCHAR(50) NOT NULL UNIQUE,
    region_name VARCHAR(100) NOT NULL,
    center_lng DECIMAL(10, 6),
    center_lat DECIMAL(10, 6),
    boundary_polygon JSONB NOT NULL,
    geometry GEOMETRY(MULTIPOLYGON, 4326),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_mining_regions_center_lng
        CHECK (center_lng IS NULL OR (center_lng >= -180 AND center_lng <= 180)),
    CONSTRAINT chk_mining_regions_center_lat
        CHECK (center_lat IS NULL OR (center_lat >= -90 AND center_lat <= 90))
);

CREATE INDEX IF NOT EXISTS idx_mining_regions_is_active ON mining_regions(is_active);
CREATE INDEX IF NOT EXISTS idx_mining_regions_geometry ON mining_regions USING GIST(geometry);

DROP TRIGGER IF EXISTS update_mining_regions_updated_at ON mining_regions;
CREATE TRIGGER update_mining_regions_updated_at
    BEFORE UPDATE ON mining_regions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE mining_regions IS 'Large mining region definitions for overview pages';
COMMENT ON COLUMN mining_regions.boundary_polygon IS 'Region polygon in JSONB coordinates';
COMMENT ON COLUMN mining_regions.geometry IS 'PostGIS multipolygon geometry for spatial processing';
COMMENT ON COLUMN mining_regions.region_code IS 'Location-based large region code';
COMMENT ON COLUMN mining_regions.region_name IS 'Large region display name, currently same as location';

-- ==================== 2. Forecast sites ====================
CREATE TABLE IF NOT EXISTS forecast_sites (
    id SERIAL PRIMARY KEY,
    region_id INTEGER NOT NULL REFERENCES mining_regions(id) ON DELETE CASCADE,
    site_code VARCHAR(50) NOT NULL,
    site_name VARCHAR(100) NOT NULL,
    lng DECIMAL(10, 6) NOT NULL,
    lat DECIMAL(10, 6) NOT NULL,
    point_geom GEOMETRY(POINT, 4326),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_forecast_sites_lng CHECK (lng >= -180 AND lng <= 180),
    CONSTRAINT chk_forecast_sites_lat CHECK (lat >= -90 AND lat <= 90)
);

CREATE INDEX IF NOT EXISTS idx_forecast_sites_region_id ON forecast_sites(region_id);
CREATE INDEX IF NOT EXISTS idx_forecast_sites_is_active ON forecast_sites(is_active);
CREATE INDEX IF NOT EXISTS idx_forecast_sites_point_geom ON forecast_sites USING GIST(point_geom);
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'forecast_sites_site_code_key'
    ) THEN
        ALTER TABLE forecast_sites DROP CONSTRAINT forecast_sites_site_code_key;
    END IF;
END $$;
ALTER TABLE forecast_sites
    DROP CONSTRAINT IF EXISTS uk_forecast_sites_region_site_code;
ALTER TABLE forecast_sites
    ADD CONSTRAINT uk_forecast_sites_region_site_code UNIQUE (region_id, site_code);

DROP TRIGGER IF EXISTS update_forecast_sites_updated_at ON forecast_sites;
CREATE TRIGGER update_forecast_sites_updated_at
    BEFORE UPDATE ON forecast_sites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE forecast_sites IS 'Static point sites for small mining areas';
COMMENT ON COLUMN forecast_sites.point_geom IS 'PostGIS point geometry for site location';
COMMENT ON COLUMN forecast_sites.site_code IS 'Small mining area id, unique within one large region';

-- ==================== 3. Raw weather files ====================
CREATE TABLE IF NOT EXISTS weather_files (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL UNIQUE,
    data_type VARCHAR(20) NOT NULL,
    element_code VARCHAR(20) NOT NULL,
    base_date DATE NOT NULL,
    run_cycle VARCHAR(10) NOT NULL DEFAULT 't12',
    storage_type VARCHAR(20) NOT NULL DEFAULT 'local',
    object_key TEXT NOT NULL,
    file_size_bytes BIGINT,
    download_status VARCHAR(20) NOT NULL DEFAULT 'success',
    downloaded_at TIMESTAMP WITH TIME ZONE,
    is_latest BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_weather_files_data_type CHECK (data_type IN ('wind', 'wave', 'current')),
    CONSTRAINT chk_weather_files_download_status
        CHECK (download_status IN ('pending', 'success', 'failed')),
    CONSTRAINT uk_weather_files_batch UNIQUE (data_type, element_code, base_date, run_cycle)
);

CREATE INDEX IF NOT EXISTS idx_weather_files_base_date ON weather_files(base_date DESC);
CREATE INDEX IF NOT EXISTS idx_weather_files_latest ON weather_files(is_latest);
CREATE INDEX IF NOT EXISTS idx_weather_files_type_element ON weather_files(data_type, element_code);

COMMENT ON TABLE weather_files IS 'Downloaded wind/wave/current NetCDF files';
COMMENT ON COLUMN weather_files.base_date IS 'Forecast run base date parsed from file name';
COMMENT ON COLUMN weather_files.run_cycle IS 'Forecast run cycle such as t12';

ALTER TABLE weather_files
    DROP CONSTRAINT IF EXISTS chk_weather_files_data_type;
ALTER TABLE weather_files
    ADD CONSTRAINT chk_weather_files_data_type CHECK (data_type IN ('wind', 'wave', 'current'));

-- ==================== 4. Raw weather file metadata ====================
CREATE TABLE IF NOT EXISTS weather_file_metadata (
    id SERIAL PRIMARY KEY,
    file_id INTEGER NOT NULL UNIQUE REFERENCES weather_files(id) ON DELETE CASCADE,
    dataset_kind VARCHAR(50) NOT NULL,
    variable_name VARCHAR(100) NOT NULL,
    units VARCHAR(50),
    grid_width INTEGER NOT NULL,
    grid_height INTEGER NOT NULL,
    lon_min DECIMAL(10, 6) NOT NULL,
    lon_max DECIMAL(10, 6) NOT NULL,
    lat_min DECIMAL(10, 6) NOT NULL,
    lat_max DECIMAL(10, 6) NOT NULL,
    time_start TIMESTAMP WITH TIME ZONE,
    time_end TIMESTAMP WITH TIME ZONE,
    time_step_hours INTEGER,
    time_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_weather_file_metadata_dataset_kind
    ON weather_file_metadata(dataset_kind);

COMMENT ON TABLE weather_file_metadata IS 'Metadata extracted from NetCDF files';

-- ==================== 5. Region hourly forecasts ====================
CREATE TABLE IF NOT EXISTS region_forecasts_hourly (
    id SERIAL PRIMARY KEY,
    region_id INTEGER NOT NULL REFERENCES mining_regions(id) ON DELETE CASCADE,
    base_date DATE NOT NULL,
    run_cycle VARCHAR(10) NOT NULL DEFAULT 't12',
    forecast_date DATE NOT NULL,
    forecast_time TIMESTAMP WITH TIME ZONE NOT NULL,
    forecast_hour INTEGER NOT NULL,
    wind_speed_avg DECIMAL(8, 3),
    wind_speed_max DECIMAL(8, 3),
    wind_dir_mean DECIMAL(8, 3),
    gust_max DECIMAL(8, 3),
    wave_height_avg DECIMAL(8, 3),
    wave_height_max DECIMAL(8, 3),
    wave_period_avg DECIMAL(8, 3),
    wave_dir_mean DECIMAL(8, 3),
    current_speed_avg DECIMAL(8, 3),
    current_speed_max DECIMAL(8, 3),
    current_dir_mean DECIMAL(8, 3),
    source_file_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_latest BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_region_forecasts_hourly_batch
        UNIQUE (region_id, base_date, run_cycle, forecast_time)
);

CREATE INDEX IF NOT EXISTS idx_region_forecasts_hourly_region_time
    ON region_forecasts_hourly(region_id, forecast_time);
CREATE INDEX IF NOT EXISTS idx_region_forecasts_hourly_base_date
    ON region_forecasts_hourly(base_date DESC);
CREATE INDEX IF NOT EXISTS idx_region_forecasts_hourly_latest
    ON region_forecasts_hourly(is_latest);
CREATE INDEX IF NOT EXISTS idx_region_forecasts_hourly_source_files
    ON region_forecasts_hourly USING GIN(source_file_ids);

DROP TRIGGER IF EXISTS update_region_forecasts_hourly_updated_at ON region_forecasts_hourly;
CREATE TRIGGER update_region_forecasts_hourly_updated_at
    BEFORE UPDATE ON region_forecasts_hourly
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE region_forecasts_hourly IS 'Hourly forecast summaries for large mining regions';

ALTER TABLE region_forecasts_hourly
    ADD COLUMN IF NOT EXISTS current_speed_avg DECIMAL(8, 3);
ALTER TABLE region_forecasts_hourly
    ADD COLUMN IF NOT EXISTS current_speed_max DECIMAL(8, 3);
ALTER TABLE region_forecasts_hourly
    ADD COLUMN IF NOT EXISTS current_dir_mean DECIMAL(8, 3);

-- ==================== 6. Region daily forecasts ====================
CREATE TABLE IF NOT EXISTS region_forecasts_daily (
    id SERIAL PRIMARY KEY,
    region_id INTEGER NOT NULL REFERENCES mining_regions(id) ON DELETE CASCADE,
    base_date DATE NOT NULL,
    run_cycle VARCHAR(10) NOT NULL DEFAULT 't12',
    forecast_date DATE NOT NULL,
    wind_speed_avg DECIMAL(8, 3),
    wind_speed_max DECIMAL(8, 3),
    gust_max DECIMAL(8, 3),
    wave_height_avg DECIMAL(8, 3),
    wave_height_max DECIMAL(8, 3),
    wave_period_avg DECIMAL(8, 3),
    wind_dir_mean DECIMAL(8, 3),
    wave_dir_mean DECIMAL(8, 3),
    current_speed_avg DECIMAL(8, 3),
    current_speed_max DECIMAL(8, 3),
    current_dir_mean DECIMAL(8, 3),
    hour_count INTEGER NOT NULL DEFAULT 0,
    source_file_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_latest BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_region_forecasts_daily_batch
        UNIQUE (region_id, base_date, run_cycle, forecast_date)
);

CREATE INDEX IF NOT EXISTS idx_region_forecasts_daily_region_date
    ON region_forecasts_daily(region_id, forecast_date);
CREATE INDEX IF NOT EXISTS idx_region_forecasts_daily_base_date
    ON region_forecasts_daily(base_date DESC);
CREATE INDEX IF NOT EXISTS idx_region_forecasts_daily_latest
    ON region_forecasts_daily(is_latest);
CREATE INDEX IF NOT EXISTS idx_region_forecasts_daily_source_files
    ON region_forecasts_daily USING GIN(source_file_ids);

DROP TRIGGER IF EXISTS update_region_forecasts_daily_updated_at ON region_forecasts_daily;
CREATE TRIGGER update_region_forecasts_daily_updated_at
    BEFORE UPDATE ON region_forecasts_daily
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE region_forecasts_daily IS 'Daily forecast summaries for large mining regions';

ALTER TABLE region_forecasts_daily
    ADD COLUMN IF NOT EXISTS current_speed_avg DECIMAL(8, 3);
ALTER TABLE region_forecasts_daily
    ADD COLUMN IF NOT EXISTS current_speed_max DECIMAL(8, 3);
ALTER TABLE region_forecasts_daily
    ADD COLUMN IF NOT EXISTS current_dir_mean DECIMAL(8, 3);

-- ==================== 7. Site hourly forecasts ====================
CREATE TABLE IF NOT EXISTS site_forecasts_hourly (
    id SERIAL PRIMARY KEY,
    site_id INTEGER NOT NULL REFERENCES forecast_sites(id) ON DELETE CASCADE,
    region_id INTEGER NOT NULL REFERENCES mining_regions(id) ON DELETE CASCADE,
    base_date DATE NOT NULL,
    run_cycle VARCHAR(10) NOT NULL DEFAULT 't12',
    forecast_date DATE NOT NULL,
    forecast_time TIMESTAMP WITH TIME ZONE NOT NULL,
    forecast_hour INTEGER NOT NULL,
    wind_speed DECIMAL(8, 3),
    wind_dir DECIMAL(8, 3),
    gust DECIMAL(8, 3),
    wave_height DECIMAL(8, 3),
    wave_period DECIMAL(8, 3),
    wave_dir DECIMAL(8, 3),
    current_speed DECIMAL(8, 3),
    current_dir DECIMAL(8, 3),
    source_file_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_latest BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_site_forecasts_hourly_batch
        UNIQUE (site_id, base_date, run_cycle, forecast_time)
);

CREATE INDEX IF NOT EXISTS idx_site_forecasts_hourly_site_time
    ON site_forecasts_hourly(site_id, forecast_time);
CREATE INDEX IF NOT EXISTS idx_site_forecasts_hourly_region_time
    ON site_forecasts_hourly(region_id, forecast_time);
CREATE INDEX IF NOT EXISTS idx_site_forecasts_hourly_base_date
    ON site_forecasts_hourly(base_date DESC);
CREATE INDEX IF NOT EXISTS idx_site_forecasts_hourly_latest
    ON site_forecasts_hourly(is_latest);
CREATE INDEX IF NOT EXISTS idx_site_forecasts_hourly_source_files
    ON site_forecasts_hourly USING GIN(source_file_ids);

DROP TRIGGER IF EXISTS update_site_forecasts_hourly_updated_at ON site_forecasts_hourly;
CREATE TRIGGER update_site_forecasts_hourly_updated_at
    BEFORE UPDATE ON site_forecasts_hourly
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE site_forecasts_hourly IS 'Hourly forecast values for individual forecast sites';

ALTER TABLE site_forecasts_hourly
    ADD COLUMN IF NOT EXISTS current_speed DECIMAL(8, 3);
ALTER TABLE site_forecasts_hourly
    ADD COLUMN IF NOT EXISTS current_dir DECIMAL(8, 3);

-- ==================== 8. Site daily forecasts ====================
CREATE TABLE IF NOT EXISTS site_forecasts_daily (
    id SERIAL PRIMARY KEY,
    site_id INTEGER NOT NULL REFERENCES forecast_sites(id) ON DELETE CASCADE,
    region_id INTEGER NOT NULL REFERENCES mining_regions(id) ON DELETE CASCADE,
    base_date DATE NOT NULL,
    run_cycle VARCHAR(10) NOT NULL DEFAULT 't12',
    forecast_date DATE NOT NULL,
    wind_speed_avg DECIMAL(8, 3),
    wind_speed_max DECIMAL(8, 3),
    gust_max DECIMAL(8, 3),
    wave_height_avg DECIMAL(8, 3),
    wave_height_max DECIMAL(8, 3),
    wave_period_avg DECIMAL(8, 3),
    wind_dir_mean DECIMAL(8, 3),
    wave_dir_mean DECIMAL(8, 3),
    current_speed_avg DECIMAL(8, 3),
    current_speed_max DECIMAL(8, 3),
    current_dir_mean DECIMAL(8, 3),
    hour_count INTEGER NOT NULL DEFAULT 0,
    source_file_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_latest BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_site_forecasts_daily_batch
        UNIQUE (site_id, base_date, run_cycle, forecast_date)
);

CREATE INDEX IF NOT EXISTS idx_site_forecasts_daily_site_date
    ON site_forecasts_daily(site_id, forecast_date);
CREATE INDEX IF NOT EXISTS idx_site_forecasts_daily_region_date
    ON site_forecasts_daily(region_id, forecast_date);
CREATE INDEX IF NOT EXISTS idx_site_forecasts_daily_base_date
    ON site_forecasts_daily(base_date DESC);
CREATE INDEX IF NOT EXISTS idx_site_forecasts_daily_latest
    ON site_forecasts_daily(is_latest);
CREATE INDEX IF NOT EXISTS idx_site_forecasts_daily_source_files
    ON site_forecasts_daily USING GIN(source_file_ids);

DROP TRIGGER IF EXISTS update_site_forecasts_daily_updated_at ON site_forecasts_daily;
CREATE TRIGGER update_site_forecasts_daily_updated_at
    BEFORE UPDATE ON site_forecasts_daily
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE site_forecasts_daily IS 'Daily forecast summaries for individual forecast sites';

ALTER TABLE site_forecasts_daily
    ADD COLUMN IF NOT EXISTS current_speed_avg DECIMAL(8, 3);
ALTER TABLE site_forecasts_daily
    ADD COLUMN IF NOT EXISTS current_speed_max DECIMAL(8, 3);
ALTER TABLE site_forecasts_daily
    ADD COLUMN IF NOT EXISTS current_dir_mean DECIMAL(8, 3);

-- ==================== 9. Region current hourly forecasts ====================
CREATE TABLE IF NOT EXISTS region_current_forecasts_hourly (
    id SERIAL PRIMARY KEY,
    region_id INTEGER NOT NULL REFERENCES mining_regions(id) ON DELETE CASCADE,
    base_date DATE NOT NULL,
    run_cycle VARCHAR(10) NOT NULL DEFAULT 't12',
    forecast_date DATE NOT NULL,
    forecast_time TIMESTAMP WITH TIME ZONE NOT NULL,
    forecast_hour INTEGER NOT NULL,
    current_speed_avg DECIMAL(8, 3),
    current_speed_max DECIMAL(8, 3),
    current_dir_mean DECIMAL(8, 3),
    source_file_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_latest BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_region_current_forecasts_hourly_batch
        UNIQUE (region_id, base_date, run_cycle, forecast_time)
);

CREATE INDEX IF NOT EXISTS idx_region_current_forecasts_hourly_region_time
    ON region_current_forecasts_hourly(region_id, forecast_time);
CREATE INDEX IF NOT EXISTS idx_region_current_forecasts_hourly_base_date
    ON region_current_forecasts_hourly(base_date DESC);
CREATE INDEX IF NOT EXISTS idx_region_current_forecasts_hourly_latest
    ON region_current_forecasts_hourly(is_latest);
CREATE INDEX IF NOT EXISTS idx_region_current_forecasts_hourly_source_files
    ON region_current_forecasts_hourly USING GIN(source_file_ids);

DROP TRIGGER IF EXISTS update_region_current_forecasts_hourly_updated_at ON region_current_forecasts_hourly;
CREATE TRIGGER update_region_current_forecasts_hourly_updated_at
    BEFORE UPDATE ON region_current_forecasts_hourly
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE region_current_forecasts_hourly IS 'Hourly current forecast summaries for large mining regions';

-- ==================== 10. Region current daily forecasts ====================
CREATE TABLE IF NOT EXISTS region_current_forecasts_daily (
    id SERIAL PRIMARY KEY,
    region_id INTEGER NOT NULL REFERENCES mining_regions(id) ON DELETE CASCADE,
    base_date DATE NOT NULL,
    run_cycle VARCHAR(10) NOT NULL DEFAULT 't12',
    forecast_date DATE NOT NULL,
    current_speed_avg DECIMAL(8, 3),
    current_speed_max DECIMAL(8, 3),
    current_dir_mean DECIMAL(8, 3),
    hour_count INTEGER NOT NULL DEFAULT 0,
    source_file_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_latest BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_region_current_forecasts_daily_batch
        UNIQUE (region_id, base_date, run_cycle, forecast_date)
);

CREATE INDEX IF NOT EXISTS idx_region_current_forecasts_daily_region_date
    ON region_current_forecasts_daily(region_id, forecast_date);
CREATE INDEX IF NOT EXISTS idx_region_current_forecasts_daily_base_date
    ON region_current_forecasts_daily(base_date DESC);
CREATE INDEX IF NOT EXISTS idx_region_current_forecasts_daily_latest
    ON region_current_forecasts_daily(is_latest);
CREATE INDEX IF NOT EXISTS idx_region_current_forecasts_daily_source_files
    ON region_current_forecasts_daily USING GIN(source_file_ids);

DROP TRIGGER IF EXISTS update_region_current_forecasts_daily_updated_at ON region_current_forecasts_daily;
CREATE TRIGGER update_region_current_forecasts_daily_updated_at
    BEFORE UPDATE ON region_current_forecasts_daily
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE region_current_forecasts_daily IS 'Daily current forecast summaries for large mining regions';

-- ==================== 11. Site current hourly forecasts ====================
CREATE TABLE IF NOT EXISTS site_current_forecasts_hourly (
    id SERIAL PRIMARY KEY,
    site_id INTEGER NOT NULL REFERENCES forecast_sites(id) ON DELETE CASCADE,
    region_id INTEGER NOT NULL REFERENCES mining_regions(id) ON DELETE CASCADE,
    base_date DATE NOT NULL,
    run_cycle VARCHAR(10) NOT NULL DEFAULT 't12',
    forecast_date DATE NOT NULL,
    forecast_time TIMESTAMP WITH TIME ZONE NOT NULL,
    forecast_hour INTEGER NOT NULL,
    current_speed DECIMAL(8, 3),
    current_dir DECIMAL(8, 3),
    source_file_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_latest BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_site_current_forecasts_hourly_batch
        UNIQUE (site_id, base_date, run_cycle, forecast_time)
);

CREATE INDEX IF NOT EXISTS idx_site_current_forecasts_hourly_site_time
    ON site_current_forecasts_hourly(site_id, forecast_time);
CREATE INDEX IF NOT EXISTS idx_site_current_forecasts_hourly_region_time
    ON site_current_forecasts_hourly(region_id, forecast_time);
CREATE INDEX IF NOT EXISTS idx_site_current_forecasts_hourly_base_date
    ON site_current_forecasts_hourly(base_date DESC);
CREATE INDEX IF NOT EXISTS idx_site_current_forecasts_hourly_latest
    ON site_current_forecasts_hourly(is_latest);
CREATE INDEX IF NOT EXISTS idx_site_current_forecasts_hourly_source_files
    ON site_current_forecasts_hourly USING GIN(source_file_ids);

DROP TRIGGER IF EXISTS update_site_current_forecasts_hourly_updated_at ON site_current_forecasts_hourly;
CREATE TRIGGER update_site_current_forecasts_hourly_updated_at
    BEFORE UPDATE ON site_current_forecasts_hourly
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE site_current_forecasts_hourly IS 'Hourly current forecast values for individual forecast sites';

-- ==================== 12. Site current daily forecasts ====================
CREATE TABLE IF NOT EXISTS site_current_forecasts_daily (
    id SERIAL PRIMARY KEY,
    site_id INTEGER NOT NULL REFERENCES forecast_sites(id) ON DELETE CASCADE,
    region_id INTEGER NOT NULL REFERENCES mining_regions(id) ON DELETE CASCADE,
    base_date DATE NOT NULL,
    run_cycle VARCHAR(10) NOT NULL DEFAULT 't12',
    forecast_date DATE NOT NULL,
    current_speed_avg DECIMAL(8, 3),
    current_speed_max DECIMAL(8, 3),
    current_dir_mean DECIMAL(8, 3),
    hour_count INTEGER NOT NULL DEFAULT 0,
    source_file_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_latest BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_site_current_forecasts_daily_batch
        UNIQUE (site_id, base_date, run_cycle, forecast_date)
);

CREATE INDEX IF NOT EXISTS idx_site_current_forecasts_daily_site_date
    ON site_current_forecasts_daily(site_id, forecast_date);
CREATE INDEX IF NOT EXISTS idx_site_current_forecasts_daily_region_date
    ON site_current_forecasts_daily(region_id, forecast_date);
CREATE INDEX IF NOT EXISTS idx_site_current_forecasts_daily_base_date
    ON site_current_forecasts_daily(base_date DESC);
CREATE INDEX IF NOT EXISTS idx_site_current_forecasts_daily_latest
    ON site_current_forecasts_daily(is_latest);
CREATE INDEX IF NOT EXISTS idx_site_current_forecasts_daily_source_files
    ON site_current_forecasts_daily USING GIN(source_file_ids);

DROP TRIGGER IF EXISTS update_site_current_forecasts_daily_updated_at ON site_current_forecasts_daily;
CREATE TRIGGER update_site_current_forecasts_daily_updated_at
    BEFORE UPDATE ON site_current_forecasts_daily
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE site_current_forecasts_daily IS 'Daily current forecast summaries for individual forecast sites';

SELECT 'Mining overview forecast tables created successfully!' AS status;
