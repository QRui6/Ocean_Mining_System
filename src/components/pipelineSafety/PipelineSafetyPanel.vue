<template>
    <div
        v-if="show"
        class="pointer-events-none absolute inset-0 z-40 font-['Noto_Sans_SC']"
    >
        <div class="pointer-events-auto absolute bottom-6 left-8 top-36" style="width: 28rem;">
            <section
                class="tech-panel-enhanced relative flex h-full w-full min-w-0 flex-col overflow-hidden p-5"
                style="clip-path: polygon(0 0, 100% 0, 100% 95%, 92% 100%, 0 100%);"
            >
                <div class="absolute left-0 top-0 h-[2px] w-full animate-pulse bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                <div class="corner-decoration corner-tl scale-125"></div>
                <div class="corner-decoration corner-tr scale-125"></div>

                <div class="mb-4 flex shrink-0 items-center border-b-2 border-cyan-500/40 pb-3">
                    <div class="mr-3 h-6 w-1.5 bg-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.8)]"></div>
                    <h3 class="min-w-0 flex-1 text-2xl font-bold tracking-wider text-white">管道评估</h3>
                </div>

                <section :class="['pipe-decision-card mb-3 shrink-0', getDecisionToneClass(operationDecision.tone)]">
                    <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                            <span class="pipe-decision-eyebrow">最终结论</span>
                            <strong class="pipe-decision-title">{{ operationDecision.title }}</strong>
                        </div>
                        <em :class="['pipe-risk-tag pipe-risk-tag-large shrink-0', riskClass(operationDecision.level)]">{{ operationDecision.level }}</em>
                    </div>
                    <div class="pipe-decision-subtitle">
                        {{ operationDecision.canContinueOperation ? '可继续作业' : '不建议继续作业' }} ·
                        {{ operationDecision.needRecoverPipeline ? (operationDecision.needImmediateRecovery ? '立即撤收' : '准备撤收') : '暂不撤收' }}
                    </div>
                </section>

                <div class="pipe-scroll pipe-left-content custom-scrollbar">
                    <section ref="siteDropdownRef" class="pipe-section pipe-control-section pipe-site-section">
                        <div class="pipe-section-title mb-3">矿区选择</div>
                        <div v-if="loadingSites" class="pipe-empty-line">正在加载矿区列表...</div>
                        <div v-else class="pipe-site-picker">
                            <button
                                class="pipe-site-picker-trigger"
                                type="button"
                                :aria-expanded="isSiteDropdownOpen"
                                @click="isSiteDropdownOpen = !isSiteDropdownOpen"
                            >
                                <span>{{ selectedSiteLabel }}</span>
                                <i :class="{ 'is-open': isSiteDropdownOpen }"></i>
                            </button>
                            <div v-if="isSiteDropdownOpen" class="pipe-site-picker-menu custom-scrollbar">
                                <button
                                    v-for="site in siteOptions"
                                    :key="site.id"
                                    type="button"
                                    :class="['pipe-site-picker-option', String(site.id) === String(state.siteId) ? 'is-active' : '']"
                                    @click="selectSite(site)"
                                >
                                    {{ site.regionName }} · {{ site.displayName }}
                                </button>
                            </div>
                        </div>
                        <div v-if="siteError" class="mt-2 text-xs font-bold text-orange-300">{{ siteError }}</div>
                    </section>

                    <section class="pipe-section pipe-control-section">
                        <div class="pipe-section-title mb-3">水深</div>
                        <div class="pipe-option-grid cols-2">
                            <button
                                v-for="depth in depthOptions"
                                :key="depth"
                                type="button"
                                :class="['pipe-choice-btn', Number(state.depth) === depth ? 'is-active' : '']"
                                @click="selectDepth(depth)"
                            >
                                <span>{{ depth }} m</span>
                                <i></i>
                            </button>
                        </div>
                    </section>

                    <section class="pipe-section pipe-control-section">
                        <div class="pipe-section-title mb-3">顶端条件</div>
                        <div class="pipe-option-grid cols-2">
                            <button
                                v-for="condition in topConditionOptions"
                                :key="condition"
                                type="button"
                                :disabled="!isTopConditionEnabled(condition)"
                                :class="[
                                    'pipe-choice-btn',
                                    state.topCondition === condition ? 'is-active' : '',
                                    !isTopConditionEnabled(condition) ? 'is-disabled' : ''
                                ]"
                                @click="selectTopCondition(condition)"
                            >
                                <span>{{ conditionLabel(condition) }}</span>
                                <i></i>
                            </button>
                        </div>
                    </section>

                    <section class="pipe-section pipe-control-section">
                        <div class="pipe-section-title mb-3">材料</div>
                        <div class="pipe-option-grid cols-2">
                            <button
                                v-for="material in materialOptions"
                                :key="material.key"
                                type="button"
                                :class="['pipe-choice-btn', state.material === material.key ? 'is-active' : '']"
                                @click="state.material = material.key"
                            >
                                <span>{{ material.label }}</span>
                                <i></i>
                            </button>
                        </div>
                        <div class="mt-3 grid grid-cols-[minmax(0,1fr)_8rem] gap-3">
                            <div>
                                <div class="pipe-label">安全系数</div>
                                <input
                                    v-model.number="state.safetyFactor"
                                    class="pipe-input"
                                    type="number"
                                    min="0.1"
                                    max="1"
                                    step="0.05"
                                />
                            </div>
                            <div>
                                <div class="pipe-label">屈服强度</div>
                                <div class="pipe-value-box">{{ selectedMaterial?.yieldStrength || '--' }} MPa</div>
                            </div>
                        </div>

                        <div class="mt-2 pipe-option-grid cols-3">
                            <button
                                v-for="factor in safetyFactorOptions"
                                :key="factor"
                                type="button"
                                :class="['pipe-factor-btn', Number(state.safetyFactor) === factor ? 'is-active' : '']"
                                @click="setSafetyFactor(factor)"
                            >
                                <span>{{ factor }}</span>
                            </button>
                        </div>
                    </section>

                    <section class="pipe-section pipe-control-section">
                        <div class="pipe-section-title mb-3">当前矿区数据</div>
                        <div class="pipe-current-box">
                            <div>
                                <span>自动海况</span>
                                <strong>{{ evaluation.seaState?.code === null ? '--' : `${evaluation.seaState.code}级 · ${evaluation.seaState.label}` }}</strong>
                            </div>
                            <div>
                                <span>风速 / 阵风</span>
                                <strong>{{ formatMetric(currentForecast?.windSpeed, 1, 'm/s') }} / {{ formatMetric(currentForecast?.gust, 1, 'm/s') }}</strong>
                            </div>
                            <div>
                                <span>浪高 / 周期</span>
                                <strong>{{ formatMetric(currentForecast?.waveHeight, 1, 'm') }} / {{ formatMetric(currentForecast?.wavePeriod, 1, 's') }}</strong>
                            </div>
                            <div>
                                <span>流速</span>
                                <strong>{{ formatMetric(currentForecast?.currentSpeed, 2, 'm/s') }}</strong>
                            </div>
                            <div>
                                <span>数据时次</span>
                                <strong>{{ formatForecastTime(currentForecast?.forecastTime) }}</strong>
                            </div>
                        </div>
                        <div class="mt-3 grid grid-cols-2 gap-2">
                            <button class="pipe-btn" type="button" @click="handleEvaluate">生成评估</button>
                            <button class="pipe-btn secondary" type="button" @click="refreshMetocean">刷新数据</button>
                        </div>
                    </section>
                </div>
            </section>
        </div>

        <div class="pointer-events-auto absolute bottom-6 top-36 flex flex-col gap-4" style="right: 1.5rem; width: 28rem;">
            <section
                class="tech-panel-enhanced relative flex min-h-0 flex-[1.35] w-full min-w-0 flex-col overflow-hidden p-5"
                style="clip-path: polygon(0 0, 92% 0, 100% 7%, 100% 100%, 0 100%);"
            >
                <div class="absolute left-0 top-0 h-[2px] w-full animate-pulse bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                <div class="corner-decoration corner-tl scale-125"></div>
                <div class="corner-decoration corner-tr scale-125"></div>
                <button
                    class="floating-panel-close-btn"
                    type="button"
                    title="关闭管道评估"
                    aria-label="关闭管道评估"
                    @click="emit('close')"
                >
                    ✕
                </button>

                <div class="flex min-h-0 flex-1 flex-col gap-3 pt-10">
                    <div class="flex items-center justify-between gap-2">
                        <div class="pipe-section-title">矿区风浪流趋势</div>
                    </div>
                    <div class="pipe-weather-strip">
                        <div><span>风速</span><strong>{{ formatMetric(currentForecast?.windSpeed, 1, 'm/s') }}</strong></div>
                        <div><span>浪高</span><strong>{{ formatMetric(currentForecast?.waveHeight, 1, 'm') }}</strong></div>
                        <div><span>流速</span><strong>{{ formatMetric(currentForecast?.currentSpeed, 2, 'm/s') }}</strong></div>
                    </div>
                    <div v-if="loadingMetocean" class="pipe-chart-loading">正在加载矿区预报...</div>
                    <div v-else ref="metoceanChartRef" class="pipe-metocean-chart"></div>
                </div>
            </section>

            <section
                class="tech-panel-enhanced relative flex min-h-0 flex-[0.65] w-full min-w-0 flex-col overflow-hidden p-5"
                style="clip-path: polygon(0 0, 92% 0, 100% 7%, 100% 100%, 0 100%);"
            >
                <div class="absolute left-0 top-0 h-[2px] w-full animate-pulse bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                <div class="corner-decoration corner-bl scale-125"></div>
                <div class="corner-decoration corner-br scale-125"></div>

                <div class="flex min-h-0 flex-1 flex-col gap-3">
                    <section class="pipe-section min-h-0 flex-1">
                        <div class="mb-2 flex items-center justify-between gap-2">
                            <div class="pipe-section-title">综合应力对比</div>
                            <div class="pipe-chart-note">许用 {{ formatNumber(evaluation.allowableStress, 1) }} MPa</div>
                        </div>
                        <div ref="stressChartRef" class="pipe-stress-chart"></div>
                        <div class="pipe-evaluation-note">
                            <div><span>自动海况</span><strong>{{ evaluation.currentConditionText }}</strong></div>
                            <div><span>参考表格</span><strong>{{ evaluation.selectedScenarioText }}</strong></div>
                            <div><span>数据完整性</span><strong>{{ evaluation.dataCompleteness }}</strong></div>
                        </div>
                    </section>
                </div>
            </section>
        </div>

        <transition name="pipe-toast">
            <div
                v-if="feedbackToast.visible"
                class="pipe-toast pointer-events-auto"
            >
                <div class="pipe-toast-light"></div>
                <div class="pipe-toast-dot"></div>
                <div class="min-w-0">
                    <div class="pipe-toast-title">{{ feedbackToast.title }}</div>
                    <div class="pipe-toast-message">{{ feedbackToast.message }}</div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import * as echarts from 'echarts';
