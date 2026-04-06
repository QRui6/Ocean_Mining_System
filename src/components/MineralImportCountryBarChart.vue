<template>
    <div class="h-full rounded border border-cyan-500/25 bg-slate-950/55 p-3 flex flex-col overflow-hidden">
        <div class="flex items-start justify-between gap-3 mb-3">
            <div class="min-w-0">
                <div class="text-sm font-semibold text-white truncate">{{ commodityName || '来源国对比' }}</div>
                <div class="text-[11px] text-cyan-200/80 mt-1">
                    {{ countrySummary }}
                </div>
            </div>
            <div v-if="rankText" class="text-right shrink-0">
                <div class="text-[11px] text-cyan-300 tracking-wide">当前排名</div>
                <div class="text-lg font-bold font-['Orbitron']" :style="{ color: themeColor }">{{ rankText }}</div>
            </div>
        </div>

        <div v-if="chartRows.length" ref="chartRef" class="flex-1 min-h-[18rem]"></div>

        <div
            v-else
            class="flex-1 min-h-[18rem] rounded border border-dashed border-slate-600/70 bg-slate-900/35 flex items-center justify-center text-sm text-slate-300 text-center px-4"
        >
            当前矿种缺少可绘制的来源国数据
        </div>
    </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts';
import { getMineralImportById, normalizeMineralImportCountryName } from '../data/mineralImportData.js';

const props = defineProps({
    commodityId: {
        type: String,
        default: ''
    },
    commodityName: {
        type: String,
        default: ''
    },
    countryName: {
        type: String,
        default: ''
    },
    themeColor: {
        type: String,
        default: '#22d3ee'
    }
});

const chartRef = ref(null);
let chartInstance = null;
let resizeObserver = null;

const normalizeCountry = (countryName) => normalizeMineralImportCountryName(countryName || '').trim();

const currentCountry = computed(() => normalizeCountry(props.countryName));

const commodityData = computed(() => getMineralImportById(props.commodityId));

const chartRows = computed(() => {
    const sources = commodityData.value?.sources || [];

    return sources
        .map((source) => {
            const value = Number.parseFloat(String(source?.volume || '').replace(/,/g, '').trim());
            const shareValue = Number.parseFloat(String(source?.share || '').replace('%', '').trim());
            const normalizedCountry = normalizeCountry(source?.country);

            return {
                country: normalizedCountry || String(source?.country || '').trim() || '未知',
                rawCountry: String(source?.country || '').trim(),
                value: Number.isFinite(value) ? value : null,
                shareValue: Number.isFinite(shareValue) ? shareValue : null,
                volumeDisplay: source?.unit ? `${source.volume}${source.unit}` : (source?.volume || '未披露'),
                share: source?.share || '',
                yoy: source?.yoy || '',
                note: source?.note || '',
                dataQualityNote: source?.dataQualityNote || '',
                unit: source?.unit || ''
            };
        })
        .filter((row) => Number.isFinite(row.value))
        .sort((a, b) => b.value - a.value);
});

const currentRank = computed(() => chartRows.value.findIndex((row) => row.country === currentCountry.value));

const rankText = computed(() => {
    if (currentRank.value < 0) return '';
    return `${currentRank.value + 1}/${chartRows.value.length}`;
});

const countrySummary = computed(() => {
    if (!currentCountry.value) return '显示当前矿种来源国对比';
    if (currentRank.value < 0) return `当前国家：${currentCountry.value}`;
    return `当前国家：${currentCountry.value}，柱状图中已高亮显示`;
});

const detectedUnit = computed(() => chartRows.value.find((row) => row.unit)?.unit || '');

const createBarColor = (isCurrent) => {
    if (isCurrent) {
        return new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: props.themeColor },
            { offset: 1, color: 'rgba(8, 145, 178, 0.35)' }
        ]);
    }

    return new echarts.graphic.LinearGradient(1, 0, 0, 0, [
        { offset: 0, color: 'rgba(148, 163, 184, 0.72)' },
        { offset: 1, color: 'rgba(71, 85, 105, 0.25)' }
    ]);
};

