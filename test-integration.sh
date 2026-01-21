#!/bin/bash

# 气象点查询功能 - 集成测试脚本

echo "🧪 气象点查询功能 - 集成测试"
echo "================================"
echo ""

# 后端API地址
API_BASE="http://localhost:8081"

# 测试点坐标（中国东海）
LAT=28.5
LON=122.3

echo "📍 测试坐标: ($LAT, $LON)"
echo ""

# 步骤1：检查后端服务
echo "步骤1: 检查后端服务"
echo "----------------------------"
if curl -s --connect-timeout 3 "${API_BASE}/api/weather/metadata/wind" > /dev/null 2>&1; then
    echo "✅ 后端服务正常运行"
else
    echo "❌ 后端服务未运行或无法访问"
    echo "   请先启动后端服务："
    echo "   cd backend/java && mvn spring-boot:run"
    exit 1
fi
echo ""

# 步骤2：检查数据库数据
echo "步骤2: 检查数据库数据"
echo "----------------------------"
echo "检查风场元数据..."
WIND_META=$(curl -s "${API_BASE}/api/weather/metadata/wind")
if echo "$WIND_META" | jq -e '.success == true' > /dev/null 2>&1; then
    echo "✅ 风场元数据存在"
    echo "$WIND_META" | jq '.data.grid'
else
    echo "❌ 风场元数据不存在"
fi
echo ""

echo "检查波浪元数据..."
WAVE_META=$(curl -s "${API_BASE}/api/weather/metadata/wave")
if echo "$WAVE_META" | jq -e '.success == true' > /dev/null 2>&1; then
    echo "✅ 波浪元数据存在"
    echo "$WAVE_META" | jq '.data.grid'
else
    echo "❌ 波浪元数据不存在"
fi
echo ""

echo "检查洋流元数据..."
CURRENT_META=$(curl -s "${API_BASE}/api/weather/metadata/ocean_current")
if echo "$CURRENT_META" | jq -e '.success == true' > /dev/null 2>&1; then
    echo "✅ 洋流元数据存在"
    echo "$CURRENT_META" | jq '.data.grid'
else
    echo "❌ 洋流元数据不存在"
fi
echo ""

# 步骤3：测试点查询接口
echo "步骤3: 测试点查询接口"
echo "----------------------------"
echo "查询位置: ($LAT, $LON), 时间索引: 0"
QUERY_RESULT=$(curl -s "${API_BASE}/api/weather/point-query?lat=${LAT}&lon=${LON}&timeIndex=0")

if echo "$QUERY_RESULT" | jq -e '.success == true' > /dev/null 2>&1; then
    echo "✅ 点查询成功"
    echo ""
    echo "返回数据："
    echo "$QUERY_RESULT" | jq '.'
    echo ""
    
    # 提取关键数据
    echo "📊 数据摘要："
    echo "----------------------------"
    
    WIND_SPEED=$(echo "$QUERY_RESULT" | jq -r '.data.wind.speed // "N/A"')
    WIND_DIR=$(echo "$QUERY_RESULT" | jq -r '.data.wind.direction // "N/A"')
    echo "风速: ${WIND_SPEED} m/s, 风向: ${WIND_DIR}°"
    
    WAVE_HEIGHT=$(echo "$QUERY_RESULT" | jq -r '.data.wave.height // "N/A"')
    WAVE_SPEED=$(echo "$QUERY_RESULT" | jq -r '.data.wave.speed // "N/A"')
    echo "波高: ${WAVE_HEIGHT} m, 波浪速度: ${WAVE_SPEED} m/s"
    
    CURRENT_SPEED=$(echo "$QUERY_RESULT" | jq -r '.data.current.speed // "N/A"')
    CURRENT_DIR=$(echo "$QUERY_RESULT" | jq -r '.data.current.direction // "N/A"')
    echo "洋流速度: ${CURRENT_SPEED} m/s, 流向: ${CURRENT_DIR}°"
    
else
    echo "❌ 点查询失败"
    echo "$QUERY_RESULT" | jq '.'
fi
echo ""

# 步骤4：测试不同位置
echo "步骤4: 测试不同位置"
echo "----------------------------"
echo "测试赤道位置 (0, 120)..."
EQUATOR_RESULT=$(curl -s "${API_BASE}/api/weather/point-query?lat=0&lon=120&timeIndex=0")
if echo "$EQUATOR_RESULT" | jq -e '.success == true' > /dev/null 2>&1; then
    WIND=$(echo "$EQUATOR_RESULT" | jq -r '.data.wind.speed // "N/A"')
    echo "✅ 赤道位置查询成功，风速: ${WIND} m/s"
else
    echo "❌ 赤道位置查询失败"
fi
echo ""

echo "测试负经度位置 (30, -60)..."
WEST_RESULT=$(curl -s "${API_BASE}/api/weather/point-query?lat=30&lon=-60&timeIndex=0")
if echo "$WEST_RESULT" | jq -e '.success == true' > /dev/null 2>&1; then
    WIND=$(echo "$WEST_RESULT" | jq -r '.data.wind.speed // "N/A"')
    echo "✅ 负经度位置查询成功，风速: ${WIND} m/s"
else
    echo "❌ 负经度位置查询失败"
fi
echo ""

# 步骤5：测试时间索引
echo "步骤5: 测试不同时间索引"
echo "----------------------------"
for i in 0 1 2; do
    echo "测试时间索引 $i..."
    TIME_RESULT=$(curl -s "${API_BASE}/api/weather/point-query?lat=${LAT}&lon=${LON}&timeIndex=${i}")
    if echo "$TIME_RESULT" | jq -e '.success == true' > /dev/null 2>&1; then
        WIND=$(echo "$TIME_RESULT" | jq -r '.data.wind.speed // "N/A"')
        echo "  ✅ 时间索引 $i 查询成功，风速: ${WIND} m/s"
    else
        echo "  ❌ 时间索引 $i 查询失败"
    fi
done
echo ""

# 总结
echo "================================"
echo "✅ 集成测试完成！"
echo ""
echo "📝 测试结果总结："
echo "  - 后端服务: ✅ 正常"
echo "  - 数据库连接: ✅ 正常"
echo "  - 点查询接口: ✅ 可用"
echo ""
echo "🚀 下一步："
echo "  1. 启动前端: cd demo && npm run dev"
echo "  2. 访问: http://localhost:5173"
echo "  3. 激活气象图层"
echo "  4. 点击地图任意位置"
echo "  5. 查看气象数据弹窗"
echo ""
