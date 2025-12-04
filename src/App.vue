<template>
    <div class="relative w-screen h-screen overflow-hidden bg-slate-950 text-white font-sans selection:bg-cyan-500 selection:text-white">
        
        <!-- Scaled Container -->
        <div id="screen-container" class="absolute top-0 left-0 overflow-hidden shadow-2xl transition-transform duration-75 ease-linear" :style="containerStyle">
            
            <!-- Map Layer (Z-0) -->
            <MapContainer 
                :showToolbar="activePanels.mapTools" 
                :filters="filters"
                :layerState="layerState"
                @dataLoaded="handleDataLoaded"
            />
            
            <!-- UI Layer (Z-10+) -->
            <div class="absolute inset-0 pointer-events-none">
                <Header @tabChange="handleTabChange" />
                <LeftPanel 
                    :availableCountries="availableCountries"
                    :showQueryPanel="activePanels.query"
                    :showLayersPanel="activePanels.layers"
                    @filterChange="handleFilterChange"
                    @layersChange="handleLayersChange"
                />
                <RightPanel 
                    @toggleList="toggleList"
                    @toggleMapTools="toggleMapTools"
                    @toggleQuery="toggleQuery"
                    @toggleLayers="toggleLayers"
                    :activePanels="activePanels"
                    :currentTab="currentTab"
                />
                
                <div v-if="activePanels.list" class="pointer-events-auto">
                     <BottomTable :miningData="filteredMiningData" />
                </div>
            </div>

            <!-- Decorative Overlay Effects -->
            <div class="absolute inset-0 pointer-events-none z-50 mix-blend-overlay opacity-30 bg-[radial-gradient(circle_at_center,transparent_50%,#000_100%)]"></div>
            
            <!-- Corner Decors -->
            <div class="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-transparent pointer-events-none" style="clip-path: polygon(0 0, 100% 0, 0 100%)"></div>
            <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-cyan-500/10 to-transparent pointer-events-none" style="clip-path: polygon(0 0, 100% 0, 100% 100%)"></div>
            <div class="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none"></div>
        </div>
    </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import Header from './components/Header.vue';
import LeftPanel from './components/LeftPanel.vue';
import RightPanel from './components/RightPanel.vue';
import MapContainer from './components/MapContainer.vue';
import BottomTable from './components/BottomTable.vue';

// 不再需要 PanelState 枚举

