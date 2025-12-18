/**
 * 航线图层管理器
 * 用于在Cesium地图上绘制和管理港到港航线
 */

import * as Cesium from 'cesium';

export class RouteLayer {
    constructor(viewer) {
        this.viewer = viewer;
        this.routeEntity = null;
        this.startMarker = null;
        this.endMarker = null;
    }
    
    /**
     * 绘制航线
     * @param {Array} routePoints - 航线点数组 [{lng, lat}, ...]
     * @param {Object} options - 配置选项
     */
    drawRoute(routePoints, options = {}) {
        const {
            startPort = '出发港',
            endPort = '到达港',
            lineColor = Cesium.Color.PURPLE,
            lineWidth = 3,
            showArrows = true
        } = options;
        
        if (!routePoints || routePoints.length < 2) {
            console.warn('⚠️ 航线点数量不足');
            return;
        }
        
        // 清除旧航线
        this.clearRoute();
        
        // 转换为Cesium坐标
        const positions = routePoints.map(point => 
            Cesium.Cartesian3.fromDegrees(point.lng, point.lat)
        );
        
        // 创建航线实体
        this.routeEntity = this.viewer.entities.add({
            name: `route_${startPort}_to_${endPort}`,
            polyline: {
                positions: positions,
                width: lineWidth,
                material: new Cesium.PolylineGlowMaterialProperty({
                    glowPower: 0.2,
                    color: lineColor
                }),
                clampToGround: false
            }
        });
        
        // 添加箭头（方向指示）
        if (showArrows) {
            this.addDirectionArrows(routePoints, lineColor);
        }
        
        // 添加起点标记
        const startPoint = routePoints[0];
        this.startMarker = this.viewer.entities.add({
            name: `start_${startPort}`,
            position: Cesium.Cartesian3.fromDegrees(startPoint.lng, startPoint.lat),
            billboard: {
                image: this.createMarkerCanvas('🟢', '#10b981'),
                width: 40,
                height: 40,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            },
            label: {
                text: startPort,
                font: '14px sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                pixelOffset: new Cesium.Cartesian2(0, -50),
                showBackground: true,
                backgroundColor: Cesium.Color.fromCssColorString('rgba(16, 185, 129, 0.8)'),
                backgroundPadding: new Cesium.Cartesian2(8, 4),
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            }
        });
        
        // 添加终点标记
        const endPoint = routePoints[routePoints.length - 1];
        this.endMarker = this.viewer.entities.add({
            name: `end_${endPort}`,
            position: Cesium.Cartesian3.fromDegrees(endPoint.lng, endPoint.lat),
            billboard: {
                image: this.createMarkerCanvas('🔴', '#ef4444'),
                width: 40,
                height: 40,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            },
            label: {
                text: endPort,
                font: '14px sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                pixelOffset: new Cesium.Cartesian2(0, -50),
                showBackground: true,
                backgroundColor: Cesium.Color.fromCssColorString('rgba(239, 68, 68, 0.8)'),
                backgroundPadding: new Cesium.Cartesian2(8, 4),
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            }
        });
        
        console.log(`✅ 航线绘制完成: ${startPort} → ${endPort}, ${routePoints.length} 个航点`);
    }
    
    /**
     * 添加方向箭头
     * @param {Array} routePoints - 航线点数组
     * @param {Cesium.Color} color - 箭头颜色
     */
    addDirectionArrows(routePoints, color) {
        // 每隔一定距离添加一个箭头
        const arrowInterval = Math.max(1, Math.floor(routePoints.length / 10));
        
        for (let i = arrowInterval; i < routePoints.length; i += arrowInterval) {
            const point = routePoints[i];
            const prevPoint = routePoints[i - 1];
            
            // 计算方向
            const heading = this.calculateHeading(prevPoint, point);
            
            this.viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(point.lng, point.lat),
                billboard: {
                    image: this.createArrowCanvas(color),
                    width: 20,
                    height: 20,
                    rotation: Cesium.Math.toRadians(heading),
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                }
            });
        }
    }
    
    /**
     * 计算两点之间的方位角
     */
    calculateHeading(point1, point2) {
        const lat1 = Cesium.Math.toRadians(point1.lat);
        const lat2 = Cesium.Math.toRadians(point2.lat);
        const dLng = Cesium.Math.toRadians(point2.lng - point1.lng);
        
        const y = Math.sin(dLng) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - 
                  Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
        
        const heading = Math.atan2(y, x);
        return Cesium.Math.toDegrees(heading);
    }
    
    /**
     * 创建标记Canvas
     */
    createMarkerCanvas(emoji, color) {
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 40;
        const ctx = canvas.getContext('2d');
        
        // 绘制圆形背景
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(20, 20, 18, 0, 2 * Math.PI);
        ctx.fill();
        
        // 绘制边框
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 绘制emoji
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, 20, 20);
        
        return canvas;
    }
    
    /**
     * 创建箭头Canvas
     */
    createArrowCanvas(color) {
        const canvas = document.createElement('canvas');
        canvas.width = 20;
        canvas.height = 20;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = color.toCssColorString();
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(20, 20);
        ctx.lineTo(10, 15);
        ctx.lineTo(0, 20);
        ctx.closePath();
        ctx.fill();
        
        return canvas;
    }
    
    /**
     * 飞到航线视角
     */
    flyToRoute() {
        if (this.routeEntity) {
            this.viewer.flyTo(this.routeEntity, {
                duration: 2,
                offset: new Cesium.HeadingPitchRange(
                    0,
                    Cesium.Math.toRadians(-45),
                    5000000
                )
            });
        }
    }
    
    /**
     * 清除航线
     */
    clearRoute() {
        if (this.routeEntity) {
            this.viewer.entities.remove(this.routeEntity);
            this.routeEntity = null;
        }
        
        if (this.startMarker) {
            this.viewer.entities.remove(this.startMarker);
            this.startMarker = null;
        }
        
        if (this.endMarker) {
            this.viewer.entities.remove(this.endMarker);
            this.endMarker = null;
        }
        
        // 清除所有箭头
        const entitiesToRemove = [];
        this.viewer.entities.values.forEach(entity => {
            if (entity.billboard && !entity.label) {
                entitiesToRemove.push(entity);
            }
        });
        
        entitiesToRemove.forEach(entity => {
            this.viewer.entities.remove(entity);
        });
        
        console.log('🗑️ 航线已清除');
    }
}
