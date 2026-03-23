<template>
    <div class="absolute bottom-[27rem] left-[31rem] right-8 z-30 pointer-events-auto font-['Noto_Sans_SC']">
        <!-- 主容器 - 科技感边框 -->
        <div class="relative overflow-hidden"
             style="clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px)); background: linear-gradient(to right, rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.75)); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 2px solid rgba(6, 182, 212, 0.5); box-shadow: inset 0 0 20px rgba(0,0,0,0.5), 0 0 40px rgba(6, 182, 212, 0.2);">
            
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
            <div class="relative flex items-center justify-between px-5 py-3 border-b border-cyan-500/50"
                 style="background: rgba(15, 23, 42, 0.6);">
                <div class="flex items-center gap-3">
                    <div class="w-1 h-6 bg-gradient-to-b from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/50"></div>
                    <h3 class="text-lg font-bold text-white tracking-wider" style="text-shadow: 0 0 10px rgba(6, 182, 212, 0.5);">
                        破冰船破冰能力对比
                    </h3>
                </div>
            </div>

            <!-- 图表内容区 -->
            <div class="p-4">
                <!-- 破冰能力对比图 -->
                <div class="chart-container-large">
                    <div class="chart-header">
                        <div class="chart-title-line"></div>
                        <h4 class="chart-title">各国破冰船破冰厚度对比</h4>
                    </div>
                    <div ref="icebreakerChart" class="w-full h-[400px]"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';

