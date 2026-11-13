package com.oceanmining.monitoring.dto.response;

import java.util.List;

public class WeatherStatisticsResponse {
    
    private MiningAreaInfo miningArea;
    private CurrentWeather currentWeather;
    private WeatherStats statistics;
    private List<TimeSeriesData> timeSeries;
    private List<WeatherWarning> warnings;
    
    // 矿区信息
    public static class MiningAreaInfo {
        private Long id;
        private String name;
        private String contractor;
        private String mineral;
        private String location;
        
        // Getters and Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getContractor() { return contractor; }
        public void setContractor(String contractor) { this.contractor = contractor; }
        
        public String getMineral() { return mineral; }
        public void setMineral(String mineral) { this.mineral = mineral; }
        
        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }
    }
    
    // 当前气象
    public static class CurrentWeather {
        private Double windSpeed;
        private Double waveHeight;
        private Double currentSpeed;
        private String timestamp;
        
        // Getters and Setters
        public Double getWindSpeed() { return windSpeed; }
        public void setWindSpeed(Double windSpeed) { this.windSpeed = windSpeed; }
        
        public Double getWaveHeight() { return waveHeight; }
        public void setWaveHeight(Double waveHeight) { this.waveHeight = waveHeight; }
        
        public Double getCurrentSpeed() { return currentSpeed; }
        public void setCurrentSpeed(Double currentSpeed) { this.currentSpeed = currentSpeed; }
        
        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    }
    
    // 气象统计
    public static class WeatherStats {
        private MetricStats windSpeed;
        private MetricStats waveHeight;
        private MetricStats currentSpeed;
        
        // Getters and Setters
        public MetricStats getWindSpeed() { return windSpeed; }
        public void setWindSpeed(MetricStats windSpeed) { this.windSpeed = windSpeed; }
        
        public MetricStats getWaveHeight() { return waveHeight; }
        public void setWaveHeight(MetricStats waveHeight) { this.waveHeight = waveHeight; }
        
        public MetricStats getCurrentSpeed() { return currentSpeed; }
        public void setCurrentSpeed(MetricStats currentSpeed) { this.currentSpeed = currentSpeed; }
    }
    
    // 指标统计
    public static class MetricStats {
        private Double current;
        private Double avg;
        private Double max;
        private Double min;
        private Double threshold;
        private Integer exceedCount;
        
        // Getters and Setters
        public Double getCurrent() { return current; }
        public void setCurrent(Double current) { this.current = current; }
        
        public Double getAvg() { return avg; }
        public void setAvg(Double avg) { this.avg = avg; }
        
        public Double getMax() { return max; }
        public void setMax(Double max) { this.max = max; }
        
        public Double getMin() { return min; }
        public void setMin(Double min) { this.min = min; }
        
        public Double getThreshold() { return threshold; }
        public void setThreshold(Double threshold) { this.threshold = threshold; }
        
        public Integer getExceedCount() { return exceedCount; }
        public void setExceedCount(Integer exceedCount) { this.exceedCount = exceedCount; }
    }
    
    // 时间序列数据
    public static class TimeSeriesData {
        private String time;
        private Double windSpeed;
        private Double waveHeight;
        private Double currentSpeed;
        
        // Getters and Setters
        public String getTime() { return time; }
        public void setTime(String time) { this.time = time; }
        
        public Double getWindSpeed() { return windSpeed; }
        public void setWindSpeed(Double windSpeed) { this.windSpeed = windSpeed; }
        
        public Double getWaveHeight() { return waveHeight; }
        public void setWaveHeight(Double waveHeight) { this.waveHeight = waveHeight; }
        
        public Double getCurrentSpeed() { return currentSpeed; }
        public void setCurrentSpeed(Double currentSpeed) { this.currentSpeed = currentSpeed; }
    }
    
    // 预警信息
    public static class WeatherWarning {
        private String type;
        private String severity;
        private String startTime;
        private String endTime;
        private Double value;
        private Double threshold;
        private String message;
        
        // Getters and Setters
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        
        public String getSeverity() { return severity; }
        public void setSeverity(String severity) { this.severity = severity; }
        
        public String getStartTime() { return startTime; }
        public void setStartTime(String startTime) { this.startTime = startTime; }
        
        public String getEndTime() { return endTime; }
        public void setEndTime(String endTime) { this.endTime = endTime; }
        
        public Double getValue() { return value; }
        public void setValue(Double value) { this.value = value; }
        
        public Double getThreshold() { return threshold; }
        public void setThreshold(Double threshold) { this.threshold = threshold; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
    
    // Main class Getters and Setters
    public MiningAreaInfo getMiningArea() { return miningArea; }
    public void setMiningArea(MiningAreaInfo miningArea) { this.miningArea = miningArea; }
    
    public CurrentWeather getCurrentWeather() { return currentWeather; }
    public void setCurrentWeather(CurrentWeather currentWeather) { this.currentWeather = currentWeather; }
    
    public WeatherStats getStatistics() { return statistics; }
    public void setStatistics(WeatherStats statistics) { this.statistics = statistics; }
    
    public List<TimeSeriesData> getTimeSeries() { return timeSeries; }
    public void setTimeSeries(List<TimeSeriesData> timeSeries) { this.timeSeries = timeSeries; }
    
    public List<WeatherWarning> getWarnings() { return warnings; }
    public void setWarnings(List<WeatherWarning> warnings) { this.warnings = warnings; }
}
