package com.oceanmining.monitoring.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import java.util.function.Supplier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.DependsOn;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

@Repository
@DependsOn("historicalCacheSchema")
public class HistoricalPointCacheStore {
    public static final int FORMAT=1;
    public record Point(double lat,double lon) {
        public Point {
            if(!Double.isFinite(lat)||!Double.isFinite(lon)||lat < -90||lat > 90||lon < -180||lon > 180)
                throw new IllegalArgumentException("查询经纬度无效");
            if(lat==0)lat=0; if(lon==0)lon=0;
        }
        public String key() { return Double.toString(lat)+"|"+Double.toString(lon); }
    }
    public record Snapshot(long revision,List<String> months) {
        public Snapshot { months=List.copyOf(months); }
        public String version() { return FORMAT+":"+revision; }
    }
    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;
    private final TransactionTemplate writer, reader;
    private final int maxPoints;
    public HistoricalPointCacheStore(JdbcTemplate jdbc,ObjectMapper mapper,PlatformTransactionManager manager,
            @Value("${history.cache.max-points:512}") int maxPoints,
            @Value("${history.cache.query-timeout-seconds:180}") int timeout) {
        this.jdbc=jdbc;this.mapper=mapper;this.maxPoints=Math.max(8,maxPoints);
        writer=new TransactionTemplate(manager);writer.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        reader=new TransactionTemplate(manager);reader.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        reader.setReadOnly(true);reader.setTimeout(timeout);
    }
    public long revision(HistoricalDataset dataset) {
        return Objects.requireNonNull(jdbc.queryForObject("SELECT revision FROM historical_dataset_revision WHERE dataset_key=?",Long.class,dataset.key));
    }
    public Snapshot snapshot(HistoricalDataset dataset) {
        for(int attempt=0;attempt<3;attempt++) {
            long version=revision(dataset);
            var months=jdbc.queryForList("SELECT d.year::text||'-'||lpad(d.month::text,2,'0') FROM "+dataset.dataTable()+
                " d JOIN "+dataset.metaTable()+" m ON m.id=d.metadata_id WHERE m.dataset_code=? ORDER BY d.year,d.month",String.class,dataset.code);
            if(version==revision(dataset))return new Snapshot(version,months);
        }
        throw new IllegalStateException("历史数据正在更新，请稍后重试");
    }
    public Optional<JsonNode> read(HistoricalDataset dataset,Point point,Snapshot snapshot) {
        var rows=jdbc.query("SELECT payload::text,month_keys FROM historical_point_series_cache WHERE dataset_key=? AND point_key=? AND source_version=? AND format_version=? AND row_count=?",
            (rs,n)-> {
                try {
                    var months=Arrays.asList((String[])rs.getArray("month_keys").getArray());
                    return months.equals(snapshot.months()) ? mapper.readTree(rs.getString(1)) : null;
                } catch(java.io.IOException e) { return null; }
            },dataset.key,point.key(),snapshot.revision(),FORMAT,snapshot.months().size());
        return rows.stream().filter(Objects::nonNull).findFirst();
    }
    public Set<String> freshPoints(HistoricalDataset dataset,Snapshot snapshot) {
        return new HashSet<>(jdbc.query("SELECT point_key,month_keys FROM historical_point_series_cache WHERE dataset_key=? AND source_version=? AND format_version=? AND row_count=?",
            (rs,n)->Arrays.asList((String[])rs.getArray("month_keys").getArray()).equals(snapshot.months()) ? rs.getString("point_key") : null,
            dataset.key,snapshot.revision(),FORMAT,snapshot.months().size()).stream().filter(Objects::nonNull).toList());
    }
    public void write(HistoricalDataset dataset,Point point,Snapshot snapshot,JsonNode payload) {
        writer.executeWithoutResult(tx->{
            if(revision(dataset)!=snapshot.revision())return;
            jdbc.update("INSERT INTO historical_point_series_cache(dataset_key,point_key,latitude,longitude,format_version,source_version,row_count,month_keys,payload) VALUES(?,?,?,?,?,?,?,CAST(? AS text[]),CAST(? AS jsonb)) "+
                "ON CONFLICT(dataset_key,point_key) DO UPDATE SET latitude=excluded.latitude,longitude=excluded.longitude,format_version=excluded.format_version,source_version=excluded.source_version,row_count=excluded.row_count,month_keys=excluded.month_keys,payload=excluded.payload,updated_at=clock_timestamp() "+
                "WHERE historical_point_series_cache.source_version<=excluded.source_version",
                dataset.key,point.key(),point.lat(),point.lon(),FORMAT,snapshot.revision(),snapshot.months().size(),"{"+String.join(",",snapshot.months())+"}",payload.toString());
            jdbc.update("DELETE FROM historical_point_series_cache WHERE dataset_key=? AND point_key NOT IN (SELECT point_key FROM historical_point_series_cache WHERE dataset_key=? ORDER BY updated_at DESC LIMIT ?)",dataset.key,dataset.key,maxPoints);
        });
    }
    public <T>T loadRaw(Supplier<T> loader) { return reader.execute(tx->loader.get()); }
}
