package com.oceanmining.monitoring.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Entity
@Table(name = "site_bathymetry")
public class SiteBathymetry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @OneToOne
    @JoinColumn(name = "site_id", nullable = false)
    private ForecastSite site;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "region_id", nullable = false)
    private MiningRegion region;

    @Column(name = "dataset_code", nullable = false, length = 50)
    private String datasetCode;

    @Column(name = "depth_m", precision = 10, scale = 3)
    private BigDecimal depthMeters;

    @Column(name = "elevation_m", precision = 10, scale = 3)
    private BigDecimal elevationMeters;

    @Column(name = "source_file_name", length = 255)
    private String sourceFileName;

    @Column(name = "sampled_at")
    private ZonedDateTime sampledAt;

    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ForecastSite getSite() { return site; }
    public void setSite(ForecastSite site) { this.site = site; }

    public MiningRegion getRegion() { return region; }
    public void setRegion(MiningRegion region) { this.region = region; }

    public String getDatasetCode() { return datasetCode; }
    public void setDatasetCode(String datasetCode) { this.datasetCode = datasetCode; }

    public BigDecimal getDepthMeters() { return depthMeters; }
    public void setDepthMeters(BigDecimal depthMeters) { this.depthMeters = depthMeters; }

    public BigDecimal getElevationMeters() { return elevationMeters; }
    public void setElevationMeters(BigDecimal elevationMeters) { this.elevationMeters = elevationMeters; }

    public String getSourceFileName() { return sourceFileName; }
    public void setSourceFileName(String sourceFileName) { this.sourceFileName = sourceFileName; }

    public ZonedDateTime getSampledAt() { return sampledAt; }
    public void setSampledAt(ZonedDateTime sampledAt) { this.sampledAt = sampledAt; }

    public ZonedDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(ZonedDateTime updatedAt) { this.updatedAt = updatedAt; }
}
