package com.oceanmining.monitoring.dto.response;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

public class MiningOverviewSiteDTO {

    private Long id;
    private Long regionId;
    private String regionName;
    private String siteCode;
    private String siteName;
    private BigDecimal lng;
    private BigDecimal lat;
    private BigDecimal depthMeters;
    private BigDecimal elevationMeters;
    private ZonedDateTime bathymetryUpdatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getRegionId() { return regionId; }
    public void setRegionId(Long regionId) { this.regionId = regionId; }

    public String getRegionName() { return regionName; }
    public void setRegionName(String regionName) { this.regionName = regionName; }

    public String getSiteCode() { return siteCode; }
    public void setSiteCode(String siteCode) { this.siteCode = siteCode; }

    public String getSiteName() { return siteName; }
    public void setSiteName(String siteName) { this.siteName = siteName; }

    public BigDecimal getLng() { return lng; }
    public void setLng(BigDecimal lng) { this.lng = lng; }

    public BigDecimal getLat() { return lat; }
    public void setLat(BigDecimal lat) { this.lat = lat; }

    public BigDecimal getDepthMeters() { return depthMeters; }
    public void setDepthMeters(BigDecimal depthMeters) { this.depthMeters = depthMeters; }

    public BigDecimal getElevationMeters() { return elevationMeters; }
    public void setElevationMeters(BigDecimal elevationMeters) { this.elevationMeters = elevationMeters; }

    public ZonedDateTime getBathymetryUpdatedAt() { return bathymetryUpdatedAt; }
    public void setBathymetryUpdatedAt(ZonedDateTime bathymetryUpdatedAt) { this.bathymetryUpdatedAt = bathymetryUpdatedAt; }
}
