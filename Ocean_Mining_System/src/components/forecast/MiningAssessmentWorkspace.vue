<template>
  <section style="position:absolute" class="mining-assessment-panel tech-panel-enhanced pointer-events-auto absolute right-6 top-36 z-50 flex w-[30rem] flex-col overflow-hidden p-4 font-['Noto_Sans_SC']">
    <header class="flex shrink-0 items-center justify-between border-b border-cyan-500/30 pb-3">
      <h3 class="text-xl font-bold text-white">矿区评估</h3>
      <button class="floating-panel-close-btn floating-panel-close-btn--inline" title="关闭矿区评估" @click="$emit('close')">✕</button>
    </header>
    <div class="shrink-0 py-3">
      <PanelSelect v-model="areaId" label="评估矿区" :options="areaOptions" overlay :max-height="240" />
      <div class="mt-3 flex items-center gap-3 text-sm">
        <button type="button" :disabled="busy || !areaId" class="assessment-button" @click="start">更新评估</button>
        <button type="button" :aria-pressed="events !== null" class="assessment-button" @click="toggleEvents">预警记录</button>
        <span v-if="run" role="status" class="ml-auto text-xs text-cyan-100">{{ statusText }}<template v-if="['QUEUED','RUNNING'].includes(run.status)"> {{ run.progress || 0 }}%</template></span>
      </div>
    </div>
    <div v-if="error" role="alert" class="mb-3 shrink-0 text-sm text-rose-200">{{ error }}</div>
    <div class="custom-scrollbar min-h-0 overflow-y-auto">
      <template v-if="result">
        <div class="mb-3 flex items-center justify-between text-sm"><span>采样点 {{ result.points.length }} · 间距 {{ result.spacingKm }} km</span><span v-if="run?.status !== 'COMPLETED'" class="text-xs text-slate-400">上次结果</span></div>
        <div class="grid grid-cols-[1fr_2fr] gap-2">
          <PanelSelect v-model="metric" label="评估指标" :options="metricOptions" overlay :max-height="240" />
          <PanelSelect v-model="frame" label="预报时次" :options="frameOptions" overlay :max-height="240" />
        </div>
        <div class="my-3 flex flex-wrap gap-x-3 gap-y-1 text-xs"><span>阈值 {{ rule?.warning }} {{ rule?.unit }}</span><span>超限 {{ selectedFrame?.exceeded ?? 0 }}</span><span v-if="expired" class="text-amber-200">数据已过期</span></div>
        <div class="custom-scrollbar max-h-72 overflow-auto">
          <table class="w-full text-sm"><thead class="sticky top-0 bg-[#091726]"><tr><th class="py-2">点位</th><th>经度</th><th>纬度</th><th>{{ rule?.unit }}</th></tr></thead>
            <tbody><tr v-for="point in pagePoints" :key="point.index" class="cursor-pointer border-t border-slate-700" @click="locate(point)"><td class="py-2 text-center">{{ point.index + 1 }}</td><td>{{ point.lon.toFixed(4) }}</td><td>{{ point.lat.toFixed(4) }}</td><td :class="point.value != null && point.value >= rule?.warning ? 'text-rose-300' : ''">{{ point.value == null ? '--' : point.value.toFixed(2) }}</td></tr></tbody>
          </table>
        </div>
        <div class="my-3 flex items-center justify-between text-sm"><button type="button" :disabled="page === 0" class="assessment-button" @click="page--">上一页</button><span>{{ page + 1 }} / {{ pages }}</span><button type="button" :disabled="page + 1 >= pages" class="assessment-button" @click="page++">下一页</button></div>
      </template>
      <div v-else-if="!busy && !loadingArea" class="py-3 text-sm text-slate-400">尚无评估结果</div>
      <div v-if="loadingArea" class="py-3 text-sm text-slate-400">读取评估结果...</div>
      <div v-if="events !== null" class="mt-3 border-t border-cyan-500/30 pt-3 text-sm">
        <div v-if="!events.length" class="text-slate-400">暂无预警</div>
        <button v-for="event in events" :key="event.id" type="button" class="mb-2 block w-full border border-slate-700 p-2 text-left" @click="selectEvent(event)">{{ labels[event.metric] }} · {{ event.status === 'ACTIVE' ? '生效' : '解除' }} · {{ event.snapshot.value?.toFixed(2) }}</button>
        <div v-if="selectedEvent" class="my-2 space-y-1">
          <div v-if="selectedEvent.snapshot.point">经度 {{ selectedEvent.snapshot.point.lon.toFixed(4) }}° · 纬度 {{ selectedEvent.snapshot.point.lat.toFixed(4) }}°</div>
          <div v-if="selectedEvent.snapshot.start">{{ selectedEvent.snapshot.start }} 至 {{ selectedEvent.snapshot.end }}</div>
          <div v-if="selectedEvent.snapshot.durationHours != null">持续 {{ selectedEvent.snapshot.durationHours }} h · {{ selectedEvent.severity === 'CRITICAL' ? '严重' : '预警' }}</div>
          <div v-if="selectedEvent.status === 'ACTIVE'">{{ selectedEvent.severity === 'CRITICAL' ? '暂停高风险作业，核查现场条件。' : '加强值守，跟踪预报更新。' }}</div>
          <button v-if="selectedEvent.status === 'ACTIVE'" type="button" class="assessment-button" @click="acknowledge">确认预警</button>
        </div>
        <div v-for="(version, index) in versions" :key="index" class="py-1">{{ version.created_at }} · {{ { CREATED: '创建', UPDATED: '更新', ACKNOWLEDGED: '人工确认', RESOLVED: '解除' }[version.action] }}</div>
      </div>
    </div>
  </section>
