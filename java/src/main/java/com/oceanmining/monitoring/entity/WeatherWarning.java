package com.oceanmining.monitoring.entity;

import com.fasterxml.jackson.databind.JsonNode;
import com.oceanmining.monitoring.enums.WeatherWarningSeverity;
import com.oceanmining.monitoring.enums.WeatherWarningStatus;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import org.hibernate.annotations.Type;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;

@Entity
@Table(
        name = "weather_warnings",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_weather_warning_batch",
                columnNames = {"region_id", "time_range", "base_date", "run_cycle"}
        )
)
public class WeatherWarning {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "region_id", nullable = false)
    private MiningRegion region;

    @Column(name = "time_range", nullable = false, length = 10)
    private String timeRange;

    @Column(name = "base_date", nullable = false)
    private LocalDate baseDate;

    @Column(name = "run_cycle", nullable = false, length = 10)
    private String runCycle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WeatherWarningSeverity severity;

    @Column(name = "trigger_type", nullable = false, length = 100)
    private String triggerType;

    @Type(JsonBinaryType.class)
    @Column(name = "trigger_detail", nullable = false, columnDefinition = "jsonb")
    private JsonNode triggerDetail;

    @Column(name = "warning_message", nullable = false, columnDefinition = "TEXT")
    private String warningMessage;

    @Column(name = "bulletin_text", nullable = false, columnDefinition = "TEXT")
    private String bulletinText;

    @Type(JsonBinaryType.class)
    @Column(name = "forecast_data", columnDefinition = "jsonb")
    private JsonNode forecastData;

    @Column(name = "wind_threshold", precision = 8, scale = 3)
    private BigDecimal windThreshold;

    @Column(name = "wave_threshold", precision = 8, scale = 3)
    private BigDecimal waveThreshold;

    @Column(name = "current_threshold", precision = 8, scale = 3)
    private BigDecimal currentThreshold;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WeatherWarningStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @Column(name = "resolved_at")
    private ZonedDateTime resolvedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = ZonedDateTime.now();
        if (status == null) {
            status = WeatherWarningStatus.ACTIVE;
        }
    }

    public void resolve() {
        status = WeatherWarningStatus.RESOLVED;
        resolvedAt = ZonedDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public MiningRegion getRegion() { return region; }
    public void setRegion(MiningRegion region) { this.region = region; }
    public String getTimeRange() { return timeRange; }
    public void setTimeRange(String timeRange) { this.timeRange = timeRange; }
    public LocalDate getBaseDate() { return baseDate; }
    public void setBaseDate(LocalDate baseDate) { this.baseDate = baseDate; }
    public String getRunCycle() { return runCycle; }
    public void setRunCycle(String runCycle) { this.runCycle = runCycle; }
    public WeatherWarningSeverity getSeverity() { return severity; }
    public void setSeverity(WeatherWarningSeverity severity) { this.severity = severity; }
    public String getTriggerType() { return triggerType; }
    public void setTriggerType(String triggerType) { this.triggerType = triggerType; }
    public JsonNode getTriggerDetail() { return triggerDetail; }
    public void setTriggerDetail(JsonNode triggerDetail) { this.triggerDetail = triggerDetail; }
    public String getWarningMessage() { return warningMessage; }
    public void setWarningMessage(String warningMessage) { this.warningMessage = warningMessage; }
    public String getBulletinText() { return bulletinText; }
    public void setBulletinText(String bulletinText) { this.bulletinText = bulletinText; }
    public JsonNode getForecastData() { return forecastData; }
    public void setForecastData(JsonNode forecastData) { this.forecastData = forecastData; }
    public BigDecimal getWindThreshold() { return windThreshold; }
    public void setWindThreshold(BigDecimal windThreshold) { this.windThreshold = windThreshold; }
    public BigDecimal getWaveThreshold() { return waveThreshold; }
    public void setWaveThreshold(BigDecimal waveThreshold) { this.waveThreshold = waveThreshold; }
    public BigDecimal getCurrentThreshold() { return currentThreshold; }
    public void setCurrentThreshold(BigDecimal currentThreshold) { this.currentThreshold = currentThreshold; }
    public WeatherWarningStatus getStatus() { return status; }
    public void setStatus(WeatherWarningStatus status) { this.status = status; }
    public ZonedDateTime getCreatedAt() { return createdAt; }
    public ZonedDateTime getResolvedAt() { return resolvedAt; }
}
