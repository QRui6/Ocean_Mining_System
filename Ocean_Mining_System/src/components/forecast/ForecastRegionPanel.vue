<template>
    <div
        v-if="show"
        class="pointer-events-none absolute bottom-6 left-8 top-36 z-40 w-[28rem] font-['Noto_Sans_SC'] animate-slideInLeft"
    >
        <section
            class="tech-panel-enhanced pointer-events-auto relative flex h-fit min-h-0 flex-col overflow-hidden p-6"
            style="clip-path: polygon(0 0, 100% 0, 100% 95%, 92% 100%, 0 100%);"
        >
            <div class="absolute left-0 top-0 h-[2px] w-full animate-pulse bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
            <div class="corner-decoration corner-tl scale-125"></div>
            <div class="corner-decoration corner-tr scale-125"></div>

            <div class="mb-5 flex shrink-0 items-center border-b-2 border-cyan-500/40 pb-3">
                <div class="mr-3 h-6 w-1.5 bg-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.8)]"></div>
                <h3 class="min-w-0 flex-1 text-2xl font-bold tracking-wider text-white">区域预报</h3>
                <button class="floating-panel-close-btn floating-panel-close-btn--inline" type="button" title="关闭区域预报" aria-label="关闭区域预报" @click="emit('close')">✕</button>
            </div>

            <div class="space-y-4">
                <div>
                    <div class="mb-3 flex items-center justify-between">
                        <div class="flex items-center text-base font-bold text-cyan-400">
                            <div class="mr-2.5 h-1.5 w-1.5 rounded-full bg-cyan-400"></div>
                            预报区域
                        </div>
                        <span class="text-xs text-slate-400">共 {{ regions.length }} 个</span>
                    </div>
                    <div class="grid grid-cols-5 gap-2">
                        <button
                            v-for="region in regions"
                            :key="region.id"
                            type="button"
                            :title="region.regionName || region.regionCode || `区域 ${region.id}`"
                            :class="[
                                'min-w-0 rounded-sm border px-2 py-1.5 text-center text-base transition-all duration-200 skew-x-[-10deg]',
                                isSelected(region)
                                    ? 'border-blue-300 bg-gradient-to-r from-blue-600 to-blue-500 font-bold text-white shadow-[0_0_10px_rgba(37,99,235,0.6)]'
                                    : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-cyan-500/50 hover:text-cyan-200'
                            ]"
                            @click="emit('selectRegion', region)"
                        >
                            <span class="block overflow-hidden text-ellipsis whitespace-nowrap skew-x-[10deg] font-bold leading-6">{{ formatRegionLabel(region) }}</span>
                        </button>
                    </div>
                </div>

                <div class="border-t border-dashed border-slate-700/60 pt-3">
                    <div class="mb-2 flex items-center justify-between">
                        <span class="text-sm font-bold text-cyan-200">数据状态</span>
                        <span :class="['text-sm font-bold', status.className]">{{ status.label }}</span>
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-xs">
                        <div class="border border-cyan-500/20 bg-slate-950/45 px-3 py-2 text-slate-400">
                            <span class="block">预报基准</span>
                            <strong class="mt-1 block text-sm text-slate-100">{{ status.baseDate }}</strong>
                        </div>
                        <div class="border border-cyan-500/20 bg-slate-950/45 px-3 py-2 text-slate-400">
                            <span class="block">有效至</span>
                            <strong class="mt-1 block text-sm text-slate-100">{{ status.validUntil }}</strong>
                        </div>
                    </div>
                    <p class="mt-2 text-xs leading-5 text-slate-400">{{ status.detail }}</p>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    show: { type: Boolean, default: false },
    regions: { type: Array, default: () => [] },
    selectedRegion: { type: Object, default: null },
    dailyForecast: { type: Array, default: () => [] }
});

const emit = defineEmits(['close', 'selectRegion']);

const isSelected = (region) => String(region?.id || '') === String(props.selectedRegion?.id || '');

const formatRegionLabel = (region) => String(region?.regionName || region?.regionCode || `区域 ${region?.id || ''}`)
    .replace('太平洋 (CCZ)', '太平洋CCZ');

const status = computed(() => {
    const records = props.dailyForecast || [];
    const timestamps = records.map((record) => {
        const raw = record?.forecastTime || record?.forecastDate;
        const value = new Date(raw || 0);
        if (record?.forecastDate && !record?.forecastTime && /^\d{4}-\d{2}-\d{2}$/.test(record.forecastDate)) {
            value.setHours(23, 59, 59, 999);
        }
        return value.getTime();
    }).filter(Number.isFinite);
    const baseDates = records.map((record) => record?.baseDate).filter(Boolean).sort();

    if (!props.selectedRegion) {
        return {
            label: '等待选择区域',
            className: 'text-slate-300',
            baseDate: '--',
            validUntil: '--',
            detail: '选择区域后读取该区域已有的逐日和逐小时风、浪、流数据。'
        };
    }

    if (!timestamps.length) {
        return {
            label: '暂无可用数据',
            className: 'text-slate-300',
            baseDate: '--',
            validUntil: '--',
            detail: '接口未返回可判定时效的预报记录。'
        };
    }

    const validUntil = new Date(Math.max(...timestamps));
    const isCurrent = validUntil.getTime() >= Date.now();
    return {
        label: isCurrent ? '当前预报数据' : '过期数据，仅供回看',
        className: isCurrent ? 'text-emerald-300' : 'text-amber-200',
        baseDate: baseDates[baseDates.length - 1] || '--',
        validUntil: validUntil.toLocaleDateString('zh-CN'),
        detail: isCurrent ? '可在右侧工作台查看逐日与逐小时预报。' : '当前数据不会作为实时预警依据。'
    };
});
</script>
