/**
 * 洋流数据加载工具（API版本）
 * 从后端API加载洋流数据
 */

import { 
    fetchWeatherMetadata, 
    fetchWeatherDataBinary
} from '../api/weather.js';

/**
 * 加载洋流元数据（从API）
 * @returns {Promise<Object>} 元数据对象
 */
export async function loadOceanCurrentMeta() {
    try {
        console.log('📋 开始加载洋流元数据（从API）...');
        const metadata = await fetchWeatherMetadata('ocean_current');
        
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
        
        console.log('✅ 洋流元数据加载成功（API）:', meta);
        return meta;
    } catch (error) {
        console.error('❌ 加载洋流元数据失败（API）:', error);
        throw error;
    }
}

/**
 * 解析二进制气象数据
 * @param {ArrayBuffer} arrayBuffer - 二进制数据
 * @param {Object} meta - 元数据
 * @returns {Object} 解析后的数据
 */
function parseBinaryWeatherData(arrayBuffer, meta) {
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
    
    // 4. 读取 U 和 V 数据
    const dataSize = header.width * header.height;
    const uOffset = dataOffset;
    const vOffset = uOffset + dataSize * 4;
    
    const u = new Float32Array(arrayBuffer, uOffset, dataSize);
    const v = new Float32Array(arrayBuffer, vOffset, dataSize);
    
    console.log('✅ 二进制数据解析完成:', {
        headerLength,
        padding,
        dataOffset,
        dataSize,
        totalSize: arrayBuffer.byteLength
    });
    
    return {
        u: { array: u, min: header.uMin, max: header.uMax },
        v: { array: v, min: header.vMin, max: header.vMax },
        width: header.width,
        height: header.height,
        bounds: header.bounds
    };
}

/**
 * 从后端API加载全球洋流数据（二进制传输）
 * @param {number} timeIndex - 时间索引，默认为 0
 * @returns {Promise<Object>} WindLayer 兼容的数据对象
 */
export async function loadGlobalOceanCurrentData(timeIndex = 0) {
    try {
        console.log('🌊 开始加载全球洋流数据（从API）...');
        console.log('   - 时间索引:', timeIndex);
        
        // 1. 加载元数据
        const meta = await loadOceanCurrentMeta();
        const { grid } = meta;
        const { lon_size, lat_size, lon_min, lat_min, lon_max, lat_max } = grid;
        
        // 2. 验证时间索引
        if (timeIndex >= meta.frames) {
            console.warn(`⚠️  时间索引 ${timeIndex} 超出范围，使用最后一帧 ${meta.frames - 1}`);
            timeIndex = meta.frames - 1;
        }
        
        console.log('📊 洋流数据网格信息:', {
            经度范围: `${lon_min}° 到 ${lon_max}°`,
            纬度范围: `${lat_min}° 到 ${lat_max}°`,
            网格尺寸: `${lon_size} × ${lat_size}`,
            总数据点: lon_size * lat_size,
            时间帧: `${timeIndex}/${meta.frames - 1}`
        });
        
        // 3. 从API加载数据（二进制格式）
        console.log('📦 使用二进制传输加载洋流数据...');
        const arrayBuffer = await fetchWeatherDataBinary('ocean_current', timeIndex);
        
        // 4. 解析二进制数据
        let currentData = parseBinaryWeatherData(arrayBuffer, meta);
        
        // 5. 放大洋流速度（洋流速度通常很小，需要放大以便可视化）
        const amplificationFactor = 15;
        console.log(`🔧 洋流速度已放大 ${amplificationFactor} 倍`);
        
        const amplifiedU = new Float32Array(currentData.u.array.length);
        const amplifiedV = new Float32Array(currentData.v.array.length);
        
        for (let i = 0; i < currentData.u.array.length; i++) {
            amplifiedU[i] = currentData.u.array[i] * amplificationFactor;
            amplifiedV[i] = currentData.v.array[i] * amplificationFactor;
        }
        
        currentData = {
            u: {
                array: amplifiedU,
                min: currentData.u.min * amplificationFactor,
                max: currentData.u.max * amplificationFactor
            },
            v: {
                array: amplifiedV,
                min: currentData.v.min * amplificationFactor,
                max: currentData.v.max * amplificationFactor
            },
            width: currentData.width,
            height: currentData.height,
            bounds: currentData.bounds
        };
        
        // 6. 数据统计
        console.log('📈 洋流数据统计:', {
            U分量范围: `${currentData.u.min.toFixed(2)} ~ ${currentData.u.max.toFixed(2)} m/s`,
            V分量范围: `${currentData.v.min.toFixed(2)} ~ ${currentData.v.max.toFixed(2)} m/s`,
            数据点数: currentData.u.array.length
        });
        
        console.log('✅ 洋流数据加载完成（二进制传输）');
        console.log('   - 网格:', `${currentData.width} x ${currentData.height}`);
        console.log('   - U范围:', `${currentData.u.min.toFixed(2)} ~ ${currentData.u.max.toFixed(2)} m/s`);
        console.log('   - V范围:', `${currentData.v.min.toFixed(2)} ~ ${currentData.v.max.toFixed(2)} m/s`);
        console.log('   - 边界:', currentData.bounds);
        
        return currentData;
        
    } catch (error) {
        console.error('❌ 加载洋流数据失败（API）:', error);
        throw error;
    }
}
