package com.oceanmining.monitoring.service;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import org.springframework.stereotype.Service;
import org.springframework.context.annotation.DependsOn;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.jdbc.core.JdbcTemplate;
import jakarta.annotation.PreDestroy;
import java.time.*;
import java.util.*;
import java.nio.file.*;
import java.util.concurrent.*;

@Service @DependsOn("monitoringSchema")
public class TyphoonForecastService {
    private final JdbcTemplate db;private final ObjectMapper json;private final String python,script;
    private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private volatile boolean collecting;private volatile String error;
    public TyphoonForecastService(JdbcTemplate db,ObjectMapper json,
        @Value("${typhoon.collector.python:python}") String python,
        @Value("${typhoon.collector.script:../automation/collect_typhoon_forecast.py}") String script){this.db=db;this.json=json;this.python=python;this.script=script;}
    @PreDestroy public void close(){worker.shutdownNow();}
    @Scheduled(initialDelay=15000,fixedDelayString="${typhoon.collector.interval-ms:3600000}")
    public synchronized void refresh(){
        if(collecting)return;collecting=true;
        worker.submit(()->{
            Path out=null,err=null;Process p=null;
            try{
                out=Files.createTempFile("ocean-typhoon-",".json");err=Files.createTempFile("ocean-typhoon-",".log");
                ProcessBuilder collector=new ProcessBuilder(python,script).redirectOutput(out.toFile()).redirectError(err.toFile());
                collector.environment().put("PYTHONIOENCODING","utf-8");
                p=collector.start();
                if(!p.waitFor(180,TimeUnit.SECONDS)){p.destroyForcibly();throw new IllegalStateException("台风数据获取超时");}
                if(p.exitValue()!=0) {
                    var diagnostics=Files.readAllLines(err);
                    org.slf4j.LoggerFactory.getLogger(getClass()).warn("台风采集退出 {}: {}",p.exitValue(),diagnostics.isEmpty()?"":diagnostics.get(diagnostics.size()-1));
                    throw new IllegalStateException("台风数据获取失败");
                }
                JsonNode payload=json.readTree(Files.readString(out));
                db.update("INSERT INTO typhoon_forecast_batches(source,initial_time,payload) VALUES('ECMWF ENS',?::timestamptz,?::jsonb) ON CONFLICT(source,initial_time) DO UPDATE SET payload=EXCLUDED.payload,fetched_at=now()",payload.path("initialTime").asText(),payload.toString());error=null;
            }catch(Exception e){error=e.getMessage();if(p!=null&&p.isAlive())p.destroyForcibly();}
            finally{collecting=false;try{if(out!=null)Files.deleteIfExists(out);if(err!=null)Files.deleteIfExists(err);}catch(Exception ignored){}}
        });
    }
    public Map<String,Object> latest(String areaId) {
        if (areaId != null && !areaId.isBlank()) ServiceMiningAreas.require(areaId);
        Map<String,Object> result=new LinkedHashMap<>();result.put("loading",collecting);result.put("error",error);
        var batches=db.queryForList("SELECT payload::text FROM typhoon_forecast_batches WHERE source='ECMWF ENS' AND payload->>'schemaVersion'='2' ORDER BY initial_time DESC LIMIT 1",String.class);
        if(batches.isEmpty()){result.put("data",null);return result;}
        try {
            JsonNode payload=json.readTree(batches.get(0));Instant now=Instant.now();
            Instant initial=Instant.parse(payload.path("initialTime").asText());
            Instant end=initial.plus(Duration.ofDays(5));
            boolean stale=initial.isBefore(now.minus(Duration.ofHours(36))) || initial.plus(Duration.ofHours(payload.path("horizonHours").asInt())).isBefore(end);
            result.put("data",payload);result.put("stale",stale);result.put("windowStart",initial);result.put("windowEnd",end);result.put("radiusKm",500);
            if(areaId!=null && !areaId.isBlank()){
                Set<Integer> hits=new HashSet<>();Map<String,Set<Integer>> byStorm=new TreeMap<>();
                Set<Integer> roster=new HashSet<>();payload.path("members").forEach(n->roster.add(n.asInt()));
                ArrayNode visible=json.createArrayNode(),queries=json.createArrayNode();
                for(JsonNode track:payload.path("tracks")){
                    if(!roster.contains(track.path("member").asInt()))continue;
                    if(!payload.path("observedStorms").has(track.path("stormId").asText()))continue;
                    ArrayNode points=clip(track.path("points"),initial,end,json);
                    if(points.isEmpty())continue;
                    ObjectNode displayed=((ObjectNode)track).deepCopy();displayed.set("points",points);visible.add(displayed);
                    ObjectNode geometry=json.createObjectNode();ArrayNode coordinates=json.createArrayNode();
                    for(JsonNode p:points){var pair=json.createArrayNode();pair.add(p.path("lon").asDouble());pair.add(p.path("lat").asDouble());coordinates.add(pair);}
                    geometry.put("type",coordinates.size()==1?"Point":"LineString");geometry.set("coordinates",coordinates.size()==1?coordinates.get(0):coordinates);
                    ObjectNode query=queries.addObject();query.put("member",track.path("member").asInt());query.put("storm",track.path("stormId").asText());query.set("geom",geometry);
                    String sid=track.path("stormId").asText();byStorm.computeIfAbsent(sid,k->new HashSet<>());
                    
                }
                for(var hit:db.queryForList("SELECT DISTINCT t.member,t.storm FROM mining_areas a CROSS JOIN jsonb_to_recordset(?::jsonb) AS t(member int,storm text,geom jsonb) WHERE " + ServiceMiningAreas.CONTRACT_FILTER + " AND ST_DWithin(a.geometry::geography,ST_SetSRID(ST_GeomFromGeoJSON(t.geom),4326)::geography,500000)",queries.toString(),areaId)){
                    int member=((Number)hit.get("member")).intValue();hits.add(member);byStorm.get((String)hit.get("storm")).add(member);
                }
                ArrayNode compare=json.createArrayNode();
                payload.path("comparisonTracks").forEach(compare::add);
                for(JsonNode feed:payload.path("activity")) feed.path("tracks").forEach(compare::add);
                for(JsonNode track:compare) {
                    ArrayNode pts=clip(track.path("points"),initial,end,json);
                    if(pts.isEmpty())continue;
                    ObjectNode copy=((ObjectNode)track).deepCopy();copy.set("points",pts);visible.add(copy);
                }
                ArrayNode locations=json.createArrayNode();
                for(JsonNode track:visible)for(JsonNode point:track.path("points")){
                    ObjectNode row=((ObjectNode)point).deepCopy();row.put("storm",track.path("stormId").asText());locations.add(row);
                }
                Map<String,Object> nearest=new HashMap<>();
                if(!locations.isEmpty())for(var row:db.queryForList("WITH area AS (" + ServiceMiningAreas.CONTRACT_BOUNDARY + ") SELECT DISTINCT ON (p.storm) p.storm,p.time,ST_Distance(area.g::geography,ST_SetSRID(ST_MakePoint(p.lon,p.lat),4326)::geography)/1000 distance FROM area,jsonb_to_recordset(?::jsonb) p(storm text,time text,lon float8,lat float8) ORDER BY p.storm,distance,p.time",areaId,locations.toString()))nearest.put((String)row.get("storm"),row);
                Map<String,Double> distances=new HashMap<>();
                var centers=payload.path("observedStorms").fields();
                while(centers.hasNext()){
                    var entry=centers.next();JsonNode center=entry.getValue();
                    Double distance=db.queryForObject("SELECT min(ST_Distance(geometry::geography,ST_SetSRID(ST_MakePoint(?,?),4326)::geography))/1000 FROM mining_areas WHERE " + ServiceMiningAreas.CONTRACT_FILTER,Double.class,center.path("lon").asDouble(),center.path("lat").asDouble(),areaId);
                    if(distance!=null){
                        distances.put(entry.getKey(),distance);
                        if(distance<=500){hits.addAll(roster);byStorm.computeIfAbsent(entry.getKey(),key->new HashSet<>()).addAll(roster);}
                    }
                }
                result.put("currentDistances",distances);
                result.put("nearest",nearest);
                ((ObjectNode)payload).remove(List.of("tracks","comparisonTracks"));
                result.put("tracks",visible);result.put("hitMembers",hits.size());result.put("totalMembers",roster.size());
                result.put("probability",stale||!payload.path("complete").asBoolean()||roster.isEmpty()?null:100.0*hits.size()/roster.size());
                result.put("storms",byStorm.entrySet().stream().map(e->Map.of("id",e.getKey(),"hitMembers",e.getValue().size())).toList());
                String buffer = db.queryForObject("SELECT ST_AsGeoJSON(ST_UnaryUnion(ST_Collect(ST_Buffer(geometry::geography,500000)::geometry))) FROM mining_areas WHERE " + ServiceMiningAreas.CONTRACT_FILTER,String.class,areaId);
                result.put("buffer",buffer == null ? null : json.readTree(buffer));
            }
            return result;
        }catch(Exception e){throw new IllegalStateException("台风数据处理失败",e);}
    }
    /** Clip time window at both boundaries; don't bridge missing forecast intervals. */
    public static ArrayNode clip(JsonNode points,Instant start,Instant end,ObjectMapper json){
        ArrayNode out=json.createArrayNode();
        for(int i=0;i<points.size();i++){
            JsonNode p=points.get(i);Instant time=Instant.parse(p.path("time").asText());
            if(i>0){JsonNode a=points.get(i-1);Instant before=Instant.parse(a.path("time").asText());
                for(Instant boundary:List.of(start,end))if(before.isBefore(boundary)&&time.isAfter(boundary)){
                    double ratio=(double)Duration.between(before,boundary).toMillis()/Duration.between(before,time).toMillis();
                    double lon=a.path("lon").asDouble(),delta=p.path("lon").asDouble()-lon;while(delta>180)delta-=360;while(delta< -180)delta+=360;
                    ObjectNode mid=json.createObjectNode();mid.put("time",boundary.toString());mid.put("lat",a.path("lat").asDouble()+ratio*(p.path("lat").asDouble()-a.path("lat").asDouble()));mid.put("lon",((lon+delta*ratio+540)%360)-180);out.add(mid);
                }
            }
            if(!time.isBefore(start)&&!time.isAfter(end))out.add(p);
        }
        return out;
    }
}
