package com.oceanmining.monitoring.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.JsonNode;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.Type;
import org.locationtech.jts.geom.Geometry;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Entity
@Table(name = "mining_regions")
public class MiningRegion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "region_code", nullable = false, length = 50)
    private String regionCode;

    @Column(name = "region_name", nullable = false, length = 100)
    private String regionName;

    @Column(name = "center_lng", precision = 10, scale = 6)
    private BigDecimal centerLng;

    @Column(name = "center_lat", precision = 10, scale = 6)
    private BigDecimal centerLat;

    @Type(JsonBinaryType.class)
    @Column(name = "boundary_polygon", columnDefinition = "jsonb", nullable = false)
    private JsonNode boundaryPolygon;

    @JsonIgnore
    @Column(name = "geometry", columnDefinition = "geometry(MultiPolygon,4326)")
    private Geometry geometry;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "created_at")
    private ZonedDateTime createdAt;

    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;

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

    public Geometry getGeometry() { return geometry; }
    public void setGeometry(Geometry geometry) { this.geometry = geometry; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean active) { isActive = active; }

    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }

    public ZonedDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(ZonedDateTime updatedAt) { this.updatedAt = updatedAt; }
}
