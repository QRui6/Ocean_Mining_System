<template>
    <div class="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 w-[900px] pointer-events-auto font-['Noto_Sans_SC']">
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
                        主要港口统计
                    </h3>
                </div>
                <button @click="$emit('close')" 
                        class="text-cyan-400 hover:text-white transition-all duration-300 hover:rotate-90">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <!-- 统计卡片区域 -->
            <div class="p-4 grid grid-cols-2 gap-3">
                <!-- 总港口数 -->
                <div class="stat-card">
                    <div class="stat-label">总港口数</div>
                    <div class="stat-value">{{ statistics?.totalCount || 0 }}</div>
                    <div class="stat-unit">个</div>
                </div>
                
                <!-- 高重要性港口 -->
                <div class="stat-card">
                    <div class="stat-label">高重要性港口</div>
                    <div class="stat-value text-green-400">{{ statistics?.highImportanceCount || 0 }}</div>
                    <div class="stat-unit">个</div>
                </div>
                
                <!-- 覆盖国家 -->
                <div class="stat-card">
                    <div class="stat-label">覆盖国家</div>
                    <div class="stat-value">{{ statistics?.countryCount || 0 }}</div>
                    <div class="stat-unit">个</div>
                </div>
                
                <!-- 覆盖区域 -->
                <div class="stat-card">
                    <div class="stat-label">覆盖区域</div>
                    <div class="stat-value text-yellow-400">{{ statistics?.regionCount || 0 }}</div>
                    <div class="stat-unit">个</div>
                </div>
            </div>

            <!-- 图表内容区 -->
            <div class="p-4 space-y-4 overflow-hidden">
                <!-- 第一行：饼图和柱状图 -->
                <div class="grid grid-cols-2 gap-4">
                    <!-- 各国港口数量对比 -->
                    <div class="chart-container">
                        <div class="chart-header">
                            <div class="chart-title-line"></div>
                            <h4 class="chart-title">各国港口数量对比</h4>
                        </div>
                        <div ref="pieChart" class="w-full h-56"></div>
                    </div>

                    <!-- 各国高重要性港口占比 -->
                    <div class="chart-container">
                        <div class="chart-header">
                            <div class="chart-title-line"></div>
                            <h4 class="chart-title">各国高重要性港口占比</h4>
                        </div>
                        <div ref="barChart" class="w-full h-56"></div>
                    </div>
                </div>

                <!-- 第二行：类型分布 -->
                <div class="chart-container">
                    <div class="chart-header">
                        <div class="chart-title-line"></div>
                        <h4 class="chart-title">港口类型国家分布</h4>
                    </div>
                    <div ref="typeChart" class="w-full h-48"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';

