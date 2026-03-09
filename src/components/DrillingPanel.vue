<template>
    <div class="absolute top-36 left-8 w-[28rem] z-40 flex flex-col gap-6 pointer-events-none font-['Noto_Sans_SC'] animate-slideInLeft">
        
        <!-- 钻孔面板 -->
        <transition name="slide-down">
            <div v-if="showPanel" class="tech-panel-enhanced p-6 pointer-events-auto relative group" style="clip-path: polygon(0 0, 100% 0, 100% 95%, 92% 100%, 0 100%);">
                <!-- 动态扫描线 -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
                <div class="corner-decoration corner-tl scale-125"></div>
                <div class="corner-decoration corner-tr scale-125"></div>
            
                <div class="flex items-center mb-6 border-b-2 border-cyan-500/30 pb-3">
                    <div class="w-1.5 h-6 bg-yellow-400 mr-3 shadow-[0_0_10px_#facc15]"></div>
                    <h3 class="text-2xl font-bold text-white tracking-wider flex-1">大洋钻探</h3>
                    <button 
                        @click="showStatistics = !showStatistics"
                        class="mr-3 px-3 py-1.5 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/50 rounded transition-all duration-300 flex items-center gap-2 group"
                        :class="showStatistics ? 'bg-cyan-600/50 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : ''"
                    >
                        <svg class="w-4 h-4 text-cyan-400 group-hover:text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                        <span class="text-cyan-400 group-hover:text-cyan-300 text-sm font-bold">统计</span>
                    </button>
                    <div class="text-xs font-['Orbitron'] text-cyan-500 opacity-80 font-bold tracking-widest">OCEAN DRILLING</div>
                </div>

                <div class="space-y-5 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2 custom-scrollbar">
                    
                    <!-- 第一类：钻孔站位 -->
                    <div class="space-y-2">
                        <div class="flex items-center justify-between cursor-pointer hover:bg-slate-800/30 p-2 rounded transition-all" @click="showDrillingSitesPanel = !showDrillingSitesPanel">
                            <div class="flex items-center gap-2">
                                <svg class="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"/>
                                </svg>
                                <span class="text-blue-400 text-base font-bold">钻孔站位</span>
                                <span v-if="activeDrillingSites.length > 0" class="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">{{ activeDrillingSites.length }}</span>
                            </div>
                            <svg class="w-5 h-5 text-blue-400 transition-transform duration-300" :class="{ 'rotate-180': showDrillingSitesPanel }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <transition name="slide-down">
                            <div v-if="showDrillingSitesPanel" class="space-y-2 bg-slate-900/30 p-2 rounded">
                                <div 
                                    v-for="site in DRILLING_CATEGORIES.DRILLING_SITES.items" 
                                    :key="site.id"
                                    @click="toggleDrillingSite(site.id)"
                                    class="flex flex-col p-3 rounded-lg cursor-pointer transition-all duration-300 group"
                                    :class="activeDrillingSites.includes(site.id) ? getDrillingSiteClass(site.id) : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700 border-l-4 border-transparent hover:border-blue-500/50'"
                                >
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-3">
                                            <div class="w-2 h-2 rounded-full" :class="activeDrillingSites.includes(site.id) ? 'bg-white' : 'bg-slate-600 group-hover:bg-blue-400'"></div>
                                            <span class="font-medium">{{ site.label }}</span>
                                        </div>
                                        <svg v-if="activeDrillingSites.includes(site.id)" class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                                        </svg>
                                    </div>
                                    <!-- <div class="text-xs mt-1 ml-5 opacity-70">
                                        {{ site.nameEn }} ({{ site.period }})
                                    </div> -->
                                </div>
                            </div>
                        </transition>
                    </div>

                    <!-- 第二类：依托平台 -->
                    <div class="space-y-2 pt-2 border-t-2 border-cyan-500/30">
                        <div class="flex items-center justify-between cursor-pointer hover:bg-slate-800/30 p-2 rounded transition-all" @click="showPlatformsPanel = !showPlatformsPanel">
                            <div class="flex items-center gap-2">
                                <svg class="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z"/>
                                    <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z"/>
                                    <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z"/>
                                </svg>
                                <span class="text-cyan-400 text-base font-bold">依托平台</span>
                                <span v-if="activePlatforms.length > 0" class="px-2 py-0.5 bg-cyan-500 text-white text-xs font-bold rounded-full">{{ activePlatforms.length }}</span>
                            </div>
                            <svg class="w-5 h-5 text-cyan-400 transition-transform duration-300" :class="{ 'rotate-180': showPlatformsPanel }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <transition name="slide-down">
                            <div v-if="showPlatformsPanel" class="space-y-2 bg-slate-900/30 p-2 rounded">
                                <div 
                                    v-for="platform in DRILLING_CATEGORIES.PLATFORMS.items" 
                                    :key="platform.id"
                                    @click="togglePlatform(platform.id)"
                                    class="flex flex-col p-3 rounded-lg cursor-pointer transition-all duration-300 group"
                                    :class="activePlatforms.includes(platform.id) ? getPlatformClass(platform.id) : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700 border-l-4 border-transparent hover:border-cyan-500/50'"
                                >
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-3">
                                            <div class="w-2 h-2 rounded-full" :class="activePlatforms.includes(platform.id) ? 'bg-white' : 'bg-slate-600 group-hover:bg-cyan-400'"></div>
                                            <span class="font-medium">{{ platform.label }}</span>
                                        </div>
                                        <svg v-if="activePlatforms.includes(platform.id)" class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                                        </svg>
                                    </div>
                                    <!-- <div class="text-xs mt-1 ml-5 opacity-70">
                                        {{ platform.nameEn }} ({{ platform.period }})
                                    </div> -->
                                </div>
                            </div>
                        </transition>
                    </div>

                    <!-- 第三类：岩芯库 -->
                    <div class="space-y-2 pt-2 border-t-2 border-green-500/30">
                        <div class="flex items-center justify-between cursor-pointer hover:bg-slate-800/30 p-2 rounded transition-all" @click="showCoreRepositoriesPanel = !showCoreRepositoriesPanel">
                            <div class="flex items-center gap-2">
                                <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"/>
                                </svg>
                                <span class="text-green-400 text-base font-bold">岩芯库</span>
                                <span v-if="selectedCoreRepository" class="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">1</span>
                            </div>
                            <svg class="w-5 h-5 text-green-400 transition-transform duration-300" :class="{ 'rotate-180': showCoreRepositoriesPanel }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <transition name="slide-down">
                            <div v-if="showCoreRepositoriesPanel" class="flex gap-2 p-2 bg-slate-900/30 rounded">
                                <div 
                                    @click="selectCoreRepository('usa')"
                                    class="flex-1 relative py-3 px-3 rounded-lg cursor-pointer transition-all duration-300 group overflow-hidden"
                                    :class="selectedCoreRepository === 'usa' ? 'bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-800/60 text-white hover:bg-slate-700 border border-slate-700 hover:border-blue-500/50'"
                                >
                                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                    <div class="relative text-center">
                                        <span class="font-medium text-sm">美国</span>
                                    </div>
                                </div>
                                <div 
                                    @click="selectCoreRepository('germany')"
                                    class="flex-1 relative py-3 px-3 rounded-lg cursor-pointer transition-all duration-300 group overflow-hidden"
                                    :class="selectedCoreRepository === 'germany' ? 'bg-gradient-to-br from-yellow-600 to-yellow-800 text-white shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'bg-slate-800/60 text-white hover:bg-slate-700 border border-slate-700 hover:border-yellow-500/50'"
                                >
                                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                    <div class="relative text-center">
                                        <span class="font-medium text-sm">德国</span>
                                    </div>
                                </div>
                                <div 
                                    @click="selectCoreRepository('japan')"
                                    class="flex-1 relative py-3 px-3 rounded-lg cursor-pointer transition-all duration-300 group overflow-hidden"
                                    :class="selectedCoreRepository === 'japan' ? 'bg-gradient-to-br from-red-600 to-red-800 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-slate-800/60 text-white hover:bg-slate-700 border border-slate-700 hover:border-red-500/50'"
                                >
                                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                    <div class="relative text-center">
                                        <span class="font-medium text-sm">日本</span>
                                    </div>
                                </div>
                            </div>
                        </transition>
                    </div>

                    <!-- 第四类：管理框架 -->
                    <div class="space-y-2 pt-2 border-t-2 border-purple-500/30">
                        <div class="flex items-center justify-between cursor-pointer hover:bg-slate-800/30 p-2 rounded transition-all" @click="showManagementPanel = !showManagementPanel">
                            <div class="flex items-center gap-2">
                                <svg class="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
                                </svg>
                                <span class="text-purple-400 text-base font-bold">管理框架</span>
                            </div>
                            <svg class="w-5 h-5 text-purple-400 transition-transform duration-300" :class="{ 'rotate-180': showManagementPanel }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <transition name="slide-down">
                            <div v-if="showManagementPanel" class="flex gap-2 p-2 bg-slate-900/30 rounded">
                                <div 
                                    v-for="mgmt in DRILLING_CATEGORIES.MANAGEMENT.items" 
                                    :key="mgmt.id"
                                    @click="toggleManagement(mgmt.id)"
                                    class="flex-1 relative py-3 px-3 rounded-lg cursor-pointer transition-all duration-300 group overflow-hidden text-center bg-slate-800/60 text-white hover:bg-slate-700 border border-slate-700 hover:border-purple-500/50"
                                >
                                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                    <div class="relative">
                                        <span class="font-medium text-sm">{{ mgmt.label }}</span>
                                    </div>
                                </div>
                            </div>
                        </transition>
                    </div>

                </div>
            </div>
        </transition>
        
        <!-- 统计面板 -->
        <DrillingStatisticsPanel 
            :show="showStatistics"
            @close="showStatistics = false"
        />
    </div>
