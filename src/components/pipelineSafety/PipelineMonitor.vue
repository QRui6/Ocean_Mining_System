<template>
    <div class="pipe-pane">
        <div v-if="pane === 'left'" class="pipe-scroll custom-scrollbar space-y-3">
            <section class="pipe-section">
                <div class="mb-3 pipe-section-title">当前风险</div>
                <div v-if="riskResult" class="risk-card" :class="riskClass(riskResult.riskLevel)">
                    <span>风险等级</span>
                    <strong>{{ riskResult.riskLevel }}</strong>
                </div>
                <div class="mt-3 grid grid-cols-2 gap-2">
                    <div v-for="item in summaryCards" :key="item.label" class="mini-card">
                        <span>{{ item.label }}</span>
                        <strong :class="item.className">{{ item.value }}</strong>
                    </div>
                </div>
                <div class="mt-3 grid grid-cols-2 gap-2">
                    <button class="pipe-btn" type="button" @click="evaluate">重新评估</button>
                    <button class="pipe-btn secondary" type="button" @click="regenerateForecast">生成预报</button>
                </div>
            </section>

            <section v-if="riskResult" class="pipe-section space-y-3 text-sm">
                <div>
                    <div class="pipe-section-title">匹配工况</div>
                    <p>{{ matchedText }}</p>
                </div>
                <div>
                    <div class="pipe-section-title">风险原因</div>
                    <p>{{ riskResult.riskReason }}</p>
                </div>
                <div>
                    <div class="pipe-section-title">处置建议</div>
                    <p>{{ riskResult.suggestion }}</p>
                </div>
            </section>
        </div>

        <div v-else class="grid h-full min-h-0 grid-rows-2 gap-3">
            <section class="pipe-section min-h-0">
                <div class="pipe-section-title mb-2">综合应力对比</div>
                <div ref="stressChartRef" class="chart"></div>
            </section>
            <section class="pipe-section min-h-0">
                <div class="pipe-section-title mb-2">未来风险与流速趋势</div>
                <div ref="trendChartRef" class="chart"></div>
            </section>
        </div>
    </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts';
import { ElMessage } from 'element-plus';
import { generateForecast72h } from '../../utils/pipelineMockGenerator.js';
import { evaluateCurrentRisk, evaluateRiskWindow } from '../../utils/pipelineRiskService.js';
import { syncPipelineWarningsFromRisk, syncPipelineWarningsFromWindow } from '../../utils/pipelineWarningService.js';
import {
    getCurrentConfig,
    getForecastList,
    getRiskHistory,
    getThresholdList,
    saveForecastList,
    saveRiskHistory
} from '../../utils/pipelineStorage.js';

const props = defineProps({
    pane: { type: String, default: 'left' },
    refreshKey: { type: Number, default: 0 }
});

const emit = defineEmits(['data-change']);

const config = ref(null);
const forecastList = ref([]);
const thresholdList = ref([]);
const riskResult = ref(null);
const windowResult = ref({ results: [] });
const stressChartRef = ref(null);
const trendChartRef = ref(null);
let stressChart = null;
let trendChart = null;

const formatNumber = (value, digits = 2) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '--';
    return Number(value).toFixed(digits);
};

const riskClass = (level) => ({
    绿色: 'pipe-risk-green',
    黄色: 'pipe-risk-yellow',
    橙色: 'pipe-risk-orange',
    红色: 'pipe-risk-red'
}[level] || 'pipe-risk-green');

const summaryCards = computed(() => {
    const forecast = forecastList.value[0] || {};
    const result = riskResult.value || {};

    return [
        { label: '矿区', value: config.value?.miningArea || '--' },
        { label: '海况', value: forecast.seaState ? `${forecast.seaState}级` : '--' },
        { label: '表层流速', value: `${formatNumber(forecast.surfaceCurrent, 2)} m/s` },
        { label: '底层流速', value: `${formatNumber(forecast.bottomCurrent, 2)} m/s` },
        { label: '综合应力', value: `${formatNumber(result.estimatedStress, 1)} MPa` },
        { label: '许用应力', value: `${formatNumber(result.allowableStress, 1)} MPa` }
    ];
});

const matchedText = computed(() => {
    const item = riskResult.value?.matchedThreshold;
    if (!item) return '暂无匹配工况';
    return `${item.waterDepth} m，${item.seaState}级海况，表层流速${item.surfaceCurrent} m/s，底层流速${item.bottomCurrent} m/s，${item.topConstraint}，${item.pipeSize}`;
});

const colorForRisk = (level) => ({
    绿色: '#4ade80',
    黄色: '#facc15',
    橙色: '#fb923c',
    红色: '#f87171'
}[level] || '#67e8f9');

