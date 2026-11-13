package com.oceanmining.monitoring.dto.response;

import java.time.LocalDate;
import java.time.ZonedDateTime;

public class ForecastBulletinDTO {

    private Long id;
    private Long regionId;
    private String regionCode;
    private String regionName;
    private String timeRange;
    private LocalDate baseDate;
    private String runCycle;
    private String riskLevel;
    private Boolean dataComplete;
    private String bulletinText;
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getRegionId() { return regionId; }
    public void setRegionId(Long regionId) { this.regionId = regionId; }
    public String getRegionCode() { return regionCode; }
    public void setRegionCode(String regionCode) { this.regionCode = regionCode; }
    public String getRegionName() { return regionName; }
    public void setRegionName(String regionName) { this.regionName = regionName; }
    public String getTimeRange() { return timeRange; }
    public void setTimeRange(String timeRange) { this.timeRange = timeRange; }
    public LocalDate getBaseDate() { return baseDate; }
    public void setBaseDate(LocalDate baseDate) { this.baseDate = baseDate; }
    public String getRunCycle() { return runCycle; }
    public void setRunCycle(String runCycle) { this.runCycle = runCycle; }
    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    public Boolean getDataComplete() { return dataComplete; }
    public void setDataComplete(Boolean dataComplete) { this.dataComplete = dataComplete; }
    public String getBulletinText() { return bulletinText; }
    public void setBulletinText(String bulletinText) { this.bulletinText = bulletinText; }
    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }
    public ZonedDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(ZonedDateTime updatedAt) { this.updatedAt = updatedAt; }
}
