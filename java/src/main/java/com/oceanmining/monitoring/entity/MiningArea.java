package com.oceanmining.monitoring.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.JsonNode;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import org.hibernate.annotations.Type;
import org.locationtech.jts.geom.Geometry;
import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Entity
@Table(name = "mining_areas")
public class MiningArea {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "area_id", nullable = false, length = 50)
    private String areaId;
    
    @Column(name = "category", nullable = false, length = 50)
    private String category;
    
    @Column(name = "mineral", length = 200)
    private String mineral;
    
    @Column(name = "area_km2", precision = 10, scale = 2)
    private BigDecimal areaKm2;
    
    @Column(name = "location", length = 100)
    private String location;
    
    @Column(name = "contractor", length = 200)
    private String contractor;
    
    @Column(name = "sponsor", length = 100)
    private String sponsor;
    
    @Column(name = "date_range", length = 100)
    private String dateRange;
    
    @Column(name = "status", length = 50)
    private String status;
    
    @Column(name = "color", length = 20)
    private String color;
    
    @Type(JsonBinaryType.class)
    @Column(name = "coordinates", columnDefinition = "jsonb", nullable = false)
    private JsonNode coordinates;
    
    @JsonIgnore
    @Column(name = "geometry", columnDefinition = "geometry(Polygon,4326)")
    private Geometry geometry;
    
    @Column(name = "created_at")
    private ZonedDateTime createdAt;
    
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = ZonedDateTime.now();
        updatedAt = ZonedDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = ZonedDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getAreaId() { return areaId; }
    public void setAreaId(String areaId) { this.areaId = areaId; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public String getMineral() { return mineral; }
    public void setMineral(String mineral) { this.mineral = mineral; }
    
    public BigDecimal getAreaKm2() { return areaKm2; }
    public void setAreaKm2(BigDecimal areaKm2) { this.areaKm2 = areaKm2; }
    
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    
    public String getContractor() { return contractor; }
    public void setContractor(String contractor) { this.contractor = contractor; }
    
    public String getSponsor() { return sponsor; }
    public void setSponsor(String sponsor) { this.sponsor = sponsor; }
    
    public String getDateRange() { return dateRange; }
    public void setDateRange(String dateRange) { this.dateRange = dateRange; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    
    public JsonNode getCoordinates() { return coordinates; }
    public void setCoordinates(JsonNode coordinates) { this.coordinates = coordinates; }
    
    public Geometry getGeometry() { return geometry; }
    public void setGeometry(Geometry geometry) { this.geometry = geometry; }
    
    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }
    
    public ZonedDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(ZonedDateTime updatedAt) { this.updatedAt = updatedAt; }
}
