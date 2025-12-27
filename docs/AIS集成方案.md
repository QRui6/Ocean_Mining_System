# 🚢 AIS 船舶追踪系统集成方案

## 一、AIS 系统概述

### 1.1 什么是 AIS？

**AIS (Automatic Identification System)** - 船舶自动识别系统

**核心功能**：
- 📍 实时船舶位置追踪
- 🚢 船舶信息（名称、类型、尺寸、航速、航向）
- 🎯 航线预测
- ⚠️ 碰撞预警
- 📊 历史轨迹回放

**数据更新频率**：
- 航行中：2-10 秒/次
- 锚泊中：3 分钟/次
- 覆盖范围：全球海域

### 1.2 为什么深海采矿系统需要 AIS？

**关键原因**：
1. ✅ **安全监控**：监控矿区附近船舶，避免碰撞
2. ✅ **作业协调**：追踪采矿船、补给船位置
3. ✅ **航线规划**：避开繁忙航道
4. ✅ **应急响应**：快速定位救援船只
5. ✅ **合规要求**：海事监管要求

**典型场景**：
```
深海采矿作业区
├─ 采矿船（实时位置）
├─ 补给船（航线追踪）
├─ 科考船（作业监控）
├─ 过往商船（安全距离）
└─ 救援船（应急待命）
```

---

## 二、AIS 数据格式

### 2.1 AIS 消息类型

| 类型 | 名称 | 内容 | 频率 |
|------|------|------|------|
| Type 1/2/3 | 位置报告 | 位置、航速、航向 | 2-10秒 |
| Type 5 | 静态信息 | 船名、呼号、尺寸 | 6分钟 |
| Type 18 | 简化位置 | 小型船舶位置 | 30秒 |
| Type 24 | 静态数据 | 辅助船舶信息 | 6分钟 |

### 2.2 数据格式示例

#### JSON 格式（推荐）
```json
{
  "mmsi": 413123456,           // 船舶唯一标识
  "name": "MINING VESSEL 1",   // 船名
  "type": 31,                  // 船舶类型（31=拖船）
  "lat": 10.5234,              // 纬度
  "lon": -140.2341,            // 经度
  "speed": 8.5,                // 航速（节）
  "course": 245.3,             // 航向（度）
  "heading": 247,              // 船首向（度）
  "timestamp": 1704067200,     // 时间戳
  "status": 0,                 // 航行状态
  "destination": "MINING AREA", // 目的地
  "eta": "01-15 14:30",        // 预计到达时间
  "length": 120,               // 船长（米）
  "width": 25,                 // 船宽（米）
  "draught": 8.5               // 吃水（米）
}
```

#### NMEA 格式（原始）
```
!AIVDM,1,1,,A,133m@ogP00PD;88MD5MTDww@2D7k,0*46
```
需要解码器转换为 JSON

---

## 三、AIS 数据源方案

### 3.1 数据源对比

| 数据源 | 费用 | 覆盖 | 延迟 | 推荐度 |
|--------|------|------|------|--------|
| **MarineTraffic API** | $$$$ | 全球 | 实时 | ⭐⭐⭐⭐⭐ |
| **VesselFinder API** | $$$ | 全球 | 实时 | ⭐⭐⭐⭐ |
| **AISHub** | 免费/$ | 全球 | 1-5分钟 | ⭐⭐⭐ |
| **AIS Stream** | 免费 | 部分 | 5-10分钟 | ⭐⭐ |
| **自建接收站** | 硬件成本 | 本地 | 实时 | ⭐⭐⭐⭐ |

### 3.2 推荐方案：MarineTraffic API

**官网**：https://www.marinetraffic.com/en/ais-api-services

**定价**（2024）：
- 基础版：$99/月（1000 次/天）
- 专业版：$499/月（10000 次/天）
- 企业版：定制（无限制）

**优点**：
- ✅ 全球覆盖最广
- ✅ 数据最准确
- ✅ API 文档完善
- ✅ 支持历史数据
- ✅ 支持 WebSocket 实时推送

