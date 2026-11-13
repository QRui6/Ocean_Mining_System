<template>
    <div class="pipe-pane">
        <div v-if="pane === 'left'" class="pipe-scroll custom-scrollbar">
            <section class="pipe-section">
                <div class="mb-3 flex items-center justify-between">
                    <div class="pipe-section-title">{{ editorForm.id ? '编辑阈值' : '新增阈值' }}</div>
                    <button class="pipe-btn secondary px-3" type="button" @click="openEditor()">清空</button>
                </div>

                <div class="space-y-3">
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <div class="pipe-label">水深(m)</div>
                            <input v-model.number="editorForm.waterDepth" class="pipe-input" type="number" min="1000" step="100" />
                        </div>
                        <div>
                            <div class="pipe-label">海况</div>
                            <input v-model.number="editorForm.seaState" class="pipe-input" type="number" min="1" max="9" />
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <div class="pipe-label">表层流速</div>
                            <input v-model.number="editorForm.surfaceCurrent" class="pipe-input" type="number" min="0" step="0.1" />
                        </div>
                        <div>
                            <div class="pipe-label">底层流速</div>
                            <input v-model.number="editorForm.bottomCurrent" class="pipe-input" type="number" min="0" step="0.01" />
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <div class="pipe-label">管道尺寸</div>
                            <select v-model="editorForm.pipeSize" class="pipe-select" @change="applyPipeSize(editorForm.pipeSize)">
                                <option v-for="pipe in pipeOptions" :key="pipe.pipeSize" :value="pipe.pipeSize">{{ pipe.pipeSize }}</option>
                            </select>
                        </div>
                        <div>
                            <div class="pipe-label">顶端约束</div>
                            <select v-model="editorForm.topConstraint" class="pipe-select">
                                <option value="固定">固定</option>
                                <option value="方向节释放8°">方向节释放8°</option>
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <div class="pipe-label">材料</div>
                            <select v-model="editorForm.material" class="pipe-select" @change="applyMaterial(editorForm.material)">
                                <option value="X80">X80</option>
                                <option value="X110">X110</option>
                            </select>
                        </div>
                        <div>
                            <div class="pipe-label">安全系数</div>
                            <input v-model.number="editorForm.safetyFactor" class="pipe-input" type="number" min="0.1" max="1" step="0.05" />
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <div class="pipe-label">顶端张力(kN)</div>
                            <input v-model.number="editorForm.topTension" class="pipe-input" type="number" min="0" />
                        </div>
                        <div>
                            <div class="pipe-label">顶端弯矩(kN.m)</div>
                            <input v-model.number="editorForm.topBendingMoment" class="pipe-input" type="number" min="0" />
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <div class="pipe-label">综合应力(MPa)</div>
                            <input v-model.number="editorForm.topEquivalentStress" class="pipe-input" type="number" min="0" />
                        </div>
                        <div>
                            <div class="pipe-label">屈服强度(MPa)</div>
                            <input v-model.number="editorForm.yieldStrength" class="pipe-input" type="number" min="1" />
                        </div>
                    </div>
                    <div>
                        <div class="pipe-label">备注</div>
                        <input v-model="editorForm.remark" class="pipe-input" />
                    </div>
                    <button class="pipe-btn w-full" type="button" @click="saveThreshold">保存阈值</button>
                </div>
            </section>
        </div>

        <div v-else class="flex h-full min-h-0 flex-col">
            <div class="mb-3 shrink-0">
                <div class="mb-2 flex items-center justify-between">
                    <div class="pipe-section-title">安全阈值库</div>
                    <button class="pipe-btn secondary px-3" type="button" @click="resetThresholds">恢复默认</button>
                </div>
                <div class="grid grid-cols-3 gap-2">
                    <input v-model="filters.waterDepth" class="pipe-input" placeholder="水深" />
                    <select v-model="filters.pipeSize" class="pipe-select">
                        <option value="">管径</option>
                        <option v-for="pipe in pipeOptions" :key="pipe.pipeSize" :value="pipe.pipeSize">{{ pipe.pipeSize }}</option>
                    </select>
                    <select v-model="filters.riskLevel" class="pipe-select">
                        <option value="">风险</option>
                        <option v-for="level in riskLevels" :key="level" :value="level">{{ level }}</option>
                    </select>
                </div>
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
                <table class="pipe-table">
                    <thead>
                        <tr>
                            <th>水深</th>
                            <th>海况</th>
                            <th>管径</th>
                            <th>约束</th>
                            <th>综合应力</th>
                            <th>风险</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in filteredThresholds" :key="row.id">
                            <td>{{ row.waterDepth }}</td>
                            <td>{{ row.seaState }}级</td>
                            <td>{{ row.pipeSize }}</td>
                            <td>{{ row.topConstraint }}</td>
                            <td>{{ row.topEquivalentStress }}</td>
                            <td><span :class="['pipe-risk-tag', riskClass(row.riskLevel)]">{{ row.riskLevel }}</span></td>
                            <td class="whitespace-nowrap">
                                <button class="pipe-link" type="button" @click="$emit('edit-threshold', clone(row))">编辑</button>
                                <button class="pipe-link danger" type="button" @click="deleteThreshold(row)">删除</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { MATERIAL_STRENGTHS, PIPELINE_THRESHOLD_DATA, PIPE_SIZE_OPTIONS } from '../../data/pipelineThresholdData.js';
