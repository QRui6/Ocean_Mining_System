/**
 * 海底光缆图层管理器
 * 负责加载和管理全球海底光缆数据
 */

import * as Cesium from 'cesium';
import { getStartEndCountries } from './coordinateToCountry.js';

export class SubmarineCableLayer {
    constructor(viewer) {
        this.viewer = viewer;
        this.dataSource = null;
        this.isVisible = false;
        this.cableEntities = [];
        
        // ArcGIS 在线服务 URL
        this.serviceUrl = 'https://services.arcgis.com/bDAhvQYMG4WL8O5o/arcgis/rest/services/Global_Submarine_Cable_Map/FeatureServer/1/query?where=1%3D1&outFields=*&f=geojson';
    }

    /**
     * 加载海底光缆数据
     */
    async load() {
        try {
            console.log('🌐 开始加载海底光缆数据...');
            
            // 从在线服务获取 GeoJSON 数据
            const response = await fetch(this.serviceUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const geojson = await response.json();
            console.log(`✅ 获取到 ${geojson.features.length} 条海底光缆数据`);
            
            // 加载 GeoJSON 数据，设置为透明以避免默认样式
            this.dataSource = await Cesium.GeoJsonDataSource.load(geojson, {
                stroke: Cesium.Color.TRANSPARENT,
                fill: Cesium.Color.TRANSPARENT,
                strokeWidth: 0,
                markerSize: 1,
                markerColor: Cesium.Color.TRANSPARENT,
                clampToGround: true
            });
            
            // 添加到 viewer
            await this.viewer.dataSources.add(this.dataSource);
            
            // 自定义每条光缆的样式
            const entities = this.dataSource.entities.values;
            
            entities.forEach(entity => {
                // 移除默认的 billboard
                entity.billboard = undefined;
                
                if (entity.polyline) {
                    const properties = entity.properties;
                    
                    // 获取光缆属性
                    const name = properties.Name?.getValue() || '未知光缆';
                    const inService = properties.InService?.getValue();
                    const notLive = properties.NotLive?.getValue() || 0;
                    
                    // 根据状态设置颜色
                    let color = Cesium.Color.fromCssColorString('#00D9FF'); // 默认青色
                    if (notLive === 1) {
                        color = Cesium.Color.fromCssColorString('#94A3B8'); // 未启用：灰色
                    } else if (inService && inService < 2000) {
                        color = Cesium.Color.fromCssColorString('#FFD700'); // 老旧光缆：金色
                    }
                    
                    // 设置线条样式
                    entity.polyline.width = 3;
                    entity.polyline.material = new Cesium.PolylineDashMaterialProperty({
                        color: color.withAlpha(0.8),
                        dashLength: 16.0
                    });
                    entity.polyline.clampToGround = true;
                    entity.polyline.classificationType = Cesium.ClassificationType.TERRAIN;
                    
                    // 添加自定义属性，用于识别
                    if (!entity.properties) {
                        entity.properties = new Cesium.PropertyBag();
                    }
                    entity.properties.addProperty('type', 'submarine_cable');
                    
                    // 存储实体引用
                    this.cableEntities.push(entity);
                }
            });
            
            // 默认隐藏
            this.dataSource.show = false;
            this.isVisible = false;
            
            console.log('✅ 海底光缆图层加载完成');
            return entities;
        } catch (error) {
            console.error('❌ 加载海底光缆数据失败:', error);
            return [];
        }
    }

    /**
     * 显示光缆图层
     */
    show() {
        if (this.dataSource) {
            this.dataSource.show = true;
            this.isVisible = true;
            console.log('✅ 显示海底光缆图层');
        }
    }

    /**
     * 隐藏光缆图层（完全清除数据以释放内存）
     */
    hide() {
        if (this.dataSource) {
            console.log('🗑️ 清除海底光缆数据以释放内存...');
            // 从 viewer 中移除 dataSource
            this.viewer.dataSources.remove(this.dataSource);
            // 清空引用
            this.dataSource = null;
            this.cableEntities = [];
            this.isVisible = false;
            console.log('✅ 海底光缆数据已清除');
        }
    }

    /**
     * 切换显示/隐藏
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * 获取所有光缆数据（用于统计和列表展示）
     */
    getCableData() {
        if (!this.dataSource) return [];
        
        const entities = this.dataSource.entities.values;
        return entities.map(entity => {
            const props = entity.properties;
            
            // 获取起始国家
            let startCountry = '未知';
            let endCountry = '未知';
            
            if (entity.polyline && entity.polyline.positions) {
                const positions = entity.polyline.positions.getValue(Cesium.JulianDate.now());
                if (positions && positions.length > 0) {
                    const countries = getStartEndCountries(positions);
                    startCountry = countries.startCountry;
                    endCountry = countries.endCountry;
                }
            }
            
            return {
                id: props.FID?.getValue() || props.Id?.getValue(),
                name: props.Name?.getValue() || '未知',
                capacity: props.Capacity_G?.getValue() || 0,
                distance: props.Distance_K?.getValue() || 0,
                inService: props.InService?.getValue() || 0,
                notLive: props.NotLive?.getValue() || 0,
                url1: props.URL1?.getValue() || '',
                url2: props.URL2?.getValue() || '',
                notes: props.Notes?.getValue() || '',
                overLand: props.OverLand?.getValue() || 0,
                startCountry: startCountry,
                endCountry: endCountry
            };
        });
    }

    /**
     * 飞行到光缆区域（全球视角）
     */
    flyToAll() {
        if (this.dataSource && this.dataSource.entities.values.length > 0) {
            this.viewer.flyTo(this.dataSource, {
                duration: 2,
                offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-90), 20000000)
            });
        }
    }

    /**
     * 销毁图层
     */
    destroy() {
        if (this.dataSource) {
            this.viewer.dataSources.remove(this.dataSource);
            this.dataSource = null;
        }
        this.cableEntities = [];
    }
}
