/**
 * API配置文件
 * 统一管理后端API地址
 */

// 后端API基础URL
// 开发环境：使用空字符串（Vite代理会自动转发/api请求）
// 生产环境：使用完整URL
export const API_BASE_URL = import.meta.env.DEV 
    ? ''  // 开发环境：相对路径，通过Vite代理
    : (import.meta.env.VITE_API_BASE_URL || 'http://172.25.113.128:8082');  // 生产环境：完整URL

// 矿区总览区域统计接口基础URL
// 开发环境：复用Vite代理
// 生产环境：默认走独立的 8082 服务，可通过环境变量覆盖
export const MINING_OVERVIEW_API_BASE_URL = import.meta.env.DEV
    ? ''
    : (import.meta.env.VITE_MINING_OVERVIEW_API_BASE_URL || 'http://172.25.113.128:8082');

// API端点配置
export const API_ENDPOINTS = {
    // 矿区数据接口
    MINING_AREAS: {
        GEOJSON: `${API_BASE_URL}/api/mining-areas/geojson`,           // 获取GeoJSON格式数据
        LIST: `${API_BASE_URL}/api/mining-areas`,                      // 获取列表
        BY_ID: (id) => `${API_BASE_URL}/api/mining-areas/${id}`,       // 根据ID查询
        OVERVIEW: (id) => `${API_BASE_URL}/api/mining-areas/${id}/overview`, // 矿区总览详情
        TYPHOON_SUMMARY: (id, params = {}) => {
            const url = new URL(`${API_BASE_URL || window.location.origin}/api/mining-areas/${id}/typhoon/summary`, window.location.origin);
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    url.searchParams.set(key, value);
                }
            });
            return API_BASE_URL ? url.toString() : `${url.pathname}${url.search}`;
        },
        TYPHOON_EVENTS: (id, params = {}) => {
            const url = new URL(`${API_BASE_URL || window.location.origin}/api/mining-areas/${id}/typhoon/events`, window.location.origin);
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    url.searchParams.set(key, value);
                }
            });
            return API_BASE_URL ? url.toString() : `${url.pathname}${url.search}`;
        },
        TYPHOON_YEARLY: (id, params = {}) => {
            const url = new URL(`${API_BASE_URL || window.location.origin}/api/mining-areas/${id}/typhoon/stats/yearly`, window.location.origin);
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    url.searchParams.set(key, value);
                }
            });
            return API_BASE_URL ? url.toString() : `${url.pathname}${url.search}`;
        },
        BY_CATEGORY: (category) => `${API_BASE_URL}/api/mining-areas/category/${category}`, // 按类别查询
        BY_SPONSOR: (sponsor) => `${API_BASE_URL}/api/mining-areas/sponsor/${sponsor}`,     // 按赞助商查询
        CATEGORIES: `${API_BASE_URL}/api/mining-areas/categories`,     // 获取所有类别
        SPONSORS: `${API_BASE_URL}/api/mining-areas/sponsors`,         // 获取所有赞助商
        IMPORT: `${API_BASE_URL}/api/mining-areas/import`              // 导入数据
    },

    MINING_REGIONS: {
        TYPHOON_EVENTS: (id, params = {}) => {
            const url = new URL(`${API_BASE_URL || window.location.origin}/api/mining-regions/${id}/typhoon/events`, window.location.origin);
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    url.searchParams.set(key, value);
                }
            });
            return API_BASE_URL ? url.toString() : `${url.pathname}${url.search}`;
        }
    },

    // 矿区总览区域统计接口
    MINING_OVERVIEW: {
        REGIONS: `${MINING_OVERVIEW_API_BASE_URL}/api/mining-overview/regions`,
        REGION_BY_ID: (regionId) => `${MINING_OVERVIEW_API_BASE_URL}/api/mining-overview/regions?id=${encodeURIComponent(regionId)}`,
        REGION_DAILY: (regionId) => `${MINING_OVERVIEW_API_BASE_URL}/api/mining-overview/regions/${regionId}/daily`,
        REGION_HOURLY: (regionId, forecastDate) => {
            const baseUrl = `${MINING_OVERVIEW_API_BASE_URL}/api/mining-overview/regions/${regionId}/hourly`;
            return forecastDate
                ? `${baseUrl}?forecastDate=${encodeURIComponent(forecastDate)}`
                : baseUrl;
        },
        SITES: (regionId) => {
            const baseUrl = `${MINING_OVERVIEW_API_BASE_URL}/api/mining-overview/sites`;
            return regionId
                ? `${baseUrl}?regionId=${encodeURIComponent(regionId)}`
                : baseUrl;
        },
        SITE_DAILY: (siteId) => `${MINING_OVERVIEW_API_BASE_URL}/api/mining-overview/sites/${siteId}/daily`,
        SITE_HOURLY: (siteId, forecastDate) => {
            const baseUrl = `${MINING_OVERVIEW_API_BASE_URL}/api/mining-overview/sites/${siteId}/hourly`;
            return forecastDate
                ? `${baseUrl}?forecastDate=${encodeURIComponent(forecastDate)}`
                : baseUrl;
        }
    },

    HISTORICAL_WIND: {
        POINT_QUERY: (params = {}) => {
            const url = new URL(`${API_BASE_URL || window.location.origin}/api/historical-wind/point-query`, window.location.origin);
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    url.searchParams.set(key, value);
                }
            });
            return API_BASE_URL ? url.toString() : `${url.pathname}${url.search}`;
        },
        MONTHS: (params = {}) => {
            const url = new URL(`${API_BASE_URL || window.location.origin}/api/historical-wind/months`, window.location.origin);
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    url.searchParams.set(key, value);
                }
            });
            return API_BASE_URL ? url.toString() : `${url.pathname}${url.search}`;
        }
    },

    HISTORICAL_WAVE: {
        POINT_QUERY: (params = {}) => {
            const url = new URL(`${API_BASE_URL || window.location.origin}/api/historical-wave/point-query`, window.location.origin);
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    url.searchParams.set(key, value);
                }
            });
            return API_BASE_URL ? url.toString() : `${url.pathname}${url.search}`;
        },
        MONTHS: (params = {}) => {
            const url = new URL(`${API_BASE_URL || window.location.origin}/api/historical-wave/months`, window.location.origin);
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    url.searchParams.set(key, value);
                }
            });
            return API_BASE_URL ? url.toString() : `${url.pathname}${url.search}`;
        }
    },

    HISTORICAL_CURRENT: {
        POINT_QUERY: (params = {}) => {
            const url = new URL(`${API_BASE_URL || window.location.origin}/api/historical-current/point-query`, window.location.origin);
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    url.searchParams.set(key, value);
                }
            });
            return API_BASE_URL ? url.toString() : `${url.pathname}${url.search}`;
        },
        MONTHS: (params = {}) => {
            const url = new URL(`${API_BASE_URL || window.location.origin}/api/historical-current/months`, window.location.origin);
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    url.searchParams.set(key, value);
                }
            });
            return API_BASE_URL ? url.toString() : `${url.pathname}${url.search}`;
        }
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

    TYPHOONS: {
        TRACK: (sid, params = {}) => {
            const url = new URL(`${API_BASE_URL || window.location.origin}/api/typhoons/${sid}/track`, window.location.origin);
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    url.searchParams.set(key, value);
                }
            });
            return API_BASE_URL ? url.toString() : `${url.pathname}${url.search}`;
        }
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
    WEBSOCKET: `ws://172.25.113.128:8082/ws`
};

// 请求超时配置（毫秒）
export const REQUEST_TIMEOUT = 30000;

// 请求重试配置
export const RETRY_CONFIG = {
    maxRetries: 3,
    retryDelay: 1000
};
