<template>
    <div class="pointer-events-none absolute inset-0 z-[90] font-['Noto_Sans_SC']">
        <transition name="warning-alert">
            <div v-if="globalAlert" class="pointer-events-auto absolute left-1/2 top-36 w-[min(45rem,calc(100vw-3rem))] -translate-x-1/2 overflow-hidden rounded-lg border-2 shadow-[0_0_35px_rgba(239,68,68,0.55)]" :class="globalAlertClass(globalAlert.item?.severity)">
                <div class="flex items-center justify-between border-b border-white/20 px-6 py-3">
                    <div class="flex items-center gap-2 text-base font-black tracking-[0.18em]"><span class="animate-pulse text-xl">⚠</span><span>{{ globalAlertTitle(globalAlert) }}</span></div>
                    <button type="button" class="rounded px-2 py-1 text-lg leading-none text-white/80 hover:bg-white/15 hover:text-white" title="关闭提醒" @click="dismissGlobalAlert">×</button>
                </div>
                <div class="px-6 py-5">
                    <div class="text-2xl font-black leading-9 text-white">{{ warningDisplayTitle(globalAlert.item) }}</div>
                    <div class="mt-3 text-base font-bold leading-7 text-white/95">{{ globalAlert.item?.warningMessage || globalAlert.text }}</div>
                    <div class="mt-4 grid grid-cols-2 gap-3 text-sm leading-6 text-white/85">
                        <div><span class="text-white/55">风险位置：</span>{{ globalAlert.item?.regionName || globalAlert.item?.miningArea || '--' }}<span v-if="globalAlert.item?.siteName"> · {{ globalAlert.item.siteName }}</span></div>
                        <div><span class="text-white/55">风险等级：</span>{{ severityText(globalAlert.item?.severity) }}</div>
                        <div><span class="text-white/55">风险时间：</span>{{ rangeText(globalAlert.item?.timeRange) }}</div>
                        <div><span class="text-white/55">发现时间：</span>{{ formatTime(globalAlert.at) }}</div>
                    </div>
                    <div class="mt-4 flex justify-end">
                        <button type="button" class="rounded border border-white/60 bg-white/15 px-4 py-2 text-xs font-black text-white transition hover:bg-white hover:text-slate-900" @click="openGlobalWarningCenter">进入预警中心查看详情</button>
                    </div>
                </div>
            </div>
        </transition>
    </div>
    <TyphoonActivityWorkspace v-if="show && typhoonMode" :getViewer="getViewer" :mine-id="filters.mine" @select-target="target => emit('select-target', target)" @close="typhoonMode=false" />
    <MiningAssessmentWorkspace v-if="show && assessmentMode" :getViewer="getViewer" :mine-id="filters.mine" @select-target="target => emit('select-target', target)" @close="assessmentMode=false" />
    <transition name="workspace-fade">
        <div v-if="show" class="pointer-events-none absolute inset-0 z-40 font-['Noto_Sans_SC']">
            <div class="pointer-events-none absolute left-8 top-36 flex h-[54.5rem] w-[30rem] flex-col">
                <section class="tech-panel-enhanced pointer-events-auto relative flex max-h-full min-h-0 flex-col overflow-hidden p-5" style="clip-path: polygon(0 0,100% 0,100% calc(100% - 24px),calc(100% - 24px) 100%,0 100%);">
                    <div class="absolute left-0 top-0 h-[2px] w-full animate-pulse bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                    <div class="corner-decoration corner-tl scale-125"></div><div class="corner-decoration corner-tr scale-125"></div>
                    <div class="mb-4 flex shrink-0 items-center border-b-2 border-cyan-500/40 pb-3">
                        <div class="mr-3 h-6 w-1.5 bg-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.8)]"></div>
                        <div class="min-w-0 flex-1"><h3 class="text-2xl font-bold tracking-wider text-white">预警中心</h3></div>
                        <nav aria-label="预警视图" class="mr-3 flex shrink-0 gap-2 text-sm font-bold">
                            <button type="button" :aria-pressed="assessmentMode" :class="['warning-workspace-tab', { 'is-active': assessmentMode }]" @click="assessmentMode=!assessmentMode;typhoonMode=false">矿区评估</button>
                            <button type="button" :aria-pressed="typhoonMode" :class="['warning-workspace-tab', { 'is-active': typhoonMode }]" @click="typhoonMode=!typhoonMode;assessmentMode=false">台风活动</button>
                        </nav>
                        <button class="floating-panel-close-btn floating-panel-close-btn--inline" type="button" title="关闭预警中心" @click="emit('close')">✕</button>
                    </div>

                    <div class="mb-4 grid shrink-0 grid-cols-4 gap-2 text-xs">
                        <div class="border border-cyan-500/20 bg-slate-950/45 p-2 text-slate-400">全部<strong class="mt-1 block text-lg text-cyan-100">{{ stats.total }}</strong></div>
                        <div class="border border-amber-500/20 bg-slate-950/45 p-2 text-slate-400">生效中<strong class="mt-1 block text-lg text-amber-100">{{ stats.active }}</strong></div>
                        <div class="border border-rose-500/20 bg-slate-950/45 p-2 text-slate-400">严重<strong class="mt-1 block text-lg text-rose-100">{{ stats.critical }}</strong></div>
                        <div class="border border-violet-500/20 bg-slate-950/45 p-2 text-slate-400">候选<strong class="mt-1 block text-lg text-violet-100">{{ stats.candidate }}</strong></div>
                    </div>

                    <div class="mb-3 grid shrink-0 grid-cols-2 gap-2">
                        <PanelSelect v-model="filters.mine" label="预警矿区" :options="mineOptions" class="col-span-2" overlay :max-height="240" />
                        <select v-model="filters.source" class="border border-slate-700 bg-slate-950/70 px-2 py-2 text-xs text-slate-200"><option value="">全部来源</option><option value="预报候选">预报研判</option><option value="矿区评估">矿区评估</option></select>
                        <select v-model="filters.range" class="border border-slate-700 bg-slate-950/70 px-2 py-2 text-xs text-slate-200"><option value="">全部时段</option><option value="12h">12小时</option><option value="7d">7天</option><option value="15d">15天</option><option value="grid">网格评估时段</option></select>
                        <select v-model="filters.severity" class="border border-slate-700 bg-slate-950/70 px-2 py-2 text-xs text-slate-200"><option value="">全部等级</option><option value="INFO">关注</option><option value="WARNING">预警</option><option value="CRITICAL">严重</option></select>
                        <select v-model="filters.status" class="border border-slate-700 bg-slate-950/70 px-2 py-2 text-xs text-slate-200"><option value="">全部状态</option><option value="ACTIVE">生效中</option><option value="CANDIDATE">预警候选</option><option value="RESOLVED">已解除</option><option value="EXPIRED">已过期</option></select>
                    </div>

                    <div class="mb-3 shrink-0 rounded border border-slate-700/70 bg-slate-950/40 px-3 py-2 text-[11px] text-slate-400">
                        <div class="flex items-center justify-between gap-2"><span>最近刷新：{{ formatTime(lastLoadedAt) }}</span><span v-if="forecastStaleCount" class="text-amber-200">{{ forecastStaleCount }} 个站点预报已过期</span></div>
                    </div>
                    <div v-if="errorMessage" class="mb-3 shrink-0 border border-amber-500/35 bg-amber-950/30 p-3 text-xs leading-5 text-amber-100">{{ errorMessage }}</div>
                    <div class="mb-2 flex shrink-0 items-center justify-between gap-2"><div class="flex items-center gap-2"><span class="text-sm font-bold text-cyan-200">{{ showHistory ? '历史预警档案' : '预警记录' }}</span><span v-if="unreadCount" class="rounded-full border border-rose-400/45 bg-rose-950/45 px-2 py-0.5 text-[10px] font-bold text-rose-100">未读 {{ unreadCount }}</span></div><div class="flex items-center gap-3"><button class="text-xs font-bold text-violet-300 hover:text-white" type="button" @click="toggleHistory">{{ showHistory ? '返回当前预警' : `历史档案（${historyRows.length}）` }}</button><button v-if="unreadCount" class="text-xs font-bold text-slate-400 hover:text-white" type="button" @click="markNotificationsRead">标记已读</button><button class="text-xs font-bold text-cyan-300 hover:text-white" type="button" @click="loadWarnings(true)">刷新数据</button></div></div>
                    <div class="custom-scrollbar min-h-0 space-y-2 overflow-y-auto pr-2">
                        <div v-if="loading" class="flex h-36 items-center justify-center text-sm text-slate-400">正在读取预警与预报数据...</div>
                        <button v-for="item in displayWarnings" :key="`${showHistory ? 'history' : 'active'}-${item.id}-${item.resolvedAt || ''}`" type="button" :class="warningCardClass(item, item.id === selectedWarning?.id)" :style="{ borderLeftColor: warningAccent(item.severity) }" @click="selectWarning(item, { locate: true })">
                            <div class="flex items-start justify-between gap-2"><div class="min-w-0 flex-1"><div class="flex min-w-0 items-center gap-2"><span :class="['shrink-0 rounded-sm border px-1.5 py-0.5 text-[10px] font-bold', sourceClass(item.source)]">{{ item.source }}</span><div class="truncate text-sm font-bold text-white">{{ warningDisplayTitle(item) }}</div></div><div class="mt-1 truncate text-xs text-slate-400">{{ item.regionName || item.miningArea || '--' }}<span v-if="item.siteName"> · {{ item.siteName }}</span> · {{ rangeText(item.timeRange, item.stale) }}</div></div><span :class="['shrink-0 border px-2 py-0.5 text-xs font-bold', severityClass(item.severity)]">{{ severityText(item.severity) }}</span></div>
                            <div class="mt-2 border-t border-slate-700/60 pt-2 text-xs leading-5 text-slate-300">{{ item.warningMessage }}</div>
                            <div class="mt-1 flex items-center justify-between gap-2 text-[11px] text-slate-500"><span>{{ item.triggerType || '综合指标' }}</span><span v-if="showHistory" class="text-slate-400">{{ item.resolvedAt ? `解除于 ${formatTime(item.resolvedAt)}` : '历史记录' }}</span><span v-else-if="item.stale" class="text-amber-300">已过期</span><span v-else>{{ statusText(item.status) }}</span></div>
                        </button>
                        <div v-if="!loading && !displayWarnings.length" class="flex h-36 items-center justify-center border border-dashed border-slate-700/50 text-sm text-slate-500">{{ showHistory ? '暂无历史预警档案' : '暂无符合条件的预警或候选记录' }}</div>
                    </div>
                </section>
            </div>

            <div v-show="!assessmentMode && !typhoonMode" class="pointer-events-none absolute right-6 top-36 flex h-[54.5rem] w-[31rem] flex-col">
                <section class="tech-panel-enhanced pointer-events-auto relative flex max-h-full min-h-0 flex-col overflow-hidden p-5" style="clip-path: polygon(0 0,calc(100% - 28px) 0,100% 28px,100% 100%,0 100%);">
                    <div class="absolute left-0 top-0 h-[2px] w-full animate-pulse bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div><div class="corner-decoration corner-bl scale-125"></div><div class="corner-decoration corner-br scale-125"></div>
                    <div class="mb-3 flex shrink-0 items-start justify-between border-b-2 border-cyan-500/40 pb-3"><div class="min-w-0"><div class="flex items-center gap-2"><span v-if="selectedWarning" :class="['rounded-sm border px-2 py-1 text-[11px] font-bold', sourceClass(selectedWarning.source)]">{{ selectedWarning.source }}</span><div class="truncate text-xl font-bold text-white">{{ selectedWarning ? warningDisplayTitle(selectedWarning) : '预警详情' }}</div></div><div class="mt-1 truncate text-xs text-slate-400">{{ selectedWarning?.regionName || selectedWarning?.miningArea || '请选择左侧预警记录' }}<span v-if="selectedWarning?.siteName"> · {{ selectedWarning.siteName }}</span></div></div><button v-if="selectedWarning" class="shrink-0 border border-cyan-500/45 bg-cyan-950/45 px-3 py-1.5 text-xs font-bold text-cyan-100 hover:bg-cyan-500 hover:text-slate-950" type="button" @click="download('txt')">下载TXT</button><button v-if="selectedWarning" class="shrink-0 border border-cyan-500/45 bg-cyan-950/45 px-3 py-1.5 text-xs font-bold text-cyan-100 hover:bg-cyan-500 hover:text-slate-950" type="button" @click="download('pdf')">下载PDF</button></div>
                    <div v-if="detailLoading" class="flex h-36 items-center justify-center text-sm text-slate-400">正在加载预警详情...</div>
                    <template v-else-if="selectedWarning">
                        <div class="custom-scrollbar min-h-0 space-y-3 overflow-y-auto pr-1">
                            <section v-if="selectedWarning.sourceType === 'grid'" class="rounded border border-amber-500/35 bg-amber-950/20 p-3">
                                <div class="mb-1 text-sm font-bold text-amber-100">预警结论</div>
                                <div class="text-sm leading-6 text-white">{{ selectedWarning.warningMessage }}</div>
                                <div v-if="selectedWarning.point" class="text-xs text-slate-300">经度 {{ selectedWarning.point.lng.toFixed(4) }}° · 纬度 {{ selectedWarning.point.lat.toFixed(4) }}°</div>
                                <div v-if="selectedWarning.validFrom" class="mt-1 text-xs text-slate-300">{{ formatTime(selectedWarning.validFrom) }} 至 {{ formatTime(selectedWarning.validUntil) }}</div>
                            </section>
                            <section v-if="selectedWarning.source === '预报候选'" class="rounded border border-violet-400/35 bg-gradient-to-br from-violet-950/45 via-slate-950/55 to-slate-950/85 p-4">
                                <div class="flex flex-wrap items-center justify-between gap-2"><div class="text-sm font-bold tracking-wide text-violet-100">风险窗口</div><div class="flex flex-wrap items-center justify-end gap-1.5"><span class="border border-violet-300/30 bg-violet-950/45 px-2 py-1 text-[10px] text-violet-200">{{ candidateReport.granularity }}</span><button v-if="selectedWarning.region" type="button" class="border border-cyan-500/45 bg-cyan-950/35 px-2 py-1 text-[11px] font-bold text-cyan-100 hover:bg-cyan-500 hover:text-slate-950" @click="emit('locate-region', selectedWarning)">定位地图</button><button v-if="selectedWarning.region" type="button" class="border border-violet-500/45 bg-violet-950/35 px-2 py-1 text-[11px] font-bold text-violet-100 hover:bg-violet-500 hover:text-slate-950" @click="emit('open-forecast', selectedWarning)">进入预报中心</button></div></div>
                                <div class="mt-2 text-[15px] font-bold leading-7 text-white">{{ candidateReport.conclusion }}</div>
                                <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
                                    <div class="rounded border border-slate-700/60 bg-slate-950/45 p-2"><div class="text-slate-500">首次达到</div><strong class="mt-1 block text-amber-100">{{ candidateReport.firstAt }}</strong></div>
                                    <div class="rounded border border-slate-700/60 bg-slate-950/45 p-2"><div class="text-slate-500">{{ expiredCandidate ? "峰值" : "预计峰值" }}</div><strong class="mt-1 block text-rose-100">{{ candidateReport.peakAt }}</strong></div>
                                    <div class="rounded border border-slate-700/60 bg-slate-950/45 p-2"><div class="text-slate-500">{{ expiredCandidate ? "末次超限" : "预计解除" }}</div><strong class="mt-1 block text-cyan-100">{{ candidateReport.endAt }}</strong></div>
                                    <div class="rounded border border-slate-700/60 bg-slate-950/45 p-2"><div class="text-slate-500">{{ expiredCandidate ? "首次回落" : "预计持续" }}</div><strong class="mt-1 block text-violet-100">{{ expiredCandidate ? candidateReport.recoveredAt : candidateReport.duration }}</strong></div>
                                </div>
                                <div v-if="selectedWarning.buoyId" class="mt-3 flex flex-wrap gap-2"><button type="button" class="border border-sky-500/45 bg-sky-950/35 px-3 py-1.5 text-xs font-bold text-sky-100 hover:bg-sky-500 hover:text-slate-950" @click="emit('open-buoy', selectedWarning)">查看浮标监测</button></div>
                            </section>
                            <div :class="['grid gap-2 text-xs', expiredCandidate ? 'grid-cols-2' : 'grid-cols-3']">
                                <div class="border border-slate-700/60 bg-slate-950/35 p-3 text-slate-400">预警等级<strong :class="['mt-1 block text-base', severityClass(selectedWarning.severity)]">{{ severityText(selectedWarning.severity) }}</strong></div>
                                <div class="border border-slate-700/60 bg-slate-950/35 p-3 text-slate-400">记录状态<strong class="mt-1 block text-base text-cyan-100">{{ statusText(selectedWarning.status) }}</strong></div>
                                <div v-if="!expiredCandidate" class="border border-slate-700/60 bg-slate-950/35 p-3 text-slate-400">数据状态<strong :class="['mt-1 block text-base', selectedWarning.stale ? 'text-amber-200' : 'text-emerald-200']">{{ selectedWarning.stale ? '需核对' : '有效' }}</strong></div>
                            </div>
                            <div class="rounded border border-cyan-500/20 bg-cyan-950/20 p-3 text-xs leading-5 text-slate-300">
                                <div class="grid grid-cols-2 gap-y-1">
                                    <span :class="{ 'col-span-2': expiredCandidate }">数据批次<strong class="ml-2 text-cyan-100">{{ selectedWarning.sourceBase || '--' }}</strong></span>
                                    <template v-if="expiredCandidate && candidateCoordinates">
                                        <span>经度<strong class="ml-2 text-cyan-100">{{ candidateCoordinates.lng }}°</strong></span>
                                        <span>纬度<strong class="ml-2 text-cyan-100">{{ candidateCoordinates.lat }}°</strong></span>
                                    </template>
                                    <template v-if="!expiredCandidate">
                                        <span>有效至：<strong class="text-cyan-100">{{ selectedWarning.validUntil || '--' }}</strong></span>
                                        <span>预报时段：<strong class="text-cyan-100">{{ rangeText(selectedWarning.timeRange) }}</strong></span>
                                        <span v-if="selectedWarning.createdAt">生成时间：<strong class="text-cyan-100">{{ formatTime(selectedWarning.createdAt) }}</strong></span>
                                    </template>
                                    <span v-if="selectedWarning.resolvedAt">解除时间：<strong class="text-amber-100">{{ formatTime(selectedWarning.resolvedAt) }}</strong></span>
                                    <span v-if="selectedWarning.resolvedAt">解除原因：<strong class="text-amber-100">{{ selectedWarning.resolveReason || '最新预报不再满足条件' }}</strong></span>
                                </div>
                                <div v-if="selectedWarning.stale && !expiredCandidate" class="mt-2 border-t border-amber-500/20 pt-2 text-amber-200">预报已过期</div>
                            </div>
                            <div class="border-y border-cyan-500/20 py-3"><div class="mb-2 text-sm font-bold text-cyan-200">触发指标</div><div class="space-y-1.5 text-xs text-slate-300"><div v-for="trigger in selectedWarning.triggerDetail || []" :key="`${trigger.type}-${trigger.value}-${trigger.forecastDate}`" class="flex items-center justify-between gap-2 rounded bg-slate-950/35 px-2 py-1.5"><span>{{ trigger.type }}：<strong class="text-amber-100">{{ trigger.value }} {{ displayUnit(trigger.unit) }}</strong></span><span class="text-slate-500">阈值 {{ trigger.threshold }} {{ displayUnit(trigger.unit) }}<span v-if="trigger.forecastDate"> · {{ shortDate(trigger.forecastDate) }}</span></span></div><div v-if="!selectedWarning.triggerDetail?.length" class="text-slate-500">暂无结构化指标</div></div></div>
                            <div v-if="selectedWarning.source !== '预报候选'" class="flex flex-wrap gap-2"><button v-if="selectedWarning.region" type="button" class="border border-cyan-500/45 bg-cyan-950/35 px-3 py-1.5 text-xs font-bold text-cyan-100 hover:bg-cyan-500 hover:text-slate-950" @click="emit('locate-region', selectedWarning)">定位地图</button><button v-if="selectedWarning.region" type="button" class="border border-violet-500/45 bg-violet-950/35 px-3 py-1.5 text-xs font-bold text-violet-100 hover:bg-violet-500 hover:text-slate-950" @click="emit('open-forecast', selectedWarning)">进入预报中心</button></div>
                            <div v-if="selectedWarning.versions?.length" class="rounded border border-violet-500/20 bg-violet-950/15 p-3"><div class="mb-2 text-xs font-bold text-violet-200">生命周期记录</div><div class="space-y-1.5 text-[11px] text-slate-300"><div v-for="version in selectedWarning.versions" :key="`${version.at}-${version.type}`" class="flex gap-2"><span class="shrink-0 text-slate-500">{{ formatTime(version.at) }}</span><span>{{ lifecycleEventText(version.type) }}{{ version.text ? `：${version.text}` : '' }}</span></div></div></div>
                        </div>
                    </template>
                    <div v-else class="flex h-36 items-center justify-center border border-dashed border-slate-700/50 text-sm text-slate-500">请选择一条预警记录</div>
                </section>
            </div>

            <div v-show="!assessmentMode && !typhoonMode" class="pointer-events-none absolute bottom-16 left-[33rem] right-[33rem] h-[19rem]"><section class="tech-panel-enhanced pointer-events-auto relative flex h-full flex-col overflow-hidden p-4"><div class="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div><div class="mb-3 flex items-start justify-between gap-3"><div class="min-w-0"><div class="text-lg font-bold text-white">{{ trendTitle }}</div><div class="mt-1 truncate text-xs text-slate-400">{{ trendSubtitle }}</div></div><div class="flex shrink-0 items-center gap-2"><div v-if="hasDailyHourlyTrend" class="flex items-center border border-violet-500/30 bg-violet-950/25 p-0.5"><button type="button" :class="['px-2 py-1 text-[10px] font-bold transition', trendMode === 'daily' ? 'bg-violet-500/80 text-white' : 'text-violet-200 hover:bg-violet-500/25']" @click="setTrendMode('daily')">未来7天概览</button><button type="button" :class="['px-2 py-1 text-[10px] font-bold transition', trendMode === 'hourly' ? 'bg-cyan-500/80 text-slate-950' : 'text-cyan-200 hover:bg-cyan-500/25']" @click="setTrendMode('hourly')">风险日逐小时</button></div><span class="border border-cyan-500/25 bg-cyan-950/25 px-2 py-1 text-[10px] text-cyan-200">{{ trendGranularity }}</span></div></div><div class="relative min-h-0 flex-1"><div v-if="trendRecords.length" ref="chartRef" class="h-full w-full"></div><div v-if="trendLoading" class="absolute inset-0 flex items-center justify-center bg-slate-950/65 text-sm text-slate-300">正在读取趋势数据...</div><div v-else-if="trendError" class="absolute inset-0 flex items-center justify-center text-sm text-amber-200">{{ trendError }}</div><div v-else-if="!trendRecords.length" class="absolute inset-0 flex items-center justify-center border border-dashed border-slate-700/50 text-sm text-slate-500">{{ trendEmptyText }}</div></div></section></div>
        </div>
    </transition>
