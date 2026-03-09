<template>
    <transition name="slide-up">
        <div v-if="show && stations.length > 0" class="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-auto">
            <div class="tech-panel-enhanced p-4 w-[58rem] max-h-[22rem] overflow-hidden relative" style="clip-path: polygon(0 0, 100% 0, 100% 95%, 98% 100%, 0 100%);">
                <!-- 动态扫描线 -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse"></div>
                <div class="corner-decoration corner-tl"></div>
                <div class="corner-decoration corner-tr"></div>
                
                <!-- 标题栏 -->
                <div class="flex items-center justify-between mb-3 border-b-2 border-blue-500/30 pb-2">
                    <div class="flex items-center gap-2">
                        <div class="w-1 h-5 bg-blue-400 shadow-[0_0_10px_#60a5fa]"></div>
                        <h3 class="text-lg font-bold text-white">科考站列表</h3>
                        <div class="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                            {{ stations.length }}
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-blue-400">{{ regionName }}</span>
                        <button @click="$emit('close')" class="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-700/50 rounded">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- 表头 -->
                <div class="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-700/50 border-b border-slate-600/50 text-xs text-slate-300">
                    <div class="col-span-1 text-center">序号</div>
                    <div class="col-span-3">站点名称</div>
                    <div class="col-span-2">国家</div>
                    <div class="col-span-2">建站时间</div>
                    <div class="col-span-2">人员规模</div>
                    <div class="col-span-2">坐标位置</div>
                </div>

                <!-- 科考站列表 -->
                <div class="overflow-y-auto max-h-[14rem] custom-scrollbar">
                    <div 
                        v-for="(station, index) in stations" 
                        :key="station.id"
                        @click="$emit('stationClick', station)"
                        class="grid grid-cols-12 gap-2 px-3 py-2.5 border-b border-slate-600/40 hover:bg-blue-500/15 cursor-pointer transition-all duration-200 group relative"
                        :style="`border-left: 4px solid ${getCountryColor(station.country)};`"
                    >
                        <!-- 序号 -->
                        <div class="col-span-1 flex items-center justify-center">
                            <div 
                                class="w-5 h-5 rounded-full flex items-center justify-center text-xs transition-colors"
                                :style="`background-color: ${getCountryColor(station.country)}40; color: ${getTextColor(station.country)};`"
                            >
                                {{ index + 1 }}
                            </div>
                        </div>
                        
                        <!-- 站点名称 -->
                        <div class="col-span-3 flex items-center">
                            <div class="flex items-center gap-2">
                                <span class="text-base">🏛️</span>
                                <span class="text-white text-sm group-hover:text-blue-200 transition-colors">
                                    {{ station.stationName }}
                                </span>
                            </div>
                        </div>
                        
                        <!-- 国家 -->
                        <div class="col-span-2 flex items-center">
                            <span 
                                class="text-sm px-2 py-0.5 rounded"
                                :style="`background-color: ${getCountryColor(station.country)}30; color: ${getCountryColor(station.country)};`"
                            >
                                {{ station.country }}
                            </span>
                        </div>
                        
                        <!-- 建站时间 -->
                        <div class="col-span-2 flex items-center">
                            <span class="text-slate-300 text-sm">
                                {{ station.establishedDate || '-' }}
                            </span>
                        </div>
                        
                        <!-- 人员规模 -->
                        <div class="col-span-2 flex items-center">
                            <span class="text-slate-300 text-sm">
                                {{ station.personnel || '-' }}
                            </span>
                        </div>
                        
                        <!-- 坐标位置 -->
                        <div class="col-span-2 flex items-center">
                            <span class="text-slate-300 text-sm" v-if="station.coordinates">
                                {{ formatCoordinates(station.coordinates) }}
                            </span>
                            <span class="text-slate-400 text-sm" v-else>-</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
// 国家颜色配置（与地图保持一致）
const COUNTRY_COLORS = {
    '中国': '#FF0000',
    '美国': '#0066FF',
    '俄罗斯': '#FFD700',
    '英国': '#00FFFF',
    '日本': '#FF1493',
    '澳大利亚': '#00FF00',
    '阿根廷': '#87CEEB',
    '智利': '#FF6600',
    '法国': '#9370DB',
    '德国': '#FFFFFF',
    '韩国': '#FF00FF',
    '印度': '#FFA500',
    '挪威': '#DC143C',
    '新西兰': '#00CED1',
    '乌克兰': '#1E90FF',
    '波兰': '#FF69B4',
    '乌拉圭': '#4169E1',
    '意大利': '#32CD32',
    '法国、意大利': '#BA55D3',
    '法国、德国、挪威': '#8B008B',
    '丹麦': '#ADFF2F',
    '瑞典': '#FFE4B5',
    '芬兰': '#20B2AA',
    '加拿大': '#FF4500'
};

export default {
    name: 'PolarStationListPanel',
    props: {
        show: {
            type: Boolean,
            default: false
        },
        stations: {
            type: Array,
            default: () => []
        },
        region: {
            type: String,
            default: 'antarctic'
        }
    },
    emits: ['close', 'stationClick'],
    computed: {
        regionName() {
            return this.region === 'antarctic' ? '南极科考站' : '北极科考站';
        }
    },
    methods: {
        formatCoordinates(coords) {
            if (!coords || coords.length < 2) return '-';
            const [lng, lat] = coords;
            return `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
        },
        getCountryColor(country) {
            return COUNTRY_COLORS[country] || '#808080';
        },
        getTextColor(country) {
            // 德国和瑞典用黑色文字，其他用白色
            return (country === '德国' || country === '瑞典') ? '#000' : '#fff';
        }
    }
};
</script>

<style scoped>
/* 科技面板样式 */
.tech-panel-enhanced {
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.92) 0%, rgba(51, 65, 85, 0.92) 100%);
    backdrop-filter: blur(20px);
    border: 2px solid rgba(59, 130, 246, 0.4);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

/* 角落装饰 */
.corner-decoration {
    position: absolute;
    width: 12px;
    height: 12px;
    border: 2px solid rgba(59, 130, 246, 0.6);
}

.corner-tl {
    top: -2px;
    left: -2px;
    border-right: none;
    border-bottom: none;
}

.corner-tr {
    top: -2px;
    right: -2px;
    border-left: none;
    border-bottom: none;
}

/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(30, 41, 59, 0.3);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.6);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(59, 130, 246, 0.8);
}

/* 滑入动画 */
.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
    opacity: 0;
    transform: translate(-50%, 100px);
}

.slide-up-enter-to,
.slide-up-leave-from {
    opacity: 1;
    transform: translate(-50%, 0);
}
</style>
