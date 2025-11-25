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
    </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { loadGeoJson, styleByProperty, ColorSchemes, setupClickHandler } from '../utils/geoJsonLoader.js';
import { getContractorColor } from '../utils/contractorColors.js';

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
        // 当前使用：天地图（TianDiTu）全球影像服务 + 注记服务
        const TDT_TOKEN = "2ddaabf906d4b5418aed0078e1657029"; 

        const initCesium = () => {

            const imageryProvider = new Cesium.WebMapTileServiceImageryProvider({
                url: `http://t0.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=${TDT_TOKEN}`,
                layer: "img",
                style: "default",
                format: "tiles",
                tileMatrixSetID: "w",
                credit: new Cesium.Credit("天地图全球影像服务"),
                maximumLevel: 18
            });

            const labelProvider = new Cesium.WebMapTileServiceImageryProvider({
                url: `http://t0.tianditu.gov.cn/cia_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cia&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=${TDT_TOKEN}`,
                layer: "cia",
                style: "default",
                format: "tiles",
                tileMatrixSetID: "w",
                credit: new Cesium.Credit("天地图全球注记服务"),
                maximumLevel: 18
            });

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
                imageryProvider: false,
                sceneMode: Cesium.SceneMode.SCENE3D,
                contextOptions: {
                    webgl: {
                        alpha: true,
                        // 性能优化
                        powerPreference: 'high-performance'
                    }
                },
                // 性能优化设置
                requestRenderMode: true, // 按需渲染，不是每帧都渲染
                maximumRenderTimeChange: Infinity // 减少不必要的渲染
            });

            // 手动添加天地图图层
            viewer.imageryLayers.addImageryProvider(imageryProvider);
            viewer.imageryLayers.addImageryProvider(labelProvider);
            viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#020617');
            viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#000000');
            viewer.scene.skyAtmosphere.show = true;
            viewer.scene.skyAtmosphere.hueShift = -0.1;
            viewer.scene.globe.enableLighting = true;
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

        onMounted(() => {
            setTimeout(initCesium, 100);
        });

        onUnmounted(() => {
            if (clickHandler) {
                clickHandler.destroy();
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
            zoomIn,
            zoomOut,
            resetView,
            toggle2D3D,
            toggleFullscreen
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