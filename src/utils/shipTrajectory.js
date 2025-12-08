/**
 * 船舶轨迹数据和可视化工具
 */

import * as Cesium from 'cesium';

/**
 * 示例轨迹数据：真实的海洋航线（完全避开陆地，更多路径点确保平滑）
 */
export const sampleTrajectories = [
    {
        id: 'route_1',
        name: '上海港 → 太平洋克拉里昂-克利珀顿区',
        startPort: { name: '上海港', lon: 121.5, lat: 31.2 },
        endMine: { name: 'CCZ矿区', lon: -140.0, lat: 12.0 },
        // 船舶详细信息
        shipInfo: {
            name: '深海探索者号',
            type: '深海采矿船',
            length: '228米',
            width: '42米',
            speed: '15节',
            capacity: '50000吨',
            crew: '120人',
            departure: '2024-12-01',
            eta: '2024-12-25',
            cargo: '多金属结核采集设备',
            status: '航行中'
        },
        // 航线路径点（向东南出海，完全在海洋上）
        waypoints: [
            { lon: 121.5, lat: 31.2 },      // 上海港
            { lon: 123.0, lat: 30.5 },      // 东海
            { lon: 125.0, lat: 29.5 },      
            { lon: 127.0, lat: 28.5 },      
            { lon: 129.0, lat: 27.5 },      // 琉球群岛东侧
            { lon: 131.0, lat: 26.5 },      
            { lon: 133.0, lat: 25.5 },      
            { lon: 135.0, lat: 24.5 },      
            { lon: 138.0, lat: 23.0 },      // 远离日本
            { lon: 142.0, lat: 21.0 },      
            { lon: 146.0, lat: 19.0 },      
            { lon: 150.0, lat: 17.5 },      
            { lon: 155.0, lat: 16.0 },      
            { lon: 160.0, lat: 15.0 },      
            { lon: 165.0, lat: 14.0 },      
            { lon: 170.0, lat: 13.5 },      
            { lon: 175.0, lat: 13.0 },      
            { lon: -180.0, lat: 12.8 },     // 跨越日期变更线
            { lon: -175.0, lat: 12.6 },     
            { lon: -170.0, lat: 12.5 },     
            { lon: -165.0, lat: 12.4 },     
            { lon: -160.0, lat: 12.3 },     
            { lon: -155.0, lat: 12.2 },     
            { lon: -150.0, lat: 12.1 },     
            { lon: -145.0, lat: 12.05 },    
            { lon: -140.0, lat: 12.0 }      // CCZ矿区
        ],
        color: Cesium.Color.CYAN,
        shipType: '深海采矿船'
    },
    {
        id: 'route_2',
        name: '广州港 → 西太平洋海山富钴结壳区',
        startPort: { name: '广州港', lon: 113.25, lat: 23.13 },
        endMine: { name: '麦哲伦海山矿区', lon: 155.0, lat: 17.0 },
        // 船舶详细信息
        shipInfo: {
            name: '海洋先锋号',
            type: '结壳采集船',
            length: '185米',
            width: '32米',
            speed: '18节',
            capacity: '35000吨',
            crew: '85人',
            departure: '2024-11-28',
            eta: '2024-12-18',
            cargo: '富钴结壳采集系统',
            status: '航行中'
        },
        // 航线路径点（向东南，经巴士海峡，完全在海洋）
        waypoints: [
            { lon: 113.25, lat: 23.13 },    // 广州港
            { lon: 114.5, lat: 22.0 },      
            { lon: 116.0, lat: 20.8 },      // 南海
            { lon: 117.5, lat: 19.8 },      
            { lon: 119.0, lat: 19.0 },      
            { lon: 120.5, lat: 19.2 },      // 巴士海峡（台湾南端与吕宋岛北端之间）
            { lon: 122.0, lat: 19.5 },      // 进入菲律宾海
            { lon: 124.0, lat: 19.3 },      
            { lon: 126.5, lat: 19.0 },      
            { lon: 129.0, lat: 18.7 },      
            { lon: 132.0, lat: 18.5 },      
            { lon: 135.0, lat: 18.3 },      
            { lon: 138.0, lat: 18.0 },      
            { lon: 141.0, lat: 17.8 },      
            { lon: 144.0, lat: 17.6 },      
            { lon: 147.0, lat: 17.4 },      
            { lon: 150.0, lat: 17.2 },      
            { lon: 152.5, lat: 17.1 },      
            { lon: 155.0, lat: 17.0 }       // 麦哲伦海山矿区
        ],
        color: Cesium.Color.LIME,
        shipType: '结壳采集船'
    },
    {
        id: 'route_3',
        name: '新加坡港 → 印度洋中脊矿区',
        startPort: { name: '新加坡港', lon: 103.85, lat: 1.29 },
        endMine: { name: '印度洋中脊矿区', lon: 65.0, lat: -25.0 },
        // 船舶详细信息
        shipInfo: {
            name: '科学考察一号',
            type: '科考采矿船',
            length: '156米',
            width: '28米',
            speed: '16节',
            capacity: '28000吨',
            crew: '95人',
            departure: '2024-12-05',
            eta: '2024-12-28',
            cargo: '多金属硫化物勘探设备',
            status: '航行中'
        },
        // 航线路径点（经马六甲海峡，在马来半岛和苏门答腊岛之间的海域）
        waypoints: [
            { lon: 103.85, lat: 1.29 },     // 新加坡港
            { lon: 102.5, lat: 1.8 },       // 新加坡海峡
            { lon: 101.5, lat: 2.5 },       // 马六甲海峡南部
            { lon: 100.8, lat: 3.2 },       // 马六甲海峡
            { lon: 100.3, lat: 4.0 },       // 马六甲海峡中部
            { lon: 100.0, lat: 4.8 },       // 马六甲海峡
            { lon: 99.8, lat: 5.5 },        // 马六甲海峡
            { lon: 99.5, lat: 6.2 },        // 马六甲海峡北部
            { lon: 99.2, lat: 7.0 },        // 接近马六甲海峡西口
            { lon: 98.8, lat: 7.5 },        // 马六甲海峡西口
            { lon: 98.0, lat: 8.0 },        // 进入安达曼海
            { lon: 96.5, lat: 8.0 },        // 安达曼海
            { lon: 94.5, lat: 7.5 },        // 安达曼海中部
            { lon: 92.0, lat: 6.5 },        // 向西南
            { lon: 90.0, lat: 5.0 },        // 继续向西南
            { lon: 87.5, lat: 2.5 },        // 进入印度洋
            { lon: 85.0, lat: 0.0 },        // 印度洋东部
            { lon: 82.0, lat: -3.5 },       
            { lon: 79.0, lat: -7.5 },       
            { lon: 76.0, lat: -11.5 },      
            { lon: 73.0, lat: -15.5 },      
            { lon: 70.5, lat: -19.0 },      
            { lon: 68.0, lat: -22.0 },      
            { lon: 66.5, lat: -24.0 },      
            { lon: 65.0, lat: -25.0 }       // 印度洋中脊矿区
        ],
        color: Cesium.Color.YELLOW,
        shipType: '科考采矿船'
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
        this.isPaused = false;  // 动画暂停状态
    }
    
    /**
     * 恢复动画
     */
    resumeAnimation() {
        this.isPaused = false;
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
            id: `ship_${trajectoryData.id}`,  // 添加唯一 ID
            name: `ship_${name}`,
            position: Cesium.Cartesian3.fromDegrees(startPos.lon, startPos.lat, 10000),
            billboard: {
                image: this.createShipIcon(color),
                width: 40,  // 增大尺寸，更容易点击
                height: 40,
                heightReference: Cesium.HeightReference.NONE,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,  // 确保始终可见
                pixelOffset: new Cesium.Cartesian2(0, 0)  // 确保中心对齐
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
            },
            // 添加自定义属性，方便识别
            properties: {
                type: 'ship',
                shipData: trajectoryData.shipInfo
            }
        });
        
        console.log('🚢 创建船舶实体:', {
            id: ship.id,
            name: ship.name,
            hasBillboard: !!ship.billboard,
            shipInfo: trajectoryData.shipInfo
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
     * 开始动画（持续平滑移动）
     */
    startAnimation() {
        if (this.animationFrameId) return;

        // 强制 Cesium 持续渲染
        this.viewer.scene.requestRenderMode = false;

        const animate = () => {
            // 如果暂停，则不更新位置
            if (!this.isPaused) {
                // 持续更新动画，不管相机状态
                this.currentTime += 0.3;  // 降低速度，让移动更平滑
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
            }

            // 强制请求渲染
            this.viewer.scene.requestRender();

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
