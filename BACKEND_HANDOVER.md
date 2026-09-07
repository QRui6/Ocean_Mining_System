# 深海采矿海洋气象预报与保障系统后端交接文档

> 文档日期：2026-09-07  
> 代码仓库：`https://github.com/QRui6/Ocean_Mining_System.git`  
> 交接分支：`sdw`  
> 本次核对提交：`e7f46a4`（`Publish cleaned backend project`）

## 1. 一分钟了解项目

本仓库由两部分组成：

1. `java/`：Spring Boot 后端服务，负责 REST API、WebSocket、数据库查询、预报公报和预警生成。
2. `automation/`：Python/PowerShell 数据流水线，负责下载、处理并导入风、浪、流、海深、历史月均和台风数据。

当前 Java 后端可以正常编译，2026-09-07 已执行 `mvn -DskipTests package` 并成功生成 JAR。项目没有自动化测试源码，因此“编译成功”不等于全部业务接口都经过回归测试。

本机开发数据库已包含较完整的数据，约 15 GB、44 张用户表。大数据文件、数据库备份、JAR、日志和本地凭据没有上传 GitHub。接手人从 GitHub 拉取代码后，必须另行取得 PostgreSQL 数据库或备份文件，系统才会返回现有业务数据。

特别注意：Java 内的预报定时任务只负责根据数据库已有预测结果生成公报和预警，不负责下载新预测数据。风浪流预测数据更新依赖 `automation/` 下的 Python 流水线，当前仓库明确关闭了 Windows 自动定时安装，默认需要人工运行。

## 2. 当前状态总览

| 项目 | 当前状态 |
|---|---|
| Java 后端 | 已实现，能够编译打包 |
| HTTP 服务 | 默认监听 `0.0.0.0:8082` |
| WebSocket | 已实现，地址 `/ws` |
| 数据库 | PostgreSQL + PostGIS，JPA 不自动建表 |
| 本机数据库 | PostgreSQL 16.7，PostGIS 3.5.2，约 15 GB |
| 远程环境 | 需要在目标电脑上单独核对端口、数据库、JAR 和 Git 提交 |
| 自动化测试 | 未建立，`java/src/test` 不存在 |
| 数据自动更新 | 流水线已实现，但自动 Windows 计划任务已停用 |
| 浮标数据 | 5 个模拟浮标，内存数据，不是真实观测 |
| 船舶数据 | 对接 ShipXY API，需要正式 API Key；失败时会返回默认值 |
| 认证 | 仅有用户名/密码校验，无 Token、会话和接口鉴权 |
| GitHub 内容 | 源码和 SQL 已上传；原始数据、数据库、JAR、日志未上传 |

## 3. 技术栈和代码结构

### 3.1 技术栈

- Java 17
- Spring Boot 3.2.1
- Spring Web、Spring WebSocket、Spring Data JPA、Validation
- PostgreSQL JDBC Driver
- PostgreSQL + PostGIS
- Hibernate Spatial + JTS 1.19.0
- JSONB：Hypersistence Utils 3.7.0
- Caffeine 本地缓存
- Hutool 5.8.25
- Maven 构建
- Python 数据处理：`numpy`、`pandas`、`xarray`、`netCDF4`、`cfgrib`、`psycopg2`、`shapely`、`rasterio` 等

### 3.2 主要目录

| 路径 | 用途 |
|---|---|
| `java/src/main/java/.../controller` | REST 控制器 |
| `java/src/main/java/.../service` | 业务逻辑、预警、公报、数据查询 |
| `java/src/main/java/.../repository` | JPA 数据访问层 |
| `java/src/main/java/.../entity` | 数据库实体 |
| `java/src/main/java/.../dto` | 请求和响应对象 |
| `java/src/main/java/.../scheduler` | Java 内定时任务 |
| `java/src/main/java/.../websocket` | WebSocket 会话和广播 |
| `java/src/main/resources` | 应用配置 |
| `automation/` | 下载、处理、导入及缓存预计算脚本 |
| `database_*.sql` | 各业务模块数据库结构脚本 |
| `java/*.md` | 面向前端的详细接口文档 |

