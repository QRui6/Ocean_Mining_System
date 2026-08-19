<template>
    <div class="relative w-screen h-screen overflow-hidden text-white font-sans selection:bg-cyan-400 selection:text-white" style="background: linear-gradient(135deg, #0a1628 0%, #1a2f4a 50%, #0d1b2a 100%);">
        
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
                :typhoonTrackRequest="typhoonTrackRequest"
                :routeWeatherRequest="routeWeatherRequest"
                :weatherFilter="weatherFilter"
                :pickingPointType="pickingPointType"
                @dataLoaded="handleDataLoaded"
                @weatherDataLoaded="handleWeatherDataLoaded"
                @pointPicked="handlePointPicked"
                @areaSelected="handleMapAreaSelected"
            />
            
            <!-- UI Layer (Z-10+) -->
            <div class="absolute inset-0 pointer-events-none">
                <Header
                    :currentTab="currentTab"
                    :showMenuShortcut="false"
                    @tabChange="handleTabChange"
                    @menuShortcut="isRightPanelCollapsed = false"
                />
                <LeftPanel
                    :availableCountries="availableCountries"
                    :regionOptions="miningOverviewRegionOptions"
                    :selectedRegionId="selectedMiningRegionId"
                    :regionLoading="loadingMiningOverviewRegions"
                    :miningAreas="filteredMiningData"
                    :selectedAreaId="selectedMiningAreaId"
                    :showQueryPanel="currentTab === '矿区总览' && activePanels.query"
                    :showLayersPanel="activePanels.layers"
                    :showWeatherLayersPanel="activePanels.weatherLayers"
                    @filterChange="handleFilterChange"
                    @layersChange="handleLayersChange"
                    @weatherLayersChange="handleWeatherLayersChange"
                    @regionLocate="handleRegionLocate"
                    @areaSelect="handleMiningAreaSelect"
                    @regionSelect="handleMiningRegionSelect"
                />

                <HistoricalTyphoonPanel
                    :show="currentTab === '历史数据' && activePanels.historyTyphoon"
                    :loading="loadingHistoricalTyphoon"
                    :loadingTrack="loadingHistoricalTyphoonTrack"
                    :quickAreas="historicalTyphoonQuickAreas"
                    :selectedArea="selectedHistoricalTyphoonArea"
                    :summary="historicalTyphoonSummary"
                    :yearlyStats="historicalTyphoonYearly"
                    :events="historicalTyphoonEvents"
                    :totalEvents="historicalTyphoonTotal"
                    :page="historicalTyphoonFilters.page"
                    :pageSize="historicalTyphoonFilters.pageSize"
                    :filters="historicalTyphoonFilters"
                    :errorMessage="historicalTyphoonError"
                    :selectedEvent="selectedHistoricalTyphoonEvent"
                    :selectedTrack="historicalTyphoonTrack"
                    @selectArea="handleHistoricalTyphoonAreaSelect"
                    @selectEvent="handleHistoricalTyphoonEventSelect"
                    @pageChange="handleHistoricalTyphoonPageChange"
                    @filtersChange="handleHistoricalTyphoonFiltersChange"
                />

                <HistoricalTyphoonWorkspace
                    :show="currentTab === '历史数据' && activePanels.historyTyphoon"
                    :loading="loadingHistoricalTyphoon"
                    :loadingTrack="loadingHistoricalTyphoonTrack"
                    :selectedArea="selectedHistoricalTyphoonArea"
                    :summary="historicalTyphoonSummary"
                    :yearlyStats="historicalTyphoonYearly"
                    :windowStats="historicalTyphoonWindow"
                    :selectedEvent="selectedHistoricalTyphoonEvent"
                    :selectedTrack="historicalTyphoonTrack"
                    :filters="historicalTyphoonFilters"
                    :errorMessage="historicalTyphoonError"
                    :loadingWindow="loadingHistoricalTyphoonWindow"
                    :windowErrorMessage="historicalTyphoonWindowError"
                    @close="closeHistoricalTyphoon"
                />

                <HistoricalSeaStatePanel
                    :show="currentTab === '历史数据' && activePanels.historySeaState"
                    :loading="loadingHistoricalSeaState"
                    :quickAreas="historicalSeaStateQuickAreas"
                    :selectedArea="selectedHistoricalSeaStateArea"
                    :selectedPoint="selectedHistoricalSeaStatePoint"
                    :records="historicalSeaStatePagedRecords"
                    :totalRecords="historicalSeaStateTotal"
                    :page="historicalSeaStateFilters.page"
                    :pageSize="historicalSeaStateFilters.pageSize"
                    :filters="historicalSeaStateFilters"
                    :errorMessage="historicalSeaStateError"
                    :selectedRecord="selectedHistoricalSeaStateRecord"
                    @selectArea="handleHistoricalSeaStateAreaSelect"
                    @selectRecord="handleHistoricalSeaStateRecordSelect"
                    @pageChange="handleHistoricalSeaStatePageChange"
                    @filtersChange="handleHistoricalSeaStateFiltersChange"
                />

                <HistoricalSeaStateWorkspace
                    :show="currentTab === '历史数据' && activePanels.historySeaState"
                    :loading="loadingHistoricalSeaState"
                    :selectedArea="selectedHistoricalSeaStateArea"
                    :selectedPoint="selectedHistoricalSeaStatePoint"
                    :records="historicalSeaStateFilteredRecords"
                    :selectedRecord="selectedHistoricalSeaStateRecord"
                    :filters="historicalSeaStateFilters"
                    :errorMessage="historicalSeaStateError"
                    @close="closeHistoricalSeaState"
                />
                
                <!-- 船舶追踪面板（包含船舶搜索和航线规划） -->
                <ShipTrackingPanel 
                    ref="shipTrackingRef"
                    :showShipSearch="activePanels.shipSearch"
                    :shipListData="shipListData"
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
                    @shipListRowClick="handleShipListRowClick"
                    @clearShipList="handleClearShipList"
                />

                <LiftingPipeSelectionPanel
                    :show="currentTab === '采矿系统' && activePanels.pipeSelection"
                    @close="closePipeSelection"
                    @locate-site="handleLocateMiningArea"
                />

                <PipelineWarningPanel
                    :show="currentTab === '预警中心' && activePanels.pipelineWarning"
                    @close="closePipelineWarning"
                />

                <ForecastRegionPanel
                    :show="currentTab === '预报中心' && activePanels.forecastRegion"
                    :regions="miningOverviewRegions"
                    :selectedRegion="selectedMiningRegion"
                    :dailyForecast="selectedMiningRegionDaily"
                    @close="closeForecastRegion"
                    @selectRegion="handleMiningRegionSelect"
                />

                <BuoyMonitoringWorkspace
                    :show="currentTab === '环境监测' && activePanels.buoyMonitoring"
                    :getViewer="getMapViewer"
                    @close="closeBuoyMonitoring"
                />

                <ForecastCenterWorkspace
                    :show="currentTab === '预报中心' && activePanels.forecastCenter"
                    @close="closeForecastCenter"
                />

                <WeatherWarningWorkspace
                    :show="currentTab === '预警中心' && activePanels.weatherWarnings"
                    @close="closeWeatherWarnings"
                />

                <MonitoringEventPanel
                    :show="currentTab === '预警中心' && activePanels.monitoringEvents"
                    @close="closeMonitoringEvents"
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
                    @toggleMapTools="toggleMapTools"
                    @toggleQuery="toggleQuery"
                    @toggleLayers="toggleLayers"
                    @toggleWeatherLayers="toggleWeatherLayers"
                    @toggleShipSearch="toggleShipSearch"
                    @togglePipeSelection="togglePipeSelection"
                    @toggleRoutePlan="toggleRoutePlan"
                    @toggleAreaMonitor="toggleAreaMonitor"
                    @toggleMiningWeatherMonitor="toggleMiningWeatherMonitor"
                    @toggleMiningScience="toggleMiningScience"
                    @toggleRouteDemo="toggleRouteDemo"
                    @toggleHistoricalTyphoon="toggleHistoricalTyphoon"
                    @toggleHistoricalSeaState="toggleHistoricalSeaState"
                    @togglePipelineWarning="togglePipelineWarning"
                    @toggleMonitoringEvents="toggleMonitoringEvents"
                    @toggleForecastRegion="toggleForecastRegion"
                    @toggleForecastCenter="toggleForecastCenter"
                    @toggleWeatherWarnings="toggleWeatherWarnings"
                    @toggleBuoyMonitoring="toggleBuoyMonitoring"
                    :activePanels="activePanels"
                    :currentTab="currentTab"
                    :weatherLayerGroups="weatherLayerState"
                    :collapsed="isRightPanelCollapsed"
                    @layerToggle="handleWeatherLayerToggle"
                    @collapseChange="isRightPanelCollapsed = $event"
                />

                <MiningAreaOverviewPanel
                    :show="showMiningAreaOverview && !showMiningRegionOverview"
                    :loading="loadingMiningAreaOverview"
                    :area="selectedMiningArea"
                    :panelPosition="miningAreaOverviewPosition"
                    @close="closeMiningAreaOverview"
                    @addMonitoring="handleAddMiningAreaToMonitoring"
                />

                <MiningRegionOverviewWorkspace
                    :show="currentTab === '预报中心' && showMiningRegionOverview"
                    :loading="loadingMiningRegionOverview"
                    :loadingHourly="loadingMiningRegionHourly"
                    :loadingSite="loadingMiningRegionSite"
                    :loadingSiteHourly="loadingMiningRegionSiteHourly"
                    :region="selectedMiningRegion"
                    :dailyForecast="selectedMiningRegionDaily"
                    :hourlyForecast="selectedMiningRegionHourly"
                    :selectedForecastDate="selectedMiningRegionDate"
                    :sites="selectedMiningRegionSites"
                    :selectedSite="selectedMiningRegionSite"
                    :siteDailyForecast="selectedMiningRegionSiteDaily"
                    :siteHourlyForecast="selectedMiningRegionSiteHourly"
                    @close="closeMiningRegionOverview"
                    @forecastDateChange="handleMiningRegionDateChange"
                />

                <MiningScienceWorkspace
                    ref="miningScienceRef"
                    :show="currentTab === '矿区总览' && activePanels.miningScience"
                    :metoceanPreset="miningSciencePreset"
                    @close="closeMiningScience"
                    @pickPoint="handlePickPoint"
                    @routeChange="handleMiningScienceRouteChange"
                />
                
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
                
                <!-- 航点气象弹窗 -->
                <WaypointWeatherPopup ref="waypointWeatherPopupRef" />
            </div>

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
import { WEATHER_LAYER_GROUPS } from './constants.js';
import { API_ENDPOINTS } from './api/config.js';
import { fetchMiningAreaOverview } from './api/miningAreaOverview.js';
import {
    fetchMiningOverviewRegions,
    fetchMiningOverviewRegionDaily,
    fetchMiningOverviewRegionHourly,
    fetchMiningOverviewSites,
    fetchMiningOverviewSiteDaily,
    fetchMiningOverviewSiteHourly
} from './api/miningRegionOverview.js';
import {
    fetchMiningRegionTyphoonEvents,
    fetchMiningRegionTyphoonAllEvents,
    fetchTyphoonTrack
} from './api/typhoonHistory.js';
import {
    createHistoricalSeaStatePointResult,
    fetchHistoricalSeaStateDataset,
    filterSeaStateRecords
} from './api/historicalSeaState.js';
import {
    calculateTyphoonWindowSummary,
    createEmptyTyphoonWindowSummary
} from './utils/typhoonWindowService.js';
import Header from './components/Header.vue';
import LeftPanel from './components/LeftPanel.vue';
import ForecastRegionPanel from './components/ForecastRegionPanel.vue';
import RightPanel from './components/RightPanel.vue';
import MapContainer from './components/MapContainer.vue';
import HistoricalTyphoonPanel from './components/HistoricalTyphoonPanel.vue';
import HistoricalTyphoonWorkspace from './components/HistoricalTyphoonWorkspace.vue';
import HistoricalSeaStatePanel from './components/HistoricalSeaStatePanel.vue';
import HistoricalSeaStateWorkspace from './components/HistoricalSeaStateWorkspace.vue';
import TimelineControl from './components/TimelineControl.vue';
import ShipTrackingPanel from './components/ShipTrackingPanel.vue';
import LiftingPipeSelectionPanel from './components/LiftingPipeSelectionPanel.vue';
import PipelineWarningPanel from './components/pipelineSafety/PipelineWarningPanel.vue';
import MonitoringEventPanel from './components/MonitoringEventPanel.vue';
import AreaMonitorPanel from './components/AreaMonitorPanel.vue';
import AreaDetailDialog from './components/AreaDetailDialog.vue';
import WeatherListTable from './components/WeatherListTable.vue';
import MiningAreaWeatherMonitor from './components/MiningAreaWeatherMonitor.vue';
import MiningAreaOverviewPanel from './components/MiningAreaOverviewPanel.vue';
import MiningRegionOverviewWorkspace from './components/MiningRegionOverviewWorkspace.vue';
import MiningScienceWorkspace from './components/MiningScienceWorkspace.vue';
import RouteDemoPanel from './components/RouteDemoPanel.vue';
import RouteRiskWarning from './components/RouteRiskWarning.vue';
import MiningAreaWeatherCard from './components/MiningAreaWeatherCard.vue';
import WaypointWeatherPopup from './components/WaypointWeatherPopup.vue';
import BuoyMonitoringWorkspace from './components/BuoyMonitoringWorkspace.vue';
import ForecastCenterWorkspace from './components/ForecastCenterWorkspace.vue';
import WeatherWarningWorkspace from './components/WeatherWarningWorkspace.vue';

