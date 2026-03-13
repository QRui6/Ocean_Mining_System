<template>
    <div class="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 w-[900px] pointer-events-auto font-['Noto_Sans_SC']">
        <!-- 主容器 - 科技感边框 -->
        <div class="relative overflow-hidden"
             style="clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px)); background: linear-gradient(to right, rgba(30, 58, 138, 0.2), rgba(30, 58, 138, 0.25), rgba(30, 58, 138, 0.2)); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 2px solid rgba(147, 51, 234, 0.3); box-shadow: 0 0 40px rgba(147, 51, 234, 0.2);">
            
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
                    <!-- 各国观测网数量占比 -->
                    <div class="chart-container">
                        <div class="chart-header">
                            <div class="chart-title-line"></div>
                            <h4 class="chart-title">各国观测网数量占比</h4>
                        </div>
                        <div ref="pieChart" class="w-full h-56"></div>
                    </div>

                    <!-- 各国观测网数量对比 -->
                    <div class="chart-container">
                        <div class="chart-header">
                            <div class="chart-title-line"></div>
                            <h4 class="chart-title">各国观测网数量对比</h4>
                        </div>
                        <div ref="barChart" class="w-full h-56"></div>
                    </div>
                </div>

                <!-- 第二行：区域分布对比 -->
                <div class="chart-container">
                    <div class="chart-header">
                        <div class="chart-title-line"></div>
                        <h4 class="chart-title">各国在不同区域的观测网分布</h4>
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

        // 初始化饼图 - 各国观测网数量占比
        const initPieChart = () => {
            if (!pieChart.value || !props.statistics) return;
            
            pieChartInstance = echarts.init(pieChart.value);
            
            const countryData = props.statistics.countryDistribution || {};
            const countryColors = {
                '美国': '#1E90FF',  // 道奇蓝
                '欧洲': '#FFD700',  // 金色
                '加拿大': '#FF0000', // 纯红
                '日本': '#FF1493',  // 深粉红
                '中国': '#00FF7F'   // 春绿色
            };
            
            const data = Object.entries(countryData).map(([name, value]) => ({
                name,
                value,
                itemStyle: { color: countryColors[name] || '#9333EA' }
            }));
            
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

        // 初始化柱状图 - 各国观测网数量对比
        const initBarChart = () => {
            if (!barChart.value || !props.statistics) return;
            
            barChartInstance = echarts.init(barChart.value);
            
            const countryData = props.statistics.countryDistribution || {};
            const countries = Object.keys(countryData);
            const values = Object.values(countryData);
            const countryColors = {
                '美国': '#1E90FF',  // 道奇蓝
                '欧洲': '#FFD700',  // 金色
                '加拿大': '#FF0000', // 纯红
                '日本': '#FF1493',  // 深粉红
                '中国': '#00FF7F'   // 春绿色
            };
            
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
                    data: countries,
                    axisLine: { lineStyle: { color: '#334155', width: 1 } },
                    axisLabel: { 
                        color: '#ffffff',
                        fontSize: 12,
                        fontWeight: 600,
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
                        fontSize: 13,
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
                        name: '观测网数量',
                        type: 'bar',
                        data: values.map((value, index) => ({
                            value,
                            itemStyle: { 
                                color: countryColors[countries[index]] || '#9333EA',
                                shadowBlur: 10,
                                shadowColor: 'rgba(6, 182, 212, 0.3)',
                                shadowOffsetY: 5
                            }
                        })),
                        barWidth: '50%',
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

        // 初始化国家区域分布对比图
        const initCountryChart = () => {
            if (!countryChart.value || !props.statistics) return;
            
            countryChartInstance = echarts.init(countryChart.value);
            
            // 按国家和区域统计
            const countryRegionData = {};
            const regions = new Set();
            
            if (props.statistics.observations) {
                props.statistics.observations.forEach(obs => {
                    const country = obs.country || '未知';
                    const region = obs.region || '未知';
                    
                    if (!countryRegionData[country]) {
                        countryRegionData[country] = {};
                    }
                    if (!countryRegionData[country][region]) {
                        countryRegionData[country][region] = 0;
                    }
                    countryRegionData[country][region]++;
                    regions.add(region);
                });
            }
            
            const countries = Object.keys(countryRegionData);
            const regionArray = Array.from(regions);
            const countryColors = {
                '美国': '#1E90FF',  // 道奇蓝
                '欧洲': '#FFD700',  // 金色
                '加拿大': '#FF0000', // 纯红
                '日本': '#FF1493',  // 深粉红
                '中国': '#00FF7F'   // 春绿色
            };
            
            // 构建系列数据
            const series = regionArray.map(region => ({
                name: region,
                type: 'bar',
                stack: 'total',
                data: countries.map(country => countryRegionData[country][region] || 0),
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
            }));
            
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
                    data: regionArray,
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
                        fontSize: 12,
                        fontWeight: 600,
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
                        fontSize: 13,
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
                series: series
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
    color: #c084fc;
    font-family: 'Rajdhani', sans-serif;
    text-shadow: 0 0 10px rgba(192, 132, 252, 0.5);
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
    font-size: 14px;
    font-weight: 700;
    color: #f1f5f9;
    letter-spacing: 0.5px;
    text-shadow: 
        0 0 10px rgba(192, 132, 252, 0.6),
        1px 1px 3px rgba(0, 0, 0, 0.9);
}

/* 角落装饰动画 */
@keyframes corner-glow {
    0%, 100% {
        opacity: 0.8;
        box-shadow: 0 0 5px rgba(147, 51, 234, 0.5);
    }
    50% {
        opacity: 1;
        box-shadow: 0 0 15px rgba(147, 51, 234, 0.8);
    }
}

.chart-container::before,
.chart-container::after {
    content: '';
    position: absolute;
    width: 8px;
    height: 8px;
    border: 1px solid #9333EA;
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