const buildTooltipHtml = (row) => {
    const rows = [
        `<div style="font-weight:700;color:#ffffff;margin-bottom:6px;">${row.country}</div>`,
        `<div>进口量：${row.volumeDisplay || '未披露'}</div>`
    ];

    if (row.share) rows.push(`<div>占比：${row.share}</div>`);
    if (row.yoy) rows.push(`<div>同比：${row.yoy}</div>`);
    if (row.note) rows.push(`<div style="margin-top:6px;color:#fde68a;">说明：${row.note}</div>`);
    if (row.dataQualityNote) rows.push(`<div style="margin-top:6px;color:#a5f3fc;">口径：${row.dataQualityNote}</div>`);

    return rows.join('');
};

const ensureResizeObserver = () => {
    if (resizeObserver || typeof ResizeObserver === 'undefined' || !chartRef.value) return;

    resizeObserver = new ResizeObserver(() => {
        chartInstance?.resize();
    });
    resizeObserver.observe(chartRef.value);
};

const ensureChartInstance = () => {
    if (!chartRef.value) return null;
    if (!chartInstance) {
        chartInstance = echarts.init(chartRef.value);
    }
    return chartInstance;
};

const renderChart = async () => {
    await nextTick();

    if (!chartRows.value.length) {
        chartInstance?.clear();
        return;
    }

    const instance = ensureChartInstance();
    if (!instance) return;
    ensureResizeObserver();

    const option = {
        animationDuration: 400,
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow',
                shadowStyle: {
                    color: 'rgba(34, 211, 238, 0.08)'
                }
            },
            backgroundColor: 'rgba(3, 7, 18, 0.96)',
            borderColor: props.themeColor,
            borderWidth: 1,
            textStyle: {
                color: '#e2e8f0',
                fontSize: 11,
                lineHeight: 18
            },
            formatter: (params) => {
                const row = chartRows.value[params?.[0]?.dataIndex ?? -1];
                return row ? buildTooltipHtml(row) : '';
            }
        },
        grid: {
            left: 78,
            right: 28,
            top: 12,
            bottom: 8,
            containLabel: false
        },
        xAxis: {
            type: 'value',
            name: detectedUnit.value ? `单位：${detectedUnit.value}` : '',
            nameTextStyle: {
                color: '#94a3b8',
                fontSize: 10,
                padding: [0, 0, 0, 6]
            },
            axisLine: {
                lineStyle: {
                    color: 'rgba(56, 189, 248, 0.35)'
                }
            },
            axisTick: {
                show: false
            },
            axisLabel: {
                color: '#cbd5e1',
                fontSize: 10
            },
            splitLine: {
                lineStyle: {
                    color: 'rgba(56, 189, 248, 0.12)'
                }
            }
        },
        yAxis: {
            type: 'category',
            inverse: true,
            data: chartRows.value.map((row) => row.country),
            axisTick: {
                show: false
            },
            axisLine: {
                show: false
            },
            axisLabel: {
                color: '#f8fafc',
                fontSize: 11,
                width: 60,
                overflow: 'truncate'
            }
        },
        series: [
            {
                type: 'bar',
                barWidth: 14,
                data: chartRows.value.map((row) => {
                    const isCurrent = row.country === currentCountry.value;
                    return {
                        value: row.value,
                        itemStyle: {
                            color: createBarColor(isCurrent),
                            borderRadius: [0, 7, 7, 0],
                            borderColor: isCurrent ? props.themeColor : 'rgba(148, 163, 184, 0.25)',
                            borderWidth: isCurrent ? 1.4 : 1
                        },
                        label: {
                            color: isCurrent ? '#ffffff' : '#cbd5e1'
                        }
                    };
                }),
                label: {
                    show: true,
                    position: 'right',
                    distance: 10,
                    fontSize: 10,
                    formatter: ({ dataIndex }) => chartRows.value[dataIndex]?.volumeDisplay || ''
                },
                emphasis: {
                    focus: 'series'
                }
            }
        ]
    };

    instance.setOption(option, true);
    instance.resize();
};

const disposeChart = () => {
    if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
    }

    if (chartInstance) {
        chartInstance.dispose();
        chartInstance = null;
    }
};

onMounted(async () => {
    await nextTick();
    ensureResizeObserver();
    renderChart();
});

watch(
    [chartRows, () => props.countryName, () => props.themeColor, () => props.commodityId, () => props.commodityName],
    () => {
        renderChart();
    },
    { deep: true }
);

onBeforeUnmount(() => {
    disposeChart();
});
</script>
