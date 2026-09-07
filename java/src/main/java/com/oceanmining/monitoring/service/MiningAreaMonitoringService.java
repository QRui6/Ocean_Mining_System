package com.oceanmining.monitoring.service;

import com.oceanmining.monitoring.dto.request.AddMiningMonitoringRequest;
import com.oceanmining.monitoring.dto.response.MiningMonitoringResponse;
import com.oceanmining.monitoring.dto.response.WeatherStatisticsResponse;
import com.oceanmining.monitoring.entity.MiningArea;
import com.oceanmining.monitoring.entity.MiningAreaMonitoring;
import com.oceanmining.monitoring.exception.BusinessException;
import com.oceanmining.monitoring.exception.ResourceNotFoundException;
import com.oceanmining.monitoring.repository.MiningAreaMonitoringRepository;
import com.oceanmining.monitoring.repository.MiningAreaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class MiningAreaMonitoringService {
    
    private static final Logger logger = LoggerFactory.getLogger(MiningAreaMonitoringService.class);
    
    @Autowired
    private MiningAreaMonitoringRepository monitoringRepository;
    
    @Autowired
    private MiningAreaRepository miningAreaRepository;
    
    /**
     * 添加矿区到监测列表
     */
    @Transactional
    public MiningMonitoringResponse addMonitoring(AddMiningMonitoringRequest request) {
        logger.info("添加矿区监测: miningAreaId={}", request.getMiningAreaId());
        
        // 检查矿区是否存在
        MiningArea miningArea = miningAreaRepository.findById(request.getMiningAreaId())
                .orElseThrow(() -> new ResourceNotFoundException("矿区不存在: " + request.getMiningAreaId()));
        
        // 检查是否已在监测列表中
        if (monitoringRepository.existsByMiningAreaId(request.getMiningAreaId())) {
            throw new BusinessException("该矿区已在监测列表中");
        }
        
        // 创建监测记录
        MiningAreaMonitoring monitoring = new MiningAreaMonitoring();
        monitoring.setMiningAreaId(request.getMiningAreaId());
        monitoring.setWindSpeedThreshold(request.getWindSpeedThreshold() != null 
                ? request.getWindSpeedThreshold() 
                : BigDecimal.valueOf(15.0));
        monitoring.setWaveHeightThreshold(request.getWaveHeightThreshold() != null 
                ? request.getWaveHeightThreshold() 
                : BigDecimal.valueOf(3.0));
        monitoring.setCurrentSpeedThreshold(request.getCurrentSpeedThreshold() != null 
                ? request.getCurrentSpeedThreshold() 
                : BigDecimal.valueOf(1.0));
        
        monitoring = monitoringRepository.save(monitoring);
        logger.info("矿区监测添加成功: id={}", monitoring.getId());
        
        return toResponse(monitoring);
    }
    
    /**
     * 获取所有监测列表
     */
    public List<MiningMonitoringResponse> getAllMonitoring() {
        logger.info("获取所有矿区监测列表");
        List<MiningAreaMonitoring> monitoringList = monitoringRepository.findAllByOrderByCreatedAtDesc();
        logger.info("找到 {} 个监测矿区", monitoringList.size());
        return monitoringList.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * 移除监测
     */
    @Transactional
    public void removeMonitoring(Long id) {
        logger.info("移除矿区监测: id={}", id);
        
        if (!monitoringRepository.existsById(id)) {
            throw new ResourceNotFoundException("监测记录不存在: " + id);
        }
        
        monitoringRepository.deleteById(id);
        logger.info("矿区监测移除成功: id={}", id);
    }
    
    /**
     * 根据矿区ID移除监测
     */
    @Transactional
    public void removeMonitoringByAreaId(Long miningAreaId) {
        logger.info("根据矿区ID移除监测: miningAreaId={}", miningAreaId);
        
        if (!monitoringRepository.existsByMiningAreaId(miningAreaId)) {
            throw new ResourceNotFoundException("该矿区不在监测列表中: " + miningAreaId);
        }
        
        monitoringRepository.deleteByMiningAreaId(miningAreaId);
        logger.info("矿区监测移除成功: miningAreaId={}", miningAreaId);
    }
    
    /**
     * 更新阈值
     */
    @Transactional
    public MiningMonitoringResponse updateThresholds(Long id, AddMiningMonitoringRequest request) {
        logger.info("更新监测阈值: id={}", id);
        
        MiningAreaMonitoring monitoring = monitoringRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("监测记录不存在: " + id));
        
        if (request.getWindSpeedThreshold() != null) {
            monitoring.setWindSpeedThreshold(request.getWindSpeedThreshold());
        }
        if (request.getWaveHeightThreshold() != null) {
            monitoring.setWaveHeightThreshold(request.getWaveHeightThreshold());
        }
        if (request.getCurrentSpeedThreshold() != null) {
            monitoring.setCurrentSpeedThreshold(request.getCurrentSpeedThreshold());
        }
        
        monitoring = monitoringRepository.save(monitoring);
        logger.info("监测阈值更新成功: id={}", id);
        
        return toResponse(monitoring);
    }
    
    /**
     * 获取矿区气象统计数据
     */
    public WeatherStatisticsResponse getWeatherStatistics(Long id) {
        logger.info("获取矿区气象统计: id={}", id);
        
        MiningAreaMonitoring monitoring = monitoringRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("监测记录不存在: " + id));
        
        MiningArea miningArea = monitoring.getMiningArea();
        if (miningArea == null) {
            throw new ResourceNotFoundException("矿区不存在");
        }
        
        WeatherStatisticsResponse response = new WeatherStatisticsResponse();
        
        // 1. 矿区信息
        WeatherStatisticsResponse.MiningAreaInfo areaInfo = new WeatherStatisticsResponse.MiningAreaInfo();
        areaInfo.setId(miningArea.getId());
        areaInfo.setName(miningArea.getContractor());
        areaInfo.setContractor(miningArea.getContractor());
        areaInfo.setMineral(miningArea.getMineral());
        areaInfo.setLocation(miningArea.getLocation());
        response.setMiningArea(areaInfo);
        
        // 2. 生成模拟气象数据（实际应该从气象数据库查询）
        Random random = new Random();
        
        // 当前气象
        WeatherStatisticsResponse.CurrentWeather current = new WeatherStatisticsResponse.CurrentWeather();
        double currentWindSpeed = 10 + random.nextDouble() * 10; // 10-20 m/s
        double currentWaveHeight = 1.5 + random.nextDouble() * 2; // 1.5-3.5 m
        double currentCurrentSpeed = 0.5 + random.nextDouble() * 1; // 0.5-1.5 m/s
        
        current.setWindSpeed(Math.round(currentWindSpeed * 10) / 10.0);
        current.setWaveHeight(Math.round(currentWaveHeight * 10) / 10.0);
        current.setCurrentSpeed(Math.round(currentCurrentSpeed * 100) / 100.0);
        current.setTimestamp(ZonedDateTime.now().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        response.setCurrentWeather(current);
        
        // 3. 统计数据
        WeatherStatisticsResponse.WeatherStats stats = new WeatherStatisticsResponse.WeatherStats();
        
        // 风速统计
        WeatherStatisticsResponse.MetricStats windStats = new WeatherStatisticsResponse.MetricStats();
        windStats.setCurrent(current.getWindSpeed());
        windStats.setAvg(Math.round((currentWindSpeed - 2) * 10) / 10.0);
        windStats.setMax(Math.round((currentWindSpeed + 5) * 10) / 10.0);
        windStats.setMin(Math.round((currentWindSpeed - 5) * 10) / 10.0);
        windStats.setThreshold(monitoring.getWindSpeedThreshold().doubleValue());
        windStats.setExceedCount(current.getWindSpeed() > windStats.getThreshold() ? 3 : 0);
        stats.setWindSpeed(windStats);
        
        // 浪高统计
        WeatherStatisticsResponse.MetricStats waveStats = new WeatherStatisticsResponse.MetricStats();
        waveStats.setCurrent(current.getWaveHeight());
        waveStats.setAvg(Math.round((currentWaveHeight - 0.3) * 10) / 10.0);
        waveStats.setMax(Math.round((currentWaveHeight + 1) * 10) / 10.0);
        waveStats.setMin(Math.round((currentWaveHeight - 0.8) * 10) / 10.0);
        waveStats.setThreshold(monitoring.getWaveHeightThreshold().doubleValue());
        waveStats.setExceedCount(current.getWaveHeight() > waveStats.getThreshold() ? 2 : 0);
        stats.setWaveHeight(waveStats);
        
        // 洋流统计
        WeatherStatisticsResponse.MetricStats currentStats = new WeatherStatisticsResponse.MetricStats();
        currentStats.setCurrent(current.getCurrentSpeed());
        currentStats.setAvg(Math.round((currentCurrentSpeed - 0.1) * 100) / 100.0);
        currentStats.setMax(Math.round((currentCurrentSpeed + 0.3) * 100) / 100.0);
        currentStats.setMin(Math.round((currentCurrentSpeed - 0.3) * 100) / 100.0);
        currentStats.setThreshold(monitoring.getCurrentSpeedThreshold().doubleValue());
        currentStats.setExceedCount(current.getCurrentSpeed() > currentStats.getThreshold() ? 1 : 0);
        stats.setCurrentSpeed(currentStats);
        
        response.setStatistics(stats);
        
        // 4. 时间序列数据（未来24小时，每3小时一个点）
        List<WeatherStatisticsResponse.TimeSeriesData> timeSeries = new ArrayList<>();
        ZonedDateTime now = ZonedDateTime.now();
        
        for (int i = 0; i <= 24; i += 3) {
            WeatherStatisticsResponse.TimeSeriesData data = new WeatherStatisticsResponse.TimeSeriesData();
            data.setTime(now.plusHours(i).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
            
            // 模拟波动
            double windVariation = (random.nextDouble() - 0.5) * 4;
            double waveVariation = (random.nextDouble() - 0.5) * 1;
            double currentVariation = (random.nextDouble() - 0.5) * 0.4;
            
            data.setWindSpeed(Math.round((currentWindSpeed + windVariation) * 10) / 10.0);
            data.setWaveHeight(Math.round((currentWaveHeight + waveVariation) * 10) / 10.0);
            data.setCurrentSpeed(Math.round((currentCurrentSpeed + currentVariation) * 100) / 100.0);
            
            timeSeries.add(data);
        }
        response.setTimeSeries(timeSeries);
        
        // 5. 预警信息
        List<WeatherStatisticsResponse.WeatherWarning> warnings = new ArrayList<>();
        
        // 检查是否有超过阈值的情况
        for (int i = 0; i < timeSeries.size(); i++) {
            WeatherStatisticsResponse.TimeSeriesData data = timeSeries.get(i);
            
            // 风速预警
            if (data.getWindSpeed() > windStats.getThreshold()) {
                WeatherStatisticsResponse.WeatherWarning warning = new WeatherStatisticsResponse.WeatherWarning();
                warning.setType("windSpeed");
                warning.setSeverity(data.getWindSpeed() > windStats.getThreshold() * 1.2 ? "high" : "medium");
                warning.setStartTime(data.getTime());
                if (i + 1 < timeSeries.size()) {
                    warning.setEndTime(timeSeries.get(i + 1).getTime());
                }
                warning.setValue(data.getWindSpeed());
                warning.setThreshold(windStats.getThreshold());
                warning.setMessage(String.format("风速超过阈值 (%.1f m/s > %.1f m/s)", 
                    data.getWindSpeed(), windStats.getThreshold()));
                warnings.add(warning);
            }
            
            // 浪高预警
            if (data.getWaveHeight() > waveStats.getThreshold()) {
                WeatherStatisticsResponse.WeatherWarning warning = new WeatherStatisticsResponse.WeatherWarning();
                warning.setType("waveHeight");
                warning.setSeverity(data.getWaveHeight() > waveStats.getThreshold() * 1.2 ? "high" : "medium");
                warning.setStartTime(data.getTime());
                if (i + 1 < timeSeries.size()) {
                    warning.setEndTime(timeSeries.get(i + 1).getTime());
                }
                warning.setValue(data.getWaveHeight());
                warning.setThreshold(waveStats.getThreshold());
                warning.setMessage(String.format("浪高超过阈值 (%.1f m > %.1f m)", 
                    data.getWaveHeight(), waveStats.getThreshold()));
                warnings.add(warning);
            }
            
            // 洋流预警
            if (data.getCurrentSpeed() > currentStats.getThreshold()) {
                WeatherStatisticsResponse.WeatherWarning warning = new WeatherStatisticsResponse.WeatherWarning();
                warning.setType("currentSpeed");
                warning.setSeverity(data.getCurrentSpeed() > currentStats.getThreshold() * 1.2 ? "high" : "medium");
                warning.setStartTime(data.getTime());
                if (i + 1 < timeSeries.size()) {
                    warning.setEndTime(timeSeries.get(i + 1).getTime());
                }
                warning.setValue(data.getCurrentSpeed());
                warning.setThreshold(currentStats.getThreshold());
                warning.setMessage(String.format("洋流超过阈值 (%.2f m/s > %.2f m/s)", 
                    data.getCurrentSpeed(), currentStats.getThreshold()));
                warnings.add(warning);
            }
        }
        
        response.setWarnings(warnings);
        
        logger.info("气象统计生成完成: 时间序列{}个点, 预警{}条", timeSeries.size(), warnings.size());
        return response;
    }
    
    /**
     * 转换为响应DTO
     */
    private MiningMonitoringResponse toResponse(MiningAreaMonitoring monitoring) {
        MiningMonitoringResponse response = new MiningMonitoringResponse();
        response.setId(monitoring.getId());
        response.setMiningAreaId(monitoring.getMiningAreaId());
        response.setWindSpeedThreshold(monitoring.getWindSpeedThreshold());
        response.setWaveHeightThreshold(monitoring.getWaveHeightThreshold());
        response.setCurrentSpeedThreshold(monitoring.getCurrentSpeedThreshold());
        response.setCreatedAt(monitoring.getCreatedAt());
        
        // 填充矿区信息
        if (monitoring.getMiningArea() != null) {
            MiningArea area = monitoring.getMiningArea();
            response.setAreaId(area.getAreaId());
            response.setName(area.getContractor()); // 使用承包者名称作为显示名称
            response.setContractor(area.getContractor());
            response.setMineral(area.getMineral());
            response.setLocation(area.getLocation());
            response.setPolygon(area.getCoordinates());
        }
        
        return response;
    }
}
