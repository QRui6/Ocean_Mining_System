/**
 * Windy Point Forecast 可视化器
 * 将 Windy Point Forecast API 的数据在 Cesium 上可视化
 */

import * as Cesium from 'cesium';
import { WindyPointForecast } from './windyPointForecast.js';

export class WindyPointVisualizer {
    constructor(viewer) {
        this.viewer = viewer;
        this.forecast = new WindyPointForecast();
        this.entities = []; // 存储创建的实体
        this.gridSize = 5; // 网格间隔（度）
        this.currentType = null; // 当前显示的类型
    }

    /**
     * 显示气象网格
     * @param {String} type - 类型: wind, temp, pressure
     * @param {Object} bounds - 边界 {west, east, south, north}
     */
    async showGrid(type, bounds = null) {
        // 清除旧的实体
        this.clear();
        
        // 如果没有指定边界，使用当前视野
        if (!bounds) {
            bounds = this.getCurrentViewBounds();
        }

        console.log(`🌪️ 显示 ${type} 网格:`, bounds);

        // 生成网格点
        const gridPoints = this.generateGridPoints(bounds, this.gridSize);
        console.log(`📍 生成 ${gridPoints.length} 个网格点`);

        // 获取每个点的预报数据
        const forecasts = [];
        let successCount = 0;
        
        for (let i = 0; i < gridPoints.length; i++) {
            const point = gridPoints[i];
            
            try {
                const data = await this.forecast.getForecast(point.lat, point.lng);
                forecasts.push({
                    ...point,
                    data
                });
                successCount++;
                
                // 显示进度
                if ((i + 1) % 10 === 0 || i === gridPoints.length - 1) {
                    console.log(`⏳ 进度: ${i + 1}/${gridPoints.length} (${successCount} 成功)`);
                }
                
                // 避免请求过快
                await this.sleep(50);
            } catch (error) {
                console.warn(`⚠️ 点 (${point.lat}, ${point.lng}) 获取失败`);
            }
        }

        console.log(`✅ 成功获取 ${successCount}/${gridPoints.length} 个点的数据`);

        // 可视化数据
        this.currentType = type;
        this.visualizeData(forecasts, type);

        return forecasts;
    }

    /**
     * 获取当前视野边界
     */
    getCurrentViewBounds() {
        const camera = this.viewer.camera;
        const canvas = this.viewer.canvas;
        
        // 获取四个角的坐标
        const topLeft = camera.pickEllipsoid(new Cesium.Cartesian2(0, 0));
        const topRight = camera.pickEllipsoid(new Cesium.Cartesian2(canvas.clientWidth, 0));
        const bottomLeft = camera.pickEllipsoid(new Cesium.Cartesian2(0, canvas.clientHeight));
        const bottomRight = camera.pickEllipsoid(new Cesium.Cartesian2(canvas.clientWidth, canvas.clientHeight));

        if (!topLeft || !topRight || !bottomLeft || !bottomRight) {
            // 如果无法获取，返回全球范围
            return { west: -180, east: 180, south: -60, north: 60 };
        }

        const corners = [topLeft, topRight, bottomLeft, bottomRight].map(cartesian => {
            const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            return {
                lng: Cesium.Math.toDegrees(cartographic.longitude),
                lat: Cesium.Math.toDegrees(cartographic.latitude)
            };
        });

        const lngs = corners.map(c => c.lng);
        const lats = corners.map(c => c.lat);

        return {
            west: Math.max(-180, Math.min(...lngs)),
            east: Math.min(180, Math.max(...lngs)),
            south: Math.max(-60, Math.min(...lats)),
            north: Math.min(60, Math.max(...lats))
        };
    }

    /**
     * 生成网格点
     */
    generateGridPoints(bounds, gridSize) {
        const points = [];
        
        for (let lat = bounds.south; lat <= bounds.north; lat += gridSize) {
            for (let lng = bounds.west; lng <= bounds.east; lng += gridSize) {
                points.push({ lat, lng });
            }
        }
        
        return points;
    }

