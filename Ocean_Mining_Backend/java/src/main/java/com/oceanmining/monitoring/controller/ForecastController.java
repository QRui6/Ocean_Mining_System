package com.oceanmining.monitoring.controller;

import com.oceanmining.monitoring.dto.response.ApiResponse;
import com.oceanmining.monitoring.dto.response.ForecastBulletinDTO;
import com.oceanmining.monitoring.dto.response.ForecastRegionDTO;
import com.oceanmining.monitoring.dto.response.ForecastSummaryDTO;
import com.oceanmining.monitoring.dto.response.MiningOverviewSiteDTO;
import com.oceanmining.monitoring.dto.response.RegionForecastDailyDTO;
import com.oceanmining.monitoring.dto.response.RegionForecastHourlyDTO;
import com.oceanmining.monitoring.enums.ForecastRange;
import com.oceanmining.monitoring.service.ForecastBulletinService;
import com.oceanmining.monitoring.service.ForecastDataService;
import com.oceanmining.monitoring.service.ForecastPdfService;
import com.oceanmining.monitoring.service.MiningOverviewService;
import com.oceanmining.monitoring.service.TargetForecastService;
import com.oceanmining.monitoring.exception.ResourceNotFoundException;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URLEncoder;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/forecast")
public class ForecastController {

    private final ForecastDataService forecastDataService;
    private final ForecastBulletinService forecastBulletinService;
    private final MiningOverviewService miningOverviewService;
    private final ForecastPdfService forecastPdfService;
    private final TargetForecastService targetForecasts;

    public ForecastController(
            ForecastDataService forecastDataService,
            ForecastBulletinService forecastBulletinService,
            MiningOverviewService miningOverviewService,
            ForecastPdfService forecastPdfService,
            TargetForecastService targetForecasts) {
        this.forecastDataService = forecastDataService;
        this.forecastBulletinService = forecastBulletinService;
        this.miningOverviewService = miningOverviewService;
        this.forecastPdfService = forecastPdfService;
        this.targetForecasts = targetForecasts;
    }

    @GetMapping("/targets")
    public ApiResponse<List<TargetForecastService.Target>> targets() {
        return ApiResponse.success(targetForecasts.targets());
    }

    @GetMapping("/targets/{id}/geometry")
    public ApiResponse<JsonNode> targetGeometry(@PathVariable String id) throws IOException {
        return ApiResponse.success(targetForecasts.geometry(id));
    }

    @GetMapping("/targets/{id}")
    public ApiResponse<TargetForecastService.Product> target(
            @PathVariable String id, @RequestParam(required = false) Long siteId,
            @RequestParam(defaultValue = "12h") String range,
            @RequestParam(defaultValue = "false") boolean includeHourly) {
        return ApiResponse.success(targetForecasts.product(id, siteId, ForecastRange.fromCode(range), includeHourly));
    }

    @GetMapping("/targets/{id}/bulletin/download")
    public ResponseEntity<byte[]> downloadTargetBulletin(
            @PathVariable String id, @RequestParam(required = false) Long siteId,
            @RequestParam(defaultValue = "12h") String range,
            @RequestParam(defaultValue = "pdf") String format,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate baseDate,
            @RequestParam(required = false) String runCycle) throws IOException {
        var product = targetForecasts.product(id, siteId, ForecastRange.fromCode(range));
        var data = product.report();
        if (data.points().isEmpty()) throw new ResourceNotFoundException("该站点暂无预报数据");
        if ((baseDate != null && !baseDate.equals(data.summary().getBaseDate()))
                || (runCycle != null && !runCycle.equals(data.summary().getRunCycle()))) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        String name = "海洋气象预报专报_%s_%s_%s".formatted(
                data.summary().getRegionName(), data.summary().getBaseDate(), data.summary().getTimeRange());
        if ("pdf".equalsIgnoreCase(format)) return pdfDownload(name + ".pdf", forecastPdfService.renderReport(data));
        if ("txt".equalsIgnoreCase(format)) return textDownload(name + ".txt", forecastPdfService.reportText(data));
        throw new IllegalArgumentException("Supported formats: pdf, txt.");
    }

    @GetMapping("/regions")
    public ResponseEntity<ApiResponse<List<ForecastRegionDTO>>> getRegions() {
        return ResponseEntity.ok(ApiResponse.success(forecastDataService.getForecastRegions()));
    }

