# 船舶区域监控系统 - 后端服务

## 技术栈

- **Node.js + Express** - 后端框架
- **PostgreSQL + PostGIS** - 数据库（支持地理空间查询）
- **WebSocket** - 实时通信
- **船讯网API** - 船舶数据源

### 为什么使用PostgreSQL？

相比MySQL，PostgreSQL在本项目中有明显优势：

1. **✅ PostGIS扩展** - 专业的地理空间数据处理
   - 高效判断点是否在多边形区域内
   - 支持空间索引（GIST）
   - 内置距离计算、面积计算等函数

2. **✅ 更好的JSON支持** - JSONB类型
   - 支持索引，查询性能更好
   - 丰富的JSON操作符和函数

3. **✅ 强大的数据类型** - ENUM、ARRAY、JSONB等
   - 更严格的数据约束
   - 更好的数据完整性

4. **✅ 完全开源** - MIT许可证，无商业限制

## 功能概述

这是一个完整的船舶区域监控后端服务，实现以下功能：

1. ✅ **区域管理**：创建、查询、删除监控区域
2. ✅ **Webhook接收**：接收船讯网推送的船舶进出事件
3. ✅ **实时推送**：通过WebSocket向前端推送实时数据
4. ✅ **气象查询**：自动查询船舶位置气象数据
5. ✅ **风险评估**：根据阈值自动评估风险并预警
6. ✅ **数据持久化**：MySQL数据库存储所有数据
7. ✅ **定时更新**：定时更新区域内船舶状态

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑.env文件，填入你的配置
```

### 3. 安装PostgreSQL

详细安装指南请参考 [POSTGRES_SETUP.md](./POSTGRES_SETUP.md)

快速安装（Ubuntu）：
```bash
sudo apt install postgresql-15 postgis
```

### 4. 初始化数据库

```bash
# 创建数据库并执行初始化脚本
psql -U postgres -f database_postgres.sql

# 或使用npm脚本
npm run init-db
```

### 5. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

服务启动后：
- HTTP API: http://localhost:3000
- WebSocket: ws://localhost:8080

## API文档

### 1. 创建监控区域

**POST** `/api/areas`

请求体：
```json
{
  "name": "东海作业区A",
  "polygon": [
    [120.0, 30.0],
    [121.0, 30.0],
    [121.0, 31.0],
    [120.0, 31.0]
  ],
  "thresholds": {
    "windSpeed": 15,
    "waveHeight": 3
  }
}
```

响应：
```json
{
  "success": true,
  "data": {
    "id": 1,
    "areaId": "shipxy_area_123",
    "name": "东海作业区A",
    "polygon": [...],
    "thresholds": {...},
    "createdAt": "2025-12-18T10:30:00Z"
  }
}
```

### 2. 获取区域列表

**GET** `/api/areas`

响应：
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "东海作业区A",
      "shipCount": 5,
      "warningCount": 2,
      ...
    }
  ]
}
```

### 3. 获取区域内船舶

**GET** `/api/areas/:id/ships`

响应：
```json
{
  "success": true,
  "data": [
    {
      "mmsi": 413961925,
      "shipName": "皖鸿运369",
      "enterTime": "2025-12-18T10:30:00Z",
      "lastPosition": {"lat": 31.7790, "lng": 120.4595},
      "lastWeather": {...},
      "riskLevel": "low"
    }
  ]
}
```

### 4. 删除监控区域

**DELETE** `/api/areas/:id`

响应：
```json
{
  "success": true,
  "message": "区域已删除"
}
```

### 5. Webhook接收端点

**POST** `/webhook/area`

船讯网会推送以下格式的数据：
```json
{
  "area_id": "shipxy_area_123",
  "event_type": "enter",
  "mmsi": 413961925,
  "ship_name": "皖鸿运369",
  "lat": 31.7790,
  "lng": 120.4595,
  "timestamp": "2025-12-18T10:30:00Z"
}
```

## WebSocket消息格式

### 客户端 → 服务器

订阅区域：
```json
{
  "action": "subscribe",
  "areaId": "1"
}
```

取消订阅：
```json
{
  "action": "unsubscribe",
  "areaId": "1"
}
```

### 服务器 → 客户端

船舶进入：
```json
{
  "type": "ship_enter",
  "payload": {
    "areaId": 1,
    "ship": {...},
    "weather": {...},
    "risk": {...}
  }
}
```

船舶离开：
```json
{
  "type": "ship_leave",
  "payload": {
    "areaId": 1,
    "mmsi": 413961925
  }
}
```

