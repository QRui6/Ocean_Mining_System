package com.oceanmining.monitoring.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.List;

/** Summary and charts must be calculated from exactly the same forecast rows. */
public record ForecastReportData(ForecastSummaryDTO summary, List<Point> points, boolean hourly) {
    public ForecastReportData {
        points = List.copyOf(points);
    }

    public record Point(LocalDate date, ZonedDateTime time,
                        BigDecimal windAvg, BigDecimal windMax, BigDecimal gust,
                        BigDecimal waveAvg, BigDecimal waveMax, BigDecimal period,
                        BigDecimal currentAvg, BigDecimal currentMax, Integer hourCount) {
        public static Point from(RegionForecastHourlyDTO row) {
            return new Point(row.getForecastDate(), row.getForecastTime(), row.getWindSpeedAvg(),
                    row.getWindSpeedMax(), row.getGustMax(), row.getWaveHeightAvg(), row.getWaveHeightMax(),
                    row.getWavePeriodAvg(), row.getCurrentSpeedAvg(), row.getCurrentSpeedMax(), null);
        }

        public static Point from(RegionForecastDailyDTO row) {
            return new Point(row.getForecastDate(), null, row.getWindSpeedAvg(), row.getWindSpeedMax(),
                    row.getGustMax(), row.getWaveHeightAvg(), row.getWaveHeightMax(), row.getWavePeriodAvg(),
                    row.getCurrentSpeedAvg(), row.getCurrentSpeedMax(), row.getHourCount());
        }
    }
}
