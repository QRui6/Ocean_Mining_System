<template>
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
        <!-- 整体容器：包含标签和面板 -->
        <div class="relative flex items-start" style="width: 80vw; height: 75vh;">
            <!-- 左侧标签页：结核类型选择 - 在面板外侧 -->
            <div class="flex flex-col relative pt-16">
                <!-- 垂直标签 -->
                <div class="flex flex-col gap-0">
                    <button v-for="(type, index) in noduleTypes" :key="index"
                            @click="currentNoduleType = index"
                            :class="['relative group transition-all duration-300',
                                currentNoduleType === index 
                                    ? 'z-20' 
                                    : 'z-10 hover:z-15']"
                            :style="{ marginTop: index > 0 ? '12px' : '0' }">
                        
                        <!-- 便签标签形状 -->
                        <div class="relative">
                            <!-- 标签主体 - 使用clip-path创建便签形状 -->
                            <div :class="['relative px-4 py-3 transition-all duration-300 min-w-[100px] transform',
                                currentNoduleType === index 
                                    ? 'bg-gradient-to-br from-violet-600/95 to-purple-600/95 text-white shadow-xl shadow-violet-500/40 scale-110 translate-x-2' 
                                    : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700/80 hover:text-slate-100 hover:scale-105 hover:translate-x-1']"
                                 style="clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%);">
                                
                                <!-- 内容 -->
                                <div class="flex items-center justify-center relative z-10">
                                    <!-- 资源名称 -->
                                    <div :class="['text-sm font-medium transition-all px-2',
                                        currentNoduleType === index 
                                            ? 'text-white' 
                                            : 'text-slate-300 group-hover:text-slate-100']">
                                        {{ type.name }}
                                    </div>
                                </div>
                                
                                <!-- 便签折角效果 -->
                                <div v-if="currentNoduleType === index" 
                                     class="absolute top-0 right-0 w-3 h-3 bg-white/20 transform rotate-45 translate-x-1 -translate-y-1"></div>
                            </div>
                            
                            <!-- 便签阴影 -->
                            <div :class="['absolute inset-0 transition-all duration-300 -z-10',
                                currentNoduleType === index 
                                    ? 'bg-violet-900/30 blur-md scale-110 translate-x-2 translate-y-1' 
                                    : 'bg-slate-900/20 blur-sm group-hover:scale-105 group-hover:translate-x-1 group-hover:translate-y-0.5']"
                                 style="clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%);"></div>
                        </div>
                    </button>
                </div>
            </div>

            <!-- 主面板 -->
            <div class="flex-1 bg-gradient-to-br from-gray-900/98 via-slate-900/98 to-gray-900/98 rounded-xl shadow-2xl h-full flex flex-col border border-cyan-500/40 relative overflow-hidden ml-2">
                <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent pointer-events-none"></div>
                <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>
                
                <!-- 标题栏 -->
                <div class="relative flex items-center justify-between px-4 py-2.5 border-b border-cyan-500/30 bg-gray-900/50">
                    <div class="flex items-center gap-2">
                        <div class="w-1 h-5 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full"></div>
                        <h2 class="text-base font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">海底矿产资源产能与价值分析</h2>
                    </div>
                    <button @click="$emit('close')" class="text-gray-400 hover:text-cyan-400 transition-all hover:rotate-90 duration-300">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <!-- 主内容区域 -->
                <div class="relative flex flex-1 overflow-hidden" style="height: calc(100% - 44px);">
                    <!-- 中间：计算区域 -->
                    <div class="flex-1 bg-gray-900/50 p-2 flex flex-col">
                    <div class="space-y-1 flex-1 flex flex-col">
                        
                        <!-- 基础参数设置 -->
                        <div class="relative overflow-hidden rounded-lg border border-slate-700/50 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm">
                            <!-- 装饰性背景 -->
                            <div class="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl"></div>
                            
                            <div class="relative p-1.5">
                                <!-- 标题 -->
                                <div class="flex items-center gap-1 mb-1.5">
                                    <div class="flex items-center justify-center w-4 h-4 rounded bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30">
                                        <span class="text-white font-bold text-xs">1</span>
                                    </div>
                                    <h3 class="text-xs font-semibold text-slate-100">基础参数设置</h3>
                                </div>
                                
                                <!-- 参数网格 -->
                                <div class="grid grid-cols-4 gap-2">
                                    <!-- 矿区数量 -->
                                    <div class="space-y-1">
                                        <label class="block text-xs font-medium text-slate-300">矿区数量</label>
                                        <!-- 下拉选择模式 -->
                                        <div v-if="miningAreaCount !== 'custom'" class="relative">
                                            <select v-model.number="miningAreaCount" 
                                                    class="w-full h-7 bg-slate-800/90 text-center rounded px-2 text-xs text-slate-100 font-semibold border border-slate-700/50 focus:outline-none focus:border-cyan-500/70 focus:bg-slate-800 transition-all duration-200 appearance-none cursor-pointer hover:border-slate-600 hover:bg-slate-800/70">
                                                <option v-for="num in [5, 10, 15, 20, 25, 30]" :key="num" :value="num">{{ num }}个</option>
                                                <option value="custom">自定义</option>
                                            </select>
                                            <div class="absolute inset-y-0 right-0 flex items-center pr-1.5 pointer-events-none">
                                                <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                        
                                        <!-- 自定义输入模式 -->
                                        <div v-else class="relative">
                                            <input v-model.number="customAreaCount" 
                                                   class="w-full h-7 bg-slate-800/90 text-center rounded px-2 pr-7 text-xs text-slate-100 font-semibold border border-slate-700/50 focus:outline-none focus:border-cyan-500/70 focus:bg-slate-800 transition-all duration-200" 
                                                   type="number" 
                                                   placeholder="输入数量"
                                                   @focus="$event.target.select()">
                                            <button @click="miningAreaCount = 10; customAreaCount = 10" 
                                                    class="absolute inset-y-0 right-0 w-7 flex items-center justify-center bg-slate-700/50 hover:bg-slate-600/50 rounded-r border-l border-slate-600/50 hover:border-slate-500 transition-all duration-200 group">
                                                <svg class="w-2.5 h-2.5 text-slate-400 group-hover:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <!-- 单矿区年产量 -->
                                    <div class="space-y-1">
                                        <label class="block text-xs font-medium text-slate-300">单矿区年产量</label>
                                        <div class="relative">
                                            <input v-model.number="singleAreaProduction" 
                                                   class="w-full h-7 bg-slate-800/90 text-center rounded pl-2 pr-8 text-xs text-slate-100 font-semibold border border-slate-700/50 focus:outline-none focus:border-cyan-500/70 focus:bg-slate-800 transition-all duration-200 hover:border-slate-600 hover:bg-slate-800/70" 
                                                   type="number">
                                            <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                                <span class="text-xs text-slate-400 font-medium">万吨</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- 年产量显示 -->
                                    <div class="space-y-1">
                                        <label class="block text-xs font-medium text-slate-300">年产量</label>
                                        <div class="h-7 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded px-2 border border-amber-500/40 flex items-center justify-center">
                                            <div class="text-xs font-bold text-amber-400">
                                                {{ totalNoduleProduction }} 万吨/年
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- 冶炼回收率 -->
                                    <div class="space-y-1">
                                        <label class="block text-xs font-medium text-slate-300">冶炼回收率</label>
                                        <div class="relative">
                                            <input v-model.number="recoveryRate" 
                                                   class="w-full h-7 bg-slate-800/90 text-center rounded pl-2 pr-6 text-xs text-slate-100 font-semibold border border-slate-700/50 focus:outline-none focus:border-cyan-500/70 focus:bg-slate-800 transition-all duration-200 hover:border-slate-600 hover:bg-slate-800/70" 
                                                   type="number" 
                                                   min="0" 
                                                   max="100">
                                            <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                                <span class="text-xs text-cyan-400 font-bold">%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 金属参数集中配置 -->
                        <div class="bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-lg p-2 border border-green-500/50">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center gap-1.5">
                                    <div class="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs">2</div>
                                    <h3 class="text-xs font-bold text-green-300">金属参数配置</h3>
                                </div>
                                <!-- 汇率设置 -->
                                <div class="flex items-center gap-2">
                                    <span class="text-xs text-gray-400">汇率 (USD/CNY):</span>
                                    <input v-model.number="exchangeRate" 
                                           class="w-16 bg-gray-700/80 text-center rounded px-2 py-1 text-xs text-cyan-200 font-medium border border-gray-600 focus:outline-none focus:border-cyan-400 transition-colors" 
                                           type="number"
                                           step="0.01"
                                           @input="updatePricesFromRate">
                                </div>
                            </div>
                            
                            <div class="bg-gray-800/60 rounded p-2 border border-green-500/30 overflow-x-auto">
                                <table class="w-full text-xs">
                                    <thead>
                                        <tr class="border-b border-cyan-500/30">
                                            <th class="text-left py-1.5 px-2 text-cyan-300 font-medium w-32">参数</th>
                                            <th class="text-center py-1.5 px-2 text-cyan-300 font-medium">钴 Co</th>
                                            <th class="text-center py-1.5 px-2 text-cyan-300 font-medium">镍 Ni</th>
                                            <th class="text-center py-1.5 px-2 text-cyan-300 font-medium">铜 Cu</th>
                                            <th class="text-center py-1.5 px-2 text-cyan-300 font-medium">锰 Mn</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr class="border-b border-gray-700/50">
                                            <td class="py-1.5 px-2 text-gray-300 font-medium whitespace-nowrap">金属品位(%)</td>
                                            <td class="text-center py-1.5 px-2">
                                                <input v-model.number="currentNoduleData.metalGrades.co" 
                                                       class="w-14 bg-gray-700/80 text-center rounded px-1 py-0.5 text-cyan-200 font-medium border border-gray-600 focus:outline-none focus:border-cyan-400 transition-colors" 
                                                       type="number" 
                                                       step="0.01">
                                            </td>
                                            <td class="text-center py-1.5 px-2">
                                                <input v-model.number="currentNoduleData.metalGrades.ni" 
                                                       class="w-14 bg-gray-700/80 text-center rounded px-1 py-0.5 text-cyan-200 font-medium border border-gray-600 focus:outline-none focus:border-cyan-400 transition-colors" 
                                                       type="number" 
                                                       step="0.01">
                                            </td>
                                            <td class="text-center py-1.5 px-2">
                                                <input v-model.number="currentNoduleData.metalGrades.cu" 
                                                       class="w-14 bg-gray-700/80 text-center rounded px-1 py-0.5 text-cyan-200 font-medium border border-gray-600 focus:outline-none focus:border-cyan-400 transition-colors" 
                                                       type="number" 
                                                       step="0.01">
                                            </td>
                                            <td class="text-center py-1.5 px-2">
                                                <input v-model.number="currentNoduleData.metalGrades.mn" 
                                                       class="w-14 bg-gray-700/80 text-center rounded px-1 py-0.5 text-cyan-200 font-medium border border-gray-600 focus:outline-none focus:border-cyan-400 transition-colors" 
                                                       type="number" 
                                                       step="0.01">
                                            </td>
                                        </tr>
                                        <tr class="border-b border-gray-700/50">
                                            <td class="py-1.5 px-2 text-gray-300 font-medium whitespace-nowrap">金属产量(吨)</td>
                                            <td class="text-center py-1.5 px-2 text-green-400 font-medium">{{ metalOutput.co.toLocaleString() }}</td>
                                            <td class="text-center py-1.5 px-2 text-green-400 font-medium">{{ metalOutput.ni.toLocaleString() }}</td>
                                            <td class="text-center py-1.5 px-2 text-green-400 font-medium">{{ metalOutput.cu.toLocaleString() }}</td>
                                            <td class="text-center py-1.5 px-2 text-green-400 font-medium">{{ metalOutput.mn.toLocaleString() }}</td>
                                        </tr>
                                        <tr class="border-b border-gray-700/50">
                                            <td class="py-1.5 px-2 text-gray-300 font-medium whitespace-nowrap">金属价格(元/吨)</td>
                                            <td class="text-center py-1.5 px-2">
                                                <input v-model.number="currentNoduleData.metalPrices.co" 
                                                       @input="updateUsdPrice('co')"
                                                       class="w-16 bg-gray-700/80 text-center rounded px-1 py-0.5 text-cyan-200 font-medium border border-gray-600 focus:outline-none focus:border-cyan-400 transition-colors" 
                                                       type="number">
                                            </td>
                                            <td class="text-center py-1.5 px-2">
                                                <input v-model.number="currentNoduleData.metalPrices.ni" 
                                                       @input="updateUsdPrice('ni')"
                                                       class="w-16 bg-gray-700/80 text-center rounded px-1 py-0.5 text-cyan-200 font-medium border border-gray-600 focus:outline-none focus:border-cyan-400 transition-colors" 
                                                       type="number">
                                            </td>
                                            <td class="text-center py-1.5 px-2">
                                                <input v-model.number="currentNoduleData.metalPrices.cu" 
                                                       @input="updateUsdPrice('cu')"
                                                       class="w-16 bg-gray-700/80 text-center rounded px-1 py-0.5 text-cyan-200 font-medium border border-gray-600 focus:outline-none focus:border-cyan-400 transition-colors" 
                                                       type="number">
                                            </td>
                                            <td class="text-center py-1.5 px-2">
                                                <input v-model.number="currentNoduleData.metalPrices.mn" 
                                                       @input="updateUsdPrice('mn')"
                                                       class="w-16 bg-gray-700/80 text-center rounded px-1 py-0.5 text-cyan-200 font-medium border border-gray-600 focus:outline-none focus:border-cyan-400 transition-colors" 
                                                       type="number">
                                            </td>
                                        </tr>
                                        <tr class="border-b border-gray-700/50">
                                            <td class="py-1.5 px-2 text-gray-300 font-medium whitespace-nowrap">金属价格(美元/吨)</td>
                                            <td class="text-center py-1.5 px-2">
                                                <input v-model.number="metalPricesUsd.co" 
                                                       @input="updateCnyPrice('co')"
                                                       class="w-16 bg-gray-700/80 text-center rounded px-1 py-0.5 text-yellow-200 font-medium border border-gray-600 focus:outline-none focus:border-yellow-400 transition-colors" 
                                                       type="number">
                                            </td>
                                            <td class="text-center py-1.5 px-2">
                                                <input v-model.number="metalPricesUsd.ni" 
                                                       @input="updateCnyPrice('ni')"
                                                       class="w-16 bg-gray-700/80 text-center rounded px-1 py-0.5 text-yellow-200 font-medium border border-gray-600 focus:outline-none focus:border-yellow-400 transition-colors" 
                                                       type="number">
                                            </td>
                                            <td class="text-center py-1.5 px-2">
                                                <input v-model.number="metalPricesUsd.cu" 
                                                       @input="updateCnyPrice('cu')"
                                                       class="w-16 bg-gray-700/80 text-center rounded px-1 py-0.5 text-yellow-200 font-medium border border-gray-600 focus:outline-none focus:border-yellow-400 transition-colors" 
                                                       type="number">
                                            </td>
                                            <td class="text-center py-1.5 px-2">
                                                <input v-model.number="metalPricesUsd.mn" 
                                                       @input="updateCnyPrice('mn')"
                                                       class="w-16 bg-gray-700/80 text-center rounded px-1 py-0.5 text-yellow-200 font-medium border border-gray-600 focus:outline-none focus:border-yellow-400 transition-colors" 
                                                       type="number">
                                            </td>
                                        </tr>
                                        <tr class="border-b border-gray-700/50">
                                            <td class="py-1.5 px-2 text-gray-300 font-medium whitespace-nowrap">金属价值(万元)</td>
                                            <td class="text-center py-1.5 px-2 text-orange-400 font-medium text-xs">{{ formatCurrency(metalValue.co / 10000) }}</td>
                                            <td class="text-center py-1.5 px-2 text-orange-400 font-medium text-xs">{{ formatCurrency(metalValue.ni / 10000) }}</td>
                                            <td class="text-center py-1.5 px-2 text-orange-400 font-medium text-xs">{{ formatCurrency(metalValue.cu / 10000) }}</td>
                                            <td class="text-center py-1.5 px-2 text-orange-400 font-medium text-xs">{{ formatCurrency(metalValue.mn / 10000) }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- 产品信息配置 -->
                        <div class="bg-gradient-to-br from-orange-900/30 to-red-800/20 rounded-lg p-2 border border-orange-500/50 flex-1">
                            <div class="flex items-center gap-1 mb-2">
                                <div class="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs">3</div>
                                <h3 class="text-xs font-bold text-orange-300">产品信息配置</h3>
                            </div>
                            
                            <div class="bg-gray-800/60 rounded p-2 border border-orange-500/30 overflow-x-auto">
                                <table class="w-full text-xs">
                                    <thead>
                                        <tr class="border-b border-cyan-500/30">
                                            <th class="text-left py-1.5 px-2 text-cyan-300 font-medium w-24">参数</th>
                                            <th class="text-center py-1.5 px-2 text-cyan-300 font-medium">硫酸钴</th>
                                            <th class="text-center py-1.5 px-2 text-cyan-300 font-medium">硫酸镍</th>
                                            <th class="text-center py-1.5 px-2 text-cyan-300 font-medium">硫酸铜</th>
                                            <th class="text-center py-1.5 px-2 text-cyan-300 font-medium">硅锰合金</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr class="border-b border-gray-700/50">
                                            <td class="py-1.5 px-2 text-gray-300 font-medium whitespace-nowrap">产品品位(%)</td>
                                            <td class="text-center py-1.5 px-2">
                                                <input v-model.number="currentNoduleData.productGrades.co" 
                                                       class="w-12 bg-gray-700/80 text-center rounded px-1 py-0.5 text-cyan-200 font-medium border border-gray-600 focus:outline-none focus:border-cyan-400 transition-colors" 
                                                       type="number" 
                                                       step="0.1">
                                            </td>
                                            <td class="text-center py-1.5 px-2">
                                                <input v-model.number="currentNoduleData.productGrades.ni" 
                                                       class="w-12 bg-gray-700/80 text-center rounded px-1 py-0.5 text-cyan-200 font-medium border border-gray-600 focus:outline-none focus:border-cyan-400 transition-colors" 
                                                       type="number" 
                                                       step="0.1">
                                            </td>
                                            <td class="text-center py-1.5 px-2">
                                                <input v-model.number="currentNoduleData.productGrades.cu" 
                                                       class="w-12 bg-gray-700/80 text-center rounded px-1 py-0.5 text-cyan-200 font-medium border border-gray-600 focus:outline-none focus:border-cyan-400 transition-colors" 
                                                       type="number" 
                                                       step="0.1">
                                            </td>
                                            <td class="text-center py-1.5 px-2">
                                                <input v-model.number="currentNoduleData.productGrades.mn" 
                                                       class="w-12 bg-gray-700/80 text-center rounded px-1 py-0.5 text-cyan-200 font-medium border border-gray-600 focus:outline-none focus:border-cyan-400 transition-colors" 
                                                       type="number" 
                                                       step="0.1">
                                            </td>
                                        </tr>
                                        <tr class="border-b border-gray-700/50">
                                            <td class="py-1.5 px-2 text-gray-300 font-medium whitespace-nowrap">产品产量(吨)</td>
                                            <td class="text-center py-1.5 px-2 text-green-400 font-medium text-xs">{{ formatCurrency(productOutput.co) }}</td>
                                            <td class="text-center py-1.5 px-2 text-green-400 font-medium text-xs">{{ formatCurrency(productOutput.ni) }}</td>
                                            <td class="text-center py-1.5 px-2 text-green-400 font-medium text-xs">{{ formatCurrency(productOutput.cu) }}</td>
                                            <td class="text-center py-1.5 px-2 text-green-400 font-medium text-xs">{{ formatCurrency(productOutput.mn) }}</td>
                                        </tr>
                                        <tr class="border-b border-gray-700/50">
                                            <td class="py-1.5 px-2 text-gray-300 font-medium whitespace-nowrap">产品价格(元/吨)</td>
                                            <td class="text-center py-1.5 px-2">
                                                <input v-model.number="currentNoduleData.productPrices.co" 
                                                       class="w-14 bg-gray-700/80 text-center rounded px-1 py-0.5 text-cyan-200 font-medium border border-gray-600 focus:outline-none focus:border-cyan-400 transition-colors" 
                                                       type="number">
                                            </td>
                                            <td class="text-center py-1.5 px-2">
                                                <input v-model.number="currentNoduleData.productPrices.ni" 
                                                       class="w-14 bg-gray-700/80 text-center rounded px-1 py-0.5 text-cyan-200 font-medium border border-gray-600 focus:outline-none focus:border-cyan-400 transition-colors" 
                                                       type="number">
                                            </td>
                                            <td class="text-center py-1.5 px-2">
                                                <input v-model.number="currentNoduleData.productPrices.cu" 
                                                       class="w-14 bg-gray-700/80 text-center rounded px-1 py-0.5 text-cyan-200 font-medium border border-gray-600 focus:outline-none focus:border-cyan-400 transition-colors" 
                                                       type="number">
                                            </td>
                                            <td class="text-center py-1.5 px-2">
                                                <input v-model.number="currentNoduleData.productPrices.mn" 
                                                       class="w-14 bg-gray-700/80 text-center rounded px-1 py-0.5 text-cyan-200 font-medium border border-gray-600 focus:outline-none focus:border-cyan-400 transition-colors" 
                                                       type="number">
                                            </td>
                                        </tr>
                                        <tr class="border-b border-gray-700/50">
                                            <td class="py-1.5 px-2 text-gray-300 font-medium whitespace-nowrap">产品价值(万元)</td>
                                            <td class="text-center py-1.5 px-2 text-orange-400 font-medium text-xs">{{ formatCurrency(productValue.co / 10000) }}</td>
                                            <td class="text-center py-1.5 px-2 text-orange-400 font-medium text-xs">{{ formatCurrency(productValue.ni / 10000) }}</td>
                                            <td class="text-center py-1.5 px-2 text-orange-400 font-medium text-xs">{{ formatCurrency(productValue.cu / 10000) }}</td>
                                            <td class="text-center py-1.5 px-2 text-orange-400 font-medium text-xs">{{ formatCurrency(productValue.mn / 10000) }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- 总产值与操作 - 合并金属和产品总产值 -->
                        <div class="bg-gradient-to-br from-purple-900/40 to-emerald-900/40 rounded-lg p-2 border border-purple-500/50">
                            <div class="flex items-center justify-between">
                                <!-- 左侧：金属和产品总产值 -->
                                <div class="flex items-center gap-6">
                                    <!-- 金属总产值 -->
                                    <div class="flex items-center gap-2">
                                        <div class="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50">
                                            <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div class="text-xs text-gray-400">金属年度总产值</div>
                                            <div class="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400">¥ {{ formatCurrency(totalProductValue / 10000) }} 万元</div>
                                        </div>
                                    </div>
                                    
                                    <!-- 产品总产值 -->
                                    <div class="flex items-center gap-2">
                                        <div class="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/50">
                                            <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div class="text-xs text-gray-400">产品年度总产值</div>
                                            <div class="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">¥ {{ formatCurrency((productValue.co + productValue.ni + productValue.cu + productValue.mn) / 10000) }} 万元</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- 右侧：操作按钮 -->
                                <div class="flex gap-1.5">
                                    <button @click="calculateAll" class="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded text-xs font-medium transition-all shadow-md hover:shadow-cyan-500/50 flex items-center gap-1">
                                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        刷新计算
                                    </button>
                                    <button @click="resetData" class="px-3 py-1.5 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 rounded text-xs font-medium transition-all shadow-md flex items-center gap-1">
                                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        重置数据
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <!-- 右侧：图表区域 -->
                <div class="w-[45%] bg-gray-900/30 p-2 flex flex-col">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-1.5">
                            <div class="w-1 h-4 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full"></div>
                            <h3 class="text-sm font-bold text-cyan-300">
                                {{ chartMode === 'production' ? '金属产量对比图表' : 
                                   chartMode === 'value' ? '金属价值对比图表' : '金属消费对比图表' }}
                            </h3>
                        </div>
                        
                        <!-- 切换按钮 -->
                        <div class="flex bg-gray-800/60 rounded-lg p-0.5 border border-cyan-500/30">
                            <button @click="chartMode = 'consumption'" 
                                    :class="['px-2 py-1 text-xs font-medium rounded transition-all duration-200',
                                        chartMode === 'consumption' 
                                            ? 'bg-cyan-500/80 text-white shadow-md' 
                                            : 'text-cyan-300 hover:text-cyan-200 hover:bg-gray-700/50']">
                                金属消费
                            </button>
                            <button @click="chartMode = 'production'" 
                                    :class="['px-2 py-1 text-xs font-medium rounded transition-all duration-200',
                                        chartMode === 'production' 
                                            ? 'bg-cyan-500/80 text-white shadow-md' 
                                            : 'text-cyan-300 hover:text-cyan-200 hover:bg-gray-700/50']">
                                金属产量
                            </button>
                            <button @click="chartMode = 'value'" 
                                    :class="['px-2 py-1 text-xs font-medium rounded transition-all duration-200',
                                        chartMode === 'value' 
                                            ? 'bg-cyan-500/80 text-white shadow-md' 
                                            : 'text-cyan-300 hover:text-cyan-200 hover:bg-gray-700/50']">
                                金属价值
                            </button>
                        </div>
                    </div>
                    
                    <!-- 四个图表区域 -->
                    <div class="grid grid-cols-2 gap-2 flex-1">
                        <!-- 钴图表 - 紫色主题 -->
                        <div class="relative rounded-lg border-2 border-purple-500/50 backdrop-blur-sm hover:border-purple-400/70 transition-all p-2 overflow-hidden" style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(15, 23, 42, 0.9) 100%);">
                            <div class="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
                            <div class="text-xs text-white font-bold mb-1 text-center" style="text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);">
                                钴 (Co) {{ chartMode === 'production' ? '产量对比' : chartMode === 'value' ? '价值对比' : '消费对比' }}
                            </div>
                            <div ref="coChartRef" class="w-full" style="height: 200px;"></div>
                        </div>
                        
                        <!-- 镍图表 - 绿色主题 -->
                        <div class="relative rounded-lg border-2 border-emerald-500/50 backdrop-blur-sm hover:border-emerald-400/70 transition-all p-2 overflow-hidden" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.9) 100%);">
                            <div class="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
                            <div class="text-xs text-white font-bold mb-1 text-center" style="text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);">
                                镍 (Ni) {{ chartMode === 'production' ? '产量对比' : chartMode === 'value' ? '价值对比' : '消费对比' }}
                            </div>
                            <div ref="niChartRef" class="w-full" style="height: 200px;"></div>
                        </div>
                        
                        <!-- 铜图表 - 橙色主题 -->
                        <div class="relative rounded-lg border-2 border-orange-500/50 backdrop-blur-sm hover:border-orange-400/70 transition-all p-2 overflow-hidden" style="background: linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(15, 23, 42, 0.9) 100%);">
                            <div class="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>
                            <div class="text-xs text-white font-bold mb-1 text-center" style="text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);">
                                铜 (Cu) {{ chartMode === 'production' ? '产量对比' : chartMode === 'value' ? '价值对比' : '消费对比' }}
                            </div>
                            <div ref="cuChartRef" class="w-full" style="height: 200px;"></div>
                        </div>
                        
                        <!-- 锰图表 - 蓝色主题 -->
                        <div class="relative rounded-lg border-2 border-blue-500/50 backdrop-blur-sm hover:border-blue-400/70 transition-all p-2 overflow-hidden" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(15, 23, 42, 0.9) 100%);">
                            <div class="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
                            <div class="text-xs text-white font-bold mb-1 text-center" style="text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);">
                                锰 (Mn) {{ chartMode === 'production' ? '产量对比' : chartMode === 'value' ? '价值对比' : '消费对比' }}
                            </div>
                            <div ref="mnChartRef" class="w-full" style="height: 200px;"></div>
                        </div>
                    </div>
                    
                    <!-- 图例说明 - 只在非消费模式下显示 -->
                    <div v-if="chartMode !== 'consumption'" class="mt-2 flex justify-center gap-4 text-xs">
                        <div class="flex items-center gap-1">
                            <div class="w-3 h-3 rounded bg-gradient-to-b from-green-500 to-green-600"></div>
                            <span class="text-white font-bold" style="text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);">
                                {{ chartMode === 'production' ? '预测产量' : '预测价值' }}
                            </span>
                        </div>
                        <div class="flex items-center gap-1">
                            <div class="w-3 h-3 rounded bg-gradient-to-b from-blue-500 to-blue-600"></div>
                            <span class="text-white font-bold" style="text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);">
                                {{ chartMode === 'production' ? '中国产量' : '中国价值' }}
                            </span>
                        </div>
                        <div class="flex items-center gap-1">
                            <div class="w-3 h-3 rounded bg-gradient-to-b from-purple-500 to-purple-600"></div>
                            <span class="text-white font-bold" style="text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);">
                                {{ chartMode === 'production' ? '全球产量' : '全球价值' }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
    </div>
</template>

<script>
import * as echarts from 'echarts';

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
            currentNoduleType: 0,
            miningAreaCount: 10,
            customAreaCount: 10,
            singleAreaProduction: 300,
            recoveryRate: 92,
            exchangeRate: 6.96,
            chartMode: 'consumption', // 图表模式：'consumption', 'production' 或 'value'
            metalPricesUsd: {
                co: 56290,
                ni: 17266,
                cu: 12780,
                mn: 2500
            },
            
            // 全球和中国金属产量数据（2023年，万吨）
            globalProduction: {
                co: 23,      // 全球钴产量 23万吨
                ni: 310,     // 全球镍产量 310万吨（消费量）
                cu: 2200,    // 全球铜产量 2200万吨
                mn: 1989     // 全球锰产量 1989万吨
            },
            chinaProduction: {
                co: 1.32,    // 中国钴产量 0.22+1.1=1.32万吨
                ni: 11,      // 中国镍产量 11万吨
                cu: 170,     // 中国铜产量 170万吨
                mn: 74       // 中国锰产量 74万吨
            },
            
            // 全球和中国金属消费数据（万吨）
            globalConsumption: {
                co: 20.48,   // 全球钴消费量 20.48万吨
                ni: 355.65,  // 全球镍消费量 355.65万吨
                cu: 2682.71, // 全球铜消费量 2682.71万吨
                mn: 2000     // 全球锰消费量 2000万吨
            },
            chinaConsumption: {
                co: 12.31,   // 中国钴消费量 12.31万吨
                ni: 232.52,  // 中国镍消费量 232.52万吨
                cu: 1535.75, // 中国铜消费量 1535.75万吨
                mn: 1198     // 中国锰消费量 1198万吨
            },
            
            // 全球和中国金属价值数据（基于产量和平均价格计算，万元）
            globalValue: {
                co: 0,  // 将在computed中计算
                ni: 0,  // 将在computed中计算
                cu: 0,  // 将在computed中计算
                mn: 0   // 将在computed中计算
            },
            chinaValue: {
                co: 0,  // 将在computed中计算
                ni: 0,  // 将在computed中计算
                cu: 0,  // 将在computed中计算
                mn: 0   // 将在computed中计算
            },
            
            // ECharts实例
            charts: {
                co: null,
                ni: null,
                cu: null,
                mn: null
            },
            
            noduleTypes: [
                {
                    name: '多金属结核',
                    metalGrades: { co: 0.20, ni: 1.30, cu: 1.10, mn: 28.70 },
                    metalPrices: { co: 391780, ni: 120215, cu: 88989, mn: 17400 },
                    productGrades: { co: 21, ni: 22, cu: 25.5, mn: 70 },
                    productPrices: { co: 98000, ni: 32000, cu: 26000, mn: 6000 }
                },
                {
                    name: '富钴铁锰结壳',
                    metalGrades: { co: 0.80, ni: 0.50, cu: 0.10, mn: 20.00 },
                    metalPrices: { co: 391780, ni: 120215, cu: 88989, mn: 17400 },
                    productGrades: { co: 21, ni: 22, cu: 25.5, mn: 70 },
                    productPrices: { co: 98000, ni: 32000, cu: 26000, mn: 6000 }
                },
                {
                    name: '多金属硫化物',
                    metalGrades: { co: 0.05, ni: 0.20, cu: 0.15, mn: 15.00 },
                    metalPrices: { co: 391780, ni: 120215, cu: 88989, mn: 17400 },
                    productGrades: { co: 21, ni: 22, cu: 25.5, mn: 70 },
                    productPrices: { co: 98000, ni: 32000, cu: 26000, mn: 6000 }
                },
                {
                    name: '深海稀土',
                    metalGrades: { co: 0.10, ni: 0.80, cu: 5.00, mn: 8.00 },
                    metalPrices: { co: 391780, ni: 120215, cu: 88989, mn: 17400 },
                    productGrades: { co: 21, ni: 22, cu: 25.5, mn: 70 },
                    productPrices: { co: 98000, ni: 32000, cu: 26000, mn: 6000 }
                }
            ]
        };
    },
    computed: {
        currentNoduleData() {
            return this.noduleTypes[this.currentNoduleType];
        },
        actualAreaCount() {
            return this.miningAreaCount === 'custom' ? this.customAreaCount : this.miningAreaCount;
        },
        totalNoduleProduction() {
            return this.actualAreaCount * this.singleAreaProduction;
        },
        metalOutput() {
            const noduleProduction = this.totalNoduleProduction * 10000;
            const recovery = this.recoveryRate / 100;
            const grades = this.currentNoduleData.metalGrades;
            
            return {
                co: Math.round(noduleProduction * grades.co / 100 * recovery),
                ni: Math.round(noduleProduction * grades.ni / 100 * recovery),
                cu: Math.round(noduleProduction * grades.cu / 100 * recovery),
                mn: Math.round(noduleProduction * grades.mn / 100 * recovery)
            };
        },
        metalValue() {
            const prices = this.currentNoduleData.metalPrices;
            return {
                co: this.metalOutput.co * prices.co,
                ni: this.metalOutput.ni * prices.ni,
                cu: this.metalOutput.cu * prices.cu,
                mn: this.metalOutput.mn * prices.mn
            };
        },
        // 预测产量（万吨）
        predictedProduction() {
            return {
                co: this.metalOutput.co / 10000,  // 转换为万吨
                ni: this.metalOutput.ni / 10000,
                cu: this.metalOutput.cu / 10000,
                mn: this.metalOutput.mn / 10000
            };
        },
        // 预测价值（万元）
        predictedValue() {
            return {
                co: this.metalValue.co / 10000,  // 转换为万元
                ni: this.metalValue.ni / 10000,
                cu: this.metalValue.cu / 10000,
                mn: this.metalValue.mn / 10000
            };
        },
        // 全球金属价值（万元）
        globalMetalValue() {
            const prices = this.currentNoduleData.metalPrices;
            return {
                co: this.globalProduction.co * 10000 * prices.co / 10000,  // 万吨 * 吨 * 元/吨 / 万元
                ni: this.globalProduction.ni * 10000 * prices.ni / 10000,
                cu: this.globalProduction.cu * 10000 * prices.cu / 10000,
                mn: this.globalProduction.mn * 10000 * prices.mn / 10000
            };
        },
        // 中国金属价值（万元）
        chinaMetalValue() {
            const prices = this.currentNoduleData.metalPrices;
            return {
                co: this.chinaProduction.co * 10000 * prices.co / 10000,
                ni: this.chinaProduction.ni * 10000 * prices.ni / 10000,
                cu: this.chinaProduction.cu * 10000 * prices.cu / 10000,
                mn: this.chinaProduction.mn * 10000 * prices.mn / 10000
            };
        },
        // 预测消费（万吨）- 假设预测消费等于预测产量
        predictedConsumption() {
            return {
                co: this.metalOutput.co / 10000,  // 转换为万吨
                ni: this.metalOutput.ni / 10000,
                cu: this.metalOutput.cu / 10000,
                mn: this.metalOutput.mn / 10000
            };
        },
        productOutput() {
            const grades = this.currentNoduleData.productGrades;
            return {
                co: this.metalOutput.co / (grades.co / 100),
                ni: this.metalOutput.ni / (grades.ni / 100),
                cu: this.metalOutput.cu / (grades.cu / 100),
                mn: this.metalOutput.mn / (grades.mn / 100)
            };
        },
        productValue() {
            const prices = this.currentNoduleData.productPrices;
            return {
                co: this.productOutput.co * prices.co,
                ni: this.productOutput.ni * prices.ni,
                cu: this.productOutput.cu * prices.cu,
                mn: this.productOutput.mn * prices.mn
            };
        },
        totalProductValue() {
            return this.metalValue.co + this.metalValue.ni + this.metalValue.cu + this.metalValue.mn;
        }
    },
    methods: {
        getTypeDescription(index) {
            const descriptions = [
                '深海结核矿物',
                '富含钴元素',
                '软质沉积物',
                '热液成因矿物'
            ];
            return descriptions[index] || '';
        },
        formatCurrency(value) {
            return new Intl.NumberFormat('zh-CN').format(Math.round(value));
        },
        // 从人民币价格更新美元价格
        updateUsdPrice(metal) {
            const cnyPrice = this.currentNoduleData.metalPrices[metal];
            this.metalPricesUsd[metal] = Math.round(cnyPrice / this.exchangeRate);
        },
        // 从美元价格更新人民币价格
        updateCnyPrice(metal) {
            const usdPrice = this.metalPricesUsd[metal];
            this.currentNoduleData.metalPrices[metal] = Math.round(usdPrice * this.exchangeRate);
        },
        // 汇率变化时更新所有人民币价格
        updatePricesFromRate() {
            ['co', 'ni', 'cu', 'mn'].forEach(metal => {
                this.currentNoduleData.metalPrices[metal] = Math.round(this.metalPricesUsd[metal] * this.exchangeRate);
            });
        },
        calculateAll() {
            this.$forceUpdate();
            this.updateCharts();
        },
        
        // 创建ECharts配置
        createChartOption(metal) {
            const metalNames = { co: '钴', ni: '镍', cu: '铜', mn: '锰' };
            const isValueMode = this.chartMode === 'value';
            const isConsumptionMode = this.chartMode === 'consumption';
            
            const metalUnits = isValueMode ? 
                { co: '万元', ni: '万元', cu: '万元', mn: '万元' } : 
                { co: '万吨', ni: '万吨', cu: '万吨', mn: '万吨' };
            
            // 产量、价值和消费模式均使用柱状图
            let data;
            if (isValueMode) {
                data = [
                    this.predictedValue[metal],
                    this.chinaMetalValue[metal],
                    this.globalMetalValue[metal]
                ];
            } else if (isConsumptionMode) {
                data = [
                    this.predictedProduction[metal],
                    this.chinaConsumption[metal],
                    this.globalConsumption[metal]
                ];
            } else {
                data = [
                    this.predictedProduction[metal],
                    this.chinaProduction[metal],
                    this.globalProduction[metal]
                ];
            }
            
            const maxValue = Math.max(...data);
            const yAxisMax = maxValue * 1.08;
            
            let xAxisData = ['预测', '中国', '全球'];
            if (isConsumptionMode) {
                xAxisData = ['预测产量', '中国消费量', '世界消费量'];
            } else if (isValueMode) {
                xAxisData = ['预测价值', '中国价值', '全球价值'];
            } else {
                xAxisData = ['预测产量', '中国产量', '全球产量'];
            }

            return {
                backgroundColor: 'transparent',
                grid: {
                    left: '8%',
                    right: '5%',
                    top: '8%',
                    bottom: '8%',
                    containLabel: false
                },
                xAxis: {
                    type: 'category',
                    data: xAxisData,
                    axisLabel: {
                        color: '#ffffff',
                        fontSize: 10,
                        fontWeight: 'bold',
                        rotate: 0,
                        interval: 0,
                        textShadowColor: 'rgba(0, 0, 0, 0.5)',
                        textShadowBlur: 3,
                        textShadowOffsetX: 1,
                        textShadowOffsetY: 1
                    },
                    axisLine: {
                        lineStyle: {
                            color: '#475569'
                        }
                    },
                    axisTick: {
                        show: false
                    }
                },
                yAxis: {
                    type: 'value',
                    max: yAxisMax,
                    axisLabel: {
                        color: '#ffffff',
                        fontSize: 10,
                        fontWeight: 'bold',
                        textShadowColor: 'rgba(0, 0, 0, 0.5)',
                        textShadowBlur: 3,
                        textShadowOffsetX: 1,
                        textShadowOffsetY: 1,
                        formatter: function(value) {
                            if (value >= 1000) {
                                return (value / 1000).toFixed(0) + 'k';
                            } else if (value >= 100) {
                                return Math.round(value);
                            } else if (value >= 10) {
                                return value.toFixed(1);
                            } else {
                                return value.toFixed(2);
                            }
                        }
                    },
                    axisLine: {
                        show: false
                    },
                    axisTick: {
                        show: false
                    },
                    splitLine: {
                        lineStyle: {
                            color: '#334155',
                            opacity: 0.3
                        }
                    }
                },
                series: [{
                    type: 'bar',
                    data: [
                        {
                            value: data[0], // 预测数据
                            itemStyle: {
                                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                    { offset: 0, color: '#22c55e' },
                                    { offset: 1, color: '#16a34a' }
                                ])
                            }
                        },
                        {
                            value: data[1], // 中国数据
                            itemStyle: {
                                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                    { offset: 0, color: '#3b82f6' },
                                    { offset: 1, color: '#2563eb' }
                                ])
                            }
                        },
                        {
                            value: data[2], // 全球数据
                            itemStyle: {
                                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                    { offset: 0, color: '#a855f7' },
                                    { offset: 1, color: '#9333ea' }
                                ])
                            }
                        }
                    ],
                    barWidth: '55%',
                    barMaxWidth: 40,
                    label: {
                        show: true,
                        position: 'top',
                        color: '#e2e8f0',
                        fontSize: 10,
                        fontWeight: 'bold',
                        formatter: function(params) {
                            const value = params.value;
                            if (value >= 1000) {
                                return (value / 1000).toFixed(1) + 'k';
                            } else if (value >= 100) {
                                return Math.round(value);
                            } else if (value >= 10) {
                                return value.toFixed(1);
                            } else {
                                return value.toFixed(2);
                            }
                        }
                    }
                }],
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderColor: '#06b6d4',
                    borderWidth: 1,
                    textStyle: {
                        color: '#e2e8f0',
                        fontSize: 12
                    },
                    formatter: (params) => {
                        const param = params[0];
                        const modeText = isValueMode ? '价值对比' : isConsumptionMode ? '消费对比' : '产量对比';
                        return `<div style="padding: 6px;">
                                <div style="color: #06b6d4; font-weight: bold; margin-bottom: 6px; font-size: 13px;">${metalNames[metal]}${modeText}</div>
                                <div style="font-size: 12px;">${param.name}: <span style="color: #22c55e; font-weight: bold;">${param.value.toLocaleString()}</span> ${metalUnits[metal]}</div>
                                </div>`;
                    }
                }
            };
        },
        
        // 获取消费数据用于环形图
        getConsumptionData(metal) {
            const consumptionMaps = {
                co: {
                    total: 17,
                    data: [
                        { name: '中国', value: 11.22, itemStyle: { color: '#3b82f6' } },
                        { name: '日韩等亚洲国家', value: 3.4, itemStyle: { color: '#f59e0b' } },
                        { name: '欧洲', value: 1.36, itemStyle: { color: '#10b981' } },
                        { name: '美国', value: 0.85, itemStyle: { color: '#f59e0b' } },
                        { name: '其他', value: 0.17, itemStyle: { color: '#6b7280' } }
                    ]
                },
                ni: {
                    total: 310,
                    data: [
                        { name: '中国', value: 195.3, itemStyle: { color: '#3b82f6' } },
                        { name: '印度尼西亚', value: 34.1, itemStyle: { color: '#f59e0b' } },
                        { name: '日本', value: 15.5, itemStyle: { color: '#10b981' } },
                        { name: '美国', value: 12.4, itemStyle: { color: '#f59e0b' } },
                        { name: '韩国', value: 9.3, itemStyle: { color: '#10b981' } },
                        { name: '印度', value: 6.2, itemStyle: { color: '#8b5cf6' } },
                        { name: '其他', value: 37.2, itemStyle: { color: '#6b7280' } }
                    ]
                },
                cu: {
                    total: 2515,
                    data: [
                        { name: '中国', value: 1509, itemStyle: { color: '#ef4444' } },
                        { name: '美国', value: 150.9, itemStyle: { color: '#3b82f6' } },
                        { name: '德国', value: 75.45, itemStyle: { color: '#f59e0b' } },
                        { name: '印度', value: 75.45, itemStyle: { color: '#f59e0b' } },
                        { name: '日本', value: 75.45, itemStyle: { color: '#10b981' } },
                        { name: '其他', value: 628.75, itemStyle: { color: '#6b7280' } }
                    ]
                },
                mn: {
                    total: 2000,
                    data: [
                        { name: '中国', value: 1280, itemStyle: { color: '#3b82f6' } },
                        { name: '印度', value: 240, itemStyle: { color: '#f59e0b' } },
                        { name: '美国', value: 80, itemStyle: { color: '#10b981' } },
                        { name: '日本', value: 80, itemStyle: { color: '#3b82f6' } },
                        { name: '乌克兰', value: 40, itemStyle: { color: '#3b82f6' } },
                        { name: '其他', value: 280, itemStyle: { color: '#6b7280' } }
                    ]
                }
            };
            
            return consumptionMaps[metal] || consumptionMaps.co;
        },
        
        // 初始化图表
        initCharts() {
            this.$nextTick(() => {
                const metals = ['co', 'ni', 'cu', 'mn'];
                metals.forEach(metal => {
                    const chartDom = this.$refs[`${metal}ChartRef`];
                    if (chartDom) {
                        // 销毁已存在的图表实例
                        if (this.charts[metal]) {
                            this.charts[metal].dispose();
                        }
                        
                        // 创建新的图表实例
                        this.charts[metal] = echarts.init(chartDom);
                        this.charts[metal].setOption(this.createChartOption(metal));
                        
                        // 监听窗口大小变化
                        window.addEventListener('resize', () => {
                            if (this.charts[metal]) {
                                this.charts[metal].resize();
                            }
                        });
                    }
                });
            });
        },
        
        // 更新图表
        updateCharts() {
            this.$nextTick(() => {
                const metals = ['co', 'ni', 'cu', 'mn'];
                metals.forEach(metal => {
                    if (this.charts[metal]) {
                        // 使用 notMerge: true 和 lazyUpdate: false 确保完全替换配置
                        this.charts[metal].setOption(this.createChartOption(metal), {
                            notMerge: true,  // 不合并配置，完全替换
                            lazyUpdate: false  // 立即更新
                        });
                    }
                });
            });
        },
        resetData() {
            this.currentNoduleType = 0;
            this.miningAreaCount = 10;
            this.customAreaCount = 10;
            this.singleAreaProduction = 300;
            this.recoveryRate = 92;
            this.exchangeRate = 6.96;
            this.chartMode = 'production'; // 重置图表模式
            this.metalPricesUsd = {
                co: 56290,
                ni: 17266,
                cu: 12780,
                mn: 2500
            };
            
            this.noduleTypes = [
                {
                    name: '多金属结核',
                    metalGrades: { co: 0.20, ni: 1.30, cu: 1.10, mn: 28.70 },
                    metalPrices: { co: 391780, ni: 120215, cu: 88989, mn: 17400 },
                    productGrades: { co: 21, ni: 22, cu: 25.5, mn: 70 },
                    productPrices: { co: 98000, ni: 32000, cu: 26000, mn: 6000 }
                },
                {
                    name: '富钴结壳',
                    metalGrades: { co: 0.80, ni: 0.50, cu: 0.10, mn: 20.00 },
                    metalPrices: { co: 391780, ni: 120215, cu: 88989, mn: 17400 },
                    productGrades: { co: 21, ni: 22, cu: 25.5, mn: 70 },
                    productPrices: { co: 98000, ni: 32000, cu: 26000, mn: 6000 }
                },
                {
                    name: '多金属软泥',
                    metalGrades: { co: 0.05, ni: 0.20, cu: 0.15, mn: 15.00 },
                    metalPrices: { co: 391780, ni: 120215, cu: 88989, mn: 17400 },
                    productGrades: { co: 21, ni: 22, cu: 25.5, mn: 70 },
                    productPrices: { co: 98000, ni: 32000, cu: 26000, mn: 6000 }
                },
                {
                    name: '海底热液硫化物',
                    metalGrades: { co: 0.10, ni: 0.80, cu: 5.00, mn: 8.00 },
                    metalPrices: { co: 391780, ni: 120215, cu: 88989, mn: 17400 },
                    productGrades: { co: 21, ni: 22, cu: 25.5, mn: 70 },
                    productPrices: { co: 98000, ni: 32000, cu: 26000, mn: 6000 }
                }
            ];
            
            // 重新初始化图表
            this.$nextTick(() => {
                this.updateCharts();
            });
        }
    },
    mounted() {
        this.initCharts();
    },
    beforeUnmount() {
        // 销毁图表实例
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.dispose();
            }
        });
    },
    watch: {
        show(newVal) {
            if (newVal) {
                // 面板显示时重新初始化图表
                this.$nextTick(() => {
                    this.initCharts();
                });
            }
        },
        chartMode() {
            // 切换图表模式时重新初始化图表（完全清除旧配置）
            this.$nextTick(() => {
                const metals = ['co', 'ni', 'cu', 'mn'];
                metals.forEach(metal => {
                    const chartDom = this.$refs[`${metal}ChartRef`];
                    if (chartDom && this.charts[metal]) {
                        // 清空图表
                        this.charts[metal].clear();
                        // 设置新配置，使用 notMerge: true 确保完全替换
                        this.charts[metal].setOption(this.createChartOption(metal), {
                            notMerge: true,
                            lazyUpdate: false
                        });
                    }
                });
            });
        },
        predictedProduction: {
            handler() {
                this.updateCharts();
            },
            deep: true
        },
        currentNoduleType() {
            // 切换结核类型时更新图表
            this.$nextTick(() => {
                this.updateCharts();
            });
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
