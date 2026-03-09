<template>
    <transition name="fade">
        <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div class="tech-panel-enhanced w-[500px] pointer-events-auto relative" @click.stop>
                <!-- 关闭按钮 -->
                <button 
                    @click="handleClose"
                    class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-800/50 hover:bg-red-600/50 rounded transition-colors z-10"
                >
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>

                <!-- 标题 -->
                <div class="flex items-center mb-4 border-b-2 border-cyan-500/30 pb-3">
                    <div class="w-1.5 h-6 bg-cyan-400 mr-3"></div>
                    <h3 class="text-xl font-bold text-white">{{ repositoryData.name }}</h3>
                </div>

                <!-- 内容 -->
                <div class="space-y-4 text-white">
                    <!-- 基本信息 -->
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-slate-800/50 p-3 rounded">
                            <div class="text-xs text-slate-400 mb-1">建设年份</div>
                            <div class="text-lg font-bold text-cyan-400">{{ repositoryData.year }}</div>
                        </div>
                        <div class="bg-slate-800/50 p-3 rounded">
                            <div class="text-xs text-slate-400 mb-1">岩芯数量</div>
                            <div class="text-lg font-bold text-cyan-400">{{ repositoryData.coreCount }}</div>
                        </div>
                    </div>

                    <!-- 描述 -->
                    <div class="bg-slate-800/50 p-3 rounded">
                        <div class="text-sm text-slate-300 leading-relaxed">
                            {{ repositoryData.description }}
                        </div>
                    </div>

                    <!-- 访问按钮 -->
                    <div class="flex gap-3">
                        <a 
                            :href="repositoryData.url" 
                            target="_blank"
                            class="flex-1 py-2 px-4 bg-cyan-600 hover:bg-cyan-700 rounded text-center transition-colors flex items-center justify-center gap-2"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                            </svg>
                            访问官网
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
import { ref, watch } from 'vue';

export default {
    name: 'CoreRepositoryPopup',
    props: {
        show: {
            type: Boolean,
            default: false
        },
        repositoryData: {
            type: Object,
            default: () => ({})
        }
    },
    emits: ['close'],
    setup(props, { emit }) {
        const handleClose = () => {
            emit('close');
        };

        return {
            handleClose
        };
    }
};
</script>

<style scoped>
.tech-panel-enhanced {
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%);
    backdrop-filter: blur(20px);
    border: 2px solid rgba(6, 182, 212, 0.3);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    padding: 1.5rem;
    border-radius: 8px;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
