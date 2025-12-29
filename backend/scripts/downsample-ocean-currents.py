#!/usr/bin/env python3
"""
洋流数据降采样脚本
将高分辨率的洋流数据降采样到适合浏览器加载的大小
"""

import numpy as np
import json
import os
from pathlib import Path

# 配置
INPUT_DIR = Path('export_currents_out')
OUTPUT_DIR = Path('public/ocean_currents')
TARGET_WIDTH = 360  # 目标宽度（1度分辨率）
TARGET_HEIGHT = 180  # 目标高度（1度分辨率）

def load_meta():
    """加载元数据"""
    meta_path = INPUT_DIR / 'meta.json'
    with open(meta_path, 'r') as f:
        return json.load(f)

def downsample_component(data, original_width, original_height, target_width, target_height):
    """
    降采样单个分量数据
    使用区域平均法（优化版本）
    """
    print(f"  降采样: {original_width}x{original_height} -> {target_width}x{target_height}")
    
    expected_size = original_width * original_height
    actual_size = len(data)
    
    # 如果大小不匹配，截取数据
    if actual_size != expected_size:
        if actual_size > expected_size:
            data = data[:expected_size]
        else:
            print(f"  ❌ 数据不足，无法处理")
            return np.zeros(target_width * target_height, dtype=np.float32)
    
    # 重塑为2D数组
    data_2d = data.reshape(original_height, original_width)
    
    # 使用 scipy 的 zoom 函数进行快速降采样
    from scipy.ndimage import zoom
    
    zoom_factor = (target_height / original_height, target_width / original_width)
    
    # 先过滤缺测值
    data_2d[data_2d == -9999.0] = 0
    data_2d[np.abs(data_2d) > 10.0] = 0
    
    # 快速降采样
    output = zoom(data_2d, zoom_factor, order=1)  # order=1 使用双线性插值
    
    return output.flatten().astype(np.float32)

def process_time_step(time_index, meta):
    """处理单个时间步"""
    print(f"\n处理时间步 {time_index}...")
    
    grid = meta['grid']
    original_width = grid['lon_size']
    original_height = grid['lat_size']
    
    time_str = str(time_index).zfill(2)
    
    # 加载 U 和 V 分量
    print(f"  加载 U 分量...")
    u_path = INPUT_DIR / f'u_t{time_str}.bin'
    u_data = np.fromfile(u_path, dtype=np.float32)
    
    print(f"  加载 V 分量...")
    v_path = INPUT_DIR / f'v_t{time_str}.bin'
    v_data = np.fromfile(v_path, dtype=np.float32)
    
    print(f"  原始数据大小: {len(u_data)} 点 ({len(u_data) * 4 / 1024 / 1024:.1f} MB)")
    
    # 降采样
    print(f"  降采样 U 分量...")
    u_downsampled = downsample_component(u_data, original_width, original_height, 
                                         TARGET_WIDTH, TARGET_HEIGHT)
    
    print(f"  降采样 V 分量...")
    v_downsampled = downsample_component(v_data, original_width, original_height, 
                                         TARGET_WIDTH, TARGET_HEIGHT)
    
    # 计算统计信息
    u_valid = u_downsampled[np.abs(u_downsampled) > 0.01]
    v_valid = v_downsampled[np.abs(v_downsampled) > 0.01]
    
    if len(u_valid) > 0 and len(v_valid) > 0:
        print(f"  统计信息:")
        print(f"    U 范围: {u_valid.min():.4f} ~ {u_valid.max():.4f} m/s")
        print(f"    V 范围: {v_valid.min():.4f} ~ {v_valid.max():.4f} m/s")
        print(f"    有效点: {len(u_valid)} / {len(u_downsampled)} ({len(u_valid)/len(u_downsampled)*100:.1f}%)")
    
    # 保存降采样后的数据
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    u_output_path = OUTPUT_DIR / f'u_t{time_str}.bin'
    v_output_path = OUTPUT_DIR / f'v_t{time_str}.bin'
    
    u_downsampled.tofile(u_output_path)
    v_downsampled.tofile(v_output_path)
    
    output_size = len(u_downsampled) * 4 / 1024
    print(f"  ✅ 保存完成: {output_size:.1f} KB (压缩比: {len(u_data) * 4 / (len(u_downsampled) * 4):.1f}x)")

def create_downsampled_meta(original_meta):
    """创建降采样后的元数据"""
    new_meta = original_meta.copy()
    new_meta['grid']['lon_size'] = TARGET_WIDTH
    new_meta['grid']['lat_size'] = TARGET_HEIGHT
    new_meta['grid']['resolution'] = 1.0  # 1度分辨率
    new_meta['downsampled'] = True
    new_meta['original_resolution'] = original_meta['grid'].get('resolution', 0.083)
    
    return new_meta

def main():
    print("=" * 60)
    print("洋流数据降采样工具")
    print("=" * 60)
    
    # 检查输入目录
    if not INPUT_DIR.exists():
        print(f"❌ 错误: 输入目录不存在: {INPUT_DIR}")
        return
    
    # 加载元数据
    print("\n加载元数据...")
    meta = load_meta()
    
    print(f"原始网格: {meta['grid']['lon_size']} x {meta['grid']['lat_size']}")
    print(f"目标网格: {TARGET_WIDTH} x {TARGET_HEIGHT}")
    print(f"时间步数: {meta['frames']}")
    
    # 处理每个时间步
    for t in range(meta['frames']):
        try:
            process_time_step(t, meta)
        except Exception as e:
            print(f"❌ 处理时间步 {t} 失败: {e}")
            continue
    
    # 保存新的元数据
    print("\n保存元数据...")
    new_meta = create_downsampled_meta(meta)
    meta_output_path = OUTPUT_DIR / 'meta.json'
    with open(meta_output_path, 'w') as f:
        json.dump(new_meta, f, indent=2)
    
    print("\n" + "=" * 60)
    print("✅ 降采样完成！")
    print(f"输出目录: {OUTPUT_DIR}")
    print("=" * 60)

if __name__ == '__main__':
    main()
