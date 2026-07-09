<template>
    <transition name="workspace-fade">
        <div
            v-if="show && region"
            class="absolute inset-0 z-40 pointer-events-none font-['Noto_Sans_SC']"
        >
            <div
                class="absolute right-6 top-36 bottom-6 flex w-[30rem] flex-col gap-5"
            >
                <div
                    class="workspace-panel relative min-h-0 flex-1 pointer-events-auto overflow-hidden"
                >
                    <div class="panel-scan-line"></div>
                    <div class="flex items-center justify-between border-b border-cyan-500/25 bg-gradient-to-r from-cyan-900/35 to-transparent px-4 py-3">
                        <div class="flex items-center gap-3">
                            <div class="h-5 w-1.5 bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>
                            <div>
                                <div class="text-xl font-bold tracking-wide text-white">区域逐天统计</div>
                            </div>
                        </div>
                        <button
                            @click="emit('close')"
                            class="flex h-8 w-8 items-center justify-center rounded-sm border border-cyan-500/35 text-cyan-200 transition-colors hover:bg-cyan-500 hover:text-slate-950"
                            title="关闭区域总览"
                        >
                            ✕
                        </button>
                    </div>

                    <div v-if="loading" class="flex h-[calc(100%-3.25rem)] items-center justify-center text-slate-300">
                        <div class="flex items-center gap-3">
                            <span class="inline-block h-8 w-8 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></span>
                            <span>正在加载区域逐天统计...</span>
                        </div>
                    </div>

                    <div v-else class="flex h-[calc(100%-3.25rem)] min-h-0 flex-col px-4 pb-4 pt-3">
                        <div class="mb-3 flex items-center justify-between gap-3 text-sm">
                            <div class="text-slate-200">
                                当前区域: <span class="font-semibold text-cyan-200">{{ region.regionName || region.regionCode || '--' }}</span>
                            </div>
                            <div class="rounded-sm border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-sm text-amber-100">
                                当前展示风浪流预报
                            </div>
                        </div>
                        <div class="mb-3 grid grid-cols-2 gap-3">
                            <div class="metric-card">
                                <div class="metric-label">区域平均水深</div>
                                <div class="metric-value text-cyan-200">{{ formatMetric(region?.depthAvgMeters, 0) }}</div>
                                <div class="metric-unit">m</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-label">区域中心水深</div>
                                <div class="metric-value text-sky-200">{{ formatMetric(region?.centerDepthMeters, 0) }}</div>
                                <div class="metric-unit">m</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-label">日均流速</div>
                                <div class="metric-value text-violet-200">{{ formatMetric(selectedDailyRecord?.currentSpeedAvg, 2) }}</div>
                                <div class="metric-unit">m/s</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-label">最大流速</div>
                                <div class="metric-value text-fuchsia-200">{{ formatMetric(selectedDailyRecord?.currentSpeedMax, 2) }}</div>
                                <div class="metric-unit">{{ formatDirection(selectedDailyRecord?.currentDirMean) }}</div>
                            </div>
                        </div>
                        <div ref="dailyChartRef" class="min-h-0 flex-1 w-full"></div>
                    </div>
                </div>

                <div
                    class="workspace-panel relative min-h-0 flex-1 pointer-events-auto overflow-hidden"
                >
                    <div class="panel-scan-line"></div>
                    <div class="flex items-center justify-between border-b border-cyan-500/25 bg-gradient-to-r from-sky-900/35 to-transparent px-4 py-3">
                        <div class="flex items-center gap-3">
                            <div class="h-5 w-1.5 bg-sky-400 shadow-[0_0_10px_#38bdf8]"></div>
                            <div>
                                <div class="text-xl font-bold tracking-wide text-white">区域逐 3 小时统计</div>
                            </div>
                        </div>
                        <div class="rounded-sm border border-sky-500/25 bg-sky-500/10 px-2 py-1 text-sm text-sky-200">
                            {{ selectedForecastDate || '--' }}
                        </div>
                    </div>

                    <div v-if="loadingHourly" class="flex h-[calc(100%-3.25rem)] items-center justify-center text-slate-300">
                        <div class="flex items-center gap-3">
                            <span class="inline-block h-8 w-8 rounded-full border-4 border-sky-500/20 border-t-sky-400 animate-spin"></span>
                            <span>正在加载逐小时统计...</span>
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
                        <div class="mb-3 grid grid-cols-3 gap-3">
                            <div class="metric-card">
                                <div class="metric-label">小时平均流速</div>
                                <div class="metric-value text-violet-200">{{ formatMetric(selectedRegionLatestHourlyRecord?.currentSpeedAvg, 2) }}</div>
                                <div class="metric-unit">m/s</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-label">小时最大流速</div>
                                <div class="metric-value text-fuchsia-200">{{ formatMetric(selectedRegionLatestHourlyRecord?.currentSpeedMax, 2) }}</div>
                                <div class="metric-unit">m/s</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-label">平均流向</div>
                                <div class="metric-value text-sky-200">{{ formatDirection(selectedRegionLatestHourlyRecord?.currentDirMean) }}</div>
                                <div class="metric-unit">区域小时尺度</div>
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
                            <div>
                                <div class="text-xl font-bold tracking-wide text-white">单矿区逐天统计</div>
                            </div>
                        </div>
                    </div>

                    <div v-if="loadingSite" class="flex h-[calc(100%-3.25rem)] items-center justify-center text-slate-300">
                        <div class="flex items-center gap-3">
                            <span class="inline-block h-8 w-8 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></span>
                            <span>正在加载单矿区逐天统计...</span>
                        </div>
                    </div>

                    <div v-else-if="!selectedSite.matched" class="flex h-[calc(100%-3.25rem)] items-center justify-center px-8 text-center">
                        <div>
                            <div class="text-xl font-bold text-amber-100">暂无逐天站点</div>
                            <div class="mt-2 text-base text-amber-200/80">当前矿区未匹配到单矿区风浪站点数据</div>
                        </div>
                    </div>

                    <div v-else class="flex h-[calc(100%-3.25rem)] min-h-0 flex-col px-4 pb-4 pt-3">
                        <div class="mb-3 grid grid-cols-4 gap-2">
                            <div class="metric-card">
                                <div class="metric-label">站点水深</div>
                                <div class="metric-value text-cyan-200">{{ formatMetric(selectedSite?.depthMeters, 0) }}</div>
                                <div class="metric-unit">m</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-label">站点高程</div>
                                <div class="metric-value text-sky-200">{{ formatMetric(selectedSite?.elevationMeters, 0) }}</div>
                                <div class="metric-unit">m</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-label">日均流速</div>
                                <div class="metric-value text-violet-200">{{ formatMetric(selectedSiteDailyRecord?.currentSpeedAvg, 2) }}</div>
                                <div class="metric-unit">m/s</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-label">最大流速</div>
                                <div class="metric-value text-fuchsia-200">{{ formatMetric(selectedSiteDailyRecord?.currentSpeedMax, 2) }}</div>
                                <div class="metric-unit">{{ formatDirection(selectedSiteDailyRecord?.currentDirMean) }}</div>
                            </div>
                        </div>
                        <div ref="siteDailyChartRef" class="min-h-0 flex-1 w-full"></div>
                    </div>
                </div>

                <div class="workspace-panel relative h-[22rem] min-w-0 flex-1 pointer-events-auto overflow-hidden">
                    <div class="panel-scan-line"></div>
                    <div class="flex items-center border-b border-cyan-500/25 bg-gradient-to-r from-sky-900/35 to-transparent px-4 py-3">
                        <div class="flex items-center gap-3">
                            <div class="h-5 w-1.5 bg-sky-400 shadow-[0_0_10px_#38bdf8]"></div>
                            <div>
                                <div class="text-xl font-bold tracking-wide text-white">单矿区逐 3 小时统计</div>
                            </div>
                        </div>
                    </div>

                    <div v-if="loadingSiteHourly" class="flex h-[calc(100%-3.25rem)] items-center justify-center text-slate-300">
                        <div class="flex items-center gap-3">
                            <span class="inline-block h-8 w-8 rounded-full border-4 border-sky-500/20 border-t-sky-400 animate-spin"></span>
                            <span>正在加载单矿区逐小时统计...</span>
                        </div>
                    </div>

                    <div v-else-if="!selectedSite.matched" class="flex h-[calc(100%-3.25rem)] items-center justify-center px-8 text-center">
                        <div>
                            <div class="text-xl font-bold text-amber-100">暂无逐小时站点</div>
                            <div class="mt-2 text-base text-amber-200/80">当前矿区未匹配到单矿区风浪站点数据</div>
                        </div>
                    </div>

                    <div v-else class="flex h-[calc(100%-3.25rem)] min-h-0 flex-col px-4 pb-4 pt-3">
                        <div class="mb-3 grid grid-cols-3 gap-3">
                            <div class="metric-card">
                                <div class="metric-label">站点流速</div>
                                <div class="metric-value text-violet-200">{{ formatMetric(selectedSiteLatestHourlyRecord?.currentSpeed, 2) }}</div>
                                <div class="metric-unit">m/s</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-label">站点流向</div>
                                <div class="metric-value text-sky-200">{{ formatDirection(selectedSiteLatestHourlyRecord?.currentDir) }}</div>
                                <div class="metric-unit">单矿区小时尺度</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-label">波浪周期</div>
                                <div class="metric-value text-amber-100">{{ formatMetric(selectedSiteLatestHourlyRecord?.wavePeriod, 1) }}</div>
                                <div class="metric-unit">s</div>
                            </div>
                        </div>
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

