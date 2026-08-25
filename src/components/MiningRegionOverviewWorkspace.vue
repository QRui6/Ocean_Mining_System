<template>
    <transition name="workspace-fade">
        <div
            v-if="show && region"
            class="absolute inset-0 z-40 pointer-events-none font-['Noto_Sans_SC']"
        >
            <div class="absolute bottom-6 left-8 top-36 flex w-[29rem] flex-col pointer-events-none">
                <div class="workspace-panel pointer-events-auto flex min-h-0 flex-1 flex-col overflow-hidden">
                    <div class="panel-scan-line"></div>
                    <div class="border-b border-cyan-500/25 bg-gradient-to-r from-cyan-900/45 via-slate-900/30 to-transparent px-5 py-4">
                        <div class="flex items-start justify-between gap-3"><div class="flex min-w-0 items-start gap-3"><div class="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded border border-yellow-300/40 bg-yellow-400/10 text-lg text-yellow-200">◈</div><div class="min-w-0"><div class="text-xl font-bold tracking-wide text-white">矿区预报报告</div><div class="mt-1 truncate text-xs text-cyan-200">{{ region.regionName || region.regionCode || '--' }}<span v-if="selectedArea"> / {{ selectedArea.name || selectedArea.contractor || '当前矿区' }}</span></div></div></div><div class="flex shrink-0 items-center gap-2"><button v-if="selectedArea" type="button" class="border border-cyan-400/45 bg-cyan-500/10 px-2 py-1 text-[11px] font-bold text-cyan-100 transition-colors hover:bg-cyan-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40" :disabled="!selectedSite?.matched || (!reportDailyRecords.length && !reportHourlyRecords.length)" title="下载当前小矿区预报报告" @click="downloadSiteForecastReport">下载小矿区报告</button><span class="rounded-full border border-cyan-400/35 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-bold text-cyan-100">常规预报</span></div></div>
                        <div class="mt-3 flex items-center justify-between rounded border border-slate-700/70 bg-slate-950/45 px-3 py-2 text-xs"><span class="text-slate-500">当前预报状态</span><span :class="['rounded-full border px-2.5 py-1 font-bold', reportStatusClass]">{{ reportStatusLabel }}</span></div>
                    </div>
                    <div class="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
                        <section class="relative mb-4 overflow-hidden rounded border border-cyan-400/30 bg-gradient-to-br from-cyan-950/60 via-slate-950/60 to-slate-950/90 p-4"><div class="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-cyan-300 to-blue-600"></div><div class="pl-2"><div class="flex items-center justify-between"><div class="text-xs font-bold tracking-widest text-cyan-200">预报结论</div><span class="text-[10px] text-slate-600">综合判读</span></div><div class="mt-3 text-[15px] font-medium leading-7 text-slate-100">{{ reportConclusion }}</div></div></section>
                        <section class="mb-4"><div class="mb-2 flex items-center gap-2"><span class="h-1.5 w-1.5 rounded-full bg-yellow-300 shadow-[0_0_8px_#fde68a]"></span><h4 class="text-xs font-bold tracking-widest text-cyan-200">关键指标</h4></div><div class="grid grid-cols-2 gap-2"><div v-for="metric in reportMetricCards" :key="metric.label" class="rounded border border-slate-700/80 bg-slate-950/55 px-3 py-3"><div class="text-[11px] text-slate-500">{{ metric.label }}</div><div :class="['mt-1.5 text-xl font-bold', metric.className]">{{ metric.value }}<span class="ml-1 text-[11px] font-normal text-slate-500">{{ metric.unit }}</span></div></div></div></section>
                        <section class="mb-4 rounded border border-slate-700/80 bg-slate-950/45 p-3"><div class="mb-3 flex items-center justify-between"><div class="flex items-center gap-2"><span class="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9]"></span><h4 class="text-xs font-bold tracking-widest text-cyan-200">预报信息</h4></div><span class="text-[10px] text-slate-600">数据概况</span></div><div class="grid grid-cols-2 gap-y-3 text-xs"><div><div class="text-slate-500">预报基准</div><strong class="mt-1 block text-slate-200">{{ reportBaseDate }}</strong></div><div><div class="text-slate-500">有效至</div><strong class="mt-1 block text-slate-200">{{ forecastStatus.validUntil }}</strong></div><div><div class="text-slate-500">逐日数据</div><strong class="mt-1 block text-slate-200">{{ reportDailyRecords.length }} 条</strong></div><div><div class="text-slate-500">逐小时数据</div><strong class="mt-1 block text-slate-200">{{ reportHourlyRecords.length }} 条</strong></div></div></section>
                        <section class="mb-4 rounded border border-slate-700/80 bg-slate-950/45 p-3"><div class="mb-3 flex items-center justify-between"><div class="flex items-center gap-2"><span class="h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_8px_#c4b5fd]"></span><h4 class="text-xs font-bold tracking-widest text-cyan-200">当日预报摘要</h4></div><span class="text-[10px] text-slate-600">当前选中日期</span></div><div v-if="reportCurrentDayRows.length" class="space-y-2"><div v-for="row in reportCurrentDayRows" :key="row.key" class="rounded border border-slate-800 bg-slate-900/55 px-3 py-2.5"><div class="flex items-center justify-between gap-2"><span class="text-xs font-bold text-slate-200">{{ row.label }}</span><span class="text-[11px] text-cyan-200">风 {{ row.wind }} m/s · 浪 {{ row.wave }} m</span></div><div class="mt-1.5 text-[11px] text-slate-500">最大阵风 {{ row.gust }} m/s <span class="mx-1 text-slate-700">|</span> 流速 {{ row.current }} m/s</div></div></div><div v-else class="py-3 text-xs text-slate-500">暂无当前日期逐日预报数据</div></section>
                        <section class="mb-4 rounded border border-slate-700/80 bg-slate-950/45 p-3"><div class="mb-3 flex items-center justify-between"><div class="flex items-center gap-2"><span class="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9]"></span><h4 class="text-xs font-bold tracking-widest text-cyan-200">未来逐日预报</h4></div><span class="text-[10px] text-slate-600">按时间顺序</span></div><div v-if="reportDailyRows.length" class="max-h-64 space-y-2 overflow-y-auto pr-1"><div v-for="row in reportDailyRows" :key="row.key" class="rounded border border-slate-800 bg-slate-900/55 px-3 py-2"><div class="flex items-center justify-between gap-2"><span class="text-xs font-bold text-slate-200">{{ row.label }}</span><span class="text-[11px] text-cyan-200">风 {{ row.wind }} m/s · 浪 {{ row.wave }} m</span></div><div class="mt-1 text-[11px] text-slate-500">最大阵风 {{ row.gust }} m/s <span class="mx-1 text-slate-700">|</span> 流速 {{ row.current }} m/s</div></div></div><div v-else class="py-3 text-xs text-slate-500">暂无未来逐日预报数据</div></section>
                        <section class="relative overflow-hidden rounded border border-amber-400/35 bg-gradient-to-r from-amber-950/55 to-slate-950/70 p-4"><div class="absolute bottom-0 left-0 top-0 w-1 bg-amber-400"></div><div class="pl-2"><div class="flex items-center justify-between"><h4 class="text-xs font-bold tracking-widest text-amber-200">作业建议</h4><span class="text-[10px] text-amber-300/60">辅助判断</span></div><div class="mt-2.5 text-sm leading-6 text-slate-100">{{ reportOperationAdvice }}</div><div class="mt-2 text-[10px] leading-5 text-slate-500">建议基于当前预报指标生成，仅作作业安排参考；严重气象事件请以预警中心为准。</div></div></section>
                    </div>
                </div>
            </div>

            <div
                class="absolute right-6 top-36 bottom-6 flex w-[30rem] flex-col gap-5"
            >
                <div
                    class="workspace-panel relative min-h-0 flex-1 pointer-events-auto overflow-hidden"
                >
                    <div class="panel-scan-line"></div>
                    <div class="flex items-center justify-between border-b border-cyan-500/25 bg-gradient-to-r from-cyan-900/35 to-transparent px-4 py-3">
                        <div class="flex min-w-0 items-center gap-3">
                            <div class="h-5 w-1.5 bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>
                            <div class="min-w-0">
                                <div class="text-xl font-bold tracking-wide text-white">预报中心 · {{ selectedArea ? '矿区预报' : '区域预报' }}</div>
                                <div class="mt-1 truncate text-xs text-cyan-200">
                                    {{ region.regionName || region.regionCode || '--' }}
                                    <span v-if="selectedArea"> / {{ selectedArea.name || selectedArea.contractor || selectedSite?.displayName || '当前矿区' }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex shrink-0 items-center gap-2">
                            <button
                                type="button"
                                @click="emit('backToForecastCenter')"
                                class="rounded-sm border border-cyan-400/45 bg-cyan-500/10 px-2 py-1 text-xs font-bold text-cyan-100 transition-colors hover:bg-cyan-400 hover:text-slate-950"
                                title="返回区域预报"
                            >
                                返回预报中心
                            </button>
                            <button
                                v-if="selectedArea"
                                type="button"
                                @click="emit('backToOverview')"
                                class="rounded-sm border border-yellow-400/45 bg-yellow-500/10 px-2 py-1 text-xs font-bold text-yellow-100 transition-colors hover:bg-yellow-400 hover:text-slate-950"
                                title="返回矿区总览"
                            >
                                返回总览
                            </button>
                            <button
                                type="button"
                                @click="emit('close')"
                                class="flex h-8 w-8 items-center justify-center rounded-sm border border-cyan-500/35 text-cyan-200 transition-colors hover:bg-cyan-500 hover:text-slate-950"
                                title="关闭区域预报"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    <div v-if="loading" class="flex h-[calc(100%-3.25rem)] items-center justify-center text-slate-300">
                        <div class="flex min-w-0 items-center gap-3">
                            <span class="inline-block h-8 w-8 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></span>
                            <span>正在加载区域逐天预报...</span>
                        </div>
                    </div>

                    <div v-else class="flex h-[calc(100%-3.25rem)] min-h-0 flex-col px-4 pb-4 pt-3">
                        <div class="mb-3 flex items-center justify-between gap-3 text-sm">
                            <div class="text-slate-200">
                                当前区域: <span class="font-semibold text-cyan-200">{{ region.regionName || region.regionCode || '--' }}</span>
                            </div>
                            <div :class="['rounded-sm border px-2 py-1 text-sm', forecastStatus.className]">
                                {{ forecastStatus.label }}
                            </div>
                        </div>
                        <div class="mb-3 text-xs text-slate-400">基准 {{ forecastStatus.baseDate }} · 有效至 {{ forecastStatus.validUntil }} · {{ forecastStatus.detail }}</div>
                        <div ref="dailyChartRef" class="min-h-0 flex-1 w-full"></div>
                    </div>
                </div>

                <div
                    class="workspace-panel relative min-h-0 flex-1 pointer-events-auto overflow-hidden"
                >
                    <div class="panel-scan-line"></div>
                    <div class="flex items-center justify-between border-b border-cyan-500/25 bg-gradient-to-r from-sky-900/35 to-transparent px-4 py-3">
                        <div class="flex min-w-0 items-center gap-3">
                            <div class="h-5 w-1.5 bg-sky-400 shadow-[0_0_10px_#38bdf8]"></div>
                            <div>
                                <div class="text-xl font-bold tracking-wide text-white">区域逐 3 小时预报</div>
                            </div>
                        </div>
                        <div class="rounded-sm border border-sky-500/25 bg-sky-500/10 px-2 py-1 text-sm text-sky-200">
                            {{ selectedForecastDate || '--' }}
                        </div>
                    </div>

                    <div v-if="loadingHourly" class="flex h-[calc(100%-3.25rem)] items-center justify-center text-slate-300">
                        <div class="flex min-w-0 flex-1 items-center gap-3">
                            <span class="inline-block h-8 w-8 rounded-full border-4 border-sky-500/20 border-t-sky-400 animate-spin"></span>
                            <span>正在加载逐小时预报...</span>
                        </div>
                    </div>

                    <div v-else class="flex h-[calc(100%-3.25rem)] min-h-0 flex-col px-4 pb-4 pt-3">
                        <div class="mb-3 flex items-center justify-between text-sm">
                            <div class="text-slate-200">
                                选中日期:
                                <span class="font-semibold text-sky-200">{{ selectedForecastDate || '--' }}</span>
                            </div>
                            <div class="text-slate-300">
                                点击上方逐天图切换日期
                            </div>
                        </div>
                        <div ref="hourlyChartRef" class="min-h-0 flex-1 w-full"></div>
                    </div>
                </div>
            </div>

            <div v-if="selectedSite" class="absolute bottom-7 left-1/2 flex w-[50rem] -translate-x-1/2 gap-5 pointer-events-none">
                <div class="workspace-panel relative h-[22rem] min-w-0 flex-1 pointer-events-auto overflow-hidden">
                    <div class="panel-scan-line"></div>
                    <div class="flex items-center border-b border-cyan-500/25 bg-gradient-to-r from-cyan-900/35 to-transparent px-4 py-3">
                        <div class="flex items-center gap-3">
                            <div class="h-5 w-1.5 bg-yellow-400 shadow-[0_0_10px_#facc15]"></div>
                            <div class="flex min-w-0 flex-1 items-baseline text-lg font-bold tracking-wide text-white">
                                <span class="min-w-0 truncate" :title="selectedSiteDisplayName">{{ selectedSiteDisplayName }}</span>
                                <span class="shrink-0">逐日预报</span>
                            </div>
                        </div>
                    </div>

                    <div v-if="loadingSite" class="flex h-[calc(100%-3.25rem)] items-center justify-center text-slate-300">
                        <div class="flex min-w-0 flex-1 items-center gap-3">
                            <span class="inline-block h-8 w-8 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></span>
                            <span>正在加载单矿区逐天预报...</span>
                        </div>
                    </div>

                    <div v-else-if="!selectedSite.matched" class="flex h-[calc(100%-3.25rem)] items-center justify-center px-8 text-center">
                        <div>
                            <div class="text-xl font-bold text-amber-100">暂无逐天站点</div>
                            <div class="mt-2 text-base text-amber-200/80">当前矿区未匹配到单矿区风浪站点数据</div>
                        </div>
                    </div>

                    <div v-else class="flex h-[calc(100%-3.25rem)] min-h-0 flex-col px-4 pb-4 pt-3">
                        <div ref="siteDailyChartRef" class="min-h-0 flex-1 w-full"></div>
                    </div>
                </div>

                <div class="workspace-panel relative h-[22rem] min-w-0 flex-1 pointer-events-auto overflow-hidden">
                    <div class="panel-scan-line"></div>
                    <div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-cyan-500/25 bg-gradient-to-r from-sky-900/35 to-transparent px-4 py-3">
                        <div class="flex min-w-0 items-center gap-3">
                            <div class="h-5 w-1.5 bg-sky-400 shadow-[0_0_10px_#38bdf8]"></div>
                            <div class="flex min-w-0 flex-1 items-baseline text-lg font-bold tracking-wide text-white">
                                <span class="min-w-0 truncate" :title="selectedSiteDisplayName">{{ selectedSiteDisplayName }}</span>
                                <span class="shrink-0">逐 3 小时预报</span>
                            </div>
                        </div>
                        <div class="min-w-[5.5rem] shrink-0 whitespace-nowrap rounded-sm border border-sky-400/30 bg-sky-500/10 px-3 py-1.5 text-center text-sm text-sky-100">
                            {{ selectedForecastMonthDay }}
                        </div>
                    </div>

                    <div v-if="loadingSiteHourly" class="flex h-[calc(100%-3.25rem)] items-center justify-center text-slate-300">
                        <div class="flex items-center gap-3">
                            <span class="inline-block h-8 w-8 rounded-full border-4 border-sky-500/20 border-t-sky-400 animate-spin"></span>
                            <span>正在加载单矿区逐小时预报...</span>
                        </div>
                    </div>

                    <div v-else-if="!selectedSite.matched" class="flex h-[calc(100%-3.25rem)] items-center justify-center px-8 text-center">
                        <div>
                            <div class="text-xl font-bold text-amber-100">暂无逐小时站点</div>
                            <div class="mt-2 text-base text-amber-200/80">当前矿区未匹配到单矿区风浪站点数据</div>
                        </div>
                    </div>

                    <div v-else class="flex h-[calc(100%-3.25rem)] min-h-0 flex-col px-4 pb-4 pt-3">
                        <div ref="siteHourlyChartRef" class="min-h-0 flex-1 w-full"></div>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    loading: {
        type: Boolean,
        default: false
    },
    loadingHourly: {
        type: Boolean,
        default: false
    },
    region: {
        type: Object,
        default: null
    },
    selectedArea: {
        type: Object,
        default: null
    },
    dailyForecast: {
        type: Array,
        default: () => []
    },
    hourlyForecast: {
        type: Array,
        default: () => []
    },
    selectedForecastDate: {
        type: String,
        default: ''
    },
    sites: {
        type: Array,
        default: () => []
    },
    selectedSite: {
        type: Object,
        default: null
    },
    siteDailyForecast: {
        type: Array,
        default: () => []
    },
    siteHourlyForecast: {
        type: Array,
        default: () => []
    },
    loadingSite: {
        type: Boolean,
        default: false
    },
    loadingSiteHourly: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['close', 'forecastDateChange', 'backToOverview', 'backToForecastCenter']);

