<template>
    <!-- 浮动标签：Windy 风格 -->
    <transition name="fade">
        <div v-if="pickedPoint && !showDetailPanel" 
             :style="{ left: labelPosition.x + 'px', top: labelPosition.y + 'px' }"
             class="absolute pointer-events-auto windy-picker"
             style="z-index: 100;">
            <div class="windy-card">
                <!-- 顶部：图层名称、经纬度和关闭按钮 -->
                <div class="layer-header">
                    <div class="layer-info">
                        <span class="layer-name">{{ currentLayerName }}</span>
                        <span class="layer-icon">⇒</span>
                    </div>
                    <div class="header-right">
                        <span class="coordinates">{{ formattedCoordinates }}</span>
                        <button @click="closePicker" class="close-icon" title="关闭">×</button>
                    </div>
                </div>
                
                <!-- 中间：主要数值 -->
                <div class="main-value">
                    <div class="value-container">
                        <span class="value-number">{{ mainValue }}</span>
                        <span class="value-unit">{{ mainUnit }}</span>
                    </div>
                    <span v-if="windDirection" class="wind-direction">{{ windDirection }}</span>
                </div>
                
                <!-- 波浪额外信息（仅波浪图层显示） -->
                <div v-if="waveExtraInfo" class="wave-extra-info">
                    <div class="extra-item">
                        <span class="extra-label">漂移速度</span>
                        <span class="extra-value">{{ waveExtraInfo.drift }}</span>
                    </div>
                    <div class="extra-item">
                        <span class="extra-label">波峰速度</span>
                        <span class="extra-value">{{ waveExtraInfo.phase }}</span>
                    </div>
                </div>
                
                <!-- 底部：展开按钮 -->
                <button @click="toggleDetailPanel" class="expand-full-btn" title="查看详细数据">
                    <span>查看详情</span>
                    <svg class="expand-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                </button>
            </div>
        </div>
    </transition>
    
    <!-- Windy 风格详细面板 -->
    <WindyStyleWeatherPanel
        :show="showDetailPanel"
        :lat="pickedPoint?.lat || 0"
        :lon="pickedPoint?.lon || 0"
        :weatherData="weatherData"
        :timeSteps="timeSteps"
        @close="toggleDetailPanel"
        @timeChange="handleTimeChange"
    />
</template>

<script>
import { ref, computed, watch } from 'vue';
import WindyStyleWeatherPanel from './WindyStyleWeatherPanel.vue';

