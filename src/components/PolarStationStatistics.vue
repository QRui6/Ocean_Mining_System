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
                        <span class="text-base font-bold text-white tracking-wider" style="text-shadow: 0 0 10px rgba(6, 182, 212, 0.5);">极地科考站统计</span>
                    </div>
                    <button @click="$emit('close')" 
                            class="text-cyan-400 hover:text-white transition-all duration-300 hover:rotate-90">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <!-- 区域切换 -->
                <div class="flex gap-2 px-4 py-2 border-b border-cyan-500/30" style="background: rgba(6, 182, 212, 0.05);">
                    <button 
                        v-for="region in regions" 
                        :key="region.value"
                        @click="currentRegion = region.value"
                        class="flex-1 px-3 py-2 rounded text-sm transition-all"
                        :style="{
                            background: currentRegion === region.value ? 'rgba(6, 182, 212, 0.8)' : 'transparent',
                            color: '#fff',
                            fontWeight: 'bold',
                            border: '1px solid ' + (currentRegion === region.value ? 'rgba(6, 182, 212, 1)' : 'rgba(6, 182, 212, 0.3)'),
                            boxShadow: currentRegion === region.value ? '0 0 15px rgba(6, 182, 212, 0.5)' : 'none'
                        }">
                        {{ region.label }}
                    </button>
                </div>
                
                <!-- 图表内容 -->
                <div class="p-3 space-y-3" style="max-height: calc(100vh - 100px); overflow-y-auto;">
                    <!-- 图表1: 世界各国站点数量 -->
                    <div class="rounded-lg p-2 border border-cyan-500/30" style="background: rgba(15, 23, 42, 0.6);">
                        <h3 class="text-xs font-bold mb-1 text-white">世界各国站点数量</h3>
                        <div ref="chart1" style="width: 100%; height: 220px;"></div>
                    </div>
                    
                    <!-- 图表2: 世界各国驻站人员数量 -->
                    <div class="rounded-lg p-2 border border-cyan-500/30" style="background: rgba(15, 23, 42, 0.6);">
                        <h3 class="text-xs font-bold mb-1 text-white">世界各国驻站人员数量</h3>
                        <div ref="chart2" style="width: 100%; height: 220px;"></div>
                    </div>
                    
                    <!-- 图表3: 不同时间建造数量 -->
                    <div class="rounded-lg p-2 border border-cyan-500/30" style="background: rgba(15, 23, 42, 0.6);">
                        <h3 class="text-xs font-bold mb-1 text-white">科考站建设时间分布（按10年统计）</h3>
                        <div ref="chart3" style="width: 100%; height: 200px;"></div>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
import * as echarts from 'echarts';

