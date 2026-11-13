<template>
    <transition name="workspace-fade">
        <div v-if="show" class="pointer-events-none absolute inset-0 z-40 font-['Noto_Sans_SC']">
            <div class="pointer-events-none absolute bottom-6 left-8 top-36 w-[28rem]">
            <section
                class="tech-panel-enhanced pointer-events-auto relative flex h-full min-w-0 flex-col overflow-hidden p-5"
                style="clip-path: polygon(0 0, 100% 0, 100% 95%, 92% 100%, 0 100%);"
            >
                <div class="absolute left-0 top-0 h-[2px] w-full animate-pulse bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                <div class="corner-decoration corner-tl scale-125"></div>
                <div class="corner-decoration corner-tr scale-125"></div>

                <div class="mb-4 flex shrink-0 items-center border-b-2 border-cyan-500/40 pb-3">
                    <div class="mr-3 h-6 w-1.5 bg-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.8)]"></div>
                    <h3 class="min-w-0 flex-1 text-2xl font-bold tracking-wider text-white">监控事件</h3>
                    <button class="floating-panel-close-btn floating-panel-close-btn--inline" type="button" title="关闭监控事件" aria-label="关闭监控事件" @click="emit('close')">✕</button>
                </div>

                <div class="mb-3 grid shrink-0 grid-cols-3 gap-2">
                    <div class="border border-cyan-500/20 bg-slate-950/45 px-3 py-2">
                        <div class="text-xs text-slate-400">监控区</div>
                        <strong class="mt-1 block text-lg text-cyan-100">{{ areas.length }}</strong>
                    </div>
                    <div class="border border-cyan-500/20 bg-slate-950/45 px-3 py-2">
                        <div class="text-xs text-slate-400">预警记录</div>
                        <strong class="mt-1 block text-lg text-amber-100">{{ events.length }}</strong>
                    </div>
                    <div class="border border-cyan-500/20 bg-slate-950/45 px-3 py-2">
                        <div class="text-xs text-slate-400">数据状态</div>
                        <strong :class="['mt-1 block text-sm', statusClass]">{{ dataStatus }}</strong>
                    </div>
                </div>

                <div v-if="errorMessage" class="mb-3 shrink-0 border border-rose-500/35 bg-rose-950/30 p-3 text-sm text-rose-100">{{ errorMessage }}</div>

                <div class="mb-3 flex shrink-0 items-center justify-between">
                    <span class="text-sm font-bold tracking-wide text-cyan-200">监控区域</span>
                    <button class="text-xs font-bold text-cyan-300 transition-colors hover:text-white" type="button" @click="loadAreas">刷新</button>
                </div>

                <div class="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pr-2">
                    <div v-if="loading" class="flex h-full items-center justify-center text-sm text-slate-400">正在加载监控区域...</div>
                    <div v-else-if="!areas.length" class="flex h-full items-center justify-center border border-dashed border-slate-700/50 text-sm text-slate-500">当前没有已配置的监控区域</div>
                    <button
                        v-for="area in areas"
                        :key="area.id"
                        type="button"
                        :class="['w-full border px-3 py-3 text-left transition-all', selectedArea?.id === area.id ? 'border-cyan-300/70 bg-cyan-950/45' : 'border-slate-700/70 bg-slate-950/35 hover:border-cyan-500/45']"
                        @click="selectArea(area)"
                    >
                        <div class="flex items-start justify-between gap-3">
                            <div class="min-w-0">
                                <div class="truncate text-sm font-bold text-white">{{ area.name || `监控区域 ${area.id}` }}</div>
                                <div class="mt-1 text-xs text-slate-400">风速阈值 {{ formatMetric(area.thresholds?.windSpeed, 1) }} m/s · 浪高阈值 {{ formatMetric(area.thresholds?.waveHeight, 1) }} m</div>
                            </div>
                            <span class="shrink-0 text-xs text-amber-200">{{ area.warningCount ?? 0 }} 条</span>
                        </div>
                        <div class="mt-2 flex items-center justify-between border-t border-slate-700/60 pt-2 text-xs text-slate-400">
                            <span>区域内船舶 {{ area.shipCount ?? '--' }}</span>
                            <span>{{ area.isActive ? '已启用' : '已停用' }}</span>
                        </div>
                    </button>
                </div>
            </section>
            </div>

            <div class="pointer-events-none absolute bottom-6 right-6 top-36 w-[28rem]">
            <section
                class="tech-panel-enhanced pointer-events-auto relative flex h-full min-w-0 flex-col overflow-hidden p-5"
                style="clip-path: polygon(0 0, 92% 0, 100% 7%, 100% 100%, 0 100%);"
            >
                <div class="absolute left-0 top-0 h-[2px] w-full animate-pulse bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                <div class="corner-decoration corner-bl scale-125"></div>
                <div class="corner-decoration corner-br scale-125"></div>

                <div class="mb-3 shrink-0 border-b border-cyan-500/30 pb-3">
                    <div class="text-xl font-bold tracking-wide text-white">{{ selectedArea?.name || '事件详情' }}</div>
                    <div class="mt-1 text-xs text-slate-400">仅展示后端已记录事件；测试或过期记录不会被标识为实时预警。</div>
                </div>

                <div class="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pr-2">
                    <div v-if="eventsLoading" class="flex h-full items-center justify-center text-sm text-slate-400">正在加载事件记录...</div>
                    <div v-else-if="!selectedArea" class="flex h-full items-center justify-center border border-dashed border-slate-700/50 text-sm text-slate-500">请选择左侧监控区域</div>
                    <div v-else-if="!events.length" class="flex h-full items-center justify-center border border-dashed border-slate-700/50 text-sm text-slate-500">该监控区域暂无事件记录</div>
                    <article v-for="event in events" :key="event.id" class="border border-slate-700/70 bg-slate-950/35 p-3">
                        <div class="flex items-start justify-between gap-3">
                            <div class="min-w-0">
                                <div class="truncate text-sm font-bold text-white">{{ eventTitle(event) }}</div>
                                <div class="mt-1 text-xs text-slate-400">{{ formatTime(event.time) }} · MMSI {{ event.mmsi || '--' }}</div>
                            </div>
                            <span :class="['shrink-0 border px-2 py-0.5 text-xs font-bold', eventTone(event)]">{{ eventBadge(event) }}</span>
                        </div>
                        <div class="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-slate-700/60 pt-2 text-xs text-slate-400">
                            <span>风速 {{ formatMetric(event.weatherData?.windSpeed ?? event.data?.weather?.windspeed, 1) }} m/s</span>
                            <span>浪高 {{ formatMetric(event.weatherData?.waveHeight ?? event.data?.weather?.waveheight, 1) }} m</span>
                            <span>状态 {{ event.isResolved ? '已处理' : '待处理' }}</span>
                            <span>{{ event.weatherData?.test ? '测试样本' : freshnessLabel(event.time) }}</span>
                        </div>
                    </article>
                </div>
            </section>
            </div>
        </div>
    </transition>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { fetchMonitoringAreaEvents, fetchMonitoringAreas } from '../api/areaMonitoring.js';

