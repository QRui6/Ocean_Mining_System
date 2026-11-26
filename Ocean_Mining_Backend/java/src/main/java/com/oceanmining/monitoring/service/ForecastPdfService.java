package com.oceanmining.monitoring.service;

import com.oceanmining.monitoring.dto.response.ForecastBulletinDTO;
import com.oceanmining.monitoring.dto.response.ForecastReportData;
import com.oceanmining.monitoring.dto.response.ForecastReportData.Point;
import com.oceanmining.monitoring.dto.response.ForecastSummaryDTO;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentInformation;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.function.Function;

/** Creates print-ready reports without a browser, screenshots or external rendering service. */
@Service
public class ForecastPdfService {
    private static final ZoneId REPORT_ZONE = ZoneId.of("Asia/Shanghai");
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final DateTimeFormatter SHORT_TIME = DateTimeFormatter.ofPattern("MM-dd HH:mm");
    private static final Color NAVY = new Color(22, 51, 79);
    private static final Color BLUE = new Color(34, 104, 151);
    private static final Color TEAL = new Color(15, 124, 130);
    private static final Color ORANGE = new Color(181, 96, 31);
    private static final Color INK = new Color(43, 53, 64);
    private static final Color MUTED = new Color(99, 113, 126);
    private static final Color PALE = new Color(240, 245, 249);
    private static final Color RULE = new Color(212, 222, 230);
    private static final Function<Point,BigDecimal> WIND_MAX=Point::windMax;
    private static final Function<Point,BigDecimal> WAVE_MAX=Point::waveMax;
    private static final Function<Point,BigDecimal> CURRENT_MAX=Point::currentMax;
    private final String issuer;

    public ForecastPdfService(
            @Value("${forecast.report.issuer:深海采矿海洋气象系统}") String issuer) {
        this.issuer = issuer;
    }

    public byte[] renderReport(ForecastReportData data) throws IOException {
        if (data.points().isEmpty()) throw new IllegalArgumentException("暂无可用于生成报文的预报数据。");
        ForecastSummaryDTO s = data.summary();
        try (Layout pdf = new Layout(text(s.getRegionName()), issuer)) {
            pdf.document.getDocumentInformation().setTitle("深海采矿海洋气象预报专报 - " + text(s.getRegionName()));
            cover(pdf, data);
            charts(pdf, data);
            details(pdf, data);
            return pdf.bytes();
        }
    }

    public String reportText(ForecastReportData data) {
        ForecastSummaryDTO summary=data.summary();
        StringBuilder out=new StringBuilder("深海采矿海洋气象预报专报\n");
        out.append("预报：").append(text(summary.getRegionName())).append("；经度：").append(text(summary.getLongitude())).append("；纬度：").append(text(summary.getLatitude())).append('\n');
        out.append("初始时间：").append(BulletinExportService.initialTime(summary.getBaseDate(),summary.getRunCycle())).append('\n');
        out.append("一、综合预报结论\n").append(conclusion(data));
        out.append("\n二、分项预报\n").append(String.join("\n",summaryParagraphs(summary)));
        out.append("\n三、峰值时段\n").append(peakTime(data,WIND_MAX,"风速")).append("；").append(peakTime(data,WAVE_MAX,"浪高")).append("；").append(peakTime(data,CURRENT_MAX,"流速"));
        out.append("\n四、作业提示\n").append(advice(data));
        out.append("\n五、风浪流变化趋势\n预报时间 | 平均风速(m/s) | 阵风(m/s) | 平均浪高(m) | 平均流速(m/s)\n");
        for(Point point:data.points())out.append(String.join(" | ",pointLabel(point,data.hourly(),true),value(point.windAvg()),value(point.gust()),value(point.waveAvg()),value(point.currentAvg()))).append('\n');
        out.append("\n六、预报数据明细\n预报时间 | 最大风速(m/s) | 最大浪高(m) | 浪周期(s) | 最大流速(m/s)\n");
        for(Point point:data.points())out.append(String.join(" | ",tableCells(point,data))).append('\n');
        return out.toString();
    }

