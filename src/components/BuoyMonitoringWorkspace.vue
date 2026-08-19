<template>
    <transition name="workspace-fade">
        <div v-if="show" class="pointer-events-none absolute inset-0 z-40 font-['Noto_Sans_SC']">
            <div class="pointer-events-none absolute left-8 top-36 w-[28rem] max-h-[54.5rem]">
            <section class="tech-panel-enhanced pointer-events-auto relative flex max-h-[54.5rem] flex-col overflow-hidden p-5" style="clip-path: polygon(0 0,100% 0,100% 95%,92% 100%,0 100%);">
                <div class="absolute left-0 top-0 h-[2px] w-full animate-pulse bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                <div class="corner-decoration corner-tl scale-125"></div><div class="corner-decoration corner-tr scale-125"></div>
                <div class="mb-4 flex shrink-0 items-center border-b-2 border-cyan-500/40 pb-3">
                    <div class="mr-3 h-6 w-1.5 bg-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.8)]"></div>
                    <h3 class="flex-1 text-2xl font-bold tracking-wider text-white">浮标监测</h3>
                    <button class="floating-panel-close-btn floating-panel-close-btn--inline" type="button" title="关闭浮标监测" @click="emit('close')">✕</button>
                </div>
                <div class="mb-3 grid grid-cols-2 gap-2 text-xs">
                    <div class="border border-cyan-500/20 bg-slate-950/45 px-3 py-2 text-slate-400">监测浮标<strong class="mt-1 block text-lg text-cyan-100">{{ buoys.length }}</strong></div>
                    <div class="border border-cyan-500/20 bg-slate-950/45 px-3 py-2 text-slate-400">更新时间<strong class="mt-1 block text-xs text-cyan-100">{{ formatTime(selectedRealtime?.timestamp) }}</strong></div>
                </div>
                <div v-if="errorMessage" class="mb-3 border border-rose-500/35 bg-rose-950/30 p-3 text-sm text-rose-100">{{ errorMessage }}</div>
                <div class="mb-2 flex items-center justify-between text-sm font-bold text-cyan-200"><span>西太平洋浮标</span><button class="text-xs text-cyan-300 hover:text-white" type="button" @click="refreshRealtime">刷新</button></div>
                <div class="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pr-2">
                    <button v-for="buoy in buoyRows" :key="buoy.id" type="button" :class="['w-full border p-3 text-left transition-all', selectedBuoyId === buoy.id ? 'border-cyan-300/70 bg-cyan-950/45' : 'border-slate-700/70 bg-slate-950/35 hover:border-cyan-500/45']" @click="selectedBuoyId = buoy.id">
                        <div class="flex items-start justify-between gap-3"><div><div class="text-sm font-bold text-white">{{ buoy.name }}</div><div class="mt-1 text-xs text-slate-400">{{ buoy.id }} · {{ coordinate(buoy.lat, 'N') }} {{ coordinate(buoy.lng, 'E') }}</div></div><span class="text-xs font-bold text-cyan-200">{{ metric(buoy.windSpeed) }} m/s</span></div>
                        <div class="mt-2 grid grid-cols-3 gap-1 border-t border-slate-700/60 pt-2 text-xs text-slate-400"><span>风 {{ metric(buoy.windSpeed) }}</span><span>浪 {{ metric(buoy.waveHeight) }}</span><span>流 {{ metric(buoy.currentSpeed) }}</span></div>
                    </button>
                    <div v-if="!loading && !buoys.length" class="flex h-36 items-center justify-center border border-dashed border-slate-700/50 text-sm text-slate-500">暂无浮标数据</div>
                </div>
            </section>
            </div>

            <div class="pointer-events-none absolute right-6 top-36 w-[28rem] max-h-[54.5rem]">
            <section class="tech-panel-enhanced pointer-events-auto relative flex max-h-[54.5rem] flex-col overflow-hidden p-5" style="clip-path: polygon(0 0,92% 0,100% 7%,100% 100%,0 100%);">
                <div class="absolute left-0 top-0 h-[2px] w-full animate-pulse bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                <div class="corner-decoration corner-bl scale-125"></div><div class="corner-decoration corner-br scale-125"></div>
                <div class="mb-4 border-b-2 border-cyan-500/40 pb-3"><div class="text-2xl font-bold tracking-wider text-white">{{ selectedBuoy?.name || '浮标详情' }}</div><div class="mt-1 text-xs text-slate-400">{{ selectedBuoy?.id || '--' }} · 实时风浪流监测</div></div>
                <div class="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
                <div v-if="selectedRealtime" class="grid grid-cols-1 gap-3">
                    <article v-for="item in realtimeCards" :key="item.name" class="border border-cyan-500/20 bg-slate-950/45 px-4 py-3"><div class="flex items-center justify-between"><span class="font-bold text-cyan-200">{{ item.name }}</span><strong class="text-xl text-white">{{ item.value }} <small class="text-xs text-slate-400">{{ item.unit }}</small></strong></div><div class="mt-2 text-xs text-slate-400">方向 {{ item.direction }}°<span v-if="item.extra"> · {{ item.extra }}</span></div></article>
                </div>
                <div v-else class="flex flex-1 items-center justify-center border border-dashed border-slate-700/50 text-sm text-slate-500">请选择浮标</div>
                <div v-if="history?.statistics" class="mt-4 border-t border-cyan-500/20 pt-3"><div class="mb-2 text-sm font-bold text-cyan-200">{{ rangeLabel }}统计</div><div class="grid grid-cols-3 gap-2 text-xs text-slate-400"><div v-for="item in historyStats" :key="item.name" class="border border-slate-700/60 bg-slate-950/35 p-2"><span>{{ item.name }}</span><strong class="mt-1 block text-cyan-100">{{ item.avg }}</strong><span>均值</span></div></div></div>
                </div>
            </section>
            </div>

            <div :class="['pointer-events-none absolute bottom-16 left-[31rem] right-[31rem] transition-[height] duration-300', historyPanelHeightClass]">
            <section class="tech-panel-enhanced pointer-events-auto relative flex h-full flex-col overflow-hidden p-4" style="clip-path: polygon(0 0,100% 0,100% 100%,0 100%);">
                <div class="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                <div class="mb-3 flex items-center justify-between"><div><div class="text-lg font-bold text-white">历史监测趋势</div><div class="mt-1 text-xs text-slate-400">{{ selectedBuoy?.name || '未选择浮标' }} · {{ history?.total || 0 }} 个监测点</div></div><div class="flex gap-2"><button v-for="item in ranges" :key="item.value" type="button" :class="['border px-3 py-1 text-xs font-bold transition-colors', range === item.value ? 'border-cyan-300 bg-cyan-500/20 text-white' : 'border-slate-700 text-slate-400 hover:border-cyan-500']" @click="range = item.value">{{ item.label }}</button></div></div>
                <div class="relative min-h-0 flex-1">
                    <div class="grid h-full grid-cols-3 gap-3" :class="hasHistory ? 'opacity-100' : 'opacity-0'"><div ref="windChartRef" class="min-w-0"></div><div ref="waveChartRef" class="min-w-0"></div><div ref="currentChartRef" class="min-w-0"></div></div>
                    <div v-if="historyLoading" class="absolute inset-0 flex items-center justify-center text-sm text-slate-400">正在加载历史监测数据...</div>
                    <div v-else-if="historyError" class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-sm text-rose-100"><span>{{ historyError }}</span><button class="border border-cyan-500/45 bg-cyan-950/45 px-4 py-1.5 text-xs font-bold text-cyan-100 transition-colors hover:bg-cyan-500 hover:text-slate-950" type="button" @click="retryHistory">重试</button></div>
                    <div v-else-if="!hasHistory" class="absolute inset-0 flex items-center justify-center text-sm text-slate-500">暂无历史监测数据</div>
                </div>
            </section>
            </div>
        </div>
    </transition>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import * as Cesium from 'cesium';