import {
    DEFAULT_PIPE_SELECTION_STATE,
    PIPE_SELECTION_MATERIALS,
    PIPE_SELECTION_SCENARIOS
} from '../../data/liftingPipeSelection.js';
import { evaluatePipeSelectionForMetocean } from '../../utils/pipelineRiskService.js';
import { loadPipelineMiningSites, loadPipelineSiteMetocean } from '../../utils/pipelineMetoceanService.js';
import {
    buildPipelineOperationDecision,
    getDecisionToneClass
} from '../../utils/operationRiskDecisionService.js';
import {
    getPipeSelectionState,
    initializePipelineData,
    savePipeSelectionState
} from '../../utils/pipelineStorage.js';
import { syncPipelineWarningsFromPipeSelection } from '../../utils/pipelineWarningService.js';

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['close', 'locate-site']);

initializePipelineData();

const scenarios = PIPE_SELECTION_SCENARIOS;
const materialOptions = PIPE_SELECTION_MATERIALS;
const safetyFactorOptions = [0.85, 0.9, 0.95];
const stressChartRef = ref(null);
const metoceanChartRef = ref(null);
const siteDropdownRef = ref(null);
const siteOptions = ref([]);
const metocean = ref({});
const loadingSites = ref(false);
const loadingMetocean = ref(false);
const siteError = ref('');
const isSiteDropdownOpen = ref(false);
const feedbackToast = ref({
    visible: false,
    title: '',
    message: ''
});
let stressChart = null;
let metoceanChart = null;
let feedbackTimer = null;

