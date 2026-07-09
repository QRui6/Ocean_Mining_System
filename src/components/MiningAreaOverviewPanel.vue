<template>
    <transition name="slide-in" @after-enter="handleAfterEnter">
        <div
            v-if="show && area"
            class="absolute z-40 w-[26rem] max-h-[32rem] pointer-events-auto font-['Noto_Sans_SC']"
            :style="panelStyle"
        >
            <div class="tech-panel-enhanced relative flex max-h-[32rem] flex-col overflow-hidden p-4">
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>

                <div class="mb-3 flex items-center justify-between border-b border-cyan-500/30 pb-3">
                    <div class="flex items-center gap-3">
                        <div class="h-5 w-1.5 bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>
                        <div>
                            <h3 class="text-lg font-bold tracking-wider text-white">矿区总览</h3>
                        </div>
                    </div>
                    <button
                        @click="$emit('close')"
                        class="h-8 w-8 rounded-sm border border-cyan-500/40 text-cyan-200 transition-colors hover:bg-cyan-500 hover:text-slate-950"
                    >
                        ✕
                    </button>
                </div>

                <div v-if="loading" class="flex-1 py-12 text-center text-slate-400">
                    <div class="inline-block w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
                    <div class="mt-4">正在加载矿区总览...</div>
                </div>

                <div v-else class="custom-scrollbar flex-1 space-y-3 overflow-y-auto pr-1.5">
                    <div class="rounded-sm border border-cyan-500/20 bg-slate-900/55 p-3">
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <div class="text-base font-bold text-white">{{ area.name || area.contractor }}</div>
                                <div class="text-xs text-slate-400 mt-1">{{ area.id }}</div>
                            </div>
                            <button
                                @click="$emit('addMonitoring', area)"
                                class="rounded-sm bg-gradient-to-r from-cyan-600 to-cyan-500 px-2.5 py-1.5 text-xs font-bold text-white transition-all hover:from-cyan-500 hover:to-cyan-400"
                            >
                                加入气象监测
                            </button>
                        </div>

                        <div class="mt-3 grid grid-cols-2 gap-2.5 text-sm">
                            <div class="data-card">
                                <span class="label">承包者</span>
                                <span class="value">{{ area.contractor || '未知' }}</span>
                            </div>
                            <div class="data-card">
                                <span class="label">担保国</span>
                                <span class="value">{{ area.sponsor || '未知' }}</span>
                            </div>
                            <div class="data-card">
                                <span class="label">矿种类型</span>
                                <span class="value">{{ area.mineral || '未知' }}</span>
                            </div>
                            <div class="data-card">
                                <span class="label">矿区面积</span>
                                <span class="value">{{ area.areaSize || area.area || '未知' }}</span>
                            </div>
                            <div class="data-card col-span-2">
                                <span class="label">矿区位置</span>
                                <span class="value">{{ area.location || '未知' }}</span>
                            </div>
                            <div class="data-card col-span-2">
                                <span class="label">合同期限</span>
                                <span class="value">{{ area.dateRange || '未知' }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-3 gap-3">
                        <div
                            v-for="card in depthCards"
                            :key="card.label"
                            class="metric-card"
                        >
                            <div class="metric-label">{{ card.label }}</div>
                            <div class="metric-value">{{ formatDepth(card.value) }}</div>
                            <div class="metric-note">{{ area.waterDepth?.unit || 'm' }}</div>
                        </div>
                    </div>

                    <div :class="['decision-card', getDecisionToneClass(areaDecision.tone)]">
                        <div class="mb-3 flex items-start justify-between gap-3">
                            <div class="min-w-0">
                                <div class="section-title">作业辅助决策</div>
                                <div class="mt-2 text-lg font-black text-white">{{ areaDecision.title }}</div>
                            </div>
                            <span class="decision-level">{{ areaDecision.shortTitle }}</span>
                        </div>
                        <div class="decision-summary">{{ areaDecision.summary }}</div>
                        <div class="mt-3 grid grid-cols-2 gap-2">
                            <div
                                v-for="item in areaDecision.metrics"
                                :key="item.label"
                                class="decision-metric"
                            >
                                <span>{{ item.label }}</span>
                                <strong>{{ item.value }}</strong>
                            </div>
                        </div>
                        <div class="mt-3 grid grid-cols-2 gap-2">
                            <div class="decision-metric">
                                <span>继续作业</span>
                                <strong>{{ areaDecision.canContinueOperation ? '可以' : '暂不建议' }}</strong>
                            </div>
                            <div class="decision-metric">
                                <span>管道撤收</span>
                                <strong>{{ areaDecision.needRecoverPipeline ? '需要关注' : '暂无结论' }}</strong>
                            </div>
                        </div>
                    </div>

                    <div class="rounded-sm border border-cyan-500/20 bg-slate-900/55 p-3">
                        <div class="mb-2 flex items-center justify-between gap-2">
                            <div class="text-cyan-300 font-bold">风浪流历史趋势</div>
                        </div>
                        <div ref="chartRef" class="h-52 w-full"></div>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onUpdated, ref, watch } from 'vue';
