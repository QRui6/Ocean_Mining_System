<template>
    <!-- 作业中图标 - 显示在船的头顶 -->
    <transition name="fade">
        <div v-if="show && displayMode === 'working'" 
            class="fixed top-[35%] left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div class="bg-gradient-to-r from-cyan-600/90 to-blue-600/90 backdrop-blur-lg px-6 py-3 rounded-full shadow-[0_0_30px_rgba(6,182,212,0.6)] border-2 border-cyan-400/50 flex items-center gap-3 animate-pulse">
                <!-- 旋转的齿轮图标 -->
                <div class="relative w-8 h-8">
                    <svg class="w-8 h-8 text-yellow-400 animate-spin-slow" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center">
                        <div class="w-2 h-2 bg-white rounded-full animate-ping"></div>
                    </div>
                </div>
                <div class="text-white font-bold text-lg tracking-wide">
                    作业中
                </div>
                <!-- 动态点 -->
                <div class="flex gap-1">
                    <div class="w-2 h-2 bg-white rounded-full animate-bounce" style="animation-delay: 0s"></div>
                    <div class="w-2 h-2 bg-white rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                    <div class="w-2 h-2 bg-white rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
                </div>
            </div>
        </div>
    </transition>

    <transition name="slide-up">
        <div v-if="show && areaData" 
            class="fixed bottom-2 left-[520px] right-8 z-40 pointer-events-auto font-['Noto_Sans_SC']">
            
            <!-- 使用单一transition包裹，根据mode切换整个面板 -->
            <transition name="panel-slide" mode="out-in">
                <!-- 航线航程气象预报卡片 - 航行模式 -->
                <div v-if="displayMode === 'voyage'" 
                    key="voyage-panel"
                    class="flex gap-3 w-[1200px] h-[300px]">
                    
                    <!-- 左侧：航线航程表格 -->
                    <div class="w-[800px] bg-slate-950/95 backdrop-blur-lg border-t-2 border-yellow-500/30 rounded-lg overflow-hidden flex flex-col">
                        <div class="h-8 flex items-center justify-between px-3 border-b border-yellow-500/20 bg-gradient-to-r from-yellow-900/30 to-transparent flex-shrink-0">
                            <div class="flex items-center gap-2">
                                <div class="w-1 h-3 bg-yellow-400 shadow-[0_0_8px_#facc15]"></div>
                                <h3 class="text-sm font-bold text-cyan-50">航线航程气象预报 (20天)</h3>
                            </div>
                            <div class="flex gap-3 text-xs">
                                <span class="text-red-400">高风险: {{ areaData.voyageStats.highRiskDays }}天</span>
                                <span class="text-green-400">适航: {{ areaData.voyageStats.safeDays }}天</span>
                            </div>
                        </div>
                        <div class="flex-1 overflow-y-auto custom-scrollbar p-3" ref="tableScrollRef">
                            <table class="w-full text-xs">
                                <thead class="text-yellow-400 sticky top-0 bg-slate-950/95">
                                    <tr class="border-b border-yellow-500/20">
                                        <th class="px-2 py-1 text-left">日期</th>
                                        <th class="px-2 py-1 text-left">航段</th>
                                        <th class="px-2 py-1 text-center">风速</th>
                                        <th class="px-2 py-1 text-center">浪高</th>
                                        <th class="px-2 py-1 text-center">洋流</th>
                                        <th class="px-2 py-1 text-center">状态</th>
                                    </tr>
                                </thead>
                                <tbody class="text-slate-300">
                                    <tr v-for="(day, index) in areaData.voyageForecast" :key="index"
                                        class="border-b border-slate-800/50 hover:bg-yellow-500/5 transition-colors"
                                        :class="[
                                            getRowRiskClass(day.risk),
                                            index === currentDayIndex ? 'bg-yellow-500/20 ring-2 ring-yellow-400/50' : ''
                                        ]">
                                        <td class="px-2 py-1 whitespace-nowrap">{{ day.date }}</td>
                                        <td class="px-2 py-1 text-slate-400 text-xs">{{ getSegmentName(index) }}</td>
                                        <td class="px-2 py-1 text-center font-bold font-['Rajdhani']" :class="getRiskColor(day.windSpeed, 12)">
                                            {{ day.windSpeed.toFixed(1) }} m/s
                                        </td>
                                        <td class="px-2 py-1 text-center font-bold font-['Rajdhani']" :class="getRiskColor(day.waveHeight, 3)">
                                            {{ day.waveHeight.toFixed(1) }} m
                                        </td>
                                        <td class="px-2 py-1 text-center font-bold font-['Rajdhani'] text-purple-400">
                                            {{ getCurrentSpeed(day.currentSpeed, day.windSpeed) }} m/s
                                        </td>
                                        <td class="px-2 py-1 text-center">
                                            <span class="px-2 py-0.5 rounded text-xs font-bold" :class="getRiskBadgeClass(day.risk)">
                                                {{ getRiskLabel(day.risk) }}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <!-- 右侧：矿区实时气象数据简报 -->
                    <div class="flex-1 bg-slate-950/95 backdrop-blur-lg border-t-2 border-cyan-500/30 rounded-lg overflow-hidden flex flex-col">
                        <div class="h-8 flex items-center justify-between px-3 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-900/30 to-transparent flex-shrink-0">
                            <div class="flex items-center gap-2">
                                <div class="w-1 h-3 bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></div>
                                <h3 class="text-sm font-bold text-cyan-50">目标矿区气象简报</h3>
                            </div>
                        </div>
                        <div class="flex-1 p-3 space-y-3">
                            <!-- 矿区信息和预计到达时间 -->
                            <div class="bg-slate-800/40 p-3 rounded border border-cyan-500/20">
                                <div class="text-white font-bold text-base mb-1">{{ areaData.name }}</div>
                                <div class="text-xs text-slate-400 mb-2">{{ areaData.contractor }}</div>
                                <div class="flex items-center gap-2 pt-2 border-t border-slate-700/50">
                                    <div class="text-xs text-yellow-400">预计到达时间:</div>
                                    <div class="text-sm font-bold text-white font-['Rajdhani']">{{ getEstimatedArrivalTime() }}</div>
                                </div>
                            </div>
                            
                            <!-- 实时气象预报 -->
                            <div class="bg-slate-800/40 p-3 rounded border border-green-500/20">
                                <div class="text-xs text-green-400 mb-2">矿区实时气象</div>
                                <div class="grid grid-cols-3 gap-2">
                                    <div class="text-center">
                                        <div class="text-xs text-slate-400">风速</div>
                                        <div class="text-lg font-bold font-['Rajdhani']" :class="getRiskColor(areaData.current.windSpeed, 12)">
                                            {{ areaData.current.windSpeed.toFixed(1) }}
                                        </div>
                                        <div class="text-xs text-slate-400">m/s</div>
                                    </div>
                                    <div class="text-center">
                                        <div class="text-xs text-slate-400">浪高</div>
                                        <div class="text-lg font-bold font-['Rajdhani']" :class="getRiskColor(areaData.current.waveHeight, 3)">
                                            {{ areaData.current.waveHeight.toFixed(1) }}
                                        </div>
                                        <div class="text-xs text-slate-400">m</div>
                                    </div>
                                    <div class="text-center">
                                        <div class="text-xs text-slate-400">洋流</div>
                                        <div class="text-lg font-bold font-['Rajdhani'] text-purple-400">
                                            {{ getCurrentSpeed(areaData.current.currentSpeed, areaData.current.windSpeed) }}
                                        </div>
                                        <div class="text-xs text-slate-400">m/s</div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 作业建议 -->
                            <div class="bg-slate-800/40 p-3 rounded border" :class="(areaData.current.windSpeed < 12 && areaData.current.waveHeight < 3) ? 'border-green-500/20' : 'border-red-500/20'">
                                <div class="text-xs mb-1" :class="(areaData.current.windSpeed < 12 && areaData.current.waveHeight < 3) ? 'text-green-400' : 'text-red-400'">作业建议</div>
                                <div class="text-sm font-bold" :class="(areaData.current.windSpeed < 12 && areaData.current.waveHeight < 3) ? 'text-green-400' : 'text-red-400'">
                                    {{ (areaData.current.windSpeed < 12 && areaData.current.waveHeight < 3) ? '✓ 适宜作业' : '✗ 不适宜作业' }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 矿区气象预报卡片 - 作业模式 -->
                <div v-else-if="displayMode === 'working'" 
                    key="working-panel"
                    class="flex-shrink-0 w-[1200px] h-[300px] bg-slate-950/95 backdrop-blur-lg border-t-2 border-cyan-500/30 rounded-lg overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.3)] flex flex-col">
                    <div class="h-8 flex items-center justify-between px-3 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-900/30 to-transparent flex-shrink-0">
                        <div class="flex items-center gap-2">
                            <div class="w-1 h-3 bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></div>
                            <h3 class="text-sm font-bold text-cyan-50">矿区气象预报</h3>
                        </div>
                        <button @click="close" 
                            class="w-5 h-5 border border-cyan-500/50 flex items-center justify-center rounded-sm hover:bg-cyan-500 hover:text-black transition-all text-xs">
                            ×
                        </button>
                    </div>
                    <div class="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                        <!-- 矿区信息和当前气象 -->
                        <div class="grid grid-cols-2 gap-3">
                            <!-- 矿区信息 -->
                            <div class="bg-slate-800/40 p-3 rounded border border-cyan-500/20">
                                <div class="text-white font-bold text-base mb-2">{{ areaData.name }}</div>
                                <div class="text-xs text-slate-400">{{ areaData.contractor }} · {{ areaData.mineral }}</div>
                            </div>
                            <!-- 当前气象数据 -->
                            <div class="grid grid-cols-4 gap-2">
                                <div class="text-center bg-slate-800/30 p-2 rounded">
                                    <div class="text-xs text-cyan-400">风速</div>
                                    <div class="text-lg font-bold font-['Rajdhani']" :class="getRiskColor(currentDayWeather.windSpeed, 12)">
                                        {{ currentDayWeather.windSpeed.toFixed(1) }}
                                    </div>
                                    <div class="text-xs text-slate-400">m/s</div>
                                </div>
                                <div class="text-center bg-slate-800/30 p-2 rounded">
                                    <div class="text-xs text-cyan-400">浪高</div>
                                    <div class="text-lg font-bold font-['Rajdhani']" :class="getRiskColor(currentDayWeather.waveHeight, 3)">
                                        {{ currentDayWeather.waveHeight.toFixed(1) }}
                                    </div>
                                    <div class="text-xs text-slate-400">m</div>
                                </div>
                                <div class="text-center bg-slate-800/30 p-2 rounded">
                                    <div class="text-xs text-cyan-400">洋流</div>
                                    <div class="text-lg font-bold font-['Rajdhani'] text-purple-400">
                                        {{ getCurrentSpeed(currentDayWeather.currentSpeed, currentDayWeather.windSpeed) }}
                                    </div>
                                    <div class="text-xs text-slate-400">m/s</div>
                                </div>
                                <div class="text-center bg-slate-800/30 p-2 rounded">
                                    <div class="text-xs text-cyan-400">温度</div>
                                    <div class="text-lg font-bold font-['Rajdhani'] text-cyan-400">
                                        {{ currentDayWeather.temperature }}
                                    </div>
                                    <div class="text-xs text-slate-400">°C</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 到达后预报 -->
                        <div v-if="areaData.arrivalForecast">
                            <div class="flex items-center justify-between mb-1">
                                <div class="text-xs font-bold text-green-400 flex items-center gap-1">
                                    <div class="w-1 h-2 bg-green-400"></div>
                                    到达后预报 (7天)
                                </div>
                                <div class="text-xs text-green-400">
                                    可作业: {{ areaData.arrivalStats.workableDays }}/7天
                                </div>
                            </div>
                            <div class="bg-slate-800/40 rounded border border-green-500/20 overflow-hidden h-[140px] relative">
                                <div class="absolute top-0 left-0 right-0 bottom-0 overflow-y-auto custom-scrollbar" ref="workingTableScrollRef">
                                    <table class="w-full text-xs table-fixed">
                                        <thead class="text-green-400 sticky top-0 bg-slate-950/95">
                                            <tr class="border-b border-green-500/20">
                                                <th class="px-3 py-2 text-left w-[15%]">日期</th>
                                                <th class="px-3 py-2 text-center w-[20%]">风速</th>
                                                <th class="px-3 py-2 text-center w-[20%]">浪高</th>
                                                <th class="px-3 py-2 text-center w-[20%]">洋流</th>
                                                <th class="px-3 py-2 text-center w-[25%]">作业</th>
                                            </tr>
                                        </thead>
                                        <tbody class="text-slate-300">
                                            <tr v-for="(day, index) in displayedForecast" :key="index"
                                                class="border-b border-slate-800/50 hover:bg-green-500/5 transition-colors"
                                                :class="[
                                                    getRowRiskClass(day.risk),
                                                    index === 0 ? 'bg-green-500/20 ring-2 ring-green-400/50' : ''
                                                ]">
                                                <td class="px-3 py-1">{{ day.date }}</td>
                                                <td class="px-3 py-1 text-center font-bold font-['Rajdhani']" :class="getRiskColor(day.windSpeed, 12)">
                                                    {{ day.windSpeed.toFixed(1) }} m/s
                                                </td>
                                                <td class="px-3 py-1 text-center font-bold font-['Rajdhani']" :class="getRiskColor(day.waveHeight, 3)">
                                                    {{ day.waveHeight.toFixed(1) }} m
                                                </td>
                                                <td class="px-3 py-1 text-center font-bold font-['Rajdhani'] text-purple-400">
                                                    {{ getCurrentSpeed(day.currentSpeed, day.windSpeed) }} m/s
                                                </td>
                                                <td class="px-3 py-1 text-center">
                                                    <span class="px-2 py-0.5 rounded text-xs font-bold"
                                                        :class="day.workable ? 'bg-green-900/50 text-green-400 border border-green-500/50' : 'bg-red-900/50 text-red-400 border border-red-500/50'">
                                                        {{ day.workable ? '可作业' : '不可作业' }}
                                                    </span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </transition>
        </div>
    </transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const show = ref(false);
