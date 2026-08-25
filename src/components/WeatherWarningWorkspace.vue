<template>
    <transition name="workspace-fade">
        <div v-if="show" class="pointer-events-none absolute inset-0 z-40 font-['Noto_Sans_SC']">
            <div class="pointer-events-none absolute left-8 top-36 w-[30rem] max-h-[54.5rem]">
                <section class="tech-panel-enhanced pointer-events-auto relative flex max-h-[54.5rem] flex-col overflow-hidden p-5" style="clip-path: polygon(0 0,100% 0,100% 95%,92% 100%,0 100%);">
                    <div class="absolute left-0 top-0 h-[2px] w-full animate-pulse bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                    <div class="corner-decoration corner-tl scale-125"></div><div class="corner-decoration corner-tr scale-125"></div>
                    <div class="mb-4 flex items-center border-b-2 border-cyan-500/40 pb-3">
                        <div class="mr-3 h-6 w-1.5 bg-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.8)]"></div>
                        <div class="min-w-0 flex-1"><h3 class="text-2xl font-bold tracking-wider text-white">预警中心</h3><div class="mt-1 text-xs text-slate-500">正式预警、预报研判与浮标实时风险统一视图</div></div>
                        <button class="floating-panel-close-btn floating-panel-close-btn--inline" type="button" title="关闭预警中心" @click="emit('close')">✕</button>
                    </div>

                    <div class="mb-4 grid grid-cols-4 gap-2 text-xs">
                        <div class="border border-cyan-500/20 bg-slate-950/45 p-2 text-slate-400">全部<strong class="mt-1 block text-lg text-cyan-100">{{ stats.total }}</strong></div>
                        <div class="border border-amber-500/20 bg-slate-950/45 p-2 text-slate-400">生效中<strong class="mt-1 block text-lg text-amber-100">{{ stats.active }}</strong></div>
                        <div class="border border-rose-500/20 bg-slate-950/45 p-2 text-slate-400">严重<strong class="mt-1 block text-lg text-rose-100">{{ stats.critical }}</strong></div>
                        <div class="border border-violet-500/20 bg-slate-950/45 p-2 text-slate-400">候选<strong class="mt-1 block text-lg text-violet-100">{{ stats.candidate }}</strong></div>
                    </div>

                    <div class="mb-3 grid grid-cols-2 gap-2">
                        <select v-model="filters.source" class="border border-slate-700 bg-slate-950/70 px-2 py-2 text-xs text-slate-200"><option value="">全部来源</option><option value="正式预警">正式预警</option><option value="预报候选">预报候选</option><option value="浮标监测">浮标监测</option><option value="管道评估">管道评估</option></select>
                        <select v-model="filters.range" class="border border-slate-700 bg-slate-950/70 px-2 py-2 text-xs text-slate-200"><option value="">全部时段</option><option value="realtime">实时监测</option><option value="12h">未来12小时</option><option value="7d">未来7天</option><option value="15d">未来15天</option></select>
                        <select v-model="filters.severity" class="border border-slate-700 bg-slate-950/70 px-2 py-2 text-xs text-slate-200"><option value="">全部等级</option><option value="INFO">关注</option><option value="WARNING">预警</option><option value="CRITICAL">严重</option></select>
                        <select v-model="filters.status" class="border border-slate-700 bg-slate-950/70 px-2 py-2 text-xs text-slate-200"><option value="">全部状态</option><option value="ACTIVE">生效中</option><option value="CANDIDATE">预警候选</option><option value="RESOLVED">已解除</option></select>
                    </div>

                    <div class="mb-3 rounded border border-slate-700/70 bg-slate-950/40 px-3 py-2 text-[11px] text-slate-400">
                        <div class="flex items-center justify-between gap-2"><span>最近刷新：{{ formatTime(lastLoadedAt) }}</span><span :class="candidateMeta.staleCount ? 'text-amber-200' : 'text-emerald-200'">{{ candidateMeta.staleCount ? `${candidateMeta.staleCount} 条候选数据已过期` : '候选数据时效正常' }}</span></div>
                    </div>
                    <div v-if="errorMessage" class="mb-3 border border-amber-500/35 bg-amber-950/30 p-3 text-xs leading-5 text-amber-100">{{ errorMessage }}</div>
                    <div class="mb-2 flex items-center justify-between gap-2"><div class="flex items-center gap-2"><span class="text-sm font-bold text-cyan-200">{{ showHistory ? '历史预警档案' : '当前预警记录' }}</span><span v-if="unreadCount" class="rounded-full border border-rose-400/45 bg-rose-950/45 px-2 py-0.5 text-[10px] font-bold text-rose-100">未读 {{ unreadCount }}</span></div><div class="flex items-center gap-3"><button class="text-xs font-bold text-violet-300 hover:text-white" type="button" @click="toggleHistory">{{ showHistory ? '返回当前预警' : `历史档案（${historyRows.length}）` }}</button><button v-if="unreadCount" class="text-xs font-bold text-slate-400 hover:text-white" type="button" @click="markNotificationsRead">标记已读</button><button class="text-xs font-bold text-cyan-300 hover:text-white" type="button" @click="loadWarnings(true)">刷新数据</button></div></div>
                    <div class="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pr-2">
                        <div v-if="loading" class="flex h-full items-center justify-center text-sm text-slate-400">正在读取预警与预报数据...</div>
                        <button v-for="item in displayWarnings" :key="`${showHistory ? 'history' : 'active'}-${item.id}-${item.resolvedAt || ''}`" type="button" :class="warningCardClass(item, item.id === selectedWarning?.id)" :style="{ borderLeftColor: warningAccent(item.severity) }" @click="selectWarning(item)">
                            <div class="flex items-start justify-between gap-2"><div class="min-w-0 flex-1"><div class="flex min-w-0 items-center gap-2"><span :class="['shrink-0 rounded-sm border px-1.5 py-0.5 text-[10px] font-bold', sourceClass(item.source)]">{{ item.source }}</span><div class="truncate text-sm font-bold text-white">{{ warningDisplayTitle(item) }}</div></div><div class="mt-1 truncate text-xs text-slate-400">{{ item.regionName || item.miningArea || '--' }}<span v-if="item.siteName"> · {{ item.siteName }}</span> · {{ rangeText(item.timeRange) }}</div></div><span :class="['shrink-0 border px-2 py-0.5 text-xs font-bold', severityClass(item.severity)]">{{ severityText(item.severity) }}</span></div>
                            <div class="mt-2 border-t border-slate-700/60 pt-2 text-xs leading-5 text-slate-300">{{ item.warningMessage }}</div>
                            <div class="mt-1 flex items-center justify-between gap-2 text-[11px] text-slate-500"><span>{{ item.triggerType || '综合指标' }}</span><span v-if="showHistory" class="text-slate-400">{{ item.resolvedAt ? `解除于 ${formatTime(item.resolvedAt)}` : '历史记录' }}</span><span v-else-if="item.stale" class="text-amber-300">数据已过期</span><span v-else>{{ statusText(item.status) }}</span></div>
                        </button>
                        <div v-if="!loading && !displayWarnings.length" class="flex h-36 items-center justify-center border border-dashed border-slate-700/50 text-sm text-slate-500">{{ showHistory ? '暂无历史预警档案' : '暂无符合条件的预警或候选记录' }}</div>
                    </div>
                </section>
            </div>

            <div class="pointer-events-none absolute right-6 top-36 w-[31rem] max-h-[54.5rem]">
                <section class="tech-panel-enhanced pointer-events-auto relative flex max-h-[54.5rem] flex-col overflow-hidden p-5" style="clip-path: polygon(0 0,92% 0,100% 7%,100% 100%,0 100%);">
                    <div class="absolute left-0 top-0 h-[2px] w-full animate-pulse bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div><div class="corner-decoration corner-bl scale-125"></div><div class="corner-decoration corner-br scale-125"></div>
                    <div class="mb-3 flex items-start justify-between border-b-2 border-cyan-500/40 pb-3"><div class="min-w-0"><div class="flex items-center gap-2"><span v-if="selectedWarning" :class="['rounded-sm border px-2 py-1 text-[11px] font-bold', sourceClass(selectedWarning.source)]">{{ selectedWarning.source }}</span><div class="truncate text-xl font-bold text-white">{{ selectedWarning ? warningDisplayTitle(selectedWarning) : '预警详情' }}</div></div><div class="mt-1 truncate text-xs text-slate-400">{{ selectedWarning?.regionName || selectedWarning?.miningArea || '请选择左侧预警记录' }}<span v-if="selectedWarning?.siteName"> · {{ selectedWarning.siteName }}</span></div></div><button v-if="selectedWarning" class="shrink-0 border border-cyan-500/45 bg-cyan-950/45 px-3 py-1.5 text-xs font-bold text-cyan-100 hover:bg-cyan-500 hover:text-slate-950" type="button" @click="download">{{ selectedWarning.source === '正式预警' ? '下载正式报文' : '下载分析报文' }}</button></div>
                    <div v-if="detailLoading" class="flex flex-1 items-center justify-center text-sm text-slate-400">正在加载预警详情...</div>
                    <template v-else-if="selectedWarning">
                        <div class="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
                        <template v-if="selectedWarning.source === '正式预警'">
                            <div class="mb-3 rounded border border-rose-400/35 bg-gradient-to-br from-rose-950/55 via-slate-950/60 to-slate-950/90 p-4"><div class="text-xs font-bold tracking-widest text-rose-200">预警结论</div><div class="mt-2 text-[15px] font-bold leading-7 text-white">{{ formalReport.conclusion }}</div><div class="mt-2 text-xs leading-5 text-rose-100/80">影响对象：{{ formalReport.scope }} · 预警等级：{{ severityText(selectedWarning.severity) }}</div><div v-if="formalReport.inferred" class="mt-2 border-t border-rose-300/20 pt-2 text-[11px] leading-5 text-amber-100">部分时间、影响和建议根据后端返回的逐时/逐日气象数据推断，后端正式预警等级和原始判定保持不变。</div></div>
                            <div class="mb-3 grid grid-cols-3 gap-2 text-xs"><div class="border border-slate-700/60 bg-slate-950/35 p-3 text-slate-400">预警等级<strong :class="['mt-1 block text-base', severityClass(selectedWarning.severity)]">{{ severityText(selectedWarning.severity) }}</strong></div><div class="border border-slate-700/60 bg-slate-950/35 p-3 text-slate-400">记录状态<strong class="mt-1 block text-base text-cyan-100">{{ statusText(selectedWarning.status) }}</strong></div><div class="border border-slate-700/60 bg-slate-950/35 p-3 text-slate-400">持续时间<strong class="mt-1 block text-base text-amber-100">{{ formalReport.duration }}</strong></div></div>
                            <section class="mb-3 rounded border border-cyan-500/25 bg-cyan-950/20 p-3"><div class="mb-2 text-sm font-bold text-cyan-200">预警信息</div><div class="grid grid-cols-2 gap-x-3 gap-y-2 text-xs leading-5 text-slate-300"><div>具体区域：<strong class="text-cyan-100">{{ formalReport.regionName }}</strong></div><div>具体矿区：<strong class="text-cyan-100">{{ formalReport.siteName || '区域范围内' }}</strong></div><div>预计开始：<strong class="text-amber-100">{{ formalReport.validFrom ? formatTime(formalReport.validFrom) : '后端未提供' }}</strong></div><div>预计结束：<strong class="text-amber-100">{{ formalReport.validUntil ? formatTime(formalReport.validUntil) : '后端未提供' }}</strong></div><div>数据基准：<strong class="text-cyan-100">{{ selectedWarning.sourceBase || '后端未提供' }}</strong></div><div>发布时间：<strong class="text-cyan-100">{{ formatTime(readFormalValue(selectedWarning, ['issuedAt', 'publishTime', 'issueTime', 'createdAt'])) }}</strong></div></div></section>
                            <section class="mb-3 rounded border border-amber-500/25 bg-amber-950/15 p-3"><div class="mb-2 flex items-center justify-between"><div class="text-sm font-bold text-amber-200">达到的气象条件</div><span class="text-[10px] text-amber-300/60">后端返回值</span></div><div class="space-y-1.5 text-xs text-slate-300"><div v-for="trigger in formalReport.triggers" :key="`${trigger.type}-${trigger.value}-${trigger.forecastDate}`" class="flex items-center justify-between rounded bg-slate-950/35 px-2 py-1.5"><span>{{ trigger.type }}</span><strong class="text-amber-100">{{ trigger.value }} {{ displayUnit(trigger.unit) }}<span v-if="trigger.threshold !== '--'" class="ml-2 font-normal text-slate-500">阈值 {{ trigger.threshold }} {{ displayUnit(trigger.unit) }}</span></strong></div><div v-if="!formalReport.triggers.length" class="text-slate-500">后端未返回可展示的气象指标。</div></div></section>
                            <section class="mb-3 rounded border border-slate-700/70 bg-slate-950/40 p-3"><div class="mb-2 text-sm font-bold text-cyan-200">影响与处置建议</div><div class="text-xs leading-6 text-slate-300"><div><span class="text-slate-500">影响分析：</span>{{ formalReport.impact }}</div><div class="mt-2 border-t border-slate-700/60 pt-2"><span class="text-slate-500">处置建议：</span>{{ formalReport.suggestion }}</div></div></section>
                            <section class="mb-3 rounded border border-slate-700/70 bg-slate-950/35 p-3"><div class="mb-2 flex items-center justify-between"><div class="text-sm font-bold text-cyan-200">详细预报数据</div><span class="text-[10px] text-slate-500">按时间顺序</span></div><div v-if="formalReport.series.length" class="custom-scrollbar max-h-44 overflow-y-auto"><table class="w-full border-collapse text-[11px] text-slate-300"><thead class="sticky top-0 bg-slate-900 text-cyan-200"><tr><th class="border-b border-slate-700 px-2 py-1.5 text-left">时间</th><th class="border-b border-slate-700 px-2 py-1.5 text-right">风速</th><th class="border-b border-slate-700 px-2 py-1.5 text-right">浪高</th><th class="border-b border-slate-700 px-2 py-1.5 text-right">流速</th></tr></thead><tbody><tr v-for="(record, index) in formalReport.series" :key="`${record.forecastTime || record.forecastDate}-${index}`"><td class="border-b border-slate-800 px-2 py-1.5">{{ formatTime(record.forecastTime || record.forecastDate) }}</td><td class="border-b border-slate-800 px-2 py-1.5 text-right text-cyan-100">{{ record.windSpeedMax ?? record.windSpeedAvg ?? record.windSpeed ?? '--' }}</td><td class="border-b border-slate-800 px-2 py-1.5 text-right text-amber-100">{{ record.waveHeightMax ?? record.waveHeightAvg ?? record.waveHeight ?? '--' }}</td><td class="border-b border-slate-800 px-2 py-1.5 text-right text-violet-100">{{ record.currentSpeedMax ?? record.currentSpeedAvg ?? record.currentSpeed ?? '--' }}</td></tr></tbody></table></div><div v-else class="text-xs text-slate-500">后端未返回逐时或逐日详细数据。</div></section>
                            <div v-if="selectedWarning.versions?.length" class="mb-3 rounded border border-violet-500/20 bg-violet-950/15 p-3"><div class="mb-2 text-xs font-bold text-violet-200">生命周期记录</div><div class="space-y-1.5 text-[11px] text-slate-300"><div v-for="version in selectedWarning.versions" :key="`${version.at}-${version.type}`" class="flex gap-2"><span class="shrink-0 text-slate-500">{{ formatTime(version.at) }}</span><span>{{ lifecycleEventText(version.type) }}{{ version.text ? `：${version.text}` : '' }}</span></div></div></div>
                        </template>
                        <template v-else>
                            <section v-if="selectedWarning.source === '预报候选'" class="mb-3 rounded border border-violet-400/35 bg-gradient-to-br from-violet-950/45 via-slate-950/55 to-slate-950/85 p-4">
                                <div class="flex flex-wrap items-center justify-between gap-2"><div class="text-sm font-bold tracking-wide text-violet-100">风险窗口</div><div class="flex flex-wrap items-center justify-end gap-1.5"><span class="border border-violet-300/30 bg-violet-950/45 px-2 py-1 text-[10px] text-violet-200">{{ candidateReport.granularity }}</span><button v-if="selectedWarning.region" type="button" class="border border-cyan-500/45 bg-cyan-950/35 px-2 py-1 text-[11px] font-bold text-cyan-100 hover:bg-cyan-500 hover:text-slate-950" @click="emit('locate-region', selectedWarning)">定位地图</button><button v-if="selectedWarning.region" type="button" class="border border-violet-500/45 bg-violet-950/35 px-2 py-1 text-[11px] font-bold text-violet-100 hover:bg-violet-500 hover:text-slate-950" @click="emit('open-forecast', selectedWarning)">进入预报中心</button></div></div>
                                <div class="mt-2 text-[15px] font-bold leading-7 text-white">{{ candidateReport.conclusion }}</div>
                                <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
                                    <div class="rounded border border-slate-700/60 bg-slate-950/45 p-2"><div class="text-slate-500">首次达到</div><strong class="mt-1 block text-amber-100">{{ candidateReport.firstAt }}</strong></div>
                                    <div class="rounded border border-slate-700/60 bg-slate-950/45 p-2"><div class="text-slate-500">预计峰值</div><strong class="mt-1 block text-rose-100">{{ candidateReport.peakAt }}</strong></div>
                                    <div class="rounded border border-slate-700/60 bg-slate-950/45 p-2"><div class="text-slate-500">预计解除</div><strong class="mt-1 block text-cyan-100">{{ candidateReport.endAt }}</strong></div>
                                    <div class="rounded border border-slate-700/60 bg-slate-950/45 p-2"><div class="text-slate-500">预计持续</div><strong class="mt-1 block text-violet-100">{{ candidateReport.duration }}</strong></div>
                                </div>
                                <div v-if="selectedWarning.buoyId" class="mt-3 flex flex-wrap gap-2"><button type="button" class="border border-sky-500/45 bg-sky-950/35 px-3 py-1.5 text-xs font-bold text-sky-100 hover:bg-sky-500 hover:text-slate-950" @click="emit('open-buoy', selectedWarning)">查看浮标监测</button></div>
                            </section>
                            <section v-if="selectedWarning.source === '浮标监测'" class="mb-3 rounded border border-sky-400/35 bg-gradient-to-br from-sky-950/45 via-slate-950/55 to-slate-950/85 p-4">
                                <div class="flex items-center justify-between gap-2"><div class="text-sm font-bold tracking-wide text-sky-100">实时风险</div><span class="border border-sky-300/30 bg-sky-950/45 px-2 py-1 text-[10px] text-sky-200">实时监测</span></div>
                                <div class="mt-2 text-[15px] font-bold leading-7 text-white">{{ buoyReport.conclusion }}</div>
                                <div class="mt-3 grid grid-cols-2 gap-2 text-xs"><div class="rounded border border-slate-700/60 bg-slate-950/45 p-2"><div class="text-slate-500">数据时间</div><strong class="mt-1 block text-cyan-100">{{ buoyReport.observedAt }}</strong></div><div class="rounded border border-slate-700/60 bg-slate-950/45 p-2"><div class="text-slate-500">监测位置</div><strong class="mt-1 block text-cyan-100">{{ buoyReport.location }}</strong></div></div>
                                <div class="mt-3 border-t border-sky-300/15 pt-2 text-xs leading-6 text-slate-300"><span class="text-slate-500">处置建议：</span>{{ buoyReport.advice }}</div>
                            </section>
                            <div class="mb-3 grid grid-cols-3 gap-2 text-xs"><div class="border border-slate-700/60 bg-slate-950/35 p-3 text-slate-400">预警等级<strong :class="['mt-1 block text-base', severityClass(selectedWarning.severity)]">{{ severityText(selectedWarning.severity) }}</strong></div><div class="border border-slate-700/60 bg-slate-950/35 p-3 text-slate-400">记录状态<strong class="mt-1 block text-base text-cyan-100">{{ statusText(selectedWarning.status) }}</strong></div><div class="border border-slate-700/60 bg-slate-950/35 p-3 text-slate-400">数据状态<strong :class="['mt-1 block text-base', selectedWarning.stale ? 'text-amber-200' : 'text-emerald-200']">{{ selectedWarning.stale ? '需核对' : '有效' }}</strong></div></div>
                            <div class="mb-3 rounded border border-cyan-500/20 bg-cyan-950/20 p-3 text-xs leading-5 text-slate-300"><div class="grid grid-cols-2 gap-y-1"><span>数据基准：<strong class="text-cyan-100">{{ selectedWarning.sourceBase || '--' }}</strong></span><span>有效至：<strong class="text-cyan-100">{{ selectedWarning.validUntil || '--' }}</strong></span><span>预报时段：<strong class="text-cyan-100">{{ rangeText(selectedWarning.timeRange) }}</strong></span><span>生成时间：<strong class="text-cyan-100">{{ formatTime(selectedWarning.createdAt) }}</strong></span><span v-if="selectedWarning.resolvedAt">解除时间：<strong class="text-amber-100">{{ formatTime(selectedWarning.resolvedAt) }}</strong></span><span v-if="selectedWarning.resolvedAt">解除原因：<strong class="text-amber-100">{{ selectedWarning.resolveReason || '最新预报不再满足条件' }}</strong></span></div><div v-if="selectedWarning.stale" class="mt-2 border-t border-amber-500/20 pt-2 text-amber-200">当前候选基于过期的后端预报数据，仅用于发现风险线索，不应直接作为正式预警依据。</div></div>
                            <div v-if="!['预报候选', '浮标监测'].includes(selectedWarning.source)" class="mb-3 text-sm leading-6 text-slate-200">{{ selectedWarning.warningMessage }}</div>
                            <div class="mb-3 border-y border-cyan-500/20 py-3"><div class="mb-2 text-sm font-bold text-cyan-200">触发指标</div><div class="space-y-1.5 text-xs text-slate-300"><div v-for="trigger in selectedWarning.triggerDetail || []" :key="`${trigger.type}-${trigger.value}-${trigger.forecastDate}`" class="flex items-center justify-between gap-2 rounded bg-slate-950/35 px-2 py-1.5"><span>{{ trigger.type }}：<strong class="text-amber-100">{{ trigger.value }} {{ displayUnit(trigger.unit) }}</strong></span><span class="text-slate-500">阈值 {{ trigger.threshold }} {{ displayUnit(trigger.unit) }}<span v-if="trigger.forecastDate"> · {{ shortDate(trigger.forecastDate) }}</span></span></div><div v-if="!selectedWarning.triggerDetail?.length" class="text-slate-500">暂无结构化指标</div></div></div>
                            <div v-if="selectedWarning.source !== '预报候选'" class="mb-3 flex flex-wrap gap-2"><button v-if="selectedWarning.region" type="button" class="border border-cyan-500/45 bg-cyan-950/35 px-3 py-1.5 text-xs font-bold text-cyan-100 hover:bg-cyan-500 hover:text-slate-950" @click="emit('locate-region', selectedWarning)">定位地图</button><button v-if="selectedWarning.region" type="button" class="border border-violet-500/45 bg-violet-950/35 px-3 py-1.5 text-xs font-bold text-violet-100 hover:bg-violet-500 hover:text-slate-950" @click="emit('open-forecast', selectedWarning)">进入预报中心</button><button v-if="selectedWarning.buoyId" type="button" class="border border-sky-500/45 bg-sky-950/35 px-3 py-1.5 text-xs font-bold text-sky-100 hover:bg-sky-500 hover:text-slate-950" @click="emit('open-buoy', selectedWarning)">查看浮标监测</button></div>
                            <div v-if="selectedWarning.versions?.length" class="mb-3 rounded border border-violet-500/20 bg-violet-950/15 p-3"><div class="mb-2 text-xs font-bold text-violet-200">生命周期记录</div><div class="space-y-1.5 text-[11px] text-slate-300"><div v-for="version in selectedWarning.versions" :key="`${version.at}-${version.type}`" class="flex gap-2"><span class="shrink-0 text-slate-500">{{ formatTime(version.at) }}</span><span>{{ lifecycleEventText(version.type) }}{{ version.text ? `：${version.text}` : '' }}</span></div></div></div>
                        </template>
                        </div>
                    </template>
                    <div v-else class="flex flex-1 items-center justify-center border border-dashed border-slate-700/50 text-sm text-slate-500">请选择一条预警记录</div>
                </section>
            </div>

            <div class="pointer-events-none absolute bottom-16 left-[33rem] right-[33rem] h-[19rem]"><section class="tech-panel-enhanced pointer-events-auto relative flex h-full flex-col overflow-hidden p-4"><div class="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div><div class="mb-3 flex items-start justify-between gap-3"><div class="min-w-0"><div class="text-lg font-bold text-white">{{ trendTitle }}</div><div class="mt-1 truncate text-xs text-slate-400">{{ trendSubtitle }}</div></div><div class="flex shrink-0 items-center gap-2"><div v-if="isSiteForecastTrend" class="flex items-center border border-violet-500/30 bg-violet-950/25 p-0.5"><button type="button" :class="['px-2 py-1 text-[10px] font-bold transition', trendMode === 'daily' ? 'bg-violet-500/80 text-white' : 'text-violet-200 hover:bg-violet-500/25']" @click="setTrendMode('daily')">未来7天概览</button><button type="button" :class="['px-2 py-1 text-[10px] font-bold transition', trendMode === 'hourly' ? 'bg-cyan-500/80 text-slate-950' : 'text-cyan-200 hover:bg-cyan-500/25']" @click="setTrendMode('hourly')">风险日逐小时</button></div><span class="border border-cyan-500/25 bg-cyan-950/25 px-2 py-1 text-[10px] text-cyan-200">{{ trendGranularity }}</span></div></div><div class="relative min-h-0 flex-1"><div v-if="trendRecords.length" ref="chartRef" class="h-full w-full"></div><div v-if="trendLoading" class="absolute inset-0 flex items-center justify-center bg-slate-950/65 text-sm text-slate-300">正在读取趋势数据...</div><div v-else-if="trendError" class="absolute inset-0 flex items-center justify-center text-sm text-amber-200">{{ trendError }}</div><div v-else-if="!trendRecords.length" class="absolute inset-0 flex items-center justify-center border border-dashed border-slate-700/50 text-sm text-slate-500">{{ trendEmptyText }}</div></div></section></div>
        </div>
    </transition>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import * as echarts from 'echarts';
