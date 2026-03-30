<template>
    <div class="fixed left-8 top-40 z-30 w-[28rem] pointer-events-auto font-['Noto_Sans_SC']">
        <!-- 主容器 - 科技感边框 -->
        <div class="relative backdrop-blur-md overflow-hidden"
             style="clip-path: polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px)); background: linear-gradient(180deg, rgba(15, 30, 60, 0.8), rgba(8, 20, 45, 0.74));">
            
            <!-- 发光边框效果 -->
            <div class="absolute inset-0 pointer-events-none">
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-70"></div>
                <div class="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-70"></div>
                <div class="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-transparent via-cyan-400 to-transparent opacity-70"></div>
                <div class="absolute top-0 right-0 w-[2px] h-full bg-gradient-to-b from-transparent via-cyan-400 to-transparent opacity-70"></div>
            </div>
            
            <!-- 角落装饰 -->
            <div class="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-cyan-400/80"></div>
            <div class="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-cyan-400/80"></div>
            <div class="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-cyan-400/80"></div>
            <div class="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-cyan-400/80"></div>
            
            <!-- 标题栏 -->
            <div class="relative flex items-center justify-between px-5 py-4 border-b border-cyan-500/30"
                 style="background: rgba(6, 182, 212, 0.12);">
                <div class="flex items-center gap-3">
                    <div class="w-1.5 h-7 bg-gradient-to-b from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/50"></div>
                    <h3 class="text-xl font-bold text-white tracking-wider" 
                        style="text-shadow: 0 0 10px rgba(6, 182, 212, 0.5);">
                        科考船列表
                    </h3>
                </div>
                <div class="flex items-center gap-2">
                    <button
                        @click="toggleStatisticsPanel"
                        class="px-3 py-1.5 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/50 rounded transition-all duration-300 flex items-center gap-2"
                        :class="showStatisticsPanel ? 'bg-cyan-600/50 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : ''"
                    >
                        <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                        <span class="text-cyan-400 text-sm font-bold">统计</span>
                    </button>
                    <button @click="$emit('close')"
                            class="text-cyan-400 hover:text-white transition-all duration-300 hover:rotate-90">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- 树状列表内容区 -->
            <div class="p-4 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar">
                <!-- 自然资源部 -->
                <div class="tree-node-container">
                    <div class="tree-node-header" @click="toggleNode('mnr')">
                        <div class="flex items-center gap-2 flex-1">
                            <svg class="w-5 h-5 transition-transform duration-300" 
                                 :class="{ 'rotate-90': expandedNodes.mnr }"
                                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                            </svg>
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                            </svg>
                            <span class="tree-node-title">自然资源部</span>
                        </div>
                        <span class="tree-node-count">{{ getTotalCount('mnr') }}</span>
                    </div>
                    
                    <!-- 子节点 -->
                    <transition name="slide-fade">
                        <div v-if="expandedNodes.mnr" class="tree-children">
                            <!-- 地调局系统 -->
                            <div class="tree-node-container-sub">
                                <div class="tree-node-header-sub" @click="toggleNode('mnr_geo')">
                                    <div class="flex items-center gap-2 flex-1">
                                        <svg class="w-4 h-4 transition-transform duration-300" 
                                             :class="{ 'rotate-90': expandedNodes.mnr_geo }"
                                             fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                                        </svg>
                                        <span class="tree-node-title-sub">地调局系统</span>
                                    </div>
                                    <span class="tree-node-count-sub">{{ vessels.mnr_geo.length }}</span>
                                </div>
                                
                                <transition name="slide-fade">
                                    <div v-if="expandedNodes.mnr_geo" class="tree-children-sub">
                                        <div v-if="vessels.mnr_geo.length === 0" class="tree-empty">
                                            暂无数据
                                        </div>
                                        <div v-for="vessel in vessels.mnr_geo" :key="vessel.id" 
                                             class="tree-leaf" 
                                             :class="{ 'selected': isVesselSelected('mnr_geo', vessel.id) }"
                                             @click="selectVessel(vessel, 'mnr_geo')">
                                            <div class="checkbox-wrapper" @click.stop="toggleVesselSelection('mnr_geo', vessel.id)">
                                                <div class="custom-checkbox" :class="{ 'checked': isVesselSelected('mnr_geo', vessel.id) }">
                                                    <svg v-if="isVesselSelected('mnr_geo', vessel.id)" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                                                    </svg>
                                                </div>
                                            </div>
                                            <div class="flex-1">
                                                <div class="vessel-name">{{ vessel.name }}</div>
                                                <div class="vessel-type">{{ vessel.type }}</div>
                                            </div>
                                        </div>
                                    </div>
                                </transition>
                            </div>
                            
                            <!-- 国家海洋局系统 -->
                            <div class="tree-node-container-sub">
                                <div class="tree-node-header-sub" @click="toggleNode('mnr_ocean')">
                                    <div class="flex items-center gap-2 flex-1">
                                        <svg class="w-4 h-4 transition-transform duration-300" 
                                             :class="{ 'rotate-90': expandedNodes.mnr_ocean }"
                                             fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                                        </svg>
                                        <span class="tree-node-title-sub">国家海洋局系统</span>
                                    </div>
                                    <span class="tree-node-count-sub">{{ vessels.mnr_ocean.length }}</span>
                                </div>
                                
                                <transition name="slide-fade">
                                    <div v-if="expandedNodes.mnr_ocean" class="tree-children-sub">
                                        <div v-if="vessels.mnr_ocean.length === 0" class="tree-empty">
                                            暂无数据
                                        </div>
                                        <div v-for="vessel in vessels.mnr_ocean" :key="vessel.id" 
                                             class="tree-leaf" 
                                             :class="{ 'selected': isVesselSelected('mnr_ocean', vessel.id) }"
                                             @click="selectVessel(vessel, 'mnr_ocean')">
                                            <div class="checkbox-wrapper" @click.stop="toggleVesselSelection('mnr_ocean', vessel.id)">
                                                <div class="custom-checkbox" :class="{ 'checked': isVesselSelected('mnr_ocean', vessel.id) }">
                                                    <svg v-if="isVesselSelected('mnr_ocean', vessel.id)" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                                                    </svg>
                                                </div>
                                            </div>
                                            <div class="flex-1">
                                                <div class="vessel-name">{{ vessel.name }}</div>
                                                <div class="vessel-type">{{ vessel.type }}</div>
                                            </div>
                                        </div>
                                    </div>
                                </transition>
                            </div>
                        </div>
                    </transition>
                </div>

                <!-- 中科院 -->
                <div class="tree-node-container">
                    <div class="tree-node-header" @click="toggleNode('cas')">
                        <div class="flex items-center gap-2 flex-1">
                            <svg class="w-4 h-4 transition-transform duration-300" 
                                 :class="{ 'rotate-90': expandedNodes.cas }"
                                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                            </svg>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                            </svg>
                            <span class="tree-node-title">中国科学院</span>
                        </div>
                        <span class="tree-node-count">{{ vessels.cas.length }}</span>
                    </div>
                    
                    <!-- 子节点 -->
                    <transition name="slide-fade">
                        <div v-if="expandedNodes.cas" class="tree-children">
                            <div v-if="vessels.cas.length === 0" class="tree-empty">
                                暂无数据
                            </div>
                            <div v-for="vessel in vessels.cas" :key="vessel.id" 
                                 class="tree-leaf"
                                 :class="{ 'selected': isVesselSelected('cas', vessel.id) }"
                                 @click="selectVessel(vessel, 'cas')">
                                <!-- 复选框 -->
                                <div class="checkbox-wrapper" @click.stop="toggleVesselSelection('cas', vessel.id)">
                                    <div class="custom-checkbox" :class="{ 'checked': isVesselSelected('cas', vessel.id) }">
                                        <svg v-if="isVesselSelected('cas', vessel.id)" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                                        </svg>
                                    </div>
                                </div>
                                <div class="flex-1">
                                    <div class="vessel-name">{{ vessel.name }}</div>
                                    <div class="vessel-type">{{ vessel.type }}</div>
                                </div>
                            </div>
                        </div>
                    </transition>
                </div>

                <!-- 高校 -->
                <div class="tree-node-container">
                    <div class="tree-node-header" @click="toggleNode('university')">
                        <div class="flex items-center gap-2 flex-1">
                            <svg class="w-4 h-4 transition-transform duration-300" 
                                 :class="{ 'rotate-90': expandedNodes.university }"
                                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                            </svg>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                            </svg>
                            <span class="tree-node-title">高等院校</span>
                        </div>
                        <span class="tree-node-count">{{ vessels.university.length }}</span>
                    </div>
                    
                    <!-- 子节点 -->
                    <transition name="slide-fade">
                        <div v-if="expandedNodes.university" class="tree-children">
                            <div v-if="vessels.university.length === 0" class="tree-empty">
                                暂无数据
                            </div>
                            <div v-for="vessel in vessels.university" :key="vessel.id" 
                                 class="tree-leaf"
                                 :class="{ 'selected': isVesselSelected('university', vessel.id) }"
                                 @click="selectVessel(vessel, 'university')">
                                <!-- 复选框 -->
                                <div class="checkbox-wrapper" @click.stop="toggleVesselSelection('university', vessel.id)">
                                    <div class="custom-checkbox" :class="{ 'checked': isVesselSelected('university', vessel.id) }">
                                        <svg v-if="isVesselSelected('university', vessel.id)" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                                        </svg>
                                    </div>
                                </div>
                                <div class="flex-1">
                                    <div class="vessel-name">{{ vessel.name }}</div>
                                    <div class="vessel-type">{{ vessel.type }}</div>
                                </div>
                            </div>
                        </div>
                    </transition>
                </div>
            </div>
        </div>

        <transition name="slide-right">
            <div v-if="showStatisticsPanel" class="fixed top-28 bottom-8 right-8 w-[30rem] z-40 pointer-events-auto font-['Noto_Sans_SC']">
                <div class="relative overflow-hidden h-full"
                     style="clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px)); background: linear-gradient(to right, rgba(30, 58, 138, 0.2), rgba(30, 58, 138, 0.25), rgba(30, 58, 138, 0.2)); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 2px solid rgba(6, 182, 212, 0.3); box-shadow: 0 0 40px rgba(6, 182, 212, 0.2);">
                    <div class="absolute inset-0 pointer-events-none">
                        <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-70"></div>
                        <div class="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-70"></div>
                        <div class="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-transparent via-cyan-400 to-transparent opacity-70"></div>
                        <div class="absolute top-0 right-0 w-[2px] h-full bg-gradient-to-b from-transparent via-cyan-400 to-transparent opacity-70"></div>
                    </div>
                    <div class="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-cyan-400/80"></div>
                    <div class="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-cyan-400/80"></div>
                    <div class="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-cyan-400/80"></div>
                    <div class="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-cyan-400/80"></div>

                    <div class="relative flex items-center justify-between px-4 py-2.5 border-b border-cyan-500/30"
                         style="background: rgba(6, 182, 212, 0.08);">
                        <div class="flex items-center gap-3">
                            <div class="w-1 h-6 bg-gradient-to-b from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/50"></div>
                            <h3 class="text-lg font-bold text-white tracking-wider" style="text-shadow: 0 0 10px rgba(6, 182, 212, 0.5);">
                                科考船航行时长统计
                            </h3>
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="text-cyan-200/90 text-xs font-semibold tracking-wide">
                                时间范围：近半年
                            </span>
                            <button @click="showStatisticsPanel = false"
                                    class="text-cyan-400 hover:text-white transition-all duration-300 hover:rotate-90">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div class="px-4 py-2 border-b border-cyan-500/20 bg-cyan-950/20">
                        <div class="flex items-center gap-3 whitespace-nowrap overflow-x-auto custom-scrollbar">
                            <span class="text-[11px] text-cyan-100/70 font-medium">图例：</span>
                            <button
                                v-for="legend in departmentLegend"
                                :key="legend.key"
                                type="button"
                                class="flex items-center gap-1.5 px-2 py-0.5 rounded border transition-all duration-200 shrink-0"
                                :class="isDepartmentSelected(legend.key)
                                    ? 'border-cyan-300/80 bg-cyan-400/20 shadow-[0_0_10px_rgba(34,211,238,0.25)]'
                                    : 'border-white/15 bg-white/5 hover:border-cyan-300/40 hover:bg-cyan-400/10'"
                                @click="toggleDepartmentFilter(legend.key)"
                            >
                                <span
                                    class="inline-block w-3 h-3 rounded-sm border border-white/40"
                                    :style="{ background: `linear-gradient(90deg, ${legend.startColor}, ${legend.endColor})` }"
                                ></span>
                                <span
                                    class="text-[11px] whitespace-nowrap"
                                    :class="isDepartmentSelected(legend.key) ? 'text-cyan-100 font-semibold' : 'text-slate-100/90'"
                                >
                                    {{ legend.label }}
                                </span>
                            </button>
                        </div>
                    </div>

                    <div class="p-1.5 h-[calc(100%-5.75rem)]">
                        <div ref="navigationHoursChartRef" class="w-full h-full"></div>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script>
