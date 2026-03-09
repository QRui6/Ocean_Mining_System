<template>
    <transition name="fade-scale">
        <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <!-- 主面板容器 -->
            <div class="relative w-[1100px] max-h-[90vh] pointer-events-auto ml-[150px] mt-[50px] overflow-hidden rounded-xl shadow-2xl" 
                 style="background: rgba(15, 30, 60, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);">
                <!-- 顶部装饰线 -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
                
                <!-- 边框发光效果 -->
                <div class="absolute inset-0 rounded-xl pointer-events-none" style="box-shadow: inset 0 0 60px rgba(6, 182, 212, 0.1), 0 0 40px rgba(6, 182, 212, 0.2);"></div>
                
                <!-- 标题栏 -->
                <div class="flex items-center px-8 pt-5 pb-4 border-b-2 border-cyan-500/30 relative z-10">
                    <div class="w-1.5 h-7 bg-yellow-400 mr-4 shadow-[0_0_10px_#facc15]"></div>
                    <h3 class="text-3xl font-bold text-white tracking-wider flex-1">技术成熟度</h3>
                    <div class="text-xs font-['Orbitron'] text-cyan-500 opacity-80 font-bold tracking-widest">TECHNOLOGY MATURITY</div>
                </div>
                
                <!-- 内容区域 - 左右布局 -->
                <div class="flex h-[calc(90vh-85px)]">
                    <!-- 左侧：图片区域 40% -->
                    <div class="w-[40%] p-5 border-r border-slate-700/50">
                        <div class="bg-slate-900/50 rounded-lg border border-cyan-500/20 h-full overflow-hidden">
                            <!-- 技术成熟度图片 - 铺满容器 -->
                            <img 
                                src="/image/img.png" 
                                alt="技术成熟度路线图" 
                                class="w-full h-full object-fill"
                            />
                        </div>
                    </div>
                    
                    <!-- 右侧：技术列表 60% -->
                    <div class="w-[60%] p-5 flex items-center">
                        <div class="w-full space-y-2">
                            <!-- 技术卡片 - 紧凑布局，带颜色背景 -->
                            <div 
                                v-for="(tech, index) in technologies" 
                                :key="index"
                                class="relative rounded-lg p-3 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all cursor-pointer group overflow-hidden"
                                :style="{ 
                                    background: `linear-gradient(135deg, ${tech.color}15, ${tech.color}25)`,
                                    border: `1px solid ${tech.color}40`
                                }"
                                @click="openDetail(tech)"
                            >
                                <!-- 左侧颜色条 -->
                                <div 
                                    class="absolute left-0 top-0 bottom-0 w-1 transition-all group-hover:w-1.5"
                                    :style="{ backgroundColor: tech.color }"
                                ></div>
                                
                                <!-- 技术编号和标题 -->
                                <div class="flex items-center gap-3 pl-2">
                                    <!-- 数字编号 -->
                                    <div 
                                        class="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center shadow-lg transition-all border-2"
                                        :style="{ 
                                            background: `linear-gradient(135deg, ${tech.color}40, ${tech.color}60)`,
                                            borderColor: tech.color,
                                            boxShadow: `0 0 10px ${tech.color}60`
                                        }"
                                    >
                                        <span class="text-lg font-bold text-white font-['Orbitron']">{{ index + 1 }}</span>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <h4 class="text-base font-bold text-white mb-0.5">{{ tech.name }}</h4>
                                        <p class="text-slate-300 text-xs leading-relaxed line-clamp-2">
                                            {{ tech.description }}
                                        </p>
                                    </div>
                                    <!-- 查看详情箭头 -->
                                    <div class="flex-shrink-0 transition-colors" :style="{ color: tech.color }">
                                        <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </transition>
    
    <!-- 技术详情弹窗 -->
    <TechnologyDetailDialog 
        :show="showDetail"
        :technology="selectedTech"
        @close="closeDetail"
    />
</template>

<script>
import { ref } from 'vue';
import TechnologyDetailDialog from './TechnologyDetailDialog.vue';

