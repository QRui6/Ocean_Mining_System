package com.oceanmining.monitoring.controller;

import com.oceanmining.monitoring.dto.response.ApiResponse;
import com.oceanmining.monitoring.dto.response.WarningStatsDTO;
import com.oceanmining.monitoring.dto.response.WeatherWarningDetailDTO;
import com.oceanmining.monitoring.dto.response.WeatherWarningPageDTO;
import com.oceanmining.monitoring.enums.ForecastRange;
import com.oceanmining.monitoring.enums.WeatherWarningSeverity;
import com.oceanmining.monitoring.enums.WeatherWarningStatus;
import com.oceanmining.monitoring.service.WeatherWarningService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URLEncoder;
import java.io.IOException;
import com.oceanmining.monitoring.service.ForecastPdfService;
import com.oceanmining.monitoring.service.BulletinExportService;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/warnings")
public class WeatherWarningController {

    private final WeatherWarningService weatherWarningService;
    private final ForecastPdfService pdfService;
    private final BulletinExportService exportService;

    public WeatherWarningController(WeatherWarningService weatherWarningService, ForecastPdfService pdfService, BulletinExportService exportService) {
        this.pdfService = pdfService;
        this.exportService = exportService;
        this.weatherWarningService = weatherWarningService;
    }

    @GetMapping("/weather")
    public ResponseEntity<ApiResponse<WeatherWarningPageDTO>> getWarnings(
            @RequestParam(required = false) Long regionId,
            @RequestParam(name = "range", required = false) String range,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        return ResponseEntity.ok(ApiResponse.success(weatherWarningService.findWarnings(
                regionId,
                range == null ? null : ForecastRange.fromCode(range),
                parseSeverity(severity),
                parseStatus(status),
                page,
                pageSize
        )));
    }

    @GetMapping("/weather/stats")
    public ResponseEntity<ApiResponse<WarningStatsDTO>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(weatherWarningService.getStats()));
    }

    @GetMapping("/weather/{id}")
    public ResponseEntity<ApiResponse<WeatherWarningDetailDTO>> getWarning(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(weatherWarningService.getDetail(id)));
    }

    @GetMapping("/weather/{id}/bulletin/download")
    public ResponseEntity<byte[]> downloadWarningBulletin(
            @PathVariable Long id,
            @RequestParam(name = "format", defaultValue = "txt") String format) throws IOException {
        if (!"txt".equalsIgnoreCase(format) && !"pdf".equalsIgnoreCase(format)) {
            throw new IllegalArgumentException("Supported formats: txt, pdf.");
        }
        WeatherWarningDetailDTO warning = weatherWarningService.getDetail(id);
        boolean pdf = "pdf".equalsIgnoreCase(format);
        String content = exportService.normalize(warning.getBulletinText(), warning.getRegionId(), warning.getRegionName(), warning.getBaseDate(), warning.getRunCycle());
        String fileName = "%s_%s.%s".formatted(warning.getWarningCode(), warning.getBaseDate(), pdf ? "pdf" : "txt");
        String encodedName = URLEncoder.encode(fileName, StandardCharsets.UTF_8).replace("+", "%20");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedName)
                .contentType(pdf ? MediaType.APPLICATION_PDF : new MediaType("text", "plain", StandardCharsets.UTF_8))
                .body(pdf ? pdfService.renderWarning(warning,weatherWarningService.reportData(warning)) : content.getBytes(StandardCharsets.UTF_8));
    }

    @PutMapping("/weather/{id}/resolve")
    public ResponseEntity<ApiResponse<WeatherWarningDetailDTO>> resolve(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(weatherWarningService.resolve(id)));
    }

    public record AnalysisReport(String content,com.fasterxml.jackson.databind.JsonNode report) {}

    @org.springframework.web.bind.annotation.PostMapping("/analysis/bulletin/pdf")
    public ResponseEntity<byte[]> downloadAnalysis(@org.springframework.web.bind.annotation.RequestBody AnalysisReport report) throws IOException {
        if (report.content() == null || report.content().length() > 100000) {
            throw new IllegalArgumentException("报文内容为空或过长。");
        }
        String content = report.content().replace("重点峰值时段", "峰值时段").replace("重点时段分析", "时段分析");
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=warning_analysis.pdf")
                .body(pdfService.renderAnalysis(content,report.report()));
    }

    private WeatherWarningSeverity parseSeverity(String value) {
        return value == null ? null : WeatherWarningSeverity.valueOf(value.toUpperCase());
    }

    private WeatherWarningStatus parseStatus(String value) {
        return value == null ? null : WeatherWarningStatus.valueOf(value.toUpperCase());
    }
}
