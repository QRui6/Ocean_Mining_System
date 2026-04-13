<template>
  <div v-if="show" class="price-payback-panel fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-auto">
    <div class="relative h-[72vh] min-h-[560px] w-[73vw] max-w-[1180px] overflow-hidden rounded-xl border border-cyan-500/40 bg-gradient-to-br from-slate-950/98 via-slate-900/98 to-gray-950/98 shadow-2xl">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.08),transparent_32%)] pointer-events-none"></div>
      <div class="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-70"></div>

      <div class="relative flex items-center justify-between border-b border-cyan-500/30 bg-slate-950/50 px-5 py-3">
        <div class="flex items-center gap-3">
          <div class="h-6 w-1 rounded-full bg-gradient-to-b from-cyan-300 to-blue-500"></div>
          <div>
            <h3 class="text-lg font-bold tracking-wide text-cyan-100 drop-shadow-[0_0_8px_rgba(34,211,238,0.35)]">金属价格回本情景分析</h3>
            <p class="text-xs text-slate-400">基于当前经济分析参数，反算达到目标回本年限所需的金属价格</p>
          </div>
        </div>
        <button @click="$emit('close')" class="text-slate-400 transition-all duration-300 hover:rotate-90 hover:text-cyan-300">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="relative grid grid-cols-[1.05fr_1.35fr] gap-3 overflow-y-auto p-4 custom-scrollbar" style="height: calc(100% - 61px);">
        <div class="flex min-h-0 flex-col gap-3">
          <div class="rounded-lg border border-cyan-500/30 bg-slate-900/70 p-3">
            <div class="mb-3 flex items-center justify-between">
              <div class="text-sm font-bold text-cyan-200">目标设置</div>
              <div class="rounded-full border px-2 py-0.5 text-[11px]" :class="targetReached ? 'border-green-400/40 bg-green-500/15 text-green-300' : 'border-amber-400/40 bg-amber-500/15 text-amber-300'">
                {{ targetReached ? '当前已达标' : '需价格提升' }}
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <label class="space-y-1">
                <span class="text-xs text-slate-400">目标回本年限</span>
                <div class="relative">
                  <input v-model.number="targetPaybackYears" type="number" min="1" :max="totalYears" class="h-9 w-full rounded border border-slate-600 bg-slate-800/90 px-3 pr-8 text-sm font-bold text-white outline-none transition-colors focus:border-cyan-400">
                  <span class="absolute right-3 top-2 text-xs text-slate-400">年</span>
                </div>
              </label>
              <label class="space-y-1">
                <span class="text-xs text-slate-400">回本口径</span>
                <select v-model="paybackMode" class="h-9 w-full rounded border border-slate-600 bg-slate-800/90 px-3 text-sm font-bold text-white outline-none transition-colors focus:border-cyan-400">
                  <option value="dynamic">动态投资回收期（考虑折现）</option>
                  <option value="static">静态投资回收期（不折现）</option>
                </select>
              </label>
            </div>
            <p class="mt-2 text-[11px] leading-relaxed text-slate-500">动态投资回收期考虑折现率，更适合作为投资决策口径；静态投资回收期用于观察账面现金流回正时间。</p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-lg border border-green-500/30 bg-green-950/20 p-3">
              <div class="text-xs text-slate-400">当前{{ paybackModeLabel }}</div>
              <div class="mt-1 text-2xl font-black text-green-300">{{ formatPayback(baseMetrics.payback) }}</div>
              <div class="mt-1 text-[11px] text-slate-500">项目总周期 {{ totalYears }} 年</div>
            </div>
            <div class="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-3">
              <div class="text-xs text-slate-400">距离目标</div>
              <div class="mt-1 text-2xl font-black" :class="targetReached ? 'text-green-300' : 'text-amber-300'">
                {{ targetGapText }}
              </div>
              <div class="mt-1 text-[11px] text-slate-500">目标 {{ targetPaybackYears || 0 }} 年</div>
            </div>
          </div>

          <div class="rounded-lg border border-slate-700/70 bg-slate-900/70 p-3">
            <div class="mb-2 text-sm font-bold text-cyan-200">当前价格经济性</div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="rounded bg-slate-800/70 p-2">
                <div class="text-slate-400">NPV</div>
                <div class="mt-1 font-['Rajdhani'] text-lg font-black" :class="baseMetrics.npv >= 0 ? 'text-green-300' : 'text-red-300'">{{ baseMetrics.npv.toFixed(2) }}</div>
                <div class="text-slate-500">百万美元</div>
              </div>
              <div class="rounded bg-slate-800/70 p-2">
                <div class="text-slate-400">IRR</div>
                <div class="mt-1 font-['Rajdhani'] text-lg font-black text-cyan-300">{{ baseMetrics.irr.toFixed(2) }}%</div>
                <div class="text-slate-500">内部收益率</div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid min-h-[490px] grid-rows-[auto_minmax(260px,1fr)] gap-3">
          <div class="rounded-lg border border-amber-500/30 bg-slate-900/70 p-3">
            <div class="mb-2 flex items-center justify-between">
              <div>
                <div class="text-sm font-bold text-amber-200">综合价格系数反算</div>
                <div class="text-[11px] text-slate-500">假设四种金属按当前价格结构同步变化</div>
              </div>
              <div class="rounded-lg border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-right">
                <div class="text-[11px] text-amber-100/80">所需系数</div>
                <div class="font-['Rajdhani'] text-xl font-black text-amber-300">{{ multiplierResult.multiplier.toFixed(3) }}</div>
              </div>
            </div>
            <div class="grid grid-cols-4 gap-2">
              <div v-for="metal in metals" :key="metal.key" class="rounded border border-slate-700/70 bg-slate-800/70 p-2">
                <div class="text-xs text-slate-400">{{ metal.name }}</div>
                <div class="mt-1 font-['Rajdhani'] text-base font-black text-white">{{ formatMoney(multiplierResult.prices[metal.key]) }}</div>
                <div class="text-[10px] text-slate-500">美元/吨</div>
              </div>
            </div>
            <div class="mt-2 text-xs text-slate-400">
              {{ targetReached ? '当前价格已满足目标，综合价格无需上调。' : `若要实现 ${targetPaybackYears} 年内${paybackModeLabel}达标，综合价格约需提升 ${((multiplierResult.multiplier - 1) * 100).toFixed(1)}%。` }}
            </div>
          </div>

          <div class="flex min-h-0 flex-col rounded-lg border border-cyan-500/30 bg-slate-900/70 p-3">
            <div class="mb-2 flex items-center justify-between">
              <div>
                <div class="text-sm font-bold text-cyan-200">单金属最低价格反算</div>
                <div class="text-[11px] text-slate-500">固定其他金属价格，仅调整单个金属</div>
              </div>
              <div class="text-xs text-slate-400">敏感度最高：<span class="font-bold text-cyan-200">{{ mostSensitiveMetal.name }}</span></div>
            </div>
            <div class="grid grid-cols-4 gap-2">
              <div v-for="item in singleMetalResults" :key="item.key" class="rounded-lg border border-slate-700/70 bg-slate-800/70 p-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-200">{{ item.name }}</span>
                  <span class="text-[10px]" :class="item.reachable ? 'text-green-300' : 'text-red-300'">{{ item.reachable ? '可达' : '不可达' }}</span>
                </div>
                <div class="mt-2 font-['Rajdhani'] text-lg font-black text-white">{{ item.reachable ? formatMoney(item.price) : '超出范围' }}</div>
                <div class="text-[10px] text-slate-500">美元/吨</div>
                <div class="mt-1 text-[10px]" :class="item.increaseRate <= 0 ? 'text-green-300' : 'text-amber-300'">
                  {{ item.reachable ? formatIncrease(item.increaseRate) : '需组合调整' }}
                </div>
              </div>
            </div>
            <div class="mt-3 flex min-h-[128px] flex-1 flex-col rounded border border-slate-700/50 bg-slate-950/40 px-3 py-2">
              <div class="mb-1 text-[11px] text-slate-400">单金属价格提升幅度对比</div>
              <div class="grid min-h-0 flex-1 grid-cols-4 items-end gap-3">
                <div v-for="item in singleMetalResults" :key="`${item.key}-bar`" class="flex h-full min-h-0 flex-col items-center gap-1">
                  <div class="flex min-h-0 w-full flex-1 items-end">
                    <div
                      class="w-full rounded-t bg-gradient-to-t from-cyan-700 to-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.35)]"
                      :class="item.reachable ? 'opacity-95' : 'opacity-25'"
                      :style="{ height: item.reachable ? `${Math.max(10, Math.min(100, item.barHeight))}%` : '10%' }"
                    ></div>
                  </div>
                  <span class="text-[10px] text-slate-400">{{ item.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  params: {
    type: Object,
    required: true
  }
});