**API 示例**：
```javascript
// 获取区域内船舶
GET https://services.marinetraffic.com/api/exportvessels/{API_KEY}/
    protocol:json/
    minlat:10/maxlat:20/
    minlon:-150/maxlon:-130/
    timespan:10

// 获取单船信息
GET https://services.marinetraffic.com/api/singlevesselextended/{API_KEY}/
    mmsi:413123456/
    protocol:json
```

### 3.3 备选方案：AISHub（免费）

**官网**：http://www.aishub.net/

**定价**：
- 免费版：60 次/分钟
- 付费版：$10/月（无限制）

**优点**：
- ✅ 免费可用
- ✅ 适合测试和开发
- ✅ 简单易用

**缺点**：
- ❌ 数据延迟较大（1-5 分钟）
- ❌ 覆盖不完整
- ❌ 无历史数据

---

## 四、技术架构设计

### 4.1 整体架构

```
┌─────────────────────────────────────────────┐
│         前端 (Vue + Cesium)                  │
│  - 3D 地球显示                               │
│  - 船舶实时追踪                              │
│  - 矿区 + 气象 + AIS 叠加                    │
└─────────────────┬───────────────────────────┘
                  │ WebSocket / HTTP
┌─────────────────▼───────────────────────────┐
│           后端 API 服务                      │
│  - GET /api/vessels (区域船舶)              │
│  - GET /api/vessel/:mmsi (单船详情)         │
│  - WS /ws/vessels (实时推送)                │
│  - GET /api/vessel/:mmsi/track (历史轨迹)   │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│           数据处理层                         │
│  - AIS 数据缓存（Redis）                    │
│  - 船舶状态管理                              │
│  - 碰撞预警计算                              │
│  - 轨迹数据存储（PostgreSQL + PostGIS）    │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│           定时任务                           │
│  - 每 10 秒获取区域船舶数据                 │
│  - 每 1 分钟更新船舶静态信息                │
│  - 每 1 小时清理过期数据                    │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│           AIS 数据源                         │
│  - MarineTraffic API                        │
│  - VesselFinder API (备用)                  │
└─────────────────────────────────────────────┘
```

### 4.2 前端实现（Cesium）

#### 船舶实体显示
```javascript
// 创建船舶实体
const vessel = viewer.entities.add({
  id: `vessel-${mmsi}`,
  position: Cesium.Cartesian3.fromDegrees(lon, lat),
  
  // 船舶模型（3D）
  model: {
    uri: '/models/ship.glb',
    scale: 50,
    minimumPixelSize: 32,
    maximumScale: 200
  },
  
  // 或使用 Billboard（2D 图标）
  billboard: {
    image: '/icons/ship.png',
    width: 32,
    height: 32,
    rotation: Cesium.Math.toRadians(heading),
    verticalOrigin: Cesium.VerticalOrigin.CENTER
  },
  
  // 标签
  label: {
    text: vesselName,
    font: '14px sans-serif',
    fillColor: Cesium.Color.WHITE,
    outlineColor: Cesium.Color.BLACK,
    outlineWidth: 2,
    pixelOffset: new Cesium.Cartesian2(0, -40)
  },
  
  // 航迹线
  path: {
    resolution: 1,
    material: new Cesium.PolylineGlowMaterialProperty({
      glowPower: 0.1,
      color: Cesium.Color.CYAN
    }),
    width: 3,
    leadTime: 0,
    trailTime: 3600  // 显示 1 小时轨迹
  },
  
  // 自定义属性
  properties: {
    mmsi: mmsi,
    name: vesselName,
    type: vesselType,
    speed: speed,
    course: course
  }
});
```

