<template>
    <transition name="slide-up">
        <div v-if="show" class="fixed bottom-0 left-[500px] z-50 w-[1000px] pointer-events-auto">
            <!-- 主面板容器 -->
            <div class="relative" style="clip-path: polygon(2% 0, 98% 0, 100% 5%, 100% 100%, 0 100%, 0 5%); background: rgba(15, 30, 60, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); box-shadow: 0 -10px 40px rgba(6, 182, 212, 0.2), inset 0 0 60px rgba(6, 182, 212, 0.1);">
                <!-- 顶部装饰线 -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                
                <!-- 关闭按钮
                <button 
                    @click="$emit('close')"
                    class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-red-500/20 hover:bg-red-500/40 border border-red-500 rounded transition-all group z-10"
                    title="关闭"
                >
                    <svg class="w-5 h-5 text-red-400 group-hover:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button> -->
                
                <!-- 标题栏 -->
                <div class="flex items-center px-6 pt-4 pb-3 border-b-2 border-cyan-500/30">
                    <div class="w-1.5 h-6 bg-yellow-400 mr-3 shadow-[0_0_10px_#facc15]"></div>
                    <h3 class="text-2xl font-bold text-white tracking-wider flex-1">采矿车系统</h3>
                    <div class="text-xs font-['Orbitron'] text-cyan-500 opacity-80 font-bold tracking-widest">MINING VEHICLE</div>
                </div>
                
                <!-- 内容区域 -->
                <div class="p-4">
                    <!-- 主要内容区域 -->
                    <div class="flex gap-4 h-[350px] mb-4">
                        <!-- 左侧：文字介绍 -->
                        <div class="w-[40%] bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 overflow-y-auto custom-scrollbar">
                            <h4 class="text-lg font-bold text-cyan-400 mb-4 flex items-center">
                                <div class="w-1 h-5 bg-cyan-400 mr-2"></div>
                                深海采矿车技术概述
                            </h4>
                            <div class="space-y-4 text-slate-300 text-sm leading-relaxed">
                                <p class="indent-8">
                                    深海车载作业采矿车可开展海底矿物采集、存储和转运等多种作业，是深海矿产资源开发的核心装备。海底采矿车的行进方式主要有拖曳式和自行式两种。拖曳式集矿装备无法准确按照预定的开采轨迹行走，避障及操控难度大，且采集效率低，回采损失大，目前已停止研发。自行式集矿装备又分为螺旋桨推进式、阿基米德螺旋式和履带自行式三种。其中，螺旋桨推进结构简单，但牵引力小，对海底破坏严重，易将邻近采集路径内的结核矿石冲走或埋入沉积层内，不适应海底开采作业及环保要求。阿基米德螺旋式行进由美国首先采用。
                                </p>
                                <p class="indent-8">
                                    相比之下，履带式深海采矿车自行牵引力大，承载能力高，跨越或绕过海底障碍容易，对海底扰动较小，操纵性较好，能满足复杂海底集矿作业要求。因此，各国正在进行中的海底采矿车研发项目主要采用履带式行进。
                                </p>
                                <div class="mt-6 p-3 bg-cyan-900/20 border-l-4 border-cyan-400 rounded">
                                    <p class="text-cyan-300 text-xs font-bold mb-2">技术特点</p>
                                    <ul class="text-xs space-y-1 text-slate-400">
                                        <li>• 履带式行进系统提供强大牵引力</li>
                                        <li>• 适应复杂海底地形和障碍物</li>
                                        <li>• 减少对海底环境的扰动</li>
                                        <li>• 精确控制采集路径和效率</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 右侧：两个表格堆叠 -->
                        <div class="w-[60%] flex flex-col gap-4">
                            <!-- 表格1：主要国家采矿车海试情况 -->
                            <div class="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 overflow-hidden">
                                <h4 class="text-sm font-bold text-cyan-400 mb-2 flex items-center">
                                    <div class="w-1 h-4 bg-yellow-400 mr-2"></div>
                                    主要国家采矿车海试情况
                                </h4>
                                <div class="relative h-[calc(100%-32px)] overflow-hidden">
                                    <div 
                                        ref="table1Container"
                                        class="transition-transform duration-500 ease-linear"
                                        :style="{ transform: `translateY(-${table1Offset}px)` }"
                                    >
                                        <table class="w-full text-xs">
                                            <thead class="bg-slate-800/80 sticky top-0">
                                                <tr class="border-b border-slate-700">
                                                    <th class="px-2 py-2 text-left text-cyan-400 font-bold whitespace-nowrap">参数名称</th>
                                                    <th class="px-2 py-2 text-center text-cyan-400 font-bold whitespace-nowrap">加拿大TMC</th>
                                                    <th class="px-2 py-2 text-center text-cyan-400 font-bold whitespace-nowrap">比利时GSR</th>
                                                    <th class="px-2 py-2 text-center text-cyan-400 font-bold whitespace-nowrap">日本JOGMEC</th>
                                                    <th class="px-2 py-2 text-center text-cyan-400 font-bold whitespace-nowrap">韩国KRISO</th>
                                                    <th class="px-2 py-2 text-center text-cyan-400 font-bold whitespace-nowrap">美国OMCO</th>
                                                    <th class="px-2 py-2 text-center text-cyan-400 font-bold whitespace-nowrap">美国OMI</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="(row, index) in table1Data" :key="index" class="border-b border-slate-700/50 hover:bg-slate-800/30">
                                                    <td class="px-2 py-2 text-slate-400 font-medium whitespace-nowrap">{{ row.name }}</td>
                                                    <td class="px-2 py-2 text-center text-slate-300 whitespace-nowrap">{{ row.tmc }}</td>
                                                    <td class="px-2 py-2 text-center text-slate-300 whitespace-nowrap">{{ row.gsr }}</td>
                                                    <td class="px-2 py-2 text-center text-slate-300 whitespace-nowrap">{{ row.jogmec }}</td>
                                                    <td class="px-2 py-2 text-center text-slate-300 whitespace-nowrap">{{ row.kriso }}</td>
                                                    <td class="px-2 py-2 text-center text-slate-300 whitespace-nowrap">{{ row.omco }}</td>
                                                    <td class="px-2 py-2 text-center text-slate-300 whitespace-nowrap">{{ row.omi }}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <!-- 复制一份用于无缝滚动 -->
                                        <table class="w-full text-xs">
                                            <tbody>
                                                <tr v-for="(row, index) in table1Data" :key="'copy-' + index" class="border-b border-slate-700/50 hover:bg-slate-800/30">
                                                    <td class="px-2 py-2 text-slate-400 font-medium whitespace-nowrap">{{ row.name }}</td>
                                                    <td class="px-2 py-2 text-center text-slate-300 whitespace-nowrap">{{ row.tmc }}</td>
                                                    <td class="px-2 py-2 text-center text-slate-300 whitespace-nowrap">{{ row.gsr }}</td>
                                                    <td class="px-2 py-2 text-center text-slate-300 whitespace-nowrap">{{ row.jogmec }}</td>
                                                    <td class="px-2 py-2 text-center text-slate-300 whitespace-nowrap">{{ row.kriso }}</td>
                                                    <td class="px-2 py-2 text-center text-slate-300 whitespace-nowrap">{{ row.omco }}</td>
                                                    <td class="px-2 py-2 text-center text-slate-300 whitespace-nowrap">{{ row.omi }}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 表格2：深海采矿车试验情况 -->
                            <div class="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 overflow-hidden">
                                <h4 class="text-sm font-bold text-cyan-400 mb-2 flex items-center">
                                    <div class="w-1 h-4 bg-yellow-400 mr-2"></div>
                                    深海采矿车试验情况
                                </h4>
                                <div class="relative h-[calc(100%-32px)] overflow-hidden">
                                    <div 
                                        ref="table2Container"
                                        class="transition-transform duration-500 ease-linear"
                                        :style="{ transform: `translateY(-${table2Offset}px)` }"
                                    >
                                        <table class="w-full text-xs">
                                            <thead class="bg-slate-800/80 sticky top-0">
                                                <tr class="border-b border-slate-700">
                                                    <th class="px-3 py-2 text-center text-cyan-400 font-bold w-16">序号</th>
                                                    <th class="px-3 py-2 text-center text-cyan-400 font-bold w-20">年份</th>
                                                    <th class="px-3 py-2 text-left text-cyan-400 font-bold">单位</th>
                                                    <th class="px-3 py-2 text-center text-cyan-400 font-bold w-24">水深</th>
                                                    <th class="px-3 py-2 text-center text-cyan-400 font-bold w-32">行进原理</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="item in table2Data" :key="item.id" class="border-b border-slate-700/50 hover:bg-slate-800/30">
                                                    <td class="px-3 py-2 text-center text-slate-300">{{ item.id }}</td>
                                                    <td class="px-3 py-2 text-center text-slate-300">{{ item.year }}</td>
                                                    <td class="px-3 py-2 text-slate-300">{{ item.unit }}</td>
                                                    <td class="px-3 py-2 text-center text-slate-300">{{ item.depth }}</td>
                                                    <td class="px-3 py-2 text-center text-slate-300">{{ item.method }}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <!-- 复制一份用于无缝滚动 -->
                                        <table class="w-full text-xs">
                                            <tbody>
                                                <tr v-for="item in table2Data" :key="'copy-' + item.id" class="border-b border-slate-700/50 hover:bg-slate-800/30">
                                                    <td class="px-3 py-2 text-center text-slate-300">{{ item.id }}</td>
                                                    <td class="px-3 py-2 text-center text-slate-300">{{ item.year }}</td>
                                                    <td class="px-3 py-2 text-slate-300">{{ item.unit }}</td>
                                                    <td class="px-3 py-2 text-center text-slate-300">{{ item.depth }}</td>
                                                    <td class="px-3 py-2 text-center text-slate-300">{{ item.method }}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 底部采矿车列表区域 -->
                    <div class="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 relative">
                        <div class="flex items-center justify-between mb-2">
                            <h4 class="text-sm font-bold text-cyan-400 flex items-center">
                                <div class="w-1 h-4 bg-yellow-400 mr-2"></div>
                                采矿车列表
                            </h4>
                            <div class="text-xs text-slate-500">
                                共 <span class="text-cyan-400 font-bold">{{ vehicleList.length }}</span> 台
                            </div>
                        </div>
                        
                        <!-- 滚动列表容器 -->
                        <div class="relative h-[100px]" style="overflow: visible;">
                            <div class="absolute inset-0 overflow-hidden">
                                <div 
                                    ref="scrollContainer"
                                    class="flex gap-4 transition-transform duration-500 ease-linear"
                                    :style="{ transform: `translateX(-${scrollOffset}px)` }"
                                >
                                    <div 
                                        v-for="vehicle in displayList" 
                                        :key="vehicle.id + '-' + vehicle.index"
                                        class="flex-shrink-0 w-[200px] bg-slate-800/60 border border-slate-700 hover:border-cyan-500/50 rounded-lg p-3 cursor-pointer transition-all group relative"
                                        @mouseenter="onVehicleHover(vehicle)"
                                        @mouseleave="onVehicleLeave"
                                    >
                                        <div class="flex items-center gap-3">
                                            <!-- 车辆缩略图 -->
                                            <div class="w-12 h-12 bg-cyan-900/30 border border-cyan-500/30 rounded overflow-hidden flex-shrink-0">
                                                <img 
                                                    :src="vehicle.image" 
                                                    :alt="vehicle.name"
                                                    class="w-full h-full object-cover"
                                                />
                                            </div>
                                            
                                            <!-- 车辆信息 -->
                                            <div class="flex-1 min-w-0">
                                                <div class="text-white font-bold text-sm truncate group-hover:text-cyan-400 transition-colors">
                                                    {{ vehicle.name }}
                                                </div>
                                                <div class="text-xs text-slate-400 mt-1">
                                                    {{ vehicle.country }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 悬浮放大图片预览 - 放在外层 -->
                        <transition name="zoom-fade">
                            <div 
                                v-if="hoveredVehicle"
                                class="fixed z-[9999]"
                                :style="previewStyle"
                            >
                                <div class="bg-slate-900 border-2 border-cyan-500 rounded-lg p-2 shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                                    <img 
                                        :src="hoveredVehicle.image" 
                                        :alt="hoveredVehicle.name"
                                        class="w-[400px] h-[250px] object-cover rounded"
                                    />
                                    <div class="mt-2 text-center">
                                        <div class="text-cyan-400 font-bold text-sm">{{ hoveredVehicle.name }}</div>
                                        <div class="text-slate-400 text-xs mt-1">{{ hoveredVehicle.country }}</div>
                                    </div>
                                </div>
                                <!-- 小三角指示器 -->
                                <div class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-cyan-500"></div>
                            </div>
                        </transition>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>


<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';

export default {
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['close'],
    setup() {
        const table1Data = ref([
            { name: '资源类型', tmc: '多金属结核', gsr: '多金属结核', jogmec: '多金属硫化物', kriso: '多金属结核', omco: '多金属结核', omi: '多金属结核' },
            { name: '海试时间', tmc: '2022', gsr: '2021', jogmec: '2017', kriso: '2013', omco: '1978', omi: '1979' },
            { name: '采矿车名称', tmc: '/', gsr: 'Patania II', jogmec: '/', kriso: 'MinRo II', omco: '/', omi: '/' },
            { name: '设计产能(千吨,t/h)', tmc: '180', gsr: '65', jogmec: '10~15', kriso: '35', omco: '/', omi: '50' },
            { name: '设计水深(m)', tmc: '5000', gsr: '5000', jogmec: '3000', kriso: '3000', omco: '/', omi: '/' },
            { name: '最大行驶速度(m/s)', tmc: '1', gsr: '1', jogmec: '/', kriso: '1', omco: '/', omi: '/' },
            { name: '功率(kW)', tmc: '1MW', gsr: '/', jogmec: '/', kriso: '550', omco: '/', omi: '/' },
            { name: '外形尺寸(m×m×m)', tmc: '12×6×5', gsr: '12×4.7×4.5', jogmec: '7×3.2×3.5', kriso: '6×5×4', omco: '/', omi: '/' },
            { name: '空气中重量(t)', tmc: '80', gsr: '25', jogmec: '19.9', kriso: '28', omco: '/', omi: '/' },
            { name: '水中重量(t)', tmc: '14', gsr: '15', jogmec: '16', kriso: '9', omco: '/', omi: '/' },
            { name: '采集头宽度(m)', tmc: '6', gsr: '4', jogmec: '/', kriso: '6', omco: '/', omi: '/' }
        ]);
        
        const table2Data = ref([
            { id: 1, year: '1978', unit: '美国海洋管理公司（OMI）', depth: '5500m', method: '拖曳式' },
            { id: 2, year: '1979', unit: '美国海洋矿物公司（OMCO）', depth: '5000m', method: '阿基米德螺旋式' },
            { id: 3, year: '2006', unit: '印度国家海洋技术研究所（NIOT）、德国镜根大学', depth: '500m', method: '履带式' },
            { id: 4, year: '2013', unit: '韩国海洋科学技术院（KIOST）', depth: '1370m', method: '履带式' },
            { id: 5, year: '2016', unit: '比利时GSR公司', depth: '4500m', method: '履带式' },
            { id: 6, year: '2017', unit: '日本石油天然气金属矿物资源机构（JOGMEC）', depth: '1600m', method: '履带式' },
            { id: 7, year: '2022', unit: '加拿大TMC', depth: '4300m', method: '履带式' }
        ]);
        
        // 采矿车列表数据
        const vehicleList = ref([
            {
                id: 1,
                name: '美国OMI拖拽式',
                country: '加拿大',
                year: 2022,
                image: '/image/car/bg.jpg'
            },
            {
                id: 2,
                name: '阿基米德螺旋式',
                country: '中国',
                year: 2021,
                image: '/image/car/bg2.jpg'
            },
            {
                id: 3,
                name: '印度NIOT研究所采矿车',
                country: '印度',
                year: 2017,
                image: '/image/car/bg3.jpg'
            },
            {
                id: 4,
                name: '韩国MineRO-I',
                country: '韩国',
                year: 2013,
                image: '/image/car/bg4.jpg'
            },
            {
                id: 5,
                name: '比利时GSRPATANIA',
                country: '比利时',
                year: 1978,
                image: '/image/car/bg5.jpg'
            },
            {
                id: 6,
                name: '日本JOGMEC硫化物采矿车',
                country: '日本',
                year: 1979,
                image: '/image/car/bg6.jpg'
            }
        ]);
        
        const table1Container = ref(null);
        const table2Container = ref(null);
        const table1Offset = ref(0);
        const table2Offset = ref(0);
        let table1Interval = null;
        let table2Interval = null;
        
        // 底部滚动相关
        const scrollContainer = ref(null);
        const scrollOffset = ref(0);
        let scrollInterval = null;
        
        // 悬浮的车辆
        const hoveredVehicle = ref(null);
        const previewStyle = ref({});
        
        // 处理鼠标悬浮
        const onVehicleHover = (vehicle) => {
            hoveredVehicle.value = vehicle;
            // 计算预览位置（在采矿车列表上方显示）
            previewStyle.value = {
                left: '50%',
                bottom: '160px', // 调整为在列表上方
                transform: 'translateX(-50%)'
            };
        };
        
        const onVehicleLeave = () => {
            hoveredVehicle.value = null;
        };
        
        // 复制列表用于无缝滚动
        const displayList = computed(() => {
            const list1 = vehicleList.value.map((v, i) => ({ ...v, index: i }));
            const list2 = vehicleList.value.map((v, i) => ({ ...v, index: i + vehicleList.value.length }));
            return [...list1, ...list2];
        });
        
        const startTable1Scroll = () => {
            table1Interval = setInterval(() => {
                table1Offset.value += 0.5;
                const tableHeight = table1Data.value.length * 30;
                if (table1Offset.value >= tableHeight) {
                    table1Offset.value = 0;
                }
            }, 30);
        };
        
        const startTable2Scroll = () => {
            table2Interval = setInterval(() => {
                table2Offset.value += 0.5;
                const tableHeight = table2Data.value.length * 30;
                if (table2Offset.value >= tableHeight) {
                    table2Offset.value = 0;
                }
            }, 30);
        };
        
        // 开始底部自动滚动
        const startAutoScroll = () => {
            scrollInterval = setInterval(() => {
                scrollOffset.value += 1;
                
                // 当滚动到一半时重置（无缝循环）
                const containerWidth = vehicleList.value.length * (200 + 16); // 卡片宽度 + gap
                if (scrollOffset.value >= containerWidth) {
                    scrollOffset.value = 0;
                }
            }, 30);
        };
        
        const stopScrolling = () => {
            if (table1Interval) {
                clearInterval(table1Interval);
                table1Interval = null;
            }
            if (table2Interval) {
                clearInterval(table2Interval);
                table2Interval = null;
            }
            if (scrollInterval) {
                clearInterval(scrollInterval);
                scrollInterval = null;
            }
        };
        
        onMounted(() => {
            startTable1Scroll();
            startTable2Scroll();
            startAutoScroll();
        });
        
        onUnmounted(() => {
            stopScrolling();
        });
        
        return {
            table1Data,
            table2Data,
            vehicleList,
            displayList,
            table1Container,
            table2Container,
            table1Offset,
            table2Offset,
            scrollContainer,
            scrollOffset,
            hoveredVehicle,
            previewStyle,
            onVehicleHover,
            onVehicleLeave
        };
    }
};
</script>


<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from {
    transform: translateY(100%);
    opacity: 0;
}

.slide-up-leave-to {
    transform: translateY(100%);
    opacity: 0;
}

.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.5);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(6, 182, 212, 0.5);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(6, 182, 212, 0.7);
}

/* 放大图片动画 */
.zoom-fade-enter-active,
.zoom-fade-leave-active {
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.zoom-fade-enter-from {
    opacity: 0;
    transform: translateX(-50%) scale(0.9) translateY(20px) !important;
}

.zoom-fade-leave-to {
    opacity: 0;
    transform: translateX(-50%) scale(0.9) translateY(20px) !important;
}
</style>
