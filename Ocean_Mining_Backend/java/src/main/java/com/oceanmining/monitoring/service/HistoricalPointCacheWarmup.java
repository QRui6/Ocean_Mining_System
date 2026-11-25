package com.oceanmining.monitoring.service;

import java.util.List;
import java.util.concurrent.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class HistoricalPointCacheWarmup implements DisposableBean {
    private static final Logger log=LoggerFactory.getLogger(HistoricalPointCacheWarmup.class);
    private final HistoricalCurrentService current;
    private final HistoricalWindService wind;
    private final HistoricalWaveService wave;
    private final JdbcTemplate jdbc;
    private final boolean enabled;
    private final ScheduledExecutorService executor=Executors.newSingleThreadScheduledExecutor(task->{
        var thread=new Thread(task,"historical-point-cache");thread.setDaemon(true);return thread;
    });
    public HistoricalPointCacheWarmup(HistoricalCurrentService current,HistoricalWindService wind,HistoricalWaveService wave,JdbcTemplate jdbc,@Value("${history.cache.prewarm-enabled:true}") boolean enabled) {
        this.current=current;this.wind=wind;this.wave=wave;this.jdbc=jdbc;this.enabled=enabled;
    }
    @EventListener(ApplicationReadyEvent.class)
    public void start() { if(enabled)executor.scheduleWithFixedDelay(this::refresh,3,30,TimeUnit.SECONDS); }
    private void refresh() {
        try {
            List<HistoricalPointCacheStore.Point> points=jdbc.query("SELECT center_lat AS lat,center_lng AS lon FROM mining_regions WHERE center_lat IS NOT NULL AND center_lng IS NOT NULL UNION SELECT lat,lng FROM forecast_sites WHERE is_active=true AND lat IS NOT NULL AND lng IS NOT NULL",
                (rs,n)->new HistoricalPointCacheStore.Point(rs.getDouble("lat"),rs.getDouble("lon")));
            warm("wave",()->wave.precomputePoints(points));
            warm("wind",()->wind.precomputePoints(points));
            warm("current",()->current.precomputePoints(points));
        } catch(Exception error) { log.warn("Historical point cache refresh postponed: {}",error.getMessage()); }
    }
    private void warm(String dataset,java.util.function.IntSupplier calculation) {
        try {
            int count=calculation.getAsInt();
            if(count>0)log.info("Historical {} cache refreshed for {} points",dataset,count);
        } catch(Exception error) { log.warn("Historical {} cache refresh postponed: {}",dataset,error.getMessage()); }
    }
    @Override public void destroy() { executor.shutdownNow(); }
}
