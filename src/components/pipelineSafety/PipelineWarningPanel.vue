<template>
    <div
        v-if="show"
        class="pointer-events-none absolute inset-0 z-40 font-['Noto_Sans_SC']"
    >
        <div
            class="pointer-events-auto absolute bottom-6 left-8 top-36"
            style="width: 28rem;"
        >
            <section
                class="tech-panel-enhanced relative flex h-full w-full min-w-0 flex-col overflow-hidden p-5"
                style="clip-path: polygon(0 0, 100% 0, 100% 95%, 92% 100%, 0 100%);"
            >
                <div class="absolute left-0 top-0 h-[2px] w-full animate-pulse bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                <div class="corner-decoration corner-tl scale-125"></div>
                <div class="corner-decoration corner-tr scale-125"></div>

                <div class="mb-4 flex shrink-0 items-center border-b-2 border-cyan-500/40 pb-3">
                    <div class="mr-3 h-6 w-1.5 bg-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.8)]"></div>
                    <h3 class="min-w-0 flex-1 text-2xl font-bold tracking-wider text-white">管道预警</h3>
                </div>

                <div class="mb-3 grid shrink-0 grid-cols-5 gap-1.5">
                    <button
                        v-for="item in filters"
                        :key="item.value"
                        type="button"
                        :class="[
                            'rounded-sm border px-2 py-1.5 text-sm font-bold transition-all skew-x-[-10deg]',
                            activeFilter === item.value
                                ? 'border-blue-300 bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_0_10px_rgba(37,99,235,0.6)]'
                                : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-cyan-500/50 hover:text-cyan-200'
                        ]"
                        @click="activeFilter = item.value"
                    >
                        <span class="block skew-x-[10deg]">{{ item.label }}</span>
                    </button>
                </div>

                <div class="mb-3 grid shrink-0 grid-cols-2 gap-2">
                    <button class="pipe-btn" type="button" @click="loadWarnings">刷新</button>
                    <button class="pipe-btn secondary" type="button" @click="clearAll">清空</button>
                </div>

                <div class="min-h-0 flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                    <button
                        v-for="item in filteredWarnings"
                        :key="item.id"
                        type="button"
                        :class="[
                            'warning-list-card w-full rounded-sm border px-3 py-3 text-left transition-all',
                            `warning-list-card--${riskTone(item.warningLevel)}`,
                            selectedWarning?.id === item.id ? 'is-selected' : '',
                            item.status === 'resolved' ? 'is-resolved' : ''
                        ]"
                        @click="selectedWarning = item"
                    >
                        <div class="flex items-start justify-between gap-3">
                            <div class="min-w-0">
                                <div class="truncate text-sm font-bold text-white">{{ item.message }}</div>
                                <div class="mt-1 truncate text-xs text-slate-400">{{ item.miningArea }} · {{ formatWarningTime(item.warningTime) }}</div>
                            </div>
                            <span :class="['pipe-risk-tag shrink-0', riskClass(item.warningLevel)]">{{ item.warningLevel }}</span>
                        </div>
                        <div class="mt-2 flex items-center justify-between text-xs text-slate-400">
                            <span>{{ item.operationType }}</span>
                            <span>{{ item.status === 'resolved' ? '已处理' : '待处理' }}</span>
                        </div>
                    </button>

                    <div v-if="!filteredWarnings.length" class="rounded-sm border border-dashed border-slate-700/50 py-6 text-center text-sm text-slate-500">
                        当前无管道预警
                    </div>
                </div>
            </section>
        </div>

        <div
            class="pointer-events-auto absolute bottom-6 top-36"
            style="right: 1.5rem; width: 28rem;"
        >
            <section
                class="tech-panel-enhanced relative flex h-full w-full min-w-0 flex-col overflow-hidden p-5"
                style="clip-path: polygon(0 0, 92% 0, 100% 7%, 100% 100%, 0 100%);"
            >
                <div class="absolute left-0 top-0 h-[2px] w-full animate-pulse bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                <div class="corner-decoration corner-bl scale-125"></div>
                <div class="corner-decoration corner-br scale-125"></div>
                <button
                    class="floating-panel-close-btn"
                    type="button"
                    title="关闭管道预警"
                    aria-label="关闭管道预警"
                    @click="emit('close')"
                >
                    ✕
                </button>

                <div class="mb-3 flex items-center justify-between gap-3 pr-10">
                    <div class="pipe-section-title">预警概览</div>
                    <button
                        v-if="selectedWarning"
                        class="pipe-btn secondary px-3"
                        type="button"
                        @click="toggleResolved(selectedWarning)"
                    >
                        {{ selectedWarning.status === 'resolved' ? '设为待处理' : '标记已处理' }}
                    </button>
                </div>

                <div v-if="selectedWarning" class="warning-dashboard min-h-0 flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <div
                        v-if="selectedWarningDecision"
                        :class="['warning-decision-card', getDecisionToneClass(selectedWarningDecision.tone)]"
                    >
                        <div class="flex items-start justify-between gap-3">
                            <div class="min-w-0">
                                <span>处置结论</span>
                                <strong>{{ selectedWarningDecision.title }}</strong>
                            </div>
                            <em :class="['pipe-risk-tag warning-risk-tag-large shrink-0', riskClass(selectedWarningDecision.level)]">
                                {{ selectedWarningDecision.level }}
                            </em>
                        </div>
                        <div class="warning-decision-subtitle">
                            {{ selectedWarningDecision.canContinueOperation ? '可继续作业' : '不建议继续作业' }} ·
                            {{ selectedWarningDecision.needRecoverPipeline ? (selectedWarningDecision.needImmediateRecovery ? '立即撤收' : '准备撤收') : '暂不撤收' }}
                        </div>
                    </div>

                    <div class="warning-basis-box">
                        <div class="warning-section-head">
                            <div class="pipe-section-title">判断依据</div>
                        </div>
                        <div class="mt-2 space-y-2">
                            <div
                                v-for="row in warningBasisRows"
                                :key="row.label"
                                class="warning-basis-row"
                            >
                                <span>{{ row.label }}</span>
                                <strong>{{ row.value }}</strong>
                            </div>
                        </div>
                    </div>

                    <div class="warning-key-grid">
                        <div><span>矿区</span><strong>{{ selectedWarning.miningArea }}</strong></div>
                        <div><span>管型</span><strong>{{ selectedWarning.pipeSize }}</strong></div>
                        <div><span>海况</span><strong>{{ formatSeaState(selectedWarning) }}</strong></div>
                        <div><span>时次</span><strong>{{ formatWarningTime(selectedWarning.warningTime) }}</strong></div>
                    </div>

                    <div class="pipe-section warning-chart-section">
                        <div class="warning-section-head">
                            <div class="pipe-section-title">风浪流数据</div>
                        </div>
                        <div v-if="hasMetoceanChartData" ref="warningMetoceanChartRef" class="warning-chart"></div>
                        <div v-else class="warning-chart-empty">该条预警暂无可绘制的风浪流数据</div>
                    </div>

                    <div class="pipe-section warning-chart-section">
                        <div class="warning-section-head">
                            <div class="pipe-section-title">综合应力</div>
                        </div>
                        <div v-if="hasStressChartData" ref="warningStressChartRef" class="warning-chart warning-chart--compact"></div>
                        <div v-else class="warning-chart-empty warning-chart-empty--compact">该条预警暂无可绘制的应力数据</div>
                    </div>

                    <div v-if="selectedWarning.matchedScenario" class="warning-scenario-line">
                        参考工况：{{ selectedWarning.matchedScenario }}
                    </div>
                </div>

                <div v-else class="flex min-h-0 flex-1 items-center justify-center rounded-sm border border-dashed border-slate-700/50 text-sm text-slate-500">
                    请选择左侧预警记录
                </div>
            </section>
        </div>
    </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
    buildWarningOperationDecision,
    getDecisionToneClass
} from '../../utils/operationRiskDecisionService.js';
import {
    clearPipelineWarnings,
    getPipelineWarnings,
    updatePipelineWarningStatus
} from '../../utils/pipelineWarningService.js';

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['close']);

