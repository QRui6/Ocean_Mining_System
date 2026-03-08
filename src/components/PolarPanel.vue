<template>
    <div class="absolute top-36 left-8 w-[28rem] z-40 flex flex-col gap-6 pointer-events-none font-['Noto_Sans_SC'] animate-slideInLeft">
        
        <!-- 极地科考统一面板 -->
        <transition name="slide-down">
            <div v-if="showPanel" class="tech-panel-enhanced p-6 pointer-events-auto relative group" style="clip-path: polygon(0 0, 100% 0, 100% 95%, 92% 100%, 0 100%);">
                <!-- 动态扫描线 -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
                <div class="corner-decoration corner-tl scale-125"></div>
                <div class="corner-decoration corner-tr scale-125"></div>
            
                <div class="flex items-center mb-6 border-b-2 border-cyan-500/30 pb-3">
                    <div class="w-1.5 h-6 bg-yellow-400 mr-3 shadow-[0_0_10px_#facc15]"></div>
                    <h3 class="text-2xl font-bold text-white tracking-wider flex-1">极地科考</h3>
                    <div class="text-xs font-['Orbitron'] text-cyan-500 opacity-80 font-bold tracking-widest">POLAR RESEARCH</div>
                </div>

                <div class="space-y-5 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2 custom-scrollbar">
                    
                    <!-- 第一类：极地区域选择 -->
                    <div class="space-y-2">
                        <div class="flex items-center justify-between cursor-pointer hover:bg-slate-800/30 p-2 rounded transition-all" @click="showRegionPanel = !showRegionPanel">
                            <div class="flex items-center gap-2">
                                <div class="w-2 h-2 rounded-full bg-cyan-400"></div>
                                <span class="text-cyan-400 text-base font-bold">极地区域</span>
                                <span v-if="activeRegions.length > 0" class="px-2 py-0.5 bg-cyan-500 text-white text-xs font-bold rounded-full">{{ activeRegions.length }}</span>
                            </div>
                            <svg class="w-5 h-5 text-cyan-400 transition-transform duration-300" :class="{ 'rotate-180': showRegionPanel }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <transition name="slide-down">
                            <div v-if="showRegionPanel" class="flex gap-2 p-2 bg-slate-900/30 rounded">
                                <div 
                                    v-for="region in POLAR_REGIONS" 
                                    :key="region.id"
                                    @click="toggleRegion(region.id)"
                                    class="flex-1 relative py-3 px-4 rounded-lg cursor-pointer transition-all duration-300 group overflow-hidden text-center"
                                    :class="activeRegions.includes(region.id) ? 'bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-slate-800/60 text-white hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50'"
                                >
                                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                    <div class="relative">
                                        <span class="font-bold text-sm">{{ region.label }}</span>
                                    </div>
                                </div>
                            </div>
                        </transition>
                    </div>

                    <!-- 资源潜力 -->
                    <div class="space-y-2 pt-2 border-t-2 border-green-500/30">
                        <div class="flex items-center justify-between cursor-pointer hover:bg-slate-800/30 p-2 rounded transition-all" @click="showResourcePanel = !showResourcePanel">
                            <div class="flex items-center gap-2">
                                <div class="w-2 h-2 rounded-full bg-green-400"></div>
                                <span class="text-green-400 text-base font-bold">资源潜力</span>
                            </div>
                            <svg class="w-5 h-5 text-green-400 transition-transform duration-300" :class="{ 'rotate-180': showResourcePanel }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <transition name="slide-down">
                            <div v-if="showResourcePanel" class="space-y-2 bg-slate-900/30 p-2 rounded">
                                <!-- 南极 -->
                                <div class="space-y-2">
                                    <div 
                                        @click="showAntarcticResourcePanel = !showAntarcticResourcePanel"
                                        class="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-300 group bg-slate-800/60 text-slate-300 hover:bg-slate-700 border-l-4 border-transparent hover:border-green-500/50"
                                    >
                                        <div class="flex items-center gap-3">
                                            <div class="w-2 h-2 rounded-full bg-slate-600 group-hover:bg-green-400"></div>
                                            <span class="font-medium">南极</span>
                                        </div>
                                        <svg class="w-4 h-4 text-slate-400 transition-transform duration-300" :class="{ 'rotate-180': showAntarcticResourcePanel }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                        </svg>
                                    </div>
                                    
                                    <!-- 南极资源类型 -->
                                    <transition name="slide-down">
                                        <div v-if="showAntarcticResourcePanel" class="ml-4 space-y-2 bg-slate-800/30 p-2 rounded">
                                            <!-- 上面两个并排 -->
                                            <div class="grid grid-cols-2 gap-2">
                                                <div 
                                                    v-for="item in RESOURCE_TYPES.filter(i => !i.fullWidth)" 
                                                    :key="item.id"
                                                    @click.stop="handleCategoryClick('resource_antarctic', item.id)"
                                                    class="relative py-2 px-3 rounded cursor-pointer transition-all duration-300 group overflow-hidden text-center bg-slate-700/60 text-slate-400 hover:bg-slate-600 hover:text-green-300 border border-slate-600 hover:border-green-500/50"
                                                >
                                                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                                    <div class="relative">
                                                        <span class="text-xs font-medium">{{ item.label }}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <!-- 下面一个长按钮 -->
                                            <div 
                                                v-for="item in RESOURCE_TYPES.filter(i => i.fullWidth)" 
                                                :key="item.id"
                                                @click.stop="handleCategoryClick('resource_antarctic', item.id)"
                                                class="relative py-2 px-3 rounded cursor-pointer transition-all duration-300 group overflow-hidden text-center bg-slate-700/60 text-slate-400 hover:bg-slate-600 hover:text-green-300 border border-slate-600 hover:border-green-500/50"
                                            >
                                                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                                <div class="relative">
                                                    <span class="text-xs font-medium">{{ item.label }}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </transition>
                                </div>
                                
                                <!-- 北极 -->
                                <div class="space-y-2">
                                    <div 
                                        @click="showArcticResourcePanel = !showArcticResourcePanel"
                                        class="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-300 group bg-slate-800/60 text-slate-300 hover:bg-slate-700 border-l-4 border-transparent hover:border-green-500/50"
                                    >
                                        <div class="flex items-center gap-3">
                                            <div class="w-2 h-2 rounded-full bg-slate-600 group-hover:bg-green-400"></div>
                                            <span class="font-medium">北极</span>
                                        </div>
                                        <svg class="w-4 h-4 text-slate-400 transition-transform duration-300" :class="{ 'rotate-180': showArcticResourcePanel }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                        </svg>
                                    </div>
                                    
                                    <!-- 北极资源类型 -->
                                    <transition name="slide-down">
                                        <div v-if="showArcticResourcePanel" class="ml-4 space-y-2 bg-slate-800/30 p-2 rounded">
                                            <!-- 上面两个并排 -->
                                            <div class="grid grid-cols-2 gap-2">
                                                <div 
                                                    v-for="item in RESOURCE_TYPES.filter(i => !i.fullWidth)" 
                                                    :key="item.id"
                                                    @click.stop="handleCategoryClick('resource_arctic', item.id)"
                                                    class="relative py-2 px-3 rounded cursor-pointer transition-all duration-300 group overflow-hidden text-center bg-slate-700/60 text-slate-400 hover:bg-slate-600 hover:text-green-300 border border-slate-600 hover:border-green-500/50"
                                                >
                                                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                                    <div class="relative">
                                                        <span class="text-xs font-medium">{{ item.label }}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <!-- 下面一个长按钮 -->
                                            <div 
                                                v-for="item in RESOURCE_TYPES.filter(i => i.fullWidth)" 
                                                :key="item.id"
                                                @click.stop="handleCategoryClick('resource_arctic', item.id)"
                                                class="relative py-2 px-3 rounded cursor-pointer transition-all duration-300 group overflow-hidden text-center bg-slate-700/60 text-slate-400 hover:bg-slate-600 hover:text-green-300 border border-slate-600 hover:border-green-500/50"
                                            >
                                                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                                <div class="relative">
                                                    <span class="text-xs font-medium">{{ item.label }}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </transition>
                                </div>
                            </div>
                        </transition>
                    </div>

                    <!-- 科考站点 -->
                    <div class="space-y-2 pt-2 border-t-2 border-blue-500/30">
                        <div class="flex items-center justify-between cursor-pointer hover:bg-slate-800/30 p-2 rounded transition-all" @click="showStationPanel = !showStationPanel">
                            <div class="flex items-center gap-2">
                                <div class="w-2 h-2 rounded-full bg-blue-400"></div>
                                <span class="text-blue-400 text-base font-bold">科考站点</span>
                            </div>
                            <svg class="w-5 h-5 text-blue-400 transition-transform duration-300" :class="{ 'rotate-180': showStationPanel }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <transition name="slide-down">
                            <div v-if="showStationPanel" class="space-y-2 bg-slate-900/30 p-2 rounded">
                                <!-- 南极科考站 -->
                                <div class="space-y-2">
                                    <div 
                                        @click="showAntarcticStationPanel = !showAntarcticStationPanel"
                                        class="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-300 group bg-slate-800/60 text-slate-300 hover:bg-slate-700 border-l-4 border-transparent hover:border-blue-500/50"
                                    >
                                        <div class="flex items-center gap-3">
                                            <div class="w-2 h-2 rounded-full bg-slate-600 group-hover:bg-blue-400"></div>
                                            <span class="font-medium">南极</span>
                                        </div>
                                        <svg class="w-4 h-4 text-slate-400 transition-transform duration-300" :class="{ 'rotate-180': showAntarcticStationPanel }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                        </svg>
                                    </div>
                                    
                                    <!-- 南极国家按钮 -->
                                    <transition name="slide-down">
                                        <div v-if="showAntarcticStationPanel" class="ml-4 bg-slate-800/30 p-3 rounded">
                                            <div class="flex flex-wrap gap-2">
                                                <div 
                                                    v-for="country in ANTARCTIC_STATION_COUNTRIES" 
                                                    :key="country.id"
                                                    @click.stop="handleStationCountryClick('antarctic', country.id)"
                                                    class="px-3 py-1.5 rounded cursor-pointer transition-all duration-300 text-xs font-medium border"
                                                    :class="activeAntarcticStationCountries.includes(country.id) 
                                                        ? 'bg-blue-600/80 text-white border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                                                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-600 hover:text-blue-300 border-slate-600 hover:border-blue-500/50'"
                                                >
                                                    {{ country.label }}
                                                </div>
                                            </div>
                                        </div>
                                    </transition>
                                </div>
                                
                                <!-- 北极科考站 -->
                                <div class="space-y-2">
                                    <div 
                                        @click="showArcticStationPanel = !showArcticStationPanel"
                                        class="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-300 group bg-slate-800/60 text-slate-300 hover:bg-slate-700 border-l-4 border-transparent hover:border-blue-500/50"
                                    >
                                        <div class="flex items-center gap-3">
                                            <div class="w-2 h-2 rounded-full bg-slate-600 group-hover:bg-blue-400"></div>
                                            <span class="font-medium">北极</span>
                                        </div>
                                        <svg class="w-4 h-4 text-slate-400 transition-transform duration-300" :class="{ 'rotate-180': showArcticStationPanel }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                        </svg>
                                    </div>
                                    
                                    <!-- 北极国家按钮 -->
                                    <transition name="slide-down">
                                        <div v-if="showArcticStationPanel" class="ml-4 bg-slate-800/30 p-3 rounded">
                                            <div class="flex flex-wrap gap-2">
                                                <div 
                                                    v-for="country in ARCTIC_STATION_COUNTRIES" 
                                                    :key="country.id"
                                                    @click.stop="handleStationCountryClick('arctic', country.id)"
                                                    class="px-3 py-1.5 rounded cursor-pointer transition-all duration-300 text-xs font-medium border"
                                                    :class="activeArcticStationCountries.includes(country.id) 
                                                        ? 'bg-blue-600/80 text-white border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                                                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-600 hover:text-blue-300 border-slate-600 hover:border-blue-500/50'"
                                                >
                                                    {{ country.label }}
                                                </div>
                                            </div>
                                        </div>
                                    </transition>
                                </div>
                            </div>
                        </transition>
                    </div>

                    <!-- 科考装备 -->
                    <div class="space-y-2 pt-2 border-t-2 border-purple-500/30">
                        <div class="flex items-center justify-between cursor-pointer hover:bg-slate-800/30 p-2 rounded transition-all" @click="showEquipmentPanel = !showEquipmentPanel">
                            <div class="flex items-center gap-2">
                                <div class="w-2 h-2 rounded-full bg-purple-400"></div>
                                <span class="text-purple-400 text-base font-bold">科考装备</span>
                            </div>
                            <svg class="w-5 h-5 text-purple-400 transition-transform duration-300" :class="{ 'rotate-180': showEquipmentPanel }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <transition name="slide-down">
                            <div v-if="showEquipmentPanel" class="space-y-2 bg-slate-900/30 p-2 rounded">
                                <div 
                                    v-for="item in EQUIPMENT_ITEMS" 
                                    :key="item.id"
                                    @click="handleCategoryClick('research_equipment', item.id)"
                                    class="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-300 group bg-slate-800/60 text-slate-300 hover:bg-slate-700 border-l-4 border-transparent hover:border-purple-500/50"
                                >
                                    <div class="flex items-center gap-3">
                                        <div class="w-2 h-2 rounded-full bg-slate-600 group-hover:bg-purple-400"></div>
                                        <span class="font-medium">{{ item.label }}</span>
                                    </div>
                                </div>
                            </div>
                        </transition>
                    </div>

                    <!-- 主权主张 -->
                    <div class="space-y-2 pt-2 border-t-2 border-orange-500/30">
                        <div class="flex items-center justify-between cursor-pointer hover:bg-slate-800/30 p-2 rounded transition-all" @click="showSovereigntyPanel = !showSovereigntyPanel">
                            <div class="flex items-center gap-2">
                                <div class="w-2 h-2 rounded-full bg-orange-400"></div>
                                <span class="text-orange-400 text-base font-bold">主权主张</span>
                            </div>
                            <svg class="w-5 h-5 text-orange-400 transition-transform duration-300" :class="{ 'rotate-180': showSovereigntyPanel }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <transition name="slide-down">
                            <div v-if="showSovereigntyPanel" class="space-y-2 bg-slate-900/30 p-2 rounded">
                                <div 
                                    v-for="item in SOVEREIGNTY_ITEMS" 
                                    :key="item.id"
                                    @click="handleCategoryClick('sovereignty_claims', item.id)"
                                    class="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-300 group bg-slate-800/60 text-slate-300 hover:bg-slate-700 border-l-4 border-transparent hover:border-orange-500/50"
                                >
                                    <div class="flex items-center gap-3">
                                        <div class="w-2 h-2 rounded-full bg-slate-600 group-hover:bg-orange-400"></div>
                                        <span class="font-medium">{{ item.label }}</span>
                                    </div>
                                </div>
                            </div>
                        </transition>
                    </div>

                    <!-- 制度框架 -->
                    <div class="space-y-2 pt-2 border-t-2 border-pink-500/30">
                        <div class="flex items-center justify-between cursor-pointer hover:bg-slate-800/30 p-2 rounded transition-all" @click="showFrameworkPanel = !showFrameworkPanel">
                            <div class="flex items-center gap-2">
                                <div class="w-2 h-2 rounded-full bg-pink-400"></div>
                                <span class="text-pink-400 text-base font-bold">制度框架</span>
                            </div>
                            <svg class="w-5 h-5 text-pink-400 transition-transform duration-300" :class="{ 'rotate-180': showFrameworkPanel }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <transition name="slide-down">
                            <div v-if="showFrameworkPanel" class="space-y-2 bg-slate-900/30 p-2 rounded">
                                <div 
                                    v-for="item in FRAMEWORK_ITEMS" 
                                    :key="item.id"
                                    @click="handleCategoryClick('institutional_framework', item.id)"
                                    class="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-300 group bg-slate-800/60 text-slate-300 hover:bg-slate-700 border-l-4 border-transparent hover:border-pink-500/50"
                                >
                                    <div class="flex items-center gap-3">
                                        <div class="w-2 h-2 rounded-full bg-slate-600 group-hover:bg-pink-400"></div>
                                        <span class="font-medium">{{ item.label }}</span>
                                    </div>
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

