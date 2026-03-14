<template>
    <div class="relative">
        <!-- 功能按钮列表容器 -->
        <div class="absolute top-40 right-8 z-40 flex flex-col gap-5 pointer-events-auto font-['Noto_Sans_SC'] animate-slideInRight">
            <!-- 功能按钮列表 -->
            <transition name="slide-fade">
                <div v-if="!isCollapsed" class="flex flex-col gap-5">
                    <button v-for="(tool, index) in currentTools" :key="tool"
                        @click="handleToggle(tool)"
                        :class="[
                            'group relative w-48 h-14 flex items-center justify-end pr-8 transition-all duration-300',
                            isActive(tool) ? 'translate-x-[-10px]' : 'hover:translate-x-[-6px]'
                        ]"
                    >
            <!-- Background Shape -->
            <div class="absolute inset-0 transform skew-x-[-20deg] border-r-[6px] transition-all duration-300 shadow-lg"
                 :style="{
                     background: isActive(tool) ? 'var(--panel-btn-active-bg)' : 'var(--panel-btn-bg)',
                     borderColor: isActive(tool) ? 'var(--panel-btn-border-active)' : 'var(--panel-btn-border)',
                     boxShadow: isActive(tool) ? 'var(--shadow-glow)' : 'none'
                 }"></div>

            <!-- Text Content -->
            <div class="relative z-10 flex items-center gap-3">
                <span class="text-xl font-bold tracking-wider transition-colors" 
                      :style="{ color: isActive(tool) ? 'white' : 'var(--text-secondary)' }">
                    {{ tool }}
                </span>
                <!-- Icon placeholder -->
                 <div class="w-2 h-2 rotate-45 transition-all duration-300" 
                      :style="{
                          backgroundColor: isActive(tool) ? 'var(--header-highlight)' : 'var(--accent-cyan)',
                          boxShadow: isActive(tool) ? '0 0 5px var(--header-highlight)' : 'none'
                      }"></div>
            </div>

            <!-- Hover Line Effect -->
            <div class="absolute bottom-0 right-0 w-0 h-[3px] transition-all duration-300 group-hover:w-full opacity-0 group-hover:opacity-100" 
                 style="background-color: var(--header-highlight);"></div>
        </button>
                </div>
            </transition>
        </div>
        
        <!-- 折叠/展开按钮 - 固定在右侧中间 -->
        <button 
            @click="toggleCollapse"
            class="group fixed top-1/2 right-2 -translate-y-1/2 z-50 w-10 h-16 flex items-center justify-center transition-all duration-300 hover:scale-110 pointer-events-auto"
            :title="isCollapsed ? '展开功能面板' : '折叠功能面板'"
        >
            <!-- Background Shape -->
            <div class="absolute inset-0 transform skew-y-[-10deg] border-r-[4px] shadow-lg transition-all duration-300 rounded-l-lg" 
                 style="background: var(--panel-btn-active-bg); border-color: var(--accent-cyan);"
                 :style="{ borderColor: isCollapsed ? 'var(--header-highlight)' : 'var(--accent-cyan)', boxShadow: 'var(--shadow-glow)' }"></div>
            
            <!-- Icon -->
            <svg 
                class="relative z-10 w-5 h-5 transition-all duration-300" 
                :class="{ 'rotate-180': isCollapsed }"
                :style="{ color: isCollapsed ? 'var(--header-highlight)' : 'var(--accent-cyan)' }"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
            >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
        </button>
    </div>
</template>

