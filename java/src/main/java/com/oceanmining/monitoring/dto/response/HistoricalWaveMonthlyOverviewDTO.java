package com.oceanmining.monitoring.dto.response;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public class HistoricalWaveMonthlyOverviewDTO {

    private String datasetCode;
    private String datasetName;
    private Integer startYear;
    private Integer endYear;
    private Integer total;
    private HistoricalWindMonthlyOverviewDTO.GridInfo grid;
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

    public List<MonthlyOverviewItemDTO> getItems() { return items; }
    public void setItems(List<MonthlyOverviewItemDTO> items) { this.items = items; }

    public static class MonthlyOverviewItemDTO {
        private Integer year;
        private Integer month;
        private String monthLabel;
        private LocalDate monthStart;
        private OffsetDateTime waveTime;
        private Double waveStepHours;
        private OffsetDateTime waveValidTime;
        private Float swhMin;
        private Float swhMax;
        private Float mwpMin;
        private Float mwpMax;
        private Float mwdMin;
        private Float mwdMax;
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
        public OffsetDateTime getWaveTime() { return waveTime; }
        public void setWaveTime(OffsetDateTime waveTime) { this.waveTime = waveTime; }
        public Double getWaveStepHours() { return waveStepHours; }
        public void setWaveStepHours(Double waveStepHours) { this.waveStepHours = waveStepHours; }
        public OffsetDateTime getWaveValidTime() { return waveValidTime; }
        public void setWaveValidTime(OffsetDateTime waveValidTime) { this.waveValidTime = waveValidTime; }
        public Float getSwhMin() { return swhMin; }
        public void setSwhMin(Float swhMin) { this.swhMin = swhMin; }
        public Float getSwhMax() { return swhMax; }
        public void setSwhMax(Float swhMax) { this.swhMax = swhMax; }
        public Float getMwpMin() { return mwpMin; }
        public void setMwpMin(Float mwpMin) { this.mwpMin = mwpMin; }
        public Float getMwpMax() { return mwpMax; }
        public void setMwpMax(Float mwpMax) { this.mwpMax = mwpMax; }
        public Float getMwdMin() { return mwdMin; }
        public void setMwdMin(Float mwdMin) { this.mwdMin = mwdMin; }
        public Float getMwdMax() { return mwdMax; }
        public void setMwdMax(Float mwdMax) { this.mwdMax = mwdMax; }
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
