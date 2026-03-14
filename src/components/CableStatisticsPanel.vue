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
                        海底光缆统计
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
                <!-- 总数量 -->
                <div class="stat-card">
                    <div class="stat-label">总光缆数</div>
                    <div class="stat-value">{{ statistics?.totalCount || 0 }}</div>
                    <div class="stat-unit">条</div>
                </div>
                
                <!-- 总长度 -->
                <div class="stat-card">
                    <div class="stat-label">总长度</div>
                    <div class="stat-value">{{ formatNumber(statistics?.totalLength || 0) }}</div>
                    <div class="stat-unit">km</div>
                </div>
                
                <!-- 总容量 -->
                <div class="stat-card">
                    <div class="stat-label">总容量</div>
                    <div class="stat-value">{{ formatCapacity(statistics?.totalCapacity || 0) }}</div>
                    <div class="stat-unit">Tbps</div>
                </div>
                
                <!-- 运营中 -->
                <div class="stat-card">
                    <div class="stat-label">运营中</div>
                    <div class="stat-value text-green-400">{{ statistics?.byStatus?.active || 0 }}</div>
                    <div class="stat-unit">条</div>
                </div>
            </div>

            <!-- 图表内容区 -->
            <div class="p-4 space-y-4 overflow-hidden">
                <!-- 饼图区域 - 两个并排 -->
                <div class="grid grid-cols-2 gap-4">
                    <!-- 各国光缆数量占比 -->
                    <div class="chart-container">
                        <div class="chart-header">
                            <div class="chart-title-line"></div>
                            <h4 class="chart-title">各国光缆数量占比</h4>
                        </div>
                        <div ref="pieChart1" class="w-full h-64"></div>
                    </div>

                    <!-- 各国光缆总长度占比 -->
                    <div class="chart-container">
                        <div class="chart-header">
                            <div class="chart-title-line"></div>
                            <h4 class="chart-title">各国光缆总长度占比</h4>
                        </div>
                        <div ref="pieChart2" class="w-full h-64"></div>
                    </div>
                </div>

                <!-- 柱状图 - 各国光缆容量对比 -->
                <div class="chart-container">
                    <div class="chart-header">
                        <div class="chart-title-line"></div>
                        <h4 class="chart-title">各国光缆总容量对比</h4>
                    </div>
                    <div ref="barChart" class="w-full h-56"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';

export default {
    name: 'CableStatisticsPanel',
    props: {
        statistics: {
            type: Object,
            default: null
        }
    },
    emits: ['close'],
    setup(props) {
        const pieChart1 = ref(null);
        const pieChart2 = ref(null);
        const barChart = ref(null);
        
        let chart1Instance = null;
        let chart2Instance = null;
        let chart3Instance = null;

        // 格式化数字
        const formatNumber = (num) => {
            return num.toLocaleString();
        };

        // 格式化容量（Gbps -> Tbps）
        const formatCapacity = (gbps) => {
            return (gbps / 1000).toFixed(1);
        };

        // 初始化饼图1 - 各国光缆数量占比
        const initPieChart1 = () => {
            if (!pieChart1.value || !props.statistics) return;
            
            chart1Instance = echarts.init(pieChart1.value);
            
            // 转换数据 - 按国家统计数量
            const countryData = Object.entries(props.statistics.byCountry || {})
                .map(([country, data]) => ({
                    name: country,
                    value: data.count
                }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 10);  // 只显示前10个国家
            
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
                    formatter: '{b}<br/>数量: {c} 条 ({d}%)'
                },
                legend: {
                    orient: 'horizontal',
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
                    itemGap: 10
                },
                series: [
                    {
                        name: '光缆数量',
                        type: 'pie',
                        radius: ['30%', '60%'],
                        center: ['50%', '40%'],
                        data: countryData,
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
            chart1Instance.setOption(option);
        };

        // 初始化饼图2 - 各国光缆总长度占比
        const initPieChart2 = () => {
            if (!pieChart2.value || !props.statistics) return;
            
            chart2Instance = echarts.init(pieChart2.value);
            
            // 转换数据 - 按国家统计总长度
            const countryData = Object.entries(props.statistics.byCountry || {})
                .map(([country, data]) => ({
                    name: country,
                    value: Math.round(data.totalLength)
                }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 10);  // 只显示前10个国家
            
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
                    formatter: '{b}<br/>长度: {c} km ({d}%)'
                },
                legend: {
                    orient: 'horizontal',
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
                    itemGap: 10
                },
                series: [
                    {
                        name: '光缆长度',
                        type: 'pie',
                        radius: ['30%', '60%'],
                        center: ['50%', '40%'],
                        data: countryData,
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
            chart2Instance.setOption(option);
        };

        // 初始化柱状图 - 各国光缆总容量对比
        const initBarChart = () => {
            if (!barChart.value || !props.statistics) return;
            
            chart3Instance = echarts.init(barChart.value);
            
            // 转换数据 - 按国家统计总容量
            const sortedData = Object.entries(props.statistics.byCountry || {})
                .map(([country, data]) => ({
                    country,
                    capacity: Math.round(data.totalCapacity)
                }))
                .sort((a, b) => b.capacity - a.capacity)
                .slice(0, 10);  // 只显示前10个国家
            
            const countries = sortedData.map(d => d.country);
            const capacities = sortedData.map(d => d.capacity);
            
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
                    formatter: '{b}<br/>容量: {c} Gbps'
                },
                grid: {
                    left: '5%',
                    right: '5%',
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
                        fontSize: 12,
                        fontWeight: 600,
                        rotate: 30,
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    axisTick: { show: false }
                },
                yAxis: {
                    type: 'value',
                    name: '容量(Gbps)',
                    nameTextStyle: { 
                        color: '#ffffff', 
                        fontSize: 14,
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
                        name: '光缆容量',
                        type: 'bar',
                        data: capacities,
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
            chart3Instance.setOption(option);
        };

        // 窗口大小改变时重新调整图表
        const handleResize = () => {
            chart1Instance?.resize();
            chart2Instance?.resize();
            chart3Instance?.resize();
        };

        // 监听统计数据变化
        watch(() => props.statistics, () => {
            if (props.statistics) {
                initPieChart1();
                initPieChart2();
                initBarChart();
            }
        }, { deep: true });

        onMounted(() => {
            if (props.statistics) {
                initPieChart1();
                initPieChart2();
                initBarChart();
            }
            window.addEventListener('resize', handleResize);
        });

        onUnmounted(() => {
            chart1Instance?.dispose();
            chart2Instance?.dispose();
            chart3Instance?.dispose();
            window.removeEventListener('resize', handleResize);
        });

        return {
            pieChart1,
            pieChart2,
            barChart,
            formatNumber,
            formatCapacity
        };
    }
};
</script>

<style scoped>
/* 统计卡片 */
.stat-card {
    position: relative;
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(59, 130, 246, 0.1));
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
</style>
