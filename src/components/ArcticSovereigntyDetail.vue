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
                        <span class="text-3xl">🧊</span>
                        <h2 class="text-2xl font-bold" style="color: var(--text-primary);">北极主权主张详情</h2>
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
                    <!-- 左侧：说明和表格 -->
                    <div class="w-1/2 p-6 border-r overflow-y-auto custom-scrollbar" style="border-color: var(--panel-border);">
                        <div class="space-y-6">
                            <!-- 说明文字 -->
                            <div class="p-4 rounded-lg" style="background: rgba(59, 130, 246, 0.1);">
                                <h3 class="text-lg font-bold mb-2" style="color: var(--text-primary);">核心主权主张国及诉求明细</h3>
                                <p class="text-sm leading-relaxed" style="color: var(--text-secondary);">
                                    在北极领土与海域争端中，主要涉及"北极五国"（北冰洋沿岸五国），各国的具体主张信息如下：
                                </p>
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
                                                    style="color: var(--text-primary); border-color: var(--panel-border);">核心争议区域与主张范围</th>
                                                <th class="px-3 py-2 text-left text-xs font-bold border" 
                                                    style="color: var(--text-primary); border-color: var(--panel-border);">主张依据与核心立场</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="(claim, index) in arcticClaims" :key="index"
                                                class="transition-colors hover:bg-blue-500/10">
                                                <td class="px-3 py-2 text-xs font-bold border" 
                                                    style="color: var(--text-primary); border-color: var(--panel-border);">
                                                    {{ claim.country }}
                                                </td>
                                                <td class="px-3 py-2 text-xs border leading-relaxed" 
                                                    style="color: var(--text-secondary); border-color: var(--panel-border);">
                                                    {{ claim.range }}
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
                    
                    <!-- 右侧：非北极国家的核心立场 -->
                    <div class="w-1/2 p-6 overflow-y-auto custom-scrollbar">
                        <h3 class="text-xl font-bold mb-4" style="color: var(--text-primary);">非北极国家的核心立场（含中国）</h3>
                        
                        <div class="space-y-4">
                            <p class="text-sm leading-relaxed" style="color: var(--text-secondary);">
                                对于不与北冰洋接壤的国家而言，北极公海区域及国际海底区域被视为"人类共同继承的财产"。各国的核心立场主要聚焦于科研、环保、航道利用和遵守国际法：
                            </p>
                            
                            <div class="space-y-3">
                                <div v-for="(position, index) in nonArcticPositions" :key="index"
                                     class="p-4 rounded-lg border transition-all hover:shadow-lg"
                                     style="background: rgba(59, 130, 246, 0.05); border-color: var(--panel-border);">
                                    <div class="flex items-start gap-3">
                                        <div class="flex-shrink-0 w-2 h-2 rounded-full mt-2" 
                                             style="background: var(--accent-blue);"></div>
                                        <div class="flex-1">
                                            <h4 class="text-base font-bold mb-2" style="color: var(--text-primary);">
                                                {{ position.country }}
                                            </h4>
                                            <p class="text-sm leading-relaxed whitespace-pre-line" style="color: var(--text-secondary);">
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
    name: 'ArcticSovereigntyDetail',
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['close'],
    data() {
        return {
            arcticClaims: [
                {
                    country: '俄罗斯',
                    range: '罗蒙诺索夫海岭、门捷列夫海岭及北方海航道。主张拥有约120万平方公里的北冰洋大陆架开发权。',
                    basis: '地质延伸原则。俄方认为罗蒙诺索夫海岭是西伯利亚大陆架的自然延伸。2007年俄科考队曾在北极点4000米深的海底插上一面钛合金国旗宣示主权。此外，俄罗斯将"北方海航道"视为其国内内水，加强军事与经济管控。'
                },
                {
                    country: '加拿大',
                    range: '罗蒙诺索夫海岭及西北航道。主张其大陆架延伸至北极点。',
                    basis: '地质延伸与历史水域。加拿大声称罗蒙诺索夫海岭是其埃尔斯米尔岛的延伸。同时，加拿大坚称通过其北极群岛的"西北航道"属于加拿大内水，外国船只通过需经其批准。'
                },
                {
                    country: '丹麦（格陵兰）',
                    range: '罗蒙诺索夫海岭及北极点周边约90万平方公里区域。',
                    basis: '地质相连原则。丹麦依据其海外自治领地格陵兰岛，收集地质数据证明罗蒙诺索夫海岭在地理上与格陵兰岛相连，以此宣称对北极点及大片海床拥有主权权利。（注：2022年，丹麦与加拿大达成协议，和平分割了争执半个世纪的汉斯岛）。'
                },
                {
                    country: '挪威',
                    range: '巴伦支海及北冰洋部分大陆架，拥有斯瓦尔巴群岛主权。',
                    basis: '海洋法与双边协定。2006年向联合国提出大陆架延伸申请。2010年与俄罗斯通过谈判解决了巴伦支海划界争端。根据1920年《斯匹次卑尔根群岛条约》，挪威拥有该群岛主权，但缔约国享有平等的经济开发权。'
                },
                {
                    country: '美国（阿拉斯加）',
                    range: '阿拉斯加北部延伸大陆架，主张航行自由。',
                    basis: '国家安全与航行自由。美国虽未批准《联合国海洋法公约》，但仍依据习惯国际法主张专属经济区和大陆架。美国强烈反对加拿大和俄罗斯将关键航道视为"内水"，坚持西北航道和北方海航道为"国际海峡"，享有无害通过权。'
                }
            ],
            nonArcticPositions: [
                {
                    country: '中国',
                    stance: `在2018年发布的《中国的北极政策》白皮书中，中国明确自身在地缘上是**"近北极国家"**（Near-Arctic State），是北极事务的重要利益攸关方。中国尊重北极国家在国际法下享有的主权、主权权利和管辖权，同时主张非北极国家依法在北冰洋公海享有航行、飞越、科研、捕鱼和铺设海底电缆等权利。中国倡导共建"冰上丝绸之路"，坚持"认识北极、保护北极、利用北极和参与治理北极"。`
                },
                {
                    country: '欧盟与日韩等国',
                    stance: '整体持"利益攸关方"立场。日本与韩国高度关注北极航道（相较于传统苏伊士运河航线可大幅缩短欧亚航程）带来的商业物流价值；欧盟则极其强调北极的生态脆弱性、气候变化影响以及可持续发展，呼吁加强多边治理机制。'
                }
            ]
        };
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
.custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.3);
    border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(59, 130, 246, 0.5);
}
</style>
