/**
 * 风场数据加载工具
 * 从 Java 后端 API 加载风场数据（二进制格式，性能优化版）
 */

// API 基础URL - 使用相对路径,通过Vite代理转发
const API_BASE_URL = '/api/weather';

/**
 * 从全球风场数据加载并转换为 WindLayer 兼容格式（二进制版本）
 * @param {number} timeIndex - 时间索引 (0-19)，默认为 0
 * @returns {Promise<Object>} WindLayer 兼容的数据对象
 */
export async function loadGlobalWindData(timeIndex = 0) {
    try {
        console.log('🌬️  开始加载全球风场数据（二进制格式）...');
        console.log('   - 时间索引:', timeIndex);
        console.log('   - API地址:', `${API_BASE_URL}/data/wind/${timeIndex}/binary`);
        
        const startTime = performance.now();
        
        // 从后端API加载二进制数据
        const response = await fetch(`${API_BASE_URL}/data/wind/${timeIndex}/binary`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const downloadTime = performance.now() - startTime;
        
        console.log(`   - 下载完成: ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)}MB, 耗时: ${downloadTime.toFixed(0)}ms`);
        
        // 解析二进制数据
        const parseStartTime = performance.now();
        const windData = parseBinaryWindData(arrayBuffer);
        const parseTime = performance.now() - parseStartTime;
        
        console.log('✅ 风场数据加载完成');
        console.log('   - 网格:', windData.width, 'x', windData.height);
        console.log('   - U范围:', windData.u.min.toFixed(2), '~', windData.u.max.toFixed(2), 'm/s');
        console.log('   - V范围:', windData.v.min.toFixed(2), '~', windData.v.max.toFixed(2), 'm/s');
        console.log('   - 边界:', windData.bounds);
        console.log(`   - 解析耗时: ${parseTime.toFixed(0)}ms`);
        console.log(`   - 总耗时: ${(downloadTime + parseTime).toFixed(0)}ms`);
        
        return windData;
        
    } catch (error) {
        console.error('❌ 加载全球风场数据失败:', error);
        throw error;
    }
}

/**
 * 解析二进制风场数据
 * 数据格式：[4字节: header长度] + [header JSON] + [padding对齐] + [U数据] + [V数据]
 * 
 * @param {ArrayBuffer} arrayBuffer - 二进制数据
 * @returns {Object} 风场数据对象
 */
function parseBinaryWindData(arrayBuffer) {
    console.log('🔍 开始解析二进制数据...');
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
    // 总header大小 = 4字节(长度) + headerLength + padding
    // 需要确保数据部分从4字节对齐的位置开始
    const totalHeaderSize = 4 + headerLength;
    const padding = (4 - (totalHeaderSize % 4)) % 4;
    const dataStartOffset = totalHeaderSize + padding;
    const dataLength = header.width * header.height;
    
    console.log('   - 总Header大小:', totalHeaderSize);
    console.log('   - Padding:', padding, '字节');
    console.log('   - 数据起始偏移:', dataStartOffset, '(是4的倍数:', dataStartOffset % 4 === 0, ')');
    console.log('   - 数据点数量:', dataLength);
    console.log('   - 预期U数据大小:', dataLength * 4, '字节');
    console.log('   - 预期总大小:', dataStartOffset + dataLength * 4 * 2, '字节');
    
    // 4. 读取U数据（Float32Array，little-endian）
    const uDataOffset = dataStartOffset;
    console.log('   - 尝试读取U数据: offset=', uDataOffset, ', length=', dataLength);
    const uData = new Float32Array(arrayBuffer, uDataOffset, dataLength);
    
    // 5. 读取V数据（Float32Array，little-endian）
    const vDataOffset = uDataOffset + dataLength * 4; // 4 bytes per float32
    console.log('   - 尝试读取V数据: offset=', vDataOffset, ', length=', dataLength);
    const vData = new Float32Array(arrayBuffer, vDataOffset, dataLength);
    
    console.log('✅ 解析成功!');
    
    // 6. 返回WindLayer格式
    return {
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
}

/**
 * 加载风场元数据（兼容旧代码）
 * @returns {Promise<Object>} 元数据对象
 */
export async function loadWindMeta() {
    try {
        console.log('📋 开始加载风场元数据...');
        const response = await fetch(`${API_BASE_URL}/metadata/wind`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || '加载元数据失败');
        }
        
        const meta = result.data;
        console.log('✅ 风场元数据加载成功:', meta);
        return meta;
    } catch (error) {
        console.error('❌ 加载风场元数据失败:', error);
        throw error;
    }
}

/**
 * 生成示例风场数据（备用方案）
 * @param {number} rows - 纬度网格数
 * @param {number} cols - 经度网格数
 * @returns {Object} 风场数据对象
 */
export function generateSampleWindData(rows = 180, cols = 360) {
    console.log('🔧 生成示例风场数据...');
    
    const totalSize = rows * cols;
    const uData = new Float32Array(totalSize);
    const vData = new Float32Array(totalSize);
    
    // 生成简单的风场模式
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const idx = i * cols + j;
            const lat = 90 - (i / (rows - 1)) * 180; // -90 to 90
            const lon = (j / (cols - 1)) * 360 - 180; // -180 to 180
            
            // 简单的风场模式：西风带和信风
            const latRad = lat * Math.PI / 180;
            uData[idx] = Math.cos(latRad * 3) * 10; // 东西向风速
            vData[idx] = Math.sin(lon * Math.PI / 180) * 5; // 南北向风速
        }
    }
    
    return {
        u: {
            array: uData,
            min: Math.min(...uData),
            max: Math.max(...uData)
        },
        v: {
            array: vData,
            min: Math.min(...vData),
            max: Math.max(...vData)
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
