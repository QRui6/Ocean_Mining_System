<template>
    <header class="absolute top-0 left-0 w-full h-32 z-50 flex items-start justify-between pointer-events-none select-none overflow-hidden">
        
        <!-- Top Decorative Bar -->
        <div class="absolute top-0 left-0 w-full h-2 opacity-60 z-20" 
             style="background: linear-gradient(to right, transparent, var(--accent-cyan), transparent);"></div>

        <!-- Center Structure (Reduced Width) -->
        <div class="absolute top-0 left-1/2 transform -translate-x-1/2 w-[1040px] h-[110px] z-10">
            <!-- Main Trapezoid -->
            <div class="w-full h-full border-b-2"
                 style="background-color: var(--header-bg); border-color: var(--header-border); box-shadow: var(--shadow-glow); clip-path: polygon(0 0, 100% 0, 85% 100%, 15% 100%);">
                 
                 <!-- Inner Grid Texture -->
                 <div class="absolute inset-0 opacity-20" 
                      style="background: linear-gradient(90deg, transparent 50%, var(--grid-color) 50%); background-size: 6px 6px;"></div>
                 
                 <!-- Bottom Highlight Line -->
                 <div class="absolute bottom-0 left-[15%] w-[70%] h-[3px]" 
                      style="background: linear-gradient(to right, transparent, var(--header-highlight), transparent); box-shadow: 0 0 15px var(--header-highlight);"></div>
            </div>
            
            <!-- Title (Adjusted Size) -->
            <div class="absolute top-6 w-full text-center">
                <h1 class="text-[2.55rem] font-['Noto_Sans_SC'] font-bold tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-400" 
                    style="filter: drop-shadow(0 0 15px var(--accent-cyan-glow));">
                    {{ APP_TITLE }}
                </h1>
                <div class="text-[11px] tracking-[0.18em] opacity-85 mt-2 font-['Rajdhani'] font-semibold" 
                     style="color: var(--accent-cyan);">{{ APP_TITLE_EN_SHORT }}</div>
            </div>
        </div>

        <!-- Left Area: Logo + Nav -->
        <div class="absolute top-0 left-0 h-full flex items-center pl-6 z-20 animate-slideInLeft w-[calc(50%-500px)]">
            <!-- Logo Block -->
            <div class="flex items-center mr-6 pr-5 border-r-2 pointer-events-auto" 
                 style="border-color: var(--border-secondary);">
                <!-- Logo 图标 - 纯图标，无背景 -->
                <div class="w-20 h-20 flex items-center justify-center relative">
                    <!-- Logo 图标 - 海洋/地球主题 -->
                    <svg class="w-16 h-16" 
                         style="color: var(--accent-cyan); filter: drop-shadow(0 0 10px var(--accent-cyan-glow));" 
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
            </div>

            <!-- Left Nav -->
            <nav class="flex gap-2.5 transform skew-x-[-15deg] pointer-events-auto">
                <button v-for="item in leftTabs" :key="item" 
                    @click="selectTab(item)"
                    @mouseenter="hoveredTab = item"
                    @mouseleave="hoveredTab = null"
                    class="px-5 py-2 text-base font-bold transition-all duration-300 min-w-[110px] border-2"
                    :style="{
                        color: activeTab === item ? 'white' : 'var(--text-secondary)',
                        backgroundColor: activeTab === item ? 'var(--header-tab-active-bg)' : (hoveredTab === item ? 'var(--header-tab-hover-bg)' : 'var(--header-tab-bg)'),
                        borderColor: activeTab === item ? 'var(--header-highlight)' : 'var(--border-secondary)',
                        boxShadow: activeTab === item ? '0 0 25px var(--accent-cyan-glow)' : 'none'
                    }"
                >
                    <span class="block transform skew-x-[15deg] drop-shadow-md">{{ item }}</span>
                </button>
            </nav>
        </div>

        <!-- Right Area: Nav + Time (与左侧对称) -->
        <div class="absolute top-0 right-0 h-full flex items-center justify-end pr-6 z-20 animate-slideInRight w-[calc(50%-500px)]">
            <!-- Right Nav -->
            <nav class="flex gap-2.5 transform skew-x-[15deg] pointer-events-auto">
                 <button v-for="item in rightTabs" :key="item" 
                    @click="selectTab(item)"
                    @mouseenter="hoveredTab = item"
                    @mouseleave="hoveredTab = null"
                    class="px-5 py-2 text-base font-bold transition-all duration-300 min-w-[110px] border-2"
                    :style="{
                        color: activeTab === item ? 'white' : 'var(--text-secondary)',
                        backgroundColor: activeTab === item ? 'var(--header-tab-active-bg)' : (hoveredTab === item ? 'var(--header-tab-hover-bg)' : 'var(--header-tab-bg)'),
                        borderColor: activeTab === item ? 'var(--header-highlight)' : 'var(--border-secondary)',
                        boxShadow: activeTab === item ? '0 0 25px var(--accent-cyan-glow)' : 'none'
                    }"
                >
                    <span class="block transform skew-x-[-15deg] drop-shadow-md">{{ item }}</span>
                </button>
            </nav>
            
            <!-- Time Block - 与左侧 Logo 区域对称 -->
            <div class="flex items-center gap-3 ml-6 pl-5 border-l-2 pointer-events-auto flex-shrink-0" 
                 style="border-color: var(--border-secondary);">
                <!-- Time Display -->
                <div class="flex flex-col leading-tight text-right">
                    <span class="text-base tracking-widest opacity-80 font-bold font-['Rajdhani']" 
                          style="color: var(--text-secondary);">{{ formatDate(time) }}</span>
                    <span class="text-3xl font-bold text-white tracking-wider tabular-nums font-['Rajdhani']" 
                          style="filter: drop-shadow(0 0 10px var(--accent-cyan-glow));">{{ formatTime(time) }}</span>
                </div>
            </div>
        </div>
        
        <!-- Decoration Lines under Nav -->
        <div class="absolute top-[100px] left-0 w-[30%] h-[1px]" 
             style="background: linear-gradient(to right, transparent, var(--accent-cyan), transparent); opacity: 0.5;"></div>
        <div class="absolute top-[100px] right-0 w-[30%] h-[1px]" 
             style="background: linear-gradient(to right, transparent, var(--accent-cyan), transparent); opacity: 0.5;"></div>
    </header>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { APP_TITLE, APP_TITLE_EN_SHORT, TOP_TABS } from '../constants.js';

