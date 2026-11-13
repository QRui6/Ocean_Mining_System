# Typhoon API

本文档描述当前已实现的 4 个历史台风接口。

统一返回格式：

```json
{
  "success": true,
  "data": {},
  "timestamp": 1778839774813
}
```

失败时：

```json
{
  "success": false,
  "error": "错误信息",
  "timestamp": 1778839774813
}
```

## 基本概念

### `areaId` 是什么

- `areaId` 是矿区编号
- 来源表：`mining_areas.area_id`
- 例子：`BGRPMN1`、`APEI-10`、`IndiaPMS1`

可通过下面接口查看：

```http
GET /api/mining-areas
```

### `sid` 是什么

- `sid` 是台风唯一编号
- 来源表：`typhoon_events.sid`
- 例子：`2010169N13266`

可通过矿区台风列表接口先拿到：

```http
GET /api/mining-areas/{areaId}/typhoon/events
```

## 1. 矿区历史台风统计总览

### 接口

```http
GET /api/mining-areas/{areaId}/typhoon/summary
```

### 含义

用于返回某个矿区在指定年份范围、指定影响半径内的历史台风总体统计结果。

适合前端页面顶部的统计卡片、最强台风、最近台风展示。

### 路径参数

- `areaId`：矿区编号

### 查询参数

- `startYear`：开始年份，可选，默认 `2000`
- `endYear`：结束年份，可选，默认当前年份
- `bufferKm`：影响范围半径（公里），可选，默认 `300`

### 返回字段含义

- `totalAffectedTyphoons`：历史影响该矿区的台风总数
- `recent10yCount`：近 10 年影响次数
- `annualAverageCount`：年均影响次数
- `historicalMinDistanceKm`：历史最近距离
- `historicalMaxWind`：影响范围内历史最大风速
- `historicalMinPressure`：影响范围内历史最低气压
- `strongestTyphoon`：影响范围内最强的一场台风
- `nearestTyphoon`：历史距离矿区最近的一场台风

### 示例请求

```http
GET /api/mining-areas/BGRPMN1/typhoon/summary?startYear=2000&endYear=2026&bufferKm=300
```

### 示例响应

```json
{
  "success": true,
  "data": {
    "areaId": "BGRPMN1",
    "startYear": 2000,
    "endYear": 2026,
    "bufferKm": 300.0,
    "summary": {
      "totalAffectedTyphoons": 164,
      "recent10yCount": 59,
      "annualAverageCount": 6.07,
      "historicalMinDistanceKm": 0.0,
      "historicalMaxWind": 140.0,
      "historicalMinPressure": 921.0
    },
    "strongestTyphoon": {
      "sid": "2010169N13266",
      "name": "CELIA",
      "season": 2010,
      "maxWindNearArea": 140.0,
      "minDistanceKm": 55.71,
      "closestTime": "2010-06-25T20:00:00+08:00"
    },
    "nearestTyphoon": {
      "sid": "2025273N09248",
      "name": "OCTAVE",
      "season": 2025,
      "maxWindNearArea": 55.0,
      "minDistanceKm": 0.0,
      "closestTime": "2025-10-02T05:00:00+08:00"
    }
  },
  "timestamp": 1778839774813
}
```

## 2. 矿区历史影响台风列表

### 接口

```http
GET /api/mining-areas/{areaId}/typhoon/events
```

### 含义

用于分页返回某个矿区历史上受影响的台风事件列表。

适合前端历史台风列表、台风分页表格、筛选结果展示。

### 路径参数

- `areaId`：矿区编号

### 查询参数

- `startYear`：开始年份，可选，默认 `2000`
- `endYear`：结束年份，可选，默认当前年份
- `bufferKm`：影响范围半径（公里），可选，默认 `300`
- `impactLevel`：影响等级过滤，可选
  - `core`：`0-100km`
  - `strong`：`100-300km`
  - `outer`：`300-500km`
- `page`：页码，可选，默认 `1`
- `pageSize`：每页条数，可选，默认 `20`，最大 `200`
- `sort`：排序方式，可选
  - `season_desc`：年份倒序，默认
  - `season_asc`：年份升序
  - `min_distance`：按最近距离升序
  - `max_wind`：按影响范围内最大风速降序

### 返回字段含义

- `sid`：台风编号
- `name`：台风名称
- `season`：年份
- `basin`：海盆
- `minDistanceKm`：距矿区最近距离
- `closestTime`：距矿区最近的时间
- `influenceStart`：开始进入影响范围的时间
- `influenceEnd`：离开影响范围的时间
- `influenceDurationHours`：影响持续时长（小时）
- `maxWindNearArea`：影响范围内最大风速
- `minPresNearArea`：影响范围内最低气压
- `impactLevel`：影响等级

### 示例请求

```http
GET /api/mining-areas/BGRPMN1/typhoon/events?startYear=2000&endYear=2026&bufferKm=300&page=1&pageSize=2&sort=min_distance
```

### 示例响应