    public byte[] renderText(String title, String content) throws IOException {
        if(title.contains("预警"))content=content.replaceAll("(?ms)^[ \\t]*七、数据说明[ \\t]*\\R.*?(?=^[一二三四五六七八九十]+、|\\z)","");
        try (Layout pdf = new Layout(title, issuer)) {
            pdf.document.getDocumentInformation().setTitle(title);
            pdf.continuationTitle = title + "（续）";
            if(title.contains("预警"))pdf.product="海洋气象预警";
            pdf.newPage(title);
            pdf.center(title,22,NAVY);
            pdf.y+=7;
            pdf.rule();
            for (String line : Objects.toString(content, "暂无数据").split("\\R", -1)) {
                String trimmed=line.replaceAll("^=+|=+$","").strip();
                if(trimmed.equals(title) || trimmed.isEmpty())continue;
                if(trimmed.matches("^[一二三四五六七八九十]+、.*"))pdf.section(trimmed);
                else pdf.paragraph(trimmed,10,INK);
            }
            return pdf.bytes();
        }
    }

    public byte[] renderWarning(com.oceanmining.monitoring.dto.response.WeatherWarningDetailDTO warning,ForecastReportData data) throws IOException {
        return renderWarning(warning,data,"深海采矿海洋气象预警专报",null,null);
    }

    public byte[] renderAnalysis(String content,com.fasterxml.jackson.databind.JsonNode report) throws IOException {
        boolean grid = report != null && "grid".equals(report.path("sourceType").asText());
        if(report==null || (!grid && !report.hasNonNull("forecastData")))return renderText("预警分析报文",content);
        ForecastSummaryDTO summary=new ForecastSummaryDTO();
        summary.setRegionName(report.path("regionName").asText("未提供")+(report.path("siteName").asText("").isBlank()?"":" / "+report.path("siteName").asText()));
        summary.setRangeLabel(grid ? "矿区评估" : "预报候选分析");
        var forecast=report.path("forecastData");
        var rows=forecast.path("hourlySeries");
        if(!rows.isArray()||rows.isEmpty())rows=forecast.path("series");
        if(rows.isArray()&&!rows.isEmpty()){
            var row=rows.get(0);
            String base=row.path("baseDate").asText("");
            if(!base.isBlank())summary.setBaseDate(java.time.LocalDate.parse(base.substring(0,10)));
            summary.setRunCycle(row.path("runCycle").asText(null));
        }
        var location=report.hasNonNull("site")?report.get("site"):report.path("region");
        var lng=location.hasNonNull("lng")?location.get("lng"):location.path("centerLng");
        var lat=location.hasNonNull("lat")?location.get("lat"):location.path("centerLat");
        if(lng.isNumber())summary.setLongitude(lng.decimalValue());
        if(lat.isNumber())summary.setLatitude(lat.decimalValue());
        var warning=new com.oceanmining.monitoring.dto.response.WeatherWarningDetailDTO();
        warning.setRegionName(summary.getRegionName());warning.setBaseDate(summary.getBaseDate());warning.setRunCycle(summary.getRunCycle());
        String severity=report.path("severity").asText("INFO");
        warning.setSeverity(com.oceanmining.monitoring.enums.WeatherWarningSeverity.valueOf(severity));
        warning.setTriggerDetail(report.path("triggerDetail"));
        warning.setBulletinText(report.path("bulletinText").asText(content));
        String initial = grid ? snapshotTime(report.path("sourceBase").asText()) : null;
        if (initial != null) initial += " UTC+08:00";
        String conclusion = grid ? report.path("warningMessage").asText(null) : null;
        if (report.path("stale").asBoolean()) conclusion = "该批预报已过期。";
        if (!grid && report.path("stale").asBoolean() && "EXPIRED".equals(report.path("status").asText())) {
            String start = snapshotTime(report.path("validFrom").asText());
            String end = snapshotTime(report.path("validUntil").asText());
            if (start != null && end != null) conclusion += "超限时段 " + start + " 至 " + end + " UTC+08:00。";
            if (report.path("initialTimeUnverified").asBoolean()) {
                initial = "待核对（批次 " + text(summary.getBaseDate()) + " " + text(summary.getRunCycle()) + "）";
            }
        }
        return renderWarning(warning,ForecastReportData.fromSnapshot(summary,forecast),
                grid ? "深海采矿海洋气象预警专报" : "深海采矿海洋气象预警分析",initial,conclusion);
    }

