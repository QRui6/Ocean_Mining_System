/**
 * Cesium Wind Layer 插件适配器
 * 使用官方 cesium-wind-layer 插件实现风场可视化
 */

// 动态导入 cesium-wind-layer 插件
let WindLayer = null;

// 异步加载插件
async function loadWindLayerPlugin() {
    if (!WindLayer) {
        try {
            const module = await import('cesium-wind-layer');
            WindLayer = module.WindLayer;
            console.log('✅ cesium-wind-layer 插件加载成功');
        } catch (error) {
            console.error('❌ cesium-wind-layer 插件加载失败:', error);
            throw error;
        }
    }
    return WindLayer;
}

/**
 * 将稀疏数据转换为 cesium-wind-layer 所需的网格格式
 * 使用 IDW (Inverse Distance Weighting) 插值算法
 * @param {Object} windData - 从 windDataLoader 加载的稀疏数据
 * @returns {Object} cesium-wind-layer 兼容的数据格式
 */
export function convertToWindLayerFormat(windData) {
    console.log('🔄 开始转换数据格式（IDW插值）...');
    console.log('   - 输入数据点数:', windData.sparseData?.length);
    
    const { sparseData, bounds } = windData;
    
    // 使用更粗的分辨率以提高性能（2度）
    const resolution = 2.0;
    
    // 计算网格尺寸
    const nx = Math.ceil((bounds.east - bounds.west) / resolution) + 1;
    const ny = Math.ceil((bounds.north - bounds.south) / resolution) + 1;
    
    console.log('   - 网格尺寸:', nx, 'x', ny, '=', nx * ny, '个点');
    console.log('   - 开始IDW插值...');
    
    // 创建网格数组
    const uData = new Float32Array(nx * ny);
    const vData = new Float32Array(nx * ny);
    
    // IDW插值参数
    const maxDistance = 8.0;  // 最大影响距离（度）
    const power = 2;          // 距离权重指数
    
    // 对每个网格点进行插值
    let interpolatedCount = 0;
    for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
            const lon = bounds.west + i * resolution;
            const lat = bounds.south + j * resolution;
            
            let sumU = 0, sumV = 0, sumWeight = 0;
            
            // 遍历所有稀疏数据点
            for (const point of sparseData) {
                const dx = point.lon - lon;
                const dy = point.lat - lat;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // 只考虑影响范围内的点
                if (distance < maxDistance) {
                    // 如果距离很近，直接使用该点的值
                    const weight = distance < 0.01 ? 1e6 : 1.0 / Math.pow(distance, power);
                    sumU += point.u * weight;
                    sumV += point.v * weight;
                    sumWeight += weight;
                }
            }
            
            const index = j * nx + i;
            if (sumWeight > 0) {
                uData[index] = sumU / sumWeight;
                vData[index] = sumV / sumWeight;
                interpolatedCount++;
            } else {
                // 没有附近的点，设为0
                uData[index] = 0;
                vData[index] = 0;
            }
        }
    }
    
    console.log('   - 插值完成，有效点数:', interpolatedCount);
    console.log('   - 覆盖率:', (interpolatedCount / (nx * ny) * 100).toFixed(2) + '%');
    
    // 计算插值后数据的 min/max
    let uMin = Infinity, uMax = -Infinity;
    let vMin = Infinity, vMax = -Infinity;
    for (let i = 0; i < uData.length; i++) {
        const u = uData[i];
        const v = vData[i];
        if (u < uMin) uMin = u;
        if (u > uMax) uMax = u;
        if (v < vMin) vMin = v;
        if (v > vMax) vMax = v;
    }
    
    // 返回 cesium-wind-layer 格式
    const result = {
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
        width: nx,
        height: ny,
        bounds: {
            west: bounds.west,
            south: bounds.south,
            east: bounds.east,
            north: bounds.north
        }
    };
    
    console.log('✅ 数据转换完成');
    console.log('   - U 范围:', result.u.min.toFixed(2), '~', result.u.max.toFixed(2));
    console.log('   - V 范围:', result.v.min.toFixed(2), '~', result.v.max.toFixed(2));
    
    return result;
}