</template>

<script setup>
import { fetchMiningRiskWarnings, fetchMiningRiskVersions, fetchMiningRiskTrend } from '../../utils/warning/miningRiskWarningService.js';
import { warningExportText } from '../../utils/forecastReportText.js';
import TyphoonActivityWorkspace from './TyphoonActivityWorkspace.vue';
import MiningAssessmentWorkspace from './MiningAssessmentWorkspace.vue';
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import * as echarts from 'echarts';
import { ElNotification } from 'element-plus';
import { downloadWarningAnalysisPdf, fetchForecastTargets } from '../../api/forecastWarningBuoy.js';
import PanelSelect from '../common/PanelSelect.vue';
import { fetchWarningCandidates } from '../../utils/warning/warningCandidateService.js';
import { getWarningLifecycleState, reconcileWarningLifecycle } from '../../utils/warning/warningLifecycleService.js';

const props = defineProps({ show: Boolean, getViewer: Function });
const assessmentMode=ref(false),typhoonMode=ref(false);
const emit = defineEmits(['close', 'locate-region', 'select-target', 'clear-target', 'open-forecast', 'open-warning-center']);
const warnings = ref([]), history = ref([]), targets = ref([]);
const selectedWarning = ref(null), loading = ref(false), detailLoading = ref(false);
const trendLoading = ref(false), trendError = ref(''), trendRecords = ref([]);
const trendDailyRecords = ref([]), trendHourlyRecords = ref([]), trendMode = ref('daily');
const errorMessage = ref(''), lastLoadedAt = ref(''), forecastFreshness = ref(null);
const filters = reactive({ mine: '', source: '', range: '', severity: '', status: '' });
const forecastStaleCount = computed(() => (filters.mine
    ? forecastFreshness.value?.staleByArea?.[filters.mine] : forecastFreshness.value?.staleCount) || 0);