## 4. 后端模块和已实现功能

### 4.1 登录认证

- `POST /api/auth/login`
- 校验 `system_users` 中处于启用状态的用户。
- 成功后返回用户 ID、用户名和显示名称。
- 当前没有 JWT、Cookie Session、Spring Security 或权限控制，登录成功也不会生成访问令牌。
- 当前密码以明文存储并直接比较，只适用于演示环境。

### 4.2 监控区域、船舶和事件

- `POST /api/areas`：创建监控区域，并调用 ShipXY 创建区域。
- `GET /api/areas`：查询监控区域。
- `DELETE /api/areas/{id}`：删除区域。
- `GET /api/areas/{id}/ships`：查询区域内船舶。
- `GET /api/areas/{id}/events`：查询区域事件。
- `POST /webhook/area`：接收 ShipXY 区域事件回调。
- `POST /api/test/ship-enter`、`POST /api/test/ship-leave`：模拟船舶进出区域。
- `GET /api/test/status`：查看测试状态。
- 每 10 分钟扫描活跃区域内状态为 `IN_AREA` 的船舶并尝试更新信息。
- 船舶进入、离开、状态更新和风险预警可通过 WebSocket 广播。

依赖条件：必须提供有效的 `SHIPXY_API_KEY` 和外部可访问的 `PUBLIC_URL`。当前 ShipXY 调用异常时，部分查询会回退为“未知船舶”和零值气象数据，因此不能只看 HTTP 成功就认定外部数据正常。

### 4.3 矿区基础信息和矿区监测

- `GET /api/mining-areas/geojson`：返回矿区 GeoJSON。
- `GET /api/mining-areas`、`GET /api/mining-areas/{areaId}`：列表和详情。
- 按类别、Sponsor 查询，并提供类别和 Sponsor 字典。
- `POST /api/mining-areas/import`：导入矿区数据。
- `POST /api/mining-monitoring`：将矿区加入监测。
- `GET /api/mining-monitoring`：查看监测列表。
- 支持按记录或矿区删除监测关系。
- 支持更新风速、浪高等监测阈值。
- 支持查询监测矿区的气象统计结果。

当前本机数据库有 1,401 个矿区，但 `mining_area_monitoring` 当前为 0 条，表示“监测矿区功能已实现，但当前没有正在监测的矿区记录”。

### 4.4 矿区总览、风浪流预测和海深

- `GET /api/mining-overview/regions`：获取大区域列表，同时返回海深摘要。
- `GET /api/mining-overview/regions/{regionId}/hourly`：区域小时风浪流预测。
- `GET /api/mining-overview/regions/{regionId}/daily`：区域逐日风浪流预测。
- `GET /api/mining-overview/sites`：获取小矿区/站点列表和站点海深。
- `GET /api/mining-overview/sites/{siteId}/hourly`：站点小时预测。
- `GET /api/mining-overview/sites/{siteId}/daily`：站点逐日预测。
- 风、浪、表层洋流字段已经合并进同一套区域/站点预测响应。
- 海深数据只随区域和站点列表返回，不在小时/逐日预测接口重复返回。

### 4.5 预报中心

- `GET /api/forecast/regions`：只返回有预测数据的活跃区域。
- `GET /api/forecast/regions/{regionId}/summary`：风浪流摘要、趋势、风险等级和数据完整性。
- `GET /api/forecast/regions/{regionId}/hourly`：小时序列。
- `GET /api/forecast/regions/{regionId}/daily`：逐日序列。
- `GET /api/forecast/regions/{regionId}/bulletin`：生成或复用区域预报公报。
- `GET /api/forecast/regions/{regionId}/bulletin/download`：下载 TXT 公报。
- `GET /api/forecast/regions/{regionId}/sites`：获取区域下属站点。
- 支持 `range=12h|7d|15d`。

