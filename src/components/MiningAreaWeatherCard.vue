<template>
    <transition name="slide-left">
        <div v-if="show && areaData" 
            class="fixed bottom-8 right-8 w-[36rem] max-h-[70vh] z-40 pointer-events-auto font-['Noto_Sans_SC']">
            <div class="tech-panel-enhanced p-4 relative bg-slate-900/95 border-2 border-cyan-500/50 text-white shadow-[0_0_30px_rgba(6,182,212,0.3)] flex flex-col max-h-[70vh]"
                style="clip-path: polygon(0 0, 100% 0, 100% 95%, 95% 100%, 0 100%);">
                
                <!-- 扫描线 -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
                
                <!-- 角装饰 -->
                <div class="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-500"></div>
                <div class="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-500"></div>
                
                <!-- 标题栏 -->
                <div class="flex items-center justify-between mb-3 pb-2 border-b-2 border-cyan-500/30 flex-shrink-0">
                    <div class="flex items-center gap-2">
                        <div class="w-1.5 h-4 bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></div>
                        <span class="text-base font-bold tracking-wider">矿区气象预报</span>
                    </div>
                    <button @click="close" 
                        class="w-6 h-6 border-2 border-cyan-500/50 flex items-center justify-center rounded-sm hover:bg-cyan-500 hover:text-black transition-all">
                        <span class="text-base font-bold">×</span>
                    </button>
                </div>
                
                <!-- 可滚动内容区域 -->
                <div class="space-y-3 relative overflow-y-auto flex-1 pr-2" style="scrollbar-width: thin; scrollbar-color: #06b6d4 #1e293b;">
                    <!-- 网格背景 -->
                    <div class="absolute inset-0 opacity-5 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
                    
                    <!-- 矿区名称 -->
                    <div class="relative z-10 bg-slate-800/40 p-3 rounded-sm border border-cyan-500/20">
                        <div class="text-white font-bold text-base">{{ areaData.name }}</div>
                        <div class="text-xs text-slate-400 mt-1">
                            {{ areaData.contractor }} · {{ areaData.mineral }}
                        </div>
                    </div>
                    
                    <!-- 当前气象 -->
                    <div class="relative z-10">
                        <div class="text-sm font-bold text-cyan-400 mb-2 flex items-center gap-2">
                            <div class="w-1 h-3 bg-cyan-400"></div>
                            当前气象
                        </div>
                        <div class="grid grid-cols-3 gap-2 text-sm">
                            <div class="bg-slate-800/40 p-2 rounded-sm border border-cyan-500/10 text-center">
                                <div class="text-slate-400 text-xs">风速</div>
                                <div 
                                    class="font-bold font-['Rajdhani'] text-base mt-1"
                                    :class="getRiskColor(areaData.current.windSpeed, 12)"
                                >
                                    {{ areaData.current.windSpeed.toFixed(1) }}
                                </div>
                                <div class="text-xs text-slate-500">m/s</div>
                            </div>
                            <div class="bg-slate-800/40 p-2 rounded-sm border border-cyan-500/10 text-center">
                                <div class="text-slate-400 text-xs">浪高</div>
                                <div 
                                    class="font-bold font-['Rajdhani'] text-base mt-1"
                                    :class="getRiskColor(areaData.current.waveHeight, 3)"
                                >
                                    {{ areaData.current.waveHeight.toFixed(1) }}
                                </div>
                                <div class="text-xs text-slate-500">m</div>
                            </div>
                            <div class="bg-slate-800/40 p-2 rounded-sm border border-cyan-500/10 text-center">
                                <div class="text-slate-400 text-xs">温度</div>
                                <div class="font-bold font-['Rajdhani'] text-base mt-1 text-cyan-400">
                                    {{ areaData.current.temperature }}
                                </div>
                                <div class="text-xs text-slate-500">°C</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 航程预报（20天） -->
                    <div v-if="areaData.voyageForecast" class="relative z-10">
                        <div class="text-sm font-bold text-yellow-400 mb-2 flex items-center gap-2">
                            <div class="w-1 h-3 bg-yellow-400"></div>
                            航程预报（20天）
                        </div>
                        <div class="bg-slate-800/40 rounded-sm border border-yellow-500/20 overflow-hidden">
                            <div class="max-h-48 overflow-y-auto" style="scrollbar-width: thin; scrollbar-color: #eab308 #1e293b;">
                                <table class="w-full text-xs">
                                    <thead class="bg-slate-900/60 sticky top-0">
                                        <tr class="border-b border-yellow-500/20">
                                            <th class="px-2 py-1.5 text-left text-yellow-400">日期</th>
                                            <th class="px-2 py-1.5 text-center text-yellow-400">风速</th>
                                            <th class="px-2 py-1.5 text-center text-yellow-400">浪高</th>
                                            <th class="px-2 py-1.5 text-center text-yellow-400">状态</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(day, index) in areaData.voyageForecast" :key="index"
                                            class="border-b border-slate-700/30 hover:bg-slate-700/20"
                                            :class="getRowRiskClass(day.risk)">
                                            <td class="px-2 py-1.5 text-slate-300">{{ day.date }}</td>
                                            <td class="px-2 py-1.5 text-center font-['Rajdhani'] font-bold"
                                                :class="getRiskColor(day.windSpeed, 12)">
                                                {{ day.windSpeed.toFixed(1) }} m/s
                                            </td>
                                            <td class="px-2 py-1.5 text-center font-['Rajdhani'] font-bold"
                                                :class="getRiskColor(day.waveHeight, 3)">
                                                {{ day.waveHeight.toFixed(1) }} m
                                            </td>
                                            <td class="px-2 py-1.5 text-center">
                                                <span class="px-1.5 py-0.5 rounded text-xs font-bold"
                                                    :class="getRiskBadgeClass(day.risk)">
                                                    {{ getRiskLabel(day.risk) }}
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <!-- 航程统计 -->
                        <div class="grid grid-cols-2 gap-2 mt-2 text-xs">
                            <div class="bg-red-900/20 border border-red-500/30 p-2 rounded-sm">
                                <div class="text-red-400">高风险天数</div>
                                <div class="font-bold text-white mt-0.5 font-['Rajdhani']">{{ areaData.voyageStats.highRiskDays }} 天</div>
                            </div>
                            <div class="bg-green-900/20 border border-green-500/30 p-2 rounded-sm">
                                <div class="text-green-400">适航天数</div>
                                <div class="font-bold text-white mt-0.5 font-['Rajdhani']">{{ areaData.voyageStats.safeDays }} 天</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 到达后预报（7天） -->
                    <div v-if="areaData.arrivalForecast" class="relative z-10">
                        <div class="text-sm font-bold text-green-400 mb-2 flex items-center gap-2">
                            <div class="w-1 h-3 bg-green-400"></div>
                            到达后预报（7天）
                        </div>
                        <div class="bg-slate-800/40 rounded-sm border border-green-500/20 overflow-hidden">
                            <table class="w-full text-xs">
                                <thead class="bg-slate-900/60">
                                    <tr class="border-b border-green-500/20">
                                        <th class="px-2 py-1.5 text-left text-green-400">日期</th>
                                        <th class="px-2 py-1.5 text-center text-green-400">风速</th>
                                        <th class="px-2 py-1.5 text-center text-green-400">浪高</th>
                                        <th class="px-2 py-1.5 text-center text-green-400">作业</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(day, index) in areaData.arrivalForecast" :key="index"
                                        class="border-b border-slate-700/30 hover:bg-slate-700/20"
                                        :class="getRowRiskClass(day.risk)">
                                        <td class="px-2 py-1.5 text-slate-300">{{ day.date }}</td>
                                        <td class="px-2 py-1.5 text-center font-['Rajdhani'] font-bold"
                                            :class="getRiskColor(day.windSpeed, 12)">
                                            {{ day.windSpeed.toFixed(1) }} m/s
                                        </td>
                                        <td class="px-2 py-1.5 text-center font-['Rajdhani'] font-bold"
                                            :class="getRiskColor(day.waveHeight, 3)">
                                            {{ day.waveHeight.toFixed(1) }} m
                                        </td>
                                        <td class="px-2 py-1.5 text-center">
                                            <span class="px-1.5 py-0.5 rounded text-xs font-bold"
                                                :class="day.workable ? 'bg-green-900/50 text-green-400 border border-green-500/50' : 'bg-red-900/50 text-red-400 border border-red-500/50'">
                                                {{ day.workable ? '可作业' : '不可作业' }}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <!-- 作业统计 -->
                        <div class="bg-cyan-900/20 border border-cyan-500/30 p-2 rounded-sm mt-2 text-xs">
                            <div class="flex justify-between items-center">
                                <span class="text-cyan-400">可作业天数</span>
                                <span class="font-bold text-white font-['Rajdhani']">{{ areaData.arrivalStats.workableDays }} / 7 天</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const show = ref(false);
