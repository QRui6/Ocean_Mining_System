# 预报 PDF 专报

## 下载接口

`GET /api/forecast/regions/{regionId}/bulletin/download?range=12h&format=pdf&variant=report`

- `range`：`12h`、`7d`、`15d`。
- `format` 默认 `pdf`。显式传 `txt` 仍可下载原始文本，兼容已有调用；气象预警中心的 TXT 下载不变。
- `variant=report`（默认）：正文、矢量趋势图、完整明细表，按内容自然分页，短报文通常 2 页 A4，长表格另起页。页面不显示报文编号、编制、运行批次、实际覆盖与数据状态信息，不附加资料与使用说明章节或图下注释。
- `variant=original`：按中文 PDF 排版，导出时过滤原文中的报文编号、运行批次、运行周期行，不修改数据库中保存的原文。精简空行，并避免章节标题单独落在页末。
- PDF 响应为 `application/pdf`，带 UTF-8 附件文件名及 `Cache-Control: no-store`。

摘要、峰值、趋势图和明细表基于同一份后端预报行集合生成，不依赖页面当前显示状态或截图。风速图仅显示区域平均与最大阵风；浪高、流速图仅显示区域平均，均不绘制区域最大曲线。正文与明细表仍保留最大值。缺测不补零，日期按时间距离排布；日级产品不推断日内峰值。没有足够风险指标时显示待评估。

## PDF 元数据

PDF 作者元数据可通过 Spring 配置设置（页面不显示编制信息）：

```yaml
forecast:
  report:
    issuer: 深海采矿海洋气象系统
```

分时数据展示北京时间 UTC+08:00；基准日期保留源标识。区域浪高最大值是区域网格聚合统计，不代表单个最大海浪。两类 PDF 页脚仅保留页码，不显示报文编号。

## 参考依据

- GB/T 19721.2—2017：https://std.samr.gov.cn/gb/search/gbDetailed?id=71F772D814B2D3A7E05397BE0A0AB82A
- GB/T 19721.6—2023：https://std.samr.gov.cn/gb/search/gbDetailed?id=FC816D04FF1C62EBE05397BE0A0AD5FA
- 中央气象台海洋天气公报：https://www.nmc.cn/publish/marine/forecast.htm

版式是面向本系统的业务专报设计，不表示已取得国家标准符合性认证。使用 PDFBox 3.0.8 生成，中文字体及授权随 JAR 打包，无需浏览器或操作系统字体。

## 验证与样例

```powershell
mvn test
mvn '-Dforecast.pdf.samples=target/pdf-samples' test
```

第二条命令额外生成 12h、7d、15d、缺测长名称及多页原文五份合成样例，用于 Poppler 渲染检查。样例不是实际预报。测试不连接业务数据库。

部署时需同时更新后端 JAR 和前端构建产物。只更新前端会遇到旧后端拒绝 PDF 格式；界面会显示下载错误。
