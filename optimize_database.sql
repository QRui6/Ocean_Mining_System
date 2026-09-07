-- ========================================
-- 数据库性能优化脚本
-- 执行方式: psql -U postgres -d ship_monitoring -f optimize_database.sql
-- ========================================

-- 1. 添加查询索引
CREATE INDEX IF NOT EXISTS idx_wind_data_lookup 
ON wind_data(metadata_id, time_index);

CREATE INDEX IF NOT EXISTS idx_ocean_current_data_lookup 
ON ocean_current_data(metadata_id, time_index);

CREATE INDEX IF NOT EXISTS idx_wave_data_lookup 
ON wave_data(metadata_id, time_index);

CREATE INDEX IF NOT EXISTS idx_weather_metadata_type 
ON weather_metadata(data_type_id);

-- 2. 验证索引创建成功
SELECT 
    schemaname,
    tablename, 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('wind_data', 'ocean_current_data', 'wave_data', 'weather_metadata')
ORDER BY tablename, indexname;

-- 3. 分析表以更新统计信息
ANALYZE wind_data;
ANALYZE ocean_current_data;
ANALYZE wave_data;
ANALYZE weather_metadata;

-- 4. 查看表大小
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE tablename IN ('wind_data', 'ocean_current_data', 'wave_data', 'weather_metadata')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 5. 查看数据统计
SELECT 'wind_data' as table_name, COUNT(*) as row_count FROM wind_data
UNION ALL
SELECT 'ocean_current_data', COUNT(*) FROM ocean_current_data
UNION ALL
SELECT 'wave_data', COUNT(*) FROM wave_data
UNION ALL
SELECT 'weather_metadata', COUNT(*) FROM weather_metadata;

-- 完成
SELECT '✅ 数据库优化完成！' as status;
