# Typhoon API Summary

本文档汇总当前后端可用的 5 个历史台风相关接口。

统一返回格式：

```json
{
  "success": true,
  "data": {},
  "error": null,
  "timestamp": 1780000000000
}
```

失败时：

```json
{
  "success": false,
  "error": "错误信息",
  "timestamp": 1780000000000
}
```

## 1. 矿区历史台风统计总览

```http
GET /api/mining-areas/{areaId}/typhoon/summary
```

用途：
- 返回单个矿区在指定年份范围、指定缓冲半径内的历史台风统计总览

路径参数：
- `areaId`：矿区编码，例如 `BGRPMS1`

查询参数：
- `startYear`：可选，默认 `2000`
- `endYear`：可选，默认当前年份
- `bufferKm`：可选，默认 `300`

返回字段：
- `areaId`
- `startYear`
- `endYear`
- `bufferKm`
- `summary.totalAffectedTyphoons`
- `summary.recent10yCount`
- `summary.annualAverageCount`
- `summary.historicalMinDistanceKm`
- `summary.historicalMaxWind`
- `summary.historicalMinPressure`
- `strongestTyphoon`
- `nearestTyphoon`

示例：

```http
GET /api/mining-areas/BGRPMS1/typhoon/summary?startYear=2000&endYear=2026&bufferKm=300
```

## 2. 矿区历史台风事件分页列表

```http
GET /api/mining-areas/{areaId}/typhoon/events
```

用途：
- 返回单个矿区受影响的历史台风事件列表

路径参数：
- `areaId`：矿区编码，例如 `COMRAPMS1`

查询参数：
- `startYear`：可选，默认 `2000`
- `endYear`：可选，默认当前年份
- `bufferKm`：可选，默认 `300`
- `impactLevel`：可选，支持 `core`、`strong`、`outer`
- `page`：可选，默认 `1`
- `pageSize`：可选，默认 `20`，最大 `200`
- `sort`：可选，支持：
  - `season_desc`
  - `season_asc`
  - `min_distance`
  - `max_wind`

影响等级口径：
- `core`：`0-100km`
- `strong`：`100-300km`
- `outer`：`300-500km`

返回字段：
- `areaId`
- `startYear`
- `endYear`
- `bufferKm`
- `impactLevel`
- `page`
- `pageSize`
- `total`
- `items[]`

`items[]` 字段：
- `sid`
- `name`
- `season`
- `basin`
- `minDistanceKm`
- `closestTime`
- `influenceStart`
- `influenceEnd`
- `influenceDurationHours`
- `maxWindNearArea`
- `minPresNearArea`
- `impactLevel`

示例：

```http
GET /api/mining-areas/BGRPMS1/typhoon/events?startYear=2000&endYear=2026&bufferKm=300&page=1&pageSize=1&sort=min_distance
```

## 3. 矿区年度台风统计

```http
GET /api/mining-areas/{areaId}/typhoon/stats/yearly
```

用途：
- 按年份统计单个矿区每年受影响台风次数及年度极值

路径参数：
- `areaId`：矿区编码

查询参数：
- `startYear`：可选，默认 `2000`
- `endYear`：可选，默认当前年份
- `bufferKm`：可选，默认 `300`

返回字段：
- `year`
- `count`
- `maxWind`
- `minDistanceKm`

示例：

```http
GET /api/mining-areas/BGRPMS1/typhoon/stats/yearly?startYear=2000&endYear=2026&bufferKm=300
```

## 4. 单个台风轨迹详情

```http
GET /api/typhoons/{sid}/track
```

用途：
- 返回单个台风完整轨迹
- 传入 `areaId` 后，会额外返回每个轨迹点到矿区的距离，以及是否进入影响范围

路径参数：
- `sid`：台风编号，例如 `2010169N13266`

查询参数：
- `areaId`：可选，矿区编码
- `bufferKm`：可选，默认 `300`

返回字段：
- `sid`
- `name`
- `season`
- `basin`
- `startTime`
- `endTime`
- `maxWind`
- `minPres`
- `pointCount`
- `areaId`
- `bufferKm`
- `points[]`

`points[]` 字段：
- `time`
- `lat`
- `lon`
- `wmoWind`
- `wmoPres`
- `distanceToAreaKm`
- `inBuffer`

示例：

```http
GET /api/typhoons/2010169N13266/track?areaId=BGRPMS1&bufferKm=300
```

## 5. 大洋区域历史台风事件分页列表

推荐主接口：

```http
GET /api/mining-regions/{regionId}/typhoon/events
```

兼容接口：

```http
GET /api/mining-regions/code/{regionCode}/typhoon/events
```

用途：
- 返回整个大洋区域口径的历史台风事件列表
- 适合替代“单个矿区不能代表整个大洋”的场景

推荐路径参数：
- `regionId`：区域主键 ID，例如：
  - `47`：印度洋
  - `48`：大西洋
  - `49`：太平洋
  - `50`：太平洋（CCZ）
  - `51`：西太平洋

兼容路径参数：
- `regionCode`：区域编码，例如 `大西洋`

查询参数：
- `startYear`：可选，默认 `2000`
- `endYear`：可选，默认当前年份
- `bufferKm`：可选，默认 `300`
- `impactLevel`：可选，支持 `core`、`strong`、`outer`
- `page`：可选，默认 `1`
- `pageSize`：可选，默认 `20`，最大 `200`
- `sort`：可选，支持：
  - `season_desc`
  - `season_asc`
  - `min_distance`
  - `max_wind`

返回字段：
- `regionId`
- `regionCode`
- `regionName`
- `startYear`
- `endYear`
- `bufferKm`
- `impactLevel`
- `page`
- `pageSize`
- `total`
- `items[]`

`items[]` 结构与矿区事件列表接口一致。

推荐示例：

```http
GET /api/mining-regions/48/typhoon/events?startYear=2000&endYear=2026&bufferKm=300&page=1&pageSize=20&sort=min_distance
```

兼容示例：

```http
GET /api/mining-regions/code/%E5%A4%A7%E8%A5%BF%E6%B4%8B/typhoon/events?startYear=2000&endYear=2026&bufferKm=300&page=1&pageSize=20&sort=min_distance
```

## 口径说明

- 矿区接口是单个 `areaId` 口径
- 区域接口是整个 `mining_regions` 几何范围口径
- 因此 `BrazilCRFC1 = 0` 不代表整个大西洋没有历史台风，应使用区域接口判断整洋区域情况

## 当前推荐调用顺序

1. 先调用区域或矿区列表接口，获取 `areaId` / `regionId`
2. 列表页调用 `events`
3. 顶部统计卡片调用 `summary`
4. 年度图表调用 `stats/yearly`
5. 点选具体台风后调用 `track`
