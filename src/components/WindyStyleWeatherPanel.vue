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
            
            <!-- 时间轴 -->
            <div class="timeline-container">
                <div class="timeline" ref="timelineRef">
                    <!-- 时间槽 -->
                    <div 
                        v-for="(time, index) in timeSteps" 
                        :key="index"
                        :class="['time-slot', { active: index === currentTimeIndex }]"
                        @click="selectTime(index)"
                    >
                        <div class="day">{{ formatDay(time) }}</div>
                        <div class="hour">{{ formatHour(time) }}</div>
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
                
                <!-- 内波行 -->
                <WeatherRow
                    v-if="hasInternalWave"
                    icon="〰️"
                    label="内波"
                    :values="internalWaveValues"
                    :unit="'m/s'"
                    :colorMap="internalWaveColorMap"
                    :showDirection="true"
                    :directions="internalWaveDirections"
                    :currentTimeIndex="currentTimeIndex"
                />
            </div>
            
            <!-- 底部提示 -->
            <div class="panel-footer">
                <span class="tip">💡 点击时间轴切换不同时间的预报数据</span>
            </div>
        </div>
    </transition>
</template>

<script>
import { ref, computed, watch, nextTick } from 'vue';
import WeatherRow from './WeatherRow.vue';

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
            default: () => ({})
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
        
        // 检查是否有各类数据
        const hasWind = computed(() => {
            return props.weatherData.wind && props.weatherData.wind.u;
        });
        
        const hasWave = computed(() => {
            return props.weatherData.wave && props.weatherData.wave.u;
        });
        
        const hasCurrent = computed(() => {
            return props.weatherData.current && props.weatherData.current.u;
        });
        
        const hasInternalWave = computed(() => {
            const result = props.weatherData.internal_wave && props.weatherData.internal_wave.u;
            console.log('🔍 检查内波数据:', {
                hasInternalWaveData: !!props.weatherData.internal_wave,
                hasU: props.weatherData.internal_wave?.u ? true : false,
                hasV: props.weatherData.internal_wave?.v ? true : false,
                result: result
            });
            return result;
        });
        
        // 颜色映射配置
        const windSpeedColorMap = [
            { value: 0, color: '#00d4ff' },    // 青色 - 微风
            { value: 5, color: '#00ff88' },    // 绿色 - 和风
            { value: 10, color: '#ffff00' },   // 黄色 - 强风
            { value: 15, color: '#ff8800' },   // 橙色 - 大风
            { value: 20, color: '#ff0000' },   // 红色 - 烈风
            { value: 30, color: '#cc0000' }    // 深红 - 狂风
        ];
        
        const waveHeightColorMap = [
            { value: 0, color: '#001a33' },    // 深蓝 - 平静
            { value: 1, color: '#0066cc' },    // 蓝色 - 微浪
            { value: 2, color: '#00ccff' },    // 浅蓝 - 小浪
            { value: 3, color: '#00ff88' },    // 青绿 - 中浪
            { value: 4, color: '#ffff00' },    // 黄色 - 大浪
            { value: 5, color: '#ff8800' },    // 橙色 - 巨浪
            { value: 6, color: '#ff0000' }     // 红色 - 狂浪
        ];
        
        const currentSpeedColorMap = [
            { value: 0, color: '#004d66' },    // 深青 - 缓流
            { value: 0.5, color: '#0099cc' },  // 青色 - 慢流
            { value: 1.0, color: '#00ccff' },  // 浅青 - 中流
            { value: 1.5, color: '#ffff00' },  // 黄色 - 急流
            { value: 2.0, color: '#ff8800' },  // 橙色 - 激流
            { value: 3.0, color: '#ff0000' }   // 红色 - 狂流
        ];
        
        const internalWaveColorMap = [
            { value: 0, color: '#001a33' },    // 深蓝 - 微弱
            { value: 0.5, color: '#0066cc' },  // 蓝色 - 弱
            { value: 1.0, color: '#00ccff' },  // 浅蓝 - 中等
            { value: 1.5, color: '#00ff88' },  // 青绿 - 较强
            { value: 2.0, color: '#ffff00' },  // 黄色 - 强
            { value: 2.5, color: '#ff8800' },  // 橙色 - 很强
            { value: 3.0, color: '#ff0000' }   // 红色 - 极强
        ];
        
        // 从网格数据中获取指定点的值
        const getValueAtPoint = (data, lat, lon) => {
            if (!data || !data.u || !data.v) return null;
            
            const { width, height, bounds, landMask } = data;
            const { west, south, east, north } = bounds;
            
            // 经纬度 → 网格索引
            const x = Math.floor(((lon - west) / (east - west)) * width);
            const y = Math.floor(((north - lat) / (north - south)) * height);
            
            // 边界检查
            if (x < 0 || x >= width || y < 0 || y >= height) return null;
            
            const index = y * width + x;
            
            // 检查陆地标记
            if (landMask && landMask[index] === 1) {
                return null;
            }
            
            const u = data.u.array[index];
            const v = data.v.array[index];
            
            // 过滤无效值
            if (Math.abs(u) < 0.001 && Math.abs(v) < 0.001) {
                return null;
            }
            
            // 计算速度
            const speed = Math.sqrt(u * u + v * v);
            
            if (speed < 0.01) {
                return null;
            }
            
            return speed;
        };
        
        // 获取 U/V 分量
        const getUVAtPoint = (data, lat, lon) => {
            if (!data || !data.u || !data.v) return { u: 0, v: 0 };
            
            const { width, height, bounds } = data;
            const { west, south, east, north } = bounds;
            
            const x = Math.floor(((lon - west) / (east - west)) * width);
            const y = Math.floor(((north - lat) / (north - south)) * height);
            
            if (x < 0 || x >= width || y < 0 || y >= height) return { u: 0, v: 0 };
            
            const index = y * width + x;
            
            return {
                u: data.u.array[index],
                v: data.v.array[index]
            };
        };
        
        // 计算风速值（当前只有一帧数据）
        const windSpeedValues = computed(() => {
            if (!hasWind.value) return [];
            
            // 目前只有一帧数据，所以复制到所有时间点
            const value = getValueAtPoint(props.weatherData.wind, props.lat, props.lon);
            return props.timeSteps.map(() => value);
        });
        
        // 计算风向
        const windDirections = computed(() => {
            if (!hasWind.value) return [];
            
            const { u, v } = getUVAtPoint(props.weatherData.wind, props.lat, props.lon);
            const direction = Math.atan2(u, v) * 180 / Math.PI;
            return props.timeSteps.map(() => direction);
        });
        
        // 计算波高值
        const waveHeightValues = computed(() => {
            if (!hasWave.value) return [];
            
            const value = getValueAtPoint(props.weatherData.wave, props.lat, props.lon);
            return props.timeSteps.map(() => value);
        });
        
        // 计算洋流值
        const currentSpeedValues = computed(() => {
            if (!hasCurrent.value) return [];
            
            const value = getValueAtPoint(props.weatherData.current, props.lat, props.lon);
            return props.timeSteps.map(() => value);
        });
        
        // 计算洋流方向
        const currentDirections = computed(() => {
            if (!hasCurrent.value) return [];
            
            const { u, v } = getUVAtPoint(props.weatherData.current, props.lat, props.lon);
            const direction = Math.atan2(u, v) * 180 / Math.PI;
            return props.timeSteps.map(() => direction);
        });
        
        // 计算内波值
        const internalWaveValues = computed(() => {
            if (!hasInternalWave.value) return [];
            
            const value = getValueAtPoint(props.weatherData.internal_wave, props.lat, props.lon);
            return props.timeSteps.map(() => value);
        });
        
        // 计算内波方向
        const internalWaveDirections = computed(() => {
            if (!hasInternalWave.value) return [];
            
            const { u, v } = getUVAtPoint(props.weatherData.internal_wave, props.lat, props.lon);
            const direction = Math.atan2(u, v) * 180 / Math.PI;
            return props.timeSteps.map(() => direction);
        });
        
        // 格式化日期
        const formatDay = (date) => {
            const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            const month = date.getMonth() + 1;
            const day = date.getDate();
            return `${month}/${day} ${days[date.getDay()]}`;
        };
        
        const formatHour = (date) => {
            return `${date.getHours()}:00`;
        };
        
        // 选择时间
        const selectTime = (index) => {
            currentTimeIndex.value = index;
            emit('timeChange', index);
            
            // 滚动到选中的时间
            nextTick(() => {
                if (timelineRef.value) {
                    const activeSlot = timelineRef.value.querySelector('.time-slot.active');
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
        
        // 监听显示状态，自动滚动到当前时间
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
            hasWind,
            hasWave,
            hasCurrent,
            hasInternalWave,
            windSpeedColorMap,
            waveHeightColorMap,
            currentSpeedColorMap,
            internalWaveColorMap,
            windSpeedValues,
            windDirections,
            waveHeightValues,
            currentSpeedValues,
            currentDirections,
            internalWaveValues,
            internalWaveDirections,
            formatDay,
            formatHour,
            selectTime,
            close
        };
    }
};
</script>

<style scoped>
.windy-panel {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    max-width: 1400px;
    background: rgba(20, 20, 30, 0.98);
    backdrop-filter: blur(20px);
    border-top: 2px solid rgba(0, 212, 255, 0.5);
    box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.8);
    z-index: 1000;
    max-height: 50vh;
    display: flex;
    flex-direction: column;
    border-radius: 8px 8px 0 0;
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    border-bottom: 1px solid rgba(100, 100, 100, 0.3);
    background: rgba(30, 30, 40, 0.8);
}

