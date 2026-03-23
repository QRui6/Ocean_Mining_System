<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
    <div class="bg-gradient-to-br from-gray-900/98 via-slate-900/98 to-gray-900/98 rounded-xl shadow-2xl w-[75vw] h-[70vh] flex flex-col border border-cyan-500/40 relative overflow-hidden">
      <!-- 装饰性背景 -->
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent pointer-events-none"></div>
      <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>
      
      <!-- 标题栏 -->
      <div class="relative flex items-center justify-between px-5 py-3 border-b border-cyan-500/30 bg-gray-900/50">
        <div class="flex items-center gap-3">
          <div class="w-1 h-6 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full"></div>
          <h2 class="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">技术经济评价公式</h2>
          
          <!-- 评价流程按钮 -->
          <button 
            @click="showFlowChart = true"
            class="ml-4 px-3 py-1 text-xs bg-gradient-to-r from-cyan-600/80 to-blue-600/80 hover:from-cyan-500 hover:to-blue-500 text-white rounded transition-all flex items-center gap-1.5 border border-cyan-400/30"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            评价流程
          </button>
        </div>
        <button @click="$emit('close')" class="text-gray-400 hover:text-cyan-400 transition-all hover:rotate-90 duration-300">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- 内容区域 -->
      <div class="relative flex-1 p-3 grid grid-cols-3 gap-2.5" style="height: calc(100% - 52px);">
        
        <!-- 左列 -->
        <div class="flex flex-col gap-2">
          <!-- 公式展示 -->
          <div class="bg-gradient-to-br from-gray-800/60 to-gray-800/40 rounded-lg p-2.5 border border-cyan-500/30 backdrop-blur-sm relative overflow-hidden group hover:border-cyan-400/50 transition-all">
            <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div class="relative flex items-center gap-1.5 mb-1.5">
              <div class="w-0.5 h-3.5 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full"></div>
              <h3 class="text-xs font-bold text-cyan-300">评价公式</h3>
            </div>
            <div class="relative space-y-0.5 text-xs">
              <div class="text-cyan-200/90 font-mono leading-snug">净现值：NPV = Σ(CI<sub>t</sub> - CO<sub>t</sub>)(1 - i<sub>0</sub>)<sup>-t</sup></div>
              <div class="text-cyan-200/90 font-mono leading-snug">内部收益率：NPV(IRR) = Σ(CI<sub>t</sub> - CO<sub>t</sub>)(1 - IRR)<sup>-t</sup> = 0</div>
              <div class="text-cyan-200/90 font-mono leading-snug">动态投资回收期：Σ(CI<sub>t</sub> - CO<sub>t</sub>)(1 - i<sub>c</sub>)<sup>-t</sup> = 0</div>
              <div class="text-yellow-400/90 text-xs mt-1 pt-1 border-t border-cyan-500/20">✓ 判断标准：NPV ≥ 0，IRR ≥ i<sub>c</sub>，项目经济可行</div>
            </div>
          </div>

          <!-- 生产情况及运营成本 -->
          <div class="bg-gradient-to-br from-gray-800/60 to-gray-800/40 rounded-lg p-2.5 border border-cyan-500/30 flex-1 backdrop-blur-sm hover:border-cyan-400/50 transition-all">
            <!-- 生产情况 -->
            <div class="flex items-center gap-1.5 mb-1.5">
              <div class="w-0.5 h-3.5 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full"></div>
              <h3 class="text-xs font-bold text-cyan-300">生产情况及项目周期</h3>
            </div>
            <div class="grid grid-cols-2 gap-1.5 mb-2.5">
              <div>
                <label class="text-xs text-gray-400 mb-0.5 block">现可行性分析（年）</label>
                <input v-model.number="params.feasibilityYears" type="number" class="w-full bg-gray-700/80 text-white px-1.5 py-0.5 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none text-xs transition-colors" />
              </div>
              <div>
                <label class="text-xs text-gray-400 mb-0.5 block">建设期（年）</label>
                <input v-model.number="params.constructionYears" type="number" class="w-full bg-gray-700/80 text-white px-1.5 py-0.5 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none text-xs transition-colors" />
              </div>
              <div>
                <label class="text-xs text-gray-400 mb-0.5 block">商业开采期（年）</label>
                <input v-model.number="params.operationYears" type="number" class="w-full bg-gray-700/80 text-white px-1.5 py-0.5 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none text-xs transition-colors" />
              </div>
              <div>
                <label class="text-xs text-gray-400 mb-0.5 block">关停期（年）</label>
                <input v-model.number="params.closureYears" type="number" class="w-full bg-gray-700/80 text-white px-1.5 py-0.5 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none text-xs transition-colors" />
              </div>
              <div>
                <label class="text-xs text-gray-400 mb-0.5 block flex items-center gap-1">
                  年产能（百万干吨）
                  <span v-if="capacityUpdated" class="text-[9px] text-yellow-400 animate-pulse">已反向更新!</span>
                </label>
                <input v-model.number="params.annualCapacity" type="number" step="0.01" class="w-full bg-gray-700/80 text-white px-1.5 py-0.5 rounded border focus:outline-none text-xs transition-colors" :class="capacityUpdated ? 'border-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.3)]' : 'border-gray-600 focus:border-cyan-500'" @input="capacityUpdated = false" />
              </div>
              <div>
                <label class="text-xs text-gray-400 mb-0.5 block">企业所得税</label>
                <input v-model="params.corporateTax" type="text" class="w-full bg-gray-700/80 text-white px-1.5 py-0.5 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none text-xs transition-colors" />
              </div>
              <div class="col-span-2">
                <label class="text-xs text-gray-400 mb-0.5 block">折现率</label>
                <input v-model="params.discountRate" type="text" class="w-full bg-gray-700/80 text-white px-1.5 py-0.5 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none text-xs transition-colors" />
              </div>
            </div>
            
            <!-- 运营成本 -->
            <div class="pt-2.5 border-t border-cyan-500/20">
              <div class="flex items-center gap-1.5 mb-1.5">
                <div class="w-0.5 h-3.5 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full"></div>
                <h3 class="text-xs font-bold text-cyan-300">运营成本（百万美元/年）</h3>
              </div>
              <div class="grid grid-cols-2 gap-1.5 text-xs items-center">
                <span class="text-gray-400">采矿及运输系统</span>
                <input v-model.number="params.operatingCost.mining" type="number" class="bg-gray-700/80 text-white px-1.5 py-0.5 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none text-xs transition-colors" />
                
                <span class="text-gray-400">冶炼系统</span>
                <input v-model.number="params.operatingCost.smelting" type="number" class="bg-gray-700/80 text-white px-1.5 py-0.5 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none text-xs transition-colors" />
                
                <span class="text-gray-400">定期更换设备费用</span>
                <input v-model.number="params.operatingCost.maintenance" type="number" class="bg-gray-700/80 text-white px-1.5 py-0.5 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none text-xs transition-colors" />
              </div>
            </div>
          </div>
        </div>

        <!-- 中列 -->
        <div class="flex flex-col gap-2">
          <!-- 固定投资 -->
          <div class="bg-gradient-to-br from-gray-800/60 to-gray-800/40 rounded-lg p-2.5 border border-cyan-500/30 backdrop-blur-sm hover:border-cyan-400/50 transition-all">
            <div class="flex items-center gap-1.5 mb-1.5">
              <div class="w-0.5 h-3.5 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full"></div>
              <h3 class="text-xs font-bold text-cyan-300">固定投资（百万美元）</h3>
            </div>
            <div class="grid grid-cols-2 gap-1.5 text-xs items-center">
              <span class="text-gray-400">现可行性研究</span>
              <input v-model.number="params.investment.feasibility" type="number" class="bg-gray-700/80 text-white px-1.5 py-0.5 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none text-xs transition-colors" />
              
              <span class="text-gray-400">采矿系统</span>
              <input v-model.number="params.investment.miningSystem" type="number" class="bg-gray-700/80 text-white px-1.5 py-0.5 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none text-xs transition-colors" />
              
              <span class="text-gray-400">运输系统</span>
              <input v-model.number="params.investment.transportSystem" type="number" class="bg-gray-700/80 text-white px-1.5 py-0.5 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none text-xs transition-colors" />
              
              <span class="text-gray-400">冶炼系统</span>
              <input v-model.number="params.investment.smeltingSystem" type="number" class="bg-gray-700/80 text-white px-1.5 py-0.5 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none text-xs transition-colors" />
            </div>
            <div class="pt-1.5 mt-1.5 border-t border-cyan-500/20 text-xs flex items-center justify-between">
              <span class="text-cyan-300 font-semibold">总投资：</span>
              <span class="text-white font-bold text-sm">{{ totalInvestment.toFixed(2) }} <span class="text-gray-400 text-xs">百万美元</span></span>
            </div>
          </div>

          <!-- 金属价格 -->
          <div class="bg-gradient-to-br from-gray-800/60 to-gray-800/40 rounded-lg p-2.5 border border-cyan-500/30 backdrop-blur-sm hover:border-cyan-400/50 transition-all">
            <div class="flex items-center gap-1.5 mb-1.5">
              <div class="w-0.5 h-3.5 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full"></div>
              <h3 class="text-xs font-bold text-cyan-300">金属价格（美元/吨）</h3>
            </div>
            <div class="grid grid-cols-2 gap-1.5 text-xs items-center">
              <span class="text-gray-400">锰矿石</span>
              <input v-model.number="params.metalPrices.manganese" type="number" class="bg-gray-700/80 text-white px-1.5 py-0.5 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none text-xs transition-colors" />
              
              <span class="text-gray-400">镍</span>
              <input v-model.number="params.metalPrices.nickel" type="number" class="bg-gray-700/80 text-white px-1.5 py-0.5 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none text-xs transition-colors" />
              
              <span class="text-gray-400">铜</span>
              <input v-model.number="params.metalPrices.copper" type="number" class="bg-gray-700/80 text-white px-1.5 py-0.5 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none text-xs transition-colors" />
              
              <span class="text-gray-400">钴</span>
              <input v-model.number="params.metalPrices.cobalt" type="number" class="bg-gray-700/80 text-white px-1.5 py-0.5 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none text-xs transition-colors" />
            </div>
          </div>

          <!-- 计算结果 -->
          <div class="bg-gradient-to-br from-cyan-900/20 via-blue-900/20 to-purple-900/20 rounded-lg p-2.5 border border-cyan-500/40 flex-1 backdrop-blur-sm relative overflow-hidden group">
            <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div class="relative flex items-center gap-1.5 mb-2">
              <div class="w-0.5 h-3.5 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full"></div>
              <h3 class="text-xs font-bold text-cyan-300">计算结果</h3>
            </div>
            <div class="relative grid grid-cols-3 gap-1.5 text-center mb-2">
              <div class="bg-gray-800/60 rounded-lg p-1.5 border border-gray-700/50 hover:border-green-500/50 transition-all">
                <div class="text-gray-400 text-xs mb-0.5">净现值</div>
                <div class="text-base font-bold" :class="results.npv >= 0 ? 'text-green-400' : 'text-red-400'">
                  {{ results.npv.toFixed(2) }}
                </div>
                <div class="text-xs text-gray-500">百万美元</div>
              </div>
              <div class="bg-gray-800/60 rounded-lg p-1.5 border transition-all flex flex-col items-center group relative"
                   :class="isIRRInputMode ? 'border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'border-gray-700/50 hover:border-cyan-500/50'">
                <div class="text-gray-400 text-xs mb-0.5 w-full flex justify-between items-center px-1">
                  <span class="flex items-center gap-1">
                    内部收益率
                    <span v-if="isIRRInputMode" class="text-[9px] text-cyan-400 bg-cyan-900/40 px-1 rounded">目标设定</span>
                  </span>
                  <button @click="toggleIRRMode" 
                          class="text-gray-400 hover:text-cyan-300 transition-colors p-0.5 rounded-full hover:bg-gray-700" 
                          :title="isIRRInputMode ? '取消反算模式' : '点击设定目标IRR以反算产能'">
                    <svg v-if="!isIRRInputMode" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div class="flex items-center gap-1 w-full justify-center mt-0.5 h-7">
                  <template v-if="!isIRRInputMode">
                    <div class="text-base font-bold text-cyan-400" :class="{'animate-pulse-once': capacityUpdated}">
                      {{ results.irr.toFixed(2) }}%
                    </div>
                  </template>
                  <template v-else>
                    <div class="flex items-center bg-gray-900/80 rounded border border-cyan-500/50 px-1.5 py-0.5 w-full max-w-[90%]">
                      <input 
                        v-model.number="targetIRR" 
                        type="number" 
                        step="0.1" 
                        class="w-full bg-transparent text-cyan-300 font-bold text-sm outline-none text-right" 
                        @keyup.enter="applyTargetIRR"
                      />
                      <span class="text-cyan-400 font-bold text-sm ml-0.5">%</span>
                    </div>
                  </template>
                </div>
                
                <!-- 确认按钮（仅在输入模式显示） -->
                <div v-if="isIRRInputMode" class="absolute -bottom-7 left-1/2 transform -translate-x-1/2 z-10 w-[120%]">
                  <button @click="applyTargetIRR" 
                          class="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-[10px] font-bold py-1 px-2 rounded shadow-lg border border-cyan-400/50 flex items-center justify-center gap-1 transition-all">
                    <span>反算产能</span>
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
              <div class="bg-gray-800/60 rounded-lg p-1.5 border border-gray-700/50 hover:border-yellow-500/50 transition-all">
                <div class="text-gray-400 text-xs mb-0.5">投资回收期</div>
                <div class="text-base font-bold text-yellow-400">{{ results.paybackPeriod.toFixed(1) }}</div>
                <div class="text-xs text-gray-500">年</div>
              </div>
            </div>
            <div class="relative text-center">
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm" 
                    :class="results.feasible ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'">
                <span v-if="results.feasible">✓</span>
                <span v-else>✗</span>
                <span>{{ results.feasible ? '项目经济可行' : '项目经济不可行' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 右列：敏感性分析 -->
        <div class="bg-gradient-to-br from-gray-800/60 to-gray-800/40 rounded-lg p-2.5 border border-cyan-500/30 flex flex-col backdrop-blur-sm hover:border-cyan-400/50 transition-all relative overflow-hidden group">
          <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div class="relative flex items-center gap-1.5 mb-1.5">
            <div class="w-0.5 h-3.5 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full"></div>
            <h3 class="text-xs font-bold text-cyan-300">敏感性分析</h3>
          </div>
          
          <!-- 第一个图表：金属价格敏感性 -->
          <div class="relative flex-1 mb-2">
            <div class="text-xs text-gray-400 mb-1">金属价格敏感性</div>
            <div ref="chartRef1" class="w-full h-full"></div>
          </div>
          
          <!-- 第二个图表：投资和成本敏感性 -->
          <div class="relative flex-1">
            <div class="text-xs text-gray-400 mb-1">投资与成本敏感性</div>
            <div ref="chartRef2" class="w-full h-full"></div>
          </div>
        </div>
        
      </div>
    </div>
    
    <!-- 评价流程图弹窗 -->
    <div v-if="showFlowChart" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-auto" @click="showFlowChart = false">
      <div class="bg-gradient-to-br from-gray-900/98 via-slate-900/98 to-gray-900/98 rounded-xl shadow-2xl w-[50vw] border border-cyan-500/40 relative overflow-hidden" @click.stop>
        <!-- 装饰 -->
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent pointer-events-none"></div>
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>
        
        <!-- 标题 -->
        <div class="relative flex items-center justify-between px-5 py-3 border-b border-cyan-500/30 bg-gray-900/50">
          <div class="flex items-center gap-3">
            <div class="w-1 h-6 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full"></div>
            <h3 class="text-base font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">经济评价流程</h3>
          </div>
          <button @click="showFlowChart = false" class="text-gray-400 hover:text-cyan-400 transition-all hover:rotate-90 duration-300">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- 流程图内容 - 使用ECharts -->
        <div ref="flowChartRef" class="w-full h-[70vh]"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
  show: Boolean
});