import { ElNotification } from 'element-plus';
import { downloadWeatherWarningBulletin, fetchBuoyHistory, fetchWeatherWarningDetail, fetchWeatherWarnings, fetchWeatherWarningStats } from '../api/forecastWarningBuoy.js';
import { fetchMiningOverviewSiteDaily, fetchMiningOverviewSiteHourly } from '../api/miningRegionOverview.js';
import { getPipelineWarnings } from '../utils/pipelineWarningService.js';
import { fetchBuoyWarnings } from '../utils/buoyWarningService.js';
import { fetchWarningCandidates } from '../utils/warningCandidateService.js';
import { getWarningLifecycleState, reconcileWarningLifecycle } from '../utils/warningLifecycleService.js';

const props = defineProps({ show: Boolean });
const emit = defineEmits(['close', 'locate-region', 'open-forecast', 'open-buoy']);
const warnings = ref([]); const history = ref([]); const selectedWarning = ref(null); const loading = ref(false); const detailLoading = ref(false); const trendLoading = ref(false); const trendError = ref(''); const trendRecords = ref([]); const trendDailyRecords = ref([]); const trendHourlyRecords = ref([]); const trendMode = ref('hourly'); const errorMessage = ref(''); const lastLoadedAt = ref(''); const candidateMeta = reactive({ staleCount: 0, generatedAt: '' }); const formalStats = ref({}); const filters = reactive({ source: '', range: '', severity: '', status: '' }); const showHistory = ref(false); const unreadCount = ref(0); const chartRef = ref(null); let chart = null; let refreshTimer = null; let trendRequestId = 0;