数据规则：`12h` 使用小时数据，`7d` 和 `15d` 使用逐日数据。底层原始预测目前最多约 10 天；请求 `15d` 时只返回实际存在的数据，并通过 `dataComplete=false` 表示不完整，后端不会伪造剩余天数。

综合风险级别为 `SAFE`、`MODERATE`、`HIGH`、`CRITICAL`。默认阈值：风速预警 20 m/s、严重 25 m/s；浪高预警 4 m、严重 6 m；流速预警 2 m/s。

### 4.6 气象预警

- `GET /api/warnings/weather`：分页、区域、时间范围、级别和状态筛选。
- `GET /api/warnings/weather/stats`：预警统计。
- `GET /api/warnings/weather/{id}`：预警详情和触发时预测快照。
- `GET /api/warnings/weather/{id}/bulletin/download`：下载 TXT 预警报文。
- `PUT /api/warnings/weather/{id}/resolve`：人工解除预警。
- 预警状态：`ACTIVE`、`RESOLVED`、`EXPIRED`。
- 预警级别：`INFO`、`WARNING`、`CRITICAL`。
- 创建和解除预警时会广播 `weather_warning` 或 `weather_warning_resolved`。

Java 后端启动后会立即处理一次全部活跃区域，此后默认在北京时间每天 `00:15`、`06:15`、`12:15`、`18:15` 生成/刷新公报并检测预警。

### 4.7 浮标监测

- `GET /api/buoys`：获取浮标列表。
- `GET /api/buoys/realtime`：获取全部浮标实时数据。
- `GET /api/buoys/{buoyId}/realtime`：获取单浮标实时数据。
- `GET /api/buoys/{buoyId}/history`：获取 `12h`、`7d`、`15d` 历史数据。
- 当前固定模拟 `BUOY-001` 至 `BUOY-005` 五个浮标。
- 服务启动时在内存生成 15 天小时数据，每 60 秒刷新实时值。

该模块没有读取数据库，也没有连接真实浮标。进程重启后模拟历史数据会重新生成，不应作为真实观测或长期存档使用。

### 4.8 原始气象网格

- `GET /api/weather/metadata/{type}`：查询数据集元信息。
- `GET /api/weather/data/{type}/{timeIndex}`：查询网格 JSON。
- `GET /api/weather/available/{type}`：查询可用时间索引。
- `GET /api/weather/data/{type}/{timeIndex}/binary`：查询二进制网格。
- `GET /api/weather/point-query`：按经纬度查询风浪流点值。
- `GET /api/weather/point-query/time-series`：查询点位时间序列。
- `GET /api/weather/data/internal_wave/{timeIndex}/binary`：查询内波二进制网格。
- 数据类型主要为 `wind`、`wave`、`ocean_current`、`internal_wave`。

元数据和网格使用 PostgreSQL 存储，较大的 Float32 网格以 `BYTEA` 保存。Caffeine 对元数据、网格和可用索引做一小时本地缓存。

### 4.9 历史月均风、浪、流

- `/api/historical-wind/point-query`、`/months`
- `/api/historical-wave/point-query`、`/months`
- `/api/historical-current/point-query`、`/months`
- 支持按经纬度查询历史月序列，并查询已导入月份、网格范围、极值和源文件信息。
- 历史风存储 `u`、`v`、阵风；历史浪存储显著波高、平均波周期、平均波向；历史流存储表层 `u`、`v`。
- 区域和站点查询存在预计算缓存表及 PowerShell 预计算脚本，用于降低大网格查询开销。

### 4.10 历史台风

- 查询单矿区历史台风摘要、分页事件和年度统计。
- 按大区域 ID 或区域代码查询历史台风事件。
- `GET /api/typhoons/{sid}/track`：按台风 SID 查询完整轨迹。
- 台风原始来源为 IBTrACS，事件和轨迹点存入 PostGIS，依赖空间相交查询确定影响矿区或区域的台风。

### 4.11 数据迁移

