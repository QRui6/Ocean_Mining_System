<template>
    <div class="absolute bottom-2 left-[31rem] right-8 h-[25rem] z-30 animate-slideUp flex flex-col">
        <!-- Top Decor -->
        <div class="h-3 w-full bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
        
        <div class="flex-1 relative overflow-hidden flex flex-col"
             style="background: linear-gradient(to right, rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.85)); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-top: 1px solid rgba(6, 182, 212, 0.3); border-radius: 4px;">
            
            <!-- Header -->
            <div class="h-14 flex items-center justify-between px-8 border-b border-cyan-500/30 bg-slate-900/60 relative z-10">
                  <div class="flex items-center gap-4">
                      <div class="w-1.5 h-6 bg-cyan-400"></div>
                      <h3 class="text-xl font-bold text-cyan-50 tracking-wider font-['Noto_Sans_SC']">破冰船列表</h3>
                      <span class="text-base text-cyan-500/80 font-['Orbitron'] mt-1 ml-3 tracking-widest">共 {{ totalCount }} 条</span>
                  </div>
                  
                  <!-- Tools -->
                  <div class="flex gap-6 text-cyan-400 text-base font-bold">
                      <button @click="$emit('close')" class="hover:text-white hover:underline decoration-2 underline-offset-4">关闭列表</button>
                  </div>
            </div>

            <!-- Table -->
            <div class="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar px-4 py-2 min-h-0">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-slate-800/50 text-cyan-200 text-base sticky top-0 backdrop-blur-md z-10">
                        <tr>
                            <th v-for="h in ['序号', '名称', '国家', '规格', '研制时间']" :key="h" 
                                class="px-4 py-3 font-bold tracking-wider border-b border-slate-700 whitespace-nowrap"
                            >
                                {{ h }}
                            </th>
                        </tr>
                    </thead>
                    <tbody class="text-slate-200 text-base">
                        <tr v-if="paginatedData.length === 0">
                            <td colspan="5" class="px-4 py-8 text-center text-slate-500 text-base">
                                暂无数据
                            </td>
                        </tr>
                        <tr v-for="(item, index) in paginatedData" :key="index" 
                            class="border-b border-slate-800/50 hover:bg-slate-800/60 transition-colors group cursor-pointer"
                            @click="onRowClick(item)"
                        >
                            <td class="px-4 py-3 text-cyan-500 font-bold">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                            <td class="px-4 py-3 font-['Noto_Sans_SC'] text-white group-hover:text-cyan-300 transition-colors font-bold">{{ item.name }}</td>
                            <td class="px-4 py-3 font-['Noto_Sans_SC']" :class="getCountryColor(item.country)">{{ item.country || '-' }}</td>
                            <td class="px-4 py-3 font-['Noto_Sans_SC'] text-slate-400 max-w-md truncate" :title="item.specifications">{{ item.specifications || '-' }}</td>
                            <td class="px-4 py-3 font-mono text-slate-400">{{ item.year || '-' }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div class="h-14 flex-shrink-0 flex items-center justify-between px-6 border-t border-slate-800 bg-slate-900/90">
                <div class="text-base text-slate-400">
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
    name: 'IcebreakerListTable',
    props: {
        equipmentData: {
            type: Array,
            default: () => []
        }
    },
    emits: ['rowClick', 'close'],
    setup(props, { emit }) {
        const currentPage = ref(1);
        const pageSize = ref(10);

        // 总数据量
        const totalCount = computed(() => {
            return props.equipmentData.length;
        });

        // 总页数
        const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value) || 1);

        // 当前页数据
        const paginatedData = computed(() => {
            const start = (currentPage.value - 1) * pageSize.value;
            const end = start + pageSize.value;
            return props.equipmentData.slice(start, end);
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

        // 行点击事件
        const onRowClick = (item) => {
            emit('rowClick', item);
        };

        // 监听数据变化，重置到第一页
        watch(() => props.equipmentData, () => {
            currentPage.value = 1;
        });

        // 获取国家颜色
        const getCountryColor = (countryStr) => {
            if (!countryStr) return 'text-slate-300';
            if (countryStr.includes('俄罗斯')) return '!text-yellow-400 !font-bold';
            if (countryStr.includes('美国')) return '!text-blue-400 !font-bold';
            if (countryStr.includes('中国')) return '!text-red-400 !font-bold';
            return 'text-slate-300';
        };

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
            onRowClick,
            getCountryColor
        };
    }
}
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