<template>
    <transition name="workspace-fade">
        <div v-if="show" class="pointer-events-none absolute inset-0 z-40 font-['Noto_Sans_SC']">
            <div class="pointer-events-none absolute left-8 top-36 h-[54.5rem] w-[28rem]">
            <section class="tech-panel-enhanced pointer-events-auto relative flex h-full max-h-[54.5rem] flex-col overflow-hidden p-5" style="clip-path: polygon(0 0,100% 0,100% 95%,92% 100%,0 100%);">
                <div class="absolute left-0 top-0 h-[2px] w-full animate-pulse bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                <div class="corner-decoration corner-tl scale-125"></div><div class="corner-decoration corner-tr scale-125"></div>
                <div class="mb-4 flex shrink-0 items-center border-b-2 border-cyan-500/40 pb-3">
                    <div class="mr-3 h-6 w-1.5 bg-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.8)]"></div>
                    <h3 class="flex-1 text-2xl font-bold tracking-wider text-white">浮标监测</h3>
                    <button class="floating-panel-close-btn floating-panel-close-btn--inline" type="button" title="关闭浮标监测" @click="emit('close')">✕</button>
                </div>
                <div class="mb-3 grid grid-cols-4 gap-1.5 text-xs">
                    <div class="border border-cyan-500/20 bg-slate-950/45 px-2 py-2 text-slate-400"><span class="block">浮标总数</span><strong class="mt-1 block text-lg text-cyan-100">{{ buoys.length }}</strong></div>
                    <div class="border border-emerald-500/20 bg-slate-950/45 px-2 py-2 text-slate-400"><span class="block">正常</span><strong class="mt-1 block text-lg text-emerald-300">{{ statusCounts.normal }}</strong></div>
                    <div class="border border-amber-500/20 bg-slate-950/45 px-2 py-2 text-slate-400"><span class="block">延迟</span><strong class="mt-1 block text-lg text-amber-200">{{ statusCounts.delayed }}</strong></div>
                    <div class="border border-rose-500/20 bg-slate-950/45 px-2 py-2 text-slate-400"><span class="block">异常</span><strong class="mt-1 block text-lg text-rose-300">{{ statusCounts.offline }}</strong></div>
                </div>
                <div class="mb-3 border border-cyan-500/20 bg-slate-950/45 px-3 py-2 text-xs text-slate-400">
                    <div class="flex items-center justify-between gap-3"><span>数据来源</span><strong class="text-cyan-100">{{ sourceLabel }}</strong></div>
                    <div class="mt-1 flex items-center justify-between gap-3"><span>最新数据</span><strong class="text-cyan-100">{{ formatTime(latestTimestamp) }}</strong></div>
                    <div class="mt-2 flex items-center justify-between gap-3 border-t border-slate-700/60 pt-2">
                        <span class="inline-flex items-center gap-1.5" :class="autoRefresh ? 'text-emerald-300' : 'text-amber-200'"><span :class="['h-1.5 w-1.5 rounded-full', autoRefresh ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.9)] animate-pulse' : 'bg-amber-400']"></span>{{ autoRefresh ? '自动刷新中' : '自动刷新已暂停' }}</span>
                        <span v-if="autoRefresh" class="text-slate-500">下次同步 {{ refreshCountdown }} 秒</span>
                        <span v-else class="text-slate-500">可手动同步</span>
                    </div>
                    <div class="mt-1 flex items-center justify-between gap-3"><span>最近同步</span><strong class="text-cyan-100">{{ formatTime(lastRefreshAt) }}</strong></div>
                </div>
                <div v-if="errorMessage" class="mb-3 border border-rose-500/35 bg-rose-950/30 p-3 text-sm text-rose-100">{{ errorMessage }}</div>
                <div class="mb-2 flex items-center justify-between gap-2 text-sm font-bold text-cyan-200"><span>当前浮标</span><div class="flex items-center gap-3"><button class="text-xs text-slate-400 hover:text-white" type="button" @click="toggleAutoRefresh">{{ autoRefresh ? '暂停自动刷新' : '恢复自动刷新' }}</button><button class="text-xs text-cyan-300 hover:text-white disabled:opacity-50" type="button" :disabled="refreshing" @click="refreshRealtime">{{ refreshing ? '刷新中...' : '立即刷新' }}</button></div></div>
                <div class="mb-2 flex gap-2">
                    <input v-model="searchTerm" type="search" placeholder="搜索名称或编号" class="min-w-0 flex-1 border border-slate-700 bg-slate-950/55 px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-400" />
                    <select v-model="statusFilter" class="w-24 border border-slate-700 bg-slate-950/80 px-2 text-xs text-slate-300 outline-none focus:border-cyan-400">
                        <option value="all">全部状态</option>
                        <option value="normal">正常</option>
                        <option value="delayed">延迟</option>
                        <option value="offline">异常</option>
                    </select>
                </div>
                <div class="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pr-2">
                    <button v-for="buoy in filteredBuoyRows" :key="buoy.id" type="button" :class="['w-full border p-3 text-left transition-all', riskPanelClass(buoy.riskLevel), selectedBuoyId === buoy.id ? 'border-white/90 ring-1 ring-cyan-200/80 shadow-[0_0_18px_rgba(34,211,238,.22)]' : 'hover:border-cyan-400/70', changedBuoyIds.has(buoy.id) ? 'live-update-highlight' : '']" @click="selectedBuoyId = buoy.id">
                        <div class="flex items-start justify-between gap-3"><div class="min-w-0"><div class="flex items-center gap-2 text-sm font-bold text-white"><span :class="['h-2 w-2 shrink-0 rounded-full', statusDotClass(buoy.status)]"></span><span class="truncate">{{ buoy.name }}</span></div><div class="mt-1 truncate text-xs text-slate-400">{{ buoy.id }} · {{ coordinate(buoy.lat, 'N') }} {{ coordinate(buoy.lng, 'E') }}</div></div><div class="flex shrink-0 flex-col items-end gap-1"><span :class="['text-xs font-bold', riskTextClass(buoy.riskLevel)]">{{ riskLabel(buoy.riskLevel) }}</span><span :class="['text-[11px]', statusTextClass(buoy.status)]">{{ statusLabel(buoy.status) }}</span></div></div>
                        <div class="mt-2 grid grid-cols-3 gap-1 border-t border-slate-700/60 pt-2 text-xs text-slate-400"><span>风 <b :class="metricRiskTextClass('windSpeed', buoy.windSpeed)">{{ metric(buoy.windSpeed) }}</b></span><span>浪 <b :class="metricRiskTextClass('waveHeight', buoy.waveHeight)">{{ metric(buoy.waveHeight) }}</b></span><span>流 <b :class="metricRiskTextClass('currentSpeed', buoy.currentSpeed)">{{ metric(buoy.currentSpeed) }}</b></span></div>
                        <div class="mt-2 text-[11px] text-slate-500">数据时间：{{ formatTime(buoy.timestamp) }}</div>
                    </button>
                    <div v-if="!loading && buoys.length && !filteredBuoyRows.length" class="flex h-36 items-center justify-center border border-dashed border-slate-700/50 text-sm text-slate-500">没有符合条件的浮标</div>
                    <div v-if="!loading && !buoys.length" class="flex h-36 items-center justify-center border border-dashed border-slate-700/50 text-sm text-slate-500">暂无浮标数据</div>
                </div>
            </section>
            </div>

            <div class="pointer-events-none absolute right-6 top-36 h-[54.5rem] w-[28rem]">
            <section class="tech-panel-enhanced pointer-events-auto relative flex h-full max-h-[54.5rem] flex-col overflow-hidden p-5" style="clip-path: polygon(0 0,92% 0,100% 7%,100% 100%,0 100%);">
                <div class="absolute left-0 top-0 h-[2px] w-full animate-pulse bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                <div class="corner-decoration corner-bl scale-125"></div><div class="corner-decoration corner-br scale-125"></div>
                <div class="mb-3 border-b-2 border-cyan-500/40 pb-3"><div class="flex items-start justify-between gap-3"><div class="min-w-0"><div class="truncate text-2xl font-bold tracking-wider text-white">{{ selectedBuoy?.name || '浮标详情' }}</div><div class="mt-1 text-xs text-slate-400">{{ selectedBuoy?.id || '--' }} · {{ selectedCoordinateLabel }}</div></div><button v-if="selectedBuoy" type="button" class="shrink-0 border border-cyan-500/45 bg-cyan-950/45 px-2.5 py-1.5 text-xs font-bold text-cyan-100 transition-colors hover:bg-cyan-400 hover:text-slate-950" @click="focusSelectedBuoy">定位</button></div><div v-if="selectedBuoy" class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"><span :class="['inline-flex items-center gap-1 font-bold', statusTextClass(selectedRow?.status)]"><span :class="['h-2 w-2 rounded-full', statusDotClass(selectedRow?.status)]"></span>{{ statusLabel(selectedRow?.status) }}</span><span :class="['inline-flex items-center gap-1 font-bold', riskTextClass(selectedRow?.riskLevel)]"><span class="h-2 w-2 rounded-full" :class="riskTextClass(selectedRow?.riskLevel).replace('text-', 'bg-')"></span>风险：{{ riskLabel(selectedRow?.riskLevel) }}</span><span class="text-slate-400">来源：{{ formatSource(selectedRealtime?.source) }}</span><span class="text-slate-400">更新：{{ formatTime(selectedRealtime?.timestamp) }}</span></div></div>
                <div class="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
                <div v-if="selectedRealtime" class="grid grid-cols-1 gap-3">
                    <article v-for="item in realtimeCards" :key="item.name" :class="['border px-4 py-3', riskPanelClass(item.risk.level), changedBuoyIds.has(selectedBuoyId) ? 'live-update-highlight' : '']"><div class="flex items-center justify-between"><span class="font-bold text-cyan-200">{{ item.name }}</span><strong :class="['text-xl', item.risk.level === 'normal' ? 'text-white' : item.risk.class]">{{ item.value }} <small class="text-xs text-slate-400">{{ item.unit }}</small></strong></div><div class="mt-2 flex items-center justify-between gap-2 text-xs text-slate-400"><span>方向 {{ item.direction }}°<span v-if="item.extra"> · {{ item.extra }}</span></span><span v-if="item.risk.level !== 'normal' && item.risk.level !== 'unknown'" :class="['font-bold', item.risk.class]">⚠ {{ item.risk.label }}</span><span v-else-if="item.liveDelta" :class="item.liveDelta.class">{{ item.liveDelta.label }}</span><span v-else-if="item.trend" :class="item.trend.class">{{ item.trend.icon }} {{ item.trend.label }}</span></div><div v-if="item.risk.level !== 'normal' && item.risk.level !== 'unknown'" class="mt-2 border-t border-current/20 pt-1 text-[11px] text-slate-300">超过{{ item.risk.name }}{{ item.risk.label }}阈值 · 当前 {{ item.value }} {{ item.unit }}</div></article>
                </div>
                <div v-else class="flex flex-1 items-center justify-center border border-dashed border-slate-700/50 text-sm text-slate-500">请选择浮标</div>
                <div v-if="currentRisk" :class="['mt-4 border p-3', riskPanelClass(selectedRow?.riskLevel)]"><div class="flex items-center justify-between gap-3"><span class="text-sm font-bold text-cyan-200">当前海况判读</span><span :class="['text-sm font-bold', currentRisk.class]">{{ currentRisk.level }}</span></div><div class="mt-2 text-xs leading-5 text-slate-300">{{ currentRisk.reason }}</div><div v-if="currentRisk.exceedances.length" class="mt-2 flex flex-wrap gap-1.5"><span v-for="item in currentRisk.exceedances" :key="item.name" :class="['border px-2 py-1 text-[11px] font-bold', item.level === 'critical' ? 'border-rose-400/50 bg-rose-950/50 text-rose-200' : item.level === 'warning' ? 'border-orange-400/50 bg-orange-950/50 text-orange-200' : 'border-yellow-400/50 bg-yellow-950/50 text-yellow-100']">{{ item.name }} {{ item.value }} {{ item.unit }} · {{ item.label }}</span></div><div class="mt-2 border-t border-slate-700/60 pt-2 text-xs text-slate-400">作业建议：<span class="font-bold text-slate-200">{{ currentRisk.advice }}</span></div><div class="mt-2 text-[10px] text-slate-600">评估依据：风速、浪高、流速；按当前阈值判定</div></div>
                <div v-if="directionItems.length" class="mt-4 border-t border-cyan-500/20 pt-3"><div class="mb-2 text-sm font-bold text-cyan-200">方向态势</div><div class="grid grid-cols-3 gap-2"><div v-for="item in directionItems" :key="item.name" class="border border-slate-700/60 bg-slate-950/35 p-2 text-center"><div class="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-slate-600/80 bg-slate-900/70"><span class="text-xl font-bold" :style="{ color: item.color, transform: `rotate(${item.direction}deg)` }">↑</span></div><div class="mt-1 text-[11px] text-slate-400">{{ item.name }}</div><strong class="text-xs text-slate-200">{{ item.direction }}°</strong></div></div></div>
                <div v-if="history?.statistics" class="mt-4 border-t border-cyan-500/20 pt-3"><div class="mb-2 flex items-center justify-between text-sm font-bold text-cyan-200"><span>{{ rangeLabel }}统计</span><span class="text-[11px] font-normal text-slate-500">{{ history.total || 0 }} 个数据点</span></div><div class="grid grid-cols-3 gap-2 text-xs text-slate-400"><div v-for="item in historyStats" :key="item.name" class="border border-slate-700/60 bg-slate-950/35 p-2"><span>{{ item.name }}</span><span class="mt-1 block text-slate-500">最小 {{ item.min }}</span><strong class="mt-1 block text-cyan-100">平均 {{ item.avg }}</strong><span class="mt-1 block text-slate-500">最大 {{ item.max }}</span></div></div><div class="mt-3 grid grid-cols-1 gap-1 text-[11px] text-slate-500"><span>统计区间：{{ historyTimeRangeLabel }}</span><span>采样间隔：{{ historyIntervalLabel }}</span></div></div>
                </div>
            </section>
            </div>

            <div :class="['pointer-events-none absolute bottom-16 left-[30rem] right-[30rem] transition-[height] duration-300', historyPanelHeightClass]">
            <section class="tech-panel-enhanced pointer-events-auto relative flex h-full flex-col overflow-hidden p-4" style="clip-path: polygon(0 0,100% 0,100% 100%,0 100%);">
                <div class="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                <div class="mb-3 flex items-center justify-between gap-3"><div><div class="text-lg font-bold text-white">历史监测趋势</div><div class="mt-1 text-xs text-slate-400">{{ selectedBuoy?.name || '未选择浮标' }} · {{ history?.total || 0 }} 个监测点 · {{ formatSource(selectedRealtime?.source) }}</div><div v-if="hasHistory" class="mt-1 text-[11px] text-slate-500">{{ historyTimeRangeLabel }} · 间隔 {{ historyIntervalLabel }}</div></div><div class="flex shrink-0 gap-2"><button v-for="item in ranges" :key="item.value" type="button" :class="['border px-3 py-1 text-xs font-bold transition-colors', range === item.value ? 'border-cyan-300 bg-cyan-500/20 text-white' : 'border-slate-700 text-slate-400 hover:border-cyan-500']" @click="range = item.value">{{ item.label }}</button></div></div>
                <div class="relative min-h-0 flex-1">
                    <div class="grid h-full grid-cols-3 grid-rows-2 gap-3" :class="hasHistory ? 'opacity-100' : 'opacity-0'"><div ref="windChartRef" class="min-w-0"></div><div ref="waveChartRef" class="min-w-0"></div><div ref="currentChartRef" class="min-w-0"></div><div ref="wavePeriodChartRef" class="min-w-0"></div><div ref="directionChartRef" class="col-span-2 min-w-0"></div></div>
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
const loading = ref(false); const historyLoading = ref(false); const historyError = ref(''); const errorMessage = ref(''); const range = ref('12h'); const refreshing = ref(false);
const searchTerm = ref(''); const statusFilter = ref('all');
const autoRefresh = ref(true); const refreshCountdown = ref(60); const lastRefreshAt = ref(null); const changedBuoyIds = ref(new Set()); const lastLiveDeltas = ref({});
const windChartRef = ref(null); const waveChartRef = ref(null); const currentChartRef = ref(null); const wavePeriodChartRef = ref(null); const directionChartRef = ref(null);
const REFRESH_INTERVAL_SECONDS = 60;
let refreshTimer = null; let countdownTimer = null; let changeHighlightTimer = null; let mapEntities = []; let windChart; let waveChart; let currentChart; let wavePeriodChart; let directionChart; let historyAbortController = null; let historyRequestId = 0;
const historyCache = new Map();
const ranges = [{ value: '12h', label: '过去12小时' }, { value: '7d', label: '过去7天' }, { value: '15d', label: '过去15天' }];
const rangeLabel = computed(() => ranges.find((item) => item.value === range.value)?.label || '历史数据');
const realtimeById = computed(() => new Map(realtime.value.map((item) => [item.buoyId, item])));
const getBuoyStatus = (timestamp) => {
    if (!timestamp) return 'offline';
    const timestampValue = new Date(timestamp).getTime();
    if (!Number.isFinite(timestampValue)) return 'offline';
    const age = Math.max(0, Date.now() - timestampValue);
    if (age <= 5 * 60 * 1000) return 'normal';
    if (age <= 30 * 60 * 1000) return 'delayed';
    return 'offline';
};
const riskRank = { normal: 0, attention: 1, warning: 2, critical: 3, unknown: -1 };
const riskMeta = {
    // 平稳状态不改变原有面板底色，只有真正达到风险阈值时才使用警示色。
    normal: { label: '较平稳', shortLabel: '平稳', textClass: 'text-slate-300', borderClass: 'border-slate-700/70 bg-slate-950/35' },
    attention: { label: '需关注', shortLabel: '关注', textClass: 'text-yellow-200', borderClass: 'border-yellow-400/50 bg-yellow-950/25' },
    warning: { label: '预警', shortLabel: '预警', textClass: 'text-orange-300', borderClass: 'border-orange-400/60 bg-orange-950/30' },
    critical: { label: '高风险', shortLabel: '高风险', textClass: 'text-rose-300', borderClass: 'border-rose-400/70 bg-rose-950/35' },
    unknown: { label: '数据不足', shortLabel: '无数据', textClass: 'text-slate-400', borderClass: 'border-slate-700/70 bg-slate-950/35' }
};
const riskThresholds = {
    // 按当前演示后端的模拟基线设置，避免将常态波动大面积判为危险。
    windSpeed: { attention: 12, warning: 15, critical: 20, unit: 'm/s', name: '风速' },
    waveHeight: { attention: 2.5, warning: 3.5, critical: 4.5, unit: 'm', name: '浪高' },
    currentSpeed: { attention: 1, warning: 1.5, critical: 2, unit: 'm/s', name: '流速' }
};
const getMetricRisk = (key, value) => {
    const numericValue = Number(value);
    const threshold = riskThresholds[key];
    if (!threshold || !Number.isFinite(numericValue)) return { level: 'unknown', label: '无数据', class: riskMeta.unknown.textClass };
    const level = numericValue >= threshold.critical
        ? 'critical'
        : numericValue >= threshold.warning
            ? 'warning'
            : numericValue >= threshold.attention
                ? 'attention'
                : 'normal';
    return { level, label: riskMeta[level].shortLabel, class: riskMeta[level].textClass, name: threshold.name, unit: threshold.unit, value: metric(numericValue) };
};
const getActualRiskLevel = (row) => {
    if (row.status === 'offline') return 'unknown';
    const levels = Object.keys(riskThresholds).map((key) => getMetricRisk(key, row[key]).level).filter((level) => level !== 'unknown');
    if (!levels.length) return 'unknown';
    return levels.reduce((highest, level) => riskRank[level] > riskRank[highest] ? level : highest, 'normal');
};
const getRiskLevel = (row) => {
    return getActualRiskLevel(row);
};
const buoyRows = computed(() => buoys.value.map((buoy) => {
    const row = { ...buoy, ...(realtimeById.value.get(buoy.id) || {}) };
    const status = getBuoyStatus(row.timestamp);
    return { ...row, status, riskLevel: getRiskLevel({ ...row, status }) };
}));
const filteredBuoyRows = computed(() => {
    const keyword = searchTerm.value.trim().toLowerCase();
    return buoyRows.value.filter((buoy) => {
        const matchesKeyword = !keyword || [buoy.id, buoy.name].some((value) => String(value || '').toLowerCase().includes(keyword));
        const matchesStatus = statusFilter.value === 'all' || buoy.status === statusFilter.value;
        return matchesKeyword && matchesStatus;
    });
});
const selectedBuoy = computed(() => buoys.value.find((item) => item.id === selectedBuoyId.value) || null);
const selectedRealtime = computed(() => realtimeById.value.get(selectedBuoyId.value) || null);
const selectedRow = computed(() => buoyRows.value.find((item) => item.id === selectedBuoyId.value) || null);
const selectedCoordinateLabel = computed(() => selectedBuoy.value ? `${coordinate(selectedBuoy.value.lat, 'N')} ${coordinate(selectedBuoy.value.lng, 'E')}` : '实时风浪流监测');
const hasHistory = computed(() => Array.isArray(history.value?.points) && history.value.points.length > 0);
const historyPanelHeightClass = computed(() => (hasHistory.value ? 'h-[27rem]' : 'h-[8rem]'));
const metric = (value, digits = 1) => Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : '--';
const coordinate = (value, positive) => `${Math.abs(Number(value)).toFixed(1)}°${Number(value) >= 0 ? positive : positive === 'N' ? 'S' : 'W'}`;
const formatTime = (value) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? '--' : date.toLocaleString('zh-CN', { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); };
const historyTimeRangeLabel = computed(() => {
    if (!history.value?.startTime || !history.value?.endTime) return '--';
    return `${formatTime(history.value.startTime)} — ${formatTime(history.value.endTime)}`;
});
const historyIntervalLabel = computed(() => {
    const points = history.value?.points || [];
    if (points.length < 2) return '--';
    const first = new Date(points[0].timestamp).getTime();
    const second = new Date(points[1].timestamp).getTime();
    const minutes = Math.abs(second - first) / 60000;
    if (!Number.isFinite(minutes) || minutes <= 0) return '--';
    if (minutes >= 60) return `${metric(minutes / 60)} 小时`;
    return `${metric(minutes)} 分钟`;
});
const formatSource = (source) => {
    if (!source) return '未知';
    if (String(source).toUpperCase() === 'SIMULATED') return '模拟数据';
    return String(source);
};
const latestTimestamp = computed(() => realtime.value
    .map((item) => new Date(item.timestamp || 0).getTime())
    .filter(Number.isFinite)
    .reduce((latest, current) => Math.max(latest, current), 0) || null);