export default {
    components: {
        WindyStyleWeatherPanel
    },
    
    props: {
        pickedPoint: {
            type: Object,
            default: null  // { lat, lon, cartesian3 }
        },
        currentLayer: {
            type: Object,
            default: null  // { id, name }
        },
        weatherData: {
            type: Object,
            default: null  // { wind, wave, current }
        },
        timeSteps: {
            type: Array,
            default: () => []
        },
        currentTimeIndex: {
            type: Number,
            default: 0
        }
    },
    emits: ['close', 'timeChange'],
    setup(props, { emit }) {
        const showDetailPanel = ref(false);
        const labelPosition = ref({ x: 0, y: 0 });
        
        // 当前图层名称
        const currentLayerName = computed(() => {
            if (!props.currentLayer) return '';
            return props.currentLayer.name;
        });
        
        // 主要数值（大号显示）
        const mainValue = computed(() => {
            if (!props.pickedPoint || !props.currentLayer || !props.weatherData) {
                return 'N/A';
            }
            
            const layerId = props.currentLayer.id;
            const data = props.weatherData[layerId];
            
            if (!data) return 'N/A';
            
            // 根据经纬度获取数据值
            let value;
            if (layerId === 'wave') {
                // 波高使用标量值
                value = getScalarAtPoint(data, props.pickedPoint.lat, props.pickedPoint.lon, 'hs');
            } else {
                // 其他使用矢量值
                value = getVectorValueAtPoint(data, props.pickedPoint.lat, props.pickedPoint.lon, layerId);
            }
            
            if (value === null || value === undefined) return 'N/A';
            
            // 风速转换为 km/h（更直观）
            if (layerId === 'wind') {
                return (value * 3.6).toFixed(1);
            }
            
            return value.toFixed(2);
        });
        
        // 主要单位
        const mainUnit = computed(() => {
            if (!props.currentLayer) return '';
            const layerId = props.currentLayer.id;
            
            const units = {
                wind: 'km/h',
                wave: 'm',
                current: 'm/s',
                internal_wave: 'm/s'
            };
            
            return units[layerId] || '';
        });
        
        // 风向文字（仅风速图层显示）
        const windDirection = computed(() => {
            if (!props.currentLayer || props.currentLayer.id !== 'wind') return null;
            if (!props.pickedPoint || !props.weatherData?.wind) return null;
            
            const { u, v } = getUVAtPoint(props.weatherData.wind, props.pickedPoint.lat, props.pickedPoint.lon);
            const angle = Math.atan2(u, v) * 180 / Math.PI;
            
            // 转换为方位
            const directions = ['↓ N', '↙ NE', '← E', '↖ SE', '↑ S', '↗ SW', '→ W', '↘ NW'];
            const index = Math.round((angle + 180) / 45) % 8;
            return directions[index];
        });
        
        // 格式化经纬度
        const formattedCoordinates = computed(() => {
            if (!props.pickedPoint) return '';
            const lat = props.pickedPoint.lat.toFixed(2);
            const lon = props.pickedPoint.lon.toFixed(2);
            const latDir = props.pickedPoint.lat >= 0 ? 'N' : 'S';
            const lonDir = props.pickedPoint.lon >= 0 ? 'E' : 'W';
            return `${Math.abs(lat)}°${latDir} ${Math.abs(lon)}°${lonDir}`;
        });
        
        // 波浪额外信息（仅波浪图层显示）
        const waveExtraInfo = computed(() => {
            if (!props.currentLayer || props.currentLayer.id !== 'wave') return null;
            if (!props.pickedPoint || !props.weatherData?.wave) return null;
            
            const data = props.weatherData.wave;
            const lat = props.pickedPoint.lat;
            const lon = props.pickedPoint.lon;
            
            // 获取波高
            const waveHeight = getScalarAtPoint(data, lat, lon, 'hs');
            
            // 获取 Stokes drift（波浪漂移速度）
            const { u, v } = getUVAtPoint(data, lat, lon);
            const driftSpeed = Math.sqrt(u * u + v * v);
            
            if (!waveHeight && !driftSpeed) return null;
            
            // 计算波峰传播速度（Phase Speed）
            // 使用经验公式：c ≈ 1.25 × √H （深水波近似）
            const phaseSpeed = waveHeight > 0 ? 1.25 * Math.sqrt(waveHeight) : 0;
            
            return {
                drift: driftSpeed > 0 ? `${driftSpeed.toFixed(2)} m/s` : 'N/A',
                phase: phaseSpeed > 0 ? `${phaseSpeed.toFixed(2)} m/s` : 'N/A'
            };
        });
        
        // 可用的气象图层
        const availableLayers = computed(() => {
            const layers = [];
            if (props.weatherData?.wind) {
                layers.push({ id: 'wind', name: '风速', unit: 'm/s' });
            }
            if (props.weatherData?.wave) {
                layers.push({ id: 'wave', name: '波高', unit: 'm' });
            }
            if (props.weatherData?.current) {
                layers.push({ id: 'current', name: '洋流', unit: 'm/s' });
            }
            if (props.weatherData?.internal_wave) {
                layers.push({ id: 'internal_wave', name: '内波', unit: 'm/s' });
            }
            return layers;
        });
        
        // 监听点击位置变化，更新标签位置
        watch(() => props.pickedPoint, (newPoint) => {
            if (newPoint && newPoint.screenPosition) {
                // 直接使用屏幕坐标，弹窗通过 CSS transform 自动居中
                labelPosition.value = {
                    x: newPoint.screenPosition.x,
                    y: newPoint.screenPosition.y
                };
                console.log('🎯 弹窗位置更新:', labelPosition.value);
            }
        });
        
        // 切换详细面板
        const toggleDetailPanel = () => {
            showDetailPanel.value = !showDetailPanel.value;
        };
        
        // 关闭选择器
        const closePicker = () => {
            showDetailPanel.value = false;
            emit('close');
        };
        
        // 获取 U/V 分量（用于风向计算）
        const getUVAtPoint = (data, lat, lon) => {
            if (!data || !data.u || !data.v) return { u: 0, v: 0 };
            
            const { width, height, bounds } = data;
            const { west, south, east, north } = bounds;
            
            let adjustedLon = lon;
            if (west >= 0 && east > 180 && lon < 0) {
                adjustedLon = lon + 360;
            }
            
            const x = Math.floor(((adjustedLon - west) / (east - west)) * width);
            const y = Math.floor(((north - lat) / (north - south)) * height);
            
            if (x < 0 || x >= width || y < 0 || y >= height) return { u: 0, v: 0 };
            
            const index = y * width + x;
            return {
                u: data.u.array[index] || 0,
                v: data.v.array[index] || 0
            };
        };
        
        // 获取矢量数据的强度值
        const getVectorValueAtPoint = (data, lat, lon, dataType) => {
            const { u, v } = getUVAtPoint(data, lat, lon);
            
            if (Math.abs(u) < 0.001 && Math.abs(v) < 0.001) {
                return null;
            }
            
            const speed = Math.sqrt(u * u + v * v);
            
            if (speed < 0.01) return null;
            
            // 根据数据类型还原真实值
            if (dataType === 'current') {
                return speed / 15;
            } else if (dataType === 'internal_wave') {
                return speed / 5000;
            }
            
            return speed;
        };
        
        // 获取标量数据值（如波高）
        const getScalarAtPoint = (data, lat, lon, field = 'hs') => {
            if (!data || !data[field]) return null;
            
            const { width, height, bounds } = data;
            const { west, south, east, north } = bounds;
            
            let adjustedLon = lon;
            if (west >= 0 && east > 180 && lon < 0) {
                adjustedLon = lon + 360;
            }
            
            const x = Math.floor(((adjustedLon - west) / (east - west)) * width);
            const y = Math.floor(((north - lat) / (north - south)) * height);
            
            if (x < 0 || x >= width || y < 0 || y >= height) return null;
            
            const index = y * width + x;
            const value = data[field].array[index];
            
            if (value === undefined || value === null || value < 0.01) return null;
            
            return value;
        };
        
        // 根据经纬度获取数据值
        const getValueAtPoint = (data, lat, lon, timeIndex, dataType = 'unknown') => {
            if (!data || !data.u || !data.v) return null;
            
            const { width, height, bounds, landMask } = data;
            const { west, south, east, north } = bounds;
            
            // 处理经度坐标系转换
            // 如果数据是 0-360 坐标系，而输入是 -180~180，需要转换
            let adjustedLon = lon;
            if (west >= 0 && east > 180 && lon < 0) {
                // 数据是 0-360，输入是负数（-180~0），转换为 180-360
                adjustedLon = lon + 360;
            }
            
            // 将经纬度转换为数据索引
            const x = Math.floor(((adjustedLon - west) / (east - west)) * width);
            const y = Math.floor(((north - lat) / (north - south)) * height);
            
            // 边界检查
            if (x < 0 || x >= width || y < 0 || y >= height) return null;
            
            const index = y * width + x;
            
            // ⭐ 第一层：检查陆地标记（如果存在）
            if (landMask && landMask[index] === 1) {
                return null;  // 陆地返回 null，显示 N/A
            }
            
            const u = data.u.array[index];
            const v = data.v.array[index];
            
            // ⭐ 第二层：直接判断 u 和 v 是否都接近 0（无效区域或陆地）
            // 使用更严格的阈值 0.001，过滤掉所有接近0的值
            if (Math.abs(u) < 0.001 && Math.abs(v) < 0.001) {
                return null;
            }
            
            // 计算强度
            const speed = Math.sqrt(u * u + v * v);
            
            // ⭐ 第三层：过滤极小值（额外保险）
            if (speed < 0.01) {
                return null;
            }
            
            // 根据数据类型还原真实值（除以放大倍数）
            let realSpeed = speed;
            if (dataType === 'current') {
                // 洋流数据放大了 15 倍，需要还原
                realSpeed = speed / 15;
            } else if (dataType === 'internal_wave') {
                // 内波数据放大了 5000 倍，需要还原
                realSpeed = speed / 5000;
            }
            
            return realSpeed;
        };
        
        // 获取指定时间的数值
        const getValueAtTime = (layerId, timeIndex) => {
            if (!props.pickedPoint || !props.weatherData) return 'N/A';
            
            const data = props.weatherData[layerId];
            if (!data) return 'N/A';
            
            const value = getValueAtPoint(data, props.pickedPoint.lat, props.pickedPoint.lon, timeIndex, layerId);
            return formatValue(layerId, value);
        };
        
        // 获取当前图层的数值（简化版，只显示当前值）
        const getCurrentLayerValue = (layerId) => {
            if (!props.pickedPoint || !props.weatherData) return 'N/A';
            
            const data = props.weatherData[layerId];
            if (!data) return 'N/A';
            
            const value = getValueAtPoint(data, props.pickedPoint.lat, props.pickedPoint.lon, 0, layerId);
            if (value === null || value === undefined) return 'N/A';
            
            return value.toFixed(2);
        };
        
        // 格式化数值
        const formatValue = (layerId, value) => {
            if (value === null || value === undefined) return 'N/A';
            
            const units = {
                wind: 'm/s',
                wave: 'm',
                current: 'm/s',
                internal_wave: 'm/s'
            };
            
            return `${value.toFixed(2)} ${units[layerId] || ''}`;
        };
        
        // 格式化时间
        const formatTime = (date) => {
            if (!date) return '';
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const hour = date.getHours().toString().padStart(2, '0');
            return `${month}-${day} ${hour}:00`;
        };
        
        // 处理时间变化
        const handleTimeChange = (index) => {
            emit('timeChange', index);
        };
        
        return {
            showDetailPanel,
            labelPosition,
            currentLayerName,
            mainValue,
            mainUnit,
            windDirection,
            formattedCoordinates,
            waveExtraInfo,
            availableLayers,
            toggleDetailPanel,
            closePicker,
            getValueAtTime,
            getCurrentLayerValue,
            formatTime,
            handleTimeChange
        };
    }
};
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-enter-from, .fade-leave-to {
    opacity: 0;
    transform: scale(0.95) translateY(5px);
}

