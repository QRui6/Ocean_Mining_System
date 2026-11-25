package com.oceanmining.monitoring.service;

import com.oceanmining.monitoring.dto.response.ForecastBulletinDTO;
import com.oceanmining.monitoring.dto.response.ForecastReportData;
import com.oceanmining.monitoring.dto.response.ForecastReportData.Point;
import com.oceanmining.monitoring.dto.response.ForecastSummaryDTO;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;
import com.fasterxml.jackson.databind.ObjectMapper;

import static org.junit.jupiter.api.Assertions.*;

class ForecastPdfServiceTest {
    private final ForecastPdfService service = new ForecastPdfService("版式演示（合成数据）");

    @ParameterizedTest
    @CsvSource({"12h,13,true", "7d,7,false", "15d,15,false"})
    void createsSearchableA4ReportsWithOriginalSectionsAndUniqueDetails(String range, int count, boolean hourly) throws Exception {
        byte[] bytes = service.renderReport(sample(range, count, hourly));
        saveSample("forecast-" + range + ".pdf", bytes);
        try (PDDocument pdf = Loader.loadPDF(bytes)) {
            assertTrue(pdf.getNumberOfPages() >= 1 && pdf.getNumberOfPages() <= 5, "Reports should paginate according to content");
            String text = new PDFTextStripper().getText(pdf);
            assertTrue(text.contains("深海采矿海洋气象预报专报"));
            assertTrue(text.contains("太平洋克拉里昂"));
            assertTrue(text.contains("UTC+08:00"));
            assertTrue(text.contains("风速变化"));
            assertTrue(text.contains("二、分项预报"));
            assertTrue(text.contains("三、峰值时段"));
            assertTrue(text.contains("初始时间："));
            assertFalse(text.contains("生成时间："));
            assertTrue(text.contains("六、预报数据明细"));
            assertTrue(pdf.getDocumentInformation().getAuthor().contains("合成数据"));
            assertReportRemoved(text);
            if (hourly) assertTrue(text.contains("2026-10-29 08:00"), "UTC forecast timestamps must become Beijing time");
            for (var page : pdf.getPages()) {
                assertEquals(PDRectangle.A4.getWidth(), page.getMediaBox().getWidth());
                for (var fontName : page.getResources().getFontNames()) assertTrue(page.getResources().getFont(fontName).isEmbedded());
                assertFalse(page.getResources().getXObjectNames().iterator().hasNext(), "Charts must be vector graphics, not screenshots");
            }
        }
    }

    @Test
    void missingRiskInputsDoNotBecomeZeroOrSafeAndLongNamesWrap() throws Exception {
        ForecastReportData full = sample("15d", 5, false);
        full.summary().setDataComplete(false);
        full.summary().setRiskLevel("SAFE");
        full.summary().setRegionName("太平洋克拉里昂—克利珀顿断裂带深海多金属结核试验采矿区（东部联合监测区域与周边作业保障海域）");
        List<Point> rows = new ArrayList<>(full.points());
        Point p = rows.get(2);
        rows.set(2, new Point(p.date(), p.time(), null, null, null, null, null, null, null, null, 0));
        byte[] bytes = service.renderReport(new ForecastReportData(full.summary(), rows, false));
        saveSample("forecast-incomplete.pdf", bytes);
        try (PDDocument pdf = Loader.loadPDF(bytes)) {
            String text = new PDFTextStripper().getText(pdf);
            assertTrue(text.contains("待评估"));
            assertTrue(text.contains("缺测"));
            assertFalse(text.contains("低风险"));
            assertTrue(text.contains("2026-11-02"));
            assertFalse(text.contains("2026-11-12"), "Do not invent the missing forecast days");
        }
    }

