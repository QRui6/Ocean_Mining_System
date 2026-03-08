<template>
    <transition name="slide-up">
        <div v-if="show" class="fixed bottom-0 left-1/2 z-50 mb-4 pointer-events-auto" style="transform: translateX(-40%);">
            <div class="rounded-lg shadow-2xl" style="width: 900px; background: rgba(15, 30, 60, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); box-shadow: 0 -10px 40px rgba(6, 182, 212, 0.2), inset 0 0 60px rgba(6, 182, 212, 0.1);">
                <!-- 标题栏 -->
                <div class="flex items-center justify-between bg-gradient-to-r from-cyan-900/60 to-transparent px-4 py-2 border-b border-cyan-500/30">
                    <div class="flex items-center gap-2">
                        <div class="w-1.5 h-1.5 bg-yellow-400 rotate-45 shadow-[0_0_6px_#facc15]"></div>
                        <span class="font-bold text-lg text-white tracking-wide">各国态度统计</span>
                    </div>
                    <button @click="$emit('close')" class="group p-1">
                        <div class="w-5 h-5 border border-cyan-500/50 flex items-center justify-center rounded-sm group-hover:bg-cyan-500 group-hover:text-black transition-colors text-xs">✕</div>
                    </button>
                </div>
                
                <!-- 表格内容 -->
                <div class="p-4">
                    <div class="grid grid-cols-3 gap-3">
                        <!-- 暂停 moratorium -->
                        <div class="bg-slate-900/50 rounded-lg border border-yellow-500/30 overflow-hidden">
                            <div class="bg-yellow-500 px-3 py-1.5 flex items-center justify-between">
                                <span class="font-bold text-black text-sm">暂停 Moratorium</span>
                                <span class="bg-black/30 text-white px-2 py-0.5 rounded text-xs font-bold">{{ moratoriumCountries.length }}</span>
                            </div>
                            <div class="p-3 h-48 overflow-hidden relative">
                                <div ref="moratoriumScroll" class="space-y-1.5 scroll-container">
                                    <div v-for="(country, index) in moratoriumCountriesDoubled" :key="`moratorium-${index}`" 
                                        class="px-2 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 rounded border border-yellow-500/20 text-white transition-colors text-sm">
                                        {{ country }}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 预防性暂停 precautionary pause -->
                        <div class="bg-slate-900/50 rounded-lg border border-orange-500/30 overflow-hidden">
                            <div class="bg-orange-500 px-3 py-1.5 flex items-center justify-between">
                                <span class="font-bold text-black text-sm">预防性暂停 Precautionary Pause</span>
                                <span class="bg-black/30 text-white px-2 py-0.5 rounded text-xs font-bold">{{ precautionaryPauseCountries.length }}</span>
                            </div>
                            <div class="p-3 h-48 overflow-hidden relative">
                                <div ref="precautionaryScroll" class="space-y-1.5 scroll-container">
                                    <div v-for="(country, index) in precautionaryPauseCountriesDoubled" :key="`precautionary-${index}`" 
                                        class="px-2 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 rounded border border-orange-500/20 text-white transition-colors text-sm">
                                        {{ country }}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 禁止 ban -->
                        <div class="bg-slate-900/50 rounded-lg border border-red-500/30 overflow-hidden">
                            <div class="bg-red-500 px-3 py-1.5 flex items-center justify-between">
                                <span class="font-bold text-white text-sm">禁止 Ban</span>
                                <span class="bg-black/30 text-white px-2 py-0.5 rounded text-xs font-bold">{{ banCountries.length }}</span>
                            </div>
                            <div class="p-3 h-48 overflow-y-auto custom-scrollbar">
                                <div class="space-y-1.5">
                                    <div v-for="country in banCountries" :key="country" 
                                        class="px-2 py-1.5 bg-red-500/10 hover:bg-red-500/20 rounded border border-red-500/20 text-white transition-colors text-sm">
                                        {{ country }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 总计 -->
                    <div class="mt-3 text-center text-cyan-400 text-xs">
                        总计: {{ totalCountries }} 个国家
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { COUNTRY_ATTITUDES } from '../constants.js';

export default {
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['close'],
    setup(props) {
        const moratoriumScroll = ref(null);
        const precautionaryScroll = ref(null);
        let moratoriumInterval = null;
        let precautionaryInterval = null;
        
        const moratoriumCountries = computed(() => COUNTRY_ATTITUDES.moratorium.countries);
        const precautionaryPauseCountries = computed(() => COUNTRY_ATTITUDES.precautionaryPause.countries);
        const banCountries = computed(() => COUNTRY_ATTITUDES.ban.countries);
        
        // 双倍数组用于无缝循环
        const moratoriumCountriesDoubled = computed(() => [...moratoriumCountries.value, ...moratoriumCountries.value]);
        const precautionaryPauseCountriesDoubled = computed(() => [...precautionaryPauseCountries.value, ...precautionaryPauseCountries.value]);
        
        const totalCountries = computed(() => 
            moratoriumCountries.value.length + 
            precautionaryPauseCountries.value.length + 
            banCountries.value.length
        );
        
        // 启动滚动动画
        const startScrollAnimation = () => {
            if (moratoriumScroll.value) {
                let scrollTop = 0;
                moratoriumInterval = setInterval(() => {
                    scrollTop += 0.5;
                    moratoriumScroll.value.style.transform = `translateY(-${scrollTop}px)`;
                    
                    // 当滚动到一半时重置（无缝循环）
                    const halfHeight = moratoriumScroll.value.scrollHeight / 2;
                    if (scrollTop >= halfHeight) {
                        scrollTop = 0;
                    }
                }, 30);
            }
            
            if (precautionaryScroll.value) {
                let scrollTop = 0;
                precautionaryInterval = setInterval(() => {
                    scrollTop += 0.5;
                    precautionaryScroll.value.style.transform = `translateY(-${scrollTop}px)`;
                    
                    // 当滚动到一半时重置（无缝循环）
                    const halfHeight = precautionaryScroll.value.scrollHeight / 2;
                    if (scrollTop >= halfHeight) {
                        scrollTop = 0;
                    }
                }, 30);
            }
        };
        
        // 停止滚动动画
        const stopScrollAnimation = () => {
            if (moratoriumInterval) {
                clearInterval(moratoriumInterval);
                moratoriumInterval = null;
            }
            if (precautionaryInterval) {
                clearInterval(precautionaryInterval);
                precautionaryInterval = null;
            }
        };
        
        // 监听显示状态
        watch(() => props.show, (newVal) => {
            if (newVal) {
                setTimeout(() => {
                    startScrollAnimation();
                }, 300);
            } else {
                stopScrollAnimation();
            }
        });
        
        onUnmounted(() => {
            stopScrollAnimation();
        });
        
        return {
            moratoriumCountries,
            precautionaryPauseCountries,
            banCountries,
            moratoriumCountriesDoubled,
            precautionaryPauseCountriesDoubled,
            totalCountries,
            moratoriumScroll,
            precautionaryScroll
        };
    }
};
</script>

<style scoped>
/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(6, 182, 212, 0.5);
    border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(6, 182, 212, 0.7);
}

/* 滚动容器 */
.scroll-container {
    transition: transform 0.05s linear;
}

/* 滑入动画 */
.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.3s ease;
}

.slide-up-enter-from {
    transform: translate(-40%, 100%);
    opacity: 0;
}

.slide-up-leave-to {
    transform: translate(-40%, 100%);
    opacity: 0;
}
</style>
