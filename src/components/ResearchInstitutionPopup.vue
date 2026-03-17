<template>
    <transition name="fade">
        <div v-if="show && data" 
             class="fixed z-50 pointer-events-auto"
             :style="{ left: position.x + 20 + 'px', top: position.y - 150 + 'px' }">
            <div class="relative backdrop-blur-md rounded-lg shadow-2xl overflow-hidden border max-w-md"
                 style="background: linear-gradient(to bottom, rgba(30, 58, 138, 0.95), rgba(30, 41, 59, 0.95)); border-color: rgba(251, 146, 60, 0.5);">
                
                <!-- 关闭按钮 -->
                <button @click="$emit('close')" 
                        class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded transition-all hover:bg-red-500/20 z-10 text-orange-300 hover:text-white">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
                
                <!-- 标题 -->
                <div class="px-4 py-3 border-b" 
                     style="background: rgba(251, 146, 60, 0.2); border-color: rgba(251, 146, 60, 0.3);">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">🏛️</span>
                        <h3 class="text-lg font-bold text-orange-300">
                            {{ data.name }}
                        </h3>
                    </div>
                </div>
                
                <!-- 内容 -->
                <div class="p-4 space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                    <div class="flex items-start gap-2">
                        <span class="text-sm whitespace-nowrap text-orange-200">国家：</span>
                        <span class="text-sm text-white">{{ data.country }}</span>
                    </div>
                    
                    <div v-if="data.founded" class="flex items-start gap-2">
                        <span class="text-sm whitespace-nowrap text-orange-200">成立时间：</span>
                        <span class="text-sm text-white">{{ data.founded }}</span>
                    </div>
                    
                    <div v-if="data.city" class="flex items-start gap-2">
                        <span class="text-sm whitespace-nowrap text-orange-200">所在城市：</span>
                        <span class="text-sm text-white">{{ data.city }}</span>
                    </div>
                    
                    <div v-if="data.supervisingUnit" class="flex items-start gap-2">
                        <span class="text-sm whitespace-nowrap text-orange-200">主管单位：</span>
                        <span class="text-sm text-white">{{ data.supervisingUnit }}</span>
                    </div>
                    
                    <div v-if="data.mainTasks" class="flex items-start gap-2">
                        <span class="text-sm whitespace-nowrap text-orange-200">主要任务：</span>
                        <span class="text-sm text-white">{{ data.mainTasks }}</span>
                    </div>
                    
                    <div v-if="data.notes" class="flex items-start gap-2">
                        <span class="text-sm whitespace-nowrap text-orange-200">备注：</span>
                        <span class="text-sm text-white">{{ data.notes }}</span>
                    </div>
                    
                    <div class="flex items-start gap-2">
                        <span class="text-sm whitespace-nowrap text-orange-200">经度：</span>
                        <span class="text-sm text-white">{{ data.longitude?.toFixed(4) }}°</span>
                    </div>
                    
                    <div class="flex items-start gap-2">
                        <span class="text-sm whitespace-nowrap text-orange-200">纬度：</span>
                        <span class="text-sm text-white">{{ data.latitude?.toFixed(4) }}°</span>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
export default {
    name: 'ResearchInstitutionPopup',
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
        }
    },
    emits: ['close']
};
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from, .fade-leave-to {
    opacity: 0;
}

/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(30, 58, 138, 0.5);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(251, 146, 60, 0.5);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(251, 146, 60, 0.7);
}
</style>