const areaData = ref(null);

// 显示矿区气象信息
const showWeather = (data) => {
    console.log('📊 [MiningAreaWeatherCard] showWeather 被调用:', data);
    areaData.value = data;
    show.value = true;
};

// 关闭
const close = () => {
    show.value = false;
    setTimeout(() => {
        areaData.value = null;
    }, 300);
};

// 获取风险颜色类
const getRiskColor = (value, threshold) => {
    if (value > threshold * 1.25) return 'text-red-400';
    if (value > threshold) return 'text-orange-400';
    if (value > threshold * 0.7) return 'text-yellow-400';
    return 'text-cyan-400';
};

// 获取风险标签
const getRiskLabel = (risk) => {
    const labels = {
        safe: '安全',
        caution: '注意',
        warning: '警告',
        danger: '危险'
    };
    return labels[risk] || '未知';
};

// 获取风险徽章样式
const getRiskBadgeClass = (risk) => {
    const classes = {
        safe: 'bg-green-900/50 text-green-400 border border-green-500/50',
        caution: 'bg-yellow-900/50 text-yellow-400 border border-yellow-500/50',
        warning: 'bg-orange-900/50 text-orange-400 border border-orange-500/50',
        danger: 'bg-red-900/50 text-red-400 border border-red-500/50 animate-pulse'
    };
    return classes[risk] || 'bg-slate-700 text-slate-400';
};