    private byte[] renderWarning(com.oceanmining.monitoring.dto.response.WeatherWarningDetailDTO warning,ForecastReportData data,
                                 String title,String initialTime,String conclusion) throws IOException {
        ForecastSummaryDTO summary=data.summary();
        try(Layout pdf=new Layout(text(summary.getRegionName()),issuer)) {
            pdf.document.getDocumentInformation().setTitle(title);
            pdf.continuationTitle="预警专报（续）";
            pdf.product="海洋气象预警";
            pdf.newPage("预警正文");
            pdf.center(title,22,NAVY);
            pdf.center(summary.getRangeLabel()+" · "+severity(warning.getSeverity()),11,MUTED);
            pdf.y+=7;pdf.rule();
            pdf.paragraph("预报："+text(summary.getRegionName())+"；经度："+text(summary.getLongitude())+"；纬度："+text(summary.getLatitude()),11,INK);
            pdf.paragraph("初始时间：" + (initialTime == null ? BulletinExportService.initialTime(warning.getBaseDate(),warning.getRunCycle())
                    : initialTime),9,MUTED);
            pdf.section("一、预警结论");
            pdf.paragraph(conclusion == null ? text(warning.getRegionName())+"在预报时段达到"+severity(warning.getSeverity())+"条件。" : conclusion,11,INK);
            pdf.section("二、触发条件");
            pdf.tableRow(new String[]{"指标","预测值","阈值","单位"},new float[]{150,111,111,111},26,NAVY,9,Color.WHITE);
            var triggers=warning.getTriggerDetail();
            var shown=new java.util.HashMap<Function<Point,BigDecimal>,BigDecimal>();
            int n=0;
            if(triggers!=null)for(var trigger:triggers) {
                String type=trigger.path("type").asText();
                Function<Point,BigDecimal> metric=switch(type){case "wind","风速"->WIND_MAX;case "wave","浪高"->WAVE_MAX;case "current","ocean_current","流速"->CURRENT_MAX;default->null;};
                if(metric!=null && trigger.hasNonNull("value"))shown.put(metric,new BigDecimal(trigger.get("value").asText()));
                String name=switch(type){case "wind","风速"->"风速";case "wave","浪高"->"浪高";case "current","ocean_current","流速"->"流速";default->type;};
                pdf.tableRow(new String[]{name,trigger.path("value").asText("未提供"),trigger.path("threshold").asText("未提供"),trigger.path("unit").asText("")},
                    new float[]{150,111,111,111},25,n++%2==0?Color.WHITE:PALE,10,INK);
            }
            pdf.section("三、影响评估");
            pdf.paragraph(sectionBody(warning.getBulletinText(),"影响评估","预报海况可能影响船舶定位、设备布放回收及管线稳定性。"),11,INK);
            pdf.section("四、处置建议");
            String advice=warning.getSeverity()==com.oceanmining.monitoring.enums.WeatherWarningSeverity.CRITICAL
                ?"暂停高风险作业，核查现场条件并按应急预案处置。":"加强现场值守，跟踪预报更新并核查作业条件。";
            pdf.paragraph(sectionBody(warning.getBulletinText(),"处置建议",sectionBody(warning.getBulletinText(),"作业建议",advice)),11,INK);
            if(data.points().isEmpty()) {
                pdf.section("五、风浪流变化趋势");
                pdf.paragraph("暂无同批次预报明细。",11,MUTED);
            }else {
                charts(pdf,data);
                details(pdf,data,shown,"触发条件");
            }
            return pdf.bytes();
        }
    }

    private static String snapshotTime(String value) {
        try {
            return dateTime(ZonedDateTime.parse(value));
        } catch (java.time.format.DateTimeParseException error) {
            return null;
        }
    }

    private static String sectionBody(String source,String title,String fallback) {
        var pattern=java.util.regex.Pattern.compile("(?ms)^[一二三四五六七八九十]+、"+title+"\\s*\\n(.*?)(?=^[一二三四五六七八九十]+、|^=+|\\z)");
        var match=pattern.matcher(Objects.toString(source,""));
        return match.find()?match.group(1).strip():fallback;
    }

    private static String severity(com.oceanmining.monitoring.enums.WeatherWarningSeverity value) {
        return value==null?"未提供":switch(value){case CRITICAL->"严重";case WARNING->"预警";default->"关注";};
    }

