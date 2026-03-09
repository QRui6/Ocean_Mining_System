<template>
    <transition name="slide-up">
        <div v-if="show" class="fixed bottom-8 left-1/2 -translate-x-1/2 w-[55%] max-w-[900px] z-40 pointer-events-auto font-['Noto_Sans_SC']">
            <!-- 主容器 -->
            <div class="relative overflow-hidden rounded-lg"
                 style="background: linear-gradient(135deg, rgba(30, 58, 138, 0.2), rgba(30, 41, 59, 0.25), rgba(30, 58, 138, 0.2)); 
                        backdrop-filter: blur(16px); 
                        border: 2px solid rgba(6, 182, 212, 0.3); 
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(6, 182, 212, 0.2);">
                
                <!-- 顶部发光线 -->
                <div class="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60"></div>
                
                <!-- 标题栏 -->
                <div class="relative flex items-center justify-center px-6 py-3 border-b border-cyan-500/20">
                    <div class="flex items-center gap-3">
                        <el-icon :size="20" class="text-cyan-400">
                            <Calendar />
                        </el-icon>
                        <h3 class="text-base font-bold text-white tracking-wider">
                            美国深海采矿政策动态
                        </h3>
                    </div>
                </div>

                <!-- 时间线内容 -->
                <div 
                    ref="scrollContainer"
                    class="px-8 py-6 max-h-[400px] overflow-y-auto custom-scrollbar"
                    @mouseenter="stopAutoScroll"
                    @mouseleave="startAutoScroll"
                >
                    <el-timeline>
                        <!-- 早期阶段 -->
                        <el-timeline-item 
                            timestamp="早期阶段" 
                            placement="top"
                            type="primary"
                            size="large"
                            hollow
                        >
                            <el-card class="timeline-card">
                                <template #header>
                                    <div class="card-header">
                                        <span class="text-cyan-400 font-bold">法律框架建立</span>
                                        <el-tag type="info" size="small">基础</el-tag>
                                    </div>
                                </template>
                                <p class="text-white/90 text-sm leading-relaxed">
                                    法律分为两大块：一是国家管辖范围以外的国际海底区域（由NOAA依据《深海海底固体矿产资源法》DSHMRA管理，1980年通过），二是美国外大陆架（由BOEM依据《外大陆架上地法》管理）
                                </p>
                            </el-card>
                        </el-timeline-item>

                        <el-timeline-item 
                            timestamp="1984年" 
                            placement="top"
                            type="primary"
                            size="large"
                        >
                            <el-card class="timeline-card">
                                <template #header>
                                    <div class="card-header">
                                        <span class="text-cyan-400 font-bold">首批勘探许可证</span>
                                        <el-tag type="primary" size="small">NOAA</el-tag>
                                    </div>
                                </template>
                                <p class="text-white/90 text-sm leading-relaxed">
                                    NOAA依据《DSHMRA》在太平洋CCZ颁发了四个勘探许可证（USA-1至USA-4），是NOAA历史上颁发的首批也是此前唯一一批探矿许可证
                                </p>
                            </el-card>
                        </el-timeline-item>

                        <el-timeline-item 
                            timestamp="1994-1996年" 
                            placement="top"
                            type="primary"
                            size="large"
                        >
                            <el-card class="timeline-card">
                                <template #header>
                                    <div class="card-header">
                                        <span class="text-cyan-400 font-bold">国际海洋法公约</span>
                                        <el-tag type="info" size="small">ISA</el-tag>
                                    </div>
                                </template>
                                <p class="text-white/90 text-sm leading-relaxed">
                                    《联合国海洋法公约》生效，并设立国际海底管理局，负责管理公约缔约国的国际海底采矿活动。美国至今未加入该公约，仅作为观察员国参与ISA事务
                                </p>
                            </el-card>
                        </el-timeline-item>

                        <!-- 近期政策 -->
                        <el-timeline-item 
                            timestamp="2025年1月24日" 
                            placement="top"
                            type="danger"
                            size="large"
                        >
                            <el-card class="timeline-card">
                                <template #header>
                                    <div class="card-header">
                                        <span class="text-red-400 font-bold">特朗普总统令</span>
                                        <el-tag type="danger" size="small" effect="dark">重要</el-tag>
                                    </div>
                                </template>
                                <p class="text-white/90 text-sm leading-relaxed">
                                    特朗普签发总统令《释放美国近海关键矿产与资源》
                                </p>
                            </el-card>
                        </el-timeline-item>

                        <el-timeline-item 
                            timestamp="2025年4月29日" 
                            placement="top"
                            type="danger"
                            size="large"
                        >
                            <el-card class="timeline-card">
                                <template #header>
                                    <div class="card-header">
                                        <span class="text-red-400 font-bold">TMC提交申请</span>
                                        <el-tag type="danger" size="small">TMC USA</el-tag>
                                    </div>
                                </template>
                                <p class="text-white/90 text-sm leading-relaxed">
                                    TMC美国子公司（TMC USA）向NOAA提交了两份勘探许可证和一份商业开发许可证的申请。其申请区域与TMC通过挪威和汤加获得的ISA合同区部分重叠
                                </p>
                            </el-card>
                        </el-timeline-item>

                        <el-timeline-item 
                            timestamp="2025年7月" 
                            placement="top"
                            type="danger"
                            size="large"
                        >
                            <el-card class="timeline-card">
                                <template #header>
                                    <div class="card-header">
                                        <span class="text-red-400 font-bold">申请修订与确认</span>
                                        <el-tag type="success" size="small">通过</el-tag>
                                    </div>
                                </template>
                                <p class="text-white/90 text-sm leading-relaxed">
                                    TMC USA修订其勘探申请。同年稍晚，NOAA确认这些申请"完全符合"DSHMRA的要求
                                </p>
                            </el-card>
                        </el-timeline-item>

                        <el-timeline-item 
                            timestamp="2025年11月" 
                            placement="top"
                            type="danger"
                            size="large"
                        >
                            <el-card class="timeline-card">
                                <template #header>
                                    <div class="card-header">
                                        <span class="text-red-400 font-bold">新公司加入</span>
                                        <el-tag type="warning" size="small">多方</el-tag>
                                    </div>
                                </template>
                                <p class="text-white/90 text-sm leading-relaxed">
                                    深海稀有矿产公司向NOAA提交勘探申请；BOEM发布北马里亚纳群岛的信息和利益请求；BOEM完成美属萨摩亚邦托邦海域区域识别
                                </p>
                            </el-card>
                        </el-timeline-item>

                        <el-timeline-item 
                            timestamp="2025年12月23日" 
                            placement="top"
                            type="danger"
                            size="large"
                        >
                            <el-card class="timeline-card">
                                <template #header>
                                    <div class="card-header">
                                        <span class="text-red-400 font-bold">正式受理申请</span>
                                        <el-tag type="danger" size="small">公示</el-tag>
                                    </div>
                                </template>
                                <p class="text-white/90 text-sm leading-relaxed">
                                    NOAA正式公告受理TMC两份勘探许可证申请，1月底公开听证会，公众意见征询截至2026年2月28日
                                </p>
                            </el-card>
                        </el-timeline-item>

                        <!-- 2026年最新 -->
                        <el-timeline-item 
                            timestamp="2026年1月21日" 
                            placement="top"
                            type="warning"
                            size="large"
                        >
                            <el-card class="timeline-card">
                                <template #header>
                                    <div class="card-header">
                                        <span class="text-orange-400 font-bold">法规修订</span>
                                        <el-tag type="warning" size="small" effect="dark">新规</el-tag>
                                    </div>
                                </template>
                                <p class="text-white/90 text-sm leading-relaxed">
                                    NOAA发布最终规则，修订其海底采矿法规，新增合并申请流程，允许申请人同时满足勘探和商业开发要求，以提高审批效率
                                </p>
                            </el-card>
                        </el-timeline-item>

                        <el-timeline-item 
                            timestamp="2026年1月22日" 
                            placement="top"
                            type="warning"
                            size="large"
                        >
                            <el-card class="timeline-card">
                                <template #header>
                                    <div class="card-header">
                                        <span class="text-orange-400 font-bold">合并申请提交</span>
                                        <el-tag type="warning" size="small">TMC</el-tag>
                                    </div>
                                </template>
                                <p class="text-white/90 text-sm leading-relaxed">
                                    TMC美国公司根据新规，向NOAA提交了一份合并申请
                                </p>
                            </el-card>
                        </el-timeline-item>

                        <el-timeline-item 
                            timestamp="2026年1月27-28日" 
                            placement="top"
                            type="warning"
                            size="large"
                        >
                            <el-card class="timeline-card">
                                <template #header>
                                    <div class="card-header">
                                        <span class="text-orange-400 font-bold">公开听证会</span>
                                        <el-tag type="info" size="small">NOAA</el-tag>
                                    </div>
                                </template>
                                <p class="text-white/90 text-sm leading-relaxed">
                                    NOAA就TMC美国的勘探申请举行了两场听证会
                                </p>
                            </el-card>
                        </el-timeline-item>

                        <el-timeline-item 
                            timestamp="2026年2月23日" 
                            placement="top"
                            type="warning"
                            size="large"
                        >
                            <el-card class="timeline-card">
                                <template #header>
                                    <div class="card-header">
                                        <span class="text-orange-400 font-bold">BOEM条例修订</span>
                                        <el-tag type="warning" size="small" effect="dark">征询中</el-tag>
                                    </div>
                                </template>
                                <p class="text-white/90 text-sm leading-relaxed">
                                    BOEM宣布提议修订其外大陆架固体矿产管理条例，旨在简化审批流程，促进关键矿产的勘探与开发。公众意见征询截至2026年4月27日
                                </p>
                            </el-card>
                        </el-timeline-item>
                    </el-timeline>
                </div>
            </div>
        </div>
    </transition>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue';
