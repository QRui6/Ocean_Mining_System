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
                                <div class="text-[22px] font-bold tracking-wide text-white">历史台风窗口</div>
                            </div>
                        </div>
                        <div class="ml-auto text-right text-[15px] text-slate-200">
                            <div>{{ selectedAreaTitle }}</div>
                            <div class="mt-1 text-slate-300">年份 {{ selectedYearRange }}</div>
                        </div>
                        <button
                            class="floating-panel-close-btn floating-panel-close-btn--inline"
                            type="button"
                            title="关闭历史台风查询"
                            aria-label="关闭历史台风查询"
                            @click="emit('close')"
                        >
                            ✕
                        </button>
                    </div>

                    <div v-if="loadingWindow" class="flex h-[calc(100%-4rem)] items-center justify-center text-slate-300">
                        <div class="flex items-center gap-3">
                            <span class="inline-block h-8 w-8 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></span>
                            <span class="text-base">正在加载历史台风统计...</span>
                        </div>
                    </div>

                    <div v-else-if="windowErrorMessage" class="min-h-0 flex-1 p-4">
                        <div class="warning-box h-full">{{ windowErrorMessage }}</div>
                    </div>

                    <div v-else class="min-h-0 flex-1 p-4">
                        <div class="flex h-full flex-col gap-3">
                            <div class="window-summary-grid">
                                <div
                                    v-for="item in windowSummaryCards"
                                    :key="item.label"
                                    class="window-summary-card"
                                >
                                    <span>{{ item.label }}</span>
                                    <strong>{{ item.value }}</strong>
                                    <em>{{ item.note }}</em>
                                </div>
                            </div>
                            <div ref="windowChartRef" class="chart-box min-h-0 flex-1"></div>
                            <div class="window-legend">
                                <span><i class="window-color window-color-active"></i>历史集中窗口</span>
                                <span><i class="window-color window-color-normal"></i>其他月份</span>
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
                                <div class="text-[22px] font-bold tracking-wide text-white">当前台风过程</div>
                            </div>
                        </div>
                        <div class="text-right text-[15px] text-slate-200">
                            <div>{{ selectedEvent?.name || '未选择台风' }}</div>
                            <div class="mt-1 text-slate-300">{{ selectedEvent?.sid || '--' }}</div>
                        </div>
                    </div>

                    <div v-if="errorMessage" class="flex h-[calc(100%-4rem)] items-center justify-center px-8">
                        <div class="warning-box w-full">{{ errorMessage }}</div>
                    </div>

                    <div v-else-if="!selectedEvent" class="flex h-[calc(100%-4rem)] items-center justify-center px-8 text-center">
                        <div>
                            <div class="text-xl font-bold text-slate-100">未选择台风</div>
                            <div class="mt-2 text-base text-slate-300">点击左侧历史台风列表后显示过程图</div>
                        </div>
                    </div>

                    <div v-else class="min-h-0 flex-1 p-4">
                        <div v-if="loadingTrack" class="loading-box h-full">正在加载台风轨迹...</div>
                        <div v-else-if="!selectedTrack?.points?.length" class="empty-box h-full">当前台风暂无轨迹数据</div>
                        <div v-else class="flex h-full flex-col gap-3">
                            <div class="grid grid-cols-3 gap-3">
                                <div
                                    v-for="item in trackSummaryCards"
                                    :key="item.label"
                                    class="info-card"
                                >
                                    <span class="info-label">{{ item.label }}</span>
                                    <span class="info-value">{{ item.value }}</span>
                                </div>
                            </div>
                            <div ref="trackChartRef" class="chart-box min-h-0 flex-1"></div>
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
    loadingTrack: {
        type: Boolean,
        default: false
    },
    loadingWindow: {
        type: Boolean,
        default: false
    },
    selectedArea: {
        type: Object,
        default: null
    },
    summary: {
        type: Object,
        default: null
    },
    yearlyStats: {
        type: Array,
        default: () => []
    },
    windowStats: {
        type: Object,
        default: null
    },
    selectedEvent: {
        type: Object,
        default: null
    },
    selectedTrack: {
        type: Object,
        default: null
    },
    filters: {
        type: Object,
        default: () => ({
            startYear: 2000,
            endYear: new Date().getFullYear()
        })
    },
    errorMessage: {
        type: String,
        default: ''
    },
    windowErrorMessage: {
        type: String,
        default: ''
    }
});