    public byte[] renderOriginal(ForecastBulletinDTO bulletin) throws IOException {
        try (Layout pdf = new Layout(text(bulletin.getRegionName()), issuer)) {
            pdf.document.getDocumentInformation().setTitle("原始预报报文 - " + text(bulletin.getRegionName()));
            pdf.continuationTitle = "原始预报报文（续）";
            pdf.newPage("原始预报报文");
            pdf.section("原始预报报文");
            pdf.y += 10;
            boolean paragraphBreak = false;
            for (String line : Objects.toString(bulletin.getBulletinText(), "暂无原始报文").split("\\R", -1)) {
                String trimmed = line.strip();
                // Filter presentation metadata at export time, including already stored bulletins.
                if (trimmed.matches("^(报文编号|运行批次|运行周期)\\s*[:：].*$")) continue;
                if (trimmed.isEmpty()) { paragraphBreak = true; continue; }
                if (paragraphBreak) pdf.y += 6;
                paragraphBreak = false;
                boolean heading = trimmed.matches("^[一二三四五六七八九十]+、.*");
                if (heading) pdf.ensure(55);
                pdf.paragraph(line, heading ? 11 : 10, heading ? NAVY : INK);
            }
            return pdf.bytes();
        }
    }

    private void cover(Layout pdf, ForecastReportData data) throws IOException {
        ForecastSummaryDTO s = data.summary();
        pdf.newPage("预报正文");
        pdf.center("深海采矿海洋气象预报专报", 22, NAVY);
        pdf.center(text(s.getRangeLabel()) + " · 区域风浪流预报", 11, MUTED);
        pdf.y += 7;
        pdf.rule();
        pdf.paragraph("预报：" + text(s.getRegionName()) + "；经度：" + text(s.getLongitude()) + "；纬度：" + text(s.getLatitude()), 11, INK);
        pdf.paragraph("初始时间：" + BulletinExportService.initialTime(s.getBaseDate(), s.getRunCycle()), 9, MUTED);

        pdf.section("一、综合预报结论");
        pdf.paragraph(conclusion(data), 11, INK);

        pdf.section("二、分项预报");
        for(String paragraph:summaryParagraphs(s))pdf.paragraph(paragraph,11,INK);
        pdf.section("三、峰值时段");
        pdf.paragraph(peakTime(data,WIND_MAX,"风速") + "；" + peakTime(data,WAVE_MAX,"浪高") + "；" + peakTime(data,CURRENT_MAX,"流速") + "。",11,INK);
        pdf.section("四、作业提示");
        pdf.paragraph(advice(data), 11, INK);
    }

    private static String conclusion(ForecastReportData data) {
        ForecastSummaryDTO s=data.summary();
        return "预计" + coverage(data) + "，" + text(s.getRegionName()) + "风、浪、流变化趋势分别为"
                + trend(s.getWindTrend()) + "、" + trend(s.getWaveTrend()) + "、" + trend(s.getCurrentTrend())
                + "。系统作业风险评估：" + risk(data) + "。";
    }

    private void charts(Layout pdf, ForecastReportData data) throws IOException {
        String introduction = (data.hourly() ? "分时预报" : "逐日预报") + " · " + text(data.summary().getRegionName())
                + " · " + coverage(data);
        // Flow the shorter report naturally instead of reserving a whole page for every part.
        if (pdf.y + 34 + pdf.paragraphHeight(introduction, 9) + 183 > Layout.BOTTOM) pdf.newPage("预报图表");
        pdf.continuationTitle = "预报图表（续）";
        pdf.section("五、风浪流变化趋势");
        pdf.paragraph(introduction, 9, MUTED);
        chart(pdf, data, "图1  风速变化", "m/s", List.of(
                new Curve("区域平均", Point::windAvg, BLUE),
                new Curve("最大阵风", Point::gust, ORANGE)));
        chart(pdf, data, "图2  区域浪高变化", "m", List.of(
                new Curve("区域平均", Point::waveAvg, TEAL)));
        chart(pdf, data, "图3  表层流速变化", "m/s", List.of(
                new Curve("区域平均", Point::currentAvg, BLUE)));
    }

    private record Curve(String name, Function<Point, BigDecimal> field, Color color) {}

