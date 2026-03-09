<template>
    <transition name="slide-right">
        <div v-if="show" class="fixed top-36 right-8 w-[28rem] z-40 pointer-events-auto font-['Noto_Sans_SC']">
            <!-- 主容器 - 科技感边框 -->
            <div class="relative overflow-hidden"
                 style="clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px)); background: linear-gradient(to right, rgba(30, 58, 138, 0.2), rgba(30, 58, 138, 0.25), rgba(30, 58, 138, 0.2)); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 2px solid rgba(6, 182, 212, 0.3); box-shadow: 0 0 40px rgba(6, 182, 212, 0.2);">
                
                <!-- 发光边框效果 -->
                <div class="absolute inset-0 pointer-events-none">
                    <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-70"></div>
                    <div class="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-70"></div>
                    <div class="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-transparent via-cyan-400 to-transparent opacity-70"></div>
                    <div class="absolute top-0 right-0 w-[2px] h-full bg-gradient-to-b from-transparent via-cyan-400 to-transparent opacity-70"></div>
                </div>
                
                <!-- 角落装饰 -->
                <div class="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-cyan-400/80"></div>
                <div class="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-cyan-400/80"></div>
                <div class="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-cyan-400/80"></div>
                <div class="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-cyan-400/80"></div>
                
                <!-- 标题栏 -->
                <div class="relative flex items-center justify-between px-5 py-3 border-b border-cyan-500/30"
                     style="background: rgba(6, 182, 212, 0.08);">
                    <div class="flex items-center gap-3">
                        <div class="w-1 h-6 bg-gradient-to-b from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/50"></div>
                        <h3 class="text-lg font-bold text-white tracking-wider" style="text-shadow: 0 0 10px rgba(6, 182, 212, 0.5);">
                            钻探统计
                        </h3>
                    </div>
                    <div class="flex items-center gap-2">
                        <button 
                            @click="showDetail = !showDetail"
                            class="px-3 py-1 text-xs font-bold rounded transition-all duration-300"
                            :class="showDetail 
                                ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' 
                                : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/50'"
                        >
                            {{ showDetail ? '收起详情' : '详情统计' }}
                        </button>
                        <button @click="$emit('close')" 
                                class="text-cyan-400 hover:text-white transition-all duration-300 hover:rotate-90">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- 图表内容区 - 纵向排列 -->
                <div class="p-4 space-y-4 overflow-hidden">
                    <!-- 钻孔数量统计 -->
                    <div class="chart-container-small">
                        <div class="chart-header">
                            <div class="chart-title-line"></div>
                            <h4 class="chart-title-small">钻孔数量统计</h4>
                        </div>
                        <div ref="holesChartRef" class="w-full h-52"></div>
                    </div>
                    
                    <!-- 航次统计 -->
                    <div class="chart-container-small">
                        <div class="chart-header">
                            <div class="chart-title-line-green"></div>
                            <h4 class="chart-title-small">航次统计</h4>
                        </div>
                        <div ref="expeditionsChartRef" class="w-full h-52"></div>
                    </div>
                    
                    <!-- 平台统计 -->
                    <div class="chart-container-small">
                        <div class="chart-header">
                            <div class="chart-title-line-purple"></div>
                            <h4 class="chart-title-small">平台统计</h4>
                        </div>
                        <div ref="platformsChartRef" class="w-full h-52"></div>
                    </div>
                </div>
            </div>
            
            <!-- 详情面板 - 从右侧滑入 -->
            <transition name="slide-left">
                <div v-if="showDetail" class="fixed top-36 bottom-8 w-[56rem] z-39 pointer-events-auto font-['Noto_Sans_SC']"
                     :style="{ right: 'calc(2rem + 28rem + 1rem)' }">
                    <div class="relative overflow-hidden h-full"
                         style="clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px)); background: linear-gradient(to right, rgba(30, 58, 138, 0.2), rgba(30, 58, 138, 0.25), rgba(30, 58, 138, 0.2)); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 2px solid rgba(251, 146, 60, 0.3); box-shadow: 0 0 40px rgba(251, 146, 60, 0.2);">
                        
                        <!-- 发光边框效果 -->
                        <div class="absolute inset-0 pointer-events-none">
                            <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-70"></div>
                            <div class="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-70"></div>
                            <div class="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-transparent via-orange-400 to-transparent opacity-70"></div>
                            <div class="absolute top-0 right-0 w-[2px] h-full bg-gradient-to-b from-transparent via-orange-400 to-transparent opacity-70"></div>
                        </div>
                        
                        <!-- 角落装饰 -->
                        <div class="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-orange-400/80"></div>
                        <div class="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-orange-400/80"></div>
                        <div class="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-orange-400/80"></div>
                        <div class="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-orange-400/80"></div>
                        
                        <!-- 标题栏 -->
                        <div class="relative flex items-center justify-between px-5 py-3 border-b border-orange-500/30"
                             style="background: rgba(251, 146, 60, 0.08);">
                            <div class="flex items-center gap-3">
                                <div class="w-1 h-6 bg-gradient-to-b from-orange-400 to-red-500 shadow-lg shadow-orange-500/50"></div>
                                <h3 class="text-lg font-bold text-white tracking-wider" style="text-shadow: 0 0 10px rgba(251, 146, 60, 0.5);">
                                    详情统计
                                </h3>
                            </div>
                        </div>
                        
                        <!-- 详情内容 - 4个图表2x2网格布局 -->
                        <div class="p-5 grid grid-cols-2 grid-rows-2 gap-4 h-[calc(100%-4rem)]">
                            <!-- 图1.5：年度平台航次统计 -->
                            <div class="chart-container-detail flex flex-col h-full">
                                <div class="chart-header">
                                    <div class="chart-title-line-orange"></div>
                                    <h4 class="chart-title-small">年度平台航次统计 (2004-2024)</h4>
                                </div>
                                <div ref="yearlyPlatformChartRef" class="flex-1 min-h-0"></div>
                            </div>
                            
                            <!-- 图1.3：IODP航次工作海域 -->
                            <div class="chart-container-detail flex flex-col h-full">
                                <div class="chart-header">
                                    <div class="chart-title-line-blue"></div>
                                    <h4 class="chart-title-small">IODP航次工作海域 (1966-2024)</h4>
                                </div>
                                <div ref="oceanDistributionChartRef" class="flex-1 min-h-0"></div>
                            </div>
                            
                            <!-- 图1.2：IODP航次主题统计 -->
                            <div class="chart-container-detail flex flex-col h-full">
                                <div class="chart-header">
                                    <div class="chart-title-line-green"></div>
                                    <h4 class="chart-title-small">IODP航次主题统计 (1966-2024)</h4>
                                </div>
                                <div ref="themeStatisticsChartRef" class="flex-1 min-h-0"></div>
                            </div>
                            
                            <!-- 图1.4：IODP平台执行航次数量对比 -->
                            <div class="chart-container-detail flex flex-col h-full">
                                <div class="chart-header">
                                    <div class="chart-title-line-purple"></div>
                                    <h4 class="chart-title-small">IODP平台执行航次数量对比 (1966-2024)</h4>
                                </div>
                                <div ref="platformComparisonChartRef" class="flex-1 min-h-0"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </transition>
        </div>
    </transition>