const emit = defineEmits(['close']);

// 参数
const params = ref({
  feasibilityYears: 7,
  constructionYears: 4,
  operationYears: 25,
  closureYears: 1,
  annualCapacity: 3.86,
  corporateTax: '25%',
  discountRate: '15%',
  investment: {
    feasibility: 405,
    miningSystem: 1942,
    transportSystem: 143,
    smeltingSystem: 1558  // 修正：文档中是1558，不是1538
  },
  operatingCost: {
    mining: 540,
    smelting: 247,
    maintenance: 35
  },
  metalPrices: {
    manganese: 475,
    nickel: 20000,
    copper: 9000,
    cobalt: 60000
  },
  // 金属含量（根据文档）
  metalContent: {
    manganese: 0.284,  // 28.4%
    nickel: 0.013,     // 1.3%
    copper: 0.011,     // 1.1%
    cobalt: 0.002      // 0.2%
  }
});

const targetIRR = ref(15); // 默认目标 IRR 为 15%
const isIRRInputMode = ref(false); // 是否处于 IRR 输入反算模式
const capacityUpdated = ref(false); // 标记产能是否刚刚被反向更新

const toggleIRRMode = () => {
  isIRRInputMode.value = !isIRRInputMode.value;
  if (isIRRInputMode.value) {
    // 切换到输入模式时，将当前算出的 IRR 填入输入框作为起点
    targetIRR.value = Number(results.value.irr.toFixed(2));
    capacityUpdated.value = false;
  }
};

