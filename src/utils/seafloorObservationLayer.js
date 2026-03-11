import * as Cesium from 'cesium';

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
        const colorMap = {
            '美国': '#0052B4',
            '欧洲': '#003399',
            '加拿大': '#FF0000',
            '日本': '#BC002D',
            '中国': '#DE2910'
        };
        return colorMap[country] || '#9333EA'; // 默认紫色
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
     * 隐藏所有观测网
     */
    hide() {
        if (this.dataSource) {
            this.dataSource.show = false;
            this.activeCountries.clear();
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
