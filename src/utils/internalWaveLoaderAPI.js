/**
 * 内波数据加载工具（API版本）
 * 从后端API加载内波数据
 */

import { API_BASE_URL, REQUEST_TIMEOUT } from '../api/config.js';

/**
 * 获取内波元数据
 * @returns {Promise<Object>} 元数据
 */
export async function fetchInternalWaveMetadata() {
    try {
        const url = `${API_BASE_URL}/api/weather/metadata/internal_wave`;
        console.log('📡 请求内波元数据:', url);
        
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
        
        console.log('✅ 内波元数据加载成功:', data);
        
        return data;
    } catch (error) {
        console.error('❌ 加载内波元数据失败:', error);
        throw error;
    }
}

/**
 * 获取内波数据（二进制格式）
 * @param {number} timeIndex - 时间索引
 * @returns {Promise<ArrayBuffer>} 内波二进制数据
 */
export async function fetchInternalWaveDataBinary(timeIndex) {
    try {
        const url = `${API_BASE_URL}/api/weather/data/internal_wave/${timeIndex}/binary`;
        console.log('📡 请求内波数据（二进制）:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            signal: AbortSignal.timeout(REQUEST_TIMEOUT * 3) // 内波数据较大，延长超时时间
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        
        console.log('✅ 内波二进制数据加载成功:', {
            size: arrayBuffer.byteLength,
            sizeMB: (arrayBuffer.byteLength / 1024 / 1024).toFixed(2) + ' MB'
        });
        
        return arrayBuffer;
    } catch (error) {
        console.error('❌ 加载内波二进制数据失败:', error);
        throw error;
    }
}

/**
 * 加载内波元数据（从API）
 * @returns {Promise<Object>} 元数据对象
 */
export async function loadInternalWaveMeta() {
    try {
        console.log('📋 开始加载内波元数据（从API）...');
        const metadata = await fetchInternalWaveMetadata();
        
        // 转换为前端需要的格式
        const meta = {
            source: metadata.dataSource,
            units: {
                u: 'm/s',
                v: 'm/s'
            },
            grid: {
                lat_size: metadata.grid.latSize,
                lon_size: metadata.grid.lonSize,
                lat_min: metadata.grid.latMin,
                lat_max: metadata.grid.latMax,
                lon_min: metadata.grid.lonMin,
                lon_max: metadata.grid.lonMax,
                lat_step: metadata.grid.latStep,
                lon_step: metadata.grid.lonStep
            },
            times: [], // 将在加载数据时填充
            frames: metadata.frames,
            note: metadata.note
        };
        
        console.log('✅ 内波元数据加载成功（API）:', meta);
        return meta;
    } catch (error) {
        console.error('❌ 加载内波元数据失败（API）:', error);
        throw error;
    }
}

/**
 * 从后端API加载全球内波数据（二进制传输）
 * @param {number} timeIndex - 时间索引，默认为 0
 * @returns {Promise<Object>} WindLayer 兼容的数据对象
 */
export async function loadGlobalInternalWaveData(timeIndex = 0) {
    try {
        console.log('🌊 开始加载全球内波数据（二进制传输）...');
        console.log('   - 时间索引:', timeIndex);
        console.log('⏳ 内波数据较大，使用二进制传输，预计需要3-5秒...');
        
        // 1. 加载元数据
        const meta = await loadInternalWaveMeta();
        const { grid } = meta;
        const { lon_size, lat_size, lon_min, lat_min, lon_max, lat_max } = grid;
        
        // 2. 验证时间索引
        if (timeIndex < 0 || timeIndex >= meta.frames) {
            console.warn(`⚠️  时间索引 ${timeIndex} 超出范围，使用默认值 0`);
            timeIndex = 0;
        }
        
        console.log('📊 内波数据网格信息:', {
            经度范围: `${lon_min}° 到 ${lon_max}° (0-360坐标系)`,
            纬度范围: `${lat_min}° 到 ${lat_max}°`,
            网格尺寸: `${lon_size} × ${lat_size}`,
            总数据点: lon_size * lat_size,
            时间帧: `${timeIndex}/${meta.frames - 1}`
        });
        
        // 3. 从API加载数据（二进制格式）
        console.log('📦 使用二进制传输加载内波数据...');
        const arrayBuffer = await fetchInternalWaveDataBinary(timeIndex);
        
        // 4. 解析二进制数据
        const view = new DataView(arrayBuffer);
        
        // 读取 header 长度
        const headerLength = view.getInt32(0, false);
        
        // 读取 header JSON
        const headerBytes = new Uint8Array(arrayBuffer, 4, headerLength);
        const headerText = new TextDecoder().decode(headerBytes);
        const header = JSON.parse(headerText);
        
        // 计算 padding
        const totalHeaderSize = 4 + headerLength;
        const padding = (4 - (totalHeaderSize % 4)) % 4;
        const dataOffset = totalHeaderSize + padding;
        
        // 读取 U 和 V 数据
        const dataSize = header.width * header.height;
        const uOffset = dataOffset;
        const vOffset = uOffset + dataSize * 4;
        
        const uArray = new Float32Array(arrayBuffer, uOffset, dataSize);
        const vArray = new Float32Array(arrayBuffer, vOffset, dataSize);
        
        console.log('✅ 二进制数据解析完成:', {
            headerLength,
            padding,
            dataOffset,
            dataSize,
            totalSize: arrayBuffer.byteLength
        });
        
        // 4. 重新排列数据：将 0-360° 转换为 -180 到 180°
        console.log('🔄 重新排列经度数据 (0-360° → -180-180°)...');
        
        const halfLon = Math.floor(lon_size / 2);
        const uData = new Float32Array(uArray.length);
        const vData = new Float32Array(vArray.length);
        
        for (let lat = 0; lat < lat_size; lat++) {
            for (let lon = 0; lon < lon_size; lon++) {
                const oldIdx = lat * lon_size + lon;
                let newLon;
                
                if (lon < halfLon) {
                    newLon = lon + halfLon;
                } else {
                    newLon = lon - halfLon;
                }
                
                const newIdx = lat * lon_size + newLon;
                uData[newIdx] = uArray[oldIdx];
                vData[newIdx] = vArray[oldIdx];
            }
        }
        
        console.log('✅ 经度数据重新排列完成');
        
        // 5. 分析数据并应用放大倍数
        console.log('📈 分析内波数据并应用放大倍数...');
        
        const LAND_THRESHOLD = 0.0005; // 陆地过滤阈值
        const AMPLIFICATION_FACTOR = 5000; // 放大倍数
        
        console.log('📊 陆地过滤阈值:', LAND_THRESHOLD.toFixed(6), 'm/s');
        
        let uMin = Infinity, uMax = -Infinity;
        let vMin = Infinity, vMax = -Infinity;
        let validCount = 0;
        let landCount = 0;
        
        for (let i = 0; i < uData.length; i++) {
            const u = uData[i];
            const v = vData[i];
            const speed = Math.sqrt(u * u + v * v);
            
            if (speed < LAND_THRESHOLD) {
                uData[i] = 0;
                vData[i] = 0;
                landCount++;
            } else {
                uData[i] = u * AMPLIFICATION_FACTOR;
                vData[i] = v * AMPLIFICATION_FACTOR;
                
                uMin = Math.min(uMin, uData[i]);
                uMax = Math.max(uMax, uData[i]);
                vMin = Math.min(vMin, vData[i]);
                vMax = Math.max(vMax, vData[i]);
                validCount++;
            }
        }
        
        if (uMin === Infinity) uMin = 0;
        if (uMax === -Infinity) uMax = 0;
        if (vMin === Infinity) vMin = 0;
        if (vMax === -Infinity) vMax = 0;
        
        console.log('📈 内波数据统计:', {
            有效数据点: validCount,
            无效数据点: 0,
            陆地数据点: landCount,
            放大倍数: AMPLIFICATION_FACTOR,
            U范围: `${uMin.toFixed(2)} ~ ${uMax.toFixed(2)} m/s (放大后)`,
            V范围: `${vMin.toFixed(2)} ~ ${vMax.toFixed(2)} m/s (放大后)`
        });
        
        // 6. 构造返回数据
        const internalWaveData = {
            u: {
                array: uData,
                min: uMin,
                max: uMax
            },
            v: {
                array: vData,
                min: vMin,
                max: vMax
            },
            width: lon_size,
            height: lat_size,
            bounds: {
                west: -180,
                south: lat_min,
                east: 180,
                north: lat_max
            }
        };
        
        console.log('✅ 内波数据加载完成（二进制传输）');
        console.log('   - 网格:', lon_size, 'x', lat_size);
        console.log('   - U范围:', uMin.toFixed(2), '~', uMax.toFixed(2), 'm/s');
        console.log('   - V范围:', vMin.toFixed(2), '~', vMax.toFixed(2), 'm/s');
        console.log('   - 边界:', internalWaveData.bounds);
        console.log('   - 坐标系: 已从 0-360° 重新排列为 -180 到 180°');
        
        return internalWaveData;
        
    } catch (error) {
        console.error('❌ 加载内波数据失败（API）:', error);
        throw error;
    }
}
