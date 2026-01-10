<template>
    <div class="weather-row">
        <!-- 右侧：数值网格 -->
        <div class="row-values">
            <div 
                v-for="(value, index) in values" 
                :key="index"
                :class="['value-cell', { active: index === currentTimeIndex }]"
                :style="{ backgroundColor: getColor(value) }"
            >
                <!-- 数值 -->
                <span class="value">{{ formatValue(value) }}</span>
                <span class="unit">{{ unit }}</span>
                
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
    border-bottom: 1px solid rgba(100, 100, 100, 0.3);
    min-height: 50px;
}

.row-values {
    flex: 1;
    display: flex;
    overflow-x: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(100, 100, 100, 0.5) transparent;
}

.row-values::-webkit-scrollbar {
    height: 6px;
}

.row-values::-webkit-scrollbar-track {
    background: transparent;
}

.row-values::-webkit-scrollbar-thumb {
    background: rgba(100, 100, 100, 0.5);
    border-radius: 3px;
}

.value-cell {
    min-width: 60px;
    width: 76px;
    flex-shrink: 0;
    padding: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
    transition: all 0.2s;
}

.value-cell.active {
    border: 2px solid #00d4ff;
    box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
    z-index: 1;
}

.value-cell:hover {
    transform: scale(1.05);
    z-index: 2;
}

.value {
    font-size: 16px;
    font-weight: bold;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    font-family: 'Rajdhani', monospace;
}

.unit {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.7);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.direction-arrow {
    font-size: 16px;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    transition: transform 0.3s;
}
</style>
