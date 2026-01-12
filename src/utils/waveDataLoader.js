/**
 * 波浪数据加载工具
 * 从 Java 后端 API 加载波浪数据（二进制格式，性能优化版）
 */

// API 基础URL - 使用相对路径,通过Vite代理转发
const API_BASE_URL = '/api/weather';

/**
 * 从全球波浪数据加载并转换为 WindLayer 兼容格式（二进制版本）
 * @param {number} timeIndex - 时间索引 (0-64)，默认为 0
 * @returns {Promise<Object>} WindLayer 兼容的数据对象
 */
export async function loadGlobalWaveData(timeIndex = 0) {
    try {
        console.log('🌊 开始加载全球波浪数据（二进制格式）...');
        console.log('   - 时间索引:', timeIndex);
        console.log('   - API地址:', `${API_BASE_URL}/data/wave/${timeIndex}/binary`);
        
        const startTime = performance.now();
        
        // 从后端API加载二进制数据
        const response = await fetch(`${API_BASE_URL}/data/wave/${timeIndex}/binary`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const downloadTime = performance.now() - startTime;
        
        console.log(`   - 下载完成: ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)}MB, 耗时: ${downloadTime.toFixed(0)}ms`);
        
        // 解析二进制数据
        const parseStartTime = performance.now();
        const waveData = parseBinaryWaveData(arrayBuffer);
        const parseTime = performance.now() - parseStartTime;
        
        console.log('✅ 波浪数据加载完成');
        console.log('   - 网格:', waveData.width, 'x', waveData.height);
        console.log('   - U范围:', waveData.u.min.toFixed(3), '~', waveData.u.max.toFixed(3), 'm/s');
        console.log('   - V范围:', waveData.v.min.toFixed(3), '~', waveData.v.max.toFixed(3), 'm/s');
        if (waveData.hs) {
            console.log('   - 波高范围:', waveData.hs.min.toFixed(3), '~', waveData.hs.max.toFixed(3), 'm');
        }
        console.log('   - 边界:', waveData.bounds);
        console.log(`   - 解析耗时: ${parseTime.toFixed(0)}ms`);
        console.log(`   - 总耗时: ${(downloadTime + parseTime).toFixed(0)}ms`);
        
        return waveData;
        
    } catch (error) {
        console.error('❌ 加载全球波浪数据失败:', error);
        throw error;
    }
}

/**
 * 解析二进制波浪数据
 * 数据格式：[4字节: header长度] + [header JSON] + [padding对齐] + [U数据] + [V数据] + [波高数据]
 * 
 * @param {ArrayBuffer} arrayBuffer - 二进制数据
 * @returns {Object} 波浪数据对象
 */
function parseBinaryWaveData(arrayBuffer) {
    console.log('🔍 开始解析二进制波浪数据...');
    console.log('   - 总大小:', arrayBuffer.byteLength, '字节');
    
    // 1. 读取header长度（前4字节，big-endian）
    const headerLengthView = new DataView(arrayBuffer, 0, 4);
    const headerLength = headerLengthView.getInt32(0, false); // false = big-endian
    console.log('   - Header长度:', headerLength, '字节');
    
    // 2. 读取header（JSON）
    const headerBytes = new Uint8Array(arrayBuffer, 4, headerLength);
    const headerText = new TextDecoder('utf-8').decode(headerBytes);
    const header = JSON.parse(headerText);
    console.log('   - Header内容:', header);
    
    // 3. 计算padding和数据偏移量
    const totalHeaderSize = 4 + headerLength;
    const padding = (4 - (totalHeaderSize % 4)) % 4;
    const dataStartOffset = totalHeaderSize + padding;
    const dataLength = header.width * header.height;
    
    console.log('   - 总Header大小:', totalHeaderSize);
    console.log('   - Padding:', padding, '字节');
    console.log('   - 数据起始偏移:', dataStartOffset, '(是4的倍数:', dataStartOffset % 4 === 0, ')');
    console.log('   - 数据点数量:', dataLength);
    console.log('   - 预期U数据大小:', dataLength * 4, '字节');
    console.log('   - 预期V数据大小:', dataLength * 4, '字节');
    console.log('   - 预期波高数据大小:', dataLength * 4, '字节');
    console.log('   - 预期总大小:', dataStartOffset + dataLength * 4 * 3, '字节');
    
    // 4. 读取U数据（Float32Array，little-endian）
    const uDataOffset = dataStartOffset;
    console.log('   - 尝试读取U数据: offset=', uDataOffset, ', length=', dataLength);
    const uData = new Float32Array(arrayBuffer, uDataOffset, dataLength);
    
    // 5. 读取V数据（Float32Array，little-endian）
    const vDataOffset = uDataOffset + dataLength * 4; // 4 bytes per float32
    console.log('   - 尝试读取V数据: offset=', vDataOffset, ', length=', dataLength);
    const vData = new Float32Array(arrayBuffer, vDataOffset, dataLength);
    
    // 6. 读取波高数据（如果有）
    let hsData = null;
    if (header.hsMin !== undefined && header.hsMax !== undefined) {
        const hsDataOffset = vDataOffset + dataLength * 4;
        console.log('   - 尝试读取波高数据: offset=', hsDataOffset, ', length=', dataLength);
        hsData = new Float32Array(arrayBuffer, hsDataOffset, dataLength);
    }
    
    console.log('✅ 解析成功!');
    
    // 7. 返回WindLayer格式
    const result = {
        u: {
            array: uData,
            min: header.uMin,
            max: header.uMax
        },
        v: {
            array: vData,
            min: header.vMin,
            max: header.vMax
        },
        width: header.width,
        height: header.height,
        bounds: header.bounds
    };
    
    // 添加波高数据（如果有）
    if (hsData) {
        result.hs = {
            array: hsData,
            min: header.hsMin,
            max: header.hsMax
        };
    }
    
    return result;
}

/**
 * 加载波浪元数据（兼容旧代码）
 * @returns {Promise<Object>} 元数据对象
 */
export async function loadWaveMeta() {
    try {
        console.log('📋 开始加载波浪元数据...');
        const response = await fetch(`${API_BASE_URL}/metadata/wave`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || '加载元数据失败');
        }
        
        const meta = result.data;
        console.log('✅ 波浪元数据加载成功:', meta);
        return meta;
    } catch (error) {
        console.error('❌ 加载波浪元数据失败:', error);
        throw error;
    }
}

/**
 * 生成示例波浪数据（用于测试）
 * @returns {Object} WindLayer 兼容的数据对象
 */
export function generateSampleWaveData() {
    const rows = 180;
    const cols = 360;
    const totalSize = rows * cols;
    const uData = new Float32Array(totalSize);
    const vData = new Float32Array(totalSize);
    
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const index = i * cols + j;
            const lat = -90 + (i / rows) * 180;
            const lon = -180 + (j / cols) * 360;
            
            // 模拟全球波浪模式
            // 波高随纬度变化（中纬度波浪较大）
            const latFactor = Math.abs(Math.sin(lat * Math.PI / 180));
            const waveHeight = 1.0 + latFactor * 3.0 + Math.random() * 0.5;
            
            uData[index] = waveHeight;
            vData[index] = (Math.random() - 0.5) * 0.3;
        }
    }
    
    return {
        u: {
            array: uData,
            min: 1.0,
            max: 4.5
        },
        v: {
            array: vData,
            min: -0.15,
            max: 0.15
        },
        width: cols,
        height: rows,
        bounds: {
            west: -180,
            south: -90,
            east: 180,
            north: 90
        }
    };
}