const areaData = ref(null);
const displayMode = ref('voyage'); // 'voyage' = 航行中, 'working' = 作业中
const currentDayIndex = ref(0); // 当前航行到第几天
const currentWorkingDay = ref(0); // 当前作业到第几天（从0开始，表示已经作业了多少天）
const tableScrollRef = ref(null); // 航行表格滚动容器的引用
const workingTableScrollRef = ref(null); // 作业表格滚动容器的引用
let workingProgressTimer = null; // 作业进度自动更新定时器
let realTimeWeatherTimer = null; // 实时气象数据更新定时器

// 计算当前显示的7天预报数据（滑动窗口）
const displayedForecast = computed(() => {
    if (!areaData.value || !areaData.value.arrivalForecast) return [];
    
    const allData = areaData.value.arrivalForecast;
    const startIndex = currentWorkingDay.value;
    
    // 从当前天开始，取7天的数据
    // 如果数据不足7天，就显示剩余的所有数据
    return allData.slice(startIndex, startIndex + 7);
});

// 计算当前作业天的气象数据（用于顶部显示）
const currentDayWeather = computed(() => {
    if (!areaData.value || !areaData.value.arrivalForecast) {
        return areaData.value?.current || {};
    }
    
    // 获取当前作业天的数据
    const currentDay = areaData.value.arrivalForecast[currentWorkingDay.value];
    if (currentDay) {
        return {
            windSpeed: currentDay.windSpeed,
            waveHeight: currentDay.waveHeight,
            currentSpeed: currentDay.currentSpeed,
            temperature: areaData.value.current?.temperature || 26 // 温度保持不变或使用默认值
        };
    }
    
    return areaData.value.current || {};
});

