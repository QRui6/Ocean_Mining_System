#!/bin/bash

echo "========================================="
echo "  气象点查询 - 前后端集成测试"
echo "========================================="
echo ""

# 测试后端API
echo "1️⃣  测试后端API..."
echo "   请求: GET /api/weather/point-query?lat=28.5&lon=122.3&timeIndex=0"
echo ""

response=$(curl -s "http://localhost:8081/api/weather/point-query?lat=28.5&lon=122.3&timeIndex=0")

if [ $? -eq 0 ] && [ -n "$response" ]; then
    echo "✅ 后端API响应成功"
    echo ""
    echo "📊 响应数据:"
    echo "$response"
    echo ""
    
    # 简单检查是否包含success字段
    if echo "$response" | grep -q '"success":true'; then
        echo "✅ 数据查询成功"
        echo ""
        echo "🌊 前端可以正常获取气象数据"
    elif echo "$response" | grep -q '"success":false'; then
        echo "❌ 数据查询失败"
        echo "$response"
    else
        echo "⚠️  响应格式异常"
    fi
else
    echo "❌ 后端API无响应"
    echo "   请确保后端服务已启动: cd backend/java && mvn spring-boot:run"
fi

echo ""
echo "========================================="
echo "2️⃣  前端配置检查..."
echo "========================================="
echo ""

# 检查环境变量
if [ -f ".env" ]; then
    echo "✅ 环境变量文件存在"
    api_url=$(grep "VITE_API_BASE_URL" .env | cut -d'=' -f2)
    echo "   API地址: $api_url"
else
    echo "❌ 环境变量文件不存在"
fi

echo ""
echo "========================================="
echo "3️⃣  启动说明"
echo "========================================="
echo ""
echo "启动后端:"
echo "  cd backend/java"
echo "  mvn spring-boot:run"
echo ""
echo "启动前端:"
echo "  cd demo"
echo "  npm run dev"
echo ""
echo "使用功能:"
echo "  1. 访问 http://localhost:5173"
echo "  2. 激活气象图层（右侧面板 → 气象图层）"
echo "  3. 点击地图任意位置"
echo "  4. 查看气象数据弹窗"
echo ""
echo "========================================="
