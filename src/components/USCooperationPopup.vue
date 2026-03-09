<template>
    <transition name="fade">
        <div 
            v-if="visible && cooperationData"
            class="fixed pointer-events-auto z-50 font-['Noto_Sans_SC']"
            :style="{ left: position.x + 'px', top: position.y + 'px' }"
        >
            <div class="relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-2 border-cyan-400/50 rounded-lg p-4 shadow-[0_0_30px_rgba(6,182,212,0.4)] max-w-md">
                <!-- 关闭按钮 -->
                <button 
                    @click="hide"
                    class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-cyan-400 hover:text-white hover:bg-cyan-500/20 rounded transition-all"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
                
                <!-- 标题 -->
                <div class="flex items-center gap-2 mb-3 pb-2 border-b border-cyan-500/30 pr-8">
                    <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: getCountryColor(cooperationData.country) }"></div>
                    <h3 class="text-lg font-bold text-white">
                        美国 - {{ cooperationData.country }}
                    </h3>
                </div>

                <!-- 合作框架/形式 -->
                <div class="mb-3">
                    <div class="text-cyan-400 text-sm font-semibold mb-1">合作框架/形式</div>
                    <div class="text-white/90 text-sm leading-relaxed whitespace-pre-line">
                        {{ cooperationData.cooperationType }}
                    </div>
                </div>

                <!-- 主要合作领域 -->
                <div class="mb-3">
                    <div class="text-cyan-400 text-sm font-semibold mb-1">主要合作领域</div>
                    <div class="text-white/90 text-sm leading-relaxed whitespace-pre-line">
                        {{ cooperationData.mainAreas }}
                    </div>
                </div>

                <!-- 关键进展/内容 -->
                <div>
                    <div class="text-cyan-400 text-sm font-semibold mb-1">关键进展/内容</div>
                    <div class="text-white/90 text-sm leading-relaxed whitespace-pre-line">
                        {{ cooperationData.details }}
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { US_COOPERATION_DATA } from '../utils/usCooperationLines.js';

const visible = ref(false);
const position = ref({ x: 0, y: 0 });
const cooperationData = ref(null);

const show = (data, x, y) => {
    cooperationData.value = data;
    
    // 优化弹窗位置，避免超出屏幕
    const popupWidth = 400; // 弹窗宽度
    const popupHeight = 400; // 弹窗高度
    const padding = 20;
    
    let finalX = x + padding;
    let finalY = y + padding;
    
    // 如果右侧超出屏幕，显示在左侧
    if (finalX + popupWidth > window.innerWidth) {
        finalX = x - popupWidth - padding;
    }
    
    // 如果底部超出屏幕，向上调整
    if (finalY + popupHeight > window.innerHeight) {
        finalY = window.innerHeight - popupHeight - padding;
    }
    
    // 确保不超出左边和顶部
    finalX = Math.max(padding, finalX);
    finalY = Math.max(padding, finalY);
    
    position.value = { x: finalX, y: finalY };
    visible.value = true;
};

const hide = () => {
    visible.value = false;
};

const getCountryColor = (country) => {
    const data = US_COOPERATION_DATA.find(c => c.country === country);
    return data ? data.color.toCssColorString() : '#06b6d4';
};

// 监听全局事件
const handleShowPopup = (event) => {
    const { data, x, y } = event.detail;
    show(data, x, y);
};

onMounted(() => {
    window.addEventListener('showUSCooperationPopup', handleShowPopup);
});

onUnmounted(() => {
    window.removeEventListener('showUSCooperationPopup', handleShowPopup);
});

defineExpose({
    show,
    hide
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
