<template>
    <transition name="slide-left">
        <div v-if="show" class="fixed right-8 top-32 z-30 pointer-events-auto">
            <div class="relative overflow-hidden" style="width: 420px; clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px)); background: linear-gradient(to right, rgba(30, 58, 138, 0.2), rgba(30, 58, 138, 0.25), rgba(30, 58, 138, 0.2)); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 2px solid rgba(6, 182, 212, 0.3); box-shadow: 0 0 40px rgba(6, 182, 212, 0.2);">
                
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
                <div class="relative flex items-center justify-between px-4 py-2 border-b border-cyan-500/30"
                     style="background: rgba(6, 182, 212, 0.08);">
                    <div class="flex items-center gap-2">
                        <div class="w-1 h-5 bg-gradient-to-b from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/50"></div>
                        <span class="text-base font-bold text-white tracking-wider" style="text-shadow: 0 0 10px rgba(6, 182, 212, 0.5);">北极地区油气资源分布</span>
                    </div>
                    <button @click="$emit('close')" 
                            class="text-cyan-400 hover:text-white transition-all duration-300 hover:rotate-90">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <!-- 图表内容 -->
                <div class="p-3 space-y-3" style="max-height: calc(100vh - 100px); overflow-y-auto;">
                    <!-- 图表1: 北极地区油气2P可采储量国家分布特征 -->
                    <div class="rounded-lg p-2 border border-cyan-500/30" style="background: rgba(15, 23, 42, 0.6);">
                        <h3 class="text-xs font-bold mb-1 text-white">北极地区油气2P可采储量国家分布特征</h3>
                        <div class="flex gap-2">
                            <div ref="chart3a" style="width: 50%; height: 200px;"></div>
                            <div ref="chart3b" style="width: 50%; height: 200px;"></div>
                        </div>
                    </div>
                    
                    <!-- 图表2: 北极地区油气累计产量国家分布特征 -->
                    <div class="rounded-lg p-2 border border-cyan-500/30" style="background: rgba(15, 23, 42, 0.6);">
                        <h3 class="text-xs font-bold mb-1 text-white">北极地区油气累计产量国家分布特征</h3>
                        <div class="flex gap-2">
                            <div ref="chart2a" style="width: 50%; height: 200px;"></div>
                            <div ref="chart2b" style="width: 50%; height: 200px;"></div>
                        </div>
                    </div>
                    
                    <!-- 图表3: 北极地区待发现资源量国家海陆分布特征 -->
                    <div class="rounded-lg p-2 border border-cyan-500/30" style="background: rgba(15, 23, 42, 0.6);">
                        <h3 class="text-xs font-bold mb-1 text-white">北极地区待发现资源量国家海陆分布特征</h3>
                        <div ref="chart1" style="width: 100%; height: 280px;"></div>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
import * as echarts from 'echarts';

