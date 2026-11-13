<template>
    <!-- 左侧气象图层按钮组 - Windy 风格（镜像） -->
    <transition name="slide-right">
        <div v-if="show" class="fixed left-4 top-1/2 -translate-y-1/2 z-40 pointer-events-auto">
            <div class="flex flex-col gap-2">
                <button
                    v-for="layer in weatherLayers"
                    :key="layer.id"
                    @click="toggleLayer(layer)"
                    class="weather-layer-btn group relative flex items-center"
                >
                    <!-- 整体容器：圆形图标在左，文字在右 -->
                    <div class="flex items-center">
                        <!-- 圆形图标（左侧） -->
                        <div 
                            :class="[
                                'w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 relative flex-shrink-0 z-10 overflow-hidden',
                                getIconBgClass(layer.id)
                            ]"
                        >
                            <!-- 选中时的金色圆环 -->
                            <div 
                                v-if="layer.active"
                                class="absolute inset-0 rounded-full border-[2.5px] border-yellow-400 shadow-lg shadow-yellow-400/50 z-20"
                            ></div>
                            
                            <!-- 图标内容 -->
                            <div 
                                v-html="getIcon(layer.id)" 
                                class="w-full h-full flex items-center justify-center text-white drop-shadow-md"
                            ></div>
                        </div>
                        
                        <!-- 文字标签（右侧，圆角矩形，左边被圆形覆盖） -->
                        <div 
                            :class="[
                                'flex items-center gap-2 px-3.5 pl-6 py-2 backdrop-blur-md rounded-r-full h-11 -ml-4 transition-all duration-200',
                                layer.active 
                                    ? 'bg-gradient-to-r from-cyan-900/95 to-cyan-800/95 border border-cyan-500/50' 
                                    : 'bg-slate-800/95'
                            ]"
                        >
                            <span 
                                :class="[
                                    'text-sm font-medium whitespace-nowrap transition-all duration-200',
                                    layer.active ? 'text-white font-bold' : 'text-slate-400/70 group-hover:text-slate-200'
                                ]"
                            >
                                {{ layer.label }}
                            </span>
                            <span 
                                v-if="layer.hasTimeline"
                                :class="[
                                    'text-[9px] px-1.5 py-0.5 rounded font-mono transition-all duration-200',
                                    layer.active 
                                        ? 'bg-cyan-500/30 border border-cyan-400/50 text-cyan-200' 
                                        : 'bg-cyan-900/30 border border-cyan-500/20 text-cyan-400/60'
                                ]"
                            >
                                TIME
                            </span>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    </transition>
</template>

<script>
import { computed } from 'vue';

