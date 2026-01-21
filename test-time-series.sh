#!/bin/bash

echo "========================================="
echo "  气象时间序列API测试"
echo "========================================="
echo ""

# 测试时间序列API
echo "📊 测试时间序列查询..."
echo "   请求: GET /api/weather/point-query/time-series?lat=28.5&lon=122.3&startIndex=0&count=24"
echo ""

response=$(curl -s "http://localhost:8081/api/weather/point-query/time-series?lat=28.5&lon=122.3&startIndex=0&count=24")

if [ $? -eq 0 ] && [ -n "$response" ]; then
    echo "✅ API响应成功"
    echo ""
    
    # 简单检查是否包含success字段
    if echo "$response" | grep -q '"success":true'; then
        echo "✅ 时间序列查询成功"
        echo ""
        
        # 提取时间步骤数量
        timeStepsCount=$(echo "$response" | grep -o '"timeSteps":\[' | wc -l)
        if [ "$timeStepsCount" -gt 0 ]; then
            echo "📊 返回了时间序列数据"
            echo ""
            echo "📝 响应数据示例（前500字符）:"
            echo "$response" | head -c 500
            echo "..."
        fi
    elif echo "$response" | grep -q '"success":false'; then
        echo "❌ 查询失败"
        echo "$response"
    else
        echo "⚠️  响应格式异常"
        echo "$response"
    fi
else
    echo "❌ API无响应"
    echo "   请确保后端服务已启动: cd backend/java && mvn spring-boot:run"
fi

echo ""
echo "========================================="
echo "💡 使用说明"
echo "========================================="
echo ""
echo "1. 后端已实现时间序列查询接口"
echo "   GET /api/weather/point-query/time-series"
echo ""
echo "2. 参数说明:"
echo "   - lat: 纬度（必填）"
echo "   - lon: 经度（必填）"
echo "   - startIndex: 起始时间索引（可选，默认0）"
echo "   - count: 查询数量（可选，默认24，最大48）"
echo ""
echo "3. 返回数据包含:"
echo "   - 风速、风向（每个时间点）"
echo "   - 波高、波浪方向、波浪漂移速度、波峰传播速度"
echo "   - 洋流速度、洋流方向"
echo ""
echo "4. 前端使用:"
echo "   - 新组件: WindyStyleWeatherPanel_Backend.vue"
echo "   - 自动调用后端API获取时间序列数据"
echo "   - 不再依赖前端计算"
echo ""
echo "========================================="
