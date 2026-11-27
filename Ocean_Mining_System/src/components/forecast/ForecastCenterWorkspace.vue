<template>
    <transition name="workspace-fade">
        <div v-if="show" class="pointer-events-none absolute inset-0 z-40 font-['Noto_Sans_SC']">
            <div class="pointer-events-none absolute left-8 top-36 flex h-[54.5rem] w-[29rem] flex-col">
                <section class="tech-panel-enhanced pointer-events-auto relative flex max-h-full min-h-0 flex-col overflow-hidden p-5" style="clip-path: polygon(0 0,100% 0,100% calc(100% - 24px),calc(100% - 24px) 100%,0 100%);">
                    <div class="absolute left-0 top-0 h-[2px] w-full animate-pulse bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                    <div class="corner-decoration corner-tl scale-125"></div><div class="corner-decoration corner-tr scale-125"></div>

                    <div class="mb-4 flex shrink-0 items-center border-b-2 border-cyan-500/40 pb-3">
                        <div class="mr-3 h-7 w-1.5 bg-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.8)]"></div>
                        <h3 class="flex-1 text-[26px] font-bold tracking-wider text-white">预报中心</h3>
                        <button class="floating-panel-close-btn floating-panel-close-btn--inline" type="button" title="关闭预报中心" @click="emit('close')">✕</button>
                    </div>

                    <div class="custom-scrollbar min-h-0 space-y-4 overflow-y-auto pr-1">
                        <div class="border border-cyan-500/25 bg-cyan-950/30 px-3.5 py-3">
                            <div class="flex items-center justify-between gap-2">
                                <div class="truncate text-[18px] font-bold text-white">{{ selectedTarget?.name || '请选择矿区' }}</div>
                                <span :class="['shrink-0 text-[14px] font-bold', dataStatusClass]">{{ dataStatusText }}</span>
                            </div>
                            <div v-if="station?.lng != null && station?.lat != null" class="mt-1.5 text-[16px] font-medium tabular-nums text-[#d7e6f2]">
                                经度 {{ formatNumber(station.lng, 4) }}° · 纬度 {{ formatNumber(station.lat, 4) }}°
                            </div>
                        </div>

                        <div>
                            <div class="mb-2 flex items-center justify-between"><div class="text-[16px] font-bold text-cyan-200">预报矿区</div><div class="text-[14px] text-[#9bbad0]">{{ targets.length }} 个</div></div>
                            <div class="grid gap-2">
                                <button v-for="target in targets" :key="target.id" type="button" :class="['border px-3.5 py-2.5 text-left text-[17px] font-bold transition-colors', target.id === targetId ? 'border-cyan-300 bg-cyan-950/60 text-white' : 'border-slate-700 bg-slate-950/40 text-[#d7e6f2] hover:border-cyan-500 hover:text-white']" :aria-pressed="target.id === targetId" @click="selectMine(target.id)">{{ target.name }}</button>
                            </div>
                            <div v-if="stationOptions.length > 1" class="mt-3 flex items-center gap-3 text-[15px] font-semibold text-[#d7e6f2]">
                                <span class="shrink-0">预报站点</span>
                                <PanelSelect :model-value="siteId" class="flex-1" :options="stationOptions" label="预报站点" overlay :max-height="180" @update:model-value="value => selectMine(targetId, value)" />
                            </div>
                        </div>

                        <div class="border-y border-cyan-500/20 py-3.5">
                            <div class="mb-2 text-[16px] font-bold text-cyan-200">预报时段</div>
                            <div class="grid grid-cols-3 gap-2"><button v-for="item in ranges" :key="item.value" type="button" :class="['border py-2.5 text-[17px] font-bold transition-colors', range === item.value ? 'border-cyan-300 bg-cyan-500/25 text-white' : 'border-slate-700 text-[#b6d0e2] hover:border-cyan-500 hover:text-white']" @click="range = item.value">{{ item.label }}</button></div>
                        </div>

                        <div v-if="summary && series.length" class="grid grid-cols-2 gap-2.5">
                            <div class="border border-cyan-500/20 bg-slate-950/45 px-3.5 py-2.5"><div class="text-[14px] text-[#9bbad0]">综合风险</div><strong :class="['mt-1 block text-[22px] font-extrabold', riskClass(availableRiskLevel)]">{{ riskText(availableRiskLevel) }}</strong></div>
                            <div class="border border-cyan-500/20 bg-slate-950/45 px-3.5 py-2.5"><div class="text-[14px] text-[#9bbad0]">有效时段</div><strong class="mt-1.5 block text-[15px] font-bold tabular-nums text-white">{{ formatShortDate(summary.periodStart) }} 至 {{ formatShortDate(summary.periodEnd) }}</strong></div>
                        </div>

                        <div v-if="errorMessage" class="border border-rose-500/35 bg-rose-950/30 p-3 text-[15px] text-rose-100">{{ errorMessage }}</div>
                    </div>
                </section>
            </div>

            <div class="pointer-events-none absolute right-6 top-36 flex h-[54.5rem] w-[31rem] flex-col">
                <section class="tech-panel-enhanced pointer-events-auto relative flex max-h-full min-h-0 flex-col overflow-hidden p-5" style="clip-path: polygon(0 0,calc(100% - 28px) 0,100% 28px,100% 100%,0 100%);">
                    <div class="absolute left-0 top-0 h-[2px] w-full animate-pulse bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                    <div class="corner-decoration corner-bl scale-125"></div><div class="corner-decoration corner-br scale-125"></div>

                    <div class="mb-3 flex shrink-0 items-center justify-between gap-2 border-b-2 border-cyan-500/40 pb-3">
                        <div class="min-w-0">
                            <div class="text-[24px] font-bold text-white">预报报文</div>
                            <div class="mt-1 truncate text-[15px] text-[#9bbad0]">{{ summary?.regionName || selectedTarget?.name || '--' }} · {{ rangeLabel }}</div>
                        </div>
                        <div class="flex shrink-0 items-center gap-2">
                            <button v-for="format in ['txt', 'pdf']" :key="format" class="border border-cyan-500/45 bg-cyan-950/50 px-3 py-1.5 text-[15px] font-bold text-cyan-100 hover:border-cyan-300 hover:text-white disabled:opacity-40" type="button" :disabled="loading || !series.length || !!downloading" @click="downloadReport(format)">{{ downloading === format ? '生成中' : format.toUpperCase() }}</button>
                        </div>
                    </div>

                    <div v-if="loading" class="py-8 text-center text-[16px] text-[#9bbad0]">正在加载预报...</div>
                    <div v-else-if="!series.length" class="py-8 text-center text-[16px] text-[#9bbad0]">暂无预报数据</div>
                    <div v-else class="custom-scrollbar min-h-0 space-y-3 overflow-y-auto pr-1">
                        <div class="relative overflow-hidden rounded border border-cyan-400/35 bg-gradient-to-br from-cyan-950/75 via-slate-950/65 to-slate-950/90 p-4 shadow-[0_0_18px_rgba(34,211,238,.08)]">
                            <div class="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-cyan-300 via-cyan-500 to-blue-600"></div>
                            <div class="flex items-center justify-between gap-3 pl-2">
                                <div class="text-[16px] font-bold text-cyan-200">综合预报结论</div>
                                <span :class="['shrink-0 rounded-full border px-3 py-0.5 text-[14px] font-bold', riskBadgeClass]">{{ riskText(availableRiskLevel) }}</span>
                            </div>
                            <div class="mt-2 pl-2 text-[17px] font-semibold leading-7 text-white">{{ overallConclusion }}</div>
                            <div class="mt-2.5 flex flex-wrap gap-2 pl-2 text-[14px]">
                                <span class="rounded border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-0.5 text-cyan-200">{{ rangeLabel }} · {{ summary?.dataPointCount ?? series.length }} 时次</span>
                                <span class="rounded border border-slate-700 bg-slate-900/70 px-2.5 py-0.5 text-[#b6d0e2]">批次 {{ summary?.baseDate || '--' }} {{ summary?.runCycle || '' }}</span>
                                <span class="rounded border border-slate-700 bg-slate-900/70 px-2.5 py-0.5 text-amber-200">{{ dataStatusText }}</span>
                            </div>
                        </div>

                        <div class="rounded border border-slate-700/80 bg-slate-950/45 p-3.5">
                            <div class="mb-2.5 flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-yellow-300 shadow-[0_0_8px_#fde68a]"></span><div class="text-[16px] font-bold text-cyan-200">核心指标</div></div>
                            <div class="grid grid-cols-2 gap-2.5">
                                <div v-for="metric in reportMetrics" :key="metric.label" class="rounded border border-slate-800 bg-slate-900/60 px-3 py-2.5">
                                    <div class="truncate text-[14px] text-[#9bbad0]">{{ metric.label }}</div>
                                    <div class="mt-1 whitespace-nowrap text-[22px] font-extrabold tabular-nums text-white">{{ metric.value }}<span class="ml-1 text-[14px] font-normal text-[#9bbad0]">{{ metric.unit }}</span></div>
                                </div>
                            </div>
                        </div>

                        <div class="rounded border border-slate-700/80 bg-slate-950/45 p-3.5">
                            <div class="mb-2.5 flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-violet-300 shadow-[0_0_8px_#c4b5fd]"></span><div class="text-[16px] font-bold text-cyan-200">分时段预报</div></div>
                            <div v-if="reportPoints.length" class="space-y-2">
                                <div v-for="point in reportPoints" :key="point.key" class="relative rounded border border-slate-800 bg-slate-900/50 px-3 py-2.5 pl-4 before:absolute before:bottom-2 before:left-1.5 before:top-2 before:w-0.5 before:bg-cyan-500/60">
                                    <div class="flex items-center justify-between gap-2">
                                        <span class="text-[16px] font-bold tabular-nums text-white">{{ point.label }}</span>
                                        <span class="text-[16px] font-bold tabular-nums text-cyan-200">浪 {{ point.wave }} m · 风 {{ point.wind }} m/s</span>
                                    </div>
                                    <div class="mt-1 text-[14px] tabular-nums text-[#9bbad0]">流速 {{ point.current }} m/s<span v-if="point.wavePeriod !== '--'"> · 浪周期 {{ point.wavePeriod }} s</span></div>
                                </div>
                            </div>
                            <div v-else class="py-3 text-[15px] text-[#9bbad0]">暂无分时段预报数据</div>
                        </div>

                        <div class="relative overflow-hidden rounded border border-amber-400/35 bg-gradient-to-r from-amber-950/55 to-slate-950/60 p-4">
                            <div class="absolute bottom-0 left-0 top-0 w-1 bg-amber-400"></div>
                            <div class="pl-2">
                                <div class="text-[16px] font-bold text-amber-200">作业建议</div>
                                <div class="mt-1.5 text-[16px] leading-7 text-white">{{ operationAdvice }}</div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <div class="pointer-events-none absolute bottom-12 left-[31.5rem] right-[33rem] h-[22rem]">
                <section class="tech-panel-enhanced pointer-events-auto relative flex h-full flex-col overflow-hidden p-4">
                    <div class="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                    <div class="mb-2 flex shrink-0 items-center justify-between">
                        <div class="flex items-baseline gap-3">
                            <div class="text-[20px] font-bold text-white">风浪流趋势预报</div>
                            <div class="text-[15px] text-[#9bbad0]">{{ summary?.regionName || selectedTarget?.name || '--' }} · {{ series.length }} 时次<span v-if="summary?.stale" class="ml-2 font-semibold text-amber-200">已过期</span></div>
                        </div>
                        <button class="text-[15px] font-bold text-cyan-300 hover:text-white" type="button" @click="refresh">刷新</button>
                    </div>
                    <div class="relative min-h-0 flex-1 w-full"><div ref="chartRef" class="h-full w-full"></div><div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-slate-950/55 text-[16px] text-[#d7e6f2]">正在加载预报数据...</div><div v-if="!loading && !series.length" class="absolute inset-0 flex items-center justify-center text-[16px] text-[#9bbad0]">暂无趋势数据</div></div>
                </section>
            </div>
        </div>
    </transition>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts';
import { downloadForecastTargetBulletin, fetchForecastTarget, fetchForecastTargets } from '../../api/forecastWarningBuoy.js';
import { forecastInitialTime, forecastTargetSeries } from '../../utils/forecastReportText.js';
import { chartAxisLabel, chartAxisName, chartLegendText, chartTooltipStyle } from '../../utils/chartTypography.js';
import PanelSelect from '../common/PanelSelect.vue';

const props = defineProps({ show: Boolean });
const emit = defineEmits(['close', 'selectTarget']);
const targets = ref([]);
const targetId = ref('');
const siteId = ref(null);
const range = ref('12h');
const summary = ref(null);
const series = ref([]);
const loading = ref(false);
const downloading = ref(null);
const errorMessage = ref('');
const chartRef = ref(null);
let chart = null;
let requestSerial = 0;

const ranges = [{ value: '12h', label: '12小时' }, { value: '7d', label: '7天' }, { value: '15d', label: '15天' }];
const rangeLabel = computed(() => summary.value?.rangeLabel || ranges.find(item => item.value === range.value)?.label || '--');
const selectedTarget = computed(() => targets.value.find(target => target.id === targetId.value));
const station = computed(() => selectedTarget.value?.stations.find(item => item.id === siteId.value));
const stationOptions = computed(() => (selectedTarget.value?.stations || []).map(item => ({ value: item.id, label: item.label })));
const initialTime = computed(() => forecastInitialTime(summary.value ? [summary.value] : []).replace(' UTC+08:00', ''));
const selectMine = async (id, preferredSite, locate = true) => {
    targets.value = await fetchForecastTargets();
    const target = targets.value.find(item => item.id === id) || (!id && targets.value[0]);
    if (!props.show || !target) return false;
    const next = target.stations.find(item => item.id === Number(preferredSite))
        || (targetId.value === id && station.value) || target.stations[0];
    targetId.value = target.id;
    siteId.value = next?.id ?? null;
    emit('selectTarget', target, next, locate);
    return true;
};
defineExpose({ selectMine });
const toNumber = (value) => { if(value==null || value==='')return null; const number = Number(value); return Number.isFinite(number) ? number : null; };
const formatNumber = (value, digits = 1) => { const number = toNumber(value); return number === null ? '--' : number.toFixed(digits); };
const formatDate = (value) => { if (!value) return '--'; const date = new Date(value); return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('zh-CN', { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); };
const formatShortDate = (value) => { if (!value) return '--'; const date = new Date(value); return Number.isNaN(date.getTime()) ? String(value).slice(5, 10) : `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`; };
const formatAxisDate = (value) => { if (!value) return '--'; const date = new Date(value); return Number.isNaN(date.getTime()) ? String(value) : `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`; };
const availableRiskLevel = computed(() => summary.value?.stale ? null : summary.value?.riskLevel);
const riskText = (level) => ({ SAFE: '安全', MODERATE: '注意', HIGH: '高风险', CRITICAL: '严重风险' }[level] || '待评估');
const riskClass = (level) => ({ SAFE: 'text-emerald-300', MODERATE: 'text-amber-200', HIGH: 'text-orange-300', CRITICAL: 'text-rose-300' }[level] || 'text-slate-300');
const riskBadgeClass = computed(() => ({ SAFE: 'border-emerald-400/40 bg-emerald-950/40 text-emerald-300', MODERATE: 'border-amber-400/40 bg-amber-950/40 text-amber-200', HIGH: 'border-orange-400/40 bg-orange-950/40 text-orange-300', CRITICAL: 'border-rose-400/40 bg-rose-950/40 text-rose-300' }[availableRiskLevel.value] || 'border-slate-600 bg-slate-900 text-slate-300'));
const dataStatusText = computed(() => {
    if (loading.value) return '正在更新';
    if (!series.value.length) return '暂无数据';
    if (summary.value?.stale) return '已过期';
    if (!availableRiskLevel.value) return '数据不完整';
    return '已更新';
});
const dataStatusClass = computed(() => availableRiskLevel.value ? 'text-emerald-300' : loading.value ? 'text-cyan-300' : 'text-amber-300');
const trendText = (value) => ({ UP: '上升', RISING: '上升', INCREASING: '上升', DOWN: '下降', FALLING: '下降', DECREASING: '下降', STABLE: '平稳', STEADY: '平稳', FLAT: '平稳' }[String(value || '').trim().toUpperCase()] || value || '暂无');
const trendClass = (value) => ({ 上升: 'text-amber-300', 下降: 'text-cyan-300', 平稳: 'text-emerald-300' }[trendText(value)] || 'text-slate-300');
const maxFromSeries = (field) => series.value.reduce((max, item) => { const value = toNumber(item?.[field]); return value === null ? max : Math.max(max, value); }, null);
const summaryMetrics = computed(() => [{ label: '平均风速', value: formatNumber(summary.value?.windSpeedAvg), unit: 'm/s' }, { label: '最大风速', value: formatNumber(summary.value?.windSpeedMax ?? maxFromSeries('windSpeedMax')), unit: 'm/s' }, { label: '最大浪高', value: formatNumber(summary.value?.waveHeightMax ?? maxFromSeries('waveHeightMax')), unit: 'm' }, { label: '平均流速', value: formatNumber(summary.value?.currentSpeedAvg), unit: 'm/s' }]);
const reportMetrics = computed(() => [{ label: '平均风速', value: formatNumber(summary.value?.windSpeedAvg), unit: 'm/s' }, { label: '最大阵风', value: formatNumber(summary.value?.gustMax ?? maxFromSeries('gustMax')), unit: 'm/s' }, { label: '平均浪高', value: formatNumber(summary.value?.waveHeightAvg), unit: 'm' }, { label: '最大浪高', value: formatNumber(summary.value?.waveHeightMax ?? maxFromSeries('waveHeightMax')), unit: 'm' }, { label: '平均浪周期', value: formatNumber(summary.value?.wavePeriodAvg), unit: 's' }, { label: '最大流速', value: formatNumber(summary.value?.currentSpeedMax ?? maxFromSeries('currentSpeedMax')), unit: 'm/s' }]);
const trendItems = computed(() => [{ label: '风速趋势', value: trendText(summary.value?.windTrend), className: trendClass(summary.value?.windTrend) }, { label: '浪高趋势', value: trendText(summary.value?.waveTrend), className: trendClass(summary.value?.waveTrend) }, { label: '流速趋势', value: trendText(summary.value?.currentTrend), className: trendClass(summary.value?.currentTrend) }]);
const peakDescription = computed(() => { const peaks = [{ label: '风速', value: toNumber(summary.value?.windSpeedMax ?? maxFromSeries('windSpeedMax')), unit: 'm/s', field: 'windSpeedMax' }, { label: '浪高', value: toNumber(summary.value?.waveHeightMax ?? maxFromSeries('waveHeightMax')), unit: 'm', field: 'waveHeightMax' }, { label: '流速', value: toNumber(summary.value?.currentSpeedMax ?? maxFromSeries('currentSpeedMax')), unit: 'm/s', field: 'currentSpeedMax' }].filter((item) => item.value !== null); if (!peaks.length) return '当前暂无足够的数值数据用于峰值判断。'; return peaks.map((peak) => { const point = series.value.find((item) => toNumber(item?.[peak.field]) === peak.value); const pointTime = point ? (range.value === '12h' ? formatDate(point.forecastTime) : point.forecastDate) : ''; return pointTime ? `预计在${pointTime}，${peak.label}达到${peak.value.toFixed(1)} ${peak.unit}` : `${peak.label}最高达到${peak.value.toFixed(1)} ${peak.unit}`; }).join('；') + '。'; });
const overallConclusion = computed(() => {
    if (summary.value?.stale) return '当前批次已过期。';
    if (!availableRiskLevel.value) return '预报数据不完整，风险待评估。';
    return peakDescription.value;
});
const operationAdvice = computed(() => ({
    SAFE: '保持常规值守，持续关注预报更新。',
    MODERATE: '关注风浪流峰值，预留作业调整时间。',
    HIGH: '加强现场监测，按作业规程做好调整准备。',
    CRITICAL: '按应急预案组织值守和避险。'
}[availableRiskLevel.value] || '请结合后续预报和现场观测。'));
const reportPoints = computed(() => { const list = series.value || []; if (!list.length) return []; if (range.value !== '12h') return list.slice(0, range.value === '7d' ? 7 : 15).map((item, index) => ({ ...item, key: `${item.forecastDate || index}`, label: item.forecastDate || `第${index + 1}天`, wind: formatNumber(item.windSpeedAvg), wave: formatNumber(item.waveHeightAvg), current: formatNumber(item.currentSpeedAvg), wavePeriod: formatNumber(item.wavePeriodAvg), windDirection: item.windDirMean ?? '--' })); const step = Math.max(1, Math.ceil(list.length / 6)); return list.filter((_, index) => index % step === 0 || index === list.length - 1).map((item, index) => ({ ...item, key: `${item.forecastTime || index}`, label: formatDate(item.forecastTime), wind: formatNumber(item.windSpeedAvg), wave: formatNumber(item.waveHeightAvg), current: formatNumber(item.currentSpeedAvg), wavePeriod: formatNumber(item.wavePeriodAvg), windDirection: item.windDirMean ?? '--' })); });

const renderChart = async () => {
    await nextTick();
    if (!props.show || !chartRef.value) return;
    if (!chart || chart.getDom() !== chartRef.value) { chart?.dispose(); chart = echarts.init(chartRef.value); }
    const labels = series.value.map((item) => range.value === '12h' ? formatAxisDate(item.forecastTime) : item.forecastDate || '--');
    const line = (name, field, color, yAxisIndex = 0, dashed = false) => ({ name, type: 'line', smooth: true, yAxisIndex, showSymbol: false, connectNulls: false, data: series.value.map((item) => toNumber(item?.[field])), lineStyle: { width: dashed ? 1.2 : 2, type: dashed ? 'dashed' : 'solid', opacity: dashed ? 0.65 : 1, color }, itemStyle: { color } });
    chart.setOption({ backgroundColor: 'transparent', color: ['#22d3ee', '#67e8f9', '#facc15', '#fde68a', '#a78bfa', '#c4b5fd', '#fb923c'], tooltip: { trigger: 'axis', ...chartTooltipStyle(), axisPointer: { type: 'line', lineStyle: { color: '#67e8f9' } } }, legend: { top: 0, left: 0, right: 0, itemWidth: 16, itemHeight: 8, itemGap: 14, textStyle: chartLegendText(), data: ['平均风速', '最大风速', '平均浪高', '最大浪高', '平均流速', '最大流速', '最大阵风'] }, grid: { left: 60, right: 60, top: 56, bottom: 38 }, xAxis: { type: 'category', data: labels, axisLabel: chartAxisLabel({ hideOverlap: true }), axisLine: { lineStyle: { color: '#47657e' } } }, yAxis: [{ type: 'value', name: '风/流 m/s', axisLabel: chartAxisLabel(), nameTextStyle: chartAxisName(), splitLine: { lineStyle: { color: 'rgba(148,179,204,.24)' } } }, { type: 'value', name: '浪高 m', position: 'right', axisLabel: chartAxisLabel(), nameTextStyle: chartAxisName(), splitLine: { show: false } }], series: [line('平均风速', 'windSpeedAvg', '#22d3ee'), line('最大风速', 'windSpeedMax', '#67e8f9', 0, true), line('平均浪高', 'waveHeightAvg', '#facc15', 1), line('最大浪高', 'waveHeightMax', '#fde68a', 1, true), line('平均流速', 'currentSpeedAvg', '#a78bfa'), line('最大流速', 'currentSpeedMax', '#c4b5fd', 0, true), line('最大阵风', 'gustMax', '#fb923c', 0, true)] }, true);
};

const loadData = async () => {
    if (!targetId.value) return;
    const serial = ++requestSerial;
    loading.value = true;
    errorMessage.value = '';
    summary.value = null;
    series.value = [];
    try {
        const { report } = await fetchForecastTarget(targetId.value, range.value, siteId.value);
        if (serial !== requestSerial) return;
        summary.value = report.summary;
        series.value = forecastTargetSeries(report);
    } catch (error) {
        if (serial === requestSerial) errorMessage.value = `预报数据加载失败：${error.message}`;
    } finally {
        if (serial === requestSerial) loading.value = false;
    }
};

const refresh = async () => {
    if (targetId.value) return loadData();
    try {
        await selectMine('', null);
    } catch (error) {
        errorMessage.value = `矿区加载失败：${error.message}`;
    }
};
const downloadReport = async (format) => {
    if (downloading.value || loading.value || !series.value.length) return;
    downloading.value = format;
    errorMessage.value = '';
    try {
        await downloadForecastTargetBulletin(targetId.value, range.value, siteId.value, format, summary.value);
    } catch (error) {
        errorMessage.value = `报文下载失败：${error.message}`;
    } finally {
        downloading.value = null;
    }
};
const resizeChart = () => chart?.resize();
watch(() => props.show, async (visible) => {
    if (visible) {
        if (!targetId.value) await refresh();
        else {
            if (await selectMine(targetId.value, siteId.value)) await loadData();
        }
    } else {
        requestSerial++;
        chart?.dispose();
        chart = null;
    }
}, { immediate: true });
watch([targetId, siteId, range], () => { if (props.show && targetId.value) loadData(); });
watch(series, renderChart);
onMounted(() => window.addEventListener('resize', resizeChart));
onBeforeUnmount(() => {
    requestSerial++;
    chart?.dispose();
    window.removeEventListener('resize', resizeChart);
});
</script>