import * as echarts from 'echarts';
import { fetchBuoyHistory, fetchBuoyRealtime, fetchBuoys } from '../api/forecastWarningBuoy.js';

const props = defineProps({ show: Boolean, getViewer: { type: Function, default: () => null } });
const emit = defineEmits(['close']);
const buoys = ref([]); const realtime = ref([]); const selectedBuoyId = ref(''); const history = ref(null);
const loading = ref(false); const historyLoading = ref(false); const historyError = ref(''); const errorMessage = ref(''); const range = ref('12h');
const windChartRef = ref(null); const waveChartRef = ref(null); const currentChartRef = ref(null);
let refreshTimer = null; let mapEntities = []; let windChart; let waveChart; let currentChart; let historyAbortController = null; let historyRequestId = 0;
const historyCache = new Map();
const ranges = [{ value: '12h', label: '过去12小时' }, { value: '7d', label: '过去7天' }, { value: '15d', label: '过去15天' }];
const rangeLabel = computed(() => ranges.find((item) => item.value === range.value)?.label || '历史数据');
const realtimeById = computed(() => new Map(realtime.value.map((item) => [item.buoyId, item])));
const buoyRows = computed(() => buoys.value.map((buoy) => ({ ...buoy, ...(realtimeById.value.get(buoy.id) || {}) })));
const selectedBuoy = computed(() => buoys.value.find((item) => item.id === selectedBuoyId.value) || null);
const selectedRealtime = computed(() => realtimeById.value.get(selectedBuoyId.value) || null);
const hasHistory = computed(() => Array.isArray(history.value?.points) && history.value.points.length > 0);
const historyPanelHeightClass = computed(() => (hasHistory.value ? 'h-[20rem]' : 'h-[8rem]'));
const metric = (value, digits = 1) => Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : '--';
const coordinate = (value, positive) => `${Math.abs(Number(value)).toFixed(1)}°${Number(value) >= 0 ? positive : positive === 'N' ? 'S' : 'W'}`;
const formatTime = (value) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? '--' : date.toLocaleString('zh-CN', { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); };
const realtimeCards = computed(() => selectedRealtime.value ? [{ name: '风', value: metric(selectedRealtime.value.windSpeed), unit: 'm/s', direction: metric(selectedRealtime.value.windDirection, 0) }, { name: '浪', value: metric(selectedRealtime.value.waveHeight), unit: 'm', direction: metric(selectedRealtime.value.waveDirection, 0), extra: `周期 ${metric(selectedRealtime.value.wavePeriod)} s` }, { name: '流', value: metric(selectedRealtime.value.currentSpeed), unit: 'm/s', direction: metric(selectedRealtime.value.currentDirection, 0) }] : []);
const historyStats = computed(() => [['风速', history.value?.statistics?.windSpeed], ['浪高', history.value?.statistics?.waveHeight], ['流速', history.value?.statistics?.currentSpeed]].map(([name, value]) => ({ name, avg: value ? `${metric(value.avg)} ${value.unit || ''}` : '--' })));

