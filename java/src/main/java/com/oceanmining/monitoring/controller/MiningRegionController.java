package com.oceanmining.monitoring.controller;

import com.oceanmining.monitoring.dto.response.ApiResponse;
import com.oceanmining.monitoring.dto.response.TyphoonRegionEventPageDTO;
import com.oceanmining.monitoring.service.TyphoonAnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mining-regions")
@CrossOrigin(origins = "*")
public class MiningRegionController {

    private final TyphoonAnalyticsService typhoonAnalyticsService;

    @Autowired
    public MiningRegionController(TyphoonAnalyticsService typhoonAnalyticsService) {
        this.typhoonAnalyticsService = typhoonAnalyticsService;
    }

    @GetMapping("/{regionId}/typhoon/events")
    public ResponseEntity<ApiResponse<TyphoonRegionEventPageDTO>> getTyphoonEvents(
            @PathVariable Long regionId,
            @RequestParam(required = false) Integer startYear,
            @RequestParam(required = false) Integer endYear,
            @RequestParam(required = false) Double bufferKm,
            @RequestParam(required = false) String impactLevel,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer pageSize,
            @RequestParam(required = false) String sort) {
        return ResponseEntity.ok(ApiResponse.success(
                typhoonAnalyticsService.getRegionEvents(
                        regionId,
                        startYear,
                        endYear,
                        bufferKm,
                        impactLevel,
                        page,
                        pageSize,
                        sort
                )
        ));
    }

    @GetMapping("/code/{regionCode}/typhoon/events")
    public ResponseEntity<ApiResponse<TyphoonRegionEventPageDTO>> getTyphoonEventsByCode(
            @PathVariable String regionCode,
            @RequestParam(required = false) Integer startYear,
            @RequestParam(required = false) Integer endYear,
            @RequestParam(required = false) Double bufferKm,
            @RequestParam(required = false) String impactLevel,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer pageSize,
            @RequestParam(required = false) String sort) {
        return ResponseEntity.ok(ApiResponse.success(
                typhoonAnalyticsService.getRegionEvents(
                        regionCode,
                        startYear,
                        endYear,
                        bufferKm,
                        impactLevel,
                        page,
                        pageSize,
                        sort
                )
        ));
    }
}