defineEmits(['close']);

const targetPaybackYears = ref(15);
const paybackMode = ref('dynamic');

const metals = [
  { key: 'manganese', name: '锰' },
  { key: 'nickel', name: '镍' },
  { key: 'copper', name: '铜' },
  { key: 'cobalt', name: '钴' }
];

const safePercent = (value) => {
  if (typeof value === 'number') return value / 100;
  return parseFloat(String(value).replace('%', '')) / 100 || 0;
};

const totalYears = computed(() => {
  return props.params.feasibilityYears + props.params.constructionYears + props.params.operationYears + props.params.closureYears;
});

const buildCashFlows = (priceOverrides = {}) => {
  const p = props.params;
  const metalPrices = { ...p.metalPrices, ...priceOverrides };
  const taxRate = safePercent(p.corporateTax);
  const operationStartYear = p.feasibilityYears + p.constructionYears;
  const operationEndYear = operationStartYear + p.operationYears;
  const perTonValue = metals.reduce((sum, metal) => {
    return sum + metalPrices[metal.key] * p.metalContent[metal.key];
  }, 0);
  const annualRevenue = p.annualCapacity * perTonValue;
  const annualOperatingCost = p.operatingCost.mining + p.operatingCost.smelting + p.operatingCost.maintenance;
  const constructionInvestment = p.investment.miningSystem + p.investment.transportSystem + p.investment.smeltingSystem;
  const annualConstructionCost = constructionInvestment / p.constructionYears;

  const cashFlows = [];
  for (let t = 1; t <= totalYears.value; t++) {
    let inflow = 0;
    let outflow = 0;

    if (t <= p.feasibilityYears) {
      outflow = p.investment.feasibility / p.feasibilityYears;
    } else if (t <= operationStartYear) {
      outflow = annualConstructionCost;
    } else if (t <= operationEndYear) {
      inflow = annualRevenue;
      outflow = annualOperatingCost;
      const profit = inflow - outflow;
      outflow += profit > 0 ? profit * taxRate : 0;
    } else {
      outflow = annualOperatingCost * 0.5;
    }

    cashFlows.push(inflow - outflow);
  }

  return cashFlows;
};

