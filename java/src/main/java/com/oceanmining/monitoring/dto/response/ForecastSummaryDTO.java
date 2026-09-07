package com.oceanmining.monitoring.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;

public class ForecastSummaryDTO {

    private Long regionId;
    private String regionCode;
    private String regionName;
    private String timeRange;
    private String rangeLabel;
    private LocalDate baseDate;
    private String runCycle;
    private ZonedDateTime periodStart;
    private ZonedDateTime periodEnd;
    private ZonedDateTime requestedPeriodEnd;
    private Boolean dataComplete;
    private Integer dataPointCount;
    private BigDecimal windSpeedAvg;
    private BigDecimal windSpeedMax;
    private BigDecimal gustMax;
    private BigDecimal waveHeightAvg;
    private BigDecimal waveHeightMax;
    private BigDecimal wavePeriodAvg;
    private BigDecimal currentSpeedAvg;
    private BigDecimal currentSpeedMax;
    private String windTrend;
    private String waveTrend;
    private String currentTrend;
    private String riskLevel;

    public Long getRegionId() { return regionId; }
    public void setRegionId(Long regionId) { this.regionId = regionId; }
    public String getRegionCode() { return regionCode; }
    public void setRegionCode(String regionCode) { this.regionCode = regionCode; }
    public String getRegionName() { return regionName; }
    public void setRegionName(String regionName) { this.regionName = regionName; }
    public String getTimeRange() { return timeRange; }
    public void setTimeRange(String timeRange) { this.timeRange = timeRange; }
    public String getRangeLabel() { return rangeLabel; }
    public void setRangeLabel(String rangeLabel) { this.rangeLabel = rangeLabel; }
    public LocalDate getBaseDate() { return baseDate; }
    public void setBaseDate(LocalDate baseDate) { this.baseDate = baseDate; }
    public String getRunCycle() { return runCycle; }
    public void setRunCycle(String runCycle) { this.runCycle = runCycle; }
    public ZonedDateTime getPeriodStart() { return periodStart; }
    public void setPeriodStart(ZonedDateTime periodStart) { this.periodStart = periodStart; }
    public ZonedDateTime getPeriodEnd() { return periodEnd; }
    public void setPeriodEnd(ZonedDateTime periodEnd) { this.periodEnd = periodEnd; }
    public ZonedDateTime getRequestedPeriodEnd() { return requestedPeriodEnd; }
    public void setRequestedPeriodEnd(ZonedDateTime requestedPeriodEnd) { this.requestedPeriodEnd = requestedPeriodEnd; }
    public Boolean getDataComplete() { return dataComplete; }
    public void setDataComplete(Boolean dataComplete) { this.dataComplete = dataComplete; }
    public Integer getDataPointCount() { return dataPointCount; }
    public void setDataPointCount(Integer dataPointCount) { this.dataPointCount = dataPointCount; }
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
    public BigDecimal getCurrentSpeedAvg() { return currentSpeedAvg; }
    public void setCurrentSpeedAvg(BigDecimal currentSpeedAvg) { this.currentSpeedAvg = currentSpeedAvg; }
    public BigDecimal getCurrentSpeedMax() { return currentSpeedMax; }
    public void setCurrentSpeedMax(BigDecimal currentSpeedMax) { this.currentSpeedMax = currentSpeedMax; }
    public String getWindTrend() { return windTrend; }
    public void setWindTrend(String windTrend) { this.windTrend = windTrend; }
    public String getWaveTrend() { return waveTrend; }
    public void setWaveTrend(String waveTrend) { this.waveTrend = waveTrend; }
    public String getCurrentTrend() { return currentTrend; }
    public void setCurrentTrend(String currentTrend) { this.currentTrend = currentTrend; }
    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
}
