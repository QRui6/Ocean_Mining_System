/**
 * GeoJSON 数据加载工具
 */
import * as Cesium from 'cesium';
import { fetchMiningAreasGeoJSON } from '../api/miningAreas.js';

/**
 * 加载 GeoJSON 数据到 Cesium（从后端API）
 * @param {Cesium.Viewer} viewer - Cesium Viewer 实例
 * @param {string} url - GeoJSON 文件路径（已废弃，保留参数兼容性）
 * @param {Object} options - 样式配置选项
 * @returns {Promise<Cesium.GeoJsonDataSource>}
 */
export async function loadGeoJson(viewer, url, options = {}) {
    const {
        strokeColor = Cesium.Color.CYAN,
        fillColor = Cesium.Color.CYAN.withAlpha(0.5),
        strokeWidth = 2,
        clampToGround = false
    } = options;

    try {
        console.log('🌐 从后端API加载矿区GeoJSON数据...');
        
        // 从后端API获取GeoJSON数据
        const geojsonData = await fetchMiningAreasGeoJSON();
        
        // 使用Cesium加载GeoJSON数据
        const dataSource = await Cesium.GeoJsonDataSource.load(geojsonData, {
            stroke: strokeColor,
            fill: fillColor,
            strokeWidth: strokeWidth,
            clampToGround: clampToGround,
            // 性能优化
            markerSize: 32,
            markerSymbol: '?',
            markerColor: strokeColor
        });

        // 添加到 viewer
        await viewer.dataSources.add(dataSource);

        console.log('✅ 矿区GeoJSON数据加载到Cesium成功');
        return dataSource;
    } catch (error) {
        console.error('❌ GeoJSON 数据加载失败:', error);
        console.error('请确保后端服务正在运行: http://172.25.113.128:8082');
        throw error;
    }
}

/**
 * 根据属性值设置不同颜色
 * @param {Cesium.GeoJsonDataSource} dataSource - 数据源
 * @param {string} propertyName - 属性名称
 * @param {Function} colorFunction - 颜色映射函数
 */
export function styleByProperty(dataSource, propertyName, colorFunction) {
    const entities = dataSource.entities.values;
    
    entities.forEach(entity => {
        if (entity.polygon) {
            const properties = entity.properties;
            const value = properties[propertyName]?.getValue();
            
            if (value !== undefined) {
                const color = colorFunction(value);
                entity.polygon.material = color;
                entity.polygon.outline = true;
                entity.polygon.outlineColor = Cesium.Color.WHITE.withAlpha(0.8);
                entity.polygon.outlineWidth = 2;
            }
        }
    });
}

/**
 * 预设颜色方案
 */
export const ColorSchemes = {
    // 矿种类型颜色
    mineralType: (type) => {
        const colors = {
            '多金属结核': Cesium.Color.YELLOW.withAlpha(0.7),
            '富钴结壳': Cesium.Color.ORANGE.withAlpha(0.7),
            '多金属硫化物': Cesium.Color.RED.withAlpha(0.7),
            '稀土': Cesium.Color.PURPLE.withAlpha(0.7)
        };
        return colors[type] || Cesium.Color.CYAN.withAlpha(0.7);
    },

    // 按数值分级着色
    byValue: (value) => {
        if (value > 80) return Cesium.Color.RED.withAlpha(0.7);
        if (value > 60) return Cesium.Color.ORANGE.withAlpha(0.7);
        if (value > 40) return Cesium.Color.YELLOW.withAlpha(0.7);
        if (value > 20) return Cesium.Color.LIGHTGREEN.withAlpha(0.7);
        return Cesium.Color.GREEN.withAlpha(0.7);
    },

    // 按国家着色
    byCountry: (country) => {
        const colors = {
            '中国': Cesium.Color.RED.withAlpha(0.7),
            '日本': Cesium.Color.BLUE.withAlpha(0.7),
            '韩国': Cesium.Color.GREEN.withAlpha(0.7),
            '俄罗斯': Cesium.Color.PURPLE.withAlpha(0.7)
        };
        return colors[country] || Cesium.Color.CYAN.withAlpha(0.7);
    }
};

/**
 * 设置点击事件处理（优化版 - 提高精度）
 * @param {Cesium.Viewer} viewer - Cesium Viewer 实例
 * @param {Function} callback - 点击回调函数
 */
export function setupClickHandler(viewer, callback) {
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    
    handler.setInputAction((click) => {
        // 使用 drillPick 获取点击位置的所有对象，提高精度
        const pickedObjects = viewer.scene.drillPick(click.position, 10);
        
        if (pickedObjects && pickedObjects.length > 0) {
            // 找到第一个有效的实体
            for (let i = 0; i < pickedObjects.length; i++) {
                const pickedObject = pickedObjects[i];
                
                if (Cesium.defined(pickedObject.id) && pickedObject.id instanceof Cesium.Entity) {
                    const entity = pickedObject.id;
                    const properties = {};
                    
                    // 提取所有属性
                    if (entity.properties) {
                        const propertyNames = entity.properties.propertyNames;
                        propertyNames.forEach(name => {
                            properties[name] = entity.properties[name]?.getValue();
                        });
                    }
                    
                    callback(properties, entity);
                    break; // 找到第一个有效实体后退出
                }
            }
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return handler;
}

/**
 * 高亮选中的实体
 * @param {Cesium.Entity} entity - 实体对象
 * @param {Cesium.Color} highlightColor - 高亮颜色
 */
export function highlightEntity(entity, highlightColor = Cesium.Color.YELLOW.withAlpha(0.8)) {
    if (entity.polygon) {
        entity.polygon.material = highlightColor;
        entity.polygon.outlineColor = Cesium.Color.WHITE;
        entity.polygon.outlineWidth = 3;
    }
}