- `POST /api/migration/all`：迁移配置目录中的全部支持数据。
- `POST /api/migration/{type}`：按类型迁移。
- `GET /api/migration/test-paths`：检查数据目录。
- 默认 `weather.migration.auto-run=false`，启动后不会自动迁移文件。
- 默认路径仍写为 `D:/project/public/...`，换电脑后必须修改或通过配置覆盖。

### 4.12 WebSocket

- 连接地址：`ws://<host>:8082/ws`。
- 消息结构：`type`、`payload`、`timestamp`。
- 已使用的事件包括 `area_created`、`area_deleted`、`ship_enter`、`ship_leave`、`ship_update`、`warning`、`bulletin_ready`、`weather_warning`、`weather_warning_resolved`。
- WebSocket 只推送事件，不推送整批预测序列；客户端收到事件后应重新调用 REST 接口。
- 当前会话保存在单进程内存中，没有鉴权、订阅主题、消息持久化或断线补发。

## 5. HTTP 通用约定

除文件下载外，接口通常返回：

```json
{
  "success": true,
  "data": {},
  "timestamp": 1785519732452
}
```

错误响应通常为：

```json
{
  "success": false,
  "error": "错误说明",
  "timestamp": 1785519732452
}
```

全局异常处理约定：参数错误返回 400，资源不存在返回 404，未处理异常返回 500。当前 500 响应会拼接异常消息，生产环境存在泄露内部实现信息的风险。

详细字段、示例和前端联调说明见：

- `java/FORECAST_WARNING_BUOY_FRONTEND_API.md`
- `java/HISTORICAL_WIND_AND_CURRENT_API.md`
- `java/MINING_OVERVIEW_API.md`
- `java/TYPHOON_API.md`
- `java/TYPHOON_API_SUMMARY.md`

## 6. 数据库现状

### 6.1 本机实测快照

以下数据来自 2026-09-07 对本机 `127.0.0.1:5432/ship_monitoring` 的实测，不代表地调局电脑一定相同：

| 项目 | 实测值 |
|---|---|
| PostgreSQL | 16.7 |
| PostGIS | 3.5.2 |
| 数据库大小 | 约 15 GB |
| 用户表 | 44 张（包含 `spatial_ref_sys`） |
| 大区域 `mining_regions` | 5 |
| 预测站点 `forecast_sites` | 48 |
| 矿区 `mining_areas` | 1,401 |
| ShipXY 监控区域 `monitoring_areas` | 12 |
| 矿区监测关系 `mining_area_monitoring` | 0 |
| 区域船舶 `area_ships` | 5 |
| 船舶事件 `event_logs` | 11 |
| 船舶风险预警 `warnings` | 6 |
| 预报公报 `forecast_bulletins` | 15 |
| 气象预警 `weather_warnings` | 5 |
| 系统用户 `system_users` | 3 |
| 历史台风事件 | 2,716 |
| 历史台风轨迹点 | 163,818 |

历史数据覆盖：

| 数据 | 记录数 | 覆盖时间 |
|---|---:|---|
| 历史月均风 | 317 | 2000-01 至 2026-05 |
| 历史月均浪 | 317 | 2000-01 至 2026-05 |
| 历史月均表层流 | 316 | 2000-01 至 2026-04 |

预测汇总数据：

| 表 | 记录数 | 最新基础批次 | 最远预测日期 |
|---|---:|---|---|
| `region_forecasts_hourly` | 2,000 | 2026-06-07 | - |
| `region_forecasts_daily` | 250 | 2026-06-07 | 2026-06-16 |
| `site_forecasts_hourly` | 19,200 | 2026-06-07 | - |
| `site_forecasts_daily` | 2,400 | 2026-06-07 | 2026-06-16 |
| `region_current_forecasts_hourly` | 400 | 2026-06-07 | - |
| `region_current_forecasts_daily` | 50 | 2026-06-07 | 2026-06-16 |
| `site_current_forecasts_hourly` | 3,840 | 2026-06-07 | - |
| `site_current_forecasts_daily` | 480 | 2026-06-07 | 2026-06-16 |

