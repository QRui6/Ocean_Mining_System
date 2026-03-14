<template>
    <transition name="slide-left">
        <div v-if="show" class="fixed left-[15.5rem] top-[10rem] w-[22rem] bg-slate-950/95 backdrop-blur-xl border-2 border-cyan-500/50 text-white shadow-[0_0_40px_rgba(0,0,0,0.8)] z-50 pointer-events-auto"
            style="clip-path: polygon(0 0, 100% 0, 100% 92%, 92% 100%, 0 100%);">
            
            <!-- 扫描线 -->
            <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>

            <!-- 标题栏 -->
            <div class="flex items-center justify-between bg-gradient-to-r from-cyan-900/60 to-transparent px-4 py-3 border-b border-cyan-500/30">
                <div class="flex items-center gap-3">
                    <div class="w-2 h-2 bg-cyan-400 rotate-45 shadow-[0_0_6px_#22d3ee]"></div>
                    <span class="font-bold text-lg text-white tracking-wide font-['Noto_Sans_SC']">🖊️ 区域勾面</span>
                </div>
                <button @click="$emit('close')" class="group p-1">
                    <div class="w-6 h-6 border border-cyan-500/50 flex items-center justify-center rounded-sm group-hover:bg-cyan-500 group-hover:text-black transition-colors text-sm">✕</div>
                </button>
            </div>

            <!-- 内容区域 -->
            <div class="p-4 space-y-4">
                <!-- 网格背景 -->
                <div class="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

                <!-- 状态指示 -->
                <div class="relative bg-slate-900/50 border border-cyan-500/30 rounded p-3">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-cyan-300 text-sm">绘制状态</span>
                        <span :class="isDrawing ? 'text-green-400' : 'text-gray-400'" class="text-sm font-bold">
                            {{ isDrawing ? '● 绘制中' : '○ 未开始' }}
                        </span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-cyan-300 text-sm">当前顶点</span>
                        <span class="text-white font-['Rajdhani'] font-bold">{{ currentPoints }}</span>
                    </div>
                </div>

                <!-- 操作按钮 -->
                <div class="relative space-y-2">
                    <button 
                        v-if="!isDrawing"
                        @click="startDrawing"
                        class="w-full px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white font-bold rounded transition-all shadow-lg hover:shadow-cyan-500/50">
                        开始绘制
                    </button>
                    
                    <template v-else>
                        <button 
                            @click="showSaveDialog"
                            :disabled="currentPoints < 3"
                            :class="currentPoints >= 3 ? 'from-green-600 to-green-700 hover:from-green-500 hover:to-green-600' : 'from-gray-600 to-gray-700 cursor-not-allowed'"
                            class="w-full px-4 py-2 bg-gradient-to-r text-white font-bold rounded transition-all shadow-lg">
                            完成多边形 (需要至少3个点)
                        </button>
                        
                        <button 
                            @click="cancelDrawing"
                            class="w-full px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded transition-all shadow-lg hover:shadow-red-500/50">
                            取消绘制
                        </button>
                    </template>
                </div>

                <!-- 保存对话框 -->
                <div v-if="showDialog" class="relative bg-slate-900/90 border border-cyan-500/50 rounded p-4 space-y-3">
                    <div class="text-cyan-300 text-sm font-bold mb-2">保存区域</div>
                    
                    <div>
                        <label class="text-cyan-300 text-xs block mb-1">区域名称</label>
                        <input 
                            v-model="polygonName"
                            type="text"
                            placeholder="请输入区域名称"
                            class="w-full px-3 py-2 bg-slate-800 border border-cyan-500/30 rounded text-white text-sm focus:outline-none focus:border-cyan-500"
                            @keyup.enter="savePolygon"
                        />
                    </div>
                    
                    <div class="flex gap-2">
                        <button 
                            @click="savePolygon"
                            class="flex-1 px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white text-sm font-bold rounded transition-all">
                            保存
                        </button>
                        <button 
                            @click="showDialog = false"
                            class="flex-1 px-3 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white text-sm font-bold rounded transition-all">
                            取消
                        </button>
                    </div>
                </div>

                <!-- 已保存区域列表 -->
                <div class="relative bg-slate-900/50 border border-cyan-500/30 rounded p-3 max-h-[300px] overflow-y-auto">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-cyan-300 text-sm">已保存区域</span>
                        <span class="text-white font-['Rajdhani'] font-bold">{{ polygons.length }}</span>
                    </div>
                    
                    <!-- 区域列表 -->
                    <div v-if="polygons.length > 0" class="space-y-2 mt-3">
                        <div 
                            v-for="(polygon, index) in polygons" 
                            :key="polygon.id"
                            class="bg-slate-800/50 border border-cyan-500/20 rounded p-2 hover:border-cyan-500/50 transition-colors">
                            <div class="flex items-center justify-between">
                                <div class="flex-1">
                                    <div class="text-white text-sm font-bold">{{ polygon.name }}</div>
                                    <div class="text-cyan-300 text-xs mt-1">顶点数: {{ polygon.points.length }}</div>
                                </div>
                                <button 
                                    @click="deletePolygon(index)"
                                    class="px-2 py-1 bg-red-600/50 hover:bg-red-600 text-white text-xs rounded transition-colors">
                                    删除
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex gap-2 mt-3">
                        <button 
                            v-if="polygons.length > 0"
                            @click="exportToFile"
                            class="flex-1 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-bold rounded transition-all">
                            导出文件
                        </button>
                        <button 
                            v-if="polygons.length > 0"
                            @click="clearAll"
                            class="flex-1 px-3 py-1.5 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white text-sm font-bold rounded transition-all">
                            清空所有
                        </button>
                    </div>
                </div>

                <!-- 使用说明 -->
                <div class="relative bg-slate-900/30 border border-cyan-500/20 rounded p-3">
                    <div class="text-cyan-300 text-xs space-y-1">
                        <p>📌 使用说明：</p>
                        <p>1. 点击"开始绘制"进入绘制模式</p>
                        <p>2. 在地图上点击添加顶点</p>
                        <p>3. 至少添加3个顶点</p>
                        <p>4. 点击"完成多边形"并输入名称保存</p>
                        <p>5. 点击"导出文件"保存到本地</p>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
