/**
 * 气象数据API
 * 封装所有气象相关的API请求
 */

import { API_ENDPOINTS, REQUEST_TIMEOUT } from './config.js';

/**
 * 获取气象数据元数据
 * @param {string} type - 数据类型 (wind, ocean_current, wave)
 * @returns {Promise<Object>} 元数据
 */
export async function fetchWeatherMetadata(type) {
    try {
        const url = API_ENDPOINTS.WEATHER.METADATA(type);
        console.log('📡 请求气象元数据:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(REQUEST_TIMEOUT)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        const data = result.data || result; // 兼容不同的响应格式
        
        console.log('✅ 气象元数据加载成功:', {
            type: type,
            grid: data.grid,
            frames: data.frames
        });
        
        return data;
    } catch (error) {
        console.error(`❌ 加载${type}元数据失败:`, error);
        throw error;
    }
}

/**
 * 获取气象数据（JSON格式）
 * @param {string} type - 数据类型 (wind, ocean_current, wave)
 * @param {number} timeIndex - 时间索引
 * @returns {Promise<Object>} 气象数据
 */
export async function fetchWeatherData(type, timeIndex) {
    try {
        const url = API_ENDPOINTS.WEATHER.DATA(type, timeIndex);
        console.log('📡 请求气象数据:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(REQUEST_TIMEOUT)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        const data = result.data || result;
        
        console.log('✅ 气象数据加载成功:', {
            type: type,
            timeIndex: timeIndex,
            uLength: data.u?.array?.length || 0,
            vLength: data.v?.array?.length || 0
        });
        
        return data;
    } catch (error) {
        console.error(`❌ 加载${type}数据失败:`, error);
        throw error;
    }
}

/**
 * 获取气象数据（二进制格式，性能优化）
 * @param {string} type - 数据类型
 * @param {number} timeIndex - 时间索引
 * @returns {Promise<ArrayBuffer>} 二进制数据
 */
export async function fetchWeatherDataBinary(type, timeIndex) {
    try {
        const url = API_ENDPOINTS.WEATHER.BINARY(type, timeIndex);
        console.log('📡 请求气象数据(二进制):', url);
        
        const response = await fetch(url, {
            method: 'GET',
            signal: AbortSignal.timeout(REQUEST_TIMEOUT)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.arrayBuffer();
        
        console.log('✅ 气象数据(二进制)加载成功:', {
            type: type,
            timeIndex: timeIndex,
            size: data.byteLength
        });
        
        return data;
    } catch (error) {
        console.error(`❌ 加载${type}二进制数据失败:`, error);
        throw error;
    }
}

/**
 * 获取可用的时间索引列表
 * @param {string} type - 数据类型
 * @returns {Promise<Object>} 可用索引信息
 */
export async function fetchAvailableIndices(type) {
    try {
        const url = API_ENDPOINTS.WEATHER.AVAILABLE(type);
        console.log('📡 请求可用时间索引:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(REQUEST_TIMEOUT)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        const data = result.data || result;
        
        console.log('✅ 可用时间索引加载成功:', {
            type: type,
            indices: data.availableIndices?.length || 0
        });
        
        return data;
    } catch (error) {
        console.error(`❌ 加载${type}可用索引失败:`, error);
        throw error;
    }
}

/**
 * 点查询：获取指定坐标的气象数据
 * @param {number} lat - 纬度
 * @param {number} lon - 经度
 * @param {number} timeIndex - 时间索引（可选，默认0）
 * @returns {Promise<Object>} 点查询结果
 */
export async function fetchWeatherPointQuery(lat, lon, timeIndex = 0) {
    try {
        const url = `${API_ENDPOINTS.WEATHER.POINT_QUERY}?lat=${lat}&lon=${lon}&timeIndex=${timeIndex}`;
        console.log('📡 请求气象点查询:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(REQUEST_TIMEOUT)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        const data = result.data || result;
        
        console.log('✅ 气象点查询成功:', {
            location: { lat, lon },
            wind: data.wind,
            wave: data.wave,
            current: data.current
        });
        
        return data;
    } catch (error) {
        console.error('❌ 气象点查询失败:', error);
        throw error;
    }
}

/**
 * 转换后端数据格式为前端需要的格式
 * @param {Object} backendData - 后端返回的数据
 * @param {Object} metadata - 元数据
 * @returns {Object} 前端格式的数据
 */
export function convertWeatherDataFormat(backendData, metadata) {
    // 后端返回格式：
    // {
    //   timeIndex: 0,
    //   u: { array: [...], min: -10, max: 10 },
    //   v: { array: [...], min: -10, max: 10 },
    //   width: 1440,
    //   height: 721
    // }
    
    // 前端需要格式：
    // {
    //   u: Float32Array,
    //   v: Float32Array,
    //   width: 1440,
    //   height: 721,
    //   uMin: -10,
    //   uMax: 10,
    //   vMin: -10,
    //   vMax: 10,
    //   bounds: { ... }
    // }
    
    console.log('🔄 转换数据格式:', {
        hasU: !!backendData.u,
        hasV: !!backendData.v,
        uType: typeof backendData.u,
        vType: typeof backendData.v
    });
    
    // 提取数组数据
    const uArray = backendData.u?.array || backendData.u;
    const vArray = backendData.v?.array || backendData.v;
    
    // 验证数据
    if (!uArray || !vArray) {
        throw new Error('数据格式错误: 缺少u或v分量');
    }
    
    if (!Array.isArray(uArray) && !(uArray instanceof Float32Array)) {
        throw new Error('数据格式错误: u分量不是数组');
    }
    
    if (!Array.isArray(vArray) && !(vArray instanceof Float32Array)) {
        throw new Error('数据格式错误: v分量不是数组');
    }
    
    if (uArray.length === 0 || vArray.length === 0) {
        throw new Error('数据格式错误: 数组为空');
    }
    
    // 获取或计算最小最大值
    const uMin = backendData.u?.min ?? Math.min(...uArray);
    const uMax = backendData.u?.max ?? Math.max(...uArray);
    const vMin = backendData.v?.min ?? Math.min(...vArray);
    const vMax = backendData.v?.max ?? Math.max(...vArray);
    
    const result = {
        u: {
            array: new Float32Array(uArray),
            min: uMin,
            max: uMax
        },
        v: {
            array: new Float32Array(vArray),
            min: vMin,
            max: vMax
        },
        width: backendData.width || metadata.grid.lon_size || metadata.grid.lonSize,
        height: backendData.height || metadata.grid.lat_size || metadata.grid.latSize,
        bounds: {
            // 兼容两种命名格式
            west: (metadata.grid.lon_min ?? metadata.grid.lonMin) > 180 
                ? (metadata.grid.lon_min ?? metadata.grid.lonMin) - 360 
                : (metadata.grid.lon_min ?? metadata.grid.lonMin),
            south: metadata.grid.lat_min ?? metadata.grid.latMin,
            east: (metadata.grid.lon_max ?? metadata.grid.lonMax) > 180 
                ? (metadata.grid.lon_max ?? metadata.grid.lonMax) - 360 
                : (metadata.grid.lon_max ?? metadata.grid.lonMax),
            north: metadata.grid.lat_max ?? metadata.grid.latMax
        }
    };
    
    const lonMin = metadata.grid.lon_min ?? metadata.grid.lonMin;
    const lonMax = metadata.grid.lon_max ?? metadata.grid.lonMax;
    
    console.log('🔍 检查坐标系:', {
        lonMin: lonMin,
        lonMax: lonMax,
        needsConversion: lonMin >= 0 && lonMax > 180
    });
    
    // 如果数据是 0-360 坐标系，需要重新排列数据
    if (lonMin >= 0 && lonMax > 180) {
        console.log('🔄 检测到 0-360° 坐标系，转换为 -180-180°...');
        
        const width = result.width;
        const height = result.height;
        const halfWidth = Math.floor(width / 2);
        
        console.log('📐 转换参数:', { width, height, halfWidth });
        
        // 重新排列 U 和 V 数组
        const newU = new Float32Array(uArray.length);
        const newV = new Float32Array(vArray.length);
        
        for (let lat = 0; lat < height; lat++) {
            for (let lon = 0; lon < width; lon++) {
                const oldIdx = lat * width + lon;
                let newLon;
                
                if (lon < halfWidth) {
                    // 0-180° 移动到右半部分 (180-360°)
                    newLon = lon + halfWidth;
                } else {
                    // 180-360° 移动到左半部分 (0-180°)
                    newLon = lon - halfWidth;
                }
                
                const newIdx = lat * width + newLon;
                newU[newIdx] = result.u.array[oldIdx];
                newV[newIdx] = result.v.array[oldIdx];
            }
        }
        
        result.u.array = newU;
        result.v.array = newV;
        result.bounds.west = -180;
        result.bounds.east = 180;
        
        console.log('✅ 坐标系转换完成: -180° 到 180°');
    }
    
    console.log('✅ 数据格式转换完成:', {
        uLength: result.u.array.length,
        vLength: result.v.array.length,
        width: result.width,
        height: result.height,
        uRange: [result.u.min, result.u.max],
        vRange: [result.v.min, result.v.max],
        bounds: result.bounds
    });
    
    return result;
}

/**
 * 转换波浪数据格式
 * @param {Object} backendData - 后端返回的波浪数据
 * @param {Object} metadata - 元数据
 * @returns {Object} 前端格式的波浪数据
 */
export function convertWaveDataFormat(backendData, metadata) {
    console.log('🔄 转换波浪数据格式:', {
        hasU: !!backendData.u,
        hasV: !!backendData.v,
        hasWaveHeight: !!backendData.waveHeight
    });
    
    const uArray = backendData.u?.array || backendData.u;
    const vArray = backendData.v?.array || backendData.v;
    const waveHeightArray = backendData.waveHeight?.array || backendData.waveHeight;
    
    // 验证数据
    if (!uArray || !vArray) {
        throw new Error('波浪数据格式错误: 缺少u或v分量');
    }
    
    if (uArray.length === 0 || vArray.length === 0) {
        throw new Error('波浪数据格式错误: 数组为空');
    }
    
    const width = backendData.width || metadata.grid.lon_size || metadata.grid.lonSize;
    const height = backendData.height || metadata.grid.lat_size || metadata.grid.latSize;
    
    // 处理无效值（-9999.0）
    console.log('🗺️ 处理波浪数据无效值...');
    const MISSING = -9999.0;
    const WAVE_HEIGHT_THRESHOLD = 0.01; // 波高阈值（米）
    
    // 创建陆地标记
    const isLandMask = new Uint8Array(uArray.length);
    let landCount = 0;
    let filteredCount = 0;
    
    // 创建处理后的数组
    const processedU = new Float32Array(uArray.length);
    const processedV = new Float32Array(vArray.length);
    
    let uMin = Infinity, uMax = -Infinity;
    let vMin = Infinity, vMax = -Infinity;
    
    for (let i = 0; i < uArray.length; i++) {
        const u = uArray[i];
        const v = vArray[i];
        
        // 标记陆地和无效数据
        if (u === MISSING || v === MISSING || u < -1000 || v < -1000) {
            isLandMask[i] = 1;
            processedU[i] = 0;
            processedV[i] = 0;
            landCount++;
            continue;
        }
        
        // 过滤极小值（可能是噪声或浅海区域）
        const speed = Math.sqrt(u * u + v * v);
        if (speed < WAVE_HEIGHT_THRESHOLD) {
            processedU[i] = 0;
            processedV[i] = 0;
            filteredCount++;
            continue;
        }
        
        // 保留有效数据
        processedU[i] = u;
        processedV[i] = v;
        
        uMin = Math.min(uMin, u);
        uMax = Math.max(uMax, u);
        vMin = Math.min(vMin, v);
        vMax = Math.max(vMax, v);
    }
    
    // 确保范围有效
    if (uMin === Infinity) uMin = 0;
    if (uMax === -Infinity) uMax = 0;
    if (vMin === Infinity) vMin = 0;
    if (vMax === -Infinity) vMax = 0;
    
    console.log('📊 波浪数据过滤统计:', {
        总数据点: uArray.length,
        陆地点数: landCount,
        过滤点数: filteredCount,
        有效点数: uArray.length - landCount - filteredCount,
        有效占比: `${((uArray.length - landCount - filteredCount) / uArray.length * 100).toFixed(1)}%`
    });
    
    const result = {
        u: {
            array: processedU,
            min: uMin,
            max: uMax
        },
        v: {
            array: processedV,
            min: vMin,
            max: vMax
        },
        width: width,
        height: height,
        bounds: {
            // 兼容两种命名格式
            west: (metadata.grid.lon_min ?? metadata.grid.lonMin) > 180 
                ? (metadata.grid.lon_min ?? metadata.grid.lonMin) - 360 
                : (metadata.grid.lon_min ?? metadata.grid.lonMin),
            south: metadata.grid.lat_min ?? metadata.grid.latMin,
            east: (metadata.grid.lon_max ?? metadata.grid.lonMax) > 180 
                ? (metadata.grid.lon_max ?? metadata.grid.lonMax) - 360 
                : (metadata.grid.lon_max ?? metadata.grid.lonMax),
            north: metadata.grid.lat_max ?? metadata.grid.latMax
        },
        landMask: isLandMask // 添加陆地标记
    };
    
    // 波浪数据还包含波高
    if (waveHeightArray && waveHeightArray.length > 0) {
        result.waveHeight = {
            array: new Float32Array(waveHeightArray),
            min: backendData.waveHeight?.min ?? Math.min(...waveHeightArray.filter(h => h > -1000)),
            max: backendData.waveHeight?.max ?? Math.max(...waveHeightArray.filter(h => h > -1000))
        };
    }
    
    const lonMin = metadata.grid.lon_min ?? metadata.grid.lonMin;
    const lonMax = metadata.grid.lon_max ?? metadata.grid.lonMax;
    
    console.log('🔍 波浪数据检查坐标系:', {
        lonMin: lonMin,
        lonMax: lonMax,
        needsConversion: lonMin >= 0 && lonMax > 180
    });
    
    // 如果数据是 0-360 坐标系，需要重新排列数据
    if (lonMin >= 0 && lonMax > 180) {
        console.log('🔄 波浪数据: 检测到 0-360° 坐标系，转换为 -180-180°...');
        
        const halfWidth = Math.floor(width / 2);
        
        console.log('📐 波浪数据转换参数:', { width, height, halfWidth });
        
        // 重新排列 U、V 和波高数组
        const newU = new Float32Array(uArray.length);
        const newV = new Float32Array(vArray.length);
        const newWaveHeight = result.waveHeight ? new Float32Array(waveHeightArray.length) : null;
        const newLandMask = new Uint8Array(isLandMask.length);
        
        for (let lat = 0; lat < height; lat++) {
            for (let lon = 0; lon < width; lon++) {
                const oldIdx = lat * width + lon;
                let newLon;
                
                if (lon < halfWidth) {
                    newLon = lon + halfWidth;
                } else {
                    newLon = lon - halfWidth;
                }
                
                const newIdx = lat * width + newLon;
                newU[newIdx] = result.u.array[oldIdx];
                newV[newIdx] = result.v.array[oldIdx];
                newLandMask[newIdx] = isLandMask[oldIdx];
                if (newWaveHeight) {
                    newWaveHeight[newIdx] = result.waveHeight.array[oldIdx];
                }
            }
        }
        
        result.u.array = newU;
        result.v.array = newV;
        result.landMask = newLandMask;
        if (result.waveHeight) {
            result.waveHeight.array = newWaveHeight;
        }
        result.bounds.west = -180;
        result.bounds.east = 180;
        
        console.log('✅ 波浪数据坐标系转换完成: -180° 到 180°');
    }
    
    console.log('✅ 波浪数据格式转换完成:', {
        uLength: result.u.array.length,
        vLength: result.v.array.length,
        hasWaveHeight: !!result.waveHeight,
        width: result.width,
        height: result.height,
        bounds: result.bounds
    });
    
    return result;
}
