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
 * 从 wind_data_0701.json 加载全球风场数据（稀疏数据优化版本）
 * @returns {Promise<Object>} 风场数据对象
 */
export async function loadGlobalWindData() {
    try {
        console.log('🌍 开始加载全球风场数据...');
        const response = await fetch('/data/wind_data_0701.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        console.log('📦 原始数据格式:', {
            hasWind: !!data.wind,
            windLength: data.wind?.length,
            firstPoint: data.wind?.[0]
        });
        
        // 转换数据格式：保留稀疏数据结构，使用空间索引
        const windPoints = data.wind;
        
        // 计算边界
        let minLat = Infinity, maxLat = -Infinity;
        let minLon = Infinity, maxLon = -Infinity;
        
        windPoints.forEach(p => {
            minLat = Math.min(minLat, p.lat);
            maxLat = Math.max(maxLat, p.lat);
            minLon = Math.min(minLon, p.lon);
            maxLon = Math.max(maxLon, p.lon);
        });
        
        // 创建空间网格索引（用于快速查找最近的数据点）
        const gridSize = 1.0; // 1度网格
        const gridRows = Math.ceil((maxLat - minLat) / gridSize) + 1;
        const gridCols = Math.ceil((maxLon - minLon) / gridSize) + 1;
        const spatialGrid = new Array(gridRows * gridCols).fill(null).map(() => []);
        
        // 将数据点分配到网格中
        windPoints.forEach(point => {
            const gridRow = Math.floor((point.lat - minLat) / gridSize);
            const gridCol = Math.floor((point.lon - minLon) / gridSize);
            const gridIndex = gridRow * gridCols + gridCol;
            if (gridIndex >= 0 && gridIndex < spatialGrid.length) {
                spatialGrid[gridIndex].push(point);
            }
        });
        
        console.log('📊 稀疏数据信息:', {
            纬度范围: `${minLat.toFixed(2)}° 到 ${maxLat.toFixed(2)}°`,
            经度范围: `${minLon.toFixed(2)}° 到 ${maxLon.toFixed(2)}°`,
            实际数据点: windPoints.length,
            空间网格: `${gridRows} × ${gridCols}`,
            平均每格点数: (windPoints.length / (gridRows * gridCols)).toFixed(2)
        });
        
        return {
            // 稀疏数据结构
            sparseData: windPoints,
            spatialGrid: spatialGrid,
            gridSize: gridSize,
            gridRows: gridRows,
            gridCols: gridCols,
            // 兼容原有接口（用于不需要密集网格的场景）
            width: gridCols,
            height: gridRows,
            bounds: {
                west: minLon,
                south: minLat,
                east: maxLon,
                north: maxLat
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
