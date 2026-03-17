<template>
    <div class="relative w-screen h-screen overflow-hidden text-white font-sans selection:bg-cyan-500 selection:text-white app-container" 
         style="background-color: var(--primary-bg); color: var(--text-primary);">
        
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
                :resourceFilters="filters.resources || []"
                :showUSCooperation="showPolicyDynamicsTimeline"
                @dataLoaded="handleDataLoaded"
                @cableDataLoaded="handleCableDataLoaded"
                @arcticRouteDataLoaded="handleArcticRouteDataLoaded"
                @observationDataLoaded="handleObservationDataLoaded"
                @marineEquipmentDataLoaded="handleMarineEquipmentDataLoaded"
                @researchInstitutionDataLoaded="handleResearchInstitutionDataLoaded"
                @weatherDataLoaded="handleWeatherDataLoaded"
                @pointPicked="handlePointPicked"
            />
            
            <!-- UI Layer (Z-10+) -->
            <div class="absolute inset-0 pointer-events-none">
                <Header @tabChange="handleTabChange" />
                
                <!-- 主题切换按钮 -->
                <ThemeToggle @themeChange="handleThemeChange" />
                
                <LeftPanel 
                    ref="leftPanelRef"
                    :availableCountries="availableCountries"
                    :showQueryPanel="activePanels.query"
                    :showLayersPanel="activePanels.layers"
                    :showWeatherLayersPanel="activePanels.weatherLayers"
                    @filterChange="handleFilterChange"
                    @layersChange="handleLayersChange"
                    @weatherLayersChange="handleWeatherLayersChange"
                    @regionLocate="handleRegionLocate"
                    @showTimeline="handleShowTimeline"
                    @showPolicyDynamics="handleShowPolicyDynamics"
                    @showCountryAttitudes="handleShowCountryAttitudes"
                    @showMiningVehicle="handleShowMiningVehicle"
                    @showTechnologyMaturity="handleShowTechnologyMaturity"
                    @showMiningPlatform="handleShowMiningPlatform"
                    @showExperimentalMining="handleShowExperimentalMining"
                    @showEnvironmentalMonitoring="handleShowEnvironmentalMonitoring"
                    @showLiftingSystem="handleShowLiftingSystem"
                    @showEnterprise="handleShowEnterprise"
                    @showEconomicCalculation="handleShowEconomicCalculation"
                    @showModelComparison="handleShowModelComparison"
                    @showEvaluationFormula="handleShowEvaluationFormula"
                    @showFeasibilityAnalysis="handleShowFeasibilityAnalysis"
                    @showScenarioSimulation="handleShowScenarioSimulation"
                />
                
                <!-- 态势总览面板 -->
                <SituationOverviewPanel 
                    :show="activePanels.situationOverview"
                    @itemClick="handleSituationOverviewItemClick"
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
                
                <!-- 地质调查面板 -->
                <GeologicalSurveyPanel 
                    :show="activePanels.geologicalSurvey"
                    @layerToggle="handleGeologicalLayerToggle"
                />
                
                <!-- 大洋钻探面板 -->
                <DrillingPanel 
                    :showPanel="activePanels.drillingPanel"
                    @filterChange="handleDrillingFilterChange"
                    @showManagementFramework="handleShowManagementFramework"
                    @selectCoreRepository="handleSelectCoreRepository"
                />
                
                <!-- 钻探统计面板 -->
                <DrillingStatisticsPanel 
                    :show="activePanels.drillingStatistics"
                    @close="toggleDrillingStatistics"
                />
                
                <!-- 管理框架面板 -->
                <ManagementFrameworkPanel 
                    :show="showManagementFramework"
                    :frameworks="selectedManagementFrameworks"
                    @close="handleCloseManagementFramework"
                />
                
                <!-- 坐标采集面板 -->
                <CoordinateCollectorPanel 
                    ref="coordinateCollectorRef"
                    :show="activePanels.coordinateCollector"
                    @close="toggleCoordinateCollector"
                    @startCollecting="handleStartCollecting"
                    @stopCollecting="handleStopCollecting"
                />
                
                <!-- 区域勾面面板 -->
                <PolygonDrawerPanel 
                    ref="polygonDrawerRef"
                    :show="activePanels.polygonDrawer"
                    @close="togglePolygonDrawer"
                    @startDrawing="handleStartPolygonDrawing"
                    @stopDrawing="handleStopPolygonDrawing"
                    @polygonFinished="handlePolygonFinished"
                    @polygonsUpdated="handlePolygonsUpdated"
                />
                
                <!-- 极地科考面板 -->
                <PolarPanel
                    v-if="currentTab === '极地科考'"
                    :showPanel="activePanels.polarPanel"
                    @regionChange="handlePolarRegionChange"
                    @categoryClick="handlePolarCategoryClick"
                    @stationCountryClick="handleStationCountryClick"
                    @resourceSurveyCountryClick="handleResourceSurveyCountryClick"
                />
                
                <!-- 极地资源潜力面板 -->
                <PolarResourcePotentialPanel 
                    :show="activePanels.resourcePotential"
                    @close="toggleResourcePotential"
                    @showResourceCharts="handleShowResourceCharts"
                />
                
                <!-- 科考站国家图例 - 与科考站点按钮绑定 - 暂时隐藏 -->
                <!-- <StationCountryLegend 
                    :show="activePanels.polarStations"
                    :countries="polarStationCountries || { antarctic: [], arctic: [] }"
                    @close="togglePolarStations"
                /> -->
                
                <!-- 科考站统计面板 - 与科考站点按钮绑定 -->
                <PolarStationStatistics 
                    :show="activePanels.polarStations && !showArcticResourceCharts"
                    @close="togglePolarStations"
                />
                
                <!-- 北极资源图表面板 - 替换科考站统计面板 -->
                <ArcticResourceCharts 
                    :show="showArcticResourceCharts"
                    @close="handleCloseResourceCharts"
                />
                
                <!-- 极地主权主张面板 - 与主权主张按钮绑定 -->
                <PolarSovereigntyPanel 
                    ref="polarSovereigntyPanelRef"
                    :show="activePanels.polarSovereignty"
                    @close="togglePolarSovereignty"
                    @showAntarcticDetail="handleShowAntarcticDetail"
                />
                
                <!-- 南极主权详情面板 - 中间大面板 -->
                <AntarcticSovereigntyDetail 
                    :show="activePanels.antarcticSovereigntyDetail"
                    @close="handleCloseAntarcticDetail"
                />
                
                <!-- 矿区数据统计面板 -->
                <MiningDataPanel 
                    v-if="activePanels.miningData"
                    @close="toggleMiningData"
                />
                
                <!-- 科考船列表面板 -->
                <ResearchVesselList 
                    v-if="activePanels.researchVesselList"
                    @close="toggleResearchVesselList"
                    @vesselSelect="handleVesselSelect"
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
                    @toggleMiningData="toggleMiningData"
                    @toggleResearchVesselList="toggleResearchVesselList"
                    @toggleRouteDemo="toggleRouteDemo"
                    @toggleGeologicalSurvey="toggleGeologicalSurvey"
                    @toggleDrillingPanel="toggleDrillingPanel"
                    @toggleDrillingStatistics="toggleDrillingStatistics"
                    @toggleCoordinateCollector="toggleCoordinateCollector"
                    @togglePolygonDrawer="togglePolygonDrawer"
                    @togglePolarPanel="togglePolarPanel"
                    @toggleResourcePotential="toggleResourcePotential"
                    @togglePolarStations="togglePolarStations"
                    @togglePolarSovereignty="togglePolarSovereignty"
                    @toggleSituationOverview="toggleSituationOverview"
                    @toggleCableList="toggleCableList"
                    @toggleCableStatistics="toggleCableStatistics"
                    @toggleArcticRouteList="toggleArcticRouteList"
                    @toggleArcticRouteStatistics="toggleArcticRouteStatistics"
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
                
                <!-- 光缆列表 -->
                <div v-if="activePanels.cableList" class="pointer-events-auto">
                    <CableListTable 
                        :cableData="allCableData"
                        @toggleStatistics="toggleCableStatistics"
                    />
                </div>
                
                <!-- 北极航线列表 -->
                <div v-if="activePanels.arcticRouteList" class="pointer-events-auto">
                    <ArcticRouteListTable 
                        :routeData="allArcticRouteData"
                        @rowClick="handleArcticRouteRowClick"
                        @resetSelection="handleArcticRouteResetSelection"
                        @viewAll="handleArcticRouteViewAll"
                        @toggleStatistics="toggleArcticRouteStatistics"
                    />
                </div>
                
                <!-- 主要港口列表 -->
                <div v-if="activePanels.portList" class="pointer-events-auto">
                    <PortListTable 
                        :portData="allPortData"
                        @rowClick="handlePortRowClick"
                        @resetSelection="handlePortResetSelection"
                        @toggleStatistics="togglePortStatistics"
                    />
                </div>
                
                <!-- 主要航线列表 -->
                <div v-if="activePanels.routeList" class="pointer-events-auto">
                    <RouteListTable 
                        :routeData="allRouteData"
                        @rowClick="handleRouteRowClick"
                        @resetSelection="handleRouteResetSelection"
                        @toggleStatistics="toggleRouteStatistics"
                    />
                </div>
                
                <!-- 海底观测网列表 -->
                <div v-if="activePanels.observationList" class="pointer-events-auto">
                    <ObservationListTable 
                        :observationData="allObservationData"
                        @rowClick="handleObservationRowClick"
                        @resetSelection="handleObservationResetSelection"
                        @toggleStatistics="toggleObservationStatistics"
                    />
                </div>
                
                <!-- 海洋装备列表 -->
                <div v-if="activePanels.marineEquipmentList" class="pointer-events-auto">
                    <MarineEquipmentListTable 
                        :equipmentData="allMarineEquipmentData"
                        @rowClick="handleMarineEquipmentRowClick"
                        @toggleStatistics="toggleMarineEquipmentStatistics"
                        @refresh="handleMarineEquipmentRefresh"
                    />
                </div>
                
                <!-- 研究机构列表 -->
                <div v-if="activePanels.researchInstitutionList" class="pointer-events-auto">
                    <ResearchInstitutionListTable 
                        :institutionData="allResearchInstitutionData"
                        @rowClick="handleResearchInstitutionRowClick"
                        @resetSelection="handleResearchInstitutionResetSelection"
                        @toggleStatistics="toggleResearchInstitutionStatistics"
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
                
                <!-- 极地科考站列表面板 -->
                <PolarStationListPanel 
                    :show="polarStationListVisible"
                    :stations="polarStationList"
                    :region="currentPolarRegion"
                    @close="polarStationListVisible = false"
                    @stationClick="handleStationClick"
                />
                
                <!-- 南极资源列表面板 -->
                <AntarcticResourceListPanel 
                    :show="antarcticResourceListVisible"
                    :resources="antarcticResourceList"
                    :selectedCategories="selectedResourceCategories"
                    @close="antarcticResourceListVisible = false"
                    @resourceClick="handleResourceClick"
                />
                
                <!-- 资源调查面板 -->
                <ResourceSurveyPanel 
                    :show="resourceSurveyPanelVisible"
                    :selectedCountries="selectedResourceSurveyCountries"
                    @close="resourceSurveyPanelVisible = false"
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
                
                <!-- 开发规章时间线 -->
                <DevelopmentTimeline 
                    :show="showDevelopmentTimeline"
                    @close="handleCloseTimeline"
                />
                
                <!-- 政策动态时间线 - 旧版（已注释） -->
                <!-- <PolicyDynamicsTimeline 
                    :show="showPolicyDynamicsTimeline"
                    :country="policyDynamicsCountry"
                    @close="handleClosePolicyDynamics"
                /> -->
                
                <!-- 美国政策动态时间线 - 新版（横向底部） -->
                <USPolicyTimeline 
                    :show="showPolicyDynamicsTimeline"
                    @close="handleClosePolicyDynamics"
                />
                
                <!-- 美国合作关系信息弹窗 -->
                <USCooperationPopup ref="usCooperationPopupRef" />
                
                <!-- 各国态度统计表格 -->
                <CountryAttitudesTable 
                    :show="showCountryAttitudes"
                    @close="handleCloseCountryAttitudes"
                />
                
                <!-- 采矿车面板 -->
                <MiningVehiclePanel 
                    :show="activePanels.miningVehicle"
                    @close="toggleMiningVehicle"
                />
                
                <!-- 技术成熟度面板 -->
                <TechnologyMaturityPanel 
                    :show="activePanels.technologyMaturity"
                    @close="toggleTechnologyMaturity"
                />
                
                <!-- 采矿平台面板 -->
                <MiningPlatformPanel 
                    :show="activePanels.miningPlatform"
                    @close="toggleMiningPlatform"
                />
                
                <!-- 企业主体面板 -->
                <EnterprisePanel 
                    :show="activePanels.enterprise"
                    @close="toggleEnterprise"
                />
                
                <!-- 试验试采信息弹窗 -->
                <ExperimentalMiningPanel ref="experimentalMiningPanelRef" />
                
                <!-- 环境监测面板 -->
                <EnvironmentalMonitoringPanel 
                    :show="activePanels.environmentalMonitoring"
                    @close="handleCloseEnvironmentalMonitoring"
                />
                
                <!-- 提升系统面板 -->
                <LiftingSystemPanel 
                    :show="activePanels.liftingSystem"
                    @close="toggleLiftingSystem"
                />
                
                <!-- 最新进展面板 -->
                <LatestProgressPanel 
                    :show="activePanels.latestProgress"
                    @close="toggleLatestProgress"
                />
                
                <!-- 光缆统计面板 -->
                <CableStatisticsPanel
                    v-if="activePanels.cableStatistics"
                    :statistics="cableStatistics"
                    @close="toggleCableStatistics"
                />
                
                <!-- 北极航线统计面板 -->
                <ArcticRouteStatisticsPanel
                    v-if="activePanels.arcticRouteStatistics"
                    :statistics="arcticRouteStatistics"
                    @close="toggleArcticRouteStatistics"
                    @viewAll="handleArcticRouteViewAll"
                />
                
                <!-- 主要港口统计面板 -->
                <PortStatisticsPanel
                    v-if="activePanels.portStatistics"
                    :statistics="portStatistics"
                    @close="togglePortStatistics"
                />
                
                <!-- 主要航线统计面板 -->
                <RouteStatisticsPanel
                    v-if="activePanels.routeStatistics"
                    :statistics="routeStatistics"
                    @close="toggleRouteStatistics"
                />
                
                <!-- 海底观测网统计面板 -->
                <ObservationStatisticsPanel
                    v-if="activePanels.observationStatistics"
                    :statistics="observationStatistics"
                    @close="toggleObservationStatistics"
                />
                
                <!-- 海洋装备统计面板 -->
                <MarineEquipmentStatisticsPanel
                    v-if="activePanels.marineEquipmentStatistics"
                    :equipmentData="allMarineEquipmentData"
                    @close="toggleMarineEquipmentStatistics"
                />
                
                <!-- 研究机构统计面板 -->
                <ResearchInstitutionStatisticsPanel
                    v-if="activePanels.researchInstitutionStatistics"
                    :institutionData="allResearchInstitutionData"
                    @close="toggleResearchInstitutionStatistics"
                />
                
                <!-- 海底观测网图片弹窗 -->
                <ObservationImagePopup
                    :show="showObservationImage"
                    :title="observationImageData.title"
                    :imagePath="observationImageData.imagePath"
                    :position="observationImageData.position"
                    @close="closeObservationImage"
                />
            </div>
        </div>
        
        <!-- 区域详情对话框 -->
        <AreaDetailDialog 
            v-if="showAreaDetail && selectedAreaForDetail"
            :area="selectedAreaForDetail"
            @close="closeAreaDetailDialog"
        />
        
        <!-- 经济计算面板 -->
        <EconomicCalculationPanel 
            :show="showEconomicCalculation"
            @close="handleCloseEconomicCalculation"
        />
        
        <!-- 模型对比面板 -->
        <ModelComparisonPanel 
            :show="showModelComparison"
            @close="handleCloseModelComparison"
        />
        
        <!-- 经济评价公式面板 -->
        <EvaluationFormulaPanel 
            :show="showEvaluationFormula"
            @close="handleCloseEvaluationFormula"
        />
        
        <!-- 可行性分析面板 -->
        <FeasibilityAnalysisPanel 
            :show="showFeasibilityAnalysis"
            @close="handleCloseFeasibilityAnalysis"
        />
        
        <!-- 情景模拟面板 -->
        <ScenarioSimulationPanel 
            :show="showScenarioSimulation"
            @close="handleCloseScenarioSimulation"
        />
        
        <!-- 北极资源统计表格 -->
        <ArcticResourceTable 
            :show="activePanels.arcticResourceTable"
            @close="toggleArcticResourceTable"
            @showStatistics="handleShowArcticStatistics"
        />
        
        <!-- 北极资源统计面板 -->
        <ArcticResourceStatisticsPanel 
            :show="showArcticStatisticsPanel"
            @close="handleCloseArcticStatistics"
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
import CableListTable from './components/CableListTable.vue';
import CableStatisticsPanel from './components/CableStatisticsPanel.vue';
import ArcticRouteListTable from './components/ArcticRouteListTable.vue';
import ArcticRouteStatisticsPanel from './components/ArcticRouteStatisticsPanel.vue';
import PortListTable from './components/PortListTable.vue';
import PortStatisticsPanel from './components/PortStatisticsPanel.vue';
import RouteListTable from './components/RouteListTable.vue';
import RouteStatisticsPanel from './components/RouteStatisticsPanel.vue';
import ObservationListTable from './components/ObservationListTable.vue';
import ObservationStatisticsPanel from './components/ObservationStatisticsPanel.vue';
import ObservationImagePopup from './components/ObservationImagePopup.vue';
import MarineEquipmentListTable from './components/MarineEquipmentListTable.vue';
import MarineEquipmentStatisticsPanel from './components/MarineEquipmentStatisticsPanel.vue';
import ResearchInstitutionListTable from './components/ResearchInstitutionListTable.vue';
import ResearchInstitutionStatisticsPanel from './components/ResearchInstitutionStatisticsPanel.vue';
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
import WaypointWeatherPopup from './components/WaypointWeatherPopup.vue';
import ThemeToggle from './components/ThemeToggle.vue';
import GeologicalSurveyPanel from './components/GeologicalSurveyPanel.vue';
import MiningDataPanel from './components/MiningDataPanel.vue';
import ResearchVesselList from './components/ResearchVesselList.vue';
import DevelopmentTimeline from './components/DevelopmentTimeline.vue';
// import PolicyDynamicsTimeline from './components/PolicyDynamicsTimeline.vue'; // 旧版已注释
import USPolicyTimeline from './components/USPolicyTimeline.vue'; // 新版横向时间轴
import ArcticResourceTable from './components/ArcticResourceTable.vue'; // 北极资源统计表格
import ArcticResourceStatisticsPanel from './components/ArcticResourceStatisticsPanel.vue'; // 北极资源统计面板
import USCooperationPopup from './components/USCooperationPopup.vue'; // 美国合作关系弹窗
import CountryAttitudesTable from './components/CountryAttitudesTable.vue';
import MiningVehiclePanel from './components/MiningVehiclePanel.vue';
import TechnologyMaturityPanel from './components/TechnologyMaturityPanel.vue';
import MiningPlatformPanel from './components/MiningPlatformPanel.vue';
import EnterprisePanel from './components/EnterprisePanel.vue';
import ExperimentalMiningPanel from './components/ExperimentalMiningPanel.vue';
import EnvironmentalMonitoringPanel from './components/EnvironmentalMonitoringPanel.vue';
import LiftingSystemPanel from './components/LiftingSystemPanel.vue';
import LatestProgressPanel from './components/LatestProgressPanel.vue';
import DrillingPanel from './components/DrillingPanel.vue';
import DrillingStatisticsPanel from './components/DrillingStatisticsPanel.vue';
import ManagementFrameworkPanel from './components/ManagementFrameworkPanel.vue';
import CoordinateCollectorPanel from './components/CoordinateCollectorPanel.vue';
import PolygonDrawerPanel from './components/PolygonDrawerPanel.vue';
import PolarPanel from './components/PolarPanel.vue';
import PolarStationListPanel from './components/PolarStationListPanel.vue';
import AntarcticResourceListPanel from './components/AntarcticResourceListPanel.vue';
import ResourceSurveyPanel from './components/ResourceSurveyPanel.vue';
import PolarResourcePotentialPanel from './components/PolarResourcePotentialPanel.vue';
import StationCountryLegend from './components/StationCountryLegend.vue';
import PolarStationStatistics from './components/PolarStationStatistics.vue';
import ArcticResourceCharts from './components/ArcticResourceCharts.vue';
import PolarSovereigntyPanel from './components/PolarSovereigntyPanel.vue';
import AntarcticSovereigntyDetail from './components/AntarcticSovereigntyDetail.vue';
import SituationOverviewPanel from './components/SituationOverviewPanel.vue';
import CoreRepositoryCharts from './components/CoreRepositoryCharts.vue';
import ModelComparisonPanel from './components/ModelComparisonPanel.vue';
import EconomicCalculationPanel from './components/EconomicCalculationPanel.vue';
import EvaluationFormulaPanel from './components/EvaluationFormulaPanel.vue';
import FeasibilityAnalysisPanel from './components/FeasibilityAnalysisPanel.vue';
import ScenarioSimulationPanel from './components/ScenarioSimulationPanel.vue';
import { PolarStationsLoader } from './utils/polarStationsLoader.js';
import { EnterpriseMarkerManager } from './utils/enterpriseMarkers.js';
import { CHINA_ENTERPRISES } from './constants.js';
import { RouteManager } from './utils/routeManager.js';

