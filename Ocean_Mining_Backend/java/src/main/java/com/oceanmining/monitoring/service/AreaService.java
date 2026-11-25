package com.oceanmining.monitoring.service;

import cn.hutool.json.JSONUtil;
import com.oceanmining.monitoring.dto.request.CreateAreaRequest;
import com.oceanmining.monitoring.dto.response.AreaDTO;
import com.oceanmining.monitoring.entity.MonitoringArea;
import com.oceanmining.monitoring.exception.BusinessException;
import com.oceanmining.monitoring.repository.AreaRepository;
import com.oceanmining.monitoring.util.GeometryUtil;
import com.oceanmining.monitoring.websocket.ShipMonitoringWebSocketHandler;
import com.oceanmining.monitoring.websocket.WebSocketMessage;
import org.locationtech.jts.geom.Polygon;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 区域管理服务
 */
@Service
public class AreaService {
    
    private static final Logger log = LoggerFactory.getLogger(AreaService.class);

    private final AreaRepository areaRepository;
    private final ShipXYApiService shipXYApiService;
    private final ShipMonitoringWebSocketHandler webSocketHandler;
    
    public AreaService(AreaRepository areaRepository, ShipXYApiService shipXYApiService,
                      ShipMonitoringWebSocketHandler webSocketHandler) {
        this.areaRepository = areaRepository;
        this.shipXYApiService = shipXYApiService;
        this.webSocketHandler = webSocketHandler;
    }

    /**
     * 创建监控区域
     */
    @Transactional
    public AreaDTO createArea(CreateAreaRequest request) {
        try {
            // 1. 调用船讯网API创建区域
            String areaId = shipXYApiService.addArea(request.getName(), request.getPolygon());

            // 2. 创建PostGIS几何对象
            Polygon polygon = GeometryUtil.createPolygon(request.getPolygon());

            // 3. 保存到数据库
            MonitoringArea area = new MonitoringArea();
            area.setAreaId(areaId);
            area.setName(request.getName());
            area.setPolygon(JSONUtil.toJsonStr(request.getPolygon())); // 转换为JSON字符串
            area.setGeometry(polygon);
            area.setThresholdWindSpeed(request.getThresholds().getWindSpeed());
            area.setThresholdWaveHeight(request.getThresholds().getWaveHeight());
            area.setIsActive(true);

            area = areaRepository.save(area);
            log.info("区域创建成功: {}", area.getName());

            // 4. 转换为DTO
            AreaDTO areaDTO = convertToDTO(area);

            // 5. 推送到前端
            webSocketHandler.broadcast(new WebSocketMessage("area_created", areaDTO, System.currentTimeMillis()));

            return areaDTO;

        } catch (Exception e) {
            log.error("创建区域失败", e);
            throw new BusinessException("创建区域失败: " + e.getMessage());
        }
    }

    /**
     * 获取区域列表
     */
    public List<AreaDTO> getAreas() {
        List<MonitoringArea> areas = areaRepository.findByIsActiveTrue();
        return areas.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * 删除区域
     */
    @Transactional
    public void deleteArea(Long id) {
        MonitoringArea area = areaRepository.findById(id)
                .orElseThrow(() -> new BusinessException("区域不存在"));

        try {
            // 1. 调用船讯网API删除区域
            shipXYApiService.deleteArea(area.getAreaId());

            // 2. 软删除数据库记录
            area.setIsActive(false);
            areaRepository.save(area);

            log.info("区域删除成功: {}", area.getName());

            // 3. 推送到前端
            Map<String, Object> payload = new HashMap<>();
            payload.put("id", id);
            
            webSocketHandler.broadcast(new WebSocketMessage("area_deleted", payload, System.currentTimeMillis()));

        } catch (Exception e) {
            log.error("删除区域失败", e);
            throw new BusinessException("删除区域失败: " + e.getMessage());
        }
    }

    /**
     * 转换为DTO
     */
    @SuppressWarnings("unchecked")
    private AreaDTO convertToDTO(MonitoringArea area) {
        AreaDTO dto = new AreaDTO();
        dto.setId(area.getId());
        dto.setAreaId(area.getAreaId());
        dto.setName(area.getName());
        
        // 解析JSON字符串为List<List<Double>>，处理整数到Double的转换
        Object parsedPolygon = JSONUtil.parse(area.getPolygon());
        List<List<Double>> polygonList;
        
        if (parsedPolygon instanceof List) {
            List<?> rawList = (List<?>) parsedPolygon;
            polygonList = rawList.stream()
                .map(item -> {
                    if (item instanceof List) {
                        List<?> coords = (List<?>) item;
                        return coords.stream()
                            .map(coord -> {
                                if (coord instanceof Number) {
                                    return ((Number) coord).doubleValue();
                                }
                                return 0.0;
                            })
                            .collect(java.util.stream.Collectors.toList());
                    }
                    return java.util.Collections.<Double>emptyList();
                })
                .collect(java.util.stream.Collectors.toList());
        } else {
            polygonList = java.util.Collections.emptyList();
        }
        
        dto.setPolygon(polygonList);
        
        AreaDTO.ThresholdsDTO thresholds = new AreaDTO.ThresholdsDTO();
        thresholds.setWindSpeed(area.getThresholdWindSpeed());
        thresholds.setWaveHeight(area.getThresholdWaveHeight());
        dto.setThresholds(thresholds);
        
        dto.setIsActive(area.getIsActive());
        dto.setCreatedAt(area.getCreatedAt());
        
        // 计算边界和面积
        GeometryUtil.Bounds bounds = GeometryUtil.calculateBounds(polygonList);
        AreaDTO.BoundsDTO boundsDTO = new AreaDTO.BoundsDTO();
        boundsDTO.setMinLng(String.format("%.4f", bounds.minLng));
        boundsDTO.setMaxLng(String.format("%.4f", bounds.maxLng));
        boundsDTO.setMinLat(String.format("%.4f", bounds.minLat));
        boundsDTO.setMaxLat(String.format("%.4f", bounds.maxLat));
        dto.setBounds(boundsDTO);
        
        double areaSize = GeometryUtil.calculateArea(polygonList);
        dto.setArea(String.format("%.2f", areaSize));
        
        // 统计信息（从关联表获取）
        dto.setShipCount(area.getShips() != null ? area.getShips().size() : 0);
        dto.setWarningCount(area.getWarnings() != null ? 
                (int) area.getWarnings().stream().filter(w -> !w.getIsResolved()).count() : 0);
        
        return dto;
    }
}