    private void chart(Layout pdf, ForecastReportData data, String title, String unit, List<Curve> curves) throws IOException {
        pdf.ensure(183);
        float top = pdf.y;
        pdf.label(title + "（" + unit + "）", Layout.LEFT, top, 11, NAVY);
        float legendX = Layout.LEFT + 212;
        for (Curve curve : curves) {
            pdf.line(legendX, top - 3, legendX + 15, top - 3, curve.color(), 1.6f, false);
            pdf.label(curve.name(), legendX + 19, top, 8, MUTED);
            legendX += 88;
        }
        float x = Layout.LEFT + 38, y = top + 20, w = Layout.WIDTH - 51, h = 104;
        double max = curves.stream().flatMap(c -> data.points().stream().map(c.field()))
                .filter(Objects::nonNull).mapToDouble(BigDecimal::doubleValue).max().orElse(0);
        double ceiling = Math.max(1, Math.ceil(max * 1.18 * 10) / 10);
        for (int tick = 0; tick <= 4; tick++) {
            float py = y + h - h * tick / 4;
            pdf.line(x, py, x + w, py, RULE, .5f, false);
            pdf.label(String.format(Locale.ROOT, "%.1f", ceiling * tick / 4), Layout.LEFT, py + 3, 8, MUTED);
        }
        int count = data.points().size();
        for (int i = 0; i < count; i++) {
            if (i == 0 || i == count - 1 || i % Math.max(1, (int) Math.ceil(count / 5.0)) == 0) {
                String label = pointLabel(data.points().get(i), data.hourly(), false);
                float px = positionX(data, i, x, w);
                float labelWidth = pdf.width(label, 7);
                pdf.label(label, Math.max(x - 15, Math.min(x + w - labelWidth, px - labelWidth / 2)), y + h + 14, 7, MUTED);
            }
        }
        boolean hasData = false;
        long expectedStep = expectedStep(data);
        for (Curve curve : curves) {
            Float lastX = null, lastY = null;
            for (int i = 0; i < count; i++) {
                BigDecimal v = curve.field().apply(data.points().get(i));
                if (v == null) { lastX = null; lastY = null; continue; }
                hasData = true;
                float px = positionX(data, i, x, w), py = y + h - (float) (v.doubleValue() / ceiling * h);
                boolean gap = i > 0 && position(data.points().get(i), data.hourly())
                        - position(data.points().get(i - 1), data.hourly()) > expectedStep;
                if (lastX != null && !gap) pdf.line(lastX, lastY, px, py, curve.color(), 1.5f, false);
                pdf.dot(px, py, curve.color());
                lastX = px;
                lastY = py;
            }
        }
        if (!hasData) pdf.label("暂无有效预报数据", x + 135, y + h / 2, 11, MUTED);
        pdf.y = top + 181;
    }

    private static float positionX(ForecastReportData data, int index, float x, float width) {
        if (data.points().size() == 1) return x + width / 2;
        Point first = data.points().get(0), last = data.points().get(data.points().size() - 1);
        long start = position(first, data.hourly()), end = position(last, data.hourly());
        if (end == start) return x + width / 2;
        return x + (float) ((double) (position(data.points().get(index), data.hourly()) - start) / (end - start) * width);
    }

    private static long position(Point p, boolean hourly) {
        return hourly ? p.time().toEpochSecond() : p.date().toEpochDay();
    }

    private static long expectedStep(ForecastReportData data) {
        if (!data.hourly()) return 1;
        long step = Long.MAX_VALUE;
        for (int i = 1; i < data.points().size(); i++) {
            long delta = position(data.points().get(i), true) - position(data.points().get(i - 1), true);
            if (delta > 0) step = Math.min(step, delta);
        }
        return step;
    }

    private static boolean hasTimeGaps(ForecastReportData data) {
        long step = expectedStep(data);
        for (int i = 1; i < data.points().size(); i++) {
            long delta = position(data.points().get(i), data.hourly()) - position(data.points().get(i - 1), data.hourly());
            if (delta > step || delta <= 0) return true;
        }
        return false;
    }

    private void details(Layout pdf, ForecastReportData data) throws IOException {
        details(pdf,data,summaryMaxima(data),"分项预报");
    }

    private void details(Layout pdf,ForecastReportData data,java.util.Map<Function<Point,BigDecimal>,BigDecimal> shown,String reference) throws IOException {
        String units = "风速、流速：m/s；浪高：m；周期：s。";
        float[] widths = {119, 91, 91, 91, 91};
        float requiredHeight = 34 + pdf.paragraphHeight(units, 9) + 29;
        for (Point point : data.points()) requiredHeight += pdf.tableRowHeight(tableCells(point,data,shown,reference), widths, 24, 8);
        if (pdf.y + requiredHeight > Layout.BOTTOM) pdf.newPage("预报明细");
        pdf.continuationTitle = "预报明细（续）";
        pdf.section("六、预报数据明细");
        pdf.paragraph(units, 9, MUTED);
        tableHeader(pdf);
        int index = 0;
        for (Point p : data.points()) {
            String[] cells = tableCells(p,data,shown,reference);
            if (pdf.y + pdf.tableRowHeight(cells, widths, 24, 8) > Layout.BOTTOM) {
                pdf.newPage("预报明细（续）");
                pdf.section("预报数据明细（续）");
                tableHeader(pdf);
            }
            pdf.tableRow(cells, widths, 24, index++ % 2 == 0 ? Color.WHITE : PALE, 8, INK);
        }
    }

