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
                                <svg class="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                                    <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"/>
                                </svg>
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
                                <div v-for="item in MARITIME_SILK_ROAD.items" :key="item.id"
                                     @click="handleItemClick('maritime_silk_road', item.id)"
                                     class="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-300 group"
                                     :class="activeItems.includes(item.id) ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-l-4 border-blue-300' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700 border-l-4 border-transparent hover:border-blue-500/50'">
                                    <div class="flex items-center gap-3">
                                        <div class="w-2 h-2 rounded-full" 
                                             :class="activeItems.includes(item.id) ? 'bg-yellow-400' : 'bg-slate-600 group-hover:bg-blue-400'"></div>
                                        <span class="font-medium">{{ item.label }}</span>
                                    </div>
                                    <svg v-if="activeItems.includes(item.id)" class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                                    </svg>
                                </div>
                            </div>
                        </transition>
                    </div>

                    <!-- Level 2: 海洋保护区 -->
                    <div class="space-y-2 pt-2 border-t-2 border-green-500/30">
                        <div class="flex items-center justify-between cursor-pointer hover:bg-slate-800/30 p-2 rounded transition-all"
                             @click="handleItemClick('marine_protected_areas', 'toggle')">
                            <div class="flex items-center gap-2">
                                <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                                </svg>
                                <span class="text-green-400 text-base font-bold">海洋保护区</span>
                            </div>
                        </div>
                    </div>

                    <!-- Level 3: 海底观测网 -->
                    <div class="space-y-2 pt-2 border-t-2 border-purple-500/30">
                        <div class="flex items-center justify-between cursor-pointer hover:bg-slate-800/30 p-2 rounded transition-all"
                             @click="showSeafloorObservation = !showSeafloorObservation">
                            <div class="flex items-center gap-2">
                                <svg class="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                                </svg>
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
                                     :class="activeItems.includes(country.id) ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]' : 'bg-slate-800/60 text-white hover:bg-slate-700 border border-slate-700 hover:border-purple-500/50'">
                                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                    <div class="relative">
                                        <span class="font-medium text-sm">{{ country.label }}</span>
                                    </div>
                                </div>
                            </div>
                        </transition>
                    </div>

                    <!-- Level 4: 海底光缆 -->
                    <div class="space-y-2 pt-2 border-t-2 border-cyan-500/30">
                        <div class="flex items-center justify-between cursor-pointer hover:bg-slate-800/30 p-2 rounded transition-all"
                             @click="handleItemClick('submarine_cables', 'toggle')">
                            <div class="flex items-center gap-2">
                                <svg class="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"/>
                                </svg>
                                <span class="text-cyan-400 text-base font-bold">海底光缆</span>
                            </div>
                        </div>
                    </div>

                    <!-- Level 5: 主要研究机构 -->
                    <div class="space-y-2 pt-2 border-t-2 border-orange-500/30">
                        <div class="flex items-center justify-between cursor-pointer hover:bg-slate-800/30 p-2 rounded transition-all"
                             @click="showResearchInstitutions = !showResearchInstitutions">
                            <div class="flex items-center gap-2">
                                <svg class="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                                </svg>
                                <span class="text-orange-400 text-base font-bold">主要研究机构</span>
                                <span v-if="getActiveCount('research_institutions') > 0" class="px-2 py-0.5 bg-orange-500 text-black text-xs font-bold rounded-full">{{ getActiveCount('research_institutions') }}</span>
                            </div>
                            <svg class="w-5 h-5 text-orange-400 transition-transform duration-300" 
                                 :class="{ 'rotate-180': showResearchInstitutions }" 
                                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <transition name="slide-down">
                            <div v-if="showResearchInstitutions" class="space-y-2 bg-slate-900/30 p-2 rounded">
                                <div v-for="cat in RESEARCH_INSTITUTIONS.categories" :key="cat.id"
                                     @click="handleItemClick('research_institutions', cat.id)"
                                     class="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-300 group"
                                     :class="activeItems.includes(cat.id) ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white border-l-4 border-orange-300' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700 border-l-4 border-transparent hover:border-orange-500/50'">
                                    <div class="flex items-center gap-3">
                                        <div class="w-2 h-2 rounded-full" 
                                             :class="activeItems.includes(cat.id) ? 'bg-yellow-400' : 'bg-slate-600 group-hover:bg-orange-400'"></div>
                                        <span class="font-medium">{{ cat.label }}</span>
                                    </div>
                                    <svg v-if="activeItems.includes(cat.id)" class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                                    </svg>
                                </div>
                            </div>
                        </transition>
                    </div>

                    <!-- Level 6: 海洋装备 -->
                    <div class="space-y-2 pt-2 border-t-2 border-red-500/30">
                        <div class="flex items-center justify-between cursor-pointer hover:bg-slate-800/30 p-2 rounded transition-all"
                             @click="showMarineEquipment = !showMarineEquipment">
                            <div class="flex items-center gap-2">
                                <svg class="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 1a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm4-4a1 1 0 100 2h.01a1 1 0 100-2H13zM9 9a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zM7 8a1 1 0 000 2h.01a1 1 0 000-2H7z"/>
                                </svg>
                                <span class="text-red-400 text-base font-bold">海洋装备</span>
                                <span v-if="getActiveCount('marine_equipment') > 0" class="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">{{ getActiveCount('marine_equipment') }}</span>
                            </div>
                            <svg class="w-5 h-5 text-red-400 transition-transform duration-300" 
                                 :class="{ 'rotate-180': showMarineEquipment }" 
                                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <transition name="slide-down">
                            <div v-if="showMarineEquipment" class="space-y-2 bg-gradient-to-br from-red-900/20 to-orange-900/20 p-2 rounded">
                                <div v-for="cat in MARINE_EQUIPMENT.categories" :key="cat.id"
                                     @click="handleItemClick('marine_equipment', cat.id)"
                                     class="flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all duration-300 group"
                                     :class="activeItems.includes(cat.id) ? 'bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white border-l-4 border-yellow-400' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700 border-l-4 border-transparent hover:border-red-500/50'">
                                    <div class="flex items-center gap-3">
                                        <div class="w-2.5 h-2.5 rounded-full" 
                                             :class="activeItems.includes(cat.id) ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 'bg-slate-600 group-hover:bg-red-400'"></div>
                                        <span class="font-bold">{{ cat.label }}</span>
                                    </div>
                                    <svg v-if="activeItems.includes(cat.id)" class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                                    </svg>
                                </div>
                            </div>
                        </transition>
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
        const showSeafloorObservation = ref(true);  // 默认展开海底观测网
        const showResearchInstitutions = ref(false);  // 默认收起主要研究机构
        const showMarineEquipment = ref(false);  // 默认收起海洋装备
        
        // 选中的项目
        const activeItems = ref([]);
        
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
                    categoryItems = MARITIME_SILK_ROAD.items.map(item => item.id);
                    break;
                case 'seafloor_observation':
                    categoryItems = SEAFLOOR_OBSERVATION.countries.map(c => c.id);
                    break;
                case 'research_institutions':
                    categoryItems = RESEARCH_INSTITUTIONS.categories.map(c => c.id);
                    break;
                case 'marine_equipment':
                    categoryItems = MARINE_EQUIPMENT.categories.map(c => c.id);
                    break;
            }
            
            return activeItems.value.filter(id => categoryItems.includes(id)).length;
        };
        
        return {
            // 常量
            MARITIME_SILK_ROAD,
            MARINE_PROTECTED_AREAS,
            SEAFLOOR_OBSERVATION,
            SUBMARINE_CABLES,
            RESEARCH_INSTITUTIONS,
            MARINE_EQUIPMENT,
            
            // 状态
            showMaritimeSilkRoad,
            showSeafloorObservation,
            showResearchInstitutions,
            showMarineEquipment,
            activeItems,
            
            // 方法
            handleItemClick,
            getActiveCount
        };
    }
};
</script>
