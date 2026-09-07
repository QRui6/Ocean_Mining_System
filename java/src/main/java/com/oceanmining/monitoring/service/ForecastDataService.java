package com.oceanmining.monitoring.service;

import com.oceanmining.monitoring.dto.response.ForecastRegionDTO;
import com.oceanmining.monitoring.dto.response.ForecastSummaryDTO;
import com.oceanmining.monitoring.dto.response.RegionForecastDailyDTO;
import com.oceanmining.monitoring.dto.response.RegionForecastHourlyDTO;
import com.oceanmining.monitoring.entity.MiningRegion;
import com.oceanmining.monitoring.enums.ForecastRange;
import com.oceanmining.monitoring.exception.ResourceNotFoundException;
import com.oceanmining.monitoring.repository.MiningRegionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.function.Function;

@Service
@Transactional(readOnly = true)
public class ForecastDataService {

    private static final BigDecimal WIND_WARNING = new BigDecimal("20");
    private static final BigDecimal WIND_CRITICAL = new BigDecimal("25");
    private static final BigDecimal WAVE_WARNING = new BigDecimal("4");
    private static final BigDecimal WAVE_CRITICAL = new BigDecimal("6");
    private static final BigDecimal CURRENT_WARNING = new BigDecimal("2");

    private final MiningRegionRepository miningRegionRepository;
    private final MiningOverviewService miningOverviewService;

    public ForecastDataService(
            MiningRegionRepository miningRegionRepository,
            MiningOverviewService miningOverviewService) {
        this.miningRegionRepository = miningRegionRepository;
        this.miningOverviewService = miningOverviewService;
    }

    public List<ForecastRegionDTO> getForecastRegions() {
        List<ForecastRegionDTO> result = new ArrayList<>();
        for (MiningRegion region : miningRegionRepository.findByIsActiveTrueOrderByRegionNameAsc()) {
            List<RegionForecastHourlyDTO> hourly = miningOverviewService.getRegionHourlyForecasts(region.getId(), null);
            List<RegionForecastDailyDTO> daily = miningOverviewService.getRegionDailyForecasts(region.getId());
            if (hourly.isEmpty() && daily.isEmpty()) {
                continue;
            }
            ForecastRegionDTO dto = new ForecastRegionDTO();
            dto.setRegionId(region.getId());
            dto.setRegionCode(region.getRegionCode());
            dto.setRegionName(region.getRegionName());
            dto.setHasHourlyForecast(!hourly.isEmpty());
            dto.setHasDailyForecast(!daily.isEmpty());
            if (!hourly.isEmpty()) {
                dto.setLatestBaseDate(hourly.get(0).getBaseDate());
                dto.setLatestRunCycle(hourly.get(0).getRunCycle());
            } else {
                dto.setLatestBaseDate(daily.get(0).getBaseDate());
                dto.setLatestRunCycle(daily.get(0).getRunCycle());
            }
            result.add(dto);
        }
        return result;
    }

    public List<RegionForecastHourlyDTO> getHourlyForecast(Long regionId, ForecastRange range) {
        ensureRegion(regionId);
        List<RegionForecastHourlyDTO> rows = miningOverviewService.getRegionHourlyForecasts(regionId, null);
        if (rows.isEmpty()) {
            return List.of();
        }
        ZonedDateTime start = rows.get(0).getForecastTime();
        ZonedDateTime requestedEnd = start.plus(range.getDuration());
        return rows.stream()
                .filter(item -> !item.getForecastTime().isAfter(requestedEnd))
                .toList();
    }

    public List<RegionForecastDailyDTO> getDailyForecast(Long regionId, ForecastRange range) {
        ensureRegion(regionId);
        List<RegionForecastDailyDTO> rows = miningOverviewService.getRegionDailyForecasts(regionId);
        if (rows.isEmpty()) {
            return List.of();
        }
        int days = range == ForecastRange.HOURS_12 ? 1 : range.getDays();
        java.time.LocalDate requestedEndExclusive = rows.get(0).getForecastDate().plusDays(days);
        return rows.stream()
                .filter(item -> item.getForecastDate().isBefore(requestedEndExclusive))
                .toList();
    }