const applyTargetIRR = () => {
  if (requiredCapacity.value !== null) {
    // 将反算出的产能直接更新到左侧的输入框中（保留两位小数）
    params.value.annualCapacity = Number(requiredCapacity.value.toFixed(2));
    // 触发更新动画效果
    capacityUpdated.value = true;
    // 自动切回显示模式
    isIRRInputMode.value = false;
    
    // 3秒后取消高亮效果
    setTimeout(() => {
      capacityUpdated.value = false;
    }, 3000);
  }
};

const handleTargetIRRChange = () => {
  // 保留此方法以兼容之前的代码结构，但实际通过 applyTargetIRR 触发
};

const chartRef1 = ref(null);
const chartRef2 = ref(null);
let chartInstance1 = null;
let chartInstance2 = null;

// 流程图弹窗状态
const showFlowChart = ref(false);
const flowChartRef = ref(null);
let flowChartInstance = null;

// 初始化流程图
const initFlowChart = () => {
  if (!flowChartRef.value) return;
  
  if (flowChartInstance) {
    flowChartInstance.dispose();
  }
  
  flowChartInstance = echarts.init(flowChartRef.value);
  
  // 流程图数据结构
  const flowData = {
    name: '技术指标\n生产能力 · 回收率',
    itemStyle: { color: '#0891b2' },
    children: [
      {
        name: '收入',
        itemStyle: { color: '#475569' },
        children: [
          {
            name: '折现现金流法 DCF',
            itemStyle: { color: '#0e7490' },
            children: [
              {
                name: '评估指标\nNPV · IRR · 回收期',
                itemStyle: { color: '#0891b2' },
                children: [
                  { name: '期望值', itemStyle: { color: '#059669' } },
                  { name: '敏感度', itemStyle: { color: '#ca8a04' } },
                  { name: '风险度', itemStyle: { color: '#2563eb' } }
                ]
              }
            ]
          }
        ]
      }
    ]
  };
  
  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#00ffff',
      textStyle: { color: '#fff' }
    },
    series: [
      {
        type: 'tree',
        data: [flowData],
        top: '5%',
        left: '10%',
        bottom: '5%',
        right: '10%',
        symbolSize: 0,
        orient: 'vertical',
        layout: 'orthogonal',
        expandAndCollapse: false,
        initialTreeDepth: -1,
        label: {
          position: 'top',
          verticalAlign: 'middle',
          align: 'center',
          fontSize: 13,
          color: '#fff',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: 'rgba(34, 211, 238, 0.6)',
          borderRadius: 8,
          padding: [10, 16],
          shadowBlur: 8,
          shadowColor: 'rgba(34, 211, 238, 0.3)',
          shadowOffsetX: 0,
          shadowOffsetY: 2
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
            borderColor: 'rgba(34, 211, 238, 0.9)',
            shadowBlur: 12,
            shadowColor: 'rgba(34, 211, 238, 0.5)'
          }
        },
        lineStyle: {
          color: '#22d3ee',
          width: 2,
          shadowBlur: 8,
          shadowColor: 'rgba(34, 211, 238, 0.5)'
        },
        itemStyle: {
          borderWidth: 2,
          borderColor: 'rgba(34, 211, 238, 0.4)',
          shadowBlur: 6,
          shadowColor: 'rgba(0, 0, 0, 0.3)'
        }
      }
    ]
  };
  
  flowChartInstance.setOption(option);
  
  // 响应式调整
  const resizeHandler = () => {
    flowChartInstance?.resize();
  };
  window.addEventListener('resize', resizeHandler);
};

