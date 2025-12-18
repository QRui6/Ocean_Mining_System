<template>
    <div class="relative w-screen h-screen overflow-hidden bg-slate-950 text-white font-sans selection:bg-cyan-500 selection:text-white">
        
        <!-- Scaled Container -->
        <div id="screen-container" class="absolute top-0 left-0 overflow-hidden shadow-2xl transition-transform duration-75 ease-linear" :style="containerStyle">
            
            <!-- Map Layer (Z-0) -->
            <MapContainer 
                :showToolbar="activePanels.mapTools" 
                :filters="filters"
                :layerState="layerState"
                :weatherLayerState="weatherLayerState"
                :shipToLocate="shipToLocate"
                :routeToDraw="routeToDraw"
                :trackToDraw="trackToDraw"
                :routeWeatherRequest="routeWeatherRequest"
                :weatherFilter="weatherFilter"
                @dataLoaded="handleDataLoaded"
                @weatherDataLoaded="handleWeatherDataLoaded"
            />
            
            <!-- UI Layer (Z-10+) -->
            <div class="absolute inset-0 pointer-events-none">
                <Header @tabChange="handleTabChange" />
                <LeftPanel 
                    :availableCountries="availableCountries"
                    :showQueryPanel="activePanels.query"
                    :showLayersPanel="activePanels.layers"
                    :showWeatherLayersPanel="activePanels.weatherLayers"
                    @filterChange="handleFilterChange"
                    @layersChange="handleLayersChange"
                    @weatherLayersChange="handleWeatherLayersChange"
                />
                
                <!-- 船舶追踪面板（包含船舶搜索和航线规划） -->
                <ShipTrackingPanel 
                    :showShipSearch="activePanels.shipSearch"
                    :showRoutePlan="activePanels.routePlan"
                    :showHistoryTrack="activePanels.historyTrack"
                    @locate="handleShipLocate"
                    @routePlanned="handleRoutePlanned"
                    @routeCleared="handleRouteCleared"
                    @trackLoaded="handleTrackLoaded"
                    @trackCleared="handleTrackCleared"
                    @routeWeatherAnalysis="handleRouteWeatherAnalysis"
                />
                
                <RightPanel 
                    @toggleList="toggleList"
                    @toggleMapTools="toggleMapTools"
                    @toggleQuery="toggleQuery"
                    @toggleLayers="toggleLayers"
                    @toggleWeatherLayers="toggleWeatherLayers"
                    @toggleShipSearch="toggleShipSearch"
                    @toggleRoutePlan="toggleRoutePlan"
                    @toggleHistoryTrack="toggleHistoryTrack"
                    @toggleShipList="toggleShipList"
                    @toggleRouteWeather="handleRouteWeatherAnalysis"
                    :activePanels="activePanels"
                    :currentTab="currentTab"
                />
                
                <div v-if="activePanels.list" class="pointer-events-auto">
                     <BottomTable :miningData="filteredMiningData" />
                </div>
                
                <div v-if="activePanels.shipList" class="pointer-events-auto">
                     <ShipListTable 
                        :shipData="shipListData" 
                        @rowClick="handleShipListRowClick"
                        @clear="handleClearShipList"
                    />
                </div>
                
                <!-- 气象数据列表 -->
                <WeatherListTable 
                    v-if="showWeatherList && weatherListData.length > 0"
                    :weatherData="weatherListData"
                    @clear="handleClearWeatherList"
                    @filter="handleWeatherFilter"
                    @rowClick="handleWeatherRowClick"
                    @refresh="handleWeatherRefresh"
                />
                
                <!-- 时间轴控制（当有气象图层激活时显示） -->
                <TimelineControl 
                    :show="showTimeline"
                    @close="showTimeline = false"
                    @timeChange="handleTimeChange"
                />
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
import TimelineControl from './components/TimelineControl.vue';
import ShipTrackingPanel from './components/ShipTrackingPanel.vue';
import ShipListTable from './components/ShipListTable.vue';
import WeatherListTable from './components/WeatherListTable.vue';