export default {
    props: {
        show: { type: Boolean, default: false },
        weatherLayerGroups: { type: Array, default: () => [] }
    },
    emits: ['layerToggle'],
    setup(props, { emit }) {
        const weatherLayers = computed(() => {
            const layers = [];
            props.weatherLayerGroups.forEach(group => {
                if (group.subLayers) {
                    group.subLayers.forEach(sub => {
                        layers.push({ ...sub, groupId: group.id });
                    });
                }
            });
            return layers;
        });
        
        const toggleLayer = (layer) => {
            emit('layerToggle', {
                groupId: layer.groupId,
                layerId: layer.id,
                active: !layer.active
            });
        };
        
        const icons = {
            'owm_clouds': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"/></svg>',
            'owm_precipitation': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999M8 19v2m4-2v2m4-2v2"/></svg>',
            'owm_temp': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v10.5a3 3 0 106 0V3M9 3a3 3 0 016 0M9 3h6m-3 16.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/></svg>',
            'owm_wind': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 11c0-1.657 1.343-3 3-3s3 1.343 3 3m-3 0v8m0-8H6m6 0h6M3 15h3m12 0h3M6 19h3m6 0h3"/></svg>',
            'owm_pressure': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>',
            'wind': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 11c0-1.657 1.343-3 3-3s3 1.343 3 3m-3 0v8m0-8H6m6 0h6M3 15h3m12 0h3M6 19h3m6 0h3"/></svg>',
            'wave': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12c0-1.5 1-3 2.5-3s2.5 1.5 2.5 3-1 3-2.5 3S3 13.5 3 12zm5.5 0c0-1.5 1-3 2.5-3s2.5 1.5 2.5 3-1 3-2.5 3-2.5-1.5-2.5-3zm5.5 0c0-1.5 1-3 2.5-3s2.5 1.5 2.5 3-1 3-2.5 3-2.5-1.5-2.5-3z"/></svg>',
            'current': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6m-3 0a9 9 0 1118 0 9 9 0 01-18 0z"/></svg>',
            'typhoon': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 0V3m0 18v-5m-8-4h5m10 0h-5M6.34 6.34l3.54 3.54m4.24 4.24l3.54 3.54M6.34 17.66l3.54-3.54m4.24-4.24l3.54-3.54"/></svg>',
            'tsunami': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 18c2-4 4-4 6 0s4 4 6 0 4-4 6 0M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0M12 3v3m0 12v3"/></svg>',
            'storm_surge': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999M13 13l-3 5h4l-3 5"/></svg>',
            'extreme_ocean': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
            'extreme_atmosphere': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>',
            'internal_wave': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>'
        };
        
        const defaultIcon = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
        
        const getIcon = (layerId) => {
            // 图片映射 - 根据气象特征合理分配，避免重复
            const imageIcons = {
                // 基础气象
                'wind': '/image/wind.jpg',              // 风场预报
                'wave': '/image/waves.jpg',             // 海浪预报
                'current': '/image/currents.jpg',       // 洋流预报
                
                // OpenWeatherMap
                'owm_clouds': '/image/clouds.jpg',      // 云层覆盖
                'owm_precipitation': '/image/rain.jpg', // 降水分布
                'owm_temp': '/image/temp.jpg',          // 温度分布
                'owm_wind': '/image/wind.jpg',          // 风速分布（与风场共用）
                'owm_pressure': '/image/pressure.jpg',  // 气压分布
                
                // 灾害预警
                'typhoon': '/image/hurricanes.jpg',     // 台风路径预警
                'tsunami': '/image/wavePower.jpg',      // 海啸传播预警（使用波浪能量图）
                'storm_surge': '/image/hurricanes.jpg', // 风暴潮预警（与台风共用）
                
                // 极端环境
                'extreme_ocean': '/image/wavePower.jpg',      // 极端海洋环境（使用波浪能量图）
                'extreme_atmosphere': '/image/aqi.jpg',       // 极端大气环境（使用空气质量图）
                'internal_wave': '/image/deg0.jpg'            // 内波（使用等温线图）
            };
            
            // 如果有对应的图片，返回 img 标签
            if (imageIcons[layerId]) {
                return `<img src="${imageIcons[layerId]}" alt="${layerId}" class="w-full h-full object-cover rounded-full" />`;
            }
            
            // 否则返回默认 SVG 图标
            return icons[layerId] || defaultIcon;
        };
        
        const getIconBgClass = (layerId) => {
            const bgClasses = {
                'owm_clouds': 'bg-gradient-to-br from-gray-400 to-gray-600',
                'owm_precipitation': 'bg-gradient-to-br from-blue-400 to-blue-600',
                'owm_temp': 'bg-gradient-to-br from-orange-400 to-red-500',
                'owm_wind': 'bg-gradient-to-br from-green-400 to-lime-500',
                'owm_pressure': 'bg-gradient-to-br from-indigo-400 to-purple-500',
                'wind': 'bg-gradient-to-br from-green-400 to-lime-500',
                'wave': 'bg-gradient-to-br from-purple-400 to-pink-500',
                'current': 'bg-gradient-to-br from-cyan-400 to-blue-500',
                'typhoon': 'bg-gradient-to-br from-red-500 to-orange-600',
                'tsunami': 'bg-gradient-to-br from-blue-500 to-cyan-600',
                'storm_surge': 'bg-gradient-to-br from-yellow-400 to-orange-500',
                'extreme_ocean': 'bg-gradient-to-br from-red-600 to-pink-600',
                'extreme_atmosphere': 'bg-gradient-to-br from-yellow-500 to-red-600',
                'internal_wave': 'bg-gradient-to-br from-teal-400 to-cyan-500'
            };
            return bgClasses[layerId] || 'bg-gradient-to-br from-slate-600 to-slate-800';
        };
        
        return { weatherLayers, toggleLayer, getIcon, getIconBgClass };
    }
};
</script>

<style scoped>
.weather-layer-btn:hover {
    box-shadow: none !important;
    transform: none !important;
}

.weather-layer-btn:hover > div {
    transform: none !important;
}

.weather-layer-btn:active > div {
    transform: none !important;
}

.slide-right-enter-active, .slide-right-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-right-enter-from { opacity: 0; transform: translate(-100%, -50%); }
.slide-right-leave-to { opacity: 0; transform: translate(-100%, -50%); }

/* 图片图标样式优化 */
:deep(img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
}

/* SVG 图标样式 */
:deep(svg) {
    width: 1.25rem;
    height: 1.25rem;
}
</style>
