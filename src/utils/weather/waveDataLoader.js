/**
 * 波浪数据加载工具
 * 支持从 WAVERYS 二进制数据加载波浪场数据
 * 参考 windDataLoader.js 的实现模式
 */

/**
 * 加载波浪元数据
 * @returns {Promise<Object>} 元数据对象
 */
export async function loadWaveMeta() {
    try {
        console.log('📋 开始加载波浪元数据...');
        const response = await fetch('/wave_data/meta.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const meta = await response.json();
        console.log('✅ 波浪元数据加载成功:', meta);
        return meta;
    } catch (error) {
        console.error('❌ 加载波浪元数据失败:', error);
        throw error;
    }
}

/**
 * 从二进制文件加载波高数据
 * @param {number} timeIndex - 时间索引 (0-4)
 * @returns {Promise<Float32Array>} 波高数据数组
 */
async function loadWaveHeightBinary(timeIndex) {
    const timeStr = String(timeIndex).padStart(2, '0');
    const url = `/wave_data/hs_t${timeStr}.bin`;
    
    try {
        console.log(`⏳ 加载波高数据: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const buffer = await response.arrayBuffer();
        const data = new Float32Array(buffer);
        console.log(`✅ 波高数据加载成功: ${data.length} 个数据点`);
        return data;
    } catch (error) {
        console.error(`❌ 加载波高数据失败 (t${timeIndex}):`, error);
        throw error;
    }
}

/**
 * 从二进制文件加载 Stokes drift 数据
 * @param {number} timeIndex - 时间索引 (0-4)
 * @returns {Promise<{u: Float32Array, v: Float32Array}>} Stokes drift u/v 分量
 */
async function loadStokesDriftBinary(timeIndex) {
    const timeStr = String(timeIndex).padStart(2, '0');
    const uUrl = `/wave_data/stokes_u_t${timeStr}.bin`;
    const vUrl = `/wave_data/stokes_v_t${timeStr}.bin`;
    
    try {
        console.log(`⏳ 加载 Stokes drift 数据...`);
        const [uResponse, vResponse] = await Promise.all([
            fetch(uUrl),
            fetch(vUrl)
        ]);
        
        if (!uResponse.ok || !vResponse.ok) {
            throw new Error('HTTP error loading Stokes drift data');
        }
        
        const [uBuffer, vBuffer] = await Promise.all([
            uResponse.arrayBuffer(),
            vResponse.arrayBuffer()
        ]);
        
        const uData = new Float32Array(uBuffer);
        const vData = new Float32Array(vBuffer);
        
        console.log(`✅ Stokes drift 数据加载成功`);
        return { u: uData, v: vData };
    } catch (error) {
        console.error(`❌ 加载 Stokes drift 数据失败 (t${timeIndex}):`, error);
        throw error;
    }
}

/**
 * 从全球波浪数据加载并转换为 WindLayer 兼容格式
 * @param {number} timeIndex - 时间索引 (0-4)，默认为 0
 * @returns {Promise<Object>} WindLayer 兼容的数据对象
 */
export async function loadGlobalWaveData(timeIndex = 0) {
    try {
        console.log('🌊 开始加载全球波浪数据...');
        
        // 1. 加载元数据
        const meta = await loadWaveMeta();
        const { grid } = meta;
        const { lon_size, lat_size, lon_min, lat_min, lon_max, lat_max } = grid;
        
        console.log('📊 波浪数据网格信息:', {
            经度范围: `${lon_min}° 到 ${lon_max}°`,
            纬度范围: `${lat_min}° 到 ${lat_max}°`,
            网格尺寸: `${lon_size} × ${lat_size}`,
            起始时间: meta.start_time,
            时间索引: timeIndex
        });
        
        // 2. 加载波高数据和 Stokes drift 数据
        const hsData = await loadWaveHeightBinary(timeIndex);
        const stokesData = await loadStokesDriftBinary(timeIndex);
        
        // 3. 处理缺测值并计算统计信息
        const MISSING = -9999.0;
        let hsMin = Infinity;
        let hsMax = -Infinity;
        let validCount = 0;
        
        for (let i = 0; i < hsData.length; i++) {
            if (hsData[i] !== MISSING && hsData[i] >= 0) {
                hsMin = Math.min(hsMin, hsData[i]);
                hsMax = Math.max(hsMax, hsData[i]);
                validCount++;
            }
        }
        
        console.log('📈 波高数据统计:', {
            有效数据点: validCount,
            缺测数据点: hsData.length - validCount,
            波高范围: `${hsMin.toFixed(2)}m ~ ${hsMax.toFixed(2)}m`
        });
        
        // 4. 创建陆地标记数组（在插值之前标记哪些是陆地）
        console.log('🗺️ 标记陆地区域...');
        const isLandMask = new Uint8Array(hsData.length);
        let landCount = 0;
        
        for (let i = 0; i < hsData.length; i++) {
            // 如果是缺测值或负值，标记为陆地
            if (hsData[i] === MISSING || hsData[i] < 0) {
                isLandMask[i] = 1;
                landCount++;
            }
        }
        
        console.log('📊 陆地标记统计:', {
            陆地点数: landCount,
            海洋点数: hsData.length - landCount,
            陆地占比: `${(landCount / hsData.length * 100).toFixed(2)}%`
        });
        
        // 5. 插值填充缺测值（波高和 Stokes drift）
        console.log('⏳ 插值填充缺测值...');
        const filledHsData = new Float32Array(hsData.length);
        const filledStokesU = new Float32Array(stokesData.u.length);
        const filledStokesV = new Float32Array(stokesData.v.length);
        
        for (let i = 0; i < lat_size; i++) {
            for (let j = 0; j < lon_size; j++) {
                const index = i * lon_size + j;
                
                // 填充波高
                if (hsData[index] !== MISSING && hsData[index] >= 0) {
                    filledHsData[index] = hsData[index];
                } else {
                    // 缺测值，使用周围数据插值
                    let sum = 0;
                    let count = 0;
                    
                    for (let di = -1; di <= 1; di++) {
                        for (let dj = -1; dj <= 1; dj++) {
                            if (di === 0 && dj === 0) continue;
                            
                            const ni = i + di;
                            const nj = (j + dj + lon_size) % lon_size;
                            
                            if (ni >= 0 && ni < lat_size) {
                                const nIndex = ni * lon_size + nj;
                                if (hsData[nIndex] !== MISSING && hsData[nIndex] >= 0) {
                                    sum += hsData[nIndex];
                                    count++;
                                }
                            }
                        }
                    }
                    
                    filledHsData[index] = count > 0 ? sum / count : 2.0;
                }
                
                // 填充 Stokes drift U
                if (stokesData.u[index] !== MISSING) {
                    filledStokesU[index] = stokesData.u[index];
                } else {
                    let sum = 0;
                    let count = 0;
                    
                    for (let di = -1; di <= 1; di++) {
                        for (let dj = -1; dj <= 1; dj++) {
                            if (di === 0 && dj === 0) continue;
                            
                            const ni = i + di;
                            const nj = (j + dj + lon_size) % lon_size;
                            
                            if (ni >= 0 && ni < lat_size) {
                                const nIndex = ni * lon_size + nj;
                                if (stokesData.u[nIndex] !== MISSING) {
                                    sum += stokesData.u[nIndex];
                                    count++;
                                }
                            }
                        }
                    }
                    
                    filledStokesU[index] = count > 0 ? sum / count : 0;
                }
                
                // 填充 Stokes drift V
                if (stokesData.v[index] !== MISSING) {
                    filledStokesV[index] = stokesData.v[index];
                } else {
                    let sum = 0;
                    let count = 0;
                    
                    for (let di = -1; di <= 1; di++) {
                        for (let dj = -1; dj <= 1; dj++) {
                            if (di === 0 && dj === 0) continue;
                            
                            const ni = i + di;
                            const nj = (j + dj + lon_size) % lon_size;
                            
                            if (ni >= 0 && ni < lat_size) {
                                const nIndex = ni * lon_size + nj;
                                if (stokesData.v[nIndex] !== MISSING) {
                                    sum += stokesData.v[nIndex];
                                    count++;
                                }
                            }
                        }
                    }
                    
                    filledStokesV[index] = count > 0 ? sum / count : 0;
                }
            }
        }
        
        console.log('✅ 插值填充完成');
        
        // 6. 转换为 WindLayer 兼容格式
        // 新方案：让线条垂直，运动水平，产生"波浪"效果
        // u 主导水平运动（大值），v 提供垂直长度（小值）
        const uData = new Float32Array(filledHsData.length);
        const vData = new Float32Array(filledHsData.length);
        
        let uMin = Infinity, uMax = -Infinity;
        let vMin = Infinity, vMax = -Infinity;
        
        // 波高阈值：提高阈值，更严格过滤陆地区域
        const WAVE_HEIGHT_THRESHOLD = 0.5; // 0.5米（提高到0.5米）
        
        let filteredLandCount = 0;
        let filteredLowWaveCount = 0;
        
        for (let i = 0; i < filledHsData.length; i++) {
            const su = filledStokesU[i];
            const sv = filledStokesV[i];
            const hs = filledHsData[i];
            
            // ⭐ 关键：如果是陆地（根据原始数据标记），直接设为 0
            if (isLandMask[i] === 1) {
                uData[i] = 0;
                vData[i] = 0;
                filteredLandCount++;
                continue;
            }
            
            // 对于海洋区域，继续原有的过滤逻辑
            // 过滤：波高小于阈值的区域（浅海或无效区域），强制设为0
            // 同时检查 Stokes drift 是否异常小，进一步过滤
            if (hs < WAVE_HEIGHT_THRESHOLD || (Math.abs(su) < 0.001 && Math.abs(sv) < 0.001)) {
                uData[i] = 0;
                vData[i] = 0;
                filteredLowWaveCount++;
                continue;
            }
            
            // 新的转换逻辑：
            // u = Stokes drift 水平分量 × 放大系数 → 主导水平运动
            // v = 波高 × 缩小系数 → 提供垂直方向的长度
            uData[i] = su * 8;      // 水平运动（大值）
            vData[i] = hs * 0.3;    // 垂直长度（小值）
            
            // 只在有效值时更新范围
            if (uData[i] !== 0 || vData[i] !== 0) {
                uMin = Math.min(uMin, uData[i]);
                uMax = Math.max(uMax, uData[i]);
                vMin = Math.min(vMin, vData[i]);
                vMax = Math.max(vMax, vData[i]);
            }
        }
        
        console.log('🔍 数据过滤统计:', {
            陆地过滤: filteredLandCount,
            低波高过滤: filteredLowWaveCount,
            有效数据: hsData.length - filteredLandCount - filteredLowWaveCount
        });
        
        // 确保范围有效
        if (uMin === Infinity) uMin = 0;
        if (uMax === -Infinity) uMax = 0;
        if (vMin === Infinity) vMin = 0;
        if (vMax === -Infinity) vMax = 0;
        
        // 7. 构造返回数据（WindLayer 兼容格式）
        const waveData = {
            hs: {
                array: hsData,  // ⭐ 添加波高数据
                min: hsMin,
                max: hsMax
            },
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
            landMask: isLandMask, // ⭐ 添加陆地标记，供点击验证使用
            width: lon_size,
            height: lat_size,
            bounds: {
                west: lon_min,
                south: lat_min,
                east: lon_max,
                north: lat_max
            }
        };
        
        console.log('✅ 波浪数据转换完成');
        console.log('   - 网格:', lon_size, 'x', lat_size);
        console.log('   - 波高范围:', hsMin.toFixed(2), '~', hsMax.toFixed(2), 'm');
        console.log('   - U范围:', uMin.toFixed(3), '~', uMax.toFixed(3), 'm/s');
        console.log('   - V范围:', vMin.toFixed(3), '~', vMax.toFixed(3), 'm/s');
        console.log('   - 边界:', waveData.bounds);
        
        return waveData;
        
    } catch (error) {
        console.error('❌ 加载全球波浪数据失败:', error);
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
