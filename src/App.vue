<template>
    <div class="relative w-screen h-screen overflow-hidden bg-slate-950 text-white font-sans selection:bg-cyan-500 selection:text-white">
        
        <!-- Scaled Container -->
        <div id="screen-container" class="absolute top-0 left-0 overflow-hidden shadow-2xl transition-transform duration-75 ease-linear" :style="containerStyle">
            
            <!-- Map Layer (Z-0) -->
            <MapContainer 
                ref="mapContainerRef"
                :showToolbar="activePanels.mapTools" 
                :filters="filters"
                :layerState="layerState"
                :weatherLayerState="weatherLayerState"
                :shipToLocate="shipToLocate"
                :routeToDraw="routeToDraw"
                :trackToDraw="trackToDraw"
                :routeWeatherRequest="routeWeatherRequest"
                :weatherFilter="weatherFilter"
                :pickingPointType="pickingPointType"
                @dataLoaded="handleDataLoaded"
                @weatherDataLoaded="handleWeatherDataLoaded"
                @pointPicked="handlePointPicked"
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
                    @regionLocate="handleRegionLocate"
                />
                
                <!-- 船舶追踪面板（包含船舶搜索和航线规划） -->
                <ShipTrackingPanel 
                    ref="shipTrackingRef"
                    :showShipSearch="activePanels.shipSearch"
                    :showRoutePlan="activePanels.routePlan"
                    :showHistoryTrack="activePanels.historyTrack"
                    @locate="handleShipLocate"
                    @routePlanned="handleRoutePlanned"
                    @routeCleared="handleRouteCleared"
                    @trackLoaded="handleTrackLoaded"
                    @trackCleared="handleTrackCleared"
                    @routeWeatherAnalysis="handleRouteWeatherAnalysis"
                    @thresholdsChanged="handleThresholdsChanged"
                    @pickPoint="handlePickPoint"
                />
                
                <!-- 区域监控面板 -->
                <AreaMonitorPanel 
                    ref="areaMonitorRef"
                    :show="activePanels.areaMonitor"
                    @start-drawing="handleStartDrawing"
                    @cancel-drawing="handleCancelDrawing"
                    @area-created="handleAreaCreated"
                    @area-deleted="handleAreaDeleted"
                    @area-selected="handleAreaSelected"
                    @show-area="handleShowArea"
                    @hide-area="handleHideArea"
                    @fly-to-area="handleFlyToArea"
                    @show-detail="showAreaDetailDialog"
                />
                
                <RightPanel 
                    @toggleList="toggleList"
                    @toggleMapTools="toggleMapTools"
                    @toggleQuery="toggleQuery"
                    @toggleLayers="toggleLayers"
                    @toggleWeatherLayers="toggleWeatherLayers"
                    @toggleShipSearch="toggleShipSearch"
                    @toggleRoutePlan="toggleRoutePlan"
                    @toggleAreaMonitor="toggleAreaMonitor"
                    @toggleHistoryTrack="toggleHistoryTrack"
                    @toggleShipList="toggleShipList"
                    @toggleRouteWeather="handleRouteWeatherAnalysis"
                    @toggleMiningWeatherMonitor="toggleMiningWeatherMonitor"
                    @toggleRouteDemo="toggleRouteDemo"
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
                    :thresholds="currentThresholds"
                    @clear="handleClearWeatherList"
                    @filter="handleWeatherFilter"
                    @rowClick="handleWeatherRowClick"
                    @refresh="handleWeatherRefresh"
                />
                
                <!-- 时间轴控制（当有气象图层激活时显示） -->
                <TimelineControl 
                    :show="showTimeline"
                    :activeWeatherLayers="activeWeatherLayers"
                    @close="showTimeline = false"
                    @timeChange="handleTimeChange"
                />
                
                <!-- Windy 风格气象图层按钮（左侧垂直排列，由右侧按钮控制） -->
                <WeatherLayerButtons 
                    :show="activePanels.weatherLayers"
                    :weatherLayerGroups="weatherLayerState"
                    @layerToggle="handleWeatherLayerToggle"
                />
                
                <!-- 矿区气象监测面板 -->
                <MiningAreaWeatherMonitor 
                    ref="miningWeatherMonitorRef"
                    :show="activePanels.miningWeatherMonitor"
                    @locate-area="handleLocateMiningArea"
                />
                
                <!-- 航线演示面板 -->
                <RouteDemoPanel 
                    ref="routeDemoRef"
                    :show="activePanels.routeDemo"
                    @play="handleDemoPlay"
                    @pause="handleDemoPause"
                    @resume="handleDemoResume"
                    @stop="handleDemoStop"
                    @speedChange="handleDemoSpeedChange"
                />
                
                <!-- 高风险警告组件 -->
                <RouteRiskWarning ref="riskWarningRef" />
                
                <!-- 矿区气象信息卡片 -->
                <MiningAreaWeatherCard ref="weatherCardRef" />
            </div>

            <!-- Decorative Overlay Effects -->
            <div class="absolute inset-0 pointer-events-none z-50 mix-blend-overlay opacity-30 bg-[radial-gradient(circle_at_center,transparent_50%,#000_100%)]"></div>
            
            <!-- Corner Decors -->
            <div class="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-transparent pointer-events-none" style="clip-path: polygon(0 0, 100% 0, 0 100%)"></div>
            <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-cyan-500/10 to-transparent pointer-events-none" style="clip-path: polygon(0 0, 100% 0, 100% 100%)"></div>
            <div class="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none"></div>
        </div>
        
        <!-- 区域详情对话框 -->
        <AreaDetailDialog 
            v-if="showAreaDetail && selectedAreaForDetail"
            :area="selectedAreaForDetail"
            @close="closeAreaDetailDialog"
        />
    </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import * as Cesium from 'cesium';
