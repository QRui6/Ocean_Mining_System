/**
 * Windy API 图层管理器
 * 使用 Windy 官方 API 获取实时气象数据
 * 
 * 特点：
 * - 实时气象数据（每3小时更新）
 * - 预报数据（未来10天）
 * - 动画效果（风场粒子）
 * - 时间轴控制
 */

import * as Cesium from 'cesium';

export class WindyApiLayer {
    constructor(viewer) {
        this.viewer = viewer;
        this.windyAPI = null;
        this.windyMap = null;
        this.windyContainer = null;
        this.isInitialized = false;
        this.currentOverlay = null;
        this.apiKey = import.meta.env.VITE_WINDY_API_KEY;
    }

    /**
     * 初始化 Windy API
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('✅ Windy API 已初始化');
            return;
        }

        try {
            console.log('🌪️ 开始初始化 Windy API...');

            // 1. 加载 Leaflet CSS（Windy 依赖 Leaflet）
            await this.loadLeafletCSS();

            // 2. 加载 Leaflet JS
            await this.loadLeafletJS();

            // 3. 加载 Windy API
            await this.loadWindyScript();

            // 4. 创建 Windy 容器（覆盖在 Cesium 上）
            this.createWindyContainer();

            // 5. 获取 Cesium 当前视角
            const center = this.getCesiumCenter();
            const zoom = this.getCesiumZoom();

            // 6. 初始化 Windy
            const options = {
                key: this.apiKey,
                lat: center.lat,
                lon: center.lon,
                zoom: zoom
            };

            console.log('🌪️ Windy 初始化参数:', options);

            // 7. 使用 windyInit 初始化
            await new Promise((resolve, reject) => {
                window.windyInit(options, (windyAPI) => {
                    this.windyAPI = windyAPI;
                    this.windyMap = windyAPI.map;
                    
                    console.log('✅ Windy API 初始化成功');
                    console.log('   - 可用图层:', windyAPI.store.getAllowed('overlay'));
                    console.log('   - 当前时间:', new Date(windyAPI.store.get('timestamp')));
                    
                    this.isInitialized = true;
                    
                    // 同步 Cesium 和 Windy 的视角
                    this.setupSync();
                    
                    resolve();
                });
            });

        } catch (error) {
            console.error('❌ Windy API 初始化失败:', error);
            throw error;
        }
    }

    /**
     * 加载 Leaflet CSS
     */
    loadLeafletCSS() {
        return new Promise((resolve) => {
            if (document.querySelector('link[href*="leaflet.css"]')) {
                console.log('✅ Leaflet CSS 已加载');
                resolve();
                return;
            }

            console.log('⏳ 加载 Leaflet CSS...');
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            link.onload = () => {
                console.log('✅ Leaflet CSS 加载成功');
                resolve();
            };
            link.onerror = () => {
                console.warn('⚠️ Leaflet CSS 加载失败');
                resolve();
            };
            document.head.appendChild(link);
        });
    }

    /**
     * 加载 Leaflet JS
     */
    loadLeafletJS() {
        return new Promise((resolve, reject) => {
            if (window.L) {
                console.log('✅ Leaflet JS 已加载');
                resolve();
                return;
            }

            console.log('⏳ 加载 Leaflet JS...');
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
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
     * 加载 Windy API 脚本
     */
    loadWindyScript() {
        return new Promise((resolve, reject) => {
            if (window.windyInit) {
                console.log('✅ Windy API 已加载');
                resolve();
                return;
            }

            console.log('⏳ 加载 Windy API...');
            const script = document.createElement('script');
            script.src = 'https://api.windy.com/assets/map-forecast/libBoot.js';
            script.async = true;
            script.onload = () => {
                console.log('✅ Windy API 加载成功');
                setTimeout(() => {
                    if (window.windyInit) {
                        resolve();
                    } else {
                        reject(new Error('windyInit 不可用'));
                    }
                }, 500);
            };
            script.onerror = () => {
                console.error('❌ Windy API 加载失败');
                reject(new Error('Windy API 加载失败'));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * 创建 Windy 容器
     */
    createWindyContainer() {
        if (this.windyContainer) return;

        this.windyContainer = document.createElement('div');
        this.windyContainer.id = 'windy-map';
        this.windyContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        `;
        
        this.viewer.container.appendChild(this.windyContainer);
        console.log('✅ Windy 容器已创建');
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
        const earthCircumference = 40075017;
        const tileSize = 256;
        const metersPerPixel = height / this.viewer.canvas.clientHeight;
        const zoom = Math.log2(earthCircumference / (tileSize * metersPerPixel));
        return Math.max(1, Math.min(18, Math.round(zoom)));
    }

    /**
     * 同步 Cesium 和 Windy 的视角
     */
    setupSync() {
        this.viewer.camera.moveEnd.addEventListener(() => {
            if (this.windyMap && this.isInitialized) {
                const center = this.getCesiumCenter();
                const zoom = this.getCesiumZoom();
                this.windyMap.setView([center.lat, center.lon], zoom);
            }
        });
        console.log('✅ Cesium-Windy 视角同步已启动');
    }

    /**
     * 显示指定的气象图层
     * @param {String} overlayName - 图层名称 (wind, temp, clouds, rain, waves, pressure)
     */
    async showOverlay(overlayName) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.windyAPI) {
            console.error('❌ Windy API 未初始化');
            return;
        }

        try {
            console.log(`🌪️ 显示 Windy 图层: ${overlayName}`);

            // 设置图层
            this.windyAPI.store.set('overlay', overlayName);
            this.currentOverlay = overlayName;

            // 显示容器
            if (this.windyContainer) {
                this.windyContainer.style.display = 'block';
            }

            console.log(`✅ Windy 图层 "${overlayName}" 已显示`);
            console.log(`   - 当前时间: ${new Date(this.windyAPI.store.get('timestamp'))}`);
            console.log(`   - 数据源: ${this.windyAPI.store.get('product')}`);

        } catch (error) {
            console.error(`❌ 显示 Windy 图层失败:`, error);
        }
    }

    /**
     * 隐藏 Windy 图层
     */
    hide() {
        if (this.windyContainer) {
            this.windyContainer.style.display = 'none';
        }
        this.currentOverlay = null;
        console.log('✅ Windy 图层已隐藏');
    }

    /**
     * 切换图层显示状态
     * @param {String} overlayName - 图层名称
     * @param {Boolean} visible - 是否显示
     */
    async toggleOverlay(overlayName, visible) {
        if (visible) {
            await this.showOverlay(overlayName);
        } else {
            this.hide();
        }
    }

    /**
     * 设置时间（用于查看预报数据）
     * @param {Date} timestamp - 时间戳
     */
    setTimestamp(timestamp) {
        if (this.windyAPI) {
            this.windyAPI.store.set('timestamp', timestamp.getTime());
            console.log(`⏰ 时间已设置为: ${timestamp}`);
        }
    }

    /**
     * 获取可用的时间列表
     * @returns {Array} 时间戳数组
     */
    getAvailableTimestamps() {
        if (this.windyAPI) {
            return this.windyAPI.store.get('availTimestamps');
        }
        return [];
    }

    /**
     * 销毁 Windy 图层
     */
    destroy() {
        if (this.windyContainer && this.windyContainer.parentNode) {
            this.windyContainer.parentNode.removeChild(this.windyContainer);
        }

        this.windyAPI = null;
        this.windyMap = null;
        this.currentOverlay = null;
        this.isInitialized = false;

        console.log('✅ Windy API 图层已销毁');
    }
}
