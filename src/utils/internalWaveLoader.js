/**
 * 内波数据加载工具
 * 支持从 HRET14 二进制数据加载内波（内潮）数据
 * 参考 windDataLoader.js、waveDataLoader.js 和 oceanCurrentLoader.js 的实现模式
 */

/**
 * 加载内波元数据
 * @returns {Promise<Object>} 元数据对象
 */
export async function loadInternalWaveMeta() {
    try {
        console.log('📋 开始加载内波元数据...');
        const response = await fetch('/hret14/hret14_out_uv_20200101/meta.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const meta = await response.json();
        console.log('✅ 内波元数据加载成功:', meta);
        return meta;
    } catch (error) {
        console.error('❌ 加载内波元数据失败:', error);
        throw error;
    }
}

/**
 * 从二进制文件加载 SSH 数据
 * @param {number} timeIndex - 时间索引 (0-8)
 * @param {boolean} useDownsampled - 是否使用下采样数据
 * @returns {Promise<Float32Array>} SSH 数据数组
 */
async function loadSSHBinary(timeIndex, useDownsampled = false) {
    const timeStr = String(timeIndex).padStart(3, '0');
    const folder = useDownsampled ? 'hret14_out_ssh_20200101_ds10' : 'hret14_out_ssh_20200101';
    const filename = useDownsampled ? `ssh_${timeStr}_ds10.bin` : `ssh_${timeStr}.bin`;
    const url = `/hret14/${folder}/${filename}`;
    
    try {
        console.log(`⏳ 加载 SSH 数据: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const buffer = await response.arrayBuffer();
        const data = new Float32Array(buffer);
        console.log(`✅ SSH 数据加载成功: ${data.length} 个数据点`);
        return data;
    } catch (error) {
        console.error(`❌ 加载 SSH 数据失败 (t${timeIndex}):`, error);
        throw error;
    }
}

/**
 * 从二进制文件加载 U 分量数据
 * @param {number} timeIndex - 时间索引 (0-8)
 * @returns {Promise<Float32Array>} U 分量数据数组
 */
async function loadUComponentBinary(timeIndex) {
    const timeStr = String(timeIndex).padStart(3, '0');
    const url = `/hret14/hret14_out_uv_20200101/u_${timeStr}.bin`;
    
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
    const timeStr = String(timeIndex).padStart(3, '0');
    const url = `/hret14/hret14_out_uv_20200101/v_${timeStr}.bin`;
    
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
 * 从全球内波数据加载并转换为 WindLayer 兼容格式
 * @param {number} timeIndex - 时间索引 (0-8)，默认为 0
 * @param {boolean} useDownsampled - 是否使用下采样数据，默认 false
 * @returns {Promise<Object>} WindLayer 兼容的数据对象
 */
export async function loadGlobalInternalWaveData(timeIndex = 0, useDownsampled = false) {
    try {
        console.log('🌊 开始加载全球内波数据...');
        
        // 1. 加载元数据
        const meta = await loadInternalWaveMeta();
        const { grid } = meta;
        const { lon_size, lat_size, lon_min, lat_min, lon_max, lat_max } = grid;
        
        // 2. 验证时间索引
        if (timeIndex < 0 || timeIndex > 8) {
            console.warn(`⚠️ 时间索引 ${timeIndex} 超出范围，使用默认值 0`);
            timeIndex = 0;
        }
        
        console.log('📊 内波数据网格信息:', {
            经度范围: `${lon_min}° 到 ${lon_max}° (0-360坐标系)`,
            纬度范围: `${lat_min}° 到 ${lat_max}°`,
            网格尺寸: `${lon_size} × ${lat_size}`,
            分辨率: `${grid.lon_step}°`,
            时间: meta.times[timeIndex],
            时间索引: timeIndex
        });
        
        // 3. 加载 U 和 V 分量数据（并行加载）
        const [uDataRaw, vDataRaw] = await Promise.all([
            loadUComponentBinary(timeIndex),
            loadVComponentBinary(timeIndex)
        ]);
        
        // 4. 重新排列数据：将 0-360° 转换为 -180 到 180°
        // 必须在过滤和放大之前进行，确保地理位置正确
        console.log('🔄 重新排列经度数据 (0-360° → -180-180°)...');
        
        const halfLon = Math.floor(lon_size / 2);  // 3600
        const uData = new Float32Array(uDataRaw.length);
        const vData = new Float32Array(vDataRaw.length);
        
        for (let lat = 0; lat < lat_size; lat++) {
            for (let lon = 0; lon < lon_size; lon++) {
                const oldIndex = lat * lon_size + lon;
                
                // 重新映射经度索引
                let newLon;
                if (lon >= halfLon) {
                    // 180-360° → -180-0° (放到前半部分)
                    newLon = lon - halfLon;
                } else {
                    // 0-180° → 0-180° (放到后半部分)
                    newLon = lon + halfLon;
                }
                
                const newIndex = lat * lon_size + newLon;
                uData[newIndex] = uDataRaw[oldIndex];
                vData[newIndex] = vDataRaw[oldIndex];
            }
        }
        
        console.log('✅ 经度数据重新排列完成');
        
        // 5. 计算统计信息和过滤无效值
        let uMin = Infinity;
        let uMax = -Infinity;
        let vMin = Infinity;
        let vMax = -Infinity;
        let validCount = 0;
        let invalidCount = 0;
        let landCount = 0;
        
        // 内波速度放大倍数（内波流速很小，需要大幅放大才能可见）
        const AMPLIFY_FACTOR = 5000;  // 放大5000倍，确保粒子清晰可见
        
        // 陆地过滤阈值：内波数据中，陆地区域的速度通常非常小（接近0）
        // 海洋中的内波速度一般在 0.001 m/s 以上
        const LAND_THRESHOLD = 0.0005;  // 低于 0.0005 m/s 的认为是陆地
        
        console.log('📈 分析内波数据并应用放大倍数...');
        console.log('📊 陆地过滤阈值:', LAND_THRESHOLD.toFixed(6), 'm/s');
        
        // 应用放大倍数并过滤陆地
        for (let i = 0; i < uData.length; i++) {
            const u = uData[i];
            const v = vData[i];
            
            // 检查是否为有效值
            if (isNaN(u) || isNaN(v) || !isFinite(u) || !isFinite(v) || 
                Math.abs(u) > 1000 || Math.abs(v) > 1000) {
                // 无效值，设为0
                uData[i] = 0;
                vData[i] = 0;
                invalidCount++;
                continue;
            }
            
            const speed = Math.sqrt(u * u + v * v);
            
            // 过滤陆地区域：速度极小的区域
            if (speed < LAND_THRESHOLD) {
                uData[i] = 0;
                vData[i] = 0;
                landCount++;
                continue;
            }
            
            // 应用放大倍数
            uData[i] = u * AMPLIFY_FACTOR;
            vData[i] = v * AMPLIFY_FACTOR;
            
            // 更新统计
            uMin = Math.min(uMin, uData[i]);
            uMax = Math.max(uMax, uData[i]);
            vMin = Math.min(vMin, vData[i]);
            vMax = Math.max(vMax, vData[i]);
            validCount++;
        }
        
        // 确保范围有效
        if (uMin === Infinity) uMin = 0;
        if (uMax === -Infinity) uMax = 0;
        if (vMin === Infinity) vMin = 0;
        if (vMax === -Infinity) vMax = 0;
        
        console.log('📈 内波数据统计:', {
            有效数据点: validCount,
            无效数据点: invalidCount,
            陆地数据点: landCount,
            放大倍数: AMPLIFY_FACTOR,
            U范围: `${uMin.toFixed(3)} ~ ${uMax.toFixed(3)} m/s (放大后)`,
            V范围: `${vMin.toFixed(3)} ~ ${vMax.toFixed(3)} m/s (放大后)`
        });
        
        // 6. 构造 WindLayer 兼容格式
        // 6. 构造 WindLayer 兼容格式
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
        
        console.log('✅ 内波数据加载完成');
        console.log('   - 网格:', lon_size, 'x', lat_size);
        console.log('   - U范围:', internalWaveData.u.min.toFixed(2), '~', internalWaveData.u.max.toFixed(2), 'm/s');
        console.log('   - V范围:', internalWaveData.v.min.toFixed(2), '~', internalWaveData.v.max.toFixed(2), 'm/s');
        console.log('   - 边界:', internalWaveData.bounds);
        console.log('   - 坐标系: 已从 0-360° 重新排列为 -180 到 180°');
        
        return internalWaveData;
        
    } catch (error) {
        console.error('❌ 加载全球内波数据失败:', error);
        throw error;
    }
}

/**
 * 生成示例内波数据（用于测试）
 * @returns {Object} WindLayer 兼容的数据对象
 */
export function generateSampleInternalWaveData() {
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
            
            // 模拟内波模式（较小的速度值）
            const latFactor = Math.cos(lat * Math.PI / 180);
            const lonFactor = Math.sin(lon * Math.PI / 180);
            
            uData[index] = latFactor * lonFactor * 5.0;  // 放大后的值
            vData[index] = Math.sin(lat * Math.PI / 90) * 3.0;
        }
    }
    
    return {
        u: {
            array: uData,
            min: -5.0,
            max: 5.0
        },
        v: {
            array: vData,
            min: -3.0,
            max: 3.0
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
