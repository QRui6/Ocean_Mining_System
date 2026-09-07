package com.oceanmining.monitoring.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

/**
 * 创建监控区域请求DTO
 */
public class CreateAreaRequest {
    
    @NotBlank(message = "区域名称不能为空")
    private String name;
    
    @NotNull(message = "多边形坐标不能为空")
    private List<List<Double>> polygon;
    
    @NotNull(message = "阈值配置不能为空")
    private ThresholdsDTO thresholds;
    
    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public List<List<Double>> getPolygon() { return polygon; }
    public void setPolygon(List<List<Double>> polygon) { this.polygon = polygon; }
    
    public ThresholdsDTO getThresholds() { return thresholds; }
    public void setThresholds(ThresholdsDTO thresholds) { this.thresholds = thresholds; }
    
    public static class ThresholdsDTO {
        private BigDecimal windSpeed = BigDecimal.valueOf(15.0);
        private BigDecimal waveHeight = BigDecimal.valueOf(3.0);
        
        public BigDecimal getWindSpeed() { return windSpeed; }
        public void setWindSpeed(BigDecimal windSpeed) { this.windSpeed = windSpeed; }
        
        public BigDecimal getWaveHeight() { return waveHeight; }
        public void setWaveHeight(BigDecimal waveHeight) { this.waveHeight = waveHeight; }
    }
}
