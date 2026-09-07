-- 验证Wave数据迁移结果

-- 1. 检查所有表的记录数
SELECT 'weather_data_types' as table_name, COUNT(*) as count FROM weather_data_types
UNION ALL
SELECT 'weather_metadata', COUNT(*) FROM weather_metadata
UNION ALL
SELECT 'wind_data', COUNT(*) FROM wind_data
UNION ALL
SELECT 'ocean_current_data', COUNT(*) FROM ocean_current_data
UNION ALL
SELECT 'wave_data', COUNT(*) FROM wave_data;

-- 2. 检查wave_data表的详细信息
SELECT 
    id, 
    time_index, 
    data_size, 
    u_min, 
    u_max, 
    v_min, 
    v_max,
    hs_min,
    hs_max,
    created_at
FROM wave_data 
ORDER BY time_index 
LIMIT 10;

-- 3. 检查wave元数据
SELECT 
    wm.id,
    wdt.type_code,
    wm.grid_lon_size,
    wm.grid_lat_size,
    wm.total_frames,
    wm.data_source,
    wm.start_time
FROM weather_metadata wm
JOIN weather_data_types wdt ON wm.data_type_id = wdt.id
WHERE wdt.type_code = 'wave';

-- 4. 统计wave数据的时间索引范围
SELECT 
    MIN(time_index) as min_index,
    MAX(time_index) as max_index,
    COUNT(*) as total_frames
FROM wave_data;
