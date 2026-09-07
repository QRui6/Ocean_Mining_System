package com.oceanmining.monitoring.entity;

import com.oceanmining.monitoring.converter.WarningSeverityConverter;
import com.oceanmining.monitoring.enums.WarningSeverity;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;

/**
 * 预警记录实体
 * 对应数据库表：warnings
 */
@Entity
@Table(name = "warnings")
public class Warning {
    
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
     * 预警类型 (wind/wave/typhoon等)
     */
    @Column(name = "warning_type", length = 50)
    private String warningType;
    
    /**
     * 严重程度
     */
    @Convert(converter = WarningSeverityConverter.class)
    @Column(columnDefinition = "warning_severity")
    private WarningSeverity severity;
    
    /**
     * 预警消息
     */
    @Column(columnDefinition = "TEXT")
    private String message;
    
    /**
     * 气象数据 (JSONB格式)
     */
    @Type(JsonBinaryType.class)
    @Column(name = "weather_data", columnDefinition = "jsonb")
    private String weatherData;
    
    /**
     * 是否已解决
     */
    @Column(name = "is_resolved")
    private Boolean isResolved = false;
    
    /**
     * 创建时间
     */
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    /**
     * 解决时间
     */
    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (isResolved == null) {
            isResolved = false;
        }
        if (severity == null) {
            severity = WarningSeverity.LOW;
        }
    }
    
    /**
     * 解决预警
     */
    public void resolve() {
        this.isResolved = true;
        this.resolvedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public MonitoringArea getArea() { return area; }
    public void setArea(MonitoringArea area) { this.area = area; }
    
    public Long getMmsi() { return mmsi; }
    public void setMmsi(Long mmsi) { this.mmsi = mmsi; }
    
    public String getWarningType() { return warningType; }
    public void setWarningType(String warningType) { this.warningType = warningType; }
    
    public WarningSeverity getSeverity() { return severity; }
    public void setSeverity(WarningSeverity severity) { this.severity = severity; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public String getWeatherData() { return weatherData; }
    public void setWeatherData(String weatherData) { this.weatherData = weatherData; }
    
    public Boolean getIsResolved() { return isResolved; }
    public void setIsResolved(Boolean isResolved) { this.isResolved = isResolved; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
}
