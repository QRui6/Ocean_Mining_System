package com.oceanmining.monitoring.dto.response;

import java.time.LocalDate;

public class ForecastRegionDTO {

    private Long regionId;
    private String regionCode;
    private String regionName;
    private LocalDate latestBaseDate;
    private String latestRunCycle;
    private Boolean hasHourlyForecast;
    private Boolean hasDailyForecast;

    public Long getRegionId() { return regionId; }
    public void setRegionId(Long regionId) { this.regionId = regionId; }
    public String getRegionCode() { return regionCode; }
    public void setRegionCode(String regionCode) { this.regionCode = regionCode; }
    public String getRegionName() { return regionName; }
    public void setRegionName(String regionName) { this.regionName = regionName; }
    public LocalDate getLatestBaseDate() { return latestBaseDate; }
    public void setLatestBaseDate(LocalDate latestBaseDate) { this.latestBaseDate = latestBaseDate; }
    public String getLatestRunCycle() { return latestRunCycle; }
    public void setLatestRunCycle(String latestRunCycle) { this.latestRunCycle = latestRunCycle; }
    public Boolean getHasHourlyForecast() { return hasHourlyForecast; }
    public void setHasHourlyForecast(Boolean hasHourlyForecast) { this.hasHourlyForecast = hasHourlyForecast; }
    public Boolean getHasDailyForecast() { return hasDailyForecast; }
    public void setHasDailyForecast(Boolean hasDailyForecast) { this.hasDailyForecast = hasDailyForecast; }
}