const mineOptions = computed(() => targets.value.length
    ? [{ value: '', label: '全部矿区' }, ...targets.value.map(target => ({ value: target.id, label: target.name }))]
    : []);
const showHistory = ref(false), unreadCount = ref(0), globalAlert = ref(null), chartRef = ref(null);
const lifecycleScope = '_CHINA_CONTRACTS';
let chart, refreshTimer, trendRequestId = 0, detailRequestId = 0, updateRequestId = 0;
let initialAlertShown = false;

const severityText = (value) => ({ INFO: '关注', WARNING: '预警', CRITICAL: '严重' }[value] || value || '--');
const globalAlertClass = (value) => value === 'CRITICAL'
    ? 'border-rose-300 bg-rose-950/95'
    : 'border-amber-300 bg-amber-950/95';
const globalAlertTitle = (event) => event?.type === 'updated'
    ? '预警信息已更新'
    : event?.item?.severity === 'CRITICAL' ? '严重风险自动预警' : '风险自动预警';
const statusText = (value) => ({ ACTIVE: '生效中', CANDIDATE: '预警候选', RESOLVED: '已解除', EXPIRED: '已过期', active: '生效中' }[value] || value || '--');
const rangeText = (value, stale = false) => {
    const label = { grid: '网格评估时段', '12h': '未来12小时', '7d': '未来7天', '15d': '未来15天' }[value] || '—';
    return stale ? label.replace(/^未来/, '') : label;
};
const severityClass = (value) => ({ INFO: 'border-cyan-400/65 bg-cyan-900/75 text-cyan-50', WARNING: 'border-amber-300/75 bg-amber-900/80 text-amber-50', CRITICAL: 'border-rose-300/80 bg-rose-900/85 text-rose-50' }[value] || 'border-slate-500/70 bg-slate-800/75 text-slate-100');
const sourceClass = (value) => ({ '正式预警': 'border-rose-400/35 bg-rose-950/35 text-rose-200', '预报候选': 'border-violet-400/35 bg-violet-950/35 text-violet-200', '浮标监测': 'border-sky-400/35 bg-sky-950/35 text-sky-200', '管道评估': 'border-amber-400/35 bg-amber-950/35 text-amber-200', '演示预警': 'border-red-300/80 bg-red-900/80 text-red-50' }[value] || 'border-slate-600 bg-slate-900/40 text-slate-300');
const warningAccent = (value) => ({ INFO: '#06b6d4', WARNING: '#f59e0b', CRITICAL: '#ef4444' }[value] || '#64748b');
const warningCardClass = (item, selected = false) => {
    const tone = { INFO: 'border-cyan-400/70 bg-cyan-950/80 hover:border-cyan-200', WARNING: 'border-amber-300/80 bg-amber-950/85 hover:border-amber-100 shadow-[0_0_14px_rgba(245,158,11,0.18)]', CRITICAL: 'border-rose-300/90 bg-rose-950/90 hover:border-rose-100 shadow-[0_0_18px_rgba(239,68,68,0.28)]' }[item?.severity] || 'border-slate-500/80 bg-slate-900/85 hover:border-cyan-300';
    const selectedEffect = selected ? 'relative z-10 ring-2 ring-cyan-200/85 ring-offset-1 ring-offset-slate-950 shadow-[0_0_0_1px_rgba(255,255,255,.2),0_0_22px_rgba(34,211,238,.42)]' : '';
    return `w-full border-l-4 border p-3 text-left transition-all ${tone} ${selectedEffect}`;
};
const formatTime = (value) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? '--' : date.toLocaleString('zh-CN', { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); };
const shortDate = (value) => { const match = String(value || '').match(/\d{4}[-/]?(\d{1,2})[-/]?(\d{1,2})/); return match ? `${String(match[1]).padStart(2, '0')}月${String(match[2]).padStart(2, '0')}日` : value || '--'; };
const displayUnit = (value) => ({ 'm/s': '米/秒', 'm': '米', 's': '秒', 'm/s²': '米/秒²' }[String(value || '').trim()] || value || '');
const warningDisplayTitle = (item = {}) => {
    const scope = item.siteName ? `${item.regionName || item.miningArea || '未知区域'} · ${item.siteName}` : (item.regionName || item.miningArea || '未知区域');
    return item.warningCode || `${item.source || '预警记录'} · ${scope}`;
};
const durationBetween = (from, until) => {
    const start = new Date(from || '');
    const end = new Date(until || '');
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return '--';
    const hours = Math.round((end - start) / 3600000);
    if (hours >= 24) return `${Math.floor(hours / 24)}天${hours % 24 ? `${hours % 24}小时` : ''}`;
    return `${hours}小时`;
};
const candidateDateTime = (value) => {
    const raw = String(value || '');
    const match = raw.match(/(\d{4})[-/]?(\d{1,2})[-/]?(\d{1,2})(?:\s|T)?(\d{1,2})?(?::?(\d{2}))?/);
    if (!match) return value || '--';
    const dateText = `${String(match[1])}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}`;
    return match[4] === undefined ? shortDate(dateText) : `${shortDate(dateText)} ${String(match[4]).padStart(2, '0')}:${match[5] || '00'}`;
};

