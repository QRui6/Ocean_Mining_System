package com.oceanmining.monitoring.dto.response;

/**
 * 气象数据元数据DTO
 * 
 * @author Ocean Mining Team
 * @version 1.0.0
 */
public class WeatherMetadataDTO {
    
    private Long id;
    private String type;
    private GridInfo grid;
    private String startTime;
    private Integer timeStepHours;
    private Integer frames;
    private String dataSource;
    
    // Constructors
    public WeatherMetadataDTO() {}
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    
    public GridInfo getGrid() { return grid; }
    public void setGrid(GridInfo grid) { this.grid = grid; }
    
    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }
    
    public Integer getTimeStepHours() { return timeStepHours; }
    public void setTimeStepHours(Integer timeStepHours) { this.timeStepHours = timeStepHours; }
    
    public Integer getFrames() { return frames; }
    public void setFrames(Integer frames) { this.frames = frames; }
    
    public String getDataSource() { return dataSource; }
    public void setDataSource(String dataSource) { this.dataSource = dataSource; }
    
    /**
     * 网格信息
     */
    public static class GridInfo {
        private Integer lonSize;
        private Integer latSize;
        private Double lonMin;
        private Double latMin;
        private Double lonMax;
        private Double latMax;
        private Double lonStep;
        private Double latStep;
        
        public GridInfo() {}
        
        public Integer getLonSize() { return lonSize; }
        public void setLonSize(Integer lonSize) { this.lonSize = lonSize; }
        
        public Integer getLatSize() { return latSize; }
        public void setLatSize(Integer latSize) { this.latSize = latSize; }
        
        public Double getLonMin() { return lonMin; }
        public void setLonMin(Double lonMin) { this.lonMin = lonMin; }
        
        public Double getLatMin() { return latMin; }
        public void setLatMin(Double latMin) { this.latMin = latMin; }
        
        public Double getLonMax() { return lonMax; }
        public void setLonMax(Double lonMax) { this.lonMax = lonMax; }
        
        public Double getLatMax() { return latMax; }
        public void setLatMax(Double latMax) { this.latMax = latMax; }
        
        public Double getLonStep() { return lonStep; }
        public void setLonStep(Double lonStep) { this.lonStep = lonStep; }
        
        public Double getLatStep() { return latStep; }
        public void setLatStep(Double latStep) { this.latStep = latStep; }
    }
}
