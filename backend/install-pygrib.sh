#!/bin/bash

# 一键安装 pygrib（GRIB2 转换工具）

echo "🔧 开始安装 pygrib..."
echo ""

# 检测操作系统
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "❌ 无法检测操作系统"
    exit 1
fi

echo "📋 检测到操作系统: $OS"
echo ""

# 安装系统依赖
echo "📦 安装系统依赖..."
case $OS in
    ubuntu|debian)
        sudo apt-get update
        sudo apt-get install -y python3-pip libeccodes-dev build-essential python3-dev
        ;;
    centos|rhel|fedora)
        sudo yum install -y python3-pip eccodes-devel gcc python3-devel
        ;;
    *)
        echo "⚠️  未知的操作系统，请手动安装依赖"
        echo "   需要: python3-pip, eccodes 库, gcc 编译器"
        exit 1
        ;;
esac

if [ $? -ne 0 ]; then
    echo "❌ 系统依赖安装失败"
    exit 1
fi

echo "✅ 系统依赖安装完成"
echo ""

# 安装 Python 包
echo "🐍 安装 Python 包..."
pip3 install --user pygrib numpy

if [ $? -ne 0 ]; then
    echo "❌ Python 包安装失败"
    echo ""
    echo "请尝试手动安装："
    echo "  pip3 install pygrib numpy"
    exit 1
fi

echo "✅ Python 包安装完成"
echo ""

# 验证安装
echo "🧪 验证安装..."
if python3 -c "import pygrib; print('pygrib 版本:', pygrib.__version__)" 2>/dev/null; then
    echo "✅ pygrib 安装成功！"
else
    echo "❌ pygrib 验证失败"
    exit 1
fi

echo ""
echo "🎉 安装完成！"
echo ""
echo "下一步："
echo "1. 重启后端服务"
echo "2. 运行: curl -X POST http://localhost:5678/api/noaa/update -H 'Content-Type: application/json' -d '{\"type\": \"wind\"}'"
