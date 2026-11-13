# Mining Overview API

矿区总览接口统一由 [MiningOverviewController.java](/d:/船讯网/project02/Ocean_Mining_System_backend/java/src/main/java/com/oceanmining/monitoring/controller/MiningOverviewController.java:23) 提供，基础路径是：

```text
/api/mining-overview
```

## 响应格式

所有接口都返回统一包裹结构：

```json
{
  "success": true,
  "data": [],
  "error": null,
  "timestamp": 1740000000000
}
```

字段说明：

- `success`：是否成功
- `data`：业务数据
- `error`：错误信息，成功时通常为 `null`
- `timestamp`：服务端返回时间戳，毫秒

## 接口清单

### 1. 大矿区列表

```text
GET /api/mining-overview/regions
```

返回字段：

| 字段名 | 中文名 | 说明 |
| --- | --- | --- |
| `id` | 大矿区ID | 数据库主键 |
| `regionCode` | 大矿区编码 | 业务唯一编码 |
| `regionName` | 大矿区名称 | 前端展示名称 |
| `centerLng` | 中心经度 | 地图默认定位用 |
| `centerLat` | 中心纬度 | 地图默认定位用 |
| `boundaryPolygon` | 区域边界 | GeoJSON 风格坐标数据 |
| `siteCount` | 点位数量 | 该大矿区下的小矿区数量 |

### 2. 大矿区逐日预报

```text
GET /api/mining-overview/regions/{regionId}/daily
```

返回字段：

| 字段名 | 中文名 | 说明 |
| --- | --- | --- |
| `regionId` | 大矿区ID | 对应区域 |
| `regionName` | 大矿区名称 | 展示用 |
| `baseDate` | 起报日期 | 这一批预报所属日期 |
| `runCycle` | 起报批次 | 例如 `t12` |
| `forecastDate` | 预报日期 | 逐日汇总日期 |
| `windSpeedAvg` | 平均风速 | 当日区域平均风速，`m/s` |
| `windSpeedMax` | 最大风速 | 当日区域最大风速，`m/s` |
| `gustMax` | 最大阵风 | 当日区域最大阵风，`m/s` |
| `waveHeightAvg` | 平均浪高 | 当日区域平均有效波高，`m` |
| `waveHeightMax` | 最大浪高 | 当日区域最大有效波高，`m` |
| `wavePeriodAvg` | 平均波周期 | 当日区域平均主波周期，`s` |
| `windDirMean` | 主导风向 | 当日区域主导风向，`0-360` 度，北起顺时针 |
| `waveDirMean` | 主导波向 | 当日区域主导波向，`0-360` 度，北起顺时针 |
| `currentSpeedAvg` | 平均流速 | 当日区域平均洋流流速，`m/s` |
| `currentSpeedMax` | 最大流速 | 当日区域最大洋流流速，`m/s` |
| `currentDirMean` | 主导流向 | 当日区域主导洋流方向，`0-360` 度，北起顺时针 |
| `hourCount` | 统计时次数 | 该日参与统计的小时记录数 |

### 3. 大矿区逐时预报

```text
GET /api/mining-overview/regions/{regionId}/hourly
GET /api/mining-overview/regions/{regionId}/hourly?forecastDate=2026-05-23
```

查询参数：

- `forecastDate`：可选，只看某一天的逐时结果，格式 `YYYY-MM-DD`

返回字段：