// 显示矿区气象信息
const showWeather = (data, mode = 'voyage') => {
    console.log('📊 [MiningAreaWeatherCard] showWeather 被调用:', data, 'mode:', mode);
    areaData.value = data;
    displayMode.value = mode;
    show.value = true;
    
    // 启动实时气象数据更新
    startRealTimeWeatherUpdate();
    
    // 如果是作业模式，启动自动滚动
    if (mode === 'working') {
        startWorkingProgressTimer();
    } else {
        stopWorkingProgressTimer();
    }
};

// 切换显示模式
const switchMode = (mode) => {
    console.log('🔄 [MiningAreaWeatherCard] 切换模式:', mode);
    displayMode.value = mode;
    
    // 根据模式启动或停止自动滚动
    if (mode === 'working') {
        currentWorkingDay.value = 0; // 重置作业进度
        startWorkingProgressTimer();
    } else {
        stopWorkingProgressTimer();
    }
};

// 更新当前航行进度（从外部调用）
const updateProgress = (dayIndex) => {
    currentDayIndex.value = dayIndex;
    scrollToCurrentDay();
};

// 更新当前作业进度（从外部调用）
const updateWorkingProgress = (dayIndex) => {
    currentWorkingDay.value = dayIndex;
    scrollToCurrentWorkingDay();
};

