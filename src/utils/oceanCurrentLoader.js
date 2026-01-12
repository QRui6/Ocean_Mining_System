/**
 * 洋流数据加载工具
 * 从 Java 后端 API 加载洋流数据（二进制格式，性能优化版）
 */

// API 基础URL - 使用相对路径,通过Vite代理转发
const API_BASE_URL = '/api/weather';

/**
 * 从全球洋流数据加载并转换为 WindLayer 兼容格式（二进制版本）
 * @param {number} timeIndex - 时间索引 (0-8)，默认为 0
 * @returns {Promise<Object>} WindLayer 兼容的数据对象
 */
export async function loadGlobalOceanCurrentData(timeIndex = 0) {
    try {
        console.log('🌊 开始加载全球洋流数据（二进制格式）...');
        console.log('   - 时间索引:', timeIndex);
        console.log('   - API地址:', `${API_BASE_URL}/data/ocean_current/${timeIndex}/binary`);
        
        const startTime = performance.now();
        
        // 从后端API加载二进制数据
        const response = await fetch(`${API_BASE_URL}/data/ocean_current/${timeIndex}/binary`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const downloadTime = performance.now() - startTime;
        
        console.log(`   - 下载完成: ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)}MB, 耗时: ${downloadTime.toFixed(0)}ms`);
        
        // 解析二进制数据
        const parseStartTime = performance.now();
        const oceanCurrentData = parseBinaryOceanCurrentData(arrayBuffer);
        const parseTime = performance.now() - parseStartTime;
        
        // 放大洋流速度（让流线可见）
        const AMPLIFY_FACTOR = 15;
        const uData = oceanCurrentData.u.array;
        const vData = oceanCurrentData.v.array;
        
        for (let i = 0; i < uData.length; i++) {
            const speed = Math.sqrt(uData[i] * uData[i] + vData[i] * vData[i]);
            if (speed >= 0.01 && speed <= 5.0) {
                uData[i] *= AMPLIFY_FACTOR;
                vData[i] *= AMPLIFY_FACTOR;
            }
        }
        
        // 更新min/max
        oceanCurrentData.u.min *= AMPLIFY_FACTOR;
        oceanCurrentData.u.max *= AMPLIFY_FACTOR;
        oceanCurrentData.v.min *= AMPLIFY_FACTOR;
        oceanCurrentData.v.max *= AMPLIFY_FACTOR;
        
        console.log(`🔧 洋流速度已放大 ${AMPLIFY_FACTOR} 倍`);
        console.log('✅ 洋流数据加载完成');
        console.log('   - 网格:', oceanCurrentData.width, 'x', oceanCurrentData.height);
        console.log('   - U范围:', oceanCurrentData.u.min.toFixed(2), '~', oceanCurrentData.u.max.toFixed(2), 'm/s');
        console.log('   - V范围:', oceanCurrentData.v.min.toFixed(2), '~', oceanCurrentData.v.max.toFixed(2), 'm/s');
        console.log('   - 边界:', oceanCurrentData.bounds);
        console.log(`   - 解析耗时: ${parseTime.toFixed(0)}ms`);
        console.log(`   - 总耗时: ${(downloadTime + parseTime).toFixed(0)}ms`);
        
        return oceanCurrentData;
        
    } catch (error) {
        console.error('❌ 加载全球洋流数据失败:', error);
        throw error;
    }
}

/**
 * 解析二进制洋流数据
 * 数据格式：[4字节: header长度] + [header JSON] + [padding对齐] + [U数据] + [V数据]
 * 
 * @param {ArrayBuffer} arrayBuffer - 二进制数据
 * @returns {Object} 洋流数据对象
 */
function parseBinaryOceanCurrentData(arrayBuffer) {
    console.log('🔍 开始解析二进制洋流数据...');
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
 * 加载洋流元数据（兼容旧代码）
 * @returns {Promise<Object>} 元数据对象
 */
export async function loadOceanCurrentMeta() {
    try {
        console.log('📋 开始加载洋流元数据...');
        const response = await fetch(`${API_BASE_URL}/metadata/ocean_current`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || '加载元数据失败');
        }
        
        const meta = result.data;
        console.log('✅ 洋流元数据加载成功:', meta);
        return meta;
    } catch (error) {
        console.error('❌ 加载洋流元数据失败:', error);
        throw error;
    }
}