const dailyChartRef = ref(null);
const hourlyChartRef = ref(null);
const siteDailyChartRef = ref(null);
const siteHourlyChartRef = ref(null);

let dailyChartInstance = null;
let hourlyChartInstance = null;
let siteDailyChartInstance = null;
let siteHourlyChartInstance = null;

const forecastStatus = computed(() => {
    const records = props.dailyForecast || [];
    const dates = records
        .map((record) => new Date(record?.forecastDate || record?.forecastTime || 0).getTime())
        .filter(Number.isFinite);
    const baseDates = records
        .map((record) => record?.baseDate)
        .filter(Boolean)
        .sort();

    if (!dates.length) {
        return {
            label: '暂无预报数据',
            className: 'border-slate-600/50 bg-slate-900/50 text-slate-300',
            baseDate: '--',
            validUntil: '--',
            detail: '未返回可判定时效的数据'
        };
    }

    const validUntil = new Date(Math.max(...dates));
    const isCurrent = validUntil.getTime() >= Date.now();
    return {
        label: isCurrent ? '当前预报数据' : '过期数据，仅供回看',
        className: isCurrent
            ? 'border-emerald-400/35 bg-emerald-950/30 text-emerald-100'
            : 'border-amber-500/25 bg-amber-500/10 text-amber-100',
        baseDate: baseDates[baseDates.length - 1] || '--',
        validUntil: validUntil.toLocaleDateString('zh-CN'),
        detail: isCurrent ? '可按预报时间查看' : '不会作为实时预警依据'
    };
});

