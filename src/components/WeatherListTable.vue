<template>
    <!-- 位置调整：右下角，与船舶列表类似的布局 - 添加 pointer-events-auto 使其可点击 -->
    <div class="absolute bottom-2 left-[31rem] right-8 h-[25rem] z-30 animate-slideUp flex flex-col pointer-events-auto">
        <!-- Top Decor -->
        <div class="h-3 w-full bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent pointer-events-none"></div>
        
        <div class="flex-1 bg-slate-950/95 backdrop-blur-lg border-t-2 border-cyan-500/30 flex flex-col relative overflow-hidden pointer-events-auto">
            <!-- Header -->
            <div class="h-14 flex items-center justify-between px-8 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-900/30 to-transparent">
                <div class="flex items-center gap-4">
                    <div class="w-1.5 h-6 bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>
                    <h3 class="text-2xl font-bold text-cyan-50 tracking-wider font-['Noto_Sans_SC']">🌦️ 航线气象数据</h3>
                    <span class="text-sm text-cyan-500/60 font-['Orbitron'] mt-1 ml-3 tracking-widest">{{ filteredData.length }} / {{ weatherData.length }} 个采样点</span>
                </div>
                <!-- Tools -->
                <div class="flex gap-6 text-cyan-400 text-base font-bold items-center">
                    <!-- 刷新倒计时 -->
                    <div class="flex items-center gap-2 text-xs">
                        <svg class="w-4 h-4 animate-spin" v-if="refreshCountdown <= 10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span class="font-['Rajdhani'] font-bold">{{ formatCountdown(refreshCountdown) }}</span>
                    </div>
                    <button @click="handleManualRefresh" class="hover:text-white hover:underline decoration-2 underline-offset-4">
                        🔄 刷新数据
                    </button>
                    <button @click="$emit('clear')" class="hover:text-white hover:underline decoration-2 underline-offset-4">
                        清空列表
                    </button>
                </div>
            </div>

            <!-- 筛选器 -->
            <div class="px-8 py-3 bg-slate-900/50 border-b border-cyan-500/20 space-y-3">
            <!-- 风险等级筛选 -->
            <div class="flex items-center gap-2">
                <span class="text-sm text-cyan-400 font-bold w-20">风险等级:</span>
                <div class="flex gap-2 flex-1">
                    <button v-for="level in riskLevels" 
                            :key="level.value"
                            @click="toggleRiskFilter(level.value)"
                            :class="[
                                'px-3 py-1 rounded-sm text-xs font-bold transition-all border',
                                selectedRiskLevels.includes(level.value)
                                    ? 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                                    : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700/50'
                            ]">
                        {{ level.emoji }} {{ level.label }}
                    </button>
                    <button v-if="selectedRiskLevels.length > 0"
                            @click="clearRiskFilter"
                            class="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-sm transition-all">
                        清除
                    </button>
                </div>
            </div>
            
            <!-- 风速/浪高筛选 -->
            <div class="flex items-center gap-2">
                <span class="text-sm text-cyan-400 font-bold w-20">数据范围:</span>
                <div class="flex gap-2 flex-1">
                    <select v-model="selectedWindSpeed" 
                            @change="applyFilters"
                            class="flex-1 px-3 py-1 bg-slate-800/50 border border-slate-700 text-white text-xs rounded-sm focus:outline-none focus:border-cyan-500 transition-colors font-['Rajdhani']">
                        <option value="">风速：全部</option>
                        <option value="0,5">0-5 m/s (微风)</option>
                        <option value="5,10">5-10 m/s (和风)</option>
                        <option value="10,15">10-15 m/s (强风)</option>
                        <option value="15,999">15+ m/s (大风)</option>
                    </select>
                    
                    <select v-model="selectedWaveHeight"
                            @change="applyFilters"
                            class="flex-1 px-3 py-1 bg-slate-800/50 border border-slate-700 text-white text-xs rounded-sm focus:outline-none focus:border-cyan-500 transition-colors font-['Rajdhani']">
                        <option value="">浪高：全部</option>
                        <option value="0,1">0-1 m (平静)</option>
                        <option value="1,2.5">1-2.5 m (中浪)</option>
                        <option value="2.5,4">2.5-4 m (大浪)</option>
                        <option value="4,999">4+ m (巨浪)</option>
                    </select>
                </div>
            </div>
        </div>
        
            <!-- Table -->
            <div class="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar px-4 py-2 min-h-0">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-cyan-900/20 text-cyan-200 text-sm sticky top-0 backdrop-blur-md z-10">
                        <tr>
                            <th v-for="h in ['序号', '风险', '风速(m/s)', '风向(°)', '浪高(m)', '涌浪(m)', '能见度(km)', '气温(°C)', '数据时间']" :key="h" 
                                class="px-3 py-2 font-bold tracking-wider border-b-2 border-cyan-500/30 whitespace-nowrap"
                            >
                                {{ h }}
                            </th>
                        </tr>
                    </thead>
                    <tbody class="text-slate-300 text-sm font-['Rajdhani']">
                        <tr v-if="filteredData.length === 0">
                            <td colspan="9" class="px-3 py-6 text-center text-slate-500">
                                <div class="text-4xl mb-2">🔍</div>
                                <div>没有符合筛选条件的数据</div>
                            </td>
                        </tr>
                        <tr v-for="(item, index) in filteredData" :key="index" 
                            class="border-b border-slate-800 hover:bg-cyan-500/10 transition-colors group cursor-pointer"
                            @click="handleRowClick(item, index)"
                            :class="selectedRow === index ? 'bg-cyan-500/20 border-cyan-500/50' : ''"
                        >
                            <td class="px-3 py-2 text-cyan-500 font-bold">{{ index + 1 }}</td>
                            <td class="px-3 py-2 text-center text-lg">{{ item.risk.emoji }}</td>
                            <td class="px-3 py-2 text-right text-white font-bold">{{ (item.weather.windspeed || 0).toFixed(1) }}</td>
                            <td class="px-3 py-2 text-right">{{ item.weather.winddir || 'N/A' }}</td>
                            <td class="px-3 py-2 text-right text-white font-bold">{{ (item.weather.waveheight || 0).toFixed(1) }}</td>
                            <td class="px-3 py-2 text-right">{{ (item.weather.swellheight || 0).toFixed(1) }}</td>
                            <td class="px-3 py-2 text-right">{{ (item.weather.visibility || 0).toFixed(1) }}</td>
                            <td class="px-3 py-2 text-right">{{ (item.weather.temperature || 0).toFixed(1) }}</td>
                            <td class="px-3 py-2 opacity-80 text-xs">{{ formatTime(item.weather.timestamp) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

export default {
    props: {
        weatherData: {
            type: Array,
            default: () => []
        }
    },
    emits: ['clear', 'filter', 'rowClick', 'refresh'],
    setup(props, { emit }) {
        // 筛选状态
        const selectedRiskLevels = ref([]);
        const selectedWindSpeed = ref('');
        const selectedWaveHeight = ref('');
        const selectedRow = ref(null);
        
        // 刷新倒计时（5分钟 = 300秒）
        const refreshCountdown = ref(300);
        let refreshTimer = null;
        
        // 风险等级定义
        const riskLevels = [
            { value: 'safe', label: '安全', emoji: '🟢' },
            { value: 'caution', label: '注意', emoji: '🟡' },
            { value: 'warning', label: '警告', emoji: '🟠' },
            { value: 'danger', label: '危险', emoji: '🔴' }
        ];
        
        // 切换风险等级筛选
        const toggleRiskFilter = (level) => {
            const index = selectedRiskLevels.value.indexOf(level);
            if (index > -1) {
                selectedRiskLevels.value.splice(index, 1);
            } else {
                selectedRiskLevels.value.push(level);
            }
            applyFilters();
        };
        
        // 清除风险筛选
        const clearRiskFilter = () => {
            selectedRiskLevels.value = [];
            applyFilters();
        };
        
        // 计算过滤后的数据
        const filteredData = computed(() => {
            let data = props.weatherData;
            
            // 风险等级筛选
            if (selectedRiskLevels.value.length > 0) {
                data = data.filter(item => selectedRiskLevels.value.includes(item.risk.level));
            }
            
            // 风速筛选
            if (selectedWindSpeed.value) {
                const [min, max] = selectedWindSpeed.value.split(',').map(Number);
                data = data.filter(item => {
                    const windSpeed = item.weather.windspeed || 0;
                    return windSpeed >= min && windSpeed < max;
                });
            }
            
            // 浪高筛选
            if (selectedWaveHeight.value) {
                const [min, max] = selectedWaveHeight.value.split(',').map(Number);
                data = data.filter(item => {
                    const waveHeight = item.weather.waveheight || 0;
                    return waveHeight >= min && waveHeight < max;
                });
            }
            
            return data;
        });
        
        // 应用筛选
        const applyFilters = () => {
            const filters = {
                riskLevels: selectedRiskLevels.value,
                windSpeed: selectedWindSpeed.value ? selectedWindSpeed.value.split(',').map(Number) : null,
                waveHeight: selectedWaveHeight.value ? selectedWaveHeight.value.split(',').map(Number) : null
            };
            emit('filter', filters);
        };
        
        // 处理行点击
        const handleRowClick = (item, index) => {
            selectedRow.value = index;
            emit('rowClick', item, index);
        };
        
        // 格式化时间
        const formatTime = (timestamp) => {
            if (!timestamp) return 'N/A';
            const date = new Date(timestamp);
            return date.toLocaleString('zh-CN', { 
                month: '2-digit', 
                day: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit'
            });
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
        watch(() => props.weatherData, () => {
            refreshCountdown.value = 300;
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
            selectedRiskLevels,
            selectedWindSpeed,
            selectedWaveHeight,
            selectedRow,
            refreshCountdown,
            riskLevels,
            filteredData,
            toggleRiskFilter,
            clearRiskFilter,
            applyFilters,
            handleRowClick,
            formatTime,
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
