<template>
  <div class="absolute inset-0 z-50 pointer-events-none">
    <section data-select-boundary style="position:absolute" class="tech-panel-enhanced pointer-events-auto absolute left-8 top-36 bottom-6 w-[28rem] flex flex-col overflow-hidden p-4">
      <div class="flex justify-between border-b border-cyan-500/30 pb-3"><h3 class="text-xl font-bold text-white">浮标监测</h3><button class="floating-panel-close-btn floating-panel-close-btn--inline" @click="$emit('close')">✕</button></div>
      <nav aria-label="浮标视图" class="my-3 flex shrink-0 gap-4 text-sm text-cyan-100">
        <button type="button" aria-pressed="false" class="pb-1" @click="$emit('station')">站点监测</button>
        <button type="button" aria-pressed="true" class="border-b border-cyan-300 pb-1 text-white">通量浮标</button>
      </nav>
      <div class="mb-3 flex shrink-0 items-center justify-between text-sm text-cyan-100"><span>测试数据</span><button @click="mode=mode==='met'?'attitude':'met'">{{ mode==='met'?'姿态数据':'气象数据' }}</button></div>
      <PanelSelect v-model="day" label="观测日期" :options="dayOptions" />
      <PanelSelect v-model="field" label="监测指标" :options="fieldOptions" class="my-3" />
      <div v-if="error" class="text-rose-200">{{ error }}</div><div v-if="loading" class="text-slate-300">加载中</div>
      <div class="text-xs text-slate-300">末次观测</div>
      <div class="mb-3 mt-1 text-3xl text-white">{{ lastObservation ? lastObservation.value.toFixed(2) : '--' }} <span class="text-sm">{{ fields[field]?.unit }}</span></div>
      <div v-if="!loading && !records.length && !error" class="text-slate-400">暂无记录</div>
      <div ref="chartEl" class="min-h-0 flex-1"></div>
    </section>
    <section style="position:absolute" class="tech-panel-enhanced pointer-events-auto absolute right-6 top-36 bottom-6 w-[28rem] flex flex-col overflow-hidden">
      <div class="model-toolbar shrink-0 border-b border-cyan-500/30 p-4 text-cyan-100 font-['Noto_Sans_SC']">
        <nav aria-label="模型视图" class="model-view-buttons">
          <button v-for="view in ['设备近景','系泊示意']" :key="view" type="button" :aria-pressed="modelView===view"
            :class="{ 'is-active': modelView===view }" @click="selectView(view)">{{ view }}</button>
        </nav>
        <div class="model-actions mt-3">
          <label class="flex items-center gap-2 text-sm"><input v-model="showLabels" type="checkbox">标注</label>
          <button type="button" class="model-reset" @click="resetView">复位</button>
        </div>
      </div>
      <div class="relative min-h-0 w-full flex-1">
        <div ref="modelEl" class="absolute inset-0"></div>
        <svg v-if="showLabels" class="pointer-events-none absolute inset-0 h-full w-full" :viewBox="`0 0 ${modelSize.width} ${modelSize.height}`">
          <g v-for="label in modelLabels" :key="label.name">
            <polyline :points="`${label.ax},${label.ay} ${label.endX},${label.y}`" fill="none" stroke="#8cb7c9" stroke-width="0.8"/>
            <circle :cx="label.ax" :cy="label.ay" r="2" fill="#67e8f9"/>
            <text :x="label.x" :y="label.y-5" :text-anchor="label.side==='left'?'start':'end'" class="model-label">
              <tspan v-for="(line,i) in label.lines" :key="i" :x="label.x" :dy="i?14:0">{{line}}</tspan>
            </text>
          </g>
          <g v-if="ruler.length">
            <line x1="13" :y1="ruler[0].y" x2="13" :y2="ruler.at(-1).y" stroke="#8cb7c9"/>
            <g v-for="tick in ruler" :key="tick.label">
              <line x1="10" :y1="tick.y" x2="19" :y2="tick.y" stroke="#8cb7c9"/>
              <text x="21" :y="tick.y+4" class="model-label">{{tick.label}}</text>
            </g>
          </g>
        </svg>
        <div v-if="modelView==='系泊示意'" class="pointer-events-none absolute bottom-3 left-4 text-xs text-slate-300">系泊示意</div>
      </div>
    </section>
  </div>
