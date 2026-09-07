package com.oceanmining.monitoring.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;

/**
 * 缓存配置
 * 
 * @author Ocean Mining Team
 * @version 1.0.0
 */
@Configuration
@EnableCaching
public class CacheConfig {
    
    /**
     * 配置缓存管理器
     * 
     * @return 缓存管理器
     */
    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager cacheManager = new SimpleCacheManager();
        cacheManager.setCaches(Arrays.asList(
                new ConcurrentMapCache("weatherMetadata"),
                new ConcurrentMapCache("weatherData"),
                new ConcurrentMapCache("weatherDataBinary"),
                new ConcurrentMapCache("availableIndices"),
                new ConcurrentMapCache("typhoonAreaSummary"),
                new ConcurrentMapCache("typhoonAreaEvents"),
                new ConcurrentMapCache("typhoonRegionEvents"),
                new ConcurrentMapCache("typhoonYearlyStats")
        ));
        return cacheManager;
    }
}
