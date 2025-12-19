# PostgreSQL 安装和配置指南

## 为什么选择PostgreSQL？

相比MySQL，PostgreSQL在本项目中有以下优势：

1. **✅ 更好的JSON支持** - JSONB类型，支持索引和高效查询
2. **✅ PostGIS扩展** - 专业的地理空间数据处理，可以高效判断点是否在多边形内
3. **✅ 更强的数据完整性** - 严格的约束和事务处理
4. **✅ 丰富的数据类型** - ENUM、ARRAY、JSONB等
5. **✅ 强大的查询优化器** - 复杂查询性能更好
6. **✅ 完全开源** - MIT许可证，无商业限制

## 一、安装PostgreSQL

### Ubuntu/Debian

```bash
# 添加PostgreSQL官方仓库
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# 更新并安装
sudo apt update
sudo apt install postgresql-15 postgresql-contrib-15 postgis

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 验证安装
psql --version
```

### macOS

```bash
# 使用Homebrew
brew install postgresql@15 postgis

# 启动服务
brew services start postgresql@15

# 验证安装
psql --version
```

### Windows

1. 下载安装包：https://www.postgresql.org/download/windows/
2. 运行安装程序，选择安装PostgreSQL 15和PostGIS
3. 记住设置的postgres用户密码

### Docker（推荐用于开发）

```bash
# 拉取带PostGIS的镜像
docker pull postgis/postgis:15-3.3

# 运行容器
docker run --name ship-monitoring-db \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=ship_monitoring \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  -d postgis/postgis:15-3.3

# 验证运行
docker ps | grep ship-monitoring-db
```

## 二、初始化数据库

### 方法1：使用psql命令行

```bash
# 登录PostgreSQL
sudo -u postgres psql

# 或者使用密码登录
psql -U postgres -h localhost

# 执行初始化脚本
\i /path/to/backend/database_postgres.sql

# 或者直接从命令行执行
psql -U postgres -f database_postgres.sql
```

### 方法2：使用Docker

```bash
# 复制SQL文件到容器
docker cp database_postgres.sql ship-monitoring-db:/tmp/

# 执行SQL
docker exec -it ship-monitoring-db psql -U postgres -f /tmp/database_postgres.sql
```

### 方法3：使用npm脚本

```bash
cd backend
npm run init-db
```

## 三、配置数据库

### 1. 创建应用用户（推荐）

```sql
-- 登录PostgreSQL
psql -U postgres

-- 创建用户
CREATE USER ship_monitor WITH PASSWORD 'secure_password_here';

-- 授予权限
GRANT CONNECT ON DATABASE ship_monitoring TO ship_monitor;
\c ship_monitoring
GRANT USAGE ON SCHEMA public TO ship_monitor;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ship_monitor;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ship_monitor;

-- 设置默认权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ship_monitor;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT USAGE, SELECT ON SEQUENCES TO ship_monitor;
```

### 2. 配置远程访问（如需要）

编辑 `postgresql.conf`：
```bash
# Ubuntu/Debian
sudo nano /etc/postgresql/15/main/postgresql.conf

# 修改监听地址
listen_addresses = '*'  # 或指定IP
```

编辑 `pg_hba.conf`：
```bash
sudo nano /etc/postgresql/15/main/pg_hba.conf

# 添加允许的IP
host    ship_monitoring    ship_monitor    0.0.0.0/0    md5
```

重启服务：
```bash
sudo systemctl restart postgresql
```

### 3. 性能优化配置

编辑 `postgresql.conf`：
```conf
# 内存设置（根据服务器配置调整）
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
work_mem = 16MB

# 连接设置
max_connections = 100

# 日志设置
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_statement = 'mod'  # 记录修改操作
log_duration = on
log_min_duration_statement = 1000  # 记录超过1秒的查询

# 自动清理
autovacuum = on
```

## 四、验证安装

### 1. 测试连接

```bash
# 使用psql
psql -U postgres -d ship_monitoring -c "SELECT version();"

# 测试PostGIS
psql -U postgres -d ship_monitoring -c "SELECT PostGIS_Version();"
```

### 2. 检查表结构

```sql
-- 登录数据库
psql -U postgres -d ship_monitoring

-- 查看所有表
\dt

-- 查看表结构
\d monitoring_areas
\d area_ships

-- 查看视图
\dv

-- 查看函数
\df
```

### 3. 测试PostGIS功能

```sql
-- 测试点是否在区域内
SELECT is_point_in_area(120.5, 30.5, 1);

-- 查找点所在的区域
SELECT * FROM find_areas_containing_point(120.5, 30.5);
```

## 五、PostGIS使用示例

### 1. 创建区域

```sql
INSERT INTO monitoring_areas (area_id, name, polygon, geometry)
VALUES (
    'test_area_001',
    '东海作业区A',
    '[[120.0, 30.0], [121.0, 30.0], [121.0, 31.0], [120.0, 31.0]]'::JSONB,
    ST_GeomFromText('POLYGON((120.0 30.0, 121.0 30.0, 121.0 31.0, 120.0 31.0, 120.0 30.0))', 4326)
);
```

