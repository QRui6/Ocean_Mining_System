# 预报中心、气象预警与浮标监测接口说明

> 面向前端联调，以当前后端实现为准。  
> 文档日期：2026-08-01

## 1. 通用说明

### 1.1 服务地址

| 环境 | HTTP Base URL | WebSocket URL |
|---|---|---|
| 本地开发 | `http://localhost:8082` | `ws://localhost:8082/ws` |
| 远程环境 | `http://121.194.93.61:8082` | `ws://121.194.93.61:8082/ws` |

前端建议将 Base URL 和 WebSocket URL 放在环境变量中，不要散落写死在组件内。

### 1.2 统一 JSON 响应

除 TXT 下载接口外，成功响应统一为：

```json
{
  "success": true,
  "data": {},
  "timestamp": 1785519732452
}
```

失败响应统一为：

```json
{
  "success": false,
  "error": "错误说明",
  "timestamp": 1785519732452
}
```

### 1.3 公共参数与枚举

| 名称 | 可选值 | 说明 |
|---|---|---|
| `range` | `12h`, `7d`, `15d` | 预报/历史时间范围 |
| `severity` | `INFO`, `WARNING`, `CRITICAL` | 预警级别 |
| `status` | `ACTIVE`, `RESOLVED`, `EXPIRED` | 预警状态 |
| `riskLevel` | `SAFE`, `MODERATE`, `HIGH`, `CRITICAL` | 预报综合风险 |
| 趋势 | `UP`, `DOWN`, `STABLE`, `UNKNOWN` | 上升、下降、稳定、无法判断 |

所有日期时间使用 ISO 8601，例如 `2026-06-07T12:00:00+08:00`；前端应保留时区偏移信息。

### 1.4 数据口径

- `12h` 优先使用区域小时级预测数据。
- `7d` 和 `15d` 使用区域逐日汇总数据。
- 风、浪、流数据来自数据库中的最新预测批次，不是历史月均数据。
- 当前原始预测最多覆盖约10天。请求 `15d` 时返回实际已有数据，`dataComplete=false`，前端不得伪造后5天数据。
- 预警只由预测风、浪、流触发，与浮标模拟数据无关。

## 2. 接口总览

| 模块 | 方法 | 路径 | 简称 |
|---|---|---|---|
| 预报中心 | GET | `/api/forecast/regions` | 获取预报区域 |
| 预报中心 | GET | `/api/forecast/regions/{regionId}/summary` | 获取区域预报摘要 |
| 预报中心 | GET | `/api/forecast/regions/{regionId}/hourly` | 获取区域小时预报 |
| 预报中心 | GET | `/api/forecast/regions/{regionId}/daily` | 获取区域逐日预报 |
| 预报中心 | GET | `/api/forecast/regions/{regionId}/bulletin` | 获取区域预报公报 |
| 预报中心 | GET | `/api/forecast/regions/{regionId}/bulletin/download` | 下载区域预报公报 |
| 预报中心 | GET | `/api/forecast/regions/{regionId}/sites` | 获取区域站点列表 |
| 预报中心 | WebSocket | `/ws` | 实时预报预警通知 |
| 气象预警 | GET | `/api/warnings/weather` | 获取气象预警列表 |
| 气象预警 | GET | `/api/warnings/weather/{id}` | 获取气象预警详情 |
| 气象预警 | GET | `/api/warnings/weather/{id}/bulletin/download` | 下载气象预警报文 |
| 气象预警 | GET | `/api/warnings/weather/stats` | 获取气象预警统计 |
| 气象预警 | PUT | `/api/warnings/weather/{id}/resolve` | 人工解除气象预警 |
| 浮标监测 | GET | `/api/buoys` | 获取浮标列表 |
| 浮标监测 | GET | `/api/buoys/realtime` | 获取全部浮标实时数据 |
| 浮标监测 | GET | `/api/buoys/{buoyId}/realtime` | 获取单个浮标实时数据 |
| 浮标监测 | GET | `/api/buoys/{buoyId}/history` | 获取浮标历史监测数据 |

## 3. 预报中心

### 3.1 获取预报区域

```http
GET /api/forecast/regions
```

无请求参数。只返回存在小时或日级预测数据的活跃大区域。