```json
{
  "success": true,
  "data": {
    "areaId": "BGRPMN1",
    "startYear": 2000,
    "endYear": 2026,
    "bufferKm": 300.0,
    "impactLevel": null,
    "page": 1,
    "pageSize": 2,
    "total": 164,
    "items": [
      {
        "sid": "2025273N09248",
        "name": "OCTAVE",
        "season": 2025,
        "basin": "EP",
        "minDistanceKm": 0.0,
        "closestTime": "2025-10-02T05:00:00+08:00",
        "influenceStart": "2025-10-01T02:00:00+08:00",
        "influenceEnd": "2025-10-08T23:00:00+08:00",
        "influenceDurationHours": 189.0,
        "maxWindNearArea": 55.0,
        "minPresNearArea": 999.0,
        "impactLevel": "core"
      }
    ]
  },
  "timestamp": 1778839875410
}
```

## 3. 矿区年度台风统计

### 接口

```http
GET /api/mining-areas/{areaId}/typhoon/stats/yearly
```

### 含义

用于按年份统计某矿区受到影响的台风数量和当年极值。

适合前端年度柱状图、年度趋势图。

### 路径参数

- `areaId`：矿区编号

### 查询参数

- `startYear`：开始年份，可选，默认 `2000`
- `endYear`：结束年份，可选，默认当前年份
- `bufferKm`：影响范围半径（公里），可选，默认 `300`

### 返回字段含义

- `year`：年份
- `count`：当年影响台风数
- `maxWind`：当年影响范围内最大风速
- `minDistanceKm`：当年最近距离

### 示例请求

```http
GET /api/mining-areas/BGRPMN1/typhoon/stats/yearly?startYear=2000&endYear=2026&bufferKm=300
```

### 示例响应

```json
{
  "success": true,
  "data": [
    {
      "year": 2000,
      "count": 5,
      "maxWind": 110.0,
      "minDistanceKm": 0.0
    },
    {
      "year": 2001,
      "count": 3,
      "maxWind": 45.0,
      "minDistanceKm": 92.91
    }
  ],
  "timestamp": 1778839769358
}
```

## 4. 单个台风轨迹

### 接口

```http
GET /api/typhoons/{sid}/track
```

### 含义

用于返回单个台风的完整轨迹点序列。

如果传了 `areaId`，还会额外计算每个轨迹点距离矿区的距离，以及是否进入指定影响范围。

适合前端地图画轨迹、点击台风看详情、轨迹与矿区联动展示。

### 路径参数

- `sid`：台风编号

### 查询参数

- `areaId`：矿区编号，可选
- `bufferKm`：影响范围半径（公里），可选，默认 `300`

### 返回字段含义

- `sid`：台风编号
- `name`：台风名称
- `season`：年份
- `basin`：海盆
- `startTime`：台风开始时间
- `endTime`：台风结束时间
- `maxWind`：整场台风生命周期最大风速
- `minPres`：整场台风生命周期最低气压
- `pointCount`：轨迹点数量
- `points[].time`：轨迹点时间
- `points[].lat`：纬度
- `points[].lon`：经度
- `points[].wmoWind`：该时刻风速
- `points[].wmoPres`：该时刻气压
- `points[].distanceToAreaKm`：距矿区距离，只有传 `areaId` 时才有意义
- `points[].inBuffer`：是否进入影响范围

### 示例请求

```http
GET /api/typhoons/2010169N13266/track?areaId=BGRPMN1&bufferKm=300
```

### 示例响应

```json
{
  "success": true,
  "data": {
    "sid": "2010169N13266",
    "name": "CELIA",
    "season": 2010,
    "basin": "EP",
    "startTime": "2010-06-18T14:00:00+08:00",
    "endTime": "2010-06-30T20:00:00+08:00",
    "maxWind": 140.0,
    "minPres": 921.0,
    "pointCount": 99,
    "areaId": "BGRPMN1",
    "bufferKm": 300.0,
    "points": [
      {
        "time": "2010-06-25T20:00:00+08:00",
        "lat": 13.6,
        "lon": -117.6,
        "wmoWind": 125.0,
        "wmoPres": 938.0,
        "distanceToAreaKm": 55.71,
        "inBuffer": true
      }
    ]
  },
  "timestamp": 1778839870330
}
```

## 当前建议用法

第一版页面建议这样串起来：

1. 先调用 `GET /api/mining-areas` 获取矿区列表
2. 用户选中矿区后：
   - 调 `summary` 做顶部统计卡片
   - 调 `events` 做历史台风列表
   - 调 `yearly` 做年度趋势图
3. 用户点击某条台风记录后：
   - 调 `track` 画轨迹和显示点位详情

## 说明

- 统计默认半径是 `300km`
- `impactLevel` 的分级是：
  - `core`：`0-100km`
  - `strong`：`100-300km`
  - `outer`：`300-500km`
- 同一个 `areaId` 如果在库里对应多块 polygon，后台会自动做空间合并后再统计