const sourceLabel = computed(() => {
    const sources = [...new Set(realtime.value.map((item) => formatSource(item.source)).filter((source) => source !== '未知'))];
    return sources.length ? sources.join(' / ') : '未知';
});
const statusCounts = computed(() => buoyRows.value.reduce((counts, buoy) => {
    counts[buoy.status] = (counts[buoy.status] || 0) + 1;
    return counts;
}, { normal: 0, delayed: 0, offline: 0 }));
const statusLabel = (status) => ({ normal: '正常', delayed: '延迟', offline: '异常' }[status] || '无数据');
const statusDotClass = (status) => ({ normal: 'bg-emerald-400 shadow-[0_0_7px_rgba(52,211,153,.8)]', delayed: 'bg-amber-400 shadow-[0_0_7px_rgba(251,191,36,.8)]', offline: 'bg-rose-400 shadow-[0_0_7px_rgba(251,113,133,.8)]' }[status] || 'bg-slate-500');
const statusTextClass = (status) => ({ normal: 'text-emerald-300', delayed: 'text-amber-200', offline: 'text-rose-300' }[status] || 'text-slate-400');
const riskLabel = (level) => riskMeta[level]?.label || riskMeta.unknown.label;
const riskTextClass = (level) => riskMeta[level]?.textClass || riskMeta.unknown.textClass;
const riskPanelClass = (level) => riskMeta[level]?.borderClass || riskMeta.unknown.borderClass;
const metricRiskTextClass = (key, value) => getMetricRisk(key, value).level === 'normal' ? 'text-slate-200' : riskTextClass(getMetricRisk(key, value).level);
const historyTrend = (key) => {
    const points = history.value?.points || [];
    if (points.length < 2) return null;
    const previous = Number(points[points.length - 2]?.[key]);
    const latest = Number(points[points.length - 1]?.[key]);
    if (!Number.isFinite(previous) || !Number.isFinite(latest)) return null;
    const delta = latest - previous;
    const threshold = key === 'waveHeight' ? 0.05 : key === 'currentSpeed' ? 0.02 : 0.1;
    if (Math.abs(delta) < threshold) return { icon: '→', label: '稳定', class: 'text-slate-400' };
    return delta > 0
        ? { icon: '↑', label: `上升 ${metric(delta)}`, class: 'text-amber-200' }
        : { icon: '↓', label: `下降 ${metric(Math.abs(delta))}`, class: 'text-emerald-300' };
};
const liveDeltaFor = (key) => {
    const delta = lastLiveDeltas.value[selectedBuoyId.value]?.[key];
    if (!Number.isFinite(delta) || Math.abs(delta) < 0.005) return null;
    return delta > 0
        ? { label: `本次 +${metric(delta)}`, class: 'text-amber-200' }
        : { label: `本次 ${metric(delta)}`, class: 'text-emerald-300' };
};
const realtimeCards = computed(() => selectedRealtime.value ? [{ name: '风', key: 'windSpeed', value: metric(selectedRealtime.value.windSpeed), unit: 'm/s', direction: metric(selectedRealtime.value.windDirection, 0) }, { name: '浪', key: 'waveHeight', value: metric(selectedRealtime.value.waveHeight), unit: 'm', direction: metric(selectedRealtime.value.waveDirection, 0), extra: `周期 ${metric(selectedRealtime.value.wavePeriod)} s` }, { name: '流', key: 'currentSpeed', value: metric(selectedRealtime.value.currentSpeed), unit: 'm/s', direction: metric(selectedRealtime.value.currentDirection, 0) }].map((item) => ({ ...item, risk: getMetricRisk(item.key, selectedRealtime.value[item.key]), liveDelta: liveDeltaFor(item.key), trend: historyTrend(item.key) })) : []);
const currentRisk = computed(() => {
    const realtimeData = selectedRealtime.value;
    if (!realtimeData) return null;
    if (selectedRow.value?.status === 'offline') return { level: riskMeta.unknown.label, class: riskMeta.unknown.textClass, reason: '当前浮标数据已失联，页面保留最后读数但不再将其作为有效实时海况判据。', advice: '检查浮标通信状态和数据链路。', exceedances: [] };
    const indicators = Object.keys(riskThresholds).map((key) => getMetricRisk(key, realtimeData[key]));
    const validIndicators = indicators.filter((item) => item.level !== 'unknown');
    if (!validIndicators.length) return { level: riskMeta.unknown.label, class: riskMeta.unknown.textClass, reason: '当前浮标没有足够的风浪流数据，暂时无法完成海况判读。', advice: '检查浮标通信和数据质量。', exceedances: [] };
    const level = validIndicators.reduce((highest, item) => riskRank[item.level] > riskRank[highest] ? item.level : highest, 'normal');
    const exceedances = validIndicators.filter((item) => item.level !== 'normal');
    const riskMessages = {
        normal: ['当前风浪流指标整体处于相对平稳范围。', '可进行常规监测和低风险作业。'],
        attention: ['部分风浪流指标开始接近作业关注阈值，需要持续观察。', '建议降低作业强度并加强现场监测。'],
        warning: ['至少一项风浪流指标达到预警阈值，作业环境存在明显扰动。', '建议限制作业强度并做好撤离准备。'],
        critical: ['风、浪或流速达到高风险阈值，海上作业环境不稳定。', '暂停高风险作业，等待海况改善。']
    };
    return { level: riskMeta[level].label, class: riskMeta[level].textClass, reason: riskMessages[level][0], advice: riskMessages[level][1], exceedances };
});
const directionItems = computed(() => selectedRealtime.value ? [{ name: '风向', direction: metric(selectedRealtime.value.windDirection, 0), color: '#22d3ee' }, { name: '浪向', direction: metric(selectedRealtime.value.waveDirection, 0), color: '#facc15' }, { name: '流向', direction: metric(selectedRealtime.value.currentDirection, 0), color: '#a78bfa' }] : []);
const historyStats = computed(() => [['风速', history.value?.statistics?.windSpeed], ['浪高', history.value?.statistics?.waveHeight], ['流速', history.value?.statistics?.currentSpeed]].map(([name, value]) => ({ name, min: value ? `${metric(value.min)} ${value.unit || ''}` : '--', avg: value ? `${metric(value.avg)} ${value.unit || ''}` : '--', max: value ? `${metric(value.max)} ${value.unit || ''}` : '--' })));

