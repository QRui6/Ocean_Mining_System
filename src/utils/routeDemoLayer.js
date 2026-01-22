/**
 * 航线演示图层管理器
 * 负责加载演示数据、绘制航线、控制船舶动画、显示气象信息
 */
import * as Cesium from 'cesium';

export class RouteDemoLayer {
    constructor(viewer, miningDataSource = null) {
        this.viewer = viewer;
        this.miningDataSource = miningDataSource;  // 矿区数据源
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
        
        // 到达后演示相关
        this.arrivalForecastData = null;  // 7天到达后预报数据
        this.currentArrivalDay = 0;  // 当前演示的天数
        this.arrivalDemoTimer = null;  // 到达后演示定时器
        this.isArrivalDemoPlaying = false;  // 到达后演示是否正在播放
    }

    /**
     * 加载演示数据（动态生成航线）
     */
    async loadDemoData(miningAreaId = 'CMMPMN1') {
        try {
            console.log('📂 开始生成航线演示数据，目标矿区:', miningAreaId);
            
            // 1. 查找矿区数据
            const miningArea = this.findMiningArea(miningAreaId);
            if (!miningArea) {
                console.error('❌ 未找到矿区:', miningAreaId);
                // 降级：加载静态数据
                return this.loadStaticDemoData();
            }
            
            console.log('✅ 找到矿区:', miningArea.properties);
            
            // 2. 计算矿区中心点
            const endPoint = this.calculatePolygonCenter(miningArea.geometry.coordinates);
            console.log('📍 矿区中心坐标:', endPoint);
            
            // 3. 生成航线
            const start = { lng: 121.5, lat: 31.2, name: '上海港' };
            const end = {
                lng: endPoint.lng,
                lat: endPoint.lat,
                name: miningArea.properties.contractor || '中国五矿CCZ多金属结核矿区'
            };
            
            const waypoints = this.generateRoute(start, end, 21); // 生成22个航点
            
            // 4. 计算总距离
            const distance = this.calculateTotalDistance(waypoints);
            const estimatedDays = Math.ceil(distance / (12 * 24)); // 假设平均速度12节
            
            // 5. 构造演示数据
            this.demoData = {
                route: {
                    name: `上海港 → ${end.name}`,
                    description: `从上海港出发，经东海、西太平洋，最终到达${end.name}（${miningAreaId}）`,
                    startPort: {
                        name: '上海港',
                        lng: 121.5,
                        lat: 31.2
                    },
                    endArea: {
                        name: end.name,
                        lng: end.lng,
                        lat: end.lat
                    },
                    distance: Math.round(distance),
                    estimatedDays: estimatedDays,
                    averageSpeed: 12,
                    waypoints: waypoints
                },
                animation: {
                    defaultSpeed: 1,
                    speedOptions: [0.5, 1, 2, 5, 10, 20],
                    updateInterval: 2000
                }
            };
            
            console.log('✅ 航线生成成功:', {
                waypoints: waypoints.length,
                distance: distance.toFixed(2) + ' 海里',
                days: estimatedDays
            });
            
            return this.demoData;
        } catch (error) {
            console.error('❌ 生成航线数据失败:', error);
            // 降级：加载静态数据
            return this.loadStaticDemoData();
        }
    }
    
    /**
     * 降级方案：加载静态演示数据
     */
    async loadStaticDemoData() {
        try {
            console.log('📂 降级：加载静态航线演示数据...');
            const response = await fetch('/route-demo-data.json');
            this.demoData = await response.json();
            console.log('✅ 静态演示数据加载成功');
            return this.demoData;
        } catch (error) {
            console.error('❌ 加载静态演示数据失败:', error);
            throw error;
        }
    }
    
