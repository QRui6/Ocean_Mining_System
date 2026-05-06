<template>
    <header class="absolute top-0 left-0 w-full h-32 z-50 flex items-start justify-between pointer-events-none select-none overflow-hidden">
        
        <!-- Top Decorative Bar -->
        <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-60 z-20"></div>

        <!-- Center Structure (Increased Width) -->
        <div class="absolute top-0 left-1/2 transform -translate-x-1/2 w-[1120px] h-[110px] z-10">
            <!-- Main Trapezoid -->
            <div class="w-full h-full bg-slate-950/90 border-b-2 border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.3)]"
                 style="clip-path: polygon(0 0, 100% 0, 85% 100%, 15% 100%); backdrop-filter: blur(10px);">
                 
                 <!-- Bottom Highlight Line -->
                 <div class="absolute bottom-0 left-[15%] w-[70%] h-[3px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent shadow-[0_0_15px_#facc15]"></div>
            </div>
            
            <!-- Title (Adjusted Size) -->
            <div class="absolute top-5 w-full text-center">
                <h1 class="text-5xl font-['Noto_Sans_SC'] font-bold tracking-[0.19em] text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]">
                    {{ APP_TITLE }}
                </h1>
                <div class="text-xs text-cyan-400 tracking-[0.5em] uppercase opacity-80 mt-2 font-['Orbitron'] font-bold">Deep Sea Mining Meteorological Support System</div>
            </div>
        </div>

        <!-- Left Area: Logo + Nav -->
        <div class="absolute top-0 left-0 h-full flex items-center pl-6 z-20 animate-slideInLeft w-[calc(50%-390px)]">
            <!-- Logo Block -->
            <div class="flex w-[112px] items-center pr-5 pointer-events-auto flex-shrink-0">
                <!-- Logo 图标 - 纯图标，无背景 -->
                <div class="w-20 h-20 flex items-center justify-center relative">
                    <!-- Logo 图标 - 海洋/地球主题 -->
                    <svg class="w-16 h-16 text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
            </div>

            <!-- Left Nav -->
            <nav class="flex-1 min-w-0 flex justify-end gap-3 pr-6 transform skew-x-[-15deg] pointer-events-auto">
                <button v-for="item in leftTabs" :key="item" 
                    @click="selectTab(item)"
                    :class="[
                        'px-4 py-2 text-base font-bold transition-all duration-300',
                        activeTab === item 
                            ? 'text-white bg-cyan-900/70 border-2 border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.4)]'
                            : 'text-cyan-100 bg-slate-900/60 border-2 border-cyan-500/30 hover:bg-cyan-900/40 hover:border-cyan-400 hover:text-white hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                    ]"
                    :style="getTabButtonStyle(leftTabs.length, 'left')"
                >
                    <span class="block transform skew-x-[15deg] drop-shadow-md">{{ item }}</span>
                </button>
            </nav>
        </div>

        <!-- Right Area: Nav + Time (与左侧对称) -->
        <div class="absolute top-0 right-0 h-full flex items-center pr-6 z-20 animate-slideInRight w-[calc(50%-390px)]">
            <!-- Right Nav -->
            <nav class="flex-1 min-w-0 flex justify-start gap-3 pl-6 transform skew-x-[15deg] pointer-events-auto">
                 <button v-for="item in rightTabs" :key="item" 
                    @click="selectTab(item)"
                    :class="[
                        'px-4 py-2 text-base font-bold transition-all duration-300',
                        activeTab === item 
                            ? 'text-white bg-cyan-900/70 border-2 border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.4)]'
                            : 'text-cyan-100 bg-slate-900/60 border-2 border-cyan-500/30 hover:bg-cyan-900/40 hover:border-cyan-400 hover:text-white hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                    ]"
                    :style="getTabButtonStyle(rightTabs.length, 'right')"
                >
                    <span class="block transform skew-x-[-15deg] drop-shadow-md">{{ item }}</span>
                </button>
            </nav>
            
            <!-- Time Block - 与左侧 Logo 区域对称 -->
            <div class="flex w-[112px] items-center justify-end gap-3 ml-2 pl-4 pointer-events-auto flex-shrink-0">
                <!-- Time Display -->
                <div class="flex flex-col leading-tight text-right">
                    <span class="text-base tracking-widest opacity-80 text-cyan-200 font-bold font-['Rajdhani']">{{ formatDate(time) }}</span>
                    <span class="text-3xl font-bold text-white tracking-wider drop-shadow-[0_0_10px_rgba(6,182,212,0.5)] tabular-nums font-['Rajdhani']">{{ formatTime(time) }}</span>
                </div>
            </div>
        </div>
        
        <!-- Decoration Lines under Nav -->
        <div class="absolute top-[100px] left-0 w-[30%] h-[1px] bg-gradient-to-r from-cyan-500/0 via-cyan-500/50 to-cyan-500/0"></div>
        <div class="absolute top-[100px] right-0 w-[30%] h-[1px] bg-gradient-to-r from-cyan-500/0 via-cyan-500/50 to-cyan-500/0"></div>
    </header>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { APP_TITLE, TOP_TABS } from '../constants.js';

export default {
    emits: ['tabChange'], // 向父组件发送选项卡切换事件
    setup(props, { emit }) {
        // ==================== 状态管理 ====================
        
        // 当前时间（用于右上角时间显示）
        const time = ref(new Date());
        
        // 当前激活的选项卡（默认：矿区管理）
        const activeTab = ref(TOP_TABS[0]);
        
        const SIDE_WIDTH = 570;
        const LEFT_RESERVED_WIDTH = 112;
        const RIGHT_RESERVED_WIDTH = 112;
        const NAV_HORIZONTAL_PADDING = 24;
        const TAB_GAP = 12;
        const TAB_MAX_WIDTH = 132;
        const TAB_MIN_WIDTH = 84;

        // 顶部选项卡按数量自动左右二分，奇数时左侧多一个
        const splitIndex = computed(() => Math.ceil(TOP_TABS.length / 2));

        // 左侧选项卡列表
        const leftTabs = computed(() => TOP_TABS.slice(0, splitIndex.value));
        
        // 右侧选项卡列表
        const rightTabs = computed(() => TOP_TABS.slice(splitIndex.value));
        
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

        /**
         * 根据左右两侧可用空间，动态计算顶部按钮宽度
         * 右侧会额外为时间区域预留宽度，避免标签把时间顶出布局
         */
        const getTabButtonStyle = (count, side) => {
            if (!count) {
                return {
                    width: `${TAB_MAX_WIDTH}px`,
                    minWidth: `${TAB_MIN_WIDTH}px`
                };
            }

            const reservedWidth = side === 'right' ? RIGHT_RESERVED_WIDTH : LEFT_RESERVED_WIDTH;
            const availableWidth = SIDE_WIDTH - reservedWidth - NAV_HORIZONTAL_PADDING - TAB_GAP * Math.max(count - 1, 0);
            const buttonWidth = Math.max(
                TAB_MIN_WIDTH,
                Math.min(TAB_MAX_WIDTH, Math.floor(availableWidth / count))
            );

            return {
                width: `${buttonWidth}px`,
                minWidth: `${buttonWidth}px`
            };
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
            activeTab,
            leftTabs,
            rightTabs,
            selectTab,
            getTabButtonStyle
        };
    }
};
</script>