</template>
<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import * as C from 'cesium';
import PanelSelect from '../common/PanelSelect.vue';
import { monitoringRequest as request } from '../../api/monitoring.js';
import { fetchForecastTargets } from '../../api/forecastWarningBuoy.js';
const props = defineProps({ getViewer: Function, mineId: String });
const emit = defineEmits(['close', 'select-target']);
const areas = ref([]), areaId = ref(''), run = ref(null), previousResult = ref(null), error = ref(''), metric = ref('wind'), frame = ref(0), page = ref(0), events = ref(null), versions = ref([]), selectedEvent = ref(null), loadingArea = ref(false);
const labels = { wind: '风速', wave: '浪高', ocean_current: '流速' };
const areaOptions = computed(() => areas.value.map(area => ({ value: area.id, label: area.name })));
const metricOptions = Object.entries(labels).map(([value, label]) => ({ value, label }));
const result = computed(() => run.value?.result || previousResult.value);
const dataset = computed(() => result.value?.datasets[metric.value] || { frames: [] });
const rule = computed(() => result.value?.rules[metric.value]);
const frameOptions = computed(() => dataset.value.frames.map((item, index) => ({ value: index, label: item.time.replace('T', ' ').replace('Z', ' UTC') })));
const selectedFrame = computed(() => dataset.value.frames[frame.value]);
const expired = computed(() => !selectedFrame.value || new Date(selectedFrame.value.time) < new Date());
const busy = computed(() => ['SUBMITTING', 'QUEUED', 'RUNNING'].includes(run.value?.status));
const statusText = computed(() => ({ SUBMITTING: '读取结果', QUEUED: '排队中', RUNNING: '评估中', COMPLETED: '已完成', FAILED: '失败', UNKNOWN: '状态读取失败' }[run.value?.status] || ''));
const pages = computed(() => Math.max(1, Math.ceil((result.value?.points.length || 0) / 30)));
const pagePoints = computed(() => (result.value?.points || []).slice(page.value * 30, page.value * 30 + 30).map((point, i) => ({ ...point, index: page.value * 30 + i, value: selectedFrame.value?.values[page.value * 30 + i] })));
let timer, entities = [], disposed = false, requestId = 0;
function clear() {
  const viewer = props.getViewer?.();
  if (viewer && !viewer.isDestroyed()) entities.forEach(entity => viewer.entities.remove(entity));
  entities = [];
}
function draw() {
  clear(); const viewer = props.getViewer?.();
  if (!viewer || !result.value) return;
  result.value.points.forEach((point, index) => {
    const value = selectedFrame.value?.values[index];
    const color = value == null ? C.Color.GRAY : rule.value?.critical != null && value >= rule.value.critical ? C.Color.RED : value >= rule.value?.warning ? C.Color.ORANGE : C.Color.CYAN;
    entities.push(viewer.entities.add({ position: C.Cartesian3.fromDegrees(point.lon, point.lat, 20), point: { pixelSize: 6, color, disableDepthTestDistance: Infinity }, name: `点位 ${index + 1}` }));
  });
  viewer.scene.requestRender();
}
function locate(point) { props.getViewer?.()?.camera.flyTo({ destination: C.Cartesian3.fromDegrees(point.lon, point.lat, 200000) }); }
async function loadEvents() {
  const area = areaId.value;
  try { const data = await request(`/api/mining-risk/events?areaId=${encodeURIComponent(area)}`); if (!disposed && area === areaId.value) events.value = data; }
  catch (e) { if (!disposed && area === areaId.value) error.value = e.message; }
}
function toggleEvents() { if (events.value !== null) { events.value = null; selectedEvent.value = null; versions.value = []; } else loadEvents(); }
async function poll(id, token) {
  try {
    const data = await request(`/api/mining-risk/runs/${id}`);
    if (disposed || token !== requestId) return;
    run.value = data;
    if (data.result) { previousResult.value = data.result; frame.value = Math.min(frame.value, Math.max(0, dataset.value.frames.length - 1)); }
    if (data.status === 'FAILED') error.value = data.error || '评估失败';
    else if (data.status === 'COMPLETED') { if (events.value !== null) await loadEvents(); }
    else timer = setTimeout(() => poll(id, token), 1500);
  } catch (e) { if (!disposed && token === requestId) { error.value = e.message; run.value = { ...run.value, status: 'UNKNOWN' }; } }
}
async function start() {
  error.value = ''; clearTimeout(timer); const token = ++requestId, oldRun = run.value;
  if (run.value?.result) previousResult.value = run.value.result;
  run.value = { status: 'SUBMITTING' };
  try {
    const data = await request(`/api/mining-risk/areas/${encodeURIComponent(areaId.value)}/runs`, { method: 'POST' });
    if (!disposed && token === requestId) await poll(data.id, token);
  } catch (e) { if (!disposed && token === requestId) { error.value = e.message; run.value = oldRun; } }
}
async function selectEvent(event) {
  selectedEvent.value = event; versions.value = [];
  try { const data = await request(`/api/mining-risk/events/${event.id}/versions`); if (!disposed && selectedEvent.value?.id === event.id) versions.value = data; }
  catch (e) { if (!disposed) error.value = e.message; }
}
async function acknowledge() {
  const id = selectedEvent.value?.id; if (!id) return;
  try { const data = await request(`/api/mining-risk/events/${id}/acknowledgement`, { method: 'POST' }); if (!disposed && selectedEvent.value?.id === id) versions.value = data; }
  catch (e) { if (!disposed) error.value = e.message; }
}
watch(areaId, async () => {
  clearTimeout(timer); clear(); error.value = ''; selectedEvent.value = null; run.value = null; previousResult.value = null; events.value = null; versions.value = []; page.value = 0; frame.value = 0;
  const token = ++requestId; loadingArea.value = true;
    const target = areas.value.find(area => area.id === areaId.value);
    if (target) emit('select-target', target);
  try {
    const latest = await request(`/api/mining-risk/areas/${encodeURIComponent(areaId.value)}/latest`);
    if (!disposed && token === requestId && latest.id) { run.value = latest; if (latest.result) previousResult.value = latest.result; if (['QUEUED', 'RUNNING'].includes(latest.status)) poll(latest.id, token); }
  } catch (e) { if (!disposed && token === requestId) error.value = e.message; }
  finally { if (token === requestId) loadingArea.value = false; }
});
watch(() => props.mineId, id => {
  if (areas.value.some(area => area.id === id)) areaId.value = id;
});
watch(metric, () => { frame.value = 0; page.value = 0; });
watch([result, metric, frame], draw);
onMounted(async () => {
  try {
    const rows = await fetchForecastTargets();
    if (!disposed) {
      areas.value = rows;
      areaId.value = rows.find(area => area.id === props.mineId)?.id || rows[0]?.id || '';
    }
  }
  catch (e) { if (!disposed) error.value = e.message; }
});
onBeforeUnmount(() => { disposed = true; requestId++; clearTimeout(timer); clear(); });
</script>
<style scoped>
.mining-assessment-panel{height:auto;max-height:calc(100% - 10.5rem);}
.assessment-button{border:1px solid rgba(34,211,238,.4);background:rgba(8,15,28,.65);padding:5px 9px;font-size:14px;font-weight:700;white-space:nowrap;}
.assessment-button:disabled{cursor:default;filter:brightness(.65);}
.assessment-button:focus-visible{outline:2px solid #67e8f9;outline-offset:2px;}
</style>
