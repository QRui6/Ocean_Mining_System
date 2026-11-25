package com.oceanmining.monitoring.controller;

import com.oceanmining.monitoring.dto.geojson.GeoJsonFeatureCollection;
import com.oceanmining.monitoring.dto.response.ApiResponse;
import com.oceanmining.monitoring.dto.response.TyphoonAreaEventPageDTO;
import com.oceanmining.monitoring.dto.response.TyphoonAreaSummaryDTO;
import com.oceanmining.monitoring.dto.response.TyphoonYearlyStatDTO;
import com.oceanmining.monitoring.entity.MiningArea;
import com.oceanmining.monitoring.service.MiningAreaService;
import com.oceanmining.monitoring.service.TyphoonAnalyticsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mining-areas")
@CrossOrigin(origins = "*")
public class MiningAreaController {
    
    private static final Logger logger = LoggerFactory.getLogger(MiningAreaController.class);
    
    @Autowired
    private MiningAreaService service;

    @Autowired
    private TyphoonAnalyticsService typhoonAnalyticsService;
    
    @GetMapping("/geojson")
    public ResponseEntity<GeoJsonFeatureCollection> getGeoJson() {
        logger.info("收到GeoJSON请求");
        GeoJsonFeatureCollection collection = service.getAllAsGeoJson();
        logger.info("返回 {} 个矿区", collection.getFeatures().size());
        return ResponseEntity.ok(collection);
    }
    
    @GetMapping
    public ResponseEntity<List<MiningArea>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }
    
    @GetMapping("/{areaId}")
    public ResponseEntity<MiningArea> getByAreaId(@PathVariable String areaId) {
        return service.findByAreaId(areaId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/category/{category}")
    public ResponseEntity<List<MiningArea>> getByCategory(@PathVariable String category) {
        return ResponseEntity.ok(service.findByCategory(category));
    }
    
    @GetMapping("/sponsor/{sponsor}")
    public ResponseEntity<List<MiningArea>> getBySponsor(@PathVariable String sponsor) {
        return ResponseEntity.ok(service.findBySponsor(sponsor));
    }
    
    @GetMapping("/categories")
    public ResponseEntity<List<String>> getAllCategories() {
        return ResponseEntity.ok(service.getAllCategories());
    }
    
    @GetMapping("/sponsors")
    public ResponseEntity<List<String>> getAllSponsors() {
        return ResponseEntity.ok(service.getAllSponsors());
    }

    @GetMapping("/{areaId}/typhoon/summary")
    public ResponseEntity<ApiResponse<TyphoonAreaSummaryDTO>> getTyphoonSummary(
            @PathVariable String areaId,
            @RequestParam(required = false) Integer startYear,
            @RequestParam(required = false) Integer endYear,
            @RequestParam(required = false) Double bufferKm) {
        return ResponseEntity.ok(ApiResponse.success(
                typhoonAnalyticsService.getAreaSummary(areaId, startYear, endYear, bufferKm)
        ));
    }

    @GetMapping("/{areaId}/typhoon/events")
    public ResponseEntity<ApiResponse<TyphoonAreaEventPageDTO>> getTyphoonEvents(
            @PathVariable String areaId,
            @RequestParam(required = false) Integer startYear,
            @RequestParam(required = false) Integer endYear,
            @RequestParam(required = false) Double bufferKm,
            @RequestParam(required = false) String impactLevel,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer pageSize,
            @RequestParam(required = false) String sort) {
        return ResponseEntity.ok(ApiResponse.success(
                typhoonAnalyticsService.getAreaEvents(
                        areaId,
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

    @GetMapping("/{areaId}/typhoon/stats/yearly")
    public ResponseEntity<ApiResponse<List<TyphoonYearlyStatDTO>>> getTyphoonYearlyStats(
            @PathVariable String areaId,
            @RequestParam(required = false) Integer startYear,
            @RequestParam(required = false) Integer endYear,
            @RequestParam(required = false) Double bufferKm) {
        return ResponseEntity.ok(ApiResponse.success(
                typhoonAnalyticsService.getYearlyStats(areaId, startYear, endYear, bufferKm)
        ));
    }
     
    @PostMapping("/import")
    public ResponseEntity<Map<String, Object>> importData() {
        try {
            logger.info("开始导入矿区数据...");
            int count = service.importFromGeoJson();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", count);
            response.put("message", "成功导入 " + count + " 个矿区");
            
            logger.info("矿区数据导入完成: {} 个", count);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("导入矿区数据失败", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "导入失败: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
}
