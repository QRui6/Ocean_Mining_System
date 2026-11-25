package com.oceanmining.monitoring.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oceanmining.monitoring.service.HistoricalPointCacheStore.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.function.Supplier;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class HistoricalPointCacheServiceTest {
    public record Row(int year,int month,Double value) {}
    private final ObjectMapper mapper=new ObjectMapper();
    private HistoricalPointCacheStore store() {
        var store=mock(HistoricalPointCacheStore.class);
        when(store.snapshot(any())).thenReturn(new Snapshot(1,List.of("2000-01","2026-01")));
        when(store.revision(any())).thenReturn(1L);
        when(store.read(any(),any(),any())).thenReturn(Optional.empty());
        when(store.loadRaw(any())).thenAnswer(call->((Supplier<?>)call.getArgument(0)).get());
        when(store.freshPoints(any(),any())).thenReturn(Set.of());
        return store;
    }
    @Test void rejectsMissingAndRepeatedMonthsAndKeepsZeroAndNull() {
        var snapshot=new Snapshot(1,List.of("2000-01","2026-01"));
        assertFalse(HistoricalPointCacheService.complete(mapper.valueToTree(List.of(new Row(2000,1,0.0))),snapshot));
        assertFalse(HistoricalPointCacheService.complete(mapper.valueToTree(List.of(new Row(2000,1,0.0),new Row(2000,1,1.0))),snapshot));
        assertTrue(HistoricalPointCacheService.complete(mapper.valueToTree(List.of(new Row(2000,1,0.0),new Row(2026,1,null))),snapshot));
    }
    @Test void partialCacheCannotTruncateAvailableYears() {
        var store=store();
        when(store.read(any(),any(),any())).thenReturn(Optional.of(mapper.valueToTree(List.of(new Row(2000,1,9.0)))));
        var service=new HistoricalPointCacheService(store,mapper);
        var result=service.get(HistoricalDataset.CURRENT,11,-133,Row.class,()->List.of(new Row(2000,1,0.0),new Row(2026,1,null)));
        assertEquals(2,result.items().size());assertEquals(0.0,result.items().get(0).value());
        assertNull(result.items().get(1).value());
        verify(store).write(eq(HistoricalDataset.CURRENT),any(),any(),any());
    }
    @Test void retriesWhenImportCommitsDuringExtraction() {
        var store=store();var revision=new AtomicLong(1);var calls=new AtomicInteger();
        when(store.snapshot(any())).thenAnswer(call->new Snapshot(revision.get(),List.of("2000-01","2026-01")));
        when(store.revision(any())).thenAnswer(call->revision.get());
        var result=new HistoricalPointCacheService(store,mapper).get(HistoricalDataset.CURRENT,11,-133,Row.class,()->{
            int n=calls.incrementAndGet();if(n==1)revision.incrementAndGet();
            return List.of(new Row(2000,1,(double)n),new Row(2026,1,null));
        });
        assertEquals(2,calls.get());assertEquals("1:2",result.version());assertEquals(2.0,result.items().get(0).value());
        verify(store,times(1)).write(any(),any(),any(),any());
    }
    @Test void samePointRequestsShareOneExtraction() throws Exception {
        var store=store();var saved=new AtomicReference<JsonNode>();
        when(store.read(any(),any(),any())).thenAnswer(call->Optional.ofNullable(saved.get()));
        doAnswer(call->{saved.set(call.getArgument(3));return null;}).when(store).write(any(),any(),any(),any());
        var service=new HistoricalPointCacheService(store,mapper);
        var entered=new CountDownLatch(1);var release=new CountDownLatch(1);var calls=new AtomicInteger();
        Supplier<List<Row>> loader=()->{calls.incrementAndGet();entered.countDown();try{assertTrue(release.await(3,TimeUnit.SECONDS));}catch(InterruptedException e){throw new RuntimeException(e);}return List.of(new Row(2000,1,0.0),new Row(2026,1,2.0));};
        var pool=Executors.newFixedThreadPool(2);
        try {
            var first=pool.submit(()->service.get(HistoricalDataset.CURRENT,11,-133,Row.class,loader));
            assertTrue(entered.await(2,TimeUnit.SECONDS));
            var second=pool.submit(()->service.get(HistoricalDataset.CURRENT,11,-133,Row.class,loader));
            assertThrows(TimeoutException.class,()->second.get(50,TimeUnit.MILLISECONDS));
            release.countDown();assertEquals(first.get().items(),second.get().items());assertEquals(1,calls.get());
        } finally {release.countDown();pool.shutdownNow();}
    }
    @Test void batchMustBeCompleteForEveryPointBeforePublication() {
        var store=store();var service=new HistoricalPointCacheService(store,mapper);
        var a=new Point(11,-133);var b=new Point(12,-134);
        assertThrows(IllegalStateException.class,()->service.warm(HistoricalDataset.CURRENT,List.of(a,b),Row.class,
            points->Map.of(a,List.of(new Row(2000,1,0.0),new Row(2026,1,1.0)),b,List.of(new Row(2000,1,2.0)))));
        verify(store,never()).write(any(),any(),any(),any());
    }
}