import * as echarts from 'echarts';
import {
    buildMiningOverviewDecision,
    getDecisionToneClass
} from '../utils/operationRiskDecisionService.js';

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    loading: {
        type: Boolean,
        default: false
    },
    area: {
        type: Object,
        default: null
    },
    panelPosition: {
        type: Object,
        default: null
    }
});

defineEmits(['close', 'addMonitoring']);

const chartRef = ref(null);
let chartInstance = null;
let chartRenderTimer = null;

const CHART_POINT_COUNT = 12;

const panelStyle = computed(() => ({
    left: `${props.panelPosition?.left ?? 1268}px`,
    top: `${props.panelPosition?.top ?? 244}px`
}));
const areaDecision = computed(() => buildMiningOverviewDecision(props.area || {}));
const depthCards = computed(() => {
    const waterDepth = props.area?.waterDepth || {};
    const hasPointDepth = waterDepth.point !== null && waterDepth.point !== undefined;

    if (hasPointDepth) {
        return [
            { label: '站点水深', value: waterDepth.point },
            { label: '区域最浅', value: waterDepth.min },
            { label: '区域最深', value: waterDepth.max }
        ];
    }

    return [
        { label: '平均水深', value: waterDepth.average },
        { label: '最浅水深', value: waterDepth.min },
        { label: '最深水深', value: waterDepth.max }
    ];
});

const createFallbackTimeline = () => {
    const now = new Date();
    return Array.from({ length: CHART_POINT_COUNT }, (_, index) => {
        const pointTime = new Date(now);
        pointTime.setMonth(now.getMonth() - (CHART_POINT_COUNT - index - 1));
        return `${pointTime.getFullYear()}-${String(pointTime.getMonth() + 1).padStart(2, '0')}`;
    });
};

const buildChartSeries = (historical = {}) => {
    const timestamps = Array.isArray(historical.timestamps) && historical.timestamps.length
        ? historical.timestamps
        : createFallbackTimeline();

    const alignSeries = (values) => {
        if (!Array.isArray(values) || !values.length) {
            return timestamps.map(() => null);
        }

        if (values.length === timestamps.length) {
            return values;
        }

        const normalizedValues = values.slice(-timestamps.length);
        if (normalizedValues.length === timestamps.length) {
            return normalizedValues;
        }

        return [
            ...Array.from({ length: timestamps.length - normalizedValues.length }, () => null),
            ...normalizedValues
        ];
    };

    return {
        timestamps,
        windSpeed: alignSeries(historical.windSpeed),
        waveHeight: alignSeries(historical.waveHeight),
        currentSpeed: alignSeries(historical.currentSpeed),
        unitMap: historical.unitMap || {}
    };
};

const chartSeries = computed(() => buildChartSeries(props.area?.historical || {}));

const hasHistoricalValues = computed(() => (
    [chartSeries.value.windSpeed, chartSeries.value.waveHeight, chartSeries.value.currentSpeed]
        .some((series) => series.some((value) => value !== null && value !== undefined))
));