const reportDailyRecords = computed(() => {
    if (props.selectedSite?.matched && props.siteDailyForecast?.length) {
        return props.siteDailyForecast;
    }

    return props.dailyForecast || [];
});

const selectedForecastMonthDay = computed(() => {
    const date = String(props.selectedForecastDate || '').slice(0, 10);
    const match = date.match(/^\d{4}-(\d{2})-(\d{2})$/);
    return match ? `${match[1]}月${match[2]}日` : '--';
});

const selectedSiteDisplayName = computed(() => {
    const name = props.selectedArea?.name
        || props.selectedArea?.contractor
        || props.selectedSite?.displayName
        || '当前';
    return name.endsWith('矿区') ? name : `${name}矿区`;
});

const reportHourlyRecords = computed(() => {
    if (props.selectedSite?.matched && props.siteHourlyForecast?.length) {
        return props.siteHourlyForecast;
    }

    return props.hourlyForecast || [];
});

const reportBaseDate = computed(() => reportDailyRecords.value.map((record) => record?.baseDate).filter(Boolean).sort().at(-1) || '--');
const reportNumber = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
};
const reportMax = (fields) => reportDailyRecords.value.reduce((max, record) => {
    const value = fields.map((field) => reportNumber(record?.[field])).find((item) => item !== null);
    return value === undefined ? max : max === null ? value : Math.max(max, value);
}, null);
const reportAverage = (fields) => {
    const values = reportDailyRecords.value.map((record) => fields.map((field) => reportNumber(record?.[field])).find((item) => item !== null)).filter((value) => value !== undefined);
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
};
const reportFormat = (value) => value === null || value === undefined ? '--' : value.toFixed(1);
const reportMetricCards = computed(() => [
    { label: '平均风速', value: reportFormat(reportAverage(['windSpeedAvg', 'windSpeed'])), unit: 'm/s', className: 'text-cyan-300' },
    { label: '最大风速', value: reportFormat(reportMax(['windSpeedMax', 'windSpeed'])), unit: 'm/s', className: 'text-sky-300' },
    { label: '最大浪高', value: reportFormat(reportMax(['waveHeightMax', 'waveHeight'])), unit: 'm', className: 'text-yellow-300' },
    { label: '最大流速', value: reportFormat(reportMax(['currentSpeedMax', 'currentSpeed'])), unit: 'm/s', className: 'text-violet-300' }
]);
const reportStatusLabel = computed(() => props.selectedSite?.matched ? '单矿区预报' : forecastStatus.value.label);
const reportStatusClass = computed(() => {
    if (props.selectedSite?.matched) return 'border-sky-400/40 bg-sky-950/40 text-sky-200';
    if (forecastStatus.value.label === '当前预报数据') return 'border-emerald-400/40 bg-emerald-950/40 text-emerald-200';
    if (forecastStatus.value.label.includes('过期')) return 'border-amber-400/40 bg-amber-950/40 text-amber-200';
    return 'border-slate-600 bg-slate-900 text-slate-300';
});
const sortReportRecords = (records) => [...records].sort((first, second) => {
    const firstTime = new Date(first?.forecastTime || first?.forecastDate || 0).getTime();
    const secondTime = new Date(second?.forecastTime || second?.forecastDate || 0).getTime();
    return (Number.isFinite(firstTime) ? firstTime : 0) - (Number.isFinite(secondTime) ? secondTime : 0);
});
const reportDailyRows = computed(() => sortReportRecords(reportDailyRecords.value).map((record, index) => ({
    key: `${record?.forecastDate || index}`,
    label: formatDailyLabel(record?.forecastDate),
    wind: reportFormat(reportNumber(record?.windSpeedAvg ?? record?.windSpeed)),
    wave: reportFormat(reportNumber(record?.waveHeightAvg ?? record?.waveHeight)),
    gust: reportFormat(reportNumber(record?.gustMax ?? record?.gust)),
    current: reportFormat(reportNumber(record?.currentSpeedAvg ?? record?.currentSpeed))
})));
const reportCurrentDayRows = computed(() => {
    const selectedDate = String(props.selectedForecastDate || '').slice(0, 10);
    const orderedRecords = sortReportRecords(reportDailyRecords.value);
    const records = selectedDate
        ? orderedRecords.filter((record) => String(record?.forecastDate || '').slice(0, 10) === selectedDate)
        : orderedRecords.slice(0, 1);
    return records.slice(0, 1).map((record, index) => ({
        key: `${record?.forecastDate || index}`,
        label: formatDailyLabel(record?.forecastDate),
        wind: reportFormat(reportNumber(record?.windSpeedAvg ?? record?.windSpeed)),
        wave: reportFormat(reportNumber(record?.waveHeightAvg ?? record?.waveHeight)),
        gust: reportFormat(reportNumber(record?.gustMax ?? record?.gust)),
        current: reportFormat(reportNumber(record?.currentSpeedAvg ?? record?.currentSpeed))
    }));
});
const formatReportForecastTime = (record) => {
    const rawTime = String(record?.forecastTime || '').trim();
    const rawDate = String(record?.forecastDate || '').trim();
    if (/^\d{2}:\d{2}/.test(rawTime) && rawDate) {
        return `${rawDate} ${rawTime.slice(0, 5)}`;
    }

    const date = new Date(rawTime || rawDate);
    if (Number.isNaN(date.getTime())) {
        return rawDate || rawTime || '对应预报时段';
    }

    const dateLabel = `${date.getMonth() + 1}月${date.getDate()}日`;
    if (rawTime || record?.forecastHour !== undefined && record?.forecastHour !== null) {
        return `${dateLabel}${String(date.getHours()).padStart(2, '0')}时`;
    }

    return dateLabel;
};
const findReportPeak = (records, fields, label, unit) => {
    let peak = null;
    records.forEach((record) => {
        const field = fields.find((candidate) => reportNumber(record?.[candidate]) !== null);
        if (!field) return;
        const value = reportNumber(record[field]);
        if (!peak || value > peak.value) {
            peak = { label: field.toLowerCase().includes('max') ? `最高${label}` : label, value, unit, time: formatReportForecastTime(record) };
        }
    });
    return peak;
};
const reportPeakDetails = computed(() => [
    findReportPeak(sortReportRecords(reportHourlyRecords.value), ['windSpeedMax', 'windSpeed', 'windSpeedAvg'], '风速', 'm/s'),
    findReportPeak(sortReportRecords(reportHourlyRecords.value), ['waveHeightMax', 'waveHeight', 'waveHeightAvg'], '浪高', 'm'),
    findReportPeak(sortReportRecords(reportHourlyRecords.value), ['currentSpeedMax', 'currentSpeed', 'currentSpeedAvg'], '流速', 'm/s')
].filter(Boolean));
const reportDailyPeakDetails = computed(() => [
    findReportPeak(sortReportRecords(reportDailyRecords.value), ['windSpeedMax', 'windSpeed', 'windSpeedAvg'], '风速', 'm/s'),
    findReportPeak(sortReportRecords(reportDailyRecords.value), ['waveHeightMax', 'waveHeight', 'waveHeightAvg'], '浪高', 'm'),
    findReportPeak(sortReportRecords(reportDailyRecords.value), ['currentSpeedMax', 'currentSpeed', 'currentSpeedAvg'], '流速', 'm/s')
].filter(Boolean));
const reportHourlyPeakConclusion = computed(() => reportPeakDetails.value.length
    ? reportPeakDetails.value.map((item) => `预计在${item.time}，${item.label}达到${item.value.toFixed(1)} ${item.unit}`).join('；') + '。'
    : '当前暂无逐小时数据用于判断具体时刻。');