    /**
     * 从矿区数据源中查找指定矿区
     */
    findMiningArea(miningAreaId) {
        if (!this.miningDataSource) {
            console.warn('⚠️ 矿区数据源未提供');
            return null;
        }
        
        const entities = this.miningDataSource.entities.values;
        const area = entities.find(entity => {
            const id = entity.properties?.id?.getValue();
            return id === miningAreaId;
        });
        
        if (!area) {
            console.warn('⚠️ 未找到矿区:', miningAreaId);
            return null;
        }
        
        // 提取 GeoJSON 格式的数据
        return {
            properties: {
                id: area.properties.id?.getValue(),
                contractor: area.properties.contractor?.getValue(),
                sponsor: area.properties.sponsor?.getValue(),
                mineral: area.properties.mineral?.getValue(),
                location: area.properties.location?.getValue()
            },
            geometry: {
                coordinates: this.extractPolygonCoordinates(area)
            }
        };
    }
    
    /**
     * 从 Cesium Entity 中提取多边形坐标
     */
    extractPolygonCoordinates(entity) {
        if (!entity.polygon || !entity.polygon.hierarchy) {
            return null;
        }
        
        const hierarchy = entity.polygon.hierarchy.getValue();
        const positions = hierarchy.positions || [];
        
        // 转换为 [lng, lat] 格式
        const coordinates = positions.map(position => {
            const cartographic = Cesium.Cartographic.fromCartesian(position);
            return [
                Cesium.Math.toDegrees(cartographic.longitude),
                Cesium.Math.toDegrees(cartographic.latitude)
            ];
        });
        
        // 确保多边形闭合
        if (coordinates.length > 0) {
            const first = coordinates[0];
            const last = coordinates[coordinates.length - 1];
            if (first[0] !== last[0] || first[1] !== last[1]) {
                coordinates.push([...first]);
            }
        }
        
        return [coordinates]; // GeoJSON 格式需要嵌套数组
    }
    
    /**
     * 计算多边形中心点（质心）
     */
    calculatePolygonCenter(coordinates) {
        if (!coordinates || coordinates.length === 0) {
            throw new Error('无效的多边形坐标');
        }
        
        const polygon = coordinates[0]; // 取外环
        let sumLng = 0, sumLat = 0;
        let count = polygon.length - 1; // 最后一个点是重复的起点
        
        for (let i = 0; i < count; i++) {
            sumLng += polygon[i][0];
            sumLat += polygon[i][1];
        }
        
        return {
            lng: sumLng / count,
            lat: sumLat / count
        };
    }
    
    /**
     * 生成大圆航线（球面线性插值，添加途经点避开陆地）
     */
    generateRoute(start, end, numWaypoints = 21) {
        // 添加一个途经点避开日本陆地（日本南部外海）
        const viaPoint = { lng: 135, lat: 20, name: '西太平洋' };
        
        // 分两段生成航线：上海 -> 途经点 -> 矿区
        const waypoints = [];
        
        // 第一段：上海 -> 途经点（分配前半部分航点）
        const segment1Points = Math.floor(numWaypoints / 3);  // 约1/3的航点
        for (let i = 0; i <= segment1Points; i++) {
            const fraction = i / segment1Points;
            const point = this.interpolateGreatCircle(start, viaPoint, fraction);
            const globalFraction = fraction * 0.33;  // 全局进度的前1/3
            
            // 生成模拟气象数据
            const weather = this.generateMockWeather(globalFraction);
            
            // 评估风险等级
            const risk = this.assessRisk(weather);
            
            // 计算到下一个航点的距离和时间
            let segment = null;
            if (i < segment1Points) {
                const nextPoint = this.interpolateGreatCircle(start, viaPoint, (i + 1) / segment1Points);
                const segmentDistance = this.calculateDistance(point, nextPoint);
                const duration = Math.round(segmentDistance / 12);
                
                segment = {
                    to: `航点 ${waypoints.length + 2}`,
                    distance: Math.round(segmentDistance),
                    duration: `${duration}小时`
                };
            }
            
            waypoints.push({
                id: waypoints.length + 1,
                lng: point.lng,
                lat: point.lat,
                name: i === 0 ? start.name : 
                      i === segment1Points ? viaPoint.name :
                      this.generateWaypointName(waypoints.length, globalFraction),
                description: i === 0 ? '航程起点' : 
                            this.generateWaypointDescription(globalFraction),
                weather: weather,
                risk: risk,
                segment: segment
            });
        }
        
        // 第二段：途经点 -> 矿区（分配后半部分航点）
        const segment2Points = numWaypoints - segment1Points;
        for (let i = 1; i <= segment2Points; i++) {  // 从1开始，避免重复途经点
            const fraction = i / segment2Points;
            const point = this.interpolateGreatCircle(viaPoint, end, fraction);
            const globalFraction = 0.33 + fraction * 0.67;  // 全局进度的后2/3
            
            // 生成模拟气象数据
            const weather = this.generateMockWeather(globalFraction);
            
            // 评估风险等级
            const risk = this.assessRisk(weather);
            
            // 计算到下一个航点的距离和时间
            let segment = null;
            if (i < segment2Points) {
                const nextPoint = this.interpolateGreatCircle(viaPoint, end, (i + 1) / segment2Points);
                const segmentDistance = this.calculateDistance(point, nextPoint);
                const duration = Math.round(segmentDistance / 12);
                
                segment = {
                    to: i === segment2Points - 1 ? end.name : `航点 ${waypoints.length + 2}`,
                    distance: Math.round(segmentDistance),
                    duration: `${duration}小时`
                };
            }
            
            waypoints.push({
                id: waypoints.length + 1,
                lng: point.lng,
                lat: point.lat,
                name: i === segment2Points ? end.name : 
                      this.generateWaypointName(waypoints.length, globalFraction),
                description: i === segment2Points ? `到达目的地（${end.name}），开始作业准备` :
                            this.generateWaypointDescription(globalFraction),
                weather: weather,
                risk: risk,
                segment: segment
            });
        }
        
        return waypoints;
    }
    