    @Test
    void originalReportPreservesTextAndPaginates() throws Exception {
        ForecastBulletinDTO bulletin = new ForecastBulletinDTO();
        bulletin.setRegionName("太平洋演示区");
        bulletin.setRegionCode("PAC");
        bulletin.setTimeRange("12h");
        bulletin.setRunCycle("00");
        bulletin.setBaseDate(LocalDate.of(2026, 10, 29));
        bulletin.setCreatedAt(ZonedDateTime.of(2026, 10, 29, 0, 0, 0, 0, ZoneOffset.UTC));
        bulletin.setBulletinText("原文开始\n报文编号：SHOULD-NOT-APPEAR\n运行批次: t12\n运行周期：t12\n"
                + "这是原始报文的完整文本，保留风速、浪高与流速描述。\n".repeat(90) + "原文结束");
        byte[] bytes = service.renderOriginal(bulletin);
        saveSample("forecast-original.pdf", bytes);
        try (PDDocument pdf = Loader.loadPDF(bytes)) {
            assertTrue(pdf.getNumberOfPages() > 1);
            String text = new PDFTextStripper().getText(pdf);
            assertTrue(text.contains("原文开始"));
            assertTrue(text.contains("原文结束"));
            assertFalse(text.contains("PDF生成时间"));
            assertTrue(text.contains("第 2 页 / 共"));
            assertOriginalRemoved(text);
        }
    }

    @Test
    void allMissingChartsAndRealZeroValuesCanBeExported() throws Exception {
        ForecastReportData full = sample("12h", 1, true);
        Point p = full.points().get(0);
        for (BigDecimal value : new BigDecimal[]{null, BigDecimal.ZERO}) {
            var data = new ForecastReportData(full.summary(), List.of(new Point(p.date(), p.time(), value, value,
                    value, value, value, value, value, value, null)), true);
            try (PDDocument pdf = Loader.loadPDF(service.renderReport(data))) {
                String text = new PDFTextStripper().getText(pdf);
                assertTrue(text.contains(value == null ? "缺测" : "0.0"));
            }
        }
    }

    @Test
    void omittedDatesAreReportedAsGapsEvenIfTheSummaryClaimsComplete() throws Exception {
        ForecastReportData full = sample("7d", 7, false);
        List<Point> points = new ArrayList<>(full.points());
        points.remove(3);
        try (PDDocument pdf = Loader.loadPDF(service.renderReport(new ForecastReportData(full.summary(), points, false)))) {
            String text = new PDFTextStripper().getText(pdf);
            assertTrue(text.contains("待评估"));
        }
    }

    @Test
    @EnabledIfSystemProperty(named = "forecast.pdf.fixture-dir", matches = ".+")
    void rendersCapturedPacificForecastWithoutConnectingToTheDatabase() throws Exception {
        var mapper = new ObjectMapper().findAndRegisterModules();
        Path root = Path.of(System.getProperty("forecast.pdf.fixture-dir"));
        ForecastSummaryDTO summary = mapper.treeToValue(mapper.readTree(root.resolve("summary.json").toFile()).get("data"), ForecastSummaryDTO.class);
        var hourly = mapper.treeToValue(mapper.readTree(root.resolve("hourly.json").toFile()).get("data"),
                com.oceanmining.monitoring.dto.response.RegionForecastHourlyDTO[].class);
        var original = mapper.treeToValue(mapper.readTree(root.resolve("bulletin.json").toFile()).get("data"), ForecastBulletinDTO.class);
        var renderer = new ForecastPdfService("深海采矿海洋气象系统");
        byte[] report = renderer.renderReport(new ForecastReportData(summary,
                java.util.Arrays.stream(hourly).map(Point::from).toList(), true));
        byte[] raw = renderer.renderOriginal(original);
        saveSample("pacific-report-12h.pdf", report);
        saveSample("pacific-original-12h.pdf", raw);
        try (PDDocument pdf = Loader.loadPDF(report); PDDocument originalPdf = Loader.loadPDF(raw)) {
            assertReportRemoved(new PDFTextStripper().getText(pdf));
            assertOriginalRemoved(new PDFTextStripper().getText(originalPdf));
            assertEquals(2, pdf.getNumberOfPages(), "The user's short report should flow onto two pages");
            assertEquals(1, originalPdf.getNumberOfPages(), "The user's short original bulletin should fit one page");
        }
    }

