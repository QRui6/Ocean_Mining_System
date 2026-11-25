<template>
  <transition name="workspace-fade">
    <div v-if="show" class="absolute right-6 top-36 bottom-6 z-40 w-[27rem] pointer-events-none font-['Noto_Sans_SC']">
      <div class="tech-panel-enhanced pointer-events-auto relative flex h-full min-h-0 flex-col overflow-hidden">
        <div class="corner-decoration corner-tl"></div><div class="corner-decoration corner-br"></div>
        <section class="flex min-h-0 flex-1 flex-col p-4">
          <div class="flex items-center justify-between border-b border-cyan-500/30 pb-3">
            <h3 class="text-xl font-bold text-white">历史海况统计</h3>
            <button class="floating-panel-close-btn floating-panel-close-btn--inline" title="关闭" @click="emit('close')">✕</button>
          </div>
          <div class="my-3 flex gap-3 text-sm text-slate-200">
            <select v-model.number="month" aria-label="统计月份" class="border border-cyan-500/30 bg-slate-950 px-2 py-1">
              <option v-for="m in months" :key="m" :value="m">{{ m }}月</option>
            </select>
            <select v-if="days.length" v-model.number="day" class="border border-cyan-500/30 bg-slate-950 px-2 py-1"><option v-for="d in days" :key="d" :value="d">{{ d }}日</option></select>
            <span class="self-center text-cyan-100">{{ metric.label }}</span>
            <span class="ml-auto">{{ yearsLabel }}</span>
          </div>
          <div v-if="loading" class="m-auto text-slate-300">加载中</div>
          <div v-else-if="errorMessage" class="m-auto text-rose-200">{{ errorMessage }}</div>
          <div v-else ref="trendRef" class="min-h-0 flex-1"></div>
        </section>
        <section class="flex min-h-0 flex-1 flex-col border-t border-cyan-500/30 p-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-bold text-white">历年同期分布</h3>
            <button class="border border-cyan-500/30 px-2 py-1 text-xs text-cyan-100" @click="details = !details">{{ details ? '分布' : '明细' }}</button>
          </div>
          <div v-if="details" class="custom-scrollbar mt-3 min-h-0 flex-1 overflow-auto">
            <table class="w-full text-sm text-slate-200"><thead><tr><th class="p-2 text-left">年份</th><th class="p-2 text-right">{{ metric.label }}（{{ metric.unit }}）</th></tr></thead>
              <tbody><tr v-for="r in cohort" :key="r.key" class="border-t border-slate-700"><td class="p-2">{{ r.year || r.key.slice(0,4) }}</td><td class="p-2 text-right">{{ Number(r[metricKey]).toFixed(2) }}</td></tr></tbody>
            </table>
          </div>
          <div v-else ref="distributionRef" class="mt-3 min-h-0 flex-1"></div>
        </section>
      </div>
    </div>
  </transition>
