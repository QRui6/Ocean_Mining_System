<template>
    <transition name="fade-scale">
        <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center pointer-events-none pt-40">
            <!-- 主面板容器 -->
            <div class="relative w-[1100px] h-[820px] pointer-events-auto ml-[150px] rounded-2xl overflow-hidden" 
                 style="background: rgba(15, 30, 60, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); box-shadow: 0 0 40px rgba(6, 182, 212, 0.2), inset 0 0 60px rgba(6, 182, 212, 0.1);">
                <!-- 顶部装饰线 -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                
                <!-- 关闭按钮 -->
                <!-- <button 
                    @click="$emit('close')"
                    class="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-red-500/20 hover:bg-red-500/40 border border-red-400/50 rounded transition-all group z-20"
                    title="关闭"
                >
                    <svg class="w-6 h-6 text-red-300 group-hover:text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button> -->
                
                <!-- 标题栏 -->
                <div class="flex items-center px-8 pt-5 pb-4 border-b-2 border-cyan-500/30 relative z-10">
                    <div class="w-1.5 h-7 bg-yellow-400 mr-4 shadow-[0_0_15px_#facc15]"></div>
                    <h3 class="text-3xl font-bold text-white tracking-wider flex-1">深海采矿船研究进展</h3>
                    <div class="text-xs font-['Orbitron'] text-cyan-500 opacity-80 font-bold tracking-widest">MINING PLATFORM</div>
                </div>
                
                <!-- 内容区域 -->
                <div class="flex h-[calc(100%-85px)] relative z-10">
                    <!-- 左侧：文字介绍 -->
                    <div class="w-[40%] p-6 border-r border-slate-700/50">
                        <div class="space-y-4 text-slate-300 text-base leading-relaxed">
                            <p class="indent-8">
                                采矿船水面支持系统是指新建或改装的石油钻井/生产船或矿石运输船用作带有结核储存能力的生产船。作为深海采矿系统中最为重要的水面支持系统，深海采矿船集航行、作业、居住、保障四大功能于一体，具有航程远、作业水深大、作业周期长、系统复杂且集成度高、可靠载荷多、船舶舒适度要求高等特点，建造难度非常大。
                            </p>
                            <p class="indent-8">
                                采矿船从早期的以勘探和技术开发为主要目的船型发展到现在以试采和商业采矿为目的大型综合采矿船。
                            </p>
                            <p class="indent-8">
                                制了多台多级串联泵的方案。管道连接方面，除JOGMEC公司的螺纹连接方式外，大多数方案采用法兰式连接。德国Siegen大学管提出全软管输送系统方案。
                            </p>
                            <p class="indent-8">
                                对于混输泵管系统的研制，美国OMI公司研制了多款多级潜水混输泵，并在5000米级海试中得到验证。加拿大鹦鹉螺矿业公司采用了焰膜泵形式，将动力系统移至水上，虽可降低堵塞风险，但系统十分复杂（上百个控制阀），增加了故障风险，至今尚未完成海试验证。德国、美国和日本等国企业或机构的设计和海试实践表明，离心泵水力提升或气力提升方式更适合深海矿产混输。
                            </p>
                        </div>
                    </div>
                    
                    <!-- 右侧：两个表格 -->
                    <div class="w-[60%] p-6">
                        <div class="space-y-4 h-full flex flex-col">
                            <!-- 表格1：主要采矿船舶名称及参数 -->
                            <div class="bg-indigo-700/20 border border-indigo-300/30 rounded-xl p-4 backdrop-blur-sm" style="height: 48%;">
                                <h4 class="text-lg font-bold text-indigo-100 mb-3 text-center">主要采矿船舶名称及参数</h4>
                                <div class="h-[calc(100%-40px)] overflow-hidden relative">
                                    <div ref="scrollContainer1" class="h-full overflow-y-scroll scroll-smooth-none">
                                        <table class="w-full text-sm text-indigo-50">
                                            <thead class="sticky top-0 bg-indigo-800/50 backdrop-blur-sm z-10">
                                                <tr class="border-b border-blue-300/30">
                                                    <th class="py-2 px-2 text-left bg-indigo-600/30">采矿试验单位</th>
                                                    <th class="py-2 px-2 text-left bg-indigo-600/30">船舶名称</th>
                                                    <th class="py-2 px-2 text-center bg-indigo-600/30">排水量(吨)</th>
                                                    <th class="py-2 px-2 text-center bg-indigo-600/30">总长(m)</th>
                                                    <th class="py-2 px-2 text-center bg-indigo-600/30">型宽(m)</th>
                                                    <th class="py-2 px-2 text-center bg-indigo-600/30">型深(m)</th>
                                                    <th class="py-2 px-2 text-center bg-indigo-600/30">吃水(m)</th>
                                                    <th class="py-2 px-2 text-center bg-indigo-600/30">月池尺寸(m×m)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="(ship, index) in displayShipData" :key="index" class="border-b border-indigo-300/20 hover:bg-indigo-600/20">
                                                    <td class="py-2 px-2">{{ ship.unit }}</td>
                                                    <td class="py-2 px-2">{{ ship.name }}</td>
                                                    <td class="py-2 px-2 text-center">{{ ship.displacement }}</td>
                                                    <td class="py-2 px-2 text-center">{{ ship.length }}</td>
                                                    <td class="py-2 px-2 text-center">{{ ship.width }}</td>
                                                    <td class="py-2 px-2 text-center">{{ ship.depth }}</td>
                                                    <td class="py-2 px-2 text-center">{{ ship.draft }}</td>
                                                    <td class="py-2 px-2 text-center">{{ ship.moonpool }}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 表格2：主要输送系统试验及参数 -->
                            <div class="bg-indigo-700/20 border border-indigo-300/30 rounded-xl p-4 backdrop-blur-sm" style="height: 48%;">
                                <h4 class="text-lg font-bold text-indigo-100 mb-3 text-center">主要输送系统试验及参数</h4>
                                <div class="h-[calc(100%-40px)] overflow-hidden relative">
                                    <div ref="scrollContainer2" class="h-full overflow-y-scroll scroll-smooth-none">
                                        <table class="w-full text-sm text-indigo-50">
                                            <thead class="sticky top-0 bg-indigo-800/50 backdrop-blur-sm z-10">
                                                <tr class="border-b border-indigo-300/30">
                                                    <th class="py-2 px-2 text-center bg-indigo-600/30">序号</th>
                                                    <th class="py-2 px-2 text-center bg-indigo-600/30">时间</th>
                                                    <th class="py-2 px-2 text-left bg-indigo-600/30">单位</th>
                                                    <th class="py-2 px-2 text-center bg-indigo-600/30">水深</th>
                                                    <th class="py-2 px-2 text-left bg-indigo-600/30">输运方式</th>
                                                    <th class="py-2 px-2 text-center bg-indigo-600/30">结核输送能力</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="(test, index) in displayTestData" :key="index" class="border-b border-indigo-300/20 hover:bg-indigo-600/20">
                                                    <td class="py-2 px-2 text-center">{{ test.no }}</td>
                                                    <td class="py-2 px-2 text-center">{{ test.year }}</td>
                                                    <td class="py-2 px-2">{{ test.unit }}</td>
                                                    <td class="py-2 px-2 text-center">{{ test.depth }}</td>
                                                    <td class="py-2 px-2">{{ test.method }}</td>
                                                    <td class="py-2 px-2 text-center">{{ test.capacity }}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue';

