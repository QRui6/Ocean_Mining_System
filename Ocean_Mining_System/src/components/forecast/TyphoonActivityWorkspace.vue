<template>
  <section style="position:absolute" class="typhoon-activity-panel tech-panel-enhanced pointer-events-auto right-6 top-36 z-50 flex w-[30rem] flex-col overflow-hidden p-4 font-['Noto_Sans_SC']">
    <header class="flex shrink-0 items-center justify-between border-b border-cyan-500/30 pb-3"><h3 class="text-xl font-bold text-white">台风活动</h3><button class="floating-panel-close-btn floating-panel-close-btn--inline" title="关闭台风活动" @click="$emit('close')">✕</button></header>
    <PanelSelect v-model="areaId" label="台风查询矿区" class="my-3" :options="areaOptions" overlay :max-height="240" />
    <div class="mb-3 flex shrink-0 gap-4 text-sm text-cyan-100"><button v-for="item in ['活动预报','历史回放']" :key="item" :class="mode===item?'border-b border-cyan-300 text-white':''" @click="mode=item">{{ item }}</button><label class="ml-auto"><input v-model="showBuffer" type="checkbox"> 500 km范围</label></div>
    <div v-if="error" class="mb-2 text-sm text-rose-200">{{error}}</div>
    <div class="custom-scrollbar min-h-0 overflow-auto text-sm text-slate-200">
      <template v-if="mode==='活动预报'">
        <div class="flex justify-between"><span>未来5天 · 500 km内集合预报概率</span><button :disabled="loading || data?.loading" @click="refresh">{{ data?.loading?'更新中':'更新' }}</button></div>
        <div class="my-2 text-3xl text-white">{{ data?.probability==null?'—':data.probability.toFixed(1)+'%' }}</div>
        <p v-if="data?.error" class="text-rose-200">{{ data.error }}</p>
        <template v-if="data?.data">
          <div>初始时间 {{ time(data.data.initialTime) }}</div><div class="mb-3">ECMWF ENS · {{ data.totalMembers }}个成员 <span v-if="data.stale" class="text-amber-200">数据已过期</span></div>
          <div v-for="feed in activity" :key="feed.source" class="mb-2"><span class="mr-2 text-cyan-200">{{feed.source}}</span>{{ !feed.ok?'数据获取失败':feed.items.map(s=>s.name||s.typhoonNumber||s.id).join('、')||'暂无活动台风' }}<span v-if="feed.trackError" class="ml-2 text-amber-200">路径获取失败</span></div>
          <template v-if="storms.length">
            <PanelSelect v-model="stormId" label="活动台风" class="my-3" :options="stormOptions" overlay :max-height="240" />
            <div class="flex flex-wrap gap-3"><label v-for="src in sources" :key="src"><input v-model="enabled" type="checkbox" :value="src"> {{src}}</label></div>
            <PanelSelect v-if="enabled.includes('ECMWF ENS')" v-model="member" label="集合成员" class="my-2" :options="memberOptions" overlay :max-height="240" />
            <div v-if="selectedPoint" class="my-2"><div>经度 {{selectedPoint.lon.toFixed(2)}}° · 纬度 {{selectedPoint.lat.toFixed(2)}}°</div><div v-if="selectedPoint.windMs!=null">风速 {{selectedPoint.windMs.toFixed(1)}} m/s</div><div v-if="selectedPoint.pressureHpa!=null">气压 {{selectedPoint.pressureHpa.toFixed(0)}} hPa</div><div v-if="data.currentDistances?.[stormId]!=null">距矿区 {{data.currentDistances[stormId].toFixed(1)}} km</div><div v-if="data.nearest?.[stormId]">最近预报时次 {{time(data.nearest[stormId].time)}} · {{data.nearest[stormId].distance.toFixed(1)}} km</div></div>
          </template>
        </template><p v-else class="mt-3">{{ loading || data?.loading ? '加载中' : '暂无集合预报' }}</p>
      </template>
      <template v-else>
        <p v-if="archiveLoading">加载中</p><p v-else-if="!cases.length && !error">暂无历史记录</p>
        <PanelSelect v-if="cases.length" v-model="sid" label="历史台风" :options="caseOptions" overlay :max-height="240" />
        <template v-if="historyPoint">
          <div class="history-readout my-3" aria-live="off">
            <div class="text-cyan-200">{{ time(historyPoint.time) }}</div>
            <div>经度 {{ historyPoint.lon.toFixed(2) }}° · 纬度 {{ historyPoint.lat.toFixed(2) }}°</div>
            <div>风速 {{ metricText(historyPoint.wmoWind, 0, 'kt') }}</div>
            <div>气压 {{ metricText(historyPoint.wmoPres, 0, 'hPa') }}</div>
            <div>距矿区 {{ metricText(historyPoint.distanceToAreaKm, 1, 'km') }}</div>
          </div>
        </template>
      </template>
    </div>
    <footer v-if="mode==='历史回放' && archivePoints.length" class="mt-3 flex shrink-0 items-center gap-3 border-t border-cyan-500/30 pt-3">
      <input v-model.number="frame" type="range" aria-label="历史时次" min="0" :max="archivePoints.length-1" class="min-w-0 flex-1" @input="playing=false">
      <button type="button" class="control playback-button" @click="togglePlayback">{{ playing ? '暂停' : '播放' }}</button>
    </footer>
  </section>