export default {
    name: 'IcebreakerStatisticsPanel',
    props: {
        equipmentData: {
            type: Array,
            default: () => []
        }
    },
    setup(props) {
        const icebreakerChart = ref(null);
        let chartInstance = null;

        // 破冰船图片映射
        const imageMap = {
            '22220型': new URL('../data/破冰船/22220型.png', import.meta.url).href,
            '北极级': new URL('../data/破冰船/北极级.png', import.meta.url).href,
            '极地安全巡逻舰': new URL('../data/破冰船/极地安全巡逻舰.png', import.meta.url).href,
            '极地星号': new URL('../data/破冰船/极地星号.png', import.meta.url).href,
            '希利号': new URL('../data/破冰船/希利号.png', import.meta.url).href,
            '雪龙2号': new URL('../data/破冰船/雪龙2号.png', import.meta.url).href,
            '雪龙号': new URL('../data/破冰船/雪龙号.png', import.meta.url).href
        };

        // 提取破冰厚度的辅助函数
        const extractIceThickness = (specifications) => {
            if (!specifications) return 0;
            // 特殊处理中型破冰船（如希利号等没有直接写明破冰厚度的情况）
            if (specifications.includes('中型破冰船') && !specifications.match(/可破[除约]?\s*(\d+(\.\d+)?)\s*米/) && !specifications.match(/破冰能力[约]?\s*(\d+(\.\d+)?)\s*米/)) {
                return 1.2; // 默认中型破冰船的参考破冰厚度
            }
            // 匹配类似 "可破除 3 米厚冰层" 或 "破冰能力约 1.2 米" 或 "可破约 0.6 米"
            const match = specifications.match(/可破[除约]?\s*(\d+(\.\d+)?)\s*米/);
            if (match) {
                return parseFloat(match[1]);
            }
            // 匹配 "破冰能力约 1.2 米"
            const match2 = specifications.match(/破冰能力[约]?\s*(\d+(\.\d+)?)\s*米/);
            if (match2) {
                return parseFloat(match2[1]);
            }
            // 特殊处理雪龙2号 "可破 20 米高的冰脊"，这里统一转换为常规破冰能力(雪龙2号实际连续破冰能力约为1.5米)
            if (specifications.includes('雪龙2号') || specifications.includes('20 米高的冰脊')) {
                return 1.5; 
            }
            return 0;
        };

        // 初始化破冰能力对比图
        const initChart = () => {
            if (!icebreakerChart.value) return;
            
            chartInstance = echarts.init(icebreakerChart.value, null, {
                renderer: 'canvas',
                useDirtyRect: false
            });
            
            // 按国家分组数据
            const groupedData = {};
            props.equipmentData.forEach(item => {
                // 处理国家名称，提取出纯国家名（去掉括号及里面的内容）
                let country = '未知';
                if (item.country) {
                    country = item.country.split('（')[0].split('(')[0].trim();
                }
                
                if (!groupedData[country]) {
                    groupedData[country] = [];
                }
                
                const thickness = extractIceThickness(item.specifications);
                
                groupedData[country].push({
                    name: item.name,
                    thickness: thickness,
                    originalCountry: item.country,
                    year: item.year,
                    specifications: item.specifications
                });
            });
            
            // 准备散点图数据
            const seriesData = [];
            const countries = Object.keys(groupedData).sort();
            
            countries.forEach((country, countryIndex) => {
                const countryEquipments = groupedData[country].filter(eq => eq.thickness > 0);
                const count = countryEquipments.length;
                
                countryEquipments.forEach((equipment, index) => {
                    // 计算横向偏移量 (jitter)，让同一国家的图标横向散开
                    // 偏移范围在 -0.3 到 0.3 之间，取决于该国家有多少艘船
                    let jitter = 0;
                    if (count > 1) {
                        // 均匀分布：例如3艘船的偏移是 -0.2, 0, 0.2
                        jitter = (index - (count - 1) / 2) * 0.15;
                        // 限制最大偏移量，防止超出边界跑到其他国家的位置
                        jitter = Math.max(-0.35, Math.min(0.35, jitter));
                    }
                    
                    seriesData.push({
                        value: [countryIndex + jitter, equipment.thickness],
                        name: equipment.name,
                        country: equipment.originalCountry,
                        year: equipment.year,
                        specifications: equipment.specifications
                    });
                });
            });
            
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
                        
                        // 破冰能力 - 主要信息
                        html += `<div style="margin: 6px 0; font-size: 14px;">`;
                        html += `<span style="color: #94a3b8;">破冰能力: </span>`;
                        html += `<span style="color: #22c55e; font-weight: bold; font-size: 16px;">${data.value[1]} 米</span>`;
                        html += `</div>`;
                        
                        // 分隔线
                        html += `<div style="border-top: 1px solid #334155; margin: 8px 0;"></div>`;
                        
                        // 详细信息
                        html += `<div style="font-size: 12px; line-height: 1.8;">`;
                        
                        // 国家
                        html += `<div style="margin: 4px 0;">`;
                        html += `<span style="color: #94a3b8;">国家: </span>`;
                        html += `<span style="color: #fbbf24; font-weight: 600;">${data.country}</span>`;
                        html += `</div>`;
                        
                        // 研制时间
                        if (data.year) {
                            html += `<div style="margin: 4px 0;">`;
                            html += `<span style="color: #94a3b8;">研制时间: </span>`;
                            html += `<span style="color: #34d399;">${data.year}</span>`;
                            html += `</div>`;
                        }
                        
                        // 规格
                        if (data.specifications) {
                            html += `<div style="margin: 4px 0;">`;
                            html += `<span style="color: #94a3b8;">规格: </span>`;
                            html += `<div style="color: #60a5fa; max-width: 200px; white-space: normal; word-wrap: break-word;">${data.specifications}</div>`;
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
                    type: 'value',
                    min: -0.5,
                    max: countries.length - 0.5,
                    interval: 1,
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
                        textShadowOffsetY: 2,
                        formatter: function(value) {
                            // 确保只有整数位置显示国家名称，且不越界
                            // 注意：ECharts 的 value 在 value 轴时可能会带有小数，我们需要用 Math.abs 判断是否非常接近整数
                            const intVal = Math.round(value);
                            if (Math.abs(value - intVal) < 0.01 && intVal >= 0 && intVal < countries.length) {
                                return countries[intVal];
                            }
                            return '';
                        }
                    },
                    axisTick: {
                        show: false
                    },
                    splitLine: {
                        show: false
                    }
                },
                yAxis: {
                    type: 'value',
                    name: '破冰厚度 (米)',
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
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    splitLine: {
                        lineStyle: {
                            color: function(value) {
                                if (value === 1 || value === 2 || value === 3) {
                                    return 'rgba(6, 182, 212, 0.4)';
                                }
                                return '#1e293b';
                            },
                            type: function(value) {
                                if (value === 1 || value === 2 || value === 3) {
                                    return 'solid';
                                }
                                return 'dashed';
                            }
                        }
                    }
                },
                series: [
                    {
                        name: '破冰船',
                        type: 'scatter',
                        symbol: 'circle',
                        symbolSize: function(data) {
                            // 根据破冰能力调整大小
                            const thickness = data[1];
                            return Math.max(20, Math.min(60, 20 + thickness * 15));
                        },
                        data: seriesData.map(item => {
                            const thickness = item.value[1];
                            const baseName = item.name.split('（')[0].split('(')[0].trim();
                            const imgUrl = imageMap[baseName];

                            // 根据破冰能力计算颜色
                            let color, shadowColor;
                            if (thickness < 1) {
                                // 轻型破冰能力
                                color = new echarts.graphic.RadialGradient(0.5, 0.5, 0.8, [
                                    { offset: 0, color: '#a5f3fc' },
                                    { offset: 0.5, color: '#67e8f9' },
                                    { offset: 1, color: '#22d3ee' }
                                ]);
                                shadowColor = 'rgba(103, 232, 249, 0.6)';
                            } else if (thickness < 2) {
                                // 中型破冰能力
                                color = new echarts.graphic.RadialGradient(0.5, 0.5, 0.8, [
                                    { offset: 0, color: '#fde047' },
                                    { offset: 0.5, color: '#facc15' },
                                    { offset: 1, color: '#eab308' }
                                ]);
                                shadowColor = 'rgba(250, 204, 21, 0.6)';
                            } else {
                                // 重型破冰能力
                                color = new echarts.graphic.RadialGradient(0.5, 0.5, 0.8, [
                                    { offset: 0, color: '#fca5a5' },
                                    { offset: 0.5, color: '#f87171' },
                                    { offset: 1, color: '#ef4444' }
                                ]);
                                shadowColor = 'rgba(248, 113, 113, 0.6)';
                            }
                            
                            const dataItem = {
                                ...item,
                                itemStyle: {
                                    color: color,
                                    shadowBlur: 20,
                                    shadowColor: shadowColor,
                                    borderColor: '#fff',
                                    borderWidth: 2
                                }
                            };

                            // 如果有对应的图片，使用图片作为标记
                            if (imgUrl) {
                                dataItem.symbol = 'image://' + imgUrl;
                                // 调整图片大小，根据厚度适当缩放
                                const baseSize = Math.max(30, Math.min(60, 25 + thickness * 10));
                                dataItem.symbolSize = [baseSize * 2, baseSize]; // 假设破冰船图片是长方形的(宽>高)
                                // 对于图片，减少不必要的边框样式
                                dataItem.itemStyle = {
                                    shadowBlur: 15,
                                    shadowColor: shadowColor
                                };
                            }

                            return dataItem;
                        }),
                        emphasis: {
                            itemStyle: {
                                shadowBlur: 30,
                                borderColor: '#fff',
                                borderWidth: 3
                            },
                            scale: 1.2
                        },
                        label: {
                            show: true,
                            position: 'top',
                            formatter: '{b}',
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 'bold',
                            textShadowColor: '#000',
                            textShadowBlur: 4,
                            textShadowOffsetX: 1,
                            textShadowOffsetY: 1
                        }
                    }
                ]
            };
            
            chartInstance.setOption(option);
        };

        // 窗口大小改变时重新调整图表
        const handleResize = () => {
            chartInstance?.resize();
        };

        onMounted(() => {
            initChart();
            window.addEventListener('resize', handleResize);
        });

        onUnmounted(() => {
            chartInstance?.dispose();
            window.removeEventListener('resize', handleResize);
        });

        // 监听数据变化，重新初始化图表
        watch(() => props.equipmentData, () => {
            if (chartInstance) {
                initChart();
            }
        }, { deep: true });

        return {
            icebreakerChart
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