// 极地区域配置
const POLAR_REGIONS = [
    { id: 'antarctic', label: '南极' },
    { id: 'arctic', label: '北极' }
];

// 南极科考站国家（从实际数据中提取）
const ANTARCTIC_STATION_COUNTRIES = [
    { id: 'china', label: '中国' },
    { id: 'usa', label: '美国' },
    { id: 'russia', label: '俄罗斯' },
    { id: 'australia', label: '澳大利亚' },
    { id: 'argentina', label: '阿根廷' },
    { id: 'chile', label: '智利' },
    { id: 'japan', label: '日本' },
    { id: 'france', label: '法国' },
    { id: 'germany', label: '德国' },
    { id: 'korea', label: '韩国' },
    { id: 'india', label: '印度' },
    { id: 'uk', label: '英国' },
    { id: 'ukraine', label: '乌克兰' },
    { id: 'newzealand', label: '新西兰' },
    { id: 'norway', label: '挪威' },
    { id: 'uruguay', label: '乌拉圭' },
    { id: 'poland', label: '波兰' },
    { id: 'france_italy', label: '法国、意大利' }
];

// 北极科考站国家（从实际数据中提取）
const ARCTIC_STATION_COUNTRIES = [
    { id: 'china', label: '中国' },
    { id: 'norway', label: '挪威' },
    { id: 'france_germany_norway', label: '法国、德国、挪威' },
    { id: 'uk', label: '英国' },
    { id: 'japan', label: '日本' },
    { id: 'italy', label: '意大利' },
    { id: 'korea', label: '韩国' },
    { id: 'india', label: '印度' },
    { id: 'usa', label: '美国' },
    { id: 'canada', label: '加拿大' },
    { id: 'russia', label: '俄罗斯' },
    { id: 'denmark', label: '丹麦' },
    { id: 'sweden', label: '瑞典' },
    { id: 'finland', label: '芬兰' }
];

