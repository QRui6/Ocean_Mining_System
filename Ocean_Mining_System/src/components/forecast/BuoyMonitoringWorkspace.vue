<template>
    <transition name="workspace-fade">
        <div v-if="show" class="pointer-events-none absolute inset-0 z-40 font-['Noto_Sans_SC']">
            <div class="pointer-events-none absolute left-8 top-36 bottom-6 flex w-[28rem] flex-col">
                <section aria-label="浮标监测"
                    class="tech-panel-enhanced pointer-events-auto relative flex min-h-0 max-h-full flex-col overflow-hidden p-5">
                    <div class="corner-decoration corner-tl scale-125"></div>
                    <div class="corner-decoration corner-br scale-125"></div>
                    <header class="mb-4 flex shrink-0 items-center gap-3 border-b-2 border-cyan-500/40 pb-3">
                        <span class="h-6 w-1.5 shrink-0 bg-yellow-400 shadow-[0_0_15px_rgba(255,215,0,.8)]"></span>
                        <h3 class="flex-1 text-2xl font-bold tracking-wider text-white">浮标监测</h3>
                        <button class="floating-panel-close-btn floating-panel-close-btn--inline" type="button"
                            aria-label="关闭浮标监测" title="关闭浮标监测" @click="emit('close')">✕</button>
                    </header>

                    <div class="mb-3 flex shrink-0 items-center justify-between gap-3">
                        <span class="text-sm font-bold text-cyan-200">浮标列表 <small class="ml-1 text-slate-300">{{ filteredBuoys.length }} 个</small></span>
                        <div class="flex items-center gap-2">
                            <button type="button" class="buoy-button" @click="autoRefresh = !autoRefresh">
                                {{ autoRefresh ? '暂停自动刷新' : '恢复自动刷新' }}
                            </button>
                            <button type="button" class="buoy-button" :disabled="refreshing" @click="refreshStations()">
                                {{ refreshing ? '刷新中' : '刷新' }}
                            </button>
                        </div>
                    </div>
                    <div class="mb-3 flex shrink-0 gap-2">
                        <input v-model="searchTerm" type="search" aria-label="搜索浮标" placeholder="搜索名称或编号"
                            class="min-w-0 flex-1 border border-cyan-500/25 bg-slate-950/45 px-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-cyan-400" />
                        <div class="w-28 shrink-0">
                            <PanelSelect v-model="statusFilter" label="浮标状态" :options="statusOptions" overlay :max-height="240" />
                        </div>
                    </div>
                    <p v-if="stationError" role="status" class="mb-3 border border-rose-500/30 bg-rose-950/30 p-2 text-sm text-rose-200">
                        {{ stationError }}
                    </p>
                    <div class="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pr-2">
                        <button v-for="buoy in filteredBuoys" :key="buoy.id" type="button"
                            class="buoy-row w-full p-3 text-left"
                            :aria-pressed="selectedBuoyId === buoy.id"
                            @click="selectBuoy(buoy.id)">
                            <span class="flex items-center justify-between gap-3">
                                <span class="min-w-0 truncate text-base font-bold text-white">{{ buoy.name }}</span>
                                <span v-if="buoy.status" :class="['shrink-0 text-xs font-bold', statusColors[buoy.status]]">
                                    {{ statusNames[buoy.status] }}
                                </span>
                            </span>
                            <span class="mt-1 block text-xs text-slate-300">{{ buoy.source }}</span>
                        </button>
                        <div v-if="!filteredBuoys.length" class="p-5 text-center text-sm text-slate-400">没有符合条件的浮标</div>
                    </div>
                </section>
            </div>

            <div class="absolute right-6 top-36 bottom-6 flex w-[28rem] flex-col">
                <section aria-label="浮标详情"
                    :class="['tech-panel-enhanced pointer-events-auto relative flex min-h-0 max-h-full flex-col overflow-hidden',
                        { 'flex-1': selectedIsFlux }]">
                    <div class="corner-decoration corner-tl scale-125"></div>
                    <div class="corner-decoration corner-br scale-125"></div>
                    <header class="shrink-0 border-b border-cyan-500/30 px-5 py-4">
                        <div class="flex items-center justify-between gap-3">
                            <h3 class="min-w-0 truncate text-xl font-bold text-white">{{ selectedBuoy?.name || '浮标详情' }}</h3>
                            <button v-if="selectedLocation" type="button" class="buoy-button shrink-0" @click="focusSelectedBuoy">定位</button>
                        </div>
                        <div v-if="selectedLocation" class="mt-1 text-xs text-slate-300">
                            <span v-if="!selectedIsFlux">{{ selectedBuoy.id }} · </span>{{ coordinateLabel }}
                        </div>
                        <div v-if="selectedReading" class="mt-2 flex items-center justify-between gap-2 text-xs">
                            <span :class="['font-bold', riskStyles[selectedBuoy.risk].text]">{{ riskStyles[selectedBuoy.risk].label }}</span>
                            <span class="text-slate-300">更新 {{ formatTime(selectedReading.timestamp) }}</span>
                        </div>
                    </header>
                    <BuoyObservationWorkspace v-if="selectedIsFlux" @select-metric="selectObservationMetric" />
                    <div v-else-if="selectedReading" class="custom-scrollbar min-h-0 space-y-2 overflow-y-auto p-4">
                        <article v-for="item in readingCards" :key="item.key"
                            :class="['border px-3 py-2.5', riskStyles[item.risk].panel]">
                            <div class="flex items-center justify-between gap-3">
                                <span class="text-sm font-bold text-cyan-100">{{ item.label }}</span>
                                <strong :class="['text-xl tabular-nums', item.risk === 'normal' ? 'text-white' : riskStyles[item.risk].text]">
                                    {{ item.value }} <small class="text-xs text-slate-300">{{ item.unit }}</small>
                                </strong>
                            </div>
                            <div class="mt-1 flex flex-wrap items-center justify-between gap-x-3 text-xs text-slate-300">
                                <span>{{ item.directionLabel }} {{ item.direction }}<template v-if="item.period"> · 周期 {{ item.period }}</template></span>
                                <span v-if="item.risk !== 'normal' && item.risk !== 'unknown'" :class="riskStyles[item.risk].text">
                                    {{ riskStyles[item.risk].label }}
                                </span>
                            </div>
                        </article>
                    </div>
                    <div v-else class="p-6 text-center text-sm text-slate-400">
                        {{ selectedBuoy ? '暂无实时数据' : '请选择浮标' }}
                    </div>
                </section>
            </div>

            <div class="absolute bottom-6 left-[32rem] right-[31rem] h-[19rem]">
                <section aria-label="浮标趋势"
                    class="tech-panel-enhanced pointer-events-auto relative flex h-full flex-col overflow-hidden p-4">
                    <div class="corner-decoration corner-tl"></div>
                    <div class="corner-decoration corner-br"></div>
                    <header class="mb-2 flex shrink-0 items-center justify-between gap-3 border-b border-cyan-500/30 pb-2">
                        <h3 class="shrink-0 text-lg font-bold text-white">浮标趋势</h3>
                        <span v-if="lastObservation" class="ml-auto whitespace-nowrap text-xs tabular-nums text-slate-300">
                            末次观测 <strong class="text-cyan-100">{{ formatMetric(lastObservation.value, 2) }} {{ trendMetric.unit }}</strong>
                        </span>
                        <div v-if="selectedIsFlux" class="flex shrink-0 items-center gap-2">
                            <div class="w-36">
                                <PanelSelect v-model="observationDay" label="观测日期" :options="observationDates" overlay :max-height="240" />
                            </div>
                            <div class="w-44">
                                <PanelSelect v-model="observationMetricKey" label="观测指标" :options="observationMetrics" overlay :max-height="240" />
                            </div>
                        </div>
                        <div v-else-if="selectedBuoy" class="flex shrink-0 items-center gap-2">
                            <nav aria-label="趋势时段" class="flex gap-1">
                                <button v-for="option in ranges" :key="option.value" type="button" class="buoy-button"
                                    :aria-pressed="range === option.value" @click="range = option.value">{{ option.label }}</button>
                            </nav>
                            <div class="w-28">
                                <PanelSelect v-model="stationMetricKey" label="趋势指标" :options="stationMetricOptions" overlay :max-height="240" />
                            </div>
                        </div>
                    </header>
                    <div class="relative min-h-0 flex-1">
                        <div v-if="trendHasValues" ref="chartEl" class="absolute inset-0"
                            role="img" :aria-label="trendMetric.label + '趋势图'"></div>
                        <div v-if="trendLoading || (selectedIsFlux && manifestLoading && !trendHasValues)"
                            class="buoy-chart-status bg-slate-950/60" role="status">加载中</div>
                        <div v-else-if="activeTrendError" class="buoy-chart-status gap-3 bg-slate-950/75 text-rose-200" role="status">
                            <span>{{ activeTrendError }}</span>
                            <button type="button" class="buoy-button" @click="retryTrend">重试</button>
                        </div>
                        <div v-else-if="!trendHasValues" class="buoy-chart-status">
                            {{ selectedBuoy ? '暂无趋势数据' : '请选择浮标' }}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    </transition>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import * as Cesium from 'cesium';
