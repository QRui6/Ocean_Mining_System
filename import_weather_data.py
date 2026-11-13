#!/usr/bin/env python3
"""
气象数据导入脚本
将风场、洋流、波浪数据从前端public目录导入到PostgreSQL数据库
"""

import psycopg2
import json
import os
import struct
from pathlib import Path
from datetime import datetime

# 数据库连接配置
DB_CONFIG = {
    'host': '121.194.93.61',
    'port': 5432,
    'database': 'ship_monitoring',
    'user': 'postgres',
    'password': 'jcf0326_103'
}

# 数据目录配置（相对于backend目录）
DATA_BASE_DIR = Path(__file__).parent.parent / 'demo' / 'public'

def get_db_connection():
    """获取数据库连接"""
    return psycopg2.connect(**DB_CONFIG)

def get_data_type_id(cur, type_code):
    """获取数据类型ID"""
    cur.execute("SELECT id FROM weather_data_types WHERE type_code = %s", (type_code,))
    result = cur.fetchone()
    return result[0] if result else None

def read_binary_file(file_path):
    """读取二进制文件"""
    with open(file_path, 'rb') as f:
        return f.read()

def calculate_min_max(binary_data):
    """计算二进制数据的最小值和最大值（假设是Float32）"""
    float_count = len(binary_data) // 4
    values = struct.unpack(f'{float_count}f', binary_data)
    return min(values), max(values)

def import_wind_data(conn):
    """导入风场数据"""
    print("\n🌬️  开始导入风场数据...")
    cur = conn.cursor()
    
    # 读取元数据
    meta_path = DATA_BASE_DIR / 'wind_data' / 'meta.json'
    with open(meta_path, 'r') as f:
        meta = json.load(f)
    
    # 获取数据类型ID
    type_id = get_data_type_id(cur, 'wind')
    if not type_id:
        print("❌ 错误：找不到wind数据类型")
        return
    
    # 插入元数据
    cur.execute("""
        INSERT INTO weather_metadata 
        (data_type_id, grid_lon_size, grid_lat_size, grid_lon_min, grid_lat_min,
         grid_lon_max, grid_lat_max, grid_lon_step, grid_lat_step, start_time,
         time_step_hours, total_frames, data_source)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
    """, (
        type_id,
        meta['grid']['lon_size'],
        meta['grid']['lat_size'],
        meta['grid']['lon_min'],
        meta['grid']['lat_min'],
        meta['grid']['lon_max'],
        meta['grid']['lat_max'],
        meta['grid']['lon_step'],
        meta['grid']['lat_step'],
        meta['start_time'],
        meta['time_step_hours'],
        meta['frames'],
        meta.get('data_source', 'Unknown')
    ))
    
    metadata_id = cur.fetchone()[0]
    print(f"✅ 风场元数据已插入，ID: {metadata_id}")
    
    # 导入每个时间帧的数据
    data_dir = DATA_BASE_DIR / 'wind_data'
    data_size = meta['grid']['lon_size'] * meta['grid']['lat_size']
    
    for i in range(meta['frames']):
        u_file = data_dir / f'u_t{i:02d}.bin'
        v_file = data_dir / f'v_t{i:02d}.bin'
        
        if not u_file.exists() or not v_file.exists():
            print(f"⚠️  警告：时间帧 {i} 的文件不存在，跳过")
            continue
        
        # 读取二进制数据
        u_data = read_binary_file(u_file)
        v_data = read_binary_file(v_file)
        
        # 计算最小最大值
        u_min, u_max = calculate_min_max(u_data)
        v_min, v_max = calculate_min_max(v_data)
        
        # 插入数据
        cur.execute("""
            INSERT INTO wind_data 
            (metadata_id, time_index, u_component, v_component, u_min, u_max, v_min, v_max, data_size)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            metadata_id, i, 
            psycopg2.Binary(u_data), psycopg2.Binary(v_data),
            u_min, u_max, v_min, v_max, data_size
        ))
        
        print(f"  ✓ 时间帧 {i}/{meta['frames']-1} 已导入")
    
    conn.commit()
    print(f"✅ 风场数据导入完成！共 {meta['frames']} 个时间帧")

def import_ocean_current_data(conn):
    """导入洋流数据"""
    print("\n🌊 开始导入洋流数据...")
    cur = conn.cursor()
    
    # 读取元数据
    meta_path = DATA_BASE_DIR / 'ocean_currents' / 'meta.json'
    with open(meta_path, 'r') as f:
        meta = json.load(f)
    
    # 获取数据类型ID
    type_id = get_data_type_id(cur, 'ocean_current')
    if not type_id:
        print("❌ 错误：找不到ocean_current数据类型")
        return
    
    # 插入元数据
    cur.execute("""
        INSERT INTO weather_metadata 
        (data_type_id, grid_lon_size, grid_lat_size, grid_lon_min, grid_lat_min,
         grid_lon_max, grid_lat_max, grid_lon_step, grid_lat_step, start_time,
         time_step_hours, total_frames, data_source)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
    """, (
        type_id,
        meta['grid']['lon_size'],
        meta['grid']['lat_size'],
        meta['grid']['lon_min'],
        meta['grid']['lat_min'],
        meta['grid']['lon_max'],
        meta['grid']['lat_max'],
        meta['grid']['lon_step'],
        meta['grid']['lat_step'],
        meta['start_time'],
        meta['time_step_hours'],
        meta['frames'],
        'Ocean Current Data'
    ))
    
    metadata_id = cur.fetchone()[0]
    print(f"✅ 洋流元数据已插入，ID: {metadata_id}")
    
    # 导入每个时间帧的数据
    data_dir = DATA_BASE_DIR / 'ocean_currents'
    data_size = meta['grid']['lon_size'] * meta['grid']['lat_size']
    
    for i in range(meta['frames']):
        u_file = data_dir / f'u_t{i:02d}.bin'
        v_file = data_dir / f'v_t{i:02d}.bin'
        
        if not u_file.exists() or not v_file.exists():
            print(f"⚠️  警告：时间帧 {i} 的文件不存在，跳过")
            continue
        
        # 读取二进制数据
        u_data = read_binary_file(u_file)
        v_data = read_binary_file(v_file)
        
        # 计算最小最大值
        u_min, u_max = calculate_min_max(u_data)
        v_min, v_max = calculate_min_max(v_data)
        
        # 插入数据
        cur.execute("""
            INSERT INTO ocean_current_data 
            (metadata_id, time_index, u_component, v_component, u_min, u_max, v_min, v_max, data_size)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            metadata_id, i,
            psycopg2.Binary(u_data), psycopg2.Binary(v_data),
            u_min, u_max, v_min, v_max, data_size
        ))
        
        print(f"  ✓ 时间帧 {i}/{meta['frames']-1} 已导入")
    
    conn.commit()
    print(f"✅ 洋流数据导入完成！共 {meta['frames']} 个时间帧")

