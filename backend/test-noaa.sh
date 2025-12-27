#!/bin/bash

# NOAA 数据服务测试脚本

PORT=3000
BASE_URL="http://localhost:$PORT"

echo "🧪 NOAA 数据服务测试脚本"
echo "=========================="
echo ""

# 1. 检查服务器是否运行
echo "1️⃣  检查服务器状态..."
if curl -s "$BASE_URL/api/areas" > /dev/null 2>&1; then
    echo "   ✅ 服务器正在运行"
else
    echo "   ❌ 服务器未运行，请先启动: npm start"
    exit 1
fi
echo ""

# 2. 触发数据更新（风场）
echo "2️⃣  触发风场数据更新..."
curl -X POST "$BASE_URL/api/noaa/update" \
  -H "Content-Type: application/json" \
  -d '{"type": "wind"}' \
  -s | jq '.'
echo ""

# 等待一段时间让数据下载
echo "⏳ 等待 30 秒让数据下载和转换..."
sleep 30
echo ""

# 3. 检查数据状态
echo "3️⃣  检查数据文件状态..."
curl -s "$BASE_URL/api/noaa/status" | jq '.'
echo ""

# 4. 获取可用数据列表
echo "4️⃣  获取可用数据列表..."
curl -s "$BASE_URL/api/noaa/available" | jq '.'
echo ""

# 5. 测试数据访问
echo "5️⃣  测试数据文件访问..."
if curl -s "$BASE_URL/data/noaa/wind_f000.json" > /dev/null 2>&1; then
    echo "   ✅ 风场数据可访问"
    echo "   文件大小: $(curl -sI "$BASE_URL/data/noaa/wind_f000.json" | grep -i content-length | awk '{print $2}' | tr -d '\r') bytes"
else
    echo "   ⚠️  风场数据尚未生成，请等待后台任务完成"
fi
echo ""

echo "✅ 测试完成！"
echo ""
echo "💡 提示："
echo "   - 首次下载需要较长时间（5-10分钟）"
echo "   - 查看后端日志了解下载进度"
echo "   - 数据文件位置: backend/public/data/noaa/"
