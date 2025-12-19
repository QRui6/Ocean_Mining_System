<template>
    <transition name="slide-down">
        <div v-if="show" class="absolute top-36 left-8 w-[28rem] z-40 pointer-events-auto font-['Noto_Sans_SC'] animate-slideInLeft">
            <div class="tech-panel-enhanced p-6 relative group max-h-[70vh] flex flex-col" style="clip-path: polygon(0 0, 100% 0, 100% 95%, 92% 100%, 0 100%);">
                <!-- 动态扫描线 -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse"></div>
                <div class="corner-decoration corner-tl scale-125"></div>
                <div class="corner-decoration corner-tr scale-125"></div>
            
                <!-- 标题 -->
                <div class="flex items-center mb-4 border-b-2 border-purple-500/30 pb-3 flex-shrink-0">
                    <div class="w-1.5 h-6 bg-purple-400 mr-3 shadow-[0_0_10px_#a855f7]"></div>
                    <h3 class="text-2xl font-bold text-white tracking-wider flex-1">区域监控</h3>
                    <div class="text-xs font-['Orbitron'] text-purple-500 opacity-80 font-bold tracking-widest">AREA MONITOR</div>
                </div>
                
                <!-- 可滚动内容 -->
                <div class="overflow-y-auto custom-scrollbar flex-1">
                    
                    <!-- 创建区域表单 -->
                    <div v-if="!isDrawing" class="mb-4 space-y-3">
                        <div>
                            <label class="text-sm text-purple-400 mb-1 block">区域名称</label>
                            <input 
                                v-model="newAreaName"
                                type="text"
                                placeholder="例如：东海作业区A"
                                class="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-purple-500 transition-colors"
                            />
                        </div>
                        
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="text-xs text-slate-400 mb-1 block">风速阈值(m/s)</label>
                                <input 
                                    v-model.number="newAreaThresholds.windSpeed"
                                    type="number"
                                    class="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-purple-500 transition-colors text-sm"
                                />
                            </div>
                            <div>
                                <label class="text-xs text-slate-400 mb-1 block">浪高阈值(m)</label>
                                <input 
                                    v-model.number="newAreaThresholds.waveHeight"
                                    type="number"
                                    class="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-purple-500 transition-colors text-sm"
                                />
                            </div>
                        </div>
                        
                        <button 
                            @click="startDrawing"
                            :disabled="!newAreaName.trim()"
                            class="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:from-slate-700 disabled:to-slate-600 text-white font-bold rounded-sm transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] disabled:shadow-none"
                        >
                            🖊️ 开始在地图上绘制
                        </button>
                    </div>
                    
                    <!-- 绘制中的提示 -->
                    <div v-else class="mb-4 space-y-3">
                        <div class="bg-purple-900/30 border border-purple-500/50 rounded-sm p-4">
                            <div class="text-purple-400 font-bold mb-2">🖊️ 正在绘制：{{ newAreaName }}</div>
                            <div class="text-xs text-slate-300 space-y-1">
                                <div>• 在地图上点击添加点</div>
                                <div>• 至少需要3个点</div>
                                <div>• 右键或双击完成绘制</div>
                            </div>
                        </div>
                        <button 
                            @click="cancelDrawing"
                            class="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-sm transition-all"
                        >
                            ❌ 取消绘制
                        </button>
                    </div>
                    
                    <!-- 区域列表 -->
                    <div v-if="areas.length > 0" class="space-y-3">
                        <div class="text-purple-400 text-base font-bold flex items-center mb-3">
                            <div class="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2.5"></div>
                            监控区域列表 ({{ areas.length }})
                        </div>
                        
                        <div 
                            v-for="area in areas" 
                            :key="area.id"
                            class="bg-slate-800/40 border border-slate-700 rounded-sm p-4 space-y-3"
                        >
                            <!-- 区域名称和状态 -->
                            <div class="flex items-center justify-between">
                                <span class="text-white font-bold text-base">{{ area.name }}</span>
                                <div class="flex items-center gap-2 text-xs text-slate-400">
                                    <span>船舶: {{ area.shipCount || 0 }}</span>
                                    <span v-if="area.warningCount > 0" class="text-yellow-400 animate-pulse">
                                        气象预警: {{ area.warningCount }}
                                    </span>
                                </div>
                            </div>
                            
                            <!-- 操作按钮 -->
                            <div class="flex gap-2 pt-2 border-t border-slate-700/50">
                                <button 
                                    @click="toggleAreaVisibility(area.id)"
                                    :class="[
                                        'flex-1 px-3 py-1.5 font-bold rounded-sm transition-all text-xs',
                                        areaVisibility[area.id] 
                                            ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]' 
                                            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                                    ]"
                                >
                                    {{ areaVisibility[area.id] ? '隐藏' : '显示' }}
                                </button>
                                <button 
                                    @click="flyToArea(area)"
                                    class="flex-1 px-3 py-1.5 bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 font-bold rounded-sm transition-all text-xs"
                                >
                                    定位
                                </button>
                                <button 
                                    @click="showAreaDetail(area)"
                                    class="flex-1 px-3 py-1.5 bg-slate-800/50 text-blue-400 hover:bg-blue-900/30 font-bold rounded-sm transition-all text-xs"
                                >
                                    详情
                                </button>
                                <button 
                                    @click="deleteArea(area.id)"
                                    class="px-3 py-1.5 bg-slate-800/50 text-red-400 hover:bg-red-900/30 font-bold rounded-sm transition-all text-xs"
                                >
                                    删除
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 空状态 -->
                    <div v-else class="text-center py-8 text-slate-500">
                        <div class="text-4xl mb-2">📍</div>
                        <div>暂无监控区域</div>
                        <div class="text-xs mt-2">点击上方按钮创建区域</div>
                    </div>
                    
                    <!-- 选中区域的详情 -->
                    <div v-if="selectedArea && areaShips.length > 0" class="mt-6 pt-6 border-t border-slate-700">
                        <h4 class="text-purple-400 font-bold mb-3">{{ selectedArea.name }} - 船舶清单</h4>
                        
                        <div class="space-y-2">
                            <div 
                                v-for="ship in areaShips" 
                                :key="ship.mmsi"
                                class="bg-slate-900/50 border border-purple-500/30 rounded-sm p-3"
                            >
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-white font-bold text-sm">{{ ship.shipName }}</span>
                                    <span class="text-xs text-slate-400">{{ ship.mmsi }}</span>
                                </div>
                                
                                <div class="text-xs text-slate-400">
                                    进入时间: {{ formatTime(ship.enterTime) }}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getAreas, createArea as createAreaAPI, deleteArea as deleteAreaAPI, getAreaShips } from '../utils/shipxyApi.js';

