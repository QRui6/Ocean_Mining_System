<template>
    <transition name="slide-up">
        <div v-if="show" 
             class="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 pointer-events-auto">
            <div class="relative backdrop-blur-md rounded-lg shadow-2xl overflow-hidden border"
                 style="background: var(--panel-bg); border-color: var(--panel-border); width: 800px; max-width: 90vw;">
                
                <!-- 标题栏 -->
                <div class="flex items-center justify-between px-4 py-2 border-b"
                     style="background: var(--panel-header-bg); border-color: var(--panel-border);">
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-bold" style="color: var(--text-primary);">🌍 南极资源分布图例</span>
                    </div>
                    <button @click="$emit('close')" 
                            class="w-6 h-6 flex items-center justify-center rounded transition-all hover:bg-red-500/20"
                            style="color: var(--text-secondary);">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <!-- 资源图例列表 -->
                <div class="px-4 py-3">
                    <div class="grid grid-cols-5 gap-2">
                        <div v-for="(config, resourceType) in resourceConfig" 
                             :key="resourceType"
                             class="flex items-center gap-2 px-2 py-1.5 rounded border transition-all hover:scale-105"
                             :style="{ 
                                 background: config.color + '20',
                                 borderColor: config.color
                             }">
                            <!-- 图形图标 - 使用 SVG 代替 Canvas -->
                            <div class="flex-shrink-0 w-6 h-6">
                                <svg v-if="config.shape === 'circle'" width="24" height="24" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="8" :fill="config.color" stroke="white" stroke-width="2"/>
                                </svg>
                                <svg v-else-if="config.shape === 'square'" width="24" height="24" viewBox="0 0 24 24">
                                    <rect x="4" y="4" width="16" height="16" :fill="config.color" stroke="white" stroke-width="2"/>
                                </svg>
                                <svg v-else-if="config.shape === 'triangle'" width="24" height="24" viewBox="0 0 24 24">
                                    <polygon points="12,4 20,20 4,20" :fill="config.color" stroke="white" stroke-width="2"/>
                                </svg>
                                <svg v-else-if="config.shape === 'star'" width="24" height="24" viewBox="0 0 24 24">
                                    <polygon points="12,3 14.5,9.5 21,10.5 16.5,15 17.5,21.5 12,18 6.5,21.5 7.5,15 3,10.5 9.5,9.5" 
                                             :fill="config.color" stroke="white" stroke-width="2"/>
                                </svg>
                                <svg v-else-if="config.shape === 'diamond'" width="24" height="24" viewBox="0 0 24 24">
                                    <polygon points="12,4 20,12 12,20 4,12" :fill="config.color" stroke="white" stroke-width="2"/>
                                </svg>
                            </div>
                            <!-- 资源名称 -->
                            <span class="text-xs font-medium whitespace-nowrap" 
                                  style="color: var(--text-primary);">
                                {{ resourceType }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
export default {
    name: 'AntarcticResourceLegend',
    props: {
        show: {
            type: Boolean,
            default: false
        },
        resourceConfig: {
            type: Object,
            required: true
        }
    },
    emits: ['close'],
    mounted() {
        console.log('🎨 AntarcticResourceLegend mounted');
        console.log('🎨 show:', this.show);
        console.log('🎨 resourceConfig:', this.resourceConfig);
    },
    watch: {
        show(newVal) {
            console.log('🎨 show changed:', newVal);
        },
        resourceConfig: {
            handler(newVal) {
                console.log('🎨 resourceConfig changed:', newVal);
            },
            deep: true
        }
    }
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
