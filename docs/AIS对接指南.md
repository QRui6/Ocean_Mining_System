# AIS 数据对接指南

## 一、AIS 系统简介

**AIS (Automatic Identification System)** - 船舶自动识别系统

工作原理：
```
船舶 GPS → AIS 发射器 → VHF 无线电 → 岸基/卫星接收 → 数据中心 → API
```

数据类型：
- 位置数据：经纬度、航速、航向（2-10 秒更新）
- 静态数据：船名、类型、尺寸（6 分钟更新）
- 航程数据：目的地、ETA

---

## 二、数据获取方案

### 方案对比

| 方案 | 成本 | 覆盖 | 实时性 | 推荐度 |
|------|------|------|--------|--------|
| MarineTraffic API | ¥700/月 | 全球 | 实时 | ⭐⭐⭐⭐⭐ |
| VesselFinder API | ¥350/月 | 全球 | 实时 | ⭐⭐⭐⭐ |
| AISHub 免费 | 免费 | 部分 | 延迟 | ⭐⭐⭐ |
| 自建接收站 | ¥1500 | 本地 | 实时 | ⭐⭐ |
| 课题组数据 | 免费 | 看情况 | 看情况 | ⭐⭐⭐⭐ |

---

## 三、商业 API（推荐）

### MarineTraffic API

**定价**：
- 基础版：$99/月（¥700）- 1000 次/天
- 专业版：$499/月（¥3500）- 10000 次/天

**API 示例**：
```http
# 获取单船信息
GET https://services.marinetraffic.com/api/singlevesselextended/v8/{API_KEY}/mmsi:{MMSI}/protocol:json

# 获取区域内船舶
GET https://services.marinetraffic.com/api/exportvessels/v8/{API_KEY}/minlat:10/maxlat:20/minlon:-150/maxlon:-130/protocol:json

# 获取船舶轨迹
GET https://services.marinetraffic.com/api/vesseltrack/v2/{API_KEY}/mmsi:{MMSI}/fromdate:2024-01-01/todate:2024-01-08/protocol:json
```

**数据格式**：
```json
{
  "MMSI": "413123456",
  "SHIPNAME": "MINING VESSEL 1",
  "LAT": "10.5234",
  "LON": "-140.2341",
  "SPEED": "12.5",
  "COURSE": "245",
  "TIMESTAMP": "2024-01-08T10:30:00Z",
  "DESTINATION": "MINING AREA A",
  "ETA": "2024-01-15T14:30:00Z"
}
```

---

## 四、从课题组获取 AIS 数据

### 必须确认的问题

#### 1. 数据来源
```
Q: AIS 数据从哪里来？
   - 商业 API（MarineTraffic？）
   - 自建接收站？
   - 卫星数据？

Q: 覆盖范围？
   - 全球？
   - 特定海域？
   - 特定船舶类型？
```

#### 2. 数据格式
```
Q: 什么格式？
   ✅ JSON / CSV / GeoJSON
   ⚠️ NMEA 原始格式
   ❌ 自定义二进制

Q: 数据结构？
   必须包含：
   - MMSI（船舶唯一标识）
   - 经纬度
   - 时间戳
   - 航速、航向
```

**理想格式**：
```json
{
  "mmsi": 413123456,
  "timestamp": "2024-01-08T10:30:00Z",
  "lat": 10.5234,
  "lon": -140.2341,
  "speed": 12.5,
  "course": 245,
  "heading": 247,
  "name": "MINING VESSEL 1",
  "type": 70,
  "destination": "MINING AREA A",
  "eta": "2024-01-15T14:30:00Z"
}
```

#### 3. 数据更新
```
Q: 更新频率？
   - 实时（< 1 分钟）✅
   - 每 5 分钟 ✅
   - 每小时 ⚠️
   - 每天 ❌

Q: 如何获取？
   - WebSocket 推送 ✅
   - HTTP API ✅
   - 定期文件 ⚠️
   - 手动 ❌
```

