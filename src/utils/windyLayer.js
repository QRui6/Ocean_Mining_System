/**
 * 气象图层管理器 - 使用 OpenWeatherMap
 * OpenWeatherMap 提供实时气象瓦片数据，支持 API Key
 */

import * as Cesium from 'cesium';

export class WindyLayerManager {
    constructor(viewer) {
        this.viewer = viewer;
        this.currentLayers = new Map(); // 存储当前激活的图层
        // 使用 OpenWeatherMap API Key（从环境变量获取）
        this.apiKey = import.meta.env.VITE_OPENWEATHERMAP_API_KEY || '4e2486228d2e4e8e8e2486228d2e4e8e';
    }

    /**
     * 显示指定的气象图层
     * @param {String} layerName - 图层名称 (wind, temp, clouds, rain, pressure)
     */
    async showLayer(layerName) {
        try {
            console.log(`🌪️ 显示气象图层: ${layerName}`);

            // 如果图层已存在，直接显示
            if (this.currentLayers.has(layerName)) {
                const layer = this.currentLayers.get(layerName);
                layer.show = true;
                console.log(`✅ 气象图层 "${layerName}" 已显示（复用现有图层）`);
                console.log(`   - 图层索引: ${this.viewer.imageryLayers.indexOf(layer)}`);
                console.log(`   - 透明度: ${layer.alpha}`);
                console.log(`   - 显示状态: ${layer.show}`);
                return;
            }

            // 创建新的图层
            const imageryLayer = this.createWeatherLayer(layerName);
            
            if (imageryLayer) {
                this.currentLayers.set(layerName, imageryLayer);
                console.log(`✅ 气象图层 "${layerName}" 已创建并显示`);
                console.log(`   - 图层索引: ${this.viewer.imageryLayers.indexOf(imageryLayer)}`);
                console.log(`   - 透明度: ${imageryLayer.alpha}`);
                console.log(`   - 显示状态: ${imageryLayer.show}`);
                console.log(`   - 总图层数: ${this.viewer.imageryLayers.length}`);
            }

        } catch (error) {
            console.error(`❌ 显示气象图层失败:`, error);
        }
    }

    /**
     * 创建气象瓦片图层
     * @param {String} layerName - 图层名称
     * @returns {Cesium.ImageryLayer} Cesium 图层对象
     */
    createWeatherLayer(layerName) {
        // 映射图层名称到 OpenWeatherMap 的图层代码
        const layerMapping = {
            'wind': 'wind_new',
            'temp': 'temp_new',
            'clouds': 'clouds_new',
            'rain': 'precipitation_new',
            'pressure': 'pressure_new',
            'waves': 'wind_new' // OpenWeatherMap 没有海浪数据，用风速代替
        };

        const owmLayer = layerMapping[layerName] || 'temp_new';
        
        // OpenWeatherMap 瓦片服务 URL
        const tileUrl = `https://tile.openweathermap.org/map/${owmLayer}/{z}/{x}/{y}.png?appid=${this.apiKey}`;

        console.log(`📍 创建气象瓦片图层:`);
        console.log(`   - 图层名称: ${layerName}`);
        console.log(`   - OWM 图层: ${owmLayer}`);
        console.log(`   - 瓦片 URL: ${tileUrl.replace(this.apiKey, '***')}`);

        // 创建 UrlTemplateImageryProvider
        const provider = new Cesium.UrlTemplateImageryProvider({
            url: tileUrl,
            maximumLevel: 15, // OpenWeatherMap 支持更高的缩放级别
            minimumLevel: 0,
            tilingScheme: new Cesium.WebMercatorTilingScheme(),
            credit: new Cesium.Credit('OpenWeatherMap', false)
        });

        console.log(`   - Provider 已创建`);

        // 添加到 Cesium 图层
        const imageryLayer = this.viewer.imageryLayers.addImageryProvider(provider);
        
        console.log(`   - 图层已添加到 viewer`);
        
        // 设置透明度和其他属性
        imageryLayer.alpha = 0.7; // 70% 透明度
        imageryLayer.brightness = 1.0;
        imageryLayer.contrast = 1.0;
        imageryLayer.show = true;

        console.log(`   - 图层属性已设置 (alpha: ${imageryLayer.alpha})`);

        return imageryLayer;
    }

    /**
     * 隐藏指定图层
     * @param {String} layerName - 图层名称
     */
    hideLayer(layerName) {
        if (this.currentLayers.has(layerName)) {
            const layer = this.currentLayers.get(layerName);
            layer.show = false;
            console.log(`✅ 气象图层 "${layerName}" 已隐藏`);
        }
    }

    /**
     * 移除指定图层
     * @param {String} layerName - 图层名称
     */
    removeLayer(layerName) {
        if (this.currentLayers.has(layerName)) {
            const layer = this.currentLayers.get(layerName);
            this.viewer.imageryLayers.remove(layer);
            this.currentLayers.delete(layerName);
            console.log(`✅ 气象图层 "${layerName}" 已移除`);
        }
    }

    /**
     * 切换图层显示状态
     * @param {String} layerName - 图层名称
     * @param {Boolean} visible - 是否显示
     */
    async toggleLayer(layerName, visible) {
        if (visible) {
            await this.showLayer(layerName);
        } else {
            this.hideLayer(layerName);
        }
    }

    /**
     * 设置图层透明度
     * @param {String} layerName - 图层名称
     * @param {Number} alpha - 透明度 (0-1)
     */
    setLayerAlpha(layerName, alpha) {
        if (this.currentLayers.has(layerName)) {
            const layer = this.currentLayers.get(layerName);
            layer.alpha = alpha;
            console.log(`✅ 气象图层 "${layerName}" 透明度已设置为 ${alpha}`);
        }
    }

    /**
     * 获取所有激活的图层
     * @returns {Array} 图层名称数组
     */
    getActiveLayers() {
        return Array.from(this.currentLayers.keys());
    }

    /**
     * 清除所有图层
     */
    clearAllLayers() {
        this.currentLayers.forEach((layer, name) => {
            this.viewer.imageryLayers.remove(layer);
            console.log(`✅ 气象图层 "${name}" 已移除`);
        });
        this.currentLayers.clear();
        console.log('✅ 所有气象图层已清除');
    }

    /**
     * 销毁图层管理器
     */
    destroy() {
        this.clearAllLayers();
        console.log('✅ 气象图层管理器已销毁');
    }
}
