<template>
    <transition name="workspace-fade">
        <div v-if="show" class="pointer-events-none absolute inset-0 z-40 font-['Noto_Sans_SC']">
            <div class="pointer-events-none absolute left-8 top-36 w-[27rem] max-h-[54.5rem]">
                <section class="tech-panel-enhanced pointer-events-auto relative flex max-h-[54.5rem] flex-col overflow-hidden p-5" style="clip-path: polygon(0 0,100% 0,100% 95%,92% 100%,0 100%);">
                    <div class="absolute left-0 top-0 h-[2px] w-full animate-pulse bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                    <div class="corner-decoration corner-tl scale-125"></div><div class="corner-decoration corner-tr scale-125"></div>

                    <div class="mb-4 flex items-center border-b-2 border-cyan-500/40 pb-3">
                        <div class="mr-3 h-6 w-1.5 bg-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.8)]"></div>
                        <div class="flex-1"><h3 class="text-2xl font-bold tracking-wider text-white">预报中心</h3><div class="mt-1 text-[11px] text-slate-500">常规风浪流预报 · 区域级预报服务</div></div>
                        <button class="floating-panel-close-btn floating-panel-close-btn--inline" type="button" title="关闭预报中心" @click="emit('close')">✕</button>
                    </div>

                    <div class="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
                        <div class="mb-4 flex items-center justify-between border border-cyan-500/20 bg-cyan-950/25 px-3 py-2">
                            <div><div class="text-[11px] uppercase tracking-widest text-slate-500">当前预报对象</div><div class="mt-1 text-sm font-bold text-cyan-100">{{ selectedRegion?.regionName || '等待区域数据' }}</div></div>
                            <div class="text-right"><div class="text-[11px] text-slate-500">数据状态</div><div :class="['mt-1 text-xs font-bold', dataStatusClass]">{{ dataStatusText }}</div></div>
                        </div>

                        <div class="mb-4">
                            <div class="mb-2 flex items-center justify-between"><div class="text-sm font-bold text-cyan-200">预报区域</div><div class="text-[11px] text-slate-500">共 {{ regions.length }} 个区域</div></div>
                            <div class="grid grid-cols-2 gap-2">
                                <button v-for="region in regions" :key="region.regionId" type="button" :class="['border px-3 py-2 text-left text-sm transition-colors', region.regionId === selectedRegionId ? 'border-cyan-300 bg-cyan-950/55 text-white shadow-[0_0_12px_rgba(34,211,238,.15)]' : 'border-slate-700 bg-slate-950/35 text-slate-300 hover:border-cyan-500']" @click="selectRegion(region)">{{ region.regionName || region.regionCode }}</button>
                            </div>
                        </div>

                        <div class="mb-4 border-y border-cyan-500/20 py-3">
                            <div class="mb-2 flex items-center justify-between"><div class="text-sm font-bold text-cyan-200">预报时段</div><div class="text-[11px] text-slate-500">默认未来12小时</div></div>
                            <div class="grid grid-cols-3 gap-2"><button v-for="item in ranges" :key="item.value" type="button" :class="['border py-2 text-xs font-bold transition-colors', range === item.value ? 'border-cyan-300 bg-cyan-500/20 text-white' : 'border-slate-700 text-slate-400 hover:border-cyan-500']" @click="range = item.value">{{ item.label }}</button></div>
                        </div>

                        <div v-if="summary" class="space-y-2">
                            <div class="grid grid-cols-2 gap-2 text-xs">
                                <div class="border border-cyan-500/20 bg-slate-950/45 p-3 text-slate-400">综合风险<strong :class="['mt-1 block text-lg', riskClass(summary.riskLevel)]">{{ riskText(summary.riskLevel) }}</strong></div>
                                <div class="border border-cyan-500/20 bg-slate-950/45 p-3 text-slate-400">预报基准<strong class="mt-1 block text-sm text-cyan-100">{{ summary.baseDate || '--' }}</strong></div>
                                <div class="col-span-2 border border-slate-700/60 bg-slate-950/35 p-3 text-slate-400">有效时段<strong class="mt-1 block text-sm text-slate-100">{{ formatDate(summary.periodStart) }} 至 {{ formatDate(summary.periodEnd) }}</strong></div>
                            </div>

                            <div class="grid grid-cols-2 gap-2">
                                <div v-for="metric in summaryMetrics" :key="metric.label" class="border border-slate-700/70 bg-slate-950/35 p-2.5"><div class="text-[11px] text-slate-500">{{ metric.label }}</div><strong class="mt-1 block text-base text-slate-100">{{ metric.value }}<span class="ml-1 text-[10px] font-normal text-slate-500">{{ metric.unit }}</span></strong></div>
                            </div>

                            <div class="border border-slate-700/70 bg-slate-950/35 p-3 text-xs"><div class="mb-2 text-slate-400">趋势判断</div><div class="grid grid-cols-3 gap-2"><div v-for="trend in trendItems" :key="trend.label"><div class="text-[10px] text-slate-500">{{ trend.label }}</div><div :class="['mt-1 font-bold', trend.className]">{{ trend.value }}</div></div></div></div>
                        </div>

                        <div v-if="errorMessage" class="mt-3 border border-rose-500/35 bg-rose-950/30 p-3 text-sm text-rose-100">{{ errorMessage }}</div>
                        <div class="pt-4 text-xs leading-6 text-slate-500">预报中心展示定时生成的常规预报；仅当预测达到严重气象阈值时，才会在预警中心形成预警记录。</div>
                        <div class="mt-1 flex justify-end"><button type="button" :class="['text-[10px] transition-colors', demoWarningEnabled ? 'text-amber-300/80 hover:text-amber-200' : 'text-slate-700 hover:text-slate-400']" @click="toggleDemoWarning">{{ demoWarningEnabled ? '关闭演示预警' : '演示预警' }}</button></div>
                    </div>
                </section>
            </div>

            <div class="pointer-events-none absolute right-6 top-36 w-[29rem] max-h-[54.5rem]">
                <section class="tech-panel-enhanced pointer-events-auto relative flex max-h-[54.5rem] flex-col overflow-hidden p-5" style="clip-path: polygon(0 0,92% 0,100% 7%,100% 100%,0 100%);">
                    <div class="absolute left-0 top-0 h-[2px] w-full animate-pulse bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                    <div class="corner-decoration corner-bl scale-125"></div><div class="corner-decoration corner-br scale-125"></div>

                    <div class="mb-3 flex items-center justify-between border-b-2 border-cyan-500/40 pb-3"><div><div class="text-xl font-bold text-white">结构化预报报文</div><div class="mt-1 text-xs text-slate-400">{{ selectedRegion?.regionName || '--' }} · {{ rangeLabel }}</div></div><div class="flex items-center gap-2"><button class="border border-cyan-500/45 bg-cyan-950/45 px-2.5 py-1.5 text-[11px] font-bold text-cyan-100 transition-colors hover:bg-cyan-500 hover:text-slate-950 disabled:opacity-40" type="button" :disabled="!selectedRegionId" @click="download">下载整理报文</button><button class="border border-slate-600 bg-slate-900/60 px-2.5 py-1.5 text-[11px] font-bold text-slate-300 transition-colors hover:border-cyan-500 hover:text-cyan-100 disabled:opacity-40" type="button" :disabled="!selectedRegionId" @click="downloadOriginal">原始报文</button></div></div>

                    <div v-if="bulletinLoading" class="flex flex-1 items-center justify-center text-sm text-slate-400">正在生成预报报文...</div>
                    <div v-else class="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
                        <div class="relative mb-3 overflow-hidden rounded border border-cyan-400/35 bg-gradient-to-br from-cyan-950/75 via-slate-950/65 to-slate-950/90 p-4 shadow-[0_0_18px_rgba(34,211,238,.08)]"><div class="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-cyan-300 via-cyan-500 to-blue-600"></div><div class="flex items-center justify-between gap-3 pl-2"><div><div class="text-[11px] font-bold tracking-[0.24em] text-cyan-300">预报摘要</div><div class="mt-1 text-sm font-bold text-white">综合预报结论</div></div><span :class="['shrink-0 rounded-full border px-3 py-1 text-xs font-bold', riskBadgeClass]">{{ riskText(summary?.riskLevel) }}</span></div><div class="mt-3 pl-2 text-[15px] font-medium leading-7 text-slate-100">{{ overallConclusion }}</div><div class="mt-3 flex flex-wrap gap-2 pl-2 text-[11px]"><span class="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1 text-cyan-200">{{ rangeLabel }}</span><span class="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-slate-400">基准 {{ summary?.baseDate || '--' }}</span><span class="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-slate-400">{{ summary?.dataComplete === false ? '数据不完整' : '数据完整' }}</span></div></div>

                        <div class="mb-3 rounded border border-slate-700/80 bg-slate-950/45 p-3"><div class="mb-3 flex items-center gap-2"><span class="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9]"></span><div class="text-xs font-bold tracking-widest text-cyan-200">预报信息</div><span class="ml-auto text-[10px] text-slate-600">报文信息</span></div><div class="grid grid-cols-2 gap-2"><div class="rounded border border-slate-800 bg-slate-900/55 px-3 py-2"><div class="text-[10px] text-slate-500">数据点数</div><div class="mt-1 text-sm font-bold text-slate-200">{{ summary?.dataPointCount ?? series.length }} <span class="text-[10px] font-normal text-slate-500">个</span></div></div><div class="rounded border border-slate-800 bg-slate-900/55 px-3 py-2"><div class="text-[10px] text-slate-500">运行批次</div><div class="mt-1 truncate text-sm font-bold text-slate-200">{{ summary?.runCycle || '当前预报' }}</div></div><div class="rounded border border-slate-800 bg-slate-900/55 px-3 py-2"><div class="text-[10px] text-slate-500">起报时间</div><div class="mt-1 text-sm font-bold text-slate-200">{{ formatDate(summary?.periodStart) }}</div></div><div class="rounded border border-slate-800 bg-slate-900/55 px-3 py-2"><div class="text-[10px] text-slate-500">预报结束</div><div class="mt-1 text-sm font-bold text-slate-200">{{ formatDate(summary?.periodEnd) }}</div></div></div></div>

                        <div class="mb-3 rounded border border-slate-700/80 bg-slate-950/45 p-3"><div class="mb-3 flex items-center gap-2"><span class="h-1.5 w-1.5 rounded-full bg-yellow-300 shadow-[0_0_8px_#fde68a]"></span><div class="text-xs font-bold tracking-widest text-cyan-200">核心指标</div><span class="ml-auto text-[10px] text-slate-600">风浪流指标</span></div><div class="grid grid-cols-3 gap-2"><div v-for="metric in reportMetrics" :key="metric.label" class="rounded border border-slate-800 bg-slate-900/60 px-2.5 py-2.5"><div class="truncate text-[10px] text-slate-500">{{ metric.label }}</div><div class="mt-1.5 whitespace-nowrap text-base font-bold text-slate-100">{{ metric.value }}<span class="ml-1 text-[10px] font-normal text-slate-500">{{ metric.unit }}</span></div></div></div></div>

                        <div class="mb-3 rounded border border-slate-700/80 bg-slate-950/45 p-3"><div class="mb-3 flex items-center gap-2"><span class="h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_8px_#c4b5fd]"></span><div class="text-xs font-bold tracking-widest text-cyan-200">分时段预报</div><span class="ml-auto text-[10px] text-slate-600">{{ rangeLabel }}</span></div><div v-if="reportPoints.length" class="space-y-1.5"><div v-for="point in reportPoints" :key="point.key" class="relative rounded border border-slate-800 bg-slate-900/50 px-3 py-2.5 pl-4 before:absolute before:bottom-2 before:left-1.5 before:top-2 before:w-0.5 before:bg-cyan-500/60"><div class="flex items-center justify-between gap-2"><span class="text-xs font-bold text-slate-200">{{ point.label }}</span><span class="text-[11px] text-cyan-200">风 {{ point.wind }} m/s · 浪 {{ point.wave }} m</span></div><div class="mt-1 text-[11px] text-slate-500">流速 {{ point.current }} m/s<span v-if="point.wavePeriod !== '--'"> · 浪周期 {{ point.wavePeriod }} s</span><span v-if="point.windDirection !== '--'"> · 风向 {{ point.windDirection }}</span></div></div></div><div v-else class="py-3 text-xs text-slate-500">暂无分时段预报数据</div></div>

                        <div class="relative mb-3 overflow-hidden rounded border border-amber-400/35 bg-gradient-to-r from-amber-950/55 to-slate-950/60 p-4"><div class="absolute bottom-0 left-0 top-0 w-1 bg-amber-400"></div><div class="pl-2"><div class="flex items-center justify-between"><div class="text-xs font-bold tracking-widest text-amber-200">作业建议</div><span class="text-[10px] text-amber-300/60">辅助建议</span></div><div class="mt-2 text-sm leading-6 text-slate-100">{{ operationAdvice }}</div><div class="mt-2 text-[10px] leading-5 text-slate-500">建议基于当前预报风险等级生成，不等同于预警记录。</div></div></div>

                        <div class="overflow-hidden rounded border border-slate-700/80 bg-slate-950/45"><button class="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-900/70" type="button" @click="showRawBulletin = !showRawBulletin"><span><span class="block text-xs font-bold tracking-widest text-slate-300">原始预报报文</span><span class="mt-1 block text-[10px] text-slate-600">查看后端返回的完整文本</span></span><span class="flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 text-xs text-slate-400">{{ showRawBulletin ? '−' : '+' }}</span></button><div v-if="showRawBulletin" class="max-h-56 overflow-y-auto border-t border-slate-800 px-4 py-3 whitespace-pre-wrap text-xs leading-6 text-slate-400">{{ rawBulletin || '暂无原始预报报文' }}</div></div>
                    </div>
                </section>
            </div>

            <div class="pointer-events-none absolute bottom-16 left-[30rem] right-[31rem] h-[22rem]">
                <section class="tech-panel-enhanced pointer-events-auto relative h-full overflow-hidden p-4">
                    <div class="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                    <div class="mb-3 flex items-center justify-between"><div><div class="text-lg font-bold text-white">风浪流趋势预报</div><div class="mt-1 text-xs text-slate-400">{{ selectedRegion?.regionName || '--' }} · {{ rangeLabel }} · {{ series.length }} 个预报点</div></div><button class="text-xs font-bold text-cyan-300 hover:text-white" type="button" @click="loadData">刷新</button></div>
                    <div class="relative h-[17rem] w-full"><div ref="chartRef" class="h-full w-full"></div><div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-slate-950/55 text-sm text-slate-300">正在加载预报数据...</div><div v-if="!loading && !series.length" class="absolute inset-0 flex items-center justify-center text-sm text-slate-500">暂无趋势数据</div></div>
                </section>
            </div>
        </div>
    </transition>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts';
