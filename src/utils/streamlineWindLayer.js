/**
 * 流线风场图层实现
 * 使用 Cesium PolylineCollection 实现真正的流线效果
 */

import * as Cesium from 'cesium';

export class StreamlineWindLayer {
    constructor(viewer, windData, options = {}) {
        this.viewer = viewer;
        this.windData = windData;
        this.options = {
            streamlineCount: options.streamlineCount || 2500,  // 流线数量（密集）
            segmentLength: options.segmentLength || 0.5,  // 每段长度（度）
            maxSegments: options.maxSegments || 120,  // 最大段数（长流线）
            minSegments: options.minSegments || 40,   // 最小段数
            lineWidth: options.lineWidth || 1.5,  // 线宽
            updateInterval: options.updateInterval || 80,  // 更新间隔（80ms，降低更新频率）
            fadeSpeed: options.fadeSpeed || 0.025,  // 淡出速度（慢一点）
            color: options.color || Cesium.Color.CYAN  // 流线颜色
        };
        
        this.streamlines = [];
        this.polylineCollection = null;
        this.isVisible = false;
        this.lastUpdateTime = 0;
        
        // 预创建颜色对象以避免每帧创建
        this.colorCache = new Map();
        
        // 相机移动检测
        this.cameraMoving = false;
        this.lastCameraPosition = null;
        
        this.init();
    }
    
    init() {
        // 创建 PolylineCollection
        this.polylineCollection = this.viewer.scene.primitives.add(
            new Cesium.PolylineCollection()
        );
        
        // 初始化流线
        this.initStreamlines();
        
        // 启动动画
        this.startAnimation();
        
        // 监听相机移动
        this.setupCameraListener();
    }
    
    setupCameraListener() {
        const camera = this.viewer.camera;
        this.lastCameraPosition = camera.position.clone();
        
        // 每帧检查相机是否移动
        this.viewer.scene.preRender.addEventListener(() => {
            if (!this.lastCameraPosition) {
                this.lastCameraPosition = camera.position.clone();
                return;
            }
            
            const distance = Cesium.Cartesian3.distance(
                camera.position,
                this.lastCameraPosition
            );
            
            // 如果相机移动距离超过阈值，标记为移动中
            this.cameraMoving = distance > 100;
            
            if (!this.cameraMoving) {
                this.lastCameraPosition = camera.position.clone();
            }
        });
    }
    
    initStreamlines() {
        for (let i = 0; i < this.options.streamlineCount; i++) {
            this.createStreamline();
        }
    }
    
    createStreamline() {
        const { west, east, south, north } = this.windData.bounds;
        
        // 随机起点
        const startLon = west + Math.random() * (east - west);
        const startLat = south + Math.random() * (north - south);
        
        // 随机流线长度（段数）
        const segments = Math.floor(
            this.options.minSegments + 
            Math.random() * (this.options.maxSegments - this.options.minSegments)
        );
        
        // 生成流线路径
        const positions = [];
        let lon = startLon;
        let lat = startLat;
        
        for (let i = 0; i < segments; i++) {
            // 添加当前位置
            positions.push(Cesium.Cartesian3.fromDegrees(lon, lat, 100000));
            
            // 获取风速
            const wind = this.getWindAt(lon, lat);
            if (!wind) break;
            
            // 计算下一个位置
            const speed = Math.sqrt(wind.u * wind.u + wind.v * wind.v);
            if (speed < 0.1) break;  // 风速太小，停止
            
            // 归一化风向
            const dx = wind.u / speed;
            const dy = wind.v / speed;
            
            // 移动到下一个位置
            lon += dx * this.options.segmentLength;
            lat += dy * this.options.segmentLength;
            
            // 边界检查
            if (lon < west || lon > east || lat < south || lat > north) {
                break;
            }
        }
        
        // 只有至少2个点才创建流线
        if (positions.length >= 2) {
            const polyline = this.polylineCollection.add({
                positions: positions,
                width: this.options.lineWidth,
                material: new Cesium.Material({
                    fabric: {
                        type: 'Color',
                        uniforms: {
                            color: this.options.color.withAlpha(0.0)
                        }
                    }
                }),
                show: false
            });
            
            this.streamlines.push({
                polyline: polyline,
                alpha: 0.0,
                fadeIn: true,  // 淡入阶段
                age: 0,
                maxAge: 100 + Math.random() * 100  // 随机生命周期
            });
        }
    }
    