// 滚动到当前天数（航行表格）
const scrollToCurrentDay = () => {
    if (!tableScrollRef.value) return;
    
    // 每行高度约为 28px（根据实际调整）
    const rowHeight = 28;
    // 额外偏移，让当前行显示在可见区域中间偏上的位置
    const offset = 60;
    
    // 计算滚动位置：当前行位置 - 偏移量
    const scrollPosition = Math.max(0, (currentDayIndex.value * rowHeight) - offset);
    
    // 平滑滚动到当前位置
    tableScrollRef.value.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
    });
};

// 滚动到当前作业天数（作业表格）
// 注意：现在使用滑动窗口显示，始终高亮第一行，所以不需要滚动
// 但保留这个方法以防需要
const scrollToCurrentWorkingDay = () => {
    // 使用滑动窗口后，当前天始终在第一行，不需要滚动
    // 如果需要滚动到顶部，可以执行：
    if (workingTableScrollRef.value) {
        workingTableScrollRef.value.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
};

// 关闭
const close = () => {
    show.value = false;
    stopWorkingProgressTimer(); // 停止定时器
    stopRealTimeWeatherUpdate(); // 停止实时气象更新
    setTimeout(() => {
        areaData.value = null;
    }, 300);
};

// 启动实时气象数据更新
const startRealTimeWeatherUpdate = () => {
    // 先清除已有的定时器
    stopRealTimeWeatherUpdate();
    
    console.log('🌤️ 启动实时气象数据更新');
    
    // 每5秒更新一次实时气象数据
    realTimeWeatherTimer = setInterval(() => {
        if (!areaData.value || !areaData.value.current) return;
        
        // 生成新的实时气象数据（小幅波动）
        const current = areaData.value.current;
        
        // 风速：在当前值基础上 ±1 m/s 波动
        let newWindSpeed = current.windSpeed + (Math.random() - 0.5) * 2;
        newWindSpeed = Math.max(3, Math.min(18, newWindSpeed)); // 限制在 3-18 范围
        newWindSpeed = Math.round(newWindSpeed * 10) / 10;
        
        // 浪高：在当前值基础上 ±0.3 m 波动
        let newWaveHeight = current.waveHeight + (Math.random() - 0.5) * 0.6;
        newWaveHeight = Math.max(0.5, Math.min(5, newWaveHeight)); // 限制在 0.5-5 范围
        newWaveHeight = Math.round(newWaveHeight * 10) / 10;
        
        // 洋流：根据风速计算
        let newCurrentSpeed = newWindSpeed * (0.01 + Math.random() * 0.02);
        newCurrentSpeed = Math.round(newCurrentSpeed * 10) / 10;
        
        // 更新数据
        areaData.value.current.windSpeed = newWindSpeed;
        areaData.value.current.waveHeight = newWaveHeight;
        areaData.value.current.currentSpeed = newCurrentSpeed;
        
        console.log('🌤️ 实时气象数据已更新:', {
            windSpeed: newWindSpeed,
            waveHeight: newWaveHeight,
            currentSpeed: newCurrentSpeed
        });
    }, 5000);
};

// 停止实时气象数据更新
const stopRealTimeWeatherUpdate = () => {
    if (realTimeWeatherTimer) {
        console.log('⏹️ 停止实时气象数据更新');
        clearInterval(realTimeWeatherTimer);
        realTimeWeatherTimer = null;
    }
};

// 启动作业进度自动更新定时器
const startWorkingProgressTimer = () => {
    // 先清除已有的定时器
    stopWorkingProgressTimer();
    
    console.log('⏰ 启动作业进度自动滚动');
    currentWorkingDay.value = 0; // 从第0天开始
    
    // 每3秒更新一次进度（可以根据需要调整时间）
    workingProgressTimer = setInterval(() => {
        if (!areaData.value || !areaData.value.arrivalForecast) {
            stopWorkingProgressTimer();
            return;
        }
        
        const totalDays = areaData.value.arrivalForecast.length;
        
        // 当剩余数据不足10天时，生成新的预报数据
        const remainingDays = totalDays - currentWorkingDay.value;
        if (remainingDays < 10) {
            console.log('📊 剩余数据不足10天，生成新的预报数据');
            // 一次生成5天的新数据
            for (let i = 0; i < 5; i++) {
                generateNewForecastDay();
            }
        }
        
        // 推进到下一天
        currentWorkingDay.value++;
        console.log('📅 作业进度自动更新:', currentWorkingDay.value, '/', areaData.value.arrivalForecast.length);
    }, 3000);
};

// 停止作业进度自动更新定时器
const stopWorkingProgressTimer = () => {
    if (workingProgressTimer) {
        console.log('⏹️ 停止作业进度自动滚动');
        clearInterval(workingProgressTimer);
        workingProgressTimer = null;
    }
};

// 生成新的预报数据
const generateNewForecastDay = () => {
    if (!areaData.value || !areaData.value.arrivalForecast) return;
    
    const forecast = areaData.value.arrivalForecast;
    const lastDay = forecast[forecast.length - 1];
    
    // 基于最后一天的日期，生成新的日期
    const lastDate = new Date(lastDay.date);
    lastDate.setDate(lastDate.getDate() + 1);
    const newDate = `${lastDate.getMonth() + 1}/${lastDate.getDate()}`;
    
    // 完全随机生成气象数据，保持多样性
    // 风速：3-18 m/s，大部分在 5-12 之间（可作业范围）
    let windSpeed = Math.random() < 0.7 
        ? 5 + Math.random() * 7  // 70%概率：5-12 m/s（可作业）
        : 12 + Math.random() * 6; // 30%概率：12-18 m/s（不可作业）
    windSpeed = Math.round(windSpeed * 10) / 10; // 保留一位小数
    
    // 浪高：0.5-5 m，大部分在 1-3 之间
    let waveHeight = Math.random() < 0.7
        ? 1 + Math.random() * 2   // 70%概率：1-3 m（可作业）
        : 3 + Math.random() * 2;  // 30%概率：3-5 m（不可作业）
    waveHeight = Math.round(waveHeight * 10) / 10; // 保留一位小数
    
    // 洋流：根据风速计算，约为风速的1-3%
    let currentSpeed = windSpeed * (0.01 + Math.random() * 0.02);
    currentSpeed = Math.round(currentSpeed * 10) / 10; // 保留一位小数
    
    // 判断是否可作业（风速<12 且 浪高<3）
    const workable = windSpeed < 12 && waveHeight < 3;
    
    // 判断风险等级
    let risk = 'safe';
    if (windSpeed > 15 || waveHeight > 4) {
        risk = 'danger';
    } else if (windSpeed > 12 || waveHeight > 3) {
        risk = 'warning';
    } else if (windSpeed > 10 || waveHeight > 2.5) {
        risk = 'caution';
    }
    
    const newDay = {
        date: newDate,
        windSpeed: windSpeed,
        waveHeight: waveHeight,
        currentSpeed: currentSpeed,
        workable: workable,
        risk: risk
    };
    
    // 添加到预报数据中
    forecast.push(newDay);
    
    // 更新可作业天数统计（保持7天窗口的统计）
    if (workable) {
        areaData.value.arrivalStats.workableDays++;
    }
    
    console.log('🆕 生成新的预报数据:', newDate, '风速:', windSpeed.toFixed(1), '浪高:', waveHeight.toFixed(1), '可作业:', workable);
};

// 测试作业进度滚动（临时测试功能）
const testWorkingProgress = () => {
    if (!areaData.value || !areaData.value.arrivalForecast) return;
    
    const totalDays = areaData.value.arrivalForecast.length;
    
    // 模拟作业进度：每次点击增加一天
    if (currentWorkingDay.value < totalDays - 1) {
        currentWorkingDay.value++;
    } else {
        // 重置到第0天
        currentWorkingDay.value = 0;
    }
    console.log('🧪 测试作业进度:', currentWorkingDay.value, '/', totalDays);
};

// 获取预计到达时间
const getEstimatedArrivalTime = () => {
    if (!areaData.value || !areaData.value.voyageForecast || areaData.value.voyageForecast.length === 0) {
        return 'N/A';
    }
    // 获取最后一天的日期作为到达时间
    const lastDay = areaData.value.voyageForecast[areaData.value.voyageForecast.length - 1];
    return lastDay.date || 'N/A';
};

// 获取到达时的气象数据
const getArrivalWeather = () => {
    if (!areaData.value || !areaData.value.voyageForecast || areaData.value.voyageForecast.length === 0) {
        return {
            windSpeed: 0,
            waveHeight: 0,
            currentSpeed: 0,
            workable: false
        };
    }
    // 获取最后一天的气象数据
    const lastDay = areaData.value.voyageForecast[areaData.value.voyageForecast.length - 1];
    return {
        windSpeed: lastDay.windSpeed || 0,
        waveHeight: lastDay.waveHeight || 0,
        currentSpeed: lastDay.currentSpeed || 0,
        workable: lastDay.risk === 'safe' || lastDay.risk === 'caution'
    };
};

// 获取或生成洋流速度（如果数据太小或为0，生成合理的模拟值）
const getCurrentSpeed = (speed, windSpeed) => {
    // 如果有有效的洋流数据（> 0.05 m/s），直接使用
    if (speed && speed > 0.05) {
        return speed.toFixed(2);
    }
    
    // 否则根据风速生成合理的洋流速度
    // 一般情况：洋流速度约为风速的 1-3%
    // 强风区域：洋流速度会更大
    let simulatedSpeed;
    
    if (windSpeed > 15) {
        // 强风区域：0.8 - 2.5 m/s
        simulatedSpeed = 0.8 + Math.random() * 1.7;
    } else if (windSpeed > 10) {
        // 中等风速：0.4 - 1.2 m/s
        simulatedSpeed = 0.4 + Math.random() * 0.8;
    } else if (windSpeed > 5) {
        // 一般风速：0.2 - 0.6 m/s
        simulatedSpeed = 0.2 + Math.random() * 0.4;
    } else {
        // 弱风：0.1 - 0.3 m/s
        simulatedSpeed = 0.1 + Math.random() * 0.2;
    }
    
    return simulatedSpeed.toFixed(2);
};

// 获取航段名称（根据天数划分航段）
const getSegmentName = (dayIndex) => {
    // 根据实际航线情况划分航段
    // 假设20天航程分为几个主要海域
    if (dayIndex < 3) {
        return '东海海域';
    } else if (dayIndex < 7) {
        return '菲律宾海';
    } else if (dayIndex < 12) {
        return '西太平洋';
    } else if (dayIndex < 16) {
        return '中太平洋';
    } else {
        return '目标海域';
    }
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
    const data = event.detail.data || event.detail;
    const mode = event.detail.mode || 'voyage';
    showWeather(data, mode);
};

// 监听航行进度更新事件
const handleProgressUpdate = (event) => {
    console.log('📍 [MiningAreaWeatherCard] 收到进度更新:', event.detail);
    updateProgress(event.detail.dayIndex || event.detail);
};

// 监听作业进度更新事件
const handleWorkingProgressUpdate = (event) => {
    console.log('🔧 [MiningAreaWeatherCard] 收到作业进度更新:', event.detail);
    updateWorkingProgress(event.detail.dayIndex || event.detail);
};

const handleSwitchMode = (event) => {
    console.log('🔄 [MiningAreaWeatherCard] 收到模式切换事件:', event.detail);
    switchMode(event.detail.mode || event.detail);
};

onMounted(() => {
    console.log('✅ [MiningAreaWeatherCard] 组件已挂载，开始监听事件');
    window.addEventListener('showMiningWeatherCard', handleShowWeatherCard);
    window.addEventListener('switchWeatherCardMode', handleSwitchMode);
    window.addEventListener('updateWeatherCardProgress', handleProgressUpdate);
    window.addEventListener('updateWorkingProgress', handleWorkingProgressUpdate);
});

onUnmounted(() => {
    console.log('🔴 [MiningAreaWeatherCard] 组件卸载，移除事件监听');
    stopWorkingProgressTimer(); // 清理作业进度定时器
    stopRealTimeWeatherUpdate(); // 清理实时气象定时器
    window.removeEventListener('showMiningWeatherCard', handleShowWeatherCard);
    window.removeEventListener('switchWeatherCardMode', handleSwitchMode);
    window.removeEventListener('updateWeatherCardProgress', handleProgressUpdate);
    window.removeEventListener('updateWorkingProgress', handleWorkingProgressUpdate);
});

// 暴露方法给父组件（保留，以防需要）
defineExpose({
    showWeather,
    switchMode,
    updateProgress,
    updateWorkingProgress,
    close
});
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.3s ease;
}

