/**
 * 船舶轨迹数据和可视化工具
 */

import * as Cesium from 'cesium';

/**
 * 示例轨迹数据：从上海港到太平洋某矿区
 */
export const sampleTrajectories = [
    {
        id: 'route_1',
        name: '上海港 → 太平洋多金属结核矿区',
        startPort: { name: '上海港', lon: 121.5, lat: 31.2 },
        endMine: { name: '太平洋矿区A', lon: 160.0, lat: 15.0 },
        // 航线路径点（经度、纬度）
        waypoints: [
            { lon: 121.5, lat: 31.2, time: 0 },      // 上海港
            { lon: 125.0, lat: 30.0, time: 12 },     // 东海
            { lon: 130.0, lat: 28.0, time: 24 },     // 冲绳附近
            { lon: 135.0, lat: 25.0, time: 36 },     // 太平洋西部
            { lon: 140.0, lat: 22.0, time: 48 },     
            { lon: 145.0, lat: 19.0, time: 60 },     
            { lon: 150.0, lat: 17.0, time: 72 },     
            { lon: 155.0, lat: 16.0, time: 84 },     
            { lon: 160.0, lat: 15.0, time: 96 }      // 目标矿区
        ],
        color: Cesium.Color.CYAN,
        shipType: '采矿船'
    },
    {
        id: 'route_2',
        name: '青岛港 → 印度洋多金属硫化物矿区',
        startPort: { name: '青岛港', lon: 120.3, lat: 36.1 },
        endMine: { name: '印度洋矿区B', lon: 75.0, lat: -10.0 },
        waypoints: [
            { lon: 120.3, lat: 36.1, time: 0 },      // 青岛港
            { lon: 118.0, lat: 30.0, time: 12 },     
            { lon: 115.0, lat: 22.0, time: 24 },     // 南海
            { lon: 110.0, lat: 12.0, time: 36 },     
            { lon: 105.0, lat: 5.0, time: 48 },      // 马六甲海峡
            { lon: 95.0, lat: 0.0, time: 60 },       // 印度洋
            { lon: 85.0, lat: -5.0, time: 72 },      
            { lon: 75.0, lat: -10.0, time: 84 }      // 目标矿区
        ],
        color: Cesium.Color.YELLOW,
        shipType: '运输船'
    }
];

/**
 * 船舶轨迹可视化类
 */
export class ShipTrajectoryLayer {
    constructor(viewer) {
        this.viewer = viewer;
        this.trajectories = [];
        this.isVisible = false;
        this.animationFrameId = null;
        this.currentTime = 0;
    }

    /**
     * 添加轨迹
     */
    addTrajectory(trajectoryData) {
        const { waypoints, color, name, shipType } = trajectoryData;
        
        // 创建轨迹线（渐变效果）
        const positions = waypoints.map(wp => 
            Cesium.Cartesian3.fromDegrees(wp.lon, wp.lat, 10000)
        );

        // 创建渐变轨迹线
        const polyline = this.viewer.entities.add({
            name: `trajectory_${name}`,
            polyline: {
                positions: positions,
                width: 3,
                material: new Cesium.PolylineGlowMaterialProperty({
                    glowPower: 0.2,
                    color: color.withAlpha(0.8)
                }),
                clampToGround: false
            }
        });

        // 创建船舶模型（使用简单的圆锥体代替）
        const startPos = waypoints[0];
        const ship = this.viewer.entities.add({
            name: `ship_${name}`,
            position: Cesium.Cartesian3.fromDegrees(startPos.lon, startPos.lat, 10000),
            billboard: {
                image: this.createShipIcon(color),
                width: 32,
                height: 32,
                heightReference: Cesium.HeightReference.NONE
            },
            label: {
                text: shipType,
                font: '14px sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -40)
            }
        });

        // 创建起点标记
        const startMarker = this.viewer.entities.add({
            name: `start_${name}`,
            position: Cesium.Cartesian3.fromDegrees(startPos.lon, startPos.lat, 10000),
            point: {
                pixelSize: 12,
                color: Cesium.Color.GREEN,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2
            },
            label: {
                text: trajectoryData.startPort.name,
                font: '12px sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                pixelOffset: new Cesium.Cartesian2(0, -20)
            }
        });

        // 创建终点标记
        const endPos = waypoints[waypoints.length - 1];
        const endMarker = this.viewer.entities.add({
            name: `end_${name}`,
            position: Cesium.Cartesian3.fromDegrees(endPos.lon, endPos.lat, 10000),
            point: {
                pixelSize: 12,
                color: Cesium.Color.RED,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2
            },
            label: {
                text: trajectoryData.endMine.name,
                font: '12px sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                pixelOffset: new Cesium.Cartesian2(0, -20)
            }
        });

        // 创建动态轨迹线（逐渐显示）
        const dynamicPolyline = this.viewer.entities.add({
            name: `dynamic_trajectory_${name}`,
            polyline: {
                positions: new Cesium.CallbackProperty(() => {
                    const progress = this.currentTime / 100;
                    const pointCount = Math.floor(waypoints.length * progress);
                    if (pointCount < 2) return [positions[0], positions[0]];
                    return positions.slice(0, pointCount);
                }, false),
                width: 5,
                material: new Cesium.PolylineGlowMaterialProperty({
                    glowPower: 0.3,
                    color: color
                })
            }
        });

        this.trajectories.push({
            data: trajectoryData,
            polyline,
            ship,
            startMarker,
            endMarker,
            dynamicPolyline,
            waypoints
        });
    }