export default {
    name: 'PortStatisticsPanel',
    props: {
        statistics: {
            type: Object,
            default: null
        }
    },
    emits: ['close'],
    setup(props) {
        const pieChart = ref(null);
        const barChart = ref(null);
        const typeChart = ref(null);
        
        let pieChartInstance = null;
        let barChartInstance = null;
        let typeChartInstance = null;

        // 初始化饼图 - 各国港口数量对比
        const initPieChart = () => {
            if (!pieChart.value || !props.statistics) return;
            
            pieChartInstance = echarts.init(pieChart.value);
            
            // 按国家统计港口数量
            const countryData = {};
            if (props.statistics.ports) {
                props.statistics.ports.forEach(port => {
                    const country = port.country || '未知';
                    countryData[country] = (countryData[country] || 0) + 1;
                });
            }
            
            // 转换为数组并排序，取前8个国家
            const sortedCountries = Object.entries(countryData)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8);
            
            const data = sortedCountries.map(([name, value]) => ({ name, value }));
            
            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'item',
                    backgroundColor: 'rgba(0, 20, 40, 0.95)',
                    borderColor: '#06b6d4',
                    borderWidth: 1,
                    textStyle: { 
                        color: '#fff', 
                        fontSize: 12,
                        fontWeight: 600,
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    formatter: '{b}<br/>数量: {c} 个 ({d}%)'
                },
                legend: {
                    orient: 'horizontal',
                    bottom: 5,
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
                    itemHeight: 10,
                    itemGap: 8
                },
                series: [
                    {
                        name: '港口数量',
                        type: 'pie',
                        radius: ['35%', '65%'],
                        center: ['50%', '40%'],
                        data: data,
                        itemStyle: {
                            borderRadius: 3,
                            borderColor: 'rgba(0, 20, 40, 0.8)',
                            borderWidth: 2,
                            shadowBlur: 10,
                            shadowColor: 'rgba(6, 182, 212, 0.3)'
                        },
                        label: {
                            show: true,
                            position: 'outside',
                            fontSize: 12,
                            fontWeight: 'bold',
                            color: '#ffffff',
                            formatter: '{d}%',
                            textShadowColor: 'rgba(0, 0, 0, 1)',
                            textShadowBlur: 6,
                            textShadowOffsetX: 2,
                            textShadowOffsetY: 2
                        },
                        emphasis: {
                            label: {
                                show: true,
                                fontSize: 13,
                                fontWeight: 'bold'
                            },
                            itemStyle: {
                                shadowBlur: 20,
                                shadowColor: 'rgba(6, 182, 212, 0.6)'
                            }
                        }
                    }
                ]
            };
            pieChartInstance.setOption(option);
        };

        // 初始化柱状图 - 各国高重要性港口占比
        const initBarChart = () => {
            if (!barChart.value || !props.statistics) return;
            
            barChartInstance = echarts.init(barChart.value);
            
            // 按国家统计高重要性港口数量
            const countryHighImportance = {};
            if (props.statistics.ports) {
                props.statistics.ports.forEach(port => {
                    const country = port.country || '未知';
                    if (!countryHighImportance[country]) {
                        countryHighImportance[country] = 0;
                    }
                    if (port.importance === 'high') {
                        countryHighImportance[country]++;
                    }
                });
            }
            
            // 转换为数组并排序，取前8个国家
            const sortedCountries = Object.entries(countryHighImportance)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8);
            
            const countries = sortedCountries.map(([name]) => name);
            const values = sortedCountries.map(([, value]) => value);
            
            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(0, 20, 40, 0.95)',
                    borderColor: '#06b6d4',
                    borderWidth: 1,
                    textStyle: { 
                        color: '#fff', 
                        fontSize: 12,
                        fontWeight: 600,
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    formatter: '{b}<br/>高重要性港口: {c} 个'
                },
                grid: {
                    left: '10%',
                    right: '10%',
                    bottom: '15%',
                    top: '10%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    data: countries,
                    axisLine: { lineStyle: { color: '#334155', width: 1 } },
                    axisLabel: { 
                        color: '#ffffff',
                        fontSize: 11,
                        fontWeight: 600,
                        interval: 0,
                        rotate: 15,
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    axisTick: { show: false }
                },
                yAxis: {
                    type: 'value',
                    name: '数量(个)',
                    nameTextStyle: { 
                        color: '#ffffff', 
                        fontSize: 12,
                        fontWeight: 600,
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    axisLine: { show: false },
                    axisLabel: { 
                        color: '#ffffff', 
                        fontSize: 12,
                        fontWeight: 600,
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    splitLine: { lineStyle: { color: '#1e293b', type: 'dashed', width: 1 } }
                },
                series: [
                    {
                        name: '高重要性港口',
                        type: 'bar',
                        data: values,
                        barWidth: '50%',
                        itemStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: '#22d3ee' },
                                { offset: 0.5, color: '#06b6d4' },
                                { offset: 1, color: '#0891b2' }
                            ]),
                            borderRadius: [4, 4, 0, 0],
                            shadowBlur: 10,
                            shadowColor: 'rgba(6, 182, 212, 0.3)',
                            shadowOffsetY: 5
                        },
                        emphasis: {
                            itemStyle: {
                                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                    { offset: 0, color: '#67e8f9' },
                                    { offset: 0.5, color: '#22d3ee' },
                                    { offset: 1, color: '#06b6d4' }
                                ]),
                                shadowBlur: 20,
                                shadowColor: 'rgba(6, 182, 212, 0.6)'
                            }
                        },
                        label: {
                            show: true,
                            position: 'top',
                            color: '#ffffff',
                            fontSize: 13,
                            fontWeight: 'bold',
                            formatter: '{c}',
                            textShadowColor: 'rgba(0, 0, 0, 1)',
                            textShadowBlur: 6,
                            textShadowOffsetX: 2,
                            textShadowOffsetY: 2
                        }
                    }
                ]
            };
            barChartInstance.setOption(option);
        };

        // 初始化类型分布图 - 港口类型国家分布
        const initTypeChart = () => {
            if (!typeChart.value || !props.statistics) return;
            
            typeChartInstance = echarts.init(typeChart.value);
            
            // 按国家和类型统计
            const countryTypeData = {};
            if (props.statistics.ports) {
                props.statistics.ports.forEach(port => {
                    const country = port.country || '未知';
                    if (!countryTypeData[country]) {
                        countryTypeData[country] = { historical: 0, modern: 0, strategic: 0 };
                    }
                    if (port.type === 'historical') countryTypeData[country].historical++;
                    else if (port.type === 'modern') countryTypeData[country].modern++;
                    else if (port.type === 'strategic') countryTypeData[country].strategic++;
                });
            }
            
            // 取前8个国家
            const sortedCountries = Object.entries(countryTypeData)
                .sort((a, b) => {
                    const totalA = a[1].historical + a[1].modern + a[1].strategic;
                    const totalB = b[1].historical + b[1].modern + b[1].strategic;
                    return totalB - totalA;
                })
                .slice(0, 8);
            
            const countries = sortedCountries.map(([name]) => name);
            const historicalData = sortedCountries.map(([, data]) => data.historical);
            const modernData = sortedCountries.map(([, data]) => data.modern);
            const strategicData = sortedCountries.map(([, data]) => data.strategic);
            
            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(0, 20, 40, 0.95)',
                    borderColor: '#06b6d4',
                    borderWidth: 1,
                    textStyle: { 
                        color: '#fff', 
                        fontSize: 12,
                        fontWeight: 600,
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    axisPointer: {
                        type: 'shadow',
                        shadowStyle: { color: 'rgba(6, 182, 212, 0.15)' }
                    }
                },
                legend: {
                    data: ['历史港口', '现代港口', '战略港口'],
                    bottom: 5,
                    left: 'center',
                    textStyle: { 
                        color: '#ffffff', 
                        fontSize: 12,
                        fontWeight: 600,
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    itemWidth: 12,
                    itemHeight: 12,
                    itemGap: 15
                },
                grid: {
                    left: '5%',
                    right: '5%',
                    bottom: '15%',
                    top: '5%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    data: countries,
                    axisLine: { lineStyle: { color: '#334155', width: 1 } },
                    axisLabel: { 
                        color: '#ffffff',
                        fontSize: 11,
                        fontWeight: 600,
                        interval: 0,
                        rotate: 20,
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    axisTick: { show: false }
                },
                yAxis: {
                    type: 'value',
                    name: '数量(个)',
                    nameTextStyle: { 
                        color: '#ffffff', 
                        fontSize: 12,
                        fontWeight: 600,
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    axisLine: { show: false },
                    axisLabel: { 
                        color: '#ffffff', 
                        fontSize: 12,
                        fontWeight: 600,
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    splitLine: { lineStyle: { color: '#1e293b', type: 'dashed', width: 1 } }
                },
                series: [
                    {
                        name: '历史港口',
                        type: 'bar',
                        stack: 'total',
                        data: historicalData,
                        itemStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
                                { offset: 0, color: '#FFD700' },
                                { offset: 1, color: '#CA8A04' }
                            ])
                        },
                        label: {
                            show: true,
                            position: 'inside',
                            color: '#ffffff',
                            fontSize: 12,
                            fontWeight: 'bold',
                            formatter: (params) => params.value > 0 ? params.value : '',
                            textShadowColor: 'rgba(0, 0, 0, 1)',
                            textShadowBlur: 6,
                            textShadowOffsetX: 2,
                            textShadowOffsetY: 2
                        }
                    },
                    {
                        name: '现代港口',
                        type: 'bar',
                        stack: 'total',
                        data: modernData,
                        itemStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
                                { offset: 0, color: '#4169E1' },
                                { offset: 1, color: '#1E3A8A' }
                            ])
                        },
                        label: {
                            show: true,
                            position: 'inside',
                            color: '#ffffff',
                            fontSize: 12,
                            fontWeight: 'bold',
                            formatter: (params) => params.value > 0 ? params.value : '',
                            textShadowColor: 'rgba(0, 0, 0, 1)',
                            textShadowBlur: 6,
                            textShadowOffsetX: 2,
                            textShadowOffsetY: 2
                        }
                    },
                    {
                        name: '战略港口',
                        type: 'bar',
                        stack: 'total',
                        data: strategicData,
                        itemStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
                                { offset: 0, color: '#FF8C00' },
                                { offset: 1, color: '#D97706' }
                            ])
                        },
                        label: {
                            show: true,
                            position: 'inside',
                            color: '#ffffff',
                            fontSize: 12,
                            fontWeight: 'bold',
                            formatter: (params) => params.value > 0 ? params.value : '',
                            textShadowColor: 'rgba(0, 0, 0, 1)',
                            textShadowBlur: 6,
                            textShadowOffsetX: 2,
                            textShadowOffsetY: 2
                        }
                    }
                ]
            };
            typeChartInstance.setOption(option);
        };

        // 窗口大小改变时重新调整图表
        const handleResize = () => {
            pieChartInstance?.resize();
            barChartInstance?.resize();
            typeChartInstance?.resize();
        };

        // 监听统计数据变化
        watch(() => props.statistics, () => {
            if (props.statistics) {
                initPieChart();
                initBarChart();
                initTypeChart();
            }
        }, { deep: true });

        onMounted(() => {
            if (props.statistics) {
                initPieChart();
                initBarChart();
                initTypeChart();
            }
            window.addEventListener('resize', handleResize);
        });

        onUnmounted(() => {
            pieChartInstance?.dispose();
            barChartInstance?.dispose();
            typeChartInstance?.dispose();
            window.removeEventListener('resize', handleResize);
        });

        return {
            pieChart,
            barChart,
            typeChart
        };
    }
};
</script>

