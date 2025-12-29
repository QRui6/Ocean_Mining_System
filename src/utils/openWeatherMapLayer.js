/**
 * OpenWeatherMap 图层管理工具
 * 用于在 Cesium 中加载和管理 OpenWeatherMap 的瓦片图层
 */

import * as Cesium from 'cesium';

export class OpenWeatherMapLayerManager {
    constructor(viewer) {
        this.viewer = viewer;
        // 存储已加载的图层 { layerId: imageryLayer }
        this.layers = new Map();
    }

    /**
     * 添加 OpenWeatherMap 图层
     * @param {String} layerId - 图层ID
     * @param {String} url - 瓦片服务URL
     * @param {Object} options - 可选配置
     * @returns {Cesium.ImageryLayer} 图层实例
     */
    addLayer(layerId, url, options = {}) {
        // 如果图层已存在，先移除
        if (this.layers.has(layerId)) {
            console.log(`🗑️ 移除已存在的图层: ${layerId}`);
            this.removeLayer(layerId);
        }

        try {
            console.log(`🌦️ 添加 OpenWeatherMap 图层: ${layerId}`);
            console.log(`   URL: ${url}`);

            // 创建 UrlTemplateImageryProvider
            const provider = new Cesium.UrlTemplateImageryProvider({
                url: url,
                maximumLevel: 18,
                credit: new Cesium.Credit('OpenWeatherMap'),
                ...options
            });

            // 添加到 Cesium 图层集合
            const imageryLayer = this.viewer.imageryLayers.addImageryProvider(provider);
            
            // 设置透明度和显示状态
            imageryLayer.alpha = options.alpha || 0.9;  // 默认90%不透明度
            imageryLayer.show = true;

            // 存储图层引用
            this.layers.set(layerId, imageryLayer);

            console.log(`✅ 图层添加成功: ${layerId}`);
            return imageryLayer;
        } catch (error) {
            console.error(`❌ 添加图层失败: ${layerId}`, error);
            return null;
        }
    }

    /**
     * 移除图层
     * @param {String} layerId - 图层ID
     */
    removeLayer(layerId) {
        const layer = this.layers.get(layerId);
        if (layer) {
            console.log(`🗑️ 移除图层: ${layerId}`);
            this.viewer.imageryLayers.remove(layer);
            this.layers.delete(layerId);
        }
    }

    /**
     * 显示/隐藏图层
     * @param {String} layerId - 图层ID
     * @param {Boolean} show - 是否显示
     */
    toggleLayer(layerId, show) {
        const layer = this.layers.get(layerId);
        if (layer) {
            layer.show = show;
            console.log(`${show ? '👁️' : '🙈'} 图层 ${layerId} ${show ? '已显示' : '已隐藏'}`);
        }
    }

    /**
     * 设置图层透明度
     * @param {String} layerId - 图层ID
     * @param {Number} alpha - 透明度 (0-1)
     */
    setLayerAlpha(layerId, alpha) {
        const layer = this.layers.get(layerId);
        if (layer) {
            layer.alpha = Math.max(0, Math.min(1, alpha));
            console.log(`🎨 图层 ${layerId} 透明度设置为: ${layer.alpha}`);
        }
    }

    /**
     * 清除所有图层
     */
    clearAll() {
        console.log('🗑️ 清除所有 OpenWeatherMap 图层');
        for (const [layerId, layer] of this.layers) {
            this.viewer.imageryLayers.remove(layer);
        }
        this.layers.clear();
    }

    /**
     * 获取当前激活的图层列表
     * @returns {Array} 图层ID列表
     */
    getActiveLayers() {
        return Array.from(this.layers.keys());
    }

    /**
     * 检查图层是否存在
     * @param {String} layerId - 图层ID
     * @returns {Boolean}
     */
    hasLayer(layerId) {
        return this.layers.has(layerId);
    }
}
