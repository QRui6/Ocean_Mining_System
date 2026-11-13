/**
 * 波浪数据加载工具（API版本）
 * 从后端API加载波浪数据
 */

import { 
    fetchWeatherMetadata, 
    fetchWeatherDataBinary
} from '../api/weather.js';

/**
 * 加载波浪元数据（从API）
 * @returns {Promise<Object>} 元数据对象
 */
export async function loadWaveMeta() {
    try {
        console.log('📋 开始加载波浪元数据（从API）...');
        const metadata = await fetchWeatherMetadata('wave');
        
        // 转换为前端需要的格式
        const meta = {
            grid: {
                lon_size: metadata.grid.lonSize,
                lat_size: metadata.grid.latSize,
                lon_min: metadata.grid.lonMin,
                lat_min: metadata.grid.latMin,
                lon_max: metadata.grid.lonMax,
                lat_max: metadata.grid.latMax,
                lon_step: metadata.grid.lonStep,
                lat_step: metadata.grid.latStep
            },
            frames: metadata.frames,
            time_step_hours: metadata.timeStepHours,
            start_time: metadata.startTime
        };
        
        console.log('✅ 波浪元数据加载成功（API）:', meta);
        return meta;
    } catch (error) {
        console.error('❌ 加载波浪元数据失败（API）:', error);
        throw error;
    }
}

/**
 * 解析二进制波浪数据
 * @param {ArrayBuffer} arrayBuffer - 二进制数据
 * @param {Object} meta - 元数据
 * @returns {Object} 解析后的数据
 */
function parseBinaryWaveData(arrayBuffer, meta) {
    const view = new DataView(arrayBuffer);
    
    // 1. 读取 header 长度（前4字节，big-endian）
    const headerLength = view.getInt32(0, false);
    
    // 2. 读取 header JSON
    const headerBytes = new Uint8Array(arrayBuffer, 4, headerLength);
    const headerText = new TextDecoder().decode(headerBytes);
    const header = JSON.parse(headerText);
    
    // 3. 计算 padding
    const totalHeaderSize = 4 + headerLength;
    const padding = (4 - (totalHeaderSize % 4)) % 4;
    const dataOffset = totalHeaderSize + padding;
    
    // 4. 读取 U、V 和波高数据
    const dataSize = header.width * header.height;
    const uOffset = dataOffset;
    const vOffset = uOffset + dataSize * 4;
    const hsOffset = vOffset + dataSize * 4;
    
    const u = new Float32Array(arrayBuffer, uOffset, dataSize);
    const v = new Float32Array(arrayBuffer, vOffset, dataSize);
    
    // 波高数据（可选）
    let waveHeight = null;
    if (header.hsMin !== undefined && header.hsMax !== undefined) {
        waveHeight = new Float32Array(arrayBuffer, hsOffset, dataSize);
    }
    
    console.log('✅ 二进制波浪数据解析完成:', {
        headerLength,
        padding,
        dataOffset,
        dataSize,
        hasWaveHeight: waveHeight !== null,
        totalSize: arrayBuffer.byteLength
    });
    
    // 处理无效值（-9999.0）
    console.log('🗺️ 处理波浪数据无效值...');
    const MISSING = -9999.0;
    const WAVE_HEIGHT_THRESHOLD = 0.01; // 波高阈值（米）
    
    let landCount = 0;
    let filteredCount = 0;
    let uMin = Infinity, uMax = -Infinity;
    let vMin = Infinity, vMax = -Infinity;
    let hsMin = Infinity, hsMax = -Infinity;
    
    for (let i = 0; i < dataSize; i++) {
        const uVal = u[i];
        const vVal = v[i];
        
        // 标记陆地和无效数据
        if (uVal === MISSING || vVal === MISSING || uVal < -1000 || vVal < -1000) {
            u[i] = 0;
            v[i] = 0;
            if (waveHeight) waveHeight[i] = 0;
            landCount++;
            continue;
        }
        
        // 过滤极小值
        const speed = Math.sqrt(uVal * uVal + vVal * vVal);
        if (speed < WAVE_HEIGHT_THRESHOLD) {
            u[i] = 0;
            v[i] = 0;
            if (waveHeight) waveHeight[i] = 0;
            filteredCount++;
            continue;
        }
        
        // 统计有效数据范围
        uMin = Math.min(uMin, uVal);
        uMax = Math.max(uMax, uVal);
        vMin = Math.min(vMin, vVal);
        vMax = Math.max(vMax, vVal);
        
        if (waveHeight && waveHeight[i] > -1000) {
            hsMin = Math.min(hsMin, waveHeight[i]);
            hsMax = Math.max(hsMax, waveHeight[i]);
        }
    }
    
    // 确保范围有效
    if (uMin === Infinity) uMin = 0;
    if (uMax === -Infinity) uMax = 0;
    if (vMin === Infinity) vMin = 0;
    if (vMax === -Infinity) vMax = 0;
    if (hsMin === Infinity) hsMin = 0;
    if (hsMax === -Infinity) hsMax = 0;
    
    console.log('📊 波浪数据过滤统计:', {
        总数据点: dataSize,
        陆地点数: landCount,
        过滤点数: filteredCount,
        有效点数: dataSize - landCount - filteredCount,
        有效占比: `${((dataSize - landCount - filteredCount) / dataSize * 100).toFixed(1)}%`
    });
    
    const result = {
        u: { array: u, min: uMin, max: uMax },
        v: { array: v, min: vMin, max: vMax },
        width: header.width,
        height: header.height,
        bounds: header.bounds
    };
    
    if (waveHeight) {
        result.waveHeight = { array: waveHeight, min: hsMin, max: hsMax };
    }
    
    return result;
}

