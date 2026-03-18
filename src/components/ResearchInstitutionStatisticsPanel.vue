<template>
    <div class="fixed top-32 right-8 z-30 w-[600px] pointer-events-auto font-['Noto_Sans_SC']">
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
                        研究机构统计分析
                    </h3>
                </div>
                <button @click="$emit('close')" 
                        class="text-blue-400 hover:text-white transition-all duration-300 hover:rotate-90">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <!-- 图表内容区 -->
            <div class="p-4 space-y-4">
                <!-- 按国家统计图表 -->
                <div class="chart-container">
                    <div class="chart-header">
                        <div class="chart-title-line"></div>
                        <h4 class="chart-title">各国研究机构数量统计</h4>
                    </div>
                    <div ref="countryChart" class="w-full h-[300px]"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';

export default {
    name: 'ResearchInstitutionStatisticsPanel',
    props: {
        institutionData: {
            type: Array,
            default: () => []
        }
    },
    emits: ['close'],
    setup(props) {
        const countryChart = ref(null);
        let chartInstance = null;
        
        // 监听数据变化
        watch(() => props.institutionData, (newData) => {
            console.log('📊 ResearchInstitutionStatisticsPanel - institutionData 变化:', newData);
            console.log('📊 ResearchInstitutionStatisticsPanel - 数据长度:', newData?.length);
        }, { immediate: true });

        // 获取国家颜色
        const getCountryColor = (countryId) => {
            const colorMap = {
                'usa': '#0052B4',
                'uk': '#C8102E',
                'france': '#0055A4',
                'germany': '#FFCE00',
                'canada': '#FF0000',
                'australia': '#00008B',
                'russia': '#0039A6',
                'japan': '#BC002D'
            };
            return colorMap[countryId] || '#fb923c';
        };

        // 初始化国家统计图表
        const initCountryChart = () => {
            if (!countryChart.value) return;
            
            console.log('📊 初始化研究机构统计图表，数据:', props.institutionData);
            
            chartInstance = echarts.init(countryChart.value, null, {
                renderer: 'canvas',
                useDirtyRect: false
            });
            
            // 按国家统计
            const countryStats = {};
            props.institutionData.forEach(inst => {
                const country = inst.country;
                const countryId = inst.countryId;
                if (!countryStats[country]) {
                    countryStats[country] = {
                        count: 0,
                        countryId: countryId,
                        color: getCountryColor(countryId)
                    };
                }
                countryStats[country].count++;
            });
            
            // 转换为数组并排序
            const data = Object.entries(countryStats)
                .map(([country, stats]) => ({
                    country: country,
                    count: stats.count,
                    countryId: stats.countryId,
                    color: stats.color
                }))
                .sort((a, b) => b.count - a.count);
            
            console.log('📊 国家统计数据:', data);
            
            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow'
                    },
                    backgroundColor: 'rgba(0, 20, 40, 0.95)',
                    borderColor: '#fb923c',
                    borderWidth: 1,
                    textStyle: {
                        color: '#fff',
                        fontSize: 12
                    },
                    formatter: function(params) {
                        const param = params[0];
                        return `${param.name}<br/>机构数量: ${param.value} 个`;
                    }
                },
                grid: {
                    left: '15%',
                    right: '5%',
                    bottom: '8%',
                    top: '8%',
                    containLabel: false
                },
                xAxis: {
                    type: 'value',
                    name: '机构数量',
                    nameTextStyle: {
                        color: '#ffffff',
                        fontSize: 12,
                        fontWeight: 600,
                        padding: [0, 0, 0, 0],
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6
                    },
                    axisLine: {
                        lineStyle: {
                            color: '#334155',
                            width: 2
                        }
                    },
                    axisLabel: {
                        color: '#ffffff',
                        fontSize: 12,
                        fontWeight: 600,
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6
                    },
                    splitLine: {
                        lineStyle: {
                            color: '#1e293b',
                            type: 'dashed',
                            width: 1
                        }
                    }
                },
                yAxis: {
                    type: 'category',
                    data: data.map(d => d.country),
                    axisLine: {
                        lineStyle: {
                            color: '#334155',
                            width: 2
                        }
                    },
                    axisLabel: {
                        color: '#ffffff',
                        fontSize: 13,
                        fontWeight: 600,
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6
                    },
                    axisTick: {
                        show: false
                    }
                },
                series: [
                    {
                        name: '机构数量',
                        type: 'bar',
                        data: data.map(d => ({
                            value: d.count,
                            itemStyle: {
                                color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                                    { offset: 0, color: d.color + 'AA' },
                                    { offset: 1, color: d.color }
                                ]),
                                shadowBlur: 10,
                                shadowColor: d.color + '80',
                                shadowOffsetX: 5,
                                borderRadius: [0, 4, 4, 0]
                            }
                        })),
                        barWidth: '60%',
                        label: {
                            show: true,
                            position: 'right',
                            color: '#ffffff',
                            fontSize: 12,
                            fontWeight: 'bold',
                            formatter: '{c} 个',
                            textShadowColor: 'rgba(0, 0, 0, 1)',
                            textShadowBlur: 6
                        },
                        emphasis: {
                            itemStyle: {
                                shadowBlur: 20,
                                shadowColor: '#fb923c'
                            }
                        }
                    }
                ]
            };
            
            chartInstance.setOption(option);
            console.log('✅ 研究机构统计图表初始化完成');
        };

        // 窗口大小改变时重新调整图表
        const handleResize = () => {
            chartInstance?.resize();
        };

        onMounted(() => {
            initCountryChart();
            window.addEventListener('resize', handleResize);
        });

        onUnmounted(() => {
            chartInstance?.dispose();
            window.removeEventListener('resize', handleResize);
        });

        // 监听数据变化，重新初始化图表
        watch(() => props.institutionData, () => {
            if (chartInstance) {
                initCountryChart();
            }
        }, { deep: true });

        return {
            countryChart
        };
    }
};
</script>

<style scoped>
/* 图表容器 */
.chart-container {
    position: relative;
    background: transparent;
    padding: 12px;
    clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
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
    font-size: 14px;
    font-weight: 700;
    color: #f1f5f9;
    letter-spacing: 0.5px;
    text-shadow: 
        0 0 10px rgba(96, 165, 250, 0.6),
        1px 1px 3px rgba(0, 0, 0, 0.9);
}

/* 角落装饰动画 */
@keyframes corner-glow {
    0%, 100% {
        opacity: 0.8;
        box-shadow: 0 0 5px rgba(59, 130, 246, 0.5);
    }
    50% {
        opacity: 1;
        box-shadow: 0 0 15px rgba(59, 130, 246, 0.8);
    }
}

.chart-container::before,
.chart-container::after {
    content: '';
    position: absolute;
    width: 8px;
    height: 8px;
    border: 1px solid #3b82f6;
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
