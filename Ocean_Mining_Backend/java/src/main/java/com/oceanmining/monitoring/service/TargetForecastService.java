package com.oceanmining.monitoring.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oceanmining.monitoring.dto.response.ForecastReportData;
import com.oceanmining.monitoring.dto.response.ForecastReportData.Point;
import com.oceanmining.monitoring.dto.response.ForecastSummaryDTO;
import com.oceanmining.monitoring.dto.response.MiningOverviewSiteDTO;
import com.oceanmining.monitoring.dto.response.SiteForecastDailyDTO;
import com.oceanmining.monitoring.dto.response.SiteForecastHourlyDTO;
import com.oceanmining.monitoring.enums.ForecastRange;
import com.oceanmining.monitoring.exception.ResourceNotFoundException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.TreeMap;

@Service
public class TargetForecastService {
    public record Station(Long id, String label, BigDecimal lng, BigDecimal lat) {}
    public record Target(String id, String name, String ocean, List<Station> stations) {}
    public record Product(Target target, Station station, ForecastReportData report,
                          @JsonInclude(JsonInclude.Include.NON_NULL) List<Point> hourlyPoints) {}

    private static final ZoneId REPORT_ZONE = ZoneId.of("Asia/Shanghai");
    private record Batch(LocalDate date, String cycle) {
        Instant initialTime() {
            if (date == null || cycle == null || !cycle.matches("(?i)t?(00|06|12|18)")) return null;
            return date.atTime(Integer.parseInt(cycle.substring(cycle.length() - 2)), 0).toInstant(ZoneOffset.UTC);
        }
    }

    private final MiningOverviewService overview;
    private final ForecastDataService forecasts;
    private final JdbcTemplate db;
    private final ObjectMapper json;

    public TargetForecastService(MiningOverviewService overview, ForecastDataService forecasts, JdbcTemplate db, ObjectMapper json) {
        this.overview = overview;
        this.forecasts = forecasts;
        this.db = db;
        this.json = json;
    }

    public List<Target> targets() {
        List<MiningOverviewSiteDTO> sites = overview.getSites(null);
        return ServiceMiningAreas.ALL.stream().map(area -> target(area, sites)).toList();
    }

    private Target target(ServiceMiningAreas.Area area, List<MiningOverviewSiteDTO> sites) {
        List<Station> stations = new ArrayList<>();
        for (var binding : area.stations()) {
            sites.stream()
                    .filter(site -> area.id().equals(site.getSiteCode()) && binding.sourceRegion().equals(site.getRegionName()))
                    .findFirst()
                    .ifPresent(site -> stations.add(new Station(site.getId(), binding.label(), site.getLng(), site.getLat())));
        }
        return new Target(area.id(), area.name(), area.ocean(), List.copyOf(stations));
    }

    public JsonNode geometry(String id) throws JsonProcessingException {
        ServiceMiningAreas.require(id);
        String geometry = db.queryForObject(
                "SELECT ST_AsGeoJSON(g) FROM (" + ServiceMiningAreas.CONTRACT_BOUNDARY + ") AS area", String.class, id);
        if (geometry == null) throw new ResourceNotFoundException("矿区暂无边界数据");
        return json.readTree(geometry);
    }

    public Product product(String id, Long siteId, ForecastRange range) {
        return product(id, siteId, range, false);
    }

    public Product product(String id, Long siteId, ForecastRange range, boolean includeHourly) {
        Target target = target(ServiceMiningAreas.require(id), overview.getSites(null));
        Station station = siteId == null ? target.stations().stream().findFirst().orElse(null)
                : target.stations().stream().filter(s -> s.id().equals(siteId)).findFirst()
                        .orElseThrow(() -> new ResourceNotFoundException("预报站点不属于该矿区"));
        boolean hourly = range == ForecastRange.HOURS_12;
        ForecastSummaryDTO summary = new ForecastSummaryDTO();
        summary.setRegionCode(id);
        summary.setRegionName(station == null || station.label().isEmpty() ? target.name() : target.name() + " · " + station.label());
        summary.setTimeRange(range.getCode());
        summary.setRangeLabel(range.getDisplayName());
        summary.setDataComplete(false);
        List<Point> points = List.of(), hourlyPoints = includeHourly ? List.of() : null;
        if (station != null) {
            summary.setLongitude(station.lng());
            summary.setLatitude(station.lat());
            List<SiteForecastHourlyDTO> rows = hourly || includeHourly
                    ? overview.getSiteHourlyForecasts(station.id(), null, true) : List.of();
            points = hourly ? hourly(rows, range, summary) : daily(station.id(), range, summary);
            if (includeHourly && summary.getBaseDate() != null) {
                Batch batch = new Batch(summary.getBaseDate(), summary.getRunCycle());
                hourlyPoints = List.copyOf(pointsByTime(rows, batch).values());
            }
        }
        forecasts.summarizePoints(summary, points);
        return new Product(target, station, new ForecastReportData(summary, points, hourly), hourlyPoints);
    }

