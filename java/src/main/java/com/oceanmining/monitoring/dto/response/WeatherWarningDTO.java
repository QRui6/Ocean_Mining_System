package com.oceanmining.monitoring.dto.response;

import com.fasterxml.jackson.databind.JsonNode;
import com.oceanmining.monitoring.enums.WeatherWarningSeverity;
import com.oceanmining.monitoring.enums.WeatherWarningStatus;

import java.time.LocalDate;
import java.time.ZonedDateTime;

public class WeatherWarningDTO {

    private Long id;
    private String warningCode;
    private Long regionId;
    private String regionCode;
    private String regionName;
    private String timeRange;
    private LocalDate baseDate;
    private String runCycle;
    private WeatherWarningSeverity severity;
    private String triggerType;
    private JsonNode triggerDetail;
    private String warningMessage;
    private WeatherWarningStatus status;
    private ZonedDateTime createdAt;
    private ZonedDateTime resolvedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getWarningCode() { return warningCode; }
    public void setWarningCode(String warningCode) { this.warningCode = warningCode; }
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
    public WeatherWarningSeverity getSeverity() { return severity; }
    public void setSeverity(WeatherWarningSeverity severity) { this.severity = severity; }
    public String getTriggerType() { return triggerType; }
    public void setTriggerType(String triggerType) { this.triggerType = triggerType; }
    public JsonNode getTriggerDetail() { return triggerDetail; }
    public void setTriggerDetail(JsonNode triggerDetail) { this.triggerDetail = triggerDetail; }
    public String getWarningMessage() { return warningMessage; }
    public void setWarningMessage(String warningMessage) { this.warningMessage = warningMessage; }
    public WeatherWarningStatus getStatus() { return status; }
    public void setStatus(WeatherWarningStatus status) { this.status = status; }
    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }
    public ZonedDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(ZonedDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
}
