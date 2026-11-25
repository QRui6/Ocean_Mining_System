package com.oceanmining.monitoring.service;
import javax.sql.DataSource;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
@Component("monitoringSchema")
public class MonitoringSchema implements InitializingBean {
    private final DataSource source;
    public MonitoringSchema(DataSource source) { this.source=source; }
    public void afterPropertiesSet() {
        new ResourceDatabasePopulator(new ClassPathResource("db/client-monitoring.sql")).execute(source);
        var sampling=new ResourceDatabasePopulator(new ClassPathResource("db/mining-grid-sampling.sql"));
        sampling.setSeparator(";;");
        sampling.execute(source);
    }
}
