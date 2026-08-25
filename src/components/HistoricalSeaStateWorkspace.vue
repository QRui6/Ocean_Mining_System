<template>
    <transition name="workspace-fade">
        <div
            v-if="show"
            class="absolute right-6 top-36 bottom-6 z-40 w-[27rem] pointer-events-none font-['Noto_Sans_SC']"
        >
            <div
                class="tech-panel-enhanced relative flex h-full min-h-0 flex-col overflow-hidden pointer-events-auto group"
                style="clip-path: polygon(0 0, 100% 0, 100% 95%, 92% 100%, 0 100%);"
            >
                <div class="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
                <div class="corner-decoration corner-tl scale-125"></div>
                <div class="corner-decoration corner-tr scale-125"></div>
                <div class="corner-decoration corner-bl scale-125"></div>
                <div class="corner-decoration corner-br scale-125"></div>

                <section class="flex min-h-0 flex-[1.08] flex-col">
                    <div class="flex items-center justify-between border-b-2 px-5 py-3 shrink-0" style="border-color: rgba(0, 212, 255, 0.32);">
                        <div class="flex items-center gap-3">
                            <div class="h-5 w-1.5 bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>
                            <div>
                                <div class="text-[22px] font-bold tracking-wide text-white">历史海况统计</div>
                            </div>
                        </div>
                        <div class="ml-auto text-right text-[15px] text-slate-200">
                            <div>{{ selectedAreaTitle }}</div>
                            <div class="mt-1 text-slate-300">年份 {{ selectedYearRange }}</div>
                        </div>
                        <button
                            class="floating-panel-close-btn floating-panel-close-btn--inline"
                            type="button"
                            title="关闭历史海况查询"
                            aria-label="关闭历史海况查询"
                            @click="emit('close')"
                        >
                            ✕
                        </button>
                    </div>

                    <div v-if="loading" class="flex h-[calc(100%-4rem)] items-center justify-center text-slate-300">
                        <div class="flex items-center gap-3">
                            <span class="inline-block h-8 w-8 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></span>
                            <span class="text-base">正在加载历史海况统计...</span>
                        </div>
                    </div>

                    <div v-else-if="errorMessage" class="min-h-0 flex-1 p-4">
                        <div class="warning-box h-full">{{ errorMessage }}</div>
                    </div>

                    <div v-else class="min-h-0 flex-1 p-4">
                        <div class="flex h-full flex-col gap-3">
                            <div
                                v-if="compactSummaryCards.length"
                                :class="['compact-metric-row', compactMetricRowClass(compactSummaryCards.length)]"
                            >
                                <div
                                    v-for="item in compactSummaryCards"
                                    :key="item.label"
                                    class="compact-metric-card"
                                >
                                    <span>{{ item.label }}</span>
                                    <strong>{{ item.value }}</strong>
                                </div>
                            </div>
                            <div ref="trendChartRef" class="chart-box min-h-0 flex-1"></div>
                            <div class="window-legend">
                                <span><i class="window-color window-color-wind"></i>风速</span>
                                <span><i class="window-color window-color-wave"></i>浪高</span>
                                <span><i class="window-color window-color-current"></i>流速</span>
                            </div>
                        </div>
                    </div>
                </section>

                <div class="history-workspace-divider"></div>

                <section class="flex min-h-0 flex-1 flex-col">
                    <div class="flex items-center justify-between border-b-2 px-5 py-3 shrink-0" style="border-color: rgba(56, 189, 248, 0.32);">
                        <div class="flex items-center gap-3">
                            <div class="h-5 w-1.5 bg-sky-400 shadow-[0_0_10px_#38bdf8]"></div>
                            <div>
                                <div class="text-[22px] font-bold tracking-wide text-white">月度海况详情</div>
                            </div>
                        </div>
                        <div class="text-right text-[15px] text-slate-200">
                            <div>{{ selectedRecord?.monthLabel || '未选择月份' }}</div>
                            <div class="mt-1 text-slate-300">{{ selectedPointText }}</div>
                        </div>
                    </div>

                    <div v-if="errorMessage" class="flex h-[calc(100%-4rem)] items-center justify-center px-8">
                        <div class="warning-box w-full">{{ errorMessage }}</div>
                    </div>

                    <div v-else-if="!selectedRecord" class="flex h-[calc(100%-4rem)] items-center justify-center px-8 text-center">
                        <div>
                            <div class="text-xl font-bold text-slate-100">未选择月份</div>
                            <div class="mt-2 text-base text-slate-300">点击左侧历史海况列表后显示详情</div>
                        </div>
                    </div>

                    <div v-else class="min-h-0 flex-1 p-4">
                        <div class="flex h-full flex-col gap-3">
                            <div
                                v-if="compactDetailCards.length"
                                :class="['compact-metric-row', compactMetricRowClass(compactDetailCards.length)]"
                            >
                                <div
                                    v-for="item in compactDetailCards"
                                    :key="item.label"
                                    class="compact-metric-card"
                                >
                                    <span>{{ item.label }}</span>
                                    <strong>{{ item.value }}</strong>
                                </div>
                            </div>
                            <div ref="detailChartRef" class="chart-box min-h-0 flex-1"></div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    </transition>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts';