    @Test
    void snapshotRejectsOtherBatchesAndRetainsDistinctEqualValues() throws Exception {
        var summary=new ForecastSummaryDTO();summary.setBaseDate(LocalDate.of(2026,10,28));summary.setRunCycle("t12");
        var rows=new ObjectMapper().readTree("{\"series\":[{\"baseDate\":\"2026-10-27\",\"runCycle\":\"t12\",\"forecastDate\":\"2026-10-29\",\"waveHeightMax\":9},{\"baseDate\":\"2026-10-28\",\"runCycle\":\"t12\",\"forecastDate\":\"2026-10-29\",\"waveHeightMax\":3},{\"baseDate\":\"2026-10-28\",\"runCycle\":\"t12\",\"forecastDate\":\"2026-10-30\",\"waveHeightMax\":3}]}");
        var report=ForecastReportData.fromSnapshot(summary,rows);
        assertEquals(2,report.points().size());
        assertEquals(0,new BigDecimal("3").compareTo(report.points().get(0).waveMax()));
        assertNotEquals(report.points().get(0).date(),report.points().get(1).date());
    }

    @Test
    void warningUsesReportLayoutAndReferencesOnlyDisplayedTriggerValues() throws Exception {
        var data=sample("7d",7,false);
        var warning=new com.oceanmining.monitoring.dto.response.WeatherWarningDetailDTO();
        warning.setRegionName(data.summary().getRegionName());warning.setBaseDate(data.summary().getBaseDate());warning.setRunCycle(data.summary().getRunCycle());
        warning.setSeverity(com.oceanmining.monitoring.enums.WeatherWarningSeverity.WARNING);
        warning.setTriggerDetail(new ObjectMapper().readTree("[{\"type\":\"wave\",\"value\":"+data.summary().getWaveHeightMax()+",\"threshold\":4,\"unit\":\"m\"}]"));
        warning.setBulletinText("三、影响评估\n影响设备布放。\n四、处置建议\n核查作业条件。\n七、数据说明\n本预警由数据库中的最新风、浪、表层洋流预测数据自动检测生成。 当前时段数据完整。");
        try(var pdf=Loader.loadPDF(service.renderWarning(warning,data))) {
            String text=new PDFTextStripper().getText(pdf);
            assertTrue(text.contains("海洋气象预警专报"));
            assertTrue(text.contains("见触发条件"));
            assertFalse(text.contains("见分项预报"));
            assertTrue(text.contains("风速变化"));
            assertTrue(text.contains("六、预报数据明细"));
            assertTrue(text.contains("影响设备布放。"));
            assertTrue(text.contains("核查作业条件。"));
            assertFalse(text.contains("数据说明"));
            assertFalse(text.contains("自动检测生成"));
        }
    }

    @Test
    void textOnlyWarningOmitsDataNotesAndKeepsOtherSections() throws Exception {
        String content="一、预警结论\n浪高超限。\n四、处置建议\n暂停布放。\n七、数据说明\n本预警由数据库中的最新风、浪、表层洋流预测数据自动检测生成。 当前时段数据完整。";
        try(var pdf=Loader.loadPDF(service.renderText("预警分析报文",content))) {
            String text=new PDFTextStripper().getText(pdf);
            assertTrue(text.contains("浪高超限。"));
            assertTrue(text.contains("暂停布放。"));
            assertFalse(text.contains("数据说明"));
            assertFalse(text.contains("自动检测生成"));
        }
    }

    private static void assertReportRemoved(String text) {
        for (String removed : List.of("报文编号", "运行批次", "编制：", "实际预报覆盖", "数据状态",
                "7天、15天产品用于趋势研判", "注：折线连接已有预报点", "日级图表仅表示每日统计值", "资料与使用说明", "HY-")) {
            assertFalse(text.contains(removed), removed);
        }
    }