| 字段名 | 中文名 | 说明 |
| --- | --- | --- |
| `regionId` | 大矿区ID | 对应区域 |
| `regionName` | 大矿区名称 | 展示用 |
| `baseDate` | 起报日期 | 这一批预报所属日期 |
| `runCycle` | 起报批次 | 例如 `t12` |
| `forecastDate` | 预报日期 | 当前时刻所属日期 |
| `forecastTime` | 预报时刻 | 具体时间，带时区 |
| `forecastHour` | 预报时效 | 相对起报时刻的小时数 |
| `windSpeedAvg` | 平均风速 | 该时刻区域平均风速，`m/s` |
| `windSpeedMax` | 最大风速 | 该时刻区域最大风速，`m/s` |
| `windDirMean` | 主导风向 | 该时刻区域主导风向 |
| `gustMax` | 最大阵风 | 该时刻区域最大阵风，`m/s` |
| `waveHeightAvg` | 平均浪高 | 该时刻区域平均有效波高，`m` |
| `waveHeightMax` | 最大浪高 | 该时刻区域最大有效波高，`m` |
| `wavePeriodAvg` | 平均波周期 | 该时刻区域平均主波周期，`s` |
| `waveDirMean` | 主导波向 | 该时刻区域主导波向 |
| `currentSpeedAvg` | 平均流速 | 该时刻区域平均流速，`m/s` |
| `currentSpeedMax` | 最大流速 | 该时刻区域最大流速，`m/s` |
| `currentDirMean` | 主导流向 | 该时刻区域主导流向 |

### 4. 小矿区点位列表

```text
GET /api/mining-overview/sites
GET /api/mining-overview/sites?regionId=47
```

查询参数：

- `regionId`：可选，只看某个大矿区下的点位

返回字段：

| 字段名 | 中文名 | 说明 |
| --- | --- | --- |
| `id` | 点位ID | 数据库主键 |
| `regionId` | 大矿区ID | 所属大矿区 |
| `regionName` | 大矿区名称 | 展示用 |
| `siteCode` | 点位编码 | 小矿区或作业点编码 |
| `siteName` | 点位名称 | 前端展示名称 |
| `lng` | 经度 | 点位经度 |
| `lat` | 纬度 | 点位纬度 |

### 5. 小矿区逐日预报

```text
GET /api/mining-overview/sites/{siteId}/daily
```

返回字段：

| 字段名 | 中文名 | 说明 |
| --- | --- | --- |
| `siteId` | 点位ID | 对应点位 |
| `regionId` | 大矿区ID | 所属大矿区 |
| `regionName` | 大矿区名称 | 展示用 |
| `siteCode` | 点位编码 | 业务编码 |
| `siteName` | 点位名称 | 展示名称 |
| `baseDate` | 起报日期 | 这一批预报所属日期 |
| `runCycle` | 起报批次 | 例如 `t12` |
| `forecastDate` | 预报日期 | 逐日汇总日期 |
| `windSpeedAvg` | 平均风速 | 当日点位平均风速，`m/s` |
| `windSpeedMax` | 最大风速 | 当日点位最大风速，`m/s` |
| `gustMax` | 最大阵风 | 当日点位最大阵风，`m/s` |
| `waveHeightAvg` | 平均浪高 | 当日点位平均有效波高，`m` |
| `waveHeightMax` | 最大浪高 | 当日点位最大有效波高，`m` |
| `wavePeriodAvg` | 平均波周期 | 当日点位平均主波周期，`s` |
| `windDirMean` | 主导风向 | 当日点位主导风向 |
| `waveDirMean` | 主导波向 | 当日点位主导波向 |
| `currentSpeedAvg` | 平均流速 | 当日点位平均流速，`m/s` |
| `currentSpeedMax` | 最大流速 | 当日点位最大流速，`m/s` |
| `currentDirMean` | 主导流向 | 当日点位主导流向 |
| `hourCount` | 统计时次数 | 该日参与统计的小时记录数 |

### 6. 小矿区逐时预报

```text
GET /api/mining-overview/sites/{siteId}/hourly
GET /api/mining-overview/sites/{siteId}/hourly?forecastDate=2026-05-23
```

查询参数：

- `forecastDate`：可选，只看某一天的逐时结果，格式 `YYYY-MM-DD`

返回字段：

