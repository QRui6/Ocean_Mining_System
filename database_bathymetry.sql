\c ship_monitoring;

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS region_bathymetry_summary (
    id SERIAL PRIMARY KEY,
    region_id INTEGER NOT NULL UNIQUE REFERENCES mining_regions(id) ON DELETE CASCADE,
    dataset_code VARCHAR(50) NOT NULL DEFAULT 'gebco_2025',
    depth_min_m DECIMAL(10, 3),
    depth_max_m DECIMAL(10, 3),
    depth_avg_m DECIMAL(10, 3),
    center_depth_m DECIMAL(10, 3),
    sample_count INTEGER NOT NULL DEFAULT 0,
    source_files JSONB NOT NULL DEFAULT '[]'::jsonb,
    coverage_note VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_region_bathymetry_dataset
    ON region_bathymetry_summary(dataset_code);

DROP TRIGGER IF EXISTS update_region_bathymetry_summary_updated_at ON region_bathymetry_summary;
CREATE TRIGGER update_region_bathymetry_summary_updated_at
    BEFORE UPDATE ON region_bathymetry_summary
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE region_bathymetry_summary IS 'Static bathymetry summaries for mining regions';
COMMENT ON COLUMN region_bathymetry_summary.depth_min_m IS 'Minimum positive water depth in meters';
COMMENT ON COLUMN region_bathymetry_summary.depth_max_m IS 'Maximum positive water depth in meters';
COMMENT ON COLUMN region_bathymetry_summary.depth_avg_m IS 'Average positive water depth in meters';
COMMENT ON COLUMN region_bathymetry_summary.center_depth_m IS 'Water depth sampled at region center point in meters';
COMMENT ON COLUMN region_bathymetry_summary.source_files IS 'Source GEBCO tile file names used for the summary';

CREATE TABLE IF NOT EXISTS site_bathymetry (
    id SERIAL PRIMARY KEY,
    site_id INTEGER NOT NULL UNIQUE REFERENCES forecast_sites(id) ON DELETE CASCADE,
    region_id INTEGER NOT NULL REFERENCES mining_regions(id) ON DELETE CASCADE,
    dataset_code VARCHAR(50) NOT NULL DEFAULT 'gebco_2025',
    depth_m DECIMAL(10, 3),
    elevation_m DECIMAL(10, 3),
    source_file_name VARCHAR(255),
    sampled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_site_bathymetry_region_id
    ON site_bathymetry(region_id);
CREATE INDEX IF NOT EXISTS idx_site_bathymetry_dataset
    ON site_bathymetry(dataset_code);

DROP TRIGGER IF EXISTS update_site_bathymetry_updated_at ON site_bathymetry;
CREATE TRIGGER update_site_bathymetry_updated_at
    BEFORE UPDATE ON site_bathymetry
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE site_bathymetry IS 'Static bathymetry samples for mining forecast sites';
COMMENT ON COLUMN site_bathymetry.depth_m IS 'Positive water depth in meters';
COMMENT ON COLUMN site_bathymetry.elevation_m IS 'Original GEBCO elevation value in meters; sea values are negative';
COMMENT ON COLUMN site_bathymetry.source_file_name IS 'Source GEBCO tile file used for the point sample';

SELECT 'Bathymetry tables created successfully!' AS status;
