/**
 * 港口标记管理器
 * Port Marker Manager for Cesium
 */
import * as Cesium from 'cesium';
import { MARITIME_SILK_ROAD_PORTS, getPortColor, getPortSize } from '../data/maritimeSilkRoadPorts.js';

export class PortMarkerManager {
    constructor(viewer) {
        this.viewer = viewer;
        this.portEntities = [];
        this.isVisible = false;
    }

    /**
     * 显示所有港口标记
     */
    show() {
        if (this.isVisible) return;
        
        console.log('🚢 显示海上丝绸之路主要港口...');
        
        MARITIME_SILK_ROAD_PORTS.forEach(port => {
            this.addPortMarker(port);
        });
        
        this.isVisible = true;
        console.log(`✅ 已显示 ${this.portEntities.length} 个港口标记`);
    }

    /**
     * 隐藏所有港口标记
     */
    hide() {
        if (!this.isVisible) return;
        
        console.log('🚢 隐藏港口标记...');
        
        this.portEntities.forEach(entity => {
            this.viewer.entities.remove(entity);
        });
        
        this.portEntities = [];
        this.isVisible = false;
        console.log('✅ 已隐藏所有港口标记');
    }

    /**
     * 切换显示/隐藏
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * 添加单个港口标记
     */
    addPortMarker(port) {
        const [lng, lat] = port.coordinates;
        const color = getPortColor(port.importance);
        const size = getPortSize(port.importance);
        
        // 创建港口实体
        const entity = this.viewer.entities.add({
            id: `port_${port.id}`,
            name: port.name,
            position: Cesium.Cartesian3.fromDegrees(lng, lat),
            
            // 港口图标（使用 Billboard）
            billboard: {
                image: this.createPortIcon(color, size),
                width: size,
                height: size,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                // 添加缩放效果
                scale: 1.0,
                scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.5, 8.0e6, 0.5)
            },
            
            // 港口名称标签
            label: {
                text: port.name,
                font: '14px "Noto Sans SC", sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: Cesium.VerticalOrigin.TOP,
                pixelOffset: new Cesium.Cartesian2(0, 10),
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                // 根据距离调整标签显示
                scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.3),
                translucencyByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.0)
            },
            
            // 存储港口数据（用于点击事件）
            properties: {
                type: 'port',
                portId: port.id,
                portName: port.name,
                portNameEn: port.nameEn,
                country: port.country,
                importance: port.importance,
                portType: port.type,
                description: port.description
            }
        });
        
        this.portEntities.push(entity);
    }

    /**
     * 创建港口图标（使用 Canvas 绘制）
     */
    createPortIcon(color, size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // 绘制圆形背景
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 2, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 绘制船锚图标（简化版）
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${size * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚓', size / 2, size / 2);
        
        return canvas;
    }

    /**
     * 定位到指定港口
     */
    flyToPort(portId) {
        const port = MARITIME_SILK_ROAD_PORTS.find(p => p.id === portId);
        if (!port) {
            console.warn(`港口 ${portId} 不存在`);
            return;
        }
        
        const [lng, lat] = port.coordinates;
        
        this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(lng, lat, 500000),
            duration: 2,
            orientation: {
                heading: Cesium.Math.toRadians(0),
                pitch: Cesium.Math.toRadians(-45),
                roll: 0.0
            }
        });
    }

    /**
     * 清理资源
     */
    destroy() {
        this.hide();
        this.viewer = null;
    }
}