    /**
     * 球面线性插值（大圆航线）
     */
    interpolateGreatCircle(start, end, fraction) {
        const startLat = start.lat * Math.PI / 180;
        const startLng = start.lng * Math.PI / 180;
        const endLat = end.lat * Math.PI / 180;
        const endLng = end.lng * Math.PI / 180;
        
        // 计算球面距离
        const d = 2 * Math.asin(Math.sqrt(
            Math.pow(Math.sin((startLat - endLat) / 2), 2) +
            Math.cos(startLat) * Math.cos(endLat) *
            Math.pow(Math.sin((startLng - endLng) / 2), 2)
        ));
        
        // 处理特殊情况
        if (d < 0.0001) {
            return { lat: start.lat, lng: start.lng };
        }
        
        const A = Math.sin((1 - fraction) * d) / Math.sin(d);
        const B = Math.sin(fraction * d) / Math.sin(d);
        
        const x = A * Math.cos(startLat) * Math.cos(startLng) +
                  B * Math.cos(endLat) * Math.cos(endLng);
        const y = A * Math.cos(startLat) * Math.sin(startLng) +
                  B * Math.cos(endLat) * Math.sin(endLng);
        const z = A * Math.sin(startLat) + B * Math.sin(endLat);
        
        const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * 180 / Math.PI;
        const lng = Math.atan2(y, x) * 180 / Math.PI;
        
        return { lat, lng };
    }
    
