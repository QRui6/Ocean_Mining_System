package com.oceanmining.monitoring.controller;

import com.oceanmining.monitoring.dto.response.ApiResponse;
import com.oceanmining.monitoring.service.HistoricalPointCacheService;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/historical-sea-state")
@CrossOrigin(origins="*")
public class HistoricalSeaStateController {
    private final HistoricalPointCacheService cache;
    public HistoricalSeaStateController(HistoricalPointCacheService cache) { this.cache=cache; }
    @GetMapping("/versions")
    public ApiResponse<Map<String,String>> versions() { return ApiResponse.success(cache.versions()); }
}
