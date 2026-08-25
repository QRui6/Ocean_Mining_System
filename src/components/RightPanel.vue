<template>
    <div
        class="pointer-events-none absolute top-0 right-0 h-full z-50 font-['Noto_Sans_SC'] transition-[width] duration-300"
        :class="collapsed ? 'w-12' : 'w-64'"
    >
        <div
            class="pointer-events-auto absolute right-0 top-1/2 z-20 flex h-28 w-10 -translate-y-1/2 items-center justify-end"
            @mouseenter="isHandleHovered = true"
            @mouseleave="isHandleHovered = false"
        >
            <button
                type="button"
                :class="[
                    'flex h-24 w-8 items-center justify-center border border-r-0 border-cyan-500/45 bg-slate-950/85 text-xl font-bold text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.16)] backdrop-blur-md transition-all duration-200 hover:bg-cyan-500/20 hover:text-white',
                    collapsed || isHandleHovered ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                ]"
                :title="collapsed ? '打开更多功能菜单' : '收起更多功能菜单'"
                :aria-label="collapsed ? '打开更多功能菜单' : '收起更多功能菜单'"
                @click.stop="setCollapsed(!collapsed)"
            >
                <span v-if="collapsed" class="flex flex-col items-center gap-1 text-[11px] leading-none tracking-widest">
                    <span>更</span>
                    <span>多</span>
                    <span>功</span>
                    <span>能</span>
                </span>
                <span v-else>›</span>
            </button>
        </div>

        <div
            :class="[
                'absolute top-40 right-8 flex flex-col gap-5 transition-all duration-300',
                collapsed ? 'translate-x-[calc(100%+3rem)] opacity-0 pointer-events-none' : 'translate-x-0 opacity-100 pointer-events-auto'
            ]"
        >
        <div v-for="tool in currentTools" :key="tool" class="flex flex-col items-end gap-2">
            <button
                @click="handleToggle(tool)"
                :class="[
                    'right-panel-btn group relative w-48 h-14 flex items-center justify-end pr-8',
                    isActive(tool) ? 'is-active' : ''
                ]"
            >
                <div
                    :class="[
                        'absolute inset-0 transform skew-x-[-20deg] border-r-[6px]',
                        isActive(tool)
                            ? 'bg-gradient-to-l from-cyan-900/90 to-slate-900/80 border-yellow-400'
                            : 'bg-[#0f172a] border-[#164e63]'
                    ]"
                ></div>

                <div class="relative z-10 flex items-center gap-3">
                    <span :class="[tool.length > 8 ? 'text-sm' : 'text-xl', 'font-bold tracking-wider', isActive(tool) ? 'text-white' : 'text-cyan-100']">
                        {{ tool }}
                    </span>
                    <div :class="['w-2 h-2 rotate-45', isActive(tool) ? 'bg-yellow-400 shadow-[0_0_5px_#facc15]' : 'bg-cyan-500']"></div>
                </div>
            </button>

            <div
                v-if="tool === '气象图层' && currentTab === '环境监测' && activePanels.weatherLayers"
                class="flex w-48 flex-col items-end gap-2.5"
            >
                <div
                    v-for="group in visibleWeatherGroups"
                    :key="group.id"
                    class="flex w-full flex-col items-end gap-2"
                >
                    <button
                        @click="toggleGroup(group.id)"
                        :class="[
                            'group-panel-btn group relative h-11 w-[11.5rem] flex items-center justify-end pr-5',
                            {
                                'is-open': isGroupOpen(group.id),
                                'has-active-layer': getGroupActiveCount(group) > 0
                            }
                        ]"
                    >
                        <div
                            :class="[
                                'absolute inset-0 transform skew-x-[-20deg] border-r-[4px] transition-colors duration-200',
                                isGroupOpen(group.id)
                                    ? 'bg-gradient-to-l from-[#1e4468]/94 to-[#10203a]/98 border-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.2)]'
                                    : getGroupActiveCount(group) > 0
                                        ? 'bg-gradient-to-l from-[#12243b]/90 to-[#0b1322]/96 border-cyan-600'
                                        : 'bg-[#0c1424]/96 border-[#17324b]'
                            ]"
                        ></div>

                        <div class="relative z-10 flex w-full items-center justify-between pl-6">
                            <span :class="[
                                'truncate text-[15px] font-semibold tracking-[0.08em]',
                                isGroupOpen(group.id)
                                    ? 'text-white'
                                    : getGroupActiveCount(group) > 0
                                        ? 'text-cyan-100'
                                        : 'text-cyan-200/82'
                            ]">
                                {{ group.label }}
                            </span>
                            <span class="flex items-center gap-2">
                                <span
                                    v-if="getGroupActiveCount(group)"
                                    class="rounded-sm border border-cyan-500/25 bg-cyan-950/45 px-1 py-0.5 text-[9px] font-mono text-cyan-100/90"
                                >
                                    {{ getGroupActiveCount(group) }}
                                </span>
                                <span
                                    :class="[
                                        'text-[11px] font-bold transition-transform duration-200',
                                        isGroupOpen(group.id) ? 'rotate-90 text-cyan-200' : 'text-cyan-400/80'
                                    ]"
                                >
                                    ◆
                                </span>
                            </span>
                        </div>
                    </button>

                    <div
                        v-if="isGroupOpen(group.id)"
                        class="flex w-full flex-col items-end gap-2"
                    >
                        <button
                            v-for="layer in group.subLayers || []"
                            :key="layer.id"
                            @click="handleLayerToggle(group.id, layer)"
                            :class="[
                                'sub-layer-btn group relative h-9 w-[10.25rem] flex items-center justify-end pr-4',
                                layer.active ? 'is-active' : ''
                            ]"
                        >
                            <div
                                :class="[
                                    'absolute inset-0 transform skew-x-[-20deg] border-r-[3px] transition-colors duration-200',
                                    layer.active
                                        ? 'bg-gradient-to-l from-[#11243a]/95 to-[#09111e]/98 border-cyan-300'
                                        : 'bg-[#09111e]/98 border-[#102332]'
                                ]"
                            ></div>

                            <div class="relative z-10 flex w-full items-center justify-between pl-5">
                                <span :class="[
                                    'truncate text-[13px] font-medium tracking-[0.04em]',
                                    layer.active ? 'text-white' : 'text-cyan-200/78'
                                ]">
                                    {{ layer.label }}
                                </span>
                                <span class="flex items-center gap-2">
                                    <span
                                        v-if="layer.hasTimeline"
                                        :class="[
                                            'rounded-sm border px-1 py-0.5 text-[8px] font-mono',
                                            layer.active
                                                ? 'border-cyan-300/35 bg-cyan-950/55 text-cyan-50'
                                                : 'border-cyan-500/15 bg-cyan-950/35 text-cyan-200/65'
                                        ]"
                                    >
                                        TIME
                                    </span>
                                    <span :class="['h-1.5 w-1.5 rotate-45', layer.active ? 'bg-cyan-200 shadow-[0_0_6px_rgba(103,232,249,0.7)]' : 'bg-cyan-700/85']"></span>
                                </span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        </div>
    </div>