export default {
    components: {
        Header,
        LeftPanel,
        RightPanel,
        MapContainer,
        BottomTable
    },
    setup() {
        // ==================== 状态管理 ====================
        
        // 当前选中的顶部选项卡（默认：一图一表）
        const currentTab = ref('一图一表');
        
        // 各个功能面板的显示状态
        const activePanels = ref({
            list: false,      // 矿区列表（底部表格）
            mapTools: false,  // 地图工具栏
            query: true,      // 矿区查询面板（左侧）
            layers: true      // 图层控制面板（左侧）
        });
        
        // 屏幕缩放比例（用于响应式适配）
        const scale = ref({ x: 1, y: 1 });
        
        // 筛选条件（矿种、大洋、国家）
        const filters = ref({
            minerals: [],   // 选中的矿种列表
            oceans: [],     // 选中的大洋列表
            countries: []   // 选中的国家列表
        });
        
        // 可用的国家列表（从 GeoJSON 数据中提取）
        const availableCountries = ref([]);
        
        // 所有矿区数据（从 GeoJSON 加载）
        const allMiningData = ref([]);

        // 图层控制状态（从 LeftPanel 同步，用于控制地图上的专题图层）
        const layerState = ref([]);
        
        // 根据筛选条件过滤后的矿区数据（用于底部表格显示）
        const filteredMiningData = computed(() => {
            if (!allMiningData.value.length) return [];
            
            const { minerals, oceans, countries } = filters.value;
            const hasFilter = minerals.length > 0 || oceans.length > 0 || countries.length > 0;
            
            if (!hasFilter) {
                return allMiningData.value;
            }
            
            return allMiningData.value.filter(item => {
                let matches = true;
                
                // 矿种筛选
                if (minerals.length > 0) {
                    const mineralMatch = minerals.some(mineral => {
                        if (item.mineral === mineral) return true;
                        if (item.mineral && item.mineral.includes(mineral)) return true;
                        if (mineral === '富钴铁锰结壳' && item.mineral && item.mineral.includes('富钴结壳')) return true;
                        return false;
                    });
                    if (!mineralMatch) matches = false;
                }
                
                // 大洋筛选
                if (oceans.length > 0) {
                    const oceanMatch = oceans.some(ocean => {
                        const oceanKey = ocean.replace('洋', '');
                        return item.location && item.location.includes(oceanKey);
                    });
                    if (!oceanMatch) matches = false;
                }
                
                // 国家筛选
                if (countries.length > 0) {
                    const countryMatch = countries.some(country => item.sponsor === country);
                    if (!countryMatch) matches = false;
                }
                
                return matches;
            });
        });
        
        // ==================== 响应式适配 ====================
        
        // 基准分辨率（设计稿尺寸）
        const baseWidth = 1920;
        const baseHeight = 1080;

        /**
         * 更新屏幕缩放比例
         * 根据当前窗口尺寸与基准尺寸的比例，计算缩放系数
         */
        const updateScale = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            scale.value = {
                x: width / baseWidth,
                y: height / baseHeight
            };
        };

        /**
         * 容器样式（应用缩放变换）
         * 使用 CSS transform: scale() 实现响应式适配
         */
        const containerStyle = computed(() => ({
            transform: `scale(${scale.value.x}, ${scale.value.y})`,
            transformOrigin: 'top left',
            width: `${baseWidth}px`,
            height: `${baseHeight}px`
        }));

        // ==================== 面板切换函数 ====================
        
        /**
         * 切换矿区列表（底部表格）的显示状态
         */
        const toggleList = () => {
            activePanels.value.list = !activePanels.value.list;
        };

        /**
         * 切换地图工具栏的显示状态
         */
        const toggleMapTools = () => {
            activePanels.value.mapTools = !activePanels.value.mapTools;
        };

        /**
         * 切换矿区查询面板的显示状态
         */
        const toggleQuery = () => {
            activePanels.value.query = !activePanels.value.query;
        };

        /**
         * 切换图层控制面板的显示状态
         */
        const toggleLayers = () => {
            activePanels.value.layers = !activePanels.value.layers;
        };

        // ==================== 数据处理函数 ====================
        
        /**
         * 处理 GeoJSON 数据加载完成事件
         * @param {Object} data - 包含国家列表和矿区数据的对象
         * @param {Array} data.countries - 所有担保国列表
         * @param {Array} data.miningData - 所有矿区数据
         */
        const handleDataLoaded = (data) => {
            availableCountries.value = data.countries;
            if (data.miningData) {
                allMiningData.value = data.miningData;
            }
            console.log('📊 App.vue 接收到数据:', {
                countries: data.countries?.length,
                miningData: data.miningData?.length
            });
        };

        /**
         * 处理筛选条件变化事件
         * @param {Object} newFilters - 新的筛选条件
         * @param {Array} newFilters.minerals - 选中的矿种列表
         * @param {Array} newFilters.oceans - 选中的大洋列表
         * @param {Array} newFilters.countries - 选中的国家列表
         */
        const handleFilterChange = (newFilters) => {
            filters.value = newFilters;
            console.log('🔍 App.vue 筛选条件变化:', newFilters);
        };

        /**
         * 处理图层控制变化事件
         * @param {Array} layers - 左侧图层面板当前状态
         */
        const handleLayersChange = (layers) => {
            layerState.value = layers;
            console.log('🗺️ App.vue 图层状态变化:', layers);
        };
        
        /**
         * 处理顶部选项卡切换事件
         * @param {String} tab - 选中的选项卡名称
         * 
         * 功能：
         * 1. 更新当前选项卡状态
         * 2. 根据选项卡切换右侧功能面板
         * 3. 非"一图一表"选项卡时，关闭所有面板
         */
        const handleTabChange = (tab) => {
            console.log('📑 切换选项卡:', tab);
            currentTab.value = tab;
            
            // 根据选项卡切换右侧功能面板
            // 只有"一图一表"显示当前的矿区查询功能
            if (tab === '一图一表') {
                // 保持当前状态
            } else {
                // 其他选项卡：关闭所有面板
                activePanels.value = {
                    list: false,
                    mapTools: false,
                    query: false,
                    layers: false
                };
            }
        };

        // ==================== 生命周期钩子 ====================
        
        /**
         * 组件挂载时：
         * 1. 初始化屏幕缩放比例
         * 2. 监听窗口大小变化事件
         */
        onMounted(() => {
            updateScale();
            window.addEventListener('resize', updateScale);
        });

        /**
         * 组件卸载时：
         * 移除窗口大小变化监听器
         */
        onUnmounted(() => {
            window.removeEventListener('resize', updateScale);
        });

        return {
            currentTab,
            activePanels,
            toggleList,
            toggleMapTools,
            toggleQuery,
            toggleLayers,
            handleDataLoaded,
            handleFilterChange,
            handleLayersChange,
            handleTabChange,
            filters,
            availableCountries,
            allMiningData,
            filteredMiningData,
            layerState,
            containerStyle
        };
    }
};
</script>