/**
 * 从后端API加载全球波浪数据（二进制传输）
 * @param {number} timeIndex - 时间索引，默认为 0
 * @returns {Promise<Object>} WindLayer 兼容的数据对象
 */
export async function loadGlobalWaveData(timeIndex = 0) {
    try {
        console.log('🌊 开始加载全球波浪数据（从API）...');
        console.log('   - 时间索引:', timeIndex);
        
        // 1. 加载元数据
        const meta = await loadWaveMeta();
        const { grid } = meta;
        const { lon_size, lat_size, lon_min, lat_min, lon_max, lat_max } = grid;
        
        // 2. 验证时间索引
        if (timeIndex >= meta.frames) {
            console.warn(`⚠️  时间索引 ${timeIndex} 超出范围，使用最后一帧 ${meta.frames - 1}`);
            timeIndex = meta.frames - 1;
        }
        
        console.log('📊 波浪数据网格信息:', {
            经度范围: `${lon_min}° 到 ${lon_max}°`,
            纬度范围: `${lat_min}° 到 ${lat_max}°`,
            网格尺寸: `${lon_size} × ${lat_size}`,
            总数据点: lon_size * lat_size,
            时间帧: `${timeIndex}/${meta.frames - 1}`
        });
        
        // 3. 从API加载数据（二进制格式）
        console.log('📦 使用二进制传输加载波浪数据...');
        const arrayBuffer = await fetchWeatherDataBinary('wave', timeIndex);
        
        // 4. 解析二进制数据
        const waveData = parseBinaryWaveData(arrayBuffer, meta);
        
        // 5. 数据统计
        console.log('📈 波浪数据统计:', {
            波高范围: waveData.waveHeight 
                ? `${waveData.waveHeight.min.toFixed(2)} ~ ${waveData.waveHeight.max.toFixed(2)} m`
                : 'N/A',
            U分量范围: `${waveData.u.min.toFixed(3)} ~ ${waveData.u.max.toFixed(3)} m/s`,
            V分量范围: `${waveData.v.min.toFixed(3)} ~ ${waveData.v.max.toFixed(3)} m/s`,
            数据点数: waveData.u.array.length
        });
        
        console.log('✅ 波浪数据转换完成（二进制传输）');
        console.log('   - 网格:', `${waveData.width} x ${waveData.height}`);
        console.log('   - 波高范围:', waveData.waveHeight 
            ? `${waveData.waveHeight.min.toFixed(2)} ~ ${waveData.waveHeight.max.toFixed(2)} m`
            : 'N/A');
        console.log('   - U范围:', `${waveData.u.min.toFixed(3)} ~ ${waveData.u.max.toFixed(3)} m/s`);
        console.log('   - V范围:', `${waveData.v.min.toFixed(3)} ~ ${waveData.v.max.toFixed(3)} m/s`);
        console.log('   - 边界:', waveData.bounds);
        
        return waveData;
        
    } catch (error) {
        console.error('❌ 加载波浪数据失败（API）:', error);
        throw error;
    }
}