import { ref, reactive, watch, nextTick, onUnmounted } from 'vue';
import * as echarts from 'echarts';

export default {
    name: 'ResearchVesselList',
    emits: ['close', 'vesselSelect'],
    setup(props, { emit }) {
        // 展开状态
        const expandedNodes = reactive({
            mnr: true,
            mnr_geo: false,
            mnr_ocean: false,
            cas: true,
            university: true
        });

        // 选中状态
        const selectedVessels = reactive({
            mnr_geo: [],
            mnr_ocean: [],
            cas: [],
            university: []
        });
        const showStatisticsPanel = ref(true);
        const navigationHoursChartRef = ref(null);
        const shipHoursData = ref([]);
        const selectedDepartmentKey = ref('');
        let navigationHoursChart = null;

        // 科考船数据
        const vessels = reactive({
            mnr_geo: [
                { id: 'mnr-geo-001', name: '海洋地质九号', type: '青岛海洋地质研究所' },
                { id: 'mnr-geo-002', name: '海洋地质七号', type: '青岛海洋地质研究所' },
                { id: 'mnr-geo-003', name: '海洋地质十七号', type: '烟台海洋带地质调查中心' },
                { id: 'mnr-geo-004', name: '海洋地质二号', type: '广州海洋地质调查局' },
                { id: 'mnr-geo-005', name: '海洋地质六号', type: '广州海洋地质调查局' },
                { id: 'mnr-geo-006', name: '海洋地质十号', type: '广州海洋地质调查局' },
                { id: 'mnr-geo-007', name: '海洋地质四号', type: '广州海洋地质调查局' },
                { id: 'mnr-geo-008', name: '海洋地质八号', type: '广州海洋地质调查局' },
                { id: 'mnr-geo-009', name: '海洋地质十二号', type: '广州海洋地质调查局' },
                { id: 'mnr-geo-010', name: '海洋地质十六号', type: '广州海洋地质调查局' },
                { id: 'mnr-geo-011', name: '海洋地质十八号', type: '广州海洋地质调查局' },
                { id: 'mnr-geo-012', name: '梦想号', type: '广州海洋地质调查局' },
                { id: 'mnr-geo-013', name: '海洋地质二十六号', type: '海口海洋地质调查中心' }
            ],
            mnr_ocean: [
                { id: 'mnr-ocean-001', name: '向阳红01', type: '自然资源部第一海洋研究所' },
                { id: 'mnr-ocean-002', name: '向阳红18', type: '自然资源部第一海洋研究所' },
                { id: 'mnr-ocean-003', name: '向阳红10', type: '自然资源部第二海洋研究所' },
                { id: 'mnr-ocean-004', name: '大洋号', type: '自然资源部第二海洋研究所' },
                { id: 'mnr-ocean-005', name: '向阳红03', type: '自然资源部第三海洋研究所' },
                { id: 'mnr-ocean-006', name: '大洋一号', type: '中国大洋局' },
                { id: 'mnr-ocean-007', name: '雪龙号', type: '中国极地研究中心' },
                { id: 'mnr-ocean-008', name: '雪龙2号', type: '中国极地研究中心' },
                { id: 'mnr-ocean-009', name: '向阳红06', type: '自然资源部北海分局' },
                { id: 'mnr-ocean-010', name: '向阳红09', type: '自然资源部北海分局' },
                { id: 'mnr-ocean-011', name: '向阳红08', type: '自然资源部北海分局' },
                { id: 'mnr-ocean-012', name: '向阳红07', type: '自然资源部北海分局' },
                { id: 'mnr-ocean-013', name: '向阳红20', type: '自然资源部东海分局' },
                { id: 'mnr-ocean-014', name: '向阳红28', type: '自然资源部东海分局' },
                { id: 'mnr-ocean-015', name: '向阳红14', type: '自然资源部南海分局' }
            ],
            cas: [
                { id: 'cas-001', name: '科学号', type: '中国科学院海洋研究所' },
                { id: 'cas-002', name: '科学三号', type: '中国科学院海洋研究所' },
                { id: 'cas-003', name: '探索一号', type: '中国科学院深海所' }
            ],
            university: [
                { id: 'uni-001', name: '东方红3', type: '中国海洋大学' },
                { id: 'uni-002', name: '东方红2', type: '中国海洋大学' },
                { id: 'uni-003', name: '天使1', type: '中国海洋大学' },
                { id: 'uni-004', name: '同济号', type: '同济大学' },
                { id: 'uni-005', name: '张謇号', type: '上海海洋大学' },
                { id: 'uni-006', name: '嘉庚号', type: '厦门大学' },
                { id: 'uni-007', name: '中号', type: '中山大学' },
                { id: 'uni-008', name: '"育鲲"', type: '大连海事大学' }
            ]
        });

        const normalizeVesselName = (name = '') => String(name).replace(/["'“”]/g, '').replace(/\s+/g, '').trim();

        const departmentStyles = {
            mnr_geo: {
                label: '自然资源部-地调局系统',
                startColor: '#60a5fa',
                endColor: '#2563eb',
                textColor: '#bfdbfe'
            },
            mnr_ocean: {
                label: '自然资源部-国家海洋局系统',
                startColor: '#2dd4bf',
                endColor: '#059669',
                textColor: '#99f6e4'
            },
            cas: {
                label: '中国科学院',
                startColor: '#fbbf24',
                endColor: '#ea580c',
                textColor: '#fde68a'
            },
            university: {
                label: '高等院校',
                startColor: '#fb7185',
                endColor: '#be123c',
                textColor: '#fecdd3'
            },
            unknown: {
                label: '未分类',
                startColor: '#94a3b8',
                endColor: '#64748b',
                textColor: '#cbd5e1'
            }
        };
        const departmentLegend = [
            {
                key: 'mnr_geo',
                label: '地调局系统',
                startColor: departmentStyles.mnr_geo.startColor,
                endColor: departmentStyles.mnr_geo.endColor
            },
            {
                key: 'mnr_ocean',
                label: '国家海洋局系统',
                startColor: departmentStyles.mnr_ocean.startColor,
                endColor: departmentStyles.mnr_ocean.endColor
            },
            {
                key: 'cas',
                label: '中国科学院',
                startColor: departmentStyles.cas.startColor,
                endColor: departmentStyles.cas.endColor
            },
            {
                key: 'university',
                label: '高等院校',
                startColor: departmentStyles.university.startColor,
                endColor: departmentStyles.university.endColor
            }
        ];

        const vesselDepartmentLookup = {};
        Object.entries(vessels).forEach(([departmentKey, vesselList]) => {
            vesselList.forEach((vessel) => {
                vesselDepartmentLookup[normalizeVesselName(vessel.name)] = departmentKey;
            });
        });

        const getDepartmentKeyByVesselName = (vesselName) => {
            const normalizedName = normalizeVesselName(vesselName);
            return vesselDepartmentLookup[normalizedName] || 'unknown';
        };

        // 获取总数（用于自然资源部）
        const getTotalCount = (category) => {
            if (category === 'mnr') {
                return vessels.mnr_geo.length + vessels.mnr_ocean.length;
            }
            return 0;
        };

        // 切换节点展开/折叠
        const toggleNode = (nodeKey) => {
            expandedNodes[nodeKey] = !expandedNodes[nodeKey];
        };

        // 切换船只选中状态
        const toggleVesselSelection = (category, vessel) => {
            const vesselInfo = typeof vessel === 'object'
                ? vessel
                : vessels[category].find(item => item.id === vessel) || { id: vessel, name: vessel, type: '' };
            const vesselId = vesselInfo.id;
            const index = selectedVessels[category].indexOf(vesselId);
            if (index > -1) {
                selectedVessels[category].splice(index, 1);
            } else {
                selectedVessels[category].push(vesselId);
            }
            const isSelected = selectedVessels[category].includes(vesselId);
            emit('vesselSelect', {
                vessel: JSON.parse(JSON.stringify(vesselInfo)),
                selected: isSelected
            });
            return isSelected;
        };

        // 检查船只是否被选中
        const isVesselSelected = (category, vesselId) => {
            return selectedVessels[category].includes(vesselId);
        };

        // 选择科考船（点击整行）
        const selectVessel = (vessel, category) => {
            toggleVesselSelection(category, vessel);
        };

        const loadShipHoursData = async () => {
            const response = await fetch('/ship_hours.json');
            const data = await response.json();
            shipHoursData.value = Array.isArray(data)
                ? data
                    .map(item => ({
                        vesselName: item.vessel_name || '未命名船舶',
                        navigationHours: Number(item.navigation_hours || 0),
                        navigationDays: Number(item.navigation_days || 0)
                    }))
                    .sort((a, b) => b.navigationHours - a.navigationHours)
                : [];
        };

        const createNavigationHoursChart = () => {
            if (!navigationHoursChartRef.value) {
                return;
            }
            if (navigationHoursChart) {
                navigationHoursChart.dispose();
            }
            navigationHoursChart = echarts.init(navigationHoursChartRef.value);
            const chartData = shipHoursData.value
                .map(item => {
                    const departmentKey = getDepartmentKeyByVesselName(item.vesselName);
                    return {
                        ...item,
                        departmentKey,
                        departmentLabel: departmentStyles[departmentKey]?.label || departmentStyles.unknown.label
                    };
                })
                .filter(item => !selectedDepartmentKey.value || item.departmentKey === selectedDepartmentKey.value);
            const vesselNames = chartData.map(item => item.vesselName);
            const hourValues = chartData.map(item => Number(item.navigationHours.toFixed(2)));
            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    backgroundColor: 'rgba(0, 20, 40, 0.95)',
                    borderColor: '#06b6d4',
                    borderWidth: 1,
                    textStyle: { color: '#fff', fontSize: 13, fontWeight: 600 },
                    formatter: params => {
                        if (!params.length) return '';
                        const index = params[0].dataIndex;
                        const item = chartData[index];
                        return `${item.vesselName}<br/>所属部门：${item.departmentLabel}<br/>${item.navigationHours.toFixed(2)}小时（${item.navigationDays.toFixed(2)}天）`;
                    }
                },
                grid: {
                    left: 10,
                    right: 8,
                    top: 8,
                    bottom: 16,
                    containLabel: true
                },
                xAxis: {
                    type: 'value',
                    name: '航行时长（小时）',
                    nameTextStyle: { color: '#67e8f9', fontSize: 13, fontWeight: 600 },
                    axisLine: { lineStyle: { color: 'rgba(103, 232, 249, 0.5)' } },
                    axisLabel: { color: '#e2e8f0', fontSize: 11, fontWeight: 600 },
                    splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.15)' } }
                },
                yAxis: {
                    type: 'category',
                    data: vesselNames,
                    inverse: true,
                    axisLine: { lineStyle: { color: 'rgba(103, 232, 249, 0.5)' } },
                    axisTick: { show: false },
                    axisLabel: {
                        fontSize: 12,
                        fontWeight: 600,
                        interval: 0,
                        color: (_, index) => {
                            const departmentKey = chartData[index]?.departmentKey || 'unknown';
                            return departmentStyles[departmentKey]?.textColor || departmentStyles.unknown.textColor;
                        }
                    }
                },
                series: [
                    {
                        type: 'bar',
                        data: hourValues,
                        barWidth: 12,
                        itemStyle: {
                            borderRadius: [0, 6, 6, 0],
                            borderColor: 'rgba(255, 255, 255, 0.35)',
                            borderWidth: 1,
                            color: params => {
                                const departmentKey = chartData[params.dataIndex]?.departmentKey || 'unknown';
                                const departmentStyle = departmentStyles[departmentKey] || departmentStyles.unknown;
                                return new echarts.graphic.LinearGradient(1, 0, 0, 0, [
                                    { offset: 0, color: departmentStyle.startColor },
                                    { offset: 1, color: departmentStyle.endColor }
                                ]);
                            }
                        },
                        label: {
                            show: true,
                            position: 'right',
                            color: '#f8fafc',
                            fontSize: 11,
                            fontWeight: 600,
                            formatter: params => {
                                const item = chartData[params.dataIndex];
                                if (!item) return '';
                                return `${item.navigationHours.toFixed(2)}小时（${item.navigationDays.toFixed(2)}天）`;
                            }
                        }
                    }
                ]
            };
            navigationHoursChart.setOption(option);
        };

        const toggleDepartmentFilter = (departmentKey) => {
            selectedDepartmentKey.value = selectedDepartmentKey.value === departmentKey ? '' : departmentKey;
            if (showStatisticsPanel.value) {
                nextTick(() => {
                    createNavigationHoursChart();
                });
            }
        };

        const isDepartmentSelected = (departmentKey) => selectedDepartmentKey.value === departmentKey;

        const toggleStatisticsPanel = () => {
            showStatisticsPanel.value = !showStatisticsPanel.value;
        };

        const handleResize = () => {
            if (navigationHoursChart) {
                navigationHoursChart.resize();
            }
        };

        watch(showStatisticsPanel, async (visible) => {
            if (visible) {
                await loadShipHoursData();
                await nextTick();
                createNavigationHoursChart();
            } else if (navigationHoursChart) {
                navigationHoursChart.dispose();
                navigationHoursChart = null;
            }
        }, { immediate: true });

        window.addEventListener('resize', handleResize);

        onUnmounted(() => {
            window.removeEventListener('resize', handleResize);
            if (navigationHoursChart) {
                navigationHoursChart.dispose();
                navigationHoursChart = null;
            }
        });

        return {
            expandedNodes,
            selectedVessels,
            vessels,
            departmentLegend,
            showStatisticsPanel,
            navigationHoursChartRef,
            toggleDepartmentFilter,
            isDepartmentSelected,
            toggleNode,
            toggleVesselSelection,
            isVesselSelected,
            selectVessel,
            getTotalCount,
            toggleStatisticsPanel
        };
    }
};
</script>

