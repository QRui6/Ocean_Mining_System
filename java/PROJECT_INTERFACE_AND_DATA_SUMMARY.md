# 项目已实现接口与数据情况说明

## 1. 文档目的

本文档用于总结当前后端系统中已经实现的主要接口、对应功能、系统当前存储的数据类型，以及前期分析船舶网站数据接入时遇到的问题。

---

## 2. 当前已实现的主要接口模块

### 2.1 登录认证模块

接口：
- `POST /api/auth/login`

功能：
- 提供系统用户登录校验
- 返回用户基础信息

已存储数据：
- `system_users`
- 存储系统用户名、密码、显示名称等登录账户信息

### 2.2 矿区基础信息与历史台风模块

接口：
- `GET /api/mining-areas/geojson`
- `GET /api/mining-areas`
- `GET /api/mining-areas/{areaId}`
- `GET /api/mining-areas/category/{category}`
- `GET /api/mining-areas/sponsor/{sponsor}`
- `GET /api/mining-areas/categories`
- `GET /api/mining-areas/sponsors`
- `POST /api/mining-areas/import`
- `GET /api/mining-areas/{areaId}/typhoon/summary`
- `GET /api/mining-areas/{areaId}/typhoon/events`
- `GET /api/mining-areas/{areaId}/typhoon/stats/yearly`
- `GET /api/mining-regions/{regionId}/typhoon/events`
- `GET /api/mining-regions/code/{regionCode}/typhoon/events`
- `GET /api/typhoons/{sid}/track`

功能：
- 提供矿区 GeoJSON、矿区列表、分类筛选、 sponsor 筛选
- 提供单矿区历史台风总览、事件分页、年度统计、轨迹查询
- 提供区域级历史台风事件查询

已存储数据：
- `mining_areas`
  - 存储矿区编号、名称、类别、 sponsor、边界、多边形等基础信息
- `mining_regions`
  - 存储大洋区域编号、区域名称、区域边界、中心点等信息
- `typhoon_events`
  - 存储历史台风事件级数据
- `typhoon_track_points`
  - 存储历史台风轨迹点数据

### 2.3 矿区总览模块

接口：
- `GET /api/mining-overview/regions`
- `GET /api/mining-overview/regions/{regionId}/daily`
- `GET /api/mining-overview/regions/{regionId}/hourly`
- `GET /api/mining-overview/sites`
- `GET /api/mining-overview/sites/{siteId}/daily`
- `GET /api/mining-overview/sites/{siteId}/hourly`

功能：
- 提供大洋矿区列表与小矿区列表
- 提供区域级、站点级的风浪流日尺度与小时尺度预测结果
- 提供海深统计结果展示

已存储数据：
- `mining_regions`
  - 大矿区区域基础信息
- `forecast_sites`
  - 小矿区或站点基础信息
- `region_forecasts_daily`
  - 区域级风浪日尺度统计结果
- `region_forecasts_hourly`
  - 区域级风浪小时尺度统计结果
- `site_forecasts_daily`
  - 站点级风浪日尺度统计结果
- `site_forecasts_hourly`
  - 站点级风浪小时尺度统计结果
- `region_current_forecasts_daily`
  - 区域级洋流日尺度统计结果
- `region_current_forecasts_hourly`
  - 区域级洋流小时尺度统计结果
- `site_current_forecasts_daily`
  - 站点级洋流日尺度统计结果
- `site_current_forecasts_hourly`
  - 站点级洋流小时尺度统计结果
- `region_bathymetry_summary`
  - 大矿区水深统计信息，包含最小、最大、平均、中心点水深
- `site_bathymetry`
  - 小矿区或站点级水深、高程信息

### 2.4 历史月均风场模块

接口：
- `GET /api/historical-wind/point-query`
- `GET /api/historical-wind/months`

功能：
- 按经纬度查询指定点位历史月均风场时序
- 按月份查询数据总览、网格范围、极值、源文件信息

