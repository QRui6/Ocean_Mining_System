<template>
    <transition enter-active-class="animate-fadeIn" leave-active-class="transition-opacity duration-200 opacity-0">
        <div v-if="selectedSite" 
            :style="{ 
                left: position.x + 'px', 
                top: position.y + 'px' 
            }"
            class="fixed w-[24rem] bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-2 border-cyan-400/50 text-white shadow-[0_0_30px_rgba(6,182,212,0.4)] z-50 rounded-lg pointer-events-auto font-['Noto_Sans_SC']">
            
            <!-- Header -->
            <div class="flex items-center justify-between bg-gradient-to-r from-cyan-900/40 to-transparent px-4 py-3 border-b border-cyan-500/30">
                <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full animate-pulse" 
                         :style="{ backgroundColor: getPeriodColor(selectedSite.period) }">
                    </div>
                    <span class="text-base font-bold text-white">试验试采信息</span>
                    <span class="text-xs px-2 py-0.5 rounded font-bold" 
                          :style="{ 
                              backgroundColor: getPeriodColor(selectedSite.period) + '40',
                              color: getPeriodColor(selectedSite.period),
                              border: '1px solid ' + getPeriodColor(selectedSite.period)
                          }">
                        {{ selectedSite.period }}
                    </span>
                </div>
                <button 
                    @click="close" 
                    class="w-6 h-6 flex items-center justify-center text-cyan-400 hover:text-white hover:bg-cyan-500/20 rounded transition-all"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            
            <!-- Content -->
            <div class="p-4 space-y-3 text-sm">
                <!-- 位置名称 -->
                <div class="flex justify-between items-start border-b border-cyan-500/20 pb-2">
                    <span class="text-cyan-400 font-semibold">位置：</span>
                    <span class="text-white font-bold text-right flex-1 ml-2">{{ selectedSite.name }}</span>
                </div>
                
                <!-- 试验时间 -->
                <div class="flex justify-between items-center border-b border-cyan-500/20 pb-2">
                    <span class="text-cyan-400 font-semibold">时间：</span>
                    <span class="text-white">{{ selectedSite.year }}</span>
                </div>
                
                <!-- 实施机构 -->
                <div class="flex flex-col border-b border-cyan-500/20 pb-2">
                    <span class="text-cyan-400 font-semibold mb-1">机构：</span>
                    <span class="text-white/90 text-xs leading-relaxed">{{ selectedSite.organization }}</span>
                </div>
                
                <!-- 矿种类型 -->
                <div class="flex justify-between items-center border-b border-cyan-500/20 pb-2">
                    <span class="text-cyan-400 font-semibold">矿种：</span>
                    <span class="text-white">{{ selectedSite.type }}</span>
                </div>
                
                <!-- 水深 -->
                <div class="flex justify-between items-center border-b border-cyan-500/20 pb-2">
                    <span class="text-cyan-400 font-semibold">水深：</span>
                    <span class="text-white font-mono">{{ selectedSite.depth }}</span>
                </div>
                
                <!-- 试验成果 -->
                <div class="flex flex-col pt-1">
                    <span class="text-cyan-400 font-semibold mb-1">成果：</span>
                    <span class="text-white/90 text-xs leading-relaxed">{{ selectedSite.description }}</span>
                </div>
            </div>
        </div>
    </transition>
</template>

<script setup>
import { ref } from 'vue';
import { PERIOD_COLORS } from '../utils/experimentalMiningLayer.js';

const selectedSite = ref(null);
const position = ref({ x: 0, y: 0 });

const show = (site, clickPosition) => {
    selectedSite.value = site;
    
    // 计算弹窗位置（避免超出屏幕）
    const panelWidth = 384; // 24rem = 384px
    const panelHeight = 400;
    const padding = 20;
    
    let x = clickPosition.x + 20;
    let y = clickPosition.y - panelHeight / 2;
    
    // 防止超出右边界
    if (x + panelWidth > window.innerWidth - padding) {
        x = clickPosition.x - panelWidth - 20;
    }
    
    // 防止超出上边界
    if (y < padding) {
        y = padding;
    }
    
    // 防止超出下边界
    if (y + panelHeight > window.innerHeight - padding) {
        y = window.innerHeight - panelHeight - padding;
    }
    
    position.value = { x, y };
};

const close = () => {
    selectedSite.value = null;
};

const getPeriodColor = (period) => {
    return PERIOD_COLORS[period] || '#FF0000';
};

defineExpose({
    show,
    close
});
</script>

<style scoped>
.animate-fadeIn {
    animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-5px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
