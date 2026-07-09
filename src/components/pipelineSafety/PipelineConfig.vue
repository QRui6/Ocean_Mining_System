<template>
    <div class="pipe-pane">
        <div v-if="pane === 'left'" class="pipe-scroll custom-scrollbar space-y-3">
            <section class="pipe-section">
                <div class="mb-3 flex items-center justify-between">
                    <div class="pipe-section-title">{{ form.id ? '编辑配置' : '新增配置' }}</div>
                    <button class="pipe-btn secondary px-3" type="button" @click="createConfig">清空</button>
                </div>

                <div class="space-y-3">
                    <div>
                        <div class="pipe-label">项目名称</div>
                        <input v-model="form.projectName" class="pipe-input" />
                    </div>
                    <div>
                        <div class="pipe-label">矿区名称</div>
                        <input v-model="form.miningArea" class="pipe-input" />
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <div class="pipe-label">水深(m)</div>
                            <input v-model.number="form.waterDepth" class="pipe-input" type="number" min="1000" step="100" />
                        </div>
                        <div>
                            <div class="pipe-label">管道尺寸</div>
                            <select v-model="form.pipeSize" class="pipe-select">
                                <option v-for="pipe in pipeOptions" :key="pipe.pipeSize" :value="pipe.pipeSize">{{ pipe.pipeSize }}</option>
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <div class="pipe-label">材料</div>
                            <select v-model="form.material" class="pipe-select" @change="handleMaterialChange(form.material)">
                                <option value="X80">X80</option>
                                <option value="X110">X110</option>
                            </select>
                        </div>
                        <div>
                            <div class="pipe-label">屈服强度(MPa)</div>
                            <input v-model.number="form.yieldStrength" class="pipe-input" type="number" min="1" />
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <div class="pipe-label">安全系数</div>
                            <input v-model.number="form.safetyFactor" class="pipe-input" type="number" min="0.1" max="1" step="0.05" />
                        </div>
                        <div>
                            <div class="pipe-label">顶端约束</div>
                            <select v-model="form.topConstraint" class="pipe-select">
                                <option value="固定">固定</option>
                                <option value="方向节释放8°">方向节释放8°</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <div class="pipe-label">当前作业类型</div>
                        <select v-model="form.operationType" class="pipe-select">
                            <option value="布放">布放</option>
                            <option value="采矿">采矿</option>
                            <option value="回收">回收</option>
                            <option value="撤离">撤离</option>
                        </select>
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <div>
                            <div class="pipe-label">布放(h)</div>
                            <input v-model.number="form.deployDurationHours" class="pipe-input" type="number" min="1" />
                        </div>
                        <div>
                            <div class="pipe-label">回收(h)</div>
                            <input v-model.number="form.recoverDurationHours" class="pipe-input" type="number" min="1" />
                        </div>
                        <div>
                            <div class="pipe-label">缓冲(h)</div>
                            <input v-model.number="form.evacuationBufferHours" class="pipe-input" type="number" min="1" />
                        </div>
                    </div>
                    <label class="flex items-center gap-2 text-sm font-bold text-slate-300">
                        <input v-model="form.enabled" type="checkbox" />
                        启用该配置
                    </label>
                    <button class="pipe-btn w-full" type="button" @click="saveConfig">保存配置</button>
                </div>
            </section>
        </div>

        <div v-else class="flex h-full min-h-0 flex-col">
            <div class="mb-3 flex shrink-0 items-center justify-between">
                <div class="pipe-section-title">配置列表</div>
                <div class="flex gap-2">
                    <button class="pipe-btn px-3" type="button" @click="$emit('edit-config', createDraft())">新增配置</button>
                    <button class="pipe-btn secondary px-3" type="button" @click="handleReset">恢复默认</button>
                </div>
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
                <table class="pipe-table">
                    <thead>
                        <tr>
                            <th>项目</th>
                            <th>矿区</th>
                            <th>水深</th>
                            <th>管径</th>
                            <th>作业</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in configList" :key="row.id">
                            <td>{{ row.projectName }}</td>
                            <td>{{ row.miningArea }}</td>
                            <td>{{ row.waterDepth }}</td>
                            <td>{{ row.pipeSize }}</td>
                            <td>{{ row.operationType }}</td>
                            <td><span :class="['state-tag', row.enabled ? 'enabled' : '']">{{ row.enabled ? '启用' : '备用' }}</span></td>
                            <td class="whitespace-nowrap">
                                <button class="pipe-link" type="button" @click="$emit('edit-config', clone(row))">编辑</button>
                                <button class="pipe-link" type="button" @click="enableConfig(row)">启用</button>
                                <button class="pipe-link danger" type="button" @click="deleteConfig(row)">删除</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { DEFAULT_PIPELINE_CONFIGS, MATERIAL_STRENGTHS, PIPE_SIZE_OPTIONS } from '../../data/pipelineThresholdData.js';
