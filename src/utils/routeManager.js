import * as Cesium from 'cesium';
import { ROUTE_CONFIG } from '../constants.js';
import { MARITIME_SILK_ROAD_PORTS } from '../data/maritimeSilkRoadPorts.js';

/**
 * 海上丝绸之路航线管理器
 * Maritime Silk Road Route Manager for Cesium
 * 
 * 负责加载、筛选和渲染海上丝绸之路的主要航线数据。
 * 支持航线的显示/隐藏、高亮显示以及与港口标记的联动交互。
 * 
 * @class RouteManager
 * @example
 * const routeManager = new RouteManager(viewer);
 * await routeManager.loadAndFilterRoutes();
 * routeManager.show();
 */
export class RouteManager {
    /**
     * 创建航线管理器实例
     * 
     * @param {Cesium.Viewer} viewer - Cesium 三维地球视图对象，用于渲染航线实体
     * @throws {Error} 如果 viewer 参数无效
     * 
     * @property {Cesium.Viewer} viewer - Cesium 视图对象引用
     * @property {Array<Cesium.Entity>} routeEntities - 存储所有已渲染的航线实体对象
     * @property {Array<Cesium.Entity>} highlightedEntities - 存储当前高亮显示的航线实体对象
     * @property {boolean} isVisible - 航线的当前显示状态（true: 显示, false: 隐藏）
     * @property {Array<Object>} allRoutes - 存储筛选后的航线数据，每个对象包含 feature、coordinates、region、nearbyPorts 等属性
     */
    constructor(viewer) {
        this.viewer = viewer;
        this.routeEntities = [];
        this.highlightedEntities = [];
        this.isVisible = false;
        this.allRoutes = [];
    }

    /**
     * 加载 GeoJSON 航线数据文件
     * 
     * 使用 fetch API 从服务器加载 Shipping_Lanes_v1.geojson 文件。
     * 实现了完整的错误处理机制，包括网络错误和 JSON 解析错误。
     * 
     * @private
     * @async
     * @returns {Promise<Object>} 解析后的 GeoJSON 数据对象
     * @throws {Error} 当网络请求失败或 JSON 解析失败时抛出错误
     * 
     * @example
     * try {
     *   const data = await this._loadGeoJSON();
     *   console.log('✅ 航线数据加载成功');
     * } catch (error) {
     *   console.error('❌ 航线数据加载失败:', error);
     * }
     */
    async _loadGeoJSON() {
        try {
            console.log('📡 开始加载航线数据: /src/data/Shipping_Lanes_v1.geojson');
            
            // 使用 fetch API 加载 GeoJSON 文件
            const response = await fetch('/src/data/Shipping_Lanes_v1.geojson');
            
            // 检查 HTTP 响应状态
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // 解析 JSON 数据
            const data = await response.json();
            
            // 验证 GeoJSON 格式
            if (!data.features || !Array.isArray(data.features)) {
                throw new Error('Invalid GeoJSON format: missing features array');
            }
            
            console.log(`✅ 航线数据加载成功，共 ${data.features.length} 条航线`);
            return data;
            
        } catch (error) {
            // 区分网络错误和 JSON 解析错误
            if (error instanceof SyntaxError) {
                console.error('❌ 航线数据 JSON 解析失败:', error.message);
                throw new Error('航线数据格式错误，无法解析 JSON');
            } else if (error.message.includes('HTTP error')) {
                console.error('❌ 航线数据加载失败 - 网络错误:', error.message);
                throw new Error(`航线数据加载失败: ${error.message}`);
            } else if (error.message.includes('fetch')) {
                console.error('❌ 航线数据加载失败 - 网络连接错误:', error.message);
                throw new Error('网络连接失败，无法加载航线数据');
            } else {
                console.error('❌ 航线数据加载失败:', error.message);
                throw error;
            }
        }
    }