import * as echarts from 'echarts';
import PanelSelect from '../common/PanelSelect.vue';
import BuoyObservationWorkspace from './BuoyObservationWorkspace.vue';
import { fetchBuoyHistory, fetchBuoyRealtime, fetchBuoys } from '../../api/forecastWarningBuoy.js';
import { monitoringRequest } from '../../api/monitoring.js';
import { lastValidObservation, validObservationValue } from '../../utils/buoyObservationData.js';
import { darkChartTooltip } from '../../utils/chartTooltip.js';

const props = defineProps({ show: Boolean, getViewer: { type: Function, default: () => null } });
const emit = defineEmits(['close']);

const fluxId = 'deepsea-flux-test';
const observationPath = '/api/buoy-observations/' + fluxId;
const refreshInterval = 60_000;
const ranges = [
    { value: '12h', label: '过去12小时' },
    { value: '7d', label: '过去7天' },
    { value: '15d', label: '过去15天' }
];
const stationMetrics = [
    { key: 'windSpeed', label: '风速', unit: 'm/s', direction: 'windDirection', directionLabel: '风向', color: '#22d3ee', thresholds: [12, 15, 20] },
    { key: 'waveHeight', label: '浪高', unit: 'm', direction: 'waveDirection', directionLabel: '浪向', color: '#facc15', thresholds: [2.5, 3.5, 4.5] },
    { key: 'currentSpeed', label: '流速', unit: 'm/s', direction: 'currentDirection', directionLabel: '流向', color: '#a78bfa', thresholds: [1, 1.5, 2] }
];
const stationMetricOptions = stationMetrics.map(metric => ({ value: metric.key, label: metric.label }));
const statusNames = { normal: '正常', delayed: '延迟', offline: '异常' };
const statusColors = { normal: 'text-emerald-300', delayed: 'text-amber-200', offline: 'text-rose-300' };
const statusOptions = [
    { value: 'all', label: '全部状态' },
    ...Object.entries(statusNames).map(([value, label]) => ({ value, label }))
];
const riskStyles = {
    normal: { label: '较平稳', text: 'text-slate-300', panel: 'border-slate-700/70 bg-slate-950/35', map: '#67e8f9' },
    attention: { label: '需关注', text: 'text-yellow-200', panel: 'border-yellow-400/50 bg-yellow-950/25', map: '#facc15' },
    warning: { label: '预警', text: 'text-orange-300', panel: 'border-orange-400/60 bg-orange-950/30', map: '#fb923c' },
    critical: { label: '高风险', text: 'text-rose-300', panel: 'border-rose-400/70 bg-rose-950/35', map: '#fb7185' },
    unknown: { label: '数据不足', text: 'text-slate-400', panel: 'border-slate-700/70 bg-slate-950/35', map: '#cbd5e1' }
};
const riskLevels = ['normal', 'attention', 'warning', 'critical'];
const attitudeFields = [
    ['横滚', '°'], ['俯仰', '°'], ['偏航', '°'],
    ['加速度X', 'g'], ['加速度Y', 'g'], ['加速度Z', 'g'],
    ['角速度X', '°/s'], ['角速度Y', '°/s'], ['角速度Z', '°/s'],
    ['磁场X', 'LSB'], ['磁场Y', 'LSB'], ['磁场Z', 'LSB']
];

