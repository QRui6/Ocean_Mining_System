package com.oceanmining.monitoring.config;

import com.oceanmining.monitoring.service.WeatherDataMigrationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * 气象数据迁移启动器
 * 如果配置了auto-run=true，则在应用启动时自动执行数据迁移
 */
@Component
public class WeatherDataMigrationRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(WeatherDataMigrationRunner.class);
    private final WeatherDataMigrationService migrationService;

    @Value("${weather.migration.auto-run:false}")
    private boolean autoRun;

    @Autowired
    public WeatherDataMigrationRunner(WeatherDataMigrationService migrationService) {
        this.migrationService = migrationService;
    }

    @Override
    public void run(String... args) {
        if (!autoRun) {
            log.info("气象数据自动迁移已禁用。如需迁移，请调用 POST /api/migration/all");
            return;
        }

        log.info("开始自动执行气象数据迁移...");
        try {
            migrationService.migrateAllData();
            log.info("气象数据自动迁移完成");
        } catch (Exception e) {
            log.error("气象数据自动迁移失败", e);
            // 不抛出异常，允许应用继续启动
        }
    }
}
