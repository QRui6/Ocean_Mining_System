package com.oceanmining.monitoring.dto.response;

public class TyphoonYearlyStatDTO {

    private Integer year;
    private Integer count;
    private Double maxWind;
    private Double minDistanceKm;

    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }

    public Integer getCount() { return count; }
    public void setCount(Integer count) { this.count = count; }

    public Double getMaxWind() { return maxWind; }
    public void setMaxWind(Double maxWind) { this.maxWind = maxWind; }

    public Double getMinDistanceKm() { return minDistanceKm; }
    public void setMinDistanceKm(Double minDistanceKm) { this.minDistanceKm = minDistanceKm; }
}