// 计算总投资
const totalInvestment = computed(() => {
  const inv = params.value.investment;
  return inv.feasibility + inv.miningSystem + inv.transportSystem + inv.smeltingSystem;
});

// 计算结果
const results = computed(() => {
  const discountRate = parseFloat(params.value.discountRate) / 100; // i_0 折现率
  const taxRate = parseFloat(params.value.corporateTax) / 100;
  
  // 项目总周期
  const totalYears = params.value.feasibilityYears + 
                     params.value.constructionYears + 
                     params.value.operationYears + 
                     params.value.closureYears;
  
  // 运营开始和结束年份
  const operationStartYear = params.value.feasibilityYears + params.value.constructionYears;
  const operationEndYear = operationStartYear + params.value.operationYears;
  
  // 年收入（CI_t 现金流入）
  // 修正：annualCapacity单位是百万吨，金属价格单位是美元/吨
  // 年收入(百万美元) = 产能(百万吨) × 单吨价值(美元/吨)
  const annualRevenue = params.value.annualCapacity * 
    (params.value.metalPrices.manganese * params.value.metalContent.manganese + 
     params.value.metalPrices.nickel * params.value.metalContent.nickel + 
     params.value.metalPrices.copper * params.value.metalContent.copper + 
     params.value.metalPrices.cobalt * params.value.metalContent.cobalt);
  
  // 年运营成本
  const annualOperatingCost = params.value.operatingCost.mining + 
                              params.value.operatingCost.smelting + 
                              params.value.operatingCost.maintenance;
  
  // 建设期投资分摊
  const constructionInvestment = params.value.investment.miningSystem + 
                                 params.value.investment.transportSystem + 
                                 params.value.investment.smeltingSystem;
  const annualConstructionCost = constructionInvestment / params.value.constructionYears;
  
  // ==================== 计算 NPV ====================
  // NPV = Σ(CI_t - CO_t)(1 - i_0)^-t
  let npv = 0;
  
  for (let t = 1; t <= totalYears; t++) {
    let CI_t = 0; // 第t年现金流入
    let CO_t = 0; // 第t年现金流出
    
    // 可行性研究期
    if (t <= params.value.feasibilityYears) {
      CO_t = params.value.investment.feasibility / params.value.feasibilityYears;
    }
    // 建设期
    else if (t <= operationStartYear) {
      CO_t = annualConstructionCost;
    }
    // 运营期
    else if (t <= operationEndYear) {
      CI_t = annualRevenue;
      CO_t = annualOperatingCost;
      // 考虑税收
      const profit = CI_t - CO_t;
      const tax = profit > 0 ? profit * taxRate : 0;
      CO_t += tax;
    }
    // 关停期
    else {
      CO_t = annualOperatingCost * 0.5; // 关停成本
    }
    
    // NPV累加：(CI_t - CO_t) * (1 + i_0)^-t
    npv += (CI_t - CO_t) * Math.pow(1 + discountRate, -t);
  }
  
  // ==================== 计算 IRR ====================
  // 使用二分法求解 IRR，使得 NPV(IRR) = 0
  let irrLow = -0.99;
  let irrHigh = 5.0;
  let irr = 0;
  const tolerance = 0.0001;
  
  for (let iteration = 0; iteration < 100; iteration++) {
    irr = (irrLow + irrHigh) / 2;
    let npvAtIRR = 0;
    
    for (let t = 1; t <= totalYears; t++) {
      let CI_t = 0;
      let CO_t = 0;
      
      if (t <= params.value.feasibilityYears) {
        CO_t = params.value.investment.feasibility / params.value.feasibilityYears;
      } else if (t <= operationStartYear) {
        CO_t = annualConstructionCost;
      } else if (t <= operationEndYear) {
        CI_t = annualRevenue;
        CO_t = annualOperatingCost;
        const profit = CI_t - CO_t;
        const tax = profit > 0 ? profit * taxRate : 0;
        CO_t += tax;
      } else {
        CO_t = annualOperatingCost * 0.5;
      }
      
      npvAtIRR += (CI_t - CO_t) * Math.pow(1 + irr, -t);
    }
    
    if (Math.abs(npvAtIRR) < tolerance) {
      break;
    }
    
    if (npvAtIRR > 0) {
      irrLow = irr;
    } else {
      irrHigh = irr;
    }
  }
  
  irr = irr * 100; // 转换为百分比
  
  // ==================== 计算动态投资回收期 ====================
  // 找到使得 Σ(CI_t - CO_t)(1 - i_c)^-t = 0 的最小 t
  let paybackPeriod = 0;
  let cumulativeNPV = 0;
  
  for (let t = 1; t <= totalYears; t++) {
    let CI_t = 0;
    let CO_t = 0;
    
    if (t <= params.value.feasibilityYears) {
      CO_t = params.value.investment.feasibility / params.value.feasibilityYears;
    } else if (t <= operationStartYear) {
      CO_t = annualConstructionCost;
    } else if (t <= operationEndYear) {
      CI_t = annualRevenue;
      CO_t = annualOperatingCost;
      const profit = CI_t - CO_t;
      const tax = profit > 0 ? profit * taxRate : 0;
      CO_t += tax;
    } else {
      CO_t = annualOperatingCost * 0.5;
    }
    
    cumulativeNPV += (CI_t - CO_t) * Math.pow(1 + discountRate, -t);
    
    if (cumulativeNPV >= 0 && paybackPeriod === 0) {
      paybackPeriod = t;
    }
  }
  
  if (paybackPeriod === 0) {
    paybackPeriod = totalYears;
  }
  
  // 可行性判断：NPV ≥ 0，IRR ≥ i_c
  const feasible = npv >= 0 && irr >= parseFloat(params.value.discountRate);
  
  return { npv, irr, paybackPeriod, feasible };
});

