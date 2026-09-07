package com.oceanmining.monitoring.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 事件响应DTO
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EventDTO {
    
    private String id;
    private String type;
    private Long mmsi;
    private Map<String, Object> data;
    private LocalDateTime time;
    private String category;
    private String warningType;
    private String severity;
    private String message;
    private Map<String, Object> weatherData;
    private Boolean isResolved;
    private LocalDateTime resolvedAt;
    
    // Constructors
    public EventDTO() {}
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    
    public Long getMmsi() { return mmsi; }
    public void setMmsi(Long mmsi) { this.mmsi = mmsi; }
    
    public Map<String, Object> getData() { return data; }
    public void setData(Map<String, Object> data) { this.data = data; }
    
    public LocalDateTime getTime() { return time; }
    public void setTime(LocalDateTime time) { this.time = time; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public String getWarningType() { return warningType; }
    public void setWarningType(String warningType) { this.warningType = warningType; }
    
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public Map<String, Object> getWeatherData() { return weatherData; }
    public void setWeatherData(Map<String, Object> weatherData) { this.weatherData = weatherData; }
    
    public Boolean getIsResolved() { return isResolved; }
    public void setIsResolved(Boolean isResolved) { this.isResolved = isResolved; }
    
    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
}
