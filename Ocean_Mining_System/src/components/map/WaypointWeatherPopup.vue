<template>
    <transition name="popup-fade">
        <div v-if="show && waypointData" 
            :style="popupStyle"
            class="fixed z-[999] pointer-events-auto">
            
            <!-- 气象信息卡片 - 精简版 -->
            <div class="relative bg-slate-900/95 backdrop-blur-xl border-2 rounded-lg shadow-2xl overflow-hidden"
                :class="getBorderColorClass(waypointData.risk)"
                style="width: 256px;">
                
                <!-- 顶部标题栏 -->
                <div class="px-3 py-1.5 border-b flex items-center justify-between"
                    :class="getHeaderClass(waypointData.risk)">
                    <div class="flex items-center gap-1.5">
                        <div class="w-1.5 h-1.5 rounded-full animate-pulse"
                            :class="getDotColorClass(waypointData.risk)"></div>
                        <span class="text-[15px] font-bold text-white">下一航段</span>
                    </div>
                    <div class="px-2 py-0.5 rounded text-[14px] font-bold"
                        :class="getRiskBadgeClass(waypointData.risk)">
                        {{ getRiskLabel(waypointData.risk) }}
                    </div>
                </div>
                
                <!-- 航点名称 -->
                <div class="px-3 py-1.5 bg-slate-800/50 border-b border-slate-700/50">
                    <div class="text-white font-bold text-[15px] truncate">{{ waypointData.name }}</div>
                </div>
                
                <!-- 气象数据网格 - 2x2布局 -->
                <div class="p-2 grid grid-cols-2 gap-1.5">
                    <!-- 风速 -->
                    <div class="text-center bg-slate-800/35 rounded p-1.5">
                        <div class="text-[14px] text-slate-400">风速</div>
                        <div class="text-[20px] font-bold font-['Rajdhani'] leading-tight tabular-nums"
                            :class="getValueColor(waypointData.weather.windSpeed, 12)">
                            {{ waypointData.weather.windSpeed }}<span class="text-[14px] text-slate-400 ml-0.5">m/s</span>
                        </div>
                    </div>
                    
                    <!-- 风级 -->
                    <div class="text-center bg-slate-800/35 rounded p-1.5">
                        <div class="text-[14px] text-slate-400">风级</div>
                        <div class="text-[20px] font-bold font-['Rajdhani'] leading-tight tabular-nums"
                            :class="getValueColor(waypointData.weather.windBeaufort, 6)">
                            {{ waypointData.weather.windBeaufort }}<span class="text-[14px] text-slate-400 ml-0.5">级</span>
                        </div>
                    </div>
                    
                    <!-- 浪高 -->
                    <div class="text-center bg-slate-800/35 rounded p-1.5">
                        <div class="text-[14px] text-slate-400">浪高</div>
                        <div class="text-[20px] font-bold font-['Rajdhani'] leading-tight tabular-nums"
                            :class="getValueColor(waypointData.weather.waveHeight, 3)">
                            {{ waypointData.weather.waveHeight }}<span class="text-[14px] text-slate-400 ml-0.5">m</span>
                        </div>
                    </div>
                    
                    <!-- 温度 -->
                    <div class="text-center bg-slate-800/35 rounded p-1.5">
                        <div class="text-[14px] text-slate-400">温度</div>
                        <div class="text-[20px] font-bold text-cyan-300 font-['Rajdhani'] leading-tight tabular-nums">
                            {{ waypointData.weather.temperature }}<span class="text-[14px] text-slate-400 ml-0.5">°C</span>
                        </div>
                    </div>
                </div>
                
                <!-- 航段信息 - 精简 -->
                <div v-if="waypointData.segment" 
                    class="px-3 py-1.5 bg-slate-800/50 border-t border-slate-700/50 text-[14px]">
                    <div class="flex justify-between text-slate-300 tabular-nums">
                        <span><span class="text-white font-bold font-['Rajdhani']">{{ waypointData.segment.distance }}</span> 海里</span>
                        <span><span class="text-white font-bold font-['Rajdhani']">{{ waypointData.segment.duration }}</span></span>
                    </div>
                </div>
                
                <!-- 三角形指示器 -->
                <div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
                    :class="getTriangleClass(waypointData.risk)"></div>
            </div>
        </div>
    </transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const show = ref(false);
