<template>
    <div class="absolute top-36 left-8 w-[28rem] z-40 flex flex-col gap-6 pointer-events-none font-['Noto_Sans_SC'] animate-slideInLeft max-h-[calc(100vh-10rem)]">
        
        <!-- 1. 船舶搜索面板 -->
        <transition name="slide-down">
            <div v-if="showShipSearch" class="tech-panel-enhanced pointer-events-auto relative group flex flex-col max-h-[45vh]" style="clip-path: polygon(0 0, 100% 0, 100% 95%, 92% 100%, 0 100%);">
                <!-- 动态扫描线 -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
                <div class="corner-decoration corner-tl scale-125"></div>
                <div class="corner-decoration corner-tr scale-125"></div>
            
                <!-- 标题 - 固定不滚动 -->
                <div class="flex items-center mb-4 border-b-2 border-cyan-500/30 pb-3 px-6 pt-6 flex-shrink-0">
                    <div class="w-1.5 h-6 bg-yellow-400 mr-3 shadow-[0_0_10px_#facc15]"></div>
                    <h3 class="text-2xl font-bold text-white tracking-wider flex-1">船舶搜索</h3>
                    <div class="text-xs font-['Orbitron'] text-cyan-500 opacity-80 font-bold tracking-widest">SHIP SEARCH</div>
                </div>
                
                <!-- 可滚动内容区域 -->
                <div class="overflow-y-auto custom-scrollbar px-6 pb-6 flex-1">
                    <!-- 搜索类型选项卡 -->
                    <div class="flex gap-2 mb-6">
                        <button 
                            @click="searchMode = 'single'"
                            :class="[
                                'flex-1 px-4 py-2 font-bold rounded-sm transition-all',
                                searchMode === 'single' 
                                    ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' 
                                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                            ]"
                        >
                            🔍 单船搜索
                        </button>
                        <button 
                            @click="searchMode = 'multiple'"
                            :class="[
                                'flex-1 px-4 py-2 font-bold rounded-sm transition-all',
                                searchMode === 'multiple' 
                                    ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' 
                                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                            ]"
                        >
                            📋 多船搜索
                        </button>
                    </div>

                    <!-- 单船搜索内容 -->
                <div v-if="searchMode === 'single'" class="space-y-4">
                    <!-- MMSI输入 -->
                    <div class="space-y-2">
                        <div class="text-cyan-400 text-base font-bold flex items-center">
                            <div class="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-2.5"></div>MMSI编号
                        </div>
                        <div class="flex gap-2">
                            <input 
                                v-model="singleMmsi"
                                type="text"
                                placeholder="输入9位MMSI，如：413961925"
                                class="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-cyan-500 transition-colors font-['Rajdhani']"
                                @keyup.enter="handleSingleSearch"
                            />
                            <button 
                                @click="handleSingleSearch"
                                :disabled="singleLoading || !singleMmsi"
                                class="px-6 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:from-slate-700 disabled:to-slate-600 text-white font-bold rounded-sm transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:shadow-none"
                            >
                                {{ singleLoading ? '搜索中...' : '搜索' }}
                            </button>
                        </div>
                    </div>

                    <!-- 单船搜索结果 -->
                    <div v-if="singleResult || singleError" class="space-y-2 pt-4 border-t border-dashed border-slate-700/50">
                        <div class="text-cyan-400 text-base font-bold flex items-center">
                            <div class="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-2.5"></div>搜索结果
                        </div>
                        
                        <!-- 错误提示 -->
                        <div v-if="singleError" class="p-4 bg-red-900/30 border border-red-500/50 rounded-sm">
                            <div class="text-red-400 text-sm">{{ singleError }}</div>
                        </div>
                        
                        <!-- 船舶信息卡片 -->
                        <div v-else-if="singleResult" class="bg-slate-800/40 border border-cyan-500/50 rounded-sm p-4 space-y-3">
                            <div class="flex items-center justify-between">
                                <span class="text-slate-400 text-sm">船舶名称</span>
                                <span class="text-white font-bold text-lg">{{ singleResult.ship_cnname || singleResult.ship_name }}</span>
                            </div>
                            <div class="flex items-center justify-between border-t border-slate-700/50 pt-2">
                                <span class="text-slate-400 text-sm">MMSI</span>
                                <span class="text-cyan-400 font-['Rajdhani'] font-bold">{{ singleResult.mmsi }}</span>
                            </div>
                            <div class="flex items-center justify-between border-t border-slate-700/50 pt-2">
                                <span class="text-slate-400 text-sm">当前位置</span>
                                <span class="text-white font-['Rajdhani']">{{ formatPosition(singleResult.lat, singleResult.lng) }}</span>
                            </div>
                            <div class="flex items-center justify-between border-t border-slate-700/50 pt-2">
                                <span class="text-slate-400 text-sm">航速</span>
                                <span class="text-white font-['Rajdhani']">{{ singleResult.sog }} kn</span>
                            </div>
                            <div class="flex items-center justify-between border-t border-slate-700/50 pt-2">
                                <span class="text-slate-400 text-sm">更新时间</span>
                                <span class="text-slate-400 text-xs">{{ singleResult.last_time }}</span>
                            </div>
                            
                            <!-- 操作按钮 -->
                            <div class="flex gap-2 pt-3 border-t border-slate-700/50">
                                <button 
                                    @click="handleSingleLocate"
                                    class="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-sm transition-all"
                                >
                                    📍 定位
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 多船搜索内容 -->
                <div v-if="searchMode === 'multiple'" class="space-y-4">
                    <!-- MMSI列表输入 -->
                    <div class="space-y-2">
                        <div class="text-cyan-400 text-base font-bold flex items-center">
                            <div class="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-2.5"></div>MMSI列表
                        </div>
                        <textarea 
                            v-model="multipleMmsis"
                            placeholder="输入多个MMSI，每行一个或用逗号分隔&#10;例如：&#10;413961925&#10;477232800&#10;或：413961925,477232800"
                            rows="4"
                            class="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-cyan-500 transition-colors font-['Rajdhani'] text-sm"
                        ></textarea>
                        <div class="text-xs text-slate-500">最多支持100个MMSI</div>
                    </div>
                    
                    <!-- 搜索按钮 -->
                    <div class="flex gap-2">
                        <button 
                            @click="handleMultipleSearch"
                            :disabled="multipleLoading || !multipleMmsis"
                            class="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:from-slate-700 disabled:to-slate-600 text-white font-bold rounded-sm transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:shadow-none"
                        >
                            {{ multipleLoading ? '搜索中...' : '🔍 批量搜索' }}
                        </button>
                        <button 
                            v-if="multipleResults.length > 0"
                            @click="handleClearMultiple"
                            class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-sm transition-all"
                        >
                            清除
                        </button>
                    </div>
                    
                    <!-- 多船搜索结果 -->
                    <div v-if="multipleResults.length > 0 || multipleError" class="space-y-2 pt-4 border-t border-dashed border-slate-700/50">
                        <div class="text-cyan-400 text-base font-bold flex items-center">
                            <div class="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-2.5"></div>
                            搜索结果 ({{ multipleResults.length }} 艘)
                        </div>
                        
                        <!-- 错误提示 -->
                        <div v-if="multipleError" class="p-4 bg-red-900/30 border border-red-500/50 rounded-sm">
                            <div class="text-red-400 text-sm">{{ multipleError }}</div>
                        </div>
                        
                        <!-- 船舶列表 -->
                        <div v-if="multipleResults.length > 0" class="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                            <div v-for="ship in multipleResults" :key="ship.mmsi" 
                                class="bg-slate-800/40 border border-cyan-500/30 rounded-sm p-3 hover:border-cyan-500/60 transition-all cursor-pointer"
                                @click="handleMultipleLocate(ship)"
                            >
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-white font-bold">{{ ship.ship_cnname || ship.ship_name }}</span>
                                    <span class="text-cyan-400 font-['Rajdhani'] text-sm">{{ ship.mmsi }}</span>
                                </div>
                                <div class="flex items-center justify-between text-xs text-slate-400">
                                    <span>航速: {{ ship.sog }} kn</span>
                                    <span>{{ formatPosition(ship.lat, ship.lng) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            </div>
        </transition>
        
        <!-- 2. 航线规划面板 -->
        <transition name="slide-down">
            <div v-if="showRoutePlan" class="tech-panel-enhanced pointer-events-auto relative group flex flex-col max-h-[45vh]" style="clip-path: polygon(0 0, 100% 0, 100% 95%, 92% 100%, 0 100%);">
                <!-- 动态扫描线 -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse"></div>
                <div class="corner-decoration corner-tl scale-125"></div>
                <div class="corner-decoration corner-tr scale-125"></div>
            
                <!-- 标题 - 固定不滚动 -->
                <div class="flex items-center mb-6 border-b-2 border-purple-500/30 pb-3 px-6 pt-6 flex-shrink-0">
                    <div class="w-1.5 h-6 bg-purple-400 mr-3 shadow-[0_0_10px_#a855f7]"></div>
                    <h3 class="text-2xl font-bold text-white tracking-wider flex-1">航线规划</h3>
                    <div class="text-xs font-['Orbitron'] text-purple-500 opacity-80 font-bold tracking-widest">ROUTE PLANNING</div>
                </div>

                <!-- 可滚动内容区域 -->
                <div class="overflow-y-auto custom-scrollbar px-6 pb-6 flex-1">
                    <!-- 内容 -->
                <div class="space-y-4">
                    <!-- 出发港 -->
                    <div class="space-y-2">
                        <div class="text-purple-400 text-base font-bold flex items-center">
                            <div class="w-1.5 h-1.5 bg-green-400 rounded-full mr-2.5"></div>出发港
                        </div>
                        <input 
                            v-model="startPort" 
                            type="text" 
                            placeholder="输入港口代码，如: CNSHA (上海)"
                            class="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-purple-500 transition-colors font-['Rajdhani']"
                        />
                        <div class="text-xs text-slate-500">常用: CNSHA(上海) CNTAO(青岛) CNNGB(宁波)</div>
                    </div>
                    
                    <!-- 到达港 -->
                    <div class="space-y-2 pt-2 border-t border-dashed border-slate-700/50">
                        <div class="text-purple-400 text-base font-bold flex items-center">
                            <div class="w-1.5 h-1.5 bg-red-400 rounded-full mr-2.5"></div>到达港
                        </div>
                        <input 
                            v-model="endPort" 
                            type="text" 
                            placeholder="输入港口代码，如: JPYOK (横滨)"
                            class="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-purple-500 transition-colors font-['Rajdhani']"
                        />
                        <div class="text-xs text-slate-500">常用: JPYOK(横滨) SGSIN(新加坡) USNYC(纽约)</div>
                    </div>
                    
                    <!-- 规划按钮 -->
                    <div class="flex gap-2 pt-4 border-t border-dashed border-slate-700/50">
                        <button 
                            @click="handleRoutePlan"
                            :disabled="routeLoading || !startPort || !endPort"
                            class="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:from-slate-700 disabled:to-slate-600 text-white font-bold rounded-sm transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] disabled:shadow-none"
                        >
                            {{ routeLoading ? '规划中...' : '🗺️ 规划路径' }}
                        </button>
                        <button 
                            v-if="routeResult"
                            @click="handleClearRoute"
                            class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-sm transition-all"
                        >
                            清除
                        </button>
                    </div>
                    
                    <!-- 路径规划结果 -->
                    <div v-if="routeResult || routeError" class="space-y-2 pt-4 border-t border-dashed border-slate-700/50">
                        <div class="text-purple-400 text-base font-bold flex items-center">
                            <div class="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2.5"></div>规划结果
                        </div>
                        
                        <!-- 错误提示 -->
                        <div v-if="routeError" class="p-4 bg-red-900/30 border border-red-500/50 rounded-sm">
                            <div class="text-red-400 text-sm">{{ routeError }}</div>
                        </div>
                        
                        <!-- 路径信息 -->
                        <div v-else-if="routeResult" class="bg-slate-800/40 border border-purple-500/50 rounded-sm p-4 space-y-3">
                            <div class="flex items-center justify-between">
                                <span class="text-slate-400 text-sm">航线距离</span>
                                <span class="text-purple-400 font-bold text-lg font-['Rajdhani']">{{ routeResult.distance }} 海里</span>
                            </div>
                            <div class="flex items-center justify-between border-t border-slate-700/50 pt-2">
                                <span class="text-slate-400 text-sm">航点数量</span>
                                <span class="text-white font-['Rajdhani']">{{ routeResult.pointCount }} 个</span>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            </div>
        </transition>
        
    </div>
</template>

<script>
import { ref } from 'vue';
import { getSingleShip, getManyShip, planRouteByPort } from '../utils/shipxyApi.js';

export default {
    props: {
        showShipSearch: {
            type: Boolean,
            default: false
        },
        showRoutePlan: {
            type: Boolean,
            default: false
        }
    },
    emits: ['locate', 'routePlanned', 'routeCleared'],
    setup(props, { emit }) {
        // 搜索模式
        const searchMode = ref('single'); // 'single' 或 'multiple'
        
        // 单船搜索相关
        const singleMmsi = ref('');
        const singleLoading = ref(false);
        const singleResult = ref(null);
        const singleError = ref('');
        
        // 多船搜索相关
        const multipleMmsis = ref('');
        const multipleLoading = ref(false);
        const multipleResults = ref([]);
        const multipleError = ref('');
        
        // 航线规划相关
        const startPort = ref('');
        const endPort = ref('');
        const routeLoading = ref(false);
        const routeResult = ref(null);
        const routeError = ref('');
        
        // 单船搜索
        const handleSingleSearch = async () => {
            if (!singleMmsi.value.trim()) {
                singleError.value = '请输入MMSI';
                return;
            }
            
            const mmsi = parseInt(singleMmsi.value);
            if (isNaN(mmsi) || singleMmsi.value.length !== 9) {
                singleError.value = 'MMSI必须是9位数字';
                return;
            }
            
            singleLoading.value = true;
            singleError.value = '';
            singleResult.value = null;
            
            try {
                const result = await getSingleShip(mmsi);
                if (result.success) {
                    singleResult.value = result.data;
                } else {
                    singleError.value = result.error || '未找到该船舶';
                }
            } catch (err) {
                singleError.value = '搜索失败: ' + err.message;
            } finally {
                singleLoading.value = false;
            }
        };
        
        const handleSingleLocate = () => {
            if (singleResult.value) {
                emit('locate', singleResult.value);
            }
        };
        
        // 多船搜索
        const handleMultipleSearch = async () => {
            if (!multipleMmsis.value.trim()) {
                multipleError.value = '请输入MMSI列表';
                return;
            }
            
            // 解析MMSI列表（支持逗号和换行分隔）
            const mmsiList = multipleMmsis.value
                .split(/[,\n\s]+/)
                .map(m => m.trim())
                .filter(m => m.length === 9 && !isNaN(parseInt(m)))
                .map(m => parseInt(m));
            
            if (mmsiList.length === 0) {
                multipleError.value = '请输入有效的MMSI（9位数字）';
                return;
            }
            
            if (mmsiList.length > 100) {
                multipleError.value = '最多支持100个MMSI';
                return;
            }
            
            multipleLoading.value = true;
            multipleError.value = '';
            multipleResults.value = [];
            
            try {
                const result = await getManyShip(mmsiList);
                if (result.success && result.data) {
                    multipleResults.value = result.data;
                    // 将所有船舶添加到地图
                    result.data.forEach(ship => {
                        emit('locate', ship);
                    });
                } else {
                    multipleError.value = result.error || '搜索失败';
                }
            } catch (err) {
                multipleError.value = '搜索失败: ' + err.message;
            } finally {
                multipleLoading.value = false;
            }
        };
        
        const handleMultipleLocate = (ship) => {
            emit('locate', ship);
        };
        
        const handleClearMultiple = () => {
            multipleResults.value = [];
            multipleError.value = '';
        };
        
        const formatPosition = (lat, lng) => {
            const latDir = lat >= 0 ? 'N' : 'S';
            const lngDir = lng >= 0 ? 'E' : 'W';
            return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
        };
        
        // 航线规划
        const handleRoutePlan = async () => {
            if (!startPort.value || !endPort.value) {
                routeError.value = '请输入出发港和到达港代码';
                return;
            }
            
            routeLoading.value = true;
            routeError.value = '';
            routeResult.value = null;
            
            try {
                const result = await planRouteByPort(
                    startPort.value.toUpperCase(),
                    endPort.value.toUpperCase()
                );
                
                if (result.success && result.data) {
                    routeResult.value = {
                        distance: result.data.distance?.toFixed(2) || 0,
                        pointCount: result.data.route?.length || 0
                    };
                    
                    emit('routePlanned', {
                        route: result.data.route,
                        distance: result.data.distance,
                        startPort: startPort.value,
                        endPort: endPort.value
                    });
                } else {
                    routeError.value = result.error || '路径规划失败，请检查港口代码是否正确';
                }
            } catch (err) {
                routeError.value = '网络错误，请稍后重试';
            } finally {
                routeLoading.value = false;
            }
        };
        
        const handleClearRoute = () => {
            routeResult.value = null;
            routeError.value = '';
            emit('routeCleared');
        };
        
        return {
            searchMode,
            singleMmsi,
            singleLoading,
            singleResult,
            singleError,
            handleSingleSearch,
            handleSingleLocate,
            multipleMmsis,
            multipleLoading,
            multipleResults,
            multipleError,
            handleMultipleSearch,
            handleMultipleLocate,
            handleClearMultiple,
            formatPosition,
            startPort,
            endPort,
            routeLoading,
            routeResult,
            routeError,
            handleRoutePlan,
            handleClearRoute
        };
    }
};
</script>

<style scoped>
/* 滑入动画 */
.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.3s ease;
    max-height: 800px;
    overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
    max-height: 0;
    opacity: 0;
}

/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.5);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(6, 182, 212, 0.6), rgba(6, 182, 212, 0.3));
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, rgba(6, 182, 212, 0.9), rgba(6, 182, 212, 0.6));
}
</style>
