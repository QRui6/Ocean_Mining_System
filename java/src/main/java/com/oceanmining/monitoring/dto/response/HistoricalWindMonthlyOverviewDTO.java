package com.oceanmining.monitoring.dto.response;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public class HistoricalWindMonthlyOverviewDTO {

    private String datasetCode;
    private String datasetName;
    private Integer startYear;
    private Integer endYear;
    private Integer total;
    private GridInfo grid;
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

    public GridInfo getGrid() { return grid; }
    public void setGrid(GridInfo grid) { this.grid = grid; }

    public List<MonthlyOverviewItemDTO> getItems() { return items; }
    public void setItems(List<MonthlyOverviewItemDTO> items) { this.items = items; }

    public static class GridInfo {
        private Integer width;
        private Integer height;
        private Double lonMin;
        private Double lonMax;
        private Double latMin;
        private Double latMax;

        public GridInfo() {
        }

        public GridInfo(Integer width, Integer height, Double lonMin, Double lonMax, Double latMin, Double latMax) {
            this.width = width;
            this.height = height;
            this.lonMin = lonMin;
            this.lonMax = lonMax;
            this.latMin = latMin;
            this.latMax = latMax;
        }

        public Integer getWidth() { return width; }
        public void setWidth(Integer width) { this.width = width; }

        public Integer getHeight() { return height; }
        public void setHeight(Integer height) { this.height = height; }

        public Double getLonMin() { return lonMin; }
        public void setLonMin(Double lonMin) { this.lonMin = lonMin; }

        public Double getLonMax() { return lonMax; }
        public void setLonMax(Double lonMax) { this.lonMax = lonMax; }

        public Double getLatMin() { return latMin; }
        public void setLatMin(Double latMin) { this.latMin = latMin; }

        public Double getLatMax() { return latMax; }
        public void setLatMax(Double latMax) { this.latMax = latMax; }
    }

    public static class MonthlyOverviewItemDTO {
        private Integer year;
        private Integer month;
        private String monthLabel;
        private LocalDate monthStart;
        private OffsetDateTime uTime;
        private OffsetDateTime uValidTime;
        private OffsetDateTime gustTime;
        private Double gustStepHours;
        private OffsetDateTime gustValidTime;
        private Float uMin;
        private Float uMax;
        private Float vMin;
        private Float vMax;
        private Float gustMin;
        private Float gustMax;
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

        public Float getUMin() { return uMin; }
        public void setUMin(Float uMin) { this.uMin = uMin; }

        public Float getUMax() { return uMax; }
        public void setUMax(Float uMax) { this.uMax = uMax; }

        public Float getVMin() { return vMin; }
        public void setVMin(Float vMin) { this.vMin = vMin; }

        public Float getVMax() { return vMax; }
        public void setVMax(Float vMax) { this.vMax = vMax; }

        public Float getGustMin() { return gustMin; }
        public void setGustMin(Float gustMin) { this.gustMin = gustMin; }

        public Float getGustMax() { return gustMax; }
        public void setGustMax(Float gustMax) { this.gustMax = gustMax; }

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
