#!/usr/bin/env python3
"""
从 AWS Open Data 下载 GFS 风场数据（拼接法）
历史分析场（12.26-12.28）+ 最新预报场（12.29-01.03）
"""

import requests
import pygrib
import numpy as np
import netCDF4 as nc
import os
from datetime import datetime, timedelta

def download_grib_file(url, output_path):
    """下载 GRIB2 文件"""
    print(f"  下载: {os.path.basename(url)}")
    try:
        response = requests.get(url, timeout=300)
        if response.status_code == 200:
            with open(output_path, 'wb') as f:
                f.write(response.content)
            print(f"    ✅ 完成 ({len(response.content)/1024/1024:.1f} MB)")
            return True
        else:
            print(f"    ❌ HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"    ❌ 失败: {e}")
        return False

def download_historical_analysis():
    """
    下载历史分析场（12月26-28日）
    每天 4 个时次：00z, 06z, 12z, 18z
    每个时次下载 f000（分析场）
    """
    print("=" * 70)
    print("📥 第一步：下载历史分析场（12月26-28日）")
    print("=" * 70)
    print()
    
    # AWS Open Data 基础 URL
    base_url = "https://noaa-gfs-bdp-pds.s3.amazonaws.com"
    
    # 历史日期范围
    start_date = datetime(2025, 12, 26)
    end_date = datetime(2025, 12, 28)
    cycles = ['00', '06', '12', '18']
    
    downloaded_files = []
    current_date = start_date
    
    while current_date <= end_date:
        date_str = current_date.strftime('%Y%m%d')
        
        for cycle in cycles:
            # 检查是否超过当前时间
            cycle_time = datetime(current_date.year, current_date.month, 
                                 current_date.day, int(cycle), 0, 0)
            
            # 如果是今天，只下载已经发布的时次（至少延迟4小时）
            now = datetime.utcnow()
            if cycle_time > now - timedelta(hours=4):
                print(f"⏭️  跳过 {date_str} {cycle}z (尚未发布)")
                continue
            
            # 构建 URL
            # 格式: gfs.YYYYMMDD/HH/atmos/gfs.tHHz.pgrb2.0p25.f000
            url = f"{base_url}/gfs.{date_str}/{cycle}/atmos/gfs.t{cycle}z.pgrb2.0p25.f000"
            output_file = f"gfs_{date_str}_{cycle}z_f000.grib2"
            
            print(f"📅 {date_str} {cycle}z (分析场)")
            
            if download_grib_file(url, output_file):
                downloaded_files.append({
                    'file': output_file,
                    'time': cycle_time,
                    'type': 'analysis'
                })
            print()
        
        current_date += timedelta(days=1)
    
    print(f"✅ 历史分析场下载完成: {len(downloaded_files)} 个文件")
    print()
    return downloaded_files

def download_forecast():
    """
    下载最新预报场（12月29日-1月3日）
    使用今天最新的一次预报
    """
    print("=" * 70)
    print("📥 第二步：下载最新预报场（12月29日-1月3日）")
    print("=" * 70)
    print()
    
    base_url = "https://noaa-gfs-bdp-pds.s3.amazonaws.com"
    
    # 找到最新的预报时次
    now = datetime.utcnow()
    cycles = ['18', '12', '06', '00']
    
    forecast_date = None
    forecast_cycle = None
    
    # 尝试今天和昨天的预报
    for days_ago in [0, 1]:
        check_date = now - timedelta(days=days_ago)
        date_str = check_date.strftime('%Y%m%d')
        
        for cycle in cycles:
            cycle_time = datetime(check_date.year, check_date.month, 
                                 check_date.day, int(cycle), 0, 0)
            
            # 至少延迟4小时
            if cycle_time <= now - timedelta(hours=4):
                forecast_date = date_str
                forecast_cycle = cycle
                forecast_time = cycle_time
                break
        
        if forecast_date:
            break
    
    print(f"🎯 使用预报:")
    print(f"   日期: {forecast_date}")
    print(f"   时次: {forecast_cycle}z")
    print(f"   基准时间: {forecast_time.strftime('%Y-%m-%d %H:%M')} UTC")
    print()
    
    # 计算需要的预报时次
    # 从 12月29日 00:00 到 1月3日 00:00，每3小时一个
    target_start = datetime(2025, 12, 29, 0, 0, 0)
    target_end = datetime(2026, 1, 3, 0, 0, 0)
    
    downloaded_files = []
    current_target = target_start
    
    while current_target <= target_end:
        # 计算预报小时数
        hours_diff = int((current_target - forecast_time).total_seconds() / 3600)
        
        if hours_diff < 0:
            print(f"⚠️  {current_target.strftime('%m-%d %H:%M')} 在预报基准时间之前，跳过")
            current_target += timedelta(hours=3)
            continue
        
        if hours_diff > 384:
            print(f"⚠️  {current_target.strftime('%m-%d %H:%M')} 超出预报范围（>384h），跳过")
            current_target += timedelta(hours=3)
            continue
        
        # 构建 URL
        forecast_hour = f"{hours_diff:03d}"
        url = f"{base_url}/gfs.{forecast_date}/{forecast_cycle}/atmos/gfs.t{forecast_cycle}z.pgrb2.0p25.f{forecast_hour}"
        output_file = f"gfs_{forecast_date}_{forecast_cycle}z_f{forecast_hour}.grib2"
        
        print(f"📅 {current_target.strftime('%Y-%m-%d %H:%M')} (预报 +{hours_diff}h)")
        
        if download_grib_file(url, output_file):
            downloaded_files.append({
                'file': output_file,
                'time': current_target,
                'type': 'forecast'
            })
        print()
        
        current_target += timedelta(hours=3)
    
    print(f"✅ 预报场下载完成: {len(downloaded_files)} 个文件")
    print()
    return downloaded_files

def extract_wind_from_grib(grib_file):
    """从 GRIB2 文件提取 10m 风场"""
    try:
        grbs = pygrib.open(grib_file)
        
        # 查找 10m U 和 V 分量
        u10 = grbs.select(name='10 metre U wind component')[0]
        v10 = grbs.select(name='10 metre V wind component')[0]
        
        u_data = u10.values
        v_data = v10.values
        lats, lons = u10.latlons()
        
        grbs.close()
        
        return {
            'u': u_data,
            'v': v_data,
            'lat': lats[:, 0],  # 第一列
            'lon': lons[0, :]   # 第一行
        }
    except Exception as e:
        print(f"    ❌ 提取失败: {e}")
        return None

def combine_to_netcdf(all_files):
    """合并所有 GRIB 文件为一个 NetCDF"""
    print("=" * 70)
    print("🔄 第三步：合并为 NetCDF")
    print("=" * 70)
    print()
    
    # 按时间排序
    all_files.sort(key=lambda x: x['time'])
    
    print(f"📊 总共 {len(all_files)} 个时间点")
    print(f"   时间范围: {all_files[0]['time'].strftime('%Y-%m-%d %H:%M')} - {all_files[-1]['time'].strftime('%Y-%m-%d %H:%M')}")
    print()
    
    # 提取数据
    all_u = []
    all_v = []
    all_times = []
    lat = None
    lon = None
    
    for i, file_info in enumerate(all_files):
        print(f"  [{i+1}/{len(all_files)}] 处理 {file_info['file']}")
        
        data = extract_wind_from_grib(file_info['file'])
        if data is None:
            print(f"    ⚠️  跳过")
            continue
        
        all_u.append(data['u'])
        all_v.append(data['v'])
        all_times.append(file_info['time'])
        
        if lat is None:
            lat = data['lat']
            lon = data['lon']
    
    print()
    print(f"✅ 成功提取 {len(all_u)} 帧数据")
    print()
    
    # 转换为 numpy 数组
    u_array = np.array(all_u, dtype=np.float32)
    v_array = np.array(all_v, dtype=np.float32)
    
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
    u_var = ds.createVariable('u10', 'f4', ('time', 'latitude', 'longitude'))
    v_var = ds.createVariable('v10', 'f4', ('time', 'latitude', 'longitude'))
    
    # 写入数据
    times_var[:] = time_values
    lats_var[:] = lat
    lons_var[:] = lon
    u_var[:] = u_array
    v_var[:] = v_array
    
    # 添加属性
    times_var.units = 'seconds since 1970-01-01'
    lats_var.units = 'degrees_north'
    lons_var.units = 'degrees_east'
    u_var.units = 'm/s'
    v_var.units = 'm/s'
    
    # 全局属性
    ds.data_source = 'NOAA GFS 0.25 degree (AWS Open Data)'
    ds.start_time = all_times[0].isoformat()
    ds.end_time = all_times[-1].isoformat()
    ds.time_step = '3 hours'
    
    ds.close()
    
    file_size = os.path.getsize(output_file)
    print(f"✅ 文件已保存")
    print(f"📦 文件大小: {file_size / 1024 / 1024:.2f} MB")
    print()
    
    return output_file

def cleanup_grib_files(all_files):
    """清理临时 GRIB 文件"""
    print("🧹 清理临时文件...")
    for file_info in all_files:
        try:
            if os.path.exists(file_info['file']):
                os.remove(file_info['file'])
        except:
            pass
    print("✅ 清理完成")
    print()

def main():
    print("🌍 GFS 风场数据下载工具（拼接法）")
    print("📅 目标时间: 2025-12-26 00:00 - 2026-01-03 00:00")
    print("📊 数据源: AWS Open Data (NOAA GFS)")
    print()
    
    # 第一步：下载历史分析场
    historical_files = download_historical_analysis()
    
    # 第二步：下载最新预报场
    forecast_files = download_forecast()
    
    # 合并所有文件
    all_files = historical_files + forecast_files
    
    if len(all_files) == 0:
        print("❌ 没有下载到任何文件")
        return False
    
    # 第三步：合并为 NetCDF
    output_file = combine_to_netcdf(all_files)
    
    # 清理临时文件
    cleanup_grib_files(all_files)
    
    print("=" * 70)
    print("🎉 完成！")
    print("=" * 70)
    print()
    print(f"📁 输出文件: {output_file}")
    print(f"📊 数据帧数: {len(all_files)}")
    print()
    print("下一步:")
    print("  python3 convert_wind_to_binary.py")
    print()
    
    return True

if __name__ == '__main__':
    import sys
    success = main()
    sys.exit(0 if success else 1)
