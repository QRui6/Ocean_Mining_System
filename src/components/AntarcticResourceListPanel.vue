<template>
    <transition name="slide-up">
        <div v-if="show && groupedResources.length > 0" class="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-auto">
            <div class="tech-panel-enhanced p-4 w-[48rem] max-h-[26rem] overflow-hidden relative" style="clip-path: polygon(0 0, 100% 0, 100% 95%, 98% 100%, 0 100%);">
                <!-- 动态扫描线 -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse"></div>
                <div class="corner-decoration corner-tl"></div>
                <div class="corner-decoration corner-tr"></div>
                
                <!-- 标题栏 -->
                <div class="flex items-center justify-between mb-3 border-b-2 border-green-500/30 pb-2">
                    <div class="flex items-center gap-2">
                        <div class="w-1 h-5 bg-green-400 shadow-[0_0_10px_#4ade80]"></div>
                        <h3 class="text-lg font-bold text-white">南极资源分布</h3>
                        <div class="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                            {{ totalResourceCount }}
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-green-400">{{ categoryText }}</span>
                        <button @click="$emit('close')" class="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-700/50 rounded">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- 资源分组列表 -->
                <div class="overflow-y-auto max-h-[18rem] custom-scrollbar">
                    <div v-for="group in groupedResources" :key="group.type" class="mb-2">
                        <!-- 资源类型标题（可折叠） -->
                        <div 
                            @click="toggleGroup(group.type)"
                            class="flex items-center justify-between px-3 py-3 bg-slate-700/50 hover:bg-slate-700/70 cursor-pointer transition-all duration-200 border-l-4"
                            :style="`border-left-color: ${getResourceColor(group.type)};`"
                        >
                            <div class="flex items-center gap-2">
                                <!-- 展开/收起图标 -->
                                <svg 
                                    class="w-4 h-4 text-green-400 transition-transform duration-300 flex-shrink-0" 
                                    :class="{ 'rotate-90': expandedGroups.includes(group.type) }"
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                                </svg>
                                
                                <!-- 资源形状图标 -->
                                <div class="flex-shrink-0">
                                    <svg :width="16" :height="16" viewBox="0 0 16 16">
                                        <!-- 圆形 -->
                                        <circle v-if="getResourceShape(group.type) === 'circle'" 
                                                cx="8" cy="8" r="6" 
                                                :fill="getResourceColor(group.type)" 
                                                :stroke="getResourceColor(group.type)" 
                                                stroke-width="1" 
                                                opacity="0.9"/>
                                        <!-- 方形 -->
                                        <rect v-else-if="getResourceShape(group.type) === 'square'" 
                                              x="3" y="3" width="10" height="10" 
                                              :fill="getResourceColor(group.type)" 
                                              :stroke="getResourceColor(group.type)" 
                                              stroke-width="1" 
                                              opacity="0.9"/>
                                        <!-- 三角形 -->
                                        <polygon v-else-if="getResourceShape(group.type) === 'triangle'" 
                                                 points="8,2 14,14 2,14" 
                                                 :fill="getResourceColor(group.type)" 
                                                 :stroke="getResourceColor(group.type)" 
                                                 stroke-width="1" 
                                                 opacity="0.9"/>
                                        <!-- 菱形 -->
                                        <polygon v-else-if="getResourceShape(group.type) === 'diamond'" 
                                                 points="8,2 14,8 8,14 2,8" 
                                                 :fill="getResourceColor(group.type)" 
                                                 :stroke="getResourceColor(group.type)" 
                                                 stroke-width="1" 
                                                 opacity="0.9"/>
                                        <!-- 星形 -->
                                        <polygon v-else-if="getResourceShape(group.type) === 'star'" 
                                                 points="8,1 9.5,6 14.5,6 10.5,9.5 12,14.5 8,11 4,14.5 5.5,9.5 1.5,6 6.5,6" 
                                                 :fill="getResourceColor(group.type)" 
                                                 :stroke="getResourceColor(group.type)" 
                                                 stroke-width="1" 
                                                 opacity="0.9"/>
                                        <!-- 默认圆形 -->
                                        <circle v-else 
                                                cx="8" cy="8" r="6" 
                                                :fill="getResourceColor(group.type)" 
                                                :stroke="getResourceColor(group.type)" 
                                                stroke-width="1" 
                                                opacity="0.9"/>
                                    </svg>
                                </div>
                                
                                <!-- 资源类型名称 -->
                                <span class="text-white text-sm font-bold flex-shrink-0">{{ group.type }}</span>
                                
                                <!-- 点位数量 -->
                                <div class="px-2 py-0.5 bg-green-600/60 text-white text-xs font-bold rounded-full flex-shrink-0">
                                    {{ group.items.length }}
                                </div>
                            </div>
                            
                            <!-- 资源信息摘要（分布区域、资源量、核心特点） -->
                            <div class="flex items-center gap-2 text-xs text-slate-300 ml-2">
                                <span class="max-w-[8rem] truncate">{{ group.info.area }}</span>
                                <span class="text-green-400 max-w-[10rem] truncate">{{ group.info.value }}</span>
                                <span class="text-cyan-400 max-w-[8rem] truncate">{{ group.info.feature }}</span>
                            </div>
                        </div>
                        
                        <!-- 展开的资源点位列表 -->
                        <transition name="expand">
                            <div v-if="expandedGroups.includes(group.type)" class="bg-slate-800/30">
                                <!-- 子项表头 -->
                                <div class="grid grid-cols-12 gap-2 px-6 py-2 bg-slate-800/50 border-b border-slate-600/30 text-xs text-slate-400">
                                    <div class="col-span-2 text-center">序号</div>
                                    <div class="col-span-10">坐标位置</div>
                                </div>
                                
                                <!-- 资源点位列表 -->
                                <div 
                                    v-for="(item, index) in group.items" 
                                    :key="item.id"
                                    @click="$emit('resourceClick', item)"
                                    class="grid grid-cols-12 gap-2 px-6 py-2.5 border-b border-slate-600/20 hover:bg-green-500/10 cursor-pointer transition-all duration-200 group"
                                >
                                    <!-- 序号 -->
                                    <div class="col-span-2 flex items-center justify-center">
                                        <div 
                                            class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                                            :style="`background-color: ${getResourceColor(group.type)}30; color: ${getResourceColor(group.type)};`"
                                        >
                                            {{ index + 1 }}
                                        </div>
                                    </div>
                                    
                                    <!-- 坐标位置 -->
                                    <div class="col-span-10 flex items-center">
                                        <span class="text-slate-300 text-sm group-hover:text-green-300 transition-colors font-mono">
                                            {{ formatCoordinates(item.coordinates) }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </transition>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
import { ref, computed } from 'vue';

// 资源颜色配置（与地图保持一致）
const RESOURCE_COLORS = {
    '石油天然气': '#000000',
    '天然气': '#4169E1',
    '煤炭': '#2C2C2C',
    '铁': '#8B4513',
    '铜': '#B87333',
    '金': '#FFD700',
    '银': '#C0C0C0',
    '铅': '#5C5C5C',
    '锡': '#A8A8A8',
    '钼': '#708090',
    '铀': '#00FF00',
    '白金': '#E5E4E2',
    '磷': '#FF6347',
    '硫黄': '#FFFF00',
    '锡钴铬': '#9370DB'
};

// 资源形状配置（与地图保持一致）
const RESOURCE_SHAPES = {
    '石油天然气': 'circle',
    '天然气': 'circle',
    '煤炭': 'square',
    '铁': 'triangle',
    '铜': 'circle',
    '金': 'star',
    '银': 'circle',
    '铅': 'square',
    '锡': 'circle',
    '钼': 'triangle',
    '铀': 'diamond',
    '白金': 'star',
    '磷': 'circle',
    '硫黄': 'circle',
    '锡钴铬': 'triangle'
};

// 资源详细信息（根据参考资料）
const RESOURCE_INFO = {
    '煤炭': {
        area: '横贯南极山脉',
        value: '总储量超5000亿吨',
        feature: '多为优质无烟煤，易于探测'
    },
    '石油天然气': {
        area: '罗斯海、威德尔海',
        value: '预估储量500-1000亿桶',
        feature: '深海油气，理藏深，勘探难度大'
    },
    '天然气': {
        area: '南极周边大陆架深海区',
        value: '预估储量30000-50000亿立方米',
        feature: '储量可观'
    },
    '铁': {
        area: '东南极查尔斯王子山',
        value: '总储量超千亿吨，品位高',
        feature: '全球最大铁矿带之一'
    },
    '铜': {
        area: '南极半岛、乔治五世海岸',
        value: '预估储量1200-2500万吨',
        feature: '多金属共生，潜在价值高'
    },
    '金': {
        area: '毛德皇后地、维多利亚地',
        value: '深部矿产，潜在储量可观',
        feature: '多伴生于其他矿床'
    },
    '银': {
        area: '毛德皇后地、维多利亚地',
        value: '战略价值高',
        feature: '多伴生于其他矿床'
    },
    '铅': {
        area: '南极半岛、乔治五世海岸',
        value: '储量可观',
        feature: '多金属共生'
    },
    '锡': {
        area: '毛德皇后地、维多利亚地',
        value: '储量可观',
        feature: '战略储备资源'
    },
    '钼': {
        area: '南极半岛',
        value: '储量可观',
        feature: '重要战略金属'
    },
    '铀': {
        area: '东南极',
        value: '储量可观',
        feature: '核能资源'
    },
    '白金': {
        area: '毛德皇后地',
        value: '战略价值极高',
        feature: '稀有贵金属'
    },
    '磷': {
        area: '南极半岛火山带',
        value: '储量可观',
        feature: '农业资源'
    },
    '硫黄': {
        area: '南极半岛火山带',
        value: '储量可观',
        feature: '化工原料'
    },
    '锡钴铬': {
        area: '南极半岛',
        value: '储量可观',
        feature: '战略金属组合'
    }
};

export default {
    name: 'AntarcticResourceListPanel',
    props: {
        show: {
            type: Boolean,
            default: false
        },
        resources: {
            type: Array,
            default: () => []
        },
        selectedCategories: {
            type: Array,
            default: () => []
        }
    },
    emits: ['close', 'resourceClick'],
    setup(props) {
        const expandedGroups = ref([]);
        
        // 按资源类型分组
        const groupedResources = computed(() => {
            const groups = {};
            
            props.resources.forEach(resource => {
                if (!groups[resource.type]) {
                    groups[resource.type] = {
                        type: resource.type,
                        items: [],
                        info: RESOURCE_INFO[resource.type] || {
                            area: '南极地区',
                            value: '储量待评估',
                            feature: '待勘探'
                        }
                    };
                }
                groups[resource.type].items.push(resource);
            });
            
            return Object.values(groups);
        });
        
        // 总资源点数
        const totalResourceCount = computed(() => {
            return props.resources.length;
        });
        
        // 分类文本
        const categoryText = computed(() => {
            if (props.selectedCategories.length === 0) {
                return '全部资源';
            }
            const categoryNames = {
                'energy_minerals': '能源矿产',
                'metal_minerals': '金属矿产',
                'non_metal_special': '非金属矿产及特殊资源'
            };
            return props.selectedCategories.map(c => categoryNames[c] || c).join(' + ');
        });
        
        // 切换分组展开/收起
        const toggleGroup = (type) => {
            const index = expandedGroups.value.indexOf(type);
            if (index > -1) {
                expandedGroups.value.splice(index, 1);
            } else {
                expandedGroups.value.push(type);
            }
        };
        
        // 格式化坐标
        const formatCoordinates = (coords) => {
            if (!coords || coords.length < 2) return '-';
            const [lng, lat] = coords;
            return `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
        };
        
        // 获取资源颜色
        const getResourceColor = (type) => {
            return RESOURCE_COLORS[type] || '#808080';
        };
        
        // 获取资源形状
        const getResourceShape = (type) => {
            return RESOURCE_SHAPES[type] || 'circle';
        };
        
        return {
            expandedGroups,
            groupedResources,
            totalResourceCount,
            categoryText,
            toggleGroup,
            formatCoordinates,
            getResourceColor,
            getResourceShape
        };
    }
};
</script>

<style scoped>
/* 科技面板样式 */
.tech-panel-enhanced {
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.92) 0%, rgba(51, 65, 85, 0.92) 100%);
    backdrop-filter: blur(20px);
    border: 2px solid rgba(34, 197, 94, 0.4);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

/* 角落装饰 */
.corner-decoration {
    position: absolute;
    width: 12px;
    height: 12px;
    border: 2px solid rgba(34, 197, 94, 0.6);
}

.corner-tl {
    top: -2px;
    left: -2px;
    border-right: none;
    border-bottom: none;
}

.corner-tr {
    top: -2px;
    right: -2px;
    border-left: none;
    border-bottom: none;
}

/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(30, 41, 59, 0.3);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(34, 197, 94, 0.6);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(34, 197, 94, 0.8);
}

/* 滑入动画 */
.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
    opacity: 0;
    transform: translate(-50%, 100px);
}

.slide-up-enter-to,
.slide-up-leave-from {
    opacity: 1;
    transform: translate(-50%, 0);
}

/* 展开/收起动画 */
.expand-enter-active,
.expand-leave-active {
    transition: all 0.3s ease;
    overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
    max-height: 0;
    opacity: 0;
}

.expand-enter-to,
.expand-leave-from {
    max-height: 500px;
    opacity: 1;
}
</style>
