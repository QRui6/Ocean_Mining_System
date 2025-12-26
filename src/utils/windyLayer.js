/**
 * Windy 图层管理器
 * 用于在 Cesium 地图上集成 Windy 气象图层
 */

import * as Cesium from 'cesium';

export class WindyLayerManager {
    constructor(viewer) {
        this.viewer = viewer;
        this.windyAPI = null;
        this.windyMap = null;
        this.currentLayer = null;
        this.isInitialized = false;
        this.windyKey = import.meta.env.VITE_WINDY_API_KEY;
        this.windyContainer = null;
        this.syncInterval = null;
    }

    /**
     * 初始化 Windy API
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('✅ Windy 已初始化');
            return;
        }

        try {
            console.log('🌪️ 开始初始化 Windy API...');

            // 1. 先加载依赖脚本
            await this.loadWindyScript();

            // 2. 创建 Windy 容器（必须在 windyInit 之前）
            this.createWindyContainer();

            // 3. 等待容器渲染
            await this.waitForContainerReady();

            // 4. 获取 Cesium 相机位置
            const center = this.getCesiumCenter();

            // 5. 初始化 Windy 地图配置
            const options = {
                key: this.windyKey,
                lat: center.lat,
                lon: center.lon,
                zoom: this.getCesiumZoom()
            };

            console.log('🌪️ Windy 初始化参数:', options);

            // 6. 使用 Windy API 初始化（包装成 Promise）
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Windy 初始化超时'));
                }, 10000);

                window.windyInit(options, (windyAPI) => {
                    clearTimeout(timeout);
                    
                    this.windyAPI = windyAPI;
                    this.windyMap = windyAPI.map;
                    
                    console.log('✅ Windy API 初始化成功');
                    console.log('   - 可用图层:', windyAPI.store.getAllowed('overlay'));
                    console.log('   - Windy 地图对象:', this.windyMap);
                    
                    this.isInitialized = true;

                    // 同步 Cesium 和 Windy 的视角
                    this.startSync();
                    
                    resolve();
                });
            });

        } catch (error) {
            console.error('❌ Windy 初始化失败:', error);
            throw error;
        }
    }

    /**
     * 创建 Windy 容器
     */
    createWindyContainer() {
        if (this.windyContainer) {
            console.log('✅ Windy 容器已存在');
            return;
        }

        console.log('📦 创建 Windy 容器...');
        
        this.windyContainer = document.createElement('div');
        this.windyContainer.id = 'windy';
        this.windyContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 9999;
        `;
        
        // 添加到 body，而不是 Cesium 容器内
        document.body.appendChild(this.windyContainer);
        
        console.log('✅ Windy 容器已创建并添加到 DOM');
        console.log('   - 容器尺寸:', this.windyContainer.offsetWidth, 'x', this.windyContainer.offsetHeight);
    }

    /**
     * 等待容器准备就绪
     */
    waitForContainerReady() {
        return new Promise((resolve) => {
            // 使用 requestAnimationFrame 确保容器已渲染
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    console.log('✅ Windy 容器已准备就绪');
                    resolve();
                });
            });
        });
    }

    /**
     * 动态加载 Windy API 脚本
     */
    loadWindyScript() {
        return new Promise(async (resolve, reject) => {
            // 检查是否已加载
            if (window.windyInit) {
                console.log('✅ Windy 脚本已加载');
                resolve();
                return;
            }

            try {
                // 1. 先加载 Leaflet CSS
                await this.loadLeafletCSS();
                
                // 2. 再加载 Leaflet JS
                await this.loadLeafletJS();
                
                // 3. 最后加载 Windy 脚本
                console.log('⏳ 开始加载 Windy 脚本...');
                const script = document.createElement('script');
                script.src = 'https://api.windy.com/assets/map-forecast/libBoot.js';
                script.async = true;
                
                script.onload = () => {
                    console.log('✅ Windy 脚本加载成功，等待初始化...');
                    // 等待 windyInit 函数可用
                    setTimeout(() => {
                        if (window.windyInit) {
                            console.log('✅ windyInit 函数已就绪');
                            resolve();
                        } else {
                            console.error('❌ windyInit 函数不可用');
                            reject(new Error('Windy 脚本加载失败'));
                        }
                    }, 1000);
                };
                
                script.onerror = () => {
                    console.error('❌ Windy 脚本加载失败');
                    reject(new Error('Windy 脚本加载失败'));
                };
                
                document.head.appendChild(script);
            } catch (error) {
                console.error('❌ 加载依赖失败:', error);
                reject(error);
            }
        });
    }

    /**
     * 加载 Leaflet CSS
     */
    loadLeafletCSS() {
        return new Promise((resolve, reject) => {
            // 检查是否已加载
            const existingLink = document.querySelector('link[href*="leaflet.css"]');
            if (existingLink) {
                console.log('✅ Leaflet CSS 已加载');
                resolve();
                return;
            }

            console.log('⏳ 开始加载 Leaflet CSS...');
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.4.0/dist/leaflet.css';
            
            link.onload = () => {
                console.log('✅ Leaflet CSS 加载成功');
                resolve();
            };
            
            link.onerror = () => {
                console.error('❌ Leaflet CSS 加载失败');
                reject(new Error('Leaflet CSS 加载失败'));
            };
            
            document.head.appendChild(link);
        });
    }

    /**
     * 加载 Leaflet JS
     */
    loadLeafletJS() {
        return new Promise((resolve, reject) => {
            // 检查是否已加载
            if (window.L) {
                console.log('✅ Leaflet JS 已加载');
                resolve();
                return;
            }

            console.log('⏳ 开始加载 Leaflet JS...');
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.4.0/dist/leaflet.js';
            script.async = true;
            
            script.onload = () => {
                console.log('✅ Leaflet JS 加载成功');
                resolve();
            };
            
            script.onerror = () => {
                console.error('❌ Leaflet JS 加载失败');
                reject(new Error('Leaflet JS 加载失败'));
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * 获取 Cesium 相机中心点
     */
    getCesiumCenter() {
        const camera = this.viewer.camera;
        const ellipsoid = this.viewer.scene.globe.ellipsoid;
        const windowPosition = new Cesium.Cartesian2(
            this.viewer.canvas.clientWidth / 2,
            this.viewer.canvas.clientHeight / 2
        );
        const ray = camera.getPickRay(windowPosition);
        const cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);

        if (cartesian) {
            const cartographic = ellipsoid.cartesianToCartographic(cartesian);
            return {
                lat: Cesium.Math.toDegrees(cartographic.latitude),
                lon: Cesium.Math.toDegrees(cartographic.longitude)
            };
        }

        // 默认返回当前相机位置
        const cameraCartographic = camera.positionCartographic;
        return {
            lat: Cesium.Math.toDegrees(cameraCartographic.latitude),
            lon: Cesium.Math.toDegrees(cameraCartographic.longitude)
        };
    }

    /**
     * 获取 Cesium 缩放级别（转换为 Leaflet zoom）
     */
    getCesiumZoom() {
        const camera = this.viewer.camera;
        const height = camera.positionCartographic.height;
        
        // 将 Cesium 高度转换为 Leaflet zoom level
        // Leaflet zoom 公式: zoom = log2(earthCircumference / (tileSize * metersPerPixel))
        const earthCircumference = 40075017; // 地球周长（米）
        const tileSize = 256;
        const metersPerPixel = height / this.viewer.canvas.clientHeight;
        const zoom = Math.log2(earthCircumference / (tileSize * metersPerPixel));
        
        return Math.max(1, Math.min(18, Math.round(zoom)));
    }

    /**
     * 同步 Cesium 和 Windy 的视角
     */
    startSync() {
        // 监听 Cesium 相机移动
        this.viewer.camera.moveEnd.addEventListener(() => {
            if (this.windyMap && this.isInitialized) {
                const center = this.getCesiumCenter();
                const zoom = this.getCesiumZoom();
                
                console.log(`🔄 同步视角: lat=${center.lat.toFixed(2)}, lon=${center.lon.toFixed(2)}, zoom=${zoom}`);
                
                // 更新 Windy 地图视角
                this.windyMap.setView([center.lat, center.lon], zoom);
            }
        });

        console.log('✅ Cesium-Windy 视角同步已启动');
    }

    /**
     * 显示指定的 Windy 图层
     * @param {String} layerName - 图层名称 (wind, temp, clouds, rain, waves, pressure)
     */
    async showLayer(layerName) {
        console.log(`🌪️ 请求显示 Windy 图层: ${layerName}`);
        
        if (!this.isInitialized) {
            console.log('⏳ Windy 未初始化，开始初始化...');
            await this.initialize();
        }

        if (!this.windyAPI) {
            console.error('❌ Windy API 未初始化');
            return;
        }

        try {
            console.log(`🎨 设置 Windy 图层: ${layerName}`);

            // 设置图层
            this.windyAPI.store.set('overlay', layerName);
            this.currentLayer = layerName;

            // 显示容器
            if (this.windyContainer) {
                this.windyContainer.style.display = 'block';
                console.log('👁️ Windy 容器已显示');
            }

            console.log(`✅ Windy 图层 "${layerName}" 已显示`);
        } catch (error) {
            console.error(`❌ 显示 Windy 图层失败:`, error);
        }
    }

    /**
     * 隐藏当前 Windy 图层
     */
    hideLayer() {
        // 不要隐藏容器，只是清除当前图层
        // 容器应该保持显示，除非明确调用 destroy()
        this.currentLayer = null;
        console.log('✅ Windy 当前图层已清除（容器保持显示）');
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
            this.hideLayer();
        }
    }

    /**
     * 销毁 Windy 图层
     */
    destroy() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        if (this.windyContainer && this.windyContainer.parentNode) {
            this.windyContainer.parentNode.removeChild(this.windyContainer);
        }

        this.windyAPI = null;
        this.windyMap = null;
        this.currentLayer = null;
        this.isInitialized = false;

        console.log('✅ Windy 图层管理器已销毁');
    }
}
