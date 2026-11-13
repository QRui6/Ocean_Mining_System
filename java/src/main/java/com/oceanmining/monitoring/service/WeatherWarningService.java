package com.oceanmining.monitoring.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.oceanmining.monitoring.dto.response.ForecastSummaryDTO;
import com.oceanmining.monitoring.dto.response.WarningStatsDTO;
import com.oceanmining.monitoring.dto.response.WeatherWarningDTO;
import com.oceanmining.monitoring.dto.response.WeatherWarningDetailDTO;
import com.oceanmining.monitoring.dto.response.WeatherWarningPageDTO;
import com.oceanmining.monitoring.entity.MiningRegion;
import com.oceanmining.monitoring.entity.WeatherWarning;
import com.oceanmining.monitoring.enums.ForecastRange;
import com.oceanmining.monitoring.enums.WeatherWarningSeverity;
import com.oceanmining.monitoring.enums.WeatherWarningStatus;
import com.oceanmining.monitoring.exception.ResourceNotFoundException;
import com.oceanmining.monitoring.repository.MiningRegionRepository;
import com.oceanmining.monitoring.repository.WeatherWarningRepository;
import com.oceanmining.monitoring.websocket.ShipMonitoringWebSocketHandler;
import com.oceanmining.monitoring.websocket.WebSocketMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class WeatherWarningService {

    private final ForecastDataService forecastDataService;
    private final ForecastBulletinService forecastBulletinService;
    private final WeatherWarningRepository weatherWarningRepository;
    private final MiningRegionRepository miningRegionRepository;
    private final ShipMonitoringWebSocketHandler webSocketHandler;
    private final ObjectMapper objectMapper;
    private final BigDecimal windWarning;
    private final BigDecimal windCritical;
    private final BigDecimal waveWarning;
    private final BigDecimal waveCritical;
    private final BigDecimal currentWarning;

    public WeatherWarningService(
            ForecastDataService forecastDataService,
            ForecastBulletinService forecastBulletinService,
            WeatherWarningRepository weatherWarningRepository,
            MiningRegionRepository miningRegionRepository,
            ShipMonitoringWebSocketHandler webSocketHandler,
            ObjectMapper objectMapper,
            @Value("${forecast.warning.wind-warning:20}") BigDecimal windWarning,
            @Value("${forecast.warning.wind-critical:25}") BigDecimal windCritical,
            @Value("${forecast.warning.wave-warning:4}") BigDecimal waveWarning,
            @Value("${forecast.warning.wave-critical:6}") BigDecimal waveCritical,
            @Value("${forecast.warning.current-warning:2}") BigDecimal currentWarning) {
        this.forecastDataService = forecastDataService;
        this.forecastBulletinService = forecastBulletinService;
        this.weatherWarningRepository = weatherWarningRepository;
        this.miningRegionRepository = miningRegionRepository;
        this.webSocketHandler = webSocketHandler;
        this.objectMapper = objectMapper;
        this.windWarning = windWarning;
        this.windCritical = windCritical;
        this.waveWarning = waveWarning;
        this.waveCritical = waveCritical;
        this.currentWarning = currentWarning;
    }

    @Transactional
    public Optional<WeatherWarningDTO> detectAndSave(Long regionId, ForecastRange range) {
        ForecastSummaryDTO summary = forecastDataService.getSummary(regionId, range);
        Optional<WeatherWarning> existing = weatherWarningRepository
                .findByRegion_IdAndTimeRangeAndBaseDateAndRunCycle(
                        regionId,
                        range.getCode(),
                        summary.getBaseDate(),
                        summary.getRunCycle()
                );
        if (existing.isPresent()) {
            return Optional.empty();
        }

        DetectionResult detection = detect(summary);
        if (detection.triggers().isEmpty()) {
            return Optional.empty();
        }

        MiningRegion region = miningRegionRepository.findById(regionId)
                .orElseThrow(() -> new ResourceNotFoundException("Mining region not found: " + regionId));
        WeatherWarning warning = new WeatherWarning();
        warning.setRegion(region);
        warning.setTimeRange(range.getCode());
        warning.setBaseDate(summary.getBaseDate());
        warning.setRunCycle(summary.getRunCycle());
        warning.setSeverity(detection.severity());
        warning.setTriggerType(detection.triggers().stream()
                .map(Trigger::type)
                .collect(Collectors.joining("+")));
        warning.setTriggerDetail(toTriggerJson(detection.triggers()));
        warning.setWarningMessage(buildMessage(summary, detection));
        warning.setForecastData(buildSnapshot(summary, range));
        warning.setWindThreshold(windWarning);
        warning.setWaveThreshold(waveWarning);
        warning.setCurrentThreshold(currentWarning);
        warning.setStatus(WeatherWarningStatus.ACTIVE);
        warning.setBulletinText(buildWarningBulletin(summary, detection));
        warning = weatherWarningRepository.save(warning);

        WeatherWarningDTO dto = toDto(warning);
        broadcastWarning(dto);
        return Optional.of(dto);
    }

    @Transactional(readOnly = true)
    public WeatherWarningPageDTO findWarnings(
            Long regionId,
            ForecastRange range,
            WeatherWarningSeverity severity,
            WeatherWarningStatus status,
            int page,
            int pageSize) {
        int safePage = Math.max(page, 1);
        int safePageSize = Math.min(Math.max(pageSize, 1), 200);
        Specification<WeatherWarning> spec = Specification.where(
                (root, query, builder) -> builder.conjunction()
        );
        if (regionId != null) {
            spec = spec.and((root, query, builder) -> builder.equal(root.get("region").get("id"), regionId));
        }
        if (range != null) {
            spec = spec.and((root, query, builder) -> builder.equal(root.get("timeRange"), range.getCode()));
        }
        if (severity != null) {
            spec = spec.and((root, query, builder) -> builder.equal(root.get("severity"), severity));
        }
        if (status != null) {
            spec = spec.and((root, query, builder) -> builder.equal(root.get("status"), status));
        }

        Page<WeatherWarning> result = weatherWarningRepository.findAll(
                spec,
                PageRequest.of(safePage - 1, safePageSize, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        WeatherWarningPageDTO response = new WeatherWarningPageDTO();
        response.setPage(safePage);
        response.setPageSize(safePageSize);
        response.setTotal(result.getTotalElements());
        response.setTotalPages(result.getTotalPages());
        response.setItems(result.getContent().stream().map(this::toDto).toList());
        return response;
    }

    @Transactional(readOnly = true)
    public WeatherWarningDetailDTO getDetail(Long id) {
        return toDetail(weatherWarningRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Weather warning not found: " + id)));
    }

    @Transactional
    public WeatherWarningDetailDTO resolve(Long id) {
        WeatherWarning warning = weatherWarningRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Weather warning not found: " + id));
        if (warning.getStatus() == WeatherWarningStatus.ACTIVE) {
            warning.resolve();
            warning = weatherWarningRepository.save(warning);
            webSocketHandler.broadcast(WebSocketMessage.create("weather_warning_resolved", toDto(warning)));
        }
        return toDetail(warning);
    }

    @Transactional(readOnly = true)
    public WarningStatsDTO getStats() {
        WarningStatsDTO dto = new WarningStatsDTO();
        dto.setTotal(weatherWarningRepository.count());
        dto.setActive(weatherWarningRepository.countByStatus(WeatherWarningStatus.ACTIVE));
        dto.setResolved(weatherWarningRepository.countByStatus(WeatherWarningStatus.RESOLVED));
        dto.setInfo(weatherWarningRepository.countBySeverity(WeatherWarningSeverity.INFO));
        dto.setWarning(weatherWarningRepository.countBySeverity(WeatherWarningSeverity.WARNING));
        dto.setCritical(weatherWarningRepository.countBySeverity(WeatherWarningSeverity.CRITICAL));
        return dto;
    }

    private DetectionResult detect(ForecastSummaryDTO summary) {
        List<Trigger> triggers = new ArrayList<>();
        boolean hasCritical = false;

        if (atLeast(summary.getWindSpeedMax(), windCritical)) {
            triggers.add(new Trigger("wind", summary.getWindSpeedMax(), windCritical, "CRITICAL", "m/s"));
            hasCritical = true;
        } else if (atLeast(summary.getWindSpeedMax(), windWarning)) {
            triggers.add(new Trigger("wind", summary.getWindSpeedMax(), windWarning, "WARNING", "m/s"));
        }

        if (atLeast(summary.getWaveHeightMax(), waveCritical)) {
            triggers.add(new Trigger("wave", summary.getWaveHeightMax(), waveCritical, "CRITICAL", "m"));
            hasCritical = true;
        } else if (atLeast(summary.getWaveHeightMax(), waveWarning)) {
            triggers.add(new Trigger("wave", summary.getWaveHeightMax(), waveWarning, "WARNING", "m"));
        }

        if (atLeast(summary.getCurrentSpeedMax(), currentWarning)) {
            triggers.add(new Trigger(
                    "current",
                    summary.getCurrentSpeedMax(),
                    currentWarning,
                    "WARNING",
                    "m/s"
            ));
        }

        WeatherWarningSeverity severity = hasCritical || triggers.size() >= 2
                ? WeatherWarningSeverity.CRITICAL
                : WeatherWarningSeverity.WARNING;
        return new DetectionResult(severity, triggers);
    }

    private JsonNode buildSnapshot(ForecastSummaryDTO summary, ForecastRange range) {
        ObjectNode snapshot = objectMapper.createObjectNode();
        snapshot.set("summary", objectMapper.valueToTree(summary));
        if (range == ForecastRange.HOURS_12) {
            snapshot.set(
                    "series",
                    objectMapper.valueToTree(forecastDataService.getHourlyForecast(summary.getRegionId(), range))
            );
        } else {
            snapshot.set(
                    "series",
                    objectMapper.valueToTree(forecastDataService.getDailyForecast(summary.getRegionId(), range))
            );
        }
        return snapshot;
    }

    private ArrayNode toTriggerJson(List<Trigger> triggers) {
        ArrayNode array = objectMapper.createArrayNode();
        for (Trigger trigger : triggers) {
            ObjectNode node = array.addObject();
            node.put("type", trigger.type());
            node.put("value", trigger.value());
            node.put("threshold", trigger.threshold());
            node.put("level", trigger.level());
            node.put("unit", trigger.unit());
        }
        return array;
    }

    private String buildMessage(ForecastSummaryDTO summary, DetectionResult detection) {
        String conditions = detection.triggers().stream()
                .map(trigger -> "%s %s%s >= %s%s".formatted(
                        triggerLabel(trigger.type()),
                        trigger.value().stripTrailingZeros().toPlainString(),
                        trigger.unit(),
                        trigger.threshold().stripTrailingZeros().toPlainString(),
                        trigger.unit()
                ))
                .collect(Collectors.joining("; "));
        return "%s %s预测触发%s级气象预警：%s".formatted(
                summary.getRegionName(),
                summary.getRangeLabel(),
                detection.severity(),
                conditions
        );
    }

    private String buildWarningBulletin(ForecastSummaryDTO summary, DetectionResult detection) {
        String triggers = detection.triggers().stream()
                .map(trigger -> "- %s: %s%s，阈值 %s%s".formatted(
                        triggerLabel(trigger.type()),
                        trigger.value().stripTrailingZeros().toPlainString(),
                        trigger.unit(),
                        trigger.threshold().stripTrailingZeros().toPlainString(),
                        trigger.unit()
                ))
                .collect(Collectors.joining("\n"));
        return """
                ================== 深海采矿海洋气象预警报文 ==================
                区域名称: %s
                区域代码: %s
                预警时段: %s
                基准日期: %s
                运行周期: %s
                预警级别: %s

                一、触发条件
                %s

                二、影响评估
                风浪流条件可能影响采矿船定位、设备布放回收、管线稳定性及人员甲板作业安全。

                三、处置建议
                %s

                四、数据说明
                本预警由数据库中的最新风、浪、表层洋流预测数据自动检测生成。
                %s
                ============================================================
                """.formatted(
                summary.getRegionName(),
                summary.getRegionCode(),
                summary.getRangeLabel(),
                summary.getBaseDate(),
                summary.getRunCycle(),
                detection.severity(),
                triggers,
                detection.severity() == WeatherWarningSeverity.CRITICAL
                        ? "建议暂停高风险作业，人工确认现场条件并启动应急预案。"
                        : "建议加强值守，限制高风险作业并持续跟踪后续预报。",
                Boolean.TRUE.equals(summary.getDataComplete())
                        ? "当前时段数据完整。"
                        : "当前时段数据不完整，预警仅基于已入库预测数据。"
        );
    }

    private boolean atLeast(BigDecimal value, BigDecimal threshold) {
        return value != null && value.compareTo(threshold) >= 0;
    }

    private String triggerLabel(String type) {
        return switch (type) {
            case "wind" -> "最大风速";
            case "wave" -> "最大浪高";
            case "current" -> "最大流速";
            default -> type;
        };
    }

    private void broadcastWarning(WeatherWarningDTO warning) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("warningId", warning.getId());
        payload.put("warningCode", warning.getWarningCode());
        payload.put("regionId", warning.getRegionId());
        payload.put("regionName", warning.getRegionName());
        payload.put("range", warning.getTimeRange());
        payload.put("severity", warning.getSeverity());
        payload.put("triggerType", warning.getTriggerType());
        payload.put("message", warning.getWarningMessage());
        webSocketHandler.broadcast(WebSocketMessage.create("weather_warning", payload));
    }

    private WeatherWarningDTO toDto(WeatherWarning entity) {
        WeatherWarningDTO dto = new WeatherWarningDTO();
        populateBaseDto(dto, entity);
        return dto;
    }

    private WeatherWarningDetailDTO toDetail(WeatherWarning entity) {
        WeatherWarningDetailDTO dto = new WeatherWarningDetailDTO();
        populateBaseDto(dto, entity);
        dto.setBulletinText(entity.getBulletinText());
        dto.setForecastData(entity.getForecastData());
        return dto;
    }

    private void populateBaseDto(WeatherWarningDTO dto, WeatherWarning entity) {
        dto.setId(entity.getId());
        dto.setWarningCode("WRN-%08d".formatted(entity.getId()));
        dto.setRegionId(entity.getRegion().getId());
        dto.setRegionCode(entity.getRegion().getRegionCode());
        dto.setRegionName(entity.getRegion().getRegionName());
        dto.setTimeRange(entity.getTimeRange());
        dto.setBaseDate(entity.getBaseDate());
        dto.setRunCycle(entity.getRunCycle());
        dto.setSeverity(entity.getSeverity());
        dto.setTriggerType(entity.getTriggerType());
        dto.setTriggerDetail(entity.getTriggerDetail());
        dto.setWarningMessage(entity.getWarningMessage());
        dto.setStatus(entity.getStatus());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setResolvedAt(entity.getResolvedAt());
    }

    private record Trigger(
            String type,
            BigDecimal value,
            BigDecimal threshold,
            String level,
            String unit) {
    }

    private record DetectionResult(
            WeatherWarningSeverity severity,
            List<Trigger> triggers) {
    }
}
