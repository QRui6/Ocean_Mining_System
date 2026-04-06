<template>
    <transition name="slide-fade">
        <div v-if="show" class="absolute left-6 top-[10rem] w-[22rem] z-40 pointer-events-auto overflow-visible flex flex-col"
             style="background-color: var(--panel-bg); backdrop-filter: blur(20px); border: 2px solid var(--border-primary); box-shadow: var(--shadow-glow); clip-path: polygon(0 0, 100% 0, 100% 96%, 94% 100%, 0 100%);">
            
            <!-- Header -->
            <div class="flex items-center justify-between px-5 py-3.5 border-b-2" style="background: linear-gradient(to right, var(--accent-cyan-glow), transparent); border-color: var(--border-primary);">
                <div class="flex items-center gap-3">
                    <div class="w-1.5 h-7" style="background-color: var(--accent-yellow); box-shadow: 0 0 8px var(--accent-yellow);"></div>
                    <span class="text-xl font-bold tracking-wide" style="color: var(--text-primary); text-shadow: 0 0 10px rgba(6, 182, 212, 0.3);">资源目录</span>
                </div>
                <span class="text-xs opacity-70 font-['Rajdhani'] tracking-wider" style="color: var(--text-secondary);">SURVEY SYSTEM</span>
            </div>
            
            <!-- Content -->
            <div class="p-5 space-y-4">
                <!-- 所属国家 -->
                <div class="survey-category">
                    <div class="category-header">
                        <div class="flex items-center gap-2">
                            <div class="w-1 h-5" style="background: linear-gradient(to bottom, var(--accent-cyan), var(--accent-purple));"></div>
                            <span>国家</span>
                        </div>
                    </div>
                    <div class="category-content">
                        <div class="flex flex-wrap gap-2">
                            <button v-for="country in countries" :key="country.id"
                                    class="country-tag-btn"
                                    :class="{ 'active': country.active }"
                                    @click="toggleCountry(country)">
                                {{ country.label }}
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- 基础地质图 -->
                <div class="survey-category">
                    <div class="category-header collapsible" @click="toggleBasicGeologyPanel">
                        <div class="flex items-center gap-2">
                            <div class="w-1 h-5" style="background: linear-gradient(to bottom, var(--accent-cyan), var(--accent-purple));"></div>
                            <span>基础地质调查</span>
                        </div>
                        <svg
                            class="collapse-arrow"
                            :class="{ 'expanded': showBasicGeologyPanel }"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                    <transition name="expand-fade">
                    <div v-if="showBasicGeologyPanel" class="category-content">
                        <div v-for="item in basicGeologyLayers" :key="item.id" 
                             class="layer-item"
                             :class="{ 'active': item.active }"
                             @click="toggleLayer(item)">
                            <div class="layer-checkbox">
                                <div v-if="item.active" class="checkbox-checked">
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                                    </svg>
                                </div>
                            </div>
                            <div class="layer-info">
                                <div class="layer-name">{{ item.label }}</div>
                                <div class="layer-meta">
                                    <span class="scale-badge">{{ item.scale }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    </transition>
                </div>

                <!-- 海洋空间规划与行政区域管辖 -->
                <div class="survey-category">
                    <div class="category-header collapsible" @click="toggleMarineSpatialPanel">
                        <div class="flex items-center gap-2">
                            <div class="w-1 h-5" style="background: linear-gradient(to bottom, #22c55e, #38bdf8);"></div>
                            <span>海洋空间规划与行政区域管辖</span>
                        </div>
                        <svg
                            class="collapse-arrow"
                            :class="{ 'expanded': showMarineSpatialPanel }"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                    <transition name="expand-fade">
                        <div v-if="showMarineSpatialPanel" class="category-content">
                            <div v-for="item in marineSpatialLayers" :key="item.id"
                                 class="layer-item compact"
                                 :class="{ 'active': item.active }"
                                 @click="toggleLayer(item)">
                                <div class="layer-checkbox">
                                    <div v-if="item.active" class="checkbox-checked">
                                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                                        </svg>
                                    </div>
                                </div>
                                <div class="layer-info">
                                    <div class="layer-name">{{ item.label }}</div>
                                </div>
                            </div>
                        </div>
                    </transition>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
import { ref } from 'vue';

export default {
    props: {
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['layerToggle', 'countryToggle'],
    setup(props, { emit }) {
        const countries = ref([
            { id: 'country_china', label: '中国', active: false },
            { id: 'country_usa', label: '美国', active: false },
            { id: 'country_uk', label: '英国', active: false },
            { id: 'country_japan', label: '日本', active: false },
            { id: 'country_russia', label: '俄罗斯', active: false },
            { id: 'country_france', label: '法国', active: false },
            { id: 'country_germany', label: '德国', active: false },
            { id: 'country_belgium', label: '比利时', active: false },
            { id: 'country_australia', label: '澳大利亚', active: false }
        ]);
        
        const basicGeologyLayers = ref([
            { id: 'geo_1m', label: '1:100万地质图', scale: '1:100万', active: false },
            { id: 'geo_50w', label: '1:50万地质图', scale: '1:50万', active: false },
            { id: 'geo_25w', label: '1:25万地质图', scale: '1:25万', active: false },
            { id: 'geo_5w', label: '1:5万地质图', scale: '1:5万', active: false }
        ]);

        const marineSpatialLayers = ref([
            { id: 'marine_shelf_boundary', label: '大陆架边界', active: false },
            { id: 'marine_zone_boundary', label: '区界', active: false },
            { id: 'marine_main_route', label: '主要航道', active: false }
        ]);

        const showBasicGeologyPanel = ref(true);
        const showMarineSpatialPanel = ref(false);
        
        const toggleCountry = (country) => {
            country.active = !country.active;
            emit('countryToggle', country);
        };
        
        const toggleLayer = (layer) => {
            layer.active = !layer.active;
            emit('layerToggle', layer);
        };

        const toggleMarineSpatialPanel = () => {
            showMarineSpatialPanel.value = !showMarineSpatialPanel.value;
        };

        const toggleBasicGeologyPanel = () => {
            showBasicGeologyPanel.value = !showBasicGeologyPanel.value;
        };
        
        return {
            countries,
            basicGeologyLayers,
            marineSpatialLayers,
            showBasicGeologyPanel,
            showMarineSpatialPanel,
            toggleCountry,
            toggleLayer,
            toggleBasicGeologyPanel,
            toggleMarineSpatialPanel
        };
    }
};
</script>

<style scoped>
.survey-category {
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid var(--border-secondary);
    background: rgba(0, 0, 0, 0.15);
}

.category-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(168, 85, 247, 0.08));
    border-bottom: 1px solid var(--border-secondary);
}

