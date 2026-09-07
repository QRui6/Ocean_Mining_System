package com.oceanmining.monitoring.dto.geojson;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class GeoJsonGeometry {
    private String type;
    private Object coordinates;
    
    public GeoJsonGeometry() {}
    
    public GeoJsonGeometry(String type, Object coordinates) {
        this.type = type;
        this.coordinates = coordinates;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public Object getCoordinates() {
        return coordinates;
    }
    
    public void setCoordinates(Object coordinates) {
        this.coordinates = coordinates;
    }
}
