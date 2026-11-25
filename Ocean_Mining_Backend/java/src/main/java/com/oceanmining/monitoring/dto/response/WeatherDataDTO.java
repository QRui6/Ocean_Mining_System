package com.oceanmining.monitoring.dto.response;

/**
 * 气象数据DTO
 * 
 * @author Ocean Mining Team
 * @version 1.0.0
 */
public class WeatherDataDTO {
    
    private Integer timeIndex;
    private ComponentData u;
    private ComponentData v;
    private Integer width;
    private Integer height;
    private BoundsInfo bounds;
    
    // Constructors
    public WeatherDataDTO() {}
    
    // Getters and Setters
    public Integer getTimeIndex() { return timeIndex; }
    public void setTimeIndex(Integer timeIndex) { this.timeIndex = timeIndex; }
    
    public ComponentData getU() { return u; }
    public void setU(ComponentData u) { this.u = u; }
    
    public ComponentData getV() { return v; }
    public void setV(ComponentData v) { this.v = v; }
    
    public Integer getWidth() { return width; }
    public void setWidth(Integer width) { this.width = width; }
    
    public Integer getHeight() { return height; }
    public void setHeight(Integer height) { this.height = height; }
    
    public BoundsInfo getBounds() { return bounds; }
    public void setBounds(BoundsInfo bounds) { this.bounds = bounds; }
    
    /**
     * 分量数据
     */
    public static class ComponentData {
        private float[] array;
        private Float min;
        private Float max;
        
        public ComponentData() {}
        
        public ComponentData(float[] array, Float min, Float max) {
            this.array = array;
            this.min = min;
            this.max = max;
        }
        
        public float[] getArray() { return array; }
        public void setArray(float[] array) { this.array = array; }
        
        public Float getMin() { return min; }
        public void setMin(Float min) { this.min = min; }
        
        public Float getMax() { return max; }
        public void setMax(Float max) { this.max = max; }
    }
    
    /**
     * 边界信息
     */
    public static class BoundsInfo {
        private Double west;
        private Double south;
        private Double east;
        private Double north;
        
        public BoundsInfo() {}
        
        public BoundsInfo(Double west, Double south, Double east, Double north) {
            this.west = west;
            this.south = south;
            this.east = east;
            this.north = north;
        }
        
        public Double getWest() { return west; }
        public void setWest(Double west) { this.west = west; }
        
        public Double getSouth() { return south; }
        public void setSouth(Double south) { this.south = south; }
        
        public Double getEast() { return east; }
        public void setEast(Double east) { this.east = east; }
        
        public Double getNorth() { return north; }
        public void setNorth(Double north) { this.north = north; }
    }
}
