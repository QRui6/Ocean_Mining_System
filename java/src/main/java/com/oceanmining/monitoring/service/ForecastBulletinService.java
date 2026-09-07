package com.oceanmining.monitoring.service;

import com.oceanmining.monitoring.dto.response.ForecastBulletinDTO;
import com.oceanmining.monitoring.dto.response.ForecastSummaryDTO;
import com.oceanmining.monitoring.entity.ForecastBulletin;
import com.oceanmining.monitoring.entity.MiningRegion;
import com.oceanmining.monitoring.enums.ForecastRange;
import com.oceanmining.monitoring.exception.ResourceNotFoundException;
import com.oceanmining.monitoring.repository.ForecastBulletinRepository;
import com.oceanmining.monitoring.repository.MiningRegionRepository;
import com.oceanmining.monitoring.websocket.ShipMonitoringWebSocketHandler;
import com.oceanmining.monitoring.websocket.WebSocketMessage;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
public class ForecastBulletinService {

    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final ForecastDataService forecastDataService;
    private final ForecastBulletinRepository forecastBulletinRepository;
    private final MiningRegionRepository miningRegionRepository;
    private final ShipMonitoringWebSocketHandler webSocketHandler;

    public ForecastBulletinService(
            ForecastDataService forecastDataService,
            ForecastBulletinRepository forecastBulletinRepository,
            MiningRegionRepository miningRegionRepository,
            ShipMonitoringWebSocketHandler webSocketHandler) {
        this.forecastDataService = forecastDataService;
        this.forecastBulletinRepository = forecastBulletinRepository;
        this.miningRegionRepository = miningRegionRepository;
        this.webSocketHandler = webSocketHandler;
    }

    @Transactional
    public ForecastBulletinDTO getOrCreate(Long regionId, ForecastRange range) {
        ForecastSummaryDTO summary = forecastDataService.getSummary(regionId, range);
        ForecastBulletin entity = forecastBulletinRepository
                .findByRegion_IdAndTimeRangeAndBaseDateAndRunCycle(
                        regionId,
                        range.getCode(),
                        summary.getBaseDate(),
                        summary.getRunCycle()
                )
                .orElseGet(() -> saveNew(summary, range));
        return toDto(entity);
    }

    @Transactional
    public ForecastBulletinDTO generateOrRefresh(Long regionId, ForecastRange range, boolean notifyWhenCreated) {
        ForecastSummaryDTO summary = forecastDataService.getSummary(regionId, range);
        ForecastBulletin existing = forecastBulletinRepository
                .findByRegion_IdAndTimeRangeAndBaseDateAndRunCycle(
                        regionId,
                        range.getCode(),
                        summary.getBaseDate(),
                        summary.getRunCycle()
                )
                .orElse(null);
        boolean created = existing == null;
        ForecastBulletin entity = created ? new ForecastBulletin() : existing;
        populate(entity, summary, range);
        entity = forecastBulletinRepository.save(entity);
        if (created && notifyWhenCreated) {
            broadcastBulletinReady(entity);
        }
        return toDto(entity);
    }

    private ForecastBulletin saveNew(ForecastSummaryDTO summary, ForecastRange range) {
        ForecastBulletin entity = new ForecastBulletin();
        populate(entity, summary, range);
        return forecastBulletinRepository.save(entity);
    }

