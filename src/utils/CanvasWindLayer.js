/**
 * Canvas 2D 风场粒子系统
 * 模仿 earth.nullschool.net 的风场效果
 */

import * as Cesium from 'cesium';

export class CanvasWindLayer {
    constructor(viewer, windData, options = {}) {
        this.viewer = viewer;
        this.windData = windData;
        this.options = {
            particleCount: options.particleCount || 8000,  // 粒子数量
            particleAge: options.particleAge || 100,  // 粒子生命周期（帧数）
            lineWidth: options.lineWidth || 1.5,  // 线宽
            speedFactor: options.speedFactor || 0.3,  // 速度因子
            fadeOpacity: options.fadeOpacity || 0.96,  // 拖尾淡化速度（越接近1拖尾越长）
            colorScale: options.colorScale || 'white',  // 'white' 或 'speed'
            maxAge: options.maxAge || 100,  // 最大年龄
            minAge: options.minAge || 50   // 最小年龄
        };
        
        this.particles = [];
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
        this.isVisible = false;
        this.frameCount = 0;  // 帧计数器
        this.cameraMoving = false;  // 相机移动标志
        
        this.init();
    }
    
    init() {
        // 创建 Canvas 元素
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';  // 不拦截鼠标事件
        this.canvas.style.zIndex = '10';  // 在地图上方
        this.canvas.style.display = 'none';  // 初始隐藏
        
        // 添加到 Cesium 容器
        const cesiumContainer = this.viewer.container;
        cesiumContainer.appendChild(this.canvas);
        
        // 获取 2D 上下文
        this.ctx = this.canvas.getContext('2d');
        
        // 设置 Canvas 尺寸
        this.resizeCanvas();
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // 初始化粒子
        this.initParticles();
        
        // 监听相机移动
        this.setupCameraListener();
        
        console.log('🎨 Canvas 风场图层初始化完成');
    }
    
    resizeCanvas() {
        const width = this.viewer.canvas.clientWidth;
        const height = this.viewer.canvas.clientHeight;
        
        // 设置 Canvas 的实际像素尺寸（考虑设备像素比）
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        
        // 缩放上下文以匹配设备像素比
        this.ctx.scale(dpr, dpr);
        
        // 设置 Canvas 的 CSS 尺寸
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        
        console.log('📐 Canvas 尺寸调整:', width, 'x', height, 'DPR:', dpr);
    }
    
    setupCameraListener() {
        const camera = this.viewer.camera;
        
        // 监听相机移动开始
        camera.moveStart.addEventListener(() => {
            console.log('📷 相机开始移动');
            this.cameraMoving = true;
            
            // 立即清空画布
            const width = this.canvas.width / (window.devicePixelRatio || 1);
            const height = this.canvas.height / (window.devicePixelRatio || 1);
            this.ctx.clearRect(0, 0, width, height);
        });
        
        // 监听相机移动结束
        camera.moveEnd.addEventListener(() => {
            console.log('📷 相机停止移动');
            this.cameraMoving = false;
            
            // 重置所有粒子到新位置
            this.particles.forEach(particle => {
                this.resetParticle(particle);
            });
        });
        
        console.log('✅ 相机监听器已设置');
    }
    
    initParticles() {
        this.particles = [];
        for (let i = 0; i < this.options.particleCount; i++) {
            this.particles.push(this.createParticle());
        }
        console.log('✨ 创建了', this.particles.length, '个粒子');
    }
    
    createParticle() {
        // 在屏幕上随机位置创建粒子
        const x = Math.random() * this.canvas.width / (window.devicePixelRatio || 1);
        const y = Math.random() * this.canvas.height / (window.devicePixelRatio || 1);
        
        // 随机生命周期
        const maxAge = this.options.minAge + Math.random() * (this.options.maxAge - this.options.minAge);
        
        return {
            x: x,
            y: y,
            vx: 0,  // x 方向速度（用于平滑移动）
            vy: 0,  // y 方向速度
            age: Math.random() * maxAge,  // 随机初始年龄，避免同时重生
            maxAge: maxAge,
            xt: x,  // 上一帧的 x 坐标（用于绘制线段）
            yt: y,  // 上一帧的 y 坐标
            history: []  // 历史位置（用于贝塞尔曲线）
        };
    }
    
