<template>
    <transition name="slide-up">
        <div v-if="show && currentLayer" class="absolute bottom-0 left-0 right-0 z-50 pointer-events-none flex justify-center">
            <!-- Windy 风格时间轴面板 -->
            <div class="bg-slate-900/50 backdrop-blur-xl border border-cyan-500/20 rounded-t-xl shadow-[0_-8px_32px_rgba(0,0,0,0.6)] pointer-events-auto" style="max-width: 1400px; width: 90%;">
                <div class="px-8 py-3">
                    <!-- 顶部信息栏 -->
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-4">
                            <!-- 图层信息 -->
                            <div class="flex items-center gap-2">
                                <div class="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                                <span class="text-sm font-medium text-white">{{ currentLayer.label }}</span>
                                <span class="text-xs text-slate-400 px-2 py-0.5 bg-slate-800/50 rounded border border-slate-700">
                                    {{ currentLayer.dataSource }}
                                </span>
                            </div>
                            
                            <!-- 当前时间显示 -->
                            <div class="flex items-center gap-2 px-3 py-1 bg-slate-800/50 rounded border border-slate-700">
                                <svg class="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                <span class="text-sm font-mono text-white">{{ formatDateTime(currentTime) }}</span>
                                <span v-if="isCurrentTime" class="text-xs text-green-400 font-medium">NOW</span>
                                <span v-else-if="isFutureTime" class="text-xs text-orange-400 font-medium">+{{ forecastHours }}h</span>
                                <span v-else class="text-xs text-blue-400 font-medium">{{ pastHours }}h</span>
                            </div>
                        </div>
                        
                        <div class="flex items-center gap-2">
                            <!-- 速度控制 -->
                            <div class="flex items-center gap-1 bg-slate-800/50 rounded border border-slate-700 p-0.5">
                                <button 
                                    v-for="speed in [0.5, 1, 2, 4]"
                                    :key="speed"
                                    @click="playSpeed = speed"
                                    :class="[
                                        'px-2 py-1 text-xs rounded transition-all',
                                        playSpeed === speed 
                                            ? 'bg-cyan-600 text-white' 
                                            : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                    ]"
                                >
                                    {{ speed }}x
                                </button>
                            </div>
                            
                            <!-- 关闭按钮 -->
                            <button 
                                @click="$emit('close')" 
                                class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all border border-slate-700"
                                title="关闭时间轴"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <!-- 时间轴主体 -->
                    <div class="flex items-center gap-3">
                        <!-- 播放控制 -->
                        <button 
                            @click="togglePlay"
                            class="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 rounded-lg shadow-lg transition-all transform hover:scale-105"
                            :title="isPlaying ? '暂停' : '播放'"
                        >
                            <svg v-if="!isPlaying" class="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                            <svg v-else class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                            </svg>
                        </button>
                        
                        <!-- 时间轴容器 -->
                        <div class="flex-1 relative" style="height: 60px; padding-top: 24px; padding-bottom: 20px;">
                            <!-- 日期标签层（在轨道上方） -->
                            <div class="absolute left-0 right-0 top-0 h-5 pointer-events-none">
                                <div 
                                    v-for="(day, idx) in dayMarkers" 
                                    :key="`day-${idx}`"
                                    :style="{ left: `${day.position}%` }"
                                    class="absolute top-0 -translate-x-1/2"
                                >
                                    <!-- 日期标签 -->
                                    <div class="px-2 py-0.5 bg-slate-800/90 rounded text-xs font-medium whitespace-nowrap border border-slate-700"
                                         :class="day.isToday ? 'text-green-400 border-green-500/30' : 'text-slate-300'">
                                        {{ day.label }}
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 轨道区域 -->
                            <div class="absolute left-0 right-0 top-6 h-8 flex items-center">
                                <!-- 背景轨道 -->
                                <div class="relative w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <!-- 历史数据区域（蓝色） -->
                                    <div 
                                        v-if="nowIndex > 0"
                                        :style="{ width: `${(nowIndex / (timeSteps.length - 1)) * 100}%` }"
                                        class="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-600/40 to-blue-500/40"
                                    ></div>
                                    <!-- 预报数据区域（橙色） -->
                                    <div 
                                        v-if="nowIndex < timeSteps.length - 1"
                                        :style="{ 
                                            left: `${(nowIndex / (timeSteps.length - 1)) * 100}%`,
                                            width: `${((timeSteps.length - 1 - nowIndex) / (timeSteps.length - 1)) * 100}%`
                                        }"
                                        class="absolute top-0 h-full bg-gradient-to-r from-orange-600/40 to-orange-500/40"
                                    ></div>
                                    <!-- 已播放进度 -->
                                    <div 
                                        :style="{ width: `${(currentIndex / (timeSteps.length - 1)) * 100}%` }"
                                        class="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-200"
                                    ></div>
                                </div>
                                
                                <!-- 日期分隔线（只在轨道高度内） -->
                                <div class="absolute inset-0 pointer-events-none">
                                    <div 
                                        v-for="(day, idx) in dayMarkers" 
                                        :key="`day-line-${idx}`"
                                        :style="{ left: `${day.position}%` }"
                                        class="absolute top-0 bottom-0"
                                    >
                                        <div class="absolute top-0 bottom-0 w-px bg-slate-600/50"></div>
                                    </div>
                                </div>
                                
                                <!-- 小时刻度线（只在轨道下半部分） -->
                                <div class="absolute inset-0 pointer-events-none">
                                    <div 
                                        v-for="(hour, idx) in hourMarkers" 
                                        :key="`hour-${idx}`"
                                        :style="{ left: `${hour.position}%` }"
                                        class="absolute top-1/2"
                                    >
                                        <div class="w-px h-2 bg-slate-600/30"></div>
                                    </div>
                                </div>
                                
                                <!-- 所有时间点标记（小圆点） -->
                                <div class="absolute inset-0 pointer-events-none">
                                    <div 
                                        v-for="(step, idx) in timeSteps" 
                                        :key="`step-${idx}`"
                                        :style="{ left: `${getIndexPosition(idx)}%` }"
                                        class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                                    >
                                        <div 
                                            :class="[
                                                'w-1.5 h-1.5 rounded-full transition-all',
                                                idx === currentIndex 
                                                    ? 'bg-cyan-400 scale-150' 
                                                    : idx <= nowIndex 
                                                        ? 'bg-blue-400/60' 
                                                        : 'bg-orange-400/60'
                                            ]"
                                        ></div>
                                    </div>
                                </div>
                                
                                <!-- 当前时间标记线（只在轨道高度内，稍微延伸） -->
                                <div 
                                    v-if="nowIndex >= 0"
                                    :style="{ left: `${(nowIndex / (timeSteps.length - 1)) * 100}%` }"
                                    class="absolute -top-1 -bottom-1 w-0.5 bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.6)] z-10"
                                >
                                    <div class="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-green-400 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                                    <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-green-400 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                                </div>
                                
                                <!-- 滑块 -->
                                <input 
                                    type="range" 
                                    v-model="currentIndex"
                                    :min="0" 
                                    :max="timeSteps.length - 1"
                                    class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                    @input="onTimeChange"
                                    @mousedown="pauseAutoUpdate"
                                    @mouseup="resumeAutoUpdate"
                                />
                                
                                <!-- 自定义滑块指示器 -->
                                <div 
                                    :style="{ left: `${(currentIndex / (timeSteps.length - 1)) * 100}%` }"
                                    class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white rounded-full shadow-lg border-2 border-cyan-500 z-30 pointer-events-none transition-transform duration-100"
                                    :class="{ 'scale-125': isDragging }"
                                >
                                    <div class="absolute inset-0.5 bg-cyan-500 rounded-full"></div>
                                </div>
                            </div>
                            
                            <!-- 小时标签层（在轨道下方） -->
                            <div class="absolute left-0 right-0 bottom-0 h-4 pointer-events-none">
                                <!-- 显示每6小时的时间标签 -->
                                <template v-for="(hour, idx) in hourMarkers" :key="`hour-label-${idx}`">
                                    <div 
                                        v-if="hour.showLabel"
                                        :style="{ left: `${hour.position}%` }"
                                        class="absolute top-0 -translate-x-1/2"
                                    >
                                        <span class="text-[10px] font-mono text-slate-500">{{ hour.label }}</span>
                                    </div>
                                </template>
                                
                                <!-- 显示每个时间步的简短标记（仅在3小时步长时） -->
                                <template v-if="timeStepHours === 3">
                                    <div 
                                        v-for="(step, idx) in timeSteps" 
                                        :key="`step-label-${idx}`"
                                        :style="{ left: `${getIndexPosition(idx)}%` }"
                                        class="absolute top-0 -translate-x-1/2"
                                    >
                                        <div 
                                            v-if="step.getHours() % 6 !== 0 && step.getHours() !== 0"
                                            class="text-[8px] font-mono text-slate-600/50"
                                        >
                                            {{ step.getHours().toString().padStart(2, '0') }}
                                        </div>
                                    </div>
                                </template>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
