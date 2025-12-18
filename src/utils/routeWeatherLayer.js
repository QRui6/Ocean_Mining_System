/**
 * 航线气象分析图层
 * 功能：沿航线采样气象数据，评估风险等级，可视化展示
 */

import * as Cesium from 'cesium';
import { getWeatherByPoint } from './shipxyApi.js';

/**
 * 计算两点间的距离（海里）
 * @param {Object} point1 - {lng, lat}
 * @param {Object} point2 - {lng, lat}
 * @returns {number} 距离（海里）
 */
function calculateDistance(point1, point2) {
    const R = 3440.065; // 地球半径（海里）
    const lat1 = point1.lat * Math.PI / 180;
    const lat2 = point2.lat * Math.PI / 180;
    const deltaLat = (point2.lat - point1.lat) * Math.PI / 180;
    const deltaLng = (point2.lng - point1.lng) * Math.PI / 180;
    
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
}

/**
 * 沿航线采样点（每50海里一个点）
 * @param {Array} route - 航线点数组 [{lng, lat}, ...]
 * @param {number} intervalNM - 采样间隔（海里）
 * @returns {Array} 采样点数组
 */
function sampleRoutePoints(route, intervalNM = 50) {
    if (!route || route.length < 2) return [];
    
    const samples = [];
    samples.push({ ...route[0], index: 0 });
    
    let accumulatedDistance = 0;
    let lastSamplePoint = route[0];
    
    for (let i = 1; i < route.length; i++) {
        const currentPoint = route[i];
        const segmentDistance = calculateDistance(lastSamplePoint, currentPoint);
        accumulatedDistance += segmentDistance;
        
        // 如果累计距离超过采样间隔，添加采样点
        if (accumulatedDistance >= intervalNM) {
            samples.push({ ...currentPoint, index: i });
            lastSamplePoint = currentPoint;
            accumulatedDistance = 0;
        }
    }
    
    // 添加终点
    const lastPoint = route[route.length - 1];
    if (samples[samples.length - 1].index !== route.length - 1) {
        samples.push({ ...lastPoint, index: route.length - 1 });
    }
    
    return samples;
}

/**
 * 计算风险等级
 * @param {Object} weather - 气象数据
 * @returns {Object} {level: 'safe'|'caution'|'warning'|'danger', color, description}
 */
function calculateRiskLevel(weather) {
    if (!weather) {
        return { level: 'unknown', color: '#808080', description: '无数据' };
    }
    
    const windSpeed = weather.windspeed || 0; // m/s (API返回字段名)
    const waveHeight = weather.waveheight || 0; // m (API返回字段名)
    
    // 风速转换为蒲福风级（简化公式）
    const beaufort = Math.round(Math.pow(windSpeed / 0.836, 2/3));
    
    // 风险评估
    if (beaufort > 8 || waveHeight > 4) {
        return { 
            level: 'danger', 
            color: '#FF0000', 
            emoji: '🔴',
            description: `危险 (${beaufort}级风, ${waveHeight.toFixed(1)}m浪)` 
        };
    } else if (beaufort === 8 || waveHeight > 3) {
        return { 
            level: 'warning', 
            color: '#FF8C00', 
            emoji: '🟠',
            description: `警告 (${beaufort}级风, ${waveHeight.toFixed(1)}m浪)` 
        };
    } else if (beaufort >= 6 || waveHeight > 2) {
        return { 
            level: 'caution', 
            color: '#FFD700', 
            emoji: '🟡',
            description: `注意 (${beaufort}级风, ${waveHeight.toFixed(1)}m浪)` 
        };
    } else {
        return { 
            level: 'safe', 
            color: '#00FF00', 
            emoji: '🟢',
            description: `安全 (${beaufort}级风, ${waveHeight.toFixed(1)}m浪)` 
        };
    }
}

/**
 * 航线气象图层类
 */
export class RouteWeatherLayer {
    constructor(viewer) {
        this.viewer = viewer;
        this.weatherEntities = [];
        this.weatherData = [];
        this.lineEntities = []; // 存储线段实体
        this.animationTime = 0; // 流动动画时间
        this.animationInterval = null; // 动画定时器
    }
    