    // 屏幕坐标转地理坐标
    screenToGeo(x, y) {
        const cartesian = this.viewer.camera.pickEllipsoid(
            new Cesium.Cartesian2(x, y),
            this.viewer.scene.globe.ellipsoid
        );
        
        if (!cartesian) return null;
        
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        return {
            lon: Cesium.Math.toDegrees(cartographic.longitude),
            lat: Cesium.Math.toDegrees(cartographic.latitude)
        };
    }
    
    // 地理坐标转屏幕坐标
    geoToScreen(lon, lat) {
        const cartesian = Cesium.Cartesian3.fromDegrees(lon, lat);
        const screenPos = Cesium.SceneTransforms.wgs84ToWindowCoordinates(
            this.viewer.scene,
            cartesian
        );
        
        if (!screenPos) return null;
        
        return {
            x: screenPos.x,
            y: screenPos.y
        };
    }
    
    // 获取指定地理位置的风速
    getWindAt(lon, lat) {
        const { bounds, spatialGrid, gridSize, gridRows, gridCols } = this.windData;
        
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
        
        // 使用最近邻插值
        return {
            u: nearestPoint.u,
            v: nearestPoint.v
        };
    }
    
    // 更新粒子位置
    updateParticle(particle) {
        // 保存上一帧位置到历史记录
        particle.history.push({x: particle.x, y: particle.y});
        if (particle.history.length > 3) {
            particle.history.shift();  // 只保留最近 3 个位置
        }
        
        // 保存上一帧位置
        particle.xt = particle.x;
        particle.yt = particle.y;
        
        // 屏幕坐标转地理坐标
        const geo = this.screenToGeo(particle.x, particle.y);
        
        if (!geo) {
            // 粒子超出地球范围，重生
            this.resetParticle(particle);
            return;
        }
        
        // 获取风速
        const wind = this.getWindAt(geo.lon, geo.lat);
        
        if (!wind) {
            // 没有风速数据，重生
            this.resetParticle(particle);
            return;
        }
        
        // 速度平滑：80% 旧速度 + 20% 新速度
        particle.vx = particle.vx * 0.8 + wind.u * this.options.speedFactor * 0.2;
        particle.vy = particle.vy * 0.8 + wind.v * this.options.speedFactor * 0.2;
        
        // 计算新的地理位置（使用平滑后的速度）
        const speed = Math.sqrt(wind.u * wind.u + wind.v * wind.v);
        const newLon = geo.lon + particle.vx;
        const newLat = geo.lat + particle.vy;
        
        // 转换回屏幕坐标
        const newScreen = this.geoToScreen(newLon, newLat);
        
        if (!newScreen) {
            // 转换失败，重生
            this.resetParticle(particle);
            return;
        }
        
        // 更新粒子位置
        particle.x = newScreen.x;
        particle.y = newScreen.y;
        particle.speed = speed;  // 保存速度用于颜色映射
        
        // 增加年龄
        particle.age++;
        
        // 如果粒子太老，重生
        if (particle.age > particle.maxAge) {
            this.resetParticle(particle);
        }
    }
    
    // 重置粒子到随机位置
    resetParticle(particle) {
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        
        particle.x = Math.random() * width;
        particle.y = Math.random() * height;
        particle.xt = particle.x;
        particle.yt = particle.y;
        particle.vx = 0;  // 重置速度
        particle.vy = 0;
        particle.age = 0;
        particle.maxAge = this.options.minAge + Math.random() * (this.options.maxAge - this.options.minAge);
        particle.history = [];  // 清空历史
    }
    
