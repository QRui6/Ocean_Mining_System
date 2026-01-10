<template>
    <div class="absolute inset-0 w-full h-full bg-[#020617] z-0">
        <!-- Cesium Container -->
        <div ref="cesiumContainer" class="w-full h-full"></div>

        <!-- Grid Overlay -->
        <div class="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(6,182,212,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.2)_1px,transparent_1px)] bg-[size:100px_100px] z-10"></div>

        <!-- 自定义地图工具栏 -->
        <transition name="toolbar-slide">
            <div v-if="showToolbar" class="absolute top-[10rem] right-[15.5rem] z-[100] flex flex-col gap-2 pointer-events-auto">
                <!-- 放大 -->
                <button @click="zoomIn" class="map-tool-btn group" title="放大">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"/>
                    </svg>
                </button>
                
                <!-- 缩小 -->
                <button @click="zoomOut" class="map-tool-btn group" title="缩小">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"/>
                    </svg>
                </button>
                
                <!-- 复位视角 -->
                <button @click="resetView" class="map-tool-btn group" title="复位视角">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                    </svg>
                </button>
                
                <!-- 2D/3D 切换 -->
                <button @click="toggle2D3D" class="map-tool-btn group" :title="is3D ? '切换至2D' : '切换至3D'">
                    <svg v-if="is3D" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                    </svg>
                    <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
                    </svg>
                </button>
                
                <!-- 全屏 -->
                <button @click="toggleFullscreen" class="map-tool-btn group" title="全屏">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                    </svg>
                </button>
            </div>
        </transition>

        <!-- Info Window Modal -->
        <transition enter-active-class="animate-fadeIn" leave-active-class="transition-opacity duration-200 opacity-0">
            <div v-if="selectedArea" 
                :style="{ 
                    left: infoPosition.x + 'px', 
                    top: infoPosition.y + 'px' 
                }"
                class="absolute w-[20rem] bg-slate-950/90 backdrop-blur-xl border-2 border-cyan-500/50 text-white shadow-[0_0_40px_rgba(0,0,0,0.8)] z-50" 
                style="clip-path: polygon(0 0, 100% 0, 100% 92%, 92% 100%, 0 100%)">
                <!-- Scanning Line -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-pulse"></div>

                <!-- Header -->
                <div class="flex items-center justify-between bg-gradient-to-r from-cyan-900/60 to-transparent px-4 py-3 border-b border-cyan-500/30">
                    <div class="flex items-center gap-3">
                         <div class="w-2 h-2 bg-yellow-400 rotate-45 shadow-[0_0_6px_#facc15]"></div>
                         <span class="font-bold text-lg text-white tracking-wide font-['Noto_Sans_SC']">矿区信息</span>
                    </div>
                    <button @click="closeInfo" class="group p-1">
                        <div class="w-6 h-6 border border-cyan-500/50 flex items-center justify-center rounded-sm group-hover:bg-cyan-500 group-hover:text-black transition-colors text-sm">✕</div>
                    </button>
                </div>
                
                <!-- Content -->
                <div class="p-4 space-y-3 relative">
                    <div class="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                    
                    <div v-for="(val, key) in {
                        'ID': selectedArea.id,
                        '承包者': selectedArea.contractor,
                        '担保国': selectedArea.sponsor,
                        '矿种类型': selectedArea.mineral,
                        '矿区位置': selectedArea.location,
                        '合同期限': selectedArea.dateRange,
                        '合同区面积': selectedArea.area
                    }" :key="key" class="relative flex justify-between items-center border-b border-slate-700/50 pb-2 last:border-0 group hover:bg-white/5 px-2 rounded transition-colors">
                        <span class="text-cyan-300/80 text-sm font-medium">{{ key }}</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide text-right max-w-[60%] truncate" :title="val">{{ val }}</span>
                    </div>
                </div>
            </div>
        </transition>

        <!-- Ship Info Window Modal -->
        <transition enter-active-class="animate-fadeIn" leave-active-class="transition-opacity duration-200 opacity-0">
            <div v-if="selectedShip" 
                :style="{ 
                    left: shipInfoPosition.x + 'px', 
                    top: shipInfoPosition.y + 'px' 
                }"
                class="absolute w-[22rem] bg-slate-950/95 backdrop-blur-xl border-2 border-yellow-500/50 text-white shadow-[0_0_40px_rgba(0,0,0,0.8)] z-50" 
                style="clip-path: polygon(0 0, 100% 0, 100% 92%, 92% 100%, 0 100%)">
                <!-- Scanning Line -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>

                <!-- Header -->
                <div class="flex items-center justify-between bg-gradient-to-r from-yellow-900/60 to-transparent px-4 py-3 border-b border-yellow-500/30">
                    <div class="flex items-center gap-3">
                         <div class="w-2 h-2 bg-cyan-400 rotate-45 shadow-[0_0_6px_#22d3ee]"></div>
                         <span class="font-bold text-lg text-white tracking-wide font-['Noto_Sans_SC']">🚢 船舶信息</span>
                    </div>
                    <button @click="closeShipInfo" class="group p-1">
                        <div class="w-6 h-6 border border-yellow-500/50 flex items-center justify-center rounded-sm group-hover:bg-yellow-500 group-hover:text-black transition-colors text-sm">✕</div>
                    </button>
                </div>
                
                <!-- Content -->
                <div class="p-4 space-y-3 relative">
                    <div class="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                    
                    <!-- 船舶名称 -->
                    <div class="flex justify-between items-center py-2 border-b border-yellow-500/20 relative z-10">
                        <span class="text-yellow-400/80 font-['Rajdhani'] text-sm tracking-wider">船舶名称</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide text-right max-w-[60%] truncate">
                            {{ selectedShip.ship_cnname || selectedShip.ship_name }}
                        </span>
                    </div>
                    
                    <!-- 船舶类型 -->
                    <div class="flex justify-between items-center py-2 border-b border-yellow-500/20 relative z-10">
                        <span class="text-yellow-400/80 font-['Rajdhani'] text-sm tracking-wider">船舶类型</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide">
                            {{ getShipTypeName(selectedShip.ship_type) }}
                        </span>
                    </div>
                    
                    <!-- 船长 -->
                    <div class="flex justify-between items-center py-2 border-b border-yellow-500/20 relative z-10">
                        <span class="text-yellow-400/80 font-['Rajdhani'] text-sm tracking-wider">船长</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide">
                            {{ selectedShip.length ? selectedShip.length + 'm' : 'N/A' }}
                        </span>
                    </div>
                    
                    <!-- 船宽 -->
                    <div class="flex justify-between items-center py-2 border-b border-yellow-500/20 relative z-10">
                        <span class="text-yellow-400/80 font-['Rajdhani'] text-sm tracking-wider">船宽</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide">
                            {{ selectedShip.width ? selectedShip.width + 'm' : 'N/A' }}
                        </span>
                    </div>
                    
                    <!-- 航速 -->
                    <div class="flex justify-between items-center py-2 border-b border-yellow-500/20 relative z-10">
                        <span class="text-yellow-400/80 font-['Rajdhani'] text-sm tracking-wider">航速</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide">
                            {{ selectedShip.sog ? selectedShip.sog + ' kn' : 'N/A' }}
                        </span>
                    </div>
                    
                    <!-- 载重 -->
                    <div class="flex justify-between items-center py-2 border-b border-yellow-500/20 relative z-10">
                        <span class="text-yellow-400/80 font-['Rajdhani'] text-sm tracking-wider">载重</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide">
                            {{ selectedShip.draught ? selectedShip.draught + 'm' : 'N/A' }}
                        </span>
                    </div>
                    
                    <!-- 目的港 -->
                    <div class="flex justify-between items-center py-2 border-b border-yellow-500/20 relative z-10">
                        <span class="text-yellow-400/80 font-['Rajdhani'] text-sm tracking-wider">目的港</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide text-right max-w-[60%] truncate">
                            {{ selectedShip.dest || 'N/A' }}
                        </span>
                    </div>
                    
                    <!-- 预计到达 - 带过期提示 -->
                    <div class="flex justify-between items-center py-2 border-b border-yellow-500/20 relative z-10">
                        <span class="text-yellow-400/80 font-['Rajdhani'] text-sm tracking-wider">预计到达</span>
                        <div class="text-right">
                            <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide">
                                {{ selectedShip.eta || 'N/A' }}
                            </span>
                            <div v-if="isEtaExpired(selectedShip.eta, selectedShip.last_time)" class="text-xs text-orange-400 mt-0.5">
                                ⚠️ 已过期
                            </div>
                        </div>
                    </div>
                    
                    <!-- 最后更新 -->
                    <div class="flex justify-between items-center py-2 border-b border-yellow-500/20 relative z-10">
                        <span class="text-yellow-400/80 font-['Rajdhani'] text-sm tracking-wider">最后更新</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide">
                            {{ selectedShip.last_time || 'N/A' }}
                        </span>
                    </div>
                    
                    <!-- 状态 -->
                    <div class="flex justify-between items-center py-2 relative z-10">
                        <span class="text-yellow-400/80 font-['Rajdhani'] text-sm tracking-wider">状态</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide">
                            {{ getNavigationStatus(selectedShip.navistat) }}
                        </span>
                    </div>
                </div>
            </div>
        </transition>
        
        <!-- Weather Info Window Modal -->
        <transition enter-active-class="animate-fadeIn" leave-active-class="transition-opacity duration-200 opacity-0">
            <div v-if="selectedWeather" 
                :style="{ 
                    left: weatherInfoPosition.x + 'px', 
                    top: weatherInfoPosition.y + 'px' 
                }"
                class="absolute w-[22rem] bg-slate-950/95 backdrop-blur-xl border-2 border-cyan-500/50 text-white shadow-[0_0_40px_rgba(0,0,0,0.8)] z-50" 
                style="clip-path: polygon(0 0, 100% 0, 100% 92%, 92% 100%, 0 100%)">
                <!-- Scanning Line -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>

                <!-- Header -->
                <div class="flex items-center justify-between bg-gradient-to-r from-cyan-900/60 to-transparent px-4 py-3 border-b border-cyan-500/30">
                    <div class="flex items-center gap-3">
                         <div class="w-2 h-2 bg-cyan-400 rotate-45 shadow-[0_0_6px_#22d3ee]"></div>
                         <span class="font-bold text-lg text-white tracking-wide font-['Noto_Sans_SC']">{{ selectedWeather.title }}</span>
                    </div>
                    <button @click="closeWeatherInfo" class="group p-1">
                        <div class="w-6 h-6 border border-cyan-500/50 flex items-center justify-center rounded-sm group-hover:bg-cyan-500 group-hover:text-black transition-colors text-sm">✕</div>
                    </button>
                </div>
                
                <!-- Content -->
                <div class="p-4 space-y-3 relative">
                    <div class="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                    
                    <div v-for="item in selectedWeather.items" :key="item.label" class="flex justify-between items-center py-2 border-b border-cyan-500/20 relative z-10">
                        <span class="text-cyan-400/80 font-['Rajdhani'] text-sm tracking-wider">{{ item.label }}</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide">{{ item.value }}</span>
                    </div>
                </div>
            </div>
        </transition>
        
        <!-- 路径规划面板 -->
        <RoutePlanPanel 
            :show="showRoutePlan"
            @close="showRoutePlan = false"
            @routePlanned="handleRoutePlanned"
            @routeCleared="handleRouteCleared"
            @pickPoint="handlePickPoint"
            @thresholdsChanged="handleThresholdsChanged"
        />
        
        <!-- 气象点查询 -->
        <WeatherPointPicker
            :pickedPoint="weatherPickedPoint"
            :currentLayer="currentWeatherLayer"
            :weatherData="weatherDataCache"
            :timeSteps="weatherTimeSteps"
            :currentTimeIndex="currentTimeIndex"
            @close="closeWeatherPicker"
        />
    </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { loadGeoJson } from '../utils/geoJsonLoader.js';
import { getContractorColor } from '../utils/contractorColors.js';
// 使用官方 cesium-wind-layer 插件
import { loadGlobalWindData } from '../utils/windDataLoader.js';
import { loadGlobalWaveData } from '../utils/waveDataLoader.js';
import { loadGlobalOceanCurrentData } from '../utils/oceanCurrentLoader.js';
import { loadGlobalInternalWaveData } from '../utils/internalWaveLoader.js';
// 使用 Cesium 原生热力图层（性能更好，效果更平滑）
import { CesiumHeatmapLayer as HeatmapLayer } from '../utils/cesiumHeatmapLayer.js';
// 旧的 Canvas 实现（已弃用）
// import { HeatmapLayer } from '../utils/heatmapLayer.js';
import { ShipTrajectoryLayer, sampleTrajectories } from '../utils/shipTrajectory.js';
import { ShipLayer } from '../utils/shipLayer.js';
import { RouteLayer } from '../utils/routeLayer.js';
import { RouteWeatherLayer } from '../utils/routeWeatherLayer.js';
import { OpenWeatherMapLayerManager } from '../utils/openWeatherMapLayer.js';
import { WindyLayerManager } from '../utils/windyLayer.js';
import RoutePlanPanel from './RoutePlanPanel.vue';
import WeatherPointPicker from './WeatherPointPicker.vue';

