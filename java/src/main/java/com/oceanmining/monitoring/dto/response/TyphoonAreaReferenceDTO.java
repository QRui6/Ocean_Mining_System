package com.oceanmining.monitoring.dto.response;

import java.time.OffsetDateTime;

public class TyphoonAreaReferenceDTO {

    private String sid;
    private String name;
    private Integer season;
    private Double maxWindNearArea;
    private Double minDistanceKm;
    private OffsetDateTime closestTime;

    public String getSid() { return sid; }
    public void setSid(String sid) { this.sid = sid; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getSeason() { return season; }
    public void setSeason(Integer season) { this.season = season; }

    public Double getMaxWindNearArea() { return maxWindNearArea; }
    public void setMaxWindNearArea(Double maxWindNearArea) { this.maxWindNearArea = maxWindNearArea; }

    public Double getMinDistanceKm() { return minDistanceKm; }
    public void setMinDistanceKm(Double minDistanceKm) { this.minDistanceKm = minDistanceKm; }

    public OffsetDateTime getClosestTime() { return closestTime; }
    public void setClosestTime(OffsetDateTime closestTime) { this.closestTime = closestTime; }
}
