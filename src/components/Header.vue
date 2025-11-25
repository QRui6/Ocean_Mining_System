<template>
    <header class="absolute top-0 left-0 w-full h-32 z-50 flex items-start justify-between pointer-events-none select-none overflow-hidden">
        
        <!-- Top Decorative Bar -->
        <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-60 z-20"></div>

        <!-- Center Structure (Increased Width) -->
        <div class="absolute top-0 left-1/2 transform -translate-x-1/2 w-[1200px] h-[110px] z-10">
            <!-- Main Trapezoid -->
            <div class="w-full h-full bg-slate-950/90 border-b-2 border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.3)]"
                 style="clip-path: polygon(0 0, 100% 0, 85% 100%, 15% 100%); backdrop-filter: blur(10px);">
                 
                 <!-- Inner Grid Texture -->
                 <div class="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,transparent_50%,rgba(6,182,212,0.2)_50%)] bg-[size:6px_6px]"></div>
                 
                 <!-- Bottom Highlight Line -->
                 <div class="absolute bottom-0 left-[15%] w-[70%] h-[3px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent shadow-[0_0_15px_#facc15]"></div>
            </div>
            
            <!-- Title (Adjusted Size) -->
            <div class="absolute top-5 w-full text-center">
                <h1 class="text-5xl font-['Noto_Sans_SC'] font-bold tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]">
                    {{ APP_TITLE }}
                </h1>
                <div class="text-xs text-cyan-400 tracking-[0.5em] uppercase opacity-80 mt-2 font-['Orbitron'] font-bold">Deep Sea Mining Meteorological Support System</div>
            </div>
        </div>

        <!-- Left Area: Logo + Nav -->
        <div class="absolute top-0 left-0 h-full flex items-center pl-6 z-20 animate-slideInLeft w-[calc(50%-600px)]">
            <!-- Logo Block -->
            <div class="flex items-center mr-6 pr-5 border-r-2 border-cyan-500/30 pointer-events-auto">
                <!-- Logo 图标 - 纯图标，无背景 -->
                <div class="w-20 h-20 flex items-center justify-center relative">
                    <!-- Logo 图标 - 海洋/地球主题 -->
                    <svg class="w-16 h-16 text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
            </div>

            <!-- Left Nav -->
            <nav class="flex gap-2.5 transform skew-x-[-15deg] pointer-events-auto">
                <button v-for="item in leftTabs" :key="item" 
                    @click="selectTab(item)"
                    :class="[
                        'px-5 py-2 text-base font-bold transition-all duration-300 min-w-[110px]',
                        activeTab === item 
                            ? 'text-white bg-cyan-900/70 border-2 border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.4)]'
                            : 'text-cyan-100 bg-slate-900/60 border-2 border-cyan-500/30 hover:bg-cyan-900/40 hover:border-cyan-400 hover:text-white hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                    ]"
                >
                    <span class="block transform skew-x-[15deg] drop-shadow-md">{{ item }}</span>
                </button>
            </nav>
        </div>

        <!-- Right Area: Nav + Time (与左侧对称) -->
        <div class="absolute top-0 right-0 h-full flex items-center justify-end pr-6 z-20 animate-slideInRight w-[calc(50%-600px)]">
            <!-- Right Nav -->
            <nav class="flex gap-2.5 transform skew-x-[15deg] pointer-events-auto">
                 <button v-for="item in rightTabs" :key="item" 
                    @click="selectTab(item)"
                    :class="[
                        'px-5 py-2 text-base font-bold transition-all duration-300 min-w-[110px]',
                        activeTab === item 
                            ? 'text-white bg-cyan-900/70 border-2 border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.4)]'
                            : 'text-cyan-100 bg-slate-900/60 border-2 border-cyan-500/30 hover:bg-cyan-900/40 hover:border-cyan-400 hover:text-white hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                    ]"
                >
                    <span class="block transform skew-x-[-15deg] drop-shadow-md">{{ item }}</span>
                </button>
            </nav>
            
            <!-- Time Block - 与左侧 Logo 区域对称 -->
            <div class="flex items-center gap-3 ml-6 pl-5 border-l-2 border-cyan-500/30 pointer-events-auto flex-shrink-0">
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
import { ref, onMounted, onUnmounted } from 'vue';
import { APP_TITLE } from '../constants.js';

export default {
    emits: ['tabChange'], // 向父组件发送选项卡切换事件
    setup(props, { emit }) {
        // ==================== 状态管理 ====================
        
        // 当前时间（用于右上角时间显示）
        const time = ref(new Date());
        
        // 当前激活的选项卡（默认：一图一表）
        const activeTab = ref('一图一表');
        
        // 左侧选项卡列表
        const leftTabs = ['一图一表', '预报预警', '协同工作'];
        
        // 右侧选项卡列表
        const rightTabs = ['调度会商', '数据中心', '系统配置'];
        
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
            activeTab,
            leftTabs,
            rightTabs,
            selectTab
        };
    }
};
</script>