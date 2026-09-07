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
import com.oceanmining.monitoring.service.MiningOverviewService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/forecast")
public class ForecastController {

    private final ForecastDataService forecastDataService;
    private final ForecastBulletinService forecastBulletinService;
    private final MiningOverviewService miningOverviewService;

    public ForecastController(
            ForecastDataService forecastDataService,
            ForecastBulletinService forecastBulletinService,
            MiningOverviewService miningOverviewService) {
        this.forecastDataService = forecastDataService;
        this.forecastBulletinService = forecastBulletinService;
        this.miningOverviewService = miningOverviewService;
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
            @RequestParam(name = "format", defaultValue = "txt") String format) {
        ensureTxt(format);
        ForecastBulletinDTO bulletin = forecastBulletinService
                .getOrCreate(regionId, ForecastRange.fromCode(range));
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

    private void ensureTxt(String format) {
        if (!"txt".equalsIgnoreCase(format)) {
            throw new IllegalArgumentException("Only txt download format is supported.");
        }
    }

    private ResponseEntity<byte[]> textDownload(String fileName, String content) {
        String encodedName = URLEncoder.encode(fileName, StandardCharsets.UTF_8).replace("+", "%20");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedName)
                .contentType(new MediaType("text", "plain", StandardCharsets.UTF_8))
                .body(content.getBytes(StandardCharsets.UTF_8));
    }
}
