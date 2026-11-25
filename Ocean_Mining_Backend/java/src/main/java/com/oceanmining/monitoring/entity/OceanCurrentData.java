package com.oceanmining.monitoring.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 洋流数据实体
 * 
 * @author Ocean Mining Team
 * @version 1.0.0
 */
@Entity
@Table(name = "ocean_current_data")
public class OceanCurrentData {
    
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
     * U分量（东西向）二进制数据
     */
    @Column(name = "u_component", nullable = false, columnDefinition = "bytea")
    private byte[] uComponent;
    
    /**
     * V分量（南北向）二进制数据
     */
    @Column(name = "v_component", nullable = false, columnDefinition = "bytea")
    private byte[] vComponent;
    
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
    public OceanCurrentData() {}
    
    public OceanCurrentData(WeatherMetadata metadata, Integer timeIndex, byte[] uComponent, byte[] vComponent,
                           Float uMin, Float uMax, Float vMin, Float vMax, Integer dataSize) {
        this.metadata = metadata;
        this.timeIndex = timeIndex;
        this.uComponent = uComponent;
        this.vComponent = vComponent;
        this.uMin = uMin;
        this.uMax = uMax;
        this.vMin = vMin;
        this.vMax = vMax;
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
    
    public Float getUMin() { return uMin; }
    public void setUMin(Float uMin) { this.uMin = uMin; }
    
    public Float getUMax() { return uMax; }
    public void setUMax(Float uMax) { this.uMax = uMax; }
    
    public Float getVMin() { return vMin; }
    public void setVMin(Float vMin) { this.vMin = vMin; }
    
    public Float getVMax() { return vMax; }
    public void setVMax(Float vMax) { this.vMax = vMax; }
    
    public Integer getDataSize() { return dataSize; }
    public void setDataSize(Integer dataSize) { this.dataSize = dataSize; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