const severityText = (value) => ({ INFO: '关注', WARNING: '预警', CRITICAL: '严重' }[value] || value || '--');
const statusText = (value) => ({ ACTIVE: '生效中', CANDIDATE: '预警候选', RESOLVED: '已解除', EXPIRED: '已过期', active: '生效中' }[value] || value || '--');
const rangeText = (value) => ({ realtime: '实时监测', '12h': '未来12小时', '7d': '未来7天', '15d': '未来15天' }[value] || '预报时段待定');
const severityClass = (value) => ({ INFO: 'border-cyan-500/45 bg-cyan-950/35 text-cyan-100', WARNING: 'border-amber-400/45 bg-amber-950/35 text-amber-100', CRITICAL: 'border-rose-400/45 bg-rose-950/35 text-rose-100' }[value] || 'border-slate-600 text-slate-300');
const sourceClass = (value) => ({ '正式预警': 'border-rose-400/35 bg-rose-950/35 text-rose-200', '预报候选': 'border-violet-400/35 bg-violet-950/35 text-violet-200', '浮标监测': 'border-sky-400/35 bg-sky-950/35 text-sky-200', '管道评估': 'border-amber-400/35 bg-amber-950/35 text-amber-200' }[value] || 'border-slate-600 bg-slate-900/40 text-slate-300');
const warningAccent = (value) => ({ INFO: '#22d3ee', WARNING: '#f59e0b', CRITICAL: '#f43f5e' }[value] || '#64748b');
const warningCardClass = (item, selected = false) => {
    const tone = { INFO: 'border-cyan-500/35 bg-cyan-950/25 hover:border-cyan-400/70', WARNING: 'border-amber-500/40 bg-amber-950/25 hover:border-amber-400/70', CRITICAL: 'border-rose-500/45 bg-rose-950/25 hover:border-rose-400/75' }[item?.severity] || 'border-slate-700/70 bg-slate-950/35 hover:border-cyan-500/45';
    return `w-full border-l-4 border p-3 text-left transition-all ${selected ? 'border-cyan-300/70 bg-cyan-950/45 ring-1 ring-cyan-300/25' : tone}`;
};
const formatTime = (value) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? '--' : date.toLocaleString('zh-CN', { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); };
const shortDate = (value) => { const match = String(value || '').match(/\d{4}[-/]?(\d{1,2})[-/]?(\d{1,2})/); return match ? `${String(match[1]).padStart(2, '0')}月${String(match[2]).padStart(2, '0')}日` : value || '--'; };
const displayUnit = (value) => ({ 'm/s': '米/秒', 'm': '米', 's': '秒', 'm/s²': '米/秒²' }[String(value || '').trim()] || value || '');
const formalMetricLabel = (value) => {
    const raw = String(value || '').trim();
    const key = raw.replace(/[-\s_]/g, '').toUpperCase();
    return ({ WIND: '风速', WINDSPEED: '风速', WINDSPEEDAVG: '平均风速', MAXWINDSPEED: '最大风速', GUST: '阵风', WINDGUST: '最大阵风', MAXGUST: '最大阵风', WAVE: '浪高', WAVEHEIGHT: '浪高', WAVEHEIGHTAVG: '平均浪高', MAXWAVEHEIGHT: '最大浪高', WAVEPERIOD: '浪周期', CURRENT: '流速', CURRENTSPEED: '流速', CURRENTSPEEDAVG: '平均流速', MAXCURRENTSPEED: '最大流速' }[key] || raw || '触发指标');
};
const translateWeatherText = (value) => String(value || '')
    .replace(/wave\s*height/gi, '浪高')
    .replace(/waveheight/gi, '浪高')
    .replace(/\bwave\b/gi, '浪')
    .replace(/wind\s*speed/gi, '风速')
    .replace(/windspeed/gi, '风速')
    .replace(/\bwind\b/gi, '风')
    .replace(/current\s*speed/gi, '流速')
    .replace(/currentspeed/gi, '流速')
    .replace(/\bcurrent\b/gi, '流')
    .replace(/gust/gi, '阵风')
    .replace(/forecast\s*time/gi, '预报时间')
    .replace(/forecastdate/gi, '预报日期');
