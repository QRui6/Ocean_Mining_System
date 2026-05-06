<template>
    <div class="absolute top-40 right-8 z-40 flex flex-col gap-5 pointer-events-auto font-['Noto_Sans_SC'] animate-slideInRight">
        <button v-for="(tool, index) in currentTools" :key="tool"
            @click="handleToggle(tool)"
            :class="[
                'right-panel-btn group relative w-48 h-14 flex items-center justify-end pr-8',
                isActive(tool) ? 'is-active' : ''
            ]"
        >
            <!-- Background Shape -->
            <div :class="[
                'absolute inset-0 transform skew-x-[-20deg] border-r-[6px]',
                isActive(tool)
                    ? 'bg-gradient-to-l from-cyan-900/90 to-slate-900/80 border-yellow-400' 
                    : 'bg-[#0f172a] border-[#164e63]'
            ]"></div>

            <!-- Text Content -->
            <div class="relative z-10 flex items-center gap-3">
                <span :class="['text-xl font-bold tracking-wider', isActive(tool) ? 'text-white' : 'text-cyan-100']">
                    {{ tool }}
                </span>
                <!-- Icon placeholder -->
                 <div :class="['w-2 h-2 rotate-45', isActive(tool) ? 'bg-yellow-400 shadow-[0_0_5px_#facc15]' : 'bg-cyan-500']"></div>
            </div>

        </button>
    </div>
</template>

<script>
import { computed } from 'vue';
import { TAB_TOOLS_MAPPING } from '../constants.js';

export default {
    props: {
        activePanels: {
            type: Object,
            default: () => ({})
        },
        currentTab: {
            type: String,
            default: '矿区管理'
        }
    },
    emits: ['toggleList', 'toggleMapTools', 'toggleQuery', 'toggleLayers', 'toggleWeatherLayers', 'toggleShipSearch', 'toggleRoutePlan', 'toggleHistoryTrack', 'toggleShipList', 'toggleRouteWeather', 'toggleAreaMonitor', 'toggleMiningWeatherMonitor', 'toggleRouteDemo'],
    setup(props, { emit }) {
        // ==================== 计算属性 ====================
        
        /**
         * 根据当前选项卡动态获取功能列表
         * 从 TAB_TOOLS_MAPPING 映射表中获取对应的功能按钮列表
         */
        const currentTools = computed(() => {
            return TAB_TOOLS_MAPPING[props.currentTab] || [];
        });
        
        // ==================== 事件处理函数 ====================
        
        /**
         * 处理功能按钮点击事件
         * @param {String} tool - 功能名称
         */
        const handleToggle = (tool) => {
            // 通用功能：在所有选项卡中都可用
            if (tool === '地图工具') {
                emit('toggleMapTools');
                return;
            }
            
            // 矿区管理选项卡的功能
            if (props.currentTab === '矿区管理') {
                if (tool === '矿区列表') {
                    emit('toggleList');
                } else if (tool === '矿区查询') {
                    emit('toggleQuery');
                } else if (tool === '图层控制') {
                    emit('toggleLayers');
                } else if (tool === '矿区气象') {
                    emit('toggleMiningWeatherMonitor');
                }
            } 
            // 气象监测选项卡的功能
            else if (props.currentTab === '气象监测') {
                if (tool === '气象图层') {
                    emit('toggleWeatherLayers');
                } else {
                    console.log(`🚧 "${tool}" 功能开发中...`);
                }
            }
            // 船舶追踪选项卡的功能
            else if (props.currentTab === '船舶追踪') {
                if (tool === '船舶搜索') {
                    emit('toggleShipSearch');
                } else if (tool === '航线规划') {
                    emit('toggleRoutePlan');
                } else if (tool === '区域监控') {
                    emit('toggleAreaMonitor');
                } else if (tool === '历史轨迹') {
                    emit('toggleHistoryTrack');
                } else if (tool === '船舶列表') {
                    emit('toggleShipList');
                } else if (tool === '航线气象') {
                    emit('toggleRouteWeather');
                } else if (tool === '航线动态') {
                    emit('toggleRouteDemo');
                } else {
                    console.log(`🚧 "${tool}" 功能开发中...`);
                }
            }
            else {
                // 其他选项卡的功能暂未实现
                console.log(`🚧 "${tool}" 功能开发中...`);
            }
        };

        /**
         * 判断功能按钮是否处于激活状态
         * @param {String} tool - 功能名称
         * @returns {Boolean} 是否激活
         */
        const isActive = (tool) => {
            // 通用功能：在所有选项卡中都显示激活状态
            if (tool === '地图工具') return props.activePanels.mapTools;
            
            // 矿区管理选项卡的功能
            if (props.currentTab === '矿区管理') {
                if (tool === '矿区列表') return props.activePanels.list;
                if (tool === '矿区查询') return props.activePanels.query;
                if (tool === '图层控制') return props.activePanels.layers;
                if (tool === '矿区气象') return props.activePanels.miningWeatherMonitor;
            }
            
            // 气象监测选项卡的功能
            if (props.currentTab === '气象监测') {
                if (tool === '气象图层') return props.activePanels.weatherLayers;
            }
            
            // 船舶追踪选项卡的功能
            if (props.currentTab === '船舶追踪') {
                if (tool === '船舶搜索') return props.activePanels.shipSearch;
                if (tool === '航线规划') return props.activePanels.routePlan;
                if (tool === '区域监控') return props.activePanels.areaMonitor;
                if (tool === '历史轨迹') return props.activePanels.historyTrack;
                if (tool === '船舶列表') return props.activePanels.shipList;
                if (tool === '航线气象') return props.activePanels.routeWeather;
                if (tool === '航线动态') return props.activePanels.routeDemo;
            }
            
            return false;
        };

        return {
            currentTools,
            handleToggle,
            isActive
        };
    }
};
</script>

<style scoped>
.right-panel-btn:hover {
    box-shadow: none !important;
    transform: none !important;
}

.right-panel-btn.is-active {
    transform: translateX(-10px);
}

.right-panel-btn.is-active:hover {
    box-shadow: none !important;
    transform: translateX(-10px) !important;
}
</style>
