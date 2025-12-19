<template>
    <el-dialog
        v-model="visible"
        :title="`📍 ${areaData.name}`"
        width="800px"
        destroy-on-close
        @close="handleClose"
    >
        <!-- 基本信息 -->
        <div class="mb-5">
            <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="区域名称">{{ areaData.name }}</el-descriptions-item>
                <el-descriptions-item label="区域ID">
                    <span style="font-size: 12px; font-family: monospace;">{{ areaData.areaId || areaData.id }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="风速阈值">
                    <span style="color: #409EFF;">{{ areaData.thresholds?.windSpeed || 15 }} m/s</span>
                </el-descriptions-item>
                <el-descriptions-item label="浪高阈值">
                    <span style="color: #409EFF;">{{ areaData.thresholds?.waveHeight || 3 }} m</span>
                </el-descriptions-item>
                <el-descriptions-item label="区域面积" v-if="areaData.area">
                    <span style="color: #67C23A; font-weight: bold;">{{ areaData.area }} km²</span>
                </el-descriptions-item>
                <el-descriptions-item label="坐标范围" v-if="areaData.bounds">
                    <div style="font-size: 11px; font-family: monospace; line-height: 1.4;">
                        <div>经度: {{ areaData.bounds.minLng }}° ~ {{ areaData.bounds.maxLng }}°</div>
                        <div>纬度: {{ areaData.bounds.minLat }}° ~ {{ areaData.bounds.maxLat }}°</div>
                    </div>
                </el-descriptions-item>
                <el-descriptions-item label="创建时间" :span="2">
                    {{ areaData.createdAt ? new Date(areaData.createdAt).toLocaleString('zh-CN') : '-' }}
                </el-descriptions-item>
            </el-descriptions>
        </div>

        <!-- 监控状态卡片 -->
        <div class="flex gap-5 mb-5">
            <div 
                class="flex-1 p-4 rounded cursor-pointer transition-all"
                :class="activeTab === 'ships' ? 'bg-blue-50 border-2 border-blue-400' : 'bg-gray-50 border border-gray-200'"
                @click="activeTab = 'ships'"
            >
                <div class="text-3xl font-bold text-blue-500 text-center">{{ ships.length }}</div>
                <div class="text-xs text-gray-500 text-center mt-2">区域内船舶</div>
            </div>
            <div 
                class="flex-1 p-4 rounded cursor-pointer transition-all"
                :class="activeTab === 'events' ? 'bg-orange-50 border-2 border-orange-400' : 'bg-gray-50 border border-gray-200'"
                @click="activeTab = 'events'; eventFilter = 'all'"
            >
                <div class="text-3xl font-bold text-center" :class="events.length > 0 ? 'text-orange-500' : 'text-gray-400'">
                    {{ events.length }}
                </div>
                <div class="text-xs text-gray-500 text-center mt-2">
                    <span class="text-red-500">{{ warningCount }}</span> 预警 / 
                    <span class="text-blue-500">{{ enterCount }}</span> 进入 / 
                    <span class="text-green-500">{{ leaveCount }}</span> 离开
                </div>
            </div>
        </div>

        <!-- 标签页内容 -->
        <div v-if="activeTab === 'ships'" class="max-h-96 overflow-y-auto">
            <h4 class="mb-3 text-sm font-bold text-gray-600">🚢 区域内船舶 ({{ ships.length }})</h4>
            
            <div v-if="loadingShips" class="text-center py-8">
                <el-icon class="is-loading" :size="30"><Loading /></el-icon>
                <div class="text-sm text-gray-500 mt-2">正在加载船舶信息...</div>
            </div>
            
            <div v-else-if="ships.length > 0" class="space-y-4">
                <div 
                    v-for="ship in ships" 
                    :key="ship.mmsi"
                    class="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    :class="ship.riskLevel === 'high' ? 'border-red-300 bg-red-50' : 
                            ship.riskLevel === 'medium' ? 'border-orange-300 bg-orange-50' : 
                            'border-gray-200 bg-white'"
                >
                    <!-- 船舶标题 -->
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="font-bold text-lg">
                                    {{ ship.shipCnName || ship.shipName || '未知船舶' }}
                                </span>
                                <el-tag :type="getRiskTagType(ship.riskLevel)" size="small">
                                    {{ getRiskLabel(ship.riskLevel) }}
                                </el-tag>
                            </div>
                            <div class="text-xs text-gray-500 space-x-3">
                                <span>MMSI: <span class="font-mono">{{ ship.mmsi }}</span></span>
                                <span v-if="ship.imo">IMO: <span class="font-mono">{{ ship.imo }}</span></span>
                                <span v-if="ship.callSign">呼号: {{ ship.callSign }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- 船舶详细信息 -->
                    <el-descriptions :column="3" size="small" border class="mb-3">
                        <el-descriptions-item label="船舶类型">
                            <span class="font-medium">{{ getShipTypeName(ship.shipType) }}</span>
                        </el-descriptions-item>
                        <el-descriptions-item label="船长">
                            <span class="text-blue-600">{{ ship.length || '-' }} m</span>
                        </el-descriptions-item>
                        <el-descriptions-item label="船宽">
                            <span class="text-blue-600">{{ ship.width || '-' }} m</span>
                        </el-descriptions-item>
                        <el-descriptions-item label="吃水">
                            {{ ship.draught || '-' }} m
                        </el-descriptions-item>
                        <el-descriptions-item label="航速">
                            <span class="text-green-600 font-medium">{{ ship.sog || 0 }} kn</span>
                        </el-descriptions-item>
                        <el-descriptions-item label="航向">
                            {{ ship.cog || '-' }}° <span v-if="ship.hdg">(船首向: {{ ship.hdg }}°)</span>
                        </el-descriptions-item>
                        <el-descriptions-item label="当前位置" :span="3">
                            <span class="font-mono text-sm">
                                {{ ship.lat?.toFixed(6) || '-' }}°N, {{ ship.lng?.toFixed(6) || '-' }}°E
                            </span>
                        </el-descriptions-item>
                        <el-descriptions-item label="目的港" :span="2">
                            <span class="font-medium">{{ ship.destination || '-' }}</span>
                        </el-descriptions-item>
                        <el-descriptions-item label="预计到达">
                            {{ ship.eta || '-' }}
                        </el-descriptions-item>
                    </el-descriptions>

                    <!-- 气象信息 -->
                    <div v-if="ship.lastWeather" class="mb-3 p-3 bg-blue-50 rounded border border-blue-200">
                        <div class="text-xs font-bold text-blue-700 mb-2">⛅ 当前气象条件</div>
                        <div class="grid grid-cols-3 gap-2 text-xs">
                            <div v-if="ship.lastWeather.windSpeed && ship.lastWeather.windSpeed > 0">
                                <span class="text-gray-600">风速:</span>
                                <span class="ml-1 font-medium" :class="ship.lastWeather.windSpeed > (areaData.thresholds?.windSpeed || 15) ? 'text-red-600' : 'text-green-600'">
                                    {{ ship.lastWeather.windSpeed }} m/s
                                </span>
                            </div>
                            <div v-if="ship.lastWeather.waveHeight && ship.lastWeather.waveHeight > 0">
                                <span class="text-gray-600">浪高:</span>
                                <span class="ml-1 font-medium" :class="ship.lastWeather.waveHeight > (areaData.thresholds?.waveHeight || 3) ? 'text-red-600' : 'text-green-600'">
                                    {{ ship.lastWeather.waveHeight }} m
                                </span>
                            </div>
                            <div v-if="ship.lastWeather.temperature && ship.lastWeather.temperature > -100">
                                <span class="text-gray-600">温度:</span>
                                <span class="ml-1 font-medium">{{ ship.lastWeather.temperature }}°C</span>
                            </div>
                            <div v-if="ship.lastWeather.humidity && ship.lastWeather.humidity > 0">
                                <span class="text-gray-600">湿度:</span>
                                <span class="ml-1 font-medium">{{ ship.lastWeather.humidity }}%</span>
                            </div>
                            <div v-if="ship.lastWeather.pressure && ship.lastWeather.pressure > 0">
                                <span class="text-gray-600">气压:</span>
                                <span class="ml-1 font-medium">{{ ship.lastWeather.pressure }} hPa</span>
                            </div>
                            <div v-if="ship.lastWeather.visibility && ship.lastWeather.visibility > 0">
                                <span class="text-gray-600">能见度:</span>
                                <span class="ml-1 font-medium">{{ (ship.lastWeather.visibility / 1000).toFixed(1) }} km</span>
                            </div>
                        </div>
                        <div v-if="ship.lastWeather.publishTime" class="mt-2 text-xs text-gray-500">
                            更新时间: {{ ship.lastWeather.publishTime }}
                        </div>
                    </div>

                    <!-- 时间信息 -->
                    <div class="pt-3 border-t text-xs text-gray-500 space-y-1">
                        <div class="flex items-center gap-2">
                            <span>📍 进入时间:</span>
                            <span class="font-medium">{{ formatTime(ship.enterTime) }}</span>
                        </div>
                        <div v-if="ship.lastTime" class="flex items-center gap-2">
                            <span>🔄 最后更新:</span>
                            <span class="font-medium">{{ ship.lastTime }}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <el-empty v-else description="暂无船舶" :image-size="80" />
        </div>

        <!-- 事件日志 -->
        <div v-else-if="activeTab === 'events'" class="max-h-96 overflow-y-auto">
            <div class="mb-3">
                <h4 class="text-sm font-bold text-gray-600 mb-2">📋 事件日志</h4>
                <div class="flex gap-2 text-xs">
                    <el-tag 
                        size="small" 
                        :type="eventFilter === 'all' ? 'info' : ''"
                        class="cursor-pointer"
                        :effect="eventFilter === 'all' ? 'dark' : 'plain'"
                        @click="eventFilter = 'all'"
                    >
                        全部 {{ events.length }}
                    </el-tag>
                    <el-tag 
                        size="small" 
                        type="danger"
                        class="cursor-pointer"
                        :effect="eventFilter === 'warning' ? 'dark' : 'plain'"
                        @click="eventFilter = 'warning'"
                    >
                        {{ warningCount }} 预警
                    </el-tag>
                    <el-tag 
                        size="small" 
                        type="primary"
                        class="cursor-pointer"
                        :effect="eventFilter === 'enter' ? 'dark' : 'plain'"
                        @click="eventFilter = 'enter'"
                    >
                        {{ enterCount }} 进入
                    </el-tag>
                    <el-tag 
                        size="small" 
                        type="success"
                        class="cursor-pointer"
                        :effect="eventFilter === 'leave' ? 'dark' : 'plain'"
                        @click="eventFilter = 'leave'"
                    >
                        {{ leaveCount }} 离开
                    </el-tag>
                </div>
            </div>
            
            <div v-if="loadingEvents" class="text-center py-8">
                <el-icon class="is-loading" :size="30"><Loading /></el-icon>
                <div class="text-sm text-gray-500 mt-2">正在加载事件日志...</div>
            </div>
            
            <el-timeline v-else-if="filteredEvents.length > 0">
                <el-timeline-item
                    v-for="event in filteredEvents"
                    :key="event.id"
                    :timestamp="formatTime(event.time)"
                    :type="getEventType(event)"
                    :icon="getEventIcon(event)"
                    placement="top"
                >
                    <el-card class="event-card" :class="getEventCardClass(event)">
                        <!-- 事件标题 -->
                        <div class="flex justify-between items-start mb-2">
                            <div class="font-bold text-sm">
                                {{ getEventTitle(event) }}
                            </div>
                            <el-tag :type="getEventTagType(event)" size="small">
                                {{ getEventLabel(event) }}
                            </el-tag>
                        </div>
                        
                        <!-- 事件详情 -->
                        <div class="text-xs text-gray-600 space-y-1">
                            <div v-if="event.mmsi">
                                <span class="text-gray-500">MMSI:</span>
                                <span class="font-mono ml-1">{{ event.mmsi }}</span>
                            </div>
                            
                            <!-- 预警详情 -->
                            <div v-if="event.category === 'warning'">
                                <div class="text-red-600 font-medium">{{ event.message }}</div>
                                <div v-if="event.weatherData" class="mt-1 text-xs">
                                    <span v-if="event.weatherData.windSpeed">风速: {{ event.weatherData.windSpeed }} m/s</span>
                                    <span v-if="event.weatherData.waveHeight" class="ml-2">浪高: {{ event.weatherData.waveHeight }} m</span>
                                </div>
                                <div v-if="event.isResolved" class="mt-1 text-green-600">
                                    ✓ 已解决 ({{ formatTime(event.resolvedAt) }})
                                </div>
                            </div>
                            
                            <!-- 船舶进入详情 -->
                            <div v-else-if="event.type === 'enter' && event.data?.shipInfo">
                                <div class="grid grid-cols-2 gap-2 mt-1">
                                    <div>
                                        <span class="text-gray-500">位置:</span>
                                        <span class="ml-1">{{ event.data.shipInfo.lat?.toFixed(4) }}°, {{ event.data.shipInfo.lng?.toFixed(4) }}°</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">航速:</span>
                                        <span class="ml-1">{{ event.data.shipInfo.sog || 0 }} kn</span>
                                    </div>
                                    <div v-if="event.data.weather">
                                        <span class="text-gray-500">风速:</span>
                                        <span class="ml-1">{{ event.data.weather.windSpeed || '-' }} m/s</span>
                                    </div>
                                    <div v-if="event.data.weather">
                                        <span class="text-gray-500">浪高:</span>
                                        <span class="ml-1">{{ event.data.weather.waveHeight || '-' }} m</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 船舶离开详情 -->
                            <div v-else-if="event.type === 'leave'">
                                <div class="text-gray-500">船舶已离开监控区域</div>
                            </div>
                        </div>
                    </el-card>
                </el-timeline-item>
            </el-timeline>
            
            <el-empty v-else description="暂无事件记录" :image-size="80" />
        </div>
    </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Loading } from '@element-plus/icons-vue';
import { getAreaShips, getAreaEvents } from '../utils/shipxyApi.js';

const props = defineProps({
    area: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['close']);

const visible = ref(true);
const activeTab = ref('ships');
const ships = ref([]);
const events = ref([]);
const loadingShips = ref(false);
const loadingEvents = ref(false);
const eventFilter = ref('all'); // 事件筛选：all, warning, enter, leave

const areaData = computed(() => props.area);

// 统计数据
const warningCount = computed(() => {
    return events.value.filter(e => e.category === 'warning' && !e.isResolved).length;
});

const enterCount = computed(() => {
    return events.value.filter(e => e.type === 'enter').length;
});

const leaveCount = computed(() => {
    return events.value.filter(e => e.type === 'leave').length;
});

// 筛选后的事件列表
const filteredEvents = computed(() => {
    if (eventFilter.value === 'all') {
        return events.value;
    } else if (eventFilter.value === 'warning') {
        return events.value.filter(e => e.category === 'warning');
    } else if (eventFilter.value === 'enter') {
        return events.value.filter(e => e.type === 'enter');
    } else if (eventFilter.value === 'leave') {
        return events.value.filter(e => e.type === 'leave');
    }
    return events.value;
});

// 加载数据
const loadData = async () => {
    loadingShips.value = true;
    loadingEvents.value = true;
    
    try {
        const [shipsResult, eventsResult] = await Promise.all([
            getAreaShips(props.area.id),
            getAreaEvents(props.area.id, 50)
        ]);
        
        ships.value = shipsResult.success ? shipsResult.data : [];
        events.value = eventsResult.success ? eventsResult.data : [];
        
        console.log('✅ 船舶数据:', ships.value.length, '条');
        console.log('✅ 事件数据:', events.value.length, '条');
    } catch (err) {
        console.error('❌ 加载数据失败:', err);
    } finally {
        loadingShips.value = false;
        loadingEvents.value = false;
    }
};

// 格式化时间
const formatTime = (time) => {
    if (!time) return '-';
    return new Date(time).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

// 获取船型名称
const getShipTypeName = (type) => {
    const types = {
        30: '渔船',
        31: '拖网渔船',
        32: '围网渔船',
        70: '货船',
        71: '散货船',
        72: '集装箱船',
        73: '杂货船',
        80: '油轮',
        81: '化学品船',
        82: '液化气船',
        90: '其他船舶',
        60: '客船',
        61: '客滚船'
    };
    return types[type] || (type ? `船舶类型 ${type}` : '未知');
};

// 获取风险标签类型
const getRiskTagType = (level) => {
    if (level === 'high') return 'danger';
    if (level === 'medium') return 'warning';
    return 'success';
};

// 获取风险标签文本
const getRiskLabel = (level) => {
    if (level === 'high') return '⚠️ 高风险';
    if (level === 'medium') return '⚡ 中风险';
    return '✓ 安全';
};

// 获取事件类型
const getEventType = (event) => {
    if (event.category === 'warning') return 'danger';
    if (event.type === 'enter') return 'primary';
    if (event.type === 'leave') return 'success';
    return 'info';
};

// 获取事件图标
const getEventIcon = (event) => {
    if (event.category === 'warning') return 'Warning';
    if (event.type === 'enter') return 'Position';
    if (event.type === 'leave') return 'CircleCheck';
    return 'InfoFilled';
};

// 获取事件卡片样式
const getEventCardClass = (event) => {
    if (event.category === 'warning' && !event.isResolved) {
        return 'border-l-4 border-l-red-500 bg-red-50';
    }
    if (event.type === 'enter') {
        return 'border-l-4 border-l-blue-500 bg-blue-50';
    }
    if (event.type === 'leave') {
        return 'border-l-4 border-l-green-500 bg-green-50';
    }
    return '';
};

// 获取事件标签类型
const getEventTagType = (event) => {
    if (event.category === 'warning') {
        if (event.severity === 'critical' || event.severity === 'high') return 'danger';
        if (event.severity === 'medium') return 'warning';
        return 'info';
    }
    if (event.type === 'enter') return 'primary';
    if (event.type === 'leave') return 'success';
    return 'info';
};

// 获取事件标签文本
const getEventLabel = (event) => {
    if (event.category === 'warning') {
        const labels = {
            critical: '严重预警',
            high: '高级预警',
            medium: '中级预警',
            low: '低级预警'
        };
        return labels[event.severity] || '预警';
    }
    if (event.type === 'enter') return '船舶进入';
    if (event.type === 'leave') return '船舶离开';
    return '事件';
};

// 获取事件标题
const getEventTitle = (event) => {
    if (event.category === 'warning') {
        return `⚠️ 气象预警`;
    }
    if (event.type === 'enter') {
        const shipName = event.data?.shipInfo?.ship_cnname || event.data?.shipInfo?.ship_name || `船舶 ${event.mmsi}`;
        return `🚢 ${shipName}`;
    }
    if (event.type === 'leave') {
        return `🚢 船舶 ${event.mmsi}`;
    }
    return '未知事件';
};

const handleClose = () => {
    visible.value = false;
    emit('close');
};

onMounted(() => {
    loadData();
});
</script>

<style scoped>
.el-descriptions :deep(.el-descriptions__label) {
    width: 90px;
    font-weight: 500;
}

.el-descriptions :deep(.el-descriptions__content) {
    font-size: 13px;
}

.event-card {
    box-shadow: none;
    border-radius: 8px;
}

.event-card :deep(.el-card__body) {
    padding: 12px;
}

/* 滚动条样式 */
.max-h-96::-webkit-scrollbar {
    width: 6px;
}

.max-h-96::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.max-h-96::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
}

.max-h-96::-webkit-scrollbar-thumb:hover {
    background: #555;
}

/* 卡片悬停效果 */
.hover\:shadow-md:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 可点击标签 */
.cursor-pointer {
    cursor: pointer;
    transition: all 0.2s;
}

.cursor-pointer:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