const formalSeriesOf = (item = {}) => {
    const candidates = [item.forecastData?.series, item.forecastData?.hourly, item.forecastData?.daily, item.forecastSeries, item.hourlyForecast, item.dailyForecast, item.series, item.data?.series];
    return candidates.find((value) => Array.isArray(value)) || [];
};
const recordMetricValue = (record, fields) => {
    for (const field of fields) {
        const number = Number(record?.[field]);
        if (Number.isFinite(number)) return number;
    }
    return null;
};
const deriveFormalTriggers = (item = {}) => {
    const series = formalSeriesOf(item);
    if (!series.length) return [];
    const definitions = [
        { type: '风速', unit: 'm/s', fields: ['windSpeedMax', 'windSpeedAvg', 'windSpeed'] },
        { type: '浪高', unit: 'm', fields: ['waveHeightMax', 'waveHeightAvg', 'waveHeight'] },
        { type: '流速', unit: 'm/s', fields: ['currentSpeedMax', 'currentSpeedAvg', 'currentSpeed'] }
    ];
    return definitions.flatMap((definition) => {
        const records = series.map((record) => ({ record, value: recordMetricValue(record, definition.fields) })).filter((item) => item.value !== null);
        if (!records.length) return [];
        const peak = records.reduce((best, item) => item.value > best.value ? item : best, records[0]);
        return [{ type: definition.type, value: peak.value.toFixed(1), unit: definition.unit, threshold: '--', forecastDate: peak.record.forecastTime || peak.record.forecastDate || '', derived: true }];
    });
};
const warningDisplayTitle = (item = {}) => {
    const scope = item.siteName ? `${item.regionName || item.miningArea || '未知区域'} · ${item.siteName}` : (item.regionName || item.miningArea || '未知区域');
    if (item.source === '正式预警') return `气象预警 · ${scope}`;
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

const readFormalValue = (item, fields) => fields.map((field) => item?.[field]).find((value) => value !== undefined && value !== null && String(value).trim() !== '');
const formalSeverity = (item) => {
    const value = String(readFormalValue(item, ['severity', 'warningLevel', 'level', 'alertLevel']) || '').toUpperCase();
    if (['CRITICAL', 'RED', '红色', '严重'].includes(value)) return 'CRITICAL';
    if (['INFO', 'BLUE', '提示', '蓝色'].includes(value)) return 'INFO';
    if (!value) {
        const triggers = normalizeFormalTriggers(item);
        const peak = Object.fromEntries(triggers.map((trigger) => [trigger.type, Number(trigger.value)]));
        if (peak['风速'] >= 18 || peak['浪高'] >= 5 || peak['流速'] >= 2) return 'CRITICAL';
        if (peak['风速'] >= 12 || peak['浪高'] >= 3 || peak['流速'] >= 1.5) return 'WARNING';
        if (peak['风速'] >= 10 || peak['浪高'] >= 2.5 || peak['流速'] >= 1) return 'INFO';
    }
    return 'WARNING';
};
const normalizeFormalTriggers = (item) => {
    const source = item?.triggerDetail || item?.triggers || item?.metrics;
    if (Array.isArray(source)) return source.map((trigger) => ({ type: formalMetricLabel(trigger.type || trigger.name), value: trigger.value ?? trigger.currentValue ?? '--', unit: trigger.unit || '', threshold: trigger.threshold ?? '--', forecastDate: trigger.forecastDate || trigger.time || '' }));
    const rows = [['风速', readFormalValue(item, ['windSpeed', 'windSpeedMax', 'maxWindSpeed']), 'm/s'], ['浪高', readFormalValue(item, ['waveHeight', 'waveHeightMax', 'maxWaveHeight']), 'm'], ['流速', readFormalValue(item, ['currentSpeed', 'currentSpeedMax', 'maxCurrentSpeed']), 'm/s']];
    const direct = rows.filter(([, value]) => value !== undefined && value !== null && value !== '').map(([type, value, unit]) => ({ type, value, unit, threshold: '--', forecastDate: '' }));
    return direct.length ? direct : deriveFormalTriggers(item);
};
const formatFormalBulletin = (item, triggers = normalizeFormalTriggers(item)) => {
    const regionName = readFormalValue(item, ['regionName', 'regionCode', 'areaName', 'miningArea']) || '--';
    const siteName = readFormalValue(item, ['siteName', 'siteDisplayName', 'mineName']) || '区域范围内';
    const warningMessage = translateWeatherText(readFormalValue(item, ['warningMessage', 'message', 'description', 'summary']) || '后端未返回结构化预警结论。');
    const suggestion = translateWeatherText(readFormalValue(item, ['suggestion', 'recommendation', 'disposalSuggestion', 'advice']) || '请结合现场情况和最新预报安排作业，严重天气下按应急预案处置。');
    const impact = translateWeatherText(readFormalValue(item, ['impactAnalysis', 'impact', 'influence']));
    const issuedAt = readFormalValue(item, ['issuedAt', 'publishTime', 'issueTime', 'createdAt']);
    const validFrom = readFormalValue(item, ['validFrom', 'startTime', 'effectiveTime']);
    const validUntil = readFormalValue(item, ['validUntil', 'endTime', 'expireTime', 'expiryTime']);
    const duration = durationBetween(validFrom, validUntil);
    const lines = ['气象预警结构化报告', '================================', `预警编号：${item.warningCode || item.code || '--'}`, `具体区域：${regionName}`, `具体矿区：${siteName}`, `预警等级：${severityText(formalSeverity(item))}`, `发布时间：${issuedAt ? formatTime(issuedAt) : '--'}`, `预计开始：${validFrom ? formatTime(validFrom) : '--'}`, `预计结束：${validUntil ? formatTime(validUntil) : '--'}`, `预计持续：${duration}`, '', '一、预警结论', `预计在${validFrom ? formatTime(validFrom) : '当前预报时段内'}，${siteName === '区域范围内' ? regionName : `${regionName}的${siteName}`}将出现${triggers.length ? triggers.map((trigger) => `${trigger.type}${trigger.value !== '--' ? `达到${trigger.value}${displayUnit(trigger.unit)}` : '达到预警条件'}`).join('、') : '预警指标达到后端设定条件'}${duration !== '--' ? `，预计持续${duration}` : ''}。`, String(warningMessage), '', '二、触发指标'];
    if (triggers.length) triggers.forEach((trigger) => lines.push(`${trigger.type}：${trigger.value} ${trigger.unit || ''}${trigger.threshold !== '--' ? `，阈值 ${trigger.threshold} ${trigger.unit || ''}` : ''}${trigger.forecastDate ? `，预计时间 ${trigger.forecastDate}` : ''}`));
    else lines.push('后端未返回可结构化展示的触发指标。');
    if (impact) lines.push('', '三、影响分析', String(impact));
    const series = Array.isArray(item.forecastData?.series) ? item.forecastData.series : (Array.isArray(item.forecastSeries) ? item.forecastSeries : []);
    lines.push('', impact ? '四、处置建议' : '三、处置建议', String(suggestion));
    lines.push('', impact ? '五、详细预报数据' : '四、详细预报数据');
    if (series.length) series.forEach((record) => lines.push(`${formatTime(record.forecastTime || record.forecastDate)}：风速 ${record.windSpeedMax ?? record.windSpeedAvg ?? record.windSpeed ?? '--'} 米/秒，浪高 ${record.waveHeightMax ?? record.waveHeightAvg ?? record.waveHeight ?? '--'} 米，流速 ${record.currentSpeedMax ?? record.currentSpeedAvg ?? record.currentSpeed ?? '--'} 米/秒`));
    else lines.push('后端未返回逐时或逐日详细数据。');
    lines.push('', '说明：以上内容由后端正式预警字段整理展示，未改变后端原始判定结果。');
    return lines.join('\n');
};
const normalizeFormal = (item = {}) => {
    const triggers = normalizeFormalTriggers(item);
    const series = formalSeriesOf(item);
    return { ...item, source: '正式预警', sourceType: 'formal', severity: formalSeverity(item), status: String(item.status || 'ACTIVE').toUpperCase(), regionName: item.regionName || item.regionCode || item.areaName || item.region?.regionName || '--', siteName: item.siteName || item.siteDisplayName || item.mineName || item.site?.siteName || '', sourceBase: item.sourceBase || item.baseDate || item.forecastBaseTime || series[0]?.baseDate || '--', warningCode: item.warningCode || item.code || '气象预警', warningMessage: translateWeatherText(item.warningMessage || item.message || item.description || item.summary || '后端未返回预警摘要。'), triggerDetail: triggers, triggerType: item.triggerType ? formalMetricLabel(item.triggerType) : (triggers.map((trigger) => trigger.type).join('、') || '综合指标'), forecastData: item.forecastData || (series.length ? { series } : item.forecastData), bulletinText: formatFormalBulletin(item, triggers) };
};
const normalizePipeline = (item = {}) => {
    const severity = item.warningLevel === '红色' ? 'CRITICAL' : item.warningLevel === '橙色' ? 'WARNING' : 'INFO';
    const triggers = [['风速', item.windSpeed, 'm/s'], ['阵风', item.gust, 'm/s'], ['浪高', item.waveHeight, 'm'], ['流速', item.currentSpeed, 'm/s']].filter(([, value]) => value !== null && value !== undefined && value !== '').map(([type, value, unit]) => ({ type, value: Number(value).toFixed(1), unit, threshold: '--' }));
    return { ...item, id: `pipeline-${item.id}`, source: '管道评估', sourceType: 'pipeline', warningCode: `管道风险 · ${item.miningArea || '当前矿区'}`, regionName: item.miningArea || '管道作业区域', severity, status: item.status === 'active' ? 'ACTIVE' : 'RESOLVED', timeRange: '', triggerType: item.category || '管道安全评估', triggerDetail: triggers, warningMessage: item.message || '管道评估发现作业风险。', bulletinText: `管道风险分析\n作业区域：${item.miningArea || '--'}\n风险等级：${item.warningLevel || '--'}\n预警时间：${item.warningTime || '--'}\n\n风险说明：${item.message || '--'}\n处置建议：${item.suggestion || '--'}\n\n说明：该记录来自前端管道评估模块的本地风险记录。`, createdAt: item.createdAt || item.warningTime || '', sourceBase: item.warningTime || '--', validUntil: '--' };
};

const historyRows = computed(() => history.value.map((record) => ({ ...(record.snapshot || {}), id: record.id, status: 'RESOLVED', resolvedAt: record.resolvedAt, resolveReason: record.resolveReason, versions: record.versions || [], historyRecord: true })));
const filterItems = computed(() => showHistory.value ? historyRows.value : warnings.value);
const filteredWarnings = computed(() => filterItems.value.filter((item) => (!filters.source || item.source === filters.source) && (!filters.range || item.timeRange === filters.range) && (!filters.severity || item.severity === filters.severity) && (!filters.status || item.status === filters.status)));
const displayWarnings = computed(() => filteredWarnings.value);
const stats = computed(() => ({ total: warnings.value.length, active: warnings.value.filter((item) => ['ACTIVE', 'CANDIDATE'].includes(item.status)).length, critical: warnings.value.filter((item) => item.severity === 'CRITICAL').length, candidate: warnings.value.filter((item) => item.source === '预报候选').length }));
const lifecycleEventText = (type) => ({ created: '生成', updated: '更新', resolved: '解除', expired: '过期解除' }[type] || type || '变更');
const formalReport = computed(() => {
    const item = selectedWarning.value || {};
    const triggers = item.triggerDetail || [];
    const series = formalSeriesOf(item);
    const regionName = item.regionName || item.regionCode || item.areaName || item.miningArea || '--';
    const siteName = item.siteName || item.site?.siteName || '';
    const validFrom = readFormalValue(item, ['validFrom', 'startTime', 'effectiveTime', 'forecastTime']) || triggers.find((trigger) => trigger.forecastDate)?.forecastDate || series[0]?.forecastTime || series[0]?.forecastDate || '';
    const validUntil = readFormalValue(item, ['validUntil', 'endTime', 'expireTime', 'expiryTime', 'forecastEndTime']) || series.at(-1)?.forecastTime || series.at(-1)?.forecastDate || '';
    const phenomenon = triggers.length ? triggers.map((trigger) => `${trigger.type}${trigger.value !== '--' ? `达到${trigger.value}${displayUnit(trigger.unit)}` : '达到预警条件'}`).join('、') : '预警指标达到后端设定条件';
    const scope = siteName ? `${regionName}的${siteName}` : regionName;
    const conclusion = `${validFrom ? `预计在${formatTime(validFrom)}，` : '预计在当前预报时段内，'}${scope}将出现${phenomenon}${validUntil ? `，预计持续${durationBetween(validFrom, validUntil)}` : ''}。`;
    const peakSummary = triggers.map((trigger) => `${trigger.type}${trigger.value !== '--' ? `${trigger.value}${displayUnit(trigger.unit)}` : ''}`).join('、');
    const inferredImpact = peakSummary ? `根据后端返回的${peakSummary}，该时段可能影响海上作业安全、设备稳定性和现场人员值守安排。` : '后端未返回可用于细化影响范围的气象指标。';
    const inferredSuggestion = formalSeverity(item) === 'CRITICAL' ? '根据当前后端气象数据，建议暂停高风险海上作业，组织现场值守，并按照应急预案做好避险准备。' : formalSeverity(item) === 'WARNING' ? '根据当前后端气象数据，建议加强现场值守，谨慎安排敏感作业，并持续跟踪下一轮预报。' : '当前指标达到关注条件，建议保持常规值守，合理安排作业窗口并关注后续预报变化。';
    const directImpact = readFormalValue(item, ['impactAnalysis', 'impact', 'influence']);
    const directSuggestion = readFormalValue(item, ['suggestion', 'recommendation', 'disposalSuggestion', 'advice']);
    return { regionName, siteName, scope, validFrom, validUntil, duration: durationBetween(validFrom, validUntil), phenomenon, conclusion, triggers, series, impact: translateWeatherText(directImpact || inferredImpact), suggestion: translateWeatherText(directSuggestion || inferredSuggestion), inferred: !readFormalValue(item, ['validFrom', 'startTime', 'effectiveTime', 'forecastTime', 'validUntil', 'endTime', 'expireTime', 'expiryTime', 'forecastEndTime', 'impactAnalysis', 'impact', 'influence', 'suggestion', 'recommendation', 'disposalSuggestion', 'advice']) };
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
        duration,
        granularity: analysis.dataGranularity || item.sourceGranularity || '逐日'
    };
});
const buoyReport = computed(() => {
    const item = selectedWarning.value || {};
    const row = item.buoy || {};
    const lat = Number(row.lat ?? row.latitude);
    const lng = Number(row.lng ?? row.longitude);
    const location = Number.isFinite(lat) && Number.isFinite(lng) ? `${lat.toFixed(2)}°，${lng.toFixed(2)}°` : '坐标未提供';
    const advice = item.severity === 'CRITICAL'
        ? '建议立即暂停高风险海上作业，核查浮标状态并启动现场避险和值守措施。'
        : item.severity === 'WARNING'
            ? '建议加强现场值守，谨慎安排敏感作业，并持续关注浮标后续更新。'
            : '建议关注实时读数变化，按常规值守要求安排作业。';
    return {
        conclusion: item.warningMessage || '浮标实时读数达到风险阈值。',
        observedAt: item.observedAt ? formatTime(item.observedAt) : '--',
        location,
        advice
    };
});

