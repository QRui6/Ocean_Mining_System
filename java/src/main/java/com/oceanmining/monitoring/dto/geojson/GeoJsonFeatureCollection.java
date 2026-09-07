package com.oceanmining.monitoring.dto.geojson;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class GeoJsonFeatureCollection {
    private String type = "FeatureCollection";
    private List<GeoJsonFeature> features;
    
    public GeoJsonFeatureCollection() {}
    
    public GeoJsonFeatureCollection(List<GeoJsonFeature> features) {
        this.features = features;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public List<GeoJsonFeature> getFeatures() {
        return features;
    }
    
    public void setFeatures(List<GeoJsonFeature> features) {
        this.features = features;
    }
}
