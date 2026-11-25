package com.oceanmining.monitoring.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

/**
 * CORS跨域配置
 */
@Configuration
public class CorsConfig {
    
    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        
        // 允许所有来源（使用 allowedOriginPatterns 代替 allowedOrigin）
        config.addAllowedOriginPattern("*");
            
        // 允许所有方法
        config.addAllowedMethod("*");
        
        // 允许所有头
        config.addAllowedHeader("*");
        
        // 允许携带凭证
        config.setAllowCredentials(true);
        
        // 暴露的响应头
        config.addExposedHeader("*");
        
        // 预检请求的有效期（秒）
        config.setMaxAge(3600L);
        
        // 应用到所有路径
        source.registerCorsConfiguration("/**", config);
        
        return new CorsFilter(source);
    }
}
