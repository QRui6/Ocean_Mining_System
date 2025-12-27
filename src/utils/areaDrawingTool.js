/**
 * Cesium地图区域绘制工具
 * 专业的多边形绘制功能
 */

import * as Cesium from 'cesium';

export class AreaDrawingTool {
    constructor(viewer) {
        this.viewer = viewer;
        this.handler = null;
        this.positions = [];
        this.tempPolygon = null;
        this.tempPoints = [];
        this.tempLines = null;
        this.isActive = false;
        this.callback = null;
    }

    /**
     * 开始绘制
     */
    start(callback) {
        if (this.isActive) {
            console.warn('绘制工具已激活');
            return;
        }

        this.isActive = true;
        this.callback = callback;
        this.positions = [];
        this.tempPoints = [];

        // 不禁用任何相机控制，让用户自由操作
        // this.viewer.scene.screenSpaceCameraController.enableRotate = false;

        // 创建事件处理器
        this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);

        // 左键点击添加点
        this.handler.setInputAction((click) => {
            // 修正坐标（因为界面使用了CSS缩放）
            const baseWidth = 1920;
            const baseHeight = 1080;
            const scaleX = window.innerWidth / baseWidth;
            const scaleY = window.innerHeight / baseHeight;
            
            const correctedPosition = new Cesium.Cartesian2(
                click.position.x / scaleX,
                click.position.y / scaleY
            );
            
            // 使用修正后的坐标获取地球表面坐标
            const cartesian = this.viewer.camera.pickEllipsoid(
                correctedPosition,
                this.viewer.scene.globe.ellipsoid
            );

            if (cartesian) {
                this.positions.push(cartesian);
                this.addPointMarker(cartesian);
                this.updatePolygon();
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        // 鼠标移动显示预览（降低频率）
        let lastMoveTime = 0;
        this.handler.setInputAction((movement) => {
            const now = Date.now();
            if (now - lastMoveTime < 50) return;
            lastMoveTime = now;

            if (this.positions.length > 0) {
                // 修正坐标
                const baseWidth = 1920;
                const baseHeight = 1080;
                const scaleX = window.innerWidth / baseWidth;
                const scaleY = window.innerHeight / baseHeight;
                
                const correctedPosition = new Cesium.Cartesian2(
                    movement.endPosition.x / scaleX,
                    movement.endPosition.y / scaleY
                );
                
                const cartesian = this.viewer.camera.pickEllipsoid(
                    correctedPosition,
                    this.viewer.scene.globe.ellipsoid
                );
                
                if (cartesian) {
                    this.updatePreview(cartesian);
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        // 右键完成绘制
        this.handler.setInputAction(() => {
            if (this.positions.length >= 3) {
                this.finish();
            }
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

        // 双击也可以完成
        this.handler.setInputAction(() => {
            if (this.positions.length >= 3) {
                this.finish();
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

        console.log('🖊️ 绘制工具已激活');
        console.log('💡 左键点击添加点，右键或双击完成绘制');
    }

    /**
     * 添加点标记（贴地显示）
     */
    addPointMarker(position) {
        const point = this.viewer.entities.add({
            position: position,
            point: {
                pixelSize: 10,
                color: Cesium.Color.CYAN,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            },
            label: {
                text: String(this.positions.length),
                font: '14px sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -15),
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            }
        });
        this.tempPoints.push(point);
    }

    /**
     * 更新多边形（贴地显示）
     */
    updatePolygon() {
        // 移除旧的多边形
        if (this.tempPolygon) {
            this.viewer.entities.remove(this.tempPolygon);
            this.tempPolygon = null;
        }

        if (this.tempLines) {
            this.viewer.entities.remove(this.tempLines);
            this.tempLines = null;
        }

        if (this.positions.length >= 3) {
            // 创建多边形（贴地显示）
            this.tempPolygon = this.viewer.entities.add({
                polygon: {
                    hierarchy: new Cesium.PolygonHierarchy(this.positions),
                    material: Cesium.Color.CYAN.withAlpha(0.4),
                    outline: true,
                    outlineColor: Cesium.Color.CYAN,
                    outlineWidth: 3,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                }
            });
        } else if (this.positions.length === 2) {
            // 两个点时显示线（贴地）
            this.tempLines = this.viewer.entities.add({
                polyline: {
                    positions: this.positions,
                    width: 3,
                    material: Cesium.Color.CYAN,
                    clampToGround: true
                }
            });
        }
    }

    /**
     * 更新预览（鼠标移动时）
     */
    updatePreview(position) {
        if (this.tempPolygon) {
            this.viewer.entities.remove(this.tempPolygon);
            this.tempPolygon = null;
        }

        if (this.tempLines) {
            this.viewer.entities.remove(this.tempLines);
            this.tempLines = null;
        }

        if (this.positions.length >= 2) {
            const previewPositions = [...this.positions, position];
            this.tempPolygon = this.viewer.entities.add({
                polygon: {
                    hierarchy: new Cesium.PolygonHierarchy(previewPositions),
                    material: Cesium.Color.CYAN.withAlpha(0.2),
                    outline: true,
                    outlineColor: Cesium.Color.CYAN.withAlpha(0.6),
                    outlineWidth: 2,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                }
            });
        } else if (this.positions.length === 1) {
            this.tempLines = this.viewer.entities.add({
                polyline: {
                    positions: [this.positions[0], position],
                    width: 2,
                    material: Cesium.Color.CYAN.withAlpha(0.6),
                    clampToGround: true
                }
            });
        }
    }

    /**
     * 完成绘制
     */
    finish() {
        if (this.positions.length < 3) {
            alert('至少需要3个点才能形成区域');
            return;
        }

        // 转换为经纬度数组
        const coords = this.positions.map(pos => {
            const cartographic = Cesium.Cartographic.fromCartesian(pos);
            return [
                parseFloat(Cesium.Math.toDegrees(cartographic.longitude).toFixed(6)),
                parseFloat(Cesium.Math.toDegrees(cartographic.latitude).toFixed(6))
            ];
        });

        // 清理
        this.cleanup();

        this.isActive = false;

        // 调用回调
        if (this.callback) {
            this.callback(coords);
        }

        console.log('✅ 绘制完成，共', coords.length, '个点');
    }

    /**
     * 取消绘制
     */
    cancel() {
        this.cleanup();

        this.isActive = false;
        console.log('❌ 绘制已取消');
    }

    /**
     * 清理临时图形
     */
    cleanup() {
        // 移除事件处理器
        if (this.handler) {
            this.handler.destroy();
            this.handler = null;
        }

        // 移除临时多边形
        if (this.tempPolygon) {
            this.viewer.entities.remove(this.tempPolygon);
            this.tempPolygon = null;
        }

        // 移除临时线
        if (this.tempLines) {
            this.viewer.entities.remove(this.tempLines);
            this.tempLines = null;
        }

        // 移除临时点
        this.tempPoints.forEach(point => {
            this.viewer.entities.remove(point);
        });
        this.tempPoints = [];

        this.positions = [];
    }

    /**
     * 在地图上显示区域
     */
    static showArea(viewer, area, options = {}) {
        console.log('🎨 showArea 被调用');
        console.log('区域数据:', area);
        console.log('polygon:', area.polygon);
        
        const {
            color = Cesium.Color.PURPLE,
            alpha = 0.3,
            outlineColor = Cesium.Color.PURPLE,
            outlineWidth = 3
        } = options;

        // 转换坐标
        console.log('开始转换坐标...');
        const positions = area.polygon.map((coord, index) => {
            console.log(`坐标点 ${index}:`, coord, `[${coord[0]}, ${coord[1]}]`);
            return Cesium.Cartesian3.fromDegrees(coord[0], coord[1]);
        });
        console.log('转换后的positions:', positions);

        // 创建多边形实体
        console.log('创建多边形实体...');
        const entity = viewer.entities.add({
            name: area.name,
            polygon: {
                hierarchy: new Cesium.PolygonHierarchy(positions),
                material: color.withAlpha(alpha),
                outline: true,
                outlineColor: outlineColor,
                outlineWidth: outlineWidth,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            },
            properties: new Cesium.PropertyBag({
                areaId: area.id,
                areaData: area,
                type: 'monitoring_area'
            })
        });
        console.log('多边形实体已创建:', entity);

        // 添加标签
        console.log('添加标签...');
        const center = Cesium.BoundingSphere.fromPoints(positions).center;
        console.log('中心点:', center);
        viewer.entities.add({
            position: center,
            label: {
                text: area.name,
                font: '16px sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: Cesium.VerticalOrigin.CENTER,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            },
            properties: new Cesium.PropertyBag({
                areaId: area.id,
                type: 'area_label'
            })
        });
        console.log('✅ showArea 完成');

        return entity;
    }

    /**
     * 移除区域显示
     */
    static removeArea(viewer, areaId) {
        const entities = viewer.entities.values.filter(
            entity => entity.properties?.areaId?.getValue() === areaId
        );
        entities.forEach(entity => {
            viewer.entities.remove(entity);
        });
    }

    /**
     * 飞到区域
     */
    static flyToArea(viewer, area) {
        const positions = area.polygon.map(coord => {
            return Cesium.Cartesian3.fromDegrees(coord[0], coord[1]);
        });

        const boundingSphere = Cesium.BoundingSphere.fromPoints(positions);
        
        viewer.camera.flyToBoundingSphere(boundingSphere, {
            duration: 2,
            offset: new Cesium.HeadingPitchRange(
                0,
                Cesium.Math.toRadians(-45),
                boundingSphere.radius * 3
            )
        });
    }
}

export default AreaDrawingTool;
