<template>
    <transition name="timeline-fade">
        <div v-if="show" class="fixed bottom-0 left-0 right-0 z-50 flex items-end justify-center pointer-events-none pb-6">
            <!-- 时间线容器 - 向右偏移避免遮挡左侧面板，位于底部 -->
            <div class="w-full max-w-6xl ml-[18rem] mr-8 pointer-events-auto">
                <!-- 详细信息弹窗 -->
                <transition name="detail-slide">
                    <div v-if="selectedNode" class="mb-4 bg-gradient-to-r from-slate-900/90 via-slate-800/95 to-slate-900/90 backdrop-blur-xl border-2 border-cyan-400/50 rounded-lg p-6 shadow-[0_0_50px_rgba(6,182,212,0.4)]">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h3 class="text-2xl font-bold text-white mb-2">{{ selectedNode.year }}年</h3>
                                <div class="text-lg font-semibold mb-1" :style="{ color: selectedNode.labelColor }">
                                    {{ selectedNode.label }}
                                </div>
                            </div>
                            <button @click="selectedNode = null" 
                                    class="w-8 h-8 flex items-center justify-center bg-slate-700/80 hover:bg-red-600 border border-slate-500 hover:border-red-500 rounded transition-all text-slate-300 hover:text-white">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                        <div class="text-white/90 text-base leading-relaxed">
                            <p class="mb-3">{{ selectedNode.detailDescription }}</p>
                            <div v-if="selectedNode.details" class="space-y-2">
                                <div v-for="(detail, idx) in selectedNode.details" :key="idx" class="flex items-start">
                                    <span class="text-cyan-400 mr-2">•</span>
                                    <span>{{ detail }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </transition>
                
                <!-- 时间线主体 -->
                <div class="relative bg-gradient-to-r from-blue-900/20 via-blue-800/25 to-blue-900/20 backdrop-blur-md border-2 border-cyan-500/30 rounded-lg p-6 shadow-[0_0_40px_rgba(6,182,212,0.2)]">
                    <!-- 关闭按钮 -->
                    <!-- <button @click="$emit('close')" 
                            class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-slate-800/80 hover:bg-red-600 border border-slate-600 hover:border-red-500 rounded transition-all text-slate-400 hover:text-white z-10">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button> -->

                    <!-- 标题 -->
                    <div class="text-center mb-6">
                        <h2 class="text-2xl font-bold text-white mb-1">开发规章时间线</h2>
                        <p class="text-cyan-400 text-xs">Development Regulations Timeline</p>
                    </div>

                    <!-- 时间线 -->
                    <div class="relative px-8 py-8">
                        <!-- 主连接线 - 贯穿所有节点，固定在中间位置 -->
                        <div class="absolute top-[120px] left-8 right-[80px] h-[4px] bg-gradient-to-r from-blue-500/70 via-cyan-400/80 to-cyan-500/70 z-0"></div>
                        
                        <!-- 箭头 - 与连接线完美对齐 -->
                        <div class="absolute right-8 z-0" style="top: 120px; transform: translateY(-50%);">
                            <div class="flex items-center">
                                <div class="w-[60px] h-[4px] bg-gradient-to-r from-cyan-500/70 to-emerald-400/90"></div>
                                <div class="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[18px] border-l-emerald-400/90"></div>
                            </div>
                        </div>
                        
                        <!-- 时间节点容器 -->
                        <div class="relative flex justify-between items-start z-10">
                            <div v-for="(node, index) in timelineNodes" 
                                 :key="node.year"
                                 class="flex flex-col items-center cursor-pointer group relative"
                                 @click="selectNode(node)">
                                
                                <!-- 上方文字（偶数索引） -->
                                <div v-if="index % 2 === 0" class="text-center mb-4 max-w-[120px] h-[80px] flex flex-col justify-end transition-all duration-300">
                                    <div class="font-bold mb-1.5 whitespace-nowrap transition-all duration-300"
                                         :class="selectedNode?.year === node.year ? 'text-xl' : 'text-lg'"
                                         :style="{ 
                                             color: node.labelColor,
                                             textShadow: selectedNode?.year === node.year ? `0 0 10px ${node.labelColor}` : 'none',
                                             transform: selectedNode?.year === node.year ? 'scale(1.1)' : 'scale(1)'
                                         }">
                                        {{ node.label }}
                                    </div>
                                    <div class="text-white/95 leading-snug whitespace-pre-line transition-all duration-300 font-medium"
                                         :class="selectedNode?.year === node.year ? 'text-lg font-semibold' : 'text-base'">
                                        {{ node.description }}
                                    </div>
                                </div>
                                
                                <!-- 占位符（奇数索引上方） -->
                                <div v-else class="h-[80px] mb-4"></div>
                                
                                <!-- 节点圆圈 - 固定在同一水平线上 -->
                                <div class="relative z-10 flex-shrink-0">
                                    <!-- 外圈发光效果 -->
                                    <div v-if="selectedNode?.year === node.year" 
                                         class="absolute inset-0 rounded-full animate-ping"
                                         :style="{ backgroundColor: node.color, opacity: 0.4 }">
                                    </div>
                                    
                                    <!-- 主圆圈 -->
                                    <div class="w-16 h-16 rounded-full flex items-center justify-center text-base font-bold text-white transition-all duration-300 shadow-lg relative"
                                         :style="{ 
                                             backgroundColor: selectedNode?.year === node.year ? node.color : node.color + 'cc',
                                             transform: selectedNode?.year === node.year ? 'scale(1.25)' : 'scale(1)',
                                             boxShadow: selectedNode?.year === node.year ? `0 0 25px ${node.color}, 0 0 45px ${node.color}80` : `0 4px 12px ${node.color}60`
                                         }">
                                        {{ node.year }}
                                        
                                        <!-- 选中状态的边框 -->
                                        <div v-if="selectedNode?.year === node.year"
                                             class="absolute inset-0 rounded-full border-[3px] border-white/70 animate-pulse">
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- 下方文字（奇数索引） -->
                                <div v-if="index % 2 === 1" class="text-center mt-4 max-w-[120px] h-[80px] flex flex-col justify-start transition-all duration-300">
                                    <div class="font-bold mb-1.5 whitespace-nowrap transition-all duration-300"
                                         :class="selectedNode?.year === node.year ? 'text-xl' : 'text-lg'"
                                         :style="{ 
                                             color: node.labelColor,
                                             textShadow: selectedNode?.year === node.year ? `0 0 10px ${node.labelColor}` : 'none',
                                             transform: selectedNode?.year === node.year ? 'scale(1.1)' : 'scale(1)'
                                         }">
                                        {{ node.label }}
                                    </div>
                                    <div class="text-white/95 leading-snug whitespace-pre-line transition-all duration-300 font-medium"
                                         :class="selectedNode?.year === node.year ? 'text-lg font-semibold' : 'text-base'">
                                        {{ node.description }}
                                    </div>
                                </div>
                                
                                <!-- 占位符（偶数索引下方） -->
                                <div v-else class="h-[80px] mt-4"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
    show: {
        type: Boolean,
        default: false
    }
});

