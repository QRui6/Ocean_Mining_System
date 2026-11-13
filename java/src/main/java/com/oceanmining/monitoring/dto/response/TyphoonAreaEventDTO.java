package com.oceanmining.monitoring.dto.response;

import java.time.OffsetDateTime;

public class TyphoonAreaEventDTO {

    private String sid;
    private String name;
    private Integer season;
    private String basin;
    private Double minDistanceKm;
    private OffsetDateTime closestTime;
    private OffsetDateTime influenceStart;
    private OffsetDateTime influenceEnd;
    private Double influenceDurationHours;
    private Double maxWindNearArea;
    private Double minPresNearArea;
    private String impactLevel;

    public String getSid() { return sid; }
    public void setSid(String sid) { this.sid = sid; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getSeason() { return season; }
    public void setSeason(Integer season) { this.season = season; }

    public String getBasin() { return basin; }
    public void setBasin(String basin) { this.basin = basin; }

    public Double getMinDistanceKm() { return minDistanceKm; }
    public void setMinDistanceKm(Double minDistanceKm) { this.minDistanceKm = minDistanceKm; }

    public OffsetDateTime getClosestTime() { return closestTime; }
    public void setClosestTime(OffsetDateTime closestTime) { this.closestTime = closestTime; }

    public OffsetDateTime getInfluenceStart() { return influenceStart; }
    public void setInfluenceStart(OffsetDateTime influenceStart) { this.influenceStart = influenceStart; }

    public OffsetDateTime getInfluenceEnd() { return influenceEnd; }
    public void setInfluenceEnd(OffsetDateTime influenceEnd) { this.influenceEnd = influenceEnd; }

    public Double getInfluenceDurationHours() { return influenceDurationHours; }
    public void setInfluenceDurationHours(Double influenceDurationHours) { this.influenceDurationHours = influenceDurationHours; }

    public Double getMaxWindNearArea() { return maxWindNearArea; }
    public void setMaxWindNearArea(Double maxWindNearArea) { this.maxWindNearArea = maxWindNearArea; }

    public Double getMinPresNearArea() { return minPresNearArea; }
    public void setMinPresNearArea(Double minPresNearArea) { this.minPresNearArea = minPresNearArea; }

    public String getImpactLevel() { return impactLevel; }
    public void setImpactLevel(String impactLevel) { this.impactLevel = impactLevel; }
}