const emit = defineEmits(['close']);

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    loading: {
        type: Boolean,
        default: false
    },
    selectedArea: {
        type: Object,
        default: null
    },
    selectedPoint: {
        type: Object,
        default: null
    },
    records: {
        type: Array,
        default: () => []
    },
    selectedRecord: {
        type: Object,
        default: null
    },
    filters: {
        type: Object,
        default: () => ({
            startYear: 2000,
            endYear: 2006,
            dataType: 'all'
        })
    },
    errorMessage: {
        type: String,
        default: ''
    }
});

const trendChartRef = ref(null);
const detailChartRef = ref(null);

let trendChart = null;
let detailChart = null;

const selectedAreaTitle = computed(() => (
    props.selectedArea?.regionName
    || props.selectedArea?.regionCode
    || props.selectedArea?.contractor
    || props.selectedArea?.name
    || '--'
));

const selectedYearRange = computed(() => (
    `${props.filters?.startYear ?? '--'}-${props.filters?.endYear ?? '--'}`
));

const selectedPointText = computed(() => {
    const lat = Number(props.selectedPoint?.lat);
    const lon = Number(props.selectedPoint?.lon ?? props.selectedPoint?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return '--';
    }

    return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
});

const formatMetric = (value, digits = 1) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return '--';
    }

    return Number(value).toFixed(Number(digits));
};

const hasTrendData = computed(() => (props.records || []).some((record) => (
    record?.hasWind || record?.hasWave || record?.hasCurrent
)));

const hasMetricValue = (value) => (
    value !== null
    && value !== undefined
    && value !== ''
    && Number.isFinite(Number(value))
);

const compactMetricRowClass = (count) => (
    count === 1
        ? 'compact-metric-row--one'
        : count === 2
            ? 'compact-metric-row--two'
            : 'compact-metric-row--three'
);

const getPeakValue = (field) => {
    const peak = (props.records || []).reduce((best, record) => {
        const rawValue = record?.[field];
        const value = Number(rawValue);
        return hasMetricValue(rawValue) && (best === null || value > best)
            ? value
            : best;
    }, null);

    return peak;
};

const compactSummaryCards = computed(() => {
    const maxWind = getPeakValue('windSpeed');
    const maxWave = getPeakValue('waveHeight');
    const maxCurrent = getPeakValue('currentSpeed');

    return [
        maxWind === null ? null : { label: '最高风速', value: `${formatMetric(maxWind, 1)} m/s` },
        maxWave === null ? null : { label: '最高浪高', value: `${formatMetric(maxWave, 2)} m` },
        maxCurrent === null ? null : { label: '最高流速', value: `${formatMetric(maxCurrent, 2)} m/s` }
    ].filter(Boolean);
});

const compactDetailCards = computed(() => {
    const record = props.selectedRecord || {};
    const windValues = [
        hasMetricValue(record.windSpeed) ? `${formatMetric(record.windSpeed, 1)} m/s` : '',
        hasMetricValue(record.gust) ? `${formatMetric(record.gust, 1)} m/s` : ''
    ].filter(Boolean);
    const waveValues = [
        hasMetricValue(record.waveHeight) ? `${formatMetric(record.waveHeight, 2)} m` : '',
        hasMetricValue(record.wavePeriod) ? `${formatMetric(record.wavePeriod, 1)} s` : ''
    ].filter(Boolean);

    return [
        windValues.length ? { label: '风速 / 阵风', value: windValues.join(' · ') } : null,
        waveValues.length ? { label: '浪高 / 周期', value: waveValues.join(' · ') } : null,
        hasMetricValue(record.currentSpeed)
            ? { label: '流速', value: `${formatMetric(record.currentSpeed, 2)} m/s` }
            : null
    ].filter(Boolean);
});

const createEmptyGraphic = (text) => [
    {
        type: 'text',
        left: 'center',
        top: 'middle',
        style: {
            text,
            fill: '#94a3b8',
            fontSize: 18,
            fontWeight: 600
        }
    }
];