export default {
    name: 'ArcticResourceCharts',
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
            chart2aInstance: null,
            chart2bInstance: null,
            chart3aInstance: null,
            chart3bInstance: null
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
            this.initChart3();
        },
        
        // 图表1: 堆叠柱状图
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
                    borderWidth: 1,
                    textStyle: { color: '#fff', fontSize: 13 }
                },
                legend: {
                    data: ['陆地', '海域'],
                    textStyle: { 
                        color: '#fff', 
                        fontSize: 13, 
                        fontWeight: 'bold',
                        textShadowColor: 'rgba(0, 0, 0, 0.8)',
                        textShadowBlur: 4,
                        textShadowOffsetX: 1,
                        textShadowOffsetY: 1
                    },
                    top: '3%'
                },
                grid: { left: '10%', right: '5%', top: '15%', bottom: '20%' },
                xAxis: {
                    type: 'category',
                    data: ['俄罗斯', '美国', '加拿大', '挪威', '丹麦', '大洋盆地'],
                    axisLabel: { 
                        color: '#ffffff', 
                        fontSize: 12,
                        rotate: 25,
                        fontWeight: 'bold',
                        textShadowColor: 'rgba(0, 0, 0, 0.8)',
                        textShadowBlur: 4,
                        textShadowOffsetX: 1,
                        textShadowOffsetY: 1
                    },
                    axisLine: { lineStyle: { color: '#334155' } }
                },
                yAxis: {
                    type: 'value',
                    name: '待发现可采资源量(×10⁸t)',
                    nameTextStyle: { 
                        color: '#ffffff', 
                        fontSize: 12, 
                        fontWeight: 'bold',
                        textShadowColor: 'rgba(0, 0, 0, 0.8)',
                        textShadowBlur: 4,
                        textShadowOffsetX: 1,
                        textShadowOffsetY: 1
                    },
                    axisLabel: { 
                        color: '#ffffff', 
                        fontSize: 12, 
                        fontWeight: 'bold',
                        textShadowColor: 'rgba(0, 0, 0, 0.8)',
                        textShadowBlur: 4,
                        textShadowOffsetX: 1,
                        textShadowOffsetY: 1
                    },
                    splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } }
                },
                series: [
                    {
                        name: '陆地',
                        type: 'bar',
                        stack: 'total',
                        data: [320, 70, 10, 5, 0, 0],
                        itemStyle: { color: '#f97316' },
                        label: { show: false }
                    },
                    {
                        name: '海域',
                        type: 'bar',
                        stack: 'total',
                        data: [380, 240, 50, 5, 60, 60],
                        itemStyle: { color: '#3b82f6' },
                        label: { show: false }
                    }
                ]
            };
            
            this.chart1Instance.setOption(option);
        },
        
        // 图表2: 饼图 - 油气累计产量
        initChart2() {
            if (!this.$refs.chart2a || !this.$refs.chart2b) return;
            
            // 石油饼图
            if (this.chart2aInstance) {
                this.chart2aInstance.dispose();
            }
            this.chart2aInstance = echarts.init(this.$refs.chart2a);
            
            const oilOption = {
                backgroundColor: 'transparent',
                title: {
                    text: '石油',
                    left: 'center',
                    top: '5%',
                    textStyle: { 
                        color: '#fff', 
                        fontSize: 14, 
                        fontWeight: 'bold',
                        textShadowColor: 'rgba(0, 0, 0, 0.8)',
                        textShadowBlur: 4,
                        textShadowOffsetX: 1,
                        textShadowOffsetY: 1
                    }
                },
                tooltip: {
                    trigger: 'item',
                    backgroundColor: 'rgba(0, 20, 40, 0.95)',
                    borderColor: '#06b6d4',
                    textStyle: { color: '#fff', fontSize: 13 },
                    formatter: '{b}: {d}%'
                },
                legend: {
                    orient: 'horizontal',
                    bottom: '0%',
                    textStyle: { 
                        color: '#fff', 
                        fontSize: 11, 
                        fontWeight: 'bold',
                        textShadowColor: 'rgba(0, 0, 0, 0.8)',
                        textShadowBlur: 4,
                        textShadowOffsetX: 1,
                        textShadowOffsetY: 1
                    },
                    itemWidth: 12,
                    itemHeight: 12
                },
                series: [{
                    type: 'pie',
                    radius: ['35%', '65%'],
                    center: ['50%', '45%'],
                    data: [
                        { value: 32, name: '俄罗斯', itemStyle: { color: '#dc2626' } },
                        { value: 67, name: '美国', itemStyle: { color: '#fbbf24' } },
                        { value: 1, name: '挪威', itemStyle: { color: '#a3a3a3' } }
                    ],
                    label: {
                        show: true,
                        position: 'inside',
                        formatter: '{d}%',
                        fontSize: 15,
                        color: '#fff',
                        fontWeight: 'bold',
                        textShadowColor: 'rgba(0, 0, 0, 0.9)',
                        textShadowBlur: 5,
                        textShadowOffsetX: 1,
                        textShadowOffsetY: 1
                    },
                    labelLine: { show: false }
                }]
            };
            
            this.chart2aInstance.setOption(oilOption);
            
            // 天然气饼图
            if (this.chart2bInstance) {
                this.chart2bInstance.dispose();
            }
            this.chart2bInstance = echarts.init(this.$refs.chart2b);
            
            const gasOption = {
                backgroundColor: 'transparent',
                title: {
                    text: '天然气',
                    left: 'center',
                    top: '5%',
                    textStyle: { 
                        color: '#fff', 
                        fontSize: 14, 
                        fontWeight: 'bold',
                        textShadowColor: 'rgba(0, 0, 0, 0.8)',
                        textShadowBlur: 4,
                        textShadowOffsetX: 1,
                        textShadowOffsetY: 1
                    }
                },
                tooltip: {
                    trigger: 'item',
                    backgroundColor: 'rgba(0, 20, 40, 0.95)',
                    borderColor: '#06b6d4',
                    textStyle: { color: '#fff', fontSize: 13 },
                    formatter: '{b}: {d}%'
                },
                legend: {
                    orient: 'horizontal',
                    bottom: '0%',
                    textStyle: { 
                        color: '#fff', 
                        fontSize: 11, 
                        fontWeight: 'bold',
                        textShadowColor: 'rgba(0, 0, 0, 0.8)',
                        textShadowBlur: 4,
                        textShadowOffsetX: 1,
                        textShadowOffsetY: 1
                    },
                    itemWidth: 12,
                    itemHeight: 12
                },
                series: [{
                    type: 'pie',
                    radius: ['35%', '65%'],
                    center: ['50%', '45%'],
                    data: [
                        { value: 96, name: '俄罗斯', itemStyle: { color: '#dc2626' } },
                        { value: 3, name: '美国', itemStyle: { color: '#fbbf24' } },
                        { value: 1, name: '挪威', itemStyle: { color: '#a3a3a3' } },
                        { value: 0.002, name: '加拿大', itemStyle: { color: '#3b82f6' } }
                    ],
                    label: {
                        show: true,
                        position: 'inside',
                        formatter: function(params) {
                            // 只显示大于1%的标签
                            return params.percent > 1 ? params.percent + '%' : '';
                        },
                        fontSize: 15,
                        color: '#fff',
                        fontWeight: 'bold',
                        textShadowColor: 'rgba(0, 0, 0, 0.9)',
                        textShadowBlur: 5,
                        textShadowOffsetX: 1,
                        textShadowOffsetY: 1
                    },
                    labelLine: { show: false }
                }]
            };
            
            this.chart2bInstance.setOption(gasOption);
        },
        
        // 图表3: 饼图 - 2P可采储量
        initChart3() {
            if (!this.$refs.chart3a || !this.$refs.chart3b) return;
            
            // 石油饼图
            if (this.chart3aInstance) {
                this.chart3aInstance.dispose();
            }
            this.chart3aInstance = echarts.init(this.$refs.chart3a);
            
            const oilOption = {
                backgroundColor: 'transparent',
                title: {
                    text: '石油',
                    left: 'center',
                    top: '5%',
                    textStyle: { 
                        color: '#fff', 
                        fontSize: 14, 
                        fontWeight: 'bold',
                        textShadowColor: 'rgba(0, 0, 0, 0.8)',
                        textShadowBlur: 4,
                        textShadowOffsetX: 1,
                        textShadowOffsetY: 1
                    }
                },
                tooltip: {
                    trigger: 'item',
                    backgroundColor: 'rgba(0, 20, 40, 0.95)',
                    borderColor: '#06b6d4',
                    textStyle: { color: '#fff', fontSize: 13 },
                    formatter: '{b}: {d}%'
                },
                legend: {
                    orient: 'horizontal',
                    bottom: '0%',
                    textStyle: { 
                        color: '#fff', 
                        fontSize: 11, 
                        fontWeight: 'bold',
                        textShadowColor: 'rgba(0, 0, 0, 0.8)',
                        textShadowBlur: 4,
                        textShadowOffsetX: 1,
                        textShadowOffsetY: 1
                    },
                    itemWidth: 12,
                    itemHeight: 12
                },
                series: [{
                    type: 'pie',
                    radius: ['35%', '65%'],
                    center: ['50%', '45%'],
                    data: [
                        { value: 52, name: '俄罗斯', itemStyle: { color: '#dc2626' } },
                        { value: 43, name: '美国', itemStyle: { color: '#fbbf24' } },
                        { value: 3, name: '加拿大', itemStyle: { color: '#3b82f6' } },
                        { value: 2, name: '挪威', itemStyle: { color: '#a3a3a3' } }
                    ],
                    label: {
                        show: true,
                        position: 'inside',
                        formatter: '{d}%',
                        fontSize: 15,
                        color: '#fff',
                        fontWeight: 'bold',
                        textShadowColor: 'rgba(0, 0, 0, 0.9)',
                        textShadowBlur: 5,
                        textShadowOffsetX: 1,
                        textShadowOffsetY: 1
                    },
                    labelLine: { show: false }
                }]
            };
            
            this.chart3aInstance.setOption(oilOption);
            
            // 天然气饼图
            if (this.chart3bInstance) {
                this.chart3bInstance.dispose();
            }
            this.chart3bInstance = echarts.init(this.$refs.chart3b);
            
            const gasOption = {
                backgroundColor: 'transparent',
                title: {
                    text: '天然气',
                    left: 'center',
                    top: '5%',
                    textStyle: { 
                        color: '#fff', 
                        fontSize: 14, 
                        fontWeight: 'bold',
                        textShadowColor: 'rgba(0, 0, 0, 0.8)',
                        textShadowBlur: 4,
                        textShadowOffsetX: 1,
                        textShadowOffsetY: 1
                    }
                },
                tooltip: {
                    trigger: 'item',
                    backgroundColor: 'rgba(0, 20, 40, 0.95)',
                    borderColor: '#06b6d4',
                    textStyle: { color: '#fff', fontSize: 13 },
                    formatter: '{b}: {d}%'
                },
                legend: {
                    orient: 'horizontal',
                    bottom: '0%',
                    textStyle: { 
                        color: '#fff', 
                        fontSize: 11, 
                        fontWeight: 'bold',
                        textShadowColor: 'rgba(0, 0, 0, 0.8)',
                        textShadowBlur: 4,
                        textShadowOffsetX: 1,
                        textShadowOffsetY: 1
                    },
                    itemWidth: 12,
                    itemHeight: 12
                },
                series: [{
                    type: 'pie',
                    radius: ['35%', '65%'],
                    center: ['50%', '45%'],
                    data: [
                        { value: 91, name: '俄罗斯', itemStyle: { color: '#dc2626' } },
                        { value: 4, name: '美国', itemStyle: { color: '#fbbf24' } },
                        { value: 2, name: '加拿大', itemStyle: { color: '#3b82f6' } },
                        { value: 2, name: '挪威', itemStyle: { color: '#a3a3a3' } },
                        { value: 1, name: '丹麦', itemStyle: { color: '#10b981' } }
                    ],
                    label: {
                        show: true,
                        position: 'inside',
                        formatter: function(params) {
                            // 只显示大于1%的标签
                            return params.percent > 1 ? params.percent + '%' : '';
                        },
                        fontSize: 15,
                        color: '#fff',
                        fontWeight: 'bold',
                        textShadowColor: 'rgba(0, 0, 0, 0.9)',
                        textShadowBlur: 5,
                        textShadowOffsetX: 1,
                        textShadowOffsetY: 1
                    },
                    labelLine: { show: false }
                }]
            };
            
            this.chart3bInstance.setOption(gasOption);
        },
        
        handleResize() {
            if (this.chart1Instance) this.chart1Instance.resize();
            if (this.chart2aInstance) this.chart2aInstance.resize();
            if (this.chart2bInstance) this.chart2bInstance.resize();
            if (this.chart3aInstance) this.chart3aInstance.resize();
            if (this.chart3bInstance) this.chart3bInstance.resize();
        },
        
        destroyCharts() {
            if (this.chart1Instance) {
                this.chart1Instance.dispose();
                this.chart1Instance = null;
            }
            if (this.chart2aInstance) {
                this.chart2aInstance.dispose();
                this.chart2aInstance = null;
            }
            if (this.chart2bInstance) {
                this.chart2bInstance.dispose();
                this.chart2bInstance = null;
            }
            if (this.chart3aInstance) {
                this.chart3aInstance.dispose();
                this.chart3aInstance = null;
            }
            if (this.chart3bInstance) {
                this.chart3bInstance.dispose();
                this.chart3bInstance = null;
            }
        }
    }
};
</script>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active {
    transition: all 0.3s ease;
}

.slide-left-enter-from {
    transform: translateX(100%);
    opacity: 0;
}

.slide-left-leave-to {
    transform: translateX(100%);
    opacity: 0;
}
</style>
