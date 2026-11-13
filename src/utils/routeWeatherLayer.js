/**
 * 航线气象分析图层
 * 功能：沿航线采样气象数据，评估风险等级，可视化展示
 */

import * as Cesium from 'cesium';
import { getWeatherByPoint } from './shipxyApi.js';
import { calculateRiskLevel } from './weatherRiskAssessment.js';

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

// 风险评估函数已移至 weatherRiskAssessment.js 统一管理

/**
 * 航线气象图层类（重构版：支持时间维度和彩色线段）
 */
export class RouteWeatherLayer {
    constructor(viewer) {
        this.viewer = viewer;
        this.weatherEntities = [];
        this.weatherData = [];
        this.segmentEntities = []; // 存储彩色线段实体
        this.shipSpeed = 15; // 默认船速（节，knots）
        this.customThresholds = null; // 自定义阈值
    }
    
    /**
     * 分析航线气象（直接使用航线上的所有点）
     * @param {Array} route - 航线点数组
     * @param {Object} options - 配置选项 { shipSpeed: 15, startTime: Date, thresholds: {} }
     * @param {Function} onProgress - 进度回调 (current, total)
     */
    async analyzeRoute(route, options = {}, onProgress) {
        // 清除旧数据
        this.clear();
        
        // 设置船速和自定义阈值
        this.shipSpeed = options.shipSpeed || 15; // 节（knots）
        this.customThresholds = options.thresholds || null; // 自定义阈值
        const startTime = options.startTime || new Date();
        
        console.log(`📍 航线点数: ${route.length}, 船速: ${this.shipSpeed} 节`);
        
        // 计算每个点的到达时间和距离
        let cumulativeDistance = 0;
        const routeWithTime = route.map((point, index) => {
            if (index > 0) {
                const distance = calculateDistance(route[index - 1], point);
                cumulativeDistance += distance;
            }
            
            // 计算到达时间（距离/速度 = 小时）
            const hoursFromStart = cumulativeDistance / this.shipSpeed;
            const arrivalTime = new Date(startTime.getTime() + hoursFromStart * 3600000);
            
            return {
                ...point,
                segmentIndex: index,
                distanceFromStart: cumulativeDistance,
                arrivalTime: arrivalTime,
                hoursFromStart: hoursFromStart
            };
        });
        
        // 获取每个点的气象数据（暂时都使用当前时间，API不支持未来预报）
        const weatherPromises = routeWithTime.map(async (point, index) => {
            try {
                // 暂时都使用当前时间的气象数据
                // 注意：API的weather_time参数虽然存在，但返回的未来预报数据无效
                const result = await getWeatherByPoint(point.lng, point.lat);
                
                if (onProgress) onProgress(index + 1, routeWithTime.length);
                
                if (result.success && result.data) {
                    // 清理无效数据（-32767表示无数据）
                    const cleanedData = this.cleanWeatherData(result.data);
                    
                    return {
                        point,
                        weather: {
                            ...cleanedData,
                            timestamp: point.arrivalTime.toISOString(),
                            fetchTime: Date.now()
                        },
                        risk: calculateRiskLevel(cleanedData, this.customThresholds),
                        segmentIndex: point.segmentIndex,
                        distanceFromStart: point.distanceFromStart,
                        arrivalTime: point.arrivalTime,
                        hoursFromStart: point.hoursFromStart
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
        
        // 渲染气象可视化
        this.renderWeatherVisualization();
        
        // 返回统计信息
        return this.getStatistics();
    }
    
    /**
     * 渲染气象可视化（彩色线段 + 带序号的标记点）
     */
    renderWeatherVisualization() {
        // 渲染彩色线段
        this.renderColoredSegments();
        
        // 渲染所有航线点的序号标记
        for (let i = 0; i < this.weatherData.length; i++) {
            const data = this.weatherData[i];
            const { point, weather, risk } = data;
            
            // 创建标记点（带序号）- 提高高度确保可见和可点击
            const entity = this.viewer.entities.add({
                id: `weather_marker_${i}`,
                position: Cesium.Cartesian3.fromDegrees(point.lng, point.lat, 100),
                point: {
                    pixelSize: 18,
                    color: Cesium.Color.fromCssColorString(risk.color).withAlpha(0.95),
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 3,
                    heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    scaleByDistance: new Cesium.NearFarScalar(1000, 1.5, 5000000, 0.5)
                },
                label: {
                    text: String(i + 1),
                    font: '20px bold sans-serif',
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 4,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    pixelOffset: new Cesium.Cartesian2(0, 25),
                    verticalOrigin: Cesium.VerticalOrigin.TOP,
                    heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    scaleByDistance: new Cesium.NearFarScalar(1000, 1.2, 5000000, 0.5),
                    backgroundColor: Cesium.Color.fromCssColorString(risk.color).withAlpha(0.4),
                    backgroundPadding: new Cesium.Cartesian2(8, 6),
                    showBackground: true
                }
            });
            
            // 存储数据（用于点击时显示）
            entity._weatherData = weather;
            entity._riskData = risk;
            entity._segmentData = data;
            
            this.weatherEntities.push(entity);
        }
        
        console.log(`✅ 已渲染 ${this.segmentEntities.length} 条彩色线段和 ${this.weatherEntities.length} 个序号标记`);
        
        this.viewer.scene.requestRender();
    }
    
    /**
     * 渲染彩色线段（使用较高风险等级）
     */
    renderColoredSegments() {
        if (!this.weatherData || this.weatherData.length < 2) {
            console.warn('⚠️ 气象数据不足');
            return;
        }
        
        // 为每两个相邻点之间创建一个线段，使用较高的风险等级
        for (let i = 0; i < this.weatherData.length - 1; i++) {
            const currentData = this.weatherData[i];
            const nextData = this.weatherData[i + 1];
            
            // 使用两个点中较高的风险等级
            const segmentRisk = this.getMaxRisk(currentData.risk, nextData.risk);
            
            // 创建线段
            const positions = [
                currentData.point.lng, currentData.point.lat,
                nextData.point.lng, nextData.point.lat
            ];
            
            const segmentEntity = this.viewer.entities.add({
                id: `weather_segment_${i}`,
                polyline: {
                    positions: Cesium.Cartesian3.fromDegreesArray(positions),
                    width: 16,
                    material: this.getRiskCesiumColor(segmentRisk),
                    clampToGround: true
                }
            });
            
            segmentEntity._segmentRisk = segmentRisk;
            segmentEntity._startData = currentData;
            segmentEntity._endData = nextData;
            this.segmentEntities.push(segmentEntity);
        }
        
        console.log(`✅ 已创建 ${this.segmentEntities.length} 条彩色线段`);
    }
    
    /**
     * 获取风险等级对应的Cesium颜色（柔和配色）
     */
    getRiskCesiumColor(risk) {
        const colorMap = {
            'safe': Cesium.Color.fromCssColorString('#2ECC71'),      // 柔和绿色（安全）
            'caution': Cesium.Color.fromCssColorString('#F1C40F'),   // 柔和黄色（注意）
            'warning': Cesium.Color.fromCssColorString('#F39C12'),   // 柔和橙色（警告）
            'danger': Cesium.Color.fromCssColorString('#E74C3C'),    // 柔和红色（危险）
            'unknown': Cesium.Color.fromCssColorString('#95A5A6')    // 柔和灰色
        };
        return colorMap[risk.level] || colorMap['unknown'];
    }
    
    /**
     * 获取两个风险等级中较高的一个
     */
    getMaxRisk(risk1, risk2) {
        const riskOrder = { 'safe': 0, 'caution': 1, 'warning': 2, 'danger': 3, 'unknown': -1 };
        return riskOrder[risk1.level] >= riskOrder[risk2.level] ? risk1 : risk2;
    }
    

    
    /**
     * 清理气象数据（过滤无效值）
     * @param {Object} data - 原始气象数据
     * @returns {Object} 清理后的数据
     */
    cleanWeatherData(data) {
        const cleaned = { ...data };
        
        // -32767 是API返回的"无数据"标记，将其替换为0或null
        Object.keys(cleaned).forEach(key => {
            if (typeof cleaned[key] === 'number' && (cleaned[key] === -32767 || cleaned[key] < -30000)) {
                cleaned[key] = 0;
            }
        });
        
        return cleaned;
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
        // 清除标记点
        this.weatherEntities.forEach(entity => {
            this.viewer.entities.remove(entity);
        });
        this.weatherEntities = [];
        
        // 清除彩色线段
        this.segmentEntities.forEach(entity => {
            this.viewer.entities.remove(entity);
        });
        this.segmentEntities = [];
        
        this.weatherData = [];
        
        console.log('🗑️ 航线气象数据已清除');
    }
    
    /**
     * 重新评估风险等级（使用新的阈值）
     * @param {Object} thresholds - 新的阈值
     */
    reEvaluateRisk(thresholds) {
        if (!this.weatherData || this.weatherData.length === 0) {
            console.warn('⚠️ 没有气象数据需要重新评估');
            return;
        }
        
        console.log('🔄 routeWeatherLayer.reEvaluateRisk 开始');
        console.log('   - 数据点数量:', this.weatherData.length);
        console.log('   - 新阈值:', thresholds);
        console.log('   - 第一个点重新评估前:', JSON.stringify(this.weatherData[0].risk));
        
        // 更新自定义阈值
        this.customThresholds = thresholds;
        
        // 重新计算每个点的风险等级
        this.weatherData.forEach((data, index) => {
            const oldRisk = data.risk;
            data.risk = calculateRiskLevel(data.weather, thresholds);
            if (index === 0) {
                console.log('   - 第一个点重新评估后:', JSON.stringify(data.risk));
                console.log('   - 风险等级是否变化:', oldRisk.level !== data.risk.level);
            }
        });
        
        // 清除旧的可视化
        this.weatherEntities.forEach(entity => {
            this.viewer.entities.remove(entity);
        });
        this.weatherEntities = [];
        
        this.segmentEntities.forEach(entity => {
            this.viewer.entities.remove(entity);
        });
        this.segmentEntities = [];
        
        // 重新渲染
        this.renderWeatherVisualization();
        
        console.log('✅ 已使用新阈值重新评估风险等级');
    }
    
    /**
     * 显示气象详情（点击标记时）
     */
    showWeatherDetails(weatherData) {
        const { weather, risk } = weatherData;
        
        return {
            title: risk.description,
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
                { label: '能见度', value: `${weather.visibility ? weather.visibility.toFixed(0) : 'N/A'} m` },
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
                        risk: calculateRiskLevel(result.data, this.customThresholds)
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
                entity._segmentData = data;
                
                // 更新点的颜色
                entity.point.color = Cesium.Color.fromCssColorString(data.risk.color);
            }
        });
        
        // 更新彩色线段
        this.segmentEntities.forEach((segmentEntity, index) => {
            const currentData = this.weatherData[index];
            const nextData = this.weatherData[index + 1];
            
            if (currentData && nextData) {
                const segmentRisk = this.getMaxRisk(currentData.risk, nextData.risk);
                
                segmentEntity._startData = currentData;
                segmentEntity._endData = nextData;
                segmentEntity._segmentRisk = segmentRisk;
                
                // 更新线段颜色
                segmentEntity.polyline.material = Cesium.Color.fromCssColorString(segmentRisk.color).withAlpha(0.9);
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
        
        // 筛选彩色线段
        this.segmentEntities.forEach((segmentEntity, index) => {
            const startMarker = this.weatherEntities[index];
            const endMarker = this.weatherEntities[index + 1];
            
            if (startMarker && endMarker) {
                segmentEntity.show = startMarker.show && endMarker.show;
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
