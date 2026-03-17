<template>
    <transition name="fade">
        <div v-if="show && data" 
             class="fixed pointer-events-auto"
             style="z-index: 10000;"
             :style="{ left: position.x + 20 + 'px', top: position.y - 100 + 'px' }">
            <div class="relative backdrop-blur-md rounded-lg shadow-2xl overflow-hidden border max-w-sm"
                 style="background: linear-gradient(to bottom, rgba(30, 58, 138, 0.95), rgba(30, 41, 59, 0.95)); border-color: rgba(139, 92, 246, 0.5); box-shadow: 0 0 30px rgba(139, 92, 246, 0.4);">
                
                <!-- 关闭按钮 -->
                <button @click="$emit('close')" 
                        class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded transition-all hover:bg-red-500/20 z-10 text-purple-300 hover:text-white">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
                
                <!-- 标题 -->
                <div class="px-4 py-3 border-b" 
                     style="background: rgba(139, 92, 246, 0.2); border-color: rgba(139, 92, 246, 0.3);">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">🔬</span>
                        <h3 class="text-lg font-bold text-purple-300 font-['Noto_Sans_SC']">
                            {{ data.name || '海底观测网' }}
                        </h3>
                    </div>
                </div>
                
                <!-- 内容 -->
                <div class="p-4 space-y-2 font-['Noto_Sans_SC']">
                    <div class="flex items-start gap-2">
                        <span class="text-sm whitespace-nowrap text-purple-200">国家：</span>
                        <span class="text-sm text-white">{{ data.country || '未知' }}</span>
                    </div>
                    
                    <div class="flex items-start gap-2">
                        <span class="text-sm whitespace-nowrap text-purple-200">所属单位：</span>
                        <span class="text-sm text-white">{{ data.unit || '未知' }}</span>
                    </div>
                    
                    <div v-if="data.longitude !== undefined" class="flex items-start gap-2">
                        <span class="text-sm whitespace-nowrap text-purple-200">经度：</span>
                        <span class="text-sm text-white">{{ data.longitude.toFixed(4) }}°</span>
                    </div>
                    
                    <div v-if="data.latitude !== undefined" class="flex items-start gap-2">
                        <span class="text-sm whitespace-nowrap text-purple-200">纬度：</span>
                        <span class="text-sm text-white">{{ data.latitude.toFixed(4) }}°</span>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
export default {
    name: 'SeafloorObservationPopup',
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
    emits: ['close'],
    mounted() {
        console.log('🔬 SeafloorObservationPopup mounted');
        console.log('🔬 Initial show:', this.show);
        console.log('🔬 Initial data:', this.data);
        console.log('🔬 Initial position:', this.position);
    },
    watch: {
        show(newVal, oldVal) {
            console.log('🔬 SeafloorObservationPopup show changed:', oldVal, '->', newVal);
            if (newVal) {
                console.log('🔬 弹窗显示，当前数据:', this.data);
                console.log('🔬 弹窗位置:', this.position);
            }
        },
        data(newVal, oldVal) {
            console.log('🔬 SeafloorObservationPopup data changed:', oldVal, '->', newVal);
        },
        position(newVal, oldVal) {
            console.log('🔬 SeafloorObservationPopup position changed:', oldVal, '->', newVal);
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
</style>
