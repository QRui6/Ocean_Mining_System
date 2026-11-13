# HWS945 风浪每日更新与海浪历史 SQL 导出

完整部署与运维步骤见 [定时更新脚本使用说明](定时更新脚本使用说明.md)，包含 Docker 数据库连接、不入库验证、Windows 定时任务安装和故障处理。

已生成的历史 SQL 包仅包含海浪三要素。
每日任务默认逐一尝试六个要素：`wspd`（风速）、`wdir`（风向）、`gust`（阵风）、
`sigh`（有效波高）、`dire`（波向）、`perd`（波周期）。
某个文件不存在、下载失败或校验失败时，只跳过该要素，继续处理其他可用要素。
不要求三个或六个要素全部齐全；风场恢复后会自动接续处理。
`export` 模式只生成文件，不写业务数据库；`import` 模式才执行生成的 SQL。
不更新地图网格表，不生成公报/预警，也不启动 Java 服务。
依赖项目已有的 `mining_overview/process_forecasts_batch.py` 和 `wind_wave/register_weather_batch.py`。
当前工作区已修复前者读取 NetCDF 时丢失缺测掩膜的问题；迁移到另一份旧代码时同步 `processor-mask.patch`。

## 本次数据范围

请求的起报日期为北京时间 **2026-09-30 至 2026-10-29，含首尾 30 天**。
这是起报批次范围，不是把不同批次对同一天的预测合并成历史观测。
实际可用日期、失败原因、每表行数、原始文件/SQL 校验值均见输出目录 `report.json`。
缺失的批次不会生成空白 SQL 或用其他批次冒充。

## Python 环境

使用 Python 3.10+。依赖见 `requirements.txt`，本机已准备独立环境：

```powershell
$python = 'D:\深海项目\backend\.venv-hws945\Scripts\python.exe'
python -m pip --python $python install -r 'D:\深海项目\backend\automation\hws945\requirements.txt'
```

此机器创建 venv 时 ensurepip 不可用，现有系统 pip 的 `--python` 仍可向该独立环境安装依赖。

## 导出，不入库

```powershell
& 'D:\深海项目\backend\.venv-hws945\Scripts\python.exe' `
  'D:\深海项目\backend\automation\hws945\pipeline.py' `
  --mode export --datasets wave `
  --start-date 2026-09-30 --end-date 2026-10-29 `
  --regional-subset --no-proxy `
  --definitions-json 'D:\深海项目\backend\data\hws945\definitions.json' `
  --output-dir 'D:\深海项目\backend\data\hws945\exports\20260930_20261029'
```

- `--date YYYY-MM-DD`：单批次；与起止日期、`--latest` 互斥。
- `--probe-only`：仅生成可用性清单，不下载、不连接数据库。
- `--refresh-existing`：重新获取同批次的源文件修订。
- `pipeline.py --datasets wind --elements wspd`：可单独导出某一要素，仅写该要素对应指标。每日入口 `daily.py` 会自动逐个调用这一流程。
- `--source-config source.local.json`：可配置正式 URL 模板、超时、重试。
- `--no-proxy`：当前机器环境代理不可用时使用；正常代理环境可省略。
- `source.example.json` 启用 `resolve_with_alidns`：每次运行向公开 DNS 查询当前源站 A 记录，避免本机代理 DNS 的慢速映射；查询失败回退普通 DNS。仅改变 TCP 目的地址，原域名的 TLS SNI、证书校验及 HTTP Host 保持不变，不固定长期 IP。
- 请求默认至少间隔 1 秒，网络分段并发有上限；本机当前批量下载配置另存于被 Git 忽略的 `source.local.json`。
- `--definitions-json`：完全离线使用已有区域/站点快照。
- 没有快照时可指定 `--db-config database.local.json`，程序仅在强制只读事务中读取区域边界和站点坐标，并保存快照。
- 退出码 `0`：请求批次全部成功；`2`：有缺失/失败，成功批次仍可用；`1`：参数、配置或锁等运行错误。务必查看报告，不能将部分成功当作完整 30 天。

