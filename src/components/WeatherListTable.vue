<template>
    <!-- 位置调整：右下角，与船舶列表类似的布局 - 添加 pointer-events-auto 使其可点击 -->
    <div class="absolute bottom-2 left-[31rem] right-8 h-[25rem] z-30 animate-slideUp flex flex-col pointer-events-auto">
        <!-- Top Decor -->
        <div class="h-3 w-full bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent pointer-events-none"></div>
        
        <div class="flex-1 bg-slate-950/95 backdrop-blur-lg border-t-2 border-cyan-500/30 flex flex-col relative overflow-hidden pointer-events-auto">
            <!-- 简化的Header -->
            <div class="h-12 flex items-center justify-between px-6 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-900/30 to-transparent">
                <div class="flex items-center gap-3">
                    <div class="w-1 h-5 bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></div>
                    <h3 class="text-lg font-bold text-cyan-50 tracking-wider">航线气象数据</h3>
                    <span class="text-xs text-cyan-500/60 font-['Orbitron'] tracking-wider">{{ weatherData.length }} 个采样点</span>
                </div>
                <!-- 简化的工具栏 -->
                <div class="flex gap-4 text-cyan-400 text-sm font-bold items-center">
                    <div class="flex items-center gap-2 text-xs opacity-70">
                        <svg class="w-3 h-3" v-if="refreshCountdown <= 10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span class="font-['Rajdhani']">{{ formatCountdown(refreshCountdown) }}</span>
                    </div>
                    <button @click="handleManualRefresh" class="hover:text-white transition-colors">
                        刷新
                    </button>
                    <button @click="$emit('clear')" class="hover:text-white transition-colors">
                        清空
                    </button>
                </div>
            </div>
        
            <!-- 横向时间轴表格 -->
            <div class="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar px-4 py-2 min-h-0">
                <div v-if="weatherData.length === 0" class="flex items-center justify-center h-full">
                    <div class="text-center text-slate-500">
                        <div>暂无气象数据</div>
                    </div>
                </div>
                
                <table v-else class="w-full border-collapse text-xs">
                    <thead class="bg-cyan-900/20 text-cyan-200 sticky top-0 backdrop-blur-md z-10">
                        <tr>
                            <th class="px-3 py-2 font-bold border-b-2 border-cyan-500/30 text-left sticky left-0 bg-cyan-900/40 backdrop-blur-md z-20 w-28">时间</th>
                            <th v-for="(item, index) in weatherData" :key="index" 
                                class="px-2 py-2 font-bold border-b-2 border-cyan-500/30 text-center min-w-[85px] cursor-pointer hover:bg-cyan-500/20 transition-colors"
                                @click="handleRowClick(item, index)"
                                :class="selectedRow === index ? 'bg-cyan-500/30' : ''"
                            >
                                <div class="text-xs whitespace-nowrap">{{ formatArrivalTime(item.arrivalTime) }}</div>
                            </th>
                        </tr>
                    </thead>
                    <tbody class="text-slate-300 font-['Rajdhani']">
                        <!-- 节点 -->
                        <tr class="border-b border-slate-800 hover:bg-cyan-500/5">
                            <td class="px-3 py-2 font-bold text-cyan-400 sticky left-0 bg-slate-950/95 backdrop-blur-md z-10 w-28">节点</td>
                            <td v-for="(item, index) in weatherData" :key="index" 
                                class="px-2 py-2 text-center text-cyan-500 font-bold text-xs"
                                :class="selectedRow === index ? 'bg-cyan-500/10' : ''"
                            >
                                {{ index + 1 }}
                            </td>
                        </tr>
                        
                        <!-- 综合风险 -->
                        <tr class="border-b-2 border-slate-700 hover:bg-cyan-500/5">
                            <td class="px-3 py-2 font-bold text-cyan-400 sticky left-0 bg-slate-950/95 backdrop-blur-md z-10 w-28">综合风险</td>
                            <td v-for="(item, index) in weatherData" :key="index" 
                                class="px-2 py-2 text-center font-bold text-xs"
                                :class="[
                                    getRiskTextClass(item.risk),
                                    getRiskBgClass(item.risk),
                                    selectedRow === index ? 'ring-2 ring-cyan-500' : ''
                                ]"
                            >
                                {{ getRiskLabel(item.risk) }}
                            </td>
                        </tr>
                        
                        <!-- 距离 -->
                        <tr class="border-b border-slate-800 hover:bg-cyan-500/5">
                            <td class="px-3 py-2 font-bold text-cyan-400 sticky left-0 bg-slate-950/95 backdrop-blur-md z-10 w-28">距离(nm)</td>
                            <td v-for="(item, index) in weatherData" :key="index" 
                                class="px-2 py-2 text-center text-white font-bold text-xs"
                                :class="selectedRow === index ? 'bg-cyan-500/10' : ''"
                            >
                                {{ formatDistance(item.distanceFromStart) }}
                            </td>
                        </tr>
                        
                        <!-- 风速 -->
                        <tr class="border-b border-slate-800 hover:bg-cyan-500/5">
                            <td class="px-3 py-2 font-bold text-cyan-400 sticky left-0 bg-slate-950/95 backdrop-blur-md z-10 w-28">风速(m/s)</td>
                            <td v-for="(item, index) in weatherData" :key="index" 
                                class="px-2 py-2 text-center font-bold text-xs"
                                :class="[
                                    getWindSpeedClass(item.weather.windspeed),
                                    getWindSpeedBgClass(item.weather.windspeed),
                                    selectedRow === index ? 'ring-2 ring-cyan-500' : ''
                                ]"
                            >
                                {{ (item.weather.windspeed || 0).toFixed(1) }}
                            </td>
                        </tr>
                        
                        <!-- 风向 -->
                        <tr class="border-b border-slate-800 hover:bg-cyan-500/5">
                            <td class="px-3 py-2 font-bold text-cyan-400 sticky left-0 bg-slate-950/95 backdrop-blur-md z-10 w-28">风向(°)</td>
                            <td v-for="(item, index) in weatherData" :key="index" 
                                class="px-2 py-2 text-center text-xs"
                                :class="selectedRow === index ? 'bg-cyan-500/10' : ''"
                            >
                                {{ item.weather.winddir || 'N/A' }}
                            </td>
                        </tr>
                        
                        <!-- 浪高 -->
                        <tr class="border-b border-slate-800 hover:bg-cyan-500/5">
                            <td class="px-3 py-2 font-bold text-cyan-400 sticky left-0 bg-slate-950/95 backdrop-blur-md z-10 w-28">浪高(m)</td>
                            <td v-for="(item, index) in weatherData" :key="index" 
                                class="px-2 py-2 text-center font-bold text-xs"
                                :class="[
                                    getWaveHeightClass(item.weather.waveheight),
                                    getWaveHeightBgClass(item.weather.waveheight),
                                    selectedRow === index ? 'ring-2 ring-cyan-500' : ''
                                ]"
                            >
                                {{ (item.weather.waveheight || 0).toFixed(1) }}
                            </td>
                        </tr>
                        
                        <!-- 涌浪 -->
                        <tr class="border-b border-slate-800 hover:bg-cyan-500/5">
                            <td class="px-3 py-2 font-bold text-cyan-400 sticky left-0 bg-slate-950/95 backdrop-blur-md z-10 w-28">涌浪(m)</td>
                            <td v-for="(item, index) in weatherData" :key="index" 
                                class="px-2 py-2 text-center text-xs"
                                :class="selectedRow === index ? 'bg-cyan-500/10' : ''"
                            >
                                {{ (item.weather.swellheight || 0).toFixed(1) }}
                            </td>
                        </tr>
                        
                        <!-- 能见度 -->
                        <tr class="border-b border-slate-800 hover:bg-cyan-500/5">
                            <td class="px-3 py-2 font-bold text-cyan-400 sticky left-0 bg-slate-950/95 backdrop-blur-md z-10 w-28">能见度(m)</td>
                            <td v-for="(item, index) in weatherData" :key="index" 
                                class="px-2 py-2 text-center text-xs"
                                :class="selectedRow === index ? 'bg-cyan-500/10' : ''"
                            >
                                {{ (item.weather.visibility || 0).toFixed(0) }}
                            </td>
                        </tr>
                        
                        <!-- 气温 -->
                        <tr class="border-b border-slate-800 hover:bg-cyan-500/5">
                            <td class="px-3 py-2 font-bold text-cyan-400 sticky left-0 bg-slate-950/95 backdrop-blur-md z-10 w-28">气温(°C)</td>
                            <td v-for="(item, index) in weatherData" :key="index" 
                                class="px-2 py-2 text-center text-xs"
                                :class="selectedRow === index ? 'bg-cyan-500/10' : ''"
                            >
                                {{ (item.weather.temperature || 0).toFixed(1) }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { calculateRiskLevel, getRiskClasses, getWindSpeedRiskLevel, getWaveHeightRiskLevel } from '../utils/weatherRiskAssessment.js';

export default {
    props: {
        weatherData: {
            type: Array,
            default: () => []
        },
        thresholds: {
            type: Object,
            default: null
        }
    },
    emits: ['clear', 'filter', 'rowClick', 'refresh'],
    setup(props, { emit }) {
        const selectedRow = ref(null);
        
        // 刷新倒计时（5分钟 = 300秒）
        const refreshCountdown = ref(300);
        let refreshTimer = null;
        
        // 处理行点击
        const handleRowClick = (item, index) => {
            selectedRow.value = index;
            emit('rowClick', item, index);
        };
        
        // 格式化距离
        const formatDistance = (distance) => {
            if (distance === undefined || distance === null) return '0';
            return distance.toFixed(1);
        };
        
        // 格式化到达时间
        const formatArrivalTime = (timestamp) => {
            if (!timestamp) return 'N/A';
            const date = new Date(timestamp);
            return date.toLocaleString('zh-CN', { 
                month: '2-digit', 
                day: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit'
            });
        };
        
        // 获取风速对应的样式类（使用自定义阈值）
        const getWindSpeedClass = (windSpeed) => {
            if (!windSpeed) return 'text-slate-400';
            const riskLevel = getWindSpeedRiskLevel(windSpeed, props.thresholds);
            const classes = getRiskClasses(riskLevel);
            return classes.textClass;
        };
        
        const getWindSpeedBgClass = (windSpeed) => {
            if (!windSpeed) return 'bg-slate-800/30';
            const riskLevel = getWindSpeedRiskLevel(windSpeed, props.thresholds);
            const classes = getRiskClasses(riskLevel);
            return classes.bgClass;
        };
        
        // 获取浪高对应的样式类（使用自定义阈值）
        const getWaveHeightClass = (waveHeight) => {
            if (!waveHeight) return 'text-slate-400';
            const riskLevel = getWaveHeightRiskLevel(waveHeight, props.thresholds);
            const classes = getRiskClasses(riskLevel);
            return classes.textClass;
        };
        
        const getWaveHeightBgClass = (waveHeight) => {
            if (!waveHeight) return 'bg-slate-800/30';
            const riskLevel = getWaveHeightRiskLevel(waveHeight, props.thresholds);
            const classes = getRiskClasses(riskLevel);
            return classes.bgClass;
        };
        
        // 获取综合风险的样式类
        const getRiskTextClass = (risk) => {
            if (!risk) return 'text-slate-400';
            const classes = getRiskClasses(risk.level);
            return classes.textClass;
        };
        
        const getRiskBgClass = (risk) => {
            if (!risk) return 'bg-slate-800/30';
            const classes = getRiskClasses(risk.level);
            return classes.bgClass;
        };
        
        // 获取风险等级标签
        const getRiskLabel = (risk) => {
            if (!risk) return 'N/A';
            const labels = {
                'safe': '安全',
                'caution': '注意',
                'warning': '警告',
                'danger': '危险',
                'unknown': '未知'
            };
            return labels[risk.level] || 'N/A';
        };
        
        // 格式化倒计时
        const formatCountdown = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };
        
        // 手动刷新
        const handleManualRefresh = () => {
            refreshCountdown.value = 300;
            emit('refresh');
        };
        
        // 启动刷新定时器
        const startRefreshTimer = () => {
            refreshTimer = setInterval(() => {
                refreshCountdown.value--;
                if (refreshCountdown.value <= 0) {
                    emit('refresh');
                    refreshCountdown.value = 300;
                }
            }, 1000);
        };
        
        // 监听数据变化，重置倒计时
        watch(() => props.weatherData, (newData, oldData) => {
            console.log('📊 WeatherListTable: weatherData 变化');
            console.log('   - 新数据点数量:', newData?.length);
            console.log('   - 第一个点的风险:', newData?.[0]?.risk);
            refreshCountdown.value = 300;
        }, { deep: true });
        
        // 监听阈值变化
        watch(() => props.thresholds, (newThresholds, oldThresholds) => {
            console.log('⚙️ WeatherListTable: thresholds 变化');
            console.log('   - 新阈值:', newThresholds);
            console.log('   - 旧阈值:', oldThresholds);
        }, { deep: true });
        
        onMounted(() => {
            startRefreshTimer();
        });
        
        onUnmounted(() => {
            if (refreshTimer) {
                clearInterval(refreshTimer);
            }
        });
        
        return {
            selectedRow,
            refreshCountdown,
            weatherData: computed(() => props.weatherData),
            handleRowClick,
            formatDistance,
            formatArrivalTime,
            getWindSpeedClass,
            getWindSpeedBgClass,
            getWaveHeightClass,
            getWaveHeightBgClass,
            getRiskTextClass,
            getRiskBgClass,
            getRiskLabel,
            formatCountdown,
            handleManualRefresh
        };
    }
};
</script>

<style scoped>
/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.5);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(6, 182, 212, 0.6), rgba(6, 182, 212, 0.3));
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, rgba(6, 182, 212, 0.9), rgba(6, 182, 212, 0.6));
}
</style>
