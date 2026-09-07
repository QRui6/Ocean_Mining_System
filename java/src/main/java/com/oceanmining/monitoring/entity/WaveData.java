package com.oceanmining.monitoring.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 波浪数据实体
 * 
 * @author Ocean Mining Team
 * @version 1.0.0
 */
@Entity
@Table(name = "wave_data")
public class WaveData {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 元数据引用
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "metadata_id", nullable = false)
    private WeatherMetadata metadata;
    
    /**
     * 时间索引
     */
    @Column(name = "time_index", nullable = false)
    private Integer timeIndex;
    
    /**
     * Stokes drift U分量二进制数据
     */
    @Column(name = "u_component", nullable = false, columnDefinition = "bytea")
    private byte[] uComponent;
    
    /**
     * Stokes drift V分量二进制数据
     */
    @Column(name = "v_component", nullable = false, columnDefinition = "bytea")
    private byte[] vComponent;
    
    /**
     * 波高二进制数据（可选）
     */
    @Column(name = "wave_height", columnDefinition = "bytea")
    private byte[] waveHeight;
    
    /**
     * U分量最小值
     */
    @Column(name = "u_min", nullable = false)
    private Float uMin;
    
    /**
     * U分量最大值
     */
    @Column(name = "u_max", nullable = false)
    private Float uMax;
    
    /**
     * V分量最小值
     */
    @Column(name = "v_min", nullable = false)
    private Float vMin;
    
    /**
     * V分量最大值
     */
    @Column(name = "v_max", nullable = false)
    private Float vMax;
    
    /**
     * 波高最小值
     */
    @Column(name = "hs_min")
    private Float hsMin;
    
    /**
     * 波高最大值
     */
    @Column(name = "hs_max")
    private Float hsMax;
    
    /**
     * 数据点总数
     */
    @Column(name = "data_size", nullable = false)
    private Integer dataSize;
    
    /**
     * 创建时间
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    // Constructors
    public WaveData() {}
    
    public WaveData(WeatherMetadata metadata, Integer timeIndex, byte[] uComponent, byte[] vComponent,
                    byte[] waveHeight, Float uMin, Float uMax, Float vMin, Float vMax,
                    Float hsMin, Float hsMax, Integer dataSize) {
        this.metadata = metadata;
        this.timeIndex = timeIndex;
        this.uComponent = uComponent;
        this.vComponent = vComponent;
        this.waveHeight = waveHeight;
        this.uMin = uMin;
        this.uMax = uMax;
        this.vMin = vMin;
        this.vMax = vMax;
        this.hsMin = hsMin;
        this.hsMax = hsMax;
        this.dataSize = dataSize;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public WeatherMetadata getMetadata() { return metadata; }
    public void setMetadata(WeatherMetadata metadata) { this.metadata = metadata; }
    
    public Integer getTimeIndex() { return timeIndex; }
    public void setTimeIndex(Integer timeIndex) { this.timeIndex = timeIndex; }
    
    public byte[] getUComponent() { return uComponent; }
    public void setUComponent(byte[] uComponent) { this.uComponent = uComponent; }
    
    public byte[] getVComponent() { return vComponent; }
    public void setVComponent(byte[] vComponent) { this.vComponent = vComponent; }
    
    public byte[] getWaveHeight() { return waveHeight; }
    public void setWaveHeight(byte[] waveHeight) { this.waveHeight = waveHeight; }
    
    public Float getUMin() { return uMin; }
    public void setUMin(Float uMin) { this.uMin = uMin; }
    
    public Float getUMax() { return uMax; }
    public void setUMax(Float uMax) { this.uMax = uMax; }
    
    public Float getVMin() { return vMin; }
    public void setVMin(Float vMin) { this.vMin = vMin; }
    
    public Float getVMax() { return vMax; }
    public void setVMax(Float vMax) { this.vMax = vMax; }
    
    public Float getHsMin() { return hsMin; }
    public void setHsMin(Float hsMin) { this.hsMin = hsMin; }
    
    public Float getHsMax() { return hsMax; }
    public void setHsMax(Float hsMax) { this.hsMax = hsMax; }
    
    public Integer getDataSize() { return dataSize; }
    public void setDataSize(Integer dataSize) { this.dataSize = dataSize; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
