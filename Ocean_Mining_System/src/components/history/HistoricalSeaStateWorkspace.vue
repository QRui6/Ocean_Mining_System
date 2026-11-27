<template>
    <transition name="workspace-fade">
        <div v-if="show" class="pointer-events-none absolute right-6 top-36 bottom-6 z-40 w-[30rem] font-['Noto_Sans_SC']">
            <section aria-label="历史海况统计"
                class="tech-panel-enhanced pointer-events-auto relative flex h-full min-h-0 flex-col overflow-hidden">
                <div class="corner-decoration corner-tl"></div>
                <div class="corner-decoration corner-br"></div>
                <section class="flex min-h-0 flex-1 flex-col p-5">
                    <header class="flex shrink-0 items-center justify-between border-b border-cyan-500/30 pb-3">
                        <h3 class="text-[24px] leading-tight font-bold text-white">历史海况统计</h3>
                        <button class="floating-panel-close-btn floating-panel-close-btn--inline" type="button"
                            aria-label="关闭历史海况统计" title="关闭" @click="emit('close')">✕</button>
                    </header>
                    <div class="my-3 flex shrink-0 justify-between gap-3 text-[16px] font-bold">
                        <span class="text-cyan-200">年均{{ metric.label }}</span>
                        <span class="text-slate-300 tabular-nums">{{ yearsLabel }}</span>
                    </div>
                    <div v-if="loading" class="m-auto text-[16px] text-slate-300" role="status">加载中</div>
                    <div v-else-if="errorMessage" class="m-auto text-[16px] text-rose-200" role="status">{{ errorMessage }}</div>
                    <div v-else-if="!annualRecords.length" class="m-auto text-[16px] text-slate-400">暂无数据</div>
                    <div v-else ref="trendRef" role="img" :aria-label="'年均' + metric.label + '折线图'" class="min-h-0 flex-1"></div>
                </section>

                <section aria-label="历年同期分布" class="flex min-h-0 flex-1 flex-col border-t border-cyan-500/30 p-5">
                    <header class="flex shrink-0 items-center justify-between gap-3">
                        <h3 class="text-[24px] leading-tight font-bold text-white">历年同期分布</h3>
                        <div class="flex items-center gap-3 text-[16px]">
                            <span v-if="month && !loading && !errorMessage" class="font-semibold text-cyan-200">{{ month }}月</span>
                            <button type="button" class="rounded-sm border border-cyan-500/40 bg-cyan-950/40 px-3 py-1.5 text-[15px] font-bold text-cyan-100 hover:border-cyan-300 hover:text-white disabled:opacity-50"
                                :disabled="loading || !!errorMessage || !sameMonthRecords.length" @click="showDetails = !showDetails">
                                {{ showDetails ? '分布' : '明细' }}
                            </button>
                        </div>
                    </header>
                    <template v-if="!loading && !errorMessage">
                        <div v-if="!sameMonthRecords.length" class="m-auto text-[16px] text-slate-400">暂无数据</div>
                        <div v-else-if="showDetails" class="custom-scrollbar mt-3 min-h-0 flex-1 overflow-auto">
                            <table class="w-full text-[16px] tabular-nums text-slate-200">
                                <thead class="sticky top-0 bg-slate-900">
                                    <tr>
                                        <th scope="col" class="p-2.5 text-left text-slate-400 font-semibold">年份</th>
                                        <th scope="col" class="p-2.5 text-right text-slate-400 font-semibold">{{ metric.label }}（{{ metric.unit }}）</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="record in sameMonthRecords" :key="record.year" class="border-t border-slate-700">
                                        <td class="p-2.5 text-slate-200">{{ record.year }}</td>
                                        <td class="p-2.5 text-right font-bold text-white">{{ record.value.toFixed(2) }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div v-else ref="distributionRef" role="img" :aria-label="month + '月' + metric.label + '分布图'"
                            class="mt-3 min-h-0 flex-1"></div>
                    </template>
                </section>
            </section>
        </div>
    </transition>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import * as echarts from 'echarts';
import { calculateAnnualSeaState } from '../../api/historicalSeaState.js';
import {
    CHART_FONT_FAMILY,
    CHART_COLORS,
    chartAxisLabel,
    chartAxisName,
    chartTooltipStyle
} from '../../utils/chartTypography.js';

const props = defineProps({
    show: Boolean,
    loading: Boolean,
    records: { type: Array, default: () => [] },
    selectedRecord: Object,
    dataType: String,
    errorMessage: String
});
const emit = defineEmits(['close']);
const metrics = {
    wind: { field: 'windSpeed', label: '风速', unit: 'm/s' },
    wave: { field: 'waveHeight', label: '浪高', unit: 'm' },
    current: { field: 'currentSpeed', label: '流速', unit: 'm/s' }
};
const metric = computed(() => metrics[props.dataType] || metrics.wave);
const annualRecords = computed(() => calculateAnnualSeaState(props.records, metric.value.field));
const yearsLabel = computed(() => {
    const first = annualRecords.value[0]?.year;
    const last = annualRecords.value.at(-1)?.year;
    if (first === undefined) return '';
    return first === last ? String(first) : first + '—' + last;
});

const recordMonth = record => {
    const month = Number(record?.month ?? record?.key?.slice(5, 7));
    return Number.isInteger(month) && month >= 1 && month <= 12 ? month : null;
};
const month = computed(() => recordMonth(props.selectedRecord) ?? recordMonth(props.records[0]));
const sameMonthRecords = computed(() => {
    const records = props.records.filter(record => recordMonth(record) === month.value);
    return calculateAnnualSeaState(records, metric.value.field).filter(record => record.value !== null);
});
const showDetails = ref(false);
const trendRef = ref(null);
const distributionRef = ref(null);
const axisLabel = chartAxisLabel({ hideOverlap: true });
const axisLine = { lineStyle: { color: CHART_COLORS.axisLine } };
const splitLine = { lineStyle: { color: CHART_COLORS.splitLine } };
const nameTextStyle = chartAxisName();

const trendOptions = computed(() => {
    const { label, unit } = metric.value;
    const records = annualRecords.value;
    return {
        backgroundColor: 'transparent',
        textStyle: { color: CHART_COLORS.secondary, fontFamily: CHART_FONT_FAMILY },
        tooltip: chartTooltipStyle({
            trigger: 'axis',
            valueFormatter: value => value == null ? '—' : Number(value).toFixed(2) + ' ' + unit
        }),
        grid: { top: 40, left: 54, right: 22, bottom: 40 },
        xAxis: {
            type: 'category',
            data: records.map(record => String(record.year)),
            boundaryGap: false,
            axisLabel,
            axisLine
        },
        yAxis: {
            type: 'value',
            name: unit,
            scale: true,
            nameTextStyle,
            axisLabel,
            splitLine
        },
        series: [{
            name: '年均' + label,
            type: 'line',
            data: records.map(record => record.value),
            showAllSymbol: true,
            symbol: 'circle',
            symbolSize: 6,
            connectNulls: false,
            lineStyle: { color: '#22d3ee', width: 2.5 },
            itemStyle: { color: '#22d3ee', borderColor: '#d9faff', borderWidth: 1 }
        }]
    };
});

const distributionOptions = computed(() => {
    const values = sameMonthRecords.value.map(record => record.value);
    if (!values.length) return null;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const count = min === max ? 1 : Math.min(8, Math.ceil(Math.sqrt(values.length)));
    const width = (max - min) / count;
    const digits = width > 0 ? Math.min(5, Math.max(2, Math.ceil(-Math.log10(width)))) : 2;
    const bins = new Array(count).fill(0);
    for (const value of values) {
        const index = width ? Math.min(count - 1, Math.floor((value - min) / width)) : 0;
        bins[index]++;
    }
    const ranges = bins.map((_, index) => width
        ? (min + index * width).toFixed(digits) + '–' + (min + (index + 1) * width).toFixed(digits)
        : min.toFixed(digits));

    return {
        backgroundColor: 'transparent',
        textStyle: { color: CHART_COLORS.secondary, fontFamily: CHART_FONT_FAMILY },
        tooltip: chartTooltipStyle({ trigger: 'axis', valueFormatter: value => value + ' 年' }),
        grid: { top: 38, left: 54, right: 38, bottom: 60 },
        xAxis: {
            type: 'category', name: metric.value.unit, nameGap: 8, nameTextStyle,
            data: ranges, axisLabel: chartAxisLabel({ rotate: 28, hideOverlap: true }), axisLine
        },
        yAxis: { type: 'value', name: '年份数', nameTextStyle, minInterval: 1, axisLabel, splitLine },
        series: [{ name: '年份数', type: 'bar', data: bins, barMaxWidth: 40, itemStyle: { color: '#38bdf8' } }]
    };
});

function bindChart(elementRef, options) {
    let chart;
    let observer;

    function dispose() {
        observer?.disconnect();
        chart?.dispose();
        observer = chart = null;
    }

    watch([elementRef, options, () => props.show], ([element, option, visible]) => {
        if (!element || !option || !visible) {
            dispose();
            return;
        }
        if (chart?.getDom() !== element) {
            dispose();
            chart = echarts.init(element);
            observer = new ResizeObserver(() => chart?.resize());
            observer.observe(element);
        }
        chart.setOption(option, true);
    }, { flush: 'post' });
    onBeforeUnmount(dispose);
}

bindChart(trendRef, trendOptions);
bindChart(distributionRef, distributionOptions);
</script>
