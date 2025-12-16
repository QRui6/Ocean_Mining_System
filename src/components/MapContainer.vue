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
                
                <!-- 风场图层 -->
                <button @click="toggleWindLayer" class="map-tool-btn group" :title="showWind ? '隐藏风场' : '显示风场'">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                    </svg>
                    <div v-if="showWind" class="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </button>
                
                <!-- 轨迹显示 -->
                <button @click="toggleTrajectory" class="map-tool-btn group" :title="showTrajectory ? '隐藏轨迹' : '显示轨迹'">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    <div v-if="showTrajectory" class="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
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
                    
                    <div v-for="(val, key) in {
                        '船舶名称': selectedShip.name,
                        '船舶类型': selectedShip.type,
                        '船长': selectedShip.length,
                        '船宽': selectedShip.width,
                        '航速': selectedShip.speed,
                        '载重': selectedShip.capacity,
                        '船员': selectedShip.crew,
                        '出发时间': selectedShip.departure,
                        '预计到达': selectedShip.eta,
                        '货物': selectedShip.cargo,
                        '状态': selectedShip.status
                    }" :key="key" class="flex justify-between items-center py-2 border-b border-yellow-500/20 relative z-10">
                        <span class="text-yellow-400/80 font-['Rajdhani'] text-sm tracking-wider">{{ key }}</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide text-right max-w-[60%] truncate" :title="val">{{ val }}</span>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { loadGeoJson, styleByProperty, ColorSchemes, setupClickHandler } from '../utils/geoJsonLoader.js';
import { getContractorColor } from '../utils/contractorColors.js';
// 使用官方 cesium-wind-layer 插件
import { CesiumWindLayerWrapper } from '../utils/cesiumWindLayerAdapter.js';
import { loadGlobalWindData } from '../utils/windDataLoader.js';
import { ShipTrajectoryLayer, sampleTrajectories } from '../utils/shipTrajectory.js';