| 字段 | 类型 | 说明 |
|---|---|---|
| `regionId` | number | 大区域数据库ID，后续接口的 `{regionId}` |
| `regionCode` | string | 区域代码 |
| `regionName` | string | 区域名称 |
| `latestBaseDate` | string | 最新预测基准日期 |
| `latestRunCycle` | string | 最新运行周期，例如 `t12` |
| `hasHourlyForecast` | boolean | 是否有小时级数据 |
| `hasDailyForecast` | boolean | 是否有日级数据 |

```json
{
  "success": true,
  "data": [{
    "regionId": 48,
    "regionCode": "大西洋",
    "regionName": "大西洋",
    "latestBaseDate": "2026-06-07",
    "latestRunCycle": "t12",
    "hasHourlyForecast": true,
    "hasDailyForecast": true
  }],
  "timestamp": 1785519732452
}
```

### 3.2 获取区域预报摘要

```http
GET /api/forecast/regions/{regionId}/summary?range=12h
```

| 参数 | 位置 | 必填 | 默认 | 说明 |
|---|---|---|---|---|
| `regionId` | path | 是 | - | 大区域ID |
| `range` | query | 否 | `12h` | `12h`, `7d`, `15d` |

摘要字段：

| 字段 | 类型/单位 | 说明 |
|---|---|---|
| `regionId/regionCode/regionName` | - | 区域信息 |
| `timeRange/rangeLabel` | string | 范围代码和显示名称 |
| `baseDate/runCycle` | string | 数据批次 |
| `periodStart/periodEnd` | datetime | 实际数据覆盖时间 |
| `requestedPeriodEnd` | datetime | 所选范围的理论结束时间 |
| `dataComplete` | boolean | 实际数据是否覆盖理论时段 |
| `dataPointCount` | number | 参与摘要计算的数据点数 |
| `windSpeedAvg/windSpeedMax/gustMax` | m/s | 平均风速、最大风速、最大阵风 |
| `waveHeightAvg/waveHeightMax` | m | 平均浪高、最大浪高 |
| `wavePeriodAvg` | s | 平均浪周期 |
| `currentSpeedAvg/currentSpeedMax` | m/s | 平均和最大表层流速 |
| `windTrend/waveTrend/currentTrend` | enum | 风、浪、流趋势 |
| `riskLevel` | enum | 综合风险级别 |

### 3.3 获取区域小时预报

```http
GET /api/forecast/regions/{regionId}/hourly?range=12h
```

`range` 默认 `12h`。后端也能接收 `7d/15d`，但前端的12小时趋势图建议固定使用 `12h`。

返回 `data` 数组，按预测时间升序。

| 字段 | 单位 | 说明 |
|---|---|---|
| `regionId/regionName` | - | 区域信息 |
| `baseDate/runCycle` | - | 预测批次 |
| `forecastDate` | date | 预测日期 |
| `forecastTime` | datetime | 预测时刻 |
| `forecastHour` | h | 相对基准时次 |
| `windSpeedAvg/windSpeedMax` | m/s | 区域平均/最大风速 |
| `windDirMean` | degree | 平均风向，`0-360` |
| `gustMax` | m/s | 最大阵风 |
| `waveHeightAvg/waveHeightMax` | m | 平均/最大浪高 |
| `wavePeriodAvg` | s | 平均浪周期 |
| `waveDirMean` | degree | 平均浪向 |
| `currentSpeedAvg/currentSpeedMax` | m/s | 平均/最大表层流速 |
| `currentDirMean` | degree | 平均表层流向 |

### 3.4 获取区域逐日预报

```http
GET /api/forecast/regions/{regionId}/daily?range=7d
GET /api/forecast/regions/{regionId}/daily?range=15d
```

| 参数 | 必填 | 默认 | 说明 |
|---|---|---|---|
| `regionId` | 是 | - | 大区域ID |
| `range` | 否 | `7d` | 推荐 `7d` 或 `15d`；`12h` 时返回首日 |

字段与小时预报基本一致，差异为：

- 使用 `forecastDate`，不返回 `forecastTime/forecastHour`。
- `hourCount` 表示该日参与汇总的小时数据条数。
- 当 `range=15d` 但底层只有10天时，数组只返回10条。完整性请以摘要接口的 `dataComplete` 为准。

### 3.5 获取区域预报公报

```http
GET /api/forecast/regions/{regionId}/bulletin?range=12h
```

