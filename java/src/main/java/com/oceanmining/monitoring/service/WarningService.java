package com.oceanmining.monitoring.service;

import cn.hutool.json.JSONObject;
import com.oceanmining.monitoring.entity.MonitoringArea;
import com.oceanmining.monitoring.entity.Warning;
import com.oceanmining.monitoring.enums.WarningSeverity;
import com.oceanmining.monitoring.repository.WarningRepository;
import com.oceanmining.monitoring.websocket.ShipMonitoringWebSocketHandler;
import com.oceanmining.monitoring.websocket.WebSocketMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 预警管理服务
 */
@Service
public class WarningService {
    
    private static final Logger log = LoggerFactory.getLogger(WarningService.class);

    private final WarningRepository warningRepository;
    private final ShipMonitoringWebSocketHandler webSocketHandler;
    
    public WarningService(WarningRepository warningRepository, ShipMonitoringWebSocketHandler webSocketHandler) {
        this.warningRepository = warningRepository;
        this.webSocketHandler = webSocketHandler;
    }

    /**
     * 创建预警
     */
    @Transactional
    public void createWarning(MonitoringArea area, Long mmsi, 
                             RiskAssessmentService.RiskAssessment risk, JSONObject weather) {
        try {
            // 1. 生成预警消息
            String message = risk.getRisks().stream()
                    .map(r -> {
                        if ("wind".equals(r.getType())) {
                            return String.format("风速 %sm/s 超过阈值 %sm/s", 
                                    r.getValue(), r.getThreshold());
                        } else if ("wave".equals(r.getType())) {
                            return String.format("浪高 %sm 超过阈值 %sm", 
                                    r.getValue(), r.getThreshold());
                        }
                        return "";
                    })
                    .collect(Collectors.joining("; "));

            // 2. 保存预警到数据库
            Warning warning = new Warning();
            warning.setArea(area);
            warning.setMmsi(mmsi);
            warning.setWarningType(risk.getRisks().stream()
                    .map(RiskAssessmentService.RiskItem::getType)
                    .collect(Collectors.joining(",")));
            warning.setSeverity(convertToSeverity(risk.getLevel()));
            warning.setMessage(message);
            warning.setWeatherData(weather.toString()); // 转换为JSON字符串
            warning.setIsResolved(false);

            warning = warningRepository.save(warning);

            log.info("预警已创建 [ID: {}] 区域: {}, MMSI: {}, 消息: {}", 
                    warning.getId(), area.getName(), mmsi, message);

            // 3. 推送预警到前端
            Map<String, Object> payload = new HashMap<>();
            payload.put("areaId", area.getId());
            payload.put("areaName", area.getName());
            payload.put("mmsi", mmsi);
            payload.put("message", message);
            payload.put("severity", risk.getLevel().name().toLowerCase());

            webSocketHandler.broadcast(new WebSocketMessage("warning", payload, System.currentTimeMillis()));

        } catch (Exception e) {
            log.error("创建预警失败", e);
        }
    }

    /**
     * 创建预警（如果1小时内没有相同预警）
     */
    @Transactional
    public void createWarningIfNotExists(MonitoringArea area, Long mmsi,
                                        RiskAssessmentService.RiskAssessment risk, JSONObject weather) {
        // 检查是否已经有未解决的相同类型预警（1小时内）
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        List<Warning> existingWarnings = warningRepository
                .findByArea_IdAndMmsiAndIsResolvedFalseAndCreatedAtAfter(
                        area.getId(), mmsi, oneHourAgo
                );

        if (existingWarnings.isEmpty()) {
            createWarning(area, mmsi, risk, weather);
        }
    }

    /**
     * 解决预警
     */
    @Transactional
    public void resolveWarnings(Long areaId, Long mmsi) {
        List<Warning> warnings = warningRepository.findByArea_IdAndMmsiAndIsResolvedFalse(areaId, mmsi);
        
        for (Warning warning : warnings) {
            warning.resolve(); // 使用实体类的resolve方法
            warningRepository.save(warning);
        }

        log.info("已解决 {} 条预警: areaId={}, mmsi={}", warnings.size(), areaId, mmsi);
    }

    /**
     * 转换风险等级为预警严重程度
     */
    private WarningSeverity convertToSeverity(com.oceanmining.monitoring.enums.RiskLevel riskLevel) {
        return switch (riskLevel) {
            case HIGH -> WarningSeverity.HIGH;
            case MEDIUM -> WarningSeverity.MEDIUM;
            case SAFE -> WarningSeverity.LOW;
            default -> WarningSeverity.LOW;
        };
    }
}
