package com.oceanmining.monitoring.entity;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import org.hibernate.annotations.Type;
import org.locationtech.jts.geom.Polygon;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 监控区域实体
 * 对应数据库表：monitoring_areas
 */
@Entity
@Table(name = "monitoring_areas")
public class MonitoringArea {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 船讯网返回的区域ID
     */
    @Column(name = "area_id", unique = true, nullable = false, length = 50)
    private String areaId;
    
    /**
     * 区域名称
     */
    @Column(nullable = false, length = 100)
    private String name;
    
    /**
     * 多边形坐标 (JSONB格式)
     * 存储格式: [[lng,lat],[lng,lat],...]
     */
    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb", nullable = false)
    private String polygon;
    
    /**
     * PostGIS几何对象
     * 用于空间查询
     */
    @Column(columnDefinition = "geometry(Polygon,4326)")
    private Polygon geometry;
    
    /**
     * 风速阈值 (m/s)
     */
    @Column(name = "threshold_wind_speed", precision = 5, scale = 2)
    private BigDecimal thresholdWindSpeed;
    
    /**
     * 浪高阈值 (m)
     */
    @Column(name = "threshold_wave_height", precision = 5, scale = 2)
    private BigDecimal thresholdWaveHeight;
    
    /**
     * 是否激活
     */
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    /**
     * 创建时间
     */
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    /**
     * 更新时间
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    /**
     * 区域内的船舶列表（一对多关系）
     */
    @OneToMany(mappedBy = "area", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<AreaShip> ships;
    
    /**
     * 区域的预警列表（一对多关系）
     */
    @OneToMany(mappedBy = "area", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Warning> warnings;
    
    /**
     * 区域的事件日志列表（一对多关系）
     */
    @OneToMany(mappedBy = "area", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<EventLog> eventLogs;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isActive == null) {
            isActive = true;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getAreaId() { return areaId; }
    public void setAreaId(String areaId) { this.areaId = areaId; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getPolygon() { return polygon; }
    public void setPolygon(String polygon) { this.polygon = polygon; }
    
    public Polygon getGeometry() { return geometry; }
    public void setGeometry(Polygon geometry) { this.geometry = geometry; }
    
    public BigDecimal getThresholdWindSpeed() { return thresholdWindSpeed; }
    public void setThresholdWindSpeed(BigDecimal thresholdWindSpeed) { this.thresholdWindSpeed = thresholdWindSpeed; }
    
    public BigDecimal getThresholdWaveHeight() { return thresholdWaveHeight; }
    public void setThresholdWaveHeight(BigDecimal thresholdWaveHeight) { this.thresholdWaveHeight = thresholdWaveHeight; }
    
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public List<AreaShip> getShips() { return ships; }
    public void setShips(List<AreaShip> ships) { this.ships = ships; }
    
    public List<Warning> getWarnings() { return warnings; }
    public void setWarnings(List<Warning> warnings) { this.warnings = warnings; }
    
    public List<EventLog> getEventLogs() { return eventLogs; }
    public void setEventLogs(List<EventLog> eventLogs) { this.eventLogs = eventLogs; }
}
