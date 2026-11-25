package com.oceanmining.monitoring.dto.response;

import java.util.List;

/**
 * 可用时间索引DTO
 * 
 * @author Ocean Mining Team
 * @version 1.0.0
 */
public class AvailableIndicesDTO {
    
    private String type;
    private List<Integer> availableIndices;
    private Integer totalFrames;
    
    // Constructors
    public AvailableIndicesDTO() {}
    
    public AvailableIndicesDTO(String type, List<Integer> availableIndices, Integer totalFrames) {
        this.type = type;
        this.availableIndices = availableIndices;
        this.totalFrames = totalFrames;
    }
    
    // Getters and Setters
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    
    public List<Integer> getAvailableIndices() { return availableIndices; }
    public void setAvailableIndices(List<Integer> availableIndices) { this.availableIndices = availableIndices; }
    
    public Integer getTotalFrames() { return totalFrames; }
    public void setTotalFrames(Integer totalFrames) { this.totalFrames = totalFrames; }
}
