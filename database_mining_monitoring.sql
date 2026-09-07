-- 矿区气象监测列表数据表
-- 用于存储用户添加到气象监测的矿区列表

-- 连接到数据库
\c ship_monitoring;

-- ==================== 矿区监测列表表 ====================
CREATE TABLE IF NOT EXISTS mining_area_monitoring (
    id SERIAL PRIMARY KEY,
    mining_area_id BIGINT NOT NULL REFERENCES mining_areas(id) ON DELETE CASCADE,
    wind_speed_threshold DECIMAL(5,2) DEFAULT 15.0,      -- 风速阈值(m/s)
    wave_height_threshold DECIMAL(5,2) DEFAULT 3.0,      -- 浪高阈值(m)
    current_speed_threshold DECIMAL(5,2) DEFAULT 1.0,    -- 洋流阈值(m/s)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_mining_area_monitoring UNIQUE(mining_area_id)  -- 防止重复添加
);

COMMENT ON TABLE mining_area_monitoring IS '矿区气象监测列表';
COMMENT ON COLUMN mining_area_monitoring.mining_area_id IS '矿区ID，关联mining_areas表';
COMMENT ON COLUMN mining_area_monitoring.wind_speed_threshold IS '风速预警阈值(m/s)';
COMMENT ON COLUMN mining_area_monitoring.wave_height_threshold IS '浪高预警阈值(m)';
COMMENT ON COLUMN mining_area_monitoring.current_speed_threshold IS '洋流预警阈值(m/s)';

-- 创建索引
CREATE INDEX idx_mining_monitoring_area_id ON mining_area_monitoring(mining_area_id);
CREATE INDEX idx_mining_monitoring_created_at ON mining_area_monitoring(created_at);

-- 创建触发器：自动更新updated_at
CREATE TRIGGER update_mining_monitoring_updated_at
    BEFORE UPDATE ON mining_area_monitoring
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================== 完成 ====================
SELECT 'Mining area monitoring table created successfully!' as status;