const stations = shallowRef([]);
const realtime = shallowRef([]);
const selectedBuoyId = ref('');
const searchTerm = ref('');
const statusFilter = ref('all');
const refreshing = ref(false);
const stationError = ref('');
const autoRefresh = ref(true);
const range = ref('12h');
const stationMetricKey = ref('windSpeed');
const observationManifest = shallowRef(null);
const manifestLoading = ref(false);
const manifestError = ref('');
const observationDay = ref('');
const observationMetricKey = ref('met:2');
const trendResult = shallowRef(null);
const trendLoading = ref(false);
const trendError = ref('');
const chartEl = ref(null);
const stationTrendCache = new Map();

let workspaceGeneration = 0;
let refreshTimer;
let manifestController;
let trendController;
let chart;
let chartObserver;
let mapViewer;
let mapEntities = [];

function numericValue(value) {
    if (value == null || typeof value === 'boolean' || String(value).trim() === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function formatMetric(value, digits = 1) {
    return numericValue(value)?.toFixed(digits) ?? '—';
}

function formatTime(value, full = false) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('zh-CN', {
        hour12: false, timeZone: 'Asia/Shanghai',
        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
        ...(full ? { year: 'numeric', second: '2-digit' } : {})
    });
}

function getStationStatus(timestamp) {
    const age = Date.now() - new Date(timestamp).getTime();
    if (!timestamp || !Number.isFinite(age) || age > 30 * 60_000) return 'offline';
    return age > 5 * 60_000 ? 'delayed' : 'normal';
}

function getMetricRisk(metric, raw) {
    const value = numericValue(raw);
    if (value === null) return 'unknown';
    const rank = metric.thresholds.filter(threshold => value >= threshold).length;
    return riskLevels[rank];
}

function getStationRisk(reading, status) {
    if (!reading || status === 'offline') return 'unknown';
    const ranks = stationMetrics.map(metric => riskLevels.indexOf(getMetricRisk(metric, reading[metric.key])));
    return riskLevels[Math.max(...ranks)] || 'unknown';
}

function locationOf(buoy) {
    const latitude = numericValue(buoy?.lat);
    const longitude = numericValue(buoy?.lng);
    if (latitude === null || longitude === null || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
    return { latitude, longitude };
}

const realtimeById = computed(() => new Map(realtime.value.map(reading => [String(reading.buoyId), reading])));
const stationRows = computed(() => stations.value.map(station => {
    const id = String(station.id);
    const reading = realtimeById.value.get(id);
    const status = getStationStatus(reading?.timestamp);
    const source = reading?.source;
    return {
        ...station, id, status, risk: getStationRisk(reading, status),
        source: String(source).toUpperCase() === 'SIMULATED' ? '模拟数据' : source || '—'
    };
}));
const buoyRows = computed(() => [
    ...stationRows.value,
    {
        id: fluxId, name: '通量浮标', source: '测试数据',
        lat: observationManifest.value?.location?.latitude, lng: observationManifest.value?.location?.longitude
    }
]);
const filteredBuoys = computed(() => {
    const keyword = searchTerm.value.trim().toLowerCase();
    return buoyRows.value.filter(buoy =>
        (statusFilter.value === 'all' || buoy.status === statusFilter.value)
        && (!keyword || [buoy.name, buoy.id].some(value => String(value).toLowerCase().includes(keyword))));
});
const selectedBuoy = computed(() => buoyRows.value.find(buoy => buoy.id === selectedBuoyId.value));
const selectedIsFlux = computed(() => selectedBuoyId.value === fluxId);
const selectedReading = computed(() => selectedBuoy.value && !selectedIsFlux.value
    ? realtimeById.value.get(selectedBuoyId.value) : null);
const selectedLocation = computed(() => locationOf(selectedBuoy.value));
const coordinateLabel = computed(() => {
    const place = selectedLocation.value;
    if (!place) return '';
    const { latitude, longitude } = place;
    return Math.abs(latitude).toFixed(1) + '°' + (latitude < 0 ? 'S' : 'N')
        + ' ' + Math.abs(longitude).toFixed(1) + '°' + (longitude < 0 ? 'W' : 'E');
});
const readingCards = computed(() => {
    const reading = selectedReading.value;
    if (!reading) return [];
    const period = numericValue(reading.wavePeriod);
    return stationMetrics.map(metric => {
        const direction = numericValue(reading[metric.direction]);
        return {
            ...metric, value: formatMetric(reading[metric.key]),
            direction: direction === null ? '—' : direction.toFixed(0) + '°',
            period: metric.key === 'waveHeight' && period !== null ? period.toFixed(1) + ' s' : '',
            risk: selectedBuoy.value.status === 'offline' ? 'unknown' : getMetricRisk(metric, reading[metric.key])
        };
    });
});

const observationDates = computed(() => (observationManifest.value?.days || []).map(day => ({ value: day, label: day })));
const observationMetrics = computed(() => {
    if (!observationManifest.value) return [];
    const meteorology = (observationManifest.value.fields || []).map(({ name, unit }, index) => ({
        value: 'met:' + index, label: [name, unit].filter(Boolean).join(' '), name, unit, index, mode: 'met'
    }));
    const attitude = attitudeFields.map(([name, unit], index) => ({
        value: 'attitude:' + index, label: name + ' ' + unit, name, unit, index, mode: 'attitude'
    }));
    return [...meteorology, ...attitude];
});
const selectedObservationMetric = computed(() => observationMetrics.value.find(metric => metric.value === observationMetricKey.value));
const trendMetric = computed(() => {
    if (selectedIsFlux.value) {
        const metric = selectedObservationMetric.value;
        return { label: metric?.name || '观测值', unit: metric?.unit || '', color: '#22d3ee' };
    }
    return stationMetrics.find(metric => metric.key === stationMetricKey.value) || stationMetrics[0];
});
const trendRequest = computed(() => {
    if (!props.show || !selectedBuoy.value) return null;
    if (selectedIsFlux.value) {
        const day = observationDay.value;
        const mode = selectedObservationMetric.value?.mode;
        return day && mode ? { key: mode + ':' + day, day, mode } : null;
    }
    const id = selectedBuoyId.value;
    return { key: 'station:' + id + ':' + range.value, id, range: range.value, mode: 'station' };
});
const displayedRecords = computed(() => trendResult.value?.key === trendRequest.value?.key
    ? trendResult.value?.records || [] : []);
const chartSeries = computed(() => displayedRecords.value.map(row => selectedIsFlux.value
    ? { time: row.time, value: validObservationValue(row, selectedObservationMetric.value?.index) }
    : { time: formatTime(row.timestamp, true), value: numericValue(row[trendMetric.value.key]) }));
const trendHasValues = computed(() => chartSeries.value.some(point => point.value !== null));
const lastObservation = computed(() => selectedIsFlux.value
    ? lastValidObservation(displayedRecords.value, selectedObservationMetric.value?.index) : null);
const activeTrendError = computed(() => (selectedIsFlux.value && manifestError.value) || trendError.value);

function selectObservationMetric(index) {
    const value = 'met:' + index;
    if (observationMetrics.value.some(metric => metric.value === value)) observationMetricKey.value = value;
}

function selectBuoy(buoyId) {
    const id = String(buoyId || '');
    if (!props.show || !id) return;
    const known = buoyRows.value.some(buoy => buoy.id === id);
    if (!known && !refreshing.value) return;
    if (!filteredBuoys.value.some(buoy => buoy.id === id)) {
        searchTerm.value = '';
        statusFilter.value = 'all';
    }
    selectedBuoyId.value = id;
}

async function refreshStations({ loadList = !stations.value.length } = {}) {
    if (!props.show || refreshing.value) return;
    const generation = workspaceGeneration;
    refreshing.value = true;
    stationError.value = '';
    const [catalog, readings] = await Promise.allSettled([
        loadList ? fetchBuoys() : stations.value, fetchBuoyRealtime()
    ]);
    if (workspaceGeneration !== generation) return;

    if (catalog.status === 'fulfilled' && Array.isArray(catalog.value)) stations.value = catalog.value;
    if (readings.status === 'fulfilled' && Array.isArray(readings.value)) realtime.value = readings.value;
    if (catalog.status === 'rejected' || readings.status === 'rejected') stationError.value = '站点数据加载失败';
    refreshing.value = false;

    if (readings.status === 'fulfilled' && trendRequest.value?.mode === 'station'
        && trendResult.value?.key === trendRequest.value.key && !trendLoading.value) {
        loadTrend({ force: true });
    }

    if (loadList) {
        await nextTick();
        if (workspaceGeneration === generation) focusBuoyRegion();
    }
}

async function loadManifest() {
    manifestController?.abort();
    const controller = new AbortController();
    manifestController = controller;
    manifestLoading.value = true;
    manifestError.value = '';
    try {
        const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(30_000)]);
        const result = await monitoringRequest(observationPath + '/manifest', { signal });
        if (controller.signal.aborted) return;
        observationManifest.value = result;
        if (!observationDates.value.some(option => option.value === observationDay.value)) {
            observationDay.value = observationDates.value[0]?.value || '';
        }
        if (!observationMetrics.value.some(option => option.value === observationMetricKey.value)) {
            observationMetricKey.value = observationMetrics.value[0]?.value || '';
        }
    } catch {
        if (!controller.signal.aborted) manifestError.value = '通量浮标数据加载失败';
    } finally {
        if (manifestController === controller) manifestLoading.value = false;
    }
}

