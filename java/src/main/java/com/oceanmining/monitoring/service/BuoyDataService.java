package com.oceanmining.monitoring.service;

import com.oceanmining.monitoring.dto.response.BuoyHistoryDTO;
import com.oceanmining.monitoring.dto.response.BuoyHistoryPointDTO;
import com.oceanmining.monitoring.dto.response.BuoyInfoDTO;
import com.oceanmining.monitoring.dto.response.BuoyRealtimeDTO;
import com.oceanmining.monitoring.exception.ResourceNotFoundException;
import jakarta.annotation.PostConstruct;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.ToDoubleFunction;

@Service
public class BuoyDataService {

    private static final ZoneId DATA_ZONE = ZoneId.of("Asia/Shanghai");
    private static final int HISTORY_POINT_LIMIT = 15 * 24;
    private static final List<BuoyInfoDTO> BUOYS = List.of(
            new BuoyInfoDTO("BUOY-001", "西太平洋浮标A", 8.0, 130.0),
            new BuoyInfoDTO("BUOY-002", "西太平洋浮标B", 12.0, 150.0),
            new BuoyInfoDTO("BUOY-003", "西太平洋浮标C", 5.0, 140.0),
            new BuoyInfoDTO("BUOY-004", "西太平洋浮标D", 18.0, 135.0),
            new BuoyInfoDTO("BUOY-005", "西太平洋浮标E", 10.0, 155.0)
    );

    private final Map<String, List<BuoyHistoryPointDTO>> historyCache = new ConcurrentHashMap<>();
    private final Map<String, BuoyRealtimeDTO> realtimeCache = new ConcurrentHashMap<>();

    @PostConstruct
    public void initialize() {
        ZonedDateTime currentHour = currentHour();
        for (int i = 0; i < BUOYS.size(); i++) {
            BuoyInfoDTO buoy = BUOYS.get(i);
            List<BuoyHistoryPointDTO> points = new ArrayList<>(HISTORY_POINT_LIMIT);
            ZonedDateTime start = currentHour.minusHours(HISTORY_POINT_LIMIT - 1L);
            for (int hour = 0; hour < HISTORY_POINT_LIMIT; hour++) {
                points.add(generateHistoryPoint(i, start.plusHours(hour)));
            }
            historyCache.put(buoy.getId(), List.copyOf(points));
            realtimeCache.put(buoy.getId(), generateRealtime(i, buoy, ZonedDateTime.now(DATA_ZONE)));
        }
    }

    @Scheduled(
            fixedRateString = "${buoy.simulation.refresh-ms:60000}",
            initialDelayString = "${buoy.simulation.refresh-ms:60000}"
    )
    public void refreshRealtimeData() {
        ZonedDateTime now = ZonedDateTime.now(DATA_ZONE);
        rollHourlyHistory(now.truncatedTo(ChronoUnit.HOURS));
        for (int i = 0; i < BUOYS.size(); i++) {
            BuoyInfoDTO buoy = BUOYS.get(i);
            realtimeCache.put(buoy.getId(), generateRealtime(i, buoy, now));
        }
    }

    public List<BuoyInfoDTO> getAllBuoys() {
        return BUOYS;
    }

    public List<BuoyRealtimeDTO> getAllRealtimeData() {
        return BUOYS.stream()
                .map(buoy -> getRealtimeData(buoy.getId()))
                .toList();
    }

    public BuoyRealtimeDTO getRealtimeData(String buoyId) {
        ensureBuoy(buoyId);
        BuoyRealtimeDTO realtime = realtimeCache.get(buoyId);
        if (realtime == null) {
            throw new ResourceNotFoundException("Buoy realtime data not found: " + buoyId);
        }
        return realtime;
    }

