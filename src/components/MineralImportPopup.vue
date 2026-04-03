<template>
    <transition name="fade">
        <div
            v-if="show && data"
            class="fixed z-50 pointer-events-auto"
            :style="popupStyle"
        >
            <div
                class="relative w-[22rem] overflow-hidden tech-panel-enhanced"
                style="clip-path: polygon(0 0, 100% 0, 100% 93%, 93% 100%, 0 100%);"
            >
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
                <div class="corner-decoration corner-tl"></div>
                <div class="corner-decoration corner-tr"></div>

                <button
                    @click="$emit('close')"
                    class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-sm transition-all z-10 border border-cyan-400/35 text-cyan-300 hover:bg-cyan-500 hover:text-black"
                    :style="closeBtnStyle"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>

                <div class="px-4 py-3 border-b border-cyan-500/30 bg-cyan-900/35" :style="headerStyle">
                    <div class="flex items-center gap-3">
                        <div class="w-2 h-2 rotate-45 shadow-[0_0_8px_#facc15]" :style="badgeStyle"></div>
                        <h3 class="text-lg font-bold text-cyan-100 font-['Noto_Sans_SC']">{{ data.commodityName }}</h3>
                    </div>
                    <div class="text-xs mt-1 ml-5 tracking-wide" :style="{ color: `${themeColor}CC` }">{{ data.categoryName }}</div>
                </div>

                <div class="p-4 space-y-2 font-['Noto_Sans_SC'] relative">
                    <div class="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

                    <div class="flex items-start gap-2">
                        <span class="text-sm whitespace-nowrap text-cyan-300 relative z-10">来源国：</span>
                        <div class="flex items-center gap-2 relative z-10 min-w-0">
                            <span class="country-flag-chip" :style="countryFlagChipStyle">
                                <span class="country-flag-corner"></span>
                                <img
                                    v-if="countryMeta.flagImageUrl && !flagLoadFailed"
                                    class="country-flag-image"
                                    :src="countryMeta.flagImageUrl"
                                    :alt="`${countryMeta.name}国旗`"
                                    loading="lazy"
                                    decoding="async"
                                    referrerpolicy="no-referrer"
                                    @error="handleFlagLoadError"
                                />
                                <span v-else class="country-flag-text">{{ countryMeta.badgeText }}</span>
                            </span>
                            <span class="text-sm text-white truncate">{{ countryMeta.name }}</span>
                        </div>
                    </div>

                    <template v-if="!isMulti">
                        <div class="flex items-start gap-2">
                            <span class="text-sm whitespace-nowrap text-cyan-300 relative z-10">进口量：</span>
                            <span class="text-sm text-white relative z-10">{{ data.volumeDisplay || '未披露' }}</span>
                        </div>
                        <div v-if="data.share" class="flex items-start gap-2">
                            <span class="text-sm whitespace-nowrap text-cyan-300 relative z-10">占比：</span>
                            <span class="text-sm text-white relative z-10">{{ data.share }}</span>
                        </div>
                        <div v-if="data.yoy" class="flex items-start gap-2">
                            <span class="text-sm whitespace-nowrap text-cyan-300 relative z-10">同比：</span>
                            <span class="text-sm text-white relative z-10">{{ data.yoy }}</span>
                        </div>
                        <div class="flex items-start gap-2">
                            <span class="text-sm whitespace-nowrap text-cyan-300 relative z-10">总进口：</span>
                            <span class="text-sm text-white relative z-10">{{ data.totalImport || '未披露' }}</span>
                        </div>
                    </template>

                    <template v-else>
                        <div class="flex items-start gap-2">
                            <span class="text-sm whitespace-nowrap text-cyan-300 relative z-10">重叠矿种：</span>
                            <span class="text-sm text-white relative z-10">{{ data.commodityCount || data.items?.length || 0 }} 类</span>
                        </div>
                        <div class="space-y-2 mt-1 relative z-10">
                            <div
                                v-for="item in (data.items || [])"
                                :key="`${item.commodityId}_${item.commodityName}`"
                                class="rounded border bg-slate-900/55 px-3 py-2"
                                :style="{
                                    borderColor: `${item.themeColor || themeColor}88`,
                                    boxShadow: `inset 3px 0 0 ${item.themeColor || themeColor}`
                                }"
                            >
                                <div class="flex items-center justify-between gap-2">
                                    <span class="text-sm font-semibold text-white">{{ item.commodityName }}</span>
                                    <span class="text-xs text-cyan-200">{{ item.share || '' }}</span>
                                </div>
                                <div class="text-xs text-slate-200 mt-1">
                                    {{ item.volumeDisplay || '未披露' }}
                                </div>
                                <div v-if="item.dataQualityNote" class="text-[11px] leading-4 text-cyan-200/90 mt-1">
                                    {{ item.dataQualityNote }}
                                </div>
                                <div v-if="item.note" class="text-[11px] leading-4 text-yellow-300/90 mt-1">
                                    {{ item.note }}
                                </div>
                            </div>
                        </div>
                    </template>

                    <div v-if="data.dataQualityNote" class="text-xs leading-5 text-cyan-200 relative z-10">
                        {{ data.dataQualityNote }}
                    </div>
                    <div v-if="data.summary" class="pt-2 border-t border-cyan-500/25 text-xs leading-5 text-slate-200 relative z-10">
                        {{ data.summary }}
                    </div>
                    <div v-if="data.note" class="text-xs leading-5 text-yellow-300/90 relative z-10">
                        {{ data.note }}
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
import {
    getMineralImportCountryAlpha2,
    getMineralImportCountryFlagUrl,
    normalizeMineralImportCountryName
} from '../data/mineralImportData.js';

