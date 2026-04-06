<template>
    <div class="absolute top-36 left-8 w-[28rem] z-40 flex flex-col gap-6 pointer-events-none font-['Noto_Sans_SC'] animate-slideInLeft">
        
        <!-- 态势总览面板 -->
        <transition name="slide-down">
            <div v-if="show" class="tech-panel-enhanced p-6 pointer-events-auto relative group" 
                 style="clip-path: polygon(0 0, 100% 0, 100% 95%, 92% 100%, 0 100%);">
                
                <!-- 动态扫描线 -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
                <div class="corner-decoration corner-tl scale-125"></div>
                <div class="corner-decoration corner-tr scale-125"></div>
                
                <!-- 标题 -->
                <div class="flex items-center mb-6 border-b-2 border-cyan-500/30 pb-3">
                    <div class="w-1.5 h-6 bg-yellow-400 mr-3 shadow-[0_0_10px_#facc15]"></div>
                    <h3 class="text-2xl font-bold text-white tracking-wider flex-1">态势总览</h3>
                    <div class="text-xs font-['Orbitron'] text-cyan-500 opacity-80 font-bold tracking-widest">OVERVIEW</div>
                </div>

                <div class="space-y-5 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                    
                    <!-- Level 1: 海上丝绸之路 -->
                    <div class="space-y-2">
                        <div class="flex items-center justify-between cursor-pointer hover:bg-slate-800/30 p-2 rounded transition-all" 
                             @click="showMaritimeSilkRoad = !showMaritimeSilkRoad">
                            <div class="flex items-center gap-2">
                                <div class="w-2 h-2 bg-blue-400 rotate-45 shadow-[0_0_6px_#60a5fa]"></div>
                                <span class="text-blue-400 text-base font-bold">海上丝绸之路</span>
                                <span v-if="getActiveCount('maritime_silk_road') > 0" class="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">{{ getActiveCount('maritime_silk_road') }}</span>
                            </div>
                            <svg class="w-5 h-5 text-blue-400 transition-transform duration-300" 
                                 :class="{ 'rotate-180': showMaritimeSilkRoad }" 
                                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <transition name="slide-down">
                            <div v-if="showMaritimeSilkRoad" class="space-y-2 bg-slate-900/30 p-2 rounded">
                                <template v-for="item in MARITIME_SILK_ROAD.items" :key="item.id">
                                    <!-- 矿产品进口（带三级结构） -->
                                    <div v-if="item.id === 'mineral_imports'" class="space-y-2">
                                        <div
                                            @click="toggleMineralImports"
                                            class="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-300 group"
                                            :class="hasActiveImportCommodity() ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-l-4 border-blue-300' : 'bg-slate-800/60 text-white hover:bg-slate-700 border-l-4 border-transparent hover:border-blue-500/50'"
                                        >
                                            <div class="flex items-center gap-3">
                                                <div
                                                    class="w-2 h-2 rounded-full"
                                                    :class="hasActiveImportCommodity() ? 'bg-yellow-400' : 'bg-slate-600 group-hover:bg-blue-400'"
                                                ></div>
                                                <span class="font-medium">{{ item.label }}</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <svg
                                                    v-if="hasActiveImportCommodity()"
                                                    class="w-5 h-5 text-yellow-400"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                                                </svg>
                                                <svg
                                                    class="w-4 h-4 text-blue-300 transition-transform duration-300"
                                                    :class="{ 'rotate-180': showMineralImports }"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                                </svg>
                                            </div>
                                        </div>

                                        <transition name="slide-down">
                                            <div v-if="showMineralImports" class="space-y-2 bg-slate-950/40 rounded p-2 border border-blue-500/20">
                                                <div v-for="category in MINERAL_IMPORT_CATEGORIES" :key="category.id" class="space-y-2">
                                                    <div class="text-xs tracking-wider font-bold px-2" :style="{ color: category.color }">
                                                        {{ category.label }}
                                                    </div>
                                                    <div class="grid grid-cols-2 gap-2">
                                                        <div
                                                            v-for="commodity in category.items"
                                                            :key="commodity.id"
                                                            @click.stop="handleImportCommodityClick(commodity.id)"
                                                            class="px-3 py-2 rounded-lg text-sm cursor-pointer transition-all duration-300 border"
                                                            :class="activeItems.includes(commodity.id) ? 'text-white' : 'bg-slate-800/70 text-slate-200 hover:bg-slate-700'"
                                                            :style="getCommodityButtonStyle(commodity)"
                                                        >
                                                            {{ commodity.label }}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </transition>
                                    </div>

                                    <!-- 其余海上丝绸之路子项 -->
                                    <div
                                        v-else
                                        @click="handleItemClick('maritime_silk_road', item.id)"
                                        class="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-300 group"
                                        :class="activeItems.includes(item.id) ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-l-4 border-blue-300' : 'bg-slate-800/60 text-white hover:bg-slate-700 border-l-4 border-transparent hover:border-blue-500/50'"
                                    >
                                        <div class="flex items-center gap-3">
                                            <div class="w-2 h-2 rounded-full" :class="activeItems.includes(item.id) ? 'bg-yellow-400' : 'bg-slate-600 group-hover:bg-blue-400'"></div>
                                            <span class="font-medium">{{ item.label }}</span>
                                        </div>
                                        <svg v-if="activeItems.includes(item.id)" class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                                        </svg>
                                    </div>
                                </template>
                            </div>
                        </transition>
                    </div>

                    <!-- Level 2: 海洋保护区 -->
                    <div class="space-y-2 pt-2 border-t-2 border-green-500/30">
                        <div class="flex items-center justify-between cursor-pointer hover:bg-slate-800/30 p-2 rounded transition-all"
                             @click="handleItemClick('marine_protected_areas', 'marine_protected_areas')">
                            <div class="flex items-center gap-2">
                                <div class="w-2 h-2 bg-green-400 rotate-45 shadow-[0_0_6px_#4ade80]"></div>
                                <span class="text-green-400 text-base font-bold">海洋保护区</span>
                            </div>
                        </div>
                    </div>

                    <!-- Level 3: 海底观测网 -->
                    <div class="space-y-2 pt-2 border-t-2 border-purple-500/30">
                        <div class="flex items-center justify-between cursor-pointer hover:bg-slate-800/30 p-2 rounded transition-all"
                             @click="showSeafloorObservation = !showSeafloorObservation">
                            <div class="flex items-center gap-2">
                                <div class="w-2 h-2 bg-purple-400 rotate-45 shadow-[0_0_6px_#c084fc]"></div>
                                <span class="text-purple-400 text-base font-bold">海底观测网</span>
                                <span v-if="getActiveCount('seafloor_observation') > 0" class="px-2 py-0.5 bg-purple-500 text-white text-xs font-bold rounded-full">{{ getActiveCount('seafloor_observation') }}</span>
                            </div>
                            <svg class="w-5 h-5 text-purple-400 transition-transform duration-300" 
                                 :class="{ 'rotate-180': showSeafloorObservation }" 
                                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <transition name="slide-down">
                            <div v-if="showSeafloorObservation" class="grid grid-cols-2 gap-2 p-2 bg-slate-900/30 rounded">
                                <div v-for="country in SEAFLOOR_OBSERVATION.countries" :key="country.id"
                                     @click="handleItemClick('seafloor_observation', country.id)"
                                     class="relative py-2 px-3 rounded-lg cursor-pointer transition-all duration-300 group overflow-hidden text-center"
                                     :style="getCountryButtonStyle(country.id, country.color)">
                                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                    <div class="relative">
                                        <span class="font-medium text-sm text-white">{{ country.label }}</span>
                                    </div>
                                </div>
                            </div>
                        </transition>
                    </div>

                    <!-- Level 4: 海底光缆 -->
                    <div class="space-y-2 pt-2 border-t-2 border-cyan-500/30">
                        <div class="flex items-center justify-between cursor-pointer hover:bg-slate-800/30 p-2 rounded transition-all"
                             @click="handleItemClick('submarine_cables', 'submarine_cables')">
                            <div class="flex items-center gap-2">
                                <div class="w-2 h-2 bg-cyan-400 rotate-45 shadow-[0_0_6px_#22d3ee]"></div>
                                <span class="text-cyan-400 text-base font-bold">海底光缆</span>
                            </div>
                        </div>
                    </div>

                    <!-- Level 5: 主要研究机构 -->
                    <div class="space-y-2 pt-2 border-t-2 border-orange-500/30">
                        <div class="flex items-center justify-between cursor-pointer hover:bg-slate-800/30 p-2 rounded transition-all"
                             @click="showResearchInstitutions = !showResearchInstitutions">
                            <div class="flex items-center gap-2">
                                <div class="w-2 h-2 bg-orange-400 rotate-45 shadow-[0_0_6px_#fb923c]"></div>
                                <span class="text-orange-400 text-base font-bold">主要研究机构</span>
                                <span v-if="getActiveCount('research_institutions') > 0" class="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">{{ getActiveCount('research_institutions') }}</span>
                            </div>
                            <svg class="w-5 h-5 text-orange-400 transition-transform duration-300" 
                                 :class="{ 'rotate-180': showResearchInstitutions }" 
                                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <transition name="slide-down">
                            <div v-if="showResearchInstitutions" class="grid grid-cols-2 gap-2 p-2 bg-slate-900/30 rounded">
                                <div v-for="country in RESEARCH_INSTITUTIONS.countries" :key="country.id"
                                     @click="handleItemClick('research_institutions', country.id)"
                                     class="relative py-2 px-3 rounded-lg cursor-pointer transition-all duration-300 group overflow-hidden text-center"
                                     :style="getCountryButtonStyle(country.id, country.color)">
                                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                    <div class="relative">
                                        <span class="font-medium text-sm text-white">{{ country.label }}</span>
                                    </div>
                                </div>
                            </div>
                        </transition>
                    </div>

                    <!-- Level 6: 海洋装备 -->
                    <div class="space-y-2 pt-2 border-t-2 border-red-500/30">
                        <div class="flex items-center justify-between cursor-pointer hover:bg-slate-800/30 p-2 rounded transition-all"
                             @click="handleItemClick('marine_equipment', 'marine_equipment')">
                            <div class="flex items-center gap-2">
                                <div class="w-2 h-2 bg-red-400 rotate-45 shadow-[0_0_6px_#f87171]"></div>
                                <span class="text-red-400 text-base font-bold">海洋装备</span>
                                <span v-if="activeItems.includes('marine_equipment')" class="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">已激活</span>
                            </div>
                            <svg v-if="activeItems.includes('marine_equipment')" class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                            </svg>
                        </div>
                    </div>

                </div>
            </div>
        </transition>
    </div>