const clearMap = () => { const viewer = props.getViewer?.(); if (viewer) mapEntities.forEach((entity) => viewer.entities.remove(entity)); mapEntities = []; };
const updateMap = () => { clearMap(); const viewer = props.getViewer?.(); if (!viewer) return; buoyRows.value.forEach((buoy) => { if (!Number.isFinite(Number(buoy.lng)) || !Number.isFinite(Number(buoy.lat))) return; const label = ` ${buoy.name}\n风 ${metric(buoy.windSpeed)} m/s · ${metric(buoy.windDirection, 0)}°\n浪 ${metric(buoy.waveHeight)} m · ${metric(buoy.wavePeriod)} s\n流 ${metric(buoy.currentSpeed)} m/s · ${metric(buoy.currentDirection, 0)}°`; mapEntities.push(viewer.entities.add({ id: `buoy-monitor-${buoy.id}`, position: Cesium.Cartesian3.fromDegrees(Number(buoy.lng), Number(buoy.lat), 120), point: { pixelSize: 12, color: buoy.id === selectedBuoyId.value ? Cesium.Color.YELLOW : Cesium.Color.CYAN, outlineColor: Cesium.Color.WHITE, outlineWidth: 2, disableDepthTestDistance: Number.POSITIVE_INFINITY }, label: { text: label, font: '13px sans-serif', fillColor: Cesium.Color.WHITE, outlineColor: Cesium.Color.BLACK, outlineWidth: 3, style: Cesium.LabelStyle.FILL_AND_OUTLINE, showBackground: true, backgroundColor: Cesium.Color.fromCssColorString('#071525').withAlpha(0.88), backgroundPadding: new Cesium.Cartesian2(8, 6), verticalOrigin: Cesium.VerticalOrigin.BOTTOM, pixelOffset: new Cesium.Cartesian2(0, -16), disableDepthTestDistance: Number.POSITIVE_INFINITY } })); }); viewer.scene.requestRender(); };

