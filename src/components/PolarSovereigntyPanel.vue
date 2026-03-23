<template>
    <transition name="slide-right">
        <div v-if="show" class="fixed left-8 bottom-4 z-30 pointer-events-auto w-[500px]">
            <div class="backdrop-blur-md rounded-lg shadow-2xl overflow-hidden border"
                 style="background: var(--panel-bg); border-color: var(--panel-border);">
                
                <!-- 标题栏 -->
                <div class="flex items-center justify-between px-4 py-2 border-b"
                     style="background: var(--panel-header-bg); border-color: var(--panel-border);">
                    <div class="flex items-center gap-2">
                        <span class="text-base font-bold" style="color: var(--text-primary);">🌐 极地主权主张</span>
                    </div>
                    <button @click="$emit('close')" 
                            class="w-6 h-6 flex items-center justify-center rounded transition-all hover:bg-red-500/20"
                            style="color: var(--text-secondary);">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <!-- 内容区域 -->
                <div class="p-4">
                    <div class="flex gap-3">
                        <!-- 南极按钮 -->
                        <button 
                            class="flex-1 py-3 px-4 rounded-lg transition-all duration-300 group overflow-hidden relative"
                            :class="selectedRegion === 'antarctic' 
                                ? 'bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' 
                                : 'bg-slate-800/60 text-white hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50'"
                            @click="handleAntarcticClick">
                            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                            <div class="relative flex flex-col items-center gap-1">
                                <span class="text-2xl">🇦🇶</span>
                                <span class="font-bold text-sm">南极</span>
                            </div>
                        </button>
                        
                        <!-- 北极按钮 -->
                        <button 
                            class="flex-1 py-3 px-4 rounded-lg transition-all duration-300 group overflow-hidden relative"
                            :class="selectedRegion === 'arctic' 
                                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' 
                                : 'bg-slate-800/60 text-white hover:bg-slate-700 border border-slate-700 hover:border-blue-500/50'"
                            @click="handleArcticClick">
                            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                            <div class="relative flex flex-col items-center gap-1">
                                <span class="text-2xl">🧊</span>
                                <span class="font-bold text-sm">北极</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
export default {
    name: 'PolarSovereigntyPanel',
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['close', 'showAntarcticDetail', 'showArcticDetail'],
    data() {
        return {
            selectedRegion: null  // 'antarctic' 或 'arctic'
        };
    },
    watch: {
        show(newVal) {
            // 当面板关闭时，重置选中状态
            if (!newVal) {
                this.selectedRegion = null;
            }
        }
    },
    methods: {
        handleAntarcticClick() {
            console.log('🇦🇶 南极按钮被点击');
            this.selectedRegion = 'antarctic';
            this.$emit('showAntarcticDetail');
            console.log('🇦🇶 触发 showAntarcticDetail 事件');
        },
        handleArcticClick() {
            console.log('🧊 北极按钮被点击');
            this.selectedRegion = 'arctic';
            this.$emit('showArcticDetail');
            console.log('🧊 触发 showArcticDetail 事件');
        }
    }
};
</script>

<style scoped>
.slide-right-enter-active,
.slide-right-leave-active {
    transition: all 0.3s ease;
}

.slide-right-enter-from {
    transform: translateX(-100%);
    opacity: 0;
}

.slide-right-leave-to {
    transform: translateX(-100%);
    opacity: 0;
}

/* 滚动条样式 */
::-webkit-scrollbar {
    width: 6px;
}

::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
}

::-webkit-scrollbar-thumb {
    background: rgba(0, 206, 209, 0.3);
    border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 206, 209, 0.5);
}
</style>