// 计算目标 IRR 对应的所需年产能
const requiredCapacity = computed(() => {
  if (targetIRR.value === null || isNaN(targetIRR.value)) return null;

  const targetRate = targetIRR.value / 100;
  const taxRate = parseFloat(params.value.corporateTax) / 100;
  
  const totalYears = params.value.feasibilityYears + 
                     params.value.constructionYears + 
                     params.value.operationYears + 
                     params.value.closureYears;
  
  const operationStartYear = params.value.feasibilityYears + params.value.constructionYears;
  const operationEndYear = operationStartYear + params.value.operationYears;

  // 每吨矿石的价值
  const perTonValue = params.value.metalPrices.manganese * params.value.metalContent.manganese + 
                      params.value.metalPrices.nickel * params.value.metalContent.nickel + 
                      params.value.metalPrices.copper * params.value.metalContent.copper + 
                      params.value.metalPrices.cobalt * params.value.metalContent.cobalt;

  if (perTonValue <= 0) return null;

  const annualOperatingCost = params.value.operatingCost.mining + 
                              params.value.operatingCost.smelting + 
                              params.value.operatingCost.maintenance;
  
  const constructionInvestment = params.value.investment.miningSystem + 
                                 params.value.investment.transportSystem + 
                                 params.value.investment.smeltingSystem;
  const annualConstructionCost = constructionInvestment / params.value.constructionYears;

  // 我们需要解方程：NPV(targetRate, capacity) = 0
  let capLow = 0.1;
  let capHigh = 100.0; // 扩大最大产能假设，从2000万吨扩大到1亿吨，以支持更高IRR的反算
  let cap = 0;
  const tolerance = 0.001;
  
  for (let iteration = 0; iteration < 100; iteration++) {
    cap = (capLow + capHigh) / 2;
    let npvAtCap = 0;
    const testRevenue = cap * perTonValue;
    
    for (let t = 1; t <= totalYears; t++) {
      let CI_t = 0;
      let CO_t = 0;
      
      if (t <= params.value.feasibilityYears) {
        CO_t = params.value.investment.feasibility / params.value.feasibilityYears;
      } else if (t <= operationStartYear) {
        CO_t = annualConstructionCost;
      } else if (t <= operationEndYear) {
        CI_t = testRevenue;
        CO_t = annualOperatingCost;
        const profit = CI_t - CO_t;
        const tax = profit > 0 ? profit * taxRate : 0;
        CO_t += tax;
      } else {
        CO_t = annualOperatingCost * 0.5;
      }
      
      npvAtCap += (CI_t - CO_t) * Math.pow(1 + targetRate, -t);
    }
    
    if (Math.abs(npvAtCap) < tolerance) {
      break;
    }
    
    // 如果算出来的 NPV < 0，说明产能不够，需要提高下限
    if (npvAtCap < 0) {
      capLow = cap;
    } else {
      capHigh = cap;
    }
  }
  
  return cap;
});