<style scoped>
/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.5);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(6, 182, 212, 0.3);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(6, 182, 212, 0.5);
}

/* 树节点容器 */
.tree-node-container {
    margin-bottom: 8px;
}

/* 树节点头部 */
.tree-node-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    background: transparent;
    border: 1px solid rgba(6, 182, 212, 0.4);
    border-left: 3px solid rgba(6, 182, 212, 0.7);
    cursor: pointer;
    transition: all 0.3s ease;
    clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%);
}

.tree-node-header:hover {
    background: rgba(6, 182, 212, 0.1);
    border-color: rgba(6, 182, 212, 0.7);
    box-shadow: 0 0 15px rgba(6, 182, 212, 0.2);
}

.tree-node-header svg {
    color: #22d3ee;
}

.tree-node-title {
    font-size: 15px;
    font-weight: 700;
    color: #f1f5f9;
    text-shadow: 
        0 0 10px rgba(34, 211, 238, 0.5),
        1px 1px 2px rgba(0, 0, 0, 0.8);
}

.tree-node-count {
    font-size: 13px;
    font-weight: 700;
    color: #22d3ee;
    background: rgba(6, 182, 212, 0.15);
    padding: 3px 10px;
    border-radius: 10px;
    border: 1px solid rgba(6, 182, 212, 0.3);
    text-shadow: 0 0 5px rgba(34, 211, 238, 0.5);
}

