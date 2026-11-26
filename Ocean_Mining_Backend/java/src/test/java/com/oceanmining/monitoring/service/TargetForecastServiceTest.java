package com.oceanmining.monitoring.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.oceanmining.monitoring.dto.response.MiningOverviewSiteDTO;
import com.oceanmining.monitoring.dto.response.SiteForecastDailyDTO;
import com.oceanmining.monitoring.dto.response.SiteForecastHourlyDTO;
import com.oceanmining.monitoring.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.stream.IntStream;

import static com.oceanmining.monitoring.enums.ForecastRange.DAYS_15;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TargetForecastServiceTest {
    private final MiningOverviewService overview = mock(MiningOverviewService.class);
    private final TargetForecastService service = new TargetForecastService(
            overview, new ForecastDataService(null, overview), mock(JdbcTemplate.class), new ObjectMapper());

    @Test void limitsContractAndStationMembership() {
        when(overview.getSites(null)).thenReturn(List.of(
                station(11L, "COMRAPMS1", "太平洋"),
                station(2L, "COMRAPMS1", "印度洋"),
                station(9L, "APEI-10", "太平洋 (CCZ)")));
        var targets = service.targets();
        assertEquals(5, targets.size());
        var ridge = targets.stream().filter(target -> target.id().equals("COMRAPMS1")).findFirst().orElseThrow();
        assertEquals(List.of(2L, 11L), ridge.stations().stream().map(TargetForecastService.Station::id).toList());
        assertThrows(ResourceNotFoundException.class, () -> service.product("COMRAPMS1", 9L, DAYS_15));
        assertThrows(ResourceNotFoundException.class, () -> service.product("APEI-10", null, DAYS_15));
    }

    @Test void staleShortBatchKeepsActualDatesAndNullMetrics() {
        when(overview.getSites(null)).thenReturn(List.of(station(2L, "COMRAPMS1", "印度洋")));
        LocalDate old = LocalDate.now().minusDays(50);
        var rows = IntStream.range(0, 11).mapToObj(i -> daily(old, i)).toList();
        when(overview.getSiteDailyForecasts(2L, true)).thenReturn(rows);
        var product = service.product("COMRAPMS1", 2L, DAYS_15);
        assertEquals(11, product.report().points().size());
        assertEquals(old.plusDays(10), product.report().points().get(10).date());
        assertTrue(product.report().summary().getStale());
        assertFalse(product.report().summary().getDataComplete());
        assertNull(product.report().summary().getWindSpeedMax());
        assertNull(product.report().summary().getRiskLevel());
    }

    @Test void hourlyDetailsBelongToTheSelectedDailyBatch() {
        when(overview.getSites(null)).thenReturn(List.of(station(43L, "BPHDCPMN1", "西太平洋")));
        LocalDate date = LocalDate.of(2026, 10, 28);
        when(overview.getSiteDailyForecasts(43L, true)).thenReturn(List.of(daily(date, 0), daily(date, 1)));
        when(overview.getSiteHourlyForecasts(43L, null, true)).thenReturn(List.of(
                hourly(date, "t12", 3), hourly(date, "t00", 18),
                hourly(date.minusDays(1), "t00", 12), hourly(date, "t00", 3)));

        var details = service.product("BPHDCPMN1", 43L, DAYS_15, true).hourlyPoints();
        assertEquals(List.of(11, 2), details.stream().map(point -> point.time().getHour()).toList());
        assertTrue(details.get(0).time().isBefore(details.get(1).time()));
        assertEquals(date.plusDays(1), details.get(1).date());
        assertNull(service.product("BPHDCPMN1", 43L, DAYS_15).hourlyPoints());
    }

    private static MiningOverviewSiteDTO station(long id, String code, String region) {
        var site = new MiningOverviewSiteDTO();
        site.setId(id);
        site.setSiteCode(code);
        site.setRegionName(region);
        return site;
    }

    private static SiteForecastDailyDTO daily(LocalDate base, int day) {
        var row = new SiteForecastDailyDTO();
        row.setBaseDate(base);
        row.setRunCycle("t00");
        row.setForecastDate(base.plusDays(day));
        row.setWaveHeightMax(BigDecimal.valueOf(4));
        return row;
    }

    private static SiteForecastHourlyDTO hourly(LocalDate base, String cycle, int hour) {
        var row = new SiteForecastHourlyDTO();
        row.setBaseDate(base);
        row.setRunCycle(cycle);
        row.setForecastTime(base.atTime(hour, 0).atZone(ZoneOffset.UTC));
        row.setWaveHeight(BigDecimal.valueOf(4.5));
        return row;
    }
}
