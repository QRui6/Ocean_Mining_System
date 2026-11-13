package com.oceanmining.monitoring.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * JPA配置类
 */
@Configuration
@EnableJpaRepositories(basePackages = "com.oceanmining.monitoring.repository")
@EnableTransactionManagement
public class JpaConfig {
    // JPA相关配置已在application.yml中配置
    // 这里主要用于启用JPA Repository和事务管理
}