已存储数据：
- `historical_wind_metadata`
  - 存储风场数据集名称、变量、网格范围、分辨率等元信息
- `historical_wind_monthly_data`
  - 按年/月存储月均风场数据
  - 包含 `u`、`v`、`gust` 栅格二进制数据及最值、文件信息

### 2.5 历史月均海浪模块

接口：
- `GET /api/historical-wave/point-query`
- `GET /api/historical-wave/months`

功能：
- 按经纬度查询指定点位历史月均海浪时序
- 按月份查询海浪数据总览、极值、源文件信息

已存储数据：
- `historical_wave_metadata`
  - 存储海浪数据集元信息
- `historical_wave_monthly_data`
  - 按年/月存储显著波高、平均波周期、平均波向等历史月均海浪数据

### 2.6 历史月均洋流模块

接口：
- `GET /api/historical-current/point-query`
- `GET /api/historical-current/months`

功能：
- 按经纬度查询指定点位历史月均表层洋流时序
- 按月份查询洋流数据总览、极值、源文件信息

已存储数据：
- `historical_current_metadata`
  - 存储洋流数据集元信息、深度层信息、网格范围等
- `historical_current_monthly_data`
  - 按年/月存储表层洋流 `u`、`v` 分量栅格数据及最值

### 2.7 原始气象网格与点位查询模块

接口：
- `GET /api/weather/metadata/{type}`
- `GET /api/weather/data/{type}/{timeIndex}`
- `GET /api/weather/available/{type}`
- `GET /api/weather/data/{type}/{timeIndex}/binary`
- `GET /api/weather/point-query`
- `GET /api/weather/point-query/time-series`
- `GET /api/weather/data/internal_wave/{timeIndex}/binary`

功能：
- 提供风、浪、流、内波原始网格元数据与时间索引查询
- 提供原始网格 JSON 查询与二进制查询
- 提供指定点位的风浪流插值查询和时间序列查询

已存储数据：
- `weather_metadata`
  - 存储风、浪、流原始预报数据集元信息
- `wind_data`
  - 原始风场网格数据
- `wave_data`
  - 原始海浪网格数据
- `ocean_current_data`
  - 原始洋流网格数据
- `internal_wave_metadata`
  - 内波元信息
- `internal_wave_data`
  - 内波网格数据
- `weather_files`
  - 原始文件登记信息，包含文件名、数据类型、要素编码、批次日期、时次、路径、大小、下载状态、是否最新等

### 2.8 监测矿区与船舶监控模块

接口：
- `POST /api/mining-monitoring`
- `GET /api/mining-monitoring`
- `DELETE /api/mining-monitoring/{id}`
- `DELETE /api/mining-monitoring/area/{miningAreaId}`
- `PUT /api/mining-monitoring/{id}/thresholds`
- `GET /api/mining-monitoring/{id}/weather-stats`
- `POST /api/areas`
- `GET /api/areas`
- `DELETE /api/areas/{id}`
- `GET /api/areas/{id}/ships`
- `GET /api/areas/{id}/events`
- `POST /webhook/area`

功能：
- 提供监测矿区添加、删除、阈值更新
- 提供监测矿区气象统计结果
- 提供监测区域创建、船舶列表、事件日志查询
- 提供船讯网/ShipXY 推送 webhook 接收

已存储数据：
- `monitoring_areas`
  - 存储监控区域信息
- `area_ships`
  - 存储区域内船舶、进出区域状态、位置、气象、风险等级
- `event_logs`
  - 存储进入、离开、预警等事件日志
- `warnings`
  - 存储风险预警记录

### 2.9 数据迁移与测试辅助模块

接口：
- `POST /api/migration/all`
- `POST /api/migration/{type}`
- `GET /api/migration/test-paths`
- `POST /api/test/ship-enter`
- `POST /api/test/ship-leave`
- `GET /api/test/status`

功能：
- 手动触发风、浪、流历史或原始数据迁移
- 测试本地路径配置是否正确
- 模拟船舶进入/离开事件
- 查看测试状态

