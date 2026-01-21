#!/bin/bash

# 二进制传输测试脚本

echo "================================"
echo "二进制传输功能测试"
echo "================================"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 后端地址
BACKEND_URL=${1:-"http://localhost:8081"}

echo "测试后端地址: $BACKEND_URL"
echo ""

# 测试函数
test_endpoint() {
    local name=$1
    local url=$2
    local expected_type=$3
    
    echo -n "测试 $name ... "
    
    response=$(curl -s -w "\n%{http_code}\n%{content_type}\n%{size_download}" "$url" 2>/dev/null)
    http_code=$(echo "$response" | tail -n 2 | head -n 1)
    content_type=$(echo "$response" | tail -n 1 | head -n 1)
    size=$(echo "$response" | tail -n 1)
    
    if [ "$http_code" = "200" ]; then
        if [[ "$content_type" == *"$expected_type"* ]]; then
            echo -e "${GREEN}✓ 成功${NC} (${size} bytes, ${content_type})"
        else
            echo -e "${YELLOW}⚠ 警告${NC} (HTTP 200 但 Content-Type 不匹配: ${content_type})"
        fi
    else
        echo -e "${RED}✗ 失败${NC} (HTTP ${http_code})"
    fi
}

# 1. 测试元数据端点（JSON）
echo "1. 测试元数据端点（JSON）"
test_endpoint "风场元数据" "$BACKEND_URL/api/weather/metadata/wind" "application/json"
test_endpoint "洋流元数据" "$BACKEND_URL/api/weather/metadata/ocean_current" "application/json"
test_endpoint "波浪元数据" "$BACKEND_URL/api/weather/metadata/wave" "application/json"
test_endpoint "内波元数据" "$BACKEND_URL/api/weather/metadata/internal_wave" "application/json"
echo ""

# 2. 测试二进制数据端点
echo "2. 测试二进制数据端点"
test_endpoint "风场数据（二进制）" "$BACKEND_URL/api/weather/data/wind/0/binary" "application/octet-stream"
test_endpoint "洋流数据（二进制）" "$BACKEND_URL/api/weather/data/ocean_current/0/binary" "application/octet-stream"
test_endpoint "波浪数据（二进制）" "$BACKEND_URL/api/weather/data/wave/0/binary" "application/octet-stream"
test_endpoint "内波数据（二进制）" "$BACKEND_URL/api/weather/data/internal_wave/0/binary" "application/octet-stream"
echo ""

# 3. 对比 JSON 和二进制大小
echo "3. 对比 JSON 和二进制传输大小"
echo ""

compare_size() {
    local name=$1
    local json_url=$2
    local binary_url=$3
    
    echo "测试 $name:"
    
    # JSON 大小
    json_size=$(curl -s -w "%{size_download}" -o /dev/null "$json_url" 2>/dev/null)
    json_mb=$(echo "scale=2; $json_size / 1024 / 1024" | bc)
    
    # 二进制大小
    binary_size=$(curl -s -w "%{size_download}" -o /dev/null "$binary_url" 2>/dev/null)
    binary_mb=$(echo "scale=2; $binary_size / 1024 / 1024" | bc)
    
    # 计算压缩比
    if [ "$json_size" -gt 0 ]; then
        ratio=$(echo "scale=1; (1 - $binary_size / $json_size) * 100" | bc)
        echo "  JSON:    ${json_mb} MB"
        echo "  二进制:  ${binary_mb} MB"
        echo -e "  ${GREEN}压缩比:  ${ratio}%${NC}"
    else
        echo -e "  ${RED}无法获取数据${NC}"
    fi
    echo ""
}

compare_size "风场" \
    "$BACKEND_URL/api/weather/data/wind/0" \
    "$BACKEND_URL/api/weather/data/wind/0/binary"

compare_size "洋流" \
    "$BACKEND_URL/api/weather/data/ocean_current/0" \
    "$BACKEND_URL/api/weather/data/ocean_current/0/binary"

compare_size "波浪" \
    "$BACKEND_URL/api/weather/data/wave/0" \
    "$BACKEND_URL/api/weather/data/wave/0/binary"

# 4. 测试单点查询（应该仍然使用 JSON）
echo "4. 测试单点查询（JSON）"
test_endpoint "单点查询" "$BACKEND_URL/api/weather/point-query?lat=-8.5&lon=152.3&timeIndex=0" "application/json"
echo ""

# 5. 总结
echo "================================"
echo "测试完成"
echo "================================"
echo ""
echo "如果所有测试都通过，说明二进制传输已正确配置。"
echo ""
echo "下一步："
echo "1. 启动前端: cd demo && npm run dev"
echo "2. 打开浏览器: http://localhost:5173"
echo "3. 测试气象图层加载"
echo "4. 检查浏览器控制台日志"
echo ""
