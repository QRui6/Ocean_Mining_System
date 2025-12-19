<template>
    <div class="absolute top-36 left-8 w-[28rem] z-40 pointer-events-none font-['Noto_Sans_SC'] animate-slideInLeft">
        <transition name="slide-down">
            <div v-if="show" class="tech-panel-enhanced p-6 pointer-events-auto relative group" style="clip-path: polygon(0 0, 100% 0, 100% 95%, 92% 100%, 0 100%);">
                <!-- 动态扫描线 -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse"></div>
                <div class="corner-decoration corner-tl scale-125"></div>
                <div class="corner-decoration corner-tr scale-125"></div>
            
                <!-- 标题 -->
                <div class="flex items-center mb-6 border-b-2 border-purple-500/30 pb-3">
                    <div class="w-1.5 h-6 bg-purple-400 mr-3 shadow-[0_0_10px_#a855f7]"></div>
                    <h3 class="text-2xl font-bold text-white tracking-wider flex-1">航线规划</h3>
                    <div class="text-xs font-['Orbitron'] text-purple-500 opacity-80 font-bold tracking-widest">ROUTE PLANNING</div>
                </div>

                <!-- 规划模式选项卡 -->
                <div class="flex gap-2 mb-6">
                    <button 
                        @click="planMode = 'port'"
                        :class="[
                            'flex-1 px-4 py-2 font-bold rounded-sm transition-all',
                            planMode === 'port' 
                                ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' 
                                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                        ]"
                    >
                        港到港
                    </button>
                    <button 
                        @click="planMode = 'point'"
                        :class="[
                            'flex-1 px-4 py-2 font-bold rounded-sm transition-all',
                            planMode === 'point' 
                                ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' 
                                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                        ]"
                    >
                        点到点
                    </button>
                </div>

                <!-- 港到港模式 -->
                <div v-if="planMode === 'port'" class="space-y-4">
                    <!-- 出发港 -->
                    <div class="space-y-2">
                        <div class="text-purple-400 text-base font-bold flex items-center">
                            <div class="w-1.5 h-1.5 bg-green-400 rounded-full mr-2.5"></div>出发港
                        </div>
                        <input 
                            v-model="startPort" 
                            type="text" 
                            placeholder="输入港口代码，如: CNSHA"
                            class="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-purple-500 transition-colors"
                        />
                        <div class="text-xs text-slate-500">提示: 输入5位港口代码</div>
                    </div>
                    
                    <!-- 到达港 -->
                    <div class="space-y-2">
                        <div class="text-purple-400 text-base font-bold flex items-center">
                            <div class="w-1.5 h-1.5 bg-red-400 rounded-full mr-2.5"></div>到达港
                        </div>
                        <input 
                            v-model="endPort" 
                            type="text" 
                            placeholder="输入港口代码，如: JPYOK"
                            class="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>
                </div>

                <!-- 点到点模式 -->
                <div v-else-if="planMode === 'point'" class="space-y-4">
                    <!-- 起始点 -->
                    <div class="space-y-2">
                        <div class="text-purple-400 text-base font-bold flex items-center">
                            <div class="w-1.5 h-1.5 bg-green-400 rounded-full mr-2.5"></div>起始点
                        </div>
                        <div class="flex gap-2">
                            <input 
                                v-model="startLng" 
                                type="number" 
                                step="0.000001"
                                placeholder="经度"
                                class="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-purple-500 transition-colors text-sm"
                            />
                            <input 
                                v-model="startLat" 
                                type="number" 
                                step="0.000001"
                                placeholder="纬度"
                                class="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-purple-500 transition-colors text-sm"
                            />
                        </div>
                        <button 
                            @click="pickStartPoint"
                            :class="[
                                'w-full px-3 py-1.5 text-sm font-bold rounded-sm transition-all',
                                pickingStart 
                                    ? 'bg-green-600 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse' 
                                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                            ]"
                        >
                            {{ pickingStart ? '点击地图选择起点...' : '地图选点' }}
                        </button>
                    </div>
                    
                    <!-- 结束点 -->
                    <div class="space-y-2">
                        <div class="text-purple-400 text-base font-bold flex items-center">
                            <div class="w-1.5 h-1.5 bg-red-400 rounded-full mr-2.5"></div>结束点
                        </div>
                        <div class="flex gap-2">
                            <input 
                                v-model="endLng" 
                                type="number" 
                                step="0.000001"
                                placeholder="经度"
                                class="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-purple-500 transition-colors text-sm"
                            />
                            <input 
                                v-model="endLat" 
                                type="number" 
                                step="0.000001"
                                placeholder="纬度"
                                class="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-purple-500 transition-colors text-sm"
                            />
                        </div>
                        <button 
                            @click="pickEndPoint"
                            :class="[
                                'w-full px-3 py-1.5 text-sm font-bold rounded-sm transition-all',
                                pickingEnd 
                                    ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse' 
                                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                            ]"
                        >
                            {{ pickingEnd ? '点击地图选择终点...' : '地图选点' }}
                        </button>
                    </div>
                    
                    <div class="text-xs text-slate-500 bg-slate-800/30 p-2 rounded">
                        提示: 点击"地图选点"后，在地图上点击选择位置
                    </div>
                </div>
                
                <!-- 规划按钮 -->
                <div class="flex gap-2 pt-4 border-t border-dashed border-slate-700/50">
                    <button 
                        @click="handleRoutePlan"
                        :disabled="loading || !canPlan"
                        class="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:from-slate-700 disabled:to-slate-600 text-white font-bold rounded-sm transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] disabled:shadow-none"
                    >
                        {{ loading ? '规划中...' : '规划路径' }}
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
                <div v-if="routeResult || error" class="space-y-2 pt-4 border-t border-dashed border-slate-700/50">
                    <div class="text-purple-400 text-base font-bold flex items-center">
                        <div class="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2.5"></div>规划结果
                    </div>
                    
                    <!-- 错误提示 -->
                    <div v-if="error" class="p-4 bg-red-900/30 border border-red-500/50 rounded-sm">
                        <div class="text-red-400 text-sm">{{ error }}</div>
                    </div>
                    
                    <!-- 路径信息 -->
                    <div v-else-if="routeResult" class="bg-slate-800/40 border border-purple-500/50 rounded-sm p-4 space-y-3">
                        <div class="flex items-center justify-between">
                            <span class="text-slate-400 text-sm">航线距离</span>
                            <span class="text-purple-400 font-bold text-lg">{{ routeResult.distance }} 海里</span>
                        </div>
                        <div class="flex items-center justify-between border-t border-slate-700/50 pt-2">
                            <span class="text-slate-400 text-sm">航点数量</span>
                            <span class="text-white">{{ routeResult.pointCount }} 个</span>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script>