import { ref } from 'vue';

export default {
    name: 'PolygonDrawerPanel',
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['close', 'startDrawing', 'stopDrawing', 'polygonFinished', 'polygonsUpdated'],
    setup(props, { emit }) {
        const isDrawing = ref(false);
        const currentPoints = ref(0);
        const polygons = ref([]);
        const showDialog = ref(false);
        const polygonName = ref('');

        /**
         * 开始绘制
         */
        const startDrawing = () => {
            isDrawing.value = true;
            currentPoints.value = 0;
            emit('startDrawing');
            console.log('🖊️ 开始绘制多边形');
        };

        /**
         * 显示保存对话框
         */
        const showSaveDialog = () => {
            if (currentPoints.value < 3) {
                console.warn('⚠️ 至少需要3个顶点');
                return;
            }
            
            showDialog.value = true;
            polygonName.value = `区域_${polygons.value.length + 1}`;
        };

        /**
         * 保存多边形
         */
        const savePolygon = () => {
            if (!polygonName.value.trim()) {
                alert('请输入区域名称');
                return;
            }
            
            isDrawing.value = false;
            showDialog.value = false;
            
            // 通知父组件完成绘制，并传递名称
            emit('polygonFinished', polygonName.value.trim());
            
            console.log('✅ 多边形绘制完成:', polygonName.value);
        };

        /**
         * 取消绘制
         */
        const cancelDrawing = () => {
            isDrawing.value = false;
            currentPoints.value = 0;
            showDialog.value = false;
            emit('stopDrawing');
            console.log('❌ 取消绘制');
        };

        /**
         * 删除多边形
         */
        const deletePolygon = (index) => {
            polygons.value.splice(index, 1);
            emit('polygonsUpdated', polygons.value);
            console.log('🗑️ 删除区域:', index);
        };

        /**
         * 清空所有区域
         */
        const clearAll = () => {
            if (confirm('确定要清空所有区域吗？')) {
                polygons.value = [];
                emit('polygonsUpdated', []);
                console.log('🗑️ 清空所有区域');
            }
        };

        /**
         * 导出到文件
         */
        const exportToFile = () => {
            const data = {
                type: 'PolygonCollection',
                timestamp: new Date().toISOString(),
                count: polygons.value.length,
                polygons: polygons.value.map(p => ({
                    name: p.name,
                    points: p.points,
                    timestamp: p.timestamp
                }))
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `polygons_${new Date().getTime()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            console.log('💾 导出区域数据到文件');
        };

        /**
         * 添加多边形（由父组件调用）
         */
        const addPolygon = (polygon) => {
            polygons.value.push(polygon);
            currentPoints.value = 0;
            emit('polygonsUpdated', polygons.value);
            console.log('📐 添加多边形:', polygon);
        };

        /**
         * 更新当前顶点数（由父组件调用）
         */
        const updatePointCount = (count) => {
            currentPoints.value = count;
        };

        return {
            isDrawing,
            currentPoints,
            polygons,
            showDialog,
            polygonName,
            startDrawing,
            showSaveDialog,
            savePolygon,
            cancelDrawing,
            deletePolygon,
            clearAll,
            exportToFile,
            addPolygon,
            updatePointCount
        };
    }
};
</script>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active {
    transition: all 0.3s ease;
}

.slide-left-enter-from {
    opacity: 0;
    transform: translateX(-20px);
}

.slide-left-leave-to {
    opacity: 0;
    transform: translateX(-20px);
}

/* 自定义滚动条 */
.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: rgba(34, 211, 238, 0.5);
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: rgba(34, 211, 238, 0.7);
}
</style>
