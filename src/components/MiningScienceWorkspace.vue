<template>
    <transition name="science-fade">
        <div
            v-if="show"
            class="absolute inset-0 z-40 pointer-events-none font-['Noto_Sans_SC']"
        >
            <div class="absolute left-8 right-6 top-36 bottom-6 flex justify-between gap-5">
                <section
                    class="tech-panel-enhanced pointer-events-auto relative flex w-[30rem] shrink-0 min-h-0 flex-col overflow-hidden p-6"
                    style="clip-path: polygon(0 0, 100% 0, 100% 96%, 92% 100%, 0 100%);"
                >
                    <div class="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
                    <div class="corner-decoration corner-tl scale-125"></div>
                    <div class="corner-decoration corner-tr scale-125"></div>

                    <div class="mb-5 flex shrink-0 items-center border-b-2 border-cyan-500/40 pb-3">
                        <div class="mr-3 h-6 w-1.5 bg-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.8)]"></div>
                        <h3 class="min-w-0 flex-1 text-2xl font-bold tracking-wider text-white">矿区科普</h3>
                    </div>

                    <div class="custom-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto pr-2">
                        <section class="science-section">
                            <div class="section-title">地图选点</div>
                            <div class="grid grid-cols-2 gap-2">
                                <button
                                    :class="['science-action-btn', pickingTarget === 'start' ? 'is-active' : '']"
                                    type="button"
                                    @click="pickPoint('start')"
                                >
                                    {{ pickingTarget === 'start' ? '点击地图' : '选船位置' }}
                                </button>
                                <button
                                    :class="['science-action-btn', pickingTarget === 'end' ? 'is-active' : '']"
                                    type="button"
                                    @click="pickPoint('end')"
                                >
                                    {{ pickingTarget === 'end' ? '点击地图' : '选目标点' }}
                                </button>
                            </div>
                            <div class="space-y-2">
                                <div class="science-point">
                                    <span>船位置</span>
                                    <strong>{{ formatPoint(form.startPoint) }}</strong>
                                </div>
                                <div class="science-point">
                                    <span>目标点</span>
                                    <strong>{{ formatPoint(form.endPoint) }}</strong>
                                </div>
                            </div>
                        </section>

                        <section class="science-section">
                            <div class="section-title">船舶状态</div>
                            <div class="grid grid-cols-2 gap-2">
                                <button
                                    v-for="state in loadStates"
                                    :key="state"
                                    :class="['science-toggle-btn', form.vessel.loadState === state ? 'is-active' : '']"
                                    type="button"
                                    @click="form.vessel.loadState = state"
                                >
                                    {{ state }}
                                </button>
                            </div>
                            <div v-if="form.vessel.loadState === '自定义'" class="field-row">
                                <label>载货比例</label>
                                <input v-model.number="form.vessel.customLoadPercent" class="science-input" type="number" min="0" max="120" />
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <div class="field-row">
                                    <label>载重吨</label>
                                    <input v-model.number="form.vessel.deadweightTonnage" class="science-input" type="number" min="0" />
                                </div>
                                <div class="field-row">
                                    <label>总吨</label>
                                    <input v-model.number="form.vessel.grossTonnage" class="science-input" type="number" min="0" />
                                </div>
                                <div class="field-row">
                                    <label>出发航速</label>
                                    <input v-model.number="form.vessel.economySpeedKn" class="science-input" type="number" min="1" step="0.1" />
                                </div>
                                <div class="field-row">
                                    <label>返航航速</label>
                                    <input v-model.number="form.vessel.returnSpeedKn" class="science-input" type="number" min="1" step="0.1" />
                                </div>
                            </div>
                        </section>

                        <section class="science-section">
                            <div class="section-title">海况水深</div>
                            <div class="grid grid-cols-2 gap-2">
                                <div class="field-row">
                                    <label>水深</label>
                                    <input v-model.number="form.operation.waterDepth" class="science-input" type="number" min="0" />
                                </div>
                                <div class="science-row">
                                    <span>当前海况</span>
                                    <strong>{{ assessment.seaStateRule.code }}级</strong>
                                </div>
                                <div class="science-row">
                                    <span>浪高</span>
                                    <strong>{{ formatNumber(form.environment.waveHeight, 1) }} 米</strong>
                                </div>
                                <div class="science-row">
                                    <span>风速</span>
                                    <strong>{{ formatNumber(form.environment.windSpeedMs, 1) }} 米/秒</strong>
                                </div>
                                <div class="science-row">
                                    <span>流速</span>
                                    <strong>{{ formatNumber(form.environment.currentSpeedMs, 1) }} 米/秒</strong>
                                </div>
                                <div class="science-row">
                                    <span>流向</span>
                                    <strong>{{ form.environment.currentDirection }}</strong>
                                </div>
                            </div>
                        </section>

                        <section class="science-section">
                            <button
                                class="science-disclosure-btn"
                                type="button"
                                @click="showAdvanced = !showAdvanced"
                            >
                                <span>参数设置</span>
                                <strong>{{ showAdvanced ? '收起' : '展开' }}</strong>
                            </button>
                            <div v-if="showAdvanced" class="mt-3 space-y-3">
                                <div class="grid grid-cols-2 gap-2">
                                    <div class="field-row">
                                        <label>空船重量</label>
                                        <input v-model.number="form.vessel.lightshipTon" class="science-input" type="number" min="1" />
                                    </div>
                                    <div class="field-row">
                                        <label>设计载荷</label>
                                        <input v-model.number="form.vessel.designLoadPercent" class="science-input" type="number" min="1" max="120" />
                                    </div>
                                    <div class="field-row">
                                        <label>布放基础</label>
                                        <input v-model.number="form.operation.deployBaseHours" class="science-input" type="number" min="0" step="0.5" />
                                    </div>
                                    <div class="field-row">
                                        <label>布放每千米</label>
                                        <input v-model.number="form.operation.deployHoursPer1000m" class="science-input" type="number" min="0" step="0.1" />
                                    </div>
                                    <div class="field-row">
                                        <label>回收基础</label>
                                        <input v-model.number="form.operation.recoverBaseHours" class="science-input" type="number" min="0" step="0.5" />
                                    </div>
                                    <div class="field-row">
                                        <label>回收每千米</label>
                                        <input v-model.number="form.operation.recoverHoursPer1000m" class="science-input" type="number" min="0" step="0.1" />
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </section>

                <section
                    class="tech-panel-enhanced pointer-events-auto relative flex w-[30rem] shrink-0 min-h-0 flex-col overflow-hidden p-6"
                    style="clip-path: polygon(0 0, 92% 0, 100% 7%, 100% 100%, 0 100%);"
                >
                    <div class="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
                    <div class="corner-decoration corner-tl scale-125"></div>
                    <div class="corner-decoration corner-tr scale-125"></div>
                    <button
                        class="floating-panel-close-btn"
                        type="button"
                        title="关闭模块"
                        aria-label="关闭模块"
                        @click="closePanel"
                    >
                        ✕
                    </button>

                    <div class="mb-5 flex shrink-0 items-center border-b-2 border-cyan-500/40 pb-3 pr-12">
                        <div class="mr-3 h-6 w-1.5 bg-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.8)]"></div>
                        <h3 class="min-w-0 flex-1 text-2xl font-bold tracking-wider text-white">航线规划</h3>
                    </div>

                    <div class="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto pr-2">
                        <div :class="['conclusion-card', conclusionTone]">
                            <div class="text-base font-bold text-cyan-100">当前结论</div>
                            <div class="mt-3 text-4xl font-black leading-tight text-white">{{ assessment.conclusion }}</div>
                            <div class="mt-4 flex flex-wrap gap-2">
                                <span
                                    v-for="tag in assessment.dataTags"
                                    :key="tag"
                                    class="source-tag"
                                >
                                    {{ tag }}
                                </span>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <div class="result-card">
                                <span>航线距离</span>
                                <strong>{{ formatNumber(assessment.distances.voyageDistanceNm, 0) }} 海里</strong>
                                <small>{{ formatNumber(toKm(assessment.distances.voyageDistanceNm), 0) }} 公里</small>
                            </div>
                            <div class="result-card">
                                <span>出发</span>
                                <strong>{{ formatDays(assessment.timing.outboundTotalHours) }}</strong>
                                <small>航行加布放</small>
                            </div>
                            <div class="result-card">
                                <span>撤退</span>
                                <strong>{{ formatDays(assessment.timing.retreatTotalHours) }}</strong>
                                <small>回收加返航</small>
                            </div>
                            <div class="result-card">
                                <span>船舶安全</span>
                                <strong>{{ assessment.tonnage.status }}</strong>
                                <small>当前海况 {{ assessment.seaStateRule.code }}级</small>
                            </div>
                        </div>

                        <div class="result-panel">
                            <div class="section-title">判断数据</div>
                            <div class="fact-row">
                                <span>出发/返航</span>
                                <strong>{{ formatNumber(assessment.speed.estimatedSpeed, 1) }} / {{ formatNumber(assessment.speed.returnEstimatedSpeed, 1) }} 节</strong>
                            </div>
                            <div class="fact-row">
                                <span>载货比例</span>
                                <strong>{{ formatNumber(assessment.speed.loadPercent, 0) }}%</strong>
                            </div>
                            <div class="fact-row">
                                <span>海况风级</span>
                                <strong>{{ assessment.seaStateRule.code }}级 / {{ assessment.speed.beaufort.code }}级</strong>
                            </div>
                            <div class="fact-row">
                                <span>吨位要求</span>
                                <strong>{{ formatNumber(assessment.tonnage.matchedRule?.minDeadweightTonnage, 0) }} / {{ formatNumber(assessment.tonnage.matchedRule?.minGrossTonnage, 0) }} 吨</strong>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <div class="result-panel">
                                <div class="section-title">出发</div>
                                <div class="result-line">
                                    <span>航行</span>
                                    <strong>{{ formatHours(assessment.timing.voyageHours) }}</strong>
                                </div>
                                <div class="result-line">
                                    <span>布放</span>
                                    <strong>{{ formatHours(assessment.operation.deployHours) }}</strong>
                                </div>
                                <div class="result-total">
                                    <span>合计</span>
                                    <strong>{{ formatDays(assessment.timing.outboundTotalHours) }}</strong>
                                </div>
                            </div>
                            <div class="result-panel">
                                <div class="section-title">撤退</div>
                                <div class="result-line">
                                    <span>回收</span>
                                    <strong>{{ formatHours(assessment.operation.recoverHours) }}</strong>
                                </div>
                                <div class="result-line">
                                    <span>返航</span>
                                    <strong>{{ formatHours(assessment.timing.returnHours) }}</strong>
                                </div>
                                <div class="result-total">
                                    <span>合计</span>
                                    <strong>{{ formatDays(assessment.timing.retreatTotalHours) }}</strong>
                                </div>
                            </div>
                        </div>

                        <section class="science-section">
                            <button
                                class="science-disclosure-btn"
                                type="button"
                                @click="showRules = !showRules"
                            >
                                <span>吨位规则</span>
                                <strong>{{ showRules ? '收起' : '展开' }}</strong>
                            </button>
                            <div v-if="showRules" class="mt-3 space-y-2">
                                <div class="rule-head">
                                    <span>海况</span>
                                    <span>载重吨</span>
                                    <span>总吨</span>
                                    <span>结论</span>
                                </div>
                                <div
                                    v-for="rule in form.tonnageRules"
                                    :key="rule.seaState"
                                    class="rule-row"
                                >
                                    <div class="rule-code">{{ rule.seaState }}级</div>
                                    <input v-model.number="rule.minDeadweightTonnage" class="science-input compact" type="number" min="0" />
                                    <input v-model.number="rule.minGrossTonnage" class="science-input compact" type="number" min="0" />
                                    <select v-model="rule.conclusion" class="science-input compact">
                                        <option>可作业</option>
                                        <option>谨慎作业</option>
                                        <option>建议等待</option>
                                        <option>不建议作业</option>
                                        <option>停止作业</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        <section class="science-section">
                            <button
                                class="science-disclosure-btn"
                                type="button"
                                @click="showBasis = !showBasis"
                            >
                                <span>规则依据</span>
                                <strong>{{ showBasis ? '收起' : '展开' }}</strong>
                            </button>
                            <div v-if="showBasis" class="mt-3 space-y-2">
                                <div
                                    v-for="source in sourceRows"
                                    :key="source.key"
                                    class="source-row"
                                >
                                    <strong>{{ source.label }}</strong>
                                    <span>{{ source.detail }}</span>
                                </div>
                            </div>
                        </section>
                    </div>
                </section>
            </div>
        </div>
    </transition>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import {
    DEFAULT_MINING_SCIENCE_FORM,
    SCIENCE_RULE_SOURCES,
    buildMiningScienceAssessment,
    deriveSeaStateFromWaveHeight,
    formatCoordinate,
    formatNumber
} from '../utils/miningScienceService.js';

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    metoceanPreset: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['close', 'pickPoint', 'routeChange']);

