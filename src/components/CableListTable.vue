<template>
    <div class="absolute bottom-2 left-[31rem] right-8 h-[25rem] z-30 animate-slideUp flex flex-col">
        <!-- Top Decor -->
        <div class="h-3 w-full bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
        
        <div class="flex-1 bg-slate-950/95 backdrop-blur-lg border-t-2 border-cyan-500/30 flex flex-col relative overflow-hidden">
            <!-- Header -->
            <div class="h-14 flex items-center justify-between px-8 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-900/30 to-transparent">
                  <div class="flex items-center gap-4">
                      <div class="w-1.5 h-6 bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>
                      <h3 class="text-2xl font-bold text-cyan-50 tracking-wider font-['Noto_Sans_SC']">海底光缆列表</h3>
                      <span class="text-sm text-cyan-500/60 font-['Orbitron'] mt-1 ml-3 tracking-widest">共 {{ totalCount }} 条</span>
                  </div>
                  
                  <!-- Tools -->
                  <div class="flex gap-6 text-cyan-400 text-base font-bold">
                      <button @click="$emit('toggleStatistics')" class="hover:text-white hover:underline decoration-2 underline-offset-4 flex items-center gap-1">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                          </svg>
                          统计
                      </button>
                      <button @click="refreshData" class="hover:text-white hover:underline decoration-2 underline-offset-4">刷新列表</button>
                  </div>
            </div>

            <!-- Table -->
            <div class="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar px-4 py-2 min-h-0">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-cyan-900/20 text-cyan-200 text-sm sticky top-0 backdrop-blur-md z-10">
                        <tr>
                            <th v-for="h in ['序号', '光缆名称', '容量(Gbps)', '长度(km)', '投入使用', '状态']" :key="h" 
                                class="px-3 py-2 font-bold tracking-wider border-b-2 border-cyan-500/30 whitespace-nowrap"
                            >
                                {{ h }}
                            </th>
                        </tr>
                    </thead>
                    <tbody class="text-slate-300 text-sm font-['Rajdhani']">
                        <tr v-if="paginatedData.length === 0">
                            <td colspan="6" class="px-3 py-6 text-center text-slate-500">
                                暂无数据
                            </td>
                        </tr>
                        <tr v-for="(item, index) in paginatedData" :key="item.id" 
                            class="border-b border-slate-800 hover:bg-cyan-500/10 transition-colors group cursor-pointer"
                            @click="onRowClick(item)"
                        >
                            <td class="px-3 py-2 text-cyan-500 font-bold">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                            <td class="px-3 py-2 font-['Noto_Sans_SC'] text-white group-hover:text-cyan-300 transition-colors font-bold">{{ item.name }}</td>
                            <td class="px-3 py-2 font-mono text-cyan-400 text-xs">{{ item.capacity || 'N/A' }}</td>
                            <td class="px-3 py-2 font-mono text-yellow-400/90 font-bold text-xs">{{ formatDistance(item.distance) }}</td>
                            <td class="px-3 py-2 opacity-80 text-xs">{{ item.inService || 'N/A' }}</td>
                            <td class="px-3 py-2 font-['Noto_Sans_SC']">
                                <span :class="item.notLive === 1 ? 'text-gray-400' : 'text-green-400'">
                                    {{ item.notLive === 1 ? '未启用' : '运营中' }}
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div class="h-14 flex-shrink-0 flex items-center justify-between px-6 border-t border-cyan-500/20 bg-slate-900/80">
                <div class="text-sm text-slate-400">
                    显示 {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, totalCount) }} 条，共 {{ totalCount }} 条
                </div>
                <div class="flex items-center gap-2">
                    <button 
                        @click="prevPage"
                        :disabled="currentPage === 1"
                        :class="[
                            'px-3 py-1 rounded text-sm font-bold transition-all',
                            currentPage === 1 
                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                                : 'bg-cyan-700 text-white hover:bg-cyan-600'
                        ]"
                    >
                        上一页
                    </button>
                    
                    <div class="flex items-center gap-1">
                        <button 
                            v-for="page in visiblePages" 
                            :key="page"
                            @click="goToPage(page)"
                            :class="[
                                'w-8 h-8 rounded text-sm font-bold transition-all',
                                currentPage === page 
                                    ? 'bg-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]' 
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            ]"
                        >
                            {{ page }}
                        </button>
                    </div>
                    
                    <button 
                        @click="nextPage"
                        :disabled="currentPage === totalPages"
                        :class="[
                            'px-3 py-1 rounded text-sm font-bold transition-all',
                            currentPage === totalPages 
                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                                : 'bg-cyan-700 text-white hover:bg-cyan-600'
                        ]"
                    >
                        下一页
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, computed, watch } from 'vue';

export default {
    props: {
        cableData: {
            type: Array,
            default: () => []
        }
    },
    emits: ['rowClick', 'toggleStatistics'],
    setup(props, { emit }) {
        const currentPage = ref(1);
        const pageSize = ref(10);

        // 总数据量
        const totalCount = computed(() => props.cableData.length);

        // 总页数
        const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value));

        // 当前页数据
        const paginatedData = computed(() => {
            const start = (currentPage.value - 1) * pageSize.value;
            const end = start + pageSize.value;
            return props.cableData.slice(start, end);
        });

        // 可见页码
        const visiblePages = computed(() => {
            const pages = [];
            const total = totalPages.value;
            const current = currentPage.value;
            
            if (total <= 7) {
                for (let i = 1; i <= total; i++) {
                    pages.push(i);
                }
            } else {
                if (current <= 4) {
                    for (let i = 1; i <= 5; i++) pages.push(i);
                    pages.push('...');
                    pages.push(total);
                } else if (current >= total - 3) {
                    pages.push(1);
                    pages.push('...');
                    for (let i = total - 4; i <= total; i++) pages.push(i);
                } else {
                    pages.push(1);
                    pages.push('...');
                    for (let i = current - 1; i <= current + 1; i++) pages.push(i);
                    pages.push('...');
                    pages.push(total);
                }
            }
            
            return pages;
        });

        // 上一页
        const prevPage = () => {
            if (currentPage.value > 1) {
                currentPage.value--;
            }
        };

        // 下一页
        const nextPage = () => {
            if (currentPage.value < totalPages.value) {
                currentPage.value++;
            }
        };

        // 跳转到指定页
        const goToPage = (page) => {
            if (page !== '...' && page >= 1 && page <= totalPages.value) {
                currentPage.value = page;
            }
        };

        // 格式化距离
        const formatDistance = (distance) => {
            if (!distance) return '-';
            return `${distance.toLocaleString()}`;
        };

        // 刷新数据
        const refreshData = () => {
            currentPage.value = 1;
            emit('refresh');
        };

        // 行点击事件
        const onRowClick = (item) => {
            emit('rowClick', item);
        };

        // 监听数据变化，重置到第一页
        watch(() => props.cableData, () => {
            currentPage.value = 1;
        });

        return {
            currentPage,
            pageSize,
            totalCount,
            totalPages,
            paginatedData,
            visiblePages,
            prevPage,
            nextPage,
            goToPage,
            formatDistance,
            refreshData,
            onRowClick
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
    background: rgba(6, 182, 212, 0.3);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(6, 182, 212, 0.5);
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
