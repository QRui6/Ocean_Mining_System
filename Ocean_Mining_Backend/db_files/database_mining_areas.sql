-- 海洋矿区数据表结构
-- 用于存储 ISA 合同区域和环境保护区数据

-- 连接到数据库
\c ship_monitoring;

-- ==================== 海洋矿区表 ====================
CREATE TABLE IF NOT EXISTS mining_areas (
    id SERIAL PRIMARY KEY,
    area_id VARCHAR(50) NOT NULL UNIQUE,           -- 矿区ID (如 APEI-10, BGRPMN1)
    category VARCHAR(50) NOT NULL,                 -- 类别 (APEI/Exploration)
    mineral VARCHAR(200),                          -- 矿产类型
    area_km2 DECIMAL(10, 2),                      -- 面积(平方公里)
    location VARCHAR(100),                         -- 位置描述
    contractor VARCHAR(200),                       -- 承包商
    sponsor VARCHAR(100),                          -- 赞助国
    date_range VARCHAR(100),                       -- 日期范围
    status VARCHAR(50),                            -- 状态 (Protected/Active)
    color VARCHAR(20),                             -- 显示颜色
    coordinates JSONB NOT NULL,                    -- GeoJSON 坐标数据
    geometry GEOMETRY(POLYGON, 4326),              -- PostGIS几何对象
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE mining_areas IS '海洋矿区表';
COMMENT ON COLUMN mining_areas.area_id IS '矿区唯一标识';
COMMENT ON COLUMN mining_areas.category IS '矿区类别 (APEI环境保护区/Exploration勘探区)';
COMMENT ON COLUMN mining_areas.mineral IS '矿产类型';
COMMENT ON COLUMN mining_areas.area_km2 IS '矿区面积(平方公里)';
COMMENT ON COLUMN mining_areas.contractor IS '承包商名称';
COMMENT ON COLUMN mining_areas.sponsor IS '赞助国家';
COMMENT ON COLUMN mining_areas.coordinates IS 'GeoJSON格式的坐标数据';
COMMENT ON COLUMN mining_areas.geometry IS 'PostGIS几何对象，用于空间查询';

-- 创建索引
CREATE INDEX idx_mining_areas_area_id ON mining_areas(area_id);
CREATE INDEX idx_mining_areas_category ON mining_areas(category);
CREATE INDEX idx_mining_areas_status ON mining_areas(status);
CREATE INDEX idx_mining_areas_sponsor ON mining_areas(sponsor);
CREATE INDEX idx_mining_areas_geometry ON mining_areas USING GIST(geometry);  -- 空间索引

-- 创建触发器：自动更新updated_at
CREATE TRIGGER update_mining_areas_updated_at
    BEFORE UPDATE ON mining_areas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================== 空间查询函数 ====================

-- 1. 查找点所在的矿区
CREATE OR REPLACE FUNCTION find_mining_areas_at_point(
    p_lng DECIMAL,
    p_lat DECIMAL
) RETURNS TABLE(
    area_id VARCHAR,
    area_name VARCHAR,
    category VARCHAR,
    sponsor VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.area_id,
        m.contractor,
        m.category,
        m.sponsor
    FROM mining_areas m
    WHERE ST_Contains(
        m.geometry,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION find_mining_areas_at_point IS '查找指定点所在的矿区';

-- 2. 查找与指定区域相交的矿区
CREATE OR REPLACE FUNCTION find_mining_areas_intersecting(
    p_geometry GEOMETRY
) RETURNS TABLE(
    area_id VARCHAR,
    area_name VARCHAR,
    category VARCHAR,
    intersection_area DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.area_id,
        m.contractor,
        m.category,
        ST_Area(ST_Intersection(m.geometry, p_geometry)::geography) / 1000000 as intersection_area_km2
    FROM mining_areas m
    WHERE ST_Intersects(m.geometry, p_geometry)
    ORDER BY intersection_area_km2 DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION find_mining_areas_intersecting IS '查找与指定区域相交的矿区';

-- 3. 按类别统计矿区
CREATE OR REPLACE VIEW v_mining_area_statistics AS
SELECT 
    category,
    COUNT(*) as area_count,
    SUM(area_km2) as total_area_km2,
    COUNT(DISTINCT sponsor) as sponsor_count
FROM mining_areas
GROUP BY category;

COMMENT ON VIEW v_mining_area_statistics IS '矿区统计视图';

-- 4. 按国家统计矿区
CREATE OR REPLACE VIEW v_mining_area_by_sponsor AS
SELECT 
    sponsor,
    category,
    COUNT(*) as area_count,
    SUM(area_km2) as total_area_km2
FROM mining_areas
GROUP BY sponsor, category
ORDER BY total_area_km2 DESC;

COMMENT ON VIEW v_mining_area_by_sponsor IS '按国家统计矿区视图';

-- ==================== 性能优化 ====================
-- 启用自动vacuum
ALTER TABLE mining_areas SET (autovacuum_enabled = true);

-- 设置统计信息收集
ALTER TABLE mining_areas ALTER COLUMN area_id SET STATISTICS 1000;
ALTER TABLE mining_areas ALTER COLUMN category SET STATISTICS 1000;
ALTER TABLE mining_areas ALTER COLUMN sponsor SET STATISTICS 1000;

-- ==================== 完成 ====================
SELECT 'Mining areas table created successfully!' as status;
