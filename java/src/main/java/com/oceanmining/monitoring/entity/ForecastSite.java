package com.oceanmining.monitoring.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.locationtech.jts.geom.Point;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Entity
@Table(name = "forecast_sites")
public class ForecastSite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "region_id", nullable = false)
    private MiningRegion region;

    @Column(name = "site_code", nullable = false, length = 50)
    private String siteCode;

    @Column(name = "site_name", nullable = false, length = 100)
    private String siteName;

    @Column(name = "lng", nullable = false, precision = 10, scale = 6)
    private BigDecimal lng;

    @Column(name = "lat", nullable = false, precision = 10, scale = 6)
    private BigDecimal lat;

    @JsonIgnore
    @Column(name = "point_geom", columnDefinition = "geometry(Point,4326)")
    private Point pointGeom;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "created_at")
    private ZonedDateTime createdAt;

    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public MiningRegion getRegion() { return region; }
    public void setRegion(MiningRegion region) { this.region = region; }

    public String getSiteCode() { return siteCode; }
    public void setSiteCode(String siteCode) { this.siteCode = siteCode; }

    public String getSiteName() { return siteName; }
    public void setSiteName(String siteName) { this.siteName = siteName; }

    public BigDecimal getLng() { return lng; }
    public void setLng(BigDecimal lng) { this.lng = lng; }

    public BigDecimal getLat() { return lat; }
    public void setLat(BigDecimal lat) { this.lat = lat; }

    public Point getPointGeom() { return pointGeom; }
    public void setPointGeom(Point pointGeom) { this.pointGeom = pointGeom; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean active) { isActive = active; }

    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }

    public ZonedDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(ZonedDateTime updatedAt) { this.updatedAt = updatedAt; }
}
