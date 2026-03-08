<template>
    <div v-if="show" class="fixed left-[520px] bottom-8 w-[880px] z-30 pointer-events-auto animate-slideInUp">
        <!-- 提升系统主面板 -->
        <div class="p-4 relative max-h-[55vh] flex flex-col" 
             style="background: rgba(15, 30, 60, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); box-shadow: 0 -10px 40px rgba(6, 182, 212, 0.2), inset 0 0 60px rgba(6, 182, 212, 0.1); border-radius: 12px;">
            <!-- 标题栏 -->
            <div class="flex items-center justify-between mb-3 border-b-2 border-cyan-500/30 pb-2 flex-shrink-0">
                <div class="flex items-center gap-3">
                    <div class="w-1.5 h-5 bg-yellow-400 shadow-[0_0_10px_#facc15]"></div>
                    <h3 class="text-xl font-bold text-white tracking-wider">提升系统</h3>
                    <span class="text-xs font-['Orbitron'] text-cyan-500 opacity-80 font-bold tracking-widest">LIFTING SYSTEM</span>
                </div>
                <button @click="$emit('close')" class="text-slate-400 hover:text-white transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <!-- 内容区域 - 可滚动 -->
            <div class="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1 min-h-0">
                <!-- 文字说明 -->
                <div class="bg-slate-800/40 border border-slate-700/50 rounded p-3 space-y-2 text-slate-300 leading-relaxed flex-shrink-0">
                    <p class="text-sm">
                        深海矿产混输提升方式可分为<span class="text-cyan-400 font-bold">流体管道提升式、链斗式、穿梭舱式</span>三种，基于水力的流体管道提升系统被认为最具商业前景。大部分的输送系统方案采用了提升硬管系统-中继舱-辅助软管-海底采矿车的模式，其中硬管中串联的混输泵是系统的核心部分，美国OMI公司、日本JOGMEC公司、韩国KRISO等单位分别设计和研制了多台多级串联泵的方案。管道连接方面，除JOGMEC公司的螺纹连接式外，大多数方案采用法兰式连接。德国Siegen大学曾提出全软管输送系统方案。
                    </p>
                    <p class="text-sm">
                        对于混输泵管系统的研制，美国OMI公司研制了多款多级潜水混输泵，并在5000米级海试中得到验证。加拿大鹦鹉螺矿业公司采用了隔膜泵形式，将动力系统移至水上，虽可降低堵塞风险，但系统十分复杂（上百个控制阀），增加了故障风险，至今尚未完成海试验证。德国、美国和日本等国企业或机构的设计和海试实践表明，<span class="text-green-400 font-bold">离心泵水力提升或气力提升方式更适合深海矿产混输</span>。
                    </p>
                </div>

                <!-- 表格：主要输送系统试验及参数 -->
                <div class="bg-slate-800/40 border border-slate-700/50 rounded overflow-hidden flex-shrink-0">
                    <div class="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 px-3 py-2 border-b border-cyan-500/30 sticky top-0 z-10">
                        <h4 class="text-sm font-bold text-cyan-300">主要输送系统试验及参数</h4>
                    </div>
                    <!-- 表格容器 - 自动滚动 -->
                    <div ref="tableScrollContainer" class="max-h-[180px] overflow-y-auto custom-scrollbar" @mouseenter="pauseAutoScroll" @mouseleave="resumeAutoScroll">
                        <table class="w-full text-sm">
                            <thead class="bg-slate-700/50 sticky top-0 z-10">
                                <tr class="text-slate-300">
                                    <th class="px-3 py-2 text-center border-r border-slate-600 bg-slate-700/50">序号</th>
                                    <th class="px-3 py-2 text-center border-r border-slate-600 bg-slate-700/50">时间</th>
                                    <th class="px-3 py-2 text-center border-r border-slate-600 bg-slate-700/50">单位</th>
                                    <th class="px-3 py-2 text-center border-r border-slate-600 bg-slate-700/50">水深</th>
                                    <th class="px-3 py-2 text-center border-r border-slate-600 bg-slate-700/50">输运方式</th>
                                    <th class="px-3 py-2 text-center bg-slate-700/50">结核输送能力</th>
                                </tr>
                            </thead>
                            <tbody class="text-slate-200">
                                <tr v-for="(item, index) in liftingSystemData" :key="index" 
                                    class="border-t border-slate-700/30 hover:bg-cyan-500/10 transition-colors">
                                    <td class="px-3 py-2 text-center border-r border-slate-700/30">{{ item.id }}</td>
                                    <td class="px-3 py-2 text-center border-r border-slate-700/30">{{ item.year }}</td>
                                    <td class="px-3 py-2 border-r border-slate-700/30">{{ item.organization }}</td>
                                    <td class="px-3 py-2 text-center border-r border-slate-700/30">{{ item.depth }}</td>
                                    <td class="px-3 py-2 border-r border-slate-700/30">{{ item.method }}</td>
                                    <td class="px-3 py-2 text-center">{{ item.capacity }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue';

export default {
    name: 'LiftingSystemPanel',
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['close'],
    setup(props) {
        // 提升系统试验数据
        const liftingSystemData = ref([
            { id: 1, year: '1978', organization: '美国海洋矿业协会（OMA）', depth: '4570m', method: '气力管道提升', capacity: '/' },
            { id: 2, year: '1979', organization: '美国海洋矿物公司（OMCO）', depth: '5000m', method: '水力、气力管道提升', capacity: '40t/h' },
            { id: 3, year: '1996', organization: '印度国家海洋技术研究所（NIOT）、德国提坦大学', depth: '500m', method: '水力管道提升', capacity: '/' },
            { id: 4, year: '2015', organization: '韩国海洋科学技术院（KIOST）、海洋工程研究所（KRISO）', depth: '1370m', method: '水力管道提升', capacity: '/' },
            { id: 5, year: '2016', organization: '中国五矿长沙矿冶研究院', depth: '300m', method: '水力管道提升', capacity: '50t/h' },
            { id: 6, year: '2017', organization: '日本石油天然气金属矿物资源机构（JOGMEC）', depth: '1600m', method: '水力管道提升', capacity: '/' },
            { id: 7, year: '2021', organization: '大连理工大学、长沙矿冶研究院', depth: '500m', method: '水力管道提升', capacity: '35t/h' },
            { id: 8, year: '2022', organization: '加拿大金属公司（TMC）', depth: '4300m', method: '气力管道提升', capacity: '86.4t/h' }
        ]);

        // 表格滚动容器引用
        const tableScrollContainer = ref(null);
        
        // 自动滚动相关
        let autoScrollInterval = null;
        let isPaused = false;
        
        /**
         * 启动自动滚动
         */
        const startAutoScroll = () => {
            if (autoScrollInterval) return;
            
            autoScrollInterval = setInterval(() => {
                if (!isPaused && tableScrollContainer.value) {
                    const container = tableScrollContainer.value;
                    const maxScroll = container.scrollHeight - container.clientHeight;
                    
                    // 平滑滚动
                    if (container.scrollTop < maxScroll) {
                        container.scrollTop += 1;
                    } else {
                        // 滚动到底部后，等待1秒再回到顶部
                        setTimeout(() => {
                            if (container) {
                                container.scrollTop = 0;
                            }
                        }, 1000);
                    }
                }
            }, 50); // 每50ms滚动1px，速度适中
        };
        
        /**
         * 停止自动滚动
         */
        const stopAutoScroll = () => {
            if (autoScrollInterval) {
                clearInterval(autoScrollInterval);
                autoScrollInterval = null;
            }
        };
        
        /**
         * 暂停自动滚动（鼠标悬停时）
         */
        const pauseAutoScroll = () => {
            isPaused = true;
        };
        
        /**
         * 恢复自动滚动（鼠标离开时）
         */
        const resumeAutoScroll = () => {
            isPaused = false;
        };
        
        // 监听show属性变化
        watch(() => props.show, (newVal) => {
            if (newVal) {
                // 面板显示时启动自动滚动
                setTimeout(() => {
                    startAutoScroll();
                }, 500); // 延迟500ms启动，等待动画完成
            } else {
                // 面板隐藏时停止自动滚动
                stopAutoScroll();
            }
        });
        
        onMounted(() => {
            if (props.show) {
                setTimeout(() => {
                    startAutoScroll();
                }, 500);
            }
        });
        
        onUnmounted(() => {
            stopAutoScroll();
        });

        return {
            liftingSystemData,
            tableScrollContainer,
            pauseAutoScroll,
            resumeAutoScroll
        };
    }
};
</script>

<style scoped>
@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-slideInUp {
    animation: slideInUp 0.4s ease-out;
}

/* 自定义滚动条样式 */
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.3);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(6, 182, 212, 0.5);
    border-radius: 3px;
    transition: background 0.3s;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(6, 182, 212, 0.8);
}
</style>