function attitudeRecord(row) {
    const { angles, accelerationG, angularVelocity, magneticRaw } = row.decoded || {};
    return {
        time: row.time,
        values: [angles, accelerationG, angularVelocity, magneticRaw].flatMap(group => [group?.[0], group?.[1], group?.[2]]),
        invalid: row.quality?.errors
    };
}

async function loadTrend({ force = false } = {}) {
    trendController?.abort();
    trendController = null;
    trendLoading.value = false;
    trendError.value = '';
    const request = trendRequest.value;
    if (!request) {
        trendResult.value = null;
        return;
    }

    const cached = stationTrendCache.get(request.key);
    if (!force && cached && Date.now() - cached.loadedAt < refreshInterval) {
        trendResult.value = cached;
        return;
    }

    const controller = new AbortController();
    trendController = controller;
    trendLoading.value = true;
    try {
        const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(60_000)]);
        let records;
        if (request.mode === 'station') {
            const result = await fetchBuoyHistory(request.id, request.range, { signal });
            records = result?.points || [];
        } else {
            const route = request.mode === 'met' ? '/days/' : '/attitudes/';
            const rows = await monitoringRequest(observationPath + route + encodeURIComponent(request.day), { signal });
            records = request.mode === 'met' ? rows : rows.map(attitudeRecord);
        }
        if (controller.signal.aborted || trendRequest.value?.key !== request.key) return;

        const result = { key: request.key, records: Array.isArray(records) ? records : [], loadedAt: Date.now() };
        trendResult.value = result;
        if (request.mode === 'station') stationTrendCache.set(request.key, result);
    } catch {
        if (!controller.signal.aborted && trendRequest.value?.key === request.key) trendError.value = '趋势数据加载失败';
    } finally {
        if (trendController === controller) trendLoading.value = false;
    }
}