原始网格帧数：`wind_data` 20、`wave_data` 65、`ocean_current_data` 9、`internal_wave_data` 9。预测基础批次已经明显滞后于文档日期，接手后应优先恢复下载和处理流水线。

### 6.2 表结构分组

| 业务域 | 表 |
|---|---|
| 用户 | `system_users` |
| ShipXY 区域监控 | `monitoring_areas`、`area_ships`、`event_logs`、`warnings`、`system_config` |
| 矿区 | `mining_areas`、`mining_area_monitoring`、`mining_regions`、`forecast_sites` |
| 风浪流文件登记 | `weather_files`、`weather_file_metadata` |
| 原始气象网格 | `weather_data_types`、`weather_metadata`、`wind_data`、`wave_data`、`ocean_current_data` |
| 内波 | `internal_wave_metadata`、`internal_wave_data` |
| 区域预测 | `region_forecasts_hourly`、`region_forecasts_daily`、`region_current_forecasts_hourly`、`region_current_forecasts_daily` |
| 站点预测 | `site_forecasts_hourly`、`site_forecasts_daily`、`site_current_forecasts_hourly`、`site_current_forecasts_daily` |
| 预报产品 | `forecast_bulletins`、`weather_warnings` |
| 历史风 | `historical_wind_metadata`、`historical_wind_monthly_data` |
| 历史浪 | `historical_wave_metadata`、`historical_wave_monthly_data` |
| 历史流 | `historical_current_metadata`、`historical_current_monthly_data` |
| 历史查询缓存 | `historical_wave_region_cache`、`historical_wave_site_cache`、`historical_current_region_cache`、`historical_current_site_cache` |
| 海深 | `region_bathymetry_summary`、`site_bathymetry` |
| 台风 | `typhoon_events`、`typhoon_track_points` |
| PostGIS | `spatial_ref_sys` |

数据库还有四个业务视图：`v_active_warnings`、`v_area_statistics`、`v_mining_area_by_sponsor`、`v_mining_area_statistics`。主要业务函数包括区域包含判断、矿区点查询/相交查询、区域船舶统计、最近气象点查询和旧数据清理。PostGIS 自带函数未在此逐项列出。

### 6.3 大表和容量

| 表 | 约占空间 |
|---|---:|
| `historical_current_monthly_data` | 9.4 GB |
| `historical_wind_monthly_data` | 3.9 GB |
| `internal_wave_data` | 892 MB |
| `wave_data` | 824 MB |
| `historical_wave_monthly_data` | 545 MB |
| `wind_data` | 165 MB |
| `typhoon_track_points` | 53 MB |

历史流和历史风是主要容量来源。备份、恢复和跨电脑迁移时应按大库处理，不建议用手工复制 PostgreSQL `data` 目录；应使用 `pg_dump`/`pg_restore`，并保证目标端 `pg_restore` 版本不低于生成备份的版本。

### 6.4 数据来源

| 数据类型 | 来源/处理方式 |
|---|---|
| 风浪预测 | 海维斯/OceanCloud 下载脚本，保存为 NetCDF 后登记并聚合 |
| 表层流预测 | Copernicus Marine `GLOBAL_ANALYSISFORECAST_PHY_001_024` |
| 历史月均风 | ERA5 monthly averaged reanalysis |
| 历史月均浪 | ERA5 monthly averaged reanalysis |
| 历史月均流 | Copernicus Marine |
| 海深 | GEBCO GeoTIFF |
| 历史台风 | IBTrACS |
| 内波 | NASA PO.DAAC HRET14 |
| 船舶 | ShipXY 正式 API，需授权 Key |
| 浮标 | 当前为后端内存模拟，不是真实来源 |

## 7. 数据库脚本和初始化

JPA 配置为 `spring.jpa.hibernate.ddl-auto=none`，Java 不会自动创建或升级数据库。数据库结构变更必须执行 SQL 脚本。

新建空环境时，建议顺序如下：