export default {
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['close'],
    setup(props) {
        // 表3.1：主要采矿船舶名称及参数
        const shipData = ref([
            { unit: '美国OMI', name: 'SEDCO 445', displacement: '12,000', length: '136', width: '21.34', depth: '9.75', draft: '7.6', moonpool: '' },
            { unit: '美国OMA', name: 'Deepsea Miner II', displacement: '96,000', length: '260', width: '32', depth: '19', draft: '14', moonpool: '' },
            { unit: '美国OMCO', name: 'Glomar Explorer', displacement: '50,500', length: '189', width: '35', depth: '14', draft: '12', moonpool: '' },
            { unit: '加拿大鹦鹉螺矿业', name: '新纪元号', displacement: '98,000', length: '227', width: '40', depth: '18.2', draft: '13.2', moonpool: '12×12' },
            { unit: '加拿大TMC', name: 'Hidden Gem', displacement: '96,504', length: '227.8', width: '42', depth: '19', draft: '12', moonpool: '25.5×12.48' },
            { unit: '比利时GSR', name: '委托Transocean改造', displacement: '81,700', length: '249', width: '42.5', depth: '19.5', draft: '10.8', moonpool: '' }
        ]);
        
        // 表3.2：主要输送系统试验及参数
        const testData = ref([
            { no: '1', year: '1978', unit: '美国海洋矿业协会（OMA）', depth: '4570m', method: '气力管道提升', capacity: '/' },
            { no: '2', year: '1979', unit: '美国海洋矿物公司（OMCO）', depth: '5000m', method: '水力、气力管道提升', capacity: '40t/h' },
            { no: '3', year: '1996', unit: '印度国家海洋技术研究所（NIOT）、德国慕根大学', depth: '500m', method: '水力管道提升', capacity: '/' },
            { no: '4', year: '2015', unit: '韩国海洋科学技术院（KIOST）、海洋工程研究所（KRISO）', depth: '1370m', method: '水力管道提升', capacity: '/' },
            { no: '5', year: '2016', unit: '中国五矿长沙矿冶研究院', depth: '300m', method: '水力管道提升', capacity: '50t/h' },
            { no: '6', year: '2017', unit: '日本石油天然气金属矿物资源机构（JOGMEC）', depth: '1600m', method: '水力管道提升', capacity: '/' },
            { no: '7', year: '2021', unit: '大连理工大学、长沙矿冶研究院', depth: '500m', method: '水力管道提升', capacity: '35t/h' },
            { no: '8', year: '2022', unit: '加拿大金属公司（TMC）', depth: '4300m', method: '气力管道提升', capacity: '86.4t/h' }
        ]);
        
        // DOM 引用
        const scrollContainer1 = ref(null);
        const scrollContainer2 = ref(null);
        
        // 滚动相关
        let scrollInterval1 = null;
        let scrollInterval2 = null;
        
        // 复制列表用于无缝滚动
        const displayShipData = computed(() => {
            return [...shipData.value, ...shipData.value, ...shipData.value];
        });
        
        const displayTestData = computed(() => {
            return [...testData.value, ...testData.value, ...testData.value];
        });
        
        // 开始表格1自动滚动
        const startAutoScroll1 = () => {
            if (scrollInterval1) return;
            
            scrollInterval1 = setInterval(() => {
                if (scrollContainer1.value) {
                    scrollContainer1.value.scrollTop += 1;
                    
                    // 当滚动到2/3时重置（无缝循环）
                    const maxScroll = scrollContainer1.value.scrollHeight - scrollContainer1.value.clientHeight;
                    const resetPoint = maxScroll * 0.66;
                    
                    if (scrollContainer1.value.scrollTop >= resetPoint) {
                        scrollContainer1.value.scrollTop = 0;
                    }
                }
            }, 50);
        };
        
        // 开始表格2自动滚动
        const startAutoScroll2 = () => {
            if (scrollInterval2) return;
            
            scrollInterval2 = setInterval(() => {
                if (scrollContainer2.value) {
                    scrollContainer2.value.scrollTop += 1;
                    
                    // 当滚动到2/3时重置（无缝循环）
                    const maxScroll = scrollContainer2.value.scrollHeight - scrollContainer2.value.clientHeight;
                    const resetPoint = maxScroll * 0.66;
                    
                    if (scrollContainer2.value.scrollTop >= resetPoint) {
                        scrollContainer2.value.scrollTop = 0;
                    }
                }
            }, 50);
        };
        
        // 停止自动滚动
        const stopAutoScroll = () => {
            if (scrollInterval1) {
                clearInterval(scrollInterval1);
                scrollInterval1 = null;
            }
            if (scrollInterval2) {
                clearInterval(scrollInterval2);
                scrollInterval2 = null;
            }
        };
        
        // 监听 show 属性变化
        watch(() => props.show, (newVal) => {
            if (newVal) {
                // 面板打开时，等待 DOM 渲染完成后启动滚动
                nextTick(() => {
                    setTimeout(() => {
                        console.log('Starting scroll...', scrollContainer1.value, scrollContainer2.value);
                        startAutoScroll1();
                        startAutoScroll2();
                    }, 500);
                });
            } else {
                // 面板关闭时停止滚动
                stopAutoScroll();
                if (scrollContainer1.value) scrollContainer1.value.scrollTop = 0;
                if (scrollContainer2.value) scrollContainer2.value.scrollTop = 0;
            }
        });
        
        onUnmounted(() => {
            stopAutoScroll();
        });
        
        return {
            shipData,
            testData,
            displayShipData,
            displayTestData,
            scrollContainer1,
            scrollContainer2
        };
    }
};
</script>

<style scoped>
/* 淡入缩放动画 */
.fade-scale-enter-active,
.fade-scale-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-scale-enter-from {
    opacity: 0;
    transform: scale(0.95);
}

.fade-scale-leave-to {
    opacity: 0;
    transform: scale(0.95);
}

/* 自定义滚动条 */
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

/* 段落首行缩进 */
.indent-8 {
    text-indent: 2em;
}

/* 移除平滑滚动 */
.scroll-smooth-none {
    scroll-behavior: auto !important;
}

/* 隐藏滚动条 */
.scroll-smooth-none::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
}
</style>