const formatDepth = (value) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '--';
    }

    return Number(value).toFixed(0);
};

const formatTimelineLabel = (value) => {
    if (!value) {
        return '--';
    }

    if (/^\d{4}-\d{2}$/.test(String(value))) {
        return String(value).slice(5, 7);
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value).slice(5, 10).replace('-', '/') || String(value);
    }

    return `${date.getMonth() + 1}/${date.getDate()}`;
};

const buildChartOption = () => {
    const historical = chartSeries.value;
    const timestamps = historical.timestamps;
    const windSpeed = historical.windSpeed;
    const waveHeight = historical.waveHeight;
    const currentSpeed = historical.currentSpeed;
    const unitMap = historical.unitMap || {};

    return {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: '#22d3ee',
            textStyle: { color: '#f8fafc' }
        },
        legend: {
            top: 6,
            textStyle: { color: '#cbd5e1' },
            data: ['历史风速', '历史浪高', '历史流速']
        },
        grid: {
            top: 42,
            left: 36,
            right: 30,
            bottom: 36
        },
        xAxis: {
            type: 'category',
            data: timestamps.map((time) => formatTimelineLabel(time)),
            axisLine: { lineStyle: { color: '#334155' } },
            axisLabel: { color: '#94a3b8' }
        },
        yAxis: [
            {
                type: 'value',
                name: unitMap.windSpeed || 'm/s',
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: { color: '#94a3b8' },
                splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.45)' } }
            },
            {
                type: 'value',
                name: unitMap.waveHeight || 'm',
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: { color: '#94a3b8' },
                splitLine: { show: false }
            }
        ],
        graphic: !hasHistoricalValues.value
            ? [
                {
                    type: 'text',
                    left: 'center',
                    top: 'middle',
                    style: {
                        text: '暂无历史数据',
                        fill: '#64748b',
                        fontSize: 20,
                        fontWeight: 600
                    }
                }
            ]
            : [],
        series: [
            {
                name: '历史风速',
                type: 'line',
                smooth: true,
                connectNulls: false,
                symbolSize: 7,
                data: windSpeed,
                lineStyle: { color: '#22d3ee', width: 2 },
                itemStyle: { color: '#22d3ee' }
            },
            {
                name: '历史浪高',
                type: 'line',
                smooth: true,
                yAxisIndex: 1,
                connectNulls: false,
                symbolSize: 7,
                data: waveHeight,
                lineStyle: { color: '#38bdf8', width: 2 },
                itemStyle: { color: '#38bdf8' }
            },
            {
                name: '历史流速',
                type: 'line',
                smooth: true,
                connectNulls: false,
                symbolSize: 7,
                data: currentSpeed,
                lineStyle: { color: '#a78bfa', width: 2 },
                itemStyle: { color: '#a78bfa' }
            }
        ]
    };
};

const waitForAnimationFrame = () => new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
});

const renderChart = async (allowReinit = true) => {
    if (!props.show || props.loading || !props.area) {
        disposeChart();
        return;
    }

    if (!chartRef.value) {
        return;
    }

    await nextTick();
    await waitForAnimationFrame();

    if (!chartRef.value?.clientWidth || !chartRef.value?.clientHeight) {
        scheduleChartRender(120);
        return;
    }

    chartInstance = echarts.getInstanceByDom(chartRef.value) || chartInstance;
    if (!chartInstance) {
        chartInstance = echarts.init(chartRef.value);
    }

    chartInstance.setOption(buildChartOption(), true);

    chartInstance.resize();
    await waitForAnimationFrame();
    chartInstance?.resize();

    const hasCanvas = Boolean(chartRef.value?.querySelector('canvas'));
    if (!hasCanvas && allowReinit) {
        chartInstance?.dispose();
        chartInstance = null;
        await nextTick();
        await renderChart(false);
    }
};

const clearChartRenderTimer = () => {
    if (chartRenderTimer !== null) {
        window.clearTimeout(chartRenderTimer);
        chartRenderTimer = null;
    }
};

