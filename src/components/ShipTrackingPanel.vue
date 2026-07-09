<template>
    <div class="absolute top-36 left-8 w-[28rem] z-40 flex flex-col gap-6 pointer-events-none font-['Noto_Sans_SC'] animate-slideInLeft max-h-[calc(100vh-10rem)]">
        
        <!-- 1. 船舶搜索面板 -->
        <transition name="slide-down">
            <div v-if="showShipSearch" class="tech-panel-enhanced pointer-events-auto relative group flex flex-col max-h-[45vh] panel-clip-path">
                <!-- 动态扫描线 -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
                <div class="corner-decoration corner-tl scale-125"></div>
                <div class="corner-decoration corner-tr scale-125"></div>
            
                <!-- 标题 - 固定不滚动 -->
                <div class="flex items-center mb-3 border-b-2 border-cyan-500/30 pb-2 px-4 pt-4 flex-shrink-0">
                    <div class="w-1.5 h-5 bg-yellow-400 mr-2 shadow-[0_0_10px_#facc15]"></div>
                    <h3 class="text-xl font-bold text-white tracking-wider flex-1">船舶搜索</h3>
                </div>
                
                <!-- 可滚动内容区域 -->
                <div class="overflow-y-auto custom-scrollbar px-4 pb-4 flex-1">
                    <div class="flex gap-2 mb-4">
                        <button
                            @click="shipPanelTab = 'query'"
                            :class="[
                                'flex-1 px-3 py-2 font-bold rounded-sm transition-all text-sm',
                                shipPanelTab === 'query'
                                    ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.45)]'
                                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                            ]"
                        >
                            船舶搜索
                        </button>
                        <button
                            @click="shipPanelTab = 'history'"
                            :class="[
                                'flex-1 px-3 py-2 font-bold rounded-sm transition-all text-sm',
                                shipPanelTab === 'history'
                                    ? 'bg-amber-600 text-white shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                            ]"
                        >
                            历史轨迹
                        </button>
                        <button
                            @click="shipPanelTab = 'list'"
                            :class="[
                                'flex-1 px-3 py-2 font-bold rounded-sm transition-all text-sm',
                                shipPanelTab === 'list'
                                    ? 'bg-sky-600 text-white shadow-[0_0_15px_rgba(14,165,233,0.4)]'
                                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                            ]"
                        >
                            船舶列表
                        </button>
                    </div>

                    <div v-if="shipPanelTab === 'query'">
                    <!-- 搜索类型选项卡 -->
                    <div class="flex gap-2 mb-6">
                        <button 
                            @click="searchMode = 'single'"
                            :class="[
                                'flex-1 px-4 py-2 font-bold rounded-sm transition-all',
                                searchMode === 'single' 
                                    ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' 
                                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                            ]"
                        >
                            单船搜索
                        </button>
                        <button 
                            @click="searchMode = 'multiple'"
                            :class="[
                                'flex-1 px-4 py-2 font-bold rounded-sm transition-all',
                                searchMode === 'multiple' 
                                    ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' 
                                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                            ]"
                        >
                            多船搜索
                        </button>
                    </div>

                    <!-- 单船搜索内容 -->
                    <div v-if="searchMode === 'single'" class="space-y-4">
                    <!-- MMSI输入 -->
                    <div class="space-y-2">
                        <div class="text-cyan-400 text-base font-bold flex items-center">
                            <div class="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-2.5"></div>MMSI编号
                        </div>
                        <div class="flex gap-2">
                            <input 
                                v-model="singleMmsi"
                                type="text"
                                placeholder="输入9位MMSI，如：413961925"
                                class="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-cyan-500 transition-colors font-['Rajdhani']"
                                @keyup.enter="handleSingleSearch"
                            />
                            <button 
                                @click="handleSingleSearch"
                                :disabled="singleLoading || !singleMmsi"
                                class="px-6 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:from-slate-700 disabled:to-slate-600 text-white font-bold rounded-sm transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:shadow-none"
                            >
                                {{ singleLoading ? '搜索中...' : '搜索' }}
                            </button>
                        </div>
                    </div>

                    <!-- 单船搜索结果 -->
                    <div v-if="singleResult || singleError" class="space-y-2 pt-4 border-t border-dashed border-slate-700/50">
                        <div class="text-cyan-400 text-base font-bold flex items-center">
                            <div class="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-2.5"></div>搜索结果
                        </div>
                        
                        <!-- 错误提示 -->
                        <div v-if="singleError" class="p-4 bg-red-900/30 border border-red-500/50 rounded-sm">
                            <div class="text-red-400 text-sm">{{ singleError }}</div>
                        </div>
                        
                        <!-- 船舶信息卡片 -->
                        <div v-else-if="singleResult" class="bg-slate-800/40 border border-cyan-500/50 rounded-sm p-4 space-y-3">
                            <div class="flex items-center justify-between">
                                <span class="text-slate-400 text-sm">船舶名称</span>
                                <span class="text-white font-bold text-lg">{{ singleResult.ship_cnname || singleResult.ship_name }}</span>
                            </div>
                            <div class="flex items-center justify-between border-t border-slate-700/50 pt-2">
                                <span class="text-slate-400 text-sm">MMSI</span>
                                <span class="text-cyan-400 font-['Rajdhani'] font-bold">{{ singleResult.mmsi }}</span>
                            </div>
                            <div class="flex items-center justify-between border-t border-slate-700/50 pt-2">
                                <span class="text-slate-400 text-sm">当前位置</span>
                                <span class="text-white font-['Rajdhani']">{{ formatPosition(singleResult.lat, singleResult.lng) }}</span>
                            </div>
                            <div class="flex items-center justify-between border-t border-slate-700/50 pt-2">
                                <span class="text-slate-400 text-sm">航速</span>
                                <span class="text-white font-['Rajdhani']">{{ singleResult.sog }} kn</span>
                            </div>
                            <div class="flex items-center justify-between border-t border-slate-700/50 pt-2">
                                <span class="text-slate-400 text-sm">更新时间</span>
                                <span class="text-slate-400 text-xs">{{ singleResult.last_time }}</span>
                            </div>
                            
                            <!-- 操作按钮 -->
                            <div class="flex gap-2 pt-3 border-t border-slate-700/50">
                                <button 
                                    @click="handleSingleLocate"
                                    class="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-sm transition-all"
                                >
                                    定位
                                </button>
                            </div>
                        </div>
                    </div>
                    </div>
                
                    <!-- 多船搜索内容 -->
                    <div v-if="searchMode === 'multiple'" class="space-y-4">
                    <!-- MMSI列表输入 -->
                    <div class="space-y-2">
                        <div class="text-cyan-400 text-base font-bold flex items-center">
                            <div class="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-2.5"></div>MMSI列表
                        </div>
                        <textarea 
                            v-model="multipleMmsis"
                            placeholder="输入多个MMSI，每行一个或用逗号分隔&#10;例如：&#10;413961925&#10;477232800&#10;或：413961925,477232800"
                            rows="4"
                            class="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-cyan-500 transition-colors font-['Rajdhani'] text-sm"
                        ></textarea>
                        <div class="text-xs text-slate-500">最多支持100个MMSI</div>
                    </div>
                    
                    <!-- 搜索按钮 -->
                    <div class="flex gap-2">
                        <button 
                            @click="handleMultipleSearch"
                            :disabled="multipleLoading || !multipleMmsis"
                            class="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:from-slate-700 disabled:to-slate-600 text-white font-bold rounded-sm transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:shadow-none"
                        >
                            {{ multipleLoading ? '搜索中...' : '批量搜索' }}
                        </button>
                        <button 
                            v-if="multipleResults.length > 0"
                            @click="handleClearMultiple"
                            class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-sm transition-all"
                        >
                            清除
                        </button>
                    </div>
                    
                    <!-- 多船搜索结果 -->
                    <div v-if="multipleResults.length > 0 || multipleError" class="space-y-2 pt-4 border-t border-dashed border-slate-700/50">
                        <div class="text-cyan-400 text-base font-bold flex items-center">
                            <div class="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-2.5"></div>
                            搜索结果 ({{ multipleResults.length }} 艘)
                        </div>
                        
                        <!-- 错误提示 -->
                        <div v-if="multipleError" class="p-4 bg-red-900/30 border border-red-500/50 rounded-sm">
                            <div class="text-red-400 text-sm">{{ multipleError }}</div>
                        </div>
                        
                        <!-- 船舶列表 -->
                        <div v-if="multipleResults.length > 0" class="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                            <div v-for="ship in multipleResults" :key="ship.mmsi" 
                                class="bg-slate-800/40 border border-cyan-500/30 rounded-sm p-3 hover:border-cyan-500/60 transition-all cursor-pointer"
                                @click="handleMultipleLocate(ship)"
                            >
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-white font-bold">{{ ship.ship_cnname || ship.ship_name }}</span>
                                    <span class="text-cyan-400 font-['Rajdhani'] text-sm">{{ ship.mmsi }}</span>
                                </div>
                                <div class="flex items-center justify-between text-xs text-slate-400">
                                    <span>航速: {{ ship.sog }} kn</span>
                                    <span>{{ formatPosition(ship.lat, ship.lng) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>
                    </div>
                    
                    <div v-else-if="shipPanelTab === 'history'" class="space-y-4">
                        <div class="space-y-2">
                            <div class="text-amber-400 text-base font-bold flex items-center">
                                <div class="w-1.5 h-1.5 bg-amber-400 rounded-full mr-2.5"></div>船舶MMSI
                            </div>
                            <input 
                                v-model="trackMmsi"
                                type="text"
                                placeholder="输入9位MMSI，如：413961925"
                                class="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-amber-500 transition-colors font-['Rajdhani']"
                            />
                        </div>

                        <div class="space-y-2 pt-2 border-t border-dashed border-slate-700/50">
                            <div class="text-amber-400 text-base font-bold flex items-center">
                                <div class="w-1.5 h-1.5 bg-amber-400 rounded-full mr-2.5"></div>快捷选择
                            </div>
                            <div class="grid grid-cols-4 gap-2">
                                <button @click="setQuickTime(1)" class="quick-track-btn">1小时</button>
                                <button @click="setQuickTime(6)" class="quick-track-btn">6小时</button>
                                <button @click="setQuickTime(24)" class="quick-track-btn">24小时</button>
                                <button @click="setQuickTime(168)" class="quick-track-btn">7天</button>
                            </div>
                        </div>

                        <div class="space-y-2 pt-2 border-t border-dashed border-slate-700/50">
                            <div class="text-amber-400 text-base font-bold flex items-center">
                                <div class="w-1.5 h-1.5 bg-green-400 rounded-full mr-2.5"></div>开始时间
                            </div>
                            <input 
                                v-model="trackStartTime"
                                type="datetime-local"
                                class="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-amber-500 transition-colors font-['Rajdhani']"
                            />
                        </div>

                        <div class="space-y-2 pt-2 border-t border-dashed border-slate-700/50">
                            <div class="text-amber-400 text-base font-bold flex items-center">
                                <div class="w-1.5 h-1.5 bg-red-400 rounded-full mr-2.5"></div>结束时间
                            </div>
                            <input 
                                v-model="trackEndTime"
                                type="datetime-local"
                                class="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-amber-500 transition-colors font-['Rajdhani']"
                            />
                        </div>

                        <div class="flex gap-2 pt-4 border-t border-dashed border-slate-700/50">
                            <button 
                                @click="handleTrackQuery"
                                :disabled="trackLoading || !trackMmsi || !trackStartTime || !trackEndTime"
                                class="flex-1 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-slate-700 disabled:to-slate-600 text-white font-bold rounded-sm transition-all shadow-[0_0_15px_rgba(251,191,36,0.3)] disabled:shadow-none"
                            >
                                {{ trackLoading ? '查询中...' : '查询轨迹' }}
                            </button>
                            <button 
                                v-if="trackResult"
                                @click="handleClearTrack"
                                class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-sm transition-all"
                            >
                                清除
                            </button>
                        </div>

                        <div v-if="trackResult || trackError" class="space-y-2 pt-4 border-t border-dashed border-slate-700/50">
                            <div class="text-amber-400 text-base font-bold flex items-center">
                                <div class="w-1.5 h-1.5 bg-amber-400 rounded-full mr-2.5"></div>查询结果
                            </div>

                            <div v-if="trackError" class="p-4 bg-red-900/30 border border-red-500/50 rounded-sm">
                                <div class="text-red-400 text-sm">{{ trackError }}</div>
                            </div>

                            <div v-else-if="trackResult" class="bg-slate-800/40 border border-amber-500/50 rounded-sm p-4 space-y-3">
                                <div class="flex items-center justify-between">
                                    <span class="text-slate-400 text-sm">轨迹点数</span>
                                    <span class="text-amber-400 font-bold text-lg font-['Rajdhani']">{{ trackResult.pointCount }} 个</span>
                                </div>
                                <div class="flex items-center justify-between border-t border-slate-700/50 pt-2">
                                    <span class="text-slate-400 text-sm">MMSI</span>
                                    <span class="text-white font-['Rajdhani']">{{ trackResult.mmsi }}</span>
                                </div>
                                <div class="flex items-center justify-between border-t border-slate-700/50 pt-2">
                                    <span class="text-slate-400 text-sm">开始时间</span>
                                    <span class="text-slate-400 text-xs">{{ new Date(trackResult.startTime).toLocaleString('zh-CN') }}</span>
                                </div>
                                <div class="flex items-center justify-between border-t border-slate-700/50 pt-2">
                                    <span class="text-slate-400 text-sm">结束时间</span>
                                    <span class="text-slate-400 text-xs">{{ new Date(trackResult.endTime).toLocaleString('zh-CN') }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-else class="space-y-4">
                        <div class="flex items-center justify-between border-b border-dashed border-slate-700/50 pb-3">
                            <div class="text-sky-400 text-base font-bold flex items-center">
                                <div class="w-1.5 h-1.5 bg-sky-400 rounded-full mr-2.5"></div>已搜索船舶
                            </div>
                            <button
                                v-if="shipListData.length > 0"
                                @click="handleClearShipList"
                                class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-sm transition-all"
                            >
                                清空列表
                            </button>
                        </div>

                        <div v-if="shipListData.length === 0" class="text-sm text-slate-500 text-center py-8 border border-dashed border-slate-700/50 rounded-sm">
                            暂无船舶，请先执行船舶搜索
                        </div>

                        <div v-else class="space-y-2 max-h-[28rem] overflow-y-auto custom-scrollbar pr-1">
                            <button
                                v-for="ship in shipListData"
                                :key="ship.mmsi"
                                @click="handleShipListRowClick(ship)"
                                class="w-full text-left bg-slate-800/40 border border-sky-500/25 rounded-sm p-3 hover:border-sky-400/50 transition-all"
                            >
                                <div class="flex items-center justify-between gap-3">
                                    <div class="min-w-0">
                                        <div class="text-white font-bold truncate">{{ ship.ship_cnname || ship.ship_name || `MMSI ${ship.mmsi}` }}</div>
                                        <div class="text-xs text-slate-400 mt-1">{{ ship.mmsi }}</div>
                                    </div>
                                    <div class="text-right text-xs text-slate-400">
                                        <div>{{ ship.sog ? `${ship.sog} kn` : '航速未知' }}</div>
                                        <div class="mt-1">{{ ship.last_time || '暂无更新时间' }}</div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
        
        <!-- 2. 航线规划面板 -->
        <transition name="slide-down">
            <div v-if="showRoutePlan" class="tech-panel-enhanced pointer-events-auto relative group flex flex-col max-h-[45vh] panel-clip-path">
                <!-- 动态扫描线 -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse"></div>
                <div class="corner-decoration corner-tl scale-125"></div>
                <div class="corner-decoration corner-tr scale-125"></div>
            
                <!-- 标题 - 固定不滚动 -->
                <div class="flex items-center mb-3 border-b-2 border-purple-500/30 pb-2 px-4 pt-4 flex-shrink-0">
                    <div class="w-1.5 h-5 bg-purple-400 mr-2 shadow-[0_0_10px_#a855f7]"></div>
                    <h3 class="text-xl font-bold text-white tracking-wider flex-1">航线规划</h3>
                </div>

                <!-- 可滚动内容区域 -->
                <div class="overflow-y-auto custom-scrollbar px-4 pb-4 flex-1">
                    <!-- 规划模式选项卡 -->
                    <div class="flex gap-2 mb-3">
                        <button 
                            @click="planMode = 'port'"
                            :class="[
                                'flex-1 px-3 py-1.5 font-bold rounded-sm transition-all text-sm',
                                planMode === 'port' 
                                    ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' 
                                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                            ]"
                        >
                            港到港
                        </button>
                        <button 
                            @click="planMode = 'point'"
                            :class="[
                                'flex-1 px-3 py-1.5 font-bold rounded-sm transition-all text-sm',
                                planMode === 'point' 
                                    ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' 
                                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                            ]"
                        >
                            点到点
                        </button>
                    </div>
                    
                    <!-- 港到港模式 -->
                    <div v-if="planMode === 'port'" class="space-y-3">
                        <!-- 出发港 -->
                        <div class="space-y-1.5">
                            <div class="text-purple-400 text-sm font-bold flex items-center">
                                <div class="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></div>出发港
                            </div>
                            <input 
                                v-model="startPort" 
                                type="text" 
                                placeholder="输入港口代码，如: CNSHA"
                                class="w-full px-3 py-1.5 bg-slate-800/50 border border-slate-700 text-white text-sm rounded-sm focus:outline-none focus:border-purple-500 transition-colors"
                            />
                            <div class="text-xs text-slate-500">提示: 请输入标准五位港口代码</div>
                        </div>
                        
                        <!-- 到达港 -->
                        <div class="space-y-1.5">
                            <div class="text-purple-400 text-sm font-bold flex items-center">
                                <div class="w-1.5 h-1.5 bg-red-400 rounded-full mr-2"></div>到达港
                            </div>
                            <input 
                                v-model="endPort" 
                                type="text" 
                                placeholder="输入港口代码，如: JPYOK"
                                class="w-full px-3 py-1.5 bg-slate-800/50 border border-slate-700 text-white text-sm rounded-sm focus:outline-none focus:border-purple-500 transition-colors"
                            />
                            <div class="text-xs text-slate-500">提示: 请输入标准五位港口代码</div>
                        </div>
                    </div>
                    
                    <!-- 点到点模式 -->
                    <div v-else-if="planMode === 'point'" class="space-y-3">
                        <!-- 起始点 -->
                        <div class="space-y-1.5">
                            <div class="text-purple-400 text-sm font-bold flex items-center">
                                <div class="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></div>起始点
                            </div>
                            <div class="flex gap-1.5">
                                <input 
                                    v-model="startLng" 
                                    type="number" 
                                    step="0.000001"
                                    placeholder="经度"
                                    class="flex-1 px-2 py-1.5 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-purple-500 transition-colors text-xs"
                                />
                                <input 
                                    v-model="startLat" 
                                    type="number" 
                                    step="0.000001"
                                    placeholder="纬度"
                                    class="flex-1 px-2 py-1.5 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-purple-500 transition-colors text-xs"
                                />
                            </div>
                            <button 
                                @click="pickStartPoint"
                                :class="[
                                    'w-full px-2 py-1 text-xs font-bold rounded-sm transition-all',
                                    pickingStart 
                                        ? 'bg-green-600 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse' 
                                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                ]"
                            >
                                {{ pickingStart ? '点击地图选择起点...' : '地图选点' }}
                            </button>
                        </div>
                        
                        <!-- 结束点 -->
                        <div class="space-y-1.5">
                            <div class="text-purple-400 text-sm font-bold flex items-center">
                                <div class="w-1.5 h-1.5 bg-red-400 rounded-full mr-2"></div>结束点
                            </div>
                            <div class="flex gap-1.5">
                                <input 
                                    v-model="endLng" 
                                    type="number" 
                                    step="0.000001"
                                    placeholder="经度"
                                    class="flex-1 px-2 py-1.5 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-purple-500 transition-colors text-xs"
                                />
                                <input 
                                    v-model="endLat" 
                                    type="number" 
                                    step="0.000001"
                                    placeholder="纬度"
                                    class="flex-1 px-2 py-1.5 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-purple-500 transition-colors text-xs"
                                />
                            </div>
                            <button 
                                @click="pickEndPoint"
                                :class="[
                                    'w-full px-2 py-1 text-xs font-bold rounded-sm transition-all',
                                    pickingEnd 
                                        ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse' 
                                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                ]"
                            >
                                {{ pickingEnd ? '点击地图选择终点...' : '地图选点' }}
                            </button>
                        </div>
                        
                        <div class="text-xs text-slate-500 bg-slate-800/30 p-1.5 rounded">
                            提示: 点击"地图选点"后，在地图上点击选择位置
                        </div>
                    </div>
                    
                    <!-- 航线高级配置 -->
                    <div class="space-y-2 pt-3 border-t border-dashed border-slate-700/50">
                        <button 
                            @click="showRouteAdvanced = !showRouteAdvanced"
                            class="w-full flex items-center justify-between text-purple-400 text-xs font-bold hover:text-purple-300 transition-colors"
                        >
                            <div class="flex items-center">
                                <div class="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2"></div>
                                航线高级配置
                            </div>
                            <svg 
                                class="w-3 h-3 transition-transform" 
                                :class="{ 'rotate-180': showRouteAdvanced }"
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        
                        <transition name="slide-down">
                            <div v-if="showRouteAdvanced" class="bg-slate-800/40 border border-purple-500/30 rounded-sm p-2 space-y-3">
                                <!-- 避让点 -->
                                <div class="space-y-1.5">
                                    <div class="text-xs text-slate-300 font-bold flex items-center justify-between">
                                        <span>避让点 (Avoid)</span>
                                        <span class="text-[10px] text-slate-500">最多10个</span>
                                    </div>
                                    <div class="space-y-1.5">
                                        <div v-for="(avoid, index) in avoidPoints" :key="'avoid-' + index" class="flex gap-1">
                                            <input 
                                                v-model="avoid.lng" 
                                                type="number" 
                                                step="0.000001"
                                                placeholder="经度"
                                                class="flex-1 px-1.5 py-1 bg-slate-900/50 border border-slate-600 text-white rounded-sm focus:outline-none focus:border-purple-500 transition-colors text-[10px]"
                                            />
                                            <input 
                                                v-model="avoid.lat" 
                                                type="number" 
                                                step="0.000001"
                                                placeholder="纬度"
                                                class="flex-1 px-1.5 py-1 bg-slate-900/50 border border-slate-600 text-white rounded-sm focus:outline-none focus:border-purple-500 transition-colors text-[10px]"
                                            />
                                            <button 
                                                @click="pickAvoidPoint(index)"
                                                :class="[
                                                    'px-1.5 py-1 text-[10px] font-bold rounded-sm transition-all whitespace-nowrap',
                                                    pickingAvoidIndex === index
                                                        ? 'bg-orange-600 text-white shadow-[0_0_10px_rgba(249,115,22,0.5)] animate-pulse' 
                                                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                                ]"
                                            >
                                                {{ pickingAvoidIndex === index ? '选择中' : '选点' }}
                                            </button>
                                            <button 
                                                @click="removeAvoidPoint(index)"
                                                class="px-1.5 py-1 bg-red-900/50 hover:bg-red-800/50 text-red-400 text-[10px] font-bold rounded-sm transition-all"
                                            >
                                                删除
                                            </button>
                                        </div>
                                    </div>
                                    <button 
                                        v-if="avoidPoints.length < 10"
                                        @click="addAvoidPoint"
                                        class="w-full px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] font-bold rounded-sm transition-all"
                                    >
                                        + 添加避让点
                                    </button>
                                    <div class="text-[10px] text-slate-500">提示: 航线将绕开这些点</div>
                                </div>
                                
                                <!-- 途经点 -->
                                <div class="space-y-1.5">
                                    <div class="text-xs text-slate-300 font-bold flex items-center justify-between">
                                        <span>途经点 (Through)</span>
                                        <span class="text-[10px] text-slate-500">最多30个</span>
                                    </div>
                                    <div class="space-y-1.5">
                                        <div v-for="(through, index) in throughPoints" :key="'through-' + index" class="flex gap-1">
                                            <input 
                                                v-model="through.lng" 
                                                type="number" 
                                                step="0.000001"
                                                placeholder="经度"
                                                class="flex-1 px-1.5 py-1 bg-slate-900/50 border border-slate-600 text-white rounded-sm focus:outline-none focus:border-purple-500 transition-colors text-[10px]"
                                            />
                                            <input 
                                                v-model="through.lat" 
                                                type="number" 
                                                step="0.000001"
                                                placeholder="纬度"
                                                class="flex-1 px-1.5 py-1 bg-slate-900/50 border border-slate-600 text-white rounded-sm focus:outline-none focus:border-purple-500 transition-colors text-[10px]"
                                            />
                                            <button 
                                                @click="pickThroughPoint(index)"
                                                :class="[
                                                    'px-1.5 py-1 text-[10px] font-bold rounded-sm transition-all whitespace-nowrap',
                                                    pickingThroughIndex === index
                                                        ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)] animate-pulse' 
                                                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                                ]"
                                            >
                                                {{ pickingThroughIndex === index ? '选择中' : '选点' }}
                                            </button>
                                            <button 
                                                @click="removeThroughPoint(index)"
                                                class="px-1.5 py-1 bg-red-900/50 hover:bg-red-800/50 text-red-400 text-[10px] font-bold rounded-sm transition-all"
                                            >
                                                删除
                                            </button>
                                        </div>
                                    </div>
                                    <button 
                                        v-if="throughPoints.length < 30"
                                        @click="addThroughPoint"
                                        class="w-full px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] font-bold rounded-sm transition-all"
                                    >
                                        + 添加途经点
                                    </button>
                                    <div class="text-[10px] text-slate-500">提示: 航线将依次经过这些点</div>
                                </div>
                            </div>
                        </transition>
                    </div>
                    
                    <!-- 规划按钮 -->
                    <div class="flex gap-2 pt-3 border-t border-dashed border-slate-700/50">
                        <button 
                            @click="handleRoutePlan"
                            :disabled="routeLoading || (planMode === 'port' ? (!startPort || !endPort) : (!startLng || !startLat || !endLng || !endLat))"
                            class="flex-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:from-slate-700 disabled:to-slate-600 text-white text-sm font-bold rounded-sm transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] disabled:shadow-none"
                        >
                            {{ routeLoading ? '规划中...' : '规划路径' }}
                        </button>
                        <button 
                            v-if="routeResult"
                            @click="handleClearRoute"
                            class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-sm transition-all"
                        >
                            清除
                        </button>
                    </div>
                    
                    <!-- 路径规划结果 -->
                    <div v-if="routeResult || routeError" class="space-y-2 pt-3 border-t border-dashed border-slate-700/50">
                        <div class="text-purple-400 text-sm font-bold flex items-center">
                            <div class="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2"></div>规划结果
                        </div>
                        
                        <!-- 错误提示 -->
                        <div v-if="routeError" class="p-2 bg-red-900/30 border border-red-500/50 rounded-sm">
                            <div class="text-red-400 text-xs">{{ routeError }}</div>
                        </div>
                        
                        <!-- 路径信息 -->
                        <div v-else-if="routeResult" class="bg-slate-800/40 border border-purple-500/50 rounded-sm p-3 space-y-2">
                            <div class="flex items-center justify-between">
                                <span class="text-slate-400 text-xs">航线距离</span>
                                <span class="text-purple-400 font-bold text-sm font-['Rajdhani']">{{ routeResult.distance }} 海里</span>
                            </div>
                            <div class="flex items-center justify-between border-t border-slate-700/50 pt-1.5">
                                <span class="text-slate-400 text-xs">航点数量</span>
                                <span class="text-white text-sm font-['Rajdhani']">{{ routeResult.pointCount }} 个</span>
                            </div>
                            
                            <!-- 船速设置 -->
                            <div class="flex items-center justify-between border-t border-slate-700/50 pt-2">
                                <span class="text-slate-400 text-xs">船速设置</span>
                                <div class="flex items-center gap-2">
                                    <input 
                                        v-model.number="shipSpeed"
                                        type="number"
                                        min="5"
                                        max="30"
                                        step="0.5"
                                        class="w-16 px-2 py-1 bg-slate-800 border border-slate-600 text-white text-xs rounded-sm focus:outline-none focus:border-cyan-500 font-['Rajdhani']"
                                    />
                                    <span class="text-slate-400 text-xs">节</span>
                                </div>
                            </div>
                            
                            <!-- 操作按钮 -->
                            <div class="flex gap-2 pt-2 border-t border-slate-700/50">
                                <button 
                                    @click="handleRouteWeather"
                                    :disabled="weatherLoading"
                                    class="flex-1 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:from-slate-700 disabled:to-slate-600 text-white text-xs font-bold rounded-sm transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:shadow-none"
                                >
                                    {{ weatherLoading ? '分析中...' : '航线气象' }}
                                </button>
                                <button 
                                    @click="handleCancelRoute"
                                    class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-sm transition-all"
                                >
                                    取消
                                </button>
                            </div>
                            
                            <!-- 高级设置 - 气象风险阈值 -->
                            <div class="mt-4 pt-4 border-t border-dashed border-slate-700/50">
                                <button 
                                    @click="showAdvanced = !showAdvanced"
                                    class="w-full flex items-center justify-between text-cyan-400 text-sm font-bold hover:text-cyan-300 transition-colors"
                                >
                                    <div class="flex items-center">
                                        <div class="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-2"></div>
                                        高级设置
                                    </div>
                                    <svg 
                                        class="w-4 h-4 transition-transform" 
                                        :class="{ 'rotate-180': showAdvanced }"
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                
                                <transition name="slide-down">
                                    <div v-if="showAdvanced" class="bg-slate-800/40 border border-cyan-500/30 rounded-sm p-3 space-y-3 mt-2">
                                        <div class="text-xs text-slate-400 mb-2">气象风险阈值设置（采矿船标准）</div>
                                        
                                        <!-- 风速阈值 -->
                                        <div class="space-y-1.5">
                                            <div class="text-xs text-slate-300 font-bold">风速（蒲福风级）</div>
                                            <div class="grid grid-cols-4 gap-1.5 text-xs">
                                                <div>
                                                    <label class="text-slate-400 text-[10px]">安全</label>
                                                    <input v-model.number="thresholds.safe.windBeaufort" type="number" min="0" max="12" class="w-full bg-slate-900/50 border border-slate-600 rounded px-1.5 py-1 text-white text-center text-xs" />
                                                </div>
                                                <div>
                                                    <label class="text-slate-400 text-[10px]">注意</label>
                                                    <input v-model.number="thresholds.caution.windBeaufort" type="number" min="0" max="12" class="w-full bg-slate-900/50 border border-slate-600 rounded px-1.5 py-1 text-white text-center text-xs" />
                                                </div>
                                                <div>
                                                    <label class="text-slate-400 text-[10px]">警告</label>
                                                    <input v-model.number="thresholds.warning.windBeaufort" type="number" min="0" max="12" class="w-full bg-slate-900/50 border border-slate-600 rounded px-1.5 py-1 text-white text-center text-xs" />
                                                </div>
                                                <div>
                                                    <label class="text-slate-400 text-[10px]">危险</label>
                                                    <input v-model.number="thresholds.danger.windBeaufort" type="number" min="0" max="12" class="w-full bg-slate-900/50 border border-slate-600 rounded px-1.5 py-1 text-white text-center text-xs" />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- 浪高阈值 -->
                                        <div class="space-y-1.5">
                                            <div class="text-xs text-slate-300 font-bold">浪高（米）</div>
                                            <div class="grid grid-cols-4 gap-1.5 text-xs">
                                                <div>
                                                    <input v-model.number="thresholds.safe.waveHeight" type="number" min="0" step="0.5" class="w-full bg-slate-900/50 border border-slate-600 rounded px-1.5 py-1 text-white text-center text-xs" />
                                                </div>
                                                <div>
                                                    <input v-model.number="thresholds.caution.waveHeight" type="number" min="0" step="0.5" class="w-full bg-slate-900/50 border border-slate-600 rounded px-1.5 py-1 text-white text-center text-xs" />
                                                </div>
                                                <div>
                                                    <input v-model.number="thresholds.warning.waveHeight" type="number" min="0" step="0.5" class="w-full bg-slate-900/50 border border-slate-600 rounded px-1.5 py-1 text-white text-center text-xs" />
                                                </div>
                                                <div>
                                                    <input v-model.number="thresholds.danger.waveHeight" type="number" min="0" step="0.5" class="w-full bg-slate-900/50 border border-slate-600 rounded px-1.5 py-1 text-white text-center text-xs" />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- 能见度阈值 -->
                                        <div class="space-y-1.5">
                                            <div class="text-xs text-slate-300 font-bold">能见度（米）</div>
                                            <div class="grid grid-cols-4 gap-1.5 text-xs">
                                                <div>
                                                    <input v-model.number="thresholds.safe.visibility" type="number" min="0" step="100" class="w-full bg-slate-900/50 border border-slate-600 rounded px-1.5 py-1 text-white text-center text-xs" />
                                                </div>
                                                <div>
                                                    <input v-model.number="thresholds.caution.visibility" type="number" min="0" step="100" class="w-full bg-slate-900/50 border border-slate-600 rounded px-1.5 py-1 text-white text-center text-xs" />
                                                </div>
                                                <div>
                                                    <input v-model.number="thresholds.warning.visibility" type="number" min="0" step="100" class="w-full bg-slate-900/50 border border-slate-600 rounded px-1.5 py-1 text-white text-center text-xs" />
                                                </div>
                                                <div>
                                                    <input v-model.number="thresholds.danger.visibility" type="number" min="0" step="100" class="w-full bg-slate-900/50 border border-slate-600 rounded px-1.5 py-1 text-white text-center text-xs" />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- 操作按钮 -->
                                        <div class="flex gap-2 pt-2">
                                            <button 
                                                @click="resetThresholds"
                                                class="flex-1 px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-sm transition-all"
                                            >
                                                恢复默认
                                            </button>
                                            <button 
                                                @click="applyThresholds"
                                                class="flex-1 px-2 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-sm transition-all"
                                            >
                                                应用设置
                                            </button>
                                        </div>
                                    </div>
                                </transition>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
        
        <!-- 3. 历史轨迹面板 -->
        <transition name="slide-down">
            <div v-if="showHistoryTrack" class="tech-panel-enhanced pointer-events-auto relative group flex flex-col max-h-[45vh] panel-clip-path">
                <!-- 动态扫描线 -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse"></div>
                <div class="corner-decoration corner-tl scale-125"></div>
                <div class="corner-decoration corner-tr scale-125"></div>
            
                <!-- 标题 - 固定不滚动 -->
                <div class="flex items-center mb-3 border-b-2 border-amber-500/30 pb-2 px-4 pt-4 flex-shrink-0">
                    <div class="w-1.5 h-5 bg-amber-400 mr-2 shadow-[0_0_10px_#fbbf24]"></div>
                    <h3 class="text-xl font-bold text-white tracking-wider flex-1">历史轨迹</h3>
                </div>

                <!-- 可滚动内容区域 -->
                <div class="overflow-y-auto custom-scrollbar px-4 pb-4 flex-1">
                    <div class="space-y-4">
                        <!-- MMSI输入 -->
                        <div class="space-y-2">
                            <div class="text-amber-400 text-base font-bold flex items-center">
                                <div class="w-1.5 h-1.5 bg-amber-400 rounded-full mr-2.5"></div>船舶MMSI
                            </div>
                            <input 
                                v-model="trackMmsi"
                                type="text"
                                placeholder="输入9位MMSI，如：413961925"
                                class="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-amber-500 transition-colors font-['Rajdhani']"
                            />
                        </div>
                        
                        <!-- 快捷时间选择 -->
                        <div class="space-y-2 pt-2 border-t border-dashed border-slate-700/50">
                            <div class="text-amber-400 text-base font-bold flex items-center">
                                <div class="w-1.5 h-1.5 bg-amber-400 rounded-full mr-2.5"></div>快捷选择
                            </div>
                            <div class="grid grid-cols-4 gap-2">
                                <button 
                                    @click="setQuickTime(1)"
                                    class="px-3 py-2 bg-slate-800/50 hover:bg-amber-600/30 border border-slate-700 hover:border-amber-500/50 text-slate-300 hover:text-amber-400 text-xs font-bold rounded-sm transition-all"
                                >
                                    1小时
                                </button>
                                <button 
                                    @click="setQuickTime(6)"
                                    class="px-3 py-2 bg-slate-800/50 hover:bg-amber-600/30 border border-slate-700 hover:border-amber-500/50 text-slate-300 hover:text-amber-400 text-xs font-bold rounded-sm transition-all"
                                >
                                    6小时
                                </button>
                                <button 
                                    @click="setQuickTime(24)"
                                    class="px-3 py-2 bg-slate-800/50 hover:bg-amber-600/30 border border-slate-700 hover:border-amber-500/50 text-slate-300 hover:text-amber-400 text-xs font-bold rounded-sm transition-all"
                                >
                                    24小时
                                </button>
                                <button 
                                    @click="setQuickTime(168)"
                                    class="px-3 py-2 bg-slate-800/50 hover:bg-amber-600/30 border border-slate-700 hover:border-amber-500/50 text-slate-300 hover:text-amber-400 text-xs font-bold rounded-sm transition-all"
                                >
                                    7天
                                </button>
                            </div>
                        </div>
                        
                        <!-- 开始时间 -->
                        <div class="space-y-2 pt-2 border-t border-dashed border-slate-700/50">
                            <div class="text-amber-400 text-base font-bold flex items-center">
                                <div class="w-1.5 h-1.5 bg-green-400 rounded-full mr-2.5"></div>开始时间
                            </div>
                            <input 
                                v-model="trackStartTime"
                                type="datetime-local"
                                class="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-amber-500 transition-colors font-['Rajdhani']"
                            />
                        </div>
                        
                        <!-- 结束时间 -->
                        <div class="space-y-2 pt-2 border-t border-dashed border-slate-700/50">
                            <div class="text-amber-400 text-base font-bold flex items-center">
                                <div class="w-1.5 h-1.5 bg-red-400 rounded-full mr-2.5"></div>结束时间
                            </div>
                            <input 
                                v-model="trackEndTime"
                                type="datetime-local"
                                class="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-sm focus:outline-none focus:border-amber-500 transition-colors font-['Rajdhani']"
                            />
                        </div>
                        
                        <!-- 查询按钮 -->
                        <div class="flex gap-2 pt-4 border-t border-dashed border-slate-700/50">
                            <button 
                                @click="handleTrackQuery"
                                :disabled="trackLoading || !trackMmsi || !trackStartTime || !trackEndTime"
                                class="flex-1 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-slate-700 disabled:to-slate-600 text-white font-bold rounded-sm transition-all shadow-[0_0_15px_rgba(251,191,36,0.3)] disabled:shadow-none"
                            >
                                {{ trackLoading ? '查询中...' : '查询轨迹' }}
                            </button>
                            <button 
                                v-if="trackResult"
                                @click="handleClearTrack"
                                class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-sm transition-all"
                            >
                                清除
                            </button>
                        </div>
                        
                        <!-- 轨迹查询结果 -->
                        <div v-if="trackResult || trackError" class="space-y-2 pt-4 border-t border-dashed border-slate-700/50">
                            <div class="text-amber-400 text-base font-bold flex items-center">
                                <div class="w-1.5 h-1.5 bg-amber-400 rounded-full mr-2.5"></div>查询结果
                            </div>
                            
                            <!-- 错误提示 -->
                            <div v-if="trackError" class="p-4 bg-red-900/30 border border-red-500/50 rounded-sm">
                                <div class="text-red-400 text-sm">{{ trackError }}</div>
                            </div>
                            
                            <!-- 轨迹信息 -->
                            <div v-else-if="trackResult" class="bg-slate-800/40 border border-amber-500/50 rounded-sm p-4 space-y-3">
                                <div class="flex items-center justify-between">
                                    <span class="text-slate-400 text-sm">轨迹点数</span>
                                    <span class="text-amber-400 font-bold text-lg font-['Rajdhani']">{{ trackResult.pointCount }} 个</span>
                                </div>
                                <div class="flex items-center justify-between border-t border-slate-700/50 pt-2">
                                    <span class="text-slate-400 text-sm">MMSI</span>
                                    <span class="text-white font-['Rajdhani']">{{ trackResult.mmsi }}</span>
                                </div>
                                <div class="flex items-center justify-between border-t border-slate-700/50 pt-2">
                                    <span class="text-slate-400 text-sm">时间跨度</span>
                                    <span class="text-slate-400 text-xs">{{ new Date(trackResult.startTime).toLocaleString('zh-CN') }}</span>
                                </div>
                                <div class="flex items-center justify-end">
                                    <span class="text-slate-400 text-xs">至 {{ new Date(trackResult.endTime).toLocaleString('zh-CN') }}</span>
                                </div>
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
import { getSingleShip, getManyShip, planRouteByPort, getShipTrack } from '../utils/shipxyApi.js';
import { DEFAULT_THRESHOLDS } from '../utils/weatherRiskAssessment.js';