1. 以有建库权限的 PostgreSQL 用户执行 `database_postgres.sql`。该脚本包含 `CREATE DATABASE ship_monitoring`，数据库已存在时不要重复整份执行。
2. 连接 `ship_monitoring` 后执行 `database_system_users.sql`、`database_weather_data.sql`。
3. 执行 `database_mining_areas.sql`、`database_mining_monitoring.sql`、`database_mining_overview.sql`。
4. 执行 `database_bathymetry.sql`、`database_internal_wave.sql`。
5. 执行 `database_historical_wind.sql`、`database_historical_wave.sql`、`database_historical_current.sql`。
6. 执行 `database_forecast_warning.sql`。
7. 按需执行 `automation/create_historical_current_region_cache.sql` 和 `automation/create_historical_point_caches.sql`。
8. 按需执行 `optimize_database.sql`、`optimize_typhoon_queries.sql`，执行前先审查目标库状态。

已有环境升级时，不要重新导入全部 15 GB 数据。先做完整备份，再只执行新增模块的幂等 SQL 和对应增量数据导入脚本。`CREATE TABLE IF NOT EXISTS` 能避免重复建表，但字段变更、约束变更和数据覆盖仍需人工检查；本项目没有 Flyway/Liquibase 迁移版本记录。

## 8. 数据流水线

### 8.1 风浪预测主流水线

入口：

```powershell
python automation\run_daily_forecast_pipeline.py `
  --db-host localhost --db-port 5432 `
  --db-name ship_monitoring --db-user postgres `
  --db-password <数据库密码>
```

流程为：下载最新风浪文件 -> 登记 `weather_files` -> 解析 NetCDF -> 生成区域/站点小时和逐日汇总 -> 写入 PostgreSQL。重复处理同一基础日期和运行时次时刷新该批次，旧批次默认保留。

PowerShell 包装器为 `automation/run_daily_forecast_pipeline_task.ps1`，本地配置文件 `automation/daily_forecast_task.env.ps1` 被 Git 忽略。`automation/install_daily_forecast_task.ps1` 当前不会安装自动计划任务，只会提示人工运行。

### 8.2 表层流流水线

```powershell
python automation\run_surface_current_pipeline.py `
  --date YYYY-MM-DD --run-cycle t08 `
  --db-host localhost --db-port 5432 `
  --db-name ship_monitoring --db-user postgres `
  --db-password <数据库密码>
```

需要 Copernicus Marine 凭据。下载全球表层 `uo`、`vo`，保留表层并降采样为 3 小时时间步，再写入原始网格和区域/站点预测表。

### 8.3 历史、海深和台风

- `automation/historical_wind/`：下载并导入 ERA5 历史月均风。
- `automation/historical_wave/`：下载并导入 ERA5 历史月均浪。
- `automation/historical_current/`：下载并导入 Copernicus 历史月均表层流。
- `automation/bathymetry/`：导入 GEBCO，并计算区域和站点海深。
- `automation/typhoon/import_typhoon_data.py`：处理 IBTrACS CSV 并导入事件和轨迹点。
- `automation/precompute_*.ps1`：预计算历史浪/流区域或站点缓存。

大部分脚本支持 `--help`、`--dry-run` 或指定年份/月份。首次接手时应先在测试库执行，不要直接对生产库使用 `--truncate`、覆盖或清理参数。

## 9. 配置、编译和启动

### 9.1 必要环境变量

| 变量 | 用途 |
|---|---|
| `DB_HOST` | PostgreSQL 地址，生产配置默认 `localhost` |
| `DB_PORT` | PostgreSQL 端口，源码默认 `5432`；部分部署机可能为 `5433` |
| `DB_NAME` | 默认 `ship_monitoring` |
| `DB_USER` | 默认 `postgres` |
| `DB_PASSWORD` | 数据库密码，生产环境必填 |
| `SHIPXY_API_KEY` | ShipXY 正式 API Key |
| `PUBLIC_URL` | ShipXY 能回调访问的后端公网/局域网 URL |
| `COPERNICUSMARINE_USERNAME` | 表层流下载账号 |
| `COPERNICUSMARINE_PASSWORD` | 表层流下载密码 |

CDS API 和 Copernicus 的本地凭据文件均被 `.gitignore` 排除，需要通过安全渠道单独交接。

### 9.2 Windows 启动 PostgreSQL

先在目标电脑的“服务”中查找 `postgresql-x64-*`，优先使用 Windows 服务：

```bat
net start postgresql-x64-17
```

服务名不同时，用 `services.msc` 查实际名称。也可以使用安装目录中的 `pg_ctl`：

```bat
"C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe" start ^
  -D "C:\Program Files\PostgreSQL\17\data" ^
  -l "C:\Program Files\PostgreSQL\17\data\log.txt"
