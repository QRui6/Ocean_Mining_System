package com.oceanmining.monitoring.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oceanmining.monitoring.service.HistoricalPointCacheStore.Point;
import com.oceanmining.monitoring.service.HistoricalPointCacheStore.Snapshot;
import java.util.*;
import java.util.concurrent.*;
import java.util.function.Function;
import java.util.function.Supplier;
import org.springframework.stereotype.Service;

@Service
public class HistoricalPointCacheService {
    public record Series<T>(String version,List<T> items) {}
    private record Request(HistoricalDataset dataset,String point,long revision) {}
    private static class Changed extends RuntimeException {}
    private final HistoricalPointCacheStore store;
    private final ObjectMapper mapper;
    private final ConcurrentHashMap<Request,CompletableFuture<Series<?>>> pending=new ConcurrentHashMap<>();
    public HistoricalPointCacheService(HistoricalPointCacheStore store,ObjectMapper mapper) { this.store=store;this.mapper=mapper; }

    public Map<String,String> versions() {
        var result=new LinkedHashMap<String,String>();
        for(var dataset:HistoricalDataset.values())result.put(dataset.key,HistoricalPointCacheStore.FORMAT+":"+store.revision(dataset));
        return result;
    }
    public static boolean complete(JsonNode payload,Snapshot snapshot) {
        if(!payload.isArray()||payload.size()!=snapshot.months().size())return false;
        var months=new ArrayList<String>();
        for(var item:payload) {
            if(!item.path("year").isIntegralNumber()||!item.path("month").isIntegralNumber())return false;
            int month=item.path("month").asInt();
            if(month<1||month>12)return false;
            months.add(String.format(Locale.ROOT,"%04d-%02d",item.path("year").asInt(),month));
        }
        return months.equals(snapshot.months());
    }
    private <T>Series<T> decode(JsonNode payload,Class<T> itemType,Snapshot snapshot) {
        return new Series<>(snapshot.version(),mapper.convertValue(payload,mapper.getTypeFactory().constructCollectionType(List.class,itemType)));
    }
    @SuppressWarnings("unchecked")
    private <T>Series<T> await(CompletableFuture<Series<?>> future) {
        try { return (Series<T>)future.get(190,TimeUnit.SECONDS); }
        catch(InterruptedException e) { Thread.currentThread().interrupt();throw new IllegalStateException("历史查询已中断",e); }
        catch(TimeoutException e) { throw new IllegalStateException("历史查询超时，请稍后重试",e); }
        catch(ExecutionException e) {
            if(e.getCause() instanceof RuntimeException runtime)throw runtime;
            throw new IllegalStateException("历史查询失败",e.getCause());
        }
    }
    public <T>Series<T> get(HistoricalDataset dataset,double lat,double lon,Class<T> itemType,Supplier<List<T>> loader) {
        var point=new Point(lat,lon);
        for(int attempt=0;attempt<3;attempt++) {
            var snapshot=store.snapshot(dataset);
            var stored=store.read(dataset,point,snapshot);
            if(stored.isPresent()&&complete(stored.get(),snapshot))return decode(stored.get(),itemType,snapshot);
            var request=new Request(dataset,point.key(),snapshot.revision());
            var own=new CompletableFuture<Series<?>>();
            var other=pending.putIfAbsent(request,own);
            try {
                if(other!=null)return await(other);
                // Recheck after taking ownership: a preceding request may just have published.
                stored=store.read(dataset,point,snapshot);
                if(stored.isPresent()&&complete(stored.get(),snapshot)) {
                    var result=decode(stored.get(),itemType,snapshot);own.complete(result);return result;
                }
                List<T> items=store.loadRaw(loader);
                var payload=mapper.valueToTree(items);
                if(store.revision(dataset)!=snapshot.revision())throw new Changed();
                if(!complete(payload,snapshot))throw new IllegalStateException("历史月份不完整，请重新查询");
                store.write(dataset,point,snapshot,payload);
                var result=new Series<>(snapshot.version(),List.copyOf(items));own.complete(result);return result;
            } catch(Changed changed) { if(other==null)own.completeExceptionally(changed); }
            catch(RuntimeException error) { if(other==null)own.completeExceptionally(error);throw error; }
            finally { if(other==null)pending.remove(request,own); }
        }
        throw new IllegalStateException("历史数据正在更新，请稍后重试");
    }

    /** One grid scan warms every missing fixed point; HTTP queries share these futures. */
    public <T>int warm(HistoricalDataset dataset,List<Point> points,Class<T> itemType,Function<List<Point>,Map<Point,List<T>>> loader) {
        var snapshot=store.snapshot(dataset);
        if(snapshot.months().isEmpty())return 0;
        var fresh=store.freshPoints(dataset,snapshot);
        var owned=new LinkedHashMap<Point,CompletableFuture<Series<?>>>();
        for(var point:points.stream().distinct().toList()) {
            if(fresh.contains(point.key()))continue;
            var future=new CompletableFuture<Series<?>>();
            if(pending.putIfAbsent(new Request(dataset,point.key(),snapshot.revision()),future)==null)owned.put(point,future);
        }
        if(owned.isEmpty())return 0;
        try {
            var results=store.loadRaw(()->loader.apply(List.copyOf(owned.keySet())));
            if(store.revision(dataset)!=snapshot.revision())throw new Changed();
            var payloads=new LinkedHashMap<Point,JsonNode>();
            for(var point:owned.keySet()) {
                var payload=mapper.valueToTree(results.getOrDefault(point,List.of()));
                if(!complete(payload,snapshot))throw new IllegalStateException("预计算月份不完整："+point.key());
                payloads.put(point,payload);
            }
            for(var entry:owned.entrySet()) {
                var payload=payloads.get(entry.getKey());
                store.write(dataset,entry.getKey(),snapshot,payload);
                entry.getValue().complete(decode(payload,itemType,snapshot));
            }
            return owned.size();
        } catch(RuntimeException error) {
            owned.values().forEach(future->future.completeExceptionally(error));throw error;
        } finally {
            owned.forEach((point,future)->pending.remove(new Request(dataset,point.key(),snapshot.revision()),future));
        }
    }
}