首次请求某个“区域 + 时间范围 + 预测批次”时会生成并存储公报；同一组合后续复用。

| 字段 | 说明 |
|---|---|
| `id` | 公报ID |
| `regionId/regionCode/regionName` | 区域信息 |
| `timeRange/baseDate/runCycle` | 范围和批次 |
| `riskLevel` | 综合风险 |
| `dataComplete` | 数据是否完整覆盖时段 |
| `bulletinText` | 可直接展示的纯文本公报 |
| `createdAt/updatedAt` | 创建和更新时间 |

### 3.6 下载区域预报公报

```http
GET /api/forecast/regions/{regionId}/bulletin/download?range=12h&format=txt
```

- `format` 目前只支持 `txt`。
- 响应是 `text/plain;charset=UTF-8`，不是统一 JSON。
- 响应头包含 `Content-Disposition: attachment`。

前端可直接设置下载链接，或使用 `fetch -> blob -> URL.createObjectURL`。

### 3.7 获取区域站点列表

```http
GET /api/forecast/regions/{regionId}/sites
```

| 字段 | 类型/单位 | 说明 |
|---|---|---|
| `id` | number | 站点数据库ID |
| `regionId/regionName` | - | 所属大区域 |
| `siteCode/siteName` | string | 小矿区/站点代码和名称 |
| `lng/lat` | degree | 经纬度 |
| `depthMeters` | m | 水深正值 |
| `elevationMeters` | m | 高程，海底通常为负值 |
| `bathymetryUpdatedAt` | datetime | 水深统计更新时间 |

## 4. 气象预警

### 4.1 获取气象预警列表

```http
GET /api/warnings/weather?regionId=47&range=7d&severity=WARNING&status=ACTIVE&page=1&pageSize=20
```

所有筛选参数均可省略。

| 参数 | 默认 | 说明 |
|---|---|---|
| `regionId` | 全部 | 大区域ID |
| `range` | 全部 | `12h`, `7d`, `15d` |
| `severity` | 全部 | `INFO`, `WARNING`, `CRITICAL`，不区分大小写 |
| `status` | 全部 | `ACTIVE`, `RESOLVED`, `EXPIRED`，不区分大小写 |
| `page` | `1` | 从1开始 |
| `pageSize` | `20` | `1-200` |

`data` 分页字段：`page`, `pageSize`, `total`, `totalPages`, `items`。`items` 按 `createdAt` 倒序。

预警列表项字段：

| 字段 | 说明 |
|---|---|
| `id` | 预警数据库ID，详情和解除接口使用该值 |
| `warningCode` | 显示编号，格式 `WRN-00000005` |
| `regionId/regionCode/regionName` | 区域信息 |
| `timeRange/baseDate/runCycle` | 范围和预测批次 |
| `severity` | 预警级别 |
| `triggerType` | 触发类型：`wind`, `wave`, `current`；多个用 `+` 连接 |
| `triggerDetail` | 触发指标数组 |
| `warningMessage` | 适合列表/弹窗的预警摘要 |
| `status` | 预警状态 |
| `createdAt/resolvedAt` | 创建/解除时间；未解除时 `resolvedAt=null` |

`triggerDetail` 示例：

```json
[{ "type": "wave", "value": 4.8, "threshold": 4, "level": "WARNING", "unit": "m" }]
```

### 4.2 获取气象预警详情

```http
GET /api/warnings/weather/{id}
```

在列表字段基础上增加：

| 字段 | 说明 |
|---|---|
| `bulletinText` | 预警报文全文 |
| `forecastData.summary` | 预警触发时的预报摘要快照 |
| `forecastData.series` | 触发时的小时/日级序列快照 |

`forecastData` 是历史快照，后续最新预测更新时不会改写该预警的触发依据。

### 4.3 下载气象预警报文

```http
GET /api/warnings/weather/{id}/bulletin/download?format=txt
```

- `format` 只支持 `txt`。
- 成功响应是 UTF-8 `text/plain`文件。
- 文件名格式：`{warningCode}_{baseDate}.txt`。

### 4.4 获取气象预警统计

```http
GET /api/warnings/weather/stats
```

```json
{
  "success": true,
  "data": {
    "total": 5,
    "active": 1,
    "resolved": 4,
    "info": 0,
    "warning": 5,
    "critical": 0
  },
  "timestamp": 1785519732452
}
```