const warnings = ref([]);
const selectedWarning = ref(null);
const activeFilter = ref('all');
const warningMetoceanChartRef = ref(null);
const warningStressChartRef = ref(null);
let warningMetoceanChart = null;
let warningStressChart = null;
let chartResizeObserver = null;

const filters = [
    { label: '全部', value: 'all' },
    { label: '绿色', value: '绿色' },
    { label: '黄色', value: '黄色' },
    { label: '橙色', value: '橙色' },
    { label: '红色', value: '红色' }
];

const filteredWarnings = computed(() => warnings.value.filter((item) => {
    if (activeFilter.value === 'all') return true;
    return item.warningLevel === activeFilter.value;
}));

const warningStats = computed(() => {
    const list = warnings.value;
    const countLevel = (level) => list.filter((item) => item.warningLevel === level).length;

    return {
        total: list.length,
        active: list.filter((item) => item.status !== 'resolved').length,
        resolved: list.filter((item) => item.status === 'resolved').length,
        yellow: countLevel('黄色'),
        orange: countLevel('橙色'),
        red: countLevel('红色')
    };
});

const levelPercent = computed(() => ({
    黄色: '38%',
    橙色: '70%',
    红色: '100%'
}[selectedWarning.value?.warningLevel] || '0%'));

const levelSummary = computed(() => ({
    黄色: '加强观察',
    橙色: '暂停新作业',
    红色: '立即处置'
}[selectedWarning.value?.warningLevel] || '暂无风险'));
const selectedWarningDecision = computed(() => (
    selectedWarning.value ? buildWarningOperationDecision(selectedWarning.value) : null
));

