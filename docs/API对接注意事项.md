# API 对接注意事项

## 一、对方有 API 时的注意事项

### 1.1 安全性 ⭐⭐⭐⭐⭐

#### API Key 管理
```javascript
// ❌ 错误做法：硬编码在代码中
const API_KEY = 'abc123456789';

// ❌ 错误做法：暴露在前端
fetch('https://api.com/data?key=abc123456789');

// ✅ 正确做法：使用环境变量
// .env 文件
WEATHER_API_KEY=abc123456789
WEATHER_API_URL=https://their-api.com

// 后端代码
const API_KEY = process.env.WEATHER_API_KEY;
const API_URL = process.env.WEATHER_API_URL;

// ✅ 正确做法：后端代理
// 前端调用你的后端
fetch('/api/weather/wind');

// 你的后端调用对方 API
app.get('/api/weather/wind', async (req, res) => {
  const response = await axios.get(`${API_URL}/wind`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  res.json(response.data);
});
```

**为什么不能在前端直接调用？**
```
1. API Key 会暴露在浏览器中
2. 任何人都可以看到你的 Key
3. 别人可以盗用你的 Key
4. 你的费用会被刷爆
```

### 1.2 CORS 跨域问题 ⭐⭐⭐⭐

**问题**：
```javascript
// 前端直接调用对方 API
fetch('https://their-api.com/data')
  .then(res => res.json())
  .catch(err => {
    // ❌ 错误：CORS policy blocked
    console.error(err);
  });
```

**解决方案**：
```javascript
// 方案 1：后端代理（推荐）
// 前端调用你的后端
fetch('/api/weather/wind')

// 你的后端调用对方 API（没有 CORS 限制）
app.get('/api/weather/wind', async (req, res) => {
  const response = await axios.get('https://their-api.com/wind');
  res.json(response.data);
});

// 方案 2：配置 CORS（需要对方支持）
// 对方需要在响应头中添加
Access-Control-Allow-Origin: *
```

### 1.3 请求频率限制 ⭐⭐⭐⭐

**问题**：
```
大多数 API 都有频率限制：
- 每分钟 60 次
- 每天 1000 次
- 超过限制会被封禁
```

**解决方案**：
```javascript
// 1. 使用缓存
const redis = require('redis');
const client = redis.createClient();

app.get('/api/weather/wind', async (req, res) => {
  const cacheKey = `wind:${req.query.time}`;
  
  // 先查缓存
  const cached = await client.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  // 缓存未命中，调用 API
  const response = await axios.get('https://their-api.com/wind');
  
  // 缓存 5 分钟
  await client.setex(cacheKey, 300, JSON.stringify(response.data));
  
  res.json(response.data);
});

// 2. 请求合并
// 如果多个用户同时请求相同数据，只调用一次 API
const pendingRequests = new Map();

async function fetchWithDedup(url) {
  if (pendingRequests.has(url)) {
    return pendingRequests.get(url);
  }
  
  const promise = axios.get(url);
  pendingRequests.set(url, promise);
  
  try {
    const result = await promise;
    return result;
  } finally {
    pendingRequests.delete(url);
  }
}
```

### 1.4 错误处理 ⭐⭐⭐⭐⭐

```javascript
app.get('/api/weather/wind', async (req, res) => {
  try {
    const response = await axios.get('https://their-api.com/wind', {
      timeout: 10000  // 10 秒超时
    });
    
    res.json({
      success: true,
      data: response.data
    });
    
  } catch (error) {
    console.error('API 调用失败:', error);
    
    // 1. 网络错误
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: '数据源服务不可用'
      });
    }
    
    // 2. 超时
    if (error.code === 'ETIMEDOUT') {
      return res.status(504).json({
        success: false,
        error: '数据源响应超时'
      });
    }
    
    // 3. API 返回错误
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: error.response.data.message || '数据源返回错误'
      });
    }
    
    // 4. 其他错误
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});
```

### 1.5 数据验证 ⭐⭐⭐⭐

```javascript
// 不要盲目信任对方 API 返回的数据
app.get('/api/weather/wind', async (req, res) => {
  const response = await axios.get('https://their-api.com/wind');
  const data = response.data;
  
  // 验证数据结构
  if (!data || !Array.isArray(data.data)) {
    throw new Error('数据格式错误');
  }
  
  // 验证数据内容
  const validated = data.data.filter(item => {
    return item.lat >= -90 && item.lat <= 90 &&
           item.lon >= -180 && item.lon <= 180 &&
           !isNaN(item.u) && !isNaN(item.v);
  });
  
  // 检查数据质量
  if (validated.length < data.data.length * 0.9) {
    console.warn('数据质量差，有效数据不足 90%');
  }
  
  res.json({
    success: true,
    data: validated
  });
});
```

### 1.6 监控和日志 ⭐⭐⭐

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'api-calls.log' })
  ]
});

