package com.oceanmining.monitoring.dto.response;

import java.time.ZonedDateTime;
import java.util.List;

public class BuoyHistoryDTO {

    private String buoyId;
    private String buoyName;
    private String range;
    private ZonedDateTime startTime;
    private ZonedDateTime endTime;
    private Integer total;
    private Statistics statistics;
    private List<BuoyHistoryPointDTO> points;

    public String getBuoyId() { return buoyId; }
    public void setBuoyId(String buoyId) { this.buoyId = buoyId; }
    public String getBuoyName() { return buoyName; }
    public void setBuoyName(String buoyName) { this.buoyName = buoyName; }
    public String getRange() { return range; }
    public void setRange(String range) { this.range = range; }
    public ZonedDateTime getStartTime() { return startTime; }
    public void setStartTime(ZonedDateTime startTime) { this.startTime = startTime; }
    public ZonedDateTime getEndTime() { return endTime; }
    public void setEndTime(ZonedDateTime endTime) { this.endTime = endTime; }
    public Integer getTotal() { return total; }
    public void setTotal(Integer total) { this.total = total; }
    public Statistics getStatistics() { return statistics; }
    public void setStatistics(Statistics statistics) { this.statistics = statistics; }
    public List<BuoyHistoryPointDTO> getPoints() { return points; }
    public void setPoints(List<BuoyHistoryPointDTO> points) { this.points = points; }

    public static class Statistics {

        private Metric windSpeed;
        private Metric waveHeight;
        private Metric currentSpeed;

        public Metric getWindSpeed() { return windSpeed; }
        public void setWindSpeed(Metric windSpeed) { this.windSpeed = windSpeed; }
        public Metric getWaveHeight() { return waveHeight; }
        public void setWaveHeight(Metric waveHeight) { this.waveHeight = waveHeight; }
        public Metric getCurrentSpeed() { return currentSpeed; }
        public void setCurrentSpeed(Metric currentSpeed) { this.currentSpeed = currentSpeed; }
    }

    public static class Metric {

        private Double min;
        private Double max;
        private Double avg;
        private String unit;

        public Metric() {
        }

        public Metric(Double min, Double max, Double avg, String unit) {
            this.min = min;
            this.max = max;
            this.avg = avg;
            this.unit = unit;
        }

        public Double getMin() { return min; }
        public void setMin(Double min) { this.min = min; }
        public Double getMax() { return max; }
        public void setMax(Double max) { this.max = max; }
        public Double getAvg() { return avg; }
        public void setAvg(Double avg) { this.avg = avg; }
        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }
    }
}