const getTrendChart = async () => {
    await nextTick();

    if (!trendChartRef.value) {
        return null;
    }

    if (!trendChart || trendChart.getDom() !== trendChartRef.value) {
        trendChart?.dispose();
        trendChart = echarts.init(trendChartRef.value);
    }

    return trendChart;
};

const getDetailChart = async () => {
    await nextTick();

    if (!detailChartRef.value) {
        return null;
    }

    if (!detailChart || detailChart.getDom() !== detailChartRef.value) {
        detailChart?.dispose();
        detailChart = echarts.init(detailChartRef.value);
    }

    return detailChart;
};

const lineSeries = (name, records, field, color, yAxisIndex = 0, type = 'solid') => ({
    name,
    type: 'line',
    smooth: true,
    connectNulls: false,
    symbolSize: 4,
    yAxisIndex,
    data: records.map((record) => record[field] ?? null),
    lineStyle: { color, width: 2.5, type },
    itemStyle: { color }
});

const buildTrendSeries = (records) => {
    const type = props.filters?.dataType || 'all';

    if (type === 'wind') {
        return [
            lineSeries('风速', records, 'windSpeed', '#22d3ee'),
            lineSeries('阵风', records, 'gust', '#f59e0b', 0, 'dashed')
        ];
    }

    if (type === 'wave') {
        return [
            lineSeries('浪高', records, 'waveHeight', '#38bdf8'),
            lineSeries('浪周期', records, 'wavePeriod', '#facc15', 1)
        ];
    }

    if (type === 'current') {
        return [
            lineSeries('流速', records, 'currentSpeed', '#a78bfa')
        ];
    }

    return [
        lineSeries('风速', records, 'windSpeed', '#22d3ee'),
        lineSeries('浪高', records, 'waveHeight', '#38bdf8', 1),
        lineSeries('流速', records, 'currentSpeed', '#a78bfa')
    ];
};

const getYAxis = () => {
    const type = props.filters?.dataType || 'all';
    if (type === 'wave') {
        return [
            {
                type: 'value',
                name: '浪高 m',
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: { color: '#f8fafc', fontSize: 11 },
                splitLine: { lineStyle: { color: 'rgba(71, 85, 105, 0.55)' } }
            },
            {
                type: 'value',
                name: '周期 s',
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: { color: '#f8fafc', fontSize: 11 },
                splitLine: { show: false }
            }
        ];
    }

    return [
        {
            type: 'value',
            name: 'm/s',
            axisLine: { lineStyle: { color: '#334155' } },
            axisLabel: { color: '#f8fafc', fontSize: 11 },
            splitLine: { lineStyle: { color: 'rgba(71, 85, 105, 0.55)' } }
        },
        {
            type: 'value',
            name: 'm',
            axisLine: { lineStyle: { color: '#334155' } },
            axisLabel: { color: '#f8fafc', fontSize: 11 },
            splitLine: { show: false }
        }
    ];
};

const renderTrendChart = async () => {
    if (!props.show) {
        return;
    }

    const chart = await getTrendChart();
    if (!chart) {
        return;
    }

    const records = props.records || [];
    const series = buildTrendSeries(records);

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
            data: series.map((item) => item.name)
        },
        grid: {
            top: 42,
            left: 44,
            right: 44,
            bottom: 42
        },
        xAxis: {
            type: 'category',
            data: records.map((record) => record.monthLabel || record.key),
            axisLine: { lineStyle: { color: '#334155' } },
            axisLabel: {
                color: '#f8fafc',
                fontSize: 11,
                hideOverlap: true
            }
        },
        yAxis: getYAxis(),
        graphic: hasTrendData.value ? [] : createEmptyGraphic('暂无历史海况趋势'),
        series
    }, true);
};

const buildDetailEntries = () => {
    const record = props.selectedRecord || {};
    return [
        { label: '风速', value: record.windSpeed, unit: 'm/s', color: '#22d3ee' },
        { label: '阵风', value: record.gust, unit: 'm/s', color: '#f59e0b' },
        { label: '浪高', value: record.waveHeight, unit: 'm', color: '#38bdf8' },
        { label: '周期', value: record.wavePeriod, unit: 's', color: '#facc15' },
        { label: '流速', value: record.currentSpeed, unit: 'm/s', color: '#a78bfa' }
    ];
};

