<template>
    <transition name="timeline-fade">
        <div v-if="show" class="fixed bottom-0 left-0 right-0 z-50 flex items-end justify-center pointer-events-none pb-4">
            <!-- 时间线容器 - 稍微向左移动 -->
            <div class="w-full max-w-5xl ml-[10rem] mr-4 pointer-events-auto">
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
                <div class="relative bg-gradient-to-r from-blue-900/20 via-blue-800/25 to-blue-900/20 backdrop-blur-md border-2 border-cyan-500/30 rounded-lg p-4 shadow-[0_0_40px_rgba(6,182,212,0.2)]">
                    <!-- 关闭按钮 -->
                    <!-- <button @click="handleClose" 
                            class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-slate-800/80 hover:bg-red-600 border border-slate-600 hover:border-red-500 rounded transition-all text-slate-400 hover:text-white z-10">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button> -->

                    <!-- 标题 -->
                    <div class="text-center mb-4">
                        <h2 class="text-2xl font-bold text-white mb-1">{{ currentCountry }}政策动态时间线</h2>
                        <p class="text-cyan-400 text-xs">{{ currentCountry }} Policy Dynamics Timeline</p>
                    </div>

                    <!-- 时间线 -->
                    <div class="relative px-6 py-3">
                        <!-- 阶段标签层 -->
                        <div class="relative mb-3 h-14">
                            <!-- 第一阶段标签 -->
                            <div class="absolute left-0 top-0 text-center"
                                 style="width: 12%;">
                                <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-lg font-bold text-sm shadow-lg border-2 border-blue-400/50 h-12 flex items-center justify-center">
                                    早期立法与单边主张阶段
                                </div>
                                <div class="text-sm text-blue-300 mt-0.5 font-semibold">～1980</div>
                            </div>
                            
                            <!-- 第二阶段标签 -->
                            <div class="absolute top-0 text-center"
                                 style="left: 14%; width: 12%;">
                                <div class="bg-gradient-to-r from-purple-700 to-purple-800 text-white px-3 py-2 rounded-lg font-bold text-sm shadow-lg border-2 border-purple-400/50 h-12 flex items-center justify-center">
                                    国际协调与法理悬置阶段
                                </div>
                                <div class="text-sm text-purple-300 mt-0.5 font-semibold">1994-2020</div>
                            </div>
                            
                            <!-- 第三阶段标签 - 横跨多个节点 -->
                            <div class="absolute top-0 text-center"
                                 style="left: 28%; width: 60%;">
                                <div class="bg-gradient-to-r from-red-600 via-red-700 to-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg border-2 border-red-400/50 h-12 flex items-center justify-center">
                                    深海采矿战略加速与单边推进阶段
                                </div>
                                <div class="text-sm text-red-300 mt-0.5 font-semibold">2021-2025</div>
                            </div>
                        </div>
                        
                        <!-- 主连接线 - 贯穿节点中间 -->
                        <div class="absolute top-[155px] left-6 right-[70px] h-[4px] bg-gradient-to-r from-blue-500/70 via-cyan-400/80 to-cyan-500/70 z-0"></div>
                        
                        <!-- 箭头 -->
                        <div class="absolute right-6 z-0" style="top: 155px; transform: translateY(-50%);">
                            <div class="flex items-center">
                                <div class="w-[50px] h-[4px] bg-gradient-to-r from-cyan-500/70 to-emerald-400/90"></div>
                                <div class="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[18px] border-l-emerald-400/90"></div>
                            </div>
                        </div>
                        
                        <!-- 时间节点容器 -->
                        <div class="relative flex justify-between items-start z-10">
                            <div v-for="(node, index) in timelineNodes" 
                                 :key="node.year"
                                 class="flex flex-col items-center cursor-pointer group relative"
                                 @click="selectNode(node)">
                                
                                <!-- 上方内容 -->
                                <div class="text-center mb-2 max-w-[140px] h-[75px] flex flex-col justify-end transition-all duration-300">
                                    <!-- 节点标签（偶数索引） -->
                                    <div v-if="index % 2 === 0" class="font-bold mb-1.5 whitespace-nowrap transition-all duration-300"
                                         :class="selectedNode?.year === node.year ? 'text-xl' : 'text-lg'"
                                         :style="{ 
                                             color: node.labelColor,
                                             textShadow: selectedNode?.year === node.year ? `0 0 10px ${node.labelColor}` : 'none',
                                             transform: selectedNode?.year === node.year ? 'scale(1.1)' : 'scale(1)'
                                         }">
                                        {{ node.shortLabel || node.label }}
                                    </div>
                                </div>
                                
                                <!-- 节点 - 横向六边形 -->
                                <div class="relative z-10 flex-shrink-0">
                                    <div v-if="selectedNode?.year === node.year" 
                                         class="absolute inset-0 animate-ping hexagon-shape"
                                         :style="{ backgroundColor: node.color, opacity: 0.4 }">
                                    </div>
                                    
                                    <div class="hexagon-shape w-20 h-14 flex items-center justify-center font-bold text-white transition-all duration-300 shadow-lg relative"
                                         :style="{ 
                                             backgroundColor: selectedNode?.year === node.year ? node.color : node.color + 'cc',
                                             transform: selectedNode?.year === node.year ? 'scale(1.25)' : 'scale(1)',
                                             boxShadow: selectedNode?.year === node.year ? `0 0 25px ${node.color}, 0 0 45px ${node.color}80` : `0 4px 12px ${node.color}60`
                                         }">
                                        <span class="text-base">{{ node.year }}</span>
                                        
                                        <div v-if="selectedNode?.year === node.year"
                                             class="absolute inset-0 border-[3px] border-white/70 animate-pulse hexagon-shape">
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- 下方内容 -->
                                <div class="text-center mt-2 max-w-[140px] h-[75px] flex flex-col justify-start transition-all duration-300">
                                    <!-- 节点标签（奇数索引） -->
                                    <div v-if="index % 2 === 1" class="font-bold mb-1.5 whitespace-nowrap transition-all duration-300"
                                         :class="selectedNode?.year === node.year ? 'text-xl' : 'text-lg'"
                                         :style="{ 
                                             color: node.labelColor,
                                             textShadow: selectedNode?.year === node.year ? `0 0 10px ${node.labelColor}` : 'none',
                                             transform: selectedNode?.year === node.year ? 'scale(1.1)' : 'scale(1)'
                                         }">
                                        {{ node.shortLabel || node.label }}
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

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    country: {
        type: String,
        default: '美国'
    }
});

