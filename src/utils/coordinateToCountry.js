/**
 * 根据经纬度坐标判断所属国家/地区
 * 使用简化的经纬度范围判断
 */

import * as Cesium from 'cesium';

/**
 * 根据经纬度获取国家名称
 * @param {number} lon - 经度
 * @param {number} lat - 纬度
 * @returns {string} 国家名称
 */
export function getCountryFromCoordinates(lon, lat) {
    // 处理无效坐标
    if (lon === undefined || lat === undefined || isNaN(lon) || isNaN(lat)) {
        return '未知';
    }

    // 主要国家/地区的经纬度范围（简化版）
    const countryRanges = [
        // 亚洲
        { name: '中国', lonMin: 73, lonMax: 135, latMin: 18, latMax: 54 },
        { name: '日本', lonMin: 129, lonMax: 146, latMin: 30, latMax: 46 },
        { name: '韩国', lonMin: 124, lonMax: 132, latMin: 33, latMax: 39 },
        { name: '印度', lonMin: 68, lonMax: 97, latMin: 8, latMax: 35 },
        { name: '新加坡', lonMin: 103.6, lonMax: 104.1, latMin: 1.1, latMax: 1.5 },
        { name: '泰国', lonMin: 97, lonMax: 106, latMin: 5, latMax: 21 },
        { name: '越南', lonMin: 102, lonMax: 110, latMin: 8, latMax: 24 },
        { name: '菲律宾', lonMin: 116, lonMax: 127, latMin: 4, latMax: 21 },
        { name: '印度尼西亚', lonMin: 95, lonMax: 141, latMin: -11, latMax: 6 },
        { name: '马来西亚', lonMin: 99, lonMax: 119, latMin: 0, latMax: 7 },
        
        // 欧洲
        { name: '英国', lonMin: -8, lonMax: 2, latMin: 49, latMax: 61 },
        { name: '法国', lonMin: -5, lonMax: 10, latMin: 41, latMax: 51 },
        { name: '德国', lonMin: 5, lonMax: 15, latMin: 47, latMax: 55 },
        { name: '意大利', lonMin: 6, lonMax: 19, latMin: 36, latMax: 47 },
        { name: '西班牙', lonMin: -10, lonMax: 5, latMin: 36, latMax: 44 },
        { name: '荷兰', lonMin: 3, lonMax: 8, latMin: 50, latMax: 54 },
        { name: '比利时', lonMin: 2, lonMax: 7, latMin: 49, latMax: 52 },
        { name: '瑞典', lonMin: 11, lonMax: 24, latMin: 55, latMax: 69 },
        { name: '挪威', lonMin: 4, lonMax: 31, latMin: 58, latMax: 71 },
        { name: '丹麦', lonMin: 8, lonMax: 13, latMin: 54, latMax: 58 },
        { name: '俄罗斯', lonMin: 27, lonMax: 180, latMin: 41, latMax: 82 },
        
        // 北美洲
        { name: '美国', lonMin: -125, lonMax: -66, latMin: 24, latMax: 50 },
        { name: '加拿大', lonMin: -141, lonMax: -52, latMin: 41, latMax: 84 },
        { name: '墨西哥', lonMin: -117, lonMax: -86, latMin: 14, latMax: 33 },
        
        // 南美洲
        { name: '巴西', lonMin: -74, lonMax: -34, latMin: -34, latMax: 6 },
        { name: '阿根廷', lonMin: -73, lonMax: -53, latMin: -55, latMax: -21 },
        { name: '智利', lonMin: -76, lonMax: -66, latMin: -56, latMax: -17 },
        
        // 大洋洲
        { name: '澳大利亚', lonMin: 113, lonMax: 154, latMin: -44, latMax: -10 },
        { name: '新西兰', lonMin: 166, lonMax: 179, latMin: -47, latMax: -34 },
        
        // 非洲
        { name: '南非', lonMin: 16, lonMax: 33, latMin: -35, latMax: -22 },
        { name: '埃及', lonMin: 24, lonMax: 37, latMin: 22, latMax: 32 },
        
        // 中东
        { name: '沙特阿拉伯', lonMin: 34, lonMax: 56, latMin: 16, latMax: 33 },
        { name: '阿联酋', lonMin: 51, lonMax: 57, latMin: 22, latMax: 27 },
        { name: '以色列', lonMin: 34, lonMax: 36, latMin: 29, latMax: 34 },
    ];

    // 查找匹配的国家
    for (const country of countryRanges) {
        if (lon >= country.lonMin && lon <= country.lonMax &&
            lat >= country.latMin && lat <= country.latMax) {
            return country.name;
        }
    }

    // 根据大洲判断
    if (lon >= -180 && lon <= -30 && lat >= -60 && lat <= 85) {
        return '美洲';
    } else if (lon >= -30 && lon <= 60 && lat >= -40 && lat <= 75) {
        return '欧非';
    } else if (lon >= 60 && lon <= 180 && lat >= -50 && lat <= 80) {
        return '亚太';
    }

    return '国际海域';
}

/**
 * 从 Cesium Cartesian3 坐标数组获取起点和终点的国家
 * @param {Array} positions - Cesium Cartesian3 坐标数组
 * @returns {Object} { startCountry, endCountry }
 */
export function getStartEndCountries(positions) {
    if (!positions || positions.length === 0) {
        return { startCountry: '未知', endCountry: '未知' };
    }

    // 获取起点和终点
    const startPos = positions[0];
    const endPos = positions[positions.length - 1];

    // 转换为经纬度
    const startCartographic = Cesium.Cartographic.fromCartesian(startPos);
    const endCartographic = Cesium.Cartographic.fromCartesian(endPos);

    const startLon = Cesium.Math.toDegrees(startCartographic.longitude);
    const startLat = Cesium.Math.toDegrees(startCartographic.latitude);
    const endLon = Cesium.Math.toDegrees(endCartographic.longitude);
    const endLat = Cesium.Math.toDegrees(endCartographic.latitude);

    return {
        startCountry: getCountryFromCoordinates(startLon, startLat),
        endCountry: getCountryFromCoordinates(endLon, endLat)
    };
}
