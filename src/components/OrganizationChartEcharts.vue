<template>
    <div ref="chartRef" class="echarts-container"></div>
</template>

<script>
import { ref, onMounted, watch, onUnmounted } from 'vue';
import * as echarts from 'echarts';

export default {
    name: 'OrganizationChartEcharts',
    props: {
        data: {
            type: Object,
            required: true
        }
    },
    emits: ['nodeClick'],
    setup(props, { emit }) {
        const chartRef = ref(null);
        let chartInstance = null;

        // 转换数据格式为 ECharts 树图格式
        const convertToEchartsFormat = (node) => {
            const result = {
                name: node.name,
                label: {
                    backgroundColor: node.color || '#90EE90',
                    borderRadius: 8,
                    padding: [12, 20],
                    color: '#1a1a1a',
                    fontSize: 14,
                    fontWeight: 'bold',
                    rich: {
                        title: {
                            fontSize: 15,
                            fontWeight: 'bold',
                            color: '#1a1a1a',
                            lineHeight: 22
                        },
                        subtitle: {
                            fontSize: 11,
                            color: '#4a4a4a',
                            fontStyle: 'italic',
                            lineHeight: 18
                        },
                        desc: {
                            fontSize: 10,
                            color: '#2a2a2a',
                            lineHeight: 16
                        }
                    }
                },
                itemStyle: {
                    color: node.color || '#90EE90',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    borderWidth: 2
                }
            };

            // 构建富文本标签
            let labelText = `{title|${node.name}}`;
            if (node.nameEn) {
                labelText += `\n{subtitle|${node.nameEn}}`;
            }
            if (node.description) {
                labelText += `\n{desc|${node.description}}`;
            }
            result.label.formatter = labelText;

            // 递归处理子节点
            if (node.children && node.children.length > 0) {
                result.children = node.children.map(child => convertToEchartsFormat(child));
            }

            return result;
        };

        // 初始化图表
        const initChart = () => {
            if (!chartRef.value) return;

            // 销毁旧实例
            if (chartInstance) {
                chartInstance.dispose();
            }

            // 创建新实例
            chartInstance = echarts.init(chartRef.value);

            const option = {
                tooltip: {
                    trigger: 'item',
                    triggerOn: 'mousemove',
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderColor: '#64C8FF',
                    borderWidth: 1,
                    textStyle: {
                        color: '#fff'
                    }
                },
                series: [
                    {
                        type: 'tree',
                        data: [convertToEchartsFormat(props.data)],
                        top: '5%',
                        left: '5%',
                        bottom: '5%',
                        right: '5%',
                        symbolSize: 0,  // 隐藏节点圆点
                        orient: 'vertical',  // 竖向布局
                        layout: 'orthogonal',  // 正交布局，连接线更规整
                        expandAndCollapse: false,  // 禁用展开/折叠
                        initialTreeDepth: -1,  // 展开所有层级
                        label: {
                            position: 'top',
                            verticalAlign: 'middle',
                            align: 'center',
                            fontSize: 14,
                            borderWidth: 2,
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            borderRadius: 8,
                            shadowBlur: 6,
                            shadowColor: 'rgba(0, 0, 0, 0.3)',
                            shadowOffsetX: 0,
                            shadowOffsetY: 4
                        },
                        leaves: {
                            label: {
                                position: 'bottom',
                                verticalAlign: 'middle',
                                align: 'center'
                            }
                        },
                        emphasis: {
                            focus: 'descendant',
                            label: {
                                borderColor: 'rgba(255, 255, 255, 0.6)',
                                shadowBlur: 12,
                                shadowColor: 'rgba(0, 0, 0, 0.4)'
                            }
                        },
                        lineStyle: {
                            color: '#64C8FF',
                            width: 3,
                            shadowBlur: 10,
                            shadowColor: 'rgba(100, 200, 255, 0.9)'
                        },
                        itemStyle: {
                            borderWidth: 2,
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            shadowBlur: 6,
                            shadowColor: 'rgba(0, 0, 0, 0.3)',
                            shadowOffsetX: 0,
                            shadowOffsetY: 4
                        }
                    }
                ]
            };

            chartInstance.setOption(option);

            // 监听点击事件
            chartInstance.on('click', (params) => {
                if (params.data) {
                    emit('nodeClick', params.data);
                }
            });

            // 响应式调整
            window.addEventListener('resize', handleResize);
        };

        const handleResize = () => {
            if (chartInstance) {
                chartInstance.resize();
            }
        };

        onMounted(() => {
            initChart();
        });

        watch(() => props.data, () => {
            initChart();
        }, { deep: true });

        onUnmounted(() => {
            window.removeEventListener('resize', handleResize);
            if (chartInstance) {
                chartInstance.dispose();
            }
        });

        return {
            chartRef
        };
    }
};
</script>

<style scoped>
.echarts-container {
    width: 100%;
    height: 100%;
    min-height: 600px;
}
</style>
