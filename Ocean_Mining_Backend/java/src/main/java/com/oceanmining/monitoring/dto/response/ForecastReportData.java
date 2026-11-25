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

    public static ForecastReportData fromSnapshot(ForecastSummaryDTO summary,com.fasterxml.jackson.databind.JsonNode snapshot) {
        var series=snapshot==null?com.fasterxml.jackson.databind.node.MissingNode.getInstance():snapshot.path("hourlySeries");
        if(!series.isArray() || series.isEmpty())series=snapshot==null?com.fasterxml.jackson.databind.node.MissingNode.getInstance():snapshot.path("series");
        var points=new java.util.TreeMap<String,Point>();
        boolean hourly=false;
        for(var row:series) {
            String batch=row.path("baseDate").asText("");
            if(summary.getBaseDate()!=null && !batch.isBlank() && !batch.equals(summary.getBaseDate().toString()))continue;
            String cycle=row.path("runCycle").asText("");
            if(summary.getRunCycle()!=null && !cycle.isBlank() && !cycle.equalsIgnoreCase(summary.getRunCycle()))continue;
            String stamp=row.path("forecastTime").asText("");
            ZonedDateTime time=null;
            LocalDate date;
            try {
                if(!stamp.isBlank()){
                    try{time=ZonedDateTime.parse(stamp.replace(' ','T'));}
                    catch(java.time.format.DateTimeParseException e){time=java.time.LocalDateTime.parse(stamp.replace(' ','T')).atZone(java.time.ZoneId.of("Asia/Shanghai"));}
                    date=time.toLocalDate();hourly=true;
                }else date=LocalDate.parse(row.path("forecastDate").asText());
            }catch(java.time.format.DateTimeParseException e){continue;}
            points.put(time==null?date.toString():time.toInstant().toString(),new Point(date,time,
                number(row,"windSpeedAvg","windSpeed"),number(row,"windSpeedMax"),number(row,"gustMax","gust"),
                number(row,"waveHeightAvg","waveHeight"),number(row,"waveHeightMax"),number(row,"wavePeriodAvg","wavePeriod"),
                number(row,"currentSpeedAvg","currentSpeed"),number(row,"currentSpeedMax"),row.hasNonNull("hourCount")?row.get("hourCount").asInt():null));
        }
        if(hourly)points.values().removeIf(p->p.time()==null);
        return new ForecastReportData(summary,new java.util.ArrayList<>(points.values()),hourly);
    }

    private static BigDecimal number(com.fasterxml.jackson.databind.JsonNode row,String... names) {
        for(String name:names) {
            if(!row.hasNonNull(name))continue;
            try{return new BigDecimal(row.get(name).asText());}catch(NumberFormatException ignored){}
        }
        return null;
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
