#!/bin/bash

# 安装 grib2json 工具
# 这是一个 Java 工具，用于将 GRIB2 格式转换为 JSON

echo "🔧 开始安装 grib2json 工具..."
echo ""

# 检查 Java 是否安装
if ! command -v java &> /dev/null; then
    echo "❌ Java 未安装，请先安装 Java 8+"
    echo "   Ubuntu/Debian: sudo apt install openjdk-11-jdk"
    echo "   CentOS/RHEL: sudo yum install java-11-openjdk"
    exit 1
fi

echo "✅ Java 已安装: $(java -version 2>&1 | head -n 1)"
echo ""

# 创建临时目录
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

echo "📦 下载 grib2json..."
# 从 GitHub 下载预编译版本
GRIB2JSON_VERSION="0.8.0"
DOWNLOAD_URL="https://github.com/cambecc/grib2json/releases/download/${GRIB2JSON_VERSION}/grib2json-${GRIB2JSON_VERSION}.tar.gz"

if curl -L -o grib2json.tar.gz "$DOWNLOAD_URL"; then
    echo "✅ 下载完成"
else
    echo "❌ 下载失败，尝试备用方法..."
    echo ""
    echo "请手动安装："
    echo "1. 访问: https://github.com/cambecc/grib2json/releases"
    echo "2. 下载最新版本的 tar.gz 文件"
    echo "3. 解压并将 grib2json 脚本复制到 /usr/local/bin/"
    exit 1
fi

echo ""
echo "📂 解压文件..."
tar -xzf grib2json.tar.gz

# 查找 grib2json 可执行文件
GRIB2JSON_BIN=$(find . -name "grib2json" -type f | head -n 1)

if [ -z "$GRIB2JSON_BIN" ]; then
    echo "❌ 未找到 grib2json 可执行文件"
    exit 1
fi

echo "✅ 找到可执行文件: $GRIB2JSON_BIN"
echo ""

# 复制到系统路径
echo "📋 安装到系统..."
INSTALL_DIR="/usr/local/bin"

if [ -w "$INSTALL_DIR" ]; then
    cp "$GRIB2JSON_BIN" "$INSTALL_DIR/grib2json"
    chmod +x "$INSTALL_DIR/grib2json"
    echo "✅ 已安装到 $INSTALL_DIR/grib2json"
else
    echo "⚠️  需要 sudo 权限安装到 $INSTALL_DIR"
    sudo cp "$GRIB2JSON_BIN" "$INSTALL_DIR/grib2json"
    sudo chmod +x "$INSTALL_DIR/grib2json"
    echo "✅ 已安装到 $INSTALL_DIR/grib2json"
fi

# 清理临时文件
cd -
rm -rf "$TEMP_DIR"

echo ""
echo "🧪 测试安装..."
if command -v grib2json &> /dev/null; then
    echo "✅ grib2json 安装成功！"
    grib2json --help 2>&1 | head -n 5
else
    echo "❌ 安装失败，请检查错误信息"
    exit 1
fi

echo ""
echo "🎉 安装完成！现在可以重启后端服务了。"
