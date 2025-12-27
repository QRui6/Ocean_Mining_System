/**
 * 洋流数据加载工具
 * 支持从 GLORYS12V1 二进制数据加载洋流数据
 * 参考 waveDataLoader.js 的实现模式
 */

/**
 * 加载洋流元数据
 * @returns {Promise<Object>} 元数据对象
 */
export async function loadOceanCurrentMeta() {
    try {
        console.log('📋 开始加载洋流元数据...');
        const response = await fetch('/export_currents_out/meta.json');
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
 * @param {number} timeIndex - 时间索引 (0-1)
 * @returns {Promise<Float32Array>} U 分量数据数组
 */
async function loadUComponentBinary(timeIndex) {
    const timeStr = String(timeIndex).padStart(2, '0');
    const url = `/export_currents_out/u_t${timeStr}.bin`;
    
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
 * @param {number} timeIndex - 时间索引 (0-1)
 * @returns {Promise<Float32Array>} V 分量数据数组
 */
async function loadVComponentBinary(timeIndex) {
    const timeStr = String(timeIndex).padStart(2, '0');
    const url = `/export_currents_out/v_t${timeStr}.bin`;
    
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
 * @param {number} timeIndex - 时间索引 (0-1)，默认为 0
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
            起始时间: meta.start_time,
            时间索引: timeIndex
        });
        
        // 2. 加载 U 和 V 分量数据
        const [uData, vData] = await Promise.all([
            loadUComponentBinary(timeIndex),
            loadVComponentBinary(timeIndex)
        ]);
        
        // 3. 处理缺测值并计算统计信息
        const MISSING = -9999.0;
        let uMin = Infinity;
        let uMax = -Infinity;
        let vMin = Infinity;
        let vMax = -Infinity;
        let validCount = 0;
        
        for (let i = 0; i < uData.length; i++) {
            const u = uData[i];
            const v = vData[i];
            const speed = Math.sqrt(u * u + v * v);
            
            // 过滤缺测值和异常值
            if (u !== MISSING && v !== MISSING && speed >= 0.01 && speed <= 5.0) {
                uMin = Math.min(uMin, u);
                uMax = Math.max(uMax, u);
                vMin = Math.min(vMin, v);
                vMax = Math.max(vMax, v);
                validCount++;
            }
        }
        
        console.log('📈 原始洋流数据统计:', {
            有效数据点: validCount,
            缺测数据点: uData.length - validCount,
            U范围: `${uMin.toFixed(4)}m/s ~ ${uMax.toFixed(4)}m/s`,
            V范围: `${vMin.toFixed(4)}m/s ~ ${vMax.toFixed(4)}m/s`
        });
        
        // 4. 降采样到低分辨率（匹配风场分辨率）
        console.log('⏳ 开始降采样...');
        
        const targetWidth = 360;
        const targetHeight = 170;  // -80° 到 90° = 170度
        
        const scaleX = lon_size / targetWidth;
        const scaleY = lat_size / targetHeight;
        
        console.log(`📊 降采样比例: ${scaleX.toFixed(2)}x (宽) × ${scaleY.toFixed(2)}x (高)`);
        console.log(`   原始: ${lon_size} × ${lat_size} = ${lon_size * lat_size} 点`);
        console.log(`   目标: ${targetWidth} × ${targetHeight} = ${targetWidth * targetHeight} 点`);
        
        const downsampledUData = new Float32Array(targetWidth * targetHeight);
        const downsampledVData = new Float32Array(targetWidth * targetHeight);
        
        // 使用区域平均进行降采样
        for (let ty = 0; ty < targetHeight; ty++) {
            for (let tx = 0; tx < targetWidth; tx++) {
                // 计算源区域范围
                const srcX0 = Math.floor(tx * scaleX);
                const srcX1 = Math.min(Math.ceil((tx + 1) * scaleX), lon_size);
                const srcY0 = Math.floor(ty * scaleY);
                const srcY1 = Math.min(Math.ceil((ty + 1) * scaleY), lat_size);
                
                let sumU = 0, sumV = 0, count = 0;
                
                // 对源区域内的所有像素求平均
                for (let sy = srcY0; sy < srcY1; sy++) {
                    for (let sx = srcX0; sx < srcX1; sx++) {
                        const srcIndex = sy * lon_size + sx;
                        const u = uData[srcIndex];
                        const v = vData[srcIndex];
                        const speed = Math.sqrt(u * u + v * v);
                        
                        // 过滤缺测值和异常值
                        if (u !== MISSING && v !== MISSING && speed >= 0.05 && speed <= 5.0) {
                            sumU += u;
                            sumV += v;
                            count++;
                        }
                    }
                }
                
                const targetIndex = ty * targetWidth + tx;
                if (count > 0) {
                    downsampledUData[targetIndex] = sumU / count;
                    downsampledVData[targetIndex] = sumV / count;
                } else {
                    // 无效区域设为 0
                    downsampledUData[targetIndex] = 0;
                    downsampledVData[targetIndex] = 0;
                }
            }
        }
        
        console.log('✅ 降采样完成');
        
        // 5. 放大洋流速度（让流线可见）
        const AMPLIFY_FACTOR = 10;
        
        let amplifiedUMin = Infinity, amplifiedUMax = -Infinity;
        let amplifiedVMin = Infinity, amplifiedVMax = -Infinity;
        let oceanCount = 0;
        let landCount = 0;
        
        for (let i = 0; i < downsampledUData.length; i++) {
            const u = downsampledUData[i];
            const v = downsampledVData[i];
            const speed = Math.sqrt(u * u + v * v);
            
            if (speed >= 0.05 && speed <= 5.0) {
                // 放大洋流速度
                downsampledUData[i] = u * AMPLIFY_FACTOR;
                downsampledVData[i] = v * AMPLIFY_FACTOR;
                
                amplifiedUMin = Math.min(amplifiedUMin, downsampledUData[i]);
                amplifiedUMax = Math.max(amplifiedUMax, downsampledUData[i]);
                amplifiedVMin = Math.min(amplifiedVMin, downsampledVData[i]);
                amplifiedVMax = Math.max(amplifiedVMax, downsampledVData[i]);
                oceanCount++;
            } else {
                // 陆地区域强制设为 0
                downsampledUData[i] = 0;
                downsampledVData[i] = 0;
                landCount++;
            }
        }
        
        // 确保范围有效
        if (amplifiedUMin === Infinity) amplifiedUMin = 0;
        if (amplifiedUMax === -Infinity) amplifiedUMax = 0;
        if (amplifiedVMin === Infinity) amplifiedVMin = 0;
        if (amplifiedVMax === -Infinity) amplifiedVMax = 0;
        
        console.log(`🔧 洋流速度已放大 ${AMPLIFY_FACTOR} 倍`);
        
        console.log('📈 洋流数据统计:', {
            网格尺寸: `${targetWidth} × ${targetHeight}`,
            海洋数据点: oceanCount,
            陆地数据点: landCount,
            海洋占比: `${(oceanCount / downsampledUData.length * 100).toFixed(1)}%`,
            U范围: `${amplifiedUMin.toFixed(3)} ~ ${amplifiedUMax.toFixed(3)} m/s`,
            V范围: `${amplifiedVMin.toFixed(3)} ~ ${amplifiedVMax.toFixed(3)} m/s`
        });
        
        // 6. 构造 WindLayer 兼容格式
        const oceanCurrentData = {
            u: {
                array: downsampledUData,
                min: amplifiedUMin,
                max: amplifiedUMax
            },
            v: {
                array: downsampledVData,
                min: amplifiedVMin,
                max: amplifiedVMax
            },
            width: targetWidth,
            height: targetHeight,
            bounds: {
                west: lon_min,
                south: lat_min,
                east: lon_max,
                north: lat_max
            }
        };
        
        console.log('✅ 洋流数据加载完成');
        console.log('   - 网格:', targetWidth, 'x', targetHeight);
        console.log('   - U范围:', amplifiedUMin.toFixed(2), '~', amplifiedUMax.toFixed(2), 'm/s');
        console.log('   - V范围:', amplifiedVMin.toFixed(2), '~', amplifiedVMax.toFixed(2), 'm/s');
        console.log('   - 边界:', oceanCurrentData.bounds);
        
        return oceanCurrentData;
        
    } catch (error) {
        console.error('❌ 加载全球洋流数据失败:', error);
        throw error;
    }
}
