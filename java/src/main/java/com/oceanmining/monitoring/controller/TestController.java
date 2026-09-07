package com.oceanmining.monitoring.controller;

import cn.hutool.json.JSONUtil;
import com.oceanmining.monitoring.dto.response.ApiResponse;
import com.oceanmining.monitoring.entity.AreaShip;
import com.oceanmining.monitoring.entity.MonitoringArea;
import com.oceanmining.monitoring.enums.ShipStatus;
import com.oceanmining.monitoring.repository.AreaRepository;
import com.oceanmining.monitoring.repository.ShipRepository;
import com.oceanmining.monitoring.service.ShipService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 测试接口控制器
 */
@RestController
@RequestMapping("/api/test")
public class TestController {

    private static final Logger log = LoggerFactory.getLogger(TestController.class);
    private final AreaRepository areaRepository;
    private final ShipRepository shipRepository;
    private final ShipService shipService;

    @Autowired
    public TestController(AreaRepository areaRepository, ShipRepository shipRepository, ShipService shipService) {
        this.areaRepository = areaRepository;
        this.shipRepository = shipRepository;
        this.shipService = shipService;
    }

    /**
     * 模拟船舶进入事件
     */
    @PostMapping("/ship-enter")
    public ApiResponse<Map<String, Object>> testShipEnter(@RequestBody TestShipEnterRequest request) {
        log.info("测试：模拟船舶进入事件");
        log.info("参数: areaId={}, mmsi={}, shipName={}", request.getAreaId(), request.getMmsi(), request.getShipName());

        // 查询区域
        MonitoringArea area = areaRepository.findById(request.getAreaId())
                .or(() -> areaRepository.findByAreaId(String.valueOf(request.getAreaId())))
                .orElseThrow(() -> new RuntimeException("区域不存在"));

        // 解析polygon JSON字符串
        @SuppressWarnings("unchecked")
        List<List<Double>> polygon = (List<List<Double>>) JSONUtil.parse(area.getPolygon());
        double defaultLat = polygon != null && !polygon.isEmpty() ? polygon.get(0).get(1) : 0.0;
        double defaultLng = polygon != null && !polygon.isEmpty() ? polygon.get(0).get(0) : 0.0;

        double lat = request.getLat() != null ? request.getLat() : defaultLat;
        double lng = request.getLng() != null ? request.getLng() : defaultLng;

        // 模拟船舶进入
        Long mmsi = request.getMmsi() != null ? request.getMmsi() : 413961925L;
        shipService.handleShipEnter(
                area,
                mmsi,
                request.getShipName() != null ? request.getShipName() : "测试船舶",
                lat,
                lng,
                System.currentTimeMillis()
        );

        Map<String, Object> result = new HashMap<>();
        result.put("message", "✅ 测试事件已触发");
        result.put("area", area.getName());
        result.put("mmsi", mmsi);
        result.put("position", Map.of("lat", lat, "lng", lng));

        return ApiResponse.success(result);
    }

    /**
     * 模拟船舶离开事件
     */
    @PostMapping("/ship-leave")
    public ApiResponse<Map<String, Object>> testShipLeave(@RequestBody TestShipLeaveRequest request) {
        log.info("测试：模拟船舶离开事件");
        log.info("参数: areaId={}, mmsi={}", request.getAreaId(), request.getMmsi());

        // 查询区域
        MonitoringArea area = areaRepository.findById(request.getAreaId())
                .or(() -> areaRepository.findByAreaId(String.valueOf(request.getAreaId())))
                .orElseThrow(() -> new RuntimeException("区域不存在"));

        // 模拟船舶离开
        Long mmsi = request.getMmsi() != null ? request.getMmsi() : 413961925L;
        shipService.handleShipLeave(
                area,
                mmsi,
                System.currentTimeMillis()
        );

        Map<String, Object> result = new HashMap<>();
        result.put("message", "✅ 测试离开事件已触发");
        result.put("area", area.getName());
        result.put("mmsi", mmsi);

        return ApiResponse.success(result);
    }

    /**
     * 查看所有区域和船舶
     */
    @GetMapping("/status")
    public ApiResponse<Map<String, Object>> getStatus() {
        List<MonitoringArea> areas = areaRepository.findByIsActiveTrue();
        List<AreaShip> ships = shipRepository.findByStatusIn(
                List.of(ShipStatus.IN_AREA, ShipStatus.WARNING)
        );

        Map<String, Object> result = new HashMap<>();
        result.put("areas", areas);
        result.put("ships", ships);
        result.put("summary", Map.of(
                "totalAreas", areas.size(),
                "totalShips", ships.size()
        ));

        return ApiResponse.success(result);
    }

    public static class TestShipEnterRequest {
        private Long areaId;
        private Long mmsi;
        private String shipName;
        private Double lat;
        private Double lng;

        public Long getAreaId() { return areaId; }
        public void setAreaId(Long areaId) { this.areaId = areaId; }
        public Long getMmsi() { return mmsi; }
        public void setMmsi(Long mmsi) { this.mmsi = mmsi; }
        public String getShipName() { return shipName; }
        public void setShipName(String shipName) { this.shipName = shipName; }
        public Double getLat() { return lat; }
        public void setLat(Double lat) { this.lat = lat; }
        public Double getLng() { return lng; }
        public void setLng(Double lng) { this.lng = lng; }
    }

    public static class TestShipLeaveRequest {
        private Long areaId;
        private Long mmsi;

        public Long getAreaId() { return areaId; }
        public void setAreaId(Long areaId) { this.areaId = areaId; }
        public Long getMmsi() { return mmsi; }
        public void setMmsi(Long mmsi) { this.mmsi = mmsi; }
    }
}