`active/resolved` 按状态统计；`info/warning/critical` 按级别统计，两组维度不是互斥总和。

### 4.5 人工解除气象预警

```http
PUT /api/warnings/weather/{id}/resolve
```

无 Body。当预警从 `ACTIVE` 转为 `RESOLVED` 时：

- 记录 `resolvedAt`。
- 保留预警、报文和预测快照，不删除历史。
- 广播 `weather_warning_resolved` WebSocket 事件。

幂等性：对已是 `RESOLVED` 的记录再次调用仍返回200，但不会重复广播 WebSocket 事件。

### 4.6 预警规则

| 指标 | WARNING | CRITICAL |
|---|---:|---:|
| 最大风速 | `>= 20 m/s` | `>= 25 m/s` |
| 最大浪高 | `>= 4 m` | `>= 6 m` |
| 最大表层流速 | `>= 2 m/s` | 暂无独立CRITICAL阈值 |

任一指标达到WARNING阈值即创建预警；存在CRITICAL指标，或同时有两个及以上WARNING指标时，综合预警级别为 `CRITICAL`。

## 5. WebSocket 实时通知

### 5.1 连接

```javascript
const ws = new WebSocket("ws://121.194.93.61:8082/ws");

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log(message.type, message.payload);
};
```

通用消息格式：

```json
{
  "type": "weather_warning",
  "payload": {},
  "timestamp": 1785519732452
}
```

WebSocket 只推送事件通知，不推送全部风浪流序列。前端收到事件后，再调用 REST 接口刷新列表或详情。

### 5.2 `bulletin_ready`

定时任务为新批次首次创建公报时发送。普通GET公报接口不保证触发该通知。

```json
{
  "type": "bulletin_ready",
  "payload": {
    "bulletinId": 16,
    "regionId": 48,
    "range": "12h",
    "baseDate": "2026-06-08"
  },
  "timestamp": 1785519732452
}
```

### 5.3 `weather_warning`

新批次首次检测到超阈值预警时发送。

```json
{
  "type": "weather_warning",
  "payload": {
    "warningId": 9,
    "warningCode": "WRN-00000009",
    "regionId": 47,
    "regionName": "印度洋",
    "range": "7d",
    "severity": "WARNING",
    "triggerType": "wave",
    "message": "印度洋未来7天预测触发WARNING级气象预警"
  },
  "timestamp": 1785519732452
}
```

### 5.4 `weather_warning_resolved`

人工解除 `ACTIVE` 预警时发送。`payload` 是完整的预警列表DTO。

```json
{
  "type": "weather_warning_resolved",
  "payload": {
    "id": 2,
    "warningCode": "WRN-00000002",
    "regionId": 49,
    "regionName": "太平洋",
    "timeRange": "15d",
    "severity": "WARNING",
    "status": "RESOLVED",
    "resolvedAt": "2026-08-01T01:30:00+08:00"
  },
  "timestamp": 1785519732452
}
```

### 5.5 前端重连建议

- 页面级维护一个 WebSocket，不要每个组件重复建立连接。
- 断线后使用递增延迟重连，例如1s、2s、5s、10s，最大30s。
- 重连成功后主动调用预警列表/统计接口补齐断线期间可能遗漏的事件。
- 不要把 WebSocket 当成唯一数据源，REST 中的数据库状态才是最终状态。

## 6. 浮标监测

### 6.1 数据说明

- 固定5个浮标：`BUOY-001` 至 `BUOY-005`。
- 数据为后端模拟数据，`source="SIMULATED"`。
- 实时数据每60秒刷新一次。
- 历史数据为1小时粒度，内存保留最近15天，共360点。
- 浮标数据不入库，后端重启后重新生成；不适合用于科研统计或真实业务决策。
- 浮标数据不触发气象预警。

### 6.2 获取浮标列表

```http
GET /api/buoys
```

```json
{
  "success": true,
  "data": [
    { "id": "BUOY-001", "name": "西太平洋浮标A", "lat": 8.0, "lng": 130.0 },
    { "id": "BUOY-002", "name": "西太平洋浮标B", "lat": 12.0, "lng": 150.0 }
  ],
  "timestamp": 1785519732452
}
```

### 6.3 获取全部浮标实时数据

```http
GET /api/buoys/realtime
```

一次返回5个浮标的实时数据，前端建议每60秒轮询该批量接口，不要对5个浮标分别轮询。

