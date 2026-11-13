package com.oceanmining.monitoring.entity;

import com.oceanmining.monitoring.converter.RiskLevelConverter;
import com.oceanmining.monitoring.converter.ShipStatusConverter;
import com.oceanmining.monitoring.enums.RiskLevel;
import com.oceanmining.monitoring.enums.ShipStatus;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import org.hibernate.annotations.Type;
import org.locationtech.jts.geom.Point;

import java.time.LocalDateTime;

/**
 * 区域内船舶实体
 * 对应数据库表：area_ships
 */
@Entity
@Table(name = "area_ships", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"area_id", "mmsi", "status"}))
public class AreaShip {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 所属区域
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "area_id", nullable = false)
    private MonitoringArea area;
    
    /**
     * 船舶MMSI号
     */
    @Column(nullable = false)
    private Long mmsi;
    
    /**
     * 船舶名称
     */
    @Column(name = "ship_name", length = 100)
    private String shipName;
    
    /**
     * 进入时间
     */
    @Column(name = "enter_time")
    private LocalDateTime enterTime;
    
    /**
     * 离开时间
     */
    @Column(name = "leave_time")
    private LocalDateTime leaveTime;
    
    /**
     * 船舶状态
     */
    @Convert(converter = ShipStatusConverter.class)
    @Column(columnDefinition = "ship_status")
    private ShipStatus status;
    
    /**
     * 最后位置 (JSONB格式)
     * 存储格式: {"lat": 30.0, "lng": 120.0}
     */
    @Type(JsonBinaryType.class)
    @Column(name = "last_position", columnDefinition = "jsonb")
    private String lastPosition;
    
    /**
     * 最后位置点 (PostGIS Point)
     */
    @Column(name = "last_point", columnDefinition = "geometry(Point,4326)")
    private Point lastPoint;
    
    /**
     * 最新气象数据 (JSONB格式)
     */
    @Type(JsonBinaryType.class)
    @Column(name = "last_weather", columnDefinition = "jsonb")
    private String lastWeather;
    
    /**
     * 风险等级
     */
    @Convert(converter = RiskLevelConverter.class)
    @Column(name = "risk_level", columnDefinition = "risk_level")
    private RiskLevel riskLevel;
    
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
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = ShipStatus.IN_AREA;
        }
        if (riskLevel == null) {
            riskLevel = RiskLevel.SAFE;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public MonitoringArea getArea() { return area; }
    public void setArea(MonitoringArea area) { this.area = area; }
    
    public Long getMmsi() { return mmsi; }
    public void setMmsi(Long mmsi) { this.mmsi = mmsi; }
    
    public String getShipName() { return shipName; }
    public void setShipName(String shipName) { this.shipName = shipName; }
    
    public LocalDateTime getEnterTime() { return enterTime; }
    public void setEnterTime(LocalDateTime enterTime) { this.enterTime = enterTime; }
    
    public LocalDateTime getLeaveTime() { return leaveTime; }
    public void setLeaveTime(LocalDateTime leaveTime) { this.leaveTime = leaveTime; }
    
    public ShipStatus getStatus() { return status; }
    public void setStatus(ShipStatus status) { this.status = status; }
    
    public String getLastPosition() { return lastPosition; }
    public void setLastPosition(String lastPosition) { this.lastPosition = lastPosition; }
    
    public Point getLastPoint() { return lastPoint; }
    public void setLastPoint(Point lastPoint) { this.lastPoint = lastPoint; }
    
    public String getLastWeather() { return lastWeather; }
    public void setLastWeather(String lastWeather) { this.lastWeather = lastWeather; }
    
    public RiskLevel getRiskLevel() { return riskLevel; }
    public void setRiskLevel(RiskLevel riskLevel) { this.riskLevel = riskLevel; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
