<template>
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-auto">
        <div class="relative rounded-xl shadow-2xl border border-cyan-500/30 overflow-hidden" style="width: 75vw; height: 70vh; max-width: 1000px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);">
            <!-- 装饰性背景元素 -->
            <div class="absolute inset-0 opacity-30 pointer-events-none">
                <div class="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
                <div class="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
            </div>
            
            <!-- 标题栏 -->
            <div class="relative flex items-center justify-between px-4 py-3 border-b border-cyan-500/30 bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-sm">
                <div class="flex items-center gap-3">
                    <div class="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                    <h2 class="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">情景模拟分析</h2>
                    <div class="text-sm text-slate-400">2030-2050年我国深海矿物金属产量情景模拟</div>
                </div>
                <button @click="$emit('close')" class="text-slate-400 hover:text-cyan-400 transition-all hover:rotate-90 duration-300">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <!-- 主内容区域 -->
            <div class="relative flex flex-col p-4" style="height: calc(100% - 60px);">
                <!-- 图表网格 -->
                <div class="grid grid-cols-2 gap-4" style="height: calc(100% - 40px);">
                    <!-- 钢图表 - 橙色边框 -->
                    <div class="relative rounded-lg border-2 border-orange-500/50 p-3 flex flex-col overflow-hidden" style="height: 100%; background: linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0%, rgba(15, 23, 42, 0.8) 100%);">
                        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>
                        <div class="text-base text-white font-medium mb-2 text-center">钢 (a)</div>
                        <div ref="steelChartRef" class="w-full flex-1" style="min-height: 200px;"></div>
                    </div>
                    
                    <!-- 铁图表 - 红色边框 -->
                    <div class="relative rounded-lg border-2 border-red-500/50 p-3 flex flex-col overflow-hidden" style="height: 100%; background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(15, 23, 42, 0.8) 100%);">
                        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
                        <div class="text-base text-white font-medium mb-2 text-center">铁 (b)</div>
                        <div ref="ironChartRef" class="w-full flex-1" style="min-height: 200px;"></div>
                    </div>
                    
                    <!-- 钴图表 - 紫色边框 -->
                    <div class="relative rounded-lg border-2 border-purple-500/50 p-3 flex flex-col overflow-hidden" style="height: 100%; background: linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(15, 23, 42, 0.8) 100%);">
                        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
                        <div class="text-base text-white font-medium mb-2 text-center">钴 (c)</div>
                        <div ref="cobaltChartRef" class="w-full flex-1" style="min-height: 200px;"></div>
                    </div>
                    
                    <!-- 锰图表 - 绿色边框 -->
                    <div class="relative rounded-lg border-2 border-emerald-500/50 p-3 flex flex-col overflow-hidden" style="height: 100%; background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(15, 23, 42, 0.8) 100%);">
                        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
                        <div class="text-base text-white font-medium mb-2 text-center">锰 (d)</div>
                        <div ref="manganeseChartRef" class="w-full flex-1" style="min-height: 200px;"></div>
                    </div>
                </div>
                
                <!-- 图例 -->
                <div class="mt-3 flex justify-center gap-6 text-sm bg-slate-900/50 rounded-lg py-2 px-4 backdrop-blur-sm border border-cyan-500/20">
                    <div class="flex items-center gap-2">
                        <div class="w-4 h-0.5 bg-purple-500 shadow-lg shadow-purple-500/50"></div>
                        <span class="text-white">低情景</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-4 h-0.5 bg-cyan-500 shadow-lg shadow-cyan-500/50"></div>
                        <span class="text-white">基准情景</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-4 h-0.5 bg-blue-500 shadow-lg shadow-blue-500/50"></div>
                        <span class="text-white">高情景</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import * as echarts from 'echarts';