const waypointData = ref(null);
const position = ref({ x: 0, y: 0 });

// 计算弹窗样式（位置），避开左侧航线面板(宽29rem+左距2rem)与顶栏/底部简报卡片
const popupStyle = computed(() => {
    const rawX = Number(position.value.x);
    const rawY = Number(position.value.y);
    const clampedX = Number.isFinite(rawX) ? Math.max(644, Math.min(1772, rawX)) : 644;
    const clampedY = Number.isFinite(rawY) ? Math.max(410, Math.min(710, rawY)) : 410;
    return {
        left: `${clampedX}px`,
        top: `${clampedY}px`,
        transform: 'translate(-50%, -100%)', // 居中并向上偏移
        marginTop: '-20px' // 额外向上偏移20px
    };
});

// 显示气象弹窗
const showWeather = (waypoint, screenPosition) => {
    waypointData.value = waypoint;
    position.value = screenPosition;
    show.value = true;
    
    console.log('📍 显示航点气象弹窗:', waypoint.name, '位置:', screenPosition);
};

// 隐藏气象弹窗
const hideWeather = () => {
    show.value = false;
    setTimeout(() => {
        waypointData.value = null;
    }, 300);
};

// 获取边框颜色类
const getBorderColorClass = (risk) => {
    const colors = {
        safe: 'border-green-500/50',
        caution: 'border-yellow-500/50',
        warning: 'border-orange-500/50',
        danger: 'border-red-500/50'
    };
    return colors[risk] || colors.safe;
};

// 获取头部样式类
const getHeaderClass = (risk) => {
    const colors = {
        safe: 'bg-green-900/30 border-green-500/20',
        caution: 'bg-yellow-900/30 border-yellow-500/20',
        warning: 'bg-orange-900/30 border-orange-500/20',
        danger: 'bg-red-900/30 border-red-500/20'
    };
    return colors[risk] || colors.safe;
};

// 获取点颜色类
const getDotColorClass = (risk) => {
    const colors = {
        safe: 'bg-green-400',
        caution: 'bg-yellow-400',
        warning: 'bg-orange-400',
        danger: 'bg-red-400'
    };
    return colors[risk] || colors.safe;
};

// 获取三角形颜色类
const getTriangleClass = (risk) => {
    const colors = {
        safe: 'bg-green-500/50',
        caution: 'bg-yellow-500/50',
        warning: 'bg-orange-500/50',
        danger: 'bg-red-500/50'
    };
    return colors[risk] || colors.safe;
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

// 获取风险徽章样式类
const getRiskBadgeClass = (risk) => {
    const classes = {
        safe: 'bg-green-900/50 text-green-400 border border-green-500/50',
        caution: 'bg-yellow-900/50 text-yellow-400 border border-yellow-500/50',
        warning: 'bg-orange-900/50 text-orange-400 border border-orange-500/50',
        danger: 'bg-red-900/50 text-red-400 border border-red-500/50'
    };
    return classes[risk] || classes.safe;
};

// 获取数值颜色（根据阈值）
const getValueColor = (value, threshold) => {
    if (value >= threshold * 1.25) return 'text-red-400';
    if (value >= threshold) return 'text-orange-400';
    if (value >= threshold * 0.8) return 'text-yellow-400';
    return 'text-green-400';
};

// 暴露方法
defineExpose({
    showWeather,
    hideWeather
});
</script>

<style scoped>
.popup-fade-enter-active,
.popup-fade-leave-active {
    transition: all 0.3s ease;
}

.popup-fade-enter-from {
    opacity: 0;
    transform: translate(-50%, -100%) scale(0.9);
}

.popup-fade-leave-to {
    opacity: 0;
    transform: translate(-50%, -100%) scale(0.9);
}
</style>