import { Calendar, Close } from '@element-plus/icons-vue';

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    }
});

defineEmits(['close']);

const scrollContainer = ref(null);
let scrollInterval = null;

// 自动滚动函数
const startAutoScroll = () => {
    if (scrollInterval) return;
    
    scrollInterval = setInterval(() => {
        if (scrollContainer.value) {
            const container = scrollContainer.value;
            const maxScroll = container.scrollHeight - container.clientHeight;
            
            // 如果已经滚动到底部，回到顶部
            if (container.scrollTop >= maxScroll - 5) {
                container.scrollTop = 0;
            } else {
                // 平滑向下滚动
                container.scrollTop += 1;
            }
        }
    }, 30); // 每30ms滚动1px，速度适中
};

// 停止自动滚动
const stopAutoScroll = () => {
    if (scrollInterval) {
        clearInterval(scrollInterval);
        scrollInterval = null;
    }
};

// 监听show属性变化
watch(() => props.show, (newVal) => {
    if (newVal) {
        // 延迟启动自动滚动，等待DOM渲染完成
        setTimeout(() => {
            startAutoScroll();
        }, 500);
    } else {
        stopAutoScroll();
    }
});

// 组件卸载时清理
onUnmounted(() => {
    stopAutoScroll();
});
</script>

<style scoped>
/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
    width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.5);
    border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(6, 182, 212, 0.5);
    border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(6, 182, 212, 0.7);
}

