/**
 * 研究机构图层管理器
 * 负责加载和管理全球海洋研究机构数据
 */

import * as Cesium from 'cesium';
import institutionDataJson from '../data/全球海洋机构_补充经纬度.json';
import { RESEARCH_INSTITUTION_COLORS } from '../constants.js';

export class ResearchInstitutionLayer {
    constructor(viewer) {
        this.viewer = viewer;
        this.dataSource = null;
        this.institutionData = [];
        this.activeCountries = new Set(); // 当前激活的国家
        this.dataLoaded = false;
    }

    /**
     * 国家中文名到英文ID的映射
     */
    getCountryId(countryNameCn) {
        const countryMap = {
            '美国': 'usa',
            '英国': 'uk',
            '法国': 'france',
            '德国': 'germany',
            '加拿大': 'canada',
            '澳大利亚': 'australia',
            '俄罗斯': 'russia',
            '日本': 'japan'
        };
        return countryMap[countryNameCn] || 'unknown';
    }

    /**
     * 根据国家获取颜色（使用统一配置）
     */
    getCountryColor(countryId) {
        return RESEARCH_INSTITUTION_COLORS[countryId] || '#fb923c'; // 默认橙色
    }

    /**
     * 加载研究机构数据
     */
    async loadData() {
        try {
            console.log('🏛️ 开始加载研究机构数据...');
            
            // 使用导入的 JSON 数据
            const data = institutionDataJson;
            console.log(`✅ 获取到 ${data.length} 个国家的研究机构数据`);
            console.log('📋 原始数据:', data);
            
            // 创建数据源
            this.dataSource = new Cesium.CustomDataSource('research_institutions');
            await this.viewer.dataSources.add(this.dataSource);
            
            // 处理每个国家的机构
            let institutionIndex = 0;
            data.forEach(countryData => {
                const countryId = this.getCountryId(countryData.country_cn);
                const color = this.getCountryColor(countryId);
                
                console.log(`🌍 处理国家: ${countryData.country_cn} (${countryId}), 机构数量: ${countryData.institutions.length}`);
                
                countryData.institutions.forEach(institution => {
                    // 处理多城市机构（如法国海洋开发研究院）
                    if (Array.isArray(institution.city_coordinates)) {
                        // 为每个城市创建一个标记
                        institution.city_coordinates.forEach((cityCoord, cityIndex) => {
                            this.createInstitutionEntity(
                                institution,
                                countryData,
                                countryId,
                                color,
                                cityCoord.lat,
                                cityCoord.lng,
                                institutionIndex++,
                                cityCoord.city
                            );
                        });
                    } else if (institution.city_coordinates) {
                        // 单城市机构
                        this.createInstitutionEntity(
                            institution,
                            countryData,
                            countryId,
                            color,
                            institution.city_coordinates.lat,
                            institution.city_coordinates.lng,
                            institutionIndex++,
                            institution.city
                        );
                    } else if (institution.region_coordinates) {
                        // 使用区域坐标
                        this.createInstitutionEntity(
                            institution,
                            countryData,
                            countryId,
                            color,
                            institution.region_coordinates.lat,
                            institution.region_coordinates.lng,
                            institutionIndex++,
                            institution.region,
                            true // 标记为区域级
                        );
                    } else {
                        // 使用国家坐标
                        console.warn(`⚠️ ${institution.name} 缺少坐标，使用国家坐标`);
                        this.createInstitutionEntity(
                            institution,
                            countryData,
                            countryId,
                            color,
                            countryData.country_coordinates.lat,
                            countryData.country_coordinates.lng,
                            institutionIndex++,
                            countryData.country_cn,
                            true // 标记为国家级
                        );
                    }
                });
            });
            
            // 默认隐藏
            this.dataSource.show = false;
            this.dataLoaded = true;
            
            console.log('✅ 研究机构图层加载完成，共', this.institutionData.length, '个机构');
            console.log('📊 返回的机构数据:', this.institutionData);
            return this.institutionData;
            
        } catch (error) {
            console.error('❌ 加载研究机构数据失败:', error);
            return [];
        }
    }

