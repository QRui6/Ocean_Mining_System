#!/usr/bin/env python3
"""
处理已下载的 GRIB2 文件，提取风场数据并合并为 NetCDF
"""

import pygrib
import numpy as np
import netCDF4 as nc
import os
import re
from datetime import datetime, timedelta

def parse_grib_filename(filename):
    """
    解析 GRIB 文件名，提取时间信息
    格式: gfs_YYYYMMDD_HHz_fXXX.grib2
    """
    match = re.match(r'gfs_(\d{8})_(\d{2})z_f(\d{3})\.grib2', filename)
    if not match:
        return None
    
    date_str = match.group(1)
    cycle_hour = int(match.group(2))
    forecast_hour = int(match.group(3))
    
    # 基准时间
    base_time = datetime.strptime(date_str, '%Y%m%d').replace(hour=cycle_hour)
    
    # 有效时间 = 基准时间 + 预报小时
    valid_time = base_time + timedelta(hours=forecast_hour)
    
    return {
        'filename': filename,
        'base_time': base_time,
        'forecast_hour': forecast_hour,
        'valid_time': valid_time
    }

def extract_wind_from_grib(grib_file):
    """从 GRIB2 文件提取 10m 风场"""
    print(f"  提取: {grib_file}")
    try:
        grbs = pygrib.open(grib_file)
        
        # 查找 10m U 和 V 分量
        u10 = grbs.select(name='10 metre U wind component')[0]
        v10 = grbs.select(name='10 metre V wind component')[0]
        
        u_data = u10.values
        v_data = v10.values
        lats, lons = u10.latlons()
        
        grbs.close()
        
        print(f"    ✅ 成功 (shape: {u_data.shape})")
        
        return {
            'u': u_data,
            'v': v_data,
            'lat': lats[:, 0],  # 第一列
            'lon': lons[0, :]   # 第一行
        }
    except Exception as e:
        print(f"    ❌ 失败: {e}")
        return None

