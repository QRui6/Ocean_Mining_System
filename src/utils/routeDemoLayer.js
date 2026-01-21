/**
 * 航线演示图层管理器
 * 负责加载演示数据、绘制航线、控制船舶动画、显示气象信息
 */
import * as Cesium from 'cesium';

export class RouteDemoLayer {
    constructor(viewer) {
        this.viewer = viewer;
        this.demoData = null;
        this.routeEntity = null;
        this.routeSegments = [];  // 存储每段航线（支持分段变色）
        this.shipEntity = null;
        this.weatherInfoEntity = null;
        this.currentWeatherPopup = null;  // 当前气象弹窗
        this.waypointMarkers = [];
        this.currentWaypointIndex = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.animationSpeed = 1;
        this.animationTimer = null;
        this.onWaypointReached = null;
        this.onAnimationComplete = null;
        this.onHighRiskWarning = null;  // 高风险警告回调
        this.onWaypointClick = null;  // 航点点击回调
        this.onShipClick = null;  // 船舶点击回调
        this.clickHandler = null;  // 点击事件处理器
        this.totalDistance = 0;
        this.currentDistance = 0;
    }

    /**
     * 加载演示数据
     */
    async loadDemoData() {
        try {
            console.log('📂 加载航线演示数据...');
            const response = await fetch('/route-demo-data.json');
            this.demoData = await response.json();
            console.log('✅ 演示数据加载成功:', this.demoData);
            return this.demoData;
        } catch (error) {
            console.error('❌ 加载演示数据失败:', error);
            throw error;
        }
    }

    /**
     * 初始化演示
     */
    async initialize() {
        await this.loadDemoData();
        this.drawRoute();
        this.createWaypointMarkers();
        this.createShip();
        // 不再创建独立的点击处理器，使用 MapContainer 的主处理器
        // this.setupClickHandler();
        console.log('✅ 航线演示初始化完成');
    }

    /**
     * 绘制航线（分段绘制，支持变色）
     */
    drawRoute() {
        if (!this.demoData) return;

        const waypoints = this.demoData.route.waypoints;
        
        // 分段绘制航线，每段可以独立变色
        this.routeSegments = [];
        for (let i = 0; i < waypoints.length - 1; i++) {
            const segment = this.viewer.entities.add({
                name: `demo-route-segment-${i}`,
                polyline: {
                    positions: [
                        Cesium.Cartesian3.fromDegrees(waypoints[i].lng, waypoints[i].lat, 0),
                        Cesium.Cartesian3.fromDegrees(waypoints[i + 1].lng, waypoints[i + 1].lat, 0)
                    ],
                    width: 6,
                    material: Cesium.Color.CYAN.withAlpha(0.6),  // 初始颜色：半透明青色
                    clampToGround: false
                }
            });
            
            this.routeSegments.push({
                entity: segment,
                riskLevel: waypoints[i + 1].risk,  // 记录该段终点的风险等级
                startIndex: i,
                endIndex: i + 1
            });
        }

        console.log('✅ 航线绘制完成（分段），共', this.routeSegments.length, '段');
    }

    /**
     * 设置点击处理器（已废弃 - 使用 MapContainer 的主处理器）
     * 
     * 原因：Cesium 每个 canvas 只能有一个 ScreenSpaceEventHandler 处理同一事件类型
     * 创建多个处理器会导致冲突，只有最后创建的会生效
     * 
     * 解决方案：MapContainer 的主点击处理器已经包含了航点和船舶的检测逻辑
     * 通过检查 entity.name 和 entity._waypointData / entity._shipData 来识别
     */
    setupClickHandler() {
        // 不再创建独立的点击处理器
        // MapContainer 的主处理器会处理所有点击事件
        console.log('⚠️ setupClickHandler 已废弃，使用 MapContainer 的主处理器');
    }

