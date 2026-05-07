<template>
    <div class="absolute w-full z-0 map-container-wrapper" style="top: 110px; bottom: 0; height: calc(100% - 110px);">
        <!-- 背景图层 -->
        <div class="map-bg-layer"></div>
        
        <!-- Cesium Container -->
        <div ref="cesiumContainer" class="w-full h-full absolute inset-0"></div>

        <!-- Grid Overlay -->
        <div class="absolute inset-0 pointer-events-none opacity-10 z-10" 
             style="background: linear-gradient(var(--grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color) 1px, transparent 1px); background-size: 100px 100px;"></div>

        <!-- 自定义地图工具栏 -->
        <transition name="toolbar-slide">
            <div v-if="showToolbar" class="absolute top-[10rem] right-[15.5rem] z-[100] flex flex-col gap-2 pointer-events-auto">
                <!-- 放大 -->
                <button @click="zoomIn" class="map-tool-btn group" title="放大">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"/>
                    </svg>
                </button>
                
                <!-- 缩小 -->
                <button @click="zoomOut" class="map-tool-btn group" title="缩小">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"/>
                    </svg>
                </button>
                
                <!-- 复位视角 -->
                <button @click="resetView" class="map-tool-btn group" title="复位视角">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                    </svg>
                </button>
                
                <!-- 2D/3D 切换 -->
                <button @click="toggle2D3D" class="map-tool-btn group" :title="is3D ? '切换至2D' : '切换至3D'">
                    <svg v-if="is3D" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                    </svg>
                    <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
                    </svg>
                </button>
                
                <!-- 全屏 -->
                <button @click="toggleFullscreen" class="map-tool-btn group" title="全屏">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                    </svg>
                </button>
            </div>
        </transition>

        <!-- Info Window Modal -->
        <transition enter-active-class="animate-fadeIn" leave-active-class="transition-opacity duration-200 opacity-0">
            <div v-if="selectedArea" 
                :style="{ 
                    left: infoPosition.x + 'px', 
                    top: infoPosition.y + 'px' 
                }"
                class="absolute w-[20rem] bg-slate-950/90 backdrop-blur-xl border-2 border-cyan-500/50 text-white shadow-[0_0_40px_rgba(0,0,0,0.8)] z-50" 
                style="clip-path: polygon(0 0, 100% 0, 100% 92%, 92% 100%, 0 100%)">
                <!-- Scanning Line -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-pulse"></div>

                <!-- Header -->
                <div class="flex items-center justify-between bg-gradient-to-r from-cyan-900/60 to-transparent px-4 py-3 border-b border-cyan-500/30">
                    <div class="flex items-center gap-3">
                         <div class="w-2 h-2 bg-yellow-400 rotate-45 shadow-[0_0_6px_#facc15]"></div>
                         <span class="font-bold text-lg text-white tracking-wide font-['Noto_Sans_SC']">矿区信息</span>
                    </div>
                    <button @click="closeInfo" class="group p-1">
                        <div class="w-6 h-6 border border-cyan-500/50 flex items-center justify-center rounded-sm group-hover:bg-cyan-500 group-hover:text-black transition-colors text-sm">✕</div>
                    </button>
                </div>
                
                <!-- Content -->
                <div class="p-4 space-y-3 relative">
                    <div class="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                    
                    <div v-for="(val, key) in {
                        'ID': selectedArea.id,
                        '承包者': selectedArea.contractor,
                        '担保国': selectedArea.sponsor,
                        '矿种类型': selectedArea.mineral,
                        '矿区位置': selectedArea.location,
                        '合同期限': selectedArea.dateRange,
                        '合同区面积': selectedArea.area
                    }" :key="key" class="relative flex justify-between items-center border-b border-slate-700/50 pb-2 last:border-0 group hover:bg-white/5 px-2 rounded transition-colors">
                        <span class="text-cyan-300/80 text-sm font-medium">{{ key }}</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide text-right max-w-[60%] truncate" :title="val">{{ val }}</span>
                    </div>
                    
                    <!-- 监测按钮 -->
                    <div class="pt-3 border-t border-cyan-500/30 relative z-10">
                        <button 
                            @click="addToMonitoring"
                            class="w-full px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white font-bold rounded-sm transition-all shadow-lg hover:shadow-cyan-500/50 flex items-center justify-center gap-2 pointer-events-auto cursor-pointer"
                        >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                            <span>加入气象监测</span>
                        </button>
                    </div>
                </div>
            </div>
        </transition>

        <!-- Ship Info Window Modal -->
        <transition enter-active-class="animate-fadeIn" leave-active-class="transition-opacity duration-200 opacity-0">
            <div v-if="selectedShip" 
                :style="{ 
                    left: shipInfoPosition.x + 'px', 
                    top: shipInfoPosition.y + 'px' 
                }"
                class="absolute w-[22rem] bg-slate-950/95 backdrop-blur-xl border-2 border-yellow-500/50 text-white shadow-[0_0_40px_rgba(0,0,0,0.8)] z-50" 
                style="clip-path: polygon(0 0, 100% 0, 100% 92%, 92% 100%, 0 100%)">
                <!-- Scanning Line -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>

                <!-- Header -->
                <div class="flex items-center justify-between bg-gradient-to-r from-yellow-900/60 to-transparent px-4 py-3 border-b border-yellow-500/30">
                    <div class="flex items-center gap-3">
                         <div class="w-2 h-2 bg-cyan-400 rotate-45 shadow-[0_0_6px_#22d3ee]"></div>
                         <span class="font-bold text-lg text-white tracking-wide font-['Noto_Sans_SC']">🚢 船舶信息</span>
                    </div>
                    <button @click="closeShipInfo" class="group p-1">
                        <div class="w-6 h-6 border border-yellow-500/50 flex items-center justify-center rounded-sm group-hover:bg-yellow-500 group-hover:text-black transition-colors text-sm">✕</div>
                    </button>
                </div>
                
                <!-- Content -->
                <div class="p-4 space-y-3 relative">
                    <div class="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                    
                    <!-- 船舶名称 -->
                    <div class="flex justify-between items-center py-2 border-b border-yellow-500/20 relative z-10">
                        <span class="text-yellow-400/80 font-['Rajdhani'] text-sm tracking-wider">船舶名称</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide text-right max-w-[60%] truncate">
                            {{ selectedShip.ship_cnname || selectedShip.ship_name }}
                        </span>
                    </div>
                    
                    <!-- 船舶类型 -->
                    <div class="flex justify-between items-center py-2 border-b border-yellow-500/20 relative z-10">
                        <span class="text-yellow-400/80 font-['Rajdhani'] text-sm tracking-wider">船舶类型</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide">
                            {{ getShipTypeName(selectedShip.ship_type) }}
                        </span>
                    </div>
                    
                    <!-- 船长 -->
                    <div class="flex justify-between items-center py-2 border-b border-yellow-500/20 relative z-10">
                        <span class="text-yellow-400/80 font-['Rajdhani'] text-sm tracking-wider">船长</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide">
                            {{ selectedShip.length ? selectedShip.length + 'm' : 'N/A' }}
                        </span>
                    </div>
                    
                    <!-- 船宽 -->
                    <div class="flex justify-between items-center py-2 border-b border-yellow-500/20 relative z-10">
                        <span class="text-yellow-400/80 font-['Rajdhani'] text-sm tracking-wider">船宽</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide">
                            {{ selectedShip.width ? selectedShip.width + 'm' : 'N/A' }}
                        </span>
                    </div>
                    
                    <!-- 航速 -->
                    <div class="flex justify-between items-center py-2 border-b border-yellow-500/20 relative z-10">
                        <span class="text-yellow-400/80 font-['Rajdhani'] text-sm tracking-wider">航速</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide">
                            {{ selectedShip.sog ? selectedShip.sog + ' kn' : 'N/A' }}
                        </span>
                    </div>
                    
                    <!-- 载重 -->
                    <div class="flex justify-between items-center py-2 border-b border-yellow-500/20 relative z-10">
                        <span class="text-yellow-400/80 font-['Rajdhani'] text-sm tracking-wider">载重</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide">
                            {{ selectedShip.draught ? selectedShip.draught + 'm' : 'N/A' }}
                        </span>
                    </div>
                    
                    <!-- 目的港 -->
                    <div class="flex justify-between items-center py-2 border-b border-yellow-500/20 relative z-10">
                        <span class="text-yellow-400/80 font-['Rajdhani'] text-sm tracking-wider">目的港</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide text-right max-w-[60%] truncate">
                            {{ selectedShip.dest || 'N/A' }}
                        </span>
                    </div>
                    
                    <!-- 预计到达 - 带过期提示 -->
                    <div class="flex justify-between items-center py-2 border-b border-yellow-500/20 relative z-10">
                        <span class="text-yellow-400/80 font-['Rajdhani'] text-sm tracking-wider">预计到达</span>
                        <div class="text-right">
                            <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide">
                                {{ selectedShip.eta || 'N/A' }}
                            </span>
                            <div v-if="isEtaExpired(selectedShip.eta, selectedShip.last_time)" class="text-xs text-orange-400 mt-0.5">
                                ⚠️ 已过期
                            </div>
                        </div>
                    </div>
                    
                    <!-- 最后更新 -->
                    <div class="flex justify-between items-center py-2 border-b border-yellow-500/20 relative z-10">
                        <span class="text-yellow-400/80 font-['Rajdhani'] text-sm tracking-wider">最后更新</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide">
                            {{ selectedShip.last_time || 'N/A' }}
                        </span>
                    </div>
                    
                    <!-- 状态 -->
                    <div class="flex justify-between items-center py-2 relative z-10">
                        <span class="text-yellow-400/80 font-['Rajdhani'] text-sm tracking-wider">状态</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide">
                            {{ getNavigationStatus(selectedShip.navistat) }}
                        </span>
                    </div>
                </div>
            </div>
        </transition>
        
        <!-- Drilling Info Window Modal -->
        <transition enter-active-class="animate-fadeIn" leave-active-class="transition-opacity duration-200 opacity-0">
            <div v-if="selectedDrilling" 
                :style="{ 
                    left: drillingInfoPosition.x + 'px', 
                    top: drillingInfoPosition.y + 'px' 
                }"
                class="absolute w-[22rem] bg-slate-950/95 backdrop-blur-xl border-2 border-cyan-500/50 text-white shadow-[0_0_40px_rgba(0,0,0,0.8)] z-50" 
                style="clip-path: polygon(0 0, 100% 0, 100% 92%, 92% 100%, 0 100%)">
                <!-- Scanning Line -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>

                <!-- Header -->
                <div class="flex items-center justify-between bg-gradient-to-r from-cyan-900/60 to-transparent px-4 py-3 border-b border-cyan-500/30">
                    <div class="flex items-center gap-3">
                         <div class="w-2 h-2 bg-cyan-400 rotate-45 shadow-[0_0_6px_#22d3ee]"></div>
                         <span class="font-bold text-lg text-white tracking-wide font-['Noto_Sans_SC']">🔍 钻孔信息</span>
                    </div>
                    <button @click="closeDrillingInfo" class="group p-1">
                        <div class="w-6 h-6 border border-cyan-500/50 flex items-center justify-center rounded-sm group-hover:bg-cyan-500 group-hover:text-black transition-colors text-sm">✕</div>
                    </button>
                </div>
                
                <!-- Content -->
                <div class="p-4 space-y-3 relative">
                    <div class="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                    
                    <!-- 钻孔编号 -->
                    <div class="flex justify-between items-center py-2 border-b border-cyan-500/20 relative z-10">
                        <span class="text-cyan-400/80 font-['Rajdhani'] text-sm tracking-wider">钻孔编号</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide text-right max-w-[60%] truncate">
                            {{ selectedDrilling.code }}
                        </span>
                    </div>
                    
                    <!-- 航次 -->
                    <div class="flex justify-between items-center py-2 border-b border-cyan-500/20 relative z-10">
                        <span class="text-cyan-400/80 font-['Rajdhani'] text-sm tracking-wider">航次</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide">
                            {{ selectedDrilling.voyage }}
                        </span>
                    </div>
                    
                    <!-- 钻探平台 -->
                    <div class="flex justify-between items-center py-2 border-b border-cyan-500/20 relative z-10">
                        <span class="text-cyan-400/80 font-['Rajdhani'] text-sm tracking-wider">钻探平台</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide">
                            {{ selectedDrilling.platform }}
                        </span>
                    </div>
                    
                    <!-- 所属计划 -->
                    <div class="flex justify-between items-center py-2 border-b border-cyan-500/20 relative z-10">
                        <span class="text-cyan-400/80 font-['Rajdhani'] text-sm tracking-wider">所属计划</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide">
                            {{ selectedDrilling.program }}
                        </span>
                    </div>
                    
                    <!-- 经度 -->
                    <div class="flex justify-between items-center py-2 border-b border-cyan-500/20 relative z-10">
                        <span class="text-cyan-400/80 font-['Rajdhani'] text-sm tracking-wider">经度</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide">
                            {{ selectedDrilling.longitude }}°
                        </span>
                    </div>
                    
                    <!-- 纬度 -->
                    <div class="flex justify-between items-center py-2 relative z-10">
                        <span class="text-cyan-400/80 font-['Rajdhani'] text-sm tracking-wider">纬度</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide">
                            {{ selectedDrilling.latitude }}°
                        </span>
                    </div>
                </div>
            </div>
        </transition>
        
        <!-- Cable Info Window Modal -->
        <transition enter-active-class="animate-fadeIn" leave-active-class="transition-opacity duration-200 opacity-0">
            <div v-if="selectedCable" 
                :style="{ 
                    left: cableInfoPosition.x + 'px', 
                    top: cableInfoPosition.y + 'px' 
                }"
                class="absolute w-[22rem] bg-slate-950/95 backdrop-blur-xl border-2 border-cyan-500/50 text-white shadow-[0_0_40px_rgba(0,0,0,0.8)] z-50" 
                style="clip-path: polygon(0 0, 100% 0, 100% 92%, 92% 100%, 0 100%)">
                <!-- Scanning Line -->
                <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>

                <!-- Header -->
                <div class="flex items-center justify-between bg-gradient-to-r from-cyan-900/60 to-transparent px-4 py-3 border-b border-cyan-500/30">
                    <div class="flex items-center gap-3">
                         <div class="w-2 h-2 bg-cyan-400 rotate-45 shadow-[0_0_6px_#22d3ee]"></div>
                         <span class="font-bold text-lg text-white tracking-wide font-['Noto_Sans_SC']">🌐 光缆信息</span>
                    </div>
                    <button @click="closeCableInfo" class="group p-1">
                        <div class="w-6 h-6 border border-cyan-500/50 flex items-center justify-center rounded-sm group-hover:bg-cyan-500 group-hover:text-black transition-colors text-sm">✕</div>
                    </button>
                </div>
                
                <!-- Content -->
                <div class="p-4 space-y-3 relative">
                    <div class="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                    
                    <!-- 光缆名称 -->
                    <div class="flex justify-between items-center py-2 border-b border-cyan-500/20 relative z-10">
                        <span class="text-cyan-400/80 font-['Rajdhani'] text-sm tracking-wider">光缆名称</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide text-right max-w-[60%] truncate">
                            {{ selectedCable.name }}
                        </span>
                    </div>
                    
                    <!-- 容量 -->
                    <div class="flex justify-between items-center py-2 border-b border-cyan-500/20 relative z-10">
                        <span class="text-cyan-400/80 font-['Rajdhani'] text-sm tracking-wider">容量</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide">
                            {{ selectedCable.capacity }} Gbps
                        </span>
                    </div>
                    
                    <!-- 长度 -->
                    <div class="flex justify-between items-center py-2 border-b border-cyan-500/20 relative z-10">
                        <span class="text-cyan-400/80 font-['Rajdhani'] text-sm tracking-wider">长度</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide">
                            {{ selectedCable.distance.toLocaleString() }} km
                        </span>
                    </div>
                    
                    <!-- 投入使用 -->
                    <div class="flex justify-between items-center py-2 border-b border-cyan-500/20 relative z-10">
                        <span class="text-cyan-400/80 font-['Rajdhani'] text-sm tracking-wider">投入使用</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide">
                            {{ selectedCable.inService }}
                        </span>
                    </div>
                    
                    <!-- 状态 -->
                    <div class="flex justify-between items-center py-2 relative z-10">
                        <span class="text-cyan-400/80 font-['Rajdhani'] text-sm tracking-wider">状态</span>
                        <span class="text-white font-['Rajdhani'] font-bold text-sm tracking-wide"
                              :class="selectedCable.status === '运营中' ? 'text-green-400' : 'text-gray-400'">
                            {{ selectedCable.status }}
                        </span>
                    </div>
                    
                    <!-- 官网链接 -->
                    <div v-if="selectedCable.url" class="pt-3 border-t border-cyan-500/30 relative z-10">
                        <a :href="selectedCable.url" target="_blank"
                           class="w-full px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white font-bold rounded-sm transition-all shadow-lg hover:shadow-cyan-500/50 flex items-center justify-center gap-2 pointer-events-auto cursor-pointer block text-center">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                            </svg>
                            <span>查看详情</span>
                        </a>
                    </div>
                </div>
            </div>
        </transition>
        
        <!-- 路径规划面板 -->
        <RoutePlanPanel 
            :show="showRoutePlan"
            @close="showRoutePlan = false"
            @routePlanned="handleRoutePlanned"
            @routeCleared="handleRouteCleared"
            @pickPoint="handlePickPoint"
            @thresholdsChanged="handleThresholdsChanged"
        />
        
        <!-- 气象点查询 -->
        <WeatherPointPicker
            :pickedPoint="weatherPickedPoint"
            :currentLayer="currentWeatherLayer"
            :weatherData="weatherDataCache"
            :timeSteps="weatherTimeSteps"
            :currentTimeIndex="currentTimeIndex"
            @close="closeWeatherPicker"
        />
        
        <!-- 科考站信息弹窗 -->
        <StationInfoPopup
            :show="showStationInfo"
            :stationInfo="selectedStation"
            :position="stationInfoPosition"
            @close="closeStationInfo"
        />
        
        <!-- 岩心库信息弹窗 -->
        <CoreRepositoryPopup
            :show="showCoreRepositoryPopup"
            :repositoryData="selectedCoreRepository || {}"
            @close="closeCoreRepositoryPopup"
        />
        
        <!-- 岩心库图表 -->
        <CoreRepositoryCharts
            :show="true"
            :selectedCountry="currentSelectedCountry"
        />
        
        <!-- 科考站国家图例 - 暂时隐藏 -->
        <!-- <StationCountryLegend
            :show="showStationLegend"
            :countries="stationCountries"
            @close="showStationLegend = false"
        /> -->
    </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { loadGeoJson } from '../utils/geoJsonLoader.js';
import { getContractorColor } from '../utils/contractorColors.js';
import { ViewportGeoJsonManager } from '../utils/viewportGeoJsonManager.js';
import { RARE_EARTH_ZONES, COUNTRY_ATTITUDES } from '../constants.js';
import {
    MINERAL_IMPORT_COUNTRY_ALIAS,
    getMineralImportById,
    getMineralImportCategoryById,
    getMineralImportCommodityColor,
    getMineralImportCountryFlagUrl
} from '../data/mineralImportData.js';

const USA_MARINE_LAYER_CONFIG = {
    marine_shelf_boundary: {
        name: '大陆架边界',
        url: new URL('../data/USA/csb.geojson', import.meta.url).href,
        stroke: Cesium.Color.fromCssColorString('#67e8f9'),
        fill: Cesium.Color.fromCssColorString('#38bdf8').withAlpha(0.03),
        strokeWidth: 4.2,
        zIndex: 12
    },
    marine_zone_boundary: {
        name: '区界',
        url: new URL('../data/USA/district.geojson', import.meta.url).href,
        stroke: Cesium.Color.fromCssColorString('#22c55e'),
        fill: Cesium.Color.fromCssColorString('#22c55e').withAlpha(0.08),
        strokeWidth: 2.2,
        zIndex: 8
    },
    marine_main_route: {
        name: '主要航道',
        url: new URL('../data/USA/Fairways.geojson', import.meta.url).href,
        stroke: Cesium.Color.fromCssColorString('#fbbf24'),
        fill: Cesium.Color.fromCssColorString('#f59e0b').withAlpha(0.22),
        strokeWidth: 3.6,
        zIndex: 18
    }
};

const USA_DISTRICT_COLOR_MAP = {
    1: '#cfa3f3',
    2: '#dff56d',
    3: '#74d3f5',
    4: '#f58ca0',
    5: '#f6b35f'
};

// const JAPAN_MARINE_GEOLOGY_LAYER_CONFIG = {
//     geo_japan_marine_20w: {
//         name: '日本1：20万海洋地质',
//         sources: [
//             {
//                 id: 'japan_200000',
//                 name: '日本1：20万海洋地质面',
//                 url: encodeURI('/data/地质调查/Japan/Japan200000.geojson'),
//                 stroke: Cesium.Color.fromCssColorString('#ef4444'),
//                 fill: Cesium.Color.TRANSPARENT,
//                 strokeWidth: 2.5,
//                 zIndex: 22
//             },
//             {
//                 id: 'japan_area',
//                 name: '日本1：20万海洋地质范围',
//                 url: encodeURI('/data/地质调查/Japan/JapanArea.geojson'),
//                 stroke: Cesium.Color.fromCssColorString('#facc15'),
//                 fill: Cesium.Color.fromCssColorString('#facc15').withAlpha(0.04),
//                 strokeWidth: 3.4,
//                 zIndex: 28
//             }
//         ]
//     }
// };

const JAPAN_GEOLOGY_TILE_LAYER_CONFIG = {
    geo_uk_1w: {
        name: '英国1：10000地质图',
        url: '/data/geology/uk/10k/{z}/{x}/{y}.png',
        minimumLevel: 0,
        maximumLevel: 8,
        alpha: 0.86,
        brightness: 1.05,
        contrast: 1.08
    },
    geo_uk_2_5w: {
        name: '英国1：25000地质图',
        url: '/data/geology/uk/25k/{z}/{x}/{y}.png',
        minimumLevel: 0,
        maximumLevel: 8,
        alpha: 0.86,
        brightness: 1.05,
        contrast: 1.08
    },
    geo_uk_5w: {
        name: '英国1：50000地质图',
        url: '/data/geology/uk/50k/{z}/{x}/{y}.png',
        minimumLevel: 0,
        maximumLevel: 8,
        alpha: 0.86,
        brightness: 1.05,
        contrast: 1.08
    },
    geo_japan_marine_20w: {
        name: '日本1：20万海洋地质',
        url: '/data/geology/japan/marine20w/{z}/{x}/{y}.png',
        minimumLevel: 0,
        maximumLevel: 8,
        alpha: 0.86,
        brightness: 1.05,
        contrast: 1.08
    },
    geo_japan_marine_sediment_20w: {
        name: '日本1：20万沉积图',
        url: '/data/geology/japan/marine_sediment20w/{z}/{x}/{y}.png',
        minimumLevel: 0,
        maximumLevel: 8,
        alpha: 0.86,
        brightness: 1.05,
        contrast: 1.08
    },
    geo_japan_5w: {
        name: '日本1：5万地质图',
        url: '/data/geology/japan/50k/{z}/{x}/{y}.png',
        minimumLevel: 0,
        maximumLevel: 8,
        alpha: 0.86,
        brightness: 1.05,
        contrast: 1.08
    },
    geo_japan_7_5w: {
        name: '日本1：7.5万地质图',
        url: '/data/geology/japan/75k/{z}/{x}/{y}.png',
        minimumLevel: 0,
        maximumLevel: 8,
        alpha: 0.86,
        brightness: 1.05,
        contrast: 1.08
    },
    geo_japan_20w: {
        name: '日本1：20万地质图',
        url: '/data/geology/japan/200k/{z}/{x}/{y}.png',
        minimumLevel: 0,
        maximumLevel: 8,
        alpha: 0.86,
        brightness: 1.05,
        contrast: 1.08
    },
    geo_japan_50w: {
        name: '日本1：50万地质图',
        url: '/data/geology/japan/500k/{z}/{x}/{y}.png',
        minimumLevel: 0,
        maximumLevel: 8,
        alpha: 0.86,
        brightness: 1.05,
        contrast: 1.08
    }
};
// 动态加载气象数据加载器（支持API和本地文件两种模式）
import { 
    getWindDataLoader, 
    getOceanCurrentLoader, 
    getWaveDataLoader,
    getInternalWaveLoader 
} from '../config/dataSource.js';
// 使用 Cesium 原生热力图层（性能更好，效果更平滑）
import { CesiumHeatmapLayer as HeatmapLayer } from '../utils/cesiumHeatmapLayer.js';
// 旧的 Canvas 实现（已弃用）
// import { HeatmapLayer } from '../utils/heatmapLayer.js';
import { ShipTrajectoryLayer, sampleTrajectories } from '../utils/shipTrajectory.js';
import { ShipLayer } from '../utils/shipLayer.js';
import { RouteLayer } from '../utils/routeLayer.js';
import { RouteWeatherLayer } from '../utils/routeWeatherLayer.js';
import { RouteDemoLayer } from '../utils/routeDemoLayer.js';
import { OpenWeatherMapLayerManager } from '../utils/openWeatherMapLayer.js';
import { WindyLayerManager } from '../utils/windyLayer.js';
import { ExperimentalMiningLayer } from '../utils/experimentalMiningLayer.js';
import { DrillingLayer } from '../utils/drillingLayer.js';
import { CoreRepositoryLayer } from '../utils/coreRepositoryLayer.js';
import { ResourceLayer } from '../utils/resourceLayer.js';
import { SubmarineCableLayer } from '../utils/submarineCableLayer.js';
import { ArcticRouteLayer } from '../utils/arcticRouteLayer.js';
import { SeafloorObservationLayer } from '../utils/seafloorObservationLayer.js';
import { MarineEquipmentLayer } from '../utils/marineEquipmentLayer.js';
import { ResearchInstitutionLayer } from '../utils/researchInstitutionLayer.js';
import { AntarcticResourceLoader } from '../utils/antarcticResourceLoader.js';
import { PolarStationsLoader } from '../utils/polarStationsLoader.js';
import { PortMarkerManager } from '../utils/portMarkerManager.js';
import { USCooperationLinesManager } from '../utils/usCooperationLines.js';
import RoutePlanPanel from './RoutePlanPanel.vue';
import WeatherPointPicker from './WeatherPointPicker.vue';
import StationInfoPopup from './StationInfoPopup.vue';
import StationCountryLegend from './StationCountryLegend.vue';
import CoreRepositoryPopup from './CoreRepositoryPopup.vue';
import CoreRepositoryCharts from './CoreRepositoryCharts.vue';

export default {
    components: {
        RoutePlanPanel,
        WeatherPointPicker,
        StationInfoPopup,
        StationCountryLegend,
        CoreRepositoryPopup,
        CoreRepositoryCharts
    },
    props: {
        showToolbar: {
            type: Boolean,
            default: false
        },
        filters: {
            type: Object,
            default: () => ({
                minerals: [],
                oceans: [],
                countries: []
            })
        },
        // 左侧图层控制的当前状态（用于控制风场等专题图层）
        layerState: {
            type: Array,
            default: () => []
        },
        // 气象图层控制的当前状态
        weatherLayerState: {
            type: Array,
            default: () => []
        },
        // 船舶定位请求
        shipToLocate: {
            type: Object,
            default: null
        },
        // 路径绘制请求
        routeToDraw: {
            type: Object,
            default: null
        },
        // 历史轨迹绘制请求
        trackToDraw: {
            type: Object,
            default: null
        },
        // 航线气象分析请求
        routeWeatherRequest: {
            type: Object,
            default: null
        },
        // 气象筛选条件
        weatherFilter: {
            type: Object,
            default: null
        },
        // 地图选点类型
        pickingPointType: {
            type: String,
            default: null
        },
        // 资源分布筛选（新增）
        resourceFilters: {
            type: Array,
            default: () => []
        },
        // 美国合作关系线显示控制
        showUSCooperation: {
            type: Boolean,
            default: false
        }
    },
    emits: ['dataLoaded', 'weatherDataLoaded', 'pointPicked', 'cableDataLoaded', 'arcticRouteDataLoaded'],
    setup(props, { emit }) {
        const cesiumContainer = ref(null);
        const selectedArea = ref(null);
        const infoPosition = ref({ x: 0, y: 0 });
        let viewer = null;
        let dataSource = null; // GeoJSON 数据源
        let clickHandler = null; // 点击事件处理器
        const is3D = ref(false);  // 初始为2D模式
        let allEntities = []; // 存储所有实体
        let previousEntity = null; // 存储上一个选中的实体
        let windLayer = null; // 风场图层实例
        const showWind = ref(false); // 风场显示状态
        let waveLayer = null; // 波浪图层实例
        let waveHeatmap = null; // 波浪热力图实例
        const showWave = ref(false); // 波浪显示状态
        let oceanCurrentLayer = null; // 洋流图层实例
        let oceanCurrentHeatmap = null; // 洋流热力图实例
        const showOceanCurrent = ref(false); // 洋流显示状态
        let internalWaveLayer = null; // 内波图层实例
        const showInternalWave = ref(false); // 内波显示状态
        let trajectoryLayer = null; // 轨迹图层实例
        const showTrajectory = ref(false); // 轨迹显示状态
        const selectedShip = ref(null); // 选中的船舶信息
        const shipInfoPosition = ref({ x: 0, y: 0 }); // 船舶信息窗口位置
        const selectedWeather = ref(null); // 选中的气象信息
        const weatherInfoPosition = ref({ x: 0, y: 0 }); // 气象信息窗口位置
        const selectedDrilling = ref(null); // 选中的钻孔信息
        const drillingInfoPosition = ref({ x: 0, y: 0 }); // 钻孔信息窗口位置
        const selectedCable = ref(null); // 选中的光缆信息
        const cableInfoPosition = ref({ x: 0, y: 0 }); // 光缆信息窗口位置
        let shipLayer = null; // 船舶图层实例
        const shipTrackColors = new Map(); // mmsi -> Cesium.Color
        const showRoutePlan = ref(false); // 路径规划面板显示状态
        let routeLayer = null; // 航线图层实例
        let routeWeatherLayer = null; // 航线气象图层实例
        let routeDemoLayer = null; // 航线演示图层实例
        let experimentalMiningLayer = null; // 试验试采图层实例
        const showExperimentalMining = ref(false); // 试验试采显示状态
        let drillingLayer = null; // 大洋钻探图层实例
        const showDrilling = ref(false); // 大洋钻探显示状态
        let coreRepositoryLayer = null; // 岩心库图层实例
        const showCoreRepositoryPopup = ref(false); // 岩心库弹窗显示状态
        const selectedCoreRepository = ref(null); // 选中的岩心库信息
        const currentSelectedCountry = ref(null); // 当前选中的国家
        let resourceLayer = null; // 资源分布图层实例
        const showResources = ref([]); // 当前显示的资源类型列表
        let submarineCableLayer = null; // 海底光缆图层实例
        const showSubmarineCables = ref(false); // 海底光缆显示状态
        let arcticRouteLayer = null; // 北极航线图层实例
        const showArcticRoutes = ref(false); // 北极航线显示状态
        let seafloorObservationLayer = null; // 海底观测网图层实例
        const showSeafloorObservation = ref(false); // 海底观测网显示状态
        let marineEquipmentLayer = null; // 海洋装备图层实例
        const showMarineEquipment = ref(false); // 海洋装备显示状态
        let researchInstitutionLayer = null; // 研究机构图层实例
        const showResearchInstitution = ref(false); // 研究机构显示状态
        let antarcticResourceLoader = null; // 南极资源加载器实例
        let polarStationsLoader = null; // 极地科考站加载器实例
        let portMarkerManager = null; // 港口标记管理器实例
        const showPorts = ref(false); // 港口显示状态
        const showStationInfo = ref(false); // 科考站信息弹窗显示状态
        const selectedStation = ref(null); // 选中的科考站信息
        const stationInfoPosition = ref({ x: 0, y: 0 }); // 科考站信息窗口位置
        const showStationLegend = ref(false); // 科考站国家图例显示状态
        const stationCountries = ref({ antarctic: [], arctic: [] }); // 科考站国家列表（分南极和北极）
        
        // 美国合作关系线管理器
        let usCooperationManager = null;
        const usaMarineLayerDataSources = new Map();
        const japanMarineGeologyDataSources = new Map();
        const japanGeologyTileLayers = new Map();
        
        // 渲染模式管理：跟踪需要持续渲染的图层
        const activeAnimationLayers = ref(new Set());
        
        // 更新渲染模式
        const updateRenderMode = () => {
            if (!viewer) return;
            
            // 如果有任何动画图层激活，使用持续渲染模式
            const shouldContinuousRender = activeAnimationLayers.value.size > 0;
            viewer.scene.requestRenderMode = !shouldContinuousRender;
            
            if (shouldContinuousRender) {
                console.log('🎬 启用持续渲染模式，激活的图层:', Array.from(activeAnimationLayers.value));
            } else {
                console.log('⏸️ 启用按需渲染模式');
            }
        };
        
        // 显示动画图层
        const showAnimationLayer = (layerName) => {
            activeAnimationLayers.value.add(layerName);
            updateRenderMode();
        };
        
        // 隐藏动画图层
        const hideAnimationLayer = (layerName) => {
            activeAnimationLayers.value.delete(layerName);
            updateRenderMode();
        };
        let pickPointMarkers = { 
            start: null, 
            end: null,
            avoid: [],      // 避让点标记数组
            through: [],    // 途经点标记数组
            collected: []   // 坐标采集标记数组
        }; // 选点标记
        
        // 多边形绘制相关
        const isPolygonDrawingMode = ref(false);  // 是否处于多边形绘制模式
        const polygonPoints = ref([]);  // 当前多边形的顶点
        let polygonEntities = [];  // 存储所有多边形实体
        let tempPolygonEntity = null;  // 临时多边形实体（绘制中）
        let polygonPointMarkers = [];  // 多边形顶点标记
        let polygonDrawHandler = null;  // 多边形绘制专用事件处理器
        
        // 北极盆地数据相关
        let arcticBasinDataSources = [];  // 存储北极盆地数据源
        const showArcticBasin = ref(false);  // 北极盆地显示状态
        
        // 北极资源数据相关（天然气、石油）
        let arcticResourceDataSources = {
            natural_gas: null,  // 天然气数据源
            oil: null           // 石油数据源
        };
        const showArcticResources = ref({
            natural_gas: false,
            oil: false
        });
        
        // 气象点查询相关
        const weatherPickedPoint = ref(null);  // 选中的气象查询点
        const currentWeatherLayer = ref(null); // 当前激活的气象图层
        const weatherDataCache = ref({});      // 气象数据缓存
        const weatherTimeSteps = ref([]);      // 时间步长数组
        const currentTimeIndex = ref(0);       // 当前时间索引
        let owmLayerManager = null; // OpenWeatherMap 图层管理器
        let windyLayerManager = null; // Windy 图层管理器
        // 天地图 Token
        const TDT_TOKEN = "2ddaabf906d4b5418aed0078e1657029";
        
        // 注释掉旧的深海稀土区域实体存储，现在使用 ResourceLayer
        // let rareEarthEntities = [];
        
        // 各国态度渲染状态
        let countryAttitudesActive = false;
        
        // 矿产品进口渲染状态
        let mineralImportDataSource = null;
        let mineralImportLabelEntities = [];
        let activeMineralImportCommodities = new Set();
        let mineralImportHighlightedEntities = [];
        let mineralImportBorderHighlightEntities = [];
        let mineralImportCountryBoundaryMap = new Map();
        let mineralImportCountryAggregateMap = new Map();
        let mineralImportGeojsonCache = null;
        let mineralImportRenderToken = 0;
        let lastMineralImportFocusSphere = null;
        let mineralImportFlagFrameTextureCache = new Map();

        const initCesium = async () => {
            viewer = new Cesium.Viewer(cesiumContainer.value, {
                animation: false,
                timeline: false,
                geocoder: false,
                homeButton: false,
                sceneModePicker: false,
                baseLayerPicker: false,
                navigationHelpButton: false,
                fullscreenButton: false,
                vrButton: false,
                infoBox: false,
                selectionIndicator: false,
                imageryProvider: false,  // 先不加载任何底图
                sceneMode: Cesium.SceneMode.SCENE2D,  // 初始为2D平面模式
                contextOptions: {
                    webgl: {
                        alpha: true,  // 启用透明度，让背景图可见
                        depth: true,
                        stencil: true,
                        antialias: true,
                        powerPreference: "high-performance"
                    }
                }
            });
            
            // ========== 天地图底图（三层堆叠） ==========
            // 动态选择天地图服务器（0-7）
            const serverIndex = Math.floor(Math.random() * 8);
            
            // 三层堆叠法：影像底图 + 边界 + 标注
            // 第一层：遥感影像底图（提供真实地表影像）
            const vecLayer = viewer.imageryLayers.addImageryProvider(
                new Cesium.WebMapTileServiceImageryProvider({
                    url: `https://t${serverIndex}.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=${TDT_TOKEN}`,
                    layer: "img",
                    style: "default",
                    format: "tiles",
                    tileMatrixSetID: "w",
                    credit: new Cesium.Credit("天地图影像"),
                    maximumLevel: 18
                })
            );
            vecLayer.show = true;  // 显示影像底图
            vecLayer.alpha = 1.0;  // 完全不透明
            vecLayer.brightness = 1.2;  // 提高亮度
            vecLayer.contrast = 1.2;  // 适当对比度
            vecLayer.saturation = 1.0;  // 正常饱和度
            
            // 第二层：行政边界（强化国家边界线）
            const boundaryLayer = viewer.imageryLayers.addImageryProvider(
                new Cesium.WebMapTileServiceImageryProvider({
                    url: `https://t${serverIndex}.tianditu.gov.cn/ibo_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=ibo&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=${TDT_TOKEN}`,
                    layer: "ibo",
                    style: "default",
                    format: "tiles",
                    tileMatrixSetID: "w",
                    credit: new Cesium.Credit("天地图行政区划"),
                    maximumLevel: 18
                })
            );
            boundaryLayer.show = true;  // 显示行政边界
            boundaryLayer.alpha = 1.0;
            boundaryLayer.brightness = 2.0;
            boundaryLayer.contrast = 1.8;
            boundaryLayer.saturation = 1.2;
            
            // 第三层：影像注记（国家名称、大洋名称）
            const labelLayer = viewer.imageryLayers.addImageryProvider(
                new Cesium.WebMapTileServiceImageryProvider({
                    url: `https://t${serverIndex}.tianditu.gov.cn/cia_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cia&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=${TDT_TOKEN}`,
                    layer: "cia",
                    style: "default",
                    format: "tiles",
                    tileMatrixSetID: "w",
                    credit: new Cesium.Credit("天地图注记"),
                    maximumLevel: 18
                })
            );
            labelLayer.show = true;  // 显示注记
            
            // 保存图层引用，用于主题切换
            viewer._vecLayer = vecLayer;
            viewer._boundaryLayer = boundaryLayer;
            viewer._labelLayer = labelLayer;
            
            // ========== 视野内动态 GeoJSON 管理（最优性能方案） - 已暂时注释 ==========
            // 创建视野管理器：只加载和渲染当前视野内的国家
            // const viewportGeoJsonManager = new ViewportGeoJsonManager(viewer);
            // viewer._viewportGeoJsonManager = viewportGeoJsonManager;
            
            // 延迟初始化，避免阻塞主界面
            // setTimeout(async () => {
            //     try {
            //         console.log('🚀 启动视野内 GeoJSON 动态管理...');
            //         await viewportGeoJsonManager.initialize();
            //         viewportGeoJsonManager.startMonitoring(500); // 500ms 节流
            //         console.log('✅ 视野管理器启动成功');
            //     } catch (error) {
            //         console.error('❌ 视野管理器启动失败:', error);
            //     }
            // }, 1000);
            
            // ========== 其他底图选项（已注释） ==========
            // // 如需使用影像底图，取消下面的注释
            // viewer.imageryLayers.addImageryProvider(
            //     new Cesium.WebMapTileServiceImageryProvider({
            //         url: `https://t${serverIndex}.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=${TDT_TOKEN}`,
            //         layer: "img",
            //         style: "default",
            //         format: "tiles",
            //         tileMatrixSetID: "w",
            //         credit: new Cesium.Credit("天地图影像"),
            //         maximumLevel: 18
            //     })
            // );

            // 场景优化 - 深海主题（默认）
            viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#001a33'); // 深海蓝色
            viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#000814'); // 深邃黑蓝
            viewer.scene.skyAtmosphere.show = true;
            viewer.scene.skyAtmosphere.hueShift = -0.2; // 偏冷色调
            viewer.scene.skyAtmosphere.saturationShift = -0.1; // 降低饱和度
            viewer.scene.skyAtmosphere.brightnessShift = -0.2; // 降低亮度，营造深海氛围
            viewer.scene.globe.enableLighting = false;
            viewer.scene.globe.showGroundAtmosphere = false;
            viewer.scene.fog.enabled = false;
            viewer.scene.sun.show = false;
            viewer.scene.moon.show = false;
            
            // 检查并应用当前主题
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            if (currentTheme === 'light') {
                // 亮色主题：保持影像底图清晰
                vecLayer.alpha = 1.0;  // 影像底图完全不透明
                boundaryLayer.alpha = 0.8;  // 边界稍微透明
                labelLayer.alpha = 1.0;  // 标注完全不透明
                
                // 使用背景图作为地球底色
                viewer.scene.backgroundColor = Cesium.Color.TRANSPARENT;
                viewer.scene.globe.baseColor = Cesium.Color.TRANSPARENT; // 地球透明
                viewer.scene.skyAtmosphere.hueShift = 0;
                viewer.scene.skyAtmosphere.saturationShift = -0.3;
                viewer.scene.skyAtmosphere.brightnessShift = 0.2;
            }
            viewer.scene.skyBox.show = true;
            
            // ⭐ 关键：禁用按需渲染，始终保持持续渲染
            // 这样可以避免粒子动画（风场、波浪、洋流、内波）出现卡顿
            // 虽然会增加一些 GPU 负载，但能保证动画流畅
            viewer.scene.requestRenderMode = false;
            viewer.scene.maximumRenderTimeChange = Infinity; // 禁用自动降帧
            
            viewer._cesiumWidget._creditContainer.style.display = "none";

            // ========== 限制相机范围，防止露出背景 ==========
            // 限制纬度范围（防止到达极地露出背景）
            viewer.camera.moveEnd.addEventListener(() => {
                const cameraPosition = viewer.camera.positionCartographic;
                
                let needsUpdate = false;
                let newLongitude = cameraPosition.longitude;
                let newLatitude = cameraPosition.latitude;
                let newHeight = cameraPosition.height;
                
                // 限制纬度范围
                const maxLat = Cesium.Math.toRadians(80);
                const minLat = Cesium.Math.toRadians(-80);
                
                if (cameraPosition.latitude > maxLat) {
                    newLatitude = maxLat;
                    needsUpdate = true;
                }
                if (cameraPosition.latitude < minLat) {
                    newLatitude = minLat;
                    needsUpdate = true;
                }
                
                // 如果需要更新相机位置
                if (needsUpdate) {
                    viewer.camera.setView({
                        destination: Cesium.Cartesian3.fromRadians(
                            newLongitude,
                            newLatitude,
                            newHeight
                        ),
                        orientation: {
                            heading: viewer.camera.heading,
                            pitch: viewer.camera.pitch,
                            roll: viewer.camera.roll
                        }
                    });
                }
            });

            // 设置初始视角（直接显示太平洋矿区）
            viewer.camera.setView({
                destination: Cesium.Cartesian3.fromDegrees(-140.0, 10.0, 12000000),
                orientation: {
                    heading: 0,
                    pitch: Cesium.Math.toRadians(-90),
                    roll: 0
                }
            });

            // 初始化船舶图层
            shipLayer = new ShipLayer(viewer);
            console.log('🚢 船舶图层初始化完成');
            
            // 初始化航线图层
            routeLayer = new RouteLayer(viewer);
            console.log('�️ 航线图层初始化完成');
            
            // 初始化航线气象图层
            routeWeatherLayer = new RouteWeatherLayer(viewer);
            console.log('🌦️ 航线气象图层初始化完成');
            
            // 初始化 OpenWeatherMap 图层管理器
            owmLayerManager = new OpenWeatherMapLayerManager(viewer);
            console.log('� OpenWeatherMap 图层管理器初始化完成');
            
            // 初始化 Windy 图层管理器
            windyLayerManager = new WindyLayerManager(viewer);
            console.log('�️ Windy 图层管理器初始化完成');
            
            // 初始化试验试采图层
            experimentalMiningLayer = new ExperimentalMiningLayer(viewer);
            console.log('🔴 试验试采图层初始化完成');
            
            // 初始化大洋钻探图层
            drillingLayer = new DrillingLayer(viewer);
            console.log('� 大洋钻探图层初始化完成');
            
            // 初始化岩心库图层
            coreRepositoryLayer = new CoreRepositoryLayer(viewer);
            console.log('🏛️ 岩心库图层初始化完成');
            
            // 初始化资源分布图层
            resourceLayer = new ResourceLayer(viewer);
            console.log('💎 资源分布图层初始化完成');
            
            // 初始化海底光缆图层
            submarineCableLayer = new SubmarineCableLayer(viewer);
            console.log('🌐 海底光缆图层初始化完成');
            
            // 初始化北极航线图层
            arcticRouteLayer = new ArcticRouteLayer(viewer);
            console.log('🧊 北极航线图层初始化完成');
            
            // 初始化海底观测网图层
            seafloorObservationLayer = new SeafloorObservationLayer(viewer);
            console.log('🔬 海底观测网图层初始化完成');
            
            // 初始化海洋装备图层
            marineEquipmentLayer = new MarineEquipmentLayer(viewer);
            console.log('🚢 海洋装备图层初始化完成');
            
            // 初始化研究机构图层
            researchInstitutionLayer = new ResearchInstitutionLayer(viewer);
            console.log('🏛️ 研究机构图层初始化完成');
            
            // 初始化港口标记管理器
            portMarkerManager = new PortMarkerManager(viewer);
            console.log('⚓ 港口标记管理器初始化完成');
            
            // 设置全局点击事件处理器（独立于数据加载）
            setupGlobalClickHandler();
            
            // 加载 GeoJSON 数据
            loadMiningData();
            
            // ⚠️ 性能优化：海底光缆、北极航线和海底观测网改为按需加载，不在初始化时加载
            // 只在用户点击显示时才加载数据，避免页面初始化卡顿
            // loadSubmarineCableData();  // 已改为按需加载
            // loadArcticRouteData();     // 已改为按需加载
            // loadSeafloorObservationData();  // 已改为按需加载

            // 预加载已禁用 - 改为按需加载，不缓存数据
            // preloadWeatherData();

            // 注释掉自动加载风场，改为手动点击按钮加载
            // updateWindVisibility(props.layerState);
        };

        // 设置全局点击事件处理器（独立于数据加载，确保即使数据加载失败也能响应点击）
        const setupGlobalClickHandler = () => {
            console.log('🖱️ 设置全局点击事件处理器...');
            
            // 改进的点击事件处理（修正 CSS scale 导致的坐标偏差）
            const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
            handler.setInputAction((click) => {
                console.log('🖱️ ========== 地图被点击 ==========');
                console.log('原始坐标:', click.position);
                
                // 计算 CSS scale 缩放比例（App.vue 中的缩放）
                const baseWidth = 1920;
                const baseHeight = 1080;
                const scaleX = window.innerWidth / baseWidth;
                const scaleY = window.innerHeight / baseHeight;
                
                // 修正点击坐标（除以缩放比例）
                const correctedPosition = new Cesium.Cartesian2(
                    click.position.x / scaleX,
                    click.position.y / scaleY
                );
                
                console.log('修正后坐标:', correctedPosition);
                console.log('缩放比例:', { scaleX, scaleY });
                
                // 如果正在选点（路径规划），不处理其他点击
                if (props.pickingPointType) {
                    console.log('⚠️ 正在选点模式，跳过处理');
                    return;
                }
                
                // 如果有激活的气象图层，优先处理气象查询
                if (showWind.value || showWave.value || showOceanCurrent.value || showInternalWave.value) {
                    console.log('🌦️ 气象图层已激活');
                    // 检查是否点击到了实体（矿区、船舶等）- 使用修正后的坐标
                    const pickedObject = viewer.scene.pick(correctedPosition);
                    
                    // 如果没有点击到实体，或者点击的是气象相关的实体，则进行气象查询
                    if (!pickedObject || 
                        (pickedObject.id && pickedObject.id.id && pickedObject.id.id.startsWith('weather_'))) {
                        console.log('→ 进行气象查询');
                        // 传递原始坐标、修正后的坐标和缩放比例
                        handleWeatherPointClick(click.position, correctedPosition, scaleX, scaleY);
                        return;
                    }
                    console.log('→ 点击到了其他实体，继续处理');
                    // 如果点击到了其他实体（矿区、船舶），继续下面的处理
                }
                
                // 恢复上一个选中实体的样式
                if (previousEntity && previousEntity.polygon && previousEntity._originalColor) {
                    previousEntity.polygon.material = previousEntity._originalColor.withAlpha(0.5);
                    previousEntity.polygon.outlineColor = Cesium.Color.WHITE.withAlpha(0.9);
                    previousEntity.polygon.outlineWidth = 1;
                }
                
                console.log('🔍 开始拾取实体...');
                console.log('   - 修正后坐标:', correctedPosition);
                
                // 使用修正后的坐标拾取实体
                const pickedObject = viewer.scene.pick(correctedPosition);
                
                console.log('🎯 拾取结果:');
                console.log('   - 是否拾取到对象:', Cesium.defined(pickedObject));
                console.log('   - pickedObject:', pickedObject);
                
                if (Cesium.defined(pickedObject)) {
                    console.log('   - 有 id:', !!pickedObject.id);
                    console.log('   - 有 primitive:', !!pickedObject.primitive);
                    if (pickedObject.id) {
                        console.log('   - entity.id:', pickedObject.id.id);
                        console.log('   - entity.name:', pickedObject.id.name);
                    }
                }
                
                // 检查是否点击了船舶或气象标记
                if (Cesium.defined(pickedObject) && pickedObject.id) {
                    const entity = pickedObject.id;
                    
                    console.log('📦 实体详情:');
                    console.log('   - id:', entity.id);
                    console.log('   - name:', entity.name);
                    console.log('   - 有 billboard:', !!entity.billboard);
                    console.log('   - 有 polygon:', !!entity.polygon);
                    console.log('   - 有 properties:', !!entity.properties);
                    console.log('   - 有 point:', !!entity.point);
                    console.log('   - 有 model:', !!entity.model);
                    console.log('   - 有 _waypointData:', !!entity._waypointData);
                    console.log('   - 有 _shipData:', !!entity._shipData);
                    
                    // 优先检查是否点击了美国合作关系线或标记
                    if (entity.properties && entity.properties.type) {
                        const entityType = entity.properties.type.getValue ? entity.properties.type.getValue() : entity.properties.type;
                        if (entityType === 'us-cooperation' || entityType === 'us-cooperation-marker') {
                            console.log('🇺🇸 点击了美国合作关系线/标记，显示合作信息');
                            
                            // 获取合作信息
                            const cooperationData = {
                                country: entity.properties.country.getValue ? entity.properties.country.getValue() : entity.properties.country,
                                cooperationType: entity.properties.cooperationType.getValue ? entity.properties.cooperationType.getValue() : entity.properties.cooperationType,
                                mainAreas: entity.properties.mainAreas.getValue ? entity.properties.mainAreas.getValue() : entity.properties.mainAreas,
                                details: entity.properties.details.getValue ? entity.properties.details.getValue() : entity.properties.details
                            };
                            
                            // 通知App.vue显示弹窗
                            window.dispatchEvent(new CustomEvent('showUSCooperationPopup', {
                                detail: {
                                    data: cooperationData,
                                    x: click.position.x,
                                    y: click.position.y
                                }
                            }));
                            
                            return;
                        }
                    }
                    
                    // 检查是否点击了科考站（排除海底观测网和研究机构）
                    const entityType = entity.properties?.type?.getValue();
                    
                    // 如果点击的是矿产品进口国家或标签
                    if (
                        entityType === 'mineral_import_country' ||
                        entityType === 'mineral_import_label' ||
                        entityType === 'mineral_import_label_bar' ||
                        entityType === 'mineral_import_label_flag_frame' ||
                        entityType === 'mineral_import_label_flag'
                    ) {
                        console.log('📦 点击了矿产品进口国家:', entity.id);
                        const props = entity.properties;
                        const country = props.importCountry?.getValue?.() || '';
                        if (country) {
                            highlightMineralImportCountry(country);
                            focusMineralImportCountry(country);
                        }
                        
                        const popupData = buildMineralImportPopupData(country) || {
                            commodityId: props.commodityId?.getValue?.() || '',
                            commodityName: props.commodityName?.getValue?.() || '矿产品',
                            categoryId: props.categoryId?.getValue?.() || '',
                            categoryName: props.categoryName?.getValue?.() || '矿产品进口',
                            country: country || '未知',
                            volumeDisplay: props.volumeDisplay?.getValue?.() || '未披露',
                            share: props.importShare?.getValue?.() || '',
                            yoy: props.importYoy?.getValue?.() || '',
                            totalImport: props.totalImport?.getValue?.() || '',
                            summary: props.summary?.getValue?.() || '',
                            note: props.importNote?.getValue?.() || '',
                            dataQualityNote: props.importDataQualityNote?.getValue?.() || '',
                            themeColor: MINERAL_IMPORT_OVERLAP_COLOR
                        };
                        
                        window.dispatchEvent(new CustomEvent('showMineralImportPopup', {
                            detail: {
                                data: popupData,
                                x: click.position.x,
                                y: click.position.y
                            }
                        }));
                        return;
                    }
                    
                    if (entity.properties && 
                        (entity.properties.stationName || entity.properties.country) &&
                        entityType !== 'seafloor_observation' &&
                        entityType !== 'research_institution') {
                        console.log('🏔️ 点击了科考站');
                        const props = entity.properties;
                        
                        // 判断是南极还是北极站点
                        const isAntarctic = props.establishedDate !== undefined;
                        
                        selectedStation.value = {
                            type: isAntarctic ? 'antarctic' : 'arctic',
                            name: props.stationName?.getValue() || '未知站点',
                            country: props.country?.getValue() || '未知',
                            location: props.location?.getValue(),
                            establishedDate: props.establishedDate?.getValue(),
                            stationType: props.stationType?.getValue(),
                            personnel: props.personnel?.getValue()
                        };
                        
                        stationInfoPosition.value = {
                            x: Math.min(click.position.x + 20, window.innerWidth - 370),
                            y: Math.max(click.position.y - 100, 10)
                        };
                        
                        showStationInfo.value = true;
                        console.log('✅ 显示科考站信息:', selectedStation.value);
                        return;
                    }
                    
                    // 如果点击的是航线演示的航点
                    if (entity.name && entity.name.startsWith('waypoint-')) {
                        console.log('✅ 检测到航点实体:', entity.name);
                        console.log('   - _waypointData 存在:', !!entity._waypointData);
                        
                        if (entity._waypointData) {
                            console.log('📍 点击了航线演示航点:', entity.name);
                            
                            const waypointData = entity._waypointData;
                        
                        // 构建气象信息显示数据
                        const weatherDetails = {
                            title: waypointData.name,
                            items: [
                                { label: '风险等级', value: waypointData.risk === 'safe' ? '安全' : 
                                                             waypointData.risk === 'caution' ? '注意' :
                                                             waypointData.risk === 'warning' ? '警告' : '危险' },
                                { label: '风速', value: `${waypointData.weather.windSpeed} m/s` },
                                { label: '风级', value: `${waypointData.weather.windBeaufort} 级` },
                                { label: '风向', value: waypointData.weather.windDirection },
                                { label: '浪高', value: `${waypointData.weather.waveHeight} m` },
                                { label: '能见度', value: `${(waypointData.weather.visibility / 1000).toFixed(1)} km` },
                                { label: '温度', value: `${waypointData.weather.temperature} °C` },
                                { label: '气压', value: `${waypointData.weather.pressure} hPa` }
                            ]
                        };
                        
                        // 关闭船舶信息窗口
                        selectedShip.value = null;
                        
                        // 显示气象详情窗口
                        selectedWeather.value = weatherDetails;
                        weatherInfoPosition.value = {
                            x: Math.min(click.position.x + 20, window.innerWidth - 370),
                            y: Math.max(click.position.y - 100, 10)
                        };
                        
                        console.log('✅ 显示航点气象信息:', weatherDetails);
                        return;
                        } else {
                            console.log('❌ 航点没有 _waypointData 属性');
                        }
                    }
                    
                    // 如果点击的是航线演示的船舶
                    if (entity.name === 'demo-ship') {
                        console.log('✅ 检测到演示船舶:', entity.name);
                        console.log('   - _shipData 存在:', !!entity._shipData);
                        
                        if (entity._shipData) {
                            console.log('🚢 点击了航线演示船舶:', entity.name);
                            
                            const shipData = entity._shipData;
                        
                        // 关闭气象信息窗口
                        selectedWeather.value = null;
                        
                        // 显示船舶信息（使用特殊格式以区分演示船舶）
                        selectedShip.value = {
                            ship_name: shipData.ship_name,
                            ship_cnname: shipData.ship_cnname,
                            ship_type: shipData.ship_type,
                            // 使用航线信息填充其他字段
                            length: shipData.route,
                            width: shipData.description,
                            sog: shipData.averageSpeed,
                            dest: shipData.endArea,
                            draught: shipData.distance,
                            eta: shipData.estimatedDays,
                            last_time: '演示中',
                            navistat: '航行中'
                        };
                        
                        shipInfoPosition.value = {
                            x: Math.min(click.position.x + 20, window.innerWidth - 370),
                            y: Math.max(click.position.y - 100, 10)
                        };
                        
                        console.log('✅ 显示演示船舶信息:', selectedShip.value);
                        return;
                        } else {
                            console.log('❌ 船舶没有 _shipData 属性');
                        }
                    }
                    
                    // 如果点击的是钻孔点
                    if (entity.properties && entity.properties.type) {
                        const type = entity.properties.type.getValue();
                        if (type === 'drilling_hole') {
                            console.log('🔵 点击了钻孔点:', entity.id);
                            
                            // 获取钻孔信息
                            const props = entity.properties;
                            const drillingInfo = {
                                code: props.ZK_JSRO_ed?.getValue() || 'N/A',
                                voyage: props.HangCi?.getValue() || 'N/A',
                                platform: props.ZTPT?.getValue() || 'N/A',
                                program: props.SSJD?.getValue() || 'N/A',
                                longitude: props.JD?.getValue()?.toFixed(4) || 'N/A',
                                latitude: props.WD?.getValue()?.toFixed(4) || 'N/A'
                            };
                            
                            // 关闭其他信息窗口
                            selectedArea.value = null;
                            selectedShip.value = null;
                            selectedWeather.value = null;
                            
                            // 显示钻孔信息
                            selectedDrilling.value = drillingInfo;
                            drillingInfoPosition.value = {
                                x: Math.min(click.position.x + 20, window.innerWidth - 370),
                                y: Math.max(click.position.y - 100, 10)
                            };
                            
                            console.log('✅ 显示钻孔详细信息:', drillingInfo);
                            return;
                        }
                        
                        // 如果点击的是海底光缆
                        if (type === 'submarine_cable') {
                            console.log('🌐 点击了海底光缆:', entity.id);
                            
                            // 获取光缆信息
                            const props = entity.properties;
                            const cableInfo = {
                                name: props.Name?.getValue() || '未知光缆',
                                capacity: props.Capacity_G?.getValue() || 0,
                                distance: props.Distance_K?.getValue() || 0,
                                inService: props.InService?.getValue() || 'N/A',
                                status: props.NotLive?.getValue() === 1 ? '未启用' : '运营中',
                                url: props.URL1?.getValue() || ''
                            };
                            
                            // 关闭其他信息窗口
                            selectedArea.value = null;
                            selectedShip.value = null;
                            selectedWeather.value = null;
                            selectedDrilling.value = null;
                            
                            // 显示光缆信息（复用 selectedDrilling，或创建新的 selectedCable）
                            selectedCable.value = cableInfo;
                            cableInfoPosition.value = {
                                x: Math.min(click.position.x + 20, window.innerWidth - 370),
                                y: Math.max(click.position.y - 100, 10)
                            };
                            
                            console.log('✅ 显示光缆详细信息:', cableInfo);
                            return;
                        }
                        
                        // 如果点击的是海底观测网
                        if (type === 'seafloor_observation') {
                            console.log('🔬 点击了海底观测网:', entity.id);
                            
                            // 获取观测网信息
                            const props = entity.properties;
                            const country = props.country?.getValue();
                            const observationData = props.observationData?.getValue();
                            
                            console.log('   - 国家:', country);
                            console.log('   - 观测网数据:', observationData);
                            console.log('   - 点击位置:', { x: click.position.x, y: click.position.y });
                            
                            // 始终显示信息弹窗
                            console.log('🔬 准备显示海底观测网信息弹窗');
                            console.log('🔬 弹窗数据:', JSON.stringify(observationData, null, 2));
                            
                            if (observationData) {
                                window.dispatchEvent(new CustomEvent('showSeafloorPopup', {
                                    detail: {
                                        data: observationData,
                                        x: click.position.x,
                                        y: click.position.y
                                    }
                                }));
                                console.log('✅ showSeafloorPopup 事件已触发');
                            }

                            // 如果是特定国家的观测网，额外显示图片弹窗
                            const imageMap = {
                                '日本': '/data/日本_海底观测网.png',
                                '美国': '/data/美国观测网.png',
                                '欧洲': '/data/欧盟观测网.png', // 数据中为“欧洲”
                                '欧盟': '/data/欧盟观测网.png', // 兼容可能的“欧盟”命名
                                '加拿大': '/data/加拿大观测网.png'
                            };

                            if (imageMap[country]) {
                                console.log(`📸 检测到${country}观测网，触发图片弹窗`);
                                
                                // 触发事件通知 App.vue 显示图片
                                // 调整 X 轴偏移，避免完全遮挡信息弹窗（信息弹窗默认宽大约是250~300px）
                                window.dispatchEvent(new CustomEvent('showObservationImage', {
                                    detail: {
                                        title: observationData?.name || `${country}海底观测网`,
                                        imagePath: imageMap[country],
                                        x: click.position.x + 300, 
                                        y: click.position.y
                                    }
                                }));
                            }
                            
                            return;
                        }
                        
                        // 如果点击的是研究机构
                        if (type === 'research_institution') {
                            console.log('🏛️ 点击了研究机构:', entity.id);
                            
                            // 获取研究机构信息
                            const props = entity.properties;
                            const countryId = props.countryId?.getValue();
                            const institutionData = props.institutionData?.getValue();
                            
                            console.log('   - 国家ID:', countryId);
                            console.log('   - 机构数据:', institutionData);
                            
                            // 显示研究机构信息弹窗（所有国家统一处理）
                            console.log('🏛️ 显示研究机构信息弹窗');
                            
                            window.dispatchEvent(new CustomEvent('showInstitutionPopup', {
                                detail: {
                                    data: institutionData,
                                    x: click.position.x,
                                    y: click.position.y
                                }
                            }));
                            
                            return;
                        }
                    }
                    
                    // 如果点击的是气象标记
                    if (entity.id && entity.id.startsWith('weather_marker_')) {
                        console.log('🌦️ 点击了气象标记:', entity.id);
                        
                        // 从 entity 上直接读取存储的数据
                        const weatherData = {
                            weather: entity._weatherData,
                            risk: entity._riskData
                        };
                        
                        console.log('📦 气象数据:', weatherData);
                        
                        if (!weatherData.weather || !weatherData.risk) {
                            console.error('❌ 气象数据不存在');
                            return;
                        }
                        
                        const details = routeWeatherLayer.showWeatherDetails(weatherData);
                        
                        // 关闭船舶信息窗口
                        selectedShip.value = null;
                        
                        // 显示气象详情窗口
                        selectedWeather.value = details;
                        weatherInfoPosition.value = {
                            x: Math.min(click.position.x + 20, window.innerWidth - 370),
                            y: Math.max(click.position.y - 100, 10)
                        };
                        
                        console.log('✅ 显示气象详情:', details);
                        return;
                    }
                    
                    // 如果点击的是船舶（检查 id 是否以 ship_ 开头）
                    if (entity.id && entity.id.startsWith('ship_') && entity.billboard) {
                        console.log('🚢 点击了船舶:', entity.id);
                        
                        // 从 shipLayer 获取船舶信息（根据API实际返回字段）
                        if (shipLayer && entity.properties) {
                            const props = entity.properties;
                            // 直接传递所有原始字段，让模板处理显示
                            const shipInfo = {
                                mmsi: props.mmsi,
                                imo: props.imo,
                                call_sign: props.call_sign,
                                ship_name: props.ship_name,
                                ship_cnname: props.ship_cnname,
                                ship_type: props.ship_type,
                                length: props.length,
                                width: props.width,
                                draught: props.draught,
                                sog: props.sog,
                                cog: props.cog,
                                hdg: props.hdg,
                                navistat: props.navistat,
                                dest: props.dest,
                                destcode: props.destcode,
                                eta: props.eta,
                                last_time: props.last_time,
                                lat: props.lat,
                                lng: props.lng
                            };
                            
                            // 显示船舶信息
                            selectedShip.value = shipInfo;
                            shipInfoPosition.value = {
                                x: Math.min(click.position.x + 20, window.innerWidth - 370),
                                y: Math.max(click.position.y - 100, 10)
                            };
                            
                            console.log('✅ 显示船舶信息:', shipInfo);
                        }
                        return;  // 不继续处理矿区点击
                    }
                    
                    // 如果点击的是轨迹船舶（有 billboard 且 name 以 ship_ 开头）
                    if (entity.billboard && entity.name && entity.name.startsWith('ship_')) {
                        console.log('🚢 点击了轨迹船舶:', entity.name);
                        
                        // 查找对应的轨迹
                        if (trajectoryLayer) {
                            const trajectory = trajectoryLayer.trajectories.find(traj => {
                                return traj.ship === entity;
                            });
                            
                            if (trajectory && trajectory.data.shipInfo) {
                                // 暂停动画
                                trajectoryLayer.isPaused = true;
                                
                                // 显示船舶信息
                                selectedShip.value = trajectory.data.shipInfo;
                                shipInfoPosition.value = {
                                    x: Math.min(click.position.x + 20, window.innerWidth - 370),
                                    y: Math.max(click.position.y - 100, 10)
                                };
                                
                                console.log('✅ 显示轨迹船舶信息:', trajectory.data.shipInfo);
                            }
                        }
                        return;  // 不继续处理矿区点击
                    }
                }
                
                if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.polygon) {
                    const entity = pickedObject.id;
                    previousEntity = entity;
                    
                    // 高亮选中的实体（增强效果：更亮的颜色 + 青色发光边框）
                    // 方案1: 让原色更亮（提高亮度）
                    const brightColor = entity._originalColor.brighten(0.3, new Cesium.Color());
                    entity.polygon.material = brightColor.withAlpha(1.0);
                    
                    // 方案2: 青色发光边框
                    entity.polygon.outlineColor = Cesium.Color.CYAN;
                    entity.polygon.outlineWidth = 6;
                    
                    // 获取属性
                    const props = {};
                    if (entity.properties) {
                        entity.properties.propertyNames.forEach(name => {
                            props[name] = entity.properties[name]?.getValue();
                        });
                    }
                    
                    console.log('✅ 点击成功:', props);
                    
                    // 计算信息面板位置（点击位置作为左上角）
                    const panelWidth = 320; // 20rem = 320px
                    const panelHeight = 280; // 估计高度
                    const margin = 10; // 容器边缘安全距离
                    
                    // 使用原始屏幕坐标
                    const containerWidth = window.innerWidth;
                    const containerHeight = window.innerHeight;
                    
                    // 默认：点击位置作为面板左上角
                    let x = click.position.x;
                    let y = click.position.y;
                    
                    // 边界检测：防止超出右边界
                    if (x + panelWidth > containerWidth - margin) {
                        x = containerWidth - panelWidth - margin;
                    }
                    
                    // 边界检测：防止超出下边界
                    if (y + panelHeight > containerHeight - margin) {
                        y = containerHeight - panelHeight - margin;
                    }
                    
                    // 边界检测：防止超出左边界
                    if (x < margin) {
                        x = margin;
                    }
                    
                    // 边界检测：防止超出上边界
                    if (y < margin) {
                        y = margin;
                    }
                    
                    console.log('📍 面板位置:', { 
                        x, y, 
                        originalClickX: click.position.x,
                        originalClickY: click.position.y,
                        scale: { scaleX, scaleY }
                    });
                    
                    infoPosition.value = { x, y };
                    
                    // 显示信息（使用正确的字段名）
                    selectedArea.value = {
                        id: props.id || '未知',
                        contractor: props.contractor || '未知',
                        sponsor: props.sponsor || '未知',
                        mineral: props.mineral || '未知',
                        location: props.location || '未知',
                        dateRange: props.date_range || '未知',
                        area: props.area_km2 ? `${props.area_km2.toLocaleString()} km²` : '未知'
                    };
                    
                    // 强制渲染
                    viewer.scene.requestRender();
                } else {
                    // 点击空白处，关闭信息面板
                    selectedArea.value = null;
                    console.log('❌ 未点击到矿区，修正后坐标:', correctedPosition);
                }
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
            
            clickHandler = handler;
            console.log('✅ 全局点击事件处理器设置完成');
        };

        // 加载海洋采矿数据（简化版）
        const loadMiningData = async () => {
            try {
                console.log('🔄 开始加载 GeoJSON 数据...');
                
                // 使用工具函数加载（推荐）
                dataSource = await loadGeoJson(viewer, '/data/ocean_mining_final.geojson', {
                    strokeColor: Cesium.Color.WHITE,
                    fillColor: Cesium.Color.RED.withAlpha(1),
                    strokeWidth: 2,
                    clampToGround: false
                });

                const entities = dataSource.entities.values;
                console.log(`✅ 加载了 ${entities.length} 个矿区`);

                // 提取所有唯一的国家
                const countries = new Set();

                // 根据承包者设置官方图例颜色
                entities.forEach(entity => {
                    if (entity.polygon && entity.properties) {
                        // 获取承包者名称
                        const contractor = entity.properties.contractor?.getValue() || 
                                         entity.properties.承包者?.getValue() || 
                                         entity.properties.CONTRACTOR?.getValue() || 
                                         '未知';
                        
                        // 获取对应的官方颜色
                        const colorHex = getContractorColor(contractor);
                        const color = Cesium.Color.fromCssColorString(colorHex);
                        
                        // 设置颜色（不透明，清晰显示矿区）
                        entity.polygon.material = color.withAlpha(0.85);
                        
                        // 设置边框
                        entity.polygon.outline = true;
                        entity.polygon.outlineColor = Cesium.Color.WHITE.withAlpha(1.0);
                        entity.polygon.outlineWidth = 2;
                        
                        // ⭐ 关键：设置为贴地渲染，避免遮挡粒子效果
                        entity.polygon.classificationType = Cesium.ClassificationType.TERRAIN;
                        
                        // 存储原始颜色用于筛选
                        entity._originalColor = color;
                        entity._originalOutlineWidth = 1;
                        
                        // 提取国家（从 sponsor 字段）
                        const sponsor = entity.properties.sponsor?.getValue();
                        if (sponsor) {
                            countries.add(sponsor);
                        }
                    }
                });
                
                allEntities = entities;
                
                console.log('🎨 已应用官方图例配色方案');
                console.log('📊 提取到的国家:', Array.from(countries).sort());
                
                // 提取矿区数据用于表格显示
                const miningData = entities.map((entity, index) => {
                    if (!entity.properties) return null;
                    
                    return {
                        id: entity.properties.id?.getValue() || `area-${index}`,
                        contractor: entity.properties.contractor?.getValue() || '未知',
                        sponsor: entity.properties.sponsor?.getValue() || '未知',
                        mineral: entity.properties.mineral?.getValue() || '未知',
                        location: entity.properties.location?.getValue() || '未知',
                        dateRange: entity.properties.date_range?.getValue() || '未知',
                        area: entity.properties.area_km2?.getValue() || 0
                    };
                }).filter(item => item !== null);
                
                console.log('📋 提取到的矿区数据:', miningData.length, '条');
                
                // 发送数据给父组件(包含区域统计)
                const regionCounts = calculateRegionCounts(entities);
                emit('dataLoaded', {
                    countries: Array.from(countries).sort(),
                    miningData: miningData,
                    regionCounts: regionCounts
                });
                
            } catch (error) {
                console.error('❌ 加载失败:', error);
            }
        };

        // 加载海底光缆数据
        const loadSubmarineCableData = async () => {
            try {
                console.log('🌐 开始加载海底光缆数据...');
                
                // 加载光缆数据
                const entities = await submarineCableLayer.load();
                
                // 提取光缆数据用于列表和统计
                const cableData = submarineCableLayer.getCableData();
                
                console.log(`✅ 加载了 ${cableData.length} 条海底光缆`);
                
                // 计算统计数据
                const statistics = calculateCableStatistics(cableData);
                
                // 发送数据给父组件
                emit('cableDataLoaded', {
                    cableData: cableData,
                    statistics: statistics
                });
                
                console.log('📊 海底光缆统计:', statistics);
            } catch (error) {
                console.error('❌ 加载海底光缆失败:', error);
            }
        };
        
        // 计算海底光缆统计数据
        const calculateCableStatistics = (cableData) => {
            const stats = {
                totalCount: cableData.length,
                totalLength: 0,
                totalCapacity: 0,
                byCountry: {},  // 按国家统计
                byStatus: { active: 0, inactive: 0 },
                cables: cableData  // 保存原始数据供图表使用
            };
            
            cableData.forEach(cable => {
                // 总长度和容量
                stats.totalLength += cable.distance || 0;
                stats.totalCapacity += cable.capacity || 0;
                
                // 按起始国家分组
                const startCountry = cable.startCountry || '未知';
                if (!stats.byCountry[startCountry]) {
                    stats.byCountry[startCountry] = {
                        count: 0,
                        totalLength: 0,
                        totalCapacity: 0
                    };
                }
                stats.byCountry[startCountry].count++;
                stats.byCountry[startCountry].totalLength += cable.distance || 0;
                stats.byCountry[startCountry].totalCapacity += cable.capacity || 0;
                
                // 按状态分组
                if (cable.notLive === 1) {
                    stats.byStatus.inactive++;
                } else {
                    stats.byStatus.active++;
                }
            });
            
            return stats;
        };
        
        // 切换海底光缆显示（优化：首次显示时才加载数据）
        const toggleSubmarineCables = async (active) => {
            if (!submarineCableLayer) return;
            
            if (active) {
                // 如果数据还没加载，先加载数据
                if (!submarineCableLayer.dataSource) {
                    console.log('🌐 首次显示海底光缆，开始加载数据...');
                    await loadSubmarineCableData();
                }
                submarineCableLayer.show();
                showSubmarineCables.value = true;
            } else {
                submarineCableLayer.hide();
                showSubmarineCables.value = false;
            }
        };
        
        // 加载北极航线数据
        const loadArcticRouteData = async () => {
            try {
                console.log('🧊 开始加载北极航线数据...');
                
                // 加载航线数据
                const entities = await arcticRouteLayer.load();
                
                // 提取航线数据用于列表和统计
                const routeData = arcticRouteLayer.getRouteData();
                
                console.log(`✅ 加载了 ${routeData.length} 条北极航线`);
                
                // 计算统计数据
                const statistics = calculateArcticRouteStatistics(routeData);
                
                // 发送数据给父组件
                emit('arcticRouteDataLoaded', {
                    routeData: routeData,
                    statistics: statistics
                });
                
                console.log('📊 北极航线统计:', statistics);
            } catch (error) {
                console.error('❌ 加载北极航线失败:', error);
            }
        };
        
        // 计算北极航线统计数据
        const calculateArcticRouteStatistics = (routeData) => {
            const stats = {
                totalCount: routeData.length,
                totalLength: 0,
                avgLength: 0,
                longestRoute: null,
                shortestRoute: null,
                routes: routeData
            };
            
            let maxDistance = 0;
            let minDistance = Infinity;
            
            routeData.forEach(route => {
                const distance = route.distance || 0;
                stats.totalLength += distance;
                
                // 找出最长和最短航线
                if (distance > maxDistance) {
                    maxDistance = distance;
                    stats.longestRoute = route;
                }
                if (distance < minDistance) {
                    minDistance = distance;
                    stats.shortestRoute = route;
                }
            });
            
            // 计算平均长度
            if (stats.totalCount > 0) {
                stats.avgLength = stats.totalLength / stats.totalCount;
            }
            
            return stats;
        };
        
        // 切换北极航线显示（优化：首次显示时才加载数据）
        const toggleArcticRoutes = async (active) => {
            if (!arcticRouteLayer) return;
            
            if (active) {
                // 如果数据还没加载，先加载数据
                if (!arcticRouteLayer.dataSource) {
                    console.log('🧊 首次显示北极航线，开始加载数据...');
                    await loadArcticRouteData();
                }
                arcticRouteLayer.show();
                showArcticRoutes.value = true;
            } else {
                arcticRouteLayer.hide();
                showArcticRoutes.value = false;
            }
        };
        
        // 高亮北极航线
        const highlightArcticRoute = (routeId) => {
            if (!arcticRouteLayer) return;
            arcticRouteLayer.highlightRoute(routeId);
        };
        
        // 重置北极航线高亮
        const resetArcticRouteHighlight = () => {
            if (!arcticRouteLayer) return;
            arcticRouteLayer.resetHighlight();
        };
        
        // 飞行到北极航线
        const flyToArcticRoute = (routeId) => {
            if (!arcticRouteLayer) return;
            
            // 如果传入的是 'all'，飞行到所有航线（北极视角）
            if (routeId === 'all') {
                arcticRouteLayer.flyToAll();
            } else {
                arcticRouteLayer.flyToRoute(routeId);
            }
        };
        
        // 加载海底观测网数据
        const loadSeafloorObservationData = async () => {
            try {
                console.log('🔬 开始加载海底观测网数据...');
                
                // 加载观测网数据
                const entities = await seafloorObservationLayer.load();
                
                // 提取观测网数据用于列表和统计
                const observationData = seafloorObservationLayer.getObservationData();
                
                console.log(`✅ 加载了 ${observationData.length} 个海底观测网`);
                
                // 计算统计数据
                const statistics = calculateObservationStatistics(observationData);
                
                // 发送数据给父组件
                emit('observationDataLoaded', {
                    observationData: observationData,
                    statistics: statistics
                });
                
                console.log('📊 海底观测网统计:', statistics);
            } catch (error) {
                console.error('❌ 加载海底观测网失败:', error);
            }
        };
        
        // 计算海底观测网统计数据
        const calculateObservationStatistics = (observationData) => {
            const stats = {
                totalCount: observationData.length,
                countryDistribution: {},
                regionDistribution: {},
                countryCount: 0,
                regionCount: 0,
                topCountry: { name: '', count: 0 }
            };
            
            // 按国家统计
            observationData.forEach(obs => {
                const country = obs.country;
                stats.countryDistribution[country] = (stats.countryDistribution[country] || 0) + 1;
            });
            
            stats.countryCount = Object.keys(stats.countryDistribution).length;
            
            // 找出观测网最多的国家
            let maxCount = 0;
            for (const [country, count] of Object.entries(stats.countryDistribution)) {
                if (count > maxCount) {
                    maxCount = count;
                    stats.topCountry = { name: country, count: count };
                }
            }
            
            // 按区域统计
            const regionMap = {
                '美国': '北美',
                '加拿大': '北美',
                '欧洲': '欧洲',
                '日本': '亚洲',
                '中国': '亚洲'
            };
            
            observationData.forEach(obs => {
                const region = regionMap[obs.country] || '其他';
                stats.regionDistribution[region] = (stats.regionDistribution[region] || 0) + 1;
            });
            
            stats.regionCount = Object.keys(stats.regionDistribution).length;
            
            return stats;
        };
        
        // 切换海底观测网显示（按国家）
        const toggleSeafloorObservation = async (active, country) => {
            if (!seafloorObservationLayer) return;
            
            // 首次显示时加载数据
            if (active && !seafloorObservationLayer.dataSource) {
                console.log('🔬 首次显示海底观测网，开始加载数据...');
                await loadSeafloorObservationData();
            }
            
            // 切换指定国家的观测网
            if (country) {
                seafloorObservationLayer.toggleCountry(country, active);
            }
            
            showSeafloorObservation.value = active;
        };

        const clearSeafloorObservation = () => {
            if (!seafloorObservationLayer) return;

            resetObservationHighlight();
            seafloorObservationLayer.hide();
            showSeafloorObservation.value = false;

            if (viewer) {
                viewer.scene.requestRender();
            }
        };
        
        // 切换海洋装备显示
        const toggleMarineEquipment = async (active) => {
            if (!marineEquipmentLayer) return;
            
            // 首次显示时加载数据
            if (active && !marineEquipmentLayer.dataLoaded) {
                console.log('🚢 首次显示海洋装备，开始加载数据...');
                await loadMarineEquipmentData();
            }
            
            // 切换显示状态
            if (active) {
                marineEquipmentLayer.show();
            } else {
                marineEquipmentLayer.hide();
            }
            
            showMarineEquipment.value = active;
        };
        
        // 加载海洋装备数据
        const loadMarineEquipmentData = async () => {
            if (!marineEquipmentLayer) return;
            
            try {
                console.log('🚢 开始加载海洋装备数据...');
                const data = await marineEquipmentLayer.loadData();
                console.log('🚢 海洋装备数据加载完成:', data.length, '条');
                
                // 通知父组件数据已加载
                emit('marineEquipmentDataLoaded', data);
            } catch (error) {
                console.error('❌ 加载海洋装备数据失败:', error);
            }
        };
        
        // 飞行到海洋装备
        const flyToMarineEquipment = (equipment) => {
            if (!marineEquipmentLayer) return;
            marineEquipmentLayer.flyTo(equipment);
        };
        
        // 刷新海洋装备数据
        const refreshMarineEquipment = async () => {
            if (!marineEquipmentLayer) return;
            await loadMarineEquipmentData();
        };
        
        // ==================== 研究机构相关函数 ====================
        
        // 加载研究机构数据
        const loadResearchInstitutionData = async () => {
            if (!researchInstitutionLayer) return;
            
            try {
                console.log('🏛️ 开始加载研究机构数据...');
                const data = await researchInstitutionLayer.loadData();
                console.log('🏛️ 研究机构数据加载完成:', data.length, '条');
                
                // 通知父组件数据已加载
                emit('researchInstitutionDataLoaded', data);
            } catch (error) {
                console.error('❌ 加载研究机构数据失败:', error);
            }
        };
        
        // 切换研究机构显示（按国家）
        const toggleResearchInstitution = async (active, countryId) => {
            if (!researchInstitutionLayer) return;
            
            console.log('🏛️ MapContainer - toggleResearchInstitution 被调用');
            console.log('   - active:', active);
            console.log('   - countryId:', countryId);
            
            // 首次显示时加载数据
            if (active && !researchInstitutionLayer.dataLoaded) {
                console.log('🏛️ 首次显示研究机构，开始加载数据...');
                await loadResearchInstitutionData();
            }
            
            // 切换指定国家的机构
            if (countryId) {
                researchInstitutionLayer.toggleCountry(countryId, active);
            }
            
            showResearchInstitution.value = active;
        };

        const clearResearchInstitution = () => {
            if (!researchInstitutionLayer) return;

            resetResearchInstitutionHighlight();
            researchInstitutionLayer.hide();
            showResearchInstitution.value = false;

            if (viewer) {
                viewer.scene.requestRender();
            }
        };
        
        // 飞行到研究机构
        const flyToResearchInstitution = (institution) => {
            if (!researchInstitutionLayer) return;
            researchInstitutionLayer.flyTo(institution);
        };
        
        // 飞行到指定国家的研究机构（总览视角）
        const flyToResearchCountry = (countryId) => {
            if (!researchInstitutionLayer) return;
            researchInstitutionLayer.flyToCountry(countryId);
        };
        
        // 高亮研究机构
        const highlightResearchInstitution = (institutionId) => {
            if (!researchInstitutionLayer) return;
            researchInstitutionLayer.highlightInstitution(institutionId);
        };
        
        // 重置研究机构高亮
        const resetResearchInstitutionHighlight = () => {
            if (!researchInstitutionLayer) return;
            researchInstitutionLayer.resetHighlight();
        };
        
        // ==================== 海底观测网相关函数 ====================
        
        // 高亮海底观测网
        const highlightObservation = (observationId) => {
            if (!seafloorObservationLayer) return;
            seafloorObservationLayer.highlightObservation(observationId);
        };
        
        // 重置海底观测网高亮
        const resetObservationHighlight = () => {
            if (!seafloorObservationLayer) return;
            seafloorObservationLayer.resetHighlight();
        };
        
        // 飞行到海底观测网
        const flyToObservation = (observation) => {
            if (!seafloorObservationLayer) return;
            seafloorObservationLayer.flyTo(observation);
        };
        
        // 飞行到指定国家的海底观测网（总览视角）
        const flyToSeafloorCountry = (country) => {
            if (!seafloorObservationLayer) return;
            seafloorObservationLayer.flyToCountry(country);
        };
        
        // 切换港口标记显示
        const togglePorts = (active) => {
            if (!portMarkerManager) return;
            
            console.log('⚓ 切换港口标记显示:', active);
            
            if (active) {
                portMarkerManager.show();
                showPorts.value = true;
            } else {
                portMarkerManager.hide();
                showPorts.value = false;
            }
        };

        const closeInfo = () => {
            // 恢复上一个选中实体的样式
            if (previousEntity && previousEntity.polygon && previousEntity._originalColor) {
                previousEntity.polygon.material = previousEntity._originalColor.withAlpha(0.5);
                previousEntity.polygon.outlineColor = Cesium.Color.WHITE.withAlpha(0.9);
                previousEntity.polygon.outlineWidth = 1;
                previousEntity = null;
            }
            
            selectedArea.value = null;
            
            // 强制渲染
            if (viewer) {
                viewer.scene.requestRender();
            }
        };
        
        /**
         * 添加矿区到气象监测
         */
        const addToMonitoring = () => {
            console.log('🔘 addToMonitoring 被调用');
            console.log('   - selectedArea.value:', selectedArea.value);
            console.log('   - previousEntity:', previousEntity);
            
            if (!selectedArea.value || !previousEntity) {
                console.warn('⚠️ 没有选中的矿区');
                return;
            }
            
            try {
                console.log('📦 开始提取矿区数据...');
                
                // 提取多边形坐标
                const positions = previousEntity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions;
                const polygon = positions.map(pos => {
                    const cartographic = Cesium.Cartographic.fromCartesian(pos);
                    return [
                        Cesium.Math.toDegrees(cartographic.longitude),
                        Cesium.Math.toDegrees(cartographic.latitude)
                    ];
                });
                
                console.log('✅ 多边形坐标提取成功，点数:', polygon.length);
                
                // 获取属性
                const props = {};
                if (previousEntity.properties) {
                    previousEntity.properties.propertyNames.forEach(name => {
                        props[name] = previousEntity.properties[name]?.getValue();
                    });
                }
                
                console.log('✅ 属性提取成功:', props);
                
                // 构建矿区信息（使用数据库ID）
                const miningArea = {
                    id: props.dbId || props.id,  // 使用数据库ID
                    name: previousEntity.name || props.name || props.contractor || '未命名矿区',
                    contractor: props.contractor || '未知',
                    mineral: props.mineral || '未知',
                    location: props.location || '未知',
                    polygon: polygon
                };
                
                console.log('📍 准备添加矿区到气象监测:', miningArea);
                console.log('   - 矿区ID:', miningArea.id);
                console.log('   - window 存在:', typeof window !== 'undefined');
                console.log('   - window.app 存在:', !!window.app);
                console.log('   - miningWeatherMonitorRef 存在:', !!window.app?.miningWeatherMonitorRef);
                console.log('   - miningWeatherMonitorRef.value 存在:', !!window.app?.miningWeatherMonitorRef?.value);
                
                // 通过 window.app 访问矿区气象监测组件
                const monitorComponent = window.app?.miningWeatherMonitorRef?.value;
                if (monitorComponent && typeof monitorComponent.addArea === 'function') {
                    console.log('✅ 找到监测组件，调用 addArea...');
                    monitorComponent.addArea(miningArea);
                    console.log('✅ 成功添加矿区到气象监测');
                    
                    // 关闭信息面板
                    closeInfo();
                } else {
                    console.error('❌ 矿区气象监测组件未就绪');
                    console.log('   - monitorComponent:', monitorComponent);
                    console.log('   - addArea 方法存在:', typeof monitorComponent?.addArea);
                }
            } catch (err) {
                console.error('❌ 添加矿区到气象监测失败:', err);
                console.error('   - 错误堆栈:', err.stack);
            }
        };

        // 放大
        const zoomIn = () => {
            if (!viewer) return;
            const camera = viewer.camera;
            camera.zoomIn(camera.positionCartographic.height * 0.5);
        };

        // 缩小
        const zoomOut = () => {
            if (!viewer) return;
            const camera = viewer.camera;
            camera.zoomOut(camera.positionCartographic.height * 0.5);
        };

        // 复位视角
        const resetView = () => {
            if (!viewer) return;
            viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(-140.0, 10.0, 12000000),
                orientation: {
                    heading: 0,
                    pitch: Cesium.Math.toRadians(-90),
                    roll: 0
                },
                duration: 2
            });
        };

        const countryOverviewTargets = {
            '中国': { lng: 104.2, lat: 35.9, height: 5200000 },
            '美国': { lng: -98.6, lat: 39.8, height: 6200000 },
            '英国': { lng: -2.5, lat: 54.0, height: 1800000 },
            '日本': { lng: 138.2, lat: 37.5, height: 3500000 },
            '俄罗斯': { lng: 105.3, lat: 61.5, height: 8200000 },
            '法国': { lng: 2.4, lat: 46.3, height: 2200000 },
            '德国': { lng: 10.4, lat: 51.2, height: 1800000 },
            '比利时': { lng: 4.5, lat: 50.6, height: 1000000 },
            '澳大利亚': { lng: 134.5, lat: -25.7, height: 4800000 }
        };

        const flyToCountryOverview = (countryName) => {
            if (!viewer || !countryName) return;

            const target = countryOverviewTargets[countryName];
            if (!target) {
                console.warn('⚠️ 未配置国家定位视角:', countryName);
                return;
            }

            viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(target.lng, target.lat, target.height),
                orientation: {
                    heading: 0,
                    pitch: Cesium.Math.toRadians(-90),
                    roll: 0
                },
                duration: 1.6
            });
        };

        // 2D/3D 切换 - 保持当前位置
        const toggle2D3D = () => {
            if (!viewer) return;
            
            // 如果风场或波浪正在显示，先隐藏（因为在2D模式下不支持）
            const windWasVisible = showWind.value;
            const waveWasVisible = showWave.value;
            
            if (windWasVisible && windLayer) {
                console.log('⚠️ 2D模式不支持风场显示，自动隐藏风场');
                windLayer.show = false;
                showWind.value = false;
            }
            
            if (waveWasVisible && waveLayer) {
                console.log('⚠️ 2D模式不支持波浪显示，自动隐藏波浪');
                waveLayer.show = false;
                showWave.value = false;
                // 停止相机高度监控
                stopCameraHeightMonitoring();
            }
            
            if (is3D.value) {
                // 3D → 2D：切换到平面视图
                viewer.scene.morphTo2D(1);
                
                // 切换到2D后，飞到理想视角（太平洋矿区）
                setTimeout(() => {
                    viewer.camera.flyTo({
                        destination: Cesium.Cartesian3.fromDegrees(-140.0, 10.0, 20000000),
                        orientation: {
                            heading: 0,
                            pitch: Cesium.Math.toRadians(-90),
                            roll: 0
                        },
                        duration: 1.5
                    });
                }, 1000);
            } else {
                // 2D → 3D：切换到3D球体
                viewer.scene.morphTo3D(1);
                
                // 切换到3D后，飞到太平洋矿区
                setTimeout(() => {
                    viewer.camera.flyTo({
                        destination: Cesium.Cartesian3.fromDegrees(-140.0, 10.0, 15000000),
                        orientation: {
                            heading: 0,
                            pitch: Cesium.Math.toRadians(-90),
                            roll: 0
                        },
                        duration: 1.5
                    });
                }, 1000);
                
                // 如果之前风场是显示的，切换回3D后重新显示
                if (windWasVisible && windLayer) {
                    setTimeout(() => {
                        console.log('✅ 切换回3D，恢复风场显示');
                        windLayer.show = true;
                        showWind.value = true;
                        viewer.scene.requestRenderMode = false;
                    }, 1500);
                }
                
                // 如果之前波浪是显示的，切换回3D后重新显示
                if (waveWasVisible && waveLayer) {
                    setTimeout(() => {
                        console.log('✅ 切换回3D，恢复波浪显示');
                        waveLayer.show = true;
                        showWave.value = true;
                        viewer.scene.requestRenderMode = false;
                        // 重新启动相机高度监控
                        startCameraHeightMonitoring();
                    }, 1500);
                }
            }
            is3D.value = !is3D.value;
        };

        // 全屏
        const toggleFullscreen = () => {
            if (!viewer) return;
            if (!document.fullscreenElement) {
                viewer.container.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        };
        
        // 切换到2D模式（供外部调用）
        const switchTo2D = () => {
            if (!viewer || !is3D.value) return;
            
            // 如果风场或波浪正在显示，先隐藏
            const windWasVisible = showWind.value;
            const waveWasVisible = showWave.value;
            
            if (windWasVisible && windLayer) {
                console.log('⚠️ 2D模式不支持风场显示，自动隐藏风场');
                windLayer.show = false;
                showWind.value = false;
            }
            
            if (waveWasVisible && waveLayer) {
                console.log('⚠️ 2D模式不支持波浪显示，自动隐藏波浪');
                waveLayer.show = false;
                showWave.value = false;
                stopCameraHeightMonitoring();
            }
            
            // 切换到2D平面视图
            viewer.scene.morphTo2D(1);
            is3D.value = false;
            
            // 切换到2D后，飞到理想视角
            setTimeout(() => {
                viewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(-140.0, 10.0, 20000000),
                    orientation: {
                        heading: 0,
                        pitch: Cesium.Math.toRadians(-90),
                        roll: 0
                    },
                    duration: 1.5
                });
            }, 1000);
            
            console.log('🗺️ 已切换到2D平面模式');
        };
        
        // 切换到3D模式（供外部调用）
        const switchTo3D = async (target = 'pacific') => {
            if (!viewer) return;
            
            // 根据目标位置设置不同的飞行目的地
            const targets = {
                pacific: {
                    // 太平洋矿区
                    destination: Cesium.Cartesian3.fromDegrees(-140.0, 10.0, 15000000),
                    orientation: {
                        heading: 0,
                        pitch: Cesium.Math.toRadians(-90),
                        roll: 0
                    }
                },
                antarctic: {
                    // 南极（俯视视角，能看到整个南极大陆）
                    destination: Cesium.Cartesian3.fromDegrees(0.0, -75.0, 12000000),
                    orientation: {
                        heading: 0,
                        pitch: Cesium.Math.toRadians(-90),  // 垂直俯视
                        roll: 0
                    }
                }
            };
            
            const targetConfig = targets[target] || targets.pacific;
            
            // 如果目标是南极，加载南极资源数据
            if (target === 'antarctic') {
                if (!antarcticResourceLoader) {
                    console.log('🌍 初始化南极资源加载器...');
                    antarcticResourceLoader = new AntarcticResourceLoader(viewer);
                }
                
                // 异步加载资源数据（不阻塞飞行动画）
                antarcticResourceLoader.loadAllResources().catch(error => {
                    console.error('❌ 加载南极资源失败:', error);
                });
            }
            
            // 如果还不是3D模式，先切换到3D球体
            if (!is3D.value) {
                console.log('🔄 从2D切换到3D模式...');
                viewer.scene.morphTo3D(1);
                is3D.value = true;
                
                // 等待场景转换完成后再飞行（需要更长时间）
                setTimeout(() => {
                    console.log(`✈️ 飞往目标位置: ${target}`);
                    viewer.camera.flyTo({
                        destination: targetConfig.destination,
                        orientation: targetConfig.orientation,
                        duration: 1.5
                    });
                }, 2000);  // 增加到2秒，确保3D转换完成
            } else {
                // 已经是3D模式，直接飞行
                console.log(`✈️ 已是3D模式，直接飞往: ${target}`);
                setTimeout(() => {
                    viewer.camera.flyTo({
                        destination: targetConfig.destination,
                        orientation: targetConfig.orientation,
                        duration: 1.5
                    });
                }, 500);  // 已经是3D，只需短暂延迟
            }
            
            console.log(`🌍 切换到3D球体模式，目标位置: ${target}`);
        };

        /**
         * 加载极地科考站
         */
        const loadPolarStations = async () => {
            if (!viewer) {
                console.warn('⚠️ viewer 不存在，无法加载科考站');
                return;
            }

            if (!polarStationsLoader) {
                console.log('🏔️ 初始化极地科考站加载器...');
                polarStationsLoader = new PolarStationsLoader(viewer);
            }

            try {
                await polarStationsLoader.loadAllStations();
                
                // 更新国家列表
                stationCountries.value = polarStationsLoader.getCountryList();
                
                // 显示图例
                showStationLegend.value = true;
                
                console.log('✅ 极地科考站加载完成');
                console.log('   南极国家:', stationCountries.value.antarctic.length, '个');
                console.log('   北极国家:', stationCountries.value.arctic.length, '个');
            } catch (error) {
                console.error('❌ 加载极地科考站失败:', error);
            }
        };

        /**
         * 切换极地科考站显示状态
         */
        const togglePolarStations = (show) => {
            if (!polarStationsLoader) return;
            
            if (show) {
                polarStationsLoader.showAll();
                showStationLegend.value = true;
            } else {
                polarStationsLoader.hideAll();
                showStationLegend.value = false;
            }
        };

        /**
         * 获取极地科考站国家列表
         */
        const getPolarStationCountries = () => {
            if (!polarStationsLoader) return [];
            return polarStationsLoader.getCountryList();
        };

        /**
         * 关闭科考站信息弹窗
         */
        const closeStationInfo = () => {
            showStationInfo.value = false;
            selectedStation.value = null;
        };

        /**
         * 加载南极资源数据
         */
        const loadAntarcticResources = async () => {
            console.log('🎯 loadAntarcticResources 被调用');
            console.log('   - viewer 存在:', !!viewer);
            console.log('   - antarcticResourceLoader 存在:', !!antarcticResourceLoader);
            
            if (!viewer) {
                console.warn('⚠️ viewer 不存在，无法加载南极资源');
                return;
            }

            if (!antarcticResourceLoader) {
                console.log('🌍 初始化南极资源加载器...');
                antarcticResourceLoader = new AntarcticResourceLoader(viewer);
                console.log('✅ 南极资源加载器已创建');
            }

            try {
                console.log('⏳ 开始加载资源数据...');
                await antarcticResourceLoader.loadAllResources();
                console.log('✅ 南极资源数据加载完成');
                console.log('   - dataSources 数量:', antarcticResourceLoader.dataSources.size);
                
                // 加载完成后，默认显示所有资源
                console.log('💡 默认显示所有资源');
                antarcticResourceLoader.showAll();
                
                // 强制刷新场景
                if (viewer) {
                    viewer.scene.requestRender();
                    console.log('🔄 已请求场景刷新');
                }
            } catch (error) {
                console.error('❌ 加载南极资源失败:', error);
                console.error('   - 错误堆栈:', error.stack);
            }
        };

        /**
         * 切换南极资源显示状态
         * @param {Boolean} show - 是否显示
         */
        const toggleAntarcticResources = (show) => {
            if (!antarcticResourceLoader) {
                console.warn('⚠️ 南极资源加载器未初始化');
                return;
            }
            
            if (show) {
                antarcticResourceLoader.showAll();
                console.log('✅ 显示所有南极资源');
            } else {
                antarcticResourceLoader.hideAll();
                console.log('✅ 隐藏所有南极资源');
            }
        };

        /**
         * 按类型筛选南极资源（支持多选）
         * @param {Array} resourceTypes - 资源类型数组，如 ['石油天然气', '铁', '铜']
         */
        const filterAntarcticResourcesByType = (resourceTypes) => {
            console.log('🎯 filterAntarcticResourcesByType 被调用');
            console.log('   - antarcticResourceLoader 存在:', !!antarcticResourceLoader);
            console.log('   - 传入的资源类型:', resourceTypes);
            
            if (!antarcticResourceLoader) {
                console.warn('⚠️ 南极资源加载器未初始化');
                return;
            }

            console.log('🔍 筛选南极资源:', resourceTypes);
            console.log('   - 当前已加载的资源数量:', antarcticResourceLoader.dataSources.size);
            console.log('   - 已加载的资源类型:', Array.from(antarcticResourceLoader.dataSources.keys()));

            // 先隐藏所有资源
            antarcticResourceLoader.hideAll();
            console.log('✅ 已隐藏所有资源');

            // 如果没有选中任何类型，则显示所有资源
            if (!resourceTypes || resourceTypes.length === 0) {
                console.log('💡 未选择任何资源类型，显示所有资源');
                antarcticResourceLoader.showAll();
                console.log('✅ 已显示所有资源类型');
                
                // 强制刷新场景
                if (viewer) {
                    viewer.scene.requestRender();
                    console.log('🔄 已请求场景刷新');
                }
                return;
            }

            // 显示选中的资源类型
            let showCount = 0;
            resourceTypes.forEach(resourceType => {
                const dataSource = antarcticResourceLoader.dataSources.get(resourceType);
                console.log(`   - 尝试显示 "${resourceType}":`, dataSource ? '存在' : '不存在');
                if (dataSource) {
                    antarcticResourceLoader.showResourceType(resourceType);
                    console.log(`     ✓ 已设置 ${resourceType} 为可见`);
                    showCount++;
                } else {
                    console.warn(`     ✗ 资源类型 "${resourceType}" 未加载`);
                }
            });

            console.log(`✅ 已显示 ${showCount}/${resourceTypes.length} 种资源类型`);
        };

        /**
         * 获取南极资源列表数据
         * @param {Array} resourceTypes - 资源类型数组
         * @returns {Array} 资源列表数据
         */
        const getAntarcticResourceList = (resourceTypes) => {
            if (!antarcticResourceLoader) {
                console.warn('⚠️ 南极资源加载器未初始化');
                return [];
            }

            const resourceList = [];
            let id = 1;

            // 如果没有指定资源类型，返回所有资源
            const typesToShow = resourceTypes && resourceTypes.length > 0 
                ? resourceTypes 
                : Array.from(antarcticResourceLoader.dataSources.keys());

            typesToShow.forEach(resourceType => {
                const dataSource = antarcticResourceLoader.dataSources.get(resourceType);
                if (dataSource) {
                    const entities = dataSource.entities.values;
                    entities.forEach(entity => {
                        if (entity.position) {
                            const cartographic = Cesium.Cartographic.fromCartesian(entity.position.getValue(Cesium.JulianDate.now()));
                            const lng = Cesium.Math.toDegrees(cartographic.longitude);
                            const lat = Cesium.Math.toDegrees(cartographic.latitude);
                            
                            // 获取资源详细信息
                            const resourceInfo = antarcticResourceLoader.getResourceInfo ? 
                                antarcticResourceLoader.getResourceInfo(resourceType) : 
                                {
                                    area: '南极地区',
                                    value: '储量待评估',
                                    feature: '待勘探'
                                };
                            
                            resourceList.push({
                                id: id++,
                                type: resourceType,
                                area: resourceInfo.area || '南极地区',
                                value: resourceInfo.value || '储量待评估',
                                feature: resourceInfo.feature || '待勘探',
                                coordinates: [lng, lat]
                            });
                        }
                    });
                }
            });

            console.log(`📋 生成资源列表: ${resourceList.length} 条记录`);
            return resourceList;
        };

        /**
         * 按国家加载极地科考站（支持多选）
         * @param {String} region - 区域 (antarctic, arctic)
         * @param {Array|null} countries - 国家ID数组，null表示加载全部
         */
        const loadPolarStationsByCountries = async (region, countries) => {
            if (!viewer) {
                console.warn('⚠️ viewer 不存在，无法加载科考站');
                return;
            }

            // 初始化加载器
            if (!polarStationsLoader) {
                console.log('🏔️ 初始化极地科考站加载器...');
                polarStationsLoader = new PolarStationsLoader(viewer);
            }

            const regionName = region === 'antarctic' ? '南极' : '北极';
            
            try {
                // 加载对应区域的科考站数据
                const dataFile = region === 'antarctic' 
                    ? '/data/JD/NJ/antarctic_research_stations.geojson'
                    : '/data/JD/BJ/arctic_research_stations.geojson';
                
                const response = await fetch(dataFile);
                if (!response.ok) {
                    console.error(`❌ 无法加载${regionName}科考站数据`);
                    return;
                }

                const geojson = await response.json();
                
                // 清除之前的科考站标记
                if (window.polarStationEntities) {
                    window.polarStationEntities.forEach(entity => {
                        viewer.entities.remove(entity);
                    });
                    window.polarStationEntities = [];
                } else {
                    window.polarStationEntities = [];
                }

                // 筛选科考站
                let filteredStations = geojson.features;
                
                if (countries && countries.length > 0) {
                    console.log(`📦 加载${regionName}科考站，筛选国家:`, countries);
                    
                    // 根据选中的国家筛选
                    filteredStations = geojson.features.filter(feature => {
                        const stationCountry = feature.properties.country;
                        
                        // 处理国家匹配（包括联合科考站）
                        return countries.some(countryId => {
                            const countryMap = {
                                'china': '中国',
                                'usa': '美国',
                                'russia': '俄罗斯',
                                'australia': '澳大利亚',
                                'argentina': '阿根廷',
                                'chile': '智利',
                                'japan': '日本',
                                'france': '法国',
                                'germany': '德国',
                                'korea': '韩国',
                                'india': '印度',
                                'uk': '英国',
                                'ukraine': '乌克兰',
                                'newzealand': '新西兰',
                                'norway': '挪威',
                                'uruguay': '乌拉圭',
                                'poland': '波兰',
                                'italy': '意大利',
                                'denmark': '丹麦',
                                'sweden': '瑞典',
                                'finland': '芬兰',
                                'canada': '加拿大',
                                'france_italy': '法国、意大利',
                                'france_germany_norway': '法国、德国、挪威'
                            };
                            
                            const countryName = countryMap[countryId];
                            return stationCountry && stationCountry.includes(countryName);
                        });
                    });
                } else {
                    console.log(`📦 加载${regionName}所有科考站`);
                }

                console.log(`✅ 筛选后的科考站数量: ${filteredStations.length}`);

                // 在地图上添加科考站标记
                filteredStations.forEach(feature => {
                    const { country, stationName, establishedDate, personnel, location, stationType } = feature.properties;
                    const [lng, lat] = feature.geometry.coordinates;

                    // 判断是否显示标签：只有选择了国家时才显示
                    const showLabel = countries && countries.length > 0;

                    const entityConfig = {
                        position: Cesium.Cartesian3.fromDegrees(lng, lat),
                        billboard: {
                            image: '/icons/station-icon.png',
                            width: 32,
                            height: 32,
                            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                            disableDepthTestDistance: Number.POSITIVE_INFINITY
                        },
                        description: `
                            <div style="padding: 10px;">
                                <h3 style="margin: 0 0 10px 0; color: #3b82f6;">🏛️ ${stationName}</h3>
                                <p style="margin: 5px 0;"><strong>国家:</strong> ${country}</p>
                                <p style="margin: 5px 0;"><strong>建站时间:</strong> ${establishedDate || '未知'}</p>
                                <p style="margin: 5px 0;"><strong>人员:</strong> ${personnel || '未知'}</p>
                                ${location ? `<p style="margin: 5px 0;"><strong>位置:</strong> ${location}</p>` : ''}
                                ${stationType ? `<p style="margin: 5px 0;"><strong>类型:</strong> ${stationType}</p>` : ''}
                                <p style="margin: 5px 0;"><strong>坐标:</strong> ${lat.toFixed(4)}°, ${lng.toFixed(4)}°</p>
                            </div>
                        `,
                        properties: {
                            type: 'polar_station',
                            country,
                            stationName,
                            region: regionName
                        }
                    };

                    // 只有选择了国家时才添加标签
                    if (showLabel) {
                        entityConfig.label = {
                            text: stationName,
                            font: '14px sans-serif',
                            fillColor: Cesium.Color.WHITE,
                            outlineColor: Cesium.Color.BLACK,
                            outlineWidth: 2,
                            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                            pixelOffset: new Cesium.Cartesian2(0, -35),
                            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                            disableDepthTestDistance: Number.POSITIVE_INFINITY
                        };
                    }

                    const entity = viewer.entities.add(entityConfig);
                    window.polarStationEntities.push(entity);
                });

                console.log(`✅ ${regionName}科考站加载完成，共 ${window.polarStationEntities.length} 个`);

                // 返回科考站列表数据
                return filteredStations.map(feature => ({
                    id: feature.properties.id,
                    country: feature.properties.country,
                    stationName: feature.properties.stationName,
                    establishedDate: feature.properties.establishedDate,
                    personnel: feature.properties.personnel,
                    location: feature.properties.location,
                    stationType: feature.properties.stationType,
                    coordinates: feature.geometry.coordinates
                }));

            } catch (error) {
                console.error(`❌ 加载${regionName}科考站失败:`, error);
                return [];
            }
        };

        /**
         * 加载极地资源数据
         * @param {String} categoryId - 资源分类ID (energy_minerals, metal_minerals, non_metal_special)
         */
        const loadPolarResources = async (categoryId) => {
            if (!viewer) {
                console.warn('⚠️ viewer 不存在，无法加载极地资源');
                return;
            }

            console.log('🗺️ 加载极地资源:', categoryId);
            
            // 导入资源分类配置
            const { POLAR_RESOURCE_CATEGORIES } = await import('../constants.js');
            const category = POLAR_RESOURCE_CATEGORIES[categoryId];
            
            if (!category) {
                console.error('❌ 未找到资源分类:', categoryId);
                return;
            }

            // 清除之前的资源标记
            if (window.polarResourceEntities) {
                window.polarResourceEntities.forEach(entity => {
                    viewer.entities.remove(entity);
                });
                window.polarResourceEntities = [];
            } else {
                window.polarResourceEntities = [];
            }

            console.log(`📦 加载 ${category.label} 资源，共 ${category.resources.length} 种`);
            console.log(`📋 包含的资源类型: ${category.resources.map(r => r.label).join('、')}`);

            // 加载每种资源的数据
            for (const resource of category.resources) {
                try {
                    const response = await fetch(resource.file);
                    if (!response.ok) {
                        console.warn(`⚠️ 无法加载 ${resource.label}:`, response.statusText);
                        continue;
                    }

                    const geojson = await response.json();
                    console.log(`✅ 加载 ${resource.label}:`, geojson.features.length, '个点');

                    // 在地图上添加点标记（只显示高亮点，不显示文字标注）
                    geojson.features.forEach((feature, index) => {
                        const [lng, lat] = feature.geometry.coordinates;
                        
                        const entity = viewer.entities.add({
                            position: Cesium.Cartesian3.fromDegrees(lng, lat),
                            point: {
                                pixelSize: 10,
                                color: Cesium.Color.fromCssColorString(category.color),
                                outlineColor: Cesium.Color.WHITE,
                                outlineWidth: 2,
                                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                            },
                            description: `
                                <div style="padding: 10px;">
                                    <h3 style="margin: 0 0 10px 0; color: ${category.color};">${resource.icon} ${resource.label}</h3>
                                    <p style="margin: 5px 0;"><strong>分类:</strong> ${category.label}</p>
                                    <p style="margin: 5px 0;"><strong>位置:</strong> ${lat.toFixed(4)}°, ${lng.toFixed(4)}°</p>
                                </div>
                            `,
                            // 存储资源信息，用于后续查询
                            properties: {
                                resourceType: resource.label,
                                resourceIcon: resource.icon,
                                categoryLabel: category.label,
                                categoryColor: category.color
                            }
                        });

                        window.polarResourceEntities.push(entity);
                    });

                } catch (error) {
                    console.error(`❌ 加载 ${resource.label} 失败:`, error);
                }
            }

            // 飞到南极区域查看资源
            if (window.polarResourceEntities.length > 0) {
                // 不自动移动地球，保持当前视角
                // viewer.camera.flyTo({
                //     destination: Cesium.Cartesian3.fromDegrees(0, -75, 8000000),
                //     duration: 2
                // });
            }

            console.log(`✅ ${category.label} 加载完成，共 ${window.polarResourceEntities.length} 个标记`);
        };

        /**
         * 按区域和资源类型数组加载极地资源（支持多选）
         * @param {String} regionId - 区域ID (antarctic, arctic)
         * @param {Array} resourceTypes - 资源类型ID数组 (例如: ['energy_minerals', 'metal_minerals'])
         */
        const loadPolarResourcesByTypes = async (regionId, resourceTypes) => {
            console.log('🎯 loadPolarResourcesByTypes被调用');
            console.log('   - regionId:', regionId);
            console.log('   - resourceTypes:', resourceTypes);
            console.log('   - viewer存在:', !!viewer);
            
            if (!viewer) {
                console.warn('⚠️ viewer 不存在，无法加载极地资源');
                return;
            }

            const regionName = regionId === 'antarctic' ? '南极' : '北极';
            
            // 清除之前的资源标记
            if (window.polarResourceEntities) {
                console.log('🗑️ 清除之前的资源标记，数量:', window.polarResourceEntities.length);
                window.polarResourceEntities.forEach(entity => {
                    viewer.entities.remove(entity);
                });
                window.polarResourceEntities = [];
            } else {
                window.polarResourceEntities = [];
            }

            // 如果没有选择任何类型，不显示任何资源
            if (!resourceTypes || resourceTypes.length === 0) {
                console.log(`📦 未选择资源类型，清空${regionName}资源显示`);
                return;
            }

            console.log(`📦 加载${regionName}选中的资源类型:`, resourceTypes);

            // 导入资源分类配置
            const { POLAR_RESOURCE_CATEGORIES } = await import('../constants.js');

            // 加载每个选中的资源类型
            for (const resourceType of resourceTypes) {
                const category = POLAR_RESOURCE_CATEGORIES[resourceType];
                
                if (!category) {
                    console.error('❌ 未找到资源分类:', resourceType);
                    continue;
                }

                console.log(`📋 加载 ${regionName} - ${category.label}，共 ${category.resources.length} 种资源`);

                // 加载该分类下的每种资源
                for (const resource of category.resources) {
                    try {
                        const response = await fetch(resource.file);
                        if (!response.ok) {
                            console.warn(`⚠️ 无法加载 ${resource.label}:`, response.statusText);
                            continue;
                        }

                        const geojson = await response.json();
                        
                        // 根据区域过滤数据点
                        let filteredFeatures = geojson.features;
                        if (regionId === 'antarctic') {
                            // 南极：纬度 < -60
                            filteredFeatures = geojson.features.filter(f => f.geometry.coordinates[1] < -60);
                        } else if (regionId === 'arctic') {
                            // 北极：纬度 > 60
                            filteredFeatures = geojson.features.filter(f => f.geometry.coordinates[1] > 60);
                        }

                        if (filteredFeatures.length > 0) {
                            console.log(`  ✅ ${resource.label}: ${filteredFeatures.length} 个点`);

                            // 在地图上添加点标记
                            filteredFeatures.forEach((feature) => {
                                const [lng, lat] = feature.geometry.coordinates;
                                
                                const entity = viewer.entities.add({
                                    position: Cesium.Cartesian3.fromDegrees(lng, lat),
                                    point: {
                                        pixelSize: 10,
                                        color: Cesium.Color.fromCssColorString(category.color),
                                        outlineColor: Cesium.Color.WHITE,
                                        outlineWidth: 2,
                                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                                    },
                                    description: `
                                        <div style="padding: 10px;">
                                            <h3 style="margin: 0 0 10px 0; color: ${category.color};">${resource.icon} ${resource.label}</h3>
                                            <p style="margin: 5px 0;"><strong>分类:</strong> ${category.label}</p>
                                            <p style="margin: 5px 0;"><strong>区域:</strong> ${regionName}</p>
                                            <p style="margin: 5px 0;"><strong>位置:</strong> ${lat.toFixed(4)}°, ${lng.toFixed(4)}°</p>
                                        </div>
                                    `,
                                    properties: {
                                        resourceType: resource.label,
                                        resourceIcon: resource.icon,
                                        categoryLabel: category.label,
                                        categoryColor: category.color,
                                        region: regionName
                                    }
                                });

                                window.polarResourceEntities.push(entity);
                            });
                        }

                    } catch (error) {
                        console.error(`❌ 加载 ${resource.label} 失败:`, error);
                    }
                }
            }

            console.log(`✅ ${regionName}资源加载完成，共 ${window.polarResourceEntities.length} 个标记`);
        };

        /**
         * 按区域和资源类型加载极地资源
         * @param {String} regionId - 区域ID (antarctic, arctic)
         * @param {String} resourceType - 资源类型ID (energy_minerals, metal_minerals, non_metal_special)
         */
        const loadPolarResourcesByRegionAndType = async (regionId, resourceType) => {
            if (!viewer) {
                console.warn('⚠️ viewer 不存在，无法加载极地资源');
                return;
            }

            console.log('🗺️ 加载资源:', regionId, resourceType);
            
            // 导入资源分类配置
            const { POLAR_RESOURCE_CATEGORIES } = await import('../constants.js');
            const category = POLAR_RESOURCE_CATEGORIES[resourceType];
            
            if (!category) {
                console.error('❌ 未找到资源分类:', resourceType);
                return;
            }

            // 清除之前的资源标记
            if (window.polarResourceEntities) {
                window.polarResourceEntities.forEach(entity => {
                    viewer.entities.remove(entity);
                });
                window.polarResourceEntities = [];
            } else {
                window.polarResourceEntities = [];
            }

            const regionName = regionId === 'antarctic' ? '南极' : '北极';
            console.log(`📦 加载 ${regionName} - ${category.label}，共 ${category.resources.length} 种资源`);
            console.log(`📋 包含的资源类型: ${category.resources.map(r => r.label).join('、')}`);

            // 加载该分类下的每种资源
            for (const resource of category.resources) {
                try {
                    const response = await fetch(resource.file);
                    if (!response.ok) {
                        console.warn(`⚠️ 无法加载 ${resource.label}:`, response.statusText);
                        continue;
                    }

                    const geojson = await response.json();
                    
                    // 根据区域过滤数据点
                    let filteredFeatures = geojson.features;
                    if (regionId === 'antarctic') {
                        // 南极：纬度 < -60
                        filteredFeatures = geojson.features.filter(f => f.geometry.coordinates[1] < -60);
                    } else if (regionId === 'arctic') {
                        // 北极：纬度 > 60
                        filteredFeatures = geojson.features.filter(f => f.geometry.coordinates[1] > 60);
                    }

                    if (filteredFeatures.length > 0) {
                        console.log(`✅ ${resource.label}: ${filteredFeatures.length} 个点`);

                        // 在地图上添加点标记
                        filteredFeatures.forEach((feature) => {
                            const [lng, lat] = feature.geometry.coordinates;
                            
                            const entity = viewer.entities.add({
                                position: Cesium.Cartesian3.fromDegrees(lng, lat),
                                point: {
                                    pixelSize: 10,
                                    color: Cesium.Color.fromCssColorString(category.color),
                                    outlineColor: Cesium.Color.WHITE,
                                    outlineWidth: 2,
                                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                                },
                                description: `
                                    <div style="padding: 10px;">
                                        <h3 style="margin: 0 0 10px 0; color: ${category.color};">${resource.icon} ${resource.label}</h3>
                                        <p style="margin: 5px 0;"><strong>分类:</strong> ${category.label}</p>
                                        <p style="margin: 5px 0;"><strong>区域:</strong> ${regionName}</p>
                                        <p style="margin: 5px 0;"><strong>位置:</strong> ${lat.toFixed(4)}°, ${lng.toFixed(4)}°</p>
                                    </div>
                                `,
                                properties: {
                                    resourceType: resource.label,
                                    resourceIcon: resource.icon,
                                    categoryLabel: category.label,
                                    categoryColor: category.color,
                                    region: regionName
                                }
                            });

                            window.polarResourceEntities.push(entity);
                        });
                    }

                } catch (error) {
                    console.error(`❌ 加载 ${resource.label} 失败:`, error);
                }
            }

            console.log(`✅ ${regionName} - ${category.label} 加载完成，共 ${window.polarResourceEntities.length} 个标记`);
        };

        // 海洋保护区数据源
        let marineProtectedAreasDataSource = null;

        /**
         * 加载海洋保护区（使用 Cesium.GeoJsonDataSource，与矿区数据一致）
         * @param {Boolean} active - 是否激活显示
         */
        const loadMarineProtectedAreas = async (active) => {
            if (!viewer) {
                console.warn('⚠️ viewer 不存在，无法加载海洋保护区');
                return;
            }

            console.log('🗺️ 海洋保护区:', active ? '显示' : '隐藏');

            // 如果是隐藏，移除数据源
            if (!active) {
                if (marineProtectedAreasDataSource) {
                    viewer.dataSources.remove(marineProtectedAreasDataSource);
                    marineProtectedAreasDataSource = null;
                    console.log('✅ 已隐藏海洋保护区');
                }
                return;
            }

            // 如果已经加载过，先移除再重新加载（确保应用最新样式）
            if (marineProtectedAreasDataSource) {
                console.log('🔄 移除旧的海洋保护区数据源，准备重新加载');
                viewer.dataSources.remove(marineProtectedAreasDataSource);
                marineProtectedAreasDataSource = null;
            }

            try {
                console.log('⏳ 开始加载海洋保护区数据...');
                
                // 使用 Cesium.GeoJsonDataSource.load() 加载（与矿区数据一致的方式）
                marineProtectedAreasDataSource = await Cesium.GeoJsonDataSource.load(
                    '/src/data/Export_Output5000_simple1.json',
                    {
                        stroke: Cesium.Color.WHITE,
                        fill: Cesium.Color.fromCssColorString('#00aa00').withAlpha(0.85),
                        strokeWidth: 2,
                        clampToGround: false
                    }
                );

                // 添加到 viewer
                await viewer.dataSources.add(marineProtectedAreasDataSource);

                const entities = marineProtectedAreasDataSource.entities.values;
                console.log('✅ 海洋保护区加载完成');
                console.log(`   - 实体数量: ${entities.length}`);
                
                // 完全按照矿区的方式设置样式
                entities.forEach(entity => {
                    if (entity.polygon) {
                        // 深绿色填充，85% 不透明度（与矿区一致）
                        entity.polygon.material = Cesium.Color.fromCssColorString('#00aa00').withAlpha(0.85);
                        
                        // 设置边框（与矿区完全一致）
                        entity.polygon.outline = true;
                        entity.polygon.outlineColor = Cesium.Color.WHITE.withAlpha(1.0);
                        entity.polygon.outlineWidth = 2;
                        
                        // ⭐ 关键：设置为贴地渲染（与矿区一致）
                        entity.polygon.classificationType = Cesium.ClassificationType.TERRAIN;
                    }
                });

            } catch (error) {
                console.error('❌ 加载海洋保护区失败:', error);
            }
        };

        // 初始化风场图层
        const initWindLayer = async (timeIndex = 0) => {
            console.log('🔧 initWindLayer 被调用, timeIndex:', timeIndex);
            console.log('   - viewer 存在:', !!viewer);
            console.log('   - windLayer 已存在:', !!windLayer);
            
            if (!viewer || windLayer) {
                console.warn('⚠️ 跳过初始化:', !viewer ? 'viewer 不存在' : 'windLayer 已存在');
                return;
            }
            
            try {
                console.log('🌬️ 开始加载全球风场数据...');
                // 使用动态加载器，直接加载指定时间帧
                const windLoader = await getWindDataLoader();
                const windData = await windLoader.loadGlobalWindData(timeIndex);
                console.log('✅ 数据加载成功');
                console.log('   - 网格:', windData.width, 'x', windData.height);
                console.log('   - U范围:', windData.u.min.toFixed(2), '~', windData.u.max.toFixed(2));
                console.log('   - V范围:', windData.v.min.toFixed(2), '~', windData.v.max.toFixed(2));
                
                // 动态导入 cesium-wind-layer
                console.log('⏳ 动态导入 cesium-wind-layer...');
                const { WindLayer } = await import('cesium-wind-layer');
                console.log('✅ 插件导入成功');
                
                // 确保场景已经渲染，WebGL 上下文已初始化
                viewer.scene.requestRenderMode = false;
                viewer.scene.render();
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // 创建 WindLayer
                console.log('⏳ 创建 WindLayer...');
                
                windLayer = new WindLayer(viewer, windData, {
                    // 粒子数量：640x640 = 409,600 个粒子
                    particlesTextureSize: 640,
                    
                    // 粒子高度：降低到 10km，更贴近地表，减少球面扭曲
                    particleHeight: 10000,
                    
                    // 线条粗细：细腻的线条
                    lineWidth: { min: 1.5, max: 4.0 },
                    
                    // 线条长度：适中长度，避免在球面上断裂
                    lineLength: { min: 250, max: 500 },
                    
                    // 速度因子：适中速度
                    speedFactor: 2.5,
                    
                    // 粒子消失率：适中，保持流畅
                    dropRate: 0.0005,
                    
                    // 粒子消失率增量
                    dropRateBump: 0.0002,
                    
                    // 风场色带：Windy 经典配色（紫→蓝→青→绿→黄→橙→红→紫红）
                    colors: [
                        'rgba(98, 113, 183, 1)',     // 淡紫（微风 0-2 m/s）
                        'rgba(57, 97, 159, 1)',      // 蓝紫
                        'rgba(74, 148, 169, 1)',     // 蓝色（2-5 m/s）
                        'rgba(77, 141, 123, 1)',     // 青蓝
                        'rgba(83, 165, 83, 1)',      // 绿色（5-8 m/s）
                        'rgba(53, 159, 53, 1)',      // 深绿
                        'rgba(167, 157, 81, 1)',     // 黄绿（8-11 m/s）
                        'rgba(159, 127, 58, 1)',     // 土黄
                        'rgba(161, 108, 92, 1)',     // 橙色（11-14 m/s）
                        'rgba(129, 58, 78, 1)',      // 橙红
                        'rgba(175, 80, 136, 1)',     // 红色（14-17 m/s）
                        'rgba(117, 74, 147, 1)',     // 紫红
                        'rgba(109, 97, 163, 1)',     // 深紫（>17 m/s）
                        'rgba(68, 105, 141, 1)'      // 深蓝紫（极强风）
                    ],
                    
                    displayRange: { min: 0, max: 30 },  // 风速范围：0-30 m/s
                    flipY: false,
                    useColorScale: true,
                    fadeOpacity: 0.98
                });
                
                console.log('✅ WindLayer 创建成功');
                // 缓存已移除 - 不再缓存数据
                
            } catch (error) {
                console.error('❌ 风场图层加载失败:', error);
                console.error('   - 堆栈:', error.stack);
            }
        };

        // 缓存已移除 - 改为每次按需加载，不缓存数据
        
        /**
         * 预加载函数已禁用
         * 原因：不需要预加载和缓存数据，改为按需加载
         * 所有图层初始化函数现在接受timeIndex参数，直接加载指定时间帧
         */
        const preloadWeatherData = async () => {
            console.log('⚠️ preloadWeatherData 已禁用 - 使用按需加载模式');
            // 函数体已清空，保留函数声明以避免引用错误
        };
        
        // 相机高度监控变量
        let lastCameraHeight = null;
        let cameraHeightCheckInterval = null;
        
        // 初始化波浪图层
        const initWaveLayer = async (timeIndex = 0) => {
            console.log('🔧 initWaveLayer 被调用, timeIndex:', timeIndex);
            console.log('   - viewer 存在:', !!viewer);
            console.log('   - waveLayer 已存在:', !!waveLayer);
            
            if (!viewer) {
                console.warn('⚠️ 跳过初始化: viewer 不存在');
                return;
            }
            
            // 如果已存在，先移除旧图层
            if (waveLayer) {
                console.log('🗑️ 移除旧的波浪图层');
                waveLayer.remove();
                waveLayer = null;
            }
            
            try {
                // 动态加载波浪数据加载器
                const waveDataLoaderModule = await getWaveDataLoader();
                const { loadGlobalWaveData } = waveDataLoaderModule;
                
                // 直接加载指定时间帧，不使用缓存
                console.log('🌊 开始加载全球波浪数据...');
                const waveData = await loadGlobalWaveData(timeIndex);
                console.log('✅ 波浪数据加载成功');
                
                // 动态导入 cesium-wind-layer（复用风场渲染引擎）
                console.log('⏳ 动态导入 cesium-wind-layer...');
                const { WindLayer } = await import('cesium-wind-layer');
                console.log('✅ 插件导入成功');
                
                // 确保场景已经渲染，WebGL 上下文已初始化
                viewer.scene.requestRenderMode = false;
                viewer.scene.render();
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // 创建 WaveLayer（实际是 WindLayer，但用于渲染波浪）
                console.log('⏳ 创建 WaveLayer...');
                console.log('   - Viewer scene:', viewer.scene);
                console.log('   - WebGL context:', viewer.scene.context);
                
                // 检查 WebGL 上下文
                const gl = viewer.scene.context._gl;
                const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
                console.log('   - Max texture size:', maxTextureSize);
                console.log('   - Data width:', waveData.width);
                console.log('   - Data height:', waveData.height);
                
                if (waveData.width > maxTextureSize || waveData.height > maxTextureSize) {
                    throw new Error(`数据尺寸 ${waveData.width}x${waveData.height} 超过 WebGL 纹理限制 ${maxTextureSize}`);
                }
                
                waveLayer = new WindLayer(viewer, waveData, {
                    // 粒子数量：增加一些，展现更丰富的波浪细节
                    particlesTextureSize: 640,
                    
                    // 粒子高度：提高到 5000m，避免被矿区多边形遮挡
                    particleHeight: 5000,
                    
                    // 线条粗细：恢复原来的粗线条
                    lineWidth: { min: 6, max: 10 },
                    
                    // 线条长度：减小长度，让线条更短更紧凑
                    lineLength: { min: 30, max: 60 },
                    
                    // 速度因子：适中，让波浪运动更明显
                    speedFactor: 1.0,
                    
                    // 粒子消失率：适中
                    dropRate: 0.006,
                    
                    // 粒子消失率增量
                    dropRateBump: 0.002,
                    
                    // 波浪色带：使用高对比度配色，避免与深蓝海洋背景冲突
                    // 从亮色开始：白→青→绿→黄→橙→红→紫
                    colors: [
                        'rgba(255, 255, 255, 0.9)',  // 白色（低波高 0-0.5m）- 最显眼
                        'rgba(0, 255, 255, 0.95)',   // 亮青色（0.5-1m）
                        'rgba(0, 255, 200, 0.95)',   // 青绿（1-1.5m）
                        'rgba(0, 255, 100, 0.95)',   // 绿色（1.5-2m）
                        'rgba(150, 255, 0, 0.95)',   // 黄绿（2-2.5m）
                        'rgba(255, 255, 0, 0.98)',   // 黄色（2.5-3m）
                        'rgba(255, 200, 0, 0.98)',   // 金黄（3-3.5m）
                        'rgba(255, 150, 0, 0.98)',   // 橙色（3.5-4m）
                        'rgba(255, 100, 0, 1.0)',    // 橙红（4-5m）
                        'rgba(255, 0, 0, 1.0)',      // 红色（5-6m）
                        'rgba(200, 0, 100, 1.0)',    // 深红（6-7m）
                        'rgba(150, 0, 150, 1.0)'     // 紫色（>7m 极高波浪）
                    ],
                    
                    flipY: false,
                    dynamic: true,
                    // 启用热力图模式（类似Windy）
                    useColorScale: true,  // 显示颜色热力图
                    fadeOpacity: 0.95     // 热力图透明度
                });
                
                console.log('✅ WaveLayer 创建成功');
                
                // 禁用热力图 - 保持纯粹的粒子效果
                /*
                // 创建 Cesium 原生热力图层（作为背景）
                if (!waveHeatmap) {
                    waveHeatmap = new HeatmapLayer(viewer);
                }
                
                // 生成热力图（Windy 标准配色）
                const colorScale = [
                    'rgba(58, 0, 140, 1)',      // 深紫（0-1m）
                    'rgba(70, 50, 200, 1)',     // 紫色
                    'rgba(0, 100, 255, 1)',     // 深蓝（1-2m）
                    'rgba(0, 180, 255, 1)',     // 蓝色
                    'rgba(0, 230, 255, 1)',     // 浅蓝（2-3m）
                    'rgba(0, 255, 200, 1)',     // 青绿
                    'rgba(100, 255, 100, 1)',   // 绿色（3-4m）
                    'rgba(200, 255, 0, 1)',     // 黄绿
                    'rgba(255, 255, 0, 1)',     // 黄色（4-5m）
                    'rgba(255, 150, 0, 1)',     // 橙色
                    'rgba(255, 50, 0, 1)',      // 橙红（5-6m）
                    'rgba(200, 0, 0, 1)'        // 深红（>6m）
                ];
                
                console.log('🗺️ 准备创建波浪热力图（Cesium 原生），数据bounds:', waveData.bounds);
                
                await waveHeatmap.createHeatmap(waveData, colorScale, {
                    alpha: 0.5,  // 半透明，作为背景
                    bounds: waveData.bounds
                });
                
                console.log('✅ 波浪热力图已创建（Cesium Primitive）');
                */
                
                // 记录当前相机高度
                lastCameraHeight = viewer.camera.positionCartographic.height;
                console.log('📏 初始相机高度:', lastCameraHeight.toFixed(0), 'm');
                
                // 启动相机高度监控
                startCameraHeightMonitoring();
                
                // WindLayer 构造函数会自动添加到场景，不需要手动调用 add()
                
            } catch (error) {
                console.error('❌ 波浪图层加载失败:', error);
                console.error('   - 堆栈:', error.stack);
            }
        };
        
        // 启动相机高度监控（防抖处理）
        const startCameraHeightMonitoring = () => {
            // 清除旧的监控
            if (cameraHeightCheckInterval) {
                clearInterval(cameraHeightCheckInterval);
            }
            
            let debounceTimer = null;
            
            // 每500ms检查一次相机高度
            cameraHeightCheckInterval = setInterval(() => {
                if (!viewer || !waveLayer || !lastCameraHeight) return;
                
                const currentHeight = viewer.camera.positionCartographic.height;
                const heightChange = Math.abs(currentHeight - lastCameraHeight) / lastCameraHeight;
                
                // 如果高度变化超过30%，触发重建
                if (heightChange > 0.3) {
                    console.log('📏 相机高度变化:', {
                        旧高度: lastCameraHeight.toFixed(0) + 'm',
                        新高度: currentHeight.toFixed(0) + 'm',
                        变化率: (heightChange * 100).toFixed(1) + '%'
                    });
                    
                    // 防抖：延迟500ms后重建，避免频繁操作
                    if (debounceTimer) {
                        clearTimeout(debounceTimer);
                    }
                    
                    debounceTimer = setTimeout(async () => {
                        console.log('🔄 重建波浪图层以适应新的缩放级别...');
                        const wasVisible = waveLayer.show;
                        await initWaveLayer();
                        if (waveLayer && wasVisible) {
                            waveLayer.show = true;
                        }
                    }, 500);
                }
            }, 500);
            
            console.log('👁️ 相机高度监控已启动');
        };
        
        // 停止相机高度监控
        const stopCameraHeightMonitoring = () => {
            if (cameraHeightCheckInterval) {
                clearInterval(cameraHeightCheckInterval);
                cameraHeightCheckInterval = null;
                console.log('👁️ 相机高度监控已停止');
            }
        };
        
        // 初始化洋流图层
        const initOceanCurrentLayer = async (timeIndex = 0) => {
            console.log('🔧 initOceanCurrentLayer 被调用, timeIndex:', timeIndex);
            console.log('   - viewer 存在:', !!viewer);
            console.log('   - oceanCurrentLayer 已存在:', !!oceanCurrentLayer);
            
            if (!viewer || oceanCurrentLayer) {
                console.warn('⚠️ 跳过初始化:', !viewer ? 'viewer 不存在' : 'oceanCurrentLayer 已存在');
                return;
            }
            
            try {
                // 动态加载洋流数据加载器
                const oceanCurrentLoaderModule = await getOceanCurrentLoader();
                const { loadGlobalOceanCurrentData } = oceanCurrentLoaderModule;
                
                // 直接加载指定时间帧，不使用缓存
                console.log('🌊 开始加载洋流数据...');
                const oceanCurrentData = await loadGlobalOceanCurrentData(timeIndex);
                console.log('✅ 洋流数据加载成功');
                
                // 动态导入 cesium-wind-layer
                console.log('⏳ 动态导入 cesium-wind-layer...');
                const { WindLayer } = await import('cesium-wind-layer');
                console.log('✅ 插件导入成功');
                
                // 确保场景已经渲染，WebGL 上下文已初始化
                viewer.scene.requestRenderMode = false;
                viewer.scene.render();
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // 创建 OceanCurrentLayer（实际是 WindLayer，但用于渲染洋流）
                console.log('⏳ 创建 OceanCurrentLayer...');
                
                // 检查 WebGL 上下文
                const gl = viewer.scene.context._gl;
                const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
                console.log('   - Max texture size:', maxTextureSize);
                console.log('   - Data width:', oceanCurrentData.width);
                console.log('   - Data height:', oceanCurrentData.height);
                
                if (oceanCurrentData.width > maxTextureSize || oceanCurrentData.height > maxTextureSize) {
                    throw new Error(`数据尺寸 ${oceanCurrentData.width}x${oceanCurrentData.height} 超过 WebGL 纹理限制 ${maxTextureSize}`);
                }
                
                oceanCurrentLayer = new WindLayer(viewer, oceanCurrentData, {
                    // 粒子数量：增加密度，形成更密集的流线
                    particlesTextureSize: 1024,
                    
                    // 粒子高度：稍微抬高，避免贴地渲染问题
                    particleHeight: 3000,
                    
                    // 线条粗细：细腻的线条，像 Windy 一样
                    lineWidth: { min: 1.5, max: 3.5 },
                    
                    // 线条长度：超长流线，形成婉转的曲线
                    lineLength: { min: 600, max: 1200 },
                    
                    // 速度因子：很慢的动画，优雅流畅
                    speedFactor: 0.8,
                    
                    // 粒子消失率：极低，让粒子形成超长尾迹
                    dropRate: 0.0003,
                    
                    // 粒子消失率增量：几乎不增加
                    dropRateBump: 0.0001,
                    
                    // 洋流色带：暖色调（黄→橙→红→紫红），在蓝色背景下非常醒目
                    colors: [
                        'rgba(255, 255, 100, 0.85)',   // 亮黄（慢流 0-0.2 m/s）
                        'rgba(255, 240, 0, 0.88)',     // 金黄
                        'rgba(255, 200, 0, 0.9)',      // 橙黄（0.2-0.4 m/s）
                        'rgba(255, 160, 0, 0.92)',     // 橙色
                        'rgba(255, 120, 0, 0.94)',     // 深橙（0.4-0.6 m/s）
                        'rgba(255, 80, 0, 0.96)',      // 橙红
                        'rgba(255, 40, 0, 0.97)',      // 红色（0.6-0.8 m/s）
                        'rgba(255, 0, 50, 0.98)',      // 深红
                        'rgba(220, 0, 100, 0.99)',     // 紫红（0.8-1.0 m/s）
                        'rgba(180, 0, 150, 1.0)'       // 洋红（>1.0 m/s 快流）
                    ],
                    
                    flipY: false,
                    dynamic: true,
                    // 启用热力图模式
                    useColorScale: true,
                    fadeOpacity: 0.96
                });
                
                console.log('✅ OceanCurrentLayer 创建成功');
                
                // 禁用洋流热力图 - 保持纯粹的粒子效果
                /*
                // 创建洋流热力图层（Cesium 原生，作为背景）
                if (!oceanCurrentHeatmap) {
                    oceanCurrentHeatmap = new HeatmapLayer(viewer);
                }
                
                // 生成洋流热力图（Windy 洋流配色）
                const currentColorScale = [
                    'rgba(58, 0, 140, 1)',      // 深紫（慢流）
                    'rgba(70, 50, 200, 1)',     // 紫色
                    'rgba(0, 100, 255, 1)',     // 深蓝
                    'rgba(0, 180, 255, 1)',     // 蓝色
                    'rgba(0, 230, 255, 1)',     // 浅蓝
                    'rgba(0, 255, 200, 1)',     // 青绿
                    'rgba(100, 255, 100, 1)',   // 绿色
                    'rgba(200, 255, 0, 1)',     // 黄绿
                    'rgba(255, 255, 0, 1)',     // 黄色
                    'rgba(255, 150, 0, 1)',     // 橙色
                    'rgba(255, 50, 0, 1)',      // 橙红（快流）
                    'rgba(200, 0, 0, 1)'        // 深红
                ];
                
                console.log('🗺️ 准备创建洋流热力图（Cesium 原生），数据bounds:', oceanCurrentData.bounds);
                
                await oceanCurrentHeatmap.createHeatmap(oceanCurrentData, currentColorScale, {
                    alpha: 0.4,  // 更透明，作为背景
                    bounds: oceanCurrentData.bounds
                });
                
                console.log('✅ 洋流热力图已创建（Cesium Primitive）');
                */
                
                // WindLayer 构造函数会自动添加到场景，不需要手动调用 add()
                
            } catch (error) {
                console.error('❌ 洋流图层加载失败:', error);
                console.error('   - 堆栈:', error.stack);
            }
        };
        
        // 初始化内波图层
        const initInternalWaveLayer = async (timeIndex = 0) => {
            console.log('🔧 initInternalWaveLayer 被调用, timeIndex:', timeIndex);
            console.log('   - viewer 存在:', !!viewer);
            console.log('   - internalWaveLayer 已存在:', !!internalWaveLayer);
            
            if (!viewer || internalWaveLayer) {
                console.warn('⚠️ 跳过初始化:', !viewer ? 'viewer 不存在' : 'internalWaveLayer 已存在');
                return;
            }
            
            try {
                // 直接加载指定时间帧，不使用缓存
                console.log('🌊 开始加载内波数据...');
                const internalWaveLoader = await getInternalWaveLoader();
                const internalWaveData = await internalWaveLoader.loadGlobalInternalWaveData(timeIndex);
                console.log('✅ 内波数据加载成功');
                
                // 动态导入 cesium-wind-layer
                console.log('⏳ 动态导入 cesium-wind-layer...');
                const { WindLayer } = await import('cesium-wind-layer');
                console.log('✅ 插件导入成功');
                
                // 确保场景已经渲染，WebGL 上下文已初始化
                viewer.scene.requestRenderMode = false;
                viewer.scene.render();
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // 创建 InternalWaveLayer（实际是 WindLayer，但用于渲染内波）
                console.log('⏳ 创建 InternalWaveLayer...');
                
                // 检查 WebGL 上下文
                const gl = viewer.scene.context._gl;
                const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
                console.log('   - Max texture size:', maxTextureSize);
                console.log('   - Data width:', internalWaveData.width);
                console.log('   - Data height:', internalWaveData.height);
                
                if (internalWaveData.width > maxTextureSize || internalWaveData.height > maxTextureSize) {
                    throw new Error(`数据尺寸 ${internalWaveData.width}x${internalWaveData.height} 超过 WebGL 纹理限制 ${maxTextureSize}`);
                }
                
                internalWaveLayer = new WindLayer(viewer, internalWaveData, {
                    // 粒子数量：增加密度，展现波动细节
                    particlesTextureSize: 1024,
                    
                    // 粒子高度：稍微抬高，避免被地形遮挡
                    particleHeight: 4000,
                    
                    // 线条粗细：适中粗细
                    lineWidth: { min: 2.5, max: 5.0 },
                    
                    // 线条长度：更长的流线，展现波动传播
                    lineLength: { min: 150, max: 350 },
                    
                    // 速度因子：慢速动画，内波传播较慢
                    speedFactor: 0.6,
                    
                    // 粒子消失率：较低，形成连续的波动
                    dropRate: 0.002,
                    
                    // 粒子消失率增量
                    dropRateBump: 0.001,
                    
                    // 显示范围：调整为更小的范围，适应内波的实际振幅
                    displayRange: { min: 0, max: 10 },
                    
                    // 内波色带：使用暖色调（黄→橙→红→紫），在深蓝背景下醒目
                    colors: [
                        'rgba(255, 255, 150, 0.9)',    // 淡黄（低振幅）
                        'rgba(255, 255, 100, 0.92)',   // 黄色
                        'rgba(255, 220, 0, 0.94)',     // 金黄
                        'rgba(255, 180, 0, 0.95)',     // 橙黄
                        'rgba(255, 140, 0, 0.96)',     // 橙色
                        'rgba(255, 100, 0, 0.97)',     // 深橙
                        'rgba(255, 60, 0, 0.98)',      // 橙红
                        'rgba(255, 20, 0, 0.99)',      // 红色
                        'rgba(220, 0, 50, 1.0)',       // 深红
                        'rgba(180, 0, 100, 1.0)',      // 紫红
                        'rgba(140, 0, 140, 1.0)',      // 紫色
                        'rgba(100, 0, 180, 1.0)'       // 深紫（高振幅）
                    ],
                    
                    flipY: true,
                    dynamic: true,
                    useColorScale: true,
                    fadeOpacity: 0.98
                });
                
                console.log('✅ InternalWaveLayer 创建成功');
                
            } catch (error) {
                console.error('❌ 内波图层加载失败:', error);
                console.error('   - 堆栈:', error.stack);
            }
        };

        // 获取船舶类型名称
        const getShipTypeName = (shipType) => {
            if (!shipType) return '未知';
            
            const typeMap = {
                20: '地效翼船', 21: '地效翼船（危险品）', 22: '地效翼船（污染品）', 23: '地效翼船（危险品+污染品）',
                30: '渔船', 31: '拖拽船', 32: '拖拽船（长度>200m）', 33: '疏浚船', 34: '潜水作业船',
                35: '军用船', 36: '帆船', 37: '游艇',
                40: '高速船', 41: '高速船（危险品）', 42: '高速船（污染品）', 43: '高速船（危险品+污染品）',
                50: '引航船', 51: '搜救船', 52: '拖船', 53: '港口工作船', 54: '防污船', 55: '执法船', 58: '医疗船', 59: '其他船舶',
                60: '客船', 61: '客船（危险品）', 62: '客船（污染品）', 63: '客船（危险品+污染品）',
                70: '货船', 71: '货船（危险品）', 72: '货船（污染品）', 73: '货船（危险品+污染品）', 74: '货船', 79: '货船',
                80: '油轮', 81: '油轮（危险品）', 82: '油轮（污染品）', 83: '油轮（危险品+污染品）', 84: '油轮', 89: '油轮'
            };
            
            return typeMap[shipType] || `未知类型(${shipType})`;
        };
        
        // 获取航行状态
        const getNavigationStatus = (status) => {
            if (status === undefined || status === null || status === 255) return '未知';
            
            const statusMap = {
                0: '在航（引擎推进）', 
                1: '锚泊', 
                2: '失控', 
                3: '操纵受限', 
                4: '受吃水限制',
                5: '停泊', 
                6: '搁浅', 
                7: '从事捕鱼', 
                8: '在航（帆推进）',
                9: '保留',
                10: '保留',
                11: '拖带',
                12: '推送',
                13: '保留',
                14: '高速船（HSC）',
                15: '默认'
            };
            
            return statusMap[status] || `未知状态(${status})`;
        };
        
        // 判断ETA是否已过期
        const isEtaExpired = (eta, lastTime) => {
            if (!eta || !lastTime) return false;
            
            try {
                const etaDate = new Date(eta);
                const lastTimeDate = new Date(lastTime);
                
                // 如果最后更新时间晚于预计到达时间，说明ETA已过期
                return lastTimeDate > etaDate;
            } catch (error) {
                return false;
            }
        };

        // 关闭船舶信息窗口
        const closeShipInfo = () => {
            selectedShip.value = null;
            if (trajectoryLayer) {
                trajectoryLayer.resumeAnimation();  // 恢复动画
            }
        };
        
        // 关闭气象信息窗口
        const closeWeatherInfo = () => {
            selectedWeather.value = null;
        };
        
        // 关闭钻孔信息窗口
        const closeDrillingInfo = () => {
            selectedDrilling.value = null;
        };
        
        // 关闭光缆信息窗口
        const closeCableInfo = () => {
            selectedCable.value = null;
        };
        
        // 关闭气象选择器
        const closeWeatherPicker = () => {
            weatherPickedPoint.value = null;
            
            // 移除标记点
            if (weatherMarkerEntity) {
                viewer.entities.remove(weatherMarkerEntity);
                weatherMarkerEntity = null;
            }
        };
        
        // 处理地图点击查询气象
        // 气象点击标记实体
        let weatherMarkerEntity = null;
        
        const handleWeatherPointClick = async (screenPosition, correctedPosition, uniformScale) => {
            // 获取点击位置的经纬度（使用修正后的坐标）
            const cartesian = viewer.camera.pickEllipsoid(correctedPosition, viewer.scene.globe.ellipsoid);
            if (!cartesian) {
                console.warn('⚠️ 无法获取点击位置的坐标');
                return;
            }
            
            const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            const lon = Cesium.Math.toDegrees(cartographic.longitude);
            const lat = Cesium.Math.toDegrees(cartographic.latitude);
            
            console.log('🎯 气象点击 - 原始坐标:', screenPosition);
            console.log('🎯 气象点击 - 修正坐标:', correctedPosition);
            console.log('🎯 气象点击 - 统一缩放比例:', uniformScale);
            
            // 移除旧的标记点
            if (weatherMarkerEntity) {
                viewer.entities.remove(weatherMarkerEntity);
                weatherMarkerEntity = null;
            }
            
            // 创建白色标记点
            weatherMarkerEntity = viewer.entities.add({
                position: cartesian,
                point: {
                    pixelSize: 12,
                    color: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.fromCssColorString('rgba(255, 255, 255, 0.4)'),
                    outlineWidth: 2,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            });
            
            // 设置选中点（使用修正后的坐标，因为弹窗在缩放后的容器内）
            weatherPickedPoint.value = {
                lat,
                lon,
                cartesian3: cartesian,
                screenPosition: {
                    x: correctedPosition.x,
                    y: correctedPosition.y
                }
            };
            
            // 设置当前图层
            if (showWind.value) {
                currentWeatherLayer.value = { id: 'wind', name: '风速' };
            } else if (showWave.value) {
                currentWeatherLayer.value = { id: 'wave', name: '波高' };
            } else if (showOceanCurrent.value) {
                currentWeatherLayer.value = { id: 'current', name: '洋流' };
            } else if (showInternalWave.value) {
                currentWeatherLayer.value = { id: 'internal_wave', name: '内波' };
            }
            
            // 缓存已移除 - weatherDataCache不再使用缓存数据
            // 气象点查询将直接从API加载数据
            weatherDataCache.value = {};
            
            console.log('📍 气象点查询已启用（按需加载模式）');
            
            // 生成时间步长（基于当前激活的图层）
            await generateWeatherTimeSteps();
            
            console.log('📍 气象点查询:', { 
                lat: lat.toFixed(2), 
                lon: lon.toFixed(2), 
                layer: currentWeatherLayer.value,
                timeSteps: weatherTimeSteps.value.length
            });
        };
        
        // 生成气象时间步长
        const generateWeatherTimeSteps = async () => {
            try {
                // 根据当前激活的图层确定数据类型
                let dataType = '';
                
                if (showWind.value) {
                    dataType = 'wind';
                } else if (showWave.value) {
                    dataType = 'wave';
                } else if (showOceanCurrent.value) {
                    dataType = 'ocean_current';
                } else if (showInternalWave.value) {
                    dataType = 'internal_wave';
                } else {
                    console.warn('⚠️ 没有激活的气象图层，无法生成时间步长');
                    weatherTimeSteps.value = [];
                    return;
                }
                
                console.log('📂 从后端API获取可用时间索引:', dataType);
                
                // 1. 获取可用的时间索引列表
                const availableResponse = await fetch(`http://121.194.93.61:8081/api/weather/available/${dataType}`);
                if (!availableResponse.ok) {
                    throw new Error(`获取可用索引失败: ${availableResponse.status}`);
                }
                
                const availableResult = await availableResponse.json();
                if (!availableResult.success) {
                    throw new Error(availableResult.error || '获取可用索引失败');
                }
                
                const availableIndices = availableResult.data.indices || [];
                console.log('📊 数据库中可用的时间索引:', availableIndices);
                
                if (availableIndices.length === 0) {
                    console.warn('⚠️ 数据库中没有可用的时间索引，使用默认配置');
                    // 降级方案：假设只有timeIndex=0的数据，生成一个单点时间序列
                    const now = new Date();
                    weatherTimeSteps.value = [now];
                    console.log('✅ 生成单点时间序列（仅timeIndex=0）');
                    return;
                }
                
                // 2. 获取元数据（用于获取起始时间和时间间隔）
                const metaResponse = await fetch(`http://121.194.93.61:8081/api/weather/metadata/${dataType}`);
                if (!metaResponse.ok) {
                    throw new Error(`获取元数据失败: ${metaResponse.status}`);
                }
                
                const metaResult = await metaResponse.json();
                if (!metaResult.success) {
                    throw new Error(metaResult.error || '获取元数据失败');
                }
                
                const meta = metaResult.data;
                console.log('📋 元数据:', meta);
                
                // 3. 根据可用索引生成时间步长
                // 假设时间间隔为3小时（可以从元数据中获取）
                const timeStepHours = 3; // 默认3小时间隔
                const now = new Date();
                
                const steps = availableIndices.map(index => {
                    const time = new Date(now.getTime() + index * timeStepHours * 3600000);
                    return time;
                });
                
                weatherTimeSteps.value = steps;
                console.log('✅ 根据数据库生成时间步长:', steps.length, '个', 
                    steps.length > 0 ? `(索引: ${availableIndices[0]} ~ ${availableIndices[availableIndices.length-1]})` : '');
                console.log('   时间范围:', steps.length > 0 ? `${steps[0].toISOString()} ~ ${steps[steps.length-1].toISOString()}` : '');
            } catch (error) {
                console.error('❌ 生成时间步长失败:', error);
                console.error('   错误详情:', error.message);
                console.error('   堆栈:', error.stack);
                
                // 降级方案：生成默认的24小时时间序列
                console.log('⚠️ 使用默认时间序列（24小时，每3小时一个点）');
                const steps = [];
                const now = new Date();
                for (let i = 0; i < 24; i++) {
                    const time = new Date(now.getTime() + i * 3 * 3600000);
                    steps.push(time);
                }
                weatherTimeSteps.value = steps;
                console.log('✅ 生成默认时间步长:', steps.length, '个');
            }
        };

        // 切换路径规划面板
        const toggleRoutePlan = () => {
            showRoutePlan.value = !showRoutePlan.value;
        };
        
        // 处理路径规划结果
        const handleRoutePlanned = async (routeData) => {
            // 不再绘制静态航线，改为初始化航线演示
            console.log('🎬 路径规划触发 → 启动航线演示');
            
            // 初始化航线演示（上海 → CMMPMN1矿区）
            await initRouteDemo();
            
            // 通知 App.vue 打开航线动态面板
            // 通过全局事件通知
            window.dispatchEvent(new CustomEvent('openRouteDemo'));
            
            console.log('✅ 航线演示已启动');
        };
        
        // 清除路径
        const handleRouteCleared = () => {
            if (routeLayer) {
                routeLayer.clearRoute();
            }
            if (routeWeatherLayer) {
                routeWeatherLayer.clear();
            }
        };
        
        // 存储自定义阈值
        let customThresholds = null;
        
        // 处理阈值变化
        const handleThresholdsChanged = (thresholds) => {
            customThresholds = thresholds;
            console.log('✅ MapContainer 收到阈值变化:', thresholds);
            console.log('   - routeWeatherLayer 存在:', !!routeWeatherLayer);
            console.log('   - 气象数据数量:', routeWeatherLayer ? routeWeatherLayer.weatherData.length : 0);
            
            // 如果已有气象数据，重新评估风险
            if (routeWeatherLayer && routeWeatherLayer.weatherData.length > 0) {
                console.log('🔄 重新评估航线气象风险...');
                console.log('   - 重新评估前第一个点的风险:', routeWeatherLayer.weatherData[0]?.risk);
                
                routeWeatherLayer.reEvaluateRisk(thresholds);
                
                console.log('   - 重新评估后第一个点的风险:', routeWeatherLayer.weatherData[0]?.risk);
                console.log('   - 准备发送 weatherDataLoaded 事件');
                
                // 更新气象数据
                emit('weatherDataLoaded', {
                    data: routeWeatherLayer.weatherData,
                    stats: routeWeatherLayer.getStatistics()
                });
                
                console.log('✅ 气象数据已更新并发送给父组件');
                console.log('   - 发送的数据点数量:', routeWeatherLayer.weatherData.length);
            } else {
                console.log('ℹ️ 当前没有气象数据，阈值将在下次分析时使用');
            }
        };
        
        // 地图选点状态
        let pickPointCallback = null;
        let pickPointHandler = null;
        let pickPointType = null; // 当前选点类型
        let pickPointMarkerEntity = null; // 当前选点标记

        const pickCartesianFromClick = (viewer, clickPosition) => {
            // 按 screen-container 的 CSS transform: scale 反算真实点击坐标
            let scaleX = 1;
            let scaleY = 1;
            const screenContainer = document.getElementById('screen-container');
            if (screenContainer) {
                const style = window.getComputedStyle(screenContainer);
                const transform = style.transform || '';
                const matrixMatch = transform.match(/matrix\(([^)]+)\)/);
                if (matrixMatch && matrixMatch[1]) {
                    const values = matrixMatch[1].split(',').map(v => Number(v.trim()));
                    if (values.length >= 6) {
                        scaleX = values[0];
                        scaleY = values[3];
                    }
                } else {
                    const rect = screenContainer.getBoundingClientRect();
                    const baseWidth = screenContainer.offsetWidth || 1920;
                    const baseHeight = screenContainer.offsetHeight || 1080;
                    if (rect.width > 0 && rect.height > 0 && baseWidth > 0 && baseHeight > 0) {
                        scaleX = rect.width / baseWidth;
                        scaleY = rect.height / baseHeight;
                    }
                }
            }

            if (!Number.isFinite(scaleX) || scaleX <= 0) scaleX = 1;
            if (!Number.isFinite(scaleY) || scaleY <= 0) scaleY = 1;

            const correctedPosition = new Cesium.Cartesian2(
                clickPosition.x / scaleX,
                clickPosition.y / scaleY
            );

            let cartesian = viewer.camera.pickEllipsoid(correctedPosition, viewer.scene.globe.ellipsoid);
            if (cartesian) return cartesian;

            // 兜底：直接尝试原始坐标
            return viewer.camera.pickEllipsoid(clickPosition, viewer.scene.globe.ellipsoid);
        };
        
        // 处理地图选点请求
        const handlePickPoint = (data) => {
            if (data.type === 'cancel') {
                // 取消选点
                if (pickPointHandler) {
                    pickPointHandler.destroy();
                    pickPointHandler = null;
                }
                pickPointCallback = null;
                pickPointType = null;
                
                // 移除临时标记
                if (pickPointMarkerEntity && viewer) {
                    viewer.entities.remove(pickPointMarkerEntity);
                    pickPointMarkerEntity = null;
                }
                
                console.log('❌ 取消地图选点');
                return;
            }
            
            // 保存回调函数和类型
            pickPointCallback = data.callback;
            pickPointType = data.type;
            
            // 移除旧的处理器
            if (pickPointHandler) {
                pickPointHandler.destroy();
            }
            
            // 创建新的点击处理器
            const viewer = viewerRef.value;
            if (!viewer) return;
            
            pickPointHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
            
            pickPointHandler.setInputAction((click) => {
                const cartesian = pickCartesianFromClick(viewer, click.position);
                
                if (cartesian) {
                    // 转换为经纬度
                    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                    const lng = Cesium.Math.toDegrees(cartographic.longitude);
                    const lat = Cesium.Math.toDegrees(cartographic.latitude);
                    
                    console.log(`📍 选择了位置 (${pickPointType}): ${lng.toFixed(6)}, ${lat.toFixed(6)}`);
                    
                    // 移除旧标记
                    if (pickPointMarkerEntity) {
                        viewer.entities.remove(pickPointMarkerEntity);
                    }
                    
                    // 根据类型创建不同的标记
                    let markerColor, markerLabel, markerText;
                    
                    switch (pickPointType) {
                        case 'start':
                            markerColor = '#22c55e'; // 绿色
                            markerLabel = '起点';
                            markerText = 'A';
                            break;
                        case 'end':
                            markerColor = '#ef4444'; // 红色
                            markerLabel = '终点';
                            markerText = 'B';
                            break;
                        case 'avoid':
                            markerColor = '#f97316'; // 橙色
                            markerLabel = '避让点';
                            markerText = '×';
                            break;
                        case 'through':
                            markerColor = '#3b82f6'; // 蓝色
                            markerLabel = '途经点';
                            markerText = '●';
                            break;
                        default:
                            markerColor = '#6b7280'; // 灰色
                            markerLabel = '选点';
                            markerText = '?';
                    }
                    
                    // 创建标记
                    pickPointMarkerEntity = viewer.entities.add({
                        position: Cesium.Cartesian3.fromDegrees(lng, lat),
                        point: {
                            pixelSize: 14,
                            color: Cesium.Color.fromCssColorString(markerColor),
                            outlineColor: Cesium.Color.WHITE,
                            outlineWidth: 2,
                            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                            disableDepthTestDistance: Number.POSITIVE_INFINITY
                        },
                        billboard: {
                            image: 'data:image/svg+xml;base64,' + window.btoa(`
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="48" viewBox="0 0 32 48">
                                    <path d="M16 0C7.2 0 0 7.2 0 16c0 8.8 16 32 16 32s16-23.2 16-32C32 7.2 24.8 0 16 0z" fill="${markerColor}" stroke="#fff" stroke-width="2"/>
                                    <circle cx="16" cy="16" r="6" fill="#fff"/>
                                    <text x="16" y="20" text-anchor="middle" font-size="10" fill="${markerColor}" font-weight="bold">${markerText}</text>
                                </svg>
                            `),
                            width: 32,
                            height: 48,
                            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                        },
                        label: {
                            text: markerLabel,
                            font: '14px sans-serif',
                            fillColor: Cesium.Color.WHITE,
                            outlineColor: Cesium.Color.BLACK,
                            outlineWidth: 2,
                            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                            verticalOrigin: Cesium.VerticalOrigin.TOP,
                            pixelOffset: new Cesium.Cartesian2(0, 5),
                            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                        }
                    });
                    
                    // 调用回调函数
                    if (pickPointCallback) {
                        pickPointCallback(lng, lat);
                    }
                    
                    // 清理处理器
                    pickPointHandler.destroy();
                    pickPointHandler = null;
                    pickPointCallback = null;
                    pickPointType = null;
                    
                    // 延迟移除标记（让用户看到标记）
                    setTimeout(() => {
                        if (pickPointMarkerEntity && viewer) {
                            viewer.entities.remove(pickPointMarkerEntity);
                            pickPointMarkerEntity = null;
                        }
                    }, 2000);
                }
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
            
            const typeNames = {
                'start': '起点',
                'end': '终点',
                'avoid': '避让点',
                'through': '途经点'
            };
            console.log(`🖱️ 开始地图选点模式: ${typeNames[data.type] || data.type}`);
        };
        
        // 切换轨迹显示
        const toggleTrajectory = () => {
            console.log('🚢 轨迹按钮被点击');
            
            if (!viewer) {
                console.error('❌ Viewer 不存在');
                return;
            }
            
            if (!trajectoryLayer) {
                // 首次使用，初始化轨迹图层
                console.log('⏳ 初始化轨迹图层...');
                
                // 创建轨迹图层
                trajectoryLayer = new ShipTrajectoryLayer(viewer);
                
                // 添加示例轨迹
                sampleTrajectories.forEach(traj => {
                    trajectoryLayer.addTrajectory(traj);
                });
                
                console.log('✅ 轨迹图层初始化完成');
            }
            
            if (showTrajectory.value) {
                // 隐藏轨迹
                console.log('⏳ 隐藏轨迹...');
                trajectoryLayer.hide();
                showTrajectory.value = false;
                console.log('✅ 轨迹已隐藏');
            } else {
                // 显示轨迹（不改变视角）
                console.log('⏳ 显示轨迹...');
                trajectoryLayer.show();
                // trajectoryLayer.flyTo();  // 注释掉自动飞行
                showTrajectory.value = true;
                console.log('✅ 轨迹已显示');
            }
        };

        /**
         * 计算各区域的矿区数量
         * @param {Array} entities - 所有矿区实体
         * @returns {Object} 区域ID到数量的映射
         */
        const calculateRegionCounts = (entities) => {
            const counts = {
                pacific_ccz: 0,
                pacific_other: 0,
                indian_ocean: 0,
                atlantic_ocean: 0,
                apei: 0
            };
            
            entities.forEach(entity => {
                if (!entity.properties) return;
                
                const location = entity.properties.location?.getValue() || '';
                const category = entity.properties.category?.getValue() || '';
                
                // 环境保护区
                if (category === 'APEI') {
                    counts.apei++;
                }
                // 太平洋CCZ区
                else if (location.includes('太平洋 (CCZ)')) {
                    counts.pacific_ccz++;
                }
                // 印度洋区
                else if (location.includes('印度洋')) {
                    counts.indian_ocean++;
                }
                // 大西洋区
                else if (location.includes('大西洋')) {
                    counts.atlantic_ocean++;
                }
                // 太平洋其他区
                else if (location.includes('太平洋')) {
                    counts.pacific_other++;
                }
            });
            
            console.log('📊 区域矿区统计:', counts);
            return counts;
        };
        
        /**
         * 判断实体是否匹配区域筛选条件
         * @param {Object} entity - 矿区实体
         * @param {Object} filter - 区域筛选条件
         * @returns {Boolean} 是否匹配
         */
        const matchRegionFilter = (entity, filter) => {
            if (!entity.properties) return false;
            
            const location = entity.properties.location?.getValue() || '';
            const category = entity.properties.category?.getValue() || '';
            
            // 检查 category 筛选
            if (filter.category && filter.category.length > 0) {
                if (filter.category.includes(category)) {
                    return true;
                }
            }
            
            // 检查 location 筛选
            if (filter.location && filter.location.length > 0) {
                for (const loc of filter.location) {
                    if (location.includes(loc)) {
                        // 检查是否需要排除
                        if (filter.excludeLocation && filter.excludeLocation.length > 0) {
                            let shouldExclude = false;
                            for (const excludeLoc of filter.excludeLocation) {
                                if (location.includes(excludeLoc)) {
                                    shouldExclude = true;
                                    break;
                                }
                            }
                            if (shouldExclude) continue;
                        }
                        return true;
                    }
                }
            }
            
            return false;
        };
        
        /**
         * 应用矿区地理分区筛选
         * @param {Array} regions - 区域配置数组
         * 
         * 优先级规则:
         * 1. APEI区域优先级最高(按category匹配)
         * 2. 其他区域按location匹配
         * 3. 每个矿区只属于一个区域
         */
        const applyRegionFilters = (regions) => {
            if (!allEntities.length || !regions || !regions.length) return;
            
            console.log('🗺️ 应用区域筛选:', regions);
            
            // 按优先级排序区域: APEI优先
            const sortedRegions = [...regions].sort((a, b) => {
                if (a.id === 'apei') return -1;
                if (b.id === 'apei') return 1;
                return 0;
            });
            
            let visibleCount = 0;
            
            allEntities.forEach(entity => {
                if (!entity.polygon || !entity.properties) return;
                
                // 找到实体所属的第一个匹配区域(优先级最高的)
                let belongsToRegion = null;
                
                for (const region of sortedRegions) {
                    if (matchRegionFilter(entity, region.filter)) {
                        belongsToRegion = region;
                        break; // 找到第一个匹配的区域就停止
                    }
                }
                
                // 只有当实体所属区域是激活状态时才显示
                const shouldShow = belongsToRegion && belongsToRegion.active;
                
                // 显示或隐藏实体
                entity.show = shouldShow;
                if (shouldShow) visibleCount++;
            });
            
            console.log(`✅ 区域筛选完成: ${visibleCount}/${allEntities.length} 个矿区可见`);
            
            // 强制渲染
            if (viewer) {
                viewer.scene.requestRender();
            }
        };
        
        /**
         * 飞到指定区域
         * @param {Object} region - 区域信息
         */
        const flyToRegion = (region) => {
            if (!viewer || !region || !region.center) return;
            
            console.log('✈️ 飞到区域:', region.label);
            
            viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(
                    region.center.lng,
                    region.center.lat,
                    region.center.height
                ),
                duration: 2.0,
                orientation: {
                    heading: 0,
                    pitch: Cesium.Math.toRadians(-90),
                    roll: 0
                }
            });
        };

        // 筛选逻辑（支持多选）
        const applyFilters = () => {
            if (!allEntities.length) return;
            
            const { minerals, oceans, countries } = props.filters;
            
            // 如果没有任何筛选条件，恢复所有矿区到初始状态
            const hasFilter = minerals.length > 0 || oceans.length > 0 || countries.length > 0;
            
            console.log('🔍 应用筛选:', { minerals, oceans, countries, hasFilter });
            
            let matchCount = 0;
            let totalCount = 0;
            
            allEntities.forEach(entity => {
                if (!entity.polygon || !entity.properties) return;
                
                if (!hasFilter) {
                    // 没有筛选条件：恢复初始状态
                    entity.polygon.material = entity._originalColor.withAlpha(0.5);
                    entity.polygon.outlineColor = Cesium.Color.WHITE.withAlpha(0.9);
                    entity.polygon.outlineWidth = 1;
                    entity.show = true;
                    return;
                }
                
                // 获取实体属性
                const entityMineral = entity.properties.mineral?.getValue();
                const entityLocation = entity.properties.location?.getValue();
                const entitySponsor = entity.properties.sponsor?.getValue();
                
                // 判断是否匹配筛选条件（联级筛选，多选为OR关系）
                let matches = true;
                
                // 矿种筛选（多选，OR关系）
                if (minerals.length > 0) {
                    let mineralMatch = false;
                    for (const mineral of minerals) {
                        if (entityMineral) {
                            // 直接匹配
                            if (entityMineral === mineral) {
                                mineralMatch = true;
                                break;
                            }
                            // 包含匹配（处理括号和缩写）
                            else if (entityMineral.includes(mineral)) {
                                mineralMatch = true;
                                break;
                            }
                            // 特殊处理：富钴结壳 vs 富钴铁锰结壳
                            else if (mineral === '富钴铁锰结壳' && entityMineral.includes('富钴结壳')) {
                                mineralMatch = true;
                                break;
                            }
                        }
                    }
                    if (!mineralMatch) {
                        matches = false;
                    }
                }
                
                // 大洋筛选（多选，OR关系）
                if (oceans.length > 0) {
                    let oceanMatch = false;
                    for (const ocean of oceans) {
                        const oceanKey = ocean.replace('洋', '');
                        if (entityLocation && entityLocation.includes(oceanKey)) {
                            oceanMatch = true;
                            break;
                        }
                    }
                    if (!oceanMatch) {
                        matches = false;
                    }
                }
                
                // 国家筛选（多选，OR关系）
                if (countries.length > 0) {
                    let countryMatch = false;
                    for (const country of countries) {
                        if (entitySponsor === country) {
                            countryMatch = true;
                            break;
                        }
                    }
                    if (!countryMatch) {
                        matches = false;
                    }
                }
                
                totalCount++;
                
                // 应用样式
                if (matches) {
                    matchCount++;
                    // 匹配：保持原色，黄色边框高亮
                    entity.polygon.material = entity._originalColor.withAlpha(0.5);
                    entity.polygon.outlineColor = Cesium.Color.YELLOW;
                    entity.polygon.outlineWidth = 3;
                    entity.show = true;
                } else {
                    // 不匹配：半透明显示
                    entity.polygon.material = entity._originalColor.withAlpha(0.2);
                    entity.polygon.outlineColor = Cesium.Color.WHITE.withAlpha(0.3);
                    entity.polygon.outlineWidth = 1;
                    entity.show = true;
                }
            });
            
            console.log(`✅ 筛选完成: ${matchCount}/${totalCount} 个矿区匹配`);
            
            // 强制渲染
            if (viewer) {
                viewer.scene.requestRender();
            }
        };
        
        /**
         * 显示深海稀土资源分布区域
         */
        // 注释掉旧的深海稀土区域显示函数，现在使用 ResourceLayer 来处理
        // const showRareEarthZones = () => {
        //     if (!viewer) return;
        //     
        //     console.log('🌊 显示深海稀土资源分布区域');
        //     
        //     // 清除已有的深海稀土区域
        //     hideRareEarthZones();
        //     
        //     // 遍历每个区域并创建实体
        //     RARE_EARTH_ZONES.forEach(zone => {
        //         // 将坐标转换为Cesium格式
        //         const positions = zone.coordinates.map(coord => 
        //             Cesium.Cartesian3.fromDegrees(coord[0], coord[1])
        //         );
        //         
        //         // 创建多边形实体
        //         const entity = viewer.entities.add({
        //             name: zone.name,
        //             polygon: {
        //                 hierarchy: new Cesium.PolygonHierarchy(positions),
        //                 material: Cesium.Color.fromCssColorString(zone.color).withAlpha(0.3),
        //                 outline: true,
        //                 outlineColor: Cesium.Color.fromCssColorString(zone.color),
        //                 outlineWidth: 3,
        //                 height: 0,
        //                 classificationType: Cesium.ClassificationType.TERRAIN
        //             },
        //             properties: {
        //                 type: 'rare_earth_zone',
        //                 zoneId: zone.id,
        //                 zoneName: zone.name
        //             }
        //         });
        //         
        //         // 添加文字标签
        //         const centerLng = zone.center.lng;
        //         const centerLat = zone.center.lat;
        //         
        //         const labelEntity = viewer.entities.add({
        //             name: `${zone.name}_label`,
        //             position: Cesium.Cartesian3.fromDegrees(centerLng, centerLat),
        //             label: {
        //                 text: zone.name,
        //                 font: '16px sans-serif',
        //                 fillColor: Cesium.Color.WHITE,
        //                 outlineColor: Cesium.Color.BLACK,
        //                 outlineWidth: 2,
        //                 style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        //                 verticalOrigin: Cesium.VerticalOrigin.CENTER,
        //                 horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        //                 pixelOffset: new Cesium.Cartesian2(0, 0),
        //                 disableDepthTestDistance: Number.POSITIVE_INFINITY
        //             },
        //             properties: {
        //                 type: 'rare_earth_zone_label',
        //                 zoneId: zone.id
        //             }
        //         });
        //         
        //         rareEarthEntities.push(entity, labelEntity);
        //     });
        //     
        //     console.log(`✅ 已显示 ${RARE_EARTH_ZONES.length} 个深海稀土区域`);
        //     
        //     // 强制渲染
        //     if (viewer) {
        //         viewer.scene.requestRender();
        //     }
        // };
        
        // /**
        //  * 隐藏深海稀土资源分布区域
        //  */
        // const hideRareEarthZones = () => {
        //     if (!viewer) return;
        //     
        //     console.log('🌊 隐藏深海稀土资源分布区域');
        //     
        //     // 移除所有深海稀土区域实体
        //     rareEarthEntities.forEach(entity => {
        //         viewer.entities.remove(entity);
        //     });
        //     
        //     rareEarthEntities = [];
        //     
        //     // 强制渲染
        //     if (viewer) {
        //         viewer.scene.requestRender();
        //     }
        // };
        
        /**
         * 根据国家态度渲染国家地理边界
         */
        const applyCountryAttitudes = async () => {
            console.log('🌍 开始加载各国态度渲染');
            
            try {
                // 加载世界国家GeoJSON数据
                const response = await fetch('/data/World_countries_simply.geojson');
                const geojsonData = await response.json();
                
                console.log('✅ 已加载世界国家GeoJSON数据');
                
                // 创建国家到态度的映射
                const countryToAttitude = new Map();
                Object.entries(COUNTRY_ATTITUDES).forEach(([attitudeKey, attitudeData]) => {
                    attitudeData.countries.forEach(country => {
                        countryToAttitude.set(country, {
                            type: attitudeKey,
                            label: attitudeData.label,
                            color: attitudeData.color
                        });
                    });
                });
                
                console.log('📊 国家态度映射:', countryToAttitude);
                
                // 创建一个新的DataSource用于国家边界
                const countryDataSource = new Cesium.GeoJsonDataSource('country-attitudes');
                
                // 过滤出有态度数据的国家
                const filteredFeatures = geojsonData.features.filter(feature => {
                    const countryName = feature.properties.FCNAME || feature.properties.NAME;
                    return countryToAttitude.has(countryName);
                });
                
                console.log(`🔍 找到 ${filteredFeatures.length} 个有态度数据的国家`);
                
                // 创建过滤后的GeoJSON
                const filteredGeoJson = {
                    type: 'FeatureCollection',
                    features: filteredFeatures
                };
                
                // 加载到DataSource
                await countryDataSource.load(filteredGeoJson);
                
                // 为每个国家设置对应的颜色
                const entities = countryDataSource.entities.values;
                entities.forEach(entity => {
                    if (entity.polygon && entity.properties) {
                        const countryName = entity.properties.FCNAME?.getValue() || 
                                          entity.properties.NAME?.getValue();
                        
                        if (countryName && countryToAttitude.has(countryName)) {
                            const attitude = countryToAttitude.get(countryName);
                            const color = Cesium.Color.fromCssColorString(attitude.color);
                            
                            // 设置国家颜色（不透明）
                            entity.polygon.material = color;
                            entity.polygon.outline = true;
                            entity.polygon.outlineColor = color;
                            entity.polygon.outlineWidth = 2;
                            entity.polygon.height = 0;
                            entity.polygon.classificationType = Cesium.ClassificationType.TERRAIN;
                            
                            // 存储态度信息（使用更安全的方式）
                            try {
                                if (!entity.properties.hasProperty('attitude')) {
                                    entity.properties.addProperty('attitude', attitude.label);
                                }
                                if (!entity.properties.hasProperty('attitudeType')) {
                                    entity.properties.addProperty('attitudeType', attitude.type);
                                }
                            } catch (e) {
                                console.warn('添加属性失败:', e);
                            }
                            
                            console.log(`  ✓ ${countryName} - ${attitude.label} (${attitude.color})`);
                        }
                    }
                });
                
                // 添加到viewer
                await viewer.dataSources.add(countryDataSource);
                
                // 保存引用以便后续清除
                viewer._countryAttitudesDataSource = countryDataSource;
                
                console.log(`✅ 已渲染 ${entities.length} 个国家的态度`);
                
                // 强制渲染
                if (viewer) {
                    viewer.scene.requestRender();
                }
                
            } catch (error) {
                console.error('❌ 加载国家态度数据失败:', error);
            }
        };
        
        /**
         * 清除国家态度渲染
         */
        const clearCountryAttitudes = () => {
            if (!viewer) return;
            
            console.log('🗑️ 清除国家态度渲染');
            
            // 移除国家态度DataSource
            if (viewer._countryAttitudesDataSource) {
                viewer.dataSources.remove(viewer._countryAttitudesDataSource);
                viewer._countryAttitudesDataSource = null;
            }
            
            console.log('✅ 已清除国家态度渲染');
            
            // 强制渲染
            if (viewer) {
                viewer.scene.requestRender();
            }
        };
        
        /**
         * 切换各国态度渲染
         */
        const toggleCountryAttitudes = (show) => {
            console.log('🎯 toggleCountryAttitudes 被调用, show:', show);
            console.log('🎯 viewer 存在:', !!viewer);
            console.log('🎯 COUNTRY_ATTITUDES:', COUNTRY_ATTITUDES);
            
            countryAttitudesActive = show;
            
            if (show) {
                applyCountryAttitudes();
            } else {
                clearCountryAttitudes();
            }
        };
        
        const setEntityProperty = (entity, key, value) => {
            if (!entity.properties) {
                entity.properties = new Cesium.PropertyBag();
            }
            try {
                if (!entity.properties.hasProperty(key)) {
                    entity.properties.addProperty(key);
                }
                entity.properties[key] = value;
            } catch (error) {
                entity.properties[key] = value;
            }
        };
        
        const parseShareValue = (share) => {
            if (!share) return null;
            const num = parseFloat(String(share).replace('%', '').trim());
            return Number.isFinite(num) ? num : null;
        };

        const parseMineralImportVolumeValue = (volume) => {
            if (volume == null || volume === '') return null;
            const num = parseFloat(String(volume).replace(/,/g, '').trim());
            return Number.isFinite(num) ? num : null;
        };

        const getMineralImportCommodityShortLabel = (commodityName = '') => {
            const normalized = String(commodityName || '').trim();
            if (!normalized) return '矿种';

            const shortLabelMap = {
                '液化天然气': 'LNG',
                '铜精矿': '铜精',
                '铁矿石': '铁矿',
                '镍矿': '镍矿',
                '锰矿': '锰矿',
                '石油': '石油',
                '煤炭': '煤炭',
                '大豆': '大豆',
                '大麦': '大麦',
                '高粱': '高粱',
                '稻米': '稻米',
                '小麦': '小麦',
                '玉米': '玉米'
            };

            return shortLabelMap[normalized] || normalized.slice(0, 2);
        };

        const normalizeMineralImportUnit = (unit = '') => {
            const normalized = String(unit || '').trim();
            return normalized || '万吨';
        };

        const getCompactMineralImportUnitLabel = (unit = '') => {
            const normalized = normalizeMineralImportUnit(unit);
            if (normalized === '万实物吨') return '万实吨';
            return normalized;
        };

        const buildMineralImportAxisUnitLabel = (units = []) => {
            const normalizedUnits = Array.from(new Set(
                units
                    .map(unit => normalizeMineralImportUnit(unit))
                    .filter(Boolean)
            ));

            if (normalizedUnits.length === 0) return '万吨';
            if (normalizedUnits.length === 1) {
                return getCompactMineralImportUnitLabel(normalizedUnits[0]);
            }

            return normalizedUnits
                .slice(0, 2)
                .map(unit => getCompactMineralImportUnitLabel(unit))
                .join('/');
        };

        const formatMineralImportAxisTickValue = (value) => {
            const numericValue = Number(value);
            if (!Number.isFinite(numericValue) || numericValue <= 0) return '0';
            if (numericValue >= 1000) return String(Math.round(numericValue));
            if (numericValue >= 100) return numericValue.toFixed(0);
            if (numericValue >= 10) return numericValue.toFixed(1).replace(/\.0$/, '');
            return numericValue
                .toFixed(2)
                .replace(/0+$/, '')
                .replace(/\.$/, '');
        };
        
        const resolveCountryName = (countryName) => {
            if (!countryName) return '';
            return MINERAL_IMPORT_COUNTRY_ALIAS[countryName] || countryName;
        };

        const normalizeLongitude = (lon) => {
            let normalized = Number(lon);
            while (normalized > 180) normalized -= 360;
            while (normalized < -180) normalized += 360;
            return normalized;
        };

        const splitRingByDateline = (ring) => {
            if (!Array.isArray(ring) || ring.length < 2) return [];
            const segments = [];
            let current = [];

            ring.forEach((point) => {
                if (!Array.isArray(point) || point.length < 2) return;
                const lon = normalizeLongitude(point[0]);
                const lat = Number(point[1]);
                if (!Number.isFinite(lon) || !Number.isFinite(lat)) return;

                if (current.length > 0) {
                    const prevLon = current[current.length - 1][0];
                    if (Math.abs(lon - prevLon) > 180) {
                        if (current.length >= 2) segments.push(current);
                        current = [];
                    }
                }
                current.push([lon, lat]);
            });

            if (current.length >= 2) {
                segments.push(current);
            }
            return segments;
        };

        const ensureCountryBoundaryRecord = (countryName) => {
            if (!mineralImportCountryBoundaryMap.has(countryName)) {
                mineralImportCountryBoundaryMap.set(countryName, {
                    rings: [],
                    cartesianPositions: []
                });
            }
            return mineralImportCountryBoundaryMap.get(countryName);
        };

        const appendOuterRingsFromGeometry = (countryName, geometry) => {
            if (!geometry || !geometry.type) return;
            const record = ensureCountryBoundaryRecord(countryName);

            const appendRing = (ring) => {
                const segments = splitRingByDateline(ring);
                segments.forEach((segment) => {
                    if (segment.length < 2) return;
                    record.rings.push(segment);
                    segment.forEach(([lon, lat]) => {
                        record.cartesianPositions.push(Cesium.Cartesian3.fromDegrees(lon, lat, 60));
                    });
                });
            };

            if (geometry.type === 'Polygon') {
                if (Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0) {
                    appendRing(geometry.coordinates[0]);
                }
                return;
            }

            if (geometry.type === 'MultiPolygon') {
                if (Array.isArray(geometry.coordinates)) {
                    geometry.coordinates.forEach((polygon) => {
                        if (Array.isArray(polygon) && polygon.length > 0) {
                            appendRing(polygon[0]);
                        }
                    });
                }
            }
        };

        const rebuildMineralImportCountryBoundaryMap = (features) => {
            mineralImportCountryBoundaryMap = new Map();
            if (!Array.isArray(features)) return;
            features.forEach((feature) => {
                const countryName = feature?.properties?.FCNAME || feature?.properties?.NAME;
                if (!countryName) return;
                appendOuterRingsFromGeometry(countryName, feature.geometry);
            });
        };

        const addGlowPolylineForRing = (ring) => {
            if (!Array.isArray(ring) || ring.length < 2) return;
            const closed = [...ring];
            const first = closed[0];
            const last = closed[closed.length - 1];
            if (
                closed.length > 2 &&
                (first[0] !== last[0] || first[1] !== last[1])
            ) {
                closed.push([first[0], first[1]]);
            }
            const positions = closed.map(([lon, lat]) => Cesium.Cartesian3.fromDegrees(lon, lat, 80));

            // 底层暗边：把边界从复杂底图里“抠”出来，保证可见性
            const darkEdgeEntity = viewer.entities.add({
                polyline: {
                    positions,
                    width: 18,
                    clampToGround: true,
                    material: Cesium.Color.fromCssColorString('#020617').withAlpha(0.92),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            });

            // 中层主蓝边：主要视觉层，明显的科技蓝高亮
            const blueEdgeEntity = viewer.entities.add({
                polyline: {
                    positions,
                    width: 11,
                    clampToGround: true,
                    material: new Cesium.PolylineGlowMaterialProperty({
                        glowPower: 0.55,
                        taperPower: 0.6,
                        color: Cesium.Color.fromCssColorString('#0ea5ff').withAlpha(1.0)
                    }),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            });

            // 顶层亮芯：增强锐利度和科技感
            const coreEdgeEntity = viewer.entities.add({
                polyline: {
                    positions,
                    width: 4,
                    clampToGround: true,
                    material: Cesium.Color.fromCssColorString('#d8f5ff').withAlpha(0.95),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            });

            mineralImportBorderHighlightEntities.push(
                darkEdgeEntity,
                blueEdgeEntity,
                coreEdgeEntity
            );
        };

        const createMineralImportLabelTexture = (text, options = {}) => {
            const lines = String(text || '')
                .split('\n')
                .map(line => line.trim())
                .filter(Boolean);
            const themeColor = options.themeColor || '#38bdf8';
            const cornerColor = options.overlap ? '#facc15' : '#f8fafc';
            const renderScale = 1.8;
            const dpr = (window.devicePixelRatio || 1) * renderScale;
            const paddingX = 18;
            const paddingY = 12;
            const lineHeight = 20;
            const font = '700 15px "Noto Sans SC"';

            const measureCanvas = document.createElement('canvas');
            const measureCtx = measureCanvas.getContext('2d');
            measureCtx.font = font;
            const maxTextWidth = Math.max(
                80,
                ...lines.map(line => Math.ceil(measureCtx.measureText(line).width))
            );

            const width = maxTextWidth + paddingX * 2;
            const height = lines.length * lineHeight + paddingY * 2;

            const canvas = document.createElement('canvas');
            canvas.width = Math.ceil(width * dpr);
            canvas.height = Math.ceil(height * dpr);
            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);

            const drawSolidWhiteText = (content, x, y) => {
                ctx.save();
                ctx.lineJoin = 'round';
                ctx.miterLimit = 2;
                ctx.strokeStyle = 'rgba(5, 12, 24, 0.96)';
                ctx.lineWidth = 3.2;
                ctx.strokeText(content, x, y);
                ctx.fillStyle = '#ffffff';
                ctx.fillText(content, x, y);
                ctx.restore();
            };

            const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
            bgGradient.addColorStop(0, 'rgba(6, 18, 34, 0.98)');
            bgGradient.addColorStop(1, 'rgba(5, 32, 54, 0.95)');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, width, height);

            const borderColor = Cesium.Color.fromCssColorString(themeColor);
            ctx.strokeStyle = borderColor.withAlpha(0.96).toCssColorString();
            ctx.lineWidth = 1.4;
            ctx.strokeRect(0.7, 0.7, width - 1.4, height - 1.4);

            const cornerLen = 8;
            ctx.strokeStyle = Cesium.Color.fromCssColorString(cornerColor).withAlpha(0.95).toCssColorString();
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            // top-left
            ctx.moveTo(1.2, cornerLen + 1.2);
            ctx.lineTo(1.2, 1.2);
            ctx.lineTo(cornerLen + 1.2, 1.2);
            // top-right
            ctx.moveTo(width - cornerLen - 1.2, 1.2);
            ctx.lineTo(width - 1.2, 1.2);
            ctx.lineTo(width - 1.2, cornerLen + 1.2);
            // bottom-left
            ctx.moveTo(1.2, height - cornerLen - 1.2);
            ctx.lineTo(1.2, height - 1.2);
            ctx.lineTo(cornerLen + 1.2, height - 1.2);
            // bottom-right
            ctx.moveTo(width - cornerLen - 1.2, height - 1.2);
            ctx.lineTo(width - 1.2, height - 1.2);
            ctx.lineTo(width - 1.2, height - cornerLen - 1.2);
            ctx.stroke();

            const scanGradient = ctx.createLinearGradient(0, 0, width, 0);
            scanGradient.addColorStop(0, borderColor.withAlpha(0).toCssColorString());
            scanGradient.addColorStop(0.5, borderColor.withAlpha(0.78).toCssColorString());
            scanGradient.addColorStop(1, borderColor.withAlpha(0).toCssColorString());
            ctx.fillStyle = scanGradient;
            ctx.fillRect(4, 4, width - 8, 1.6);

            ctx.font = font;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            lines.forEach((line, index) => {
                const y = paddingY + lineHeight * index + lineHeight * 0.5;
                drawSolidWhiteText(line, width / 2, y);
            });

            return {
                image: canvas.toDataURL('image/png'),
                width,
                height
            };
        };

        const createMineralImportLabelBarTexture = (chartConfig = {}, options = {}) => {
            const rawBars = Array.isArray(chartConfig)
                ? chartConfig
                : (Array.isArray(chartConfig?.bars) ? chartConfig.bars : []);
            const bars = Array.isArray(rawBars)
                ? rawBars
                    .map((bar) => ({
                        ratio: Math.max(0, Math.min(1, Number(bar?.ratio) || 0)),
                        color: bar?.color || options.themeColor || '#38bdf8',
                        isFocus: bar?.isFocus === true,
                        shortLabel: String(bar?.shortLabel || '').trim().slice(0, 3) || '矿种',
                        valueLabel: String(bar?.valueLabel || '').trim()
                    }))
                    .filter((bar) => bar.ratio > 0)
                    .slice(0, 4)
                : [];

            if (bars.length === 0) return null;

            const themeColor = options.themeColor || '#38bdf8';
            const borderColor = Cesium.Color.fromCssColorString(themeColor);
            const yAxisTitle = String(chartConfig?.axisTitle || options.axisTitle || '万吨').trim() || '万吨';
            const tickValues = Array.isArray(chartConfig?.tickValues) && chartConfig.tickValues.length > 0
                ? chartConfig.tickValues.slice(0, 3)
                : ['100', '50', '0'];
            const renderScale = 2;
            const dpr = (window.devicePixelRatio || 1) * renderScale;
            const width = [0, 150, 166, 184, 202][bars.length] || 202;
            const height = Math.max(124, Math.round(options.height || 132));
            const canvas = document.createElement('canvas');
            canvas.width = Math.ceil(width * dpr);
            canvas.height = Math.ceil(height * dpr);
            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);

            const drawSolidWhiteText = (content, x, y, align = 'left', baseline = 'top', strokeWidth = 2.4) => {
                ctx.save();
                ctx.textAlign = align;
                ctx.textBaseline = baseline;
                ctx.lineJoin = 'round';
                ctx.miterLimit = 2;
                ctx.strokeStyle = 'rgba(5, 12, 24, 0.98)';
                ctx.lineWidth = strokeWidth;
                ctx.strokeText(content, x, y);
                ctx.fillStyle = '#ffffff';
                ctx.fillText(content, x, y);
                ctx.restore();
            };

            const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
            bgGradient.addColorStop(0, 'rgba(6, 18, 34, 0.98)');
            bgGradient.addColorStop(1, 'rgba(5, 32, 54, 0.95)');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, width, height);

            ctx.strokeStyle = borderColor.withAlpha(0.9).toCssColorString();
            ctx.lineWidth = 1.2;
            ctx.strokeRect(0.6, 0.6, width - 1.2, height - 1.2);

            ctx.fillStyle = borderColor.withAlpha(0.8).toCssColorString();
            ctx.fillRect(4, 4, width - 8, 1.2);

            const plotLeft = 48;
            const plotRight = width - 10;
            const plotTop = 18;
            const plotBottom = height - 26;
            const plotHeight = Math.max(30, plotBottom - plotTop);
            const plotWidth = Math.max(34, plotRight - plotLeft);
            const slotWidth = plotWidth / bars.length;
            const barWidth = Math.max(12, Math.min(24, slotWidth - 10));

            ctx.font = '700 11px "Noto Sans SC"';
            drawSolidWhiteText(yAxisTitle, 7, 7, 'left', 'top', 2.6);

            ctx.strokeStyle = borderColor.withAlpha(0.22).toCssColorString();
            ctx.beginPath();
            for (let index = 1; index <= 3; index += 1) {
                const y = plotBottom - (plotHeight * index / 4);
                ctx.moveTo(plotLeft, y);
                ctx.lineTo(plotRight, y);
            }
            ctx.stroke();

            ctx.strokeStyle = borderColor.withAlpha(0.42).toCssColorString();
            ctx.beginPath();
            ctx.moveTo(plotLeft + 0.5, plotTop);
            ctx.lineTo(plotLeft + 0.5, plotBottom + 0.5);
            ctx.moveTo(plotLeft, plotBottom + 0.5);
            ctx.lineTo(plotRight, plotBottom + 0.5);
            ctx.stroke();

            const tickLabelValues = [
                { value: String(tickValues[0] ?? ''), y: plotTop },
                { value: String(tickValues[1] ?? ''), y: plotBottom - plotHeight / 2 },
                { value: String(tickValues[2] ?? '0'), y: plotBottom }
            ];

            ctx.font = '700 11px "Noto Sans SC"';
            tickLabelValues.forEach((tick) => {
                drawSolidWhiteText(tick.value, plotLeft - 4, tick.y, 'right', 'middle', 2.2);
            });

            bars.forEach((bar, index) => {
                const x = plotLeft + slotWidth * index + (slotWidth - barWidth) / 2;
                const barHeight = Math.max(3, plotHeight * bar.ratio);
                const y = plotBottom - barHeight;
                const barColor = Cesium.Color.fromCssColorString(bar.color || themeColor);
                const barGradient = ctx.createLinearGradient(x, y, x, plotBottom);
                barGradient.addColorStop(0, barColor.withAlpha(bar.isFocus ? 1.0 : 0.9).toCssColorString());
                barGradient.addColorStop(1, barColor.withAlpha(bar.isFocus ? 0.42 : 0.28).toCssColorString());

                if (bar.isFocus) {
                    ctx.fillStyle = barColor.withAlpha(0.14).toCssColorString();
                    ctx.fillRect(x - 2, y - 2, barWidth + 4, barHeight + 4);
                }

                ctx.fillStyle = barGradient;
                ctx.fillRect(x, y, barWidth, barHeight);
                ctx.strokeStyle = barColor.withAlpha(bar.isFocus ? 0.98 : 0.78).toCssColorString();
                ctx.lineWidth = bar.isFocus ? 1.1 : 1;
                ctx.strokeRect(x + 0.5, y + 0.5, Math.max(1, barWidth - 1), Math.max(1, barHeight - 1));

                ctx.fillStyle = barColor.withAlpha(0.95).toCssColorString();
                ctx.fillRect(x, Math.max(plotTop, y), barWidth, 1.2);

                const tickX = x + barWidth / 2;
                ctx.strokeStyle = borderColor.withAlpha(0.38).toCssColorString();
                ctx.beginPath();
                ctx.moveTo(tickX, plotBottom + 0.5);
                ctx.lineTo(tickX, plotBottom + 3.5);
                ctx.stroke();

                if (bar.valueLabel) {
                    ctx.font = '700 10px "Noto Sans SC"';
                    drawSolidWhiteText(
                        bar.valueLabel,
                        tickX,
                        Math.max(plotTop + 10, y - 6),
                        'center',
                        'bottom',
                        2.4
                    );
                }

                ctx.font = '600 11px "Noto Sans SC"';
                drawSolidWhiteText(bar.shortLabel, tickX, plotBottom + 6, 'center', 'top', 2.4);
            });

            return {
                image: canvas.toDataURL('image/png'),
                width,
                height
            };
        };

        const createMineralImportFlagFrameTexture = (themeColor) => {
            const cacheKey = themeColor || '#38bdf8';
            if (mineralImportFlagFrameTextureCache.has(cacheKey)) {
                return mineralImportFlagFrameTextureCache.get(cacheKey);
            }

            const width = 32;
            const height = 24;
            const dpr = (window.devicePixelRatio || 1) * 1.6;
            const canvas = document.createElement('canvas');
            canvas.width = Math.ceil(width * dpr);
            canvas.height = Math.ceil(height * dpr);
            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);

            const borderColor = Cesium.Color.fromCssColorString(themeColor || '#38bdf8');
            const bgGradient = ctx.createLinearGradient(0, 0, width, height);
            bgGradient.addColorStop(0, 'rgba(6, 18, 34, 0.98)');
            bgGradient.addColorStop(1, 'rgba(5, 32, 54, 0.95)');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, width, height);

            ctx.strokeStyle = borderColor.withAlpha(0.9).toCssColorString();
            ctx.lineWidth = 1.1;
            ctx.strokeRect(0.7, 0.7, width - 1.4, height - 1.4);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(2, 6);
            ctx.lineTo(2, 2);
            ctx.lineTo(7, 2);
            ctx.moveTo(width - 7, 2);
            ctx.lineTo(width - 2, 2);
            ctx.lineTo(width - 2, 7);
            ctx.stroke();

            ctx.fillStyle = borderColor.withAlpha(0.85).toCssColorString();
            ctx.fillRect(4, 4, width - 8, 1.2);

            const texture = {
                image: canvas.toDataURL('image/png'),
                width,
                height
            };
            mineralImportFlagFrameTextureCache.set(cacheKey, texture);
            return texture;
        };

        const clampMineralImportLabelLatitude = (lat) => {
            return Math.max(-80, Math.min(80, lat));
        };

        const getMineralImportLabelPlacement = (countryName, centerLon, centerLat, sphereRadius) => {
            const preset = MINERAL_IMPORT_LABEL_LAYOUTS[countryName];
            const useAutoCallout = !preset && sphereRadius < 320000;
            const lonOffset = preset?.lonOffset ?? (useAutoCallout ? 3.8 : 0);
            const latOffset = preset?.latOffset ?? (useAutoCallout ? 1.8 : 0);
            const isCallout = Math.abs(lonOffset) > 0.01 || Math.abs(latOffset) > 0.01;

            return {
                isCallout,
                anchorLon: centerLon,
                anchorLat: centerLat,
                labelLon: centerLon + lonOffset,
                labelLat: clampMineralImportLabelLatitude(centerLat + latOffset),
                labelHeight: preset?.labelHeight ?? (isCallout ? 220000 : 150000),
                anchorHeight: preset?.anchorHeight ?? 80000,
                scale: preset?.scale ?? 0.92
            };
        };

        const rectsOverlap = (rectA, rectB, padding = 10) => {
            if (!rectA || !rectB) return false;
            return !(
                rectA.right + padding < rectB.left ||
                rectA.left - padding > rectB.right ||
                rectA.bottom + padding < rectB.top ||
                rectA.top - padding > rectB.bottom
            );
        };

        const isRectInsideViewport = (rect, viewport, padding = 10) => {
            if (!rect || !viewport) return false;
            return (
                rect.left >= padding &&
                rect.top >= padding &&
                rect.right <= viewport.width - padding &&
                rect.bottom <= viewport.height - padding
            );
        };

        const getMineralImportPreferredDirections = (countryName, defaultPlacement) => {
            const preset = MINERAL_IMPORT_LABEL_LAYOUTS[countryName];
            const preferredX = preset?.lonOffset
                ? (preset.lonOffset >= 0 ? 1 : -1)
                : (defaultPlacement?.labelLon >= defaultPlacement?.anchorLon ? 1 : -1);
            const preferredY = preset?.latOffset
                ? (preset.latOffset >= 0 ? -1 : 1)
                : (defaultPlacement?.labelLat >= defaultPlacement?.anchorLat ? -1 : 1);

            return [
                { x: preferredX, y: preferredY },
                { x: preferredX, y: -preferredY },
                { x: -preferredX, y: preferredY },
                { x: -preferredX, y: -preferredY },
                { x: preferredX, y: 0 },
                { x: -preferredX, y: 0 },
                { x: 0, y: preferredY },
                { x: 0, y: -preferredY }
            ];
        };

        const buildMineralImportLabelCandidates = (countryName, defaultPlacement, dimensions) => {
            const labelWidth = dimensions?.labelWidth || 120;
            const labelHeight = dimensions?.labelHeight || 48;
            const barWidth = dimensions?.barWidth || 0;
            const barGap = barWidth > 0 ? 12 : 0;
            const groupWidth = labelWidth + barGap + barWidth;
            const groupHeight = Math.max(labelHeight, dimensions?.barHeight || 0, 48);
            const directions = getMineralImportPreferredDirections(countryName, defaultPlacement);
            const distanceLevels = [0, 34, 72, 110, 156, 210];
            const verticalLevels = [0, 20, 40];
            const seen = new Set();
            const candidates = [];

            distanceLevels.forEach((distance) => {
                directions.forEach((direction) => {
                    verticalLevels.forEach((verticalExtra) => {
                        const dxBase = direction.x === 0
                            ? 0
                            : direction.x * (groupWidth / 2 + 20 + distance);
                        const dyBase = direction.y === 0
                            ? 0
                            : direction.y * (groupHeight / 2 + 18 + distance * 0.65 + verticalExtra);
                        const dx = Math.round(dxBase);
                        const dy = Math.round(dyBase);
                        const key = `${dx}_${dy}`;
                        if (seen.has(key)) return;
                        seen.add(key);
                        candidates.push({ dx, dy });
                    });
                });
            });

            candidates.unshift({ dx: 0, dy: 0 });
            return candidates;
        };

        const chooseMineralImportLabelPlacement = (countryName, centerLon, centerLat, sphereRadius, dimensions, occupiedRects = []) => {
            const defaultPlacement = getMineralImportLabelPlacement(countryName, centerLon, centerLat, sphereRadius);

            if (!viewer?.scene?.canvas) {
                return defaultPlacement;
            }

            const anchorPosition = Cesium.Cartesian3.fromDegrees(
                defaultPlacement.anchorLon,
                defaultPlacement.anchorLat,
                defaultPlacement.anchorHeight
            );
            const anchorWindow = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, anchorPosition);
            if (!anchorWindow) {
                return defaultPlacement;
            }

            const viewport = {
                width: viewer.scene.canvas.clientWidth || viewer.scene.canvas.width || 0,
                height: viewer.scene.canvas.clientHeight || viewer.scene.canvas.height || 0
            };
            const scale = defaultPlacement.scale || 0.92;
            const labelWidth = (dimensions?.labelWidth || 120) * scale;
            const labelHeight = (dimensions?.labelHeight || 48) * scale;
            const barWidth = (dimensions?.barWidth || 0) * scale;
            const barHeight = (dimensions?.barHeight || 0) * scale;
            const barGap = barWidth > 0 ? 12 : 0;
            const groupWidth = labelWidth + barGap + barWidth;
            const groupHeight = Math.max(labelHeight, barHeight, 48);
            const labelOffsetY = defaultPlacement.isCallout ? -8 : -14;
            const candidates = buildMineralImportLabelCandidates(countryName, defaultPlacement, {
                labelWidth,
                labelHeight,
                barWidth,
                barHeight
            });
            const ellipsoid = viewer.scene.globe?.ellipsoid || Cesium.Ellipsoid.WGS84;

            const tryPlacement = (screenX, screenY, placementOverrides = {}) => {
                const rect = {
                    left: screenX - labelWidth / 2,
                    top: screenY + labelOffsetY - groupHeight,
                    right: screenX - labelWidth / 2 + groupWidth,
                    bottom: screenY + labelOffsetY
                };

                if (!isRectInsideViewport(rect, viewport, 12)) {
                    return null;
                }

                const hasOverlap = occupiedRects.some((occupiedRect) => rectsOverlap(rect, occupiedRect, 12));
                if (hasOverlap) {
                    return null;
                }

                const cartesian = viewer.camera.pickEllipsoid(
                    new Cesium.Cartesian2(screenX, screenY),
                    ellipsoid
                );
                if (!cartesian) {
                    return null;
                }

                const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                if (!cartographic) {
                    return null;
                }

                const connectorTargetScreenX = screenX + (barWidth > 0 ? (barWidth + barGap) / 2 : 0);
                const connectorTargetScreenY = screenY + labelOffsetY - 2;
                const connectorTargetCartesian = viewer.camera.pickEllipsoid(
                    new Cesium.Cartesian2(connectorTargetScreenX, connectorTargetScreenY),
                    ellipsoid
                );
                const connectorTargetCartographic = connectorTargetCartesian
                    ? Cesium.Cartographic.fromCartesian(connectorTargetCartesian)
                    : null;

                occupiedRects.push(rect);
                return {
                    ...defaultPlacement,
                    labelLon: Cesium.Math.toDegrees(cartographic.longitude),
                    labelLat: clampMineralImportLabelLatitude(Cesium.Math.toDegrees(cartographic.latitude)),
                    labelHeight: Math.max(defaultPlacement.labelHeight, 180000),
                    connectorTargetLon: connectorTargetCartographic
                        ? Cesium.Math.toDegrees(connectorTargetCartographic.longitude)
                        : Cesium.Math.toDegrees(cartographic.longitude),
                    connectorTargetLat: connectorTargetCartographic
                        ? clampMineralImportLabelLatitude(Cesium.Math.toDegrees(connectorTargetCartographic.latitude))
                        : clampMineralImportLabelLatitude(Cesium.Math.toDegrees(cartographic.latitude)),
                    ...placementOverrides
                };
            };

            const defaultLabelPosition = Cesium.Cartesian3.fromDegrees(
                defaultPlacement.labelLon,
                defaultPlacement.labelLat,
                defaultPlacement.labelHeight
            );
            const defaultLabelWindow = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, defaultLabelPosition);
            if (defaultLabelWindow) {
                const preservedPlacement = tryPlacement(defaultLabelWindow.x, defaultLabelWindow.y, {
                    isCallout: defaultPlacement.isCallout
                });
                if (preservedPlacement) {
                    return preservedPlacement;
                }
            }

            for (const candidate of candidates) {
                const screenX = anchorWindow.x + candidate.dx;
                const screenY = anchorWindow.y + candidate.dy;
                const autoPlacement = tryPlacement(screenX, screenY, {
                    isCallout: candidate.dx !== 0 || candidate.dy !== 0,
                    screenOffsetX: candidate.dx,
                    screenOffsetY: candidate.dy
                });
                if (autoPlacement) {
                    return autoPlacement;
                }
            }

            return defaultPlacement;
        };

        const addMineralImportLabelConnector = (placement, themeColor) => {
            if (!placement?.isCallout) return;

            const targetLon = placement.connectorTargetLon ?? placement.labelLon;
            const targetLat = placement.connectorTargetLat ?? placement.labelLat;
            const midpointLon = (placement.anchorLon + targetLon) / 2;
            const midpointLat = clampMineralImportLabelLatitude((placement.anchorLat + targetLat) / 2 + 0.35);
            const backlineEntity = viewer.entities.add({
                polyline: {
                    positions: [
                        Cesium.Cartesian3.fromDegrees(placement.anchorLon, placement.anchorLat, placement.anchorHeight),
                        Cesium.Cartesian3.fromDegrees(
                            midpointLon,
                            midpointLat,
                            placement.labelHeight * 0.84
                        ),
                        Cesium.Cartesian3.fromDegrees(targetLon, targetLat, placement.labelHeight - 25000)
                    ],
                    width: 5.2,
                    material: Cesium.Color.fromCssColorString('#03111f').withAlpha(0.76),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            });

            const connectorEntity = viewer.entities.add({
                polyline: {
                    positions: [
                        Cesium.Cartesian3.fromDegrees(placement.anchorLon, placement.anchorLat, placement.anchorHeight),
                        Cesium.Cartesian3.fromDegrees(
                            midpointLon,
                            midpointLat,
                            placement.labelHeight * 0.84
                        ),
                        Cesium.Cartesian3.fromDegrees(targetLon, targetLat, placement.labelHeight - 25000)
                    ],
                    width: 3.6,
                    material: new Cesium.PolylineGlowMaterialProperty({
                        glowPower: 0.34,
                        taperPower: 0.74,
                        color: Cesium.Color.fromCssColorString(themeColor).withAlpha(0.94)
                    }),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            });

            mineralImportLabelEntities.push(backlineEntity, connectorEntity);
        };

        const resetMineralImportHighlight = () => {
            if (mineralImportHighlightedEntities.length > 0) {
                mineralImportHighlightedEntities.forEach((entity) => {
                    if (!entity?.polygon) return;
                    if (entity._mineralImportBaseMaterial) {
                        entity.polygon.material = entity._mineralImportBaseMaterial;
                    }
                    if (entity._mineralImportBaseOutlineColor) {
                        entity.polygon.outlineColor = entity._mineralImportBaseOutlineColor;
                    }
                    if (typeof entity._mineralImportBaseOutlineWidth === 'number') {
                        entity.polygon.outlineWidth = entity._mineralImportBaseOutlineWidth;
                    }
                });
                mineralImportHighlightedEntities = [];
            }

            if (mineralImportBorderHighlightEntities.length > 0) {
                mineralImportBorderHighlightEntities.forEach((entity) => viewer.entities.remove(entity));
                mineralImportBorderHighlightEntities = [];
            }
        };

        const MINERAL_IMPORT_OVERLAP_COLOR = '#0ea5ff';
        const MINERAL_IMPORT_OVERLAP_OUTLINE_COLOR = '#facc15';
        const MINERAL_IMPORT_LABEL_LAYOUTS = {
            '科威特': { lonOffset: 5.4, latOffset: 2.2, labelHeight: 230000, anchorHeight: 100000 },
            '阿联酋': { lonOffset: 5.1, latOffset: 1.7, labelHeight: 230000, anchorHeight: 100000 },
            '阿曼': { lonOffset: 6.4, latOffset: 0.7, labelHeight: 230000, anchorHeight: 100000 },
            '卡塔尔': { lonOffset: 4.6, latOffset: 2.5, labelHeight: 230000, anchorHeight: 100000 },
            '伊拉克': { lonOffset: 4.8, latOffset: 3.3, labelHeight: 220000, anchorHeight: 90000 },
            '沙特阿拉伯': { lonOffset: 7.2, latOffset: 2.5, labelHeight: 220000, anchorHeight: 90000 },
            '塞尔维亚': { lonOffset: 4.0, latOffset: 2.0, labelHeight: 210000, anchorHeight: 90000 }
        };

        const getCommodityThemeColor = (commodityId, category) => {
            const dataColor = getMineralImportCommodityColor(commodityId);
            if (dataColor) return dataColor;
            return category?.color || '#0EA5E9';
        };

        const joinMineralImportNotes = (...notes) => {
            const normalized = notes
                .flatMap((note) => Array.isArray(note) ? note : [note])
                .map((note) => String(note || '').trim())
                .filter(Boolean);
            return Array.from(new Set(normalized)).join('；');
        };

        const buildMineralImportDataQualityNote = (source) => {
            const notes = [];
            if (source?.volumeType === 'derived') {
                notes.push('进口量为估算/转述值，请结合原文说明理解。');
            }
            if (source?.shareType === 'derived') {
                notes.push('占比为按总量换算估算值。');
            }
            return joinMineralImportNotes(notes);
        };

        const buildMineralImportCommodityChartMeta = (commodityIds) => {
            const maxVolumeMap = new Map();
            const unitMap = new Map();
            let overallMaxVolume = 0;

            commodityIds.forEach((commodityId) => {
                const commodityData = getMineralImportById(commodityId);
                if (!commodityData?.sources?.length) return;

                let maxVolume = 0;
                let primaryUnit = '';
                commodityData.sources.forEach((source) => {
                    const volumeValue = parseMineralImportVolumeValue(source?.volume);
                    if (Number.isFinite(volumeValue)) {
                        maxVolume = Math.max(maxVolume, volumeValue);
                    }
                    if (!primaryUnit && source?.unit) {
                        primaryUnit = normalizeMineralImportUnit(source.unit);
                    }
                });

                if (maxVolume > 0) {
                    maxVolumeMap.set(commodityId, maxVolume);
                    overallMaxVolume = Math.max(overallMaxVolume, maxVolume);
                }

                unitMap.set(commodityId, primaryUnit || '万吨');
            });

            return {
                commodityMaxVolumeMap: maxVolumeMap,
                commodityUnitMap: unitMap,
                selectedCommodityCount: commodityIds.length,
                overallMaxVolume
            };
        };

        const buildMineralImportLabelChartBars = (aggregate, chartMeta = {}) => {
            const commodities = Array.isArray(aggregate?.commodities) ? aggregate.commodities : [];
            if (commodities.length === 0) {
                return {
                    bars: [],
                    axisTitle: '万吨',
                    tickValues: ['0', '0', '0']
                };
            }

            const commodityMaxVolumeMap = chartMeta?.commodityMaxVolumeMap || new Map();
            const isMultiSelection = Number(chartMeta?.selectedCommodityCount) > 1;
            const limitedCommodities = commodities
                .slice(0, 4)
                .map((item) => ({
                    ...item,
                    normalizedUnit: normalizeMineralImportUnit(item?.unit || chartMeta?.commodityUnitMap?.get(item?.commodityId))
                }))
                .filter((item) => Number.isFinite(item?.volumeValue) && item.volumeValue > 0);

            if (limitedCommodities.length === 0) {
                return {
                    bars: [],
                    axisTitle: '万吨',
                    tickValues: ['0', '0', '0']
                };
            }

            const localMaxVolume = limitedCommodities.reduce((maxValue, item) => {
                return Math.max(maxValue, Number(item?.volumeValue) || 0);
            }, 0);
            const singleCommodityMax = commodityMaxVolumeMap.get(limitedCommodities[0]?.commodityId) || localMaxVolume;
            const overallMaxVolume = Number(chartMeta?.overallMaxVolume) || 0;
            const chartMaxValue = Math.max(
                isMultiSelection ? overallMaxVolume : singleCommodityMax,
                localMaxVolume,
                1
            );
            const axisTitle = buildMineralImportAxisUnitLabel(
                limitedCommodities.map(item => item.normalizedUnit)
            );

            return {
                axisTitle,
                tickValues: [
                    formatMineralImportAxisTickValue(chartMaxValue),
                    formatMineralImportAxisTickValue(chartMaxValue / 2),
                    '0'
                ],
                bars: limitedCommodities
                .map((item, index) => {
                    const volumeRatio = Number.isFinite(item?.volumeValue) && chartMaxValue > 0
                        ? item.volumeValue / chartMaxValue
                        : 0;

                    return {
                        ratio: Math.max(0.04, Math.min(1, volumeRatio)),
                        color: item?.themeColor || '#0EA5E9',
                        isFocus: limitedCommodities.length === 1 && index === 0,
                        shortLabel: getMineralImportCommodityShortLabel(item?.commodityName),
                        valueLabel: formatMineralImportAxisTickValue(item?.volumeValue ?? 0)
                    };
                })
            };
        };

        const buildMineralImportCountryAggregateMap = (commodityIds) => {
            mineralImportCountryAggregateMap = new Map();
            const noDataCommodities = [];

            commodityIds.forEach((commodityId) => {
                const commodityData = getMineralImportById(commodityId);
                if (!commodityData) return;
                const category = getMineralImportCategoryById(commodityData.categoryId);
                const themeColor = getCommodityThemeColor(commodityId, category);

                if (!commodityData.sources || commodityData.sources.length === 0) {
                    noDataCommodities.push({
                        commodityId,
                        commodityName: commodityData.label,
                        categoryName: category?.label || '矿产品进口',
                        totalImport: commodityData.totalImport || '',
                        yoy: commodityData.yoy || '',
                        summary: commodityData.summary || '',
                        note: '当前资料未提供可上图的来源国明细。',
                        themeColor
                    });
                    return;
                }

                commodityData.sources.forEach((source) => {
                    const countryName = resolveCountryName(source.country);
                    if (!countryName) return;

                    if (!mineralImportCountryAggregateMap.has(countryName)) {
                        mineralImportCountryAggregateMap.set(countryName, {
                            country: countryName,
                            commodities: []
                        });
                    }

                    const volumeDisplay = source.unit
                        ? `${source.volume}${source.unit}`
                        : source.volume || '未披露';
                    const volumeValue = parseMineralImportVolumeValue(source.volume);
                    const dataQualityNote = buildMineralImportDataQualityNote(source);

                    mineralImportCountryAggregateMap.get(countryName).commodities.push({
                        commodityId,
                        commodityName: commodityData.label,
                        categoryId: commodityData.categoryId,
                        categoryName: category?.label || '矿产品进口',
                        unit: normalizeMineralImportUnit(source.unit),
                        volumeDisplay,
                        volumeValue,
                        share: source.share || '',
                        yoy: source.yoy || '',
                        note: source.note || '',
                        dataQualityNote,
                        totalImport: commodityData.totalImport || '',
                        summary: commodityData.summary || '',
                        themeColor
                    });
                });
            });

            return noDataCommodities;
        };

        const buildMineralImportPopupData = (countryName) => {
            const aggregate = mineralImportCountryAggregateMap.get(countryName);
            if (!aggregate || !Array.isArray(aggregate.commodities) || aggregate.commodities.length === 0) {
                return null;
            }

            const sortedItems = [...aggregate.commodities].sort((a, b) => {
                const shareA = parseShareValue(a.share) ?? -1;
                const shareB = parseShareValue(b.share) ?? -1;
                return shareB - shareA;
            });

            if (sortedItems.length === 1) {
                const item = sortedItems[0];
                return {
                    commodityId: item.commodityId,
                    commodityName: item.commodityName,
                    categoryId: item.categoryId,
                    categoryName: item.categoryName,
                    country: countryName,
                    volumeDisplay: item.volumeDisplay,
                    share: item.share,
                    yoy: item.yoy,
                    totalImport: item.totalImport,
                    summary: item.summary,
                    note: item.note,
                    dataQualityNote: item.dataQualityNote,
                    themeColor: item.themeColor,
                    isMulti: false
                };
            }

            return {
                commodityId: '',
                commodityName: `矿产品进口（${sortedItems.length}类）`,
                categoryId: 'multi',
                categoryName: '多矿种叠加',
                country: countryName,
                volumeDisplay: '',
                share: '',
                yoy: '',
                totalImport: '',
                summary: '该国家同时属于多个已选矿种来源国。',
                note: '',
                themeColor: MINERAL_IMPORT_OVERLAP_COLOR,
                isMulti: true,
                commodityCount: sortedItems.length,
                items: sortedItems
            };
        };

        const cloneMineralImportSphere = (sphere) => {
            if (!sphere?.center || !Number.isFinite(sphere.radius)) return null;
            return new Cesium.BoundingSphere(Cesium.Cartesian3.clone(sphere.center), sphere.radius);
        };

        const collectMineralImportCountryPositions = (countryName) => {
            const boundaryRecord = mineralImportCountryBoundaryMap.get(countryName);
            if (boundaryRecord?.cartesianPositions?.length) {
                return [...boundaryRecord.cartesianPositions];
            }

            const fallbackPositions = [];
            const targetEntities = getMineralImportCountryEntities(countryName);
            targetEntities.forEach((entity) => {
                const hierarchy = entity.polygon?.hierarchy?.getValue(Cesium.JulianDate.now());
                if (hierarchy?.positions?.length) {
                    fallbackPositions.push(...hierarchy.positions);
                }
            });
            return fallbackPositions;
        };

        const buildMineralImportCountrySphere = (countryName) => {
            const positions = collectMineralImportCountryPositions(countryName);
            if (positions.length === 0) return null;
            return Cesium.BoundingSphere.fromPoints(positions);
        };

        const buildMineralImportCommoditySphere = (commodityId) => {
            if (!commodityId) return null;

            const positions = [];
            mineralImportCountryAggregateMap.forEach((aggregate, countryName) => {
                if (!aggregate?.commodities?.some(item => item.commodityId === commodityId)) return;
                positions.push(...collectMineralImportCountryPositions(countryName));
            });

            if (positions.length === 0) return null;
            return Cesium.BoundingSphere.fromPoints(positions);
        };

        const rememberMineralImportFocusSphere = (sphere) => {
            lastMineralImportFocusSphere = cloneMineralImportSphere(sphere);
        };

        const focusMineralImportSphere = (sphere, options = {}) => {
            if (!viewer || !sphere) return;

            const pitch = options.pitch ?? Cesium.Math.toRadians(-50);
            const rangeMultiplier = options.rangeMultiplier ?? 2.5;
            const minRange = options.minRange ?? 900000;
            rememberMineralImportFocusSphere(sphere);
            viewer.camera.flyToBoundingSphere(sphere, {
                duration: options.duration ?? 1.35,
                offset: new Cesium.HeadingPitchRange(
                    options.heading ?? 0,
                    pitch,
                    Math.max(sphere.radius * rangeMultiplier, minRange)
                )
            });
        };

        const getMineralImportPopupData = (countryName) => {
            return buildMineralImportPopupData(countryName);
        };

        const getMineralImportCountryEntities = (country) => {
            if (!country || !mineralImportDataSource) return [];
            return mineralImportDataSource.entities.values.filter((entity) => {
                const type = entity.properties?.type?.getValue?.();
                if (type !== 'mineral_import_country') return false;
                const entityCountry = entity.properties.importCountry?.getValue?.();
                return entityCountry === country;
            });
        };

        const highlightMineralImportCountry = (country) => {
            if (!viewer) return;
            const targetEntities = getMineralImportCountryEntities(country);
            if (targetEntities.length === 0) return;

            resetMineralImportHighlight();

            const accent = Cesium.Color.fromCssColorString('#0ea5ff');
            targetEntities.forEach((entity) => {
                if (!entity?.polygon) return;
                if (!entity._mineralImportBaseMaterial) {
                    entity._mineralImportBaseMaterial = entity.polygon.material;
                }
                if (!entity._mineralImportBaseOutlineColor) {
                    entity._mineralImportBaseOutlineColor = entity.polygon.outlineColor;
                }
                if (typeof entity._mineralImportBaseOutlineWidth !== 'number') {
                    entity._mineralImportBaseOutlineWidth = entity.polygon.outlineWidth || 2;
                }

                entity.polygon.outline = true;
                entity.polygon.outlineColor = accent.withAlpha(1.0);
                entity.polygon.outlineWidth = 10;
                mineralImportHighlightedEntities.push(entity);
            });

            const boundaryRecord = mineralImportCountryBoundaryMap.get(country);
            if (boundaryRecord?.rings?.length) {
                boundaryRecord.rings.forEach((ring) => addGlowPolylineForRing(ring));
            }

            viewer.scene.requestRender();
        };

        const focusMineralImportCountry = (country) => {
            if (!viewer) return;
            const targetEntities = getMineralImportCountryEntities(country);
            if (targetEntities.length === 0) return;

            try {
                const sphere = buildMineralImportCountrySphere(country);
                if (sphere) {
                    focusMineralImportSphere(sphere);
                }
            } catch (error) {
                console.warn('⚠️ 聚焦矿产品国家失败:', error);
            }
        };

        const focusMineralImportCommodity = (commodityId) => {
            if (!viewer || !commodityId) return;

            try {
                const sphere = buildMineralImportCommoditySphere(commodityId);
                if (sphere) {
                    focusMineralImportSphere(sphere, {
                        duration: 1.4,
                        rangeMultiplier: 2.9,
                        minRange: 1400000
                    });
                }
            } catch (error) {
                console.warn('⚠️ 聚焦矿产品类别失败:', error);
            }
        };

        const relaxMineralImportView = () => {
            if (!viewer) return;

            try {
                if (lastMineralImportFocusSphere?.center) {
                    const currentDistance = Cesium.Cartesian3.distance(
                        viewer.camera.positionWC,
                        lastMineralImportFocusSphere.center
                    );
                    const expandedRange = Math.max(
                        currentDistance * 1.65,
                        lastMineralImportFocusSphere.radius * 3.6,
                        1800000
                    );

                    viewer.camera.flyToBoundingSphere(lastMineralImportFocusSphere, {
                        duration: 0.95,
                        offset: new Cesium.HeadingPitchRange(
                            viewer.camera.heading,
                            viewer.camera.pitch,
                            expandedRange
                        )
                    });
                } else {
                    viewer.camera.zoomOut(Math.max(viewer.camera.positionCartographic.height * 0.65, 800000));
                }
            } catch (error) {
                console.warn('⚠️ 缩小矿产品视角失败:', error);
            }

            resetMineralImportHighlight();
            viewer.scene.requestRender();
        };

        const restoreMineralImportView = () => {
            if (!viewer) return;
            resetView();
            lastMineralImportFocusSphere = null;
            resetMineralImportHighlight();
            viewer.scene.requestRender();
        };

        const styleUsaMarineLayerEntities = (dataSource, config) => {
            if (!dataSource?.entities?.values?.length) return;

            dataSource.entities.values.forEach((entity) => {
                if (entity.polyline) {
                    const isShelfBoundary = config.name === '大陆架边界';
                    entity.polyline.width = config.strokeWidth;
                    entity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
                        glowPower: isShelfBoundary ? 0.34 : 0.28,
                        taperPower: 0.78,
                        color: config.stroke.withAlpha(isShelfBoundary ? 1.0 : 0.98)
                    });
                    entity.polyline.clampToGround = true;
                    entity.polyline.disableDepthTestDistance = Number.POSITIVE_INFINITY;
                }

                if (entity.polygon) {
                    if (config.name === '区界') {
                        const districtCode = Number(
                            entity.properties?.DISTRICT_C?.getValue?.() ??
                            entity.properties?.DISTRICT_I?.getValue?.() ??
                            0
                        );
                        const districtColorHex = USA_DISTRICT_COLOR_MAP[districtCode] || '#f6b35f';
                        const districtColor = Cesium.Color.fromCssColorString(districtColorHex);
                        entity.polygon.material = districtColor.withAlpha(0.72);
                        entity.polygon.outline = true;
                        entity.polygon.outlineColor = districtColor.withAlpha(0.98);
                        entity.polygon.outlineWidth = 2.4;
                        entity.polygon.zIndex = config.zIndex ?? 8;
                    } else {
                        entity.polygon.material = config.fill;
                        entity.polygon.outline = true;
                        entity.polygon.outlineColor = config.stroke.withAlpha(0.95);
                        entity.polygon.outlineWidth = config.name === '主要航道' ? 3.2 : config.strokeWidth;
                        entity.polygon.zIndex = config.zIndex ?? (config.name === '主要航道' ? 18 : 12);
                    }
                    entity.polygon.classificationType = Cesium.ClassificationType.TERRAIN;
                }
            });
        };

        const toggleUsaMarineLayer = async (layerId, show) => {
            if (!viewer || !USA_MARINE_LAYER_CONFIG[layerId]) return;

            const config = USA_MARINE_LAYER_CONFIG[layerId];

            if (!show) {
                const existingDataSource = usaMarineLayerDataSources.get(layerId);
                if (existingDataSource) {
                    viewer.dataSources.remove(existingDataSource, true);
                    usaMarineLayerDataSources.delete(layerId);
                    viewer.scene.requestRender();
                }
                return;
            }

            if (usaMarineLayerDataSources.has(layerId)) {
                const existingDataSource = usaMarineLayerDataSources.get(layerId);
                existingDataSource.show = true;
                viewer.scene.requestRender();
                return;
            }

            try {
                const dataSource = await Cesium.GeoJsonDataSource.load(config.url, {
                    stroke: config.stroke,
                    fill: config.fill,
                    strokeWidth: config.strokeWidth,
                    clampToGround: true
                });

                styleUsaMarineLayerEntities(dataSource, config);
                await viewer.dataSources.add(dataSource);
                usaMarineLayerDataSources.set(layerId, dataSource);
                viewer.scene.requestRender();
                console.log(`✅ 已加载美国海洋空间图层: ${config.name}`);
            } catch (error) {
                console.error(`❌ 加载美国海洋空间图层失败: ${config.name}`, error);
            }
        };

        const styleJapanMarineGeologyEntities = (dataSource, sourceConfig) => {
            if (!dataSource?.entities?.values?.length) return;

            dataSource.entities.values.forEach((entity) => {
                entity.name = sourceConfig.name;

                if (entity.polyline) {
                    entity.polyline.width = sourceConfig.strokeWidth;
                    entity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
                        glowPower: 0.24,
                        taperPower: 0.75,
                        color: sourceConfig.stroke.withAlpha(0.98)
                    });
                    entity.polyline.clampToGround = true;
                    entity.polyline.disableDepthTestDistance = Number.POSITIVE_INFINITY;
                }

                if (entity.polygon) {
                    entity.polygon.material = sourceConfig.fill;
                    entity.polygon.outline = true;
                    entity.polygon.outlineColor = sourceConfig.stroke.withAlpha(0.92);
                    entity.polygon.outlineWidth = sourceConfig.strokeWidth;
                    entity.polygon.zIndex = sourceConfig.zIndex;
                    entity.polygon.classificationType = Cesium.ClassificationType.TERRAIN;

                    if (sourceConfig.id === 'japan_200000') {
                        entity.polygon.fill = false;
                        entity.polygon.outlineColor = sourceConfig.stroke.withAlpha(1);
                    }
                }
            });
        };

        const getPolylineCenterPosition = (entity) => {
            const positions = entity.polyline?.positions?.getValue?.(viewer.clock.currentTime);
            if (!positions?.length) return null;

            let totalLng = 0;
            let totalLat = 0;
            positions.forEach((position) => {
                const cartographic = Cesium.Cartographic.fromCartesian(position);
                totalLng += Cesium.Math.toDegrees(cartographic.longitude);
                totalLat += Cesium.Math.toDegrees(cartographic.latitude);
            });

            return Cesium.Cartesian3.fromDegrees(
                totalLng / positions.length,
                totalLat / positions.length,
                1200
            );
        };

        const addJapanAreaLabels = (dataSource) => {
            if (!dataSource?.entities?.values?.length) return;

            const areaEntities = [...dataSource.entities.values];
            areaEntities.forEach((entity) => {
                const areaName = entity.properties?.Name?.getValue?.() || entity.properties?.name?.getValue?.();
                const position = getPolylineCenterPosition(entity);

                if (!areaName || !position) return;

                dataSource.entities.add({
                    name: `${areaName} 标注`,
                    position,
                    label: {
                        text: areaName,
                        font: '700 24px "Noto Sans SC", sans-serif',
                        fillColor: Cesium.Color.fromCssColorString('#fff7ad'),
                        outlineColor: Cesium.Color.fromCssColorString('#111827'),
                        outlineWidth: 4,
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                        verticalOrigin: Cesium.VerticalOrigin.CENTER,
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                        disableDepthTestDistance: Number.POSITIVE_INFINITY,
                        pixelOffset: new Cesium.Cartesian2(0, -10),
                        scaleByDistance: new Cesium.NearFarScalar(800000, 1.15, 5000000, 0.72),
                        translucencyByDistance: new Cesium.NearFarScalar(800000, 1.0, 6500000, 0.45)
                    }
                });
            });
        };

        const toggleJapanMarineGeologyLayer = async (show) => {
            if (!viewer) return;

            const layerId = 'geo_japan_marine_20w';
            const config = JAPAN_MARINE_GEOLOGY_LAYER_CONFIG[layerId];

            if (!show) {
                const existingDataSources = japanMarineGeologyDataSources.get(layerId) || [];
                existingDataSources.forEach((dataSource) => {
                    viewer.dataSources.remove(dataSource, true);
                });
                japanMarineGeologyDataSources.delete(layerId);
                viewer.scene.requestRender();
                return;
            }

            if (japanMarineGeologyDataSources.has(layerId)) {
                japanMarineGeologyDataSources.get(layerId).forEach((dataSource) => {
                    dataSource.show = true;
                });
                viewer.scene.requestRender();
                return;
            }

            let loadedDataSources = [];
            try {
                for (const sourceConfig of config.sources) {
                    const dataSource = await Cesium.GeoJsonDataSource.load(sourceConfig.url, {
                        stroke: sourceConfig.stroke,
                        fill: sourceConfig.fill,
                        strokeWidth: sourceConfig.strokeWidth,
                        clampToGround: true
                    });

                    dataSource.name = sourceConfig.name;
                    styleJapanMarineGeologyEntities(dataSource, sourceConfig);
                    if (sourceConfig.id === 'japan_area') {
                        addJapanAreaLabels(dataSource);
                    }
                    await viewer.dataSources.add(dataSource);
                    loadedDataSources.push(dataSource);
                }

                japanMarineGeologyDataSources.set(layerId, loadedDataSources);
                viewer.scene.requestRender();
                console.log(`✅ 已加载地质调查图层: ${config.name}`);
            } catch (error) {
                loadedDataSources.forEach((dataSource) => viewer.dataSources.remove(dataSource, true));
                japanMarineGeologyDataSources.delete(layerId);
                console.error(`❌ 加载地质调查图层失败: ${config.name}`, error);
            }
        };

        const toggleJapanGeologyTileLayer = (layerId, show) => {
            if (!viewer) return;

            const config = JAPAN_GEOLOGY_TILE_LAYER_CONFIG[layerId];
            if (!config) {
                console.warn(`⚠️ 未找到日本地质瓦片图层配置: ${layerId}`);
                return;
            }

            if (!show) {
                const existingLayer = japanGeologyTileLayers.get(layerId);
                if (existingLayer) {
                    viewer.imageryLayers.remove(existingLayer, true);
                    japanGeologyTileLayers.delete(layerId);
                    viewer.scene.requestRender();
                }
                return;
            }

            if (japanGeologyTileLayers.has(layerId)) {
                const existingLayer = japanGeologyTileLayers.get(layerId);
                existingLayer.show = true;
                viewer.scene.requestRender();
                return;
            }

            try {
                const provider = new Cesium.UrlTemplateImageryProvider({
                    url: config.url,
                    minimumLevel: config.minimumLevel,
                    maximumLevel: config.maximumLevel,
                    credit: new Cesium.Credit(config.name)
                });
                const imageryLayer = viewer.imageryLayers.addImageryProvider(provider);
                imageryLayer.name = config.name;
                imageryLayer.alpha = config.alpha ?? 1;
                imageryLayer.brightness = config.brightness ?? 1;
                imageryLayer.contrast = config.contrast ?? 1;
                japanGeologyTileLayers.set(layerId, imageryLayer);
                viewer.scene.requestRender();
                console.log(`✅ 已加载地质调查瓦片图层: ${config.name}`);
            } catch (error) {
                japanGeologyTileLayers.delete(layerId);
                console.error(`❌ 加载地质调查瓦片图层失败: ${config.name}`, error);
            }
        };
        
        const clearMineralImportCommodity = (options = {}) => {
            const preserveSelection = options.preserveSelection === true;
            const preserveRenderToken = options.preserveRenderToken === true;
            if (!viewer) return;

            if (!preserveRenderToken) {
                mineralImportRenderToken += 1;
            }

            resetMineralImportHighlight();
            mineralImportCountryBoundaryMap = new Map();
            mineralImportCountryAggregateMap = new Map();
            
            if (mineralImportDataSource) {
                viewer.dataSources.remove(mineralImportDataSource);
                mineralImportDataSource = null;
            }
            
            if (mineralImportLabelEntities.length > 0) {
                mineralImportLabelEntities.forEach(entity => viewer.entities.remove(entity));
                mineralImportLabelEntities = [];
            }

            if (!preserveSelection) {
                activeMineralImportCommodities.clear();
                window.dispatchEvent(new CustomEvent('hideMineralImportPopup', {
                    detail: { mode: 'all' }
                }));
            }
            viewer.scene.requestRender();
        };

        const showMineralImportNoDataPopup = (noDataCommodities) => {
            if (!Array.isArray(noDataCommodities) || noDataCommodities.length === 0) return;
            if (noDataCommodities.length === 1) {
                const item = noDataCommodities[0];
                window.dispatchEvent(new CustomEvent('showMineralImportPopup', {
                    detail: {
                        data: {
                            commodityId: item.commodityId,
                            commodityName: item.commodityName,
                            categoryId: '',
                            categoryName: item.categoryName,
                            country: '暂无国家明细',
                            volumeDisplay: '暂无统计',
                            share: '',
                            yoy: item.yoy,
                            totalImport: item.totalImport,
                            summary: item.summary,
                            note: item.note,
                            themeColor: item.themeColor,
                            isMulti: false
                        },
                        x: Math.round(window.innerWidth * 0.45),
                        y: 220
                    }
                }));
                return;
            }

            window.dispatchEvent(new CustomEvent('showMineralImportPopup', {
                detail: {
                    data: {
                        commodityId: '',
                        commodityName: `矿产品进口（${noDataCommodities.length}类）`,
                        categoryId: 'multi',
                        categoryName: '多矿种叠加',
                        country: '暂无国家明细',
                        volumeDisplay: '',
                        share: '',
                        yoy: '',
                        totalImport: '',
                        summary: '所选矿种暂无可上图来源国明细。',
                        note: '',
                        themeColor: MINERAL_IMPORT_OVERLAP_COLOR,
                        isMulti: true,
                        commodityCount: noDataCommodities.length,
                        items: noDataCommodities.map((item) => ({
                            commodityId: item.commodityId,
                            commodityName: item.commodityName,
                            categoryId: '',
                            categoryName: item.categoryName,
                            volumeDisplay: '暂无统计',
                            share: '',
                            yoy: item.yoy,
                            totalImport: item.totalImport,
                            summary: item.summary,
                            note: item.note,
                            themeColor: item.themeColor
                        }))
                    },
                    x: Math.round(window.innerWidth * 0.45),
                    y: 220
                }
            }));
        };

        const renderActiveMineralImportCommodities = async (options = {}) => {
            if (!viewer) return;
            const focusCommodityId = options.focusCommodityId || '';

            const selectedCommodityIds = Array.from(activeMineralImportCommodities);
            clearMineralImportCommodity({ preserveSelection: true, preserveRenderToken: true });
            const renderToken = ++mineralImportRenderToken;

            if (selectedCommodityIds.length === 0) return;

            const noDataCommodities = buildMineralImportCountryAggregateMap(selectedCommodityIds);
            if (mineralImportCountryAggregateMap.size === 0) {
                showMineralImportNoDataPopup(noDataCommodities);
                return;
            }

            try {
                if (!mineralImportGeojsonCache) {
                    const response = await fetch('/data/World_countries_simply.geojson');
                    mineralImportGeojsonCache = await response.json();
                }
                if (renderToken !== mineralImportRenderToken) return;

                const visibleCountries = new Set(mineralImportCountryAggregateMap.keys());
                const matchedFeatures = mineralImportGeojsonCache.features.filter((feature) => {
                    const featureCountry = feature.properties.FCNAME || feature.properties.NAME;
                    return visibleCountries.has(featureCountry);
                });
                
                if (matchedFeatures.length === 0) {
                    console.warn('⚠️ 未匹配到矿产品进口国家边界:', selectedCommodityIds);
                    showMineralImportNoDataPopup(noDataCommodities);
                    return;
                }

                rebuildMineralImportCountryBoundaryMap(matchedFeatures);
                
                mineralImportDataSource = new Cesium.GeoJsonDataSource('mineral-import');
                await mineralImportDataSource.load({
                    type: 'FeatureCollection',
                    features: matchedFeatures
                });
                if (renderToken !== mineralImportRenderToken) return;
                
                const entities = mineralImportDataSource.entities.values;
                const labelCountrySet = new Set();
                const mineralImportChartMeta = buildMineralImportCommodityChartMeta(selectedCommodityIds);
                const occupiedLabelRects = [];
                
                entities.forEach(entity => {
                    if (!entity.polygon || !entity.properties) return;
                    
                    const countryName = entity.properties.FCNAME?.getValue() || entity.properties.NAME?.getValue();
                    const aggregate = mineralImportCountryAggregateMap.get(countryName);
                    if (!aggregate || !aggregate.commodities || aggregate.commodities.length === 0) return;

                    const commodityCount = aggregate.commodities.length;
                    const primary = aggregate.commodities[0];
                    const isOverlap = commodityCount > 1;
                    const baseColorCss = isOverlap ? MINERAL_IMPORT_OVERLAP_COLOR : (primary.themeColor || '#0EA5E9');
                    const baseColor = Cesium.Color.fromCssColorString(baseColorCss);
                    const shareValue = parseShareValue(primary.share);
                    const alpha = isOverlap
                        ? 0.65
                        : (shareValue !== null
                            ? Math.min(0.85, Math.max(0.35, 0.28 + shareValue / 120))
                            : 0.45);
                    
                    entity.polygon.material = baseColor.withAlpha(alpha);
                    entity.polygon.outline = true;
                    entity.polygon.outlineColor = isOverlap
                        ? Cesium.Color.fromCssColorString(MINERAL_IMPORT_OVERLAP_OUTLINE_COLOR).withAlpha(0.95)
                        : Cesium.Color.WHITE.withAlpha(0.95);
                    entity.polygon.outlineWidth = isOverlap ? 3 : 2;
                    entity.polygon.classificationType = Cesium.ClassificationType.TERRAIN;
                    entity._mineralImportBaseMaterial = baseColor.withAlpha(alpha);
                    entity._mineralImportBaseOutlineColor = entity.polygon.outlineColor;
                    entity._mineralImportBaseOutlineWidth = entity.polygon.outlineWidth;
                    
                    setEntityProperty(entity, 'type', 'mineral_import_country');
                    setEntityProperty(entity, 'importCountry', countryName);
                    setEntityProperty(entity, 'commodityCount', commodityCount);
                    setEntityProperty(entity, 'isOverlap', isOverlap);
                    setEntityProperty(entity, 'commodityIds', aggregate.commodities.map(item => item.commodityId).join('|'));
                    setEntityProperty(entity, 'commodityNames', aggregate.commodities.map(item => item.commodityName).join('|'));
                    setEntityProperty(entity, 'commodityId', primary.commodityId);
                    setEntityProperty(entity, 'commodityName', primary.commodityName);
                    setEntityProperty(entity, 'categoryId', primary.categoryId);
                    setEntityProperty(entity, 'categoryName', primary.categoryName);
                    setEntityProperty(entity, 'volumeDisplay', primary.volumeDisplay || '');
                    setEntityProperty(entity, 'importShare', primary.share || '');
                    setEntityProperty(entity, 'importYoy', primary.yoy || '');
                    setEntityProperty(entity, 'importNote', primary.note || '');
                    setEntityProperty(entity, 'importDataQualityNote', primary.dataQualityNote || '');
                    setEntityProperty(entity, 'totalImport', primary.totalImport || '');
                    setEntityProperty(entity, 'summary', primary.summary || '');
                    setEntityProperty(entity, 'themeColor', baseColorCss);
                    labelCountrySet.add(countryName);
                });

                labelCountrySet.forEach((countryName) => {
                    const aggregate = mineralImportCountryAggregateMap.get(countryName);
                    if (!aggregate?.commodities?.length) return;

                    const commodityCount = aggregate.commodities.length;
                    const primary = aggregate.commodities[0];
                    const isOverlap = commodityCount > 1;
                    const baseColorCss = isOverlap ? MINERAL_IMPORT_OVERLAP_COLOR : (primary.themeColor || '#0EA5E9');
                    const sphere = buildMineralImportCountrySphere(countryName);
                    if (!sphere) return;

                    const cartographic = Cesium.Cartographic.fromCartesian(sphere.center);
                    const lon = Cesium.Math.toDegrees(cartographic.longitude);
                    const lat = Cesium.Math.toDegrees(cartographic.latitude);
                    const labelText = isOverlap
                        ? `${countryName}\n${commodityCount}类矿产`
                        : (primary.share
                            ? `${countryName}\n${primary.volumeDisplay} (${primary.share})`
                            : `${countryName}\n${primary.volumeDisplay}`);
                    const labelTexture = createMineralImportLabelTexture(labelText, {
                        themeColor: baseColorCss,
                        overlap: isOverlap
                    });
                    const labelChartBars = buildMineralImportLabelChartBars(aggregate, mineralImportChartMeta);
                    const labelBarTexture = createMineralImportLabelBarTexture(labelChartBars, {
                        themeColor: baseColorCss,
                        height: Math.max(80, (labelTexture.height + 8) * 2)
                    });
                    const labelPlacement = chooseMineralImportLabelPlacement(
                        countryName,
                        lon,
                        lat,
                        sphere.radius,
                        {
                            labelWidth: labelTexture.width,
                            labelHeight: labelTexture.height,
                            barWidth: labelBarTexture?.width || 0,
                            barHeight: labelBarTexture?.height || 0
                        },
                        occupiedLabelRects
                    );
                    const flagImageUrl = getMineralImportCountryFlagUrl(countryName, 40);
                    const flagFrameTexture = createMineralImportFlagFrameTexture(baseColorCss);
                    const labelOffsetY = labelPlacement.isCallout ? -8 : -14;
                    const scaledLabelWidth = labelTexture.width * (labelPlacement.scale || 1);
                    const scaledLabelHeight = labelTexture.height * (labelPlacement.scale || 1);
                    const flagAnchorOffset = new Cesium.Cartesian2(
                        -scaledLabelWidth / 2 + 18,
                        labelOffsetY - scaledLabelHeight + 18
                    );

                    addMineralImportLabelConnector(labelPlacement, baseColorCss);

                    const labelEntity = viewer.entities.add({
                        id: `import_label_${countryName}`,
                        position: Cesium.Cartesian3.fromDegrees(
                            labelPlacement.labelLon,
                            labelPlacement.labelLat,
                            labelPlacement.labelHeight
                        ),
                        billboard: {
                            image: labelTexture.image,
                            width: labelTexture.width,
                            height: labelTexture.height,
                            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                            pixelOffset: new Cesium.Cartesian2(0, labelOffsetY),
                            disableDepthTestDistance: Number.POSITIVE_INFINITY,
                            scale: labelPlacement.scale
                        },
                        properties: new Cesium.PropertyBag({
                            type: 'mineral_import_label',
                            importCountry: countryName,
                            commodityCount
                        })
                    });
                    mineralImportLabelEntities.push(labelEntity);

                    if (labelBarTexture) {
                        const scaledBarWidth = labelBarTexture.width * (labelPlacement.scale || 1);
                        const barOffset = new Cesium.Cartesian2(
                            scaledLabelWidth / 2 + scaledBarWidth / 2 + 12,
                            labelOffsetY
                        );

                        const labelBarEntity = viewer.entities.add({
                            id: `import_label_bar_${countryName}`,
                            position: Cesium.Cartesian3.fromDegrees(
                                labelPlacement.labelLon,
                                labelPlacement.labelLat,
                                labelPlacement.labelHeight
                            ),
                            billboard: {
                                image: labelBarTexture.image,
                                width: labelBarTexture.width,
                                height: labelBarTexture.height,
                                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                                pixelOffset: barOffset,
                                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                                scale: Math.max(1.08, (labelPlacement.scale || 0.92) * 1.15)
                            },
                            properties: new Cesium.PropertyBag({
                                type: 'mineral_import_label_bar',
                                importCountry: countryName,
                                commodityCount
                            })
                        });
                        mineralImportLabelEntities.push(labelBarEntity);
                    }

                    const flagFrameEntity = viewer.entities.add({
                        id: `import_label_flag_frame_${countryName}`,
                        position: Cesium.Cartesian3.fromDegrees(
                            labelPlacement.labelLon,
                            labelPlacement.labelLat,
                            labelPlacement.labelHeight
                        ),
                        billboard: {
                            image: flagFrameTexture.image,
                            width: flagFrameTexture.width,
                            height: flagFrameTexture.height,
                            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                            verticalOrigin: Cesium.VerticalOrigin.CENTER,
                            pixelOffset: flagAnchorOffset,
                            disableDepthTestDistance: Number.POSITIVE_INFINITY,
                            scale: Math.max(0.84, labelPlacement.scale || 0.92)
                        },
                        properties: new Cesium.PropertyBag({
                            type: 'mineral_import_label_flag_frame',
                            importCountry: countryName,
                            commodityCount
                        })
                    });
                    mineralImportLabelEntities.push(flagFrameEntity);

                    if (flagImageUrl) {
                        const flagEntity = viewer.entities.add({
                            id: `import_label_flag_${countryName}`,
                            position: Cesium.Cartesian3.fromDegrees(
                                labelPlacement.labelLon,
                                labelPlacement.labelLat,
                                labelPlacement.labelHeight
                            ),
                            billboard: {
                                image: flagImageUrl,
                                width: 18,
                                height: 12,
                                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                                verticalOrigin: Cesium.VerticalOrigin.CENTER,
                                pixelOffset: flagAnchorOffset,
                                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                                scale: Math.max(0.82, labelPlacement.scale || 0.92)
                            },
                            properties: new Cesium.PropertyBag({
                                type: 'mineral_import_label_flag',
                                importCountry: countryName,
                                commodityCount
                            })
                        });
                        mineralImportLabelEntities.push(flagEntity);
                    }
                });
                
                await viewer.dataSources.add(mineralImportDataSource);
                if (renderToken !== mineralImportRenderToken) return;
                viewer.scene.requestRender();

                if (focusCommodityId && activeMineralImportCommodities.has(focusCommodityId)) {
                    focusMineralImportCommodity(focusCommodityId);
                }
            } catch (error) {
                console.error('❌ 加载矿产品进口国家图层失败:', error);
            }
        };

        const toggleMineralImportCommodity = async (commodityId, active = true) => {
            if (!viewer) return;

            if (!commodityId) {
                clearMineralImportCommodity();
                return;
            }

            if (active) {
                activeMineralImportCommodities.add(commodityId);
            } else {
                activeMineralImportCommodities.delete(commodityId);
            }

            await renderActiveMineralImportCommodities({
                focusCommodityId: active ? commodityId : ''
            });
        };
        
        // 监听筛选条件变化
        watch(() => props.filters, () => {
            applyFilters();
        }, { deep: true });
        
        // 注释掉旧的资源分布监听器，现在使用 ResourceLayer 来处理
        // watch(() => props.resourceFilters, (newFilters) => {
        //     console.log('🔍 资源分布筛选变化:', newFilters);
        //     
        //     if (newFilters && newFilters.includes('深海稀土')) {
        //         showRareEarthZones();
        //     } else {
        //         hideRareEarthZones();
        //     }
        // }, { deep: true, immediate: true });

        // 监听图层控制变化（矿区地理分区控制）
        watch(() => props.layerState, (newRegions) => {
            applyRegionFilters(newRegions);
        }, { deep: true });
        
        // 监听气象图层控制变化
        watch(() => props.weatherLayerState, (newWeatherLayers) => {
            updateWeatherLayersVisibility(newWeatherLayers);
        }, { deep: true });
        
        // 监听船舶定位请求
        watch(() => props.shipToLocate, (ship) => {
            if (ship && shipLayer) {
                if (ship.action === 'remove') {
                    shipLayer.removeShip(ship.mmsi);
                    return;
                }
                const numericMmsi = Number(ship.mmsi);
                let trackColor = shipTrackColors.get(numericMmsi);
                if (!trackColor) {
                    const hue = ((numericMmsi * 137.508) % 360) / 360;
                    trackColor = Cesium.Color.fromHsl(hue, 0.9, 0.5, 0.95);
                    shipTrackColors.set(numericMmsi, trackColor);
                }
                // 添加船舶到地图
                shipLayer.addShip({
                    ...ship,
                    displayColor: trackColor.toCssColorString()
                });
                // 飞到船舶位置
                shipLayer.flyToShip(ship.mmsi);
            }
        }, { deep: true });
        
        // 监听路径绘制请求
        watch(() => props.routeToDraw, (routeData) => {
            if (!routeData || !routeLayer) return;
            
            console.log('🗺️ 收到路径绘制请求:', routeData);
            
            if (routeData.action === 'draw' && routeData.route) {
                // 绘制路径
                routeLayer.drawRoute(routeData.route, {
                    startPort: routeData.startPort,
                    endPort: routeData.endPort,
                    lineColor: Cesium.Color.PURPLE.withAlpha(0.8),
                    lineWidth: 4,
                    showArrows: true
                });
                
                // 飞到航线视角
                setTimeout(() => {
                    routeLayer.flyToRoute();
                }, 500);
                
                console.log('✅ 航线已绘制到地图');
            } else if (routeData.action === 'clear') {
                // 清除路径
                routeLayer.clearRoute();
                
                // 清除选点标记
                if (pickPointMarkers.start) {
                    viewer.entities.remove(pickPointMarkers.start);
                    pickPointMarkers.start = null;
                }
                if (pickPointMarkers.end) {
                    viewer.entities.remove(pickPointMarkers.end);
                    pickPointMarkers.end = null;
                }
                // 清除避让点标记
                pickPointMarkers.avoid.forEach(marker => {
                    viewer.entities.remove(marker);
                });
                pickPointMarkers.avoid = [];
                // 清除途经点标记
                pickPointMarkers.through.forEach(marker => {
                    viewer.entities.remove(marker);
                });
                pickPointMarkers.through = [];
                
                console.log('🗑️ 航线和标记已清除');
            }
        }, { deep: true });
        
        // 监听历史轨迹绘制请求
        watch(() => props.trackToDraw, (trackData) => {
            if (!trackData || !viewer) return;
            
            console.log('📈 收到轨迹绘制请求:', trackData);

            const removeTrackByMmsi = (mmsi) => {
                const idPrefixList = [`ship-track-${mmsi}`, `track-start-${mmsi}`, `track-end-${mmsi}`];
                const idsToRemove = viewer.entities.values
                    .map(entity => entity.id)
                    .filter(id =>
                        typeof id === 'string'
                        && idPrefixList.some(prefix => id.startsWith(prefix))
                    );
                idsToRemove.forEach(id => {
                    const entity = viewer.entities.getById(id);
                    if (entity) viewer.entities.remove(entity);
                });
            };
            const clearAllTracks = () => {
                const idsToRemove = viewer.entities.values
                    .map(entity => entity.id)
                    .filter(id =>
                        typeof id === 'string'
                        && (id.startsWith('ship-track-') || id.startsWith('track-start-') || id.startsWith('track-end-'))
                    );
                idsToRemove.forEach(id => {
                    const entity = viewer.entities.getById(id);
                    if (entity) viewer.entities.remove(entity);
                });
                shipTrackColors.clear();
            };
            
            if (trackData.action === 'draw' && trackData.track) {
                const mmsi = Number(trackData.mmsi);
                if (!Number.isFinite(mmsi)) return;
                removeTrackByMmsi(mmsi);
                
                const toTimestamp = (point) => {
                    const value = point.utc ?? point.timestamp ?? point.time ?? point.loc_time ?? point.pos_time ?? point.last_time ?? null;
                    const num = Number(value);
                    if (Number.isFinite(num)) {
                        // 兼容毫秒时间戳
                        return num > 1e12 ? Math.floor(num / 1000) : num;
                    }
                    const parsed = Date.parse(String(value));
                    return Number.isFinite(parsed) ? Math.floor(parsed / 1000) : null;
                };
                const normalizeLongitude = (lng) => {
                    let normalized = lng;
                    while (normalized > 180) normalized -= 360;
                    while (normalized < -180) normalized += 360;
                    return normalized;
                };
                const haversineKm = (lat1, lng1, lat2, lng2) => {
                    const rad = Math.PI / 180;
                    const dLat = (lat2 - lat1) * rad;
                    const dLng = (lng2 - lng1) * rad;
                    const a = Math.sin(dLat / 2) ** 2
                        + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
                    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                };

                const normalizedTrack = trackData.track
                    .map((point, index) => {
                        const lng = normalizeLongitude(Number(point.lng));
                        const lat = Number(point.lat);
                        return {
                            ...point,
                            lng,
                            lat,
                            __index: index,
                            __ts: toTimestamp(point)
                        };
                    })
                    .filter(point =>
                        Number.isFinite(point.lng)
                        && Number.isFinite(point.lat)
                        && point.lng >= -180
                        && point.lng <= 180
                        && point.lat >= -90
                        && point.lat <= 90
                        && !(point.lng === 0 && point.lat === 0)
                    );

                const sortedTrack = [...normalizedTrack].sort((a, b) => {
                    if (a.__ts != null && b.__ts != null) return a.__ts - b.__ts;
                    if (a.__ts != null) return -1;
                    if (b.__ts != null) return 1;
                    return a.__index - b.__index;
                });

                const dedupedPoints = [];
                let lastPoint = null;
                sortedTrack.forEach(point => {
                    if (!lastPoint) {
                        dedupedPoints.push(point);
                        lastPoint = point;
                        return;
                    }
                    const distanceKm = haversineKm(lastPoint.lat, lastPoint.lng, point.lat, point.lng);
                    if (distanceKm < 0.015) return;
                    dedupedPoints.push(point);
                    lastPoint = point;
                });

                const splitToSegments = (points) => {
                    if (points.length < 2) return [];
                    const segments = [];
                    let current = [points[0]];

                    for (let i = 1; i < points.length; i += 1) {
                        const prev = current[current.length - 1];
                        const curr = points[i];
                        const distanceKm = haversineKm(prev.lat, prev.lng, curr.lat, curr.lng);
                        const deltaSeconds = (prev.__ts != null && curr.__ts != null) ? (curr.__ts - prev.__ts) : null;
                        const speedKnots = deltaSeconds && deltaSeconds > 0
                            ? (distanceKm / deltaSeconds) * 1943.8444924406
                            : null;

                        const hasReverseTime = deltaSeconds != null && deltaSeconds <= 0;
                        const hasLongGap = deltaSeconds != null && deltaSeconds > 6 * 3600;
                        const maxDistance = deltaSeconds != null
                            ? Math.max(25, (deltaSeconds / 3600) * 35 + 5)
                            : 20;
                        const isJumpPoint = distanceKm > maxDistance;
                        const isExtremeSpeed = speedKnots != null && speedKnots > 55;

                        if (hasReverseTime) {
                            continue;
                        }

                        if (hasLongGap || isJumpPoint || isExtremeSpeed) {
                            if (current.length >= 2) {
                                segments.push(current);
                            }
                            current = [curr];
                            continue;
                        }

                        current.push(curr);
                    }

                    if (current.length >= 2) {
                        segments.push(current);
                    }

                    return segments;
                };

                const removeSpikePoints = (points) => {
                    if (points.length < 3) return points;
                    const cleaned = [points[0]];
                    for (let i = 1; i < points.length - 1; i += 1) {
                        const prev = cleaned[cleaned.length - 1];
                        const curr = points[i];
                        const next = points[i + 1];
                        const prevToCurr = haversineKm(prev.lat, prev.lng, curr.lat, curr.lng);
                        const currToNext = haversineKm(curr.lat, curr.lng, next.lat, next.lng);
                        const prevToNext = haversineKm(prev.lat, prev.lng, next.lat, next.lng);
                        const isZeroSegment = prevToCurr < 0.001 || currToNext < 0.001;
                        const isSpike = prevToNext < Math.min(prevToCurr, currToNext) * 0.7
                            || prevToNext < (prevToCurr + currToNext) * 0.45;
                        if (isZeroSegment || isSpike) continue;
                        cleaned.push(curr);
                    }
                    cleaned.push(points[points.length - 1]);
                    return cleaned;
                };
                const smoothByWeightedAverage = (points) => {
                    if (points.length < 5) return points;
                    const w = [1, 2, 3, 2, 1];
                    const sumW = 9;
                    return points.map((point, index) => {
                        if (index < 2 || index > points.length - 3) return point;
                        let lng = 0;
                        let lat = 0;
                        for (let k = -2; k <= 2; k += 1) {
                            const weight = w[k + 2];
                            lng += points[index + k].lng * weight;
                            lat += points[index + k].lat * weight;
                        }
                        return {
                            ...point,
                            lng: lng / sumW,
                            lat: lat / sumW
                        };
                    });
                };
                const chaikinOpenCurve = (points, iterations = 1) => {
                    if (points.length < 3 || iterations <= 0) return points;
                    let result = points;
                    for (let step = 0; step < iterations; step += 1) {
                        const next = [result[0]];
                        for (let i = 0; i < result.length - 1; i += 1) {
                            const p0 = result[i];
                            const p1 = result[i + 1];
                            next.push({
                                ...p0,
                                lng: p0.lng * 0.75 + p1.lng * 0.25,
                                lat: p0.lat * 0.75 + p1.lat * 0.25
                            });
                            next.push({
                                ...p1,
                                lng: p0.lng * 0.25 + p1.lng * 0.75,
                                lat: p0.lat * 0.25 + p1.lat * 0.75
                            });
                        }
                        next.push(result[result.length - 1]);
                        result = next;
                    }
                    return result;
                };
                const rawSegments = splitToSegments(dedupedPoints);
                const maxRenderPointsPerSegment = 600;
                const renderedSegments = rawSegments
                    .map(segment => {
                        const deSpikedPoints = removeSpikePoints(segment);
                        const averagedPoints = smoothByWeightedAverage(deSpikedPoints);
                        const smoothedPoints = averagedPoints.length <= 1000
                            ? chaikinOpenCurve(averagedPoints, 1)
                            : averagedPoints;
                        if (smoothedPoints.length <= maxRenderPointsPerSegment) return smoothedPoints;
                        const step = Math.ceil(smoothedPoints.length / maxRenderPointsPerSegment);
                        return smoothedPoints.filter((_, index) => index % step === 0);
                    })
                    .filter(segment => segment.length >= 2);

                const allRenderedPoints = renderedSegments.flat();

                console.log(`轨迹优化: 原始 ${trackData.track.length} 点 -> 排序去重 ${dedupedPoints.length} 点 -> 分段 ${renderedSegments.length} 段 -> 绘制 ${allRenderedPoints.length} 点`);

                if (allRenderedPoints.length > 0) {
                    const shipDisplayName = trackData.shipName || trackData.shipCnName || '船舶';
                    let trackColor = shipTrackColors.get(mmsi);
                    if (!trackColor) {
                        const hue = ((Number(mmsi) * 137.508) % 360) / 360;
                        trackColor = Cesium.Color.fromHsl(hue, 0.9, 0.5, 0.95);
                        shipTrackColors.set(mmsi, trackColor);
                    }
                    renderedSegments.forEach((segment, segmentIndex) => {
                        const positions = segment.map(point =>
                            Cesium.Cartesian3.fromDegrees(point.lng, point.lat)
                        );
                        viewer.entities.add({
                            id: `ship-track-${mmsi}-seg-${segmentIndex}`,
                            name: `船舶轨迹 (MMSI: ${trackData.mmsi})`,
                            polyline: {
                                positions: positions,
                                width: 4,
                                material: new Cesium.PolylineOutlineMaterialProperty({
                                    color: trackColor,
                                    outlineColor: Cesium.Color.BLACK.withAlpha(0.35),
                                    outlineWidth: 1
                                }),
                                clampToGround: false
                            }
                        });
                    });

                    const startPoint = allRenderedPoints[0];
                    viewer.entities.add({
                        id: `track-start-${mmsi}`,
                        position: Cesium.Cartesian3.fromDegrees(startPoint.lng, startPoint.lat),
                        point: {
                            pixelSize: 12,
                            color: trackColor,
                            outlineColor: Cesium.Color.WHITE,
                            outlineWidth: 3
                        },
                        label: {
                            text: `起点 (${shipDisplayName})`,
                            font: '16px sans-serif',
                            fillColor: Cesium.Color.WHITE,
                            outlineColor: Cesium.Color.BLACK,
                            outlineWidth: 2,
                            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                            pixelOffset: new Cesium.Cartesian2(0, -12)
                        }
                    });
                    
                    // 飞到轨迹视角
                    setTimeout(() => {
                        let minLng = 180;
                        let maxLng = -180;
                        let minLat = 90;
                        let maxLat = -90;

                        allRenderedPoints.forEach(p => {
                            if (p.lng < minLng) minLng = p.lng;
                            if (p.lng > maxLng) maxLng = p.lng;
                            if (p.lat < minLat) minLat = p.lat;
                            if (p.lat > maxLat) maxLat = p.lat;
                        });

                        const lngDiff = maxLng - minLng;
                        const latDiff = maxLat - minLat;

                        if (lngDiff < 0.01 && latDiff < 0.01) {
                            viewer.camera.flyTo({
                                destination: Cesium.Cartesian3.fromDegrees((minLng + maxLng) / 2, (minLat + maxLat) / 2, 50000),
                                duration: 2
                            });
                        } else {
                            const margin = Math.max(lngDiff, latDiff) * 0.1;
                            viewer.camera.flyTo({
                                destination: Cesium.Rectangle.fromDegrees(
                                    minLng - margin,
                                    minLat - margin,
                                    maxLng + margin,
                                    maxLat + margin
                                ),
                                duration: 2
                            });
                        }
                    }, 300);

                    console.log(`✅ 已绘制 ${renderedSegments.length} 段轨迹，共 ${allRenderedPoints.length} 个点`);
                }
            } else if (trackData.action === 'remove' && trackData.mmsi != null) {
                removeTrackByMmsi(trackData.mmsi);
                shipTrackColors.delete(Number(trackData.mmsi));
                console.log(`🗑️ 已清除船舶轨迹: ${trackData.mmsi}`);
            } else if (trackData.action === 'clear') {
                clearAllTracks();
                console.log('🗑️ 所有轨迹已清除');
            }
        }, { deep: true });
        
        // 监听航线气象分析请求
        watch(() => props.routeWeatherRequest, async (request) => {
            if (!request || !routeWeatherLayer) return;
            
            // 处理清除气象数据的请求
            if (request.action === 'clear') {
                console.log('🗑️ 清除航线气象数据');
                routeWeatherLayer.clear();
                return;
            }
            
            console.log('🌦️ 收到航线气象分析请求:', request);
            
            try {
                let stats;
                
                // 判断是刷新还是新分析
                if (request.refresh && routeWeatherLayer.weatherData.length > 0) {
                    // 刷新现有数据
                    stats = await routeWeatherLayer.refreshWeatherData((current, total) => {
                        console.log(`🔄 刷新气象数据进度: ${current}/${total}`);
                    });
                } else {
                    // 执行新的气象分析（支持船速、起始时间和自定义阈值）
                    const options = {
                        shipSpeed: request.shipSpeed || 15, // 默认15节
                        startTime: request.startTime || new Date(),
                        thresholds: customThresholds // 使用自定义阈值
                    };
                    
                    stats = await routeWeatherLayer.analyzeRoute(
                        request.route, 
                        options,
                        (current, total) => {
                            console.log(`⏳ 气象数据获取进度: ${current}/${total}`);
                        }
                    );
                }
                
                console.log('✅ 航线气象分析完成:', stats);
                console.log(`   - 总采样点: ${stats.total}`);
                console.log(`   - 安全: ${stats.safe}, 注意: ${stats.caution}, 警告: ${stats.warning}, 危险: ${stats.danger}`);
                console.log(`   - 平均风速: ${stats.avgWindSpeed} m/s, 最大风速: ${stats.maxWindSpeed} m/s`);
                console.log(`   - 平均浪高: ${stats.avgWaveHeight} m, 最大浪高: ${stats.maxWaveHeight} m`);
                
                // 发送气象数据给父组件
                emit('weatherDataLoaded', {
                    data: routeWeatherLayer.weatherData,
                    stats: stats
                });
            } catch (error) {
                console.error('❌ 航线气象分析失败:', error);
            }
        }, { deep: true });
        
        // 监听气象筛选条件变化
        watch(() => props.weatherFilter, (filters) => {
            if (routeWeatherLayer && filters) {
                console.log('🔍 应用气象筛选:', filters);
                routeWeatherLayer.filterMarkers(filters);
            }
        }, { deep: true });
        
        // 监听地图选点状态变化
        watch(() => props.pickingPointType, (newType) => {
            console.log('📍 选点状态变化:', newType);
            console.log('   - viewer 存在:', !!viewer);
            console.log('   - pickPointHandler 存在:', !!pickPointHandler);
            
            if (!newType) {
                // 取消选点模式
                if (pickPointHandler) {
                    pickPointHandler.destroy();
                    pickPointHandler = null;
                }
                
                // 注意：坐标采集的标记不清除，保留在地图上
                
                console.log('❌ 取消地图选点');
                return;
            }
            
            // 移除旧的处理器
            if (pickPointHandler) {
                console.log('🗑️ 移除旧的点击处理器');
                pickPointHandler.destroy();
            }
            
            // 创建新的点击处理器
            if (!viewer) {
                console.error('❌ viewer 不存在，无法创建点击处理器');
                return;
            }
            
            console.log('✅ 创建新的点击处理器');
            
            pickPointHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
            
            pickPointHandler.setInputAction((click) => {
                console.log('🖱️ 地图被点击了！类型:', newType);

                const cartesian = pickCartesianFromClick(viewer, click.position);
                
                if (cartesian) {
                    // 转换为经纬度
                    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                    const lng = Cesium.Math.toDegrees(cartographic.longitude);
                    const lat = Cesium.Math.toDegrees(cartographic.latitude);
                    
                    console.log(`📍 选择了位置 (${newType}): ${lng.toFixed(6)}, ${lat.toFixed(6)}`);
                    
                    // 根据类型确定标记样式
                    let markerColor, markerLabel, markerText;
                    
                    switch (newType) {
                        case 'start':
                            markerColor = '#22c55e'; // 绿色
                            markerLabel = '起点';
                            markerText = 'A';
                            break;
                        case 'end':
                            markerColor = '#ef4444'; // 红色
                            markerLabel = '终点';
                            markerText = 'B';
                            break;
                        case 'avoid':
                            markerColor = '#f97316'; // 橙色
                            markerLabel = '避让点';
                            markerText = 'X'; // 使用 ASCII 字符
                            break;
                        case 'through':
                            markerColor = '#3b82f6'; // 蓝色
                            markerLabel = '途经点';
                            markerText = 'T'; // 使用 ASCII 字符
                            break;
                        case 'coordinate_collect':
                            markerColor = '#06b6d4'; // 青色
                            markerLabel = '采集点';
                            markerText = (pickPointMarkers.collected ? pickPointMarkers.collected.length + 1 : 1).toString();
                            break;
                        default:
                            markerColor = '#6b7280'; // 灰色
                            markerLabel = '选点';
                            markerText = '?';
                    }
                    
                    // 创建标记
                    const marker = viewer.entities.add({
                        position: Cesium.Cartesian3.fromDegrees(lng, lat),
                        point: {
                            pixelSize: 14,
                            color: Cesium.Color.fromCssColorString(markerColor),
                            outlineColor: Cesium.Color.WHITE,
                            outlineWidth: 2,
                            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                            disableDepthTestDistance: Number.POSITIVE_INFINITY
                        },
                        billboard: {
                            image: 'data:image/svg+xml;base64,' + window.btoa(`
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="48" viewBox="0 0 32 48">
                                    <path d="M16 0C7.2 0 0 7.2 0 16c0 8.8 16 32 16 32s16-23.2 16-32C32 7.2 24.8 0 16 0z" fill="${markerColor}" stroke="#fff" stroke-width="2"/>
                                    <circle cx="16" cy="16" r="6" fill="#fff"/>
                                    <text x="16" y="20" text-anchor="middle" font-size="10" fill="${markerColor}" font-weight="bold">${markerText}</text>
                                </svg>
                            `),
                            width: 32,
                            height: 48,
                            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                            disableDepthTestDistance: Number.POSITIVE_INFINITY
                        },
                        label: {
                            text: markerLabel,
                            font: '14px sans-serif',
                            fillColor: Cesium.Color.WHITE,
                            outlineColor: Cesium.Color.BLACK,
                            outlineWidth: 2,
                            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                            verticalOrigin: Cesium.VerticalOrigin.TOP,
                            pixelOffset: new Cesium.Cartesian2(0, 5),
                            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                            disableDepthTestDistance: Number.POSITIVE_INFINITY
                        }
                    });
                    
                    // 保存标记
                    if (newType === 'start' || newType === 'end') {
                        // 起点/终点：替换旧标记
                        if (pickPointMarkers[newType]) {
                            viewer.entities.remove(pickPointMarkers[newType]);
                        }
                        pickPointMarkers[newType] = marker;
                    } else if (newType === 'avoid') {
                        // 避让点：添加到数组
                        pickPointMarkers.avoid.push(marker);
                    } else if (newType === 'through') {
                        // 途经点：添加到数组
                        pickPointMarkers.through.push(marker);
                    } else if (newType === 'coordinate_collect') {
                        // 坐标采集：添加到数组
                        if (!pickPointMarkers.collected) {
                            pickPointMarkers.collected = [];
                        }
                        pickPointMarkers.collected.push(marker);
                    }
                    
                    // 发送选点结果
                    emit('pointPicked', lng, lat);
                    
                    // 如果不是坐标采集模式，清理处理器
                    if (newType !== 'coordinate_collect') {
                        pickPointHandler.destroy();
                        pickPointHandler = null;
                    }
                }
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
            
            const typeNames = {
                'start': '起点',
                'end': '终点',
                'avoid': '避让点',
                'through': '途经点'
            };
            console.log(`🖱️ 开始地图选点模式: ${typeNames[newType] || newType}`);
        });
        
        // 根据图层状态更新风场显示
        const updateWindVisibility = async (layers) => {
            if (!viewer) return;
            
            // 查找风场图层的状态
            let windEnabled = false;
            for (const layer of layers) {
                if (layer.id === 'env_monitor' && layer.active && layer.subLayers) {
                    const windSub = layer.subLayers.find(s => s.id === 'wind');
                    if (windSub && windSub.active) {
                        windEnabled = true;
                        break;
                    }
                }
            }
            
            console.log('🌬️ 风场图层状态（矿区图层控制）:', windEnabled);
            
            if (windEnabled && !windLayer) {
                // 需要显示但未初始化，初始化风场
                await initWindLayer();
                if (windLayer) {
                    windLayer.show = true;
                    showWind.value = true;
                    showAnimationLayer('wind');
                }
            } else if (windEnabled && windLayer) {
                // 需要显示且已初始化，显示风场
                windLayer.show = true;
                showWind.value = true;
                showAnimationLayer('wind');
            } else if (!windEnabled && windLayer) {
                // 不需要显示，隐藏风场
                windLayer.show = false;
                showWind.value = false;
                hideAnimationLayer('wind');
            }
        };
        
        // 根据气象图层状态更新显示
        const updateWeatherLayersVisibility = async (weatherLayers) => {
            if (!viewer) return;
            
            console.log('🌦️ 更新气象图层显示状态:', weatherLayers);
            
            // 处理 Windy 图层
            for (const group of weatherLayers) {
                if (group.id === 'windy' && group.subLayers) {
                    for (const subLayer of group.subLayers) {
                        if (subLayer.type === 'windy' && subLayer.layer) {
                            if (subLayer.active) {
                                // 激活 Windy 图层
                                if (!windyLayerManager) {
                                    windyLayerManager = new WindyLayerManager(viewer);
                                }
                                console.log(`✅ 显示 Windy 图层: ${subLayer.label} (${subLayer.layer})`);
                                await windyLayerManager.showLayer(subLayer.layer);
                            } else {
                                // 隐藏 Windy 图层
                                if (windyLayerManager) {
                                    console.log(`🙈 隐藏 Windy 图层: ${subLayer.label}`);
                                    windyLayerManager.hideLayer();
                                }
                            }
                        }
                    }
                }
                
                // 处理 OpenWeatherMap 图层
                if (group.id === 'openweathermap' && group.subLayers) {
                    if (!owmLayerManager) continue;
                    
                    for (const subLayer of group.subLayers) {
                        if (subLayer.type === 'imagery' && subLayer.url) {
                            if (subLayer.active) {
                                // 激活图层：添加到地图
                                if (!owmLayerManager.hasLayer(subLayer.id)) {
                                    console.log(`✅ 添加 OpenWeatherMap 图层: ${subLayer.label}`);
                                    owmLayerManager.addLayer(subLayer.id, subLayer.url, {
                                        alpha: 0.9  // 提高透明度到90%，更清晰可见
                                    });
                                } else {
                                    // 图层已存在，只需显示
                                    owmLayerManager.toggleLayer(subLayer.id, true);
                                }
                            } else {
                                // 取消激活：隐藏或移除图层
                                if (owmLayerManager.hasLayer(subLayer.id)) {
                                    console.log(`🙈 隐藏 OpenWeatherMap 图层: ${subLayer.label}`);
                                    owmLayerManager.removeLayer(subLayer.id);
                                }
                            }
                        }
                    }
                }
                
                // 处理基础气象图层（风场、波浪）
                if (group.id === 'basic_weather' && group.active && group.subLayers) {
                    // 处理风场图层
                    const windSub = group.subLayers.find(s => s.id === 'wind');
                    if (windSub && windSub.active) {
                        // 需要显示风场
                        if (!windLayer) {
                            // 未初始化，初始化风场
                            await initWindLayer();
                            if (windLayer) {
                                windLayer.show = true;
                                showWind.value = true;
                                viewer.scene.requestRenderMode = false;
                            }
                        } else {
                            // 已初始化，显示风场
                            windLayer.show = true;
                            showWind.value = true;
                            viewer.scene.requestRenderMode = false;
                        }
                    } else if (windLayer) {
                        // 不需要显示，隐藏风场
                        windLayer.show = false;
                        showWind.value = false;
                        viewer.scene.requestRenderMode = true;
                    }
                    
                    // 处理波浪图层
                    const waveSub = group.subLayers.find(s => s.id === 'wave');
                    if (waveSub && waveSub.active) {
                        // 需要显示波浪
                        if (!waveLayer) {
                            // 未初始化，初始化波浪
                            await initWaveLayer();
                            if (waveLayer) {
                                waveLayer.show = true;
                                showWave.value = true;
                                viewer.scene.requestRenderMode = false;
                            }
                        } else {
                            // 已初始化，显示波浪
                            waveLayer.show = true;
                            showWave.value = true;
                            viewer.scene.requestRenderMode = false;
                        }
                    } else if (waveLayer) {
                        // 不需要显示，隐藏波浪
                        waveLayer.show = false;
                        showWave.value = false;
                        viewer.scene.requestRenderMode = true;
                        // 停止相机高度监控
                        stopCameraHeightMonitoring();
                    }
                    
                    // 处理洋流图层
                    const oceanCurrentSub = group.subLayers.find(s => s.id === 'current');
                    if (oceanCurrentSub && oceanCurrentSub.active) {
                        // 需要显示洋流
                        if (!oceanCurrentLayer) {
                            // 未初始化，初始化洋流
                            await initOceanCurrentLayer();
                            if (oceanCurrentLayer) {
                                oceanCurrentLayer.show = true;
                                showOceanCurrent.value = true;
                                viewer.scene.requestRenderMode = false;
                            }
                        } else {
                            // 已初始化，显示洋流
                            oceanCurrentLayer.show = true;
                            showOceanCurrent.value = true;
                            viewer.scene.requestRenderMode = false;
                        }
                    } else if (oceanCurrentLayer) {
                        // 不需要显示，隐藏洋流
                        oceanCurrentLayer.show = false;
                        showOceanCurrent.value = false;
                        viewer.scene.requestRenderMode = true;
                    }
                }
                
                // 处理极端环境图层（内波）
                if (group.id === 'extreme_environment' && group.active && group.subLayers) {
                    // 处理内波图层
                    const internalWaveSub = group.subLayers.find(s => s.id === 'internal_wave');
                    console.log('🔍 检查内波图层:', { 
                        groupId: group.id, 
                        found: !!internalWaveSub, 
                        active: internalWaveSub?.active 
                    });
                    if (internalWaveSub && internalWaveSub.active) {
                        console.log('✅ 内波图层需要显示');
                        // 需要显示内波
                        if (!internalWaveLayer) {
                            console.log('⏳ 初始化内波图层...');
                            // 未初始化，初始化内波
                            await initInternalWaveLayer();
                            if (internalWaveLayer) {
                                internalWaveLayer.show = true;
                                showInternalWave.value = true;
                                viewer.scene.requestRenderMode = false;
                                console.log('✅ 内波图层已显示');
                            }
                        } else {
                            console.log('✅ 内波图层已存在，直接显示');
                            // 已初始化，显示内波
                            internalWaveLayer.show = true;
                            showInternalWave.value = true;
                            viewer.scene.requestRenderMode = false;
                        }
                    } else if (internalWaveLayer) {
                        console.log('🙈 隐藏内波图层');
                        // 不需要显示，隐藏内波
                        internalWaveLayer.show = false;
                        showInternalWave.value = false;
                        viewer.scene.requestRenderMode = true;
                    }
                }
            }
        };

        onMounted(() => {
            setTimeout(initCesium, 100);
        });

        onUnmounted(() => {
            // 停止相机高度监控
            stopCameraHeightMonitoring();
            
            // 清理视野 GeoJSON 管理器
            if (viewer && viewer._viewportGeoJsonManager) {
                viewer._viewportGeoJsonManager.destroy();
                viewer._viewportGeoJsonManager = null;
            }
            
            if (windLayer) {
                windLayer.remove();
                windLayer = null;
            }
            if (waveLayer) {
                waveLayer.remove();
                waveLayer = null;
            }
            if (oceanCurrentLayer) {
                oceanCurrentLayer.remove();
                oceanCurrentLayer = null;
            }
            if (internalWaveLayer) {
                internalWaveLayer.remove();
                internalWaveLayer = null;
            }
            if (clickHandler) {
                clickHandler.destroy();
            }
            if (shipLayer) {
                shipLayer.clearAll();
                shipLayer = null;
            }
            if (routeLayer) {
                routeLayer.clearRoute();
                routeLayer = null;
            }
            if (routeWeatherLayer) {
                routeWeatherLayer.clear();
                routeWeatherLayer = null;
            }
            if (owmLayerManager) {
                owmLayerManager.clearAll();
                owmLayerManager = null;
            }
            if (windyLayerManager) {
                windyLayerManager.destroy();
                windyLayerManager = null;
            }
            if (windLayer) {
                windLayer.destroy();
                windLayer = null;
            }
            clearMineralImportCommodity();
            if (viewer) {
                viewer.destroy();
            }
        });

        // 暴露viewer给父组件使用
        const getViewer = () => viewer;
        
        /**
         * 更新气象数据时间帧
         * @param {Number} timeIndex - 时间索引
         */
        const updateWeatherTime = async (timeIndex) => {
            console.log('⏰ MapContainer.updateWeatherTime 被调用');
            console.log('   - 接收到的 timeIndex:', timeIndex, '类型:', typeof timeIndex);
            console.log('   - showWave:', showWave.value);
            console.log('   - showOceanCurrent:', showOceanCurrent.value);
            console.log('   - showWind:', showWind.value);
            console.log('   - showInternalWave:', showInternalWave.value);
            
            // 确保 timeIndex 是数字
            const index = parseInt(timeIndex, 10);
            if (isNaN(index)) {
                console.error('❌ timeIndex 不是有效的数字:', timeIndex);
                return;
            }
            
            console.log('   - 转换后的 index:', index);
            
            try {
                // 更新波浪数据
                if (showWave.value && waveLayer) {
                    console.log('🌊 重新加载波浪数据，时间帧:', index);
                    const waveDataLoaderModule = await getWaveDataLoader();
                    const newWaveData = await waveDataLoaderModule.loadGlobalWaveData(index);
                    
                    // 彻底移除旧图层
                    try {
                        waveLayer.remove();
                        waveLayer = null;
                    } catch (e) {
                        console.warn('移除旧波浪图层时出错:', e);
                    }
                    
                    // 等待一帧，确保旧图层完全清理
                    await new Promise(resolve => setTimeout(resolve, 50));
                    
                    // 动态导入 cesium-wind-layer
                    const { WindLayer } = await import('cesium-wind-layer');
                    
                    // 创建新图层（使用相同的配置）
                    waveLayer = new WindLayer(viewer, newWaveData, {
                        particlesTextureSize: 640,
                        particleHeight: 0,
                        lineWidth: { min: 6, max: 10 },
                        lineLength: { min: 30, max: 60 },
                        speedFactor: 1.0,
                        dropRate: 0.006,
                        dropRateBump: 0.002,
                        colors: [
                            'rgba(0, 98, 255, 1)',      // 深蓝（低波高）
                            'rgba(0, 180, 255, 1)',     // 青色
                            'rgba(0, 255, 200, 1)',     // 青绿
                            'rgba(100, 255, 100, 1)',   // 绿色
                            'rgba(255, 255, 0, 1)',     // 黄色
                            'rgba(255, 150, 0, 1)',     // 橙色
                            'rgba(255, 50, 0, 1)'       // 红色（高波高）
                        ],
                        displayRange: { min: 0, max: 10 },
                        flipY: false,
                        // 启用热力图模式（类似Windy）
                        useColorScale: true,  // 显示颜色热力图
                        fadeOpacity: 0.95     // 热力图透明度
                    });
                    
                    waveLayer.show = true;
                    cachedWaveData = newWaveData;
                    
                    // 暂时禁用热力图更新
                    /*
                    // 更新热力图
                    if (waveHeatmap) {
                        const colorScale = [
                            'rgba(0, 0, 139, 1)',
                            'rgba(0, 0, 255, 1)',
                            'rgba(0, 191, 255, 1)',
                            'rgba(0, 255, 255, 1)',
                            'rgba(0, 255, 127, 1)',
                            'rgba(173, 255, 47, 1)',
                            'rgba(255, 255, 0, 1)',
                            'rgba(255, 165, 0, 1)',
                            'rgba(255, 69, 0, 1)',
                            'rgba(255, 0, 0, 1)'
                        ];
                        
                        waveHeatmap.createHeatmap(newWaveData, colorScale, {
                            alpha: 0.7,
                            bounds: newWaveData.bounds
                        });
                    }
                    */
                    
                    console.log('✅ 波浪数据已更新');
                    console.log('   📊 新数据统计:');
                    console.log('   - 时间帧:', timeIndex);
                    console.log('   - 数据点:', newWaveData.width, 'x', newWaveData.height);
                }
                
                // 更新洋流数据
                if (showOceanCurrent.value && oceanCurrentLayer) {
                    console.log('🌊 重新加载洋流数据，时间帧:', index);
                    const oceanCurrentLoaderModule = await getOceanCurrentLoader();
                    const newCurrentData = await oceanCurrentLoaderModule.loadGlobalOceanCurrentData(index);
                    
                    // 彻底移除旧图层
                    try {
                        oceanCurrentLayer.remove();
                        oceanCurrentLayer = null;
                    } catch (e) {
                        console.warn('移除旧洋流图层时出错:', e);
                    }
                    
                    // 等待一帧，确保旧图层完全清理
                    await new Promise(resolve => setTimeout(resolve, 50));
                    
                    // 动态导入 cesium-wind-layer
                    const { WindLayer } = await import('cesium-wind-layer');
                    
                    // 创建新图层（使用相同的配置）
                    oceanCurrentLayer = new WindLayer(viewer, newCurrentData, {
                        particlesTextureSize: 1024,
                        particleHeight: 3000,
                        lineWidth: { min: 1.5, max: 3.5 },
                        lineLength: { min: 600, max: 1200 },
                        speedFactor: 0.8,
                        dropRate: 0.0003,
                        dropRateBump: 0.0001,
                        colors: [
                            'rgba(255, 255, 100, 0.85)',
                            'rgba(255, 240, 0, 0.88)',
                            'rgba(255, 200, 0, 0.9)',
                            'rgba(255, 160, 0, 0.92)',
                            'rgba(255, 120, 0, 0.94)',
                            'rgba(255, 80, 0, 0.96)',
                            'rgba(255, 40, 0, 0.97)',
                            'rgba(255, 0, 50, 0.98)',
                            'rgba(220, 0, 100, 0.99)',
                            'rgba(180, 0, 150, 1.0)'
                        ],
                        flipY: false,
                        dynamic: true,
                        useColorScale: true,
                        fadeOpacity: 0.96
                    });
                    
                    oceanCurrentLayer.show = true;
                    cachedOceanCurrentData = newCurrentData;
                    
                    console.log('✅ 洋流数据已更新');
                }
                
                // 更新风场数据
                if (showWind.value && windLayer) {
                    console.log('🌬️  重新加载风场数据，时间帧:', index);
                    const windDataLoaderModule = await getWindDataLoader();
                    const newWindData = await windDataLoaderModule.loadGlobalWindData(index);
                    
                    // 彻底移除旧图层
                    try {
                        windLayer.remove();
                        windLayer = null;
                    } catch (e) {
                        console.warn('移除旧风场图层时出错:', e);
                    }
                    
                    // 等待一帧，确保旧图层完全清理
                    await new Promise(resolve => setTimeout(resolve, 50));
                    
                    // 动态导入 cesium-wind-layer
                    const { WindLayer } = await import('cesium-wind-layer');
                    
                    // 创建新图层（使用相同的配置）
                    windLayer = new WindLayer(viewer, newWindData, {
                        particlesTextureSize: 1024,
                        particleHeight: 100000,
                        lineWidth: { min: 1.0, max: 2.5 },
                        lineLength: { min: 150, max: 300 },
                        speedFactor: 2.5,
                        dropRate: 0.002,
                        dropRateBump: 0.0008,
                        colors: [
                            'rgba(98, 113, 183, 1)',
                            'rgba(57, 97, 159, 1)',
                            'rgba(74, 148, 169, 1)',
                            'rgba(77, 141, 123, 1)',
                            'rgba(83, 165, 83, 1)',
                            'rgba(53, 159, 53, 1)',
                            'rgba(167, 157, 81, 1)',
                            'rgba(159, 127, 58, 1)',
                            'rgba(161, 108, 92, 1)',
                            'rgba(129, 58, 78, 1)',
                            'rgba(175, 80, 136, 1)',
                            'rgba(117, 74, 147, 1)',
                            'rgba(109, 97, 163, 1)',
                            'rgba(68, 105, 141, 1)'
                        ],
                        displayRange: { min: 0, max: 30 },
                        flipY: false,
                        useColorScale: true,
                        fadeOpacity: 0.98
                    });
                    
                    windLayer.show = true;
                    cachedWindData = newWindData;
                    
                    console.log('✅ 风场数据已更新');
                }
                
                // 更新内波数据
                if (showInternalWave.value && internalWaveLayer) {
                    console.log('🌊 重新加载内波数据，时间帧:', index);
                    const internalWaveLoaderModule = await getInternalWaveLoader();
                    const newInternalWaveData = await internalWaveLoaderModule.loadGlobalInternalWaveData(index);
                    
                    // 彻底移除旧图层
                    try {
                        internalWaveLayer.remove();
                        internalWaveLayer = null;
                    } catch (e) {
                        console.warn('移除旧内波图层时出错:', e);
                    }
                    
                    // 等待一帧，确保旧图层完全清理
                    await new Promise(resolve => setTimeout(resolve, 50));
                    
                    // 动态导入 cesium-wind-layer
                    const { WindLayer } = await import('cesium-wind-layer');
                    
                    // 创建新图层（使用相同的配置）
                    internalWaveLayer = new WindLayer(viewer, newInternalWaveData, {
                        particlesTextureSize: 1024,
                        particleHeight: 4000,
                        lineWidth: { min: 2.5, max: 5.0 },
                        lineLength: { min: 150, max: 350 },
                        speedFactor: 0.6,
                        dropRate: 0.002,
                        dropRateBump: 0.001,
                        displayRange: { min: 0, max: 10 },
                        colors: [
                            'rgba(255, 255, 150, 0.9)',
                            'rgba(255, 255, 100, 0.92)',
                            'rgba(255, 220, 0, 0.94)',
                            'rgba(255, 180, 0, 0.95)',
                            'rgba(255, 140, 0, 0.96)',
                            'rgba(255, 100, 0, 0.97)',
                            'rgba(255, 60, 0, 0.98)',
                            'rgba(255, 20, 0, 0.99)',
                            'rgba(220, 0, 50, 1.0)',
                            'rgba(180, 0, 100, 1.0)',
                            'rgba(140, 0, 140, 1.0)',
                            'rgba(100, 0, 180, 1.0)'
                        ],
                        flipY: true,
                        dynamic: true,
                        useColorScale: true,
                        fadeOpacity: 0.98
                    });
                    
                    internalWaveLayer.show = true;
                    cachedInternalWaveData = newInternalWaveData;
                    
                    console.log('✅ 内波数据已更新');
                }
                
                // 强制刷新场景
                if (viewer) {
                    viewer.scene.requestRender();
                }
            } catch (error) {
                console.error('❌ 更新气象数据失败:', error);
            }
        };
        
        /**
         * 飞到矿区位置
         * @param {Object} area - 矿区信息 { polygon: [[lon, lat], ...] }
         */
        const flyToMiningArea = (area) => {
            if (!viewer || !area || !area.polygon || area.polygon.length === 0) {
                console.warn('⚠️ 无法定位到矿区：缺少必要信息');
                return;
            }
            
            console.log('🎯 飞到矿区:', area.name || area.id);
            
            // 计算多边形的中心点
            let centerLon = 0;
            let centerLat = 0;
            area.polygon.forEach(([lon, lat]) => {
                centerLon += lon;
                centerLat += lat;
            });
            centerLon /= area.polygon.length;
            centerLat /= area.polygon.length;
            
            console.log(`   中心点: (${centerLon.toFixed(2)}, ${centerLat.toFixed(2)})`);
            
            // 计算合适的高度（根据多边形大小）
            let minLon = area.polygon[0][0];
            let maxLon = area.polygon[0][0];
            let minLat = area.polygon[0][1];
            let maxLat = area.polygon[0][1];
            
            area.polygon.forEach(([lon, lat]) => {
                if (lon < minLon) minLon = lon;
                if (lon > maxLon) maxLon = lon;
                if (lat < minLat) minLat = lat;
                if (lat > maxLat) maxLat = lat;
            });
            
            const lonRange = maxLon - minLon;
            const latRange = maxLat - minLat;
            const maxRange = Math.max(lonRange, latRange);
            
            // 根据范围计算高度（范围越大，高度越高）
            const height = Math.max(500000, maxRange * 200000);
            
            console.log(`   飞行高度: ${height.toFixed(0)}m`);
            
            // 飞到矿区
            viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, height),
                orientation: {
                    heading: 0,
                    pitch: Cesium.Math.toRadians(-90),
                    roll: 0
                },
                duration: 2,
                easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT
            });
        };
        
        // ==================== 航线演示控制函数 ====================
        
        /**
         * 初始化航线演示
         */
        const initRouteDemo = async () => {
            try {
                console.log('🎬 初始化航线演示...');
                
                if (!routeDemoLayer) {
                    // 传入矿区数据源
                    routeDemoLayer = new RouteDemoLayer(viewer, dataSource);
                }
                
                // 初始化时传入矿区ID（CMMPMN1）
                await routeDemoLayer.initialize('CMMPMN1');
                
                // 设置航点到达回调
                routeDemoLayer.onWaypointReached = (waypoint, index) => {
                    console.log('📍 到达航点:', waypoint.name, '索引:', index);
                    
                    // 通知App.vue更新面板
                    const appRouteDemoRef = window.appRouteDemoRef;
                    if (appRouteDemoRef) {
                        appRouteDemoRef.updateWeather(waypoint);
                        appRouteDemoRef.updateProgress(index, routeDemoLayer.demoData.route.waypoints.length);
                    }
                    
                    // 通知气象卡片更新滚动进度
                    window.dispatchEvent(new CustomEvent('updateWeatherCardProgress', {
                        detail: { dayIndex: index }
                    }));
                };
                
                // 设置高风险警告回调
                routeDemoLayer.onHighRiskWarning = (waypoint) => {
                    console.log('⚠️ 高风险警告:', waypoint.name, waypoint.risk);
                    
                    // 通知App.vue显示警告
                    const appRiskWarningRef = window.appRiskWarningRef;
                    if (appRiskWarningRef) {
                        appRiskWarningRef.showWarning(waypoint);
                    }
                };
                
                // 设置航点点击回调
                routeDemoLayer.onWaypointClick = (waypointData, clickPosition) => {
                    console.log('📍 [MapContainer] 航点被点击:', waypointData.name);
                    
                    // 构建气象信息显示数据
                    const weatherDetails = {
                        title: waypointData.name,
                        items: [
                            { label: '风险等级', value: waypointData.risk === 'safe' ? '安全' : 
                                                         waypointData.risk === 'caution' ? '注意' :
                                                         waypointData.risk === 'warning' ? '警告' : '危险' },
                            { label: '风速', value: `${waypointData.weather.windSpeed} m/s` },
                            { label: '风级', value: `${waypointData.weather.windBeaufort} 级` },
                            { label: '风向', value: waypointData.weather.windDirection },
                            { label: '浪高', value: `${waypointData.weather.waveHeight} m` },
                            { label: '能见度', value: `${(waypointData.weather.visibility / 1000).toFixed(1)} km` },
                            { label: '温度', value: `${waypointData.weather.temperature} °C` },
                            { label: '气压', value: `${waypointData.weather.pressure} hPa` }
                        ]
                    };
                    
                    // 关闭船舶信息窗口
                    selectedShip.value = null;
                    
                    // 显示气象详情窗口
                    selectedWeather.value = weatherDetails;
                    weatherInfoPosition.value = {
                        x: Math.min(clickPosition.x + 20, window.innerWidth - 370),
                        y: Math.max(clickPosition.y - 100, 10)
                    };
                    
                    console.log('✅ [MapContainer] 显示航点气象信息');
                };
                
                // 设置船舶点击回调
                routeDemoLayer.onShipClick = (shipData, clickPosition) => {
                    console.log('🚢 [MapContainer] 船舶被点击');
                    
                    // 关闭气象信息窗口
                    selectedWeather.value = null;
                    
                    // 显示船舶信息
                    selectedShip.value = {
                        ship_name: shipData.ship_name,
                        ship_cnname: shipData.ship_cnname,
                        ship_type: shipData.ship_type,
                        length: shipData.route,
                        width: shipData.description,
                        sog: shipData.averageSpeed,
                        dest: shipData.endArea,
                        draught: shipData.distance,
                        eta: shipData.estimatedDays,
                        last_time: '演示中',
                        navistat: '航行中'
                    };
                    
                    shipInfoPosition.value = {
                        x: Math.min(clickPosition.x + 20, window.innerWidth - 370),
                        y: Math.max(clickPosition.y - 100, 10)
                    };
                    
                    console.log('✅ [MapContainer] 显示演示船舶信息');
                };
                
                // 设置动画完成回调
                routeDemoLayer.onAnimationComplete = () => {
                    console.log('✅ 演示完成 - 船舶已到达目标矿区');
                    
                    // 自动触发到达逻辑
                    console.log('🎯 自动切换到作业模式');
                    
                    // 显示到达提示
                    window.dispatchEvent(new CustomEvent('showRouteRiskWarning', {
                        detail: {
                            type: 'arrival',
                            name: '中国五矿集团 (CMC)',
                            weather: {
                                windSpeed: 8.5,
                                windBeaufort: 5,
                                waveHeight: 2.2,
                                visibility: 15000
                            }
                        }
                    }));
                    
                    // 切换气象面板到作业模式
                    setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('switchWeatherCardMode', {
                            detail: { mode: 'working' }
                        }));
                    }, 500);  // 延迟500ms，让提示先显示
                };
                
                // 设置航线信息到面板
                const appRouteDemoRef = window.appRouteDemoRef;
                if (appRouteDemoRef && routeDemoLayer.demoData) {
                    appRouteDemoRef.setRouteInfo(routeDemoLayer.demoData.route);
                    // 设置初始航点信息
                    const firstWaypoint = routeDemoLayer.demoData.route.waypoints[0];
                    appRouteDemoRef.updateWeather(firstWaypoint);
                }
                
                // 显示矿区气象信息卡片 - 使用事件系统
                console.log('📊 准备发送显示气象卡片事件');
                
                if (routeDemoLayer.demoData) {
                    // 生成航程预报数据（20天）
                    const voyageForecast = [];
                    const today = new Date();
                    
                    for (let i = 0; i < 20; i++) {
                        const date = new Date(today);
                        date.setDate(today.getDate() + i);
                        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
                        
                        let windSpeed, waveHeight, risk;
                        
                        // 前5天：平静海况
                        if (i < 5) {
                            windSpeed = 7 + Math.random() * 2;  // 7-9 m/s
                            waveHeight = 1.5 + Math.random() * 0.8;  // 1.5-2.3 m
                            risk = 'safe';
                        }
                        // 第6-10天：台风影响
                        else if (i < 10) {
                            windSpeed = 12 + Math.random() * 5;  // 12-17 m/s
                            waveHeight = 3 + Math.random() * 1.5;  // 3-4.5 m
                            risk = i < 8 ? 'warning' : 'danger';
                        }
                        // 第11-20天：逐渐好转
                        else {
                            windSpeed = 8 + Math.random() * 3;  // 8-11 m/s
                            waveHeight = 2 + Math.random() * 1;  // 2-3 m
                            risk = windSpeed > 10 ? 'caution' : 'safe';
                        }
                        
                        voyageForecast.push({
                            date: dateStr,
                            windSpeed: parseFloat(windSpeed.toFixed(1)),
                            waveHeight: parseFloat(waveHeight.toFixed(1)),
                            risk: risk
                        });
                    }
                    
                    // 生成到达后预报数据（7天）
                    const arrivalForecast = [];
                    const arrivalDate = new Date(today);
                    arrivalDate.setDate(today.getDate() + 20);  // 20天后到达
                    
                    for (let i = 0; i < 7; i++) {
                        const date = new Date(arrivalDate);
                        date.setDate(arrivalDate.getDate() + i);
                        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
                        
                        // 模拟变化的作业条件
                        const windSpeed = 6 + Math.random() * 8;  // 6-14 m/s
                        const waveHeight = 1.5 + Math.random() * 2;  // 1.5-3.5 m
                        const workable = windSpeed < 12 && waveHeight < 3;  // 作业条件：风速<12m/s 且 浪高<3m
                        
                        let risk;
                        if (windSpeed > 12 || waveHeight > 3) {
                            risk = 'warning';
                        } else if (windSpeed > 10 || waveHeight > 2.5) {
                            risk = 'caution';
                        } else {
                            risk = 'safe';
                        }
                        
                        arrivalForecast.push({
                            date: dateStr,
                            windSpeed: parseFloat(windSpeed.toFixed(1)),
                            waveHeight: parseFloat(waveHeight.toFixed(1)),
                            workable: workable,
                            risk: risk
                        });
                    }
                    
                    // 计算统计数据
                    const voyageStats = {
                        highRiskDays: voyageForecast.filter(d => d.risk === 'danger' || d.risk === 'warning').length,
                        safeDays: voyageForecast.filter(d => d.risk === 'safe').length
                    };
                    
                    const arrivalStats = {
                        workableDays: arrivalForecast.filter(d => d.workable).length
                    };
                    
                    // 设置到达后预报数据到 routeDemoLayer（在发送事件之前）
                    if (arrivalForecast && arrivalForecast.length > 0) {
                        routeDemoLayer.setArrivalForecast(arrivalForecast);
                        console.log('✅ 已将到达后预报数据传递给 routeDemoLayer');
                    }
                    
                    // 构造矿区气象数据
                    const miningAreaWeather = {
                        name: routeDemoLayer.demoData.route.endArea.name,
                        contractor: '中国五矿集团',
                        mineral: '多金属结核',
                        current: {
                            windSpeed: 8.5 + Math.random() * 2,  // 当前风速 8.5-10.5 m/s
                            waveHeight: 2.2 + Math.random() * 0.5,  // 当前浪高 2.2-2.7 m
                            temperature: 26,
                            windDirection: '东北',
                            windBeaufort: 5
                        },
                        voyageForecast: voyageForecast,
                        voyageStats: voyageStats,
                        arrivalForecast: arrivalForecast,
                        arrivalStats: arrivalStats
                    };
                    
                    // 通过全局事件发送（初始为航行模式）
                    window.dispatchEvent(new CustomEvent('showMiningWeatherCard', {
                        detail: {
                            data: miningAreaWeather,
                            mode: 'voyage'  // 初始显示航行模式
                        }
                    }));
                    
                    console.log('✅ 已发送显示气象卡片事件，包含航程和到达预报数据，模式：voyage');
                }
                
                console.log('✅ 航线演示初始化完成');
            } catch (error) {
                console.error('❌ 初始化航线演示失败:', error);
            }
        };
        
        /**
         * 播放演示
         */
        const playRouteDemo = () => {
            if (routeDemoLayer) {
                routeDemoLayer.play();
                showAnimationLayer('routeDemo');
            }
        };
        
        /**
         * 暂停演示
         */
        const pauseRouteDemo = () => {
            if (routeDemoLayer) {
                routeDemoLayer.pause();
            }
        };
        
        /**
         * 继续演示
         */
        const resumeRouteDemo = () => {
            if (routeDemoLayer) {
                routeDemoLayer.resume();
            }
        };
        
        /**
         * 停止演示
         */
        const stopRouteDemo = () => {
            if (routeDemoLayer) {
                routeDemoLayer.stop();
                hideAnimationLayer('routeDemo');
                
                // 船舶到达矿区，切换到作业模式
                console.log('🎯 船舶已到达矿区，切换气象面板到作业模式');
                
                // 显示到达提示
                window.dispatchEvent(new CustomEvent('showRouteRiskWarning', {
                    detail: {
                        type: 'arrival',
                        name: '中国五矿集团 (CMC)',
                        weather: {
                            windSpeed: 8.5,
                            windBeaufort: 5,
                            waveHeight: 2.2,
                            visibility: 15000
                        }
                    }
                }));
                
                // 切换气象面板到作业模式
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('switchWeatherCardMode', {
                        detail: { mode: 'working' }
                    }));
                }, 500);  // 延迟500ms，让提示先显示
            }
        };
        
        /**
         * 设置演示速度
         */
        const setRouteDemoSpeed = (speed) => {
            if (routeDemoLayer) {
                routeDemoLayer.setSpeed(speed);
            }
        };
        
        /**
         * 清除演示
         */
        const clearRouteDemo = () => {
            if (routeDemoLayer) {
                routeDemoLayer.clear();
                routeDemoLayer = null;
                hideAnimationLayer('routeDemo');
            }
        };
        
        /**
         * 更新主题（由App.vue调用）
         */
        const updateTheme = (theme) => {
            if (!viewer) return;
            
            console.log('🎨 MapContainer 更新主题:', theme);
            
            if (theme === 'light') {
                // 亮色主题 - 保持影像底图清晰
                if (viewer._vecLayer) viewer._vecLayer.alpha = 1.0; // 影像底图完全不透明
                if (viewer._boundaryLayer) viewer._boundaryLayer.alpha = 0.8; // 边界稍微透明
                if (viewer._labelLayer) viewer._labelLayer.alpha = 1.0; // 标注完全不透明
                
                viewer.scene.backgroundColor = Cesium.Color.TRANSPARENT;
                viewer.scene.globe.baseColor = Cesium.Color.TRANSPARENT; // 地球透明
                viewer.scene.skyAtmosphere.show = true;
                viewer.scene.skyAtmosphere.hueShift = 0;
                viewer.scene.skyAtmosphere.saturationShift = -0.3;
                viewer.scene.skyAtmosphere.brightnessShift = 0.2;
                viewer.scene.skyBox.show = true;
            } else {
                // 暗色主题 - 恢复原始透明度
                if (viewer._vecLayer) viewer._vecLayer.alpha = 1.0;  // 影像底图也保持清晰
                if (viewer._boundaryLayer) viewer._boundaryLayer.alpha = 1.0;
                if (viewer._labelLayer) viewer._labelLayer.alpha = 1.0;
                
                viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#001a33');
                viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#000814');
                viewer.scene.skyAtmosphere.show = true;
                viewer.scene.skyAtmosphere.hueShift = -0.2;
                viewer.scene.skyAtmosphere.saturationShift = -0.1;
                viewer.scene.skyAtmosphere.brightnessShift = -0.2;
                viewer.scene.skyBox.show = true;
            }
            
            // 强制刷新场景
            viewer.scene.requestRender();
        };
        
        /**
         * 切换试验试采标记显示
         * @param {Boolean} show - 是否显示
         * @param {Object} panelRef - 试验试采信息弹窗引用
         */
        const toggleExperimentalMining = (show, panelRef) => {
            if (!experimentalMiningLayer) {
                console.error('❌ 试验试采图层未初始化');
                return;
            }
            
            console.log('🔴 切换试验试采标记:', show);
            
            if (show) {
                experimentalMiningLayer.show();
                showExperimentalMining.value = true;
                
                // 设置点击事件处理器
                if (!viewer._experimentalMiningClickHandler) {
                    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
                    handler.setInputAction((click) => {
                        // 计算 CSS scale 缩放比例
                        const baseWidth = 1920;
                        const baseHeight = 1080;
                        const scaleX = window.innerWidth / baseWidth;
                        const scaleY = window.innerHeight / baseHeight;
                        
                        // 修正点击坐标
                        const correctedPosition = new Cesium.Cartesian2(
                            click.position.x / scaleX,
                            click.position.y / scaleY
                        );
                        
                        // 拾取实体
                        const pickedObject = viewer.scene.pick(correctedPosition);
                        
                        if (Cesium.defined(pickedObject) && pickedObject.id) {
                            const entity = pickedObject.id;
                            
                            // 检查是否点击了试验试采标记
                            if (entity.properties && entity.properties.type) {
                                const type = entity.properties.type.getValue();
                                
                                if (type === 'experimental_mining') {
                                    const siteData = entity.properties.siteData.getValue();
                                    console.log('🔴 点击了试验试采标记:', siteData.name);
                                    
                                    // 显示弹窗
                                    if (panelRef && panelRef.show) {
                                        panelRef.show(siteData, click.position);
                                    }
                                }
                            }
                        }
                    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
                    
                    viewer._experimentalMiningClickHandler = handler;
                    viewer._experimentalMiningPanelRef = panelRef;
                }
            } else {
                experimentalMiningLayer.hide();
                showExperimentalMining.value = false;
                
                // 移除点击事件处理器
                if (viewer._experimentalMiningClickHandler) {
                    viewer._experimentalMiningClickHandler.destroy();
                    viewer._experimentalMiningClickHandler = null;
                    viewer._experimentalMiningPanelRef = null;
                }
            }
        };
        
        /**
         * 切换大洋钻探图层显示
         * @param {Boolean} show - 是否显示
         */
        const toggleDrilling = async (show) => {
            if (!drillingLayer) {
                console.error('❌ 大洋钻探图层未初始化');
                return;
            }
            
            console.log('🔵 切换大洋钻探图层:', show);
            
            if (show) {
                // 如果还没有加载数据，先加载
                if (!drillingLayer.dataSource) {
                    await drillingLayer.load();
                }
                drillingLayer.show();
                showDrilling.value = true;
            } else {
                drillingLayer.hide();
                showDrilling.value = false;
            }
        };
        
        /**
         * 更新钻孔数据筛选
         * @param {Object} filters - 筛选条件
         */
        const updateDrillingFilters = (filters) => {
            if (!drillingLayer) {
                console.error('❌ 大洋钻探图层未初始化');
                return;
            }
            
            console.log('🔍 更新钻孔筛选条件:', filters);
            drillingLayer.updateFilters(filters);
        };
        
        /**
         * 选择岩心库并飞到对应点位
         * @param {string|null} countryId - 国家ID (usa, germany, japan) 或 null
         */
        const selectCoreRepository = async (countryId) => {
            console.log('🗺️ MapContainer: 收到岩心库选择', countryId);
            if (!coreRepositoryLayer) {
                console.error('❌ 岩心库图层未初始化');
                return;
            }
            
            // 更新当前选中的国家
            currentSelectedCountry.value = countryId;
            
            // 设置点击回调
            coreRepositoryLayer.setClickCallback((config, area) => {
                console.log('🖱️ 岩心库被点击:', config);
                selectedCoreRepository.value = config;
                showCoreRepositoryPopup.value = true;
            });
            
            console.log('🗺️ MapContainer: 调用coreRepositoryLayer.select');
            await coreRepositoryLayer.select(countryId);
        };
        
        /**
         * 关闭岩心库弹窗
         */
        const closeCoreRepositoryPopup = () => {
            showCoreRepositoryPopup.value = false;
        };
        
        /**
         * 切换资源分布图层显示
         * @param {Array} resources - 要显示的资源类型列表
         */
        const toggleResources = async (resources) => {
            if (!resourceLayer) {
                console.error('❌ 资源分布图层未初始化');
                return;
            }
            
            console.log('💎 切换资源分布图层:', resources);
            
            // 资源类型与数据文件的映射
            const resourceFiles = {
                '深海稀土': '/data/SHXT.geojson',
                '多金属结核': '/data/DJSJH.geojson',
                '富钴铁锰结壳': '/data/FGJQ.geojson',
                '多金属硫化物': '/data/DJSLHW.geojson'
            };
            
            // 资源类型与颜色的映射
            const resourceColors = {
                '深海稀土': {
                    stroke: Cesium.Color.fromCssColorString('#EC4899'),  // 粉色
                    fill: Cesium.Color.fromCssColorString('#EC4899').withAlpha(0.3)
                },
                '多金属结核': {
                    stroke: Cesium.Color.fromCssColorString('#3B82F6'),  // 蓝色
                    fill: Cesium.Color.fromCssColorString('#3B82F6').withAlpha(0.3)
                },
                '富钴铁锰结壳': {
                    stroke: Cesium.Color.fromCssColorString('#EAB308'),  // 黄色
                    fill: Cesium.Color.fromCssColorString('#EAB308').withAlpha(0.3)
                },
                '多金属硫化物': {
                    stroke: Cesium.Color.fromCssColorString('#EA580C'),  // 橙色
                    fill: Cesium.Color.fromCssColorString('#EA580C').withAlpha(0.3)
                }
            };
            
            // 隐藏所有资源图层
            resourceLayer.hideAll();
            
            // 显示选中的资源
            for (const resource of resources) {
                // 如果还没有加载，先加载
                if (!resourceLayer.isLoaded(resource)) {
                    const dataFile = resourceFiles[resource];
                    const colors = resourceColors[resource];
                    if (dataFile && colors) {
                        await resourceLayer.load(resource, dataFile, colors);
                    }
                }
                // 显示图层
                resourceLayer.show(resource);
            }
            
            showResources.value = resources;
        };
        
        // ==================== 美国合作关系线监听 ====================
        
        /**
         * 监听showUSCooperation prop变化
         */
        watch(() => props.showUSCooperation, (newVal) => {
            console.log('🇺🇸 美国合作关系线显示状态变化:', newVal);
            
            if (!viewer) {
                console.warn('⚠️ Viewer未初始化，无法显示合作关系线');
                return;
            }
            
            if (newVal) {
                // 显示合作关系线
                if (!usCooperationManager) {
                    usCooperationManager = new USCooperationLinesManager(viewer);
                }
                usCooperationManager.show();
                console.log('✅ 美国合作关系线已显示');
            } else {
                // 隐藏合作关系线
                if (usCooperationManager) {
                    usCooperationManager.hide();
                    console.log('❌ 美国合作关系线已隐藏');
                }
            }
        });
        
        // ==================== 多边形绘制功能 ====================
        
        /**
         * 启用多边形绘制模式
         */
        const enablePolygonDrawing = () => {
            if (!viewer) {
                console.warn('⚠️ Viewer未初始化');
                return;
            }
            
            isPolygonDrawingMode.value = true;
            polygonPoints.value = [];
            console.log('🖊️ 多边形绘制模式已启用');
            
            // 创建独立的多边形绘制事件处理器
            if (!polygonDrawHandler) {
                polygonDrawHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
            }
            
            polygonDrawHandler.setInputAction((click) => {
                if (!isPolygonDrawingMode.value) return;
                
                // 计算 CSS scale 缩放比例（与坐标采集功能保持一致）
                const baseWidth = 1920;
                const baseHeight = 1080;
                const scaleX = window.innerWidth / baseWidth;
                const scaleY = window.innerHeight / baseHeight;
                
                // 修正点击坐标
                const correctedPosition = new Cesium.Cartesian2(
                    click.position.x / scaleX,
                    click.position.y / scaleY
                );
                
                // 获取点击位置的地理坐标（使用修正后的坐标）
                const cartesian = viewer.camera.pickEllipsoid(correctedPosition, viewer.scene.globe.ellipsoid);
                if (!cartesian) return;
                
                const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                const longitude = Cesium.Math.toDegrees(cartographic.longitude);
                const latitude = Cesium.Math.toDegrees(cartographic.latitude);
                
                // 添加顶点
                const point = { longitude, latitude };
                polygonPoints.value.push(point);
                
                // 添加顶点标记
                const marker = viewer.entities.add({
                    position: cartesian,
                    point: {
                        pixelSize: 10,
                        color: Cesium.Color.CYAN,
                        outlineColor: Cesium.Color.WHITE,
                        outlineWidth: 2
                    },
                    label: {
                        text: `${polygonPoints.value.length}`,
                        font: '14px sans-serif',
                        fillColor: Cesium.Color.WHITE,
                        outlineColor: Cesium.Color.BLACK,
                        outlineWidth: 2,
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        pixelOffset: new Cesium.Cartesian2(0, -15)
                    }
                });
                polygonPointMarkers.push(marker);
                
                // 更新临时多边形
                updateTempPolygon();
                
                console.log(`📍 添加顶点 ${polygonPoints.value.length}:`, point);
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        };
        
        /**
         * 禁用多边形绘制模式
         */
        const disablePolygonDrawing = () => {
            isPolygonDrawingMode.value = false;
            
            // 移除多边形绘制事件监听
            if (polygonDrawHandler) {
                polygonDrawHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            }
            
            console.log('⏹️ 多边形绘制模式已禁用');
        };
        
        /**
         * 更新临时多边形（绘制中）
         */
        const updateTempPolygon = () => {
            if (!viewer) return;
            
            // 移除旧的临时多边形
            if (tempPolygonEntity) {
                viewer.entities.remove(tempPolygonEntity);
                tempPolygonEntity = null;
            }
            
            // 至少需要3个点才能绘制多边形
            if (polygonPoints.value.length < 3) return;
            
            // 创建新的临时多边形
            const positions = polygonPoints.value.map(p => 
                Cesium.Cartesian3.fromDegrees(p.longitude, p.latitude)
            );
            
            tempPolygonEntity = viewer.entities.add({
                polygon: {
                    hierarchy: positions,
                    material: Cesium.Color.CYAN.withAlpha(0.3),
                    outline: true,
                    outlineColor: Cesium.Color.CYAN,
                    outlineWidth: 2
                }
            });
        };
        
        /**
         * 完成多边形绘制
         * @returns {Object} 多边形数据
         */
        const finishPolygonDrawing = () => {
            if (!viewer || polygonPoints.value.length < 3) {
                console.warn('⚠️ 至少需要3个顶点才能完成多边形');
                return null;
            }
            
            // 创建最终的多边形
            const positions = polygonPoints.value.map(p => 
                Cesium.Cartesian3.fromDegrees(p.longitude, p.latitude)
            );
            
            const polygonEntity = viewer.entities.add({
                polygon: {
                    hierarchy: positions,
                    material: Cesium.Color.YELLOW.withAlpha(0.4),
                    outline: true,
                    outlineColor: Cesium.Color.YELLOW,
                    outlineWidth: 3
                }
            });
            
            polygonEntities.push(polygonEntity);
            
            // 保存多边形数据
            const polygonData = {
                id: `polygon_${Date.now()}`,
                points: [...polygonPoints.value],
                entity: polygonEntity
            };
            
            // 清理临时数据
            clearTempPolygonData();
            
            console.log('✅ 多边形绘制完成:', polygonData);
            return polygonData;
        };
        
        /**
         * 取消当前多边形绘制
         */
        const cancelPolygonDrawing = () => {
            clearTempPolygonData();
            console.log('❌ 已取消多边形绘制');
        };
        
        /**
         * 清理临时多边形数据
         */
        const clearTempPolygonData = () => {
            if (!viewer) return;
            
            // 移除临时多边形
            if (tempPolygonEntity) {
                viewer.entities.remove(tempPolygonEntity);
                tempPolygonEntity = null;
            }
            
            // 移除顶点标记
            polygonPointMarkers.forEach(marker => {
                viewer.entities.remove(marker);
            });
            polygonPointMarkers = [];
            
            // 清空顶点数据
            polygonPoints.value = [];
        };
        
        /**
         * 清空所有多边形
         */
        const clearAllPolygons = () => {
            if (!viewer) return;
            
            // 移除所有多边形实体
            polygonEntities.forEach(entity => {
                viewer.entities.remove(entity);
            });
            polygonEntities = [];
            
            // 清理临时数据
            clearTempPolygonData();
            
            console.log('🗑️ 已清空所有多边形');
        };
        
        /**
         * 添加多边形到地图
         * @param {Object} polygon - 多边形数据
         */
        const addPolygon = (polygon) => {
            if (!viewer || !polygon || !polygon.points || polygon.points.length < 3) {
                console.warn('⚠️ 无效的多边形数据');
                return;
            }
            
            const positions = polygon.points.map(p => 
                Cesium.Cartesian3.fromDegrees(p.longitude, p.latitude)
            );
            
            const polygonEntity = viewer.entities.add({
                polygon: {
                    hierarchy: positions,
                    material: Cesium.Color.YELLOW.withAlpha(0.4),
                    outline: true,
                    outlineColor: Cesium.Color.YELLOW,
                    outlineWidth: 3
                }
            });
            
            polygonEntities.push(polygonEntity);
            console.log('📐 多边形已添加到地图');
        };
        
        /**
         * 更新地图上的所有多边形
         * @param {Array} polygons - 多边形列表
         */
        const updatePolygons = (polygons) => {
            if (!viewer) return;
            
            // 清空现有多边形
            polygonEntities.forEach(entity => {
                viewer.entities.remove(entity);
            });
            polygonEntities = [];
            
            // 添加新的多边形
            polygons.forEach(polygon => {
                addPolygon(polygon);
            });
            
            console.log(`📊 已更新 ${polygons.length} 个多边形`);
        };
        
        // ==================== 北极盆地数据加载功能 ====================
        
        /**
         * 加载北极盆地分布数据
         */
        const loadArcticBasinData = async () => {
            if (!viewer) {
                console.warn('⚠️ Viewer未初始化，无法加载北极盆地数据');
                return;
            }
            
            try {
                console.log('🏔️ 开始加载北极盆地分布数据...');
                
                // 加载两个北极盆地数据文件
                const dataFiles = [
                    '/data/BJ/PD/PD1.geojson',
                    '/data/BJ/PD/PD2.geojson'
                ];
                
                for (const dataFile of dataFiles) {
                    console.log(`📂 加载文件: ${dataFile}`);
                    
                    // 使用fetch加载自定义格式的数据
                    const response = await fetch(dataFile);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    console.log('📊 加载的数据:', data);
                    
                    // 检查数据格式
                    if (data.type === 'PolygonCollection' && data.polygons) {
                        // 处理自定义的PolygonCollection格式
                        data.polygons.forEach((polygon, index) => {
                            if (polygon.points && polygon.points.length >= 3) {
                                // 转换点坐标为Cesium格式
                                const positions = polygon.points.map(point => 
                                    Cesium.Cartesian3.fromDegrees(point.longitude, point.latitude)
                                );
                                
                                // 创建多边形实体
                                const entity = viewer.entities.add({
                                    name: polygon.name || `北极盆地_${index + 1}`,
                                    polygon: {
                                        hierarchy: positions,
                                        material: Cesium.Color.SKYBLUE.withAlpha(0.8),
                                        outline: true,
                                        outlineColor: Cesium.Color.WHITE,
                                        outlineWidth: 5
                                    }
                                });
                                
                                // 添加到数据源数组（这里存储实体而不是数据源）
                                arcticBasinDataSources.push(entity);
                                
                                console.log(`✅ 成功加载北极盆地: ${polygon.name || `盆地_${index + 1}`}`);
                            }
                        });
                    } else {
                        console.warn('⚠️ 数据格式不正确:', data);
                    }
                }
                
                showArcticBasin.value = true;
                console.log(`🏔️ 北极盆地数据加载完成，共加载 ${arcticBasinDataSources.length} 个盆地`);
                
            } catch (error) {
                console.error('❌ 加载北极盆地数据失败:', error);
            }
        };
        
        /**
         * 卸载北极盆地分布数据
         */
        const unloadArcticBasinData = () => {
            if (!viewer) return;
            
            try {
                console.log('🗑️ 开始卸载北极盆地分布数据...');
                
                // 移除所有北极盆地实体
                arcticBasinDataSources.forEach(entity => {
                    viewer.entities.remove(entity);
                });
                
                // 清空实体数组
                arcticBasinDataSources = [];
                showArcticBasin.value = false;
                
                console.log('✅ 北极盆地数据卸载完成');
                
            } catch (error) {
                console.error('❌ 卸载北极盆地数据失败:', error);
            }
        };
        
        /**
         * 切换北极盆地数据显示
         * @param {boolean} show - 是否显示
         */
        const toggleArcticBasinData = async (show) => {
            if (show && !showArcticBasin.value) {
                await loadArcticBasinData();
            } else if (!show && showArcticBasin.value) {
                unloadArcticBasinData();
            }
        };
        
        // ==================== 北极资源数据加载功能（天然气、石油）====================
        
        /**
         * 加载北极资源数据
         * @param {string} resourceType - 资源类型：'natural_gas' 或 'oil'
         */
        const loadArcticResourceData = async (resourceType) => {
            if (!viewer) {
                console.warn('⚠️ Viewer未初始化，无法加载北极资源数据');
                return;
            }
            
            try {
                const resourceNames = {
                    natural_gas: '天然气',
                    oil: '石油'
                };
                
                const resourceName = resourceNames[resourceType];
                console.log(`⛽ 开始加载北极${resourceName}数据...`);
                
                const dataFile = `/data/BJ/${resourceName}.geojson`;
                
                // 创建小长方块图标（横向）
                const canvas = document.createElement('canvas');
                canvas.width = 8;  // 横向：宽度
                canvas.height = 5;  // 横向：高度
                const ctx = canvas.getContext('2d');
                
                // 设置颜色：天然气红色，石油深绿色
                const color = resourceType === 'natural_gas' ? '#FF0000' : '#006400';
                
                // 绘制横向长方块，不要边框
                ctx.fillStyle = color;
                ctx.fillRect(0, 0, 8, 5);
                
                // 使用fetch加载GeoJSON数据
                const response = await fetch(dataFile);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const geojsonData = await response.json();
                console.log('📊 加载的数据:', geojsonData);
                
                // 手动创建实体
                const entities = [];
                if (geojsonData.features) {
                    geojsonData.features.forEach((feature, index) => {
                        if (feature.geometry && feature.geometry.type === 'Point') {
                            const [longitude, latitude] = feature.geometry.coordinates;
                            
                            const entity = viewer.entities.add({
                                name: feature.properties?.name || `${resourceName}_${index + 1}`,
                                position: Cesium.Cartesian3.fromDegrees(longitude, latitude),
                                billboard: {
                                    image: canvas,
                                    width: 8,
                                    height: 5,
                                    verticalOrigin: Cesium.VerticalOrigin.CENTER,
                                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                                },
                                properties: feature.properties
                            });
                            
                            entities.push(entity);
                        }
                    });
                }
                
                // 存储实体引用（而不是数据源）
                if (!arcticResourceDataSources[resourceType]) {
                    arcticResourceDataSources[resourceType] = [];
                }
                arcticResourceDataSources[resourceType] = entities;
                
                showArcticResources.value[resourceType] = true;
                console.log(`✅ 成功加载 ${entities.length} 个${resourceName}点位`);
                
            } catch (error) {
                console.error(`❌ 加载北极${resourceNames[resourceType]}数据失败:`, error);
            }
        };
        
        /**
         * 卸载北极资源数据
         * @param {string} resourceType - 资源类型：'natural_gas' 或 'oil'
         */
        const unloadArcticResourceData = (resourceType) => {
            if (!viewer) return;
            
            try {
                const resourceNames = {
                    natural_gas: '天然气',
                    oil: '石油'
                };
                
                console.log(`🗑️ 开始卸载北极${resourceNames[resourceType]}数据...`);
                
                // 移除所有实体
                if (arcticResourceDataSources[resourceType] && Array.isArray(arcticResourceDataSources[resourceType])) {
                    arcticResourceDataSources[resourceType].forEach(entity => {
                        viewer.entities.remove(entity);
                    });
                    arcticResourceDataSources[resourceType] = [];
                }
                
                showArcticResources.value[resourceType] = false;
                console.log(`✅ 北极${resourceNames[resourceType]}数据卸载完成`);
                
            } catch (error) {
                console.error(`❌ 卸载北极${resourceNames[resourceType]}数据失败:`, error);
            }
        };
        
        /**
         * 切换北极资源数据显示
         * @param {string} resourceType - 资源类型：'natural_gas' 或 'oil'
         * @param {boolean} show - 是否显示
         */
        const toggleArcticResourceData = async (resourceType, show) => {
            if (show && !showArcticResources.value[resourceType]) {
                await loadArcticResourceData(resourceType);
            } else if (!show && showArcticResources.value[resourceType]) {
                unloadArcticResourceData(resourceType);
            }
        };
        
        // ==================== 返回暴露的方法和状态 ====================
        
        return {
            cesiumContainer,
            selectedArea,
            infoPosition,
            closeInfo,
            addToMonitoring,  // 添加到监测
            is3D,
            showWind,
            showTrajectory,
            selectedShip,
            shipInfoPosition,
            closeShipInfo,
            selectedWeather,
            weatherInfoPosition,
            closeWeatherInfo,
            selectedDrilling,
            drillingInfoPosition,
            closeDrillingInfo,
            selectedCable,
            cableInfoPosition,
            closeCableInfo,
            getShipTypeName,
            getNavigationStatus,
            isEtaExpired,
            showRoutePlan,
            initRouteDemo,
            playRouteDemo,
            pauseRouteDemo,
            resumeRouteDemo,
            stopRouteDemo,
            setRouteDemoSpeed,
            clearRouteDemo,
            toggleRoutePlan,
            handleRoutePlanned,
            handleRouteCleared,
            handlePickPoint,  // 暴露地图选点处理函数
            handleThresholdsChanged,  // 暴露阈值变化处理函数
            updateWeatherTime,  // 暴露时间更新函数
            updateTheme,  // 暴露主题更新函数
            flyToRegion,  // 暴露区域定位函数
            flyToMiningArea,  // 暴露矿区定位函数
            toggleCountryAttitudes,  // 暴露各国态度渲染切换函数
            toggleMineralImportCommodity,  // 暴露矿产品进口渲染切换函数
            clearMineralImportCommodity,  // 暴露矿产品进口图层清理函数
            getMineralImportPopupData,  // 暴露矿产品弹窗数据获取函数
            relaxMineralImportView,  // 暴露矿产品视角缩小函数
            restoreMineralImportView,  // 暴露矿产品进口视角恢复函数
            toggleExperimentalMining,  // 暴露试验试采标记切换函数
            toggleDrilling,  // 暴露大洋钻探图层切换函数
            updateDrillingFilters,  // 暴露钻孔筛选更新函数
            selectCoreRepository,  // 暴露岩心库选择函数
            toggleResources,  // 暴露资源分布图层切换函数
            toggleSubmarineCables,  // 暴露海底光缆图层切换函数
            toggleArcticRoutes,  // 暴露北极航线图层切换函数
            highlightArcticRoute,  // 暴露北极航线高亮函数
            resetArcticRouteHighlight,  // 暴露北极航线重置高亮函数
            flyToArcticRoute,  // 暴露北极航线定位函数
            toggleSeafloorObservation,  // 暴露海底观测网图层切换函数
            clearSeafloorObservation,  // 暴露海底观测网整组清理函数
            highlightObservation,  // 暴露海底观测网高亮函数
            resetObservationHighlight,  // 暴露海底观测网重置高亮函数
            flyToObservation,  // 暴露海底观测网定位函数
            flyToSeafloorCountry,  // 暴露海底观测网国家总览函数
            toggleMarineEquipment,  // 暴露海洋装备图层切换函数
            flyToMarineEquipment,  // 暴露海洋装备定位函数
            refreshMarineEquipment,  // 暴露海洋装备刷新函数
            toggleResearchInstitution,  // 暴露研究机构图层切换函数
            clearResearchInstitution,  // 暴露研究机构整组清理函数
            flyToResearchInstitution,  // 暴露研究机构定位函数
            flyToResearchCountry,  // 暴露研究机构国家总览函数
            highlightResearchInstitution,  // 暴露研究机构高亮函数
            resetResearchInstitutionHighlight,  // 暴露研究机构重置高亮函数
            toggleUsaMarineLayer,  // 暴露美国海洋空间规划图层切换函数
            toggleJapanMarineGeologyLayer,  // 暴露日本海洋地质图层切换函数
            toggleJapanGeologyTileLayer,  // 暴露日本地质图瓦片图层切换函数
            togglePorts,  // 暴露港口标记切换函数
            zoomIn,
            zoomOut,
            resetView,
            flyToCountryOverview,
            toggle2D3D,
            switchTo2D,  // 暴露切换到2D的方法
            switchTo3D,  // 暴露切换到3D的方法
            loadPolarStations,  // 暴露加载极地科考站的方法
            togglePolarStations,  // 暴露切换科考站显示的方法
            getPolarStationCountries,  // 暴露获取国家列表的方法
            loadPolarStationsByCountries,  // 暴露按国家加载科考站的方法
            loadPolarResources,  // 暴露加载极地资源的方法
            loadPolarResourcesByRegionAndType,  // 暴露按区域和类型加载极地资源的方法
            loadMarineProtectedAreas,  // 暴露加载海洋保护区的方法
            loadAntarcticResources,  // 暴露加载南极资源的方法
            toggleAntarcticResources,  // 暴露切换南极资源显示的方法
            filterAntarcticResourcesByType,  // 暴露按类型筛选南极资源的方法
            getAntarcticResourceList,  // 暴露获取南极资源列表的方法
            showStationInfo,  // 科考站信息弹窗显示状态
            selectedStation,  // 选中的科考站
            stationInfoPosition,  // 科考站信息窗口位置
            showStationLegend,  // 科考站国家图例显示状态
            stationCountries,  // 科考站国家列表
            closeStationInfo,  // 关闭科考站信息弹窗
            showCoreRepositoryPopup,  // 岩心库弹窗显示状态
            selectedCoreRepository,  // 选中的岩心库
            currentSelectedCountry,  // 当前选中的国家
            closeCoreRepositoryPopup,  // 关闭岩心库弹窗
            toggleFullscreen,
            toggleTrajectory,
            viewer: getViewer,  // 暴露viewer
            // 气象点查询相关
            weatherPickedPoint,
            currentWeatherLayer,
            weatherDataCache,
            weatherTimeSteps,
            currentTimeIndex,
            closeWeatherPicker,
            // 多边形绘制相关
            enablePolygonDrawing,
            disablePolygonDrawing,
            finishPolygonDrawing,
            cancelPolygonDrawing,
            clearAllPolygons,
            addPolygon,
            updatePolygons,
            isPolygonDrawingMode,
            polygonPoints,
            // 北极盆地数据相关
            loadArcticBasinData,
            unloadArcticBasinData,
            toggleArcticBasinData,
            showArcticBasin,
            // 北极资源数据相关
            loadArcticResourceData,
            unloadArcticResourceData,
            toggleArcticResourceData,
            showArcticResources
        };
    }
};
</script>

<style scoped>
/* 自定义地图工具按钮 - 增强版（支持主题） */
.map-tool-btn {
    width: 3.5rem;
    height: 3.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    background: linear-gradient(135deg, var(--panel-bg), var(--secondary-bg));
    border: 2px solid var(--border-primary);
    color: var(--accent-cyan);
    transition: all 0.3s ease;
    clip-path: polygon(0 0, 100% 0, 100% 80%, 80% 100%, 0 100%);
    cursor: pointer;
    box-shadow: var(--shadow-glow), var(--shadow-inset);
}

/* 按钮发光边框效果 */
.map-tool-btn::before {
    content: '';
    position: absolute;
    inset: -2px;
    background: linear-gradient(45deg, transparent, var(--accent-cyan-light), transparent);
    clip-path: polygon(0 0, 100% 0, 100% 80%, 80% 100%, 0 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: -1;
}

.map-tool-btn:hover::before {
    opacity: 1;
}

.map-tool-btn:hover {
    background: var(--btn-primary-hover);
    color: #000;
    border-color: rgba(255, 255, 255, 0.9);
    box-shadow: var(--shadow-glow-hover), 0 0 20px rgba(255, 255, 255, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.3);
    transform: translateX(-6px) scale(1.05);
}

.map-tool-btn:active {
    transform: translateX(-6px) scale(0.98);
    box-shadow: var(--shadow-glow), inset 0 0 15px rgba(0, 0, 0, 0.3);
}

/* 图标增强 */
.map-tool-btn svg {
    filter: drop-shadow(0 0 2px var(--accent-cyan-glow));
    transition: filter 0.3s ease;
}

.map-tool-btn:hover svg {
    filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.9));
}

/* 工具栏滑入动画 */
.toolbar-slide-enter-active,
.toolbar-slide-leave-active {
    transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.toolbar-slide-enter-from {
    opacity: 0;
    transform: translateX(30px) scale(0.8);
}

.toolbar-slide-leave-to {
    opacity: 0;
    transform: translateX(30px) scale(0.8);
}

/* 每个按钮延迟动画 */
.map-tool-btn:nth-child(1) {
    animation: slideIn 0.3s ease 0.1s both;
}

.map-tool-btn:nth-child(2) {
    animation: slideIn 0.3s ease 0.15s both;
}

.map-tool-btn:nth-child(3) {
    animation: slideIn 0.3s ease 0.2s both;
}

.map-tool-btn:nth-child(4) {
    animation: slideIn 0.3s ease 0.25s both;
}

.map-tool-btn:nth-child(5) {
    animation: slideIn 0.3s ease 0.3s both;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateX(20px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

/* 地图容器 */
.map-container-wrapper {
    position: relative;
    background-color: var(--globe-bg);
}

/* 背景图层 - 铺满整个页面 */
.map-bg-layer {
    position: fixed;  /* 改为 fixed，相对于视口定位 */
    inset: 0;
    z-index: -1;  /* 改为 -1，确保在所有内容下面 */
    pointer-events: none;
    width: 100vw;
    height: 100vh;
}

/* 亮色主题背景图 */
[data-theme="light"] .map-bg-layer {
    /* background-image: url('/image/bg.jpg'); */
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
}

/* 暗色主题无背景图 */
[data-theme="dark"] .map-bg-layer {
    background-image: none;
}
</style>