const matchesMine = item => !filters.mine || item.areaId === filters.mine;
const historyRows = computed(() => history.value.map(record => ({
    ...record.snapshot, id: record.id, status: record.status || record.snapshot?.status,
    resolvedAt: record.resolvedAt, resolveReason: record.resolveReason, versions: record.versions
})).filter(matchesMine));
const scopedWarnings = computed(() => warnings.value.filter(matchesMine));
const displayWarnings = computed(() => (showHistory.value ? historyRows.value : scopedWarnings.value).filter(item =>
    (!filters.source || item.source === filters.source) && (!filters.range || item.timeRange === filters.range)
    && (!filters.severity || item.severity === filters.severity) && (!filters.status || item.status === filters.status)));
const stats = computed(() => ({
    total: scopedWarnings.value.length,
    active: scopedWarnings.value.filter(item => item.status === 'ACTIVE' && !item.stale).length,
    critical: scopedWarnings.value.filter(item => item.severity === 'CRITICAL' && !item.stale).length,
    candidate: scopedWarnings.value.filter(item => item.sourceType === 'candidate').length
}));
const lifecycleEventText = (type) => ({ created: '生成', updated: '更新', resolved: '解除', expired: '过期解除' }[type] || type || '变更');
const expiredCandidate = computed(() => selectedWarning.value?.sourceType === 'candidate'
    && selectedWarning.value?.status === 'EXPIRED');
