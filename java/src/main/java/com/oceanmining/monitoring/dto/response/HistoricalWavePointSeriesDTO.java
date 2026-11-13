package com.oceanmining.monitoring.dto.response;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public class HistoricalWavePointSeriesDTO {

    private String datasetCode;
    private String datasetName;
    private Integer startYear;
    private Integer endYear;
    private Integer total;
    private HistoricalWindPointSeriesDTO.LocationInfo location;
    private List<MonthlyWavePointDTO> items;

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

    public List<MonthlyWavePointDTO> getItems() { return items; }
    public void setItems(List<MonthlyWavePointDTO> items) { this.items = items; }

    public static class MonthlyWavePointDTO {
        private Integer year;
        private Integer month;
        private String monthLabel;
        private LocalDate monthStart;
        private OffsetDateTime waveTime;
        private Double waveStepHours;
        private OffsetDateTime waveValidTime;
        private WaveDTO wave;

        public Integer getYear() { return year; }
        public void setYear(Integer year) { this.year = year; }

        public Integer getMonth() { return month; }
        public void setMonth(Integer month) { this.month = month; }

        public String getMonthLabel() { return monthLabel; }
        public void setMonthLabel(String monthLabel) { this.monthLabel = monthLabel; }

        public LocalDate getMonthStart() { return monthStart; }
        public void setMonthStart(LocalDate monthStart) { this.monthStart = monthStart; }

        public OffsetDateTime getWaveTime() { return waveTime; }
        public void setWaveTime(OffsetDateTime waveTime) { this.waveTime = waveTime; }

        public Double getWaveStepHours() { return waveStepHours; }
        public void setWaveStepHours(Double waveStepHours) { this.waveStepHours = waveStepHours; }

        public OffsetDateTime getWaveValidTime() { return waveValidTime; }
        public void setWaveValidTime(OffsetDateTime waveValidTime) { this.waveValidTime = waveValidTime; }

        public WaveDTO getWave() { return wave; }
        public void setWave(WaveDTO wave) { this.wave = wave; }
    }

    public static class WaveDTO {
        private double height;
        private double period;
        private double direction;

        public WaveDTO(double height, double period, double direction) {
            this.height = height;
            this.period = period;
            this.direction = direction;
        }

        public double getHeight() { return height; }
        public void setHeight(double height) { this.height = height; }

        public double getPeriod() { return period; }
        public void setPeriod(double period) { this.period = period; }

        public double getDirection() { return direction; }
        public void setDirection(double direction) { this.direction = direction; }
    }
}