const calculateNpv = (cashFlows, rate) => {
  return cashFlows.reduce((sum, cashFlow, index) => {
    return sum + cashFlow / Math.pow(1 + rate, index + 1);
  }, 0);
};

const calculateIrr = (cashFlows) => {
  let low = -0.99;
  let high = 5;
  let irr = 0;
  const tolerance = 0.0001;

  for (let i = 0; i < 100; i++) {
    irr = (low + high) / 2;
    const npv = calculateNpv(cashFlows, irr);
    if (Math.abs(npv) < tolerance) break;
    if (npv > 0) {
      low = irr;
    } else {
      high = irr;
    }
  }

  return irr * 100;
};

const calculatePayback = (cashFlows, mode) => {
  const discountRate = safePercent(props.params.discountRate);
  let cumulative = 0;

  for (let index = 0; index < cashFlows.length; index++) {
    const year = index + 1;
    const value = mode === 'dynamic'
      ? cashFlows[index] / Math.pow(1 + discountRate, year)
      : cashFlows[index];
    cumulative += value;
    if (cumulative >= 0) return year;
  }

  return totalYears.value + 1;
};

const calculateMetrics = (priceOverrides = {}) => {
  const cashFlows = buildCashFlows(priceOverrides);
  const discountRate = safePercent(props.params.discountRate);
  return {
    npv: calculateNpv(cashFlows, discountRate),
    irr: calculateIrr(cashFlows),
    payback: calculatePayback(cashFlows, paybackMode.value)
  };
};

const baseMetrics = computed(() => calculateMetrics());

const paybackModeLabel = computed(() => paybackMode.value === 'dynamic' ? '动态投资回收期' : '静态投资回收期');

const targetReached = computed(() => baseMetrics.value.payback <= targetPaybackYears.value);

