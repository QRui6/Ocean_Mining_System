package com.oceanmining.monitoring.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;

public class RegionForecastHourlyDTO {

    private Long regionId;
    private String regionName;
    private LocalDate baseDate;
    private String runCycle;
    private LocalDate forecastDate;
    private ZonedDateTime forecastTime;
    private Integer forecastHour;
    private BigDecimal windSpeedAvg;
    private BigDecimal windSpeedMax;
    private BigDecimal windDirMean;
    private BigDecimal gustMax;
    private BigDecimal waveHeightAvg;
    private BigDecimal waveHeightMax;
    private BigDecimal wavePeriodAvg;
    private BigDecimal waveDirMean;
    private BigDecimal currentSpeedAvg;
    private BigDecimal currentSpeedMax;
    private BigDecimal currentDirMean;

    public Long getRegionId() { return regionId; }
    public void setRegionId(Long regionId) { this.regionId = regionId; }

    public String getRegionName() { return regionName; }
    public void setRegionName(String regionName) { this.regionName = regionName; }

    public LocalDate getBaseDate() { return baseDate; }
    public void setBaseDate(LocalDate baseDate) { this.baseDate = baseDate; }

    public String getRunCycle() { return runCycle; }
    public void setRunCycle(String runCycle) { this.runCycle = runCycle; }

    public LocalDate getForecastDate() { return forecastDate; }
    public void setForecastDate(LocalDate forecastDate) { this.forecastDate = forecastDate; }

    public ZonedDateTime getForecastTime() { return forecastTime; }
    public void setForecastTime(ZonedDateTime forecastTime) { this.forecastTime = forecastTime; }

    public Integer getForecastHour() { return forecastHour; }
    public void setForecastHour(Integer forecastHour) { this.forecastHour = forecastHour; }

    public BigDecimal getWindSpeedAvg() { return windSpeedAvg; }
    public void setWindSpeedAvg(BigDecimal windSpeedAvg) { this.windSpeedAvg = windSpeedAvg; }

    public BigDecimal getWindSpeedMax() { return windSpeedMax; }
    public void setWindSpeedMax(BigDecimal windSpeedMax) { this.windSpeedMax = windSpeedMax; }

    public BigDecimal getWindDirMean() { return windDirMean; }
    public void setWindDirMean(BigDecimal windDirMean) { this.windDirMean = windDirMean; }

    public BigDecimal getGustMax() { return gustMax; }
    public void setGustMax(BigDecimal gustMax) { this.gustMax = gustMax; }

    public BigDecimal getWaveHeightAvg() { return waveHeightAvg; }
    public void setWaveHeightAvg(BigDecimal waveHeightAvg) { this.waveHeightAvg = waveHeightAvg; }

    public BigDecimal getWaveHeightMax() { return waveHeightMax; }
    public void setWaveHeightMax(BigDecimal waveHeightMax) { this.waveHeightMax = waveHeightMax; }

    public BigDecimal getWavePeriodAvg() { return wavePeriodAvg; }
    public void setWavePeriodAvg(BigDecimal wavePeriodAvg) { this.wavePeriodAvg = wavePeriodAvg; }

    public BigDecimal getWaveDirMean() { return waveDirMean; }
    public void setWaveDirMean(BigDecimal waveDirMean) { this.waveDirMean = waveDirMean; }

    public BigDecimal getCurrentSpeedAvg() { return currentSpeedAvg; }
    public void setCurrentSpeedAvg(BigDecimal currentSpeedAvg) { this.currentSpeedAvg = currentSpeedAvg; }

    public BigDecimal getCurrentSpeedMax() { return currentSpeedMax; }
    public void setCurrentSpeedMax(BigDecimal currentSpeedMax) { this.currentSpeedMax = currentSpeedMax; }

    public BigDecimal getCurrentDirMean() { return currentDirMean; }
    public void setCurrentDirMean(BigDecimal currentDirMean) { this.currentDirMean = currentDirMean; }
}