def main():
    print("🌍 处理已下载的 GFS GRIB2 文件")
    print("=" * 70)
    print()
    
    # 查找所有 GRIB2 文件
    grib_files = [f for f in os.listdir('.') if f.endswith('.grib2')]
    
    if not grib_files:
        print("❌ 未找到 GRIB2 文件")
        print("   请确保在包含 .grib2 文件的目录中运行此脚本")
        return False
    
    print(f"📁 找到 {len(grib_files)} 个 GRIB2 文件")
    print()
    
    # 解析文件名，获取时间信息
    file_info_list = []
    for filename in grib_files:
        info = parse_grib_filename(filename)
        if info:
            file_info_list.append(info)
        else:
            print(f"⚠️  无法解析文件名: {filename}")
    
    if not file_info_list:
        print("❌ 没有有效的 GRIB2 文件")
        return False
    
    # 按有效时间排序
    file_info_list.sort(key=lambda x: x['valid_time'])
    
    print(f"📊 有效文件: {len(file_info_list)} 个")
    print(f"   时间范围: {file_info_list[0]['valid_time'].strftime('%Y-%m-%d %H:%M')} - {file_info_list[-1]['valid_time'].strftime('%Y-%m-%d %H:%M')}")
    print()
    
    # 显示时间列表
    print("时间列表:")
    for i, info in enumerate(file_info_list):
        print(f"  [{i+1:2d}] {info['valid_time'].strftime('%Y-%m-%d %H:%M')} UTC  ({info['filename']})")
    print()
    
    # 提取风场数据
    print("=" * 70)
    print("提取风场数据...")
    print("=" * 70)
    print()
    
    all_u = []
    all_v = []
    all_times = []
    lat = None
    lon = None
    
    for i, info in enumerate(file_info_list):
        print(f"[{i+1}/{len(file_info_list)}] {info['valid_time'].strftime('%Y-%m-%d %H:%M')}")
        
        data = extract_wind_from_grib(info['filename'])
        if data is None:
            print(f"    ⚠️  跳过")
            continue
        
        all_u.append(data['u'])
        all_v.append(data['v'])
        all_times.append(info['valid_time'])
        
        if lat is None:
            lat = data['lat']
            lon = data['lon']
    
    print()
    print(f"✅ 成功提取 {len(all_u)} 帧数据")
    print()
    
    if len(all_u) == 0:
        print("❌ 没有成功提取任何数据")
        return False
    
    # 转换为 numpy 数组
    print("转换为 numpy 数组...")
    u_array = np.array(all_u, dtype=np.float32)
    v_array = np.array(all_v, dtype=np.float32)
    
    print(f"  U 分量: {u_array.shape}")
    print(f"  V 分量: {v_array.shape}")
    print()
    
    # 转换时间为 seconds since 1970-01-01
    time_values = []
    for t in all_times:
        time_values.append((t - datetime(1970, 1, 1)).total_seconds())
    
    # 保存为 NetCDF
    output_file = 'wind_data.nc'
    print(f"💾 保存为 NetCDF: {output_file}")
    
    ds = nc.Dataset(output_file, 'w', format='NETCDF4')
    
    # 创建维度
    ds.createDimension('time', len(all_times))
    ds.createDimension('latitude', len(lat))
    ds.createDimension('longitude', len(lon))
    
    # 创建变量
    times_var = ds.createVariable('valid_time', 'f8', ('time',))
    lats_var = ds.createVariable('latitude', 'f4', ('latitude',))
    lons_var = ds.createVariable('longitude', 'f4', ('longitude',))
    u_var = ds.createVariable('u10', 'f4', ('time', 'latitude', 'longitude'), 
                              zlib=True, complevel=4)
    v_var = ds.createVariable('v10', 'f4', ('time', 'latitude', 'longitude'),
                              zlib=True, complevel=4)
    
    # 写入数据
    print("  写入时间...")
    times_var[:] = time_values
    print("  写入经纬度...")
    lats_var[:] = lat
    lons_var[:] = lon
    print("  写入 U 分量...")
    u_var[:] = u_array
    print("  写入 V 分量...")
    v_var[:] = v_array
    
    # 添加属性
    times_var.units = 'seconds since 1970-01-01'
    times_var.long_name = 'valid time'
    lats_var.units = 'degrees_north'
    lats_var.long_name = 'latitude'
    lons_var.units = 'degrees_east'
    lons_var.long_name = 'longitude'
    u_var.units = 'm/s'
    u_var.long_name = '10 metre U wind component'
    v_var.units = 'm/s'
    v_var.long_name = '10 metre V wind component'
    
    # 全局属性
    ds.data_source = 'NOAA GFS 0.25 degree'
    ds.start_time = all_times[0].isoformat()
    ds.end_time = all_times[-1].isoformat()
    ds.created_at = datetime.utcnow().isoformat()
    
    ds.close()
    
    file_size = os.path.getsize(output_file)
    print(f"✅ 文件已保存")
    print(f"📦 文件大小: {file_size / 1024 / 1024:.2f} MB")
    print()
    
    # 显示数据摘要
    print("=" * 70)
    print("📊 数据摘要")
    print("=" * 70)
    print(f"输出文件: {output_file}")
    print(f"时间帧数: {len(all_times)}")
    print(f"时间范围: {all_times[0].strftime('%Y-%m-%d %H:%M')} - {all_times[-1].strftime('%Y-%m-%d %H:%M')} UTC")
    print(f"空间分辨率: 0.25°")
    print(f"纬度范围: {lat[0]:.2f}° - {lat[-1]:.2f}°")
    print(f"经度范围: {lon[0]:.2f}° - {lon[-1]:.2f}°")
    print(f"数据形状: {u_array.shape}")
    print()
    
    print("=" * 70)
    print("🎉 完成！")
    print("=" * 70)
    print()
    print("下一步:")
    print("  python3 convert_wind_to_binary.py")
    print()
    
    return True

if __name__ == '__main__':
    import sys
    success = main()
    sys.exit(0 if success else 1)