defineEmits(['close']);

const selectedNode = ref(null);

const timelineNodes = [
    {
        year: 2011,
        label: '',
        description: '开发规章\n草案起草',
        color: '#1e40af',
        labelColor: '#60a5fa',
        detailDescription: '2011年，国际海底管理局开始起草深海采矿开发规章草案，标志着深海矿产资源开发进入规范化阶段。',
        details: [
            '法律和技术委员会启动开发规章起草工作',
            '确定了深海采矿活动的基本法律框架',
            '开始征集各成员国和利益相关方的意见'
        ]
    },
    {
        year: 2014,
        label: '',
        description: '开发规章\n零号草案',
        color: '#1e40af',
        labelColor: '#60a5fa',
        detailDescription: '2014年，法律和技术委员会继续完善开发规章草案，增加了环境保护和技术标准等重要内容。',
        details: [
            '发布开发规章零号草案',
            '加强环境影响评估要求',
            '明确承包者的权利和义务'
        ]
    },
    {
        year: 2017,
        label: '',
        description: '计划出台未实现',
        color: '#dc2626',
        labelColor: '#f87171',
        detailDescription: '2017年，法律和技术委员会完成草案并提交理事会审议，但由于各方分歧较大，未能如期出台。',
        details: [
            '法技委向理事会提交完整草案',
            '各成员国对利益分享机制存在分歧',
            '环境保护标准引发广泛讨论'
        ]
    },
    {
        year: 2019,
        label: '',
        description: '法技委完成草案\n并提交理事会',
        color: '#1e40af',
        labelColor: '#60a5fa',
        detailDescription: '2019年，法技委根据各方意见继续修订草案，进一步完善了开发规章的各项条款。',
        details: [
            '根据成员国反馈修订草案',
            '增加了海洋生物多样性保护条款',
            '完善了争端解决机制'
        ]
    },
    {
        year: 2020,
        label: '',
        description: '计划出台\n未实现',
        color: '#dc2626',
        labelColor: '#f87171',
        detailDescription: '2020年，受新冠疫情影响，国际海底管理局会议推迟，开发规章未能按计划出台。',
        details: [
            '新冠疫情导致会议延期',
            '各国对经济复苏优先级调整',
            '技术标准仍需进一步讨论'
        ]
    },
    {
        year: 2021,
        label: '',
        description: '瑙鲁触发\n"两年规则"',
        color: '#1e40af',
        labelColor: '#60a5fa',
        detailDescription: '2021年，瑙鲁代表其担保的承包者触发《联合国海洋法公约》"两年规则"，要求在两年内完成开发规章制定。',
        details: [
            '瑙鲁正式触发"两年规则"',
            '国际海底管理局面临时间压力',
            '加快了规章制定进程'
        ]
    },
    {
        year: 2023,
        label: '',
        description: '计划出台\n未实现',
        color: '#dc2626',
        labelColor: '#f87171',
        detailDescription: '2023年，尽管"两年规则"期限已到，但由于各方在关键问题上仍存在分歧，开发规章未能出台。',
        details: [
            '"两年规则"期限到期',
            '环境保护与经济开发平衡问题未解决',
            '利益分享机制仍在协商中'
        ]
    },
    {
        year: 2025,
        label: '',
        description: '未能出台',
        color: '#7c3aed',
        labelColor: '#a78bfa',
        detailDescription: '2025年，国际社会继续就开发规章进行磋商，但由于技术、环境和经济等多方面因素，规章仍未正式出台。',
        details: [
            '继续进行多轮磋商',
            '环保组织呼吁暂停深海采矿',
            '技术标准和监管框架仍在完善'
        ]
    },
    {
        year: 2026,
        label: '',
        description: '?',
        color: '#eab308',
        labelColor: '#fbbf24',
        detailDescription: '2026年及以后，深海采矿开发规章的制定仍充满不确定性，需要国际社会继续努力寻求共识。',
        details: [
            '各方继续寻求共识',
            '可能需要更多时间完善规章',
            '深海生态保护与资源开发的平衡仍是关键'
        ]
    }
];

const selectNode = (node) => {
    selectedNode.value = node;
};
</script>

<style scoped>
.timeline-fade-enter-active,
.timeline-fade-leave-active {
    transition: opacity 0.3s ease;
}

.timeline-fade-enter-from,
.timeline-fade-leave-to {
    opacity: 0;
}

.detail-slide-enter-active,
.detail-slide-leave-active {
    transition: all 0.3s ease;
}

.detail-slide-enter-from {
    opacity: 0;
    transform: translateY(20px);
}

.detail-slide-leave-to {
    opacity: 0;
    transform: translateY(-20px);
}
</style>
