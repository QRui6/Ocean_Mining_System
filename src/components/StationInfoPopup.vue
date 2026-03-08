<template>
    <transition name="fade">
        <div v-if="show && stationInfo" 
             class="fixed z-50 pointer-events-auto"
             :style="{ left: position.x + 'px', top: position.y + 'px' }">
            <div class="relative backdrop-blur-md rounded-lg shadow-2xl overflow-hidden border max-w-sm"
                 style="background: var(--panel-bg); border-color: var(--panel-border);">
                
                <!-- 关闭按钮 -->
                <button @click="$emit('close')" 
                        class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded transition-all hover:bg-red-500/20 z-10"
                        style="color: var(--text-secondary);">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
                
                <!-- 标题 -->
                <div class="px-4 py-3 border-b" 
                     :style="{ 
                         background: stationInfo.type === 'antarctic' ? 'rgba(0, 206, 209, 0.1)' : 'rgba(65, 105, 225, 0.1)',
                         borderColor: 'var(--panel-border)'
                     }">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">{{ stationInfo.type === 'antarctic' ? '🇦🇶' : '🧊' }}</span>
                        <h3 class="text-lg font-bold" 
                            :style="{ color: stationInfo.type === 'antarctic' ? '#00CED1' : '#4169E1' }">
                            {{ stationInfo.name }}
                        </h3>
                    </div>
                </div>
                
                <!-- 内容 -->
                <div class="p-4 space-y-2">
                    <div class="flex items-start gap-2">
                        <span class="text-sm whitespace-nowrap" style="color: var(--text-secondary);">国家：</span>
                        <span class="text-sm" style="color: var(--text-primary);">{{ stationInfo.country }}</span>
                    </div>
                    
                    <div v-if="stationInfo.location" class="flex items-start gap-2">
                        <span class="text-sm whitespace-nowrap" style="color: var(--text-secondary);">位置：</span>
                        <span class="text-sm" style="color: var(--text-primary);">{{ stationInfo.location }}</span>
                    </div>
                    
                    <div v-if="stationInfo.establishedDate" class="flex items-start gap-2">
                        <span class="text-sm whitespace-nowrap" style="color: var(--text-secondary);">建立时间：</span>
                        <span class="text-sm" style="color: var(--text-primary);">{{ stationInfo.establishedDate }}</span>
                    </div>
                    
                    <div v-if="stationInfo.stationType" class="flex items-start gap-2">
                        <span class="text-sm whitespace-nowrap" style="color: var(--text-secondary);">类型：</span>
                        <span class="text-sm" style="color: var(--text-primary);">{{ stationInfo.stationType }}</span>
                    </div>
                    
                    <div v-if="stationInfo.personnel" class="flex items-start gap-2">
                        <span class="text-sm whitespace-nowrap" style="color: var(--text-secondary);">人员配置：</span>
                        <span class="text-sm" style="color: var(--text-primary);">{{ stationInfo.personnel }}</span>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
export default {
    name: 'StationInfoPopup',
    props: {
        show: {
            type: Boolean,
            default: false
        },
        stationInfo: {
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
</style>
