#!/bin/bash

echo "=========================================="
echo "🌊 内波数据快速导入脚本"
echo "=========================================="

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装"
    exit 1
fi

# 检查psycopg2
python3 -c "import psycopg2" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "📦 安装 psycopg2..."
    pip3 install psycopg2-binary
fi

# 检查numpy
python3 -c "import numpy" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "📦 安装 numpy..."
    pip3 install numpy
fi

# 创建数据库表
echo ""
echo "📋 创建数据库表..."
psql -U postgres -d mining_weather -f database_internal_wave.sql

if [ $? -ne 0 ]; then
    echo "❌ 创建表失败"
    exit 1
fi

echo "✅ 数据库表创建成功"

# 导入数据
echo ""
echo "📥 开始导入内波数据..."
python3 import_internal_wave.py

if [ $? -ne 0 ]; then
    echo "❌ 数据导入失败"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ 内波数据导入完成！"
echo "=========================================="
echo ""
echo "🚀 启动API服务:"
echo "   python3 weather_api.py"
echo ""
echo "📡 测试API:"
echo "   curl http://localhost:8083/api/weather/metadata/internal_wave"
echo "   curl http://localhost:8083/api/weather/data/internal_wave/0"
echo ""