const windowChartRef = ref(null);
const trackChartRef = ref(null);

let windowChart = null;
let trackChart = null;

const selectedAreaTitle = computed(() => (
    props.selectedArea?.regionName
    || props.selectedArea?.regionCode
    || props.selectedArea?.contractor
    || props.selectedArea?.name
    || '--'
));

const selectedYearRange = computed(() => `${props.filters?.startYear ?? '--'}-${props.filters?.endYear ?? '--'}`);
const hasDistanceSeries = computed(() => (
    (props.selectedTrack?.points || []).some((point) => Number.isFinite(Number(point.distanceToAreaKm)))
));

const windowSummaryCards = computed(() => [
    {
        label: '主要窗口',
        value: props.windowStats?.windowLabel || '--',
        note: '历史集中月份'
    },
    {
        label: '高峰月份',
        value: props.windowStats?.peakMonthLabel || '--',
        note: `${props.windowStats?.peakCount || 0} 次影响`
    },
    {
        label: '窗口内影响',
        value: `${props.windowStats?.windowCount || 0} 次`,
        note: `共 ${props.windowStats?.totalCount || 0} 次`
    }
]);

const formatMetric = (value, digits = 0) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return '--';
    }

    return Number(value).toFixed(Number(digits));
};

const formatDistance = (value) => (
    value === null || value === undefined || Number.isNaN(Number(value))
        ? '--'
        : `${formatMetric(value, 0)} km`
);

const formatTime = (value) => {
    if (!value) {
        return '--';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
};

const trackSummaryCards = computed(() => {
    const points = props.selectedTrack?.points || [];
    const inBufferPoints = points.filter((point) => point.inBuffer);
    const closestPoint = points.reduce((best, point) => {
        const distance = Number(point.distanceToAreaKm);
        if (!Number.isFinite(distance)) {
            return best;
        }

        if (!best || distance < best.distance) {
            return {
                point,
                distance
            };
        }

        return best;
    }, null);

    return [
        {
            label: '进入影响',
            value: formatTime(props.selectedEvent?.influenceStart || inBufferPoints[0]?.time)
        },
        {
            label: '区域最近距离',
            value: closestPoint
                ? formatDistance(closestPoint.distance)
                : formatDistance(props.selectedEvent?.minDistanceKm)
        },
        {
            label: '离开影响',
            value: formatTime(props.selectedEvent?.influenceEnd || inBufferPoints[inBufferPoints.length - 1]?.time)
        }
    ];
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

const getWindowChart = async () => {
    await nextTick();

    if (!windowChartRef.value) {
        return null;
    }

    if (!windowChart || windowChart.getDom() !== windowChartRef.value) {
        windowChart?.dispose();
        windowChart = echarts.init(windowChartRef.value);
    }

    return windowChart;
};

const getTrackChart = async () => {
    await nextTick();

    if (!trackChartRef.value) {
        return null;
    }

    if (!trackChart || trackChart.getDom() !== trackChartRef.value) {
        trackChart?.dispose();
        trackChart = echarts.init(trackChartRef.value);
    }

    return trackChart;
};

const renderWindowChart = async () => {
    if (!props.show) {
        return;
    }

    const chart = await getWindowChart();
    if (!chart) {
        return;
    }

    const monthCounts = props.windowStats?.monthCounts || [];

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
            textStyle: { color: '#f8fafc', fontFamily: 'Noto Sans SC', fontWeight: 700 },
            formatter: (params) => {
                const item = monthCounts[params?.[0]?.dataIndex];
                if (!item) return '';

                const windowText = item.inWindow
                    ? '<br/><span style="color:#fb923c">历史集中窗口</span>'
                    : '';

                return `${item.label}<br/>历史影响：${item.count} 次${windowText}`;
            }
        },
        grid: {
            top: 24,
            left: 44,
            right: 22,
            bottom: 34
        },
        xAxis: {
            type: 'category',
            data: monthCounts.map((item) => item.label),
            axisLine: { lineStyle: { color: '#334155' } },
            axisLabel: { color: '#f8fafc', fontSize: 11 }
        },
        yAxis: {
            type: 'value',
            minInterval: 1,
            axisLine: { lineStyle: { color: '#334155' } },
            axisLabel: { color: '#f8fafc', fontSize: 11 },
            splitLine: { lineStyle: { color: 'rgba(71, 85, 105, 0.55)' } }
        },
        graphic: props.windowStats?.hasData ? [] : createEmptyGraphic('暂无历史台风窗口统计'),
        series: [
            {
                name: '影响次数',
                type: 'bar',
                barMaxWidth: 22,
                data: monthCounts.map((item) => ({
                    value: item.count,
                    itemStyle: {
                        color: item.inWindow ? '#fb923c' : '#22d3ee',
                        borderRadius: [3, 3, 0, 0]
                    }
                })),
                label: {
                    show: true,
                    position: 'top',
                    color: '#f8fafc',
                    fontSize: 11,
                    fontWeight: 800,
                    formatter: ({ value }) => (Number(value) > 0 ? value : '')
                }
            }
        ]
    }, true);
};