</template>

<script>
import { ref } from 'vue';
import { 
    MARITIME_SILK_ROAD, 
    MARINE_PROTECTED_AREAS, 
    SEAFLOOR_OBSERVATION, 
    SUBMARINE_CABLES, 
    RESEARCH_INSTITUTIONS, 
    MARINE_EQUIPMENT 
} from '../constants.js';
import { MINERAL_IMPORT_CATEGORIES, getAllMineralImportCommodityIds } from '../data/mineralImportData.js';

export default {
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['itemClick'],
    setup(props, { emit }) {
        // 折叠面板状态
        const showMaritimeSilkRoad = ref(true);  // 默认展开海上丝绸之路
        const showMineralImports = ref(false);  // 默认收起矿产品进口
        const showSeafloorObservation = ref(true);  // 默认展开海底观测网
        const showResearchInstitutions = ref(false);  // 默认收起主要研究机构
        
        // 选中的项目
        const activeItems = ref([]);
        const importCommodityIds = getAllMineralImportCommodityIds();
        
        // 是否有激活的矿产品
        const hasActiveImportCommodity = () => {
            return activeItems.value.some(id => importCommodityIds.includes(id));
        };
        
        // 切换矿产品进口展开状态
        const toggleMineralImports = () => {
            showMineralImports.value = !showMineralImports.value;
        };

        const resetMineralImportSelections = () => {
            activeItems.value = activeItems.value.filter(id => !importCommodityIds.includes(id));
        };

        const resetAllSelections = (preservedIds = []) => {
            const nextIds = Array.isArray(preservedIds)
                ? preservedIds.filter(Boolean)
                : [preservedIds].filter(Boolean);
            const preserved = new Set(nextIds);
            activeItems.value = activeItems.value.filter(id => preserved.has(id));
        };
        
        // 处理矿产品点击（支持多选）
        const handleImportCommodityClick = (itemId) => {
            const index = activeItems.value.indexOf(itemId);
            let isActive = false;

            if (index > -1) {
                activeItems.value.splice(index, 1);
            } else {
                activeItems.value.push(itemId);
                isActive = true;
            }

            emit('itemClick', {
                category: 'maritime_silk_road',
                itemId,
                active: isActive
            });
        };

        const getCommodityButtonStyle = (commodity) => {
            const color = commodity?.color || '#0EA5E9';
            const isActive = activeItems.value.includes(commodity?.id);
            if (isActive) {
                return {
                    background: `linear-gradient(135deg, ${color}D9, rgba(15, 23, 42, 0.90))`,
                    borderColor: color,
                    boxShadow: `0 0 12px ${color}70`
                };
            }
            return {
                borderColor: `${color}55`
            };
        };
        
        // 处理项目点击
        const handleItemClick = (category, itemId) => {
            console.log('🔘 点击态势总览项目:', category, itemId);
            
            // 切换选中状态
            const index = activeItems.value.indexOf(itemId);
            if (index > -1) {
                activeItems.value.splice(index, 1);
            } else {
                activeItems.value.push(itemId);
            }
            
            // 触发事件（预留给父组件处理）
            emit('itemClick', { category, itemId, active: activeItems.value.includes(itemId) });
        };
        
        // 获取某个分类的激活数量
        const getActiveCount = (category) => {
            let categoryItems = [];
            
            switch(category) {
                case 'maritime_silk_road':
                    categoryItems = [
                        ...MARITIME_SILK_ROAD.items
                            .filter(item => item.id !== 'mineral_imports')
                            .map(item => item.id),
                        ...importCommodityIds
                    ];
                    break;
                case 'seafloor_observation':
                    categoryItems = SEAFLOOR_OBSERVATION.countries.map(c => c.id);
                    break;
                case 'research_institutions':
                    categoryItems = RESEARCH_INSTITUTIONS.countries.map(c => c.id);
                    break;
            }
            
            return activeItems.value.filter(id => categoryItems.includes(id)).length;
        };
        
        // 获取国家按钮样式（根据激活状态和国家颜色）
        const getCountryButtonStyle = (countryId, countryColor) => {
            const isActive = activeItems.value.includes(countryId);
            
            if (isActive) {
                // 激活状态：使用国家颜色的渐变背景 + 发光效果
                return {
                    background: `linear-gradient(135deg, ${countryColor}dd, ${countryColor}aa)`,
                    color: '#ffffff',
                    border: `2px solid ${countryColor}`,
                    boxShadow: `0 0 15px ${countryColor}80, inset 0 0 10px ${countryColor}40`
                };
            } else {
                // 未激活状态：灰色背景 + 国家颜色边框
                return {
                    background: 'rgba(30, 41, 59, 0.6)',
                    color: '#ffffff',
                    border: `1px solid ${countryColor}60`,
                    boxShadow: 'none'
                };
            }
        };
        
        return {
            // 常量
            MARITIME_SILK_ROAD,
            MARINE_PROTECTED_AREAS,
            SEAFLOOR_OBSERVATION,
            SUBMARINE_CABLES,
            RESEARCH_INSTITUTIONS,
            MARINE_EQUIPMENT,
            MINERAL_IMPORT_CATEGORIES,
            
            // 状态
            showMaritimeSilkRoad,
            showMineralImports,
            showSeafloorObservation,
            showResearchInstitutions,
            activeItems,
            hasActiveImportCommodity,
            
            // 方法
            handleItemClick,
            toggleMineralImports,
            resetMineralImportSelections,
            resetAllSelections,
            handleImportCommodityClick,
            getCommodityButtonStyle,
            getActiveCount,
            getCountryButtonStyle
        };
    }
};
</script>