const form = reactive(JSON.parse(JSON.stringify(DEFAULT_MINING_SCIENCE_FORM)));
const pickingTarget = ref('');
const showAdvanced = ref(false);
const showRules = ref(false);
const showBasis = ref(false);
const loadStates = ['空载', '半载', '满载', '自定义'];
const sourceRows = SCIENCE_RULE_SOURCES;
const lastPresetKey = ref('');

const assessment = computed(() => buildMiningScienceAssessment(form));

watch(
    () => props.metoceanPreset,
    (preset) => {
        const presetKey = String(preset?.sourceKey || '');
        if (!presetKey || presetKey === lastPresetKey.value) {
            return;
        }

        if (Number.isFinite(Number(preset.waterDepth))) {
            form.operation.waterDepth = Number(preset.waterDepth);
        }

        if (Number.isFinite(Number(preset.windSpeedMs))) {
            form.environment.windSpeedMs = Number(preset.windSpeedMs);
        }

        if (Number.isFinite(Number(preset.waveHeight))) {
            form.environment.waveHeight = Number(preset.waveHeight);
            form.environment.seaState = deriveSeaStateFromWaveHeight(preset.waveHeight).code ?? form.environment.seaState;
        }

        if (Number.isFinite(Number(preset.currentSpeedMs))) {
            form.environment.currentSpeedMs = Number(preset.currentSpeedMs);
        }

        lastPresetKey.value = presetKey;
    },
    { immediate: true, deep: true }
);