    /**
     * 判断航线是否在指定地理区域内
     * 
     * 检查航线坐标数组中是否有任何点位于指定的地理区域边界内。
     * 只要有一个点在区域内，就认为该航线经过该区域。
     * 
     * @private
     * @param {Array<Array<number>>} coordinates - 航线坐标数组 [[lng, lat], ...]
     * @param {Object} region - 地理区域边界对象
     * @param {number} region.minLng - 最小经度
     * @param {number} region.maxLng - 最大经度
     * @param {number} region.minLat - 最小纬度
     * @param {number} region.maxLat - 最大纬度
     * @returns {boolean} 如果航线在区域内返回 true，否则返回 false
     * 
     * @example
     * const region = { minLng: 100, maxLng: 130, minLat: 15, maxLat: 40 };
     * const coordinates = [[120, 30], [125, 35]];
     * const isInRegion = this._isRouteInRegion(coordinates, region); // true
     */
    _isRouteInRegion(coordinates, region) {
        return coordinates.some(([lng, lat]) => {
            return lng >= region.minLng && lng <= region.maxLng &&
                   lat >= region.minLat && lat <= region.maxLat;
        });
    }

    /**
     * 计算两点之间的简化距离
     * 
     * 使用简化的欧几里得距离公式计算两个地理坐标点之间的距离。
     * 对于小距离（< 5度）的计算，这种简化方法的精度足够。
     * 
     * @private
     * @param {number} lng1 - 点1的经度
     * @param {number} lat1 - 点1的纬度
     * @param {number} lng2 - 点2的经度
     * @param {number} lat2 - 点2的纬度
     * @returns {number} 两点之间的距离（度）
     * 
     * @example
     * const distance = this._calculateDistance(120, 30, 121, 31);
     * console.log(distance); // 约 1.414
     */
    _calculateDistance(lng1, lat1, lng2, lat2) {
        const dlng = lng2 - lng1;
        const dlat = lat2 - lat1;
        return Math.sqrt(dlng * dlng + dlat * dlat);
    }

    /**
     * 判断航线是否经过港口附近
     * 
     * 检查航线上是否有任何点在指定港口的阈值距离内。
     * 使用简化的欧几里得距离进行判断。
     * 
     * @private
     * @param {Array<Array<number>>} coordinates - 航线坐标数组 [[lng, lat], ...]
     * @param {Object} port - 港口对象
     * @param {Array<number>} port.coordinates - 港口坐标 [lng, lat]
     * @param {number} threshold - 距离阈值（度）
     * @returns {boolean} 如果航线经过港口附近返回 true，否则返回 false
     * 
     * @example
     * const port = { coordinates: [118.5833, 24.9139] };
     * const coordinates = [[118, 25], [119, 25]];
     * const isNear = this._isRouteNearPort(coordinates, port, 2.0); // true
     */
    _isRouteNearPort(coordinates, port, threshold) {
        const [portLng, portLat] = port.coordinates;
        
        return coordinates.some(([lng, lat]) => {
            const distance = this._calculateDistance(lng, lat, portLng, portLat);
            return distance <= threshold;
        });
    }

    /**
     * 查找航线附近的所有港口
     * 
     * 遍历所有海上丝绸之路主要港口，找出在航线附近的港口。
     * 使用 ROUTE_CONFIG.portProximityThreshold 作为判定阈值。
     * 
     * @private
     * @param {Array<Array<number>>} coordinates - 航线坐标数组 [[lng, lat], ...]
     * @returns {Array<string>} 附近港口的 ID 数组
     * 
     * @example
     * const coordinates = [[118, 25], [119, 25]];
     * const nearbyPorts = this._findNearbyPorts(coordinates);
     * console.log(nearbyPorts); // ['quanzhou', 'xiamen']
     */
    _findNearbyPorts(coordinates) {
        const nearbyPorts = [];
        const threshold = ROUTE_CONFIG.portProximityThreshold;
        
        MARITIME_SILK_ROAD_PORTS.forEach(port => {
            if (this._isRouteNearPort(coordinates, port, threshold)) {
                nearbyPorts.push(port.id);
            }
        });
        
        return nearbyPorts;
    }

    /**
     * 处理单条线段，判断是否为海上丝绸之路航线
     * 
     * @private
     * @param {Object} feature - GeoJSON feature
     * @param {Array<Array<number>>} coordinates - 线段坐标数组
     * @param {Object} regions - 地理区域配置
     * @returns {Object|null} 如果是海上丝绸之路航线返回航线数据对象，否则返回 null
     */
    _processLineString(feature, coordinates, regions) {
        // 检查是否在任何海上丝绸之路区域内
        let matchedRegion = null;
        for (const regionName in regions) {
            if (this._isRouteInRegion(coordinates, regions[regionName])) {
                matchedRegion = regionName;
                break;
            }
        }
        
        // 查找附近的港口
        const nearbyPorts = this._findNearbyPorts(coordinates);
        
        // 如果在区域内或经过港口附近，则认为是海上丝绸之路航线
        if (matchedRegion || nearbyPorts.length > 0) {
            return {
                feature: feature,
                coordinates: coordinates,
                region: matchedRegion,
                nearbyPorts: nearbyPorts
            };
        }
        
        return null;
    }