const reportCurrentDayAnalysis = computed(() => reportCurrentDayRows.value.length
    ? `当日（${reportCurrentDayRows.value[0].label}）预计平均风速${reportCurrentDayRows.value[0].wind} m/s、浪高${reportCurrentDayRows.value[0].wave} m、最大阵风${reportCurrentDayRows.value[0].gust} m/s、流速${reportCurrentDayRows.value[0].current} m/s。`
    : '当前选中日期暂无逐日预报数据。');
const reportNotableDailyRows = computed(() => reportDailyRows.value.map((row, index, rows) => {
    const current = { wind: reportNumber(row.wind), gust: reportNumber(row.gust), wave: reportNumber(row.wave), current: reportNumber(row.current) };
    const previousRow = rows[index - 1];
    const previous = previousRow ? { wind: reportNumber(previousRow.wind), wave: reportNumber(previousRow.wave), current: reportNumber(previousRow.current) } : null;
    const reasons = [];
    if (current.wind !== null && current.wind >= 12) reasons.push('风速较高');
    if (current.gust !== null && current.gust >= 15) reasons.push('阵风较强');
    if (current.wave !== null && current.wave >= 3) reasons.push('浪高较大');
    if (current.current !== null && current.current >= 1.5) reasons.push('流速较高');
    if (previous) {
        if (current.wind !== null && previous.wind !== null && Math.abs(current.wind - previous.wind) >= 3) reasons.push('风速变化较快');
        if (current.wave !== null && previous.wave !== null && Math.abs(current.wave - previous.wave) >= 1) reasons.push('浪高变化较快');
        if (current.current !== null && previous.current !== null && Math.abs(current.current - previous.current) >= 0.5) reasons.push('流速变化较快');
    }
    return reasons.length ? { ...row, reason: reasons.join('、') } : null;
}).filter(Boolean));
const reportFutureDailyAnalysis = computed(() => reportNotableDailyRows.value.length
    ? reportNotableDailyRows.value.map((row) => `${row.label}：${row.reason}，平均风速${row.wind} m/s、浪高${row.wave} m、最大阵风${row.gust} m/s、流速${row.current} m/s`).join('；') + '。'
    : '未来几天整体变化平稳，未筛选出变化较快或指标较高的重点日期。');
