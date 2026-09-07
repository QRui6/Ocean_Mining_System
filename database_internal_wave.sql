-- 内波数据表结构
-- Internal Wave Data Tables

-- 1. 内波元数据表
CREATE TABLE IF NOT EXISTS internal_wave_metadata (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL DEFAULT 'internal_wave',
    grid_data JSONB NOT NULL,
    start_time TIMESTAMP NOT NULL,
    time_step_hours INTEGER NOT NULL,
    frames INTEGER NOT NULL,
    data_source TEXT,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_internal_wave_metadata_type UNIQUE (type)
);

-- 2. 内波数据表
CREATE TABLE IF NOT EXISTS internal_wave_data (
    id SERIAL PRIMARY KEY,
    time_index INTEGER NOT NULL,
    u_data BYTEA NOT NULL,
    v_data BYTEA NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    u_min REAL NOT NULL,
    u_max REAL NOT NULL,
    v_min REAL NOT NULL,
    v_max REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_internal_wave_data_time_index UNIQUE (time_index)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_internal_wave_data_time_index ON internal_wave_data(time_index);

-- 插入元数据
INSERT INTO internal_wave_metadata (
    type, 
    grid_data, 
    start_time, 
    time_step_hours, 
    frames, 
    data_source,
    note
) VALUES (
    'internal_wave',
    '{
        "lonSize": 7200,
        "latSize": 2641,
        "lonMin": 0.0,
        "latMin": -66.0,
        "lonMax": 359.95,
        "latMax": 66.0,
        "lonStep": 0.05,
        "latStep": 0.05
    }'::jsonb,
    '2020-01-01T00:00:00',
    3,
    9,
    'NASA PO.DAAC HRET14 (BAROCLINIC_HRET14) harmonic constants',
    'Internal wave data from NASA Physical Oceanography Distributed Active Archive Center'
) ON CONFLICT (type) DO UPDATE SET
    grid_data = EXCLUDED.grid_data,
    start_time = EXCLUDED.start_time,
    time_step_hours = EXCLUDED.time_step_hours,
    frames = EXCLUDED.frames,
    data_source = EXCLUDED.data_source,
    note = EXCLUDED.note,
    updated_at = CURRENT_TIMESTAMP;

COMMENT ON TABLE internal_wave_metadata IS '内波数据元数据表';
COMMENT ON TABLE internal_wave_data IS '内波数据表';
COMMENT ON COLUMN internal_wave_data.u_data IS 'U分量二进制数据（Float32Array）';
COMMENT ON COLUMN internal_wave_data.v_data IS 'V分量二进制数据（Float32Array）';
