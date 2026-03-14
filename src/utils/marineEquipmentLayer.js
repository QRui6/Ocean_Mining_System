/**
 * 海洋装备图层管理器
 * 负责加载和管理全球载人深潜器数据
 */

import * as Cesium from 'cesium';
import equipmentDataJson from '../data/全球载人深潜器_补充经纬度.json';

export class MarineEquipmentLayer {
    constructor(viewer) {
        this.viewer = viewer;
        this.dataSource = null;
        this.dataLoaded = false;
        this.isVisible = false;
        this.equipmentEntities = [];
    }

    /**
     * 从规格说明中提取下潜深度（米）
     */
    extractDepth(specification) {
        if (!specification) return 0;
        
        // 匹配各种深度表达方式
        const patterns = [
            /最大下潜深度?(\d+)米/,
            /最大下潜(\d+)米/,
            /最大海试深度(\d+)米/,
            /最大深度(\d+)米/,
            /最大(\d+)米/
        ];
        
        for (const pattern of patterns) {
            const match = specification.match(pattern);
            if (match) {
                return parseInt(match[1]);
            }
        }
        
        return 0;
    }

    /**
     * 加载海洋装备数据
     */
    async loadData() {
        try {
            console.log('🚢 开始加载海洋装备数据...');
            
            // 使用导入的 JSON 数据
            const equipmentData = equipmentDataJson;
            console.log(`✅ 获取到 ${equipmentData.length} 个海洋装备数据`);
            
            // 创建数据源
            this.dataSource = new Cesium.CustomDataSource('marine_equipment');
            await this.viewer.dataSources.add(this.dataSource);
            
            // 为每个装备创建实体
            const processedData = [];
            equipmentData.forEach((equipment, index) => {
                const cityCoords = equipment.city?.coordinates;
                if (!cityCoords || !cityCoords.lat || !cityCoords.lng) {
                    console.warn(`⚠️ ${equipment.name} 缺少坐标信息`);
                    return;
                }
                
                // 提取下潜深度
                const depth = this.extractDepth(equipment.specification);
                
                // 构建图片路径 - public 目录下的文件可以直接通过 / 访问
                const imageIndex = String(index + 1).padStart(2, '0');
                const imagePath = `/data/全球载人深潜器_images/${imageIndex}_${equipment.name}.png`;
                
                // 创建点实体
                const entity = this.dataSource.entities.add({
                    position: Cesium.Cartesian3.fromDegrees(
                        cityCoords.lng,
                        cityCoords.lat
                    ),
                    point: {
                        pixelSize: 12,
                        color: Cesium.Color.fromCssColorString('#FF6B35').withAlpha(0.9),
                        outlineColor: Cesium.Color.WHITE,
                        outlineWidth: 2,
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                    },
                    label: {
                        text: equipment.name,
                        font: '14px "Noto Sans SC", sans-serif',
                        fillColor: Cesium.Color.WHITE,
                        outlineColor: Cesium.Color.BLACK,
                        outlineWidth: 2,
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        pixelOffset: new Cesium.Cartesian2(0, -15),
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                        disableDepthTestDistance: Number.POSITIVE_INFINITY
                    },
                    properties: {
                        type: 'marine_equipment',
                        name: equipment.name,
                        country: equipment.country.name_cn,
                        serviceUnit: equipment.service_unit || '未知',
                        developmentYear: equipment.development_year,
                        specification: equipment.specification,
                        depth: depth,
                        notes: equipment.notes || '',
                        imageIndex: index + 1,
                        imagePath: imagePath
                    }
                });
                
                this.equipmentEntities.push(entity);
                
                // 构建用于列表和图表的数据
                processedData.push({
                    name: equipment.name,
                    country: equipment.country.name_cn,
                    serviceUnit: equipment.service_unit || '未知',
                    year: equipment.development_year,
                    capacity: equipment.specification?.match(/载人(\d+)人/) ? 
                              equipment.specification.match(/载人(\d+)人/)[1] + '人' : 'N/A',
                    depth: depth,
                    specification: equipment.specification,
                    notes: equipment.notes || '',
                    status: '运营中',
                    image: imagePath,
                    longitude: cityCoords.lng,
                    latitude: cityCoords.lat
                });
            });
            
            // 默认隐藏
            this.dataSource.show = false;
            this.isVisible = false;
            this.dataLoaded = true;
            
            console.log('✅ 海洋装备图层加载完成，处理了', processedData.length, '条数据');
            return processedData;
        } catch (error) {
            console.error('❌ 加载海洋装备数据失败:', error);
            return [];
        }
    }

    /**
     * 显示装备图层
     */
    show() {
        if (this.dataSource) {
            this.dataSource.show = true;
            this.isVisible = true;
            console.log('✅ 显示海洋装备图层');
        }
    }

    /**
     * 隐藏装备图层
     */
    hide() {
        if (this.dataSource) {
            this.dataSource.show = false;
            this.isVisible = false;
            console.log('✅ 隐藏海洋装备图层');
        }
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
     * 获取所有装备数据（用于统计和列表展示）
     */
    getEquipmentData() {
        if (!this.dataSource) return [];
        
        const entities = this.dataSource.entities.values;
        return entities.map(entity => {
            const props = entity.properties;
            return {
                name: props.name?.getValue(),
                country: props.country?.getValue(),
                serviceUnit: props.serviceUnit?.getValue(),
                year: props.developmentYear?.getValue(),
                capacity: props.specification?.getValue()?.match(/载人(\d+)人/) ? 
                          props.specification?.getValue().match(/载人(\d+)人/)[1] + '人' : 'N/A',
                depth: props.depth?.getValue() || 0,
                specification: props.specification?.getValue(),
                notes: props.notes?.getValue(),
                status: '运营中',
                image: props.imagePath?.getValue()
            };
        });
    }

    /**
     * 飞行到装备位置
     */
    flyTo(equipment) {
        // 支持传入装备对象或装备名称
        const equipmentName = typeof equipment === 'string' ? equipment : equipment.name;
        
        const entity = this.equipmentEntities.find(e => 
            e.properties.name?.getValue() === equipmentName
        );
        
        if (entity) {
            this.viewer.flyTo(entity, {
                duration: 2,
                offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-45), 50000)
            });
        }
    }

    /**
     * 销毁图层
     */
    destroy() {
        if (this.dataSource) {
            this.viewer.dataSources.remove(this.dataSource);
            this.dataSource = null;
        }
        this.equipmentEntities = [];
        this.dataLoaded = false;
    }
}