// 计算不同参数变化下的IRR（用于敏感性分析）
const calculateIRRWithChange = (paramType, changePercent) => {
  const change = 1 + changePercent / 100;
  const taxRate = parseFloat(params.value.corporateTax) / 100;
  
  const totalYears = params.value.feasibilityYears + 
                     params.value.constructionYears + 
                     params.value.operationYears + 
                     params.value.closureYears;
  
  const operationStartYear = params.value.feasibilityYears + params.value.constructionYears;
  const operationEndYear = operationStartYear + params.value.operationYears;
  
  // 根据参数类型调整相应的值
  let metalPrices = { ...params.value.metalPrices };
  let investment = { ...params.value.investment };
  let operatingCost = { ...params.value.operatingCost };
  let annualCapacity = params.value.annualCapacity;
  
  switch(paramType) {
    case 'manganese':
      metalPrices.manganese *= change;
      break;
    case 'nickel':
      metalPrices.nickel *= change;
      break;
    case 'copper':
      metalPrices.copper *= change;
      break;
    case 'cobalt':
      metalPrices.cobalt *= change;
      break;
    case 'miningInvestment':
      investment.miningSystem *= change;
      break;
    case 'smeltingInvestment':
      investment.smeltingSystem *= change;
      break;
    case 'operatingCost':
      operatingCost.mining *= change;
      operatingCost.smelting *= change;
      operatingCost.maintenance *= change;
      break;
    case 'capacity':
      annualCapacity *= change;
      break;
  }
  
  // 修正：使用正确的金属含量和单位换算
  const metalContent = params.value.metalContent;
  const annualRevenue = annualCapacity * 
    (metalPrices.manganese * metalContent.manganese + 
     metalPrices.nickel * metalContent.nickel + 
     metalPrices.copper * metalContent.copper + 
     metalPrices.cobalt * metalContent.cobalt);
  
  const annualOperatingCostValue = operatingCost.mining + operatingCost.smelting + operatingCost.maintenance;
  
  const constructionInvestment = investment.miningSystem + investment.transportSystem + investment.smeltingSystem;
  const annualConstructionCost = constructionInvestment / params.value.constructionYears;
  
  // 构建现金流数组
  const cashFlows = [];
  for (let t = 1; t <= totalYears; t++) {
    let CI_t = 0;
    let CO_t = 0;
    
    if (t <= params.value.feasibilityYears) {
      CO_t = params.value.investment.feasibility / params.value.feasibilityYears;
    } else if (t <= operationStartYear) {
      CO_t = annualConstructionCost;
    } else if (t <= operationEndYear) {
      CI_t = annualRevenue;
      CO_t = annualOperatingCostValue;
      const profit = CI_t - CO_t;
      const tax = profit > 0 ? profit * taxRate : 0;
      CO_t += tax;
    } else {
      CO_t = annualOperatingCostValue * 0.5;
    }
    
    cashFlows.push(CI_t - CO_t);
  }
  
  // 使用牛顿法求IRR
  let irr = 0.1; // 初始猜测值10%
  const maxIterations = 100;
  const tolerance = 0.00001;
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0; // NPV对IRR的导数
    
    for (let t = 0; t < cashFlows.length; t++) {
      const year = t + 1;
      npv += cashFlows[t] / Math.pow(1 + irr, year);
      dnpv -= year * cashFlows[t] / Math.pow(1 + irr, year + 1);
    }
    
    if (Math.abs(npv) < tolerance) {
      break;
    }
    
    if (Math.abs(dnpv) < 0.000001) {
      // 导数太小，使用二分法
      let low = -0.99;
      let high = 3.0;
      
      for (let j = 0; j < 50; j++) {
        irr = (low + high) / 2;
        let testNPV = 0;
        
        for (let t = 0; t < cashFlows.length; t++) {
          testNPV += cashFlows[t] / Math.pow(1 + irr, t + 1);
        }
        
        if (Math.abs(testNPV) < tolerance) break;
        
        if (testNPV > 0) {
          low = irr;
        } else {
          high = irr;
        }
      }
      break;
    }
    
    // 牛顿法迭代
    const newIRR = irr - npv / dnpv;
    
    // 限制IRR在合理范围内
    if (newIRR < -0.99) {
      irr = -0.99;
    } else if (newIRR > 3.0) {
      irr = 3.0;
    } else {
      irr = newIRR;
    }
  }
  
  return irr * 100; // 转换为百分比
};