const reportImportantFutureSummary = computed(() => reportNotableDailyRows.value.length
    ? `未来重点日期：${reportNotableDailyRows.value.map((row) => `${row.label}（${row.reason}）`).join('、')}。`
    : '未来几天逐日预报整体变化平稳。');
const reportDailyPeakConclusion = computed(() => reportDailyPeakDetails.value.length
    ? `未来几天重点峰值：${reportDailyPeakDetails.value.map((item) => `预计在${item.time}，${item.label}达到${item.value.toFixed(1)} ${item.unit}`).join('；')}。`
    : '未来几天暂无可判定的重点峰值。');
const reportPeakConclusion = computed(() => {
    const parts = [];
    if (reportHourlyRecords.value.length) parts.push(`当前选中时段：${reportHourlyPeakConclusion.value}`);
    if (reportDailyRecords.value.length) parts.push(`未来重点日期：${reportFutureDailyAnalysis.value}${reportDailyPeakConclusion.value}`);
    return parts.join(' ') || '当前暂无足够的时序数据用于判断重点时段。';
});
const reportConclusion = computed(() => {
    if (!reportDailyRecords.value.length && !reportHourlyRecords.value.length) {
        return '当前区域暂无可用预报数据，请稍后刷新或检查接口返回状态。';
    }

    const scope = props.selectedSite?.matched ? '当前小矿区' : '当前区域';
    return `${scope}${reportCurrentDayAnalysis.value}${reportHourlyRecords.value.length ? reportHourlyPeakConclusion.value : ''}${reportImportantFutureSummary.value}${forecastStatus.value.detail}`;
});
const reportOperationAdvice = computed(() => {
    const maxWind = reportMax(['windSpeedMax', 'windSpeed']) || 0;
    const maxWave = reportMax(['waveHeightMax', 'waveHeight']) || 0;
    const maxCurrent = reportMax(['currentSpeedMax', 'currentSpeed']) || 0;
    if (maxWind >= 18 || maxWave >= 5 || maxCurrent >= 2) return '预计存在较明显海况影响，建议暂停高风险海上作业，按照应急预案组织值守和避险。';
    if (maxWind >= 12 || maxWave >= 3 || maxCurrent >= 1.5) return '建议加强现场值守和预报跟踪，合理安排作业窗口，对敏感作业预留调整时间。';
    return '当前预报指标总体平稳，可按计划开展常规作业，建议保持常规值守并关注下一轮预报更新。';
});

