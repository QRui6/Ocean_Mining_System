package com.oceanmining.monitoring.dto.response;

/**
 * 气象点查询响应 DTO
 */
public class WeatherPointQueryDTO {
    private LocationInfo location;
    private String timestamp;
    private WeatherVector wind;
    private WeatherVector wave;
    private WeatherVector current;
    private WeatherVector internalWave;
    
    // Getters and Setters
    public LocationInfo getLocation() { return location; }
    public void setLocation(LocationInfo location) { this.location = location; }
    
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    
    public WeatherVector getWind() { return wind; }
    public void setWind(WeatherVector wind) { this.wind = wind; }
    
    public WeatherVector getWave() { return wave; }
    public void setWave(WeatherVector wave) { this.wave = wave; }
    
    public WeatherVector getCurrent() { return current; }
    public void setCurrent(WeatherVector current) { this.current = current; }
    
    public WeatherVector getInternalWave() { return internalWave; }
    public void setInternalWave(WeatherVector internalWave) { this.internalWave = internalWave; }

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

    public static class WeatherVector {
        private double u;
        private double v;
        private double speed;
        private double direction;
        private Double height;

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
        
        public Double getHeight() { return height; }
        public void setHeight(Double height) { this.height = height; }
    }
}