def import_wave_data(conn):
    """导入波浪数据"""
    print("\n🌊 开始导入波浪数据...")
    cur = conn.cursor()
    
    # 读取元数据
    meta_path = DATA_BASE_DIR / 'wave_data' / 'meta.json'
    with open(meta_path, 'r') as f:
        meta = json.load(f)
    
    # 获取数据类型ID
    type_id = get_data_type_id(cur, 'wave')
    if not type_id:
        print("❌ 错误：找不到wave数据类型")
        return
    
    # 插入元数据
    cur.execute("""
        INSERT INTO weather_metadata 
        (data_type_id, grid_lon_size, grid_lat_size, grid_lon_min, grid_lat_min,
         grid_lon_max, grid_lat_max, grid_lon_step, grid_lat_step, start_time,
         time_step_hours, total_frames, data_source)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
    """, (
        type_id,
        meta['grid']['lon_size'],
        meta['grid']['lat_size'],
        meta['grid']['lon_min'],
        meta['grid']['lat_min'],
        meta['grid']['lon_max'],
        meta['grid']['lat_max'],
        meta['grid']['lon_step'],
        meta['grid']['lat_step'],
        meta['start_time'],
        meta['time_step_hours'],
        meta['frames'],
        'Wave Data'
    ))
    
    metadata_id = cur.fetchone()[0]
    print(f"✅ 波浪元数据已插入，ID: {metadata_id}")
    
    # 导入每个时间帧的数据
    data_dir = DATA_BASE_DIR / 'wave_data'
    data_size = meta['grid']['lon_size'] * meta['grid']['lat_size']
    
    for i in range(meta['frames']):
        stokes_u_file = data_dir / f'stokes_u_t{i:02d}.bin'
        stokes_v_file = data_dir / f'stokes_v_t{i:02d}.bin'
        hs_file = data_dir / f'hs_t{i:02d}.bin'
        
        if not stokes_u_file.exists() or not stokes_v_file.exists():
            print(f"⚠️  警告：时间帧 {i} 的文件不存在，跳过")
            continue
        
        # 读取二进制数据
        u_data = read_binary_file(stokes_u_file)
        v_data = read_binary_file(stokes_v_file)
        hs_data = read_binary_file(hs_file) if hs_file.exists() else None
        
        # 计算最小最大值
        u_min, u_max = calculate_min_max(u_data)
        v_min, v_max = calculate_min_max(v_data)
        hs_min, hs_max = calculate_min_max(hs_data) if hs_data else (None, None)
        
        # 插入数据
        cur.execute("""
            INSERT INTO wave_data 
            (metadata_id, time_index, u_component, v_component, wave_height,
             u_min, u_max, v_min, v_max, hs_min, hs_max, data_size)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            metadata_id, i,
            psycopg2.Binary(u_data), psycopg2.Binary(v_data),
            psycopg2.Binary(hs_data) if hs_data else None,
            u_min, u_max, v_min, v_max, hs_min, hs_max, data_size
        ))
        
        print(f"  ✓ 时间帧 {i}/{meta['frames']-1} 已导入")
    
    conn.commit()
    print(f"✅ 波浪数据导入完成！共 {meta['frames']} 个时间帧")

def main():
    """主函数"""
    print("=" * 60)
    print("🚀 气象数据导入工具")
    print("=" * 60)
    
    try:
        # 连接数据库
        print("\n📡 连接数据库...")
        conn = get_db_connection()
        print("✅ 数据库连接成功")
        
        # 导入各类数据
        import_wind_data(conn)
        import_ocean_current_data(conn)
        import_wave_data(conn)
        
        # 关闭连接
        conn.close()
        
        print("\n" + "=" * 60)
        print("🎉 所有气象数据导入完成！")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ 错误：{e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
