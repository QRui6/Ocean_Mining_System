package com.oceanmining.monitoring.controller;

import com.oceanmining.monitoring.dto.response.ForecastBulletinDTO;
import com.oceanmining.monitoring.dto.response.ForecastReportData;
import com.oceanmining.monitoring.dto.response.ForecastSummaryDTO;
import com.oceanmining.monitoring.enums.ForecastRange;
import com.oceanmining.monitoring.exception.GlobalExceptionHandler;
import com.oceanmining.monitoring.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ForecastPdfDownloadTest {
    private final ForecastDataService forecasts = mock(ForecastDataService.class);
    private final ForecastBulletinService bulletins = mock(ForecastBulletinService.class);
    private final ForecastPdfService pdf = mock(ForecastPdfService.class);
    private MockMvc mvc;

    @BeforeEach void setup() {
        mvc = MockMvcBuilders.standaloneSetup(new ForecastController(forecasts, bulletins,
                mock(MiningOverviewService.class), pdf, mock(TargetForecastService.class)))
                .setControllerAdvice(new GlobalExceptionHandler()).build();
    }

    @Test void defaultDownloadIsAnUncachedPdfAttachmentFromOneSnapshot() throws Exception {
        var summary = new ForecastSummaryDTO();
        summary.setRegionName("太平洋"); summary.setBaseDate(LocalDate.of(2026, 10, 29)); summary.setTimeRange("7d");
        var snapshot = new ForecastReportData(summary, List.of(), false);
        when(forecasts.getReportData(5L, ForecastRange.DAYS_7)).thenReturn(snapshot);
        byte[] content = "%PDF-test".getBytes(StandardCharsets.US_ASCII);
        when(pdf.renderReport(snapshot)).thenReturn(content);
        mvc.perform(get("/api/forecast/regions/5/bulletin/download").param("range", "7d"))
                .andExpect(status().isOk()).andExpect(content().contentType("application/pdf"))
                .andExpect(content().bytes(content))
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("filename*=UTF-8''")))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString(".pdf")));
        verifyNoInteractions(bulletins);
    }

    @Test void originalPdfUsesStoredOriginalText() throws Exception {
        var original = new ForecastBulletinDTO(); original.setRegionName("原文区域");
        when(bulletins.getOrCreate(5L, ForecastRange.HOURS_12)).thenReturn(original);
        when(pdf.renderOriginal(original)).thenReturn("%PDF-original".getBytes(StandardCharsets.US_ASCII));
        mvc.perform(get("/api/forecast/regions/5/bulletin/download").param("variant", "original"))
                .andExpect(status().isOk()).andExpect(content().contentType("application/pdf"));
        verifyNoInteractions(forecasts);
        verify(pdf).renderOriginal(original);
    }

    @Test void explicitTxtRemainsCompatibleWithExistingCallers() throws Exception {
        var original = new ForecastBulletinDTO(); original.setBulletinText("原始文本");
        when(bulletins.getOrCreate(5L, ForecastRange.HOURS_12)).thenReturn(original);
        mvc.perform(get("/api/forecast/regions/5/bulletin/download").param("format", "txt"))
                .andExpect(status().isOk()).andExpect(content().contentTypeCompatibleWith("text/plain"))
                .andExpect(content().string("原始文本"));
        verifyNoInteractions(pdf);
    }

    @Test void invalidExportParametersAreRejectedBeforeAccessingData() throws Exception {
        mvc.perform(get("/api/forecast/regions/5/bulletin/download").param("variant", "invalid"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/forecast/regions/5/bulletin/download").param("format", "exe"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(forecasts, bulletins, pdf);
    }
}
