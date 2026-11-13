#!/bin/bash

# 从 Copernicus CDS 下载风场数据
# 匹配海浪数据的时间范围

set -e  # 遇到错误立即退出

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "🌬️  开始下载 Copernicus CDS 风场数据..."
echo "=" | head -c 70 | tr '\n' '='
echo ""

# 检查配置文件
if [ ! -f ~/.cdsapirc ]; then
    echo "❌ 未找到 CDS API 配置文件"
    echo ""
    echo "请先运行: bash setup_cds_final.sh"
    exit 1
fi

echo "✅ CDS API 配置文件已找到"
echo ""

# 检查 Python 依赖
echo "📦 检查 Python 依赖..."
python3 -c "import cdsapi" 2>/dev/null || {
    echo "⏳ 安装 cdsapi..."
    pip3 install cdsapi
}

python3 -c "import netCDF4" 2>/dev/null || {
    echo "⏳ 安装 netCDF4..."
    pip3 install netCDF4
}

python3 -c "import numpy" 2>/dev/null || {
    echo "⏳ 安装 numpy..."
    pip3 install numpy
}

echo "✅ 所有依赖已安装"
echo ""

# 步骤1: 下载 NetCDF 数据
echo "📡 [1/3] 下载风场数据..."
python3 download_cds_wind.py

if [ ! -f "wind_data.nc" ]; then
    echo "❌ 下载失败，未找到 wind_data.nc"
    exit 1
fi

echo ""

# 步骤2: 转换为二进制格式
echo "🔄 [2/3] 转换为二进制格式..."
python3 convert_wind_to_binary.py

if [ ! -d "../../public/wind_data" ]; then
    echo "❌ 转换失败，未找到输出目录"
    exit 1
fi

echo ""

# 步骤3: 检查输出
echo "📊 [3/3] 检查输出文件..."
echo ""
echo "📁 输出目录: public/wind_data/"
ls -lh ../../public/wind_data/ | head -20

echo ""
echo "=" | head -c 70 | tr '\n' '='
echo ""
echo "🎉 风场数据处理完成！"
echo ""
echo "📊 数据摘要:"
if [ -f "../../public/wind_data/meta.json" ]; then
    cat ../../public/wind_data/meta.json | python3 -m json.tool
fi

echo ""
echo "下一步:"
echo "  1. 刷新前端页面"
echo "  2. 切换到'气象监测'选项卡"
echo "  3. 点击'近日风场预报'图层"
echo "  4. 使用时间轴查看不同时间的风场数据"
echo ""