const targetGapText = computed(() => {
  if (targetReached.value) return `提前 ${Math.max(0, targetPaybackYears.value - baseMetrics.value.payback)} 年`;
  if (baseMetrics.value.payback > totalYears.value) return '未回本';
  return `晚 ${baseMetrics.value.payback - targetPaybackYears.value} 年`;
});

const solveMultiplier = () => {
  if (!targetPaybackYears.value || targetPaybackYears.value <= 0) return 1;
  if (targetReached.value) return 1;

  let low = 1;
  let high = 1.2;
  const canReach = (multiplier) => {
    const overrides = Object.fromEntries(metals.map(metal => [metal.key, props.params.metalPrices[metal.key] * multiplier]));
    return calculateMetrics(overrides).payback <= targetPaybackYears.value;
  };

  while (!canReach(high) && high < 20) {
    high *= 1.5;
  }

  if (high >= 20 && !canReach(high)) return high;

  for (let i = 0; i < 80; i++) {
    const mid = (low + high) / 2;
    if (canReach(mid)) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return high;
};

const multiplierResult = computed(() => {
  const multiplier = solveMultiplier();
  return {
    multiplier,
    prices: Object.fromEntries(metals.map(metal => [metal.key, props.params.metalPrices[metal.key] * multiplier]))
  };
});

const solveSingleMetalPrice = (metalKey) => {
  const currentPrice = props.params.metalPrices[metalKey];
  if (targetReached.value) {
    return { price: currentPrice, reachable: true };
  }

  const canReach = (price) => {
    return calculateMetrics({ [metalKey]: price }).payback <= targetPaybackYears.value;
  };

  let low = currentPrice;
  let high = currentPrice * 1.5 || 1;

  while (!canReach(high) && high < currentPrice * 100 + 1) {
    high *= 1.5;
  }

  if (!canReach(high)) {
    return { price: high, reachable: false };
  }

  for (let i = 0; i < 80; i++) {
    const mid = (low + high) / 2;
    if (canReach(mid)) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return { price: high, reachable: true };
};

const singleMetalResults = computed(() => {
  const rawResults = metals.map((metal) => {
    const result = solveSingleMetalPrice(metal.key);
    const currentPrice = props.params.metalPrices[metal.key];
    const increaseRate = result.reachable ? (result.price / currentPrice - 1) * 100 : Number.POSITIVE_INFINITY;
    return {
      ...metal,
      ...result,
      increaseRate
    };
  });
  const maxReachableIncrease = Math.max(...rawResults.filter(item => item.reachable).map(item => Math.max(item.increaseRate, 0)), 1);

  return rawResults.map(item => ({
    ...item,
    barHeight: item.reachable ? (Math.max(item.increaseRate, 0) / maxReachableIncrease) * 100 : 10
  }));
});

const mostSensitiveMetal = computed(() => {
  const reachable = singleMetalResults.value.filter(item => item.reachable);
  if (!reachable.length) return { name: '暂无' };
  return [...reachable].sort((a, b) => a.increaseRate - b.increaseRate)[0];
});

const formatMoney = (value) => {
  if (!Number.isFinite(value)) return '-';
  return new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 0
  }).format(value);
};

const formatPayback = (value) => {
  if (value > totalYears.value) return '未回本';
  return `${value} 年`;
};

const formatIncrease = (value) => {
  if (!Number.isFinite(value)) return '-';
  if (value <= 0.01) return '无需上调';
  return `+${value.toFixed(1)}%`;
};
</script>

<style scoped>
.price-payback-panel :deep(.text-slate-400) {
  color: rgba(203, 213, 225, 0.92) !important;
}

.price-payback-panel :deep(.text-slate-500) {
  color: rgba(148, 163, 184, 0.96) !important;
}

.price-payback-panel :deep(.text-xs) {
  font-size: 0.8125rem !important;
  line-height: 1.25rem !important;
}

.price-payback-panel :deep(.text-\[11px\]) {
  font-size: 0.76rem !important;
  line-height: 1.05rem !important;
}

.price-payback-panel :deep(.text-\[10px\]) {
  font-size: 0.72rem !important;
  line-height: 1rem !important;
}

.price-payback-panel :deep(input),
.price-payback-panel :deep(select) {
  color: rgba(248, 250, 252, 0.98) !important;
  font-size: 0.8125rem !important;
  font-weight: 700;
}
</style>