生成每个批次的独立 SQL，以及按日期组合的 `all_batches.sql`。组合文件只包含本次真实生成的批次。

## 原始精度区域读取

`--regional-subset` 使用服务器 HTTP Range，从 NetCDF3 读取计算所需的原生网格值：

1. 使用与现有处理器相同的区域多边形掩膜及站点最近网格点；小于网格的区域沿用代表点回退规则。
2. 保留所有源文件时次和原始 packed 数值、比例因子、缺测值；没有插值、降采样或伪造数据。
3. 未请求的全球网格填为缺测。输出文件明确标注 `hws945_scope=regional_subset_native_grid`，并附 `.subset.json` 来源证明。
4. 本地派生文件校验值与全球源文件校验值不是同一概念。报告保存本地 SHA-256、源 ETag、读取字节数和所选网格数。
5. 小分段有本地断点缓存，失败后重跑可以续用已验证片段。只有全部所需片段取得后才生成正式文件。
6. 源文件改为不支持的格式/维度、服务器不支持 Range 或传输中源 ETag 变化时会失败，不会发布不完整结果。

不使用 `--regional-subset` 时会下载完整全球文件，传输量较大。
区域读取结果只用于这里的预报统计，不能拿它作为全球地图完整网格。
读取 NetCDF 的 C 库不是线程安全的，因此本地校验串行执行，仅网络片段并行。

## SQL 的目标表与执行

写入六张表：`weather_files`、`weather_file_metadata`、`region_forecasts_hourly`、
`region_forecasts_daily`、`site_forecasts_hourly`、`site_forecasts_daily`。

- 目标库必须已经执行项目建表 SQL，并具备 PostGIS、区域和站点基础数据。
- SQL 按 `region_code`、`region_code + site_code` 重新查询目标 ID；不硬编码本机 ID。
- 开始前检查区域几何、站点坐标和启用状态。基础资料变化时整个批次回滚，需要重新计算导出。
- 区域几何按 12 位小数的规范 GeoJSON 比较，忽略二进制到 JSON 序列化产生的末位浮点噪声；不修改源库边界，实际边界变化仍拒绝导入。
- 文件 ID 在执行时通过 `RETURNING` 取得，并关联到文件元数据和预报来源数组。
- 每批一个事务，使用同一 PostgreSQL advisory lock 防止并发导入。
- 历史海浪 SQL 只更新海浪字段；每日单要素 SQL 只更新该要素指标。同键已有的其他风浪流指标及来源引用保留。
- 新批次不会复制旧批次的其他要素，缺失指标保留为空，不跨日期拼成同一批次预测。
- `hourly` 表按真实源时次保存；日统计的 `hour_count` 是采样时次数，首末不完整天也保留，不能当作覆盖小时数。每日补录后按各要素有效时次的并集重新计数。
- 同批次重跑为 UPSERT；历史补数按日期/时次选最新，不能将新批次退回旧日期。
- 相同批次修订缩短时间范围时，删除仅属于本任务的多余行；含其他要素的多余行仅清空海浪指标，保留其他指标。
- 共享表的 `is_latest` 只有一个批次标识；海浪新批次不会与旧日期风场拼成同批预测。若页面要求风浪必须同批齐全，需要业务层另行定义。
- SQL 保存的是本地派生文件路径，不包含 `.nc` 本体。业务查询不依赖原始文件，但后续需要在另一机器重处理时，必须同步 `data/hws945/raw` 或重新下载。

使用 psql 时可执行（连接信息由你指定；推荐 `.pgpass`，不要把密码写进命令历史）：

```powershell
$env:PGCLIENTENCODING = 'UTF8'
psql -X -v ON_ERROR_STOP=1 -h YOUR_HOST -U YOUR_USER -d ship_monitoring `
  -f 'D:\深海项目\backend\data\hws945\exports\20260930_20261029\all_batches.sql'
