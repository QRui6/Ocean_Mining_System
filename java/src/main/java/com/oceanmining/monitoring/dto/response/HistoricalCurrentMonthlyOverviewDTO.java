package com.oceanmining.monitoring.dto.response;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public class HistoricalCurrentMonthlyOverviewDTO {

    private String datasetCode;
    private String datasetName;
    private Integer startYear;
    private Integer endYear;
    private Integer total;
    private HistoricalWindMonthlyOverviewDTO.GridInfo grid;
    private Double depthMeters;
    private List<MonthlyOverviewItemDTO> items;

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
    public HistoricalWindMonthlyOverviewDTO.GridInfo getGrid() { return grid; }
    public void setGrid(HistoricalWindMonthlyOverviewDTO.GridInfo grid) { this.grid = grid; }
    public Double getDepthMeters() { return depthMeters; }
    public void setDepthMeters(Double depthMeters) { this.depthMeters = depthMeters; }
    public List<MonthlyOverviewItemDTO> getItems() { return items; }
    public void setItems(List<MonthlyOverviewItemDTO> items) { this.items = items; }

    public static class MonthlyOverviewItemDTO {
        private Integer year;
        private Integer month;
        private String monthLabel;
        private LocalDate monthStart;
        private OffsetDateTime currentTime;
        private Double depthMeters;
        private Float uMin;
        private Float uMax;
        private Float vMin;
        private Float vMax;
        private Integer dataSize;
        private String sourceFileName;
        private String sourceFilePath;
        private Long sourceFileSizeBytes;
        private OffsetDateTime importedAt;

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
        public Float getUMin() { return uMin; }
        public void setUMin(Float uMin) { this.uMin = uMin; }
        public Float getUMax() { return uMax; }
        public void setUMax(Float uMax) { this.uMax = uMax; }
        public Float getVMin() { return vMin; }
        public void setVMin(Float vMin) { this.vMin = vMin; }
        public Float getVMax() { return vMax; }
        public void setVMax(Float vMax) { this.vMax = vMax; }
        public Integer getDataSize() { return dataSize; }
        public void setDataSize(Integer dataSize) { this.dataSize = dataSize; }
        public String getSourceFileName() { return sourceFileName; }
        public void setSourceFileName(String sourceFileName) { this.sourceFileName = sourceFileName; }
        public String getSourceFilePath() { return sourceFilePath; }
        public void setSourceFilePath(String sourceFilePath) { this.sourceFilePath = sourceFilePath; }
        public Long getSourceFileSizeBytes() { return sourceFileSizeBytes; }
        public void setSourceFileSizeBytes(Long sourceFileSizeBytes) { this.sourceFileSizeBytes = sourceFileSizeBytes; }
        public OffsetDateTime getImportedAt() { return importedAt; }
        public void setImportedAt(OffsetDateTime importedAt) { this.importedAt = importedAt; }
    }
}