const scheduleChartRender = (delay = 60) => {
    clearChartRenderTimer();

    if (!props.show || props.loading || !props.area) {
        return;
    }

    chartRenderTimer = window.setTimeout(async () => {
        chartRenderTimer = null;
        await renderChart();
    }, delay);
};

const handleAfterEnter = () => {
    scheduleChartRender(0);
};

const disposeChart = () => {
    clearChartRenderTimer();
    if (chartInstance) {
        chartInstance.dispose();
        chartInstance = null;
    }
};

watch(
    () => [
        props.show,
        props.loading,
        props.area?.id,
        props.area?.historical?.timestamps?.join('|') || '',
        props.area?.historical?.windSpeed?.join('|') || '',
        props.area?.historical?.waveHeight?.join('|') || '',
        props.area?.historical?.currentSpeed?.join('|') || ''
    ],
    async ([show]) => {
        if (!show) {
            disposeChart();
            return;
        }

        scheduleChartRender();
    },
    { flush: 'post' }
);

onUpdated(() => {
    if (props.show && !props.loading && props.area) {
        scheduleChartRender(0);
    }
});

onBeforeUnmount(() => {
    disposeChart();
});
</script>

<style scoped>
.slide-in-enter-active,
.slide-in-leave-active {
    transition: all 0.28s ease;
}

.slide-in-enter-from,
.slide-in-leave-to {
    opacity: 0;
    transform: translate3d(12px, -8px, 0) scale(0.98);
}

.tech-panel-enhanced {
    background: linear-gradient(140deg, rgba(15, 23, 42, 0.96) 0%, rgba(17, 24, 39, 0.96) 100%);
    backdrop-filter: blur(14px);
    border: 1px solid rgba(34, 211, 238, 0.28);
    box-shadow:
        0 0 28px rgba(34, 211, 238, 0.08),
        inset 0 0 24px rgba(34, 211, 238, 0.04);
}

.data-card {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 9px 10px;
    border-radius: 4px;
    background: rgba(15, 23, 42, 0.65);
    border: 1px solid rgba(71, 85, 105, 0.45);
}

.label {
    color: #7dd3fc;
}

.value {
    color: #f8fafc;
    text-align: right;
    font-weight: 700;
    max-width: 62%;
    word-break: break-word;
}

.metric-card {
    padding: 12px 10px;
    border-radius: 4px;
    background: rgba(15, 23, 42, 0.72);
    border: 1px solid rgba(56, 189, 248, 0.15);
    text-align: center;
}

.metric-label {
    color: #94a3b8;
    font-size: 12px;
}

.metric-value {
    color: #f8fafc;
    font-size: 24px;
    font-weight: 700;
    margin-top: 6px;
}

.metric-note {
    color: #38bdf8;
    font-size: 12px;
    margin-top: 4px;
}

.section-title {
    display: flex;
    align-items: center;
    color: #22d3ee;
    font-size: 15px;
    font-weight: 800;
}

.section-title::before {
    content: '';
    width: 6px;
    height: 6px;
    margin-right: 10px;
    border-radius: 999px;
    background: #22d3ee;
}

.decision-card {
    border: 1px solid rgba(51, 65, 85, 0.72);
    border-radius: 2px;
    background: rgba(15, 23, 42, 0.55);
    padding: 12px;
}

.decision-level {
    flex: 0 0 auto;
    border: 1px solid currentColor;
    padding: 3px 8px;
    color: #facc15;
    font-size: 12px;
    font-weight: 800;
}

.decision-summary {
    color: #cbd5e1;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.55;
}

.decision-metric,
.missing-data-row {
    min-width: 0;
    border: 1px solid rgba(71, 85, 105, 0.55);
    border-radius: 2px;
    background: rgba(2, 6, 23, 0.26);
    padding: 9px 10px;
}

.decision-metric span {
    display: block;
    color: #93c5fd;
    font-size: 12px;
    font-weight: 800;
}

.decision-metric strong {
    display: block;
    margin-top: 4px;
    overflow: hidden;
    color: #ffffff;
    font-size: 14px;
    font-weight: 900;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.4);
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(34, 211, 238, 0.4);
    border-radius: 999px;
}
</style>
