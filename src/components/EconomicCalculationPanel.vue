<template>
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
        <div class="bg-gradient-to-br from-gray-900/98 via-slate-900/98 to-gray-900/98 rounded-xl shadow-2xl w-[72vw] h-[78vh] flex flex-col border border-cyan-500/40 relative overflow-hidden">
            <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent pointer-events-none"></div>
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>
            
            <div class="relative flex items-center justify-between px-4 py-2 border-b border-cyan-500/30 bg-gray-900/50">
                <div class="flex items-center gap-3">
                    <div class="w-1 h-6 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full"></div>
                    <h2 class="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">海底矿物资源经济评价计算器</h2>
                </div>
                <button @click="$emit('close')" class="text-gray-400 hover:text-cyan-400 transition-all hover:rotate-90 duration-300">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div class="relative flex-1 p-3 overflow-y-auto" style="height: calc(100% - 48px);">
                <div class="space-y-2.5">
                    
                    <div class="bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-lg p-2.5 border-2 border-blue-500/50">
                        <div class="flex items-center gap-2 mb-2.5">
                            <div class="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                            <h3 class="text-sm font-bold text-blue-300">基础参数设置</h3>
                        </div>
                        
                        <div class="grid grid-cols-3 gap-3">
                            <div class="bg-gray-800/50 rounded-lg p-2.5 border border-blue-500/30">
                                <h4 class="text-sm font-bold text-cyan-300 mb-2">矿区数量</h4>
                                <div class="flex gap-2">
                                    <button v-for="num in [5, 10, 15]" :key="num" 
                                            @click="miningAreaCount = num"
                                            :class="['flex-1 py-2 rounded text-sm font-bold transition-all',
                                                miningAreaCount === num ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700']">
                                        {{ num }}个
                                    </button>
                                </div>
                            </div>
                            
                            <div class="bg-gray-800/50 rounded-lg p-2.5 border border-blue-500/30">
                                <h4 class="text-sm font-bold text-cyan-300 mb-2">单矿区年产规模</h4>
                                <div class="flex items-center gap-2">
                                    <input v-model.number="singleAreaProduction" class="flex-1 bg-gray-700/70 text-center rounded px-3 py-2 text-base text-cyan-200 font-bold focus:outline-none focus:ring-2 focus:ring-cyan-400" type="number">
                                    <span class="text-sm text-gray-400">万吨</span>
                                </div>
                            </div>
                            
                            <div class="bg-gray-800/50 rounded-lg p-2.5 border border-blue-500/30">
                                <h4 class="text-sm font-bold text-cyan-300 mb-2">冶炼回收率</h4>
                                <div class="flex items-center gap-2">
                                    <input v-model.number="recoveryRate" class="flex-1 bg-gray-700/70 text-center rounded px-3 py-2 text-base text-cyan-200 font-bold focus:outline-none focus:ring-2 focus:ring-cyan-400" type="number" min="0" max="100">
                                    <span class="text-sm text-cyan-300 font-bold">%</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mt-2.5 p-2.5 bg-blue-900/40 rounded-lg border border-blue-500/40">
                            <div class="flex items-center justify-between">
                                <span class="text-sm font-bold text-cyan-200">多金属结核年产量:</span>
                                <div class="text-xl font-bold text-yellow-400">
                                    {{ totalNoduleProduction }} <span class="text-sm text-gray-400">万吨/年</span>
                                </div>
                            </div>
                            <div class="text-[10px] text-blue-300 mt-1">= {{ miningAreaCount }}个矿区 × {{ singleAreaProduction }}万吨</div>
                        </div>
                    </div>

                    <div class="bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-lg p-2.5 border-2 border-green-500/50">
                        <div class="flex items-center gap-2 mb-2.5">
                            <div class="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                            <h3 class="text-sm font-bold text-green-300">金属品位与金属产量</h3>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-3">
                            <div class="bg-gray-800/50 rounded-lg p-2.5 border border-green-500/30">
                                <h4 class="text-sm font-bold text-cyan-300 mb-2">金属品位（固定）</h4>
                                <div class="grid grid-cols-2 gap-2">
                                    <div class="p-2 bg-gradient-to-br from-cyan-900/30 to-blue-900/30 rounded border border-cyan-500/30">
                                        <div class="text-[10px] text-gray-400">钴 Co</div>
                                        <div class="text-base text-cyan-300 font-bold">0.20%</div>
                                    </div>
                                    <div class="p-2 bg-gradient-to-br from-cyan-900/30 to-blue-900/30 rounded border border-cyan-500/30">
                                        <div class="text-[10px] text-gray-400">镍 Ni</div>
                                        <div class="text-base text-cyan-300 font-bold">1.30%</div>
                                    </div>
                                    <div class="p-2 bg-gradient-to-br from-cyan-900/30 to-blue-900/30 rounded border border-cyan-500/30">
                                        <div class="text-[10px] text-gray-400">铜 Cu</div>
                                        <div class="text-base text-cyan-300 font-bold">1.10%</div>
                                    </div>
                                    <div class="p-2 bg-gradient-to-br from-cyan-900/30 to-blue-900/30 rounded border border-cyan-500/30">
                                        <div class="text-[10px] text-gray-400">锰 Mn</div>
                                        <div class="text-base text-cyan-300 font-bold">26.70%</div>
                                    </div>
                                </div>
                                <div class="mt-2 p-2 bg-green-900/30 rounded border border-green-500/40">
                                    <div class="text-[10px] text-green-300 font-mono leading-relaxed">💡 金属产量 = 结核年产量 × 金属品位 × 回收率</div>
                                </div>
                            </div>
                            
                            <div class="bg-gray-800/50 rounded-lg p-2.5 border border-green-500/30">
                                <h4 class="text-sm font-bold text-cyan-300 mb-2">金属年产量（自动计算）</h4>
                                <div class="space-y-2">
                                    <div class="p-2 bg-gray-700/40 rounded flex justify-between items-center">
                                        <span class="text-xs text-gray-300">钴 Co:</span>
                                        <span class="text-lg font-bold text-green-400">{{ metalOutput.co }} <span class="text-xs text-gray-400">吨</span></span>
                                    </div>
                                    <div class="p-2 bg-gray-700/40 rounded flex justify-between items-center">
                                        <span class="text-xs text-gray-300">镍 Ni:</span>
                                        <span class="text-lg font-bold text-green-400">{{ metalOutput.ni }} <span class="text-xs text-gray-400">吨</span></span>
                                    </div>
                                    <div class="p-2 bg-gray-700/40 rounded flex justify-between items-center">
                                        <span class="text-xs text-gray-300">铜 Cu:</span>
                                        <span class="text-lg font-bold text-green-400">{{ metalOutput.cu }} <span class="text-xs text-gray-400">吨</span></span>
                                    </div>
                                    <div class="p-2 bg-gray-700/40 rounded flex justify-between items-center">
                                        <span class="text-xs text-gray-300">锰 Mn:</span>
                                        <span class="text-lg font-bold text-green-400">{{ metalOutput.mn }} <span class="text-xs text-gray-400">吨</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-gradient-to-br from-yellow-900/30 to-orange-800/20 rounded-lg p-2.5 border-2 border-yellow-500/50">
                        <div class="flex items-center gap-2 mb-2.5">
                            <div class="w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                            <h3 class="text-sm font-bold text-yellow-300">产品产量与产值</h3>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-3">
                            <div class="bg-gray-800/50 rounded-lg p-2.5 border border-yellow-500/30">
                                <h4 class="text-sm font-bold text-cyan-300 mb-2">产品价格设置</h4>
                                <div class="space-y-2">
                                    <div class="flex items-center justify-between p-2 bg-gray-700/40 rounded">
                                        <span class="text-xs font-medium text-gray-200">硫酸钴 (21%钴):</span>
                                        <div class="flex items-center gap-1.5">
                                            <input v-model.number="productPrices[0].price" class="w-28 bg-gray-700/70 text-right rounded px-2 py-1 text-xs text-cyan-200 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400" type="number">
                                            <span class="text-[10px] text-gray-400">元/吨</span>
                                        </div>
                                    </div>
                                    <div class="flex items-center justify-between p-2 bg-gray-700/40 rounded">
                                        <span class="text-xs font-medium text-gray-200">硫酸镍 (22%镍):</span>
                                        <div class="flex items-center gap-1.5">
                                            <input v-model.number="productPrices[1].price" class="w-28 bg-gray-700/70 text-right rounded px-2 py-1 text-xs text-cyan-200 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400" type="number">
                                            <span class="text-[10px] text-gray-400">元/吨</span>
                                        </div>
                                    </div>
                                    <div class="flex items-center justify-between p-2 bg-gray-700/40 rounded">
                                        <span class="text-xs font-medium text-gray-200">硫酸铜 (25.5%铜):</span>
                                        <div class="flex items-center gap-1.5">
                                            <input v-model.number="productPrices[2].price" class="w-28 bg-gray-700/70 text-right rounded px-2 py-1 text-xs text-cyan-200 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400" type="number">
                                            <span class="text-[10px] text-gray-400">元/吨</span>
                                        </div>
                                    </div>
                                    <div class="flex items-center justify-between p-2 bg-gray-700/40 rounded">
                                        <span class="text-xs font-medium text-gray-200">锰复合金 (70%锰):</span>
                                        <div class="flex items-center gap-1.5">
                                            <input v-model.number="productPrices[3].price" class="w-28 bg-gray-700/70 text-right rounded px-2 py-1 text-xs text-cyan-200 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400" type="number">
                                            <span class="text-[10px] text-gray-400">元/吨</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="mt-2 p-2 bg-yellow-900/30 rounded border border-yellow-500/40">
                                    <div class="text-[10px] text-yellow-300 font-mono leading-relaxed">
                                        💡 产品产量 = 金属吨 ÷ 产品中金属品位<br/>
                                        💡 产品产值 = 产品产量 × 产品价格
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-gray-800/50 rounded-lg p-2.5 border border-yellow-500/30">
                                <h4 class="text-sm font-bold text-cyan-300 mb-2">计算结果</h4>
                                <div class="space-y-2">
                                    <div v-for="product in productOutput" :key="product.name" class="p-2 bg-gradient-to-r from-gray-700/40 to-gray-700/20 rounded border border-gray-600/30">
                                        <div class="flex justify-between items-center mb-1">
                                            <span class="text-xs font-bold text-cyan-200">{{ product.name }}</span>
                                            <span class="text-xs text-gray-300">{{ product.output.toFixed(0) }} 吨/年</span>
                                        </div>
                                        <div class="text-right text-base font-bold text-green-400">¥ {{ formatCurrency(product.value) }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-gradient-to-br from-purple-900/40 to-pink-900/30 rounded-lg p-3 border-2 border-purple-500/50">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50">
                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <div class="text-xs text-gray-400">年度总产值</div>
                                    <div class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400">¥ {{ formatCurrency(totalProductValue) }}</div>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <button @click="calculateAll" class="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-cyan-500/50 flex items-center gap-2">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    刷新计算
                                </button>
                                <button @click="resetData" class="px-5 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 rounded-lg text-sm font-medium transition-all shadow-lg flex items-center gap-2">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    重置数据
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'EconomicCalculationPanel',
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['close'],
    data() {
        return {
            miningAreaCount: 10,
            singleAreaProduction: 300,
            recoveryRate: 92,
            metalGrades: {
                co: 0.20,
                ni: 1.30,
                cu: 1.10,
                mn: 26.70
            },
            productPrices: [
                { name: '硫酸钴', price: 262857142, unit: '元/吨', metalGrade: 0.21 },
                { name: '硫酸镍', price: 153000000, unit: '元/吨', metalGrade: 0.22 },
                { name: '硫酸铜', price: 119058823, unit: '元/吨', metalGrade: 0.255 },
                { name: '锰复合金', price: 113160, unit: '元/吨', metalGrade: 0.70 }
            ]
        };
    },
    computed: {
        totalNoduleProduction() {
            return this.miningAreaCount * this.singleAreaProduction;
        },
        metalOutput() {
            const noduleProduction = this.totalNoduleProduction * 10000;
            const recovery = this.recoveryRate / 100;
            
            return {
                co: Math.round(noduleProduction * this.metalGrades.co / 100 * recovery),
                ni: Math.round(noduleProduction * this.metalGrades.ni / 100 * recovery),
                cu: Math.round(noduleProduction * this.metalGrades.cu / 100 * recovery),
                mn: Math.round(noduleProduction * this.metalGrades.mn / 100 * recovery)
            };
        },
        productOutput() {
            return [
                {
                    name: '硫酸钴',
                    output: this.metalOutput.co / 0.21,
                    value: (this.metalOutput.co / 0.21) * this.productPrices[0].price
                },
                {
                    name: '硫酸镍',
                    output: this.metalOutput.ni / 0.22,
                    value: (this.metalOutput.ni / 0.22) * this.productPrices[1].price
                },
                {
                    name: '硫酸铜',
                    output: this.metalOutput.cu / 0.255,
                    value: (this.metalOutput.cu / 0.255) * this.productPrices[2].price
                },
                {
                    name: '锰复合金',
                    output: this.metalOutput.mn / 0.70,
                    value: (this.metalOutput.mn / 0.70) * this.productPrices[3].price
                }
            ];
        },
        totalProductValue() {
            return this.productOutput.reduce((sum, product) => sum + product.value, 0);
        }
    },
    methods: {
        formatCurrency(value) {
            return new Intl.NumberFormat('zh-CN').format(Math.round(value));
        },
        calculateAll() {
            this.$forceUpdate();
        },
        resetData() {
            this.miningAreaCount = 10;
            this.singleAreaProduction = 300;
            this.recoveryRate = 92;
            this.productPrices = [
                { name: '硫酸钴', price: 262857142, unit: '元/吨', metalGrade: 0.21 },
                { name: '硫酸镍', price: 153000000, unit: '元/吨', metalGrade: 0.22 },
                { name: '硫酸铜', price: 119058823, unit: '元/吨', metalGrade: 0.255 },
                { name: '锰复合金', price: 113160, unit: '元/吨', metalGrade: 0.70 }
            ];
        }
    }
};
</script>

<style scoped>
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
