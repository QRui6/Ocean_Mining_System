<template>
    <transition name="fade">
        <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
            <!-- 背景遮罩 -->
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('close')"></div>
            
            <!-- 主面板 -->
            <div class="relative w-[90vw] h-[85vh] backdrop-blur-md rounded-lg shadow-2xl overflow-hidden border"
                 style="background: var(--panel-bg); border-color: var(--panel-border);">
                
                <!-- 标题栏 -->
                <div class="flex items-center justify-between px-6 py-4 border-b"
                     style="background: var(--panel-header-bg); border-color: var(--panel-border);">
                    <div class="flex items-center gap-3">
                        <span class="text-3xl">🇦🇶</span>
                        <h2 class="text-2xl font-bold" style="color: var(--text-primary);">南极主权主张详情</h2>
                    </div>
                    <button @click="$emit('close')" 
                            class="w-10 h-10 flex items-center justify-center rounded-lg transition-all hover:bg-red-500/20"
                            style="color: var(--text-secondary);">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <!-- 内容区域 - 左右分栏 -->
                <div class="flex h-[calc(100%-80px)]">
                    <!-- 左侧：图片和表格 -->
                    <div class="w-1/2 p-6 border-r overflow-y-auto" style="border-color: var(--panel-border);">
                        <div class="space-y-6">
                            <!-- 说明文字 -->
                            <div class="p-4 rounded-lg" style="background: rgba(6, 182, 212, 0.1);">
                                <h3 class="text-lg font-bold mb-2" style="color: var(--text-primary);">核心主权主张国及扇形范围明细</h3>
                                <p class="text-sm leading-relaxed" style="color: var(--text-secondary);">
                                    7个主权声索国的主张区域覆盖约83%的南极大陆。澳大利亚、新西兰、法国、挪威四国五相承认对方声索范围，形成统一立场；
                                    英国、阿根廷、智利三国声索范围大面积重叠，彼此互不认可，是南极主权争议的核心矛盾点。
                                </p>
                            </div>
                            
                            <!-- 南极主权分布图 -->
                            <div class="rounded-lg overflow-hidden border" style="border-color: var(--panel-border);">
                                <img src="/image/antarctic-sovereignty.png" 
                                     alt="南极主权分布图" 
                                     class="w-full h-auto"
                                     @error="handleImageError">
                            </div>
                            
                            <!-- 主权主张国详细信息表格 -->
                            <div>
                                <h3 class="text-xl font-bold mb-4" style="color: var(--text-primary);">主权主张国详细信息</h3>
                                <div class="overflow-auto">
                                    <table class="w-full border-collapse">
                                        <thead style="background: var(--panel-header-bg);">
                                            <tr>
                                                <th class="px-3 py-2 text-left text-xs font-bold border" 
                                                    style="color: var(--text-primary); border-color: var(--panel-border);">主张国家</th>
                                                <th class="px-3 py-2 text-left text-xs font-bold border" 
                                                    style="color: var(--text-primary); border-color: var(--panel-border);">主张扇形范围（经纬度）</th>
                                                <th class="px-3 py-2 text-left text-xs font-bold border" 
                                                    style="color: var(--text-primary); border-color: var(--panel-border);">主张面积</th>
                                                <th class="px-3 py-2 text-left text-xs font-bold border" 
                                                    style="color: var(--text-primary); border-color: var(--panel-border);">主张依据与核心立场</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="(claim, index) in antarcticClaims" :key="index"
                                                class="transition-colors hover:bg-cyan-500/10">
                                                <td class="px-3 py-2 text-xs font-bold border" 
                                                    style="color: var(--text-primary); border-color: var(--panel-border);">
                                                    {{ claim.country }}
                                                </td>
                                                <td class="px-3 py-2 text-xs border" 
                                                    style="color: var(--text-secondary); border-color: var(--panel-border);">
                                                    {{ claim.range }}
                                                </td>
                                                <td class="px-3 py-2 text-xs border" 
                                                    style="color: var(--text-secondary); border-color: var(--panel-border);">
                                                    {{ claim.area }}
                                                </td>
                                                <td class="px-3 py-2 text-xs border leading-relaxed" 
                                                    style="color: var(--text-secondary); border-color: var(--panel-border);">
                                                    {{ claim.basis }}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 右侧：非主权主张国核心立场 -->
                    <div class="w-1/2 p-6 overflow-y-auto">
                        <h3 class="text-xl font-bold mb-4" style="color: var(--text-primary);">非主权主张国核心立场</h3>
                        
                        <div class="space-y-4">
                            <p class="text-sm leading-relaxed" style="color: var(--text-secondary);">
                                多数南极条约缔约国不承认任何国家的南极主权主张，部分大国同时保留未来主张权利，整体秉持中立或观望态度，专注科考合作，核心国家立场如下：
                            </p>
                            
                            <div class="space-y-3">
                                <div v-for="(position, index) in nonClaimantPositions" :key="index"
                                     class="p-4 rounded-lg border transition-all hover:shadow-lg"
                                     style="background: rgba(6, 182, 212, 0.05); border-color: var(--panel-border);">
                                    <div class="flex items-start gap-3">
                                        <div class="flex-shrink-0 w-2 h-2 rounded-full mt-2" 
                                             style="background: var(--accent-cyan);"></div>
                                        <div class="flex-1">
                                            <h4 class="text-base font-bold mb-2" style="color: var(--text-primary);">
                                                {{ position.country }}
                                            </h4>
                                            <p class="text-sm leading-relaxed" style="color: var(--text-secondary);">
                                                {{ position.stance }}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
