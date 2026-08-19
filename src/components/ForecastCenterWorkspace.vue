<template>
    <transition name="workspace-fade">
        <div v-if="show" class="pointer-events-none absolute inset-0 z-40 font-['Noto_Sans_SC']">
            <div class="pointer-events-none absolute left-8 top-36 w-[27rem] max-h-[54.5rem]">
            <section class="tech-panel-enhanced pointer-events-auto relative flex max-h-[54.5rem] flex-col overflow-hidden p-5" style="clip-path: polygon(0 0,100% 0,100% 95%,92% 100%,0 100%);">
                <div class="absolute left-0 top-0 h-[2px] w-full animate-pulse bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                <div class="corner-decoration corner-tl scale-125"></div><div class="corner-decoration corner-tr scale-125"></div>
                <div class="mb-4 flex items-center border-b-2 border-cyan-500/40 pb-3"><div class="mr-3 h-6 w-1.5 bg-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.8)]"></div><h3 class="flex-1 text-2xl font-bold tracking-wider text-white">预报中心</h3><button class="floating-panel-close-btn floating-panel-close-btn--inline" type="button" title="关闭预报中心" @click="emit('close')">✕</button></div>
                <div class="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-1"><div class="mb-4"><div class="mb-2 text-sm font-bold text-cyan-200">预报区域</div><div class="grid grid-cols-2 gap-2"><button v-for="region in regions" :key="region.regionId" type="button" :class="['border px-3 py-2 text-left text-sm transition-colors', region.regionId === selectedRegionId ? 'border-cyan-300 bg-cyan-950/55 text-white' : 'border-slate-700 bg-slate-950/35 text-slate-300 hover:border-cyan-500']" @click="selectedRegionId = region.regionId">{{ region.regionName || region.regionCode }}</button></div></div>
                <div class="mb-4 border-y border-cyan-500/20 py-3"><div class="mb-2 text-sm font-bold text-cyan-200">预报时段</div><div class="grid grid-cols-3 gap-2"><button v-for="item in ranges" :key="item.value" type="button" :class="['border py-2 text-xs font-bold transition-colors', range === item.value ? 'border-cyan-300 bg-cyan-500/20 text-white' : 'border-slate-700 text-slate-400 hover:border-cyan-500']" @click="range = item.value">{{ item.label }}</button></div></div>
                <div v-if="summary" class="grid grid-cols-2 gap-2 text-xs"><div class="border border-cyan-500/20 bg-slate-950/45 p-3 text-slate-400">综合风险<strong :class="['mt-1 block text-lg', riskClass(summary.riskLevel)]">{{ riskText(summary.riskLevel) }}</strong></div><div class="border border-cyan-500/20 bg-slate-950/45 p-3 text-slate-400">预报基准<strong class="mt-1 block text-sm text-cyan-100">{{ summary.baseDate || '--' }}</strong></div><div class="col-span-2 border border-slate-700/60 bg-slate-950/35 p-3 text-slate-400">有效时段<strong class="mt-1 block text-sm text-slate-100">{{ formatDate(summary.periodStart) }} 至 {{ formatDate(summary.periodEnd) }}</strong></div></div>
                <div v-if="errorMessage" class="mt-3 border border-rose-500/35 bg-rose-950/30 p-3 text-sm text-rose-100">{{ errorMessage }}</div>
                <div class="pt-4 text-xs text-slate-500">切换区域或时段后自动刷新风、浪、流预报与报文。</div></div>
            </section>
            </div>

            <div class="pointer-events-none absolute right-6 top-36 w-[29rem] max-h-[54.5rem]">
            <section class="tech-panel-enhanced pointer-events-auto relative flex max-h-[54.5rem] flex-col overflow-hidden p-5" style="clip-path: polygon(0 0,92% 0,100% 7%,100% 100%,0 100%);">
                <div class="absolute left-0 top-0 h-[2px] w-full animate-pulse bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                <div class="corner-decoration corner-bl scale-125"></div><div class="corner-decoration corner-br scale-125"></div>
                <div class="mb-3 flex items-center justify-between border-b-2 border-cyan-500/40 pb-3"><div><div class="text-xl font-bold text-white">预报报文</div><div class="mt-1 text-xs text-slate-400">{{ selectedRegion?.regionName || '--' }} · {{ rangeLabel }}</div></div><button class="border border-cyan-500/45 bg-cyan-950/45 px-3 py-1.5 text-xs font-bold text-cyan-100 transition-colors hover:bg-cyan-500 hover:text-slate-950 disabled:opacity-40" type="button" :disabled="!selectedRegionId" @click="download">下载报文</button></div>
                <div v-if="bulletinLoading" class="flex flex-1 items-center justify-center text-sm text-slate-400">正在生成预报报文...</div>
                <div v-else class="custom-scrollbar min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap pr-2 text-sm leading-7 text-slate-200">{{ bulletin?.bulletinText || '暂无预报报文' }}</div>
            </section>
            </div>

            <div class="pointer-events-none absolute bottom-16 left-[30rem] right-[31rem] h-[22rem]">
            <section class="tech-panel-enhanced pointer-events-auto relative h-full overflow-hidden p-4">
                <div class="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                <div class="mb-3 flex items-center justify-between"><div><div class="text-lg font-bold text-white">风浪流趋势预报</div><div class="mt-1 text-xs text-slate-400">{{ selectedRegion?.regionName || '--' }} · {{ rangeLabel }} · {{ series.length }} 个预报点</div></div><button class="text-xs font-bold text-cyan-300 hover:text-white" type="button" @click="loadData">刷新</button></div>
                <div class="relative h-[17rem] w-full"><div ref="chartRef" class="h-full w-full"></div><div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-slate-950/55 text-sm text-slate-300">正在加载预报数据...</div></div>
            </section>
            </div>
        </div>
    </transition>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts';