const conclusionTone = computed(() => {
    if (['停止作业', '不建议作业', '吨位不足'].includes(assessment.value.conclusion)) {
        return 'is-danger';
    }

    if (['等待选点', '数据不足'].includes(assessment.value.conclusion)) {
        return 'is-muted';
    }

    if (['谨慎作业', '建议等待'].includes(assessment.value.conclusion)) {
        return 'is-warning';
    }

    return 'is-ok';
});

const pickPoint = (target) => {
    if (pickingTarget.value === target) {
        pickingTarget.value = '';
        emit('pickPoint', { type: 'cancel' });
        return;
    }

    pickingTarget.value = target;
    emit('pickPoint', {
        type: target === 'start' ? 'miningScienceStart' : 'miningScienceEnd'
    });
};

const hasPoint = (point) => point.lng !== '' && point.lat !== '';

const toRoutePoint = (point) => ({
    lng: Number(point.lng),
    lat: Number(point.lat)
});

const emitRouteChange = () => {
    if (!hasPoint(form.startPoint) || !hasPoint(form.endPoint)) {
        emit('routeChange', {
            action: 'clear',
            timestamp: Date.now()
        });
        return;
    }

    emit('routeChange', {
        action: 'draw',
        route: [
            toRoutePoint(form.startPoint),
            toRoutePoint(form.endPoint)
        ],
        startPort: '船位置',
        endPort: '目标点',
        showArrows: false,
        showLabels: false,
        timestamp: Date.now()
    });
};