/* 二级节点容器 */
.tree-node-container-sub {
    margin-bottom: 6px;
}

/* 二级节点头部 */
.tree-node-header-sub {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    background: transparent;
    border: 1px solid rgba(6, 182, 212, 0.3);
    border-left: 2px solid rgba(6, 182, 212, 0.5);
    cursor: pointer;
    transition: all 0.3s ease;
    margin-left: 10px;
}

.tree-node-header-sub:hover {
    background: rgba(6, 182, 212, 0.08);
    border-color: rgba(6, 182, 212, 0.6);
    box-shadow: 0 0 10px rgba(6, 182, 212, 0.15);
}

.tree-node-title-sub {
    font-size: 14px;
    font-weight: 600;
    color: #e0f2fe;
    text-shadow: 
        0 0 6px rgba(34, 211, 238, 0.3),
        1px 1px 2px rgba(0, 0, 0, 0.8);
}

.tree-node-count-sub {
    font-size: 12px;
    font-weight: 600;
    color: #22d3ee;
    background: rgba(6, 182, 212, 0.12);
    padding: 2px 8px;
    border-radius: 8px;
    border: 1px solid rgba(6, 182, 212, 0.25);
    text-shadow: 0 0 4px rgba(34, 211, 238, 0.4);
}

/* 二级子节点容器 */
.tree-children-sub {
    margin-top: 4px;
    margin-left: 15px;
    padding-left: 10px;
    border-left: 1px dashed rgba(6, 182, 212, 0.25);
}

