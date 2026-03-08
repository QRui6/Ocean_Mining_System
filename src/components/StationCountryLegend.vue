<template>
    <transition name="slide-up">
        <div v-if="show && (countries.antarctic?.length > 0 || countries.arctic?.length > 0)" 
             class="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 pointer-events-auto">
            <div class="relative backdrop-blur-md rounded-lg shadow-2xl overflow-hidden border"
                 style="background: var(--panel-bg); border-color: var(--panel-border); width: 700px; max-width: 90vw;">
                
                <!-- 标题栏 -->
                <div class="flex items-center justify-between px-4 py-2 border-b"
                     style="background: var(--panel-header-bg); border-color: var(--panel-border);">
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-bold" style="color: var(--text-primary);">🏔️ 极地科考站国家分布</span>
                    </div>
                    <button @click="$emit('close')" 
                            class="w-6 h-6 flex items-center justify-center rounded transition-all hover:bg-red-500/20"
                            style="color: var(--text-secondary);">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <!-- 国家列表 - 左右分栏 -->
                <div class="flex">
                    <!-- 南极 -->
                    <div class="flex-1 px-3 py-3 border-r" style="border-color: var(--panel-border);">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-2xl">🇦🇶</span>
                            <span class="text-xs font-bold" style="color: var(--text-primary);">南极</span>
                        </div>
                        <div class="flex flex-wrap gap-1.5">
                            <div v-for="country in countries.antarctic" :key="'antarctic-' + country.name"
                                 class="flex items-center gap-1.5 px-2 py-1 rounded border transition-all hover:scale-105"
                                 :style="{ 
                                     background: country.color + '20',
                                     borderColor: country.color
                                 }">
                                <div class="w-2 h-2 rounded-full" 
                                     :style="{ background: country.color }"></div>
                                <span class="text-xs font-medium whitespace-nowrap" 
                                      style="color: var(--text-primary);">
                                    {{ country.name }}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 北极 -->
                    <div class="flex-1 px-3 py-3">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-2xl">🧊</span>
                            <span class="text-xs font-bold" style="color: var(--text-primary);">北极</span>
                        </div>
                        <div class="flex flex-wrap gap-1.5">
                            <div v-for="country in countries.arctic" :key="'arctic-' + country.name"
                                 class="flex items-center gap-1.5 px-2 py-1 rounded border transition-all hover:scale-105"
                                 :style="{ 
                                     background: country.color + '20',
                                     borderColor: country.color
                                 }">
                                <div class="w-2 h-2 rounded-full" 
                                     :style="{ background: country.color }"></div>
                                <span class="text-xs font-medium whitespace-nowrap" 
                                      style="color: var(--text-primary);">
                                    {{ country.name }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
export default {
    name: 'StationCountryLegend',
    props: {
        show: {
            type: Boolean,
            default: false
        },
        countries: {
            type: Object,
            default: () => ({ antarctic: [], arctic: [] })
        }
    },
    emits: ['close']
};
</script>

<style scoped>
.slide-up-enter-active, .slide-up-leave-active {
    transition: all 0.3s ease;
}

.slide-up-enter-from {
    transform: translate(-50%, 100%);
    opacity: 0;
}

.slide-up-leave-to {
    transform: translate(-50%, 100%);
    opacity: 0;
}
</style>
