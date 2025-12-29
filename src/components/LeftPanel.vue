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

            <div class="space-y-5">
                <!-- Level 1: 矿种类型（支持多选） -->
                <div class="space-y-2">
                    <div class="text-cyan-400 text-base font-bold flex items-center">
                        <div class="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-2.5"></div>矿种类型
                        <span v-if="activeMinerals.length > 0" class="ml-2 text-xs text-yellow-400">(已选 {{ activeMinerals.length }})</span>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <button v-for="m in MINERAL_TYPES" :key="m"
                            @click="toggleMineral(m)"
                            :class="[
                                'text-base px-4 py-1.5 rounded-sm transition-all duration-200 border skew-x-[-10deg]',
                                activeMinerals.includes(m)
                                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 border-blue-300 text-white shadow-[0_0_10px_rgba(37,99,235,0.6)] font-bold' 
                                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-cyan-500/50 hover:text-cyan-200'
                            ]"
                        >
                            <span class="block skew-x-[10deg]">{{ m }}</span>
                        </button>
                    </div>
                </div>

                <!-- Level 2: 大洋区域（支持多选） -->
                <div class="space-y-2 pt-2 border-t border-dashed border-slate-700/50">
                     <div class="text-cyan-400 text-base font-bold flex items-center">
                        <div class="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-2.5"></div>所属大洋
                        <span v-if="activeOceans.length > 0" class="ml-2 text-xs text-yellow-400">(已选 {{ activeOceans.length }})</span>
                    </div>
                    <div class="flex gap-2">
                        <button v-for="ocean in OCEANS" :key="ocean"
                            @click="toggleOcean(ocean)"
                            :class="[
                                'flex-1 py-1.5 rounded-sm text-base font-bold transition-all border',
                                activeOceans.includes(ocean)
                                    ? 'bg-cyan-700/80 border-cyan-400 text-white shadow-[0_0_10px_cyan]' 
                                    : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:text-slate-300'
                            ]"
                        >
                            {{ ocean }}
                        </button>
                    </div>
                </div>

                <!-- Level 3: 国家（可折叠面板） -->
                <div class="space-y-2 pt-2 border-t border-dashed border-slate-700/50">
                    <!-- 标题栏 -->
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2 flex-1">
                            <div class="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                            <span class="text-cyan-400 text-base font-bold">所属国家</span>
                            <span v-if="activeCountries.length > 0" class="text-xs text-yellow-400">(已选 {{ activeCountries.length }})</span>
                            
                            <!-- 展开/收起箭头 -->
                            <button 
                                @click="toggleCountryPanel"
                                class="ml-auto p-1 text-cyan-400 hover:text-cyan-300 transition-all"
                                :title="showCountryPanel ? '收起' : '展开'"
                            >
                                <svg 
                                    class="w-5 h-5 transition-transform duration-300" 
                                    :class="{ 'rotate-180': showCountryPanel }"
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                </svg>
                            </button>
                            
                            <!-- 清空按钮 -->
                            <button 
                                v-if="activeCountries.length > 0"
                                @click="clearCountries"
                                class="px-2 py-1 bg-red-600/80 border border-red-500 text-white rounded-sm text-xs font-medium transition-all hover:bg-red-700"
                                title="清空所有国家筛选"
                            >
                                清空
                            </button>
                        </div>
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
            </div>
            </div>
        </transition>

        <!-- 2. 图层控制面板 - 增强科技感 -->
        <transition name="slide-down">
            <div v-if="showLayersPanel" class="tech-panel-enhanced p-6 pointer-events-auto relative group" style="clip-path: polygon(0 0, 92% 0, 100% 5%, 100% 100%, 0 100%);">
                <!-- 动态扫描线 -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
                <div class="corner-decoration corner-bl scale-125"></div>
                <div class="corner-decoration corner-br scale-125"></div>
             
             <div class="flex items-center mb-4 border-b-2 border-cyan-500/30 pb-3">
                <div class="w-1.5 h-6 bg-yellow-400 mr-3 shadow-[0_0_10px_#facc15]"></div>
                <h3 class="text-2xl font-bold text-white tracking-wider flex-1">图层控制</h3>
                <span class="text-sm text-cyan-400 font-mono border border-cyan-500/30 px-2 py-0.5 rounded bg-cyan-900/30">{{ activeOcean }}区域</span>
            </div>
             
             <div class="space-y-2 mt-2 max-h-[35vh] overflow-y-auto pr-2 custom-scrollbar">
                <div v-for="layer in layers" :key="layer.id" class="mb-2">
                    <!-- Parent Layer -->
                    <div class="flex items-center justify-between py-2 px-4 bg-slate-800/40 border border-slate-700/50 hover:border-cyan-500/50 rounded-sm transition-all cursor-pointer" @click="toggleLayer(layer.id)">
                        <div class="flex items-center gap-3">
                            <div :class="['w-2.5 h-2.5 rotate-45 transition-all duration-300', layer.active ? 'bg-cyan-400 shadow-[0_0_8px_cyan]' : 'bg-slate-600']"></div>
                            <span :class="['text-lg font-bold transition-colors', layer.active ? 'text-white' : 'text-slate-400']">{{ layer.label }}</span>
                        </div>
                        <!-- Switch -->
                        <div :class="['w-9 h-4 relative transition-colors duration-300 rounded-full', layer.active ? 'bg-cyan-600' : 'bg-slate-700']">
                            <div :class="['absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-300 shadow-sm', layer.active ? 'left-[22px]' : 'left-0.5']"></div>
                        </div>
                    </div>

                    <!-- Sub Layers -->
                    <div v-if="layer.subLayers && layer.active" class="ml-6 pl-4 border-l border-slate-600/30 mt-1 space-y-1">
                        <div v-for="sub in layer.subLayers" :key="sub.id" 
                            class="flex items-center justify-between py-1.5 px-2 hover:bg-cyan-500/10 rounded cursor-pointer"
                            @click.stop="toggleLayer(layer.id, sub.id)"
                        >
                             <span :class="['text-base transition-colors', sub.active ? 'text-cyan-100' : 'text-slate-500']">{{ sub.label }}</span>
                             <div :class="['w-2 h-2 rounded-full', sub.active ? 'bg-yellow-400 shadow-[0_0_5px_yellow]' : 'bg-slate-600']"></div>
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
import { MINERAL_TYPES, OCEANS, getLayersByOcean, WEATHER_LAYER_GROUPS } from '../constants.js';

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
    emits: ['filterChange', 'layersChange', 'weatherLayersChange'], // 向父组件发送筛选条件变化事件 & 图层变化 & 气象图层变化
    setup(props, { emit }) {
        // ==================== 状态管理 ====================
        
        // 选中的矿种列表（支持多选）
        const activeMinerals = ref([]);
        
        // 选中的大洋列表（支持多选）
        const activeOceans = ref([]);
        
        // 选中的国家列表（支持多选）
        const activeCountries = ref([]);
        
        // 当前可用的国家列表（从 GeoJSON 数据中提取）
        const currentCountries = ref([]);
        
        // 图层数据（用于图层控制面板）
        const layers = ref(getLayersByOcean(OCEANS[0]));

        // 当前激活的大洋（用于标题显示）
        const activeOcean = computed(() => {
            return activeOceans.value[0] || OCEANS[0];
        });
        
        // 国家面板的展开/收起状态
        const showCountryPanel = ref(false);
        
        // 气象图层分组数据（用于气象图层面板）
        const weatherLayerGroups = ref(WEATHER_LAYER_GROUPS);

        // ==================== 监听器 ====================
        
        /**
         * 向父组件发送当前图层状态
         */
        const emitLayers = () => {
            emit('layersChange', layers.value);
        };

        /**
         * 监听传入的国家列表变化
         * 当 GeoJSON 数据加载完成后，更新可用的国家列表
         */
        watch(() => props.availableCountries, (newCountries) => {
            console.log('🌍 LeftPanel 接收到国家列表:', newCountries);
            currentCountries.value = newCountries;
        }, { immediate: true });

        // ==================== 事件处理函数 ====================
        
        /**
         * 发送筛选条件变化事件
         * 向父组件（App.vue）发送当前的筛选条件
         * 
         * 筛选条件包括：
         * - minerals: 选中的矿种列表
         * - oceans: 选中的大洋列表
         * - countries: 选中的国家列表
         */
        const emitFilter = () => {
            console.log('📤 LeftPanel 发送筛选:', {
                minerals: activeMinerals.value,
                oceans: activeOceans.value,
                countries: activeCountries.value
            });
            emit('filterChange', {
                minerals: activeMinerals.value,
                oceans: activeOceans.value,
                countries: activeCountries.value
            });
        };

        /**
         * 切换矿种选择状态（支持多选）
         * @param {String} mineral - 矿种名称
         * 
         * 功能：
         * 1. 如果已选中，则移除
         * 2. 如果未选中，则添加
         * 3. 触发筛选条件变化事件
         */
        const toggleMineral = (mineral) => {
            const index = activeMinerals.value.indexOf(mineral);
            if (index > -1) {
                // 已选中，则移除
                activeMinerals.value.splice(index, 1);
            } else {
                // 未选中，则添加
                activeMinerals.value.push(mineral);
            }
            emitFilter();
        };

        /**
         * 切换大洋选择状态（支持多选）
         * @param {String} ocean - 大洋名称
         * 
         * 功能：
         * 1. 如果已选中，则移除
         * 2. 如果未选中，则添加
         * 3. 触发筛选条件变化事件
         */
        const toggleOcean = (ocean) => {
            const index = activeOceans.value.indexOf(ocean);
            if (index > -1) {
                // 已选中，则移除
                activeOceans.value.splice(index, 1);
            } else {
                // 未选中，则添加
                activeOceans.value.push(ocean);
            }
            emitFilter();
        };

        /**
         * 切换国家面板的展开/收起状态
         * 用于折叠面板的交互
         */
        const toggleCountryPanel = () => {
            showCountryPanel.value = !showCountryPanel.value;
        };

        /**
         * 切换国家选择状态（支持多选）
         * @param {String} country - 国家名称
         * 
         * 功能：
         * 1. 如果已选中，则移除
         * 2. 如果未选中，则添加
         * 3. 触发筛选条件变化事件
         */
        const toggleCountry = (country) => {
            const index = activeCountries.value.indexOf(country);
            if (index > -1) {
                // 已选中，则移除
                activeCountries.value.splice(index, 1);
            } else {
                // 未选中，则添加
                activeCountries.value.push(country);
            }
            emitFilter();
        };

        /**
         * 移除单个国家
         * @param {String} country - 国家名称
         * 
         * 功能：
         * 从选中的国家列表中移除指定国家，并触发筛选条件变化
         * 用于国家标签的删除按钮
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
         * 
         * 功能：
         * 一键清空所有选中的国家，并触发筛选条件变化
         * 用于"清除全部"按钮
         */
        const clearCountries = () => {
            activeCountries.value = [];
            emitFilter();
        };

        /**
         * 监听大洋选择变化，动态更新图层数据
         * 
         * 功能：
         * 当用户选择不同的大洋时，图层控制面板会显示对应大洋的图层
         * 如果没有选择大洋，则显示第一个大洋的图层
        */
        watch(activeOceans, (newOceans) => {
            if (newOceans.length > 0) {
                layers.value = getLayersByOcean(newOceans[0]);
            } else {
                layers.value = getLayersByOcean(OCEANS[0]);
            }
            emitLayers();
        });

        /**
         * 切换图层的显示状态
         * @param {String} parentId - 父图层ID
         * @param {String} layerId - 子图层ID（可选）
         * 
         * 功能：
         * 1. 如果只传 parentId，则切换父图层的显示状态
         * 2. 如果同时传 parentId 和 layerId，则切换子图层的显示状态
         * 
         * 用于图层控制面板的复选框交互
         */
        const toggleLayer = (parentId, layerId) => {
            const parent = layers.value.find(l => l.id === parentId);
            if (parent) {
                if (layerId && parent.subLayers) {
                    // 切换子图层
                    const sub = parent.subLayers.find(l => l.id === layerId);
                    if (sub) sub.active = !sub.active;
                } else {
                    // 切换父图层：控制该父图层下所有子图层
                    const newActive = !parent.active;
                    parent.active = newActive;

                    if (parent.subLayers && parent.subLayers.length) {
                        if (!newActive) {
                            // 关闭父图层：记录当前哪些子图层是开的，然后全部关掉
                            parent._prevSubActive = parent.subLayers
                                .filter(s => s.active)
                                .map(s => s.id);
                            parent.subLayers.forEach(s => { s.active = false; });
                        } else {
                            // 打开父图层：恢复之前开着的子图层；如果没有记录，则默认全部打开
                            const prev = parent._prevSubActive && parent._prevSubActive.length
                                ? parent._prevSubActive
                                : parent.subLayers.map(s => s.id);
                            parent.subLayers.forEach(s => {
                                s.active = prev.includes(s.id);
                            });
                        }
                    }
                }
                emitLayers();
            }
        };

        /**
         * 切换气象图层组的显示状态
         * @param {String} groupId - 气象图层组ID
         */
        const toggleWeatherGroup = (groupId) => {
            const group = weatherLayerGroups.value.find(g => g.id === groupId);
            if (group) {
                const newActive = !group.active;
                group.active = newActive;

                if (group.subLayers && group.subLayers.length) {
                    if (!newActive) {
                        // 关闭父图层：记录当前哪些子图层是开的，然后全部关掉
                        group._prevSubActive = group.subLayers
                            .filter(s => s.active)
                            .map(s => s.id);
                        group.subLayers.forEach(s => { s.active = false; });
                    } else {
                        // 打开父图层：恢复之前开着的子图层
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
         * @param {String} groupId - 气象图层组ID
         * @param {String} subId - 子图层ID
         */
        const toggleWeatherSubLayer = (groupId, subId) => {
            const group = weatherLayerGroups.value.find(g => g.id === groupId);
            if (group && group.subLayers) {
                const sub = group.subLayers.find(s => s.id === subId);
                if (sub) {
                    sub.active = !sub.active;
                    console.log(`🌦️ 气象图层 "${sub.label}" ${sub.active ? '已开启' : '已关闭'}`);
                    // 通知父组件气象图层变化
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
        emitWeatherLayers(); // 同时发送气象图层状态

        return {
            activeMinerals,
            activeOceans,
            activeCountries,
            currentCountries,
            layers,
            activeOcean,
            showCountryPanel,
            weatherLayerGroups,
            toggleMineral,
            toggleOcean,
            toggleCountryPanel,
            toggleCountry,
            removeCountry,
            clearCountries,
            emitFilter,
            toggleLayer,
            toggleWeatherGroup,
            toggleWeatherSubLayer,
            MINERAL_TYPES,
            OCEANS
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