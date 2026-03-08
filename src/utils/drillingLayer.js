/**
 * 大洋钻探图层管理器
 * 负责加载和管理大洋钻探钻孔数据
 */

import * as Cesium from 'cesium';
import { CoreRepositoryLoader } from './coreRepositoryLoader.js';

export class DrillingLayer {
    constructor(viewer) {
        this.viewer = viewer;
        this.dataSource = null;
        this.isVisible = false;
        this.coreRepositoryLoader = new CoreRepositoryLoader(viewer); // 岩芯库加载器
        this.activeFilters = {
            drillingSites: [],  // 选中的钻孔站位
            platforms: [],      // 选中的依托平台
            coreRepositories: [], // 选中的岩芯库
            management: []      // 选中的管理框架
        };
        
        // SSJD字段与钻孔站位ID的映射
        this.ssjdMapping = {
            'dsdp': 'DSDP',
            'odp': 'ODP',
            'iodp1': 'IODP(1)',
            'iodp2': 'IODP(2)'
        };
        
        // ZTPT字段与依托平台ID的映射
        this.platformMapping = {
            'challenger': '挑战者号',
            'resolution': '决心号',
            'chikyu': '地球号',
            'msp': '特殊任务平台',  // 注意：数据中是"特殊任务平台"
            'mengxiang': '梦想号'
        };
        
        // 钻孔站位颜色配置
        this.colors = {
            'DSDP': Cesium.Color.fromCssColorString('#FF6B6B'),      // 红色
            'ODP': Cesium.Color.fromCssColorString('#4ECDC4'),       // 青色
            'IODP(1)': Cesium.Color.fromCssColorString('#FFD93D'),   // 黄色
            'IODP(2)': Cesium.Color.fromCssColorString('#95E1D3')    // 绿色
        };
    }

    /**
     * 加载钻孔数据
     */
    async load() {
        try {
            console.log('🔄 开始加载大洋钻探数据...');
            
            // 加载 GeoJSON 数据，不使用默认的 marker 样式
            this.dataSource = await Cesium.GeoJsonDataSource.load('/data/ZuanKong.geojson', {
                stroke: Cesium.Color.TRANSPARENT,  // 不显示边框
                fill: Cesium.Color.TRANSPARENT,    // 不显示填充
                strokeWidth: 0,
                markerSize: 1,  // 最小尺寸
                markerColor: Cesium.Color.TRANSPARENT,  // 透明，不显示默认图标
                clampToGround: false
            });

            // 添加到 viewer
            await this.viewer.dataSources.add(this.dataSource);

            // 自定义每个钻孔点的样式
            const entities = this.dataSource.entities.values;
            console.log(`✅ 加载了 ${entities.length} 个钻孔点`);

            entities.forEach(entity => {
                if (entity.position) {
                    const properties = entity.properties;
                    const ssjd = properties.SSJD?.getValue();
                    
                    // 移除默认的 billboard 图标
                    entity.billboard = undefined;
                    
                    // 根据SSJD字段设置不同的颜色
                    let color = Cesium.Color.fromCssColorString('#FFA500'); // 默认橙色
                    if (ssjd && this.colors[ssjd]) {
                        color = this.colors[ssjd];
                    }
                    
                    // 设置简单的点样式
                    entity.point = new Cesium.PointGraphics({
                        pixelSize: 4,  // 稍微大一点
                        color: color.withAlpha(0.9),
                        outlineColor: Cesium.Color.WHITE,
                        outlineWidth: 1,
                        heightReference: Cesium.HeightReference.NONE,
                        disableDepthTestDistance: Number.POSITIVE_INFINITY
                    });

                    // 移除标签，保持简洁
                    entity.label = undefined;

                    // 添加自定义属性，用于识别
                    entity.properties.addProperty('type', 'drilling_hole');
                    
                    // 默认显示所有钻孔点
                    entity.show = true;
                }
            });

            // 默认隐藏
            this.dataSource.show = false;
            this.isVisible = false;

            console.log('✅ 大洋钻探图层加载完成');
            return true;
        } catch (error) {
            console.error('❌ 加载大洋钻探数据失败:', error);
            return false;
        }
    }

    /**
     * 显示钻孔图层
     */
    show() {
        if (this.dataSource) {
            this.dataSource.show = true;
            this.isVisible = true;
            console.log('✅ 显示大洋钻探图层');
        }
    }

