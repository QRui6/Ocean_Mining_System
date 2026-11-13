#!/usr/bin/env python3
"""
将 NetCDF 格式的风场数据转换为二进制格式
与海浪和洋流数据格式保持一致
"""

import netCDF4 as nc
import numpy as np
import json
import os
from datetime import datetime, timedelta

def convert_wind_to_binary():
    """
    转换风场数据为二进制格式
    """
    print("🔄 开始转换风场数据...")
    print("=" * 70)
    
    # 读取 NetCDF 文件
    input_file = "wind_data.nc"
    if not os.path.exists(input_file):
        print(f"❌ 未找到输入文件: {input_file}")
        return False
    
    print(f"📂 读取文件: {input_file}")
    ds = nc.Dataset(input_file, 'r')
    
    # 打印数据集信息
    print(f"\n📊 数据集信息:")
    print(f"   维度: {list(ds.dimensions.keys())}")
    print(f"   变量: {list(ds.variables.keys())}")
    
    # 获取维度 - 支持多种时间维度名称
    if 'valid_time' in ds.dimensions:
        time_dim = len(ds.dimensions['valid_time'])
    elif 'time' in ds.dimensions:
        time_dim = len(ds.dimensions['time'])
    else:
        # 如果没有时间维度，从数据形状推断
        time_dim = 1
    
    if 'latitude' in ds.dimensions:
        lat_dim = len(ds.dimensions['latitude'])
        lon_dim = len(ds.dimensions['longitude'])
        lat_var = ds.variables['latitude'][:]
        lon_var = ds.variables['longitude'][:]
    elif 'lat' in ds.dimensions:
        lat_dim = len(ds.dimensions['lat'])
        lon_dim = len(ds.dimensions['lon'])
        lat_var = ds.variables['lat'][:]
        lon_var = ds.variables['lon'][:]
    else:
        print("❌ 未找到经纬度维度")
        return False
    
    print(f"\n📐 数据维度:")
    print(f"   时间: {time_dim} 帧")
    print(f"   纬度: {lat_dim} 点")
    print(f"   经度: {lon_dim} 点")
    print(f"   纬度范围: {lat_var.min():.2f}° 到 {lat_var.max():.2f}°")
    print(f"   经度范围: {lon_var.min():.2f}° 到 {lon_var.max():.2f}°")
    
    # 获取风场变量
    if 'u10' in ds.variables:
        u_var = ds.variables['u10']
        v_var = ds.variables['v10']
    elif '10m_u_component_of_wind' in ds.variables:
        u_var = ds.variables['10m_u_component_of_wind']
        v_var = ds.variables['10m_v_component_of_wind']
    else:
        print("❌ 未找到风场变量")
        print(f"   可用变量: {list(ds.variables.keys())}")
        return False
    
    print(f"\n🌬️  风场变量:")
    print(f"   U分量: {u_var.name}")
    print(f"   V分量: {v_var.name}")
    print(f"   形状: {u_var.shape}")
    
    # 创建输出目录
    output_dir = "../../public/wind_data"
    os.makedirs(output_dir, exist_ok=True)
    print(f"\n📁 输出目录: {output_dir}")
    
    # 转换每个时间帧
    print(f"\n🔄 转换 {time_dim} 个时间帧...")
    
    for t in range(time_dim):
        # 读取数据
        if len(u_var.shape) == 3:  # (time, lat, lon)
            u_data = u_var[t, :, :]
            v_data = v_var[t, :, :]
        elif len(u_var.shape) == 2:  # (lat, lon)
            u_data = u_var[:, :]
            v_data = v_var[:, :]
        else:
            print(f"❌ 不支持的数据形状: {u_var.shape}")
            return False
        
        # 转换为 float32
        u_data = np.array(u_data, dtype=np.float32)
        v_data = np.array(v_data, dtype=np.float32)
        
        # 处理缺测值
        u_data = np.nan_to_num(u_data, nan=0.0)
        v_data = np.nan_to_num(v_data, nan=0.0)
        
        # 保存为二进制文件
        u_file = os.path.join(output_dir, f"u_t{t:02d}.bin")
        v_file = os.path.join(output_dir, f"v_t{t:02d}.bin")
        
        u_data.tofile(u_file)
        v_data.tofile(v_file)
        
        if (t + 1) % 10 == 0 or t == time_dim - 1:
            print(f"   进度: {t+1}/{time_dim} 帧")
    
    print(f"✅ 所有时间帧转换完成")
    
    # 获取时间信息 - 支持多种时间变量名称
    start_time_str = "2025-12-26T00:00:00"  # 默认值
    
    if 'valid_time' in ds.variables:
        time_var = ds.variables['valid_time']
    elif 'time' in ds.variables:
        time_var = ds.variables['time']
    else:
        time_var = None
    
    if time_var is not None:
        try:
            time_units = time_var.units
            time_values = time_var[:]
            start_time = nc.num2date(time_values[0], time_units)
            if hasattr(start_time, 'strftime'):
                start_time_str = start_time.strftime('%Y-%m-%dT%H:%M:%S')
            else:
                start_time_str = str(start_time)
        except Exception as e:
            print(f"⚠️  时间解析失败: {e}，使用默认时间")
            pass
    
    # 生成元数据
    meta = {
        "grid": {
            "lat_size": int(lat_dim),
            "lon_size": int(lon_dim),
            "lat_min": float(lat_var.min()),
            "lat_max": float(lat_var.max()),
            "lon_min": float(lon_var.min()),
            "lon_max": float(lon_var.max()),
            "lat_step": float((lat_var.max() - lat_var.min()) / (lat_dim - 1)),
            "lon_step": float((lon_var.max() - lon_var.min()) / (lon_dim - 1))
        },
        "frames": int(time_dim),
        "time_step_hours": 3,
        "start_time": start_time_str,
        "data_source": "Copernicus CDS ERA5",
        "variables": {
            "u10": "10m u-component of wind (m/s)",
            "v10": "10m v-component of wind (m/s)"
        }
    }
    
    meta_file = os.path.join(output_dir, "meta.json")
    with open(meta_file, 'w') as f:
        json.dump(meta, f, indent=2)
    
    print(f"\n📄 元数据已保存: {meta_file}")
    
    # 关闭数据集
    ds.close()
    
    print("")
    print("=" * 70)
    print("✅ 转换完成！")
    print("")
    print(f"📊 输出统计:")
    print(f"   时间帧: {time_dim}")
    print(f"   网格大小: {lon_dim} × {lat_dim}")
    print(f"   文件数量: {time_dim * 2} 个 (U和V分量)")
    
    # 计算总大小
    total_size = 0
    for f in os.listdir(output_dir):
        if f.endswith('.bin'):
            total_size += os.path.getsize(os.path.join(output_dir, f))
    
    print(f"   总大小: {total_size / 1024 / 1024:.2f} MB")
    print("")
    
    return True

if __name__ == '__main__':
    success = convert_wind_to_binary()
    exit(0 if success else 1)