export default {
    components: {
        Header,
        LeftPanel,
        RightPanel,
        MapContainer,
        BottomTable,
        CableListTable,
        CableStatisticsPanel,
        ArcticRouteListTable,
        ArcticRouteStatisticsPanel,
        PortListTable,
        PortStatisticsPanel,
        RouteListTable,
        RouteStatisticsPanel,
        ObservationListTable,
        ObservationStatisticsPanel,
        ObservationImagePopup,
        MarineEquipmentListTable,
        MarineEquipmentStatisticsPanel,
        ResearchInstitutionListTable,
        ResearchInstitutionStatisticsPanel,
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
        MiningAreaWeatherCard,
        WaypointWeatherPopup,
        ThemeToggle,
        GeologicalSurveyPanel,
        MiningDataPanel,
        ResearchVesselList,
        DevelopmentTimeline,
        // PolicyDynamicsTimeline, // 旧版已注释
        USPolicyTimeline, // 新版横向时间轴
        USCooperationPopup, // 美国合作关系弹窗
        ArcticResourceTable, // 北极资源统计表格
        ArcticResourceStatisticsPanel, // 北极资源统计面板
        CountryAttitudesTable,
        MiningVehiclePanel,
        TechnologyMaturityPanel,
        MiningPlatformPanel,
        EnterprisePanel,
        ExperimentalMiningPanel,
        EnvironmentalMonitoringPanel,
        LiftingSystemPanel,
        LatestProgressPanel,
        DrillingPanel,
        DrillingStatisticsPanel,
        ManagementFrameworkPanel,
        CoordinateCollectorPanel,
        PolygonDrawerPanel,
        PolarPanel,
        PolarResourcePotentialPanel,
        PolarStationListPanel,
        AntarcticResourceListPanel,
        ResourceSurveyPanel,
        StationCountryLegend,
        PolarStationStatistics,
        ArcticResourceCharts,
        PolarSovereigntyPanel,
        AntarcticSovereigntyDetail,
        SituationOverviewPanel,
        CoreRepositoryCharts,
        ModelComparisonPanel,
        EconomicCalculationPanel,
        EvaluationFormulaPanel,
        FeasibilityAnalysisPanel,
        ScenarioSimulationPanel
    },
    setup() {
        // ==================== 状态管理 ====================
        
        // 当前主题
        const currentTheme = ref('dark');
        
        // WebSocket 连接
        let ws = null;
        
        // 企业标记管理器
        let enterpriseMarkerManager = null;
        
        // 航线管理器
        let routeManager = null;
        
        // 当前选中的顶部选项卡（默认：矿区管理）
        const currentTab = ref('矿区管理');
        
        // 各个功能面板的显示状态（默认：矿区管理选项卡）
        const activePanels = ref({
            list: false,          // 矿区列表（底部表格）
            mapTools: false,      // 地图工具栏
            query: true,          // 矿区查询面板（左侧）- 默认打开
            layers: false,        // 图层控制面板（左侧）
            weatherLayers: false, // 气象图层面板（左侧）
            shipSearch: false,    // 船舶搜索面板（左侧）
            routePlan: false,     // 航线规划面板（左侧）
            areaMonitor: false,    // 区域监控面板（左侧）
            historyTrack: false,  // 历史轨迹面板（左侧）
            shipList: false,      // 船舶列表（底部表格）
            routeWeather: false,   // 航线气象（右侧按钮高亮）
            miningWeatherMonitor: false,  // 矿区气象监测（右侧面板）
            routeDemo: false,      // 航线演示（左侧面板）
            geologicalSurvey: false,  // 地质调查面板（左侧）
            miningData: true,      // 矿区数据统计（右侧面板）- 默认打开
            researchVesselList: false,  // 科考船列表（左侧面板）
            miningVehicle: false,  // 采矿车面板（底部中间）
            technologyMaturity: false,  // 技术成熟度面板（中间大面板）
            miningPlatform: false,  // 采矿平台面板（中间大面板）
            enterprise: false,  // 企业主体面板（底部中间）
            liftingSystem: false,  // 提升系统面板（底部中间）
            latestProgress: false,  // 最新进展面板（提升系统上方）
            drillingPanel: false,  // 钻孔面板（左侧）
            drillingStatistics: false,  // 钻探统计面板（右侧）
            coordinateCollector: false,  // 坐标采集面板（左侧）
            polarPanel: false,  // 极地面板（左侧）
            resourcePotential: false,  // 资源潜力面板（左侧）
            polarStations: false,  // 极地科考站（地图图层）
            polarSovereignty: false,  // 极地主权主张面板（左侧）
            antarcticSovereigntyDetail: false,  // 南极主权详情面板（中间）
            environmentalMonitoring: false,  // 环境监测面板（中间）
            situationOverview: false,  // 态势总览面板（左侧）
            cableList: false,     // 光缆列表（底部表格）
            cableStatistics: false,  // 光缆统计面板（右侧）
            arcticRouteList: false,  // 北极航线列表（底部表格）
            arcticRouteStatistics: false,  // 北极航线统计面板（右侧）
            portList: false,  // 主要港口列表（底部表格）
            portStatistics: false,  // 主要港口统计面板（右侧）
            routeList: false,  // 主要航线列表（底部表格）
            routeStatistics: false,  // 主要航线统计面板（右侧）
            observationList: false,  // 海底观测网列表（底部表格）
            observationStatistics: false,  // 海底观测网统计面板（右侧）
            arcticResourceTable: false,  // 北极资源统计表格（底部中间）
            polygonDrawer: false,  // 区域勾面面板（左侧）
            marineEquipmentList: false,  // 海洋装备列表（底部表格）
            marineEquipmentStatistics: false,  // 海洋装备统计面板（右侧）
            researchInstitutionList: false,  // 研究机构列表（底部表格）
            researchInstitutionStatistics: false  // 研究机构统计面板（右侧）
        });
        
        // 区域详情对话框状态
        const showAreaDetail = ref(false);
        const selectedAreaForDetail = ref(null);
        
        // 时间轴显示状态（当切换到气象监测选项卡时自动显示）
        const showTimeline = ref(false);
        
        // 经济评价面板状态
        const showEconomicCalculation = ref(false);
        const showModelComparison = ref(false);
        const showEvaluationFormula = ref(false);
        const showFeasibilityAnalysis = ref(false);
        const showScenarioSimulation = ref(false);
        
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
        
        // 所有海底光缆数据（从 ArcGIS 服务加载）
        const allCableData = ref([]);
        const cableStatistics = ref(null);
        
        // 所有北极航线数据（从本地 GeoJSON 加载）
        const allArcticRouteData = ref([]);
        const arcticRouteStatistics = ref(null);
        
        // 主要港口数据
        const allPortData = ref([]);
        const portStatistics = ref(null);
        
        // 主要航线数据
        const allRouteData = ref([]);
        const routeStatistics = ref(null);
        
        // 海底观测网数据
        const allObservationData = ref([]);
        const observationStatistics = ref(null);
        
        // 海洋装备数据
        const allMarineEquipmentData = ref([]);
        
        // 研究机构数据
        const allResearchInstitutionData = ref([]);
        
        // 海底观测网图片弹窗状态
        const showObservationImage = ref(false);
        const observationImageData = ref({
            title: '',
            imagePath: '',
            position: { x: 0, y: 0 }
        });

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
        
        // 开发规章时间线显示状态
        const showDevelopmentTimeline = ref(false);
        
        // 政策动态时间线显示状态
        const showPolicyDynamicsTimeline = ref(false);
        const policyDynamicsCountry = ref('美国');
        
        // 各国态度显示状态
        const showCountryAttitudes = ref(false);
        
        // 极地科考站列表状态
        const polarStationListVisible = ref(false);
        const polarStationList = ref([]);
        const currentPolarRegion = ref('antarctic');
        
        // 南极资源列表状态
        const antarcticResourceListVisible = ref(false);
        const antarcticResourceList = ref([]);
        const selectedResourceCategories = ref([]);
        
        // 资源调查面板状态
        const resourceSurveyPanelVisible = ref(false);
        const selectedResourceSurveyCountries = ref([]);
        
        // 管理框架面板显示状态
        const showManagementFramework = ref(false);
        const selectedManagementFrameworks = ref([]);
        
        // 极地科考站国家列表（用于图例显示）
        const polarStationCountries = ref(null);
        
        // 海上丝绸之路状态
        const maritimeSilkRoadState = ref({
            portsVisible: false,
            routesVisible: false
        });
        
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
         * 切换地质调查面板的显示状态
         */
        const toggleGeologicalSurvey = () => {
            activePanels.value.geologicalSurvey = !activePanels.value.geologicalSurvey;
        };
        
        /**
         * 切换钻孔面板的显示状态
         */
        const toggleDrillingPanel = () => {
            activePanels.value.drillingPanel = !activePanels.value.drillingPanel;
        };
        
        /**
         * 切换钻探统计面板的显示状态
         */
        const toggleDrillingStatistics = () => {
            activePanels.value.drillingStatistics = !activePanels.value.drillingStatistics;
        };
        
        /**
         * 处理钻探筛选条件变化
         * @param {Object} filters - 筛选条件对象
         */
        const handleDrillingFilterChange = (filters) => {
            console.log('🔍 钻探筛选条件变化:', filters);
            
            // 处理钻孔站位和依托平台筛选
            if (filters.drillingSites || filters.platforms) {
                if (mapContainerRef.value && mapContainerRef.value.updateDrillingFilters) {
                    mapContainerRef.value.updateDrillingFilters({
                        drillingSites: filters.drillingSites || [],
                        platforms: filters.platforms || []
                    });
                }
            }
        };
        
        /**
         * 处理岩心库选择
         * @param {string|null} countryId - 国家ID (usa, germany, japan) 或 null
         */
        const handleSelectCoreRepository = (countryId) => {
            console.log('📱 App.vue: 收到岩心库选择事件', countryId);
            if (mapContainerRef.value && mapContainerRef.value.selectCoreRepository) {
                console.log('📱 App.vue: 调用MapContainer.selectCoreRepository');
                mapContainerRef.value.selectCoreRepository(countryId);
            } else {
                console.error('❌ App.vue: mapContainerRef或selectCoreRepository方法不存在');
            }
        };
        
        /**
         * 显示管理框架面板
         * @param {array|null} frameworksArray - 管理框架ID数组，null表示关闭面板
         */
        const handleShowManagementFramework = (frameworksArray) => {
            console.log('📋 显示管理框架:', frameworksArray);
            console.log('📋 当前selectedManagementFrameworks:', selectedManagementFrameworks.value);
            if (frameworksArray === null || (Array.isArray(frameworksArray) && frameworksArray.length === 0)) {
                // 关闭面板
                showManagementFramework.value = false;
                selectedManagementFrameworks.value = [];
                console.log('📋 关闭面板，清空数组');
            } else {
                // 显示面板并设置选中的框架数组
                selectedManagementFrameworks.value = Array.isArray(frameworksArray) ? frameworksArray : [frameworksArray];
                showManagementFramework.value = true;
                console.log('📋 设置selectedManagementFrameworks为:', selectedManagementFrameworks.value);
                console.log('📋 设置showManagementFramework为:', showManagementFramework.value);
            }
        };
        
        /**
         * 关闭管理框架面板
         */
        const handleCloseManagementFramework = () => {
            showManagementFramework.value = false;
            selectedManagementFrameworks.value = [];
        };
        
        /**
         * 切换矿区数据统计面板的显示状态
         */
        const toggleMiningData = () => {
            activePanels.value.miningData = !activePanels.value.miningData;
        };
        
        /**
         * 切换光缆列表的显示状态
         */
        const toggleCableList = () => {
            activePanels.value.cableList = !activePanels.value.cableList;
            // 如果打开列表，关闭统计面板
            if (activePanels.value.cableList) {
                activePanels.value.cableStatistics = false;
            }
        };
        
        /**
         * 切换光缆统计面板的显示状态
         */
        const toggleCableStatistics = () => {
            activePanels.value.cableStatistics = !activePanels.value.cableStatistics;
            // 如果打开统计面板，关闭列表
            if (activePanels.value.cableStatistics) {
                activePanels.value.cableList = false;
            }
        };
        
        /**
         * 切换北极航线列表的显示状态
         */
        const toggleArcticRouteList = () => {
            activePanels.value.arcticRouteList = !activePanels.value.arcticRouteList;
            // 如果打开列表，关闭统计面板
            if (activePanels.value.arcticRouteList) {
                activePanels.value.arcticRouteStatistics = false;
            }
        };
        
        /**
         * 切换北极航线统计面板的显示状态
         */
        const toggleArcticRouteStatistics = () => {
            activePanels.value.arcticRouteStatistics = !activePanels.value.arcticRouteStatistics;
            // 如果打开统计面板，关闭列表
            if (activePanels.value.arcticRouteStatistics) {
                activePanels.value.arcticRouteList = false;
            }
        };
        
        /**
         * 切换主要港口统计面板的显示状态
         */
        const togglePortStatistics = () => {
            activePanels.value.portStatistics = !activePanels.value.portStatistics;
            // 如果打开统计面板，关闭列表
            if (activePanels.value.portStatistics) {
                activePanels.value.portList = false;
            }
        };
        
        /**
         * 切换主要航线统计面板的显示状态
         */
        const toggleRouteStatistics = () => {
            activePanels.value.routeStatistics = !activePanels.value.routeStatistics;
            // 如果打开统计面板，关闭列表
            if (activePanels.value.routeStatistics) {
                activePanels.value.routeList = false;
            }
        };
        
        /**
         * 切换海底观测网列表的显示状态
         */
        const toggleObservationList = () => {
            activePanels.value.observationList = !activePanels.value.observationList;
            // 如果打开列表，关闭统计面板
            if (activePanels.value.observationList) {
                activePanels.value.observationStatistics = false;
            }
        };
        
        /**
         * 切换海底观测网统计面板的显示状态
         */
        const toggleObservationStatistics = () => {
            activePanels.value.observationStatistics = !activePanels.value.observationStatistics;
            // 如果打开统计面板，关闭列表
            if (activePanels.value.observationStatistics) {
                activePanels.value.observationList = false;
            }
        };
        
        /**
         * 切换北极资源统计表格的显示状态
         */
        const toggleArcticResourceTable = () => {
            activePanels.value.arcticResourceTable = !activePanels.value.arcticResourceTable;
        };
        
        /**
         * 切换海洋装备统计面板的显示状态
         */
        const toggleMarineEquipmentStatistics = () => {
            activePanels.value.marineEquipmentStatistics = !activePanels.value.marineEquipmentStatistics;
            // 如果打开统计面板，关闭列表
            if (activePanels.value.marineEquipmentStatistics) {
                activePanels.value.marineEquipmentList = false;
            }
        };
        
        /**
         * 处理海洋装备行点击事件
         */
        const handleMarineEquipmentRowClick = (equipment) => {
            console.log('🚢 海洋装备行点击:', equipment);
            // 飞到装备位置
            if (mapContainerRef.value && mapContainerRef.value.flyToMarineEquipment) {
                mapContainerRef.value.flyToMarineEquipment(equipment);
            }
        };
        
        /**
         * 处理海洋装备刷新事件
         */
        const handleMarineEquipmentRefresh = () => {
            console.log('🔄 刷新海洋装备数据');
            // 重新加载数据
            if (mapContainerRef.value && mapContainerRef.value.refreshMarineEquipment) {
                mapContainerRef.value.refreshMarineEquipment();
            }
        };
        
        /**
         * 切换研究机构统计面板的显示状态
         */
        const toggleResearchInstitutionStatistics = () => {
            activePanels.value.researchInstitutionStatistics = !activePanels.value.researchInstitutionStatistics;
            // 如果打开统计面板，关闭列表
            if (activePanels.value.researchInstitutionStatistics) {
                activePanels.value.researchInstitutionList = false;
            }
        };
        
        /**
         * 处理研究机构行点击事件
         */
        const handleResearchInstitutionRowClick = (institution) => {
            console.log('🏛️ 研究机构行点击:', institution);
            // 飞到机构位置
            if (mapContainerRef.value && mapContainerRef.value.flyToResearchInstitution) {
                mapContainerRef.value.flyToResearchInstitution(institution);
            }
        };
        
        /**
         * 处理研究机构重置选择事件
         */
        const handleResearchInstitutionResetSelection = () => {
            console.log('🔄 重置研究机构选择');
            if (mapContainerRef.value && mapContainerRef.value.resetResearchInstitutionHighlight) {
                mapContainerRef.value.resetResearchInstitutionHighlight();
            }
        };
        
        /**
         * 处理研究机构数据加载完成事件
         * @param {Array} data - 研究机构数据数组
         */
        const handleResearchInstitutionDataLoaded = (data) => {
            console.log('🏛️ App.vue - handleResearchInstitutionDataLoaded 被调用');
            console.log('🏛️ App.vue - 接收到的数据:', data);
            console.log('🏛️ App.vue - 数据长度:', data?.length);
            allResearchInstitutionData.value = data;
            console.log('🏛️ App.vue - allResearchInstitutionData 已更新:', allResearchInstitutionData.value);
        };
        
        /**
         * 切换科考船列表面板的显示状态
         */
        const toggleResearchVesselList = () => {
            activePanels.value.researchVesselList = !activePanels.value.researchVesselList;
        };
        
        /**
         * 切换采矿车面板的显示状态
         */
        const toggleMiningVehicle = () => {
            activePanels.value.miningVehicle = !activePanels.value.miningVehicle;
        };
        
        /**
         * 切换技术成熟度面板的显示状态
         */
        const toggleTechnologyMaturity = () => {
            activePanels.value.technologyMaturity = !activePanels.value.technologyMaturity;
        };
        
        /**
         * 切换采矿平台面板的显示状态
         */
        const toggleMiningPlatform = () => {
            activePanels.value.miningPlatform = !activePanels.value.miningPlatform;
        };
        
        /**
         * 切换坐标采集面板的显示状态
         */
        const toggleCoordinateCollector = () => {
            activePanels.value.coordinateCollector = !activePanels.value.coordinateCollector;
        };
        
        /**
         * 开始坐标采集
         */
        const handleStartCollecting = () => {
            console.log('🎯 开始坐标采集');
            pickingPointType.value = 'coordinate_collect';
        };
        
        /**
         * 停止坐标采集
         */
        const handleStopCollecting = () => {
            console.log('⏹️ 停止坐标采集');
            pickingPointType.value = null;
        };
        
        /**
         * 切换资源潜力面板的显示状态
         */
        const toggleResourcePotential = async () => {
            activePanels.value.resourcePotential = !activePanels.value.resourcePotential;
            
            if (activePanels.value.resourcePotential) {
                // 首次加载南极资源数据
                if (mapContainerRef.value && mapContainerRef.value.loadAntarcticResources) {
                    console.log('🌍 加载南极资源...');
                    await mapContainerRef.value.loadAntarcticResources();
                }
            }
            
            // 切换显示状态
            if (mapContainerRef.value && mapContainerRef.value.toggleAntarcticResources) {
                mapContainerRef.value.toggleAntarcticResources(activePanels.value.resourcePotential);
            }
        };
        
        // 北极资源图表显示状态
        const showArcticResourceCharts = ref(false);
        
        // 北极资源统计面板显示状态
        const showArcticStatisticsPanel = ref(false);
        
        /**
         * 处理显示北极资源图表
         */
        const handleShowResourceCharts = (resourceType) => {
            console.log('🎨 [App.vue] 收到显示北极资源图表事件:', resourceType);
            console.log('🎨 [App.vue] 当前 showArcticResourceCharts 值:', showArcticResourceCharts.value);
            console.log('🎨 [App.vue] 当前 activePanels.polarStations 值:', activePanels.value.polarStations);
            
            // 确保科考站点面板是打开的
            if (!activePanels.value.polarStations) {
                console.log('🎨 [App.vue] 科考站点面板未打开，自动打开');
                activePanels.value.polarStations = true;
            }
            
            showArcticResourceCharts.value = true;
            console.log('🎨 [App.vue] 设置后 showArcticResourceCharts 值:', showArcticResourceCharts.value);
        };
        
        /**
         * 处理关闭北极资源图表
         */
        const handleCloseResourceCharts = () => {
            console.log('🎨 [App.vue] 关闭北极资源图表');
            showArcticResourceCharts.value = false;
        };
        
        /**
         * 处理显示北极资源统计面板
         */
        const handleShowArcticStatistics = () => {
            console.log('📊 [App.vue] 显示北极资源统计面板');
            showArcticStatisticsPanel.value = true;
        };
        
        /**
         * 处理关闭北极资源统计面板
         */
        const handleCloseArcticStatistics = () => {
            console.log('📊 [App.vue] 关闭北极资源统计面板');
            showArcticStatisticsPanel.value = false;
        };
        
        /**
         * 切换极地科考站的显示状态
         */
        const togglePolarStations = async () => {
            activePanels.value.polarStations = !activePanels.value.polarStations;
            
            if (activePanels.value.polarStations) {
                // 首次加载科考站数据
                if (mapContainerRef.value && mapContainerRef.value.loadPolarStations) {
                    console.log('🏔️ 加载极地科考站...');
                    await mapContainerRef.value.loadPolarStations();
                    
                    // 获取国家列表用于图例显示
                    if (mapContainerRef.value.getPolarStationCountries) {
                        polarStationCountries.value = mapContainerRef.value.getPolarStationCountries();
                        console.log('🗺️ 获取科考站国家列表:', polarStationCountries.value);
                    }
                }
            }
            
            // 切换显示状态
            if (mapContainerRef.value && mapContainerRef.value.togglePolarStations) {
                mapContainerRef.value.togglePolarStations(activePanels.value.polarStations);
            }
        };
        
        /**
         * 切换极地主权主张面板的显示状态
         */
        const togglePolarSovereignty = () => {
            activePanels.value.polarSovereignty = !activePanels.value.polarSovereignty;
            console.log('🌐 切换极地主权主张面板:', activePanels.value.polarSovereignty);
        };
        
        /**
         * 切换态势总览面板的显示状态
         */
        const toggleSituationOverview = () => {
            activePanels.value.situationOverview = !activePanels.value.situationOverview;
            console.log('🌍 切换态势总览面板:', activePanels.value.situationOverview);
        };
        
        /**
         * 处理态势总览项目点击
         * @param {Object} data - 包含 category, itemId, active 的对象
         */
        const handleSituationOverviewItemClick = async (data) => {
            console.log('🔘 态势总览项目点击:', data);
            
            // 处理海上丝绸之路 - 主要港口
            if (data.category === 'maritime_silk_road' && data.itemId === 'major_ports') {
                console.log('⚓ 切换主要港口显示');
                maritimeSilkRoadState.value.portsVisible = data.active;
                if (mapContainerRef.value && mapContainerRef.value.togglePorts) {
                    mapContainerRef.value.togglePorts(data.active);
                }
                
                // 只打开/关闭港口列表，统计面板由用户手动切换
                if (data.active) {
                    // 确保数据已加载
                    await loadPortAndRouteData();
                    activePanels.value.portList = true;
                    // 如果打开列表，关闭统计面板
                    activePanels.value.portStatistics = false;
                } else {
                    activePanels.value.portList = false;
                    activePanels.value.portStatistics = false;
                }
                return;
            }
            
            // 处理海上丝绸之路 - 主要航线
            if (data.category === 'maritime_silk_road' && data.itemId === 'major_routes') {
                console.log('🛤️ 切换主要航线显示');
                maritimeSilkRoadState.value.routesVisible = data.active;
                if (routeManager) {
                    if (data.active) {
                        routeManager.show();
                    } else {
                        routeManager.hide();
                    }
                } else {
                    console.warn('⚠️ RouteManager 未初始化');
                }
                
                // 只打开/关闭航线列表，统计面板由用户手动切换
                if (data.active) {
                    // 确保数据已加载
                    await loadPortAndRouteData();
                    activePanels.value.routeList = true;
                    // 如果打开列表，关闭统计面板
                    activePanels.value.routeStatistics = false;
                } else {
                    activePanels.value.routeList = false;
                    activePanels.value.routeStatistics = false;
                }
                return;
            }
            
            // 处理海上丝绸之路 - 北极航线
            if (data.category === 'maritime_silk_road' && data.itemId === 'arctic_routes') {
                console.log('🧊 切换北极航线显示');
                if (mapContainerRef.value && mapContainerRef.value.toggleArcticRoutes) {
                    mapContainerRef.value.toggleArcticRoutes(data.active);
                }
                
                // 只打开/关闭北极航线列表，统计面板由用户手动切换
                if (data.active) {
                    activePanels.value.arcticRouteList = true;
                } else {
                    activePanels.value.arcticRouteList = false;
                    activePanels.value.arcticRouteStatistics = false;
                }
                return;
            }
            
            // 处理海洋保护区
            if (data.category === 'marine_protected_areas') {
                console.log('🗺️ 加载海洋保护区');
                if (mapContainerRef.value && mapContainerRef.value.loadMarineProtectedAreas) {
                    mapContainerRef.value.loadMarineProtectedAreas(data.active);
                }
                return;
            }
            
            // 处理海底光缆
            if (data.category === 'submarine_cables') {
                console.log('🌐 切换海底光缆显示');
                if (mapContainerRef.value && mapContainerRef.value.toggleSubmarineCables) {
                    mapContainerRef.value.toggleSubmarineCables(data.active);
                }
                
                // 只打开/关闭光缆列表，统计面板由用户手动切换
                if (data.active) {
                    activePanels.value.cableList = true;
                    // 如果打开列表，关闭统计面板
                    activePanels.value.cableStatistics = false;
                } else {
                    activePanels.value.cableList = false;
                    activePanels.value.cableStatistics = false;
                }
                return;
            }
            
            // 处理海底观测网（按国家切换）
            if (data.category === 'seafloor_observation') {
                console.log('🔬 切换海底观测网显示:', data.itemId);
                
                // 映射国家ID到中文名称
                const countryMap = {
                    'usa': '美国',
                    'eu': '欧洲',
                    'canada': '加拿大',
                    'japan': '日本',
                    'china': '中国'
                };
                
                const country = countryMap[data.itemId];
                
                if (mapContainerRef.value && mapContainerRef.value.toggleSeafloorObservation) {
                    mapContainerRef.value.toggleSeafloorObservation(data.active, country);
                }
                
                // 只打开/关闭观测网列表，统计面板由用户手动切换
                if (data.active) {
                    activePanels.value.observationList = true;
                    // 如果打开列表，关闭统计面板
                    activePanels.value.observationStatistics = false;
                } else {
                    // 检查是否所有国家都已关闭
                    const allInactive = !data.active;
                    if (allInactive) {
                        activePanels.value.observationList = false;
                        activePanels.value.observationStatistics = false;
                    }
                }
                return;
            }
            
            // 处理海洋装备
            if (data.category === 'marine_equipment') {
                console.log('🚢 切换海洋装备显示');
                if (mapContainerRef.value && mapContainerRef.value.toggleMarineEquipment) {
                    await mapContainerRef.value.toggleMarineEquipment(data.active);
                }
                
                // 只打开/关闭装备列表，统计面板由用户手动切换
                if (data.active) {
                    // 等待数据加载完成后再打开列表
                    await nextTick();
                    activePanels.value.marineEquipmentList = true;
                    // 如果打开列表，关闭统计面板
                    activePanels.value.marineEquipmentStatistics = false;
                } else {
                    activePanels.value.marineEquipmentList = false;
                    activePanels.value.marineEquipmentStatistics = false;
                }
                return;
            }
            
            // 处理主要研究机构（按国家切换）
            if (data.category === 'research_institutions') {
                console.log('🏛️ 切换研究机构显示:', data.itemId);
                
                // data.itemId 是国家ID（如 'usa', 'uk' 等）
                const countryId = data.itemId;
                
                if (mapContainerRef.value && mapContainerRef.value.toggleResearchInstitution) {
                    await mapContainerRef.value.toggleResearchInstitution(data.active, countryId);
                }
                
                // 只打开/关闭机构列表，统计面板由用户手动切换
                if (data.active) {
                    // 等待数据加载完成后再打开列表
                    await nextTick();
                    activePanels.value.researchInstitutionList = true;
                    // 如果打开列表，关闭统计面板
                    activePanels.value.researchInstitutionStatistics = false;
                } else {
                    // 检查是否所有国家都已关闭
                    const allInactive = !data.active;
                    if (allInactive) {
                        activePanels.value.researchInstitutionList = false;
                        activePanels.value.researchInstitutionStatistics = false;
                    }
                }
                return;
            }
            
            // TODO: 处理其他态势总览项目
        };
        
        /**
         * 处理港口点击事件（用于航线联动高亮）
         * @param {String} portId - 港口ID
         */
        const handlePortClick = (portId) => {
            console.log('⚓ 港口点击:', portId);
            
            // 如果航线可见，高亮显示连接该港口的航线
            if (maritimeSilkRoadState.value.routesVisible && routeManager) {
                routeManager.highlightRoutesForPort(portId);
            }
        };
        
        /**
         * 切换极地面板的显示状态
         */
        const togglePolarPanel = () => {
            activePanels.value.polarPanel = !activePanels.value.polarPanel;
            console.log('🧊 切换极地面板:', activePanels.value.polarPanel);
        };
        
        /**
         * 处理极地区域变化
         * @param {Object} regionData - 包含regionId、longitude、latitude、zoom的对象
         */
        const handlePolarRegionChange = (regionData) => {
            console.log('🟢 App.vue: handlePolarRegionChange 被调用');
            console.log('🟢 接收到的数据:', regionData);
            console.log('🟢 数据类型:', typeof regionData);
            
            // 如果传入的是对象（包含坐标信息），执行跳转
            if (regionData && typeof regionData === 'object' && regionData.longitude !== undefined) {
                const { longitude, latitude, zoom, regionId } = regionData;
                console.log('🟢 解析坐标:', { longitude, latitude, zoom, regionId });
                
                // 处理北极盆地数据加载/卸载
                if (mapContainerRef.value && mapContainerRef.value.toggleArcticBasinData) {
                    if (regionId === 'arctic') {
                        // 切换到北极时，加载北极盆地数据
                        console.log('🏔️ 切换到北极，加载北极盆地数据');
                        mapContainerRef.value.toggleArcticBasinData(true);
                    } else if (regionId === 'antarctic') {
                        // 切换到南极时，卸载北极盆地数据
                        console.log('🗑️ 切换到南极，卸载北极盆地数据');
                        mapContainerRef.value.toggleArcticBasinData(false);
                    }
                }
                
                // 调用地图跳转方法
                if (mapContainerRef.value && mapContainerRef.value.viewer) {
                    console.log('🟢 MapContainer 和 viewer 存在，准备跳转...');
                    
                    // viewer 是一个 getter 函数，需要调用它
                    const viewerGetter = mapContainerRef.value.viewer;
                    const viewer = typeof viewerGetter === 'function' ? viewerGetter() : viewerGetter;
                    
                    console.log('🟢 viewer对象:', viewer);
                    console.log('🟢 viewer.camera:', viewer?.camera);
                    
                    if (viewer && viewer.camera) {
                        try {
                            viewer.camera.flyTo({
                                destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 10000000),
                                duration: 2,
                                orientation: {
                                    heading: Cesium.Math.toRadians(0),
                                    pitch: Cesium.Math.toRadians(-90),
                                    roll: 0.0
                                }
                            });
                            console.log(`✅ 正在飞往${regionId === 'antarctic' ? '南极' : '北极'}...`);
                        } catch (error) {
                            console.error('❌ 跳转失败:', error);
                        }
                    } else {
                        console.error('❌ viewer 或 camera 不存在');
                    }
                } else {
                    console.error('❌ MapContainer 或 viewer 不存在');
                }
            } else {
                console.warn('⚠️ 接收到的数据格式不正确或缺少坐标信息');
            }
        };
        
        /**
         * 处理极地分类点击
         * @param {Object} payload - 包含category、itemId和selectedTypes的对象
         */
        const handlePolarCategoryClick = async (payload) => {
            const { category, itemId, selectedTypes } = payload;
            console.log('📂 点击的分类:', category, itemId, '已选择:', selectedTypes);
            
            // 处理南极资源筛选
            if (category === 'resource_antarctic') {
                console.log('🌍 南极资源筛选:', selectedTypes);
                
                // 保存选中的分类
                selectedResourceCategories.value = selectedTypes;
                
                try {
                    // 确保资源加载器已初始化并加载完成
                    if (mapContainerRef.value && mapContainerRef.value.loadAntarcticResources) {
                        console.log('⏳ 正在加载南极资源数据...');
                        await mapContainerRef.value.loadAntarcticResources();
                        console.log('✅ 南极资源数据加载完成');
                    } else {
                        console.error('❌ MapContainer 引用不存在或 loadAntarcticResources 方法未定义');
                        return;
                    }
                    
                    // 应用筛选
                    if (mapContainerRef.value && mapContainerRef.value.filterAntarcticResourcesByType) {
                        // 将资源分类ID映射为具体的资源类型名称
                        const resourceCategoryMap = {
                            'energy_minerals': ['石油天然气', '天然气', '煤炭'],  // 能源矿产
                            'metal_minerals': ['铁', '铜', '金', '银', '铅', '锡', '钼', '铀', '白金', '锡钴铬'],  // 金属矿产
                            'non_metal_special': ['磷', '硫黄']  // 非金属矿产及特殊资源
                        };
                        
                        // 收集所有选中分类对应的资源类型
                        let resourceNames = [];
                        selectedTypes.forEach(categoryId => {
                            const resources = resourceCategoryMap[categoryId];
                            if (resources) {
                                resourceNames = resourceNames.concat(resources);
                            }
                        });
                        
                        console.log('🔍 筛选资源类型:', resourceNames);
                        console.log('📊 资源类型数量:', resourceNames.length);
                        
                        mapContainerRef.value.filterAntarcticResourcesByType(resourceNames);
                        console.log('✅ 筛选命令已发送');
                        
                        // 只有选择了具体资源类型时才显示列表
                        // 如果没有选择任何类型（显示全部资源），则不显示列表
                        if (selectedTypes.length > 0 && mapContainerRef.value.getAntarcticResourceList) {
                            const resourceList = mapContainerRef.value.getAntarcticResourceList(resourceNames);
                            antarcticResourceList.value = resourceList;
                            antarcticResourceListVisible.value = resourceList.length > 0;
                            console.log('📋 资源列表已更新:', resourceList.length, '条');
                        } else {
                            // 没有选择任何类型，隐藏列表
                            antarcticResourceListVisible.value = false;
                            antarcticResourceList.value = [];
                            console.log('💡 未选择具体类型，隐藏列表面板');
                        }
                    } else {
                        console.error('❌ filterAntarcticResourcesByType 方法未定义');
                    }
                } catch (error) {
                    console.error('❌ 南极资源筛选失败:', error);
                }
                return;
            }
            
            // 处理北极资源筛选
            if (category === 'resource_arctic') {
                console.log('🌍 北极资源筛选:', selectedTypes);
                
                try {
                    if (mapContainerRef.value && mapContainerRef.value.toggleArcticResourceData) {
                        // 处理天然气
                        if (selectedTypes.includes('natural_gas')) {
                            console.log('⛽ 加载天然气数据');
                            await mapContainerRef.value.toggleArcticResourceData('natural_gas', true);
                        } else {
                            console.log('🗑️ 卸载天然气数据');
                            await mapContainerRef.value.toggleArcticResourceData('natural_gas', false);
                        }
                        
                        // 处理石油
                        if (selectedTypes.includes('oil')) {
                            console.log('🛢️ 加载石油数据');
                            await mapContainerRef.value.toggleArcticResourceData('oil', true);
                        } else {
                            console.log('🗑️ 卸载石油数据');
                            await mapContainerRef.value.toggleArcticResourceData('oil', false);
                        }
                        
                        // 控制图表显示：当选择了任何资源时显示新的资源图表面板和统计表格
                        if (selectedTypes.length > 0) {
                            // 显示新的资源图表面板，替换科考站统计表
                            showArcticResourceCharts.value = true;
                            // 同时显示底部的统计表格
                            activePanels.value.arcticResourceTable = true;
                            console.log('📊 显示北极资源图表面板和统计表格');
                        } else {
                            // 隐藏资源图表面板和统计表格
                            showArcticResourceCharts.value = false;
                            activePanels.value.arcticResourceTable = false;
                            console.log('❌ 隐藏北极资源图表面板和统计表格');
                        }
                        
                        console.log('✅ 北极资源数据加载完成');
                    } else {
                        console.error('❌ MapContainer 引用不存在或 toggleArcticResourceData 方法未定义');
                    }
                } catch (error) {
                    console.error('❌ 北极资源加载失败:', error);
                }
                return;
            }
            
            // 处理其他分类
            switch(category) {
                case 'research_stations':
                    togglePolarStations();
                    break;
                case 'research_equipment':
                    console.log('🔬 科考装备功能开发中...');
                    break;
                case 'sovereignty_claims':
                    // 如果点击的是南极，直接显示南极主权详情面板
                    if (itemId === 'antarctic') {
                        console.log('🇦🇶 显示南极主权详情面板');
                        activePanels.value.antarcticSovereigntyDetail = true;
                    } else if (itemId === 'arctic') {
                        // 北极暂无数据，不显示面板
                        console.log('🌊 北极主权数据开发中...');
                    } else {
                        // 其他情况显示主权主张选择面板
                        togglePolarSovereignty();
                    }
                    break;
                case 'institutional_framework':
                    console.log('⚖️ 制度框架功能开发中...');
                    break;
            }
        };
        
        /**
         * 处理科考站国家点击
         * @param {Object} payload - 包含region、countryId和selectedCountries的对象
         */
        const handleStationCountryClick = async (payload) => {
            const { region, countryId, selectedCountries } = payload;
            console.log('🏛️ 点击科考站国家:', region, countryId, '已选择:', selectedCountries);
            
            currentPolarRegion.value = region;
            
            if (mapContainerRef.value && mapContainerRef.value.loadPolarStationsByCountries) {
                // 如果没有选择任何国家，加载该区域的所有科考站但不显示列表
                const countriesToLoad = selectedCountries && selectedCountries.length > 0 
                    ? selectedCountries 
                    : null; // null表示加载全部
                
                const stations = await mapContainerRef.value.loadPolarStationsByCountries(region, countriesToLoad);
                
                // 只有选择了国家时才显示列表
                if (countriesToLoad && countriesToLoad.length > 0) {
                    polarStationList.value = stations || [];
                    polarStationListVisible.value = true;
                } else {
                    polarStationListVisible.value = false;
                    polarStationList.value = [];
                }
            }
        };
        
        /**
         * 处理科考站点击（从列表点击）
         */
        const handleStationClick = (station) => {
            console.log('🏛️ 点击科考站:', station);
            // 飞到科考站位置
            if (mapContainerRef.value && mapContainerRef.value.viewer) {
                const viewer = mapContainerRef.value.viewer();
                if (viewer && station.coordinates) {
                    const [lng, lat] = station.coordinates;
                    viewer.camera.flyTo({
                        destination: Cesium.Cartesian3.fromDegrees(lng, lat, 50000),
                        duration: 2
                    });
                }
            }
        };
        
        /**
         * 处理资源点击（从列表点击）
         */
        const handleResourceClick = (resource) => {
            console.log('💎 点击资源:', resource);
            // 飞到资源位置
            if (mapContainerRef.value && mapContainerRef.value.viewer) {
                const viewer = mapContainerRef.value.viewer();
                if (viewer && resource.coordinates) {
                    const [lng, lat] = resource.coordinates;
                    viewer.camera.flyTo({
                        destination: Cesium.Cartesian3.fromDegrees(lng, lat, 100000),
                        duration: 2
                    });
                }
            }
        };
        
        /**
         * 处理资源调查国家点击
         * @param {Object} payload - 包含selectedCountries的对象
         */
        const handleResourceSurveyCountryClick = (payload) => {
            const { selectedCountries } = payload;
            console.log('🌍 选中的资源调查国家:', selectedCountries);
            
            // 更新选中的国家列表
            selectedResourceSurveyCountries.value = selectedCountries;
            
            // 只有选择了国家时才显示面板
            resourceSurveyPanelVisible.value = selectedCountries.length > 0;
        };
        
        /**
         * 显示南极主权详情面板
         */
        const handleShowAntarcticDetail = () => {
            activePanels.value.antarcticSovereigntyDetail = true;
            console.log('🇦🇶 显示南极主权详情面板');
        };
        
        /**
         * 关闭南极主权详情面板
         */
        const handleCloseAntarcticDetail = () => {
            activePanels.value.antarcticSovereigntyDetail = false;
            // 重置主权主张面板的选中状态
            if (polarSovereigntyPanelRef.value) {
                polarSovereigntyPanelRef.value.selectedRegion = null;
            }
            console.log('🇦🇶 关闭南极主权详情面板');
        };
        
        /**
         * 处理科考船选择事件
         */
        const handleVesselSelect = (vessel) => {
            console.log('选中科考船:', vessel);
            // TODO: 实现科考船定位功能
        };
        
        /**
         * 处理地质图层切换事件
         */
        const handleGeologicalLayerToggle = (layer) => {
            console.log('🗺️ 地质图层切换:', layer);
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
        const leftPanelRef = ref(null);  // 左侧面板引用
        const shipTrackingRef = ref(null);
        const miningWeatherMonitorRef = ref(null);  // 矿区气象监测面板引用
        const routeDemoRef = ref(null);  // 航线演示面板引用
        const riskWarningRef = ref(null);  // 高风险警告组件引用
        const weatherCardRef = ref(null);  // 矿区气象信息卡片引用
        const waypointWeatherPopupRef = ref(null);  // 航点气象弹窗引用
        const experimentalMiningPanelRef = ref(null);  // 试验试采信息弹窗引用
        const coordinateCollectorRef = ref(null);  // 坐标采集面板引用
        const polarSovereigntyPanelRef = ref(null);  // 极地主权主张面板引用
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
            
            // 如果是坐标采集模式
            if (pickingPointType.value === 'coordinate_collect' && coordinateCollectorRef.value) {
                coordinateCollectorRef.value.addCoordinate(lng, lat);
                return;
            }
            
            // 航线规划选点
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
         * 处理海底光缆数据加载完成事件
         * @param {Object} data - 包含光缆数据和统计信息的对象
         */
        const handleCableDataLoaded = (data) => {
            allCableData.value = data.cableData;
            cableStatistics.value = data.statistics;
            console.log('📡 App.vue 接收到光缆数据:', {
                cableCount: data.cableData?.length,
                statistics: data.statistics
            });
        };
        
        /**
         * 处理北极航线数据加载完成事件
         * @param {Object} data - 包含航线数据和统计信息的对象
         */
        const handleArcticRouteDataLoaded = (data) => {
            allArcticRouteData.value = data.routeData;
            arcticRouteStatistics.value = data.statistics;
            console.log('🧊 App.vue 接收到北极航线数据:', {
                routeCount: data.routeData?.length,
                statistics: data.statistics
            });
        };
        
        /**
         * 处理海底观测网数据加载完成事件
         * @param {Object} data - 包含观测网数据和统计信息的对象
         */
        const handleObservationDataLoaded = (data) => {
            allObservationData.value = data.observationData;
            observationStatistics.value = data.statistics;
            console.log('🔬 App.vue 接收到海底观测网数据:', {
                observationCount: data.observationData?.length,
                statistics: data.statistics
            });
        };
        
        /**
         * 处理海洋装备数据加载完成事件
         * @param {Array} data - 海洋装备数据数组
         */
        const handleMarineEquipmentDataLoaded = (data) => {
            console.log('🚢 App.vue - handleMarineEquipmentDataLoaded 被调用');
            console.log('🚢 App.vue - 接收到的数据:', data);
            console.log('🚢 App.vue - 数据长度:', data?.length);
            allMarineEquipmentData.value = data;
            console.log('🚢 App.vue - allMarineEquipmentData 已更新:', allMarineEquipmentData.value);
        };
        
        /**
         * 处理北极航线行点击事件
         */
        const handleArcticRouteRowClick = (route) => {
            console.log('🧊 点击北极航线:', route);
            // 通知地图组件高亮该航线
            if (mapContainerRef.value) {
                mapContainerRef.value.highlightArcticRoute(route.id);
                mapContainerRef.value.flyToArcticRoute(route.id);
            }
        };
        
        /**
         * 处理北极航线重置选择事件
         */
        const handleArcticRouteResetSelection = () => {
            console.log('🧊 重置北极航线选择');
            // 通知地图组件重置高亮
            if (mapContainerRef.value) {
                mapContainerRef.value.resetArcticRouteHighlight();
            }
        };
        
        /**
         * 处理北极航线"查看全部"事件
         */
        const handleArcticRouteViewAll = () => {
            console.log('🧊 查看全部北极航线，飞行到北极视角');
            // 通知地图组件飞行到北极视角
            if (mapContainerRef.value) {
                mapContainerRef.value.resetArcticRouteHighlight();
                mapContainerRef.value.flyToArcticRoute('all');
            }
        };
        
        /**
         * 处理海底观测网行点击事件
         */
        const handleObservationRowClick = (observation) => {
            console.log('🔬 点击海底观测网:', observation);
            
            // 如果是日本的海底观测网，显示图片弹窗
            if (observation.country === '日本') {
                // 获取点击位置（这里使用屏幕中心位置，实际应该从地图获取）
                const screenCenter = {
                    x: window.innerWidth / 2,
                    y: window.innerHeight / 2
                };
                
                observationImageData.value = {
                    title: observation.name,
                    imagePath: '/src/data/日本_海底观测网.png',
                    position: screenCenter
                };
                showObservationImage.value = true;
            }
            
            // 通知地图组件高亮该观测网
            if (mapContainerRef.value) {
                mapContainerRef.value.highlightObservation(observation.id);
                mapContainerRef.value.flyToObservation(observation);
            }
        };
        
        /**
         * 关闭海底观测网图片弹窗
         */
        const closeObservationImage = () => {
            showObservationImage.value = false;
        };
        
        /**
         * 处理海底观测网重置选择事件
         */
        const handleObservationResetSelection = () => {
            console.log('🔬 重置海底观测网选择');
            // 通知地图组件重置高亮
            if (mapContainerRef.value) {
                mapContainerRef.value.resetObservationHighlight();
            }
        };
        
        /**
         * 加载港口和航线数据
         */
        const loadPortAndRouteData = async () => {
            try {
                console.log('🔄 开始加载港口和航线数据...');
                console.log('   - routeManager 存在:', !!routeManager);
                console.log('   - routeManager.allRoutes 长度:', routeManager?.allRoutes?.length || 0);
                
                // 加载港口数据
                const { getProcessedPortData, calculatePortStatistics } = await import('./utils/portDataProcessor.js');
                const portData = getProcessedPortData();
                allPortData.value = portData;
                portStatistics.value = calculatePortStatistics(portData);
                console.log('⚓ 港口数据加载完成:', {
                    portCount: portData.length,
                    statistics: portStatistics.value
                });
                
                // 加载航线数据（从 RouteManager）
                const { processRouteData, calculateRouteStatistics } = await import('./utils/routeDataProcessor.js');
                
                // 如果 routeManager 未初始化或数据未加载，尝试初始化
                if (!routeManager || !routeManager.allRoutes || routeManager.allRoutes.length === 0) {
                    console.warn('⚠️ RouteManager 数据未就绪，尝试初始化...');
                    const viewer = mapContainerRef.value?.viewer?.();
                    if (viewer) {
                        if (!routeManager) {
                            routeManager = new RouteManager(viewer);
                        }
                        await routeManager.loadAndFilterRoutes();
                        console.log('✅ RouteManager 初始化成功');
                    } else {
                        console.error('❌ Viewer 未就绪，无法初始化 RouteManager');
                        allRouteData.value = [];
                        routeStatistics.value = calculateRouteStatistics([]);
                        return;
                    }
                }
                
                if (routeManager && routeManager.allRoutes && routeManager.allRoutes.length > 0) {
                    const routeData = processRouteData(routeManager.allRoutes);
                    allRouteData.value = routeData;
                    routeStatistics.value = calculateRouteStatistics(routeData);
                    console.log('🛤️ 航线数据加载完成:', {
                        routeCount: routeData.length,
                        statistics: routeStatistics.value
                    });
                } else {
                    console.warn('⚠️ RouteManager 数据仍然为空');
                    allRouteData.value = [];
                    routeStatistics.value = calculateRouteStatistics([]);
                }
            } catch (error) {
                console.error('❌ 港口和航线数据加载失败:', error);
                // 设置空数据以避免界面错误
                allRouteData.value = [];
                routeStatistics.value = { totalCount: 0, totalLength: 0, avgLength: 0, longestRoute: null, regionDistribution: {}, trafficLevelDistribution: {}, routes: [] };
            }
        };
        
        /**
         * 处理港口行点击事件
         */
        const handlePortRowClick = (port) => {
            console.log('⚓ 点击港口:', port);
            // 通知地图组件定位到该港口
            if (mapContainerRef.value && mapContainerRef.value.flyToPort) {
                mapContainerRef.value.flyToPort(port.id);
            }
        };
        
        /**
         * 处理港口重置选择事件
         */
        const handlePortResetSelection = () => {
            console.log('⚓ 重置港口选择');
        };
        
        /**
         * 处理航线行点击事件
         */
        const handleRouteRowClick = (route) => {
            console.log('🛤️ 点击航线:', route);
            // 可以添加航线高亮逻辑
        };
        
        /**
         * 处理航线重置选择事件
         */
        const handleRouteResetSelection = () => {
            console.log('🛤️ 重置航线选择');
        };

        /**
         * 处理筛选条件变化事件
         * @param {Object} newFilters - 新的筛选条件
         * @param {Array} newFilters.minerals - 选中的矿种列表
         * @param {Array} newFilters.oceans - 选中的大洋列表
         * @param {Array} newFilters.countries - 选中的国家列表
         * @param {Array} newFilters.resources - 选中的资源类型列表
         */
        const handleFilterChange = (newFilters) => {
            filters.value = newFilters;
            console.log('🔍 App.vue 筛选条件变化:', newFilters);
            
            // 处理资源分布图层
            if (newFilters.resources && mapContainerRef.value && mapContainerRef.value.toggleResources) {
                console.log('💎 切换资源分布图层:', newFilters.resources);
                mapContainerRef.value.toggleResources(newFilters.resources);
            }
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
         * 4. 矿区管理和地质调查选项卡切换到2D模式
         * 5. 气象监测选项卡切换到3D模式
         */
        const handleTabChange = (tab) => {
            console.log('📑 切换选项卡:', tab);
            currentTab.value = tab;
            
            // 根据选项卡切换地图模式
            if (tab === '矿区管理' || tab === '地质调查') {
                // 矿区管理和地质调查：切换到2D平面模式
                if (mapContainerRef.value && mapContainerRef.value.switchTo3D) {
                    console.log('🗺️ 切换到2D平面模式');
                    mapContainerRef.value.switchTo2D();
                }
            } else if (tab === '气象监测') {
                // 气象监测：切换到3D球体模式（太平洋）
                if (mapContainerRef.value && mapContainerRef.value.switchTo3D) {
                    console.log('🌍 切换到3D球体模式（太平洋）');
                    mapContainerRef.value.switchTo3D('pacific');
                }
            } else if (tab === '极地科考') {
                // 极地科考：切换到3D球体模式（南极）
                if (mapContainerRef.value && mapContainerRef.value.switchTo3D) {
                    console.log('🧊 切换到3D球体模式（南极）');
                    mapContainerRef.value.switchTo3D('antarctic');
                }
            }
            
            // 根据选项卡切换右侧功能面板
            if (tab === '矿区管理') {
                // 矿区管理：自动打开矿区查询和图层控制，关闭气象图层
                showTimeline.value = false;
                activePanels.value = {
                    list: false,
                    mapTools: false,
                    query: true,          // 自动打开矿区查询
                    layers: false,        // 图层控制默认关闭
                    weatherLayers: false, // 关闭气象图层
                    drillingPanel: false, // 关闭钻孔面板
                    drillingStatistics: false, // 关闭钻探统计面板
                    coordinateCollector: false,
                    resourcePotential: false,
                    polarStations: false,
                    polarSovereignty: false,
                    antarcticSovereigntyDetail: false
                };
                
                // 隐藏大洋钻探图层
                if (mapContainerRef.value && mapContainerRef.value.toggleDrilling) {
                    mapContainerRef.value.toggleDrilling(false);
                }
                
                // 隐藏极地相关图层
                if (mapContainerRef.value && mapContainerRef.value.togglePolarStations) {
                    mapContainerRef.value.togglePolarStations(false);
                }
                if (mapContainerRef.value && mapContainerRef.value.toggleAntarcticResources) {
                    mapContainerRef.value.toggleAntarcticResources(false);
                }
            } else if (tab === '态势总览') {
                // 态势总览：自动打开态势总览面板
                showTimeline.value = false;
                activePanels.value = {
                    list: false,
                    mapTools: false,
                    query: false,
                    layers: false,
                    weatherLayers: false,
                    shipSearch: false,
                    routePlan: false,
                    historyTrack: false,
                    shipList: false,
                    routeWeather: false,
                    miningWeatherMonitor: false,
                    routeDemo: false,
                    areaMonitor: false,
                    geologicalSurvey: false,
                    drillingPanel: false,
                    drillingStatistics: false,
                    coordinateCollector: false,
                    resourcePotential: false,
                    polarStations: false,
                    polarSovereignty: false,
                    antarcticSovereigntyDetail: false,
                    situationOverview: true  // 自动打开态势总览面板
                };
                
                console.log('✅ 态势总览面板已打开');
                
                // 隐藏大洋钻探图层
                if (mapContainerRef.value && mapContainerRef.value.toggleDrilling) {
                    mapContainerRef.value.toggleDrilling(false);
                }
                
                // 隐藏极地相关图层
                if (mapContainerRef.value && mapContainerRef.value.togglePolarStations) {
                    mapContainerRef.value.togglePolarStations(false);
                }
                if (mapContainerRef.value && mapContainerRef.value.toggleAntarcticResources) {
                    mapContainerRef.value.toggleAntarcticResources(false);
                }
            } else if (tab === '气象监测') {
                // 气象监测：显示时间轴 + 自动打开气象图层面板，关闭矿区相关面板
                showTimeline.value = true;
                activePanels.value = {
                    list: false,
                    mapTools: false,
                    query: false,         // 关闭矿区查询
                    layers: false,        // 关闭图层控制
                    weatherLayers: true,  // 自动打开气象图层
                    shipSearch: false,    // 关闭船舶搜索
                    drillingPanel: false, // 关闭钻孔面板
                    drillingStatistics: false, // 关闭钻探统计面板
                    coordinateCollector: false,
                    resourcePotential: false,
                    polarStations: false,
                    polarSovereignty: false,
                    antarcticSovereigntyDetail: false
                };
                
                // 隐藏大洋钻探图层
                if (mapContainerRef.value && mapContainerRef.value.toggleDrilling) {
                    mapContainerRef.value.toggleDrilling(false);
                }
                
                // 隐藏极地相关图层
                if (mapContainerRef.value && mapContainerRef.value.togglePolarStations) {
                    mapContainerRef.value.togglePolarStations(false);
                }
                if (mapContainerRef.value && mapContainerRef.value.toggleAntarcticResources) {
                    mapContainerRef.value.toggleAntarcticResources(false);
                }
            } else if (tab === '船舶追踪') {
                // 船舶追踪：自动打开科考船列表
                showTimeline.value = false;
                activePanels.value = {
                    list: false,
                    mapTools: false,
                    query: false,
                    layers: false,
                    weatherLayers: false,
                    shipSearch: false,    // 默认关闭船舶搜索
                    routePlan: false,
                    historyTrack: false,
                    geologicalSurvey: false,
                    researchVesselList: true,  // 自动打开科考船列表
                    drillingPanel: false, // 关闭钻孔面板
                    drillingStatistics: false, // 关闭钻探统计面板
                    coordinateCollector: false,
                    resourcePotential: false,
                    polarStations: false,
                    polarSovereignty: false,
                    antarcticSovereigntyDetail: false
                };
                
                // 隐藏大洋钻探图层
                if (mapContainerRef.value && mapContainerRef.value.toggleDrilling) {
                    mapContainerRef.value.toggleDrilling(false);
                }
                
                // 隐藏极地相关图层
                if (mapContainerRef.value && mapContainerRef.value.togglePolarStations) {
                    mapContainerRef.value.togglePolarStations(false);
                }
                if (mapContainerRef.value && mapContainerRef.value.toggleAntarcticResources) {
                    mapContainerRef.value.toggleAntarcticResources(false);
                }
            } else if (tab === '地质调查') {
                // 地质调查：自动打开调查目录面板
                showTimeline.value = false;
                activePanels.value = {
                    list: false,
                    mapTools: false,
                    query: false,
                    layers: false,
                    weatherLayers: false,
                    shipSearch: false,
                    routePlan: false,
                    historyTrack: false,
                    shipList: false,
                    routeWeather: false,
                    miningWeatherMonitor: false,
                    routeDemo: false,
                    areaMonitor: false,
                    geologicalSurvey: true,  // 自动打开调查目录
                    drillingPanel: false,    // 关闭钻孔面板
                    drillingStatistics: false, // 关闭钻探统计面板
                    coordinateCollector: false,
                    resourcePotential: false,
                    polarStations: false,
                    polarSovereignty: false,
                    antarcticSovereigntyDetail: false
                };
                
                // 隐藏大洋钻探图层
                if (mapContainerRef.value && mapContainerRef.value.toggleDrilling) {
                    mapContainerRef.value.toggleDrilling(false);
                }
                
                // 隐藏极地相关图层
                if (mapContainerRef.value && mapContainerRef.value.togglePolarStations) {
                    mapContainerRef.value.togglePolarStations(false);
                }
                if (mapContainerRef.value && mapContainerRef.value.toggleAntarcticResources) {
                    mapContainerRef.value.toggleAntarcticResources(false);
                }
            } else if (tab === '大洋钻探') {
                // 大洋钻探：显示钻孔数据，默认选中钻孔面板按钮和钻探统计面板
                showTimeline.value = false;
                activePanels.value = {
                    list: false,
                    mapTools: false,
                    query: false,
                    layers: false,
                    weatherLayers: false,
                    shipSearch: false,
                    routePlan: false,
                    historyTrack: false,
                    shipList: false,
                    routeWeather: false,
                    miningWeatherMonitor: false,
                    routeDemo: false,
                    areaMonitor: false,
                    geologicalSurvey: false,
                    drillingPanel: true,       // 默认选中钻孔面板按钮
                    drillingStatistics: true,  // 默认打开钻探统计面板
                    coordinateCollector: false,
                    resourcePotential: false,
                    polarStations: false,
                    polarSovereignty: false,
                    antarcticSovereigntyDetail: false
                };
                
                // 显示大洋钻探图层
                if (mapContainerRef.value && mapContainerRef.value.toggleDrilling) {
                    console.log('🔵 显示大洋钻探图层');
                    mapContainerRef.value.toggleDrilling(true);
                }
                
                // 隐藏极地相关图层
                if (mapContainerRef.value && mapContainerRef.value.togglePolarStations) {
                    mapContainerRef.value.togglePolarStations(false);
                }
                if (mapContainerRef.value && mapContainerRef.value.toggleAntarcticResources) {
                    mapContainerRef.value.toggleAntarcticResources(false);
                }
            } else if (tab === '极地科考') {
                // 极地科考：自动打开资源潜力、科考站点、主权主张面板
                showTimeline.value = false;
                activePanels.value = {
                    list: false,
                    mapTools: false,
                    query: false,
                    layers: false,
                    weatherLayers: false,
                    shipSearch: false,
                    routePlan: false,
                    historyTrack: false,
                    shipList: false,
                    routeWeather: false,
                    miningWeatherMonitor: false,
                    routeDemo: false,
                    areaMonitor: false,
                    geologicalSurvey: false,
                    drillingPanel: false,
                    drillingStatistics: false,
                    coordinateCollector: false,
                    polarPanel: true,         // 自动打开极地面板
                    resourcePotential: false, // 资源潜力面板默认关闭
                    polarStations: true,      // 科考站点默认打开
                    polarSovereignty: false,  // 主权主张默认关闭（通过极地面板控制）
                    antarcticSovereigntyDetail: false
                };
                
                // 加载南极资源（但不显示，等待用户在极地面板中选择）
                if (mapContainerRef.value && mapContainerRef.value.loadAntarcticResources) {
                    console.log('🌍 预加载南极资源...');
                    mapContainerRef.value.loadAntarcticResources();
                }
                
                // 加载极地科考站
                if (mapContainerRef.value && mapContainerRef.value.loadPolarStations) {
                    console.log('🏔️ 加载极地科考站...');
                    mapContainerRef.value.loadPolarStations().then(() => {
                        // 获取国家列表用于图例显示
                        if (mapContainerRef.value.getPolarStationCountries) {
                            polarStationCountries.value = mapContainerRef.value.getPolarStationCountries();
                            console.log('🗺️ 获取科考站国家列表:', polarStationCountries.value);
                        }
                    });
                }
                
                // 显示极地科考站图层
                if (mapContainerRef.value && mapContainerRef.value.togglePolarStations) {
                    mapContainerRef.value.togglePolarStations(true);
                }
                
                // 隐藏大洋钻探图层
                if (mapContainerRef.value && mapContainerRef.value.toggleDrilling) {
                    mapContainerRef.value.toggleDrilling(false);
                }
            } else {
                // 其他选项卡：关闭所有面板
                showTimeline.value = false;
                activePanels.value = {
                    list: false,
                    mapTools: false,
                    query: false,
                    layers: false,
                    weatherLayers: false,
                    shipSearch: false,
                    routePlan: false,
                    historyTrack: false,
                    shipList: false,
                    routeWeather: false,
                    miningWeatherMonitor: false,
                    routeDemo: false,
                    areaMonitor: false,
                    geologicalSurvey: false,
                    drillingPanel: false,
                    drillingStatistics: false,
                    coordinateCollector: false,
                    resourcePotential: false,
                    polarStations: false,
                    polarSovereignty: false,
                    antarcticSovereigntyDetail: false
                };
                
                // 隐藏大洋钻探图层
                if (mapContainerRef.value && mapContainerRef.value.toggleDrilling) {
                    mapContainerRef.value.toggleDrilling(false);
                }
                
                // 隐藏极地相关图层
                if (mapContainerRef.value && mapContainerRef.value.togglePolarStations) {
                    mapContainerRef.value.togglePolarStations(false);
                }
                if (mapContainerRef.value && mapContainerRef.value.toggleAntarcticResources) {
                    mapContainerRef.value.toggleAntarcticResources(false);
                }
            }
        };

        // ==================== 生命周期钩子 ====================
        
        /**
         * 组件挂载时：
         * 1. 初始化屏幕缩放比例
         * 2. 监听窗口大小变化事件
         * 3. 初始化 RouteManager
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
            
            // 监听来自 MapContainer 的海底观测网图片弹窗事件
            window.addEventListener('showObservationImage', (event) => {
                console.log('📡 收到海底观测网图片弹窗事件:', event.detail);
                const { title, imagePath, x, y } = event.detail;
                
                observationImageData.value = {
                    title: title,
                    imagePath: imagePath,
                    position: { x, y }
                };
                showObservationImage.value = true;
            });
            
            // 等待所有组件完全挂载后再设置全局引用
            await nextTick();
            
            // 初始化 RouteManager
            const viewer = mapContainerRef.value?.viewer?.();
            if (viewer) {
                try {
                    console.log('🛤️ 初始化 RouteManager...');
                    routeManager = new RouteManager(viewer);
                    await routeManager.loadAndFilterRoutes();
                    console.log('✅ RouteManager 初始化成功');
                    
                    // 加载港口和航线数据
                    await loadPortAndRouteData();
                } catch (error) {
                    console.error('❌ RouteManager 初始化失败:', error);
                }
            } else {
                console.warn('⚠️ Viewer 未就绪，RouteManager 初始化延迟');
                // 如果 viewer 还未就绪，等待一段时间后重试
                setTimeout(async () => {
                    const viewer = mapContainerRef.value?.viewer?.();
                    if (viewer) {
                        try {
                            console.log('🛤️ 延迟初始化 RouteManager...');
                            routeManager = new RouteManager(viewer);
                            await routeManager.loadAndFilterRoutes();
                            console.log('✅ RouteManager 延迟初始化成功');
                            
                            // 加载港口和航线数据
                            await loadPortAndRouteData();
                        } catch (error) {
                            console.error('❌ RouteManager 延迟初始化失败:', error);
                        }
                    }
                }, 2000);
            }
            
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
         * 清理 RouteManager 资源
         */
        onUnmounted(() => {
            window.removeEventListener('resize', updateScale);
            
            // 关闭 WebSocket
            if (ws) {
                ws.close();
                console.log('🔌 WebSocket 已关闭');
            }
            
            // 清理 RouteManager
            if (routeManager) {
                routeManager.destroy();
                routeManager = null;
                console.log('🛤️ RouteManager 已清理');
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

        // 主题切换处理
        const handleThemeChange = (theme) => {
            console.log('🎨 主题已切换:', theme);
            currentTheme.value = theme;
            
            // 通知地图组件更新场景颜色
            if (mapContainerRef.value && mapContainerRef.value.updateTheme) {
                mapContainerRef.value.updateTheme(theme);
            }
        };
        
        /**
         * 处理显示时间线事件
         */
        const handleShowTimeline = (show) => {
            console.log('📅 显示开发规章时间线:', show);
            showDevelopmentTimeline.value = show;
        };
        
        /**
         * 关闭时间线
         */
        const handleCloseTimeline = () => {
            showDevelopmentTimeline.value = false;
        };
        
        /**
         * 处理显示采矿车面板事件
         */
        const handleShowMiningVehicle = (show) => {
            console.log('🚗 显示采矿车面板:', show);
            activePanels.value.miningVehicle = show;
        };
        
        /**
         * 处理显示技术成熟度面板事件
         */
        const handleShowTechnologyMaturity = (show) => {
            console.log('🔬 显示技术成熟度面板:', show);
            activePanels.value.technologyMaturity = show;
        };
        
        /**
         * 处理显示采矿平台面板事件
         */
        const handleShowMiningPlatform = (show) => {
            console.log('🚢 显示采矿平台面板:', show);
            activePanels.value.miningPlatform = show;
        };
        
        /**
         * 处理显示试验试采标记事件
         */
        const handleShowExperimentalMining = (show) => {
            console.log('🔴 显示试验试采标记:', show);
            
            // 通知MapContainer显示/隐藏试验试采标记
            if (mapContainerRef.value && mapContainerRef.value.toggleExperimentalMining) {
                console.log('✅ 调用 MapContainer.toggleExperimentalMining');
                mapContainerRef.value.toggleExperimentalMining(show, experimentalMiningPanelRef.value);
            } else {
                console.error('❌ MapContainer 或 toggleExperimentalMining 方法不存在');
            }
        };
        
        /**
         * 处理显示环境监测面板事件
         */
        const handleShowEnvironmentalMonitoring = () => {
            activePanels.value.environmentalMonitoring = true;
            console.log('🌊 显示环境监测面板');
        };
        
        /**
         * 关闭环境监测面板
         */
        const handleCloseEnvironmentalMonitoring = () => {
            activePanels.value.environmentalMonitoring = false;
            // 清除左侧面板中"环境监测"按钮的选中状态
            if (leftPanelRef.value && leftPanelRef.value.activeTechProgress) {
                const index = leftPanelRef.value.activeTechProgress.indexOf('环境监测');
                if (index > -1) {
                    leftPanelRef.value.activeTechProgress.splice(index, 1);
                }
            }
            console.log('🌊 关闭环境监测面板');
        };
        
        /**
         * 处理显示提升系统面板事件
         */
        const handleShowLiftingSystem = (show) => {
            console.log('⬆️ 显示提升系统面板:', show);
            activePanels.value.liftingSystem = show;
            // 同时显示/隐藏最新进展面板
            activePanels.value.latestProgress = show;
        };
        
        /**
         * 切换提升系统面板
         */
        const toggleLiftingSystem = () => {
            activePanels.value.liftingSystem = !activePanels.value.liftingSystem;
            // 同时切换最新进展面板
            activePanels.value.latestProgress = activePanels.value.liftingSystem;
        };
        
        /**
         * 切换最新进展面板
         */
        const toggleLatestProgress = () => {
            activePanels.value.latestProgress = !activePanels.value.latestProgress;
        };
        
        /**
         * 处理显示政策动态时间线事件
         */
        const handleShowPolicyDynamics = (show, countries = []) => {
            console.log('📊 显示政策动态时间线:', show, countries);
            showPolicyDynamicsTimeline.value = show;
            
            // 如果有选中的国家，使用第一个国家
            if (countries && countries.length > 0) {
                policyDynamicsCountry.value = countries[0];
            } else {
                policyDynamicsCountry.value = '美国'; // 默认美国
            }
        };
        
        /**
         * 处理关闭政策动态时间线事件
         */
        const handleClosePolicyDynamics = () => {
            console.log('❌ 关闭政策动态时间线');
            showPolicyDynamicsTimeline.value = false;
        };
        
        /**
         * 处理显示各国态度事件
         */
        const handleShowCountryAttitudes = (show) => {
            console.log('🌍 App.vue handleShowCountryAttitudes 被调用, show:', show);
            console.log('🌍 mapContainerRef.value:', mapContainerRef.value);
            console.log('🌍 toggleCountryAttitudes 方法存在:', !!mapContainerRef.value?.toggleCountryAttitudes);
            
            showCountryAttitudes.value = show;
            
            // 通知MapContainer显示/隐藏各国态度渲染
            if (mapContainerRef.value && mapContainerRef.value.toggleCountryAttitudes) {
                console.log('✅ 调用 MapContainer.toggleCountryAttitudes');
                mapContainerRef.value.toggleCountryAttitudes(show);
            } else {
                console.error('❌ MapContainer 或 toggleCountryAttitudes 方法不存在');
            }
        };
        
        /**
         * 处理关闭各国态度表格事件
         */
        const handleCloseCountryAttitudes = () => {
            console.log('❌ 关闭各国态度表格');
            showCountryAttitudes.value = false;
            
            // 同时关闭地图上的渲染
            if (mapContainerRef.value && mapContainerRef.value.toggleCountryAttitudes) {
                mapContainerRef.value.toggleCountryAttitudes(false);
            }
        };
        
        /**
         * 处理企业主体显示/隐藏
         * @param {Boolean} show - 是否显示
         */
        const handleShowEnterprise = (show) => {
            console.log('🏢 App.vue handleShowEnterprise 被调用, show:', show);
            
            activePanels.value.enterprise = show;
            
            if (show) {
                // 获取viewer
                const viewer = mapContainerRef.value?.viewer?.();
                if (!viewer) {
                    console.error('❌ 地图viewer未就绪');
                    return;
                }
                
                console.log('✅ viewer已就绪，创建企业标记');
                
                // 显示企业扩散点
                if (!enterpriseMarkerManager) {
                    enterpriseMarkerManager = new EnterpriseMarkerManager(viewer);
                }
                enterpriseMarkerManager.addEnterpriseMarkers(CHINA_ENTERPRISES);
                enterpriseMarkerManager.flyToOverview();
            } else {
                // 隐藏企业扩散点
                if (enterpriseMarkerManager) {
                    enterpriseMarkerManager.clear();
                }
            }
        };
        
        /**
         * 切换企业主体面板
         */
        const toggleEnterprise = () => {
            handleShowEnterprise(!activePanels.value.enterprise);
        };

        /**
         * 显示经济计算面板
         */
        const handleShowEconomicCalculation = () => {
            console.log('🧮 显示经济计算面板');
            showEconomicCalculation.value = true;
        };

        /**
         * 关闭经济计算面板
         */
        const handleCloseEconomicCalculation = () => {
            console.log('🧮 关闭经济计算面板');
            showEconomicCalculation.value = false;
        };

        /**
         * 显示模型对比面板
         */
        const handleShowModelComparison = () => {
            console.log('💰 显示模型对比面板');
            showModelComparison.value = true;
        };

        /**
         * 关闭模型对比面板
         */
        const handleCloseModelComparison = () => {
            console.log('💰 关闭模型对比面板');
            showModelComparison.value = false;
        };

        /**
         * 显示经济评价公式面板
         */
        const handleShowEvaluationFormula = () => {
            console.log('📊 显示经济评价公式面板');
            showEvaluationFormula.value = true;
        };

        /**
         * 关闭经济评价公式面板
         */
        const handleCloseEvaluationFormula = () => {
            console.log('📊 关闭经济评价公式面板');
            showEvaluationFormula.value = false;
        };

        /**
         * 显示可行性分析面板
         */
        const handleShowFeasibilityAnalysis = () => {
            console.log('📈 显示可行性分析面板');
            showFeasibilityAnalysis.value = true;
        };

        /**
         * 关闭可行性分析面板
         */
        const handleCloseFeasibilityAnalysis = () => {
            console.log('📈 关闭可行性分析面板');
            showFeasibilityAnalysis.value = false;
        };

        /**
         * 显示情景模拟面板
         */
        const handleShowScenarioSimulation = () => {
            console.log('🎯 显示情景模拟面板');
            showScenarioSimulation.value = true;
        };

        /**
         * 关闭情景模拟面板
         */
        const handleCloseScenarioSimulation = () => {
            console.log('🎯 关闭情景模拟面板');
            showScenarioSimulation.value = false;
        };
        
        // ==================== 多边形绘制相关 ====================
        
        const polygonDrawerRef = ref(null);
        
        /**
         * 切换区域勾面面板
         */
        const togglePolygonDrawer = () => {
            activePanels.value.polygonDrawer = !activePanels.value.polygonDrawer;
            console.log('🖊️ 切换区域勾面面板:', activePanels.value.polygonDrawer);
        };
        
        /**
         * 开始多边形绘制
         */
        const handleStartPolygonDrawing = () => {
            console.log('🖊️ 开始多边形绘制');
            if (mapContainerRef.value && mapContainerRef.value.enablePolygonDrawing) {
                mapContainerRef.value.enablePolygonDrawing();
                
                // 监听地图点击事件，更新面板顶点数
                const updatePointCount = () => {
                    if (mapContainerRef.value && mapContainerRef.value.polygonPoints && polygonDrawerRef.value) {
                        polygonDrawerRef.value.updatePointCount(mapContainerRef.value.polygonPoints.length);
                    }
                };
                
                // 使用定时器定期更新顶点数
                const intervalId = setInterval(updatePointCount, 100);
                
                // 保存intervalId以便后续清理
                if (!window._polygonDrawingInterval) {
                    window._polygonDrawingInterval = intervalId;
                }
            }
        };
        
        /**
         * 停止多边形绘制
         */
        const handleStopPolygonDrawing = () => {
            console.log('⏹️ 停止多边形绘制');
            
            // 清理定时器
            if (window._polygonDrawingInterval) {
                clearInterval(window._polygonDrawingInterval);
                window._polygonDrawingInterval = null;
            }
            
            if (mapContainerRef.value && mapContainerRef.value.disablePolygonDrawing) {
                mapContainerRef.value.disablePolygonDrawing();
                mapContainerRef.value.cancelPolygonDrawing();
            }
        };
        
        /**
         * 完成多边形绘制
         * @param {String} name - 多边形名称
         */
        const handlePolygonFinished = (name) => {
            console.log('✅ 完成多边形绘制, 名称:', name);
            
            // 清理定时器
            if (window._polygonDrawingInterval) {
                clearInterval(window._polygonDrawingInterval);
                window._polygonDrawingInterval = null;
            }
            
            if (mapContainerRef.value && mapContainerRef.value.finishPolygonDrawing) {
                const polygonData = mapContainerRef.value.finishPolygonDrawing();
                if (polygonData && polygonDrawerRef.value) {
                    // 添加名称和时间戳
                    polygonData.name = name;
                    polygonData.timestamp = new Date().toISOString();
                    polygonDrawerRef.value.addPolygon(polygonData);
                }
            }
        };
        
        /**
         * 更新多边形列表
         * @param {Array} polygons - 多边形列表
         */
        const handlePolygonsUpdated = (polygons) => {
            console.log('📊 更新多边形列表:', polygons);
            if (mapContainerRef.value && mapContainerRef.value.updatePolygons) {
                mapContainerRef.value.updatePolygons(polygons);
            }
        };

        return {
            currentTheme,
            handleThemeChange,
            currentTab,
            activePanels,
            toggleList,
            toggleMapTools,
            toggleQuery,
            toggleLayers,
            toggleWeatherLayers,
            toggleGeologicalSurvey,
            toggleDrillingPanel,
            toggleDrillingStatistics,
            toggleMiningData,
            toggleResearchVesselList,
            toggleMiningVehicle,
            toggleTechnologyMaturity,
            toggleMiningPlatform,
            handleVesselSelect,
            handleGeologicalLayerToggle,
            handleDrillingFilterChange,
            handleSelectCoreRepository,
            showManagementFramework,
            selectedManagementFrameworks,
            handleShowManagementFramework,
            handleCloseManagementFramework,
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
            leftPanelRef,
            miningWeatherMonitorRef,
            routeDemoRef,
            riskWarningRef,
            weatherCardRef,
            waypointWeatherPopupRef,
            experimentalMiningPanelRef,
            coordinateCollectorRef,
            polarSovereigntyPanelRef,
            toggleCoordinateCollector,
            handleStartCollecting,
            handleStopCollecting,
            togglePolarPanel,
            handlePolarRegionChange,
            handlePolarCategoryClick,
            handleStationCountryClick,
            handleResourceSurveyCountryClick,
            handleStationClick,
            handleResourceClick,
            polarStationListVisible,
            polarStationList,
            polarStationCountries,
            currentPolarRegion,
            antarcticResourceListVisible,
            antarcticResourceList,
            selectedResourceCategories,
            resourceSurveyPanelVisible,
            selectedResourceSurveyCountries,
            toggleResourcePotential,
            showArcticResourceCharts,
            showArcticStatisticsPanel,
            handleShowResourceCharts,
            handleCloseResourceCharts,
            handleShowArcticStatistics,
            handleCloseArcticStatistics,
            togglePolarStations,
            togglePolarSovereignty,
            polarStationCountries,
            toggleSituationOverview,
            handleSituationOverviewItemClick,
            handlePortClick,
            handleShowAntarcticDetail,
            handleCloseAntarcticDetail,
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
            handleLocateMiningArea,
            showDevelopmentTimeline,
            handleShowTimeline,
            handleCloseTimeline,
            handleShowMiningVehicle,
            handleShowTechnologyMaturity,
            handleShowMiningPlatform,
            handleShowExperimentalMining,
            handleShowEnvironmentalMonitoring,
            handleCloseEnvironmentalMonitoring,
            handleShowLiftingSystem,
            toggleLiftingSystem,
            toggleLatestProgress,
            handleShowEnterprise,
            toggleEnterprise,
            showEconomicCalculation,
            handleShowEconomicCalculation,
            handleCloseEconomicCalculation,
            showModelComparison,
            handleShowModelComparison,
            handleCloseModelComparison,
            showEvaluationFormula,
            handleShowEvaluationFormula,
            handleCloseEvaluationFormula,
            showFeasibilityAnalysis,
            handleShowFeasibilityAnalysis,
            handleCloseFeasibilityAnalysis,
            showScenarioSimulation,
            handleShowScenarioSimulation,
            handleCloseScenarioSimulation,
            showPolicyDynamicsTimeline,
            policyDynamicsCountry,
            handleShowPolicyDynamics,
            handleClosePolicyDynamics,
            showCountryAttitudes,
            handleShowCountryAttitudes,
            handleCloseCountryAttitudes,
            allCableData,
            cableStatistics,
            handleCableDataLoaded,
            toggleCableList,
            toggleCableStatistics,
            allArcticRouteData,
            arcticRouteStatistics,
            handleArcticRouteDataLoaded,
            toggleArcticRouteList,
            toggleArcticRouteStatistics,
            handleArcticRouteRowClick,
            handleArcticRouteResetSelection,
            // 港口和航线相关
            allPortData,
            portStatistics,
            handlePortRowClick,
            handlePortResetSelection,
            togglePortStatistics,
            allRouteData,
            routeStatistics,
            handleRouteRowClick,
            handleRouteResetSelection,
            toggleRouteStatistics,
            // 海底观测网相关
            allObservationData,
            observationStatistics,
            showObservationImage,
            observationImageData,
            handleObservationDataLoaded,
            handleObservationRowClick,
            handleObservationResetSelection,
            closeObservationImage,
            toggleObservationList,
            toggleObservationStatistics,
            // 北极资源表格相关
            toggleArcticResourceTable,
            // 多边形绘制相关
            polygonDrawerRef,
            togglePolygonDrawer,
            handleStartPolygonDrawing,
            handleStopPolygonDrawing,
            handlePolygonFinished,
            handlePolygonsUpdated,
            // 海洋装备相关
            allMarineEquipmentData,
            toggleMarineEquipmentStatistics,
            handleMarineEquipmentRowClick,
            handleMarineEquipmentRefresh,
            handleMarineEquipmentDataLoaded,
            // 研究机构相关
            allResearchInstitutionData,
            handleResearchInstitutionDataLoaded,
            handleResearchInstitutionRowClick,
            handleResearchInstitutionResetSelection,
            toggleResearchInstitutionStatistics
        };
    }
};
</script>

<style scoped>
/* 亮色主题背景图 */
[data-theme="light"] .app-container {
    background-image: url('/image/bg.jpg');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-attachment: fixed;
}

/* 暗色主题保持纯色背景 */
[data-theme="dark"] .app-container {
    background-image: none;
}
</style>
