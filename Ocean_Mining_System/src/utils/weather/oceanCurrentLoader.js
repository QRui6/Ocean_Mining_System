/**
 * 洋流数据加载工具
 * 支持从降采样的洋流数据加载
 * 数据已预处理为 360x180 分辨率（1度网格）
 */

/**
 * 加载洋流元数据
 * @returns {Promise<Object>} 元数据对象
 */
export async function loadOceanCurrentMeta() {
    try {
        console.log('📋 开始加载洋流元数据...');
        const response = await fetch('/ocean_currents/meta.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const meta = await response.json();
        console.log('✅ 洋流元数据加载成功:', meta);
        return meta;
    } catch (error) {
        console.error('❌ 加载洋流元数据失败:', error);
        throw error;
    }
}

/**
 * 从二进制文件加载 U 分量数据
 * @param {number} timeIndex - 时间索引 (0-8)
 * @returns {Promise<Float32Array>} U 分量数据数组
 */
async function loadUComponentBinary(timeIndex) {
    const timeStr = String(timeIndex).padStart(2, '0');
    const url = `/ocean_currents/u_t${timeStr}.bin`;
    
    try {
        console.log(`⏳ 加载 U 分量数据: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const buffer = await response.arrayBuffer();
        const data = new Float32Array(buffer);
        console.log(`✅ U 分量数据加载成功: ${data.length} 个数据点`);
        return data;
    } catch (error) {
        console.error(`❌ 加载 U 分量数据失败 (t${timeIndex}):`, error);
        throw error;
    }
}

/**
 * 从二进制文件加载 V 分量数据
 * @param {number} timeIndex - 时间索引 (0-8)
 * @returns {Promise<Float32Array>} V 分量数据数组
 */
async function loadVComponentBinary(timeIndex) {
    const timeStr = String(timeIndex).padStart(2, '0');
    const url = `/ocean_currents/v_t${timeStr}.bin`;
    
    try {
        console.log(`⏳ 加载 V 分量数据: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const buffer = await response.arrayBuffer();
        const data = new Float32Array(buffer);
        console.log(`✅ V 分量数据加载成功: ${data.length} 个数据点`);
        return data;
    } catch (error) {
        console.error(`❌ 加载 V 分量数据失败 (t${timeIndex}):`, error);
        throw error;
    }
}

/**
 * 从全球洋流数据加载并转换为 WindLayer 兼容格式
 * @param {number} timeIndex - 时间索引 (0-8)，默认为 0
 * @returns {Promise<Object>} WindLayer 兼容的数据对象
 */
export async function loadGlobalOceanCurrentData(timeIndex = 0) {
    try {
        console.log('🌊 开始加载全球洋流数据...');
        
        // 1. 加载元数据
        const meta = await loadOceanCurrentMeta();
        const { grid } = meta;
        const { lon_size, lat_size, lon_min, lat_min, lon_max, lat_max } = grid;
        
        console.log('📊 洋流数据网格信息:', {
            经度范围: `${lon_min}° 到 ${lon_max}°`,
            纬度范围: `${lat_min}° 到 ${lat_max}°`,
            网格尺寸: `${lon_size} × ${lat_size}`,
            分辨率: meta.downsampled ? '1° (降采样)' : '原始',
            起始时间: meta.start_time,
            时间索引: timeIndex
        });
        
        // 2. 加载 U 和 V 分量数据
        const [uData, vData] = await Promise.all([
            loadUComponentBinary(timeIndex),
            loadVComponentBinary(timeIndex)
        ]);
        
        // 3. 计算统计信息
        let uMin = Infinity;
        let uMax = -Infinity;
        let vMin = Infinity;
        let vMax = -Infinity;
        let validCount = 0;
        
        for (let i = 0; i < uData.length; i++) {
            const u = uData[i];
            const v = vData[i];
            const speed = Math.sqrt(u * u + v * v);
            
            // 过滤无效值
            if (speed >= 0.01 && speed <= 5.0) {
                uMin = Math.min(uMin, u);
                uMax = Math.max(uMax, u);
                vMin = Math.min(vMin, v);
                vMax = Math.max(vMax, v);
                validCount++;
            }
        }
        
        console.log('📈 洋流数据统计:', {
            有效数据点: validCount,
            无效数据点: uData.length - validCount,
            U范围: `${uMin.toFixed(4)}m/s ~ ${uMax.toFixed(4)}m/s`,
            V范围: `${vMin.toFixed(4)}m/s ~ ${vMax.toFixed(4)}m/s`
        });
        
        // 4. 放大洋流速度（让流线可见）
        const AMPLIFY_FACTOR = 15;  // 提高放大倍数，让洋流更明显
        
        for (let i = 0; i < uData.length; i++) {
            const speed = Math.sqrt(uData[i] * uData[i] + vData[i] * vData[i]);
            if (speed >= 0.01 && speed <= 5.0) {
                uData[i] *= AMPLIFY_FACTOR;
                vData[i] *= AMPLIFY_FACTOR;
            }
        }
        
        console.log(`🔧 洋流速度已放大 ${AMPLIFY_FACTOR} 倍`);
        
        // 5. 构造 WindLayer 兼容格式
        const oceanCurrentData = {
            u: {
                array: uData,
                min: uMin * AMPLIFY_FACTOR,
                max: uMax * AMPLIFY_FACTOR
            },
            v: {
                array: vData,
                min: vMin * AMPLIFY_FACTOR,
                max: vMax * AMPLIFY_FACTOR
            },
            width: lon_size,
            height: lat_size,
            bounds: {
                west: lon_min,
                south: lat_min,
                east: lon_max,
                north: lat_max
            }
        };
        
        console.log('✅ 洋流数据加载完成');
        console.log('   - 网格:', lon_size, 'x', lat_size);
        console.log('   - U范围:', oceanCurrentData.u.min.toFixed(2), '~', oceanCurrentData.u.max.toFixed(2), 'm/s');
        console.log('   - V范围:', oceanCurrentData.v.min.toFixed(2), '~', oceanCurrentData.v.max.toFixed(2), 'm/s');
        console.log('   - 边界:', oceanCurrentData.bounds);
        
        return oceanCurrentData;
        
    } catch (error) {
        console.error('❌ 加载全球洋流数据失败:', error);
        throw error;
    }
}