</template>
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts';
import { darkChartTooltip } from '../../utils/chartTooltip.js';
const props = defineProps({ show: Boolean, loading: Boolean, selectedArea: Object, selectedPoint: Object, records: { type: Array, default: () => [] }, selectedRecord: Object, filters: Object, errorMessage: String });
const emit = defineEmits(['close']);
const month = ref(1), details = ref(false), trendRef = ref(null), distributionRef = ref(null);
const metricKey = computed(() => ({wind:'windSpeed',wave:'waveHeight',current:'currentSpeed'}[props.filters?.dataType] || 'waveHeight'));
const metrics = [{key:'windSpeed',label:'风速',unit:'m/s'},{key:'waveHeight',label:'浪高',unit:'m'},{key:'currentSpeed',label:'流速',unit:'m/s'}];
const metric = computed(() => metrics.find(m => m.key === metricKey.value));
const recordMonth = r => Number(r.month || String(r.key).slice(5,7));
const months = computed(() => [...new Set(props.records.map(recordMonth).filter(m => m >= 1 && m <= 12))].sort((a,b)=>a-b));
const day=ref(1);
const recordDay=r=>Number(r.day || (/^\d{4}-\d{2}-\d{2}/.test(r.key) ? r.key.slice(8,10) : 0));
const days=computed(()=>[...new Set(props.records.filter(r=>recordMonth(r)===month.value).map(recordDay).filter(d=>d>=1&&d<=31))].sort((a,b)=>a-b));
watch(days, options=>{if(options.length&&!options.includes(day.value))day.value=options[0];});
const cohort = computed(() => props.records.filter(r => recordMonth(r) === month.value && (!days.value.length || recordDay(r)===day.value) && r[metricKey.value] !== null && r[metricKey.value] !== undefined && r[metricKey.value] !== '' && Number.isFinite(Number(r[metricKey.value]))).sort((a,b)=>String(a.key).localeCompare(String(b.key))));
const yearsLabel = computed(() => cohort.value.length ? `${cohort.value[0].key.slice(0,4)}—${cohort.value.at(-1).key.slice(0,4)}` : '');
let trend, distribution, observer;
const axis = { axisLabel: {color:'#cbd5e1'}, axisLine:{lineStyle:{color:'#475569'}}, splitLine:{lineStyle:{color:'#334155'}} };
const options = (distribution=false) => ({ backgroundColor:'transparent', textStyle:{color:'#cbd5e1'}, tooltip:{...darkChartTooltip,valueFormatter:value=>distribution?`${value} 年`:`${Number(value).toFixed(2)} ${metric.value.unit}`}, grid:{top:30,left:50,right:20,bottom:40}, graphic:cohort.value.length ? [] : [{type:'text',left:'center',top:'middle',style:{text:'暂无数据',fill:'#94a3b8'}}] });
async function render() {
  await nextTick();
  if (!props.show) { trend?.dispose(); distribution?.dispose(); trend=distribution=null; return; }
  if (trendRef.value) {
    if (trend?.getDom() !== trendRef.value) { trend?.dispose(); trend=echarts.init(trendRef.value); }
    trend.setOption({...options(),xAxis:{...axis,type:'category',data:cohort.value.map(r=>r.key.slice(0,4))},yAxis:{...axis,type:'value',name:metric.value.unit},series:[{type:'line',name:metric.value.label,data:cohort.value.map(r=>Number(r[metricKey.value])),connectNulls:false,itemStyle:{color:'#22d3ee'}}]},true);
  }
  if (distributionRef.value) {
    if (distribution?.getDom() !== distributionRef.value) { distribution?.dispose(); distribution=echarts.init(distributionRef.value); }
    const values=cohort.value.map(r=>Number(r[metricKey.value]));
    const lo=values.length?Math.min(...values):0, hi=values.length?Math.max(...values):0;
    const n=hi===lo?1:Math.min(8,Math.ceil(Math.sqrt(values.length))), width=hi===lo?1:(hi-lo)/n;
    const bins=Array.from({length:n},()=>0);
    values.forEach(v=>bins[Math.min(n-1,Math.floor((v-lo)/width))]++);
    distribution.setOption({...options(true),xAxis:{...axis,type:'category',name:metric.value.unit,data:bins.map((_,i)=>hi===lo?lo.toFixed(2):`${(lo+i*width).toFixed(2)}–${(lo+(i+1)*width).toFixed(2)}`),axisLabel:{color:'#cbd5e1',rotate:25}},yAxis:{...axis,type:'value',name:'年份数',minInterval:1},series:[{type:'bar',name:'年份数',data:bins,itemStyle:{color:'#38bdf8'}}]},true);
  } else { distribution?.dispose(); distribution=null; }
}
watch(()=>props.selectedRecord,(r,previous)=>{ if(r && previous && r.key!==previous.key)month.value=recordMonth(r); });
watch(months, ms=>{if(ms.length&&!ms.includes(month.value))month.value=ms[0];});
watch(()=>[props.show,props.loading,props.records,props.errorMessage,month.value,day.value,metricKey.value,details.value],render,{deep:true,flush:'post'});
const resize=()=>{trend?.resize();distribution?.resize();};
onMounted(()=>{observer=new ResizeObserver(resize); if(trendRef.value?.parentElement)observer.observe(trendRef.value.parentElement);window.addEventListener('resize',resize);render();});
onBeforeUnmount(()=>{observer?.disconnect();window.removeEventListener('resize',resize);trend?.dispose();distribution?.dispose();});
</script>