#### 4. 数据质量
```
Q: 准确性？
   - 位置精度？
   - 是否有异常值？
   - 是否有缺失？

Q: 延迟？
   - < 1 分钟 ✅
   - < 5 分钟 ✅
   - > 10 分钟 ❌
```

---

## 五、技术对接

### API 接口（推荐）

```javascript
// 1. 获取区域内船舶
GET /api/ais/vessels?bounds=west,south,east,north

// 2. 获取单船详情
GET /api/ais/vessel/{mmsi}

// 3. 获取船舶轨迹
GET /api/ais/vessel/{mmsi}/track?from=2024-01-01&to=2024-01-08

// 4. WebSocket 实时推送
WS /ws/ais
```

### 后端实现

```javascript
// services/aisService.js
class AISService {
  async getVesselsInArea(bounds) {
    const { west, south, east, north } = bounds;
    
    // 从课题组 API 获取
    const response = await axios.get(`${API_URL}/vessels`, {
      params: { minlat: south, maxlat: north, minlon: west, maxlon: east }
    });
    
    return response.data;
  }
  
  async getVessel(mmsi) {
    const response = await axios.get(`${API_URL}/vessel/${mmsi}`);
    return response.data;
  }
  
  async getVesselTrack(mmsi, startTime, endTime) {
    const response = await axios.get(`${API_URL}/vessel/${mmsi}/track`, {
      params: { from: startTime, to: endTime }
    });
    return response.data;
  }
}
```

### 前端集成

```javascript
// stores/aisStore.js
export const useAISStore = defineStore('ais', {
  state: () => ({
    vessels: [],
    ws: null
  }),
  
  actions: {
    connect() {
      this.ws = new WebSocket('ws://your-api.com/ws/ais');
      
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.vessels = data.vessels;
      };
    },
    
    subscribe(bounds) {
      this.ws.send(JSON.stringify({
        action: 'subscribe',
        bounds
      }));
    }
  }
});
```

---

## 六、数据验证

### 必须进行的测试

```javascript
// 1. 格式验证
function validateAISData(data) {
  const required = ['mmsi', 'lat', 'lon', 'timestamp'];
  const missing = required.filter(field => !data[field]);
  
  if (missing.length > 0) {
    console.error('缺少字段:', missing);
    return false;
  }
  
  // 验证范围
  if (data.lat < -90 || data.lat > 90) return false;
  if (data.lon < -180 || data.lon > 180) return false;
  
  return true;
}

// 2. 时效性验证
function checkTimeliness(data) {
  const now = new Date();
  const dataTime = new Date(data.timestamp);
  const delay = (now - dataTime) / 1000;
  
  console.log('数据延迟:', delay, '秒');
  
  if (delay > 300) {
    console.warn('数据延迟超过 5 分钟');
  }
  
  return delay;
}
```

---

## 七、核查清单

### 从课题组获取 AIS 数据必须确认：

```
□ 数据来源（商业 API？自建？）
□ 覆盖范围（全球？区域？）
□ 数据格式（JSON？CSV？）
□ 更新频率（实时？每 5 分钟？）
□ 获取方式（API？文件？）
□ 历史数据（有吗？多久？）
□ 数据质量（准确吗？）
□ 使用权限（可以公开吗？）
□ 技术支持（找谁？）
□ 备用方案（数据中断怎么办？）
```

### 必须获取的材料

```
□ 数据说明文档
□ 样例数据（至少 10 条）
□ API 文档
□ 使用协议
□ 技术支持联系方式
```

---

## 八、推荐方案

### 方案 A：商业 API（最可靠）
- 选择：MarineTraffic 基础版（¥700/月）
- 优点：全球覆盖、实时、稳定
- 缺点：需要付费

### 方案 B：课题组 + 备份
- 主用：课题组数据（免费）
- 备用：AISHub（¥70/月）
- 优点：成本低、有保险
- 缺点：需要维护两套

### 方案 C：免费方案（测试用）
- 选择：AISHub 免费版
- 优点：完全免费
- 缺点：覆盖不全、有延迟

---

**准备好对接 AIS 了吗？** 🚢
