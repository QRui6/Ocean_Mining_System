<template>
    <div v-if="show" class="fixed left-[520px] w-[880px] z-31 pointer-events-auto animate-slideInUp" style="bottom: calc(35vh + 13.5rem);">
        <!-- 最新进展面板 -->
        <div class="p-2.5 relative" style="background: rgba(15, 30, 60, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); box-shadow: 0 -10px 40px rgba(6, 182, 212, 0.2), inset 0 0 60px rgba(6, 182, 212, 0.1); border-radius: 12px;">
            <!-- 标题栏 -->
            <div class="flex items-center justify-between mb-2 border-b border-purple-500/30 pb-1.5">
                <div class="flex items-center gap-2">
                    <div class="w-1 h-3.5 bg-purple-400 shadow-[0_0_8px_#c084fc]"></div>
                    <h3 class="text-sm font-bold text-white">最新进展 - Impossible Metals Eureka 收集系统</h3>
                </div>
                <button @click="$emit('close')" class="text-slate-400 hover:text-white transition-colors">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <!-- 内容区域：左侧图片 + 右侧文字 -->
            <div class="flex gap-3">
                <!-- 左侧：图片区域 -->
                <div class="w-[32%] flex-shrink-0">
                    <!-- 图片容器，悬浮时切换图片 -->
                    <div class="bg-slate-800/40 border border-slate-700/50 rounded p-1.5 h-full flex items-center relative group cursor-pointer">
                        <!-- 默认显示图片1 -->
                        <img src="/image/lifting/1.png" 
                             alt="收集系统流程" 
                             class="w-full h-auto rounded transition-opacity duration-300 group-hover:opacity-0" />
                        <!-- 悬浮时显示图片2 -->
                        <img src="/image/lifting/2.png" 
                             alt="系统发展历程" 
                             class="w-full h-auto rounded absolute inset-0 m-auto opacity-0 transition-opacity duration-300 group-hover:opacity-100 p-1.5" />
                        <!-- 提示文字 -->
                        <div class="absolute bottom-1 right-1 bg-slate-900/80 text-slate-400 text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            悬浮查看详情
                        </div>
                    </div>
                </div>

                <!-- 右侧：文字介绍 -->
                <div class="flex-1 space-y-1.5">
                    <!-- 发展历程 -->
                    <div class="bg-slate-800/40 border border-slate-700/50 rounded p-2">
                        <p class="text-sm text-slate-300 leading-relaxed mb-1.5">
                            Impossible Metals于<span class="text-purple-400 font-bold">2020年</span>开始研发工程架构，<span class="text-purple-400 font-bold">2021年</span>提交首批专利申请并完成首轮融资，启动深海多金属结核采集技术的概念验证工作。
                        </p>
                        <div class="space-y-0.5 text-sm text-slate-300">
                            <p><span class="text-green-400 font-bold">• Eureka I</span> - 2022年12月完成概念验证试验</p>
                            <p><span class="text-green-400 font-bold">• Eureka II</span> - 2024年4月完成深水测试</p>
                            <p><span class="text-cyan-400 font-bold">• Eureka III Mk1</span> - 2025年设计完成</p>
                        </div>
                    </div>

                    <!-- 工作流程 -->
                    <div class="bg-slate-800/40 border border-slate-700/50 rounded p-2">
                        <p class="text-sm font-bold text-cyan-300 mb-1">收集系统工作流程</p>
                        <div class="space-y-0.5 text-sm text-slate-300">
                            <p><span class="text-cyan-400 font-bold">①</span> 机器人群协调拾取结核，悬停于海床上方并避开可见生物</p>
                            <p><span class="text-cyan-400 font-bold">②</span> 机器人装满后返回船只进行卸载和电池/其他维护</p>
                            <p><span class="text-cyan-400 font-bold">③</span> 船只装满后返回港口，新船接替作业</p>
                        </div>
                    </div>

                    <!-- 技术特点 + 查看详情 -->
                    <div class="bg-slate-800/40 border border-slate-700/50 rounded p-2">
                        <p class="text-sm text-slate-300 leading-relaxed mb-1.5">
                            采用自主水下航行器（AUV）技术，选择性采集深海多金属结核，实现环保作业。系统持续迭代升级，技术日趋成熟。
                        </p>
                        <a href="https://impossiblemetals.com/technology/robotic-collection-system/" 
                           target="_blank" 
                           rel="noopener noreferrer"
                           class="inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors group">
                            <span class="font-bold">查看详情</span>
                            <svg class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'LatestProgressPanel',
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['close']
};
</script>

<style scoped>
@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-slideInUp {
    animation: slideInUp 0.4s ease-out;
}
</style>