const props = defineProps({ show: { type: Boolean, default: false } });
const emit = defineEmits(['close']);

const areas = ref([]);
const selectedArea = ref(null);
const events = ref([]);
const loading = ref(false);
const eventsLoading = ref(false);
const errorMessage = ref('');

const latestEventTime = computed(() => events.value.reduce((latest, event) => {
    const timestamp = new Date(event?.time || 0).getTime();
    return Number.isFinite(timestamp) && timestamp > latest ? timestamp : latest;
}, 0));

const isFresh = computed(() => latestEventTime.value > 0 && Date.now() - latestEventTime.value <= 6 * 60 * 60 * 1000);
const dataStatus = computed(() => !events.value.length ? '暂无记录' : (isFresh.value ? '当前记录' : '历史记录'));
const statusClass = computed(() => isFresh.value ? 'text-emerald-300' : 'text-amber-200');

const formatMetric = (value, digits = 1) => {
    const number = Number(value);
    return Number.isFinite(number) && number > -9000 ? number.toFixed(digits) : '--';
};

const formatTime = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--';
    return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
};

const freshnessLabel = (value) => {
    const time = new Date(value).getTime();
    if (!Number.isFinite(time)) return '时间未知';
    return Date.now() - time <= 6 * 60 * 60 * 1000 ? '当前记录' : '历史记录';
};

const eventTitle = (event) => event?.message || ({ enter: '船舶进入监控区域', leave: '船舶离开监控区域' }[event?.type] || '监控事件');
const eventBadge = (event) => event?.warningType ? (event.severity === 'high' ? '高风险' : '预警') : (event?.type === 'enter' ? '进入' : event?.type === 'leave' ? '离开' : '事件');
const eventTone = (event) => event?.warningType ? 'border-amber-400/45 bg-amber-950/35 text-amber-100' : 'border-cyan-500/35 bg-cyan-950/30 text-cyan-100';

const selectArea = async (area) => {
    selectedArea.value = area;
    events.value = [];
    eventsLoading.value = true;
    errorMessage.value = '';
    try {
        const data = await fetchMonitoringAreaEvents(area.id);
        events.value = Array.isArray(data) ? data : [];
    } catch (error) {
        errorMessage.value = `监控事件暂不可用：${error.message || '接口请求失败'}`;
    } finally {
        eventsLoading.value = false;
    }
};

const loadAreas = async () => {
    loading.value = true;
    errorMessage.value = '';
    try {
        const data = await fetchMonitoringAreas();
        areas.value = Array.isArray(data) ? data : [];
        const target = areas.value.find((area) => area.id === selectedArea.value?.id) || areas.value[0];
        if (target) await selectArea(target);
        else {
            selectedArea.value = null;
            events.value = [];
        }
    } catch (error) {
        errorMessage.value = `监控区域暂不可用：${error.message || '接口请求失败'}`;
        areas.value = [];
        events.value = [];
    } finally {
        loading.value = false;
    }
};

watch(() => props.show, (visible) => { if (visible) loadAreas(); });
onMounted(() => { if (props.show) loadAreas(); });
</script>