const candidateCoordinates = computed(() => {
    const { lng, lat } = selectedWarning.value?.site || {};
    return Number.isFinite(lng) && Number.isFinite(lat) ? { lng: lng.toFixed(4), lat: lat.toFixed(4) } : null;
});
const candidateReport = computed(() => {
    const item = selectedWarning.value || {};
    const analysis = item.analysis || {};
    const triggers = item.triggerDetail || [];
    const firstAt = analysis.firstRiskAt || triggers.find((trigger) => trigger.forecastDate)?.forecastDate || item.validUntil || '';
    const peakAt = analysis.peakAt || triggers.find((trigger) => trigger.forecastDate)?.forecastDate || firstAt;
    const endAt = analysis.endAt || item.validUntil || '';
    const duration = analysis.durationHours ? `约${analysis.durationHours}小时` : durationBetween(firstAt, endAt);
    const location = item.siteName ? `${item.regionName || '--'}的${item.siteName}` : (item.regionName || '--');
    const triggerText = analysis.firstRiskLabel || item.triggerType || '综合气象指标';
    const peakText = analysis.peakType ? `${analysis.peakType}约${analysis.peakValue}${displayUnit(analysis.peakUnit)}` : triggerText;
    return {
        conclusion: item.warningMessage || `预计${location}出现需要关注的风浪流条件。`,
        firstAt: candidateDateTime(firstAt),
        peakAt: `${candidateDateTime(peakAt)}（${peakText}）`,
        endAt: candidateDateTime(endAt),
        recoveredAt: candidateDateTime(analysis.recoveredAt),
        duration,
        granularity: analysis.dataGranularity || item.sourceGranularity || '逐日'
    };
});
const hasDailyHourlyTrend = computed(() => trendDailyRecords.value.length && trendHourlyRecords.value.length);
const trendTitle = computed(() => selectedWarning.value?.sourceType === 'grid' ? '矿区评估趋势' : '预报风险趋势');
const trendSubtitle = computed(() => {
    const item = selectedWarning.value;
    if (!item) return '请选择一条预警记录';
    return `${item.regionName || item.miningArea || '--'}${item.siteName ? ` · ${item.siteName}` : ''} · ${item.source || '风险记录'}`;
});
const trendGranularity = computed(() => {
    const item = selectedWarning.value;
    if (!item || !trendRecords.value.length) return '暂无数据';
    return item.sourceType === 'grid' || trendMode.value === 'hourly' ? '分时预报' : '逐日预报';
});
const trendEmptyText = computed(() => selectedWarning.value ? '暂无趋势数据' : '请选择一条预警记录');
const thresholdFor = (type) => {
    const trigger = (selectedWarning.value?.triggerDetail || []).find((item) => item.type === type);
    const value = Number(trigger?.threshold);
    return Number.isFinite(value) ? value : null;
};
const trendMetric = (record, fields) => fields.map(field => record?.[field]).find(value => value != null && value !== '' && Number.isFinite(Number(value))) ?? null;
const datePartOf = (value) => {
    const match = String(value || '').match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    return match ? `${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}` : '';
};
const clockPartOf = (value) => {
    const raw = String(value || '').trim();
    const clockMatch = raw.match(/(?:T|\s|^)(\d{1,2})[:：](\d{2})(?::\d{2})?/);
    if (clockMatch) return `${String(clockMatch[1]).padStart(2, '0')}:${clockMatch[2]}`;
    const compactMatch = raw.match(/(?:^|\s)(\d{2})(\d{2})(?:\d{2})?$/);
    return compactMatch ? `${compactMatch[1]}:${compactMatch[2]}` : '';
};
const clockFromValue = (value) => {
    if (value === undefined || value === null || value === '') return '';
    const raw = String(value).trim();
    const clock = clockPartOf(raw);
    if (clock) return clock;
    const numeric = Number(raw);
    if (!Number.isFinite(numeric)) return '';
    const hour = numeric >= 100 ? Math.floor(numeric / 100) : numeric;
    if (hour < 0 || hour > 23) return '';
    return `${String(hour).padStart(2, '0')}:00`;
};
const trendTimeKey = (record = {}) => {
    const values = [record.forecastTime, record.validTime, record.timestamp, record.observedAt, record.observationTime, record.measureTime, record.recordTime, record.datetime, record.time, record.forecastDate, record.date];
    const date = datePartOf(record.forecastDate) || datePartOf(record.date) || values.map(datePartOf).find(Boolean) || '';
    const clock = values.map(clockPartOf).find(Boolean) || clockFromValue(record.forecastHour ?? record.hour ?? record.validHour);
    if (date) return `${date}${clock ? ` ${clock}` : ''}`;
    return String(values.find((value) => value !== undefined && value !== null && String(value).trim()) || '');
};
const trendRecordsOf = (records = []) => {
    const unique = new Map();
    records.filter(Boolean).forEach((record) => {
        const key = trendTimeKey(record);
        if (key) unique.set(key, record);
    });
    return [...unique.values()].sort((first, second) => {
        const firstTime = trendDateValue(trendTimeKey(first));
        const secondTime = trendDateValue(trendTimeKey(second));
        return (firstTime ?? Number.MAX_SAFE_INTEGER) - (secondTime ?? Number.MAX_SAFE_INTEGER);
    });
};
const trendAxisLabel = (record = {}) => {
    const key = trendTimeKey(record);
    const dateMatch = key.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (!dateMatch) {
        const numericTime = Number(key);
        const parsed = Number.isFinite(numericTime) ? new Date(numericTime) : new Date(key);
        if (!Number.isNaN(parsed.getTime())) return `${String(parsed.getMonth() + 1).padStart(2, '0')}月${String(parsed.getDate()).padStart(2, '0')}日 ${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`;
        return '--';
    }
    const dateLabel = `${String(dateMatch[2]).padStart(2, '0')}月${String(dateMatch[3]).padStart(2, '0')}日`;
    const clock = clockPartOf(key);
    if (clock) return `${dateLabel}\n${clock}`;
    return dateLabel;
};
const applyTrendMode = () => {
    trendRecords.value = trendRecordsOf(trendMode.value === 'daily' ? trendDailyRecords.value : trendHourlyRecords.value);
};
const setTrendMode = (mode) => {
    if (!hasDailyHourlyTrend.value) return;
    trendMode.value = mode === 'daily' ? 'daily' : 'hourly';
    applyTrendMode();
    renderChart();
};
const trendMarkLine = (type) => {
    const value = thresholdFor(type);
    return value === null ? undefined : { silent: true, symbol: 'none', lineStyle: { color: '#fb7185', type: 'dashed', width: 1 }, label: { color: '#fecdd3', fontSize: 10, formatter: `阈值 ${value}` }, data: [{ yAxis: value }] };
};
const trendDateValue = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return null;
    const numeric = Number(raw);
    if (Number.isFinite(numeric) && numeric > 1000000000) return numeric < 100000000000 ? numeric * 1000 : numeric;
    const normalized = raw.replace(/\//g, '-').replace(' ', 'T');
    const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(normalized) ? `${normalized}T00:00:00` : normalized);
    return Number.isNaN(date.getTime()) ? null : date.getTime();
};
const trendCalendarDate = (value) => {
    const match = String(value || '').match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    return match ? `${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}` : '';
};
const trendDailyOf = (records = []) => {
    const grouped = new Map();
    records.filter(Boolean).forEach((record) => {
        const date = trendCalendarDate(trendTimeKey(record));
        if (!date) return;
        const current = grouped.get(date);
        if (!current) {
            grouped.set(date, { ...record, forecastDate: date, forecastTime: date });
            return;
        }
        ['windSpeedMax', 'windSpeedAvg', 'windSpeed', 'waveHeightMax', 'waveHeightAvg', 'waveHeight', 'currentSpeedMax', 'currentSpeedAvg', 'currentSpeed'].forEach((field) => {
            const incoming = Number(record[field]);
            const existing = Number(current[field]);
            if (Number.isFinite(incoming) && (!Number.isFinite(existing) || incoming > existing)) current[field] = record[field];
        });
    });
    return [...grouped.values()].sort((first, second) => trendDateValue(first.forecastDate) - trendDateValue(second.forecastDate));
};
const trendRiskBounds = computed(() => {
    const item = selectedWarning.value;
    const records = trendRecords.value;
    if (!item || !records.length) return null;
    const startRaw = item.validFrom || item.analysis?.firstRiskAt || item.triggerDetail?.find(trigger => trigger.forecastDate)?.forecastDate;
    const endRaw = item.validUntil || item.analysis?.endAt;
    const start = trendDateValue(startRaw);
    let end = trendDateValue(endRaw);
    if (endRaw && /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(String(endRaw).trim())) end = end === null ? null : end + 24 * 60 * 60 * 1000 - 1;
    if (start === null) return null;
    if (end === null || end < start) end = start;
    if (trendMode.value === 'daily') {
        const startDate = trendCalendarDate(startRaw);
        const endDate = trendCalendarDate(endRaw || startRaw) || startDate;
        if (startDate) {
            const matchedDaily = records.map((record, index) => ({ date: trendCalendarDate(trendTimeKey(record)), index })).filter((record) => record.date && record.date >= startDate && record.date <= endDate);
            if (matchedDaily.length) return { startIndex: matchedDaily[0].index, endIndex: matchedDaily.at(-1).index };
        }
    }
    const times = records.map(record => trendDateValue(record.forecastTime || trendTimeKey(record)));
    const matched = times.map((time, index) => ({ time, index })).filter((item) => item.time !== null && item.time >= start && item.time <= end);
    if (matched.length) return { startIndex: matched[0].index, endIndex: matched.at(-1).index };
    const nearest = times.map((time, index) => ({ time, index })).filter((item) => item.time !== null).sort((first, second) => Math.abs(first.time - start) - Math.abs(second.time - start))[0];
    return nearest ? { startIndex: nearest.index, endIndex: nearest.index } : null;
});
const trendRiskMarkArea = () => {
    const bounds = trendRiskBounds.value;
    if (!bounds) return undefined;
    const isDaily = trendMode.value === 'daily';
    const lastIndex = Math.max(0, trendRecords.value.length - 1);
    const startAxis = isDaily ? Math.max(-0.5, bounds.startIndex - 0.5) : bounds.startIndex;
    const endAxis = isDaily ? Math.min(lastIndex + 0.5, bounds.endIndex + 0.5) : bounds.endIndex;
    return { silent: true, itemStyle: { color: 'rgba(244, 63, 94, .14)', borderColor: 'rgba(251, 113, 133, .75)', borderWidth: 1 }, label: { show: true, color: '#fecdd3', fontSize: 10, formatter: expiredCandidate.value ? '超限时段' : '预计风险窗口', position: 'insideTop' }, data: [[{ xAxis: startAxis }, { xAxis: endAxis }]] };
};
const trendHighlightData = (values) => {
    const bounds = trendRiskBounds.value;
    if (!bounds) return values.map(() => null);
    return values.map((value, index) => index >= bounds.startIndex && index <= bounds.endIndex ? value : null);
};

