<template>
    <div class="fixed top-32 right-8 z-30 w-[560px] pointer-events-auto font-['Noto_Sans_SC']">
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
                        矿区数据统计
                    </h3>
                </div>
                <button @click="$emit('close')" 
                        class="text-cyan-400 hover:text-white transition-all duration-300 hover:rotate-90">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <!-- 图表内容区 -->
            <div class="p-4 space-y-4 overflow-hidden">
                <!-- 饼图区域 - 两个并排 -->
                <div class="grid grid-cols-2 gap-4">
                    <!-- 国际海底区域勘探合同国别分布 -->
                    <div class="chart-container">
                        <div class="chart-header">
                            <div class="chart-title-line"></div>
                            <h4 class="chart-title">国际海底区域勘探合同国别分布</h4>
                        </div>
                        <div ref="pieChart1" class="w-full h-80"></div>
                    </div>

                    <!-- 国际海底区域的勘探合同数量 -->
                    <div class="chart-container">
                        <div class="chart-header">
                            <div class="chart-title-line"></div>
                            <h4 class="chart-title">国际海底区域的勘探合同数量</h4>
                        </div>
                        <div ref="pieChart2" class="w-full h-80"></div>
                    </div>
                </div>

                <!-- 柱状图区域 -->
                <div class="chart-container-large">
                    <div class="chart-header">
                        <div class="chart-title-line"></div>
                        <h4 class="chart-title">国际海底区域勘探合同数量</h4>
                    </div>
                    <div ref="barChart" class="w-full h-72"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import * as echarts from 'echarts';

