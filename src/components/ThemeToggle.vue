<template>
    <div class="fixed top-20 right-4 z-[200] pointer-events-auto">
        <button 
            @click="toggleTheme"
            class="group relative w-12 h-12 rounded-lg backdrop-blur-xl border transition-all duration-300 overflow-hidden"
            :class="[
                currentTheme === 'dark' 
                    ? 'bg-slate-900/80 border-cyan-500/40 hover:border-cyan-500/60' 
                    : 'bg-blue-900/80 border-cyan-400/60 hover:border-cyan-400/80'
            ]"
            :title="currentTheme === 'dark' ? '切换到亮色主题' : '切换到暗色主题'"
        >
            <!-- 暗色主题图标 -->
            <transition name="icon-fade">
                <svg v-if="currentTheme === 'dark'" 
                    class="absolute inset-0 m-auto w-6 h-6 text-cyan-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                </svg>
            </transition>
            
            <!-- 亮色主题图标 -->
            <transition name="icon-fade">
                <svg v-if="currentTheme === 'light'" 
                    class="absolute inset-0 m-auto w-6 h-6 text-yellow-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
            </transition>
            
            <!-- 悬停效果 -->
            <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                :class="[
                    currentTheme === 'dark' 
                        ? 'bg-gradient-to-br from-cyan-500/20 to-transparent' 
                        : 'bg-gradient-to-br from-cyan-400/30 to-transparent'
                ]">
            </div>
        </button>
        
        <!-- 主题名称提示 -->
        <div class="absolute top-full mt-2 right-0 px-3 py-1 rounded backdrop-blur-xl text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            :class="[
                currentTheme === 'dark' 
                    ? 'bg-slate-900/90 border border-cyan-500/40 text-cyan-400' 
                    : 'bg-blue-900/90 border border-cyan-400/60 text-cyan-300'
            ]">
            {{ currentTheme === 'dark' ? '暗色主题' : '亮色主题' }}
        </div>
    </div>
</template>

<script>
import { ref, onMounted } from 'vue';

export default {
    name: 'ThemeToggle',
    emits: ['themeChange'],
    setup(props, { emit }) {
        const currentTheme = ref('dark');
        
        // 从 localStorage 读取主题设置
        const loadTheme = () => {
            const savedTheme = localStorage.getItem('ocean-mining-theme') || 'dark';
            currentTheme.value = savedTheme;
            applyTheme(savedTheme);
        };
        
        // 应用主题
        const applyTheme = (theme) => {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('ocean-mining-theme', theme);
            emit('themeChange', theme);
        };
        
        // 切换主题
        const toggleTheme = () => {
            const newTheme = currentTheme.value === 'dark' ? 'light' : 'dark';
            currentTheme.value = newTheme;
            applyTheme(newTheme);
        };
        
        onMounted(() => {
            loadTheme();
        });
        
        return {
            currentTheme,
            toggleTheme
        };
    }
};
</script>

<style scoped>
/* 图标切换动画 */
.icon-fade-enter-active,
.icon-fade-leave-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.icon-fade-enter-from {
    opacity: 0;
    transform: rotate(-90deg) scale(0.5);
}

.icon-fade-leave-to {
    opacity: 0;
    transform: rotate(90deg) scale(0.5);
}

.icon-fade-enter-to,
.icon-fade-leave-from {
    opacity: 1;
    transform: rotate(0) scale(1);
}
</style>
