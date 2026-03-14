<template>
    <transition name="slide-up-panel">
        <div v-if="show" class="fixed bottom-[280px] left-1/2 transform -translate-x-1/2 w-[48rem] bg-slate-900/90 border border-slate-700 text-white shadow-lg z-50 pointer-events-auto rounded">
            
            <!-- 标题栏 -->
            <div class="flex items-center justify-between bg-slate-800/80 px-4 py-2 border-b border-slate-700 rounded-t">
                <span class="text-sm font-medium text-slate-200">北极地区油气资源国家和盆地分布统计</span>
                <button @click="$emit('close')" class="text-slate-400 hover:text-white transition-colors">✕</button>
            </div>

            <!-- 图表内容 -->
            <div class="p-3 space-y-3 max-h-[500px] overflow-y-auto">
                <!-- 图表1: 国家和盆地分布 -->
                <div class="rounded p-2" style="background: rgba(15, 23, 42, 0.4);">
                    <h3 class="text-xs font-medium mb-1 text-slate-300">国家和盆地分布</h3>
                    <div ref="chart1" style="width: 100%; height: 280px;"></div>
                </div>
                
                <!-- 图表2: 国家和地理分布 -->
                <div class="rounded p-2" style="background: rgba(15, 23, 42, 0.4);">
                    <h3 class="text-xs font-medium mb-1 text-slate-300">国家和地理分布</h3>
                    <div ref="chart2" style="width: 100%; height: 280px;"></div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
import * as echarts from 'echarts';