    public BuoyHistoryDTO getHistory(String buoyId, String range) {
        BuoyInfoDTO buoy = ensureBuoy(buoyId);
        int requestedPoints = rangePointCount(range);
        List<BuoyHistoryPointDTO> allPoints = historyCache.getOrDefault(buoyId, List.of());
        int fromIndex = Math.max(0, allPoints.size() - requestedPoints);
        List<BuoyHistoryPointDTO> points = List.copyOf(allPoints.subList(fromIndex, allPoints.size()));

        BuoyHistoryDTO response = new BuoyHistoryDTO();
        response.setBuoyId(buoy.getId());
        response.setBuoyName(buoy.getName());
        response.setRange(range.toLowerCase());
        response.setTotal(points.size());
        response.setPoints(points);
        if (!points.isEmpty()) {
            response.setStartTime(points.get(0).getTimestamp());
            response.setEndTime(points.get(points.size() - 1).getTimestamp());
        }
        response.setStatistics(calculateStatistics(points));
        return response;
    }

    private void rollHourlyHistory(ZonedDateTime currentHour) {
        for (int i = 0; i < BUOYS.size(); i++) {
            BuoyInfoDTO buoy = BUOYS.get(i);
            List<BuoyHistoryPointDTO> current = historyCache.getOrDefault(buoy.getId(), List.of());
            if (current.isEmpty()) {
                historyCache.put(buoy.getId(), List.of(generateHistoryPoint(i, currentHour)));
                continue;
            }
            ZonedDateTime latest = current.get(current.size() - 1).getTimestamp();
            if (!latest.isBefore(currentHour)) {
                continue;
            }
            List<BuoyHistoryPointDTO> updated = new ArrayList<>(current);
            ZonedDateTime next = latest.plusHours(1);
            while (!next.isAfter(currentHour)) {
                updated.add(generateHistoryPoint(i, next));
                next = next.plusHours(1);
            }
            if (updated.size() > HISTORY_POINT_LIMIT) {
                updated = new ArrayList<>(
                        updated.subList(updated.size() - HISTORY_POINT_LIMIT, updated.size())
                );
            }
            historyCache.put(buoy.getId(), List.copyOf(updated));
        }
    }

    private BuoyHistoryPointDTO generateHistoryPoint(int buoyIndex, ZonedDateTime timestamp) {
        long epochHour = timestamp.toEpochSecond() / 3600;
        Random random = new Random(10_007L * (buoyIndex + 1) + 7_919L * epochHour);
        double phase = buoyIndex * 0.73;

        double wind = 8.0 + buoyIndex * 1.1
                + (3.0 + buoyIndex * 0.35) * Math.sin(2 * Math.PI * epochHour / 24.0 + phase)
                + 1.2 * Math.sin(2 * Math.PI * epochHour / 96.0 + phase / 2)
                + random.nextGaussian() * 0.8;
        double wave = 2.0 + buoyIndex * 0.18
                + (0.8 + buoyIndex * 0.12) * Math.sin(2 * Math.PI * epochHour / 18.0 + phase)
                + 0.45 * Math.sin(2 * Math.PI * epochHour / 72.0 + phase)
                + random.nextGaussian() * 0.18;
        double current = 0.65 + buoyIndex * 0.08
                + (0.22 + buoyIndex * 0.03) * Math.sin(2 * Math.PI * epochHour / 12.0 + phase)
                + 0.12 * Math.sin(2 * Math.PI * epochHour / 120.0 + phase)
                + random.nextGaussian() * 0.05;

        BuoyHistoryPointDTO point = new BuoyHistoryPointDTO();
        point.setTimestamp(timestamp);
        point.setWindSpeed(round(clamp(wind, 2.0, 25.0)));
        point.setWindDirection(round(direction(210 + buoyIndex * 17
                + 35 * Math.sin(2 * Math.PI * epochHour / 30.0 + phase)
                + random.nextGaussian() * 8)));
        point.setWaveHeight(round(clamp(wave, 0.5, 8.0)));
        point.setWaveDirection(round(direction(175 + buoyIndex * 13
                + 28 * Math.sin(2 * Math.PI * epochHour / 40.0 + phase)
                + random.nextGaussian() * 6)));
        point.setWavePeriod(round(clamp(7.0 + wave * 0.9 + random.nextGaussian() * 0.4, 4.0, 16.0)));
        point.setCurrentSpeed(round(clamp(current, 0.1, 2.5)));
        point.setCurrentDirection(round(direction(95 + buoyIndex * 21
                + 45 * Math.sin(2 * Math.PI * epochHour / 28.0 + phase)
                + random.nextGaussian() * 7)));
        return point;
    }