    /**
     * 可视化数据
     */
    visualizeData(forecasts, type) {
        console.log(`🎨 开始可视化 ${type} 数据`);

        forecasts.forEach(forecast => {
            const { lat, lng, data } = forecast;
            
            if (!data || !data.timestamps || data.timestamps.length === 0) {
                return;
            }

            // 获取第一个时间点的数据
            let value, label, color;

            switch (type) {
                case 'wind':
                    const windU = data.wind.speed[0] || 0;
                    const windV = data.wind.direction[0] || 0;
                    const windSpeed = Math.sqrt(windU * windU + windV * windV);
                    value = windSpeed;
                    label = `${windSpeed.toFixed(1)} m/s`;
                    color = this.getWindColor(windSpeed);
                    
                    // 绘制风向箭头
                    this.drawWindArrow(lng, lat, windU, windV, windSpeed);
                    break;

                case 'temp':
                    value = data.temperature[0] || 0;
                    label = `${value.toFixed(1)}°C`;
                    color = this.getTempColor(value);
                    break;

                case 'pressure':
                    value = data.pressure[0] || 1013;
                    label = `${value.toFixed(0)} hPa`;
                    color = this.getPressureColor(value);
                    break;

                default:
                    return;
            }

            // 创建标记点
            const entity = this.viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(lng, lat),
                point: {
                    pixelSize: 8,
                    color: color,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 1
                },
                label: {
                    text: label,
                    font: '12px sans-serif',
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -12),
                    scale: 0.8
                }
            });

            this.entities.push(entity);
        });

        console.log(`✅ 已创建 ${this.entities.length} 个可视化实体`);
    }

    /**
     * 绘制风向箭头
     */
    drawWindArrow(lng, lat, windU, windV, windSpeed) {
        if (windSpeed < 0.5) return; // 风速太小不绘制

        const angle = Math.atan2(windU, windV);
        const arrowLength = Math.min(windSpeed * 0.05, 0.5); // 限制箭头长度

        const endLng = lng + Math.sin(angle) * arrowLength;
        const endLat = lat + Math.cos(angle) * arrowLength;

        const entity = this.viewer.entities.add({
            polyline: {
                positions: [
                    Cesium.Cartesian3.fromDegrees(lng, lat),
                    Cesium.Cartesian3.fromDegrees(endLng, endLat)
                ],
                width: 2,
                material: new Cesium.PolylineArrowMaterialProperty(
                    this.getWindColor(windSpeed)
                )
            }
        });

        this.entities.push(entity);
    }

    /**
     * 获取风速对应的颜色
     */
    getWindColor(speed) {
        if (speed < 2) return Cesium.Color.LIGHTBLUE;
        if (speed < 5) return Cesium.Color.CYAN;
        if (speed < 10) return Cesium.Color.YELLOW;
        if (speed < 15) return Cesium.Color.ORANGE;
        return Cesium.Color.RED;
    }

    /**
     * 获取温度对应的颜色
     */
    getTempColor(temp) {
        if (temp < -10) return Cesium.Color.DARKBLUE;
        if (temp < 0) return Cesium.Color.BLUE;
        if (temp < 10) return Cesium.Color.CYAN;
        if (temp < 20) return Cesium.Color.GREEN;
        if (temp < 30) return Cesium.Color.YELLOW;
        if (temp < 40) return Cesium.Color.ORANGE;
        return Cesium.Color.RED;
    }

    /**
     * 获取气压对应的颜色
     */
    getPressureColor(pressure) {
        if (pressure < 980) return Cesium.Color.RED;
        if (pressure < 1000) return Cesium.Color.ORANGE;
        if (pressure < 1013) return Cesium.Color.YELLOW;
        if (pressure < 1020) return Cesium.Color.GREEN;
        return Cesium.Color.BLUE;
    }

    /**
     * 清除所有实体
     */
    clear() {
        this.entities.forEach(entity => {
            this.viewer.entities.remove(entity);
        });
        this.entities = [];
        this.currentType = null;
        console.log('✅ 已清除所有气象可视化');
    }

    /**
     * 设置网格大小
     */
    setGridSize(size) {
        this.gridSize = size;
        console.log(`📏 网格大小已设置为 ${size}°`);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