const clearMap = () => { const viewer = props.getViewer?.(); if (viewer) mapEntities.forEach((entity) => viewer.entities.remove(entity)); mapEntities = []; };
const focusBuoyRegion = ({ retry = true } = {}) => {
    const viewer = props.getViewer?.();
    const validRows = buoyRows.value.filter((buoy) => Number.isFinite(Number(buoy.lng)) && Number.isFinite(Number(buoy.lat)));
    if (!viewer || !validRows.length) {
        if (retry && validRows.length) window.setTimeout(() => focusBuoyRegion({ retry: false }), 350);
        return;
    }

    const longitudes = validRows.map((buoy) => Number(buoy.lng));
    const latitudes = validRows.map((buoy) => Number(buoy.lat));
    const minLongitude = Math.min(...longitudes);
    const maxLongitude = Math.max(...longitudes);
    const minLatitude = Math.min(...latitudes);
    const maxLatitude = Math.max(...latitudes);
    const longitudeSpan = Math.max(maxLongitude - minLongitude, 0.8);
    const latitudeSpan = Math.max(maxLatitude - minLatitude, 0.8);
    // 给地图标记和信息卡预留安全边距，避免自动聚焦后边缘浮标被裁切。
    const longitudePadding = Math.max(longitudeSpan * 0.65, validRows.length === 1 ? 8 : 3);
    const latitudePadding = Math.max(latitudeSpan * 0.65, validRows.length === 1 ? 6 : 2.5);
    const rectangle = Cesium.Rectangle.fromDegrees(
        Math.max(-180, minLongitude - longitudePadding),
        Math.max(-90, minLatitude - latitudePadding),
        Math.min(180, maxLongitude + longitudePadding),
        Math.min(90, maxLatitude + latitudePadding)
    );

    viewer.camera.flyTo({
        destination: rectangle,
        duration: 1.8,
        orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 }
    });
};
const svgDataUri = (svg) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
const escapeSvgText = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
const buoyPalette = {
    normal: { main: '#22d3ee', deep: '#0e7490', glow: '#67e8f9', label: '平稳' },
    attention: { main: '#facc15', deep: '#a16207', glow: '#fef08a', label: '关注' },
    warning: { main: '#fb923c', deep: '#c2410c', glow: '#fed7aa', label: '预警' },
    critical: { main: '#fb7185', deep: '#be123c', glow: '#fda4af', label: '高风险' },
    unknown: { main: '#94a3b8', deep: '#475569', glow: '#cbd5e1', label: '无数据' }
};
const buoyVisualLevel = (buoy) => buoy.status === 'offline' ? 'unknown' : buoy.riskLevel || 'unknown';
const buoyIcon = (buoy, selected) => {
    const palette = buoyPalette[buoyVisualLevel(buoy)] || buoyPalette.unknown;
    const glow = selected ? `<circle cx="36" cy="29" r="25" fill="${palette.glow}" opacity=".16"/><circle cx="36" cy="29" r="19" fill="none" stroke="${palette.glow}" stroke-width="1.5" opacity=".75"/>` : '';
    return svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="72" height="88" viewBox="0 0 72 88">
        <defs>
            <filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <linearGradient id="body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${palette.glow}"/><stop offset=".45" stop-color="${palette.main}"/><stop offset="1" stop-color="${palette.deep}"/></linearGradient>
        </defs>
        ${glow}
        <g filter="url(#glow)">
            <path d="M36 10v10" stroke="#e0f2fe" stroke-width="2" stroke-linecap="round"/>
            <circle cx="36" cy="8" r="5" fill="${palette.main}" stroke="#f8fafc" stroke-width="2"/>
            <path d="M29 22h14l3 19-10 7-10-7z" fill="url(#body)" stroke="#ecfeff" stroke-width="1.5"/>
            <path d="M25 28h22M26 34h20" stroke="#f8fafc" stroke-width="1.5" opacity=".65"/>
            <path d="M29 47h14l-3 12h-8z" fill="#164e63" stroke="#bae6fd" stroke-width="1.2"/>
        </g>
        <path d="M14 68c7-5 13-5 20 0s13 5 20 0 13-5 20 0" fill="none" stroke="${palette.main}" stroke-width="2.5" stroke-linecap="round" opacity=".9"/>
        <path d="M20 76c5-3 10-3 15 0s10 3 15 0 10-3 15 0" fill="none" stroke="${palette.glow}" stroke-width="1.5" stroke-linecap="round" opacity=".65"/>
    </svg>`);
};
const buoyInfoCard = (buoy, selected = false) => {
    const palette = buoyPalette[buoyVisualLevel(buoy)] || buoyPalette.unknown;
    const name = escapeSvgText(buoy.name || buoy.id || '浮标');
    const risk = escapeSvgText(riskLabel(buoy.riskLevel));
    const connection = escapeSvgText(statusLabel(buoy.status));
    const wind = escapeSvgText(`${metric(buoy.windSpeed)} m/s`);
    const wave = escapeSvgText(`${metric(buoy.waveHeight)} m`);
    const current = escapeSvgText(`${metric(buoy.currentSpeed)} m/s`);
    return svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="112" viewBox="0 0 300 112">
        <defs>
            <linearGradient id="card" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#10283b" stop-opacity=".98"/><stop offset="1" stop-color="#071522" stop-opacity=".98"/></linearGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#020617" flood-opacity=".7"/></filter>
        </defs>
        <path d="M16 7h268a9 9 0 0 1 9 9v70a9 9 0 0 1-9 9H16a9 9 0 0 1-9-9V16a9 9 0 0 1 9-9Z" fill="url(#card)" stroke="${selected ? palette.glow : palette.main}" stroke-width="${selected ? 2 : 1}" stroke-opacity=".8" filter="url(#shadow)"/>
        <path d="M16 7h268a9 9 0 0 1 9 9v4H7v-4a9 9 0 0 1 9-9Z" fill="${palette.main}" opacity=".9"/>
        <circle cx="25" cy="35" r="5" fill="${palette.main}"/><circle cx="25" cy="35" r="9" fill="none" stroke="${palette.main}" opacity=".25"/>
        <text x="40" y="39" fill="#f8fafc" font-size="17" font-family="Noto Sans SC, sans-serif" font-weight="700">${name}</text>
        <text x="265" y="35" text-anchor="end" fill="${palette.glow}" font-size="12" font-family="Noto Sans SC, sans-serif" font-weight="700">${risk}</text>
        <text x="265" y="50" text-anchor="end" fill="#94a3b8" font-size="10" font-family="Noto Sans SC, sans-serif">${connection}</text>
        <path d="M18 56h264" stroke="#334155" stroke-opacity=".9"/>
        <text x="28" y="72" fill="#94a3b8" font-size="11" font-family="Noto Sans SC, sans-serif">风速</text><text x="28" y="89" fill="#e0f2fe" font-size="15" font-family="Noto Sans SC, sans-serif" font-weight="700">${wind}</text>
        <text x="126" y="72" fill="#94a3b8" font-size="11" font-family="Noto Sans SC, sans-serif">浪高</text><text x="126" y="89" fill="#fef3c7" font-size="15" font-family="Noto Sans SC, sans-serif" font-weight="700">${wave}</text>
        <text x="224" y="72" fill="#94a3b8" font-size="11" font-family="Noto Sans SC, sans-serif">流速</text><text x="224" y="89" fill="#ede9fe" font-size="15" font-family="Noto Sans SC, sans-serif" font-weight="700">${current}</text>
    </svg>`);
};
const updateMap = () => {
    clearMap();
    const viewer = props.getViewer?.();
    if (!viewer) return;
    // 地图与左侧搜索/状态筛选保持一致，只显示当前可见的浮标。
    filteredBuoyRows.value.forEach((buoy) => {
        if (!Number.isFinite(Number(buoy.lng)) || !Number.isFinite(Number(buoy.lat))) return;
        const selected = buoy.id === selectedBuoyId.value;
        const position = Cesium.Cartesian3.fromDegrees(Number(buoy.lng), Number(buoy.lat), 120);
        mapEntities.push(viewer.entities.add({
            id: `buoy-monitor-${buoy.id}`,
            properties: { buoyId: buoy.id },
            position,
            billboard: { image: '/image/浮标.png', width: selected ? 112 : 96, height: selected ? 112 : 96, verticalOrigin: Cesium.VerticalOrigin.BOTTOM, disableDepthTestDistance: Number.POSITIVE_INFINITY, scaleByDistance: new Cesium.NearFarScalar(150000, 1.15, 4000000, .7) }
        }));
        // 所有浮标都显示摘要卡片；选中项通过放大、发光和白色描边强化。
        mapEntities.push(viewer.entities.add({
            id: `buoy-monitor-card-${buoy.id}`,
            properties: { buoyId: buoy.id },
            position,
            billboard: { image: buoyInfoCard(buoy, selected), width: selected ? 360 : 300, height: selected ? 134 : 112, verticalOrigin: Cesium.VerticalOrigin.BOTTOM, pixelOffset: new Cesium.Cartesian2(0, selected ? -76 : -66), disableDepthTestDistance: Number.POSITIVE_INFINITY, scaleByDistance: new Cesium.NearFarScalar(150000, selected ? 1.12 : 1, 3500000, selected ? .78 : .7) }
        }));
    });
    viewer.scene.requestRender();
};

