package com.oceanmining.monitoring.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

/**
 * 气象数据元数据JSON格式
 * 用于解析meta.json文件
 * 
 * @author Ocean Mining Team
 * @version 1.0.0
 */
public class WeatherMetadataJson {
    
    private GridInfo grid;
    private Integer frames;
    
    @JsonProperty("time_step_hours")
    private Integer timeStepHours;
    
    @JsonProperty("start_time")
    private String startTime;
    
    @JsonProperty("data_source")
    private String dataSource;
    
    private Map<String, String> variables;
    
    // Getters and Setters
    public GridInfo getGrid() { return grid; }
    public void setGrid(GridInfo grid) { this.grid = grid; }
    
    public Integer getFrames() { return frames; }
    public void setFrames(Integer frames) { this.frames = frames; }
    
    public Integer getTimeStepHours() { return timeStepHours; }
    public void setTimeStepHours(Integer timeStepHours) { this.timeStepHours = timeStepHours; }
    
    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }
    
    public String getDataSource() { return dataSource; }
    public void setDataSource(String dataSource) { this.dataSource = dataSource; }
    
    public Map<String, String> getVariables() { return variables; }
    public void setVariables(Map<String, String> variables) { this.variables = variables; }
    
    public static class GridInfo {
        @JsonProperty("lat_size")
        private Integer latSize;
        
        @JsonProperty("lon_size")
        private Integer lonSize;
        
        @JsonProperty("lat_min")
        private Double latMin;
        
        @JsonProperty("lat_max")
        private Double latMax;
        
        @JsonProperty("lon_min")
        private Double lonMin;
        
        @JsonProperty("lon_max")
        private Double lonMax;
        
        @JsonProperty("lat_step")
        private Double latStep;
        
        @JsonProperty("lon_step")
        private Double lonStep;
        
        // Getters and Setters
        public Integer getLatSize() { return latSize; }
        public void setLatSize(Integer latSize) { this.latSize = latSize; }
        
        public Integer getLonSize() { return lonSize; }
        public void setLonSize(Integer lonSize) { this.lonSize = lonSize; }
        
        public Double getLatMin() { return latMin; }
        public void setLatMin(Double latMin) { this.latMin = latMin; }
        
        public Double getLatMax() { return latMax; }
        public void setLatMax(Double latMax) { this.latMax = latMax; }
        
        public Double getLonMin() { return lonMin; }
        public void setLonMin(Double lonMin) { this.lonMin = lonMin; }
        
        public Double getLonMax() { return lonMax; }
        public void setLonMax(Double lonMax) { this.lonMax = lonMax; }
        
        public Double getLatStep() { return latStep; }
        public void setLatStep(Double latStep) { this.latStep = latStep; }
        
        public Double getLonStep() { return lonStep; }
        public void setLonStep(Double lonStep) { this.lonStep = lonStep; }
    }
}
