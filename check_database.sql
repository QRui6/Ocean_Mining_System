-- 检查数据库中各个气象数据表的实际情况

-- 1. 检查 wind_data 表
SELECT 'wind_data' as table_name, 
       metadata_id, 
       time_index, 
       COUNT(*) as count,
       MIN(u_min) as u_min,
       MAX(u_max) as u_max
FROM wind_data 
GROUP BY metadata_id, time_index 
ORDER BY time_index;

-- 2. 检查 wave_data 表
SELECT 'wave_data' as table_name,
       metadata_id, 
       time_index, 
       COUNT(*) as count,
       MIN(hs_min) as hs_min,
       MAX(hs_max) as hs_max
FROM wave_data 
GROUP BY metadata_id, time_index 
ORDER BY time_index;

-- 3. 检查 ocean_current_data 表
SELECT 'ocean_current_data' as table_name,
       metadata_id, 
       time_index, 
       COUNT(*) as count,
       MIN(u_min) as u_min,
       MAX(u_max) as u_max
FROM ocean_current_data 
GROUP BY metadata_id, time_index 
ORDER BY time_index;

-- 4. 检查 internal_wave_data 表（如果存在）
SELECT 'internal_wave_data' as table_name,
       metadata_id, 
       time_index, 
       COUNT(*) as count
FROM internal_wave_data 
GROUP BY metadata_id, time_index 
ORDER BY time_index;

-- 5. 检查元数据
SELECT id, data_type_id, total_frames, grid_lon_size, grid_lat_size
FROM weather_metadata;
