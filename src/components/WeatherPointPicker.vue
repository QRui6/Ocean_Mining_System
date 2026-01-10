<template>
    <!-- 浮动标签：显示当前图层数值 -->
    <transition name="fade">
        <div v-if="pickedPoint && !showDetailPanel" 
             :style="{ left: labelPosition.x + 'px', top: labelPosition.y + 'px' }"
             class="absolute pointer-events-auto"
             style="z-index: 100;">
            <div class="bg-slate-900/95 backdrop-blur-xl border-2 border-cyan-500/50 rounded-lg px-4 py-2 shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                <div class="flex items-center gap-3">
                    <!-- 数值显示 -->
                    <div class="text-white">
                        <div class="text-xs text-cyan-400 mb-1">{{ currentLayerName }}</div>
                        <div class="text-2xl font-bold font-['Rajdhani']">{{ currentValue }}</div>
                    </div>
                    
                    <!-- 展开按钮 -->
                    <button @click="toggleDetailPanel" 
                            class="w-8 h-8 flex items-center justify-center bg-cyan-600 hover:bg-cyan-500 rounded transition-colors"
                            title="查看详细数据">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </button>
                    
                    <!-- 关闭按钮 -->
                    <button @click="closePicker" 
                            class="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                            title="关闭">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
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
        
        // 当前数值
        const currentValue = computed(() => {
            if (!props.pickedPoint || !props.currentLayer || !props.weatherData) {
                return 'N/A';
            }
            
            const layerId = props.currentLayer.id;
            const data = props.weatherData[layerId];
            
            if (!data) return 'N/A';
            
            // 根据经纬度获取数据值
            const value = getValueAtPoint(data, props.pickedPoint.lat, props.pickedPoint.lon, props.currentTimeIndex);
            
            // 格式化显示
            return formatValue(layerId, value);
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
                // 获取缩放比例（如果没有则默认为1，即不缩放）
                const scale = newPoint.scale || { x: 1, y: 1 };
                
                // 使用缩放比例修正坐标
                labelPosition.value = {
                    x: (newPoint.screenPosition.x / scale.x) + 10,
                    y: (newPoint.screenPosition.y / scale.y) - 60
                };
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
        
        // 根据经纬度获取数据值
        const getValueAtPoint = (data, lat, lon, timeIndex) => {
            if (!data || !data.u || !data.v) return null;
            
            const { width, height, bounds, landMask } = data;
            const { west, south, east, north } = bounds;
            
            // 将经纬度转换为数据索引
            const x = Math.floor(((lon - west) / (east - west)) * width);
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
            const value = Math.sqrt(u * u + v * v);
            
            // ⭐ 第三层：过滤极小值（额外保险）
            if (value < 0.01) {
                return null;
            }
            
            return value;
        };
        
        // 获取指定时间的数值
        const getValueAtTime = (layerId, timeIndex) => {
            if (!props.pickedPoint || !props.weatherData) return 'N/A';
            
            const data = props.weatherData[layerId];
            if (!data) return 'N/A';
            
            const value = getValueAtPoint(data, props.pickedPoint.lat, props.pickedPoint.lon, timeIndex);
            return formatValue(layerId, value);
        };
        
        // 获取当前图层的数值（简化版，只显示当前值）
        const getCurrentLayerValue = (layerId) => {
            if (!props.pickedPoint || !props.weatherData) return 'N/A';
            
            const data = props.weatherData[layerId];
            if (!data) return 'N/A';
            
            const value = getValueAtPoint(data, props.pickedPoint.lat, props.pickedPoint.lon, 0);
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
            currentValue,
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
    transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
    opacity: 0;
}
</style>
