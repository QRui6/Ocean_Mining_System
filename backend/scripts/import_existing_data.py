#!/usr/bin/env python3
"""
导入现有气象数据到数据库

功能：
1. 扫描 public/ 目录下的气象数据文件
2. 读取 meta.json 获取网格信息
3. 将文件元数据写入 weather_files 表
4. 采样数据点写入 weather_sample_points 表

使用方法：
    python3 import_existing_data.py
    python3 import_existing_data.py --sample-rate 5  # 指定采样率
"""

import os
import sys
import json
import struct
import psycopg2
from psycopg2.extras import execute_batch
from datetime import datetime, timedelta
import argparse

# 数据库配置
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 5432)),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'postgres123'),
    'database': os.getenv('DB_NAME', 'ship_monitoring')
}

# 数据目录配置
DATA_DIRS = {
    'wind': '../../public/wind_data',
    'wave': '../../public/wave_data',
    'current': '../../public/ocean_currents'
}

# 变量映射（文件名前缀 -> 变量名）
VARIABLE_MAPPING = {
    'u': 'u',
    'v': 'v',
    'hs': 'hs',
    'stokes_u': 'stokes_u',
    'stokes_v': 'stokes_v'
}


class WeatherDataImporter:
    def __init__(self, sample_rate=5):
        """
        初始化导入器
        
        Args:
            sample_rate: 采样率（每隔N个点采样一次）
        """
        self.sample_rate = sample_rate
        self.conn = None
        self.cursor = None
        
    def connect_db(self):
        """连接数据库"""
        try:
            self.conn = psycopg2.connect(**DB_CONFIG)
            self.cursor = self.conn.cursor()
            print("✅ 数据库连接成功")
        except Exception as e:
            print(f"❌ 数据库连接失败: {e}")
            sys.exit(1)
    
    def close_db(self):
        """关闭数据库连接"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        print("✅ 数据库连接已关闭")
    
    def read_meta_json(self, data_dir):
        """
        读取 meta.json 文件
        
        Args:
            data_dir: 数据目录路径
            
        Returns:
            dict: 元数据信息
        """
        meta_path = os.path.join(data_dir, 'meta.json')
        if not os.path.exists(meta_path):
            print(f"⚠️  未找到 meta.json: {meta_path}")
            return None
        
        with open(meta_path, 'r') as f:
            meta = json.load(f)
        
        return meta
    
    def scan_binary_files(self, data_dir, data_type):
        """
        扫描目录下的二进制文件
        
        Args:
            data_dir: 数据目录路径
            data_type: 数据类型 ('wind', 'wave', 'current')
            
        Returns:
            list: 文件列表 [(variable, time_step, file_path), ...]
        """
        files = []
        
        if not os.path.exists(data_dir):
            print(f"⚠️  目录不存在: {data_dir}")
            return files
        
        for filename in os.listdir(data_dir):
            if not filename.endswith('.bin'):
                continue
            
            # 解析文件名：u_t00.bin, hs_t00.bin, stokes_u_t00.bin
            parts = filename.replace('.bin', '').split('_t')
            if len(parts) != 2:
                continue
            
            variable_prefix = parts[0]
            time_step = int(parts[1])
            
            # 映射变量名
            variable = VARIABLE_MAPPING.get(variable_prefix)
            if not variable:
                print(f"⚠️  未知变量: {variable_prefix}")
                continue
            
            file_path = os.path.join(data_dir, filename)
            files.append((variable, time_step, file_path))
        
        return sorted(files, key=lambda x: (x[0], x[1]))
    
    def import_file_metadata(self, data_type, variable, time_step, file_path, meta):
        """
        导入文件元数据到 weather_files 表
        
        Args:
            data_type: 数据类型
            variable: 变量名
            time_step: 时间步索引
            file_path: 文件路径
            meta: 元数据信息
            
        Returns:
            int: 插入的文件ID
        """
        # 计算预报时间
        start_time_str = meta['start_time'].replace('Z', '')
        # 处理纳秒精度（Python 只支持微秒）
        if '.' in start_time_str:
            # 分离日期时间和小数秒部分
            dt_part, frac_part = start_time_str.split('.')
            # 只保留前6位（微秒）
            frac_part = frac_part[:6].ljust(6, '0')
            start_time_str = f"{dt_part}.{frac_part}"
        
        start_time = datetime.fromisoformat(start_time_str)
        time_step_hours = meta.get('time_step_hours', 3)
        forecast_time = start_time + timedelta(hours=time_step * time_step_hours)
        
        # 获取文件大小
        file_size = os.path.getsize(file_path)
        
        # 构建网格信息
        grid_info = {
            'lat_size': meta['grid']['lat_size'],
            'lon_size': meta['grid']['lon_size'],
            'lat_min': meta['grid']['lat_min'],
            'lat_max': meta['grid']['lat_max'],
            'lon_min': meta['grid']['lon_min'],
            'lon_max': meta['grid']['lon_max'],
            'lat_step': meta['grid']['lat_step'],
            'lon_step': meta['grid']['lon_step'],
            'resolution': f"{meta['grid']['lat_step']:.4f}deg"
        }
        
        # 构建空间范围多边形
        bounds_wkt = f"POLYGON(({grid_info['lon_min']} {grid_info['lat_min']}, " \
                     f"{grid_info['lon_max']} {grid_info['lat_min']}, " \
                     f"{grid_info['lon_max']} {grid_info['lat_max']}, " \
                     f"{grid_info['lon_min']} {grid_info['lat_max']}, " \
                     f"{grid_info['lon_min']} {grid_info['lat_min']}))"
        
        # 插入数据库
        sql = """
            INSERT INTO weather_files 
            (data_type, variable, forecast_time, reference_time, time_step, 
             file_path, file_size, file_format, grid_info, bounds, data_source, is_active)
            VALUES 
            (%s, %s, %s, %s, %s, %s, %s, %s, %s, ST_GeomFromText(%s, 4326), %s, %s)
            ON CONFLICT DO NOTHING
            RETURNING id
        """
        
        self.cursor.execute(sql, (
            data_type,
            variable,
            forecast_time,
            start_time,  # reference_time
            time_step,
            file_path,
            file_size,
            'binary',
            json.dumps(grid_info),
            bounds_wkt,
            'Copernicus',
            True
        ))
        
        result = self.cursor.fetchone()
        if result:
            file_id = result[0]
            self.conn.commit()
            return file_id
        else:
            # 如果已存在，查询ID
            self.cursor.execute(
                "SELECT id FROM weather_files WHERE file_path = %s",
                (file_path,)
            )
            result = self.cursor.fetchone()
            return result[0] if result else None
    
    def read_binary_file(self, file_path, grid_info):
        """
        读取二进制文件
        
        Args:
            file_path: 文件路径
            grid_info: 网格信息
            
        Returns:
            list: 数据数组
        """
        lat_size = grid_info['lat_size']
        lon_size = grid_info['lon_size']
        total_points = lat_size * lon_size
        
        with open(file_path, 'rb') as f:
            data = f.read()
        
        # 解析为浮点数数组
        values = struct.unpack(f'{total_points}f', data)
        
        return values
    
    def sample_and_import_points(self, file_id, data_type, variable, forecast_time, 
                                  file_path, grid_info):
        """
        采样并导入数据点到 weather_sample_points 表
        
        Args:
            file_id: 文件ID
            data_type: 数据类型
            variable: 变量名
            forecast_time: 预报时间
            file_path: 文件路径
            grid_info: 网格信息
        """
        print(f"   📊 采样数据点 (采样率: 1/{self.sample_rate})...")
        
        # 读取二进制文件
        values = self.read_binary_file(file_path, grid_info)
        
        # 采样
        lat_size = grid_info['lat_size']
        lon_size = grid_info['lon_size']
        lat_min = grid_info['lat_min']
        lon_min = grid_info['lon_min']
        lat_step = grid_info['lat_step']
        lon_step = grid_info['lon_step']
        
        sample_points = []
        
        for i in range(0, lat_size, self.sample_rate):
            for j in range(0, lon_size, self.sample_rate):
                index = i * lon_size + j
                value = values[index]
                
                # 跳过无效值
                if value == float('inf') or value == float('-inf') or value != value:  # NaN
                    continue
                
                lat = lat_min + i * lat_step
                lon = lon_min + j * lon_step
                
                sample_points.append((
                    file_id,
                    data_type,
                    variable,
                    forecast_time,
                    lat,
                    lon,
                    value,
                    index,
                    0  # quality_flag
                ))
        
        # 批量插入
        if sample_points:
            sql = """
                INSERT INTO weather_sample_points 
                (file_id, data_type, variable, forecast_time, lat, lon, 
                 grid_point, value, grid_index, quality_flag)
                VALUES 
                (%s, %s, %s, %s, %s, %s, ST_MakePoint(%s, %s)::geography, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """
            
            # 转换为插入格式（需要重复 lon, lat 用于 ST_MakePoint）
            insert_data = [
                (p[0], p[1], p[2], p[3], p[4], p[5], p[5], p[4], p[6], p[7], p[8])
                for p in sample_points
            ]
            
            execute_batch(self.cursor, sql, insert_data, page_size=1000)
            self.conn.commit()
            
            print(f"   ✅ 已导入 {len(sample_points)} 个采样点")
        else:
            print(f"   ⚠️  没有有效的采样点")
    
    def import_data_type(self, data_type):
        """
        导入指定类型的所有数据
        
        Args:
            data_type: 数据类型 ('wind', 'wave', 'current')
        """
        print(f"\n{'='*60}")
        print(f"📦 导入 {data_type.upper()} 数据")
        print(f"{'='*60}")
        
        # 获取数据目录
        data_dir = DATA_DIRS.get(data_type)
        if not data_dir:
            print(f"❌ 未配置 {data_type} 数据目录")
            return
        
        # 转换为绝对路径
        script_dir = os.path.dirname(os.path.abspath(__file__))
        data_dir = os.path.normpath(os.path.join(script_dir, data_dir))
        
        # 读取元数据
        meta = self.read_meta_json(data_dir)
        if not meta:
            return
        
        print(f"📋 元数据信息:")
        print(f"   - 网格大小: {meta['grid']['lon_size']} × {meta['grid']['lat_size']}")
        print(f"   - 分辨率: {meta['grid']['lat_step']:.4f}°")
        print(f"   - 时间步数: {meta['frames']}")
        print(f"   - 起始时间: {meta['start_time']}")
        
        # 扫描文件
        files = self.scan_binary_files(data_dir, data_type)
        print(f"📁 找到 {len(files)} 个文件")
        
        # 导入每个文件
        for variable, time_step, file_path in files:
            print(f"\n🔄 处理: {os.path.basename(file_path)}")
            print(f"   - 变量: {variable}")
            print(f"   - 时间步: {time_step}")
            
            # 导入文件元数据
            file_id = self.import_file_metadata(
                data_type, variable, time_step, file_path, meta
            )
            
            if file_id:
                print(f"   ✅ 文件元数据已导入 (ID: {file_id})")
                
                # 采样并导入数据点
                # 解析时间（处理纳秒精度）
                start_time_str = meta['start_time'].replace('Z', '')
                if '.' in start_time_str:
                    dt_part, frac_part = start_time_str.split('.')
                    frac_part = frac_part[:6].ljust(6, '0')
                    start_time_str = f"{dt_part}.{frac_part}"
                start_time = datetime.fromisoformat(start_time_str)
                
                forecast_time = start_time + timedelta(hours=time_step * meta.get('time_step_hours', 3))
                
                self.sample_and_import_points(
                    file_id, data_type, variable, forecast_time,
                    file_path, meta['grid']
                )
            else:
                print(f"   ⚠️  文件元数据导入失败")
    
    def run(self):
        """运行导入流程"""
        print("🚀 开始导入气象数据到数据库")
        print(f"⚙️  采样率: 1/{self.sample_rate}")
        print()
        
        self.connect_db()
        
        try:
            # 导入各类数据
            for data_type in ['wind', 'wave', 'current']:
                self.import_data_type(data_type)
            
            # 显示统计信息
            print(f"\n{'='*60}")
            print("📊 导入统计")
            print(f"{'='*60}")
            
            self.cursor.execute("SELECT COUNT(*) FROM weather_files")
            file_count = self.cursor.fetchone()[0]
            print(f"✅ 文件数: {file_count}")
            
            self.cursor.execute("SELECT COUNT(*) FROM weather_sample_points")
            point_count = self.cursor.fetchone()[0]
            print(f"✅ 采样点数: {point_count:,}")
            
            # 按类型统计
            self.cursor.execute("""
                SELECT data_type, variable, COUNT(*) as count
                FROM weather_sample_points
                GROUP BY data_type, variable
                ORDER BY data_type, variable
            """)
            
            print("\n📈 各变量采样点数:")
            for row in self.cursor.fetchall():
                print(f"   - {row[0]}.{row[1]}: {row[2]:,}")
            
            print("\n🎉 导入完成！")
            
        except Exception as e:
            print(f"\n❌ 导入失败: {e}")
            import traceback
            traceback.print_exc()
            self.conn.rollback()
        finally:
            self.close_db()


def main():
    parser = argparse.ArgumentParser(description='导入现有气象数据到数据库')
    parser.add_argument(
        '--sample-rate',
        type=int,
        default=5,
        help='采样率（每隔N个点采样一次，默认5）'
    )
    
    args = parser.parse_args()
    
    importer = WeatherDataImporter(sample_rate=args.sample_rate)
    importer.run()


if __name__ == '__main__':
    main()