</template>

<script>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import * as echarts from 'echarts';

export default {
    name: 'DrillingStatisticsPanel',
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['close'],
    setup(props) {
        const holesChartRef = ref(null);
        const expeditionsChartRef = ref(null);
        const platformsChartRef = ref(null);
        
        // 详情面板图表引用
        const yearlyPlatformChartRef = ref(null);
        const oceanDistributionChartRef = ref(null);
        const themeStatisticsChartRef = ref(null);
        const platformComparisonChartRef = ref(null);
        
        let holesChart = null;
        let expeditionsChart = null;
        let platformsChart = null;
        
        // 详情面板图表实例
        let yearlyPlatformChart = null;
        let oceanDistributionChart = null;
        let themeStatisticsChart = null;
        let platformComparisonChart = null;
        
        // 详情面板显示状态
        const showDetail = ref(false);
        
        // 真实数据统计 - 从ZuanKong.geojson获取
        const statisticsData = ref({
            holes: { stages: [], data: [] },
            expeditions: { stages: [], data: [] },
            platforms: { stages: [], platforms: {} }
        });
        
        // 加载并统计真实数据
        const loadRealData = async () => {
            try {
                const response = await fetch('/data/ZuanKong.geojson');
                const geojsonData = await response.json();
                const features = geojsonData.features;
                
                // 统计不同阶段的钻孔数量（基于SSJD字段）
                const holesByStage = {};
                features.forEach(feature => {
                    const stage = feature.properties.SSJD;
                    if (stage) {
                        holesByStage[stage] = (holesByStage[stage] || 0) + 1;
                    }
                });
                
                // 统计不同阶段的航次数量（基于SSJD和HangCi字段）
                const expeditionsByStage = {};
                const uniqueExpeditions = new Set();
                features.forEach(feature => {
                    const stage = feature.properties.SSJD;
                    const expedition = feature.properties.HangCi;
                    if (stage && expedition) {
                        const key = `${stage}-${expedition}`;
                        if (!uniqueExpeditions.has(key)) {
                            uniqueExpeditions.add(key);
                            expeditionsByStage[stage] = (expeditionsByStage[stage] || 0) + 1;
                        }
                    }
                });
                
                // 统计不同阶段不同平台的钻孔数量（基于SSJD和ZTPT字段）
                const platformsByStage = {};
                const allPlatforms = new Set();
                features.forEach(feature => {
                    const stage = feature.properties.SSJD;
                    const platform = feature.properties.ZTPT;
                    if (stage && platform) {
                        allPlatforms.add(platform);
                        if (!platformsByStage[stage]) {
                            platformsByStage[stage] = {};
                        }
                        platformsByStage[stage][platform] = (platformsByStage[stage][platform] || 0) + 1;
                    }
                });
                
                // 整理数据格式
                const stages = ['DSDP', 'ODP', 'IODP(1)', 'IODP(2)'];
                const stageLabels = ['DSDP', 'ODP', 'IODP', 'IODP2'];
                
                // 钻孔数量数据
                statisticsData.value.holes = {
                    stages: stageLabels,
                    data: stages.map(stage => holesByStage[stage] || 0)
                };
                
                // 航次数据
                statisticsData.value.expeditions = {
                    stages: stageLabels,
                    data: stages.map(stage => expeditionsByStage[stage] || 0)
                };
                
                // 平台数据
                const platformsData = {};
                Array.from(allPlatforms).forEach(platform => {
                    platformsData[platform] = stages.map(stage => 
                        platformsByStage[stage] ? (platformsByStage[stage][platform] || 0) : 0
                    );
                });
                
                statisticsData.value.platforms = {
                    stages: stageLabels,
                    platforms: platformsData
                };
                
                console.log('钻探统计数据已加载:', statisticsData.value);
                
            } catch (error) {
                console.error('加载钻探数据失败:', error);
                // 使用默认数据
                statisticsData.value = {
                    holes: {
                        stages: ['DSDP', 'ODP', 'IODP', 'IODP2'],
                        data: [624, 652, 389, 156]
                    },
                    expeditions: {
                        stages: ['DSDP', 'ODP', 'IODP', 'IODP2'],
                        data: [96, 110, 89, 45]
                    },
                    platforms: {
                        stages: ['DSDP', 'ODP', 'IODP', 'IODP2'],
                        platforms: {
                            '挑战者号': [624, 0, 0, 0],
                            '决心号': [0, 652, 289, 0],
                            '地球号': [0, 0, 100, 56],
                            '特殊任务平台': [0, 0, 0, 100]
                        }
                    }
                };
            }
        };
        
        // 钻孔数量统计图表
        const createHolesChart = () => {
            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow'
                    },
                    backgroundColor: 'rgba(0, 20, 40, 0.95)',
                    borderColor: '#06b6d4',
                    borderWidth: 1,
                    textStyle: {
                        color: '#fff',
                        fontSize: 12
                    }
                },
                grid: {
                    left: '12%',
                    right: '8%',
                    top: '8%',
                    bottom: '20%'
                },
                xAxis: {
                    type: 'category',
                    data: statisticsData.value.holes.stages,
                    axisLine: {
                        lineStyle: {
                            color: '#334155',
                            width: 1
                        }
                    },
                    axisLabel: {
                        color: '#ffffff',
                        fontSize: 12,
                        fontWeight: 600,
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    axisTick: {
                        show: false
                    }
                },
                yAxis: {
                    type: 'value',
                    axisLine: {
                        show: false
                    },
                    axisLabel: {
                        color: '#ffffff',
                        fontSize: 11,
                        fontWeight: 600,
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    splitLine: {
                        lineStyle: {
                            color: '#1e293b',
                            type: 'dashed',
                            width: 1
                        }
                    }
                },
                series: [{
                    name: '钻孔数量',
                    type: 'bar',
                    data: statisticsData.value.holes.data,
                    barWidth: '50%',
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: '#22d3ee' },
                            { offset: 0.5, color: '#06b6d4' },
                            { offset: 1, color: '#0891b2' }
                        ]),
                        borderRadius: [3, 3, 0, 0],
                        shadowBlur: 8,
                        shadowColor: 'rgba(6, 182, 212, 0.3)',
                        shadowOffsetY: 3
                    },
                    label: {
                        show: true,
                        position: 'top',
                        color: '#ffffff',
                        fontSize: 12,
                        fontWeight: 'bold',
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    }
                }]
            };
            return option;
        };
        
        // 航次统计图表
        const createExpeditionsChart = () => {
            // 使用青色系渐变色，与整体风格协调
            const colors = [
                ['#22d3ee', '#06b6d4'],  // 亮青色 - DSDP
                ['#0ea5e9', '#0284c7'],  // 蓝色 - ODP
                ['#8b5cf6', '#7c3aed'],  // 紫色 - IODP
                ['#ec4899', '#db2777']   // 粉色 - IODP2
            ];
            
            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'item',
                    backgroundColor: 'rgba(0, 20, 40, 0.95)',
                    borderColor: '#06b6d4',
                    borderWidth: 1,
                    textStyle: {
                        color: '#fff',
                        fontSize: 12
                    },
                    formatter: '{b}<br/>{c} 次 ({d}%)'
                },
                legend: {
                    orient: 'horizontal',
                    bottom: '5%',
                    left: 'center',
                    textStyle: {
                        color: '#ffffff',
                        fontSize: 11,
                        fontWeight: 600,
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    itemWidth: 10,
                    itemHeight: 8,
                    itemGap: 8
                },
                series: [{
                    name: '航次统计',
                    type: 'pie',
                    radius: ['30%', '65%'],
                    center: ['50%', '40%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 3,
                        borderColor: 'rgba(0, 20, 40, 0.8)',
                        borderWidth: 1,
                        shadowBlur: 8,
                        shadowColor: 'rgba(6, 182, 212, 0.3)'
                    },
                    label: {
                        show: true,
                        position: 'inside',
                        formatter: '{c}',
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 'bold',
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    labelLine: {
                        show: false
                    },
                    data: statisticsData.value.expeditions.stages.map((stage, index) => ({
                        name: stage,
                        value: statisticsData.value.expeditions.data[index],
                        itemStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
                                { offset: 0, color: colors[index][0] },
                                { offset: 1, color: colors[index][1] }
                            ]),
                            shadowBlur: 10,
                            shadowColor: `${colors[index][0]}60`
                        }
                    }))
                }]
            };
            return option;
        };
        
        // 平台统计图表
        const createPlatformsChart = () => {
            // 为不同平台定义明显区分的颜色
            const platformColors = {
                '挑战者号': ['#FF6B6B', '#E63946'],      // 红色系
                '决心号': ['#4ECDC4', '#06B6D4'],        // 青色系
                '地球号': ['#FFD93D', '#F59E0B'],        // 黄色系
                '特殊任务平台': ['#A855F7', '#7C3AED']   // 紫色系
            };
            
            const seriesData = Object.entries(statisticsData.value.platforms.platforms).map(([name, data], index) => {
                const colors = platformColors[name] || ['#A855F7', '#7C3AED'];
                return {
                    name,
                    type: 'bar',
                    stack: 'total',
                    data,
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: colors[0] },
                            { offset: 1, color: colors[1] }
                        ]),
                        shadowBlur: 6,
                        shadowColor: `${colors[0]}40`,
                        shadowOffsetY: 2
                    }
                };
            });
            
            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow'
                    },
                    backgroundColor: 'rgba(0, 20, 40, 0.95)',
                    borderColor: '#a855f7',
                    borderWidth: 1,
                    textStyle: {
                        color: '#fff',
                        fontSize: 12
                    }
                },
                legend: {
                    data: Object.keys(statisticsData.value.platforms.platforms),
                    top: '5%',
                    textStyle: {
                        color: '#ffffff',
                        fontSize: 10,
                        fontWeight: 600,
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    itemWidth: 8,
                    itemHeight: 6,
                    itemGap: 8
                },
                grid: {
                    left: '12%',
                    right: '8%',
                    top: '25%',
                    bottom: '18%'
                },
                xAxis: {
                    type: 'category',
                    data: statisticsData.value.platforms.stages,
                    axisLine: {
                        lineStyle: {
                            color: '#334155',
                            width: 1
                        }
                    },
                    axisLabel: {
                        color: '#ffffff',
                        fontSize: 11,
                        fontWeight: 600,
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    axisTick: {
                        show: false
                    }
                },
                yAxis: {
                    type: 'value',
                    axisLine: {
                        show: false
                    },
                    axisLabel: {
                        color: '#ffffff',
                        fontSize: 10,
                        fontWeight: 600,
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    splitLine: {
                        lineStyle: {
                            color: '#1e293b',
                            type: 'dashed',
                            width: 1
                        }
                    }
                },
                series: seriesData
            };
            return option;
        };
        
        // ===== 详情面板图表 =====
        
        // 图1.5：年度平台航次统计（2004-2024）
        const createYearlyPlatformChart = () => {
            const years = ['2004', '2005', '2006', '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'];
            
            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    backgroundColor: 'rgba(0, 20, 40, 0.95)',
                    borderColor: '#fb923c',
                    borderWidth: 1,
                    textStyle: { color: '#fff', fontSize: 11 }
                },
                legend: {
                    data: ['MSP', '地球号', '决心号'],
                    top: '3%',
                    textStyle: {
                        color: '#ffffff',
                        fontSize: 11,
                        fontWeight: 600
                    }
                },
                grid: {
                    left: '10%',
                    right: '5%',
                    top: '18%',
                    bottom: '20%'
                },
                xAxis: {
                    type: 'category',
                    data: years,
                    axisLine: { lineStyle: { color: '#334155' } },
                    axisLabel: {
                        color: '#ffffff',
                        fontSize: 10,
                        fontWeight: 600,
                        rotate: 45
                    }
                },
                yAxis: {
                    type: 'value',
                    max: 10,
                    axisLine: { show: false },
                    axisLabel: {
                        color: '#ffffff',
                        fontSize: 11,
                        fontWeight: 600
                    },
                    splitLine: {
                        lineStyle: {
                            color: '#1e293b',
                            type: 'dashed'
                        }
                    }
                },
                series: [
                    {
                        name: 'MSP',
                        type: 'bar',
                        stack: 'total',
                        data: [1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
                        itemStyle: {
                            color: '#94a3b8',
                            borderRadius: [0, 0, 0, 0]
                        },
                        label: {
                            show: true,
                            position: 'inside',
                            formatter: (params) => params.value > 0 ? params.value : '',
                            color: '#fff',
                            fontSize: 11,
                            fontWeight: 'bold'
                        }
                    },
                    {
                        name: '地球号',
                        type: 'bar',
                        stack: 'total',
                        data: [0, 0, 0, 3, 0, 2, 4, 0, 3, 0, 0, 0, 2, 0, 2, 0, 0, 0, 0, 0, 1],
                        itemStyle: {
                            color: '#fb923c',
                            borderRadius: [0, 0, 0, 0]
                        },
                        label: {
                            show: true,
                            position: 'inside',
                            formatter: (params) => params.value > 0 ? params.value : '',
                            color: '#fff',
                            fontSize: 11,
                            fontWeight: 'bold'
                        }
                    },
                    {
                        name: '决心号',
                        type: 'bar',
                        stack: 'total',
                        data: [3, 7, 1, 0, 5, 5, 4, 4, 4, 4, 5, 5, 4, 5, 3, 4, 2, 1, 5, 4, 3],
                        itemStyle: {
                            color: '#3b82f6',
                            borderRadius: [3, 3, 0, 0]
                        },
                        label: {
                            show: true,
                            position: 'inside',
                            formatter: (params) => params.value > 0 ? params.value : '',
                            color: '#fff',
                            fontSize: 11,
                            fontWeight: 'bold'
                        }
                    }
                ]
            };
            return option;
        };
        
        // 图1.3：IODP航次工作海域
        const createOceanDistributionChart = () => {
            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    backgroundColor: 'rgba(0, 20, 40, 0.95)',
                    borderColor: '#3b82f6',
                    borderWidth: 1,
                    textStyle: { color: '#fff', fontSize: 11 }
                },
                grid: {
                    left: '12%',
                    right: '8%',
                    top: '15%',
                    bottom: '18%'
                },
                xAxis: {
                    type: 'category',
                    data: ['太平洋', '大西洋', '印度洋', '南大洋', '北冰洋'],
                    axisLine: { lineStyle: { color: '#334155' } },
                    axisLabel: {
                        color: '#ffffff',
                        fontSize: 11,
                        fontWeight: 600
                    }
                },
                yAxis: {
                    type: 'value',
                    max: 200,
                    axisLine: { show: false },
                    axisLabel: {
                        color: '#ffffff',
                        fontSize: 11,
                        fontWeight: 600
                    },
                    splitLine: {
                        lineStyle: {
                            color: '#1e293b',
                            type: 'dashed'
                        }
                    }
                },
                series: [{
                    name: '航次数量',
                    type: 'bar',
                    data: [152, 115, 28, 9, 2],
                    barWidth: '50%',
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: '#60a5fa' },
                            { offset: 1, color: '#2563eb' }
                        ]),
                        borderRadius: [3, 3, 0, 0]
                    },
                    label: {
                        show: true,
                        position: 'top',
                        color: '#ffffff',
                        fontSize: 13,
                        fontWeight: 'bold'
                    }
                }]
            };
            return option;
        };
        
        // 图1.2：IODP航次主题统计
        const createThemeStatisticsChart = () => {
            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    backgroundColor: 'rgba(0, 20, 40, 0.95)',
                    borderColor: '#10b981',
                    borderWidth: 1,
                    textStyle: { color: '#fff', fontSize: 11 }
                },
                grid: {
                    left: '30%',
                    right: '8%',
                    top: '5%',
                    bottom: '5%'
                },
                xAxis: {
                    type: 'value',
                    max: 160,
                    axisLine: { show: false },
                    axisLabel: {
                        color: '#ffffff',
                        fontSize: 11,
                        fontWeight: 600
                    },
                    splitLine: {
                        lineStyle: {
                            color: '#1e293b',
                            type: 'dashed'
                        }
                    }
                },
                yAxis: {
                    type: 'category',
                    data: [
                        '水文地质',
                        '海洋生物圈',
                        '岩浆作用及热点',
                        '地质灾害（地震、海底滑坡等）',
                        '工程技术',
                        '海洋矿产资源',
                        '全球海平面与气候',
                        '沉积与地层',
                        '古气候、古环境与古海洋学',
                        '构造（板块构造及洋壳结构等）'
                    ],
                    axisLine: { lineStyle: { color: '#334155' } },
                    axisLabel: {
                        color: '#ffffff',
                        fontSize: 11,
                        fontWeight: 600
                    }
                },
                series: [{
                    name: '航次数量',
                    type: 'bar',
                    data: [4, 7, 11, 9, 12, 14, 12, 26, 71, 140],
                    barWidth: '60%',
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                            { offset: 0, color: '#10b981' },
                            { offset: 1, color: '#059669' }
                        ]),
                        borderRadius: [0, 3, 3, 0]
                    },
                    label: {
                        show: true,
                        position: 'right',
                        color: '#ffffff',
                        fontSize: 12,
                        fontWeight: 'bold'
                    }
                }]
            };
            return option;
        };
        
        // 图1.4：IODP平台执行航次数量对比
        const createPlatformComparisonChart = () => {
            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    backgroundColor: 'rgba(0, 20, 40, 0.95)',
                    borderColor: '#a855f7',
                    borderWidth: 1,
                    textStyle: { color: '#fff', fontSize: 11 }
                },
                grid: {
                    left: '18%',
                    right: '8%',
                    top: '15%',
                    bottom: '18%'
                },
                xAxis: {
                    type: 'category',
                    data: ['"决心"号', '"挑战者"号', '"地球"号', '特定任务平台（MSP）'],
                    axisLine: { lineStyle: { color: '#334155' } },
                    axisLabel: {
                        color: '#ffffff',
                        fontSize: 10,
                        fontWeight: 600
                    }
                },
                yAxis: {
                    type: 'value',
                    max: 200,
                    axisLine: { show: false },
                    axisLabel: {
                        color: '#ffffff',
                        fontSize: 11,
                        fontWeight: 600
                    },
                    splitLine: {
                        lineStyle: {
                            color: '#1e293b',
                            type: 'dashed'
                        }
                    }
                },
                series: [{
                    name: '执行航次数',
                    type: 'bar',
                    data: [182, 96, 18, 10],
                    barWidth: '50%',
                    itemStyle: {
                        color: (params) => {
                            const colors = ['#dc2626', '#16a34a', '#3b82f6', '#eab308'];
                            return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: colors[params.dataIndex] },
                                { offset: 1, color: colors[params.dataIndex] + 'cc' }
                            ]);
                        },
                        borderRadius: [3, 3, 0, 0]
                    },
                    label: {
                        show: true,
                        position: 'top',
                        color: '#ffffff',
                        fontSize: 13,
                        fontWeight: 'bold'
                    }
                }]
            };
            return option;
        };
        
        // 初始化所有图表
        const initCharts = () => {
            // 初始化钻孔数量图表
            if (holesChartRef.value) {
                if (holesChart) holesChart.dispose();
                holesChart = echarts.init(holesChartRef.value);
                holesChart.setOption(createHolesChart());
            }
            
            // 初始化航次统计图表
            if (expeditionsChartRef.value) {
                if (expeditionsChart) expeditionsChart.dispose();
                expeditionsChart = echarts.init(expeditionsChartRef.value);
                expeditionsChart.setOption(createExpeditionsChart());
            }
            
            // 初始化平台统计图表
            if (platformsChartRef.value) {
                if (platformsChart) platformsChart.dispose();
                platformsChart = echarts.init(platformsChartRef.value);
                platformsChart.setOption(createPlatformsChart());
            }
            
            window.addEventListener('resize', handleResize);
        };
        
        // 初始化详情面板图表
        const initDetailCharts = () => {
            if (!showDetail.value) return;
            
            setTimeout(() => {
                // 图1.5：年度平台航次统计
                if (yearlyPlatformChartRef.value) {
                    if (yearlyPlatformChart) yearlyPlatformChart.dispose();
                    yearlyPlatformChart = echarts.init(yearlyPlatformChartRef.value);
                    yearlyPlatformChart.setOption(createYearlyPlatformChart());
                }
                
                // 图1.3：IODP航次工作海域
                if (oceanDistributionChartRef.value) {
                    if (oceanDistributionChart) oceanDistributionChart.dispose();
                    oceanDistributionChart = echarts.init(oceanDistributionChartRef.value);
                    oceanDistributionChart.setOption(createOceanDistributionChart());
                }
                
                // 图1.2：IODP航次主题统计
                if (themeStatisticsChartRef.value) {
                    if (themeStatisticsChart) themeStatisticsChart.dispose();
                    themeStatisticsChart = echarts.init(themeStatisticsChartRef.value);
                    themeStatisticsChart.setOption(createThemeStatisticsChart());
                }
                
                // 图1.4：IODP平台执行航次数量对比
                if (platformComparisonChartRef.value) {
                    if (platformComparisonChart) platformComparisonChart.dispose();
                    platformComparisonChart = echarts.init(platformComparisonChartRef.value);
                    platformComparisonChart.setOption(createPlatformComparisonChart());
                }
            }, 100);
        };
        
        const handleResize = () => {
            if (holesChart) holesChart.resize();
            if (expeditionsChart) expeditionsChart.resize();
            if (platformsChart) platformsChart.resize();
            
            // 详情面板图表
            if (yearlyPlatformChart) yearlyPlatformChart.resize();
            if (oceanDistributionChart) oceanDistributionChart.resize();
            if (themeStatisticsChart) themeStatisticsChart.resize();
            if (platformComparisonChart) platformComparisonChart.resize();
        };
        
        // 监听详情面板显示状态
        watch(() => showDetail.value, (newVal) => {
            if (newVal) {
                initDetailCharts();
            }
        });
        
        watch(() => props.show, (newVal) => {
            if (newVal) {
                loadRealData().then(() => {
                    setTimeout(() => {
                        initCharts();
                    }, 100);
                });
            }
        });
        
        onMounted(() => {
            if (props.show) {
                loadRealData().then(() => {
                    initCharts();
                });
            }
        });
        
        onUnmounted(() => {
            window.removeEventListener('resize', handleResize);
            if (holesChart) holesChart.dispose();
            if (expeditionsChart) expeditionsChart.dispose();
            if (platformsChart) platformsChart.dispose();
            
            // 清理详情面板图表
            if (yearlyPlatformChart) yearlyPlatformChart.dispose();
            if (oceanDistributionChart) oceanDistributionChart.dispose();
            if (themeStatisticsChart) themeStatisticsChart.dispose();
            if (platformComparisonChart) platformComparisonChart.dispose();
        });
        
        return {
            holesChartRef,
            expeditionsChartRef,
            platformsChartRef,
            showDetail,
            // 详情面板图表引用
            yearlyPlatformChartRef,
            oceanDistributionChartRef,
            themeStatisticsChartRef,
            platformComparisonChartRef
        };
    }
};
</script>

