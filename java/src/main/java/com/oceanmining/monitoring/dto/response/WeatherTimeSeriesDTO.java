package com.oceanmining.monitoring.dto.response;

import java.util.List;

/**
 * 气象时间序列响应 DTO
 * 用于详情面板显示多个时间点的气象数据
 */
public class WeatherTimeSeriesDTO {
    private LocationInfo location;
    private List<TimeStepData> timeSteps;
    
    public LocationInfo getLocation() { return location; }
    public void setLocation(LocationInfo location) { this.location = location; }
    
    public List<TimeStepData> getTimeSteps() { return timeSteps; }
    public void setTimeSteps(List<TimeStepData> timeSteps) { this.timeSteps = timeSteps; }
    
    public static class LocationInfo {
        private double lat;
        private double lon;
        
        public LocationInfo(double lat, double lon) {
            this.lat = lat;
            this.lon = lon;
        }
        
        public double getLat() { return lat; }
        public void setLat(double lat) { this.lat = lat; }
        
        public double getLon() { return lon; }
        public void setLon(double lon) { this.lon = lon; }
    }
    
    public static class TimeStepData {
        private Integer timeIndex;
        private String timestamp;
        private WeatherVector wind;
        private WaveData wave;
        private WeatherVector current;
        private WeatherVector internalWave;
        
        public Integer getTimeIndex() { return timeIndex; }
        public void setTimeIndex(Integer timeIndex) { this.timeIndex = timeIndex; }
        
        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
        
        public WeatherVector getWind() { return wind; }
        public void setWind(WeatherVector wind) { this.wind = wind; }
        
        public WaveData getWave() { return wave; }
        public void setWave(WaveData wave) { this.wave = wave; }
        
        public WeatherVector getCurrent() { return current; }
        public void setCurrent(WeatherVector current) { this.current = current; }
        
        public WeatherVector getInternalWave() { return internalWave; }
        public void setInternalWave(WeatherVector internalWave) { this.internalWave = internalWave; }
    }
    
    public static class WeatherVector {
        private double u;
        private double v;
        private double speed;
        private double direction;
        
        public WeatherVector(double u, double v, double speed, double direction) {
            this.u = u;
            this.v = v;
            this.speed = speed;
            this.direction = direction;
        }
        
        public double getU() { return u; }
        public void setU(double u) { this.u = u; }
        
        public double getV() { return v; }
        public void setV(double v) { this.v = v; }
        
        public double getSpeed() { return speed; }
        public void setSpeed(double speed) { this.speed = speed; }
        
        public double getDirection() { return direction; }
        public void setDirection(double direction) { this.direction = direction; }
    }
    
    public static class WaveData {
        private double u;
        private double v;
        private double speed;
        private double direction;
        private Double height;
        private Double phaseSpeed;  // 波峰传播速度
        
        public WaveData(double u, double v, double speed, double direction, Double height) {
            this.u = u;
            this.v = v;
            this.speed = speed;
            this.direction = direction;
            this.height = height;
            // 计算波峰传播速度（Phase Speed）
            // 使用经验公式：c ≈ 1.25 × √H （深水波近似）
            if (height != null && height > 0) {
                this.phaseSpeed = 1.25 * Math.sqrt(height);
            }
        }
        
        public double getU() { return u; }
        public void setU(double u) { this.u = u; }
        
        public double getV() { return v; }
        public void setV(double v) { this.v = v; }
        
        public double getSpeed() { return speed; }
        public void setSpeed(double speed) { this.speed = speed; }
        
        public double getDirection() { return direction; }
        public void setDirection(double direction) { this.direction = direction; }
        
        public Double getHeight() { return height; }
        public void setHeight(Double height) { this.height = height; }
        
        public Double getPhaseSpeed() { return phaseSpeed; }
        public void setPhaseSpeed(Double phaseSpeed) { this.phaseSpeed = phaseSpeed; }
    }
}
