<template>
    <div class="absolute bottom-2 left-[31rem] right-8 h-[25rem] z-30 animate-slideUp flex flex-col">
        <!-- Top Decor -->
        <div class="h-3 w-full bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
        
        <div class="flex-1 bg-slate-950/95 backdrop-blur-lg border-t-2 border-cyan-500/30 flex flex-col relative overflow-hidden">
            <!-- Header -->
            <div class="h-14 flex items-center justify-between px-8 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-900/30 to-transparent">
                  <div class="flex items-center gap-4">
                      <div class="w-1.5 h-6 bg-yellow-400 shadow-[0_0_10px_#facc15]"></div>
                      <h3 class="text-2xl font-bold text-cyan-50 tracking-wider font-['Noto_Sans_SC']">船舶数据列表</h3>
                      <span class="text-sm text-cyan-500/60 font-['Orbitron'] mt-1 ml-3 tracking-widest">共 {{ totalCount }} 艘</span>
                  </div>
                  
                  <!-- Tools -->
                  <div class="flex gap-6 text-cyan-400 text-base font-bold">
                      <button @click="clearData" class="hover:text-white hover:underline decoration-2 underline-offset-4">清空列表</button>
                  </div>
            </div>

            <!-- Table -->
            <div class="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar px-4 py-2 min-h-0">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-cyan-900/20 text-cyan-200 text-sm sticky top-0 backdrop-blur-md z-10">
                        <tr>
                            <th v-for="h in ['序号', 'MMSI', '船舶名称', '船舶类型', '船长', '船宽', '航速', '载重', '目的港', '预计到达', '最后更新', '状态']" :key="h" 
                                class="px-3 py-2 font-bold tracking-wider border-b-2 border-cyan-500/30 whitespace-nowrap"
                            >
                                {{ h }}
                            </th>
                        </tr>
                    </thead>
                    <tbody class="text-slate-300 text-sm font-['Rajdhani']">
                        <tr v-if="paginatedData.length === 0">
                            <td colspan="12" class="px-3 py-6 text-center text-slate-500">
                                暂无数据，请先搜索船舶
                            </td>
                        </tr>
                        <tr v-for="(item, index) in paginatedData" :key="item.mmsi" 
                            class="border-b border-slate-800 hover:bg-cyan-500/10 transition-colors group cursor-pointer"
                            @click="onRowClick(item)"
                        >
                            <td class="px-3 py-2 text-cyan-500 font-bold">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                            <td class="px-3 py-2 font-mono text-cyan-400 text-xs">{{ item.mmsi }}</td>
                            <td class="px-3 py-2 font-['Noto_Sans_SC'] text-white group-hover:text-yellow-300 transition-colors font-bold">{{ item.ship_cnname || item.ship_name || '-' }}</td>
                            <td class="px-3 py-2 font-['Noto_Sans_SC']">{{ getShipTypeName(item.ship_type) }}</td>
                            <td class="px-3 py-2 font-mono">{{ item.length ? item.length + 'm' : 'N/A' }}</td>
                            <td class="px-3 py-2 font-mono">{{ item.width ? item.width + 'm' : 'N/A' }}</td>
                            <td class="px-3 py-2 font-mono text-yellow-400/90 font-bold">{{ item.sog ? item.sog + ' kn' : 'N/A' }}</td>
                            <td class="px-3 py-2 font-mono">{{ item.draught ? item.draught + 'm' : 'N/A' }}</td>
                            <td class="px-3 py-2 text-xs max-w-[120px] truncate" :title="item.dest">{{ item.dest || 'N/A' }}</td>
                            <td class="px-3 py-2 text-xs">
                                <div>{{ item.eta || 'N/A' }}</div>
                                <div v-if="isEtaExpired(item.eta, item.last_time)" class="text-orange-400 text-xs">⚠️ 已过期</div>
                            </td>
                            <td class="px-3 py-2 opacity-80 text-xs">{{ item.last_time || '-' }}</td>
                            <td class="px-3 py-2 text-xs">{{ getNavigationStatus(item.navistat) }}</td>
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
        shipData: {
            type: Array,
            default: () => []
        }
    },
    emits: ['rowClick', 'clear'],
    setup(props, { emit }) {
        const currentPage = ref(1);
        const pageSize = ref(10);

        const totalCount = computed(() => props.shipData.length);
        const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value));

        const paginatedData = computed(() => {
            const start = (currentPage.value - 1) * pageSize.value;
            const end = start + pageSize.value;
            return props.shipData.slice(start, end);
        });

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

        const prevPage = () => {
            if (currentPage.value > 1) {
                currentPage.value--;
            }
        };

        const nextPage = () => {
            if (currentPage.value < totalPages.value) {
                currentPage.value++;
            }
        };

        const goToPage = (page) => {
            if (page !== '...' && page >= 1 && page <= totalPages.value) {
                currentPage.value = page;
            }
        };

        const getShipTypeName = (shipType) => {
            if (!shipType) return '未知';
            
            const typeMap = {
                '0': '未知',
                '1': '保留',
                '20': '机翼船',
                '21': '危险品A类',
                '22': '危险品B类',
                '23': '危险品C类',
                '24': '危险品D类',
                '25': '保留',
                '26': '保留',
                '27': '保留',
                '28': '保留',
                '29': '保留',
                '30': '渔船',
                '31': '拖船',
                '32': '拖船',
                '33': '疏浚船',
                '34': '潜水作业',
                '35': '军事行动',
                '36': '帆船',
                '37': '游艇',
                '40': '高速船',
                '41': '引航船',
                '42': '搜救船',
                '43': '拖船',
                '44': '港口船',
                '45': '反污染船',
                '46': '执法船',
                '47': '备用',
                '48': '备用',
                '49': '其他',
                '50': '引航船',
                '51': '搜救船',
                '52': '拖船',
                '53': '港口船',
                '54': '反污染船',
                '55': '执法船',
                '56': '备用',
                '57': '备用',
                '58': '医疗船',
                '59': '非战斗船',
                '60': '客船',
                '61': '客船',
                '62': '客船',
                '63': '客船',
                '64': '客船',
                '65': '客船',
                '66': '客船',
                '67': '客船',
                '68': '客船',
                '69': '客船',
                '70': '货船',
                '71': '货船',
                '72': '货船',
                '73': '货船',
                '74': '货船',
                '75': '货船',
                '76': '货船',
                '77': '货船',
                '78': '货船',
                '79': '货船',
                '80': '油轮',
                '81': '油轮',
                '82': '油轮',
                '83': '油轮',
                '84': '油轮',
                '85': '油轮',
                '86': '油轮',
                '87': '油轮',
                '88': '油轮',
                '89': '油轮',
                '90': '其他',
                '91': '其他',
                '92': '其他',
                '93': '其他',
                '94': '其他',
                '95': '其他',
                '96': '其他',
                '97': '其他',
                '98': '其他',
                '99': '其他'
            };
            
            return typeMap[String(shipType)] || `类型${shipType}`;
        };

        const getNavigationStatus = (status) => {
            if (status === undefined || status === null) return '未知';
            
            const statusMap = {
                '0': '航行中',
                '1': '锚泊',
                '2': '失控',
                '3': '操纵受限',
                '4': '吃水受限',
                '5': '系泊',
                '6': '搁浅',
                '7': '捕鱼中',
                '8': '航行中',
                '9': '保留',
                '10': '保留',
                '11': '拖带',
                '12': '推顶',
                '13': '保留',
                '14': 'AIS-SART',
                '15': '未定义'
            };
            
            return statusMap[String(status)] || `状态${status}`;
        };

        const isEtaExpired = (eta, lastTime) => {
            if (!eta || !lastTime) return false;
            
            try {
                const etaDate = new Date(eta);
                const lastTimeDate = new Date(lastTime);
                const now = new Date();
                
                return etaDate < now && etaDate > lastTimeDate;
            } catch (e) {
                return false;
            }
        };

        const clearData = () => {
            currentPage.value = 1;
            emit('clear');
        };

        const onRowClick = (item) => {
            emit('rowClick', item);
        };

        watch(() => props.shipData, () => {
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
            getShipTypeName,
            getNavigationStatus,
            isEtaExpired,
            clearData,
            onRowClick
        };
    }
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.5);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(6, 182, 212, 0.6), rgba(6, 182, 212, 0.3));
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, rgba(6, 182, 212, 0.9), rgba(6, 182, 212, 0.6));
}
</style>