export default {
    components: {
        RoutePlanPanel,
        WeatherPointPicker
    },
    props: {
        showToolbar: {
            type: Boolean,
            default: false
        },
        filters: {
            type: Object,
            default: () => ({
                minerals: [],
                oceans: [],
                countries: []
            })
        },
        // 左侧图层控制的当前状态（用于控制风场等专题图层）
        layerState: {
            type: Array,
            default: () => []
        },
        // 气象图层控制的当前状态
        weatherLayerState: {
            type: Array,
            default: () => []
        },
        // 船舶定位请求
        shipToLocate: {
            type: Object,
            default: null
        },
        // 路径绘制请求
        routeToDraw: {
            type: Object,
            default: null
        },
        // 历史轨迹绘制请求
        trackToDraw: {
            type: Object,
            default: null
        },
        // 航线气象分析请求
        routeWeatherRequest: {
            type: Object,
            default: null
        },
        // 气象筛选条件
        weatherFilter: {
            type: Object,
            default: null
        },
        // 地图选点类型
        pickingPointType: {
            type: String,
            default: null
        }
    },
    emits: ['dataLoaded', 'weatherDataLoaded', 'pointPicked'],
    setup(props, { emit }) {
        const cesiumContainer = ref(null);
        const selectedArea = ref(null);
        const infoPosition = ref({ x: 0, y: 0 });
        let viewer = null;
        let dataSource = null; // GeoJSON 数据源
        let clickHandler = null; // 点击事件处理器
        const is3D = ref(true);
        let allEntities = []; // 存储所有实体
        let previousEntity = null; // 存储上一个选中的实体
        let windLayer = null; // 风场图层实例
        const showWind = ref(false); // 风场显示状态
        let waveLayer = null; // 波浪图层实例
        let waveHeatmap = null; // 波浪热力图实例
        const showWave = ref(false); // 波浪显示状态
        let oceanCurrentLayer = null; // 洋流图层实例
        let oceanCurrentHeatmap = null; // 洋流热力图实例
        const showOceanCurrent = ref(false); // 洋流显示状态
        let internalWaveLayer = null; // 内波图层实例
        const showInternalWave = ref(false); // 内波显示状态
        let trajectoryLayer = null; // 轨迹图层实例
        const showTrajectory = ref(false); // 轨迹显示状态
        const selectedShip = ref(null); // 选中的船舶信息
        const shipInfoPosition = ref({ x: 0, y: 0 }); // 船舶信息窗口位置
        const selectedWeather = ref(null); // 选中的气象信息
        const weatherInfoPosition = ref({ x: 0, y: 0 }); // 气象信息窗口位置
        let shipLayer = null; // 船舶图层实例
        const showRoutePlan = ref(false); // 路径规划面板显示状态
        let routeLayer = null; // 航线图层实例
        let routeWeatherLayer = null; // 航线气象图层实例
        let pickPointMarkers = { 
            start: null, 
            end: null,
            avoid: [],      // 避让点标记数组
            through: []     // 途经点标记数组
        }; // 选点标记
        
        // 气象点查询相关
        const weatherPickedPoint = ref(null);  // 选中的气象查询点
        const currentWeatherLayer = ref(null); // 当前激活的气象图层
        const weatherDataCache = ref({});      // 气象数据缓存
        const weatherTimeSteps = ref([]);      // 时间步长数组
        const currentTimeIndex = ref(0);       // 当前时间索引
        let owmLayerManager = null; // OpenWeatherMap 图层管理器
        let windyLayerManager = null; // Windy 图层管理器
        // 天地图 Token
        const TDT_TOKEN = "2ddaabf906d4b5418aed0078e1657029";

        const initCesium = async () => {
            viewer = new Cesium.Viewer(cesiumContainer.value, {
                animation: false,
                timeline: false,
                geocoder: false,
                homeButton: false,
                sceneModePicker: false,
                baseLayerPicker: false,
                navigationHelpButton: false,
                fullscreenButton: false,
                vrButton: false,
                infoBox: false,
                selectionIndicator: false,
                imageryProvider: false,  // 先不加载任何底图
                sceneMode: Cesium.SceneMode.SCENE3D,
                contextOptions: {
                    webgl: {
                        alpha: false,  // 禁用透明度以提升性能
                        depth: true,
                        stencil: true,
                        antialias: true,
                        powerPreference: "high-performance"
                    }
                }
            });
            
            // 动态选择天地图服务器（0-7）
            const serverIndex = Math.floor(Math.random() * 8);
            
            // 添加天地图影像图层
            viewer.imageryLayers.addImageryProvider(
                new Cesium.WebMapTileServiceImageryProvider({
                    url: `https://t${serverIndex}.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=${TDT_TOKEN}`,
                    layer: "img",
                    style: "default",
                    format: "tiles",
                    tileMatrixSetID: "w",
                    credit: new Cesium.Credit("天地图"),
                    maximumLevel: 18
                })
            );

            // 添加天地图注记图层
            viewer.imageryLayers.addImageryProvider(
                new Cesium.WebMapTileServiceImageryProvider({
                    url: `https://t${serverIndex}.tianditu.gov.cn/cia_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cia&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=${TDT_TOKEN}`,
                    layer: "cia",
                    style: "default",
                    format: "tiles",
                    tileMatrixSetID: "w",
                    credit: new Cesium.Credit("天地图注记"),
                    maximumLevel: 18
                })
            );

            // 场景优化
            viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#020617');
            viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#000000');
            viewer.scene.skyAtmosphere.show = true;
            viewer.scene.skyAtmosphere.hueShift = -0.1;
            viewer.scene.globe.enableLighting = false;
            viewer.scene.globe.showGroundAtmosphere = false;
            viewer.scene.fog.enabled = false;
            viewer.scene.sun.show = false;
            viewer.scene.moon.show = false;
            viewer.scene.skyBox.show = true;
            
            viewer._cesiumWidget._creditContainer.style.display = "none";

            // 设置初始视角
            viewer.camera.setView({
                destination: Cesium.Cartesian3.fromDegrees(-140.0, 10.0, 15000000),
                orientation: {
                    heading: 0,
                    pitch: Cesium.Math.toRadians(-90),
                    roll: 0
                }
            });

            // 加载 GeoJSON 数据
            loadMiningData();
            
            // 初始化船舶图层
            shipLayer = new ShipLayer(viewer);
            console.log('🚢 船舶图层初始化完成');
            
            // 初始化航线图层
            routeLayer = new RouteLayer(viewer);
            console.log('🗺️ 航线图层初始化完成');
            
            // 初始化航线气象图层
            routeWeatherLayer = new RouteWeatherLayer(viewer);
            console.log('🌦️ 航线气象图层初始化完成');
            
            // 初始化 OpenWeatherMap 图层管理器
            owmLayerManager = new OpenWeatherMapLayerManager(viewer);
            console.log('🌍 OpenWeatherMap 图层管理器初始化完成');
            
            // 初始化 Windy 图层管理器
            windyLayerManager = new WindyLayerManager(viewer);
            console.log('🌪️ Windy 图层管理器初始化完成');

            // 预加载所有气象数据（不渲染图层，只缓存数据）
            preloadWeatherData();

            // 注释掉自动加载风场，改为手动点击按钮加载
            // updateWindVisibility(props.layerState);
        };


        // 加载海洋采矿数据（简化版）
        const loadMiningData = async () => {
            try {
                console.log('🔄 开始加载 GeoJSON 数据...');
                
                // 使用工具函数加载（推荐）
                dataSource = await loadGeoJson(viewer, '/data/ocean_mining_final.geojson', {
                    strokeColor: Cesium.Color.WHITE,
                    fillColor: Cesium.Color.RED.withAlpha(0.5),
                    strokeWidth: 2,
                    clampToGround: false
                });

                const entities = dataSource.entities.values;
                console.log(`✅ 加载了 ${entities.length} 个矿区`);

                // 提取所有唯一的国家
                const countries = new Set();

                // 根据承包者设置官方图例颜色
                entities.forEach(entity => {
                    if (entity.polygon && entity.properties) {
                        // 获取承包者名称
                        const contractor = entity.properties.contractor?.getValue() || 
                                         entity.properties.承包者?.getValue() || 
                                         entity.properties.CONTRACTOR?.getValue() || 
                                         '未知';
                        
                        // 获取对应的官方颜色
                        const colorHex = getContractorColor(contractor);
                        const color = Cesium.Color.fromCssColorString(colorHex);
                        
                        // 设置颜色
                        entity.polygon.material = color.withAlpha(0.8);
                        
                        // 设置边框
                        entity.polygon.outline = true;
                        entity.polygon.outlineColor = Cesium.Color.WHITE.withAlpha(0.9);
                        entity.polygon.outlineWidth = 1;
                        
                        // 存储原始颜色用于筛选
                        entity._originalColor = color;
                        entity._originalOutlineWidth = 1;
                        
                        // 提取国家（从 sponsor 字段）
                        const sponsor = entity.properties.sponsor?.getValue();
                        if (sponsor) {
                            countries.add(sponsor);
                        }
                    }
                });
                
                allEntities = entities;
                
                console.log('🎨 已应用官方图例配色方案');
                console.log('📊 提取到的国家:', Array.from(countries).sort());
                
                // 提取矿区数据用于表格显示
                const miningData = entities.map((entity, index) => {
                    if (!entity.properties) return null;
                    
                    return {
                        id: entity.properties.id?.getValue() || `area-${index}`,
                        contractor: entity.properties.contractor?.getValue() || '未知',
                        sponsor: entity.properties.sponsor?.getValue() || '未知',
                        mineral: entity.properties.mineral?.getValue() || '未知',
                        location: entity.properties.location?.getValue() || '未知',
                        dateRange: entity.properties.date_range?.getValue() || '未知',
                        area: entity.properties.area_km2?.getValue() || 0
                    };
                }).filter(item => item !== null);
                
                console.log('📋 提取到的矿区数据:', miningData.length, '条');
                
                // 发送数据给父组件(包含区域统计)
                const regionCounts = calculateRegionCounts(entities);
                emit('dataLoaded', {
                    countries: Array.from(countries).sort(),
                    miningData: miningData,
                    regionCounts: regionCounts
                });

                // 改进的点击事件处理（修正 CSS scale 导致的坐标偏差）
                const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
                handler.setInputAction((click) => {
                    // 计算 CSS scale 缩放比例（App.vue 中的缩放）
                    const baseWidth = 1920;
                    const baseHeight = 1080;
                    const scaleX = window.innerWidth / baseWidth;
                    const scaleY = window.innerHeight / baseHeight;
                    
                    // 修正点击坐标（除以缩放比例）
                    const correctedPosition = new Cesium.Cartesian2(
                        click.position.x / scaleX,
                        click.position.y / scaleY
                    );
                    
                    // 如果正在选点（路径规划），不处理其他点击
                    if (props.pickingPointType) {
                        return;
                    }
                    
                    // 如果有激活的气象图层，优先处理气象查询
                    if (showWind.value || showWave.value || showOceanCurrent.value || showInternalWave.value) {
                        // 检查是否点击到了实体（矿区、船舶等）- 使用修正后的坐标
                        const pickedObject = viewer.scene.pick(correctedPosition);
                        
                        // 如果没有点击到实体，或者点击的是气象相关的实体，则进行气象查询
                        if (!pickedObject || 
                            (pickedObject.id && pickedObject.id.id && pickedObject.id.id.startsWith('weather_'))) {
                            // 传递原始坐标、修正后的坐标和缩放比例
                            handleWeatherPointClick(click.position, correctedPosition, scaleX, scaleY);
                            return;
                        }
                        // 如果点击到了其他实体（矿区、船舶），继续下面的处理
                    }
                    
                    // 恢复上一个选中实体的样式
                    if (previousEntity && previousEntity.polygon && previousEntity._originalColor) {
                        previousEntity.polygon.material = previousEntity._originalColor.withAlpha(0.8);
                        previousEntity.polygon.outlineColor = Cesium.Color.WHITE.withAlpha(0.9);
                        previousEntity.polygon.outlineWidth = 1;
                    }
                    
                    console.log('🔍 缩放比例:', { scaleX, scaleY });
                    console.log('🖱️ 原始点击坐标:', click.position);
                    console.log('✅ 修正后坐标:', correctedPosition);
                    
                    // 使用修正后的坐标拾取实体
                    const pickedObject = viewer.scene.pick(correctedPosition);
                    
                    console.log('🎯 拾取到的对象:', pickedObject);
                    console.log('   - 是否定义:', Cesium.defined(pickedObject));
                    console.log('   - 是否有 id:', pickedObject?.id);
                    console.log('   - id 类型:', pickedObject?.id?.constructor?.name);
                    
                    // 检查是否点击了船舶或气象标记
                    if (Cesium.defined(pickedObject) && pickedObject.id) {
                        const entity = pickedObject.id;
                        
                        console.log('📦 实体详情:');
                        console.log('   - id:', entity.id);
                        console.log('   - name:', entity.name);
                        console.log('   - 有 billboard:', !!entity.billboard);
                        console.log('   - 有 polygon:', !!entity.polygon);
                        console.log('   - 有 properties:', !!entity.properties);
                        
                        // 如果点击的是气象标记
                        if (entity.id && entity.id.startsWith('weather_marker_')) {
                            console.log('🌦️ 点击了气象标记:', entity.id);
                            
                            // 从 entity 上直接读取存储的数据
                            const weatherData = {
                                weather: entity._weatherData,
                                risk: entity._riskData
                            };
                            
                            console.log('📦 气象数据:', weatherData);
                            
                            if (!weatherData.weather || !weatherData.risk) {
                                console.error('❌ 气象数据不存在');
                                return;
                            }
                            
                            const details = routeWeatherLayer.showWeatherDetails(weatherData);
                            
                            // 关闭船舶信息窗口
                            selectedShip.value = null;
                            
                            // 显示气象详情窗口
                            selectedWeather.value = details;
                            weatherInfoPosition.value = {
                                x: Math.min(click.position.x + 20, window.innerWidth - 370),
                                y: Math.max(click.position.y - 100, 10)
                            };
                            
                            console.log('✅ 显示气象详情:', details);
                            return;
                        }
                        
                        // 如果点击的是船舶（检查 id 是否以 ship_ 开头）
                        if (entity.id && entity.id.startsWith('ship_') && entity.billboard) {
                            console.log('🚢 点击了船舶:', entity.id);
                            
                            // 从 shipLayer 获取船舶信息（根据API实际返回字段）
                            if (shipLayer && entity.properties) {
                                const props = entity.properties;
                                // 直接传递所有原始字段，让模板处理显示
                                const shipInfo = {
                                    mmsi: props.mmsi,
                                    imo: props.imo,
                                    call_sign: props.call_sign,
                                    ship_name: props.ship_name,
                                    ship_cnname: props.ship_cnname,
                                    ship_type: props.ship_type,
                                    length: props.length,
                                    width: props.width,
                                    draught: props.draught,
                                    sog: props.sog,
                                    cog: props.cog,
                                    hdg: props.hdg,
                                    navistat: props.navistat,
                                    dest: props.dest,
                                    destcode: props.destcode,
                                    eta: props.eta,
                                    last_time: props.last_time,
                                    lat: props.lat,
                                    lng: props.lng
                                };
                                
                                // 显示船舶信息
                                selectedShip.value = shipInfo;
                                shipInfoPosition.value = {
                                    x: Math.min(click.position.x + 20, window.innerWidth - 370),
                                    y: Math.max(click.position.y - 100, 10)
                                };
                                
                                console.log('✅ 显示船舶信息:', shipInfo);
                            }
                            return;  // 不继续处理矿区点击
                        }
                        
                        // 如果点击的是轨迹船舶（有 billboard 且 name 以 ship_ 开头）
                        if (entity.billboard && entity.name && entity.name.startsWith('ship_')) {
                            console.log('🚢 点击了轨迹船舶:', entity.name);
                            
                            // 查找对应的轨迹
                            if (trajectoryLayer) {
                                const trajectory = trajectoryLayer.trajectories.find(traj => {
                                    return traj.ship === entity;
                                });
                                
                                if (trajectory && trajectory.data.shipInfo) {
                                    // 暂停动画
                                    trajectoryLayer.isPaused = true;
                                    
                                    // 显示船舶信息
                                    selectedShip.value = trajectory.data.shipInfo;
                                    shipInfoPosition.value = {
                                        x: Math.min(click.position.x + 20, window.innerWidth - 370),
                                        y: Math.max(click.position.y - 100, 10)
                                    };
                                    
                                    console.log('✅ 显示轨迹船舶信息:', trajectory.data.shipInfo);
                                }
                            }
                            return;  // 不继续处理矿区点击
                        }
                    }
                    
                    if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.polygon) {
                        const entity = pickedObject.id;
                        previousEntity = entity;
                        
                        // 高亮选中的实体（增强效果：更亮的颜色 + 青色发光边框）
                        // 方案1: 让原色更亮（提高亮度）
                        const brightColor = entity._originalColor.brighten(0.3, new Cesium.Color());
                        entity.polygon.material = brightColor.withAlpha(1.0);
                        
                        // 方案2: 青色发光边框
                        entity.polygon.outlineColor = Cesium.Color.CYAN;
                        entity.polygon.outlineWidth = 6;
                        
                        // 获取属性
                        const props = {};
                        if (entity.properties) {
                            entity.properties.propertyNames.forEach(name => {
                                props[name] = entity.properties[name]?.getValue();
                            });
                        }
                        
                        console.log('✅ 点击成功:', props);
                        
                        // 计算信息面板位置（点击位置作为左上角）
                        const panelWidth = 320; // 20rem = 320px
                        const panelHeight = 280; // 估计高度
                        const margin = 10; // 容器边缘安全距离
                        
                        // 使用原始屏幕坐标
                        const containerWidth = window.innerWidth;
                        const containerHeight = window.innerHeight;
                        
                        // 默认：点击位置作为面板左上角
                        let x = click.position.x;
                        let y = click.position.y;
                        
                        // 边界检测：防止超出右边界
                        if (x + panelWidth > containerWidth - margin) {
                            x = containerWidth - panelWidth - margin;
                        }
                        
                        // 边界检测：防止超出下边界
                        if (y + panelHeight > containerHeight - margin) {
                            y = containerHeight - panelHeight - margin;
                        }
                        
                        // 边界检测：防止超出左边界
                        if (x < margin) {
                            x = margin;
                        }
                        
                        // 边界检测：防止超出上边界
                        if (y < margin) {
                            y = margin;
                        }
                        
                        console.log('📍 面板位置:', { 
                            x, y, 
                            originalClickX: click.position.x,
                            originalClickY: click.position.y,
                            scale: { scaleX, scaleY }
                        });
                        
                        infoPosition.value = { x, y };
                        
                        // 显示信息（使用正确的字段名）
                        selectedArea.value = {
                            id: props.id || '未知',
                            contractor: props.contractor || '未知',
                            sponsor: props.sponsor || '未知',
                            mineral: props.mineral || '未知',
                            location: props.location || '未知',
                            dateRange: props.date_range || '未知',
                            area: props.area_km2 ? `${props.area_km2.toLocaleString()} km²` : '未知'
                        };
                        
                        // 强制渲染
                        viewer.scene.requestRender();
                    } else {
                        // 点击空白处，关闭信息面板
                        selectedArea.value = null;
                        console.log('❌ 未点击到矿区，修正后坐标:', correctedPosition);
                    }
                }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
                
                clickHandler = handler;

                // 延迟1.5秒后，飞到太平洋矿区（适中高度，展示矿区全貌）
                setTimeout(() => {
                    viewer.camera.flyTo({
                        destination: Cesium.Cartesian3.fromDegrees(-140.0, 10.0, 12000000),
                        orientation: {
                            heading: 0,
                            pitch: Cesium.Math.toRadians(-90),
                            roll: 0
                        },
                        duration: 3,
                        easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT
                    });
                }, 1500);
                
            } catch (error) {
                console.error('❌ 加载失败:', error);
            }
        };

        const closeInfo = () => {
            // 恢复上一个选中实体的样式
            if (previousEntity && previousEntity.polygon && previousEntity._originalColor) {
                previousEntity.polygon.material = previousEntity._originalColor.withAlpha(0.8);
                previousEntity.polygon.outlineColor = Cesium.Color.WHITE.withAlpha(0.9);
                previousEntity.polygon.outlineWidth = 1;
                previousEntity = null;
            }
            
            selectedArea.value = null;
            
            // 强制渲染
            if (viewer) {
                viewer.scene.requestRender();
            }
        };

        // 放大
        const zoomIn = () => {
            if (!viewer) return;
            const camera = viewer.camera;
            camera.zoomIn(camera.positionCartographic.height * 0.5);
        };

        // 缩小
        const zoomOut = () => {
            if (!viewer) return;
            const camera = viewer.camera;
            camera.zoomOut(camera.positionCartographic.height * 0.5);
        };

        // 复位视角
        const resetView = () => {
            if (!viewer) return;
            viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(-140.0, 10.0, 12000000),
                duration: 2
            });
        };

        // 2D/3D 切换 - 保持当前位置
        const toggle2D3D = () => {
            if (!viewer) return;
            
            // 如果风场或波浪正在显示，先隐藏（因为在2D模式下不支持）
            const windWasVisible = showWind.value;
            const waveWasVisible = showWave.value;
            
            if (windWasVisible && windLayer) {
                console.log('⚠️ 2D模式不支持风场显示，自动隐藏风场');
                windLayer.show = false;
                showWind.value = false;
            }
            
            if (waveWasVisible && waveLayer) {
                console.log('⚠️ 2D模式不支持波浪显示，自动隐藏波浪');
                waveLayer.show = false;
                showWave.value = false;
                // 停止相机高度监控
                stopCameraHeightMonitoring();
            }
            
            if (is3D.value) {
                // 3D → 2D：切换到平面视图
                viewer.scene.morphTo2D(1);
                
                // 切换到2D后，飞到理想视角（太平洋矿区）
                setTimeout(() => {
                    viewer.camera.flyTo({
                        destination: Cesium.Cartesian3.fromDegrees(-140.0, 10.0, 20000000),
                        orientation: {
                            heading: 0,
                            pitch: Cesium.Math.toRadians(-90),
                            roll: 0
                        },
                        duration: 1.5
                    });
                }, 1000);
            } else {
                // 2D → 3D：切换到3D球体
                viewer.scene.morphTo3D(1);
                
                // 切换到3D后，飞到太平洋矿区
                setTimeout(() => {
                    viewer.camera.flyTo({
                        destination: Cesium.Cartesian3.fromDegrees(-140.0, 10.0, 15000000),
                        orientation: {
                            heading: 0,
                            pitch: Cesium.Math.toRadians(-90),
                            roll: 0
                        },
                        duration: 1.5
                    });
                }, 1000);
                
                // 如果之前风场是显示的，切换回3D后重新显示
                if (windWasVisible && windLayer) {
                    setTimeout(() => {
                        console.log('✅ 切换回3D，恢复风场显示');
                        windLayer.show = true;
                        showWind.value = true;
                        viewer.scene.requestRenderMode = false;
                    }, 1500);
                }
                
                // 如果之前波浪是显示的，切换回3D后重新显示
                if (waveWasVisible && waveLayer) {
                    setTimeout(() => {
                        console.log('✅ 切换回3D，恢复波浪显示');
                        waveLayer.show = true;
                        showWave.value = true;
                        viewer.scene.requestRenderMode = false;
                        // 重新启动相机高度监控
                        startCameraHeightMonitoring();
                    }, 1500);
                }
            }
            is3D.value = !is3D.value;
        };

        // 全屏
        const toggleFullscreen = () => {
            if (!viewer) return;
            if (!document.fullscreenElement) {
                viewer.container.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        };

        // 初始化风场图层
        const initWindLayer = async () => {
            console.log('🔧 initWindLayer 被调用');
            console.log('   - viewer 存在:', !!viewer);
            console.log('   - windLayer 已存在:', !!windLayer);
            
            if (!viewer || windLayer) {
                console.warn('⚠️ 跳过初始化:', !viewer ? 'viewer 不存在' : 'windLayer 已存在');
                return;
            }
            
            try {
                console.log('🌬️ 开始加载全球风场数据...');
                const windData = await loadGlobalWindData(0); // 加载第0帧
                console.log('✅ 数据加载成功');
                console.log('   - 网格:', windData.width, 'x', windData.height);
                console.log('   - U范围:', windData.u.min.toFixed(2), '~', windData.u.max.toFixed(2));
                console.log('   - V范围:', windData.v.min.toFixed(2), '~', windData.v.max.toFixed(2));
                
                // 动态导入 cesium-wind-layer
                console.log('⏳ 动态导入 cesium-wind-layer...');
                const { WindLayer } = await import('cesium-wind-layer');
                console.log('✅ 插件导入成功');
                
                // 确保场景已经渲染，WebGL 上下文已初始化
                viewer.scene.requestRenderMode = false;
                viewer.scene.render();
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // 创建 WindLayer
                console.log('⏳ 创建 WindLayer...');
                
                windLayer = new WindLayer(viewer, windData, {
                    particlesTextureSize: 640,
                    particleHeight: 100000,        // 高度：100km（在大气层显示）
                    lineWidth: { min: 1.5, max: 4 },
                    lineLength: { min: 100, max: 200 },
                    speedFactor: 1.5,
                    dropRate: 0.003,
                    dropRateBump: 0.001,
                    colors: [
                        'rgba(0, 98, 255, 1)',      // 深蓝（低风速）
                        'rgba(0, 180, 255, 1)',     // 青色
                        'rgba(0, 255, 200, 1)',     // 青绿
                        'rgba(100, 255, 100, 1)',   // 绿色
                        'rgba(255, 255, 0, 1)',     // 黄色
                        'rgba(255, 150, 0, 1)',     // 橙色
                        'rgba(255, 50, 0, 1)'       // 红色（高风速）
                    ],
                    displayRange: { min: 0, max: 30 },  // 风速范围：0-30 m/s
                    flipY: false,
                    useColorScale: true,
                    fadeOpacity: 0.95
                });
                
                console.log('✅ WindLayer 创建成功');
                cachedWindData = windData;
                
            } catch (error) {
                console.error('❌ 风场图层加载失败:', error);
                console.error('   - 堆栈:', error.stack);
            }
        };

        // 风场数据缓存（避免重复加载）
        let cachedWindData = null;

        // 波浪数据缓存（避免重复加载）
        let cachedWaveData = null;
        
        // 洋流数据缓存（避免重复加载）
        let cachedOceanCurrentData = null;
        
        // 内波数据缓存（避免重复加载）
        let cachedInternalWaveData = null;
        
        /**
         * 预加载所有气象数据（不渲染图层，只缓存数据）
         * 这样用户点击地图时，所有数据都已经准备好了
         */
        const preloadWeatherData = async () => {
            console.log('🚀 开始预加载所有气象数据...');
            
            try {
                // 并行加载所有气象数据的第0帧
                const [windData, waveData, currentData, internalWaveData] = await Promise.all([
                    loadGlobalWindData(0).catch(err => {
                        console.warn('⚠️ 风场数据预加载失败:', err.message);
                        return null;
                    }),
                    loadGlobalWaveData(0).catch(err => {
                        console.warn('⚠️ 波浪数据预加载失败:', err.message);
                        return null;
                    }),
                    loadGlobalOceanCurrentData(0).catch(err => {
                        console.warn('⚠️ 洋流数据预加载失败:', err.message);
                        return null;
                    }),
                    loadGlobalInternalWaveData(0).catch(err => {
                        console.warn('⚠️ 内波数据预加载失败:', err.message);
                        return null;
                    })
                ]);
                
                // 缓存加载成功的数据
                if (windData) {
                    cachedWindData = windData;
                    console.log('✅ 风场数据预加载成功');
                }
                if (waveData) {
                    cachedWaveData = waveData;
                    console.log('✅ 波浪数据预加载成功');
                }
                if (currentData) {
                    cachedOceanCurrentData = currentData;
                    console.log('✅ 洋流数据预加载成功');
                }
                if (internalWaveData) {
                    cachedInternalWaveData = internalWaveData;
                    console.log('✅ 内波数据预加载成功');
                }
                
                console.log('🎉 气象数据预加载完成！');
                
                // 通知父组件数据已加载（可选）
                emit('weatherDataLoaded', {
                    wind: !!windData,
                    wave: !!waveData,
                    current: !!currentData,
                    internalWave: !!internalWaveData
                });
                
            } catch (error) {
                console.error('❌ 气象数据预加载失败:', error);
            }
        };
        
        // 相机高度监控变量
        let lastCameraHeight = null;
        let cameraHeightCheckInterval = null;
        
        // 初始化波浪图层
        const initWaveLayer = async () => {
            console.log('🔧 initWaveLayer 被调用');
            console.log('   - viewer 存在:', !!viewer);
            console.log('   - waveLayer 已存在:', !!waveLayer);
            
            if (!viewer) {
                console.warn('⚠️ 跳过初始化: viewer 不存在');
                return;
            }
            
            // 如果已存在，先移除旧图层
            if (waveLayer) {
                console.log('🗑️ 移除旧的波浪图层');
                waveLayer.remove();
                waveLayer = null;
            }
            
            try {
                // 加载或使用缓存的波浪数据
                if (!cachedWaveData) {
                    console.log('🌊 开始加载全球波浪数据...');
                    cachedWaveData = await loadGlobalWaveData(0);
                    console.log('✅ 波浪数据加载成功并缓存');
                } else {
                    console.log('📦 使用缓存的波浪数据');
                }
                
                // 动态导入 cesium-wind-layer（复用风场渲染引擎）
                console.log('⏳ 动态导入 cesium-wind-layer...');
                const { WindLayer } = await import('cesium-wind-layer');
                console.log('✅ 插件导入成功');
                
                // 确保场景已经渲染，WebGL 上下文已初始化
                viewer.scene.requestRenderMode = false;
                viewer.scene.render();
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // 创建 WaveLayer（实际是 WindLayer，但用于渲染波浪）
                console.log('⏳ 创建 WaveLayer...');
                console.log('   - Viewer scene:', viewer.scene);
                console.log('   - WebGL context:', viewer.scene.context);
                
                // 检查 WebGL 上下文
                const gl = viewer.scene.context._gl;
                const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
                console.log('   - Max texture size:', maxTextureSize);
                console.log('   - Data width:', cachedWaveData.width);
                console.log('   - Data height:', cachedWaveData.height);
                
                if (cachedWaveData.width > maxTextureSize || cachedWaveData.height > maxTextureSize) {
                    throw new Error(`数据尺寸 ${cachedWaveData.width}x${cachedWaveData.height} 超过 WebGL 纹理限制 ${maxTextureSize}`);
                }
                
                waveLayer = new WindLayer(viewer, cachedWaveData, {
                    // 粒子数量：增加一些，展现更丰富的波浪细节
                    particlesTextureSize: 640,
                    
                    particleHeight: 0,
                    
                    // 线条粗细：恢复原来的粗线条
                    lineWidth: { min: 6, max: 10 },
                    
                    // 线条长度：减小长度，让线条更短更紧凑
                    lineLength: { min: 30, max: 60 },
                    
                    // 速度因子：适中，让波浪运动更明显
                    speedFactor: 1.0,
                    
                    // 粒子消失率：适中
                    dropRate: 0.006,
                    
                    // 粒子消失率增量
                    dropRateBump: 0.002,
                    
                    // 波浪色带：蓝→青→绿→黄→橙→红
                    colors: [
                        'rgba(0, 0, 139, 0.7)',      // 深蓝（低波高 0-1m）
                        'rgba(0, 0, 255, 0.75)',     // 蓝色
                        'rgba(0, 191, 255, 0.8)',    // 深天蓝（1-2m）
                        'rgba(0, 255, 255, 0.85)',   // 青色
                        'rgba(0, 255, 127, 0.9)',    // 春绿（2-3m）
                        'rgba(173, 255, 47, 0.9)',   // 黄绿
                        'rgba(255, 255, 0, 0.95)',   // 黄色（3-4m）
                        'rgba(255, 165, 0, 0.98)',   // 橙色（4-5m）
                        'rgba(255, 69, 0, 1.0)',     // 橙红（5-6m）
                        'rgba(255, 0, 0, 1.0)'       // 红色（>6m 高波高）
                    ],
                    
                    flipY: false,
                    dynamic: true,
                    // 启用热力图模式（类似Windy）
                    useColorScale: true,  // 显示颜色热力图
                    fadeOpacity: 0.95     // 热力图透明度
                });
                
                console.log('✅ WaveLayer 创建成功');
                
                // 禁用热力图 - 保持纯粹的粒子效果
                /*
                // 创建 Cesium 原生热力图层（作为背景）
                if (!waveHeatmap) {
                    waveHeatmap = new HeatmapLayer(viewer);
                }
                
                // 生成热力图（Windy 标准配色）
                const colorScale = [
                    'rgba(58, 0, 140, 1)',      // 深紫（0-1m）
                    'rgba(70, 50, 200, 1)',     // 紫色
                    'rgba(0, 100, 255, 1)',     // 深蓝（1-2m）
                    'rgba(0, 180, 255, 1)',     // 蓝色
                    'rgba(0, 230, 255, 1)',     // 浅蓝（2-3m）
                    'rgba(0, 255, 200, 1)',     // 青绿
                    'rgba(100, 255, 100, 1)',   // 绿色（3-4m）
                    'rgba(200, 255, 0, 1)',     // 黄绿
                    'rgba(255, 255, 0, 1)',     // 黄色（4-5m）
                    'rgba(255, 150, 0, 1)',     // 橙色
                    'rgba(255, 50, 0, 1)',      // 橙红（5-6m）
                    'rgba(200, 0, 0, 1)'        // 深红（>6m）
                ];
                
                console.log('🗺️ 准备创建波浪热力图（Cesium 原生），数据bounds:', cachedWaveData.bounds);
                
                await waveHeatmap.createHeatmap(cachedWaveData, colorScale, {
                    alpha: 0.5,  // 半透明，作为背景
                    bounds: cachedWaveData.bounds
                });
                
                console.log('✅ 波浪热力图已创建（Cesium Primitive）');
                */
                
                // 记录当前相机高度
                lastCameraHeight = viewer.camera.positionCartographic.height;
                console.log('📏 初始相机高度:', lastCameraHeight.toFixed(0), 'm');
                
                // 启动相机高度监控
                startCameraHeightMonitoring();
                
                // WindLayer 构造函数会自动添加到场景，不需要手动调用 add()
                
            } catch (error) {
                console.error('❌ 波浪图层加载失败:', error);
                console.error('   - 堆栈:', error.stack);
            }
        };
        
        // 启动相机高度监控（防抖处理）
        const startCameraHeightMonitoring = () => {
            // 清除旧的监控
            if (cameraHeightCheckInterval) {
                clearInterval(cameraHeightCheckInterval);
            }
            
            let debounceTimer = null;
            
            // 每500ms检查一次相机高度
            cameraHeightCheckInterval = setInterval(() => {
                if (!viewer || !waveLayer || !lastCameraHeight) return;
                
                const currentHeight = viewer.camera.positionCartographic.height;
                const heightChange = Math.abs(currentHeight - lastCameraHeight) / lastCameraHeight;
                
                // 如果高度变化超过30%，触发重建
                if (heightChange > 0.3) {
                    console.log('📏 相机高度变化:', {
                        旧高度: lastCameraHeight.toFixed(0) + 'm',
                        新高度: currentHeight.toFixed(0) + 'm',
                        变化率: (heightChange * 100).toFixed(1) + '%'
                    });
                    
                    // 防抖：延迟500ms后重建，避免频繁操作
                    if (debounceTimer) {
                        clearTimeout(debounceTimer);
                    }
                    
                    debounceTimer = setTimeout(async () => {
                        console.log('🔄 重建波浪图层以适应新的缩放级别...');
                        const wasVisible = waveLayer.show;
                        await initWaveLayer();
                        if (waveLayer && wasVisible) {
                            waveLayer.show = true;
                        }
                    }, 500);
                }
            }, 500);
            
            console.log('👁️ 相机高度监控已启动');
        };
        
        // 停止相机高度监控
        const stopCameraHeightMonitoring = () => {
            if (cameraHeightCheckInterval) {
                clearInterval(cameraHeightCheckInterval);
                cameraHeightCheckInterval = null;
                console.log('👁️ 相机高度监控已停止');
            }
        };
        
        // 初始化洋流图层
        const initOceanCurrentLayer = async () => {
            console.log('🔧 initOceanCurrentLayer 被调用');
            console.log('   - viewer 存在:', !!viewer);
            console.log('   - oceanCurrentLayer 已存在:', !!oceanCurrentLayer);
            
            if (!viewer || oceanCurrentLayer) {
                console.warn('⚠️ 跳过初始化:', !viewer ? 'viewer 不存在' : 'oceanCurrentLayer 已存在');
                return;
            }
            
            try {
                // 加载或使用缓存的洋流数据
                if (!cachedOceanCurrentData) {
                    console.log('🌊 开始加载洋流数据...');
                    cachedOceanCurrentData = await loadGlobalOceanCurrentData(0);
                    console.log('✅ 洋流数据加载成功并缓存');
                } else {
                    console.log('📦 使用缓存的洋流数据');
                }
                
                // 动态导入 cesium-wind-layer
                console.log('⏳ 动态导入 cesium-wind-layer...');
                const { WindLayer } = await import('cesium-wind-layer');
                console.log('✅ 插件导入成功');
                
                // 确保场景已经渲染，WebGL 上下文已初始化
                viewer.scene.requestRenderMode = false;
                viewer.scene.render();
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // 创建 OceanCurrentLayer（实际是 WindLayer，但用于渲染洋流）
                console.log('⏳ 创建 OceanCurrentLayer...');
                
                // 检查 WebGL 上下文
                const gl = viewer.scene.context._gl;
                const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
                console.log('   - Max texture size:', maxTextureSize);
                console.log('   - Data width:', cachedOceanCurrentData.width);
                console.log('   - Data height:', cachedOceanCurrentData.height);
                
                if (cachedOceanCurrentData.width > maxTextureSize || cachedOceanCurrentData.height > maxTextureSize) {
                    throw new Error(`数据尺寸 ${cachedOceanCurrentData.width}x${cachedOceanCurrentData.height} 超过 WebGL 纹理限制 ${maxTextureSize}`);
                }
                
                oceanCurrentLayer = new WindLayer(viewer, cachedOceanCurrentData, {
                    // 粒子数量：适中密度（Windy 风格）
                    particlesTextureSize: 640,
                    
                    particleHeight: 0,
                    
                    // 线条粗细：细腻的线条（Windy 风格）
                    lineWidth: { min: 1.5, max: 3.5 },
                    
                    // 线条长度：稍长的流线
                    lineLength: { min: 300, max: 700 },
                    
                    // 速度因子：更缓慢的动画速度
                    speedFactor: 1.8,
                    
                    // 粒子消失率：适中，保持流线连续性
                    dropRate: 0.003,
                    
                    // 粒子消失率增量
                    dropRateBump: 0.001,
                    
                    // 洋流色带：保持当前的蓝绿色系
                    colors: [
                        'rgba(0, 30, 80, 0.75)',       // 深蓝（慢流 0-0.2 m/s）
                        'rgba(0, 60, 120, 0.8)',       // 蓝色
                        'rgba(0, 100, 160, 0.85)',     // 中蓝（0.2-0.4 m/s）
                        'rgba(0, 140, 200, 0.88)',     // 亮蓝
                        'rgba(0, 180, 240, 0.9)',      // 天蓝（0.4-0.6 m/s）
                        'rgba(0, 220, 255, 0.92)',     // 浅蓝
                        'rgba(50, 240, 255, 0.95)',    // 亮青（0.6-0.8 m/s）
                        'rgba(100, 255, 255, 0.97)',   // 青色
                        'rgba(150, 255, 200, 0.98)',   // 青绿（0.8-1.0 m/s）
                        'rgba(200, 255, 150, 1.0)'     // 黄绿（>1.0 m/s 快流）
                    ],
                    
                    flipY: false,
                    dynamic: true,
                    // 启用热力图模式
                    useColorScale: true,
                    fadeOpacity: 0.92
                });
                
                console.log('✅ OceanCurrentLayer 创建成功');
                
                // 禁用洋流热力图 - 保持纯粹的粒子效果
                /*
                // 创建洋流热力图层（Cesium 原生，作为背景）
                if (!oceanCurrentHeatmap) {
                    oceanCurrentHeatmap = new HeatmapLayer(viewer);
                }
                
                // 生成洋流热力图（Windy 洋流配色）
                const currentColorScale = [
                    'rgba(58, 0, 140, 1)',      // 深紫（慢流）
                    'rgba(70, 50, 200, 1)',     // 紫色
                    'rgba(0, 100, 255, 1)',     // 深蓝
                    'rgba(0, 180, 255, 1)',     // 蓝色
                    'rgba(0, 230, 255, 1)',     // 浅蓝
                    'rgba(0, 255, 200, 1)',     // 青绿
                    'rgba(100, 255, 100, 1)',   // 绿色
                    'rgba(200, 255, 0, 1)',     // 黄绿
                    'rgba(255, 255, 0, 1)',     // 黄色
                    'rgba(255, 150, 0, 1)',     // 橙色
                    'rgba(255, 50, 0, 1)',      // 橙红（快流）
                    'rgba(200, 0, 0, 1)'        // 深红
                ];
                
                console.log('🗺️ 准备创建洋流热力图（Cesium 原生），数据bounds:', cachedOceanCurrentData.bounds);
                
                await oceanCurrentHeatmap.createHeatmap(cachedOceanCurrentData, currentColorScale, {
                    alpha: 0.4,  // 更透明，作为背景
                    bounds: cachedOceanCurrentData.bounds
                });
                
                console.log('✅ 洋流热力图已创建（Cesium Primitive）');
                */
                
                // WindLayer 构造函数会自动添加到场景，不需要手动调用 add()
                
            } catch (error) {
                console.error('❌ 洋流图层加载失败:', error);
                console.error('   - 堆栈:', error.stack);
            }
        };
        
        // 初始化内波图层
        const initInternalWaveLayer = async () => {
            console.log('🔧 initInternalWaveLayer 被调用');
            console.log('   - viewer 存在:', !!viewer);
            console.log('   - internalWaveLayer 已存在:', !!internalWaveLayer);
            
            if (!viewer || internalWaveLayer) {
                console.warn('⚠️ 跳过初始化:', !viewer ? 'viewer 不存在' : 'internalWaveLayer 已存在');
                return;
            }
            
            try {
                // 加载或使用缓存的内波数据
                if (!cachedInternalWaveData) {
                    console.log('🌊 开始加载内波数据...');
                    cachedInternalWaveData = await loadGlobalInternalWaveData(0);
                    console.log('✅ 内波数据加载成功并缓存');
                } else {
                    console.log('📦 使用缓存的内波数据');
                }
                
                // 动态导入 cesium-wind-layer
                console.log('⏳ 动态导入 cesium-wind-layer...');
                const { WindLayer } = await import('cesium-wind-layer');
                console.log('✅ 插件导入成功');
                
                // 确保场景已经渲染，WebGL 上下文已初始化
                viewer.scene.requestRenderMode = false;
                viewer.scene.render();
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // 创建 InternalWaveLayer（实际是 WindLayer，但用于渲染内波）
                console.log('⏳ 创建 InternalWaveLayer...');
                
                // 检查 WebGL 上下文
                const gl = viewer.scene.context._gl;
                const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
                console.log('   - Max texture size:', maxTextureSize);
                console.log('   - Data width:', cachedInternalWaveData.width);
                console.log('   - Data height:', cachedInternalWaveData.height);
                
                if (cachedInternalWaveData.width > maxTextureSize || cachedInternalWaveData.height > maxTextureSize) {
                    throw new Error(`数据尺寸 ${cachedInternalWaveData.width}x${cachedInternalWaveData.height} 超过 WebGL 纹理限制 ${maxTextureSize}`);
                }
                
                internalWaveLayer = new WindLayer(viewer, cachedInternalWaveData, {
                    // 粒子数量：适中密度，避免卡顿
                    particlesTextureSize: 640,
                    
                    // 粒子高度：海面上方一点，避免被地形遮挡
                    particleHeight: 1000,
                    
                    // 线条粗细：粗线条
                    lineWidth: { min: 3.0, max: 6.0 },
                    
                    // 线条长度：适中长度
                    lineLength: { min: 80, max: 180 },
                    
                    // 速度因子：慢速动画，避免卡顿
                    speedFactor: 0.3,
                    
                    // 粒子消失率：适中
                    dropRate: 0.002,
                    
                    // 粒子消失率增量
                    dropRateBump: 0.001,
                    
                    // 显示范围：扩大范围以适应放大后的数据
                    displayRange: { min: 0, max: 100 },
                    
                    // 内波色带：超亮的青色系，完全不透明
                    colors: [
                        'rgba(0, 255, 255, 1)',        // 亮青
                        'rgba(0, 255, 255, 1)',        // 亮青
                        'rgba(50, 255, 255, 1)',       // 亮青
                        'rgba(100, 255, 255, 1)',      // 亮青
                        'rgba(150, 255, 255, 1)',      // 亮青
                        'rgba(200, 255, 255, 1)',      // 极亮青
                        'rgba(255, 255, 255, 1)',      // 白色
                        'rgba(255, 255, 255, 1)',      // 白色
                        'rgba(255, 255, 255, 1)',      // 白色
                        'rgba(255, 255, 255, 1)'       // 白色
                    ],
                    
                    flipY: true,
                    dynamic: true,
                    useColorScale: true,
                    fadeOpacity: 0.98
                });
                
                console.log('✅ InternalWaveLayer 创建成功');
                
            } catch (error) {
                console.error('❌ 内波图层加载失败:', error);
                console.error('   - 堆栈:', error.stack);
            }
        };

        // 获取船舶类型名称
        const getShipTypeName = (shipType) => {
            if (!shipType) return '未知';
            
            const typeMap = {
                20: '地效翼船', 21: '地效翼船（危险品）', 22: '地效翼船（污染品）', 23: '地效翼船（危险品+污染品）',
                30: '渔船', 31: '拖拽船', 32: '拖拽船（长度>200m）', 33: '疏浚船', 34: '潜水作业船',
                35: '军用船', 36: '帆船', 37: '游艇',
                40: '高速船', 41: '高速船（危险品）', 42: '高速船（污染品）', 43: '高速船（危险品+污染品）',
                50: '引航船', 51: '搜救船', 52: '拖船', 53: '港口工作船', 54: '防污船', 55: '执法船', 58: '医疗船', 59: '其他船舶',
                60: '客船', 61: '客船（危险品）', 62: '客船（污染品）', 63: '客船（危险品+污染品）',
                70: '货船', 71: '货船（危险品）', 72: '货船（污染品）', 73: '货船（危险品+污染品）', 74: '货船', 79: '货船',
                80: '油轮', 81: '油轮（危险品）', 82: '油轮（污染品）', 83: '油轮（危险品+污染品）', 84: '油轮', 89: '油轮'
            };
            
            return typeMap[shipType] || `未知类型(${shipType})`;
        };
        
        // 获取航行状态
        const getNavigationStatus = (status) => {
            if (status === undefined || status === null || status === 255) return '未知';
            
            const statusMap = {
                0: '在航（引擎推进）', 
                1: '锚泊', 
                2: '失控', 
                3: '操纵受限', 
                4: '受吃水限制',
                5: '停泊', 
                6: '搁浅', 
                7: '从事捕鱼', 
                8: '在航（帆推进）',
                9: '保留',
                10: '保留',
                11: '拖带',
                12: '推送',
                13: '保留',
                14: '高速船（HSC）',
                15: '默认'
            };
            
            return statusMap[status] || `未知状态(${status})`;
        };
        
        // 判断ETA是否已过期
        const isEtaExpired = (eta, lastTime) => {
            if (!eta || !lastTime) return false;
            
            try {
                const etaDate = new Date(eta);
                const lastTimeDate = new Date(lastTime);
                
                // 如果最后更新时间晚于预计到达时间，说明ETA已过期
                return lastTimeDate > etaDate;
            } catch (error) {
                return false;
            }
        };

        // 关闭船舶信息窗口
        const closeShipInfo = () => {
            selectedShip.value = null;
            if (trajectoryLayer) {
                trajectoryLayer.resumeAnimation();  // 恢复动画
            }
        };
        
        // 关闭气象信息窗口
        const closeWeatherInfo = () => {
            selectedWeather.value = null;
        };
        
        // 关闭气象选择器
        const closeWeatherPicker = () => {
            weatherPickedPoint.value = null;
        };
        
        // 处理地图点击查询气象
        const handleWeatherPointClick = (screenPosition, correctedPosition, scaleX, scaleY) => {
            // 获取点击位置的经纬度（使用修正后的坐标）
            const cartesian = viewer.camera.pickEllipsoid(correctedPosition, viewer.scene.globe.ellipsoid);
            if (!cartesian) {
                console.warn('⚠️ 无法获取点击位置的坐标');
                return;
            }
            
            const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            const lon = Cesium.Math.toDegrees(cartographic.longitude);
            const lat = Cesium.Math.toDegrees(cartographic.latitude);
            
            // 设置选中点（包含缩放比例）
            weatherPickedPoint.value = {
                lat,
                lon,
                cartesian3: cartesian,
                screenPosition: screenPosition,
                scale: { x: scaleX, y: scaleY }  // 新增：传递缩放比例
            };
            
            // 设置当前图层
            if (showWind.value) {
                currentWeatherLayer.value = { id: 'wind', name: '风速' };
            } else if (showWave.value) {
                currentWeatherLayer.value = { id: 'wave', name: '波高' };
            } else if (showOceanCurrent.value) {
                currentWeatherLayer.value = { id: 'current', name: '洋流' };
            } else if (showInternalWave.value) {
                currentWeatherLayer.value = { id: 'internal_wave', name: '内波' };
            }
            
            // 缓存气象数据
            weatherDataCache.value = {
                wind: cachedWindData,
                wave: cachedWaveData,
                current: cachedOceanCurrentData,
                internal_wave: cachedInternalWaveData
            };
            
            // 调试：打印缓存的数据状态
            console.log('📦 气象数据缓存状态:', {
                wind: !!cachedWindData,
                wave: !!cachedWaveData,
                current: !!cachedOceanCurrentData,
                internal_wave: !!cachedInternalWaveData,
                internal_wave_has_u: cachedInternalWaveData?.u ? true : false,
                internal_wave_has_v: cachedInternalWaveData?.v ? true : false
            });
            
            // 生成时间步长（基于当前激活的图层）
            generateWeatherTimeSteps();
            
            console.log('📍 气象点查询:', { 
                lat: lat.toFixed(2), 
                lon: lon.toFixed(2), 
                layer: currentWeatherLayer.value,
                timeSteps: weatherTimeSteps.value.length
            });
        };
        
        // 生成气象时间步长
        const generateWeatherTimeSteps = async () => {
            try {
                // 根据当前激活的图层读取 meta.json
                let metaPath = '';
                let isInternalWave = false;
                
                if (showWind.value) {
                    metaPath = '/wind_data/meta.json';
                } else if (showWave.value) {
                    metaPath = '/wave_data/meta.json';
                } else if (showOceanCurrent.value) {
                    metaPath = '/ocean_currents/meta.json';
                } else if (showInternalWave.value) {
                    metaPath = '/hret14/hret14_out_uv_20200101/meta.json';
                    isInternalWave = true;
                } else {
                    console.warn('⚠️ 没有激活的气象图层，无法生成时间步长');
                    weatherTimeSteps.value = [];
                    return;
                }
                
                console.log('📂 读取元数据文件:', metaPath);
                const response = await fetch(metaPath);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const meta = await response.json();
                console.log('📋 元数据内容:', meta);
                
                // 内波数据使用不同的格式
                if (isInternalWave) {
                    // 内波的 meta.json 直接提供 times 数组
                    if (meta.times && Array.isArray(meta.times)) {
                        const steps = meta.times.map(timeStr => new Date(timeStr));
                        weatherTimeSteps.value = steps;
                        console.log('✅ 生成内波时间步长:', steps.length, '个', steps.length > 0 ? `(${steps[0].toISOString()} ~ ${steps[steps.length-1].toISOString()})` : '');
                    } else {
                        throw new Error('内波元数据中没有 times 数组');
                    }
                } else {
                    // 其他气象数据使用标准格式
                    const startTime = new Date(meta.start_time);
                    const frames = meta.frames;
                    const timeStepHours = meta.time_step_hours;
                    
                    console.log('⏰ 时间参数:', {
                        startTime: meta.start_time,
                        frames: frames,
                        timeStepHours: timeStepHours
                    });
                    
                    // 生成时间步长数组
                    const steps = [];
                    for (let i = 0; i < frames; i++) {
                        const time = new Date(startTime);
                        time.setHours(time.getHours() + i * timeStepHours);
                        steps.push(time);
                    }
                    
                    weatherTimeSteps.value = steps;
                    console.log('✅ 生成时间步长:', steps.length, '个', steps.length > 0 ? `(${steps[0].toISOString()} ~ ${steps[steps.length-1].toISOString()})` : '');
                }
            } catch (error) {
                console.error('❌ 生成时间步长失败:', error);
                console.error('   错误详情:', error.message);
                console.error('   堆栈:', error.stack);
                weatherTimeSteps.value = [];
            }
        };

        // 切换路径规划面板
        const toggleRoutePlan = () => {
            showRoutePlan.value = !showRoutePlan.value;
        };
        
        // 处理路径规划结果
        const handleRoutePlanned = (routeData) => {
            if (routeLayer && routeData.route) {
                routeLayer.drawRoute(routeData.route, {
                    startPort: routeData.startPort,
                    endPort: routeData.endPort,
                    lineColor: Cesium.Color.PURPLE.withAlpha(0.8),
                    lineWidth: 4,
                    showArrows: true
                });
                
                // 飞到航线视角
                setTimeout(() => {
                    routeLayer.flyToRoute();
                }, 500);
                
                console.log('✅ 航线已绘制到地图');
            }
        };
        
        // 清除路径
        const handleRouteCleared = () => {
            if (routeLayer) {
                routeLayer.clearRoute();
            }
            if (routeWeatherLayer) {
                routeWeatherLayer.clear();
            }
        };
        
        // 存储自定义阈值
        let customThresholds = null;
        
        // 处理阈值变化
        const handleThresholdsChanged = (thresholds) => {
            customThresholds = thresholds;
            console.log('✅ MapContainer 收到阈值变化:', thresholds);
            console.log('   - routeWeatherLayer 存在:', !!routeWeatherLayer);
            console.log('   - 气象数据数量:', routeWeatherLayer ? routeWeatherLayer.weatherData.length : 0);
            
            // 如果已有气象数据，重新评估风险
            if (routeWeatherLayer && routeWeatherLayer.weatherData.length > 0) {
                console.log('🔄 重新评估航线气象风险...');
                console.log('   - 重新评估前第一个点的风险:', routeWeatherLayer.weatherData[0]?.risk);
                
                routeWeatherLayer.reEvaluateRisk(thresholds);
                
                console.log('   - 重新评估后第一个点的风险:', routeWeatherLayer.weatherData[0]?.risk);
                console.log('   - 准备发送 weatherDataLoaded 事件');
                
                // 更新气象数据
                emit('weatherDataLoaded', {
                    data: routeWeatherLayer.weatherData,
                    stats: routeWeatherLayer.getStatistics()
                });
                
                console.log('✅ 气象数据已更新并发送给父组件');
                console.log('   - 发送的数据点数量:', routeWeatherLayer.weatherData.length);
            } else {
                console.log('ℹ️ 当前没有气象数据，阈值将在下次分析时使用');
            }
        };
        
        // 地图选点状态
        let pickPointCallback = null;
        let pickPointHandler = null;
        let pickPointType = null; // 当前选点类型
        let pickPointMarkerEntity = null; // 当前选点标记
        
        // 处理地图选点请求
        const handlePickPoint = (data) => {
            if (data.type === 'cancel') {
                // 取消选点
                if (pickPointHandler) {
                    pickPointHandler.destroy();
                    pickPointHandler = null;
                }
                pickPointCallback = null;
                pickPointType = null;
                
                // 移除临时标记
                if (pickPointMarkerEntity && viewer) {
                    viewer.entities.remove(pickPointMarkerEntity);
                    pickPointMarkerEntity = null;
                }
                
                console.log('❌ 取消地图选点');
                return;
            }
            
            // 保存回调函数和类型
            pickPointCallback = data.callback;
            pickPointType = data.type;
            
            // 移除旧的处理器
            if (pickPointHandler) {
                pickPointHandler.destroy();
            }
            
            // 创建新的点击处理器
            const viewer = viewerRef.value;
            if (!viewer) return;
            
            pickPointHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
            
            pickPointHandler.setInputAction((click) => {
                // 计算 CSS scale 缩放比例
                const baseWidth = 1920;
                const baseHeight = 1080;
                const scaleX = window.innerWidth / baseWidth;
                const scaleY = window.innerHeight / baseHeight;
                
                // 修正点击坐标
                const correctedPosition = new Cesium.Cartesian2(
                    click.position.x / scaleX,
                    click.position.y / scaleY
                );
                
                // 获取点击位置的笛卡尔坐标
                const cartesian = viewer.camera.pickEllipsoid(correctedPosition, viewer.scene.globe.ellipsoid);
                
                if (cartesian) {
                    // 转换为经纬度
                    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                    const lng = Cesium.Math.toDegrees(cartographic.longitude);
                    const lat = Cesium.Math.toDegrees(cartographic.latitude);
                    
                    console.log(`📍 选择了位置 (${pickPointType}): ${lng.toFixed(6)}, ${lat.toFixed(6)}`);
                    
                    // 移除旧标记
                    if (pickPointMarkerEntity) {
                        viewer.entities.remove(pickPointMarkerEntity);
                    }
                    
                    // 根据类型创建不同的标记
                    let markerColor, markerLabel, markerText;
                    
                    switch (pickPointType) {
                        case 'start':
                            markerColor = '#22c55e'; // 绿色
                            markerLabel = '起点';
                            markerText = 'A';
                            break;
                        case 'end':
                            markerColor = '#ef4444'; // 红色
                            markerLabel = '终点';
                            markerText = 'B';
                            break;
                        case 'avoid':
                            markerColor = '#f97316'; // 橙色
                            markerLabel = '避让点';
                            markerText = '×';
                            break;
                        case 'through':
                            markerColor = '#3b82f6'; // 蓝色
                            markerLabel = '途经点';
                            markerText = '●';
                            break;
                        default:
                            markerColor = '#6b7280'; // 灰色
                            markerLabel = '选点';
                            markerText = '?';
                    }
                    
                    // 创建标记
                    pickPointMarkerEntity = viewer.entities.add({
                        position: Cesium.Cartesian3.fromDegrees(lng, lat),
                        billboard: {
                            image: 'data:image/svg+xml;base64,' + window.btoa(`
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="48" viewBox="0 0 32 48">
                                    <path d="M16 0C7.2 0 0 7.2 0 16c0 8.8 16 32 16 32s16-23.2 16-32C32 7.2 24.8 0 16 0z" fill="${markerColor}" stroke="#fff" stroke-width="2"/>
                                    <circle cx="16" cy="16" r="6" fill="#fff"/>
                                    <text x="16" y="20" text-anchor="middle" font-size="10" fill="${markerColor}" font-weight="bold">${markerText}</text>
                                </svg>
                            `),
                            width: 32,
                            height: 48,
                            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                        },
                        label: {
                            text: markerLabel,
                            font: '14px sans-serif',
                            fillColor: Cesium.Color.WHITE,
                            outlineColor: Cesium.Color.BLACK,
                            outlineWidth: 2,
                            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                            verticalOrigin: Cesium.VerticalOrigin.TOP,
                            pixelOffset: new Cesium.Cartesian2(0, 5),
                            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                        }
                    });
                    
                    // 调用回调函数
                    if (pickPointCallback) {
                        pickPointCallback(lng, lat);
                    }
                    
                    // 清理处理器
                    pickPointHandler.destroy();
                    pickPointHandler = null;
                    pickPointCallback = null;
                    pickPointType = null;
                    
                    // 延迟移除标记（让用户看到标记）
                    setTimeout(() => {
                        if (pickPointMarkerEntity && viewer) {
                            viewer.entities.remove(pickPointMarkerEntity);
                            pickPointMarkerEntity = null;
                        }
                    }, 2000);
                }
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
            
            const typeNames = {
                'start': '起点',
                'end': '终点',
                'avoid': '避让点',
                'through': '途经点'
            };
            console.log(`🖱️ 开始地图选点模式: ${typeNames[data.type] || data.type}`);
        };
        
        // 切换轨迹显示
        const toggleTrajectory = () => {
            console.log('🚢 轨迹按钮被点击');
            
            if (!viewer) {
                console.error('❌ Viewer 不存在');
                return;
            }
            
            if (!trajectoryLayer) {
                // 首次使用，初始化轨迹图层
                console.log('⏳ 初始化轨迹图层...');
                
                // 创建轨迹图层
                trajectoryLayer = new ShipTrajectoryLayer(viewer);
                
                // 添加示例轨迹
                sampleTrajectories.forEach(traj => {
                    trajectoryLayer.addTrajectory(traj);
                });
                
                console.log('✅ 轨迹图层初始化完成');
            }
            
            if (showTrajectory.value) {
                // 隐藏轨迹
                console.log('⏳ 隐藏轨迹...');
                trajectoryLayer.hide();
                showTrajectory.value = false;
                console.log('✅ 轨迹已隐藏');
            } else {
                // 显示轨迹（不改变视角）
                console.log('⏳ 显示轨迹...');
                trajectoryLayer.show();
                // trajectoryLayer.flyTo();  // 注释掉自动飞行
                showTrajectory.value = true;
                console.log('✅ 轨迹已显示');
            }
        };

        /**
         * 计算各区域的矿区数量
         * @param {Array} entities - 所有矿区实体
         * @returns {Object} 区域ID到数量的映射
         */
        const calculateRegionCounts = (entities) => {
            const counts = {
                pacific_ccz: 0,
                pacific_other: 0,
                indian_ocean: 0,
                atlantic_ocean: 0,
                apei: 0
            };
            
            entities.forEach(entity => {
                if (!entity.properties) return;
                
                const location = entity.properties.location?.getValue() || '';
                const category = entity.properties.category?.getValue() || '';
                
                // 环境保护区
                if (category === 'APEI') {
                    counts.apei++;
                }
                // 太平洋CCZ区
                else if (location.includes('太平洋 (CCZ)')) {
                    counts.pacific_ccz++;
                }
                // 印度洋区
                else if (location.includes('印度洋')) {
                    counts.indian_ocean++;
                }
                // 大西洋区
                else if (location.includes('大西洋')) {
                    counts.atlantic_ocean++;
                }
                // 太平洋其他区
                else if (location.includes('太平洋')) {
                    counts.pacific_other++;
                }
            });
            
            console.log('📊 区域矿区统计:', counts);
            return counts;
        };
        
        /**
         * 判断实体是否匹配区域筛选条件
         * @param {Object} entity - 矿区实体
         * @param {Object} filter - 区域筛选条件
         * @returns {Boolean} 是否匹配
         */
        const matchRegionFilter = (entity, filter) => {
            if (!entity.properties) return false;
            
            const location = entity.properties.location?.getValue() || '';
            const category = entity.properties.category?.getValue() || '';
            
            // 检查 category 筛选
            if (filter.category && filter.category.length > 0) {
                if (filter.category.includes(category)) {
                    return true;
                }
            }
            
            // 检查 location 筛选
            if (filter.location && filter.location.length > 0) {
                for (const loc of filter.location) {
                    if (location.includes(loc)) {
                        // 检查是否需要排除
                        if (filter.excludeLocation && filter.excludeLocation.length > 0) {
                            let shouldExclude = false;
                            for (const excludeLoc of filter.excludeLocation) {
                                if (location.includes(excludeLoc)) {
                                    shouldExclude = true;
                                    break;
                                }
                            }
                            if (shouldExclude) continue;
                        }
                        return true;
                    }
                }
            }
            
            return false;
        };
        
        /**
         * 应用矿区地理分区筛选
         * @param {Array} regions - 区域配置数组
         * 
         * 优先级规则:
         * 1. APEI区域优先级最高(按category匹配)
         * 2. 其他区域按location匹配
         * 3. 每个矿区只属于一个区域
         */
        const applyRegionFilters = (regions) => {
            if (!allEntities.length || !regions || !regions.length) return;
            
            console.log('🗺️ 应用区域筛选:', regions);
            
            // 按优先级排序区域: APEI优先
            const sortedRegions = [...regions].sort((a, b) => {
                if (a.id === 'apei') return -1;
                if (b.id === 'apei') return 1;
                return 0;
            });
            
            let visibleCount = 0;
            
            allEntities.forEach(entity => {
                if (!entity.polygon || !entity.properties) return;
                
                // 找到实体所属的第一个匹配区域(优先级最高的)
                let belongsToRegion = null;
                
                for (const region of sortedRegions) {
                    if (matchRegionFilter(entity, region.filter)) {
                        belongsToRegion = region;
                        break; // 找到第一个匹配的区域就停止
                    }
                }
                
                // 只有当实体所属区域是激活状态时才显示
                const shouldShow = belongsToRegion && belongsToRegion.active;
                
                // 显示或隐藏实体
                entity.show = shouldShow;
                if (shouldShow) visibleCount++;
            });
            
            console.log(`✅ 区域筛选完成: ${visibleCount}/${allEntities.length} 个矿区可见`);
            
            // 强制渲染
            if (viewer) {
                viewer.scene.requestRender();
            }
        };
        
        /**
         * 飞到指定区域
         * @param {Object} region - 区域信息
         */
        const flyToRegion = (region) => {
            if (!viewer || !region || !region.center) return;
            
            console.log('✈️ 飞到区域:', region.label);
            
            viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(
                    region.center.lng,
                    region.center.lat,
                    region.center.height
                ),
                duration: 2.0,
                orientation: {
                    heading: 0,
                    pitch: Cesium.Math.toRadians(-90),
                    roll: 0
                }
            });
        };

        // 筛选逻辑（支持多选）
        const applyFilters = () => {
            if (!allEntities.length) return;
            
            const { minerals, oceans, countries } = props.filters;
            
            // 如果没有任何筛选条件，恢复所有矿区到初始状态
            const hasFilter = minerals.length > 0 || oceans.length > 0 || countries.length > 0;
            
            console.log('🔍 应用筛选:', { minerals, oceans, countries, hasFilter });
            
            let matchCount = 0;
            let totalCount = 0;
            
            allEntities.forEach(entity => {
                if (!entity.polygon || !entity.properties) return;
                
                if (!hasFilter) {
                    // 没有筛选条件：恢复初始状态
                    entity.polygon.material = entity._originalColor.withAlpha(0.8);
                    entity.polygon.outlineColor = Cesium.Color.WHITE.withAlpha(0.9);
                    entity.polygon.outlineWidth = 1;
                    entity.show = true;
                    return;
                }
                
                // 获取实体属性
                const entityMineral = entity.properties.mineral?.getValue();
                const entityLocation = entity.properties.location?.getValue();
                const entitySponsor = entity.properties.sponsor?.getValue();
                
                // 判断是否匹配筛选条件（联级筛选，多选为OR关系）
                let matches = true;
                
                // 矿种筛选（多选，OR关系）
                if (minerals.length > 0) {
                    let mineralMatch = false;
                    for (const mineral of minerals) {
                        if (entityMineral) {
                            // 直接匹配
                            if (entityMineral === mineral) {
                                mineralMatch = true;
                                break;
                            }
                            // 包含匹配（处理括号和缩写）
                            else if (entityMineral.includes(mineral)) {
                                mineralMatch = true;
                                break;
                            }
                            // 特殊处理：富钴结壳 vs 富钴铁锰结壳
                            else if (mineral === '富钴铁锰结壳' && entityMineral.includes('富钴结壳')) {
                                mineralMatch = true;
                                break;
                            }
                        }
                    }
                    if (!mineralMatch) {
                        matches = false;
                    }
                }
                
                // 大洋筛选（多选，OR关系）
                if (oceans.length > 0) {
                    let oceanMatch = false;
                    for (const ocean of oceans) {
                        const oceanKey = ocean.replace('洋', '');
                        if (entityLocation && entityLocation.includes(oceanKey)) {
                            oceanMatch = true;
                            break;
                        }
                    }
                    if (!oceanMatch) {
                        matches = false;
                    }
                }
                
                // 国家筛选（多选，OR关系）
                if (countries.length > 0) {
                    let countryMatch = false;
                    for (const country of countries) {
                        if (entitySponsor === country) {
                            countryMatch = true;
                            break;
                        }
                    }
                    if (!countryMatch) {
                        matches = false;
                    }
                }
                
                totalCount++;
                
                // 应用样式
                if (matches) {
                    matchCount++;
                    // 匹配：保持原色，黄色边框高亮
                    entity.polygon.material = entity._originalColor.withAlpha(0.8);
                    entity.polygon.outlineColor = Cesium.Color.YELLOW;
                    entity.polygon.outlineWidth = 3;
                    entity.show = true;
                } else {
                    // 不匹配：半透明显示
                    entity.polygon.material = entity._originalColor.withAlpha(0.2);
                    entity.polygon.outlineColor = Cesium.Color.WHITE.withAlpha(0.3);
                    entity.polygon.outlineWidth = 1;
                    entity.show = true;
                }
            });
            
            console.log(`✅ 筛选完成: ${matchCount}/${totalCount} 个矿区匹配`);
            
            // 强制渲染
            if (viewer) {
                viewer.scene.requestRender();
            }
        };
        
        // 监听筛选条件变化
        watch(() => props.filters, () => {
            applyFilters();
        }, { deep: true });

        // 监听图层控制变化（矿区地理分区控制）
        watch(() => props.layerState, (newRegions) => {
            applyRegionFilters(newRegions);
        }, { deep: true });
        
        // 监听气象图层控制变化
        watch(() => props.weatherLayerState, (newWeatherLayers) => {
            updateWeatherLayersVisibility(newWeatherLayers);
        }, { deep: true });
        
        // 监听船舶定位请求
        watch(() => props.shipToLocate, (ship) => {
            if (ship && shipLayer) {
                // 添加船舶到地图
                shipLayer.addShip(ship);
                // 飞到船舶位置
                shipLayer.flyToShip(ship.mmsi);
            }
        }, { deep: true });
        
        // 监听路径绘制请求
        watch(() => props.routeToDraw, (routeData) => {
            if (!routeData || !routeLayer) return;
            
            console.log('🗺️ 收到路径绘制请求:', routeData);
            
            if (routeData.action === 'draw' && routeData.route) {
                // 绘制路径
                routeLayer.drawRoute(routeData.route, {
                    startPort: routeData.startPort,
                    endPort: routeData.endPort,
                    lineColor: Cesium.Color.PURPLE.withAlpha(0.8),
                    lineWidth: 4,
                    showArrows: true
                });
                
                // 飞到航线视角
                setTimeout(() => {
                    routeLayer.flyToRoute();
                }, 500);
                
                console.log('✅ 航线已绘制到地图');
            } else if (routeData.action === 'clear') {
                // 清除路径
                routeLayer.clearRoute();
                
                // 清除选点标记
                if (pickPointMarkers.start) {
                    viewer.entities.remove(pickPointMarkers.start);
                    pickPointMarkers.start = null;
                }
                if (pickPointMarkers.end) {
                    viewer.entities.remove(pickPointMarkers.end);
                    pickPointMarkers.end = null;
                }
                // 清除避让点标记
                pickPointMarkers.avoid.forEach(marker => {
                    viewer.entities.remove(marker);
                });
                pickPointMarkers.avoid = [];
                // 清除途经点标记
                pickPointMarkers.through.forEach(marker => {
                    viewer.entities.remove(marker);
                });
                pickPointMarkers.through = [];
                
                console.log('🗑️ 航线和标记已清除');
            }
        }, { deep: true });
        
        // 监听历史轨迹绘制请求
        watch(() => props.trackToDraw, (trackData) => {
            if (!trackData || !viewer) return;
            
            console.log('📈 收到轨迹绘制请求:', trackData);
            
            if (trackData.action === 'draw' && trackData.track) {
                // 先清除之前的轨迹（避免重复添加）
                const existingTrack = viewer.entities.getById('ship-track');
                if (existingTrack) viewer.entities.remove(existingTrack);
                
                const existingStart = viewer.entities.getById('track-start');
                if (existingStart) viewer.entities.remove(existingStart);
                
                const existingEnd = viewer.entities.getById('track-end');
                if (existingEnd) viewer.entities.remove(existingEnd);
                
                // 构建轨迹点位置数组
                const positions = trackData.track.map(point => 
                    Cesium.Cartesian3.fromDegrees(point.lng, point.lat)
                );
                
                if (positions.length > 0) {
                    // 绘制轨迹线 - 蓝色粗线
                    viewer.entities.add({
                        id: 'ship-track',
                        name: `船舶轨迹 (MMSI: ${trackData.mmsi})`,
                        polyline: {
                            positions: positions,
                            width: 6,
                            material: new Cesium.PolylineGlowMaterialProperty({
                                glowPower: 0.3,
                                color: Cesium.Color.CYAN.withAlpha(0.95)
                            }),
                            clampToGround: false
                        }
                    });
                    
                    // 添加起点和终点标记
                    const startPoint = trackData.track[0];
                    const endPoint = trackData.track[trackData.track.length - 1];
                    
                    viewer.entities.add({
                        id: 'track-start',
                        position: Cesium.Cartesian3.fromDegrees(startPoint.lng, startPoint.lat),
                        point: {
                            pixelSize: 12,
                            color: Cesium.Color.GREEN,
                            outlineColor: Cesium.Color.WHITE,
                            outlineWidth: 3
                        },
                        label: {
                            text: '起点',
                            font: '16px sans-serif',
                            fillColor: Cesium.Color.WHITE,
                            outlineColor: Cesium.Color.BLACK,
                            outlineWidth: 2,
                            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                            pixelOffset: new Cesium.Cartesian2(0, -12)
                        }
                    });
                    
                    viewer.entities.add({
                        id: 'track-end',
                        position: Cesium.Cartesian3.fromDegrees(endPoint.lng, endPoint.lat),
                        point: {
                            pixelSize: 12,
                            color: Cesium.Color.RED,
                            outlineColor: Cesium.Color.WHITE,
                            outlineWidth: 3
                        },
                        label: {
                            text: '终点',
                            font: '16px sans-serif',
                            fillColor: Cesium.Color.WHITE,
                            outlineColor: Cesium.Color.BLACK,
                            outlineWidth: 2,
                            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                            pixelOffset: new Cesium.Cartesian2(0, -12)
                        }
                    });
                    
                    // 飞到轨迹视角
                    setTimeout(() => {
                        const trackEntity = viewer.entities.getById('ship-track');
                        if (trackEntity) {
                            viewer.flyTo(trackEntity, {
                                duration: 2,
                                offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-45), positions.length > 100 ? 500000 : 200000)
                            });
                        }
                    }, 300);
                    
                    console.log(`✅ 已绘制 ${positions.length} 个轨迹点`);
                }
            } else if (trackData.action === 'clear') {
                // 清除轨迹
                const existingTrack = viewer.entities.getById('ship-track');
                if (existingTrack) viewer.entities.remove(existingTrack);
                
                const existingStart = viewer.entities.getById('track-start');
                if (existingStart) viewer.entities.remove(existingStart);
                
                const existingEnd = viewer.entities.getById('track-end');
                if (existingEnd) viewer.entities.remove(existingEnd);
                
                console.log('🗑️ 轨迹已清除');
            }
        }, { deep: true });
        
        // 监听航线气象分析请求
        watch(() => props.routeWeatherRequest, async (request) => {
            if (!request || !routeWeatherLayer) return;
            
            // 处理清除气象数据的请求
            if (request.action === 'clear') {
                console.log('🗑️ 清除航线气象数据');
                routeWeatherLayer.clear();
                return;
            }
            
            console.log('🌦️ 收到航线气象分析请求:', request);
            
            try {
                let stats;
                
                // 判断是刷新还是新分析
                if (request.refresh && routeWeatherLayer.weatherData.length > 0) {
                    // 刷新现有数据
                    stats = await routeWeatherLayer.refreshWeatherData((current, total) => {
                        console.log(`🔄 刷新气象数据进度: ${current}/${total}`);
                    });
                } else {
                    // 执行新的气象分析（支持船速、起始时间和自定义阈值）
                    const options = {
                        shipSpeed: request.shipSpeed || 15, // 默认15节
                        startTime: request.startTime || new Date(),
                        thresholds: customThresholds // 使用自定义阈值
                    };
                    
                    stats = await routeWeatherLayer.analyzeRoute(
                        request.route, 
                        options,
                        (current, total) => {
                            console.log(`⏳ 气象数据获取进度: ${current}/${total}`);
                        }
                    );
                }
                
                console.log('✅ 航线气象分析完成:', stats);
                console.log(`   - 总采样点: ${stats.total}`);
                console.log(`   - 安全: ${stats.safe}, 注意: ${stats.caution}, 警告: ${stats.warning}, 危险: ${stats.danger}`);
                console.log(`   - 平均风速: ${stats.avgWindSpeed} m/s, 最大风速: ${stats.maxWindSpeed} m/s`);
                console.log(`   - 平均浪高: ${stats.avgWaveHeight} m, 最大浪高: ${stats.maxWaveHeight} m`);
                
                // 发送气象数据给父组件
                emit('weatherDataLoaded', {
                    data: routeWeatherLayer.weatherData,
                    stats: stats
                });
            } catch (error) {
                console.error('❌ 航线气象分析失败:', error);
            }
        }, { deep: true });
        
        // 监听气象筛选条件变化
        watch(() => props.weatherFilter, (filters) => {
            if (routeWeatherLayer && filters) {
                console.log('🔍 应用气象筛选:', filters);
                routeWeatherLayer.filterMarkers(filters);
            }
        }, { deep: true });
        
        // 监听地图选点状态变化
        watch(() => props.pickingPointType, (newType) => {
            console.log('📍 选点状态变化:', newType);
            console.log('   - viewer 存在:', !!viewer);
            console.log('   - pickPointHandler 存在:', !!pickPointHandler);
            
            if (!newType) {
                // 取消选点模式
                if (pickPointHandler) {
                    pickPointHandler.destroy();
                    pickPointHandler = null;
                }
                console.log('❌ 取消地图选点');
                return;
            }
            
            // 移除旧的处理器
            if (pickPointHandler) {
                console.log('🗑️ 移除旧的点击处理器');
                pickPointHandler.destroy();
            }
            
            // 创建新的点击处理器
            if (!viewer) {
                console.error('❌ viewer 不存在，无法创建点击处理器');
                return;
            }
            
            console.log('✅ 创建新的点击处理器');
            
            pickPointHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
            
            pickPointHandler.setInputAction((click) => {
                console.log('🖱️ 地图被点击了！类型:', newType);
                
                // 计算 CSS scale 缩放比例
                const baseWidth = 1920;
                const baseHeight = 1080;
                const scaleX = window.innerWidth / baseWidth;
                const scaleY = window.innerHeight / baseHeight;
                
                // 修正点击坐标
                const correctedPosition = new Cesium.Cartesian2(
                    click.position.x / scaleX,
                    click.position.y / scaleY
                );
                
                // 获取点击位置的笛卡尔坐标
                const cartesian = viewer.camera.pickEllipsoid(correctedPosition, viewer.scene.globe.ellipsoid);
                
                if (cartesian) {
                    // 转换为经纬度
                    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                    const lng = Cesium.Math.toDegrees(cartographic.longitude);
                    const lat = Cesium.Math.toDegrees(cartographic.latitude);
                    
                    console.log(`📍 选择了位置 (${newType}): ${lng.toFixed(6)}, ${lat.toFixed(6)}`);
                    
                    // 根据类型确定标记样式
                    let markerColor, markerLabel, markerText;
                    
                    switch (newType) {
                        case 'start':
                            markerColor = '#22c55e'; // 绿色
                            markerLabel = '起点';
                            markerText = 'A';
                            break;
                        case 'end':
                            markerColor = '#ef4444'; // 红色
                            markerLabel = '终点';
                            markerText = 'B';
                            break;
                        case 'avoid':
                            markerColor = '#f97316'; // 橙色
                            markerLabel = '避让点';
                            markerText = 'X'; // 使用 ASCII 字符
                            break;
                        case 'through':
                            markerColor = '#3b82f6'; // 蓝色
                            markerLabel = '途经点';
                            markerText = 'T'; // 使用 ASCII 字符
                            break;
                        default:
                            markerColor = '#6b7280'; // 灰色
                            markerLabel = '选点';
                            markerText = '?';
                    }
                    
                    // 创建标记
                    const marker = viewer.entities.add({
                        position: Cesium.Cartesian3.fromDegrees(lng, lat),
                        billboard: {
                            image: 'data:image/svg+xml;base64,' + window.btoa(`
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="48" viewBox="0 0 32 48">
                                    <path d="M16 0C7.2 0 0 7.2 0 16c0 8.8 16 32 16 32s16-23.2 16-32C32 7.2 24.8 0 16 0z" fill="${markerColor}" stroke="#fff" stroke-width="2"/>
                                    <circle cx="16" cy="16" r="6" fill="#fff"/>
                                    <text x="16" y="20" text-anchor="middle" font-size="10" fill="${markerColor}" font-weight="bold">${markerText}</text>
                                </svg>
                            `),
                            width: 32,
                            height: 48,
                            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                        },
                        label: {
                            text: markerLabel,
                            font: '14px sans-serif',
                            fillColor: Cesium.Color.WHITE,
                            outlineColor: Cesium.Color.BLACK,
                            outlineWidth: 2,
                            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                            verticalOrigin: Cesium.VerticalOrigin.TOP,
                            pixelOffset: new Cesium.Cartesian2(0, 5),
                            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                        }
                    });
                    
                    // 保存标记
                    if (newType === 'start' || newType === 'end') {
                        // 起点/终点：替换旧标记
                        if (pickPointMarkers[newType]) {
                            viewer.entities.remove(pickPointMarkers[newType]);
                        }
                        pickPointMarkers[newType] = marker;
                    } else if (newType === 'avoid') {
                        // 避让点：添加到数组
                        pickPointMarkers.avoid.push(marker);
                    } else if (newType === 'through') {
                        // 途经点：添加到数组
                        pickPointMarkers.through.push(marker);
                    }
                    
                    // 发送选点结果
                    emit('pointPicked', lng, lat);
                    
                    // 清理处理器
                    pickPointHandler.destroy();
                    pickPointHandler = null;
                }
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
            
            const typeNames = {
                'start': '起点',
                'end': '终点',
                'avoid': '避让点',
                'through': '途经点'
            };
            console.log(`🖱️ 开始地图选点模式: ${typeNames[newType] || newType}`);
        });
        
        // 根据图层状态更新风场显示
        const updateWindVisibility = async (layers) => {
            if (!viewer) return;
            
            // 查找风场图层的状态
            let windEnabled = false;
            for (const layer of layers) {
                if (layer.id === 'env_monitor' && layer.active && layer.subLayers) {
                    const windSub = layer.subLayers.find(s => s.id === 'wind');
                    if (windSub && windSub.active) {
                        windEnabled = true;
                        break;
                    }
                }
            }
            
            console.log('🌬️ 风场图层状态（矿区图层控制）:', windEnabled);
            
            if (windEnabled && !windLayer) {
                // 需要显示但未初始化，初始化风场
                await initWindLayer();
                if (windLayer) {
                    windLayer.show = true;
                    showWind.value = true;
                    viewer.scene.requestRenderMode = false;
                }
            } else if (windEnabled && windLayer) {
                // 需要显示且已初始化，显示风场
                windLayer.show = true;
                showWind.value = true;
                viewer.scene.requestRenderMode = false;
            } else if (!windEnabled && windLayer) {
                // 不需要显示，隐藏风场
                windLayer.show = false;
                showWind.value = false;
                viewer.scene.requestRenderMode = true;
            }
        };
        
        // 根据气象图层状态更新显示
        const updateWeatherLayersVisibility = async (weatherLayers) => {
            if (!viewer) return;
            
            console.log('🌦️ 更新气象图层显示状态:', weatherLayers);
            
            // 处理 Windy 图层
            for (const group of weatherLayers) {
                if (group.id === 'windy' && group.subLayers) {
                    for (const subLayer of group.subLayers) {
                        if (subLayer.type === 'windy' && subLayer.layer) {
                            if (subLayer.active) {
                                // 激活 Windy 图层
                                if (!windyLayerManager) {
                                    windyLayerManager = new WindyLayerManager(viewer);
                                }
                                console.log(`✅ 显示 Windy 图层: ${subLayer.label} (${subLayer.layer})`);
                                await windyLayerManager.showLayer(subLayer.layer);
                            } else {
                                // 隐藏 Windy 图层
                                if (windyLayerManager) {
                                    console.log(`🙈 隐藏 Windy 图层: ${subLayer.label}`);
                                    windyLayerManager.hideLayer();
                                }
                            }
                        }
                    }
                }
                
                // 处理 OpenWeatherMap 图层
                if (group.id === 'openweathermap' && group.subLayers) {
                    if (!owmLayerManager) continue;
                    
                    for (const subLayer of group.subLayers) {
                        if (subLayer.type === 'imagery' && subLayer.url) {
                            if (subLayer.active) {
                                // 激活图层：添加到地图
                                if (!owmLayerManager.hasLayer(subLayer.id)) {
                                    console.log(`✅ 添加 OpenWeatherMap 图层: ${subLayer.label}`);
                                    owmLayerManager.addLayer(subLayer.id, subLayer.url, {
                                        alpha: 0.9  // 提高透明度到90%，更清晰可见
                                    });
                                } else {
                                    // 图层已存在，只需显示
                                    owmLayerManager.toggleLayer(subLayer.id, true);
                                }
                            } else {
                                // 取消激活：隐藏或移除图层
                                if (owmLayerManager.hasLayer(subLayer.id)) {
                                    console.log(`🙈 隐藏 OpenWeatherMap 图层: ${subLayer.label}`);
                                    owmLayerManager.removeLayer(subLayer.id);
                                }
                            }
                        }
                    }
                }
                
                // 处理基础气象图层（风场、波浪）
                if (group.id === 'basic_weather' && group.active && group.subLayers) {
                    // 处理风场图层
                    const windSub = group.subLayers.find(s => s.id === 'wind');
                    if (windSub && windSub.active) {
                        // 需要显示风场
                        if (!windLayer) {
                            // 未初始化，初始化风场
                            await initWindLayer();
                            if (windLayer) {
                                windLayer.show = true;
                                showWind.value = true;
                                viewer.scene.requestRenderMode = false;
                            }
                        } else {
                            // 已初始化，显示风场
                            windLayer.show = true;
                            showWind.value = true;
                            viewer.scene.requestRenderMode = false;
                        }
                    } else if (windLayer) {
                        // 不需要显示，隐藏风场
                        windLayer.show = false;
                        showWind.value = false;
                        viewer.scene.requestRenderMode = true;
                    }
                    
                    // 处理波浪图层
                    const waveSub = group.subLayers.find(s => s.id === 'wave');
                    if (waveSub && waveSub.active) {
                        // 需要显示波浪
                        if (!waveLayer) {
                            // 未初始化，初始化波浪
                            await initWaveLayer();
                            if (waveLayer) {
                                waveLayer.show = true;
                                showWave.value = true;
                                viewer.scene.requestRenderMode = false;
                            }
                        } else {
                            // 已初始化，显示波浪
                            waveLayer.show = true;
                            showWave.value = true;
                            viewer.scene.requestRenderMode = false;
                        }
                    } else if (waveLayer) {
                        // 不需要显示，隐藏波浪
                        waveLayer.show = false;
                        showWave.value = false;
                        viewer.scene.requestRenderMode = true;
                        // 停止相机高度监控
                        stopCameraHeightMonitoring();
                    }
                    
                    // 处理洋流图层
                    const oceanCurrentSub = group.subLayers.find(s => s.id === 'current');
                    if (oceanCurrentSub && oceanCurrentSub.active) {
                        // 需要显示洋流
                        if (!oceanCurrentLayer) {
                            // 未初始化，初始化洋流
                            await initOceanCurrentLayer();
                            if (oceanCurrentLayer) {
                                oceanCurrentLayer.show = true;
                                showOceanCurrent.value = true;
                                viewer.scene.requestRenderMode = false;
                            }
                        } else {
                            // 已初始化，显示洋流
                            oceanCurrentLayer.show = true;
                            showOceanCurrent.value = true;
                            viewer.scene.requestRenderMode = false;
                        }
                    } else if (oceanCurrentLayer) {
                        // 不需要显示，隐藏洋流
                        oceanCurrentLayer.show = false;
                        showOceanCurrent.value = false;
                        viewer.scene.requestRenderMode = true;
                    }
                }
                
                // 处理极端环境图层（内波）
                if (group.id === 'extreme_environment' && group.active && group.subLayers) {
                    // 处理内波图层
                    const internalWaveSub = group.subLayers.find(s => s.id === 'internal_wave');
                    console.log('🔍 检查内波图层:', { 
                        groupId: group.id, 
                        found: !!internalWaveSub, 
                        active: internalWaveSub?.active 
                    });
                    if (internalWaveSub && internalWaveSub.active) {
                        console.log('✅ 内波图层需要显示');
                        // 需要显示内波
                        if (!internalWaveLayer) {
                            console.log('⏳ 初始化内波图层...');
                            // 未初始化，初始化内波
                            await initInternalWaveLayer();
                            if (internalWaveLayer) {
                                internalWaveLayer.show = true;
                                showInternalWave.value = true;
                                viewer.scene.requestRenderMode = false;
                                console.log('✅ 内波图层已显示');
                            }
                        } else {
                            console.log('✅ 内波图层已存在，直接显示');
                            // 已初始化，显示内波
                            internalWaveLayer.show = true;
                            showInternalWave.value = true;
                            viewer.scene.requestRenderMode = false;
                        }
                    } else if (internalWaveLayer) {
                        console.log('🙈 隐藏内波图层');
                        // 不需要显示，隐藏内波
                        internalWaveLayer.show = false;
                        showInternalWave.value = false;
                        viewer.scene.requestRenderMode = true;
                    }
                }
            }
        };

        onMounted(() => {
            setTimeout(initCesium, 100);
        });

        onUnmounted(() => {
            // 停止相机高度监控
            stopCameraHeightMonitoring();
            
            if (windLayer) {
                windLayer.remove();
                windLayer = null;
            }
            if (waveLayer) {
                waveLayer.remove();
                waveLayer = null;
            }
            if (oceanCurrentLayer) {
                oceanCurrentLayer.remove();
                oceanCurrentLayer = null;
            }
            if (internalWaveLayer) {
                internalWaveLayer.remove();
                internalWaveLayer = null;
            }
            if (clickHandler) {
                clickHandler.destroy();
            }
            if (shipLayer) {
                shipLayer.clearAll();
                shipLayer = null;
            }
            if (routeLayer) {
                routeLayer.clearRoute();
                routeLayer = null;
            }
            if (routeWeatherLayer) {
                routeWeatherLayer.clear();
                routeWeatherLayer = null;
            }
            if (owmLayerManager) {
                owmLayerManager.clearAll();
                owmLayerManager = null;
            }
            if (windyLayerManager) {
                windyLayerManager.destroy();
                windyLayerManager = null;
            }
            if (windLayer) {
                windLayer.destroy();
                windLayer = null;
            }
            if (viewer) {
                viewer.destroy();
            }
        });

        // 暴露viewer给父组件使用
        const getViewer = () => viewer;
        
        /**
         * 更新气象数据时间帧
         * @param {Number} timeIndex - 时间索引
         */
        const updateWeatherTime = async (timeIndex) => {
            console.log('⏰ 更新气象数据时间帧:', timeIndex);
            
            try {
                // 更新波浪数据
                if (showWave.value && waveLayer) {
                    console.log('🌊 重新加载波浪数据，时间帧:', timeIndex);
                    const newWaveData = await loadGlobalWaveData(timeIndex);
                    
                    // 彻底移除旧图层
                    try {
                        waveLayer.remove();
                        waveLayer = null;
                    } catch (e) {
                        console.warn('移除旧波浪图层时出错:', e);
                    }
                    
                    // 等待一帧，确保旧图层完全清理
                    await new Promise(resolve => setTimeout(resolve, 50));
                    
                    // 动态导入 cesium-wind-layer
                    const { WindLayer } = await import('cesium-wind-layer');
                    
                    // 创建新图层（使用相同的配置）
                    waveLayer = new WindLayer(viewer, newWaveData, {
                        particlesTextureSize: 640,
                        particleHeight: 0,
                        lineWidth: { min: 6, max: 10 },
                        lineLength: { min: 30, max: 60 },
                        speedFactor: 1.0,
                        dropRate: 0.006,
                        dropRateBump: 0.002,
                        colors: [
                            'rgba(0, 98, 255, 1)',      // 深蓝（低波高）
                            'rgba(0, 180, 255, 1)',     // 青色
                            'rgba(0, 255, 200, 1)',     // 青绿
                            'rgba(100, 255, 100, 1)',   // 绿色
                            'rgba(255, 255, 0, 1)',     // 黄色
                            'rgba(255, 150, 0, 1)',     // 橙色
                            'rgba(255, 50, 0, 1)'       // 红色（高波高）
                        ],
                        displayRange: { min: 0, max: 10 },
                        flipY: false,
                        // 启用热力图模式（类似Windy）
                        useColorScale: true,  // 显示颜色热力图
                        fadeOpacity: 0.95     // 热力图透明度
                    });
                    
                    waveLayer.show = true;
                    cachedWaveData = newWaveData;
                    
                    // 暂时禁用热力图更新
                    /*
                    // 更新热力图
                    if (waveHeatmap) {
                        const colorScale = [
                            'rgba(0, 0, 139, 1)',
                            'rgba(0, 0, 255, 1)',
                            'rgba(0, 191, 255, 1)',
                            'rgba(0, 255, 255, 1)',
                            'rgba(0, 255, 127, 1)',
                            'rgba(173, 255, 47, 1)',
                            'rgba(255, 255, 0, 1)',
                            'rgba(255, 165, 0, 1)',
                            'rgba(255, 69, 0, 1)',
                            'rgba(255, 0, 0, 1)'
                        ];
                        
                        waveHeatmap.createHeatmap(newWaveData, colorScale, {
                            alpha: 0.7,
                            bounds: newWaveData.bounds
                        });
                    }
                    */
                    
                    console.log('✅ 波浪数据已更新');
                    console.log('   📊 新数据统计:');
                    console.log('   - 时间帧:', timeIndex);
                    console.log('   - 数据点:', newWaveData.width, 'x', newWaveData.height);
                }
                
                // 更新洋流数据
                if (showOceanCurrent.value && oceanCurrentLayer) {
                    console.log('🌊 重新加载洋流数据，时间帧:', timeIndex);
                    const newCurrentData = await loadGlobalOceanCurrentData(timeIndex);
                    
                    // 彻底移除旧图层
                    try {
                        oceanCurrentLayer.remove();
                        oceanCurrentLayer = null;
                    } catch (e) {
                        console.warn('移除旧洋流图层时出错:', e);
                    }
                    
                    // 等待一帧，确保旧图层完全清理
                    await new Promise(resolve => setTimeout(resolve, 50));
                    
                    // 动态导入 cesium-wind-layer
                    const { WindLayer } = await import('cesium-wind-layer');
                    
                    // 创建新图层（使用相同的配置）
                    oceanCurrentLayer = new WindLayer(viewer, newCurrentData, {
                        particlesTextureSize: 640,
                        particleHeight: 0,
                        lineWidth: { min: 1.5, max: 3.5 },
                        lineLength: { min: 300, max: 700 },
                        speedFactor: 1.8,
                        dropRate: 0.003,
                        dropRateBump: 0.001,
                        colors: [
                            'rgba(0, 30, 80, 0.75)',
                            'rgba(0, 60, 120, 0.8)',
                            'rgba(0, 100, 160, 0.85)',
                            'rgba(0, 140, 200, 0.88)',
                            'rgba(0, 180, 240, 0.9)',
                            'rgba(0, 220, 255, 0.92)',
                            'rgba(50, 240, 255, 0.95)',
                            'rgba(100, 255, 255, 0.97)',
                            'rgba(150, 255, 200, 0.98)',
                            'rgba(200, 255, 150, 1.0)'
                        ],
                        flipY: false,
                        dynamic: true,
                        useColorScale: true,
                        fadeOpacity: 0.92
                    });
                    
                    oceanCurrentLayer.show = true;
                    cachedOceanCurrentData = newCurrentData;
                    
                    console.log('✅ 洋流数据已更新');
                }
                
                // 更新风场数据
                if (showWind.value && windLayer) {
                    console.log('🌬️  重新加载风场数据，时间帧:', timeIndex);
                    const newWindData = await loadGlobalWindData(timeIndex);
                    
                    // 彻底移除旧图层
                    try {
                        windLayer.remove();
                        windLayer = null;
                    } catch (e) {
                        console.warn('移除旧风场图层时出错:', e);
                    }
                    
                    // 等待一帧，确保旧图层完全清理
                    await new Promise(resolve => setTimeout(resolve, 50));
                    
                    // 动态导入 cesium-wind-layer
                    const { WindLayer } = await import('cesium-wind-layer');
                    
                    // 创建新图层（使用相同的配置）
                    windLayer = new WindLayer(viewer, newWindData, {
                        particlesTextureSize: 640,
                        particleHeight: 100000,
                        lineWidth: { min: 1.5, max: 4 },
                        lineLength: { min: 100, max: 200 },
                        speedFactor: 1.5,
                        dropRate: 0.003,
                        dropRateBump: 0.001,
                        colors: [
                            'rgba(0, 98, 255, 1)',
                            'rgba(0, 180, 255, 1)',
                            'rgba(0, 255, 200, 1)',
                            'rgba(100, 255, 100, 1)',
                            'rgba(255, 255, 0, 1)',
                            'rgba(255, 150, 0, 1)',
                            'rgba(255, 50, 0, 1)'
                        ],
                        displayRange: { min: 0, max: 30 },
                        flipY: false,
                        useColorScale: true,
                        fadeOpacity: 0.95
                    });
                    
                    windLayer.show = true;
                    cachedWindData = newWindData;
                    
                    console.log('✅ 风场数据已更新');
                }
                
                // 更新内波数据
                if (showInternalWave.value && internalWaveLayer) {
                    console.log('🌊 重新加载内波数据，时间帧:', timeIndex);
                    const newInternalWaveData = await loadGlobalInternalWaveData(timeIndex);
                    
                    // 彻底移除旧图层
                    try {
                        internalWaveLayer.remove();
                        internalWaveLayer = null;
                    } catch (e) {
                        console.warn('移除旧内波图层时出错:', e);
                    }
                    
                    // 等待一帧，确保旧图层完全清理
                    await new Promise(resolve => setTimeout(resolve, 50));
                    
                    // 动态导入 cesium-wind-layer
                    const { WindLayer } = await import('cesium-wind-layer');
                    
                    // 创建新图层（使用相同的配置）
                    internalWaveLayer = new WindLayer(viewer, newInternalWaveData, {
                        particlesTextureSize: 640,
                        particleHeight: 1000,
                        lineWidth: { min: 3.0, max: 6.0 },
                        lineLength: { min: 80, max: 180 },
                        speedFactor: 0.3,
                        dropRate: 0.002,
                        dropRateBump: 0.001,
                        displayRange: { min: 0, max: 100 },
                        colors: [
                            'rgba(0, 255, 255, 1)',
                            'rgba(0, 255, 255, 1)',
                            'rgba(50, 255, 255, 1)',
                            'rgba(100, 255, 255, 1)',
                            'rgba(150, 255, 255, 1)',
                            'rgba(200, 255, 255, 1)',
                            'rgba(255, 255, 255, 1)',
                            'rgba(255, 255, 255, 1)',
                            'rgba(255, 255, 255, 1)',
                            'rgba(255, 255, 255, 1)'
                        ],
                        flipY: true,
                        dynamic: true,
                        useColorScale: true,
                        fadeOpacity: 0.98
                    });
                    
                    internalWaveLayer.show = true;
                    cachedInternalWaveData = newInternalWaveData;
                    
                    console.log('✅ 内波数据已更新');
                }
                
                // 强制刷新场景
                if (viewer) {
                    viewer.scene.requestRender();
                }
            } catch (error) {
                console.error('❌ 更新气象数据失败:', error);
            }
        };
        
        return {
            cesiumContainer,
            selectedArea,
            infoPosition,
            closeInfo,
            is3D,
            showWind,
            showTrajectory,
            selectedShip,
            shipInfoPosition,
            closeShipInfo,
            selectedWeather,
            weatherInfoPosition,
            closeWeatherInfo,
            getShipTypeName,
            getNavigationStatus,
            isEtaExpired,
            showRoutePlan,
            toggleRoutePlan,
            handleRoutePlanned,
            handleRouteCleared,
            handlePickPoint,  // 暴露地图选点处理函数
            handleThresholdsChanged,  // 暴露阈值变化处理函数
            updateWeatherTime,  // 暴露时间更新函数
            flyToRegion,  // 暴露区域定位函数
            zoomIn,
            zoomOut,
            resetView,
            toggle2D3D,
            toggleFullscreen,
            toggleTrajectory,
            viewer: getViewer,  // 暴露viewer
            // 气象点查询相关
            weatherPickedPoint,
            currentWeatherLayer,
            weatherDataCache,
            weatherTimeSteps,
            currentTimeIndex,
            closeWeatherPicker
        };
    }
};
</script>

