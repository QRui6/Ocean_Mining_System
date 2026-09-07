package com.oceanmining.monitoring.controller;

import com.oceanmining.monitoring.dto.response.ApiResponse;
import com.oceanmining.monitoring.dto.response.HistoricalWaveMonthlyOverviewDTO;
import com.oceanmining.monitoring.dto.response.HistoricalWavePointSeriesDTO;
import com.oceanmining.monitoring.service.HistoricalWaveService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/historical-wave")
@CrossOrigin(origins = "*")
public class HistoricalWaveController {

    private final HistoricalWaveService historicalWaveService;

    public HistoricalWaveController(HistoricalWaveService historicalWaveService) {
        this.historicalWaveService = historicalWaveService;
    }

    @GetMapping("/point-query")
    public ResponseEntity<ApiResponse<HistoricalWavePointSeriesDTO>> queryPointMonthlySeries(
            @RequestParam double lat,
            @RequestParam double lon,
            @RequestParam(required = false) Integer startYear,
            @RequestParam(required = false) Integer endYear) {
        return ResponseEntity.ok(ApiResponse.success(
                historicalWaveService.queryPointMonthlySeries(lat, lon, startYear, endYear)
        ));
    }

    @GetMapping("/months")
    public ResponseEntity<ApiResponse<HistoricalWaveMonthlyOverviewDTO>> queryMonthlyOverview(
            @RequestParam(required = false) Integer startYear,
            @RequestParam(required = false) Integer endYear) {
        return ResponseEntity.ok(ApiResponse.success(
                historicalWaveService.queryMonthlyOverview(startYear, endYear)
        ));
    }
}