// 获取表格行风险样式
const getRowRiskClass = (risk) => {
    if (risk === 'danger') return 'bg-red-900/10';
    if (risk === 'warning') return 'bg-orange-900/10';
    return '';
};

// 监听全局事件
const handleShowWeatherCard = (event) => {
    console.log('📡 [MiningAreaWeatherCard] 收到事件:', event.detail);
    showWeather(event.detail);
};

onMounted(() => {
    console.log('✅ [MiningAreaWeatherCard] 组件已挂载，开始监听事件');
    window.addEventListener('showMiningWeatherCard', handleShowWeatherCard);
});

onUnmounted(() => {
    console.log('🔴 [MiningAreaWeatherCard] 组件卸载，移除事件监听');
    window.removeEventListener('showMiningWeatherCard', handleShowWeatherCard);
});

// 暴露方法给父组件（保留，以防需要）
defineExpose({
    showWeather,
    close
});
</script>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active {
    transition: all 0.3s ease;
}

.slide-left-enter-from {
    opacity: 0;
    transform: translateX(100%);
}

.slide-left-leave-to {
    opacity: 0;
    transform: translateX(50%);
}

/* 自定义滚动条样式 */
::-webkit-scrollbar {
    width: 6px;
}

::-webkit-scrollbar-track {
    background: #1e293b;
    border-radius: 3px;
}

::-webkit-scrollbar-thumb {
    background: #06b6d4;
    border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
    background: #22d3ee;
}
</style>