    /**
     * 创建机构实体
     */
    createInstitutionEntity(institution, countryData, countryId, color, lat, lng, index, locationName, isRegional = false) {
        // 存储机构数据
        const institutionInfo = {
            id: index,
            name: institution.name,
            country: countryData.country_cn,
            countryId: countryId,
            founded: institution.founded,
            city: locationName,
            location: institution.location_raw || locationName,
            supervisingUnit: institution.supervising_unit || '未知',
            mainTasks: institution.main_tasks || '未知',
            notes: institution.notes || '',
            latitude: lat,
            longitude: lng,
            isRegional: isRegional
        };
        
        this.institutionData.push(institutionInfo);
        
        // 创建点标记
        const entity = this.dataSource.entities.add({
            id: `institution-${index}`,
            position: Cesium.Cartesian3.fromDegrees(lng, lat),
            billboard: {
                image: this.createInstitutionIcon(color, isRegional),
                width: isRegional ? 20 : 28,
                height: isRegional ? 20 : 28,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            },
            label: {
                text: institution.name,
                font: '12px "Noto Sans SC", sans-serif',
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
                type: 'research_institution',
                countryId: countryId,
                institutionData: institutionInfo
            }
        });
    }

    /**
     * 创建机构图标
     */
    createInstitutionIcon(color, isRegional = false) {
        const canvas = document.createElement('canvas');
        const size = isRegional ? 40 : 56;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const center = size / 2;
        const radius = isRegional ? 8 : 12;
        
        // 绘制外圈光晕
        const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
        gradient.addColorStop(0, color + 'AA');
        gradient.addColorStop(0.5, color + '44');
        gradient.addColorStop(1, color + '00');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        // 绘制主圆
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 绘制建筑图标
        if (!isRegional) {
            ctx.fillStyle = '#FFFFFF';
            // 绘制简化的建筑物图标
            const buildingWidth = 8;
            const buildingHeight = 10;
            const buildingX = center - buildingWidth / 2;
            const buildingY = center - buildingHeight / 2;
            
            ctx.fillRect(buildingX, buildingY, buildingWidth, buildingHeight);
            
            // 绘制窗户
            ctx.fillStyle = color;
            ctx.fillRect(buildingX + 2, buildingY + 2, 1.5, 1.5);
            ctx.fillRect(buildingX + 4.5, buildingY + 2, 1.5, 1.5);
            ctx.fillRect(buildingX + 2, buildingY + 4.5, 1.5, 1.5);
            ctx.fillRect(buildingX + 4.5, buildingY + 4.5, 1.5, 1.5);
            ctx.fillRect(buildingX + 2, buildingY + 7, 1.5, 1.5);
            ctx.fillRect(buildingX + 4.5, buildingY + 7, 1.5, 1.5);
        } else {
            // 区域级标记 - 绘制一个小点
            ctx.beginPath();
            ctx.arc(center, center, radius * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
        }
        
        return canvas.toDataURL();
    }

    /**
     * 切换指定国家的机构显示
     */
    toggleCountry(countryId, show) {
        if (!this.dataSource) return;
        
        console.log(`🏛️ ${show ? '显示' : '隐藏'}${countryId}的研究机构`);
        
        if (show) {
            this.activeCountries.add(countryId);
        } else {
            this.activeCountries.delete(countryId);
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
            const entityCountryId = entity.properties.countryId.getValue();
            entity.show = this.activeCountries.has(entityCountryId);
        });
        
        // 如果有任何国家激活，显示数据源
        this.dataSource.show = this.activeCountries.size > 0;
    }

    /**
     * 显示所有机构
     */
    show() {
        if (this.dataSource) {
            this.dataSource.show = true;
        }
    }

    /**
     * 隐藏所有机构
     */
    hide() {
        if (this.dataSource) {
            this.dataSource.show = false;
            this.activeCountries.clear();
        }
    }

    /**
     * 获取机构数据（用于列表和统计）
     */
    getInstitutionData() {
        return this.institutionData;
    }

    /**
     * 定位到指定机构
     */
    flyTo(institution) {
        if (!this.viewer || !institution) return;
        
        this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
                institution.longitude,
                institution.latitude,
                institution.isRegional ? 2000000 : 500000 // 区域级更高视角
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
     * 高亮指定机构
     */
    highlightInstitution(institutionId) {
        if (!this.dataSource) return;
        
        const entities = this.dataSource.entities.values;
        entities.forEach(entity => {
            const entityId = entity.properties.institutionData.getValue().id;
            if (entityId === institutionId) {
                entity.label.show = true;
                entity.billboard.scale = 1.5;
            } else {
                entity.label.show = false;
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

    /**
     * 销毁图层
     */
    destroy() {
        if (this.dataSource) {
            this.viewer.dataSources.remove(this.dataSource);
            this.dataSource = null;
        }
        this.institutionData = [];
        this.activeCountries.clear();
        this.dataLoaded = false;
    }
}