import {
    getConfigList,
    initializePipelineData,
    resetPipelineData,
    saveConfigList
} from '../../utils/pipelineStorage.js';

const props = defineProps({
    pane: { type: String, default: 'left' },
    refreshKey: { type: Number, default: 0 },
    configEditPayload: { type: Object, default: null }
});

const emit = defineEmits(['data-change', 'edit-config']);

const pipeOptions = PIPE_SIZE_OPTIONS;
const configList = ref([]);
const form = reactive({});

const clone = (value) => JSON.parse(JSON.stringify(value));
const createDraft = () => ({ ...DEFAULT_PIPELINE_CONFIGS[0], id: null, enabled: false });

const assignForm = (value) => {
    Object.keys(form).forEach((key) => delete form[key]);
    Object.assign(form, clone(value));
};

const load = () => {
    configList.value = getConfigList();
    if (props.pane === 'left' && !Object.keys(form).length) {
        assignForm(configList.value.find((item) => item.enabled) || configList.value[0] || DEFAULT_PIPELINE_CONFIGS[0]);
    }
};

const createConfig = () => assignForm(createDraft());

const handleMaterialChange = (material) => {
    form.yieldStrength = MATERIAL_STRENGTHS[material] || form.yieldStrength;
};

const saveConfig = () => {
    const list = [...configList.value];
    const nextId = form.id || Math.max(0, ...list.map((item) => Number(item.id) || 0)) + 1;
    const payload = {
        ...clone(form),
        id: nextId,
        yieldStrength: MATERIAL_STRENGTHS[form.material] || form.yieldStrength
    };
    const nextList = list.some((item) => item.id === nextId)
        ? list.map((item) => (item.id === nextId ? payload : item))
        : [...list, payload];

    if (payload.enabled) {
        nextList.forEach((item) => {
            item.enabled = item.id === nextId;
        });
    }

    if (!nextList.some((item) => item.enabled) && nextList.length) {
        nextList[0].enabled = true;
    }

    saveConfigList(nextList);
    assignForm(payload);
    load();
    emit('data-change');
    ElMessage.success('配置已保存');
};

const enableConfig = (row) => {
    const nextList = configList.value.map((item) => ({ ...item, enabled: item.id === row.id }));
    saveConfigList(nextList);
    load();
    emit('data-change');
    ElMessage.success('已切换当前配置');
};

const deleteConfig = async (row) => {
    if (configList.value.length <= 1) {
        ElMessage.warning('至少保留一条配置');
        return;
    }

    try {
        await ElMessageBox.confirm('确认删除该配置？', '删除确认', { type: 'warning' });
    } catch {
        return;
    }

    const nextList = configList.value.filter((item) => item.id !== row.id);
    if (!nextList.some((item) => item.enabled) && nextList.length) {
        nextList[0].enabled = true;
    }
    saveConfigList(nextList);
    load();
    emit('data-change');
    ElMessage.success('配置已删除');
};

const handleReset = async () => {
    try {
        await ElMessageBox.confirm('将清空本模块本地数据并恢复默认值，是否继续？', '恢复默认数据', { type: 'warning' });
    } catch {
        return;
    }

    resetPipelineData();
    initializePipelineData();
    load();
    emit('data-change');
    ElMessage.success('已恢复默认数据');
};

watch(() => props.refreshKey, load);
watch(
    () => props.configEditPayload,
    (payload) => {
        if (props.pane === 'left' && payload) assignForm(payload);
    },
    { deep: true }
);

load();
</script>

<style scoped>
.state-tag {
    border: 1px solid rgba(148, 163, 184, 0.26);
    padding: 0.1rem 0.35rem;
    color: #cbd5e1;
    font-size: 0.72rem;
}

.state-tag.enabled {
    border-color: rgba(74, 222, 128, 0.38);
    color: #86efac;
}
</style>
