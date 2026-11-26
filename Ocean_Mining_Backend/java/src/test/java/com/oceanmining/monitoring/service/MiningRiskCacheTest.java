package com.oceanmining.monitoring.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.oceanmining.monitoring.repository.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class MiningRiskCacheTest {
    @Test void changedSourcesRulesBoundaryTimezoneAndSpacingInvalidateResult() {
        String base=MiningRiskService.requestKey("boundary","source","rules","UTC",25);
        assertEquals(base,MiningRiskService.requestKey("boundary","source","rules","UTC",25));
        assertNotEquals(base,MiningRiskService.requestKey("changed","source","rules","UTC",25));
        assertNotEquals(base,MiningRiskService.requestKey("boundary","changed","rules","UTC",25));
        assertNotEquals(base,MiningRiskService.requestKey("boundary","source","changed","UTC",25));
        assertNotEquals(base,MiningRiskService.requestKey("boundary","source","rules","Asia/Shanghai",25));
        assertNotEquals(base,MiningRiskService.requestKey("boundary","source","rules","UTC",50));
    }
    @Test void unchangedCompletedRunIsReusedWithoutQueueingAnotherCalculation() {
        var db=mock(JdbcTemplate.class);
        when(db.queryForMap(anyString(),any())).thenReturn(Map.of("boundary",new byte[]{1},"canonical",new byte[]{1}));
        when(db.queryForObject(anyString(),eq(Long.class))).thenReturn(1L);
        when(db.queryForList(anyString())).thenReturn(List.of());
        UUID existing=UUID.randomUUID();
        when(db.queryForList(anyString(),eq(UUID.class),any(),any())).thenAnswer(call->((String)call.getArgument(0)).contains("status='COMPLETED'")?List.of(existing):List.of());
        var service=new MiningRiskService(db,new ObjectMapper(),mock(MiningAreaRepository.class),mock(WeatherMetadataRepository.class),mock(PlatformTransactionManager.class),20,25,4,6,2,"UTC");
        clearInvocations(db);
        try {
            assertEquals(existing,service.start("CMMPMN1"));
            assertEquals(existing,service.start("CMMPMN1"));
            verify(db,never()).update(startsWith("INSERT INTO mining_risk_runs"),any(),any(),any(),any());
        } finally { service.stop(); }
    }
}
