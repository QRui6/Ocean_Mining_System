<template>
    <div v-if="show" class="absolute bottom-8 right-8 w-[32rem] max-h-[70vh] z-40 pointer-events-auto font-['Noto_Sans_SC'] animate-slideInUp">
        <div class="tech-panel-enhanced p-6 relative group overflow-hidden" style="clip-path: polygon(8% 0, 100% 0, 100% 100%, 0 100%, 0 5%);">
            <!-- 装饰元素 -->
            <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/10 to-transparent pointer-events-none"></div>
            <div class="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-500/10 to-transparent pointer-events-none"></div>
            
            <!-- 标题 -->
            <div class="flex items-center mb-6 border-b-2 border-orange-500/30 pb-3">
                <div class="w-1.5 h-6 bg-orange-400 mr-3 shadow-[0_0_10px_#fb923c]"></div>
                <h3 class="text-2xl font-bold text-white tracking-wider flex-1">矿区气象监测</h3>
                <div class="text-xs font-['Orbitron'] text-orange-500 opacity-80 font-bold tracking-widest">WEATHER MONITOR</div>
            </div>
            
            <!-- 阈值设置 -->
            <div class="mb-6 bg-slate-900/50 border border-orange-500/30 rounded-sm p-4">
                <div class="text-orange-400 font-bold mb-3 flex items-center">
                    <span class="mr-2">⚙️</span>
                    预警阈值设置
                </div>
                <div class="grid grid-cols-3 gap-3">
                    <div>
                        <label class="text-xs text-slate-400 mb-1 block">风速(m/s)</label>
                        <input 
                            v-model.number="thresholds.windSpeed"
                            type="number"
                            class="w-full px-2 py-1.5 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-orange-500 transition-colors text-sm"
                        />
                    </div>
                    <div>
                        <label class="text-xs text-slate-400 mb-1 block">浪高(m)</label>
                        <input 
                            v-model.number="thresholds.waveHeight"
                            type="number"
                            class="w-full px-2 py-1.5 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-orange-500 transition-colors text-sm"
                        />
                    </div>
                    <div>
                        <label class="text-xs text-slate-400 mb-1 block">洋流(m/s)</label>
                        <input 
                            v-model.number="thresholds.currentSpeed"
                            type="number"
                            step="0.1"
                            class="w-full px-2 py-1.5 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-orange-500 transition-colors text-sm"
                        />
                    </div>
                </div>
            </div>
            
            <!-- 监测的矿区列表 -->
            <div class="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                <div class="text-orange-400 text-sm font-bold flex items-center mb-3">
                    <div class="w-1.5 h-1.5 bg-orange-400 rounded-full mr-2.5"></div>
                    监测矿区 ({{ monitoredAreas.length }})
                </div>
                
                <div v-if="monitoredAreas.length === 0" class="text-center py-8 text-slate-500">
                    <div class="text-4xl mb-2">📍</div>
                    <div class="text-sm">暂无监测矿区</div>
                    <div class="text-xs mt-1">请在地图上点击矿区添加监测</div>
                </div>
                
                <div 
                    v-for="area in monitoredAreas" 
                    :key="area.id"
                    class="bg-slate-800/40 border border-slate-700 rounded-sm p-4 space-y-3 hover:border-orange-500/50 transition-all"
                >
                    <!-- 矿区名称和状态 -->
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <div class="text-white font-bold text-base">{{ area.name }}</div>
                            <div class="text-xs text-slate-400 mt-1">
                                {{ area.contractor }} · {{ area.mineral }}
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <span 
                                v-if="area.warningCount > 0" 
                                class="text-xs px-2 py-1 bg-red-900/50 text-red-400 border border-red-500/50 rounded-sm animate-pulse"
                            >
                                ⚠️ {{ area.warningCount }} 个预警
                            </span>
                            <span 
                                v-else
                                class="text-xs px-2 py-1 bg-green-900/50 text-green-400 border border-green-500/50 rounded-sm"
                            >
                                ✓ 正常
                            </span>
                        </div>
                    </div>
                    
                    <!-- 最新气象数据 -->
                    <div v-if="area.latestWeather" class="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/50">
                        <div class="text-center">
                            <div class="text-xs text-slate-500">风速</div>
                            <div 
                                class="text-sm font-bold mt-1"
                                :class="area.latestWeather.windSpeed > thresholds.windSpeed ? 'text-red-400' : 'text-cyan-400'"
                            >
                                {{ area.latestWeather.windSpeed.toFixed(1) }} m/s
                            </div>
                        </div>
                        <div class="text-center">
                            <div class="text-xs text-slate-500">浪高</div>
                            <div 
                                class="text-sm font-bold mt-1"
                                :class="area.latestWeather.waveHeight > thresholds.waveHeight ? 'text-red-400' : 'text-cyan-400'"
                            >
                                {{ area.latestWeather.waveHeight.toFixed(1) }} m
                            </div>
                        </div>
                        <div class="text-center">
                            <div class="text-xs text-slate-500">洋流</div>
                            <div 
                                class="text-sm font-bold mt-1"
                                :class="area.latestWeather.currentSpeed > thresholds.currentSpeed ? 'text-red-400' : 'text-cyan-400'"
                            >
                                {{ area.latestWeather.currentSpeed.toFixed(2) }} m/s
                            </div>
                        </div>
                    </div>
                    
                    <!-- 操作按钮 -->
                    <div class="flex gap-2 pt-2">
                        <button 
                            @click="showWeatherDetail(area)"
                            class="flex-1 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white font-bold rounded-sm transition-all text-xs shadow-lg hover:shadow-cyan-500/50"
                        >
                            气象监测
                        </button>
                        <button 
                            @click="locateArea(area)"
                            class="flex-1 px-3 py-1.5 bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 font-bold rounded-sm transition-all text-xs"
                        >
                            定位
                        </button>
                        <button 
                            @click="removeArea(area.id)"
                            class="px-3 py-1.5 bg-slate-800/50 text-red-400 hover:bg-red-900/30 font-bold rounded-sm transition-all text-xs"
                        >
                            移除
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- 气象详情对话框 -->
        <transition name="fade">
            <div 
                v-if="showDetailDialog && selectedAreaDetail"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto"
                @click.self="closeDetailDialog"
            >
                <div class="w-[50rem] max-h-[80vh] bg-slate-900/95 border-2 border-cyan-500/50 rounded-lg shadow-2xl overflow-hidden">
                    <!-- 标题栏 -->
                    <div class="flex items-center justify-between bg-gradient-to-r from-cyan-900/60 to-transparent px-6 py-4 border-b border-cyan-500/30">
                        <div class="flex items-center gap-3">
                            <div class="w-2 h-2 bg-cyan-400 rotate-45 shadow-[0_0_6px_#22d3ee]"></div>
                            <h3 class="text-xl font-bold text-white">{{ selectedAreaDetail.name }} - 气象详情</h3>
                        </div>
                        <button 
                            @click="closeDetailDialog"
                            class="w-8 h-8 flex items-center justify-center border border-cyan-500/50 rounded-sm hover:bg-cyan-500 hover:text-black transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                    
                    <!-- 内容区域 -->
                    <div class="p-6 overflow-y-auto max-h-[calc(80vh-80px)] custom-scrollbar">
                        <!-- 矿区基本信息 -->
                        <div class="mb-6 bg-slate-800/40 border border-slate-700 rounded-sm p-4">
                            <div class="text-cyan-400 font-bold mb-3 flex items-center">
                                <span class="mr-2">📍</span>
                                矿区信息
                            </div>
                            <div class="grid grid-cols-2 gap-3 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-slate-400">承包者：</span>
                                    <span class="text-white font-bold">{{ selectedAreaDetail.contractor }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-slate-400">矿种类型：</span>
                                    <span class="text-white font-bold">{{ selectedAreaDetail.mineral }}</span>
                                </div>
                                <div class="flex justify-between col-span-2">
                                    <span class="text-slate-400">位置：</span>
                                    <span class="text-white font-bold">{{ selectedAreaDetail.location }}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 加载中 -->
                        <div v-if="loadingWeatherDetail" class="text-center py-12">
                            <div class="inline-block w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                            <div class="text-slate-400 mt-4">正在加载气象数据...</div>
                        </div>
                        
                        <!-- 气象数据列表 -->
                        <div v-else-if="weatherDetailData.length > 0" class="space-y-4">
                            <div class="text-cyan-400 font-bold mb-3 flex items-center">
                                <span class="mr-2">🌊</span>
                                气象数据 ({{ weatherDetailData.length }} 条记录)
                            </div>
                            
                            <div 
                                v-for="(data, index) in weatherDetailData" 
                                :key="index"
                                class="bg-slate-800/40 border border-slate-700 rounded-sm p-4 hover:border-cyan-500/50 transition-all"
                            >
                                <div class="flex items-center justify-between mb-3">
                                    <div class="text-white font-bold">时间点 {{ index + 1 }}</div>
                                    <div class="text-xs text-slate-400">{{ data.time || '当前' }}</div>
                                </div>
                                
                                <div class="grid grid-cols-3 gap-4">
                                    <!-- 风速 -->
                                    <div class="text-center p-3 bg-slate-900/50 rounded-sm">
                                        <div class="text-xs text-slate-500 mb-1">风速</div>
                                        <div 
                                            class="text-lg font-bold"
                                            :class="data.windSpeed > thresholds.windSpeed ? 'text-red-400 animate-pulse' : 'text-cyan-400'"
                                        >
                                            {{ data.windSpeed.toFixed(1) }}
                                        </div>
                                        <div class="text-xs text-slate-500 mt-1">m/s</div>
                                        <div v-if="data.windSpeed > thresholds.windSpeed" class="text-xs text-red-400 mt-1">
                                            ⚠️ 超过阈值
                                        </div>
                                    </div>
                                    
                                    <!-- 浪高 -->
                                    <div class="text-center p-3 bg-slate-900/50 rounded-sm">
                                        <div class="text-xs text-slate-500 mb-1">浪高</div>
                                        <div 
                                            class="text-lg font-bold"
                                            :class="data.waveHeight > thresholds.waveHeight ? 'text-red-400 animate-pulse' : 'text-cyan-400'"
                                        >
                                            {{ data.waveHeight.toFixed(1) }}
                                        </div>
                                        <div class="text-xs text-slate-500 mt-1">m</div>
                                        <div v-if="data.waveHeight > thresholds.waveHeight" class="text-xs text-red-400 mt-1">
                                            ⚠️ 超过阈值
                                        </div>
                                    </div>
                                    
                                    <!-- 洋流 -->
                                    <div class="text-center p-3 bg-slate-900/50 rounded-sm">
                                        <div class="text-xs text-slate-500 mb-1">洋流</div>
                                        <div 
                                            class="text-lg font-bold"
                                            :class="data.currentSpeed > thresholds.currentSpeed ? 'text-red-400 animate-pulse' : 'text-cyan-400'"
                                        >
                                            {{ data.currentSpeed.toFixed(2) }}
                                        </div>
                                        <div class="text-xs text-slate-500 mt-1">m/s</div>
                                        <div v-if="data.currentSpeed > thresholds.currentSpeed" class="text-xs text-red-400 mt-1">
                                            ⚠️ 超过阈值
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 无数据 -->
                        <div v-else class="text-center py-12 text-slate-500">
                            <div class="text-4xl mb-2">📊</div>
                            <div class="text-sm">暂无气象数据</div>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { weatherWarningService } from '../utils/weatherWarningService.js';

export default {
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['locate-area'],
    
    setup(props, { emit }) {
        const monitoredAreas = ref([]);
        const thresholds = ref({
            windSpeed: 15,
            waveHeight: 3,
            currentSpeed: 1.0
        });
        
        // 气象详情对话框
        const showDetailDialog = ref(false);
        const selectedAreaDetail = ref(null);
        const weatherDetailData = ref([]);
        const loadingWeatherDetail = ref(false);
        
        let updateInterval = null;
        
        /**
         * 添加矿区监测
         * @param {Object} miningArea - 矿区信息
         */
        const addArea = (miningArea) => {
            // 检查是否已经在监测
            if (monitoredAreas.value.find(a => a.id === miningArea.id)) {
                ElMessage.warning(`矿区 "${miningArea.name}" 已在监测中`);
                return;
            }
            
            // 添加到监测列表
            const area = {
                ...miningArea,
                thresholds: { ...thresholds.value },
                warningCount: 0,
                latestWeather: null
            };
            
            monitoredAreas.value.push(area);
            
            // 启动气象监控
            weatherWarningService.startMonitoring(area);
            
            ElMessage.success(`已添加矿区 "${miningArea.name}" 到气象监测`);
        };
        
        /**
         * 移除矿区监测
         * @param {String} areaId - 矿区ID
         */
        const removeArea = (areaId) => {
            const index = monitoredAreas.value.findIndex(a => a.id === areaId);
            if (index > -1) {
                const area = monitoredAreas.value[index];
                monitoredAreas.value.splice(index, 1);
                
                // 停止气象监控
                weatherWarningService.stopMonitoring(areaId);
                
                ElMessage.info(`已移除矿区 "${area.name}" 的气象监测`);
            }
        };
        
        /**
         * 定位到矿区
         * @param {Object} area - 矿区信息
         */
        const locateArea = (area) => {
            emit('locate-area', area);
        };
        
        /**
         * 显示气象详情
         * @param {Object} area - 矿区信息
         */
        const showWeatherDetail = async (area) => {
            selectedAreaDetail.value = area;
            showDetailDialog.value = true;
            loadingWeatherDetail.value = true;
            weatherDetailData.value = [];
            
            try {
                // 获取多个时间点的气象数据（例如未来24小时，每3小时一个点）
                const timePoints = 8; // 8个时间点
                const promises = [];
                
                for (let i = 0; i < timePoints; i++) {
                    promises.push(
                        fetch('/api/copernicus/query-area', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                polygon: area.polygon,
                                timeIndex: i
                            })
                        }).then(res => res.json())
                    );
                }
                
                const results = await Promise.all(promises);
                
                weatherDetailData.value = results
                    .filter(result => result.success && result.data)
                    .map((result, index) => ({
                        time: `+${index * 3}h`,
                        windSpeed: result.data.data.windSpeed || 0,
                        waveHeight: result.data.data.waveHeight || 0,
                        currentSpeed: result.data.data.currentSpeed || 0
                    }));
                
                console.log('✅ 气象详情数据加载成功:', weatherDetailData.value.length, '条');
            } catch (err) {
                console.error('❌ 加载气象详情失败:', err);
                ElMessage.error('加载气象数据失败');
            } finally {
                loadingWeatherDetail.value = false;
            }
        };
        
        /**
         * 关闭气象详情对话框
         */
        const closeDetailDialog = () => {
            showDetailDialog.value = false;
            selectedAreaDetail.value = null;
            weatherDetailData.value = [];
        };
        
        /**
         * 更新气象数据和预警计数
         */
        const updateWeatherData = async () => {
            for (const area of monitoredAreas.value) {
                // 更新预警计数
                area.warningCount = weatherWarningService.getWarningCount(area.id);
                
                // 获取最新气象数据
                try {
                    const response = await fetch('/api/copernicus/query-area', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            polygon: area.polygon,
                            timeIndex: 0
                        })
                    });
                    
                    const result = await response.json();
                    if (result.success) {
                        area.latestWeather = result.data.data;
                    }
                } catch (err) {
                    console.error('获取气象数据失败:', err);
                }
            }
        };
        
        /**
         * 启动定时更新
         */
        const startUpdate = () => {
            if (updateInterval) {
                clearInterval(updateInterval);
            }
            
            // 立即更新一次
            updateWeatherData();
            
            // 每10秒更新一次
            updateInterval = setInterval(updateWeatherData, 10000);
        };
        
        // 监听阈值变化，更新所有监测区域的阈值
        watch(thresholds, (newThresholds) => {
            monitoredAreas.value.forEach(area => {
                area.thresholds = { ...newThresholds };
                // 重新启动监控以应用新阈值
                weatherWarningService.stopMonitoring(area.id);
                weatherWarningService.startMonitoring(area);
            });
        }, { deep: true });
        
        onMounted(() => {
            startUpdate();
        });
        
        onUnmounted(() => {
            if (updateInterval) {
                clearInterval(updateInterval);
            }
            
            // 停止所有监控
            monitoredAreas.value.forEach(area => {
                weatherWarningService.stopMonitoring(area.id);
            });
        });
        
        return {
            monitoredAreas,
            thresholds,
            addArea,
            removeArea,
            locateArea,
            showWeatherDetail,
            showDetailDialog,
            selectedAreaDetail,
            weatherDetailData,
            loadingWeatherDetail,
            closeDetailDialog
        };
    }
};
</script>

<style scoped>
/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.5);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(251, 146, 60, 0.5);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(251, 146, 60, 0.7);
}

/* 科技面板样式 */
.tech-panel-enhanced {
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(251, 146, 60, 0.3);
    box-shadow: 
        0 0 30px rgba(251, 146, 60, 0.15),
        inset 0 0 20px rgba(251, 146, 60, 0.05);
}

/* 动画 */
@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideInUp {
    from {
        transform: translateY(100%);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.animate-slideInRight {
    animation: slideInRight 0.5s ease-out;
}

.animate-slideInUp {
    animation: slideInUp 0.5s ease-out;
}

/* 淡入淡出动画 */
.fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
    opacity: 0;
}
</style>