</template>

<script>
import { computed, ref, watch } from 'vue';
import { TAB_TOOLS_MAPPING } from '../constants.js';

export default {
    props: {
        activePanels: {
            type: Object,
            default: () => ({})
        },
        currentTab: {
            type: String,
            default: '矿区总览'
        },
        weatherLayerGroups: {
            type: Array,
            default: () => []
        },
        collapsed: {
            type: Boolean,
            default: true
        }
    },
    emits: [
        'toggleMapTools',
        'toggleQuery',
        'toggleLayers',
        'toggleWeatherLayers',
        'toggleShipSearch',
        'togglePipeSelection',
        'toggleRoutePlan',
        'toggleAreaMonitor',
        'toggleMiningWeatherMonitor',
        'toggleMiningScience',
        'toggleRouteDemo',
        'toggleHistoricalTyphoon',
        'toggleHistoricalSeaState',
        'togglePipelineWarning',
        'toggleMonitoringEvents',
        'toggleForecastRegion',
        'toggleForecastCenter',
        'toggleWeatherWarnings',
        'toggleBuoyMonitoring',
        'layerToggle',
        'collapseChange'
    ],
    setup(props, { emit }) {
        const currentTools = computed(() => TAB_TOOLS_MAPPING[props.currentTab] || []);
        const expandedGroupIds = ref(new Set());
        const isHandleHovered = ref(false);
        const DEFAULT_OPEN_GROUP = 'basic_weather';

        const setCollapsed = (value) => {
            emit('collapseChange', value);
        };

        const visibleWeatherGroups = computed(() => (
            props.weatherLayerGroups.filter(group => (group.subLayers || []).length > 0)
        ));

        const getGroupActiveCount = (group) => (
            (group.subLayers || []).filter(layer => layer.active).length
        );

        const ensureExpandedGroups = () => {
            if (!visibleWeatherGroups.value.length) {
                expandedGroupIds.value = new Set();
                return;
            }

            const activeGroupIds = visibleWeatherGroups.value
                .filter(group => getGroupActiveCount(group) > 0)
                .map(group => group.id);

            const nextExpanded = new Set(expandedGroupIds.value);
            activeGroupIds.forEach(groupId => nextExpanded.add(groupId));

            const defaultGroup = visibleWeatherGroups.value.find(group => group.id === DEFAULT_OPEN_GROUP)?.id
                || visibleWeatherGroups.value[0]?.id;

            if (!nextExpanded.size && defaultGroup) {
                nextExpanded.add(defaultGroup);
            }

            expandedGroupIds.value = new Set(
                [...nextExpanded].filter(groupId => visibleWeatherGroups.value.some(group => group.id === groupId))
            );
        };

        const handleToggle = (tool) => {
            if (tool === '地图工具') {
                emit('toggleMapTools');
                return;
            }

            if (props.currentTab === '矿区总览') {
                if (tool === '矿区查询') {
                    emit('toggleQuery');
                } else if (tool === '图层控制') {
                    emit('toggleLayers');
                } else if (tool === '矿区气象') {
                    emit('toggleMiningWeatherMonitor');
                } else if (tool === '矿区科普') {
                    emit('toggleMiningScience');
                }
                return;
            }

            if (props.currentTab === '环境监测') {
                if (tool === '浮标监测') {
                    emit('toggleBuoyMonitoring');
                    return;
                }
                if (tool === '气象图层') {
                    emit('toggleWeatherLayers');
                }
                return;
            }

            if (props.currentTab === '预报中心') {
                if (tool === '常规预报') {
                    emit('toggleForecastCenter');
                    return;
                }
                if (tool === '区域预报') {
                    emit('toggleForecastRegion');
                }
                return;
            }

            if (props.currentTab === '采矿系统') {
                if (tool === '管道选型' || tool === '提升管道安全作业评估' || tool === '管道评估') {
                    emit('togglePipeSelection');
                } else if (tool === '船舶搜索') {
                    emit('toggleShipSearch');
                } else if (tool === '航线规划') {
                    emit('toggleRoutePlan');
                } else if (tool === '区域监控') {
                    emit('toggleAreaMonitor');
                } else if (tool === '航线动态') {
                    emit('toggleRouteDemo');
                }
                return;
            }

            if (props.currentTab === '预警中心') {
                if (tool === '气象预警') {
                    emit('toggleWeatherWarnings');
                    return;
                }
                if (tool === '监控事件') {
                    emit('toggleMonitoringEvents');
                }
                return;
            }

            if (props.currentTab === '历史数据') {
                if (tool === '历史台风') {
                    emit('toggleHistoricalTyphoon');
                } else if (tool === '历史海况') {
                    emit('toggleHistoricalSeaState');
                }
                return;
            }

            console.log(`🚧 "${tool}" 功能开发中...`);
        };

        const isActive = (tool) => {
            if (tool === '地图工具') return props.activePanels.mapTools;

            if (props.currentTab === '矿区总览') {
                if (tool === '矿区查询') return props.activePanels.query;
                if (tool === '图层控制') return props.activePanels.layers;
                if (tool === '矿区气象') return props.activePanels.miningWeatherMonitor;
                if (tool === '矿区科普') return props.activePanels.miningScience;
            }

            if (props.currentTab === '环境监测') {
                if (tool === '浮标监测') return props.activePanels.buoyMonitoring;
                if (tool === '气象图层') return props.activePanels.weatherLayers;
            }

            if (props.currentTab === '预报中心') {
                if (tool === '常规预报') return props.activePanels.forecastCenter;
                if (tool === '区域预报') return props.activePanels.forecastRegion;
            }

            if (props.currentTab === '采矿系统') {
                if (tool === '管道选型' || tool === '提升管道安全作业评估' || tool === '管道评估') return props.activePanels.pipeSelection;
                if (tool === '船舶搜索') return props.activePanels.shipSearch;
                if (tool === '航线规划') return props.activePanels.routePlan;
                if (tool === '区域监控') return props.activePanels.areaMonitor;
                if (tool === '航线动态') return props.activePanels.routeDemo;
            }

            if (props.currentTab === '预警中心') {
                if (tool === '气象预警') return props.activePanels.weatherWarnings;
                if (tool === '监控事件') return props.activePanels.monitoringEvents;
            }

            if (props.currentTab === '历史数据') {
                if (tool === '历史台风') return props.activePanels.historyTyphoon;
                if (tool === '历史海况') return props.activePanels.historySeaState;
            }

            return false;
        };

        const handleLayerToggle = (groupId, layer) => {
            emit('layerToggle', {
                groupId,
                layerId: layer.id,
                active: !layer.active
            });
        };

        const isGroupOpen = (groupId) => expandedGroupIds.value.has(groupId);

        const toggleGroup = (groupId) => {
            const nextExpanded = new Set(expandedGroupIds.value);
            if (nextExpanded.has(groupId)) {
                nextExpanded.delete(groupId);
            } else {
                nextExpanded.add(groupId);
            }
            expandedGroupIds.value = nextExpanded;
        };

        watch(
            () => [
                props.currentTab,
                props.activePanels.weatherLayers,
                visibleWeatherGroups.value.map(group => `${group.id}:${getGroupActiveCount(group)}`).join('|')
            ],
            ([tab, isOpen]) => {
                if (tab === '环境监测' && isOpen) {
                    ensureExpandedGroups();
                }
            },
            { immediate: true }
        );

        return {
            currentTools,
            visibleWeatherGroups,
            handleToggle,
            isActive,
            handleLayerToggle,
            getGroupActiveCount,
            isGroupOpen,
            toggleGroup,
            setCollapsed,
            isHandleHovered
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

.group-panel-btn:hover,
.sub-layer-btn:hover {
    box-shadow: none !important;
}

.group-panel-btn.is-open,
.group-panel-btn.has-active-layer {
    transform: translateX(-4px);
}

.group-panel-btn.is-open {
    filter: drop-shadow(0 0 10px rgba(34, 211, 238, 0.22));
}

.group-panel-btn.is-open:hover,
.group-panel-btn.has-active-layer:hover {
    transform: translateX(-4px) !important;
}

.group-panel-btn.is-open:hover {
    filter: drop-shadow(0 0 10px rgba(34, 211, 238, 0.22));
}

.sub-layer-btn.is-active {
    transform: translateX(-2px);
}

.sub-layer-btn.is-active:hover {
    transform: translateX(-2px) !important;
}
</style>