export default {
    name: 'ArcticResourceStatisticsPanel',
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['close'],
    data() {
        return {
            chart1Instance: null,
            chart2Instance: null
        };
    },
    watch: {
        show(newVal) {
            if (newVal) {
                setTimeout(() => {
                    this.destroyCharts();
                    this.initCharts();
                }, 100);
            }
        }
    },
    mounted() {
        if (this.show) {
            this.$nextTick(() => {
                this.initCharts();
            });
        }
        window.addEventListener('resize', this.handleResize);
    },
    beforeUnmount() {
        this.destroyCharts();
        window.removeEventListener('resize', this.handleResize);
    },
    methods: {
        initCharts() {
            this.initChart1();
            this.initChart2();
        },
        
        // 图表1: 国家和盆地分布
        initChart1() {
            if (!this.$refs.chart1) return;
            
            if (this.chart1Instance) {
                this.chart1Instance.dispose();
            }
            
            this.chart1Instance = echarts.init(this.$refs.chart1);
            
            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    backgroundColor: 'rgba(0, 20, 40, 0.95)',
                    borderColor: '#06b6d4',
                    textStyle: { color: '#fff', fontSize: 12 }
                },
                legend: {
                    data: ['原油', '天然气', '凝析油'],
                    textStyle: { 
                        color: '#fff', 
                        fontSize: 11, 
                        fontWeight: 'bold',
                        textShadowColor: 'rgba(0, 0, 0, 0.8)',
                        textShadowBlur: 4
                    },
                    top: '3%',
                    itemWidth: 12,
                    itemHeight: 12
                },
                grid: { left: '3%', right: '1%', top: '15%', bottom: '35%' },
                xAxis: [
                    {
                        type: 'category',
                        data: ['西西伯利亚盆地', '季曼-伯朝拉盆地', '东巴伦支海盆地', '叶尼塞-哈坦加盆地', '勒纳-阿纳巴尔盆地', '巴伦支海台地', '北坡盆地', '马更些三角洲盆地', '斯维尔德普盆地', '基尔拱门盆地', '巴伦支海台地', '沃令盆地', '西巴伦支海陆架边缘', '特伦德拉格地台', '斯瓦尔巴群岛', '斯皮尔伯格第三纪中央盆地', '巴芬盆地'],
                        axisLabel: { 
                            fontSize: 7,
                            rotate: 45,
                            fontWeight: 'bold',
                            textShadowColor: 'rgba(0, 0, 0, 0.8)',
                            textShadowBlur: 4,
                            margin: 20,
                            rich: {
                                russia: { color: '#ef4444', fontWeight: 'bold' },
                                usa: { color: '#3b82f6', fontWeight: 'bold' },
                                canada: { color: '#10b981', fontWeight: 'bold' },
                                norway: { color: '#8b5cf6', fontWeight: 'bold' },
                                denmark: { color: '#f59e0b', fontWeight: 'bold' }
                            },
                            formatter: function(value, index) {
                                if (index <= 5) return '{russia|' + value + '}';
                                if (index === 6) return '{usa|' + value + '}';
                                if (index >= 7 && index <= 9) return '{canada|' + value + '}';
                                if (index >= 10 && index <= 15) return '{norway|' + value + '}';
                                if (index === 16) return '{denmark|' + value + '}';
                                return value;
                            }
                        },
                        axisLine: { lineStyle: { color: '#334155' } },
                        axisTick: { show: true }
                    },
                    {
                        type: 'category',
                        position: 'bottom',
                        offset: 60,
                        data: [
                            '俄罗斯', '', '', '', '', '', '美国', '加拿大', '', '', '挪威', '', '', '', '', '', '丹麦'
                        ],
                        axisLabel: {
                            fontSize: 12,
                            fontWeight: 'bold',
                            textShadowColor: 'rgba(0, 0, 0, 0.8)',
                            textShadowBlur: 4,
                            rich: {
                                russia: { color: '#ef4444', fontWeight: 'bold' },
                                usa: { color: '#3b82f6', fontWeight: 'bold' },
                                canada: { color: '#10b981', fontWeight: 'bold' },
                                norway: { color: '#8b5cf6', fontWeight: 'bold' },
                                denmark: { color: '#f59e0b', fontWeight: 'bold' }
                            },
                            formatter: function(value) {
                                if (value === '俄罗斯') return '{russia|' + value + '}';
                                if (value === '美国') return '{usa|' + value + '}';
                                if (value === '加拿大') return '{canada|' + value + '}';
                                if (value === '挪威') return '{norway|' + value + '}';
                                if (value === '丹麦') return '{denmark|' + value + '}';
                                return value;
                            }
                        },
                        axisLine: { show: false },
                        axisTick: { show: false }
                    }
                ],
                yAxis: {
                    type: 'value',
                    name: '油气可采储量(×10⁸t)',
                    nameTextStyle: { 
                        color: '#ffffff', 
                        fontSize: 10, 
                        fontWeight: 'bold',
                        textShadowColor: 'rgba(0, 0, 0, 0.8)',
                        textShadowBlur: 4
                    },
                    axisLabel: { 
                        color: '#ffffff', 
                        fontSize: 10, 
                        fontWeight: 'bold',
                        textShadowColor: 'rgba(0, 0, 0, 0.8)',
                        textShadowBlur: 4
                    },
                    splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } }
                },
                series: [
                    {
                        name: '原油',
                        type: 'bar',
                        stack: 'total',
                        data: [10, 5, 2, 0, 0, 0, 25, 5, 3, 2, 1, 2, 1, 0.5, 0.5, 0.2, 0.3],
                        itemStyle: { color: '#10b981' }
                    },
                    {
                        name: '天然气',
                        type: 'bar',
                        stack: 'total',
                        data: [320, 15, 20, 5, 0, 5, 5, 8, 12, 6, 4, 3, 2, 1, 1, 0.5, 0.2],
                        itemStyle: { color: '#dc2626' }
                    },
                    {
                        name: '凝析油',
                        type: 'bar',
                        stack: 'total',
                        data: [5, 2, 1, 0, 0, 0, 2, 1, 0.5, 0.3, 0.2, 0.1, 0.1, 0, 0, 0, 0],
                        itemStyle: { color: '#f97316' }
                    }
                ]
            };
            
            this.chart1Instance.setOption(option);
        },
        
        // 图表2: 国家和地理分布
        initChart2() {
            if (!this.$refs.chart2) return;
            
            if (this.chart2Instance) {
                this.chart2Instance.dispose();
            }
            
            this.chart2Instance = echarts.init(this.$refs.chart2);
            
            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    backgroundColor: 'rgba(0, 20, 40, 0.95)',
                    borderColor: '#06b6d4',
                    textStyle: { color: '#fff', fontSize: 12 }
                },
                legend: {
                    data: ['原油', '天然气', '凝析油'],
                    textStyle: { 
                        color: '#fff', 
                        fontSize: 11, 
                        fontWeight: 'bold',
                        textShadowColor: 'rgba(0, 0, 0, 0.8)',
                        textShadowBlur: 4
                    },
                    top: '3%',
                    itemWidth: 12,
                    itemHeight: 12
                },
                grid: { left: '3%', right: '1%', top: '15%', bottom: '35%' },
                xAxis: [
                    {
                        type: 'category',
                        data: ['西西伯利亚盆地', '季曼-伯朝拉盆地', '叶尼塞-哈坦加盆地', '阿拉斯加北坡盆地', '斯瓦尔德鲁普盆地', '马更些三角洲盆地', '巴伦支海台地', '沃令盆地'],
                        axisLabel: { 
                            fontSize: 9,
                            rotate: 45,
                            fontWeight: 'bold',
                            textShadowColor: 'rgba(0, 0, 0, 0.8)',
                            textShadowBlur: 4,
                            margin: 20,
                            rich: {
                                russia: { color: '#ef4444', fontWeight: 'bold' },
                                usa: { color: '#3b82f6', fontWeight: 'bold' },
                                canada: { color: '#10b981', fontWeight: 'bold' },
                                norway: { color: '#8b5cf6', fontWeight: 'bold' }
                            },
                            formatter: function(value, index) {
                                if (index <= 2) return '{russia|' + value + '}';
                                if (index === 3) return '{usa|' + value + '}';
                                if (index === 4 || index === 5) return '{canada|' + value + '}';
                                if (index === 6 || index === 7) return '{norway|' + value + '}';
                                return value;
                            }
                        },
                        axisLine: { lineStyle: { color: '#334155' } },
                        axisTick: { show: true }
                    },
                    {
                        type: 'category',
                        position: 'bottom',
                        offset: 60,
                        data: [
                            '俄罗斯', '', '', '美国', '加拿大', '', '挪威', ''
                        ],
                        axisLabel: {
                            fontSize: 12,
                            fontWeight: 'bold',
                            textShadowColor: 'rgba(0, 0, 0, 0.8)',
                            textShadowBlur: 4,
                            rich: {
                                russia: { color: '#ef4444', fontWeight: 'bold' },
                                usa: { color: '#3b82f6', fontWeight: 'bold' },
                                canada: { color: '#10b981', fontWeight: 'bold' },
                                norway: { color: '#8b5cf6', fontWeight: 'bold' }
                            },
                            formatter: function(value) {
                                if (value === '俄罗斯') return '{russia|' + value + '}';
                                if (value === '美国') return '{usa|' + value + '}';
                                if (value === '加拿大') return '{canada|' + value + '}';
                                if (value === '挪威') return '{norway|' + value + '}';
                                return value;
                            }
                        },
                        axisLine: { show: false },
                        axisTick: { show: false }
                    }
                ],
                yAxis: {
                    type: 'value',
                    name: '油气可采储量(×10⁸t)',
                    nameTextStyle: { 
                        color: '#ffffff', 
                        fontSize: 10, 
                        fontWeight: 'bold',
                        textShadowColor: 'rgba(0, 0, 0, 0.8)',
                        textShadowBlur: 4
                    },
                    axisLabel: { 
                        color: '#ffffff', 
                        fontSize: 10, 
                        fontWeight: 'bold',
                        textShadowColor: 'rgba(0, 0, 0, 0.8)',
                        textShadowBlur: 4
                    },
                    splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } }
                },
                series: [
                    {
                        name: '原油',
                        type: 'bar',
                        stack: 'total',
                        data: [5, 2, 0, 25, 3, 5, 1, 2],
                        itemStyle: { color: '#10b981' }
                    },
                    {
                        name: '天然气',
                        type: 'bar',
                        stack: 'total',
                        data: [320, 15, 5, 5, 12, 8, 4, 3],
                        itemStyle: { color: '#dc2626' }
                    },
                    {
                        name: '凝析油',
                        type: 'bar',
                        stack: 'total',
                        data: [2, 1, 0, 2, 0.5, 1, 0.2, 0.1],
                        itemStyle: { color: '#f97316' }
                    }
                ]
            };
            
            this.chart2Instance.setOption(option);
        },
        
        handleResize() {
            if (this.chart1Instance) this.chart1Instance.resize();
            if (this.chart2Instance) this.chart2Instance.resize();
        },
        
        destroyCharts() {
            if (this.chart1Instance) {
                this.chart1Instance.dispose();
                this.chart1Instance = null;
            }
            if (this.chart2Instance) {
                this.chart2Instance.dispose();
                this.chart2Instance = null;
            }
        }
    }
};
</script>

<style scoped>
.slide-up-panel-enter-active,
.slide-up-panel-leave-active {
    transition: all 0.3s ease;
}

.slide-up-panel-enter-from {
    opacity: 0;
    transform: translate(-50%, 20px);
}

.slide-up-panel-leave-to {
    opacity: 0;
    transform: translate(-50%, 20px);
}
</style>