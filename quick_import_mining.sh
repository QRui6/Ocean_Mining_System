#!/bin/bash

# 矿区数据快速导入脚本

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  矿区数据快速导入工具${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查Java后端是否运行
echo -e "${YELLOW}检查Java后端状态...${NC}"
if ! curl -s http://localhost:8081/api/test/status > /dev/null 2>&1; then
    echo -e "${RED}❌ Java后端未运行${NC}"
    echo -e "${YELLOW}请先启动后端：${NC}"
    echo -e "  cd ~/Downloads/backend/java"
    echo -e "  mvn spring-boot:run"
    exit 1
fi
echo -e "${GREEN}✓ Java后端运行正常${NC}"
echo ""

# 执行导入
echo -e "${YELLOW}开始导入矿区数据...${NC}"
response=$(curl -s -X POST http://localhost:8081/api/mining-areas/import)

# 检查结果
if echo "$response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ 矿区数据导入成功！${NC}"
    echo ""
    
    # 解析并显示结果
    count=$(echo "$response" | grep -o '"count":[0-9]*' | grep -o '[0-9]*')
    message=$(echo "$response" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
    
    echo -e "${GREEN}导入统计：${NC}"
    echo -e "  导入数量: ${GREEN}${count}${NC} 个矿区"
    echo -e "  消息: ${message}"
    echo ""
    
    # 验证数据
    echo -e "${YELLOW}验证导入结果...${NC}"
    
    # 获取类别列表
    categories=$(curl -s http://localhost:8081/api/mining-areas/categories)
    echo -e "${GREEN}矿区类别：${NC}"
    echo "$categories" | python3 -m json.tool 2>/dev/null || echo "$categories"
    echo ""
    
    # 获取赞助国列表
    sponsors=$(curl -s http://localhost:8081/api/mining-areas/sponsors)
    echo -e "${GREEN}赞助国家：${NC}"
    echo "$sponsors" | python3 -m json.tool 2>/dev/null | head -20 || echo "$sponsors" | head -20
    echo ""
    
    # 数据库验证
    echo -e "${YELLOW}数据库验证...${NC}"
    : "${DB_PASSWORD:?请先设置 DB_PASSWORD 环境变量}"
    PGPASSWORD="${DB_PASSWORD}" psql \
        -h "${DB_HOST:-127.0.0.1}" \
        -p "${DB_PORT:-5432}" \
        -U "${DB_USER:-postgres}" \
        -d "${DB_NAME:-ship_monitoring}" -c "
    SELECT 
        category as 类别,
        COUNT(*) as 数量
    FROM mining_areas
    GROUP BY category
    ORDER BY 数量 DESC;
    " 2>/dev/null
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  导入完成！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${GREEN}✓ 矿区数据已成功导入到数据库${NC}"
    echo -e "${YELLOW}提示: 现在可以在前端页面查看矿区数据了${NC}"
    echo ""
    
else
    echo -e "${RED}❌ 矿区数据导入失败${NC}"
    echo ""
    echo -e "${RED}错误信息：${NC}"
    echo "$response"
    echo ""
    echo -e "${YELLOW}请检查：${NC}"
    echo "  1. Java后端日志"
    echo "  2. GeoJSON文件是否存在"
    echo "  3. 数据库连接是否正常"
    exit 1
fi