const downloadSiteForecastReport = () => {
    if (!props.selectedArea || !props.selectedSite?.matched || (!reportDailyRecords.value.length && !reportHourlyRecords.value.length)) {
        return;
    }

    const readValue = (record, fields) => fields.map((field) => reportNumber(record?.[field])).find((value) => value !== null);
    const regionName = props.region?.regionName || props.region?.regionCode || '--';
    const siteName = props.selectedArea.name || props.selectedArea.contractor || props.selectedSite.displayName || '当前小矿区';
    const siteId = props.selectedSite.siteId || props.selectedSite.id || '--';
    const lines = [
        '深海采矿小矿区海洋气象预报报告',
        '========================================',
        `所属区域：${regionName}`,
        `小矿区名称：${siteName}`,
        `小矿区编号：${siteId}`,
        `预报基准：${reportBaseDate.value}`,
        `有效至：${forecastStatus.value.validUntil}`,
        `逐日数据：${reportDailyRecords.value.length} 条`,
        `逐小时数据：${reportHourlyRecords.value.length} 条`,
        '',
        '一、预报结论',
        reportConclusion.value,
        '',
        '二、关键指标'
    ];

    reportMetricCards.value.forEach((metric) => lines.push(`${metric.label}：${metric.value} ${metric.unit}`));
    lines.push('', '三、逐日预报');
    reportDailyRows.value.forEach((row) => lines.push(`${row.label}：平均风速 ${row.wind} m/s，浪高 ${row.wave} m，最大阵风 ${row.gust} m/s，流速 ${row.current} m/s`));
    lines.push('', '四、未来重点日期');
    if (reportNotableDailyRows.value.length) {
        reportNotableDailyRows.value.forEach((row) => lines.push(`${row.label}：${row.reason}；平均风速 ${row.wind} m/s，浪高 ${row.wave} m，最大阵风 ${row.gust} m/s，流速 ${row.current} m/s`));
    } else {
        lines.push('未来几天整体变化平稳，未筛选出变化较快或指标较高的重点日期。');
    }
    lines.push('', '五、逐小时预报');
    if (reportHourlyRecords.value.length) {
        sortReportRecords(reportHourlyRecords.value).forEach((record) => {
            const time = formatHourlyLabel(record);
            const wind = reportFormat(readValue(record, ['windSpeedAvg', 'windSpeed']));
            const gust = reportFormat(readValue(record, ['gustMax', 'gust']));
            const wave = reportFormat(readValue(record, ['waveHeightAvg', 'waveHeight']));
            const period = reportFormat(readValue(record, ['wavePeriodAvg', 'wavePeriod']));
            const current = reportFormat(readValue(record, ['currentSpeedAvg', 'currentSpeed']));
            lines.push(`${time}：风速 ${wind} m/s，最大阵风 ${gust} m/s，浪高 ${wave} m，浪周期 ${period} s，流速 ${current} m/s`);
        });
    } else {
        lines.push('暂无逐小时预报数据');
    }
    lines.push('', '六、重点时段分析', reportPeakConclusion.value, '', '七、作业建议', reportOperationAdvice.value, '', '========================================', '说明：本文件由前端根据当前后端返回的小矿区逐日和逐小时数据整理生成，不包含大区域汇总数据。');

    const blob = new Blob([`\uFEFF${lines.join('\n')}\n`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `small_mining_area_forecast_${siteId}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

const formatCoordinate = (value, positiveSuffix) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return '--';
    }

    const numericValue = Number(value);
    const negativeSuffix = positiveSuffix === 'E' ? 'W' : 'S';
    return `${Math.abs(numericValue).toFixed(2)}°${numericValue >= 0 ? positiveSuffix : negativeSuffix}`;
};

const formatDailyLabel = (forecastDate) => {
    if (!forecastDate) {
        return '--';
    }

    const date = new Date(forecastDate);
    if (Number.isNaN(date.getTime())) {
        return forecastDate;
    }

    return `${date.getMonth() + 1}/${date.getDate()}`;
};

const formatHourlyLabel = (item) => {
    if (item?.forecastTime) {
        const timeText = String(item.forecastTime);
        if (timeText.includes('T') || timeText.includes(' ')) {
            const date = new Date(timeText);
            if (!Number.isNaN(date.getTime())) {
                return `${String(date.getHours()).padStart(2, '0')}:00`;
            }
        }

        if (/^\d{2}:\d{2}/.test(timeText)) {
            return timeText.slice(0, 5);
        }
    }

    if (item?.forecastHour !== null && item?.forecastHour !== undefined && item?.forecastHour !== '') {
        const hour = Number(item.forecastHour) % 24;
        if (Number.isFinite(hour)) {
            return `${String(hour).padStart(2, '0')}:00`;
        }
    }

    return '--';
};

const createEmptyGraphic = (text) => [
    {
        type: 'text',
        left: 'center',
        top: 'middle',
        style: {
            text,
            fill: '#94a3b8',
            fontSize: 20,
            fontWeight: 600
        }
    }
];

const getDailyChartInstance = async () => {
    await nextTick();

    if (!dailyChartRef.value) {
        return null;
    }

    if (!dailyChartInstance || dailyChartInstance.getDom() !== dailyChartRef.value) {
        dailyChartInstance?.dispose();
        dailyChartInstance = echarts.init(dailyChartRef.value);
    }

    return dailyChartInstance;
};

const getHourlyChartInstance = async () => {
    await nextTick();

    if (!hourlyChartRef.value) {
        return null;
    }

    if (!hourlyChartInstance || hourlyChartInstance.getDom() !== hourlyChartRef.value) {
        hourlyChartInstance?.dispose();
        hourlyChartInstance = echarts.init(hourlyChartRef.value);
    }

    return hourlyChartInstance;
};

const getSiteDailyChartInstance = async () => {
    await nextTick();

    if (!siteDailyChartRef.value) {
        return null;
    }

    if (!siteDailyChartInstance || siteDailyChartInstance.getDom() !== siteDailyChartRef.value) {
        siteDailyChartInstance?.dispose();
        siteDailyChartInstance = echarts.init(siteDailyChartRef.value);
    }

    return siteDailyChartInstance;
};

const getSiteHourlyChartInstance = async () => {
    await nextTick();

    if (!siteHourlyChartRef.value) {
        return null;
    }

    if (!siteHourlyChartInstance || siteHourlyChartInstance.getDom() !== siteHourlyChartRef.value) {
        siteHourlyChartInstance?.dispose();
        siteHourlyChartInstance = echarts.init(siteHourlyChartRef.value);
    }

    return siteHourlyChartInstance;
};

const renderDailyChart = async () => {
    if (!props.show || props.loading) {
        return;
    }

    const chart = await getDailyChartInstance();
    if (!chart) {
        return;
    }

    const xAxisData = props.dailyForecast.map((record) => formatDailyLabel(record.forecastDate));
    const selectedDate = String(props.selectedForecastDate || '').slice(0, 10);
    const selectedDailyIndex = props.dailyForecast.findIndex((record) => String(record?.forecastDate || '').slice(0, 10) === selectedDate);
    const selectedPointStyle = {
        color: '#fef08a',
        borderColor: '#ffffff',
        borderWidth: 2,
        shadowBlur: 14,
        shadowColor: 'rgba(250, 204, 21, 0.95)'
    };
    const pointData = (field) => props.dailyForecast.map((record, index) => {
        const value = record?.[field] ?? null;
        return index === selectedDailyIndex
            ? { value, symbolSize: 10, itemStyle: selectedPointStyle }
            : value;
    });
    const barData = props.dailyForecast.map((record, index) => {
        const value = record?.waveHeightAvg ?? null;
        return index === selectedDailyIndex
            ? { value, itemStyle: { ...selectedPointStyle, borderRadius: [3, 3, 0, 0] } }
            : value;
    });

    chart.setOption({
        backgroundColor: 'transparent',
        textStyle: {
            fontFamily: 'Noto Sans SC',
            fontWeight: 700
        },
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: '#22d3ee',
            borderWidth: 1,
            textStyle: { color: '#f8fafc', fontFamily: 'Noto Sans SC', fontWeight: 700 }
        },
        legend: {
            top: 0,
            textStyle: { color: '#dbe7f7', fontSize: 12 },
            data: ['风速均值', '风速最大', '最大阵风', '浪高均值', '浪高最大']
        },
        grid: {
            top: 38,
            left: 40,
            right: 40,
            bottom: 34
        },
        xAxis: {
            type: 'category',
            data: xAxisData,
            axisLine: { lineStyle: { color: '#334155' } },
            axisLabel: { color: '#f8fafc', fontSize: 12 }
        },
        yAxis: [
            {
                type: 'value',
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: { color: '#f8fafc', fontSize: 12 },
                splitLine: { lineStyle: { color: 'rgba(71, 85, 105, 0.55)' } }
            },
            {
                type: 'value',
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: { color: '#f8fafc', fontSize: 12 },
                splitLine: { show: false }
            }
        ],
        graphic: props.dailyForecast.length ? [] : createEmptyGraphic('暂无逐天统计数据'),
        series: [
            {
                name: '风速均值',
                type: 'line',
                smooth: true,
                symbolSize: 6,
                data: pointData('windSpeedAvg'),
                lineStyle: { color: '#22d3ee', width: 2 },
                itemStyle: { color: '#22d3ee' }
            },
            {
                name: '风速最大',
                type: 'line',
                smooth: true,
                symbolSize: 5,
                data: pointData('windSpeedMax'),
                lineStyle: { color: '#67e8f9', width: 2 },
                itemStyle: { color: '#67e8f9' }
            },
            {
                name: '最大阵风',
                type: 'line',
                smooth: true,
                symbolSize: 0,
                data: pointData('gustMax'),
                lineStyle: { color: '#f59e0b', width: 2, type: 'dashed' },
                itemStyle: { color: '#f59e0b' }
            },
            {
                name: '浪高均值',
                type: 'bar',
                yAxisIndex: 1,
                barWidth: 10,
                data: barData,
                itemStyle: {
                    color: 'rgba(56, 189, 248, 0.55)',
                    borderRadius: [3, 3, 0, 0]
                },
                ...(selectedDailyIndex >= 0 ? {
                    markLine: {
                        symbol: 'none',
                        label: {
                            show: true,
                            position: 'insideEndTop',
                            color: '#fef9c3',
                            fontSize: 11,
                            fontWeight: 800,
                            backgroundColor: 'rgba(120, 53, 15, 0.88)',
                            padding: [3, 6],
                            formatter: '已选日期'
                        },
                        lineStyle: {
                            color: '#facc15',
                            width: 2,
                            type: 'dashed',
                            shadowBlur: 8,
                            shadowColor: 'rgba(250, 204, 21, 0.9)'
                        },
                        data: [{ xAxis: xAxisData[selectedDailyIndex] }]
                    }
                } : {})
            },
            {
                name: '浪高最大',
                type: 'line',
                smooth: true,
                yAxisIndex: 1,
                symbolSize: 5,
                data: pointData('waveHeightMax'),
                lineStyle: { color: '#38bdf8', width: 2 },
                itemStyle: { color: '#38bdf8' }
            }
        ]
    });

    chart.off('click');
    chart.on('click', (params) => {
        const record = props.dailyForecast[params.dataIndex];
        if (record?.forecastDate) {
            emit('forecastDateChange', record.forecastDate);
        }
    });
};

const renderHourlyChart = async () => {
    if (!props.show || props.loadingHourly) {
        return;
    }

    const chart = await getHourlyChartInstance();
    if (!chart) {
        return;
    }

    chart.setOption({
        backgroundColor: 'transparent',
        textStyle: {
            fontFamily: 'Noto Sans SC',
            fontWeight: 700
        },
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: '#38bdf8',
            borderWidth: 1,
            textStyle: { color: '#f8fafc', fontFamily: 'Noto Sans SC', fontWeight: 700 }
        },
        legend: {
            top: 0,
            textStyle: { color: '#dbe7f7', fontSize: 12 },
            data: ['风速均值', '风速最大', '最大阵风', '浪高均值', '浪高最大']
        },
        grid: {
            top: 38,
            left: 40,
            right: 40,
            bottom: 42
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: props.hourlyForecast.map((item) => formatHourlyLabel(item)),
            axisLine: { lineStyle: { color: '#334155' } },
            axisLabel: { color: '#f8fafc', fontSize: 12 }
        },
        yAxis: [
            {
                type: 'value',
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: { color: '#f8fafc', fontSize: 12 },
                splitLine: { lineStyle: { color: 'rgba(71, 85, 105, 0.55)' } }
            },
            {
                type: 'value',
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: { color: '#f8fafc', fontSize: 12 },
                splitLine: { show: false }
            }
        ],
        graphic: props.hourlyForecast.length ? [] : createEmptyGraphic('暂无逐小时统计数据'),
        series: [
            {
                name: '风速均值',
                type: 'line',
                smooth: true,
                data: props.hourlyForecast.map((item) => item.windSpeedAvg ?? null),
                lineStyle: { color: '#22d3ee', width: 2 },
                itemStyle: { color: '#22d3ee' }
            },
            {
                name: '风速最大',
                type: 'line',
                smooth: true,
                data: props.hourlyForecast.map((item) => item.windSpeedMax ?? null),
                lineStyle: { color: '#67e8f9', width: 2 },
                itemStyle: { color: '#67e8f9' }
            },
            {
                name: '最大阵风',
                type: 'line',
                smooth: true,
                data: props.hourlyForecast.map((item) => item.gustMax ?? null),
                lineStyle: { color: '#f59e0b', width: 2, type: 'dashed' },
                itemStyle: { color: '#f59e0b' }
            },
            {
                name: '浪高均值',
                type: 'line',
                smooth: true,
                yAxisIndex: 1,
                data: props.hourlyForecast.map((item) => item.waveHeightAvg ?? null),
                lineStyle: { color: '#38bdf8', width: 2 },
                itemStyle: { color: '#38bdf8' },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(56, 189, 248, 0.28)' },
                            { offset: 1, color: 'rgba(56, 189, 248, 0.02)' }
                        ]
                    }
                }
            },
            {
                name: '浪高最大',
                type: 'line',
                smooth: true,
                yAxisIndex: 1,
                data: props.hourlyForecast.map((item) => item.waveHeightMax ?? null),
                lineStyle: { color: '#0ea5e9', width: 2 },
                itemStyle: { color: '#0ea5e9' }
            }
        ]
    });
};

const renderSiteDailyChart = async () => {
    if (!props.show || props.loadingSite || !props.selectedSite?.matched) {
        return;
    }

    const chart = await getSiteDailyChartInstance();
    if (!chart) {
        return;
    }

    chart.setOption({
        backgroundColor: 'transparent',
        textStyle: {
            fontFamily: 'Noto Sans SC',
            fontWeight: 700
        },
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: '#22d3ee',
            borderWidth: 1,
            textStyle: { color: '#f8fafc', fontFamily: 'Noto Sans SC', fontWeight: 700 }
        },
        legend: {
            top: 0,
            textStyle: { color: '#dbe7f7', fontSize: 12 },
            data: ['平均风速', '最大风速', '最大阵风', '平均浪高', '最大浪高']
        },
        grid: {
            top: 34,
            left: 34,
            right: 34,
            bottom: 28
        },
        xAxis: {
            type: 'category',
            data: props.siteDailyForecast.map((record) => formatDailyLabel(record.forecastDate)),
            axisLine: { lineStyle: { color: '#334155' } },
            axisLabel: { color: '#f8fafc', fontSize: 12 }
        },
        yAxis: [
            {
                type: 'value',
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: { color: '#f8fafc', fontSize: 12 },
                splitLine: { lineStyle: { color: 'rgba(71, 85, 105, 0.45)' } }
            },
            {
                type: 'value',
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: { color: '#f8fafc', fontSize: 12 },
                splitLine: { show: false }
            }
        ],
        graphic: props.siteDailyForecast.length ? [] : createEmptyGraphic('暂无单矿区逐天数据'),
        series: [
            {
                name: '平均风速',
                type: 'line',
                smooth: true,
                symbolSize: 4,
                data: props.siteDailyForecast.map((record) => record.windSpeedAvg ?? null),
                lineStyle: { color: '#22d3ee', width: 2 },
                itemStyle: { color: '#22d3ee' }
            },
            {
                name: '最大风速',
                type: 'line',
                smooth: true,
                symbolSize: 4,
                data: props.siteDailyForecast.map((record) => record.windSpeedMax ?? null),
                lineStyle: { color: '#67e8f9', width: 2 },
                itemStyle: { color: '#67e8f9' }
            },
            {
                name: '最大阵风',
                type: 'line',
                smooth: true,
                symbolSize: 0,
                data: props.siteDailyForecast.map((record) => record.gustMax ?? null),
                lineStyle: { color: '#f59e0b', width: 2, type: 'dashed' },
                itemStyle: { color: '#f59e0b' }
            },
            {
                name: '平均浪高',
                type: 'bar',
                yAxisIndex: 1,
                barWidth: 8,
                data: props.siteDailyForecast.map((record) => record.waveHeightAvg ?? null),
                itemStyle: {
                    color: 'rgba(56, 189, 248, 0.55)',
                    borderRadius: [3, 3, 0, 0]
                }
            },
            {
                name: '最大浪高',
                type: 'line',
                smooth: true,
                yAxisIndex: 1,
                symbolSize: 4,
                data: props.siteDailyForecast.map((record) => record.waveHeightMax ?? null),
                lineStyle: { color: '#38bdf8', width: 2 },
                itemStyle: { color: '#38bdf8' }
            }
        ]
    });
};

const renderSiteHourlyChart = async () => {
    if (!props.show || props.loadingSiteHourly || !props.selectedSite?.matched) {
        return;
    }

    const chart = await getSiteHourlyChartInstance();
    if (!chart) {
        return;
    }

    chart.setOption({
        backgroundColor: 'transparent',
        textStyle: {
            fontFamily: 'Noto Sans SC',
            fontWeight: 700
        },
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: '#38bdf8',
            borderWidth: 1,
            textStyle: { color: '#f8fafc', fontFamily: 'Noto Sans SC', fontWeight: 700 }
        },
        legend: {
            top: 0,
            textStyle: { color: '#dbe7f7', fontSize: 12 },
            data: ['风速', '阵风', '浪高', '波周期']
        },
        grid: {
            top: 34,
            left: 34,
            right: 34,
            bottom: 36
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: props.siteHourlyForecast.map((item) => formatHourlyLabel(item)),
            axisLine: { lineStyle: { color: '#334155' } },
            axisLabel: { color: '#f8fafc', fontSize: 12 }
        },
        yAxis: [
            {
                type: 'value',
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: { color: '#f8fafc', fontSize: 12 },
                splitLine: { lineStyle: { color: 'rgba(71, 85, 105, 0.45)' } }
            },
            {
                type: 'value',
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: { color: '#f8fafc', fontSize: 12 },
                splitLine: { show: false }
            }
        ],
        graphic: props.siteHourlyForecast.length ? [] : createEmptyGraphic('暂无单矿区逐小时数据'),
        series: [
            {
                name: '风速',
                type: 'line',
                smooth: true,
                symbolSize: 4,
                data: props.siteHourlyForecast.map((item) => item.windSpeed ?? item.windSpeedAvg ?? null),
                lineStyle: { color: '#22d3ee', width: 2 },
                itemStyle: { color: '#22d3ee' }
            },
            {
                name: '阵风',
                type: 'line',
                smooth: true,
                symbolSize: 4,
                data: props.siteHourlyForecast.map((item) => item.gust ?? item.gustMax ?? null),
                lineStyle: { color: '#f59e0b', width: 2, type: 'dashed' },
                itemStyle: { color: '#f59e0b' }
            },
            {
                name: '浪高',
                type: 'line',
                smooth: true,
                symbolSize: 4,
                data: props.siteHourlyForecast.map((item) => item.waveHeight ?? item.waveHeightAvg ?? null),
                lineStyle: { color: '#38bdf8', width: 2 },
                itemStyle: { color: '#38bdf8' }
            },
            {
                name: '波周期',
                type: 'line',
                smooth: true,
                yAxisIndex: 1,
                symbolSize: 4,
                data: props.siteHourlyForecast.map((item) => item.wavePeriod ?? item.wavePeriodAvg ?? null),
                lineStyle: { color: '#a78bfa', width: 2 },
                itemStyle: { color: '#a78bfa' }
            }
        ]
    });
};

const resizeCharts = () => {
    dailyChartInstance?.resize();
    hourlyChartInstance?.resize();
    siteDailyChartInstance?.resize();
    siteHourlyChartInstance?.resize();
};

const disposeDailyChart = () => {
    if (dailyChartInstance) {
        dailyChartInstance.dispose();
        dailyChartInstance = null;
    }
};

const disposeHourlyChart = () => {
    if (hourlyChartInstance) {
        hourlyChartInstance.dispose();
        hourlyChartInstance = null;
    }
};

const disposeSiteDailyChart = () => {
    if (siteDailyChartInstance) {
        siteDailyChartInstance.dispose();
        siteDailyChartInstance = null;
    }
};

const disposeSiteHourlyChart = () => {
    if (siteHourlyChartInstance) {
        siteHourlyChartInstance.dispose();
        siteHourlyChartInstance = null;
    }
};

const disposeCharts = () => {
    disposeDailyChart();
    disposeHourlyChart();
    disposeSiteDailyChart();
    disposeSiteHourlyChart();
};

watch(
    () => [props.show, props.loading, props.dailyForecast, props.selectedForecastDate],
    async ([show, loading]) => {
        if (!show) {
            disposeDailyChart();
            return;
        }

        if (loading) {
            disposeDailyChart();
            return;
        }

        await renderDailyChart();
    },
    { deep: true }
);

watch(
    () => [props.show, props.loadingHourly, props.hourlyForecast, props.selectedForecastDate],
    async ([show, loadingHourly]) => {
        if (!show) {
            disposeHourlyChart();
            return;
        }

        if (loadingHourly) {
            disposeHourlyChart();
            return;
        }

        await renderHourlyChart();
    },
    { deep: true }
);

watch(
    () => [props.show, props.loadingSite, props.selectedSite, props.siteDailyForecast, props.selectedForecastDate],
    async ([show, loadingSite, selectedSite]) => {
        if (!show || loadingSite || !selectedSite?.matched) {
            disposeSiteDailyChart();
            return;
        }

        await renderSiteDailyChart();
    },
    { deep: true }
);

watch(
    () => [props.show, props.loadingSiteHourly, props.selectedSite, props.siteHourlyForecast, props.selectedForecastDate],
    async ([show, loadingSiteHourly, selectedSite]) => {
        if (!show || loadingSiteHourly || !selectedSite?.matched) {
            disposeSiteHourlyChart();
            return;
        }

        await renderSiteHourlyChart();
    },
    { deep: true }
);

onMounted(() => {
    window.addEventListener('resize', resizeCharts);
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', resizeCharts);
    disposeCharts();
});
</script>

<style scoped>
.workspace-fade-enter-active,
.workspace-fade-leave-active {
    transition: opacity 0.24s ease;
}

.workspace-fade-enter-from,
.workspace-fade-leave-to {
    opacity: 0;
}

.workspace-panel {
    border-radius: 4px;
    border: 2px solid rgba(0, 212, 255, 0.45);
    background: linear-gradient(
        180deg,
        rgba(13, 27, 42, 0.92) 0%,
        rgba(10, 22, 40, 0.88) 100%
    );
    box-shadow:
        0 0 30px rgba(0, 212, 255, 0.22),
        0 0 60px rgba(30, 144, 255, 0.12),
        inset 0 0 40px rgba(0, 212, 255, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(15px);
}

.panel-scan-line {
    position: absolute;
    top: 0;
    left: 0;
    height: 2px;
    width: 100%;
    background: linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.9), transparent);
    pointer-events: none;
}

.info-card {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    border: 1px solid rgba(71, 85, 105, 0.7);
    background: rgba(8, 15, 28, 0.68);
    border-radius: 4px;
    padding: 11px 12px;
}

.info-label {
    color: rgba(147, 197, 253, 0.9);
}

.info-value {
    color: #f8fafc;
    font-weight: 700;
    max-width: 62%;
    text-align: right;
    word-break: break-word;
}

.metric-card {
    display: flex;
    min-height: 76px;
    flex-direction: column;
    justify-content: center;
    border-radius: 4px;
    border: 1px solid rgba(34, 211, 238, 0.18);
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.8) 0%, rgba(8, 13, 25, 0.95) 100%);
    padding: 10px 12px;
}

.site-chart-card {
    border-radius: 4px;
    border: 1px solid rgba(71, 85, 105, 0.7);
    background: rgba(8, 15, 28, 0.68);
    padding: 10px 12px 6px;
}

.metric-label {
    font-size: 12px;
    color: #aebed2;
}

.metric-value {
    margin-top: 6px;
    font-family: 'Rajdhani', 'Noto Sans SC', sans-serif;
    font-size: 24px;
    font-weight: 700;
    line-height: 1;
}

.metric-unit {
    margin-top: 6px;
    font-size: 11px;
    color: #64748b;
}

.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.35);
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(34, 211, 238, 0.38);
    border-radius: 999px;
}
</style>
