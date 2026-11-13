package com.oceanmining.monitoring;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ShipMonitoringApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShipMonitoringApplication.class, args);
        System.out.println("""

            ========================================
            Ship Monitoring Backend started
            API: http://localhost:8082
            WebSocket: ws://localhost:8082/ws
            ========================================
            """);
    }
}
