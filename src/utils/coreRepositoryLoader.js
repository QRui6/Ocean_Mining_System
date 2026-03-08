/**
 * 岩芯库数据加载器
 * 用于加载和显示各国岩芯库的GeoJSON数据
 */
import * as Cesium from 'cesium';

export class CoreRepositoryLoader {
    constructor(viewer) {
        this.viewer = viewer;
        this.dataSources = new Map(); // 存储各个岩芯库的数据源
    }

    /**
     * 加载岩芯库数据
     * @param {String} countryId - 国家ID (usa, germany, japan, china)
     * @param {String} color - 显示颜色
     */
    async loadCoreRepository(countryId, color = '#22C55E') {
        try {
            // 根据国家ID确定数据文件路径
            const dataFiles = {
                'usa': '/data/YanXinKu/GCR.geojson',
                'germany': '/data/YanXinKu/BCR.json',
                'japan': '/data/YanXinKu/KCC.json',
                'china': '/data/YanXinKu/core.json'
            };

            const filePath = dataFiles[countryId];
            if (!filePath) {
                console.error('❌ 未知的岩芯库ID:', countryId);
                return;
            }

            console.log(`🗺️ 加载岩芯库数据: ${countryId} from ${filePath}`);

            // 如果已经加载过，直接显示
            if (this.dataSources.has(countryId)) {
                const dataSource = this.dataSources.get(countryId);
                dataSource.show = true;
                console.log(`✅ 岩芯库 ${countryId} 已显示`);
                return;
            }

            // 加载GeoJSON数据
            const dataSource = await Cesium.GeoJsonDataSource.load(filePath, {
                stroke: Cesium.Color.fromCssColorString(color),
                strokeWidth: 3,
                fill: Cesium.Color.fromCssColorString(color).withAlpha(0.3),
                clampToGround: true
            });

            // 设置数据源名称
            dataSource.name = `core_repository_${countryId}`;

            // 添加到viewer
            await this.viewer.dataSources.add(dataSource);

            // 保存数据源引用
            this.dataSources.set(countryId, dataSource);

            console.log(`✅ 岩芯库 ${countryId} 加载成功，实体数量: ${dataSource.entities.values.length}`);

            // 为每个实体添加属性
            dataSource.entities.values.forEach(entity => {
                entity.properties = entity.properties || {};
                entity.properties.addProperty('coreRepositoryId', countryId);
                entity.properties.addProperty('type', 'core_repository');
            });

        } catch (error) {
            console.error(`❌ 加载岩芯库 ${countryId} 失败:`, error);
        }
    }

    /**
     * 隐藏岩芯库数据
     * @param {String} countryId - 国家ID
     */
    hideCoreRepository(countryId) {
        const dataSource = this.dataSources.get(countryId);
        if (dataSource) {
            dataSource.show = false;
            console.log(`👁️‍🗨️ 岩芯库 ${countryId} 已隐藏`);
        }
    }

    /**
     * 移除岩芯库数据
     * @param {String} countryId - 国家ID
     */
    removeCoreRepository(countryId) {
        const dataSource = this.dataSources.get(countryId);
        if (dataSource) {
            this.viewer.dataSources.remove(dataSource);
            this.dataSources.delete(countryId);
            console.log(`🗑️ 岩芯库 ${countryId} 已移除`);
        }
    }

    /**
     * 清除所有岩芯库数据
     */
    clearAll() {
        this.dataSources.forEach((dataSource, countryId) => {
            this.viewer.dataSources.remove(dataSource);
        });
        this.dataSources.clear();
        console.log('🗑️ 所有岩芯库数据已清除');
    }

    /**
     * 飞到岩芯库位置
     * @param {String} countryId - 国家ID
     */
    flyToCoreRepository(countryId) {
        const dataSource = this.dataSources.get(countryId);
        if (dataSource && dataSource.entities.values.length > 0) {
            this.viewer.flyTo(dataSource.entities);
            console.log(`✈️ 飞到岩芯库 ${countryId}`);
        }
    }
}
