#!/bin/bash

echo "========================================="
echo "验证矿区气象监测持久化功能"
echo "========================================="

API_BASE="http://localhost:8081/api"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo -e "${YELLOW}步骤1: 清空现有监测列表${NC}"
echo "获取当前列表..."
CURRENT_LIST=$(curl -s -X GET "${API_BASE}/mining-monitoring")
echo "$CURRENT_LIST"

# 提取所有ID并删除
IDS=$(echo "$CURRENT_LIST" | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
for id in $IDS; do
    echo "删除监测记录 ID: $id"
    curl -s -X DELETE "${API_BASE}/mining-monitoring/$id"
done

echo ""
echo -e "${YELLOW}步骤2: 添加3个矿区到监测列表${NC}"

# 添加第一个矿区
echo "添加矿区 21649 (APEI-10)..."
RESULT1=$(curl -s -X POST "${API_BASE}/mining-monitoring" \
  -H "Content-Type: application/json" \
  -d '{
    "miningAreaId": 21649,
    "windSpeedThreshold": 15.0,
    "waveHeightThreshold": 3.0,
    "currentSpeedThreshold": 1.0
  }')

if echo "$RESULT1" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ 添加成功${NC}"
else
    echo -e "${RED}✗ 添加失败${NC}"
    echo "$RESULT1"
fi

# 添加第二个矿区
echo "添加矿区 21650 (APEI-11)..."
RESULT2=$(curl -s -X POST "${API_BASE}/mining-monitoring" \
  -H "Content-Type: application/json" \
  -d '{
    "miningAreaId": 21650,
    "windSpeedThreshold": 20.0,
    "waveHeightThreshold": 4.0,
    "currentSpeedThreshold": 1.5
  }')

if echo "$RESULT2" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ 添加成功${NC}"
else
    echo -e "${RED}✗ 添加失败${NC}"
    echo "$RESULT2"
fi

# 添加第三个矿区
echo "添加矿区 21651 (APEI-13)..."
RESULT3=$(curl -s -X POST "${API_BASE}/mining-monitoring" \
  -H "Content-Type: application/json" \
  -d '{
    "miningAreaId": 21651,
    "windSpeedThreshold": 18.0,
    "waveHeightThreshold": 3.5,
    "currentSpeedThreshold": 1.2
  }')

if echo "$RESULT3" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ 添加成功${NC}"
else
    echo -e "${RED}✗ 添加失败${NC}"
    echo "$RESULT3"
fi

echo ""
echo -e "${YELLOW}步骤3: 验证监测列表${NC}"
LIST=$(curl -s -X GET "${API_BASE}/mining-monitoring")
COUNT=$(echo "$LIST" | grep -o '"miningAreaId"' | wc -l)

echo "当前监测列表中有 $COUNT 个矿区"

if [ "$COUNT" -eq 3 ]; then
    echo -e "${GREEN}✓ 数量正确（3个）${NC}"
else
    echo -e "${RED}✗ 数量不正确（期望3个，实际${COUNT}个）${NC}"
fi

echo ""
echo "监测列表详情："
echo "$LIST" | python3 -m json.tool 2>/dev/null || echo "$LIST"

echo ""
echo -e "${YELLOW}步骤4: 测试重复添加（应该失败）${NC}"
DUPLICATE=$(curl -s -X POST "${API_BASE}/mining-monitoring" \
  -H "Content-Type: application/json" \
  -d '{
    "miningAreaId": 21649,
    "windSpeedThreshold": 25.0,
    "waveHeightThreshold": 5.0,
    "currentSpeedThreshold": 2.0
  }')

if echo "$DUPLICATE" | grep -q '"success":false'; then
    echo -e "${GREEN}✓ 正确拒绝重复添加${NC}"
else
    echo -e "${RED}✗ 应该拒绝重复添加${NC}"
fi

echo ""
echo -e "${YELLOW}步骤5: 测试删除功能${NC}"
# 获取第一个监测记录的ID
FIRST_ID=$(echo "$LIST" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo "删除监测记录 ID: $FIRST_ID"

DELETE_RESULT=$(curl -s -X DELETE "${API_BASE}/mining-monitoring/$FIRST_ID")
if echo "$DELETE_RESULT" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ 删除成功${NC}"
else
    echo -e "${RED}✗ 删除失败${NC}"
fi

# 验证删除后的数量
AFTER_DELETE=$(curl -s -X GET "${API_BASE}/mining-monitoring")
COUNT_AFTER=$(echo "$AFTER_DELETE" | grep -o '"miningAreaId"' | wc -l)
echo "删除后剩余 $COUNT_AFTER 个矿区"

if [ "$COUNT_AFTER" -eq 2 ]; then
    echo -e "${GREEN}✓ 删除验证成功${NC}"
else
    echo -e "${RED}✗ 删除验证失败${NC}"
fi

echo ""
echo "========================================="
echo -e "${GREEN}验证完成！${NC}"
echo "========================================="
echo ""
echo "现在可以："
echo "1. 打开浏览器访问 http://localhost:5173"
echo "2. 点击右侧'矿区气象监测'按钮"
echo "3. 查看监测列表中是否有2个矿区"
echo "4. 刷新页面后再次查看，数据应该依然存在"
echo ""
