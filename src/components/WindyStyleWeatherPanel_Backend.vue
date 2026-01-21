<template>
    <transition name="slide-up">
        <div v-if="show" class="windy-panel">
            <!-- 头部：位置信息 + 关闭按钮 -->
            <div class="panel-header">
                <div class="location-info">
                    <div class="location-icon">📍</div>
                    <div class="coordinates">
                        <span class="coord">{{ lat.toFixed(2) }}°N</span>
                        <span class="separator">|</span>
                        <span class="coord">{{ lon.toFixed(2) }}°E</span>
                    </div>
                </div>
                <button @click="close" class="close-btn">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            
            <!-- 加载状态 -->
            <div v-if="isLoadingTimeSeries" class="loading-panel">
                <div class="spinner"></div>
                <span>加载时间序列数据...</span>
            </div>
            
            <!-- 错误状态 -->
            <div v-else-if="timeSeriesError" class="error-panel">
                <span class="error-icon">⚠️</span>
                <span>{{ timeSeriesError }}</span>
            </div>
            
            <!-- 正常显示 -->
            <template v-else-if="backendTimeSeriesData">
                <!-- 时间轴 -->
                <div class="timeline-container">
                    <div class="timeline" ref="timelineRef">
                        <!-- 日期分组头部 -->
                        <div class="date-row">
                            <div class="timeline-label-spacer"></div>
                            <div class="date-groups">
                                <div 
                                    v-for="(group, dateKey) in groupedByDate" 
                                    :key="dateKey"
                                    class="date-group"
                                    :style="{ width: (group.length * 32) + 'px' }"
                                >
                                    {{ formatDateHeader(dateKey) }}
                                </div>
                            </div>
                        </div>
                        
                        <!-- 小时时间槽 -->
                        <div class="hour-row">
                            <div class="timeline-label-spacer"></div>
                            <div class="hour-slots">
                                <div 
                                    v-for="(time, index) in timeSteps" 
                                    :key="index"
                                    :class="['hour-slot', { active: index === currentTimeIndex }]"
                                    @click="selectTime(index)"
                                >
                                    {{ time.getHours() }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 气象要素列表 -->
                <div class="weather-rows">
                    <!-- 风速行 -->
                    <WeatherRow
                        v-if="hasWind"
                        icon="💨"
                        label="风速"
                        :values="windSpeedValues"
                        :unit="'m/s'"
                        :colorMap="windSpeedColorMap"
                        :showDirection="true"
                        :directions="windDirections"
                        :currentTimeIndex="currentTimeIndex"
                    />
                    
                    <!-- 波高行 -->
                    <WeatherRow
                        v-if="hasWave"
                        icon="🌊"
                        label="波高"
                        :values="waveHeightValues"
                        :unit="'m'"
                        :colorMap="waveHeightColorMap"
                        :showDirection="true"
                        :directions="waveDirections"
                        :currentTimeIndex="currentTimeIndex"
                    />
                    
                    <!-- 波浪漂移速度行 -->
                    <WeatherRow
                        v-if="hasWave"
                        icon="🌀"
                        label="波浪漂移"
                        :values="waveDriftValues"
                        :unit="'m/s'"
                        :colorMap="currentSpeedColorMap"
                        :showDirection="true"
                        :directions="waveDirections"
                        :currentTimeIndex="currentTimeIndex"
                    />
                    
                    <!-- 波峰传播速度行 -->
                    <WeatherRow
                        v-if="hasWave"
                        icon="⚡"
                        label="波峰速度"
                        :values="wavePhaseSpeedValues"
                        :unit="'m/s'"
                        :colorMap="windSpeedColorMap"
                        :showDirection="true"
                        :directions="waveDirections"
                        :currentTimeIndex="currentTimeIndex"
                    />
                    
                    <!-- 洋流行 -->
                    <WeatherRow
                        v-if="hasCurrent"
                        icon="🌀"
                        label="洋流"
                        :values="currentSpeedValues"
                        :unit="'m/s'"
                        :colorMap="currentSpeedColorMap"
                        :showDirection="true"
                        :directions="currentDirections"
                        :currentTimeIndex="currentTimeIndex"
                    />
                </div>
            </template>
        </div>
    </transition>
</template>

<script>
import { ref, computed, watch, nextTick } from 'vue';
import WeatherRow from './WeatherRow.vue';
import { API_ENDPOINTS } from '../api/config.js';

export default {
    components: {
        WeatherRow
    },
    
    props: {
        show: {
            type: Boolean,
            default: false
        },
        lat: {
            type: Number,
            required: true
        },
        lon: {
            type: Number,
            required: true
        },
        weatherData: {
            type: Object,
            default: () => ({})  // 保留用于兼容，但不再使用
        },
        timeSteps: {
            type: Array,
            default: () => []
        }
    },
    
    emits: ['close', 'timeChange'],
    
    setup(props, { emit }) {
        const timelineRef = ref(null);
        const currentTimeIndex = ref(0);
        
        // ==================== 后端数据状态 ====================
        const backendTimeSeriesData = ref(null);
        const isLoadingTimeSeries = ref(false);
        const timeSeriesError = ref(null);
        
        // ==================== 从后端获取时间序列数据 ====================
        const fetchTimeSeriesFromBackend = async (lat, lon, startIndex = 0, count = 24) => {
            try {
                console.log(`📊 从后端查询时间序列: lat=${lat.toFixed(4)}, lon=${lon.toFixed(4)}, count=${count}`);
                
                const response = await fetch(
                    `${API_ENDPOINTS.WEATHER.TIME_SERIES}?lat=${lat}&lon=${lon}&startIndex=${startIndex}&count=${count}`,
                    {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                        signal: AbortSignal.timeout(10000)
                    }
                );
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const result = await response.json();
                
                if (result.success) {
                    console.log('✅ 时间序列查询成功:', result.data);
                    return result.data;
                } else {
                    throw new Error(result.error || '查询失败');
                }
            } catch (err) {
                console.error('❌ 时间序列查询失败:', err);
                throw err;
            }
        };
        
        // ==================== 监听面板显示状态 ====================
        watch(() => [props.show, props.lat, props.lon], async ([show, lat, lon]) => {
            if (!show) {
                backendTimeSeriesData.value = null;
                return;
            }
            
            // 从后端获取时间序列数据
            isLoadingTimeSeries.value = true;
            timeSeriesError.value = null;
            
            try {
                backendTimeSeriesData.value = await fetchTimeSeriesFromBackend(lat, lon, 0, 24);
            } catch (err) {
                timeSeriesError.value = err.message || '查询失败';
                backendTimeSeriesData.value = null;
            } finally {
                isLoadingTimeSeries.value = false;
            }
        }, { immediate: true });
        
        // ==================== 计算属性 ====================
        
        // 按日期分组时间步骤
        const groupedByDate = computed(() => {
            const groups = {};
            props.timeSteps.forEach(time => {
                const dateKey = `${time.getFullYear()}-${String(time.getMonth() + 1).padStart(2, '0')}-${String(time.getDate()).padStart(2, '0')}`;
                if (!groups[dateKey]) {
                    groups[dateKey] = [];
                }
                groups[dateKey].push(time);
            });
            return groups;
        });
        
        // 格式化日期头部
        const formatDateHeader = (dateKey) => {
            const [year, month, day] = dateKey.split('-');
            const date = new Date(year, month - 1, day);
            const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            return `${weekdays[date.getDay()]} ${parseInt(day)}`;
        };
        
        // 检查是否有各类数据
        const hasWind = computed(() => {
            return backendTimeSeriesData.value?.timeSteps?.some(step => step.wind != null) || false;
        });
        
        const hasWave = computed(() => {
            return backendTimeSeriesData.value?.timeSteps?.some(step => step.wave != null) || false;
        });
        
        const hasCurrent = computed(() => {
            return backendTimeSeriesData.value?.timeSteps?.some(step => step.current != null) || false;
        });
        
        // 颜色映射配置
        const windSpeedColorMap = [
            { value: 0, color: '#00d4ff' },
            { value: 5, color: '#00ff88' },
            { value: 10, color: '#ffff00' },
            { value: 15, color: '#ff8800' },
            { value: 20, color: '#ff0000' },
            { value: 30, color: '#cc0000' }
        ];
        
        const waveHeightColorMap = [
            { value: 0, color: '#001a33' },
            { value: 1, color: '#0066cc' },
            { value: 2, color: '#00ccff' },
            { value: 3, color: '#00ff88' },
            { value: 4, color: '#ffff00' },
            { value: 5, color: '#ff8800' },
            { value: 6, color: '#ff0000' }
        ];
        
        const currentSpeedColorMap = [
            { value: 0, color: '#004d66' },
            { value: 0.5, color: '#0099cc' },
            { value: 1.0, color: '#00ccff' },
            { value: 1.5, color: '#ffff00' },
            { value: 2.0, color: '#ff8800' },
            { value: 3.0, color: '#ff0000' }
        ];
        
        // 从后端数据提取风速值
        const windSpeedValues = computed(() => {
            if (!backendTimeSeriesData.value?.timeSteps) return [];
            return backendTimeSeriesData.value.timeSteps.map(step => {
                const speed = step.wind?.speed;
                return (speed != null && speed > -9000) ? speed : null;
            });
        });
        
        // 从后端数据提取风向
        const windDirections = computed(() => {
            if (!backendTimeSeriesData.value?.timeSteps) return [];
            return backendTimeSeriesData.value.timeSteps.map(step => step.wind?.direction || 0);
        });
        
        // 从后端数据提取波高值
        const waveHeightValues = computed(() => {
            if (!backendTimeSeriesData.value?.timeSteps) return [];
            return backendTimeSeriesData.value.timeSteps.map(step => {
                const height = step.wave?.height;
                return (height != null && height > -9000) ? height : null;
            });
        });
        
        // 从后端数据提取波浪方向
        const waveDirections = computed(() => {
            if (!backendTimeSeriesData.value?.timeSteps) return [];
            return backendTimeSeriesData.value.timeSteps.map(step => step.wave?.direction || 0);
        });
        
        // 从后端数据提取波浪漂移速度
        const waveDriftValues = computed(() => {
            if (!backendTimeSeriesData.value?.timeSteps) return [];
            return backendTimeSeriesData.value.timeSteps.map(step => {
                const speed = step.wave?.speed;
                return (speed != null && speed > -9000) ? speed : null;
            });
        });
        
        // 从后端数据提取波峰传播速度
        const wavePhaseSpeedValues = computed(() => {
            if (!backendTimeSeriesData.value?.timeSteps) return [];
            return backendTimeSeriesData.value.timeSteps.map(step => {
                const phaseSpeed = step.wave?.phaseSpeed;
                return (phaseSpeed != null && phaseSpeed > -9000) ? phaseSpeed : null;
            });
        });
        
        // 从后端数据提取洋流值
        const currentSpeedValues = computed(() => {
            if (!backendTimeSeriesData.value?.timeSteps) return [];
            return backendTimeSeriesData.value.timeSteps.map(step => {
                const speed = step.current?.speed;
                return (speed != null && speed > -9000) ? speed : null;
            });
        });
        
        // 从后端数据提取洋流方向
        const currentDirections = computed(() => {
            if (!backendTimeSeriesData.value?.timeSteps) return [];
            return backendTimeSeriesData.value.timeSteps.map(step => step.current?.direction || 0);
        });
        
        // 选择时间
        const selectTime = (index) => {
            currentTimeIndex.value = index;
            emit('timeChange', index);
            
            nextTick(() => {
                if (timelineRef.value) {
                    const activeSlot = timelineRef.value.querySelector('.hour-slot.active');
                    if (activeSlot) {
                        activeSlot.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    }
                }
            });
        };
        
        // 关闭面板
        const close = () => {
            emit('close');
        };
        
        // 监听显示状态
        watch(() => props.show, (newVal) => {
            if (newVal) {
                nextTick(() => {
                    selectTime(0);
                });
            }
        });
        
        return {
            timelineRef,
            currentTimeIndex,
            backendTimeSeriesData,
            isLoadingTimeSeries,
            timeSeriesError,
            groupedByDate,
            formatDateHeader,
            hasWind,
            hasWave,
            hasCurrent,
            windSpeedColorMap,
            waveHeightColorMap,
            currentSpeedColorMap,
            windSpeedValues,
            windDirections,
            waveHeightValues,
            waveDirections,
            waveDriftValues,
            wavePhaseSpeedValues,
            currentSpeedValues,
            currentDirections,
            selectTime,
            close
        };
    }
};
</script>

<style scoped>
/* 复用原有样式 */
.windy-panel {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(20, 20, 30, 0.96);
    backdrop-filter: blur(16px);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.6);
    z-index: 1000;
    height: 320px;
    display: flex;
    flex-direction: column;
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(25, 25, 35, 0.8);
    min-height: 40px;
}

