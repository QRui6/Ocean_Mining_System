package com.oceanmining.monitoring.dto.response;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public class HistoricalWindPointSeriesDTO {

    private String datasetCode;
    private String datasetName;
    private Integer startYear;
    private Integer endYear;
    private Integer total;
    private LocationInfo location;
    private List<MonthlyWindPointDTO> items;

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

    public LocationInfo getLocation() { return location; }
    public void setLocation(LocationInfo location) { this.location = location; }

    public List<MonthlyWindPointDTO> getItems() { return items; }
    public void setItems(List<MonthlyWindPointDTO> items) { this.items = items; }

    public static class LocationInfo {
        private double lat;
        private double lon;

        public LocationInfo(double lat, double lon) {
            this.lat = lat;
            this.lon = lon;
        }

        public double getLat() { return lat; }
        public void setLat(double lat) { this.lat = lat; }

        public double getLon() { return lon; }
        public void setLon(double lon) { this.lon = lon; }
    }

    public static class MonthlyWindPointDTO {
        private Integer year;
        private Integer month;
        private String monthLabel;
        private LocalDate monthStart;
        private OffsetDateTime uTime;
        private OffsetDateTime uValidTime;
        private OffsetDateTime gustTime;
        private Double gustStepHours;
        private OffsetDateTime gustValidTime;
        private WindVectorDTO wind;
        private Double gust;

        public Integer getYear() { return year; }
        public void setYear(Integer year) { this.year = year; }

        public Integer getMonth() { return month; }
        public void setMonth(Integer month) { this.month = month; }

        public String getMonthLabel() { return monthLabel; }
        public void setMonthLabel(String monthLabel) { this.monthLabel = monthLabel; }

        public LocalDate getMonthStart() { return monthStart; }
        public void setMonthStart(LocalDate monthStart) { this.monthStart = monthStart; }

        public OffsetDateTime getUTime() { return uTime; }
        public void setUTime(OffsetDateTime uTime) { this.uTime = uTime; }

        public OffsetDateTime getUValidTime() { return uValidTime; }
        public void setUValidTime(OffsetDateTime uValidTime) { this.uValidTime = uValidTime; }

        public OffsetDateTime getGustTime() { return gustTime; }
        public void setGustTime(OffsetDateTime gustTime) { this.gustTime = gustTime; }

        public Double getGustStepHours() { return gustStepHours; }
        public void setGustStepHours(Double gustStepHours) { this.gustStepHours = gustStepHours; }

        public OffsetDateTime getGustValidTime() { return gustValidTime; }
        public void setGustValidTime(OffsetDateTime gustValidTime) { this.gustValidTime = gustValidTime; }

        public WindVectorDTO getWind() { return wind; }
        public void setWind(WindVectorDTO wind) { this.wind = wind; }

        public Double getGust() { return gust; }
        public void setGust(Double gust) { this.gust = gust; }
    }

    public static class WindVectorDTO {
        private double u;
        private double v;
        private double speed;
        private double direction;

        public WindVectorDTO(double u, double v, double speed, double direction) {
            this.u = u;
            this.v = v;
            this.speed = speed;
            this.direction = direction;
        }

        public double getU() { return u; }
        public void setU(double u) { this.u = u; }

        public double getV() { return v; }
        public void setV(double v) { this.v = v; }

        public double getSpeed() { return speed; }
        public void setSpeed(double speed) { this.speed = speed; }

        public double getDirection() { return direction; }
        public void setDirection(double direction) { this.direction = direction; }
    }
}