    /**
     * 筛选海上丝绸之路相关航线
     * 
     * 从 GeoJSON features 数组中筛选出符合海上丝绸之路条件的航线。
     * 筛选条件：(1) 航线位于海上丝绸之路地理区域内，或 (2) 航线经过主要港口附近。
     * 支持 MultiLineString 和 LineString 两种几何类型。
     * 
     * @private
     * @param {Array<Object>} features - GeoJSON features 数组
     * @returns {Array<Object>} 筛选后的航线数据数组，每个对象包含：
     *   - feature: 原始 GeoJSON feature
     *   - coordinates: 航线坐标数组
     *   - region: 所属区域名称（如果在区域内）
     *   - nearbyPorts: 附近港口 ID 数组
     * 
     * @example
     * const data = await this._loadGeoJSON();
     * const filtered = this._filterMaritimeSilkRoadRoutes(data.features);
     * console.log(`筛选出 ${filtered.length} 条相关航线`);
     */
    _filterMaritimeSilkRoadRoutes(features) {
        const filteredRoutes = [];
        
        console.log('🔍 开始筛选海上丝绸之路相关航线...');
        
        features.forEach((feature, index) => {
            try {
                const geometry = feature.geometry;
                
                if (geometry.type === 'MultiLineString') {
                    // MultiLineString 包含多条线段
                    geometry.coordinates.forEach((lineString) => {
                        const routeData = this._processLineString(feature, lineString, ROUTE_CONFIG.regions);
                        if (routeData) {
                            filteredRoutes.push(routeData);
                        }
                    });
                } else if (geometry.type === 'LineString') {
                    // LineString 只有一条线段
                    const routeData = this._processLineString(feature, geometry.coordinates, ROUTE_CONFIG.regions);
                    if (routeData) {
                        filteredRoutes.push(routeData);
                    }
                }
            } catch (error) {
                console.error(`❌ 处理航线 ${index} 时出错:`, error.message);
                // 继续处理下一条航线
            }
        });
        
        console.log(`✅ 筛选完成，共找到 ${filteredRoutes.length} 条海上丝绸之路相关航线`);
        return filteredRoutes;
    }

    /**
     * 加载并筛选海上丝绸之路航线
     * 
     * 这是一个公共方法，整合了数据加载和筛选的完整流程。
     * 应该在初始化时调用一次，将筛选后的航线数据存储在 allRoutes 中。
     * 
     * @public
     * @async
     * @returns {Promise<void>}
     * @throws {Error} 如果数据加载或筛选失败
     * 
     * @example
     * const routeManager = new RouteManager(viewer);
     * await routeManager.loadAndFilterRoutes();
     * console.log(`已加载 ${routeManager.allRoutes.length} 条航线`);
     */
    async loadAndFilterRoutes() {
        try {
            console.log('🚀 开始加载和筛选航线数据...');
            console.time('航线数据加载和筛选');
            
            // 加载 GeoJSON 数据
            const data = await this._loadGeoJSON();
            
            // 筛选海上丝绸之路相关航线
            this.allRoutes = this._filterMaritimeSilkRoadRoutes(data.features);
            
            console.timeEnd('航线数据加载和筛选');
            console.log(`✅ 航线数据加载和筛选完成，共 ${this.allRoutes.length} 条航线`);
            
        } catch (error) {
            console.error('❌ 航线数据加载和筛选失败:', error);
            throw error;
        }
    }

