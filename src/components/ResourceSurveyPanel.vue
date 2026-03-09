<template>
    <transition name="slide-up">
        <div v-if="show && selectedCountriesData.length > 0" class="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-auto">
            <div class="tech-panel-enhanced p-4 w-[58rem] max-h-[22rem] overflow-hidden relative" style="clip-path: polygon(0 0, 100% 0, 100% 95%, 98% 100%, 0 100%);">
                <!-- 动态扫描线 -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse"></div>
                <div class="corner-decoration corner-tl"></div>
                <div class="corner-decoration corner-tr"></div>
                
                <!-- 标题栏 -->
                <div class="flex items-center justify-between mb-3 border-b-2 border-green-500/30 pb-2">
                    <div class="flex items-center gap-2">
                        <div class="w-1 h-5 bg-green-400 shadow-[0_0_10px_#4ade80]"></div>
                        <h3 class="text-lg font-bold text-white">资源调查列表</h3>
                        <div class="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                            {{ selectedCountriesData.length }}
                        </div>
                    </div>
                    <button @click="$emit('close')" class="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-700/50 rounded">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <!-- 表头 -->
                <div class="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-700/50 border-b border-slate-600/50 text-sm text-slate-300 font-bold">
                    <div class="col-span-1 text-center">序号</div>
                    <div class="col-span-2">国家</div>
                    <div class="col-span-4">调查重点</div>
                    <div class="col-span-5">主要成果</div>
                </div>

                <!-- 资源调查列表 -->
                <div class="overflow-y-auto max-h-[14rem] custom-scrollbar">
                    <div 
                        v-for="(country, index) in selectedCountriesData" 
                        :key="country.id"
                        class="grid grid-cols-12 gap-2 px-3 py-3 border-b border-slate-600/40 hover:bg-opacity-20 cursor-pointer transition-all duration-200 group relative border-l-4"
                        :style="`border-left-color: ${country.color}; background-color: ${country.color}10;`"
                    >
                        <!-- 序号 -->
                        <div class="col-span-1 flex items-center justify-center">
                            <div 
                                class="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold"
                                :style="`background-color: ${country.color}40; color: ${country.color};`"
                            >
                                {{ index + 1 }}
                            </div>
                        </div>
                        
                        <!-- 国家 -->
                        <div class="col-span-2 flex items-center">
                            <span 
                                class="text-sm px-2 py-1 rounded font-bold"
                                :style="`background-color: ${country.color}30; color: ${country.color};`"
                            >
                                {{ country.name }}
                            </span>
                        </div>
                        
                        <!-- 调查重点 -->
                        <div class="col-span-4 flex items-center">
                            <span class="text-white text-sm leading-relaxed">
                                {{ country.focus }}
                            </span>
                        </div>
                        
                        <!-- 主要成果 -->
                        <div class="col-span-5 flex items-center">
                            <span class="text-white text-sm leading-relaxed">
                                {{ country.achievements }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
import { computed } from 'vue';

// 各国资源调查数据
const COUNTRY_SURVEY_DATA = {
    usa: {
        id: 'usa',
        name: '美国',
        color: '#0066FF',
        focus: '全域地质构造调查、能源矿产资源调查、深下资源勘探、生态环境研究',
        achievements: `托马斯多金斯、阿蒙森-斯科特等站两大核心站点，构建了完整的地质勘探体系。率先完成横贯南极山脉、罗斯陆架等区域的系统勘察，素有勘探先驱者千里干线铁矿与稀有金属地质图，开展边缘与深海矿产调查，建立全球最大的南极地质数据库，同时开展阳石、冰芯等特殊材料在冰下湖基础探测，主导南极油气资源遥感探测，在冰床下湖与深海矿产方面取得关键性突破。`
    },
    russia: {
        id: 'russia',
        name: '俄罗斯',
        color: '#FFD700',
        focus: '东南极内陆地质矿产调查、深部地质构造、冰下资源勘探',
        achievements: `主导东南极内陆地质构造，完成东方站深冰芯（全球首个冰芯之一）、探明毛德后区稀有金属矿产分布，建立南极地质与矿产档案，系统勘探南极与资源分布，在冰床下湖与深海矿产方面取得关键性突破，为南极矿产与资源分布研究奠定关键数据库。`
    },
    japan: {
        id: 'japan',
        name: '日本',
        color: '#FF1493',
        focus: '开展精细化地质与矿产调查、陨星稀有资源冰盖下探测、稀有金属、陨石资源探测',
        achievements: `完成毛德后地质站点调查，探明稀有金属分布，全球首个系统开展南极石油资源调查的国家之一，开展南极冰盖与矿产资源调查，陨星与冰下湖基础探测，为南极矿产与资源分布研究奠定关键数据库，技术领域取得重大突破。`
    },
    uk: {
        id: 'uk',
        name: '英国',
        color: '#00FFFF',
        focus: '完成东南极沿海大陆架探测、重点勘探东南极沿海大陆架与多金属矿产',
        achievements: `参与南极大陆架油气资源合勘探，建立南极地质与资源数据库，参与南极油气资源与资源勘探体系，结合内陆资源调查数据。`
    },
    australia: {
        id: 'australia',
        name: '澳大利亚',
        color: '#00FF00',
        focus: '东南极地质调查、矿产资源评估、南大洋海底资源勘探',
        achievements: `依托地缘优势，在东南极开展大规模地质调查，建立了完善的南极矿产资源数据库，参与多个国际合作项目，在冰下矿产探测和海底资源评估方面取得重要进展。`
    },
    china: {
        id: 'china',
        name: '中国',
        color: '#FF0000',
        focus: '东南极内陆地质、陨石资源、冰下接湖、生态友好型勘探技术',
        achievements: `在格罗夫大山地区回收陨石超1.2万块，数量位居全球第三；开展拉斯曼丘陵、伊丽莎白公主地地质测绘与样品采集，探明区域矿产分布；完成南极冰盖钻探与冰下基岩采样，参与南极地质与资源化与资源分布研究；建立自主南极地质与矿产数据库，重点开展铁矿、煤田及稀有金属科研探测。`
    },
    argentina_chile: {
        id: 'argentina_chile',
        name: '阿根廷、智利',
        color: '#87CEEB',
        focus: '追踪、陨源矿量译、完成南极半岛多金属矿与威德尔海油气资源、陨星极地气候与矿产关联研究',
        achievements: `参与南极大陆架油气资源合勘探，建立南极地质与资源数据库，参与南极油气资源与资源勘探体系，地缘优势突出。`
    },
    germany_korea_india: {
        id: 'germany_korea_india',
        name: '德国、韩国、印度',
        color: '#FFA500',
        focus: '依托各自常年站，开展区域性地质调查，陨星区域生态与矿产资源同步监测，地缘优势突出',
        achievements: `依托各自常年站，开展区域性地质调查，探明区域矿产分布，补充南极矿产调查数据。`
    }
};

export default {
    name: 'ResourceSurveyPanel',
    props: {
        show: {
            type: Boolean,
            default: false
        },
        selectedCountries: {
            type: Array,
            default: () => []
        }
    },
    emits: ['close'],
    setup(props) {
        const selectedCountriesData = computed(() => {
            if (!props.selectedCountries || props.selectedCountries.length === 0) return [];
            return props.selectedCountries
                .map(countryId => COUNTRY_SURVEY_DATA[countryId])
                .filter(data => data !== undefined);
        });
        
        return {
            selectedCountriesData
        };
    }
};
</script>

<style scoped>
/* 科技面板样式 */
.tech-panel-enhanced {
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.92) 0%, rgba(51, 65, 85, 0.92) 100%);
    backdrop-filter: blur(20px);
    border: 2px solid rgba(34, 197, 94, 0.4);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

/* 角落装饰 */
.corner-decoration {
    position: absolute;
    width: 12px;
    height: 12px;
    border: 2px solid rgba(34, 197, 94, 0.6);
}

.corner-tl {
    top: -2px;
    left: -2px;
    border-right: none;
    border-bottom: none;
}

.corner-tr {
    top: -2px;
    right: -2px;
    border-left: none;
    border-bottom: none;
}

/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(30, 41, 59, 0.3);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(34, 197, 94, 0.6);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(34, 197, 94, 0.8);
}

/* 滑入动画 */
.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
    opacity: 0;
    transform: translate(-50%, 100px);
}

.slide-up-enter-to,
.slide-up-leave-from {
    opacity: 1;
    transform: translate(-50%, 0);
}
</style>