export default {
    name: 'MiningDataPanel',
    emits: ['close'],
    setup() {
        const pieChart1 = ref(null);
        const pieChart2 = ref(null);
        const barChart = ref(null);
        
        let chart1Instance = null;
        let chart2Instance = null;
        let chart3Instance = null;

        // 初始化饼图1 - 国际海底区域勘探合同国别分布
        const initPieChart1 = () => {
            if (!pieChart1.value) return;
            
            chart1Instance = echarts.init(pieChart1.value, null, {
                renderer: 'canvas',
                useDirtyRect: false
            });
            
            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'item',
                    backgroundColor: 'rgba(0, 20, 40, 0.95)',
                    borderColor: '#06b6d4',
                    borderWidth: 1,
                    textStyle: { 
                        color: '#fff',
                        fontSize: 11
                    },
                    formatter: '{b}<br/>数量: {c} ({d}%)'
                },
                toolbox: {
                    feature: {
                        saveAsImage: {
                            show: true,
                            title: '保存图片',
                            iconStyle: {
                                borderColor: '#06b6d4'
                            },
                            backgroundColor: 'transparent',
                            pixelRatio: 3
                        }
                    },
                    right: 10,
                    top: 0
                },
                legend: {
                    orient: 'horizontal',
                    bottom: 0,
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
                    itemWidth: 10,
                    itemHeight: 10,
                    itemGap: 8,
                    width: '95%',
                    formatter: function(name) {
                        const data = [
                            { name: '中国', value: 5 },
                            { name: '俄罗斯', value: 4 },
                            { name: '韩国', value: 4 },
                            { name: '日本', value: 3 },
                            { name: '法国', value: 2 },
                            { name: '德国', value: 2 },
                            { name: '印度', value: 2 },
                            { name: '英国', value: 2 },
                            { name: '波兰', value: 1 },
                            { name: '新加坡', value: 1 },
                            { name: '比利时', value: 1 },
                            { name: '古巴', value: 1 },
                            { name: '巴西', value: 1 },
                            { name: '库克群岛', value: 1 },
                            { name: '汤加', value: 1 },
                            { name: '瑙鲁', value: 1 },
                            { name: '基里巴斯', value: 1 }
                        ];
                        const item = data.find(d => d.name === name);
                        return item ? `${name} (${item.value})` : name;
                    },
                    data: [
                        '中国', '俄罗斯', '韩国', '日本', '法国', '德国', '印度', '英国', '波兰',
                        '新加坡', '比利时', '古巴', '巴西', '库克群岛', '汤加', '瑙鲁', '基里巴斯'
                    ]
                },
                graphic: [
                    {
                        type: 'text',
                        left: 'center',
                        top: '32%',
                        style: {
                            text: '总计',
                            textAlign: 'center',
                            fill: '#06b6d4',
                            fontSize: 14,
                            fontWeight: 'bold',
                            textShadowColor: 'rgba(0, 0, 0, 1)',
                            textShadowBlur: 6,
                            textShadowOffsetX: 2,
                            textShadowOffsetY: 2
                        }
                    },
                    {
                        type: 'text',
                        left: 'center',
                        top: '38%',
                        style: {
                            text: '32',
                            textAlign: 'center',
                            fill: '#ffffff',
                            fontSize: 24,
                            fontWeight: 'bold',
                            textShadowColor: 'rgba(0, 0, 0, 1)',
                            textShadowBlur: 6,
                            textShadowOffsetX: 2,
                            textShadowOffsetY: 2
                        }
                    }
                ],
                series: [
                    {
                        name: '国别分布',
                        type: 'pie',
                        radius: ['30%', '60%'],
                        center: ['50%', '35%'],
                        avoidLabelOverlap: true,
                        itemStyle: {
                            borderRadius: 3,
                            borderColor: 'rgba(0, 20, 40, 0.8)',
                            borderWidth: 2,
                            shadowBlur: 10,
                            shadowColor: 'rgba(6, 182, 212, 0.3)'
                        },
                        label: {
                            show: true,
                            position: 'inside',
                            formatter: function(params) {
                                // 只显示数量大于1的数字，避免太拥挤
                                return params.value > 1 ? params.value : '';
                            },
                            fontSize: 12,
                            fontWeight: 'bold',
                            color: '#ffffff',
                            textShadowColor: 'rgba(0, 0, 0, 1)',
                            textShadowBlur: 6,
                            textShadowOffsetX: 2,
                            textShadowOffsetY: 2
                        },
                        labelLine: {
                            show: false
                        },
                        emphasis: {
                            label: {
                                show: true,
                                fontSize: 11,
                                fontWeight: 'bold',
                                color: '#fff',
                                formatter: '{b}\n{c}',
                                textShadowColor: 'rgba(0, 0, 0, 0.8)',
                                textShadowBlur: 5
                            },
                            itemStyle: {
                                shadowBlur: 20,
                                shadowColor: 'rgba(6, 182, 212, 0.6)'
                            }
                        },
                        data: [
                            { value: 5, name: '中国', itemStyle: { color: '#4169E1' } },
                            { value: 4, name: '俄罗斯', itemStyle: { color: '#FF8C00' } },
                            { value: 4, name: '韩国', itemStyle: { color: '#32CD32' } },
                            { value: 3, name: '日本', itemStyle: { color: '#00CED1' } },
                            { value: 2, name: '法国', itemStyle: { color: '#FFD700' } },
                            { value: 2, name: '德国', itemStyle: { color: '#8B4513' } },
                            { value: 2, name: '印度', itemStyle: { color: '#9370DB' } },
                            { value: 2, name: '英国', itemStyle: { color: '#DC143C' } },
                            { value: 1, name: '波兰', itemStyle: { color: '#20B2AA' } },
                            { value: 1, name: '新加坡', itemStyle: { color: '#FF69B4' } },
                            { value: 1, name: '比利时', itemStyle: { color: '#808000' } },
                            { value: 1, name: '古巴', itemStyle: { color: '#4682B4' } },
                            { value: 1, name: '巴西', itemStyle: { color: '#228B22' } },
                            { value: 1, name: '库克群岛', itemStyle: { color: '#FF6347' } },
                            { value: 1, name: '汤加', itemStyle: { color: '#BA55D3' } },
                            { value: 1, name: '瑙鲁', itemStyle: { color: '#CD853F' } },
                            { value: 1, name: '基里巴斯', itemStyle: { color: '#00FA9A' } }
                        ]
                    }
                ]
            };
            chart1Instance.setOption(option);
        };

        // 初始化饼图2 - 国际海底区域的勘探合同数量（按矿产类型）
        const initPieChart2 = () => {
            if (!pieChart2.value) return;
            
            chart2Instance = echarts.init(pieChart2.value, null, {
                renderer: 'canvas',
                useDirtyRect: false
            });
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
                    formatter: '{b}<br/>{c} 个 ({d}%)'
                },
                toolbox: {
                    feature: {
                        saveAsImage: {
                            show: true,
                            title: '保存图片',
                            iconStyle: {
                                borderColor: '#06b6d4'
                            },
                            backgroundColor: 'transparent',
                            pixelRatio: 3
                        }
                    },
                    right: 10,
                    top: 0
                },
                legend: {
                    orient: 'horizontal',
                    bottom: 5,
                    left: 'center',
                    textStyle: { 
                        color: '#ffffff', 
                        fontSize: 13,
                        fontWeight: 600,
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    itemWidth: 14,
                    itemHeight: 14,
                    itemGap: 20,
                    formatter: function(name) {
                        const data = [
                            { name: '多金属结核', value: 19 },
                            { name: '多金属硫化物', value: 8 },
                            { name: '富钴结壳', value: 5 }
                        ];
                        const item = data.find(d => d.name === name);
                        return item ? `${name} (${item.value})` : name;
                    }
                },
                graphic: [
                    {
                        type: 'text',
                        left: 'center',
                        top: '32%',
                        style: {
                            text: '总计',
                            textAlign: 'center',
                            fill: '#06b6d4',
                            fontSize: 14,
                            fontWeight: 'bold',
                            textShadowColor: 'rgba(0, 0, 0, 1)',
                            textShadowBlur: 6,
                            textShadowOffsetX: 2,
                            textShadowOffsetY: 2
                        }
                    },
                    {
                        type: 'text',
                        left: 'center',
                        top: '38%',
                        style: {
                            text: '32',
                            textAlign: 'center',
                            fill: '#ffffff',
                            fontSize: 24,
                            fontWeight: 'bold',
                            textShadowColor: 'rgba(0, 0, 0, 1)',
                            textShadowBlur: 6,
                            textShadowOffsetX: 2,
                            textShadowOffsetY: 2
                        }
                    }
                ],
                series: [
                    {
                        name: '矿产类型',
                        type: 'pie',
                        radius: ['35%', '65%'],
                        center: ['50%', '35%'],
                        avoidLabelOverlap: true,
                        itemStyle: {
                            borderRadius: 4,
                            borderColor: 'rgba(0, 20, 40, 0.8)',
                            borderWidth: 2,
                            shadowBlur: 10,
                            shadowColor: 'rgba(6, 182, 212, 0.3)'
                        },
                        label: {
                            show: true,
                            position: 'inside',
                            fontSize: 15,
                            fontWeight: 'bold',
                            color: '#ffffff',
                            formatter: '{c}',
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
                        },
                        data: [
                            { 
                                value: 19, 
                                name: '多金属结核', 
                                itemStyle: { 
                                    color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
                                        { offset: 0, color: '#4169E1' },
                                        { offset: 1, color: '#1E3A8A' }
                                    ])
                                } 
                            },
                            { 
                                value: 8, 
                                name: '多金属硫化物', 
                                itemStyle: { 
                                    color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
                                        { offset: 0, color: '#FF8C00' },
                                        { offset: 1, color: '#D97706' }
                                    ])
                                } 
                            },
                            { 
                                value: 5, 
                                name: '富钴结壳', 
                                itemStyle: { 
                                    color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
                                        { offset: 0, color: '#FFD700' },
                                        { offset: 1, color: '#CA8A04' }
                                    ])
                                } 
                            }
                        ]
                    }
                ]
            };
            chart2Instance.setOption(option);
        };

        // 初始化柱状图 - 国际海底区域勘探合同数量（按年份）
        const initBarChart = () => {
            if (!barChart.value) return;
            
            chart3Instance = echarts.init(barChart.value, null, {
                renderer: 'canvas',
                useDirtyRect: false
            });
            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(0, 20, 40, 0.95)',
                    borderColor: '#06b6d4',
                    borderWidth: 1,
                    textStyle: { 
                        color: '#fff',
                        fontSize: 12
                    },
                    axisPointer: {
                        type: 'shadow',
                        shadowStyle: {
                            color: 'rgba(6, 182, 212, 0.15)'
                        }
                    },
                    formatter: '{b}<br/>合同数量: {c} 个'
                },
                toolbox: {
                    feature: {
                        saveAsImage: {
                            show: true,
                            title: '保存图片',
                            iconStyle: {
                                borderColor: '#06b6d4'
                            },
                            backgroundColor: 'transparent',
                            pixelRatio: 3
                        }
                    },
                    right: 20,
                    top: 0
                },
                grid: {
                    left: '5%',
                    right: '5%',
                    bottom: '10%',
                    top: '10%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    data: ['2001年', '2002年', '2006年', '2011年', '2012年', '2013年', '2014年', '2015年', '2016年', '2017年', '2018年', '2019年', '2021年', '2026年'],
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
                        rotate: 45,
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
                    name: '合同数量',
                    nameTextStyle: {
                        color: '#ffffff',
                        fontSize: 14,
                        fontWeight: 600,
                        padding: [0, 0, 0, 0],
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    axisLine: {
                        show: false
                    },
                    axisLabel: {
                        color: '#ffffff',
                        fontSize: 13,
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
                    },
                    max: 7
                },
                series: [
                    {
                        name: '合同数量',
                        type: 'bar',
                        data: [6, 1, 1, 2, 2, 2, 4, 5, 3, 1, 2, 1, 1, 1],
                        barWidth: '45%',
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
                            fontSize: 14,
                            fontWeight: 'bold',
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

        onMounted(() => {
            initPieChart1();
            initPieChart2();
            initBarChart();
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
            barChart
        };
    }
};
</script>

<style scoped>
/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.5);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(6, 182, 212, 0.3);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(6, 182, 212, 0.5);
}

/* 图表容器 - 小尺寸（饼图） */
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

/* 图表容器 - 大尺寸（柱状图） */
.chart-container-large {
    position: relative;
    background: transparent;
    padding: 12px;
    clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
    border: 1px solid rgba(6, 182, 212, 0.4);
    box-shadow: 0 0 20px rgba(6, 182, 212, 0.15);
    transition: all 0.3s ease;
}

.chart-container-large:hover {
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
.chart-container::after,
.chart-container-large::before,
.chart-container-large::after {
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

.chart-container-large::before {
    top: -1px;
    left: -1px;
    border-right: none;
    border-bottom: none;
}

.chart-container-large::after {
    bottom: -1px;
    right: -1px;
    border-left: none;
    border-top: none;
}
</style>