    private TreeMap<Instant, Point> pointsByTime(List<SiteForecastHourlyDTO> rows, Batch batch) {
        var times = new TreeMap<Instant, Point>();
        for (var row : rows) {
            if (row.getForecastTime() == null || !batch.equals(new Batch(row.getBaseDate(), row.getRunCycle()))) continue;
            ZonedDateTime time = row.getForecastTime().withZoneSameInstant(REPORT_ZONE);
            times.put(time.toInstant(), new Point(time.toLocalDate(), time, row.getWindSpeed(), row.getWindSpeed(),
                    row.getGust(), row.getWaveHeight(), row.getWaveHeight(), row.getWavePeriod(),
                    row.getCurrentSpeed(), row.getCurrentSpeed(), null));
        }
        return times;
    }

    private List<Point> hourly(List<SiteForecastHourlyDTO> rows, ForecastRange range, ForecastSummaryDTO summary) {
        Batch batch = latest(rows.stream().filter(row -> row.getForecastTime() != null)
                .map(row -> new Batch(row.getBaseDate(), row.getRunCycle())).toList());
        if (batch == null) return List.of();
        var times = pointsByTime(rows, batch);
        Instant now = Instant.now();
        if (isCurrent(batch, now) && !times.tailMap(now, true).isEmpty()) times = new TreeMap<>(times.tailMap(now, true));
        Instant end = times.firstKey().plus(range.getDuration());
        List<Point> points = List.copyOf(times.headMap(end, true).values());
        ZonedDateTime first = points.get(0).time();
        ZonedDateTime last = points.get(points.size() - 1).time();
        setPeriod(summary, batch, first, last, end.atZone(REPORT_ZONE), last.toInstant());
        Duration expectedStep = Duration.ofHours(3);
        for (int i = 1; i < points.size(); i++) {
            Duration step = Duration.between(points.get(i - 1).time(), points.get(i).time());
            if (step.compareTo(expectedStep) < 0) expectedStep = step;
        }
        boolean continuous = true;
        for (int i = 1; i < points.size(); i++) {
            if (Duration.between(points.get(i - 1).time(), points.get(i).time()).compareTo(expectedStep) > 0) {
                continuous = false;
                break;
            }
        }
        summary.setDataComplete(continuous && last.toInstant().equals(end));
        return points;
    }

    private List<Point> daily(Long siteId, ForecastRange range, ForecastSummaryDTO summary) {
        List<SiteForecastDailyDTO> rows = overview.getSiteDailyForecasts(siteId, true);
        Batch batch = latest(rows.stream().filter(row -> row.getForecastDate() != null)
                .map(row -> new Batch(row.getBaseDate(), row.getRunCycle())).toList());
        if (batch == null) return List.of();
        var dates = new TreeMap<LocalDate, Point>();
        for (var row : rows) {
            if (row.getForecastDate() == null || !batch.equals(new Batch(row.getBaseDate(), row.getRunCycle()))) continue;
            dates.put(row.getForecastDate(), new Point(row.getForecastDate(), null, row.getWindSpeedAvg(), row.getWindSpeedMax(),
                    row.getGustMax(), row.getWaveHeightAvg(), row.getWaveHeightMax(), row.getWavePeriodAvg(),
                    row.getCurrentSpeedAvg(), row.getCurrentSpeedMax(), row.getHourCount()));
        }
        ZonedDateTime now = ZonedDateTime.now(REPORT_ZONE);
        if (isCurrent(batch, now.toInstant()) && !dates.tailMap(now.toLocalDate(), true).isEmpty()) {
            dates = new TreeMap<>(dates.tailMap(now.toLocalDate(), true));
        }
        LocalDate end = dates.firstKey().plusDays(range.getDays());
        List<Point> points = List.copyOf(dates.headMap(end, false).values());
        ZonedDateTime last = points.get(points.size() - 1).date().atStartOfDay(REPORT_ZONE);
        setPeriod(summary, batch, points.get(0).date().atStartOfDay(REPORT_ZONE), last,
                end.atStartOfDay(REPORT_ZONE), last.plusDays(1).toInstant());
        summary.setDataComplete(points.size() == range.getDays());
        return points;
    }

    private static Batch latest(List<Batch> batches) {
        return batches.stream().filter(batch -> batch.date() != null)
                .max(Comparator.comparing(Batch::date).thenComparing(batch -> batch.initialTime() == null
                        ? Instant.MIN : batch.initialTime())).orElse(null);
    }

    private static boolean isCurrent(Batch batch, Instant now) {
        Instant initial = batch.initialTime();
        return initial != null && !initial.isAfter(now) && !initial.isBefore(now.minus(Duration.ofDays(2)));
    }

    private static void setPeriod(ForecastSummaryDTO summary, Batch batch, ZonedDateTime first, ZonedDateTime last,
                                  ZonedDateTime requestedEnd, Instant validityEnd) {
        summary.setBaseDate(batch.date());
        summary.setRunCycle(batch.cycle());
        summary.setPeriodStart(first);
        summary.setPeriodEnd(last);
        summary.setRequestedPeriodEnd(requestedEnd);
        Instant now = Instant.now();
        boolean stale = !isCurrent(batch, now) || !validityEnd.isAfter(now);
        summary.setStale(stale);
        if (stale) summary.setRangeLabel(summary.getRangeLabel().replaceFirst("^未来", ""));
    }
}