```

检查实际监听端口：

```bat
netstat -ano | findstr LISTENING | findstr :543
```

连接数据库后确认端口和数据库：

```sql
SHOW port;
SELECT current_database(), current_user, version();
```

### 9.3 编译后端

```powershell
cd java
mvn clean package -DskipTests
```

产物为 `java/target/ship-monitoring-backend-1.0.0.jar`。`target/` 和 JAR 不在 GitHub 中，部署前必须重新打包或通过安全渠道传递构建产物。

### 9.4 启动后端

生产推荐通过环境变量启动：

```powershell
$env:DB_HOST = "127.0.0.1"
$env:DB_PORT = "5432"
$env:DB_NAME = "ship_monitoring"
$env:DB_USER = "postgres"
$env:DB_PASSWORD = "<数据库密码>"
$env:SHIPXY_API_KEY = "<正式Key>"
$env:PUBLIC_URL = "http://<本机对外IP>:8082"

java -jar java\target\ship-monitoring-backend-1.0.0.jar `
  --spring.profiles.active=prod
```

如果目标数据库使用 5433，只修改 `DB_PORT=5433`，不要批量替换源码文件名或全部脚本中的数字。

### 9.5 启动后验证

```powershell
curl.exe http://127.0.0.1:8082/api/forecast/regions
curl.exe http://127.0.0.1:8082/api/buoys
netstat -ano | findstr :8082
```

看到 HTTP 200 只说明后端已响应，还应检查 JSON 的 `success`。跨电脑访问时还要确认：服务监听 `0.0.0.0`、Windows 防火墙放行 TCP 8082、两台电脑网络互通，并使用后端电脑的实际 IPv4 地址。

## 10. GitHub 和数据边界

`sdw` 分支当前上传的是清理后的源码，主要排除：

- `data/` 原始和处理后大数据
- NetCDF、GRIB、CSV、数据库 dump
- `java/target/`、JAR、ZIP 和 `remote_deploy/`
- 日志、缓存和临时文件
- 本地环境文件和第三方账号凭据
- IDE 配置

因此 GitHub 适合传递代码和数据库结构，不是完整可运行数据包。接手人至少需要另外获得：数据库备份、目标环境配置、第三方数据账号/API Key，以及必要时的原始数据归档。

远程电脑是否运行最新代码，应通过 JAR 文件时间和 Git 提交核对，不能只看文件夹名称：

```powershell
git branch --show-current
git log -1 --oneline
Get-Process java | Select-Object Id,Path,StartTime
```

## 11. 已知问题和风险

### 11.1 必须优先处理

1. **公开仓库凭据风险**：多个数据脚本仍含数据库密码默认值，`database_system_users.sql` 也包含演示账号明文密码。仓库为 Public，仅删除当前文件内容不足以清除 Git 历史。应立即轮换数据库和演示账号密码，把脚本统一改为只读环境变量，并评估清理 Git 历史。
2. **认证不具备生产安全性**：用户密码明文存储，登录不返回 Token，其他接口没有鉴权。正式上线前应接入 Spring Security、BCrypt 和 JWT/Session，并做角色权限控制。
3. **预测数据已过期**：本机最新基础批次为 2026-06-07，而文档日期为 2026-09-07。需要先恢复风浪流数据流水线，再判断预报和预警结果。