const focusSelectedBuoy = () => {
    const viewer = props.getViewer?.();
    const buoy = selectedRow.value || selectedBuoy.value;
    if (!viewer || !buoy || !Number.isFinite(Number(buoy.lng)) || !Number.isFinite(Number(buoy.lat))) return;
    viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(Number(buoy.lng), Number(buoy.lat), 900000), duration: 1.4 });
    updateMap();
};

const darkTooltip = {
    trigger: 'axis',
    backgroundColor: 'rgba(3, 15, 29, 0.96)',
    borderColor: 'rgba(34, 211, 238, 0.72)',
    borderWidth: 1,
    textStyle: { color: '#e0f2fe', fontSize: 12 },
    extraCssText: 'box-shadow: 0 8px 24px rgba(0, 0, 0, .45); border-radius: 4px;',
    axisPointer: { type: 'line', lineStyle: { color: 'rgba(103, 232, 249, .6)', width: 1 } }
};
const chartAxisLabel = { color: '#f8fafc', fontSize: 10, fontWeight: 500, hideOverlap: true };
const chartAxisLine = { lineStyle: { color: '#64748b', width: 1 } };
const chartSplitLine = { lineStyle: { color: 'rgba(148, 163, 184, .28)', width: 1 } };
const chartAxisName = { color: '#f8fafc', fontSize: 10, fontWeight: 600 };
const chartOption = (title, unit, color, key) => ({ backgroundColor: 'transparent', title: { text: title, left: 4, top: 2, textStyle: { color: '#bae6fd', fontSize: 13, fontWeight: 700 } }, grid: { left: 46, right: 10, top: 34, bottom: 32 }, tooltip: { ...darkTooltip, valueFormatter: (value) => `${value} ${unit}` }, xAxis: { type: 'category', data: (history.value?.points || []).map((item) => formatTime(item.timestamp)), axisLabel: chartAxisLabel, axisLine: chartAxisLine }, yAxis: { type: 'value', name: unit, nameTextStyle: chartAxisName, axisLabel: chartAxisLabel, splitLine: chartSplitLine }, series: [{ type: 'line', smooth: true, showSymbol: false, data: (history.value?.points || []).map((item) => item[key]), lineStyle: { color, width: 2 }, areaStyle: { color: `${color}22` } }] });
const directionChartOption = () => ({ backgroundColor: 'transparent', title: { text: '风浪流方向', left: 4, top: 2, textStyle: { color: '#bae6fd', fontSize: 13, fontWeight: 700 } }, legend: { right: 4, top: 2, textStyle: { color: '#dbeafe', fontSize: 10 } }, grid: { left: 46, right: 10, top: 34, bottom: 32 }, tooltip: { ...darkTooltip, valueFormatter: (value) => `${value}°` }, xAxis: { type: 'category', data: (history.value?.points || []).map((item) => formatTime(item.timestamp)), axisLabel: chartAxisLabel, axisLine: chartAxisLine }, yAxis: { type: 'value', name: '°', min: 0, max: 360, interval: 90, nameTextStyle: chartAxisName, axisLabel: chartAxisLabel, splitLine: chartSplitLine }, series: [{ name: '风向', type: 'line', smooth: true, showSymbol: false, data: (history.value?.points || []).map((item) => item.windDirection), lineStyle: { color: '#22d3ee', width: 2 } }, { name: '浪向', type: 'line', smooth: true, showSymbol: false, data: (history.value?.points || []).map((item) => item.waveDirection), lineStyle: { color: '#facc15', width: 2 } }, { name: '流向', type: 'line', smooth: true, showSymbol: false, data: (history.value?.points || []).map((item) => item.currentDirection), lineStyle: { color: '#a78bfa', width: 2 } }] });
const chartInstances = () => ({ windChart, waveChart, currentChart, wavePeriodChart, directionChart });
const setChartInstance = (name, chart) => {
    if (name === 'windChart') windChart = chart;
    else if (name === 'waveChart') waveChart = chart;
    else if (name === 'currentChart') currentChart = chart;
    else if (name === 'wavePeriodChart') wavePeriodChart = chart;
    else if (name === 'directionChart') directionChart = chart;
};
const renderCharts = async () => {
    await nextTick();
    if (!props.show || !hasHistory.value) return;
    const configs = [
        [windChartRef, '风速', 'm/s', '#22d3ee', 'windSpeed', 'windChart'],
        [waveChartRef, '浪高', 'm', '#facc15', 'waveHeight', 'waveChart'],
        [currentChartRef, '流速', 'm/s', '#a78bfa', 'currentSpeed', 'currentChart'],
        [wavePeriodChartRef, '浪周期', 's', '#fb923c', 'wavePeriod', 'wavePeriodChart']
    ];
    configs.forEach(([chartRef, title, unit, color, key, name]) => {
        if (!chartRef.value) return;
        let chart = chartInstances()[name];
        if (!chart || chart.getDom() !== chartRef.value) {
            chart?.dispose();
            chart = echarts.init(chartRef.value);
            setChartInstance(name, chart);
        }
        chart.setOption(chartOption(title, unit, color, key), true);
        chart.resize();
    });
    if (directionChartRef.value) {
        let chart = directionChart;
        if (!chart || chart.getDom() !== directionChartRef.value) {
            chart?.dispose();
            chart = echarts.init(directionChartRef.value);
            directionChart = chart;
        }
        chart.setOption(directionChartOption(), true);
        chart.resize();
    }
};
const resizeCharts = () => [windChart, waveChart, currentChart, wavePeriodChart, directionChart].forEach((chart) => chart?.resize());
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
const markLiveChanges = (previous, next) => {
    const previousById = new Map(previous.map((item) => [item.buoyId, item]));
    const nextChangedIds = new Set();
    const nextDeltas = {};
    const valueKeys = ['windSpeed', 'waveHeight', 'currentSpeed', 'wavePeriod'];
    next.forEach((item) => {
        const previousItem = previousById.get(item.buoyId);
        if (!previousItem) {
            nextChangedIds.add(item.buoyId);
            return;
        }
        if (item.timestamp !== previousItem.timestamp) nextChangedIds.add(item.buoyId);
        const deltas = {};
        valueKeys.forEach((key) => {
            const currentValue = Number(item[key]);
            const previousValue = Number(previousItem[key]);
            if (!Number.isFinite(currentValue) || !Number.isFinite(previousValue)) return;
            const delta = currentValue - previousValue;
            if (Math.abs(delta) >= 0.005) {
                nextChangedIds.add(item.buoyId);
                deltas[key] = delta;
            }
        });
        if (Object.keys(deltas).length) nextDeltas[item.buoyId] = deltas;
    });
    changedBuoyIds.value = nextChangedIds;
    lastLiveDeltas.value = nextDeltas;
    if (changeHighlightTimer) window.clearTimeout(changeHighlightTimer);
    if (nextChangedIds.size) {
        changeHighlightTimer = window.setTimeout(() => {
            changedBuoyIds.value = new Set();
        }, 4200);
    }
};
const refreshRealtime = async () => {
    if (refreshing.value || !props.show) return;
    refreshing.value = true;
    let realtimeUpdated = false;
    try {
        const nextRealtime = await fetchBuoyRealtime();
        const normalizedRealtime = Array.isArray(nextRealtime) ? nextRealtime : [];
        markLiveChanges(realtime.value, normalizedRealtime);
        realtime.value = normalizedRealtime;
        lastRefreshAt.value = new Date();
        refreshCountdown.value = REFRESH_INTERVAL_SECONDS;
        errorMessage.value = '';
        updateMap();
        realtimeUpdated = true;
    } catch (error) {
        errorMessage.value = `实时数据加载失败：${error.message}`;
    } finally {
        refreshing.value = false;
    }
    // 实时读数更新后同步刷新当前浮标曲线，避免右侧数值和底部曲线停留在不同时间点。
    if (realtimeUpdated && selectedBuoyId.value) await loadHistory({ force: true });
};
const stopAutoRefresh = () => {
    if (refreshTimer) window.clearInterval(refreshTimer);
    if (countdownTimer) window.clearInterval(countdownTimer);
    refreshTimer = null;
    countdownTimer = null;
};
const startAutoRefresh = () => {
    stopAutoRefresh();
    if (!props.show || !autoRefresh.value) return;
    refreshCountdown.value = REFRESH_INTERVAL_SECONDS;
    refreshTimer = window.setInterval(refreshRealtime, REFRESH_INTERVAL_SECONDS * 1000);
    countdownTimer = window.setInterval(() => {
        if (!refreshing.value) refreshCountdown.value = Math.max(0, refreshCountdown.value - 1);
    }, 1000);
};
const toggleAutoRefresh = () => {
    autoRefresh.value = !autoRefresh.value;
    if (autoRefresh.value) startAutoRefresh();
    else stopAutoRefresh();
};
const loadWorkspace = async () => { loading.value = true; errorMessage.value = ''; try { const [list, live] = await Promise.all([fetchBuoys(), fetchBuoyRealtime()]); buoys.value = Array.isArray(list) ? list : []; realtime.value = Array.isArray(live) ? live : []; lastRefreshAt.value = new Date(); refreshCountdown.value = REFRESH_INTERVAL_SECONDS; const selectionChanged = !selectedBuoyId.value || !buoys.value.some((item) => item.id === selectedBuoyId.value); if (selectionChanged) selectedBuoyId.value = buoys.value[0]?.id || ''; updateMap(); await nextTick(); focusBuoyRegion(); if (!selectionChanged) await loadHistory(); } catch (error) { errorMessage.value = `浮标监测暂不可用：${error.message}`; } finally { loading.value = false; } };
const start = async () => { await loadWorkspace(); if (props.show) startAutoRefresh(); };
const stop = () => { stopAutoRefresh(); if (changeHighlightTimer) window.clearTimeout(changeHighlightTimer); changeHighlightTimer = null; changedBuoyIds.value = new Set(); historyRequestId += 1; historyAbortController?.abort(); historyAbortController = null; clearMap(); };
const selectBuoy = (buoyId) => {
    const targetId = String(buoyId || '');
    if (!targetId || !buoys.value.some((item) => String(item.id) === targetId)) return;
    selectedBuoyId.value = targetId;
};
watch(() => props.show, (visible) => { if (visible) start(); else stop(); }, { immediate: true });
watch(selectedBuoyId, (nextId, previousId) => {
    if (!props.show) return;
    if (nextId !== previousId) {
        // 切换浮标时先清除旧曲线，避免新浮标标题下短暂显示旧浮标数据。
        history.value = null;
        historyError.value = '';
    }
    updateMap();
    loadHistory();
});
watch(range, () => { if (props.show) { updateMap(); loadHistory(); } });
watch([searchTerm, statusFilter], () => {
    const visibleRows = filteredBuoyRows.value;
    if (!visibleRows.length) {
        selectedBuoyId.value = '';
        history.value = null;
        historyError.value = '';
        updateMap();
        return;
    }
    if (!visibleRows.some((buoy) => buoy.id === selectedBuoyId.value)) {
        selectedBuoyId.value = visibleRows[0].id;
        return;
    }
    updateMap();
});
watch(hasHistory, (available) => { if (available) renderCharts(); }); window.addEventListener('resize', resizeCharts);
onBeforeUnmount(() => { stop(); window.removeEventListener('resize', resizeCharts); [windChart, waveChart, currentChart, wavePeriodChart, directionChart].forEach((chart) => chart?.dispose()); });
defineExpose({ selectBuoy, focusBuoyRegion });
</script>

<style scoped>
.live-update-highlight {
    animation: buoy-live-update 1.4s ease-out;
}

@keyframes buoy-live-update {
    0% {
        border-color: rgba(103, 232, 249, 0.95);
        box-shadow: 0 0 0 rgba(34, 211, 238, 0);
        background-color: rgba(8, 47, 73, 0.72);
    }

    45% {
        border-color: rgba(103, 232, 249, 0.9);
        box-shadow: 0 0 22px rgba(34, 211, 238, 0.28);
        background-color: rgba(8, 47, 73, 0.58);
    }

    100% {
        border-color: rgba(34, 211, 238, 0.2);
        box-shadow: 0 0 0 rgba(34, 211, 238, 0);
        background-color: rgba(2, 6, 23, 0.45);
    }
}
</style>
