# 预报中心与气象预警中心接口说明

## 1. 基本说明

- 服务地址：`http://localhost:8082`
- 统一响应：业务接口返回 `{ "success": true, "data": ... }`
- 支持的预报范围：`12h`、`7d`、`15d`
- `12h` 使用区域小时级预测数据；`7d`、`15d` 使用区域日级预测数据
- 风、浪、流数据来自数据库最新预测批次，不使用历史月均数据触发预警
- 当前批次不足15天时仍返回已有数据，并通过 `dataComplete=false` 明确标记
- 报文下载目前只支持 UTF-8 编码的 TXT 文件

## 2. 预报中心接口

### 2.1 获取有预报数据的区域

```http
GET /api/forecast/regions
```

返回区域编号、代码、名称、最新基准日期、运行周期，以及是否存在小时/日级数据。

### 2.2 获取区域预报摘要

```http
GET /api/forecast/regions/{regionId}/summary?range=12h
```

`range` 可填写 `12h`、`7d` 或 `15d`。

主要返回字段：

| 字段 | 含义 |
|---|---|
| `baseDate`、`runCycle` | 最新预测批次及运行周期 |
| `periodStart`、`periodEnd` | 实际返回数据覆盖时间 |
| `requestedPeriodEnd` | 所选预报范围理论结束时间 |
| `dataComplete` | 当前批次是否完整覆盖所选范围 |
| `windSpeedAvg/Max`、`gustMax` | 平均/最大风速、最大阵风，单位 m/s |
| `waveHeightAvg/Max`、`wavePeriodAvg` | 平均/最大浪高、平均周期，单位 m、s |
| `currentSpeedAvg/Max` | 平均/最大表层流速，单位 m/s |
| `windTrend/waveTrend/currentTrend` | `UP`、`DOWN`、`STABLE` 或 `UNKNOWN` |
| `riskLevel` | `SAFE`、`MODERATE`、`HIGH` 或 `CRITICAL` |

### 2.3 获取12小时趋势数据

```http
GET /api/forecast/regions/{regionId}/hourly?range=12h
```

返回小时级风浪流组合数据，供前端绘制短期趋势图。

### 2.4 获取7天或15天趋势数据

```http
GET /api/forecast/regions/{regionId}/daily?range=7d
GET /api/forecast/regions/{regionId}/daily?range=15d
```

返回日级风浪流组合数据。

### 2.5 获取预报报文

```http
GET /api/forecast/regions/{regionId}/bulletin?range=12h
```

首次请求时会根据最新预测批次生成并保存报文；相同区域、范围和批次不会重复创建。

### 2.6 下载预报报文

```http
GET /api/forecast/regions/{regionId}/bulletin/download?range=12h&format=txt
```

响应为 `text/plain;charset=UTF-8`，并带有浏览器附件下载响应头。

### 2.7 获取区域内站点

```http
GET /api/forecast/regions/{regionId}/sites
```

复用矿区总览站点数据，返回区域内小矿区/站点基本信息。

## 3. 气象预警接口

### 3.1 查询气象预警列表

```http
GET /api/warnings/weather
    ?regionId=50
    &range=7d
    &severity=WARNING
    &status=ACTIVE
    &page=1
    &pageSize=20
```

所有筛选参数均可省略。`page` 从1开始，`pageSize` 最大为200。

预警级别：`INFO`、`WARNING`、`CRITICAL`。  
预警状态：`ACTIVE`、`RESOLVED`、`EXPIRED`。

### 3.2 获取预警详情

```http
GET /api/warnings/weather/{id}
```

除预警基本信息外，`forecastData.summary` 保存触发时摘要，
`forecastData.series` 保存触发时风浪流趋势快照，避免后续预测批次更新后丢失依据。

### 3.3 下载预警报文

```http
GET /api/warnings/weather/{id}/bulletin/download?format=txt
```

### 3.4 查询预警统计

```http
GET /api/warnings/weather/stats
```

返回总数、活跃数、已解除数及各级别数量。

### 3.5 人工解除预警

```http
PUT /api/warnings/weather/{id}/resolve
```

解除后状态变为 `RESOLVED` 并记录 `resolvedAt`。记录和触发时预测快照继续保留，不会删除。

## 4. 预警判定规则

任一指标达到阈值即可触发：

| 指标 | WARNING | CRITICAL |
|---|---:|---:|
| 最大风速 | ≥ 20 m/s | ≥ 25 m/s |
| 最大浪高 | ≥ 4 m | ≥ 6 m |
| 最大表层流速 | ≥ 2 m/s | 暂未单独设置 |

任意两个及以上指标同时达到 WARNING 阈值时，综合级别提升为 `CRITICAL`。

阈值位于 `application.yml` 的 `forecast.warning` 配置中，可调整后重启后端生效。

## 5. WebSocket通知

连接地址：

```text
ws://localhost:8082/ws
```

新增消息类型：

- `bulletin_ready`：新预测批次的报文已经生成。
- `weather_warning`：检测到新气象预警。
- `weather_warning_resolved`：气象预警已被人工解除。

WebSocket只推送事件通知，不推送整批风浪流数据。前端收到通知后再调用REST接口刷新详情。

## 6. 定时任务与数据库

系统启动后会处理一次最新预测批次，之后每天在北京时间
`00:15`、`06:15`、`12:15`、`18:15`自动生成报文并检测预警。
该任务只读取已经入库的预测数据，不会下载外部数据。

新环境首次部署需执行：

```powershell
psql -U postgres -d ship_monitoring -f database_forecast_warning.sql
```

新增数据表：

- `forecast_bulletins`：存储区域、时段、批次、统计值、风险等级和TXT报文正文。
- `weather_warnings`：存储触发指标、阈值、预测快照、预警报文、状态及解除时间。