app.get('/api/weather/wind', async (req, res) => {
  const startTime = Date.now();
  
  try {
    logger.info('调用气象 API', {
      endpoint: '/wind',
      params: req.query
    });
    
    const response = await axios.get('https://their-api.com/wind');
    
    const duration = Date.now() - startTime;
    logger.info('API 调用成功', {
      endpoint: '/wind',
      duration: `${duration}ms`,
      dataSize: response.data.length
    });
    
    res.json(response.data);
    
  } catch (error) {
    logger.error('API 调用失败', {
      endpoint: '/wind',
      error: error.message,
      duration: `${Date.now() - startTime}ms`
    });
    
    res.status(500).json({ error: 'API 调用失败' });
  }
});
```

---

## 二、对方没有 API 时如何写接口

### 2.1 标准 RESTful API 设计

```javascript
// routes/api.js
const express = require('express');
const router = express.Router();

// ============ 气象数据 API ============

// 1. 获取风场数据
router.get('/weather/wind', async (req, res) => {
  /*
  Query 参数：
  - time: 时间点 (ISO 8601)
  - bounds: 边界 (west,south,east,north)
  
  示例：
  GET /api/weather/wind?time=2024-01-08T00:00:00Z&bounds=-180,-90,180,90
  */
  
  try {
    const { time, bounds } = req.query;
    
    // 从文件/数据库获取数据
    const data = await getWindData(time, bounds);
    
    res.json({
      success: true,
      data: {
        time: time,
        bounds: parseBounds(bounds),
        count: data.length,
        data: data
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 2. 获取波浪数据
router.get('/weather/wave', async (req, res) => {
  // 类似风场
});

// 3. 获取洋流数据
router.get('/weather/current', async (req, res) => {
  // 类似风场
});

// 4. 获取时间序列
router.get('/weather/timeline', async (req, res) => {
  /*
  Query 参数：
  - type: wind|wave|current
  - startTime: 开始时间
  - endTime: 结束时间
  
  返回：可用的时间点列表
  */
  
  const { type, startTime, endTime } = req.query;
  
  const timeline = await getTimeline(type, startTime, endTime);
  
  res.json({
    success: true,
    data: timeline
  });
});

// ============ AIS 数据 API ============

// 5. 获取区域内船舶
router.get('/ais/vessels', async (req, res) => {
  /*
  Query 参数：
  - bounds: west,south,east,north
  - type: 船舶类型（可选）
  
  示例：
  GET /api/ais/vessels?bounds=-150,10,-130,20
  */
  
  const { bounds, type } = req.query;
  
  const vessels = await getVesselsInArea(bounds, type);
  
  res.json({
    success: true,
    count: vessels.length,
    data: vessels
  });
});

// 6. 获取单船详情
router.get('/ais/vessel/:mmsi', async (req, res) => {
  /*
  Path 参数：
  - mmsi: 船舶 MMSI
  
  示例：
  GET /api/ais/vessel/413123456
  */
  
  const { mmsi } = req.params;
  
  const vessel = await getVesselByMMSI(mmsi);
  
  if (!vessel) {
    return res.status(404).json({
      success: false,
      error: '船舶不存在'
    });
  }
  
  res.json({
    success: true,
    data: vessel
  });
});

// 7. 获取船舶轨迹
router.get('/ais/vessel/:mmsi/track', async (req, res) => {
  /*
  Path 参数：
  - mmsi: 船舶 MMSI
  
  Query 参数：
  - from: 开始时间
  - to: 结束时间
  
  示例：
  GET /api/ais/vessel/413123456/track?from=2024-01-01&to=2024-01-08
  */
  
  const { mmsi } = req.params;
  const { from, to } = req.query;
  
  const track = await getVesselTrack(mmsi, from, to);
  
  res.json({
    success: true,
    count: track.length,
    data: track
  });
});

// 8. 获取航线气象（核心功能）
router.get('/ais/vessel/:mmsi/weather', async (req, res) => {
  /*
  Path 参数：
  - mmsi: 船舶 MMSI
  
  Query 参数：
  - time: 时间点（可选，默认当前）
  
  示例：
  GET /api/ais/vessel/413123456/weather?time=2024-01-08T00:00:00Z
  */
  
  const { mmsi } = req.params;
  const { time } = req.query;
  
  // 获取船舶轨迹
  const track = await getVesselTrack(mmsi);
  
  // 获取气象数据
  const windData = await getWindData(time);
  const waveData = await getWaveData(time);
  
  // 匹配航线上的气象
  const routeWeather = await matchWeatherToRoute(track, windData, waveData);
  
  res.json({
    success: true,
    data: routeWeather
  });
});

module.exports = router;
```

### 2.2 数据获取层实现

```javascript
// services/dataService.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

class DataService {
  // 从文件获取风场数据
  async getWindData(time, bounds) {
    // 1. 构建文件路径
    const filename = this.getFilename('wind', time);
    const filepath = path.join(__dirname, '../data/weather/wind', filename);
    
    // 2. 检查文件是否存在
    if (!fs.existsSync(filepath)) {
      throw new Error(`数据文件不存在: ${filename}`);
    }
    
    // 3. 读取文件
    const compressed = fs.readFileSync(filepath);
    const json = zlib.gunzipSync(compressed).toString();
    const data = JSON.parse(json);
    
    // 4. 如果指定了边界，裁剪数据
    if (bounds) {
      return this.cropData(data, bounds);
    }
    
    return data;
  }
  
  // 从数据库获取 AIS 数据
  async getVesselsInArea(bounds) {
    const { west, south, east, north } = this.parseBounds(bounds);
    
    const query = `
      SELECT * FROM vessels
      WHERE lat BETWEEN $1 AND $2
        AND lon BETWEEN $3 AND $4
        AND timestamp > NOW() - INTERVAL '1 hour'
      ORDER BY timestamp DESC
    `;
    
    const result = await db.query(query, [south, north, west, east]);
    return result.rows;
  }
  
  // 辅助方法
  getFilename(type, time) {
    const date = new Date(time);
    const timeStr = date.toISOString().replace(/:/g, '-');
    return `${timeStr}.json.gz`;
  }
  
  parseBounds(boundsStr) {
    const [west, south, east, north] = boundsStr.split(',').map(Number);
    return { west, south, east, north };
  }
  
  cropData(data, bounds) {
    const { west, south, east, north } = this.parseBounds(bounds);
    
    return data.filter(item => 
      item.lat >= south && item.lat <= north &&
      item.lon >= west && item.lon <= east
    );
  }
}

module.exports = new DataService();
```

---

## 三、主流网站的集成方式

### 3.1 Windy.com 的做法

```javascript
// Windy 的架构
前端 (React)
  ↓ HTTP
CDN (CloudFlare)
  ↓ 缓存
后端 API (Node.js)
  ↓ 定时任务
数据处理服务
  ↓ 每 6 小时
NOAA GFS 数据源

// 前端调用
fetch('https://api.windy.com/api/point-forecast/v2.0', {
  method: 'POST',
  body: JSON.stringify({
    lat: 10.5,
    lon: -140.2,
    model: 'gfs',
    parameters: ['wind', 'waves']
  })
});

// 特点：
1. 使用 CDN 加速
2. 数据预处理成瓦片
3. 按需加载
4. WebGL 渲染
```

### 3.2 MarineTraffic 的做法

```javascript
// MarineTraffic 的架构
前端 (Vue.js)
  ↓ WebSocket
实时推送服务
  ↓ 订阅
AIS 数据流处理
  ↓ 实时接收
全球 AIS 接收站网络

// 前端连接
const ws = new WebSocket('wss://stream.marinetraffic.com');

ws.onopen = () => {
  // 订阅区域
  ws.send(JSON.stringify({
    action: 'subscribe',
    bounds: { west: -150, south: 10, east: -130, north: 20 }
  }));
};

ws.onmessage = (event) => {
  const vessels = JSON.parse(event.data);
  updateMap(vessels);
};

// 特点：
1. WebSocket 实时推送
2. 区域订阅
3. 增量更新
4. 高并发处理
```

### 3.3 推荐的集成方式

```javascript
// 你的系统架构（推荐）
前端 (Vue + Cesium)
  ↓ HTTP / WebSocket
你的后端 (Node.js + Express)
  ↓ 定时任务 / 实时订阅
对方课题组数据

// 实现方式
// 1. HTTP 轮询（简单）
setInterval(async () => {
  const data = await fetch('/api/weather/wind');
  updateMap(data);
}, 30000);  // 每 30 秒

// 2. WebSocket 推送（推荐）
const ws = new WebSocket('ws://your-api.com/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updateMap(data);
};

// 3. Server-Sent Events（备选）
const eventSource = new EventSource('/api/stream');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updateMap(data);
};
```

---

## 四、总结

### 对方有 API 时注意：
```
✅ API Key 安全（环境变量 + 后端代理）
✅ CORS 跨域（后端代理）
✅ 频率限制（缓存 + 请求合并）
✅ 错误处理（超时、重试、降级）
✅ 数据验证（不盲目信任）
✅ 监控日志（追踪问题）
```

### 对方没有 API 时：
```
✅ 设计 RESTful API
✅ 实现数据获取层
✅ 添加缓存机制
✅ 错误处理
✅ 文档完善
```

### 主流网站做法：
```
✅ 后端代理（隐藏 API Key）
✅ CDN 加速（静态资源）
✅ WebSocket 推送（实时数据）
✅ 数据预处理（减少传输）
✅ 按需加载（性能优化）
```