const formatMetricValue = (value, digits, unit) => (
    isChartValue(value) ? `${Number(value).toFixed(digits)} ${unit}` : '--'
);

const getWarningSourceText = (warning) => {
    const categoryMap = {
        'current-risk': '当前风险',
        'future-red-risk': '未来窗口',
        'future-orange-risk': '未来窗口',
        'window-unavailable': '安全窗口',
        'selection-risk': '选型评估'
    };

    return [
        warning?.source || '管道评估',
        categoryMap[warning?.category] || warning?.operationType || ''
    ].filter(Boolean).join(' / ');
};

const warningBasisRows = computed(() => {
    const warning = selectedWarning.value || {};
    const decision = selectedWarningDecision.value || {};
    const stressText = `${formatMetricValue(warning.estimatedStress, 1, 'MPa')} / ${formatMetricValue(warning.allowableStress, 1, 'MPa')}`;
    const seaText = [
        formatSeaState(warning),
        isChartValue(warning.waveHeight) ? `浪高 ${Number(warning.waveHeight).toFixed(1)} m` : '',
        isChartValue(warning.windSpeed) ? `风速 ${Number(warning.windSpeed).toFixed(1)} m/s` : ''
    ].filter(Boolean).join(' · ') || '--';

    return [
        {
            label: '预警来源',
            value: getWarningSourceText(warning)
        },
        {
            label: '触发原因',
            value: decision.primaryReason || warning.riskReason || warning.message || '--'
        },
        {
            label: '应力判断',
            value: stressText
        },
        {
            label: '海况数据',
            value: seaText
        },
        {
            label: '匹配工况',
            value: warning.matchedScenario || warning.matchType || '--'
        }
    ];
});

const isChartValue = (value) => (
    value !== null
    && value !== undefined
    && value !== ''
    && Number.isFinite(Number(value))
);

const hasMetoceanChartData = computed(() => (
    [
        selectedWarning.value?.windSpeed,
        selectedWarning.value?.gust,
        selectedWarning.value?.waveHeight,
        selectedWarning.value?.currentSpeed
    ].some(isChartValue)
));