export default {
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['start-drawing', 'cancel-drawing', 'area-created', 'area-deleted', 'area-selected', 'show-area', 'hide-area', 'fly-to-area', 'show-detail'],
    
    setup(props, { emit }) {
        const areas = ref([]);
        const selectedAreaId = ref(null);
        const areaShips = ref([]);
        const isDrawing = ref(false);
        const loading = ref(false);
        const areaVisibility = ref({}); // 记录每个区域的显隐状态（true=显示，false=隐藏）
        
        // 新区域表单数据
        const newAreaName = ref('');
        const newAreaThresholds = ref({
            windSpeed: 15,
            waveHeight: 3
        });
        
        const selectedArea = computed(() => {
            if (!selectedAreaId.value) return null;
            return areas.value.find(a => a.id === selectedAreaId.value);
        });
        
        // 加载区域列表
        const loadAreas = async () => {
            loading.value = true;
            try {
                const result = await getAreas();
                if (result.success) {
                    areas.value = result.data;
                    console.log('✅ 加载区域列表:', areas.value.length);
                    console.log('区域数据:', areas.value);
                    // 检查polygon数据格式
                    if (areas.value.length > 0) {
                        console.log('第一个区域的polygon:', areas.value[0].polygon);
                        console.log('polygon类型:', typeof areas.value[0].polygon);
                        console.log('polygon是否为数组:', Array.isArray(areas.value[0].polygon));
                    }
                    // 不自动显示区域，由用户手动点击"显示"按钮
                } else {
                    console.error('❌ 加载区域失败:', result.error);
                }
            } catch (err) {
                console.error('❌ 加载区域异常:', err);
            } finally {
                loading.value = false;
            }
        };
        
        // 开始绘制
        const startDrawing = () => {
            if (!newAreaName.value.trim()) {
                return;
            }
            isDrawing.value = true;
            emit('start-drawing', {
                name: newAreaName.value,
                thresholds: newAreaThresholds.value
            });
        };
        
        // 取消绘制
        const cancelDrawing = () => {
            isDrawing.value = false;
            emit('cancel-drawing');
        };
        
        // 创建区域（由父组件调用）
        const createArea = async (polygon) => {
            try {
                const result = await createAreaAPI(
                    newAreaName.value, 
                    polygon, 
                    newAreaThresholds.value
                );
                
                if (result.success) {
                    console.log('✅ 区域创建成功:', result.data);
                    ElMessage.success({
                        message: `区域 "${result.data.name}" 创建成功！`,
                        duration: 3000,
                        showClose: true
                    });
                    
                    await loadAreas();
                    
                    // 绘制完成后默认显示区域
                    areaVisibility.value[result.data.id] = true;
                    emit('area-created', result.data);
                    
                    // 重置表单
                    newAreaName.value = '';
                    newAreaThresholds.value = {
                        windSpeed: 15,
                        waveHeight: 3
                    };
                    
                    return true;
                } else {
                    console.error('❌ 区域创建失败:', result.error);
                    ElMessage.error({
                        message: `创建失败: ${result.error}`,
                        duration: 3000,
                        showClose: true
                    });
                    return false;
                }
            } catch (err) {
                console.error('❌ 区域创建异常:', err);
                ElMessage.error({
                    message: `创建异常: ${err.message}`,
                    duration: 3000,
                    showClose: true
                });
                return false;
            } finally {
                isDrawing.value = false;
            }
        };
        
        // 删除区域
        const deleteArea = async (areaId) => {
            try {
                await ElMessageBox.confirm(
                    '确定要删除这个监控区域吗？删除后将无法恢复。',
                    '确认删除',
                    {
                        confirmButtonText: '确定',
                        cancelButtonText: '取消',
                        type: 'warning'
                    }
                );
                
                const result = await deleteAreaAPI(areaId);
                if (result.success) {
                    console.log('✅ 区域删除成功');
                    ElMessage.success('区域已删除');
                    await loadAreas();
                    if (selectedAreaId.value === areaId) {
                        selectedAreaId.value = null;
                        areaShips.value = [];
                    }
                    delete areaVisibility.value[areaId];
                    emit('area-deleted', areaId);
                } else {
                    ElMessage.error('删除失败: ' + result.error);
                }
            } catch (err) {
                if (err !== 'cancel') {
                    ElMessage.error('删除失败: ' + err.message);
                }
            }
        };
        
        // 切换区域显隐
        const toggleAreaVisibility = (areaId) => {
            const area = areas.value.find(a => a.id === areaId);
            if (!area) return;
            
            const newVisible = !areaVisibility.value[areaId];
            areaVisibility.value[areaId] = newVisible;
            
            if (newVisible) {
                // 显示区域
                emit('show-area', area);
            } else {
                // 隐藏区域
                emit('hide-area', areaId);
            }
        };
        
        // 飞到区域
        const flyToArea = (area) => {
            emit('fly-to-area', area);
        };
        
        // 显示区域详情
        const showAreaDetail = (area) => {
            console.log('🔍 点击详情按钮，区域:', area.name);
            emit('show-detail', area);
        };
        
        // 选择区域
        const selectArea = async (area) => {
            selectedAreaId.value = area.id;
            emit('area-selected', area);
            
            // 加载区域内船舶
            try {
                const result = await getAreaShips(area.id);
                if (result.success) {
                    areaShips.value = result.data;
                }
            } catch (err) {
                console.error('加载船舶失败:', err);
            }
        };
        
        // 格式化时间
        const formatTime = (timeStr) => {
            if (!timeStr) return '-';
            const date = new Date(timeStr);
            return date.toLocaleString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        };
        
        // 监听显示状态
        watch(() => props.show, (newVal) => {
            if (newVal) {
                loadAreas();
            }
        });
        
        onMounted(() => {
            if (props.show) {
                loadAreas();
            }
        });
        
        // 初始化区域显示状态（默认隐藏）
        watch(areas, (newAreas) => {
            newAreas.forEach(area => {
                if (!(area.id in areaVisibility.value)) {
                    areaVisibility.value[area.id] = false;
                }
            });
        });
        
        return {
            areas,
            selectedAreaId,
            selectedArea,
            areaShips,
            isDrawing,
            loading,
            newAreaName,
            newAreaThresholds,
            areaVisibility,
            startDrawing,
            cancelDrawing,
            createArea,
            deleteArea,
            selectArea,
            formatTime,
            toggleAreaVisibility,
            flyToArea,
            showAreaDetail,
            loadAreas  // 暴露给父组件调用
        };
    }
};
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
    opacity: 0;
    transform: translateY(-20px);
}

.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.5);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(168, 85, 247, 0.6), rgba(168, 85, 247, 0.3));
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, rgba(168, 85, 247, 0.9), rgba(168, 85, 247, 0.6));
}
</style>