    /**
     * 分析航线气象
     * @param {Array} route - 航线点数组
     * @param {Function} onProgress - 进度回调 (current, total)
     */
    async analyzeRoute(route, onProgress) {
        // 清除旧数据
        this.clear();
        
        // 采样点
        const samples = sampleRoutePoints(route, 50);
        console.log(`📍 采样点数量: ${samples.length}`);
        
        // 获取气象数据
        const weatherPromises = samples.map(async (point, index) => {
            try {
                const result = await getWeatherByPoint(point.lng, point.lat);
                if (onProgress) onProgress(index + 1, samples.length);
                
                if (result.success && result.data) {
                    return {
                        point,
                        weather: {
                            ...result.data,
                            timestamp: new Date().toISOString(), // 添加获取时间
                            fetchTime: Date.now() // 添加Unix时间戳（用于刷新判断）
                        },
                        risk: calculateRiskLevel(result.data)
                    };
                }
                return null;
            } catch (error) {
                console.error(`获取气象数据失败 (${point.lng}, ${point.lat}):`, error);
                return null;
            }
        });
        
        const results = await Promise.all(weatherPromises);
        this.weatherData = results.filter(r => r !== null);
        
        // 渲染气象标记
        this.renderWeatherMarkers();
        
        // 返回统计信息
        return this.getStatistics();
    }
    