function retryTrend() {
    if (selectedIsFlux.value && manifestError.value) loadManifest();
    else loadTrend({ force: true });
}

function disposeChart() {
    chartObserver?.disconnect();
    chart?.dispose();
    chartObserver = chart = null;
}

function renderChart() {
    const target = chartEl.value;
    if (!target || !props.show) {
        disposeChart();
        return;
    }
    if (chart?.getDom() !== target) {
        disposeChart();
        chart = echarts.init(target);
        chartObserver = new ResizeObserver(() => chart?.resize());
        chartObserver.observe(target);
    }

    const { label, unit, color } = trendMetric.value;
    const series = chartSeries.value;
    chart.setOption({
        animation: false,
        backgroundColor: 'transparent',
        tooltip: {
            ...darkChartTooltip,
            valueFormatter: value => value == null ? '—' : [formatMetric(value, 2), unit].filter(Boolean).join(' ')
        },
        grid: { left: 52, right: 24, top: 27, bottom: 34 },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: series.map(point => point.time),
            axisLabel: {
                color: '#cbd5e1', hideOverlap: true,
                formatter: value => selectedIsFlux.value ? value.slice(11, 19) : value.replace(/^\d{4}\//, '').slice(0, -3)
            },
            axisLine: { lineStyle: { color: '#475569' } }
        },
        yAxis: {
            type: 'value',
            name: unit,
            nameTextStyle: { color: '#cbd5e1' },
            axisLabel: { color: '#cbd5e1' },
            splitLine: { lineStyle: { color: '#334155' } }
        },
        dataZoom: selectedIsFlux.value ? [{ type: 'inside' }] : [],
        series: [{
            name: label, type: 'line', data: series.map(point => point.value),
            showSymbol: series.length <= 24 || !series.some((point, index) =>
                point.value !== null && index > 0 && series[index - 1].value !== null),
            connectNulls: false,
            sampling: selectedIsFlux.value ? 'lttb' : 'none',
            lineStyle: { color, width: 2 },
            itemStyle: { color }
        }]
    }, true);
}

