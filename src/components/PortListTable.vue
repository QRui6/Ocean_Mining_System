<template>
    <div class="absolute bottom-2 left-[31rem] right-8 h-[20rem] z-30 animate-slideUp flex flex-col">
        <!-- Top Decor -->
        <div class="h-3 w-full bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
        
        <div class="flex-1 relative overflow-hidden flex flex-col"
             style="background: linear-gradient(to right, rgba(30, 58, 138, 0.2), rgba(30, 58, 138, 0.25), rgba(30, 58, 138, 0.2)); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-top: 2px solid rgba(59, 130, 246, 0.3);">
            
            <!-- 发光边框效果 -->
            <div class="absolute inset-0 pointer-events-none">
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-70"></div>
                <div class="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-70"></div>
            </div>
            
            <!-- Header -->
            <div class="h-14 flex items-center justify-between px-8 border-b border-blue-500/20 bg-gradient-to-r from-blue-900/30 to-transparent relative z-10">
                  <div class="flex items-center gap-4">
                      <div class="w-1.5 h-6 bg-blue-400 shadow-[0_0_10px_#60a5fa]"></div>
                      <h3 class="text-2xl font-bold text-blue-50 tracking-wider font-['Noto_Sans_SC']">主要港口列表</h3>
                      <span class="text-sm text-blue-500/60 font-['Orbitron'] mt-1 ml-3 tracking-widest">共 {{ portData.length }} 个</span>
                  </div>
                  
                  <!-- Tools -->
                  <div class="flex gap-6 text-blue-400 text-base font-bold">
                      <button @click="$emit('toggleStatistics')" class="hover:text-white hover:underline decoration-2 underline-offset-4 flex items-center gap-1">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                          </svg>
                          统计
                      </button>
                      <button @click="resetSelection" class="hover:text-white hover:underline decoration-2 underline-offset-4">重置选择</button>
                  </div>
            </div>

            <!-- Table -->
            <div class="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar px-4 py-2 min-h-0">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-blue-900/20 text-blue-200 text-sm sticky top-0 backdrop-blur-md z-10">
                        <tr>
                            <th v-for="h in ['序号', '港口名称', '国家', '区域', '重要性', '类型', '坐标']" :key="h" 
                                class="px-3 py-2 font-bold tracking-wider border-b-2 border-blue-500/30 whitespace-nowrap"
                            >
                                {{ h }}
                            </th>
                        </tr>
                    </thead>
                    <tbody class="text-slate-300 text-sm font-['Rajdhani']">
                        <tr v-if="portData.length === 0">
                            <td colspan="7" class="px-3 py-6 text-center text-slate-500">
                                暂无数据
                            </td>
                        </tr>
                        <tr v-for="(item, index) in portData" :key="item.id" 
                            :class="[
                                'border-b border-slate-800 hover:bg-blue-500/10 transition-colors group cursor-pointer',
                                selectedPortId === item.id ? 'bg-blue-500/20' : ''
                            ]"
                            @click="onRowClick(item)"
                        >
                            <td class="px-3 py-2 text-blue-500 font-bold">{{ index + 1 }}</td>
                            <td class="px-3 py-2 font-['Noto_Sans_SC'] text-white group-hover:text-blue-300 transition-colors font-bold">
                                <div class="flex items-center gap-2">
                                    <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: item.color }"></div>
                                    <span>{{ item.name }}</span>
                                    <span class="text-xs text-slate-400">({{ item.nameEn }})</span>
                                </div>
                            </td>
                            <td class="px-3 py-2 opacity-80 text-xs font-['Noto_Sans_SC']">{{ item.country }}</td>
                            <td class="px-3 py-2 opacity-80 text-xs font-['Noto_Sans_SC']">{{ item.region }}</td>
                            <td class="px-3 py-2 font-['Noto_Sans_SC']">
                                <span :class="getImportanceClass(item.importance)">
                                    {{ getImportanceLabel(item.importance) }}
                                </span>
                            </td>
                            <td class="px-3 py-2 opacity-80 text-xs font-['Noto_Sans_SC']">{{ getTypeLabel(item.type) }}</td>
                            <td class="px-3 py-2 font-mono text-yellow-400/90 font-bold text-xs">
                                {{ formatCoordinates(item.coordinates) }}
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

export default {
    props: {
        portData: {
            type: Array,
            default: () => []
        }
    },
    emits: ['rowClick', 'resetSelection', 'toggleStatistics'],
    setup(props, { emit }) {
        const selectedPortId = ref(null);

        // 格式化坐标
        const formatCoordinates = (coords) => {
            if (!coords || coords.length !== 2) return '-';
            return `${coords[0].toFixed(2)}°, ${coords[1].toFixed(2)}°`;
        };

        // 获取重要性标签
        const getImportanceLabel = (importance) => {
            const labels = {
                high: '高',
                medium: '中',
                low: '低'
            };
            return labels[importance] || importance;
        };

        // 获取重要性样式类
        const getImportanceClass = (importance) => {
            if (importance === 'high') return 'text-green-400 text-xs font-bold';
            if (importance === 'medium') return 'text-yellow-400 text-xs';
            return 'text-orange-400 text-xs';
        };

        // 获取类型标签
        const getTypeLabel = (type) => {
            const labels = {
                historical: '历史',
                modern: '现代',
                strategic: '战略'
            };
            return labels[type] || type;
        };

        // 行点击事件
        const onRowClick = (item) => {
            selectedPortId.value = item.id;
            emit('rowClick', item);
        };

        // 重置选择
        const resetSelection = () => {
            selectedPortId.value = null;
            emit('resetSelection');
        };

        return {
            selectedPortId,
            formatCoordinates,
            getImportanceLabel,
            getImportanceClass,
            getTypeLabel,
            onRowClick,
            resetSelection
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
    background: rgba(15, 23, 42, 0.5);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.3);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(59, 130, 246, 0.5);
}

/* 动画 */
@keyframes slideUp {
    from {
        transform: translateY(100%);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.animate-slideUp {
    animation: slideUp 0.3s ease-out;
}
</style>
