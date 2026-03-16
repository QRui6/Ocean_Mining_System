import * as Cesium from 'cesium';
import { SEAFLOOR_OBSERVATION_COLORS } from '../constants.js';

/**
 * 海底观测网图层管理器
 */
export class SeafloorObservationLayer {
    constructor(viewer) {
        this.viewer = viewer;
        this.dataSource = null;
        this.observationData = [];
        this.activeCountries = new Set(); // 当前激活的国家
    }

    /**
     * 加载海底观测网数据
     */
    async load() {
        try {
            console.log('🔬 开始加载海底观测网数据...');
            
            // 创建数据源
            this.dataSource = new Cesium.CustomDataSource('seafloor-observation');
            await this.viewer.dataSources.add(this.dataSource);
            
            // 加载 GeoJSON 数据
            const response = await fetch('/src/data/GCW.geojson');
            const geojson = await response.json();
            
            console.log(`📍 加载了 ${geojson.features.length} 个海底观测网点`);
            
            // 处理每个观测网点
            geojson.features.forEach((feature, index) => {
                const props = feature.properties;
                const coords = feature.geometry.coordinates;
                
                // 存储观测网数据
                const observation = {
                    id: index,
                    name: props.name,
                    country: props.country,
                    unit: props.DanWei || '未知',
                    longitude: coords[0],
                    latitude: coords[1]
                };
                this.observationData.push(observation);
                
                // 根据国家确定颜色
                const color = this.getCountryColor(props.country);
                
                // 创建点标记
                const entity = this.dataSource.entities.add({
                    id: `observation-${index}`,
                    position: Cesium.Cartesian3.fromDegrees(coords[0], coords[1]),
                    billboard: {
                        image: this.createObservationIcon(color),
                        width: 24,
                        height: 24,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                        disableDepthTestDistance: Number.POSITIVE_INFINITY
                    },
                    label: {
                        text: props.name,
                        font: '12px sans-serif',
                        fillColor: Cesium.Color.WHITE,
                        outlineColor: Cesium.Color.BLACK,
                        outlineWidth: 2,
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                        verticalOrigin: Cesium.VerticalOrigin.TOP,
                        pixelOffset: new Cesium.Cartesian2(0, 5),
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                        disableDepthTestDistance: Number.POSITIVE_INFINITY,
                        show: false // 默认不显示标签
                    },
                    properties: {
                        type: 'seafloor_observation',
                        country: props.country,
                        name: props.name,
                        unit: props.DanWei || '未知',
                        observationData: observation
                    }
                });
            });
            
            // 默认隐藏所有观测网
            this.dataSource.show = false;
            
            console.log('✅ 海底观测网数据加载完成');
            return this.dataSource.entities.values;
            
        } catch (error) {
            console.error('❌ 加载海底观测网数据失败:', error);
            throw error;
        }
    }

    /**
     * 根据国家获取颜色
     */
    getCountryColor(country) {
        return SEAFLOOR_OBSERVATION_COLORS[country] || '#9333EA'; // 默认紫色
    }

    /**
     * 创建观测网图标
     */
    createObservationIcon(color) {
        const canvas = document.createElement('canvas');
        canvas.width = 48;
        canvas.height = 48;
        const ctx = canvas.getContext('2d');
        
        // 绘制外圈光晕
        const gradient = ctx.createRadialGradient(24, 24, 0, 24, 24, 24);
        gradient.addColorStop(0, color + 'AA');
        gradient.addColorStop(0.5, color + '44');
        gradient.addColorStop(1, color + '00');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 48, 48);
        
