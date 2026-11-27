<template>
    <transition name="slide-down">
        <div
            v-if="show"
            class="pointer-events-none absolute bottom-6 left-8 top-36 z-40 flex w-[29rem] flex-col gap-4 font-['Noto_Sans_SC']"
        >
            <section
                class="tech-panel-enhanced pointer-events-auto relative shrink-0 overflow-hidden p-5"
                style="clip-path: polygon(0 0, 100% 0, 100% 95%, 92% 100%, 0 100%);"
            >
                <div class="absolute left-0 top-0 h-[2px] w-full animate-pulse bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                <div class="corner-decoration corner-tl scale-125"></div>
                <div class="corner-decoration corner-tr scale-125"></div>

                <div class="mb-4 flex items-center border-b-2 border-cyan-500/40 pb-3">
                    <div class="mr-3 h-6 w-1.5 bg-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.8)]"></div>
                    <h3 class="text-[26px] leading-tight font-bold tracking-wider text-white">历史海况查询</h3>
                </div>

                <div class="space-y-3.5">
                    <div class="space-y-2.5">
                        <div class="flex items-center justify-between">
                            <div class="section-title">区域切换</div>
                            <span class="text-[15px] text-slate-400 tabular-nums">共 {{ quickAreas.length }} 个</span>
                        </div>
                        <div class="grid grid-cols-4 gap-2">
                            <button
                                v-for="area in quickAreas"
                                :key="area.areaKey || area.id"
                                type="button"
                                :title="getAreaTitle(area)"
                                :class="['query-btn', isSelectedArea(area) ? 'query-btn-active' : '']"
                                @click="emit('selectArea', area)"
                            >
                                <span>{{ getAreaShortLabel(area) }}</span>
                            </button>
                        </div>
                    </div>

                    <div class="border-t border-dashed border-slate-700/60 pt-3">
                        <div class="mb-2.5 flex items-center justify-between">
                            <div class="section-title">数据类型</div>
                        </div>
                        <div class="grid grid-cols-3 gap-2">
                            <button
                                v-for="option in dataTypeOptions"
                                :key="option.value"
                                type="button"
                                :class="['filter-btn', filters.dataType === option.value ? 'filter-btn-active' : '']"
                                @click="updateFilters({ dataType: option.value, page: 1 })"
                            >
                                {{ option.label }}
                            </button>
                        </div>
                    </div>

                    <div class="current-area-strip">
                        <span>当前区域</span>
                        <strong>{{ selectedAreaTitle }}</strong>
                        <em>{{ selectedPointText }}</em>
                    </div>
                    <div v-if="errorMessage" class="warning-box">{{ errorMessage }}</div>
                </div>
            </section>

            <section
                class="tech-panel-enhanced pointer-events-auto relative flex min-h-0 flex-1 flex-col overflow-hidden p-5"
                style="clip-path: polygon(0 0, 92% 0, 100% 7%, 100% 100%, 0 100%);"
            >
                <div class="absolute left-0 top-0 h-[2px] w-full animate-pulse bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                <div class="corner-decoration corner-bl scale-125"></div>
                <div class="corner-decoration corner-br scale-125"></div>

                <div class="mb-3 flex shrink-0 items-center justify-between">
                    <div class="section-title">历史海况列表</div>
                    <span class="text-[15px] text-slate-400 tabular-nums">共 {{ totalRecords }} 条</span>
                </div>

                <div class="custom-scrollbar min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-2">
                    <div v-if="loading" class="empty-box">正在加载历史海况数据...</div>
                    <div v-else-if="errorMessage" class="empty-box">历史海况列表暂不可用</div>
                    <div v-else-if="!records.length" class="empty-box">当前查询条件暂无历史海况记录</div>
                    <template v-else>
                        <button
                            v-for="record in records"
                            :key="record.key"
                            type="button"
                            :class="['event-card', isSelectedRecord(record) ? 'event-card-active' : '']"
                            @click="emit('selectRecord', record)"
                        >
                            <div class="flex items-center justify-between gap-3">
                                <div class="truncate text-[18px] font-bold text-white tabular-nums">{{ record.monthLabel || record.key }}</div>
                            </div>
                            <div class="event-metric-grid">
                                <template v-if="filters.dataType === 'wind'">
                                    <div><span>风速</span><strong>{{ formatMetric(record.windSpeed, 1) }} m/s</strong></div>
                                    <div><span>阵风</span><strong>{{ formatMetric(record.gust, 1) }} m/s</strong></div>
                                    <div><span>风向</span><strong>{{ formatDirection(record.windDirection) }}</strong></div>
                                </template>
                                <template v-else-if="filters.dataType === 'current'">
                                    <div><span>流速</span><strong>{{ formatMetric(record.currentSpeed, 2) }} m/s</strong></div>
                                    <div><span>流向</span><strong>{{ formatDirection(record.currentDirection) }}</strong></div>
                                    <div><span>水深</span><strong>{{ formatMetric(record.currentDepthMeters, 2) }} m</strong></div>
                                </template>
                                <template v-else>
                                    <div><span>浪高</span><strong>{{ formatMetric(record.waveHeight, 2) }} m</strong></div>
                                    <div><span>周期</span><strong>{{ formatMetric(record.wavePeriod, 1) }} s</strong></div>
                                    <div><span>浪向</span><strong>{{ formatDirection(record.waveDirection) }}</strong></div>
                                </template>
                            </div>
                        </button>
                    </template>
                </div>

                <div v-if="totalPages > 1" class="mt-3 flex shrink-0 items-center justify-between border-t border-slate-700/70 pt-3 text-[15px]">
                    <button class="pager-btn" type="button" :disabled="page <= 1" @click="emit('pageChange', Math.max(1, page - 1))">
                        上一页
                    </button>
                    <span class="text-slate-200 font-semibold tabular-nums">第 {{ page }} / {{ totalPages }} 页</span>
                    <button class="pager-btn" type="button" :disabled="page >= totalPages" @click="emit('pageChange', Math.min(totalPages, page + 1))">
                        下一页
                    </button>
                </div>
            </section>
        </div>
    </transition>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    loading: {
        type: Boolean,
        default: false
    },
    quickAreas: {
        type: Array,
        default: () => []
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
    totalRecords: {
        type: Number,
        default: 0
    },
    page: {
        type: Number,
        default: 1
    },
    pageSize: {
        type: Number,
        default: 8
    },
    filters: {
        type: Object,
        default: () => ({
            dataType: 'wave'
        })
    },
    errorMessage: {
        type: String,
        default: ''
    },
    selectedRecord: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['selectArea', 'selectRecord', 'pageChange', 'filtersChange']);