const renderDetailChart = async () => {
    if (!props.show || !props.selectedRecord) {
        return;
    }

    const chart = await getDetailChart();
    if (!chart) {
        return;
    }

    const entries = buildDetailEntries();
    const hasValue = entries.some((entry) => entry.value !== null && entry.value !== undefined);

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
            textStyle: { color: '#f8fafc', fontFamily: 'Noto Sans SC', fontWeight: 700 },
            formatter: (params) => {
                const item = entries[params?.[0]?.dataIndex];
                if (!item) return '';
                return `${item.label}<br/>${formatMetric(item.value, item.unit === 'm' || item.unit === 'm/s' ? 2 : 1)} ${item.unit}`;
            }
        },
        grid: {
            top: 24,
            left: 42,
            right: 18,
            bottom: 36
        },
        xAxis: {
            type: 'category',
            data: entries.map((entry) => entry.label),
            axisLine: { lineStyle: { color: '#334155' } },
            axisLabel: { color: '#f8fafc', fontSize: 12 }
        },
        yAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: '#334155' } },
            axisLabel: { color: '#f8fafc', fontSize: 11 },
            splitLine: { lineStyle: { color: 'rgba(71, 85, 105, 0.55)' } }
        },
        graphic: hasValue ? [] : createEmptyGraphic('该月暂无可展示指标'),
        series: [
            {
                name: '月度指标',
                type: 'bar',
                barMaxWidth: 30,
                data: entries.map((entry) => ({
                    value: entry.value ?? null,
                    itemStyle: {
                        color: entry.color,
                        borderRadius: [3, 3, 0, 0]
                    }
                })),
                label: {
                    show: true,
                    position: 'top',
                    color: '#f8fafc',
                    fontSize: 11,
                    fontWeight: 800,
                    formatter: ({ value }) => (value === null || value === undefined ? '' : Number(value).toFixed(1))
                }
            }
        ]
    }, true);
};

const resizeCharts = () => {
    trendChart?.resize();
    detailChart?.resize();
};

const disposeCharts = () => {
    trendChart?.dispose();
    detailChart?.dispose();
    trendChart = null;
    detailChart = null;
};

watch(
    () => [props.show, props.records, props.filters?.dataType],
    async ([show]) => {
        if (!show) {
            trendChart?.dispose();
            trendChart = null;
            return;
        }

        await renderTrendChart();
    },
    { deep: true }
);

watch(
    () => [props.show, props.selectedRecord],
    async ([show, selectedRecord]) => {
        if (!show || !selectedRecord) {
            detailChart?.dispose();
            detailChart = null;
            return;
        }

        await renderDetailChart();
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

.history-workspace-divider {
    height: 1px;
    flex: 0 0 auto;
    background: linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.62), transparent);
    box-shadow: 0 0 12px rgba(34, 211, 238, 0.18);
}

.window-legend {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 18px;
    color: #cbd5e1;
    font-size: 12px;
    font-weight: 700;
}

.window-legend span {
    display: flex;
    align-items: center;
    gap: 6px;
}

.window-color {
    display: inline-block;
    width: 10px;
    height: 10px;
}

.window-color-wind {
    background: #22d3ee;
}

.window-color-wave {
    background: #38bdf8;
}

.window-color-current {
    background: #a78bfa;
}

.compact-metric-row {
    display: grid;
    flex: 0 0 68px;
    gap: 6px;
}

.compact-metric-row--one {
    grid-template-columns: minmax(0, 1fr);
}

.compact-metric-row--two {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

.compact-metric-row--three {
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

.compact-metric-card {
    display: flex;
    flex-direction: column;
    min-width: 0;
    align-items: flex-start;
    justify-content: center;
    gap: 5px;
    border: 1px solid rgba(71, 85, 105, 0.72);
    border-radius: 4px;
    background: rgba(8, 15, 28, 0.68);
    padding: 7px 10px;
}

.compact-metric-card span,
.compact-metric-card strong {
    max-width: 100%;
    overflow-wrap: anywhere;
    word-break: break-word;
}

.compact-metric-card span {
    color: #94a3b8;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.2;
}

.compact-metric-card strong {
    color: #f8fafc;
    font-size: 14px;
    font-weight: 800;
    line-height: 1.2;
}

.chart-box,
.loading-box,
.empty-box {
    border-radius: 4px;
}

.chart-box,
.loading-box,
.empty-box {
    border: 1px solid rgba(71, 85, 105, 0.72);
    background: rgba(8, 15, 28, 0.68);
}

.loading-box,
.empty-box {
    padding: 14px;
    text-align: center;
    color: #94a3b8;
    font-size: 16px;
}

.warning-box {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(250, 204, 21, 0.34);
    border-radius: 4px;
    background: rgba(71, 52, 12, 0.36);
    padding: 14px;
    color: #fde68a;
    font-size: 14px;
    line-height: 1.7;
    text-align: center;
}

</style>