#### 实时更新
```javascript
// WebSocket 连接
const ws = new WebSocket('ws://your-api.com/ws/vessels');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  data.vessels.forEach(vessel => {
    const entity = viewer.entities.getById(`vessel-${vessel.mmsi}`);
    
    if (entity) {
      // 更新位置（平滑过渡）
      entity.position = new Cesium.SampledPositionProperty();
      entity.position.addSample(
        Cesium.JulianDate.now(),
        Cesium.Cartesian3.fromDegrees(vessel.lon, vessel.lat)
      );
      
      // 更新航向
      entity.billboard.rotation = Cesium.Math.toRadians(vessel.heading);
      
      // 更新属性
      entity.properties.speed = vessel.speed;
      entity.properties.course = vessel.course;
    } else {
      // 创建新船舶
      createVesselEntity(vessel);
    }
  });
};
```

#### 船舶筛选和聚类
```javascript
// 根据船舶类型筛选
function filterVesselsByType(types) {
  viewer.entities.values.forEach(entity => {
    if (entity.id.startsWith('vessel-')) {
      const vesselType = entity.properties.type.getValue();
      entity.show = types.includes(vesselType);
    }
  });
}

// 船舶聚类（远距离时）
function clusterVessels() {
  const cameraHeight = viewer.camera.positionCartographic.height;
  
  if (cameraHeight > 5000000) {  // 5000 km 以上
    // 启用聚类
    enableClustering();
  } else {
    // 显示单个船舶
    disableClustering();
  }
}
```

---

## 五、后端实现方案

### 5.1 技术栈选择

**推荐：Node.js + Express**
```javascript
// 技术栈
- Express.js (Web 框架)
- Socket.io (WebSocket)
- Redis (缓存)
- PostgreSQL + PostGIS (轨迹存储)
- node-cron (定时任务)
- axios (HTTP 请求)
```

### 5.2 核心代码示例

#### API 路由
```javascript
// routes/vessels.js
const express = require('express');
const router = express.Router();
const VesselService = require('../services/vesselService');

// 获取区域内船舶
router.get('/vessels', async (req, res) => {
  const { minLat, maxLat, minLon, maxLon } = req.query;
  
  try {
    const vessels = await VesselService.getVesselsInArea({
      minLat, maxLat, minLon, maxLon
    });
    
    res.json({
      success: true,
      count: vessels.length,
      data: vessels
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取单船详情
router.get('/vessel/:mmsi', async (req, res) => {
  const { mmsi } = req.params;
  
  try {
    const vessel = await VesselService.getVesselByMMSI(mmsi);
    res.json({ success: true, data: vessel });
  } catch (error) {
    res.status(404).json({ success: false, error: 'Vessel not found' });
  }
});

// 获取历史轨迹
router.get('/vessel/:mmsi/track', async (req, res) => {
  const { mmsi } = req.params;
  const { startTime, endTime } = req.query;
  
  try {
    const track = await VesselService.getVesselTrack(mmsi, startTime, endTime);
    res.json({ success: true, data: track });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

#### 数据服务
```javascript
// services/vesselService.js
const axios = require('axios');
const redis = require('../config/redis');
const db = require('../config/database');

class VesselService {
  // 从 MarineTraffic 获取数据
  static async fetchFromMarineTraffic(bounds) {
    const { minLat, maxLat, minLon, maxLon } = bounds;
    const API_KEY = process.env.MARINETRAFFIC_API_KEY;
    
    const url = `https://services.marinetraffic.com/api/exportvessels/${API_KEY}/` +
                `protocol:json/minlat:${minLat}/maxlat:${maxLat}/` +
                `minlon:${minLon}/maxlon:${maxLon}/timespan:10`;
    
    const response = await axios.get(url);
    return response.data;
  }
  
  // 获取区域内船舶（带缓存）
  static async getVesselsInArea(bounds) {
    const cacheKey = `vessels:${JSON.stringify(bounds)}`;
    
    // 先查缓存
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // 从 API 获取
    const vessels = await this.fetchFromMarineTraffic(bounds);
    
    // 缓存 30 秒
    await redis.setex(cacheKey, 30, JSON.stringify(vessels));
    
    // 存储到数据库
    await this.saveVesselPositions(vessels);
    
    return vessels;
  }
  