const renderTrackChart = async () => {
    if (!props.show || !props.selectedEvent) {
        return;
    }

    const chart = await getTrackChart();
    if (!chart) {
        return;
    }

    const points = props.selectedTrack?.points || [];
    const timeLabels = points.map((point) => {
        const date = new Date(point.time);
        if (Number.isNaN(date.getTime())) {
            return point.time || '--';
        }
        return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:00`;
    });
    const impactAreas = [];
    let impactStart = null;

    points.forEach((point, index) => {
        if (point.inBuffer && impactStart === null) {
            impactStart = index;
        }

        if ((!point.inBuffer || index === points.length - 1) && impactStart !== null) {
            const endIndex = point.inBuffer && index === points.length - 1 ? index : index - 1;
            impactAreas.push([
                { xAxis: timeLabels[impactStart] },
                { xAxis: timeLabels[Math.max(impactStart, endIndex)] }
            ]);
            impactStart = null;
        }
    });

    const distanceSeries = hasDistanceSeries.value
        ? [
            {
                name: '距离区域',
                type: 'line',
                smooth: true,
                connectNulls: true,
                yAxisIndex: 1,
                symbolSize: 4,
                data: points.map((point) => point.distanceToAreaKm ?? null),
                lineStyle: { color: '#f59e0b', width: 2 },
                itemStyle: { color: '#f59e0b' },
                markLine: {
                    silent: true,
                    symbol: 'none',
                    lineStyle: { color: 'rgba(248, 113, 113, 0.72)', type: 'dashed', width: 1 },
                    label: { color: '#fecaca', formatter: `${props.filters?.bufferKm ?? '--'}km` },
                    data: [{ yAxis: Number(props.filters?.bufferKm) || 0 }]
                },
                markArea: {
                    silent: true,
                    itemStyle: { color: 'rgba(244, 63, 94, 0.12)' },
                    data: impactAreas
                }
            },
            {
                name: '影响圈点位',
                type: 'scatter',
                yAxisIndex: 1,
                symbolSize: 10,
                data: points.map((point) => (point.inBuffer ? point.distanceToAreaKm ?? 0 : null)),
                itemStyle: { color: '#f43f5e' }
            }
        ]
        : [];

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
            data: hasDistanceSeries.value ? ['风速', '距离区域'] : ['风速']
        },
        grid: {
            top: 42,
            left: 44,
            right: hasDistanceSeries.value ? 44 : 22,
            bottom: 46
        },
        xAxis: {
            type: 'category',
            data: timeLabels,
            axisLine: { lineStyle: { color: '#334155' } },
            axisLabel: {
                color: '#f8fafc',
                fontSize: 11,
                hideOverlap: true
            }
        },
        yAxis: [
            {
                type: 'value',
                name: '风速 kt',
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: { color: '#f8fafc', fontSize: 12 },
                splitLine: { lineStyle: { color: 'rgba(71, 85, 105, 0.55)' } }
            },
            ...(hasDistanceSeries.value ? [{
                type: 'value',
                name: '距离 km',
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: { color: '#f8fafc', fontSize: 12 },
                splitLine: { show: false }
            }] : [])
        ],
        graphic: points.length ? [] : createEmptyGraphic('暂无轨迹时间序列'),
        series: [
            {
                name: '风速',
                type: 'line',
                smooth: true,
                connectNulls: true,
                symbolSize: 4,
                data: points.map((point) => point.wmoWind ?? null),
                lineStyle: { color: '#22d3ee', width: 3 },
                itemStyle: { color: '#22d3ee' }
            },
            ...distanceSeries
        ]
    }, true);
};

const resizeCharts = () => {
    windowChart?.resize();
    trackChart?.resize();
};

const disposeCharts = () => {
    windowChart?.dispose();
    trackChart?.dispose();
    windowChart = null;
    trackChart = null;
};

watch(
    () => [props.show, props.windowStats, props.summary],
    async ([show]) => {
        if (!show) {
            windowChart?.dispose();
            windowChart = null;
            return;
        }

        await renderWindowChart();
    },
    { deep: true }
);

watch(
    () => [props.show, props.selectedTrack, props.selectedEvent],
    async ([show, selectedTrack, selectedEvent]) => {
        if (!show || !selectedEvent) {
            trackChart?.dispose();
            trackChart = null;
            return;
        }

        if (!selectedTrack?.points?.length) {
            await renderTrackChart();
            return;
        }

        await renderTrackChart();
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

.section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #22d3ee;
    font-size: 19px;
    font-weight: 700;
}

.section-title::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: #22d3ee;
    box-shadow: 0 0 8px rgba(34, 211, 238, 0.6);
}

.history-workspace-divider {
    height: 1px;
    flex: 0 0 auto;
    background: linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.62), transparent);
    box-shadow: 0 0 12px rgba(34, 211, 238, 0.18);
}

.metric-card,
.detail-card,
.info-card,
.chart-box,
.loading-box,
.empty-box {
    border-radius: 4px;
}

.metric-card {
    border: 1px solid rgba(34, 211, 238, 0.16);
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.82) 0%, rgba(8, 13, 25, 0.95) 100%);
    padding: 12px;
}

.metric-label {
    font-size: 13px;
    color: #aebed2;
}

.metric-value {
    margin-top: 8px;
    font-family: 'Rajdhani', 'Noto Sans SC', sans-serif;
    font-size: 28px;
    font-weight: 700;
    line-height: 1;
}

.metric-unit {
    margin-top: 6px;
    font-size: 12px;
    color: #64748b;
}

.window-summary-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
}

.window-summary-card {
    min-width: 0;
    border: 1px solid rgba(71, 85, 105, 0.78);
    border-radius: 4px;
    background: rgba(15, 23, 42, 0.68);
    padding: 8px 9px;
}

.window-summary-card span,
.window-summary-card em {
    display: block;
    overflow: hidden;
    color: #94a3b8;
    font-size: 11px;
    font-style: normal;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.window-summary-card strong {
    display: block;
    overflow: hidden;
    margin: 4px 0 3px;
    color: #ffffff;
    font-size: 16px;
    font-weight: 800;
    text-overflow: ellipsis;
    white-space: nowrap;
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

.window-color-active {
    background: #fb923c;
}

.window-color-normal {
    background: #22d3ee;
}

.detail-card,
.chart-box,
.loading-box,
.empty-box,
.info-card {
    border: 1px solid rgba(71, 85, 105, 0.72);
    background: rgba(8, 15, 28, 0.68);
}

.detail-card,
.loading-box,
.empty-box {
    padding: 14px;
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

.loading-box,
.empty-box {
    text-align: center;
    color: #94a3b8;
    font-size: 16px;
}

.detail-title {
    color: #94a3b8;
    font-size: 13px;
}

.detail-name {
    margin-top: 4px;
    font-size: 18px;
    font-weight: 700;
    color: #f8fafc;
}

.detail-meta {
    margin-top: 5px;
    color: #67e8f9;
    font-size: 13px;
}

.info-card {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 11px 12px;
}

.info-label {
    color: rgba(147, 197, 253, 0.9);
    font-size: 14px;
}

.info-value {
    max-width: 58%;
    color: #f8fafc;
    font-size: 14px;
    font-weight: 700;
    text-align: right;
    word-break: break-word;
}

.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.45);
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(34, 211, 238, 0.45);
    border-radius: 999px;
}
</style>
