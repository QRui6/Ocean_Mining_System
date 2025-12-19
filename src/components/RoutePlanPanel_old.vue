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
                            :disabled="loading || !startPort || !endPort"
                            class="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:from-slate-700 disabled:to-slate-600 text-white font-bold rounded-sm transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] disabled:shadow-none"
                        >
                            {{ loading ? '规划中...' : '🗺️ 规划路径' }}
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
        </transition>
    </div>
</template>

<script>
import { ref } from 'vue';
import { planRouteByPort } from '../utils/shipxyApi.js';

export default {
    name: 'RoutePlanPanel',
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['routePlanned', 'routeCleared'],
    setup(props, { emit }) {
        const startPort = ref('');
        const endPort = ref('');
        const loading = ref(false);
        const routeResult = ref(null);
        const error = ref('');
        
        const handleRoutePlan = async () => {
            if (!startPort.value || !endPort.value) {
                error.value = '请输入出发港和到达港代码';
                return;
            }
            
            loading.value = true;
            error.value = '';
            routeResult.value = null;
            
            try {
                console.log('🗺️ 开始规划路径:', {
                    start: startPort.value,
                    end: endPort.value
                });
                
                const result = await planRouteByPort(
                    startPort.value.toUpperCase(),
                    endPort.value.toUpperCase()
                );
                
                if (result.success && result.data) {
                    console.log('✅ 路径规划成功:', result.data);
                    
                    routeResult.value = {
                        distance: result.data.distance?.toFixed(2) || 0,
                        pointCount: result.data.route?.length || 0
                    };
                    
                    // 发送路径数据给父组件
                    emit('routePlanned', {
                        route: result.data.route,
                        distance: result.data.distance,
                        startPort: startPort.value,
                        endPort: endPort.value
                    });
                } else {
                    error.value = result.error || '路径规划失败，请检查港口代码是否正确';
                    console.error('❌ 路径规划失败:', result.error);
                }
            } catch (err) {
                error.value = '网络错误，请稍后重试';
                console.error('❌ 路径规划异常:', err);
            } finally {
                loading.value = false;
            }
        };
        
        const handleClearRoute = () => {
            routeResult.value = null;
            error.value = '';
            emit('routeCleared');
        };
        
        return {
            startPort,
            endPort,
            loading,
            routeResult,
            error,
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
</style>
