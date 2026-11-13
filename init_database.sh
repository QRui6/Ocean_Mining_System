#!/bin/bash

# 数据库初始化脚本
# 用于在远程PostgreSQL数据库上创建所有表结构

# 数据库连接信息
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-ship_monitoring}"
: "${DB_PASSWORD:?请先设置 DB_PASSWORD 环境变量}"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  深海采矿气象监测系统 - 数据库初始化${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "数据库主机: ${YELLOW}${DB_HOST}${NC}"
echo -e "数据库端口: ${YELLOW}${DB_PORT}${NC}"
echo -e "数据库名称: ${YELLOW}${DB_NAME}${NC}"
echo -e "数据库用户: ${YELLOW}${DB_USER}${NC}"
echo ""

# 检查psql命令是否存在
if ! command -v psql &> /dev/null; then
    echo -e "${RED}错误: 未找到 psql 命令，请先安装 PostgreSQL 客户端${NC}"
    exit 1
fi

# 检查SQL文件是否存在
if [ ! -f "database_postgres.sql" ]; then
    echo -e "${RED}错误: 未找到 database_postgres.sql 文件${NC}"
    echo -e "${YELLOW}请确保在 backend 目录下运行此脚本${NC}"
    exit 1
fi

echo -e "${YELLOW}提示: 请输入数据库密码${NC}"
echo ""

# 步骤1: 创建主数据库结构
echo -e "${GREEN}[1/5] 创建主数据库结构...${NC}"
PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -f database_postgres.sql
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 主数据库结构创建成功${NC}"
else
    echo -e "${RED}✗ 主数据库结构创建失败${NC}"
    exit 1
fi
echo ""

# 步骤2: 创建气象数据表
echo -e "${GREEN}[2/5] 创建气象数据表...${NC}"
PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f database_weather_data.sql
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 气象数据表创建成功${NC}"
else
    echo -e "${RED}✗ 气象数据表创建失败${NC}"
    exit 1
fi
echo ""

# 步骤3: 创建海洋矿区表
echo -e "${GREEN}[3/5] 创建海洋矿区表...${NC}"
PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f database_mining_areas.sql
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 海洋矿区表创建成功${NC}"
else
    echo -e "${RED}✗ 海洋矿区表创建失败${NC}"
    exit 1
fi
echo ""

# 步骤4: 添加索引优化（如果文件存在）
if [ -f "add_indexes.sql" ]; then
    echo -e "${GREEN}[4/5] 添加额外索引...${NC}"
    PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f add_indexes.sql
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 索引添加成功${NC}"
    else
        echo -e "${YELLOW}⚠ 索引添加失败（可能已存在）${NC}"
    fi
else
    echo -e "${YELLOW}[4/5] 跳过索引优化（文件不存在）${NC}"
fi
echo ""

# 步骤5: 数据库优化（如果文件存在）
if [ -f "optimize_database.sql" ]; then
    echo -e "${GREEN}[5/5] 执行数据库优化...${NC}"
    PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f optimize_database.sql
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 数据库优化成功${NC}"
    else
        echo -e "${YELLOW}⚠ 数据库优化失败${NC}"
    fi
else
    echo -e "${YELLOW}[5/5] 跳过数据库优化（文件不存在）${NC}"
fi
echo ""

# 验证表是否创建成功
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  验证数据库表结构${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -c "
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  数据库初始化完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${GREEN}✓ 所有表已成功创建${NC}"
echo -e "${YELLOW}提示: 现在可以启动Java后端应用了${NC}"
echo ""