.location-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.location-icon {
    font-size: 16px;
}

.coordinates {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Rajdhani', monospace;
}

.coord {
    font-size: 14px;
    font-weight: 600;
    color: #00d4ff;
}

.separator {
    color: rgba(255, 255, 255, 0.3);
}

.close-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 4px;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.2s;
}

.close-btn:hover {
    background: rgba(255, 0, 0, 0.2);
    border-color: rgba(255, 0, 0, 0.4);
    color: white;
}

/* 加载和错误状态 */
.loading-panel, .error-panel {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: rgba(255, 255, 255, 0.7);
}

.spinner {
    width: 24px;
    height: 24px;
    border: 3px solid rgba(0, 212, 255, 0.3);
    border-top-color: rgba(0, 212, 255, 1);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.error-icon {
    font-size: 24px;
}

/* 时间轴样式（复用原有样式） */
.timeline-container {
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(25, 25, 35, 0.6);
    overflow-x: auto;
}

.timeline {
    display: flex;
    flex-direction: column;
}

.timeline-label-spacer {
    width: 100px;
    flex-shrink: 0;
    background: rgba(25, 25, 35, 0.8);
    border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.date-row {
    display: flex;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(30, 30, 40, 0.5);
}

.date-groups {
    display: flex;
    flex: 1;
}

.date-group {
    padding: 6px 8px;
    text-align: center;
    font-size: 11px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    border-right: 1px solid rgba(255, 255, 255, 0.05);
    white-space: nowrap;
}

.hour-row {
    display: flex;
}

.hour-slots {
    display: flex;
    flex: 1;
}

.hour-slot {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    border-right: 1px solid rgba(255, 255, 255, 0.03);
    transition: all 0.15s;
    position: relative;
}

.hour-slot:hover {
    background: rgba(0, 212, 255, 0.1);
    color: rgba(255, 255, 255, 0.9);
}

.hour-slot.active {
    background: rgba(0, 212, 255, 0.2);
    color: #00d4ff;
    font-weight: 700;
}

.hour-slot.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: #00d4ff;
}

.weather-rows {
    flex: 1;
    overflow-y: auto;
    background: rgba(20, 20, 30, 0.4);
    min-height: 0;
}

/* 动画 */
.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from {
    opacity: 0;
    transform: translateY(100%);
}

.slide-up-leave-to {
    opacity: 0;
    transform: translateY(100%);
}
</style>