.category-header span {
    color: var(--text-primary);
    font-weight: 700;
    font-size: 1.0625rem;
    letter-spacing: 0.02em;
}

.category-header.collapsible {
    cursor: pointer;
    transition: background 0.25s ease;
}

.category-header.collapsible:hover {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(56, 189, 248, 0.12));
}

.collapse-arrow {
    width: 1rem;
    height: 1rem;
    color: var(--text-secondary);
    transition: transform 0.25s ease, color 0.25s ease;
}

.collapse-arrow.expanded {
    transform: rotate(180deg);
    color: var(--accent-cyan);
}

.category-content {
    padding: 1rem;
}

/* 国家标签按钮 - 黄色标签样式（与矿区查询面板一致） */
.country-tag-btn {
    padding: 0.5rem 0.875rem;
    border-radius: 4px;
    border: 1px solid rgba(100, 116, 139, 0.5);
    background: rgba(51, 65, 85, 0.8);
    color: #ffffff;  /* 改为亮白色 */
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.country-tag-btn:hover {
    background: rgba(71, 85, 105, 0.9);
    border-color: rgba(148, 163, 184, 0.6);
    color: #ffffff;  /* 保持亮白色 */
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.country-tag-btn.active {
    background: #facc15;
    color: #000000;
    font-weight: 700;
    border-color: #fbbf24;
    box-shadow: 0 0 12px rgba(250, 204, 21, 0.5), 0 4px 8px rgba(0, 0, 0, 0.3);
}

.country-tag-btn.active:hover {
    background: #fbbf24;
    box-shadow: 0 0 16px rgba(250, 204, 21, 0.6), 0 6px 12px rgba(0, 0, 0, 0.4);
}

/* 图层项 - 美化版 */
.layer-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.875rem 1rem;
    margin-bottom: 0.625rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1.5px solid transparent;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01));
}

.layer-item:last-child {
    margin-bottom: 0;
}

.layer-item.compact {
    padding: 0.75rem 0.9rem;
}

.layer-item:hover {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
    border-color: var(--border-primary);
    transform: translateX(4px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.layer-item.active {
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(168, 85, 247, 0.1));
    border-color: var(--accent-cyan);
    box-shadow: 0 0 15px rgba(6, 182, 212, 0.2), inset 0 0 15px rgba(6, 182, 212, 0.05);
}

.layer-checkbox {
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid var(--border-primary);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.3s;
    background: rgba(0, 0, 0, 0.2);
}

.layer-item:hover .layer-checkbox {
    border-color: var(--accent-cyan);
}

.layer-item.active .layer-checkbox {
    border-color: var(--accent-cyan);
    background: var(--accent-cyan);
    box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
}

.checkbox-checked {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}

.layer-info {
    flex: 1;
    min-width: 0;
}

.layer-name {
    font-size: 1rem;
    color: var(--text-primary);
    margin-bottom: 0.375rem;
    font-weight: 500;
    letter-spacing: 0.01em;
}

.layer-meta {
    display: flex;
    gap: 0.5rem;
}

.scale-badge {
    padding: 0.25rem 0.625rem;
    border-radius: 4px;
    background: linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(168, 85, 247, 0.2));
    color: #e9d5ff;
    font-weight: 600;
    font-size: 0.8125rem;
    border: 1px solid rgba(168, 85, 247, 0.4);
    box-shadow: 0 2px 4px rgba(168, 85, 247, 0.1);
}

/* 滑入动画 */
.slide-fade-enter-active {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-enter-from {
    transform: translateX(-30px);
    opacity: 0;
}

.slide-fade-leave-to {
    transform: translateX(-30px);
    opacity: 0;
}

.expand-fade-enter-active,
.expand-fade-leave-active {
    transition: all 0.25s ease;
    overflow: hidden;
}

.expand-fade-enter-from,
.expand-fade-leave-to {
    opacity: 0;
    max-height: 0;
}

.expand-fade-enter-to,
.expand-fade-leave-from {
    opacity: 1;
    max-height: 260px;
}
</style>