const hasStressChartData = computed(() => (
    [
        selectedWarning.value?.estimatedStress,
        selectedWarning.value?.allowableStress
    ].some(isChartValue)
));

const riskClass = (level) => ({
    绿色: 'pipe-risk-green',
    黄色: 'pipe-risk-yellow',
    橙色: 'pipe-risk-orange',
    红色: 'pipe-risk-red'
}[level] || 'pipe-risk-yellow');

const riskTone = (level) => ({
    绿色: 'green',
    黄色: 'yellow',
    橙色: 'orange',
    红色: 'red'
}[level] || 'yellow');

const formatWarningTime = (value) => value ? String(value).replace('T', ' ').slice(0, 16) : '--';

const formatSeaState = (warning) => (
    warning?.seaState === null || warning?.seaState === undefined
        ? '--'
        : `${warning.seaState}级${warning.seaStateLabel ? ` · ${warning.seaStateLabel}` : ''}`
);

const loadWarnings = () => {
    warnings.value = getPipelineWarnings();
    if (!selectedWarning.value || !warnings.value.some((item) => item.id === selectedWarning.value.id)) {
        selectedWarning.value = filteredWarnings.value[0] || warnings.value[0] || null;
    } else {
        selectedWarning.value = warnings.value.find((item) => item.id === selectedWarning.value.id) || null;
    }
    renderCharts();
};

const toggleResolved = (item) => {
    const nextStatus = item.status === 'resolved' ? 'active' : 'resolved';
    warnings.value = updatePipelineWarningStatus(item.id, nextStatus);
    selectedWarning.value = warnings.value.find((warning) => warning.id === item.id) || null;
    renderCharts();
    ElMessage.success(nextStatus === 'resolved' ? '已标记处理' : '已恢复待处理');
};

const clearAll = async () => {
    try {
        await ElMessageBox.confirm('确认清空全部管道预警？', '清空预警', { type: 'warning' });
    } catch {
        return;
    }

    clearPipelineWarnings();
    loadWarnings();
    ElMessage.success('管道预警已清空');
};

const chartTextStyle = {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: 800
};

const disposeCharts = () => {
    chartResizeObserver?.disconnect();
    warningMetoceanChart?.dispose();
    warningStressChart?.dispose();
    warningMetoceanChart = null;
    warningStressChart = null;
};

const resizeCharts = () => {
    warningMetoceanChart?.resize();
    warningStressChart?.resize();
};

const scheduleResizeCharts = () => {
    requestAnimationFrame(() => {
        requestAnimationFrame(resizeCharts);
    });
};

const observeChartContainers = () => {
    chartResizeObserver?.disconnect();

    if (typeof ResizeObserver === 'undefined') {
        scheduleResizeCharts();
        return;
    }

    chartResizeObserver = new ResizeObserver(scheduleResizeCharts);
    if (warningMetoceanChartRef.value) {
        chartResizeObserver.observe(warningMetoceanChartRef.value);
    }
    if (warningStressChartRef.value) {
        chartResizeObserver.observe(warningStressChartRef.value);
    }
    scheduleResizeCharts();
};

