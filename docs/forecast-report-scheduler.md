# 自动预报报文服务

该服务不修改后端 JAR，直接调用当前已经可用的矿区总览接口，定时生成中文预报报文。

报文包含：

- 报文生成时间和后端预报基准时间；
- 所有大区域的未来 12 小时、未来 7 天、未来 15 天概览；
- 各大区域逐时和逐日预报；
- 各大区域下达到重点阈值的小矿区提醒；
- 重点小矿区的重点时段、风浪流指标和作业建议；
- 接口失败、预报基准过期等数据质量提醒。

所有结论只使用接口真实返回的数据。当前后端预报基准已经过期时，报文会明确提示并停止生成“安全”类作业结论。

## 单次生成

在项目根目录执行：

```bash
npm run forecast:report:once
```

默认报文目录为：

```text
/home/k8s/workspace/Ocean_Mining_System_0824/forecast-reports
```

也可以临时指定接口地址和输出目录：

```bash
FORECAST_API_BASE_URL=http://121.194.93.61:8082 \
FORECAST_REPORT_OUTPUT_DIR=/tmp/forecast-reports \
npm run forecast:report:once
```

## 持续每小时运行

先复制配置文件：

```bash
cp scripts/forecast-report-scheduler.env.example scripts/forecast-report-scheduler.env
```

然后启动：

```bash
npm run forecast:report
```

该进程会立即生成一份报文，之后每 60 分钟生成一份。周期可以在配置文件中通过 `FORECAST_REPORT_INTERVAL_MINUTES` 调整。

## 使用 systemd 长期运行

复制配置和服务模板：

```bash
cp scripts/forecast-report-scheduler.env.example scripts/forecast-report-scheduler.env
sudo cp deploy/forecast-report-scheduler.service.example /etc/systemd/system/ocean-forecast-report.service
sudo systemctl daemon-reload
sudo systemctl enable --now ocean-forecast-report.service
```

查看运行日志：

```bash
sudo journalctl -u ocean-forecast-report.service -f
```

停止服务：

```bash
sudo systemctl disable --now ocean-forecast-report.service
```

每次成功生成后，目录中会出现类似文件：

```text
预报报文_20260825_1100.txt
latest.json
```

当前服务负责生成和保存报文，不会触发浏览器下载。后续可以在前端增加“自动报文列表”读取 `latest.json` 或由静态文件服务器暴露该目录。