    /**
     * 创建航点标记
     */
    createWaypointMarkers() {
        if (!this.demoData) return;

        const waypoints = this.demoData.route.waypoints;
        const riskColors = {
            safe: Cesium.Color.GREEN,
            caution: Cesium.Color.YELLOW,
            warning: Cesium.Color.ORANGE,
            danger: Cesium.Color.RED
        };

        waypoints.forEach((wp, index) => {
            const marker = this.viewer.entities.add({
                name: `waypoint-${index}`,
                position: Cesium.Cartesian3.fromDegrees(wp.lng, wp.lat, 0),
                point: {
                    pixelSize: 8,
                    color: riskColors[wp.risk] || Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 2,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                },
                label: {
                    text: wp.name,
                    font: '14px sans-serif',
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -15),
                    show: false // 默认隐藏标签
                }
            });
            
            // 添加自定义数据属性，用于点击时显示气象信息
            marker._waypointData = wp;
            marker._waypointIndex = index;
            
            console.log(`✅ 航点 ${index} 创建完成:`, {
                name: marker.name,
                hasWaypointData: !!marker._waypointData,
                waypointName: wp.name,
                risk: wp.risk
            });
            
            this.waypointMarkers.push(marker);
        });

        console.log('✅ 航点标记创建完成');
    }

    /**
     * 创建船舶模型
     */
    createShip() {
        if (!this.demoData) return;

        const startWaypoint = this.demoData.route.waypoints[0];
        const startPosition = Cesium.Cartesian3.fromDegrees(
            startWaypoint.lng, 
            startWaypoint.lat, 
            0
        );

        // 使用3D模型（移除VelocityOrientationProperty，手动设置朝向）
        this.shipEntity = this.viewer.entities.add({
            name: 'demo-ship',
            position: startPosition,
            // 船舶贴合地球表面
            // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,  // 注释：GLTF模型不支持heightReference
            // 初始朝向（朝东）
            orientation: Cesium.Transforms.headingPitchRollQuaternion(
                startPosition,
                new Cesium.HeadingPitchRoll(0, 0, 0)
            ),
            model: {
                uri: '/models/ship/cargo_ship/scene.gltf',
                scale: 600,  // 优化：增大到600（原来200的3倍）
                minimumPixelSize: 128,  // 增加最小像素尺寸
                maximumScale: 15000,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,  // 模型贴合地面
                // 添加发光轮廓使船更亮更醒目
                silhouetteColor: Cesium.Color.CYAN.withAlpha(0.5),
                silhouetteSize: 2.0
            },
            label: {
                text: '采矿船',
                font: '16px sans-serif',
                fillColor: Cesium.Color.YELLOW,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 3,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -50),
                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 2000000)
            }
        });
        
        // 添加船舶信息数据，用于点击时显示
        this.shipEntity._shipData = {
            ship_name: '采矿船',
            ship_cnname: '采矿船',
            ship_type: 'Mining Vessel',
            route: this.demoData.route.name,
            description: this.demoData.route.description,
            distance: this.demoData.route.distance + ' 海里',
            estimatedDays: this.demoData.route.estimatedDays + ' 天',
            averageSpeed: this.demoData.route.averageSpeed + ' 节',
            startPort: this.demoData.route.startPort.name,
            endArea: this.demoData.route.endArea.name
        };

        console.log('✅ 船舶3D模型创建完成');
        console.log('   - 船舶名称:', this.shipEntity.name);
        console.log('   - 有 _shipData:', !!this.shipEntity._shipData);
        console.log('   - 船舶数据:', this.shipEntity._shipData);
    }

    /**
     * 创建船舶图标（Canvas绘制）
     */
    createShipIcon() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // 绘制船舶形状
        ctx.fillStyle = '#22d3ee';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;

        // 船体
        ctx.beginPath();
        ctx.moveTo(32, 10);
        ctx.lineTo(50, 40);
        ctx.lineTo(50, 50);
        ctx.lineTo(14, 50);
        ctx.lineTo(14, 40);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 船头
        ctx.beginPath();
        ctx.moveTo(32, 10);
        ctx.lineTo(40, 20);
        ctx.lineTo(24, 20);
        ctx.closePath();
        ctx.fillStyle = '#06b6d4';
        ctx.fill();
        ctx.stroke();

        return canvas.toDataURL();
    }

    /**
     * 开始动画
     */
    play() {
        if (this.isPlaying && !this.isPaused) return;

        this.isPlaying = true;
        this.isPaused = false;

        console.log('▶️ 开始航线演示动画');

        // 飞行到起点（降低高度，更好的视角）
        this.flyToWaypoint(this.currentWaypointIndex);

        // 延迟开始动画，等待相机飞行完成
        setTimeout(() => {
            this.startAnimation();
        }, 2500);
    }

    /**
     * 暂停动画
     */
    pause() {
        this.isPaused = true;
        if (this.animationTimer) {
            clearTimeout(this.animationTimer);
            this.animationTimer = null;
        }
        console.log('⏸️ 暂停航线演示');
    }

    /**
     * 继续动画
     */
    resume() {
        if (!this.isPaused) return;
        this.isPaused = false;
        this.startAnimation();
        console.log('▶️ 继续航线演示');
    }

    /**
     * 停止动画
     */
    stop() {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentWaypointIndex = 0;
        this.currentDistance = 0;

        if (this.animationTimer) {
            clearTimeout(this.animationTimer);
            this.animationTimer = null;
        }

        // 重置船舶位置
        if (this.shipEntity && this.demoData) {
            const startWaypoint = this.demoData.route.waypoints[0];
            this.shipEntity.position = Cesium.Cartesian3.fromDegrees(
                startWaypoint.lng,
                startWaypoint.lat,
                0
            );
        }

        console.log('⏹️ 停止航线演示');
    }

    /**
     * 设置动画速度
     */
    setSpeed(speed) {
        this.animationSpeed = speed;
        console.log('⚡ 动画速度设置为:', speed + 'x');
    }

    /**
     * 开始动画循环
     */
    startAnimation() {
        if (!this.isPlaying || this.isPaused) return;

        const waypoints = this.demoData.route.waypoints;
        
        // 检查是否到达终点
        if (this.currentWaypointIndex >= waypoints.length - 1) {
            console.log('🎯 到达终点');
            this.isPlaying = false;
            
            // 显示最后一个航点的气象信息
            const lastWaypoint = waypoints[waypoints.length - 1];
            this.showWeatherPopup(lastWaypoint);
            
            if (this.onAnimationComplete) {
                this.onAnimationComplete();
            }
            return;
        }

        const currentWp = waypoints[this.currentWaypointIndex];
        const nextWp = waypoints[this.currentWaypointIndex + 1];

        // 修复：在开始移动前就显示下一个点的气象（而不是到达后显示）
        this.showWeatherPopup(nextWp);

        // 移动船舶到下一个航点
        this.moveShipToWaypoint(nextWp, () => {
            // 到达航点 - 改变刚走过的航线段颜色
            const segmentIndex = this.currentWaypointIndex;
            if (segmentIndex < this.routeSegments.length) {
                const segment = this.routeSegments[segmentIndex];
                const riskColors = {
                    safe: Cesium.Color.GREEN.withAlpha(0.8),
                    caution: Cesium.Color.YELLOW.withAlpha(0.8),
                    warning: Cesium.Color.ORANGE.withAlpha(0.8),
                    danger: Cesium.Color.RED.withAlpha(0.8)
                };
                // 改变航线颜色为对应的风险等级
                segment.entity.polyline.material = riskColors[segment.riskLevel] || Cesium.Color.CYAN.withAlpha(0.8);
                console.log(`✅ 航线段 ${segmentIndex} 变色为 ${segment.riskLevel}`);
            }
            
            this.currentWaypointIndex++;
            
            // 显示当前航点标签
            if (this.waypointMarkers[this.currentWaypointIndex]) {
                this.waypointMarkers[this.currentWaypointIndex].label.show = true;
            }

            // 移除这里的 showWeatherPopup 调用（已经在移动前显示了）
            // this.showWeatherPopup(nextWp);

            // 触发航点到达回调
            if (this.onWaypointReached) {
                this.onWaypointReached(nextWp, this.currentWaypointIndex);
            }

            // 继续下一段
            const baseDelay = 2000; // 基础延迟2秒
            const delay = baseDelay / this.animationSpeed;
            
            this.animationTimer = setTimeout(() => {
                this.startAnimation();
            }, delay);
        });
    }

    /**
     * 显示气象信息弹窗（科技风格，根据风险等级变色）
     */
    showWeatherPopup(waypoint) {
        // 移除旧的弹窗
        if (this.currentWeatherPopup) {
            this.viewer.entities.remove(this.currentWeatherPopup);
            this.currentWeatherPopup = null;
        }

        // 风险等级颜色配置（科技风格）
        const riskConfig = {
            safe: {
                color: Cesium.Color.fromCssColorString('#10b981'),      // 绿色
                bgColor: Cesium.Color.fromCssColorString('rgba(16, 185, 129, 0.85)'),
                label: '安全'
            },
            caution: {
                color: Cesium.Color.fromCssColorString('#f59e0b'),      // 黄色
                bgColor: Cesium.Color.fromCssColorString('rgba(245, 158, 11, 0.85)'),
                label: '注意'
            },
            warning: {
                color: Cesium.Color.fromCssColorString('#f97316'),      // 橙色
                bgColor: Cesium.Color.fromCssColorString('rgba(249, 115, 22, 0.85)'),
                label: '警告'
            },
            danger: {
                color: Cesium.Color.fromCssColorString('#ef4444'),      // 红色
                bgColor: Cesium.Color.fromCssColorString('rgba(239, 68, 68, 0.85)'),
                label: '危险'
            }
        };

        const config = riskConfig[waypoint.risk] || riskConfig.safe;

        // 创建气象信息文本（科技风格，无emoji）
        const weatherText = `━━━ ${waypoint.name} ━━━\n` +
            `[ ${config.label} ]\n` +
            `━━━━━━━━━━━━━━━━\n` +
            `> 风速: ${waypoint.weather.windSpeed} m/s\n` +
            `> 风级: ${waypoint.weather.windBeaufort} 级\n` +
            `> 浪高: ${waypoint.weather.waveHeight} m\n` +
            `> 能见度: ${(waypoint.weather.visibility / 1000).toFixed(1)} km\n` +
            `> 温度: ${waypoint.weather.temperature} C`;

        // 创建弹窗实体（根据风险等级变色）
        this.currentWeatherPopup = this.viewer.entities.add({
            name: 'weather-popup',
            position: Cesium.Cartesian3.fromDegrees(waypoint.lng, waypoint.lat, 500000),
            label: {
                text: weatherText,
                font: 'bold 16px monospace',
                fillColor: Cesium.Color.WHITE,  // 白色文字
                backgroundColor: config.bgColor,  // 根据风险等级变色的背景
                backgroundPadding: new Cesium.Cartesian2(15, 12),
                showBackground: true,
                style: Cesium.LabelStyle.FILL,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -30),
                scaleByDistance: new Cesium.NearFarScalar(1000000, 2.5, 8000000, 0.8),
                translucencyByDistance: new Cesium.NearFarScalar(1000000, 1.0, 10000000, 0.6)
            }
        });

        // 触发高风险警告（warning或danger级别）
        if ((waypoint.risk === 'warning' || waypoint.risk === 'danger') && this.onHighRiskWarning) {
            this.onHighRiskWarning(waypoint);
        }

        console.log('🌦️ 显示气象弹窗:', waypoint.name, '风险等级:', waypoint.risk);
    }

    /**
     * 移动船舶到指定航点
     */
    moveShipToWaypoint(waypoint, callback) {
        if (!this.shipEntity) return;

        const targetPosition = Cesium.Cartesian3.fromDegrees(
            waypoint.lng,
            waypoint.lat,
            0
        );

        const startPosition = this.shipEntity.position.getValue(
            this.viewer.clock.currentTime
        );

        // 计算移动时间（基于速度）
        const baseDuration = 3000; // 基础3秒
        const duration = baseDuration / this.animationSpeed;

        // 计算船舶朝向
        const heading = this.calculateHeading(startPosition, targetPosition);

        // 使用插值移动
        const startTime = Date.now();
        const animate = () => {
            if (!this.isPlaying || this.isPaused) return;

            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // 线性插值位置
            const position = new Cesium.Cartesian3();
            Cesium.Cartesian3.lerp(startPosition, targetPosition, progress, position);
            this.shipEntity.position = position;

            // 设置船舶朝向
            const hpr = new Cesium.HeadingPitchRoll(heading, 0, 0);
            this.shipEntity.orientation = Cesium.Transforms.headingPitchRollQuaternion(
                position,
                hpr
            );

            // 移除自动相机跟随，允许用户手动控制视野
            // this.followShip(position);

            // 实时更新进度（问题4修复）
            this.updateProgressInRealtime(progress);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                if (callback) callback();
            }
        };

        animate();
    }

    /**
     * 计算两点之间的航向角
     */
    calculateHeading(startPos, endPos) {
        const startCartographic = Cesium.Cartographic.fromCartesian(startPos);
        const endCartographic = Cesium.Cartographic.fromCartesian(endPos);
        
        const dLon = endCartographic.longitude - startCartographic.longitude;
        const dLat = endCartographic.latitude - startCartographic.latitude;
        
        return Math.atan2(dLon, dLat);
    }

    /**
     * 相机跟随船舶
     */
    followShip(position) {
        if (!this.viewer || !position) return;

        // 使用 setView 而不是 lookAt，保持用户相机控制权
        // 计算相机位置（在船舶后上方）
        const cartographic = Cesium.Cartographic.fromCartesian(position);
        const cameraPosition = Cesium.Cartesian3.fromRadians(
            cartographic.longitude,
            cartographic.latitude - 0.003,  // 优化：向南偏移约330米（后方）
            3750000  // 优化：运动时高度3,750km（系统初始视野的1/4）
        );

        this.viewer.camera.setView({
            destination: cameraPosition,
            orientation: {
                heading: 0,
                pitch: Cesium.Math.toRadians(-89),  // 修复：-89度俯角，几乎垂直向下看地球
                roll: 0
            }
        });
    }

    /**
     * 实时更新进度
     */
    updateProgressInRealtime(segmentProgress) {
        if (!this.demoData) return;

        const totalWaypoints = this.demoData.route.waypoints.length - 1;
        const completedSegments = this.currentWaypointIndex;
        const currentSegmentProgress = segmentProgress;

        const totalProgress = (completedSegments + currentSegmentProgress) / totalWaypoints;

        // 通知面板更新进度
        const appRouteDemoRef = window.appRouteDemoRef;
        if (appRouteDemoRef) {
            appRouteDemoRef.updateProgress(
                completedSegments + currentSegmentProgress,
                totalWaypoints + 1
            );
        }
    }

    /**
     * 飞行到指定航点（问题1修复：飞到船舶位置而不是航点）
     */
    flyToWaypoint(index) {
        if (!this.demoData || !this.shipEntity) return;

        // 获取船舶当前位置
        const shipPosition = this.shipEntity.position.getValue(this.viewer.clock.currentTime);
        if (!shipPosition) return;

        const cartographic = Cesium.Cartographic.fromCartesian(shipPosition);
        
        // 飞到船舶位置（后上方视角）
        this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromRadians(
                cartographic.longitude,
                cartographic.latitude - 0.003,  // 优化：向南偏移约330米（后方）
                7500000  // 优化：初始高度7,500km（系统初始视野的1/2）
            ),
            duration: 2,
            orientation: {
                heading: Cesium.Math.toRadians(0),
                pitch: Cesium.Math.toRadians(-89),  // 修复：-89度俯角，几乎垂直向下看地球
                roll: 0
            }
        });
    }

    /**
     * 清除演示
     */
    clear() {
        this.stop();

        // 不再需要销毁点击处理器（因为没有创建）
        // if (this.clickHandler) {
        //     this.clickHandler.destroy();
        //     this.clickHandler = null;
        //     console.log('🗑️ 航线演示点击处理器已销毁');
        // }

        // 移除整条航线（如果存在）
        if (this.routeEntity) {
            this.viewer.entities.remove(this.routeEntity);
            this.routeEntity = null;
        }

        // 移除分段航线
        this.routeSegments.forEach(segment => {
            if (segment.entity) {
                this.viewer.entities.remove(segment.entity);
            }
        });
        this.routeSegments = [];

        // 移除船舶
        if (this.shipEntity) {
            this.viewer.entities.remove(this.shipEntity);
            this.shipEntity = null;
        }

        // 移除航点标记
        this.waypointMarkers.forEach(marker => {
            this.viewer.entities.remove(marker);
        });
        this.waypointMarkers = [];

        // 移除气象信息弹窗
        if (this.currentWeatherPopup) {
            this.viewer.entities.remove(this.currentWeatherPopup);
            this.currentWeatherPopup = null;
        }

        // 移除气象信息
        if (this.weatherInfoEntity) {
            this.viewer.entities.remove(this.weatherInfoEntity);
            this.weatherInfoEntity = null;
        }

        // 恢复相机控制
        this.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);

        console.log('🗑️ 航线演示已清除');
    }

    /**
     * 获取当前进度
     */
    getProgress() {
        if (!this.demoData) return 0;
        const total = this.demoData.route.waypoints.length - 1;
        return (this.currentWaypointIndex / total) * 100;
    }

    /**
     * 获取当前航点信息
     */
    getCurrentWaypoint() {
        if (!this.demoData) return null;
        return this.demoData.route.waypoints[this.currentWaypointIndex];
    }
}
