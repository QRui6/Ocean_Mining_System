#!/usr/bin/env python3
"""
GRIB2 到 JSON 转换脚本
使用 pygrib 库读取 GRIB2 文件并转换为 JSON 格式

安装依赖：
pip install pygrib numpy

使用方法：
python grib2json.py input.grib2 output.json
"""

import sys
import json
import numpy as np

try:
    import pygrib
except ImportError:
    print("❌ pygrib 未安装")
    print("请运行: pip install pygrib")
    sys.exit(1)


def grib2_to_json(grib_file, output_file):
    """
    将 GRIB2 文件转换为 JSON 格式
    """
    print(f"📖 读取 GRIB2 文件: {grib_file}")
    
    try:
        grbs = pygrib.open(grib_file)
    except Exception as e:
        print(f"❌ 无法打开文件: {e}")
        sys.exit(1)
    
    result = []
    
    for grb in grbs:
        print(f"   处理: {grb.name} - {grb.typeOfLevel}")
        
        # 获取数据
        data = grb.values
        lats, lons = grb.latlons()
        
        # 获取网格信息
        ny, nx = data.shape
        
        # 构建 header
        header = {
            "discipline": grb.discipline,
            "parameterCategory": grb.parameterCategory,
            "parameterNumber": grb.parameterNumber,
            "parameterNumberName": grb.name,
            "parameterUnit": grb.units,
            "refTime": grb.analDate.isoformat() if hasattr(grb, 'analDate') else None,
            "forecastTime": grb.forecastTime if hasattr(grb, 'forecastTime') else 0,
            "nx": nx,
            "ny": ny,
            "lo1": float(lons[0, 0]),
            "la1": float(lats[0, 0]),
            "lo2": float(lons[-1, -1]),
            "la2": float(lats[-1, -1]),
            "dx": float(lons[0, 1] - lons[0, 0]) if nx > 1 else 0,
            "dy": float(lats[1, 0] - lats[0, 0]) if ny > 1 else 0,
        }
        
        # 将数据展平并转换为列表（处理 NaN 值）
        data_flat = data.flatten()
        data_list = [float(v) if not np.isnan(v) else None for v in data_flat]
        
        result.append({
            "header": header,
            "data": data_list
        })
    
    grbs.close()
    
    # 写入 JSON 文件
    print(f"💾 写入 JSON 文件: {output_file}")
    with open(output_file, 'w') as f:
        json.dump(result, f, separators=(',', ':'))
    
    print(f"✅ 转换完成！")
    print(f"   数据记录数: {len(result)}")
    print(f"   总数据点: {sum(len(r['data']) for r in result)}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("使用方法: python grib2json.py <input.grib2> <output.json>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    grib2_to_json(input_file, output_file)
