<template>
    <div class="fixed top-32 right-8 z-30 w-[560px] pointer-events-auto font-['Noto_Sans_SC']">
        <!-- 主容器 - 科技感边框 -->
        <div class="relative overflow-hidden"
             style="clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px)); background: linear-gradient(to right, rgba(30, 58, 138, 0.2), rgba(30, 58, 138, 0.25), rgba(30, 58, 138, 0.2)); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 2px solid rgba(59, 130, 246, 0.3); box-shadow: 0 0 40px rgba(59, 130, 246, 0.2);">
            
            <!-- 发光边框效果 -->
            <div class="absolute inset-0 pointer-events-none">
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-70"></div>
                <div class="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-70"></div>
                <div class="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-transparent via-blue-400 to-transparent opacity-70"></div>
                <div class="absolute top-0 right-0 w-[2px] h-full bg-gradient-to-b from-transparent via-blue-400 to-transparent opacity-70"></div>
            </div>
            
            <!-- 角落装饰 -->
            <div class="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-blue-400/80"></div>
            <div class="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-blue-400/80"></div>
            <div class="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-blue-400/80"></div>
            <div class="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-blue-400/80"></div>
            
            <!-- 标题栏 -->
            <div class="relative flex items-center justify-between px-5 py-3 border-b border-blue-500/30"
                 style="background: rgba(59, 130, 246, 0.08);">
                <div class="flex items-center gap-3">
                    <div class="w-1 h-6 bg-gradient-to-b from-blue-400 to-blue-600 shadow-lg shadow-blue-500/50"></div>
                    <h3 class="text-lg font-bold text-white tracking-wider" style="text-shadow: 0 0 10px rgba(59, 130, 246, 0.5);">
                        主要航线统计
                    </h3>
                </div>
                <button @click="$emit('close')" 
                        class="text-blue-400 hover:text-white transition-all duration-300 hover:rotate-90">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <!-- 统计卡片区域 -->
            <div class="p-4 grid grid-cols-2 gap-3">
                <!-- 总航线数 -->
                <div class="stat-card">
                    <div class="stat-label">总航线数</div>
                    <div class="stat-value">{{ statistics?.totalCount || 0 }}</div>
                    <div class="stat-unit">条</div>
                </div>
                
                <!-- 总长度 -->
                <div class="stat-card">
                    <div class="stat-label">总长度</div>
                    <div class="stat-value">{{ formatNumber(statistics?.totalLength || 0) }}</div>
                    <div class="stat-unit">km</div>
                </div>
                
                <!-- 平均长度 -->
                <div class="stat-card">
                    <div class="stat-label">平均长度</div>
                    <div class="stat-value">{{ formatNumber(statistics?.avgLength || 0) }}</div>
                    <div class="stat-unit">km</div>
                </div>
                
                <!-- 最长航线 -->
                <div class="stat-card">
                    <div class="stat-label">最长航线</div>
                    <div class="stat-value text-green-400 text-base">{{ statistics?.longestRoute?.name || '-' }}</div>
                    <div class="stat-unit">{{ formatNumber(statistics?.longestRoute?.length || 0) }} km</div>
                </div>
            </div>

            <!-- 图表内容区 -->
            <div class="p-4 space-y-4 overflow-hidden">
                <!-- 第一行：饼图和柱状图 -->
                <div class="grid grid-cols-2 gap-4">
                    <!-- 区域分布 -->
                    <div class="chart-container">
                        <div class="chart-header">
                            <div class="chart-title-line"></div>
                            <h4 class="chart-title">区域分布</h4>
                        </div>
                        <div ref="pieChart" class="w-full h-56"></div>
                    </div>

                    <!-- 流量等级分布 -->
                    <div class="chart-container">
                        <div class="chart-header">
                            <div class="chart-title-line"></div>
                            <h4 class="chart-title">流量等级分布</h4>
                        </div>
                        <div ref="barChart" class="w-full h-56"></div>
                    </div>
                </div>

                <!-- 第二行：长度分布 -->
                <div class="chart-container">
                    <div class="chart-header">
                        <div class="chart-title-line"></div>
                        <h4 class="chart-title">航线长度分布</h4>
                    </div>
                    <div ref="lengthChart" class="w-full h-48"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';