    public ForecastSummaryDTO getSummary(Long regionId, ForecastRange range) {
        MiningRegion region = ensureRegion(regionId);
        return range == ForecastRange.HOURS_12
                ? summarizeHourly(region, range, getHourlyForecast(regionId, range))
                : summarizeDaily(region, range, getDailyForecast(regionId, range));
    }

    private ForecastSummaryDTO summarizeHourly(
            MiningRegion region,
            ForecastRange range,
            List<RegionForecastHourlyDTO> rows) {
        if (rows.isEmpty()) {
            throw new ResourceNotFoundException("No latest hourly forecast data for region: " + region.getId());
        }
        RegionForecastHourlyDTO first = rows.get(0);
        RegionForecastHourlyDTO last = rows.get(rows.size() - 1);
        ZonedDateTime requestedEnd = first.getForecastTime().plus(range.getDuration());

        ForecastSummaryDTO dto = baseSummary(region, range);
        dto.setBaseDate(first.getBaseDate());
        dto.setRunCycle(first.getRunCycle());
        dto.setPeriodStart(first.getForecastTime());
        dto.setPeriodEnd(last.getForecastTime());
        dto.setRequestedPeriodEnd(requestedEnd);
        dto.setDataComplete(!last.getForecastTime().isBefore(requestedEnd));
        dto.setDataPointCount(rows.size());
        dto.setWindSpeedAvg(average(rows, RegionForecastHourlyDTO::getWindSpeedAvg));
        dto.setWindSpeedMax(max(rows, RegionForecastHourlyDTO::getWindSpeedMax));
        dto.setGustMax(max(rows, RegionForecastHourlyDTO::getGustMax));
        dto.setWaveHeightAvg(average(rows, RegionForecastHourlyDTO::getWaveHeightAvg));
        dto.setWaveHeightMax(max(rows, RegionForecastHourlyDTO::getWaveHeightMax));
        dto.setWavePeriodAvg(average(rows, RegionForecastHourlyDTO::getWavePeriodAvg));
        dto.setCurrentSpeedAvg(average(rows, RegionForecastHourlyDTO::getCurrentSpeedAvg));
        dto.setCurrentSpeedMax(max(rows, RegionForecastHourlyDTO::getCurrentSpeedMax));
        dto.setWindTrend(trend(rows, RegionForecastHourlyDTO::getWindSpeedAvg));
        dto.setWaveTrend(trend(rows, RegionForecastHourlyDTO::getWaveHeightAvg));
        dto.setCurrentTrend(trend(rows, RegionForecastHourlyDTO::getCurrentSpeedAvg));
        dto.setRiskLevel(calculateRisk(dto));
        return dto;
    }

    private ForecastSummaryDTO summarizeDaily(
            MiningRegion region,
            ForecastRange range,
            List<RegionForecastDailyDTO> rows) {
        if (rows.isEmpty()) {
            throw new ResourceNotFoundException("No latest daily forecast data for region: " + region.getId());
        }
        RegionForecastDailyDTO first = rows.get(0);
        RegionForecastDailyDTO last = rows.get(rows.size() - 1);
        ZoneId zone = ZoneId.systemDefault();
        ZonedDateTime periodStart = first.getForecastDate().atStartOfDay(zone);
        ZonedDateTime periodEnd = last.getForecastDate().atStartOfDay(zone);
        ZonedDateTime requestedEnd = periodStart.plus(range.getDuration());

        ForecastSummaryDTO dto = baseSummary(region, range);
        dto.setBaseDate(first.getBaseDate());
        dto.setRunCycle(first.getRunCycle());
        dto.setPeriodStart(periodStart);
        dto.setPeriodEnd(periodEnd);
        dto.setRequestedPeriodEnd(requestedEnd);
        dto.setDataComplete(rows.size() >= range.getDays());
        dto.setDataPointCount(rows.size());
        dto.setWindSpeedAvg(average(rows, RegionForecastDailyDTO::getWindSpeedAvg));
        dto.setWindSpeedMax(max(rows, RegionForecastDailyDTO::getWindSpeedMax));
        dto.setGustMax(max(rows, RegionForecastDailyDTO::getGustMax));
        dto.setWaveHeightAvg(average(rows, RegionForecastDailyDTO::getWaveHeightAvg));
        dto.setWaveHeightMax(max(rows, RegionForecastDailyDTO::getWaveHeightMax));
        dto.setWavePeriodAvg(average(rows, RegionForecastDailyDTO::getWavePeriodAvg));
        dto.setCurrentSpeedAvg(average(rows, RegionForecastDailyDTO::getCurrentSpeedAvg));
        dto.setCurrentSpeedMax(max(rows, RegionForecastDailyDTO::getCurrentSpeedMax));
        dto.setWindTrend(trend(rows, RegionForecastDailyDTO::getWindSpeedAvg));
        dto.setWaveTrend(trend(rows, RegionForecastDailyDTO::getWaveHeightAvg));
        dto.setCurrentTrend(trend(rows, RegionForecastDailyDTO::getCurrentSpeedAvg));
        dto.setRiskLevel(calculateRisk(dto));
        return dto;
    }

