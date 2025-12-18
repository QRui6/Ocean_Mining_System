/**
 * 船讯网 API 封装
 * 文档：https://api.shipxy.com/apicall/v3/
 */

// 开发环境使用代理，生产环境直接调用
const API_BASE = import.meta.env.DEV 
    ? '/api/shipxy/apicall/v3'  // 开发环境：通过Vite代理
    : 'https://api.shipxy.com/apicall/v3';  // 生产环境：直接调用

const API_KEY = import.meta.env.VITE_SHIPXY_API_KEY || '12687430e166478dba18ab327fd066a2';

/**
 * 通用请求函数
 */
async function request(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 0) {
            return { success: true, data: data.data };
        } else {
            return { success: false, error: data.msg || '请求失败' };
        }
    } catch (error) {
        console.error('API请求错误:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 常见船舶名称与MMSI映射表（示例数据）
 * 实际项目中应该从数据库或API获取
 */
const SHIP_NAME_MAPPING = {
    'WANHONGYUAN369': 413961925,
    '皖鸿远369': 413961925,
    'COSCO PISCES': 477232800,
    'YIJING1026': 413961926,
    // 可以继续添加更多船舶...
};

/**
 * 按船名搜索MMSI
 * @param {string} shipName - 船舶名称
 * @returns {number|null} MMSI编号
 */
function searchMmsiByName(shipName) {
    const name = shipName.toUpperCase().trim();
    
    // 精确匹配
    if (SHIP_NAME_MAPPING[name]) {
        return SHIP_NAME_MAPPING[name];
    }
    
    // 模糊匹配
    for (const [key, mmsi] of Object.entries(SHIP_NAME_MAPPING)) {
        if (key.includes(name) || name.includes(key)) {
            return mmsi;
        }
    }
    
    return null;
}

/**
 * 单船位置查询
 * @param {number} mmsi - 船舶MMSI编号（9位数字）
 * @returns {Promise<Object>} 船舶信息
 */
export async function getSingleShip(mmsi) {
    const url = `${API_BASE}/GetSingleShip?key=${API_KEY}&mmsi=${mmsi}`;
    return await request(url);
}

/**
 * 按船名搜索船舶
 * @param {string} shipName - 船舶名称
 * @returns {Promise<Object>} 船舶信息
 */
export async function searchShipByName(shipName) {
    // 先从映射表中查找MMSI
    const mmsi = searchMmsiByName(shipName);
    
    if (mmsi) {
        // 找到MMSI，调用单船查询
        return await getSingleShip(mmsi);
    } else {
        // 未找到，返回错误
        return { 
            success: false, 
            error: `未找到船舶"${shipName}"，请使用MMSI搜索或联系管理员添加该船舶` 
        };
    }
}

/**
 * 多船位置查询
 * @param {Array<number>} mmsiList - MMSI列表（最多100个）
 * @returns {Promise<Object>} 船舶信息数组
 */
export async function getManyShip(mmsiList) {
    const mmsis = mmsiList.join(',');
    const url = `${API_BASE}/GetManyShip?key=${API_KEY}&mmsis=${mmsis}`;
    return await request(url);
}

/**
 * 船队查询
 * @param {string} fleetId - 船队ID
 * @returns {Promise<Object>} 船队中的船舶信息
 */
export async function getFleetShip(fleetId) {
    const url = `${API_BASE}/GetFleetShip?key=${API_KEY}&fleet_id=${fleetId}`;
    return await request(url);
}

/**
 * 历史轨迹查询
 * @param {number} mmsi - 船舶MMSI
 * @param {number} startTime - 开始时间（Unix时间戳）
 * @param {number} endTime - 结束时间（Unix时间戳）
 * @returns {Promise<Object>} 轨迹点数组
 */
export async function getShipTrack(mmsi, startTime, endTime) {
    const url = `${API_BASE}/GetShipTrack?key=${API_KEY}&mmsi=${mmsi}&start_time=${startTime}&end_time=${endTime}`;
    return await request(url);
}

/**
 * 港到港航线规划
 * @param {string} startPortCode - 出发港代码（5位）
 * @param {string} endPortCode - 到达港代码（5位）
 * @param {string} avoid - 绕航节点（可选）
 * @param {string} through - 途经点（可选）
 * @returns {Promise<Object>} 航线信息
 */
export async function planRouteByPort(startPortCode, endPortCode, avoid = '', through = '') {
    let url = `${API_BASE}/PlanRouteByPort?key=${API_KEY}&start_port_code=${startPortCode}&end_port_code=${endPortCode}`;
    if (avoid) url += `&avoid=${avoid}`;
    if (through) url += `&through=${through}`;
    return await request(url);
}

/**
 * 点位气象查询
 * @param {number} lng - 经度
 * @param {number} lat - 纬度
 * @param {number} weatherTime - 时间（Unix时间戳，可选）
 * @returns {Promise<Object>} 气象数据
 */
export async function getWeatherByPoint(lng, lat, weatherTime = null) {
    let url = `${API_BASE}/GetWeatherByPoint?key=${API_KEY}&lng=${lng}&lat=${lat}`;
    if (weatherTime) url += `&weather_time=${weatherTime}`;
    return await request(url);
}

/**
 * 海区气象查询
 * @param {number} weatherType - 区域类型（0:全部, 1:沿岸, 2:近海, 3:远海）
 * @returns {Promise<Object>} 海区气象数据
 */
export async function getWeather(weatherType = 0) {
    const url = `${API_BASE}/GetWeather?key=${API_KEY}&weather_type=${weatherType}`;
    return await request(url);
}

/**
 * 查询全球台风列表
 * @returns {Promise<Object>} 台风列表
 */
export async function getAllTyphoon() {
    const url = `${API_BASE}/GetAllTyphoon?key=${API_KEY}`;
    return await request(url);
}

/**
 * 查询单个台风详情
 * @param {string} typhoonId - 台风ID
 * @returns {Promise<Object>} 台风详细信息
 */
export async function getSingleTyphoon(typhoonId) {
    const url = `${API_BASE}/GetSingleTyphoon?key=${API_KEY}&typhoon_id=${typhoonId}`;
    return await request(url);
}