### 2. 查询区域内的船舶

```sql
-- 查询指定区域内的所有船舶
SELECT s.mmsi, s.ship_name, ST_AsText(s.last_point) as position
FROM area_ships s
JOIN monitoring_areas a ON s.area_id = a.id
WHERE ST_Contains(a.geometry, s.last_point)
AND s.status = 'in_area';
```

### 3. 查询距离某点最近的船舶

```sql
SELECT 
    mmsi, 
    ship_name,
    ST_Distance(
        last_point::geography,
        ST_SetSRID(ST_MakePoint(120.5, 30.5), 4326)::geography
    ) / 1000 as distance_km
FROM area_ships
WHERE status = 'in_area'
ORDER BY distance_km
LIMIT 10;
```

### 4. 查询区域面积

```sql
SELECT 
    name,
    ST_Area(geometry::geography) / 1000000 as area_km2
FROM monitoring_areas;
```

## 六、备份和恢复

### 备份

```bash
# 备份整个数据库
pg_dump -U postgres ship_monitoring > backup_$(date +%Y%m%d).sql

# 备份为自定义格式（推荐，支持并行恢复）
pg_dump -U postgres -Fc ship_monitoring > backup_$(date +%Y%m%d).dump

# 只备份数据（不含结构）
pg_dump -U postgres --data-only ship_monitoring > data_backup.sql

# 只备份结构（不含数据）
pg_dump -U postgres --schema-only ship_monitoring > schema_backup.sql
```

### 恢复

```bash
# 从SQL文件恢复
psql -U postgres ship_monitoring < backup_20251218.sql

# 从自定义格式恢复
pg_restore -U postgres -d ship_monitoring backup_20251218.dump

# 并行恢复（4个并发）
pg_restore -U postgres -d ship_monitoring -j 4 backup_20251218.dump
```

### 自动备份脚本

```bash
#!/bin/bash
# /root/backup_postgres.sh

BACKUP_DIR="/backup/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="ship_monitoring"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
pg_dump -U postgres -Fc $DB_NAME > $BACKUP_DIR/${DB_NAME}_${DATE}.dump

# 删除7天前的备份
find $BACKUP_DIR -name "${DB_NAME}_*.dump" -mtime +7 -delete

echo "Backup completed: ${DB_NAME}_${DATE}.dump"
```

添加到crontab：
```bash
chmod +x /root/backup_postgres.sh
crontab -e
# 添加：0 3 * * * /root/backup_postgres.sh
```

## 七、监控和维护

### 1. 查看数据库大小

```sql
SELECT 
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = 'ship_monitoring';
```

### 2. 查看表大小

```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 3. 查看活跃连接

```sql
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query
FROM pg_stat_activity
WHERE datname = 'ship_monitoring';
```

### 4. 手动清理

```sql
-- 清理历史数据
SELECT cleanup_old_data(30);

-- 手动VACUUM
VACUUM ANALYZE;

-- 重建索引
REINDEX DATABASE ship_monitoring;
```

## 八、故障排查

### 1. 连接失败

```bash
# 检查服务状态
sudo systemctl status postgresql

# 查看日志
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# 测试端口
netstat -tulpn | grep 5432
```

### 2. 性能问题

```sql
-- 查看慢查询
SELECT 
    query,
    calls,
    total_time,
    mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- 查看索引使用情况
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan;
```

### 3. 空间不足

```bash
# 查看磁盘使用
df -h

# 清理日志
sudo find /var/log/postgresql -name "*.log" -mtime +7 -delete

# 清理旧的WAL文件
sudo -u postgres pg_archivecleanup /var/lib/postgresql/15/main/pg_wal 000000010000000000000010
```

## 九、安全建议

1. **修改默认密码**：安装后立即修改postgres用户密码
2. **使用专用用户**：不要使用postgres超级用户运行应用
3. **限制远程访问**：只允许必要的IP访问
4. **启用SSL**：生产环境使用SSL加密连接
5. **定期备份**：设置自动备份任务
6. **监控日志**：定期检查错误日志

## 十、常用命令速查

```bash
# 启动/停止/重启
sudo systemctl start postgresql
sudo systemctl stop postgresql
sudo systemctl restart postgresql

# 登录
psql -U postgres
psql -U postgres -d ship_monitoring

# 常用psql命令
\l          # 列出所有数据库
\c dbname   # 切换数据库
\dt         # 列出所有表
\d table    # 查看表结构
\dv         # 列出所有视图
\df         # 列出所有函数
\du         # 列出所有用户
\q          # 退出
```

## 参考资源

- PostgreSQL官方文档：https://www.postgresql.org/docs/
- PostGIS文档：https://postgis.net/documentation/
- pg模块文档：https://node-postgres.com/