export default {
    name: 'PolarStationStatistics',
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['close'],
    data() {
        return {
            currentRegion: 'all',
            regions: [
                { label: '全部', value: 'all' },
                { label: '南极', value: 'antarctic' },
                { label: '北极', value: 'arctic' }
            ],
            chart1Instance: null,
            chart2Instance: null,
            chart3Instance: null,
            chart1ScrollTimer: null,  // 图表1自动滚动定时器
            chart1ScrollPosition: 0,  // 图表1当前滚动位置
            chart2ScrollTimer: null,  // 图表2自动滚动定时器
            chart2ScrollPosition: 0,  // 图表2当前滚动位置
            // 南极科考站数据（根据提供的真实资料）
            antarcticStations: [
                { country: '中国', stations: ['长城站', '中山站', '昆仑站', '泰山站', '秦岭站'], personnel: 266, years: [1985, 1989, 2009, 2014, 2024] },
                { country: '美国', stations: ['麦克默多站', '阿蒙森-斯科特站', '帕尔默站', '伯德站'], personnel: 1430, years: [1956, 1957, 1968, 1957] },
                { country: '俄罗斯', stations: ['东方站', '米尔尼站', '别林斯高晋站', '青年站'], personnel: 175, years: [1957, 1956, 1968, 1962] },
                { country: '澳大利亚', stations: ['莫森站', '戴维斯站', '凯西站'], personnel: 180, years: [1954, 1957, 1957] },
                { country: '阿根廷', stations: ['奥尔卡达斯站', '马兰比奥站', '埃斯佩兰萨站', '圣马丁站'], personnel: 280, years: [1904, 1969, 1952, 1951] },
                { country: '智利', stations: ['弗雷总统站', '奥希金斯站'], personnel: 120, years: [1969, 1948] },
                { country: '日本', stations: ['昭和站', '富士冰鸟站'], personnel: 100, years: [1957, 1995] },
                { country: '法国', stations: ['迪蒙·迪维尔站'], personnel: 40, years: [1956] },
                { country: '法国、意大利', stations: ['康宏站'], personnel: 30, years: [2005] },
                { country: '德国', stations: ['诺伊迈尔3号站'], personnel: 40, years: [1992] },
                { country: '韩国', stations: ['世宗科学基地', '张保皋站'], personnel: 100, years: [1988, 2014] },
                { country: '印度', stations: ['迈特里站', '巴拉提站'], personnel: 72, years: [1989, 2012] },
                { country: '英国', stations: ['哈雷站', '罗瑟拉站'], personnel: 100, years: [1956, 1975] },
                { country: '乌克兰', stations: ['韦尔纳茨基站'], personnel: 25, years: [1996] },
                { country: '新西兰', stations: ['斯科特站'], personnel: 85, years: [1957] },
                { country: '挪威', stations: ['特罗尔站'], personnel: 30, years: [1990] },
                { country: '乌拉圭', stations: ['阿蒂加斯站'], personnel: 36, years: [1984] },
                { country: '波兰', stations: ['亨里克·阿尔托夫斯基站'], personnel: 20, years: [1977] }
            ],
            // 北极科考站数据（根据提供的真实资料）
            arcticStations: [
                { country: '中国', stations: ['北极黄河站', '中冰-北极科考站'], personnel: 40, years: [2004, 2018] },
                { country: '挪威', stations: ['斯瓦尔巴全球种子库', '泽波极地观测站'], personnel: 40, years: [2008, 1968] },
                { country: '法国、德国', stations: ['AWIPEV联合北极科考站'], personnel: 40, years: [2003] },
                { country: '英国', stations: ['英国北极观测站'], personnel: 18, years: [1991] },
                { country: '日本', stations: ['日本北极科考站'], personnel: 14, years: [1991] },
                { country: '意大利', stations: ['迪里吉比莱意大利北极站'], personnel: 9, years: [1997] },
                { country: '韩国', stations: ['韩国北极科考站'], personnel: 12, years: [2002] },
                { country: '印度', stations: ['希马德里北极科考站'], personnel: 9, years: [2008] },
                { country: '美国', stations: ['巴罗观测站', '阿拉斯加北极科研中心'], personnel: 75, years: [1947, 1975] },
                { country: '加拿大', stations: ['高北极科考站', '丘吉尔北方研究中心'], personnel: 55, years: [1947, 1976] },
                { country: '俄罗斯', stations: ['浮冰漂流站', '切柳斯金角水文气象站'], personnel: 35, years: [1937, 1932] },
                { country: '丹麦', stations: ['达内堡科考站', '丹麦港科考站'], personnel: 27, years: [1906, 1941] },
                { country: '瑞典', stations: ['阿比斯库科研站'], personnel: 12, years: [1903] },
                { country: '芬兰', stations: ['芬兰港科考站'], personnel: 7, years: [1913] }
            ]
        };
    },
    computed: {
        currentStations() {
            if (this.currentRegion === 'antarctic') {
                return this.antarcticStations;
            } else if (this.currentRegion === 'arctic') {
                return this.arcticStations;
            } else {
                return [...this.antarcticStations, ...this.arcticStations];
            }
        }
    },
    watch: {
        show(newVal) {
            if (newVal) {
                // 使用setTimeout确保DOM完全渲染
                setTimeout(() => {
                    console.log('🎨 显示面板，重新初始化图表');
                    // 强制重新初始化所有图表
                    this.destroyCharts();
                    this.initCharts();
                }, 100);
            }
        },
        currentRegion() {
            if (this.show) {
                this.$nextTick(() => {
                    this.updateCharts();
                });
            }
        }
    },
    mounted() {
        console.log('🎨 PolarStationStatistics mounted');
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
            console.log('🎨 初始化所有图表');
            console.log('🎨 chart1 ref:', this.$refs.chart1);
            console.log('🎨 chart2 ref:', this.$refs.chart2);
            console.log('🎨 chart3 ref:', this.$refs.chart3);
            this.initChart1();
            this.initChart2();
            this.initChart3();
        },
        
        updateCharts() {
            this.initChart1();
            this.initChart2();
            this.initChart3();
        },
        
        initChart1() {
            if (!this.$refs.chart1) {
                console.warn('⚠️ chart1 ref 不存在');
                return;
            }
            
            console.log('🎨 初始化图表1');
            
            const countryMap = new Map();
            this.currentStations.forEach(station => {
                const current = countryMap.get(station.country) || 0;
                countryMap.set(station.country, current + station.stations.length);
            });
            
            const data = Array.from(countryMap.entries())
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => a.value - b.value);  // 从少到多排序
                // 显示所有数据，不限制数量
            
            // 销毁旧实例
            if (this.chart1Instance) {
                this.chart1Instance.dispose();
                this.chart1Instance = null;
            }
            
            // 创建新实例
            this.chart1Instance = echarts.init(this.$refs.chart1);
            console.log('✅ 图表1实例创建成功');
            
            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    backgroundColor: 'rgba(0, 20, 40, 0.95)',
                    borderColor: '#06b6d4',
                    borderWidth: 1,
                    textStyle: { color: '#fff', fontSize: 12 }
                },
                grid: { left: '18%', right: '8%', top: '3%', bottom: '3%' },
                // 添加dataZoom实现自动滚动
                dataZoom: [{
                    type: 'slider',
                    yAxisIndex: 0,
                    show: false,  // 隐藏滚动条
                    start: 0,
                    end: 30,  // 一次显示30%的数据，确保标签完整显示
                    zoomLock: true,  // 锁定缩放
                    moveOnMouseMove: false
                }],
                xAxis: {
                    type: 'value',
                    axisLabel: { 
                        color: '#ffffff', 
                        fontSize: 12,
                        fontWeight: 600,
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    axisLine: { lineStyle: { color: '#334155' } },
                    splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } }
                },
                yAxis: {
                    type: 'category',
                    data: data.map(d => d.name),
                    axisLabel: { 
                        color: '#ffffff', 
                        fontSize: 12,
                        fontWeight: 600,
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    axisLine: { lineStyle: { color: '#334155' } }
                },
                series: [{
                    type: 'bar',
                    data: data.map(d => d.value),
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                            { offset: 0, color: '#f59e0b' },  // 橙色
                            { offset: 0.5, color: '#f97316' },
                            { offset: 1, color: '#fb923c' }
                        ]),
                        borderRadius: [0, 3, 3, 0],
                        shadowBlur: 8,
                        shadowColor: 'rgba(249, 115, 22, 0.3)',
                        shadowOffsetX: 3
                    },
                    label: { 
                        show: true, 
                        position: 'right', 
                        color: '#ffffff', 
                        fontSize: 12,
                        fontWeight: 'bold',
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    barWidth: '60%'
                }]
            };
            
            this.chart1Instance.setOption(option, true);
            
            // 启动自动滚动
            this.startChart1AutoScroll();
        },
        
        // 启动图表1自动滚动
        startChart1AutoScroll() {
            // 清除旧的定时器
            if (this.chart1ScrollTimer) {
                clearInterval(this.chart1ScrollTimer);
            }
            
            // 每3秒滚动一次
            this.chart1ScrollTimer = setInterval(() => {
                if (!this.chart1Instance) return;
                
                // 每次滚动3%
                this.chart1ScrollPosition += 3;
                
                // 如果滚动到底部，重新开始
                if (this.chart1ScrollPosition >= 70) {
                    this.chart1ScrollPosition = 0;
                }
                
                // 更新dataZoom
                this.chart1Instance.dispatchAction({
                    type: 'dataZoom',
                    start: this.chart1ScrollPosition,
                    end: this.chart1ScrollPosition + 30
                });
            }, 3000);
        },
        
        initChart2() {
            if (!this.$refs.chart2) {
                console.warn('⚠️ chart2 ref 不存在');
                return;
            }
            
            console.log('🎨 初始化图表2');
            
            const countryMap = new Map();
            this.currentStations.forEach(station => {
                const current = countryMap.get(station.country) || 0;
                countryMap.set(station.country, current + station.personnel);
            });
            
            const data = Array.from(countryMap.entries())
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => a.value - b.value);  // 从少到多排序
                // 显示所有数据，不限制数量
            
            // 销毁旧实例
            if (this.chart2Instance) {
                this.chart2Instance.dispose();
                this.chart2Instance = null;
            }
            
            // 创建新实例
            this.chart2Instance = echarts.init(this.$refs.chart2);
            console.log('✅ 图表2实例创建成功');
            
            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    backgroundColor: 'rgba(0, 20, 40, 0.95)',
                    borderColor: '#06b6d4',
                    borderWidth: 1,
                    textStyle: { color: '#fff', fontSize: 12 }
                },
                grid: { left: '8%', right: '5%', top: '3%', bottom: '18%' },
                // 添加dataZoom实现自动滚动
                dataZoom: [{
                    type: 'slider',
                    xAxisIndex: 0,
                    show: false,  // 隐藏滚动条
                    start: 0,
                    end: 35,  // 一次显示35%的数据，确保标签完整显示
                    zoomLock: true,  // 锁定缩放
                    moveOnMouseMove: false
                }],
                xAxis: {
                    type: 'category',
                    data: data.map(d => d.name),
                    axisLabel: { 
                        color: '#ffffff', 
                        fontSize: 11,
                        fontWeight: 600,
                        rotate: 30,
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    axisLine: { lineStyle: { color: '#334155' } }
                },
                yAxis: {
                    type: 'value',
                    name: '人员数',
                    nameTextStyle: { 
                        color: '#ffffff', 
                        fontSize: 12,
                        fontWeight: 600,
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    axisLabel: { 
                        color: '#ffffff', 
                        fontSize: 11,
                        fontWeight: 600,
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    axisLine: { show: false },
                    splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } }
                },
                series: [{
                    type: 'bar',
                    data: data.map(d => d.value),
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 1, 0, 0, [
                            { offset: 0, color: '#8b5cf6' },  // 紫色
                            { offset: 0.5, color: '#a78bfa' },
                            { offset: 1, color: '#c4b5fd' }
                        ]),
                        borderRadius: [3, 3, 0, 0],
                        shadowBlur: 8,
                        shadowColor: 'rgba(139, 92, 246, 0.3)',
                        shadowOffsetY: -3
                    },
                    label: { 
                        show: true, 
                        position: 'top', 
                        color: '#ffffff', 
                        fontSize: 11,
                        fontWeight: 'bold',
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    barWidth: '60%'
                }]
            };
            
            this.chart2Instance.setOption(option, true);
            
            // 启动自动滚动
            this.startChart2AutoScroll();
        },
        
        // 启动图表2自动滚动
        startChart2AutoScroll() {
            // 清除旧的定时器
            if (this.chart2ScrollTimer) {
                clearInterval(this.chart2ScrollTimer);
            }
            
            // 每3秒滚动一次
            this.chart2ScrollTimer = setInterval(() => {
                if (!this.chart2Instance) return;
                
                // 每次滚动3%
                this.chart2ScrollPosition += 3;
                
                // 如果滚动到底部，重新开始
                if (this.chart2ScrollPosition >= 65) {
                    this.chart2ScrollPosition = 0;
                }
                
                // 更新dataZoom
                this.chart2Instance.dispatchAction({
                    type: 'dataZoom',
                    start: this.chart2ScrollPosition,
                    end: this.chart2ScrollPosition + 35
                });
            }, 3000);
        },
        
        initChart3() {
            if (!this.$refs.chart3) {
                console.warn('⚠️ chart3 ref 不存在');
                return;
            }
            
            console.log('🎨 初始化图表3');
            
            const periodMap = new Map();
            this.currentStations.forEach(station => {
                station.years.forEach(year => {
                    const period = Math.floor(year / 10) * 10;
                    const periodLabel = `${period}年代`;
                    const current = periodMap.get(periodLabel) || 0;
                    periodMap.set(periodLabel, current + 1);
                });
            });
            
            const data = Array.from(periodMap.entries())
                .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
            
            // 销毁旧实例
            if (this.chart3Instance) {
                this.chart3Instance.dispose();
                this.chart3Instance = null;
            }
            
            // 创建新实例
            this.chart3Instance = echarts.init(this.$refs.chart3);
            console.log('✅ 图表3实例创建成功');
            
            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(0, 20, 40, 0.95)',
                    borderColor: '#06b6d4',
                    borderWidth: 1,
                    textStyle: { color: '#fff', fontSize: 12 }
                },
                grid: { left: '8%', right: '5%', top: '8%', bottom: '18%' },
                xAxis: {
                    type: 'category',
                    data: data.map(d => d[0]),
                    axisLabel: { 
                        color: '#ffffff', 
                        rotate: 30, 
                        fontSize: 11,
                        fontWeight: 600,
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    axisLine: { lineStyle: { color: '#334155' } }
                },
                yAxis: {
                    type: 'value',
                    name: '站点数',
                    nameTextStyle: { 
                        color: '#ffffff', 
                        fontSize: 12,
                        fontWeight: 600,
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    axisLabel: { 
                        color: '#ffffff', 
                        fontSize: 11,
                        fontWeight: 600,
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    },
                    axisLine: { show: false },
                    splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } }
                },
                series: [{
                    type: 'line',
                    data: data.map(d => d[1]),
                    smooth: true,
                    itemStyle: { color: '#10b981' },  // 绿色
                    lineStyle: { 
                        width: 3,
                        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                            { offset: 0, color: '#10b981' },
                            { offset: 0.5, color: '#34d399' },
                            { offset: 1, color: '#6ee7b7' }
                        ]),
                        shadowBlur: 8,
                        shadowColor: 'rgba(16, 185, 129, 0.3)',
                        shadowOffsetY: 3
                    },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(16, 185, 129, 0.4)' },
                            { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
                        ])
                    },
                    symbol: 'circle',
                    symbolSize: 8,
                    label: { 
                        show: true, 
                        position: 'top', 
                        color: '#ffffff', 
                        fontSize: 11,
                        fontWeight: 'bold',
                        textShadowColor: 'rgba(0, 0, 0, 1)',
                        textShadowBlur: 6,
                        textShadowOffsetX: 2,
                        textShadowOffsetY: 2
                    }
                }]
            };
            
            this.chart3Instance.setOption(option, true);
        },
        
        handleResize() {
            if (this.chart1Instance) this.chart1Instance.resize();
            if (this.chart2Instance) this.chart2Instance.resize();
            if (this.chart3Instance) this.chart3Instance.resize();
        },
        
        destroyCharts() {
            // 清除自动滚动定时器
            if (this.chart1ScrollTimer) {
                clearInterval(this.chart1ScrollTimer);
                this.chart1ScrollTimer = null;
            }
            if (this.chart2ScrollTimer) {
                clearInterval(this.chart2ScrollTimer);
                this.chart2ScrollTimer = null;
            }
            
            if (this.chart1Instance) {
                this.chart1Instance.dispose();
                this.chart1Instance = null;
            }
            if (this.chart2Instance) {
                this.chart2Instance.dispose();
                this.chart2Instance = null;
            }
            if (this.chart3Instance) {
                this.chart3Instance.dispose();
                this.chart3Instance = null;
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