    private static void assertOriginalRemoved(String text) {
        for (String removed : List.of("报文编号", "运行批次", "运行周期", "SHOULD-NOT-APPEAR",
                "以下保留系统原始报文内容", "HY-")) assertFalse(text.contains(removed), removed);
    }

    private static void saveSample(String name, byte[] bytes) throws Exception {
        String output = System.getProperty("forecast.pdf.samples");
        if (output != null) {
            Files.createDirectories(Path.of(output));
            Files.write(Path.of(output, name), bytes);
        }
    }

    private static BigDecimal n(double value) { return BigDecimal.valueOf(value); }

    static ForecastReportData sample(String range, int count, boolean hourly) {
        ForecastSummaryDTO s = new ForecastSummaryDTO();
        s.setRegionName("太平洋克拉里昂—克利珀顿矿区");
        s.setRegionCode("PAC-CCZ");
        s.setBaseDate(LocalDate.of(2026, 10, 29));
        s.setRunCycle("00");
        s.setTimeRange(range);
        s.setRangeLabel(hourly ? "未来12小时" : "未来" + range.replace("d", "天"));
        s.setDataComplete(true);
        s.setDataPointCount(count);
        s.setWindSpeedAvg(n(8.6)); s.setWindSpeedMax(n(14)); s.setGustMax(n(18));
        s.setWaveHeightAvg(n(1.9)); s.setWaveHeightMax(n(3.2)); s.setWavePeriodAvg(n(7.4));
        s.setCurrentSpeedAvg(n(.5)); s.setCurrentSpeedMax(n(.9));
        s.setWindTrend("UP"); s.setWaveTrend("STABLE"); s.setCurrentTrend("DOWN"); s.setRiskLevel("MODERATE");
        List<Point> points = new ArrayList<>();
        ZonedDateTime start = ZonedDateTime.of(2026, 10, 29, 0, 0, 0, 0, ZoneOffset.UTC);
        for (int i = 0; i < count; i++) {
            double wave = 1.6 + Math.sin(i * .6) * .6;
            points.add(new Point(start.toLocalDate().plusDays(hourly ? 0 : i), hourly ? start.plusHours(i) : null,
                    n(7 + Math.sin(i * .6) * 2), n(11 + Math.sin(i * .6) * 3), n(15 + Math.sin(i * .6) * 3),
                    n(wave), n(wave + 1), n(7.4), n(.5 + Math.cos(i * .6) * .1), n(.8 + Math.cos(i * .6) * .1), hourly ? null : 24));
        }
        // The preview must be internally consistent too: derive its summary from its rows.
        s.setWindSpeedAvg(avg(points, Point::windAvg)); s.setWindSpeedMax(max(points, Point::windMax));
        s.setGustMax(max(points, Point::gust));
        s.setWaveHeightAvg(avg(points, Point::waveAvg)); s.setWaveHeightMax(max(points, Point::waveMax));
        s.setCurrentSpeedAvg(avg(points, Point::currentAvg)); s.setCurrentSpeedMax(max(points, Point::currentMax));
        s.setWindTrend(trend(points, Point::windAvg)); s.setWaveTrend(trend(points, Point::waveAvg));
        s.setCurrentTrend(trend(points, Point::currentAvg));
        s.setRiskLevel("SAFE");
        return new ForecastReportData(s, points, hourly);
    }

    private static BigDecimal avg(List<Point> points, Function<Point, BigDecimal> field) {
        return BigDecimal.valueOf(points.stream().map(field).mapToDouble(BigDecimal::doubleValue).average().orElseThrow());
    }

    private static BigDecimal max(List<Point> points, Function<Point, BigDecimal> field) {
        return points.stream().map(field).max(BigDecimal::compareTo).orElseThrow();
    }

    private static String trend(List<Point> points, Function<Point, BigDecimal> field) {
        double difference = field.apply(points.get(points.size() - 1)).doubleValue() - field.apply(points.get(0)).doubleValue();
        return Math.abs(difference) < .05 ? "STABLE" : difference > 0 ? "UP" : "DOWN";
    }
}
