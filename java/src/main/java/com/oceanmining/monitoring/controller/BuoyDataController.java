package com.oceanmining.monitoring.controller;

import com.oceanmining.monitoring.dto.response.ApiResponse;
import com.oceanmining.monitoring.dto.response.BuoyHistoryDTO;
import com.oceanmining.monitoring.dto.response.BuoyInfoDTO;
import com.oceanmining.monitoring.dto.response.BuoyRealtimeDTO;
import com.oceanmining.monitoring.service.BuoyDataService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/buoys")
public class BuoyDataController {

    private final BuoyDataService buoyDataService;

    public BuoyDataController(BuoyDataService buoyDataService) {
        this.buoyDataService = buoyDataService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BuoyInfoDTO>>> getBuoys() {
        return ResponseEntity.ok(ApiResponse.success(buoyDataService.getAllBuoys()));
    }

    @GetMapping("/realtime")
    public ResponseEntity<ApiResponse<List<BuoyRealtimeDTO>>> getAllRealtimeData() {
        return ResponseEntity.ok(ApiResponse.success(buoyDataService.getAllRealtimeData()));
    }

    @GetMapping("/{buoyId}/realtime")
    public ResponseEntity<ApiResponse<BuoyRealtimeDTO>> getRealtimeData(@PathVariable String buoyId) {
        return ResponseEntity.ok(ApiResponse.success(buoyDataService.getRealtimeData(buoyId)));
    }

    @GetMapping("/{buoyId}/history")
    public ResponseEntity<ApiResponse<BuoyHistoryDTO>> getHistory(
            @PathVariable String buoyId,
            @RequestParam(defaultValue = "12h") String range) {
        return ResponseEntity.ok(ApiResponse.success(buoyDataService.getHistory(buoyId, range)));
    }
}
