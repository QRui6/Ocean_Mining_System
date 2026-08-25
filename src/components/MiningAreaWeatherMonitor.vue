<template>
    <div v-if="show"
        class="absolute bottom-8 right-8 w-[32rem] max-h-[70vh] z-40 pointer-events-auto font-['Noto_Sans_SC'] animate-slideInUp">
        <div class="tech-panel-enhanced p-6 relative group overflow-hidden"
            style="clip-path: polygon(8% 0, 100% 0, 100% 100%, 0 100%, 0 5%);">
            <!-- 装饰元素 -->
            <div
                class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/10 to-transparent pointer-events-none">
            </div>
            <div
                class="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-500/10 to-transparent pointer-events-none">
            </div>

            <!-- 标题 -->
            <div class="flex items-center mb-6 border-b-2 border-orange-500/30 pb-3">
                <div class="w-1.5 h-6 bg-orange-400 mr-3 shadow-[0_0_10px_#fb923c]"></div>
                <h3 class="text-2xl font-bold text-white tracking-wider flex-1">矿区气象监测</h3>
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
                        <input v-model.number="thresholds.windSpeed" type="number"
                            class="w-full px-2 py-1.5 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-orange-500 transition-colors text-sm" />
                    </div>
                    <div>
                        <label class="text-xs text-slate-400 mb-1 block">浪高(m)</label>
                        <input v-model.number="thresholds.waveHeight" type="number"
                            class="w-full px-2 py-1.5 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-orange-500 transition-colors text-sm" />
                    </div>
                    <div>
                        <label class="text-xs text-slate-400 mb-1 block">洋流(m/s)</label>
                        <input v-model.number="thresholds.currentSpeed" type="number" step="0.1"
                            class="w-full px-2 py-1.5 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-orange-500 transition-colors text-sm" />
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

                <div v-for="area in monitoredAreas" :key="area.id"
                    class="bg-slate-800/40 border border-slate-700 rounded-sm p-4 space-y-3 hover:border-orange-500/50 transition-all">
                    <!-- 矿区名称和状态 -->
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <div class="text-white font-bold text-base">{{ area.name }}</div>
                            <div class="text-xs text-slate-400 mt-1">
                                {{ area.contractor }} · {{ area.mineral }}
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <span v-if="area.warningCount > 0"
                                class="text-xs px-2 py-1 bg-red-900/50 text-red-400 border border-red-500/50 rounded-sm animate-pulse">
                                ⚠️ {{ area.warningCount }} 个预警
                            </span>
                            <span v-else
                                class="text-xs px-2 py-1 bg-green-900/50 text-green-400 border border-green-500/50 rounded-sm">
                                ✓ 正常
                            </span>
                        </div>
                    </div>

                    <!-- 最新气象数据 -->
                    <div v-if="area.latestWeather" class="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/50">
                        <div class="text-center">
                            <div class="text-xs text-slate-500">风速</div>
                            <div class="text-sm font-bold mt-1"
                                :class="area.latestWeather.windSpeed > thresholds.windSpeed ? 'text-red-400' : 'text-cyan-400'">
                                {{ area.latestWeather.windSpeed.toFixed(1) }} m/s
                            </div>
                        </div>
                        <div class="text-center">
                            <div class="text-xs text-slate-500">浪高</div>
                            <div class="text-sm font-bold mt-1"
                                :class="area.latestWeather.waveHeight > thresholds.waveHeight ? 'text-red-400' : 'text-cyan-400'">
                                {{ area.latestWeather.waveHeight.toFixed(1) }} m
                            </div>
                        </div>
                        <div class="text-center">
                            <div class="text-xs text-slate-500">洋流</div>
                            <div class="text-sm font-bold mt-1"
                                :class="area.latestWeather.currentSpeed > thresholds.currentSpeed ? 'text-red-400' : 'text-cyan-400'">
                                {{ area.latestWeather.currentSpeed.toFixed(2) }} m/s
                            </div>
                        </div>
                    </div>

                    <!-- 操作按钮 -->
                    <div class="flex gap-2 pt-2">
                        <button @click="showWeatherDetail(area)"
                            class="flex-1 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white font-bold rounded-sm transition-all text-xs shadow-lg hover:shadow-cyan-500/50">
                            气象监测
                        </button>
                        <button @click="locateArea(area)"
                            class="flex-1 px-3 py-1.5 bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 font-bold rounded-sm transition-all text-xs">
                            定位
                        </button>
                        <button @click="removeArea(area.id)"
                            class="px-3 py-1.5 bg-slate-800/50 text-red-400 hover:bg-red-900/30 font-bold rounded-sm transition-all text-xs">
                            移除
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 气象详情对话框 -->
        <transition name="fade">
            <div v-if="showDetailDialog && selectedAreaDetail"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto"
                @click.self="closeDetailDialog">
                <div
                    class="w-[50rem] max-h-[80vh] bg-slate-900/95 border-2 border-cyan-500/50 rounded-lg shadow-2xl overflow-hidden">
                    <!-- 标题栏 -->
                    <div
                        class="flex items-center justify-between bg-gradient-to-r from-cyan-900/60 to-transparent px-6 py-4 border-b border-cyan-500/30">
                        <div class="flex items-center gap-3">
                            <div class="w-2 h-2 bg-cyan-400 rotate-45 shadow-[0_0_6px_#22d3ee]"></div>
                            <h3 class="text-xl font-bold text-white">{{ selectedAreaDetail.name }} - 气象详情</h3>
                        </div>
                        <button @click="closeDetailDialog"
                            class="w-8 h-8 flex items-center justify-center border border-cyan-500/50 rounded-sm hover:bg-cyan-500 hover:text-black transition-colors">
                            ✕
                        </button>
                    </div>

                    <!-- 内容区域 -->
                    <div class="p-6 overflow-y-auto max-h-[calc(80vh-80px)] custom-scrollbar">
                        <!-- 矿区基本信息 -->
                        <div v-if="weatherDetailData && weatherDetailData.miningArea"
                            class="mb-6 bg-slate-800/40 border border-slate-700 rounded-sm p-4">
                            <div class="text-cyan-400 font-bold mb-3 flex items-center">
                                <span class="mr-2">📍</span>
                                矿区信息
                            </div>
                            <div class="grid grid-cols-2 gap-3 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-slate-400">承包者：</span>
                                    <span class="text-white font-bold">{{ weatherDetailData.miningArea.contractor
                                        }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-slate-400">矿种类型：</span>
                                    <span class="text-white font-bold">{{ weatherDetailData.miningArea.mineral }}</span>
                                </div>
                                <div class="flex justify-between col-span-2">
                                    <span class="text-slate-400">位置：</span>
                                    <span class="text-white font-bold">{{ weatherDetailData.miningArea.location
                                        }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- 加载中 -->
                        <div v-if="loadingWeatherDetail" class="text-center py-12">
                            <div
                                class="inline-block w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin">
                            </div>
                            <div class="text-slate-400 mt-4">正在加载气象数据...</div>
                        </div>

                        <!-- 气象统计数据 -->
                        <div v-else-if="weatherDetailData && weatherDetailData.statistics" class="space-y-6">
                            <!-- 实时统计卡片 -->
                            <div class="bg-slate-800/40 border border-slate-700 rounded-sm p-4">
                                <div class="text-cyan-400 font-bold mb-4 flex items-center">
                                    <span class="mr-2">🌊</span>
                                    实时气象统计
                                </div>

                                <div class="grid grid-cols-3 gap-4">
                                    <!-- 风速统计 -->
                                    <div class="bg-slate-900/50 rounded-sm p-4 border border-slate-700">
                                        <div class="text-center mb-3">
                                            <div class="text-xs text-slate-500 mb-1">风速</div>
                                            <div class="text-3xl font-bold"
                                                :class="getStatusColor(weatherDetailData.statistics.windSpeed.current, weatherDetailData.statistics.windSpeed.threshold)">
                                                {{ weatherDetailData.statistics.windSpeed.current.toFixed(1) }}
                                            </div>
                                            <div class="text-xs text-slate-500 mt-1">m/s</div>
                                        </div>
                                        <div class="space-y-1 text-xs">
                                            <div class="flex justify-between text-slate-400">
                                                <span>平均:</span>
                                                <span class="text-white">{{
                                                    weatherDetailData.statistics.windSpeed.avg.toFixed(1) }} m/s</span>
                                            </div>
                                            <div class="flex justify-between text-slate-400">
                                                <span>最大:</span>
                                                <span class="text-white">{{
                                                    weatherDetailData.statistics.windSpeed.max.toFixed(1) }} m/s</span>
                                            </div>
                                            <div class="flex justify-between text-slate-400">
                                                <span>最小:</span>
                                                <span class="text-white">{{
                                                    weatherDetailData.statistics.windSpeed.min.toFixed(1) }} m/s</span>
                                            </div>
                                            <div
                                                class="flex justify-between text-slate-400 pt-2 border-t border-slate-700">
                                                <span>阈值:</span>
                                                <span class="text-orange-400">{{
                                                    weatherDetailData.statistics.windSpeed.threshold.toFixed(1) }}
                                                    m/s</span>
                                            </div>
                                        </div>
                                        <div class="mt-3 text-center">
                                            <span class="text-xs px-2 py-1 rounded-sm"
                                                :class="getStatusBadge(weatherDetailData.statistics.windSpeed.current, weatherDetailData.statistics.windSpeed.threshold)">
                                                {{ getStatusText(weatherDetailData.statistics.windSpeed.current,
                                                weatherDetailData.statistics.windSpeed.threshold) }}
                                            </span>
                                        </div>
                                    </div>

                                    <!-- 浪高统计 -->
                                    <div class="bg-slate-900/50 rounded-sm p-4 border border-slate-700">
                                        <div class="text-center mb-3">
                                            <div class="text-xs text-slate-500 mb-1">浪高</div>
                                            <div class="text-3xl font-bold"
                                                :class="getStatusColor(weatherDetailData.statistics.waveHeight.current, weatherDetailData.statistics.waveHeight.threshold)">
                                                {{ weatherDetailData.statistics.waveHeight.current.toFixed(1) }}
                                            </div>
                                            <div class="text-xs text-slate-500 mt-1">m</div>
                                        </div>
                                        <div class="space-y-1 text-xs">
                                            <div class="flex justify-between text-slate-400">
                                                <span>平均:</span>
                                                <span class="text-white">{{
                                                    weatherDetailData.statistics.waveHeight.avg.toFixed(1) }} m</span>
                                            </div>
                                            <div class="flex justify-between text-slate-400">
                                                <span>最大:</span>
                                                <span class="text-white">{{
                                                    weatherDetailData.statistics.waveHeight.max.toFixed(1) }} m</span>
                                            </div>
                                            <div class="flex justify-between text-slate-400">
                                                <span>最小:</span>
                                                <span class="text-white">{{
                                                    weatherDetailData.statistics.waveHeight.min.toFixed(1) }} m</span>
                                            </div>
                                            <div
                                                class="flex justify-between text-slate-400 pt-2 border-t border-slate-700">
                                                <span>阈值:</span>
                                                <span class="text-orange-400">{{
                                                    weatherDetailData.statistics.waveHeight.threshold.toFixed(1) }}
                                                    m</span>
                                            </div>
                                        </div>
                                        <div class="mt-3 text-center">
                                            <span class="text-xs px-2 py-1 rounded-sm"
                                                :class="getStatusBadge(weatherDetailData.statistics.waveHeight.current, weatherDetailData.statistics.waveHeight.threshold)">
                                                {{ getStatusText(weatherDetailData.statistics.waveHeight.current,
                                                weatherDetailData.statistics.waveHeight.threshold) }}
                                            </span>
                                        </div>
                                    </div>

                                    <!-- 洋流统计 -->
                                    <div class="bg-slate-900/50 rounded-sm p-4 border border-slate-700">
                                        <div class="text-center mb-3">
                                            <div class="text-xs text-slate-500 mb-1">洋流</div>
                                            <div class="text-3xl font-bold"
                                                :class="getStatusColor(weatherDetailData.statistics.currentSpeed.current, weatherDetailData.statistics.currentSpeed.threshold)">
                                                {{ weatherDetailData.statistics.currentSpeed.current.toFixed(2) }}
                                            </div>
                                            <div class="text-xs text-slate-500 mt-1">m/s</div>
                                        </div>
                                        <div class="space-y-1 text-xs">
                                            <div class="flex justify-between text-slate-400">
                                                <span>平均:</span>
                                                <span class="text-white">{{
                                                    weatherDetailData.statistics.currentSpeed.avg.toFixed(2) }}
                                                    m/s</span>
                                            </div>
                                            <div class="flex justify-between text-slate-400">
                                                <span>最大:</span>
                                                <span class="text-white">{{
                                                    weatherDetailData.statistics.currentSpeed.max.toFixed(2) }}
                                                    m/s</span>
                                            </div>
                                            <div class="flex justify-between text-slate-400">
                                                <span>最小:</span>
                                                <span class="text-white">{{
                                                    weatherDetailData.statistics.currentSpeed.min.toFixed(2) }}
                                                    m/s</span>
                                            </div>
                                            <div
                                                class="flex justify-between text-slate-400 pt-2 border-t border-slate-700">
                                                <span>阈值:</span>
                                                <span class="text-orange-400">{{
                                                    weatherDetailData.statistics.currentSpeed.threshold.toFixed(2) }}
                                                    m/s</span>
                                            </div>
                                        </div>
                                        <div class="mt-3 text-center">
                                            <span class="text-xs px-2 py-1 rounded-sm"
                                                :class="getStatusBadge(weatherDetailData.statistics.currentSpeed.current, weatherDetailData.statistics.currentSpeed.threshold)">
                                                {{ getStatusText(weatherDetailData.statistics.currentSpeed.current,
                                                weatherDetailData.statistics.currentSpeed.threshold) }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 气象趋势图表 -->
                            <div class="bg-slate-800/40 border border-slate-700 rounded-sm p-4">
                                <div class="text-cyan-400 font-bold mb-4 flex items-center">
                                    <span class="mr-2">📈</span>
                                    气象趋势（未来24小时）
                                </div>
                                <div ref="chartContainer" class="w-full h-80"></div>
                            </div>

                            <!-- 预警信息 -->
                            <div v-if="weatherDetailData.warnings && weatherDetailData.warnings.length > 0"
                                class="bg-slate-800/40 border border-orange-500/50 rounded-sm p-4">
                                <div class="text-orange-400 font-bold mb-4 flex items-center">
                                    <span class="mr-2">⚠️</span>
                                    预警信息 ({{ weatherDetailData.warnings.length }} 条)
                                </div>
                                <div class="space-y-2">
                                    <div v-for="(warning, index) in weatherDetailData.warnings" :key="index"
                                        class="flex items-start gap-3 p-3 bg-slate-900/50 rounded-sm border"
                                        :class="warning.severity === 'high' ? 'border-red-500/50' : 'border-yellow-500/50'">
                                        <div class="text-2xl"
                                            :class="warning.severity === 'high' ? 'text-red-400' : 'text-yellow-400'">
                                            {{ warning.severity === 'high' ? '🔴' : '🟡' }}
                                        </div>
                                        <div class="flex-1">
                                            <div class="text-white font-bold text-sm mb-1">{{ warning.message }}</div>
                                            <div class="text-xs text-slate-400">
                                                时间: {{ formatWarningTime(warning.startTime) }}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 无预警 -->
                            <div v-else class="bg-slate-800/40 border border-green-500/50 rounded-sm p-4">
                                <div class="text-green-400 font-bold mb-2 flex items-center">
                                    <span class="mr-2">✅</span>
                                    气象状况良好
                                </div>
                                <div class="text-sm text-slate-400">未来24小时内无气象预警</div>
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
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { weatherWarningService } from '../utils/weatherWarningService.js';
import {
    addMiningMonitoring,
    getMiningMonitoringList,
    removeMiningMonitoring,
    updateMiningMonitoringThresholds
} from '../api/miningMonitoring.js';
import * as echarts from 'echarts';
import { API_BASE_URL } from '../api/config.js';

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
        const weatherDetailData = ref(null);
        const loadingWeatherDetail = ref(false);
        const chartContainer = ref(null);
        let chartInstance = null;

        let updateInterval = null;

        /**
         * 加载监测列表（从数据库）
         */
        const loadMonitoringList = async () => {
            try {
                console.log('📥 从数据库加载监测列表...');
                const result = await getMiningMonitoringList();

                if (result.success && result.data) {
                    console.log('✅ 加载成功，数据:', result.data);

                    // 转换数据格式
                    monitoredAreas.value = result.data.map(item => ({
                        id: item.miningAreaId,  // 使用矿区ID作为主键
                        monitoringId: item.id,  // 保存监测记录ID用于删除
                        name: item.name || item.contractor,
                        contractor: item.contractor,
                        mineral: item.mineral,
                        location: item.location,
                        polygon: item.polygon,
                        thresholds: {
                            windSpeed: item.windSpeedThreshold,
                            waveHeight: item.waveHeightThreshold,
                            currentSpeed: item.currentSpeedThreshold
                        },
                        warningCount: 0,
                        latestWeather: null
                    }));

                    console.log('✅ 监测列表加载完成，共', monitoredAreas.value.length, '个矿区');

                    // 启动气象监控
                    monitoredAreas.value.forEach(area => {
                        weatherWarningService.startMonitoring(area);
                    });
                } else {
                    console.error('❌ 加载失败:', result.error);
                }
            } catch (err) {
                console.error('❌ 加载监测列表异常:', err);
            }
        };

        /**
         * 添加矿区监测
         * @param {Object} miningArea - 矿区信息
         */
        const addArea = async (miningArea) => {
            console.log('📍 添加矿区到监测:', miningArea);

            // 检查是否已经在监测
            if (monitoredAreas.value.find(a => a.id === miningArea.id)) {
                ElMessage.warning(`矿区 "${miningArea.name}" 已在监测中`);
                return;
            }

            try {
                // 调用后端API保存到数据库
                const result = await addMiningMonitoring({
                    miningAreaId: miningArea.id,
                    windSpeedThreshold: thresholds.value.windSpeed,
                    waveHeightThreshold: thresholds.value.waveHeight,
                    currentSpeedThreshold: thresholds.value.currentSpeed
                });

                if (result.success) {
                    console.log('✅ 保存到数据库成功');

                    // 添加到前端列表
                    const area = {
                        ...miningArea,
                        monitoringId: result.data.id,  // 保存监测记录ID
                        thresholds: { ...thresholds.value },
                        warningCount: 0,
                        latestWeather: null
                    };

                    monitoredAreas.value.push(area);

                    // 启动气象监控
                    weatherWarningService.startMonitoring(area);

                    ElMessage.success(`已添加矿区 "${miningArea.name}" 到气象监测`);
                } else {
                    console.error('❌ 保存失败:', result.error);
                    ElMessage.error(`添加失败: ${result.error}`);
                }
            } catch (err) {
                console.error('❌ 添加监测异常:', err);
                ElMessage.error(`添加失败: ${err.message}`);
            }
        };

        /**
         * 移除矿区监测
         * @param {String} areaId - 矿区ID
         */
        const removeArea = async (areaId) => {
            const index = monitoredAreas.value.findIndex(a => a.id === areaId);
            if (index > -1) {
                const area = monitoredAreas.value[index];

                try {
                    // 调用后端API从数据库删除
                    const result = await removeMiningMonitoring(area.monitoringId);

                    if (result.success) {
                        console.log('✅ 从数据库删除成功');

                        // 从前端列表移除
                        monitoredAreas.value.splice(index, 1);

                        // 停止气象监控
                        weatherWarningService.stopMonitoring(areaId);

                        ElMessage.info(`已移除矿区 "${area.name}" 的气象监测`);
                    } else {
                        console.error('❌ 删除失败:', result.error);
                        ElMessage.error(`移除失败: ${result.error}`);
                    }
                } catch (err) {
                    console.error('❌ 移除监测异常:', err);
                    ElMessage.error(`移除失败: ${err.message}`);
                }
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
            weatherDetailData.value = null;

            try {
                console.log('📊 加载气象统计数据:', area.monitoringId);

                // 调用新的气象统计API
                const response = await fetch(`http://121.194.93.61:8082/api/mining-monitoring/${area.monitoringId}/weather-stats`);
                const result = await response.json();

                if (result.success && result.data) {
                    weatherDetailData.value = result.data;
                    console.log('✅ 气象统计数据加载成功:', result.data);

                    // 等待DOM更新后初始化图表
                    await nextTick();

                    // 再等待一个微任务，确保DOM完全渲染
                    setTimeout(() => {
                        initChart();
                    }, 100);
                } else {
                    console.error('❌ 加载气象统计失败:', result.error);
                    ElMessage.error('加载气象数据失败');
                }
            } catch (err) {
                console.error('❌ 加载气象统计异常:', err);
                ElMessage.error('加载气象数据失败');
            } finally {
                loadingWeatherDetail.value = false;
            }
        };

        /**
         * 初始化ECharts图表
         */
        const initChart = () => {
            console.log('🎨 初始化图表...');
            console.log('chartContainer.value:', chartContainer.value);
            console.log('weatherDetailData.value:', weatherDetailData.value);

            if (!chartContainer.value) {
                console.error('❌ 图表容器不存在！');
                return;
            }

            if (!weatherDetailData.value) {
                console.error('❌ 气象数据不存在！');
                return;
            }

            // 销毁旧图表
            if (chartInstance) {
                console.log('🗑️ 销毁旧图表');
                chartInstance.dispose();
            }

            // 创建新图表
            console.log('✨ 创建新图表实例');
            chartInstance = echarts.init(chartContainer.value);

            const data = weatherDetailData.value;
            const timeSeries = data.timeSeries || [];

            console.log('📊 时间序列数据:', timeSeries);
            console.log('📊 数据点数量:', timeSeries.length);

            if (timeSeries.length === 0) {
                console.warn('⚠️ 没有时间序列数据');
                return;
            }

            // 提取时间和数据
            const times = timeSeries.map(item => {
                const date = new Date(item.time);
                return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
            });

            const windSpeeds = timeSeries.map(item => item.windSpeed);
            const waveHeights = timeSeries.map(item => item.waveHeight);
            const currentSpeeds = timeSeries.map(item => item.currentSpeed);

            // 阈值
            const windThreshold = data.statistics.windSpeed.threshold;
            const waveThreshold = data.statistics.waveHeight.threshold;
            const currentThreshold = data.statistics.currentSpeed.threshold;

            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderColor: '#22d3ee',
                    borderWidth: 1,
                    textStyle: {
                        color: '#fff'
                    }
                },
                legend: {
                    data: ['风速', '风速阈值', '浪高', '浪高阈值', '洋流', '洋流阈值'],
                    textStyle: {
                        color: '#94a3b8'
                    },
                    top: 10
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    top: '15%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: times,
                    axisLine: {
                        lineStyle: {
                            color: '#475569'
                        }
                    },
                    axisLabel: {
                        color: '#f8fafc',
                        rotate: 45
                    }
                },
                yAxis: [
                    {
                        type: 'value',
                        name: '风速/浪高',
                        position: 'left',
                        axisLine: {
                            lineStyle: {
                                color: '#475569'
                            }
                        },
                        axisLabel: {
                            color: '#f8fafc'
                        },
                        splitLine: {
                            lineStyle: {
                                color: '#334155'
                            }
                        }
                    },
                    {
                        type: 'value',
                        name: '洋流',
                        position: 'right',
                        axisLine: {
                            lineStyle: {
                                color: '#475569'
                            }
                        },
                        axisLabel: {
                            color: '#f8fafc'
                        },
                        splitLine: {
                            show: false
                        }
                    }
                ],
                series: [
                    {
                        name: '风速',
                        type: 'line',
                        data: windSpeeds,
                        smooth: true,
                        lineStyle: {
                            color: '#22d3ee',
                            width: 2
                        },
                        itemStyle: {
                            color: '#22d3ee'
                        },
                        areaStyle: {
                            color: {
                                type: 'linear',
                                x: 0,
                                y: 0,
                                x2: 0,
                                y2: 1,
                                colorStops: [
                                    { offset: 0, color: 'rgba(34, 211, 238, 0.3)' },
                                    { offset: 1, color: 'rgba(34, 211, 238, 0.05)' }
                                ]
                            }
                        }
                    },
                    {
                        name: '风速阈值',
                        type: 'line',
                        data: new Array(times.length).fill(windThreshold),
                        lineStyle: {
                            color: '#f59e0b',
                            type: 'dashed',
                            width: 2
                        },
                        itemStyle: {
                            color: '#f59e0b'
                        },
                        symbol: 'none'
                    },
                    {
                        name: '浪高',
                        type: 'line',
                        data: waveHeights,
                        smooth: true,
                        lineStyle: {
                            color: '#06b6d4',
                            width: 2
                        },
                        itemStyle: {
                            color: '#06b6d4'
                        }
                    },
                    {
                        name: '浪高阈值',
                        type: 'line',
                        data: new Array(times.length).fill(waveThreshold),
                        lineStyle: {
                            color: '#f97316',
                            type: 'dashed',
                            width: 2
                        },
                        itemStyle: {
                            color: '#f97316'
                        },
                        symbol: 'none'
                    },
                    {
                        name: '洋流',
                        type: 'line',
                        yAxisIndex: 1,
                        data: currentSpeeds,
                        smooth: true,
                        lineStyle: {
                            color: '#8b5cf6',
                            width: 2
                        },
                        itemStyle: {
                            color: '#8b5cf6'
                        }
                    },
                    {
                        name: '洋流阈值',
                        type: 'line',
                        yAxisIndex: 1,
                        data: new Array(times.length).fill(currentThreshold),
                        lineStyle: {
                            color: '#a855f7',
                            type: 'dashed',
                            width: 2
                        },
                        itemStyle: {
                            color: '#a855f7'
                        },
                        symbol: 'none'
                    }
                ]
            };

            console.log('📈 设置图表配置:', option);
            chartInstance.setOption(option);
            console.log('✅ 图表初始化完成！');
        };

        /**
         * 获取状态颜色
         */
        const getStatusColor = (current, threshold) => {
            const ratio = current / threshold;
            if (ratio >= 1) return 'text-red-400';
            if (ratio >= 0.9) return 'text-orange-400';
            if (ratio >= 0.7) return 'text-yellow-400';
            return 'text-green-400';
        };

        /**
         * 获取状态徽章样式
         */
        const getStatusBadge = (current, threshold) => {
            const ratio = current / threshold;
            if (ratio >= 1) return 'bg-red-900/50 text-red-400 border border-red-500/50';
            if (ratio >= 0.9) return 'bg-orange-900/50 text-orange-400 border border-orange-500/50';
            if (ratio >= 0.7) return 'bg-yellow-900/50 text-yellow-400 border border-yellow-500/50';
            return 'bg-green-900/50 text-green-400 border border-green-500/50';
        };

        /**
         * 获取状态文本
         */
        const getStatusText = (current, threshold) => {
            const ratio = current / threshold;
            if (ratio >= 1) return '🔴 超过阈值';
            if (ratio >= 0.9) return '🟠 接近阈值';
            if (ratio >= 0.7) return '🟡 需要关注';
            return '🟢 正常';
        };

        /**
         * 格式化预警时间
         */
        const formatWarningTime = (timeStr) => {
            if (!timeStr) return '-';
            const date = new Date(timeStr);
            return date.toLocaleString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        /**
         * 关闭气象详情对话框
         */
        const closeDetailDialog = () => {
            showDetailDialog.value = false;
            selectedAreaDetail.value = null;
            weatherDetailData.value = null;

            // 销毁图表
            if (chartInstance) {
                chartInstance.dispose();
                chartInstance = null;
            }
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
                    const response = await fetch(`${API_BASE_URL}/api/copernicus/query-area`, {
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
            // 加载监测列表
            loadMonitoringList();
            // 启动定时更新
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

            // 销毁图表
            if (chartInstance) {
                chartInstance.dispose();
                chartInstance = null;
            }
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
            closeDetailDialog,
            loadMonitoringList,
            chartContainer,
            getStatusColor,
            getStatusBadge,
            getStatusText,
            formatWarningTime
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
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