---

## 3. 当前系统已经存储的数据总类

从系统现状看，当前数据库已经覆盖以下几类数据：

1. 矿区与区域基础数据  
包含大洋矿区、小矿区、矿区边界、区域边界、站点坐标等。

2. 海深数据  
包含大矿区水深统计、小矿区或站点级水深和高程。

3. 风浪流预测数据  
包含区域级、站点级的日尺度和小时尺度预测统计结果。

4. 原始风浪流网格数据  
包含风场、海浪、洋流、内波原始网格数据与元数据。

5. 历史台风数据  
包含台风事件、年度统计、轨迹点等。

6. 历史月均风浪流数据  
包含历史月均风场、海浪、表层洋流的月度栅格数据和元信息。

7. 船舶监控数据  
包含监测区域、区域内船舶、事件日志、风险预警。

8. 系统用户与认证数据  
包含后台登录用户信息。

---

## 4. 船舶网站数据接入分析中遇到的问题

前期在分析第三方船舶网站数据接入时，主要遇到以下问题：

### 4.1 页面本身不直接携带核心数据

- 网站页面中并不直接包含完整船舶数据
- 查询操作本质上是前端页面再去调用命名 API
- 因此无法简单通过“抓页面 HTML”完成数据接入

### 4.2 接口请求依赖 token

- 请求船舶位置、基础信息、当前挂靠、历史挂靠时，都需要携带 token
- 不登录时通常只能得到游客 token
- 登录后可以得到用户 token

### 4.3 token 不稳定，不能作为正式后端方案

- 游客 token 或网页登录 token 都不是正式分配给后端系统的 API key
- 这类 token 存在过期问题
- 这类 token 也存在访问次数限制、数据范围限制
- 实际可获取的数据量不确定，不能保证长期稳定

### 4.4 接口字段和调用方式缺乏稳定契约

- 即使通过抓包知道了接口 URL、参数、请求头
- 网站前端一旦改版，字段、路径、校验方式就可能变化
- 后端一旦直接依赖这类接口，维护成本会很高

### 4.5 存在调用频率限制

- 该类网站通常会有频率限制和风控
- 如果短时间批量请求，很容易遇到限流、401、403 或 token 失效问题

### 4.6 不能作为长期正式数据源

综合判断：
- 这种方式最多只适合小规模测试、功能验证、原型阶段使用
- 不适合当前系统作为长期正式生产接入方案
- 如果要长期上线，仍应使用正式授权 API 或可持续的数据源

---

## 5. 当前海维斯风浪预测数据更新情况

结合系统当前数据库内容，现阶段矿区总览接口所依赖的风浪预测批次情况如下：

- `region_forecasts_daily` 表当前最新 `base_date` 为 `2026-06-07`
- `site_forecasts_daily` 表当前最新 `base_date` 也为 `2026-06-07`
- 当前最远 `forecast_date` 为 `2026-06-16`

这说明：

1. 当前系统接入并处理成功的海维斯风浪预测基础批次，最新只更新到了 `2026-06-07`
2. 前端在矿区总览、区域预报、站点预报接口中看到的风浪结果，当前都是基于这一天的批次向后展开的预报结果
3. 如果后续海维斯站点没有更新出更新批次，系统中的风浪预测接口也不会自动出现比 `2026-06-07` 更晚的基础批次

---

## 6. 当前阶段总结

当前项目已经基本形成以下几条完整链路：

- 矿区基础数据入库与展示链路
- 海深数据提取、统计、入库与接口展示链路
- 风浪流预测数据下载、处理、入库与接口展示链路
- 历史台风分析链路
- 历史月均风浪流数据下载、处理、入库与查询链路
- 船舶监控区域、Webhook 接入、事件日志与风险预警链路

其中，船舶网站外部数据接入虽然已经完成过技术可行性分析，但由于 token、限流、稳定性与长期可维护性问题，目前不适合直接作为正式后端数据源落地。