</template>

<script>
import { ref } from 'vue';
import { DRILLING_CATEGORIES, DRILLING_COLORS } from '../constants.js';
import DrillingStatisticsPanel from './DrillingStatisticsPanel.vue';

export default {
    name: 'DrillingPanel',
    components: {
        DrillingStatisticsPanel
    },
    props: {
        showPanel: {
            type: Boolean,
            default: true
        }
    },
    emits: ['filterChange', 'showManagementFramework', 'selectCoreRepository'],
    setup(props, { emit }) {
        // 状态管理
        const activeDrillingSites = ref([]);
        const activePlatforms = ref([]);
        const activeCoreRepositories = ref([]);
        const activeManagement = ref([]);
        
        // 面板展开状态
        const showDrillingSitesPanel = ref(true);
        const showPlatformsPanel = ref(true);
        const showCoreRepositoriesPanel = ref(true);
        const showManagementPanel = ref(true);
        const showStatistics = ref(false);  // 统计面板状态
        
        // 发送筛选条件变化事件
        const emitFilter = () => {
            emit('filterChange', {
                drillingSites: activeDrillingSites.value,
                platforms: activePlatforms.value,
                coreRepositories: activeCoreRepositories.value,
                management: activeManagement.value
            });
        };
        
        // 切换钻孔站位
        const toggleDrillingSite = (siteId) => {
            const index = activeDrillingSites.value.indexOf(siteId);
            if (index > -1) {
                activeDrillingSites.value.splice(index, 1);
            } else {
                activeDrillingSites.value.push(siteId);
            }
            emitFilter();
        };
        
        // 获取钻孔站位样式类
        const getDrillingSiteClass = (siteId) => {
            const color = DRILLING_COLORS[siteId] || '#3B82F6';
            const colorMap = {
                '#FF6B6B': 'bg-gradient-to-r from-red-600 to-red-700 text-white border-l-4 border-red-300',
                '#4ECDC4': 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white border-l-4 border-cyan-300',
                '#FFD93D': 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white border-l-4 border-yellow-300',
                '#95E1D3': 'bg-gradient-to-r from-green-600 to-green-700 text-white border-l-4 border-green-300'
            };
            return colorMap[color] || 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-l-4 border-blue-300';
        };
        
        // 切换依托平台
        const togglePlatform = (platformId) => {
            const index = activePlatforms.value.indexOf(platformId);
            if (index > -1) {
                activePlatforms.value.splice(index, 1);
            } else {
                activePlatforms.value.push(platformId);
            }
            emitFilter();
        };
        
        // 获取平台样式类
        const getPlatformClass = (platformId) => {
            const color = DRILLING_COLORS[platformId] || '#4ECDC4';
            const colorMap = {
                '#FF6B6B': 'bg-gradient-to-r from-red-600 to-red-700 text-white border-l-4 border-red-300',
                '#4ECDC4': 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white border-l-4 border-cyan-300',
                '#FFD93D': 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white border-l-4 border-yellow-300',
                '#95E1D3': 'bg-gradient-to-r from-green-600 to-green-700 text-white border-l-4 border-green-300',
                '#F38181': 'bg-gradient-to-r from-pink-600 to-pink-700 text-white border-l-4 border-pink-300'
            };
            return colorMap[color] || 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white border-l-4 border-cyan-300';
        };
        
        // 岩心库选中状态（单选）
        const selectedCoreRepository = ref(null);
        
        // 选择岩心库
        const selectCoreRepository = (countryId) => {
            console.log('🖱️ DrillingPanel: 点击岩心库按钮', countryId);
            // 如果点击已选中的，则取消选择
            if (selectedCoreRepository.value === countryId) {
                selectedCoreRepository.value = null;
                console.log('🖱️ DrillingPanel: 取消选择，发送null');
                // 通知父组件隐藏岩心库
                emit('selectCoreRepository', null);
            } else {
                // 选择新的国家
                selectedCoreRepository.value = countryId;
                console.log('🖱️ DrillingPanel: 选择新国家，发送', countryId);
                // 通知父组件加载岩心库并飞到对应点位
                emit('selectCoreRepository', countryId);
            }
        };
        
        // 切换管理框架
        const toggleManagement = (mgmtId) => {
            // 只触发显示管理框架面板，不改变选中状态
            emit('showManagementFramework', mgmtId);
        };
        
        return {
            DRILLING_CATEGORIES,
            activeDrillingSites,
            activePlatforms,
            selectedCoreRepository,
            activeManagement,
            showDrillingSitesPanel,
            showPlatformsPanel,
            showCoreRepositoriesPanel,
            showManagementPanel,
            showStatistics,
            toggleDrillingSite,
            getDrillingSiteClass,
            togglePlatform,
            getPlatformClass,
            selectCoreRepository,
            toggleManagement
        };
    }
};
</script>

<style scoped>
/* 折叠面板动画 */
.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.3s ease;
    max-height: 500px;
    overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
    max-height: 0;
    opacity: 0;
    padding-top: 0;
    padding-bottom: 0;
}

/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.3);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(6, 182, 212, 0.5);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(6, 182, 212, 0.7);
}

/* 科技面板样式 */
.tech-panel-enhanced {
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
    backdrop-filter: blur(20px);
    border: 2px solid rgba(6, 182, 212, 0.3);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* 角落装饰 */
.corner-decoration {
    position: absolute;
    width: 12px;
    height: 12px;
    border: 2px solid rgba(6, 182, 212, 0.6);
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

/* 滑入动画 */
@keyframes slideInLeft {
    from {
        opacity: 0;
        transform: translateX(-50px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.animate-slideInLeft {
    animation: slideInLeft 0.5s ease-out;
}
</style>
