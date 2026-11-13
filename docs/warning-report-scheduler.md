# 自动预警报文服务

该服务不修改后端 JAR，直接读取当前后端的正式预警、小矿区预报和浮标接口，定时生成中文预警报文。

每轮任务会生成：

- 一份当前预警快照；
- 新增预警事件报文；
- 预警等级、指标或风险时间变化后的更新报文；
- 预警解除报文；
- `latest.json` 和 `index.json`，供前端展示自动报文档案；
- `state.json`，用于保存跨进程的预警状态和指纹。

服务不会静默触发浏览器下载，而是把文件保存到服务器目录，避免浏览器下载策略导致定时任务失效。

## 单次生成

```bash
cp scripts/warning-report-scheduler.env.example scripts/warning-report-scheduler.env
npm run warning:report:once
```

默认输出目录：

```text
/home/k8s/workspace/Ocean_Mining_System_0824/warning-reports
```

目录结构：

```text
warning-reports/
├── latest.json
├── index.json
├── state.json
├── snapshots/2026/08/25/预警快照_20260825_1100.txt
└── events/2026/08/25/预警事件_..._created_20260825_1100.txt
```

## 持续每小时运行

```bash
npm run warning:report
```

服务会立即生成一份报文，然后按照 `WARNING_REPORT_INTERVAL_MINUTES` 继续运行。

## 使用 systemd

```bash
cp scripts/warning-report-scheduler.env.example scripts/warning-report-scheduler.env
sudo cp deploy/warning-report-scheduler.service.example /etc/systemd/system/ocean-warning-report.service
sudo systemctl daemon-reload
sudo systemctl enable --now ocean-warning-report.service
sudo journalctl -u ocean-warning-report.service -f
```

停止服务：

```bash
sudo systemctl disable --now ocean-warning-report.service
```

## 解除判断

只有在对应数据源本轮请求成功时，才会把上一轮存在而本轮消失的预警判定为解除。如果正式预警、预报或浮标接口请求失败，本轮会保留上一轮状态，避免因为网络故障误生成解除报文。

当前管道风险记录只保存在浏览器本地，未纳入服务器定时任务；后续如需纳入，需要提供可被定时服务读取的接口或共享存储。