// 初始化图表
const initCharts = () => {
  if (!chartRef1.value || !chartRef2.value) return;
  
  chartInstance1 = echarts.init(chartRef1.value);
  chartInstance2 = echarts.init(chartRef2.value);
  updateCharts();
};

// 更新图表
const updateCharts = () => {
  if (!chartInstance1 || !chartInstance2) return;
  
  const changeRates = [-30, -20, -10, 0, 10, 20, 30];
  
  // 计算金属价格敏感性数据
  const manganeseData = changeRates.map(rate => calculateIRRWithChange('manganese', rate));
  const nickelData = changeRates.map(rate => calculateIRRWithChange('nickel', rate));
  const copperData = changeRates.map(rate => calculateIRRWithChange('copper', rate));
  const cobaltData = changeRates.map(rate => calculateIRRWithChange('cobalt', rate));
  
  // 计算投资和成本敏感性数据
  const miningInvestmentData = changeRates.map(rate => calculateIRRWithChange('miningInvestment', rate));
  const smeltingInvestmentData = changeRates.map(rate => calculateIRRWithChange('smeltingInvestment', rate));
  const operatingCostData = changeRates.map(rate => calculateIRRWithChange('operatingCost', rate));
  const capacityData = changeRates.map(rate => calculateIRRWithChange('capacity', rate));
  
  const commonOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#00ffff',
      textStyle: { color: '#fff', fontSize: 10 }
    },
    grid: {
      left: '12%',
      right: '5%',
      bottom: '15%',
      top: '15%',
      containLabel: false
    },
    xAxis: {
      type: 'category',
      data: ['-30%', '-20%', '-10%', '0', '+10%', '+20%', '+30%'],
      axisLine: { lineStyle: { color: '#00ffff' } },
      axisLabel: { color: '#fff', fontSize: 9 }
    },
    yAxis: {
      type: 'value',
      name: 'IRR',
      nameTextStyle: { color: '#fff', fontSize: 10 },
      axisLine: { lineStyle: { color: '#00ffff' } },
      axisLabel: { color: '#fff', fontSize: 9 },
      splitLine: { lineStyle: { color: '#333' } }
    }
  };
  
  // 图表1：金属价格敏感性
  chartInstance1.setOption({
    ...commonOption,
    legend: {
      data: ['锰矿石', '镍', '铜', '钴'],
      textStyle: { color: '#fff', fontSize: 9 },
      top: 0,
      itemWidth: 15,
      itemHeight: 8
    },
    series: [
      {
        name: '锰矿石',
        type: 'line',
        data: manganeseData,
        smooth: true,
        lineStyle: { color: '#ff6b6b', width: 2 },
        itemStyle: { color: '#ff6b6b' },
        symbol: 'circle',
        symbolSize: 4
      },
      {
        name: '镍',
        type: 'line',
        data: nickelData,
        smooth: true,
        lineStyle: { color: '#4ecdc4', width: 2 },
        itemStyle: { color: '#4ecdc4' },
        symbol: 'circle',
        symbolSize: 4
      },
      {
        name: '铜',
        type: 'line',
        data: copperData,
        smooth: true,
        lineStyle: { color: '#95e1d3', width: 2 },
        itemStyle: { color: '#95e1d3' },
        symbol: 'circle',
        symbolSize: 4
      },
      {
        name: '钴',
        type: 'line',
        data: cobaltData,
        smooth: true,
        lineStyle: { color: '#f38181', width: 2 },
        itemStyle: { color: '#f38181' },
        symbol: 'circle',
        symbolSize: 4
      }
    ]
  });
  
  // 图表2：投资与成本敏感性
  chartInstance2.setOption({
    ...commonOption,
    legend: {
      data: ['采矿固定投资', '冶炼固定投资', '运营成本', '年产能'],
      textStyle: { color: '#fff', fontSize: 9 },
      top: 0,
      itemWidth: 15,
      itemHeight: 8
    },
    series: [
      {
        name: '采矿固定投资',
        type: 'line',
        data: miningInvestmentData,
        smooth: true,
        lineStyle: { color: '#ff6b6b', width: 2 },
        itemStyle: { color: '#ff6b6b' },
        symbol: 'circle',
        symbolSize: 4
      },
      {
        name: '冶炼固定投资',
        type: 'line',
        data: smeltingInvestmentData,
        smooth: true,
        lineStyle: { color: '#4ecdc4', width: 2 },
        itemStyle: { color: '#4ecdc4' },
        symbol: 'circle',
        symbolSize: 4
      },
      {
        name: '运营成本',
        type: 'line',
        data: operatingCostData,
        smooth: true,
        lineStyle: { color: '#95e1d3', width: 2 },
        itemStyle: { color: '#95e1d3' },
        symbol: 'circle',
        symbolSize: 4
      },
      {
        name: '年产能',
        type: 'line',
        data: capacityData,
        smooth: true,
        lineStyle: { color: '#ffd93d', width: 2 },
        itemStyle: { color: '#ffd93d' },
        symbol: 'circle',
        symbolSize: 4
      }
    ]
  });
  
  // 确保图表适应容器
  setTimeout(() => {
    chartInstance1?.resize();
    chartInstance2?.resize();
  }, 100);
};

// 监听显示状态
watch(() => props.show, (newVal) => {
  if (newVal) {
    nextTick(() => {
      initCharts();
    });
  }
});

// 监听流程图显示状态
watch(() => showFlowChart.value, (newVal) => {
  if (newVal) {
    nextTick(() => {
      initFlowChart();
    });
  }
});

// 监听参数变化，更新图表
watch(() => params.value, () => {
  if (chartInstance1 && chartInstance2) {
    updateCharts();
  }
}, { deep: true });

onMounted(() => {
  if (props.show) {
    initCharts();
  }
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    chartInstance1?.resize();
    chartInstance2?.resize();
  });
});

// 清理
onUnmounted(() => {
  if (chartInstance1) {
    chartInstance1.dispose();
  }
  if (chartInstance2) {
    chartInstance2.dispose();
  }
  if (flowChartInstance) {
    flowChartInstance.dispose();
  }
});
</script>
