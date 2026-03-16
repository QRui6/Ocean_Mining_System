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
                        研究机构列表
                    </h3>
                    <span class="text-blue-300 text-sm">共 {{ institutionData.length }} 个</span>
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
                            <th class="py-3 px-4 text-left font-bold border-b border-blue-500/30">机构名称</th>
                            <th class="py-3 px-4 text-left font-bold border-b border-blue-500/30">国家</th>
                            <th class="py-3 px-4 text-left font-bold border-b border-blue-500/30">成立时间</th>
                            <th class="py-3 px-4 text-left font-bold border-b border-blue-500/30">所在城市</th>
                            <th class="py-3 px-4 text-center font-bold border-b border-blue-500/30">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(inst, index) in institutionData" 
                            :key="inst.id"
                            @click="handleRowClick(inst)"
                            class="hover:bg-blue-600/20 cursor-pointer transition-all duration-200 border-b border-blue-500/10 relative"
                            :class="{ 'bg-blue-600/30': selectedId === inst.id }"
                            :style="{ 
                                borderLeft: `4px solid ${getCountryColor(inst.countryId)}`,
                                background: selectedId === inst.id ? `linear-gradient(to right, ${getCountryColor(inst.countryId)}20, transparent)` : ''
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
                                {{ inst.name }}
                                <span v-if="inst.isRegional" class="ml-2 text-xs opacity-60">(区域)</span>
                            </td>
                            <td class="py-3 px-4">
                                <span class="px-2 py-1 rounded font-bold"
                                      :style="{ 
                                          backgroundColor: getCountryColor(inst.countryId) + '40', 
                                          color: '#ffffff !important',
                                          border: `1px solid ${getCountryColor(inst.countryId)}80`,
                                          fontSize: '0.75rem'
                                      }">
                                    {{ inst.country }}
                                </span>
                            </td>
                            <td class="py-3 px-4 text-sm"
                                :style="{ 
                                    color: '#ffffff !important',
                                    textShadow: '0 0 10px rgba(0, 0, 0, 0.8)'
                                }">
                                {{ inst.founded || '-' }}
                            </td>
                            <td class="py-3 px-4 text-sm"
                                :style="{ 
                                    color: '#ffffff !important',
                                    textShadow: '0 0 10px rgba(0, 0, 0, 0.8)'
                                }">
                                {{ inst.city || '-' }}
                            </td>
                            <td class="py-3 px-4 text-center">
                                <button @click.stop="handleLocate(inst)"
                                        class="px-2 py-1 rounded transition-all duration-200 text-xs"
                                        :style="{ 
                                            backgroundColor: getCountryColor(inst.countryId) + '40',
                                            color: '#ffffff !important',
                                            border: `1px solid ${getCountryColor(inst.countryId)}80`
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
import { ref, watch } from 'vue';

export default {
    name: 'ResearchInstitutionListTable',
    props: {
        institutionData: {
            type: Array,
            default: () => []
        }
    },
    emits: ['rowClick', 'resetSelection', 'toggleStatistics'],
    setup(props, { emit }) {
        const selectedId = ref(null);
        
        // 监听数据变化
        watch(() => props.institutionData, (newData) => {
            console.log('🏛️ ResearchInstitutionListTable - institutionData 变化:', newData);
            console.log('🏛️ ResearchInstitutionListTable - 数据长度:', newData?.length);
        }, { immediate: true });

        const getCountryColor = (countryId) => {
            const colorMap = {
                'usa': '#0052B4',
                'uk': '#C8102E',
                'france': '#0055A4',
                'germany': '#FFCE00',
                'canada': '#FF0000',
                'australia': '#00008B',
                'russia': '#0039A6',
                'japan': '#BC002D'
            };
            return colorMap[countryId] || '#fb923c';
        };

        const handleRowClick = (institution) => {
            selectedId.value = institution.id;
            emit('rowClick', institution);
        };

        const handleLocate = (institution) => {
            emit('rowClick', institution);
        };

        const handleReset = () => {
            selectedId.value = null;
            emit('resetSelection');
        };

        return {
            selectedId,
            getCountryColor,
            handleRowClick,
            handleLocate,
            handleReset
        };
    }
};
</script>

<style scoped>
/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(30, 58, 138, 0.5);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.3);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(59, 130, 246, 0.5);
}
</style>
