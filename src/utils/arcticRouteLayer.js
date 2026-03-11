/**
 * 北极航线图层管理器
 * 负责加载和管理北极航线数据
 */

import * as Cesium from 'cesium';

export class ArcticRouteLayer {
    constructor(viewer) {
        this.viewer = viewer;
        this.dataSource = null;
        this.isVisible = false;
        this.routeEntities = [];
        
        // 本地 GeoJSON 文件路径
        this.dataUrl = '/src/data/beiji.geojson';
        
        // 航线颜色配置
        this.routeColors = {
            'Northwest Passage': '#FF6B6B',      // 西北航道 - 红色
            'Northern Sea Route': '#4ECDC4',     // 北方海航道 - 青色
            'Transpolar': '#FFD93D'              // 跨极航道 - 黄色
        };
        
        // 航线中文名称映射
        this.routeNameZh = {
            'Northwest Passage': '西北航道',
            'Northern Sea Route': '北方海航道',
            'Transpolar': '跨极航道'
        };
    }

    /**
     * 加载北极航线数据
     */
    async load() {
        try {
            console.log('🧊 开始加载北极航线数据...');
            
            // 从本地文件获取 GeoJSON 数据
            const response = await fetch(this.dataUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const geojson = await response.json();
            console.log(`✅ 获取到 ${geojson.features.length} 条北极航线数据`);
            
            // 加载 GeoJSON 数据，设置为透明以避免默认样式
            this.dataSource = await Cesium.GeoJsonDataSource.load(geojson, {
                stroke: Cesium.Color.TRANSPARENT,
                fill: Cesium.Color.TRANSPARENT,
                strokeWidth: 0,
                markerSize: 1,
                markerColor: Cesium.Color.TRANSPARENT,
                clampToGround: false
            });
            
            // 添加到 viewer
            await this.viewer.dataSources.add(this.dataSource);
            
            // 自定义每条航线的样式
            const entities = this.dataSource.entities.values;
            
            entities.forEach(entity => {
                // 移除默认的 billboard
                entity.billboard = undefined;
                
                if (entity.polyline) {
                    const properties = entity.properties;
                    
                    // 获取航线属性
                    const name = properties.Name?.getValue() || '未知航线';
                    const length = properties.Shape_Leng?.getValue() || 0;
                    
                    // 根据航线名称设置颜色
                    const colorHex = this.routeColors[name] || '#FFFFFF';
                    const color = Cesium.Color.fromCssColorString(colorHex);
                    
                    // 设置线条样式 - 更粗、更明显
                    entity.polyline.width = 5;
                    entity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
                        glowPower: 0.3,
                        color: color.withAlpha(0.9)
                    });
                    entity.polyline.clampToGround = false;
                    
                    // 添加自定义属性，用于识别
                    if (!entity.properties) {
                        entity.properties = new Cesium.PropertyBag();
                    }
                    entity.properties.addProperty('type', 'arctic_route');
                    entity.properties.addProperty('nameZh', this.routeNameZh[name] || name);
                    
                    // 存储实体引用
                    this.routeEntities.push(entity);
                }
            });
            
            // 默认隐藏
            this.dataSource.show = false;
            this.isVisible = false;
            
            console.log('✅ 北极航线图层加载完成');
            return entities;
        } catch (error) {
            console.error('❌ 加载北极航线数据失败:', error);
            return [];
        }
    }

    /**
     * 显示航线图层
     */
    show() {
        if (this.dataSource) {
            this.dataSource.show = true;
            this.isVisible = true;
            console.log('✅ 显示北极航线图层');
        }
    }

    /**
     * 隐藏航线图层（完全清除数据以释放内存）
     */
    hide() {
        if (this.dataSource) {
            console.log('🗑️ 清除北极航线数据以释放内存...');
            // 从 viewer 中移除 dataSource
            this.viewer.dataSources.remove(this.dataSource);
            // 清空引用
            this.dataSource = null;
            this.routeEntities = [];
            this.isVisible = false;
            console.log('✅ 北极航线数据已清除');
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
     * 获取所有航线数据（用于统计和列表展示）
     */
    getRouteData() {
        if (!this.dataSource) return [];
        
        const entities = this.dataSource.entities.values;
        
        // 只处理有 polyline 的实体，并去重（根据 OBJECTID）
        const uniqueRoutes = new Map();
        
        entities.forEach(entity => {
            if (!entity.polyline) return;
            
            const props = entity.properties;
            const objectId = props.OBJECTID?.getValue();
            
            // 如果已经处理过这个 OBJECTID，跳过
            if (uniqueRoutes.has(objectId)) return;
            
            const name = props.Name?.getValue() || '未知';
            const nameZh = this.routeNameZh[name] || name;
            const distance = props.Shape_Leng?.getValue() || 0;
            
            // 根据航线特点添加额外信息
            let season = '夏季(7-9月)';
            let iceCondition = '季节性冰封';
            let countries = [];
            let commercialValue = '中';
            
            if (name === 'Northwest Passage') {
                countries = ['加拿大', '美国'];
                iceCondition = '重度冰封';
                commercialValue = '低';
            } else if (name === 'Northern Sea Route') {
                countries = ['俄罗斯'];
                iceCondition = '中度冰封';
                commercialValue = '高';
                season = '夏季(6-10月)';
            } else if (name === 'Transpolar') {
                countries = ['国际水域'];
                iceCondition = '极重冰封';
                commercialValue = '极低';
                season = '未来航线';
            }
            
            uniqueRoutes.set(objectId, {
                id: objectId,
                name: name,
                nameZh: nameZh,
                distance: Math.round(distance),
                season: season,
                iceCondition: iceCondition,
                countries: countries,
                commercialValue: commercialValue,
                color: this.routeColors[name] || '#FFFFFF'
            });
        });
        
        return Array.from(uniqueRoutes.values());
    }

    /**
     * 高亮指定航线
     */
    highlightRoute(routeId) {
        this.routeEntities.forEach(entity => {
            const props = entity.properties;
            const id = props.OBJECTID?.getValue();
            
            if (id === routeId) {
                // 高亮选中的航线
                entity.polyline.width = 8;
                entity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
                    glowPower: 0.5,
                    color: Cesium.Color.fromCssColorString(this.routeColors[props.Name?.getValue()] || '#FFFFFF')
                });
            } else {
                // 恢复其他航线
                const name = props.Name?.getValue();
                const color = Cesium.Color.fromCssColorString(this.routeColors[name] || '#FFFFFF');
                entity.polyline.width = 5;
                entity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
                    glowPower: 0.3,
                    color: color.withAlpha(0.9)
                });
            }
        });
    }

    /**
     * 重置所有航线样式
     */
    resetHighlight() {
        this.routeEntities.forEach(entity => {
            const props = entity.properties;
            const name = props.Name?.getValue();
            const color = Cesium.Color.fromCssColorString(this.routeColors[name] || '#FFFFFF');
            entity.polyline.width = 5;
            entity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
                glowPower: 0.3,
                color: color.withAlpha(0.9)
            });
        });
    }

    /**
     * 飞行到所有航线（北极视角）
     */
    flyToAll() {
        if (this.dataSource && this.dataSource.entities.values.length > 0) {
            this.viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(0, 90, 15000000),
                orientation: {
                    heading: Cesium.Math.toRadians(0),
                    pitch: Cesium.Math.toRadians(-90),
                    roll: 0.0
                },
                duration: 2
            });
        }
    }

    /**
     * 飞行到指定航线
     */
    flyToRoute(routeId) {
        const entity = this.routeEntities.find(e => {
            const id = e.properties.OBJECTID?.getValue();
            return id === routeId;
        });
        
        if (entity) {
            this.viewer.flyTo(entity, {
                duration: 2,
                offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-45), 5000000)
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
        this.routeEntities = [];
    }
}
