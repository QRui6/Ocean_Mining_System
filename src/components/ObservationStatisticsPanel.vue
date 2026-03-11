<template>
    <div class="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 w-[900px] pointer-events-auto font-['Noto_Sans_SC']">
        <!-- 主容器 - 科技感边框 -->
        <div class="relative overflow-hidden"
             style="clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px)); background: linear-gradient(to right, rgba(30, 58, 138, 0.85), rgba(30, 58, 138, 0.9), rgba(30, 58, 138, 0.85)); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 2px solid rgba(147, 51, 234, 0.3); box-shadow: 0 0 40px rgba(147, 51, 234, 0.2);">
            
            <!-- 发光边框效果 -->
            <div class="absolute inset-0 pointer-events-none">
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-70"></div>
                <div class="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-70"></div>
                <div class="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-transparent via-purple-400 to-transparent opacity-70"></div>
                <div class="absolute top-0 right-0 w-[2px] h-full bg-gradient-to-b from-transparent via-purple-400 to-transparent opacity-70"></div>
            </div>
            
            <!-- 角落装饰 -->
            <div class="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-purple-400/80"></div>
            <div class="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-purple-400/80"></div>
            <div class="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-purple-400/80"></div>
            <div class="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-purple-400/80"></div>
            
            <!-- 标题栏 -->
            <div class="relative flex items-center justify-between px-5 py-3 border-b border-purple-500/30"
                 style="background: rgba(147, 51, 234, 0.08);">
                <div class="flex items-center gap-3">
                    <div class="w-1 h-6 bg-gradient-to-b from-purple-400 to-purple-600 shadow-lg shadow-purple-500/50"></div>
                    <h3 class="text-lg font-bold text-white tracking-wider" style="text-shadow: 0 0 10px rgba(147, 51, 234, 0.5);">
                        海底观测网统计
                    </h3>
                </div>
                <button @click="$emit('close')" 
                        class="text-purple-400 hover:text-white transition-all duration-300 hover:rotate-90">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <!-- 统计卡片区域 -->
            <div class="p-4 grid grid-cols-2 gap-3">
                <!-- 总数量 -->
                <div class="stat-card">
                    <div class="stat-label">总观测网数</div>
                    <div class="stat-value">{{ statistics?.totalCount || 0 }}</div>
                    <div class="stat-unit">个</div>
                </div>
                
                <!-- 覆盖国家 -->
                <div class="stat-card">
                    <div class="stat-label">覆盖国家/地区</div>
                    <div class="stat-value text-green-400">{{ statistics?.countryCount || 0 }}</div>
                    <div class="stat-unit">个</div>
                </div>
                
                <!-- 覆盖区域 -->
                <div class="stat-card">
                    <div class="stat-label">覆盖区域</div>
                    <div class="stat-value text-yellow-400">{{ statistics?.regionCount || 0 }}</div>
                    <div class="stat-unit">个</div>
                </div>
                
                <!-- 最多观测网国家 -->
                <div class="stat-card">
                    <div class="stat-label">最多观测网</div>
                    <div class="stat-value text-blue-400 text-xl">{{ statistics?.topCountry?.name || '-' }}</div>
                    <div class="stat-unit">{{ statistics?.topCountry?.count || 0 }} 个</div>
                </div>
            </div>

            <!-- 图表内容区 -->
            <div class="p-4 space-y-4 overflow-hidden">
                <!-- 第一行：饼图和柱状图 -->
                <div class="grid grid-cols-2 gap-4">
                    <!-- 国家分布 -->
                    <div class="chart-container">
                        <div class="chart-header">
                            <div class="chart-title-line"></div>
                            <h4 class="chart-title">国家分布</h4>
                        </div>
                        <div ref="pieChart" class="w-full h-56"></div>
                    </div>

                    <!-- 区域分布 -->
                    <div class="chart-container">
                        <div class="chart-header">
                            <div class="chart-title-line"></div>
                            <h4 class="chart-title">区域分布</h4>
                        </div>
                        <div ref="barChart" class="w-full h-56"></div>
                    </div>
                </div>

                <!-- 第二行：国家详细对比 -->
                <div class="chart-container">
                    <div class="chart-header">
                        <div class="chart-title-line"></div>
                        <h4 class="chart-title">各国观测网数量对比</h4>
                    </div>
                    <div ref="countryChart" class="w-full h-48"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';

