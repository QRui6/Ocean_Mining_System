package com.oceanmining.monitoring.dto.response;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.time.ZonedDateTime;

public class MiningMonitoringResponse {
    
    private Long id;
    private Long miningAreaId;
    private String areaId;
    private String name;
    private String contractor;
    private String mineral;
    private String location;
    private JsonNode polygon;
    private BigDecimal windSpeedThreshold;
    private BigDecimal waveHeightThreshold;
    private BigDecimal currentSpeedThreshold;
    private ZonedDateTime createdAt;
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getMiningAreaId() {
        return miningAreaId;
    }
    
    public void setMiningAreaId(Long miningAreaId) {
        this.miningAreaId = miningAreaId;
    }
    
    public String getAreaId() {
        return areaId;
    }
    
    public void setAreaId(String areaId) {
        this.areaId = areaId;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getContractor() {
        return contractor;
    }
    
    public void setContractor(String contractor) {
        this.contractor = contractor;
    }
    
    public String getMineral() {
        return mineral;
    }
    
    public void setMineral(String mineral) {
        this.mineral = mineral;
    }
    
    public String getLocation() {
        return location;
    }
    
    public void setLocation(String location) {
        this.location = location;
    }
    
    public JsonNode getPolygon() {
        return polygon;
    }
    
    public void setPolygon(JsonNode polygon) {
        this.polygon = polygon;
    }
    
    public BigDecimal getWindSpeedThreshold() {
        return windSpeedThreshold;
    }
    
    public void setWindSpeedThreshold(BigDecimal windSpeedThreshold) {
        this.windSpeedThreshold = windSpeedThreshold;
    }
    
    public BigDecimal getWaveHeightThreshold() {
        return waveHeightThreshold;
    }
    
    public void setWaveHeightThreshold(BigDecimal waveHeightThreshold) {
        this.waveHeightThreshold = waveHeightThreshold;
    }
    
    public BigDecimal getCurrentSpeedThreshold() {
        return currentSpeedThreshold;
    }
    
    public void setCurrentSpeedThreshold(BigDecimal currentSpeedThreshold) {
        this.currentSpeedThreshold = currentSpeedThreshold;
    }
    
    public ZonedDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(ZonedDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