const state = reactive({
    ...DEFAULT_PIPE_SELECTION_STATE,
    ...getPipeSelectionState()
});

const selectedMaterial = computed(() => materialOptions.find((item) => item.key === state.material) || materialOptions[0]);
const selectedSite = computed(() => siteOptions.value.find((item) => String(item.id) === String(state.siteId)) || null);
const selectedSiteLabel = computed(() => (
    selectedSite.value
        ? `${selectedSite.value.regionName} · ${selectedSite.value.displayName}`
        : '请选择矿区'
));
const currentForecast = computed(() => metocean.value.currentForecast || null);
const depthOptions = computed(() => [...new Set(scenarios.map((item) => item.depth))].sort((first, second) => first - second));
const topConditionOptions = computed(() => [...new Set(scenarios.map((item) => item.topCondition))]);
const evaluation = computed(() => evaluatePipeSelectionForMetocean({
    depth: Number(state.depth),
    topCondition: state.topCondition,
    material: state.material,
    yieldStrength: selectedMaterial.value?.yieldStrength,
    safetyFactor: state.safetyFactor
}, metocean.value));
const operationDecision = computed(() => buildPipelineOperationDecision(evaluation.value));

const riskColor = (level) => ({
    绿色: '#4ade80',
    黄色: '#facc15',
    橙色: '#fb923c',
    红色: '#f87171'
}[level] || '#67e8f9');

const riskClass = (level) => ({
    绿色: 'pipe-risk-green',
    黄色: 'pipe-risk-yellow',
    橙色: 'pipe-risk-orange',
    红色: 'pipe-risk-red'
}[level] || 'pipe-risk-yellow');