    private static java.util.Map<Function<Point,BigDecimal>,BigDecimal> summaryMaxima(ForecastReportData data) {
        var maxima=new java.util.HashMap<Function<Point,BigDecimal>,BigDecimal>();
        maxima.put(WIND_MAX,data.summary().getWindSpeedMax());
        maxima.put(WAVE_MAX,data.summary().getWaveHeightMax());
        maxima.put(CURRENT_MAX,data.summary().getCurrentSpeedMax());
        return maxima;
    }

    private static String[] tableCells(Point point,ForecastReportData data) {
        return tableCells(point,data,summaryMaxima(data),"分项预报");
    }

    private static String[] tableCells(Point p,ForecastReportData data,java.util.Map<Function<Point,BigDecimal>,BigDecimal> shown,String reference) {
        return new String[]{pointLabel(p,data.hourly(),true),detailMaximum(p,data,WIND_MAX,shown,reference),
                detailMaximum(p,data,WAVE_MAX,shown,reference),value(p.period()),detailMaximum(p,data,CURRENT_MAX,shown,reference)};
    }

    private static String detailMaximum(Point point,ForecastReportData data,Function<Point,BigDecimal> metric,java.util.Map<Function<Point,BigDecimal>,BigDecimal> shown,String reference) {
        Point peak=data.points().stream().filter(p->metric.apply(p)!=null).max(Comparator.comparing(metric)).orElse(null);
        return point.equals(peak) && shown.get(metric)!=null && metric.apply(point).compareTo(shown.get(metric))==0
                ?"见"+reference:value(metric.apply(point));
    }

    private static List<String> summaryParagraphs(ForecastSummaryDTO s) {
        return List.of(
            "风场：时段平均风速 "+value(s.getWindSpeedAvg())+" m/s，最大风速 "+value(s.getWindSpeedMax())+" m/s，最大阵风 "+value(s.getGustMax())+" m/s。",
            "海浪：时段平均浪高 "+value(s.getWaveHeightAvg())+" m，最大浪高 "+value(s.getWaveHeightMax())+" m，平均浪周期 "+value(s.getWavePeriodAvg())+" s。",
            "表层海流：时段平均流速 "+value(s.getCurrentSpeedAvg())+" m/s，最大流速 "+value(s.getCurrentSpeedMax())+" m/s。");
    }

    private void tableHeader(Layout pdf) throws IOException {
        pdf.tableRow(new String[]{"预报时间","最大风速","最大浪高","浪周期","最大流速"},
                new float[]{119,91,91,91,91},26,NAVY,8,Color.WHITE);
    }

    private static String peakTime(ForecastReportData data,Function<Point,BigDecimal> field,String name) {
        Point peak=data.points().stream().filter(p->field.apply(p)!=null).max(Comparator.comparing(field)).orElse(null);
        return peak==null?name+"缺测":name+"峰值出现在"+pointLabel(peak,data.hourly(),true);
    }

