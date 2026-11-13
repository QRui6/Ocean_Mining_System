/**
 * 风场时间序列管理器
 */

export class WindTimeline {
    constructor() {
        this.cache = new Map(); // 缓存已加载的数据
        this.currentTime = null;
        this.timeRange = {
            start: null,  // 最早时间
            end: null     // 最晚时间
        };
    }
    
    /**
     * 初始化时间范围（过去3天 + 未来7天）
     */
    async init() {
        const now = new Date();
        this.currentTime = this.roundToHour(now, 0); // 当前整点
        
        // 过去3天
        this.timeRange.start = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        // 未来7天
        this.timeRange.end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        // 预加载当前时间的数据
        await this.loadTimeData(this.currentTime);
    }
    
    /**
     * 加载指定时间的风场数据
     */
    async loadTimeData(time) {
        const key = this.formatTimeKey(time);
        
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        
        try {
            const filename = `wind_${key}.json`;
            const response = await fetch(`/data/wind_timeline/${filename}`);
            
            if (!response.ok) {
                // 如果文件不存在，使用默认数据
                console.warn(`数据文件不存在: ${filename}，使用默认数据`);
                return this.getDefaultData();
            }
            
            const data = await response.json();
            this.cache.set(key, data);
            return data;
        } catch (error) {
            console.error('加载风场数据失败:', error);
            return this.getDefaultData();
        }
    }
    
    /**
     * 获取默认数据（当前的 wind_data_0701.json）
     */
    async getDefaultData() {
        const response = await fetch('/data/wind_data_0701.json');
        return await response.json();
    }
    
    /**
     * 切换到指定时间
     */
    async setTime(time) {
        this.currentTime = time;
        return await this.loadTimeData(time);
    }
    
    /**
     * 前进一个时间步长（3小时）
     */
    async stepForward() {
        const newTime = new Date(this.currentTime.getTime() + 3 * 60 * 60 * 1000);
        if (newTime <= this.timeRange.end) {
            return await this.setTime(newTime);
        }
        return null;
    }
    
    /**
     * 后退一个时间步长（3小时）
     */
    async stepBackward() {
        const newTime = new Date(this.currentTime.getTime() - 3 * 60 * 60 * 1000);
        if (newTime >= this.timeRange.start) {
            return await this.setTime(newTime);
        }
        return null;
    }
    
    /**
     * 获取所有可用时间点
     */
    getAvailableTimes() {
        const times = [];
        let current = new Date(this.timeRange.start);
        
        while (current <= this.timeRange.end) {
            times.push(new Date(current));
            current = new Date(current.getTime() + 3 * 60 * 60 * 1000);
        }
        
        return times;
    }
    
    /**
     * 格式化时间为文件名键（YYYY-MM-DD_HH）
     */
    formatTimeKey(time) {
        const year = time.getFullYear();
        const month = String(time.getMonth() + 1).padStart(2, '0');
        const day = String(time.getDate()).padStart(2, '0');
        const hour = String(time.getHours()).padStart(2, '0');
        return `${year}-${month}-${day}_${hour}`;
    }
    
    /**
     * 将时间取整到指定小时
     */
    roundToHour(time, hour) {
        const rounded = new Date(time);
        rounded.setHours(hour, 0, 0, 0);
        return rounded;
    }
}
