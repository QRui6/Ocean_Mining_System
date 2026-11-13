<template>
    <div class="weather-row">
        <!-- 左侧：标签（气象名称 + 单位） -->
        <div class="row-label">
            <div class="label-text">
                <div class="label-name">{{ label }}</div>
                <div class="label-unit">{{ unit }}</div>
            </div>
        </div>
        
        <!-- 右侧：数值网格 -->
        <div class="row-values">
            <div 
                v-for="(value, index) in values" 
                :key="index"
                :class="['value-cell', { active: index === currentTimeIndex }]"
                :style="{ backgroundColor: getColor(value) }"
            >
                <!-- 数值（不带单位） -->
                <span class="value">{{ formatValue(value) }}</span>
                
                <!-- 风向箭头（可选） -->
                <span 
                    v-if="showDirection && directions && directions[index] !== null"
                    class="direction-arrow"
                    :style="{ transform: `rotate(${directions[index]}deg)` }"
                >
                    ↑
                </span>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        icon: String,
        label: String,
        values: Array,
        unit: String,
        colorMap: Array, // [{ value: 0, color: '#0000ff' }, ...]
        showDirection: {
            type: Boolean,
            default: false
        },
        directions: {
            type: Array,
            default: () => []
        },
        currentTimeIndex: {
            type: Number,
            default: 0
        }
    },
    
    methods: {
        getColor(value) {
            if (value === null || value === undefined) return 'rgba(50, 50, 50, 0.5)';
            
            if (!this.colorMap || this.colorMap.length === 0) {
                return 'rgba(100, 100, 100, 0.8)';
            }
            
            // 根据 colorMap 插值计算颜色
            for (let i = 0; i < this.colorMap.length - 1; i++) {
                const curr = this.colorMap[i];
                const next = this.colorMap[i + 1];
                
                if (value >= curr.value && value <= next.value) {
                    // 线性插值
                    const ratio = (value - curr.value) / (next.value - curr.value);
                    return this.interpolateColor(curr.color, next.color, ratio);
                }
            }
            
            // 超出范围，使用最后一个颜色
            if (value > this.colorMap[this.colorMap.length - 1].value) {
                return this.colorMap[this.colorMap.length - 1].color;
            }
            
            return this.colorMap[0].color;
        },
        
        interpolateColor(color1, color2, ratio) {
            // RGB 插值
            const c1 = this.hexToRgb(color1);
            const c2 = this.hexToRgb(color2);
            
            const r = Math.round(c1.r + (c2.r - c1.r) * ratio);
            const g = Math.round(c1.g + (c2.g - c1.g) * ratio);
            const b = Math.round(c1.b + (c2.b - c1.b) * ratio);
            
            return `rgb(${r}, ${g}, ${b})`;
        },
        
        hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : { r: 0, g: 0, b: 0 };
        },
        
        formatValue(value) {
            if (value === null || value === undefined) return 'N/A';
            return value.toFixed(1);
        }
    }
};
</script>

<style scoped>
.weather-row {
    display: flex;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    height: 42px;
}

/* 左侧标签 */
.row-label {
    width: 100px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding: 0 12px;
    background: rgba(25, 25, 35, 0.8);
    border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.label-text {
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.label-name {
    font-size: 14px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.95);
    line-height: 1;
}

.label-unit {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1;
}

/* 右侧数值网格 */
.row-values {
    flex: 1;
    display: flex;
    overflow-x: auto;
    scrollbar-width: none;
}

.row-values::-webkit-scrollbar {
    display: none;
}

.value-cell {
    width: 32px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-right: 1px solid rgba(255, 255, 255, 0.03);
    position: relative;
    transition: all 0.15s;
}

.value-cell.active::after {
    content: '';
    position: absolute;
    inset: 0;
    border: 2px solid #00d4ff;
    pointer-events: none;
    z-index: 1;
}

.value-cell:hover {
    filter: brightness(1.2);
}

.value {
    font-size: 13px;
    font-weight: 600;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    font-family: 'Rajdhani', monospace;
}

.direction-arrow {
    position: absolute;
    top: 2px;
    right: 2px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.9);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    transition: transform 0.3s;
}
</style>
