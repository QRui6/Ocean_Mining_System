package com.oceanmining.monitoring.dto.response;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public class HistoricalCurrentPointSeriesDTO {

    private String datasetCode;
    private String datasetName;
    private Integer startYear;
    private Integer endYear;
    private Integer total;
    private HistoricalWindPointSeriesDTO.LocationInfo location;
    private List<MonthlyCurrentPointDTO> items;

    public String getDatasetCode() { return datasetCode; }
    public void setDatasetCode(String datasetCode) { this.datasetCode = datasetCode; }
    public String getDatasetName() { return datasetName; }
    public void setDatasetName(String datasetName) { this.datasetName = datasetName; }
    public Integer getStartYear() { return startYear; }
    public void setStartYear(Integer startYear) { this.startYear = startYear; }
    public Integer getEndYear() { return endYear; }
    public void setEndYear(Integer endYear) { this.endYear = endYear; }
    public Integer getTotal() { return total; }
    public void setTotal(Integer total) { this.total = total; }
    public HistoricalWindPointSeriesDTO.LocationInfo getLocation() { return location; }
    public void setLocation(HistoricalWindPointSeriesDTO.LocationInfo location) { this.location = location; }
    public List<MonthlyCurrentPointDTO> getItems() { return items; }
    public void setItems(List<MonthlyCurrentPointDTO> items) { this.items = items; }

    public static class MonthlyCurrentPointDTO {
        private Integer year;
        private Integer month;
        private String monthLabel;
        private LocalDate monthStart;
        private OffsetDateTime currentTime;
        private Double depthMeters;
        private HistoricalWindPointSeriesDTO.WindVectorDTO current;

        public Integer getYear() { return year; }
        public void setYear(Integer year) { this.year = year; }
        public Integer getMonth() { return month; }
        public void setMonth(Integer month) { this.month = month; }
        public String getMonthLabel() { return monthLabel; }
        public void setMonthLabel(String monthLabel) { this.monthLabel = monthLabel; }
        public LocalDate getMonthStart() { return monthStart; }
        public void setMonthStart(LocalDate monthStart) { this.monthStart = monthStart; }
        public OffsetDateTime getCurrentTime() { return currentTime; }
        public void setCurrentTime(OffsetDateTime currentTime) { this.currentTime = currentTime; }
        public Double getDepthMeters() { return depthMeters; }
        public void setDepthMeters(Double depthMeters) { this.depthMeters = depthMeters; }
        public HistoricalWindPointSeriesDTO.WindVectorDTO getCurrent() { return current; }
        public void setCurrent(HistoricalWindPointSeriesDTO.WindVectorDTO current) { this.current = current; }
    }
}
