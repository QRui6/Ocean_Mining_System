<template>
    <div class="absolute bottom-[27rem] left-[31rem] right-8 z-30 pointer-events-auto font-['Noto_Sans_SC']">
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
                        海洋装备深度对比
                    </h3>
                </div>
            </div>

            <!-- 图表内容区 -->
            <div class="p-4">
                <!-- 深度对比图 -->
                <div class="chart-container-large">
                    <div class="chart-header">
                        <div class="chart-title-line"></div>
                        <h4 class="chart-title">各国深潜装备下潜深度对比</h4>
                    </div>
                    <div ref="depthChart" class="w-full h-[400px]"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';

export default {
    name: 'MarineEquipmentStatisticsPanel',
    props: {
        equipmentData: {
            type: Array,
            default: () => []
        }
    },
    emits: [],
    setup(props) {
        const depthChart = ref(null);
        let chartInstance = null;

        // 初始化深度对比图
        const initDepthChart = () => {
            if (!depthChart.value) return;
            
            console.log('📊 图表组件 - 开始初始化，equipmentData:', props.equipmentData);
            console.log('📊 图表组件 - equipmentData 长度:', props.equipmentData.length);
            
            chartInstance = echarts.init(depthChart.value, null, {
                renderer: 'canvas',
                useDirtyRect: false
            });
            
            // 按国家分组数据
            const groupedData = {};
            props.equipmentData.forEach(item => {
                const country = item.country || '未知';
                if (!groupedData[country]) {
                    groupedData[country] = [];
                }
                groupedData[country].push({
                    name: item.name,
                    depth: item.depth || 0,
                    image: item.image || '',
                    location: item.location,
                    organization: item.organization,
                    year: item.year,
                    specifications: item.specifications
                });
            });
            
            // 准备散点图数据
            const seriesData = [];
            const countries = Object.keys(groupedData).sort();
            
            countries.forEach((country, countryIndex) => {
                groupedData[country].forEach(equipment => {
                    seriesData.push({
                        value: [countryIndex, equipment.depth],
                        name: equipment.name,
                        country: country,
                        image: equipment.image,
                        location: equipment.location,
                        organization: equipment.organization,
                        year: equipment.year,
                        specifications: equipment.specifications,
                        symbolSize: [80, 60]
                    });
                });
            });
            
            console.log('📊 图表数据:', { countries, seriesData, totalPoints: seriesData.length });
            console.log('📊 图片路径示例:', seriesData[0]?.image);
            
            // 计算最大深度用于渐变色
            const maxDepth = Math.max(...seriesData.map(item => item.value[1]));
            
            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'item',
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderColor: '#06b6d4',
                    borderWidth: 2,
                    padding: 12,
                    textStyle: { 
                        color: '#e2e8f0',
                        fontSize: 13
                    },
                    formatter: function(params) {
                        const data = params.data;
                        let html = `<div style="padding: 4px;">`;
                        
                        // 标题 - 装备名称
                        html += `<div style="color: #06b6d4; font-weight: bold; font-size: 15px; margin-bottom: 10px; border-bottom: 1px solid #475569; padding-bottom: 6px;">${data.name}</div>`;
                        
                        // 下潜深度 - 主要信息
                        html += `<div style="margin: 6px 0; font-size: 14px;">`;
                        html += `<span style="color: #94a3b8;">下潜深度: </span>`;
                        html += `<span style="color: #22c55e; font-weight: bold; font-size: 16px;">${data.value[1].toLocaleString()} 米</span>`;
                        html += `</div>`;
                        
                        // 分隔线
                        html += `<div style="border-top: 1px solid #334155; margin: 8px 0;"></div>`;
                        
                        // 详细信息
                        html += `<div style="font-size: 12px; line-height: 1.8;">`;
                        
                        // 国家
                        html += `<div style="margin: 4px 0;">`;
                        html += `<span style="color: #94a3b8;">国家: </span>`;
                        html += `<span style="color: #fbbf24; font-weight: 600;">${data.country || '未知'}</span>`;
                        html += `</div>`;
                        
                        // 位置（如果有）
                        if (data.location) {
                            html += `<div style="margin: 4px 0;">`;
                            html += `<span style="color: #94a3b8;">位置: </span>`;
                            html += `<span style="color: #f472b6;">${data.location}</span>`;
                            html += `</div>`;
                        }
                        
                        // 服役单位（如果有）
                        if (data.organization) {
                            html += `<div style="margin: 4px 0;">`;
                            html += `<span style="color: #94a3b8;">服役单位: </span>`;
                            html += `<span style="color: #a78bfa;">${data.organization}</span>`;
                            html += `</div>`;
                        }
                        
                        // 研制时间（如果有）
                        if (data.year) {
                            html += `<div style="margin: 4px 0;">`;
                            html += `<span style="color: #94a3b8;">研制时间: </span>`;
                            html += `<span style="color: #34d399;">${data.year}</span>`;
                            html += `</div>`;
                        }
                        
                        // 规格（如果有）
                        if (data.specifications) {
                            html += `<div style="margin: 4px 0;">`;
                            html += `<span style="color: #94a3b8;">规格: </span>`;
                            html += `<span style="color: #60a5fa;">${data.specifications}</span>`;
                            html += `</div>`;
                        }
                        
                        html += `</div>`;
                        html += `</div>`;
                        
                        return html;
                    }
                },
                grid: {
                    left: '8%',
                    right: '5%',
                    bottom: '8%',
                    top: '8%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    data: countries,
                    axisLine: {
                        lineStyle: { 
                            color: '#334155',
                            width: 2
                        }
                    },
                    axisLabel: {
                        color: '#ffffff',
                        fontSize: 14,
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
                    name: '下潜深度 (米)',
                    inverse: true,
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
                        show: true,
                        lineStyle: { 
                            color: '#334155',
                            width: 2
                        }
                    },
                    axisLabel: {
                        color: '#ffffff',
                        fontSize: 13,
                        fontWeight: 600,
                        formatter: function(value) {
                            return value.toLocaleString();
                        },
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    splitLine: {
                        lineStyle: {
                            color: function(value) {
                                // 在关键深度处使用更明显的分隔线
                                if (value === 3000 || value === 6000 || value === 8000) {
                                    return 'rgba(6, 182, 212, 0.4)';
                                }
                                return '#1e293b';
                            },
                            type: function(value) {
                                if (value === 3000 || value === 6000 || value === 8000) {
                                    return 'solid';
                                }
                                return 'dashed';
                            },
                            width: function(value) {
                                if (value === 3000 || value === 6000 || value === 8000) {
                                    return 2;
                                }
                                return 1;
                            }
                        }
                    }
                },
                series: [
                    {
                        name: '深潜装备',
                        type: 'scatter',
                        symbolSize: function(data) {
                            // 根据深度调整大小，深度越大，符号越大
                            const depth = data[1];
                            return Math.max(35, Math.min(50, 35 + depth / 400));
                        },
                        data: seriesData.map(item => {
                            const depth = item.value[1];
                            // 根据深度计算颜色 - 深度越大，颜色越深
                            let color, shadowColor;
                            if (depth < 3000) {
                                // 浅海 (0-3000米) - 浅青色
                                color = new echarts.graphic.RadialGradient(0.5, 0.5, 0.8, [
                                    { offset: 0, color: '#a5f3fc' },
                                    { offset: 0.5, color: '#67e8f9' },
                                    { offset: 1, color: '#22d3ee' }
                                ]);
                                shadowColor = 'rgba(103, 232, 249, 0.6)';
                            } else if (depth < 6000) {
                                // 中层 (3000-6000米) - 中青色
                                color = new echarts.graphic.RadialGradient(0.5, 0.5, 0.8, [
                                    { offset: 0, color: '#67e8f9' },
                                    { offset: 0.5, color: '#22d3ee' },
                                    { offset: 1, color: '#0891b2' }
                                ]);
                                shadowColor = 'rgba(34, 211, 238, 0.6)';
                            } else if (depth < 8000) {
                                // 深层 (6000-8000米) - 深青色
                                color = new echarts.graphic.RadialGradient(0.5, 0.5, 0.8, [
                                    { offset: 0, color: '#22d3ee' },
                                    { offset: 0.5, color: '#0891b2' },
                                    { offset: 1, color: '#0e7490' }
                                ]);
                                shadowColor = 'rgba(8, 145, 178, 0.6)';
                            } else {
                                // 深渊 (8000米+) - 深蓝色
                                color = new echarts.graphic.RadialGradient(0.5, 0.5, 0.8, [
                                    { offset: 0, color: '#0891b2' },
                                    { offset: 0.5, color: '#0e7490' },
                                    { offset: 1, color: '#164e63' }
                                ]);
                                shadowColor = 'rgba(14, 116, 144, 0.6)';
                            }
                            
                            return {
                                ...item,
                                // 使用图片符号
                                symbol: `image://${item.image}`,
                                itemStyle: {
                                    // 图片符号不支持渐变色，但可以设置阴影和边框
                                    shadowBlur: 20,
                                    shadowColor: shadowColor,
                                    shadowOffsetY: 5,
                                    borderColor: '#fff',
                                    borderWidth: 3
                                }
                            };
                        }),
                        emphasis: {
                            itemStyle: {
                                shadowBlur: 30,
                                shadowColor: 'rgba(6, 182, 212, 0.9)',
                                borderWidth: 4,
                                borderColor: '#67e8f9'
                            },
                            scale: 1.4
                        },
                        label: {
                            show: false
                        },
                        // 添加深度区间标注
                        markLine: {
                            silent: true,
                            symbol: 'none',
                            lineStyle: {
                                color: 'rgba(6, 182, 212, 0.3)',
                                width: 2,
                                type: 'solid'
                            },
                            label: {
                                show: true,
                                position: 'insideEndTop',
                                formatter: '{b}',
                                color: '#67e8f9',
                                fontSize: 11,
                                fontWeight: 'bold',
                                backgroundColor: 'rgba(0, 20, 40, 0.7)',
                                padding: [4, 8],
                                borderRadius: 4
                            },
                            data: [
                                { yAxis: 3000, name: '浅海层 (0-3000m)' },
                                { yAxis: 6000, name: '中层 (3000-6000m)' },
                                { yAxis: 8000, name: '深层 (6000-8000m)' }
                            ]
                        },
                        // 添加深度区间背景色块
                        markArea: {
                            silent: true,
                            itemStyle: {
                                color: 'transparent'
                            },
                            data: [
                                [
                                    {
                                        yAxis: 0,
                                        itemStyle: {
                                            color: 'rgba(165, 243, 252, 0.15)' // 浅海层 - 浅青色
                                        }
                                    },
                                    {
                                        yAxis: 3000
                                    }
                                ],
                                [
                                    {
                                        yAxis: 3000,
                                        itemStyle: {
                                            color: 'rgba(34, 211, 238, 0.12)' // 中层 - 中青色
                                        }
                                    },
                                    {
                                        yAxis: 6000
                                    }
                                ],
                                [
                                    {
                                        yAxis: 6000,
                                        itemStyle: {
                                            color: 'rgba(8, 145, 178, 0.1)' // 深层 - 深青色
                                        }
                                    },
                                    {
                                        yAxis: 8000
                                    }
                                ],
                                [
                                    {
                                        yAxis: 8000,
                                        itemStyle: {
                                            color: 'rgba(22, 78, 99, 0.15)' // 深渊层 - 深蓝色
                                        }
                                    },
                                    {
                                        yAxis: 12000
                                    }
                                ]
                            ]
                        }
                    }
                ]
            };
            
            chartInstance.setOption(option);
            console.log('✅ 图表初始化完成');
        };

        // 窗口大小改变时重新调整图表
        const handleResize = () => {
            chartInstance?.resize();
        };

        onMounted(() => {
            initDepthChart();
            window.addEventListener('resize', handleResize);
        });

        onUnmounted(() => {
            chartInstance?.dispose();
            window.removeEventListener('resize', handleResize);
        });

        // 监听数据变化，重新初始化图表
        watch(() => props.equipmentData, () => {
            if (chartInstance) {
                initDepthChart();
            }
        }, { deep: true });

        return {
            depthChart
        };
    }
};
</script>

<style scoped>
/* 图表容器 - 大尺寸 */
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
        0 0 10px rgba(6, 182, 212, 0.6),
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

.chart-container-large::before,
.chart-container-large::after {
    content: '';
    position: absolute;
    width: 8px;
    height: 8px;
    border: 1px solid #06b6d4;
    animation: corner-glow 2s ease-in-out infinite;
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
