/**
 * 气象风险评估工具
 * 统一的风险评估标准，用于地图和表格
 */

/**
 * 计算蒲福风级
 * @param {number} windSpeed - 风速 (m/s)
 * @returns {number} 蒲福风级 (0-12)
 */
export function calculateBeaufortScale(windSpeed) {
    if (!windSpeed || windSpeed < 0) return 0;
    return Math.round(Math.pow(windSpeed / 0.836, 2/3));
}

/**
 * 默认风险阈值（采矿船标准）
 */
export const DEFAULT_THRESHOLDS = {
    safe: {
        windBeaufort: 8,      // < 8级风
        waveHeight: 3,        // ≤ 3m
        visibility: 2000,     // > 2000m
        swellHeight: 3,       // ≤ 3m
        oceanSpeed: 2         // ≤ 2 m/s
    },
    caution: {
        windBeaufort: 9,      // 8级风
        waveHeight: 4,        // 3-4m
        visibility: 1000,     // 1000-2000m
        swellHeight: 4,       // 3-4m
        oceanSpeed: 3         // 2-3 m/s
    },
    warning: {
        windBeaufort: 10,     // 9级风
        waveHeight: 6,        // 4-6m
        visibility: 500,      // 500-1000m
        swellHeight: 6,       // 4-6m
        oceanSpeed: 4         // > 3 m/s
    },
    danger: {
        windBeaufort: 11,     // > 10级风
        waveHeight: 8,        // > 6m
        visibility: 200,      // < 500m
        swellHeight: 8,       // > 6m
        oceanSpeed: 5         // 极强海流
    }
};

/**
 * 计算综合风险等级（采矿船标准）
 * @param {Object} weather - 气象数据
 * @param {Object} thresholds - 自定义阈值（可选）
 * @returns {Object} { level, color, description, beaufort, factors }
 */
export function calculateRiskLevel(weather, thresholds) {
    if (!weather) {
        return { 
            level: 'unknown', 
            color: '#808080', 
            description: '无数据',
            beaufort: 0,
            factors: []
        };
    }
    
    // 使用自定义阈值或默认阈值
    const t = thresholds || DEFAULT_THRESHOLDS;
    
    const windSpeed = weather.windspeed || 0;
    const waveHeight = weather.waveheight || 0;
    const visibility = weather.visibility || 10000;
    const swellHeight = weather.swellheight || 0;
    const oceanSpeed = weather.oceanspeed || 0;
    
    // 风速转换为蒲福风级
    const beaufort = calculateBeaufortScale(windSpeed);
    
    // 收集风险因素
    const factors = [];
    let baseLevel = 'safe';
    
    // 主要指标评估
    if (beaufort >= t.danger.windBeaufort) {
        baseLevel = 'danger';
        factors.push(`${beaufort}级强风`);
    } else if (beaufort >= t.warning.windBeaufort) {
        baseLevel = 'warning';
        factors.push(`${beaufort}级大风`);
    } else if (beaufort >= t.caution.windBeaufort) {
        baseLevel = 'caution';
        factors.push(`${beaufort}级风`);
    }
    
    if (waveHeight > t.warning.waveHeight) {
        if (baseLevel === 'safe' || baseLevel === 'caution') baseLevel = 'warning';
        if (waveHeight > t.danger.waveHeight) baseLevel = 'danger';
        factors.push(`${waveHeight.toFixed(1)}m浪高`);
    } else if (waveHeight > t.caution.waveHeight) {
        if (baseLevel === 'safe') baseLevel = 'caution';
        factors.push(`${waveHeight.toFixed(1)}m浪高`);
    }
    
    if (visibility < t.danger.visibility) {
        baseLevel = 'danger';
        factors.push(`能见度${visibility.toFixed(0)}m`);
    } else if (visibility < t.warning.visibility) {
        if (baseLevel === 'safe' || baseLevel === 'caution') baseLevel = 'warning';
        factors.push(`能见度低`);
    } else if (visibility < t.caution.visibility) {
        if (baseLevel === 'safe') baseLevel = 'caution';
    }
    
    // 辅助指标（提升风险等级）
    if (swellHeight > t.caution.swellHeight) {
        factors.push(`${swellHeight.toFixed(1)}m涌高`);
        // 涌高过大，风险等级提升
        if (swellHeight > t.warning.swellHeight && baseLevel === 'caution') {
            baseLevel = 'warning';
        }
    }
    
    if (oceanSpeed > t.caution.oceanSpeed) {
        factors.push(`${oceanSpeed.toFixed(1)}m/s海流`);
        // 强海流，风险等级提升
        if (oceanSpeed > t.warning.oceanSpeed && baseLevel === 'caution') {
            baseLevel = 'warning';
        }
    }
    
    // 生成描述
    const levelNames = {
        'safe': '安全',
        'caution': '注意',
        'warning': '警告',
        'danger': '危险'
    };
    
    const description = factors.length > 0 
        ? `${levelNames[baseLevel]} (${factors.join(', ')})`
        : `${levelNames[baseLevel]} (${beaufort}级风, ${waveHeight.toFixed(1)}m浪)`;
    
    // 返回结果
    const colors = {
        'safe': '#2ECC71',
        'caution': '#F1C40F',
        'warning': '#F39C12',
        'danger': '#E74C3C'
    };
    
    return {
        level: baseLevel,
        color: colors[baseLevel],
        description,
        beaufort,
        factors
    };
}