// 资源潜力二级菜单（区域）
const RESOURCE_REGIONS = [
    { id: 'antarctic', label: '南极' },
    { id: 'arctic', label: '北极' }
];

// 资源类型三级菜单（每个区域下的资源分类）
const RESOURCE_TYPES = [
    { id: 'energy_minerals', label: '能源矿产' },
    { id: 'metal_minerals', label: '金属矿产' },
    { id: 'non_metal_special', label: '非金属矿产及特殊资源', fullWidth: true }
];

// 科考站点二级菜单（已废弃，改为国家按钮）
const STATION_ITEMS = [
    { id: 'antarctic', label: '南极' },
    { id: 'arctic', label: '北极' }
];

// 科考装备二级菜单
const EQUIPMENT_ITEMS = [
    { id: 'icebreaker', label: '破冰船' },
    { id: 'aircraft', label: '飞机' },
    { id: 'other', label: '其他' }
];

// 主权主张二级菜单
const SOVEREIGNTY_ITEMS = [
    { id: 'antarctic', label: '南极' },
    { id: 'arctic', label: '北极' }
];

// 制度框架二级菜单
const FRAMEWORK_ITEMS = [
    { id: 'antarctic', label: '南极' },
    { id: 'arctic', label: '北极' }
];

export default {
    name: 'PolarPanel',
    props: {
        showPanel: {
            type: Boolean,
            default: true
        }
    },
    emits: [
        'regionChange',
        'categoryClick',
        'stationCountryClick'
    ],
    setup(props, { emit }) {
        // 状态管理
        const activeRegions = ref([]);
        
        // 资源类型选中状态（南极和北极分别管理）
        const activeAntarcticResources = ref([]);
        const activeArcticResources = ref([]);
        
        // 科考站国家选中状态
        const activeAntarcticStationCountries = ref([]);
        const activeArcticStationCountries = ref([]);
        
        // 面板展开状态
        const showRegionPanel = ref(true);
        const showResourcePanel = ref(false);
        const showAntarcticResourcePanel = ref(false);
        const showArcticResourcePanel = ref(false);
        const showStationPanel = ref(false);
        const showAntarcticStationPanel = ref(false);
        const showArcticStationPanel = ref(false);
        const showEquipmentPanel = ref(false);
        const showSovereigntyPanel = ref(false);
        const showFrameworkPanel = ref(false);
        
        // 切换极地区域
        const toggleRegion = (regionId) => {
            const index = activeRegions.value.indexOf(regionId);
            if (index > -1) {
                activeRegions.value.splice(index, 1);
            } else {
                activeRegions.value.push(regionId);
            }
            emit('regionChange', activeRegions.value);
        };
        
        // 处理科考站国家点击
        const handleStationCountryClick = (region, countryId) => {
            console.log('点击科考站国家:', region, countryId);
            
            if (region === 'antarctic') {
                const index = activeAntarcticStationCountries.value.indexOf(countryId);
                if (index > -1) {
                    activeAntarcticStationCountries.value.splice(index, 1);
                } else {
                    activeAntarcticStationCountries.value.push(countryId);
                }
                // 触发科考站加载事件
                emit('stationCountryClick', { 
                    region: 'antarctic', 
                    countryId,
                    selectedCountries: activeAntarcticStationCountries.value 
                });
            } else if (region === 'arctic') {
                const index = activeArcticStationCountries.value.indexOf(countryId);
                if (index > -1) {
                    activeArcticStationCountries.value.splice(index, 1);
                } else {
                    activeArcticStationCountries.value.push(countryId);
                }
                // 触发科考站加载事件
                emit('stationCountryClick', { 
                    region: 'arctic', 
                    countryId,
                    selectedCountries: activeArcticStationCountries.value 
                });
            }
        };
        
        // 处理分类点击
        const handleCategoryClick = (category, itemId) => {
            console.log('点击:', category, itemId);
            
            // 处理南极资源类型的多选
            if (category === 'resource_antarctic') {
                const index = activeAntarcticResources.value.indexOf(itemId);
                if (index > -1) {
                    activeAntarcticResources.value.splice(index, 1);
                } else {
                    activeAntarcticResources.value.push(itemId);
                }
                // 触发资源加载事件
                emit('categoryClick', { 
                    category, 
                    itemId,
                    selectedTypes: activeAntarcticResources.value 
                });
                return;
            }
            
            // 处理北极资源类型的多选
            if (category === 'resource_arctic') {
                const index = activeArcticResources.value.indexOf(itemId);
                if (index > -1) {
                    activeArcticResources.value.splice(index, 1);
                } else {
                    activeArcticResources.value.push(itemId);
                }
                // 触发资源加载事件
                emit('categoryClick', { 
                    category, 
                    itemId,
                    selectedTypes: activeArcticResources.value 
                });
                return;
            }
            
            emit('categoryClick', { category, itemId });
        };
        
        return {
            POLAR_REGIONS,
            RESOURCE_REGIONS,
            RESOURCE_TYPES,
            ANTARCTIC_STATION_COUNTRIES,
            ARCTIC_STATION_COUNTRIES,
            STATION_ITEMS,
            EQUIPMENT_ITEMS,
            SOVEREIGNTY_ITEMS,
            FRAMEWORK_ITEMS,
            activeRegions,
            activeAntarcticResources,
            activeArcticResources,
            activeAntarcticStationCountries,
            activeArcticStationCountries,
            showRegionPanel,
            showResourcePanel,
            showAntarcticResourcePanel,
            showArcticResourcePanel,
            showStationPanel,
            showAntarcticStationPanel,
            showArcticStationPanel,
            showEquipmentPanel,
            showSovereigntyPanel,
            showFrameworkPanel,
            toggleRegion,
            handleCategoryClick,
            handleStationCountryClick
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
