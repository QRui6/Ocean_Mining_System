package com.oceanmining.monitoring.controller;

import com.oceanmining.monitoring.dto.response.ApiResponse;
import com.oceanmining.monitoring.dto.response.HistoricalWindMonthlyOverviewDTO;
import com.oceanmining.monitoring.dto.response.HistoricalWindPointSeriesDTO;
import com.oceanmining.monitoring.service.HistoricalWindService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/historical-wind")
@CrossOrigin(origins = "*")
public class HistoricalWindController {

    private final HistoricalWindService historicalWindService;

    @Autowired
    public HistoricalWindController(HistoricalWindService historicalWindService) {
        this.historicalWindService = historicalWindService;
    }

    @GetMapping("/point-query")
    public ResponseEntity<ApiResponse<HistoricalWindPointSeriesDTO>> queryPointMonthlySeries(
            @RequestParam double lat,
            @RequestParam double lon,
            @RequestParam(required = false) Integer startYear,
            @RequestParam(required = false) Integer endYear) {
        return ResponseEntity.ok(ApiResponse.success(
                historicalWindService.queryPointMonthlySeries(lat, lon, startYear, endYear)
        ));
    }

    @GetMapping("/months")
    public ResponseEntity<ApiResponse<HistoricalWindMonthlyOverviewDTO>> queryMonthlyOverview(
            @RequestParam(required = false) Integer startYear,
            @RequestParam(required = false) Integer endYear) {
        return ResponseEntity.ok(ApiResponse.success(
                historicalWindService.queryMonthlyOverview(startYear, endYear)
        ));
    }
}