    private ForecastSummaryDTO baseSummary(MiningRegion region, ForecastRange range) {
        ForecastSummaryDTO dto = new ForecastSummaryDTO();
        dto.setRegionId(region.getId());
        dto.setRegionCode(region.getRegionCode());
        dto.setRegionName(region.getRegionName());
        dto.setTimeRange(range.getCode());
        dto.setRangeLabel(range.getDisplayName());
        return dto;
    }

    private String calculateRisk(ForecastSummaryDTO summary) {
        boolean critical = atLeast(summary.getWindSpeedMax(), WIND_CRITICAL)
                || atLeast(summary.getWaveHeightMax(), WAVE_CRITICAL);
        int warnings = 0;
        if (atLeast(summary.getWindSpeedMax(), WIND_WARNING)) {
            warnings++;
        }
        if (atLeast(summary.getWaveHeightMax(), WAVE_WARNING)) {
            warnings++;
        }
        if (atLeast(summary.getCurrentSpeedMax(), CURRENT_WARNING)) {
            warnings++;
        }
        if (critical || warnings >= 2) {
            return "CRITICAL";
        }
        if (warnings == 1) {
            return "HIGH";
        }
        if (atLeast(summary.getWindSpeedMax(), WIND_WARNING.multiply(new BigDecimal("0.8")))
                || atLeast(summary.getWaveHeightMax(), WAVE_WARNING.multiply(new BigDecimal("0.8")))
                || atLeast(summary.getCurrentSpeedMax(), CURRENT_WARNING.multiply(new BigDecimal("0.8")))) {
            return "MODERATE";
        }
        return "SAFE";
    }

    private MiningRegion ensureRegion(Long regionId) {
        return miningRegionRepository.findById(regionId)
                .orElseThrow(() -> new ResourceNotFoundException("Mining region not found: " + regionId));
    }

    private boolean atLeast(BigDecimal value, BigDecimal threshold) {
        return value != null && value.compareTo(threshold) >= 0;
    }

    private <T> BigDecimal average(List<T> items, Function<T, BigDecimal> getter) {
        List<BigDecimal> values = items.stream().map(getter).filter(Objects::nonNull).toList();
        if (values.isEmpty()) {
            return null;
        }
        BigDecimal sum = values.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(values.size()), 3, RoundingMode.HALF_UP);
    }

    private <T> BigDecimal max(List<T> items, Function<T, BigDecimal> getter) {
        return items.stream().map(getter).filter(Objects::nonNull).max(BigDecimal::compareTo).orElse(null);
    }

    private <T> String trend(List<T> items, Function<T, BigDecimal> getter) {
        BigDecimal first = items.stream().map(getter).filter(Objects::nonNull).findFirst().orElse(null);
        BigDecimal last = items.stream().map(getter).filter(Objects::nonNull).reduce((left, right) -> right).orElse(null);
        if (first == null || last == null) {
            return "UNKNOWN";
        }
        int comparison = last.subtract(first).abs().compareTo(new BigDecimal("0.1"));
        if (comparison < 0) {
            return "STABLE";
        }
        return last.compareTo(first) > 0 ? "UP" : "DOWN";
    }
}
