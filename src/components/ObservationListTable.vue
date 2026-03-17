<template>
    <div class="absolute bottom-2 left-[31rem] right-8 h-[25rem] z-30 pointer-events-auto font-['Noto_Sans_SC']">
        <!-- 主容器 -->
        <div class="relative h-full overflow-hidden"
             style="clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px)); background: linear-gradient(to right, rgba(30, 58, 138, 0.2), rgba(30, 58, 138, 0.25), rgba(30, 58, 138, 0.2)); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 2px solid rgba(59, 130, 246, 0.3); box-shadow: 0 0 40px rgba(59, 130, 246, 0.2);">
            
            <!-- 发光边框效果 -->
            <div class="absolute inset-0 pointer-events-none">
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-70"></div>
                <div class="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-70"></div>
            </div>
            
            <!-- 标题栏 -->
            <div class="relative flex items-center justify-between px-5 py-3 border-b border-blue-500/30"
                 style="background: rgba(59, 130, 246, 0.08);">
                <div class="flex items-center gap-3">
                    <div class="w-1 h-6 bg-gradient-to-b from-blue-400 to-blue-600 shadow-lg shadow-blue-500/50"></div>
                    <h3 class="text-lg font-bold text-white tracking-wider" style="text-shadow: 0 0 10px rgba(59, 130, 246, 0.5);">
                        海底观测网列表
                    </h3>
                    <span class="text-blue-300 text-sm">共 {{ observationData.length }} 个</span>
                </div>
                <div class="flex items-center gap-2">
                    <button @click="$emit('toggleStatistics')" 
                            class="px-3 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 hover:text-white rounded transition-all duration-300 text-sm flex items-center gap-1 border border-blue-500/30">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                        统计
                    </button>
                    <button @click="handleReset" 
                            class="px-3 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 hover:text-white rounded transition-all duration-300 text-sm">
                        重置
                    </button>
                </div>
            </div>

            <!-- 表格内容 -->
            <div class="h-[calc(100%-4rem)] overflow-y-auto custom-scrollbar">
                <table class="w-full">
                    <thead class="sticky top-0 z-10" style="background: rgba(59, 130, 246, 0.15);">
                        <tr class="text-blue-300 text-sm">
                            <th class="py-3 px-4 text-left font-bold border-b border-blue-500/30">序号</th>
                            <th class="py-3 px-4 text-left font-bold border-b border-blue-500/30">观测网名称</th>
                            <th class="py-3 px-4 text-left font-bold border-b border-blue-500/30">国家/地区</th>
                            <th class="py-3 px-4 text-left font-bold border-b border-blue-500/30">所属单位</th>
                            <th class="py-3 px-4 text-center font-bold border-b border-blue-500/30">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(obs, index) in observationData" 
                            :key="obs.id"
                            @click="handleRowClick(obs)"
                            class="hover:bg-blue-600/20 cursor-pointer transition-all duration-200 border-b border-blue-500/10 relative"
                            :class="{ 'bg-blue-600/30': selectedId === obs.id }"
                            :style="{ 
                                borderLeft: `4px solid ${getCountryColor(obs.country)}`,
                                background: selectedId === obs.id ? `linear-gradient(to right, ${getCountryColor(obs.country)}20, transparent)` : ''
                            }">
                            <td class="py-3 px-4 font-bold" 
                                :style="{ 
                                    color: '#ffffff !important',
                                    textShadow: '0 0 10px rgba(0, 0, 0, 0.8)',
                                    fontSize: '0.875rem'
                                }">
                                {{ index + 1 }}
                            </td>
                            <td class="py-3 px-4 font-medium"
                                :style="{ 
                                    color: '#ffffff !important',
                                    textShadow: '0 0 10px rgba(0, 0, 0, 0.8)',
                                    fontSize: '0.875rem'
                                }">
                                {{ obs.name }}
                            </td>
                            <td class="py-3 px-4">
                                <span class="px-2 py-1 rounded font-bold"
                                      :style="{ 
                                          backgroundColor: getCountryColor(obs.country) + '40', 
                                          color: '#ffffff !important',
                                          border: `1px solid ${getCountryColor(obs.country)}80`,
                                          fontSize: '0.75rem'
                                      }">
                                    {{ obs.country }}
                                </span>
                            </td>
                            <td class="py-3 px-4"
                                :style="{ 
                                    color: '#ffffff !important',
                                    textShadow: '0 0 10px rgba(0, 0, 0, 0.8)',
                                    fontSize: '0.875rem'
                                }">
                                {{ obs.unit || '-' }}
                            </td>
                            <td class="py-3 px-4 text-center">
                                <button @click.stop="handleLocate(obs)"
                                        class="px-2 py-1 rounded transition-all duration-200"
                                        :style="{ 
                                            backgroundColor: getCountryColor(obs.country) + '40',
                                            color: '#ffffff !important',
                                            border: `1px solid ${getCountryColor(obs.country)}80`,
                                            fontSize: '0.75rem'
                                        }">
                                    定位
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script>
import { ref } from 'vue';
import { SEAFLOOR_OBSERVATION_COLORS } from '../constants.js';

export default {
    name: 'ObservationListTable',
    props: {
        observationData: {
            type: Array,
            default: () => []
        }
    },
    emits: ['rowClick', 'resetSelection', 'toggleStatistics'],
    setup(props, { emit }) {
        const selectedId = ref(null);

        const handleRowClick = (observation) => {
            selectedId.value = observation.id;
            emit('rowClick', observation);
        };

        const handleLocate = (observation) => {
            selectedId.value = observation.id;
            emit('rowClick', observation);
        };

        const handleReset = () => {
            selectedId.value = null;
            emit('resetSelection');
        };

        const getCountryColor = (country) => {
            return SEAFLOOR_OBSERVATION_COLORS[country] || '#3b82f6';
        };

        return {
            selectedId,
            handleRowClick,
            handleLocate,
            handleReset,
            getCountryColor
        };
    }
};
</script>

<style scoped>
/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
    width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(59, 130, 246, 0.1);
    border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.5);
    border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(59, 130, 246, 0.7);
}
</style>
