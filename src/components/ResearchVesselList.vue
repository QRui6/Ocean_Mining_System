<template>
    <div class="fixed left-8 top-40 z-30 w-[28rem] pointer-events-auto font-['Noto_Sans_SC']">
        <!-- 主容器 - 科技感边框 -->
        <div class="relative backdrop-blur-md overflow-hidden"
             style="clip-path: polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px)); background: rgba(15, 30, 60, 0.3);">
            
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
                <button @click="$emit('close')" 
                        class="text-cyan-400 hover:text-white transition-all duration-300 hover:rotate-90">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
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
    </div>
</template>

<script>
import { ref, reactive } from 'vue';

export default {
    name: 'ResearchVesselList',
    emits: ['close', 'vesselSelect'],
    setup(props, { emit }) {
        // 展开状态
        const expandedNodes = reactive({
            mnr: false,
            mnr_geo: false,
            mnr_ocean: false,
            cas: false,
            university: false
        });

        // 选中状态
        const selectedVessels = reactive({
            mnr_geo: [],
            mnr_ocean: [],
            cas: [],
            university: []
        });

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
        const toggleVesselSelection = (category, vesselId) => {
            const index = selectedVessels[category].indexOf(vesselId);
            if (index > -1) {
                selectedVessels[category].splice(index, 1);
            } else {
                selectedVessels[category].push(vesselId);
            }
        };

        // 检查船只是否被选中
        const isVesselSelected = (category, vesselId) => {
            return selectedVessels[category].includes(vesselId);
        };

        // 选择科考船（点击整行）
        const selectVessel = (vessel, category) => {
            toggleVesselSelection(category, vessel.id);
            emit('vesselSelect', vessel);
        };

        return {
            expandedNodes,
            selectedVessels,
            vessels,
            toggleNode,
            toggleVesselSelection,
            isVesselSelected,
            selectVessel,
            getTotalCount
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