const setPickedPoint = (lng, lat, type) => {
    const target = type === 'miningScienceEnd' ? 'endPoint' : 'startPoint';
    form[target].lng = Number(lng).toFixed(6);
    form[target].lat = Number(lat).toFixed(6);
    pickingTarget.value = '';
    emitRouteChange();
};

const closePanel = () => {
    pickingTarget.value = '';
    emit('pickPoint', { type: 'cancel' });
    emit('routeChange', {
        action: 'clear',
        timestamp: Date.now()
    });
    emit('close');
};

const formatPoint = (point) => {
    if (point.lng === '' || point.lat === '') {
        return '--';
    }

    return `${formatCoordinate(point.lat, 'N')} / ${formatCoordinate(point.lng, 'E')}`;
};

const toKm = (nm) => (nm === null || nm === undefined ? null : Number(nm) * 1.852);

const formatHours = (hours) => {
    if (hours === null || hours === undefined || Number.isNaN(Number(hours))) {
        return '--';
    }

    return `${Number(hours).toFixed(1)} 小时`;
};

const formatDays = (hours) => {
    if (hours === null || hours === undefined || Number.isNaN(Number(hours))) {
        return '--';
    }

    return `${(Number(hours) / 24).toFixed(1)} 天`;
};

defineExpose({
    setPickedPoint
});
</script>

<style scoped>
.science-fade-enter-active,
.science-fade-leave-active {
    transition: opacity 0.24s ease;
}

.science-fade-enter-from,
.science-fade-leave-to {
    opacity: 0;
}

.science-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.section-title {
    display: flex;
    align-items: center;
    color: #22d3ee;
    font-size: 17px;
    font-weight: 900;
}

.section-title::before {
    content: '';
    width: 7px;
    height: 7px;
    margin-right: 10px;
    border-radius: 999px;
    background: #22d3ee;
}

.science-row,
.science-point,
.field-row,
.result-card,
.result-panel,
.source-row {
    border: 1px solid rgba(71, 85, 105, 0.55);
    border-radius: 2px;
    background: rgba(15, 23, 42, 0.58);
}

.science-row,
.science-point {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 11px 12px;
}

.science-row span,
.science-point span,
.field-row label,
.result-card span,
.result-line span,
.result-total span,
.fact-row span {
    color: #93c5fd;
    font-size: 15px;
    font-weight: 800;
}

