<template>
    <div class="absolute top-36 left-8 w-[28rem] z-40 pointer-events-none font-['Noto_Sans_SC'] animate-slideInLeft">
        <transition name="slide-down">
            <div v-if="show" class="tech-panel-enhanced p-6 pointer-events-auto relative group" style="clip-path: polygon(0 0, 100% 0, 100% 95%, 92% 100%, 0 100%);">
                <!-- 动态扫描线 -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
                <div class="corner-decoration corner-tl scale-125"></div>
                <div class="corner-decoration corner-tr scale-125"></div>
            
                <!-- 标题 -->
                <div class="flex items-center mb-6 border-b-2 border-cyan-500/30 pb-3">
                    <div class="w-1.5 h-6 bg-yellow-400 mr-3 shadow-[0_0_10px_#facc15]"></div>
                    <h3 class="text-2xl font-bold text-white tracking-wider flex-1">船舶搜索</h3>
                    <div class="text-xs font-['Orbitron'] text-cyan-500 opacity-80 font-bold tracking-widest">SHIP SEARCH</div>
                </div>

                <!-- 搜索方式 -->
                <div class="space-y-4">
                    <div class="space-y-2">
                        <div class="text-cyan-400 text-base font-bold flex items-center">
                            <div class="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-2.5"></div>搜索方式
                        </div>
                        <div class="flex gap-4">
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="radio" 
                                    value="name" 
                                    v-model="searchType"
                                    class="w-4 h-4 text-cyan-600 bg-slate-800 border-slate-600 focus:ring-cyan-500"
                                />
                                <span class="text-white">按船名</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="radio" 
                                    value="mmsi" 
                                    v-model="searchType"
                                    class="w-4 h-4 text-cyan-600 bg-slate-800 border-slate-600 focus:ring-cyan-500"
                                />
                                <span class="text-white">按MMSI</span>
                            </label>
                        </div>
                    </div>

                    <!-- 搜索输入 -->
                    <div class="space-y-2 pt-2 border-t border-dashed border-slate-700/50">
                        <div class="text-cyan-400 text-base font-bold flex items-center">
                            <div class="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-2.5"></div>
                            {{ searchType === 'name' ? '船舶名称' : 'MMSI编号' }}
                        </div>
                        <div class="flex gap-2">
                            <input 
                                v-model="searchInput"
                                type="text"
                                :placeholder="searchType === 'name' ? '输入船名，如：COSCO' : '输入9位MMSI，如：413961925'"
                                class="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-cyan-500 transition-colors"
                                @keyup.enter="handleSearch"
                            />
                            <button 
                                @click="handleSearch"
                                :disabled="loading || !searchInput"
                                class="px-6 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:from-slate-700 disabled:to-slate-600 text-white font-bold rounded-sm transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:shadow-none"
                            >
                                {{ loading ? '搜索中...' : '搜索' }}
                            </button>
                        </div>
                    </div>

                    <!-- 搜索结果 -->
                    <div v-if="searchResult || error" class="space-y-2 pt-4 border-t border-dashed border-slate-700/50">
                        <div class="text-cyan-400 text-base font-bold flex items-center">
                            <div class="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-2.5"></div>搜索结果
                        </div>
                        
                        <!-- 错误提示 -->
                        <div v-if="error" class="p-4 bg-red-900/30 border border-red-500/50 rounded-sm">
                            <div class="text-red-400 text-sm">{{ error }}</div>
                        </div>
                        
                        <!-- 船舶信息卡片 -->
                        <div v-else-if="searchResult" class="bg-slate-800/40 border border-cyan-500/50 rounded-sm p-4 space-y-3">
                            <!-- 船名 -->
                            <div class="flex items-center justify-between">
                                <span class="text-slate-400 text-sm">船舶名称</span>
                                <span class="text-white font-bold text-lg">{{ searchResult.ship_cnname || searchResult.ship_name }}</span>
                            </div>
                            
                            <!-- MMSI -->
                            <div class="flex items-center justify-between border-t border-slate-700/50 pt-2">
                                <span class="text-slate-400 text-sm">MMSI</span>
                                <span class="text-cyan-400 font-['Rajdhani'] font-bold">{{ searchResult.mmsi }}</span>
                            </div>
                            
                            <!-- 位置 -->
                            <div class="flex items-center justify-between border-t border-slate-700/50 pt-2">
                                <span class="text-slate-400 text-sm">当前位置</span>
                                <span class="text-white font-['Rajdhani']">{{ formatPosition(searchResult.lat, searchResult.lng) }}</span>
                            </div>
                            
                            <!-- 航速 -->
                            <div class="flex items-center justify-between border-t border-slate-700/50 pt-2">
                                <span class="text-slate-400 text-sm">航速</span>
                                <span class="text-white font-['Rajdhani']">{{ searchResult.sog }} kn</span>
                            </div>
                            
                            <!-- 航向 -->
                            <div class="flex items-center justify-between border-t border-slate-700/50 pt-2">
                                <span class="text-slate-400 text-sm">航向</span>
                                <span class="text-white font-['Rajdhani']">{{ searchResult.cog }}°</span>
                            </div>
                            
                            <!-- 更新时间 -->
                            <div class="flex items-center justify-between border-t border-slate-700/50 pt-2">
                                <span class="text-slate-400 text-sm">更新时间</span>
                                <span class="text-slate-400 text-xs">{{ searchResult.last_time }}</span>
                            </div>
                            
                            <!-- 操作按钮 -->
                            <div class="flex gap-2 pt-3 border-t border-slate-700/50">
                                <button 
                                    @click="handleLocate"
                                    class="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-sm transition-all"
                                >
                                    📍 定位
                                </button>
                                <button 
                                    @click="handleViewDetails"
                                    class="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-sm transition-all"
                                >
                                    📋 详情
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script>
import { ref } from 'vue';
import { getSingleShip, searchShipByName } from '../utils/shipxyApi.js';

