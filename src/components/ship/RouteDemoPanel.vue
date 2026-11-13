<template>
    <div class="absolute top-36 left-8 w-[28rem] z-40 pointer-events-none font-['Noto_Sans_SC'] animate-slideInLeft">
        <transition name="slide-down">
            <div v-if="show" class="tech-panel-enhanced p-6 pointer-events-auto relative group" style="clip-path: polygon(0 0, 100% 0, 100% 95%, 92% 100%, 0 100%);">
                <!-- 动态扫描线 -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse"></div>
                <div class="corner-decoration corner-tl scale-125"></div>
                <div class="corner-decoration corner-tr scale-125"></div>
            
                <!-- 标题 -->
                <div class="flex items-center mb-6 border-b-2 border-purple-500/30 pb-3">
                    <div class="w-1.5 h-6 bg-purple-400 mr-3 shadow-[0_0_10px_#a855f7]"></div>
                    <h3 class="text-2xl font-bold text-white tracking-wider flex-1">航线动态</h3>
                    <div class="text-xs font-['Orbitron'] text-purple-500 opacity-80 font-bold tracking-widest">ROUTE DEMO</div>
                </div>

                <!-- 航线信息 -->
                <div v-if="routeInfo" class="space-y-3 mb-6">
                    <div class="bg-slate-800/40 border border-purple-500/30 rounded-sm p-4">
                        <div class="text-purple-400 text-sm font-bold mb-2">{{ routeInfo.name }}</div>
                        <div class="text-xs text-slate-400">{{ routeInfo.description }}</div>
                        <div class="grid grid-cols-2 gap-2 mt-3 text-xs">
                            <div>
                                <span class="text-slate-500">总距离:</span>
                                <span class="text-white ml-2">{{ routeInfo.distance }} 海里</span>
                            </div>
                            <div>
                                <span class="text-slate-500">预计天数:</span>
                                <span class="text-white ml-2">{{ routeInfo.estimatedDays }} 天</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 控制按钮 -->
                <div class="flex gap-2 mb-6">
                    <button 
                        v-if="!isPlaying"
                        @click="handlePlay"
                        class="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold rounded-sm transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                    >
                        ▶️ 开始演示
                    </button>
                    <button 
                        v-if="isPlaying && !isPaused"
                        @click="handlePause"
                        class="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white font-bold rounded-sm transition-all shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                    >
                        ⏸️ 暂停
                    </button>
                    <button 
                        v-if="isPlaying && isPaused"
                        @click="handleResume"
                        class="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold rounded-sm transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                    >
                        ▶️ 继续
                    </button>
                    <button 
                        @click="handleStop"
                        :disabled="!isPlaying"
                        class="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-sm transition-all"
                    >
                        ⏹️ 停止
                    </button>
                </div>

                <!-- 速度控制 -->
                <div class="space-y-2 mb-6">
                    <div class="text-purple-400 text-sm font-bold flex items-center">
                        <div class="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2"></div>
                        播放速度
                    </div>
                    <div class="flex gap-2">
                        <button 
                            v-for="speed in speedOptions" 
                            :key="speed"
                            @click="handleSpeedChange(speed)"
                            :class="[
                                'flex-1 px-3 py-1.5 text-sm font-bold rounded-sm transition-all',
                                currentSpeed === speed
                                    ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                            ]"
                        >
                            {{ speed }}x
                        </button>
                    </div>
                </div>

                <!-- 进度条 -->
                <div class="space-y-2 mb-6">
                    <div class="flex justify-between text-xs">
                        <span class="text-slate-400">进度</span>
                        <span class="text-purple-400 font-bold">{{ progress.toFixed(1) }}%</span>
                    </div>
                    <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            class="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-300"
                            :style="{ width: progress + '%' }"
                        ></div>
                    </div>
                    <div class="text-xs text-slate-500">
                        航点: {{ currentWaypointIndex + 1 }} / {{ totalWaypoints }}
                    </div>
                </div>

                <!-- 当前航段气象 -->
                <div v-if="currentWeather" class="space-y-2">
                    <div class="text-purple-400 text-sm font-bold flex items-center">
                        <div class="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2"></div>
                        当前航段气象
                    </div>
                    <div 
                        :class="[
                            'border-2 rounded-sm p-4 space-y-2',
                            getRiskStyle(currentWeather.risk).border
                        ]"
                        :style="{ 
                            backgroundColor: getRiskStyle(currentWeather.risk).bg,
                            borderColor: getRiskStyle(currentWeather.risk).borderColor
                        }"
                    >
                        <!-- 航点名称和风险等级 -->
                        <div class="flex items-center justify-between mb-3">
                            <div class="text-white font-bold">{{ currentWeather.name }}</div>
                            <div 
                                :class="['px-3 py-1 rounded-sm text-sm font-bold']"
                                :style="{ 
                                    backgroundColor: getRiskStyle(currentWeather.risk).color,
                                    color: '#fff'
                                }"
                            >
                                {{ getRiskLabel(currentWeather.risk) }}
                            </div>
                        </div>

                        <!-- 气象数据 -->
                        <div class="grid grid-cols-2 gap-2 text-xs">
                            <div class="flex justify-between">
                                <span class="text-slate-300">风速:</span>
                                <span class="text-white font-bold">{{ currentWeather.weather.windSpeed }} m/s</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-300">风级:</span>
                                <span class="text-white font-bold">{{ currentWeather.weather.windBeaufort }} 级</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-300">浪高:</span>
                                <span class="text-white font-bold">{{ currentWeather.weather.waveHeight }} m</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-300">能见度:</span>
                                <span class="text-white font-bold">{{ (currentWeather.weather.visibility / 1000).toFixed(1) }} km</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-300">风向:</span>
                                <span class="text-white font-bold">{{ currentWeather.weather.windDirection }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-300">温度:</span>
                                <span class="text-white font-bold">{{ currentWeather.weather.temperature }}°C</span>
                            </div>
                        </div>

                        <!-- 下一航段信息 -->
                        <div v-if="currentWeather.segment" class="pt-2 border-t border-white/20 text-xs text-slate-300">
                            <div>下一航段: {{ currentWeather.segment.to }}</div>
                            <div class="flex justify-between mt-1">
                                <span>距离: {{ currentWeather.segment.distance }} 海里</span>
                                <span>预计: {{ currentWeather.segment.duration }}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 下一航段气象 -->
                <div v-if="nextWeather" class="space-y-2 mt-4">
                    <div class="text-cyan-400 text-sm font-bold flex items-center">
                        <div class="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-2"></div>
                        下一航段气象
                    </div>
                    <div 
                        :class="[
                            'border-2 rounded-sm p-4 space-y-2',
                            getRiskStyle(nextWeather.risk).border
                        ]"
                        :style="{ 
                            backgroundColor: getRiskStyle(nextWeather.risk).bg,
                            borderColor: getRiskStyle(nextWeather.risk).borderColor
                        }"
                    >
                        <!-- 航点名称和风险等级 -->
                        <div class="flex items-center justify-between mb-3">
                            <div class="text-white font-bold">{{ nextWeather.name }}</div>
                            <div 
                                :class="['px-3 py-1 rounded-sm text-sm font-bold']"
                                :style="{ 
                                    backgroundColor: getRiskStyle(nextWeather.risk).color,
                                    color: '#fff'
                                }"
                            >
                                {{ getRiskLabel(nextWeather.risk) }}
                            </div>
                        </div>

                        <!-- 气象数据 -->
                        <div class="grid grid-cols-2 gap-2 text-xs">
                            <div class="flex justify-between">
                                <span class="text-slate-300">风速:</span>
                                <span class="text-white font-bold">{{ nextWeather.weather.windSpeed }} m/s</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-300">风级:</span>
                                <span class="text-white font-bold">{{ nextWeather.weather.windBeaufort }} 级</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-300">浪高:</span>
                                <span class="text-white font-bold">{{ nextWeather.weather.waveHeight }} m</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-300">能见度:</span>
                                <span class="text-white font-bold">{{ (nextWeather.weather.visibility / 1000).toFixed(1) }} km</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-300">风向:</span>
                                <span class="text-white font-bold">{{ nextWeather.weather.windDirection }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-300">温度:</span>
                                <span class="text-white font-bold">{{ nextWeather.weather.temperature }}°C</span>
                            </div>
                        </div>

                        <!-- 航段信息 -->
                        <div v-if="nextWeather.segment" class="pt-2 border-t border-white/20 text-xs text-slate-300">
                            <div>到达: {{ nextWeather.segment.to }}</div>
                            <div class="flex justify-between mt-1">
                                <span>距离: {{ nextWeather.segment.distance }} 海里</span>
                                <span>预计: {{ nextWeather.segment.duration }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script>
import { ref, computed } from 'vue';

export default {
    name: 'RouteDemoPanel',
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['play', 'pause', 'resume', 'stop', 'speedChange'],
    
    setup(props, { emit }) {
        const isPlaying = ref(false);
        const isPaused = ref(false);
        const currentSpeed = ref(1);
        const speedOptions = [0.5, 1, 2, 5, 10, 20];
        const progress = ref(0);
        const currentWaypointIndex = ref(0);
        const totalWaypoints = ref(22);
        const currentWeather = ref(null);
        const nextWeather = ref(null);  // 添加下一航段气象数据
        const routeInfo = ref(null);

        // 风险等级样式
        const riskStyles = {
            safe: {
                color: '#10b981',
                bg: 'rgba(16, 185, 129, 0.1)',
                border: 'border-green-500/50',
                borderColor: 'rgba(16, 185, 129, 0.5)'
            },
            caution: {
                color: '#f59e0b',
                bg: 'rgba(245, 158, 11, 0.1)',
                border: 'border-yellow-500/50',
                borderColor: 'rgba(245, 158, 11, 0.5)'
            },
            warning: {
                color: '#f97316',
                bg: 'rgba(249, 115, 22, 0.1)',
                border: 'border-orange-500/50',
                borderColor: 'rgba(249, 115, 22, 0.5)'
            },
            danger: {
                color: '#ef4444',
                bg: 'rgba(239, 68, 68, 0.1)',
                border: 'border-red-500/50',
                borderColor: 'rgba(239, 68, 68, 0.5)'
            }
        };

        const riskLabels = {
            safe: '安全',
            caution: '注意',
            warning: '警告',
            danger: '危险'
        };

        const getRiskStyle = (risk) => riskStyles[risk] || riskStyles.safe;
        const getRiskLabel = (risk) => riskLabels[risk] || '未知';

        const handlePlay = () => {
            isPlaying.value = true;
            isPaused.value = false;
            emit('play');
        };

        const handlePause = () => {
            isPaused.value = true;
            emit('pause');
        };

        const handleResume = () => {
            isPaused.value = false;
            emit('resume');
        };

        const handleStop = () => {
            isPlaying.value = false;
            isPaused.value = false;
            progress.value = 0;
            currentWaypointIndex.value = 0;
            currentWeather.value = null;
            emit('stop');
        };

        const handleSpeedChange = (speed) => {
            currentSpeed.value = speed;
            emit('speedChange', speed);
        };

        // 更新进度
        const updateProgress = (waypointIndex, total) => {
            currentWaypointIndex.value = waypointIndex;
            totalWaypoints.value = total;
            progress.value = (waypointIndex / (total - 1)) * 100;
        };

        // 更新气象信息
        const updateWeather = (waypoint) => {
            currentWeather.value = waypoint;
        };
        
        // 更新下一航段气象信息
        const updateNextWeather = (waypoint) => {
            nextWeather.value = waypoint;
        };

        // 设置航线信息
        const setRouteInfo = (info) => {
            routeInfo.value = info;
        };

        return {
            isPlaying,
            isPaused,
            currentSpeed,
            speedOptions,
            progress,
            currentWaypointIndex,
            totalWaypoints,
            currentWeather,
            nextWeather,
            routeInfo,
            getRiskStyle,
            getRiskLabel,
            handlePlay,
            handlePause,
            handleResume,
            handleStop,
            handleSpeedChange,
            updateProgress,
            updateWeather,
            updateNextWeather,
            setRouteInfo
        };
    }
};
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
    opacity: 0;
    transform: translateY(-20px);
}
</style>
