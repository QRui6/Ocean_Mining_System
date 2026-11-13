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
                    <!-- 加载状态 -->
                    <div v-if="isLoadingBackendData" class="loading-container">
                        <div class="spinner"></div>
                        <span class="loading-text">查询中...</span>
                    </div>
                    
                    <!-- 错误状态 -->
                    <div v-else-if="backendError" class="error-container">
                        <span class="error-icon">⚠️</span>
                        <span class="error-text">{{ backendError }}</span>
                    </div>
                    
                    <!-- 正常显示 -->
                    <template v-else>
                        <div class="value-container">
                            <span class="value-number">{{ mainValue }}</span>
                            <span class="value-unit">{{ mainUnit }}</span>
                        </div>
                        <span v-if="windDirection" class="wind-direction">{{ windDirection }}</span>
                    </template>
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
        :weatherData="weatherData || {}"
        :timeSteps="timeSteps"
        @close="toggleDetailPanel"
        @timeChange="handleTimeChange"
    />
</template>

<script>
import { ref, computed, watch } from 'vue';
import WindyStyleWeatherPanel from './WindyStyleWeatherPanel.vue';
import { API_ENDPOINTS } from '../api/config.js';

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
            default: null  // { wind, wave, current } - 保留用于兼容，但优先使用后端数据
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
        
        // ==================== 后端数据状态 ====================
        const backendWeatherData = ref(null);
        const isLoadingBackendData = ref(false);
        const backendError = ref(null);
        
        // ==================== 从后端获取气象数据 ====================
        const fetchWeatherFromBackend = async (lat, lon, timeIndex = 0) => {
            try {
                console.log(`🌊 从后端查询气象数据: lat=${lat.toFixed(4)}, lon=${lon.toFixed(4)}, timeIndex=${timeIndex}`);
                
                const response = await fetch(
                    `${API_ENDPOINTS.WEATHER.POINT_QUERY}?lat=${lat}&lon=${lon}&timeIndex=${timeIndex}`,
                    {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                        signal: AbortSignal.timeout(5000)
                    }
                );
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const result = await response.json();
                
                if (result.success) {
                    console.log('✅ 后端数据查询成功:', result.data);
                    return result.data;
                } else {
                    throw new Error(result.error || '查询失败');
                }
            } catch (err) {
                console.error('❌ 后端查询失败:', err);
                throw err;
            }
        };
        
        // ==================== 监听点击位置变化 ====================
        watch(() => [props.pickedPoint, props.currentTimeIndex], async ([newPoint, newTimeIndex]) => {
            if (!newPoint) {
                backendWeatherData.value = null;
                return;
            }
            
            // 更新标签位置
            if (newPoint.screenPosition) {
                labelPosition.value = {
                    x: newPoint.screenPosition.x,
                    y: newPoint.screenPosition.y
                };
                console.log('🎯 弹窗位置更新:', labelPosition.value);
            }
            
            // 从后端获取数据
            isLoadingBackendData.value = true;
            backendError.value = null;
            
            try {
                backendWeatherData.value = await fetchWeatherFromBackend(
                    newPoint.lat,
                    newPoint.lon,
                    newTimeIndex || 0
                );
            } catch (err) {
                backendError.value = err.message || '查询失败';
                backendWeatherData.value = null;
            } finally {
                isLoadingBackendData.value = false;
            }
        }, { immediate: true });
        
        // ==================== 计算属性 ====================
        
        // 当前图层名称
        const currentLayerName = computed(() => {
            if (!props.currentLayer) return '';
            return props.currentLayer.name;
        });
        
        // 主要数值（大号显示）
        const mainValue = computed(() => {
            if (!props.pickedPoint || !props.currentLayer) {
                return 'N/A';
            }
            
            if (isLoadingBackendData.value) {
                return '...';
            }
            
            if (backendError.value) {
                return 'N/A';
            }
            
            if (!backendWeatherData.value) {
                return 'N/A';
            }
            
            const layerId = props.currentLayer.id;
            let value;
            
            // 从后端数据中获取值
            switch (layerId) {
                case 'wind':
                    value = backendWeatherData.value.wind?.speed;
                    break;
                case 'wave':
                    // 波浪显示波高
                    value = backendWeatherData.value.wave?.height;
                    break;
                case 'current':
                case 'ocean_current':
                    value = backendWeatherData.value.current?.speed;
                    break;
                case 'internal_wave':
                    // 内波显示速度
                    value = backendWeatherData.value.internalWave?.speed;
                    break;
                default:
                    value = null;
            }
            
            // 过滤无效值（-9999表示无数据）
            if (value === null || value === undefined || value < -9000) return 'N/A';
            
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
                ocean_current: 'm/s',
                internal_wave: 'm/s'
            };
            
            return units[layerId] || '';
        });
        
        // 风向文字（仅风速图层显示）
        const windDirection = computed(() => {
            if (!props.currentLayer || props.currentLayer.id !== 'wind') return null;
            if (isLoadingBackendData.value || !backendWeatherData.value?.wind) return null;
            
            const direction = backendWeatherData.value.wind.direction;
            
            // 转换为方位
            const directions = ['↓ N', '↙ NE', '← E', '↖ SE', '↑ S', '↗ SW', '→ W', '↘ NW'];
            const index = Math.round(direction / 45) % 8;
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
            if (isLoadingBackendData.value || !backendWeatherData.value?.wave) return null;
            
            const wave = backendWeatherData.value.wave;
            
            // 过滤无效值
            if (wave.height < -9000 || wave.speed < -9000) return null;
            
            // Stokes drift速度（后端已计算）
            const driftSpeed = wave.speed;
            
            // 计算波峰传播速度（Phase Speed）
            // 使用经验公式：c ≈ 1.25 × √H （深水波近似）
            const waveHeight = wave.height || 0;
            const phaseSpeed = waveHeight > 0 ? 1.25 * Math.sqrt(waveHeight) : 0;
            
            return {
                drift: driftSpeed > 0 ? `${driftSpeed.toFixed(2)} m/s` : 'N/A',
                phase: phaseSpeed > 0 ? `${phaseSpeed.toFixed(2)} m/s` : 'N/A'
            };
        });
        
        // 可用的气象图层（基于后端数据）
        const availableLayers = computed(() => {
            const layers = [];
            if (backendWeatherData.value?.wind) {
                layers.push({ id: 'wind', name: '风速', unit: 'm/s' });
            }
            if (backendWeatherData.value?.wave) {
                layers.push({ id: 'wave', name: '波高', unit: 'm' });
            }
            if (backendWeatherData.value?.current) {
                layers.push({ id: 'current', name: '洋流', unit: 'm/s' });
            }
            if (backendWeatherData.value?.internalWave) {
                layers.push({ id: 'internal_wave', name: '内波', unit: 'm/s' });
            }
            return layers;
        });
        
        // ==================== 方法 ====================
        
        // 切换详细面板
        const toggleDetailPanel = () => {
            showDetailPanel.value = !showDetailPanel.value;
        };
        
        // 关闭选择器
        const closePicker = () => {
            showDetailPanel.value = false;
            emit('close');
        };
        
        // 处理时间变化
        const handleTimeChange = (index) => {
            emit('timeChange', index);
        };
        
        return {
            showDetailPanel,
            labelPosition,
            backendWeatherData,
            isLoadingBackendData,
            backendError,
            currentLayerName,
            mainValue,
            mainUnit,
            windDirection,
            formattedCoordinates,
            waveExtraInfo,
            availableLayers,
            toggleDetailPanel,
            closePicker,
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

/* 加载状态样式 */
.loading-container {
    display: flex;
    align-items: center;
    gap: 8px;
}

.spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(6, 182, 212, 0.3);
    border-top-color: rgba(6, 182, 212, 1);
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.loading-text {
    font-size: 12px;
    color: rgba(6, 182, 212, 0.8);
}

/* 错误状态样式 */
.error-container {
    display: flex;
    align-items: center;
    gap: 6px;
}

.error-icon {
    font-size: 16px;
}

.error-text {
    font-size: 11px;
    color: rgba(239, 68, 68, 0.9);
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
