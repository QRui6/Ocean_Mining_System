/**
 * 气象预警服务
 * 监测区域内的气象数据，当超过阈值时触发预警
 */

import { ElNotification } from 'element-plus';

class WeatherWarningService {
    constructor() {
        this.monitoringAreas = new Map(); // 正在监控的区域
        this.warnings = new Map();        // 当前的预警信息
        this.checkInterval = null;        // 定时检查任务
        this.checkIntervalMs = 60000;     // 检查间隔：60秒
    }
    
    /**
     * 开始监控区域
     * @param {Object} area - 区域信息 { id, name, polygon, thresholds }
     */
    startMonitoring(area) {
        console.log('🔔 开始监控区域:', area.name);
        
        this.monitoringAreas.set(area.id, {
            ...area,
            lastCheck: null,
            warningCount: 0
        });
        
        // 如果还没有启动定时检查，启动它
        if (!this.checkInterval) {
            this.startPeriodicCheck();
        }
        
        // 立即执行一次检查
        this.checkArea(area.id);
    }
    
    /**
     * 停止监控区域
     * @param {String} areaId - 区域ID
     */
    stopMonitoring(areaId) {
        console.log('🔕 停止监控区域:', areaId);
        
        this.monitoringAreas.delete(areaId);
        this.warnings.delete(areaId);
        
        // 如果没有监控区域了，停止定时检查
        if (this.monitoringAreas.size === 0 && this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
    
    /**
     * 启动定时检查
     */
    startPeriodicCheck() {
        console.log('⏰ 启动定时气象检查，间隔:', this.checkIntervalMs / 1000, '秒');
        
        this.checkInterval = setInterval(() => {
            this.checkAllAreas();
        }, this.checkIntervalMs);
    }
    
    /**
     * 检查所有监控区域
     */
    async checkAllAreas() {
        console.log('🔍 检查所有监控区域，共', this.monitoringAreas.size, '个');
        
        for (const [areaId, area] of this.monitoringAreas) {
            await this.checkArea(areaId);
        }
    }
    
    /**
     * 检查单个区域的气象数据
     * @param {String} areaId - 区域ID
     */
    async checkArea(areaId) {
        const area = this.monitoringAreas.get(areaId);
        if (!area) return;
        
        try {
            console.log('🌦️ 检查区域气象:', area.name);
            
            // 查询区域气象数据
            const weatherData = await this.queryAreaWeather(area.polygon);
            
            // 更新最后检查时间
            area.lastCheck = new Date();
            
            // 检查是否超过阈值
            const warnings = this.checkThresholds(area, weatherData);
            
            if (warnings.length > 0) {
                // 有预警，保存并通知
                this.warnings.set(areaId, warnings);
                area.warningCount = warnings.length;
                this.notifyWarnings(area, warnings);
            } else {
                // 无预警，清除之前的预警
                if (this.warnings.has(areaId)) {
                    this.warnings.delete(areaId);
                    area.warningCount = 0;
                    console.log('✅ 区域气象正常:', area.name);
                }
            }
            
        } catch (err) {
            console.error('❌ 检查区域气象失败:', err);
        }
    }
    
    /**
     * 查询区域气象数据
     * @param {Array} polygon - 多边形坐标 [[lng, lat], ...]
     * @returns {Promise<Object>} 气象数据
     */
    async queryAreaWeather(polygon) {
        const response = await fetch('/api/copernicus/query-area', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                polygon: polygon,
                timeIndex: 0
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || '查询气象数据失败');
        }
        
        return result.data;
    }
    
    /**
     * 检查气象数据是否超过阈值
     * @param {Object} area - 区域信息
     * @param {Object} weatherData - 气象数据
     * @returns {Array} 预警列表
     */
    checkThresholds(area, weatherData) {
        const warnings = [];
        const thresholds = area.thresholds || {};
        const data = weatherData.data;
        
        // 检查风速
        if (thresholds.windSpeed && data.windSpeed > thresholds.windSpeed) {
            warnings.push({
                type: 'wind',
                level: this.getWarningLevel(data.windSpeed, thresholds.windSpeed),
                message: `风速 ${data.windSpeed.toFixed(1)} m/s 超过阈值 ${thresholds.windSpeed} m/s`,
                value: data.windSpeed,
                threshold: thresholds.windSpeed,
                direction: data.windDirection
            });
        }
        
        // 检查浪高
        if (thresholds.waveHeight && data.waveHeight > thresholds.waveHeight) {
            warnings.push({
                type: 'wave',
                level: this.getWarningLevel(data.waveHeight, thresholds.waveHeight),
                message: `浪高 ${data.waveHeight.toFixed(1)} m 超过阈值 ${thresholds.waveHeight} m`,
                value: data.waveHeight,
                threshold: thresholds.waveHeight,
                direction: data.waveDirection
            });
        }
        
        // 检查洋流速度
        if (thresholds.currentSpeed && data.currentSpeed > thresholds.currentSpeed) {
            warnings.push({
                type: 'current',
                level: this.getWarningLevel(data.currentSpeed, thresholds.currentSpeed),
                message: `洋流速度 ${data.currentSpeed.toFixed(2)} m/s 超过阈值 ${thresholds.currentSpeed} m/s`,
                value: data.currentSpeed,
                threshold: thresholds.currentSpeed,
                direction: data.currentDirection
            });
        }
        
        return warnings;
    }
    
    /**
     * 计算预警等级
     * @param {Number} value - 实际值
     * @param {Number} threshold - 阈值
     * @returns {String} 预警等级：'warning'（黄色）或 'danger'（红色）
     */
    getWarningLevel(value, threshold) {
        const ratio = value / threshold;
        if (ratio >= 1.5) return 'danger';   // 超过阈值50%以上：红色预警
        if (ratio >= 1.2) return 'warning';  // 超过阈值20%以上：黄色预警
        return 'info';                       // 刚超过阈值：蓝色提示
    }
    
    /**
     * 发送预警通知
     * @param {Object} area - 区域信息
     * @param {Array} warnings - 预警列表
     */
    notifyWarnings(area, warnings) {
        console.log('⚠️ 触发预警:', area.name, warnings);
        
        // 构建预警消息
        const warningMessages = warnings.map(w => w.message).join('\n');
        
        // 确定预警等级（取最高等级）
        const maxLevel = warnings.reduce((max, w) => {
            if (w.level === 'danger') return 'danger';
            if (w.level === 'warning' && max !== 'danger') return 'warning';
            return max;
        }, 'info');
        
        // 显示通知
        ElNotification({
            title: `⚠️ 气象预警 - ${area.name}`,
            message: warningMessages,
            type: maxLevel === 'danger' ? 'error' : 'warning',
            duration: 0, // 不自动关闭
            position: 'top-right'
        });
    }
    
    /**
     * 获取区域的预警信息
     * @param {String} areaId - 区域ID
     * @returns {Array} 预警列表
     */
    getWarnings(areaId) {
        return this.warnings.get(areaId) || [];
    }
    
    /**
     * 获取所有预警
     * @returns {Map} 所有预警信息
     */
    getAllWarnings() {
        return this.warnings;
    }
    
    /**
     * 获取监控区域的预警计数
     * @param {String} areaId - 区域ID
     * @returns {Number} 预警数量
     */
    getWarningCount(areaId) {
        const area = this.monitoringAreas.get(areaId);
        return area ? area.warningCount : 0;
    }
}

// 导出单例
export const weatherWarningService = new WeatherWarningService();