export default {
    components: {
        Header,
        LeftPanel,
        ForecastRegionPanel,
        RightPanel,
        MapContainer,
        HistoricalTyphoonPanel,
        HistoricalTyphoonWorkspace,
        HistoricalSeaStatePanel,
        HistoricalSeaStateWorkspace,
        TimelineControl,
        ShipTrackingPanel,
        LiftingPipeSelectionPanel,
        PipelineWarningPanel,
        MonitoringEventPanel,
        AreaMonitorPanel,
        AreaDetailDialog,
        WeatherListTable,
        MiningAreaWeatherMonitor,
        MiningAreaOverviewPanel,
        MiningRegionOverviewWorkspace,
        MiningScienceWorkspace,
        RouteDemoPanel,
        RouteRiskWarning,
        MiningAreaWeatherCard,
        WaypointWeatherPopup,
        BuoyMonitoringWorkspace,
        ForecastCenterWorkspace,
        WeatherWarningWorkspace
    },
    setup() {
        // ==================== 状态管理 ====================
        
        // WebSocket 连接
        let ws = null;
        
        const createActivePanels = (overrides = {}) => ({
            list: false,
            mapTools: false,
            query: false,
            forecastRegion: false,
            layers: false,
            weatherLayers: false,
            pipeSelection: false,
            shipSearch: false,
            routePlan: false,
            areaMonitor: false,
            historyTrack: false,
            shipList: false,
            routeWeather: false,
            miningWeatherMonitor: false,
            miningScience: false,
            routeDemo: false,
            historyTyphoon: false,
            historySeaState: false,
            pipelineWarning: false,
            monitoringEvents: false,
            buoyMonitoring: false,
            forecastCenter: false,
            weatherWarnings: false,
            ...overrides
        });

        // 当前选中的顶部选项卡（默认：矿区总览）
        const currentTab = ref('矿区总览');
        
        const cloneWeatherLayerGroups = () => JSON.parse(JSON.stringify(WEATHER_LAYER_GROUPS));

        // 各个功能面板的显示状态
        const activePanels = ref(createActivePanels());
        
        // 区域详情对话框状态
        const showAreaDetail = ref(false);
        const selectedAreaForDetail = ref(null);
        const selectedMiningArea = ref(null);
        const selectedMiningAreaId = ref('');
        const showMiningAreaOverview = ref(false);
        const loadingMiningAreaOverview = ref(false);
        const miningAreaOverviewPosition = ref({
            left: 1268,
            top: 244
        });
        const miningOverviewRegions = ref([]);
        const loadingMiningOverviewRegions = ref(false);
        const selectedMiningRegion = ref(null);
        const selectedMiningRegionId = ref('');
        const selectedMiningRegionDaily = ref([]);
        const selectedMiningRegionHourly = ref([]);
        const selectedMiningRegionSites = ref([]);
        const selectedMiningRegionDate = ref('');
        const selectedMiningRegionSite = ref(null);
        const selectedMiningRegionSiteDaily = ref([]);
        const selectedMiningRegionSiteHourly = ref([]);
        const showMiningRegionOverview = ref(false);
        const loadingMiningRegionOverview = ref(false);
        const loadingMiningRegionHourly = ref(false);
        const loadingMiningRegionSite = ref(false);
        const loadingMiningRegionSiteHourly = ref(false);
        const isRightPanelCollapsed = ref(false);
        const selectedHistoricalTyphoonArea = ref(null);
        const historicalTyphoonSummary = ref(null);
        const historicalTyphoonEvents = ref([]);
        const historicalTyphoonYearly = ref([]);
        const historicalTyphoonWindow = ref(createEmptyTyphoonWindowSummary());
        const historicalTyphoonTrack = ref(null);
        const historicalTyphoonTotal = ref(0);
        const historicalTyphoonError = ref('');
        const historicalTyphoonWindowError = ref('');
        const selectedHistoricalTyphoonEvent = ref(null);
        const loadingHistoricalTyphoon = ref(false);
        const loadingHistoricalTyphoonTrack = ref(false);
        const loadingHistoricalTyphoonWindow = ref(false);
        const typhoonTrackRequest = ref(null);
        const historicalTyphoonFilters = ref({
            startYear: 2000,
            endYear: new Date().getFullYear(),
            bufferKm: 300,
            impactLevel: '',
            page: 1,
            pageSize: 6,
            sort: 'min_distance'
        });
        const selectedHistoricalSeaStateArea = ref(null);
        const selectedHistoricalSeaStatePoint = ref(null);
        const historicalSeaStateRecords = ref([]);
        const historicalSeaStateError = ref('');
        const selectedHistoricalSeaStateRecord = ref(null);
        const loadingHistoricalSeaState = ref(false);
        const historicalSeaStateFilters = ref({
            startYear: 2000,
            endYear: 2006,
            dataType: 'all',
            page: 1,
            pageSize: 8
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
        const weatherLayerState = ref(cloneWeatherLayerGroups());
        
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

        const invokeMapMethod = (methodName) => {
            if (mapContainerRef.value && typeof mapContainerRef.value[methodName] === 'function') {
                mapContainerRef.value[methodName]();
            }
        };

        const closeRouteDemoAuxiliaryUi = () => {
            invokeMapMethod('closeShipInfo');
            invokeMapMethod('closeWeatherInfo');

            if (riskWarningRef.value && typeof riskWarningRef.value.close === 'function') {
                riskWarningRef.value.close();
            }

            if (weatherCardRef.value && typeof weatherCardRef.value.close === 'function') {
                weatherCardRef.value.close();
            }

            if (waypointWeatherPopupRef.value && typeof waypointWeatherPopupRef.value.hideWeather === 'function') {
                waypointWeatherPopupRef.value.hideWeather();
            }
        };

        const clearRouteWeatherState = () => {
            showWeatherList.value = false;
            weatherListData.value = [];
            weatherFilter.value = null;
            activePanels.value.routeWeather = false;
            routeWeatherRequest.value = { action: 'clear', timestamp: Date.now() };
            invokeMapMethod('closeWeatherInfo');
        };

        const clearRouteDemoState = ({ hidePanel = true } = {}) => {
            if (mapContainerRef.value && typeof mapContainerRef.value.clearRouteDemo === 'function') {
                mapContainerRef.value.clearRouteDemo();
            }

            closeRouteDemoAuxiliaryUi();

            if (hidePanel) {
                activePanels.value.routeDemo = false;
            }
        };

        const resetEnvironmentMonitoringState = ({ hidePanel = false } = {}) => {
            weatherLayerState.value = cloneWeatherLayerGroups();
            showTimeline.value = false;
            invokeMapMethod('closeWeatherPicker');
            invokeMapMethod('closeWeatherInfo');

            if (hidePanel) {
                activePanels.value.weatherLayers = false;
            }
        };

        const closeMiningAreaSelection = () => {
            miningAreaOverviewRequestId += 1;
            invokeMapMethod('closeInfo');
            loadingMiningAreaOverview.value = false;
            showMiningAreaOverview.value = false;
            selectedMiningArea.value = null;
            selectedMiningAreaId.value = '';
        };

        const closeMiningRegionOverview = ({ restoreMenu = true, clearMapFocus = true } = {}) => {
            showMiningRegionOverview.value = false;
            selectedMiningRegion.value = null;
            selectedMiningRegionId.value = '';
            selectedMiningRegionDaily.value = [];
            selectedMiningRegionHourly.value = [];
            selectedMiningRegionSites.value = [];
            selectedMiningRegionDate.value = '';
            clearMiningRegionSiteSelection({ clearAreaId: true });

            if (restoreMenu) {
                isRightPanelCollapsed.value = false;
            }

            if (clearMapFocus) {
                invokeMapMethod('clearMiningRegionFocus');
            }
        };

        const normalizeMiningAreaSelection = (payload) => {
            if (!payload) {
                return {
                    area: null,
                    screenPosition: null
                };
            }

            if (payload.area) {
                return {
                    area: payload.area,
                    screenPosition: payload.screenPosition || null
                };
            }

            return {
                area: payload,
                screenPosition: payload.screenPosition || null
            };
        };

        const normalizeOverviewScreenPosition = (screenPosition) => {
            if (
                !screenPosition
                || !Number.isFinite(Number(screenPosition.x))
                || !Number.isFinite(Number(screenPosition.y))
            ) {
                return null;
            }

            const safeScaleX = scale.value.x || 1;
            const safeScaleY = scale.value.y || 1;

            return {
                x: Number(screenPosition.x) / safeScaleX,
                y: Number(screenPosition.y) / safeScaleY
            };
        };

        const updateMiningAreaOverviewPosition = (screenPosition) => {
            const normalizedPosition = normalizeOverviewScreenPosition(screenPosition);

            if (!normalizedPosition) {
                miningAreaOverviewPosition.value = {
                    left: 1268,
                    top: 244
                };
                return;
            }

            const panelWidth = 416;
            const panelHeight = 520;
            const horizontalOffset = 24;
            const verticalOffset = 48;
            const margin = 20;
            const minTop = 110;
            const leftGuard = activePanels.value.query ? 476 : margin;

            let left = normalizedPosition.x + horizontalOffset;
            if (left + panelWidth > baseWidth - margin) {
                left = normalizedPosition.x - panelWidth - horizontalOffset;
            }

            let top = normalizedPosition.y - verticalOffset;
            if (top + panelHeight > baseHeight - margin) {
                top = baseHeight - panelHeight - margin;
            }

            miningAreaOverviewPosition.value = {
                left: Math.min(Math.max(left, leftGuard), baseWidth - panelWidth - margin),
                top: Math.min(Math.max(top, minTop), baseHeight - panelHeight - margin)
            };
        };

        const buildPendingMiningAreaOverview = (area = {}) => ({
            ...area,
            id: area.id || area.areaKey || area.businessId || 'unknown',
            name: area.name || area.contractor || '未命名矿区',
            contractor: area.contractor || '未知',
            sponsor: area.sponsor || '未知',
            mineral: area.mineral || '未知',
            location: area.location || '未知',
            dateRange: area.dateRange || '未知',
            areaSize: area.areaSize || area.area || '未知',
            polygon: area.polygon || [],
            waterDepth: {
                average: null,
                min: null,
                max: null,
                unit: 'm'
            },
            historical: {
                timestamps: [],
                windSpeed: [],
                waveHeight: [],
                currentSpeed: [],
                unitMap: {
                    windSpeed: 'm/s',
                    waveHeight: 'm',
                    currentSpeed: 'm/s'
                }
            },
            currentForecast: null,
            dataStatus: 'loading'
        });

        const normalizeMiningMatchText = (value) => (
            String(value || '')
                .trim()
                .toLowerCase()
        );

        const extractBracketCode = (value) => {
            const match = String(value || '').match(/\(([A-Za-z0-9-]+)\)\s*$/);
            return match?.[1] || '';
        };

        const getMiningAreaBusinessId = (area) => {
            const candidates = [
                area?.businessId,
                area?.areaId,
                typeof area?.id === 'string' ? area.id : '',
                area?.siteCode,
                extractBracketCode(area?.name),
                extractBracketCode(area?.contractor)
            ];

            return candidates.find((value) => String(value || '').trim()) || '';
        };

        const getMiningAreaPolygonBounds = (area) => {
            if (!Array.isArray(area?.polygon) || !area.polygon.length) {
                return null;
            }

            return area.polygon.reduce((bounds, point) => {
                if (!Array.isArray(point) || point.length < 2) {
                    return bounds;
                }

                const lng = Number(point[0]);
                const lat = Number(point[1]);

                if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
                    return bounds;
                }

                return {
                    minLng: Math.min(bounds.minLng, lng),
                    maxLng: Math.max(bounds.maxLng, lng),
                    minLat: Math.min(bounds.minLat, lat),
                    maxLat: Math.max(bounds.maxLat, lat)
                };
            }, {
                minLng: Number.POSITIVE_INFINITY,
                maxLng: Number.NEGATIVE_INFINITY,
                minLat: Number.POSITIVE_INFINITY,
                maxLat: Number.NEGATIVE_INFINITY
            });
        };

        const findMiningRegionSiteForArea = (area, sites) => {
            if (!area || !Array.isArray(sites) || !sites.length) {
                return null;
            }

            const businessId = normalizeMiningMatchText(getMiningAreaBusinessId(area));
            const areaKeys = new Set([
                businessId,
                normalizeMiningMatchText(area?.name),
                normalizeMiningMatchText(area?.contractor),
                normalizeMiningMatchText(extractBracketCode(area?.name)),
                normalizeMiningMatchText(extractBracketCode(area?.contractor))
            ].filter(Boolean));

            if (businessId) {
                const exactCodeMatch = sites.find((site) => normalizeMiningMatchText(site.siteCode) === businessId);
                if (exactCodeMatch) {
                    return exactCodeMatch;
                }
            }

            const exactNameMatch = sites.find((site) => (
                areaKeys.has(normalizeMiningMatchText(site.siteCode))
                || areaKeys.has(normalizeMiningMatchText(site.siteName))
            ));
            if (exactNameMatch) {
                return exactNameMatch;
            }

            const fuzzyMatch = sites.find((site) => {
                const siteCode = normalizeMiningMatchText(site.siteCode);
                const siteName = normalizeMiningMatchText(site.siteName);

                return [...areaKeys].some((key) => (
                    (siteCode && (key.includes(siteCode) || siteCode.includes(key)))
                    || (siteName && (key.includes(siteName) || siteName.includes(key)))
                ));
            });
            if (fuzzyMatch) {
                return fuzzyMatch;
            }

            const polygonBounds = getMiningAreaPolygonBounds(area);
            if (!polygonBounds) {
                return null;
            }

            return sites.find((site) => {
                const lng = Number(site.lng);
                const lat = Number(site.lat);

                if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
                    return false;
                }

                return (
                    lng >= polygonBounds.minLng - 0.5
                    && lng <= polygonBounds.maxLng + 0.5
                    && lat >= polygonBounds.minLat - 0.5
                    && lat <= polygonBounds.maxLat + 0.5
                );
            }) || null;
        };

        const buildSelectedMiningRegionSite = (area, site) => ({
            areaKey: area?.areaKey || '',
            areaId: getMiningAreaBusinessId(area),
            displayName: area?.contractor || area?.name || site?.siteName || site?.siteCode || '未命名矿区',
            contractor: area?.contractor || '',
            sponsor: area?.sponsor || '',
            mineral: area?.mineral || '',
            location: area?.location || site?.regionName || '',
            siteId: site?.id ? String(site.id) : '',
            siteCode: site?.siteCode || getMiningAreaBusinessId(area),
            siteName: site?.siteName || area?.name || area?.contractor || '',
            regionId: site?.regionId ? String(site.regionId) : String(selectedMiningRegion.value?.id || ''),
            regionName: site?.regionName || selectedMiningRegion.value?.regionName || selectedMiningRegion.value?.regionCode || '',
            lng: Number.isFinite(Number(site?.lng)) ? Number(site.lng) : null,
            lat: Number.isFinite(Number(site?.lat)) ? Number(site.lat) : null,
            depthMeters: Number.isFinite(Number(site?.depthMeters)) ? Number(site.depthMeters) : null,
            elevationMeters: Number.isFinite(Number(site?.elevationMeters)) ? Number(site.elevationMeters) : null,
            matched: Boolean(site)
        });

        let miningRegionSiteSelectionRequestId = 0;
        let miningRegionSiteHourlyRequestId = 0;

        const clearMiningRegionSiteSelection = ({ clearAreaId = false } = {}) => {
            miningRegionSiteSelectionRequestId += 1;
            miningRegionSiteHourlyRequestId += 1;
            selectedMiningRegionSite.value = null;
            selectedMiningRegionSiteDaily.value = [];
            selectedMiningRegionSiteHourly.value = [];
            loadingMiningRegionSite.value = false;
            loadingMiningRegionSiteHourly.value = false;

            if (clearAreaId) {
                selectedMiningAreaId.value = '';
            }
        };

        const ensureMiningRegionSitesLoaded = async () => {
            if (selectedMiningRegionSites.value.length || !selectedMiningRegion.value?.id) {
                return selectedMiningRegionSites.value;
            }

            try {
                const sites = await fetchMiningOverviewSites(selectedMiningRegion.value.id);
                selectedMiningRegionSites.value = sites;
                return sites;
            } catch (error) {
                console.error('❌ 加载区域矿区站点失败:', error);
                return [];
            }
        };

        const loadMiningRegionSiteHourlyData = async (siteId, forecastDate) => {
            if (!siteId || !forecastDate) {
                selectedMiningRegionSiteHourly.value = [];
                loadingMiningRegionSiteHourly.value = false;
                return;
            }

            const requestId = ++miningRegionSiteHourlyRequestId;
            const targetSiteId = String(siteId);
            loadingMiningRegionSiteHourly.value = true;

            try {
                const hourlyForecast = await fetchMiningOverviewSiteHourly(targetSiteId, forecastDate);

                if (
                    requestId !== miningRegionSiteHourlyRequestId
                    || String(selectedMiningRegionSite.value?.siteId || '') !== targetSiteId
                ) {
                    return;
                }

                selectedMiningRegionSiteHourly.value = hourlyForecast;
            } catch (error) {
                console.error('❌ 加载单矿区逐小时风浪失败:', error);

                if (
                    requestId !== miningRegionSiteHourlyRequestId
                    || String(selectedMiningRegionSite.value?.siteId || '') !== targetSiteId
                ) {
                    return;
                }

                selectedMiningRegionSiteHourly.value = [];
            } finally {
                if (
                    requestId === miningRegionSiteHourlyRequestId
                    && String(selectedMiningRegionSite.value?.siteId || '') === targetSiteId
                ) {
                    loadingMiningRegionSiteHourly.value = false;
                }
            }
        };

        const loadMiningRegionSiteSelection = async (area) => {
            if (!area || !selectedMiningRegion.value) {
                clearMiningRegionSiteSelection();
                return;
            }

            const requestId = ++miningRegionSiteSelectionRequestId;
            const forecastDate = selectedMiningRegionDate.value;
            const sites = await ensureMiningRegionSitesLoaded();

            if (requestId !== miningRegionSiteSelectionRequestId) {
                return;
            }

            const matchedSite = findMiningRegionSiteForArea(area, sites);
            selectedMiningRegionSite.value = buildSelectedMiningRegionSite(area, matchedSite);
            selectedMiningRegionSiteDaily.value = [];
            selectedMiningRegionSiteHourly.value = [];

            if (!matchedSite?.id) {
                loadingMiningRegionSite.value = false;
                loadingMiningRegionSiteHourly.value = false;
                return;
            }

            const targetSiteId = String(matchedSite.id);
            loadingMiningRegionSite.value = true;
            loadingMiningRegionSiteHourly.value = Boolean(forecastDate);

            try {
                const [dailyForecast, hourlyForecast] = await Promise.all([
                    fetchMiningOverviewSiteDaily(targetSiteId),
                    forecastDate ? fetchMiningOverviewSiteHourly(targetSiteId, forecastDate) : Promise.resolve([])
                ]);

                if (
                    requestId !== miningRegionSiteSelectionRequestId
                    || String(selectedMiningRegionSite.value?.siteId || '') !== targetSiteId
                ) {
                    return;
                }

                selectedMiningRegionSiteDaily.value = dailyForecast;
                selectedMiningRegionSiteHourly.value = hourlyForecast;
            } catch (error) {
                console.error('❌ 加载单矿区风浪信息失败:', error);

                if (
                    requestId !== miningRegionSiteSelectionRequestId
                    || String(selectedMiningRegionSite.value?.siteId || '') !== targetSiteId
                ) {
                    return;
                }

                selectedMiningRegionSiteDaily.value = [];
                selectedMiningRegionSiteHourly.value = [];
            } finally {
                if (
                    requestId === miningRegionSiteSelectionRequestId
                    && String(selectedMiningRegionSite.value?.siteId || '') === targetSiteId
                ) {
                    loadingMiningRegionSite.value = false;
                    loadingMiningRegionSiteHourly.value = false;
                }
            }
        };

        const loadMiningOverviewRegions = async () => {
            loadingMiningOverviewRegions.value = true;

            try {
                miningOverviewRegions.value = await fetchMiningOverviewRegions();
            } catch (error) {
                console.error('❌ 加载大矿区列表失败:', error);
                miningOverviewRegions.value = [];
            } finally {
                loadingMiningOverviewRegions.value = false;
            }
        };

        const loadMiningRegionHourlyData = async (regionId, forecastDate) => {
            if (!regionId || !forecastDate) {
                selectedMiningRegionHourly.value = [];
                return;
            }

            loadingMiningRegionHourly.value = true;

            try {
                selectedMiningRegionHourly.value = await fetchMiningOverviewRegionHourly(regionId, forecastDate);
            } catch (error) {
                console.error('❌ 加载区域逐小时统计失败:', error);
                selectedMiningRegionHourly.value = [];
            } finally {
                loadingMiningRegionHourly.value = false;
            }
        };

        const getMiningRegionCode = (region) => (
            String(region?.regionCode || region?.regionName || '').trim()
        );

        const matchesMiningRegion = (area, region) => {
            const regionCode = getMiningRegionCode(region);
            if (!regionCode) return true;

            return String(area?.location || '').trim() === regionCode;
        };

        const toNumberOrNull = (value) => {
            if (value === null || value === undefined || value === '') {
                return null;
            }

            const numericValue = Number(value);
            return Number.isFinite(numericValue) ? numericValue : null;
        };

        const getForecastMetric = (record, primaryKey, fallbackKey) => (
            toNumberOrNull(record?.[primaryKey] ?? record?.[fallbackKey])
        );

        const findMiningRegionForArea = (area) => (
            miningOverviewRegions.value.find((region) => matchesMiningRegion(area, region)) || null
        );

        const resolveMiningAreaOverviewContext = async (area) => {
            if (!area) {
                return { region: null, site: null };
            }

            const region = findMiningRegionForArea(area);
            if (!region?.id) {
                return { region: null, site: null };
            }

            let sites = [];
            if (selectedMiningRegion.value?.id && String(selectedMiningRegion.value.id) === String(region.id)) {
                sites = selectedMiningRegionSites.value.length
                    ? selectedMiningRegionSites.value
                    : await ensureMiningRegionSitesLoaded();
            } else {
                sites = await fetchMiningOverviewSites(region.id);
            }

            return {
                region,
                site: findMiningRegionSiteForArea(area, sites)
            };
        };

        const miningSciencePreset = computed(() => {
            const areaForecast = selectedMiningArea.value?.currentForecast || null;
            const siteHourlyRecord = selectedMiningRegionSiteHourly.value[0] || null;
            const siteDailyRecord = selectedMiningRegionSiteDaily.value[0] || null;
            const regionHourlyRecord = selectedMiningRegionHourly.value[0] || null;
            const regionDailyRecord = selectedMiningRegionDaily.value[0] || null;

            const sourceArea = selectedMiningArea.value || null;
            const sourceSite = selectedMiningRegionSite.value?.matched ? selectedMiningRegionSite.value : null;
            const sourceRegion = selectedMiningRegion.value || null;

            const waterDepth = toNumberOrNull(
                sourceArea?.waterDepth?.point
                ?? sourceArea?.waterDepth?.average
                ?? sourceArea?.waterDepth?.center
                ?? sourceSite?.depthMeters
                ?? sourceRegion?.depthAvgMeters
                ?? sourceRegion?.centerDepthMeters
            );
            const windSpeedMs = getForecastMetric(areaForecast || siteHourlyRecord || siteDailyRecord || regionHourlyRecord || regionDailyRecord, 'windSpeed', 'windSpeedAvg');
            const waveHeight = getForecastMetric(areaForecast || siteHourlyRecord || siteDailyRecord || regionHourlyRecord || regionDailyRecord, 'waveHeight', 'waveHeightAvg');
            const currentSpeedMs = getForecastMetric(areaForecast || siteHourlyRecord || siteDailyRecord || regionHourlyRecord || regionDailyRecord, 'currentSpeed', 'currentSpeedAvg');

            const sourceKey = sourceArea?.id
                || sourceSite?.siteId
                || sourceRegion?.id
                || '';

            if (!sourceKey) {
                return null;
            }

            return {
                sourceKey: `${sourceKey}:${selectedMiningRegionDate.value || 'default'}`,
                waterDepth,
                windSpeedMs,
                waveHeight,
                currentSpeedMs
            };
        });

        const miningOverviewRegionOptions = computed(() => (
            miningOverviewRegions.value
                .map((region) => ({
                    ...region,
                    miningAreaCount: allMiningData.value.filter(area => matchesMiningRegion(area, region)).length
                }))
                .filter((region) => region.miningAreaCount > 0)
        ));

        // 根据筛选条件过滤后的矿区数据（用于底部表格显示）
        const filteredMiningData = computed(() => {
            if (!allMiningData.value.length) return [];
            
            const { minerals, oceans, countries } = filters.value;
            const hasRegionFilter = Boolean(selectedMiningRegion.value?.id);
            const hasFilter = minerals.length > 0 || oceans.length > 0 || countries.length > 0 || hasRegionFilter;
            
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

                // 区域查询筛选
                if (hasRegionFilter && !matchesMiningRegion(item, selectedMiningRegion.value)) {
                    matches = false;
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
         * 切换预报中心的区域预报面板。
         * 该面板只负责选择已有预报数据对应的区域，不复用矿区查询条件。
         */
        const toggleForecastRegion = () => {
            activePanels.value.forecastRegion = !activePanels.value.forecastRegion;
        };

        const closeForecastRegion = () => {
            activePanels.value.forecastRegion = false;
        };

        const toggleForecastCenter = () => {
            const nextOpen = !activePanels.value.forecastCenter;
            activePanels.value.forecastCenter = nextOpen;
            isRightPanelCollapsed.value = nextOpen;
        };

        const closeForecastCenter = () => {
            activePanels.value.forecastCenter = false;
            isRightPanelCollapsed.value = false;
        };

        const toggleBuoyMonitoring = () => {
            const nextOpen = !activePanels.value.buoyMonitoring;
            activePanels.value.buoyMonitoring = nextOpen;
            isRightPanelCollapsed.value = nextOpen;
        };

        const closeBuoyMonitoring = () => {
            activePanels.value.buoyMonitoring = false;
            isRightPanelCollapsed.value = false;
        };

        const toggleWeatherWarnings = () => {
            const nextOpen = !activePanels.value.weatherWarnings;
            activePanels.value.weatherWarnings = nextOpen;
            isRightPanelCollapsed.value = nextOpen;
        };

        const closeWeatherWarnings = () => {
            activePanels.value.weatherWarnings = false;
            isRightPanelCollapsed.value = false;
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
            const nextOpen = !activePanels.value.weatherLayers;
            activePanels.value.weatherLayers = nextOpen;
            showTimeline.value = nextOpen;

            if (!nextOpen) {
                resetEnvironmentMonitoringState();
            }
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
                activePanels.value.pipeSelection = false;
                activePanels.value.areaMonitor = false;
                clearRouteDemoState();
            }
        };

        const togglePipeSelection = () => {
            const nextOpen = !activePanels.value.pipeSelection;
            activePanels.value.pipeSelection = nextOpen;
            isRightPanelCollapsed.value = nextOpen;

            if (activePanels.value.pipeSelection) {
                activePanels.value.shipSearch = false;
                activePanels.value.routePlan = false;
                activePanels.value.areaMonitor = false;
                clearRouteWeatherState();
                clearRouteDemoState();
            }
        };

        const closePipeSelection = () => {
            activePanels.value.pipeSelection = false;
            isRightPanelCollapsed.value = false;
        };
        
        /**
         * 切换航线规划面板的显示状态
         */
        const toggleRoutePlan = () => {
            activePanels.value.routePlan = !activePanels.value.routePlan;
            if (activePanels.value.routePlan) {
                activePanels.value.pipeSelection = false;
                activePanels.value.areaMonitor = false;
                clearRouteDemoState();
            } else {
                clearRouteWeatherState();
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
                activePanels.value.pipeSelection = false;
                activePanels.value.shipSearch = false;
                activePanels.value.routePlan = false;
                clearRouteWeatherState();
                clearRouteDemoState();
                
                nextTick(() => {
                    // 面板会自动调用loadAreas，然后通过area-loaded事件显示区域
                });
            }
        };
        
        // 区域监控相关
        const areaMonitorRef = ref(null);
        const mapContainerRef = ref(null);
        const getMapViewer = () => mapContainerRef.value?.viewer?.() || null;
        const shipTrackingRef = ref(null);
        const miningScienceRef = ref(null);
        const miningWeatherMonitorRef = ref(null);  // 矿区气象监测面板引用
        const routeDemoRef = ref(null);  // 航线演示面板引用
        const riskWarningRef = ref(null);  // 高风险警告组件引用
        const weatherCardRef = ref(null);  // 矿区气象信息卡片引用
        const waypointWeatherPopupRef = ref(null);  // 航点气象弹窗引用
        let currentDrawingTool = null;
        const areaEntities = ref(new Map()); // 存储区域实体
        let miningAreaOverviewRequestId = 0;
        let historicalTyphoonOverviewRequestId = 0;
        let historicalTyphoonSupplementaryRequestId = 0;
        let historicalTyphoonTrackRequestId = 0;
        let historicalTyphoonAutoSelecting = false;
        let historicalSeaStateRequestId = 0;
        let historicalSeaStateAutoSelecting = false;
        const historicalTyphoonWindowCache = new Map();
        const historicalSeaStateDatasetCache = new Map();
        const historicalTyphoonRegionOrder = ['太平洋 (CCZ)', '太平洋', '大西洋', '西太平洋', '印度洋'];

        const historicalTyphoonQuickAreas = computed(() => {
            const regionMap = new Map(
                miningOverviewRegionOptions.value.map((region) => [getMiningRegionCode(region), region])
            );

            const orderedRegions = [];

            historicalTyphoonRegionOrder.forEach((regionCode) => {
                const region = regionMap.get(regionCode);
                if (region) {
                    orderedRegions.push(region);
                    regionMap.delete(regionCode);
                }
            });

            orderedRegions.push(...regionMap.values());

            return orderedRegions
                .map((region) => ({
                    ...region,
                    name: region.regionName || region.regionCode || `区域 ${region.id}`,
                    location: region.regionCode || region.regionName || '--'
                }))
                .slice(0, 5);
        });

        const historicalSeaStateQuickAreas = historicalTyphoonQuickAreas;

        const historicalSeaStateFilteredRecords = computed(() => (
            filterSeaStateRecords(historicalSeaStateRecords.value, historicalSeaStateFilters.value.dataType)
        ));

        const historicalSeaStateTotal = computed(() => historicalSeaStateFilteredRecords.value.length);

        const historicalSeaStatePagedRecords = computed(() => {
            const pageSize = Math.max(1, Number(historicalSeaStateFilters.value.pageSize) || 8);
            const page = Math.max(1, Number(historicalSeaStateFilters.value.page) || 1);
            const startIndex = (page - 1) * pageSize;

            return historicalSeaStateFilteredRecords.value.slice(startIndex, startIndex + pageSize);
        });

        const getHistoricalTyphoonRegionId = (region) => String(region?.id ?? '').trim();

        const findHistoricalTyphoonRegion = (target) => {
            const targetId = getHistoricalTyphoonRegionId(target);
            const targetCode = getMiningRegionCode(target);

            return historicalTyphoonQuickAreas.value.find((region) => (
                (targetId && getHistoricalTyphoonRegionId(region) === targetId)
                || (targetCode && getMiningRegionCode(region) === targetCode)
                || matchesMiningRegion(target, region)
            )) || null;
        };

        const clearHistoricalTyphoonTrack = ({ clearEvent = false } = {}) => {
            historicalTyphoonTrackRequestId += 1;
            loadingHistoricalTyphoonTrack.value = false;
            historicalTyphoonTrack.value = null;
            typhoonTrackRequest.value = {
                action: 'clear',
                timestamp: Date.now()
            };

            if (clearEvent) {
                selectedHistoricalTyphoonEvent.value = null;
            }
        };

        const syncHistoricalTyphoonMapFocus = (area) => {
            if (!area || !mapContainerRef.value) {
                return;
            }

            if (typeof mapContainerRef.value.focusMiningRegion === 'function') {
                mapContainerRef.value.focusMiningRegion(area);
                return;
            }

            if (typeof mapContainerRef.value.focusMiningArea === 'function') {
                const focused = mapContainerRef.value.focusMiningArea(area, null, false);
                if (focused) {
                    return;
                }
            }

            if (typeof mapContainerRef.value.flyToMiningArea === 'function') {
                mapContainerRef.value.flyToMiningArea(area);
            }
        };

        const loadHistoricalTyphoonTrack = async (event, area = selectedHistoricalTyphoonArea.value) => {
            if (!event?.sid || !area) {
                clearHistoricalTyphoonTrack();
                return;
            }

            const requestId = ++historicalTyphoonTrackRequestId;
            const regionId = getHistoricalTyphoonRegionId(area);

            loadingHistoricalTyphoonTrack.value = true;

            try {
                const track = await fetchTyphoonTrack(event.sid);

                if (
                    requestId !== historicalTyphoonTrackRequestId
                    || selectedHistoricalTyphoonEvent.value?.sid !== event.sid
                    || getHistoricalTyphoonRegionId(selectedHistoricalTyphoonArea.value) !== regionId
                ) {
                    return;
                }

                historicalTyphoonTrack.value = track;
                typhoonTrackRequest.value = {
                    action: 'draw',
                    track,
                    timestamp: Date.now()
                };
            } catch (error) {
                console.error('❌ 加载台风轨迹失败:', error);

                if (requestId !== historicalTyphoonTrackRequestId) {
                    return;
                }

                historicalTyphoonTrack.value = null;
                typhoonTrackRequest.value = {
                    action: 'clear',
                    timestamp: Date.now()
                };
            } finally {
                if (requestId === historicalTyphoonTrackRequestId) {
                    loadingHistoricalTyphoonTrack.value = false;
                }
            }
        };

        const isHistoricalTyphoonTimeoutError = (error) => (
            error?.name === 'TimeoutError'
            || /timeout|timed out|aborted|signal/i.test(String(error?.message || ''))
        );

        const getHistoricalTyphoonAreaTitle = (area) => (
            area?.regionName || area?.regionCode || area?.contractor || area?.name || '当前区域'
        );

        const getHistoricalTyphoonListError = (area, regionId, error) => {
            if (isHistoricalTyphoonTimeoutError(error)) {
                return `${getHistoricalTyphoonAreaTitle(area)} 历史台风查询超时。后端区域接口 ${regionId} 暂未返回，请稍后重试。`;
            }

            return `${getHistoricalTyphoonAreaTitle(area)} 暂未取得历史台风列表。后端区域接口 ${regionId} 当前返回失败。`;
        };

        const getHistoricalTyphoonWindowCacheKey = (regionId, filters = historicalTyphoonFilters.value) => (
            [
                regionId,
                filters.startYear,
                filters.endYear,
                filters.bufferKm
            ].join('|')
        );

        const loadHistoricalTyphoonSupplementaryData = async (regionId, { seedEvents = [] } = {}) => {
            const requestId = ++historicalTyphoonSupplementaryRequestId;
            historicalTyphoonWindowError.value = '';
            historicalTyphoonSummary.value = null;
            historicalTyphoonYearly.value = [];

            const { startYear, endYear, bufferKm } = historicalTyphoonFilters.value;
            const cacheKey = getHistoricalTyphoonWindowCacheKey(regionId);
            const cachedWindow = historicalTyphoonWindowCache.get(cacheKey);

            if (cachedWindow) {
                historicalTyphoonWindow.value = cachedWindow;
                loadingHistoricalTyphoonWindow.value = false;
                return;
            }

            if (seedEvents.length) {
                historicalTyphoonWindow.value = calculateTyphoonWindowSummary(seedEvents);
                loadingHistoricalTyphoonWindow.value = false;
            } else {
                historicalTyphoonWindow.value = createEmptyTyphoonWindowSummary();
                loadingHistoricalTyphoonWindow.value = true;
            }

            const allEventsResult = await Promise.allSettled([
                fetchMiningRegionTyphoonAllEvents(regionId, { startYear, endYear, bufferKm })
            ]);

            if (
                requestId !== historicalTyphoonSupplementaryRequestId
                || getHistoricalTyphoonRegionId(selectedHistoricalTyphoonArea.value) !== regionId
            ) {
                return;
            }

            if (allEventsResult[0].status === 'fulfilled') {
                const fullWindow = calculateTyphoonWindowSummary(allEventsResult[0].value);
                historicalTyphoonWindow.value = fullWindow;
                historicalTyphoonWindowCache.set(cacheKey, fullWindow);
            } else {
                console.warn('⚠️ 历史台风窗口完整统计补全失败，保留已加载数据统计:', allEventsResult[0].reason);
                if (!seedEvents.length && !historicalTyphoonWindow.value?.hasData) {
                    historicalTyphoonWindowError.value = isHistoricalTyphoonTimeoutError(allEventsResult[0].reason)
                        ? '历史台风窗口统计加载超时，请稍后重试。'
                        : '历史台风窗口统计暂不可用。';
                }
            }

            loadingHistoricalTyphoonWindow.value = false;
        };

        const loadHistoricalTyphoonOverview = async (
            region,
            { resetPage = false, preserveSelection = false, refreshSupplementary = true } = {}
        ) => {
            const resolvedRegion = findHistoricalTyphoonRegion(region) || region;
            const regionId = getHistoricalTyphoonRegionId(resolvedRegion);
            selectedHistoricalTyphoonArea.value = resolvedRegion;

            if (!regionId) {
                historicalTyphoonSupplementaryRequestId += 1;
                historicalTyphoonSummary.value = null;
                historicalTyphoonYearly.value = [];
                historicalTyphoonWindow.value = createEmptyTyphoonWindowSummary();
                historicalTyphoonEvents.value = [];
                historicalTyphoonTotal.value = 0;
                historicalTyphoonError.value = '该区域暂无可用于历史台风查询的区域编号。';
                historicalTyphoonWindowError.value = '';
                loadingHistoricalTyphoonWindow.value = false;
                clearHistoricalTyphoonTrack({ clearEvent: true });
                return;
            }

            if (resetPage) {
                historicalTyphoonFilters.value = {
                    ...historicalTyphoonFilters.value,
                    page: 1
                };
            }

            const requestId = ++historicalTyphoonOverviewRequestId;
            const {
                startYear,
                endYear,
                bufferKm,
                impactLevel,
                page,
                pageSize,
                sort
            } = historicalTyphoonFilters.value;

            loadingHistoricalTyphoon.value = true;
            historicalTyphoonError.value = '';
            historicalTyphoonEvents.value = [];
            historicalTyphoonTotal.value = 0;
            clearHistoricalTyphoonTrack({ clearEvent: !preserveSelection });

            if (refreshSupplementary) {
                historicalTyphoonSupplementaryRequestId += 1;
                loadingHistoricalTyphoonWindow.value = true;
                historicalTyphoonWindowError.value = '';
                historicalTyphoonSummary.value = null;
                historicalTyphoonYearly.value = [];
                historicalTyphoonWindow.value = createEmptyTyphoonWindowSummary();
            }

            try {
                const eventsResult = await fetchMiningRegionTyphoonEvents(regionId, {
                    startYear,
                    endYear,
                    bufferKm,
                    impactLevel,
                    page,
                    pageSize,
                    sort
                });

                if (
                    requestId !== historicalTyphoonOverviewRequestId
                    || getHistoricalTyphoonRegionId(selectedHistoricalTyphoonArea.value) !== regionId
                ) {
                    return;
                }

                historicalTyphoonEvents.value = eventsResult.items;
                historicalTyphoonTotal.value = eventsResult.total;
                historicalTyphoonError.value = '';

                if (refreshSupplementary) {
                    void loadHistoricalTyphoonSupplementaryData(regionId, {
                        seedEvents: eventsResult.items
                    });
                }

                const previousSid = preserveSelection ? selectedHistoricalTyphoonEvent.value?.sid : '';
                const nextSelectedEvent = eventsResult.items.find((item) => item.sid === previousSid)
                    || eventsResult.items[0]
                    || null;

                selectedHistoricalTyphoonEvent.value = nextSelectedEvent;

                if (nextSelectedEvent) {
                    await loadHistoricalTyphoonTrack(nextSelectedEvent, resolvedRegion);
                } else {
                    clearHistoricalTyphoonTrack();
                }
            } catch (error) {
                console.error('❌ 加载历史台风总览失败:', error);

                if (requestId !== historicalTyphoonOverviewRequestId) {
                    return;
                }

                historicalTyphoonEvents.value = [];
                historicalTyphoonTotal.value = 0;
                historicalTyphoonError.value = getHistoricalTyphoonListError(resolvedRegion, regionId, error);
                if (refreshSupplementary) {
                    loadingHistoricalTyphoonWindow.value = false;
                    historicalTyphoonWindowError.value = '历史台风窗口统计将在列表查询恢复后加载。';
                }
                clearHistoricalTyphoonTrack({ clearEvent: true });
            } finally {
                if (requestId === historicalTyphoonOverviewRequestId) {
                    loadingHistoricalTyphoon.value = false;
                }
            }
        };

        const initializeHistoricalTyphoonView = async () => {
            if (
                currentTab.value !== '历史数据'
                || !activePanels.value.historyTyphoon
                || selectedHistoricalTyphoonArea.value
                || !historicalTyphoonQuickAreas.value.length
                || historicalTyphoonAutoSelecting
            ) {
                return;
            }

            historicalTyphoonAutoSelecting = true;

            try {
                await handleHistoricalTyphoonAreaSelect(historicalTyphoonQuickAreas.value[0], {
                    focusMap: true,
                    resetPage: true
                });
            } finally {
                historicalTyphoonAutoSelecting = false;
            }
        };

        const getHistoricalSeaStateAreaKey = (area) => String(
            area?.areaKey
            || area?.id
            || area?.regionCode
            || area?.regionName
            || area?.name
            || ''
        ).trim();

        const findHistoricalSeaStateArea = (target) => {
            const targetId = String(target?.id ?? '').trim();
            const targetCode = getMiningRegionCode(target);

            return historicalSeaStateQuickAreas.value.find((region) => (
                (targetId && String(region?.id ?? '').trim() === targetId)
                || (targetCode && getMiningRegionCode(region) === targetCode)
                || matchesMiningRegion(target, region)
            )) || target || null;
        };

        const normalizeSeaStatePolygon = (polygon) => {
            if (!polygon) {
                return [];
            }

            let normalized = polygon;
            if (typeof normalized === 'string') {
                try {
                    normalized = JSON.parse(normalized);
                } catch (error) {
                    console.warn('⚠️ 历史海况多边形解析失败:', error);
                    return [];
                }
            }

            if (normalized?.type === 'Polygon' && Array.isArray(normalized.coordinates)) {
                normalized = normalized.coordinates[0];
            } else if (normalized?.type === 'MultiPolygon' && Array.isArray(normalized.coordinates)) {
                normalized = normalized.coordinates[0]?.[0] || [];
            } else if (normalized?.coordinates && Array.isArray(normalized.coordinates)) {
                normalized = normalized.coordinates[0] || [];
            }

            if (Array.isArray(normalized) && Array.isArray(normalized[0]) && Array.isArray(normalized[0][0])) {
                normalized = normalized[0];
            }

            return Array.isArray(normalized) ? normalized : [];
        };

        const getHistoricalSeaStatePoint = (area) => {
            if (!area) {
                return null;
            }

            const coordinateCandidates = [
                {
                    lon: toNumberOrNull(area.centerLng),
                    lat: toNumberOrNull(area.centerLat),
                    source: '区域中心'
                },
                {
                    lon: toNumberOrNull(area.lng ?? area.lon ?? area.longitude),
                    lat: toNumberOrNull(area.lat ?? area.latitude),
                    source: '点位坐标'
                }
            ];

            const directPoint = coordinateCandidates.find((point) => (
                point.lon !== null && point.lat !== null
            ));

            if (directPoint) {
                return directPoint;
            }

            const polygon = normalizeSeaStatePolygon(area.boundaryPolygon || area.polygon);
            const validPoints = polygon
                .map((point) => {
                    if (!Array.isArray(point) || point.length < 2) {
                        return null;
                    }

                    const lon = toNumberOrNull(point[0]);
                    const lat = toNumberOrNull(point[1]);
                    return lon === null || lat === null ? null : { lon, lat };
                })
                .filter(Boolean);

            if (!validPoints.length) {
                return null;
            }

            const sum = validPoints.reduce((accumulator, point) => ({
                lon: accumulator.lon + point.lon,
                lat: accumulator.lat + point.lat
            }), { lon: 0, lat: 0 });

            return {
                lon: sum.lon / validPoints.length,
                lat: sum.lat / validPoints.length,
                source: '几何中心'
            };
        };

        const syncHistoricalSeaStateMapFocus = (area) => {
            if (!area || !mapContainerRef.value) {
                return;
            }

            if (typeof mapContainerRef.value.focusMiningRegion === 'function' && area.centerLng !== undefined && area.centerLat !== undefined) {
                mapContainerRef.value.focusMiningRegion(area);
                return;
            }

            if (typeof mapContainerRef.value.focusMiningArea === 'function') {
                const focused = mapContainerRef.value.focusMiningArea(area, null, false);
                if (focused) {
                    return;
                }
            }

            if (typeof mapContainerRef.value.flyToMiningArea === 'function') {
                mapContainerRef.value.flyToMiningArea(area);
            }
        };

        const resetHistoricalSeaStateSelection = () => {
            historicalSeaStateRecords.value = [];
            selectedHistoricalSeaStateRecord.value = null;
        };

        const getHistoricalSeaStateAreaTitle = (area) => (
            area?.regionName || area?.regionCode || area?.contractor || area?.name || '当前区域'
        );

        const getHistoricalSeaStateError = (area, error) => {
            if (isHistoricalTyphoonTimeoutError(error)) {
                return `${getHistoricalSeaStateAreaTitle(area)} 历史海况查询超时，请稍后重试。`;
            }

            return `${getHistoricalSeaStateAreaTitle(area)} 暂未取得历史海况数据。`;
        };

        const selectHistoricalSeaStateRecordFrom = (records, previousKey = '') => {
            const filteredRecords = filterSeaStateRecords(records, historicalSeaStateFilters.value.dataType);
            selectedHistoricalSeaStateRecord.value = filteredRecords.find((record) => record.key === previousKey)
                || filteredRecords[0]
                || records[0]
                || null;
        };

        const getHistoricalSeaStateDatasetKeys = (dataType = historicalSeaStateFilters.value.dataType) => {
            if (['wind', 'wave', 'current'].includes(dataType)) {
                return [dataType];
            }

            return ['wind', 'wave', 'current'];
        };

        const getHistoricalSeaStateDatasetCacheKey = (point, startYear, endYear, datasetKey) => (
            [
                Number(point.lat).toFixed(6),
                Number(point.lon).toFixed(6),
                startYear,
                endYear,
                datasetKey
            ].join('|')
        );

        const applyHistoricalSeaStateResult = ({
            requestId,
            resolvedArea,
            point,
            datasets,
            errors,
            previousKey
        }) => {
            if (
                requestId !== historicalSeaStateRequestId
                || getHistoricalSeaStateAreaKey(selectedHistoricalSeaStateArea.value) !== getHistoricalSeaStateAreaKey(resolvedArea)
            ) {
                return false;
            }

            const { startYear, endYear } = historicalSeaStateFilters.value;
            const result = createHistoricalSeaStatePointResult({
                lat: point.lat,
                lon: point.lon,
                startYear,
                endYear
            }, datasets, errors);

            historicalSeaStateRecords.value = result.records || [];

            if (historicalSeaStateRecords.value.length) {
                historicalSeaStateError.value = '';
                loadingHistoricalSeaState.value = false;
                selectHistoricalSeaStateRecordFrom(historicalSeaStateRecords.value, previousKey);
                return true;
            }

            return false;
        };

        const loadHistoricalSeaStateOverview = async (
            area,
            { resetPage = false, preserveSelection = false } = {}
        ) => {
            const resolvedArea = findHistoricalSeaStateArea(area);
            const point = getHistoricalSeaStatePoint(resolvedArea);
            selectedHistoricalSeaStateArea.value = resolvedArea;
            selectedHistoricalSeaStatePoint.value = point;

            if (resetPage) {
                historicalSeaStateFilters.value = {
                    ...historicalSeaStateFilters.value,
                    page: 1
                };
            }

            if (!point) {
                historicalSeaStateRequestId += 1;
                loadingHistoricalSeaState.value = false;
                historicalSeaStateError.value = '该区域暂无可用于历史海况查询的经纬度。';
                resetHistoricalSeaStateSelection();
                return;
            }

            const requestId = ++historicalSeaStateRequestId;
            const previousKey = preserveSelection ? selectedHistoricalSeaStateRecord.value?.key : '';
            const { startYear, endYear, dataType } = historicalSeaStateFilters.value;
            const datasetKeys = getHistoricalSeaStateDatasetKeys(dataType);
            const datasets = {};
            const errors = {};
            let completedCount = 0;

            loadingHistoricalSeaState.value = true;
            historicalSeaStateError.value = '';
            resetHistoricalSeaStateSelection();

            datasetKeys.forEach((datasetKey) => {
                const cacheKey = getHistoricalSeaStateDatasetCacheKey(point, startYear, endYear, datasetKey);
                const cachedDataset = historicalSeaStateDatasetCache.get(cacheKey);
                const request = cachedDataset
                    ? Promise.resolve(cachedDataset)
                    : fetchHistoricalSeaStateDataset(datasetKey, {
                        lat: point.lat,
                        lon: point.lon,
                        startYear,
                        endYear
                    }).then((dataset) => {
                        historicalSeaStateDatasetCache.set(cacheKey, dataset);
                        return dataset;
                    });

                request
                    .then((dataset) => {
                        datasets[datasetKey] = dataset;
                        applyHistoricalSeaStateResult({
                            requestId,
                            resolvedArea,
                            point,
                            datasets,
                            errors,
                            previousKey
                        });
                    })
                    .catch((error) => {
                        console.warn(`⚠️ 历史海况${datasetKey}数据加载失败:`, error);
                        errors[datasetKey] = error?.message || String(error);
                    })
                    .finally(() => {
                        completedCount += 1;

                        if (
                            requestId !== historicalSeaStateRequestId
                            || getHistoricalSeaStateAreaKey(selectedHistoricalSeaStateArea.value) !== getHistoricalSeaStateAreaKey(resolvedArea)
                        ) {
                            return;
                        }

                        const hasAnyRecord = historicalSeaStateRecords.value.length > 0;
                        if (completedCount >= datasetKeys.length) {
                            loadingHistoricalSeaState.value = false;
                            if (!hasAnyRecord) {
                                historicalSeaStateError.value = Object.values(errors).some(Boolean)
                                    ? getHistoricalSeaStateError(resolvedArea, new Error(Object.values(errors).filter(Boolean).join('; ')))
                                    : '当前查询点暂无历史海况月均记录。';
                                resetHistoricalSeaStateSelection();
                            }
                        }
                    });
            });
        };

        const initializeHistoricalSeaStateView = async () => {
            if (
                currentTab.value !== '历史数据'
                || !activePanels.value.historySeaState
                || selectedHistoricalSeaStateArea.value
                || !historicalSeaStateQuickAreas.value.length
                || historicalSeaStateAutoSelecting
            ) {
                return;
            }

            historicalSeaStateAutoSelecting = true;

            try {
                await handleHistoricalSeaStateAreaSelect(historicalSeaStateQuickAreas.value[0], {
                    focusMap: true,
                    resetPage: true
                });
            } finally {
                historicalSeaStateAutoSelecting = false;
            }
        };
        
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

        const toggleMiningScience = () => {
            const nextOpen = !activePanels.value.miningScience;
            activePanels.value.miningScience = nextOpen;
            isRightPanelCollapsed.value = nextOpen;

            if (nextOpen) {
                activePanels.value.query = false;
                activePanels.value.layers = false;
                activePanels.value.miningWeatherMonitor = false;
                closeMiningAreaSelection();
                closeMiningRegionOverview({ restoreMenu: false, clearMapFocus: false });
            } else {
                pickingPointType.value = null;
                routeToDraw.value = {
                    action: 'clear',
                    timestamp: Date.now()
                };
            }
        };

        const closeMiningScience = () => {
            activePanels.value.miningScience = false;
            pickingPointType.value = null;
            isRightPanelCollapsed.value = false;
            routeToDraw.value = {
                action: 'clear',
                timestamp: Date.now()
            };
        };

        const handleMiningScienceRouteChange = (routeData) => {
            if (!routeData) {
                return;
            }

            routeToDraw.value = {
                ...routeData,
                timestamp: Date.now()
            };
        };
        
        /**
         * 切换航线演示面板的显示状态
         */
        const toggleRouteDemo = () => {
            activePanels.value.routeDemo = !activePanels.value.routeDemo;
            
            if (activePanels.value.routeDemo) {
                activePanels.value.pipeSelection = false;
                activePanels.value.shipSearch = false;
                activePanels.value.routePlan = false;
                activePanels.value.areaMonitor = false;
                clearRouteWeatherState();

                // 打开演示面板时，通知地图组件初始化演示
                if (mapContainerRef.value && mapContainerRef.value.initRouteDemo) {
                    mapContainerRef.value.initRouteDemo();
                }
            } else {
                clearRouteDemoState({ hidePanel: false });
            }
        };

        const closeHistoricalTyphoon = () => {
            activePanels.value.historyTyphoon = false;
            isRightPanelCollapsed.value = false;
            historicalTyphoonOverviewRequestId += 1;
            historicalTyphoonSupplementaryRequestId += 1;
            loadingHistoricalTyphoon.value = false;
            loadingHistoricalTyphoonWindow.value = false;
            clearHistoricalTyphoonTrack({ clearEvent: true });
        };

        const toggleHistoricalTyphoon = async () => {
            const nextOpen = !activePanels.value.historyTyphoon;
            activePanels.value.historyTyphoon = nextOpen;

            if (!nextOpen) {
                closeHistoricalTyphoon();
                return;
            }

            activePanels.value.historySeaState = false;
            historicalSeaStateRequestId += 1;
            loadingHistoricalSeaState.value = false;
            isRightPanelCollapsed.value = true;

            if (selectedHistoricalTyphoonArea.value) {
                await loadHistoricalTyphoonOverview(selectedHistoricalTyphoonArea.value, {
                    preserveSelection: true
                });
                return;
            }

            await initializeHistoricalTyphoonView();
        };

        const closeHistoricalSeaState = () => {
            activePanels.value.historySeaState = false;
            isRightPanelCollapsed.value = false;
            historicalSeaStateRequestId += 1;
            loadingHistoricalSeaState.value = false;
        };

        const toggleHistoricalSeaState = async () => {
            const nextOpen = !activePanels.value.historySeaState;
            activePanels.value.historySeaState = nextOpen;

            if (!nextOpen) {
                closeHistoricalSeaState();
                return;
            }

            activePanels.value.historyTyphoon = false;
            historicalTyphoonOverviewRequestId += 1;
            historicalTyphoonSupplementaryRequestId += 1;
            loadingHistoricalTyphoon.value = false;
            loadingHistoricalTyphoonWindow.value = false;
            clearHistoricalTyphoonTrack({ clearEvent: true });
            isRightPanelCollapsed.value = true;

            if (selectedHistoricalSeaStateArea.value) {
                await loadHistoricalSeaStateOverview(selectedHistoricalSeaStateArea.value, {
                    preserveSelection: true
                });
                return;
            }

            await initializeHistoricalSeaStateView();
        };

        const togglePipelineWarning = () => {
            const nextOpen = !activePanels.value.pipelineWarning;
            activePanels.value.pipelineWarning = nextOpen;
            isRightPanelCollapsed.value = nextOpen;
        };

        const closePipelineWarning = () => {
            activePanels.value.pipelineWarning = false;
            isRightPanelCollapsed.value = false;
        };

        const toggleMonitoringEvents = () => {
            const nextOpen = !activePanels.value.monitoringEvents;
            activePanels.value.monitoringEvents = nextOpen;
            isRightPanelCollapsed.value = nextOpen;
        };

        const closeMonitoringEvents = () => {
            activePanels.value.monitoringEvents = false;
            isRightPanelCollapsed.value = false;
        };

        const handleHistoricalTyphoonAreaSelect = async (area, options = {}) => {
            const resolvedRegion = findHistoricalTyphoonRegion(area);
            if (!resolvedRegion) {
                return;
            }

            const { focusMap = true, resetPage = true, preserveSelection = false } = options;

            if (focusMap) {
                syncHistoricalTyphoonMapFocus(resolvedRegion);
            }

            selectedMiningAreaId.value = '';
            await loadHistoricalTyphoonOverview(resolvedRegion, {
                resetPage,
                preserveSelection
            });
        };

        const handleHistoricalTyphoonEventSelect = async (event) => {
            if (!event) {
                clearHistoricalTyphoonTrack({ clearEvent: true });
                return;
            }

            selectedHistoricalTyphoonEvent.value = event;
            await loadHistoricalTyphoonTrack(event);
        };

        const handleHistoricalTyphoonPageChange = async (page) => {
            if (page === historicalTyphoonFilters.value.page) {
                return;
            }

            historicalTyphoonFilters.value = {
                ...historicalTyphoonFilters.value,
                page
            };

            if (selectedHistoricalTyphoonArea.value) {
                await loadHistoricalTyphoonOverview(selectedHistoricalTyphoonArea.value, {
                    preserveSelection: false,
                    refreshSupplementary: false
                });
            }
        };

        const handleHistoricalTyphoonFiltersChange = async (nextFilters) => {
            const shouldRefreshSupplementary = ['startYear', 'endYear', 'bufferKm'].some(
                (key) => nextFilters[key] !== undefined
                    && nextFilters[key] !== historicalTyphoonFilters.value[key]
            );

            historicalTyphoonFilters.value = {
                ...historicalTyphoonFilters.value,
                ...nextFilters
            };

            if (selectedHistoricalTyphoonArea.value) {
                await loadHistoricalTyphoonOverview(selectedHistoricalTyphoonArea.value, {
                    preserveSelection: false,
                    refreshSupplementary: shouldRefreshSupplementary
                });
            }
        };

        const handleHistoricalSeaStateAreaSelect = async (area, options = {}) => {
            const resolvedArea = findHistoricalSeaStateArea(area);
            if (!resolvedArea) {
                return;
            }

            const { focusMap = true, resetPage = true, preserveSelection = false } = options;

            if (focusMap) {
                syncHistoricalSeaStateMapFocus(resolvedArea);
            }

            selectedMiningAreaId.value = '';
            await loadHistoricalSeaStateOverview(resolvedArea, {
                resetPage,
                preserveSelection
            });
        };

        const handleHistoricalSeaStateRecordSelect = (record) => {
            selectedHistoricalSeaStateRecord.value = record || null;
        };

        const handleHistoricalSeaStatePageChange = (page) => {
            if (page === historicalSeaStateFilters.value.page) {
                return;
            }

            historicalSeaStateFilters.value = {
                ...historicalSeaStateFilters.value,
                page
            };
        };

        const handleHistoricalSeaStateFiltersChange = async (nextFilters) => {
            const shouldReload = ['startYear', 'endYear', 'dataType'].some(
                (key) => nextFilters[key] !== undefined
                    && nextFilters[key] !== historicalSeaStateFilters.value[key]
            );

            const mergedFilters = {
                ...historicalSeaStateFilters.value,
                ...nextFilters
            };

            historicalSeaStateFilters.value = mergedFilters;

            if (shouldReload && selectedHistoricalSeaStateArea.value) {
                await loadHistoricalSeaStateOverview(selectedHistoricalSeaStateArea.value, {
                    preserveSelection: false
                });
                return;
            }

            const filteredRecords = filterSeaStateRecords(historicalSeaStateRecords.value, mergedFilters.dataType);
            const maxPage = Math.max(1, Math.ceil(filteredRecords.length / (Number(mergedFilters.pageSize) || 1)));
            if (mergedFilters.page > maxPage) {
                historicalSeaStateFilters.value = {
                    ...historicalSeaStateFilters.value,
                    page: maxPage
                };
            }

            if (
                selectedHistoricalSeaStateRecord.value
                && filteredRecords.some((record) => record.key === selectedHistoricalSeaStateRecord.value?.key)
            ) {
                return;
            }

            selectedHistoricalSeaStateRecord.value = filteredRecords[0] || null;
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
            closeRouteDemoAuxiliaryUi();
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
            console.log('📍 定位到矿区:', area.name || area.displayName || area.siteName || area.siteCode);
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

            currentRouteData.value = routeData;
            clearRouteWeatherState();
            
            // 关闭路径规划面板
            activePanels.value.routePlan = false;
            activePanels.value.shipSearch = false;
            activePanels.value.areaMonitor = false;
            
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
                clearRouteWeatherState();
                clearRouteDemoState();
                // 通知地图组件清除航线和气象线段
                routeToDraw.value = { action: 'clear', timestamp: Date.now() };
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
            if (
                pickingPointType.value
                && String(pickingPointType.value).startsWith('miningScience')
                && miningScienceRef.value
            ) {
                miningScienceRef.value.setPickedPoint(lng, lat, pickingPointType.value);
                pickingPointType.value = null;
                return;
            }

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
                clearRouteWeatherState();
                return;
            }
            
            // 如果没有传入路径数据，使用当前保存的航线数据
            const dataToAnalyze = routeData || currentRouteData.value;
            
            if (!dataToAnalyze) {
                console.warn('⚠️ 没有可用的航线数据，请先规划航线');
                return;
            }
            
            console.log('🌦️ 开始航线气象分析:', dataToAnalyze);
            currentRouteData.value = dataToAnalyze;
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
            clearRouteWeatherState();
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

            if (currentTab.value === '历史数据' && activePanels.value.historyTyphoon) {
                initializeHistoricalTyphoonView();
            }

            if (currentTab.value === '历史数据' && activePanels.value.historySeaState) {
                initializeHistoricalSeaStateView();
            }
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

        const handleMiningRegionDateChange = async (forecastDate) => {
            if (!selectedMiningRegion.value || !forecastDate || forecastDate === selectedMiningRegionDate.value) {
                return;
            }

            selectedMiningRegionDate.value = forecastDate;
            await Promise.all([
                loadMiningRegionHourlyData(selectedMiningRegion.value.id, forecastDate),
                selectedMiningRegionSite.value?.siteId
                    ? loadMiningRegionSiteHourlyData(selectedMiningRegionSite.value.siteId, forecastDate)
                    : Promise.resolve()
            ]);
        };

        const handleMiningRegionSelect = async (region) => {
            if (!region?.id) {
                return;
            }

            if (currentTab.value !== '预报中心') {
                currentTab.value = '预报中心';
                activePanels.value = createActivePanels({ forecastRegion: true });
            }

            closeMiningAreaSelection();

            selectedMiningRegionId.value = String(region.id);
            selectedMiningRegion.value = region;
            selectedMiningRegionDaily.value = [];
            selectedMiningRegionHourly.value = [];
            selectedMiningRegionSites.value = [];
            selectedMiningRegionDate.value = '';
            clearMiningRegionSiteSelection({ clearAreaId: true });
            showMiningRegionOverview.value = true;
            loadingMiningRegionOverview.value = true;
            loadingMiningRegionHourly.value = true;
            isRightPanelCollapsed.value = true;

            if (mapContainerRef.value && typeof mapContainerRef.value.focusMiningRegion === 'function') {
                mapContainerRef.value.focusMiningRegion(region);
            }

            try {
                const [dailyForecast, sites] = await Promise.all([
                    fetchMiningOverviewRegionDaily(region.id),
                    fetchMiningOverviewSites(region.id)
                ]);

                selectedMiningRegionDaily.value = dailyForecast;
                selectedMiningRegionSites.value = sites;

                const defaultForecastDate = dailyForecast[0]?.forecastDate || '';
                selectedMiningRegionDate.value = defaultForecastDate;

                if (defaultForecastDate) {
                    await loadMiningRegionHourlyData(region.id, defaultForecastDate);
                } else {
                    selectedMiningRegionHourly.value = [];
                    loadingMiningRegionHourly.value = false;
                }
            } catch (error) {
                console.error('❌ 加载区域总览失败:', error);
                selectedMiningRegionDaily.value = [];
                selectedMiningRegionHourly.value = [];
                selectedMiningRegionSites.value = [];
                clearMiningRegionSiteSelection({ clearAreaId: true });
                loadingMiningRegionHourly.value = false;
            } finally {
                loadingMiningRegionOverview.value = false;
            }
        };

        const loadMiningAreaOverview = async (area, screenPosition = null) => {
            const requestId = ++miningAreaOverviewRequestId;
            updateMiningAreaOverviewPosition(screenPosition);
            selectedMiningArea.value = buildPendingMiningAreaOverview(area);
            selectedMiningAreaId.value = String(area.areaKey || area.businessId || area.id || '');
            showMiningAreaOverview.value = true;
            loadingMiningAreaOverview.value = true;

            try {
                const context = await resolveMiningAreaOverviewContext(area);
                if (requestId !== miningAreaOverviewRequestId) {
                    return;
                }

                const overview = await fetchMiningAreaOverview(area, context);
                if (requestId !== miningAreaOverviewRequestId) {
                    return;
                }

                selectedMiningArea.value = {
                    ...selectedMiningArea.value,
                    ...area,
                    ...overview,
                    polygon: area.polygon || overview.polygon || []
                };
                selectedMiningAreaId.value = String(selectedMiningArea.value.areaKey || selectedMiningArea.value.id || area.id || '');
            } catch (error) {
                if (requestId === miningAreaOverviewRequestId) {
                    console.error('❌ 加载矿区总览失败:', error);
                }
            } finally {
                if (requestId === miningAreaOverviewRequestId) {
                    loadingMiningAreaOverview.value = false;
                }
            }
        };

        const handleMiningAreaSelect = async (payload) => {
            const { area, screenPosition } = normalizeMiningAreaSelection(payload);
            if (!area) return;

            selectedMiningAreaId.value = String(area.areaKey || area.businessId || area.id || '');

            if (showMiningRegionOverview.value) {
                if (mapContainerRef.value && mapContainerRef.value.focusMiningArea) {
                    const focused = mapContainerRef.value.focusMiningArea(area, screenPosition);
                    if (focused) {
                        return;
                    }
                }

                await loadMiningRegionSiteSelection(area);
                return;
            }

            if (mapContainerRef.value && mapContainerRef.value.focusMiningArea) {
                const focused = mapContainerRef.value.focusMiningArea(area, screenPosition);
                if (focused) {
                    return;
                }
            }

            await loadMiningAreaOverview(area, screenPosition);
        };

        const handleMapAreaSelected = async (payload) => {
            const { area, screenPosition } = normalizeMiningAreaSelection(payload);
            if (!area) {
                if (showMiningRegionOverview.value) {
                    clearMiningRegionSiteSelection({ clearAreaId: true });
                    return;
                }

                closeMiningAreaOverview();
                return;
            }

            if (currentTab.value === '历史数据') {
                if (activePanels.value.historyTyphoon) {
                    await handleHistoricalTyphoonAreaSelect(area, {
                        focusMap: false,
                        resetPage: true
                    });
                }
                if (activePanels.value.historySeaState) {
                    await handleHistoricalSeaStateAreaSelect(area, {
                        focusMap: false,
                        resetPage: true
                    });
                }
                return;
            }

            if (!['矿区总览', '预报中心'].includes(currentTab.value)) {
                return;
            }

            if (showMiningRegionOverview.value) {
                selectedMiningAreaId.value = String(area.areaKey || area.businessId || area.id || '');
                await loadMiningRegionSiteSelection(area);
                return;
            }

            await loadMiningAreaOverview(area, screenPosition);
        };

        const closeMiningAreaOverview = () => {
            closeMiningAreaSelection();
        };

        const handleAddMiningAreaToMonitoring = async (area) => {
            if (!area) return;

            activePanels.value.miningWeatherMonitor = true;

            await nextTick();
            if (miningWeatherMonitorRef.value && typeof miningWeatherMonitorRef.value.addArea === 'function') {
                miningWeatherMonitorRef.value.addArea(area);
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

                    const hasActiveWeatherLayer = weatherLayerState.value.some(group =>
                        (group.subLayers || []).some(subLayer => subLayer.active)
                    );

                    if (!hasActiveWeatherLayer) {
                        invokeMapMethod('closeWeatherPicker');
                        invokeMapMethod('closeWeatherInfo');
                    }
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
            console.log('切换选项卡:', tab);

            if (currentTab.value === '采矿系统' && tab !== '采矿系统') {
                clearRouteWeatherState();
                clearRouteDemoState();
            }

            if (currentTab.value === '环境监测' && tab !== '环境监测') {
                resetEnvironmentMonitoringState();
            }

            if (currentTab.value === '矿区总览' && tab !== '矿区总览') {
                closeMiningScience();
                closeMiningRegionOverview();
            }

            if (currentTab.value === '历史数据' && tab !== '历史数据') {
                clearHistoricalTyphoonTrack({ clearEvent: true });
                historicalSeaStateRequestId += 1;
                loadingHistoricalSeaState.value = false;
            }

            if (!['矿区总览', '预报中心'].includes(tab)) {
                closeMiningAreaSelection();
            }

            currentTab.value = tab;
            
            // 根据选项卡切换右侧功能面板
            if (tab === '矿区总览') {
                showTimeline.value = false;
                activePanels.value = createActivePanels();
                isRightPanelCollapsed.value = false;
            } else if (tab === '预报中心') {
                showTimeline.value = false;
                activePanels.value = createActivePanels({ forecastCenter: true });
                isRightPanelCollapsed.value = true;
            } else if (tab === '环境监测') {
                showTimeline.value = false;
                activePanels.value = createActivePanels({ buoyMonitoring: true });
                isRightPanelCollapsed.value = true;
            } else if (tab === '采矿系统') {
                showTimeline.value = false;
                activePanels.value = createActivePanels();
                isRightPanelCollapsed.value = false;
            } else if (tab === '预警中心') {
                showTimeline.value = false;
                activePanels.value = createActivePanels({ weatherWarnings: true });
                isRightPanelCollapsed.value = true;
            } else if (tab === '历史数据') {
                showTimeline.value = false;
                activePanels.value = createActivePanels();
                isRightPanelCollapsed.value = false;
                nextTick(() => {
                    void toggleHistoricalSeaState();
                });
            } else {
                showTimeline.value = false;
                activePanels.value = createActivePanels();
                isRightPanelCollapsed.value = false;
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

            // 加载区域总览的大矿区列表
            loadMiningOverviewRegions();
            
            // 监听来自 MapContainer 的打开航线演示事件
            window.addEventListener('openRouteDemo', () => {
                console.log('📡 收到打开航线演示事件');
                activePanels.value.routePlan = false;
                activePanels.value.shipSearch = false;
                activePanels.value.areaMonitor = false;
                clearRouteWeatherState();
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
                window.appWaypointWeatherPopupRef = waypointWeatherPopupRef.value;  // 添加航点气象弹窗引用
                console.log('🌐 window.app 已设置:', window.app);
                console.log('🎬 window.appRouteDemoRef 已设置:', window.appRouteDemoRef);
                console.log('⚠️ window.appRiskWarningRef 已设置:', window.appRiskWarningRef);
                console.log('📊 window.appWeatherCardRef 已设置:', window.appWeatherCardRef);
                console.log('📍 window.appWaypointWeatherPopupRef 已设置:', window.appWaypointWeatherPopupRef);
                
                // 验证 weatherCardRef
                if (!window.appWeatherCardRef) {
                    console.error('❌ weatherCardRef 为 null！');
                } else {
                    console.log('✅ weatherCardRef 方法:', Object.keys(window.appWeatherCardRef));
                }
                
                // 验证 waypointWeatherPopupRef
                if (!window.appWaypointWeatherPopupRef) {
                    console.error('❌ waypointWeatherPopupRef 为 null！');
                } else {
                    console.log('✅ waypointWeatherPopupRef 方法:', Object.keys(window.appWaypointWeatherPopupRef));
                }
            }
        });
        
        // WebSocket 连接函数
        const connectWebSocket = () => {
            const WS_URL = API_ENDPOINTS.WEBSOCKET;
            
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

                case 'bulletin_ready':
                    window.dispatchEvent(new CustomEvent('forecast-bulletin-ready', { detail: payload }));
                    break;

                case 'weather_warning':
                case 'weather_warning_resolved':
                    window.dispatchEvent(new CustomEvent('weather-warning-updated', { detail: payload }));
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
            toggleForecastRegion,
            closeForecastRegion,
            toggleForecastCenter,
            closeForecastCenter,
            toggleBuoyMonitoring,
            closeBuoyMonitoring,
            toggleWeatherWarnings,
            closeWeatherWarnings,
            toggleLayers,
            toggleWeatherLayers,
            toggleShipSearch,
            togglePipeSelection,
            closePipeSelection,
            toggleRoutePlan,
            toggleAreaMonitor,
            toggleHistoryTrack,
            toggleShipList,
            toggleMiningWeatherMonitor,
            toggleMiningScience,
            closeMiningScience,
            handleMiningScienceRouteChange,
            miningSciencePreset,
            toggleRouteDemo,
            toggleHistoricalTyphoon,
            closeHistoricalTyphoon,
            toggleHistoricalSeaState,
            closeHistoricalSeaState,
            togglePipelineWarning,
            closePipelineWarning,
            toggleMonitoringEvents,
            closeMonitoringEvents,
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
            handleMiningRegionSelect,
            handleMiningRegionDateChange,
            handleMiningAreaSelect,
            handleMapAreaSelected,
            handleHistoricalTyphoonAreaSelect,
            handleHistoricalTyphoonEventSelect,
            handleHistoricalTyphoonPageChange,
            handleHistoricalTyphoonFiltersChange,
            handleHistoricalSeaStateAreaSelect,
            handleHistoricalSeaStateRecordSelect,
            handleHistoricalSeaStatePageChange,
            handleHistoricalSeaStateFiltersChange,
            closeMiningAreaOverview,
            closeMiningRegionOverview,
            handleAddMiningAreaToMonitoring,
            handleTabChange,
            filters,
            availableCountries,
            allMiningData,
            filteredMiningData,
            miningOverviewRegions,
            miningOverviewRegionOptions,
            loadingMiningOverviewRegions,
            selectedMiningArea,
            selectedMiningAreaId,
            showMiningAreaOverview,
            loadingMiningAreaOverview,
            miningAreaOverviewPosition,
            selectedMiningRegion,
            selectedMiningRegionId,
            selectedMiningRegionDaily,
            selectedMiningRegionHourly,
            selectedMiningRegionSites,
            selectedMiningRegionDate,
            selectedMiningRegionSite,
            selectedMiningRegionSiteDaily,
            selectedMiningRegionSiteHourly,
            showMiningRegionOverview,
            loadingMiningRegionOverview,
            loadingMiningRegionHourly,
            loadingMiningRegionSite,
            loadingMiningRegionSiteHourly,
            selectedHistoricalTyphoonArea,
            historicalTyphoonSummary,
            historicalTyphoonEvents,
            historicalTyphoonYearly,
            historicalTyphoonWindow,
            historicalTyphoonTrack,
            historicalTyphoonTotal,
            historicalTyphoonError,
            historicalTyphoonWindowError,
            selectedHistoricalTyphoonEvent,
            loadingHistoricalTyphoon,
            loadingHistoricalTyphoonTrack,
            loadingHistoricalTyphoonWindow,
            historicalTyphoonFilters,
            historicalTyphoonQuickAreas,
            selectedHistoricalSeaStateArea,
            selectedHistoricalSeaStatePoint,
            historicalSeaStateRecords,
            historicalSeaStateFilteredRecords,
            historicalSeaStatePagedRecords,
            historicalSeaStateTotal,
            historicalSeaStateError,
            selectedHistoricalSeaStateRecord,
            loadingHistoricalSeaState,
            historicalSeaStateFilters,
            historicalSeaStateQuickAreas,
            typhoonTrackRequest,
            isRightPanelCollapsed,
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
            miningScienceRef,
            areaMonitorRef,
            mapContainerRef,
            getMapViewer,
            miningWeatherMonitorRef,
            routeDemoRef,
            riskWarningRef,
            weatherCardRef,
            waypointWeatherPopupRef,
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