<style scoped>
/* 自定义地图工具按钮 - 增强版 */
.map-tool-btn {
    width: 3.5rem;
    height: 3.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9));
    border: 2px solid rgba(6, 182, 212, 0.6);
    color: #06b6d4;
    transition: all 0.3s ease;
    backdrop-filter: blur(12px);
    clip-path: polygon(0 0, 100% 0, 100% 80%, 80% 100%, 0 100%);
    cursor: pointer;
    box-shadow: 
        0 0 15px rgba(6, 182, 212, 0.3),
        inset 0 0 10px rgba(6, 182, 212, 0.1);
}

/* 按钮发光边框效果 */
.map-tool-btn::before {
    content: '';
    position: absolute;
    inset: -2px;
    background: linear-gradient(45deg, transparent, rgba(6, 182, 212, 0.4), transparent);
    clip-path: polygon(0 0, 100% 0, 100% 80%, 80% 100%, 0 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: -1;
}

.map-tool-btn:hover::before {
    opacity: 1;
}

.map-tool-btn:hover {
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.9), rgba(8, 145, 178, 0.95));
    color: #000;
    border-color: rgba(255, 255, 255, 0.9);
    box-shadow: 
        0 0 30px rgba(6, 182, 212, 0.8),
        0 0 20px rgba(255, 255, 255, 0.6),
        inset 0 0 20px rgba(255, 255, 255, 0.3);
    transform: translateX(-6px) scale(1.05);
}