    // 根据速度获取颜色
    getColorBySpeed(speed) {
        if (this.options.colorScale === 'white') {
            return 'rgba(255, 255, 255, 0.4)';  // 降低透明度避免过度累积
        }
        
        // 根据风速映射颜色（蓝色 -> 绿色 -> 黄色 -> 红色）
        if (speed < 5) {
            return `rgba(0, 255, 255, 0.4)`;  // 青色
        } else if (speed < 10) {
            return `rgba(0, 255, 0, 0.4)`;  // 绿色
        } else if (speed < 15) {
            return `rgba(255, 255, 0, 0.4)`;  // 黄色
        } else {
            return `rgba(255, 0, 0, 0.4)`;  // 红色
        }
    }
    
    // 绘制一帧
    draw() {
        // 相机移动时不绘制（避免残影）
        if (this.cameraMoving) {
            return;
        }
        
        this.frameCount++;
        
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        
        // 周期性完全清空（防止长期累积）
        if (this.frameCount % 200 === 0) {
            this.ctx.clearRect(0, 0, width, height);
        } else {
            // 使用透明淡化（不是黑色）
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            this.ctx.fillRect(0, 0, width, height);
            this.ctx.globalCompositeOperation = 'source-over';
        }
        
        // 绘制所有粒子
        this.ctx.lineWidth = this.options.lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';  // 设置线段连接处为圆角
        
        for (const particle of this.particles) {
            // 更新粒子位置
            this.updateParticle(particle);
            
            // 绘制粒子轨迹
            if (particle.age > 0) {
                const color = this.getColorBySpeed(particle.speed || 0);
                this.ctx.strokeStyle = color;
                
                // 如果有足够的历史位置，使用贝塞尔曲线绘制平滑轨迹
                if (particle.history.length >= 3) {
                    const p0 = particle.history[0];
                    const p1 = particle.history[1];
                    const p2 = particle.history[2];
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(p0.x, p0.y);
                    this.ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
                    this.ctx.stroke();
                } else {
                    // 历史位置不足，使用直线
                    this.ctx.beginPath();
                    this.ctx.moveTo(particle.xt, particle.yt);
                    this.ctx.lineTo(particle.x, particle.y);
                    this.ctx.stroke();
                }
            }
        }
    }
    
    // 启动动画
    startAnimation() {
        if (this.animationId) return;
        
        let lastTime = 0;
        const targetFPS = 30;  // 限制为 30fps，避免绘制过快
        const frameInterval = 1000 / targetFPS;
        
        const animate = (currentTime) => {
            if (!this.isVisible) return;
            
            // 帧率限制
            if (currentTime - lastTime >= frameInterval) {
                this.draw();
                lastTime = currentTime;
            }
            
            this.animationId = requestAnimationFrame(animate);
        };
        
        this.animationId = requestAnimationFrame(animate);
        console.log('▶️ 风场动画已启动（30fps）');
    }
    
    // 停止动画
    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
            console.log('⏸️ 风场动画已停止');
        }
    }
    
    // 显示风场
    showLayer() {
        console.log('🎬 showLayer() 被调用');
        this.isVisible = true;
        this.canvas.style.display = 'block';
        this.startAnimation();
        console.log('✅ showLayer() 完成，isVisible:', this.isVisible);
    }
    
    // 隐藏风场
    hideLayer() {
        console.log('🎬 hideLayer() 被调用');
        this.isVisible = false;
        this.canvas.style.display = 'none';
        this.stopAnimation();
        
        // 清空画布
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        this.ctx.clearRect(0, 0, width, height);
        
        console.log('✅ hideLayer() 完成，isVisible:', this.isVisible);
    }
    
    // 移除图层
    remove() {
        this.stopAnimation();
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        this.particles = [];
        console.log('🗑️ Canvas 风场图层已移除');
    }
    
    // 设置显示状态（兼容接口）
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