    private void populate(ForecastBulletin entity, ForecastSummaryDTO summary, ForecastRange range) {
        MiningRegion region = miningRegionRepository.findById(summary.getRegionId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Mining region not found: " + summary.getRegionId()));
        entity.setRegion(region);
        entity.setTimeRange(range.getCode());
        entity.setBaseDate(summary.getBaseDate());
        entity.setRunCycle(summary.getRunCycle());
        entity.setBulletinText(buildBulletin(summary));
        entity.setWindAvg(summary.getWindSpeedAvg());
        entity.setWindMax(summary.getWindSpeedMax());
        entity.setWaveAvg(summary.getWaveHeightAvg());
        entity.setWaveMax(summary.getWaveHeightMax());
        entity.setCurrentAvg(summary.getCurrentSpeedAvg());
        entity.setCurrentMax(summary.getCurrentSpeedMax());
        entity.setRiskLevel(summary.getRiskLevel());
        entity.setDataComplete(summary.getDataComplete());
    }

    public String buildBulletin(ForecastSummaryDTO summary) {
        String completeness = Boolean.TRUE.equals(summary.getDataComplete())
                ? "完整"
                : "不完整（仅基于当前批次已入库的数据）";
        return """
                ================== 深海采矿海洋气象预报报文 ==================
                区域名称: %s
                区域代码: %s
                预报时段: %s
                基准日期: %s
                运行周期: %s
                数据时间: %s 至 %s
                数据完整性: %s

                一、风场预报
                平均风速: %s m/s
                最大风速: %s m/s
                最大阵风: %s m/s
                变化趋势: %s

                二、海浪预报
                平均浪高: %s m
                最大浪高: %s m
                平均周期: %s s
                变化趋势: %s

                三、表层洋流预报
                平均流速: %s m/s
                最大流速: %s m/s
                变化趋势: %s

                四、综合风险
                风险等级: %s

                五、作业建议
                %s
                ============================================================
                """.formatted(
                summary.getRegionName(),
                summary.getRegionCode(),
                summary.getRangeLabel(),
                summary.getBaseDate(),
                summary.getRunCycle(),
                TIME_FORMAT.format(summary.getPeriodStart()),
                TIME_FORMAT.format(summary.getPeriodEnd()),
                completeness,
                value(summary.getWindSpeedAvg()),
                value(summary.getWindSpeedMax()),
                value(summary.getGustMax()),
                summary.getWindTrend(),
                value(summary.getWaveHeightAvg()),
                value(summary.getWaveHeightMax()),
                value(summary.getWavePeriodAvg()),
                summary.getWaveTrend(),
                value(summary.getCurrentSpeedAvg()),
                value(summary.getCurrentSpeedMax()),
                summary.getCurrentTrend(),
                summary.getRiskLevel(),
                advice(summary.getRiskLevel())
        );
    }

    private String advice(String riskLevel) {
        return switch (riskLevel) {
            case "CRITICAL" -> "建议暂停高风险海上作业，检查船舶、管线和应急保障状态。";
            case "HIGH" -> "建议限制高风险作业并持续跟踪后续预报。";
            case "MODERATE" -> "建议加强值守，关注风浪流变化。";
            default -> "海况总体平稳，可按常规安全规程组织作业。";
        };
    }

    private String value(BigDecimal value) {
        return value == null ? "暂无数据" : value.stripTrailingZeros().toPlainString();
    }

    private void broadcastBulletinReady(ForecastBulletin bulletin) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("bulletinId", bulletin.getId());
        payload.put("regionId", bulletin.getRegion().getId());
        payload.put("range", bulletin.getTimeRange());
        payload.put("baseDate", bulletin.getBaseDate());
        webSocketHandler.broadcast(WebSocketMessage.create("bulletin_ready", payload));
    }

    public ForecastBulletinDTO toDto(ForecastBulletin entity) {
        ForecastBulletinDTO dto = new ForecastBulletinDTO();
        dto.setId(entity.getId());
        dto.setRegionId(entity.getRegion().getId());
        dto.setRegionCode(entity.getRegion().getRegionCode());
        dto.setRegionName(entity.getRegion().getRegionName());
        dto.setTimeRange(entity.getTimeRange());
        dto.setBaseDate(entity.getBaseDate());
        dto.setRunCycle(entity.getRunCycle());
        dto.setRiskLevel(entity.getRiskLevel());
        dto.setDataComplete(entity.getDataComplete());
        dto.setBulletinText(entity.getBulletinText());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
}
