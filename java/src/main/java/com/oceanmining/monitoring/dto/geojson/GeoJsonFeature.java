package com.oceanmining.monitoring.dto.geojson;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class GeoJsonFeature {
    private String type = "Feature";
    private GeoJsonGeometry geometry;
    private Map<String, Object> properties;
    
    public GeoJsonFeature() {}
    
    public GeoJsonFeature(GeoJsonGeometry geometry, Map<String, Object> properties) {
        this.geometry = geometry;
        this.properties = properties;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public GeoJsonGeometry getGeometry() {
        return geometry;
    }
    
    public void setGeometry(GeoJsonGeometry geometry) {
        this.geometry = geometry;
    }
    
    public Map<String, Object> getProperties() {
        return properties;
    }
    
    public void setProperties(Map<String, Object> properties) {
        this.properties = properties;
    }
}
