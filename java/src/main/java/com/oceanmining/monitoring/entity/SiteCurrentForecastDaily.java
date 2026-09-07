package com.oceanmining.monitoring.entity;

import com.fasterxml.jackson.databind.JsonNode;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.Type;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;

@Entity
@Table(name = "site_current_forecasts_daily")
public class SiteCurrentForecastDaily {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "site_id", nullable = false)
    private ForecastSite site;

    @ManyToOne
    @JoinColumn(name = "region_id", nullable = false)
    private MiningRegion region;

    @Column(name = "base_date", nullable = false)
    private LocalDate baseDate;

    @Column(name = "run_cycle", nullable = false, length = 10)
    private String runCycle;

    @Column(name = "forecast_date", nullable = false)
    private LocalDate forecastDate;

    @Column(name = "current_speed_avg", precision = 8, scale = 3)
    private BigDecimal currentSpeedAvg;

    @Column(name = "current_speed_max", precision = 8, scale = 3)
    private BigDecimal currentSpeedMax;

    @Column(name = "current_dir_mean", precision = 8, scale = 3)
    private BigDecimal currentDirMean;

    @Column(name = "hour_count", nullable = false)
    private Integer hourCount;

    @Type(JsonBinaryType.class)
    @Column(name = "source_file_ids", columnDefinition = "jsonb", nullable = false)
    private JsonNode sourceFileIds;

    @Column(name = "is_latest", nullable = false)
    private Boolean isLatest;

    @Column(name = "created_at")
    private ZonedDateTime createdAt;

    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ForecastSite getSite() { return site; }
    public void setSite(ForecastSite site) { this.site = site; }

    public MiningRegion getRegion() { return region; }
    public void setRegion(MiningRegion region) { this.region = region; }

    public LocalDate getBaseDate() { return baseDate; }
    public void setBaseDate(LocalDate baseDate) { this.baseDate = baseDate; }

    public String getRunCycle() { return runCycle; }
    public void setRunCycle(String runCycle) { this.runCycle = runCycle; }

    public LocalDate getForecastDate() { return forecastDate; }
    public void setForecastDate(LocalDate forecastDate) { this.forecastDate = forecastDate; }

    public BigDecimal getCurrentSpeedAvg() { return currentSpeedAvg; }
    public void setCurrentSpeedAvg(BigDecimal currentSpeedAvg) { this.currentSpeedAvg = currentSpeedAvg; }

    public BigDecimal getCurrentSpeedMax() { return currentSpeedMax; }
    public void setCurrentSpeedMax(BigDecimal currentSpeedMax) { this.currentSpeedMax = currentSpeedMax; }

    public BigDecimal getCurrentDirMean() { return currentDirMean; }
    public void setCurrentDirMean(BigDecimal currentDirMean) { this.currentDirMean = currentDirMean; }

    public Integer getHourCount() { return hourCount; }
    public void setHourCount(Integer hourCount) { this.hourCount = hourCount; }

    public JsonNode getSourceFileIds() { return sourceFileIds; }
    public void setSourceFileIds(JsonNode sourceFileIds) { this.sourceFileIds = sourceFileIds; }

    public Boolean getIsLatest() { return isLatest; }
    public void setIsLatest(Boolean latest) { isLatest = latest; }

    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }

    public ZonedDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(ZonedDateTime updatedAt) { this.updatedAt = updatedAt; }
}
