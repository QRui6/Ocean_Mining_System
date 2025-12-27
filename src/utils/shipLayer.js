/**
 * 船舶图层管理器
 * 用于在Cesium地图上显示和管理船舶实体
 */

import * as Cesium from 'cesium';

export class ShipLayer {
    constructor(viewer) {
        this.viewer = viewer;
        this.ships = new Map(); // mmsi -> entity
        this.updateInterval = null;
    }
    
    /**
     * 添加或更新船舶到地图
     * @param {Object} shipData - 船舶数据
     */
    addShip(shipData) {
        const { mmsi, lat, lng, ship_name, ship_cnname, sog, cog, ship_type, hdg } = shipData;
        
        // 如果已存在，更新位置
        if (this.ships.has(mmsi)) {
            this.updateShipPosition(mmsi, lat, lng, sog, cog, hdg);
            return this.ships.get(mmsi);
        }
        
        // 创建船舶实体
        const entity = this.viewer.entities.add({
            id: `ship_${mmsi}`,
            name: ship_cnname || ship_name || `Ship ${mmsi}`,
            position: Cesium.Cartesian3.fromDegrees(lng, lat),
            billboard: {
                image: this.getShipIcon(ship_type),
                width: 40,
                height: 40,
                rotation: Cesium.Math.toRadians((hdg !== 511 ? hdg : cog) - 90), // 航向，511表示无效
                verticalOrigin: Cesium.VerticalOrigin.CENTER,
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            },
            label: {
                text: ship_cnname || ship_name || `${mmsi}`,
                font: '14px sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                pixelOffset: new Cesium.Cartesian2(0, -30),
                showBackground: true,
                backgroundColor: Cesium.Color.fromCssColorString('rgba(0,0,0,0.7)'),
                backgroundPadding: new Cesium.Cartesian2(8, 4),
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            },
            properties: {
                mmsi: mmsi,
                ship_name: ship_name,
                ship_cnname: ship_cnname,
                sog: sog,
                cog: cog,
                hdg: hdg,
                ship_type: ship_type,
                lat: lat,
                lng: lng,
                imo: shipData.imo,
                call_sign: shipData.call_sign,
                navistat: shipData.navistat,  // 注意：API返回的是 navistat，不是 nav_status
                length: shipData.length,
                width: shipData.width,
                draught: shipData.draught,
                dest: shipData.dest,
                destcode: shipData.destcode,
                eta: shipData.eta,
                last_time: shipData.last_time,
                data_source: shipData.data_source,
                left: shipData.left,
                trail: shipData.trail,
                rot: shipData.rot
            }
        });
        
        this.ships.set(mmsi, entity);
        console.log(`🚢 添加船舶: ${ship_cnname || ship_name} (${mmsi})`);
        
        return entity;
    }
    
    /**
     * 更新船舶位置
     * @param {number} mmsi - 船舶MMSI
     * @param {number} lat - 纬度
     * @param {number} lng - 经度
     * @param {number} sog - 航速
     * @param {number} cog - 航向
     * @param {number} hdg - 船首向
     */
    updateShipPosition(mmsi, lat, lng, sog, cog, hdg) {
        const entity = this.ships.get(mmsi);
        if (entity) {
            entity.position = Cesium.Cartesian3.fromDegrees(lng, lat);
            entity.billboard.rotation = Cesium.Math.toRadians((hdg !== 511 ? hdg : cog) - 90);
            entity.properties.sog = sog;
            entity.properties.cog = cog;
            entity.properties.hdg = hdg;
        }
    }
    
    /**
     * 根据船舶类型返回图标
     * @param {number} shipType - 船舶类型代码
     * @returns {string} 图标URL或Canvas
     */
    getShipIcon(shipType) {
        // 创建一个简单的船舶图标（SVG转Canvas）
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 40;
        const ctx = canvas.getContext('2d');
        
        // 根据船舶类型选择颜色
        let color = '#00D9FF'; // 默认青色
        if (shipType >= 70 && shipType <= 79) {
            color = '#FF6B00'; // 货船 - 橙色
        } else if (shipType >= 80 && shipType <= 89) {
            color = '#FF0000'; // 油轮 - 红色
        } else if (shipType >= 60 && shipType <= 69) {
            color = '#00FF00'; // 客船 - 绿色
        }
        
        // 绘制船舶形状（简化的船形）
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(20, 5);  // 船头
        ctx.lineTo(30, 35); // 右侧
        ctx.lineTo(10, 35); // 左侧
        ctx.closePath();
        ctx.fill();
        
        // 绘制边框
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        return canvas;
    }
    
    /**
     * 飞到船舶位置
     * @param {number} mmsi - 船舶MMSI
     * @param {number} duration - 飞行时间（秒）
     */
    flyToShip(mmsi, duration = 2) {
        const entity = this.ships.get(mmsi);
        if (entity) {
            this.viewer.flyTo(entity, {
                duration: duration,
                offset: new Cesium.HeadingPitchRange(
                    0,
                    Cesium.Math.toRadians(-45), // 俯视角度
                    50000 // 距离（米）
                )
            });
            console.log(`📍 飞到船舶: ${entity.name}`);
        }
    }
    
    /**
     * 移除船舶
     * @param {number} mmsi - 船舶MMSI
     */
    removeShip(mmsi) {
        const entity = this.ships.get(mmsi);
        if (entity) {
            this.viewer.entities.remove(entity);
            this.ships.delete(mmsi);
            console.log(`🗑️ 移除船舶: ${mmsi}`);
        }
    }
    
    /**
     * 清除所有船舶
     */
    clearAll() {
        this.ships.forEach(entity => {
            this.viewer.entities.remove(entity);
        });
        this.ships.clear();
        console.log('🗑️ 清除所有船舶');
    }
    
    /**
     * 获取船舶实体
     * @param {number} mmsi - 船舶MMSI
     * @returns {Object} Cesium Entity
     */
    getShip(mmsi) {
        return this.ships.get(mmsi);
    }
    
    /**
     * 获取所有船舶
     * @returns {Map} 所有船舶实体
     */
    getAllShips() {
        return this.ships;
    }
}
