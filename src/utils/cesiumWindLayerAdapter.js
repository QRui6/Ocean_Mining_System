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
 * @param {Object} windData - 从 windDataLoader 加载的稀疏数据
 * @returns {Object} cesium-wind-layer 兼容的数据格式
 */
export function convertToWindLayerFormat(windData) {
    console.log('🔄 开始转换数据格式...');
    console.log('   - 输入数据点数:', windData.sparseData?.length);
    
    const { sparseData, bounds } = windData;
    
    // 确定网格分辨率（1度）
    const resolution = 1.0;
    
    // 计算网格尺寸
    const nx = Math.ceil((bounds.east - bounds.west) / resolution) + 1;
    const ny = Math.ceil((bounds.north - bounds.south) / resolution) + 1;
    
    console.log('   - 网格尺寸:', nx, 'x', ny, '=', nx * ny, '个点');
    
    // 创建网格数组
    const uData = new Float32Array(nx * ny);
    const vData = new Float32Array(nx * ny);
    
    // 初始化为 NaN（表示无数据）
    uData.fill(NaN);
    vData.fill(NaN);
    
    // 填充数据到网格
    let filledCount = 0;
    for (const point of sparseData) {
        // 计算网格索引
        const i = Math.round((point.lon - bounds.west) / resolution);
        const j = Math.round((point.lat - bounds.south) / resolution);
        
        // 边界检查
        if (i >= 0 && i < nx && j >= 0 && j < ny) {
            const index = j * nx + i;
            uData[index] = point.u;
            vData[index] = point.v;
            filledCount++;
        }
    }
    
    console.log('   - 填充数据点:', filledCount);
    console.log('   - 覆盖率:', (filledCount / (nx * ny) * 100).toFixed(2) + '%');
    
    // 计算 min/max（避免栈溢出）
    let uMin = Infinity, uMax = -Infinity;
    let vMin = Infinity, vMax = -Infinity;
    for (const point of sparseData) {
        if (point.u < uMin) uMin = point.u;
        if (point.u > uMax) uMax = point.u;
        if (point.v < vMin) vMin = point.v;
        if (point.v > vMax) vMax = point.v;
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
    
    // 默认配置（根据插件文档）
    const defaultOptions = {
        particlesTextureSize: 64,      // 粒子纹理大小（64x64 = 4096个粒子）
        particleHeight: 100.0,         // 粒子高度（米）
        lineWidth: { min: 1, max: 2 }, // 线宽范围
        lineLength: { min: 20, max: 100 }, // 线长范围
        speedFactor: 1.0,              // 速度因子
        dropRate: 0.003,               // 粒子重生率
        dropRateBump: 0.001,           // 粒子重生率增量
        colors: ['white'],             // 粒子颜色
        flipY: false,                  // 是否翻转Y坐标
        dynamic: true                  // 启用动态动画
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