.slide-up-enter-from {
    opacity: 0;
    transform: translateY(100%);
}

.slide-up-leave-to {
    opacity: 0;
    transform: translateY(50%);
}

/* 面板切换过渡动画 */
.panel-slide-enter-active,
.panel-slide-leave-active {
    transition: all 0.5s ease;
}

.panel-slide-enter-from {
    opacity: 0;
    transform: translateX(-50px);
}

.panel-slide-leave-to {
    opacity: 0;
    transform: translateX(50px);
}

/* 自定义滚动条样式 */
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

<style scoped>
/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* 慢速旋转动画 */
@keyframes spin-slow {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.animate-spin-slow {
    animation: spin-slow 3s linear infinite;
}

/* 滑入动画 */
.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.3s ease;
}

.slide-up-enter-from {
    opacity: 0;
    transform: translateY(100%);
}

.slide-up-leave-to {
    opacity: 0;
    transform: translateY(50%);
}

/* 面板切换过渡动画 */
.panel-slide-enter-active,
.panel-slide-leave-active {
    transition: all 0.5s ease;
}

.panel-slide-enter-from {
    opacity: 0;
    transform: translateX(-50px);
}

.panel-slide-leave-to {
    opacity: 0;
    transform: translateX(50px);
}

/* 自定义滚动条样式 */
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
