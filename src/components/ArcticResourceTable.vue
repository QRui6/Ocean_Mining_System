<template>
    <transition name="slide-up">
        <div v-if="show" class="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-[48rem] bg-slate-900/90 border border-slate-700 text-white shadow-lg z-50 mb-4 pointer-events-auto rounded">
            
            <!-- 标题栏 -->
            <div class="flex items-center justify-between bg-slate-800/80 px-4 py-2 border-b border-slate-700 rounded-t">
                <span class="text-sm font-medium text-slate-200">北极地区资源储量统计</span>
                <div class="flex items-center gap-2">
                    <button @click="$emit('showStatistics')" 
                            class="px-3 py-1 text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors">
                        统计
                    </button>
                    <button @click="$emit('close')" class="text-slate-400 hover:text-white transition-colors">✕</button>
                </div>
            </div>

            <!-- 筛选按钮 -->
            <div class="px-4 py-2 border-b border-slate-700 flex gap-2">
                <button 
                    v-for="filter in filters" 
                    :key="filter.id"
                    @click="currentFilter = filter.id"
                    :class="currentFilter === filter.id 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'"
                    class="px-3 py-1 rounded text-xs transition-colors">
                    {{ filter.label }}
                </button>
            </div>

            <!-- 表格内容 -->
            <div ref="tableContainer" 
                 class="p-3 max-h-[220px] overflow-y-auto scroll-smooth"
                 @mouseenter="handleMouseEnter"
                 @mouseleave="handleMouseLeave">
                <table class="w-full text-xs">
                    <thead class="bg-slate-800 sticky top-0">
                        <tr>
                            <th class="px-2 py-1.5 text-left text-slate-300 border border-slate-700">评价单元</th>
                            <th class="px-2 py-1.5 text-center text-slate-300 border border-slate-700">石油 (×10⁸t)</th>
                            <th class="px-2 py-1.5 text-center text-slate-300 border border-slate-700">天然气 (×10⁸m³)</th>
                            <th class="px-2 py-1.5 text-center text-slate-300 border border-slate-700">合计 (×10⁸t)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(row, index) in filteredData" :key="index" 
                            class="hover:bg-slate-800/50 transition-colors"
                            :class="row.isTotal ? 'bg-slate-800/70 font-medium' : ''">
                            <td class="px-2 py-1.5 text-slate-200 border border-slate-700">{{ row.name }}</td>
                            <td class="px-2 py-1.5 text-center text-slate-200 border border-slate-700">{{ row.oil }}</td>
                            <td class="px-2 py-1.5 text-center text-slate-200 border border-slate-700">{{ row.gas }}</td>
                            <td class="px-2 py-1.5 text-center text-slate-200 border border-slate-700">{{ row.total }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </transition>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

export default {
    name: 'ArcticResourceTable',
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['close', 'showStatistics'],
    setup(props) {
        const currentFilter = ref('discovered');
        const tableContainer = ref(null);
        let scrollInterval = null;
        const scrollSpeed = 30; // 滚动速度（毫秒）
        const scrollStep = 1; // 每次滚动的像素
        
        const filters = [
            // { id: 'all', label: '全部' },
            { id: 'discovered', label: '已发现2P可采储量' },
            { id: 'undiscovered', label: '待发现资源量' },
            { id: 'inplace', label: '原地资源量' }
        ];
        
        // 表格数据（根据图片中的表格）
        const tableData = {
            discovered: [
                { name: '西西伯利亚盆地', oil: '35.44', gas: '380290.10', total: '338.45' },
                { name: '阿拉斯加北坡盆地', oil: '44.92', gas: '19251.70', total: '61.87' },
                { name: '东巴伦支海盆地', oil: '0.62', gas: '37009.95', total: '30.12' },
                { name: '叶尼塞-哈坦加盆地', oil: '2.77', gas: '5647.50', total: '7.26' },
                { name: '巴伦支海台地', oil: '2.61', gas: '3852.85', total: '5.80' },
                { name: '李曼-别朝拉盆地', oil: '15.53', gas: '5948.70', total: '20.28' },
                { name: '斯维尔德鲁普盆地', oil: '0.79', gas: '4467.80', total: '4.35' },
                { name: '鄂霍-安纳巴盆地', oil: '0.02', gas: '0.00', total: '0.03' },
                { name: '西北加拿大内陆盆地', oil: '1.89', gas: '3401.05', total: '4.61' },
                { name: '维廉姆堡边缘', oil: '0.05', gas: '1468.35', total: '1.22' },
                { name: '*西格陵兰-东加拿大', oil: '0', gas: '0.85', total: '0.00068' },
                { name: '合计', oil: '104.65', gas: '461338.85', total: '473.99', isTotal: true }
            ],
            undiscovered: [
                { name: '西西伯利亚盆地', oil: '38.11', gas: '408929.20', total: '363.95' },
                { name: '阿拉斯加北坡盆地', oil: '227.60', gas: '97551.15', total: '305.33' },
                { name: '东巴伦支海盆地', oil: '4.32', gas: '257977.80', total: '209.88' },
                { name: '叶尼塞-哈坦加盆地', oil: '17.89', gas: '36482.85', total: '46.96' },
                { name: '巴伦支海台地', oil: '19.48', gas: '28764.60', total: '42.40' },
                { name: '李曼-别朝拉盆地', oil: '14.34', gas: '5496.90', total: '18.72' },
                { name: '斯维尔德鲁普盆地', oil: '0.84', gas: '4769.00', total: '4.64' },
                { name: '鄂霍-安纳巴盆地', oil: '0.04', gas: '0.00', total: '0.04' },
                { name: '西北加拿大内陆盆地', oil: '9.70', gas: '17444.50', total: '23.60' },
                { name: '维廉姆堡边缘', oil: '2.65', gas: '9211.70', total: '9.99' },
                { name: '*西格陵兰-东加拿大', oil: '11.50', gas: '14783.90', total: '23.28' },
                { name: '*东格陵兰裂谷盆地', oil: '23.22', gas: '24598.00', total: '42.82' },
                { name: '*尧亚盆地', oil: '14.00', gas: '16239.70', total: '26.94' },
                { name: '*拉普捷夫海陆架', oil: '5.43', gas: '9287.00', total: '12.83' },
                { name: '*欧亚盆地', oil: '2.54', gas: '5559.65', total: '6.97' },
                { name: '*北卡拉盆地和台地', oil: '3.00', gas: '4267.00', total: '6.40' },
                { name: '*北楚科奇海边界', oil: '2.21', gas: '2911.60', total: '4.53' },
                { name: '*罗蒙诺索夫-马卡罗夫大', oil: '1.77', gas: '2045.65', total: '3.40' },
                { name: '*北莫利布-第兰格尔前陆盆地', oil: '0.26', gas: '1731.90', total: '1.64' },
                { name: '*维尔基茨基斯基盆地', oil: '0.27', gas: '1644.05', total: '1.58' },
                { name: '*西北楚科奇海陆架裂谷盆地', oil: '0.40', gas: '1280.10', total: '1.42' },
                { name: '*勒纳-维柳伊盆地', oil: '0.56', gas: '376.50', total: '0.86' },
                { name: '*涅良卡盆地', oil: '0.12', gas: '426.70', total: '0.46' },
                { name: '*东西伯利亚海盆地', oil: '0.04', gas: '175.70', total: '0.18' },
                { name: '*霍普盆地', oil: '0.02', gas: '188.25', total: '0.1' },
                { name: '合计', oil: '400.31', gas: '952143.40', total: '1158.99', isTotal: true }
            ],
            inplace: [
                { name: '西西伯利亚盆地', oil: '73.55', gas: '789219.30', total: '702.40' },
                { name: '阿拉斯加北坡盆地', oil: '272.52', gas: '116802.85', total: '367.20' },
                { name: '东巴伦支海盆地', oil: '4.94', gas: '294987.75', total: '240.00' },
                { name: '叶尼塞-哈坦加盆地', oil: '20.66', gas: '42130.35', total: '54.22' },
                { name: '巴伦支海台地', oil: '22.09', gas: '32617.45', total: '48.20' },
                { name: '李曼-别朝拉盆地', oil: '29.87', gas: '11445.60', total: '39.00' },
                { name: '斯维尔德鲁普盆地', oil: '1.63', gas: '9236.80', total: '8.99' },
                { name: '鄂霍-安纳巴盆地', oil: '0.06', gas: '12.55', total: '0.07' },
                { name: '西北加拿大内陆盆地', oil: '11.59', gas: '20845.55', total: '28.21' },
                { name: '维廉姆堡边缘', oil: '2.70', gas: '10680.05', total: '11.21' },
                { name: '*西格陵兰-东加拿大', oil: '11.50', gas: '14783.90', total: '23.28' },
                { name: '*东格陵兰裂谷盆地', oil: '23.22', gas: '24598.00', total: '42.82' },
                { name: '*尧亚盆地', oil: '14.00', gas: '16239.70', total: '26.94' },
                { name: '*拉普捷夫海陆架', oil: '5.43', gas: '9287.00', total: '12.83' },
                { name: '*欧亚盆地', oil: '2.54', gas: '5559.65', total: '6.97' },
                { name: '*北卡拉盆地和台地', oil: '3.00', gas: '4267.00', total: '6.40' },
                { name: '*北楚科奇海边界', oil: '2.21', gas: '2911.60', total: '4.53' },
                { name: '*罗蒙诺索夫-马卡罗夫大', oil: '1.77', gas: '2045.65', total: '3.40' },
                { name: '*北莫利布-第兰格尔前陆盆地', oil: '0.26', gas: '1731.90', total: '1.64' },
                { name: '*维尔基茨基斯基盆地', oil: '0.27', gas: '1644.05', total: '1.58' },
                { name: '*西北楚科奇海陆架裂谷盆地', oil: '0.40', gas: '1280.10', total: '1.42' },
                { name: '*勒纳-维柳伊盆地', oil: '0.56', gas: '376.50', total: '0.86' },
                { name: '*涅良卡盆地', oil: '0.12', gas: '426.70', total: '0.46' },
                { name: '*东西伯利亚海盆地', oil: '0.04', gas: '175.70', total: '0.18' },
                { name: '*霍普盆地', oil: '0.02', gas: '188.25', total: '0.17' },
                { name: '合计', oil: '504.96', gas: '1413481.40', total: '1632.97', isTotal: true }
            ]
        };
        
        const filteredData = computed(() => {
            if (currentFilter.value === 'all') {
                // 显示所有数据：已发现 + 待发现 + 原地资源量
                return [
                    ...tableData.discovered,
                    ...tableData.undiscovered,
                    ...tableData.inplace
                ];
            } else if (currentFilter.value === 'discovered') {
                return tableData.discovered;
            } else if (currentFilter.value === 'undiscovered') {
                return tableData.undiscovered;
            } else if (currentFilter.value === 'inplace') {
                return tableData.inplace;
            }
            return [];
        });
        
        // 启动自动滚动
        const startAutoScroll = () => {
            if (scrollInterval) return;
            
            scrollInterval = setInterval(() => {
                if (tableContainer.value) {
                    const container = tableContainer.value;
                    const maxScroll = container.scrollHeight - container.clientHeight;
                    
                    // 如果到达底部，重置到顶部
                    if (container.scrollTop >= maxScroll) {
                        container.scrollTop = 0;
                    } else {
                        container.scrollTop += scrollStep;
                    }
                }
            }, scrollSpeed);
        };
        
        // 停止自动滚动
        const stopAutoScroll = () => {
            if (scrollInterval) {
                clearInterval(scrollInterval);
                scrollInterval = null;
            }
        };
        
        // 监听面板显示状态
        watch(() => props.show, (newVal) => {
            if (newVal) {
                // 延迟启动滚动，确保DOM已渲染
                setTimeout(() => {
                    startAutoScroll();
                }, 500);
            } else {
                stopAutoScroll();
            }
        });
        
        // 监听筛选器变化，重置滚动位置
        watch(currentFilter, () => {
            if (tableContainer.value) {
                tableContainer.value.scrollTop = 0;
            }
        });
        
        // 鼠标悬停时暂停滚动
        const handleMouseEnter = () => {
            stopAutoScroll();
        };
        
        const handleMouseLeave = () => {
            if (props.show) {
                startAutoScroll();
            }
        };
        
        // 组件挂载时启动滚动
        onMounted(() => {
            if (props.show) {
                setTimeout(() => {
                    startAutoScroll();
                }, 500);
            }
        });
        
        // 组件卸载时清理定时器
        onUnmounted(() => {
            stopAutoScroll();
        });
        
        return {
            currentFilter,
            filters,
            filteredData,
            tableContainer,
            handleMouseEnter,
            handleMouseLeave
        };
    }
};
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.3s ease;
}

.slide-up-enter-from {
    opacity: 0;
    transform: translate(-50%, 20px);
}

.slide-up-leave-to {
    opacity: 0;
    transform: translate(-50%, 20px);
}
</style>