<style scoped>
/* 滑入动画 */
.slide-right-enter-active,
.slide-right-leave-active {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-right-enter-from {
    opacity: 0;
    transform: translateX(100%);
}

.slide-right-leave-to {
    opacity: 0;
    transform: translateX(100%);
}

/* 详情面板滑入动画 */
.slide-left-enter-active,
.slide-left-leave-active {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-left-enter-from {
    opacity: 0;
    transform: translateX(100%);
}

.slide-left-leave-to {
    opacity: 0;
    transform: translateX(100%);
}

/* 图表容器 */
.chart-container {
    position: relative;
    background: transparent;
    padding: 12px;
    clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
    border: 1px solid rgba(6, 182, 212, 0.4);
    box-shadow: 0 0 20px rgba(6, 182, 212, 0.15);
    transition: all 0.3s ease;
}

/* 小尺寸图表容器 - 适用于纵向排列 */
.chart-container-small {
    position: relative;
    background: transparent;
    padding: 12px;
    clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
    border: 1px solid rgba(6, 182, 212, 0.4);
    box-shadow: 0 0 15px rgba(6, 182, 212, 0.15);
    transition: all 0.3s ease;
}

/* 详情面板图表容器 */
.chart-container-detail {
    position: relative;
    background: transparent;
    padding: 10px;
    clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
    border: 1px solid rgba(251, 146, 60, 0.4);
    box-shadow: 0 0 15px rgba(251, 146, 60, 0.15);
    transition: all 0.3s ease;
}

.chart-container:hover,
.chart-container-small:hover {
    border-color: rgba(6, 182, 212, 0.6);
    box-shadow: 0 0 30px rgba(6, 182, 212, 0.3);
}

.chart-container-detail:hover {
    border-color: rgba(251, 146, 60, 0.6);
    box-shadow: 0 0 30px rgba(251, 146, 60, 0.3);
}

/* 图表标题区域 */
.chart-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
}

.chart-title-line {
    width: 3px;
    height: 16px;
    background: linear-gradient(180deg, #06b6d4 0%, #0891b2 100%);
    box-shadow: 0 0 8px rgba(6, 182, 212, 0.6);
}

.chart-title-line-green {
    width: 3px;
    height: 16px;
    background: linear-gradient(180deg, #10b981 0%, #059669 100%);
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
}

.chart-title-line-purple {
    width: 3px;
    height: 16px;
    background: linear-gradient(180deg, #a855f7 0%, #9333ea 100%);
    box-shadow: 0 0 8px rgba(168, 85, 247, 0.6);
}

.chart-title-line-orange {
    width: 3px;
    height: 16px;
    background: linear-gradient(180deg, #fb923c 0%, #f97316 100%);
    box-shadow: 0 0 8px rgba(251, 146, 60, 0.6);
}

.chart-title-line-blue {
    width: 3px;
    height: 16px;
    background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
}

.chart-title {
    font-size: 14px;
    font-weight: 700;
    color: #f1f5f9;
    letter-spacing: 0.5px;
    text-shadow: 
        0 0 10px rgba(34, 211, 238, 0.6),
        1px 1px 3px rgba(0, 0, 0, 0.9);
}

.chart-title-small {
    font-size: 12px;
    font-weight: 700;
    color: #f1f5f9;
    letter-spacing: 0.5px;
    text-shadow: 
        0 0 10px rgba(34, 211, 238, 0.6),
        1px 1px 3px rgba(0, 0, 0, 0.9);
}

/* 角落装饰动画 */
@keyframes corner-glow {
    0%, 100% {
        opacity: 0.8;
        box-shadow: 0 0 5px rgba(6, 182, 212, 0.5);
    }
    50% {
        opacity: 1;
        box-shadow: 0 0 15px rgba(6, 182, 212, 0.8);
    }
}

.chart-container::before,
.chart-container::after,
.chart-container-small::before,
.chart-container-small::after {
    content: '';
    position: absolute;
    width: 8px;
    height: 8px;
    border: 1px solid #06b6d4;
    animation: corner-glow 2s ease-in-out infinite;
}

.chart-container::before,
.chart-container-small::before {
    top: -1px;
    left: -1px;
    border-right: none;
    border-bottom: none;
}

.chart-container::after,
.chart-container-small::after {
    bottom: -1px;
    right: -1px;
    border-left: none;
    border-top: none;
}
</style>
