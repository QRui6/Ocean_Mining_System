package com.oceanmining.monitoring.service;

import javax.sql.DataSource;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Component;

@Component("historicalCacheSchema")
public class HistoricalCacheSchema implements InitializingBean {
    private final DataSource dataSource;
    public HistoricalCacheSchema(DataSource dataSource) { this.dataSource=dataSource; }
    @Override public void afterPropertiesSet() {
        var scripts=new ResourceDatabasePopulator(new ClassPathResource("db/historical-point-cache.sql"));
        scripts.setSeparator(";;");
        scripts.execute(dataSource);
    }
}