    /**
     * 创建 Cesium 航线实体
     * 
     * 将坐标数组转换为 Cesium.Cartesian3 位置数组，并创建带有发光效果的航线实体。
     * 使用 PolylineGlowMaterialProperty 实现发光效果，并配置贴地显示。
     * 
     * @private
     * @param {Array<Array<number>>} coordinates - 航线坐标数组 [[lng, lat], ...]
     * @param {string} color - 航线颜色（CSS 颜色字符串，如 '#FFD700'）
     * @param {number} width - 航线宽度（像素）
     * @param {number} glowPower - 发光效果强度（0.0 - 1.0）
     * @returns {Cesium.Entity} 创建的航线实体对象
     * 
     * @example
     * const coordinates = [[120, 30], [125, 35], [130, 40]];
     * const entity = this._createRouteEntity(coordinates, '#FFD700', 3, 0.2);
     */
    _createRouteEntity(coordinates, color, width, glowPower) {
        // 将坐标转换为 Cesium.Cartesian3 数组
        const positions = coordinates.map(([lng, lat]) => 
            Cesium.Cartesian3.fromDegrees(lng, lat)
        );
        
        // 创建实体
        const entity = this.viewer.entities.add({
            polyline: {
                positions: positions,
                width: width,
                material: new Cesium.PolylineGlowMaterialProperty({
                    glowPower: glowPower,
                    color: Cesium.Color.fromCssColorString(color)
                }),
                clampToGround: true,
                classificationType: Cesium.ClassificationType.BOTH
            }
        });
        
        return entity;
    }

    /**
     * 渲染单条航线
     * 
     * 根据航线数据和高亮状态，创建并配置航线实体。
     * 使用 ROUTE_CONFIG 获取颜色、宽度和发光效果参数。
     * 
     * @private
     * @param {Object} routeData - 航线数据对象
     * @param {Object} routeData.feature - GeoJSON feature
     * @param {Array<Array<number>>} routeData.coordinates - 航线坐标数组
     * @param {string} routeData.region - 所属区域
     * @param {Array<string>} routeData.nearbyPorts - 附近港口 ID 数组
     * @param {boolean} isHighlighted - 是否高亮显示
     * @returns {Cesium.Entity} 创建的航线实体对象
     * 
     * @example
     * const routeData = {
     *   feature: { id: 0 },
     *   coordinates: [[120, 30], [125, 35]],
     *   region: 'china',
     *   nearbyPorts: ['quanzhou']
     * };
     * const entity = this._renderRoute(routeData, false);
     */
    _renderRoute(routeData, isHighlighted = false) {
        const { coordinates, feature, nearbyPorts } = routeData;
        
        // 选择颜色和宽度
        const color = isHighlighted ? ROUTE_CONFIG.colors.highlighted : ROUTE_CONFIG.colors.normal;
        const width = isHighlighted ? ROUTE_CONFIG.width.highlighted : ROUTE_CONFIG.width.normal;
        const glowPower = isHighlighted ? ROUTE_CONFIG.glowPower.highlighted : ROUTE_CONFIG.glowPower.normal;
        
        // 创建航线实体
        const entity = this._createRouteEntity(coordinates, color, width, glowPower);
        
        // 设置实体属性
        entity.properties = {
            type: 'maritime_silk_road_route',
            routeId: feature.id,
            isHighlighted: isHighlighted,
            nearbyPorts: nearbyPorts
        };
        
        return entity;
    }

    /**
     * 显示所有筛选后的航线
     * 
     * 遍历 allRoutes 数组，为每条航线调用 _renderRoute() 方法进行渲染。
     * 实现了错误处理机制，单条航线渲染失败不影响其他航线。
     * 
     * @public
     * @returns {void}
     * 
     * @example
     * routeManager.show();
     * console.log(`显示了 ${routeManager.routeEntities.length} 条航线`);
     */
    show() {
        // 检查是否已经显示
        if (this.isVisible) {
            console.log('ℹ️ 航线已经在显示状态');
            return;
        }
        
        console.log('🎨 开始渲染航线...');
        console.time('航线渲染');
        
        let successCount = 0;
        let errorCount = 0;
        
        // 遍历所有航线并渲染
        this.allRoutes.forEach((routeData, index) => {
            try {
                const entity = this._renderRoute(routeData, false);
                this.routeEntities.push(entity);
                successCount++;
            } catch (error) {
                console.error(`❌ 航线 ${index} 渲染失败:`, error.message);
                errorCount++;
                // 继续处理下一条航线，不中断整个渲染过程
            }
        });
        
        // 设置显示状态
        this.isVisible = true;
        
        console.timeEnd('航线渲染');
        console.log(`✅ 航线渲染完成: 成功 ${successCount} 条, 失败 ${errorCount} 条`);
    }