预警：
```json
{
  "type": "warning",
  "payload": {
    "areaId": 1,
    "mmsi": 413961925,
    "message": "风速超过阈值",
    "severity": "high"
  }
}
```

## 数据库结构

### monitoring_areas - 监控区域表
- id: 主键
- area_id: 船讯网区域ID
- name: 区域名称
- polygon: 多边形坐标（JSONB）
- geometry: PostGIS几何对象（用于空间查询）
- threshold_wind_speed: 风速阈值
- threshold_wave_height: 浪高阈值

### area_ships - 区域内船舶表
- id: 主键
- area_id: 区域ID
- mmsi: 船舶MMSI
- ship_name: 船舶名称
- enter_time: 进入时间
- leave_time: 离开时间
- status: 状态（ENUM: in_area/left/warning）
- last_position: 最后位置（JSONB）
- last_point: PostGIS点对象（用于空间查询）
- last_weather: 最新气象（JSONB）
- risk_level: 风险等级（ENUM: safe/low/medium/high）

### warnings - 预警记录表
- id: 主键
- area_id: 区域ID
- mmsi: 船舶MMSI
- warning_type: 预警类型
- severity: 严重程度（ENUM: low/medium/high/critical）
- message: 预警消息
- weather_data: 气象数据（JSONB）
- is_resolved: 是否已解决

### event_logs - 事件日志表
- id: 主键
- area_id: 区域ID
- mmsi: 船舶MMSI
- event_type: 事件类型
- event_data: 事件数据（JSONB）

### PostGIS空间函数
- `is_point_in_area(lng, lat, area_id)` - 判断点是否在区域内
- `find_areas_containing_point(lng, lat)` - 查找点所在的所有区域
- `get_area_ship_statistics(area_id)` - 获取区域船舶统计
- `cleanup_old_data(days)` - 清理历史数据

## 核心流程

### 1. 创建区域流程
```
前端绘制区域 
  → 调用 POST /api/areas 
  → 后端调用船讯网AddArea API 
  → 保存到数据库 
  → 推送到前端
```

### 2. 船舶进入流程
```
船舶进入区域 
  → 船讯网推送到Webhook 
  → 后端接收事件 
  → 调用GetSingleShip获取详情 
  → 调用GetWeatherByPoint获取气象 
  → 风险评估 
  → 保存到数据库 
  → 推送到前端
```

### 3. 定时更新流程
```
定时器触发（每10分钟） 
  → 查询所有区域内船舶 
  → 更新船舶位置和气象 
  → 重新评估风险 
  → 推送变化到前端
```

## 配置说明

### 环境变量

- `PORT`: HTTP服务端口（默认3000）
- `WS_PORT`: WebSocket端口（默认8080）
- `PUBLIC_URL`: 公网访问地址
- `DB_HOST`: PostgreSQL主机（默认localhost）
- `DB_PORT`: PostgreSQL端口（默认5432）
- `DB_USER`: 数据库用户（默认postgres）
- `DB_PASSWORD`: 数据库密码
- `DB_NAME`: 数据库名称（默认ship_monitoring）
- `SHIPXY_API_KEY`: 船讯网API密钥
- `UPDATE_INTERVAL`: 更新间隔（秒）

### 阈值配置

在创建区域时可以自定义阈值：
- `windSpeed`: 风速阈值（m/s），默认15
- `waveHeight`: 浪高阈值（m），默认3

## 测试

### 测试Webhook

```bash
curl -X POST http://localhost:3000/webhook/area \
  -H "Content-Type: application/json" \
  -d '{
    "area_id": "test",
    "event_type": "enter",
    "mmsi": 413961925,
    "ship_name": "TEST",
    "lat": 31.7790,
    "lng": 120.4595,
    "timestamp": "2025-12-18T10:30:00Z"
  }'
```

### 测试WebSocket

```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  console.log('连接成功');
};

ws.onmessage = (event) => {
  console.log('收到消息:', JSON.parse(event.data));
};
```

## 部署

详细部署文档请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 故障排查

### 1. 数据库连接失败
- 检查PostgreSQL是否启动：`sudo systemctl status postgresql`
- 检查.env中的数据库配置
- 检查数据库用户权限
- 测试连接：`psql -U postgres -d ship_monitoring`

### 2. Webhook接收不到数据
- 检查服务器是否有公网IP
- 检查防火墙是否开放端口
- 检查船讯网配置的Webhook地址

### 3. WebSocket连接失败
- 检查WS_PORT是否被占用
- 检查防火墙是否开放端口
- 检查前端WebSocket地址配置

## 许可证

MIT