        // 绘制主圆
        ctx.beginPath();
        ctx.arc(24, 24, 10, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 绘制内圈
        ctx.beginPath();
        ctx.arc(24, 24, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        
        // 绘制中心点
        ctx.beginPath();
        ctx.arc(24, 24, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        
        return canvas.toDataURL();
    }

    /**
     * 切换指定国家的观测网显示
     */
    toggleCountry(country, show) {
        if (!this.dataSource) return;
        
        console.log(`🔬 ${show ? '显示' : '隐藏'}${country}的海底观测网`);
        
        if (show) {
            this.activeCountries.add(country);
        } else {
            this.activeCountries.delete(country);
        }
        
        // 更新实体显示状态
        this.updateVisibility();
    }

    /**
     * 更新可见性
     */
    updateVisibility() {
        if (!this.dataSource) return;
        
        const entities = this.dataSource.entities.values;
        entities.forEach(entity => {
            const entityCountry = entity.properties.country.getValue();
            entity.show = this.activeCountries.has(entityCountry);
        });
        
        // 如果有任何国家激活，显示数据源
        this.dataSource.show = this.activeCountries.size > 0;
    }

    /**
     * 显示所有观测网
     */
    show() {
        if (this.dataSource) {
            this.dataSource.show = true;
        }
    }

    /**
     * 隐藏所有观测网（完全清除数据以释放内存）
     */
    hide() {
        if (this.dataSource) {
            console.log('🗑️ 清除海底观测网数据以释放内存...');
            // 从 viewer 中移除 dataSource
            this.viewer.dataSources.remove(this.dataSource);
            // 清空引用
            this.dataSource = null;
            this.observationData = [];
            this.activeCountries.clear();
            console.log('✅ 海底观测网数据已清除');
        }
    }

    /**
     * 获取观测网数据（用于列表和统计）
     */
    getObservationData() {
        return this.observationData;
    }

    /**
     * 定位到指定观测网
     */
    flyTo(observation) {
        if (!this.viewer || !observation) return;
        
        this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
                observation.longitude,
                observation.latitude,
                1000000 // 高度1000km
            ),
            duration: 2,
            orientation: {
                heading: Cesium.Math.toRadians(0),
                pitch: Cesium.Math.toRadians(-45),
                roll: 0
            }
        });
    }

    /**
     * 飞行到指定国家的所有观测网（总览视角）
     */
    flyToCountry(country) {
        if (!this.viewer || !country) return;
        
        // 筛选该国家的所有观测点
        const countryObservations = this.observationData.filter(obs => obs.country === country);
        
        if (countryObservations.length === 0) {
            console.warn(`⚠️ 没有找到${country}的观测网数据`);
            return;
        }
        
        console.log(`🔬 飞行到${country}的观测网，共 ${countryObservations.length} 个点`);
        
        // 如果只有一个点，直接飞到该点
        if (countryObservations.length === 1) {
            this.flyTo(countryObservations[0]);
            return;
        }
        
        // 计算边界框
        let minLng = Infinity, maxLng = -Infinity;
        let minLat = Infinity, maxLat = -Infinity;
        
        countryObservations.forEach(obs => {
            minLng = Math.min(minLng, obs.longitude);
            maxLng = Math.max(maxLng, obs.longitude);
            minLat = Math.min(minLat, obs.latitude);
            maxLat = Math.max(maxLat, obs.latitude);
        });
        
        // 计算中心点
        const centerLng = (minLng + maxLng) / 2;
        const centerLat = (minLat + maxLat) / 2;
        
        // 计算合适的高度（根据跨度）
        const lngSpan = maxLng - minLng;
        const latSpan = maxLat - minLat;
        const maxSpan = Math.max(lngSpan, latSpan);
        
        // 根据跨度计算高度，确保能看到所有点
        // 跨度越大，高度越高
        let height;
        if (maxSpan < 5) {
            height = 800000; // 小范围：800km
        } else if (maxSpan < 20) {
            height = 2000000; // 中等范围：2000km
        } else if (maxSpan < 50) {
            height = 5000000; // 大范围：5000km
        } else {
            height = 10000000; // 超大范围：10000km
        }
        
        console.log(`📍 中心点: (${centerLng.toFixed(2)}, ${centerLat.toFixed(2)}), 高度: ${(height/1000).toFixed(0)}km`);
        
        // 飞行到总览视角
        this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(centerLng, centerLat, height),
            duration: 2.5,
            orientation: {
                heading: Cesium.Math.toRadians(0),
                pitch: Cesium.Math.toRadians(-45),
                roll: 0
            }
        });
    }

    /**
     * 高亮指定观测网
     */
    highlightObservation(observationId) {
        if (!this.dataSource) return;
        
        const entities = this.dataSource.entities.values;
        entities.forEach(entity => {
            const entityId = entity.properties.observationData.getValue().id;
            if (entityId === observationId) {
                // 显示标签
                entity.label.show = true;
                // 放大图标
                entity.billboard.scale = 1.5;
            } else {
                // 隐藏其他标签
                entity.label.show = false;
                // 恢复其他图标大小
                entity.billboard.scale = 1.0;
            }
        });
    }

    /**
     * 重置高亮
     */
    resetHighlight() {
        if (!this.dataSource) return;
        
        const entities = this.dataSource.entities.values;
        entities.forEach(entity => {
            entity.label.show = false;
            entity.billboard.scale = 1.0;
        });
    }
}
