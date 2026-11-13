#!/usr/bin/env python3
"""
从 Copernicus CDS 下载风场数据
匹配海浪数据的时间范围：2025-12-26 00:00 开始，65帧，每3小时一帧
"""

import cdsapi
import json
from datetime import datetime, timedelta
import os

def download_wind_data():
    """
    下载风场数据，匹配海浪数据的时间范围
    """
    print("🌍 开始下载 Copernicus CDS 风场数据...")
    print("=" * 70)
    
    # 读取海浪数据的元数据
    meta_path = "../../export_out/meta.json"
    if os.path.exists(meta_path):
        with open(meta_path, 'r') as f:
            wave_meta = json.load(f)
        
        # 解析时间字符串，处理纳秒部分
        time_str = wave_meta['start_time'].replace('Z', '').split('.')[0]  # 移除时区和纳秒
        start_time = datetime.fromisoformat(time_str)
        frames = wave_meta['frames']
        time_step_hours = wave_meta['time_step_hours']
        
        print(f"📊 匹配海浪数据时间范围:")
        print(f"   起始时间: {start_time}")
        print(f"   帧数: {frames}")
        print(f"   时间步长: {time_step_hours} 小时")
        print(f"   结束时间: {start_time + timedelta(hours=(frames-1)*time_step_hours)}")
    else:
        # 默认值：与海浪数据一致
        start_time = datetime(2025, 12, 26, 0, 0, 0)
        frames = 65
        time_step_hours = 3
        print(f"⚠️  未找到海浪元数据，使用默认值")
        print(f"   起始时间: {start_time}")
        print(f"   帧数: {frames}")
        print(f"   时间步长: {time_step_hours} 小时")
    
    print("")
    print("=" * 70)
    
    # 计算需要下载的日期范围
    end_time = start_time + timedelta(hours=(frames-1)*time_step_hours)
    
    # 生成日期列表
    current_date = start_time.date()
    end_date = end_time.date()
    dates = []
    while current_date <= end_date:
        dates.append(current_date.strftime('%Y-%m-%d'))
        current_date += timedelta(days=1)
    
    # 生成时间列表（每3小时）
    times = [f"{h:02d}:00" for h in range(0, 24, time_step_hours)]
    
    print(f"📅 下载日期: {dates[0]} 到 {dates[-1]} ({len(dates)} 天)")
    print(f"⏰ 时间点: {', '.join(times)}")
    print(f"🌐 区域: 全球 (-180° 到 180°, -80° 到 90°)")
    print(f"📊 变量: 10m u/v wind components")
    print(f"📦 格式: NetCDF")
    print("")
    
    # 初始化 CDS API
    try:
        c = cdsapi.Client()
        print("✅ CDS API 客户端初始化成功")
    except Exception as e:
        print(f"❌ CDS API 初始化失败: {e}")
        return False
    
    print("")
    print("⏳ 开始下载（这可能需要10-30分钟，取决于数据量和网络速度）...")
    print("   请耐心等待，不要中断...")
    print("")
    
    try:
        # 下载风场数据
        c.retrieve(
            'reanalysis-era5-single-levels',
            {
                'product_type': 'reanalysis',
                'variable': [
                    '10m_u_component_of_wind',
                    '10m_v_component_of_wind',
                ],
                'year': list(set([d.split('-')[0] for d in dates])),
                'month': list(set([d.split('-')[1] for d in dates])),
                'day': list(set([d.split('-')[2] for d in dates])),
                'time': times,
                'area': [90, -180, -80, 180],  # [North, West, South, East]
                'format': 'netcdf',
            },
            'wind_data.nc'
        )
        
        print("")
        print("✅ 风场数据下载成功!")
        print(f"📁 文件: wind_data.nc")
        
        # 检查文件大小
        file_size = os.path.getsize('wind_data.nc')
        print(f"📦 文件大小: {file_size / 1024 / 1024:.2f} MB")
        
        print("")
        print("=" * 70)
        print("🎉 下载完成！")
        print("")
        print("下一步:")
        print("  python3 convert_wind_to_binary.py")
        print("=" * 70)
        
        return True
        
    except Exception as e:
        print(f"")
        print(f"❌ 下载失败: {e}")
        print("")
        
        # 检查是否是许可协议问题
        error_str = str(e).lower()
        if 'licence' in error_str or 'forbidden' in error_str or '403' in error_str:
            print("=" * 70)
            print("⚠️  这是许可协议问题！")
            print("=" * 70)
            print("")
            print("请运行以下命令查看详细说明：")
            print("")
            print("  bash accept_cds_license.sh")
            print("")
            print("或直接访问：")
            print("  https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=download")
            print("")
            print("接受许可协议后，重新运行：")
            print("  bash setup_wind_data.sh")
            print("")
        else:
            print("可能的原因:")
            print("1. 网络连接问题")
            print("2. CDS服务器繁忙（请稍后重试）")
            print("3. 请求的数据量过大")
            print("")
            print("建议:")
            print("- 检查网络连接")
            print("- 访问 https://cds.climate.copernicus.eu/live/queue 查看队列状态")
            print("- 稍后重试")
        return False

if __name__ == '__main__':
    download_wind_data()
