<template>
    <!-- 底部横向卡片布局 -->
    <div class="absolute bottom-2 left-8 right-8 z-30 animate-slideUp pointer-events-auto">
        <div v-if="weatherData.length === 0" class="text-center text-[16px] text-slate-300 bg-slate-950/95 backdrop-blur-lg border border-cyan-500/30 rounded p-4">
            暂无气象数据
        </div>
        
        <!-- 横向排列的卡片容器 -->
        <div v-else class="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
            <!-- 当前气象卡片 -->
            <div class="flex-shrink-0 w-72 bg-slate-950/95 backdrop-blur-lg border-t-2 border-cyan-500/30 rounded-lg overflow-hidden">
                <div class="h-10 flex items-center justify-between px-3.5 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-900/30 to-transparent">
                    <div class="flex items-center gap-2">
                        <div class="w-1.5 h-4 bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></div>
                        <h3 class="text-[16px] font-bold text-white">当前气象</h3>
                    </div>
                </div>
                <div class="p-3.5 space-y-2">
                    <div class="grid grid-cols-3 gap-2">
                        <div class="text-center">
                            <div class="text-[14px] text-slate-400">风速</div>
                            <div class="text-[22px] font-bold text-yellow-300 tabular-nums">{{ (currentWeather.windspeed || 0).toFixed(1) }}</div>
                            <div class="text-[14px] text-slate-400">m/s</div>
                        </div>
                        <div class="text-center">
                            <div class="text-[14px] text-slate-400">浪高</div>
                            <div class="text-[22px] font-bold text-yellow-300 tabular-nums">{{ (currentWeather.waveheight || 0).toFixed(1) }}</div>
                            <div class="text-[14px] text-slate-400">m</div>
                        </div>
                        <div class="text-center">
                            <div class="text-[14px] text-slate-400">温度</div>
                            <div class="text-[22px] font-bold text-cyan-300 tabular-nums">{{ (currentWeather.temperature || 0).toFixed(0) }}</div>
                            <div class="text-[14px] text-slate-400">°C</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 航程预报卡片 -->
            <div class="flex-shrink-0 w-[540px] h-48 bg-slate-950/95 backdrop-blur-lg border-t-2 border-cyan-500/30 rounded-lg overflow-hidden relative">
                <div class="absolute top-0 left-0 right-0 h-10 flex items-center justify-between px-3.5 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-900/30 to-transparent z-10">
                    <div class="flex items-center gap-2">
                        <div class="w-1.5 h-4 bg-yellow-400 shadow-[0_0_8px_#facc15]"></div>
                        <h3 class="text-[16px] font-bold text-white">航程预报 ({{ routeForecast.length }}天)</h3>
                    </div>
                    <div class="flex gap-3 text-[14px] font-semibold">
                        <button @click="handleManualRefresh" class="text-cyan-300 hover:text-white transition-colors">刷新</button>
                        <button @click="$emit('clear')" class="text-cyan-300 hover:text-white transition-colors">清空</button>
                    </div>
                </div>
                <div class="absolute top-10 left-0 right-0 bottom-0 overflow-y-auto custom-scrollbar">
                    <table class="w-full text-[15px]">
                        <thead class="text-cyan-300 sticky top-0 bg-slate-950/95">
                            <tr class="border-b border-cyan-500/20">
                                <th class="px-2.5 py-2.5 text-left">日期</th>
                                <th class="px-2.5 py-2.5 text-center">风速</th>
                                <th class="px-2.5 py-2.5 text-center">浪高</th>
                                <th class="px-2.5 py-2.5 text-center">状态</th>
                            </tr>
                        </thead>
                        <tbody class="text-slate-200">
                            <tr v-for="(item, index) in routeForecast" :key="index" 
                                class="border-b border-slate-800/50 hover:bg-cyan-500/5 cursor-pointer"
                                @click="handleRowClick(item, index)"
                                :class="selectedRow === index ? 'bg-cyan-500/10' : ''"
                            >
                                <td class="px-2.5 py-2.5 tabular-nums">{{ formatDate(item.arrivalTime) }}</td>
                                <td class="px-2.5 py-2.5 text-center font-bold tabular-nums" :class="getWindSpeedClass(item.weather.windspeed)">
                                    {{ (item.weather.windspeed || 0).toFixed(1) }} m/s
                                </td>
                                <td class="px-2.5 py-2.5 text-center font-bold tabular-nums" :class="getWaveHeightClass(item.weather.waveheight)">
                                    {{ (item.weather.waveheight || 0).toFixed(1) }} m
                                </td>
                                <td class="px-2.5 py-2.5 text-center">
                                    <span class="px-2.5 py-0.5 rounded text-[14px] font-bold" :class="[getRiskTextClass(item.risk), getRiskBgClass(item.risk)]">
                                        {{ getRiskLabel(item.risk) }}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- 风险统计卡片 -->
            <div class="flex-shrink-0 w-72 bg-slate-950/95 backdrop-blur-lg border-t-2 border-cyan-500/30 rounded-lg overflow-hidden">
                <div class="h-10 flex items-center justify-between px-3.5 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-900/30 to-transparent">
                    <div class="flex items-center gap-2">
                        <div class="w-1.5 h-4 bg-green-400 shadow-[0_0_8px_#4ade80]"></div>
                        <h3 class="text-[16px] font-bold text-white">风险统计</h3>
                    </div>
                </div>
                <div class="p-3.5 space-y-2">
                    <div class="grid grid-cols-2 gap-2.5">
                        <div class="bg-red-900/20 border border-red-500/30 rounded p-2.5 text-center">
                            <div class="text-[14px] text-red-300">高风险天数</div>
                            <div class="text-[28px] font-bold text-red-400 tabular-nums">{{ riskStats.danger }}</div>
                            <div class="text-[14px] text-slate-400">天</div>
                        </div>
                        <div class="bg-green-900/20 border border-green-500/30 rounded p-2.5 text-center">
                            <div class="text-[14px] text-green-300">适航天数</div>
                            <div class="text-[28px] font-bold text-green-400 tabular-nums">{{ riskStats.safe }}</div>
                            <div class="text-[14px] text-slate-400">天</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 到达后预报卡片 -->
            <div v-if="afterArrivalForecast.length > 0" class="flex-shrink-0 w-[460px] h-48 bg-slate-950/95 backdrop-blur-lg border-t-2 border-cyan-500/30 rounded-lg overflow-hidden relative">
                <div class="absolute top-0 left-0 right-0 h-10 flex items-center justify-between px-3.5 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-900/30 to-transparent z-10">
                    <div class="flex items-center gap-2">
                        <div class="w-1.5 h-4 bg-purple-400 shadow-[0_0_8px_#c084fc]"></div>
                        <h3 class="text-[16px] font-bold text-white">到达后预报 ({{ afterArrivalForecast.length }}天)</h3>
                    </div>
                </div>
                <div class="absolute top-10 left-0 right-0 bottom-0 overflow-y-auto custom-scrollbar">
                    <table class="w-full text-[15px]">
                        <thead class="text-cyan-300 sticky top-0 bg-slate-950/95">
                            <tr class="border-b border-cyan-500/20">
                                <th class="px-2.5 py-2.5 text-left">日期</th>
                                <th class="px-2.5 py-2.5 text-center">风速</th>
                                <th class="px-2.5 py-2.5 text-center">浪高</th>
                                <th class="px-2.5 py-2.5 text-center">作业</th>
                            </tr>
                        </thead>
                        <tbody class="text-slate-200">
                            <tr v-for="(item, index) in afterArrivalForecast" :key="index" class="border-b border-slate-800/50 hover:bg-cyan-500/5">
                                <td class="px-2.5 py-2.5 tabular-nums">{{ formatDate(item.arrivalTime) }}</td>
                                <td class="px-2.5 py-2.5 text-center font-bold tabular-nums" :class="getWindSpeedClass(item.weather.windspeed)">
                                    {{ (item.weather.windspeed || 0).toFixed(1) }} m/s
                                </td>
                                <td class="px-2.5 py-2.5 text-center font-bold tabular-nums" :class="getWaveHeightClass(item.weather.waveheight)">
                                    {{ (item.weather.waveheight || 0).toFixed(1) }} m
                                </td>
                                <td class="px-2.5 py-2.5 text-center">
                                    <span class="px-2.5 py-0.5 rounded text-[14px] font-bold" :class="item.risk.level === 'safe' ? 'text-green-400 bg-green-900/30' : 'text-red-400 bg-red-900/30'">
                                        {{ item.risk.level === 'safe' ? '可作业' : '不可作业' }}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { calculateRiskLevel, getRiskClasses, getWindSpeedRiskLevel, getWaveHeightRiskLevel } from '../../utils/weatherriskassessment.js';

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
        
        // 计算当前气象（第一个数据点）
        const currentWeather = computed(() => {
            if (props.weatherData.length === 0) return {};
            return props.weatherData[0].weather || {};
        });
        
        // 计算航程预报（前20天）
        const routeForecast = computed(() => {
            return props.weatherData.slice(0, 20);
        });
        
        // 计算到达后预报（20天后的数据）
        const afterArrivalForecast = computed(() => {
            return props.weatherData.slice(20);
        });
        
        // 计算风险统计
        const riskStats = computed(() => {
            const stats = {
                safe: 0,
                caution: 0,
                warning: 0,
                danger: 0
            };
            
            props.weatherData.forEach(item => {
                if (item.risk && item.risk.level) {
                    if (item.risk.level === 'safe') stats.safe++;
                    else if (item.risk.level === 'caution') stats.caution++;
                    else if (item.risk.level === 'warning') stats.warning++;
                    else if (item.risk.level === 'danger') stats.danger++;
                }
            });
            
            return stats;
        });
        
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
        
        // 格式化日期
        const formatDate = (timestamp) => {
            if (!timestamp) return 'N/A';
            const date = new Date(timestamp);
            return date.toLocaleString('zh-CN', { 
                month: '2-digit', 
                day: '2-digit'
            });
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
            currentWeather,
            routeForecast,
            afterArrivalForecast,
            riskStats,
            handleRowClick,
            formatDistance,
            formatDate,
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