| 字段名 | 中文名 | 说明 |
| --- | --- | --- |
| `siteId` | 点位ID | 对应点位 |
| `regionId` | 大矿区ID | 所属大矿区 |
| `regionName` | 大矿区名称 | 展示用 |
| `siteCode` | 点位编码 | 业务编码 |
| `siteName` | 点位名称 | 展示名称 |
| `baseDate` | 起报日期 | 这一批预报所属日期 |
| `runCycle` | 起报批次 | 例如 `t12` |
| `forecastDate` | 预报日期 | 当前时刻所属日期 |
| `forecastTime` | 预报时刻 | 具体时间，带时区 |
| `forecastHour` | 预报时效 | 相对起报时刻的小时数 |
| `windSpeed` | 风速 | 点位风速，`m/s` |
| `windDir` | 风向 | 点位风向，`0-360` 度，北起顺时针 |
| `gust` | 阵风 | 点位阵风，`m/s` |
| `waveHeight` | 浪高 | 点位有效波高，`m` |
| `wavePeriod` | 波周期 | 点位主波周期，`s` |
| `waveDir` | 波向 | 点位主波方向 |
| `currentSpeed` | 流速 | 点位洋流流速，`m/s` |
| `currentDir` | 流向 | 点位洋流方向，`0-360` 度，北起顺时针 |

## 前端展示建议

### 大矿区卡片

- 标题：`regionName`
- 副标题：`regionCode`
- 数量标签：`siteCount`
- 地图定位：`centerLng` + `centerLat`

### 大矿区趋势图

- 风：`windSpeedAvg`、`windSpeedMax`、`gustMax`
- 浪：`waveHeightAvg`、`waveHeightMax`、`wavePeriodAvg`
- 流：`currentSpeedAvg`、`currentSpeedMax`
- 方向类：`windDirMean`、`waveDirMean`、`currentDirMean`

### 小矿区详情曲线

- 风：`windSpeed`、`gust`、`windDir`
- 浪：`waveHeight`、`wavePeriod`、`waveDir`
- 流：`currentSpeed`、`currentDir`

## 空值处理约定

- 某类原始数据不存在时，对应字段返回 `null`
- 当前系统不会伪造洋流值，也不会把缺测写成 `0`
- 前端建议显示为“无数据”，不要默认显示成 0

## 当前实现说明

- 风和浪是固定主数据
- 洋流是可选数据
- 只要批次里存在 `curu` 和 `curv`，接口就会返回洋流字段
- 如果批次没有洋流文件，洋流字段仍然保留，但值为 `null`

## Current API

Current forecasts are also exposed through dedicated endpoints. These routes use the new
`region_current_forecasts_*` and `site_current_forecasts_*` tables, so the latest current batch
does not need to match the latest wind/wave batch.

### Region current daily

```text
GET /api/mining-overview/current/regions/{regionId}/daily
```

Fields:
- `regionId`: ����� ID
- `regionName`: ���������
- `baseDate`: ������������
- `runCycle`: �������κţ����� `t12`
- `forecastDate`: Ԥ������
- `currentSpeedAvg`: ƽ�����٣�`m/s`
- `currentSpeedMax`: ������٣�`m/s`
- `currentDirMean`: ��������`0-360`
- `hourCount`: ����ͳ�Ƶ�ʱ����

### Region current hourly

```text
GET /api/mining-overview/current/regions/{regionId}/hourly
GET /api/mining-overview/current/regions/{regionId}/hourly?forecastDate=2026-05-23
```

Fields:
- `regionId`
- `regionName`
- `baseDate`
- `runCycle`
- `forecastDate`
- `forecastTime`
- `forecastHour`
- `currentSpeedAvg`
- `currentSpeedMax`
- `currentDirMean`

### Site current daily

```text
GET /api/mining-overview/current/sites/{siteId}/daily
```

Fields:
- `siteId`: ��λ ID
- `regionId`: ��������� ID
- `regionName`: �������������
- `siteCode`: ��λ����
- `siteName`: ��λ����
- `baseDate`
- `runCycle`
- `forecastDate`
- `currentSpeedAvg`
- `currentSpeedMax`
- `currentDirMean`
- `hourCount`

### Site current hourly

```text
GET /api/mining-overview/current/sites/{siteId}/hourly
GET /api/mining-overview/current/sites/{siteId}/hourly?forecastDate=2026-05-23
```

Fields:
- `siteId`
- `regionId`
- `regionName`
- `siteCode`
- `siteName`
- `baseDate`
- `runCycle`
- `forecastDate`
- `forecastTime`
- `forecastHour`
- `currentSpeed`
- `currentDir`