### 11.2 高优先级技术债

1. 没有自动化测试，缺少 Controller、Service、Repository 和数据库集成回归保障。
2. 没有 Flyway/Liquibase，数据库结构版本依赖人工执行 SQL，容易出现代码和数据库不匹配。
3. CORS 和 WebSocket 均允许任意来源，生产环境应限制前端域名。
4. 默认配置开启本项目 DEBUG、Hibernate SQL DEBUG 和参数 TRACE，生产必须启用 `prod` Profile，避免性能和敏感数据日志风险。
5. 500 错误直接向客户端返回异常消息，应改为内部记录详细异常、外部返回统一错误码。
6. 气象迁移目录硬编码为 `D:/project/public/...`，换电脑后很容易因路径不存在失败。
7. `scheduler.ship-update.enabled` 虽出现在配置里，但 `ShipStatusScheduler` 没有读取该开关，仍固定每 10 分钟运行。
8. 外部 ShipXY 接口错误会回退默认零值，可能把“数据源失败”误显示成“无风浪风险”。
9. WebSocket 是单实例内存广播，没有身份验证、重放和多实例消息总线。
10. 根目录旧 `java/README.md` 中仍有端口 8081 和过时功能状态，以本交接文档、源码和专项接口文档为准。

### 11.3 运维风险

1. 数据库约 15 GB，历史风流大表占主要空间，应建立定期 `pg_dump`、恢复演练、磁盘监控和 `VACUUM/ANALYZE` 策略。
2. 数据下载依赖外网、第三方账号、源站可用性和 Python 原生依赖，最容易在新电脑上因网络、证书、GDAL/eccodes/rasterio 安装失败。
3. 数据流水线当前不是自动计划任务；长期无人执行时接口仍能返回 200，但内容会持续过期。
4. 远程 Windows 电脑曾使用 5433，而源码默认 5432；数据库、导入脚本和后端必须统一使用同一端口。

## 12. 接手建议顺序

1. 克隆 GitHub `sdw` 分支，确认提交至少为 `e7f46a4`。
2. 通过安全渠道接收数据库备份和各第三方凭据，不在聊天、代码或公共仓库继续传播密码。
3. 在隔离环境恢复数据库，核对 PostgreSQL/PostGIS 版本、44 张表、主要记录数和最新预测批次。
4. 立即轮换已经出现在仓库或交接记录中的所有密码和 Key。
5. 配置环境变量，使用 `prod` Profile 启动 JAR。
6. 按模块进行冒烟测试：登录、矿区列表、预测区域、预测摘要、预警列表、浮标、历史风浪流、台风轨迹和 WebSocket。
7. 在测试库手工跑通一次风浪主流水线和表层流流水线，确认最新批次写入后再配置可靠的 Windows 计划任务。
8. 补充数据库迁移工具和自动化测试，再继续新增业务功能。

## 13. 交接验收清单

- [ ] 已取得 GitHub `sdw` 分支访问权限
- [ ] 已取得并成功恢复数据库备份
- [ ] 已确认目标数据库主机、端口、库名和 PostgreSQL 服务名
- [ ] 已确认 PostGIS 扩展可用
- [ ] 已轮换数据库、系统用户和第三方服务密码/Key
- [ ] 已配置 `DB_*`、`SHIPXY_API_KEY`、`PUBLIC_URL`
- [ ] 已成功执行 Maven 打包
- [ ] 已成功启动后端并确认 8082 监听
- [ ] 已完成主要 REST 接口冒烟测试
- [ ] 已完成 WebSocket 连接和事件验证
- [ ] 已确认预测数据基础日期不是过期批次
- [ ] 已跑通风浪和表层流数据流水线
- [ ] 已建立数据库备份、日志和磁盘监控
- [ ] 已记录地调局电脑的部署目录、启动方式和责任人

---

本文档描述的是交接时的实际源码和本机数据库快照。任何远程环境均应重新执行版本、端口、表结构、数据日期和进程核验，不能默认与本机一致。
