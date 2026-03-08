/**
 * 资源分布图层管理器
 * 负责加载和管理资源分布数据（如深海稀土）
 */

import * as Cesium from 'cesium';

export class ResourceLayer {
    constructor(viewer) {
        this.viewer = viewer;
        this.dataSources = new Map(); // 存储不同资源类型的数据源
        this.isVisible = new Map(); // 存储每种资源的显示状态
    }

    /**
     * 加载资源数据
     * @param {String} resourceType - 资源类型（如：'深海稀土'）
     * @param {String} dataFile - 数据文件路径
     * @param {Object} options - 样式选项
     */
    async load(resourceType, dataFile, options = {}) {
        try {
            console.log(`🔄 开始加载${resourceType}数据...`);
            
            // 默认样式
            const defaultOptions = {
                stroke: Cesium.Color.fromCssColorString('#FF69B4'),  // 粉红色
                fill: Cesium.Color.fromCssColorString('#FF69B4').withAlpha(0.3),  // 半透明粉红色
                strokeWidth: 2,
                clampToGround: false
            };
            
            const finalOptions = { ...defaultOptions, ...options };
            
            // 加载 GeoJSON 数据，设置为透明以避免默认样式
            const dataSource = await Cesium.GeoJsonDataSource.load(dataFile, {
                stroke: Cesium.Color.TRANSPARENT,
                fill: Cesium.Color.TRANSPARENT,
                strokeWidth: 0,
                markerSize: 1,
                markerColor: Cesium.Color.TRANSPARENT,
                clampToGround: false
            });
            
            // 添加到 viewer
            await this.viewer.dataSources.add(dataSource);
            
            // 自定义样式
            const entities = dataSource.entities.values;
            console.log(`✅ 加载了 ${entities.length} 个${resourceType}区域`);
            
            entities.forEach(entity => {
                // 移除默认的 billboard
                entity.billboard = undefined;
                
                if (entity.polygon) {
                    // 设置多边形样式
                    entity.polygon.material = finalOptions.fill;
                    entity.polygon.outline = true;
                    entity.polygon.outlineColor = finalOptions.stroke;
                    entity.polygon.outlineWidth = finalOptions.strokeWidth;
                    entity.polygon.heightReference = Cesium.HeightReference.NONE;
                    
                    // 添加自定义属性
                    if (!entity.properties) {
                        entity.properties = new Cesium.PropertyBag();
                    }
                    entity.properties.addProperty('type', 'resource_area');
                    entity.properties.addProperty('resourceType', resourceType);
                } else if (entity.position) {
                    // 对于 Point 类型，创建简单的圆点
                    entity.point = new Cesium.PointGraphics({
                        pixelSize: 5,
                        color: finalOptions.stroke,
                        outlineColor: Cesium.Color.WHITE.withAlpha(0.5),
                        outlineWidth: 1,
                        heightReference: Cesium.HeightReference.NONE,
                        disableDepthTestDistance: Number.POSITIVE_INFINITY
                    });
                    
                    // 添加自定义属性
                    if (!entity.properties) {
                        entity.properties = new Cesium.PropertyBag();
                    }
                    entity.properties.addProperty('type', 'resource_point');
                    entity.properties.addProperty('resourceType', resourceType);
                }
            });
            
            // 存储数据源
            this.dataSources.set(resourceType, dataSource);
            this.isVisible.set(resourceType, false);
            
            // 默认隐藏
            dataSource.show = false;
            
            console.log(`✅ ${resourceType}图层加载完成`);
            return true;
        } catch (error) {
            console.error(`❌ 加载${resourceType}数据失败:`, error);
            return false;
        }
    }

    /**
     * 显示指定资源图层
     * @param {String} resourceType - 资源类型
     */
    show(resourceType) {
        const dataSource = this.dataSources.get(resourceType);
        if (dataSource) {
            dataSource.show = true;
            this.isVisible.set(resourceType, true);
            console.log(`✅ 显示${resourceType}图层`);
        }
    }

    /**
     * 隐藏指定资源图层
     * @param {String} resourceType - 资源类型
     */
    hide(resourceType) {
        const dataSource = this.dataSources.get(resourceType);
        if (dataSource) {
            dataSource.show = false;
            this.isVisible.set(resourceType, false);
            console.log(`✅ 隐藏${resourceType}图层`);
        }
    }

    /**
     * 切换指定资源图层的显示/隐藏
     * @param {String} resourceType - 资源类型
     */
    toggle(resourceType) {
        if (this.isVisible.get(resourceType)) {
            this.hide(resourceType);
        } else {
            this.show(resourceType);
        }
    }

    /**
     * 隐藏所有资源图层
     */
    hideAll() {
        this.dataSources.forEach((dataSource, resourceType) => {
            dataSource.show = false;
            this.isVisible.set(resourceType, false);
        });
        console.log('✅ 隐藏所有资源图层');
    }

    /**
     * 检查资源是否已加载
     * @param {String} resourceType - 资源类型
     */
    isLoaded(resourceType) {
        return this.dataSources.has(resourceType);
    }

    /**
     * 检查资源是否可见
     * @param {String} resourceType - 资源类型
     */
    isResourceVisible(resourceType) {
        return this.isVisible.get(resourceType) || false;
    }

    /**
     * 飞行到指定资源区域
     * @param {String} resourceType - 资源类型
     */
    flyTo(resourceType) {
        const dataSource = this.dataSources.get(resourceType);
        if (dataSource && dataSource.entities.values.length > 0) {
            this.viewer.flyTo(dataSource, {
                duration: 2,
                offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-90), 5000000)
            });
        }
    }

    /**
     * 销毁指定资源图层
     * @param {String} resourceType - 资源类型
     */
    destroy(resourceType) {
        const dataSource = this.dataSources.get(resourceType);
        if (dataSource) {
            this.viewer.dataSources.remove(dataSource);
            this.dataSources.delete(resourceType);
            this.isVisible.delete(resourceType);
        }
    }

    /**
     * 销毁所有资源图层
     */
    destroyAll() {
        this.dataSources.forEach((dataSource) => {
            this.viewer.dataSources.remove(dataSource);
        });
        this.dataSources.clear();
        this.isVisible.clear();
    }
}