const formatNumber = (value, digits = 2) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '--';
    return Number(value).toFixed(digits);
};

const formatMetric = (value, digits, unit) => (
    value === null || value === undefined || Number.isNaN(Number(value))
        ? '--'
        : `${Number(value).toFixed(digits)} ${unit}`
);

const formatForecastTime = (value) => {
    if (!value) return '--';
    return String(value).replace('T', ' ').slice(0, 16);
};

const conditionLabel = (condition) => (
    String(condition || '').includes('8') ? '方向节8度' : '顶端固支'
);

const selectDepth = (depth) => {
    state.depth = depth;
    const firstAvailable = scenarios.find((item) => item.depth === depth);
    state.topCondition = firstAvailable?.topCondition || state.topCondition;
};

const isTopConditionEnabled = (topCondition) => scenarios.some((item) => item.depth === Number(state.depth) && item.topCondition === topCondition);

const selectTopCondition = (topCondition) => {
    if (!isTopConditionEnabled(topCondition)) return;
    state.topCondition = topCondition;
};

const setSafetyFactor = (factor) => {
    state.safetyFactor = factor;
};

const persistState = () => {
    savePipeSelectionState({
        siteId: String(state.siteId || ''),
        depth: Number(state.depth || 5200),
        topCondition: state.topCondition,
        material: state.material,
        safetyFactor: Number(state.safetyFactor || 0.9)
    });
};

const showFeedback = (title, message) => {
    if (feedbackTimer) {
        clearTimeout(feedbackTimer);
    }

    feedbackToast.value = {
        visible: true,
        title,
        message
    };

    feedbackTimer = setTimeout(() => {
        feedbackToast.value.visible = false;
        feedbackTimer = null;
    }, 2600);
};

const handleEvaluate = () => {
    persistState();
    syncPipelineWarningsFromPipeSelection(evaluation.value);
    showFeedback('评估已生成', `${selectedSite.value?.displayName || '当前矿区'} · ${evaluation.value.matchType} · ${state.material}`);
};

const refreshMetocean = async () => {
    if (!selectedSite.value) return;
    loadingMetocean.value = true;
    siteError.value = '';
    try {
        metocean.value = await loadPipelineSiteMetocean(selectedSite.value);
    } catch (error) {
        console.error('加载管道评估矿区风浪流失败:', error);
        metocean.value = {};
        siteError.value = '矿区风浪数据加载失败，请稍后重试';
    } finally {
        loadingMetocean.value = false;
    }
};

const selectSite = async (site) => {
    state.siteId = String(site.id);
    isSiteDropdownOpen.value = false;
    persistState();
    emit('locate-site', site);
    await refreshMetocean();
};

const handleDocumentClick = (event) => {
    if (!siteDropdownRef.value?.contains(event.target)) {
        isSiteDropdownOpen.value = false;
    }
};

const loadSites = async () => {
    loadingSites.value = true;
    siteError.value = '';
    try {
        siteOptions.value = await loadPipelineMiningSites();
        const savedSite = siteOptions.value.find((item) => String(item.id) === String(state.siteId));
        const defaultSite = savedSite || siteOptions.value.find((item) => String(item.regionName).includes('CCZ')) || siteOptions.value[0];
        state.siteId = defaultSite ? String(defaultSite.id) : '';
        await refreshMetocean();
    } catch (error) {
        console.error('加载管道评估矿区列表失败:', error);
        siteError.value = '矿区列表加载失败，请稍后重试';
    } finally {
        loadingSites.value = false;
    }
};

