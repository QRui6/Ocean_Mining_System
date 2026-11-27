<template>
    <div class="flex min-h-0 flex-1 flex-col overflow-hidden" aria-label="通量浮标模型">
      <div class="model-toolbar flex shrink-0 items-center justify-between gap-2 border-b border-cyan-500/30 p-4 text-cyan-100">
        <nav aria-label="模型视图" class="flex items-center gap-2">
          <button v-for="view in ['设备近景','系泊示意']" :key="view" type="button" :aria-pressed="modelView===view"
            class="model-button" @click="selectView(view)">{{ view }}</button>
        </nav>
        <div class="flex items-center gap-2">
          <button type="button" class="model-button" :aria-pressed="showLabels" @click="showLabels = !showLabels">标注</button>
          <button type="button" class="model-button" @click="resetView">复位</button>
        </div>
      </div>
      <div class="relative min-h-0 w-full flex-1">
        <div ref="modelEl" class="absolute inset-0"></div>
        <div v-if="modelError" class="absolute inset-0 grid place-items-center text-sm text-rose-200">{{ modelError }}</div>
        <svg v-if="showLabels" class="pointer-events-none absolute inset-0 h-full w-full" :viewBox="`0 0 ${modelSize.width} ${modelSize.height}`">
          <g v-for="label in modelLabels" :key="label.name">
            <polyline :points="`${label.ax},${label.ay} ${label.endX},${label.y}`" fill="none" stroke="#8cb7c9" stroke-width="0.8"/>
            <circle :cx="label.ax" :cy="label.ay" r="2" fill="#67e8f9"/>
            <text :x="label.x" :y="label.y-5" :text-anchor="label.side==='left'?'start':'end'" class="model-label">
              <tspan v-for="(line,i) in label.lines" :key="i" :x="label.x" :dy="i?17:0">{{line}}</tspan>
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
      </div>
    </div>
</template>
<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { MOORING_DEPTH, MOORING_LINE, MOORING_TICKS, schematicPoint } from '../../utils/mining/buoySchematic.js';
import * as C from 'cesium';
const emit = defineEmits(['selectMetric']);
const modelView=ref('系泊示意');
const showLabels=ref(true), modelLabels=ref([]), ruler=ref([]);
const modelSize=ref({width:448,height:820});
const modelEl = ref(null);
const modelError = ref('');
let annotationObserver, removeRenderListener, viewer;
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
  viewer.screenSpaceEventHandler.setInputAction(event => {
    const hit = viewer.scene.pick(event.position);
    const node = hit?.detail?.node?.name?.match(/^wind-([235])m$/);
    const index = hit?.id?.metricIndex ?? (node ? { 2: 2, 3: 4, 5: 6 }[node[1]] : undefined);
    if (index !== undefined) emit('selectMetric', index);
  }, C.ScreenSpaceEventType.LEFT_CLICK);
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
watch(showLabels,()=>{lastAnnotationState='';updateAnnotations();});
onMounted(() => {
  try {
    createModel();
  } catch (error) {
    console.warn('浮标模型初始化失败', error);
    modelError.value = '三维模型加载失败';
  }
});
onBeforeUnmount(() => {
  annotationObserver?.disconnect();
  removeRenderListener?.();
  if (viewer && !viewer.isDestroyed()) viewer.destroy();
});
</script>

<style scoped>
.model-label{font:600 14px 'Noto Sans SC',sans-serif;fill:#eef6fa;stroke:#071526;stroke-width:3px;paint-order:stroke;stroke-linejoin:round;}
.model-button {
  height: 36px;
  padding: 0 12px;
  border: 1px solid rgba(34, 211, 238, .4);
  background: rgba(8, 15, 28, .7);
  color: #ffffff;
  font: 700 16px/1 'Noto Sans SC', sans-serif;
  white-space: nowrap;
}
.model-button:hover, .model-button[aria-pressed="true"] {
  border-color: #67e8f9;
  background: rgba(8, 145, 178, .25);
}
.model-toolbar button:focus-visible{outline:2px solid #67e8f9;outline-offset:2px;}
</style>