const chartOption = (title, unit, color, key) => ({ backgroundColor: 'transparent', title: { text: title, left: 4, top: 2, textStyle: { color: '#bae6fd', fontSize: 13, fontWeight: 700 } }, grid: { left: 40, right: 10, top: 34, bottom: 28 }, tooltip: { trigger: 'axis', valueFormatter: (value) => `${value} ${unit}` }, xAxis: { type: 'category', data: (history.value?.points || []).map((item) => formatTime(item.timestamp)), axisLabel: { color: '#94a3b8', fontSize: 9, hideOverlap: true }, axisLine: { lineStyle: { color: '#334155' } } }, yAxis: { type: 'value', name: unit, nameTextStyle: { color: '#94a3b8', fontSize: 9 }, axisLabel: { color: '#94a3b8', fontSize: 9 }, splitLine: { lineStyle: { color: 'rgba(71,85,105,.35)' } } }, series: [{ type: 'line', smooth: true, showSymbol: false, data: (history.value?.points || []).map((item) => item[key]), lineStyle: { color, width: 2 }, areaStyle: { color: `${color}22` } }] });
const renderCharts = async () => { await nextTick(); if (!props.show || !hasHistory.value) return; const configs = [[windChartRef, '风速', 'm/s', '#22d3ee', 'windSpeed', 'windChart'], [waveChartRef, '浪高', 'm', '#facc15', 'waveHeight', 'waveChart'], [currentChartRef, '流速', 'm/s', '#a78bfa', 'currentSpeed', 'currentChart']]; configs.forEach(([chartRef, title, unit, color, key, name]) => { if (!chartRef.value) return; let chart = name === 'windChart' ? windChart : name === 'waveChart' ? waveChart : currentChart; if (!chart || chart.getDom() !== chartRef.value) { chart?.dispose(); chart = echarts.init(chartRef.value); if (name === 'windChart') windChart = chart; else if (name === 'waveChart') waveChart = chart; else currentChart = chart; } chart.setOption(chartOption(title, unit, color, key), true); chart.resize(); }); };
const resizeCharts = () => [windChart, waveChart, currentChart].forEach((chart) => chart?.resize());
const delay = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
const isAbortError = (error) => error?.name === 'AbortError' || /abort/i.test(error?.message || '');
const requestHistory = async (buoyId, nextRange, signal) => {
    try {
        return await fetchBuoyHistory(buoyId, nextRange, { signal });
    } catch (error) {
        if (isAbortError(error)) throw error;
        await delay(800);
        return fetchBuoyHistory(buoyId, nextRange, { signal });
    }
};
const loadHistory = async ({ force = false } = {}) => {
    const buoyId = selectedBuoyId.value;
    const nextRange = range.value;
    if (!buoyId) return;
    const cacheKey = `${buoyId}:${nextRange}`;
    const cached = historyCache.get(cacheKey);
    if (!force && cached && Date.now() - cached.cachedAt < 60 * 1000) {
        history.value = cached.data;
        historyError.value = '';
        historyLoading.value = false;
        await renderCharts();
        return;
    }
    historyAbortController?.abort();
    historyAbortController = new AbortController();
    const requestId = ++historyRequestId;
    historyLoading.value = true;
    historyError.value = '';
    try {
        const data = await requestHistory(buoyId, nextRange, historyAbortController.signal);
        if (requestId !== historyRequestId) return;
        history.value = data;
        historyCache.set(cacheKey, { data, cachedAt: Date.now() });
    } catch (error) {
        if (requestId !== historyRequestId || isAbortError(error)) return;
        historyError.value = `历史数据加载失败：${error.message || '请求超时'}`;
        history.value = null;
    } finally {
        if (requestId !== historyRequestId) return;
        historyLoading.value = false;
        await nextTick();
        if (hasHistory.value) await renderCharts();
        else resizeCharts();
    }
};
const retryHistory = () => loadHistory({ force: true });
const refreshRealtime = async () => { try { realtime.value = await fetchBuoyRealtime(); updateMap(); } catch (error) { errorMessage.value = `实时数据加载失败：${error.message}`; } };
const loadWorkspace = async () => { loading.value = true; errorMessage.value = ''; try { const [list, live] = await Promise.all([fetchBuoys(), fetchBuoyRealtime()]); buoys.value = Array.isArray(list) ? list : []; realtime.value = Array.isArray(live) ? live : []; const selectionChanged = !selectedBuoyId.value || !buoys.value.some((item) => item.id === selectedBuoyId.value); if (selectionChanged) selectedBuoyId.value = buoys.value[0]?.id || ''; updateMap(); if (!selectionChanged) await loadHistory(); } catch (error) { errorMessage.value = `浮标监测暂不可用：${error.message}`; } finally { loading.value = false; } };
const start = async () => { await loadWorkspace(); if (!refreshTimer) refreshTimer = window.setInterval(refreshRealtime, 60000); };
const stop = () => { if (refreshTimer) window.clearInterval(refreshTimer); refreshTimer = null; historyRequestId += 1; historyAbortController?.abort(); historyAbortController = null; clearMap(); };
watch(() => props.show, (visible) => { if (visible) start(); else stop(); }, { immediate: true });
watch([selectedBuoyId, range], () => { if (props.show) { updateMap(); loadHistory(); } });
watch(hasHistory, (available) => { if (available) renderCharts(); }); window.addEventListener('resize', resizeCharts);
onBeforeUnmount(() => { stop(); window.removeEventListener('resize', resizeCharts); [windChart, waveChart, currentChart].forEach((chart) => chart?.dispose()); });
</script>
