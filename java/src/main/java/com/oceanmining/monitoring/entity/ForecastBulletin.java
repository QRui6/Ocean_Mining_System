package com.oceanmining.monitoring.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;

@Entity
@Table(
        name = "forecast_bulletins",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_forecast_bulletin_batch",
                columnNames = {"region_id", "time_range", "base_date", "run_cycle"}
        )
)
public class ForecastBulletin {

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

    @Column(name = "bulletin_text", nullable = false, columnDefinition = "TEXT")
    private String bulletinText;

    @Column(name = "wind_avg", precision = 8, scale = 3)
    private BigDecimal windAvg;

    @Column(name = "wind_max", precision = 8, scale = 3)
    private BigDecimal windMax;

    @Column(name = "wave_avg", precision = 8, scale = 3)
    private BigDecimal waveAvg;

    @Column(name = "wave_max", precision = 8, scale = 3)
    private BigDecimal waveMax;

    @Column(name = "current_avg", precision = 8, scale = 3)
    private BigDecimal currentAvg;

    @Column(name = "current_max", precision = 8, scale = 3)
    private BigDecimal currentMax;

    @Column(name = "risk_level", nullable = false, length = 20)
    private String riskLevel;

    @Column(name = "data_complete", nullable = false)
    private Boolean dataComplete;

    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private ZonedDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        ZonedDateTime now = ZonedDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = ZonedDateTime.now();
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
    public String getBulletinText() { return bulletinText; }
    public void setBulletinText(String bulletinText) { this.bulletinText = bulletinText; }
    public BigDecimal getWindAvg() { return windAvg; }
    public void setWindAvg(BigDecimal windAvg) { this.windAvg = windAvg; }
    public BigDecimal getWindMax() { return windMax; }
    public void setWindMax(BigDecimal windMax) { this.windMax = windMax; }
    public BigDecimal getWaveAvg() { return waveAvg; }
    public void setWaveAvg(BigDecimal waveAvg) { this.waveAvg = waveAvg; }
    public BigDecimal getWaveMax() { return waveMax; }
    public void setWaveMax(BigDecimal waveMax) { this.waveMax = waveMax; }
    public BigDecimal getCurrentAvg() { return currentAvg; }
    public void setCurrentAvg(BigDecimal currentAvg) { this.currentAvg = currentAvg; }
    public BigDecimal getCurrentMax() { return currentMax; }
    public void setCurrentMax(BigDecimal currentMax) { this.currentMax = currentMax; }
    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    public Boolean getDataComplete() { return dataComplete; }
    public void setDataComplete(Boolean dataComplete) { this.dataComplete = dataComplete; }
    public ZonedDateTime getCreatedAt() { return createdAt; }
    public ZonedDateTime getUpdatedAt() { return updatedAt; }
}
