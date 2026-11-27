<template>
  <div ref="root" :class="['panel-select', { 'is-open': open }]">
    <button ref="trigger" type="button" role="combobox" aria-haspopup="listbox"
      :aria-label="label" :aria-controls="id" :aria-expanded="open"
      :aria-activedescendant="open && active >= 0 ? `${id}-${active}` : undefined"
      :disabled="!options.length" @click="toggle" @keydown="onKey">
      <span>{{ selected?.label || '暂无数据' }}</span><i :class="{ expanded: open }"></i>
    </button>
    <Teleport :to="portalTarget || 'body'" :disabled="!overlay">
    <div v-if="open" :id="id" ref="menu" role="listbox" :aria-label="label"
      :class="['panel-select-menu custom-scrollbar', { upward, 'is-portal': overlay }]" :style="menuStyle">
      <button v-for="(option, index) in options" :id="`${id}-${index}`" :key="option.value"
        type="button" role="option" tabindex="-1" :aria-selected="option.value === modelValue"
        :class="{ selected: option.value === modelValue, active: index === active }" :title="option.label"
        @mousedown.prevent @mousemove="active = index" @click="choose(index)">{{ option.label }}</button>
    </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
const props = defineProps({ modelValue: [String, Number], label: String, options: { type: Array, default: () => [] }, overlay: Boolean, maxHeight: { type: Number, default: 280 } });
const emit = defineEmits(['update:modelValue']);
const id = useId(), root = ref(null), trigger = ref(null), menu = ref(null);
const open = ref(false), active = ref(-1), upward = ref(false), menuHeight = ref(280);
const portalTarget = ref(null), portalPosition = ref({});
const menuStyle = computed(() => ({ maxHeight: `${menuHeight.value}px`, ...(props.overlay ? portalPosition.value : {}) }));
const selected = computed(() => props.options.find(option => option.value === props.modelValue));
function measure() {
  if (!open.value || !trigger.value) return;
  if (props.overlay) {
    const host = portalTarget.value;
    const bounds = host?.getBoundingClientRect() || { left: 0, top: 0, bottom: window.innerHeight, width: window.innerWidth, height: window.innerHeight };
    const rect = trigger.value.getBoundingClientRect();
    const scaleX = host ? bounds.width / host.offsetWidth : 1, scaleY = host ? bounds.height / host.offsetHeight : 1;
    const below = (Math.min(bounds.bottom, window.innerHeight) - rect.bottom) / scaleY - 8;
    const above = (rect.top - Math.max(bounds.top, 0)) / scaleY - 8;
    upward.value = below < Math.min(180, props.maxHeight) && above > below;
    menuHeight.value = Math.max(24, Math.min(props.maxHeight, upward.value ? above : below));
    portalPosition.value = {
      left: `${(rect.left - bounds.left) / scaleX}px`, width: `${rect.width / scaleX}px`,
      top: upward.value ? 'auto' : `${(rect.bottom - bounds.top) / scaleY + 4}px`,
      bottom: upward.value ? `${(bounds.bottom - rect.top) / scaleY + 4}px` : 'auto'
    };
    return;
  }
  const boundary = root.value.closest('[data-select-boundary]') || root.value.closest('section');
  const bounds = boundary?.getBoundingClientRect() || { top: 0, bottom: window.innerHeight, height: window.innerHeight };
  const rect = trigger.value.getBoundingClientRect();
  const scale = boundary ? bounds.height / boundary.offsetHeight : 1;
  const below = (bounds.bottom - rect.bottom) / scale - 12;
  const above = (rect.top - bounds.top) / scale - 12;
  upward.value = below < 180 && above > below;
  menuHeight.value = Math.max(24, Math.min(props.maxHeight, upward.value ? above : below));
}
async function show() {
  if (!props.options.length) return;
  open.value = true;
  active.value = Math.max(0, props.options.findIndex(option => option.value === props.modelValue));
  measure();
  await nextTick(); scrollActive();
}
function toggle() { if (open.value) open.value = false; else show(); }
function scrollActive() {
  const element = menu.value?.children[active.value];
  if (!element) return;
  const top = element.offsetTop, bottom = top + element.offsetHeight;
  if (top < menu.value.scrollTop) menu.value.scrollTop = top;
  else if (bottom > menu.value.scrollTop + menu.value.clientHeight) menu.value.scrollTop = bottom - menu.value.clientHeight;
}
function choose(index) {
  const option = props.options[index];
  if (option) emit('update:modelValue', option.value);
  open.value = false; trigger.value?.focus();
}
function onKey(event) {
  if (event.key === 'Escape' || event.key === 'Tab') { open.value = false; return; }
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(event.key)) return;
  event.preventDefault();
  if (!open.value) { show(); return; }
  if (event.key === 'Enter' || event.key === ' ') { choose(active.value); return; }
  active.value = event.key === 'Home' ? 0 : event.key === 'End' ? props.options.length - 1
    : Math.max(0, Math.min(props.options.length - 1, active.value + (event.key === 'ArrowDown' ? 1 : -1)));
  nextTick(scrollActive);
}
function outside(event) { if (!root.value?.contains(event.target) && !menu.value?.contains(event.target)) open.value = false; }
watch(() => props.options, () => { open.value = false; });
onMounted(() => { portalTarget.value = document.getElementById('screen-container'); document.addEventListener('pointerdown', outside); document.addEventListener('scroll', measure, true); window.addEventListener('resize', measure); });
onBeforeUnmount(() => { document.removeEventListener('pointerdown', outside); document.removeEventListener('scroll', measure, true); window.removeEventListener('resize', measure); });
</script>

<style scoped>
.panel-select{position:relative;flex-shrink:0;width:100%;font-size:16px;}
.panel-select.is-open{z-index:80;}
.panel-select>button{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;min-height:42px;border:1px solid rgba(34,211,238,.42);background:linear-gradient(90deg,#112d43,#0f1e30);padding:8px 12px;text-align:left;color:#ffffff;font-weight:600;}
.panel-select>button:disabled{opacity:.6;}
.panel-select>button span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.panel-select i{width:8px;height:8px;flex-shrink:0;border-right:2px solid #67e8f9;border-bottom:2px solid #67e8f9;transform:rotate(45deg);}
.panel-select i.expanded{transform:rotate(225deg);}
.panel-select-menu{position:absolute;left:0;right:0;top:calc(100% + 4px);overflow-y:auto;overscroll-behavior:contain;border:1px solid rgba(34,211,238,.5);background:#081321;box-shadow:0 0 18px rgba(34,211,238,.18);padding:4px;}
.panel-select-menu.upward{top:auto;bottom:calc(100% + 4px);}
.panel-select-menu.is-portal{z-index:55;font-family:'Noto Sans SC',sans-serif;font-size:16px;font-weight:600;letter-spacing:.02em;}
.panel-select-menu button{display:block;width:100%;min-height:38px;border:1px solid transparent;padding:7px 10px;text-align:left;color:#d7e6f2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.panel-select-menu button.selected,.panel-select-menu button.active{background:#123b50;border-color:rgba(34,211,238,.45);color:#fff;}
.panel-select button:focus-visible{outline:2px solid #67e8f9;outline-offset:1px;}
</style>
