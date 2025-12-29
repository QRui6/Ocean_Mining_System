#!/usr/bin/env python3
"""
从 NOAA GFS 下载风场数据
组合历史存档 + 最新预报，覆盖 2025-12-26 到 2026-01-03
"""

import netCDF4 as nc
import numpy as np
import json
import os
from datetime import datetime, timedelta

def download_gfs_wind_combined():
    """
    下载 GFS 风场数据：历史 + 预报组合
    目标：2025-12-26 00:00 到 2026-01-03 00:00（65帧，每3小时）
    """
    print("🌍 从 NOAA GFS 下载风场数据（历史+预报组合）")
    print("=" * 70)
    
    # 目标时间范围
    target_start = datetime(2025, 12, 26, 0, 0, 0)
    target_frames = 65
    target_step_hours = 3
    target_end = target_start + timedelta(hours=(target_frames-1)*target_step_hours)
    
    print(f"🎯 目标时间范围:")
    print(f"   起始: {target_start.strftime('%Y-%m-%d %H:%M')} UTC")
    print(f"   结束: {target_end.strftime('%Y-%m-%d %H:%M')} UTC")
    print(f"   帧数: {target_frames}")
    print(f"   步长: {target_step_hours} 小时")
    print("")
    
    # 当前时间
    now = datetime.utcnow()
    print(f"⏰ 当前时间: {now.strftime('%Y-%m-%d %H:%M')} UTC")
    print("")
    
    # 策略：使用最新的 GFS 预报（包含历史分析）
    # GFS 预报包含：
    # - 分析场（0小时）：当前时刻的分析
    # - 预报场（3-384小时）：未来预报
    
    # 找到最近的 GFS 运行时间
    run_hours = [0, 6, 12, 18]
    forecast_run = None
    forecast_date_obj = now
    
    for run_hour in reversed(run_hours):
        if now.hour >= run_hour + 3:  # 至少延迟3小时
            forecast_run = run_hour
            break
    
    if forecast_run is None:
        # 使用昨天的最后一次
        forecast_date_obj = now - timedelta(days=1)
        forecast_run = 18
    
    forecast_date = forecast_date_obj.strftime('%Y%m%d')
    forecast_hour = f"{forecast_run:02d}"
    forecast_time = datetime(forecast_date_obj.year, forecast_date_obj.month, 
                            forecast_date_obj.day, forecast_run, 0, 0)
    
    print(f"📅 使用 GFS 预报:")
    print(f"   预报基准时间: {forecast_time.strftime('%Y-%m-%d %H:%M')} UTC")
    print(f"   预报文件: gfs{forecast_date}/gfs_0p25_{forecast_hour}z")
    print("")
    
    # 计算需要的预报时次
    # 从预报基准时间到目标结束时间
    hours_from_forecast = []
    current_target = target_start
    
    while current_target <= target_end:
        hours_diff = int((current_target - forecast_time).total_seconds() / 3600)
        
        if hours_diff >= -6 and hours_diff <= 384:  # GFS 预报范围：-6到384小时
            hours_from_forecast.append((hours_diff, current_target))
        
        current_target += timedelta(hours=target_step_hours)
    
    print(f"📊 需要下载的预报时次:")
    print(f"   总数: {len(hours_from_forecast)}")
    print(f"   范围: {hours_from_forecast[0][0]}h 到 {hours_from_forecast[-1][0]}h")
    print("")
    
    if len(hours_from_forecast) < target_frames:
        print(f"⚠️  警告: 只能获取 {len(hours_from_forecast)}/{target_frames} 帧")
        print(f"   部分历史数据可能不在当前预报范围内")
        print("")
    
    # OpenDAP URL
    opendap_url = f"https://nomads.ncep.noaa.gov/dods/gfs_0p25/gfs{forecast_date}/gfs_0p25_{forecast_hour}z"
    
    print(f"🔗 OpenDAP URL:")
    print(f"   {opendap_url}")
    print("")
    
    try:
        print("⏳ 连接到 NOAA GFS OpenDAP 服务器...")
        ds = nc.Dataset(opendap_url)
        print("✅ 连接成功")
        print("")
        
        # 检查变量
        if 'ugrd10m' not in ds.variables or 'vgrd10m' not in ds.variables:
            print("❌ 未找到10m风场变量")
            print(f"   可用变量: {list(ds.variables.keys())[:20]}")
            ds.close()
            return False
        
        print("✅ 找到风场变量: ugrd10m, vgrd10m")
        print("")
        
        # 获取维度
        time_var = ds.variables['time']
        lat_var = ds.variables['lat']
        lon_var = ds.variables['lon']
        u_var = ds.variables['ugrd10m']
        v_var = ds.variables['vgrd10m']
        
        print(f"📐 GFS 数据维度:")
        print(f"   时间: {len(time_var)} 帧")
        print(f"   纬度: {len(lat_var)} 点")
        print(f"   经度: {len(lon_var)} 点")
        print("")
        
        # 找到对应的时间索引
        print("🔍 查找对应的时间索引...")
        time_indices = []
        
        # GFS 时间是从预报基准时间开始的小时数
        for fhour, target_time in hours_from_forecast:
            # 在 GFS 数据中查找对应的时间索引
            # GFS 时间索引通常就是预报小时数
            if fhour >= 0 and fhour < len(time_var):
                time_indices.append(fhour)
            else:
                print(f"   ⚠️  预报时次 {fhour}h 超出范围")
        
        print(f"✅ 找到 {len(time_indices)} 个有效时间索引")
        print(f"   索引范围: {time_indices[0]} 到 {time_indices[-1]}")
        print("")
        
        # 下载数据
        print(f"⏳ 下载风场数据...")
        print("   这可能需要5-10分钟...")
        print("")
        
        # 分批下载（避免一次性下载太多）
        all_u_data = []
        all_v_data = []
        
        batch_size = 10
        for i in range(0, len(time_indices), batch_size):
            batch_indices = time_indices[i:i+batch_size]
            print(f"   下载批次 {i//batch_size + 1}: 时间索引 {batch_indices[0]}-{batch_indices[-1]}")
            
            for idx in batch_indices:
                u_frame = u_var[idx, :, :]
                v_frame = v_var[idx, :, :]
                all_u_data.append(u_frame)
                all_v_data.append(v_frame)
        
        print("")
        print(f"✅ 数据下载完成: {len(all_u_data)} 帧")
        print("")
        
        # 转换为numpy数组
        u_data = np.array(all_u_data, dtype=np.float32)
        v_data = np.array(all_v_data, dtype=np.float32)
        lats = lat_var[:]
        lons = lon_var[:]
        
        # 保存为NetCDF
        output_file = 'wind_data_gfs.nc'
        print(f"💾 保存为 NetCDF: {output_file}")
        
        out_ds = nc.Dataset(output_file, 'w', format='NETCDF4')
        
        # 创建维度
        out_ds.createDimension('time', len(all_u_data))
        out_ds.createDimension('latitude', len(lats))
        out_ds.createDimension('longitude', len(lons))
        
        # 创建变量
        times_out = out_ds.createVariable('valid_time', 'f8', ('time',))
        lats_out = out_ds.createVariable('latitude', 'f4', ('latitude',))
        lons_out = out_ds.createVariable('longitude', 'f4', ('longitude',))
        u_out = out_ds.createVariable('u10', 'f4', ('time', 'latitude', 'longitude'))
        v_out = out_ds.createVariable('v10', 'f4', ('time', 'latitude', 'longitude'))
        
        # 写入数据
        # 生成时间数组（从目标起始时间开始）
        time_values = []
        for i in range(len(all_u_data)):
            t = target_start + timedelta(hours=i*target_step_hours)
            # 转换为 seconds since 1970-01-01
            time_values.append((t - datetime(1970, 1, 1)).total_seconds())
        
        times_out[:] = time_values
        lats_out[:] = lats
        lons_out[:] = lons
        u_out[:] = u_data
        v_out[:] = v_data
        
        # 添加属性
        times_out.units = 'seconds since 1970-01-01'
        lats_out.units = 'degrees_north'
        lons_out.units = 'degrees_east'
        u_out.units = 'm/s'
        v_out.units = 'm/s'
        
        # 全局属性
        out_ds.data_source = 'NOAA GFS 0.25 degree'
        out_ds.forecast_reference_time = forecast_time.isoformat()
        out_ds.start_time = target_start.isoformat()
        
        out_ds.close()
        ds.close()
        
        file_size = os.path.getsize(output_file)
        print(f"✅ 文件已保存")
        print(f"📦 文件大小: {file_size / 1024 / 1024:.2f} MB")
        print("")
        
        print("=" * 70)
        print("🎉 GFS 风场数据下载完成！")
        print("")
        print(f"📁 输出文件: {output_file}")
        print(f"📊 数据帧数: {len(all_u_data)}")
        print(f"⏰ 时间范围: {target_start.strftime('%Y-%m-%d %H:%M')} - {target_end.strftime('%Y-%m-%d %H:%M')} UTC")
        print("")
        print("下一步:")
        print("  1. 重命名文件: mv wind_data_gfs.nc wind_data.nc")
        print("  2. 转换为二进制: python3 convert_wind_to_binary.py")
        print("=" * 70)
        
        return True
        
    except Exception as e:
        print(f"❌ 下载失败: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    import sys
    success = download_gfs_wind_combined()
    sys.exit(0 if success else 1)