    /**
     * 计算两点之间的距离（海里）
     */
    calculateDistance(point1, point2) {
        const R = 3440.065; // 地球半径（海里）
        const lat1 = point1.lat * Math.PI / 180;
        const lat2 = point2.lat * Math.PI / 180;
        const dLat = (point2.lat - point1.lat) * Math.PI / 180;
        const dLng = (point2.lng - point1.lng) * Math.PI / 180;
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
    
    /**
     * 计算总距离
     */
    calculateTotalDistance(waypoints) {
        let total = 0;
        for (let i = 0; i < waypoints.length - 1; i++) {
            total += this.calculateDistance(waypoints[i], waypoints[i + 1]);
        }
        return total;
    }
    
    /**
     * 生成航点名称
     */
    generateWaypointName(index, fraction) {
        const names = [
            '东海海域', '琉球群岛附近', '西太平洋海域', '台风外围影响区',
            '台风边缘区域', '避让航行区', '风浪减弱区', '中太平洋海域',
            '热带辐合带', '强对流天气区', '天气转好区', '东太平洋海域',
            '国际日期变更线', '东太平洋中部', '赤道无风带边缘', 'CCZ区外围',
            'CCZ矿区边界', 'CCZ矿区中部', '矿区作业区', '接近目标矿区'
        ];
        
        const nameIndex = Math.min(Math.floor(fraction * names.length), names.length - 1);
        return names[nameIndex] || `航点 ${index}`;
    }
    
    /**
     * 生成航点描述
     */
    generateWaypointDescription(fraction) {
        if (fraction < 0.15) return '进入东海';
        if (fraction < 0.25) return '接近琉球海沟';
        if (fraction < 0.35) return '进入开阔洋面';
        if (fraction < 0.45) return '受台风外围环流影响';
        if (fraction < 0.55) return '绕行台风，风浪依然较大';
        if (fraction < 0.65) return '逐渐远离台风影响';
        if (fraction < 0.75) return '海况好转';
        if (fraction < 0.85) return '接近赤道';
        if (fraction < 0.95) return '接近矿区';
        return '最后航段';
    }
    
    /**
     * 生成模拟气象数据
     */
    generateMockWeather(fraction) {
        // 根据航程位置生成不同的气象条件
        let baseWindSpeed = 5 + Math.random() * 3;
        let baseWaveHeight = 1 + Math.random() * 0.5;
        
        // 台风影响区域（fraction 0.3-0.5）
        if (fraction > 0.3 && fraction < 0.5) {
            baseWindSpeed = 12 + Math.random() * 5;
            baseWaveHeight = 3 + Math.random() * 1.5;
        }
        
        // 热带辐合带（fraction 0.6-0.7）
        if (fraction > 0.6 && fraction < 0.7) {
            baseWindSpeed = 8 + Math.random() * 4;
            baseWaveHeight = 2 + Math.random() * 1;
        }
        
        const windSpeed = parseFloat(baseWindSpeed.toFixed(1));
        const windBeaufort = this.windSpeedToBeaufort(windSpeed);
        const waveHeight = parseFloat(baseWaveHeight.toFixed(1));
        
        const windDirections = ['东北', '东', '东南', '南', '西南', '西', '西北', '北'];
        const windDirection = windDirections[Math.floor(Math.random() * windDirections.length)];
        
        return {
            windSpeed: windSpeed,
            windBeaufort: windBeaufort,
            windDirection: windDirection,
            waveHeight: waveHeight,
            visibility: Math.round(8000 + Math.random() * 10000),
            temperature: Math.round(18 + fraction * 10 + Math.random() * 3),
            pressure: Math.round(1008 + Math.random() * 10)
        };
    }
    
    /**
     * 风速转蒲福风级
     */
    windSpeedToBeaufort(windSpeed) {
        if (windSpeed < 0.3) return 0;
        if (windSpeed < 1.6) return 1;
        if (windSpeed < 3.4) return 2;
        if (windSpeed < 5.5) return 3;
        if (windSpeed < 8.0) return 4;
        if (windSpeed < 10.8) return 5;
        if (windSpeed < 13.9) return 6;
        if (windSpeed < 17.2) return 7;
        if (windSpeed < 20.8) return 8;
        if (windSpeed < 24.5) return 9;
        if (windSpeed < 28.5) return 10;
        if (windSpeed < 32.7) return 11;
        return 12;
    }
    
    /**
     * 评估风险等级
     */
    assessRisk(weather) {
        if (weather.windSpeed > 15 || weather.waveHeight > 4) {
            return 'danger';
        }
        if (weather.windSpeed > 12 || weather.waveHeight > 3) {
            return 'warning';
        }
        if (weather.windSpeed > 8 || weather.waveHeight > 2) {
            return 'caution';
        }
        return 'safe';
    }

    /**
     * 初始化演示
     */
    async initialize(miningAreaId = 'CMMPMN1') {
        await this.loadDemoData(miningAreaId);
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
        
        // 定义风险等级颜色
        const riskColors = {
            safe: Cesium.Color.GREEN.withAlpha(0.8),
            caution: Cesium.Color.YELLOW.withAlpha(0.8),
            warning: Cesium.Color.ORANGE.withAlpha(0.8),
            danger: Cesium.Color.RED.withAlpha(0.8)
        };
        
        // 分段绘制航线，每段根据风险等级显示对应颜色
        this.routeSegments = [];
        for (let i = 0; i < waypoints.length - 1; i++) {
            const nextWaypointRisk = waypoints[i + 1].risk;
            const segmentColor = riskColors[nextWaypointRisk] || Cesium.Color.CYAN.withAlpha(0.6);
            
            const segment = this.viewer.entities.add({
                name: `demo-route-segment-${i}`,
                polyline: {
                    positions: [
                        Cesium.Cartesian3.fromDegrees(waypoints[i].lng, waypoints[i].lat, 0),
                        Cesium.Cartesian3.fromDegrees(waypoints[i + 1].lng, waypoints[i + 1].lat, 0)
                    ],
                    width: 6,
                    material: segmentColor,  // 根据风险等级设置初始颜色
                    clampToGround: false
                }
            });
            
            this.routeSegments.push({
                entity: segment,
                riskLevel: nextWaypointRisk,  // 记录该段终点的风险等级
                startIndex: i,
                endIndex: i + 1
            });
        }

        console.log('✅ 航线绘制完成（分段，已显示风险颜色），共', this.routeSegments.length, '段');
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
        
        // 暂停到达后演示
        if (this.isArrivalDemoPlaying) {
            this.pauseArrivalDemo();
        }
        
        console.log('⏸️ 暂停航线演示');
    }

    /**
     * 继续动画
     */
    resume() {
        if (!this.isPaused) return;
        this.isPaused = false;
        
        // 如果航线动画还在进行，继续航线动画
        if (this.isPlaying) {
            this.startAnimation();
            console.log('▶️ 继续航线演示');
        }
        // 如果到达后演示在进行，继续到达后演示
        else if (this.isArrivalDemoPlaying) {
            this.resumeArrivalDemo();
            console.log('▶️ 继续到达后演示');
        }
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
        
        // 停止到达后演示
        this.stopArrivalDemo();

        // 恢复相机控制（解除 lookAt 锁定）
        this.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);

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
            
            // 启动到达后气象演示（延迟3秒开始）
            if (this.arrivalForecastData && this.arrivalForecastData.length > 0) {
                console.log('⏰ 3秒后开始到达后气象演示...');
                setTimeout(() => {
                    this.startArrivalDemo();
                }, 3000);
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

            // 相机跟随船舶（倾斜追踪视角）
            this.followShip(position);

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
     * 相机跟随船舶（倾斜追踪视角）
     */
    followShip(position) {
        if (!this.viewer || !position) return;

        // 使用 lookAt 方法，相机自动计算位置并看向船舶
        this.viewer.camera.lookAt(
            position,  // 目标位置（船舶）
            new Cesium.HeadingPitchRange(
                Cesium.Math.toRadians(0),      // heading: 0度（从正北看船舶）
                Cesium.Math.toRadians(-45),    // pitch: -45度俯角（倾斜视角）
                3750000                        // range: 距离船舶3750km（系统初始高度15000km的1/4）
            )
        );
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
     * 飞行到指定航点（初始视角设置）
     */
    flyToWaypoint(index) {
        if (!this.demoData || !this.shipEntity) return;

        // 获取船舶当前位置
        const shipPosition = this.shipEntity.position.getValue(this.viewer.clock.currentTime);
        if (!shipPosition) return;
        
        // 使用 flyTo 飞到船舶附近，然后使用 lookAt 设置视角
        const cartographic = Cesium.Cartographic.fromCartesian(shipPosition);
        
        this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromRadians(
                cartographic.longitude,
                cartographic.latitude - 0.01,  // 稍微偏移
                3750000  // 临时高度（系统初始高度15000km的1/4）
            ),
            duration: 2,
            complete: () => {
                // 飞行完成后，使用 lookAt 锁定船舶
                this.viewer.camera.lookAt(
                    shipPosition,
                    new Cesium.HeadingPitchRange(
                        Cesium.Math.toRadians(0),
                        Cesium.Math.toRadians(-45),
                        3750000  // range: 距离船舶3750km（系统初始高度15000km的1/4）
                    )
                );
            }
        });
    }

    /**
     * 清除演示
     */
    clear() {
        this.stop();

        // 恢复相机控制（解除 lookAt 锁定）
        this.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);

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
    
    /**
     * 设置到达后预报数据
     */
    setArrivalForecast(arrivalForecast) {
        this.arrivalForecastData = arrivalForecast;
        console.log('📊 已设置到达后预报数据，共', arrivalForecast.length, '天');
    }
    
    /**
     * 开始到达后气象演示
     */
    startArrivalDemo() {
        if (!this.arrivalForecastData || this.arrivalForecastData.length === 0) {
            console.log('⚠️ 没有到达后预报数据，跳过演示');
            return;
        }
        
        if (this.isArrivalDemoPlaying) {
            console.log('⚠️ 到达后演示已在进行中');
            return;
        }
        
        this.isArrivalDemoPlaying = true;
        this.currentArrivalDay = 0;
        
        console.log('🎬 开始到达后气象演示，共', this.arrivalForecastData.length, '天');
        
        // 开始演示第一天
        this.showNextArrivalDay();
    }
    
    /**
     * 显示下一天的到达后气象
     */
    showNextArrivalDay() {
        if (!this.isArrivalDemoPlaying) {
            console.log('⏹️ 到达后演示已停止');
            return;
        }
        
        if (this.currentArrivalDay >= this.arrivalForecastData.length) {
            console.log('✅ 到达后气象演示完成');
            this.isArrivalDemoPlaying = false;
            return;
        }
        
        const dayData = this.arrivalForecastData[this.currentArrivalDay];
        const dayNumber = this.currentArrivalDay + 1;
        
        console.log(`📅 显示到达后第${dayNumber}天气象 (${dayData.date})，风险等级: ${dayData.risk}`);
        
        // 只有 warning 或 danger 级别才弹警告
        if (dayData.risk === 'warning' || dayData.risk === 'danger') {
            // 构造类似航点的数据结构
            const warningData = {
                name: `到达后第${dayNumber}天 (${dayData.date})`,
                weather: {
                    windSpeed: dayData.windSpeed,
                    windBeaufort: this.windSpeedToBeaufort(dayData.windSpeed),
                    waveHeight: dayData.waveHeight,
                    visibility: 10000,  // 默认能见度
                    temperature: 26,  // 默认温度
                    windDirection: '东北',  // 默认风向
                    pressure: 1012  // 默认气压
                },
                risk: dayData.risk,
                workable: dayData.workable
            };
            
            // 触发警告回调
            if (this.onHighRiskWarning) {
                this.onHighRiskWarning(warningData);
            }
            
            console.log(`⚠️ 触发到达后第${dayNumber}天警告`);
        } else {
            console.log(`✓ 到达后第${dayNumber}天气象良好，无需警告`);
        }
        
        this.currentArrivalDay++;
        
        // 继续下一天（间隔3秒）
        const interval = 3000 / this.animationSpeed;  // 根据动画速度调整
        this.arrivalDemoTimer = setTimeout(() => {
            this.showNextArrivalDay();
        }, interval);
    }
    
    /**
     * 停止到达后演示
     */
    stopArrivalDemo() {
        if (this.arrivalDemoTimer) {
            clearTimeout(this.arrivalDemoTimer);
            this.arrivalDemoTimer = null;
        }
        
        this.isArrivalDemoPlaying = false;
        this.currentArrivalDay = 0;
        
        console.log('⏹️ 停止到达后气象演示');
    }
    
    /**
     * 暂停到达后演示
     */
    pauseArrivalDemo() {
        if (this.arrivalDemoTimer) {
            clearTimeout(this.arrivalDemoTimer);
            this.arrivalDemoTimer = null;
        }
        
        console.log('⏸️ 暂停到达后气象演示');
    }
    
    /**
     * 继续到达后演示
     */
    resumeArrivalDemo() {
        if (!this.isArrivalDemoPlaying) {
            console.log('⚠️ 到达后演示未启动');
            return;
        }
        
        console.log('▶️ 继续到达后气象演示');
        this.showNextArrivalDay();
    }
}