const emit = defineEmits(['close', 'forecastDateChange']);

const dailyChartRef = ref(null);
const hourlyChartRef = ref(null);
const siteDailyChartRef = ref(null);
const siteHourlyChartRef = ref(null);

let dailyChartInstance = null;
let hourlyChartInstance = null;
let siteDailyChartInstance = null;
let siteHourlyChartInstance = null;

const selectedDailyRecord = computed(() => (
    props.dailyForecast.find((record) => record.forecastDate === props.selectedForecastDate)
    || props.dailyForecast[0]
    || null
));

const selectedRegionLatestHourlyRecord = computed(() => (
    props.hourlyForecast[props.hourlyForecast.length - 1]
    || props.hourlyForecast[0]
    || null
));

const selectedSiteDailyRecord = computed(() => (
    props.siteDailyForecast.find((record) => record.forecastDate === props.selectedForecastDate)
    || props.siteDailyForecast[0]
    || null
));

const selectedSiteLatestHourlyRecord = computed(() => (
    props.siteHourlyForecast[props.siteHourlyForecast.length - 1]
    || props.siteHourlyForecast[0]
    || null
));

const formatMetric = (value, digits = 1) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return '--';
    }

    return Number(value).toFixed(Number(digits));
};

const formatDirection = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return '--';
    }

    const degree = ((Number(value) % 360) + 360) % 360;
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degree / 45) % directions.length;
    return `${degree.toFixed(0)}° ${directions[index]}`;
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

