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
@Table(name = "region_forecasts_daily")
public class RegionForecastDaily {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "region_id", nullable = false)
    private MiningRegion region;

    @Column(name = "base_date", nullable = false)
    private LocalDate baseDate;

    @Column(name = "run_cycle", nullable = false, length = 10)
    private String runCycle;

    @Column(name = "forecast_date", nullable = false)
    private LocalDate forecastDate;

    @Column(name = "wind_speed_avg", precision = 8, scale = 3)
    private BigDecimal windSpeedAvg;

    @Column(name = "wind_speed_max", precision = 8, scale = 3)
    private BigDecimal windSpeedMax;

    @Column(name = "gust_max", precision = 8, scale = 3)
    private BigDecimal gustMax;

    @Column(name = "wave_height_avg", precision = 8, scale = 3)
    private BigDecimal waveHeightAvg;

    @Column(name = "wave_height_max", precision = 8, scale = 3)
    private BigDecimal waveHeightMax;

    @Column(name = "wave_period_avg", precision = 8, scale = 3)
    private BigDecimal wavePeriodAvg;

    @Column(name = "wind_dir_mean", precision = 8, scale = 3)
    private BigDecimal windDirMean;

    @Column(name = "wave_dir_mean", precision = 8, scale = 3)
    private BigDecimal waveDirMean;

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

    public MiningRegion getRegion() { return region; }
    public void setRegion(MiningRegion region) { this.region = region; }

    public LocalDate getBaseDate() { return baseDate; }
    public void setBaseDate(LocalDate baseDate) { this.baseDate = baseDate; }

    public String getRunCycle() { return runCycle; }
    public void setRunCycle(String runCycle) { this.runCycle = runCycle; }

    public LocalDate getForecastDate() { return forecastDate; }
    public void setForecastDate(LocalDate forecastDate) { this.forecastDate = forecastDate; }

    public BigDecimal getWindSpeedAvg() { return windSpeedAvg; }
    public void setWindSpeedAvg(BigDecimal windSpeedAvg) { this.windSpeedAvg = windSpeedAvg; }

    public BigDecimal getWindSpeedMax() { return windSpeedMax; }
    public void setWindSpeedMax(BigDecimal windSpeedMax) { this.windSpeedMax = windSpeedMax; }

    public BigDecimal getGustMax() { return gustMax; }
    public void setGustMax(BigDecimal gustMax) { this.gustMax = gustMax; }

    public BigDecimal getWaveHeightAvg() { return waveHeightAvg; }
    public void setWaveHeightAvg(BigDecimal waveHeightAvg) { this.waveHeightAvg = waveHeightAvg; }

    public BigDecimal getWaveHeightMax() { return waveHeightMax; }
    public void setWaveHeightMax(BigDecimal waveHeightMax) { this.waveHeightMax = waveHeightMax; }

    public BigDecimal getWavePeriodAvg() { return wavePeriodAvg; }
    public void setWavePeriodAvg(BigDecimal wavePeriodAvg) { this.wavePeriodAvg = wavePeriodAvg; }

    public BigDecimal getWindDirMean() { return windDirMean; }
    public void setWindDirMean(BigDecimal windDirMean) { this.windDirMean = windDirMean; }

    public BigDecimal getWaveDirMean() { return waveDirMean; }
    public void setWaveDirMean(BigDecimal waveDirMean) { this.waveDirMean = waveDirMean; }

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
