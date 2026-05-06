/**
 * API配置文件
 * 统一管理后端API地址
 */

// 后端API基础URL
// 开发环境：使用空字符串（Vite代理会自动转发/api请求）
// 生产环境：使用完整URL
export const API_BASE_URL = import.meta.env.DEV 
    ? ''  // 开发环境：相对路径，通过Vite代理
    : (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8081');  // 生产环境：完整URL

// API端点配置
export const API_ENDPOINTS = {
    // 矿区数据接口
    MINING_AREAS: {
        GEOJSON: `${API_BASE_URL}/api/mining-areas/geojson`,           // 获取GeoJSON格式数据
        LIST: `${API_BASE_URL}/api/mining-areas`,                      // 获取列表
        BY_ID: (id) => `${API_BASE_URL}/api/mining-areas/${id}`,       // 根据ID查询
        BY_CATEGORY: (category) => `${API_BASE_URL}/api/mining-areas/category/${category}`, // 按类别查询
        BY_SPONSOR: (sponsor) => `${API_BASE_URL}/api/mining-areas/sponsor/${sponsor}`,     // 按赞助商查询
        CATEGORIES: `${API_BASE_URL}/api/mining-areas/categories`,     // 获取所有类别
        SPONSORS: `${API_BASE_URL}/api/mining-areas/sponsors`,         // 获取所有赞助商
        IMPORT: `${API_BASE_URL}/api/mining-areas/import`              // 导入数据
    },
    
    // 气象数据接口
    WEATHER: {
        METADATA: (type) => `${API_BASE_URL}/api/weather/metadata/${type}`,           // 获取元数据
        DATA: (type, timeIndex) => `${API_BASE_URL}/api/weather/data/${type}/${timeIndex}`, // 获取数据
        BINARY: (type, timeIndex) => `${API_BASE_URL}/api/weather/data/${type}/${timeIndex}/binary`, // 二进制数据
        AVAILABLE: (type) => `${API_BASE_URL}/api/weather/available/${type}`,         // 可用时间索引
        POINT_QUERY: `${API_BASE_URL}/api/weather/point-query`,                       // 点查询
        TIME_SERIES: `${API_BASE_URL}/api/weather/point-query/time-series`            // 时间序列查询
    },
    
    // 监控区域接口
    AREAS: {
        LIST: `${API_BASE_URL}/api/areas`,                             // 获取区域列表
        CREATE: `${API_BASE_URL}/api/areas`,                           // 创建区域
        DELETE: (id) => `${API_BASE_URL}/api/areas/${id}`,             // 删除区域
        SHIPS: (id) => `${API_BASE_URL}/api/areas/${id}/ships`,        // 获取区域内船舶
        EVENTS: (id) => `${API_BASE_URL}/api/areas/${id}/events`       // 获取区域事件
    },
    
    // WebSocket连接
    WEBSOCKET: `ws://127.0.0.1:8081/ws`
};

// 请求超时配置（毫秒）
export const REQUEST_TIMEOUT = 30000;

// 请求重试配置
export const RETRY_CONFIG = {
    maxRetries: 3,
    retryDelay: 1000
};
