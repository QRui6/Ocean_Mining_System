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
        
        // 初始化流线（但不显示）
        this.initStreamlines();
        
        // 启动动画
        this.startAnimation();
        
        // 监听相机移动
        this.setupCameraListener();
        
        // 初始状态隐藏
        this.hideLayer();
    }
    
    setupCameraListener() {
        const camera = this.viewer.camera;
        this.lastCameraPosition = camera.position.clone();
        let checkCounter = 0;
        
        // 降低检查频率：每5帧检查一次相机移动
        this.viewer.scene.preRender.addEventListener(() => {
            checkCounter++;
            if (checkCounter % 5 !== 0) return;
            
            if (!this.lastCameraPosition) {
                this.lastCameraPosition = camera.position.clone();
                return;
            }
            
            const distance = Cesium.Cartesian3.distance(
                camera.position,
                this.lastCameraPosition
            );
            
            // 如果相机移动距离超过阈值，标记为移动中
            this.cameraMoving = distance > 1000;  // 增大阈值（从100到1000）
            
            if (!this.cameraMoving) {
                this.lastCameraPosition = camera.position.clone();
            }
        });
    }
    
    initStreamlines() {
        let successCount = 0;
        let failCount = 0;
        
        for (let i = 0; i < this.options.streamlineCount; i++) {
            const success = this.createStreamline();
            if (success) {
                successCount++;
            } else {
                failCount++;
            }
        }
        
        console.log(`🌊 流线创建完成: 成功 ${successCount} 条, 失败 ${failCount} 条`);
    }
    
    createStreamline() {
        const { bounds, sparseData } = this.windData;
        const { west, east, south, north } = bounds;
        
        // 从实际数据点中随机选择起点（确保起点有数据）
        const randomDataPoint = sparseData[Math.floor(Math.random() * sparseData.length)];
        let startLon = randomDataPoint.lon;
        let startLat = randomDataPoint.lat;
        
        // 添加一些随机偏移（在数据点附近开始，但不完全相同）
        startLon += (Math.random() - 0.5) * 0.5;
        startLat += (Math.random() - 0.5) * 0.5;
        
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
            // 添加当前位置（高度设置为10000米，约10公里）
            positions.push(Cesium.Cartesian3.fromDegrees(lon, lat, 10000));
            
            // 获取风速
            const wind = this.getWindAt(lon, lat);
            if (!wind) {
                break;
            }
            
            // 计算下一个位置
            const speed = Math.sqrt(wind.u * wind.u + wind.v * wind.v);
            if (speed < 0.1) {
                break;
            }  // 风速太小，停止
            
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
            // 初始透明度设置为 0（隐藏状态），点击按钮后再显示
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
                show: false  // 初始隐藏
            });
            
            this.streamlines.push({
                polyline: polyline,
                alpha: 0.0,
                fadeIn: true,  // 淡入阶段
                age: 0,
                maxAge: 100 + Math.random() * 100  // 随机生命周期
            });
            
            return true;  // 成功创建
        }
        
        return false;  // 创建失败
    }
    
    getWindAt(lon, lat) {
        const { bounds, sparseData, spatialGrid, gridSize, gridRows, gridCols } = this.windData;
        
        // 边界检查
        if (lon < bounds.west || lon > bounds.east || lat < bounds.south || lat > bounds.north) {
            return null;
        }
        
        // 使用空间网格快速查找最近的数据点
        const gridRow = Math.floor((lat - bounds.south) / gridSize);
        const gridCol = Math.floor((lon - bounds.west) / gridSize);
        
        if (gridRow < 0 || gridRow >= gridRows || gridCol < 0 || gridCol >= gridCols) {
            return null;
        }
        
        // 搜索当前网格及周围8个网格
        let nearestPoint = null;
        let minDistance = Infinity;
        
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const r = gridRow + dr;
                const c = gridCol + dc;
                
                if (r < 0 || r >= gridRows || c < 0 || c >= gridCols) continue;
                
                const gridIndex = r * gridCols + c;
                const points = spatialGrid[gridIndex];
                
                if (!points || points.length === 0) continue;
                
                // 在这个网格中找最近的点
                for (const point of points) {
                    const dx = point.lon - lon;
                    const dy = point.lat - lat;
                    const distance = dx * dx + dy * dy;
                    
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestPoint = point;
                    }
                }
            }
        }
        
        // 如果最近的点距离太远（超过2度），返回null
        if (!nearestPoint || minDistance > 4.0) {
            return null;
        }
        
        // 使用最近邻插值（简单但有效）
        return {
            u: nearestPoint.u,
            v: nearestPoint.v
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
        // 相机移动时暂停更新以提升性能
        if (this.cameraMoving) {
            // 即使暂停更新，也要请求渲染以保持显示
            this.viewer.scene.requestRender();
            return;
        }
        
        if (currentTime - this.lastUpdateTime < this.options.updateInterval) {
            // 即使不更新，也要请求渲染
            this.viewer.scene.requestRender();
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
        
        // 批量移除和创建（限制每帧最多处理10条）
        const maxPerFrame = Math.min(toRemove.length, 10);
        for (let i = toRemove.length - 1; i >= toRemove.length - maxPerFrame; i--) {
            const index = toRemove[i];
            const streamline = this.streamlines[index];
            this.polylineCollection.remove(streamline.polyline);
            this.streamlines.splice(index, 1);
        }
        
        // 创建新流线补充（限制每帧最多创建10条）
        for (let i = 0; i < maxPerFrame; i++) {
            this.createStreamline();
        }
        
        // 请求渲染（确保每次更新都渲染）
        this.viewer.scene.requestRender();
    }
    
    showLayer() {
        console.log('🎬 showLayer() 被调用');
        this.isVisible = true;
        if (this.polylineCollection) {
            this.polylineCollection.show = true;
            this.streamlines.forEach(streamline => {
                if (streamline.polyline) {
                    streamline.polyline.show = true;
                    // 如果透明度为0，重置为可见状态
                    if (streamline.alpha === 0) {
                        streamline.alpha = 0.5;
                        streamline.fadeIn = true;
                        streamline.age = 0;
                        // 立即更新材质
                        if (streamline.polyline.material) {
                            streamline.polyline.material.uniforms.color = this.options.color.withAlpha(0.5);
                        }
                    }
                }
            });
        }
        console.log('✅ showLayer() 完成，isVisible:', this.isVisible);
        // 强制多次渲染以确保显示
        this.viewer.scene.requestRender();
        setTimeout(() => this.viewer.scene.requestRender(), 100);
        setTimeout(() => this.viewer.scene.requestRender(), 300);
    }
    
    hideLayer() {
        console.log('🎬 hideLayer() 被调用');
        this.isVisible = false;
        if (this.polylineCollection) {
            this.polylineCollection.show = false;
            this.streamlines.forEach(streamline => {
                if (streamline.polyline) {
                    streamline.polyline.show = false;
                }
            });
        }
        console.log('✅ hideLayer() 完成，isVisible:', this.isVisible);
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
        console.log('🔧 set show() 被调用，value:', value);
        if (value) {
            this.showLayer();
        } else {
            this.hideLayer();
        }
    }
    
    get show() {
        return this.isVisible;
    }
}
