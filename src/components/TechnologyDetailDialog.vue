<template>
    <transition name="fade-scale">
        <div v-if="show && technology" class="fixed inset-0 z-60 flex items-center justify-center pointer-events-none">
            <!-- 遮罩层 -->
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" @click="$emit('close')"></div>
            
            <!-- 详情面板 -->
            <div class="relative w-[1500px] max-h-[85vh] tech-panel-enhanced pointer-events-auto overflow-hidden rounded-xl">
                <!-- 顶部装饰线 -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                
                <!-- 关闭按钮 -->
                <button 
                    @click="$emit('close')"
                    class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-red-500/20 hover:bg-red-500/40 border border-red-500 rounded transition-all group z-10"
                >
                    <svg class="w-5 h-5 text-red-400 group-hover:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
                
                <!-- 标题栏 -->
                <div class="flex items-center px-6 pt-4 pb-3 border-b-2 border-cyan-500/30">
                    <div class="w-1.5 h-6 bg-yellow-400 mr-3 shadow-[0_0_10px_#facc15]"></div>
                    <h3 class="text-2xl font-bold text-white tracking-wider flex-1">{{ technology.name }}</h3>
                    <div class="text-xs font-['Orbitron'] text-cyan-500 opacity-80 font-bold tracking-widest">TECHNOLOGY DETAIL</div>
                </div>
                
                <!-- 内容区域 -->
                <div class="flex h-[calc(85vh-80px)]">
                    <!-- 左侧：成熟度图表 50% -->
                    <div class="w-[50%] p-4 border-r border-slate-700/50">
                        <div class="bg-slate-900/50 rounded-lg border border-cyan-500/20 h-full">
                            <div class="text-center text-cyan-400 text-sm font-bold py-2 border-b border-cyan-500/20">技术成熟度路线图</div>
                            <div ref="chartRef" class="w-full h-[calc(100%-40px)]"></div>
                        </div>
                    </div>
                    
                    <!-- 右侧：风险优先度图表和文字 50% -->
                    <div class="w-[50%] p-4 flex flex-col gap-4">
                        <!-- 风险优先度图表区域 -->
                        <div class="flex-1 bg-slate-900/50 rounded-lg border border-cyan-500/20 overflow-hidden">
                            <div class="text-center text-cyan-400 text-sm font-bold py-2 border-b border-cyan-500/20">技术风险与研发优先度</div>
                            <div ref="riskChartRef" class="w-full h-[calc(100%-40px)]"></div>
                        </div>
                        
                        <!-- 可折叠的详细介绍 -->
                        <div class="bg-slate-900/50 rounded-lg border border-cyan-500/20 overflow-hidden transition-all" :class="isExpanded ? 'flex-1' : 'h-auto'">
                            <button 
                                @click="isExpanded = !isExpanded"
                                class="w-full flex items-center justify-between px-4 py-2 text-cyan-400 hover:bg-cyan-500/10 transition-colors border-b border-cyan-500/20"
                            >
                                <h4 class="text-sm font-bold">详细介绍</h4>
                                <svg 
                                    class="w-4 h-4 transition-transform" 
                                    :class="isExpanded ? 'rotate-180' : ''"
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                </svg>
                            </button>
                            <div v-show="isExpanded" class="p-4 overflow-y-auto custom-scrollbar" style="max-height: 300px;">
                                <p class="text-slate-300 text-xs leading-relaxed">
                                    {{ technology.details }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
import { ref, watch, nextTick } from 'vue';
import * as echarts from 'echarts';

export default {
    props: {
        show: {
            type: Boolean,
            default: false
        },
        technology: {
            type: Object,
            default: null
        }
    },
    emits: ['close'],
    setup(props) {
        const chartRef = ref(null);
        const riskChartRef = ref(null);
        const isExpanded = ref(false);
        let chartInstance = null;
        let riskChartInstance = null;
        
        // 技术风险和研发优先度数据配置
        const techRiskPriorityConfig = {
            '通用技术': {
                subTechs: [
                    { name: '传感器', risk: 3, priority: 3 },
                    { name: '数据组网与通信', risk: 2, priority: 2 },
                    { name: '新能源', risk: 2, priority: 1 },
                    { name: '新材料', risk: 1, priority: 2 },
                    { name: '智能控制技术', risk: 1, priority: 2 },
                    { name: '数字化技术', risk: 2, priority: 3 },
                    { name: '水下航行器', risk: 1, priority: 3 }
                ]
            },
            '勘探技术': {
                subTechs: [
                    { name: '深海声学遥测勘探技术', risk: 2, priority: 3 },
                    { name: '近底光学精准勘探技术', risk: 2, priority: 2 },
                    { name: '深海电法勘探技术', risk: 2, priority: 1 },
                    { name: '深海磁学勘探技术', risk: 2, priority: 2 },
                    { name: '深海原位保真取样测试及智能评价技术', risk: 1, priority: 3 }
                ]
            },
            '平台技术': {
                subTechs: [
                    { name: '平台总体技术', risk: 1, priority: 2 },
                    { name: '布放回收技术', risk: 2, priority: 3 },
                    { name: '平台能源供给技术', risk: 1, priority: 1 },
                    { name: '作业安全与运维保障技术', risk: 3, priority: 2 }
                ]
            },
            '开采技术': {
                subTechs: [
                    { name: '深海采矿系统总体技术', risk: 2, priority: 3 },
                    { name: '深海多金属结核开采技术', risk: 1, priority: 2 },
                    { name: '深海多金属硫化物开采技术', risk: 2, priority: 3 },
                    { name: '深海富钴结壳开采技术', risk: 2, priority: 2 },
                    { name: '深海稀土开采技术', risk: 3, priority: 1 },
                    { name: '深海水力式矿物提升技术', risk: 1, priority: 3 },
                    { name: '深海气力式矿物提升技术', risk: 2, priority: 2 },
                    { name: '深海新型提升技术', risk: 3, priority: 2 }
                ]
            },
            '环境技术': {
                subTechs: [
                    { name: '环境监测技术', risk: 3, priority: 3 },
                    { name: '环境影响评价技术', risk: 2, priority: 2 },
                    { name: '环境管理技术', risk: 2, priority: 2 },
                    { name: '环境修复技术', risk: 3, priority: 1 }
                ]
            },
            '选冶技术': {
                subTechs: [
                    { name: '多金属结核选冶技术', risk: 1, priority: 3 },
                    { name: '富钴结壳选冶技术', risk: 2, priority: 2 },
                    { name: '多金属硫化物选冶技术', risk: 2, priority: 2 },
                    { name: '稀土沉积物选冶技术', risk: 3, priority: 1 }
                ]
            },
            '管理支撑技术': {
                subTechs: [
                    { name: '矿区开发决策支撑技术', risk: 2, priority: 3 },
                    { name: '矿区开发规章制度保障技术', risk: 2, priority: 2 },
                    { name: '深海矿产资源开发综合试验场', risk: 3, priority: 2 }
                ]
            }
        };
        
        // 技术数据配置
        const techDataConfig = {
            '通用技术': {
                technologies: [
                    '深海表生矿产资源金属品位的原位传感技术','麦士矿地质空间分布高分辨率三维传感技术','深海采矿车声学基阵定位传感技术',
                    '深海采矿立管分布式应变及振动监测技术','深海输送管道非接触式在线流体体积监测技术','近海底三维环境精确感知技术',
                    '深海采矿作业系统智能协同组网技术','深海采矿作业系统多模通信技术','跨水-空声学超表面技术',
                    '深海高功率密度安全固态锂电池技术','10MW级模块化超小核反应堆海底发电技术','深海采矿车用高能量密度零碳动力技术',
                    '多相强韧耐磨复合材料','金属表面防护复合涂层材料','多模态认知框架与深海图像重建技术',
                    '深海采矿车类脑智能调控技术','多源海量数据驱动标准制定及存储技术','深海采矿全生命周期三维仿真重建技术',
                    '深海采矿系统集群鲁棒安全端边云协同技术','沉浸式深海采矿数字空间漫游技术','深海矿区环境探测航行器','深海采矿智能运维机器人'
                ],
                data: [
                    [2,0,2024],[3,0,2030],[4,0,2035], [2,1,2024],[3,1,2030],[4,1,2035], [2,2,2024],[3,2,2030],[4,2,2035],
                    [1,3,2024],[3,3,2030],[4,3,2035], [1,4,2024],[3,4,2030],[4,4,2035], [1,5,2024],[3,5,2030],[4,5,2035],
                    [1,6,2024],[3,6,2030],[4,6,2035], [2,7,2024],[3,7,2030],[5,7,2035], [1,8,2024],[3,8,2030],[4,8,2035],
                    [2,9,2024],[3,9,2030],[5,9,2035], [0,10,2024],[1,10,2030],[3,10,2035], [1,11,2024],[3,11,2030],[5,11,2035],
                    [1,12,2024],[3,12,2030],[4,12,2035], [1,13,2024],[3,13,2030],[4,13,2035], [1,14,2024],[3,14,2030],[4,14,2035],
                    [2,15,2024],[3,15,2030],[4,15,2035], [2,16,2024],[3,16,2030],[4,16,2035], [1,17,2024],[2,17,2030],[3,17,2035],
                    [1,18,2024],[3,18,2030],[4,18,2035], [1,19,2024],[3,19,2030],[4,19,2035], [3,20,2024],[4,20,2030],[5,20,2035],
                    [1,21,2024],[3,21,2030],[4,21,2035]
                ]
            },
            '勘探技术': {
                technologies: [
                    '近底参量声学结壳剖面探测技术','近底高频多波束地形地貌探测技术','深海近底高频声纳3D成像技术',
                    '深海组合式宽频OBS探测技术','近底多道地震成像技术','水下合成孔径声纳成像技术',
                    '深海声学基阵高精度导航定位技术','深海近底三维激光扫描探测技术','水下偏振光学成像及数字增强技术',
                    '深海宽域高光谱成像及光谱补偿技术','水下三维光学视觉测距和距离透视技术','水下激光多普勒测速技术',
                    '深海近底高密度电法探测技术','深海近底瞬变电磁探测技术','深海近底可控源电法探测技术',
                    '深海近底铯光泵磁法精准勘探技术','深海弱磁型磁异常勘探技术','近底矢量阵磁法精准勘探技术',
                    '高精度自补偿磁法探测技术','深海原位大深度保真取样技术','深海随钻测量及多参数测井技术',
                    '深海矿产微生物勘探技术','基于机器学习的资源储量评估技术','数字矿区探、采、监一张图系统'
                ],
                data: [
                    [1,0,2024],[3,0,2030],[5,0,2035], [2,1,2024],[3,1,2030],[5,1,2035], [2,2,2024],[3,2,2030],[4,2,2035],
                    [4,3,2030],[5,3,2035], [1,4,2024],[3,4,2030],[4,4,2035], [1,5,2024],[3,5,2030],[4,5,2035],
                    [3,6,2024],[4,6,2030],[5,6,2035], [1,7,2024],[3,7,2030],[4,7,2035], [1,8,2024],[3,8,2030],[4,8,2035],
                    [1,9,2024],[3,9,2030],[4,9,2035], [1,10,2024],[3,10,2030],[4,10,2035], [0,11,2024],[1,11,2030],[3,11,2035],
                    [1,12,2024],[3,12,2030],[4,12,2035], [1,13,2024],[3,13,2030],[4,13,2035], [1,14,2024],[3,14,2030],[4,14,2035],
                    [1,15,2024],[3,15,2030],[4,15,2035], [0,16,2024],[1,16,2030],[3,16,2035], [1,17,2024],[3,17,2030],[4,17,2035],
                    [1,18,2024],[3,18,2030],[4,18,2035], [3,19,2024],[4,19,2030],[5,19,2035], [1,20,2024],[3,20,2030],[4,20,2035],
                    [1,21,2024],[3,21,2030],[4,21,2035], [1,22,2024],[3,22,2030],[4,22,2035], [1,23,2024],[3,23,2030],[4,23,2035]
                ]
            },
            '平台技术': {
                technologies: [
                    '深海采矿试验船总体技术','商业化深海采矿开采平台总体技术','深海采矿-选矿-冶炼一体化平台总体技术',
                    '深海采矿系统中央控制及水面-水下协同作业技术','深海采矿矿物预处理与存储、转运技术','深海采矿水面作业支持总体技术',
                    '深海重载采矿车布放回收技术','深海输矿泵管及脐带缆系统布放回收技术','深海重载超长泵管系统柔性悬挂技术',
                    '深海采矿水面平台核动力应用技术','深海大功率动力输配技术','深海采矿零碳能源工厂技术',
                    '深海采矿陆海跨洋远程支持技术','深远海采矿作业系统维修性技术','深海采矿系统健康监测及风险评估技术',
                    '深海采矿系统应急避险技术'
                ],
                data: [
                    [2,0,2024],[3,0,2030],[4,0,2035], [2,1,2024],[3,1,2030],[4,1,2035], [0,2,2024],[2,2,2030],[3,2,2035],
                    [2,3,2024],[3,3,2030],[4,3,2035], [2,4,2024],[3,4,2030],[4,4,2035], [2,5,2024],[3,5,2030],[4,5,2035],
                    [2,6,2024],[3,6,2030],[4,6,2035], [2,7,2024],[3,7,2030],[4,7,2035], [2,8,2024],[3,8,2030],[4,8,2035],
                    [2,9,2024],[3,9,2030],[4,9,2035], [2,10,2024],[3,10,2030],[4,10,2035], [0,11,2024],[2,11,2030],[3,11,2035],
                    [0,12,2024],[1,12,2030],[2,12,2035], [0,13,2024],[1,13,2024],[2,13,2030],[3,13,2035], [0,14,2024],[1,14,2024],[2,14,2030],[3,14,2035],
                    [1,15,2024],[2,15,2030],[4,15,2035]
                ]
            },
            '开采技术': {
                technologies: [
                    '深海多金属结核智能穿梭式采矿技术','深海矿产采集-输送联动分析技术','水下装备动力输配及能源供给技术',
                    '高噪声水下组网与协同作业指挥技术','深海多金属结核采矿车总体设计及集成技术','深海多金属结核高效低扰动低噪声水力采集技术',
                    '软底质海底自主运动及稳健定迹快速行走技术','多金属结核高效低扰动机械式采集技术','深海多金属结核水力化筛选及运输技术',
                    '深海多金属结核浮游式开采关键技术','深海二氧化碳射流兼碳封存采矿技术','深海多金属琉化物采矿车总体设计及集成技术',
                    '深海海庭硬压块状矿产切削采集技术','深海硬底质复杂地貌自适应运动控制与稳健行走技术','深海超高压磨料射流多金属硫化物智能采掘技术',
                    '多机采集系统协同控制与复杂地形自适应技术','深海富钻结壳采矿车总体设计及集技术','薄层结壳矿的自适应低贫化剥离技术',
                    '富钻结壳矿区微地形特征下的多履带行驶技术','网格化切割富钴结壳矿层及矿物分离技术','深海海底软质散体矿产海底采选一体化作业模式探索',
                    '深海海底软质散体矿产封闭采集技术','深海海底软质散体矿产原位分选技术','高扬程大流量深海粗频粒矿石水力提升泵技术',
                    '高可靠抗疲劳快速布放回收硬管系统设计技术','大口径高耐磨耐疲劳深海采矿软管输送系统技术','6000m水力提升全软管采矿系统集群海试验证技术',
                    '深海中继站总体设计及集成技术','大产能高可靠性深海矿石气力提升技术','气力与水力举升协同作用的矿物提升技术',
                    '气-水力混合深海矿石提升立管系统设计技术','矿石气力提升泵设计控制与试验验证技术','气力提升软管内气-固-液流型演变与阻塞调控技术',
                    '深海矿石无泵送:式快速提升技术','高强轻质料仓快速提升缆及配套动力技术','机械-水力混合式深海矿物提升技术'
                ],
                data: [
                    [1,0,2024],[2,0,2030],[3,0,2035], [2,1,2024],[3,1,2030],[4,1,2035], [2,2,2024],[3,2,2030],[4,2,2035],
                    [2,3,2024],[3,3,2030],[4,3,2035], [2,4,2024],[3,4,2030],[4,4,2035], [3,5,2024],[4,5,2030],[5,5,2035],
                    [3,6,2024],[4,6,2030],[5,6,2035], [2,7,2024],[3,7,2030],[4,7,2035], [1,8,2024],[2,8,2030],[3,8,2035],
                    [2,9,2024],[3,9,2030],[4,9,2035], [2,10,2024],[3,10,2030],[4,10,2035], [2,11,2024],[3,11,2030],[4,11,2035],
                    [2,12,2024],[3,12,2030],[4,12,2035], [2,13,2024],[3,13,2030],[4,13,2035], [1,14,2024],[2,14,2030],[3,14,2035],
                    [2,15,2024],[3,15,2030],[4,15,2035], [2,16,2024],[3,16,2030],[4,16,2035], [2,17,2024],[3,17,2030],[4,17,2035],
                    [2,18,2024],[3,18,2030],[4,18,2035], [1,19,2024],[2,19,2030],[3,19,2035], [1,20,2024],[2,20,2030],[3,20,2035],
                    [0,21,2024],[1,21,2030],[2,21,2035], [0,22,2024],[1,22,2024],[2,22,2030],[3,22,2035], [3,23,2024],[4,23,2030],[5,23,2035],
                    [2,24,2024],[3,24,2030],[4,24,2035], [1,25,2024],[2,25,2030],[3,25,2035], [2,26,2024],[3,26,2030],[4,26,2035],
                    [2,27,2024],[3,27,2030],[4,27,2035], [1,28,2024],[2,28,2030],[3,28,2035], [1,29,2024],[2,29,2030],[3,29,2035],
                    [1,30,2024],[2,30,2030],[3,30,2035], [1,31,2024],[2,31,2030],[3,31,2035], [1,32,2024],[2,32,2030],[3,32,2035],
                    [2,33,2024],[3,33,2030],[4,33,2035], [2,34,2024],[3,34,2030],[4,34,2035], [2,35,2024],[3,35,2030],[4,35,2035]
                ]
            },
            '环境技术': {
                technologies: [
                    '海底低扰动精准监测技术','深海采矿羽流原位监测技术','全水柱剖面环境监测技术',
                    '海表层矿污染的卫星遥感监测技术','矿区生物群落自动化原位监测技术','采矿车行走影响评估技术',
                    '深海采矿声光振影响评估技术','深海采矿羽流释放关键元素的定量评价技术','深海采矿累积影响评价技术',
                    '深海采矿碳排放评估关键技术','深海矿区原位环境模拟和试验技术','深海采矿全生命周期环境管理技术',
                    '深海采矿活动突发污染事件预测预警技术','深海采矿环境影响减缓技术','矿区生境快速修复技术',
                    '矿区生物群落的人工干预恢复技术','深海采矿生物多样性损失异地补偿技术'
                ],
                data: [
                    [2,0,2024],[3,0,2030],[4,0,2035], [2,1,2024],[3,1,2030],[5,1,2035], [2,2,2024],[3,2,2030],[4,2,2035],
                    [1,3,2024],[3,3,2030],[4,3,2035], [2,4,2024],[3,4,2030],[4,4,2035], [1,5,2024],[3,5,2030],[4,5,2035],
                    [1,6,2024],[3,6,2030],[4,6,2035], [1,7,2024],[2,7,2030],[4,7,2035], [1,8,2024],[3,8,2030],[4,8,2035],
                    [0,9,2024],[2,9,2030],[3,9,2035], [1,10,2024],[2,10,2030],[3,10,2035], [1,11,2024],[2,11,2030],[3,11,2035],
                    [1,12,2024],[2,12,2030],[3,12,2035], [2,13,2024],[3,13,2030],[4,13,2035], [2,14,2024],[3,14,2030],[4,14,2035],
                    [0,15,2024],[1,15,2030],[3,15,2035], [0,16,2024],[1,16,2030],[2,16,2035]
                ]
            },
            '选冶技术': {
                technologies: [
                    '多金属结核船载选冶预富集技术','多金属结核低碳高效提取技术','富钴结壳船载抛尾预富集技术',
                    '富钴结壳低碳高效提取技术','多金属硫化物船载高效分离富集技术','多金属硫化物低碳清洁强化提取回收技术',
                    '多金属硫化物与不同类型深海资源耦合冶炼技术','深海稀土船载预抛废富集技术','深海稀土清洁高效提取与富集技术'
                ],
                data: [
                    [0,0,2024],[1,0,2030],[2,0,2035], [2,1,2024],[3,1,2030],[4,1,2035], [0,2,2024],[2,2,2024],[1,2,2030],
                    [1,3,2024],[2,3,2030],[3,3,2035], [0,4,2024],[1,4,2030],[2,4,2035], [1,5,2024],[2,5,2030],[3,5,2035],
                    [1,6,2024],[2,6,2030],[3,6,2035], [0,7,2024],[1,7,2030],[2,7,2035], [0,8,2024],[1,8,2030],[2,8,2035]
                ]
            },
            '管理支撑技术': {
                technologies: [
                    '深海资源勘探开发决策支撑技术','深海资源开发试采区预选技术','深海采矿工厂全生命周期运营管理技术',
                    '深海矿产资源成本核算及价格波动预警模型研究','深海资源开发全周期风险识别与规避技术','商业化开发时机动态评估与模型构建',
                    '深海矿产资源开发配套技术标准与规范体系构建','国际海底矿产资源开发各国政策动向场景模拟与决策支撑','深海矿产资源开发关健技术研发国际合作机制构建与实施',
                    '综合试验场选址检测装备配置、运行管理技术','试验场现场试验、综合风险评价及可靠性分析技术'
                ],
                data: [
                    [2,0,2024],[4,0,2030],[5,0,2035], [2,1,2024],[4,1,2030],[5,1,2035], [2,2,2024],[4,2,2030],[5,2,2035],
                    [2,3,2024],[3,3,2030],[5,3,2035], [2,4,2024],[3,4,2030],[5,4,2035], [2,5,2024],[4,5,2030],[5,5,2035],
                    [2,6,2024],[3,6,2030],[5,6,2035], [2,7,2024],[4,7,2030],[5,7,2035], [2,8,2024],[4,8,2030],[5,8,2035],
                    [2,9,2024],[4,9,2030],[5,9,2035], [2,10,2024],[3,10,2030],[5,10,2035]
                ]
            }
        };
        
        const initChart = () => {
            if (!chartRef.value) return;
            
            if (chartInstance) {
                chartInstance.dispose();
            }
            
            chartInstance = echarts.init(chartRef.value);
            
            // 获取当前技术的数据配置
            const techName = props.technology?.name || '通用技术';
            const config = techDataConfig[techName] || techDataConfig['通用技术'];
            
            const technologies = config.technologies;
            const data = config.data;
            const stages = ['概念阶段', '基础研究', '技术开发', '技术示范', '工业应用', '商业应用'];
            
            const option = {
                tooltip: {
                    position: 'top',
                    textStyle: { fontSize: 15 },
                    formatter: (p) => `<strong style="font-size: 16px;">${technologies[p.value[1]]}</strong><br/><span style="font-size: 14px;">${stages[p.value[0]]}</span><br/><span style="font-size: 14px;">${p.value[2]}年</span>`
                },
                grid: { 
                    left: '0%', 
                    right: '3%', 
                    top: '3%', 
                    bottom: '13%',
                    containLabel: true
                },
                xAxis: { 
                    type: 'category', 
                    data: stages, 
                    axisLabel: { 
                        color: '#fff', 
                        fontSize: 15,
                        fontWeight: 'bold',
                        interval: 0
                    }, 
                    axisLine: { 
                        lineStyle: { color: '#fff', width: 2 } 
                    } 
                },
                yAxis: { 
                    type: 'category', 
                    data: technologies, 
                    axisLabel: { 
                        color: '#fff', 
                        fontSize: 13,
                        interval: 0
                    }, 
                    axisLine: { 
                        lineStyle: { color: '#fff', width: 2 } 
                    } 
                },
                visualMap: { 
                    min: 2024, 
                    max: 2035, 
                    orient: 'horizontal', 
                    left: 'center', 
                    bottom: '1%', 
                    textStyle: { 
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 'bold'
                    }, 
                    inRange: { 
                        color: ['#DAA520', '#6B9B7F', '#6FA8DC'] 
                    },
                    text: ['2035年', '2024年'],
                    itemWidth: 35,
                    itemHeight: 48
                },
                series: [{ 
                    name: '技术发展', 
                    type: 'heatmap', 
                    data: data, 
                    label: { show: false }, 
                    emphasis: { 
                        itemStyle: { 
                            shadowBlur: 15,
                            borderColor: '#fff',
                            borderWidth: 3
                        } 
                    },
                    itemStyle: {
                        borderColor: '#0f172a',
                        borderWidth: 2
                    }
                }]
            };
            
            chartInstance.setOption(option);
            chartInstance.resize();
        };
        
        const initRiskChart = () => {
            if (!riskChartRef.value) return;
            
            if (riskChartInstance) {
                riskChartInstance.dispose();
            }
            
            riskChartInstance = echarts.init(riskChartRef.value);
            
            // 获取当前技术的风险优先度数据
            const techName = props.technology?.name || '通用技术';
            const config = techRiskPriorityConfig[techName];
            
            if (!config) {
                // 如果没有配置数据，显示提示
                const option = {
                    title: {
                        text: '暂无风险优先度数据',
                        left: 'center',
                        top: 'middle',
                        textStyle: {
                            color: '#64748b',
                            fontSize: 16
                        }
                    }
                };
                riskChartInstance.setOption(option);
                return;
            }
            
            const subTechs = config.subTechs;
            
            // 雷达图配置
            const option = {
                tooltip: {
                    show: true,
                    trigger: 'item',
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderColor: '#06b6d4',
                    borderWidth: 1,
                    textStyle: {
                        color: '#fff',
                        fontSize: 13
                    },
                    formatter: (params) => {
                        // params.name 是系列名称（技术风险或研发优先度）
                        // params.value 是数据数组
                        // params.dataIndex 在雷达图中不可用，需要通过其他方式获取
                        
                        // 如果鼠标悬停在某个维度上，显示该维度的信息
                        if (params.componentSubType === 'radar' && params.value) {
                            // 找出鼠标悬停的维度索引
                            let dimensionIndex = -1;
                            
                            // 遍历所有维度，找到当前悬停的维度
                            for (let i = 0; i < subTechs.length; i++) {
                                // 这里我们显示所有技术的信息
                                if (i === 0) {
                                    dimensionIndex = i;
                                    break;
                                }
                            }
                            
                            // 显示所有技术的信息
                            let result = '<div style="max-height: 300px; overflow-y: auto;">';
                            subTechs.forEach((tech, index) => {
                                const riskText = ['', '基本可控', '部分可控', '卡脖子'][tech.risk];
                                const priorityText = tech.priority + '星';
                                result += `<div style="margin-bottom: 8px; padding: 4px; ${index % 2 === 0 ? 'background: rgba(6, 182, 212, 0.1);' : ''}">
                                    <strong style="font-size: 13px;">${tech.name}</strong><br/>
                                    <span style="color: #ef4444;">风险: ${riskText} (${tech.risk})</span> | 
                                    <span style="color: #22c55e;">优先度: ${priorityText}</span>
                                </div>`;
                            });
                            result += '</div>';
                            return result;
                        }
                        
                        return '';
                    }
                },
                legend: {
                    data: ['技术风险', '研发优先度'],
                    top: 10,
                    textStyle: {
                        color: '#fff',
                        fontSize: 12
                    },
                    itemWidth: 20,
                    itemHeight: 10,
                    // 使用formatter来自定义图例样式
                    formatter: function(name) {
                        return name;
                    }
                },
                radar: {
                    indicator: subTechs.map(tech => ({
                        name: tech.name,
                        max: 3
                    })),
                    center: ['50%', '55%'],
                    radius: '60%',
                    name: {
                        textStyle: {
                            color: '#fff',
                            fontSize: 11,
                            fontWeight: 'bold'
                        }
                    },
                    splitArea: {
                        areaStyle: {
                            color: ['rgba(6, 182, 212, 0.05)', 'rgba(6, 182, 212, 0.1)', 'rgba(6, 182, 212, 0.15)']
                        }
                    },
                    splitLine: {
                        lineStyle: {
                            color: 'rgba(6, 182, 212, 0.3)'
                        }
                    },
                    axisLine: {
                        lineStyle: {
                            color: 'rgba(6, 182, 212, 0.5)'
                        }
                    }
                },
                series: [
                    {
                        name: '技术风险',
                        type: 'radar',
                        symbol: 'circle',
                        symbolSize: 8,
                        color: '#ef4444',  // 设置系列颜色为红色
                        data: [{
                            value: subTechs.map(tech => tech.risk),
                            name: '技术风险',
                            areaStyle: {
                                color: 'rgba(239, 68, 68, 0.3)'  // 红色半透明
                            },
                            lineStyle: {
                                color: '#ef4444',  // 红色
                                width: 2
                            },
                            itemStyle: {
                                color: '#ef4444'  // 红色
                            }
                        }]
                    },
                    {
                        name: '研发优先度',
                        type: 'radar',
                        symbol: 'circle',
                        symbolSize: 8,
                        color: '#22c55e',  // 设置系列颜色为绿色
                        data: [{
                            value: subTechs.map(tech => tech.priority),
                            name: '研发优先度',
                            areaStyle: {
                                color: 'rgba(34, 197, 94, 0.3)'
                            },
                            lineStyle: {
                                color: '#22c55e',
                                width: 2
                            },
                            itemStyle: {
                                color: '#22c55e'
                            }
                        }]
                    }
                ]
            };
            
            riskChartInstance.setOption(option);
            riskChartInstance.resize();
        };
        
        watch(() => props.show, (newVal) => {
            if (newVal) {
                nextTick(() => {
                    setTimeout(() => {
                        initChart();
                        initRiskChart();
                    }, 300);
                });
            } else {
                if (chartInstance) {
                    chartInstance.dispose();
                    chartInstance = null;
                }
                if (riskChartInstance) {
                    riskChartInstance.dispose();
                    riskChartInstance = null;
                }
            }
        });
        
        // 监听技术变化，重新渲染图表
        watch(() => props.technology, (newVal) => {
            if (newVal && props.show) {
                nextTick(() => {
                    setTimeout(() => {
                        initChart();
                        initRiskChart();
                    }, 100);
                });
            }
        });
        
        return {
            chartRef,
            riskChartRef,
            isExpanded
        };
    }
};
</script>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-scale-enter-from {
    opacity: 0;
    transform: scale(0.95);
}

.fade-scale-leave-to {
    opacity: 0;
    transform: scale(0.95);
}

.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.5);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(6, 182, 212, 0.5);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(6, 182, 212, 0.7);
}
</style>
