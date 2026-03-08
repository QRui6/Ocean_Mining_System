<template>
    <transition name="slide-fade">
        <div v-if="show" class="fixed left-8 top-1/2 -translate-y-1/2 z-50 w-96 pointer-events-auto">
            <div class="relative backdrop-blur-md rounded-lg shadow-2xl overflow-hidden border"
                 style="background: var(--panel-bg); border-color: var(--panel-border);">
                
                <!-- 标题栏 -->
                <div class="flex items-center justify-between px-6 py-4 border-b"
                     style="background: var(--panel-header-bg); border-color: var(--panel-border);">
                    <div class="flex items-center gap-3">
                        <div class="w-1 h-6 rounded-full" style="background: var(--accent-cyan);"></div>
                        <h3 class="text-xl font-bold" style="color: var(--text-primary);">南极坐标采集</h3>
                    </div>
                    <button @click="$emit('close')" 
                            class="w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:bg-red-500/20"
                            style="color: var(--text-secondary);">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <!-- 内容区 -->
                <div class="p-6 space-y-4">
                    <!-- 采集状态 -->
                    <div class="flex items-center justify-between p-4 rounded-lg"
                         :style="{ background: isCollecting ? 'rgba(34, 197, 94, 0.1)' : 'var(--panel-item-bg)' }">
                        <span class="text-base" style="color: var(--text-secondary);">采集状态</span>
                        <div class="flex items-center gap-2">
                            <div class="w-2 h-2 rounded-full animate-pulse"
                                 :style="{ background: isCollecting ? '#22c55e' : '#6b7280' }"></div>
                            <span class="font-bold" :style="{ color: isCollecting ? '#22c55e' : 'var(--text-secondary)' }">
                                {{ isCollecting ? '采集中' : '未开始' }}
                            </span>
                        </div>
                    </div>

                    <!-- 已采集坐标数量 -->
                    <div class="flex items-center justify-between p-4 rounded-lg"
                         style="background: var(--panel-item-bg);">
                        <span class="text-base" style="color: var(--text-secondary);">已采集坐标</span>
                        <span class="text-2xl font-bold" style="color: var(--accent-cyan);">{{ coordinates.length }}</span>
                    </div>

                    <!-- 控制按钮 -->
                    <div class="space-y-3">
                        <button v-if="!isCollecting"
                                @click="startCollecting"
                                class="w-full py-3 rounded-lg font-bold text-white transition-all hover:scale-105"
                                style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);">
                            开始采集
                        </button>
                        <button v-else
                                @click="stopCollecting"
                                class="w-full py-3 rounded-lg font-bold text-white transition-all hover:scale-105"
                                style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);">
                            结束采集
                        </button>

                        <button v-if="coordinates.length > 0 && !isCollecting"
                                @click="clearCoordinates"
                                class="w-full py-3 rounded-lg font-bold transition-all hover:scale-105"
                                style="background: var(--panel-item-bg); color: var(--text-secondary);">
                            清空坐标
                        </button>
                    </div>

                    <!-- 坐标列表 -->
                    <div v-if="coordinates.length > 0" class="space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-sm font-bold" style="color: var(--text-primary);">坐标列表</span>
                            <span class="text-xs" style="color: var(--text-secondary);">经度 / 纬度</span>
                        </div>
                        <div class="max-h-60 overflow-y-auto space-y-2 custom-scrollbar">
                            <div v-for="(coord, index) in coordinates" :key="index"
                                 class="flex items-center justify-between p-3 rounded-lg"
                                 style="background: var(--panel-item-bg);">
                                <span class="text-sm font-mono" style="color: var(--text-secondary);">
                                    {{ index + 1 }}.
                                </span>
                                <span class="text-sm font-mono" style="color: var(--text-primary);">
                                    {{ coord.longitude.toFixed(6) }}, {{ coord.latitude.toFixed(6) }}
                                </span>
                                <button @click="removeCoordinate(index)"
                                        class="w-6 h-6 flex items-center justify-center rounded transition-all hover:bg-red-500/20"
                                        style="color: var(--text-secondary);">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </transition>

    <!-- 保存文件名对话框 -->
    <transition name="fade">
        <div v-if="showSaveDialog" 
             class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 pointer-events-auto"
             @click.self="showSaveDialog = false">
            <div class="w-96 rounded-lg shadow-2xl overflow-hidden border"
                 style="background: var(--panel-bg); border-color: var(--panel-border);">
                <div class="px-6 py-4 border-b"
                     style="background: var(--panel-header-bg); border-color: var(--panel-border);">
                    <h3 class="text-lg font-bold" style="color: var(--text-primary);">保存坐标数据</h3>
                </div>
                <div class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm mb-2" style="color: var(--text-secondary);">文件名称</label>
                        <input v-model="fileName"
                               type="text"
                               placeholder="请输入文件名（不含扩展名）"
                               class="w-full px-4 py-2 rounded-lg border outline-none transition-all"
                               style="background: var(--panel-item-bg); border-color: var(--panel-border); color: var(--text-primary);"
                               @keyup.enter="saveToFile">
                    </div>
                    <div class="flex gap-3">
                        <button @click="showSaveDialog = false"
                                class="flex-1 py-2 rounded-lg font-bold transition-all"
                                style="background: var(--panel-item-bg); color: var(--text-secondary);">
                            取消
                        </button>
                        <button @click="saveToFile"
                                :disabled="!fileName.trim()"
                                class="flex-1 py-2 rounded-lg font-bold text-white transition-all disabled:opacity-50"
                                style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);">
                            保存
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
import { ref } from 'vue';

