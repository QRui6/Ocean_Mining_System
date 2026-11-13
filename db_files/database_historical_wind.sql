CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS historical_wind_metadata (
    id SERIAL PRIMARY KEY,
    dataset_code VARCHAR(100) NOT NULL UNIQUE,
    dataset_name VARCHAR(255) NOT NULL,
    product_type VARCHAR(100) NOT NULL,
    data_format VARCHAR(20) NOT NULL,
    variables JSONB NOT NULL,
    grid_width INTEGER NOT NULL,
    grid_height INTEGER NOT NULL,
    lon_min DECIMAL(10, 6) NOT NULL,
    lon_max DECIMAL(10, 6) NOT NULL,
    lat_min DECIMAL(10, 6) NOT NULL,
    lat_max DECIMAL(10, 6) NOT NULL,
    lon_step DECIMAL(10, 6),
    lat_step DECIMAL(10, 6),
    time_zone VARCHAR(20) NOT NULL DEFAULT 'UTC',
    frequency_note VARCHAR(100),
    source_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_historical_wind_metadata_dataset_code
    ON historical_wind_metadata(dataset_code);

DROP TRIGGER IF EXISTS update_historical_wind_metadata_updated_at ON historical_wind_metadata;
CREATE TRIGGER update_historical_wind_metadata_updated_at
    BEFORE UPDATE ON historical_wind_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE historical_wind_metadata IS 'Metadata for independent historical monthly wind datasets';
COMMENT ON COLUMN historical_wind_metadata.variables IS 'Requested variable list such as u10/v10/gust';

CREATE TABLE IF NOT EXISTS historical_wind_monthly_data (
    id BIGSERIAL PRIMARY KEY,
    metadata_id INTEGER NOT NULL REFERENCES historical_wind_metadata(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    month_label VARCHAR(7) NOT NULL,
    month_start DATE NOT NULL,
    u_time TIMESTAMP WITH TIME ZONE,
    u_valid_time TIMESTAMP WITH TIME ZONE,
    gust_time TIMESTAMP WITH TIME ZONE,
    gust_step_hours DECIMAL(8, 3),
    gust_valid_time TIMESTAMP WITH TIME ZONE,
    u_component BYTEA NOT NULL,
    v_component BYTEA NOT NULL,
    gust_component BYTEA NOT NULL,
    u_min REAL NOT NULL,
    u_max REAL NOT NULL,
    v_min REAL NOT NULL,
    v_max REAL NOT NULL,
    gust_min REAL NOT NULL,
    gust_max REAL NOT NULL,
    data_size INTEGER NOT NULL,
    source_file_name VARCHAR(255) NOT NULL,
    source_file_path TEXT NOT NULL,
    source_file_size_bytes BIGINT NOT NULL,
    imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_historical_wind_month UNIQUE (metadata_id, year, month),
    CONSTRAINT chk_historical_wind_month CHECK (month BETWEEN 1 AND 12)
);

CREATE INDEX IF NOT EXISTS idx_historical_wind_monthly_year_month
    ON historical_wind_monthly_data(year, month);

CREATE INDEX IF NOT EXISTS idx_historical_wind_monthly_metadata
    ON historical_wind_monthly_data(metadata_id);

COMMENT ON TABLE historical_wind_monthly_data IS 'Independent monthly wind field grids for historical ERA5 storage';
COMMENT ON COLUMN historical_wind_monthly_data.u_component IS 'Float32 binary grid for monthly mean 10m u wind';
COMMENT ON COLUMN historical_wind_monthly_data.v_component IS 'Float32 binary grid for monthly mean 10m v wind';
COMMENT ON COLUMN historical_wind_monthly_data.gust_component IS 'Float32 binary grid for monthly gust field';

SELECT 'Historical monthly wind tables created successfully!' AS status;
