<template>
    <div class="pipe-pane">
        <div v-if="pane === 'left'" class="pipe-scroll custom-scrollbar space-y-3">
            <section class="pipe-section">
                <div class="pipe-section-title mb-3">窗口条件</div>
                <div class="space-y-3">
                    <div>
                        <div class="pipe-label">当前配置</div>
                        <select v-model="selectedConfigId" class="pipe-select">
                            <option v-for="item in configList" :key="item.id" :value="item.id">
                                {{ item.projectName }} / {{ item.pipeSize }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <div class="pipe-label">作业类型</div>
                        <select v-model="operationType" class="pipe-select">
                            <option value="布放">布放</option>
                            <option value="采矿">采矿</option>
                            <option value="回收">回收</option>
                            <option value="撤离">撤离</option>
                        </select>
                    </div>
                    <button class="pipe-btn w-full" type="button" @click="generateWindow">生成作业窗口</button>
                </div>
            </section>

            <section v-if="windowResult" class="pipe-section space-y-3">
                <div class="metric-box">
                    <span>最早高风险到达时间</span>
                    <strong>{{ windowResult.earliestHighRiskTime || '未来72小时未出现' }}</strong>
                </div>
                <div class="metric-box">
                    <span>可作业窗口数量</span>
                    <strong>{{ windowResult.availableWindows.length }}</strong>
                </div>
                <div class="advice-box">{{ windowResult.summarySuggestion }}</div>
            </section>
        </div>

        <div v-else class="grid h-full min-h-0 grid-rows-[13rem_minmax(0,1fr)] gap-3">
            <section class="pipe-section min-h-0">
                <div class="pipe-section-title mb-2">未来72小时风险时间轴</div>
                <div ref="timelineChartRef" class="chart"></div>
            </section>

            <div class="grid min-h-0 grid-cols-[minmax(0,1fr)_12rem] gap-3">
                <section class="pipe-section min-h-0 overflow-y-auto custom-scrollbar">
                    <div class="pipe-section-title mb-2">逐时次风险结果</div>
                    <table class="pipe-table">
                        <thead>
                            <tr>
                                <th>时间</th>
                                <th>海况</th>
                                <th>应力</th>
                                <th>风险</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in windowResult?.results || []" :key="row.forecast.forecastTime">
                                <td>{{ row.forecast.forecastTime.slice(5) }}</td>
                                <td>{{ row.forecast.seaState }}级</td>
                                <td>{{ formatNumber(row.estimatedStress, 0) }}</td>
                                <td><span :class="['pipe-risk-tag', riskClass(row.riskLevel)]">{{ row.riskLevel }}</span></td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                <section class="pipe-section min-h-0 overflow-y-auto custom-scrollbar">
                    <div class="pipe-section-title mb-2">可作业窗口</div>
                    <div v-if="windowResult?.availableWindows?.length" class="space-y-2">
                        <div v-for="window in windowResult.availableWindows" :key="`${window.startTime}-${window.endTime}`" class="window-card">
                            <strong>{{ window.durationHours }}h</strong>
                            <span>{{ window.startTime.slice(5) }}</span>
                            <span>{{ window.endTime.slice(5) }}</span>
                        </div>
                    </div>
                    <div v-else class="empty-text">暂无连续安全窗口</div>
                </section>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts';
import { ElMessage } from 'element-plus';
import { evaluateRiskWindow } from '../../utils/pipelineRiskService.js';
import { syncPipelineWarningsFromWindow } from '../../utils/pipelineWarningService.js';
import { getConfigList, getForecastList, getThresholdList } from '../../utils/pipelineStorage.js';

const props = defineProps({
    pane: { type: String, default: 'left' },
    refreshKey: { type: Number, default: 0 },
    windowRequest: { type: Object, default: null }
});

const emit = defineEmits(['window-request']);

const configList = ref([]);
const selectedConfigId = ref(null);
const operationType = ref('布放');
const windowResult = ref(null);
const timelineChartRef = ref(null);
let timelineChart = null;

const selectedConfig = computed(() => {
    const config = configList.value.find((item) => item.id === selectedConfigId.value) || configList.value[0];
    return config ? { ...config, operationType: operationType.value } : null;
});

const loadOptions = () => {
    configList.value = getConfigList();
    const active = configList.value.find((item) => item.enabled) || configList.value[0];
    if (!selectedConfigId.value) selectedConfigId.value = active?.id || null;
    if (active?.operationType && operationType.value === '布放') operationType.value = active.operationType;
};

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

const riskScore = (level) => ['绿色', '黄色', '橙色', '红色'].indexOf(level) + 1;
const colorForRisk = (level) => ({ 绿色: '#4ade80', 黄色: '#facc15', 橙色: '#fb923c', 红色: '#f87171' }[level] || '#67e8f9');

const renderChart = async () => {
    await nextTick();
    if (props.pane !== 'right' || !timelineChartRef.value || !windowResult.value) return;

    timelineChart = timelineChart || echarts.init(timelineChartRef.value);
    const results = windowResult.value.results || [];

    timelineChart.setOption({
        backgroundColor: 'transparent',
        grid: { left: 30, right: 12, top: 10, bottom: 34 },
        tooltip: { trigger: 'axis' },
        xAxis: {
            type: 'category',
            data: results.map((item) => item.forecast.forecastTime.slice(5, 16)),
            axisLabel: { color: '#cbd5e1', rotate: 24 }
        },
        yAxis: {
            type: 'value',
            min: 0,
            max: 4,
            interval: 1,
            axisLabel: {
                color: '#94a3b8',
                formatter(value) {
                    return ['', '绿', '黄', '橙', '红'][value] || '';
                }
            },
            splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } }
        },
        series: [{
            type: 'bar',
            barWidth: 16,
            data: results.map((item) => ({
                value: riskScore(item.riskLevel),
                itemStyle: { color: colorForRisk(item.riskLevel) }
            }))
        }]
    });
};