export default {
    name: 'ObservationStatisticsPanel',
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
        const countryChart = ref(null);
        
        let pieChartInstance = null;
        let barChartInstance = null;
        let countryChartInstance = null;

        // 初始化饼图 - 国家分布
        const initPieChart = () => {
            if (!pieChart.value || !props.statistics) return;
            
            pieChartInstance = echarts.init(pieChart.value);
            
            const countryData = props.statistics.countryDistribution || {};
            const data = Object.entries(countryData).map(([name, value]) => ({
                name,
                value
            }));
            
            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'item',
                    backgroundColor: 'rgba(0, 20, 40, 0.95)',
                    borderColor: '#9333EA',
                    borderWidth: 1,
                    textStyle: { color: '#fff', fontSize: 13 },
                    formatter: '{b}<br/>数量: {c} 个 ({d}%)'
                },
                legend: {
                    orient: 'horizontal',
                    bottom: 5,
                    left: 'center',
                    textStyle: { 
                        color: '#ffffff', 
                        fontSize: 12,
                        fontWeight: 600
                    },
                    itemWidth: 12,
                    itemHeight: 12,
                    itemGap: 10
                },
                series: [
                    {
                        name: '国家',
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
                            fontSize: 13,
                            fontWeight: 'bold',
                            color: '#ffffff',
                            formatter: '{d}%'
                        },
                        emphasis: {
                            label: {
                                show: true,
                                fontSize: 14,
                                fontWeight: 'bold'
                            }
                        }
                    }
                ]
            };
            pieChartInstance.setOption(option);
        };

        // 初始化柱状图 - 区域分布
        const initBarChart = () => {
            if (!barChart.value || !props.statistics) return;
            
            barChartInstance = echarts.init(barChart.value);
            
            const regionData = props.statistics.regionDistribution || {};
            const regions = Object.keys(regionData);
            const values = Object.values(regionData);
            const colors = ['#60a5fa', '#34d399', '#fbbf24'];
            
            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(0, 20, 40, 0.95)',
                    borderColor: '#9333EA',
                    borderWidth: 1,
                    textStyle: { color: '#fff', fontSize: 13 },
                    formatter: '{b}<br/>数量: {c} 个'
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
                    data: regions,
                    axisLine: { lineStyle: { color: '#9333EA' } },
                    axisLabel: { 
                        color: '#ffffff',
                        fontSize: 12
                    }
                },
                yAxis: {
                    type: 'value',
                    name: '数量(个)',
                    nameTextStyle: { color: '#ffffff', fontSize: 12 },
                    axisLine: { lineStyle: { color: '#9333EA' } },
                    axisLabel: { color: '#ffffff', fontSize: 12 },
                    splitLine: { lineStyle: { color: '#9333EA', opacity: 0.2 } }
                },
                series: [
                    {
                        name: '观测网数量',
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
                            fontSize: 13,
                            fontWeight: 'bold',
                            formatter: '{c}'
                        }
                    }
                ]
            };
            barChartInstance.setOption(option);
        };

        // 初始化国家对比图
        const initCountryChart = () => {
            if (!countryChart.value || !props.statistics) return;
            
            countryChartInstance = echarts.init(countryChart.value);
            
            const countryData = props.statistics.countryDistribution || {};
            const countries = Object.keys(countryData);
            const values = Object.values(countryData);
            
            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(0, 20, 40, 0.95)',
                    borderColor: '#9333EA',
                    borderWidth: 1,
                    textStyle: { color: '#fff', fontSize: 13 },
                    formatter: '{b}<br/>数量: {c} 个'
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
                    data: countries,
                    axisLine: { lineStyle: { color: '#9333EA' } },
                    axisLabel: { 
                        color: '#ffffff',
                        fontSize: 12
                    }
                },
                yAxis: {
                    type: 'value',
                    name: '数量(个)',
                    nameTextStyle: { color: '#ffffff', fontSize: 12 },
                    axisLine: { lineStyle: { color: '#9333EA' } },
                    axisLabel: { color: '#ffffff', fontSize: 12 },
                    splitLine: { lineStyle: { color: '#9333EA', opacity: 0.2 } }
                },
                series: [
                    {
                        name: '数量',
                        type: 'bar',
                        data: values,
                        barWidth: '60%',
                        itemStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: '#a78bfa' },
                                { offset: 1, color: '#9333EA' }
                            ])
                        },
                        label: {
                            show: true,
                            position: 'top',
                            color: '#ffffff',
                            fontSize: 12,
                            fontWeight: 'bold',
                            formatter: '{c}'
                        }
                    }
                ]
            };
            countryChartInstance.setOption(option);
        };

        // 窗口大小改变时重新调整图表
        const handleResize = () => {
            pieChartInstance?.resize();
            barChartInstance?.resize();
            countryChartInstance?.resize();
        };

        // 监听统计数据变化
        watch(() => props.statistics, () => {
            if (props.statistics) {
                initPieChart();
                initBarChart();
                initCountryChart();
            }
        }, { deep: true });

        onMounted(() => {
            if (props.statistics) {
                initPieChart();
                initBarChart();
                initCountryChart();
            }
            window.addEventListener('resize', handleResize);
        });

        onUnmounted(() => {
            pieChartInstance?.dispose();
            barChartInstance?.dispose();
            countryChartInstance?.dispose();
            window.removeEventListener('resize', handleResize);
        });

        return {
            pieChart,
            barChart,
            countryChart
        };
    }
};
</script>

<style scoped>
/* 统计卡片 */
.stat-card {
    position: relative;
    background: linear-gradient(135deg, rgba(147, 51, 234, 0.1), rgba(168, 85, 247, 0.1));
    border: 1px solid rgba(147, 51, 234, 0.3);
    border-radius: 8px;
    padding: 12px;
    text-align: center;
    transition: all 0.3s ease;
}

.stat-card:hover {
    border-color: rgba(147, 51, 234, 0.6);
    box-shadow: 0 0 20px rgba(147, 51, 234, 0.3);
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
    color: #a78bfa;
    font-family: 'Rajdhani', sans-serif;
    text-shadow: 0 0 10px rgba(167, 139, 250, 0.5);
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
    border: 1px solid rgba(147, 51, 234, 0.4);
    box-shadow: 0 0 20px rgba(147, 51, 234, 0.15);
    transition: all 0.3s ease;
}

.chart-container:hover {
    border-color: rgba(147, 51, 234, 0.6);
    box-shadow: 0 0 30px rgba(147, 51, 234, 0.3);
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
    background: linear-gradient(180deg, #9333EA 0%, #7c3aed 100%);
    box-shadow: 0 0 8px rgba(147, 51, 234, 0.6);
}

.chart-title {
    font-size: 15px;
    font-weight: 700;
    color: #f1f5f9;
    letter-spacing: 0.5px;
    text-shadow: 0 0 10px rgba(167, 139, 250, 0.6);
}
</style>
