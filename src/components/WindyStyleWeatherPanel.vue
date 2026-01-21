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
            
            <!-- 时间轴 - Windy 风格：日期分组 + 小时数字 -->
            <div class="timeline-container">
                <div class="timeline" ref="timelineRef">
                    <!-- 日期分组头部 -->
                    <div class="date-row">
                        <!-- 左侧占位（与数据行标签列对齐） -->
                        <div class="timeline-label-spacer"></div>
                        <!-- 日期分组 -->
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
                        <!-- 左侧占位（与数据行标签列对齐） -->
                        <div class="timeline-label-spacer"></div>
                        <!-- 小时槽 -->
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
            <!-- <div class="panel-footer">
                <span class="tip">💡 点击时间轴切换不同时间的预报数据</span>
            </div> -->
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
        
        // ==================== 后端时间序列数据 ====================
        const backendTimeSeriesData = ref(null);
        const isLoadingBackendData = ref(false);
        const backendError = ref(null);
        
        // 从后端获取时间序列数据
        const fetchTimeSeriesFromBackend = async () => {
            if (!props.lat || !props.lon || !props.timeSteps.length) {
                console.log('⚠️ 缺少必要参数，跳过后端时间序列查询', {
                    lat: props.lat,
                    lon: props.lon,
                    timeStepsLength: props.timeSteps.length
                });
                return;
            }
            
            isLoadingBackendData.value = true;
            backendError.value = null;
            
            try {
                const url = `${API_ENDPOINTS.WEATHER.TIME_SERIES}?lat=${props.lat}&lon=${props.lon}&startIndex=0&count=${props.timeSteps.length}`;
                console.log(`🌊 从后端查询时间序列: ${url}`);
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    signal: AbortSignal.timeout(10000)
                });
                
                console.log(`📡 后端响应状态: ${response.status} ${response.statusText}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const result = await response.json();
                console.log('📦 后端返回数据:', result);
                
                if (result.success) {
                    console.log('✅ 后端时间序列数据查询成功，数据点数:', result.data.timeSteps?.length);
                    backendTimeSeriesData.value = result.data;
                } else {
                    throw new Error(result.error || '查询失败');
                }
            } catch (err) {
                console.error('❌ 后端时间序列查询失败:', err);
                console.log('⚠️ 将降级到前端计算');
                backendError.value = err.message || '查询失败';
                backendTimeSeriesData.value = null;
            } finally {
                isLoadingBackendData.value = false;
            }
        };
        
        // 监听显示状态和位置变化，自动加载时间序列数据
        watch(() => [props.show, props.lat, props.lon], ([newShow]) => {
            if (newShow) {
                fetchTimeSeriesFromBackend();
            }
        }, { immediate: true });
        
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
        
        // 格式化日期头部（如：Saturday 10）
        const formatDateHeader = (dateKey) => {
            const [year, month, day] = dateKey.split('-');
            const date = new Date(year, month - 1, day);
            const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            return `${weekdays[date.getDay()]} ${parseInt(day)}`;
        };
        
        // 检查是否有各类数据（优先使用后端数据，降级到前端数据）
        const hasWind = computed(() => {
            // 优先检查后端数据
            if (backendTimeSeriesData.value && backendTimeSeriesData.value.timeSteps) {
                const hasBackendWind = backendTimeSeriesData.value.timeSteps.some(step => step.wind !== null);
                if (hasBackendWind) {
                    console.log('💨 使用后端风场数据');
                    return true;
                }
            }
            
            // 降级到前端数据
            const result = props.weatherData.wind && props.weatherData.wind.u;
            if (result) {
                console.log('💨 降级使用前端风场数据');
            }
            return result;
        });
        
        const hasWave = computed(() => {
            // 优先检查后端数据
            if (backendTimeSeriesData.value && backendTimeSeriesData.value.timeSteps) {
                const hasBackendWave = backendTimeSeriesData.value.timeSteps.some(step => step.wave !== null);
                if (hasBackendWave) {
                    console.log('🌊 使用后端波浪数据');
                    return true;
                }
            }
            
            // 降级到前端数据
            return props.weatherData.wave && props.weatherData.wave.u;
        });
        
        const hasCurrent = computed(() => {
            // 优先检查后端数据
            if (backendTimeSeriesData.value && backendTimeSeriesData.value.timeSteps) {
                const hasBackendCurrent = backendTimeSeriesData.value.timeSteps.some(step => step.current !== null);
                if (hasBackendCurrent) {
                    console.log('🌀 使用后端洋流数据');
                    return true;
                }
            }
            
            // 降级到前端数据
            return props.weatherData.current && props.weatherData.current.u;
        });
        
        const hasInternalWave = computed(() => {
            // 优先检查后端数据
            if (backendTimeSeriesData.value && backendTimeSeriesData.value.timeSteps) {
                const hasBackendInternalWave = backendTimeSeriesData.value.timeSteps.some(step => step.internalWave !== null);
                if (hasBackendInternalWave) {
                    console.log('〰️ 使用后端内波数据');
                    return true;
                }
            }
            
            // 降级到前端数据
            const result = props.weatherData.internal_wave && props.weatherData.internal_wave.u;
            if (result) {
                console.log('〰️ 使用前端内波数据');
            }
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
        
        // 从网格数据中获取标量值（如波高）
        const getScalarAtPoint = (data, lat, lon, fieldName = 'hs') => {
            if (!data || !data[fieldName]) {
                console.log(`❌ ${fieldName} 数据不存在`);
                return null;
            }
            
            const { width, height, bounds, landMask } = data;
            const { west, south, east, north } = bounds;
            
            // 处理经度坐标系转换
            let adjustedLon = lon;
            if (west >= 0 && east > 180 && lon < 0) {
                adjustedLon = lon + 360;
            }
            
            // 经纬度 → 网格索引
            const x = Math.floor(((adjustedLon - west) / (east - west)) * width);
            const y = Math.floor(((north - lat) / (north - south)) * height);
            
            // 边界检查
            if (x < 0 || x >= width || y < 0 || y >= height) {
                return null;
            }
            
            const index = y * width + x;
            
            // 检查陆地标记
            if (landMask && landMask[index] === 1) {
                return null;
            }
            
            const value = data[fieldName].array[index];
            
            // 过滤无效值
            if (value === null || value === undefined || value < 0) {
                return null;
            }
            
            return value;
        };
        
        // 从网格数据中获取指定点的值
        const getValueAtPoint = (data, lat, lon, dataType = 'unknown') => {
            if (!data || !data.u || !data.v) {
                console.log(`❌ ${dataType} 数据不存在`);
                return null;
            }
            
            const { width, height, bounds, landMask } = data;
            const { west, south, east, north } = bounds;
            
            // 处理经度坐标系转换
            // 如果数据是 0-360 坐标系，而输入是 -180~180，需要转换
            let adjustedLon = lon;
            if (west >= 0 && east > 180 && lon < 0) {
                // 数据是 0-360，输入是负数（-180~0），转换为 180-360
                adjustedLon = lon + 360;
                console.log(`🔄 ${dataType} 经度转换: ${lon}° → ${adjustedLon}°`);
            }
            
            // 经纬度 → 网格索引
            const x = Math.floor(((adjustedLon - west) / (east - west)) * width);
            const y = Math.floor(((north - lat) / (north - south)) * height);
            
            // 边界检查
            if (x < 0 || x >= width || y < 0 || y >= height) {
                console.log(`❌ ${dataType} 超出边界`, { x, y, width, height, lon: adjustedLon, lat });
                return null;
            }
            
            const index = y * width + x;
            
            // 检查陆地标记
            if (landMask && landMask[index] === 1) {
                console.log(`❌ ${dataType} 陆地区域`);
                return null;
            }
            
            const u = data.u.array[index];
            const v = data.v.array[index];
            
            console.log(`📊 ${dataType} 原始数据`, { u, v, lat, lon: adjustedLon, index });
            
            // 计算速度
            const speed = Math.sqrt(u * u + v * v);
            
            console.log(`📊 ${dataType} 计算速度`, speed);
            
            // 根据数据类型还原真实值（除以放大倍数）
            let realSpeed = speed;
            if (dataType === 'current') {
                // 洋流数据放大了 15 倍，需要还原
                realSpeed = speed / 15;
                console.log(`🔧 ${dataType} 还原真实值: ${speed.toFixed(2)} → ${realSpeed.toFixed(4)} m/s`);
            } else if (dataType === 'internal_wave') {
                // 内波数据放大了 5000 倍，需要还原
                realSpeed = speed / 5000;
                console.log(`🔧 ${dataType} 还原真实值: ${speed.toFixed(2)} → ${realSpeed.toFixed(6)} m/s`);
            }
            
            // 不过滤小值（风平浪静也是有效数据）
            return realSpeed;
        };
        
        // 获取 U/V 分量
        const getUVAtPoint = (data, lat, lon) => {
            if (!data || !data.u || !data.v) return { u: 0, v: 0 };
            
            const { width, height, bounds } = data;
            const { west, south, east, north } = bounds;
            
            // 处理经度坐标系转换
            let adjustedLon = lon;
            if (west >= 0 && east > 180 && lon < 0) {
                adjustedLon = lon + 360;
            }
            
            const x = Math.floor(((adjustedLon - west) / (east - west)) * width);
            const y = Math.floor(((north - lat) / (north - south)) * height);
            
            if (x < 0 || x >= width || y < 0 || y >= height) return { u: 0, v: 0 };
            
            const index = y * width + x;
            
            return {
                u: data.u.array[index],
                v: data.v.array[index]
            };
        };
        
        // 计算风速值（优先使用后端数据，降级到前端计算）
        const windSpeedValues = computed(() => {
            if (!hasWind.value) {
                return [];
            }
            
            // 优先使用后端数据
            if (backendTimeSeriesData.value && backendTimeSeriesData.value.timeSteps) {
                console.log('💨 使用后端风速数据');
                return backendTimeSeriesData.value.timeSteps.map(step => {
                    return step.wind ? step.wind.speed : null;
                });
            }
            
            // 降级到前端计算
            console.log('💨 降级到前端计算风速');
            const value = getValueAtPoint(props.weatherData.wind, props.lat, props.lon, 'wind');
            return props.timeSteps.map(() => value);
        });
        
        // 计算风向（优先使用后端数据）
        const windDirections = computed(() => {
            if (!hasWind.value) return [];
            
            // 优先使用后端数据
            if (backendTimeSeriesData.value && backendTimeSeriesData.value.timeSteps) {
                return backendTimeSeriesData.value.timeSteps.map(step => {
                    return step.wind ? step.wind.direction : null;
                });
            }
            
            // 降级到前端计算
            const { u, v } = getUVAtPoint(props.weatherData.wind, props.lat, props.lon);
            const direction = Math.atan2(u, v) * 180 / Math.PI;
            return props.timeSteps.map(() => direction);
        });
        
        // 计算波高值（优先使用后端数据）
        const waveHeightValues = computed(() => {
            if (!hasWave.value) return [];
            
            // 优先使用后端数据
            if (backendTimeSeriesData.value && backendTimeSeriesData.value.timeSteps) {
                console.log('🌊 使用后端波高数据');
                return backendTimeSeriesData.value.timeSteps.map(step => {
                    return step.wave && step.wave.height !== null ? step.wave.height : null;
                });
            }
            
            // 降级到前端计算
            console.log('🌊 降级到前端计算波高');
            const value = getScalarAtPoint(props.weatherData.wave, props.lat, props.lon, 'hs');
            return props.timeSteps.map(() => value);
        });
        
        // 计算波浪方向（优先使用后端数据）
        const waveDirections = computed(() => {
            if (!hasWave.value) return [];
            
            // 优先使用后端数据
            if (backendTimeSeriesData.value && backendTimeSeriesData.value.timeSteps) {
                return backendTimeSeriesData.value.timeSteps.map(step => {
                    return step.wave ? step.wave.direction : null;
                });
            }
            
            // 降级到前端计算
            const { u, v } = getUVAtPoint(props.weatherData.wave, props.lat, props.lon);
            const direction = Math.atan2(u, v) * 180 / Math.PI;
            return props.timeSteps.map(() => direction);
        });
        
        // 计算波浪漂移速度（优先使用后端数据）
        const waveDriftValues = computed(() => {
            if (!hasWave.value) return [];
            
            // 优先使用后端数据
            if (backendTimeSeriesData.value && backendTimeSeriesData.value.timeSteps) {
                return backendTimeSeriesData.value.timeSteps.map(step => {
                    return step.wave ? step.wave.speed : null;
                });
            }
            
            // 降级到前端计算
            const { u, v } = getUVAtPoint(props.weatherData.wave, props.lat, props.lon);
            const speed = Math.sqrt(u * u + v * v);
            return props.timeSteps.map(() => speed);
        });
        
        // 计算波峰传播速度（优先使用后端数据）
        const wavePhaseSpeedValues = computed(() => {
            if (!hasWave.value) return [];
            
            // 优先使用后端数据
            if (backendTimeSeriesData.value && backendTimeSeriesData.value.timeSteps) {
                return backendTimeSeriesData.value.timeSteps.map(step => {
                    if (!step.wave || !step.wave.height || step.wave.height <= 0) {
                        return null;
                    }
                    // 使用经验公式：c ≈ 1.25 × √H （深水波近似）
                    return 1.25 * Math.sqrt(step.wave.height);
                });
            }
            
            // 降级到前端计算
            const waveHeight = getScalarAtPoint(props.weatherData.wave, props.lat, props.lon, 'hs');
            if (waveHeight === null || waveHeight <= 0) {
                return props.timeSteps.map(() => null);
            }
            const phaseSpeed = 1.25 * Math.sqrt(waveHeight);
            return props.timeSteps.map(() => phaseSpeed);
        });
        
        // 计算洋流值（优先使用后端数据）
        const currentSpeedValues = computed(() => {
            if (!hasCurrent.value) {
                return [];
            }
            
            // 优先使用后端数据
            if (backendTimeSeriesData.value && backendTimeSeriesData.value.timeSteps) {
                console.log('🌀 使用后端洋流数据');
                return backendTimeSeriesData.value.timeSteps.map(step => {
                    return step.current ? step.current.speed : null;
                });
            }
            
            // 降级到前端计算
            console.log('🌀 降级到前端计算洋流');
            const value = getValueAtPoint(props.weatherData.current, props.lat, props.lon, 'current');
            return props.timeSteps.map(() => value);
        });
        
        // 计算洋流方向（优先使用后端数据）
        const currentDirections = computed(() => {
            if (!hasCurrent.value) return [];
            
            // 优先使用后端数据
            if (backendTimeSeriesData.value && backendTimeSeriesData.value.timeSteps) {
                return backendTimeSeriesData.value.timeSteps.map(step => {
                    return step.current ? step.current.direction : null;
                });
            }
            
            // 降级到前端计算
            const { u, v } = getUVAtPoint(props.weatherData.current, props.lat, props.lon);
            const direction = Math.atan2(u, v) * 180 / Math.PI;
            return props.timeSteps.map(() => direction);
        });
        
        // 计算内波值（优先使用后端数据）
        const internalWaveValues = computed(() => {
            if (!hasInternalWave.value) {
                return [];
            }
            
            // 优先使用后端数据
            if (backendTimeSeriesData.value && backendTimeSeriesData.value.timeSteps) {
                console.log('〰️ 使用后端内波数据');
                return backendTimeSeriesData.value.timeSteps.map(step => {
                    return step.internalWave ? step.internalWave.speed : null;
                });
            }
            
            // 降级到前端计算
            console.log('〰️ 降级到前端计算内波');
            const value = getValueAtPoint(props.weatherData.internal_wave, props.lat, props.lon, 'internal_wave');
            return props.timeSteps.map(() => value);
        });
        
        // 计算内波方向（优先使用后端数据）
        const internalWaveDirections = computed(() => {
            if (!hasInternalWave.value) return [];
            
            // 优先使用后端数据
            if (backendTimeSeriesData.value && backendTimeSeriesData.value.timeSteps) {
                return backendTimeSeriesData.value.timeSteps.map(step => {
                    return step.internalWave ? step.internalWave.direction : null;
                });
            }
            
            // 降级到前端计算
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
            groupedByDate,
            formatDateHeader,
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
            waveDirections,
            waveDriftValues,
            wavePhaseSpeedValues,
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

.timeline-container {
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(25, 25, 35, 0.6);
    overflow-x: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(100, 100, 100, 0.4) transparent;
}

.timeline-container::-webkit-scrollbar {
    height: 6px;
}

.timeline-container::-webkit-scrollbar-track {
    background: transparent;
}

.timeline-container::-webkit-scrollbar-thumb {
    background: rgba(100, 100, 100, 0.4);
    border-radius: 3px;
}

.timeline-container::-webkit-scrollbar-thumb:hover {
    background: rgba(100, 100, 100, 0.6);
}

.timeline {
    display: flex;
    flex-direction: column;
}

/* 左侧占位区域（与数据行标签列对齐） */
.timeline-label-spacer {
    width: 100px;
    flex-shrink: 0;
    background: rgba(25, 25, 35, 0.8);
    border-right: 1px solid rgba(255, 255, 255, 0.08);
}

/* 日期行 */
.date-row {
    display: flex;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(30, 30, 40, 0.5);
}

/* 日期分组头部 */
.date-groups {
    display: flex;
    flex: 1;
    overflow-x: auto;
    scrollbar-width: none;
}

.date-groups::-webkit-scrollbar {
    display: none;
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

/* 小时行 */
.hour-row {
    display: flex;
}

/* 小时时间槽 */
.hour-slots {
    display: flex;
    flex: 1;
    overflow-x: auto;
    scrollbar-width: none;
}

.hour-slots::-webkit-scrollbar {
    display: none;
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
    scrollbar-width: thin;
    scrollbar-color: rgba(100, 100, 100, 0.4) transparent;
    background: rgba(20, 20, 30, 0.4);
    min-height: 0;
}

.weather-rows::-webkit-scrollbar {
    width: 6px;
}

.weather-rows::-webkit-scrollbar-track {
    background: transparent;
}

.weather-rows::-webkit-scrollbar-thumb {
    background: rgba(100, 100, 100, 0.4);
    border-radius: 3px;
}

.weather-rows::-webkit-scrollbar-thumb:hover {
    background: rgba(100, 100, 100, 0.6);
}

.panel-footer {
    padding: 6px 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(25, 25, 35, 0.8);
    text-align: center;
    min-height: 28px;
}

.tip {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.4);
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