export default {
    name: 'MineralImportPopup',
    data() {
        return {
            flagLoadFailed: false
        };
    },
    props: {
        show: {
            type: Boolean,
            default: false
        },
        data: {
            type: Object,
            default: null
        },
        position: {
            type: Object,
            default: () => ({ x: 0, y: 0 })
        },
        stackIndex: {
            type: Number,
            default: 0
        }
    },
    emits: ['close'],
    computed: {
        isMulti() {
            return Boolean(this.data?.isMulti);
        },
        themeColor() {
            return this.data?.themeColor || '#22d3ee';
        },
        countryMeta() {
            const rawCountry = this.data?.country || '';
            const countryName = normalizeMineralImportCountryName(rawCountry) || rawCountry || '未知';
            const alpha2 = getMineralImportCountryAlpha2(countryName);

            return {
                name: countryName || '未知',
                alpha2,
                flagImageUrl: getMineralImportCountryFlagUrl(countryName, 40),
                badgeText: alpha2 || '??'
            };
        },
        headerStyle() {
            return {
                borderColor: `${this.themeColor}66`,
                background: `linear-gradient(135deg, ${this.hexToRgba(this.themeColor, 0.26)}, rgba(8, 24, 42, 0.72))`
            };
        },
        closeBtnStyle() {
            return {
                borderColor: `${this.themeColor}88`,
                color: this.themeColor
            };
        },
        badgeStyle() {
            return {
                background: this.themeColor,
                boxShadow: `0 0 8px ${this.themeColor}`
            };
        },
        countryFlagChipStyle() {
            return {
                borderColor: `${this.themeColor}66`,
                background: `linear-gradient(135deg, ${this.hexToRgba(this.themeColor, 0.22)}, rgba(15, 23, 42, 0.86))`,
                boxShadow: `0 0 14px ${this.hexToRgba(this.themeColor, 0.18)}, inset 0 0 10px ${this.hexToRgba(this.themeColor, 0.1)}`
            };
        },
        popupStyle() {
            const panelWidth = 352;
            const panelHeight = this.isMulti ? 420 : 320;
            const margin = 12;
            const viewportWidth = window.innerWidth || 1920;
            const viewportHeight = window.innerHeight || 1080;

            const targetX = this.position.x + 22;
            const targetY = this.position.y - 120;
            const clampedX = Math.max(margin, Math.min(targetX, viewportWidth - panelWidth - margin));
            const clampedY = Math.max(margin, Math.min(targetY, viewportHeight - panelHeight - margin));
            const offsetX = (this.stackIndex % 4) * 24;
            const offsetY = Math.floor(this.stackIndex / 4) * 28;

            return {
                left: `${Math.max(margin, Math.min(clampedX + offsetX, viewportWidth - panelWidth - margin))}px`,
                top: `${Math.max(margin, Math.min(clampedY + offsetY, viewportHeight - panelHeight - margin))}px`,
                zIndex: `${1000 + this.stackIndex}`
            };
        }
    },
    watch: {
        'data.country'() {
            this.flagLoadFailed = false;
        }
    },
    methods: {
        handleFlagLoadError() {
            this.flagLoadFailed = true;
        },
        hexToRgba(hex, alpha = 1) {
            const value = String(hex || '').replace('#', '');
            const normalized = value.length === 3
                ? value.split('').map(char => char + char).join('')
                : value;
            const intVal = Number.parseInt(normalized, 16);
            if (!Number.isFinite(intVal)) return `rgba(34, 211, 238, ${alpha})`;
            const r = (intVal >> 16) & 255;
            const g = (intVal >> 8) & 255;
            const b = intVal & 255;
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
    }
};
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from, .fade-leave-to {
    opacity: 0;
}

.country-flag-chip {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2rem;
    height: 1.5rem;
    padding: 0 0.35rem;
    border: 1px solid;
    border-radius: 0.15rem;
    overflow: hidden;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.country-flag-chip::after {
    content: '';
    position: absolute;
    inset: 2px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 0.08rem;
    pointer-events: none;
}

.country-flag-corner {
    position: absolute;
    top: 1px;
    left: 1px;
    width: 0.35rem;
    height: 0.35rem;
    border-top: 1px solid rgba(255, 255, 255, 0.5);
    border-left: 1px solid rgba(255, 255, 255, 0.5);
    opacity: 0.85;
}

.country-flag-text {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.2rem;
    font-size: 0.95rem;
    line-height: 1;
    text-shadow: 0 0 8px rgba(255, 255, 255, 0.22);
}

.country-flag-image {
    position: relative;
    z-index: 1;
    display: block;
    width: 1.2rem;
    height: 0.9rem;
    border-radius: 0.08rem;
    object-fit: cover;
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.18);
}
</style>