/* Windy 风格卡片 */
.windy-picker {
    transform: translate(-50%, calc(-100% - 15px));
    pointer-events: auto;
}

.windy-card {
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.96));
    backdrop-filter: blur(20px);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);
    min-width: 200px;
    max-width: 260px;
    overflow: hidden;
}

/* 图层头部 */
.layer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px 10px;
    background: linear-gradient(90deg, rgba(6, 182, 212, 0.1), rgba(14, 165, 233, 0.06));
    border-bottom: 1px solid rgba(6, 182, 212, 0.15);
}

.layer-info {
    display: flex;
    align-items: center;
    gap: 5px;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 8px;
}

.coordinates {
    font-size: 9px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.5);
    letter-spacing: 0.3px;
}

.layer-name {
    font-size: 10px;
    font-weight: 700;
    color: rgba(6, 182, 212, 1);
    text-transform: uppercase;
    letter-spacing: 0.8px;
}

.layer-icon {
    font-size: 11px;
    color: rgba(6, 182, 212, 0.8);
}

.close-icon {
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    transition: all 0.2s;
    border-radius: 3px;
    padding: 0;
}

.close-icon:hover {
    background: rgba(239, 68, 68, 0.2);
    color: rgba(239, 68, 68, 1);
}

/* 主要数值 */
.main-value {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    gap: 8px;
}

