/**
 * NOAA 数据加载器
 * 从后端加载 NOAA NOMADS 转换后的 JSON 数据
 */

export class NOAADataLoader {
    constructor() {
        this.cache = new Map();
        // 使用本地示例数据（因为 NOAA 服务器国内无法访问）
        this.baseUrl = '/data/noaa';
        this.useFallback = true; // 启用本地数据回退
    }
    
    /**
     * 加载风场数据
     * @param {number} forecast - 预报时间（小时）
     * @returns {Promise<Object>} 风场数据
     */
    async loadWind(forecast = 0) {
        return await this.loadData('wind', forecast);
    }
    
    /**
     * 加载洋流数据
     * @param {number} forecast - 预报时间（小时）
     * @returns {Promise<Object>} 洋流数据
     */
    async loadCurrent(forecast = 0) {
        return await this.loadData('current', forecast);
    }
    
    /**
     * 加载海浪数据
     * @param {number} forecast - 预报时间（小时）
     * @returns {Promise<Object>} 海浪数据
     */
    async loadWave(forecast = 0) {
        return await this.loadData('wave', forecast);
    }
    
    /**
     * 通用数据加载方法
     * @param {string} type - 数据类型 ('wind', 'current', 'wave')
     * @param {number} forecast - 预报时间（小时）
     * @returns {Promise<Object>} 数据对象
     */
    async loadData(type, forecast = 0) {
        const cacheKey = `${type}_f${forecast}`;
        
        // 检查缓存
        if (this.cache.has(cacheKey)) {
            console.log(`📦 从缓存加载 ${type} 数据 (预报+${forecast}h)`);
            return this.cache.get(cacheKey);
        }
        
        try {
            const filename = `${type}_f${String(forecast).padStart(3, '0')}.json`;
            const url = `${this.baseUrl}/${filename}`;
            
            console.log(`📡 尝试加载 ${type} 数据 (预报+${forecast}h)...`);
            console.log(`   URL: ${url}`);
            
            const response = await fetch(url);
            if (!response.ok) {
                // 如果 NOAA 数据不存在，尝试使用本地示例数据
                if (this.useFallback && type === 'wind') {
                    console.log(`⚠️  NOAA 数据不可用，使用本地示例数据`);
                    return await this.loadLocalWindData();
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // 转换为 cesium-wind-layer 兼容格式
            const processedData = this.processGrib2JsonData(data, type);
            
            // 缓存数据
            this.cache.set(cacheKey, processedData);
            
            console.log(`✅ ${type} 数据加载完成`);
            console.log(`   数据点数: ${processedData.u?.array?.length || 0}`);
            
            return processedData;
        } catch (err) {
            console.error(`❌ 加载 ${type} 数据失败:`, err);
            
            // 如果失败且启用回退，尝试加载本地数据
            if (this.useFallback && type === 'wind') {
                console.log(`🔄 回退到本地示例数据`);
                return await this.loadLocalWindData();
            }
            
            throw err;
        }
    }
    
    /**
     * 加载本地风场示例数据
     */
    async loadLocalWindData() {
        try {
            console.log(`📂 加载本地风场数据: /data/wind_data_0701.json`);
            const response = await fetch('/data/wind_data_0701.json');
            if (!response.ok) {
                throw new Error('本地数据文件不存在');
            }
            
            const data = await response.json();
            
            // 检查数据格式
            if (data.wind && Array.isArray(data.wind)) {
                // 稀疏数据格式，需要转换
                console.log(`📊 转换稀疏数据格式 (${data.wind.length} 个数据点)`);
                return this.convertSparseData(data.wind);
            } else if (Array.isArray(data) && data[0]?.header) {
                // GRIB2JSON 格式
                return this.processGrib2JsonData(data, 'wind');
            } else {
                throw new Error('未知的数据格式');
            }
        } catch (err) {
            console.error('❌ 加载本地数据失败:', err);
            throw err;
        }
    }
    
    /**
     * 转换稀疏数据为密集网格
     */
    convertSparseData(sparseData) {
        // 计算边界
        let minLat = Infinity, maxLat = -Infinity;
        let minLon = Infinity, maxLon = -Infinity;
        
        sparseData.forEach(p => {
            minLat = Math.min(minLat, p.lat);
            maxLat = Math.max(maxLat, p.lat);
            minLon = Math.min(minLon, p.lon);
            maxLon = Math.max(maxLon, p.lon);
        });
        
        // 创建网格（1度分辨率）
        const resolution = 1.0;
        const nx = Math.ceil((maxLon - minLon) / resolution) + 1;
        const ny = Math.ceil((maxLat - minLat) / resolution) + 1;
        
        const uArray = new Float32Array(nx * ny);
        const vArray = new Float32Array(nx * ny);
        
        // 填充网格（使用最近邻插值）
        for (let i = 0; i < ny; i++) {
            for (let j = 0; j < nx; j++) {
                const lat = minLat + i * resolution;
                const lon = minLon + j * resolution;
                
                // 找到最近的数据点
                let minDist = Infinity;
                let nearestPoint = null;
                
                for (const point of sparseData) {
                    const dist = Math.sqrt(
                        Math.pow(point.lat - lat, 2) + 
                        Math.pow(point.lon - lon, 2)
                    );
                    if (dist < minDist) {
                        minDist = dist;
                        nearestPoint = point;
                    }
                }
                
                const index = i * nx + j;
                if (nearestPoint && minDist < resolution * 2) {
                    uArray[index] = nearestPoint.u || 0;
                    vArray[index] = nearestPoint.v || 0;
                } else {
                    uArray[index] = 0;
                    vArray[index] = 0;
                }
            }
        }
        
        console.log(`✅ 数据转换完成: ${nx} × ${ny} 网格`);
        
        return {
            u: {
                array: uArray,
                min: Math.min(...uArray),
                max: Math.max(...uArray)
            },
            v: {
                array: vArray,
                min: Math.min(...vArray),
                max: Math.max(...vArray)
            },
            width: nx,
            height: ny,
            bounds: {
                west: minLon,
                south: minLat,
                east: maxLon,
                north: maxLat
            },
            metadata: {
                type: 'wind',
                source: 'local',
                resolution: resolution
            }
        };
    }
    
    /**
     * 处理 grib2json 输出的数据格式
     * 转换为 cesium-wind-layer 需要的格式
     */
    processGrib2JsonData(gribData, type) {
        // grib2json 输出格式：
        // [
        //   { header: {...}, data: [...] },  // U 分量
        //   { header: {...}, data: [...] }   // V 分量
        // ]
        
        if (!Array.isArray(gribData) || gribData.length < 2) {
            throw new Error('数据格式不正确');
        }
        
        const uComponent = gribData[0];
        const vComponent = gribData[1];
        
        const header = uComponent.header;
        
        // 提取网格信息
        const nx = header.nx; // 经度方向点数
        const ny = header.ny; // 纬度方向点数
        const lo1 = header.lo1; // 起始经度
        const la1 = header.la1; // 起始纬度
        const lo2 = header.lo2; // 结束经度
        const la2 = header.la2; // 结束纬度
        const dx = header.dx; // 经度间隔
        const dy = header.dy; // 纬度间隔
        
        console.log(`📊 数据网格信息:`, {
            经度: `${lo1}° 到 ${lo2}° (间隔 ${dx}°)`,
            纬度: `${la1}° 到 ${la2}° (间隔 ${dy}°)`,
            网格: `${nx} × ${ny}`,
            总点数: nx * ny
        });
        
        // 转换为 Float32Array
        const uArray = new Float32Array(uComponent.data);
        const vArray = new Float32Array(vComponent.data);
        
        return {
            u: {
                array: uArray,
                min: Math.min(...uComponent.data.filter(v => v !== null)),
                max: Math.max(...uComponent.data.filter(v => v !== null))
            },
            v: {
                array: vArray,
                min: Math.min(...vComponent.data.filter(v => v !== null)),
                max: Math.max(...vComponent.data.filter(v => v !== null))
            },
            width: nx,
            height: ny,
            bounds: {
                west: lo1,
                south: Math.min(la1, la2),
                east: lo2,
                north: Math.max(la1, la2)
            },
            metadata: {
                type: type,
                refTime: header.refTime,
                forecastTime: header.forecastTime,
                parameterUnit: header.parameterUnit,
                parameterNumberName: header.parameterNumberName
            }
        };
    }
    
    /**
     * 获取可用的数据列表
     */
    async getAvailableData() {
        try {
            const response = await fetch('/api/noaa/available');
            const result = await response.json();
            return result.data;
        } catch (err) {
            console.error('获取数据列表失败:', err);
            return { wind: [], current: [], wave: [] };
        }
    }
    
    /**
     * 清除缓存
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️  缓存已清除');
    }
}

// 导出单例
export const noaaLoader = new NOAADataLoader();
