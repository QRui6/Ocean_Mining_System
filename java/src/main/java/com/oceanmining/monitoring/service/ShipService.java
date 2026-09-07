package com.oceanmining.monitoring.service;

import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.oceanmining.monitoring.dto.response.ShipDTO;
import com.oceanmining.monitoring.entity.AreaShip;
import com.oceanmining.monitoring.entity.MonitoringArea;
import com.oceanmining.monitoring.enums.ShipStatus;
import com.oceanmining.monitoring.repository.AreaRepository;
import com.oceanmining.monitoring.repository.ShipRepository;
import com.oceanmining.monitoring.util.GeometryUtil;
import com.oceanmining.monitoring.websocket.ShipMonitoringWebSocketHandler;
import com.oceanmining.monitoring.websocket.WebSocketMessage;
import org.locationtech.jts.geom.Point;
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
 * 船舶管理服务
 */
@Service
public class ShipService {
    
    private static final Logger log = LoggerFactory.getLogger(ShipService.class);

    private final ShipRepository shipRepository;
    private final AreaRepository areaRepository;
    private final ShipXYApiService shipXYApiService;
    private final RiskAssessmentService riskAssessmentService;
    private final WarningService warningService;
    private final ShipMonitoringWebSocketHandler webSocketHandler;
    
    public ShipService(ShipRepository shipRepository, AreaRepository areaRepository, 
                      ShipXYApiService shipXYApiService, RiskAssessmentService riskAssessmentService,
                      WarningService warningService, ShipMonitoringWebSocketHandler webSocketHandler) {
        this.shipRepository = shipRepository;
        this.areaRepository = areaRepository;
        this.shipXYApiService = shipXYApiService;
        this.riskAssessmentService = riskAssessmentService;
        this.warningService = warningService;
        this.webSocketHandler = webSocketHandler;
    }

    /**
     * 处理船舶进入事件
     */
    @Transactional
    public void handleShipEnter(MonitoringArea area, Long mmsi, String shipName, 
                                double lat, double lng, Long timestamp) {
        log.info("船舶进入区域 [{}]: MMSI={}, 船名={}", area.getName(), mmsi, shipName);

        try {
            // 1. 获取完整船舶信息
            JSONObject shipInfo = shipXYApiService.getShipInfo(String.valueOf(mmsi));

            // 2. 获取位置气象
            JSONObject weather = shipXYApiService.getWeatherByPoint(lat, lng);

            // 3. 风险评估
            RiskAssessmentService.RiskAssessment risk = riskAssessmentService.assessRisk(area, weather);

            // 4. 保存到数据库
            Point point = GeometryUtil.createPoint(lng, lat);
            JSONObject position = new JSONObject();
            position.set("lat", lat);
            position.set("lng", lng);

            AreaShip ship = shipRepository.findByArea_IdAndMmsiAndStatus(
                    area.getId(), mmsi, ShipStatus.IN_AREA
            ).orElse(new AreaShip());

            ship.setArea(area);
            ship.setMmsi(mmsi);
            ship.setShipName(shipInfo.getStr("ship_cnname", shipInfo.getStr("ship_name", shipName)));
            ship.setEnterTime(LocalDateTime.now());
            ship.setStatus(risk.isWarning() ? ShipStatus.WARNING : ShipStatus.IN_AREA);
            ship.setLastPosition(position.toString()); // 转换为JSON字符串
            ship.setLastPoint(point);
            ship.setLastWeather(weather.toString()); // 转换为JSON字符串
            ship.setRiskLevel(risk.getLevel());

            shipRepository.save(ship);

            // 5. 如果有风险，创建预警
            if (risk.isWarning()) {
                warningService.createWarning(area, mmsi, risk, weather);
            }

            // 6. 推送到前端
            Map<String, Object> payload = new HashMap<>();
            payload.put("areaId", area.getId());
            payload.put("areaName", area.getName());
            payload.put("ship", shipInfo);
            payload.put("weather", weather);
            payload.put("risk", risk);

            webSocketHandler.broadcast(new WebSocketMessage("ship_enter", payload, System.currentTimeMillis()));

            log.info("船舶进入事件处理完成");

        } catch (Exception e) {
            log.error("处理船舶进入事件失败", e);
        }
    }

