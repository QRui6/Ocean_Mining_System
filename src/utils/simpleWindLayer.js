/**
 * 简化的风场图层实现
 * 使用 Cesium 原生 Primitive 和 ParticleSystem 实现风场可视化
 */

import * as Cesium from 'cesium';

export class SimpleWindLayer {
    constructor(viewer, windData, options = {}) {
        this.viewer = viewer;
        this.windData = windData;
        this.options = {
            particleCount: options.particleCount || 5000,
            particleSize: options.particleSize || 2.0,
            particleSpeed: options.particleSpeed || 0.5,
            particleLifetime: options.particleLifetime || 10.0,
            colors: options.colors || [
                Cesium.Color.CYAN,
                Cesium.Color.GREEN,
                Cesium.Color.YELLOW,
                Cesium.Color.ORANGE,
                Cesium.Color.RED
            ]
        };
        
        this.particles = [];
        this.particleSystem = null;
        this.isVisible = false;
        
        this.init();
    }
    
    init() {
        // 初始化粒子
        this.initParticles();
        
        // 创建粒子系统
        this.createParticleSystem();
    }
    
    initParticles() {
        const { xmin, xmax, ymin, ymax } = this.windData;
        
        for (let i = 0; i < this.options.particleCount; i++) {
            const lon = xmin + Math.random() * (xmax - xmin);
            const lat = ymin + Math.random() * (ymax - ymin);
            const height = 50000 + Math.random() * 50000;
            
            this.particles.push({
                position: Cesium.Cartesian3.fromDegrees(lon, lat, height),
                velocity: this.getWindVelocity(lon, lat),
                life: Math.random() * this.options.particleLifetime
            });
        }
    }
    
    getWindVelocity(lon, lat) {
        const { xmin, xmax, ymin, ymax, cols, rows, uData, vData } = this.windData;
        
        // 计算网格索引
        const x = Math.floor(((lon - xmin) / (xmax - xmin)) * (cols - 1));
        const y = Math.floor(((lat - ymin) / (ymax - ymin)) * (rows - 1));
        const index = y * cols + x;
        
        if (index >= 0 && index < uData.length) {
            const u = uData[index] || 0;
            const v = vData[index] || 0;
            
            // 转换为 Cesium 速度向量
            return new Cesium.Cartesian3(u * 1000, v * 1000, 0);
        }
        
        return Cesium.Cartesian3.ZERO;
    }
    
    getWindSpeed(velocity) {
        return Cesium.Cartesian3.magnitude(velocity) / 1000;
    }
    
    getColorBySpeed(speed) {
        const { colors } = this.options;
        const maxSpeed = 25; // m/s
        const ratio = Math.min(speed / maxSpeed, 1.0);
        const index = Math.floor(ratio * (colors.length - 1));
        
        return colors[Math.min(index, colors.length - 1)];
    }
    
    createParticleSystem() {
        // 使用 Cesium 的 PointPrimitiveCollection 来渲染粒子
        this.pointCollection = this.viewer.scene.primitives.add(
            new Cesium.PointPrimitiveCollection()
        );
        
        this.particles.forEach(particle => {
            const speed = this.getWindSpeed(particle.velocity);
            const color = this.getColorBySpeed(speed);
            
            const point = this.pointCollection.add({
                position: particle.position,
                color: color,
                pixelSize: this.options.particleSize,
                show: false
            });
            
            particle.point = point;
        });
        
        // 启动动画循环
        this.startAnimation();
    }
    
    startAnimation() {
        this.viewer.clock.onTick.addEventListener(this.updateParticles, this);
    }
    
    stopAnimation() {
        this.viewer.clock.onTick.removeEventListener(this.updateParticles, this);
    }
    
    updateParticles = (clock) => {
        if (!this.isVisible) return;
        
        const deltaTime = clock.currentTime.secondsOfDay - (this.lastTime || clock.currentTime.secondsOfDay);
        this.lastTime = clock.currentTime.secondsOfDay;
        
        const dt = Math.min(deltaTime, 0.1); // 限制最大时间步长
        
        this.particles.forEach(particle => {
            // 更新生命周期
            particle.life -= dt;
            
            if (particle.life <= 0) {
                // 重置粒子
                this.resetParticle(particle);
            } else {
                // 更新位置
                const displacement = Cesium.Cartesian3.multiplyByScalar(
                    particle.velocity,
                    dt * this.options.particleSpeed,
                    new Cesium.Cartesian3()
                );
                
                particle.position = Cesium.Cartesian3.add(
                    particle.position,
                    displacement,
                    particle.position
                );
                
                // 更新点的位置
                if (particle.point) {
                    particle.point.position = particle.position;
                    
                    // 根据生命周期调整透明度
                    const alpha = Math.min(particle.life / 2.0, 1.0);
                    const speed = this.getWindSpeed(particle.velocity);
                    const color = this.getColorBySpeed(speed);
                    particle.point.color = color.withAlpha(alpha);
                }
            }
        });
    }
    
    resetParticle(particle) {
        const { xmin, xmax, ymin, ymax } = this.windData;
        const lon = xmin + Math.random() * (xmax - xmin);
        const lat = ymin + Math.random() * (ymax - ymin);
        const height = 50000 + Math.random() * 50000;
        
        particle.position = Cesium.Cartesian3.fromDegrees(lon, lat, height);
        particle.velocity = this.getWindVelocity(lon, lat);
        particle.life = this.options.particleLifetime;
    }
    
    show() {
        this.isVisible = true;
        if (this.pointCollection) {
            this.pointCollection.show = true;
            this.particles.forEach(particle => {
                if (particle.point) {
                    particle.point.show = true;
                }
            });
        }
    }
    
    hide() {
        this.isVisible = false;
        if (this.pointCollection) {
            this.pointCollection.show = false;
            this.particles.forEach(particle => {
                if (particle.point) {
                    particle.point.show = false;
                }
            });
        }
    }
    
    remove() {
        this.stopAnimation();
        if (this.pointCollection) {
            this.viewer.scene.primitives.remove(this.pointCollection);
            this.pointCollection = null;
        }
        this.particles = [];
    }
}
