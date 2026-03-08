/**
 * 视野内 GeoJSON 动态管理器
 * 只加载和渲染当前视野内的国家，滑动后自动销毁旧的、加载新的
 */

import * as Cesium from 'cesium';

export class ViewportGeoJsonManager {
    constructor(viewer) {
        this.viewer = viewer;
        this.allCountries = null; // 完整的 GeoJSON 数据（只加载一次）
        this.visibleEntities = new Map(); // 当前可见的实体 Map<countryName, entity>
        this.dataSource = null; // Cesium DataSource
        this.isLoading = false;
        this.lastViewport = null; // 上次的视野范围
        this.updateThrottle = null; // 节流定时器
    }

    /**
     * 初始化：加载完整的 GeoJSON 数据（只加载一次到内存）
     */
    async initialize() {
        if (this.allCountries) return; // 已经加载过

        try {
            console.log('📥 加载国家 GeoJSON 数据到内存...');
            
            // 使用 fetch 加载原始数据
            const response = await fetch('/data/countries-simple.geojson');
            // const response = await fetch('/data/World_countries_simply.geojson');
            const geojson = await response.json();
            
            this.allCountries = geojson.features; // 保存所有国家数据
            
            // 创建空的 DataSource
            this.dataSource = new Cesium.CustomDataSource('viewport-countries');
            this.dataSource.show = true; // 确保可见
            this.viewer.dataSources.add(this.dataSource);
            
            console.log(`✅ 加载完成，共 ${this.allCountries.length} 个国家/地区`);
            console.log(`📊 DataSource 已添加到 viewer，当前 DataSource 数量: ${this.viewer.dataSources.length}`);
            
            // 初始更新
            this.updateVisibleCountries();
            
        } catch (error) {
            console.error('❌ 加载 GeoJSON 失败:', error);
        }
    }

    /**
     * 计算当前视野的经纬度范围
     */
    getCurrentViewport() {
        try {
            const rectangle = this.viewer.camera.computeViewRectangle();
            if (!rectangle) return null;

            return {
                west: Cesium.Math.toDegrees(rectangle.west),
                east: Cesium.Math.toDegrees(rectangle.east),
                south: Cesium.Math.toDegrees(rectangle.south),
                north: Cesium.Math.toDegrees(rectangle.north)
            };
        } catch (error) {
            console.warn('无法计算视野范围:', error);
            return null;
        }
    }

    /**
     * 判断国家是否在视野内
     */
    isCountryInViewport(country, viewport) {
        if (!country.geometry || !viewport) return false;

        // 获取国家的边界框
        const bounds = this.getCountryBounds(country);
        if (!bounds) return false;

        // 处理跨越 180° 经线的情况
        const viewportCrossesDateline = viewport.east < viewport.west;
        const countryCrossesDateline = bounds.east < bounds.west;

        if (viewportCrossesDateline || countryCrossesDateline) {
            // 复杂情况：使用更宽松的判断
            return this.checkIntersectionWithDateline(bounds, viewport);
        }

        // 简单情况：检查矩形相交
        return !(
            bounds.east < viewport.west ||
            bounds.west > viewport.east ||
            bounds.north < viewport.south ||
            bounds.south > viewport.north
        );
    }

    /**
     * 处理跨越日期变更线的相交判断
     */
    checkIntersectionWithDateline(bounds, viewport) {
        // 简化处理：如果任一边界跨越日期变更线，认为可能可见
        if (bounds.east < bounds.west || viewport.east < viewport.west) {
            return true;
        }
        return false;
    }

