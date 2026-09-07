package com.oceanmining.monitoring.service;

import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.oceanmining.monitoring.dto.response.EventDTO;
import com.oceanmining.monitoring.entity.EventLog;
import com.oceanmining.monitoring.entity.MonitoringArea;
import com.oceanmining.monitoring.entity.Warning;
import com.oceanmining.monitoring.enums.EventType;
import com.oceanmining.monitoring.repository.EventLogRepository;
import com.oceanmining.monitoring.repository.WarningRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

/**
 * 事件日志服务
 */
@Service
public class EventLogService {
    
    private static final Logger log = LoggerFactory.getLogger(EventLogService.class);

    private final EventLogRepository eventLogRepository;
    private final WarningRepository warningRepository;
    
    public EventLogService(EventLogRepository eventLogRepository, WarningRepository warningRepository) {
        this.eventLogRepository = eventLogRepository;
        this.warningRepository = warningRepository;
    }

    /**
     * 记录事件
     */
    @Transactional
    public void logEvent(MonitoringArea area, Long mmsi, EventType eventType, JSONObject eventData) {
        try {
            EventLog eventLog = new EventLog();
            eventLog.setArea(area);
            eventLog.setMmsi(mmsi);
            eventLog.setEventType(eventType.name().toLowerCase()); // 转换为字符串
            eventLog.setEventData(eventData.toString()); // 转换为JSON字符串

            eventLogRepository.save(eventLog);
            log.debug("事件已记录: type={}, mmsi={}", eventType, mmsi);

        } catch (Exception e) {
            log.error("记录事件失败", e);
        }
    }

    /**
     * 获取区域事件日志
     */
    public List<EventDTO> getAreaEvents(Long areaId, int limit) {
        // 获取事件日志
        List<EventLog> eventLogs = eventLogRepository.findByArea_IdOrderByCreatedAtDesc(
                areaId, PageRequest.of(0, limit)
        );

        // 获取预警记录
        List<Warning> warnings = warningRepository.findByArea_IdOrderByCreatedAtDesc(
                areaId, PageRequest.of(0, limit)
        );

        // 合并并排序
        List<EventDTO> events = new ArrayList<>();

        // 添加事件日志
        for (EventLog log : eventLogs) {
            EventDTO dto = new EventDTO();
            dto.setId("event_" + log.getId());
            dto.setType(log.getEventType());
            dto.setMmsi(log.getMmsi());
            // 解析JSON字符串为Map
            dto.setData(JSONUtil.toBean(log.getEventData(), Map.class));
            dto.setTime(log.getCreatedAt());
            dto.setCategory("event");
            events.add(dto);
        }

        // 添加预警记录
        for (Warning warning : warnings) {
            EventDTO dto = new EventDTO();
            dto.setId("warning_" + warning.getId());
            dto.setType("warning");
            dto.setMmsi(warning.getMmsi());
            dto.setWarningType(warning.getWarningType());
            dto.setSeverity(warning.getSeverity().name().toLowerCase());
            dto.setMessage(warning.getMessage());
            // 解析JSON字符串为Map
            dto.setWeatherData(JSONUtil.toBean(warning.getWeatherData(), Map.class));
            dto.setTime(warning.getCreatedAt());
            dto.setIsResolved(warning.getIsResolved());
            dto.setResolvedAt(warning.getResolvedAt());
            dto.setCategory("warning");
            events.add(dto);
        }

        // 按时间倒序排序
        events.sort(Comparator.comparing(EventDTO::getTime).reversed());

        // 限制返回数量
        return events.stream().limit(limit).toList();
    }
}