export default {
    name: 'ScenarioSimulationPanel',
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['close'],
    data() {
        return {
            charts: {
                steel: null,
                iron: null,
                cobalt: null,
                manganese: null
            },
            // 数据来源于图片中的表格
            scenarioData: {
                steel: {
                    years: [2030, 2035, 2040, 2050],
                    low: [0.50, 2.58, 5.22, 7.86],
                    baseline: [0.99, 4.23, 7.86, 10.50],
                    high: [3.57, 8.46, 12.74, 12.86]
                },
                iron: {
                    years: [2030, 2035, 2040, 2050],
                    low: [0.62, 2.47, 5.14, 7.81],
                    baseline: [1.24, 3.91, 7.81, 10.48],
                    high: [3.71, 7.81, 11.92, 12.32]
                },
                cobalt: {
                    years: [2030, 2035, 2040, 2050],
                    low: [0.09, 0.34, 0.97, 1.60],
                    baseline: [0.17, 0.80, 1.60, 2.23],
                    high: [0.51, 1.60, 2.69, 3.26]
                },
                manganese: {
                    years: [2030, 2035, 2040, 2050],
                    low: [12.78, 51.12, 112.19, 173.25],
                    baseline: [25.56, 86.63, 173.25, 234.32],
                    high: [76.68, 173.25, 269.82, 289.71]
                }
            }
        };
    },
    methods: {
        createChartOption(metalType) {
            const data = this.scenarioData[metalType];
            const metalNames = {
                steel: '钢',
                iron: '铁', 
                cobalt: '钴',
                manganese: '锰'
            };
            
            return {
                backgroundColor: 'transparent',
                grid: {
                    left: '18%',
                    right: '8%',
                    top: '12%',
                    bottom: '35%',
                    containLabel: false
                },
                xAxis: {
                    type: 'category',
                    data: data.years,
                    axisLabel: {
                        show: true,
                        color: '#ffffff',
                        fontSize: 12
                    },
                    axisLine: {
                        lineStyle: {
                            color: '#475569'
                        }
                    },
                    axisTick: {
                        show: false
                    }
                },
                yAxis: {
                    type: 'value',
                    name: '万吨',
                    nameLocation: 'middle',
                    nameGap: 45,
                    nameTextStyle: {
                        color: '#ffffff',
                        fontSize: 12
                    },
                    axisLabel: {
                        color: '#ffffff',
                        fontSize: 11,
                        formatter: function(value) {
                            if (value >= 100) {
                                return Math.round(value);
                            } else if (value >= 10) {
                                return value.toFixed(1);
                            } else {
                                return value.toFixed(2);
                            }
                        }
                    },
                    axisLine: {
                        show: false
                    },
                    axisTick: {
                        show: false
                    },
                    splitLine: {
                        lineStyle: {
                            color: '#334155',
                            opacity: 0.3
                        }
                    }
                },
                series: [
                    {
                        name: '低情景',
                        type: 'line',
                        data: data.low,
                        smooth: true,
                        lineStyle: {
                            color: '#a855f7',
                            width: 2
                        },
                        itemStyle: {
                            color: '#a855f7'
                        },
                        symbol: 'circle',
                        symbolSize: 4
                    },
                    {
                        name: '基准情景',
                        type: 'line',
                        data: data.baseline,
                        smooth: true,
                        lineStyle: {
                            color: '#06b6d4',
                            width: 2
                        },
                        itemStyle: {
                            color: '#06b6d4'
                        },
                        symbol: 'circle',
                        symbolSize: 4
                    },
                    {
                        name: '高情景',
                        type: 'line',
                        data: data.high,
                        smooth: true,
                        lineStyle: {
                            color: '#3b82f6',
                            width: 2
                        },
                        itemStyle: {
                            color: '#3b82f6'
                        },
                        symbol: 'circle',
                        symbolSize: 4
                    }
                ],
                // 添加数据表格（与X轴刻度对齐）
                graphic: [
                    {
                        type: 'group',
                        left: '18%',
                        bottom: '3%',
                        children: [
                            // 表格背景
                            {
                                type: 'rect',
                                shape: {
                                    x: 0,
                                    y: 0,
                                    width: 310,
                                    height: 60
                                },
                                style: {
                                    fill: 'rgba(15, 23, 42, 0.95)',
                                    stroke: '#475569',
                                    lineWidth: 1
                                }
                            },
                            // 低情景行
                            {
                                type: 'text',
                                style: {
                                    text: '低情景',
                                    x: 5,
                                    y: 15,
                                    fill: '#a855f7',
                                    fontSize: 11
                                }
                            },
                            {
                                type: 'text',
                                style: {
                                    text: data.low[0].toString(),
                                    x: 65,
                                    y: 15,
                                    fill: '#ffffff',
                                    fontSize: 11
                                }
                            },
                            {
                                type: 'text',
                                style: {
                                    text: data.low[1].toString(),
                                    x: 130,
                                    y: 15,
                                    fill: '#ffffff',
                                    fontSize: 11
                                }
                            },
                            {
                                type: 'text',
                                style: {
                                    text: data.low[2].toString(),
                                    x: 195,
                                    y: 15,
                                    fill: '#ffffff',
                                    fontSize: 11
                                }
                            },
                            {
                                type: 'text',
                                style: {
                                    text: data.low[3].toString(),
                                    x: 260,
                                    y: 15,
                                    fill: '#ffffff',
                                    fontSize: 11
                                }
                            },
                            // 基准情景行
                            {
                                type: 'text',
                                style: {
                                    text: '基准情景',
                                    x: 5,
                                    y: 33,
                                    fill: '#06b6d4',
                                    fontSize: 11
                                }
                            },
                            {
                                type: 'text',
                                style: {
                                    text: data.baseline[0].toString(),
                                    x: 65,
                                    y: 33,
                                    fill: '#ffffff',
                                    fontSize: 11
                                }
                            },
                            {
                                type: 'text',
                                style: {
                                    text: data.baseline[1].toString(),
                                    x: 130,
                                    y: 33,
                                    fill: '#ffffff',
                                    fontSize: 11
                                }
                            },
                            {
                                type: 'text',
                                style: {
                                    text: data.baseline[2].toString(),
                                    x: 195,
                                    y: 33,
                                    fill: '#ffffff',
                                    fontSize: 11
                                }
                            },
                            {
                                type: 'text',
                                style: {
                                    text: data.baseline[3].toString(),
                                    x: 260,
                                    y: 33,
                                    fill: '#ffffff',
                                    fontSize: 11
                                }
                            },
                            // 高情景行
                            {
                                type: 'text',
                                style: {
                                    text: '高情景',
                                    x: 5,
                                    y: 51,
                                    fill: '#3b82f6',
                                    fontSize: 11
                                }
                            },
                            {
                                type: 'text',
                                style: {
                                    text: data.high[0].toString(),
                                    x: 65,
                                    y: 51,
                                    fill: '#ffffff',
                                    fontSize: 11
                                }
                            },
                            {
                                type: 'text',
                                style: {
                                    text: data.high[1].toString(),
                                    x: 130,
                                    y: 51,
                                    fill: '#ffffff',
                                    fontSize: 11
                                }
                            },
                            {
                                type: 'text',
                                style: {
                                    text: data.high[2].toString(),
                                    x: 195,
                                    y: 51,
                                    fill: '#ffffff',
                                    fontSize: 11
                                }
                            },
                            {
                                type: 'text',
                                style: {
                                    text: data.high[3].toString(),
                                    x: 260,
                                    y: 51,
                                    fill: '#ffffff',
                                    fontSize: 11
                                }
                            }
                        ]
                    }
                ],
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderColor: '#475569',
                    borderWidth: 1,
                    textStyle: {
                        color: '#e2e8f0',
                        fontSize: 11
                    },
                    formatter: function(params) {
                        let result = `<div style="padding: 6px;">`;
                        result += `<div style="color: #06b6d4; font-weight: bold; margin-bottom: 6px; font-size: 12px;">${params[0].axisValue}年 ${metalNames[metalType]}产量预测</div>`;
                        params.forEach(param => {
                            const color = param.color;
                            result += `<div style="margin: 2px 0; font-size: 11px;">`;
                            result += `<span style="display: inline-block; width: 8px; height: 8px; background-color: ${color}; border-radius: 50%; margin-right: 6px;"></span>`;
                            result += `${param.seriesName}: <span style="color: #22c55e; font-weight: bold;">${param.value}</span> 万吨`;
                            result += `</div>`;
                        });
                        result += `</div>`;
                        return result;
                    }
                }
            };
        },
        
        initCharts() {
            this.$nextTick(() => {
                const metals = ['steel', 'iron', 'cobalt', 'manganese'];
                const refs = ['steelChartRef', 'ironChartRef', 'cobaltChartRef', 'manganeseChartRef'];
                
                metals.forEach((metal, index) => {
                    const chartDom = this.$refs[refs[index]];
                    if (chartDom) {
                        // 销毁已存在的图表实例
                        if (this.charts[metal]) {
                            this.charts[metal].dispose();
                        }
                        
                        // 创建新的图表实例
                        this.charts[metal] = echarts.init(chartDom);
                        this.charts[metal].setOption(this.createChartOption(metal));
                        
                        // 监听窗口大小变化
                        const resizeHandler = () => {
                            if (this.charts[metal]) {
                                this.charts[metal].resize();
                            }
                        };
                        window.addEventListener('resize', resizeHandler);
                    }
                });
            });
        }
    },
    mounted() {
        if (this.show) {
            this.initCharts();
        }
    },
    beforeUnmount() {
        // 销毁图表实例
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.dispose();
            }
        });
    },
    watch: {
        show(newVal) {
            if (newVal) {
                // 面板显示时重新初始化图表
                this.$nextTick(() => {
                    this.initCharts();
                });
            }
        }
    }
};
</script>

<style scoped>
/* 确保网格布局的一致性 */
.grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
}

.grid > div {
    display: flex;
    flex-direction: column;
}

/* 确保图表容器大小一致 */
.grid > div > div:last-child {
    flex: 1;
    min-height: 0;
}

::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.5);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb {
    background: rgba(6, 182, 212, 0.5);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: rgba(6, 182, 212, 0.7);
}
</style>