export default {
    components: {
        TechnologyDetailDialog
    },
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['close'],
    setup() {
        const showDetail = ref(false);
        const selectedTech = ref(null);
        
        // 七大技术数据（添加颜色配置）
        const technologies = ref([
            {
                name: '通用技术',
                color: '#3b82f6', // 蓝色
                description: '构建并完善国内深海采矿通用技术装备体系，围绕关键技术及装备重新协同发展，重点发展传感器、数据组网通信、智能控制技术与水下航行器。',
                details: '构建并完善国内深海采矿通用技术装备体系，围绕关键技术及装备重新协同发展，重点发展传感器、数据组网通信、智能控制技术与水下航行器。一是深入研究各型传感器基础理论与传感机理，利用新型功能材料、新结构设计、新工艺技术等提高深海传感器性能；二是通过高精度定位、组合导航、智能组网和多模态通信等手段，提高数据的利用率；三是开展深海复合材料的研发，大幅度提高关键部件及开采装置的使用寿命，提高深海矿产资源开发的无故障工作的时间；四是系统开展深海矿产资源的多源数据融合能力、智能水下机器人分析，厘清深海资源的可开采能力，构建基于数字化技术的智能系统，实现深海采矿数字化平台的无人化、自动化和智能化运维；五是突破矿区环境探测技术、大深度取样作业技术、智能选矿机器人技术等一系列关键技术，并完成技术示范和商业化应用。'
            },
            {
                name: '勘探技术',
                color: '#8b5cf6', // 紫色
                description: '一是建立健全深海矿产资源高效精准勘探技术指南、规范和规程；二是推动以深海集群无人潜水器为平台的近底原位高精度探测技术的发展，重点发展高频声学、三维激光扫描、高光谱成像、高精度电法和磁法探测技术。',
                details: '一是建立健全深海矿产资源高效精准勘探技术指南、规范和规程；二是推动以深海集群无人潜水器为平台的近底原位高精度探测技术的发展，重点发展高频声学、三维激光扫描、高光谱成像、高精度电法和磁法探测技术，以及深海原位模拟取样测试分析技术；三是系统开展深海矿产资源矿区的高效精准勘探能力建设，构建服务深海矿产资源评估、采矿支撑决策、环境保护监测的"深海矿区数字化一张图"系统。'
            },
            {
                name: '平台技术',
                color: '#06b6d4', // 青色
                description: '以深海采矿平台中长期发展技术需求为牵引，实现平台总体技术与功能系统技术、供能技术、作业安全及运维保障技术协同突破，支撑5000m级深海采矿联动试验及商业化开采技术能力的实现。',
                details: '以深海采矿平台中长期发展技术需求为牵引，实现平台总体技术与功能系统技术、供能技术、作业安全及运维保障技术协同突破，支撑5000m级深海采矿联动试验及商业化开采技术能力的实现。一是以5000m级国际原位矿区深海采矿联动海试为目标，开展海试船平台研究与设计，重点突破大深度重载布放回收技术、矿物处理及储存转运技术、深海采矿水面作业支持技术、深海采矿系统中央控制及水面-水下协同作业技术，并开展深海采矿联动力应用可行性论证、技术方案研究及零碳能源应用可行性论证；启动以矿区原位试验为目标的船舶平台建造，研制多目标重载协同布放回收系统、大深度串载柔性悬挂系统等水面支撑装备，支撑深海采矿联动海试的实施，并兼顾支持试开采。二是以商业化深海采矿为目标，重点突破商业化采矿平台技术、采选冶一体化平台技术、经济绿色供能技术、商业化水下生产系统协同布放回收技术、重载矿浆输送系统作业支持技术、中央控制及水下多系统智能化控制与调度技术、作业安全及运维保障技术、高海况下采矿系统应急避险技术等关键技术，构建包括船平台、布放回收及作业支持、平台能源供给、作业安全及运维保障等满足商业化深海采矿的平台技术体系，支撑商业化深海采矿平台技术的工业应用。'
            },
            {
                name: '开采技术',
                color: '#10b981', // 绿色
                description: '以场景为牵引，面向我国国际海底矿区商业化开发，开展包括深海采矿系统总体技术、深海采矿车技术及深海采矿矿物提升技术的研究，并针对不同矿种分阶段成果验证与全系统联动矿区海试验证。',
                details: '以场景为牵引，面向我国国际海底矿区商业化开发，开展包括深海采矿系统总体技术、深海采矿车技术及深海采矿矿物提升技术的研究，并针对不同矿种分阶段成果验证与全系统联动矿区海试验证。针对深海采矿系统总体技术，重点开展深海多金属结核智能穿梭式采矿技术、深海矿产资源集-输送联动分析技术、水下装备动力输配及能源供给技术及高噪声水下组网与协同作业指挥技术；针对深海采矿车技术，主要聚焦矿物种类不同、赋存条件不同及采方式不同，开展深海多金属结核开采技术、深海多金属硫化物开采技术、深海富钴结壳开采技术及深海稀土开采技术的研究，从而采矿车装备的不同，开展深海矿车装备升级技术、深海气力式矿物提升技术及深海新型提升技术的研究，研制相关装备，完成海试验证。最终形成深海矿产资源开发装备的工程设计、制造集成、作业和运维保障综合能力，并推动高技术船舶与海洋工程、高端机械、电子信息、材料等行业的高质量发展，在我国国际海底矿区域实现深海矿区资源的规模化开发，形成商业化开发能力。'
            },
            {
                name: '环境技术',
                color: '#f59e0b', // 橙色
                description: '建立健全国内深海环境保护相关制度，推动以关键技术突破为主体的装备-技术-工程协同发展，重点发展环境监测、环境影响评价、环境管理与环境修复技术。',
                details: '建立健全国内深海环境保护相关制度，推动以关键技术突破为主体的装备-技术-工程协同发展，重点发展环境监测、环境影响评价、环境管理与环境修复技术。一是突破各项关键技术，研制具有高度自主知识产权的深海环境感知装备，进一步我完善我国深海矿区环境与生物监测、评估与保护能力；二是以我国深海多金属结核矿区为示范区，结核采矿试验验证环保技术与装备的科学性与适应性，实现关键技术的应用示范，打造一批具有自主知识产权且具备工业化前景的深海监测与环保设备，全面提升我国深海环境保护能力；三是以支撑深海矿产资源商业化开采为目标，全面提升各项技术的科学性与设备的稳定性，实现国产深海监测与环保装备的商业化，形成完备的深海环境保护能力，保障深海矿产资源商业化开采的顺利实施。'
            },
            {
                name: '选冶技术',
                color: '#ef4444', // 红色
                description: '在现有基础上建立健全深海多金属矿产资源选冶技术体系，推动以多金属结核、富钴结壳完整研究和多金属硫化、稀土元素物等选冶研究为主体的选冶技术的发展。',
                details: '在现有基础上建立健全深海多金属矿产资源选冶技术体系，推动以多金属结核、富钴结壳完整研究和多金属硫化、稀土元素物等选冶研究为主体的选冶技术的发展。重点发展低碳高效选冶技术、短流程矿物选冶工程装备科技，以船载预地抽盖富集及装置研发为重点，进行概念性机研制和试验验证。主要建系统开采我国深海多金属矿产资源选冶技术体系，选冶技术发展目标为：围绕国内外相关矿产资源的选冶技术现状及装备能力，构建先进的基于我国深海矿产资源低碳高效经济利用的成套技术体系。一是创建并应用基于深海多金属矿产资源特点的低碳高效双级取技术，创新并实践基于船载矿物预处理-陆地加工模式，建立适用于深海矿产资源低碳高效经济利用的成套技术体系。二是发展深海矿物船载预地抽盖工程装备科技，以船载预地抽盖富集及装置研发为重点，进行概念性机研制和试验验证。主要建系统开采我国深海多金属矿产资源的选冶技术现状及装备能力，构建先进的基于我国深海矿产资源低碳高效经济利用的成套技术体系，提高资源利用率和选冶效率，实现我国在深海多金属矿产资源选冶技术与装备研发中的领先地位。'
            },
            {
                name: '管理支撑技术',
                color: '#ec4899', // 粉色
                description: '一是通过构建价格波动预警模型，监测深海采矿矿产品价格变化，二是围绕深海采矿可持续发展和与国际接轨，研发各国开发政策动向监管模拟与决策支撑模型，构建与国际接轨的开发配套标准与规范技术体系。',
                details: '一是通过构建价格波动预警模型，监测深海采矿矿产品价格变化，二是围绕深海采矿可持续发展和与国际接轨，研发各国开发政策动向监管模拟与决策支撑模型，构建与国际接轨的开发配套标准与规范技术体系。并通过研发相关技术开展深海采矿试采和相关技术装备的可靠性，为大规模商业化开发提供可靠技术支撑。开展深海采矿系统全生命周期运行管理技术以及风险识别和应对技术研究，为深海采矿商业化开发进行管理技术储备。'
            }
        ]);
        
        const openDetail = (tech) => {
            selectedTech.value = tech;
            showDetail.value = true;
        };
        
        const closeDetail = () => {
            showDetail.value = false;
            selectedTech.value = null;
        };
        
        return {
            technologies,
            showDetail,
            selectedTech,
            openDetail,
            closeDetail
        };
    }
};
</script>

<style scoped>
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

.custom-scrollbar::-webkit-scrollbar {
    width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.5);
    border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(6, 182, 212, 0.5);
    border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(6, 182, 212, 0.7);
}
</style>
