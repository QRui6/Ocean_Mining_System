package com.oceanmining.monitoring.dto.response;

import java.time.OffsetDateTime;
import java.util.List;

public class TyphoonTrackDTO {

    private String sid;
    private String name;
    private Integer season;
    private String basin;
    private OffsetDateTime startTime;
    private OffsetDateTime endTime;
    private Double maxWind;
    private Double minPres;
    private Integer pointCount;
    private String areaId;
    private Double bufferKm;
    private List<TyphoonTrackPointDTO> points;

    public String getSid() { return sid; }
    public void setSid(String sid) { this.sid = sid; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getSeason() { return season; }
    public void setSeason(Integer season) { this.season = season; }

    public String getBasin() { return basin; }
    public void setBasin(String basin) { this.basin = basin; }

    public OffsetDateTime getStartTime() { return startTime; }
    public void setStartTime(OffsetDateTime startTime) { this.startTime = startTime; }

    public OffsetDateTime getEndTime() { return endTime; }
    public void setEndTime(OffsetDateTime endTime) { this.endTime = endTime; }

    public Double getMaxWind() { return maxWind; }
    public void setMaxWind(Double maxWind) { this.maxWind = maxWind; }

    public Double getMinPres() { return minPres; }
    public void setMinPres(Double minPres) { this.minPres = minPres; }

    public Integer getPointCount() { return pointCount; }
    public void setPointCount(Integer pointCount) { this.pointCount = pointCount; }

    public String getAreaId() { return areaId; }
    public void setAreaId(String areaId) { this.areaId = areaId; }

    public Double getBufferKm() { return bufferKm; }
    public void setBufferKm(Double bufferKm) { this.bufferKm = bufferKm; }

    public List<TyphoonTrackPointDTO> getPoints() { return points; }
    public void setPoints(List<TyphoonTrackPointDTO> points) { this.points = points; }
}
