package com.oceanmining.monitoring.dto.response;

public class TyphoonAreaSummaryDTO {

    private String areaId;
    private Integer startYear;
    private Integer endYear;
    private Double bufferKm;
    private TyphoonAreaSummaryStatsDTO summary;
    private TyphoonAreaReferenceDTO strongestTyphoon;
    private TyphoonAreaReferenceDTO nearestTyphoon;

    public String getAreaId() { return areaId; }
    public void setAreaId(String areaId) { this.areaId = areaId; }

    public Integer getStartYear() { return startYear; }
    public void setStartYear(Integer startYear) { this.startYear = startYear; }

    public Integer getEndYear() { return endYear; }
    public void setEndYear(Integer endYear) { this.endYear = endYear; }

    public Double getBufferKm() { return bufferKm; }
    public void setBufferKm(Double bufferKm) { this.bufferKm = bufferKm; }

    public TyphoonAreaSummaryStatsDTO getSummary() { return summary; }
    public void setSummary(TyphoonAreaSummaryStatsDTO summary) { this.summary = summary; }

    public TyphoonAreaReferenceDTO getStrongestTyphoon() { return strongestTyphoon; }
    public void setStrongestTyphoon(TyphoonAreaReferenceDTO strongestTyphoon) { this.strongestTyphoon = strongestTyphoon; }

    public TyphoonAreaReferenceDTO getNearestTyphoon() { return nearestTyphoon; }
    public void setNearestTyphoon(TyphoonAreaReferenceDTO nearestTyphoon) { this.nearestTyphoon = nearestTyphoon; }
}
