package com.oceanmining.monitoring.controller;

import com.oceanmining.monitoring.dto.response.ApiResponse;
import com.oceanmining.monitoring.dto.response.TyphoonTrackDTO;
import com.oceanmining.monitoring.service.TyphoonAnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/typhoons")
public class TyphoonController {

    private final TyphoonAnalyticsService typhoonAnalyticsService;

    @Autowired
    public TyphoonController(TyphoonAnalyticsService typhoonAnalyticsService) {
        this.typhoonAnalyticsService = typhoonAnalyticsService;
    }

    @GetMapping("/{sid}/track")
    public ResponseEntity<ApiResponse<TyphoonTrackDTO>> getTyphoonTrack(
            @PathVariable String sid,
            @RequestParam(required = false) String areaId,
            @RequestParam(required = false) Double bufferKm) {
        return ResponseEntity.ok(ApiResponse.success(
                typhoonAnalyticsService.getTyphoonTrack(sid, areaId, bufferKm)
        ));
    }
}