    /**
     * 获取国家的边界框
     */
    getCountryBounds(country) {
        const geometry = country.geometry;
        if (!geometry || !geometry.coordinates) return null;

        let minLon = Infinity, maxLon = -Infinity;
        let minLat = Infinity, maxLat = -Infinity;

        const processCoordinates = (coords) => {
            if (typeof coords[0] === 'number') {
                // 单个坐标点 [lon, lat]
                minLon = Math.min(minLon, coords[0]);
                maxLon = Math.max(maxLon, coords[0]);
                minLat = Math.min(minLat, coords[1]);
                maxLat = Math.max(maxLat, coords[1]);
            } else {
                // 嵌套数组
                coords.forEach(processCoordinates);
            }
        };

        processCoordinates(geometry.coordinates);

        if (minLon === Infinity) return null;

        return {
            west: minLon,
            east: maxLon,
            south: minLat,
            north: maxLat
        };
    }

    /**
     * 更新可见国家（核心方法）
     */
    updateVisibleCountries() {
        if (!this.allCountries || !this.dataSource) return;

        const viewport = this.getCurrentViewport();
        if (!viewport) return;

        // 检查视野是否有显著变化（避免频繁更新）
        if (this.lastViewport && this.isViewportSimilar(viewport, this.lastViewport)) {
            return; // 视野变化不大，跳过更新
        }

        console.log('🔄 更新视野内国家...', viewport);

        const startTime = performance.now();
        let addedCount = 0;
        let removedCount = 0;

        // 1. 找出需要显示的国家
        const shouldBeVisible = new Set();
        this.allCountries.forEach(country => {
            const countryName = country.properties?.name || country.properties?.NAME || 'Unknown';
            
            if (this.isCountryInViewport(country, viewport)) {
                shouldBeVisible.add(countryName);
                
                // 如果还没有创建实体，创建它
                if (!this.visibleEntities.has(countryName)) {
                    this.addCountryEntity(country, countryName);
                    addedCount++;
                }
            }
        });

        // 2. 移除不在视野内的国家
        const toRemove = [];
        this.visibleEntities.forEach((entity, countryName) => {
            if (!shouldBeVisible.has(countryName)) {
                toRemove.push(countryName);
            }
        });

        toRemove.forEach(countryName => {
            this.removeCountryEntity(countryName);
            removedCount++;
        });

        const endTime = performance.now();
        
        console.log(`✅ 更新完成: +${addedCount} -${removedCount} 个国家，耗时 ${Math.round(endTime - startTime)}ms，当前显示 ${this.visibleEntities.size} 个`);
        console.log(`📊 DataSource 实体数量: ${this.dataSource.entities.values.length}`);

        // 强制刷新场景
        this.viewer.scene.requestRender();

        this.lastViewport = viewport;
    }

    /**
     * 判断两个视野是否相似（避免频繁更新）
     */
    isViewportSimilar(v1, v2, threshold = 10) {
        return (
            Math.abs(v1.west - v2.west) < threshold &&
            Math.abs(v1.east - v2.east) < threshold &&
            Math.abs(v1.south - v2.south) < threshold &&
            Math.abs(v1.north - v2.north) < threshold
        );
    }

    /**
     * 添加国家实体
     */
    addCountryEntity(country, countryName) {
        try {
            const geometry = country.geometry;
            if (!geometry) return;

            // 根据几何类型创建实体
            if (geometry.type === 'Polygon') {
                this.addPolygon(country, countryName);
            } else if (geometry.type === 'MultiPolygon') {
                this.addMultiPolygon(country, countryName);
            }
        } catch (error) {
            console.warn(`创建实体失败: ${countryName}`, error);
        }
    }

    /**
     * 添加单个多边形
     */
    addPolygon(country, countryName) {
        const coordinates = country.geometry.coordinates[0]; // 外环
        if (!coordinates || coordinates.length < 3) return;

        const positions = coordinates.map(coord => 
            Cesium.Cartesian3.fromDegrees(coord[0], coord[1])
        );

        // 创建填充的多边形面
        const polygonEntity = this.dataSource.entities.add({
            name: countryName,
            polygon: {
                hierarchy: new Cesium.PolygonHierarchy(positions),
                material: Cesium.Color.fromCssColorString('#4a90e2').withAlpha(0.4), // 浅蓝色填充
                outline: true,
                outlineColor: Cesium.Color.fromCssColorString('#4a90e2').withAlpha(0.8),
                outlineWidth: 2,
                height: 0,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            }
        });

        console.log(`✅ 创建国家边界: ${countryName}, 顶点数: ${positions.length}`);
        // 为了与 MultiPolygon 保持一致，也存储为数组
        this.visibleEntities.set(countryName, [polygonEntity]);
    }

