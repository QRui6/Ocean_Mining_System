package com.oceanmining.monitoring.service;

import com.fasterxml.jackson.databind.*;
import com.oceanmining.monitoring.exception.ResourceNotFoundException;
import com.oceanmining.monitoring.entity.WeatherMetadata;
import com.oceanmining.monitoring.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.context.annotation.DependsOn;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import jakarta.annotation.PreDestroy;
import org.springframework.scheduling.annotation.Scheduled;
import java.util.*;
import java.util.concurrent.*;
import java.time.*;

@Service @DependsOn("monitoringSchema")
public class MiningRiskService {
    public record Rule(double warning,Double critical,String unit) {
        public String getOperation(){return "采矿作业";}
        public String getVersion(){return "v1/"+warning+"/"+Objects.toString(critical,"-")+"/"+unit;}
    }
    private final JdbcTemplate db; private final ObjectMapper json; private final MiningAreaRepository areas;
    private final WeatherMetadataRepository metadata; private final TransactionTemplate tx;
    private final Map<String,Rule> rules; private final ZoneId dataZone;
    private final ExecutorService worker=Executors.newSingleThreadExecutor();
    // Old runs can contain reserve polygons. Keep them archived under their original IDs.
    private static final String CONTRACT_PREFIX = "china-contract:";
    public MiningRiskService(JdbcTemplate db,ObjectMapper json,MiningAreaRepository areas,WeatherMetadataRepository metadata,PlatformTransactionManager manager,
        @Value("${forecast.warning.wind-warning:20}") double wind,@Value("${forecast.warning.wind-critical:25}") double windCritical,
        @Value("${forecast.warning.wave-warning:4}") double wave,@Value("${forecast.warning.wave-critical:6}") double waveCritical,
        @Value("${forecast.warning.current-warning:2}") double current,@Value("${forecast.grid.timezone:UTC}") String zone) {
        this.db=db;this.json=json;this.areas=areas;this.metadata=metadata;this.tx=new TransactionTemplate(manager);this.dataZone=ZoneId.of(zone);
        rules=Map.of("wind",new Rule(wind,windCritical,"m/s"),"wave",new Rule(wave,waveCritical,"m"),"ocean_current",new Rule(current,null,"m/s"));
        db.update("UPDATE mining_risk_runs SET status='FAILED',error='服务重启，请重新评估' WHERE area_id LIKE ? AND status IN ('QUEUED','RUNNING')", CONTRACT_PREFIX + "%");
    }
    @PreDestroy public void stop(){worker.shutdownNow();}
    public Map<String,Rule> rules(){return rules;}
    public Map<String,Object> latest(String areaId) {
        var ids=db.queryForList("SELECT id FROM mining_risk_runs WHERE area_id=? ORDER BY created_at DESC LIMIT 1",UUID.class,contractId(areaId));
        return ids.isEmpty()?Map.of():run(ids.get(0));
    }
    private static final double SPACING_KM=25;
    private static final String FORMAT_VERSION="grid-v2";
    private record RequestContext(byte[] boundary,String source,String key) {}
    private record DatasetPlan(String type,WeatherMetadata metadata,List<Integer> indices) {}

