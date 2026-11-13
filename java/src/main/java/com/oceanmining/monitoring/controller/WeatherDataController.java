package com.oceanmining.monitoring.controller;

import com.oceanmining.monitoring.dto.response.ApiResponse;
import com.oceanmining.monitoring.dto.response.AvailableIndicesDTO;
import com.oceanmining.monitoring.dto.response.WeatherDataDTO;
import com.oceanmining.monitoring.dto.response.WeatherMetadataDTO;
import com.oceanmining.monitoring.dto.response.WeatherPointQueryDTO;
import com.oceanmining.monitoring.dto.response.WeatherTimeSeriesDTO;
import com.oceanmining.monitoring.service.InternalWaveDataService;
import com.oceanmining.monitoring.service.WeatherDataService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 气象数据Controller
 * 
 * @author Ocean Mining Team
 * @version 1.0.0
 */
@RestController
@RequestMapping("/api/weather")
public class WeatherDataController {
    
    private static final Logger log = LoggerFactory.getLogger(WeatherDataController.class);
    private final WeatherDataService weatherDataService;
    private final InternalWaveDataService internalWaveDataService;
    
    @Autowired
    public WeatherDataController(
            WeatherDataService weatherDataService,
            InternalWaveDataService internalWaveDataService) {
        this.weatherDataService = weatherDataService;
        this.internalWaveDataService = internalWaveDataService;
    }
    
    /**
     * 获取气象数据元数据
     * 
     * @param type 数据类型: wind, ocean_current, wave, internal_wave
     * @return 元数据
     */
    @GetMapping("/metadata/{type}")
    public ResponseEntity<ApiResponse<WeatherMetadataDTO>> getMetadata(
            @PathVariable String type) {
        log.info("API请求 - 获取元数据: type={}", type);
        
        WeatherMetadataDTO metadata;
        if ("internal_wave".equals(type)) {
            metadata = internalWaveDataService.getMetadata();
        } else {
            metadata = weatherDataService.getMetadata(type);
        }
        
        return ResponseEntity.ok(ApiResponse.success(metadata));
    }
    
    /**
     * 获取指定时间的气象数据
     * 
     * @param type 数据类型
     * @param timeIndex 时间索引
     * @return 气象数据
     */
    @GetMapping("/data/{type}/{timeIndex}")
    public ResponseEntity<ApiResponse<WeatherDataDTO>> getData(
            @PathVariable String type,
            @PathVariable Integer timeIndex) {
        log.info("API请求 - 获取气象数据: type={}, timeIndex={}", type, timeIndex);
        
        WeatherDataDTO data;
        if ("internal_wave".equals(type)) {
            data = internalWaveDataService.getData(timeIndex);
        } else {
            data = weatherDataService.getData(type, timeIndex);
        }
        
        return ResponseEntity.ok(ApiResponse.success(data));
    }
    
    /**
     * 获取可用的时间索引列表
     * 
     * @param type 数据类型
     * @return 可用索引列表
     */
    @GetMapping("/available/{type}")
    public ResponseEntity<ApiResponse<AvailableIndicesDTO>> getAvailableIndices(
            @PathVariable String type) {
        log.info("API请求 - 获取可用时间索引: type={}", type);
        
        AvailableIndicesDTO indices;
        if ("internal_wave".equals(type)) {
            indices = internalWaveDataService.getAvailableIndices();
        } else {
            indices = weatherDataService.getAvailableIndices(type);
        }
        
        return ResponseEntity.ok(ApiResponse.success(indices));
    }
    
    /**
     * 获取指定时间的气象数据（二进制格式）
     * 性能优化版本：直接返回二进制数据，避免JSON序列化开销
     * 
     * @param type 数据类型
     * @param timeIndex 时间索引
     * @return 二进制气象数据
     */
    @GetMapping("/data/{type}/{timeIndex}/binary")
    public ResponseEntity<byte[]> getDataBinary(
            @PathVariable String type,
            @PathVariable Integer timeIndex) {
        log.info("API请求 - 获取气象数据(二进制): type={}, timeIndex={}", type, timeIndex);
        
        byte[] binaryData = weatherDataService.getDataBinary(type, timeIndex);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(binaryData);
    }
    
    /**
     * 查询指定点的风浪流数据
     * 
     * @param lat 纬度
     * @param lon 经度
     * @param timeIndex 时间索引（可选，默认0）
     * @return 点查询结果
     */
    @GetMapping("/point-query")
    public ResponseEntity<ApiResponse<WeatherPointQueryDTO>> queryPointWeather(
            @RequestParam double lat,
            @RequestParam double lon,
            @RequestParam(required = false, defaultValue = "0") Integer timeIndex) {
        log.info("API请求 - 点查询: lat={}, lon={}, timeIndex={}", lat, lon, timeIndex);
        
        WeatherPointQueryDTO result = weatherDataService.queryPointWeather(lat, lon, timeIndex);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
    
    /**
     * 查询指定点的气象时间序列数据（用于详情面板）
     * 
     * @param lat 纬度
     * @param lon 经度
     * @param startIndex 起始时间索引（可选，默认0）
     * @param count 查询数量（可选，默认24，最大48）
     * @return 时间序列数据
     */
    @GetMapping("/point-query/time-series")
    public ResponseEntity<ApiResponse<WeatherTimeSeriesDTO>> queryPointWeatherTimeSeries(
            @RequestParam double lat,
            @RequestParam double lon,
            @RequestParam(required = false, defaultValue = "0") Integer startIndex,
            @RequestParam(required = false, defaultValue = "24") Integer count) {
        log.info("API请求 - 时间序列查询: lat={}, lon={}, startIndex={}, count={}", lat, lon, startIndex, count);
        
        WeatherTimeSeriesDTO result = weatherDataService.queryPointWeatherTimeSeries(lat, lon, startIndex, count);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
    
    /**
     * 获取指定时间的内波数据（二进制格式）
     * 
     * @param timeIndex 时间索引
     * @return 二进制内波数据
     */
    @GetMapping("/data/internal_wave/{timeIndex}/binary")
    public ResponseEntity<byte[]> getInternalWaveDataBinary(
            @PathVariable Integer timeIndex) {
        log.info("API请求 - 获取内波数据(二进制): timeIndex={}", timeIndex);
        
        byte[] binaryData = internalWaveDataService.getDataBinary(timeIndex);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(binaryData);
    }
}