const isSiteForecastTrend = computed(() => selectedWarning.value?.source === '预报候选' && Boolean(selectedWarning.value?.siteId));
const trendTitle = computed(() => {
    const item = selectedWarning.value;
    if (isSiteForecastTrend.value) return trendMode.value === 'daily' ? '小矿区未来7天预报趋势' : '小矿区风险日逐小时预报';
    return ({ '正式预警': '正式预警趋势', '预报候选': '区域预报风险趋势', '浮标监测': '浮标实时趋势', '管道评估': '管道风险趋势' }[item?.source] || '风险趋势');
});
const trendSubtitle = computed(() => {
    const item = selectedWarning.value;
    if (!item) return '请选择一条预警记录';
    return `${item.regionName || item.miningArea || '--'}${item.siteName ? ` · ${item.siteName}` : ''} · ${item.source || '风险记录'}`;
});
const trendGranularity = computed(() => {
    const item = selectedWarning.value;
    if (!item) return '等待选择';
    if (item.source === '浮标监测') return `最近12小时 · ${trendRecords.value.length}个实测点`;
    if (isSiteForecastTrend.value) return trendMode.value === 'daily' ? `未来7天 · ${trendRecords.value.length}天` : `风险日期 · ${trendRecords.value.length}个时次`;
    if (item.source === '预报候选') return item.analysis?.dataGranularity || item.sourceGranularity || '逐小时';
    if (item.source === '正式预警') return formalSeriesOf(item).length ? '预警时段' : '暂无数据';
    return item.forecastData?.series?.length ? '风险数据' : '暂无数据';
});
const trendEmptyText = computed(() => {
    if (!selectedWarning.value) return '请选择一条预警记录';
    if (selectedWarning.value.source === '浮标监测') return '暂无该浮标最近12小时历史数据';
    if (isSiteForecastTrend.value && trendMode.value === 'daily') return '暂无该小矿区未来7天逐日预报数据';
    if (isSiteForecastTrend.value) return '暂无该小矿区风险日期的逐小时预报数据';
    if (selectedWarning.value.source === '管道评估') return '当前管道风险没有可绘制的趋势数据';
    return '当前记录没有可绘制的趋势数据';
});
const thresholdFor = (type) => {
    const trigger = (selectedWarning.value?.triggerDetail || []).find((item) => item.type === type);
    const value = Number(trigger?.threshold);
    return Number.isFinite(value) ? value : null;
};
const trendMetric = (record, fields) => fields.map((field) => record?.[field]).find((value) => Number.isFinite(Number(value))) ?? null;
const trendTimeValue = (record = {}) => record.forecastTime || record.timestamp || record.observedAt || record.observationTime || record.measureTime || record.recordTime || record.datetime || record.time || record.validTime || record.forecastDate || '';
const trendTimeKey = (record = {}) => {
    const rawTime = String(trendTimeValue(record));
    const rawDate = String(record.forecastDate || record.date || '').trim();
    if (/^\d{1,2}:\d{2}/.test(rawTime) && rawDate) return `${rawDate} ${rawTime.slice(0, 5)}`;
    if (rawDate && !/[T\s]\d{1,2}:?\d{2}/.test(rawTime)) {
        const hourValue = record.forecastHour ?? record.hour ?? record.validHour;
        if (hourValue !== undefined && hourValue !== null && hourValue !== '') {
            const numericHour = Number(hourValue);
            const hour = Number.isFinite(numericHour) ? (numericHour >= 100 ? Math.floor(numericHour / 100) : numericHour) : String(hourValue).split(':')[0];
            return `${rawDate} ${String(hour).padStart(2, '0')}:00`;
        }
    }
    return rawTime || rawDate;
};
const trendRecordsOf = (records = []) => {
    const unique = new Map();
    records.filter(Boolean).forEach((record) => {
        const key = trendTimeKey(record);
        if (key) unique.set(key, record);
    });
    return [...unique.values()].sort((first, second) => trendTimeKey(first).localeCompare(trendTimeKey(second)));
};
const trendAxisLabel = (record = {}) => {
    const rawTime = String(trendTimeValue(record));
    const rawDate = String(record.forecastDate || record.date || '').trim();
    const dateMatch = `${rawTime} ${rawDate}`.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (!dateMatch) {
        const numericTime = Number(rawTime);
        const parsed = Number.isFinite(numericTime) ? new Date(numericTime) : new Date(rawTime);
        if (!Number.isNaN(parsed.getTime())) return `${String(parsed.getMonth() + 1).padStart(2, '0')}月${String(parsed.getDate()).padStart(2, '0')}日 ${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`;
        return '--';
    }
    const dateLabel = `${String(dateMatch[2]).padStart(2, '0')}月${String(dateMatch[3]).padStart(2, '0')}日`;
    const timeMatch = rawTime.match(/(?:T|\s|^)(\d{1,2}):?(\d{2})(?::\d{2})?/);
    const numericHour = Number(record.forecastHour ?? record.hour ?? record.validHour);
    const hour = timeMatch ? Number(timeMatch[1]) : Number.isFinite(numericHour) ? (numericHour >= 100 ? Math.floor(numericHour / 100) : numericHour) : null;
    const minute = timeMatch ? timeMatch[2] : '00';
    if (hour !== null && Number.isFinite(hour)) return `${dateLabel}\n${String(hour).padStart(2, '0')}:${minute}`;
    return dateLabel;
};
const applyTrendMode = () => {
    trendRecords.value = trendRecordsOf(trendMode.value === 'daily' ? trendDailyRecords.value : trendHourlyRecords.value);
};
const setTrendMode = (mode) => {
    if (!isSiteForecastTrend.value) return;
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
const trendRiskBounds = computed(() => {
    const item = selectedWarning.value;
    const records = trendRecords.value;
    if (!item || !records.length || item.source === '浮标监测') return null;
    const startRaw = item.source === '预报候选'
        ? item.analysis?.firstRiskAt || item.triggerDetail?.find((trigger) => trigger.forecastDate)?.forecastDate
        : item.source === '正式预警'
            ? formalReport.value.validFrom || item.validFrom || item.startTime || item.effectiveTime || item.forecastTime
            : item.validFrom || item.startTime || item.effectiveTime || item.forecastTime;
    const endRaw = item.source === '预报候选'
        ? item.analysis?.endAt || item.validUntil
        : item.source === '正式预警'
            ? formalReport.value.validUntil || item.validUntil || item.endTime || item.expireTime || item.expiryTime
            : item.validUntil || item.endTime || item.expireTime || item.expiryTime;
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
    const times = records.map((record) => trendDateValue(trendTimeKey(record)));
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
    return { silent: true, itemStyle: { color: 'rgba(244, 63, 94, .14)', borderColor: 'rgba(251, 113, 133, .75)', borderWidth: 1 }, label: { show: true, color: '#fecdd3', fontSize: 10, formatter: '预计风险窗口', position: 'insideTop' }, data: [[{ xAxis: startAxis }, { xAxis: endAxis }]] };
};
const trendHighlightData = (values) => {
    const bounds = trendRiskBounds.value;
    if (!bounds) return values.map(() => null);
    return values.map((value, index) => index >= bounds.startIndex && index <= bounds.endIndex ? value : null);
};

const loadTrend = async (item) => {
    const requestId = ++trendRequestId;
    trendLoading.value = false;
    trendError.value = '';
    trendDailyRecords.value = [];
    trendHourlyRecords.value = [];
    trendRecords.value = [];
    trendMode.value = 'hourly';
    if (!item) {
        await renderChart();
        return;
    }
    if (item.source === '浮标监测' && item.buoyId) {
        trendLoading.value = true;
        try {
            const data = await fetchBuoyHistory(item.buoyId, '12h');
            if (requestId !== trendRequestId) return;
            const points = Array.isArray(data?.points) ? data.points : Array.isArray(data) ? data : [];
            trendHourlyRecords.value = trendRecordsOf(points);
            trendRecords.value = trendHourlyRecords.value;
        } catch (error) {
            if (requestId !== trendRequestId) return;
            trendError.value = `浮标趋势读取失败：${error.message || '接口暂不可用'}`;
        } finally {
            if (requestId === trendRequestId) trendLoading.value = false;
        }
    } else if (item.source === '预报候选' && item.siteId) {
        let dailyRecords = Array.isArray(item.forecastData?.dailySeries) ? item.forecastData.dailySeries : [];
        let hourlyRecords = Array.isArray(item.forecastData?.hourlySeries)
            ? item.forecastData.hourlySeries
            : item.analysis?.dataGranularity === '逐小时' && Array.isArray(item.forecastData?.series)
                ? item.forecastData.series
                : [];
        try {
            if (!dailyRecords.length) dailyRecords = await fetchMiningOverviewSiteDaily(item.siteId);
            if (!hourlyRecords.length) {
                const riskValue = item.analysis?.firstRiskAt || item.triggerDetail?.find((trigger) => trigger.forecastDate)?.forecastDate || dailyRecords[0]?.forecastDate;
                const dateMatch = String(riskValue || '').match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})/);
                hourlyRecords = await fetchMiningOverviewSiteHourly(item.siteId, dateMatch ? dateMatch[1].replaceAll('/', '-') : undefined);
            }
            if (requestId !== trendRequestId) return;
            trendDailyRecords.value = trendRecordsOf(dailyRecords).slice(0, 7);
            trendHourlyRecords.value = trendRecordsOf(hourlyRecords);
            trendMode.value = trendHourlyRecords.value.length ? 'hourly' : 'daily';
            applyTrendMode();
        } catch (error) {
            if (requestId !== trendRequestId) return;
            trendDailyRecords.value = trendRecordsOf(dailyRecords).slice(0, 7);
            trendHourlyRecords.value = trendRecordsOf(hourlyRecords);
            trendMode.value = trendHourlyRecords.value.length ? 'hourly' : 'daily';
            applyTrendMode();
            if (!trendRecords.value.length) trendError.value = `小矿区趋势读取失败：${error.message || '接口暂不可用'}`;
        }
    } else {
        trendRecords.value = trendRecordsOf(Array.isArray(item.forecastData?.series) ? item.forecastData.series : []);
    }
    await renderChart();
};

