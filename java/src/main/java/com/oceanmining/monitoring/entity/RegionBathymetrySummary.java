package com.oceanmining.monitoring.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Entity
@Table(name = "region_bathymetry_summary")
public class RegionBathymetrySummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @OneToOne
    @JoinColumn(name = "region_id", nullable = false)
    private MiningRegion region;

    @Column(name = "dataset_code", nullable = false, length = 50)
    private String datasetCode;

    @Column(name = "depth_min_m", precision = 10, scale = 3)
    private BigDecimal depthMinMeters;

    @Column(name = "depth_max_m", precision = 10, scale = 3)
    private BigDecimal depthMaxMeters;

    @Column(name = "depth_avg_m", precision = 10, scale = 3)
    private BigDecimal depthAvgMeters;

    @Column(name = "center_depth_m", precision = 10, scale = 3)
    private BigDecimal centerDepthMeters;

    @Column(name = "sample_count", nullable = false)
    private Integer sampleCount;

    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public MiningRegion getRegion() { return region; }
    public void setRegion(MiningRegion region) { this.region = region; }

    public String getDatasetCode() { return datasetCode; }
    public void setDatasetCode(String datasetCode) { this.datasetCode = datasetCode; }

    public BigDecimal getDepthMinMeters() { return depthMinMeters; }
    public void setDepthMinMeters(BigDecimal depthMinMeters) { this.depthMinMeters = depthMinMeters; }

    public BigDecimal getDepthMaxMeters() { return depthMaxMeters; }
    public void setDepthMaxMeters(BigDecimal depthMaxMeters) { this.depthMaxMeters = depthMaxMeters; }

    public BigDecimal getDepthAvgMeters() { return depthAvgMeters; }
    public void setDepthAvgMeters(BigDecimal depthAvgMeters) { this.depthAvgMeters = depthAvgMeters; }

    public BigDecimal getCenterDepthMeters() { return centerDepthMeters; }
    public void setCenterDepthMeters(BigDecimal centerDepthMeters) { this.centerDepthMeters = centerDepthMeters; }

    public Integer getSampleCount() { return sampleCount; }
    public void setSampleCount(Integer sampleCount) { this.sampleCount = sampleCount; }

    public ZonedDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(ZonedDateTime updatedAt) { this.updatedAt = updatedAt; }
}