const loadTrend = async (item) => {
    const requestId = ++trendRequestId;
    trendError.value = '';
    trendDailyRecords.value = [];
    trendHourlyRecords.value = [];
    trendRecords.value = [];
    trendMode.value = 'daily';
    trendLoading.value = item?.sourceType === 'grid';
    try {
        if (item?.sourceType === 'grid') {
            const records = await fetchMiningRiskTrend(item);
            if (requestId !== trendRequestId) return;
            trendHourlyRecords.value = trendRecordsOf(records);
            trendMode.value = 'hourly';
        } else if (item) {
            const { series = [], dailySeries, hourlySeries } = item.forecastData || {};
            if (item.timeRange === '12h' || hourlySeries?.length) {
                trendHourlyRecords.value = trendRecordsOf(hourlySeries || series);
                trendMode.value = 'hourly';
            }
            trendDailyRecords.value = trendDailyOf(dailySeries || (trendMode.value === 'daily' ? series : []));
        }
        applyTrendMode();
    } catch (error) {
        if (requestId === trendRequestId) trendError.value = `趋势读取失败：${error.message}`;
    } finally {
        if (requestId === trendRequestId) {
            trendLoading.value = false;
            await renderChart();
        }
    }
};

const renderChart = async () => {
    await nextTick();
    if (assessmentMode.value || typhoonMode.value) return;
    const records = trendRecords.value;
    if (!props.show || !records.length || !chartRef.value) {
        chart?.dispose();
        chart = null;
        return;
    }
    if (!chart || chart.getDom() !== chartRef.value) {
        chart?.dispose();
        chart = echarts.init(chartRef.value);
    }
    const windData = records.map((item) => trendMetric(item, ['windSpeedMax', 'windSpeedAvg', 'windSpeed']));
    const waveData = records.map((item) => trendMetric(item, ['waveHeightMax', 'waveHeightAvg', 'waveHeight']));
    const currentData = records.map((item) => trendMetric(item, ['currentSpeedMax', 'currentSpeedAvg', 'currentSpeed']));
    const riskArea = trendRiskMarkArea();
    const riskMetric = selectedWarning.value?.triggerDetail?.[0]?.type || '风速';
    const markRiskArea = type => riskMetric === type ? riskArea : undefined;
    const highlightSeries = trendRiskBounds.value ? [
        { name: '风险时段风速', type: 'line', smooth: true, showSymbol: true, symbolSize: 7, data: trendHighlightData(windData), lineStyle: { color: '#67e8f9', width: 4, shadowColor: '#22d3ee', shadowBlur: 10 }, itemStyle: { color: '#e0f2fe', borderColor: '#22d3ee', borderWidth: 2 }, z: 5, silent: true },
        { name: '风险时段浪高', type: 'line', smooth: true, yAxisIndex: 1, showSymbol: true, symbolSize: 7, data: trendHighlightData(waveData), lineStyle: { color: '#fde047', width: 4, shadowColor: '#facc15', shadowBlur: 10 }, itemStyle: { color: '#fef9c3', borderColor: '#facc15', borderWidth: 2 }, z: 5, silent: true },
        { name: '风险时段流速', type: 'line', smooth: true, showSymbol: true, symbolSize: 7, data: trendHighlightData(currentData), lineStyle: { color: '#c4b5fd', width: 4, shadowColor: '#a78bfa', shadowBlur: 10 }, itemStyle: { color: '#ede9fe', borderColor: '#a78bfa', borderWidth: 2 }, z: 5, silent: true }
    ] : [];
    chart.setOption({
        backgroundColor: 'transparent',
        color: ['#22d3ee', '#facc15', '#a78bfa'],
        tooltip: { trigger: 'axis', backgroundColor: 'rgba(8,20,38,.98)', borderColor: '#67e8f9', textStyle: { color: '#ffffff', fontSize: 12 }, axisPointer: { lineStyle: { color: '#bae6fd' } } },
        legend: { top: 0, textStyle: { color: '#ffffff', fontSize: 11, fontWeight: 600 }, data: ['风速', '浪高', '流速'] },
        grid: { left: 58, right: 58, top: 34, bottom: 56 },
        xAxis: { type: 'category', data: records.map(trendAxisLabel), axisLabel: { color: '#ffffff', fontSize: 11, fontWeight: 600, hideOverlap: false, interval: records.length > 10 ? Math.ceil(records.length / 8) - 1 : 0, rotate: 0, lineHeight: 16 }, axisLine: { lineStyle: { color: '#cbd5e1', width: 1 } }, axisTick: { lineStyle: { color: '#cbd5e1' } } },
        yAxis: [{ type: 'value', name: '风速/流速（米/秒）', axisLabel: { color: '#ffffff', fontSize: 11, fontWeight: 600 }, nameTextStyle: { color: '#ffffff', fontSize: 11, fontWeight: 700 }, axisLine: { show: true, lineStyle: { color: '#cbd5e1' } }, splitLine: { lineStyle: { color: 'rgba(148,163,184,.42)' } } }, { type: 'value', name: '浪高（米）', position: 'right', axisLabel: { color: '#ffffff', fontSize: 11, fontWeight: 600 }, nameTextStyle: { color: '#ffffff', fontSize: 11, fontWeight: 700 }, axisLine: { show: true, lineStyle: { color: '#cbd5e1' } }, splitLine: { show: false } }],
        series: [
            { name: '风速', type: 'line', smooth: true, showSymbol: records.length < 3, data: windData, markLine: trendMarkLine('风速'), markArea: markRiskArea('风速') },
            { name: '浪高', type: 'line', smooth: true, yAxisIndex: 1, showSymbol: records.length < 3, data: waveData, markLine: trendMarkLine('浪高'), markArea: markRiskArea('浪高') },
            { name: '流速', type: 'line', smooth: true, showSymbol: records.length < 3, data: currentData, markLine: trendMarkLine('流速'), markArea: markRiskArea('流速') },
            ...highlightSeries
        ]
    }, true);
    chart.resize();
};

