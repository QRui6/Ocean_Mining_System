package com.oceanmining.monitoring.dto.response;

public class TyphoonAreaSummaryStatsDTO {

    private Integer totalAffectedTyphoons;
    private Integer recent10yCount;
    private Double annualAverageCount;
    private Double historicalMinDistanceKm;
    private Double historicalMaxWind;
    private Double historicalMinPressure;

    public Integer getTotalAffectedTyphoons() { return totalAffectedTyphoons; }
    public void setTotalAffectedTyphoons(Integer totalAffectedTyphoons) { this.totalAffectedTyphoons = totalAffectedTyphoons; }

    public Integer getRecent10yCount() { return recent10yCount; }
    public void setRecent10yCount(Integer recent10yCount) { this.recent10yCount = recent10yCount; }

    public Double getAnnualAverageCount() { return annualAverageCount; }
    public void setAnnualAverageCount(Double annualAverageCount) { this.annualAverageCount = annualAverageCount; }

    public Double getHistoricalMinDistanceKm() { return historicalMinDistanceKm; }
    public void setHistoricalMinDistanceKm(Double historicalMinDistanceKm) { this.historicalMinDistanceKm = historicalMinDistanceKm; }

    public Double getHistoricalMaxWind() { return historicalMaxWind; }
    public void setHistoricalMaxWind(Double historicalMaxWind) { this.historicalMaxWind = historicalMaxWind; }

    public Double getHistoricalMinPressure() { return historicalMinPressure; }
    public void setHistoricalMinPressure(Double historicalMinPressure) { this.historicalMinPressure = historicalMinPressure; }
}