const renderCharts = async () => {
    if (!props.show) {
        disposeCharts();
        return;
    }

    await nextTick();

    if (!stressChartRef.value || !metoceanChartRef.value) {
        return;
    }

    if (!stressChart || stressChart.getDom() !== stressChartRef.value) {
        stressChart?.dispose();
        stressChart = echarts.init(stressChartRef.value);
    }

    if (!metoceanChart || metoceanChart.getDom() !== metoceanChartRef.value) {
        metoceanChart?.dispose();
        metoceanChart = echarts.init(metoceanChartRef.value);
    }

    const candidates = evaluation.value.candidates || [];
    const names = candidates.map((item) => item.size);
    const allowable = evaluation.value.allowableStress;
    const hourly = metocean.value.hourlyForecast || [];
    const timeLabels = hourly.map((item) => formatForecastTime(item.forecastTime).slice(11));
    const hasCurrentData = hourly.some((item) => (
        item.currentSpeed !== null &&
        item.currentSpeed !== undefined &&
        Number.isFinite(Number(item.currentSpeed))
    ));
    const trendRows = [
        {
            name: '风速',
            axisName: '风速 m/s',
            color: '#22d3ee',
            data: hourly.map((item) => item.windSpeed)
        },
        {
            name: '浪高',
            axisName: '浪高 m',
            color: '#38bdf8',
            data: hourly.map((item) => item.waveHeight),
            areaColor: 'rgba(56, 189, 248, 0.14)'
        },
        ...(hasCurrentData
            ? [{
                name: '流速',
                axisName: '流速 m/s',
                color: '#a78bfa',
                data: hourly.map((item) => item.currentSpeed)
            }]
            : [])
    ];
    const trendGrid = hasCurrentData
        ? [
            { left: 58, right: 20, top: 38, height: '22%' },
            { left: 58, right: 20, top: '41%', height: '22%' },
            { left: 58, right: 20, top: '72%', height: '18%' }
        ]
        : [
            { left: 58, right: 20, top: 40, height: '34%' },
            { left: 58, right: 20, top: '59%', height: '31%' }
        ];

    stressChart.setOption({
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: 'rgba(15, 23, 42, 0.96)',
            borderColor: '#22d3ee',
            textStyle: { color: '#f8fafc' }
        },
        grid: { left: 46, right: 36, top: 16, bottom: 24 },
        xAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: '#334155' } },
            axisLabel: { color: '#f8fafc' },
            splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } }
        },
        yAxis: {
            type: 'category',
            data: names,
            axisLine: { lineStyle: { color: '#334155' } },
            axisLabel: { color: '#f8fafc', fontWeight: 700 }
        },
        series: [
            {
                name: '综合应力',
                type: 'bar',
                barWidth: 20,
                data: candidates.map((item) => ({
                    value: item.combinedStress,
                    itemStyle: { color: riskColor(item.riskLevel) }
                })),
                label: {
                    show: true,
                    position: 'right',
                    color: '#e2e8f0',
                    fontSize: 11,
                    formatter: ({ value }) => Number(value).toFixed(0)
                },
                markLine: {
                    symbol: 'none',
                    label: {
                        color: '#facc15',
                        formatter: '许用'
                    },
                    lineStyle: {
                        color: '#facc15',
                        type: 'dashed',
                        width: 2
                    },
                    data: [{ xAxis: allowable }]
                }
            }
        ]
    });

    metoceanChart.setOption({
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(15, 23, 42, 0.96)',
            borderColor: '#22d3ee',
            textStyle: { color: '#f8fafc' }
        },
        legend: {
            top: 0,
            textStyle: { color: '#dbeafe', fontSize: 13, fontWeight: 800 },
            itemWidth: 18,
            itemHeight: 9,
            data: trendRows.map((item) => item.name)
        },
        grid: trendGrid,
        xAxis: trendRows.map((item, index) => ({
            type: 'category',
            gridIndex: index,
            data: timeLabels,
            boundaryGap: false,
            axisTick: { show: false },
            axisLine: { lineStyle: { color: 'rgba(100, 116, 139, 0.5)' } },
            axisLabel: index === trendRows.length - 1
                ? { color: '#cbd5e1', fontSize: 12, fontWeight: 700, margin: 10, hideOverlap: true }
                : { show: false }
        })),
        yAxis: trendRows.map((item, index) => ({
            type: 'value',
            gridIndex: index,
            name: item.axisName,
            nameGap: 10,
            nameTextStyle: { color: item.color, fontSize: 12, fontWeight: 800 },
            axisLabel: { color: '#f8fafc', fontSize: 11, fontWeight: 700 },
            axisLine: { show: false },
            axisTick: { show: false },
            splitNumber: 3,
            splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.12)' } }
        })),
        series: trendRows.map((item, index) => ({
            name: item.name,
            type: 'line',
            smooth: 0.28,
            connectNulls: true,
            xAxisIndex: index,
            yAxisIndex: index,
            symbol: 'circle',
            symbolSize: 6,
            showSymbol: true,
            data: item.data,
            lineStyle: { color: item.color, width: 3 },
            itemStyle: { color: item.color, borderColor: '#e0f2fe', borderWidth: 1 },
            areaStyle: item.areaColor ? { color: item.areaColor } : undefined
        }))
    }, true);
};

const resizeCharts = () => {
    stressChart?.resize();
    metoceanChart?.resize();
};

const disposeCharts = () => {
    stressChart?.dispose();
    metoceanChart?.dispose();
    stressChart = null;
    metoceanChart = null;
};

watch(state, persistState, { deep: true });
watch(
    () => [props.show, state.depth, state.topCondition, state.material, state.safetyFactor, metocean.value, loadingMetocean.value],
    () => {
        renderCharts();
    },
    { immediate: true }
);

onMounted(() => {
    loadSites();
    renderCharts();
    document.addEventListener('click', handleDocumentClick);
    window.addEventListener('resize', resizeCharts);
});

onBeforeUnmount(() => {
    document.removeEventListener('click', handleDocumentClick);
    window.removeEventListener('resize', resizeCharts);
    if (feedbackTimer) {
        clearTimeout(feedbackTimer);
    }
    disposeCharts();
});
</script>

