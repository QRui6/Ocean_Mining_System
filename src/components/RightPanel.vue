<template>
    <div class="absolute top-40 right-8 z-40 flex flex-col gap-5 pointer-events-auto font-['Noto_Sans_SC'] animate-slideInRight">
        <button v-for="(tool, index) in currentTools" :key="tool"
            @click="handleToggle(tool)"
            :class="[
                'group relative w-48 h-14 flex items-center justify-end pr-8 transition-all duration-300',
                isActive(tool) ? 'translate-x-[-10px]' : 'hover:translate-x-[-6px]'
            ]"
        >
            <!-- Background Shape -->
            <div :class="[
                'absolute inset-0 transform skew-x-[-20deg] border-r-[6px] transition-all duration-300 shadow-lg backdrop-blur-sm',
                isActive(tool)
                    ? 'bg-gradient-to-l from-cyan-900/90 to-slate-900/80 border-yellow-400 shadow-[0_0_25px_rgba(6,182,212,0.4)]' 
                    : 'bg-slate-900/80 border-cyan-600/50 group-hover:bg-slate-800 group-hover:border-cyan-400'
            ]"></div>

            <!-- Text Content -->
            <div class="relative z-10 flex items-center gap-3">
                <span :class="['text-xl font-bold tracking-wider transition-colors', isActive(tool) ? 'text-white' : 'text-cyan-100 group-hover:text-white']">
                    {{ tool }}
                </span>
                <!-- Icon placeholder -->
                 <div :class="['w-2 h-2 rotate-45 transition-all duration-300', isActive(tool) ? 'bg-yellow-400 shadow-[0_0_5px_#facc15]' : 'bg-cyan-500 group-hover:bg-cyan-300']"></div>
            </div>

            <!-- Hover Line Effect -->
            <div class="absolute bottom-0 right-0 w-0 h-[3px] bg-yellow-400 transition-all duration-300 group-hover:w-full opacity-0 group-hover:opacity-100"></div>
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
    emits: ['toggleList', 'toggleMapTools', 'toggleQuery', 'toggleLayers', 'toggleWeatherLayers', 'toggleShipSearch', 'toggleRoutePlan', 'toggleHistoryTrack', 'toggleShipList', 'toggleRouteWeather'], // 向父组件发送面板切换事件
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
                } else if (tool === '历史轨迹') {
                    emit('toggleHistoryTrack');
                } else if (tool === '船舶列表') {
                    emit('toggleShipList');
                } else if (tool === '航线气象') {
                    emit('toggleRouteWeather');
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
            }
            
            // 气象监测选项卡的功能
            if (props.currentTab === '气象监测') {
                if (tool === '气象图层') return props.activePanels.weatherLayers;
            }
            
            // 船舶追踪选项卡的功能
            if (props.currentTab === '船舶追踪') {
                if (tool === '船舶搜索') return props.activePanels.shipSearch;
                if (tool === '航线规划') return props.activePanels.routePlan;
                if (tool === '历史轨迹') return props.activePanels.historyTrack;
                if (tool === '船舶列表') return props.activePanels.shipList;
                if (tool === '航线气象') return props.activePanels.routeWeather;
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