    getWindAt(lon, lat) {
        const { bounds, width, height, u, v } = this.windData;
        
        // 计算网格索引
        const x = Math.floor(((lon - bounds.west) / (bounds.east - bounds.west)) * (width - 1));
        const y = Math.floor(((lat - bounds.south) / (bounds.north - bounds.south)) * (height - 1));
        
        if (x < 0 || x >= width || y < 0 || y >= height) {
            return null;
        }
        
        const index = y * width + x;
        
        return {
            u: u.array[index] || 0,
            v: v.array[index] || 0
        };
    }
    
    startAnimation() {
        this.viewer.clock.onTick.addEventListener(this.updateStreamlines, this);
    }
    
    stopAnimation() {
        this.viewer.clock.onTick.removeEventListener(this.updateStreamlines, this);
    }
    
    updateStreamlines = () => {
        if (!this.isVisible) return;
        
        const currentTime = Date.now();
        // 相机移动时降低更新频率（而不是完全停止）
        const interval = this.cameraMoving ? this.options.updateInterval * 3 : this.options.updateInterval;
        
        if (currentTime - this.lastUpdateTime < interval) {
            return;
        }
        this.lastUpdateTime = currentTime;
        
        // 批量更新流线（避免在循环中删除元素）
        const toRemove = [];
        
        for (let i = 0; i < this.streamlines.length; i++) {
            const streamline = this.streamlines[i];
            streamline.age++;
            
            if (streamline.fadeIn) {
                // 淡入阶段
                streamline.alpha = Math.min(streamline.alpha + this.options.fadeSpeed * 2, 0.7);
                if (streamline.alpha >= 0.7) {
                    streamline.fadeIn = false;
                }
            } else if (streamline.age > streamline.maxAge) {
                // 淡出阶段
                streamline.alpha = Math.max(streamline.alpha - this.options.fadeSpeed, 0);
                
                if (streamline.alpha <= 0) {
                    toRemove.push(i);
                    continue;
                }
            }
            
            // 更新透明度 - 直接修改 material 的 uniforms，避免创建新对象
            if (streamline.polyline && streamline.polyline.material) {
                streamline.polyline.material.uniforms.color = this.options.color.withAlpha(streamline.alpha);
            }
        }
        
        // 批量移除和创建
        for (let i = toRemove.length - 1; i >= 0; i--) {
            const index = toRemove[i];
            const streamline = this.streamlines[index];
            this.polylineCollection.remove(streamline.polyline);
            this.streamlines.splice(index, 1);
        }
        
        // 创建新流线补充
        for (let i = 0; i < toRemove.length; i++) {
            this.createStreamline();
        }
    }
    
    show() {
        this.isVisible = true;
        if (this.polylineCollection) {
            this.polylineCollection.show = true;
            this.streamlines.forEach(streamline => {
                if (streamline.polyline) {
                    streamline.polyline.show = true;
                }
            });
        }
    }
    
    hide() {
        this.isVisible = false;
        if (this.polylineCollection) {
            this.polylineCollection.show = false;
            this.streamlines.forEach(streamline => {
                if (streamline.polyline) {
                    streamline.polyline.show = false;
                }
            });
        }
    }
    
    remove() {
        this.stopAnimation();
        if (this.polylineCollection) {
            this.viewer.scene.primitives.remove(this.polylineCollection);
            this.polylineCollection = null;
        }
        this.streamlines = [];
    }
    
    // 设置显示状态（兼容 cesium-wind-layer 接口）
    set show(value) {
        if (value) {
            this.isVisible = true;
            if (this.polylineCollection) {
                this.polylineCollection.show = true;
                this.streamlines.forEach(streamline => {
                    if (streamline.polyline) {
                        streamline.polyline.show = true;
                    }
                });
            }
        } else {
            this.isVisible = false;
            if (this.polylineCollection) {
                this.polylineCollection.show = false;
                this.streamlines.forEach(streamline => {
                    if (streamline.polyline) {
                        streamline.polyline.show = false;
                    }
                });
            }
        }
    }
    
    get show() {
        return this.isVisible;
    }
}