    @GetMapping("/regions/{regionId}/summary")
    public ResponseEntity<ApiResponse<ForecastSummaryDTO>> getSummary(
            @PathVariable Long regionId,
            @RequestParam(name = "range", defaultValue = "12h") String range) {
        return ResponseEntity.ok(ApiResponse.success(
                forecastDataService.getSummary(regionId, ForecastRange.fromCode(range))
        ));
    }

    @GetMapping("/regions/{regionId}/hourly")
    public ResponseEntity<ApiResponse<List<RegionForecastHourlyDTO>>> getHourly(
            @PathVariable Long regionId,
            @RequestParam(name = "range", defaultValue = "12h") String range) {
        return ResponseEntity.ok(ApiResponse.success(
                forecastDataService.getHourlyForecast(regionId, ForecastRange.fromCode(range))
        ));
    }

    @GetMapping("/regions/{regionId}/daily")
    public ResponseEntity<ApiResponse<List<RegionForecastDailyDTO>>> getDaily(
            @PathVariable Long regionId,
            @RequestParam(name = "range", defaultValue = "7d") String range) {
        return ResponseEntity.ok(ApiResponse.success(
                forecastDataService.getDailyForecast(regionId, ForecastRange.fromCode(range))
        ));
    }

    @GetMapping("/regions/{regionId}/bulletin")
    public ResponseEntity<ApiResponse<ForecastBulletinDTO>> getBulletin(
            @PathVariable Long regionId,
            @RequestParam(name = "range", defaultValue = "12h") String range) {
        return ResponseEntity.ok(ApiResponse.success(
                forecastBulletinService.getOrCreate(regionId, ForecastRange.fromCode(range))
        ));
    }

    @GetMapping("/regions/{regionId}/bulletin/download")
    public ResponseEntity<byte[]> downloadBulletin(
            @PathVariable Long regionId,
            @RequestParam(name = "range", defaultValue = "12h") String range,
            @RequestParam(name = "format", defaultValue = "pdf") String format,
            @RequestParam(name = "variant", required = false) String variant) throws IOException {
        if(variant==null)variant="txt".equalsIgnoreCase(format)?"original":"report";
        if (!List.of("pdf", "txt").contains(format.toLowerCase(java.util.Locale.ROOT))) {
            throw new IllegalArgumentException("Supported formats: pdf, txt.");
        }
        if (!List.of("report", "original").contains(variant)) {
            throw new IllegalArgumentException("Supported variants: report, original.");
        }
        if ("report".equals(variant)) {
            var data = forecastDataService.getReportData(regionId, ForecastRange.fromCode(range));
            if("txt".equalsIgnoreCase(format))return textDownload("forecast_"+regionId+"_"+range+".txt",forecastPdfService.reportText(data));
            String fileName = "海洋气象预报专报_%s_%s_%s.pdf".formatted(
                    data.summary().getRegionName(), data.summary().getBaseDate(), data.summary().getTimeRange());
            return pdfDownload(fileName, forecastPdfService.renderReport(data));
        }
        ForecastBulletinDTO bulletin = forecastBulletinService
                .getOrCreate(regionId, ForecastRange.fromCode(range));
        if ("pdf".equalsIgnoreCase(format)) {
            String fileName = "原始预报报文_%s_%s_%s.pdf".formatted(
                    bulletin.getRegionName(), bulletin.getBaseDate(), bulletin.getTimeRange());
            return pdfDownload(fileName, forecastPdfService.renderOriginal(bulletin));
        }
        String fileName = "forecast_%s_%s_%s.txt".formatted(
                bulletin.getRegionCode(),
                bulletin.getTimeRange(),
                bulletin.getBaseDate()
        );
        return textDownload(fileName, bulletin.getBulletinText());
    }

    @GetMapping("/regions/{regionId}/sites")
    public ResponseEntity<ApiResponse<List<MiningOverviewSiteDTO>>> getSites(@PathVariable Long regionId) {
        return ResponseEntity.ok(ApiResponse.success(miningOverviewService.getSites(regionId)));
    }

    private ResponseEntity<byte[]> pdfDownload(String fileName, byte[] content) {
        String encodedName = URLEncoder.encode(fileName, StandardCharsets.UTF_8).replace("+", "%20");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedName)
                .cacheControl(org.springframework.http.CacheControl.noStore())
                .contentType(MediaType.APPLICATION_PDF)
                .body(content);
    }

    private ResponseEntity<byte[]> textDownload(String fileName, String content) {
        String encodedName = URLEncoder.encode(fileName, StandardCharsets.UTF_8).replace("+", "%20");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedName)
                .contentType(new MediaType("text", "plain", StandardCharsets.UTF_8))
                .body(content.getBytes(StandardCharsets.UTF_8));
    }
}
