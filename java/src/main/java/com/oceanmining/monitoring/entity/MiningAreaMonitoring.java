package com.oceanmining.monitoring.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Entity
@Table(name = "mining_area_monitoring")
public class MiningAreaMonitoring {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "mining_area_id", nullable = false)
    private Long miningAreaId;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "mining_area_id", insertable = false, updatable = false)
    private MiningArea miningArea;
    
    @Column(name = "wind_speed_threshold", precision = 5, scale = 2)
    private BigDecimal windSpeedThreshold;
    
    @Column(name = "wave_height_threshold", precision = 5, scale = 2)
    private BigDecimal waveHeightThreshold;
    
    @Column(name = "current_speed_threshold", precision = 5, scale = 2)
    private BigDecimal currentSpeedThreshold;
    
    @Column(name = "created_at")
    private ZonedDateTime createdAt;
    
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = ZonedDateTime.now();
        updatedAt = ZonedDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = ZonedDateTime.now();
    }

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

    public MiningArea getMiningArea() {
        return miningArea;
    }

    public void setMiningArea(MiningArea miningArea) {
        this.miningArea = miningArea;
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

    public ZonedDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(ZonedDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
