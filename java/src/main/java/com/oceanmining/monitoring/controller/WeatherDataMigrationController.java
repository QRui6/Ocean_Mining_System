package com.oceanmining.monitoring.controller;

import com.oceanmining.monitoring.dto.response.ApiResponse;
import com.oceanmining.monitoring.service.WeatherDataMigrationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 气象数据迁移控制器
 * 提供手动触发数据迁移的REST端点
 */
@RestController
@RequestMapping("/api/migration")
@CrossOrigin(origins = "*")
public class WeatherDataMigrationController {

    private static final Logger log = LoggerFactory.getLogger(WeatherDataMigrationController.class);
    private final WeatherDataMigrationService migrationService;

    @Autowired
    public WeatherDataMigrationController(WeatherDataMigrationService migrationService) {
        this.migrationService = migrationService;
    }

    /**
     * 迁移所有气象数据
     * POST /api/migration/all
     */
    @PostMapping("/all")
    public ResponseEntity<ApiResponse<String>> migrateAllData() {
        log.info("收到迁移所有气象数据的请求");
        
        try {
            migrationService.migrateAllData();
            String message = "所有气象数据迁移完成";
            log.info(message);
            return ResponseEntity.ok(ApiResponse.success(message));
        } catch (Exception e) {
            log.error("迁移所有气象数据失败", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("迁移失败: " + e.getMessage()));
        }
    }

    /**
     * 迁移指定类型的气象数据
     * POST /api/migration/{type}
     * 
     * @param type 数据类型: wind, ocean_current, wave
     */
    @PostMapping("/{type}")
    public ResponseEntity<ApiResponse<String>> migrateDataByType(@PathVariable String type) {
        log.info("收到迁移{}数据的请求", type);
        
        try {
            // 直接调用service的方法，让service使用配置的路径
            migrationService.migrateDataTypeByCode(type);
            String message = String.format("%s数据迁移完成", type);
            log.info(message);
            return ResponseEntity.ok(ApiResponse.success(message));
        } catch (IllegalArgumentException e) {
            log.error("无效的数据类型: {}", type);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("无效的数据类型: " + type));
        } catch (Exception e) {
            log.error("迁移{}数据失败", type, e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("迁移失败: " + e.getMessage()));
        }
    }
    
    /**
     * 测试配置路径
     * GET /api/migration/test-paths
     */
    @GetMapping("/test-paths")
    public ResponseEntity<ApiResponse<String>> testPaths() {
        try {
            String info = migrationService.getPathInfo();
            return ResponseEntity.ok(ApiResponse.success(info));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("获取路径信息失败: " + e.getMessage()));
        }
    }
}
