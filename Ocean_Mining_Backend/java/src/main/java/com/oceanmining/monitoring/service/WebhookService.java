package com.oceanmining.monitoring.service;

import cn.hutool.json.JSONObject;
import com.oceanmining.monitoring.dto.request.WebhookRequest;
import com.oceanmining.monitoring.entity.MonitoringArea;
import com.oceanmining.monitoring.enums.EventType;
import com.oceanmining.monitoring.repository.AreaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Webhook处理服务
 */
@Service
public class WebhookService {
    
    private static final Logger log = LoggerFactory.getLogger(WebhookService.class);

    private final AreaRepository areaRepository;
    private final ShipService shipService;
    private final EventLogService eventLogService;
    
    public WebhookService(AreaRepository areaRepository, ShipService shipService, EventLogService eventLogService) {
        this.areaRepository = areaRepository;
        this.shipService = shipService;
        this.eventLogService = eventLogService;
    }

    /**
     * 处理Webhook推送
     */
    public void handleWebhook(WebhookRequest request) {
        log.info("收到Webhook推送: {}", request);

        try {
            // 查询数据库中的区域
            MonitoringArea area = areaRepository.findByAreaId(request.getAreaId())
                    .orElseThrow(() -> new RuntimeException("未找到对应区域: " + request.getAreaId()));

            log.info("找到区域: {} (ID: {})", area.getName(), area.getId());

            // MMSI已经是Long类型
            Long mmsi = request.getMmsi();

            // 船讯网 event_type: 1=进入, 2=离开
            if (Integer.valueOf(1).equals(request.getEventType()) || "enter".equals(String.valueOf(request.getEventType()))) {
                log.info("处理船舶进入事件: MMSI={}, 船名={}", request.getMmsi(), request.getShipName());
                
                shipService.handleShipEnter(
                        area,
                        mmsi,
                        request.getShipName(),
                        request.getLat() != null ? request.getLat() : 0.0,
                        request.getLng() != null ? request.getLng() : 0.0,
                        request.getEventTimeUtc()
                );

                // 记录事件日志
                JSONObject eventData = new JSONObject();
                eventData.set("mmsi", mmsi);
                eventData.set("shipName", request.getShipName());
                eventData.set("lat", request.getLat());
                eventData.set("lng", request.getLng());
                eventData.set("timestamp", request.getEventTimeUtc());
                
                eventLogService.logEvent(area, mmsi, EventType.ENTER, eventData);

            } else if (Integer.valueOf(2).equals(request.getEventType()) || "leave".equals(String.valueOf(request.getEventType()))) {
                log.info("处理船舶离开事件: MMSI={}, 船名={}", request.getMmsi(), request.getShipName());
                
                shipService.handleShipLeave(
                        area,
                        mmsi,
                        request.getEventTimeUtc()
                );

                // 记录事件日志
                JSONObject eventData = new JSONObject();
                eventData.set("mmsi", mmsi);
                eventData.set("timestamp", request.getEventTimeUtc());
                
                eventLogService.logEvent(area, mmsi, EventType.LEAVE, eventData);

            } else {
                log.warn("未知的事件类型: {}", request.getEventType());
            }

        } catch (Exception e) {
            log.error("Webhook处理失败", e);
            throw new RuntimeException("Webhook处理失败: " + e.getMessage());
        }
    }
}
