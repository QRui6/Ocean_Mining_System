package com.oceanmining.monitoring.service;

import org.junit.jupiter.api.Test;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import java.time.LocalDate;
import static org.junit.jupiter.api.Assertions.*;

class BulletinExportServiceTest {
    @Test void initialTimeUsesForecastCycleAndHandlesUnknownCycle() {
        assertEquals("2026-11-14 20:00 UTC+08:00", BulletinExportService.initialTime(LocalDate.of(2026,11,14), "t12"));
        assertEquals("未提供", BulletinExportService.initialTime(LocalDate.of(2026,11,14), "bad"));
    }
    @Test void warningPdfPreservesChineseAndPaginates() throws Exception {
        String content = "初始时间：2026-11-14 20:00 UTC+08:00\n" + "风速超限，暂停设备布放。\n".repeat(100);
        try (var document = Loader.loadPDF(new ForecastPdfService("测试").renderText("预警分析报文", content))) {
            String text = new PDFTextStripper().getText(document);
            assertTrue(document.getNumberOfPages() > 1);
            assertTrue(text.contains("初始时间：2026-11-14 20:00"));
            assertEquals(100, text.split("风速超限，暂停设备布放。", -1).length - 1);
        }
    }
}
