#!/usr/bin/env python3
"""
内波数据导入脚本
从二进制文件导入内波数据到PostgreSQL数据库
"""

import os
import sys
import json
import struct
import psycopg2
from datetime import datetime, timedelta
import numpy as np

# 数据库连接配置
DB_CONFIG = {
    'dbname': 'mining_weather',
    'user': 'postgres',
    'password': 'postgres',
    'host': 'localhost',
    'port': 5432
}

# 数据文件路径
DATA_DIR = '../demo/public/hret14/hret14_out_uv_20200101'
META_FILE = os.path.join(DATA_DIR, 'meta.json')

def load_binary_file(filepath):
    """加载二进制文件为Float32数组"""
    print(f"📂 加载文件: {filepath}")
    with open(filepath, 'rb') as f:
        data = f.read()
    
    # 转换为float32数组
    float_count = len(data) // 4
    values = struct.unpack(f'{float_count}f', data)
    
    print(f"   ✅ 加载了 {len(values):,} 个数据点")
    return values

def calculate_stats(values):
    """计算数据统计信息"""
    arr = np.array(values, dtype=np.float32)
    
    # 过滤无效值
    valid_mask = np.isfinite(arr)
    valid_data = arr[valid_mask]
    
    if len(valid_data) == 0:
        return 0.0, 0.0
    
    return float(np.min(valid_data)), float(np.max(valid_data))

def import_metadata(conn, meta):
    """导入元数据"""
    print("\n📋 导入元数据...")
    
    cursor = conn.cursor()
    
    # 检查是否已存在
    cursor.execute("SELECT id FROM internal_wave_metadata WHERE type = 'internal_wave' LIMIT 1")
    existing = cursor.fetchone()
    
    if existing:
        metadata_id = existing[0]
        print(f"   ℹ️  元数据已存在 (ID: {metadata_id})")
    else:
        # 插入元数据
        cursor.execute("""
            INSERT INTO internal_wave_metadata (
                type, grid_lon_size, grid_lat_size,
                grid_lon_min, grid_lat_min, grid_lon_max, grid_lat_max,
                grid_lon_step, grid_lat_step,
                start_time, time_step_hours, frames,
                data_source, note
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) RETURNING id
        """, (
            'internal_wave',
            meta['grid']['lon_size'],
            meta['grid']['lat_size'],
            meta['grid']['lon_min'],
            meta['grid']['lat_min'],
            meta['grid']['lon_max'],
            meta['grid']['lat_max'],
            meta['grid']['lon_step'],
            meta['grid']['lat_step'],
            meta['times'][0],
            3,  # 3小时间隔
            len(meta['times']),
            meta['source'],
            meta.get('note', '')
        ))
        
        metadata_id = cursor.fetchone()[0]
        conn.commit()
        print(f"   ✅ 元数据导入成功 (ID: {metadata_id})")
    
    cursor.close()
    return metadata_id

def import_frame_data(conn, metadata_id, time_index, meta):
    """导入单个时间帧的数据"""
    print(f"\n⏰ 导入时间帧 {time_index}...")
    
    # 加载U和V分量数据
    u_file = os.path.join(DATA_DIR, f'u_{time_index:03d}.bin')
    v_file = os.path.join(DATA_DIR, f'v_{time_index:03d}.bin')
    
    if not os.path.exists(u_file) or not os.path.exists(v_file):
        print(f"   ⚠️  文件不存在，跳过")
        return False
    
    u_values = load_binary_file(u_file)
    v_values = load_binary_file(v_file)
    
    # 计算统计信息
    print("   📊 计算统计信息...")
    u_min, u_max = calculate_stats(u_values)
    v_min, v_max = calculate_stats(v_values)
    
    print(f"   📈 U范围: {u_min:.6f} ~ {u_max:.6f} m/s")
    print(f"   📈 V范围: {v_min:.6f} ~ {v_max:.6f} m/s")
    
    # 转换为二进制格式（保持Float32）
    u_binary = struct.pack(f'{len(u_values)}f', *u_values)
    v_binary = struct.pack(f'{len(v_values)}f', *v_values)
    
    # 插入数据库
    cursor = conn.cursor()
    
    # 检查是否已存在
    cursor.execute("""
        SELECT id FROM internal_wave_data 
        WHERE metadata_id = %s AND time_index = %s
    """, (metadata_id, time_index))
    
    existing = cursor.fetchone()
    
    if existing:
        print(f"   ℹ️  数据已存在，更新...")
        cursor.execute("""
            UPDATE internal_wave_data SET
                u_component = %s,
                v_component = %s,
                u_min = %s,
                u_max = %s,
                v_min = %s,
                v_max = %s,
                width = %s,
                height = %s,
                time_value = %s
            WHERE id = %s
        """, (
            psycopg2.Binary(u_binary),
            psycopg2.Binary(v_binary),
            u_min, u_max, v_min, v_max,
            meta['grid']['lon_size'],
            meta['grid']['lat_size'],
            meta['times'][time_index],
            existing[0]
        ))
    else:
        print(f"   💾 插入新数据...")
        cursor.execute("""
            INSERT INTO internal_wave_data (
                metadata_id, time_index, time_value,
                u_component, v_component,
                u_min, u_max, v_min, v_max,
                width, height
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            metadata_id,
            time_index,
            meta['times'][time_index],
            psycopg2.Binary(u_binary),
            psycopg2.Binary(v_binary),
            u_min, u_max, v_min, v_max,
            meta['grid']['lon_size'],
            meta['grid']['lat_size']
        ))
    
    conn.commit()
    cursor.close()
    
    print(f"   ✅ 时间帧 {time_index} 导入成功")
    return True

def main():
    """主函数"""
    print("=" * 60)
    print("🌊 内波数据导入工具")
    print("=" * 60)
    
    # 检查数据文件
    if not os.path.exists(META_FILE):
        print(f"❌ 元数据文件不存在: {META_FILE}")
        sys.exit(1)
    
    # 加载元数据
    print(f"\n📖 读取元数据: {META_FILE}")
    with open(META_FILE, 'r') as f:
        meta = json.load(f)
    
    print(f"   ✅ 元数据加载成功")
    print(f"   📊 网格尺寸: {meta['grid']['lon_size']} x {meta['grid']['lat_size']}")
    print(f"   ⏰ 时间帧数: {len(meta['times'])}")
    
    # 连接数据库
    print(f"\n🔌 连接数据库...")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print(f"   ✅ 数据库连接成功")
    except Exception as e:
        print(f"   ❌ 数据库连接失败: {e}")
        sys.exit(1)
    
    try:
        # 导入元数据
        metadata_id = import_metadata(conn, meta)
        
        # 导入每个时间帧的数据
        success_count = 0
        for time_index in range(len(meta['times'])):
            if import_frame_data(conn, metadata_id, time_index, meta):
                success_count += 1
        
        print("\n" + "=" * 60)
        print(f"✅ 导入完成！")
        print(f"   成功导入: {success_count}/{len(meta['times'])} 个时间帧")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ 导入失败: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    main()
