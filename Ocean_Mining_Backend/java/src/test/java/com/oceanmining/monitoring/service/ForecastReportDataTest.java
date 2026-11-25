package com.oceanmining.monitoring.service;

import com.oceanmining.monitoring.dto.response.RegionForecastDailyDTO;
import com.oceanmining.monitoring.entity.MiningRegion;
import com.oceanmining.monitoring.enums.ForecastRange;
import com.oceanmining.monitoring.repository.MiningRegionRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ForecastReportDataTest {
    @Test
    void summaryAndDetailsUseOneFetchOfTheSameBatch() {
        var regions = mock(MiningRegionRepository.class);
        var overview = mock(MiningOverviewService.class);
        var region = new MiningRegion();
        region.setId(1L); region.setRegionName("测试区域"); region.setRegionCode("TEST");
        when(regions.findById(1L)).thenReturn(Optional.of(region));
        var row = new RegionForecastDailyDTO();
        row.setForecastDate(LocalDate.of(2026, 10, 29)); row.setBaseDate(row.getForecastDate()); row.setRunCycle("00");
        row.setWindSpeedAvg(BigDecimal.TEN); row.setWindSpeedMax(BigDecimal.TEN);
        when(overview.getRegionDailyForecasts(1L)).thenReturn(List.of(row));
        var data = new ForecastDataService(regions, overview).getReportData(1L, ForecastRange.DAYS_7);
        verify(overview, times(1)).getRegionDailyForecasts(1L);
        assertEquals(1, data.points().size());
        assertEquals(0, data.summary().getWindSpeedAvg().compareTo(data.points().get(0).windAvg()));
        assertFalse(data.summary().getDataComplete());
    }
}
