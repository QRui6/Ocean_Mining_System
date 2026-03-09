<template>
	<transition name="fade">
		<div
			v-if="show"
			class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
			@click.self="$emit('close')"
		>
			<!-- 主面板 - 更小更紧凑 -->
			<div
				class="relative w-[75vw] max-w-[1200px] h-[70vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl shadow-2xl border border-cyan-500/30 overflow-hidden flex flex-col"
			>
				<!-- 标题栏 - 极简 -->
				<div
					class="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-slate-800/90 to-slate-900/90 border-b border-cyan-500/30 flex-shrink-0"
				>
					<div class="flex items-center gap-2">
						<div class="w-1 h-4 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full"></div>
						<h2
							class="text-sm font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"
						>
							可行性分析 - 成本结构分解
						</h2>
					</div>
					<button
						@click="$emit('close')"
						class="text-gray-400 hover:text-cyan-400 transition-all hover:rotate-90 duration-300"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				<!-- 内容区域 - 无滚动条，自适应布局 -->
				<div class="flex-1 p-3 flex flex-col gap-2.5 overflow-hidden">
					<!-- 采矿模式选择 - 极简 -->
					<div class="flex items-center gap-2 flex-shrink-0">
						<span class="text-cyan-400 font-medium text-xs">采矿模式：</span>
						<div class="flex gap-1.5">
							<button
								v-for="mode in miningModes"
								:key="mode.id"
								@click="selectedMode = mode.id"
								:class="[
									'px-2.5 py-1 rounded-md font-medium transition-all text-xs',
									selectedMode === mode.id
										? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/50'
										: 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
								]"
							>
								{{ mode.label }}
							</button>
						</div>
					</div>

					<!-- 成本数据展示 - 三栏布局 -->
					<div class="flex-1 grid grid-cols-3 gap-2.5 min-h-0">
						<!-- 左侧：建造成本饼图 -->
						<div class="bg-slate-800/40 rounded-lg p-2.5 border border-slate-700/50 flex flex-col min-h-0">
							<h3 class="text-xs font-bold text-cyan-400 mb-1.5 flex items-center gap-1.5 flex-shrink-0">
								<span class="w-1 h-1 bg-cyan-400 rounded-full"></span>
								建造成本 ({{ currentData.construction.total.toFixed(1) }} 万元)
							</h3>
							<div ref="constructionChartRef" class="flex-1 w-full min-h-0"></div>
						</div>

						<!-- 中间：运营成本柱状图 -->
						<div class="bg-slate-800/40 rounded-lg p-2.5 border border-slate-700/50 flex flex-col min-h-0">
							<h3 class="text-xs font-bold text-orange-400 mb-1.5 flex items-center gap-1.5 flex-shrink-0">
								<span class="w-1 h-1 bg-orange-400 rounded-full"></span>
								运营成本 (每天 {{ currentData.operation.dailyTotal.toFixed(2) }} 万元)
							</h3>
							<div ref="operationChartRef" class="flex-1 w-full min-h-0"></div>
						</div>

						<!-- 右侧：年度运营成本对比 -->
						<div class="bg-slate-800/40 rounded-lg p-2.5 border border-slate-700/50 flex flex-col min-h-0">
							<h3 class="text-xs font-bold text-green-400 mb-1.5 flex items-center gap-1.5 flex-shrink-0">
								<span class="w-1 h-1 bg-green-400 rounded-full"></span>
								年度成本对比 (每吨成本)
							</h3>
							<div ref="annualCostChartRef" class="flex-1 w-full min-h-0"></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</transition>
</template>

<script>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import * as echarts from 'echarts';