function clearMap() {
    if (mapViewer && !mapViewer.isDestroyed()) {
        for (const entity of mapEntities) mapViewer.entities.remove(entity);
        mapViewer.scene.requestRender();
    }
    mapViewer = null;
    mapEntities = [];
}

function updateMap() {
    clearMap();
    if (!props.show) return;
    const viewer = props.getViewer();
    if (!viewer || viewer.isDestroyed()) return;
    mapViewer = viewer;
    for (const buoy of filteredBuoys.value) {
        const place = locationOf(buoy);
        if (!place) continue;
        const selected = selectedBuoyId.value === buoy.id;
        const size = selected ? 86 : 72;
        const palette = riskStyles[buoy.risk || 'normal'];
        mapEntities.push(viewer.entities.add({
            id: 'buoy-monitor-' + buoy.id,
            name: buoy.name,
            position: Cesium.Cartesian3.fromDegrees(place.longitude, place.latitude, 120),
            properties: { buoyId: buoy.id },
            billboard: {
                image: '/image/浮标.png', width: size, height: size,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM, disableDepthTestDistance: Infinity
            },
            label: {
                text: buoy.name,
                font: (selected ? 'bold 16px ' : 'bold 14px ') + '"Noto Sans SC", sans-serif',
                fillColor: Cesium.Color.fromCssColorString(selected ? '#ffffff' : palette.map),
                showBackground: true,
                backgroundColor: Cesium.Color.fromCssColorString(selected ? '#123951' : '#0c1b2c'),
                pixelOffset: new Cesium.Cartesian2(0, -size - 4),
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM, disableDepthTestDistance: Infinity
            }
        }));
    }
    viewer.scene.requestRender();
}