/**
 * 创建 WindLayer 实例
 * @param {Cesium.Viewer} viewer - Cesium Viewer 实例
 * @param {Object} windData - 风场数据
 * @param {Object} options - 配置选项
 * @returns {Promise<WindLayer>} WindLayer 实例
 */
export async function createWindLayer(viewer, windData, options = {}) {
    console.log('🌬️ 创建 WindLayer 实例...');
    
    // 确保插件已加载
    const WindLayerClass = await loadWindLayerPlugin();
    
    // 转换数据格式
    const formattedData = convertToWindLayerFormat(windData);
    
    // 优化后的默认配置
    const defaultOptions = {
        particleSystemOptions: {
            maxParticles: 128 * 128,    // 增加粒子数量（16384个）
            particleHeight: 1000.0,     // 提高粒子高度
            fadeOpacity: 0.98,          // 降低淡出速度，轨迹更长
            dropRate: 0.002,            // 降低掉落率，粒子存活更久
            dropRateBump: 0.005,        // 掉落率增量
            speedFactor: 0.5,           // 降低速度因子，运动更平滑
            lineWidth: 2.0              // 线宽
        },
        // 颜色映射：从蓝色（低速）到红色（高速）
        colorScale: [
            "rgb(36,104,180)",   // 0 m/s - 深蓝
            "rgb(60,157,194)",   // 蓝
            "rgb(128,205,193)",  // 青
            "rgb(151,218,168)",  // 绿
            "rgb(198,231,181)",  // 浅绿
            "rgb(238,247,217)",  // 黄绿
            "rgb(255,238,159)",  // 黄
            "rgb(252,217,125)",  // 橙黄
            "rgb(255,182,100)",  // 橙
            "rgb(252,150,75)",   // 深橙
            "rgb(250,112,52)",   // 红橙
            "rgb(245,64,32)",    // 红
            "rgb(237,45,28)",    // 深红
            "rgb(220,24,32)"     // 暗红
        ]
    };
    
    // 合并用户配置
    const finalOptions = {
        ...defaultOptions,
        ...options
    };
    
    console.log('   - 配置:', finalOptions);
    
    try {
        // 创建 WindLayer 实例
        const windLayer = new WindLayerClass(viewer, formattedData, finalOptions);
        
        console.log('✅ WindLayer 创建成功');
        console.log('   - 类型:', windLayer.constructor.name);
        console.log('   - 方法:', Object.getOwnPropertyNames(Object.getPrototypeOf(windLayer)));
        
        return windLayer;
    } catch (error) {
        console.error('❌ WindLayer 创建失败:', error);
        throw error;
    }
}

/**
 * WindLayer 包装类（提供统一接口）
 */
export class CesiumWindLayerWrapper {
    constructor(viewer, windData, options = {}) {
        this.viewer = viewer;
        this.windLayer = null;
        this.isVisible = false;
        this._initPromise = null;
        
        // 异步创建 WindLayer
        this._initPromise = this._init(viewer, windData, options);
    }
    
    async _init(viewer, windData, options) {
        try {
            this.windLayer = await createWindLayer(viewer, windData, options);
            console.log('✅ CesiumWindLayerWrapper 初始化完成');
        } catch (error) {
            console.error('❌ CesiumWindLayerWrapper 初始化失败:', error);
            throw error;
        }
    }
    
    async waitForInit() {
        await this._initPromise;
    }
    
    /**
     * 显示风场
     */
    async showLayer() {
        await this.waitForInit();
        if (this.windLayer) {
            this.windLayer.show = true;
            this.isVisible = true;
            console.log('✅ 风场已显示');
        }
    }
    
    /**
     * 隐藏风场
     */
    async hideLayer() {
        await this.waitForInit();
        if (this.windLayer) {
            this.windLayer.show = false;
            this.isVisible = false;
            console.log('✅ 风场已隐藏');
        }
    }
    
    /**
     * 移除风场
     */
    async remove() {
        await this.waitForInit();
        if (this.windLayer) {
            this.windLayer.remove();
            this.windLayer = null;
            this.isVisible = false;
            console.log('✅ 风场已移除');
        }
    }
    
    /**
     * 设置显示状态（兼容接口）
     */
    set show(value) {
        if (value) {
            this.showLayer();
        } else {
            this.hideLayer();
        }
    }
    
    get show() {
        return this.isVisible;
    }
}