const renderCharts = async () => {
    await nextTick();
    if (props.pane !== 'right' || !stressChartRef.value || !trendChartRef.value || !riskResult.value) return;

    stressChart = stressChart || echarts.init(stressChartRef.value);
    trendChart = trendChart || echarts.init(trendChartRef.value);

    stressChart.setOption({
        backgroundColor: 'transparent',
        grid: { left: 42, right: 14, top: 18, bottom: 28 },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: ['综合应力', '许用应力', '屈服强度'], axisLabel: { color: '#f8fafc' } },
        yAxis: { type: 'value', axisLabel: { color: '#f8fafc' }, splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } } },
        series: [{
            type: 'bar',
            barWidth: 30,
            data: [
                { value: riskResult.value.estimatedStress, itemStyle: { color: colorForRisk(riskResult.value.riskLevel) } },
                { value: riskResult.value.allowableStress, itemStyle: { color: '#38bdf8' } },
                { value: riskResult.value.yieldStrength, itemStyle: { color: '#a78bfa' } }
            ]
        }]
    });

    const results = windowResult.value.results || [];
    trendChart.setOption({
        backgroundColor: 'transparent',
        legend: { top: 0, textStyle: { color: '#cbd5e1' } },
        grid: { left: 38, right: 14, top: 34, bottom: 32 },
        tooltip: { trigger: 'axis' },
        xAxis: {
            type: 'category',
            data: results.map((item) => item.forecast.forecastTime.slice(5, 16)),
            axisLabel: { color: '#f8fafc', rotate: 28 }
        },
        yAxis: { type: 'value', axisLabel: { color: '#f8fafc' }, splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } } },
        series: [
            { name: '表层流速', type: 'line', smooth: true, data: results.map((item) => item.forecast.surfaceCurrent), color: '#38bdf8' },
            { name: '底层流速', type: 'line', smooth: true, data: results.map((item) => item.forecast.bottomCurrent), color: '#22c55e' },
            {
                name: '风险等级',
                type: 'bar',
                barWidth: 8,
                data: results.map((item) => ({
                    value: ['绿色', '黄色', '橙色', '红色'].indexOf(item.riskLevel) + 1,
                    itemStyle: { color: colorForRisk(item.riskLevel) }
                }))
            }
        ]
    });
};

const evaluate = () => {
    config.value = getCurrentConfig();
    forecastList.value = getForecastList();
    thresholdList.value = getThresholdList();

    if (!config.value || !forecastList.value.length) {
        ElMessage.warning('缺少当前配置或模拟预报数据');
        return;
    }

    riskResult.value = evaluateCurrentRisk(config.value, forecastList.value[0], thresholdList.value);
    windowResult.value = evaluateRiskWindow(config.value, forecastList.value, thresholdList.value);

    if (props.pane === 'left') {
        const history = getRiskHistory();
        saveRiskHistory([riskResult.value, ...history].slice(0, 50));
        syncPipelineWarningsFromRisk(riskResult.value);
        syncPipelineWarningsFromWindow(windowResult.value);
    }

    renderCharts();
};

const regenerateForecast = () => {
    const currentConfig = getCurrentConfig();
    const nextForecast = generateForecast72h(currentConfig?.miningArea || 'CC区');
    saveForecastList(nextForecast);
    emit('data-change');
    ElMessage.success('模拟预报已重新生成');
    evaluate();
};

const resizeCharts = () => {
    stressChart?.resize();
    trendChart?.resize();
};

watch(() => props.refreshKey, evaluate);

onMounted(() => {
    evaluate();
    window.addEventListener('resize', resizeCharts);
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', resizeCharts);
    stressChart?.dispose();
    trendChart?.dispose();
});
</script>

<style scoped>
.mini-card {
    min-width: 0;
    border: 1px solid rgba(51, 65, 85, 0.62);
    background: rgba(15, 23, 42, 0.5);
    padding: 0.5rem;
}

.mini-card span,
.risk-card span {
    display: block;
    color: #93c5fd;
    font-size: 0.72rem;
}

.mini-card strong {
    display: block;
    margin-top: 0.25rem;
    overflow: hidden;
    color: #ffffff;
    font-size: 0.86rem;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.risk-card {
    border: 1px solid currentColor;
    background: rgba(15, 23, 42, 0.58);
    padding: 0.75rem;
}

.risk-card strong {
    display: block;
    margin-top: 0.25rem;
    font-size: 2rem;
    line-height: 1;
}

.chart {
    height: calc(100% - 1.75rem);
    min-height: 10rem;
}

p {
    margin-top: 0.4rem;
    color: #cbd5e1;
    line-height: 1.65;
}
</style>
