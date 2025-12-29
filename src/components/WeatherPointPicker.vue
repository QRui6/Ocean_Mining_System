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
    
    <!-- 详细面板：显示所有时间的所有气象数据 -->
    <transition name="slide-up">
        <div v-if="showDetailPanel" class="absolute bottom-0 left-0 right-0 pointer-events-auto" style="z-index: 100;">
            <div class="bg-slate-900/95 backdrop-blur-xl border-t-2 border-cyan-500/50 shadow-[0_-8px_32px_rgba(0,0,0,0.8)]" 
                 style="max-height: 50vh; min-height: 300px;">
                <!-- 头部 -->
                <div class="flex items-center justify-between px-6 py-3 border-b border-slate-700">
                    <div class="flex items-center gap-3">
                        <div class="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                        <span class="text-white font-medium">气象数据详情</span>
                        <span class="text-sm text-slate-400">
                            {{ pickedPoint ? `${pickedPoint.lat.toFixed(2)}°, ${pickedPoint.lon.toFixed(2)}°` : '' }}
                        </span>
                    </div>
                    <button @click="toggleDetailPanel" 
                            class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <!-- 数据表格 -->
                <div class="overflow-auto" style="max-height: calc(50vh - 60px);">
                    <div v-if="timeSteps.length === 0" class="p-8 text-center text-slate-400">
                        <p>暂无时间序列数据</p>
                        <p class="text-sm mt-2">当前仅显示已加载时间帧的数据</p>
                    </div>
                    <table v-else class="w-full text-sm">
                        <thead class="bg-slate-800 sticky top-0 z-10">
                            <tr>
                                <th class="px-4 py-2 text-left text-cyan-400 font-medium whitespace-nowrap">图层</th>
                                <th class="px-4 py-2 text-center text-cyan-400 font-medium whitespace-nowrap">当前值</th>
                                <th class="px-4 py-2 text-center text-cyan-400 font-medium whitespace-nowrap">单位</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="layer in availableLayers" :key="layer.id"
                                class="border-b border-slate-700 hover:bg-slate-800/50 transition-colors">
                                <td class="px-4 py-2 text-slate-300 whitespace-nowrap">
                                    {{ layer.name }}
                                </td>
                                <td class="px-4 py-2 text-center text-white font-['Rajdhani'] font-bold text-xl whitespace-nowrap">
                                    {{ getCurrentLayerValue(layer.id) }}
                                </td>
                                <td class="px-4 py-2 text-center text-slate-400 whitespace-nowrap">
                                    {{ layer.unit }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div class="p-4 text-center text-xs text-slate-500 border-t border-slate-700">
                        <p>💡 提示：当前显示的是已加载时间帧的数据</p>
                        <p class="mt-1">使用时间轴切换不同时间的数据</p>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
import { ref, computed, watch } from 'vue';

export default {
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
    emits: ['close'],
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
            return layers;
        });
        
        // 监听点击位置变化，更新标签位置
        watch(() => props.pickedPoint, (newPoint) => {
            if (newPoint && newPoint.screenPosition) {
                labelPosition.value = {
                    x: newPoint.screenPosition.x + 10,
                    y: newPoint.screenPosition.y - 60
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
            
            const { width, height, bounds } = data;
            const { west, south, east, north } = bounds;
            
            // 将经纬度转换为数据索引
            const x = Math.floor(((lon - west) / (east - west)) * width);
            const y = Math.floor(((north - lat) / (north - south)) * height);
            
            // 边界检查
            if (x < 0 || x >= width || y < 0 || y >= height) return null;
            
            const index = y * width + x;
            const u = data.u.array[index];
            const v = data.v.array[index];
            
            // 计算强度
            return Math.sqrt(u * u + v * v);
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
                current: 'm/s'
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
            formatTime
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

.slide-up-enter-active, .slide-up-leave-active {
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