const selectWarning = async (item, { locate = false } = {}) => {
    const requestId = ++detailRequestId;
    if (locate) { assessmentMode.value = false; typhoonMode.value = false; }
    selectedWarning.value = item || null;
    detailLoading.value = item?.sourceType === 'grid';
    if (locate && item) emit('locate-region', item);
    if (item?.sourceType === 'grid') {
        try {
            const versions = await fetchMiningRiskVersions(item.eventId);
            if (requestId === detailRequestId) selectedWarning.value = { ...item, versions };
        } catch (error) {
            if (requestId === detailRequestId) errorMessage.value = `预警详情加载失败：${error.message}`;
        }
    }
    if (requestId !== detailRequestId) return;
    detailLoading.value = false;
    await loadTrend(selectedWarning.value);
};

const showGlobalAlert = (event) => {
    if (!event?.item || !['WARNING', 'CRITICAL'].includes(event.item.severity)) return;
    const currentLevel = { CRITICAL: 0, WARNING: 1 }[globalAlert.value?.item?.severity] ?? 9;
    const nextLevel = { CRITICAL: 0, WARNING: 1 }[event.item.severity] ?? 9;
    if (nextLevel > currentLevel) return;
    globalAlert.value = event;
};
const dismissGlobalAlert = () => { globalAlert.value = null; };
const openGlobalWarningCenter = () => {
    const warning = globalAlert.value?.item || null;
    dismissGlobalAlert();
    emit('open-warning-center', warning);
};