export default {
    components: {
        Header,
        LeftPanel,
        RightPanel,
        MapContainer,
        BottomTable,
        TimelineControl,
        ShipTrackingPanel,
        ShipListTable,
        WeatherListTable
    },
    setup() {
        // ==================== 状态管理 ====================
        
        // 当前选中的顶部选项卡（默认：矿区管理）
        const currentTab = ref('矿区管理');
        
        // 各个功能面板的显示状态
        const activePanels = ref({
            list: false,          // 矿区列表（底部表格）
            mapTools: false,      // 地图工具栏
            query: true,          // 矿区查询面板（左侧）
            layers: true,         // 图层控制面板（左侧）
            weatherLayers: false, // 气象图层面板（左侧）
            shipSearch: false,    // 船舶搜索面板（左侧）
            routePlan: false,     // 航线规划面板（左侧）
            historyTrack: false,  // 历史轨迹面板（左侧）
            shipList: false,      // 船舶列表（底部表格）
            routeWeather: false   // 航线气象（右侧按钮高亮）
        });
        
        // 时间轴显示状态（当切换到气象监测选项卡时自动显示）
        const showTimeline = ref(false);
        
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
        
        // 气象图层状态（从 LeftPanel 同步，用于控制地图上的气象图层）
        const weatherLayerState = ref([]);
        
        // 船舶定位请求（传递给地图组件）
        const shipToLocate = ref(null);
        
        // 路径规划请求（传递给地图组件）
        const routeToDraw = ref(null);
        
        // 历史轨迹请求（传递给地图组件）
        const trackToDraw = ref(null);
        
        // 航线气象分析请求（传递给地图组件）
        const routeWeatherRequest = ref(null);
        
        // 当前航线数据（用于右侧按钮触发气象分析）
        const currentRouteData = ref(null);
        
        // 船舶列表数据
        const shipListData = ref([]);
        
        // 气象列表数据
        const weatherListData = ref([]);
        const showWeatherList = ref(false);
        const weatherFilter = ref(null);
        
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

        /**
         * 切换气象图层面板的显示状态
         */
        const toggleWeatherLayers = () => {
            activePanels.value.weatherLayers = !activePanels.value.weatherLayers;
        };
        
        /**
         * 处理时间轴变化事件
         * @param {Date} time - 选中的时间
         */
        const handleTimeChange = (time) => {
            console.log('⏰ 时间轴变化:', time);
            // TODO: 通知地图更新气象数据
        };
        
        /**
         * 切换船舶搜索面板的显示状态
         */
        const toggleShipSearch = () => {
            activePanels.value.shipSearch = !activePanels.value.shipSearch;
        };
        
        /**
         * 切换航线规划面板的显示状态
         */
        const toggleRoutePlan = () => {
            activePanels.value.routePlan = !activePanels.value.routePlan;
        };
        
        /**
         * 切换历史轨迹面板的显示状态
         */
        const toggleHistoryTrack = () => {
            activePanels.value.historyTrack = !activePanels.value.historyTrack;
        };
        
        /**
         * 切换船舶列表的显示状态
         */
        const toggleShipList = () => {
            activePanels.value.shipList = !activePanels.value.shipList;
        };
        
        /**
         * 处理船舶定位事件
         * @param {Object} ship - 船舶信息
         */
        const handleShipLocate = (ship) => {
            console.log('📍 定位到船舶:', ship);
            // 通知地图飞到船舶位置
            shipToLocate.value = { ...ship, timestamp: Date.now() };
            
            // 添加到船舶列表（去重）
            const exists = shipListData.value.find(s => s.mmsi === ship.mmsi);
            if (!exists) {
                shipListData.value.push(ship);
            }
        };
        
        /**
         * 处理查看船舶详情事件
         * @param {Object} ship - 船舶信息
         */
        const handleShipDetails = (ship) => {
            console.log('📋 查看船舶详情:', ship);
            // TODO: 显示船舶详情弹窗
        };
        
        /**
         * 处理路径规划完成事件
         * @param {Object} routeData - 路径数据
         */
        const handleRoutePlanned = (routeData) => {
            console.log('🗺️ 路径规划完成:', routeData);
            // 保存当前航线数据
            currentRouteData.value = routeData;
            // 通知地图组件绘制路径
            routeToDraw.value = { ...routeData, timestamp: Date.now(), action: 'draw' };
        };
        
        /**
         * 处理清除路径事件
         */
        const handleRouteCleared = () => {
            console.log('🗑️ 清除路径');
            // 清除当前航线数据
            currentRouteData.value = null;
            // 清除航线气象高亮状态
            activePanels.value.routeWeather = false;
            // 清除气象列表
            showWeatherList.value = false;
            weatherListData.value = [];
            weatherFilter.value = null;
            // 通知地图组件清除路径
            routeToDraw.value = { action: 'clear', timestamp: Date.now() };
        };
        
        /**
         * 处理历史轨迹加载事件
         * @param {Object} trackData - 轨迹数据
         */
        const handleTrackLoaded = (trackData) => {
            console.log('📈 历史轨迹加载:', trackData);
            trackToDraw.value = { ...trackData, timestamp: Date.now(), action: 'draw' };
        };
        
        /**
         * 处理清除轨迹事件
         */
        const handleTrackCleared = () => {
            console.log('🗑️ 清除轨迹');
            trackToDraw.value = { action: 'clear', timestamp: Date.now() };
        };
        
        /**
         * 处理船舶列表行点击事件
         * @param {Object} ship - 船舶信息
         */
        const handleShipListRowClick = (ship) => {
            console.log('🚢 点击船舶列表:', ship);
            // 定位到该船舶
            shipToLocate.value = { ...ship, timestamp: Date.now() };
        };
        
        /**
         * 处理清空船舶列表事件
         */
        const handleClearShipList = () => {
            console.log('🗑️ 清空船舶列表');
            shipListData.value = [];
        };
        
        /**
         * 处理航线气象分析事件
         * @param {Object} routeData - 航线数据（可选，如果没有则使用当前航线）
         */
        const handleRouteWeatherAnalysis = (routeData) => {
            // 如果已经显示气象列表，则关闭它（切换功能）
            if (showWeatherList.value && activePanels.value.routeWeather) {
                console.log('🗑️ 关闭航线气象列表');
                showWeatherList.value = false;
                weatherListData.value = [];
                weatherFilter.value = null;
                activePanels.value.routeWeather = false;
                return;
            }
            
            // 如果没有传入路径数据，使用当前保存的航线数据
            const dataToAnalyze = routeData || currentRouteData.value;
            
            if (!dataToAnalyze) {
                console.warn('⚠️ 没有可用的航线数据，请先规划航线');
                return;
            }
            
            console.log('🌦️ 开始航线气象分析:', dataToAnalyze);
            // 设置航线气象为激活状态（橙色高亮）
            activePanels.value.routeWeather = true;
            // 通知地图组件进行气象分析
            routeWeatherRequest.value = { ...dataToAnalyze, timestamp: Date.now() };
        };
        
        /**
         * 处理气象数据加载完成
         */
        const handleWeatherDataLoaded = (data) => {
            console.log('📊 气象数据加载完成:', data);
            weatherListData.value = data.data || [];
            showWeatherList.value = true;
        };
        
        /**
         * 处理气象列表筛选
         */
        const handleWeatherFilter = (filters) => {
            console.log('🔍 气象筛选条件:', filters);
            weatherFilter.value = { ...filters, timestamp: Date.now() };
        };
        
        /**
         * 处理气象列表行点击
         */
        const handleWeatherRowClick = (item, index) => {
            console.log('📍 点击气象数据行:', index, item);
            // TODO: 可以飞到该点位置或高亮标记
        };
        
        /**
         * 处理气象数据刷新
         */
        const handleWeatherRefresh = () => {
            console.log('🔄 请求刷新气象数据');
            if (currentRouteData.value) {
                routeWeatherRequest.value = { 
                    ...currentRouteData.value, 
                    timestamp: Date.now(),
                    refresh: true 
                };
            }
        };
        
        /**
         * 清除气象列表
         */
        const handleClearWeatherList = () => {
            showWeatherList.value = false;
            weatherListData.value = [];
            weatherFilter.value = null;
            // 同时取消右侧按钮的高亮状态
            activePanels.value.routeWeather = false;
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
         * 处理气象图层变化事件
         * @param {Array} weatherLayers - 气象图层面板当前状态
         */
        const handleWeatherLayersChange = (weatherLayers) => {
            weatherLayerState.value = weatherLayers;
            console.log('🌦️ App.vue 气象图层状态变化:', weatherLayers);
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
            if (tab === '矿区管理') {
                // 矿区管理：自动打开矿区查询和图层控制，关闭气象图层
                showTimeline.value = false;
                activePanels.value = {
                    list: false,
                    mapTools: false,
                    query: true,          // 自动打开矿区查询
                    layers: true,         // 自动打开图层控制
                    weatherLayers: false  // 关闭气象图层
                };
            } else if (tab === '态势总览') {
                // 态势总览：保持当前状态
                showTimeline.value = false;
            } else if (tab === '气象监测') {
                // 气象监测：显示时间轴 + 自动打开气象图层面板，关闭矿区相关面板
                showTimeline.value = true;
                activePanels.value = {
                    list: false,
                    mapTools: false,
                    query: false,         // 关闭矿区查询
                    layers: false,        // 关闭图层控制
                    weatherLayers: true,  // 自动打开气象图层
                    shipSearch: false     // 关闭船舶搜索
                };
            } else if (tab === '船舶追踪') {
                // 船舶追踪：自动打开船舶搜索面板
                showTimeline.value = false;
                activePanels.value = {
                    list: false,
                    mapTools: false,
                    query: false,
                    layers: false,
                    weatherLayers: false,
                    shipSearch: true,     // 自动打开船舶搜索
                    routePlan: false,
                    historyTrack: false
                };
            } else {
                // 其他选项卡：关闭所有面板
                showTimeline.value = false;
                activePanels.value = {
                    list: false,
                    mapTools: false,
                    query: false,
                    layers: false,
                    weatherLayers: false,
                    shipSearch: false
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
            toggleWeatherLayers,
            toggleShipSearch,
            toggleRoutePlan,
            toggleHistoryTrack,
            toggleShipList,
            handleDataLoaded,
            handleFilterChange,
            handleLayersChange,
            handleWeatherLayersChange,
            handleTabChange,
            filters,
            availableCountries,
            allMiningData,
            filteredMiningData,
            layerState,
            weatherLayerState,
            shipToLocate,
            containerStyle,
            showTimeline,
            handleTimeChange,
            handleShipLocate,
            handleShipDetails,
            routeToDraw,
            trackToDraw,
            handleRoutePlanned,
            handleRouteCleared,
            handleTrackLoaded,
            handleTrackCleared,
            shipListData,
            handleShipListRowClick,
            handleClearShipList,
            routeWeatherRequest,
            handleRouteWeatherAnalysis,
            weatherListData,
            showWeatherList,
            weatherFilter,
            handleWeatherDataLoaded,
            handleWeatherFilter,
            handleWeatherRowClick,
            handleWeatherRefresh,
            handleClearWeatherList
        };
    }
};
</script>