    /**
     * 创建船舶图标
     */
    createShipIcon(color) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // 绘制船形
        ctx.fillStyle = color.toCssColorString();
        ctx.beginPath();
        ctx.moveTo(32, 10);  // 船头
        ctx.lineTo(45, 50);  // 右侧
        ctx.lineTo(32, 45);  // 船尾中心
        ctx.lineTo(19, 50);  // 左侧
        ctx.closePath();
        ctx.fill();

        // 绘制边框
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        return canvas.toDataURL();
    }

    /**
     * 开始动画
     */
    startAnimation() {
        if (this.animationFrameId) return;

        const animate = () => {
            this.currentTime += 0.5;
            if (this.currentTime > 100) {
                this.currentTime = 0;
            }

            // 更新船舶位置
            this.trajectories.forEach(traj => {
                const progress = this.currentTime / 100;
                const totalPoints = traj.waypoints.length;
                const currentIndex = Math.floor(progress * (totalPoints - 1));
                const nextIndex = Math.min(currentIndex + 1, totalPoints - 1);
                
                const current = traj.waypoints[currentIndex];
                const next = traj.waypoints[nextIndex];
                
                const localProgress = (progress * (totalPoints - 1)) - currentIndex;
                
                const lon = current.lon + (next.lon - current.lon) * localProgress;
                const lat = current.lat + (next.lat - current.lat) * localProgress;
                
                traj.ship.position = Cesium.Cartesian3.fromDegrees(lon, lat, 10000);
            });

            if (this.isVisible) {
                this.animationFrameId = requestAnimationFrame(animate);
            }
        };

        animate();
    }

    /**
     * 停止动画
     */
    stopAnimation() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * 显示轨迹
     */
    show() {
        this.isVisible = true;
        this.trajectories.forEach(traj => {
            traj.polyline.show = true;
            traj.ship.show = true;
            traj.startMarker.show = true;
            traj.endMarker.show = true;
            traj.dynamicPolyline.show = true;
        });
        this.startAnimation();
    }

    /**
     * 隐藏轨迹
     */
    hide() {
        this.isVisible = false;
        this.stopAnimation();
        this.trajectories.forEach(traj => {
            traj.polyline.show = false;
            traj.ship.show = false;
            traj.startMarker.show = false;
            traj.endMarker.show = false;
            traj.dynamicPolyline.show = false;
        });
    }

    /**
     * 移除所有轨迹
     */
    remove() {
        this.stopAnimation();
        this.trajectories.forEach(traj => {
            this.viewer.entities.remove(traj.polyline);
            this.viewer.entities.remove(traj.ship);
            this.viewer.entities.remove(traj.startMarker);
            this.viewer.entities.remove(traj.endMarker);
            this.viewer.entities.remove(traj.dynamicPolyline);
        });
        this.trajectories = [];
    }

    /**
     * 飞到轨迹视角
     */
    flyTo() {
        if (this.trajectories.length === 0) return;
        
        const firstTraj = this.trajectories[0];
        const startPos = firstTraj.waypoints[0];
        const endPos = firstTraj.waypoints[firstTraj.waypoints.length - 1];
        
        const centerLon = (startPos.lon + endPos.lon) / 2;
        const centerLat = (startPos.lat + endPos.lat) / 2;
        
        this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, 5000000),
            duration: 2
        });
    }
}
