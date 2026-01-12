<template>
    <!-- 气象数据面板：显示风、浪、流三种数据 -->
    <transition name="fade">
        <div v-if="pickedPoint" 
             :style="{ left: labelPosition.x + 'px', top: labelPosition.y + 'px' }"
             class="absolute pointer-events-auto"
             style="z-index: 9999;">
            <div class="bg-slate-900/95 backdrop-blur-xl border-2 border-cyan-500/50 rounded-lg px-4 py-3 shadow-[0_0_20px_rgba(0,0,0,0.8)] min-w-[320px] max-w-[400px]">
                <!-- 标题栏 -->
                <div class="flex items-center justify-between mb-3 pb-2 border-b border-cyan-500/30">
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                        <span class="text-white font-medium text-sm">气象数据查询</span>
                    </div>
                    <button @click="closePicker" 
                            class="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                            title="关闭">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <!-- 位置信息 -->
                <div class="text-xs text-slate-400 mb-3 font-mono">
                    📍 {{ pickedPoint.lat.toFixed(4) }}°, {{ pickedPoint.lon.toFixed(4) }}°
                </div>
                
                <!-- 数据列表 -->
                <div class="space-y-3">
                    <!-- 风速 -->
                    <div v-if="pickedPoint.wind" class="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-cyan-400 text-sm font-medium">🌬️ 风速</span>
                            <div class="text-right">
                                <div class="text-white font-['Rajdhani'] font-bold text-lg">
                                    {{ pickedPoint.wind.speed.toFixed(2) }} m/s
                                </div>
                                <div class="text-xs text-slate-400">
                                    方向: {{ pickedPoint.wind.direction.toFixed(1) }}°
                                </div>
                            </div>
                        </div>
                        <div class="text-xs text-slate-500 font-mono">
                            U: {{ pickedPoint.wind.u.toFixed(3) }} | V: {{ pickedPoint.wind.v.toFixed(3) }}
                        </div>
                    </div>
                    
                    <!-- 波高 -->
                    <div v-if="pickedPoint.wave" class="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-cyan-400 text-sm font-medium">🌊 波浪</span>
                            <div class="text-right">
                                <div class="text-white font-['Rajdhani'] font-bold text-lg">
                                    {{ getWaveHeight() }} m
                                </div>
                                <div class="text-xs text-slate-400">
                                    方向: {{ pickedPoint.wave.direction.toFixed(1) }}°
                                </div>
                            </div>
                        </div>
                        <div class="text-xs text-slate-500 font-mono">
                            U: {{ pickedPoint.wave.u.toFixed(3) }} | V: {{ pickedPoint.wave.v.toFixed(3) }}
                            <span v-if="pickedPoint.wave.height !== null && pickedPoint.wave.height !== undefined">
                                | H: {{ pickedPoint.wave.height.toFixed(3) }}
                            </span>
                        </div>
                    </div>
                    
                    <!-- 洋流 -->
                    <div v-if="pickedPoint.current" class="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-cyan-400 text-sm font-medium">🌀 洋流</span>
                            <div class="text-right">
                                <div class="text-white font-['Rajdhani'] font-bold text-lg">
                                    {{ pickedPoint.current.speed.toFixed(2) }} m/s
                                </div>
                                <div class="text-xs text-slate-400">
                                    方向: {{ pickedPoint.current.direction.toFixed(1) }}°
                                </div>
                            </div>
                        </div>
                        <div class="text-xs text-slate-500 font-mono">
                            U: {{ pickedPoint.current.u.toFixed(3) }} | V: {{ pickedPoint.current.v.toFixed(3) }}
                        </div>
                    </div>
                </div>
                
                <!-- 时间戳（如果有） -->
                <div v-if="pickedPoint.timestamp" class="mt-3 pt-2 border-t border-slate-700/50 text-xs text-slate-500">
                    ⏰ {{ pickedPoint.timestamp }}
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
import { ref, watch } from 'vue';

export default {
    props: {
        pickedPoint: {
            type: Object,
            default: null  // { lat, lon, wind, wave, current, screenPosition }
        }
    },
    emits: ['close'],
    setup(props, { emit }) {
        const labelPosition = ref({ x: 0, y: 0 });
        
        // 监听点击位置变化，更新标签位置
        watch(() => props.pickedPoint, (newPoint) => {
            console.log('🔍 pickedPoint 变化:', newPoint);
            if (newPoint) {
                console.log('  - screenPosition:', newPoint.screenPosition);
                if (newPoint.screenPosition) {
                    labelPosition.value = {
                        x: newPoint.screenPosition.x + 10,
                        y: newPoint.screenPosition.y - 200  // 调整位置，避免遮挡
                    };
                    console.log('  - labelPosition 已更新:', labelPosition.value);
                } else {
                    console.warn('  - ⚠️ screenPosition 不存在！');
                }
            }
        });
        
        // 获取波高数据（优先使用 height，否则使用 speed）
        const getWaveHeight = () => {
            if (!props.pickedPoint || !props.pickedPoint.wave) return 'N/A';
            
            const wave = props.pickedPoint.wave;
            
            // 检查是否是无效数据（-9999）
            if (wave.u < -9000) return 'N/A';
            
            // 优先使用 height，如果没有则使用 speed
            const value = wave.height !== undefined && wave.height !== null
                ? wave.height
                : wave.speed;
            
            return value.toFixed(2);
        };
        
        // 关闭选择器
        const closePicker = () => {
            emit('close');
        };
        
        return {
            labelPosition,
            getWaveHeight,
            closePicker
        };
    }
};
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
    opacity: 0;
}
</style>
