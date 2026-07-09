/**
 * 矿区气象监测API
 */

const API_BASE_URL = 'http://172.25.113.128:8082/api/mining-monitoring';

/**
 * 添加矿区到监测列表
 * @param {Object} data - 监测数据
 * @param {Number} data.miningAreaId - 矿区ID
 * @param {Number} data.windSpeedThreshold - 风速阈值
 * @param {Number} data.waveHeightThreshold - 浪高阈值
 * @param {Number} data.currentSpeedThreshold - 洋流阈值
 * @returns {Promise<Object>}
 */
export async function addMiningMonitoring(data) {
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('添加矿区监测失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 获取所有监测列表
 * @returns {Promise<Object>}
 */
export async function getMiningMonitoringList() {
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('获取监测列表失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 移除监测
 * @param {Number} id - 监测记录ID
 * @returns {Promise<Object>}
 */
export async function removeMiningMonitoring(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('移除监测失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 根据矿区ID移除监测
 * @param {Number} miningAreaId - 矿区ID
 * @returns {Promise<Object>}
 */
export async function removeMiningMonitoringByAreaId(miningAreaId) {
    try {
        const response = await fetch(`${API_BASE_URL}/area/${miningAreaId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('移除监测失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 更新阈值
 * @param {Number} id - 监测记录ID
 * @param {Object} thresholds - 阈值数据
 * @returns {Promise<Object>}
 */
export async function updateMiningMonitoringThresholds(id, thresholds) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}/thresholds`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(thresholds)
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('更新阈值失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