import Header from './components/Header.vue';
import LeftPanel from './components/LeftPanel.vue';
import RightPanel from './components/RightPanel.vue';
import MapContainer from './components/MapContainer.vue';
import BottomTable from './components/BottomTable.vue';
import TimelineControl from './components/TimelineControl.vue';
import WeatherLayerButtons from './components/WeatherLayerButtons.vue';
import ShipTrackingPanel from './components/ShipTrackingPanel.vue';
import AreaMonitorPanel from './components/AreaMonitorPanel.vue';
import AreaDetailDialog from './components/AreaDetailDialog.vue';
import ShipListTable from './components/ShipListTable.vue';
import WeatherListTable from './components/WeatherListTable.vue';
import MiningAreaWeatherMonitor from './components/MiningAreaWeatherMonitor.vue';
import RouteDemoPanel from './components/RouteDemoPanel.vue';
import RouteRiskWarning from './components/RouteRiskWarning.vue';
import MiningAreaWeatherCard from './components/MiningAreaWeatherCard.vue';

export default {
    components: {
        Header,
        LeftPanel,
        RightPanel,
        MapContainer,
        BottomTable,
        TimelineControl,
        WeatherLayerButtons,
        ShipTrackingPanel,
        AreaMonitorPanel,
        AreaDetailDialog,
        ShipListTable,
        WeatherListTable,
        MiningAreaWeatherMonitor,
        RouteDemoPanel,
        RouteRiskWarning,
        MiningAreaWeatherCard
    },
    setup() {
        // ==================== 状态管理 ====================
        
        // WebSocket 连接
        let ws = null;
        
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
            areaMonitor: false,    // 区域监控面板（左侧）
            historyTrack: false,  // 历史轨迹面板（左侧）
            shipList: false,      // 船舶列表（底部表格）
            routeWeather: false,   // 航线气象（右侧按钮高亮）
            miningWeatherMonitor: false,  // 矿区气象监测（右侧面板）
            routeDemo: false      // 航线演示（左侧面板）
        });
        
        // 区域详情对话框状态
        const showAreaDetail = ref(false);
        const selectedAreaForDetail = ref(null);
        
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
        const currentThresholds = ref(null); // 当前使用的阈值
        
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
            if (activePanels.value.query) {
                activePanels.value.areaMonitor = false;
            }
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
         * @param {Object} data - 时间数据 { time: Date, index: Number, layerId: String }
         */
        const handleTimeChange = (data) => {
            console.log('⏰ App.vue 收到时间轴变化:', data);
            console.log('   - 时间索引:', data.index);
            console.log('   - 时间:', data.time);
            console.log('   - 图层ID:', data.layerId);
            console.log('   - mapContainerRef存在:', !!mapContainerRef.value);
            console.log('   - updateWeatherTime方法存在:', !!mapContainerRef.value?.updateWeatherTime);
            
            // 通知 MapContainer 更新气象数据
            if (mapContainerRef.value && mapContainerRef.value.updateWeatherTime) {
                console.log('✅ 调用 MapContainer.updateWeatherTime，时间索引:', data.index);
                try {
                    mapContainerRef.value.updateWeatherTime(data.index);
                    console.log('✅ updateWeatherTime 调用成功');
                } catch (error) {
                    console.error('❌ updateWeatherTime 调用失败:', error);
                }
            } else {
                console.error('❌ 无法调用 updateWeatherTime:', {
                    hasRef: !!mapContainerRef.value,
                    hasMethod: !!mapContainerRef.value?.updateWeatherTime,
                    refKeys: mapContainerRef.value ? Object.keys(mapContainerRef.value) : []
                });
            }
        };
        
        /**
         * 切换船舶搜索面板的显示状态
         */
        const toggleShipSearch = () => {
            activePanels.value.shipSearch = !activePanels.value.shipSearch;
            if (activePanels.value.shipSearch) {
                activePanels.value.areaMonitor = false;
            }
        };
        
        /**
         * 切换航线规划面板的显示状态
         */
        const toggleRoutePlan = () => {
            activePanels.value.routePlan = !activePanels.value.routePlan;
            if (activePanels.value.routePlan) {
                activePanels.value.areaMonitor = false;
            }
        };
        
        /**
         * 切换区域监控面板的显示状态
         */
        const toggleAreaMonitor = () => {
            activePanels.value.areaMonitor = !activePanels.value.areaMonitor;
            
            // 当打开区域监控面板时，关闭其他左侧面板
            if (activePanels.value.areaMonitor) {
                activePanels.value.query = false;
                activePanels.value.layers = false;
                activePanels.value.weatherLayers = false;
                activePanels.value.shipSearch = false;
                activePanels.value.routePlan = false;
                
                nextTick(() => {
                    // 面板会自动调用loadAreas，然后通过area-loaded事件显示区域
                });
            }
        };
        
        // 区域监控相关
        const areaMonitorRef = ref(null);
        const mapContainerRef = ref(null);
        const shipTrackingRef = ref(null);
        const miningWeatherMonitorRef = ref(null);  // 矿区气象监测面板引用
        const routeDemoRef = ref(null);  // 航线演示面板引用
        const riskWarningRef = ref(null);  // 高风险警告组件引用
        const weatherCardRef = ref(null);  // 矿区气象信息卡片引用
        let currentDrawingTool = null;
        const areaEntities = ref(new Map()); // 存储区域实体
        
        // 地图选点状态
        const pickingPointType = ref(null); // 'start', 'end', 或 null
        
        const handleStartDrawing = (data) => {
            console.log('🖊️ 启动地图绘制工具', data);
            
            // 获取地图viewer
            const viewer = mapContainerRef.value?.viewer?.();
            if (!viewer) {
                console.error('地图viewer未就绪');
                return;
            }
            
            // 动态导入绘制工具
            import('./utils/areaDrawingTool.js').then(({ AreaDrawingTool }) => {
                currentDrawingTool = new AreaDrawingTool(viewer);
                
                currentDrawingTool.start((polygon) => {
                    // 绘制完成后的回调
                    areaMonitorRef.value.createArea(polygon);
                    currentDrawingTool = null;
                });
            }).catch(err => {
                console.error('加载绘制工具失败:', err);
            });
        };
        
        const handleCancelDrawing = () => {
            if (currentDrawingTool) {
                currentDrawingTool.cancel();
                currentDrawingTool = null;
            }
        };
        
        const handleAreaCreated = (area) => {
            console.log('✅ 区域创建成功:', area);
            // 绘制完成后自动显示区域
            handleShowArea(area);
        };
        
        // 设置区域点击事件处理
        const setupAreaClickHandler = (viewer) => {
            if (viewer._areaClickHandlerSetup) {
                console.log('点击处理器已设置，跳过');
                return;
            }
            viewer._areaClickHandlerSetup = true;
            console.log('✅ 设置区域点击处理器');
            
            const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
            handler.setInputAction((click) => {
                console.log('🖱️ 地图被点击，原始坐标:', click.position);
                
                // 修正坐标（因为界面使用了CSS缩放）
                const baseWidth = 1920;
                const baseHeight = 1080;
                const scaleX = window.innerWidth / baseWidth;
                const scaleY = window.innerHeight / baseHeight;
                
                const correctedPosition = new Cesium.Cartesian2(
                    click.position.x / scaleX,
                    click.position.y / scaleY
                );
                
                console.log('修正后坐标:', correctedPosition);
                console.log('缩放比例:', { scaleX, scaleY });
                
                const pickedObject = viewer.scene.pick(correctedPosition);
                console.log('拾取的对象:', pickedObject);
                
                if (Cesium.defined(pickedObject) && pickedObject.id) {
                    const entity = pickedObject.id;
                    console.log('实体:', entity);
                    console.log('实体名称:', entity.name);
                    
                    const properties = entity.properties;
                    console.log('实体属性:', properties);
                    
                    if (properties && properties.type) {
                        const type = properties.type.getValue();
                        console.log('实体类型:', type);
                        
                        if (type === 'monitoring_area') {
                            console.log('✅ 点击了监控区域');
                            const areaData = properties.areaData?.getValue();
                            console.log('区域数据:', areaData);
                            
                            if (areaData) {
                                showAreaDetailDialog(areaData);
                            } else {
                                console.error('❌ 区域数据为空');
                            }
                        }
                    }
                } else {
                    console.log('未拾取到实体');
                }
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        };
        
        // 显示区域详情对话框
        const showAreaDetailDialog = (area) => {
            console.log('📋 显示区域详情对话框:', area);
            selectedAreaForDetail.value = area;
            showAreaDetail.value = true;
        };
        
        // 关闭区域详情对话框
        const closeAreaDetailDialog = () => {
            showAreaDetail.value = false;
            selectedAreaForDetail.value = null;
        };
        
        const handleAreaDeleted = (areaId) => {
            console.log('🗑️ 区域已删除:', areaId);
            
            // 从地图上移除区域
            const viewer = mapContainerRef.value?.viewer?.();
            if (viewer) {
                import('./utils/areaDrawingTool.js').then(({ AreaDrawingTool }) => {
                    AreaDrawingTool.removeArea(viewer, areaId);
                    areaEntities.value.delete(areaId);
                });
            }
        };
        
        const handleAreaSelected = (area) => {
            console.log('📍 选中区域:', area);
        };
        
        // 显示区域
        const handleShowArea = (area) => {
            console.log('👁️ 显示区域:', area);
            console.log('区域坐标:', area.polygon);
            
            const viewer = mapContainerRef.value?.viewer?.();
            if (!viewer) {
                console.error('❌ 地图viewer未就绪');
                return;
            }
            
            console.log('✅ viewer已就绪');
            
            // 检查是否已经创建实体
            if (areaEntities.value.has(area.id)) {
                console.log('区域实体已存在，设置为可见');
                // 已存在，只需要设置为可见
                const entities = viewer.entities.values.filter(
                    entity => entity.properties?.areaId?.getValue() === area.id
                );
                console.log('找到实体数量:', entities.length);
                entities.forEach(entity => {
                    entity.show = true;
                    console.log('实体已设置为可见:', entity.name);
                });
                // 强制刷新场景
                viewer.scene.requestRender();
                console.log('✅ 场景已刷新');
                return;
            }
            
            console.log('首次显示，创建实体...');
            // 首次显示，创建实体
            import('./utils/areaDrawingTool.js').then(({ AreaDrawingTool }) => {
                console.log('AreaDrawingTool已加载');
                
                const entity = AreaDrawingTool.showArea(viewer, area, {
                    color: Cesium.Color.PURPLE,
                    alpha: 0.3,
                    outlineColor: Cesium.Color.PURPLE,
                    outlineWidth: 3
                });
                
                console.log('实体已创建:', entity);
                console.log('viewer.entities总数:', viewer.entities.values.length);
                
                areaEntities.value.set(area.id, entity);
                
                // 设置点击事件处理（只需要设置一次）
                setupAreaClickHandler(viewer);
                
                // 强制刷新场景
                viewer.scene.requestRender();
                console.log('✅ 场景已刷新');
                
                console.log('✅ 区域已显示到地图');
            }).catch(err => {
                console.error('❌ 加载AreaDrawingTool失败:', err);
            });
        };
        
        // 隐藏区域
        const handleHideArea = (areaId) => {
            console.log('👁️‍🗨️ 隐藏区域:', areaId);
            
            const viewer = mapContainerRef.value?.viewer?.();
            if (!viewer) return;
            
            const entities = viewer.entities.values.filter(
                entity => entity.properties?.areaId?.getValue() === areaId
            );
            entities.forEach(entity => {
                entity.show = false;
            });
            
            // 强制刷新场景
            viewer.scene.requestRender();
            console.log('✅ 场景已刷新');
            
            console.log('✅ 区域已隐藏');
        };
        
        const handleFlyToArea = (area) => {
            const viewer = mapContainerRef.value?.viewer?.();
            if (viewer) {
                import('./utils/areaDrawingTool.js').then(({ AreaDrawingTool }) => {
                    AreaDrawingTool.flyToArea(viewer, area);
                });
            }
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
         * 切换矿区气象监测面板的显示状态
         */
        const toggleMiningWeatherMonitor = () => {
            activePanels.value.miningWeatherMonitor = !activePanels.value.miningWeatherMonitor;
        };
        
        /**
         * 切换航线演示面板的显示状态
         */
        const toggleRouteDemo = () => {
            activePanels.value.routeDemo = !activePanels.value.routeDemo;
            
            if (activePanels.value.routeDemo) {
                // 打开演示面板时，通知地图组件初始化演示
                if (mapContainerRef.value && mapContainerRef.value.initRouteDemo) {
                    mapContainerRef.value.initRouteDemo();
                }
            } else {
                // 关闭演示面板时，清除演示
                if (mapContainerRef.value && mapContainerRef.value.clearRouteDemo) {
                    mapContainerRef.value.clearRouteDemo();
                }
            }
        };
        
        /**
         * 处理演示播放
         */
        const handleDemoPlay = () => {
            console.log('▶️ 开始播放演示');
            if (mapContainerRef.value && mapContainerRef.value.playRouteDemo) {
                mapContainerRef.value.playRouteDemo();
            }
        };
        
        /**
         * 处理演示暂停
         */
        const handleDemoPause = () => {
            console.log('⏸️ 暂停演示');
            if (mapContainerRef.value && mapContainerRef.value.pauseRouteDemo) {
                mapContainerRef.value.pauseRouteDemo();
            }
        };
        
        /**
         * 处理演示继续
         */
        const handleDemoResume = () => {
            console.log('▶️ 继续演示');
            if (mapContainerRef.value && mapContainerRef.value.resumeRouteDemo) {
                mapContainerRef.value.resumeRouteDemo();
            }
        };
        
        /**
         * 处理演示停止
         */
        const handleDemoStop = () => {
            console.log('⏹️ 停止演示');
            if (mapContainerRef.value && mapContainerRef.value.stopRouteDemo) {
                mapContainerRef.value.stopRouteDemo();
            }
        };
        
        /**
         * 处理演示速度变化
         */
        const handleDemoSpeedChange = (speed) => {
            console.log('⚡ 演示速度:', speed);
            if (mapContainerRef.value && mapContainerRef.value.setRouteDemoSpeed) {
                mapContainerRef.value.setRouteDemoSpeed(speed);
            }
        };
        
        /**
         * 处理矿区定位
         */
        const handleLocateMiningArea = (area) => {
            console.log('📍 定位到矿区:', area.name);
            // 通知 MapContainer 飞到矿区位置
            if (mapContainerRef.value && mapContainerRef.value.flyToMiningArea) {
                mapContainerRef.value.flyToMiningArea(area);
            }
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
            console.log('🗺️ 路径规划完成 → 启动航线演示');
            
            // 关闭路径规划面板
            activePanels.value.routePlan = false;
            
            // 打开航线动态面板
            activePanels.value.routeDemo = true;
            
            // 通知 MapContainer 初始化航线演示
            if (mapContainerRef.value && mapContainerRef.value.initRouteDemo) {
                mapContainerRef.value.initRouteDemo();
            }
            
            console.log('✅ 航线动态面板已打开');
        };
        
        /**
         * 处理清除路径事件
         * @param {Object} options - 清除选项 { clearAll: boolean }
         */
        const handleRouteCleared = (options = {}) => {
            console.log('🗑️ 清除路径', options);
            
            if (options.clearAll) {
                // 清除所有：航线 + 气象线段 + 数据面板 + 取消选中状态
                console.log('🗑️ 清除所有内容（航线+气象）');
                currentRouteData.value = null;
                activePanels.value.routeWeather = false;
                showWeatherList.value = false;
                weatherListData.value = [];
                weatherFilter.value = null;
                // 通知地图组件清除航线和气象线段
                routeToDraw.value = { action: 'clear', timestamp: Date.now() };
                routeWeatherRequest.value = { action: 'clear', timestamp: Date.now() };
            } else {
                // 只清除航线（保留气象数据）
                console.log('🗑️ 只清除航线');
                currentRouteData.value = null;
                routeToDraw.value = { action: 'clear', timestamp: Date.now() };
            }
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
         * 处理地图选点事件
         * @param {Object} data - 选点数据 { type: 'start'|'end'|'cancel' }
         */
        const handlePickPoint = (data) => {
            console.log('📍 地图选点事件:', data);
            if (data.type === 'cancel') {
                pickingPointType.value = null;
            } else {
                pickingPointType.value = data.type;
            }
        };
        
        /**
         * 接收地图选点结果（由MapContainer调用）
         * @param {Number} lng - 经度
         * @param {Number} lat - 纬度
         */
        const handlePointPicked = (lng, lat) => {
            console.log('✅ 地图选点完成:', { lng, lat, type: pickingPointType.value });
            if (pickingPointType.value && shipTrackingRef.value) {
                shipTrackingRef.value.setPickedPoint(lng, lat, pickingPointType.value);
                pickingPointType.value = null;
            }
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
         * 处理航线气象分析事件（支持切换开关）
         * @param {Object} routeData - 航线数据（可选，如果没有则使用当前航线）
         */
        const handleRouteWeatherAnalysis = (routeData) => {
            // 如果已经显示气象列表，则关闭它（切换功能）
            if (showWeatherList.value && activePanels.value.routeWeather) {
                console.log('🗑️ 关闭航线气象（只清除气象线段，保留原始航线）');
                showWeatherList.value = false;
                weatherListData.value = [];
                weatherFilter.value = null;
                activePanels.value.routeWeather = false;
                // 通知地图组件清除气象线段（保留原始航线）
                routeWeatherRequest.value = { action: 'clear', timestamp: Date.now() };
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
            console.log('   - 数据点数量:', data.data?.length);
            console.log('   - 第一个点的风险:', data.data?.[0]?.risk);
            console.log('   - 当前阈值:', currentThresholds.value);
            
            // 强制创建新数组以触发响应式更新
            weatherListData.value = [...(data.data || [])];
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
         * 清除气象列表和气象线段
         */
        const handleClearWeatherList = () => {
            console.log('🗑️ 清除气象列表和气象线段');
            showWeatherList.value = false;
            weatherListData.value = [];
            weatherFilter.value = null;
            // 同时取消右侧按钮的高亮状态
            activePanels.value.routeWeather = false;
            // 通知地图组件清除气象数据
            routeWeatherRequest.value = { action: 'clear', timestamp: Date.now() };
        };

        // ==================== 数据处理函数 ====================
        
        /**
         * 处理 GeoJSON 数据加载完成事件
         * @param {Object} data - 包含国家列表和矿区数据的对象
         * @param {Array} data.countries - 所有担保国列表
         * @param {Array} data.miningData - 所有矿区数据
         * @param {Object} data.regionCounts - 各区域矿区数量统计
         */
        const handleDataLoaded = (data) => {
            availableCountries.value = data.countries;
            if (data.miningData) {
                allMiningData.value = data.miningData;
            }
            // 更新图层状态中的区域数量
            if (data.regionCounts && layerState.value) {
                layerState.value.forEach(region => {
                    if (data.regionCounts[region.id] !== undefined) {
                        region.count = data.regionCounts[region.id];
                    }
                });
            }
            console.log('📊 App.vue 接收到数据:', {
                countries: data.countries?.length,
                miningData: data.miningData?.length,
                regionCounts: data.regionCounts
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
         * 处理矿区地理分区定位事件
         * @param {Object} region - 区域信息
         */
        const handleRegionLocate = (region) => {
            console.log('📍 App.vue 收到区域定位请求:', region);
            // 通知 MapContainer 飞到该区域
            if (mapContainerRef.value && mapContainerRef.value.flyToRegion) {
                mapContainerRef.value.flyToRegion(region);
            }
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
         * 处理 Windy 风格按钮的图层切换
         * @param {Object} data - { groupId, layerId, active }
         */
        const handleWeatherLayerToggle = (data) => {
            console.log('🎯 切换气象图层:', data);
            
            // 找到对应的图层组和子图层
            const group = weatherLayerState.value.find(g => g.id === data.groupId);
            if (group && group.subLayers) {
                const layer = group.subLayers.find(l => l.id === data.layerId);
                if (layer) {
                    layer.active = data.active;
                    
                    // 触发更新
                    weatherLayerState.value = [...weatherLayerState.value];
                    console.log('✅ 图层已更新:', layer.label, layer.active);
                }
            }
        };
        
        // 提取激活的气象图层（扁平化）
        const activeWeatherLayers = computed(() => {
            const activeLayers = [];
            weatherLayerState.value.forEach(group => {
                if (group.subLayers) {
                    group.subLayers.forEach(sub => {
                        if (sub.active) {
                            activeLayers.push(sub);
                        }
                    });
                }
            });
            console.log('📊 激活的气象图层:', activeLayers);
            return activeLayers;
        });
        
        /**
         * 处理气象风险阈值变化
         * @param {Object} thresholds - 新的阈值设置
         */
        const handleThresholdsChanged = (thresholds) => {
            console.log('⚙️ App.vue 收到阈值变化:', thresholds);
            
            // 保存当前阈值
            currentThresholds.value = thresholds;
            
            // 直接传递给MapContainer处理
            if (mapContainerRef.value && mapContainerRef.value.handleThresholdsChanged) {
                mapContainerRef.value.handleThresholdsChanged(thresholds);
            } else {
                console.warn('⚠️ MapContainer ref 不可用');
            }
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
                // 船舶追踪：关闭船舶搜索面板（默认不打开）
                showTimeline.value = false;
                activePanels.value = {
                    list: false,
                    mapTools: false,
                    query: false,
                    layers: false,
                    weatherLayers: false,
                    shipSearch: false,    // 默认关闭船舶搜索
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
        onMounted(async () => {
            updateScale();
            window.addEventListener('resize', updateScale);
            
            // 连接 WebSocket
            connectWebSocket();
            
            // 监听来自 MapContainer 的打开航线演示事件
            window.addEventListener('openRouteDemo', () => {
                console.log('📡 收到打开航线演示事件');
                activePanels.value.routePlan = false;
                activePanels.value.routeDemo = true;
            });
            
            // 等待所有组件完全挂载后再设置全局引用
            await nextTick();
            
            // 暴露全局引用用于跨组件通信（在组件挂载后）
            if (typeof window !== 'undefined') {
                window.app = {
                    miningWeatherMonitorRef
                };
                window.appRouteDemoRef = routeDemoRef.value;
                window.appRiskWarningRef = riskWarningRef.value;  // 添加警告组件引用
                window.appWeatherCardRef = weatherCardRef.value;  // 添加气象卡片引用
                console.log('🌐 window.app 已设置:', window.app);
                console.log('🎬 window.appRouteDemoRef 已设置:', window.appRouteDemoRef);
                console.log('⚠️ window.appRiskWarningRef 已设置:', window.appRiskWarningRef);
                console.log('📊 window.appWeatherCardRef 已设置:', window.appWeatherCardRef);
                
                // 验证 weatherCardRef
                if (!window.appWeatherCardRef) {
                    console.error('❌ weatherCardRef 为 null！');
                } else {
                    console.log('✅ weatherCardRef 方法:', Object.keys(window.appWeatherCardRef));
                }
            }
        });
        
        // WebSocket 连接函数
        const connectWebSocket = () => {
            const WS_URL = 'ws://121.194.93.61:8081';
            
            console.log('🔌 连接 WebSocket:', WS_URL);
            
            try {
                ws = new WebSocket(WS_URL);
                
                ws.onopen = () => {
                    console.log('✅ WebSocket 连接成功');
                };
                
                ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        console.log('📨 收到 WebSocket 消息:', message);
                        handleWebSocketMessage(message);
                    } catch (err) {
                        console.error('❌ 解析 WebSocket 消息失败:', err);
                    }
                };
                
                ws.onerror = (error) => {
                    console.error('❌ WebSocket 错误:', error);
                };
                
                ws.onclose = () => {
                    console.log('🔌 WebSocket 连接关闭，5秒后重连...');
                    setTimeout(connectWebSocket, 5000);
                };
            } catch (err) {
                console.error('❌ WebSocket 连接失败:', err);
                setTimeout(connectWebSocket, 5000);
            }
        };
        
        // 处理 WebSocket 消息
        const handleWebSocketMessage = (message) => {
            const { type, payload } = message;
            
            switch (type) {
                case 'ship_enter':
                    console.log('🚢 船舶进入区域:', payload);
                    
                    // 显示通知
                    Promise.all([
                        import('element-plus'),
                        import('vue')
                    ]).then(([{ ElNotification }, { h }]) => {
                        const shipName = payload.ship.ship_cnname || payload.ship.ship_name || `MMSI: ${payload.ship.mmsi}`;
                        const areaName = payload.areaName || '监控区域';
                        const currentTime = new Date().toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                        });
                        
                        // 构建详细消息
                        const messageContent = h('div', { style: { lineHeight: '1.6' } }, [
                            h('div', { style: { marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' } }, 
                                `${shipName}`
                            ),
                            h('div', { style: { fontSize: '13px', color: '#606266' } }, 
                                `于 ${currentTime}`
                            ),
                            h('div', { style: { fontSize: '13px', color: '#606266', marginTop: '4px' } }, 
                                `进入监控区域「${areaName}」`
                            ),
                            payload.ship.lat && payload.ship.lng && h('div', { 
                                style: { 
                                    fontSize: '12px', 
                                    color: '#909399', 
                                    marginTop: '8px',
                                    fontFamily: 'monospace'
                                } 
                            }, `位置: ${payload.ship.lat.toFixed(4)}°, ${payload.ship.lng.toFixed(4)}°`)
                        ]);
                        
                        ElNotification({
                            title: '🚢 船舶进入区域',
                            message: messageContent,
                            type: 'info',
                            duration: 300000, // 5分钟 = 300000毫秒
                            position: 'top-right',
                            showClose: true // 显示关闭按钮
                        });
                    }).catch(err => {
                        console.error('显示通知失败:', err);
                    });
                    
                    // 触发区域监控面板刷新数据
                    if (areaMonitorRef.value && activePanels.value.areaMonitor) {
                        console.log('🔄 刷新区域监控面板数据');
                        nextTick(() => {
                            if (areaMonitorRef.value.loadAreas) {
                                areaMonitorRef.value.loadAreas();
                            }
                        });
                    }
                    break;
                    
                case 'ship_leave':
                    console.log('🚢 船舶离开区域:', payload);
                    
                    Promise.all([
                        import('element-plus'),
                        import('vue')
                    ]).then(([{ ElNotification }, { h }]) => {
                        const shipName = payload.shipName || `MMSI: ${payload.mmsi}`;
                        const areaName = payload.areaName || '监控区域';
                        const currentTime = new Date().toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                        });
                        
                        const messageContent = h('div', { style: { lineHeight: '1.6' } }, [
                            h('div', { style: { marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' } }, 
                                `${shipName}`
                            ),
                            h('div', { style: { fontSize: '13px', color: '#606266' } }, 
                                `于 ${currentTime}`
                            ),
                            h('div', { style: { fontSize: '13px', color: '#606266', marginTop: '4px' } }, 
                                `离开监控区域「${areaName}」`
                            )
                        ]);
                        
                        ElNotification({
                            title: '🚢 船舶离开区域',
                            message: messageContent,
                            type: 'success',
                            duration: 300000, // 5分钟
                            position: 'top-right',
                            showClose: true
                        });
                    }).catch(err => {
                        console.error('显示通知失败:', err);
                    });
                    
                    // 触发区域监控面板刷新数据
                    if (areaMonitorRef.value && activePanels.value.areaMonitor) {
                        nextTick(() => {
                            if (areaMonitorRef.value.loadAreas) {
                                areaMonitorRef.value.loadAreas();
                            }
                        });
                    }
                    break;
                    
                case 'warning':
                    console.log('⚠️ 收到预警:', payload);
                    
                    Promise.all([
                        import('element-plus'),
                        import('vue')
                    ]).then(([{ ElNotification }, { h }]) => {
                        const areaName = payload.areaName || '监控区域';
                        const currentTime = new Date().toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                        });
                        
                        const messageContent = h('div', { style: { lineHeight: '1.6' } }, [
                            h('div', { style: { marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#E6A23C' } }, 
                                `区域「${areaName}」`
                            ),
                            h('div', { style: { fontSize: '13px', color: '#606266', marginTop: '4px' } }, 
                                payload.message
                            ),
                            h('div', { style: { fontSize: '12px', color: '#909399', marginTop: '8px' } }, 
                                `时间: ${currentTime}`
                            )
                        ]);
                        
                        ElNotification({
                            title: '⚠️ 区域预警',
                            message: messageContent,
                            type: 'warning',
                            duration: 300000, // 5分钟
                            position: 'top-right',
                            showClose: true
                        });
                    }).catch(err => {
                        console.error('显示通知失败:', err);
                    });
                    break;
                    
                case 'area_created':
                    console.log('📍 区域已创建:', payload);
                    
                    // 刷新区域列表
                    if (areaMonitorRef.value && activePanels.value.areaMonitor) {
                        nextTick(() => {
                            if (areaMonitorRef.value.loadAreas) {
                                areaMonitorRef.value.loadAreas();
                            }
                        });
                    }
                    break;
                    
                case 'area_deleted':
                    console.log('🗑️ 区域已删除:', payload);
                    
                    // 刷新区域列表
                    if (areaMonitorRef.value && activePanels.value.areaMonitor) {
                        nextTick(() => {
                            if (areaMonitorRef.value.loadAreas) {
                                areaMonitorRef.value.loadAreas();
                            }
                        });
                    }
                    break;
                    
                default:
                    console.log('📨 未知消息类型:', type, payload);
            }
        };

        /**
         * 组件卸载时：
         * 移除窗口大小变化监听器
         * 关闭 WebSocket 连接
         */
        onUnmounted(() => {
            window.removeEventListener('resize', updateScale);
            
            // 关闭 WebSocket
            if (ws) {
                ws.close();
                console.log('🔌 WebSocket 已关闭');
            }
            
            // 清理调试对象
            if (typeof window !== 'undefined' && window.debugApp) {
                delete window.debugApp;
            }
        });

        // 挂载调试对象到 window（仅开发环境）
        if (typeof window !== 'undefined' && import.meta.env.DEV) {
            window.debugApp = {
                currentThresholds,
                weatherListData,
                mapContainerRef,
                handleThresholdsChanged,
                showWeatherList,
                miningWeatherMonitorRef  // 添加矿区气象监测引用
            };
            console.log('🐛 调试对象已挂载到 window.debugApp');
            console.log('   可以在控制台使用: window.debugApp.currentThresholds');
        }

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
            toggleAreaMonitor,
            toggleHistoryTrack,
            toggleShipList,
            toggleMiningWeatherMonitor,
            toggleRouteDemo,
            handleDemoPlay,
            handleDemoPause,
            handleDemoResume,
            handleDemoStop,
            handleDemoSpeedChange,
            handleDataLoaded,
            handleFilterChange,
            handleLayersChange,
            handleRegionLocate,
            handleWeatherLayersChange,
            handleWeatherLayerToggle,
            handleTabChange,
            filters,
            availableCountries,
            allMiningData,
            filteredMiningData,
            layerState,
            weatherLayerState,
            activeWeatherLayers,
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
            handlePickPoint,
            handlePointPicked,
            pickingPointType,
            shipTrackingRef,
            areaMonitorRef,
            mapContainerRef,
            miningWeatherMonitorRef,
            routeDemoRef,
            riskWarningRef,
            handleStartDrawing,
            handleCancelDrawing,
            handleAreaCreated,
            handleAreaDeleted,
            handleAreaSelected,
            handleShowArea,
            handleHideArea,
            handleFlyToArea,
            showAreaDetail,
            selectedAreaForDetail,
            closeAreaDetailDialog,
            showAreaDetailDialog,
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
            handleClearWeatherList,
            handleThresholdsChanged,
            currentThresholds,
            handleLocateMiningArea
        };
    }
};
</script>