import { RISK_LEVELS } from '../../data/marineForecastMockData.js';
import { calculateAllowableStress, judgeRiskLevel } from '../../utils/pipelineRiskService.js';
import { getThresholdList, saveThresholdList } from '../../utils/pipelineStorage.js';

const props = defineProps({
    pane: { type: String, default: 'left' },
    refreshKey: { type: Number, default: 0 },
    thresholdEditPayload: { type: Object, default: null }
});

const emit = defineEmits(['data-change', 'edit-threshold']);

const pipeOptions = PIPE_SIZE_OPTIONS;
const riskLevels = RISK_LEVELS;
const thresholdList = ref([]);
const filters = reactive({ waterDepth: '', pipeSize: '', riskLevel: '' });
const editorForm = reactive({});
const clone = (value) => JSON.parse(JSON.stringify(value));

const defaultDraft = () => ({
    id: null,
    waterDepth: 5200,
    seaState: 3,
    surfaceCurrent: 0.8,
    bottomCurrent: 0.1,
    pipeSize: '10 3/4',
    ...PIPE_SIZE_OPTIONS[0],
    topConstraint: '固定',
    topTension: 0,
    topBendingMoment: 0,
    topEquivalentStress: 0,
    material: 'X80',
    yieldStrength: 580,
    safetyFactor: 0.9,
    remark: ''
});

const filteredThresholds = computed(() => thresholdList.value.filter((item) => (
    (!filters.waterDepth || String(item.waterDepth).includes(String(filters.waterDepth)))
    && (!filters.pipeSize || item.pipeSize === filters.pipeSize)
    && (!filters.riskLevel || item.riskLevel === filters.riskLevel)
)));

const assignEditor = (value) => {
    Object.keys(editorForm).forEach((key) => delete editorForm[key]);
    Object.assign(editorForm, clone(value));
};

const load = () => {
    thresholdList.value = getThresholdList();
    if (props.pane === 'left' && !Object.keys(editorForm).length) {
        assignEditor(defaultDraft());
    }
};

const openEditor = (row = null) => assignEditor(row || defaultDraft());

const applyPipeSize = (pipeSize) => {
    const pipe = PIPE_SIZE_OPTIONS.find((item) => item.pipeSize === pipeSize);
    if (pipe) Object.assign(editorForm, pipe);
};

const applyMaterial = (material) => {
    editorForm.yieldStrength = MATERIAL_STRENGTHS[material] || editorForm.yieldStrength;
};

const saveThreshold = () => {
    const list = [...thresholdList.value];
    const id = editorForm.id || Math.max(0, ...list.map((item) => Number(item.id) || 0)) + 1;
    const allowableStress = calculateAllowableStress(editorForm.yieldStrength, editorForm.safetyFactor);
    const judged = judgeRiskLevel(editorForm.topEquivalentStress, editorForm.yieldStrength, editorForm.safetyFactor);
    const payload = {
        ...clone(editorForm),
        id,
        allowableStress,
        riskLevel: judged.riskLevel,
        operationAdvice: judged.suggestion
    };
    const nextList = list.some((item) => item.id === id)
        ? list.map((item) => (item.id === id ? payload : item))
        : [...list, payload];

    saveThresholdList(nextList);
    thresholdList.value = nextList;
    assignEditor(payload);
    emit('data-change');
    ElMessage.success('阈值已保存');
};

const deleteThreshold = async (row) => {
    try {
        await ElMessageBox.confirm('确认删除该阈值？', '删除确认', { type: 'warning' });
    } catch {
        return;
    }

    const nextList = thresholdList.value.filter((item) => item.id !== row.id);
    saveThresholdList(nextList);
    thresholdList.value = nextList;
    emit('data-change');
    ElMessage.success('阈值已删除');
};

const resetThresholds = async () => {
    try {
        await ElMessageBox.confirm('确认恢复默认阈值库？', '恢复默认阈值', { type: 'warning' });
    } catch {
        return;
    }

    thresholdList.value = clone(PIPELINE_THRESHOLD_DATA);
    saveThresholdList(thresholdList.value);
    emit('data-change');
    ElMessage.success('阈值库已恢复');
};

const riskClass = (level) => ({
    绿色: 'pipe-risk-green',
    黄色: 'pipe-risk-yellow',
    橙色: 'pipe-risk-orange',
    红色: 'pipe-risk-red'
}[level] || 'pipe-risk-green');

watch(() => props.refreshKey, load);
watch(
    () => props.thresholdEditPayload,
    (payload) => {
        if (props.pane === 'left' && payload) assignEditor(payload);
    },
    { deep: true }
);

load();
</script>