    /**
     * 处理船舶离开事件
     */
    @Transactional
    public void handleShipLeave(MonitoringArea area, Long mmsi, Long timestamp) {
        log.info("船舶离开区域 [{}]: MMSI={}", area.getName(), mmsi);

        try {
            // 1. 更新数据库
            List<AreaShip> ships = shipRepository.findByArea_IdAndStatusIn(
                    area.getId(), List.of(ShipStatus.IN_AREA, ShipStatus.WARNING)
            ).stream()
             .filter(s -> s.getMmsi().equals(mmsi))
             .toList();

            for (AreaShip ship : ships) {
                ship.setLeaveTime(LocalDateTime.now());
                ship.setStatus(ShipStatus.LEFT);
                shipRepository.save(ship);
            }

            // 2. 解决未关闭的预警
            warningService.resolveWarnings(area.getId(), mmsi);

            // 3. 推送到前端
            Map<String, Object> payload = new HashMap<>();
            payload.put("areaId", area.getId());
            payload.put("mmsi", mmsi);

            webSocketHandler.broadcast(new WebSocketMessage("ship_leave", payload, System.currentTimeMillis()));

            log.info("船舶离开事件处理完成");

        } catch (Exception e) {
            log.error("处理船舶离开事件失败", e);
        }
    }

    /**
     * 获取区域内船舶列表
     */
    public List<ShipDTO> getShipsByArea(Long areaId) {
        List<AreaShip> ships = shipRepository.findByArea_IdAndStatusIn(
                areaId, List.of(ShipStatus.IN_AREA, ShipStatus.WARNING)
        );

        return ships.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * 更新船舶状态（定时任务调用）
     */
    @Transactional
    public void updateShipStatus(AreaShip ship) {
        try {
            JSONObject position = JSONUtil.parseObj(ship.getLastPosition());
            double lat = position.getDouble("lat", 0.0);
            double lng = position.getDouble("lng", 0.0);

            // 获取最新船舶信息
            JSONObject shipInfo = shipXYApiService.getShipInfo(String.valueOf(ship.getMmsi()));

            // 获取最新气象
            JSONObject weather = shipXYApiService.getWeatherByPoint(lat, lng);

            // 重新评估风险
            RiskAssessmentService.RiskAssessment risk = riskAssessmentService.assessRisk(
                    ship.getArea(), weather
            );

            // 更新数据库
            Point point = GeometryUtil.createPoint(
                    shipInfo.getDouble("lng", lng),
                    shipInfo.getDouble("lat", lat)
            );
            
            JSONObject newPosition = new JSONObject();
            newPosition.set("lat", shipInfo.getDouble("lat", lat));
            newPosition.set("lng", shipInfo.getDouble("lng", lng));

            ship.setLastPosition(newPosition.toString());
            ship.setLastPoint(point);
            ship.setLastWeather(weather.toString());
            ship.setRiskLevel(risk.getLevel());
            ship.setStatus(risk.isWarning() ? ShipStatus.WARNING : ShipStatus.IN_AREA);

            shipRepository.save(ship);

            // 如果有新的预警，创建预警记录
            if (risk.isWarning()) {
                warningService.createWarningIfNotExists(ship.getArea(), ship.getMmsi(), risk, weather);
            }

            // 推送更新到前端
            Map<String, Object> payload = new HashMap<>();
            payload.put("areaId", ship.getArea().getId());
            payload.put("areaName", ship.getArea().getName());
            payload.put("ship", shipInfo);
            payload.put("weather", weather);
            payload.put("risk", risk);

            webSocketHandler.broadcast(new WebSocketMessage("ship_update", payload, System.currentTimeMillis()));

        } catch (Exception e) {
            log.error("更新船舶状态失败: {}", ship.getMmsi(), e);
        }
    }

    /**
     * 转换为DTO
     */
    private ShipDTO convertToDTO(AreaShip ship) {
        ShipDTO dto = new ShipDTO();
        dto.setMmsi(ship.getMmsi());
        dto.setShipName(ship.getShipName());
        dto.setEnterTime(ship.getEnterTime());
        dto.setLeaveTime(ship.getLeaveTime());
        dto.setStatus(ship.getStatus());
        dto.setRiskLevel(ship.getRiskLevel());

        // 解析位置JSON
        if (ship.getLastPosition() != null) {
            JSONObject posJson = JSONUtil.parseObj(ship.getLastPosition());
            ShipDTO.PositionDTO position = new ShipDTO.PositionDTO();
            position.setLat(posJson.getDouble("lat"));
            position.setLng(posJson.getDouble("lng"));
            dto.setLastPosition(position);
        }

        // 转换气象数据
        if (ship.getLastWeather() != null) {
            JSONObject weatherJson = JSONUtil.parseObj(ship.getLastWeather());
            ShipDTO.WeatherDTO weather = new ShipDTO.WeatherDTO();
            weather.setWindSpeed(weatherJson.getDouble("windspeed"));
            weather.setWaveHeight(weatherJson.getDouble("waveheight"));
            weather.setTemperature(weatherJson.getDouble("temperature"));
            weather.setWindDir(weatherJson.getStr("winddir"));
            weather.setHumidity(weatherJson.getDouble("humidity"));
            weather.setPressure(weatherJson.getDouble("pressure"));
            weather.setVisibility(weatherJson.getDouble("visibility"));
            weather.setPublishTime(weatherJson.getStr("publish_time"));
            dto.setLastWeather(weather);
        }

        return dto;
    }
}
