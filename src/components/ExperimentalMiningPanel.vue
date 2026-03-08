<template>
    <transition enter-active-class="animate-fadeIn" leave-active-class="transition-opacity duration-200 opacity-0">
        <div v-if="selectedSite" 
            :style="{ 
                left: position.x + 'px', 
                top: position.y + 'px' 
            }"
            class="absolute w-[24rem] bg-white/95 backdrop-blur-sm border border-gray-300 text-gray-800 shadow-lg z-50 rounded-sm">
            
            <!-- Header -->
            <div class="flex items-center justify-between bg-gray-100 px-4 py-2 border-b border-gray-300">
                <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-gray-700">试验试采信息</span>
                    <span class="text-xs px-2 py-0.5 rounded" 
                          :style="{ 
                              backgroundColor: getPeriodColor(selectedSite.period) + '40',
                              color: getPeriodColor(selectedSite.period),
                              border: '1px solid ' + getPeriodColor(selectedSite.period)
                          }">
                        {{ selectedSite.period }}
                    </span>
                </div>
                <button @click="close" class="text-gray-500 hover:text-gray-700 text-lg leading-none">×</button>
            </div>
            
            <!-- Content -->
            <div class="p-4 space-y-2 text-sm">
                <!-- 位置名称 -->
                <div class="flex justify-between items-start border-b border-gray-200 pb-2">
                    <span class="text-gray-600 font-medium">位置：</span>
                    <span class="text-gray-900 font-bold text-right flex-1 ml-2">{{ selectedSite.name }}</span>
                </div>
                
                <!-- 试验时间 -->
                <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                    <span class="text-gray-600 font-medium">时间：</span>
                    <span class="text-gray-900">{{ selectedSite.year }}</span>
                </div>
                
                <!-- 实施机构 -->
                <div class="flex flex-col border-b border-gray-200 pb-2">
                    <span class="text-gray-600 font-medium mb-1">机构：</span>
                    <span class="text-gray-900 text-xs leading-relaxed">{{ selectedSite.organization }}</span>
                </div>
                
                <!-- 矿种类型 -->
                <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                    <span class="text-gray-600 font-medium">矿种：</span>
                    <span class="text-gray-900">{{ selectedSite.type }}</span>
                </div>
                
                <!-- 水深 -->
                <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                    <span class="text-gray-600 font-medium">水深：</span>
                    <span class="text-gray-900 font-mono">{{ selectedSite.depth }}</span>
                </div>
                
                <!-- 试验成果 -->
                <div class="flex flex-col pt-1">
                    <span class="text-gray-600 font-medium mb-1">成果：</span>
                    <span class="text-gray-900 text-xs leading-relaxed">{{ selectedSite.description }}</span>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
import { ref } from 'vue';
import { PERIOD_COLORS } from '../utils/experimentalMiningLayer.js';

export default {
    setup() {
        const selectedSite = ref(null);
        const position = ref({ x: 0, y: 0 });

        const show = (site, clickPosition) => {
            selectedSite.value = site;
            
            // 计算弹窗位置（避免超出屏幕）
            const panelWidth = 384; // 24rem = 384px
            const panelHeight = 350;
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

        return {
            selectedSite,
            position,
            show,
            close,
            getPeriodColor
        };
    }
};
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
