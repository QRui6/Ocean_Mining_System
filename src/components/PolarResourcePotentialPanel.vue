<template>
    <transition name="slide-fade">
        <div v-if="show" class="fixed left-8 top-32 z-40 w-[500px] pointer-events-auto">
            <div class="relative backdrop-blur-md rounded-lg shadow-2xl overflow-hidden border"
                 style="background: var(--panel-bg); border-color: var(--panel-border);">
                
                <!-- 标题栏 -->
                <div class="flex items-center justify-between px-6 py-4 border-b"
                     style="background: var(--panel-header-bg); border-color: var(--panel-border);">
                    <div class="flex items-center gap-3">
                        <div class="w-1 h-6 rounded-full" style="background: var(--accent-cyan);"></div>
                        <h3 class="text-xl font-bold" style="color: var(--text-primary);">极地资源潜力</h3>
                    </div>
                    <button @click="$emit('close')" 
                            class="w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:bg-red-500/20"
                            style="color: var(--text-secondary);">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <!-- 内容区 -->
                <div class="max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                    <!-- 南极资源 -->
                    <div class="border-b" style="border-color: var(--panel-border);">
                        <button @click="toggleSection('antarctic')"
                                class="w-full px-6 py-4 flex items-center justify-between transition-all hover:bg-white/5">
                            <div class="flex items-center gap-3">
                                <span class="text-2xl">🇦🇶</span>
                                <span class="text-lg font-bold" style="color: var(--text-primary);">南极</span>
                            </div>
                            <svg class="w-5 h-5 transition-transform" 
                                 :class="{ 'rotate-180': expandedSections.antarctic }"
                                 style="color: var(--text-secondary);"
                                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </button>
                        
                        <transition name="expand">
                            <div v-if="expandedSections.antarctic" class="space-y-2">
                                <!-- 资源基础 -->
                                <div class="border-b" style="border-color: var(--panel-border);">
                                    <button @click="toggleSection('antarcticResources')"
                                            class="w-full px-6 py-3 flex items-center justify-between transition-all hover:bg-white/5">
                                        <span class="text-base font-bold" style="color: var(--text-primary);">资源基础</span>
                                        <svg class="w-4 h-4 transition-transform" 
                                             :class="{ 'rotate-180': expandedSections.antarcticResources }"
                                             style="color: var(--text-secondary);"
                                             fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                        </svg>
                                    </button>
                                    
                                    <transition name="expand">
                                        <div v-if="expandedSections.antarcticResources" class="px-6 pb-4 space-y-4">
                                            <!-- 能源矿产 -->
                                            <ResourceCategory title="能源矿产" :resources="antarcticResources.energy" />
                                            
                                            <!-- 金属矿产 -->
                                            <ResourceCategory title="金属矿产" :resources="antarcticResources.metal" />
                                            
                                            <!-- 非金属矿产及特殊资源 -->
                                            <ResourceCategory title="非金属矿产及特殊资源" :resources="antarcticResources.nonmetal" />
                                        </div>
                                    </transition>
                                </div>
                                
                                <!-- 资源调查情况 -->
                                <div>
                                    <button @click="toggleSection('antarcticSurvey')"
                                            class="w-full px-6 py-3 flex items-center justify-between transition-all hover:bg-white/5">
                                        <span class="text-base font-bold" style="color: var(--text-primary);">资源调查情况</span>
                                        <svg class="w-4 h-4 transition-transform" 
                                             :class="{ 'rotate-180': expandedSections.antarcticSurvey }"
                                             style="color: var(--text-secondary);"
                                             fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                        </svg>
                                    </button>
                                    
                                    <transition name="expand">
                                        <div v-if="expandedSections.antarcticSurvey" class="px-6 pb-4 space-y-2">
                                            <div v-for="(survey, index) in antarcticSurveys" :key="index"
                                                 class="p-3 rounded-lg border"
                                                 style="background: var(--panel-item-bg); border-color: var(--panel-border);">
                                                
                                                <!-- 国家名称 -->
                                                <div class="flex items-center gap-2 mb-2">
                                                    <div class="w-2 h-2 rounded-full" style="background: var(--header-highlight);"></div>
                                                    <span class="font-bold text-base" style="color: var(--text-primary);">{{ survey.country }}</span>
                                                </div>
                                                
                                                <!-- 调查信息 -->
                                                <div class="space-y-2 text-sm">
                                                    <div class="flex gap-2">
                                                        <span class="font-medium whitespace-nowrap" style="color: var(--text-secondary);">调查重点：</span>
                                                        <span style="color: var(--text-primary);">{{ survey.focus }}</span>
                                                    </div>
                                                    <div v-if="survey.results" class="flex gap-2">
                                                        <span class="font-medium whitespace-nowrap" style="color: var(--text-secondary);">主要成果：</span>
                                                        <span style="color: var(--text-primary);">{{ survey.results }}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </transition>
                                </div>
                            </div>
                        </transition>
                    </div>

                    <!-- 北极资源 -->
                    <div>
                        <button @click="toggleSection('arctic')"
                                class="w-full px-6 py-4 flex items-center justify-between transition-all hover:bg-white/5">
                            <div class="flex items-center gap-3">
                                <span class="text-2xl">🧊</span>
                                <span class="text-lg font-bold" style="color: var(--text-primary);">北极</span>
                            </div>
                            <svg class="w-5 h-5 transition-transform" 
                                 :class="{ 'rotate-180': expandedSections.arctic }"
                                 style="color: var(--text-secondary);"
                                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </button>
                        
                        <transition name="expand">
                            <div v-if="expandedSections.arctic" class="px-6 pb-4 space-y-4">
                                <div class="p-4 rounded-lg text-center" style="background: var(--panel-item-bg); color: var(--text-secondary);">
                                    北极资源数据开发中...
                                </div>
                            </div>
                        </transition>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
