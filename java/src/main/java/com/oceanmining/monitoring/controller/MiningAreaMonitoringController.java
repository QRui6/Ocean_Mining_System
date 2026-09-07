package com.oceanmining.monitoring.controller;

import com.oceanmining.monitoring.dto.request.AddMiningMonitoringRequest;
import com.oceanmining.monitoring.dto.response.MiningMonitoringResponse;
import com.oceanmining.monitoring.dto.response.WeatherStatisticsResponse;
import com.oceanmining.monitoring.service.MiningAreaMonitoringService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mining-monitoring")
@CrossOrigin(origins = "*")
public class MiningAreaMonitoringController {
    
    private static final Logger logger = LoggerFactory.getLogger(MiningAreaMonitoringController.class);
    
    @Autowired
    private MiningAreaMonitoringService service;
    
    /**
     * 添加矿区到监测列表
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> addMonitoring(@RequestBody AddMiningMonitoringRequest request) {
        try {
            logger.info("收到添加监测请求: {}", request.getMiningAreaId());
            MiningMonitoringResponse response = service.addMonitoring(request);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", response);
            result.put("message", "添加成功");
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("添加监测失败", e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("error", e.getMessage());
            
            return ResponseEntity.status(500).body(result);
        }
    }
    
    /**
     * 获取所有监测列表
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllMonitoring() {
        try {
            logger.info("收到获取监测列表请求");
            List<MiningMonitoringResponse> list = service.getAllMonitoring();
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", list);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("获取监测列表失败", e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("error", e.getMessage());
            
            return ResponseEntity.status(500).body(result);
        }
    }
    
    /**
     * 移除监测
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> removeMonitoring(@PathVariable Long id) {
        try {
            logger.info("收到移除监测请求: id={}", id);
            service.removeMonitoring(id);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "移除成功");
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("移除监测失败", e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("error", e.getMessage());
            
            return ResponseEntity.status(500).body(result);
        }
    }
    
    /**
     * 根据矿区ID移除监测
     */
    @DeleteMapping("/area/{miningAreaId}")
    public ResponseEntity<Map<String, Object>> removeMonitoringByAreaId(@PathVariable Long miningAreaId) {
        try {
            logger.info("收到根据矿区ID移除监测请求: miningAreaId={}", miningAreaId);
            service.removeMonitoringByAreaId(miningAreaId);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "移除成功");
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("移除监测失败", e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("error", e.getMessage());
            
            return ResponseEntity.status(500).body(result);
        }
    }
    
    /**
     * 更新阈值
     */
    @PutMapping("/{id}/thresholds")
    public ResponseEntity<Map<String, Object>> updateThresholds(
            @PathVariable Long id,
            @RequestBody AddMiningMonitoringRequest request) {
        try {
            logger.info("收到更新阈值请求: id={}", id);
            MiningMonitoringResponse response = service.updateThresholds(id, request);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", response);
            result.put("message", "更新成功");
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("更新阈值失败", e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("error", e.getMessage());
            
            return ResponseEntity.status(500).body(result);
        }
    }
    
    /**
     * 获取矿区气象统计数据
     */
    @GetMapping("/{id}/weather-stats")
    public ResponseEntity<Map<String, Object>> getWeatherStatistics(@PathVariable Long id) {
        try {
            logger.info("收到获取气象统计请求: id={}", id);
            WeatherStatisticsResponse response = service.getWeatherStatistics(id);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", response);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("获取气象统计失败", e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("error", e.getMessage());
            
            return ResponseEntity.status(500).body(result);
        }
    }
}
