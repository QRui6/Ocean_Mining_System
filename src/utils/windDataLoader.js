/**
 * 风场数据加载工具
 * 支持从 JSON 或 NetCDF 格式加载风场数据
 */

/**
 * 从 JSON 文件加载风场数据
 * @param {string} url - 风场数据 URL
 * @returns {Promise<Object>} 风场数据对象
 */
export async function loadWindDataFromJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // 验证数据格式
        if (!data.xmin || !data.xmax || !data.ymin || !data.ymax || !data.rows || !data.cols) {
            throw new Error('Invalid wind data format');
        }
        
        return data;
    } catch (error) {
        console.error('Failed to load wind data:', error);
        throw error;
    }
}

/**
 * 生成示例风场数据（用于测试）
 * @param {number} rows - 行数
 * @param {number} cols - 列数
 * @returns {Object} 风场数据对象
 */
export function generateSampleWindData(rows = 180, cols = 360) {
    const totalSize = rows * cols;
    const uData = new Float32Array(totalSize);
    const vData = new Float32Array(totalSize);
    
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const index = i * cols + j;
            const lat = -90 + (i / rows) * 180;
            const lon = -180 + (j / cols) * 360;
            
            // 模拟全球风场模式
            // U 分量（东西方向）：模拟西风带和信风
            uData[index] = Math.sin(lat * Math.PI / 180) * 15 + 
                          Math.cos(lon * Math.PI / 360) * 5;
            
            // V 分量（南北方向）：模拟季风和环流
            vData[index] = Math.cos(lat * Math.PI / 180) * 10 + 
                          Math.sin(lon * Math.PI / 360) * 3;
        }
    }
    
    return {
        u: {
            array: uData
        },
        v: {
            array: vData
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

/**
 * 生成太平洋区域的风场数据（针对海洋采矿系统）
 * @returns {Object} 风场数据对象
 */
export function generatePacificWindData() {
    // 小区域高密度数据：中国东海到太平洋
    // 经度 110° 到 150°（40度范围）
    // 纬度 10° 到 40°（30度范围）
    const rows = 60;   // 高分辨率：每0.5度一个点
    const cols = 80;
    const totalSize = rows * cols;
    const uData = new Float32Array(totalSize);
    const vData = new Float32Array(totalSize);
    
    // 创建一个旋转的涡旋风场（类似台风效果）
    const centerLat = 25;  // 涡旋中心纬度
    const centerLon = 130; // 涡旋中心经度
    
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const index = i * cols + j;
            const lat = 10 + (i / rows) * 30;
            const lon = 110 + (j / cols) * 40;
            
            // 计算到涡旋中心的距离和角度
            const dx = lon - centerLon;
            const dy = lat - centerLat;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            
            // 创建旋转风场（逆时针旋转）
            const windSpeed = 15 * Math.exp(-distance / 10); // 距离越远风速越小
            
            // 切向速度（旋转）
            const tangentialU = -windSpeed * Math.sin(angle);
            const tangentialV = windSpeed * Math.cos(angle);
            
            // 径向速度（向外扩散）
            const radialSpeed = 5 * (1 - Math.exp(-distance / 5));
            const radialU = radialSpeed * Math.cos(angle);
            const radialV = radialSpeed * Math.sin(angle);
            
            // 添加一些随机扰动让流场更自然
            const noise = (Math.random() - 0.5) * 2;
            
            uData[index] = tangentialU + radialU + noise;
            vData[index] = tangentialV + radialV + noise;
        }
    }
    
    return {
        u: {
            array: uData
        },
        v: {
            array: vData
        },
        width: cols,
        height: rows,
        bounds: {
            west: 110,
            south: 10,
            east: 150,
            north: 40
        }
    };
}

/**
 * 从 global_wind_1deg.json 加载全球风场数据
 * @returns {Promise<Object>} 风场数据对象
 */
export async function loadGlobalWindData() {
    try {
        console.log('🌍 开始加载全球风场数据...');
        const response = await fetch('/global_wind_1deg.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        console.log('📦 原始数据格式:', {
            hasWind: !!data.wind,
            windLength: data.wind?.length,
            firstPoint: data.wind?.[0]
        });
        
        // 转换数据格式：从 {lat, lon, u, v} 数组转换为网格格式
        const windPoints = data.wind;
        
        // 提取唯一的经纬度值
        const lats = [...new Set(windPoints.map(p => p.lat))].sort((a, b) => a - b);
        const lons = [...new Set(windPoints.map(p => p.lon))].sort((a, b) => a - b);
        
        const rows = lats.length;
        const cols = lons.length;
        const totalSize = rows * cols;
        
        console.log('📊 网格信息:', {
            纬度范围: `${lats[0]}° 到 ${lats[lats.length - 1]}°`,
            经度范围: `${lons[0]}° 到 ${lons[lons.length - 1]}°`,
            行数: rows,
            列数: cols,
            总点数: totalSize
        });
        
        // 创建 Float32Array 存储 u 和 v 分量
        const uData = new Float32Array(totalSize);
        const vData = new Float32Array(totalSize);
        
        // 创建快速查找映射
        const dataMap = new Map();
        windPoints.forEach(point => {
            const key = `${point.lat},${point.lon}`;
            dataMap.set(key, { u: point.u, v: point.v });
        });
        
        // 填充数据（按照从南到北、从西到东的顺序）
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const lat = lats[i];
                const lon = lons[j];
                const key = `${lat},${lon}`;
                const point = dataMap.get(key);
                
                const index = i * cols + j;
                if (point) {
                    uData[index] = point.u;
                    vData[index] = point.v;
                } else {
                    uData[index] = 0;
                    vData[index] = 0;
                }
            }
        }
        
        console.log('✅ 数据转换完成:', {
            u前5个值: Array.from(uData.slice(0, 5)),
            v前5个值: Array.from(vData.slice(0, 5)),
            u类型: uData.constructor.name,
            v类型: vData.constructor.name
        });
        
        return {
            u: {
                array: uData
            },
            v: {
                array: vData
            },
            width: cols,
            height: rows,
            bounds: {
                west: lons[0],
                south: lats[0],
                east: lons[lons.length - 1],
                north: lats[lats.length - 1]
            }
        };
    } catch (error) {
        console.error('❌ 加载全球风场数据失败:', error);
        throw error;
    }
}

/**
 * 从 URL 加载 NetCDF 风场数据（需要后端支持）
 * @param {string} url - NetCDF 文件 URL
 * @returns {Promise<Object>} 风场数据对象
 */
export async function loadWindDataFromNetCDF(url) {
    // 注意：浏览器无法直接解析 NetCDF 文件
    // 需要后端服务将 NetCDF 转换为 JSON 格式
    // 或使用 netcdfjs 库（需要额外安装）
    console.warn('NetCDF loading requires backend support or netcdfjs library');
    throw new Error('NetCDF loading not implemented');
}
