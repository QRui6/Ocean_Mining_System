package com.oceanmining.monitoring.service;
import org.junit.jupiter.api.Test;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import static org.junit.jupiter.api.Assertions.*;
class TyphoonForecastServiceTest {
    @Test void clipsFiveDayWindowIncludingCrossingSegmentsAndDateline() throws Exception {
        var json=new ObjectMapper();
        var points=json.readTree("[{\"time\":\"2026-11-13T00:00:00Z\",\"lon\":179,\"lat\":0},{\"time\":\"2026-11-13T06:00:00Z\",\"lon\":-179,\"lat\":6}]");
        var clipped=TyphoonForecastService.clip(points,Instant.parse("2026-11-13T01:30:00Z"),Instant.parse("2026-11-13T04:30:00Z"),json);
        assertEquals(2,clipped.size());
        assertEquals(179.5,clipped.get(0).path("lon").asDouble());
        assertEquals(-179.5,clipped.get(1).path("lon").asDouble());
        assertEquals(4.5,clipped.get(1).path("lat").asDouble());
        assertTrue(TyphoonForecastService.clip(points,Instant.parse("2026-11-14T00:00:00Z"),Instant.parse("2026-11-19T00:00:00Z"),json).isEmpty());
    }
}
