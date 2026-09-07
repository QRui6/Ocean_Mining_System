-- 移除area_id的唯一约束,因为同一个矿区可能有多个polygon
\c ship_monitoring;

-- 删除唯一约束
ALTER TABLE mining_areas DROP CONSTRAINT IF EXISTS mining_areas_area_id_key;

-- 重新创建索引(非唯一)
DROP INDEX IF EXISTS idx_mining_areas_area_id;
CREATE INDEX idx_mining_areas_area_id ON mining_areas(area_id);

SELECT '✅ 已移除area_id的唯一约束' as status;