export default {
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
        }
    },
    emits: ['dataLoaded'],
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
        // 当前使用：天地图（TianDiTu）全球影像服务 + 注记服务
        const TDT_TOKEN = "2ddaabf906d4b5418aed0078e1657029"; 

        const initCesium = () => {

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
                        stencil: false,
                        antialias: true,
                        powerPreference: 'high-performance',
                        premultipliedAlpha: true,
                        preserveDrawingBuffer: false,
                        failIfMajorPerformanceCaveat: false
                    }
                },
                // 性能优化设置
                requestRenderMode: true, // 按需渲染
                maximumRenderTimeChange: Infinity,
                // 场景优化
                useBrowserRecommendedResolution: true,
                orderIndependentTranslucency: false,  // 禁用半透明排序以提升性能
                scene3DOnly: true,  // 仅3D模式
                shouldAnimate: true
            });

            // 移除默认图层
            viewer.imageryLayers.removeAll();
            
            // 使用多个服务器节点进行负载均衡（t0-t7）
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
            
            // 场景优化设置
            viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#020617');
            viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#000000');
            viewer.scene.skyAtmosphere.show = true;
            viewer.scene.skyAtmosphere.hueShift = -0.1;
            viewer.scene.globe.enableLighting = false;  // 禁用光照以提升性能
            viewer.scene.globe.showGroundAtmosphere = false;  // 禁用地面大气层
            viewer.scene.fog.enabled = false;  // 禁用雾效
            viewer.scene.sun.show = false;  // 隐藏太阳
            viewer.scene.moon.show = false;  // 隐藏月亮
            viewer.scene.skyBox.show = true;  // 保留星空背景
            
            // 性能优化：减少瓦片加载数量
            viewer.scene.globe.maximumScreenSpaceError = 2;  // 默认2，增大可减少瓦片数量
            viewer.scene.globe.tileCacheSize = 100;  // 瓦片缓存大小
            
            viewer._cesiumWidget._creditContainer.style.display = "none";

            // 设置初始视角：中国区域（从太空俯瞰）
            viewer.camera.setView({
                destination: Cesium.Cartesian3.fromDegrees(105.0, 35.0, 18000000),
                orientation: {
                    heading: 0,
                    pitch: Cesium.Math.toRadians(-90),
                    roll: 0
                }
            });

            // 加载 GeoJSON 数据
            loadMiningData();

            // 注释掉自动加载风场，改为手动点击按钮加载
            // updateWindVisibility(props.layerState);
        };

        // 判断图层控制中“10日风场预报”是否开启
        const isWindLayerEnabled = (layers) => {
            if (!layers || !layers.length) return false;
            
            // 父图层需要是激活状态，且其子图层 wind 也为激活状态
            for (const layer of layers) {
                if (!layer.active || !layer.subLayers) continue;
                const windSub = layer.subLayers.find(s => s.id === 'wind' && s.active);
                if (windSub) return true;
            }
            return false;
        };

        // 根据当前图层控制状态，更新风场图层的显隐
        const updateWindVisibility = (layers) => {
            if (!viewer) return;
            const enabled = isWindLayerEnabled(layers);

            if (enabled && !windLayer) {
                initWindLayer();
            } else if (!enabled && windLayer) {
                windLayer.remove();
                windLayer = null;
                viewer.scene.requestRender();
            }
        };

        // 注意：loadWindLayer 函数已被移除，现在使用 initWindLayer 函数

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
                    
                    // 检查是否点击了船舶
                    if (Cesium.defined(pickedObject) && pickedObject.id) {
                        const entity = pickedObject.id;
                        
                        console.log('📦 实体详情:');
                        console.log('   - name:', entity.name);
                        console.log('   - 有 billboard:', !!entity.billboard);
                        console.log('   - 有 polygon:', !!entity.polygon);
                        console.log('   - 有 properties:', !!entity.properties);
                        
                        // 如果点击的是船舶（有 billboard 属性）
                        if (entity.billboard && entity.name && entity.name.startsWith('ship_')) {
                            console.log('🚢 点击了船舶:', entity.name);
                            console.log('   - trajectoryLayer 存在:', !!trajectoryLayer);
                            console.log('   - trajectoryLayer.trajectories 长度:', trajectoryLayer?.trajectories?.length);
                            
                            // 查找对应的轨迹
                            if (trajectoryLayer) {
                                const trajectory = trajectoryLayer.trajectories.find(traj => {
                                    console.log('   - 比较 ship:', traj.ship.name, '===', entity.name);
                                    return traj.ship === entity;
                                });
                                
                                console.log('   - 找到的轨迹:', trajectory);
                                
                                if (trajectory && trajectory.data.shipInfo) {
                                    // 暂停动画
                                    trajectoryLayer.isPaused = true;
                                    
                                    // 显示船舶信息
                                    selectedShip.value = trajectory.data.shipInfo;
                                    shipInfoPosition.value = {
                                        x: correctedPosition.x + 20,
                                        y: correctedPosition.y - 100
                                    };
                                    
                                    console.log('✅ 显示船舶信息:', trajectory.data.shipInfo);
                                } else {
                                    console.warn('⚠️ 未找到对应的轨迹或船舶信息');
                                }
                            } else {
                                console.warn('⚠️ trajectoryLayer 不存在');
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

                // 延迟1.5秒后，从中国飞到太平洋矿区
                setTimeout(() => {
                    viewer.camera.flyTo({
                        destination: Cesium.Cartesian3.fromDegrees(-140.0, 10.0, 18000000),
                        orientation: {
                            heading: 0,
                            pitch: Cesium.Math.toRadians(-90),
                            roll: 0
                        },
                        duration: 4,
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
                destination: Cesium.Cartesian3.fromDegrees(-140.0, 10.0, 15000000),
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
                
                // 切换到2D后，飞到理想视角（既能看到中国，又能看到太平洋矿区）
                setTimeout(() => {
                    viewer.camera.flyTo({
                        destination: Cesium.Cartesian3.fromDegrees(150.0, 20.0, 25000000),
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
                        destination: Cesium.Cartesian3.fromDegrees(-140.0, 10.0, 18000000),
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
                    particlesTextureSize: 512,
                    particleHeight: 0,
                    lineWidth: { min: 2, max: 6 },
                    lineLength: { min: 200, max: 500 },
                    speedFactor: 3.0,
                    dropRate: 0.001,
                    dropRateBump: 0.0002,
                    colors: [
                        'rgba(0, 255, 255, 0.8)',
                        'rgba(0, 200, 255, 0.85)',
                        'rgba(0, 150, 255, 0.9)',
                        'rgba(100, 200, 100, 0.9)',
                        'rgba(255, 255, 0, 0.95)',
                        'rgba(255, 150, 0, 0.95)',
                        'rgba(255, 100, 0, 1.0)',
                        'rgba(255, 0, 0, 1.0)'
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

        // 切换风场显示
        const toggleWindLayer = async () => {
            console.log('🔘 风场按钮被点击');
            console.log('📍 Viewer 状态:', viewer ? '✅ 存在' : '❌ 不存在');
            console.log('🌬️ WindLayer 状态:', windLayer ? '✅ 已初始化' : '⚠️ 未初始化');
            console.log('👁️ 当前显示状态:', showWind.value ? '显示中' : '隐藏中');
            
            if (!viewer) {
                console.error('❌ Viewer 不存在，无法初始化风场');
                return;
            }
            
            if (!windLayer) {
                // 首次使用，初始化风场图层
                await initWindLayer();
                
                if (windLayer) {
                    windLayer.show = true;
                    showWind.value = true;
                    viewer.scene.requestRenderMode = false;
                    console.log('✅ 风场已显示');
                }
            } else {
                // 切换显示状态
                windLayer.show = !windLayer.show;
                showWind.value = windLayer.show;
                viewer.scene.requestRenderMode = !windLayer.show;
                console.log(windLayer.show ? '✅ 风场已显示' : '⚪ 风场已隐藏');
            }
        };

        // 关闭船舶信息窗口
        const closeShipInfo = () => {
            selectedShip.value = null;
            if (trajectoryLayer) {
                trajectoryLayer.resumeAnimation();  // 恢复动画
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

            if (windLayer) {
                windLayer.destroy();
                windLayer = null;
            }

            if (viewer) {
                viewer.destroy();
            }
        });

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
            zoomIn,
            zoomOut,
            resetView,
            toggle2D3D,
            toggleFullscreen,
            toggleWindLayer,
            toggleTrajectory
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