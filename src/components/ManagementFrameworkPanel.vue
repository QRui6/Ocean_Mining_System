<template>
    <transition name="fade">
        <div v-if="show && selectedFramework" 
             class="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto"
             @click.self="close">
            <!-- 背景遮罩 -->
            <div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
            
            <!-- 面板内容 -->
            <div class="relative w-[90vw] max-w-[1200px] h-[85vh] bg-slate-950/95 backdrop-blur-xl border-2 border-cyan-500/50 shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden"
                 style="clip-path: polygon(0 0, 100% 0, 100% 96%, 96% 100%, 0 100%)">
                
                <!-- 扫描线动画 -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
                
                <!-- 角落装饰 -->
                <div class="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500"></div>
                <div class="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500"></div>
                <div class="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500"></div>
                
                <!-- 标题栏 -->
                <div class="flex items-center justify-between bg-gradient-to-r from-cyan-900/60 to-transparent px-6 py-4 border-b border-cyan-500/30">
                    <div class="flex items-center gap-4">
                        <div class="w-2 h-2 bg-cyan-400 rotate-45 shadow-[0_0_8px_#22d3ee]"></div>
                        <h2 class="text-2xl font-bold text-white tracking-wide font-['Noto_Sans_SC']">
                            {{ frameworkData.title }}
                        </h2>
                        <!-- <span class="text-sm text-cyan-400 font-['Orbitron'] tracking-wider">
                            {{ frameworkData.titleEn }}
                        </span> -->
                    </div>
                    <div class="flex items-center gap-3">
                        <!-- 切换显示模式按钮 -->
                        <!-- <button @click="toggleDisplayMode"
                                class="px-4 py-2 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/50 rounded text-cyan-300 text-sm transition-colors flex items-center gap-2">
                            <svg v-if="displayMode === 'chart'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                            </svg>
                            <span>{{ displayMode === 'chart' ? '图片模式' : '组织图' }}</span>
                        </button> -->
                        <button @click="close" 
                                class="group p-2 hover:bg-cyan-500/20 rounded transition-colors">
                            <svg class="w-6 h-6 text-cyan-400 group-hover:text-white transition-colors" 
                                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <!-- 内容区域 - 增加高度 -->
                <div class="h-[calc(100%-80px)] overflow-auto custom-scrollbar">
                    <!-- 组织结构图模式 -->
                    <div v-if="displayMode === 'chart'" class="w-full h-full">
                        <OrganizationChart 
                            :data="frameworkData.chartData"
                            @nodeClick="handleNodeClick"
                        />
                    </div>
                    
                    <!-- 图片模式 -->
                    <div v-else class="flex items-center justify-center w-full h-full p-6">
                        <img :src="frameworkData.image" 
                             :alt="frameworkData.title"
                             class="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-cyan-500/30"
                             @error="handleImageError">
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
import { ref, computed, watch } from 'vue';
import OrganizationChartEcharts from './OrganizationChartEcharts.vue';
import { usaFramework, japanFramework, europeFramework } from '../data/managementFrameworks.js';

export default {
    name: 'ManagementFrameworkPanel',
    components: {
        OrganizationChart: OrganizationChartEcharts  // 使用 ECharts 版本
    },
    props: {
        show: {
            type: Boolean,
            default: false
        },
        framework: {
            type: String,
            default: null  // 'usa_mgmt', 'japan_mgmt', 'europe_mgmt'
        }
    },
    emits: ['close'],
    setup(props, { emit }) {
        // 显示模式：'chart' 或 'image'
        const displayMode = ref('chart');
        
        // 管理框架数据配置
        const frameworks = {
            'usa_mgmt': {
                title: '美国管理框架',
                titleEn: 'USA Management Framework',
                organization: 'NSF (National Science Foundation)',
                image: '/images/management/usa_framework.png',
                chartData: usaFramework,
                description: '美国国家科学基金会负责IODP的管理和资金支持'
            },
            'japan_mgmt': {
                title: '日本管理框架',
                titleEn: 'Japan Management Framework',
                organization: 'JAMSTEC',
                image: '/images/management/japan_framework.png',
                chartData: japanFramework,
                description: '日本海洋研究开发机构负责IODP的管理和技术支持'
            },
            'europe_mgmt': {
                title: '欧洲管理框架',
                titleEn: 'Europe Management Framework',
                organization: 'ECORD (European Consortium)',
                image: '/images/management/europe_framework.png',
                chartData: europeFramework,
                description: '欧洲海洋钻探联盟负责IODP的管理和协调'
            }
        };
        
        // 当前选中的框架
        const selectedFramework = computed(() => props.framework);
        
        // 当前框架数据
        const frameworkData = computed(() => {
            if (!selectedFramework.value) return null;
            return frameworks[selectedFramework.value] || null;
        });
        
        // 切换显示模式
        const toggleDisplayMode = () => {
            displayMode.value = displayMode.value === 'chart' ? 'image' : 'chart';
        };
        
        // 关闭面板
        const close = () => {
            emit('close');
        };
        
        // 处理节点点击
        const handleNodeClick = (node) => {
            console.log('点击节点:', node);
            // 可以在这里添加节点详情显示等功能
        };
        
        // 图片加载错误处理
        const handleImageError = (event) => {
            console.warn('⚠️ 管理框架图片加载失败:', frameworkData.value?.image);
            // 自动切换到组织图模式
            displayMode.value = 'chart';
        };
        
        // 监听ESC键关闭
        const handleKeydown = (event) => {
            if (event.key === 'Escape' && props.show) {
                close();
            }
        };
        
        watch(() => props.show, (newVal) => {
            if (newVal) {
                document.addEventListener('keydown', handleKeydown);
                // 默认显示组织图
                displayMode.value = 'chart';
            } else {
                document.removeEventListener('keydown', handleKeydown);
            }
        });
        
        return {
            displayMode,
            selectedFramework,
            frameworkData,
            toggleDisplayMode,
            close,
            handleNodeClick,
            handleImageError
        };
    }
};
</script>

<style scoped>
/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
    width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.3);
    border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(6, 182, 212, 0.5);
    border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(6, 182, 212, 0.7);
}
</style>
