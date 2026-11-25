-- PostgreSQL数据库初始化脚本
-- 船舶区域监控系统

-- 创建数据库
CREATE DATABASE ship_monitoring
    WITH 
    ENCODING = 'UTF8'
    LC_COLLATE = 'zh_CN.UTF-8'
    LC_CTYPE = 'zh_CN.UTF-8'
    TEMPLATE = template0;

\c ship_monitoring;

-- 启用PostGIS扩展（用于地理空间数据）
CREATE EXTENSION IF NOT EXISTS postgis;

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== 1. 监控区域表 ====================
CREATE TABLE IF NOT EXISTS monitoring_areas (
    id SERIAL PRIMARY KEY,
    area_id VARCHAR(50) NOT NULL UNIQUE,  -- 船讯网返回的区域ID
    name VARCHAR(100) NOT NULL,
    polygon JSONB NOT NULL,  -- 多边形坐标 [[lng,lat],...]
    geometry GEOMETRY(POLYGON, 4326),  -- PostGIS几何对象，用于空间查询
    threshold_wind_speed DECIMAL(5,2) DEFAULT 15.00,  -- 风速阈值(m/s)
    threshold_wave_height DECIMAL(5,2) DEFAULT 3.00,  -- 浪高阈值(m)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_areas_area_id ON monitoring_areas(area_id);
CREATE INDEX idx_areas_is_active ON monitoring_areas(is_active);
CREATE INDEX idx_areas_geometry ON monitoring_areas USING GIST(geometry);  -- 空间索引

-- 创建触发器：自动更新updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_areas_updated_at
    BEFORE UPDATE ON monitoring_areas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 注释
COMMENT ON TABLE monitoring_areas IS '监控区域表';
COMMENT ON COLUMN monitoring_areas.area_id IS '船讯网返回的区域ID';
COMMENT ON COLUMN monitoring_areas.geometry IS 'PostGIS几何对象，用于空间查询';

-- ==================== 2. 区域内船舶表 ====================
CREATE TYPE ship_status AS ENUM ('in_area', 'left', 'warning');
CREATE TYPE risk_level AS ENUM ('safe', 'low', 'medium', 'high');

CREATE TABLE IF NOT EXISTS area_ships (
    id SERIAL PRIMARY KEY,
    area_id INTEGER NOT NULL REFERENCES monitoring_areas(id) ON DELETE CASCADE,
    mmsi BIGINT NOT NULL,
    ship_name VARCHAR(100),
    enter_time TIMESTAMP WITH TIME ZONE,
    leave_time TIMESTAMP WITH TIME ZONE,
    status ship_status DEFAULT 'in_area',
    last_position JSONB,  -- {lat, lng}
    last_point GEOMETRY(POINT, 4326),  -- PostGIS点对象
    last_weather JSONB,  -- 最新气象数据
    risk_level risk_level DEFAULT 'safe',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_area_mmsi_active UNIQUE(area_id, mmsi, status)
);

-- 创建索引
CREATE INDEX idx_ships_area_mmsi ON area_ships(area_id, mmsi);
CREATE INDEX idx_ships_status ON area_ships(status);
CREATE INDEX idx_ships_mmsi ON area_ships(mmsi);
CREATE INDEX idx_ships_point ON area_ships USING GIST(last_point);  -- 空间索引
CREATE INDEX idx_ships_weather ON area_ships USING GIN(last_weather);  -- JSONB索引

-- 触发器
CREATE TRIGGER update_ships_updated_at
    BEFORE UPDATE ON area_ships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE area_ships IS '区域内船舶表';

-- ==================== 3. 预警记录表 ====================
CREATE TYPE warning_severity AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE IF NOT EXISTS warnings (
    id SERIAL PRIMARY KEY,
    area_id INTEGER NOT NULL REFERENCES monitoring_areas(id) ON DELETE CASCADE,
    mmsi BIGINT NOT NULL,
    warning_type VARCHAR(50),  -- wind/wave/typhoon
    severity warning_severity DEFAULT 'low',
    message TEXT,
    weather_data JSONB,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引
CREATE INDEX idx_warnings_area_resolved ON warnings(area_id, is_resolved);
CREATE INDEX idx_warnings_mmsi ON warnings(mmsi);
CREATE INDEX idx_warnings_created_at ON warnings(created_at DESC);
CREATE INDEX idx_warnings_weather ON warnings USING GIN(weather_data);

COMMENT ON TABLE warnings IS '预警记录表';

-- ==================== 4. 事件日志表 ====================
CREATE TABLE IF NOT EXISTS event_logs (
    id SERIAL PRIMARY KEY,
    area_id INTEGER REFERENCES monitoring_areas(id) ON DELETE SET NULL,
    mmsi BIGINT,
    event_type VARCHAR(50) NOT NULL,  -- enter/leave/warning/update
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_logs_area_id ON event_logs(area_id);
CREATE INDEX idx_logs_mmsi ON event_logs(mmsi);
CREATE INDEX idx_logs_event_type ON event_logs(event_type);
CREATE INDEX idx_logs_created_at ON event_logs(created_at DESC);
CREATE INDEX idx_logs_event_data ON event_logs USING GIN(event_data);

-- 分区表（按月分区，提高查询性能）
-- CREATE TABLE event_logs_2025_01 PARTITION OF event_logs
--     FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

COMMENT ON TABLE event_logs IS '事件日志表';

-- ==================== 5. 系统配置表 ====================
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(50) UNIQUE NOT NULL,
    config_value TEXT,
    description VARCHAR(200),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 触发器
CREATE TRIGGER update_config_updated_at
    BEFORE UPDATE ON system_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 插入默认配置
INSERT INTO system_config (config_key, config_value, description) VALUES
('shipxy_api_key', 'your_api_key_here', '船讯网API密钥'),
('webhook_url', 'http://your-domain.com/webhook/area', 'Webhook接收地址'),
('update_interval', '600', '定时更新间隔(秒)'),
('default_wind_threshold', '15', '默认风速阈值(m/s)'),
('default_wave_threshold', '3', '默认浪高阈值(m)')
ON CONFLICT (config_key) DO UPDATE 
    SET config_value = EXCLUDED.config_value;

-- ==================== 视图 ====================

-- 区域统计视图
CREATE OR REPLACE VIEW v_area_statistics AS
SELECT 
    a.id,
    a.area_id,
    a.name,
    a.is_active,
    COUNT(DISTINCT CASE WHEN s.status = 'in_area' THEN s.mmsi END) as ship_count,
    COUNT(DISTINCT CASE WHEN w.is_resolved = FALSE THEN w.id END) as warning_count,
    MAX(s.updated_at) as last_activity,
    ST_AsGeoJSON(a.geometry) as geometry_geojson
FROM monitoring_areas a
LEFT JOIN area_ships s ON a.id = s.area_id
LEFT JOIN warnings w ON a.id = w.area_id
GROUP BY a.id, a.area_id, a.name, a.is_active, a.geometry;

COMMENT ON VIEW v_area_statistics IS '区域统计视图';

-- 活跃预警视图
CREATE OR REPLACE VIEW v_active_warnings AS
SELECT 
    w.id,
    w.area_id,
    a.name as area_name,
    w.mmsi,
    s.ship_name,
    w.warning_type,
    w.severity,
    w.message,
    w.weather_data,
    w.created_at,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - w.created_at))/3600 as hours_active
FROM warnings w
JOIN monitoring_areas a ON w.area_id = a.id
LEFT JOIN area_ships s ON w.area_id = s.area_id AND w.mmsi = s.mmsi
WHERE w.is_resolved = FALSE
ORDER BY w.severity DESC, w.created_at DESC;

COMMENT ON VIEW v_active_warnings IS '活跃预警视图';

-- ==================== 存储过程/函数 ====================

-- 1. 检查点是否在区域内（使用PostGIS）
CREATE OR REPLACE FUNCTION is_point_in_area(
    p_lng DECIMAL,
    p_lat DECIMAL,
    p_area_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_geometry GEOMETRY;
    v_point GEOMETRY;
BEGIN
    -- 获取区域几何对象
    SELECT geometry INTO v_geometry
    FROM monitoring_areas
    WHERE id = p_area_id;
    
    IF v_geometry IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- 创建点对象
    v_point := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326);
    
    -- 判断点是否在多边形内
    RETURN ST_Contains(v_geometry, v_point);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION is_point_in_area IS '检查点是否在区域内';
     
-- 2. 查找点所在的所有区域
CREATE OR REPLACE FUNCTION find_areas_containing_point(
    p_lng DECIMAL,
    p_lat DECIMAL
) RETURNS TABLE(area_id INTEGER, area_name VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.name
    FROM monitoring_areas a
    WHERE a.is_active = TRUE
    AND ST_Contains(
        a.geometry,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION find_areas_containing_point IS '查找点所在的所有区域';

-- 3. 清理历史数据
CREATE OR REPLACE FUNCTION cleanup_old_data(days_to_keep INTEGER DEFAULT 30)
RETURNS TEXT AS $$
DECLARE
    deleted_ships INTEGER;
    deleted_warnings INTEGER;
    deleted_logs INTEGER;
BEGIN
    -- 删除N天前离开的船舶记录
    DELETE FROM area_ships 
    WHERE status = 'left' 
    AND leave_time < CURRENT_TIMESTAMP - (days_to_keep || ' days')::INTERVAL;
    GET DIAGNOSTICS deleted_ships = ROW_COUNT;
    
    -- 删除N天前已解决的预警
    DELETE FROM warnings 
    WHERE is_resolved = TRUE 
    AND resolved_at < CURRENT_TIMESTAMP - (days_to_keep || ' days')::INTERVAL;
    GET DIAGNOSTICS deleted_warnings = ROW_COUNT;
    
    -- 删除N天前的事件日志
    DELETE FROM event_logs 
    WHERE created_at < CURRENT_TIMESTAMP - (days_to_keep || ' days')::INTERVAL;
    GET DIAGNOSTICS deleted_logs = ROW_COUNT;
    
    RETURN format('清理完成: 船舶记录 %s 条, 预警记录 %s 条, 日志记录 %s 条', 
                  deleted_ships, deleted_warnings, deleted_logs);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_data IS '清理历史数据';

-- 4. 获取区域内船舶统计
CREATE OR REPLACE FUNCTION get_area_ship_statistics(p_area_id INTEGER)
RETURNS TABLE(
    total_ships INTEGER,
    safe_ships INTEGER,
    warning_ships INTEGER,
    avg_wind_speed DECIMAL,
    max_wave_height DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_ships,
        COUNT(CASE WHEN risk_level = 'safe' THEN 1 END)::INTEGER as safe_ships,
        COUNT(CASE WHEN status = 'warning' THEN 1 END)::INTEGER as warning_ships,
        AVG((last_weather->>'windSpeed')::DECIMAL) as avg_wind_speed,
        MAX((last_weather->>'waveHeight')::DECIMAL) as max_wave_height
    FROM area_ships
    WHERE area_id = p_area_id
    AND status = 'in_area';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_area_ship_statistics IS '获取区域内船舶统计';

-- ==================== 定时任务（使用pg_cron扩展） ====================
-- 需要先安装pg_cron扩展
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 每天凌晨2点清理30天前的数据
-- SELECT cron.schedule('cleanup-old-data', '0 2 * * *', 'SELECT cleanup_old_data(30)');

-- ==================== 示例数据（可选） ====================
-- 插入测试区域
-- INSERT INTO monitoring_areas (area_id, name, polygon, geometry, threshold_wind_speed, threshold_wave_height)
-- VALUES (
--     'test_area_001',
--     '东海作业区A',
--     '[[120.0, 30.0], [121.0, 30.0], [121.0, 31.0], [120.0, 31.0], [120.0, 30.0]]'::JSONB,
--     ST_GeomFromText('POLYGON((120.0 30.0, 121.0 30.0, 121.0 31.0, 120.0 31.0, 120.0 30.0))', 4326),
--     15.00,
--     3.00
-- );

-- ==================== 权限设置 ====================
-- 创建应用用户
-- CREATE USER ship_monitor WITH PASSWORD 'your_secure_password';
-- GRANT CONNECT ON DATABASE ship_monitoring TO ship_monitor;
-- GRANT USAGE ON SCHEMA public TO ship_monitor;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ship_monitor;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ship_monitor;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ship_monitor;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ship_monitor;

-- ==================== 性能优化 ====================
-- 启用自动vacuum
ALTER TABLE area_ships SET (autovacuum_enabled = true);
ALTER TABLE event_logs SET (autovacuum_enabled = true);

-- 设置统计信息收集
ALTER TABLE area_ships ALTER COLUMN area_id SET STATISTICS 1000;
ALTER TABLE area_ships ALTER COLUMN mmsi SET STATISTICS 1000;

-- ==================== 完成 ====================
SELECT 'Database initialization completed successfully!' as status;