import { ref, computed, watch, onUnmounted, onMounted } from 'vue';

export default {
    props: {
        show: {
            type: Boolean,
            default: false
        },
        // 当前激活的气象图层列表
        activeWeatherLayers: {
            type: Array,
            default: () => []
        }
    },
    emits: ['close', 'timeChange'],
    setup(props, { emit }) {
        const isPlaying = ref(false);
        const currentIndex = ref(0);
        const playSpeed = ref(1);
        const playInterval = ref(null);
        const timeSteps = ref([]);
        const isDragging = ref(false);
        const autoUpdateEnabled = ref(true);
        const autoUpdateInterval = ref(null);
        
        // 当前控制的图层（优先级：本地数据）
        const currentLayer = computed(() => {
            console.log('🔍 TimelineControl - 检查激活的图层:', props.activeWeatherLayers);
            console.log('🔍 TimelineControl - show prop:', props.show);
            
            if (!props.activeWeatherLayers || props.activeWeatherLayers.length === 0) {
                console.log('⚠️ TimelineControl - 没有激活的气象图层');
                return null;
            }
            
            // 优先选择本地数据图层（wave, current, wind）
            const localLayer = props.activeWeatherLayers.find(
                layer => layer.hasTimeline && (layer.id === 'wave' || layer.id === 'current' || layer.id === 'wind')
            );
            
            if (localLayer) {
                console.log('✅ TimelineControl - 找到本地图层:', localLayer);
                return localLayer;
            }
            
            // 选择任何有时间轴的图层
            const anyLayer = props.activeWeatherLayers.find(layer => layer.hasTimeline);
            console.log('🔍 TimelineControl - 查找任何有时间轴的图层:', anyLayer);
            return anyLayer;
        });
        
        // 根据当前图层生成时间步长（从 meta.json 读取）
        const generateTimeSteps = async () => {
            if (!currentLayer.value) {
                return [];
            }
            
            const layerId = currentLayer.value.id;
            const steps = [];
            const now = new Date();
            
            // 本地数据图层：从 meta.json 读取时间信息
            if (['wind', 'wave', 'current'].includes(layerId)) {
                try {
                    // 路径映射：根据图层ID找到对应的数据目录
                    const pathMap = {
                        'wind': '/wind_data/meta.json',
                        'wave': '/wave_data/meta.json',  // 如果没有，需要创建
                        'current': '/ocean_currents/meta.json'
                    };
                    
                    const metaPath = pathMap[layerId];
                    console.log(`📖 读取元数据: ${metaPath}`);
                    
                    const response = await fetch(metaPath);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const meta = await response.json();
                    console.log(`✅ ${layerId} 元数据:`, meta);
                    
                    // 从 meta.json 读取参数
                    const startTime = new Date(meta.start_time);
                    const frames = meta.frames;
                    const timeStepHours = meta.time_step_hours;
                    
                    console.log(`⏰ ${layerId} 时间参数:`, {
                        startTime: startTime.toISOString(),
                        frames,
                        timeStepHours
                    });
                    
                    // 生成时间步长
                    for (let i = 0; i < frames; i++) {
                        const time = new Date(startTime);
                        time.setHours(time.getHours() + i * timeStepHours);
                        steps.push(time);
                    }
                    
                    console.log(`✅ 生成 ${steps.length} 个时间步`);
                } catch (err) {
                    console.error(`❌ 读取 ${layerId} 元数据失败:`, err);
                    // 降级方案：使用默认值
                    console.warn(`⚠️ 使用默认时间配置`);
                    const startTime = new Date('2025-12-26T00:00:00Z');
                    const defaultConfig = {
                        wind: { frames: 20, stepHours: 3 },
                        wave: { frames: 65, stepHours: 3 },
                        current: { frames: 9, stepHours: 24 }
                    };
                    const config = defaultConfig[layerId];
                    for (let i = 0; i < config.frames; i++) {
                        const time = new Date(startTime);
                        time.setHours(time.getHours() + i * config.stepHours);
                        steps.push(time);
                    }
                }
            }
            // 其他图层：默认生成7天的时间步长
            else {
                for (let i = 0; i < 28; i++) {
                    const time = new Date(now);
                    time.setHours(time.getHours() + i * 6);
                    steps.push(time);
                }
            }
            
            return steps;
        };
        
        // 找到最接近当前时间的索引
        const findNowIndex = () => {
            if (timeSteps.value.length === 0) return 0;
            
            const now = new Date();
            let closestIndex = 0;
            let minDiff = Math.abs(timeSteps.value[0] - now);
            
            for (let i = 1; i < timeSteps.value.length; i++) {
                const diff = Math.abs(timeSteps.value[i] - now);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestIndex = i;
                }
            }
            
            return closestIndex;
        };
        
        // 当前时间在时间轴上的索引
        const nowIndex = computed(() => findNowIndex());
        
        // 监听图层变化，重新生成时间步长
        watch(() => currentLayer.value, async (newLayer, oldLayer) => {
            if (newLayer && newLayer.id !== oldLayer?.id) {
                console.log('🔄 切换图层，重新生成时间步长:', newLayer.id);
                timeSteps.value = await generateTimeSteps();
                
                // 默认定位到当前时间
                currentIndex.value = nowIndex.value;
                
                // 停止播放
                if (isPlaying.value) {
                    togglePlay();
                }
                
                // 发送初始时间
                onTimeChange();
            }
        }, { immediate: true });
        
        const currentTime = computed(() => {
            return timeSteps.value[currentIndex.value] || new Date();
        });
        
        // 判断当前选中的时间是否是"现在"
        const isCurrentTime = computed(() => {
            return Math.abs(currentIndex.value - nowIndex.value) <= 1;
        });
        
        // 判断是否是未来时间
        const isFutureTime = computed(() => {
            return currentIndex.value > nowIndex.value;
        });
        
        // 预报小时数
        const forecastHours = computed(() => {
            if (!isFutureTime.value) return 0;
            const diff = currentTime.value - timeSteps.value[nowIndex.value];
            return Math.round(diff / (1000 * 60 * 60));
        });
        
        // 过去小时数
        const pastHours = computed(() => {
            if (isFutureTime.value || isCurrentTime.value) return 0;
            const diff = timeSteps.value[nowIndex.value] - currentTime.value;
            return Math.round(diff / (1000 * 60 * 60));
        });
        
        // 计算时间步长（小时）
        const timeStepHours = computed(() => {
            if (timeSteps.value.length < 2) return 3;
            const diff = timeSteps.value[1].getTime() - timeSteps.value[0].getTime();
            return diff / (1000 * 60 * 60);
        });
        
        // 计算基于实际时间的位置百分比
        const getTimePosition = (time) => {
            if (timeSteps.value.length === 0) return 0;
            
            const startTime = timeSteps.value[0].getTime();
            const endTime = timeSteps.value[timeSteps.value.length - 1].getTime();
            const currentTime = time.getTime();
            
            return ((currentTime - startTime) / (endTime - startTime)) * 100;
        };
        
        // 计算基于索引的实际时间位置
        const getIndexPosition = (index) => {
            if (timeSteps.value.length === 0 || index < 0 || index >= timeSteps.value.length) return 0;
            return getTimePosition(timeSteps.value[index]);
        };
        
        // 生成时间刻度标记（类似 Windy，显示关键时间点）
        const timeMarkers = computed(() => {
            if (timeSteps.value.length === 0) return [];
            
            const markers = [];
            const totalSteps = timeSteps.value.length;
            
            // 每隔一定间隔显示一个标记
            const interval = Math.max(1, Math.floor(totalSteps / 8));
            
            for (let i = 0; i < totalSteps; i += interval) {
                const time = timeSteps.value[i];
                const position = (i / (totalSteps - 1)) * 100;
                
                // 判断是否是当前时间附近
                const isNow = Math.abs(i - nowIndex.value) <= 1;
                
                markers.push({
                    position,
                    label: formatMarkerLabel(time),
                    isNow
                });
            }
            
            // 确保最后一个时间点也显示
            if (markers.length > 0 && markers[markers.length - 1].position < 95) {
                const lastTime = timeSteps.value[totalSteps - 1];
                markers.push({
                    position: 100,
                    label: formatMarkerLabel(lastTime),
                    isNow: false
                });
            }
            
            return markers;
        });
        
        // 生成日期标记（每天0点的位置）
        const dayMarkers = computed(() => {
            if (timeSteps.value.length === 0) {
                console.log('⚠️ dayMarkers: timeSteps为空');
                return [];
            }
            
            const markers = [];
            const totalSteps = timeSteps.value.length;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // 找到每天0点对应的索引
            const dayIndices = new Map();
            
            timeSteps.value.forEach((time, index) => {
                const dateKey = `${time.getFullYear()}-${time.getMonth()}-${time.getDate()}`;
                if (!dayIndices.has(dateKey)) {
                    dayIndices.set(dateKey, { time, index });
                }
            });
            
            // 转换为标记数组
            dayIndices.forEach(({ time, index }) => {
                const position = (index / (totalSteps - 1)) * 100;
                const timeDate = new Date(time);
                timeDate.setHours(0, 0, 0, 0);
                const isToday = timeDate.getTime() === today.getTime();
                
                markers.push({
                    position,
                    label: formatDayLabel(time, isToday),
                    isToday
                });
            });
            
            console.log('📅 dayMarkers生成:', markers.length, '个标记');
            return markers;
        });
        
        // 生成小时标记（根据时间步长动态调整）
        const hourMarkers = computed(() => {
            if (timeSteps.value.length === 0) {
                console.log('⚠️ hourMarkers: timeSteps为空');
                return [];
            }
            
            const markers = [];
            const totalSteps = timeSteps.value.length;
            
            // 计算时间步长（小时）
            let timeStepHours = 3; // 默认3小时
            if (timeSteps.value.length >= 2) {
                const diff = timeSteps.value[1].getTime() - timeSteps.value[0].getTime();
                timeStepHours = diff / (1000 * 60 * 60); // 转换为小时
            }
            
            console.log('⏰ 时间步长:', timeStepHours, '小时');
            
            // 根据时间步长决定显示间隔
            let displayInterval = 3; // 默认每3小时显示一个刻度
            if (timeStepHours >= 24) {
                // 如果步长是24小时（洋流），不显示小时刻度，只显示日期
                displayInterval = 24;
            } else if (timeStepHours >= 6) {
                displayInterval = 6;
            } else {
                displayInterval = 3;
            }
            
            timeSteps.value.forEach((time, index) => {
                const hour = time.getHours();
                const position = (index / (totalSteps - 1)) * 100;
                
                // 根据时间步长显示刻度
                if (timeStepHours >= 24) {
                    // 24小时步长：不显示小时刻度
                    return;
                } else if (hour % displayInterval === 0) {
                    markers.push({
                        position,
                        label: `${hour.toString().padStart(2, '0')}:00`,
                        showLabel: hour % 6 === 0 && hour !== 0 // 每6小时显示标签
                    });
                }
            });
            
            console.log('⏰ hourMarkers生成:', markers.length, '个标记, 显示间隔:', displayInterval, '小时');
            return markers;
        });
        
        const formatDayLabel = (date, isToday) => {
            if (isToday) {
                return 'Today';
            }
            
            const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const weekday = weekdays[date.getDay()];
            const month = date.getMonth() + 1;
            const day = date.getDate();
            
            // 显示月/日 + 星期
            return `${month}/${day} ${weekday}`;
        };
        
        const formatMarkerLabel = (date) => {
            const month = (date.getMonth() + 1).toString();
            const day = date.getDate().toString();
            const hour = date.getHours().toString().padStart(2, '0');
            
            // 如果是0点，显示日期；否则显示小时
            if (hour === '00') {
                return `${month}/${day}`;
            } else {
                return `${hour}:00`;
            }
        };
        
        const formatDateTime = (date) => {
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const hour = date.getHours().toString().padStart(2, '0');
            const minute = date.getMinutes().toString().padStart(2, '0');
            return `${month}-${day} ${hour}:${minute}`;
        };
        
        const togglePlay = () => {
            isPlaying.value = !isPlaying.value;
            
            if (isPlaying.value) {
                // 开始自动播放
                playInterval.value = setInterval(() => {
                    if (currentIndex.value < timeSteps.value.length - 1) {
                        currentIndex.value++;
                        onTimeChange();
                    } else {
                        // 播放到最后一帧，循环回第一帧
                        currentIndex.value = 0;
                        onTimeChange();
                    }
                }, 1000 / playSpeed.value);
            } else {
                // 停止播放
                if (playInterval.value) {
                    clearInterval(playInterval.value);
                    playInterval.value = null;
                }
            }
        };
        
        const onTimeChange = () => {
            if (!currentLayer.value) {
                console.warn('⚠️ onTimeChange: 没有当前图层');
                return;
            }
            
            // 确保 currentIndex 是数字类型
            const timeIndex = parseInt(currentIndex.value, 10);
            
            console.log('⏰ TimelineControl.onTimeChange 触发:', {
                currentIndex: currentIndex.value,
                timeIndex,
                time: currentTime.value,
                layerId: currentLayer.value.id
            });
            
            emit('timeChange', {
                time: currentTime.value,
                index: timeIndex,  // 使用转换后的数字
                layerId: currentLayer.value.id
            });
        };
        
        // 暂停自动更新（用户拖动时）
        const pauseAutoUpdate = () => {
            isDragging.value = true;
            autoUpdateEnabled.value = false;
        };
        
        // 恢复自动更新
        const resumeAutoUpdate = () => {
            isDragging.value = false;
            setTimeout(() => {
                autoUpdateEnabled.value = true;
            }, 5000); // 5秒后恢复自动更新
        };
        
        // 自动更新当前时间索引（每分钟检查一次）
        const startAutoUpdate = () => {
            autoUpdateInterval.value = setInterval(() => {
                if (!autoUpdateEnabled.value || isPlaying.value) return;
                
                const newNowIndex = findNowIndex();
                
                // 如果当前显示的是"现在"，则自动跟随
                if (isCurrentTime.value && newNowIndex !== nowIndex.value) {
                    console.log('⏰ 自动更新到当前时间');
                    currentIndex.value = newNowIndex;
                    onTimeChange();
                }
            }, 60000); // 每分钟检查一次
        };
        
        // 监听播放速度变化，重新设置定时器
        watch(() => playSpeed.value, () => {
            if (isPlaying.value) {
                // 重新启动播放
                if (playInterval.value) {
                    clearInterval(playInterval.value);
                }
                togglePlay();
                togglePlay();
            }
        });
        
        // 组件挂载时启动自动更新
        onMounted(() => {
            startAutoUpdate();
        });
        
        // 组件卸载时清理定时器
        onUnmounted(() => {
            if (playInterval.value) {
                clearInterval(playInterval.value);
            }
            if (autoUpdateInterval.value) {
                clearInterval(autoUpdateInterval.value);
            }
        });
        
        return {
            isPlaying,
            currentIndex,
            playSpeed,
            timeSteps,
            currentTime,
            currentLayer,
            timeMarkers,
            dayMarkers,
            hourMarkers,
            nowIndex,
            isCurrentTime,
            isFutureTime,
            forecastHours,
            pastHours,
            isDragging,
            formatDateTime,
            togglePlay,
            onTimeChange,
            pauseAutoUpdate,
            resumeAutoUpdate,
            getTimePosition,
            getIndexPosition,
            timeStepHours
        };
    }
};
</script>

<style scoped>
/* 滑入动画 */
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

/* 脉冲动画 */
@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}

.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