export default {
    name: 'RouteStatisticsPanel',
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
        const lengthChart = ref(null);
        
        let pieChartInstance = null;
        let barChartInstance = null;
        let lengthChartInstance = null;

        // 格式化数字
        const formatNumber = (num) => {
            return Math.round(num).toLocaleString();
        };

        // 初始化饼图 - 区域分布
        const initPieChart = () => {
            if (!pieChart.value || !props.statistics) return;
            
            pieChartInstance = echarts.init(pieChart.value);
            
            const regionData = props.statistics.regionDistribution || {};
            const data = Object.entries(regionData).map(([name, value]) => ({
                name,
                value
            }));
            
            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'item',
                    backgroundColor: 'rgba(0, 20, 40, 0.95)',
                    borderColor: '#3b82f6',
                    borderWidth: 1,
                    textStyle: { color: '#fff', fontSize: 11 },
                    formatter: '{b}<br/>数量: {c} 条 ({d}%)'
                },
                legend: {
                    orient: 'horizontal',
                    bottom: 5,
                    left: 'center',
                    textStyle: { 
                        color: '#ffffff', 
                        fontSize: 10,
                        fontWeight: 600
                    },
                    itemWidth: 10,
                    itemHeight: 10,
                    itemGap: 8
                },
                series: [
                    {
                        name: '区域',
                        type: 'pie',
                        radius: ['35%', '65%'],
                        center: ['50%', '40%'],
                        data: data,
                        itemStyle: {
                            borderRadius: 3,
                            borderColor: 'rgba(0, 20, 40, 0.8)',
                            borderWidth: 2
                        },
                        label: {
                            show: true,
                            position: 'outside',
                            fontSize: 11,
                            fontWeight: 'bold',
                            color: '#ffffff',
                            formatter: '{d}%'
                        },
                        emphasis: {
                            label: {
                                show: true,
                                fontSize: 12,
                                fontWeight: 'bold'
                            }
                        }
                    }
                ]
            };
            pieChartInstance.setOption(option);
        };

        // 初始化柱状图 - 流量等级分布
        const initBarChart = () => {
            if (!barChart.value || !props.statistics) return;
            
            barChartInstance = echarts.init(barChart.value);
            
            const trafficData = props.statistics.trafficLevelDistribution || {};
            const levels = ['高', '中', '低', '极低'];
            const values = levels.map(level => trafficData[level] || 0);
            const colors = ['#4ade80', '#facc15', '#fb923c', '#ef4444'];
            
            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(0, 20, 40, 0.95)',
                    borderColor: '#3b82f6',
                    borderWidth: 1,
                    textStyle: { color: '#fff', fontSize: 11 },
                    formatter: '{b}<br/>数量: {c} 条'
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
                    data: levels,
                    axisLine: { lineStyle: { color: '#3b82f6' } },
                    axisLabel: { 
                        color: '#ffffff',
                        fontSize: 10
                    }
                },
                yAxis: {
                    type: 'value',
                    name: '数量(条)',
                    nameTextStyle: { color: '#ffffff', fontSize: 10 },
                    axisLine: { lineStyle: { color: '#3b82f6' } },
                    axisLabel: { color: '#ffffff', fontSize: 10 },
                    splitLine: { lineStyle: { color: '#3b82f6', opacity: 0.2 } }
                },
                series: [
                    {
                        name: '航线数量',
                        type: 'bar',
                        data: values.map((value, index) => ({
                            value,
                            itemStyle: { color: colors[index] }
                        })),
                        barWidth: '50%',
                        label: {
                            show: true,
                            position: 'top',
                            color: '#ffffff',
                            fontSize: 11,
                            fontWeight: 'bold',
                            formatter: '{c}'
                        }
                    }
                ]
            };
            barChartInstance.setOption(option);
        };

        // 初始化长度分布图
        const initLengthChart = () => {
            if (!lengthChart.value || !props.statistics) return;
            
            lengthChartInstance = echarts.init(lengthChart.value);
            
            const routes = props.statistics.routes || [];
            const names = routes.slice(0, 10).map(r => r.name.length > 15 ? r.name.substring(0, 15) + '...' : r.name);
            const lengths = routes.slice(0, 10).map(r => r.length);
            
            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(0, 20, 40, 0.95)',
                    borderColor: '#3b82f6',
                    borderWidth: 1,
                    textStyle: { color: '#fff', fontSize: 11 },
                    formatter: '{b}<br/>长度: {c} km'
                },
                grid: {
                    left: '5%',
                    right: '5%',
                    bottom: '5%',
                    top: '10%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    data: names,
                    axisLine: { lineStyle: { color: '#3b82f6' } },
                    axisLabel: { 
                        color: '#ffffff',
                        fontSize: 9,
                        interval: 0,
                        rotate: 30
                    }
                },
                yAxis: {
                    type: 'value',
                    name: '长度(km)',
                    nameTextStyle: { color: '#ffffff', fontSize: 10 },
                    axisLine: { lineStyle: { color: '#3b82f6' } },
                    axisLabel: { color: '#ffffff', fontSize: 10 },
                    splitLine: { lineStyle: { color: '#3b82f6', opacity: 0.2 } }
                },
                series: [
                    {
                        name: '长度',
                        type: 'bar',
                        data: lengths,
                        barWidth: '60%',
                        itemStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: '#60a5fa' },
                                { offset: 1, color: '#3b82f6' }
                            ])
                        },
                        label: {
                            show: true,
                            position: 'top',
                            color: '#ffffff',
                            fontSize: 10,
                            fontWeight: 'bold',
                            formatter: (params) => formatNumber(params.value)
                        }
                    }
                ]
            };
            lengthChartInstance.setOption(option);
        };

        // 窗口大小改变时重新调整图表
        const handleResize = () => {
            pieChartInstance?.resize();
            barChartInstance?.resize();
            lengthChartInstance?.resize();
        };

        // 监听统计数据变化
        watch(() => props.statistics, () => {
            if (props.statistics) {
                initPieChart();
                initBarChart();
                initLengthChart();
            }
        }, { deep: true });

        onMounted(() => {
            if (props.statistics) {
                initPieChart();
                initBarChart();
                initLengthChart();
            }
            window.addEventListener('resize', handleResize);
        });

        onUnmounted(() => {
            pieChartInstance?.dispose();
            barChartInstance?.dispose();
            lengthChartInstance?.dispose();
            window.removeEventListener('resize', handleResize);
        });

        return {
            pieChart,
            barChart,
            lengthChart,
            formatNumber
        };
    }
};
</script>

<style scoped>
/* 统计卡片 */
.stat-card {
    position: relative;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(96, 165, 250, 0.1));
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 8px;
    padding: 12px;
    text-align: center;
    transition: all 0.3s ease;
}

.stat-card:hover {
    border-color: rgba(59, 130, 246, 0.6);
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
    transform: translateY(-2px);
}

.stat-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 8px;
}

.stat-value {
    font-size: 28px;
    font-weight: bold;
    color: #60a5fa;
    font-family: 'Rajdhani', sans-serif;
    text-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
}

.stat-unit {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    margin-top: 4px;
}

/* 图表容器 */
.chart-container {
    position: relative;
    background: transparent;
    padding: 12px;
    clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
    border: 1px solid rgba(59, 130, 246, 0.4);
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.15);
    transition: all 0.3s ease;
}

.chart-container:hover {
    border-color: rgba(59, 130, 246, 0.6);
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
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
    background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
}

.chart-title {
    font-size: 13px;
    font-weight: 700;
    color: #f1f5f9;
    letter-spacing: 0.5px;
    text-shadow: 0 0 10px rgba(96, 165, 250, 0.6);
}
</style>