function focusSelectedBuoy() {
    const viewer = props.getViewer();
    const place = selectedLocation.value;
    if (!viewer || viewer.isDestroyed() || !place) return;
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(place.longitude, place.latitude, 900_000),
        duration: 1.4
    });
}

function focusBuoyRegion() {
    const viewer = props.getViewer();
    const locations = stationRows.value.map(locationOf).filter(Boolean);
    if (!viewer || viewer.isDestroyed() || !locations.length) return;
    const longitudes = locations.map(place => place.longitude);
    const latitudes = locations.map(place => place.latitude);
    const west = Math.min(...longitudes), east = Math.max(...longitudes);
    const south = Math.min(...latitudes), north = Math.max(...latitudes);
    const longitudePadding = Math.max((east - west) * .65, 3);
    const latitudePadding = Math.max((north - south) * .65, 3);
    viewer.camera.flyTo({
        destination: Cesium.Rectangle.fromDegrees(
            Math.max(-180, west - longitudePadding),
            Math.max(-90, south - latitudePadding * 1.55),
            Math.min(180, east + longitudePadding),
            Math.min(90, north + latitudePadding)
        ),
        duration: 1.8,
        orientation: { heading: 0, pitch: -Cesium.Math.PI_OVER_TWO, roll: 0 }
    });
}