/* 子节点容器 */
.tree-children {
    margin-top: 4px;
    margin-left: 20px;
    padding-left: 12px;
    border-left: 1px dashed rgba(6, 182, 212, 0.3);
}

/* 叶子节点 */
.tree-leaf {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px;
    margin-bottom: 3px;
    background: transparent;
    border: 1px solid rgba(6, 182, 212, 0.2);
    cursor: pointer;
    transition: all 0.3s ease;
    clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%);
}

.tree-leaf:hover {
    background: rgba(6, 182, 212, 0.15);
    border-color: rgba(6, 182, 212, 0.5);
    transform: translateX(4px);
    box-shadow: 0 0 10px rgba(6, 182, 212, 0.2);
}

.tree-leaf.selected {
    background: rgba(6, 182, 212, 0.2);
    border-color: rgba(6, 182, 212, 0.6);
}

/* 复选框容器 */
.checkbox-wrapper {
    display: flex;
    align-items: center;
    padding: 2px;
}

/* 自定义复选框 */
.custom-checkbox {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(6, 182, 212, 0.5);
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    transition: all 0.3s ease;
    cursor: pointer;
}

.custom-checkbox:hover {
    border-color: rgba(6, 182, 212, 0.8);
    box-shadow: 0 0 8px rgba(6, 182, 212, 0.4);
}

.custom-checkbox.checked {
    background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
    border-color: #06b6d4;
    box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
}

.custom-checkbox svg {
    color: #fff;
}

.tree-leaf svg {
    color: #06b6d4;
    flex-shrink: 0;
}

.vessel-name {
    font-size: 14px;
    color: #f1f5f9;
    font-weight: 700;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    line-height: 1.4;
}

.vessel-type {
    font-size: 12px;
    color: #94a3b8;
    font-weight: 500;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    margin-top: 2px;
}

.tree-leaf:hover .vessel-name {
    color: #22d3ee;
}

.tree-leaf:hover .vessel-type {
    color: #cbd5e1;
}

/* 空状态 */
.tree-empty {
    padding: 12px;
    text-align: center;
    font-size: 12px;
    color: #64748b;
    font-style: italic;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

/* 展开/折叠动画 */
.slide-fade-enter-active,
.slide-fade-leave-active {
    transition: all 0.3s ease;
}

.slide-fade-enter-from {
    opacity: 0;
    transform: translateY(-10px);
}

.slide-fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}
</style>