const renderCharts = async () => {
    await nextTick();
    if (!props.show || !selectedWarning.value) {
        disposeCharts();
        return;
    }

    if (!hasMetoceanChartData.value || !warningMetoceanChartRef.value) {
        warningMetoceanChart?.dispose();
        warningMetoceanChart = null;
    } else if (warningMetoceanChart && warningMetoceanChart.getDom() !== warningMetoceanChartRef.value) {
        warningMetoceanChart.dispose();
        warningMetoceanChart = null;
    }

    if (!hasStressChartData.value || !warningStressChartRef.value) {
        warningStressChart?.dispose();
        warningStressChart = null;
    } else if (warningStressChart && warningStressChart.getDom() !== warningStressChartRef.value) {
        warningStressChart.dispose();
        warningStressChart = null;
    }

    const warning = selectedWarning.value || {};
    const metoceanData = [
        { name: '风速', value: warning.windSpeed, unit: 'm/s', itemStyle: { color: '#22d3ee' } },
        { name: '阵风', value: warning.gust, unit: 'm/s', itemStyle: { color: '#f59e0b' } },
        { name: '浪高', value: warning.waveHeight, unit: 'm', itemStyle: { color: '#38bdf8' } },
        { name: '流速', value: warning.currentSpeed, unit: 'm/s', itemStyle: { color: '#a78bfa' } }
    ];

    if (warningMetoceanChartRef.value) {
        warningMetoceanChart = warningMetoceanChart || echarts.init(warningMetoceanChartRef.value);
        warningMetoceanChart.setOption({
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(15,23,42,0.95)',
            borderColor: 'rgba(34,211,238,0.35)',
            textStyle: { color: '#fff' },
            formatter: (items) => items.map((item) => {
                const record = metoceanData[item.dataIndex];
                return `${record.name}: ${record.value ?? '--'} ${record.value === null || record.value === undefined ? '' : record.unit}`;
            }).join('<br/>')
        },
        grid: {
            left: 10,
            right: 14,
            top: 16,
            bottom: 22,
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: metoceanData.map((item) => item.name),
            axisTick: { show: false },
            axisLine: { lineStyle: { color: 'rgba(148,163,184,0.25)' } },
            axisLabel: chartTextStyle
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: 'rgba(148,163,184,0.13)' } },
            axisLabel: { color: '#f8fafc', fontSize: 11, fontWeight: 700 }
        },
        series: [
            {
                type: 'bar',
                barWidth: 32,
                data: metoceanData.map((item) => ({
                    value: item.value,
                    itemStyle: item.itemStyle
                })),
                label: {
                    show: true,
                    position: 'top',
                    color: '#f8fafc',
                    fontSize: 12,
                    fontWeight: 900,
                    formatter: ({ dataIndex }) => metoceanData[dataIndex].value ?? '--'
                }
            }
        ]
        });
    }

    const stressData = [
        { name: '综合应力', value: warning.estimatedStress, itemStyle: { color: '#fb923c' } },
        { name: '许用应力', value: warning.allowableStress, itemStyle: { color: '#22d3ee' } }
    ];

    if (warningStressChartRef.value) {
        warningStressChart = warningStressChart || echarts.init(warningStressChartRef.value);
        warningStressChart.setOption({
        backgroundColor: 'transparent',
        grid: {
            left: 8,
            right: 8,
            top: 20,
            bottom: 24,
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: stressData.map((item) => item.name),
            axisTick: { show: false },
            axisLine: { lineStyle: { color: 'rgba(148,163,184,0.25)' } },
            axisLabel: chartTextStyle
        },
        yAxis: {
            type: 'value',
            minInterval: 1,
            splitLine: { lineStyle: { color: 'rgba(148,163,184,0.13)' } },
            axisLabel: { color: '#f8fafc', fontSize: 11, fontWeight: 700 }
        },
        series: [
            {
                type: 'bar',
                barWidth: 34,
                data: stressData,
                label: {
                    show: true,
                    position: 'top',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 900,
                    formatter: ({ value }) => value === null || value === undefined ? '--' : `${Number(value).toFixed(1)} MPa`
                }
            }
        ]
        });
    }

    observeChartContainers();
};

watch(() => props.show, (visible) => {
    if (visible) {
        loadWarnings();
    } else {
        disposeCharts();
    }
}, { immediate: true });

watch(activeFilter, () => {
    selectedWarning.value = filteredWarnings.value[0] || null;
    renderCharts();
});

watch(
    () => [
        props.show,
        selectedWarning.value?.id,
        warningStats.value.total,
        warningStats.value.active,
        warningStats.value.resolved,
        warningStats.value.yellow,
        warningStats.value.orange,
        warningStats.value.red,
        hasMetoceanChartData.value,
        hasStressChartData.value
    ],
    () => {
        renderCharts();
    },
    { flush: 'post' }
);

