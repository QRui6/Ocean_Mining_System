#!/bin/bash

echo "🧪 测试 CORS 配置..."
echo ""

# 测试风场数据
echo "1️⃣ 测试风场数据端点:"
curl -s -I -H "Origin: http://localhost:5173" http://localhost:8081/api/weather/data/wind/0/binary | grep -E "HTTP|Access-Control-Allow-Origin"
echo ""

# 测试洋流数据
echo "2️⃣ 测试洋流数据端点:"
curl -s -I -H "Origin: http://localhost:5173" http://localhost:8081/api/weather/data/ocean_current/0/binary | grep -E "HTTP|Access-Control-Allow-Origin"
echo ""

# 测试波浪数据
echo "3️⃣ 测试波浪数据端点:"
curl -s -I -H "Origin: http://localhost:5173" http://localhost:8081/api/weather/data/wave/0/binary | grep -E "HTTP|Access-Control-Allow-Origin"
echo ""

# 测试内波数据
echo "4️⃣ 测试内波数据端点:"
curl -s -I -H "Origin: http://localhost:5173" http://localhost:8081/api/weather/data/internal_wave/0/binary | grep -E "HTTP|Access-Control-Allow-Origin"
echo ""

echo "✅ 测试完成！"
echo ""
echo "预期结果："
echo "  - HTTP/1.1 200"
echo "  - Access-Control-Allow-Origin: * (只有一个)"
