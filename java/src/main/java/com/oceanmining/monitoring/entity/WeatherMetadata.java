package com.oceanmining.monitoring.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 气象数据元数据实体
 * 
 * @author Ocean Mining Team
 * @version 1.0.0
 */
@Entity
@Table(name = "weather_metadata")
public class WeatherMetadata {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 数据类型
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "data_type_id", nullable = false)
    private WeatherDataType dataType;
    
    /**
     * 经度网格数量
     */
    @Column(name = "grid_lon_size", nullable = false)
    private Integer gridLonSize;
    
    /**
     * 纬度网格数量
     */
    @Column(name = "grid_lat_size", nullable = false)
    private Integer gridLatSize;
    
    /**
     * 经度最小值
     */
    @Column(name = "grid_lon_min", nullable = false, precision = 10, scale = 6)
    private BigDecimal gridLonMin;
    
    /**
     * 纬度最小值
     */
    @Column(name = "grid_lat_min", nullable = false, precision = 10, scale = 6)
    private BigDecimal gridLatMin;
    
    /**
     * 经度最大值
     */
    @Column(name = "grid_lon_max", nullable = false, precision = 10, scale = 6)
    private BigDecimal gridLonMax;
    
    /**
     * 纬度最大值
     */
    @Column(name = "grid_lat_max", nullable = false, precision = 10, scale = 6)
    private BigDecimal gridLatMax;
    
    /**
     * 经度步长
     */
    @Column(name = "grid_lon_step", precision = 10, scale = 6)
    private BigDecimal gridLonStep;
    
    /**
     * 纬度步长
     */
    @Column(name = "grid_lat_step", precision = 10, scale = 6)
    private BigDecimal gridLatStep;
    
    /**
     * 起始时间
     */
    @Column(name = "start_time")
    private LocalDateTime startTime;
    
    /**
     * 时间步长（小时）
     */
    @Column(name = "time_step_hours")
    private Integer timeStepHours;
    
    /**
     * 总时间帧数
     */
    @Column(name = "total_frames", nullable = false)
    private Integer totalFrames;
    
    /**
     * 数据来源
     */
    @Column(name = "data_source", length = 100)
    private String dataSource;
    
    /**
     * 创建时间
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    /**
     * 更新时间
     */
    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    // Constructors
    public WeatherMetadata() {}
    
    public WeatherMetadata(WeatherDataType dataType, Integer gridLonSize, Integer gridLatSize,
                          BigDecimal gridLonMin, BigDecimal gridLatMin, BigDecimal gridLonMax, BigDecimal gridLatMax,
                          BigDecimal gridLonStep, BigDecimal gridLatStep, LocalDateTime startTime,
                          Integer timeStepHours, Integer totalFrames, String dataSource) {
        this.dataType = dataType;
        this.gridLonSize = gridLonSize;
        this.gridLatSize = gridLatSize;
        this.gridLonMin = gridLonMin;
        this.gridLatMin = gridLatMin;
        this.gridLonMax = gridLonMax;
        this.gridLatMax = gridLatMax;
        this.gridLonStep = gridLonStep;
        this.gridLatStep = gridLatStep;
        this.startTime = startTime;
        this.timeStepHours = timeStepHours;
        this.totalFrames = totalFrames;
        this.dataSource = dataSource;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public WeatherDataType getDataType() { return dataType; }
    public void setDataType(WeatherDataType dataType) { this.dataType = dataType; }
    
    public Integer getGridLonSize() { return gridLonSize; }
    public void setGridLonSize(Integer gridLonSize) { this.gridLonSize = gridLonSize; }
    
    public Integer getGridLatSize() { return gridLatSize; }
    public void setGridLatSize(Integer gridLatSize) { this.gridLatSize = gridLatSize; }
    
    public BigDecimal getGridLonMin() { return gridLonMin; }
    public void setGridLonMin(BigDecimal gridLonMin) { this.gridLonMin = gridLonMin; }
    
    public BigDecimal getGridLatMin() { return gridLatMin; }
    public void setGridLatMin(BigDecimal gridLatMin) { this.gridLatMin = gridLatMin; }
    
    public BigDecimal getGridLonMax() { return gridLonMax; }
    public void setGridLonMax(BigDecimal gridLonMax) { this.gridLonMax = gridLonMax; }
    
    public BigDecimal getGridLatMax() { return gridLatMax; }
    public void setGridLatMax(BigDecimal gridLatMax) { this.gridLatMax = gridLatMax; }
    
    public BigDecimal getGridLonStep() { return gridLonStep; }
    public void setGridLonStep(BigDecimal gridLonStep) { this.gridLonStep = gridLonStep; }
    
    public BigDecimal getGridLatStep() { return gridLatStep; }
    public void setGridLatStep(BigDecimal gridLatStep) { this.gridLatStep = gridLatStep; }
    
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    
    public Integer getTimeStepHours() { return timeStepHours; }
    public void setTimeStepHours(Integer timeStepHours) { this.timeStepHours = timeStepHours; }
    
    public Integer getTotalFrames() { return totalFrames; }
    public void setTotalFrames(Integer totalFrames) { this.totalFrames = totalFrames; }
    
    public String getDataSource() { return dataSource; }
    public void setDataSource(String dataSource) { this.dataSource = dataSource; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
