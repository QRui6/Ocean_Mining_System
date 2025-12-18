<template>
    <transition name="slide-up">
        <div v-if="show" class="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-auto">
            <!-- 时间轴控制面板 -->
            <div class="w-[1200px] bg-slate-950/95 backdrop-blur-xl border-2 border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.4)]" style="clip-path: polygon(2% 0, 98% 0, 100% 100%, 0 100%)">
                <!-- 顶部装饰线 -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-pulse"></div>
                
                <!-- 内容区 -->
                <div class="p-6">
                    <!-- 标题栏 -->
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-2 h-2 bg-yellow-400 rotate-45 shadow-[0_0_8px_#facc15]"></div>
                            <h3 class="text-xl font-bold text-white tracking-wider font-['Noto_Sans_SC']">时序播放控制</h3>
                            <span class="text-xs text-cyan-400 font-mono border border-cyan-500/30 px-2 py-0.5 rounded bg-cyan-900/30">TIMELINE</span>
                        </div>
                        <button @click="$emit('close')" class="text-slate-400 hover:text-white transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                    
                    <!-- 控制区 -->
                    <div class="flex items-center gap-6">
                        <!-- 播放控制 -->
                        <div class="flex items-center gap-2">
                            <button 
                                @click="playPrev"
                                class="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 border border-cyan-500/30 hover:border-cyan-400 rounded transition-all"
                                title="上一帧"
                            >
                                <svg class="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                                </svg>
                            </button>
                            
                            <button 
                                @click="togglePlay"
                                class="w-12 h-12 flex items-center justify-center bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 border-2 border-cyan-400 rounded shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all"
                                :title="isPlaying ? '暂停' : '播放'"
                            >
                                <svg v-if="!isPlaying" class="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                </svg>
                                <svg v-else class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                                </svg>
                            </button>
                            
                            <button 
                                @click="playNext"
                                class="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 border border-cyan-500/30 hover:border-cyan-400 rounded transition-all"
                                title="下一帧"
                            >
                                <svg class="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M16 18h2V6h-2zm-11-7l8.5-6v12z"/>
                                </svg>
                            </button>
                        </div>
                        
                        <!-- 时间轴 -->
                        <div class="flex-1">
                            <!-- 当前时间显示 -->
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm text-cyan-400 font-mono">{{ formatDate(currentTime) }}</span>
                                <span class="text-lg text-white font-bold font-['Rajdhani'] tracking-wider">{{ formatTime(currentTime) }}</span>
                            </div>
                            
                            <!-- 进度条 -->
                            <div class="relative">
                                <input 
                                    type="range" 
                                    v-model="currentIndex"
                                    :min="0" 
                                    :max="timeSteps.length - 1"
                                    class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer timeline-slider"
                                    @input="onTimeChange"
                                />
                                <!-- 进度指示器 -->
                                <div class="flex justify-between mt-1 text-xs text-slate-500 font-mono">
                                    <span>{{ formatTime(timeSteps[0]) }}</span>
                                    <span>{{ currentIndex + 1 }} / {{ timeSteps.length }}</span>
                                    <span>{{ formatTime(timeSteps[timeSteps.length - 1]) }}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 速度控制 -->
                        <div class="flex flex-col items-center gap-2">
                            <span class="text-xs text-slate-400">播放速度</span>
                            <select 
                                v-model="playSpeed"
                                class="px-3 py-1 bg-slate-800 border border-cyan-500/30 text-cyan-400 rounded text-sm font-mono focus:outline-none focus:border-cyan-400"
                            >
                                <option value="0.5">0.5x</option>
                                <option value="1">1x</option>
                                <option value="2">2x</option>
                                <option value="4">4x</option>
                            </select>
                        </div>
                        
                        <!-- 时间范围切换 -->
                        <div class="flex flex-col gap-2">
                            <button 
                                @click="setTimeRange('past')"
                                :class="[
                                    'px-4 py-2 text-sm font-bold rounded transition-all border',
                                    timeRange === 'past'
                                        ? 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                                        : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-cyan-500/50'
                                ]"
                            >
                                过去7天
                            </button>
                            <button 
                                @click="setTimeRange('future')"
                                :class="[
                                    'px-4 py-2 text-sm font-bold rounded transition-all border',
                                    timeRange === 'future'
                                        ? 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                                        : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-cyan-500/50'
                                ]"
                            >
                                未来7天
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
import { ref, computed } from 'vue';

export default {
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['close', 'timeChange'],
    setup(props, { emit }) {
        const isPlaying = ref(false);
        const currentIndex = ref(0);
        const playSpeed = ref(1);
        const timeRange = ref('past');
        
        // 生成时间步长（示例：每6小时一个点，共7天）
        const generateTimeSteps = (range) => {
            const steps = [];
            const now = new Date();
            const startOffset = range === 'past' ? -7 : 0;
            const endOffset = range === 'past' ? 0 : 7;
            
            for (let day = startOffset; day <= endOffset; day++) {
                for (let hour = 0; hour < 24; hour += 6) {
                    const time = new Date(now);
                    time.setDate(time.getDate() + day);
                    time.setHours(hour, 0, 0, 0);
                    steps.push(time);
                }
            }
            return steps;
        };
        
        const timeSteps = ref(generateTimeSteps('past'));
        
        const currentTime = computed(() => {
            return timeSteps.value[currentIndex.value] || new Date();
        });
        
        const formatDate = (date) => {
            const y = date.getFullYear();
            const m = (date.getMonth() + 1).toString().padStart(2, '0');
            const d = date.getDate().toString().padStart(2, '0');
            return `${y}-${m}-${d}`;
        };
        
        const formatTime = (date) => {
            const h = date.getHours().toString().padStart(2, '0');
            const m = date.getMinutes().toString().padStart(2, '0');
            return `${h}:${m}`;
        };
        
        const togglePlay = () => {
            isPlaying.value = !isPlaying.value;
            // TODO: 实现自动播放逻辑
        };
        
        const playPrev = () => {
            if (currentIndex.value > 0) {
                currentIndex.value--;
                onTimeChange();
            }
        };
        
        const playNext = () => {
            if (currentIndex.value < timeSteps.value.length - 1) {
                currentIndex.value++;
                onTimeChange();
            }
        };
        
        const onTimeChange = () => {
            emit('timeChange', currentTime.value);
        };
        
        const setTimeRange = (range) => {
            timeRange.value = range;
            timeSteps.value = generateTimeSteps(range);
            currentIndex.value = 0;
            onTimeChange();
        };
        
        return {
            isPlaying,
            currentIndex,
            playSpeed,
            timeRange,
            timeSteps,
            currentTime,
            formatDate,
            formatTime,
            togglePlay,
            playPrev,
            playNext,
            onTimeChange,
            setTimeRange
        };
    }
};
</script>

<style scoped>
/* 时间轴滑块样式 */
.timeline-slider::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    background: linear-gradient(135deg, #06b6d4, #0891b2);
    border: 2px solid #22d3ee;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(6, 182, 212, 0.6);
    transition: all 0.2s;
}

.timeline-slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 0 15px rgba(6, 182, 212, 0.8);
}

.timeline-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: linear-gradient(135deg, #06b6d4, #0891b2);
    border: 2px solid #22d3ee;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(6, 182, 212, 0.6);
    transition: all 0.2s;
}

.timeline-slider::-moz-range-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 0 15px rgba(6, 182, 212, 0.8);
}

/* 滑入动画 */
.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.slide-up-enter-from {
    opacity: 0;
    transform: translate(-50%, 100px);
}

.slide-up-leave-to {
    opacity: 0;
    transform: translate(-50%, 100px);
}
</style>