    private static String value(BigDecimal v) { return v == null ? "缺测" : v.setScale(1, RoundingMode.HALF_UP).toPlainString(); }
    private static String text(Object value) { return value == null ? "未提供" : value.toString(); }
    private static String dateTime(ZonedDateTime value) { return value == null ? "未提供" : DATE_TIME.format(value.withZoneSameInstant(REPORT_ZONE)); }
    private static String pointLabel(Point point, boolean hourly, boolean full) {
        return hourly ? (full ? DATE_TIME : SHORT_TIME).format(point.time().withZoneSameInstant(REPORT_ZONE))
                : full ? point.date().toString() : point.date().format(DateTimeFormatter.ofPattern("MM-dd"));
    }
    private static String coverage(ForecastReportData data) {
        return pointLabel(data.points().get(0), data.hourly(), true) + " 至 "
                + pointLabel(data.points().get(data.points().size() - 1), data.hourly(), true);
    }
    private static String trend(String trend) {
        return switch (Objects.toString(trend, "")) {
            case "UP" -> "上升";
            case "DOWN" -> "下降";
            case "STABLE" -> "平稳";
            default -> "待判断";
        };
    }
    private static boolean riskAvailable(ForecastReportData data) {
        return !hasTimeGaps(data) && data.points().stream().allMatch(p -> p.windMax() != null && p.waveMax() != null && p.currentMax() != null);
    }
    private static String risk(ForecastReportData data) {
        if (Boolean.TRUE.equals(data.summary().getStale())) return "预报已过期";
        if (!riskAvailable(data)) return "待评估（风险相关数据不完整）";
        return switch (Objects.toString(data.summary().getRiskLevel(), "")) {
            case "SAFE" -> "低风险";
            case "MODERATE" -> "注意";
            case "HIGH" -> "高风险";
            case "CRITICAL" -> "严重风险";
            default -> "待评估";
        };
    }
    private static String advice(ForecastReportData data) {
        if (Boolean.TRUE.equals(data.summary().getStale())) return "该批预报已过期，请关注后续预报与现场观测。";
        if (!riskAvailable(data)) return "风险相关数据不完整，暂不作出适宜作业判断。建议补齐数据，加强现场监测，并关注后续预报更新。";
        return switch (Objects.toString(data.summary().getRiskLevel(), "")) {
            case "SAFE" -> "现有系统阈值下评估为低风险。建议保持常规值守，结合现场监测及设备限值安排作业，持续关注后续预报。";
            case "MODERATE" -> "建议加强值守和预报跟踪，关注风浪流峰值时段，为敏感作业预留调整时间。";
            case "HIGH" -> "建议谨慎安排高风险作业，加强船舶、管线和设备状态检查，按现场作业规程做好调整准备。";
            case "CRITICAL" -> "建议暂停高风险海上作业，按应急预案加强值守和避险；恢复作业前应核对后续预报与现场监测。";
            default -> "当前风险等级未明确，请结合现场监测与后续预报审慎安排作业。";
        };
    }
    private static String peak(ForecastReportData data, Function<Point, BigDecimal> field, String name, String unit) {
        Point peak = data.points().stream().filter(p -> field.apply(p) != null)
                .max(Comparator.comparing(field)).orElse(null);
        return peak == null ? name + "缺测" : name + " " + value(field.apply(peak)) + " " + unit
                + "（" + pointLabel(peak, data.hourly(), true) + "）";
    }

    /** Coordinates use points measured from the top of the A4 page. */
    private static final class Layout implements AutoCloseable {
        static final float LEFT = 56, WIDTH = 483, BOTTOM = 773;
        final PDDocument document = new PDDocument();
        final String region;
        final PDType0Font font;
        PDPageContentStream stream;
        float y;
        String continuationTitle = "预报专报（续）";
        String product = "海洋气象预报";

        Layout(String region, String author) throws IOException {
            this.region = region;
            try (InputStream input = ForecastPdfService.class.getResourceAsStream("/fonts/ReportSans-Regular.ttf")) {
                if (input == null) throw new IOException("PDF中文字体资源缺失：fonts/ReportSans-Regular.ttf");
                font = PDType0Font.load(document, input, true);
            } catch (IOException | RuntimeException e) {
                document.close();
                throw e;
            }
            PDDocumentInformation info = document.getDocumentInformation();
            info.setAuthor(author);
            info.setCreator("Ocean Mining System / Apache PDFBox");
            info.setSubject("区域海洋气象预报；北京时间 UTC+08:00；系统自动生成");
        }

        void newPage(String title) throws IOException {
            if (stream != null) stream.close();
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);
            stream = new PDPageContentStream(document, page);
            label(product + " | " + title, LEFT, 34, 8, MUTED);
            String heading = region;
            while (width(heading, 8) > 210) heading = heading.substring(0, heading.offsetByCodePoints(0, heading.codePointCount(0, heading.length()) - 1));
            if (!heading.equals(region)) heading += "…";
            label(heading, LEFT + WIDTH - width(heading, 8), 34, 8, MUTED);
            line(LEFT, 45, LEFT + WIDTH, 45, RULE, .6f, false);
            y = 79;
        }

        void ensure(float height) throws IOException {
            if (y + height > BOTTOM) newPage(continuationTitle);
        }

        void section(String title) throws IOException {
            ensure(74);
            y += 12;
            rect(LEFT, y - 12, 3, 16, BLUE);
            label(title, LEFT + 11, y, 13, NAVY);
            y += 22;
        }

        void center(String text, float size, Color color) throws IOException {
            for (String line : wrap(text, size, WIDTH)) {
                ensure(size * 1.6f);
                label(line, LEFT + (WIDTH - width(line, size)) / 2, y, size, color);
                y += size * 1.6f;
            }
        }

