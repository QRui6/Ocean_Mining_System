<template>
    <div class="absolute bottom-2 left-[31rem] right-8 h-[25rem] z-30 animate-slideUp flex flex-col">
        <div class="flex-1 ship-list-shell flex flex-col relative overflow-hidden">
            <!-- Header -->
            <div class="h-14 flex items-center justify-between px-6 border-b border-slate-600/60 bg-slate-800/95">
                  <div class="flex items-center gap-4">
                      <div class="w-1.5 h-6 bg-cyan-400"></div>
                      <h3 class="text-2xl font-bold text-slate-100 tracking-wide font-['Noto_Sans_SC']">船舶数据列表</h3>
                      <span class="text-sm text-slate-300 font-['Noto_Sans_SC'] mt-1 ml-2">共 {{ totalCount }} 艘</span>
                  </div>
                  
                  <!-- Tools -->
                  <div class="flex gap-6 text-slate-200 text-base font-semibold">
                      <button @click="clearData" class="hover:text-white transition-colors">清空列表</button>
                  </div>
            </div>

            <!-- Table -->
            <div class="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar px-4 py-2 min-h-0 bg-slate-900/95">
                <table class="w-full text-left border-collapse">
                    <thead class="ship-table-head sticky top-0 z-10">
                        <tr>
                            <th v-for="h in ['序号', 'MMSI', '船舶名称', '船舶类型', '船长', '船宽', '航速', '载重', '目的港', '预计到达', '最后更新', '状态']" :key="h" 
                                class="px-3 py-3 font-semibold tracking-wide border-b border-slate-600 whitespace-nowrap text-sm text-slate-100"
                            >
                                {{ h }}
                            </th>
                        </tr>
                    </thead>
                    <tbody class="text-slate-100 text-[14px] font-['Noto_Sans_SC']">
                        <tr v-if="paginatedData.length === 0">
                            <td colspan="12" class="px-3 py-8 text-center text-slate-400 text-base">
                                暂无数据，请先搜索船舶
                            </td>
                        </tr>
                        <tr v-for="(item, index) in paginatedData" :key="item.mmsi" 
                            class="ship-row border-b border-slate-700/60 transition-colors group cursor-pointer"
                            @click="onRowClick(item)"
                        >
                            <td class="px-3 py-3 text-cyan-300 font-semibold">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                            <td class="px-3 py-3 font-mono text-slate-200">{{ item.mmsi }}</td>
                            <td class="px-3 py-3 text-slate-50 group-hover:text-white transition-colors font-semibold">{{ item.ship_cnname || item.ship_name || '-' }}</td>
                            <td class="px-3 py-3 text-slate-200">{{ getShipTypeName(item.ship_type) }}</td>
                            <td class="px-3 py-3 font-mono text-slate-200">{{ item.length ? item.length + 'm' : 'N/A' }}</td>
                            <td class="px-3 py-3 font-mono text-slate-200">{{ item.width ? item.width + 'm' : 'N/A' }}</td>
                            <td class="px-3 py-3 font-mono text-amber-300 font-semibold">{{ item.sog ? item.sog + ' kn' : 'N/A' }}</td>
                            <td class="px-3 py-3 font-mono text-slate-200">{{ item.draught ? item.draught + 'm' : 'N/A' }}</td>
                            <td class="px-3 py-3 text-slate-200 max-w-[140px] truncate" :title="item.dest">{{ item.dest || 'N/A' }}</td>
                            <td class="px-3 py-3 text-slate-200">
                                <div>{{ item.eta || 'N/A' }}</div>
                                <div v-if="isEtaExpired(item.eta, item.last_time)" class="text-orange-300 text-xs mt-1">已过期</div>
                            </td>
                            <td class="px-3 py-3 text-slate-300">{{ item.last_time || '-' }}</td>
                            <td class="px-3 py-3 text-slate-200">{{ getNavigationStatus(item.navistat) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div class="h-14 flex-shrink-0 flex items-center justify-between px-6 border-t border-slate-700/70 bg-slate-800/95">
                <div class="text-sm text-slate-300">
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
                                : 'bg-slate-700 text-slate-100 hover:bg-slate-600'
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
                                    ? 'bg-cyan-600 text-white' 
                                    : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
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
                                : 'bg-slate-700 text-slate-100 hover:bg-slate-600'
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
.ship-list-shell {
    background: rgba(15, 23, 42, 0.96);
    border: 1px solid rgba(100, 116, 139, 0.65);
    border-radius: 8px;
}

.ship-table-head {
    background: rgba(30, 41, 59, 0.98);
}

.ship-row:nth-child(odd) {
    background: rgba(15, 23, 42, 0.65);
}

.ship-row:nth-child(even) {
    background: rgba(15, 23, 42, 0.45);
}

.ship-row:hover {
    background: rgba(56, 189, 248, 0.16);
}

.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.5);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(71, 85, 105, 0.85);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(100, 116, 139, 0.95);
}
</style>
