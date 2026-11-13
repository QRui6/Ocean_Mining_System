package com.oceanmining.monitoring.scheduler;

import com.oceanmining.monitoring.entity.MiningRegion;
import com.oceanmining.monitoring.enums.ForecastRange;
import com.oceanmining.monitoring.repository.MiningRegionRepository;
import com.oceanmining.monitoring.service.ForecastBulletinService;
import com.oceanmining.monitoring.service.WeatherWarningService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(
        name = "forecast.scheduler.enabled",
        havingValue = "true",
        matchIfMissing = true
)
public class ForecastScheduler {

    private static final Logger log = LoggerFactory.getLogger(ForecastScheduler.class);

    private final MiningRegionRepository miningRegionRepository;
    private final ForecastBulletinService forecastBulletinService;
    private final WeatherWarningService weatherWarningService;

    public ForecastScheduler(
            MiningRegionRepository miningRegionRepository,
            ForecastBulletinService forecastBulletinService,
            WeatherWarningService weatherWarningService) {
        this.miningRegionRepository = miningRegionRepository;
        this.forecastBulletinService = forecastBulletinService;
        this.weatherWarningService = weatherWarningService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void initializeForecastProducts() {
        processLatestForecasts();
    }

    @Scheduled(
            cron = "${forecast.scheduler.cron:0 15 0,6,12,18 * * ?}",
            zone = "${forecast.scheduler.zone:Asia/Shanghai}"
    )
    public void processLatestForecasts() {
        log.info("Generating forecast bulletins and checking weather warnings");
        for (MiningRegion region : miningRegionRepository.findByIsActiveTrueOrderByRegionNameAsc()) {
            for (ForecastRange range : ForecastRange.values()) {
                try {
                    forecastBulletinService.generateOrRefresh(region.getId(), range, true);
                    weatherWarningService.detectAndSave(region.getId(), range);
                } catch (Exception e) {
                    log.warn(
                            "Forecast processing skipped: regionId={}, range={}, reason={}",
                            region.getId(),
                            range.getCode(),
                            e.getMessage()
                    );
                }
            }
        }
    }
}