export default {
    props: {
        showShipSearch: {
            type: Boolean,
            default: false
        },
        shipListData: {
            type: Array,
            default: () => []
        },
        showRoutePlan: {
            type: Boolean,
            default: false
        },
        showHistoryTrack: {
            type: Boolean,
            default: false
        }
    },
    emits: ['locate', 'routePlanned', 'routeCleared', 'trackLoaded', 'trackCleared', 'routeWeatherAnalysis', 'thresholdsChanged', 'shipListRowClick', 'clearShipList'],
    setup(props, { emit }) {
        // 高级设置
        const showAdvanced = ref(false);
        const thresholds = ref(JSON.parse(JSON.stringify(DEFAULT_THRESHOLDS)));
        const shipPanelTab = ref('query');
        
        // 搜索模式
        const searchMode = ref('single'); // 'single' 或 'multiple'
        
        // 单船搜索相关
        const singleMmsi = ref('');
        const singleLoading = ref(false);
        const singleResult = ref(null);
        const singleError = ref('');
        
        // 多船搜索相关
        const multipleMmsis = ref('');
        const multipleLoading = ref(false);
        const multipleResults = ref([]);
        const multipleError = ref('');
        
        // 航线规划相关
        const planMode = ref('port'); // 'port' 或 'point'
        const startPort = ref('');
        const endPort = ref('');
        const startLng = ref('');
        const startLat = ref('');
        const endLng = ref('');
        const endLat = ref('');
        const pickingStart = ref(false);
        const pickingEnd = ref(false);
        const pickingAvoidIndex = ref(null);
        const pickingThroughIndex = ref(null);
        const showRouteAdvanced = ref(false);
        const avoidPoints = ref([]);
        const throughPoints = ref([]);
        const routeLoading = ref(false);
        const routeResult = ref(null);
        const routeError = ref('');
        const weatherLoading = ref(false);
        const shipSpeed = ref(15); // 船速（节）
        let currentRouteData = null; // 保存当前路径数据
        
        // 历史轨迹相关
        const trackMmsi = ref('');
        const trackStartTime = ref('');
        const trackEndTime = ref('');
        const trackLoading = ref(false);
        const trackResult = ref(null);
        const trackError = ref('');
        
        // 单船搜索
        const handleSingleSearch = async () => {
            if (!singleMmsi.value.trim()) {
                singleError.value = '请输入MMSI';
                return;
            }
            
            const mmsi = parseInt(singleMmsi.value);
            if (isNaN(mmsi) || singleMmsi.value.length !== 9) {
                singleError.value = 'MMSI必须是9位数字';
                return;
            }
            
            singleLoading.value = true;
            singleError.value = '';
            singleResult.value = null;
            
            try {
                const result = await getSingleShip(mmsi);
                if (result.success) {
                    singleResult.value = result.data;
                } else {
                    singleError.value = result.error || '未找到该船舶';
                }
            } catch (err) {
                singleError.value = '搜索失败: ' + err.message;
            } finally {
                singleLoading.value = false;
            }
        };
        
        const handleSingleLocate = () => {
            if (singleResult.value) {
                emit('locate', singleResult.value);
            }
        };
        
        // 多船搜索
        const handleMultipleSearch = async () => {
            if (!multipleMmsis.value.trim()) {
                multipleError.value = '请输入MMSI列表';
                return;
            }
            
            // 解析MMSI列表（支持逗号和换行分隔）
            const mmsiList = multipleMmsis.value
                .split(/[,\n\s]+/)
                .map(m => m.trim())
                .filter(m => m.length === 9 && !isNaN(parseInt(m)))
                .map(m => parseInt(m));
            
            if (mmsiList.length === 0) {
                multipleError.value = '请输入有效的MMSI（9位数字）';
                return;
            }
            
            if (mmsiList.length > 100) {
                multipleError.value = '最多支持100个MMSI';
                return;
            }
            
            multipleLoading.value = true;
            multipleError.value = '';
            multipleResults.value = [];
            
            try {
                const result = await getManyShip(mmsiList);
                if (result.success && result.data) {
                    multipleResults.value = result.data;
                    // 将所有船舶添加到地图
                    result.data.forEach(ship => {
                        emit('locate', ship);
                    });
                } else {
                    multipleError.value = result.error || '搜索失败';
                }
            } catch (err) {
                multipleError.value = '搜索失败: ' + err.message;
            } finally {
                multipleLoading.value = false;
            }
        };
        
        const handleMultipleLocate = (ship) => {
            emit('locate', ship);
        };
        
        const handleClearMultiple = () => {
            multipleResults.value = [];
            multipleError.value = '';
        };

        const handleShipListRowClick = (ship) => {
            emit('shipListRowClick', ship);
        };

        const handleClearShipList = () => {
            emit('clearShipList');
        };
        
        const formatPosition = (lat, lng) => {
            const latDir = lat >= 0 ? 'N' : 'S';
            const lngDir = lng >= 0 ? 'E' : 'W';
            return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
        };
        
        // 航线规划
        const handleRoutePlan = async () => {
            console.log('🗺️ 开始航线规划...');
            console.log('   - 规划模式:', planMode.value);
            
            // 根据模式验证输入
            if (planMode.value === 'port') {
                if (!startPort.value || !endPort.value) {
                    routeError.value = '请输入出发港和到达港代码';
                    console.error('❌ 港口代码为空');
                    return;
                }
            } else if (planMode.value === 'point') {
                if (!startLng.value || !startLat.value || !endLng.value || !endLat.value) {
                    routeError.value = '请输入起点和终点坐标，或使用地图选点';
                    console.error('❌ 坐标为空');
                    return;
                }
            }
            
            routeLoading.value = true;
            routeError.value = '';
            routeResult.value = null;
            
            try {
                console.log('⏳ 调用 API...');
                console.log('   - 避让点数组:', avoidPoints.value);
                console.log('   - 途经点数组:', throughPoints.value);
                let result;
                
                // 构建避让点参数（过滤掉空的点）
                const validAvoidPoints = avoidPoints.value.filter(p => p.lng && p.lat);
                console.log('   - 有效避让点:', validAvoidPoints);
                const avoidParam = validAvoidPoints.length > 0 
                    ? validAvoidPoints.map(p => `${p.lng},${p.lat}`).join(',')
                    : '';
                
                // 构建途经点参数（过滤掉空的点）
                const validThroughPoints = throughPoints.value.filter(p => p.lng && p.lat);
                console.log('   - 有效途经点:', validThroughPoints);
                const throughParam = validThroughPoints.length > 0
                    ? validThroughPoints.map(p => `${p.lng},${p.lat}`).join(' - ')
                    : '';
                
                if (planMode.value === 'port') {
                    // 港到港模式
                    const { planRouteByPort } = await import('../utils/shipxyApi.js');
                    if (avoidParam) console.log('   - 避让点:', avoidParam);
                    if (throughParam) console.log('   - 途经点:', throughParam);
                    result = await planRouteByPort(
                        startPort.value.toUpperCase(),
                        endPort.value.toUpperCase(),
                        avoidParam,
                        throughParam
                    );
                } else {
                    // 点到点模式
                    const { planRouteByPoint } = await import('../utils/shipxyApi.js');
                    const startPoint = `${startLng.value},${startLat.value}`;
                    const endPoint = `${endLng.value},${endLat.value}`;
                    console.log('   - 起点:', startPoint);
                    console.log('   - 终点:', endPoint);
                    if (avoidParam) console.log('   - 避让点:', avoidParam);
                    if (throughParam) console.log('   - 途经点:', throughParam);
                    result = await planRouteByPoint(startPoint, endPoint, avoidParam, throughParam);
                }
                
                console.log('📦 API 返回结果:', result);
                
                if (result.success && result.data) {
                    console.log('✅ 路径规划成功');
                    console.log('   - 距离:', result.data.distance);
                    console.log('   - 航点数:', result.data.route?.length);
                    
                    routeResult.value = {
                        distance: result.data.distance?.toFixed(2) || 0,
                        pointCount: result.data.route?.length || 0
                    };
                    
                    // 保存路径数据供气象分析使用
                    if (planMode.value === 'port') {
                        currentRouteData = {
                            route: result.data.route,
                            distance: result.data.distance,
                            startPort: startPort.value,
                            endPort: endPort.value,
                            mode: 'port'
                        };
                    } else {
                        currentRouteData = {
                            route: result.data.route,
                            distance: result.data.distance,
                            startPoint: { lng: parseFloat(startLng.value), lat: parseFloat(startLat.value) },
                            endPoint: { lng: parseFloat(endLng.value), lat: parseFloat(endLat.value) },
                            mode: 'point'
                        };
                    }
                    
                    console.log('📤 发送 routePlanned 事件');
                    emit('routePlanned', currentRouteData);
                } else {
                    console.error('❌ 路径规划失败:', result.error);
                    if (planMode.value === 'port' && result.error && result.error.includes('未找到')) {
                        routeError.value = `${result.error}。提示：请联系船讯网获取正确的港口代码列表，或查看 docs/港口代码参考.md`;
                    } else {
                        routeError.value = result.error || '路径规划失败，请检查输入是否正确';
                    }
                }
            } catch (err) {
                console.error('❌ 网络错误:', err);
                routeError.value = '网络错误，请稍后重试: ' + err.message;
            } finally {
                routeLoading.value = false;
                console.log('🏁 航线规划流程结束');
            }
        };
        
        const handleClearRoute = () => {
            routeResult.value = null;
            routeError.value = '';
            currentRouteData = null;
            // 清除航线、气象线段、数据面板，取消选中状态
            emit('routeCleared', { clearAll: true });
        };
        
        // 航线气象分析
        const handleRouteWeather = () => {
            if (!currentRouteData) {
                routeError.value = '没有可用的航线数据';
                return;
            }
            
            weatherLoading.value = true;
            
            // 传递船速和起始时间
            emit('routeWeatherAnalysis', {
                ...currentRouteData,
                shipSpeed: shipSpeed.value,
                startTime: new Date()
            });
            
            // 模拟加载完成（实际由地图组件完成后通知）
            setTimeout(() => {
                weatherLoading.value = false;
            }, 3000);
        };
        
        // 取消航线（清除路径和气象数据）
        const handleCancelRoute = () => {
            handleClearRoute();
        };
        
        // 快捷时间选择
        const setQuickTime = (hours) => {
            const now = new Date();
            const start = new Date(now.getTime() - hours * 60 * 60 * 1000);
            
            trackEndTime.value = now.toISOString().slice(0, 16);
            trackStartTime.value = start.toISOString().slice(0, 16);
        };
        
        // 历史轨迹查询
        const handleTrackQuery = async () => {
            if (!trackMmsi.value.trim()) {
                trackError.value = '请输入MMSI';
                return;
            }
            
            const mmsi = parseInt(trackMmsi.value);
            if (isNaN(mmsi) || trackMmsi.value.length !== 9) {
                trackError.value = 'MMSI必须是9位数字';
                return;
            }
            
            if (!trackStartTime.value || !trackEndTime.value) {
                trackError.value = '请选择时间范围';
                return;
            }
            
            const startTimestamp = Math.floor(new Date(trackStartTime.value).getTime() / 1000);
            const endTimestamp = Math.floor(new Date(trackEndTime.value).getTime() / 1000);
            
            if (startTimestamp >= endTimestamp) {
                trackError.value = '开始时间必须早于结束时间';
                return;
            }
            
            trackLoading.value = true;
            trackError.value = '';
            trackResult.value = null;
            
            try {
                const result = await getShipTrack(mmsi, startTimestamp, endTimestamp);
                
                if (result.success && result.data && result.data.length > 0) {
                    trackResult.value = {
                        pointCount: result.data.length,
                        startTime: trackStartTime.value,
                        endTime: trackEndTime.value,
                        mmsi: mmsi
                    };
                    
                    emit('trackLoaded', {
                        mmsi: mmsi,
                        track: result.data,
                        startTime: startTimestamp,
                        endTime: endTimestamp
                    });
                } else {
                    trackError.value = result.error || '该时间段内没有轨迹数据';
                }
            } catch (err) {
                trackError.value = '查询失败: ' + err.message;
            } finally {
                trackLoading.value = false;
            }
        };
        
        const handleClearTrack = () => {
            trackResult.value = null;
            trackError.value = '';
            emit('trackCleared');
        };
        
        // 地图选点功能
        const pickStartPoint = () => {
            if (pickingStart.value) {
                // 取消选点
                pickingStart.value = false;
                emit('pickPoint', { type: 'cancel' });
            } else {
                // 开始选点
                pickingStart.value = true;
                pickingEnd.value = false; // 取消终点选择
                emit('pickPoint', { type: 'start' });
            }
        };
        
        const pickEndPoint = () => {
            if (pickingEnd.value) {
                // 取消选点
                pickingEnd.value = false;
                emit('pickPoint', { type: 'cancel' });
            } else {
                // 开始选点
                pickingEnd.value = true;
                pickingStart.value = false; // 取消起点选择
                emit('pickPoint', { type: 'end' });
            }
        };
        
        // 接收地图选点结果（由父组件调用）
        const setPickedPoint = (lng, lat, type) => {
            if (type === 'start') {
                startLng.value = lng.toFixed(6);
                startLat.value = lat.toFixed(6);
                pickingStart.value = false;
            } else if (type === 'end') {
                endLng.value = lng.toFixed(6);
                endLat.value = lat.toFixed(6);
                pickingEnd.value = false;
            } else if (type === 'avoid' && pickingAvoidIndex.value !== null) {
                const index = pickingAvoidIndex.value;
                if (avoidPoints.value[index]) {
                    avoidPoints.value[index].lng = lng.toFixed(6);
                    avoidPoints.value[index].lat = lat.toFixed(6);
                }
                pickingAvoidIndex.value = null;
            } else if (type === 'through' && pickingThroughIndex.value !== null) {
                const index = pickingThroughIndex.value;
                if (throughPoints.value[index]) {
                    throughPoints.value[index].lng = lng.toFixed(6);
                    throughPoints.value[index].lat = lat.toFixed(6);
                }
                pickingThroughIndex.value = null;
            }
        };
        
        // 避让点管理
        const addAvoidPoint = () => {
            if (avoidPoints.value.length < 10) {
                avoidPoints.value.push({ lng: '', lat: '' });
            }
        };
        
        const removeAvoidPoint = (index) => {
            avoidPoints.value.splice(index, 1);
            if (pickingAvoidIndex.value === index) {
                pickingAvoidIndex.value = null;
                emit('pickPoint', { type: 'cancel' });
            }
        };
        
        const pickAvoidPoint = (index) => {
            if (pickingAvoidIndex.value === index) {
                // 取消选择
                pickingAvoidIndex.value = null;
                emit('pickPoint', { type: 'cancel' });
            } else {
                // 开始选择
                pickingAvoidIndex.value = index;
                pickingStart.value = false;
                pickingEnd.value = false;
                pickingThroughIndex.value = null;
                emit('pickPoint', { type: 'avoid' });
            }
        };
        
        // 途经点管理
        const addThroughPoint = () => {
            if (throughPoints.value.length < 30) {
                throughPoints.value.push({ lng: '', lat: '' });
            }
        };
        
        const removeThroughPoint = (index) => {
            throughPoints.value.splice(index, 1);
            if (pickingThroughIndex.value === index) {
                pickingThroughIndex.value = null;
                emit('pickPoint', { type: 'cancel' });
            }
        };
        
        const pickThroughPoint = (index) => {
            if (pickingThroughIndex.value === index) {
                // 取消选择
                pickingThroughIndex.value = null;
                emit('pickPoint', { type: 'cancel' });
            } else {
                // 开始选择
                pickingThroughIndex.value = index;
                pickingStart.value = false;
                pickingEnd.value = false;
                pickingAvoidIndex.value = null;
                emit('pickPoint', { type: 'through' });
            }
        };
        
        // 恢复默认阈值
        const resetThresholds = () => {
            thresholds.value = JSON.parse(JSON.stringify(DEFAULT_THRESHOLDS));
        };
        
        // 应用阈值设置
        const applyThresholds = () => {
            console.log('🔧 ShipTrackingPanel 发出阈值变化事件:', thresholds.value);
            emit('thresholdsChanged', thresholds.value);
            // 应用成功后折叠高级设置
            showAdvanced.value = false;
        };
        
        return {
            shipPanelTab,
            searchMode,
            singleMmsi,
            singleLoading,
            singleResult,
            singleError,
            handleSingleSearch,
            handleSingleLocate,
            multipleMmsis,
            multipleLoading,
            multipleResults,
            multipleError,
            handleMultipleSearch,
            handleMultipleLocate,
            handleClearMultiple,
            handleShipListRowClick,
            handleClearShipList,
            formatPosition,
            planMode,
            startPort,
            endPort,
            startLng,
            startLat,
            endLng,
            endLat,
            pickingStart,
            pickingEnd,
            pickingAvoidIndex,
            pickingThroughIndex,
            showRouteAdvanced,
            avoidPoints,
            throughPoints,
            pickStartPoint,
            pickEndPoint,
            setPickedPoint,
            addAvoidPoint,
            removeAvoidPoint,
            pickAvoidPoint,
            addThroughPoint,
            removeThroughPoint,
            pickThroughPoint,
            routeLoading,
            routeResult,
            routeError,
            weatherLoading,
            shipSpeed,
            handleRoutePlan,
            handleClearRoute,
            handleRouteWeather,
            handleCancelRoute,
            trackMmsi,
            trackStartTime,
            trackEndTime,
            trackLoading,
            trackResult,
            trackError,
            setQuickTime,
            handleTrackQuery,
            handleClearTrack,
            showAdvanced,
            thresholds,
            resetThresholds,
            applyThresholds
        };
    }
};
</script>

<style scoped>
/* 面板裁剪路径 */
.panel-clip-path {
    clip-path: polygon(0 0, 100% 0, 100% 95%, 92% 100%, 0 100%);
}

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

/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.5);
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(6, 182, 212, 0.6), rgba(6, 182, 212, 0.3));
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, rgba(6, 182, 212, 0.9), rgba(6, 182, 212, 0.6));
}

.quick-track-btn {
    padding: 0.5rem 0.75rem;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(71, 85, 105, 0.8);
    color: #cbd5e1;
    font-size: 0.75rem;
    font-weight: 700;
    border-radius: 0.125rem;
    transition: all 0.2s ease;
}

.quick-track-btn:hover {
    color: #fbbf24;
    border-color: rgba(245, 158, 11, 0.55);
    background: rgba(217, 119, 6, 0.15);
}
</style>