import { downloadForecastBulletin, fetchForecastBulletin, fetchForecastRegions, fetchForecastSeries, fetchForecastSummary } from '../api/forecastWarningBuoy.js';

const props = defineProps({ show: Boolean });
const emit = defineEmits(['close', 'selectRegion']);
const regions = ref([]);
const selectedRegionId = ref(null);
const range = ref('12h');
const summary = ref(null);
const series = ref([]);
const bulletin = ref(null);
const loading = ref(false);
const bulletinLoading = ref(false);
const errorMessage = ref('');
const showRawBulletin = ref(false);
const demoWarningEnabled = ref(typeof localStorage !== 'undefined' && localStorage.getItem('OCEAN_WARNING_DEMO_ENABLED') === '1');
const chartRef = ref(null);
let chart = null;
let requestSerial = 0;

const ranges = [{ value: '12h', label: '未来12小时' }, { value: '7d', label: '未来7天' }, { value: '15d', label: '未来15天' }];
const rangeLabel = computed(() => ranges.find((item) => item.value === range.value)?.label || '--');
const selectedRegion = computed(() => regions.value.find((item) => item.regionId === selectedRegionId.value) || null);
const selectRegion = (region) => { selectedRegionId.value = region?.regionId ?? null; emit('selectRegion', region); };
const toNumber = (value) => { const number = Number(value); return Number.isFinite(number) ? number : null; };
const formatNumber = (value, digits = 1) => { const number = toNumber(value); return number === null ? '--' : number.toFixed(digits); };
const formatDate = (value) => { if (!value) return '--'; const date = new Date(value); return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('zh-CN', { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); };
const formatAxisDate = (value) => { if (!value) return '--'; const date = new Date(value); return Number.isNaN(date.getTime()) ? String(value) : `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`; };
const riskText = (level) => ({ SAFE: '安全', MODERATE: '注意', HIGH: '高风险', CRITICAL: '严重风险' }[level] || '待评估');
const riskClass = (level) => ({ SAFE: 'text-emerald-300', MODERATE: 'text-amber-200', HIGH: 'text-orange-300', CRITICAL: 'text-rose-300' }[level] || 'text-slate-300');
const riskBadgeClass = computed(() => ({ SAFE: 'border-emerald-400/40 bg-emerald-950/40 text-emerald-300', MODERATE: 'border-amber-400/40 bg-amber-950/40 text-amber-200', HIGH: 'border-orange-400/40 bg-orange-950/40 text-orange-300', CRITICAL: 'border-rose-400/40 bg-rose-950/40 text-rose-300' }[summary.value?.riskLevel] || 'border-slate-600 bg-slate-900 text-slate-300'));
const dataStatusText = computed(() => { if (loading.value) return '正在更新'; if (!summary.value) return '等待数据'; if (summary.value.dataComplete === false) return '数据不完整'; return `已加载 ${summary.value.dataPointCount ?? series.value.length} 个点`; });
const dataStatusClass = computed(() => summary.value?.dataComplete === false ? 'text-amber-300' : loading.value ? 'text-cyan-300' : 'text-emerald-300');
const trendText = (value) => ({ UP: '上升', RISING: '上升', INCREASING: '上升', DOWN: '下降', FALLING: '下降', DECREASING: '下降', STABLE: '平稳', STEADY: '平稳', FLAT: '平稳' }[String(value || '').trim().toUpperCase()] || value || '暂无');
const trendClass = (value) => ({ 上升: 'text-amber-300', 下降: 'text-cyan-300', 平稳: 'text-emerald-300' }[trendText(value)] || 'text-slate-300');
const maxFromSeries = (field) => series.value.reduce((max, item) => { const value = toNumber(item?.[field]); return value === null ? max : Math.max(max, value); }, null);
const summaryMetrics = computed(() => [{ label: '平均风速', value: formatNumber(summary.value?.windSpeedAvg), unit: 'm/s' }, { label: '最大风速', value: formatNumber(summary.value?.windSpeedMax ?? maxFromSeries('windSpeedMax')), unit: 'm/s' }, { label: '最大浪高', value: formatNumber(summary.value?.waveHeightMax ?? maxFromSeries('waveHeightMax')), unit: 'm' }, { label: '平均流速', value: formatNumber(summary.value?.currentSpeedAvg), unit: 'm/s' }]);
const reportMetrics = computed(() => [{ label: '平均风速', value: formatNumber(summary.value?.windSpeedAvg), unit: 'm/s' }, { label: '最大阵风', value: formatNumber(summary.value?.gustMax ?? maxFromSeries('gustMax')), unit: 'm/s' }, { label: '平均浪高', value: formatNumber(summary.value?.waveHeightAvg), unit: 'm' }, { label: '最大浪高', value: formatNumber(summary.value?.waveHeightMax ?? maxFromSeries('waveHeightMax')), unit: 'm' }, { label: '平均浪周期', value: formatNumber(summary.value?.wavePeriodAvg), unit: 's' }, { label: '最大流速', value: formatNumber(summary.value?.currentSpeedMax ?? maxFromSeries('currentSpeedMax')), unit: 'm/s' }]);
const trendItems = computed(() => [{ label: '风速趋势', value: trendText(summary.value?.windTrend), className: trendClass(summary.value?.windTrend) }, { label: '浪高趋势', value: trendText(summary.value?.waveTrend), className: trendClass(summary.value?.waveTrend) }, { label: '流速趋势', value: trendText(summary.value?.currentTrend), className: trendClass(summary.value?.currentTrend) }]);
const rawBulletin = computed(() => bulletin.value?.bulletinText || bulletin.value?.content || bulletin.value?.text || '');
const peakDescription = computed(() => { const peaks = [{ label: '风速', value: toNumber(summary.value?.windSpeedMax ?? maxFromSeries('windSpeedMax')), unit: 'm/s', field: 'windSpeedMax' }, { label: '浪高', value: toNumber(summary.value?.waveHeightMax ?? maxFromSeries('waveHeightMax')), unit: 'm', field: 'waveHeightMax' }, { label: '流速', value: toNumber(summary.value?.currentSpeedMax ?? maxFromSeries('currentSpeedMax')), unit: 'm/s', field: 'currentSpeedMax' }].filter((item) => item.value !== null); if (!peaks.length) return '当前暂无足够的数值数据用于峰值判断。'; return peaks.map((peak) => { const point = series.value.find((item) => toNumber(item?.[peak.field]) === peak.value); const pointTime = point ? (range.value === '12h' ? formatDate(point.forecastTime) : point.forecastDate) : ''; return pointTime ? `预计在${pointTime}，${peak.label}达到${peak.value.toFixed(1)} ${peak.unit}` : `${peak.label}最高达到${peak.value.toFixed(1)} ${peak.unit}`; }).join('；') + '。'; });
const overallConclusion = computed(() => { if (!summary.value && !series.value.length) return '暂无预报结论，请先选择预报区域。'; const risk = riskText(summary.value?.riskLevel); const trend = [summary.value?.windTrend, summary.value?.waveTrend, summary.value?.currentTrend].map(trendText).filter((item) => item !== '暂无'); const trendSentence = trend.length ? `风、浪、流趋势判断为${trend.join('、')}。` : ''; return `当前${rangeLabel.value}综合等级为“${risk}”。${trendSentence}${peakDescription.value}`; });
const operationAdvice = computed(() => ({ SAFE: '当前预报条件适宜按计划开展常规作业，建议保持常规值守，并持续关注下一轮预报更新。', MODERATE: '建议加强现场值守和气象跟踪，合理安排作业窗口；对风速、浪高变化较敏感的作业应预留调整时间。', HIGH: '建议谨慎安排海上作业，重点关注预报中的峰值时段，必要时降低作业强度并提前做好人员、设备撤离准备。', CRITICAL: '建议暂停高风险海上作业，按照应急预案组织值守和避险；如需恢复作业，应等待后续预报确认风险下降。' }[summary.value?.riskLevel] || '当前暂无明确风险等级，建议结合原始预报报文和现场监测结果审慎安排作业。'));
const reportPoints = computed(() => { const list = series.value || []; if (!list.length) return []; if (range.value !== '12h') return list.slice(0, range.value === '7d' ? 7 : 15).map((item, index) => ({ ...item, key: `${item.forecastDate || index}`, label: item.forecastDate || `第${index + 1}天`, wind: formatNumber(item.windSpeedAvg), wave: formatNumber(item.waveHeightAvg), current: formatNumber(item.currentSpeedAvg), wavePeriod: formatNumber(item.wavePeriodAvg), windDirection: item.windDirMean ?? '--' })); const step = Math.max(1, Math.ceil(list.length / 6)); return list.filter((_, index) => index % step === 0 || index === list.length - 1).map((item, index) => ({ ...item, key: `${item.forecastTime || index}`, label: formatDate(item.forecastTime), wind: formatNumber(item.windSpeedAvg), wave: formatNumber(item.waveHeightAvg), current: formatNumber(item.currentSpeedAvg), wavePeriod: formatNumber(item.wavePeriodAvg), windDirection: item.windDirMean ?? '--' })); });

const renderChart = async () => {
    await nextTick();
    if (!props.show || !chartRef.value) return;
    if (!chart || chart.getDom() !== chartRef.value) { chart?.dispose(); chart = echarts.init(chartRef.value); }
    const labels = series.value.map((item) => range.value === '12h' ? formatAxisDate(item.forecastTime) : item.forecastDate || '--');
    const line = (name, field, color, yAxisIndex = 0, dashed = false) => ({ name, type: 'line', smooth: true, yAxisIndex, showSymbol: false, connectNulls: false, data: series.value.map((item) => toNumber(item?.[field])), lineStyle: { width: dashed ? 1.2 : 2, type: dashed ? 'dashed' : 'solid', opacity: dashed ? 0.65 : 1, color }, itemStyle: { color } });
    chart.setOption({ backgroundColor: 'transparent', color: ['#22d3ee', '#67e8f9', '#facc15', '#fde68a', '#a78bfa', '#c4b5fd', '#fb923c'], tooltip: { trigger: 'axis', backgroundColor: 'rgba(7,18,35,.96)', borderColor: '#155e75', textStyle: { color: '#e2e8f0' }, axisPointer: { type: 'line', lineStyle: { color: '#67e8f9' } } }, legend: { top: 0, left: 0, right: 0, itemWidth: 12, itemHeight: 7, textStyle: { color: '#cbd5e1', fontSize: 10 }, data: ['平均风速', '最大风速', '平均浪高', '最大浪高', '平均流速', '最大流速', '最大阵风'] }, grid: { left: 48, right: 50, top: 48, bottom: 42 }, xAxis: { type: 'category', data: labels, axisLabel: { color: '#f8fafc', fontSize: 10, hideOverlap: true }, axisLine: { lineStyle: { color: '#334155' } } }, yAxis: [{ type: 'value', name: '风/流 m/s', axisLabel: { color: '#f8fafc', fontSize: 10 }, nameTextStyle: { color: '#f8fafc', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(71,85,105,.35)' } } }, { type: 'value', name: '浪高 m', position: 'right', axisLabel: { color: '#f8fafc', fontSize: 10 }, nameTextStyle: { color: '#f8fafc', fontSize: 10 }, splitLine: { show: false } }], series: [line('平均风速', 'windSpeedAvg', '#22d3ee'), line('最大风速', 'windSpeedMax', '#67e8f9', 0, true), line('平均浪高', 'waveHeightAvg', '#facc15', 1), line('最大浪高', 'waveHeightMax', '#fde68a', 1, true), line('平均流速', 'currentSpeedAvg', '#a78bfa'), line('最大流速', 'currentSpeedMax', '#c4b5fd', 0, true), line('最大阵风', 'gustMax', '#fb923c', 0, true)] }, true);
};

const loadData = async () => {
    if (!selectedRegionId.value) return;
    const serial = ++requestSerial;
    loading.value = true; bulletinLoading.value = true; errorMessage.value = '';
    try {
        const [nextSummary, nextSeries, nextBulletin] = await Promise.all([fetchForecastSummary(selectedRegionId.value, range.value), fetchForecastSeries(selectedRegionId.value, range.value), fetchForecastBulletin(selectedRegionId.value, range.value)]);
        if (serial !== requestSerial) return;
        summary.value = nextSummary; series.value = Array.isArray(nextSeries) ? nextSeries : []; bulletin.value = nextBulletin; showRawBulletin.value = false;
    } catch (error) { if (serial === requestSerial) errorMessage.value = `预报数据加载失败：${error.message}`; } finally { if (serial === requestSerial) { loading.value = false; bulletinLoading.value = false; await nextTick(); await renderChart(); } }
};

const initialise = async () => { try { regions.value = await fetchForecastRegions(); const pacific = regions.value.find((item) => String(item.regionName || '').includes('太平洋')); selectedRegionId.value = pacific?.regionId || regions.value[0]?.regionId || null; await loadData(); } catch (error) { errorMessage.value = `预报区域加载失败：${error.message}`; } };
const buildStructuredBulletin = () => {
    const lines = [
        '深海采矿海洋气象预报报告',
        '========================================',
        `区域名称：${selectedRegion.value?.regionName || '--'}`,
        `区域代码：${selectedRegion.value?.regionCode || '--'}`,
        `预报时段：${rangeLabel.value}`,
        `基准日期：${summary.value?.baseDate || '--'}`,
        `运行批次：${summary.value?.runCycle || '当前预报'}`,
        `数据时间：${formatDate(summary.value?.periodStart)} 至 ${formatDate(summary.value?.periodEnd)}`,
        `数据完整性：${summary.value?.dataComplete === false ? '不完整' : '完整'}`,
        '',
        '一、综合预报结论',
        `综合风险等级：${riskText(summary.value?.riskLevel)}`,
        overallConclusion.value,
        '',
        '二、关键预报指标'
    ];

    reportMetrics.value.forEach((metric) => lines.push(`${metric.label}：${metric.value} ${metric.unit}`));
    lines.push('', '三、趋势判断');
    trendItems.value.forEach((trend) => lines.push(`${trend.label}：${trend.value}`));
    lines.push('', '四、重点时段预报');

    if (reportPoints.value.length) {
        reportPoints.value.forEach((point) => {
            lines.push(`${point.label}：风速 ${point.wind} m/s，浪高 ${point.wave} m，流速 ${point.current} m/s，浪周期 ${point.wavePeriod} s，风向 ${point.windDirection}`);
        });
    } else {
        lines.push('暂无重点时段预报数据');
    }

    lines.push('', '五、重点峰值时段', peakDescription.value, '', '六、作业建议', operationAdvice.value, '', '========================================', '说明：本文件由前端根据当前后端返回的摘要和时序数据整理生成。');

    return `${lines.join('\n')}\n`;
};
const downloadTextFile = (content, filename) => { const blob = new Blob([`\uFEFF${content}`], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 0); };
const download = () => { try { downloadTextFile(buildStructuredBulletin(), `forecast_report_${selectedRegionId.value}_${range.value}.txt`); } catch (error) { errorMessage.value = `整理报文下载失败：${error.message}`; } };
const downloadOriginal = async () => { try { await downloadForecastBulletin(selectedRegionId.value, range.value); } catch (error) { errorMessage.value = `原始报文下载失败：${error.message}`; } };
const toggleDemoWarning = () => {
    demoWarningEnabled.value = !demoWarningEnabled.value;
    if (typeof localStorage !== 'undefined') localStorage.setItem('OCEAN_WARNING_DEMO_ENABLED', demoWarningEnabled.value ? '1' : '0');
    window.dispatchEvent(new CustomEvent('weather-warning-demo-toggle', { detail: { enabled: demoWarningEnabled.value } }));
};
const handleDemoWarningToggle = (event) => {
    if (typeof event?.detail?.enabled === 'boolean') demoWarningEnabled.value = event.detail.enabled;
};
const handleUpdate = () => { if (props.show) loadData(); };
const resizeChart = () => chart?.resize();
watch(() => props.show, (visible) => {
    if (!visible) return;
    showRawBulletin.value = false;
    if (!regions.value.length) {
        initialise();
    } else if (range.value !== '12h') {
        range.value = '12h';
    } else if (selectedRegionId.value) {
        loadData();
    }
});
watch([selectedRegionId, range], () => { if (props.show && selectedRegionId.value) loadData(); });
watch(series, renderChart);
onMounted(() => { window.addEventListener('resize', resizeChart); window.addEventListener('forecast-bulletin-ready', handleUpdate); window.addEventListener('weather-warning-demo-toggle', handleDemoWarningToggle); if (props.show) initialise(); });
onBeforeUnmount(() => { chart?.dispose(); window.removeEventListener('resize', resizeChart); window.removeEventListener('forecast-bulletin-ready', handleUpdate); window.removeEventListener('weather-warning-demo-toggle', handleDemoWarningToggle); });
</script>