import { downloadForecastBulletin, fetchForecastBulletin, fetchForecastRegions, fetchForecastSeries, fetchForecastSummary } from '../api/forecastWarningBuoy.js';

const props = defineProps({ show: Boolean }); const emit = defineEmits(['close']);
const regions = ref([]); const selectedRegionId = ref(null); const range = ref('12h'); const summary = ref(null); const series = ref([]); const bulletin = ref(null);
const loading = ref(false); const bulletinLoading = ref(false); const errorMessage = ref(''); const chartRef = ref(null); let chart = null;
const ranges = [{ value: '12h', label: '未来12h' }, { value: '7d', label: '未来7天' }, { value: '15d', label: '未来15天' }];
const rangeLabel = computed(() => ranges.find((item) => item.value === range.value)?.label || '--');
const selectedRegion = computed(() => regions.value.find((item) => item.regionId === selectedRegionId.value) || null);
const formatDate = (value) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? '--' : date.toLocaleString('zh-CN', { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); };
const riskText = (level) => ({ SAFE: '安全', MODERATE: '注意', HIGH: '高风险', CRITICAL: '严重' }[level] || '--');
const riskClass = (level) => ({ SAFE: 'text-emerald-300', MODERATE: 'text-amber-200', HIGH: 'text-orange-300', CRITICAL: 'text-rose-300' }[level] || 'text-slate-300');
const renderChart = async () => { await nextTick(); if (!props.show || !chartRef.value) return; if (!chart || chart.getDom() !== chartRef.value) { chart?.dispose(); chart = echarts.init(chartRef.value); } const labels = series.value.map((item) => range.value === '12h' ? formatDate(item.forecastTime) : item.forecastDate); chart.setOption({ backgroundColor: 'transparent', color: ['#22d3ee', '#facc15', '#a78bfa'], tooltip: { trigger: 'axis' }, legend: { top: 0, textStyle: { color: '#cbd5e1' }, data: ['风速', '浪高', '流速'] }, grid: { left: 48, right: 50, top: 36, bottom: 42 }, xAxis: { type: 'category', data: labels, axisLabel: { color: '#94a3b8', fontSize: 10, hideOverlap: true }, axisLine: { lineStyle: { color: '#334155' } } }, yAxis: [{ type: 'value', name: 'm/s', axisLabel: { color: '#94a3b8' }, nameTextStyle: { color: '#94a3b8' }, splitLine: { lineStyle: { color: 'rgba(71,85,105,.35)' } } }, { type: 'value', name: 'm', position: 'right', axisLabel: { color: '#94a3b8' }, nameTextStyle: { color: '#94a3b8' }, splitLine: { show: false } }], series: [{ name: '风速', type: 'line', smooth: true, showSymbol: false, data: series.value.map((item) => item.windSpeedAvg), lineStyle: { width: 2 } }, { name: '浪高', type: 'line', smooth: true, yAxisIndex: 1, showSymbol: false, data: series.value.map((item) => item.waveHeightAvg), lineStyle: { width: 2 } }, { name: '流速', type: 'line', smooth: true, showSymbol: false, data: series.value.map((item) => item.currentSpeedAvg), lineStyle: { width: 2 } }] }, true); };
const loadData = async () => { if (!selectedRegionId.value) return; loading.value = true; bulletinLoading.value = true; errorMessage.value = ''; try { const [nextSummary, nextSeries, nextBulletin] = await Promise.all([fetchForecastSummary(selectedRegionId.value, range.value), fetchForecastSeries(selectedRegionId.value, range.value), fetchForecastBulletin(selectedRegionId.value, range.value)]); summary.value = nextSummary; series.value = Array.isArray(nextSeries) ? nextSeries : []; bulletin.value = nextBulletin; } catch (error) { errorMessage.value = `预报数据加载失败：${error.message}`; } finally { loading.value = false; bulletinLoading.value = false; await nextTick(); await renderChart(); } };
const initialise = async () => { try { regions.value = await fetchForecastRegions(); const pacific = regions.value.find((item) => String(item.regionName || '').includes('太平洋')); selectedRegionId.value = pacific?.regionId || regions.value[0]?.regionId || null; await loadData(); } catch (error) { errorMessage.value = `预报区域加载失败：${error.message}`; } };
const download = async () => { try { await downloadForecastBulletin(selectedRegionId.value, range.value); } catch (error) { errorMessage.value = `报文下载失败：${error.message}`; } };
const handleUpdate = () => { if (props.show) loadData(); };
const resizeChart = () => chart?.resize();
watch(() => props.show, (visible) => { if (visible && !regions.value.length) initialise(); }); watch([selectedRegionId, range], () => { if (props.show && selectedRegionId.value) loadData(); }); watch(series, renderChart);
onMounted(() => { window.addEventListener('resize', resizeChart); window.addEventListener('forecast-bulletin-ready', handleUpdate); if (props.show) initialise(); });
onBeforeUnmount(() => { chart?.dispose(); window.removeEventListener('resize', resizeChart); window.removeEventListener('forecast-bulletin-ready', handleUpdate); });
</script>