export default {
    name: 'CoordinateCollectorPanel',
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['close', 'startCollecting', 'stopCollecting', 'coordinatesUpdated'],
    setup(props, { emit }) {
        const isCollecting = ref(false);
        const coordinates = ref([]);
        const showSaveDialog = ref(false);
        const fileName = ref('');

        const startCollecting = () => {
            isCollecting.value = true;
            emit('startCollecting');
        };

        const stopCollecting = () => {
            isCollecting.value = false;
            emit('stopCollecting');
            if (coordinates.value.length > 0) {
                showSaveDialog.value = true;
            }
        };

        const addCoordinate = (longitude, latitude) => {
            coordinates.value.push({ longitude, latitude });
            emit('coordinatesUpdated', coordinates.value);
        };

        const removeCoordinate = (index) => {
            coordinates.value.splice(index, 1);
            emit('coordinatesUpdated', coordinates.value);
        };

        const clearCoordinates = () => {
            coordinates.value = [];
            emit('coordinatesUpdated', coordinates.value);
        };

        const saveToFile = () => {
            if (!fileName.value.trim()) return;

            const data = {
                type: 'FeatureCollection',
                features: coordinates.value.map((coord, index) => ({
                    type: 'Feature',
                    properties: {
                        id: index + 1,
                        name: `坐标点 ${index + 1}`
                    },
                    geometry: {
                        type: 'Point',
                        coordinates: [coord.longitude, coord.latitude]
                    }
                }))
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName.value}.geojson`;
            a.click();
            URL.revokeObjectURL(url);

            showSaveDialog.value = false;
            fileName.value = '';
            
            alert(`坐标数据已保存！\n请将文件手动移动到：\npublic/data/nanji/ 目录下`);
        };

        return {
            isCollecting,
            coordinates,
            showSaveDialog,
            fileName,
            startCollecting,
            stopCollecting,
            addCoordinate,
            removeCoordinate,
            clearCoordinates,
            saveToFile
        };
    }
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: var(--accent-cyan);
    border-radius: 3px;
}

.slide-fade-enter-active, .slide-fade-leave-active {
    transition: all 0.3s ease;
}

.slide-fade-enter-from {
    transform: translateX(-100%) translateY(-50%);
    opacity: 0;
}

.slide-fade-leave-to {
    transform: translateX(-100%) translateY(-50%);
    opacity: 0;
}

.fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
    opacity: 0;
}
</style>
