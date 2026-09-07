# 浮标监测接口说明

## 1. 基本说明

- 服务地址：`http://localhost:8082`
- 数据来源：后端模拟数据，`source` 固定为 `SIMULATED`
- 浮标数量：5个
- 实时刷新：每60秒
- 历史粒度：每小时一个点
- 历史保留：最近15天，共360点
- 数据只保存在后端内存，不写入数据库；后端重启后会重新生成

所有业务接口使用统一响应格式：

```json
{
  "success": true,
  "data": {},
  "timestamp": 1785474000000
}
```

## 2. 浮标列表

```http
GET /api/buoys
```

返回5个浮标的位置和名称：

| 字段 | 含义 |
|---|---|
| `id` | 浮标编号，例如 `BUOY-001` |
| `name` | 浮标名称 |
| `lat` | 纬度 |
| `lng` | 经度 |

## 3. 批量实时数据

```http
GET /api/buoys/realtime
```

一次返回全部5个浮标的实时数据，推荐Cesium图层每60秒调用一次，用于更新所有浮标标签。

## 4. 单浮标实时数据

```http
GET /api/buoys/{buoyId}/realtime
```

示例：

```http
GET /api/buoys/BUOY-001/realtime
```

主要字段：

| 字段 | 含义 | 单位 |
|---|---|---|
| `timestamp` | 实时数据生成时间 | ISO 8601 |
| `windSpeed` | 风速 | m/s |
| `windDirection` | 风向 | 0–360° |
| `waveHeight` | 浪高 | m |
| `waveDirection` | 浪向 | 0–360° |
| `wavePeriod` | 海浪周期 | s |
| `currentSpeed` | 表层流速 | m/s |
| `currentDirection` | 表层流向 | 0–360° |
| `source` | 数据来源 | `SIMULATED` |

## 5. 历史趋势

```http
GET /api/buoys/{buoyId}/history?range=12h
```

`range`仅支持：

- `12h`：12个小时点
- `7d`：168个小时点
- `15d`：360个小时点

返回内容：

| 字段 | 含义 |
|---|---|
| `buoyId`、`buoyName` | 浮标基本信息 |
| `range` | 查询范围 |
| `startTime`、`endTime` | 实际数据起止时间 |
| `total` | 数据点数量 |
| `statistics` | 风速、浪高、流速的最小值、最大值、平均值和单位 |
| `points` | 按时间升序排列的逐小时数据 |

`points`内字段与实时数据基本一致，但不包含浮标位置和数据来源。

## 6. 错误响应

- 浮标编号不存在：HTTP `404`
- `range`不是 `12h`、`7d`、`15d`：HTTP `400`

## 7. 前端调用建议

- 进入浮标监测页面时调用 `/api/buoys` 创建Cesium实体。
- 随后调用 `/api/buoys/realtime` 填充5个浮标标签。
- 前端每60秒重新调用批量实时接口。
- 用户选择浮标或切换时间范围时，调用对应历史接口刷新ECharts。
- 离开浮标监测页面后停止前端轮询并清理Cesium实体。