const renderChart = async () => {
    await nextTick();
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
            { name: '风速', type: 'line', smooth: true, showSymbol: records.length < 3, data: windData, markLine: trendMarkLine('风速'), markArea: riskArea },
            { name: '浪高', type: 'line', smooth: true, yAxisIndex: 1, showSymbol: records.length < 3, data: waveData, markLine: trendMarkLine('浪高') },
            { name: '流速', type: 'line', smooth: true, showSymbol: records.length < 3, data: currentData, markLine: trendMarkLine('流速') },
            ...highlightSeries
        ]
    }, true);
};

const selectWarning = async (item) => { detailLoading.value = true; try { if (item.sourceType === 'formal') { const detail = await fetchWeatherWarningDetail(item.id); const normalizedDetail = normalizeFormal({ ...item, ...detail }); selectedWarning.value = { ...item, ...normalizedDetail, ...(item.historyRecord ? { status: 'RESOLVED', resolvedAt: item.resolvedAt, resolveReason: item.resolveReason, versions: item.versions } : {}) }; } else selectedWarning.value = item; } catch (error) { errorMessage.value = `正式预警详情加载失败，已显示列表摘要：${error.message}`; selectedWarning.value = item; } finally { detailLoading.value = false; await loadTrend(selectedWarning.value); } };