.location-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.location-icon {
    font-size: 20px;
}

.coordinates {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Rajdhani', monospace;
}

.coord {
    font-size: 16px;
    font-weight: bold;
    color: #00d4ff;
}

.separator {
    color: rgba(255, 255, 255, 0.3);
}

.close-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
}

.close-btn:hover {
    background: rgba(255, 0, 0, 0.3);
    border-color: rgba(255, 0, 0, 0.5);
}

.timeline-container {
    border-bottom: 1px solid rgba(100, 100, 100, 0.3);
    background: rgba(25, 25, 35, 0.9);
    overflow-x: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(100, 100, 100, 0.5) transparent;
}

.timeline-container::-webkit-scrollbar {
    height: 8px;
}

.timeline-container::-webkit-scrollbar-track {
    background: transparent;
}

.timeline-container::-webkit-scrollbar-thumb {
    background: rgba(100, 100, 100, 0.5);
    border-radius: 4px;
}

.timeline {
    display: flex;
    padding: 8px 0;
}

.time-slot {
    min-width: 60px;
    width: 76px;
    flex-shrink: 0;
    padding: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.2s;
}

.time-slot:hover {
    background: rgba(0, 212, 255, 0.1);
}

.time-slot.active {
    background: rgba(0, 212, 255, 0.2);
    border-top: 3px solid #00d4ff;
    border-bottom: 3px solid #00d4ff;
}

.day {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.6);
    white-space: nowrap;
}

.hour {
    font-size: 14px;
    font-weight: bold;
    color: white;
    font-family: 'Rajdhani', monospace;
}

.time-slot.active .day,
.time-slot.active .hour {
    color: #00d4ff;
}

.weather-rows {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(100, 100, 100, 0.5) transparent;
}

.weather-rows::-webkit-scrollbar {
    width: 8px;
}

.weather-rows::-webkit-scrollbar-track {
    background: transparent;
}

.weather-rows::-webkit-scrollbar-thumb {
    background: rgba(100, 100, 100, 0.5);
    border-radius: 4px;
}

.panel-footer {
    padding: 8px 20px;
    border-top: 1px solid rgba(100, 100, 100, 0.3);
    background: rgba(30, 30, 40, 0.8);
    text-align: center;
}

.tip {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
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
