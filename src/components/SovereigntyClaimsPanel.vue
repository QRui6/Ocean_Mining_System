<template>
    <transition name="slide-right">
        <div v-if="show" class="fixed left-8 z-30 pointer-events-auto" style="top: 480px; width: 380px;">
            <div class="backdrop-blur-md rounded-lg shadow-2xl overflow-hidden border"
                 style="background: var(--panel-bg); border-color: var(--panel-border);">
                
                <!-- 标题栏 -->
                <div class="flex items-center justify-between px-4 py-2 border-b"
                     style="background: var(--panel-header-bg); border-color: var(--panel-border);">
                    <div class="flex items-center gap-2">
                        <span class="text-base font-bold" style="color: var(--text-primary);">主权主张</span>
                    </div>
                    <button @click="$emit('close')" 
                            class="w-6 h-6 flex items-center justify-center rounded transition-all hover:bg-red-500/20"
                            style="color: var(--text-secondary);">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <!-- 内容区域 -->
                <div class="p-4 space-y-3">
                    <!-- 南极主权主张 -->
                    <div class="rounded-lg p-3 border cursor-pointer transition-all hover:border-cyan-500"
                         style="background: var(--panel-section-bg); border-color: var(--panel-border);"
                         @click="showAntarcticClaims">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <span class="text-2xl">🇦🇶</span>
                                <div>
                                    <h3 class="text-sm font-bold" style="color: var(--text-primary);">南极主权主张</h3>
                                    <p class="text-xs mt-1" style="color: var(--text-secondary);">Antarctic Territorial Claims</p>
                                </div>
                            </div>
                            <svg class="w-5 h-5" style="color: var(--accent-cyan);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                            </svg>
                        </div>
                        <div class="mt-3 text-xs" style="color: var(--text-secondary);">
                            <p>7个国家对南极洲提出领土主张</p>
                            <p class="mt-1">包括阿根廷、澳大利亚、智利、法国、新西兰、挪威、英国</p>
                        </div>
                    </div>
                    
                    <!-- 北极主权主张 -->
                    <div class="rounded-lg p-3 border cursor-pointer transition-all hover:border-cyan-500"
                         style="background: var(--panel-section-bg); border-color: var(--panel-border);"
                         @click="showArcticClaims">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <span class="text-2xl">🧊</span>
                                <div>
                                    <h3 class="text-sm font-bold" style="color: var(--text-primary);">北极主权主张</h3>
                                    <p class="text-xs mt-1" style="color: var(--text-secondary);">Arctic Territorial Claims</p>
                                </div>
                            </div>
                            <svg class="w-5 h-5" style="color: var(--accent-cyan);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                            </svg>
                        </div>
                        <div class="mt-3 text-xs" style="color: var(--text-secondary);">
                            <p>8个北极国家对北极地区拥有主权</p>
                            <p class="mt-1">包括俄罗斯、加拿大、美国、丹麦、挪威、瑞典、芬兰、冰岛</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
export default {
    name: 'SovereigntyClaimsPanel',
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['close', 'showAntarctic', 'showArctic'],
    methods: {
        showAntarcticClaims() {
            console.log('🇦🇶 显示南极主权主张');
            this.$emit('showAntarctic');
        },
        showArcticClaims() {
            console.log('🧊 显示北极主权主张');
            this.$emit('showArctic');
        }
    }
};
</script>

<style scoped>
.slide-right-enter-active,
.slide-right-leave-active {
    transition: all 0.3s ease;
}

.slide-right-enter-from {
    transform: translateX(-100%);
    opacity: 0;
}

.slide-right-leave-to {
    transform: translateX(-100%);
    opacity: 0;
}
</style>
