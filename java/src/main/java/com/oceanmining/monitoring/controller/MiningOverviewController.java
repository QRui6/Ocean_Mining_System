package com.oceanmining.monitoring.controller;

import com.oceanmining.monitoring.dto.response.ApiResponse;
import com.oceanmining.monitoring.dto.response.MiningOverviewRegionDTO;
import com.oceanmining.monitoring.dto.response.MiningOverviewSiteDTO;
import com.oceanmining.monitoring.dto.response.RegionForecastDailyDTO;
import com.oceanmining.monitoring.dto.response.RegionForecastHourlyDTO;
import com.oceanmining.monitoring.dto.response.SiteForecastDailyDTO;
import com.oceanmining.monitoring.dto.response.SiteForecastHourlyDTO;
import com.oceanmining.monitoring.service.MiningOverviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/mining-overview")
public class MiningOverviewController {

    private final MiningOverviewService miningOverviewService;

    @Autowired
    public MiningOverviewController(MiningOverviewService miningOverviewService) {
        this.miningOverviewService = miningOverviewService;
    }

    @GetMapping("/regions")
    public ResponseEntity<ApiResponse<List<MiningOverviewRegionDTO>>> getRegions(
            @RequestParam(required = false) Long id) {
        return ResponseEntity.ok(ApiResponse.success(miningOverviewService.getRegions(id)));
    }

    @GetMapping("/regions/{regionId}/daily")
    public ResponseEntity<ApiResponse<List<RegionForecastDailyDTO>>> getRegionDailyForecasts(
            @PathVariable Long regionId) {
        return ResponseEntity.ok(ApiResponse.success(miningOverviewService.getRegionDailyForecasts(regionId)));
    }

    @GetMapping("/regions/{regionId}/hourly")
    public ResponseEntity<ApiResponse<List<RegionForecastHourlyDTO>>> getRegionHourlyForecasts(
            @PathVariable Long regionId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate forecastDate) {
        return ResponseEntity.ok(ApiResponse.success(
                miningOverviewService.getRegionHourlyForecasts(regionId, forecastDate)
        ));
    }

    @GetMapping("/sites")
    public ResponseEntity<ApiResponse<List<MiningOverviewSiteDTO>>> getSites(
            @RequestParam(required = false) Long regionId) {
        return ResponseEntity.ok(ApiResponse.success(miningOverviewService.getSites(regionId)));
    }

    @GetMapping("/sites/{siteId}/daily")
    public ResponseEntity<ApiResponse<List<SiteForecastDailyDTO>>> getSiteDailyForecasts(
            @PathVariable Long siteId) {
        return ResponseEntity.ok(ApiResponse.success(miningOverviewService.getSiteDailyForecasts(siteId)));
    }

    @GetMapping("/sites/{siteId}/hourly")
    public ResponseEntity<ApiResponse<List<SiteForecastHourlyDTO>>> getSiteHourlyForecasts(
            @PathVariable Long siteId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate forecastDate) {
        return ResponseEntity.ok(ApiResponse.success(
                miningOverviewService.getSiteHourlyForecasts(siteId, forecastDate)
        ));
    }
}
