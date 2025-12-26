/**
 * Windy Point Forecast API
 * 获取特定位置的气象预报数据（JSON格式）
 * 无需 Leaflet，直接在 Cesium 上渲染
 */

export class WindyPointForecast {
    constructor() {
        this.apiKey = import.meta.env.VITE_WINDY_API_KEY;
        this.baseUrl = 'https://api.windy.com/api/point-forecast/v2';
    }

    /**
     * 获取点位预报数据
     * @param {Number} lat - 纬度
     * @param {Number} lon - 经度
     * @param {Object} options - 选项
     * @returns {Promise<Object>} 预报数据
     */
    async getForecast(lat, lon, options = {}) {
        const {
            model = 'gfs',  // 数据模型: gfs, ecmwf, icon
            parameters = ['wind', 'temp', 'pressure', 'waves'], // 参数
            levels = ['surface'], // 高度层级
            key = this.apiKey
        } = options;

        try {
            console.log(`🌪️ 获取 Windy 预报数据: (${lat}, ${lon})`);

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    lat,
                    lon,
                    model,
                    parameters,
                    levels,
                    key
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ 预报数据获取成功');
            
            return this.parseData(data);

        } catch (error) {
            console.error('❌ 获取预报数据失败:', error);
            throw error;
        }
    }

    /**
     * 解析预报数据
     */
    parseData(data) {
        const parsed = {
            location: {
                lat: data.lat,
                lon: data.lon
            },
            model: data.model,
            timestamps: data.ts || [],
            wind: {
                speed: data['wind_u-surface'] || [],
                direction: data['wind_v-surface'] || []
            },
            temperature: data['temp-surface'] || [],
            pressure: data['pressure-surface'] || [],
            waves: data['waves-surface'] || []
        };

        console.log('📊 解析后的数据:', {
            时间点数量: parsed.timestamps.length,
            风速数据: parsed.wind.speed.length,
            温度数据: parsed.temperature.length
        });

        return parsed;
    }

    /**
     * 获取航线上多个点的预报
     * @param {Array} route - 航线点数组 [{lng, lat}, ...]
     * @param {Number} interval - 采样间隔（公里）
     */
    async getRouteForecast(route, interval = 100) {
        const sampledPoints = this.sampleRoute(route, interval);
        console.log(`🗺️ 采样 ${sampledPoints.length} 个点`);

        const forecasts = [];
        
        for (const point of sampledPoints) {
            try {
                const forecast = await this.getForecast(point.lat, point.lng);
                forecasts.push({
                    ...point,
                    forecast
                });
                
                // 避免请求过快
                await this.sleep(100);
            } catch (error) {
                console.error(`❌ 点 (${point.lat}, ${point.lng}) 预报获取失败:`, error);
            }
        }

        return forecasts;
    }

    /**
     * 采样航线点
     */
    sampleRoute(route, intervalKm) {
        const sampled = [route[0]];
        let accumulatedDistance = 0;

        for (let i = 1; i < route.length; i++) {
            const distance = this.calculateDistance(
                route[i - 1].lat, route[i - 1].lng,
                route[i].lat, route[i].lng
            );
            
            accumulatedDistance += distance;

            if (accumulatedDistance >= intervalKm) {
                sampled.push(route[i]);
                accumulatedDistance = 0;
            }
        }

        // 确保终点被包含
        if (sampled[sampled.length - 1] !== route[route.length - 1]) {
            sampled.push(route[route.length - 1]);
        }

        return sampled;
    }

    /**
     * 计算两点间距离（公里）
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // 地球半径（公里）
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRad(degrees) {
        return degrees * Math.PI / 180;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