</template>
<script setup>
import {computed,onBeforeUnmount,onMounted,ref,watch} from 'vue';
import * as C from 'cesium';
import {monitoringRequest as request} from '../../api/monitoring.js';
import {fetchForecastTargets} from '../../api/forecastWarningBuoy.js';
import {fetchMiningAreaTyphoonAllEvents,fetchTyphoonTrack} from '../../api/typhoonHistory.js';
import PanelSelect from '../common/PanelSelect.vue';
const props=defineProps({getViewer:Function,mineId:String});
const emit = defineEmits(['close','select-target']);
const areas=ref([]),areaId=ref(''),data=ref(null),mode=ref('活动预报'),error=ref(''),loading=ref(false),showBuffer=ref(true);
const stormId=ref(''),member=ref(''),enabled=ref(['ECMWF ENS','ECMWF IFS','JMA','NHC']);
const cases=ref([]),sid=ref(''),archivePoints=ref([]),archiveLoading=ref(false),frame=ref(0),playing=ref(false);
const historyPoint=computed(()=>archivePoints.value[frame.value]);
const allTracks=computed(()=>data.value?.tracks||[]);
const sources=computed(()=>[...new Set(allTracks.value.map(t=>t.source))]);
const storms=computed(()=>[...new Set(allTracks.value.map(t=>t.stormId))]);
const areaOptions=computed(()=>areas.value.map(area=>({value:area.id,label:area.name})));
const stormOptions=computed(()=>[{value:'',label:'全部活动台风'},...storms.value.map(id=>({value:id,label:id}))]);
const memberOptions=computed(()=>[{value:'',label:'全部成员'},...members.value.map(value=>({value:String(value),label:`成员 ${value}`}))]);
const caseOptions=computed(()=>cases.value.map(event=>({value:event.sid,label:`${event.name||event.sid} · ${String(event.closestTime||event.influenceStart||event.sid).slice(0,10)}`})));
const metricText=(value,digits,unit)=>value==null||!Number.isFinite(Number(value))?'--':`${Number(value).toFixed(digits)} ${unit}`;
const members=computed(()=>[...new Set(allTracks.value.filter(t=>t.source==='ECMWF ENS'&&(!stormId.value||t.stormId===stormId.value)).map(t=>t.member))].sort((a,b)=>a-b));
const selectedPoint=computed(()=>{
  const first=allTracks.value.find(t=>t.stormId===stormId.value)?.points[0];
  return first?{...first,...data.value?.data?.observedStorms?.[stormId.value]}:null;
});
const activity=computed(()=>(data.value?.data?.activity||[]).map(a=>({...a,items:a.source==='NHC'?(a.data?.activeStorms||[]):Array.isArray(a.data)?a.data:[]})));
const time=t=>t?new Date(t).toLocaleString('zh-CN',{hour12:false}):'—';
let entities=[],bufferSource,poll,playback,loadId=0,archiveId=0,trackId=0,bufferId=0,disposed=false,marker;
function clearPaths(){
  const v=props.getViewer?.();
  if(v&&!v.isDestroyed())entities.forEach(e=>v.entities.remove(e));
  entities=[];marker=null;
}
function visibleTracks(){
  if(mode.value==='历史回放')return [{source:'历史',points:archivePoints.value}];
  return allTracks.value.filter(t=>enabled.value.includes(t.source)&&(!stormId.value||stormId.value===t.stormId)&&(!member.value||t.source!=='ECMWF ENS'||String(t.member)===member.value));
}
function drawPaths(){
  clearPaths();const v=props.getViewer?.();if(!v||disposed)return;
  for(const track of visibleTracks()){
    if(!track.points.length)continue;
    const p=track.points;
    const color=({'ECMWF IFS':C.Color.ORANGE,JMA:C.Color.LIME,NHC:C.Color.MAGENTA,'历史':C.Color.CYAN})[track.source]||C.Color.fromHsl((track.member*.618)%1,.65,.65,.75);
    if(p.length>1)entities.push(v.entities.add({polyline:{positions:C.Cartesian3.fromDegreesArray(p.flatMap(x=>[x.lon,x.lat])),width:track.source==='ECMWF ENS'?1.5:3,material:color}}));
    else entities.push(v.entities.add({position:C.Cartesian3.fromDegrees(p[0].lon,p[0].lat),point:{pixelSize:5,color}}));
  }
  if(mode.value==='历史回放'&&historyPoint.value){marker=v.entities.add({position:C.Cartesian3.fromDegrees(historyPoint.value.lon,historyPoint.value.lat),point:{pixelSize:10,color:C.Color.GOLD,disableDepthTestDistance:Infinity}});entities.push(marker);}
  v.scene.requestRender();
}
async function drawBuffer(){
  const id=++bufferId,v=props.getViewer?.();if(!v)return;
  if(bufferSource){v.dataSources.remove(bufferSource,true);bufferSource=null;}
  if(showBuffer.value&&data.value?.buffer){
    const source=await C.GeoJsonDataSource.load(data.value.buffer,{stroke:C.Color.CYAN,fill:C.Color.CYAN.withAlpha(.06),strokeWidth:2});
    if(disposed||id!==bufferId)return;
    bufferSource=source;await v.dataSources.add(source);
  }
  v.scene.requestRender();
}
function locate(p){if(p)props.getViewer?.()?.camera.flyTo({destination:C.Cartesian3.fromDegrees(p.lon,p.lat,5500000)});}
async function load(){
  clearTimeout(poll);const id=++loadId;loading.value=true;
  try{
    const response=await request('/api/typhoon-forecast?areaId='+encodeURIComponent(areaId.value));
    if(disposed||id!==loadId)return;data.value=response;
    if(response.loading)poll=setTimeout(load,5000);
  }catch(e){if(id===loadId)error.value=e.message;}
  finally{if(id===loadId)loading.value=false;}
}
async function refresh(){try{await request('/api/typhoon-forecast/refresh',{method:'POST'});await load();}catch(e){error.value=e.message;}}
async function loadCases(){
  const id=++archiveId;cases.value=[];sid.value='';archivePoints.value=[];archiveLoading.value=true;
  try{const list=await fetchMiningAreaTyphoonAllEvents(areaId.value,{bufferKm:500});if(disposed||id!==archiveId)return;cases.value=list;sid.value=list[0]?.sid||'';}
  catch(e){if(id===archiveId)error.value=e.message;}finally{if(id===archiveId)archiveLoading.value=false;}
}
async function loadTrack(){
  const id=++trackId;playing.value=false;archivePoints.value=[];frame.value=0;if(!sid.value)return;
  try{const t=await fetchTyphoonTrack(sid.value,{areaId:areaId.value,bufferKm:500});if(disposed||id!==trackId)return;archivePoints.value=t.points.filter(p=>p.lat!=null&&p.lon!=null);locate(historyPoint.value);}
  catch(e){if(id===trackId)error.value=e.message;}
}
function togglePlayback(){if(frame.value===archivePoints.value.length-1)frame.value=0;playing.value=!playing.value;}
watch(areaId, id => {
  playing.value=false;error.value='';data.value=null;stormId.value='';member.value='';
  const target = areas.value.find(item => item.id === id);
  if (target) emit('select-target', target);
  load();
  if(mode.value==='历史回放')loadCases();
});
watch(() => props.mineId, id => {
  if (areas.value.some(area => area.id === id)) areaId.value = id;
});
watch(mode,()=>{playing.value=false;error.value='';if(mode.value==='历史回放')loadCases();drawPaths();});
watch(sid,loadTrack);
watch(stormId,()=>{member.value='';locate(selectedPoint.value);});
watch([allTracks,enabled,member,stormId,archivePoints],drawPaths,{deep:true});
watch([showBuffer,()=>data.value?.buffer],drawBuffer);
watch(frame,()=>{if(marker&&historyPoint.value){marker.position=C.Cartesian3.fromDegrees(historyPoint.value.lon,historyPoint.value.lat);props.getViewer?.()?.scene.requestRender();}});
onMounted(async()=>{
  playback=setInterval(()=>{if(playing.value){if(frame.value+1<archivePoints.value.length)frame.value++;else playing.value=false;}},350);
  try {
    const rows = await fetchForecastTargets();
    if (!disposed) {
      areas.value = rows;
      areaId.value = rows.find(area => area.id === props.mineId)?.id || rows[0]?.id || '';
    }
  } catch(e) { if(!disposed) error.value=e.message; }
});
onBeforeUnmount(()=>{disposed=true;loadId++;archiveId++;trackId++;bufferId++;clearTimeout(poll);clearInterval(playback);clearPaths();const v=props.getViewer?.();if(bufferSource&&v&&!v.isDestroyed())v.dataSources.remove(bufferSource,true);});
</script>
<style scoped>
.typhoon-activity-panel{height:auto;max-height:calc(100% - 10.5rem);}
.history-readout{height:120px;}
.history-readout>div{height:24px;line-height:24px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums;}
.playback-button{width:72px;min-height:36px;flex:0 0 72px;font-size:14px;font-weight:700;}
.control{background:#091726;border:1px solid #285367;color:#dce9f0;padding:.38rem .55rem}
</style>