export default {
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['locate', 'viewDetails'],
    setup(props, { emit }) {
        const searchType = ref('mmsi');
        const searchInput = ref('');
        const loading = ref(false);
        const searchResult = ref(null);
        const error = ref('');
        
        /**
         * 处理搜索
         */
        const handleSearch = async () => {
            if (!searchInput.value.trim()) {
                error.value = '请输入搜索内容';
                return;
            }
            
            loading.value = true;
            error.value = '';
            searchResult.value = null;
            
            try {
                if (searchType.value === 'mmsi') {
                    // 按MMSI搜索
                    const mmsi = parseInt(searchInput.value);
                    if (isNaN(mmsi) || searchInput.value.length !== 9) {
                        error.value = 'MMSI必须是9位数字';
                        loading.value = false;
                        return;
                    }
                    
                    const result = await getSingleShip(mmsi);
                    if (result.success) {
                        searchResult.value = result.data;
                        console.log('🚢 搜索到船舶:', result.data);
                    } else {
                        error.value = result.error || '未找到该船舶';
                    }
                } else {
                    // 按船名搜索
                    const result = await searchShipByName(searchInput.value);
                    if (result.success) {
                        searchResult.value = result.data;
                        console.log('🚢 搜索到船舶:', result.data);
                    } else {
                        error.value = result.error || '未找到该船舶';
                    }
                }
            } catch (err) {
                error.value = '搜索失败: ' + err.message;
            } finally {
                loading.value = false;
            }
        };
        
        /**
         * 格式化位置
         */
        const formatPosition = (lat, lng) => {
            const latDir = lat >= 0 ? 'N' : 'S';
            const lngDir = lng >= 0 ? 'E' : 'W';
            return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
        };
        
        /**
         * 定位到船舶
         */
        const handleLocate = () => {
            if (searchResult.value) {
                emit('locate', searchResult.value);
            }
        };
        
        /**
         * 查看详情
         */
        const handleViewDetails = () => {
            if (searchResult.value) {
                emit('viewDetails', searchResult.value);
            }
        };
        
        return {
            searchType,
            searchInput,
            loading,
            searchResult,
            error,
            handleSearch,
            formatPosition,
            handleLocate,
            handleViewDetails
        };
    }
};
</script>

<style scoped>
/* 滑入动画 */
.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.3s ease;
    max-height: 800px;
    overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
    max-height: 0;
    opacity: 0;
}
</style>