<style scoped>
/* 统计卡片 */
.stat-card {
    position: relative;
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(34, 211, 238, 0.1));
    border: 1px solid rgba(6, 182, 212, 0.3);
    border-radius: 8px;
    padding: 12px;
    text-align: center;
    transition: all 0.3s ease;
}

.stat-card:hover {
    border-color: rgba(6, 182, 212, 0.6);
    box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
    transform: translateY(-2px);
}

.stat-label {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 8px;
    font-weight: 600;
}

.stat-value {
    font-size: 32px;
    font-weight: bold;
    color: #22d3ee;
    font-family: 'Rajdhani', sans-serif;
    text-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
}

.stat-unit {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 4px;
    font-weight: 500;
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

.chart-container:hover {
    border-color: rgba(6, 182, 212, 0.6);
    box-shadow: 0 0 30px rgba(6, 182, 212, 0.3);
}

/* 图表标题区域 */
.chart-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.chart-title-line {
    width: 3px;
    height: 16px;
    background: linear-gradient(180deg, #06b6d4 0%, #0891b2 100%);
    box-shadow: 0 0 8px rgba(6, 182, 212, 0.6);
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
.chart-container::after {
    content: '';
    position: absolute;
    width: 8px;
    height: 8px;
    border: 1px solid #06b6d4;
    animation: corner-glow 2s ease-in-out infinite;
}

.chart-container::before {
    top: -1px;
    left: -1px;
    border-right: none;
    border-bottom: none;
}

.chart-container::after {
    bottom: -1px;
    right: -1px;
    border-left: none;
    border-top: none;
}
</style>