```

也可用数据库客户端执行整个文件，必须支持 PostgreSQL 事务、DO 块及临时表，且同批 SQL 保持在同一会话内执行。
文件本身包含事务，不要在客户端强制只读模式下执行。组合脚本每个批次独立提交；后面的批次失败不会回滚前面已完成的批次。

## 每日自动入库

本次不执行 `import`，也不安装或启动计划任务。手动 SQL 更新完成后再启用。

1. 参考 `database.example.json` 配置 `database.local.json`。支持标准 libpq 参数，也可用 `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD` 环境变量覆盖。
2. 将 `daily.example.ps1` 复制为 `daily.local.ps1` 并检查 Python、配置和数据目录。
3. 可以先手动执行一次每日模式（此命令逐一检查六个要素，并对可用要素实际写库）：

```powershell
& 'D:\深海项目\backend\automation\hws945\run_daily.ps1'
```

4. 每天 08:30 自动运行的安装命令（安装时不立即运行）：

```powershell
& 'D:\深海项目\backend\automation\hws945\install_daily_task.ps1' -At '08:30'
```

触发时间使用 Windows 系统时区，本机应为中国标准时间。默认仅当前 Windows 用户登录时运行。
如需未登录也运行，可由你在 PowerShell 中使用 `-Credential (Get-Credential)` 安装；密码仅交给 Windows 任务计划程序，脚本不会打印。
任务错过触发时间后补跑，失败后每隔 30 分钟重试最多 3 次，同一任务不并发。

每日入口为 `daily.py --latest --datasets wind,wave`，逐个要素检查最近 7 天，分别寻找该要素的最新可用批次。
例如当日风向缺失但风速可用时，风速先处理；海浪三项正常时照常处理，风场不会阻塞海浪。
首次获取失败的要素没有成功状态，下次运行继续尝试；同批次后补某一项，只更新对应指标，不清空已入库的其他要素。
每个要素有独立状态，源版本、定义快照、处理器版本和目标数据库身份未变化时跳过；只在数据库 COMMIT 成功后记录成功。
快速分段不支持源文件格式/维度时，会回退完整文件下载；网络失败不会触发不完整结果入库。
最新可用数据有效期已经结束时拒绝自动入库；历史显式导出不受此限制。
失败和缺失记录在 `daily/report.json` 和 `daily/logs`，每项详细报告及状态在 `daily/elements/<element>/`。
汇总报告的 `latest_element_batches` 列出各要素实际批次，`skipped_count`/`failed_count` 记录未获取或失败项。
至少一项成功处理或确认已入库时，任务正常结束；六项均未成功时返回非零，交给计划任务重试。
任务名称沿用 `OceanMining-HWS945-Wave` 以兼容已经安装的任务，实际已尝试全部六项；已安装任务会自动调用更新后的 `run_daily.ps1`，无需另外创建一份任务。
输出目录锁、原始数据目录锁及数据库事务锁防止重复并发。
需要告警通知时，应由部署环境监控任务失败状态/退出码；此实现没有向外部人员发送通知。

只检查六个要素、不下载也不入库的命令：

```powershell
& 'D:\深海项目\backend\.venv-hws945\Scripts\python.exe' `
  'D:\深海项目\backend\automation\hws945\daily.py' --latest --probe-only --no-proxy `
  --source-config 'D:\深海项目\backend\automation\hws945\source.example.json' `
  --output-dir 'D:\深海项目\backend\data\hws945\daily_probe'
```

停止每日更新：

```powershell
& 'D:\深海项目\backend\automation\hws945\remove_daily_task.ps1'
```

## 验证

测试文件：`tests/test_pipeline.py`。普通测试验证完整源文件与分段提取计算一致、缺测值处理、
导出模式不连接/写入数据库、SQL 字符串转义。
设置 `HWS945_TEST_DSN` 后，可在独立测试库验证实际 SQL 的 ID 重映射、幂等性、
风场/洋流保留、历史补数不回退、基础资料变化时事务回滚。不要将该测试 DSN 指向业务库。

```powershell
& 'D:\深海项目\backend\.venv-hws945\Scripts\python.exe' -m unittest discover `
  -s 'D:\深海项目\backend\automation\hws945\tests' -v
```
