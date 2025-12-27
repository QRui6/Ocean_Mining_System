#!/usr/bin/env python3
"""
转换 Copernicus Marine 数据为前端可用格式
"""
import xarray as xr
import numpy as np
import json
import os
import sys

def convert_wave_data(nc_file):
    print(f"📖 读取海浪数据: {nc_file}")
    ds = xr.open_dataset(nc_file)
    
    # 创建输出目录
    output_dir = os.path.join(os.path.dirname(__file__), '../../export_out')
    os.makedirs(output_dir, exist_ok=True)
    
    # 获取维度
    times = ds.time.values
    lats = ds.latitude.values
    lons = ds.longitude.values
    
    print(f"   时间步数: {len(times)}")
    print(f"   网格大小: {len(lats)} × {len(lons)}")
    
    # 提取变量
    hs = ds['VHM0'].values  # 波高
    u = ds['VSDX'].values   # U分量
    v = ds['VSDY'].values   # V分量
    
    # 保存每个时间步
    for t in range(len(times)):
        hs_t = np.nan_to_num(hs[t], nan=-9999.0)
        u_t = np.nan_to_num(u[t], nan=-9999.0)
        v_t = np.nan_to_num(v[t], nan=-9999.0)
        
        hs_t.astype('float32').tofile(os.path.join(output_dir, f'hs_t{t:02d}.bin'))
        u_t.astype('float32').tofile(os.path.join(output_dir, f'stokes_u_t{t:02d}.bin'))
        v_t.astype('float32').tofile(os.path.join(output_dir, f'stokes_v_t{t:02d}.bin'))
        
        print(f"   ✅ 第 {t} 帧已保存")
    
    # 生成 meta.json
    meta = {
        "grid": {
            "lat_size": len(lats),
            "lon_size": len(lons),
            "lat_min": float(lats.min()),
            "lat_max": float(lats.max()),
            "lon_min": float(lons.min()),
            "lon_max": float(lons.max()),
            "lat_step": float(lats[1] - lats[0]) if len(lats) > 1 else 0.2,
            "lon_step": float(lons[1] - lons[0]) if len(lons) > 1 else 0.2
        },
        "frames": len(times),
        "time_step_hours": 3,
        "start_time": str(times[0])
    }
    
    with open(os.path.join(output_dir, 'meta.json'), 'w') as f:
        json.dump(meta, f, indent=2)
    
    print("✅ 海浪数据转换完成！")
    ds.close()

def convert_current_data(nc_file):
    print(f"📖 读取洋流数据: {nc_file}")
    ds = xr.open_dataset(nc_file)
    
    # 创建输出目录
    output_dir = os.path.join(os.path.dirname(__file__), '../../export_currents_out')
    os.makedirs(output_dir, exist_ok=True)
    
    # 获取维度
    times = ds.time.values
    lats = ds.latitude.values
    lons = ds.longitude.values
    
    print(f"   时间步数: {len(times)}")
    print(f"   网格大小: {len(lats)} × {len(lons)}")
    
    # 提取变量
    u = ds['uo'].values
    v = ds['vo'].values
    
    # 保存每个时间步
    for t in range(len(times)):
        u_t = np.nan_to_num(u[t], nan=-9999.0)
        v_t = np.nan_to_num(v[t], nan=-9999.0)
        
        u_t.astype('float32').tofile(os.path.join(output_dir, f'u_t{t:02d}.bin'))
        v_t.astype('float32').tofile(os.path.join(output_dir, f'v_t{t:02d}.bin'))
        
        print(f"   ✅ 第 {t} 帧已保存")
    
    # 生成 meta.json
    meta = {
        "grid": {
            "lat_size": len(lats),
            "lon_size": len(lons),
            "lat_min": float(lats.min()),
            "lat_max": float(lats.max()),
            "lon_min": float(lons.min()),
            "lon_max": float(lons.max()),
            "lat_step": float(lats[1] - lats[0]) if len(lats) > 1 else 0.083,
            "lon_step": float(lons[1] - lons[0]) if len(lons) > 1 else 0.083
        },
        "frames": len(times),
        "time_step_hours": 24,
        "start_time": str(times[0])
    }
    
    with open(os.path.join(output_dir, 'meta.json'), 'w') as f:
        json.dump(meta, f, indent=2)
    
    print("✅ 洋流数据转换完成！")
    ds.close()

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("用法: python convert_copernicus_data.py wave_data.nc current_data.nc")
        sys.exit(1)
    
    for nc_file in sys.argv[1:]:
        if not os.path.exists(nc_file):
            print(f"❌ 文件不存在: {nc_file}")
            continue
        
        if 'wave' in nc_file.lower():
            convert_wave_data(nc_file)
        elif 'current' in nc_file.lower():
            convert_current_data(nc_file)
        else:
            print(f"⚠️  无法识别文件类型: {nc_file}")
