package com.oceanmining.monitoring.scheduler;

import com.oceanmining.monitoring.service.MiningRiskService;
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

    private final MiningRiskService miningRiskService;

    public ForecastScheduler(MiningRiskService miningRiskService) {
        this.miningRiskService = miningRiskService;
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
        miningRiskService.refreshWatchedAreas();
    }
}