onMounted(() => {
    window.addEventListener('resize', resizeCharts);
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', resizeCharts);
    chartResizeObserver?.disconnect();
    disposeCharts();
});
</script>

<style scoped>
.warning-dashboard {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    padding-bottom: 1.65rem;
    scroll-padding-bottom: 1.65rem;
}

.warning-list-card {
    --warning-level-color: #facc15;
    border-color: rgba(51, 65, 85, 0.7);
    background:
        linear-gradient(90deg, color-mix(in srgb, var(--warning-level-color) 14%, transparent), rgba(15, 23, 42, 0.58) 42%),
        rgba(15, 23, 42, 0.55);
    box-shadow: inset 3px 0 0 var(--warning-level-color);
}

.warning-list-card:hover {
    border-color: color-mix(in srgb, var(--warning-level-color) 58%, rgba(34, 211, 238, 0.35));
    background:
        linear-gradient(90deg, color-mix(in srgb, var(--warning-level-color) 20%, transparent), rgba(30, 41, 59, 0.72) 46%),
        rgba(30, 41, 59, 0.72);
}

.warning-list-card.is-selected {
    border-color: color-mix(in srgb, var(--warning-level-color) 72%, rgba(34, 211, 238, 0.72));
    box-shadow:
        inset 3px 0 0 var(--warning-level-color),
        0 0 12px color-mix(in srgb, var(--warning-level-color) 24%, transparent);
}

.warning-list-card.is-resolved {
    opacity: 0.68;
}

.warning-list-card--green {
    --warning-level-color: #4ade80;
}

.warning-list-card--yellow {
    --warning-level-color: #facc15;
}

.warning-list-card--orange {
    --warning-level-color: #fb923c;
}

.warning-list-card--red {
    --warning-level-color: #f87171;
}

.warning-hero-card,
.warning-stat-card {
    border: 1px solid rgba(51, 65, 85, 0.72);
    background: rgba(15, 23, 42, 0.5);
}

.warning-hero-card {
    padding: 0.8rem;
    box-shadow: inset 3px 0 0 rgba(34, 211, 238, 0.72);
}

.warning-hero-card span,
.warning-meta-grid span,
.warning-stat-card span,
.warning-action-box p b {
    display: block;
    color: #94a3b8;
    font-size: 0.75rem;
    font-weight: 800;
}

.warning-hero-card strong {
    display: block;
    margin-top: 0.3rem;
    color: #f8fafc;
    font-size: 1.05rem;
    font-weight: 900;
    line-height: 1.45;
}

.warning-meta-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
    margin-top: 0.75rem;
}

.warning-meta-grid div {
    min-width: 0;
    border: 1px solid rgba(51, 65, 85, 0.6);
    background: rgba(2, 6, 23, 0.28);
    padding: 0.5rem;
}

.warning-meta-grid strong {
    display: block;
    margin-top: 0.2rem;
    overflow: hidden;
    color: #ffffff;
    font-size: 0.85rem;
    font-weight: 900;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.warning-stat-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.5rem;
}

.warning-stat-card {
    min-width: 0;
    padding: 0.58rem 0.45rem;
    text-align: center;
}

.warning-stat-card strong {
    display: inline-block;
    margin-top: 0.12rem;
    color: #ffffff;
    font-size: 1.3rem;
    font-weight: 900;
}

.warning-stat-card em {
    margin-left: 0.12rem;
    color: #64748b;
    font-size: 0.68rem;
    font-style: normal;
    font-weight: 800;
}

.warning-stat-card--orange strong {
    color: #fb923c;
}

.warning-stat-card--red strong {
    color: #f87171;
}

.warning-decision-card {
    border: 1px solid rgba(51, 65, 85, 0.72);
    background: rgba(15, 23, 42, 0.5);
    padding: 0.9rem;
}

.warning-decision-card span,
.warning-key-grid span {
    display: block;
    color: #94a3b8;
    font-size: 0.78rem;
    font-weight: 800;
}

