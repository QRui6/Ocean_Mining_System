#!/bin/bash

# 测试内波数据点查询功能
# 测试后端是否能正确返回内波数据

echo "======================================"
echo "测试内波数据点查询功能"
echo "======================================"
echo ""

# 测试点坐标（太平洋某个位置）
LAT=21.37
LON=-164.26
TIME_INDEX=0

echo "📍 测试坐标: lat=${LAT}, lon=${LON}, timeIndex=${TIME_INDEX}"
echo ""

# 1. 测试单点查询（包含内波）
echo "1️⃣ 测试单点查询（应包含内波数据）"
echo "-----------------------------------"
curl -s "http://localhost:8081/api/weather/point-query?lat=${LAT}&lon=${LON}&timeIndex=${TIME_INDEX}" | jq '.'
echo ""
echo ""

# 2. 测试时间序列查询（包含内波）
echo "2️⃣ 测试时间序列查询（应包含内波数据）"
echo "-----------------------------------"
curl -s "http://localhost:8081/api/weather/point-query/time-series?lat=${LAT}&lon=${LON}&startIndex=0&count=3" | jq '.'
echo ""
echo ""

# 3. 测试内波元数据
echo "3️⃣ 测试内波元数据"
echo "-----------------------------------"
curl -s "http://localhost:8081/api/weather/metadata/internal_wave" | jq '.'
echo ""
echo ""

# 4. 测试内波可用时间索引
echo "4️⃣ 测试内波可用时间索引"
echo "-----------------------------------"
curl -s "http://localhost:8081/api/weather/available/internal_wave" | jq '.'
echo ""
echo ""

echo "======================================"
echo "测试完成"
echo "======================================"
