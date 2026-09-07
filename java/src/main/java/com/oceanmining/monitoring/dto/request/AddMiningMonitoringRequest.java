package com.oceanmining.monitoring.dto.request;

import java.math.BigDecimal;

public class AddMiningMonitoringRequest {
    
    private Long miningAreaId;
    private BigDecimal windSpeedThreshold;
    private BigDecimal waveHeightThreshold;
    private BigDecimal currentSpeedThreshold;
    
    // Getters and Setters
    public Long getMiningAreaId() {
        return miningAreaId;
    }
    
    public void setMiningAreaId(Long miningAreaId) {
        this.miningAreaId = miningAreaId;
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
}
