<template>
    <transition name="slide-left">
        <div v-if="show && currentWarning" 
            class="fixed top-24 right-8 w-[18rem] z-50 pointer-events-auto font-['Noto_Sans_SC']">
            <div class="tech-panel-enhanced p-4 relative" 
                :class="warningClass"
                style="clip-path: polygon(0 0, 100% 0, 100% 90%, 90% 100%, 0 100%);">
                
                <!-- 扫描线 -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-current to-transparent animate-pulse"></div>
                
                <!-- 角装饰 -->
                <div class="absolute top-0 left-0 w-2 h-2 border-t border-l border-current"></div>
                <div class="absolute top-0 right-0 w-2 h-2 border-t border-r border-current"></div>
                
                <!-- 标题栏 -->
                <div class="flex items-center justify-between mb-3 pb-2 border-b border-current/30">
                    <div class="flex items-center gap-2">
                        <div class="w-1.5 h-1.5 bg-current rotate-45 shadow-[0_0_8px_currentColor] animate-pulse"></div>
                        <span class="text-base font-bold tracking-wide">{{ warningTitle }}</span>
                    </div>
                    <button @click="close" 
                        class="w-5 h-5 border border-current/50 flex items-center justify-center rounded-sm hover:bg-current hover:text-black transition-all">
                        <span class="text-sm font-bold">×</span>
                    </button>
                </div>
                
                <!-- 内容 -->
                <div class="space-y-2 relative">
                    <!-- 网格背景 -->
                    <div class="absolute inset-0 opacity-5 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:15px_15px]"></div>
                    
                    <!-- 航点名称 -->
                    <div class="relative z-10 bg-black/20 p-2 rounded-sm border border-current/20">
                        <div class="text-xs text-white/60 mb-0.5">航点位置</div>
                        <div class="text-sm font-bold">{{ currentWarning.name }}</div>
                    </div>
                    
                    <!-- 气象数据 -->
                    <div class="relative z-10 grid grid-cols-2 gap-1.5 text-xs">
                        <div class="bg-black/20 p-1.5 rounded-sm border border-current/10">
                            <div class="text-white/60 text-xs">风速</div>
                            <div class="font-bold font-['Rajdhani'] text-sm">{{ currentWarning.weather.windSpeed }} m/s</div>
                        </div>
                        <div class="bg-black/20 p-1.5 rounded-sm border border-current/10">
                            <div class="text-white/60 text-xs">风级</div>
                            <div class="font-bold font-['Rajdhani'] text-sm">{{ currentWarning.weather.windBeaufort }} 级</div>
                        </div>
                        <div class="bg-black/20 p-1.5 rounded-sm border border-current/10">
                            <div class="text-white/60 text-xs">浪高</div>
                            <div class="font-bold font-['Rajdhani'] text-sm">{{ currentWarning.weather.waveHeight }} m</div>
                        </div>
                        <div class="bg-black/20 p-1.5 rounded-sm border border-current/10">
                            <div class="text-white/60 text-xs">能见度</div>
                            <div class="font-bold font-['Rajdhani'] text-sm">{{ (currentWarning.weather.visibility / 1000).toFixed(1) }} km</div>
                        </div>
                    </div>
                    
                    <!-- 警告信息 -->
                    <div class="relative z-10 bg-current/10 border border-current/30 p-2 rounded-sm">
                        <div class="text-xs leading-relaxed">{{ warningMessage }}</div>
                        <!-- 如果有作业状态信息，显示 -->
                        <div v-if="currentWarning.workable !== undefined" class="mt-1.5 pt-1.5 border-t border-current/20">
                            <div class="flex items-center justify-between">
                                <span class="text-xs text-white/60">作业状态</span>
                                <span class="text-xs px-1.5 py-0.5 rounded font-bold"
                                    :class="currentWarning.workable ? 'bg-green-900/50 text-green-400 border border-green-500/50' : 'bg-red-900/50 text-red-400 border border-red-500/50'">
                                    {{ currentWarning.workable ? '可作业' : '不可作业' }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';

export default {
    name: 'RouteRiskWarning',
    setup() {
        const show = ref(false);
        const currentWarning = ref(null);
        
        const warningClass = computed(() => {
            if (!currentWarning.value) return '';
            
            if (currentWarning.value.type === 'arrival') {
                return 'bg-green-950/90 border-2 border-green-500/50 text-green-400 shadow-[0_0_30px_rgba(34,197,94,0.3)]';
            } else if (currentWarning.value.risk === 'danger') {
                return 'bg-red-950/90 border-2 border-red-500/50 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.3)]';
            } else if (currentWarning.value.risk === 'warning') {
                return 'bg-orange-950/90 border-2 border-orange-500/50 text-orange-400 shadow-[0_0_30px_rgba(249,115,22,0.3)]';
            }
            return '';
        });
        
        const warningTitle = computed(() => {
            if (!currentWarning.value) return '';
            if (currentWarning.value.type === 'arrival') return '到达提示';
            return currentWarning.value.risk === 'danger' ? '危险警告' : '警告提示';
        });
        
        const warningMessage = computed(() => {
            if (!currentWarning.value) return '';
            
            // 到达提示
            if (currentWarning.value.type === 'arrival') {
                return '船舶已成功到达目标矿区，即将开始作业准备。系统已自动切换至矿区气象预报模式，请查看底部面板了解作业期间的气象条件。';
            }
            
            // 判断是否是到达后的警告（通过名称判断）
            const isArrivalWarning = currentWarning.value.name && currentWarning.value.name.includes('到达后');
            
            if (isArrivalWarning) {
                // 到达后的警告消息
                if (currentWarning.value.risk === 'danger') {
                    return '矿区作业条件恶劣，存在危险气象条件。建议暂停作业，做好设备防护和人员安全措施。';
                } else {
                    return '矿区作业条件需要注意，气象条件可能影响作业效率。建议加强监测，做好应急准备。';
                }
            } else {
                // 航行中的警告消息
                if (currentWarning.value.risk === 'danger') {
                    return '前方航段存在危险气象条件，建议谨慎航行或考虑避让。请密切关注气象变化，做好应急准备。';
                } else {
                    return '前方航段气象条件需要注意，建议加强观察，做好相应的航行准备措施。';
                }
            }
        });
        
        const showWarning = (waypoint) => {
            currentWarning.value = waypoint;
            show.value = true;
        };
        
        const close = () => {
            show.value = false;
            setTimeout(() => {
                currentWarning.value = null;
            }, 300);
        };
        
        // 监听全局事件
        const handleShowWarningEvent = (event) => {
            console.log('📡 [RouteRiskWarning] 收到事件:', event.detail);
            showWarning(event.detail);
        };
        
        onMounted(() => {
            window.addEventListener('showRouteRiskWarning', handleShowWarningEvent);
        });
        
        onUnmounted(() => {
            window.removeEventListener('showRouteRiskWarning', handleShowWarningEvent);
        });
        
        return {
            show,
            currentWarning,
            warningClass,
            warningTitle,
            warningMessage,
            showWarning,
            close
        };
    }
};
</script>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active {
    transition: all 0.3s ease;
}

.slide-left-enter-from {
    opacity: 0;
    transform: translateX(100%);
}

.slide-left-leave-to {
    opacity: 0;
    transform: translateX(50%);
}
</style>