    /**
     * 隐藏钻孔图层
     */
    hide() {
        if (this.dataSource) {
            this.dataSource.show = false;
            this.isVisible = false;
            console.log('✅ 隐藏大洋钻探图层');
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
     * 更新筛选条件
     * @param {Object} filters - 筛选条件
     */
    updateFilters(filters) {
        if (!this.dataSource) {
            console.warn('⚠️ 数据源未加载，无法更新筛选');
            return;
        }

        this.activeFilters = filters;
        console.log('🔍 更新钻孔筛选条件:', filters);

        const entities = this.dataSource.entities.values;
        const { drillingSites, platforms, coreRepositories } = filters;

        // 处理岩芯库筛选
        this.updateCoreRepositories(coreRepositories || []);

        // 如果没有选中任何筛选条件，显示所有
        const hasDrillingSitesFilter = drillingSites && drillingSites.length > 0;
        const hasPlatformsFilter = platforms && platforms.length > 0;
        
        if (!hasDrillingSitesFilter && !hasPlatformsFilter) {
            entities.forEach(entity => {
                if (entity.properties && entity.properties.type?.getValue() === 'drilling_hole') {
                    entity.show = true;
                }
            });
            console.log('✅ 显示所有钻孔点');
            return;
        }

        // 将选中的ID转换为实际字段值
        const selectedSSJDs = hasDrillingSitesFilter 
            ? drillingSites.map(id => this.ssjdMapping[id]).filter(Boolean)
            : null;
        
        const selectedPlatforms = hasPlatformsFilter
            ? platforms.map(id => this.platformMapping[id]).filter(Boolean)
            : null;
        
        console.log('📍 选中的SSJD值:', selectedSSJDs);
        console.log('🚢 选中的平台:', selectedPlatforms);

        // 根据筛选条件显示/隐藏钻孔点
        let visibleCount = 0;
        entities.forEach(entity => {
            if (entity.properties && entity.properties.type?.getValue() === 'drilling_hole') {
                const ssjd = entity.properties.SSJD?.getValue();
                const ztpt = entity.properties.ZTPT?.getValue();
                
                // 判断是否满足钻孔站位筛选条件
                const matchesDrillingSite = !hasDrillingSitesFilter || selectedSSJDs.includes(ssjd);
                
                // 判断是否满足平台筛选条件
                const matchesPlatform = !hasPlatformsFilter || selectedPlatforms.includes(ztpt);
                
                // 同时满足所有筛选条件才显示（AND逻辑）
                const shouldShow = matchesDrillingSite && matchesPlatform;
                
                entity.show = shouldShow;
                if (shouldShow) visibleCount++;
            }
        });

        console.log(`✅ 筛选完成，显示 ${visibleCount} 个钻孔点`);
    }

    /**
     * 更新岩芯库显示
     * @param {Array} selectedRepositories - 选中的岩芯库ID列表
     */
    updateCoreRepositories(selectedRepositories) {
        console.log('🗄️ 更新岩芯库显示:', selectedRepositories);

        // 岩芯库颜色配置
        const repositoryColors = {
            'usa': '#22C55E',      // 绿色
            'germany': '#3B82F6',  // 蓝色
            'japan': '#EAB308',    // 黄色
            'china': '#EF4444'     // 红色
        };

        // 所有可能的岩芯库ID
        const allRepositories = ['usa', 'germany', 'japan', 'china'];

        // 隐藏未选中的岩芯库
        allRepositories.forEach(repoId => {
            if (!selectedRepositories.includes(repoId)) {
                this.coreRepositoryLoader.hideCoreRepository(repoId);
            }
        });

        // 显示选中的岩芯库
        selectedRepositories.forEach(repoId => {
            const color = repositoryColors[repoId] || '#22C55E';
            this.coreRepositoryLoader.loadCoreRepository(repoId, color);
        });
    }

    /**
     * 飞行到钻孔区域（全球视角）
     */
    flyToAll() {
        if (this.dataSource && this.dataSource.entities.values.length > 0) {
            this.viewer.flyTo(this.dataSource, {
                duration: 2,
                offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-90), 15000000)
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
        // 清理岩芯库数据
        if (this.coreRepositoryLoader) {
            this.coreRepositoryLoader.clearAll();
        }
    }
}
