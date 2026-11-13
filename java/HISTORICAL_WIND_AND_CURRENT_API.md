# 风浪流与海深接口说明

本文档给前端说明以下几类接口：
- 洋流预测接口
- 海深接口
- 历史月均风场接口
- 历史月均海浪接口
- 历史月均洋流接口

默认本地前缀：
```text
http://localhost:8082
```

统一返回格式：
```json
{
  "success": true,
  "data": {},
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

---

## 1. 洋流预测接口

说明：
- 当前没有单独的“洋流预测”接口。
- 洋流预测已经并入风浪流综合接口 `/api/mining-overview/...`。
- 前端调用区域或站点的日尺度、小时尺度接口时，响应里会直接带洋流字段。

### 1.1 区域日尺度风浪流预测

```http
GET /api/mining-overview/regions/{regionId}/daily
```

路径参数：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `regionId` | `long` | 大洋矿区 ID |

返回 `data[]` 主要字段：

| 字段 | 说明 |
| --- | --- |
| `regionId` | 区域 ID |
| `regionName` | 区域名称 |
| `baseDate` | 当前采用的风浪基础批次日期 |
| `runCycle` | 批次时次，如 `t12` |
| `forecastDate` | 预报日期 |
| `windSpeedAvg` | 区域平均风速 |
| `windSpeedMax` | 区域最大风速 |
| `gustMax` | 区域最大阵风 |
| `waveHeightAvg` | 区域平均浪高 |
| `waveHeightMax` | 区域最大浪高 |
| `wavePeriodAvg` | 区域平均浪周期 |
| `windDirMean` | 区域平均风向 |
| `waveDirMean` | 区域平均浪向 |
| `currentSpeedAvg` | 区域平均流速 |
| `currentSpeedMax` | 区域最大流速 |
| `currentDirMean` | 区域平均流向 |
| `hourCount` | 该日参与聚合的小时数 |

示例：
```http
GET /api/mining-overview/regions/48/daily
```

### 1.2 区域小时尺度风浪流预测

```http
GET /api/mining-overview/regions/{regionId}/hourly
GET /api/mining-overview/regions/{regionId}/hourly?forecastDate=2026-06-07
```

查询参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `forecastDate` | `date` | 否 | 指定某一天，格式 `YYYY-MM-DD` |

返回 `data[]` 主要字段：

| 字段 | 说明 |
| --- | --- |
| `regionId` | 区域 ID |
| `regionName` | 区域名称 |
| `baseDate` | 当前采用的风浪基础批次日期 |
| `runCycle` | 批次时次 |
| `forecastDate` | 预报日期 |
| `forecastTime` | 预报时间 |
| `forecastHour` | 预报小时 |
| `windSpeedAvg` | 小时平均风速 |
| `windSpeedMax` | 小时最大风速 |
| `windDirMean` | 小时平均风向 |
| `gustMax` | 小时最大阵风 |
| `waveHeightAvg` | 小时平均浪高 |
| `waveHeightMax` | 小时最大浪高 |
| `wavePeriodAvg` | 小时平均浪周期 |
| `waveDirMean` | 小时平均浪向 |
| `currentSpeedAvg` | 小时平均流速 |
| `currentSpeedMax` | 小时最大流速 |
| `currentDirMean` | 小时平均流向 |

### 1.3 站点日尺度风浪流预测

```http
GET /api/mining-overview/sites/{siteId}/daily
```

返回 `data[]` 主要字段：

| 字段 | 说明 |
| --- | --- |
| `siteId` | 站点 ID |
| `regionId` | 所属区域 ID |
| `regionName` | 所属区域名称 |
| `siteCode` | 站点编码 |
| `siteName` | 站点名称 |
| `baseDate` | 当前采用的风浪基础批次日期 |
| `runCycle` | 批次时次 |
| `forecastDate` | 预报日期 |
| `windSpeedAvg` | 平均风速 |
| `windSpeedMax` | 最大风速 |
| `gustMax` | 最大阵风 |
| `waveHeightAvg` | 平均浪高 |
| `waveHeightMax` | 最大浪高 |
| `wavePeriodAvg` | 平均浪周期 |
| `windDirMean` | 平均风向 |
| `waveDirMean` | 平均浪向 |
| `currentSpeedAvg` | 平均流速 |
| `currentSpeedMax` | 最大流速 |
| `currentDirMean` | 平均流向 |
| `hourCount` | 该日参与聚合的小时数 |

### 1.4 站点小时尺度风浪流预测

```http
GET /api/mining-overview/sites/{siteId}/hourly
GET /api/mining-overview/sites/{siteId}/hourly?forecastDate=2026-06-07
```

返回 `data[]` 主要字段：

| 字段 | 说明 |
| --- | --- |
| `siteId` | 站点 ID |
| `regionId` | 所属区域 ID |
| `regionName` | 所属区域名称 |
| `siteCode` | 站点编码 |
| `siteName` | 站点名称 |
| `baseDate` | 当前采用的风浪基础批次日期 |
| `runCycle` | 批次时次 |
| `forecastDate` | 预报日期 |
| `forecastTime` | 预报时间 |
| `forecastHour` | 预报小时 |
| `windSpeed` | 风速 |
| `windDir` | 风向 |
| `gust` | 阵风 |
| `waveHeight` | 浪高 |
| `wavePeriod` | 浪周期 |
| `waveDir` | 浪向 |
| `currentSpeed` | 流速 |
| `currentDir` | 流向 |

---

## 2. 海深接口

说明：
- 海深数据只放在矿区列表和站点列表接口里。
- 预测接口 `/daily`、`/hourly` 中不再返回海深字段。

### 2.1 矿区列表

```http
GET /api/mining-overview/regions
GET /api/mining-overview/regions?id=50
```

查询参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `long` | 否 | 只查询指定大洋矿区 |

返回 `data[]` 主要字段：

| 字段 | 说明 |
| --- | --- |
| `id` | 区域 ID |
| `regionCode` | 区域编码 |
| `regionName` | 区域名称 |
| `centerLng` | 中心经度 |
| `centerLat` | 中心纬度 |
| `boundaryPolygon` | 区域边界 |
| `siteCount` | 该区域下站点数量 |
| `depthMinMeters` | 区域样本最小水深，单位米 |
| `depthMaxMeters` | 区域样本最大水深，单位米 |
| `depthAvgMeters` | 区域样本平均水深，单位米 |
| `centerDepthMeters` | 区域中心点水深，单位米 |
| `bathymetrySampleCount` | 水深采样点数量 |
| `bathymetryUpdatedAt` | 水深数据更新时间 |

### 2.2 站点列表

```http
GET /api/mining-overview/sites
GET /api/mining-overview/sites?regionId=50
```

查询参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `regionId` | `long` | 否 | 只查询指定区域下的站点 |

返回 `data[]` 主要字段：

| 字段 | 说明 |
| --- | --- |
| `id` | 站点 ID |
| `regionId` | 所属区域 ID |
| `regionName` | 所属区域名称 |
| `siteCode` | 站点编码 |
| `siteName` | 站点名称 |
| `lng` | 经度 |
| `lat` | 纬度 |
| `depthMeters` | 站点水深，单位米 |
| `elevationMeters` | 高程值，海域场景通常为负值 |
| `bathymetryUpdatedAt` | 水深数据更新时间 |

---

## 3. 历史月均风场接口

接口前缀：
```text
/api/historical-wind
```

### 3.1 点位查询

```http
GET /api/historical-wind/point-query?lat=17.461741&lon=-42.463921&startYear=2000&endYear=2000
```

查询参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `lat` | `double` | 是 | 纬度，范围 `-90 ~ 90` |
| `lon` | `double` | 是 | 经度，范围 `-180 ~ 180` |
| `startYear` | `int` | 否 | 起始年份 |
| `endYear` | `int` | 否 | 结束年份 |

返回 `data` 主要字段：

| 字段 | 说明 |
| --- | --- |
| `datasetCode` | 固定为 `era5_monthly_wind` |
| `datasetName` | 数据集名称 |
| `startYear` | 查询起始年份 |
| `endYear` | 查询结束年份 |
| `total` | 返回月份数量 |
| `location.lat` | 查询纬度 |
| `location.lon` | 查询经度 |
| `items[].year` | 年 |
| `items[].month` | 月 |
| `items[].monthLabel` | 月份标签，如 `2000-01` |
| `items[].monthStart` | 该月起始日期 |
| `items[].uTime` | 风场时间 |
| `items[].uValidTime` | 风场有效时间 |
| `items[].gustTime` | 阵风时间 |
| `items[].gustStepHours` | 阵风步长小时数 |
| `items[].gustValidTime` | 阵风有效时间 |
| `items[].wind.u` | 10 米风 u 分量 |
| `items[].wind.v` | 10 米风 v 分量 |
| `items[].wind.speed` | 风速 |
| `items[].wind.direction` | 风向，角度制 |
| `items[].gust` | 阵风值 |

### 3.2 月份总览

```http
GET /api/historical-wind/months?startYear=2000&endYear=2001
```

返回 `data` 主要字段：

| 字段 | 说明 |
| --- | --- |
| `datasetCode` | 固定为 `era5_monthly_wind` |
| `datasetName` | 数据集名称 |
| `startYear` | 查询起始年份 |
| `endYear` | 查询结束年份 |
| `total` | 返回月份数量 |
| `grid.width` | 网格宽度 |
| `grid.height` | 网格高度 |
| `grid.lonMin` | 最小经度 |
| `grid.lonMax` | 最大经度 |
| `grid.latMin` | 最小纬度 |
| `grid.latMax` | 最大纬度 |
| `items[].uMin` / `uMax` | u 分量最小值 / 最大值 |
| `items[].vMin` / `vMax` | v 分量最小值 / 最大值 |
| `items[].gustMin` / `gustMax` | 阵风最小值 / 最大值 |
| `items[].dataSize` | 网格点数量 |
| `items[].sourceFileName` | 源文件名 |
| `items[].sourceFilePath` | 源文件相对路径 |
| `items[].sourceFileSizeBytes` | 源文件大小 |
| `items[].importedAt` | 入库时间 |

---

## 4. 历史月均海浪接口

接口前缀：
```text
/api/historical-wave
```

### 4.1 点位查询

```http
GET /api/historical-wave/point-query?lat=17.461741&lon=-42.463921&startYear=2000&endYear=2000
```

返回 `data` 主要字段：

| 字段 | 说明 |
| --- | --- |
| `datasetCode` | 固定为 `era5_monthly_wave` |
| `datasetName` | 数据集名称 |
| `startYear` / `endYear` | 查询年份范围 |
| `total` | 返回月份数量 |
| `location.lat` / `location.lon` | 查询点坐标 |
| `items[].year` / `month` / `monthLabel` | 年、月、月份标签 |
| `items[].monthStart` | 月起始日期 |
| `items[].waveTime` | 海浪时间 |
| `items[].waveStepHours` | 海浪步长小时数 |
| `items[].waveValidTime` | 海浪有效时间 |
| `items[].wave.height` | 浪高 |
| `items[].wave.period` | 浪周期 |
| `items[].wave.direction` | 浪向 |

### 4.2 月份总览

```http
GET /api/historical-wave/months?startYear=2000&endYear=2000
```

返回 `data` 主要字段：

| 字段 | 说明 |
| --- | --- |
| `datasetCode` | 固定为 `era5_monthly_wave` |
| `datasetName` | 数据集名称 |
| `grid.width` / `grid.height` | 网格宽高 |
| `grid.lonMin` / `grid.lonMax` | 经度范围 |
| `grid.latMin` / `grid.latMax` | 纬度范围 |
| `items[].swhMin` / `swhMax` | 显著波高最小值 / 最大值 |
| `items[].mwpMin` / `mwpMax` | 平均波周期最小值 / 最大值 |
| `items[].mwdMin` / `mwdMax` | 平均波向最小值 / 最大值 |
| `items[].dataSize` | 网格点数量 |
| `items[].sourceFileName` | 源文件名 |
| `items[].sourceFilePath` | 源文件相对路径 |
| `items[].sourceFileSizeBytes` | 源文件大小 |
| `items[].importedAt` | 入库时间 |

---

## 5. 历史月均洋流接口

接口前缀：
```text
/api/historical-current
```

说明：
- 当前存的是表层月均洋流。
- 当前数据深度字段约为 `0.494 m`。

### 5.1 点位查询

```http
GET /api/historical-current/point-query?lat=17.461741&lon=-42.463921&startYear=2000&endYear=2000
```

查询参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `lat` | `double` | 是 | 纬度，范围 `-90 ~ 90` |
| `lon` | `double` | 是 | 经度，范围 `-180 ~ 180` |
| `startYear` | `int` | 否 | 起始年份 |
| `endYear` | `int` | 否 | 结束年份 |

返回 `data` 主要字段：

| 字段 | 说明 |
| --- | --- |
| `datasetCode` | 固定为 `copernicus_monthly_current` |
| `datasetName` | 数据集名称 |
| `startYear` / `endYear` | 查询年份范围 |
| `total` | 返回月份数量 |
| `location.lat` / `location.lon` | 查询点坐标 |
| `items[].year` / `month` / `monthLabel` | 年、月、月份标签 |
| `items[].monthStart` | 月起始日期 |
| `items[].currentTime` | 洋流时间 |
| `items[].depthMeters` | 数据层深度，当前约 `0.494` 米 |
| `items[].current.u` | 洋流 u 分量 |
| `items[].current.v` | 洋流 v 分量 |
| `items[].current.speed` | 流速 |
| `items[].current.direction` | 流向 |

说明：
- 如果查询点正好落在缺测区域，`items[].current` 可能为 `null`。

### 5.2 月份总览

```http
GET /api/historical-current/months?startYear=2000&endYear=2000
```

返回 `data` 主要字段：

| 字段 | 说明 |
| --- | --- |
| `datasetCode` | 固定为 `copernicus_monthly_current` |
| `datasetName` | 数据集名称 |
| `grid.width` / `grid.height` | 网格宽高 |
| `grid.lonMin` / `grid.lonMax` | 经度范围 |
| `grid.latMin` / `grid.latMax` | 纬度范围 |
| `depthMeters` | 当前整套数据的深度层，约 `0.494 m` |
| `items[].currentTime` | 洋流时间 |
| `items[].depthMeters` | 该月数据深度 |
| `items[].uMin` / `uMax` | u 分量最小值 / 最大值 |
| `items[].vMin` / `vMax` | v 分量最小值 / 最大值 |
| `items[].dataSize` | 网格点数量 |
| `items[].sourceFileName` | 源文件名 |
| `items[].sourceFilePath` | 源文件相对路径 |
| `items[].sourceFileSizeBytes` | 源文件大小 |
| `items[].importedAt` | 入库时间 |

---

## 6. 前端对接建议

- 做区域级预报页时，优先调用：
  - `/api/mining-overview/regions`
  - `/api/mining-overview/regions/{regionId}/daily`
  - `/api/mining-overview/regions/{regionId}/hourly`
- 做站点级预报页时，优先调用：
  - `/api/mining-overview/sites?regionId=xx`
  - `/api/mining-overview/sites/{siteId}/daily`
  - `/api/mining-overview/sites/{siteId}/hourly`
- 做历史月均查询页时，风、浪、流三类接口是分开的，不要混用：
  - `/api/historical-wind/...`
  - `/api/historical-wave/...`
  - `/api/historical-current/...`
- 海深只在列表接口中展示，不在预测接口中展示。
