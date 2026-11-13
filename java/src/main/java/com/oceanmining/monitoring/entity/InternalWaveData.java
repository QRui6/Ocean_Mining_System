package com.oceanmining.monitoring.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * 内波数据实体
 */
@Entity
@Table(name = "internal_wave_data")
public class InternalWaveData {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "time_index", nullable = false, unique = true)
    private Integer timeIndex;
    
    @Column(name = "u_data", columnDefinition = "bytea", nullable = false)
    private byte[] uData;
    
    @Column(name = "v_data", columnDefinition = "bytea", nullable = false)
    private byte[] vData;
    
    @Column(nullable = false)
    private Integer width;
    
    @Column(nullable = false)
    private Integer height;
    
    @Column(name = "u_min", nullable = false)
    private Float uMin;
    
    @Column(name = "u_max", nullable = false)
    private Float uMax;
    
    @Column(name = "v_min", nullable = false)
    private Float vMin;
    
    @Column(name = "v_max", nullable = false)
    private Float vMax;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Integer getTimeIndex() {
        return timeIndex;
    }
    
    public void setTimeIndex(Integer timeIndex) {
        this.timeIndex = timeIndex;
    }
    
    public byte[] getUData() {
        return uData;
    }
    
    public void setUData(byte[] uData) {
        this.uData = uData;
    }
    
    public byte[] getVData() {
        return vData;
    }
    
    public void setVData(byte[] vData) {
        this.vData = vData;
    }
    
    public Integer getWidth() {
        return width;
    }
    
    public void setWidth(Integer width) {
        this.width = width;
    }
    
    public Integer getHeight() {
        return height;
    }
    
    public void setHeight(Integer height) {
        this.height = height;
    }
    
    public Float getUMin() {
        return uMin;
    }
    
    public void setUMin(Float uMin) {
        this.uMin = uMin;
    }
    
    public Float getUMax() {
        return uMax;
    }
    
    public void setUMax(Float uMax) {
        this.uMax = uMax;
    }
    
    public Float getVMin() {
        return vMin;
    }
    
    public void setVMin(Float vMin) {
        this.vMin = vMin;
    }
    
    public Float getVMax() {
        return vMax;
    }
    
    public void setVMax(Float vMax) {
        this.vMax = vMax;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