const notifyLifecycleEvents = (events = []) => {
    events.forEach((event) => {
        const severity = event.item?.severity;
        if (!event.item?.stale && ['created', 'updated'].includes(event.type) && ['WARNING', 'CRITICAL'].includes(severity)) showGlobalAlert(event);
        if (event.type === 'resolved' || event.type === 'expired') {
            ElNotification({ title: event.type === 'expired' ? '预警已自动解除' : '预警已解除', message: event.text, type: 'success', duration: 9000, position: 'top-right', customClass: 'ocean-warning-notification', showClose: true });
        }
        window.dispatchEvent(new CustomEvent('warning-lifecycle-event', { detail: event }));
    });
    unreadCount.value += events.length;
};

const loadWarnings = async (force = false) => {
    const requestId = ++updateRequestId;
    if (props.show) loading.value = true;
    errorMessage.value = '';
    const catalog = fetchForecastTargets().then(rows => {
        if (requestId === updateRequestId) targets.value = rows;
    });
    const [candidateResult, gridResult, catalogResult] = await Promise.allSettled([
        fetchWarningCandidates({ force }), fetchMiningRiskWarnings(), catalog
    ]);
    if (requestId !== updateRequestId) return;
    const candidateData = candidateResult.status === 'fulfilled' ? candidateResult.value : null;
    if (candidateData) forecastFreshness.value = candidateData;
    const gridItems = gridResult.status === 'fulfilled' ? gridResult.value : [];
    const allowed = new Set(targets.value.map(target => target.id));
    const incoming = [...(candidateData?.items || []), ...gridItems].filter(item => allowed.has(item.areaId));
    const state = getWarningLifecycleState(lifecycleScope);
    const initializeSilently = !Object.keys(state.active).length && !state.history.length;
    const lifecycle = reconcileWarningLifecycle(incoming, {
        candidate: Boolean(candidateData), grid: gridResult.status === 'fulfilled'
    }, { initializeSilently, scope: lifecycleScope });
    const expiredItems = forecastFreshness.value?.expiredItems || [];
    warnings.value = [...lifecycle.activeItems, ...expiredItems].filter(item => allowed.has(item.areaId));
    history.value = lifecycle.history.filter(record => allowed.has(record.snapshot?.areaId));
    if (globalAlert.value && gridResult.status === 'fulfilled'
            && !warnings.value.some(item => item.id === globalAlert.value.item.id && !item.stale)) {
        dismissGlobalAlert();
    }
    notifyLifecycleEvents(lifecycle.events.filter(event => event.item?.sourceType === 'grid'));
    if (!initialAlertShown && gridResult.status === 'fulfilled') {
        const urgent = warnings.value.filter(item => item.sourceType === 'grid' && !item.stale && item.status === 'ACTIVE')
            .sort((a, b) => Number(b.severity === 'CRITICAL') - Number(a.severity === 'CRITICAL'))[0];
        if (urgent && initializeSilently) showGlobalAlert({ type: 'created', item: urgent, at: new Date().toISOString() });
        initialAlertShown = true;
    }
    lastLoadedAt.value = new Date().toISOString();
    errorMessage.value = [
        catalogResult.status === 'rejected' && '矿区清单读取失败',
        gridResult.status === 'rejected' && '矿区预警读取失败',
        candidateResult.status === 'rejected' && '预报研判读取失败'
    ].filter(Boolean).join(' · ');
    loading.value = false;
    if (props.show) {
        const current = displayWarnings.value.find(item => item.id === selectedWarning.value?.id) || displayWarnings.value[0];
        if (current?.id !== selectedWarning.value?.id || current?.fingerprint !== selectedWarning.value?.fingerprint
                || (current?.status === 'EXPIRED' && current !== selectedWarning.value)) {
            await selectWarning(current);
        }
    }
};

const toggleHistory = () => { showHistory.value = !showHistory.value; };
const markNotificationsRead = () => { unreadCount.value = 0; };
const download = async (format = 'txt') => {
    if (!selectedWarning.value) return;
    try {
        if (format === 'pdf') {
            const item = selectedWarning.value;
            const report = item.sourceType === 'grid'
                ? { ...item, forecastData: { series: trendHourlyRecords.value } }
                : item;
            await downloadWarningAnalysisPdf(warningExportText(item), report);
            return;
        }
        const blob = new Blob([`\uFEFF${warningExportText(selectedWarning.value)}\n`], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${selectedWarning.value.source}_${selectedWarning.value.warningCode || '预警分析'}.txt`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) { errorMessage.value = `预警报文下载失败：${error.message}`; }
};

const handleUpdate = () => { loadWarnings(true); };
const resizeChart = () => chart?.resize();
const startRefresh = () => { window.clearInterval(refreshTimer); refreshTimer = window.setInterval(() => loadWarnings(true), 120000); };
watch(() => props.show, (visible) => { if (visible) loadWarnings(); });
watch(() => filters.mine, id => {
    if (!props.show || assessmentMode.value || typhoonMode.value) return;
    const target = targets.value.find(item => item.id === id);
    if (target) emit('select-target', target);
    else emit('clear-target');
});
watch(() => [filters.mine, filters.source, filters.range, filters.severity, filters.status, showHistory.value], () => {
    if (props.show) void selectWarning(displayWarnings.value[0]);
});
watch([assessmentMode, typhoonMode], renderChart);
onMounted(() => {
    window.addEventListener('resize', resizeChart);
    window.addEventListener('weather-warning-updated', handleUpdate);
    loadWarnings();
    startRefresh();
});
onBeforeUnmount(() => {
    updateRequestId++;
    detailRequestId++;
    trendRequestId++;
    chart?.dispose();
    window.clearInterval(refreshTimer);
    window.removeEventListener('resize', resizeChart);
    window.removeEventListener('weather-warning-updated', handleUpdate);
});
</script>

<style scoped>
.warning-workspace-tab{padding:5px 8px;border:1px solid rgba(34,211,238,.35);background:rgba(8,15,28,.65);font-family:inherit;font-size:14px;font-weight:700;white-space:nowrap;}
.warning-workspace-tab.is-active{border-color:#67e8f9;background:rgba(8,145,178,.25);}
.warning-workspace-tab:focus-visible{outline:2px solid #67e8f9;outline-offset:2px;}
</style>
