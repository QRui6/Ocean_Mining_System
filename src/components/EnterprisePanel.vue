<template>
    <transition name="slide-up">
        <div v-if="show" class="fixed bottom-0 left-[520px] z-50 w-[880px] pointer-events-auto">
            <div class="relative" style="clip-path: polygon(2% 0, 98% 0, 100% 5%, 100% 100%, 0 100%, 0 5%); background: rgba(15, 30, 60, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); box-shadow: 0 -10px 40px rgba(6, 182, 212, 0.2), inset 0 0 60px rgba(6, 182, 212, 0.1);">
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                
                <!-- <button 
                    @click="$emit('close')"
                    class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-red-500/20 hover:bg-red-500/40 border border-red-500 rounded transition-all group z-10"
                >
                    <svg class="w-5 h-5 text-red-400 group-hover:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button> -->
                
                <div class="flex items-center px-6 pt-4 pb-3 border-b-2 border-cyan-500/30">
                    <div class="w-1.5 h-6 bg-yellow-400 mr-3 shadow-[0_0_10px_#facc15]"></div>
                    <h3 class="text-2xl font-bold text-white tracking-wider flex-1">中国深海采矿企业主体</h3>
                    <div class="text-xs font-['Orbitron'] text-cyan-500 opacity-80 font-bold tracking-widest">CHINA ENTERPRISES</div>
                </div>
                
                <div class="p-6">
                    <div class="grid grid-cols-3 gap-4">
                        <div 
                            v-for="enterprise in enterprises" 
                            :key="enterprise.id"
                            class="bg-slate-900/50 border-2 rounded-lg p-4 hover:border-cyan-500/50 transition-all cursor-pointer group"
                            :style="{ borderColor: enterprise.color + '40' }"
                        >
                            <div class="flex items-start gap-3 mb-3">
                                <div 
                                    class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border-2"
                                    :style="{ 
                                        backgroundColor: enterprise.color + '20',
                                        borderColor: enterprise.color
                                    }"
                                >
                                    <svg class="w-6 h-6" :style="{ color: enterprise.color }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                                    </svg>
                                </div>
                                
                                <div class="flex-1 min-w-0">
                                    <h4 class="text-white font-bold text-base mb-1 group-hover:text-cyan-400 transition-colors">
                                        {{ enterprise.name }}
                                    </h4>
                                    <p class="text-xs text-slate-400">{{ enterprise.nameEn }}</p>
                                    <div class="flex items-center gap-1 mt-1">
                                        <svg class="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                        </svg>
                                        <span class="text-xs text-slate-500">{{ enterprise.city }}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mb-3 p-2 bg-slate-800/50 rounded">
                                <div class="text-xs text-slate-400 mb-1">擅长领域</div>
                                <div class="text-sm text-slate-300 leading-relaxed">{{ enterprise.expertise }}</div>
                            </div>
                            
                            <div class="space-y-2 mb-3 max-h-[200px] overflow-y-auto custom-scrollbar">
                                <div 
                                    v-for="(highlight, index) in enterprise.highlights" 
                                    :key="index"
                                    class="text-xs text-slate-400 leading-relaxed pl-3 border-l-2"
                                    :style="{ borderColor: enterprise.color }"
                                >
                                    {{ highlight }}
                                </div>
                            </div>
                            
                            <!-- <div 
                                class="p-2 rounded text-center text-sm font-bold"
                                :style="{ 
                                    backgroundColor: enterprise.color + '20',
                                    color: enterprise.color
                                }"
                            >
                                {{ enterprise.summary }}
                            </div> -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
import { ref } from 'vue';
import { CHINA_ENTERPRISES } from '../constants.js';

export default {
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['close'],
    setup() {
        const enterprises = ref(CHINA_ENTERPRISES);
        
        return {
            enterprises
        };
    }
};
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from {
    transform: translateX(-50%) translateY(100%);
    opacity: 0;
}

.slide-up-leave-to {
    transform: translateX(-50%) translateY(100%);
    opacity: 0;
}

.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.5);
    border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(6, 182, 212, 0.5);
    border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(6, 182, 212, 0.7);
}
</style>