</template>
<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import * as echarts from 'echarts';
import { darkChartTooltip } from '../../utils/chartTooltip.js';
import PanelSelect from '../common/PanelSelect.vue';
import { lastValidObservation, validObservationValue } from '../../utils/buoyObservationData.js';
import { MOORING_DEPTH, MOORING_LINE, MOORING_TICKS, schematicPoint } from '../../utils/mining/buoySchematic.js';
import * as C from 'cesium';
import { monitoringRequest as request } from '../../api/monitoring.js';
const props=defineProps({getViewer:Function});
defineEmits(['close','station']);
const mode=ref('met'), modelView=ref('系泊示意');
const showLabels=ref(true), modelLabels=ref([]), ruler=ref([]);
const modelSize=ref({width:448,height:820});
let annotationObserver,removeRenderListener,mapMarker;
const anchors=[
  {name:'航标灯',lines:['航标灯'],at:[0,0,5.95],side:'right'},
  {name:'风速风向5',lines:['5 m风速风向','传感器'],at:[-.1,.96,5.16],side:'left'},
  {name:'桅杆',lines:['桅杆'],at:[0,0,4.7],side:'right'},
  {name:'辐射',lines:['辐射传感器'],at:[0,-.7,4.2],side:'right'},
  {name:'风速风向3',lines:['3 m风速风向','传感器'],at:[.18,.96,3.16],side:'left'},
  {name:'温湿度',lines:['温湿度传感器'],at:[0,-.66,3.1],side:'right'},
  {name:'风速风向2',lines:['2 m风速风向','传感器'],at:[-.1,.96,2.16],side:'left'},
  {name:'太阳能',lines:['太阳能板'],at:[.7,0,1],side:'right'},
  {name:'浮筒',lines:['浮筒'],at:[.7,.7,0],side:'left'},
  {name:'采集舱',lines:['电池及采集舱'],at:[0,0,-.5],side:'right'},
  {name:'CTD',lines:['CTD温盐深仪'],at:[0,0,-1.5],side:'left'},
  {name:'系泊缆',lines:['系泊缆'],at:[0,0,-500],side:'left',mooring:true},
  {name:'浮球',lines:['浮球串'],at:[1.1,0,-925],side:'right',mooring:true},
  {name:'重物',lines:['重物'],at:[.65,0,-1250],side:'left',mooring:true},
  {name:'释放器',lines:['声学释放器'],at:[1.1,0,-2900],side:'right',mooring:true},
  {name:'锚',lines:['重力锚'],at:[1.8,0,-MOORING_DEPTH],side:'left',mooring:true}
];
const manifest=ref(null),day=ref(''),field=ref(2),records=ref([]),loading=ref(false),error=ref(''),chartEl=ref(null),modelEl=ref(null);
const lastObservation=computed(()=>lastValidObservation(records.value,field.value));
let chart,viewer,abort,observer,destroyed=false;
const base='/api/buoy-observations/deepsea-flux-test';
const attitudeFields=['横滚','俯仰','偏航','加速度X','加速度Y','加速度Z','角速度X','角速度Y','角速度Z','磁场X','磁场Y','磁场Z'].map((name,i)=>({name,unit:i<3?'°':i<6?'g':i<9?'°/s':'LSB'}));
const fields=computed(()=>mode.value==='met'?(manifest.value?.fields||[]):attitudeFields);
const dayOptions=computed(()=>(manifest.value?.days||[]).map(value=>({value,label:value})));
const fieldOptions=computed(()=>fields.value.map((item,value)=>({value,label:`${item.name} ${item.unit}`})));
async function loadDay() {
  abort?.abort(); const controller=new AbortController();abort=controller;loading.value=true;error.value='';records.value=[];
  try { await renderChart(); if(!day.value || destroyed || controller.signal.aborted)return; const rows=await request(`${base}/${mode.value==='met'?'days':'attitudes'}/${day.value}`,{signal:controller.signal});if(controller.signal.aborted || destroyed)return;records.value=mode.value==='met'?rows:rows.map(r=>({...r,values:[...(r.decoded.angles||[null,null,null]),...(r.decoded.accelerationG||[null,null,null]),...(r.decoded.angularVelocity||[null,null,null]),...(r.decoded.magneticRaw||[null,null,null])],invalid:r.quality.errors}));await renderChart(); }
  catch(e){if(e.name!=='AbortError')error.value=e.message;}finally{if(abort===controller)loading.value=false;}
}
async function renderChart() {
  await nextTick();
  if (!chartEl.value || destroyed) return;
  chart ||= echarts.init(chartEl.value);
  const selectedField = fields.value[field.value];
  chart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      ...darkChartTooltip,
      valueFormatter: value => value == null ? '—' : Number(value).toFixed(2) + ' ' + (selectedField?.unit || '')
    },
    grid: { left: 45, right: 12, top: 20, bottom: 45 },
    xAxis: {
      type: 'category',
      data: records.value.map(record => record.time),
      axisLabel: { formatter: value => value.slice(11), color: '#cbd5e1' }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#cbd5e1' },
      splitLine: { lineStyle: { color: '#334155' } }
    },
    dataZoom: [{ type: 'inside' }],
    series: [{
      type: 'line',
      name: selectedField?.name,
      data: records.value.map(record => validObservationValue(record,field.value)),
      showSymbol: false,
      connectNulls: false,
      sampling: 'lttb',
      lineStyle: { color: '#22d3ee' },
      itemStyle: { color: '#22d3ee' }
    }]
  }, true);
}
const origin=C.Cartesian3.fromDegrees(0,0,0),transform=C.Transforms.eastNorthUpToFixedFrame(origin);
const point=(x,y,z)=>C.Matrix4.multiplyByPoint(transform,new C.Cartesian3(x,y,z),new C.Cartesian3());
function resetView(){
  const closeUp=modelView.value==='设备近景';
  viewer?.camera.lookAt(point(0,0,closeUp?2.2:1.4),new C.HeadingPitchRange(.65,-.14,closeUp?14:17));
}
function selectView(view) {
  modelView.value=view;
  resetView();
  updateAnnotations();
}
function createModel(){
  viewer=new C.Viewer(modelEl.value,{baseLayer:false,globe:false,skyBox:false,skyAtmosphere:false,animation:false,timeline:false,baseLayerPicker:false,geocoder:false,homeButton:false,sceneModePicker:false,navigationHelpButton:false,fullscreenButton:false,selectionIndicator:false,infoBox:false});
  viewer.scene.backgroundColor=C.Color.fromCssColorString('#071526');
  const orientation=C.Transforms.headingPitchRollQuaternion(origin,new C.HeadingPitchRoll());
  viewer.entities.add({name:'海面',position:origin,orientation,plane:{plane:new C.Plane(C.Cartesian3.UNIT_Z,0),dimensions:new C.Cartesian2(14,14),material:C.Color.fromCssColorString('#107eae').withAlpha(.27),outline:true,outlineColor:C.Color.CYAN.withAlpha(.4)}});
  for(let n=-6;n<=6;n+=2)viewer.entities.add({polyline:{positions:[point(-7,n,0),point(7,n,0)],width:1,arcType:C.ArcType.NONE,material:C.Color.CYAN.withAlpha(.14)}});
  viewer.entities.add({name:'辐射横臂',polyline:{positions:[point(0,0,4.1),point(0,-.7,4.1)],width:3,arcType:C.ArcType.NONE,material:C.Color.GOLD}});
  viewer.entities.add({name:'辐射传感器',position:point(0,-.7,4.2),orientation,cylinder:{length:.08,topRadius:.14,bottomRadius:.14,material:C.Color.ALICEBLUE}});

  viewer.scene.light=new C.DirectionalLight({direction:C.Cartesian3.normalize(new C.Cartesian3(-.75, .55, .9),new C.Cartesian3()),intensity:2.2});
  viewer.entities.add({name:'通量浮标',position:origin,model:{uri:import.meta.env.BASE_URL+'models/deepsea-flux-buoy-schematic.glb',imageBasedLightingFactor:new C.Cartesian2(1,1)}});
  // Cesium maps (glTF X,Y,Z) to local (Z,X,Y).
  for(const [height,index] of [[2,2],[3,4],[5,6]]){
    const sensor=viewer.entities.add({name:height+' m风速',position:point(height===3?.18:-.1,.96,height+.16),point:{color:C.Color.CYAN.withAlpha(.7),pixelSize:7,disableDepthTestDistance:Infinity}});
    sensor.metricIndex=index;
  }
  const mooring=opts=>viewer.entities.add(opts);
  const deepPoint=at=>point(...schematicPoint(at));
  mooring({name:'系泊缆',polyline:{positions:MOORING_LINE.map(deepPoint),width:3,arcType:C.ArcType.NONE,material:C.Color.LIGHTSLATEGRAY}});
  // Component symbols have a readable size in the compressed depth view.
  for(let i=0;i<4;i++)mooring({name:'浮球串',position:deepPoint([1.1,0,-850-i*50]),ellipsoid:{radii:new C.Cartesian3(.06,.06,.025),material:C.Color.GOLD}});
  mooring({name:'重物',position:deepPoint([.65,0,-1250]),orientation,box:{dimensions:new C.Cartesian3(.15,.13,.09),material:C.Color.SLATEGRAY}});
  mooring({name:'重力锚',position:deepPoint([1.8,0,-MOORING_DEPTH+90]),orientation,box:{dimensions:new C.Cartesian3(.45,.38,.18),material:C.Color.SLATEGRAY}});
  mooring({name:'声学释放器',position:deepPoint([1.1,0,-2900]),orientation,cylinder:{length:.18,topRadius:.05,bottomRadius:.05,material:C.Color.GOLD}});
  mooring({name:'海底',position:deepPoint([0,0,-MOORING_DEPTH]),orientation,plane:{plane:new C.Plane(C.Cartesian3.UNIT_Z,0),dimensions:new C.Cartesian2(8,5),material:C.Color.fromCssColorString('#344758').withAlpha(.8),outline:true,outlineColor:C.Color.SLATEGRAY}});
  removeRenderListener=viewer.scene.postRender.addEventListener(updateAnnotations);
  annotationObserver=new ResizeObserver(updateAnnotations);
  annotationObserver.observe(modelEl.value);
  viewer.screenSpaceEventHandler.setInputAction(event=>{const hit=viewer.scene.pick(event.position);const node=hit?.detail?.node?.name?.match(/^wind-([235])m$/);const selectedIndex=hit?.id?.metricIndex??(node?({2:2,3:4,5:6}[node[1]]):undefined);if(selectedIndex!==undefined){mode.value='met';nextTick(()=>{field.value=selectedIndex;});}},C.ScreenSpaceEventType.LEFT_CLICK);
  resetView();
}
function updateAnnotations() {
  if(!viewer || viewer.isDestroyed() || !showLabels.value)return;
  const width=modelEl.value.clientWidth,height=modelEl.value.clientHeight;
  const project=at=>C.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene,point(...at));
  const visible=anchors.filter(a=>modelView.value==='系泊示意' ? a.mooring || ['航标灯','太阳能','浮筒'].includes(a.name) : true);
  const labels=[];
  for(const side of ['left','right']){
    const items=visible.filter(a=>a.side===side).map(a=>({...a,projected:project(schematicPoint(a.at))})).filter(a=>a.projected && a.projected.y>=18 && a.projected.y<=height-18);
    items.sort((a,b)=>a.projected.y-b.projected.y);
    let previous=30;
    items.forEach((a,index)=>{
      const upper=height-40-(items.length-index-1)*39;
      const y=Math.max(30,Math.min(upper,Math.max(previous+39,a.projected.y)));
      labels.push({...a,ax:a.projected.x,ay:a.projected.y,y,x:side==='left'?84:width-10,endX:side==='left'?172:width-116});
      previous=y;
    });
  }
  const ticks=MOORING_TICKS.map(z=>({z,projected:project(schematicPoint([0,0,z]))})).filter(t=>t.projected && t.projected.y>=18 && t.projected.y<=height-18).map(t=>({
    y:t.projected.y,label:t.z===0?'0 m 海面':t.z>0?t.z+' m':Math.abs(t.z)+' m'
  })).filter(t=>t.label).sort((a,b)=>a.y-b.y);
  const next=JSON.stringify({labels,ticks,width,height});
  if(next!==lastAnnotationState){
    lastAnnotationState=next;modelLabels.value=labels;ruler.value=ticks;modelSize.value={width,height};
  }
}
let lastAnnotationState='';
function addStationMarker() {
  const v=props.getViewer?.(),location=manifest.value?.location;
  if(!v || !location)return;
  mapMarker=v.entities.add({
    name:manifest.value.name,
    position:C.Cartesian3.fromDegrees(location.longitude,location.latitude),
    properties:{buoyId:manifest.value.stationId},
    billboard:{image:'/image/浮标.png',width:70,height:70,verticalOrigin:C.VerticalOrigin.BOTTOM,disableDepthTestDistance:Infinity},
    label:{text:'通量浮标',font:'14px sans-serif',pixelOffset:new C.Cartesian2(0,18),fillColor:C.Color.CYAN,outlineColor:C.Color.BLACK,outlineWidth:3,style:C.LabelStyle.FILL_AND_OUTLINE,disableDepthTestDistance:Infinity}
  });
  v.camera.flyTo({destination:C.Cartesian3.fromDegrees(location.longitude,location.latitude,600000)});
}
watch(showLabels,()=>{lastAnnotationState='';updateAnnotations();});
watch(day,loadDay);watch(field,renderChart);watch(mode,()=>{field.value=mode.value==='met'?2:0;loadDay();});
onMounted(async()=>{
  try { manifest.value=await request(`${base}/manifest`);if(destroyed)return;day.value=manifest.value.days[0] || '';createModel();addStationMarker(); }
  catch(e){error.value=e.message;}
  observer=new ResizeObserver(()=>chart?.resize());if(chartEl.value)observer.observe(chartEl.value);
});
onBeforeUnmount(()=>{annotationObserver?.disconnect();removeRenderListener?.();const map=props.getViewer?.();if(mapMarker&&map&&!map.isDestroyed())map.entities.remove(mapMarker);destroyed=true;abort?.abort();observer?.disconnect();chart?.dispose();viewer?.destroy();});
</script>

<style scoped>
.model-label{font:12px sans-serif;fill:#e0f2fe;stroke:#071526;stroke-width:3px;paint-order:stroke;stroke-linejoin:round;}
.model-view-buttons{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;font-size:28px;line-height:1.4;white-space:nowrap;}
.model-view-buttons button{padding:6px 8px;border:1px solid rgba(34,211,238,.28);background:rgba(15,23,42,.45);}
.model-view-buttons button.is-active{border-color:#67e8f9;background:rgba(8,145,178,.22);box-shadow:inset 0 -2px #67e8f9;}
.model-actions{display:flex;align-items:center;justify-content:space-between;gap:16px;}
.model-reset{min-width:88px;padding:2px 12px;border:1px solid rgba(34,211,238,.32);font-size:28px;line-height:1.4;}
.model-reset:hover,.model-view-buttons button:hover{border-color:#67e8f9;background:rgba(8,145,178,.22);}
.model-toolbar button:focus-visible{outline:2px solid #67e8f9;outline-offset:2px;}
</style>
