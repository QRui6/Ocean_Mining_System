#!/bin/bash

echo "========================================="
echo "测试矿区气象监测API"
echo "========================================="

API_BASE="http://localhost:8081/api"

echo ""
echo "1. 获取所有监测列表（应该为空）"
curl -s -X GET "${API_BASE}/mining-monitoring" | jq '.'

echo ""
echo ""
echo "2. 添加一个矿区到监测列表（使用矿区ID=1）"
curl -s -X POST "${API_BASE}/mining-monitoring" \
  -H "Content-Type: application/json" \
  -d '{
    "miningAreaId": 1,
    "windSpeedThreshold": 15.0,
    "waveHeightThreshold": 3.0,
    "currentSpeedThreshold": 1.0
  }' | jq '.'

echo ""
echo ""
echo "3. 再次获取监测列表（应该有1条记录）"
curl -s -X GET "${API_BASE}/mining-monitoring" | jq '.'

echo ""
echo ""
echo "4. 尝试重复添加同一个矿区（应该失败）"
curl -s -X POST "${API_BASE}/mining-monitoring" \
  -H "Content-Type: application/json" \
  -d '{
    "miningAreaId": 1,
    "windSpeedThreshold": 20.0,
    "waveHeightThreshold": 4.0,
    "currentSpeedThreshold": 1.5
  }' | jq '.'

echo ""
echo ""
echo "========================================="
echo "测试完成！"
echo "========================================="