<script>
import { ref, computed } from 'vue';
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
    emits: ['toggleList', 'toggleMapTools', 'toggleQuery', 'toggleLayers', 'toggleWeatherLayers', 'toggleShipSearch', 'toggleRoutePlan', 'toggleHistoryTrack', 'toggleShipList', 'toggleRouteWeather', 'toggleAreaMonitor', 'toggleMiningWeatherMonitor', 'toggleMiningData', 'toggleResearchVesselList', 'toggleRouteDemo', 'toggleGeologicalSurvey', 'toggleDrillingPanel', 'toggleDrillingStatistics', 'toggleCoordinateCollector', 'togglePolygonDrawer', 'toggleResourcePotential', 'togglePolarStations', 'togglePolarSovereignty', 'togglePolarPanel', 'toggleSituationOverview', 'toggleCableList', 'toggleCableStatistics', 'toggleArcticRouteList', 'toggleArcticRouteStatistics'],
    setup(props, { emit }) {
        // ==================== 状态管理 ====================
        
        /**
         * 折叠状态 - 默认折叠
         */
        const isCollapsed = ref(true);
        
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
         * 切换折叠/展开状态
         */
        const toggleCollapse = () => {
            isCollapsed.value = !isCollapsed.value;
        };
        
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
            
            // 态势总览选项卡的功能
            if (props.currentTab === '态势总览') {
                if (tool === '光缆列表') {
                    emit('toggleCableList');
                } else if (tool === '光缆统计') {
                    emit('toggleCableStatistics');
                } else if (tool === '北极航线列表') {
                    emit('toggleArcticRouteList');
                } else if (tool === '北极航线统计') {
                    emit('toggleArcticRouteStatistics');
                } else {
                    console.log(`🚧 "${tool}" 功能开发中...`);
                }
            }
            // 矿区管理选项卡的功能
            else if (props.currentTab === '矿区管理') {
                if (tool === '矿区列表') {
                    emit('toggleList');
                } else if (tool === '矿区查询') {
                    emit('toggleQuery');
                } else if (tool === '图层控制') {
                    emit('toggleLayers');
                } else if (tool === '矿区气象') {
                    emit('toggleMiningWeatherMonitor');
                } else if (tool === '数据统计') {
                    emit('toggleMiningData');
                }
            } 
            // 地质调查选项卡的功能
            else if (props.currentTab === '地质调查') {
                if (tool === '调查目录') {
                    emit('toggleGeologicalSurvey');
                } else {
                    console.log(`🚧 "${tool}" 功能开发中...`);
                }
            }
            // 大洋钻探选项卡的功能
            else if (props.currentTab === '大洋钻探') {
                if (tool === '钻孔面板') {
                    emit('toggleDrillingPanel');
                } else if (tool === '数据统计') {
                    emit('toggleDrillingStatistics');
                } else {
                    console.log(`🚧 "${tool}" 功能开发中...`);
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
            // 极地科考选项卡的功能
            else if (props.currentTab === '极地科考') {
                console.log('🧊 极地科考按钮点击:', tool);
                if (tool === '态势总览') {
                    emit('toggleSituationOverview');
                } else if (tool === '坐标采集') {
                    emit('toggleCoordinateCollector');
                } else if (tool === '区域勾面') {
                    emit('togglePolygonDrawer');
                } else if (tool === '极地面板') {
                    emit('togglePolarPanel');
                } else if (tool === '资源潜力') {
                    emit('toggleResourcePotential');
                } else if (tool === '科考站点') {
                    emit('togglePolarStations');
                } else if (tool === '主权主张') {
                    console.log('🌐 触发主权主张事件');
                    emit('togglePolarSovereignty');
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
                } else if (tool === '科考船列表') {
                    emit('toggleResearchVesselList');
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
            
            // 态势总览选项卡的功能
            if (props.currentTab === '态势总览') {
                if (tool === '光缆列表') return props.activePanels.cableList;
                if (tool === '光缆统计') return props.activePanels.cableStatistics;
                if (tool === '北极航线列表') return props.activePanels.arcticRouteList;
                if (tool === '北极航线统计') return props.activePanels.arcticRouteStatistics;
            }
            
            // 矿区管理选项卡的功能
            if (props.currentTab === '矿区管理') {
                if (tool === '矿区列表') return props.activePanels.list;
                if (tool === '矿区查询') return props.activePanels.query;
                if (tool === '图层控制') return props.activePanels.layers;
                if (tool === '矿区气象') return props.activePanels.miningWeatherMonitor;
                if (tool === '数据统计') return props.activePanels.miningData;
            }
            
            // 地质调查选项卡的功能
            if (props.currentTab === '地质调查') {
                if (tool === '调查目录') return props.activePanels.geologicalSurvey;
            }
            
            // 大洋钻探选项卡的功能
            if (props.currentTab === '大洋钻探') {
                if (tool === '钻孔面板') return props.activePanels.drillingPanel;
                if (tool === '数据统计') return props.activePanels.drillingStatistics;
            }
            
            // 气象监测选项卡的功能
            if (props.currentTab === '气象监测') {
                if (tool === '气象图层') return props.activePanels.weatherLayers;
            }
            
            // 极地科考选项卡的功能
            if (props.currentTab === '极地科考') {
                if (tool === '态势总览') return props.activePanels.situationOverview;
                if (tool === '坐标采集') return props.activePanels.coordinateCollector;
                if (tool === '区域勾面') return props.activePanels.polygonDrawer;
                if (tool === '极地面板') return props.activePanels.polarPanel;
                if (tool === '资源潜力') return props.activePanels.resourcePotential;
                if (tool === '科考站点') return props.activePanels.polarStations;
                if (tool === '主权主张') return props.activePanels.polarSovereignty;
            }
            
            // 船舶追踪选项卡的功能
            if (props.currentTab === '船舶追踪') {
                if (tool === '船舶搜索') return props.activePanels.shipSearch;
                if (tool === '航线规划') return props.activePanels.routePlan;
                if (tool === '区域监控') return props.activePanels.areaMonitor;
                if (tool === '历史轨迹') return props.activePanels.historyTrack;
                if (tool === '船舶列表') return props.activePanels.shipList;
                if (tool === '科考船列表') return props.activePanels.researchVesselList;
                if (tool === '航线气象') return props.activePanels.routeWeather;
                if (tool === '航线动态') return props.activePanels.routeDemo;
            }
            
            return false;
        };

        return {
            isCollapsed,
            currentTools,
            toggleCollapse,
            handleToggle,
            isActive
        };
    }
};
</script>

<style scoped>
/* 滑动淡入淡出动画 */
.slide-fade-enter-active,
.slide-fade-leave-active {
    transition: all 0.3s ease;
}

.slide-fade-enter-from {
    transform: translateX(20px);
    opacity: 0;
}

.slide-fade-leave-to {
    transform: translateX(20px);
    opacity: 0;
}
</style>