    /**
     * 隐藏所有航线
     * 
     * 从 Cesium Viewer 中移除所有航线实体，清空 routeEntities 数组。
     * 
     * @public
     * @returns {void}
     * 
     * @example
     * routeManager.hide();
     * console.log('航线已隐藏');
     */
    hide() {
        console.log('🔒 隐藏航线...');
        
        // 从 viewer 中移除所有航线实体
        this.routeEntities.forEach(entity => {
            this.viewer.entities.remove(entity);
        });
        
        // 清空数组
        this.routeEntities = [];
        
        // 设置显示状态
        this.isVisible = false;
        
        console.log('✅ 航线已隐藏');
    }

    /**
     * 切换航线显示状态
     * 
     * 根据当前显示状态调用 show() 或 hide() 方法。
     * 
     * @public
     * @returns {void}
     * 
     * @example
     * routeManager.toggle(); // 如果当前显示，则隐藏；如果当前隐藏，则显示
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    /**
     * 高亮显示连接指定港口的航线
     *
     * 根据港口 ID 查找所有经过该港口附近的航线，并以高亮样式重新渲染。
     * 高亮航线使用不同的颜色（红色）和更宽的线条，以便与普通航线区分。
     *
     * 工作流程：
     * 1. 清除之前的高亮状态
     * 2. 在 allRoutes 中查找 nearbyPorts 包含指定 portId 的航线
     * 3. 使用高亮样式（isHighlighted=true）渲染这些航线
     * 4. 将高亮实体存储在 highlightedEntities 数组中
     * 5. 输出日志记录高亮的航线数量
     *
     * @public
     * @param {string} portId - 港口的唯一标识符（如 'quanzhou', 'xiamen' 等）
     * @returns {void}
     *
     * @example
     * // 高亮泉州港相关的航线
     * routeManager.highlightRoutesForPort('quanzhou');
     *
     * @example
     * // 处理没有相关航线的情况
     * routeManager.highlightRoutesForPort('unknown_port');
     * // 输出: ℹ️ 港口 unknown_port 没有相关航线
     */
    highlightRoutesForPort(portId) {
        console.log(`🔆 高亮港口 ${portId} 的相关航线`);

        // 清除之前的高亮
        this.clearHighlight();

        // 查找相关航线
        const relatedRoutes = this.allRoutes.filter(route =>
            route.nearbyPorts.includes(portId)
        );

        if (relatedRoutes.length === 0) {
            console.log(`ℹ️ 港口 ${portId} 没有相关航线`);
            return;
        }

        // 渲染高亮航线
        relatedRoutes.forEach(route => {
            try {
                const entity = this._renderRoute(route, true);
                this.highlightedEntities.push(entity);
            } catch (error) {
                console.error(`❌ 高亮航线渲染失败:`, error.message);
                // 继续处理下一条航线
            }
        });

        console.log(`✅ 已高亮 ${this.highlightedEntities.length} 条相关航线`);
    }

    /**
     * 清除所有高亮航线
     *
     * 从 Cesium Viewer 中移除所有高亮显示的航线实体，并清空 highlightedEntities 数组。
     * 此方法是幂等的，多次调用不会产生副作用。
     *
     * 使用场景：
     * - 用户点击新的港口时，清除之前的高亮
     * - 用户取消选择港口时，恢复正常显示
     * - 在 highlightRoutesForPort() 方法开始时自动调用
     *
     * @public
     * @returns {void}
     *
     * @example
     * // 清除当前的高亮航线
     * routeManager.clearHighlight();
     *
     * @example
     * // 多次调用是安全的
     * routeManager.clearHighlight();
     * routeManager.clearHighlight(); // 不会产生错误
     */
    clearHighlight() {
        if (this.highlightedEntities.length === 0) {
            return;
        }

        console.log('🔆 清除航线高亮');

        // 从 viewer 中移除所有高亮实体
        this.highlightedEntities.forEach(entity => {
            this.viewer.entities.remove(entity);
        });

        // 清空高亮实体数组
        this.highlightedEntities = [];

        console.log('✅ 航线高亮已清除');
    }

}