export default {
	name: 'FeasibilityAnalysisPanel',
	props: {
		show: {
			type: Boolean,
			default: false
		}
	},
	emits: ['close'],
	setup(props) {
		const selectedMode = ref('continuous');
		const constructionChartRef = ref(null);
		const operationChartRef = ref(null);
		const annualCostChartRef = ref(null);

		let constructionChart = null;
		let operationChart = null;
		let annualCostChart = null;

		// 采矿模式
		const miningModes = [
			{ id: 'continuous', label: '连续式采矿 (300万吨/年)' },
			{ id: 'non_continuous', label: '非连续式采矿 (160万吨/年)' }
		];

		// 建造成本数据
		const constructionCosts = {
			continuous: {
				total: 530.8,
				breakdown: [
					{ name: '水面支持系统', value: 374.8 },
					{ name: '水下输送系统', value: 38.2 },
					{ name: '海底集矿系统', value: 33.0 },
					{ name: '动力输配系统', value: 41.8 },
					{ name: '中央控制系统', value: 10.0 },
					{ name: '运行维护系统', value: 33.0 }
				]
			},
			non_continuous: {
				total: 321.8,
				breakdown: [
					{ name: '水面支持系统', value: 201.8 },
					{ name: '矿石提升系统', value: 24.0 },
					{ name: '海底集矿系统', value: 33.0 },
					{ name: '动力输配系统', value: 24.0 },
					{ name: '中央控制系统', value: 6.0 },
					{ name: '运行维护系统', value: 33.0 }
				]
			}
		};

		// 运营成本数据
		const operationCosts = {
			continuous: {
				dailyTotal: 58.46,
				breakdown: [
					{ name: '运行成本 (每天)', value: 5.3 },
					{ name: '采矿系统运营成本 (每天)', value: 5.46 },
					{ name: '平均每天总运营成本', value: 58.46 }
				],
				annualByDays: [
					{ days: 10000, cost: 0.058 },
					{ days: 6000, cost: 0.097 },
					{ days: 4500, cost: 0.13 }
				]
			},
			non_continuous: {
				dailyTotal: 38.488,
				breakdown: [
					{ name: '运行成本 (每天)', value: 3.1 },
					{ name: '采矿系统运营成本 (每天)', value: 7.488 },
					{ name: '平均每天总运营成本', value: 38.488 }
				],
				annualByDays: [
					{ days: 6000, cost: 0.064 },
					{ days: 4500, cost: 0.086 },
					{ days: 3000, cost: 0.128 }
				]
			}
		};

		// 当前选中模式的数据
		const currentData = computed(() => ({
			construction: constructionCosts[selectedMode.value],
			operation: operationCosts[selectedMode.value]
		}));

		// 初始化建造成本图表 (饼图)
		const initConstructionChart = () => {
			if (!constructionChartRef.value) return;

			if (constructionChart) {
				constructionChart.dispose();
			}

			constructionChart = echarts.init(constructionChartRef.value);
			updateConstructionChart();
			
			// 监听容器大小变化
			const resizeObserver = new ResizeObserver(() => {
				constructionChart?.resize();
			});
			resizeObserver.observe(constructionChartRef.value);
		};

		// 更新建造成本图表
		const updateConstructionChart = () => {
			if (!constructionChart) return;

			const data = currentData.value.construction.breakdown;

			const option = {
				tooltip: {
					trigger: 'item',
					formatter: '{b}: {c} 万元 ({d}%)',
					backgroundColor: 'rgba(0, 0, 0, 0.9)',
					borderColor: '#06b6d4',
					borderWidth: 1,
					textStyle: { color: '#fff', fontSize: 10 }
				},
				legend: {
					orient: 'vertical',
					right: '2%',
					top: 'center',
					textStyle: { color: '#94a3b8', fontSize: 9 },
					itemWidth: 8,
					itemHeight: 8,
					itemGap: 6
				},
				series: [
					{
						name: '建造成本',
						type: 'pie',
						radius: ['40%', '70%'],
						center: ['35%', '50%'],
						avoidLabelOverlap: true,
						itemStyle: {
							borderRadius: 5,
							borderColor: '#1e293b',
							borderWidth: 1.5
						},
						label: {
							show: true,
							formatter: '{d}%',
							color: '#fff',
							fontSize: 8
						},
						emphasis: {
							label: {
								show: true,
								fontSize: 10,
								fontWeight: 'bold'
							},
							scale: true,
							scaleSize: 3
						},
						data: data.map((item, index) => ({
							value: item.value,
							name: item.name,
							itemStyle: {
								color: ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][
									index % 6
								]
							}
						}))
					}
				]
			};

			constructionChart.setOption(option, true);
		};

		// 初始化运营成本图表 (柱状图)
		const initOperationChart = () => {
			if (!operationChartRef.value) return;

			if (operationChart) {
				operationChart.dispose();
			}

			operationChart = echarts.init(operationChartRef.value);
			updateOperationChart();
			
			// 监听容器大小变化
			const resizeObserver = new ResizeObserver(() => {
				operationChart?.resize();
			});
			resizeObserver.observe(operationChartRef.value);
		};

		// 更新运营成本图表
		const updateOperationChart = () => {
			if (!operationChart) return;

			const data = currentData.value.operation.breakdown;

			const option = {
				tooltip: {
					trigger: 'axis',
					axisPointer: { type: 'shadow' },
					backgroundColor: 'rgba(0, 0, 0, 0.9)',
					borderColor: '#f97316',
					borderWidth: 1,
					textStyle: { color: '#fff', fontSize: 10 },
					formatter: '{b}: {c} 万元/天'
				},
				grid: {
					left: '12%',
					right: '5%',
					bottom: '12%',
					top: '10%',
					containLabel: false
				},
				xAxis: {
					type: 'category',
					data: data.map((item) => item.name),
					axisLabel: {
						color: '#94a3b8',
						fontSize: 8,
						interval: 0,
						rotate: 12
					},
					axisLine: { lineStyle: { color: '#334155' } }
				},
				yAxis: {
					type: 'value',
					name: '万元/天',
					nameTextStyle: { color: '#94a3b8', fontSize: 9 },
					axisLabel: { color: '#94a3b8', fontSize: 8 },
					axisLine: { lineStyle: { color: '#334155' } },
					splitLine: { lineStyle: { color: '#334155', type: 'dashed' } }
				},
				series: [
					{
						name: '运营成本',
						type: 'bar',
						data: data.map((item, index) => ({
							value: item.value,
							itemStyle: {
								color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
									{ offset: 0, color: ['#f97316', '#fb923c', '#fdba74'][index % 3] },
									{ offset: 1, color: ['#ea580c', '#f97316', '#fb923c'][index % 3] }
								])
							}
						})),
						barWidth: '40%',
						label: {
							show: true,
							position: 'top',
							color: '#fff',
							fontSize: 8,
							formatter: '{c}'
						}
					}
				]
			};

			operationChart.setOption(option, true);
		};

		// 初始化年度成本对比图表
		const initAnnualCostChart = () => {
			if (!annualCostChartRef.value) return;

			if (annualCostChart) {
				annualCostChart.dispose();
			}

			annualCostChart = echarts.init(annualCostChartRef.value);
			updateAnnualCostChart();
			
			// 监听容器大小变化
			const resizeObserver = new ResizeObserver(() => {
				annualCostChart?.resize();
			});
			resizeObserver.observe(annualCostChartRef.value);
		};

		// 更新年度成本对比图表
		const updateAnnualCostChart = () => {
			if (!annualCostChart) return;

			const annualData = currentData.value.operation.annualByDays;
			const days = annualData.map((item) => item.days);
			const costs = annualData.map((item) => item.cost);

			const option = {
				tooltip: {
					trigger: 'axis',
					backgroundColor: 'rgba(0, 0, 0, 0.9)',
					borderColor: '#10b981',
					borderWidth: 1,
					textStyle: { color: '#fff', fontSize: 10 },
					formatter: '{b}: {c} 万元/吨'
				},
				grid: {
					left: '12%',
					right: '5%',
					bottom: '12%',
					top: '10%',
					containLabel: false
				},
				xAxis: {
					type: 'category',
					data: days.map((d) => `${d}吨天`),
					axisLabel: { color: '#94a3b8', fontSize: 8 },
					axisLine: { lineStyle: { color: '#334155' } }
				},
				yAxis: {
					type: 'value',
					name: '万元/吨',
					nameTextStyle: { color: '#94a3b8', fontSize: 9 },
					axisLabel: {
						color: '#94a3b8',
						fontSize: 8,
						formatter: '{value}'
					},
					axisLine: { lineStyle: { color: '#334155' } },
					splitLine: { lineStyle: { color: '#334155', type: 'dashed' } }
				},
				series: [
					{
						name: '每吨成本',
						type: 'line',
						data: costs,
						smooth: true,
						lineStyle: {
							color: '#10b981',
							width: 2
						},
						areaStyle: {
							color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
								{ offset: 0, color: 'rgba(16, 185, 129, 0.4)' },
								{ offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
							])
						},
						itemStyle: {
							color: '#10b981',
							borderColor: '#fff',
							borderWidth: 1.5
						},
						label: {
							show: true,
							position: 'top',
							color: '#10b981',
							fontSize: 8,
							formatter: '{c}'
						}
					}
				]
			};

			annualCostChart.setOption(option, true);
		};

		// 监听模式切换
		watch(selectedMode, () => {
			nextTick(() => {
				updateConstructionChart();
				updateOperationChart();
				updateAnnualCostChart();
			});
		});

		// 监听显示状态
		watch(
			() => props.show,
			(newVal) => {
				if (newVal) {
					nextTick(() => {
						initConstructionChart();
						initOperationChart();
						initAnnualCostChart();
					});
				}
			}
		);

		onMounted(() => {
			if (props.show) {
				nextTick(() => {
					initConstructionChart();
					initOperationChart();
					initAnnualCostChart();
				});
			}
		});

		return {
			selectedMode,
			miningModes,
			currentData,
			constructionChartRef,
			operationChartRef,
			annualCostChartRef
		};
	}
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

/* 确保图表容器正确响应 */
.min-h-0 {
	min-height: 0;
}
</style>
