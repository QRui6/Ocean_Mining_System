<template>
    <transition name="fade">
        <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md pointer-events-auto p-6">
            <div class="tech-panel-modern w-[85vw] max-w-[1400px] h-[85vh] pointer-events-auto relative flex flex-col">
                <!-- 关闭按钮 -->
                <button 
                    @click="handleClose"
                    class="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-all z-10 group border border-red-500/30"
                >
                    <svg class="w-6 h-6 text-red-400 group-hover:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>

                <!-- 标题 -->
                <div class="flex items-center mb-4 pb-3 border-b border-blue-400/50">
                    <div class="w-1.5 h-6 bg-gradient-to-b from-cyan-300 to-blue-400 mr-3 rounded-full shadow-lg shadow-cyan-500/50"></div>
                    <h3 class="text-xl font-bold text-white tracking-wide drop-shadow-lg">四种经济评价模型对比分析</h3>
                    
                    <!-- 切换按钮 -->
                    <div class="ml-auto flex items-center gap-3">
                        <div class="flex bg-slate-700/40 rounded-lg p-0.5 border border-slate-600/50">
                            <button 
                                @click="viewMode = 'chart'"
                                :class="[
                                    'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                                    viewMode === 'chart' 
                                        ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50' 
                                        : 'text-slate-300 hover:text-white'
                                ]"
                            >
                                <svg class="w-3.5 h-3.5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                                </svg>
                                图表视图
                            </button>
                            <button 
                                @click="viewMode = 'table'"
                                :class="[
                                    'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                                    viewMode === 'table' 
                                        ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50' 
                                        : 'text-slate-300 hover:text-white'
                                ]"
                            >
                                <svg class="w-3.5 h-3.5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                                </svg>
                                表格视图
                            </button>
                        </div>
                        
                        <div class="flex gap-1.5">
                            <div class="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-300">CSU</div>
                            <div class="px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-300">MIT</div>
                            <div class="px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/30 rounded text-xs text-yellow-300">AG</div>
                            <div class="px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-300">BMW</div>
                        </div>
                    </div>
                </div>

                <!-- 主要内容区域 - 图表视图 -->
                <div v-if="viewMode === 'chart'" class="flex-1 flex flex-col gap-3 min-h-0">
                    <!-- 关键指标卡片 -->
                    <div class="grid grid-cols-4 gap-2">
                        <div class="bg-gradient-to-br from-blue-500/30 to-blue-600/20 border border-blue-400/60 rounded-lg p-2.5 shadow-lg shadow-blue-500/20">
                            <div class="text-xs text-blue-100 mb-0.5 font-medium">分析周期</div>
                            <div class="flex items-baseline gap-1.5">
                                <span class="text-xl font-bold text-white">28-37</span>
                                <span class="text-xs text-blue-100">年</span>
                            </div>
                        </div>
                        <div class="bg-gradient-to-br from-green-500/30 to-green-600/20 border border-green-400/60 rounded-lg p-2.5 shadow-lg shadow-green-500/20">
                            <div class="text-xs text-green-100 mb-0.5 font-medium">年产能</div>
                            <div class="flex items-baseline gap-1.5">
                                <span class="text-xl font-bold text-white">3</span>
                                <span class="text-xs text-green-100">百万干吨</span>
                            </div>
                        </div>
                        <div class="bg-gradient-to-br from-yellow-500/30 to-orange-600/20 border border-yellow-400/60 rounded-lg p-2.5 shadow-lg shadow-yellow-500/20">
                            <div class="text-xs text-yellow-100 mb-0.5 font-medium">最高内部收益率</div>
                            <div class="flex items-baseline gap-1.5">
                                <span class="text-xl font-bold text-white">27%</span>
                                <span class="text-xs text-yellow-100">AG模型</span>
                            </div>
                        </div>
                        <div class="bg-gradient-to-br from-purple-500/30 to-purple-600/20 border border-purple-400/60 rounded-lg p-2.5 shadow-lg shadow-purple-500/20">
                            <div class="text-xs text-purple-100 mb-0.5 font-medium">金属提取</div>
                            <div class="text-sm font-bold text-white">铜镍钴锰</div>
                        </div>
                    </div>

                    <!-- 三个图表横向排列 -->
                    <div class="flex-1 grid grid-cols-3 gap-3 min-h-0">
                        <!-- 固定投资对比图表 -->
                        <div class="bg-gradient-to-br from-slate-800/60 to-slate-700/40 rounded-lg border border-blue-400/40 p-3 min-h-0 shadow-lg shadow-blue-500/10 backdrop-blur-sm">
                            <div class="text-xs font-bold text-cyan-200 mb-2">固定投资对比（百万美元）</div>
                            <div ref="investmentChartRef" style="width: 100%; height: calc(100% - 1.75rem);"></div>
                        </div>

                        <!-- 运营成本对比图表 -->
                        <div class="bg-gradient-to-br from-slate-800/60 to-slate-700/40 rounded-lg border border-blue-400/40 p-3 min-h-0 shadow-lg shadow-blue-500/10 backdrop-blur-sm">
                            <div class="text-xs font-bold text-cyan-200 mb-2">运营成本对比（百万美元/年）</div>
                            <div ref="operatingChartRef" style="width: 100%; height: calc(100% - 1.75rem);"></div>
                        </div>

                        <!-- 金属价格对比图表 -->
                        <div class="bg-gradient-to-br from-slate-800/60 to-slate-700/40 rounded-lg border border-blue-400/40 p-3 min-h-0 shadow-lg shadow-blue-500/10 backdrop-blur-sm">
                            <div class="text-xs font-bold text-cyan-200 mb-2">金属价格对比（美元/吨）</div>
                            <div ref="priceChartRef" style="width: 100%; height: calc(100% - 1.75rem);"></div>
                        </div>
                    </div>

                    <!-- 底部：详细数据表格 - 仅在图表视图显示 -->
                    <div class="bg-gradient-to-br from-slate-800/60 to-slate-700/40 rounded-lg border border-blue-400/40 p-3 shadow-lg shadow-blue-500/10 backdrop-blur-sm">
                        <div class="text-xs font-bold text-cyan-200 mb-2">详细参数对比</div>
                        <div class="grid grid-cols-4 gap-2 text-xs">
                            <div v-for="model in models" :key="model.id" class="bg-slate-700/60 rounded p-2 border border-slate-500/60 shadow-md">
                                <div class="font-bold mb-1.5 pb-1.5 border-b border-slate-500/60 text-xs" :class="model.colorClass">{{ model.name }}</div>
                                <div class="space-y-1 text-slate-200">
                                    <div class="flex justify-between text-xs">
                                        <span class="text-slate-300">分析周期：</span>
                                        <span>{{ model.data.analysisYears }}年</span>
                                    </div>
                                    <div class="flex justify-between text-xs">
                                        <span class="text-slate-300">开发周期：</span>
                                        <span>{{ model.data.developYears }}</span>
                                    </div>
                                    <div class="flex justify-between text-xs">
                                        <span class="text-slate-300">采运系统：</span>
                                        <span>{{ model.data.mining }}M</span>
                                    </div>
                                    <div class="flex justify-between text-xs">
                                        <span class="text-slate-300">冶炼系统：</span>
                                        <span>{{ model.data.smelting }}M</span>
                                    </div>
                                    <div class="flex justify-between text-xs">
                                        <span class="text-slate-300">内部收益率：</span>
                                        <span class="text-cyan-400 font-bold">{{ model.data.irr }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 主要内容区域 - 表格视图 -->
                <div v-else class="flex-1 bg-gradient-to-br from-slate-800/60 to-slate-700/40 rounded-lg border border-blue-400/40 p-3 overflow-auto shadow-lg shadow-blue-500/10 backdrop-blur-sm">
                    <table class="w-full text-white text-sm">
                        <thead class="bg-slate-700/80 sticky top-0">
                            <tr>
                                <th class="px-4 py-3 text-left font-bold text-cyan-200 border border-blue-400/30">项目</th>
                                <th class="px-4 py-3 text-center font-bold text-blue-200 border border-blue-400/30">CSU模型</th>
                                <th class="px-4 py-3 text-center font-bold text-green-200 border border-blue-400/30">MIT模型</th>
                                <th class="px-4 py-3 text-center font-bold text-yellow-200 border border-blue-400/30">AG模型</th>
                                <th class="px-4 py-3 text-center font-bold text-purple-200 border border-blue-400/30">BMW模型</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- 生产情况及项目周期 -->
                            <tr class="bg-slate-700/60">
                                <td colspan="5" class="px-4 py-2 font-bold text-yellow-200 border border-blue-400/30">生产情况及项目周期</td>
                            </tr>
                            <tr class="hover:bg-slate-700/50">
                                <td class="px-4 py-2 border border-blue-400/30">分析周期（年）</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">28</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">37</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">35</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">16</td>
                            </tr>
                            <tr class="hover:bg-slate-700/50">
                                <td class="px-4 py-2 border border-blue-400/30">开发周期（年）</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">28（3）</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">30（3）</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">28（3）</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">16（4）</td>
                            </tr>
                            <tr class="hover:bg-slate-700/50">
                                <td class="px-4 py-2 border border-blue-400/30">年产能（百万干吨）</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">3</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">3</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">3</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">3</td>
                            </tr>
                            <tr class="hover:bg-slate-700/50">
                                <td class="px-4 py-2 border border-blue-400/30">金属提取种类</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">铜镍钴锰</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">铜镍钴锰</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">铜镍钴锰</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">铜镍钴锰</td>
                            </tr>
                            <tr class="hover:bg-slate-700/50">
                                <td class="px-4 py-2 border border-blue-400/30">矿产品方案</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">电解锰</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">电解锰</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">电解锰</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">X</td>
                            </tr>

                            <!-- 固定投资 -->
                            <tr class="bg-slate-700/60">
                                <td colspan="5" class="px-4 py-2 font-bold text-yellow-200 border border-blue-400/30">固定投资（百万美元）</td>
                            </tr>
                            <tr class="hover:bg-slate-700/50">
                                <td class="px-4 py-2 border border-blue-400/30">可行性研究</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">210</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">313</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">360</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">-</td>
                            </tr>
                            <tr class="hover:bg-slate-700/50">
                                <td class="px-4 py-2 border border-blue-400/30">采运系统</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">1,100</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">1,643</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">1,276</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">789</td>
                            </tr>
                            <tr class="hover:bg-slate-700/50">
                                <td class="px-4 py-2 border border-blue-400/30">冶炼系统</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">2,000</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">2,072</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">2,415</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">1,543</td>
                            </tr>

                            <!-- 运营成本 -->
                            <tr class="bg-slate-700/60">
                                <td colspan="5" class="px-4 py-2 font-bold text-yellow-200 border border-blue-400/30">运营成本（百万美元/年）</td>
                            </tr>
                            <tr class="hover:bg-slate-700/50">
                                <td class="px-4 py-2 border border-blue-400/30">采运</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">300</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">413</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">325</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">91.5</td>
                            </tr>
                            <tr class="hover:bg-slate-700/50">
                                <td class="px-4 py-2 border border-blue-400/30">冶炼</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">600</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">654</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">689</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">321</td>
                            </tr>

                            <!-- 金属价格 -->
                            <tr class="bg-slate-700/60">
                                <td colspan="5" class="px-4 py-2 font-bold text-yellow-200 border border-blue-400/30">金属价格（美元/吨）</td>
                            </tr>
                            <tr class="hover:bg-slate-700/50">
                                <td class="px-4 py-2 border border-blue-400/30">铜</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">67,261</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">55,535</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">91,000</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">28,946</td>
                            </tr>
                            <tr class="hover:bg-slate-700/50">
                                <td class="px-4 py-2 border border-blue-400/30">钴</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">6,635</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">6,965</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">6,886</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">6,745</td>
                            </tr>
                            <tr class="hover:bg-slate-700/50">
                                <td class="px-4 py-2 border border-blue-400/30">镍</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">1,685</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">1,640</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">2,040</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">980</td>
                            </tr>
                            <tr class="hover:bg-slate-700/50">
                                <td class="px-4 py-2 border border-blue-400/30">锰</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">12,692</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">22,962</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">14,840</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">14,920</td>
                            </tr>
                            <tr class="hover:bg-slate-700/50">
                                <td class="px-4 py-2 border border-blue-400/30">内部收益率</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">17.1%</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">18.1%</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">27%</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">-</td>
                            </tr>
                            <tr class="hover:bg-slate-700/50">
                                <td class="px-4 py-2 border border-blue-400/30">折现率</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">15%</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">10%</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">-</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">-</td>
                            </tr>
                            <tr class="hover:bg-slate-700/50">
                                <td class="px-4 py-2 border border-blue-400/30">参数不确定分析</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">√</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">√</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">X</td>
                                <td class="px-4 py-2 text-center border border-blue-400/30">X</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- 说明文字 -->
                <div class="mt-2 p-2 bg-blue-500/15 border border-blue-400/30 rounded text-xs text-blue-50 leading-relaxed shadow-sm">
                    <span class="font-bold text-cyan-200">模型说明：</span>
                    四个财务模型均采用折现现金流量法建立，采用的经济评价指标包括净现值和内部收益率。其中3个模型考虑了担保国的所得税（25%），德国模型未计入国家税收。
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
import { ref, onMounted, watch, nextTick } from 'vue';
import * as echarts from 'echarts';

export default {
    name: 'ModelComparisonPanel',
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['close'],
    setup(props, { emit }) {
        const investmentChartRef = ref(null);
        const operatingChartRef = ref(null);
        const priceChartRef = ref(null);
        const viewMode = ref('chart'); // 'chart' 或 'table'
        
        let investmentChart = null;
        let operatingChart = null;
        let priceChart = null;

        const models = [
            {
                id: 'csu',
                name: 'CSU模型',
                colorClass: 'text-blue-400',
                color: '#3B82F6',
                data: {
                    analysisYears: 28,
                    developYears: '28(3)',
                    feasibility: '210M',
                    mining: 1100,
                    smelting: 2000,
                    miningCost: 300,
                    smeltingCost: 600,
                    copper: 67261,
                    cobalt: 6635,
                    nickel: 1685,
                    manganese: 12692,
                    irr: '17.1%'
                }
            },
            {
                id: 'mit',
                name: 'MIT模型',
                colorClass: 'text-green-400',
                color: '#10B981',
                data: {
                    analysisYears: 37,
                    developYears: '30(3)',
                    feasibility: '313M',
                    mining: 1643,
                    smelting: 2072,
                    miningCost: 413,
                    smeltingCost: 654,
                    copper: 55535,
                    cobalt: 6965,
                    nickel: 1640,
                    manganese: 22962,
                    irr: '18.1%'
                }
            },
            {
                id: 'ag',
                name: 'AG模型',
                colorClass: 'text-yellow-400',
                color: '#F59E0B',
                data: {
                    analysisYears: 35,
                    developYears: '28(3)',
                    feasibility: '360M',
                    mining: 1276,
                    smelting: 2415,
                    miningCost: 325,
                    smeltingCost: 689,
                    copper: 91000,
                    cobalt: 6886,
                    nickel: 2040,
                    manganese: 14840,
                    irr: '27%'
                }
            },
            {
                id: 'bmw',
                name: 'BMW模型',
                colorClass: 'text-purple-400',
                color: '#A855F7',
                data: {
                    analysisYears: 16,
                    developYears: '16(4)',
                    feasibility: '-',
                    mining: 789,
                    smelting: 1543,
                    miningCost: 91.5,
                    smeltingCost: 321,
                    copper: 28946,
                    cobalt: 6745,
                    nickel: 980,
                    manganese: 14920,
                    irr: '-'
                }
            }
        ];

        const initInvestmentChart = () => {
            if (!investmentChartRef.value) return;
            
            investmentChart = echarts.init(investmentChartRef.value);
            
            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow'
                    },
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderColor: '#06B6D4',
                    borderWidth: 1,
                    textStyle: {
                        color: '#fff'
                    }
                },
                legend: {
                    data: ['采运系统', '冶炼系统'],
                    textStyle: {
                        color: '#FFFFFF'
                    },
                    top: 0
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    top: '15%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    data: ['CSU', 'MIT', 'AG', 'BMW'],
                    axisLine: {
                        lineStyle: {
                            color: '#64748B'
                        }
                    },
                    axisLabel: {
                        color: '#FFFFFF'
                    }
                },
                yAxis: {
                    type: 'value',
                    name: '百万美元',
                    nameTextStyle: {
                        color: '#FFFFFF'
                    },
                    axisLine: {
                        lineStyle: {
                            color: '#64748B'
                        }
                    },
                    axisLabel: {
                        color: '#FFFFFF'
                    },
                    splitLine: {
                        lineStyle: {
                            color: '#475569'
                        }
                    }
                },
                series: [
                    {
                        name: '采运系统',
                        type: 'bar',
                        data: [1100, 1643, 1276, 789],
                        itemStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: '#06B6D4' },
                                { offset: 1, color: '#0891B2' }
                            ])
                        }
                    },
                    {
                        name: '冶炼系统',
                        type: 'bar',
                        data: [2000, 2072, 2415, 1543],
                        itemStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: '#8B5CF6' },
                                { offset: 1, color: '#7C3AED' }
                            ])
                        }
                    }
                ]
            };
            
            investmentChart.setOption(option);
        };

        const initOperatingChart = () => {
            if (!operatingChartRef.value) return;
            
            operatingChart = echarts.init(operatingChartRef.value);
            
            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderColor: '#06B6D4',
                    borderWidth: 1,
                    textStyle: {
                        color: '#fff'
                    }
                },
                legend: {
                    data: ['采运', '冶炼'],
                    textStyle: {
                        color: '#FFFFFF'
                    },
                    top: 0
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    top: '15%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    data: ['CSU', 'MIT', 'AG', 'BMW'],
                    axisLine: {
                        lineStyle: {
                            color: '#64748B'
                        }
                    },
                    axisLabel: {
                        color: '#FFFFFF'
                    }
                },
                yAxis: {
                    type: 'value',
                    name: '百万美元/年',
                    nameTextStyle: {
                        color: '#FFFFFF'
                    },
                    axisLine: {
                        lineStyle: {
                            color: '#64748B'
                        }
                    },
                    axisLabel: {
                        color: '#FFFFFF'
                    },
                    splitLine: {
                        lineStyle: {
                            color: '#475569'
                        }
                    }
                },
                series: [
                    {
                        name: '采运',
                        type: 'line',
                        data: [300, 413, 325, 91.5],
                        smooth: true,
                        lineStyle: {
                            width: 3,
                            color: '#10B981'
                        },
                        itemStyle: {
                            color: '#10B981'
                        },
                        areaStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
                                { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
                            ])
                        }
                    },
                    {
                        name: '冶炼',
                        type: 'line',
                        data: [600, 654, 689, 321],
                        smooth: true,
                        lineStyle: {
                            width: 3,
                            color: '#F59E0B'
                        },
                        itemStyle: {
                            color: '#F59E0B'
                        },
                        areaStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: 'rgba(245, 158, 11, 0.3)' },
                                { offset: 1, color: 'rgba(245, 158, 11, 0.05)' }
                            ])
                        }
                    }
                ]
            };
            
            operatingChart.setOption(option);
        };

        const initPriceChart = () => {
            if (!priceChartRef.value) return;
            
            priceChart = echarts.init(priceChartRef.value);
            
            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderColor: '#06B6D4',
                    borderWidth: 1,
                    textStyle: {
                        color: '#fff'
                    }
                },
                legend: {
                    data: ['铜', '钴', '镍', '锰'],
                    textStyle: {
                        color: '#FFFFFF'
                    },
                    top: 0
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    top: '15%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    data: ['CSU', 'MIT', 'AG', 'BMW'],
                    axisLine: {
                        lineStyle: {
                            color: '#64748B'
                        }
                    },
                    axisLabel: {
                        color: '#FFFFFF'
                    }
                },
                yAxis: {
                    type: 'value',
                    name: '美元/吨',
                    nameTextStyle: {
                        color: '#FFFFFF'
                    },
                    axisLine: {
                        lineStyle: {
                            color: '#64748B'
                        }
                    },
                    axisLabel: {
                        color: '#FFFFFF',
                        formatter: (value) => {
                            if (value >= 1000) {
                                return (value / 1000).toFixed(0) + 'K';
                            }
                            return value;
                        }
                    },
                    splitLine: {
                        lineStyle: {
                            color: '#475569'
                        }
                    }
                },
                series: [
                    {
                        name: '铜',
                        type: 'bar',
                        data: [67261, 55535, 91000, 28946],
                        itemStyle: {
                            color: '#EF4444'
                        }
                    },
                    {
                        name: '钴',
                        type: 'bar',
                        data: [6635, 6965, 6886, 6745],
                        itemStyle: {
                            color: '#3B82F6'
                        }
                    },
                    {
                        name: '镍',
                        type: 'bar',
                        data: [1685, 1640, 2040, 980],
                        itemStyle: {
                            color: '#10B981'
                        }
                    },
                    {
                        name: '锰',
                        type: 'bar',
                        data: [12692, 22962, 14840, 14920],
                        itemStyle: {
                            color: '#F59E0B'
                        }
                    }
                ]
            };
            
            priceChart.setOption(option);
        };

        const initCharts = () => {
            if (viewMode.value !== 'chart') return;
            
            nextTick(() => {
                setTimeout(() => {
                    initInvestmentChart();
                    initOperatingChart();
                    initPriceChart();
                }, 100);
            });
        };

        const resizeCharts = () => {
            investmentChart?.resize();
            operatingChart?.resize();
            priceChart?.resize();
        };

        const handleClose = () => {
            emit('close');
        };

        watch(() => props.show, (newVal) => {
            if (newVal) {
                initCharts();
                window.addEventListener('resize', resizeCharts);
            } else {
                window.removeEventListener('resize', resizeCharts);
            }
        });

        watch(() => viewMode.value, (newVal) => {
            if (newVal === 'chart') {
                initCharts();
            }
        });

        onMounted(() => {
            if (props.show) {
                initCharts();
            }
        });

        return {
            investmentChartRef,
            operatingChartRef,
            priceChartRef,
            viewMode,
            models,
            handleClose
        };
    }
};
</script>

<style scoped>
.tech-panel-modern {
    background: linear-gradient(135deg, rgba(30, 58, 95, 0.96) 0%, rgba(45, 75, 115, 0.96) 100%);
    backdrop-filter: blur(24px);
    border: 1.5px solid rgba(59, 130, 246, 0.6);
    box-shadow: 0 0 60px rgba(59, 130, 246, 0.25), 
                0 20px 50px rgba(0, 0, 0, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 1.5rem;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
