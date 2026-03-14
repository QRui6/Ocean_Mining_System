/**
 * 港口数据处理器
 * 用于处理港口数据，添加派生属性（区域、颜色等）
 */
import { MARITIME_SILK_ROAD_PORTS, getPortColor } from '../data/maritimeSilkRoadPorts.js';

/**
 * 根据坐标判断港口所属区域
 * @param {Array<number>} coordinates - [lng, lat]
 * @returns {string} 区域名称
 */
export function getPortRegion(coordinates) {
    const [lng, lat] = coordinates;
    
    // 中国段
    if (lng >= 100 && lng <= 130 && lat >= 15 && lat <= 40) {
        return '中国';
    }
    // 东南亚段
    if (lng >= 95 && lng <= 125 && lat >= -10 && lat <= 25) {
        return '东南亚';
    }
    // 南亚段
    if (lng >= 60 && lng <= 100 && lat >= -5 && lat <= 30) {
        return '南亚';
    }
    // 中东段
    if (lng >= 35 && lng <= 65 && lat >= 10 && lat <= 30) {
        return '中东';
    }
    // 非洲段
    if (lng >= 30 && lng <= 55 && lat >= -30 && lat <= 15) {
        return '非洲';
    }
    // 欧洲段
    if (lng >= -10 && lng <= 40 && lat >= 30 && lat <= 60) {
        return '欧洲';
    }
    
    return '其他';
}

/**
 * 获取处理后的港口数据（添加派生属性）
 * @returns {Array<Object>} 处理后的港口数据数组
 */
export function getProcessedPortData() {
    return MARITIME_SILK_ROAD_PORTS.map(port => ({
        ...port,
        region: getPortRegion(port.coordinates),
        color: getPortColor(port.importance)
    }));
}

/**
 * 计算港口统计数据
 * @param {Array<Object>} ports - 港口数据数组
 * @returns {Object} 统计数据对象
 */
export function calculatePortStatistics(ports) {
    const processedPorts = ports.map(port => ({
        ...port,
        region: port.region || getPortRegion(port.coordinates)
    }));
    
    // 按重要性统计
    const highImportanceCount = processedPorts.filter(p => p.importance === 'high').length;
    const mediumImportanceCount = processedPorts.filter(p => p.importance === 'medium').length;
    const lowImportanceCount = processedPorts.filter(p => p.importance === 'low').length;
    
    // 按类型统计
    const historicalCount = processedPorts.filter(p => p.type === 'historical').length;
    const modernCount = processedPorts.filter(p => p.type === 'modern').length;
    const strategicCount = processedPorts.filter(p => p.type === 'strategic').length;
    
    // 按区域统计
    const regionDistribution = {};
    processedPorts.forEach(port => {
        const region = port.region;
        regionDistribution[region] = (regionDistribution[region] || 0) + 1;
    });
    
    // 统计国家数量
    const countries = new Set(processedPorts.map(p => p.country));
    const countryCount = countries.size;
    
    // 统计区域数量
    const regionCount = Object.keys(regionDistribution).length;
    
    return {
        totalCount: processedPorts.length,
        highImportanceCount,
        mediumImportanceCount,
        lowImportanceCount,
        historicalCount,
        modernCount,
        strategicCount,
        regionDistribution,
        countryCount,
        regionCount,
        ports: processedPorts  // 添加完整的港口列表
    };
}