.value-container {
    display: flex;
    align-items: baseline;
    gap: 4px;
}

.value-number {
    font-size: 28px;
    font-weight: 800;
    color: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    line-height: 1;
    letter-spacing: -0.5px;
}

.value-unit {
    font-size: 11px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.6);
}

.wind-direction {
    font-size: 15px;
    font-weight: 700;
    color: rgba(6, 182, 212, 1);
    white-space: nowrap;
}

/* 波浪额外信息 */
.wave-extra-info {
    display: flex;
    gap: 12px;
    padding: 8px 12px;
    background: rgba(6, 182, 212, 0.05);
    border-top: 1px solid rgba(6, 182, 212, 0.1);
}

.extra-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.extra-label {
    font-size: 8px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.extra-value {
    font-size: 11px;
    font-weight: 700;
    color: rgba(6, 182, 212, 0.9);
}

/* 展开按钮 */
.expand-full-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 6px 10px;
    background: rgba(6, 182, 212, 0.08);
    border: none;
    border-top: 1px solid rgba(6, 182, 212, 0.15);
    color: rgba(6, 182, 212, 0.9);
    font-size: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.expand-full-btn:hover {
    background: rgba(6, 182, 212, 0.18);
    color: rgba(6, 182, 212, 1);
}

.expand-icon {
    width: 12px;
    height: 12px;
    transition: transform 0.2s;
}

.expand-full-btn:hover .expand-icon {
    transform: translateY(2px);
}
</style>