.map-tool-btn:active {
    transform: translateX(-6px) scale(0.98);
    box-shadow: 
        0 0 20px rgba(6, 182, 212, 0.6),
        inset 0 0 15px rgba(0, 0, 0, 0.3);
}

/* 图标增强 */
.map-tool-btn svg {
    filter: drop-shadow(0 0 2px rgba(6, 182, 212, 0.5));
    transition: filter 0.3s ease;
}

.map-tool-btn:hover svg {
    filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.9));
}

/* 工具栏滑入动画 */
.toolbar-slide-enter-active,
.toolbar-slide-leave-active {
    transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.toolbar-slide-enter-from {
    opacity: 0;
    transform: translateX(30px) scale(0.8);
}

.toolbar-slide-leave-to {
    opacity: 0;
    transform: translateX(30px) scale(0.8);
}

/* 每个按钮延迟动画 */
.map-tool-btn:nth-child(1) {
    animation: slideIn 0.3s ease 0.1s both;
}

.map-tool-btn:nth-child(2) {
    animation: slideIn 0.3s ease 0.15s both;
}

.map-tool-btn:nth-child(3) {
    animation: slideIn 0.3s ease 0.2s both;
}

.map-tool-btn:nth-child(4) {
    animation: slideIn 0.3s ease 0.25s both;
}

.map-tool-btn:nth-child(5) {
    animation: slideIn 0.3s ease 0.3s both;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateX(20px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}
</style>