    /**
     * 渲染气象标记和连接线段
     */
    renderWeatherMarkers() {
        // 先渲染连接线段（在标记点下方）
        this.renderConnectionLines();
        
        // 再渲染标记点（在线段上方）
        this.weatherData.forEach((data, index) => {
            const { point, weather, risk } = data;
            
            // 创建标记点
            const entity = this.viewer.entities.add({
                id: `weather_marker_${index}`,
                position: Cesium.Cartesian3.fromDegrees(point.lng, point.lat, 1000),
                billboard: {
                    image: this.createWeatherIcon(risk),
                    width: 32,
                    height: 32,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            });
            
            // 直接在 entity 上存储数据（不使用 properties，避免 Cesium 包装）
            entity._weatherData = weather;
            entity._riskData = risk;
            
            this.weatherEntities.push(entity);
        });
        
        console.log(`✅ 已渲染 ${this.weatherEntities.length} 个气象标记和 ${this.lineEntities.length} 条连接线`);
        
        // 启动流动动画
        this.startFlowAnimation();
        
        // 强制渲染场景，确保标记立即显示
        this.viewer.scene.requestRender();
    }
    
    /**
     * 渲染连接线段（带渐变色和流动效果）
     */
    renderConnectionLines() {
        for (let i = 0; i < this.weatherData.length - 1; i++) {
            const currentData = this.weatherData[i];
            const nextData = this.weatherData[i + 1];
            
            const startPoint = currentData.point;
            const endPoint = nextData.point;
            const startRisk = currentData.risk;
            const endRisk = nextData.risk;
            
            // 创建渐变色线段（使用 PolylineGraphics）
            const lineEntity = this.viewer.entities.add({
                id: `weather_line_${i}`,
                polyline: {
                    positions: Cesium.Cartesian3.fromDegreesArray([
                        startPoint.lng, startPoint.lat,
                        endPoint.lng, endPoint.lat
                    ]),
                    width: 12, // 适中的线段宽度
                    material: this.createStaticGradientMaterial(startRisk, endRisk),
                    clampToGround: true,
                    zIndex: 1
                }
            });
            
            // 存储线段数据
            lineEntity._startRisk = startRisk;
            lineEntity._endRisk = endRisk;
            lineEntity._segmentIndex = i;
            
            this.lineEntities.push(lineEntity);
        }
    }
    
    /**
     * 创建静态渐变色材质（简单的颜色渐变，不做流动动画）
     * @param {Object} startRisk - 起点风险等级
     * @param {Object} endRisk - 终点风险等级
     * @returns {Cesium.Material} 材质对象
     */
    createStaticGradientMaterial(startRisk, endRisk) {
        // 获取颜色（使用 Cesium.Color）
        const startColor = this.getRiskCesiumColor(startRisk);
        const endColor = this.getRiskCesiumColor(endRisk);
        
        // 使用 PolylineGlowMaterialProperty 创建发光渐变效果
        return new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.25, // 发光强度
            taperPower: 0.5, // 渐变强度
            color: Cesium.Color.lerp(startColor, endColor, 0.5, new Cesium.Color()) // 使用中间色
        });
    }
    
    /**
     * 获取风险等级对应的 Cesium 颜色
     * @param {Object} risk - 风险等级对象
     * @returns {Cesium.Color} Cesium 颜色对象
     */
    getRiskCesiumColor(risk) {
        const colorMap = {
            'safe': Cesium.Color.fromCssColorString('#00FF00').withAlpha(0.8),      // 绿色
            'caution': Cesium.Color.fromCssColorString('#FFD700').withAlpha(0.8),   // 黄色
            'warning': Cesium.Color.fromCssColorString('#FF8C00').withAlpha(0.8),   // 橙色
            'danger': Cesium.Color.fromCssColorString('#FF0000').withAlpha(0.8),    // 红色
            'unknown': Cesium.Color.fromCssColorString('#808080').withAlpha(0.8)    // 灰色
        };
        return colorMap[risk.level] || colorMap['unknown'];
    }
    
    /**
     * 启动流动动画（已禁用，使用静态渐变）
     */
    startFlowAnimation() {
        // 不再需要动画，保留方法以兼容现有代码
    }
    
    /**
     * 停止流动动画（已禁用，使用静态渐变）
     */
    stopFlowAnimation() {
        // 不再需要动画，保留方法以兼容现有代码
    }
    
    /**
     * 创建气象图标（Canvas）
     */
    createWeatherIcon(risk) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // 绘制圆形背景
        ctx.beginPath();
        ctx.arc(32, 32, 28, 0, 2 * Math.PI);
        ctx.fillStyle = risk.color;
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 绘制emoji（简化为文字）
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(risk.emoji, 32, 32);
        
        return canvas;
    }
    
    /**
     * 获取统计信息
     */
    getStatistics() {
        const stats = {
            total: this.weatherData.length,
            safe: 0,
            caution: 0,
            warning: 0,
            danger: 0,
            avgWindSpeed: 0,
            avgWaveHeight: 0,
            maxWindSpeed: 0,
            maxWaveHeight: 0
        };
        
        let totalWind = 0;
        let totalWave = 0;
        
        this.weatherData.forEach(data => {
            const { weather, risk } = data;
            
            // 统计风险等级
            stats[risk.level]++;
            
            // 统计气象数据
            const windSpeed = weather.windspeed || 0;
            const waveHeight = weather.waveheight || 0;
            
            totalWind += windSpeed;
            totalWave += waveHeight;
            
            stats.maxWindSpeed = Math.max(stats.maxWindSpeed, windSpeed);
            stats.maxWaveHeight = Math.max(stats.maxWaveHeight, waveHeight);
        });
        
        stats.avgWindSpeed = (totalWind / stats.total).toFixed(1);
        stats.avgWaveHeight = (totalWave / stats.total).toFixed(1);
        stats.maxWindSpeed = stats.maxWindSpeed.toFixed(1);
        stats.maxWaveHeight = stats.maxWaveHeight.toFixed(1);
        
        return stats;
    }
    
    /**
     * 清除所有气象标记和线段
     */
    clear() {
        // 停止动画
        this.stopFlowAnimation();
        
        // 清除标记点
        this.weatherEntities.forEach(entity => {
            this.viewer.entities.remove(entity);
        });
        this.weatherEntities = [];
        
        // 清除连接线段
        this.lineEntities.forEach(entity => {
            this.viewer.entities.remove(entity);
        });
        this.lineEntities = [];
        
        this.weatherData = [];
        this.animationTime = 0;
    }
    
    /**
     * 显示气象详情（点击标记时）
     */
    showWeatherDetails(weatherData) {
        const { weather, risk } = weatherData;
        
        return {
            title: `${risk.emoji} ${risk.description}`,
            items: [
                { label: '数据时间', value: weather.timestamp ? new Date(weather.timestamp).toLocaleString('zh-CN', { 
                    year: 'numeric', month: '2-digit', day: '2-digit', 
                    hour: '2-digit', minute: '2-digit', second: '2-digit' 
                }) : 'N/A' },
                { label: '风速', value: `${weather.windspeed || 'N/A'} m/s` },
                { label: '风向', value: `${weather.winddir || 'N/A'}°` },
                { label: '浪高', value: `${weather.waveheight || 'N/A'} m` },
                { label: '涌浪高', value: `${weather.swellheight || 'N/A'} m` },
                { label: '涌浪方向', value: `${weather.swelldir || 'N/A'}°` },
                { label: '能见度', value: `${weather.visibility || 'N/A'} km` },
                { label: '气温', value: `${weather.temperature || 'N/A'} °C` },
                { label: '气压', value: `${weather.pressure || 'N/A'} hPa` }
            ]
        };
    }
    
    /**
     * 刷新气象数据（5分钟后重新获取）
     */
    async refreshWeatherData(onProgress) {
        console.log('🔄 刷新气象数据...');
        
        // 重新获取所有点的气象数据
        const weatherPromises = this.weatherData.map(async (oldData, index) => {
            try {
                const { point } = oldData;
                const result = await getWeatherByPoint(point.lng, point.lat);
                if (onProgress) onProgress(index + 1, this.weatherData.length);
                
                if (result.success && result.data) {
                    return {
                        point,
                        weather: {
                            ...result.data,
                            timestamp: new Date().toISOString(),
                            fetchTime: Date.now()
                        },
                        risk: calculateRiskLevel(result.data)
                    };
                }
                return oldData; // 失败时保留旧数据
            } catch (error) {
                console.error(`刷新失败 (${oldData.point.lng}, ${oldData.point.lat}):`, error);
                return oldData;
            }
        });
        
        const results = await Promise.all(weatherPromises);
        this.weatherData = results;
        
        // 更新地图标记
        this.updateMarkers();
        
        console.log('✅ 气象数据刷新完成');
        return this.getStatistics();
    }
    
    /**
     * 更新地图标记和线段（不重新创建，只更新数据）
     */
    updateMarkers() {
        // 更新标记点
        this.weatherEntities.forEach((entity, index) => {
            const data = this.weatherData[index];
            if (data) {
                entity._weatherData = data.weather;
                entity._riskData = data.risk;
                
                // 更新图标颜色
                entity.billboard.image = this.createWeatherIcon(data.risk);
            }
        });
        
        // 更新连接线段的颜色
        this.lineEntities.forEach((lineEntity, index) => {
            const currentData = this.weatherData[index];
            const nextData = this.weatherData[index + 1];
            
            if (currentData && nextData) {
                lineEntity._startRisk = currentData.risk;
                lineEntity._endRisk = nextData.risk;
                
                // 更新线段材质
                lineEntity.polyline.material = this.createStaticGradientMaterial(
                    currentData.risk,
                    nextData.risk
                );
            }
        });
        
        this.viewer.scene.requestRender();
    }
    
    /**
     * 根据筛选条件显示/隐藏标记和线段
     */
    filterMarkers(filters) {
        // 筛选标记点
        this.weatherEntities.forEach((entity, index) => {
            const data = this.weatherData[index];
            if (data) {
                entity.show = this.matchesFilters(data, filters);
            }
        });
        
        // 筛选连接线段（只有当两端的点都显示时，线段才显示）
        this.lineEntities.forEach((lineEntity, index) => {
            const startMarker = this.weatherEntities[index];
            const endMarker = this.weatherEntities[index + 1];
            
            if (startMarker && endMarker) {
                lineEntity.show = startMarker.show && endMarker.show;
            }
        });
        
        this.viewer.scene.requestRender();
    }
    
    /**
     * 判断数据是否匹配筛选条件
     */
    matchesFilters(data, filters) {
        const { weather, risk } = data;
        
        // 风险等级筛选
        if (filters.riskLevels && filters.riskLevels.length > 0) {
            if (!filters.riskLevels.includes(risk.level)) {
                return false;
            }
        }
        
        // 风速筛选
        if (filters.windSpeed) {
            const [min, max] = filters.windSpeed;
            const windSpeed = weather.windspeed || 0;
            if (windSpeed < min || windSpeed >= max) {
                return false;
            }
        }
        
        // 浪高筛选
        if (filters.waveHeight) {
            const [min, max] = filters.waveHeight;
            const waveHeight = weather.waveheight || 0;
            if (waveHeight < min || waveHeight >= max) {
                return false;
            }
        }
        
        return true;
    }
}
