package com.oceanmining.monitoring.controller;

import com.oceanmining.monitoring.dto.response.ApiResponse;
import com.oceanmining.monitoring.dto.response.HistoricalCurrentMonthlyOverviewDTO;
import com.oceanmining.monitoring.dto.response.HistoricalCurrentPointSeriesDTO;
import com.oceanmining.monitoring.service.HistoricalCurrentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/historical-current")
@CrossOrigin(origins = "*")
public class HistoricalCurrentController {

    private final HistoricalCurrentService historicalCurrentService;

    public HistoricalCurrentController(HistoricalCurrentService historicalCurrentService) {
        this.historicalCurrentService = historicalCurrentService;
    }

    @GetMapping("/point-query")
    public ResponseEntity<ApiResponse<HistoricalCurrentPointSeriesDTO>> queryPointMonthlySeries(
            @RequestParam double lat,
            @RequestParam double lon,
            @RequestParam(required = false) Integer startYear,
            @RequestParam(required = false) Integer endYear) {
        return ResponseEntity.ok(ApiResponse.success(
                historicalCurrentService.queryPointMonthlySeries(lat, lon, startYear, endYear)
        ));
    }

    @GetMapping("/months")
    public ResponseEntity<ApiResponse<HistoricalCurrentMonthlyOverviewDTO>> queryMonthlyOverview(
            @RequestParam(required = false) Integer startYear,
            @RequestParam(required = false) Integer endYear) {
        return ResponseEntity.ok(ApiResponse.success(
                historicalCurrentService.queryMonthlyOverview(startYear, endYear)
        ));
    }
}
