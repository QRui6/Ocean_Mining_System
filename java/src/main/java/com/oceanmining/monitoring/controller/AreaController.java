package com.oceanmining.monitoring.controller;

import com.oceanmining.monitoring.dto.request.CreateAreaRequest;
import com.oceanmining.monitoring.dto.response.ApiResponse;
import com.oceanmining.monitoring.dto.response.AreaDTO;
import com.oceanmining.monitoring.dto.response.EventDTO;
import com.oceanmining.monitoring.dto.response.ShipDTO;
import com.oceanmining.monitoring.service.AreaService;
import com.oceanmining.monitoring.service.EventLogService;
import com.oceanmining.monitoring.service.ShipService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 区域管理控制器
 */
@RestController
@RequestMapping("/api/areas")
public class AreaController {

    private static final Logger log = LoggerFactory.getLogger(AreaController.class);
    private final AreaService areaService;
    private final ShipService shipService;
    private final EventLogService eventLogService;

    @Autowired
    public AreaController(AreaService areaService, ShipService shipService, EventLogService eventLogService) {
        this.areaService = areaService;
        this.shipService = shipService;
        this.eventLogService = eventLogService;
    }

    /**
     * 创建监控区域
     */
    @PostMapping
    public ApiResponse<AreaDTO> createArea(@Validated @RequestBody CreateAreaRequest request) {
        log.info("创建区域请求: {}", request.getName());
        AreaDTO area = areaService.createArea(request);
        return ApiResponse.success(area);
    }

    /**
     * 获取区域列表
     */
    @GetMapping
    public ApiResponse<List<AreaDTO>> getAreas() {
        List<AreaDTO> areas = areaService.getAreas();
        return ApiResponse.success(areas);
    }

    /**
     * 删除区域
     */
    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteArea(@PathVariable Long id) {
        log.info("删除区域请求: {}", id);
        areaService.deleteArea(id);
        return ApiResponse.success("区域已删除");
    }

    /**
     * 获取区域内船舶
     */
    @GetMapping("/{id}/ships")
    public ApiResponse<List<ShipDTO>> getAreaShips(@PathVariable Long id) {
        List<ShipDTO> ships = shipService.getShipsByArea(id);
        return ApiResponse.success(ships);
    }

    /**
     * 获取区域事件日志
     */
    @GetMapping("/{id}/events")
    public ApiResponse<List<EventDTO>> getAreaEvents(
            @PathVariable Long id,
            @RequestParam(defaultValue = "50") int limit) {
        List<EventDTO> events = eventLogService.getAreaEvents(id, limit);
        return ApiResponse.success(events);
    }
}