<style>
.pipe-scroll {
    height: 100%;
    min-height: 0;
    overflow-y: auto;
    padding-right: 0.35rem;
}

.pipe-left-content {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.pipe-section {
    border: 1px solid rgba(51, 65, 85, 0.62);
    background: rgba(15, 23, 42, 0.5);
    padding: 0.75rem;
}

.pipe-control-section {
    display: flex;
    flex: 0 0 auto;
    flex-direction: column;
    justify-content: center;
}

.pipe-left-content .pipe-control-section:last-child {
    flex: 1 0 auto;
    justify-content: flex-start;
}

.pipe-section-title {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    color: #22d3ee;
    font-size: 1rem;
    font-weight: 800;
}

.pipe-section-title::before {
    content: '';
    width: 0.375rem;
    height: 0.375rem;
    background: #22d3ee;
    border-radius: 999px;
}

.pipe-input,
.pipe-select {
    width: 100%;
    height: 2.35rem;
    border: 1px solid rgba(51, 65, 85, 0.95);
    border-radius: 0.125rem;
    background: rgba(15, 23, 42, 0.72);
    padding: 0 0.6rem;
    color: #ffffff;
    font-size: 1rem;
    font-weight: 800;
    outline: none;
}

.pipe-input:focus,
.pipe-select:focus {
    border-color: rgba(34, 211, 238, 0.72);
    box-shadow: 0 0 10px rgba(34, 211, 238, 0.16);
}

.pipe-site-section {
    position: relative;
    z-index: 5;
}

.pipe-site-picker {
    position: relative;
    width: min(20rem, calc(100% - 1rem));
}

.pipe-site-picker-trigger {
    display: flex;
    width: 100%;
    height: 2.35rem;
    align-items: center;
    justify-content: space-between;
    gap: 0.65rem;
    border: 1px solid rgba(34, 211, 238, 0.52);
    border-radius: 0.125rem;
    background: linear-gradient(90deg, rgba(8, 47, 73, 0.82), rgba(15, 23, 42, 0.9));
    padding: 0 0.7rem;
    color: #e0f2fe;
    font-size: 0.9rem;
    font-weight: 800;
    text-align: left;
}

.pipe-site-picker-trigger span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.pipe-site-picker-trigger i {
    width: 0.5rem;
    height: 0.5rem;
    flex: 0 0 auto;
    border-bottom: 2px solid #67e8f9;
    border-right: 2px solid #67e8f9;
    transform: translateY(-0.15rem) rotate(45deg);
    transition: transform 0.18s ease;
}

.pipe-site-picker-trigger i.is-open {
    transform: translateY(0.15rem) rotate(225deg);
}

.pipe-site-picker-menu {
    position: absolute;
    left: 0;
    top: calc(100% + 0.35rem);
    z-index: 30;
    width: 100%;
    max-height: 14rem;
    overflow-y: auto;
    border: 1px solid rgba(34, 211, 238, 0.48);
    background: rgba(8, 15, 28, 0.98);
    box-shadow: 0 0 18px rgba(34, 211, 238, 0.18);
    padding: 0.3rem;
}

.pipe-site-picker-option {
    display: block;
    width: 100%;
    overflow: hidden;
    border: 1px solid transparent;
    padding: 0.5rem 0.55rem;
    color: #cbd5e1;
    font-size: 0.82rem;
    font-weight: 800;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.pipe-site-picker-option:hover,
.pipe-site-picker-option.is-active {
    border-color: rgba(34, 211, 238, 0.46);
    background: rgba(8, 145, 178, 0.24);
    color: #ffffff;
}

.pipe-input[type='number'] {
    appearance: textfield;
}

.pipe-label {
    margin-bottom: 0.35rem;
    color: #93c5fd;
    font-size: 0.76rem;
    font-weight: 800;
}

.pipe-btn {
    height: 2.35rem;
    border: 1px solid rgba(34, 211, 238, 0.42);
    border-radius: 0.125rem;
    background: rgba(8, 145, 178, 0.26);
    color: #ecfeff;
    font-size: 1rem;
    font-weight: 800;
    transition: all 0.18s ease;
}

.pipe-btn:hover {
    border-color: rgba(103, 232, 249, 0.78);
    color: #ffffff;
}

.pipe-btn.secondary {
    border-color: rgba(148, 163, 184, 0.28);
    background: rgba(30, 41, 59, 0.68);
    color: #cbd5e1;
}

.pipe-option-grid {
    display: grid;
    gap: 0.5rem;
}

.pipe-option-grid.cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

.pipe-option-grid.cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

.pipe-choice-btn,
.pipe-factor-btn {
    position: relative;
    min-width: 0;
    min-height: 2.8rem;
    overflow: hidden;
    border: 1px solid rgba(51, 65, 85, 0.72);
    border-radius: 0.125rem;
    background: rgba(30, 41, 59, 0.5);
    color: #94a3b8;
    font-size: 1rem;
    font-weight: 800;
    text-align: center;
    transform: skewX(-10deg);
    transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}

.pipe-choice-btn span {
    position: relative;
    z-index: 1;
    display: block;
    overflow: hidden;
    padding: 0 0.6rem;
    text-overflow: ellipsis;
    transform: skewX(10deg);
    white-space: nowrap;
}

.pipe-factor-btn span {
    position: relative;
    z-index: 1;
    display: block;
    transform: skewX(10deg);
}

.pipe-choice-btn i {
    position: absolute;
    right: 0.55rem;
    top: 50%;
    width: 0.38rem;
    height: 0.38rem;
    background: rgba(34, 211, 238, 0.55);
    transform: translateY(-50%) rotate(45deg);
}

.pipe-choice-btn::before,
.pipe-factor-btn::before {
    content: '';
    position: absolute;
    inset: auto 0 0 0;
    height: 0.18rem;
    background: transparent;
}

.pipe-choice-btn:hover:not(:disabled),
.pipe-factor-btn:hover {
    border-color: rgba(34, 211, 238, 0.5);
    color: #bae6fd;
}

.pipe-choice-btn.is-active,
.pipe-factor-btn.is-active {
    border-color: #93c5fd;
    background: linear-gradient(90deg, #2563eb, #3b82f6);
    color: #ffffff;
    box-shadow: 0 0 10px rgba(37, 99, 235, 0.6);
}

.pipe-choice-btn.is-active::before,
.pipe-factor-btn.is-active::before {
    background: transparent;
    box-shadow: none;
}

.pipe-choice-btn.is-active i {
    background: rgba(34, 211, 238, 0.65);
    box-shadow: none;
}

.pipe-choice-btn.is-disabled {
    cursor: not-allowed;
    border-color: rgba(51, 65, 85, 0.34);
    background: rgba(15, 23, 42, 0.22);
    color: rgba(148, 163, 184, 0.42);
}

.pipe-choice-btn.is-disabled i {
    background: rgba(100, 116, 139, 0.32);
}

.pipe-factor-btn {
    min-height: 2.35rem;
}

.pipe-factor-btn {
    transform: skewX(-10deg);
}

.pipe-factor-btn {
    line-height: 1;
}

.pipe-value-box,
.pipe-current-box,
.pipe-mini-card,
.pipe-data-cell,
.pipe-metric-tile {
    border: 1px solid rgba(51, 65, 85, 0.72);
    background: rgba(15, 23, 42, 0.52);
}

.pipe-value-box {
    min-height: 2.35rem;
    padding: 0.55rem 0.6rem;
    color: #ffffff;
    font-size: 0.92rem;
    font-weight: 900;
}

.pipe-decision-card {
    border: 1px solid rgba(51, 65, 85, 0.72);
    border-radius: 0.125rem;
    background: rgba(15, 23, 42, 0.55);
    padding: 0.85rem 0.9rem;
}

.pipe-decision-eyebrow {
    display: block;
    color: #93c5fd;
    font-size: 0.78rem;
    font-weight: 800;
}

.pipe-decision-title {
    display: block;
    margin-top: 0.28rem;
    color: #ffffff;
    font-size: 2rem;
    font-weight: 900;
    line-height: 1.08;
}

.pipe-decision-subtitle {
    margin-top: 0.55rem;
    color: #f8fafc;
    font-size: 1.02rem;
    font-weight: 900;
    line-height: 1.35;
}

.pipe-decision-card p {
    margin-top: 0.45rem;
    overflow: hidden;
    color: #94a3b8;
    font-size: 0.78rem;
    font-weight: 800;
    line-height: 1.45;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.pipe-risk-tag-large {
    min-width: 3rem;
    padding: 0.18rem 0.48rem;
    font-size: 0.95rem;
}

.pipe-current-box {
    display: grid;
    gap: 0.5rem;
    padding: 0.7rem;
}

.pipe-current-box span,
.pipe-metric-tile span,
.pipe-mini-card span,
.pipe-data-cell span {
    display: block;
    color: #93c5fd;
    font-size: 0.72rem;
    font-style: normal;
    font-weight: 800;
}

.pipe-current-box strong,
.pipe-metric-tile strong,
.pipe-mini-card strong,
.pipe-data-cell strong {
    display: block;
    margin-top: 0.22rem;
    overflow: hidden;
    color: #ffffff;
    font-size: 0.9rem;
    font-weight: 900;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.pipe-summary-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.5rem;
}

.pipe-metric-tile {
    min-width: 0;
    padding: 0.65rem 0.55rem;
    text-align: center;
}

.pipe-metric-tile strong {
    font-size: 1.2rem;
}

.pipe-metric-tile em {
    display: block;
    margin-top: 0.1rem;
    color: #38bdf8;
    font-size: 0.68rem;
    font-style: normal;
    font-weight: 800;
}

.pipe-chart {
    height: 10.5rem;
    min-height: 10.5rem;
}

.pipe-chart.small {
    height: 8rem;
    min-height: 8rem;
}

.pipe-chart-note {
    color: #94a3b8;
    font-size: 0.72rem;
    font-weight: 800;
}

.pipe-empty-line,
.pipe-chart-loading {
    display: flex;
    min-height: 2.35rem;
    align-items: center;
    justify-content: center;
    border: 1px dashed rgba(71, 85, 105, 0.72);
    color: #94a3b8;
    font-size: 0.8rem;
    font-weight: 800;
}

.pipe-weather-strip {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.45rem;
}

.pipe-weather-strip div,
.pipe-evaluation-note div {
    min-width: 0;
    border: 1px solid rgba(51, 65, 85, 0.72);
    background: rgba(15, 23, 42, 0.52);
    padding: 0.5rem;
}

.pipe-weather-strip span,
.pipe-evaluation-note span {
    display: block;
    color: #93c5fd;
    font-size: 0.68rem;
    font-weight: 800;
}

.pipe-weather-strip strong,
.pipe-evaluation-note strong {
    display: block;
    margin-top: 0.2rem;
    color: #f8fafc;
    font-size: 0.8rem;
    font-weight: 900;
}

.pipe-metocean-chart {
    flex: 1;
    min-height: 0;
    height: 100%;
}

.pipe-stress-chart {
    min-height: 10.5rem;
    flex: 1;
}

.pipe-chart-foot {
    color: #94a3b8;
    font-size: 0.72rem;
    font-weight: 800;
}

.pipe-evaluation-note {
    display: grid;
    gap: 0.4rem;
}

.pipe-candidate-card {
    border: 1px solid rgba(51, 65, 85, 0.72);
    background: rgba(15, 23, 42, 0.52);
    padding: 0.5rem;
}

.pipe-compact-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.5rem;
}

.pipe-compact-list .pipe-candidate-card > div {
    flex-direction: column;
    align-items: flex-start;
}

.pipe-candidate-card.is-recommended {
    border-color: rgba(34, 211, 238, 0.76);
    box-shadow: inset 3px 0 0 #22d3ee;
}

.pipe-candidate-card.is-reference {
    border-color: rgba(251, 146, 60, 0.64);
    box-shadow: inset 3px 0 0 #fb923c;
}

.pipe-data-cell {
    min-width: 0;
    padding: 0.45rem;
}

.pipe-risk-tag {
    display: inline-flex;
    min-width: 2.3rem;
    justify-content: center;
    border: 1px solid currentColor;
    padding: 0.08rem 0.3rem;
    font-size: 0.72rem;
    font-weight: 800;
}

.pipe-risk-green {
    color: #4ade80;
}

.pipe-risk-yellow {
    color: #facc15;
}

.pipe-risk-orange {
    color: #fb923c;
}

.pipe-risk-red {
    color: #f87171;
}

.pipe-toast {
    position: absolute;
    left: 50%;
    top: 7.25rem;
    z-index: 70;
    display: flex;
    width: 24rem;
    min-height: 4.25rem;
    gap: 0.75rem;
    overflow: hidden;
    border: 1px solid rgba(34, 211, 238, 0.55);
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(8, 47, 73, 0.9));
    box-shadow:
        0 0 24px rgba(34, 211, 238, 0.24),
        inset 0 0 22px rgba(34, 211, 238, 0.08);
    padding: 0.75rem 1rem;
    transform: translateX(-50%);
}

.pipe-toast-light {
    position: absolute;
    left: 0;
    top: 0;
    height: 2px;
    width: 100%;
    background: linear-gradient(90deg, transparent, #22d3ee, transparent);
}

.pipe-toast-dot {
    margin-top: 0.35rem;
    width: 0.55rem;
    height: 0.55rem;
    flex: 0 0 auto;
    background: #facc15;
    box-shadow: 0 0 10px rgba(250, 204, 21, 0.85);
    transform: rotate(45deg);
}

.pipe-toast-title {
    color: #ffffff;
    font-size: 1rem;
    font-weight: 900;
    letter-spacing: 0;
}

.pipe-toast-message {
    margin-top: 0.25rem;
    overflow: hidden;
    color: #bae6fd;
    font-size: 0.82rem;
    font-weight: 800;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.pipe-toast-enter-active,
.pipe-toast-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.pipe-toast-enter-from,
.pipe-toast-leave-to {
    opacity: 0;
    transform: translate(-50%, -0.5rem);
}
</style>
