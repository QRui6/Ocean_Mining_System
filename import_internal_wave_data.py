#!/usr/bin/env python3
"""
内波数据导入脚本
从本地二进制文件导入内波数据到PostgreSQL数据库
"""

import psycopg2
import struct
import os
import sys
from datetime import datetime

# 数据库连接配置
DB_CONFIG = {
    'host': '121.194.93.61',
    'port': 5432,
    'database': 'ship_monitoring',
    'user': 'postgres',
    'password': 'jcf0326_103'
}

# 内波数据配置
INTERNAL_WAVE_CONFIG = {
    'data_path': '/home/k8s/Downloads/demo/public/hret14/hret14_out_uv_20200101',
    'lon_size': 7200,
    'lat_size': 2641,
    'frames': 9,  # 0-8共9帧
    'file_pattern': {
        'u': 'u_{:03d}.bin',
        'v': 'v_{:03d}.bin'
    }
}

def read_binary_file(file_path):
    """读取二进制文件并返回Float32数组"""
    try:
        with open(file_path, 'rb') as f:
            data = f.read()
        
        # 解析为float32数组
        num_floats = len(data) // 4
        float_array = struct.unpack(f'{num_floats}f', data)
        
        return float_array
    except Exception as e:
        print(f"❌ 读取文件失败 {file_path}: {e}")
        return None

def calculate_stats(data):
    """计算数据统计信息"""
    valid_data = [x for x in data if abs(x) < 1e10]  # 过滤异常值
    if not valid_data:
        return 0.0, 0.0
    
    return min(valid_data), max(valid_data)

def import_internal_wave_data(time_index):
    """导入指定时间索引的内波数据"""
    config = INTERNAL_WAVE_CONFIG
    data_path = config['data_path']
    
    # 构造文件路径
    u_file = os.path.join(data_path, config['file_pattern']['u'].format(time_index))
    v_file = os.path.join(data_path, config['file_pattern']['v'].format(time_index))
    
    print(f"\n📊 导入时间索引 {time_index}")
    print(f"   U文件: {u_file}")
    print(f"   V文件: {v_file}")
    
    # 检查文件是否存在
    if not os.path.exists(u_file):
        print(f"❌ U文件不存在: {u_file}")
        return False
    
    if not os.path.exists(v_file):
        print(f"❌ V文件不存在: {v_file}")
        return False
    
    # 读取数据
    print("⏳ 读取U分量数据...")
    u_data = read_binary_file(u_file)
    if u_data is None:
        return False
    
    print("⏳ 读取V分量数据...")
    v_data = read_binary_file(v_file)
    if v_data is None:
        return False
    
    # 验证数据大小
    expected_size = config['lon_size'] * config['lat_size']
    if len(u_data) != expected_size or len(v_data) != expected_size:
        print(f"❌ 数据大小不匹配: 期望 {expected_size}, U={len(u_data)}, V={len(v_data)}")
        return False
    
    print(f"✅ 数据读取成功: {len(u_data)} 个数据点")
    
    # 计算统计信息
    u_min, u_max = calculate_stats(u_data)
    v_min, v_max = calculate_stats(v_data)
    
    print(f"📈 数据统计:")
    print(f"   U范围: {u_min:.6f} ~ {u_max:.6f}")
    print(f"   V范围: {v_min:.6f} ~ {v_max:.6f}")
    
    # 转换为二进制格式
    u_binary = struct.pack(f'{len(u_data)}f', *u_data)
    v_binary = struct.pack(f'{len(v_data)}f', *v_data)
    
    # 连接数据库并插入
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # 检查是否已存在
        cursor.execute(
            "SELECT id FROM internal_wave_data WHERE time_index = %s",
            (time_index,)
        )
        existing = cursor.fetchone()
        
        if existing:
            print(f"⚠️  时间索引 {time_index} 已存在，更新数据...")
            cursor.execute("""
                UPDATE internal_wave_data
                SET u_data = %s,
                    v_data = %s,
                    width = %s,
                    height = %s,
                    u_min = %s,
                    u_max = %s,
                    v_min = %s,
                    v_max = %s
                WHERE time_index = %s
            """, (
                psycopg2.Binary(u_binary),
                psycopg2.Binary(v_binary),
                config['lon_size'],
                config['lat_size'],
                u_min,
                u_max,
                v_min,
                v_max,
                time_index
            ))
        else:
            print(f"⏳ 插入新数据...")
            cursor.execute("""
                INSERT INTO internal_wave_data (
                    time_index, u_data, v_data, width, height,
                    u_min, u_max, v_min, v_max
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                time_index,
                psycopg2.Binary(u_binary),
                psycopg2.Binary(v_binary),
                config['lon_size'],
                config['lat_size'],
                u_min,
                u_max,
                v_min,
                v_max
            ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ 时间索引 {time_index} 导入成功")
        return True
        
    except Exception as e:
        print(f"❌ 数据库操作失败: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return False

def main():
    """主函数"""
    print("=" * 60)
    print("内波数据导入工具")
    print("=" * 60)
    
    # 检查数据目录
    data_path = INTERNAL_WAVE_CONFIG['data_path']
    if not os.path.exists(data_path):
        print(f"❌ 数据目录不存在: {data_path}")
        sys.exit(1)
    
    print(f"📁 数据目录: {data_path}")
    print(f"📊 网格大小: {INTERNAL_WAVE_CONFIG['lon_size']} x {INTERNAL_WAVE_CONFIG['lat_size']}")
    print(f"⏰ 时间帧数: {INTERNAL_WAVE_CONFIG['frames']}")
    
    # 导入所有时间帧
    success_count = 0
    fail_count = 0
    
    for time_index in range(INTERNAL_WAVE_CONFIG['frames']):
        if import_internal_wave_data(time_index):
            success_count += 1
        else:
            fail_count += 1
    
    # 输出统计
    print("\n" + "=" * 60)
    print("导入完成")
    print("=" * 60)
    print(f"✅ 成功: {success_count} 帧")
    print(f"❌ 失败: {fail_count} 帧")
    print(f"📊 总计: {INTERNAL_WAVE_CONFIG['frames']} 帧")
    
    if fail_count == 0:
        print("\n🎉 所有数据导入成功！")
    else:
        print(f"\n⚠️  有 {fail_count} 帧导入失败，请检查日志")

if __name__ == '__main__':
    main()