    private BuoyRealtimeDTO generateRealtime(int buoyIndex, BuoyInfoDTO buoy, ZonedDateTime now) {
        BuoyHistoryPointDTO base = generateHistoryPoint(buoyIndex, now.truncatedTo(ChronoUnit.HOURS));
        long epochMinute = now.toEpochSecond() / 60;
        Random random = new Random(31_337L * (buoyIndex + 1) + 101L * epochMinute);

        BuoyRealtimeDTO realtime = new BuoyRealtimeDTO();
        realtime.setBuoyId(buoy.getId());
        realtime.setBuoyName(buoy.getName());
        realtime.setLat(buoy.getLat());
        realtime.setLng(buoy.getLng());
        realtime.setTimestamp(now.truncatedTo(ChronoUnit.SECONDS));
        realtime.setWindSpeed(round(clamp(base.getWindSpeed() + random.nextGaussian() * 0.35, 2.0, 25.0)));
        realtime.setWindDirection(round(direction(base.getWindDirection() + random.nextGaussian() * 3)));
        realtime.setWaveHeight(round(clamp(base.getWaveHeight() + random.nextGaussian() * 0.08, 0.5, 8.0)));
        realtime.setWaveDirection(round(direction(base.getWaveDirection() + random.nextGaussian() * 2)));
        realtime.setWavePeriod(round(clamp(base.getWavePeriod() + random.nextGaussian() * 0.15, 4.0, 16.0)));
        realtime.setCurrentSpeed(round(clamp(
                base.getCurrentSpeed() + random.nextGaussian() * 0.025,
                0.1,
                2.5
        )));
        realtime.setCurrentDirection(round(direction(base.getCurrentDirection() + random.nextGaussian() * 2.5)));
        realtime.setSource("SIMULATED");
        return realtime;
    }

    private BuoyHistoryDTO.Statistics calculateStatistics(List<BuoyHistoryPointDTO> points) {
        BuoyHistoryDTO.Statistics statistics = new BuoyHistoryDTO.Statistics();
        statistics.setWindSpeed(metric(points, BuoyHistoryPointDTO::getWindSpeed, "m/s"));
        statistics.setWaveHeight(metric(points, BuoyHistoryPointDTO::getWaveHeight, "m"));
        statistics.setCurrentSpeed(metric(points, BuoyHistoryPointDTO::getCurrentSpeed, "m/s"));
        return statistics;
    }

    private BuoyHistoryDTO.Metric metric(
            List<BuoyHistoryPointDTO> points,
            ToDoubleFunction<BuoyHistoryPointDTO> getter,
            String unit) {
        if (points.isEmpty()) {
            return new BuoyHistoryDTO.Metric(null, null, null, unit);
        }
        double min = points.stream().mapToDouble(getter).min().orElse(0);
        double max = points.stream().mapToDouble(getter).max().orElse(0);
        double avg = points.stream().mapToDouble(getter).average().orElse(0);
        return new BuoyHistoryDTO.Metric(round(min), round(max), round(avg), unit);
    }

    private BuoyInfoDTO ensureBuoy(String buoyId) {
        return BUOYS.stream()
                .filter(buoy -> buoy.getId().equalsIgnoreCase(buoyId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Buoy not found: " + buoyId));
    }

    private int rangePointCount(String range) {
        if (range == null) {
            return 12;
        }
        return switch (range.toLowerCase()) {
            case "12h" -> 12;
            case "7d" -> 7 * 24;
            case "15d" -> HISTORY_POINT_LIMIT;
            default -> throw new IllegalArgumentException(
                    "Unsupported buoy history range: " + range + ". Use 12h, 7d or 15d."
            );
        };
    }

    private ZonedDateTime currentHour() {
        return ZonedDateTime.now(DATA_ZONE).truncatedTo(ChronoUnit.HOURS);
    }

    private double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    private double direction(double value) {
        double result = value % 360;
        return result < 0 ? result + 360 : result;
    }

    private double round(double value) {
        return Math.round(value * 1000.0) / 1000.0;
    }
}