### 6.4 获取单个浮标实时数据

```http
GET /api/buoys/{buoyId}/realtime
GET /api/buoys/BUOY-001/realtime
```

| 字段 | 单位 | 说明 |
|---|---|---|
| `buoyId/buoyName` | - | 浮标编号和名称 |
| `lat/lng` | degree | 纬度/经度 |
| `timestamp` | datetime | 数据生成时间 |
| `windSpeed` | m/s | 风速 |
| `windDirection` | degree | 风向，`0-360` |
| `waveHeight` | m | 浪高 |
| `waveDirection` | degree | 浪向 |
| `wavePeriod` | s | 浪周期 |
| `currentSpeed` | m/s | 表层流速 |
| `currentDirection` | degree | 表层流向 |
| `source` | string | 固定 `SIMULATED` |

```json
{
  "success": true,
  "data": {
    "buoyId": "BUOY-001",
    "buoyName": "西太平洋浮标A",
    "lat": 8.0,
    "lng": 130.0,
    "timestamp": "2026-08-01T02:20:35+08:00",
    "windSpeed": 4.589,
    "windDirection": 196.825,
    "waveHeight": 2.562,
    "waveDirection": 188.791,
    "wavePeriod": 9.206,
    "currentSpeed": 0.765,
    "currentDirection": 95.278,
    "source": "SIMULATED"
  },
  "timestamp": 1785519732452
}
```

### 6.5 获取浮标历史监测数据

```http
GET /api/buoys/{buoyId}/history?range=12h
```

| 参数 | 必填 | 默认 | 说明 |
|---|---|---|---|
| `buoyId` | 是 | - | `BUOY-001` 至 `BUOY-005`，不区分大小写 |
| `range` | 否 | `12h` | `12h`, `7d`, `15d` |

| `range` | 返回点数 | 粒度 |
|---|---:|---|
| `12h` | 12 | 1小时 |
| `7d` | 168 | 1小时 |
| `15d` | 360 | 1小时 |

返回字段：

| 字段 | 说明 |
|---|---|
| `buoyId/buoyName/range` | 浮标和范围 |
| `startTime/endTime` | 实际序列起止时间 |
| `total` | 点数 |
| `statistics.windSpeed` | 风速 `min/max/avg/unit` |
| `statistics.waveHeight` | 浪高 `min/max/avg/unit` |
| `statistics.currentSpeed` | 流速 `min/max/avg/unit` |
| `points` | 按 `timestamp` 升序的历史点数组 |

`points` 的气象字段与实时数据一致，但不重复返回浮标名称、位置和 `source`。

## 7. 错误处理

| HTTP状态 | 常见场景 | 前端处理 |
|---|---|---|
| `400` | `range/severity/status/format` 不合法 | 显示 `error`，不重试 |
| `404` | 区域、预警、浮标不存在，或当前无可用预报 | 显示空态/资源不存在 |
| `500` | 数据库或后端内部异常 | 显示服务异常并记录请求信息 |

前端不应只判断HTTP 200；还应检查JSON中的 `success`。下载接口例外，应按Blob/文件处理。

## 8. 推荐前端调用流程

### 8.1 预报中心页

1. 调用 `/api/forecast/regions` 生成区域选择器。
2. 选择区域和 `range` 后，并行请求 `summary` 与 `hourly/daily`。
3. 用 `dataComplete` 显示“完整预报/当前仅有N天数据”。
4. 需要报文时请求 `bulletin`，点击下载时调用 `bulletin/download`。
5. WebSocket收到 `bulletin_ready` 后刷新当前区域数据。

### 8.2 预警中心页

1. 初始并行请求预警列表与统计。
2. WebSocket收到 `weather_warning` 时弹出提示，并刷新列表/统计。
3. 点击列表项时用 `id` 请求详情。
4. 解除前进行二次确认，调用PUT成功后立即更新当前行。
5. WebSocket收到 `weather_warning_resolved` 时同步其他页面/用户的状态。

### 8.3 浮标监测页

1. 进入页面调用 `/api/buoys` 建立地图实体。
2. 调用 `/api/buoys/realtime` 填充实时卡片，之后每60秒轮询。
3. 选中单个浮标时调用历史接口，根据 `range` 更新趋势图和统计卡片。
4. 页面卸载时清理轮询定时器和地图实体。
