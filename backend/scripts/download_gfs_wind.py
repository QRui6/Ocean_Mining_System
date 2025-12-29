#!/usr/bin/env python3
"""
从 NOAA GFS 下载风场预报数据
支持最新实况 + 未来预报
"""

import requests
import os
import sys
from datetime import datetime, timedelta
import subprocess

def download_gfs_wind():
    """
    下载 GFS 风场预报数据
    """
    print("🌍 开始下载 NOAA GFS 风场预报数据...")
    print("=" * 70)
    
    # 获取最新的GFS运行时间
    now = datetime.utcnow()
    
    # GFS 每天运行4次：00, 06, 12, 18 UTC
    # 找到最近的运行时间
    run_hours = [0, 6, 12, 18]
    current_hour = now.hour
    
    # 找到最近的已完成运行（通常延迟3-4小时）
    for run_hour in reversed(run_hours):
        if current_hour >= run_hour + 4:
            forecast_run = run_hour
            break
    else:
        # 如果当天没有完成的运行，使用昨天的最后一次
        now = now - timedelta(days=1)
        forecast_run = 18
    
    forecast_date = now.strftime('%Y%m%d')
    forecast_hour = f"{forecast_run:02d}"
    
    print(f"📅 使用 GFS 预报:")
    print(f"   日期: {forecast_date}")
    print(f"   运行时间: {forecast_hour}:00 UTC")
    print(f"   预报范围: 0-192小时（8天）")
    print(f"   时间步长: 3小时")
    print("")
    
    # 计算需要下载的预报时次（0-192小时，每3小时）
    forecast_hours = list(range(0, 195, 3))  # 0, 3, 6, ..., 192
    total_frames = len(forecast_hours)
    
    print(f"📊 预报信息:")
    print(f"   总帧数: {total_frames}")
    print(f"   起始时间: {now.strftime('%Y-%m-%d')} {forecast_hour}:00 UTC")
    
    start_time = datetime(now.year, now.month, now.day, forecast_run, 0, 0)
    end_time = start_time + timedelta(hours=192)
    print(f"   结束时间: {end_time.strftime('%Y-%m-%d %H:%M')} UTC")
    print("")
    
    # 检查是否安装了 wgrib2
    try:
        subprocess.run(['wgrib2', '-version'], capture_output=True, check=True)
        print("✅ wgrib2 已安装")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ 未安装 wgrib2")
        print("")
        print("请安装 wgrib2:")
        print("  Ubuntu/Debian: sudo apt-get install wgrib2")
        print("  CentOS/RHEL: sudo yum install wgrib2")
        print("  macOS: brew install wgrib2")
        print("")
        return False
    
    print("")
    print("⏳ 开始下载 GFS 数据...")
    print("   这可能需要10-20分钟，取决于网络速度")
    print("")
    
    # GFS 数据 URL 模板
    base_url = f"https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl"
    
    # 下载参数
    params = {
        'file': f'gfs.t{forecast_hour}z.pgrb2.0p25.f{{fhour:03d}}',
        'lev_10_m_above_ground': 'on',
        'var_UGRD': 'on',  # U component of wind
        'var_VGRD': 'on',  # V component of wind
        'leftlon': 0,
        'rightlon': 360,
        'toplat': 90,
        'bottomlat': -90,
        'dir': f'/gfs.{forecast_date}/{forecast_hour}/atmos'
    }
    
    # 创建临时目录
    temp_dir = 'gfs_temp'
    os.makedirs(temp_dir, exist_ok=True)
    
    print(f"📁 临时目录: {temp_dir}")
    print("")
    
    # 下载每个时次的数据
    downloaded_files = []
    
    for i, fhour in enumerate(forecast_hours):
        print(f"⏳ 下载预报时次 {fhour:03d}h ({i+1}/{total_frames})...", end=' ')
        
        # 构建URL
        file_param = f'gfs.t{forecast_hour}z.pgrb2.0p25.f{fhour:03d}'
        url = f"{base_url}?file={file_param}&lev_10_m_above_ground=on&var_UGRD=on&var_VGRD=on&leftlon=0&rightlon=360&toplat=90&bottomlat=-90&dir=%2Fgfs.{forecast_date}%2F{forecast_hour}%2Fatmos"
        
        output_file = os.path.join(temp_dir, f'gfs_f{fhour:03d}.grb2')
        
        try:
            response = requests.get(url, timeout=60)
            response.raise_for_status()
            
            with open(output_file, 'wb') as f:
                f.write(response.content)
            
            downloaded_files.append(output_file)
            print("✅")
            
        except Exception as e:
            print(f"❌ 失败: {e}")
            continue
    
    print("")
    print(f"✅ 成功下载 {len(downloaded_files)}/{total_frames} 个文件")
    print("")
    
    if len(downloaded_files) == 0:
        print("❌ 没有成功下载任何文件")
        return False
    
    # 合并 GRIB2 文件为 NetCDF
    print("🔄 转换 GRIB2 为 NetCDF...")
    
    # 使用 wgrib2 转换
    output_nc = 'wind_data_gfs.nc'
    
    # 合并所有文件
    print("   合并所有时次...")
    
    # 先转换第一个文件
    cmd = ['wgrib2', downloaded_files[0], '-netcdf', output_nc]
    subprocess.run(cmd, check=True, capture_output=True)
    
    # 追加其他文件
    for grib_file in downloaded_files[1:]:
        cmd = ['wgrib2', grib_file, '-append', '-netcdf', output_nc]
        subprocess.run(cmd, check=True, capture_output=True)
    
    print(f"✅ NetCDF 文件已创建: {output_nc}")
    
    # 清理临时文件
    print("")
    print("🗑️  清理临时文件...")
    for f in downloaded_files:
        os.remove(f)
    os.rmdir(temp_dir)
    
    print("")
    print("=" * 70)
    print("🎉 GFS 风场数据下载完成！")
    print("")
    print(f"📁 输出文件: {output_nc}")
    print(f"📊 数据帧数: {len(downloaded_files)}")
    print("")
    print("下一步:")
    print("  python3 convert_gfs_wind_to_binary.py")
    print("=" * 70)
    
    return True

if __name__ == '__main__':
    success = download_gfs_wind()
    sys.exit(0 if success else 1)