const emit = defineEmits(['close']);

const selectedNode = ref(null);

// 当前国家
const currentCountry = computed(() => props.country || '美国');

// 美国政策动态数据
const usaPolicyData = {
    stages: [
        { title: '早期立法与单边主张阶段', subtitle: '～1980', color: '#3b82f6' },
        { title: '国际协调与法理悬置阶段', subtitle: '1994-2020', color: '#6b21a8' },
        { title: '深海采矿战略加速与单边推进阶段', subtitle: '2021-2025', color: '#dc2626' }
    ],
    nodes: [
        {
            year: '～1980',
            label: '早期立法与单边主张阶段',
            shortLabel: '早期立法',
            stageLabel: '早期立法与单边主张阶段',
            stageLabelColor: '#3b82f6',
            description: '在《联合国海洋法公约》生效前，完成国内立法，1980年《深海海底矿产资源法》；依法颁发首批深海国际海底勘探许可证；与英、法、德、日等国建立"互惠国家制度"，担承认发放的深海采矿许可证。',
            color: '#3b82f6',
            labelColor: '#60a5fa',
            detailDescription: '在《联合国海洋法公约》生效前，美国完成了国内立法，制定了1980年《深海海底矿产资源法》，为深海采矿活动提供法律基础。',
            details: [
                '制定《深海海底矿产资源法》',
                '颁发首批深海国际海底勘探许可证',
                '与英、法、德、日等国建立"互惠国家制度"',
                '承认其他国家发放的深海采矿许可证'
            ]
        },
        {
            year: '1994-2020',
            label: '国际协调与法理意见阶段',
            shortLabel: '国际协调',
            stageLabel: '国际协调与法理悬置阶段',
            stageLabelColor: '#6b21a8',
            description: '1994年《公约》第十一部分修定；互惠制国家签署而加入公约，美国未加入；各国及国际海底管理局认可未经ISA授权的国际海底勘探开发许可；《深海海底固体矿产资源法》实际进入意见期。',
            color: '#6b21a8',
            labelColor: '#a78bfa',
            detailDescription: '1994年《公约》第十一部分修订后，互惠制国家签署并加入公约，但美国未加入。各国及国际海底管理局认可未经ISA授权的国际海底勘探开发许可。',
            details: [
                '《公约》第十一部分修订通过',
                '互惠制国家陆续加入公约',
                '美国未加入公约',
                '《深海海底固体矿产资源法》进入意见征询期'
            ]
        },
        {
            year: '2021-2025',
            label: '深海采矿战略加速与单边推进阶段',
            shortLabel: '战略加速',
            stageLabel: '深海采矿战略加速与单边推进阶段',
            stageLabelColor: '#dc2626',
            description: '2021年，TMC担保国瑙鲁触发"两年协定"根据公约规定ISA两年内制定并采取章；开发规章未出台。',
            color: '#dc2626',
            labelColor: '#f87171',
            detailDescription: '2021年，TMC担保国瑙鲁触发"两年协定"，根据公约规定ISA需在两年内制定并采取章程，但开发规章未能如期出台。',
            details: [
                'TMC担保国瑙鲁触发"两年协定"',
                'ISA面临两年内制定规章的压力',
                '开发规章未能如期出台',
                '美国加速单边推进深海采矿战略'
            ]
        },
        {
            year: '2025.04',
            label: '特朗普签发总统行政令《释放美国近海矿产资源潜力》',
            shortLabel: '总统行政令',
            description: '特朗普签发总统行政令《释放美国近海矿产资源潜力》',
            color: '#dc2626',
            labelColor: '#f87171',
            detailDescription: '2025年7月，特朗普签发总统行政令《释放美国近海矿产资源潜力》，进一步推动美国深海采矿战略。',
            details: [
                '签发总统行政令',
                '释放美国近海矿产资源潜力',
                '加速深海采矿项目审批',
                '强化美国在深海资源开发中的主导地位'
            ]
        },
        {
            year: '2025.06',
            label: '内政部政策调整',
            shortLabel: '内政部调整',
            description: '内政部政策调整',
            color: '#dc2626',
            labelColor: '#f87171',
            detailDescription: '2025年9月，美国内政部进行政策调整，进一步明确深海采矿的监管框架和审批流程。',
            details: [
                '内政部发布新政策指导',
                '明确深海采矿监管框架',
                '简化审批流程',
                '加强环境保护要求'
            ]
        },
        {
            year: '2025.07',
            label: '商务部修订《深海海底固体矿产资源法》',
            shortLabel: '商务部修订',
            description: '商务部修订《深海海底固体矿产资源法》',
            color: '#dc2626',
            labelColor: '#a78bfa',
            detailDescription: '2025年9月，美国商务部修订《深海海底固体矿产资源法》，更新法律条款以适应当前深海采矿技术和国际形势。',
            details: [
                '修订《深海海底固体矿产资源法》',
                '更新法律条款',
                '适应新技术发展',
                '强化国际竞争力'
            ]
        },
        {
            year: '2026',
            label: '最新动态',
            shortLabel: '最新动态',
            description: '最新动态',
            color: '#dc2626',
            labelColor: '#f87171',
            detailDescription: '2026年及以后，美国将继续推进深海采矿战略，整理并发布最新政策动态。',
            details: [

            ]
        }
    ]
};

// 根据国家获取对应的数据
const stages = computed(() => {
    // 这里可以根据不同国家返回不同的阶段数据
    return usaPolicyData.stages;
});

const timelineNodes = computed(() => {
    // 这里可以根据不同国家返回不同的节点数据
    return usaPolicyData.nodes;
});

const selectNode = (node) => {
    selectedNode.value = node;
};

const handleClose = () => {
    selectedNode.value = null;
    emit('close');
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

/* 横向六边形形状 */
.hexagon-shape {
    clip-path: polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%);
}
</style>