import { ref, computed, watch } from 'vue';
import { planRouteByPort, planRouteByPoint } from '../utils/shipxyApi.js';

export default {
    name: 'RoutePlanPanel',
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['close', 'routePlanned', 'routeCleared', 'pickPoint'],
    
    setup(props, { emit }) {
        // 规划模式：port(港到港) 或 point(点到点)
        const planMode = ref('port');
        
        // 港到港模式的数据
        const startPort = ref('');
        const endPort = ref('');
        
        // 点到点模式的数据
        const startLng = ref('');
        const startLat = ref('');
        const endLng = ref('');
        const endLat = ref('');
        
        // 地图选点状态
        const pickingStart = ref(false);
        const pickingEnd = ref(false);
        
        // 其他状态
        const loading = ref(false);
        const error = ref('');
        const routeResult = ref(null);
        
        // 是否可以规划
        const canPlan = computed(() => {
            if (planMode.value === 'port') {
                return startPort.value && endPort.value;
            } else {
                return startLng.value && startLat.value && endLng.value && endLat.value;
            }
        });
        
        // 开始选择起点
        const pickStartPoint = () => {
            pickingStart.value = !pickingStart.value;
            if (pickingStart.value) {
                pickingEnd.value = false;
                emit('pickPoint', { type: 'start', callback: setStartPoint });
            } else {
                emit('pickPoint', { type: 'cancel' });
            }
        };
        
        // 开始选择终点
        const pickEndPoint = () => {
            pickingEnd.value = !pickingEnd.value;
            if (pickingEnd.value) {
                pickingStart.value = false;
                emit('pickPoint', { type: 'end', callback: setEndPoint });
            } else {
                emit('pickPoint', { type: 'cancel' });
            }
        };
        
        // 设置起点坐标
        const setStartPoint = (lng, lat) => {
            startLng.value = lng.toFixed(6);
            startLat.value = lat.toFixed(6);
            pickingStart.value = false;
            console.log('✅ 起点已设置:', lng, lat);
        };
        
        // 设置终点坐标
        const setEndPoint = (lng, lat) => {
            endLng.value = lng.toFixed(6);
            endLat.value = lat.toFixed(6);
            pickingEnd.value = false;
            console.log('✅ 终点已设置:', lng, lat);
        };
        
        // 规划路径
        const handleRoutePlan = async () => {
            error.value = '';
            loading.value = true;
            
            try {
                let result;
                
                if (planMode.value === 'port') {
                    // 港到港规划
                    console.log('🚢 港到港规划:', startPort.value, '->', endPort.value);
                    result = await planRouteByPort(startPort.value, endPort.value);
                } else {
                    // 点到点规划
                    const startPoint = `${startLng.value},${startLat.value}`;
                    const endPoint = `${endLng.value},${endLat.value}`;
                    console.log('📍 点到点规划:', startPoint, '->', endPoint);
                    result = await planRouteByPoint(startPoint, endPoint);
                }
                
                if (result.success) {
                    routeResult.value = {
                        distance: result.data.distance,
                        pointCount: result.data.route.length,
                        route: result.data.route
                    };
                    
                    // 发送规划结果给父组件
                    emit('routePlanned', {
                        mode: planMode.value,
                        route: result.data.route,
                        distance: result.data.distance
                    });
                } else {
                    error.value = result.error || '规划失败';
                }
            } catch (err) {
                console.error('❌ 航线规划失败:', err);
                error.value = err.message || '规划失败';
            } finally {
                loading.value = false;
            }
        };
        
        // 清除路径
        const handleClearRoute = () => {
            routeResult.value = null;
            error.value = '';
            emit('routeCleared');
        };
        
        // 监听模式切换，清除之前的数据
        watch(planMode, () => {
            error.value = '';
            routeResult.value = null;
            pickingStart.value = false;
            pickingEnd.value = false;
        });
        
        return {
            planMode,
            startPort,
            endPort,
            startLng,
            startLat,
            endLng,
            endLat,
            pickingStart,
            pickingEnd,
            loading,
            error,
            routeResult,
            canPlan,
            pickStartPoint,
            pickEndPoint,
            handleRoutePlan,
            handleClearRoute
        };
    }
};
</script>

<style scoped>
/* 动画效果 */
.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
    opacity: 0;
    transform: translateY(-20px);
}
</style>
