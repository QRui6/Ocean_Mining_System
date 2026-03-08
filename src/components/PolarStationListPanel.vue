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
                <div class="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-800/40 border-b border-slate-700/50 text-xs text-slate-400">
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
                        class="grid grid-cols-12 gap-2 px-3 py-2.5 border-b border-slate-700/30 hover:bg-blue-500/10 cursor-pointer transition-all duration-200 group"
                    >
                        <!-- 序号 -->
                        <div class="col-span-1 flex items-center justify-center">
                            <div class="w-5 h-5 rounded-full bg-slate-700/50 group-hover:bg-blue-500/30 flex items-center justify-center text-xs text-slate-400 group-hover:text-blue-300 transition-colors">
                                {{ index + 1 }}
                            </div>
                        </div>
                        
                        <!-- 站点名称 -->
                        <div class="col-span-3 flex items-center">
                            <div class="flex items-center gap-2">
                                <span class="text-base">🏛️</span>
                                <span class="text-white text-sm group-hover:text-blue-300 transition-colors">
                                    {{ station.stationName }}
                                </span>
                            </div>
                        </div>
                        
                        <!-- 国家 -->
                        <div class="col-span-2 flex items-center">
                            <span class="text-slate-300 text-sm">{{ station.country }}</span>
                        </div>
                        
                        <!-- 建站时间 -->
                        <div class="col-span-2 flex items-center">
                            <span class="text-slate-400 text-sm">
                                {{ station.establishedDate || '-' }}
                            </span>
                        </div>
                        
                        <!-- 人员规模 -->
                        <div class="col-span-2 flex items-center">
                            <span class="text-slate-400 text-sm">
                                {{ station.personnel || '-' }}
                            </span>
                        </div>
                        
                        <!-- 坐标位置 -->
                        <div class="col-span-2 flex items-center">
                            <span class="text-slate-400 text-sm" v-if="station.coordinates">
                                {{ formatCoordinates(station.coordinates) }}
                            </span>
                            <span class="text-slate-500 text-sm" v-else>-</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
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
        }
    }
};
</script>

<style scoped>
/* 科技面板样式 */
.tech-panel-enhanced {
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
    backdrop-filter: blur(20px);
    border: 2px solid rgba(59, 130, 246, 0.3);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
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
    background: rgba(15, 23, 42, 0.3);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.5);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(59, 130, 246, 0.7);
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