const notifyLifecycleEvents = (events = []) => {
    events.forEach((event) => {
        const severity = event.item?.severity;
        const type = event.type === 'resolved' || event.type === 'expired' ? 'success' : severity === 'CRITICAL' ? 'error' : severity === 'WARNING' ? 'warning' : 'info';
        const buoyTitle = event.item?.source === '浮标监测';
        const title = event.type === 'created' ? (buoyTitle ? '发现浮标实时风险' : '发现新的预警') : event.type === 'updated' ? (buoyTitle ? '浮标实时风险已更新' : '预警内容已更新') : event.type === 'expired' ? (buoyTitle ? '浮标实时风险已解除' : '预警已自动解除') : (buoyTitle ? '浮标实时风险已解除' : '预警已解除');
        ElNotification({ title, message: event.text, type, duration: 9000, position: 'top-right', customClass: 'ocean-warning-notification', showClose: true });
        window.dispatchEvent(new CustomEvent('warning-lifecycle-event', { detail: event }));
    });
    unreadCount.value += events.length;
};

const loadWarnings = async (force = false) => {
    loading.value = true; errorMessage.value = '';
    const [statsResult, formalResult, candidateResult, buoyResult] = await Promise.allSettled([fetchWeatherWarningStats(), fetchWeatherWarnings({ page: 1, pageSize: 50 }), fetchWarningCandidates({ force }), fetchBuoyWarnings()]);
    formalStats.value = statsResult.status === 'fulfilled' ? statsResult.value || {} : {};
    const formalItems = formalResult.status === 'fulfilled' ? (formalResult.value?.items || formalResult.value?.records || (Array.isArray(formalResult.value) ? formalResult.value : [])).map(normalizeFormal) : [];
    const candidateData = candidateResult.status === 'fulfilled' ? candidateResult.value : { items: [], staleCount: 0 };
    const buoyItems = buoyResult.status === 'fulfilled' ? buoyResult.value : [];
    candidateMeta.staleCount = candidateData.staleCount || 0; candidateMeta.generatedAt = candidateData.generatedAt || '';
    const pipelineItems = typeof localStorage !== 'undefined' ? getPipelineWarnings().map(normalizePipeline) : [];
    const rawItems = [...formalItems, ...(candidateData.items || []), ...buoyItems, ...pipelineItems].filter((item) => !['RESOLVED', 'EXPIRED'].includes(String(item.status || '').toUpperCase()));
    const lifecycleState = typeof localStorage !== 'undefined' ? getWarningLifecycleState() : { active: {}, history: [] };
    const initializeSilently = !Object.keys(lifecycleState.active || {}).length && !(lifecycleState.history || []).length;
    const lifecycle = typeof localStorage !== 'undefined'
        ? reconcileWarningLifecycle(rawItems, { formal: formalResult.status === 'fulfilled', candidate: candidateResult.status === 'fulfilled', buoy: buoyResult.status === 'fulfilled', pipeline: true }, { initializeSilently })
        : { activeItems: rawItems, history: [], events: [] };
    warnings.value = lifecycle.activeItems;
    history.value = lifecycle.history;
    notifyLifecycleEvents(lifecycle.events);
    lastLoadedAt.value = new Date().toISOString();
    if (formalResult.status === 'rejected') errorMessage.value = `正式气象预警接口暂不可用，当前显示预报候选${candidateData.items?.length ? '和管道风险记录' : '；请检查后端接口'}。`;
    if (candidateResult.status === 'rejected') errorMessage.value = `预报候选加载失败：${candidateResult.reason?.message || '当前后端预报接口不可用'}${formalItems.length ? '，已保留正式预警记录。' : ''}`;
    if (buoyResult.status === 'rejected') errorMessage.value = `${errorMessage.value ? `${errorMessage.value} ` : ''}浮标实时风险加载失败：${buoyResult.reason?.message || '当前浮标接口不可用'}。`;
    const current = displayWarnings.value.find((item) => item.id === selectedWarning.value?.id) || displayWarnings.value[0];
    if (current) await selectWarning(current); else { selectedWarning.value = null; trendRecords.value = []; trendError.value = ''; await renderChart(); }
    loading.value = false;
};

