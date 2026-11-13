package com.oceanmining.monitoring.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 监控区域响应DTO
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AreaDTO {
    
    private Long id;
    private String areaId;
    private String name;
    private List<List<Double>> polygon;
    private ThresholdsDTO thresholds;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private Integer shipCount;
    private Integer warningCount;
    private BoundsDTO bounds;
    private String area;
    
    // Constructors
    public AreaDTO() {}
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getAreaId() { return areaId; }
    public void setAreaId(String areaId) { this.areaId = areaId; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public List<List<Double>> getPolygon() { return polygon; }
    public void setPolygon(List<List<Double>> polygon) { this.polygon = polygon; }
    
    public ThresholdsDTO getThresholds() { return thresholds; }
    public void setThresholds(ThresholdsDTO thresholds) { this.thresholds = thresholds; }
    
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public Integer getShipCount() { return shipCount; }
    public void setShipCount(Integer shipCount) { this.shipCount = shipCount; }
    
    public Integer getWarningCount() { return warningCount; }
    public void setWarningCount(Integer warningCount) { this.warningCount = warningCount; }
    
    public BoundsDTO getBounds() { return bounds; }
    public void setBounds(BoundsDTO bounds) { this.bounds = bounds; }
    
    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }
    
    public static class ThresholdsDTO {
        private BigDecimal windSpeed;
        private BigDecimal waveHeight;
        
        public ThresholdsDTO() {}
        
        public ThresholdsDTO(BigDecimal windSpeed, BigDecimal waveHeight) {
            this.windSpeed = windSpeed;
            this.waveHeight = waveHeight;
        }
        
        public BigDecimal getWindSpeed() { return windSpeed; }
        public void setWindSpeed(BigDecimal windSpeed) { this.windSpeed = windSpeed; }
        
        public BigDecimal getWaveHeight() { return waveHeight; }
        public void setWaveHeight(BigDecimal waveHeight) { this.waveHeight = waveHeight; }
    }
    
    public static class BoundsDTO {
        private String minLng;
        private String maxLng;
        private String minLat;
        private String maxLat;
        
        public BoundsDTO() {}
        
        public BoundsDTO(String minLng, String maxLng, String minLat, String maxLat) {
            this.minLng = minLng;
            this.maxLng = maxLng;
            this.minLat = minLat;
            this.maxLat = maxLat;
        }
        
        public String getMinLng() { return minLng; }
        public void setMinLng(String minLng) { this.minLng = minLng; }
        
        public String getMaxLng() { return maxLng; }
        public void setMaxLng(String maxLng) { this.maxLng = maxLng; }
        
        public String getMinLat() { return minLat; }
        public void setMinLat(String minLat) { this.minLat = minLat; }
        
        public String getMaxLat() { return maxLat; }
        public void setMaxLat(String maxLat) { this.maxLat = maxLat; }
    }
}