        void rule() throws IOException {
            line(LEFT, y - 8, LEFT + WIDTH, y - 8, BLUE, 1.2f, false);
            y += 10;
        }

        void paragraph(String text, float size, Color color) throws IOException {
            for (String line : wrap(text, size, WIDTH)) {
                ensure(size * 1.65f);
                label(line, LEFT, y, size, color);
                y += size * 1.65f;
            }
            y += 4;
        }

        float paragraphHeight(String text, float size) throws IOException {
            return wrap(text, size, WIDTH).size() * size * 1.65f + 4;
        }

        List<String> wrap(String value, float size, float limit) throws IOException {
            List<String> lines = new ArrayList<>();
            StringBuilder line = new StringBuilder();
            for (int code : clean(value).codePoints().toArray()) {
                String letter = new String(Character.toChars(code));
                if (!line.isEmpty() && width(line + letter, size) > limit) {
                    lines.add(line.toString());
                    line.setLength(0);
                }
                line.append(letter);
            }
            lines.add(line.toString());
            return lines;
        }

        String clean(String value) throws IOException {
            StringBuilder result = new StringBuilder();
            for (int code : Objects.toString(value, "").codePoints().toArray()) {
                if (Character.isISOControl(code)) { result.append(' '); continue; }
                String letter = new String(Character.toChars(code));
                try { font.encode(letter); result.append(letter); }
                catch (IllegalArgumentException e) { result.append('?'); }
            }
            return result.toString();
        }

        float width(String value, float size) throws IOException { return font.getStringWidth(clean(value)) / 1000 * size; }

        void label(String value, float x, float top, float size, Color color) throws IOException {
            stream.beginText();
            stream.setFont(font, size);
            stream.setNonStrokingColor(color);
            stream.newLineAtOffset(x, PDRectangle.A4.getHeight() - top);
            stream.showText(clean(value));
            stream.endText();
        }

        void line(float x1, float y1, float x2, float y2, Color color, float width, boolean dashed) throws IOException {
            stream.setStrokingColor(color);
            stream.setLineWidth(width);
            stream.setLineDashPattern(dashed ? new float[]{4, 3} : new float[]{}, 0);
            stream.moveTo(x1, PDRectangle.A4.getHeight() - y1);
            stream.lineTo(x2, PDRectangle.A4.getHeight() - y2);
            stream.stroke();
        }

        void rect(float x, float top, float width, float height, Color color) throws IOException {
            stream.setNonStrokingColor(color);
            stream.addRect(x, PDRectangle.A4.getHeight() - top - height, width, height);
            stream.fill();
        }

        void dot(float x, float y, Color color) throws IOException { rect(x - 1.6f, y - 1.6f, 3.2f, 3.2f, color); }

        float tableRowHeight(String[] cells, float[] widths, float height, float size) throws IOException {
            float actualHeight = height;
            for (int i = 0; i < cells.length; i++) {
                actualHeight = Math.max(actualHeight, wrap(cells[i], size, widths[i] - 10).size() * 13 + 12);
            }
            return actualHeight;
        }

        void tableRow(String[] cells, float[] widths, float height, Color background, float size, Color color) throws IOException {
            float actualHeight = tableRowHeight(cells, widths, height, size);
            rect(LEFT, y - 13, WIDTH, actualHeight, background);
            float x = LEFT;
            for (int i = 0; i < cells.length; i++) {
                List<String> lines = wrap(cells[i], size, widths[i] - 10);
                for (int j = 0; j < lines.size(); j++) label(lines.get(j), x + 5, y + j * 13, size, color);
                x += widths[i];
            }
            line(LEFT, y - 13 + actualHeight, LEFT + WIDTH, y - 13 + actualHeight, RULE, .4f, false);
            y += actualHeight;
        }

        byte[] bytes() throws IOException {
            stream.close();
            stream = null;
            int total = document.getNumberOfPages();
            for (int i = 0; i < total; i++) {
                stream = new PDPageContentStream(document, document.getPage(i), PDPageContentStream.AppendMode.APPEND, true, true);
                line(LEFT, 793, LEFT + WIDTH, 793, RULE, .6f, false);
                String page = "第 " + (i + 1) + " 页 / 共 " + total + " 页";
                label(page, LEFT + WIDTH - width(page, 8), 810, 8, MUTED);
                stream.close();
                stream = null;
            }
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            document.save(output);
            return output.toByteArray();
        }

        @Override public void close() throws IOException {
            try { if (stream != null) stream.close(); }
            finally { document.close(); }
        }
    }
}
