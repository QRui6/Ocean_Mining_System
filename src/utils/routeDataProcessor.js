/**
 * 航线数据处理器
 * 用于处理航线数据，添加派生属性（长度、名称、流量等级等）
 */

/**
 * 使用 Haversine 公式计算两点之间的距离（单位：公里）
 * @param {number} lat1 - 点1纬度
 * @param {number} lon1 - 点1经度
 * @param {number} lat2 - 点2纬度
 * @param {number} lon2 - 点2经度
 * @returns {number} 距离（公里）
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球半径（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * 计算航线总长度
 * @param {Array<Array<number>>} coordinates - 坐标数组 [[lng, lat], ...]
 * @returns {number} 总长度（公里）
 */
export function calculateRouteLength(coordinates) {
    if (!coordinates || coordinates.length < 2) return 0;
    
    let totalLength = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
        const [lon1, lat1] = coordinates[i];
        const [lon2, lat2] = coordinates[i + 1];
        totalLength += haversineDistance(lat1, lon1, lat2, lon2);
    }
    
    return Math.round(totalLength);
}

/**
 * 根据坐标判断航线所属区域
 * @param {Array<Array<number>>} coordinates - 坐标数组
 * @returns {string} 区域名称
 */
export function getRouteRegion(coordinates) {
    if (!coordinates || coordinates.length === 0) return '未知';
    
    // 计算中心点
    const avgLng = coordinates.reduce((sum, [lng]) => sum + lng, 0) / coordinates.length;
    const avgLat = coordinates.reduce((sum, [, lat]) => sum + lat, 0) / coordinates.length;
    
    // 根据中心点判断区域
    if (avgLng >= 100 && avgLng <= 130 && avgLat >= 15 && avgLat <= 40) {
        return '中国';
    }
    if (avgLng >= 95 && avgLng <= 125 && avgLat >= -10 && avgLat <= 25) {
        return '东南亚';
    }
    if (avgLng >= 60 && avgLng <= 100 && avgLat >= -5 && avgLat <= 30) {
        return '南亚';
    }
    if (avgLng >= 35 && avgLng <= 65 && avgLat >= 10 && avgLat <= 30) {
        return '中东';
    }
    if (avgLng >= 30 && avgLng <= 55 && avgLat >= -30 && avgLat <= 15) {
        return '非洲';
    }
    if (avgLng >= -10 && avgLng <= 40 && avgLat >= 30 && avgLat <= 60) {
        return '欧洲';
    }
    
    return '其他';
}

/**
 * 生成航线名称（基于起点和终点）
 * @param {Array<Array<number>>} coordinates - 坐标数组
 * @param {number} index - 航线索引
 * @returns {string} 航线名称
 */
export function generateRouteName(coordinates, index) {
    if (!coordinates || coordinates.length < 2) {
        return `航线 ${index + 1}`;
    }
    
    const region = getRouteRegion(coordinates);
    return `${region}航线 ${index + 1}`;
}

/**
 * 根据附近港口数量估算流量等级
 * @param {number} nearbyPortsCount - 附近港口数量
 * @returns {string} 流量等级
 */
export function estimateTrafficLevel(nearbyPortsCount) {
    if (nearbyPortsCount >= 5) return '高';
    if (nearbyPortsCount >= 3) return '中';
    if (nearbyPortsCount >= 1) return '低';
    return '极低';
}

/**
 * 处理航线数据，添加派生属性
 * @param {Array<Object>} routes - 原始航线数据（来自 RouteManager.allRoutes）
 * @returns {Array<Object>} 处理后的航线数据
 */
export function processRouteData(routes) {
    return routes.map((route, index) => {
        const length = calculateRouteLength(route.coordinates);
        const region = route.region || getRouteRegion(route.coordinates);
        const name = generateRouteName(route.coordinates, index);
        const nearbyPortsCount = route.nearbyPorts ? route.nearbyPorts.length : 0;
        const trafficLevel = estimateTrafficLevel(nearbyPortsCount);
        
        return {
            id: route.feature?.id || index,
            name,
            length,
            region,
            nearbyPortsCount,
            trafficLevel,
            coordinates: route.coordinates,
            nearbyPorts: route.nearbyPorts || []
        };
    });
}

/**
 * 计算航线统计数据
 * @param {Array<Object>} routes - 处理后的航线数据
 * @returns {Object} 统计数据对象
 */
export function calculateRouteStatistics(routes) {
    if (!routes || routes.length === 0) {
        return {
            totalCount: 0,
            totalLength: 0,
            avgLength: 0,
            longestRoute: null,
            regionDistribution: {},
            trafficLevelDistribution: {},
            routes: []
        };
    }
    
    const totalCount = routes.length;
    const totalLength = routes.reduce((sum, route) => sum + route.length, 0);
    const avgLength = totalLength / totalCount;
    
    // 找出最长航线
    const longestRoute = routes.reduce((longest, route) => 
        route.length > (longest?.length || 0) ? route : longest
    , null);
    
    // 按区域统计
    const regionDistribution = {};
    routes.forEach(route => {
        const region = route.region;
        regionDistribution[region] = (regionDistribution[region] || 0) + 1;
    });
    
    // 按流量等级统计
    const trafficLevelDistribution = {};
    routes.forEach(route => {
        const level = route.trafficLevel;
        trafficLevelDistribution[level] = (trafficLevelDistribution[level] || 0) + 1;
    });
    
    return {
        totalCount,
        totalLength,
        avgLength,
        longestRoute,
        regionDistribution,
        trafficLevelDistribution,
        routes: routes.slice(0, 20) // 只保留前20条用于图表显示
    };
}
