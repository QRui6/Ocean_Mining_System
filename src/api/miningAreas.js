/**
 * 矿区数据API
 * 封装所有矿区相关的API请求
 */

import { API_ENDPOINTS, REQUEST_TIMEOUT } from './config.js';

/**
 * 获取矿区GeoJSON数据
 * @returns {Promise<Object>} GeoJSON FeatureCollection
 */
export async function fetchMiningAreasGeoJSON() {
    try {
        console.log('📡 请求矿区GeoJSON数据:', API_ENDPOINTS.MINING_AREAS.GEOJSON);
        
        const response = await fetch(API_ENDPOINTS.MINING_AREAS.GEOJSON, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(REQUEST_TIMEOUT)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ 矿区GeoJSON数据加载成功:', {
            type: data.type,
            features: data.features?.length
        });
        
        return data;
    } catch (error) {
        console.error('❌ 加载矿区GeoJSON数据失败:', error);
        throw error;
    }
}

/**
 * 获取矿区列表
 * @returns {Promise<Array>} 矿区列表
 */
export async function fetchMiningAreasList() {
    try {
        console.log('📡 请求矿区列表:', API_ENDPOINTS.MINING_AREAS.LIST);
        
        const response = await fetch(API_ENDPOINTS.MINING_AREAS.LIST, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(REQUEST_TIMEOUT)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ 矿区列表加载成功:', data.length, '个矿区');
        
        return data;
    } catch (error) {
        console.error('❌ 加载矿区列表失败:', error);
        throw error;
    }
}

/**
 * 根据ID获取矿区详情
 * @param {string} areaId - 矿区ID
 * @returns {Promise<Object>} 矿区详情
 */
export async function fetchMiningAreaById(areaId) {
    try {
        const url = API_ENDPOINTS.MINING_AREAS.BY_ID(areaId);
        console.log('📡 请求矿区详情:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(REQUEST_TIMEOUT)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ 矿区详情加载成功:', data);
        
        return data;
    } catch (error) {
        console.error('❌ 加载矿区详情失败:', error);
        throw error;
    }
}

/**
 * 获取所有矿区类别
 * @returns {Promise<Array>} 类别列表
 */
export async function fetchMiningCategories() {
    try {
        console.log('📡 请求矿区类别:', API_ENDPOINTS.MINING_AREAS.CATEGORIES);
        
        const response = await fetch(API_ENDPOINTS.MINING_AREAS.CATEGORIES, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(REQUEST_TIMEOUT)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ 矿区类别加载成功:', data);
        
        return data;
    } catch (error) {
        console.error('❌ 加载矿区类别失败:', error);
        throw error;
    }
}

/**
 * 获取所有赞助商
 * @returns {Promise<Array>} 赞助商列表
 */
export async function fetchMiningSponsors() {
    try {
        console.log('📡 请求赞助商列表:', API_ENDPOINTS.MINING_AREAS.SPONSORS);
        
        const response = await fetch(API_ENDPOINTS.MINING_AREAS.SPONSORS, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(REQUEST_TIMEOUT)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ 赞助商列表加载成功:', data);
        
        return data;
    } catch (error) {
        console.error('❌ 加载赞助商列表失败:', error);
        throw error;
    }
}

/**
 * 按类别查询矿区
 * @param {string} category - 类别名称
 * @returns {Promise<Array>} 矿区列表
 */
export async function fetchMiningAreasByCategory(category) {
    try {
        const url = API_ENDPOINTS.MINING_AREAS.BY_CATEGORY(category);
        console.log('📡 按类别查询矿区:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(REQUEST_TIMEOUT)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ 按类别查询成功:', data.length, '个矿区');
        
        return data;
    } catch (error) {
        console.error('❌ 按类别查询失败:', error);
        throw error;
    }
}

/**
 * 按赞助商查询矿区
 * @param {string} sponsor - 赞助商名称
 * @returns {Promise<Array>} 矿区列表
 */
export async function fetchMiningAreasBySponsor(sponsor) {
    try {
        const url = API_ENDPOINTS.MINING_AREAS.BY_SPONSOR(sponsor);
        console.log('📡 按赞助商查询矿区:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(REQUEST_TIMEOUT)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ 按赞助商查询成功:', data.length, '个矿区');
        
        return data;
    } catch (error) {
        console.error('❌ 按赞助商查询失败:', error);
        throw error;
    }
}
