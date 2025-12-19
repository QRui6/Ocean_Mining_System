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
            v-if="showRoutePlan"
            @close="showRoutePlan = false"
            @routePlanned="handleRoutePlanned"
            @routeCleared="handleRouteCleared"
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
import { ShipTrajectoryLayer, sampleTrajectories } from '../utils/shipTrajectory.js';
import { ShipLayer } from '../utils/shipLayer.js';
import { RouteLayer } from '../utils/routeLayer.js';
import { RouteWeatherLayer } from '../utils/routeWeatherLayer.js';
import RoutePlanPanel from './RoutePlanPanel.vue';

export default {
    components: {
        RoutePlanPanel
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
        }
    },
    emits: ['dataLoaded', 'weatherDataLoaded'],
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
                imageryProvider: new Cesium.WebMapTileServiceImageryProvider({
                    url: `https://t0.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=${TDT_TOKEN}`,
                    layer: "img",
                    style: "default",
                    format: "tiles",
                    tileMatrixSetID: "w",
                    credit: new Cesium.Credit("天地图"),
                    maximumLevel: 18
                }),
                sceneMode: Cesium.SceneMode.SCENE3D
            });

            // 添加天地图注记图层
            viewer.imageryLayers.addImageryProvider(
                new Cesium.WebMapTileServiceImageryProvider({
                    url: `https://t0.tianditu.gov.cn/cia_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cia&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=${TDT_TOKEN}`,
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
                
                // 发送数据给父组件
                emit('dataLoaded', {
                    countries: Array.from(countries).sort(),
                    miningData: miningData
                });

                // 改进的点击事件处理（修正 CSS scale 导致的坐标偏差）
                const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
                handler.setInputAction((click) => {
                    // 恢复上一个选中实体的样式
                    if (previousEntity && previousEntity.polygon && previousEntity._originalColor) {
                        previousEntity.polygon.material = previousEntity._originalColor.withAlpha(0.8);
                        previousEntity.polygon.outlineColor = Cesium.Color.WHITE.withAlpha(0.9);
                        previousEntity.polygon.outlineWidth = 1;
                    }
                    
                    // 计算 CSS scale 缩放比例（App.vue 中的缩放）
                    const baseWidth = 1920;
                    const baseHeight = 1080;
                    const scaleX = window.innerWidth / baseWidth;
                    const scaleY = window.innerHeight / baseHeight;
                    
                    console.log('🔍 缩放比例:', { scaleX, scaleY });
                    console.log('🖱️ 原始点击坐标:', click.position);
                    
                    // 修正点击坐标（除以缩放比例）
                    const correctedPosition = new Cesium.Cartesian2(
                        click.position.x / scaleX,
                        click.position.y / scaleY
                    );
                    
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
                                x: Math.min(correctedPosition.x + 20, window.innerWidth / scaleX - 370),
                                y: Math.max(correctedPosition.y - 100, 10)
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
                                    x: Math.min(correctedPosition.x + 20, window.innerWidth / scaleX - 370),
                                    y: Math.max(correctedPosition.y - 100, 10)
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
                                        x: Math.min(correctedPosition.x + 20, window.innerWidth / scaleX - 370),
                                        y: Math.max(correctedPosition.y - 100, 10)
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
                        
                        // 容器尺寸（缩放前的基准尺寸）
                        const containerWidth = baseWidth;
                        const containerHeight = baseHeight;
                        
                        // 默认：点击位置作为面板左上角
                        let x = correctedPosition.x;
                        let y = correctedPosition.y;
                        
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
                            correctedClickX: correctedPosition.x,
                            correctedClickY: correctedPosition.y,
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
            
            // 如果风场正在显示，先隐藏（因为风场在2D模式下不支持）
            const windWasVisible = showWind.value;
            if (windWasVisible && windLayer) {
                console.log('⚠️ 2D模式不支持风场显示，自动隐藏风场');
                windLayer.show = false;
                showWind.value = false;
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
                const windData = await loadGlobalWindData();
                console.log('✅ 数据加载成功，数据点:', windData.sparseData.length);
                
                // 直接使用插件，不经过适配器
                console.log('⏳ 动态导入 cesium-wind-layer...');
                const { WindLayer } = await import('cesium-wind-layer');
                console.log('✅ 插件导入成功');
                
                // 转换数据格式 - 使用插值填充全球网格
                console.log('⏳ 转换数据格式...');
                const { sparseData } = windData;
                
                const nx = 361, ny = 181;
                const uData = new Float32Array(nx * ny);
                const vData = new Float32Array(nx * ny);
                
                // 先填充原始数据
                const hasData = new Uint8Array(nx * ny);
                for (const point of sparseData) {
                    const i = Math.round(point.lon + 180);
                    const j = Math.round(point.lat + 90);
                    if (i >= 0 && i < nx && j >= 0 && j < ny) {
                        const index = j * nx + i;
                        uData[index] = point.u;
                        vData[index] = point.v;
                        hasData[index] = 1;
                    }
                }
                
                // 简单插值填充空白区域
                console.log('⏳ 插值填充空白区域...');
                for (let j = 0; j < ny; j++) {
                    for (let i = 0; i < nx; i++) {
                        const index = j * nx + i;
                        if (!hasData[index]) {
                            let sumU = 0, sumV = 0, count = 0;
                            // 查找周围8个方向的数据
                            for (let dj = -3; dj <= 3; dj++) {
                                for (let di = -3; di <= 3; di++) {
                                    if (di === 0 && dj === 0) continue;
                                    const ni = (i + di + nx) % nx;
                                    const nj = j + dj;
                                    if (nj >= 0 && nj < ny) {
                                        const nIndex = nj * nx + ni;
                                        if (hasData[nIndex]) {
                                            const dist = Math.sqrt(di*di + dj*dj);
                                            const weight = 1.0 / dist;
                                            sumU += uData[nIndex] * weight;
                                            sumV += vData[nIndex] * weight;
                                            count += weight;
                                        }
                                    }
                                }
                            }
                            if (count > 0) {
                                uData[index] = sumU / count;
                                vData[index] = sumV / count;
                            } else {
                                // 如果周围没有数据，使用全球平均风场模式
                                const lat = j - 90;
                                uData[index] = Math.sin(lat * Math.PI / 180) * 10;
                                vData[index] = Math.cos(lat * Math.PI / 180) * 5;
                            }
                        }
                    }
                }
                
                let uMin = Infinity, uMax = -Infinity;
                let vMin = Infinity, vMax = -Infinity;
                for (let i = 0; i < uData.length; i++) {
                    uMin = Math.min(uMin, uData[i]);
                    uMax = Math.max(uMax, uData[i]);
                    vMin = Math.min(vMin, vData[i]);
                    vMax = Math.max(vMax, vData[i]);
                }
                
                console.log('✅ 插值完成，全球覆盖');
                
                const formattedData = {
                    u: { array: uData, min: uMin, max: uMax },
                    v: { array: vData, min: vMin, max: vMax },
                    width: nx,
                    height: ny,
                    bounds: { west: -180, south: -90, east: 180, north: 90 }
                };
                
                console.log('✅ 数据转换完成');
                console.log('   - 网格:', nx, 'x', ny);
                console.log('   - U范围:', uMin.toFixed(2), '~', uMax.toFixed(2));
                console.log('   - V范围:', vMin.toFixed(2), '~', vMax.toFixed(2));
                
                // 确保场景已经渲染，WebGL 上下文已初始化
                viewer.scene.requestRenderMode = false;
                viewer.scene.render();
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // 创建 WindLayer
                console.log('⏳ 创建 WindLayer...');
                console.log('   - Viewer scene:', viewer.scene);
                console.log('   - WebGL context:', viewer.scene.context);
                
                // 检查 WebGL 上下文
                const gl = viewer.scene.context._gl;
                const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
                console.log('   - Max texture size:', maxTextureSize);
                console.log('   - Data width:', formattedData.width);
                console.log('   - Data height:', formattedData.height);
                
                if (formattedData.width > maxTextureSize || formattedData.height > maxTextureSize) {
                    throw new Error(`数据尺寸 ${formattedData.width}x${formattedData.height} 超过 WebGL 纹理限制 ${maxTextureSize}`);
                }
                
                windLayer = new WindLayer(viewer, formattedData, {
                    // 粒子数量：降到 640 保证流畅（约41万粒子）
                    particlesTextureSize: 640,
                    
                    particleHeight: 0,
                    
                    // 线条粗细：保持适中
                    lineWidth: { min: 2.5, max: 6 },
                    
                    // 线条长度：保持流线效果
                    lineLength: { min: 300, max: 800 },
                    
                    // 速度因子：加快到 2.0，让粒子移动更明显
                    speedFactor: 2.0,
                    
                    // 粒子消失率：提高到 0.003，让粒子更频繁地重新生成在随机位置
                    // 这样可以打散条纹，形成更均匀的分布
                    dropRate: 0.003,
                    
                    // 粒子消失率增量：提高，增加随机性
                    dropRateBump: 0.001,
                    
                    // 彩虹色谱：紫→蓝→青→绿→黄→橙→红
                    colors: [
                        'rgba(138, 43, 226, 0.7)',   // 紫色（弱风）
                        'rgba(75, 0, 130, 0.75)',    // 靛蓝
                        'rgba(0, 0, 255, 0.8)',      // 蓝色
                        'rgba(0, 191, 255, 0.85)',   // 深天蓝
                        'rgba(0, 255, 255, 0.9)',    // 青色
                        'rgba(0, 255, 127, 0.9)',    // 春绿
                        'rgba(173, 255, 47, 0.95)',  // 黄绿
                        'rgba(255, 255, 0, 0.95)',   // 黄色
                        'rgba(255, 165, 0, 0.98)',   // 橙色
                        'rgba(255, 69, 0, 1.0)',     // 橙红
                        'rgba(255, 0, 0, 1.0)'       // 红色（强风）
                    ],
                    
                    flipY: false,
                    dynamic: true
                });
                
                console.log('✅ WindLayer 创建成功');
                
                // WindLayer 构造函数会自动添加到场景，不需要手动调用 add()
                
            } catch (error) {
                console.error('❌ 风场图层加载失败:', error);
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
                console.log('🗑️ 气象数据已清除');
            }
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

        // 监听图层控制变化（控制风场显隐）
        watch(() => props.layerState, (newLayers) => {
            updateWindVisibility(newLayers);
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
                console.log('🗑️ 航线已清除');
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
                    // 执行新的气象分析
                    stats = await routeWeatherLayer.analyzeRoute(request.route, (current, total) => {
                        console.log(`⏳ 气象数据获取进度: ${current}/${total}`);
                    });
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
            
            // 查找风场图层的状态
            let windEnabled = false;
            for (const group of weatherLayers) {
                if (group.id === 'basic_weather' && group.active && group.subLayers) {
                    const windSub = group.subLayers.find(s => s.id === 'wind');
                    if (windSub && windSub.active) {
                        windEnabled = true;
                        break;
                    }
                }
            }
            
            console.log('🌬️ 风场图层状态（气象图层控制）:', windEnabled);
            
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
            
            // TODO: 处理其他气象图层（波浪、洋流、台风等）
        };

        onMounted(() => {
            setTimeout(initCesium, 100);
        });

        onUnmounted(() => {
            if (windLayer) {
                windLayer.remove();
                windLayer = null;
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
            zoomIn,
            zoomOut,
            resetView,
            toggle2D3D,
            toggleFullscreen,
            toggleTrajectory,
            viewer: getViewer  // 暴露viewer
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