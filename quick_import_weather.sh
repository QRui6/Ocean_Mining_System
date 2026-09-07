#!/bin/bash

# 快速导入气象数据脚本

echo "🚀 开始导入气象数据..."
echo "================================"

# 检查Python是否安装
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误：未找到 python3"
    exit 1
fi

# 检查psycopg2是否安装
python3 -c "import psycopg2" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  警告：psycopg2 未安装，正在安装..."
    pip3 install psycopg2-binary
fi

# 运行导入脚本
cd "$(dirname "$0")"
python3 import_weather_data.py

echo ""
echo "✅ 导入完成！"