  // 保存船舶位置到数据库
  static async saveVesselPositions(vessels) {
    const query = `
      INSERT INTO vessel_positions (mmsi, lat, lon, speed, course, heading, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (mmsi, timestamp) DO UPDATE
      SET lat = $2, lon = $3, speed = $4, course = $5, heading = $6
    `;
    
    for (const vessel of vessels) {
      await db.query(query, [
        vessel.mmsi,
        vessel.lat,
        vessel.lon,
        vessel.speed,
        vessel.course,
        vessel.heading,
        vessel.timestamp
      ]);
    }
  }
  
  // 获取历史轨迹
  static async getVesselTrack(mmsi, startTime, endTime) {
    const query = `
      SELECT lat, lon, speed, course, timestamp
      FROM vessel_positions
      WHERE mmsi = $1 AND timestamp BETWEEN $2 AND $3
      ORDER BY timestamp ASC
    `;
    
    const result = await db.query(query, [mmsi, startTime, endTime]);
    return result.rows;
  }
}

module.exports = VesselService;
```

#### WebSocket 实时推送
```javascript
// websocket/vesselSocket.js
const socketIO = require('socket.io');
const VesselService = require('../services/vesselService');

function setupVesselSocket(server) {
  const io = socketIO(server, {
    cors: { origin: '*' }
  });
  
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // 客户端订阅区域
    socket.on('subscribe', async (bounds) => {
      console.log('Subscribe to area:', bounds);
      
      // 加入房间
      socket.join(`area:${JSON.stringify(bounds)}`);
      
      // 立即发送当前数据
      const vessels = await VesselService.getVesselsInArea(bounds);
      socket.emit('vessels', { vessels });
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
  
  // 定时推送更新（每 10 秒）
  setInterval(async () => {
    // 获取所有订阅的区域
    const rooms = io.sockets.adapter.rooms;
    
    for (const [room, sockets] of rooms) {
      if (room.startsWith('area:')) {
        const bounds = JSON.parse(room.replace('area:', ''));
        const vessels = await VesselService.getVesselsInArea(bounds);
        
        io.to(room).emit('vessels', { vessels });
      }
    }
  }, 10000);
  
  return io;
}

module.exports = setupVesselSocket;
```

---

## 六、AIS + 气象 + 矿区 整合方案

### 6.1 数据叠加显示

```javascript
// 同时显示三种数据
class IntegratedSystem {
  constructor(viewer) {
    this.viewer = viewer;
    this.miningAreas = [];    // 矿区
    this.vessels = [];         // 船舶
    this.weatherParticles = null;  // 气象粒子
  }
  
  // 加载矿区数据
  async loadMiningAreas() {
    const dataSource = await Cesium.GeoJsonDataSource.load('/data/mining_areas.geojson');
    this.viewer.dataSources.add(dataSource);
    this.miningAreas = dataSource.entities.values;
  }
  
  // 加载船舶数据
  async loadVessels() {
    const response = await fetch('/api/vessels?minLat=0&maxLat=30&minLon=-180&maxLon=-120');
    const data = await response.json();
    
    data.data.forEach(vessel => {
      this.createVesselEntity(vessel);
    });
  }
  
  // 加载气象数据
  async loadWeather() {
    this.weatherParticles = new WeatherParticleSystem(this.viewer);
    await this.weatherParticles.start();
  }
  
  // 碰撞检测
  checkCollisions() {
    this.vessels.forEach(vessel => {
      this.miningAreas.forEach(area => {
        if (this.isVesselInArea(vessel, area)) {
          this.showWarning(`船舶 ${vessel.name} 进入矿区 ${area.name}`);
        }
      });
    });
  }
}
```

### 6.2 统一控制面板

```vue
<template>
  <div class="control-panel">
    <!-- 图层控制 -->
    <div class="layer-control">
      <h3>图层显示</h3>
      <label><input type="checkbox" v-model="layers.miningAreas"> 矿区</label>
      <label><input type="checkbox" v-model="layers.vessels"> 船舶</label>
      <label><input type="checkbox" v-model="layers.weather"> 气象</label>
    </div>
    
    <!-- 船舶筛选 -->
    <div class="vessel-filter">
      <h3>船舶类型</h3>
      <label><input type="checkbox" v-model="vesselTypes" value="cargo"> 货船</label>
      <label><input type="checkbox" v-model="vesselTypes" value="tanker"> 油轮</label>
      <label><input type="checkbox" v-model="vesselTypes" value="mining"> 采矿船</label>
    </div>
    
    <!-- 预警设置 -->
    <div class="alert-settings">
      <h3>预警距离</h3>
      <input type="range" v-model="alertDistance" min="1" max="50"> {{ alertDistance }} km
    </div>
  </div>
</template>
```

---

## 七、成本和工作量评估

### 7.1 数据源成本

| 项目 | 方案 | 月成本 |
|------|------|--------|
| AIS 数据 | MarineTraffic 基础版 | $99 (¥700) |
| 气象数据 | OpenWeatherMap 免费版 | ¥0 |
| 服务器 | 阿里云 2核4G | ¥100 |
| 数据库 | PostgreSQL (自建) | ¥0 |
| **总计** | | **¥800/月** |

### 7.2 开发工作量

| 阶段 | 内容 | 时间 |
|------|------|------|
| **阶段 1** | 后端 API 开发 | 1 周 |
| **阶段 2** | 前端 AIS 显示 | 1 周 |
| **阶段 3** | WebSocket 实时推送 | 3 天 |
| **阶段 4** | 数据库和缓存 | 3 天 |
| **阶段 5** | AIS + 气象 + 矿区整合 | 1 周 |
| **阶段 6** | 测试和优化 | 1 周 |
| **总计** | | **5-6 周** |

---

## 八、结论和建议

### 8.1 关键发现

**AIS 集成后，你的系统变成了**：
```
深海采矿综合监控平台
├─ 矿区管理（已有）
├─ 气象监测（规划中）
└─ 船舶追踪（新需求）✨
```

这是一个**专业级的海洋监控系统**，不再是简单的演示项目！

### 8.2 强烈建议

**必须做后端**！原因：
1. ✅ AIS 数据必须实时更新（10秒级）
2. ✅ 需要 WebSocket 推送
3. ✅ 需要数据库存储历史轨迹
4. ✅ 需要碰撞预警计算
5. ✅ 气象 + AIS 数据量大，需要缓存优化

**推荐方案**：
- 后端：Node.js + Express + Socket.io
- 数据库：PostgreSQL + PostGIS
- 缓存：Redis
- AIS 数据源：MarineTraffic API
- 气象数据源：OpenWeatherMap

**预算**：¥800/月
**开发时间**：5-6 周

### 8.3 实施路线图

**第 1 阶段（2 周）**：
- 搭建后端框架
- 集成 MarineTraffic API
- 实现基础船舶显示

**第 2 阶段（2 周）**：
- WebSocket 实时推送
- 历史轨迹存储和查询
- 船舶筛选和聚类

**第 3 阶段（2 周）**：
- 集成气象数据
- AIS + 气象 + 矿区整合
- 碰撞预警功能

---

## 九、下一步行动

**现在你需要决定**：

1. **确认需求**：
   - AIS 覆盖哪些海域？（太平洋？全球？）
   - 需要追踪多少船舶？（< 100？> 1000？）
   - 需要历史数据吗？（多久？）

2. **确认预算**：
   - 可接受 ¥800/月 的成本吗？
   - 有 5-6 周的开发时间吗？

3. **技术选型**：
   - 后端用 Node.js 还是 Python？
   - 数据库用 PostgreSQL 还是 MongoDB？

**告诉我你的答案，我会为你制定详细的实施计划！** 🚀