/* 滑入动画 */
.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from {
    opacity: 0;
    transform: translate(-50%, 20px);
}

.slide-up-leave-to {
    opacity: 0;
    transform: translate(-50%, 20px);
}

/* Timeline 卡片样式 */
:deep(.el-timeline-item__timestamp) {
    color: #06b6d4 !important;
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 8px;
}

:deep(.el-timeline-item__node--primary) {
    background-color: #3b82f6 !important;
    border-color: #3b82f6 !important;
}

:deep(.el-timeline-item__node--danger) {
    background-color: #ef4444 !important;
    border-color: #ef4444 !important;
}

:deep(.el-timeline-item__node--warning) {
    background-color: #f59e0b !important;
    border-color: #f59e0b !important;
}

:deep(.el-timeline-item__tail) {
    border-left: 2px solid rgba(6, 182, 212, 0.3) !important;
}

.timeline-card {
    background: rgba(30, 41, 59, 0.3) !important;
    border: 1px solid rgba(100, 116, 139, 0.3) !important;
    transition: all 0.3s ease;
}

.timeline-card:hover {
    background: rgba(30, 41, 59, 0.5) !important;
    border-color: rgba(6, 182, 212, 0.5) !important;
    box-shadow: 0 4px 12px rgba(6, 182, 212, 0.2);
}

:deep(.timeline-card .el-card__header) {
    background: rgba(15, 23, 42, 0.2) !important;
    border-bottom: 1px solid rgba(100, 116, 139, 0.3) !important;
    padding: 12px 16px;
}

:deep(.timeline-card .el-card__body) {
    padding: 14px 16px;
}

.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}
</style>
