<template>
    <transition name="fade">
        <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
            <!-- 背景遮罩 -->
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('close')"></div>
            
            <!-- 主面板 -->
            <div class="relative w-[90vw] h-[85vh] backdrop-blur-md rounded-lg shadow-2xl overflow-hidden border"
                 style="background: var(--panel-bg); border-color: var(--panel-border);">
                
                <!-- 标题栏 -->
                <div class="flex items-center justify-between px-6 py-4 border-b"
                     style="background: var(--panel-header-bg); border-color: var(--panel-border);">
                    <div class="flex items-center gap-3">
                        <span class="text-3xl">🌊</span>
                        <h2 class="text-2xl font-bold" style="color: var(--text-primary);">环境监测</h2>
                    </div>
                    <button @click="$emit('close')" 
                            class="w-10 h-10 flex items-center justify-center rounded-lg transition-all hover:bg-red-500/20"
                            style="color: var(--text-secondary);">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <!-- 内容区域 - 左右分栏 -->
                <div class="flex h-[calc(100%-80px)]">
                    <!-- 左侧：所有图片 -->
                    <div class="w-1/2 p-6 border-r overflow-y-auto" style="border-color: var(--panel-border);">
                        <div class="space-y-3">
                            <!-- 第一行：1大框(2张图上下) + 1张图 -->
                            <div class="grid grid-cols-2 gap-3">
                                <!-- 左侧大框：两张图上下排列 -->
                                <div class="space-y-3">
                                    <div class="rounded-lg overflow-hidden border" style="border-color: var(--panel-border);">
                                        <img src="/image/enviorment/1.png" 
                                             alt="环境监测图1" 
                                             class="w-full h-auto hover:scale-105 transition-transform duration-300"
                                             @error="handleImageError">
                                    </div>
                                    <div class="rounded-lg overflow-hidden border" style="border-color: var(--panel-border);">
                                        <img src="/image/enviorment/2.png" 
                                             alt="环境监测图2" 
                                             class="w-full h-auto hover:scale-105 transition-transform duration-300"
                                             @error="handleImageError">
                                    </div>
                                </div>
                                <!-- 右侧单张大图 -->
                                <div class="rounded-lg overflow-hidden border" style="border-color: var(--panel-border);">
                                    <img src="/image/enviorment/3.png" 
                                         alt="环境监测图3" 
                                         class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                         @error="handleImageError">
                                </div>
                            </div>
                            
                            <!-- 第二行：2张图 -->
                            <div class="grid grid-cols-2 gap-3">
                                <div v-for="i in [4, 5]" :key="i" class="rounded-lg overflow-hidden border" style="border-color: var(--panel-border);">
                                    <img :src="`/image/enviorment/${i}.png`" 
                                         :alt="`环境监测图${i}`" 
                                         class="w-full h-auto hover:scale-105 transition-transform duration-300"
                                         @error="handleImageError">
                                </div>
                            </div>
                            
                            <!-- 第三行：2张图 -->
                            <div class="grid grid-cols-2 gap-3">
                                <div v-for="i in [6, 7]" :key="i" class="rounded-lg overflow-hidden border" style="border-color: var(--panel-border);">
                                    <img :src="`/image/enviorment/${i}.png`" 
                                         :alt="`环境监测图${i}`" 
                                         class="w-full h-auto hover:scale-105 transition-transform duration-300"
                                         @error="handleImageError">
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 右侧：文字内容 -->
                    <div class="w-1/2 p-6 overflow-y-auto">
                        <div class="space-y-6">
                            <!-- 欧洲项目 -->
                            <div class="p-5 rounded-lg border" style="background: rgba(6, 182, 212, 0.05); border-color: var(--panel-border);">
                                <h3 class="text-lg font-bold mb-3 flex items-center gap-2" style="color: var(--text-primary);">
                                    <span class="w-1 h-5 rounded-full" style="background: var(--accent-cyan);"></span>
                                    欧洲"采矿影响（MiningImpact）"项目
                                </h3>
                                <div class="text-sm leading-relaxed" style="color: var(--text-secondary);">
                                    <p class="mb-3">调查CCZ多个矿区，研究悬浮沉积物扩散、底栖生物影响等；将深海生态系统健康指标、损害阈值、监测和管理工具等科学数据及工具建议提供给ISA，为深海采矿监管提供依据；</p>
                                    <p>计划2026-2028年继续开展6个科考航次，今年10月重返2021年东太平洋约4000米海底的"帕塔尼亚二号"采矿车试验场，评估多金属结核采集五年后该区域的状态。</p>
                                </div>
                            </div>
                            
                            <!-- 中国项目 -->
                            <div class="p-5 rounded-lg border" style="background: rgba(239, 68, 68, 0.05); border-color: var(--panel-border);">
                                <h3 class="text-lg font-bold mb-3 flex items-center gap-2" style="color: var(--text-primary);">
                                    <span class="w-1 h-5 rounded-full bg-red-500"></span>
                                    我国自主研发"海底地层空间立体钻探与原位监测机器人"
                                </h3>
                                <div class="text-sm leading-relaxed" style="color: var(--text-secondary);">
                                    <p>模块化多节设计融合惯性导航、磁信标辅助定位与人工智能算法，并可携带多种传感器深入地层内部，开展大范围、长周期、多参数的原位实时监测。</p>
                                </div>
                            </div>
                            
                            <!-- 日本项目 -->
                            <div class="p-5 rounded-lg border" style="background: rgba(251, 146, 60, 0.05); border-color: var(--panel-border);">
                                <h3 class="text-lg font-bold mb-3 flex items-center gap-2" style="color: var(--text-primary);">
                                    <span class="w-1 h-5 rounded-full bg-orange-500"></span>
                                    日本近期深海稀土试采
                                </h3>
                                <div class="text-sm leading-relaxed" style="color: var(--text-secondary);">
                                    <p>利用海面污染监测系统、6000米级ROV、深海探测仪等设备，同时融合机器学习等，自动采集异常样本，实现多维度智能环境监测。</p>
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
export default {
    name: 'EnvironmentalMonitoringPanel',
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['close'],
    methods: {
        handleImageError(e) {
            console.warn('环境监测图片加载失败:', e.target.src);
            e.target.style.display = 'none';
        }
    }
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* 滚动条样式 */
::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb {
    background: rgba(6, 182, 212, 0.3);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: rgba(6, 182, 212, 0.5);
}
</style>
