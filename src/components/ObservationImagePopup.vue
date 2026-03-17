<template>
    <div v-if="show" 
         class="fixed z-50 pointer-events-auto"
         :style="popupStyle">
        <div class="relative bg-slate-900/95 backdrop-blur-lg border-2 border-cyan-400/50 rounded-lg shadow-2xl overflow-hidden"
             style="box-shadow: 0 0 30px rgba(6, 182, 212, 0.4); z-index: 9000;">
            <!-- 关闭按钮 -->
            <button @click="$emit('close')" 
                    class="absolute top-2 right-2 z-10 text-cyan-400 hover:text-white transition-all duration-300 hover:rotate-90 bg-slate-900/80 rounded-full p-1">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
            
            <!-- 标题 -->
            <div class="px-4 py-2 bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border-b border-cyan-400/30">
                <h3 class="text-sm font-bold text-white tracking-wider font-['Noto_Sans_SC']">
                    {{ title }}
                </h3>
            </div>
            
            <!-- 图片内容 -->
            <div class="p-3">
                <img :src="imagePath" 
                     :alt="title"
                     class="max-w-full h-auto rounded"
                     style="max-height: 500px; max-width: 600px;"
                     @error="handleImageError" />
            </div>
        </div>
    </div>
</template>

<script>
import { computed } from 'vue';

export default {
    name: 'ObservationImagePopup',
    props: {
        show: {
            type: Boolean,
            default: false
        },
        title: {
            type: String,
            default: ''
        },
        imagePath: {
            type: String,
            default: ''
        },
        position: {
            type: Object,
            default: () => ({ x: 0, y: 0 })
        }
    },
    emits: ['close'],
    setup(props, { emit }) {
        const popupStyle = computed(() => {
            return {
                left: `${props.position.x + 20}px`,
                top: `${props.position.y - 100}px`
            };
        });

        const handleImageError = (e) => {
            console.error('图片加载失败:', props.imagePath);
            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23334155" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23fff" font-size="16"%3E图片加载失败%3C/text%3E%3C/svg%3E';
        };

        return {
            popupStyle,
            handleImageError
        };
    }
};
</script>

<style scoped>
/* 添加淡入动画 */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

div[class*="fixed"] > div {
    animation: fadeIn 0.2s ease-out;
}
</style>