    // A matching request returns its existing run; only changed inputs are queued.
    @Scheduled(initialDelay=60000,fixedDelayString="${forecast.grid.poll-ms:300000}")
    public void refreshWatchedAreas() {
        for(var area : ServiceMiningAreas.ALL) {
            try { start(area.id()); }
            catch(Exception error) { org.slf4j.LoggerFactory.getLogger(getClass()).warn("Mining assessment refresh postponed: {}",error.getMessage()); }
        }
    }
    private static String contractId(String areaId) {
        return CONTRACT_PREFIX + ServiceMiningAreas.require(areaId).id();
    }
    private static void exposeArea(Map<String,Object> row) {
        String areaId = ((String) row.get("area_id")).substring(CONTRACT_PREFIX.length());
        row.put("area_id", areaId);
        row.put("area_name", ServiceMiningAreas.require(areaId).name());
    }
    private String sourceSignature() {
        var signature=new LinkedHashMap<String,Object>();
        signature.put("revision",db.queryForObject("SELECT revision FROM mining_grid_source_revision WHERE id=TRUE",Long.class));
        signature.put("metadata",db.queryForList("SELECT m.id,m.start_time,m.updated_at,m.total_frames FROM weather_metadata m JOIN weather_data_types t ON m.data_type_id=t.id WHERE t.type_code IN ('wind','wave','ocean_current') ORDER BY m.id"));
        return write(signature);
    }
    static String requestKey(String boundary,String source,String rules,String timezone,double spacingKm) {
        try {
            String value=FORMAT_VERSION+"|"+boundary+"|"+source+"|"+rules+"|"+timezone+"|"+spacingKm;
            return HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256").digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch(java.security.NoSuchAlgorithmException error) { throw new IllegalStateException(error); }
    }
    private RequestContext context(String areaId) {
        var row=db.queryForMap("WITH area AS (" + ServiceMiningAreas.CONTRACT_BOUNDARY + ") SELECT ST_AsBinary(g) boundary,ST_AsBinary(ST_Normalize(g)) canonical FROM area",areaId);
        byte[] boundary=(byte[])row.get("boundary"),canonical=(byte[])row.get("canonical");
        if(boundary==null||canonical==null)throw new IllegalArgumentException("矿区缺少有效边界");
        String source=sourceSignature();
        return new RequestContext(boundary,source,requestKey(HexFormat.of().formatHex(canonical),source,write(new TreeMap<>(rules)),dataZone.getId(),SPACING_KM));
    }
    public synchronized UUID start(String areaId) {
        String storedId = contractId(areaId);
        RequestContext context=context(areaId);
        var active=db.queryForList("SELECT id FROM mining_risk_runs WHERE area_id=? AND request_key=? AND status IN ('QUEUED','RUNNING') ORDER BY created_at DESC LIMIT 1",UUID.class,storedId,context.key());
        if(!active.isEmpty())return active.get(0);
        var cached=db.queryForList("SELECT id FROM mining_risk_runs WHERE area_id=? AND request_key=? AND status='COMPLETED' AND result IS NOT NULL ORDER BY created_at DESC LIMIT 1",UUID.class,storedId,context.key());
        if(!cached.isEmpty())return cached.get(0);
        List<MiningGrid.Point> points;
        try { points=MiningGrid.sample(new org.locationtech.jts.io.WKBReader().read(context.boundary()),SPACING_KM); }
        catch(org.locationtech.jts.io.ParseException error) { throw new IllegalArgumentException("矿区边界无效",error); }
        UUID id=UUID.randomUUID();
        db.update("INSERT INTO mining_risk_runs(id,area_id,status,request_key,source_signature) VALUES(?,?,'QUEUED',?,?)",id,storedId,context.key(),context.source());
        worker.submit(()->evaluate(id,areaId,points,context));
        return id;
    }
    public Map<String,Object> run(UUID id) {
        var result=db.queryForList("SELECT id,area_id,status,progress,error,created_at,finished_at,result::text FROM mining_risk_runs WHERE id=? AND area_id LIKE ?",id,CONTRACT_PREFIX+"%")
            .stream().findFirst().orElseThrow(()->new ResourceNotFoundException("评估记录不存在"));
        exposeArea(result);
        if(result.get("result")!=null)result.put("result",read((String)result.get("result")));return result;
    }
    public List<Map<String,Object>> events(String areaId) {
        String scope = areaId == null ? CONTRACT_PREFIX + "%" : contractId(areaId);
        var rows=db.queryForList("SELECT id,area_id,metric,status,severity,created_at,updated_at,resolved_at,snapshot::text FROM mining_risk_events WHERE area_id LIKE ? ORDER BY updated_at DESC",scope);
        rows.forEach(row->{exposeArea(row);row.put("snapshot",read((String)row.get("snapshot")));});return rows;
    }
    public List<Map<String,Object>> versions(long id) {
        var rows=db.queryForList("SELECT v.action,v.created_at,v.snapshot::text FROM mining_risk_versions v JOIN mining_risk_events e ON e.id=v.event_id WHERE v.event_id=? AND e.area_id LIKE ? ORDER BY v.id",id,CONTRACT_PREFIX+"%");
        rows.forEach(row->row.put("snapshot",read((String)row.get("snapshot"))));return rows;
    }
    public List<Map<String,Object>> acknowledge(long id) {
        tx.executeWithoutResult(status->{
            var event=db.queryForList("SELECT status,snapshot::text FROM mining_risk_events WHERE id=? AND area_id LIKE ? FOR UPDATE",id,CONTRACT_PREFIX+"%")
                .stream().findFirst().orElseThrow(()->new ResourceNotFoundException("预警记录不存在"));
            if(!"ACTIVE".equals(event.get("status")))throw new IllegalArgumentException("预警已解除");
            db.update("INSERT INTO mining_risk_versions(event_id,action,snapshot) SELECT ?,'ACKNOWLEDGED',?::jsonb WHERE NOT EXISTS (SELECT 1 FROM mining_risk_versions WHERE event_id=? AND action='ACKNOWLEDGED' AND snapshot->>'runId'= (?::jsonb)->>'runId')",id,event.get("snapshot"),id,event.get("snapshot"));
        });
        return versions(id);
    }
    private void evaluate(UUID id,String areaId,List<MiningGrid.Point> points,RequestContext request) {
        try {
            db.update("UPDATE mining_risk_runs SET status='RUNNING' WHERE id=?",id);
            if(!request.key().equals(context(areaId).key()))throw new IllegalStateException("评估条件已更新，请重新评估");
            List<DatasetPlan> plans=new ArrayList<>();
            for(String type:List.of("wind","wave","ocean_current")) {
                WeatherMetadata m=metadata.findByDataType_TypeCode(type).orElse(null);
                var indices=m==null||m.getStartTime()==null||m.getTimeStepHours()==null ? List.<Integer>of()
                    : db.queryForList("SELECT time_index FROM "+table(type)+" WHERE metadata_id=? ORDER BY time_index",Integer.class,m.getId());
                plans.add(new DatasetPlan(type,m,indices));
            }
            int totalFrames=plans.stream().mapToInt(plan->plan.indices().size()).sum(),doneFrames=0;
            Map<String,Object> datasets=new LinkedHashMap<>();
            for(var plan:plans) {
                if(Thread.currentThread().isInterrupted())throw new InterruptedException();
                WeatherMetadata m=plan.metadata();String type=plan.type();
                if(m==null||m.getStartTime()==null||m.getTimeStepHours()==null) { datasets.put(type,Map.of("frames",List.of(),"complete",false));continue; }
                var sampled=sampleFrames(type,m,points);
                List<Map<String,Object>> frames=new ArrayList<>();
                boolean complete=plan.indices().size()==m.getTotalFrames() && sampled.keySet().equals(new LinkedHashSet<>(plan.indices()));
                for(int n=0;n<plan.indices().size();n++)if(plan.indices().get(n)!=n)complete=false;
                for(int index:plan.indices()) {
                    var values=sampled.getOrDefault(index,new ArrayList<>(Collections.nCopies(points.size(),null)));
                    int exceeded=0;
                    for(Double value:values) { if(value==null)complete=false;else if(value>=rules.get(type).warning())exceeded++; }
                    Instant time=m.getStartTime().plusHours((long)index*m.getTimeStepHours()).atZone(dataZone).toInstant();
                    Map<String,Object> frame=new LinkedHashMap<>();frame.put("time",time.toString());frame.put("values",values);frame.put("exceeded",exceeded);frames.add(frame);
                }
                Map<String,Object> dataset=new LinkedHashMap<>();dataset.put("frames",frames);dataset.put("complete",complete);
                dataset.put("initialTime",m.getStartTime().atZone(dataZone).toInstant().toString());dataset.put("timeStepHours",m.getTimeStepHours());dataset.put("source",m.getDataSource());dataset.put("gridWidth",m.getGridLonSize());dataset.put("gridHeight",m.getGridLatSize());
                datasets.put(type,dataset);doneFrames+=plan.indices().size();
                db.update("UPDATE mining_risk_runs SET progress=? WHERE id=?",Math.min(99,(int)(99.0*doneFrames/Math.max(1,totalFrames))),id);
            }
            Map<String,Object> result=new LinkedHashMap<>();result.put("points",points);result.put("spacingKm",SPACING_KM);result.put("rules",rules);result.put("datasets",datasets);result.put("ruleVersion",write(rules));
            if(!request.key().equals(context(areaId).key()))throw new IllegalStateException("评估条件已更新，请重新评估");
            result.put("sourceSignature",request.source());result.put("requestKey",request.key());
            tx.executeWithoutResult(status->{
                db.update("UPDATE mining_risk_runs SET status='COMPLETED',progress=100,finished_at=now(),result=?::jsonb WHERE id=?",write(result),id);
                reconcile(areaId,id,datasets,points);
            });
        } catch(Exception error) { db.update("UPDATE mining_risk_runs SET status='FAILED',error=?,finished_at=now() WHERE id=?",Objects.toString(error.getMessage(),error.getClass().getSimpleName()),id); }
    }
    private static String table(String type) {
        return switch(type) { case "wind"->"wind_data";case "wave"->"wave_data";case "ocean_current"->"ocean_current_data";default->throw new IllegalArgumentException("无效评估指标"); };
    }
    private Map<Integer,List<Double>> sampleFrames(String type,WeatherMetadata metadata,List<MiningGrid.Point> points) {
        var stencils=points.stream().map(point->MiningGrid.stencil(metadata.getGridLonSize(),metadata.getGridLatSize(),metadata.getGridLonMin().doubleValue(),metadata.getGridLatMin().doubleValue(),metadata.getGridLonMax().doubleValue(),metadata.getGridLatMax().doubleValue(),point)).toList();
        StringJoiner offsets=new StringJoiner(",","{","}");
        for(var stencil:stencils)for(int i=0;i<4;i++)offsets.add(stencil==null?"NULL":Integer.toString(stencil.offsets()[i]));
        String columns=type.equals("wave")?"d.wave_height,NULL::bytea":"d.u_component,d.v_component";
        String sql="SELECT d.time_index,s.point_index,s.a_bytes[1] a0,s.a_bytes[2] a1,s.a_bytes[3] a2,s.a_bytes[4] a3,s.b_bytes[1] b0,s.b_bytes[2] b1,s.b_bytes[3] b2,s.b_bytes[4] b3 FROM "+table(type)+" d CROSS JOIN LATERAL ocean_mining_grid_samples("+columns+",CAST(? AS integer[]),?) s WHERE d.metadata_id=? ORDER BY d.time_index,s.point_index";
        long bytes=(long)metadata.getGridLonSize()*metadata.getGridLatSize()*4;
        return db.query(sql,rs->{
            var frames=new LinkedHashMap<Integer,List<Double>>();
            while(rs.next()) {
                if(Thread.currentThread().isInterrupted())throw new IllegalStateException("评估已中断");
                int pointIndex=rs.getInt("point_index")-1;
                if(pointIndex<0||pointIndex>=points.size())throw new IllegalStateException("格点取样序号无效");
                var stencil=stencils.get(pointIndex);
                Double value=MiningGrid.interpolate(stencil,new byte[][]{rs.getBytes("a0"),rs.getBytes("a1"),rs.getBytes("a2"),rs.getBytes("a3")});
                if(!type.equals("wave")) {
                    Double second=MiningGrid.interpolate(stencil,new byte[][]{rs.getBytes("b0"),rs.getBytes("b1"),rs.getBytes("b2"),rs.getBytes("b3")});
                    value=value==null||second==null?null:Math.hypot(value,second);
                }
                if(value!=null&&value<0)value=null;
                frames.computeIfAbsent(rs.getInt("time_index"),key->new ArrayList<>(Collections.nCopies(points.size(),null))).set(pointIndex,value);
            }
            return frames;
        },offsets.toString(),bytes,metadata.getId());
    }
    void reconcile(String areaId,UUID run,Map<String,Object> datasets) {
        reconcile(areaId,run,datasets,List.of());
    }
    private void reconcile(String areaId,UUID run,Map<String,Object> datasets,List<MiningGrid.Point> points) {
        String storedId = contractId(areaId);
        Instant now=Instant.now();
        for(var entry:datasets.entrySet()) {
            JsonNode d=json.valueToTree(entry.getValue());String metric=entry.getKey();
            // Incomplete/old batches cannot create or clear operational warnings.
            if (!d.path("complete").asBoolean() || !d.hasNonNull("initialTime")) continue;
            Instant initial = Instant.parse(d.get("initialTime").asText());
            if (initial.isAfter(now) || initial.isBefore(now.minus(Duration.ofDays(2)))) continue;
            double peak=-1;String first=null,last=null;int pointIndex=-1;boolean hasFuture=false;
            for(JsonNode frame:d.path("frames")){
                if(Instant.parse(frame.path("time").asText()).isBefore(now))continue;hasFuture=true;
                int i=0;for(JsonNode value:frame.path("values")){
                    if(value.isNumber() && value.asDouble()>=rules.get(metric).warning()){
                        if(first==null)first=frame.path("time").asText();last=frame.path("time").asText();
                        if(value.asDouble()>peak){peak=value.asDouble();pointIndex=i;}
                    }i++;
                }
            }
            if(!hasFuture)continue;
            var existing=db.queryForList("SELECT id FROM mining_risk_events WHERE area_id=? AND metric=? AND status='ACTIVE' FOR UPDATE",Long.class,storedId,metric);
            if(!existing.isEmpty()) {
                JsonNode previous=read(db.queryForObject("SELECT snapshot::text FROM mining_risk_events WHERE id=?",String.class,existing.get(0)));
                if(previous.has("initialTime") && Instant.parse(previous.get("initialTime").asText()).isAfter(initial))continue;
            }
            if(peak<0 && existing.isEmpty())continue;
            Map<String,Object> snapshot=new LinkedHashMap<>();snapshot.put("runId",run.toString());snapshot.put("initialTime",d.path("initialTime").asText());snapshot.put("rule",rules.get(metric));snapshot.put("value",peak<0?null:peak);snapshot.put("pointIndex",pointIndex);snapshot.put("start",first);snapshot.put("end",last);
            if(pointIndex>=0 && pointIndex<points.size())snapshot.put("point",points.get(pointIndex));
            if(first!=null)snapshot.put("durationHours",Duration.between(Instant.parse(first),Instant.parse(last)).toMinutes()/60.0);
            String action=peak<0?"RESOLVED":existing.isEmpty()?"CREATED":"UPDATED";
            if(!existing.isEmpty() && peak>=0) {
                JsonNode previous=read(db.queryForObject("SELECT snapshot::text FROM mining_risk_events WHERE id=?",String.class,existing.get(0)));
                var comparison=json.valueToTree(snapshot);((com.fasterxml.jackson.databind.node.ObjectNode)comparison).remove("runId");
                ((com.fasterxml.jackson.databind.node.ObjectNode)previous).remove("runId");
                if(previous.equals(comparison))continue;
            }
            String severity=rules.get(metric).critical()!=null&&peak>=rules.get(metric).critical()?"CRITICAL":"WARNING";
            Long event;
            if(existing.isEmpty())event=db.queryForObject("INSERT INTO mining_risk_events(area_id,metric,status,severity,snapshot) VALUES(?,?,'ACTIVE',?,?::jsonb) RETURNING id",Long.class,storedId,metric,severity,write(snapshot));
            else {event=existing.get(0);db.update("UPDATE mining_risk_events SET status=?,severity=?,snapshot=?::jsonb,updated_at=now(),resolved_at=CASE WHEN ?='RESOLVED' THEN now() ELSE NULL END WHERE id=?",peak<0?"RESOLVED":"ACTIVE",severity,write(snapshot),action,event);}
            db.update("INSERT INTO mining_risk_versions(event_id,action,snapshot) VALUES(?,?,?::jsonb)",event,action,write(snapshot));
        }
    }
    private String write(Object value){try{return json.writeValueAsString(value);}catch(Exception e){throw new IllegalArgumentException(e);}}
    private JsonNode read(String value){try{return json.readTree(value);}catch(Exception e){throw new IllegalArgumentException(e);}}
}