const toggleHistory = () => {
    showHistory.value = !showHistory.value;
    const current = displayWarnings.value[0];
    if (current) selectWarning(current);
};
const markNotificationsRead = () => { unreadCount.value = 0; };

const download = async () => {
    if (!selectedWarning.value) return;
    try {
        if (selectedWarning.value.sourceType === 'formal') { await downloadWeatherWarningBulletin(selectedWarning.value.id, selectedWarning.value.warningCode); return; }
        const blob = new Blob([`\uFEFF${selectedWarning.value.bulletinText || selectedWarning.value.warningMessage || ''}\n`], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${selectedWarning.value.source}_${selectedWarning.value.warningCode || '预警分析'}.txt`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) { errorMessage.value = `预警报文下载失败：${error.message}`; }
};

const handleUpdate = () => { if (props.show) loadWarnings(true); };
const resizeChart = () => chart?.resize();
const startRefresh = () => { window.clearInterval(refreshTimer); refreshTimer = window.setInterval(() => { if (props.show) loadWarnings(true); }, 120000); };
watch(() => props.show, (visible) => { if (visible) { loadWarnings(); startRefresh(); } else window.clearInterval(refreshTimer); });
watch(() => [filters.source, filters.range, filters.severity, filters.status, showHistory.value], () => { if (props.show) { const current = displayWarnings.value[0]; if (current && current.id !== selectedWarning.value?.id) selectWarning(current); } });
watch(selectedWarning, renderChart);
onMounted(() => { window.addEventListener('resize', resizeChart); window.addEventListener('weather-warning-updated', handleUpdate); if (props.show) { loadWarnings(); startRefresh(); } });
onBeforeUnmount(() => { chart?.dispose(); window.clearInterval(refreshTimer); window.removeEventListener('resize', resizeChart); window.removeEventListener('weather-warning-updated', handleUpdate); });
</script>
