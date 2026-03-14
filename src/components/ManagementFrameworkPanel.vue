<template>
    <transition name="fade">
        <div v-if="show && selectedFrameworks.length > 0" 
             class="fixed z-[9999] bg-slate-950/95 backdrop-blur-xl border-2 border-cyan-500/50 shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden rounded-lg pointer-events-auto transition-all duration-300"
             :class="isMaximized ? 'inset-x-16 inset-y-20' : 'bottom-8 left-1/2 transform -translate-x-1/2 h-[500px]'"
             :style="isMaximized ? {} : { width: panelWidth + 'px' }">
            
            <!-- 扫描线动画 -->
            <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
            
            <!-- 角落装饰 -->
            <div class="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500"></div>
            <div class="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500"></div>
            <div class="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500"></div>
            
            <!-- 标题栏 -->
            <div class="flex items-center justify-between bg-gradient-to-r from-cyan-900/60 to-transparent px-4 py-2 border-b border-cyan-500/30">
                <div class="flex items-center gap-3">
                    <div class="w-1.5 h-1.5 bg-cyan-400 rotate-45 shadow-[0_0_8px_#22d3ee]"></div>
                    <h2 class="text-lg font-bold text-white tracking-wide font-['Noto_Sans_SC']">
                        管理框架 ({{ selectedFrameworks.length }}个)
                    </h2>
                </div>
                <div class="flex items-center gap-2">
                    <!-- 放大/缩小按钮 -->
                    <button @click="toggleMaximize" 
                            class="group p-1.5 hover:bg-cyan-500/20 rounded transition-colors"
                            :title="isMaximized ? '缩小' : '放大'">
                        <svg v-if="!isMaximized" class="w-4 h-4 text-cyan-400 group-hover:text-white transition-colors" 
                             fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                        </svg>
                        <svg v-else class="w-4 h-4 text-cyan-400 group-hover:text-white transition-colors" 
                             fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"/>
                        </svg>
                    </button>
                    <!-- 关闭按钮 -->
                    <button @click="close" 
                            class="group p-1.5 hover:bg-cyan-500/20 rounded transition-colors">
                        <svg class="w-4 h-4 text-cyan-400 group-hover:text-white transition-colors" 
                             fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            </div>
            
            <!-- 内容区域 - 多个框架并排显示 -->
            <div class="h-[calc(100%-50px)] flex">
                <div v-for="(frameworkData, index) in frameworkDataList" 
                     :key="frameworkData.title"
                     class="h-full border-cyan-500/30 overflow-auto custom-scrollbar"
                     :class="{ 'border-r': index < frameworkDataList.length - 1 }"
                     :style="{ width: subPanelWidth }">
                    
                    <!-- 子面板标题 -->
                    <div class="bg-gradient-to-r from-slate-800/60 to-transparent px-3 py-1 border-b border-cyan-500/20">
                        <h3 class="text-sm font-semibold text-cyan-300 truncate">
                            {{ frameworkData.title }}
                        </h3>
                    </div>
                    
                    <!-- 子面板内容 -->
                    <div class="h-[calc(100%-32px)]">
                        <!-- 组织结构图模式 -->
                        <div v-if="displayMode === 'chart'" class="w-full h-full flex items-center justify-center">
                            <div class="w-full h-full transition-transform duration-300" :class="isMaximized ? 'scale-100' : 'scale-90'" style="transform-origin: center;">
                                <OrganizationChart 
                                    :data="frameworkData.chartData"
                                    @nodeClick="handleNodeClick"
                                />
                            </div>
                        </div>
                        
                        <!-- 图片模式 -->
                        <div v-else class="flex items-center justify-center w-full h-full p-2">
                            <img :src="frameworkData.image" 
                                 :alt="frameworkData.title"
                                 class="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-cyan-500/30"
                                 @error="(e) => handleImageError(e, frameworkData)">
                        </div>
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
        OrganizationChart: OrganizationChartEcharts
    },
    props: {
        show: {
            type: Boolean,
            default: false
        },
        framework: {
            type: String,
            default: null
        },
        frameworks: {
            type: Array,
            default: () => []
        }
    },
    emits: ['close'],
    setup(props, { emit }) {
        const displayMode = ref('chart');
        
        // 存储所有选中的框架
        const selectedFrameworks = ref([]);
        
        // 放大缩小状态
        const isMaximized = ref(false);
        
        const frameworksConfig = {
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
        
        // 监听frameworks prop的变化（优先使用frameworks数组）
        watch(() => props.frameworks, (newFrameworks) => {
            console.log('📋 ManagementFrameworkPanel: 接收到frameworks数组', newFrameworks);
            console.log('📋 ManagementFrameworkPanel: props.frameworks类型', typeof newFrameworks);
            console.log('📋 ManagementFrameworkPanel: props.frameworks是否为数组', Array.isArray(newFrameworks));
            console.log('📋 ManagementFrameworkPanel: props.frameworks.length', newFrameworks?.length);
            console.log('📋 ManagementFrameworkPanel: props.frameworks内容', JSON.stringify(newFrameworks));
            if (Array.isArray(newFrameworks) && newFrameworks.length > 0) {
                selectedFrameworks.value = [...newFrameworks];
                console.log('📋 ManagementFrameworkPanel: 设置selectedFrameworks为', selectedFrameworks.value);
                console.log('📋 ManagementFrameworkPanel: selectedFrameworks.length', selectedFrameworks.value.length);
            } else if (Array.isArray(newFrameworks) && newFrameworks.length === 0) {
                selectedFrameworks.value = [];
                console.log('📋 ManagementFrameworkPanel: 清空selectedFrameworks');
            }
        }, { immediate: true, deep: true });
        
        // 监听单个framework prop的变化（向后兼容）
        watch(() => props.framework, (newFramework) => {
            // 如果没有frameworks数组，则使用单个framework
            if (!props.frameworks || props.frameworks.length === 0) {
                if (newFramework) {
                    selectedFrameworks.value = [newFramework];
                } else {
                    selectedFrameworks.value = [];
                }
            }
        });
        
        // 监听selectedFrameworks变化，当没有选中框架时自动关闭面板
        watch(() => selectedFrameworks.value.length, (newLength) => {
            if (newLength === 0 && props.show) {
                console.log('📋 ManagementFrameworkPanel: 没有选中框架，自动关闭面板');
                close();
            }
        });
        
        // 当面板关闭时，清空选中的框架
        watch(() => props.show, (newShow) => {
            console.log('📋 ManagementFrameworkPanel: show状态变化', newShow);
            if (!newShow) {
                selectedFrameworks.value = [];
            }
            // 移除面板打开时的重复设置，让frameworks监听器处理
            
            if (newShow) {
                document.addEventListener('keydown', handleKeydown);
                displayMode.value = 'chart';
            } else {
                document.removeEventListener('keydown', handleKeydown);
            }
        });
        
        const frameworkDataList = computed(() => {
            console.log('📋 计算frameworkDataList，selectedFrameworks:', selectedFrameworks.value);
            const result = selectedFrameworks.value.map(frameworkId => {
                const config = frameworksConfig[frameworkId];
                console.log('📋 框架ID:', frameworkId, '配置:', config);
                return config || null;
            }).filter(Boolean);
            console.log('📋 最终frameworkDataList:', result);
            return result;
        });
        
        const panelWidth = computed(() => {
            const count = frameworkDataList.value.length;
            console.log('📋 计算面板宽度，框架数量:', count);
            if (count === 1) return 600;
            if (count === 2) return 800;
            if (count === 3) return 1000;
            return 600;
        });
        
        const subPanelWidth = computed(() => {
            const count = frameworkDataList.value.length;
            if (count === 1) return '100%';
            if (count === 2) return '50%';
            if (count === 3) return '33.33%';
            return '100%';
        });
        
        const close = () => {
            isMaximized.value = false; // 关闭时重置放大状态
            emit('close');
        };
        
        const toggleMaximize = () => {
            isMaximized.value = !isMaximized.value;
        };
        
        const handleNodeClick = (node) => {
            console.log('点击节点:', node);
        };
        
        const handleImageError = (event, frameworkData) => {
            console.warn('⚠️ 管理框架图片加载失败:', frameworkData?.image);
            displayMode.value = 'chart';
        };
        
        const handleKeydown = (event) => {
            if (event.key === 'Escape' && props.show) {
                close();
            }
        };
        
        return {
            displayMode,
            selectedFrameworks,
            frameworkDataList,
            panelWidth,
            subPanelWidth,
            isMaximized,
            close,
            toggleMaximize,
            handleNodeClick,
            handleImageError
        };
    }
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

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