.warning-decision-card strong {
    display: block;
    margin-top: 0.3rem;
    color: #ffffff;
    font-size: 2rem;
    font-weight: 900;
    line-height: 1.08;
}

.warning-risk-tag-large {
    min-width: 3.25rem;
    padding: 0.18rem 0.5rem;
    font-size: 0.95rem;
}

.warning-decision-subtitle {
    margin-top: 0.55rem;
    color: #f8fafc;
    font-size: 1.02rem;
    font-weight: 900;
    line-height: 1.35;
}

.warning-decision-card p {
    margin-top: 0.45rem;
    overflow: hidden;
    color: #94a3b8;
    font-size: 0.78rem;
    font-weight: 800;
    line-height: 1.45;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.warning-basis-box {
    border: 1px solid rgba(34, 211, 238, 0.25);
    background: rgba(15, 23, 42, 0.52);
    padding: 0.72rem;
}

.warning-basis-row {
    display: grid;
    grid-template-columns: 5.1rem minmax(0, 1fr);
    gap: 0.6rem;
    align-items: start;
    border-top: 1px solid rgba(51, 65, 85, 0.52);
    padding-top: 0.48rem;
}

.warning-basis-row:first-child {
    border-top: 0;
    padding-top: 0;
}

.warning-basis-row span {
    color: #93c5fd;
    font-size: 0.76rem;
    font-weight: 900;
    white-space: nowrap;
}

.warning-basis-row strong {
    min-width: 0;
    overflow: hidden;
    color: #ffffff;
    font-size: 0.82rem;
    font-weight: 900;
    line-height: 1.38;
    text-overflow: ellipsis;
}

.warning-key-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
}

.warning-key-grid div {
    min-width: 0;
    border: 1px solid rgba(51, 65, 85, 0.6);
    background: rgba(2, 6, 23, 0.28);
    padding: 0.5rem;
}

.warning-key-grid strong {
    display: block;
    margin-top: 0.2rem;
    overflow: hidden;
    color: #ffffff;
    font-size: 1rem;
    font-weight: 900;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.warning-scenario-line {
    border: 1px solid rgba(51, 65, 85, 0.62);
    background: rgba(15, 23, 42, 0.48);
    padding: 0.55rem 0.65rem;
    color: #cbd5e1;
    font-size: 0.78rem;
    font-weight: 800;
    line-height: 1.45;
    overflow-wrap: anywhere;
}

.warning-section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
}

.warning-section-head > span {
    color: #64748b;
    font-size: 0.72rem;
    font-weight: 800;
    white-space: nowrap;
}

.warning-chart-section {
    padding-bottom: 0.4rem;
}

.warning-chart {
    height: 11.8rem;
    min-height: 11.8rem;
}

.warning-chart--compact {
    height: 10.2rem;
    min-height: 10.2rem;
}

.warning-chart-empty {
    display: flex;
    height: 11.8rem;
    min-height: 11.8rem;
    align-items: center;
    justify-content: center;
    border: 1px dashed rgba(71, 85, 105, 0.72);
    color: #94a3b8;
    font-size: 0.8rem;
    font-weight: 800;
    text-align: center;
}

.warning-chart-empty--compact {
    height: 10.2rem;
    min-height: 10.2rem;
}

.warning-action-box > div > span {
    color: #e2e8f0;
    font-size: 0.82rem;
    font-weight: 900;
}

.warning-level-track {
    height: 0.5rem;
    margin-top: 0.65rem;
    overflow: hidden;
    border: 1px solid rgba(51, 65, 85, 0.78);
    background: rgba(15, 23, 42, 0.72);
}

.warning-level-track i {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #facc15, #fb923c, #f87171);
}

p {
    margin-top: 0.65rem;
    color: #cbd5e1;
    font-size: 0.82rem;
    font-weight: 800;
    line-height: 1.55;
}

p b {
    margin-bottom: 0.15rem;
}
</style>