const selectedSiteLatestTimeLabel = computed(() => {
    if (!selectedSiteLatestHourlyRecord.value) {
        return '--';
    }

    return formatHourlyLabel(selectedSiteLatestHourlyRecord.value);
});

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
            axisLabel: { color: '#b8c6d9', fontSize: 12 }
        },
        yAxis: [
            {
                type: 'value',
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: { color: '#b8c6d9', fontSize: 12 },
                splitLine: { lineStyle: { color: 'rgba(71, 85, 105, 0.55)' } }
            },
            {
                type: 'value',
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: { color: '#b8c6d9', fontSize: 12 },
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
                data: props.dailyForecast.map((record) => record.windSpeedAvg ?? null),
                lineStyle: { color: '#22d3ee', width: 2 },
                itemStyle: { color: '#22d3ee' }
            },
            {
                name: '风速最大',
                type: 'line',
                smooth: true,
                symbolSize: 5,
                data: props.dailyForecast.map((record) => record.windSpeedMax ?? null),
                lineStyle: { color: '#67e8f9', width: 2 },
                itemStyle: { color: '#67e8f9' }
            },
            {
                name: '最大阵风',
                type: 'line',
                smooth: true,
                symbolSize: 0,
                data: props.dailyForecast.map((record) => record.gustMax ?? null),
                lineStyle: { color: '#f59e0b', width: 2, type: 'dashed' },
                itemStyle: { color: '#f59e0b' }
            },
            {
                name: '浪高均值',
                type: 'bar',
                yAxisIndex: 1,
                barWidth: 10,
                data: props.dailyForecast.map((record) => record.waveHeightAvg ?? null),
                itemStyle: {
                    color: 'rgba(56, 189, 248, 0.55)',
                    borderRadius: [3, 3, 0, 0]
                }
            },
            {
                name: '浪高最大',
                type: 'line',
                smooth: true,
                yAxisIndex: 1,
                symbolSize: 5,
                data: props.dailyForecast.map((record) => record.waveHeightMax ?? null),
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
            axisLabel: { color: '#b8c6d9', fontSize: 12 }
        },
        yAxis: [
            {
                type: 'value',
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: { color: '#b8c6d9', fontSize: 12 },
                splitLine: { lineStyle: { color: 'rgba(71, 85, 105, 0.55)' } }
            },
            {
                type: 'value',
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: { color: '#b8c6d9', fontSize: 12 },
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
            axisLabel: { color: '#b8c6d9', fontSize: 12 }
        },
        yAxis: [
            {
                type: 'value',
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: { color: '#b8c6d9', fontSize: 12 },
                splitLine: { lineStyle: { color: 'rgba(71, 85, 105, 0.45)' } }
            },
            {
                type: 'value',
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: { color: '#b8c6d9', fontSize: 12 },
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
            axisLabel: { color: '#b8c6d9', fontSize: 12 }
        },
        yAxis: [
            {
                type: 'value',
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: { color: '#b8c6d9', fontSize: 12 },
                splitLine: { lineStyle: { color: 'rgba(71, 85, 105, 0.45)' } }
            },
            {
                type: 'value',
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: { color: '#b8c6d9', fontSize: 12 },
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
