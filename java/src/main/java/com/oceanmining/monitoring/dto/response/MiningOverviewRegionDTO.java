package com.oceanmining.monitoring.dto.response;

import com.fasterxml.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

public class MiningOverviewRegionDTO {

    private Long id;
    private String regionCode;
    private String regionName;
    private BigDecimal centerLng;
    private BigDecimal centerLat;
    private JsonNode boundaryPolygon;
    private Integer siteCount;
    private BigDecimal depthMinMeters;
    private BigDecimal depthMaxMeters;
    private BigDecimal depthAvgMeters;
    private BigDecimal centerDepthMeters;
    private Integer bathymetrySampleCount;
    private ZonedDateTime bathymetryUpdatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRegionCode() { return regionCode; }
    public void setRegionCode(String regionCode) { this.regionCode = regionCode; }

    public String getRegionName() { return regionName; }
    public void setRegionName(String regionName) { this.regionName = regionName; }

    public BigDecimal getCenterLng() { return centerLng; }
    public void setCenterLng(BigDecimal centerLng) { this.centerLng = centerLng; }

    public BigDecimal getCenterLat() { return centerLat; }
    public void setCenterLat(BigDecimal centerLat) { this.centerLat = centerLat; }

    public JsonNode getBoundaryPolygon() { return boundaryPolygon; }
    public void setBoundaryPolygon(JsonNode boundaryPolygon) { this.boundaryPolygon = boundaryPolygon; }

    public Integer getSiteCount() { return siteCount; }
    public void setSiteCount(Integer siteCount) { this.siteCount = siteCount; }

    public BigDecimal getDepthMinMeters() { return depthMinMeters; }
    public void setDepthMinMeters(BigDecimal depthMinMeters) { this.depthMinMeters = depthMinMeters; }

    public BigDecimal getDepthMaxMeters() { return depthMaxMeters; }
    public void setDepthMaxMeters(BigDecimal depthMaxMeters) { this.depthMaxMeters = depthMaxMeters; }

    public BigDecimal getDepthAvgMeters() { return depthAvgMeters; }
    public void setDepthAvgMeters(BigDecimal depthAvgMeters) { this.depthAvgMeters = depthAvgMeters; }

    public BigDecimal getCenterDepthMeters() { return centerDepthMeters; }
    public void setCenterDepthMeters(BigDecimal centerDepthMeters) { this.centerDepthMeters = centerDepthMeters; }

    public Integer getBathymetrySampleCount() { return bathymetrySampleCount; }
    public void setBathymetrySampleCount(Integer bathymetrySampleCount) { this.bathymetrySampleCount = bathymetrySampleCount; }

    public ZonedDateTime getBathymetryUpdatedAt() { return bathymetryUpdatedAt; }
    public void setBathymetryUpdatedAt(ZonedDateTime bathymetryUpdatedAt) { this.bathymetryUpdatedAt = bathymetryUpdatedAt; }
}