.science-row strong,
.science-point strong {
    min-width: 0;
    color: #fff;
    font-size: 15px;
    font-weight: 900;
    text-align: right;
}

.field-row {
    padding: 10px 11px;
}

.field-row label {
    display: block;
    margin-bottom: 7px;
}

.science-input {
    width: 100%;
    min-width: 0;
    border: 1px solid rgba(71, 85, 105, 0.8);
    border-radius: 2px;
    background: rgba(2, 6, 23, 0.58);
    padding: 8px 10px;
    color: #f8fafc;
    font-size: 16px;
    font-weight: 800;
    outline: none;
}

.science-input:focus {
    border-color: rgba(34, 211, 238, 0.68);
}

.science-input.compact {
    padding: 7px 8px;
    font-size: 14px;
}

.science-action-btn,
.science-toggle-btn,
.science-disclosure-btn {
    min-width: 0;
    border: 1px solid rgba(71, 85, 105, 0.8);
    border-radius: 2px;
    background: rgba(30, 41, 59, 0.52);
    padding: 10px 12px;
    color: #cbd5e1;
    font-size: 16px;
    font-weight: 900;
    transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
}

.science-disclosure-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    text-align: left;
}

.science-disclosure-btn strong {
    color: #facc15;
    font-size: 15px;
}

.science-action-btn:hover,
.science-toggle-btn:hover,
.science-disclosure-btn:hover {
    border-color: rgba(34, 211, 238, 0.58);
    color: #e0faff;
}

.science-action-btn.is-active,
.science-toggle-btn.is-active {
    border-color: rgba(147, 197, 253, 0.8);
    background: linear-gradient(90deg, rgba(37, 99, 235, 0.9), rgba(14, 165, 233, 0.72));
    color: #fff;
    box-shadow: 0 0 12px rgba(37, 99, 235, 0.35);
}

.conclusion-card {
    border: 1px solid rgba(34, 211, 238, 0.35);
    border-radius: 2px;
    background: linear-gradient(135deg, rgba(8, 47, 73, 0.72), rgba(15, 23, 42, 0.78));
    padding: 22px;
}

.conclusion-card.is-ok {
    border-color: rgba(34, 197, 94, 0.5);
}

.conclusion-card.is-danger {
    border-color: rgba(248, 113, 113, 0.64);
    background: linear-gradient(135deg, rgba(127, 29, 29, 0.72), rgba(15, 23, 42, 0.82));
}

.conclusion-card.is-warning {
    border-color: rgba(250, 204, 21, 0.56);
    background: linear-gradient(135deg, rgba(113, 63, 18, 0.68), rgba(15, 23, 42, 0.82));
}

.conclusion-card.is-muted {
    border-color: rgba(100, 116, 139, 0.7);
}

.source-tag {
    border: 1px solid rgba(34, 211, 238, 0.28);
    border-radius: 2px;
    background: rgba(8, 47, 73, 0.48);
    padding: 5px 9px;
    color: #bae6fd;
    font-size: 14px;
    font-weight: 800;
}

.result-card,
.result-panel,
.source-row {
    padding: 13px;
}

.result-card {
    min-height: 112px;
}

.result-card strong {
    display: block;
    margin-top: 9px;
    color: #fff;
    font-size: 23px;
    font-weight: 900;
    line-height: 1.15;
}

.result-card small,
.source-row span {
    display: block;
    margin-top: 7px;
    color: #94a3b8;
    font-size: 14px;
    font-weight: 700;
}

.result-line,
.result-total,
.fact-row {
    margin-top: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border-top: 1px solid rgba(71, 85, 105, 0.45);
    padding-top: 10px;
}

.fact-row:first-of-type {
    margin-top: 12px;
}

.result-line strong,
.result-total strong,
.fact-row strong {
    color: #fff;
    font-size: 15px;
    font-weight: 900;
    text-align: right;
}

.result-total strong {
    color: #facc15;
    font-size: 20px;
}

.rule-head,
.rule-row {
    display: grid;
    grid-template-columns: 3.5rem 1fr 1fr 5.5rem;
    gap: 8px;
}

.rule-head {
    color: #94a3b8;
    font-size: 14px;
    font-weight: 800;
}

.rule-code {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(34, 211, 238, 0.2);
    border-radius: 2px;
    background: rgba(8, 47, 73, 0.32);
    color: #bfdbfe;
    font-size: 14px;
    font-weight: 900;
}

.source-row strong {
    color: #fff;
    font-size: 15px;
    font-weight: 900;
}

.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.35);
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(34, 211, 238, 0.4);
    border-radius: 999px;
}
</style>
