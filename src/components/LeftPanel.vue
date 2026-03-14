<template>
    <div class="absolute top-36 left-8 w-[28rem] z-40 flex flex-col gap-6 pointer-events-none font-['Noto_Sans_SC'] animate-slideInLeft">
        
        <!-- 1. 矿区查询面板 - 增强科技感 -->
        <transition name="slide-down">
            <div v-if="showQueryPanel" class="tech-panel-enhanced p-6 pointer-events-auto relative group" style="clip-path: polygon(0 0, 100% 0, 100% 95%, 92% 100%, 0 100%);">
                <!-- 动态扫描线 -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
                <div class="corner-decoration corner-tl scale-125"></div>
                <div class="corner-decoration corner-tr scale-125"></div>
            
            <div class="flex items-center mb-6 border-b-2 border-cyan-500/30 pb-3">
                <div class="w-1.5 h-6 bg-yellow-400 mr-3 shadow-[0_0_10px_#facc15]"></div>
                <h3 class="text-2xl font-bold text-white tracking-wider flex-1">矿区查询分类</h3>
                <div class="text-xs font-['Orbitron'] text-cyan-500 opacity-80 font-bold tracking-widest">QUERY SYSTEM</div>
            </div>

            <div class="space-y-5 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                <!-- Level 0: 资源分布 - 2x2网格卡片 -->
                <div class="space-y-2">
                    <div class="flex items-center justify-between cursor-pointer hover:bg-slate-800/30 p-2 rounded transition-all" @click="showResourcePanel = !showResourcePanel">
                        <div class="flex items-center gap-2">
                            <svg class="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z"/>
                                <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z"/>
                                <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z"/>
                            </svg>
                            <span class="text-purple-400 text-base font-bold">资源分布</span>
                            <span v-if="activeResources.length > 0" class="px-2 py-0.5 bg-purple-500 text-white text-xs font-bold rounded-full">{{ activeResources.length }}</span>
                        </div>
                        <svg class="w-5 h-5 text-purple-400 transition-transform duration-300" :class="{ 'rotate-180': showResourcePanel }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                    <transition name="slide-down">
                        <div v-if="showResourcePanel" class="grid grid-cols-2 gap-2 p-2 bg-slate-900/30 rounded">
                            <div v-for="r in RESOURCE_TYPES" :key="r" @click="toggleResource(r)" 
                                class="relative py-2 px-3 rounded-lg cursor-pointer transition-all duration-300 group overflow-hidden"
                                :class="getResourceButtonClass(r)">
                                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                <div class="relative text-center">
                                    <span class="font-medium text-sm">{{ r }}</span>
                                </div>
                            </div>
                        </div>
                    </transition>
                </div>

                <!-- Level 1: 矿区分布 - 一行三个按钮 -->
                <div class="space-y-2 pt-2 border-t-2 border-blue-500/30">
                    <div class="flex items-center justify-between cursor-pointer hover:bg-slate-800/30 p-2 rounded transition-all" @click="showMineralPanel = !showMineralPanel">
                        <div class="flex items-center gap-2">
                            <svg class="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"/>
                            </svg>
                            <span class="text-blue-400 text-base font-bold">矿区分布</span>
                            <span v-if="activeMinerals.length > 0" class="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">{{ activeMinerals.length }}</span>
                        </div>
                        <svg class="w-5 h-5 text-blue-400 transition-transform duration-300" :class="{ 'rotate-180': showMineralPanel }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                    <transition name="slide-down">
                        <div v-if="showMineralPanel" class="flex gap-2">
                            <div v-for="m in MINERAL_TYPES" :key="m" @click="toggleMineral(m)"
                                class="flex-1 relative py-2 px-3 rounded-lg cursor-pointer transition-all duration-300 group overflow-hidden text-center"
                                :class="activeMinerals.includes(m) ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'bg-slate-800/60 text-white hover:bg-slate-700 border border-slate-700 hover:border-blue-500/50'">
                                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                <div class="relative">
                                    <span class="font-medium text-sm">{{ m }}</span>
                                </div>
                            </div>
                        </div>
                    </transition>
                </div>

                <!-- Level 2: 所属大洋 - 3列大按钮 -->
                <!-- <div class="space-y-2 pt-2 border-t-2 border-cyan-500/30">
                    <div class="flex items-center justify-between cursor-pointer hover:bg-slate-800/30 p-2 rounded transition-all" @click="showOceanPanel = !showOceanPanel">
                        <div class="flex items-center gap-2">
                            <svg class="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z"/>
                            </svg>
                            <span class="text-cyan-400 text-base font-bold">所属大洋</span>
                            <span v-if="activeOceans.length > 0" class="px-2 py-0.5 bg-cyan-500 text-white text-xs font-bold rounded-full">{{ activeOceans.length }}</span>
                        </div>
                        <svg class="w-5 h-5 text-cyan-400 transition-transform duration-300" :class="{ 'rotate-180': showOceanPanel }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                    <transition name="slide-down">
                        <div v-if="showOceanPanel" class="grid grid-cols-3 gap-2 p-2 bg-slate-900/30 rounded">
                            <div v-for="ocean in OCEANS" :key="ocean" @click="toggleOcean(ocean)"
                                class="relative py-2 px-3 rounded-lg cursor-pointer transition-all duration-300 overflow-hidden text-center"
                                :class="activeOceans.includes(ocean) ? 'bg-gradient-to-b from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.6)]' : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'">
                                <div v-if="activeOceans.includes(ocean)" class="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"></div>
                                <span class="relative font-bold text-sm">{{ ocean }}</span>
                            </div>
                        </div>
                    </transition>
                </div> -->

                <!-- Level 3: 国家（可折叠面板） -->
                <div class="space-y-2 pt-2 border-t-2 border-slate-700/30">
                    <!-- 标题栏 -->
                    <div class="flex items-center justify-between cursor-pointer hover:bg-slate-800/30 p-2 rounded transition-all" @click="toggleCountryPanel">
                        <div class="flex items-center gap-2">
                            <div class="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                            <span class="text-cyan-400 text-base font-bold">国家</span>
                            <span v-if="activeCountries.length > 0" class="text-xs text-yellow-400">(已选 {{ activeCountries.length }})</span>
                        </div>
                        <svg class="w-5 h-5 text-cyan-400 transition-transform duration-300" :class="{ 'rotate-180': showCountryPanel }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                    
                    <!-- 已选国家标签（始终显示） -->
                    <div v-if="activeCountries.length > 0" class="flex flex-wrap gap-2 bg-slate-900/50 p-2 rounded border border-slate-700/30">
                        <div 
                            v-for="c in activeCountries" 
                            :key="c"
                            class="flex items-center gap-1 px-3 py-1 bg-yellow-500 text-black text-sm font-bold rounded-sm shadow-[0_0_8px_rgba(250,204,21,0.4)]"
                        >
                            <span>{{ c }}</span>
                            <button 
                                @click="removeCountry(c)"
                                class="ml-1 hover:text-red-600 transition-colors"
                                title="移除"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                    
                    <!-- 可折叠的国家选择面板 -->
                    <transition name="slide-down">
                        <div v-if="showCountryPanel" class="flex flex-wrap gap-2 bg-slate-900/50 p-3 rounded border border-slate-700/30 max-h-[200px] overflow-y-auto custom-scrollbar">
                            <button 
                                v-for="c in currentCountries" 
                                :key="c"
                                @click="toggleCountry(c)"
                                :class="[
                                    'text-sm px-3 py-1.5 rounded-sm transition-all border',
                                    activeCountries.includes(c)
                                        ? 'bg-yellow-500 text-black font-bold shadow-[0_0_10px_#facc15] border-yellow-400' 
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border-slate-600'
                                ]"
                            >
                                {{ c }}
                            </button>
                            <span v-if="currentCountries.length === 0" class="text-slate-500 text-sm">加载中...</span>
                        </div>
                    </transition>
                </div>

                <!-- Level 4: 科技进展 - 竖向列表 -->
                <div class="space-y-2 pt-2 border-t-2 border-green-500/30">
                    <div class="flex items-center justify-between cursor-pointer hover:bg-slate-800/30 p-2 rounded transition-all" @click="toggleTechProgressPanel">
                        <div class="flex items-center gap-2">
                            <div class="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                            <span class="text-green-400 text-base font-bold">科技进展</span>
                            <span v-if="activeTechProgress.length > 0" class="px-2 py-0.5 bg-green-500 text-black text-xs font-bold rounded-full">{{ activeTechProgress.length }}</span>
                        </div>
                        <svg 
                            class="w-5 h-5 text-green-400 transition-transform duration-300" 
                            :class="{ 'rotate-180': showTechProgressPanel }"
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                    
                    <transition name="slide-down">
                        <div v-if="showTechProgressPanel" class="space-y-2 bg-slate-900/30 p-2 rounded">
                            <div 
                                v-for="t in TECH_PROGRESS" 
                                :key="t"
                                @click="toggleTechProgress(t)"
                                class="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-300 group"
                                :class="activeTechProgress.includes(t) ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-l-4 border-green-300' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700 border-l-4 border-transparent hover:border-green-500/50'"
                            >
                                <div class="flex items-center gap-3">
                                    <div class="w-2 h-2 rounded-full" :class="activeTechProgress.includes(t) ? 'bg-yellow-400' : 'bg-slate-600 group-hover:bg-green-400'"></div>
                                    <span class="font-medium">{{ t }}</span>
                                </div>
                                <svg v-if="activeTechProgress.includes(t)" class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                                </svg>
                            </div>
                        </div>
                    </transition>
                </div>

                <!-- Level 4.5: 经济评价 - 竖向列表 -->
                <div class="space-y-2 pt-2 border-t-2 border-teal-500/30">
                    <div class="flex items-center justify-between cursor-pointer hover:bg-slate-800/30 p-2 rounded transition-all" @click="toggleEconomicEvaluationPanel">
                        <div class="flex items-center gap-2">
                            <div class="w-1.5 h-1.5 bg-teal-400 rounded-full"></div>
                            <span class="text-teal-400 text-base font-bold">经济评价</span>
                            <span v-if="activeEconomicEvaluation.length > 0" class="px-2 py-0.5 bg-teal-500 text-black text-xs font-bold rounded-full">{{ activeEconomicEvaluation.length }}</span>
                        </div>
                        <svg 
                            class="w-5 h-5 text-teal-400 transition-transform duration-300" 
                            :class="{ 'rotate-180': showEconomicEvaluationPanel }"
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                    
                    <transition name="slide-down">
                        <div v-if="showEconomicEvaluationPanel" class="space-y-2 bg-slate-900/30 p-2 rounded">
                            <div 
                                v-for="e in ECONOMIC_EVALUATION" 
                                :key="e"
                                @click="toggleEconomicEvaluation(e)"
                                class="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-300 group"
                                :class="activeEconomicEvaluation.includes(e) ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white border-l-4 border-teal-300' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700 border-l-4 border-transparent hover:border-teal-500/50'"
                            >
                                <div class="flex items-center gap-3">
                                    <div class="w-2 h-2 rounded-full" :class="activeEconomicEvaluation.includes(e) ? 'bg-yellow-400' : 'bg-slate-600 group-hover:bg-teal-400'"></div>
                                    <span class="font-medium">{{ e }}</span>
                                </div>
                                <svg v-if="activeEconomicEvaluation.includes(e)" class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                                </svg>
                            </div>
                        </div>
                    </transition>
                </div>

                <!-- Level 5: 政策法规 - 竖向列表 -->
                <div class="space-y-2 pt-2 border-t-2 border-orange-500/30">
                    <div class="flex items-center justify-between cursor-pointer hover:bg-slate-800/30 p-2 rounded transition-all" @click="togglePolicyRegulationsPanel">
                        <div class="flex items-center gap-2">
                            <div class="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                            <span class="text-orange-400 text-base font-bold">政策法规</span>
                            <span v-if="activePolicyRegulations.length > 0" class="px-2 py-0.5 bg-orange-500 text-black text-xs font-bold rounded-full">{{ activePolicyRegulations.length }}</span>
                        </div>
                        <svg 
                            class="w-5 h-5 text-orange-400 transition-transform duration-300" 
                            :class="{ 'rotate-180': showPolicyRegulationsPanel }"
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                    
                    <transition name="slide-down">
                        <div v-if="showPolicyRegulationsPanel" class="space-y-2 bg-slate-900/30 p-2 rounded">
                            <div 
                                v-for="p in POLICY_REGULATIONS" 
                                :key="p"
                                @click="togglePolicyRegulation(p)"
                                class="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-300 group"
                                :class="activePolicyRegulations.includes(p) ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white border-l-4 border-orange-300' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700 border-l-4 border-transparent hover:border-orange-500/50'"
                            >
                                <div class="flex items-center gap-3">
                                    <div class="w-2 h-2 rounded-full" :class="activePolicyRegulations.includes(p) ? 'bg-yellow-400' : 'bg-slate-600 group-hover:bg-orange-400'"></div>
                                    <span class="font-medium">{{ p }}</span>
                                </div>
                                <svg v-if="activePolicyRegulations.includes(p)" class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                                </svg>
                            </div>
                        </div>
                    </transition>
                </div>

                <!-- Level 6: 中国进展 - 竖向列表（特殊强调） -->
                <div class="space-y-2 pt-2 border-t-2 border-red-500/30">
                    <div class="flex items-center justify-between cursor-pointer hover:bg-slate-800/30 p-2 rounded transition-all" @click="toggleChinaProgressPanel">
                        <div class="flex items-center gap-2">
                            <div class="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                            <span class="text-red-400 text-base font-bold">中国进展</span>
                            <span v-if="activeChinaProgress.length > 0" class="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">{{ activeChinaProgress.length }}</span>
                        </div>
                        <svg 
                            class="w-5 h-5 text-red-400 transition-transform duration-300" 
                            :class="{ 'rotate-180': showChinaProgressPanel }"
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                    
                    <transition name="slide-down">
                        <div v-if="showChinaProgressPanel" class="space-y-2 bg-gradient-to-br from-red-900/20 to-orange-900/20 p-2 rounded">
                            <div 
                                v-for="c in CHINA_PROGRESS" 
                                :key="c"
                                @click="toggleChinaProgress(c)"
                                class="flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all duration-300 group"
                                :class="activeChinaProgress.includes(c) ? 'bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white border-l-4 border-yellow-400' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700 border-l-4 border-transparent hover:border-red-500/50'"
                            >
                                <div class="flex items-center gap-3">
                                    <div class="w-2.5 h-2.5 rounded-full" :class="activeChinaProgress.includes(c) ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 'bg-slate-600 group-hover:bg-red-400'"></div>
                                    <span class="font-bold">{{ c }}</span>
                                </div>
                                <svg v-if="activeChinaProgress.includes(c)" class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                                </svg>
                            </div>
                        </div>
                    </transition>
                </div>
            </div>
            </div>
        </transition>

        <!-- 2. 图层控制面板 - 矿区地理分区控制 -->
        <transition name="slide-down">
            <div v-if="showLayersPanel" class="tech-panel-enhanced p-6 pointer-events-auto relative group" style="clip-path: polygon(0 0, 92% 0, 100% 5%, 100% 100%, 0 100%);">
                <!-- 动态扫描线 -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
                <div class="corner-decoration corner-bl scale-125"></div>
                <div class="corner-decoration corner-br scale-125"></div>
             
             <div class="flex items-center mb-4 border-b-2 border-cyan-500/30 pb-3">
                <div class="w-1.5 h-6 bg-yellow-400 mr-3 shadow-[0_0_10px_#facc15]"></div>
                <h3 class="text-2xl font-bold text-white tracking-wider flex-1">矿区图层控制</h3>
                <span class="text-sm text-cyan-400 font-mono border border-cyan-500/30 px-2 py-0.5 rounded bg-cyan-900/30">REGIONS</span>
            </div>
             
             <div class="space-y-3 mt-2 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                <div v-for="region in miningRegions" :key="region.id" class="mb-2">
                    <!-- 区域控制卡片 -->
                    <div class="bg-slate-800/40 border border-slate-700/50 hover:border-cyan-500/50 rounded-sm transition-all overflow-hidden">
                        <!-- 主控制行 -->
                        <div class="flex items-center justify-between py-3 px-4 cursor-pointer" @click="toggleRegion(region.id)">
                            <div class="flex items-center gap-3 flex-1">
                                <div :class="['w-2.5 h-2.5 rotate-45 transition-all duration-300', region.active ? 'bg-cyan-400 shadow-[0_0_8px_cyan]' : 'bg-slate-600']"></div>
                                <div class="flex-1">
                                    <div class="flex items-center gap-2">
                                        <span :class="['text-lg font-bold transition-colors', region.active ? 'text-white' : 'text-slate-400']">{{ region.label }}</span>
                                        <span v-if="region.count > 0" class="text-xs px-2 py-0.5 rounded bg-cyan-900/50 border border-cyan-500/30 text-cyan-300 font-mono">
                                            {{ region.count }}
                                        </span>
                                    </div>
                                    <div class="text-xs text-slate-500 mt-0.5">{{ region.description }}</div>
                                </div>
                            </div>
                            <!-- 开关 -->
                            <div :class="['w-9 h-4 relative transition-colors duration-300 rounded-full', region.active ? 'bg-cyan-600' : 'bg-slate-700']">
                                <div :class="['absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-300 shadow-sm', region.active ? 'left-[22px]' : 'left-0.5']"></div>
                            </div>
                        </div>
                        
                        <!-- 定位按钮 -->
                        <div class="border-t border-slate-700/30 px-4 py-2 bg-slate-900/30">
                            <button 
                                @click.stop="locateRegion(region.id)"
                                class="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-slate-700/50 hover:bg-cyan-600/80 border border-slate-600 hover:border-cyan-400 rounded-sm transition-all text-sm font-medium text-slate-300 hover:text-white"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                </svg>
                                <span>定位到该区域</span>
                            </button>
                        </div>
                    </div>
                </div>
             </div>
            </div>
        </transition>

        <!-- 3. 气象图层面板 - 参考图层控制样式 -->
        <!-- 已注释：改用右侧 Windy 风格按钮控制 -->
        <!--
        <transition name="slide-down">
            <div v-if="showWeatherLayersPanel" class="tech-panel-enhanced p-6 pointer-events-auto relative group" style="clip-path: polygon(0 0, 92% 0, 100% 5%, 100% 100%, 0 100%);">
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
                <div class="corner-decoration corner-bl scale-125"></div>
                <div class="corner-decoration corner-br scale-125"></div>
             
             <div class="flex items-center mb-4 border-b-2 border-cyan-500/30 pb-3">
                <div class="w-1.5 h-6 bg-yellow-400 mr-3 shadow-[0_0_10px_#facc15]"></div>
                <h3 class="text-2xl font-bold text-white tracking-wider flex-1">气象图层</h3>
                <span class="text-sm text-cyan-400 font-mono border border-cyan-500/30 px-2 py-0.5 rounded bg-cyan-900/30">WEATHER</span>
            </div>
             
             <div class="space-y-2 mt-2 max-h-[35vh] overflow-y-auto pr-2 custom-scrollbar">
                <div v-for="group in weatherLayerGroups" :key="group.id" class="mb-2">
                    <div class="flex items-center justify-between py-2 px-4 bg-slate-800/40 border border-slate-700/50 hover:border-cyan-500/50 rounded-sm transition-all cursor-pointer" @click="toggleWeatherGroup(group.id)">
                        <div class="flex items-center gap-3">
                            <div :class="['w-2.5 h-2.5 rotate-45 transition-all duration-300', group.active ? 'bg-cyan-400 shadow-[0_0_8px_cyan]' : 'bg-slate-600']"></div>
                            <span :class="['text-lg font-bold transition-colors', group.active ? 'text-white' : 'text-slate-400']">{{ group.label }}</span>
                        </div>
                        <div :class="['w-9 h-4 relative transition-colors duration-300 rounded-full', group.active ? 'bg-cyan-600' : 'bg-slate-700']">
                            <div :class="['absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-300 shadow-sm', group.active ? 'left-[22px]' : 'left-0.5']"></div>
                        </div>
                    </div>

                    <div v-if="group.subLayers && group.active" class="ml-6 pl-4 border-l border-slate-600/30 mt-1 space-y-1">
                        <div v-for="sub in group.subLayers" :key="sub.id" 
                            class="flex items-center justify-between py-2 px-3 hover:bg-cyan-500/10 rounded cursor-pointer transition-all"
                            @click.stop="toggleWeatherSubLayer(group.id, sub.id)"
                        >
                            <div class="flex-1">
                                <div class="flex items-center gap-2">
                                    <span :class="['text-base transition-colors', sub.active ? 'text-cyan-100 font-medium' : 'text-slate-500']">{{ sub.label }}</span>
                                    <span 
                                        v-if="sub.hasTimeline"
                                        class="text-xs px-1.5 py-0.5 rounded bg-cyan-900/50 border border-cyan-500/30 text-cyan-300 font-mono"
                                    >
                                        TIME
                                    </span>
                                </div>
                                <div v-if="sub.dataSource" class="text-xs text-slate-600 mt-0.5 ml-0.5">
                                    {{ sub.dataSource }}
                                </div>
                            </div>
                            <div :class="['w-2 h-2 rounded-full transition-all', sub.active ? 'bg-yellow-400 shadow-[0_0_5px_yellow]' : 'bg-slate-600']"></div>
                        </div>
                    </div>
                </div>
             </div>
            </div>
        </transition>
        -->
    </div>