const dataTypeOptions = [
    { value: 'wind', label: '风场' },
    { value: 'wave', label: '海浪' },
    { value: 'current', label: '洋流' }
];

const selectedAreaTitle = computed(() => (
    props.selectedArea?.regionName
    || props.selectedArea?.regionCode
    || props.selectedArea?.contractor
    || props.selectedArea?.name
    || '--'
));

const selectedPointText = computed(() => {
    const lat = Number(props.selectedPoint?.lat);
    const lon = Number(props.selectedPoint?.lon ?? props.selectedPoint?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return '--';
    }

    return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
});

const totalPages = computed(() => (
    Math.max(1, Math.ceil((Number(props.totalRecords) || 0) / (Number(props.pageSize) || 1)))
));

const getAreaTitle = (area) => (
    area?.regionName || area?.regionCode || area?.contractor || area?.name || area?.id || '--'
);

const getAreaShortLabel = (area) => {
    const source = getAreaTitle(area);
    return String(source).replace(/^环境特别受关注区/, 'APEI').replace(/\s*\(CCZ\)\s*/i, '');
};

const isSelectedArea = (area) => {
    const currentKey = String(props.selectedArea?.areaKey || props.selectedArea?.id || getAreaTitle(props.selectedArea));
    const areaKey = String(area?.areaKey || area?.id || getAreaTitle(area));
    return Boolean(currentKey) && currentKey === areaKey;
};

const isSelectedRecord = (record) => (
    Boolean(record?.key) && record.key === props.selectedRecord?.key
);

const updateFilters = (patch) => {
    emit('filtersChange', {
        ...props.filters,
        ...patch
    });
};

const formatMetric = (value, digits = 1) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return '--';
    }

    return Number(value).toFixed(Number(digits));
};

const formatDirection = (value) => (
    value === null || value === undefined || Number.isNaN(Number(value))
        ? '--'
        : `${Number(value).toFixed(0)}°`
);

