/**
 * 风场数据加载工具
 * 支持从 ERA5 二进制数据加载风场数据
 * 参考 waveDataLoader.js 和 oceanCurrentLoader.js 的实现模式
 */

/**
 * 加载风场元数据
 * @returns {Promise<Object>} 元数据对象
 */
export async function loadWindMeta() {
    try {
        console.log('📋 开始加载风场元数据...');
        const response = await fetch('/wind_data/meta.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const meta = await response.json();
        console.log('✅ 风场元数据加载成功:', meta);
        return meta;
    } catch (error) {
        console.error('❌ 加载风场元数据失败:', error);
        throw error;
    }
}

/**
 * 从二进制文件加载 U 分量数据
 * @param {number} timeIndex - 时间索引 (0-95)
 * @returns {Promise<Float32Array>} U 分量数据数组
 */
async function loadUComponentBinary(timeIndex) {
    const timeStr = String(timeIndex).padStart(2, '0');
    const url = `/wind_data/u_t${timeStr}.bin`;
    
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
 * @param {number} timeIndex - 时间索引 (0-95)
 * @returns {Promise<Float32Array>} V 分量数据数组
 */
async function loadVComponentBinary(timeIndex) {
    const timeStr = String(timeIndex).padStart(2, '0');
    const url = `/wind_data/v_t${timeStr}.bin`;
    
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
 * 从全球风场数据加载并转换为 WindLayer 兼容格式
 * @param {number} timeIndex - 时间索引 (0-95)，默认为 0
 * @returns {Promise<Object>} WindLayer 兼容的数据对象
 */
export async function loadGlobalWindData(timeIndex = 0) {
    try {
        console.log('🌬️  开始加载全球风场数据...');
        
        // 1. 加载元数据
        const meta = await loadWindMeta();
        const { grid } = meta;
        const { lon_size, lat_size, lon_min, lat_min, lon_max, lat_max } = grid;
        
        // 2. 验证时间索引
        if (timeIndex >= meta.frames) {
            console.warn(`⚠️  时间索引 ${timeIndex} 超出范围，使用最后一帧 ${meta.frames - 1}`);
            timeIndex = meta.frames - 1;
        }
        
        console.log('📊 风场数据网格信息:', {
            经度范围: `${lon_min}° 到 ${lon_max}°`,
            纬度范围: `${lat_min}° 到 ${lat_max}°`,
            网格尺寸: `${lon_size} × ${lat_size}`,
            分辨率: `${grid.lon_step}°`,
            起始时间: meta.start_time,
            时间索引: timeIndex
        });
        
        // 3. 加载 U 和 V 分量数据
        const [uData, vData] = await Promise.all([
            loadUComponentBinary(timeIndex),
            loadVComponentBinary(timeIndex)
        ]);
        
        // 4. 计算统计信息
        let uMin = Infinity;
        let uMax = -Infinity;
        let vMin = Infinity;
        let vMax = -Infinity;
        let validCount = 0;
        
        for (let i = 0; i < uData.length; i++) {
            const u = uData[i];
            const v = vData[i];
            const speed = Math.sqrt(u * u + v * v);
            
            // 过滤无效值（风速过大或过小）
            if (speed >= 0 && speed <= 100) {
                uMin = Math.min(uMin, u);
                uMax = Math.max(uMax, u);
                vMin = Math.min(vMin, v);
                vMax = Math.max(vMax, v);
                validCount++;
            }
        }
        
        console.log('📈 风场数据统计:', {
            有效数据点: validCount,
            无效数据点: uData.length - validCount,
            U范围: `${uMin.toFixed(2)}m/s ~ ${uMax.toFixed(2)}m/s`,
            V范围: `${vMin.toFixed(2)}m/s ~ ${vMax.toFixed(2)}m/s`
        });
        
        // 5. 构造 WindLayer 兼容格式
        const windData = {
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
                west: lon_min,
                south: lat_min,
                east: lon_max,
                north: lat_max
            }
        };
        
        console.log('✅ 风场数据加载完成');
        console.log('   - 网格:', lon_size, 'x', lat_size);
        console.log('   - U范围:', windData.u.min.toFixed(2), '~', windData.u.max.toFixed(2), 'm/s');
        console.log('   - V范围:', windData.v.min.toFixed(2), '~', windData.v.max.toFixed(2), 'm/s');
        console.log('   - 边界:', windData.bounds);
        
        return windData;
        
    } catch (error) {
        console.error('❌ 加载全球风场数据失败:', error);
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