const runWindow = (request = null) => {
    loadOptions();
    if (request?.configId) selectedConfigId.value = request.configId;
    if (request?.operationType) operationType.value = request.operationType;

    if (!selectedConfig.value) {
        ElMessage.warning('请先维护管道参数配置');
        return;
    }

    windowResult.value = evaluateRiskWindow(selectedConfig.value, getForecastList(), getThresholdList());
    if (props.pane === 'left') syncPipelineWarningsFromWindow(windowResult.value);
    renderChart();
};

const generateWindow = () => {
    runWindow();
    emit('window-request', {
        configId: selectedConfigId.value,
        operationType: operationType.value
    });
};

const resizeChart = () => timelineChart?.resize();

watch(() => props.refreshKey, () => runWindow());
watch(
    () => props.windowRequest,
    (request) => {
        if (request) runWindow(request);
    },
    { deep: true }
);

onMounted(() => {
    runWindow(props.windowRequest);
    window.addEventListener('resize', resizeChart);
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', resizeChart);
    timelineChart?.dispose();
});
</script>

<style scoped>
.chart {
    height: calc(100% - 1.75rem);
    min-height: 8rem;
}

.metric-box,
.advice-box,
.window-card {
    border: 1px solid rgba(51, 65, 85, 0.72);
    background: rgba(15, 23, 42, 0.52);
    padding: 0.7rem;
}

.metric-box span,
.window-card span {
    display: block;
    color: #94a3b8;
    font-size: 0.74rem;
}

.metric-box strong,
.window-card strong {
    display: block;
    margin-top: 0.25rem;
    color: #f8fafc;
    font-size: 0.92rem;
}

.advice-box {
    color: #fde68a;
    line-height: 1.65;
}

.empty-text {
    border: 1px dashed rgba(148, 163, 184, 0.26);
    padding: 0.8rem;
    color: #94a3b8;
    text-align: center;
}
</style>