</template>

<script>
import { ref, watch, computed } from 'vue';
import { RESOURCE_TYPES, MINERAL_TYPES, OCEANS, TECH_PROGRESS, ECONOMIC_EVALUATION, POLICY_REGULATIONS, CHINA_PROGRESS, getLayersByOcean, WEATHER_LAYER_GROUPS, MINING_REGIONS } from '../constants.js';

export default {
    props: {
        availableCountries: {
            type: Array,
            default: () => []
        },
        showQueryPanel: {
            type: Boolean,
            default: true
        },
        showLayersPanel: {
            type: Boolean,
            default: true
        },
        showWeatherLayersPanel: {
            type: Boolean,
            default: false
        }
    },
    emits: ['filterChange', 'layersChange', 'weatherLayersChange', 'regionLocate', 'showTimeline', 'showPolicyDynamics', 'showCountryAttitudes', 'showMiningVehicle', 'showTechnologyMaturity', 'showMiningPlatform', 'showExperimentalMining', 'showEnvironmentalMonitoring', 'showLiftingSystem', 'showModelComparison', 'showEvaluationFormula', 'showFeasibilityAnalysis'], // 向父组件发送筛选条件变化事件 & 图层变化 & 气象图层变化 & 区域定位 & 显示时间线 & 显示政策动态 & 显示各国态度 & 显示采矿车面板 & 显示技术成熟度面板 & 显示采矿平台面板 & 显示试验试采 & 显示环境监测 & 显示提升系统 & 显示模型对比 & 显示评价公式 & 显示可行性分析
    setup(props, { emit }) {
        // ==================== 状态管理 ====================
        
        // 选中的资源分布列表（新增，支持多选）
        const activeResources = ref([]);
        
        // 选中的矿区分布列表（原矿种，支持多选）
        const activeMinerals = ref([]);
        
        // 选中的大洋列表（支持多选）
        const activeOceans = ref([]);
        
        // 选中的国家列表（支持多选）
        const activeCountries = ref([]);
        
        // 选中的科技进展列表（新增，支持多选）
        const activeTechProgress = ref([]);
        
        // 选中的经济评价列表（新增，支持多选）
        const activeEconomicEvaluation = ref([]);
        
        // 选中的政策法规列表（新增，支持多选）
        const activePolicyRegulations = ref([]);
        
        // 选中的中国进展列表（新增，支持多选）
        const activeChinaProgress = ref([]);
        
        // 当前可用的国家列表（从 GeoJSON 数据中提取）
        const currentCountries = ref([]);
        
        // 矿区地理分区数据（用于图层控制面板）
        const miningRegions = ref(JSON.parse(JSON.stringify(MINING_REGIONS))); // 深拷贝

        // 当前激活的大洋（用于标题显示）
        const activeOcean = computed(() => {
            return activeOceans.value[0] || OCEANS[0];
        });
        
        // 各个面板的展开/收起状态
        const showResourcePanel = ref(true);  // 默认展开资源分布
        const showMineralPanel = ref(true);   // 默认展开矿区分布
        const showOceanPanel = ref(true);     // 默认展开所属大洋
        const showCountryPanel = ref(false);
        const showTechProgressPanel = ref(false);
        const showEconomicEvaluationPanel = ref(false);
        const showPolicyRegulationsPanel = ref(false);
        const showChinaProgressPanel = ref(false);
        
        // 气象图层分组数据（用于气象图层面板）
        const weatherLayerGroups = ref(WEATHER_LAYER_GROUPS);

        // ==================== 监听器 ====================
        
        /**
         * 向父组件发送当前图层状态
         */
        const emitLayers = () => {
            emit('layersChange', miningRegions.value);
        };

        /**
         * 监听传入的国家列表变化
         * 当 GeoJSON 数据加载完成后，更新可用的国家列表
         */
        watch(() => props.availableCountries, (newCountries) => {
            console.log('🌍 LeftPanel 接收到国家列表:', newCountries);
            // 确保美国在列表中
            const countriesWithUSA = [...newCountries];
            if (!countriesWithUSA.includes('美国')) {
                countriesWithUSA.unshift('美国'); // 将美国添加到列表开头
            }
            currentCountries.value = countriesWithUSA;
        }, { immediate: true });

        // ==================== 事件处理函数 ====================
        
        /**
         * 发送筛选条件变化事件
         * 向父组件（App.vue）发送当前的筛选条件
         */
        const emitFilter = () => {
            console.log('📤 LeftPanel 发送筛选:', {
                resources: activeResources.value,
                minerals: activeMinerals.value,
                oceans: activeOceans.value,
                countries: activeCountries.value,
                techProgress: activeTechProgress.value,
                policyRegulations: activePolicyRegulations.value,
                chinaProgress: activeChinaProgress.value
            });
            emit('filterChange', {
                resources: activeResources.value,
                minerals: activeMinerals.value,
                oceans: activeOceans.value,
                countries: activeCountries.value,
                techProgress: activeTechProgress.value,
                economicEvaluation: activeEconomicEvaluation.value,
                policyRegulations: activePolicyRegulations.value,
                chinaProgress: activeChinaProgress.value
            });
        };

        /**
         * 切换资源分布选择状态（新增，支持多选）
         */
        const toggleResource = (resource) => {
            const index = activeResources.value.indexOf(resource);
            if (index > -1) {
                activeResources.value.splice(index, 1);
            } else {
                activeResources.value.push(resource);
            }
            emitFilter();
        };

        /**
         * 获取资源按钮的样式类
         * @param {String} resource - 资源类型
         */
        const getResourceButtonClass = (resource) => {
            const isActive = activeResources.value.includes(resource);
            
            if (isActive) {
                // 选中状态的颜色
                switch (resource) {
                    case '多金属结核':
                        return 'bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]';
                    case '富钴铁锰结壳':
                        return 'bg-gradient-to-br from-yellow-600 to-yellow-800 text-white shadow-[0_0_15px_rgba(234,179,8,0.5)]';
                    case '多金属硫化物':
                        return 'bg-gradient-to-br from-orange-600 to-orange-800 text-white shadow-[0_0_15px_rgba(234,88,12,0.5)]';
                    case '深海稀土':
                        return 'bg-gradient-to-br from-pink-600 to-pink-800 text-white shadow-[0_0_15px_rgba(219,39,119,0.5)]';
                    default:
                        return 'bg-gradient-to-br from-purple-600 to-purple-800 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]';
                }
            } else {
                // 未选中状态
                return 'bg-slate-800/60 text-white hover:bg-slate-700 border border-slate-700 hover:border-purple-500/50';
            }
        };

        /**
         * 切换矿区分布选择状态（原矿种，支持多选）
         */
        const toggleMineral = (mineral) => {
            const index = activeMinerals.value.indexOf(mineral);
            if (index > -1) {
                activeMinerals.value.splice(index, 1);
            } else {
                activeMinerals.value.push(mineral);
            }
            emitFilter();
        };

        /**
         * 切换大洋选择状态（支持多选）
         */
        const toggleOcean = (ocean) => {
            const index = activeOceans.value.indexOf(ocean);
            if (index > -1) {
                activeOceans.value.splice(index, 1);
            } else {
                activeOceans.value.push(ocean);
            }
            emitFilter();
        };

        /**
         * 切换国家面板的展开/收起状态
         */
        const toggleCountryPanel = () => {
            showCountryPanel.value = !showCountryPanel.value;
        };

        /**
         * 切换国家选择状态（支持多选）
         */
        const toggleCountry = (country) => {
            const index = activeCountries.value.indexOf(country);
            if (index > -1) {
                activeCountries.value.splice(index, 1);
            } else {
                activeCountries.value.push(country);
            }
            emitFilter();
        };

        /**
         * 移除单个国家
         */
        const removeCountry = (country) => {
            const index = activeCountries.value.indexOf(country);
            if (index > -1) {
                activeCountries.value.splice(index, 1);
                emitFilter();
            }
        };

        /**
         * 清除所有国家筛选
         */
        const clearCountries = () => {
            activeCountries.value = [];
            emitFilter();
        };

        /**
         * 切换科技进展面板的展开/收起状态（新增）
         */
        const toggleTechProgressPanel = () => {
            showTechProgressPanel.value = !showTechProgressPanel.value;
        };

        /**
         * 切换科技进展选择状态（新增，支持多选）
         */
        const toggleTechProgress = (tech) => {
            console.log('🚗 LeftPanel toggleTechProgress 被调用, tech:', tech);
            
            // 如果点击的是"采矿车"，显示采矿车面板
            if (tech === '采矿车') {
                const index = activeTechProgress.value.indexOf(tech);
                if (index > -1) {
                    activeTechProgress.value.splice(index, 1);
                    // 如果取消选中，关闭采矿车面板
                    emit('showMiningVehicle', false);
                } else {
                    activeTechProgress.value.push(tech);
                    // 如果选中，显示采矿车面板
                    emit('showMiningVehicle', true);
                }
                return;
            }
            
            // 如果点击的是"提升系统"，显示提升系统面板
            if (tech === '提升系统') {
                const index = activeTechProgress.value.indexOf(tech);
                if (index > -1) {
                    activeTechProgress.value.splice(index, 1);
                    // 如果取消选中，关闭提升系统面板
                    emit('showLiftingSystem', false);
                } else {
                    activeTechProgress.value.push(tech);
                    // 如果选中，显示提升系统面板
                    emit('showLiftingSystem', true);
                }
                return;
            }
            
            // 如果点击的是"采矿平台"，显示采矿平台面板
            if (tech === '采矿平台') {
                const index = activeTechProgress.value.indexOf(tech);
                if (index > -1) {
                    activeTechProgress.value.splice(index, 1);
                    // 如果取消选中，关闭采矿平台面板
                    emit('showMiningPlatform', false);
                } else {
                    activeTechProgress.value.push(tech);
                    // 如果选中，显示采矿平台面板
                    emit('showMiningPlatform', true);
                }
                return;
            }
            
            // 如果点击的是"试验试采"，显示试验试采标记
            if (tech === '试验试采') {
                const index = activeTechProgress.value.indexOf(tech);
                if (index > -1) {
                    activeTechProgress.value.splice(index, 1);
                    // 如果取消选中，隐藏试验试采标记
                    emit('showExperimentalMining', false);
                } else {
                    activeTechProgress.value.push(tech);
                    // 如果选中，显示试验试采标记
                    emit('showExperimentalMining', true);
                }
                return;
            }
            
            // 如果点击的是"环境监测"，显示环境监测面板
            if (tech === '环境监测') {
                const index = activeTechProgress.value.indexOf(tech);
                if (index > -1) {
                    activeTechProgress.value.splice(index, 1);
                } else {
                    activeTechProgress.value.push(tech);
                    // 显示环境监测面板
                    emit('showEnvironmentalMonitoring');
                }
                return;
            }
            
            const index = activeTechProgress.value.indexOf(tech);
            if (index > -1) {
                activeTechProgress.value.splice(index, 1);
            } else {
                activeTechProgress.value.push(tech);
            }
            emitFilter();
        };

        /**
         * 清除所有科技进展筛选（新增）
         */
        const clearTechProgress = () => {
            activeTechProgress.value = [];
            emitFilter();
        };

        /**
         * 切换经济评价面板的展开/收起状态（新增）
         */
        const toggleEconomicEvaluationPanel = () => {
            showEconomicEvaluationPanel.value = !showEconomicEvaluationPanel.value;
        };

        /**
         * 切换经济评价选择状态（新增，支持多选）
         */
        const toggleEconomicEvaluation = (item) => {
            console.log('💰 LeftPanel toggleEconomicEvaluation 被调用, item:', item);
            
            // 如果点击的是"经济计算"，显示经济计算面板
            if (item === '经济计算') {
                emit('showEconomicCalculation');
                return;
            }
            
            // 如果点击的是"模型对比"，显示模型对比面板
            if (item === '模型对比') {
                emit('showModelComparison');
                return;
            }
            
            // 如果点击的是"评价公式"，显示评价公式面板
            if (item === '评价公式') {
                emit('showEvaluationFormula');
                return;
            }
            
            // 如果点击的是"可行性分析"，显示可行性分析面板
            if (item === '可行性分析') {
                emit('showFeasibilityAnalysis');
                return;
            }
            
            const index = activeEconomicEvaluation.value.indexOf(item);
            if (index > -1) {
                activeEconomicEvaluation.value.splice(index, 1);
            } else {
                activeEconomicEvaluation.value.push(item);
            }
            emitFilter();
        };

        /**
         * 清除所有经济评价筛选（新增）
         */
        const clearEconomicEvaluation = () => {
            activeEconomicEvaluation.value = [];
            emitFilter();
        };

        /**
         * 切换政策法规面板的展开/收起状态（新增）
         */
        const togglePolicyRegulationsPanel = () => {
            showPolicyRegulationsPanel.value = !showPolicyRegulationsPanel.value;
        };

        /**
         * 切换政策法规选择状态（新增，支持多选）
         */
        const togglePolicyRegulation = (policy) => {
            console.log('📋 LeftPanel togglePolicyRegulation 被调用, policy:', policy);
            
            // 如果点击的是"开发规章时间线"，显示时间线组件
            if (policy === '开发规章时间线') {
                // 切换选中状态
                const index = activePolicyRegulations.value.indexOf(policy);
                if (index > -1) {
                    activePolicyRegulations.value.splice(index, 1);
                    // 如果取消选中，关闭时间线
                    emit('showTimeline', false);
                } else {
                    activePolicyRegulations.value.push(policy);
                    // 如果选中，显示时间线
                    emit('showTimeline', true);
                }
                return;
            }
            
            // 如果点击的是"政策动态"，显示政策动态时间线
            if (policy === '政策动态') {
                const index = activePolicyRegulations.value.indexOf(policy);
                if (index > -1) {
                    activePolicyRegulations.value.splice(index, 1);
                    emit('showPolicyDynamics', false);
                } else {
                    activePolicyRegulations.value.push(policy);
                    emit('showPolicyDynamics', true, activeCountries.value);
                }
                return;
            }
            
            // 如果点击的是"各国态度"，显示各国态度渲染
            if (policy === '各国态度') {
                console.log('✅ 检测到点击各国态度按钮');
                const index = activePolicyRegulations.value.indexOf(policy);
                if (index > -1) {
                    console.log('→ 取消选中，关闭各国态度');
                    activePolicyRegulations.value.splice(index, 1);
                    emit('showCountryAttitudes', false);
                } else {
                    console.log('→ 选中，显示各国态度');
                    activePolicyRegulations.value.push(policy);
                    emit('showCountryAttitudes', true);
                }
                return;
            }
            
            const index = activePolicyRegulations.value.indexOf(policy);
            if (index > -1) {
                activePolicyRegulations.value.splice(index, 1);
            } else {
                activePolicyRegulations.value.push(policy);
            }
            emitFilter();
        };

        /**
         * 清除所有政策法规筛选（新增）
         */
        const clearPolicyRegulations = () => {
            activePolicyRegulations.value = [];
            emitFilter();
        };

        /**
         * 切换中国进展面板的展开/收起状态（新增）
         */
        const toggleChinaProgressPanel = () => {
            showChinaProgressPanel.value = !showChinaProgressPanel.value;
        };

        /**
         * 切换中国进展选择状态（新增，支持多选）
         */
        const toggleChinaProgress = (progress) => {
            console.log('🇨🇳 LeftPanel toggleChinaProgress 被调用, progress:', progress);
            
            // 如果点击的是"企业主体"，显示企业主体面板和地图标记
            if (progress === '企业主体') {
                const index = activeChinaProgress.value.indexOf(progress);
                if (index > -1) {
                    activeChinaProgress.value.splice(index, 1);
                    emit('showEnterprise', false);
                } else {
                    activeChinaProgress.value.push(progress);
                    emit('showEnterprise', true);
                }
                return;
            }
            
            // 如果点击的是"技术成熟度"，显示技术成熟度面板
            if (progress === '技术成熟度') {
                const index = activeChinaProgress.value.indexOf(progress);
                if (index > -1) {
                    activeChinaProgress.value.splice(index, 1);
                    emit('showTechnologyMaturity', false);
                } else {
                    activeChinaProgress.value.push(progress);
                    emit('showTechnologyMaturity', true);
                }
                return;
            }
            
            const index = activeChinaProgress.value.indexOf(progress);
            if (index > -1) {
                activeChinaProgress.value.splice(index, 1);
            } else {
                activeChinaProgress.value.push(progress);
            }
            emitFilter();
        };

        /**
         * 清除所有中国进展筛选（新增）
         */
        const clearChinaProgress = () => {
            activeChinaProgress.value = [];
            emitFilter();
        };

        /**
         * 切换矿区地理分区的显示状态
         */
        const toggleRegion = (regionId) => {
            const region = miningRegions.value.find(r => r.id === regionId);
            if (region) {
                region.active = !region.active;
                console.log(`🗺️ 区域 "${region.label}" ${region.active ? '已显示' : '已隐藏'}`);
                emitLayers();
            }
        };
        
        /**
         * 定位到指定矿区地理分区
         */
        const locateRegion = (regionId) => {
            const region = miningRegions.value.find(r => r.id === regionId);
            if (region) {
                console.log(`📍 定位到区域: ${region.label}`);
                emit('regionLocate', region);
            }
        };

        /**
         * 切换气象图层组的显示状态
         */
        const toggleWeatherGroup = (groupId) => {
            const group = weatherLayerGroups.value.find(g => g.id === groupId);
            if (group) {
                const newActive = !group.active;
                group.active = newActive;

                if (group.subLayers && group.subLayers.length) {
                    if (!newActive) {
                        group._prevSubActive = group.subLayers
                            .filter(s => s.active)
                            .map(s => s.id);
                        group.subLayers.forEach(s => { s.active = false; });
                    } else {
                        const prev = group._prevSubActive && group._prevSubActive.length
                            ? group._prevSubActive
                            : [];
                        group.subLayers.forEach(s => {
                            s.active = prev.includes(s.id);
                        });
                    }
                }
                console.log(`🌦️ 气象图层组 "${group.label}" ${group.active ? '已开启' : '已关闭'}`);
            }
        };
        
        /**
         * 切换气象子图层的显示状态
         */
        const toggleWeatherSubLayer = (groupId, subId) => {
            const group = weatherLayerGroups.value.find(g => g.id === groupId);
            if (group && group.subLayers) {
                const sub = group.subLayers.find(s => s.id === subId);
                if (sub) {
                    sub.active = !sub.active;
                    console.log(`🌦️ 气象图层 "${sub.label}" ${sub.active ? '已开启' : '已关闭'}`);
                    emitWeatherLayers();
                }
            }
        };
        
        /**
         * 向父组件发送当前气象图层状态
         */
        const emitWeatherLayers = () => {
            emit('weatherLayersChange', weatherLayerGroups.value);
        };

        // 初始时发送一次图层状态
        emitLayers();
        emitWeatherLayers();

        return {
            activeResources,
            activeMinerals,
            activeOceans,
            activeCountries,
            activeTechProgress,
            activeEconomicEvaluation,
            activePolicyRegulations,
            activeChinaProgress,
            currentCountries,
            miningRegions,
            activeOcean,
            showCountryPanel,
            showTechProgressPanel,
            showEconomicEvaluationPanel,
            showPolicyRegulationsPanel,
            showResourcePanel,
            showMineralPanel,
            showOceanPanel,
            showCountryPanel,
            showTechProgressPanel,
            showPolicyRegulationsPanel,
            showChinaProgressPanel,
            weatherLayerGroups,
            toggleResource,
            getResourceButtonClass,
            toggleMineral,
            toggleOcean,
            toggleCountryPanel,
            toggleCountry,
            removeCountry,
            clearCountries,
            toggleTechProgressPanel,
            toggleTechProgress,
            clearTechProgress,
            toggleEconomicEvaluationPanel,
            toggleEconomicEvaluation,
            clearEconomicEvaluation,
            togglePolicyRegulationsPanel,
            togglePolicyRegulation,
            clearPolicyRegulations,
            toggleChinaProgressPanel,
            toggleChinaProgress,
            clearChinaProgress,
            emitFilter,
            toggleRegion,
            locateRegion,
            toggleWeatherGroup,
            toggleWeatherSubLayer,
            RESOURCE_TYPES,
            MINERAL_TYPES,
            OCEANS,
            TECH_PROGRESS,
            ECONOMIC_EVALUATION,
            POLICY_REGULATIONS,
            CHINA_PROGRESS
        };
    }
};
</script>

<style scoped>
/* 折叠面板动画 */
.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.3s ease;
    max-height: 200px;
    overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
    max-height: 0;
    opacity: 0;
    padding-top: 0;
    padding-bottom: 0;
}
</style>