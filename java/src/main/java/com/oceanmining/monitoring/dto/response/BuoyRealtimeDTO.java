package com.oceanmining.monitoring.dto.response;

import java.time.ZonedDateTime;

public class BuoyRealtimeDTO {

    private String buoyId;
    private String buoyName;
    private Double lat;
    private Double lng;
    private ZonedDateTime timestamp;
    private Double windSpeed;
    private Double windDirection;
    private Double waveHeight;
    private Double waveDirection;
    private Double wavePeriod;
    private Double currentSpeed;
    private Double currentDirection;
    private String source;

    public String getBuoyId() { return buoyId; }
    public void setBuoyId(String buoyId) { this.buoyId = buoyId; }
    public String getBuoyName() { return buoyName; }
    public void setBuoyName(String buoyName) { this.buoyName = buoyName; }
    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }
    public Double getLng() { return lng; }
    public void setLng(Double lng) { this.lng = lng; }
    public ZonedDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(ZonedDateTime timestamp) { this.timestamp = timestamp; }
    public Double getWindSpeed() { return windSpeed; }
    public void setWindSpeed(Double windSpeed) { this.windSpeed = windSpeed; }
    public Double getWindDirection() { return windDirection; }
    public void setWindDirection(Double windDirection) { this.windDirection = windDirection; }
    public Double getWaveHeight() { return waveHeight; }
    public void setWaveHeight(Double waveHeight) { this.waveHeight = waveHeight; }
    public Double getWaveDirection() { return waveDirection; }
    public void setWaveDirection(Double waveDirection) { this.waveDirection = waveDirection; }
    public Double getWavePeriod() { return wavePeriod; }
    public void setWavePeriod(Double wavePeriod) { this.wavePeriod = wavePeriod; }
    public Double getCurrentSpeed() { return currentSpeed; }
    public void setCurrentSpeed(Double currentSpeed) { this.currentSpeed = currentSpeed; }
    public Double getCurrentDirection() { return currentDirection; }
    public void setCurrentDirection(Double currentDirection) { this.currentDirection = currentDirection; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
}