function syncRefreshTimer() {
    window.clearInterval(refreshTimer);
    if (props.show && autoRefresh.value) refreshTimer = window.setInterval(refreshStations, refreshInterval);
}

function stop() {
    workspaceGeneration++;
    window.clearInterval(refreshTimer);
    manifestController?.abort();
    trendController?.abort();
    refreshing.value = false;
    disposeChart();
    clearMap();
}

watch(() => props.show, visible => {
    if (visible) {
        refreshStations({ loadList: true });
        loadManifest();
    } else {
        stop();
    }
    syncRefreshTimer();
}, { immediate: true });
watch(autoRefresh, syncRefreshTimer);
watch([filteredBuoys, refreshing, () => props.show], ([rows, busy, visible]) => {
    if (!visible || (busy && !stations.value.length)) return;
    if (!rows.some(buoy => buoy.id === selectedBuoyId.value)) selectedBuoyId.value = rows[0]?.id || '';
}, { flush: 'pre' });
watch([filteredBuoys, selectedBuoyId, () => props.show], updateMap, { flush: 'post' });
watch(() => trendRequest.value?.key, () => loadTrend(), { immediate: true });
watch([chartEl, chartSeries, trendMetric, () => props.show], renderChart, { flush: 'post' });
onBeforeUnmount(stop);
defineExpose({ selectBuoy, focusBuoyRegion });
</script>

<style scoped>
.buoy-row {
    border: 1px solid rgba(51, 65, 85, .72);
    background: rgba(2, 6, 23, .35);
}
.buoy-row:hover, .buoy-row[aria-pressed="true"] {
    border-color: rgba(103, 232, 249, .75);
    background: rgba(8, 145, 178, .15);
}
.buoy-row:focus-visible, .buoy-button:focus-visible {
    outline: 2px solid #67e8f9;
    outline-offset: 1px;
}
.buoy-button {
    border: 1px solid rgba(34, 211, 238, .36);
    background: rgba(8, 47, 73, .38);
    padding: 5px 9px;
    color: #e0f2fe;
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
}
.buoy-button:hover, .buoy-button[aria-pressed="true"] {
    border-color: #67e8f9;
    background: rgba(8, 145, 178, .26);
    color: white;
}
.buoy-button:disabled {
    opacity: .55;
}
.buoy-chart-status {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #cbd5e1;
    font-size: 14px;
}
</style>