const getRecordAvailabilityLabel = (record) => {
    const labels = [];
    if (record?.hasWind) labels.push('风');
    if (record?.hasWave) labels.push('浪');
    if (record?.hasCurrent) labels.push('流');
    return labels.length ? labels.join(' / ') : '--';
};
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.24s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
    opacity: 0;
    transform: translateY(-14px);
}

.section-title {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    color: #67e8f9;
    font-size: 17px;
    font-weight: 800;
}

.section-title::before {
    content: '';
    width: 0.375rem;
    height: 0.375rem;
    border-radius: 999px;
    background: #22d3ee;
    box-shadow: 0 0 8px rgba(34, 211, 238, 0.6);
}

.query-btn {
    min-width: 0;
    min-height: 2.6rem;
    overflow: hidden;
    border: 1px solid rgba(51, 65, 85, 0.72);
    border-radius: 0.125rem;
    background: rgba(30, 41, 59, 0.55);
    padding: 0.35rem 0.45rem;
    color: #d7e6f2;
    font-size: 16px;
    font-weight: 700;
    text-align: center;
    transform: skewX(-10deg);
    transition: all 0.18s ease;
}

.query-btn span {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    transform: skewX(10deg);
    white-space: nowrap;
}

.query-btn:hover,
.query-btn-active {
    border-color: #93c5fd;
    background: linear-gradient(90deg, #2563eb, #3b82f6);
    color: #ffffff;
    box-shadow: 0 0 10px rgba(37, 99, 235, 0.6);
}

.current-area-strip {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.6rem;
    border: 1px solid rgba(34, 211, 238, 0.24);
    background: rgba(15, 23, 42, 0.58);
    padding: 0.65rem 0.8rem;
}

.current-area-strip span,
.current-area-strip em {
    color: #9bbad0;
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
}

.current-area-strip strong {
    overflow: hidden;
    color: #ffffff;
    font-size: 16px;
    font-weight: 800;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.filter-btn,
.pager-btn {
    border: 1px solid rgba(71, 85, 105, 0.8);
    border-radius: 0.125rem;
    background: rgba(15, 23, 42, 0.68);
    padding: 0.5rem 0.55rem;
    color: #d7e6f2;
    font-size: 16px;
    font-weight: 700;
    transition: all 0.18s ease;
}

.filter-btn:hover,
.filter-btn-active,
.pager-btn:hover:not(:disabled) {
    border-color: rgba(34, 211, 238, 0.55);
    background: rgba(8, 47, 73, 0.72);
    color: #ffffff;
}

.event-card {
    width: 100%;
    border: 1px solid rgba(71, 85, 105, 0.72);
    border-radius: 0.125rem;
    background: rgba(8, 15, 28, 0.68);
    padding: 0.8rem;
    text-align: left;
    transition: all 0.18s ease;
}

.event-card:hover,
.event-card-active {
    border-color: rgba(34, 211, 238, 0.55);
    background: rgba(13, 33, 53, 0.84);
    box-shadow: 0 0 12px rgba(34, 211, 238, 0.14);
}

.event-metric-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.45rem;
    margin-top: 0.6rem;
}

.event-metric-grid div {
    min-width: 0;
    border: 1px solid rgba(51, 65, 85, 0.6);
    background: rgba(15, 23, 42, 0.48);
    padding: 0.48rem 0.52rem;
}

.event-metric-grid span {
    display: block;
    color: #9bbad0;
    font-size: 14px;
    font-weight: 500;
}

.event-metric-grid strong {
    display: block;
    margin-top: 0.22rem;
    overflow: hidden;
    color: #ffffff;
    font-size: 16px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.impact-badge {
    flex-shrink: 0;
    border: 1px solid currentColor;
    padding: 0.15rem 0.45rem;
    color: #cbd5e1;
    font-size: 14px;
    font-weight: 800;
}

.impact-outer {
    color: #38bdf8;
}

.empty-box,
.warning-box {
    border: 1px dashed rgba(71, 85, 105, 0.72);
    padding: 1rem;
    color: #9bbad0;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.55;
    text-align: center;
}

.warning-box {
    border-color: rgba(250, 204, 21, 0.34);
    background: rgba(71, 52, 12, 0.36);
    color: #fde68a;
}

.pager-btn {
    min-width: 5.2rem;
    font-size: 15px;
}

.pager-btn:disabled {
    cursor: not-allowed;
    opacity: 0.45;
}

.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.35);
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: rgba(34, 211, 238, 0.38);
}
</style>