/**
 * 获取风险等级对应的CSS类名
 * @param {string} level - 风险等级 'safe'|'caution'|'warning'|'danger'
 * @returns {Object} { textClass, bgClass }
 */
export function getRiskClasses(level) {
    const classMap = {
        'safe': {
            textClass: 'text-slate-900',
            bgClass: 'bg-[#2ECC71]/90'
        },
        'caution': {
            textClass: 'text-slate-900',
            bgClass: 'bg-[#F1C40F]/90'
        },
        'warning': {
            textClass: 'text-white',
            bgClass: 'bg-[#F39C12]/90'
        },
        'danger': {
            textClass: 'text-white',
            bgClass: 'bg-[#E74C3C]/90'
        },
        'unknown': {
            textClass: 'text-slate-400',
            bgClass: 'bg-slate-800/30'
        }
    };
    
    return classMap[level] || classMap['unknown'];
}

/**
 * 获取风速对应的风险等级（仅基于风速）
 * @param {number} windSpeed - 风速 (m/s)
 * @param {Object} thresholds - 自定义阈值（可选）
 * @returns {string} 风险等级
 */
export function getWindSpeedRiskLevel(windSpeed, thresholds) {
    const t = thresholds || DEFAULT_THRESHOLDS;
    const beaufort = calculateBeaufortScale(windSpeed);
    
    if (beaufort >= t.danger.windBeaufort) return 'danger';
    if (beaufort >= t.warning.windBeaufort) return 'warning';
    if (beaufort >= t.caution.windBeaufort) return 'caution';
    return 'safe';
}

/**
 * 获取浪高对应的风险等级（仅基于浪高）
 * @param {number} waveHeight - 浪高 (m)
 * @param {Object} thresholds - 自定义阈值（可选）
 * @returns {string} 风险等级
 */
export function getWaveHeightRiskLevel(waveHeight, thresholds) {
    if (!waveHeight) return 'safe';
    
    const t = thresholds || DEFAULT_THRESHOLDS;
    
    if (waveHeight > t.warning.waveHeight) {
        if (waveHeight > t.danger.waveHeight) return 'danger';
        return 'warning';
    }
    if (waveHeight > t.caution.waveHeight) return 'caution';
    return 'safe';
}

/**
 * 蒲福风级描述
 */
export const BEAUFORT_SCALE = {
    0: { name: '无风', description: '烟直上' },
    1: { name: '软风', description: '烟示风向' },
    2: { name: '轻风', description: '感觉有风' },
    3: { name: '微风', description: '旌旗展开' },
    4: { name: '和风', description: '吹起尘土' },
    5: { name: '清劲风', description: '小树摇摆' },
    6: { name: '强风', description: '电线有声' },
    7: { name: '疾风', description: '步行困难' },
    8: { name: '大风', description: '折毁树枝' },
    9: { name: '烈风', description: '小损房屋' },
    10: { name: '狂风', description: '拔起树木' },
    11: { name: '暴风', description: '损毁普遍' },
    12: { name: '飓风', description: '摧毁巨大' }
};
