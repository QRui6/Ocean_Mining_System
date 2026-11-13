-- 气象数据表结构
-- 用于存储风场、洋流、波浪数据

-- 连接到数据库
\c ship_monitoring;

-- ==================== 气象数据类型表 ====================
CREATE TABLE IF NOT EXISTS weather_data_types (
    id SERIAL PRIMARY KEY,
    type_code VARCHAR(20) UNIQUE NOT NULL,  -- 'wind', 'ocean_current', 'wave'
    type_name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE weather_data_types IS '气象数据类型表';
COMMENT ON COLUMN weather_data_types.type_code IS '数据类型代码';

-- 插入初始数据类型
INSERT INTO weather_data_types (type_code, type_name, description) VALUES
('wind', '风场数据', '全球风场U/V分量数据'),
('ocean_current', '洋流数据', '全球洋流U/V分量数据'),
('wave', '波浪数据', '全球波浪高度和Stokes drift数据')
ON CONFLICT (type_code) DO NOTHING;

-- ==================== 气象数据元数据表 ====================
CREATE TABLE IF NOT EXISTS weather_metadata (
    id SERIAL PRIMARY KEY,
    data_type_id INTEGER NOT NULL REFERENCES weather_data_types(id) ON DELETE CASCADE,
    grid_lon_size INTEGER NOT NULL,
    grid_lat_size INTEGER NOT NULL,
    grid_lon_min DECIMAL(10, 6) NOT NULL,
    grid_lat_min DECIMAL(10, 6) NOT NULL,
    grid_lon_max DECIMAL(10, 6) NOT NULL,
    grid_lat_max DECIMAL(10, 6) NOT NULL,
    grid_lon_step DECIMAL(10, 6),
    grid_lat_step DECIMAL(10, 6),
    start_time TIMESTAMP WITH TIME ZONE,
    time_step_hours INTEGER,
    total_frames INTEGER NOT NULL,
    data_source VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE weather_metadata IS '气象数据元数据表';
COMMENT ON COLUMN weather_metadata.grid_lon_size IS '经度网格数量';
COMMENT ON COLUMN weather_metadata.grid_lat_size IS '纬度网格数量';
COMMENT ON COLUMN weather_metadata.total_frames IS '总时间帧数';

-- 创建索引
CREATE INDEX idx_weather_metadata_type ON weather_metadata(data_type_id);

-- 创建触发器：自动更新updated_at
CREATE TRIGGER update_weather_metadata_updated_at
    BEFORE UPDATE ON weather_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================== 风场数据表 ====================
CREATE TABLE IF NOT EXISTS wind_data (
    id SERIAL PRIMARY KEY,
    metadata_id INTEGER NOT NULL REFERENCES weather_metadata(id) ON DELETE CASCADE,
    time_index INTEGER NOT NULL,
    u_component BYTEA NOT NULL,  -- Float32Array序列化为二进制
    v_component BYTEA NOT NULL,
    u_min REAL NOT NULL,
    u_max REAL NOT NULL,
    v_min REAL NOT NULL,
    v_max REAL NOT NULL,
    data_size INTEGER NOT NULL,  -- 数据点数量
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_wind_metadata_time UNIQUE(metadata_id, time_index)
);

COMMENT ON TABLE wind_data IS '风场数据表';
COMMENT ON COLUMN wind_data.u_component IS 'U分量（东西向）二进制数据';
COMMENT ON COLUMN wind_data.v_component IS 'V分量（南北向）二进制数据';
COMMENT ON COLUMN wind_data.data_size IS '数据点总数';

-- 创建索引
CREATE INDEX idx_wind_data_metadata_time ON wind_data(metadata_id, time_index);
CREATE INDEX idx_wind_data_time ON wind_data(time_index);

-- ==================== 洋流数据表 ====================
CREATE TABLE IF NOT EXISTS ocean_current_data (
    id SERIAL PRIMARY KEY,
    metadata_id INTEGER NOT NULL REFERENCES weather_metadata(id) ON DELETE CASCADE,
    time_index INTEGER NOT NULL,
    u_component BYTEA NOT NULL,
    v_component BYTEA NOT NULL,
    u_min REAL NOT NULL,
    u_max REAL NOT NULL,
    v_min REAL NOT NULL,
    v_max REAL NOT NULL,
    data_size INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_current_metadata_time UNIQUE(metadata_id, time_index)
);

COMMENT ON TABLE ocean_current_data IS '洋流数据表';
COMMENT ON COLUMN ocean_current_data.u_component IS 'U分量（东西向）二进制数据';
COMMENT ON COLUMN ocean_current_data.v_component IS 'V分量（南北向）二进制数据';

-- 创建索引
CREATE INDEX idx_current_data_metadata_time ON ocean_current_data(metadata_id, time_index);
CREATE INDEX idx_current_data_time ON ocean_current_data(time_index);

-- ==================== 波浪数据表 ====================
CREATE TABLE IF NOT EXISTS wave_data (
    id SERIAL PRIMARY KEY,
    metadata_id INTEGER NOT NULL REFERENCES weather_metadata(id) ON DELETE CASCADE,
    time_index INTEGER NOT NULL,
    u_component BYTEA NOT NULL,  -- Stokes drift U分量
    v_component BYTEA NOT NULL,  -- Stokes drift V分量
    wave_height BYTEA,  -- 波高数据（可选）
    u_min REAL NOT NULL,
    u_max REAL NOT NULL,
    v_min REAL NOT NULL,
    v_max REAL NOT NULL,
    hs_min REAL,  -- 波高最小值
    hs_max REAL,  -- 波高最大值
    data_size INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_wave_metadata_time UNIQUE(metadata_id, time_index)
);

COMMENT ON TABLE wave_data IS '波浪数据表';
COMMENT ON COLUMN wave_data.u_component IS 'Stokes drift U分量二进制数据';
COMMENT ON COLUMN wave_data.v_component IS 'Stokes drift V分量二进制数据';
COMMENT ON COLUMN wave_data.wave_height IS '波高二进制数据';

-- 创建索引
CREATE INDEX idx_wave_data_metadata_time ON wave_data(metadata_id, time_index);
CREATE INDEX idx_wave_data_time ON wave_data(time_index);

-- ==================== 性能优化 ====================
-- 启用自动vacuum
ALTER TABLE wind_data SET (autovacuum_enabled = true);
ALTER TABLE ocean_current_data SET (autovacuum_enabled = true);
ALTER TABLE wave_data SET (autovacuum_enabled = true);

-- 设置统计信息收集
ALTER TABLE wind_data ALTER COLUMN metadata_id SET STATISTICS 1000;
ALTER TABLE wind_data ALTER COLUMN time_index SET STATISTICS 1000;
ALTER TABLE ocean_current_data ALTER COLUMN metadata_id SET STATISTICS 1000;
ALTER TABLE ocean_current_data ALTER COLUMN time_index SET STATISTICS 1000;
ALTER TABLE wave_data ALTER COLUMN metadata_id SET STATISTICS 1000;
ALTER TABLE wave_data ALTER COLUMN time_index SET STATISTICS 1000;

-- ==================== 完成 ====================
SELECT 'Weather data tables created successfully!' as status;