    /**
     * 添加多个多边形
     */
    addMultiPolygon(country, countryName) {
        const polygons = country.geometry.coordinates;
        console.log(`🔷 创建 MultiPolygon: ${countryName}, 包含 ${polygons.length} 个部分`);
        
        const entities = []; // 存储该国家的所有实体
        
        polygons.forEach((polygon, index) => {
            const coordinates = polygon[0]; // 外环
            if (!coordinates || coordinates.length < 3) {
                console.warn(`⚠️ ${countryName} 的第 ${index} 部分坐标无效`);
                return;
            }

            try {
                const positions = coordinates.map(coord => 
                    Cesium.Cartesian3.fromDegrees(coord[0], coord[1])
                );

                // 创建填充的多边形面
                const entity = this.dataSource.entities.add({
                    name: `${countryName}_part${index}`,
                    polygon: {
                        hierarchy: new Cesium.PolygonHierarchy(positions),
                        material: Cesium.Color.fromCssColorString('#4a90e2').withAlpha(0.4), // 浅蓝色填充
                        outline: true,
                        outlineColor: Cesium.Color.fromCssColorString('#4a90e2').withAlpha(0.8),
                        outlineWidth: 2,
                        height: 0,
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                    }
                });

                entities.push(entity);
            } catch (error) {
                console.error(`❌ 创建 ${countryName} 第 ${index} 部分失败:`, error);
            }
        });

        // 将所有实体作为数组存储
        if (entities.length > 0) {
            this.visibleEntities.set(countryName, entities);
            console.log(`✅ 创建 MultiPolygon 完成: ${countryName}, 成功创建 ${entities.length} 个部分`);
        } else {
            console.error(`❌ ${countryName} 没有成功创建任何部分`);
        }
    }

    /**
     * 移除国家实体
     */
    removeCountryEntity(countryName) {
        const entityOrEntities = this.visibleEntities.get(countryName);
        if (!entityOrEntities) return;

        // 处理单个实体或实体数组
        if (Array.isArray(entityOrEntities)) {
            // MultiPolygon：移除所有部分
            entityOrEntities.forEach(entity => {
                this.dataSource.entities.remove(entity);
            });
        } else {
            // Polygon：移除单个实体
            this.dataSource.entities.remove(entityOrEntities);
        }
        
        this.visibleEntities.delete(countryName);
    }

    /**
     * 启动相机移动监听（节流）
     */
    startMonitoring(throttleMs = 500) {
        // 监听相机移动结束事件
        this.viewer.camera.moveEnd.addEventListener(() => {
            // 使用节流，避免频繁更新
            if (this.updateThrottle) {
                clearTimeout(this.updateThrottle);
            }
            
            this.updateThrottle = setTimeout(() => {
                this.updateVisibleCountries();
            }, throttleMs);
        });

        console.log('👁️ 视野监控已启动（节流: ' + throttleMs + 'ms）');
    }

    /**
     * 清理所有资源
     */
    destroy() {
        console.log('🗑️ 清理视野 GeoJSON 管理器...');
        
        if (this.updateThrottle) {
            clearTimeout(this.updateThrottle);
        }

        if (this.dataSource) {
            this.dataSource.entities.removeAll();
            this.viewer.dataSources.remove(this.dataSource);
        }

        this.visibleEntities.clear();
        this.allCountries = null;
        this.dataSource = null;
        
        console.log('✅ 清理完成');
    }

    /**
     * 获取当前状态
     */
    getStatus() {
        return {
            总国家数: this.allCountries?.length || 0,
            可见国家数: this.visibleEntities.size,
            当前视野: this.lastViewport
        };
    }
}