export default {
    name: 'AntarcticSovereigntyDetail',
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['close'],
    data() {
        return {
            antarcticClaims: [
                {
                    country: '英国',
                    range: '20°W-80°W, 60°S以南至南极点',
                    area: '约170万平方公里',
                    basis: '1908年首个正式提出南极主权主张，为南极主权声索起源国，以早期极地探险、航海勘测为依据，划为英属外领地，与阿根廷、智利主张完全重叠，坚持原有声索立场。'
                },
                {
                    country: '新西兰',
                    range: '160°E-150°W, 60°S以南至南极点',
                    area: '约150万平方公里',
                    basis: '1923年正式主张，依托英国殖民体系延伸，以罗斯属地为核心，依托长期科考与站点布局强化立场，承认澳、法、挪三国声索范围。'
                },
                {
                    country: '澳大利亚',
                    range: '45°E-160°E, 60°S以南至南极点',
                    area: '约590万平方公里',
                    basis: '1933年正式主张，声索面积全球最大，以地缘邻近、早期科考勘探为依据，长期投入科考基地，承认新、法、挪三国声索。'
                },
                {
                    country: '法国',
                    range: '136°E-142°E, 60°S以南至南极点（阿黛利地）',
                    area: '约43万平方公里',
                    basis: '1924年正式主张，以本国探险家发现为依据，命名阿黛利地，长期营运迪蒙迪维尔站，遵循欧洲方区域内，互相承认。'
                },
                {
                    country: '挪威',
                    range: '0°-20°W, 60°S以南至南极点（毛德皇后地）',
                    area: '约250万平方公里',
                    basis: '1939年正式主张，以探险家阿蒙森首登南极点为依据，命名毛德皇后地，范围独立无重叠，与澳、新、法互承认声索。'
                },
                {
                    country: '阿根廷',
                    range: '25°W-74°W, 60°S以南至南极点',
                    area: '约96万平方公里',
                    basis: '1940年代正式主张，依托南美南端邻近国，以地理毗邻、区域管控为依据，与阿根廷、英国主张大面积重叠，坚持自身声索诉求。'
                },
                {
                    country: '智利',
                    range: '53°W-90°W, 60°S以南至南极点',
                    area: '约126万平方公里',
                    basis: '1940年代正式主张，同属南美南端邻近国，以地理毗邻、区域管控为依据，与阿根廷、英国主张大面积重叠，坚持自身声索诉求。'
                }
            ],
            nonClaimantPositions: [
                {
                    country: '美国',
                    stance: '不承认七国任何主权主张，同时保留自身对南极提出领土主张的全部权利，依托全球最大科考体量与技术优势，主导南极条约体系运行，坚守南极"非军事化、和平科研"核心定位。'
                },
                {
                    country: '俄罗斯（苏联）',
                    stance: '与美国立场完全一致，不承认他国主权主张，保留自身主张权利，继承苏联科考遗产，依托内陆科考优势深度参与南极治理，平衡各方势力。'
                },
                {
                    country: '中国',
                    stance: '一贯坚持南极属于全人类共同财富，不承认任何国家的南极主权主张，坚决反对南极领土化，主张各国在南极条约体系框架下开展和平科考与国际合作，共同守护南极生态环境。'
                },
                {
                    country: '其他缔约国',
                    stance: '日本、德国、韩国、印度、乌克兰等国，均持中立立场，不参与任何主权争夺，专注科研合作，严格遵守南极条约体系各项规定。'
                }
            ]
        };
    },
    methods: {
        handleImageError(e) {
            console.warn('南极主权分布图加载失败');
            e.target.style.display = 'none';
        }
    }
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* 滚动条样式 */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb {
    background: rgba(6, 182, 212, 0.3);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: rgba(6, 182, 212, 0.5);
}
</style>