import { ref, reactive } from 'vue';
import ResourceCategory from './ResourceCategory.vue';

export default {
    name: 'PolarResourcePotentialPanel',
    components: {
        ResourceCategory
    },
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['close'],
    setup() {
        const expandedSections = reactive({
            antarctic: true,
            arctic: false,
            antarcticResources: true,  // 资源基础默认展开
            antarcticSurvey: false     // 资源调查情况默认折叠
        });

        const toggleSection = (section) => {
            expandedSections[section] = !expandedSections[section];
        };

        // 南极资源数据
        const antarcticResources = {
            energy: [
                {
                    type: '煤炭',
                    distribution: '横贯南极山脉（维多利亚地为主）',
                    reserves: '总储量超 5000 亿吨，为全球最大煤田之一',
                    features: '多为优质无烟煤，部分区域煤田裸露地表，易于探测'
                },
                {
                    type: '石油',
                    distribution: '罗斯海、威德尔海、阿蒙森海大陆架',
                    reserves: '预估储量 500-1000 亿桶',
                    features: '深海油气，埋藏深，勘探难度大，无具体开采矿点'
                },
                {
                    type: '天然气',
                    distribution: '南极周边大陆架深海区',
                    reserves: '天然气预估储量 30000-50000 亿立方米',
                    features: ''
                },
                {
                    type: '天然气水合物',
                    distribution: '南极周边大陆架',
                    reserves: '储量可观',
                    features: ''
                }
            ],
            metal: [
                {
                    type: '铁矿',
                    distribution: '东南极查尔斯王子山',
                    reserves: '总储量超千亿吨，品位高，可供全球使用约 200 年',
                    features: '全球最大铁矿带之一，矿体连片分布，冰盖下埋藏浅'
                },
                {
                    type: '多金属矿（铜、锰、铅、锌）',
                    distribution: '南极半岛、乔治五世海岸',
                    reserves: '仅南极半岛铜矿预估储量 1200-2500 万吨',
                    features: '南美安第斯山脉延伸段，多金属共生，潜在价值高'
                },
                {
                    type: '稀有/贵金属（铂、镍、钴、金、银、轴）',
                    distribution: '毛德皇后地、维多利亚地',
                    reserves: '深部矿产，潜在储量可观，战略价值极高',
                    features: '多伴生于其他矿床，勘探难度大，属于战略储备资源'
                }
            ],
            nonmetal: [
                {
                    type: '石墨',
                    distribution: '南极半岛火山带、横贯南极山脉',
                    reserves: '',
                    features: ''
                },
                {
                    type: '云母硫矿',
                    distribution: '南极半岛火山带、横贯南极山脉',
                    reserves: '',
                    features: ''
                },
                {
                    type: '淡水资源',
                    distribution: '南极',
                    reserves: '南极冰盖储存全球 70%以上可用淡水',
                    features: ''
                }
            ]
        };

        // 南极资源调查情况
        const antarcticSurveys = [
            {
                country: '中国',
                focus: '东南极内陆地质、陨石资源、冰下探测、生态友好型勘探技术。',
                results: '在格罗夫山地区回收陨石超 1.2 万块，数量位居全球第三；开展拉斯曼丘陵、伊丽莎白公主地地质测绘与样品采集，探明区域矿产分布；完成南极冰盖钻探与冰下基岩取样，参与南极地质演化与资源分布研究；建立自主南极地质与矿产数据库，重点开展铁矿、煤田及稀有金属矿探测。'
            },
            {
                country: '美国',
                focus: '全域地质构造推演、能源矿产预估、冰下矿产探测技术研发',
                results: '托麦克默多站、阿蒙森-斯科特站两大核心站点，构建了南极全域地质勘探体系。率先完成横贯南极山脉、罗斯海大陆架地质测绘，系统勘探查尔斯王子山铁矿与维多利亚地煤田，开展南极点周边冰下地质钻探；主导南极油气资源遥感探测，建立全球最完善的南极地质数据库；同时开展陨石、冰芯等科研取样，在冰下雷达与深部矿产探测领域处于全球领先。'
            },
            {
                country: '英国',
                focus: '点勘探南极半岛多金属矿与威德尔海油气资源，侧重极地气候与矿产关联研究；',
                results: ''
            },
            {
                country: '阿根廷、智利',
                focus: '依托南极半岛多座科考站，开展近岸地质调查，侧重区域生态与矿产资源同步监测，地缘优势突出；',
                results: ''
            },
            {
                country: '德国、韩国、印度',
                focus: '依托各自常年站，开展区域性地质勘探，参与国际联合科考，补充南极矿产调查数据。',
                results: ''
            },
            {
                country: '俄罗斯',
                focus: '东南极固体矿产、深部地质结构、冰下资源勘探',
                results: '主导东南极内陆地质探测，完成东方站深冰芯钻探（全球最深冰芯之一），探明毛德皇后地稀有金属与轴矿分布；系统勘探南极沿岸煤田与铁矿带，建立完善的南极地质与矿产档案；在冰下山脉、冰下湖探测领域取得突破性成果，为矿产资源分布研究提供关键数据'
            },
            {
                country: '日本',
                focus: '开展精细化地质与矿产调查，侧重稀有资源与冰盖下地质探测。',
                results: '完成毛德皇后地地质勘探，探明稀有金属分布；全球首个系统开展南极陨石调查的国家，收集陨石数量全球第一；开展南极冰盖厚度与冰下地形测绘，为矿产勘探提供基础数据；参与南极海洋矿产与油气资源联合调查，技术侧重极地探测设备研发。'
            },
            {
                country: '澳大利亚',
                focus: '东南极沿海固体矿产、区域地质构',
                results: '完成东南极沿海大面积地质测绘，重点勘探查尔斯王子山铁矿、麦克罗伯特森地多金属矿；'
            }
        ];

        return {
            expandedSections,
            toggleSection,
            antarcticResources,
            antarcticSurveys
        };
    }
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: var(--accent-cyan);
    border-radius: 3px;
}

.slide-fade-enter-active, .slide-fade-leave-active {
    transition: all 0.3s ease;
}

.slide-fade-enter-from {
    transform: translateX(-100%);
    opacity: 0;
}

.slide-fade-leave-to {
    transform: translateX(-100%);
    opacity: 0;
}

.expand-enter-active, .expand-leave-active {
    transition: all 0.3s ease;
    overflow: hidden;
}

.expand-enter-from, .expand-leave-to {
    max-height: 0;
    opacity: 0;
}

.expand-enter-to, .expand-leave-from {
    max-height: 2000px;
    opacity: 1;
}
</style>