export default {
    emits: ['tabChange'], // 向父组件发送选项卡切换事件
    setup(props, { emit }) {
        // ==================== 状态管理 ====================
        
        // 当前时间（用于右上角时间显示）
        const time = ref(new Date());
        
        // 当前激活的选项卡（默认：矿区管理）
        const activeTab = ref(TOP_TABS[1]);
        
        // 当前悬停的选项卡
        const hoveredTab = ref(null);
        
        // 左侧选项卡列表（前4个）
        const leftTabs = computed(() => TOP_TABS.slice(0, 4));
        
        // 右侧选项卡列表（后面的）
        const rightTabs = computed(() => TOP_TABS.slice(4));
        
        // 定时器（用于更新时间）
        let timer = null;
        
        // ==================== 事件处理函数 ====================
        
        /**
         * 选择选项卡
         * @param {String} tab - 选项卡名称
         * 
         * 功能：
         * 1. 更新当前激活的选项卡
         * 2. 向父组件发送 tabChange 事件
         */
        const selectTab = (tab) => {
            activeTab.value = tab;
            emit('tabChange', tab);
        };

        // ==================== 生命周期钩子 ====================
        
        /**
         * 组件挂载时：
         * 启动定时器，每30秒更新一次时间
         */
        onMounted(() => {
            timer = setInterval(() => {
                time.value = new Date();
            }, 30000);
        });

        /**
         * 组件卸载时：
         * 清除定时器，防止内存泄漏
         */
        onUnmounted(() => {
            if (timer) clearInterval(timer);
        });

        // ==================== 工具函数 ====================
        
        /**
         * 格式化日期
         * @param {Date} date - 日期对象
         * @returns {String} 格式化后的日期字符串（YYYY/MM/DD）
         */
        const formatDate = (date) => {
            const y = date.getFullYear();
            const m = (date.getMonth() + 1).toString().padStart(2, '0');
            const d = date.getDate().toString().padStart(2, '0');
            return `${y}/${m}/${d}`;
        };

        /**
         * 格式化时间
         * @param {Date} date - 日期对象
         * @returns {String} 格式化后的时间字符串（HH:MM）
         */
        const formatTime = (date) => {
            const h = date.getHours().toString().padStart(2, '0');
            const m = date.getMinutes().toString().padStart(2, '0');
            return `${h}:${m}`;
        };

        return {
            time,
            formatDate,
            formatTime,
            APP_TITLE,
            APP_TITLE_EN_SHORT,
            activeTab,
            hoveredTab,
            leftTabs,
            rightTabs,
            selectTab
        };
    }
};
</script>
