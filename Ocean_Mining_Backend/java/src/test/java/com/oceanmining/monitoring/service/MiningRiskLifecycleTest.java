package com.oceanmining.monitoring.service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oceanmining.monitoring.repository.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.junit.jupiter.api.Test;
import java.util.*;
import java.time.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class MiningRiskLifecycleTest {
    static class Database extends JdbcTemplate {
        boolean active;String snapshot;List<String> writes=new ArrayList<>();
        @Override public int update(String sql){writes.add(sql);return 1;}
        @Override public int update(String sql,Object... args){writes.add(sql);return 1;}
        @Override @SuppressWarnings("unchecked") public <T> List<T> queryForList(String sql,Class<T> type,Object... args){return active?List.of((T)Long.valueOf(7)):List.of();}
        @Override @SuppressWarnings("unchecked") public <T> T queryForObject(String sql,Class<T> type,Object... args){if(type==String.class)return (T)snapshot;writes.add(sql);return (T)Long.valueOf(7);}
    }
    MiningRiskService service(Database db){var s=new MiningRiskService(db,new ObjectMapper(),mock(MiningAreaRepository.class),mock(WeatherMetadataRepository.class),mock(PlatformTransactionManager.class),20,25,4,6,2,"UTC");db.writes.clear();return s;}
    Map<String,Object> data(boolean complete,Instant initial,double value){return Map.of("wind",Map.of("complete",complete,"initialTime",initial.toString(),"frames",List.of(Map.of("time",Instant.now().plusSeconds(3600).toString(),"values",List.of(value)))));}
    @Test void freshCompleteExceedanceCreatesDurableEventAndVersion(){var db=new Database();service(db).reconcile("A",UUID.randomUUID(),data(true,Instant.now(),26));assertEquals(2,db.writes.size());assertTrue(db.writes.get(0).contains("INSERT INTO mining_risk_events"));assertTrue(db.writes.get(1).contains("mining_risk_versions"));}
    @Test void missingAndStaleDataCannotResolveExistingEvent(){var db=new Database();db.active=true;var s=service(db);s.reconcile("A",UUID.randomUUID(),data(false,Instant.now(),0));s.reconcile("A",UUID.randomUUID(),data(true,Instant.now().minus(Duration.ofDays(3)),0));assertTrue(db.writes.isEmpty());}
    @Test void olderBatchCannotClearNewerEvent(){var db=new Database();db.active=true;db.snapshot="{\"initialTime\":\""+Instant.now()+"\"}";service(db).reconcile("A",UUID.randomUUID(),data(true,Instant.now().minusSeconds(3600),0));assertTrue(db.writes.isEmpty());}
    @Test void freshCompleteSafeBatchResolvesAndRetainsVersion(){var db=new Database();db.active=true;db.snapshot="{\"initialTime\":\""+Instant.now().minusSeconds(3600)+"\"}";service(db).reconcile("A",UUID.randomUUID(),data(true,Instant.now(),0));assertEquals(2,db.writes.size());assertTrue(db.writes.get(0).startsWith("UPDATE mining_risk_events"));}
}
