import test from 'node:test';
import assert from 'node:assert/strict';
import {createHistoryQueryCache} from '../src/utils/historyQueryCache.js';
const point={lat:11.716562,lon:-133.455057};
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
test('same point and type share one in-flight request, then reuse cached data',async()=>{
  const work=deferred();let calls=0;
  const cache=createHistoryQueryCache({fetchVersions:async()=>({wave:'1:1'}),fetchDataset:()=>{calls++;return work.promise;}});
  const a=cache.load('wave',point),b=cache.load('wave',point);
  await new Promise(setImmediate);assert.equal(calls,1);
  const data={dataVersion:'1:1',items:[{year:2026,month:1}]};work.resolve(data);
  assert.equal(await a,data);assert.equal(await b,data);assert.equal(await cache.load('wave',point),data);assert.equal(calls,1);
});
test('an updated data version invalidates old results and includes new years',async()=>{
  let revision='1:1',calls=0;
  const cache=createHistoryQueryCache({fetchVersions:async()=>({current:revision}),fetchDataset:async()=>({dataVersion:revision,items:[{year:++calls===1?2025:2026,month:1}]})});
  assert.equal((await cache.load('current',point)).items[0].year,2025);
  revision='1:2';await cache.refreshVersions({force:true});assert.equal(cache.peek('current',point),null);
  assert.equal((await cache.load('current',point)).items[0].year,2026);assert.equal(calls,2);
});
test('aborting one subscriber leaves a shared query available to the other',async()=>{
  const work=deferred();let sharedSignal;
  const cache=createHistoryQueryCache({fetchVersions:async()=>({wind:'1:1'}),fetchDataset:(type,params,{signal})=>{sharedSignal=signal;return work.promise;}});
  const control=new AbortController();const a=cache.load('wind',point,{signal:control.signal}),b=cache.load('wind',point);
  await new Promise(setImmediate);control.abort();await assert.rejects(a,{name:'AbortError'});assert.equal(sharedSignal.aborted,false);
  work.resolve({dataVersion:'1:1',items:[]});await b;
});
test('obsolete queries abort and cannot publish cached data',async()=>{
  const work=deferred();let signal;
  const cache=createHistoryQueryCache({fetchVersions:async()=>({current:'1:1'}),fetchDataset:(type,params,options)=>{signal=options.signal;return work.promise;}});
  const control=new AbortController();const result=cache.load('current',point,{signal:control.signal});
  await new Promise(setImmediate);control.abort();await assert.rejects(result,{name:'AbortError'});
  await new Promise(setImmediate);assert.equal(signal.aborted,true);
  work.resolve({dataVersion:'1:1',items:[]});await new Promise(setImmediate);assert.equal(cache.peek('current',point),null);
});
test('points and types remain separate and failed queries can be retried',async()=>{
  let calls=0;
  const cache=createHistoryQueryCache({fetchVersions:async()=>({wave:'1:1',wind:'1:1'}),fetchDataset:async(type)=>{if(++calls===1)throw new Error('temporary failure');return {dataVersion:'1:1',type,items:[]};}});
  await assert.rejects(cache.load('wave',point));await cache.load('wave',point);
  await cache.load('wave',{...point,lat:12});await cache.load('wind',point);assert.equal(calls,4);
});
