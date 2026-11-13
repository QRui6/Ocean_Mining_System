package com.oceanmining.monitoring.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.oceanmining.monitoring.enums.RiskLevel;
import com.oceanmining.monitoring.enums.ShipStatus;

import java.time.LocalDateTime;

/**
 * 船舶信息响应DTO
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ShipDTO {
    
    private Long mmsi;
    private String shipName;
    private String shipCnName;
    private LocalDateTime enterTime;
    private LocalDateTime leaveTime;
    private ShipStatus status;
    private PositionDTO lastPosition;
    private WeatherDTO lastWeather;
    private RiskLevel riskLevel;
    private String imo;
    private String callSign;
    private String shipType;
    private Double length;
    private Double width;
    private Double draught;
    private String destination;
    private String eta;
    private Double sog;
    private Double cog;
    private Double hdg;
    private Double lat;
    private Double lng;
    private String lastTime;
    
    // Constructors
    public ShipDTO() {}
    
    // Getters and Setters
    public Long getMmsi() { return mmsi; }
    public void setMmsi(Long mmsi) { this.mmsi = mmsi; }
    
    public String getShipName() { return shipName; }
    public void setShipName(String shipName) { this.shipName = shipName; }
    
    public String getShipCnName() { return shipCnName; }
    public void setShipCnName(String shipCnName) { this.shipCnName = shipCnName; }
    
    public LocalDateTime getEnterTime() { return enterTime; }
    public void setEnterTime(LocalDateTime enterTime) { this.enterTime = enterTime; }
    
    public LocalDateTime getLeaveTime() { return leaveTime; }
    public void setLeaveTime(LocalDateTime leaveTime) { this.leaveTime = leaveTime; }
    
    public ShipStatus getStatus() { return status; }
    public void setStatus(ShipStatus status) { this.status = status; }
    
    public PositionDTO getLastPosition() { return lastPosition; }
    public void setLastPosition(PositionDTO lastPosition) { this.lastPosition = lastPosition; }
    
    public WeatherDTO getLastWeather() { return lastWeather; }
    public void setLastWeather(WeatherDTO lastWeather) { this.lastWeather = lastWeather; }
    
    public RiskLevel getRiskLevel() { return riskLevel; }
    public void setRiskLevel(RiskLevel riskLevel) { this.riskLevel = riskLevel; }
    
    public String getImo() { return imo; }
    public void setImo(String imo) { this.imo = imo; }
    
    public String getCallSign() { return callSign; }
    public void setCallSign(String callSign) { this.callSign = callSign; }
    
    public String getShipType() { return shipType; }
    public void setShipType(String shipType) { this.shipType = shipType; }
    
    public Double getLength() { return length; }
    public void setLength(Double length) { this.length = length; }
    
    public Double getWidth() { return width; }
    public void setWidth(Double width) { this.width = width; }
    
    public Double getDraught() { return draught; }
    public void setDraught(Double draught) { this.draught = draught; }
    
    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }
    
    public String getEta() { return eta; }
    public void setEta(String eta) { this.eta = eta; }
    
    public Double getSog() { return sog; }
    public void setSog(Double sog) { this.sog = sog; }
    
    public Double getCog() { return cog; }
    public void setCog(Double cog) { this.cog = cog; }
    
    public Double getHdg() { return hdg; }
    public void setHdg(Double hdg) { this.hdg = hdg; }
    
    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }
    
    public Double getLng() { return lng; }
    public void setLng(Double lng) { this.lng = lng; }
    
    public String getLastTime() { return lastTime; }
    public void setLastTime(String lastTime) { this.lastTime = lastTime; }
    
    public static class PositionDTO {
        private Double lat;
        private Double lng;
        
        public PositionDTO() {}
        
        public PositionDTO(Double lat, Double lng) {
            this.lat = lat;
            this.lng = lng;
        }
        
        public Double getLat() { return lat; }
        public void setLat(Double lat) { this.lat = lat; }
        
        public Double getLng() { return lng; }
        public void setLng(Double lng) { this.lng = lng; }
    }
    
    public static class WeatherDTO {
        private Double windSpeed;
        private Double waveHeight;
        private Double temperature;
        private String windDir;
        private Double humidity;
        private Double pressure;
        private Double visibility;
        private String publishTime;
        
        public WeatherDTO() {}
        
        public Double getWindSpeed() { return windSpeed; }
        public void setWindSpeed(Double windSpeed) { this.windSpeed = windSpeed; }
        
        public Double getWaveHeight() { return waveHeight; }
        public void setWaveHeight(Double waveHeight) { this.waveHeight = waveHeight; }
        
        public Double getTemperature() { return temperature; }
        public void setTemperature(Double temperature) { this.temperature = temperature; }
        
        public String getWindDir() { return windDir; }
        public void setWindDir(String windDir) { this.windDir = windDir; }
        
        public Double getHumidity() { return humidity; }
        public void setHumidity(Double humidity) { this.humidity = humidity; }
        
        public Double getPressure() { return pressure; }
        public void setPressure(Double pressure) { this.pressure = pressure; }
        
        public Double getVisibility() { return visibility; }
        public void setVisibility(Double visibility) { this.visibility = visibility; }
        
        public String getPublishTime() { return publishTime; }
        public void setPublishTime(String publishTime) { this.publishTime = publishTime; }
    }
}
