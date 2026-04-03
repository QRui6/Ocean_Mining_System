export const MINERAL_IMPORT_CATEGORIES = [
    {
        id: 'energy_resources',
        label: '能源资源',
        color: '#F59E0B',
        items: [
            { id: 'import_oil', label: '石油', color: '#F97316' },
            { id: 'import_lng', label: '液化天然气', color: '#06B6D4' },
            { id: 'import_coal', label: '煤炭', color: '#4B5563' }
        ]
    },
    {
        id: 'metal_minerals',
        label: '金属矿产',
        color: '#A3A3A3',
        items: [
            { id: 'import_iron_ore', label: '铁矿石', color: '#94A3B8' },
            { id: 'import_copper_concentrate', label: '铜精矿', color: '#D97706' },
            { id: 'import_nickel_concentrate', label: '镍矿', color: '#22C55E' },
            { id: 'import_manganese_ore', label: '锰矿', color: '#3B82F6' }
        ]
    },
    {
        id: 'grain',
        label: '粮食',
        color: '#22C55E',
        items: [
            { id: 'import_soybean', label: '大豆', color: '#84CC16' },
            { id: 'import_barley', label: '大麦', color: '#EAB308' },
            { id: 'import_sorghum', label: '高粱', color: '#FB923C' },
            { id: 'import_rice', label: '稻米', color: '#10B981' },
            { id: 'import_wheat', label: '小麦', color: '#FACC15' },
            { id: 'import_corn', label: '玉米', color: '#F59E0B' }
        ]
    }
];

export const MINERAL_IMPORT_COUNTRY_ALIAS = {
    '俄罗斯': '俄罗斯联邦',
    '蒙古国': '蒙古',
    '阿拉伯联合酋长国': '阿联酋'
};

export const MINERAL_IMPORT_COUNTRY_ALPHA2 = {
    '阿根廷': 'AR',
    '阿联酋': 'AE',
    '阿曼': 'OM',
    '安哥拉': 'AO',
    '澳大利亚': 'AU',
    '巴西': 'BR',
    '秘鲁': 'PE',
    '缅甸': 'MM',
    '法国': 'FR',
    '菲律宾': 'PH',
    '刚果(金)': 'CD',
    '加蓬': 'GA',
    '加纳': 'GH',
    '加拿大': 'CA',
    '哈萨克斯坦': 'KZ',
    '卡塔尔': 'QA',
    '科威特': 'KW',
    '马来西亚': 'MY',
    '蒙古': 'MN',
    '墨西哥': 'MX',
    '美国': 'US',
    '南非': 'ZA',
    '俄罗斯联邦': 'RU',
    '塞尔维亚': 'RS',
    '塞拉利昂': 'SL',
    '沙特阿拉伯': 'SA',
    '泰国': 'TH',
    '乌克兰': 'UA',
    '印度': 'IN',
    '印度尼西亚': 'ID',
    '伊拉克': 'IQ',
    '越南': 'VN',
    '智利': 'CL'
};

export const MINERAL_IMPORT_DATA_RULES = {
    source_exact: '原文直接给出',
    derived: '由原文信息换算、转述或按合计关系表达'
};

export const MINERAL_IMPORT_VALIDATION_CHECKLIST = [
    'summary 提到的 top N 与当前 sources 明细数量保持一致，或在 summary 中明确说明材料未给出全部国别明细。',
    '名称与材料一致，例如“镍矿”“石油”。',
    '没有原文直接给出的来源国占比时，不自动补填 share。'
];

export const MINERAL_IMPORT_DATA = {
    import_copper_concentrate: {
        id: 'import_copper_concentrate',
        label: '铜精矿',
        color: '#D97706',
        categoryId: 'metal_minerals',
        totalImport: '2855.61万实物吨',
        yoy: '+6.74%',
        summary: '前十大来源国占比超过90%，供应高度集中，俄罗斯、加拿大、蒙古增势明显。',
        validation: {
            summarySourceCount: 10
        },
        sources: [
            { country: '智利', volume: '963.99', unit: '万实物吨', volumeType: 'source_exact', share: '33.76%', shareType: 'source_exact', yoy: '+4.39%' },
            { country: '秘鲁', volume: '742.17', unit: '万实物吨', volumeType: 'source_exact', share: '25.99%', shareType: 'source_exact', yoy: '+6.12%' },
            { country: '蒙古', volume: '207.34', unit: '万实物吨', volumeType: 'source_exact', share: '7.26%', shareType: 'source_exact', yoy: '+33.90%' },
            { country: '墨西哥', volume: '141.19', unit: '万实物吨', volumeType: 'source_exact', share: '4.94%', shareType: 'source_exact', yoy: '-4.14%' },
            { country: '哈萨克斯坦', volume: '135.99', unit: '万实物吨', volumeType: 'source_exact', share: '4.76%', shareType: 'source_exact', yoy: '-11.38%' },
            { country: '俄罗斯联邦', volume: '90.02', unit: '万实物吨', volumeType: 'source_exact', share: '3.15%', shareType: 'source_exact', yoy: '+117.89%' },
            { country: '刚果(金)', volume: '78.88', unit: '万实物吨', volumeType: 'source_exact', share: '2.76%', shareType: 'source_exact', yoy: '+25.98%' },
            { country: '塞尔维亚', volume: '71.43', unit: '万实物吨', volumeType: 'source_exact', share: '2.50%', shareType: 'source_exact', yoy: '-13.00%' },
            { country: '印度尼西亚', volume: '65.09', unit: '万实物吨', volumeType: 'source_exact', share: '2.28%', shareType: 'source_exact', yoy: '+18.27%' },
            { country: '加拿大', volume: '62.62', unit: '万实物吨', volumeType: 'source_exact', share: '2.19%', shareType: 'source_exact', yoy: '+68.15%' }
        ]
    },
    import_nickel_concentrate: {
        id: 'import_nickel_concentrate',
        label: '镍矿',
        color: '#22C55E',
        categoryId: 'metal_minerals',
        totalImport: '1.42亿吨',
        yoy: '+9.7%',
        summary: '来源高度集中，印尼占比接近七成且连续三年提升。',
        validation: {
            summarySourceCount: 2
        },
        sources: [
            { country: '印度尼西亚', volume: '9860', unit: '万吨', volumeType: 'source_exact', share: '69.4%', shareType: 'source_exact' },
            { country: '菲律宾', volume: '3120', unit: '万吨', volumeType: 'source_exact', share: '21.9%', shareType: 'source_exact' }
        ]
    },
    import_iron_ore: {
        id: 'import_iron_ore',
        label: '铁矿石',
        color: '#94A3B8',
        categoryId: 'metal_minerals',
        totalImport: '（文本未给出精确总量）',
        yoy: '',
        summary: '澳大利亚与巴西是两大核心供应国，两国合计超过10亿吨，占比超过80%。',
        validation: {
            summarySourceCount: 10
        },
        sources: [
            { country: '澳大利亚', volume: '两国合计超过10亿吨', unit: '', volumeType: 'derived', share: '', note: '原文仅给出澳大利亚与巴西合计进口量及合计占比，未提供澳大利亚单独进口量。' },
            { country: '巴西', volume: '两国合计超过10亿吨', unit: '', volumeType: 'derived', share: '', note: '原文仅给出巴西与澳大利亚合计进口量及合计占比，未提供巴西单独进口量。' },
            { country: '南非', volume: '第二梯队', unit: '', volumeType: 'source_exact', share: '' },
            { country: '印度', volume: '第二梯队', unit: '', volumeType: 'source_exact', share: '' },
            { country: '加拿大', volume: '第二梯队', unit: '', volumeType: 'source_exact', share: '' },
            { country: '秘鲁', volume: '第二梯队', unit: '', volumeType: 'source_exact', share: '' },
            { country: '阿曼', volume: '第二梯队', unit: '', volumeType: 'source_exact', share: '' },
            { country: '乌克兰', volume: '第二梯队', unit: '', volumeType: 'source_exact', share: '' },
            { country: '塞拉利昂', volume: '第二梯队', unit: '', volumeType: 'source_exact', share: '' },
            { country: '俄罗斯联邦', volume: '第二梯队', unit: '', volumeType: 'source_exact', share: '' }
        ]
    },
    import_manganese_ore: {
        id: 'import_manganese_ore',
        label: '锰矿',
        color: '#3B82F6',
        categoryId: 'metal_minerals',
        totalImport: '3284万吨',
        yoy: '+9.7%',
        summary: '南非、澳大利亚、加蓬和加纳是主要来源国；南非、加蓬、加纳近期相继预期出台出口限制政策，可能冲击供应稳定性。',
        validation: {
            summarySourceCount: 4
        },
        sources: [
            { country: '南非', volume: '1742', unit: '万吨', volumeType: 'source_exact', share: '53%', shareType: 'source_exact' },
            { country: '澳大利亚', volume: '358', unit: '万吨', volumeType: 'source_exact', share: '10.9%', shareType: 'source_exact' },
            { country: '加蓬', volume: '379', unit: '万吨', volumeType: 'source_exact', share: '', note: '提供材料同时给出“加蓬占比16.2%”，但该占比与3284万吨总量、379万吨进口量口径不一致，系统暂不直接展示该占比。' },
            { country: '加纳', volume: '', unit: '', volumeType: 'source_exact', share: '16.2%', shareType: 'source_exact', note: '提供材料仅给出占比16.2%，未给出加纳对应进口量。' }
        ]
    },
    import_coal: {
        id: 'import_coal',
        label: '煤炭',
        color: '#4B5563',
        categoryId: 'energy_resources',
        totalImport: '4.9亿吨',
        yoy: '-9.6%',
        summary: '印尼、俄罗斯、蒙古、澳大利亚四国合计约占95%，材料未逐一给出四国单独占比。',
        validation: {
            summarySourceCount: 4
        },
        sources: [
            { country: '印度尼西亚', volume: '21145', unit: '万吨', volumeType: 'source_exact', share: '' },
            { country: '俄罗斯联邦', volume: '8889', unit: '万吨', volumeType: 'source_exact', share: '' },
            { country: '蒙古', volume: '8896', unit: '万吨', volumeType: 'source_exact', share: '' },
            { country: '澳大利亚', volume: '7747', unit: '万吨', volumeType: 'source_exact', share: '' }
        ]
    },
    import_oil: {
        id: 'import_oil',
        label: '石油',
        color: '#F97316',
        categoryId: 'energy_resources',
        totalImport: '5.78亿吨',
        yoy: '+4.4%',
        summary: '当前材料列出前10大来源国进口量；另指出前11大来源国（单国超1000万吨）合计供应约88%，但未给出第11国明细。',
        validation: {
            summarySourceCount: 10
        },
        sources: [
            { country: '俄罗斯联邦', volume: '10072.4', unit: '万吨', volumeType: 'source_exact', share: '17.43%', shareType: 'source_exact' },
            { country: '沙特阿拉伯', volume: '8075.9', unit: '万吨', volumeType: 'source_exact', share: '' },
            { country: '伊拉克', volume: '6462.4', unit: '万吨', volumeType: 'source_exact', share: '' },
            { country: '马来西亚', volume: '6441.4', unit: '万吨', volumeType: 'source_exact', share: '' },
            { country: '巴西', volume: '4707.7', unit: '万吨', volumeType: 'source_exact', share: '' },
            { country: '阿联酋', volume: '3751.3', unit: '万吨', volumeType: 'source_exact', share: '' },
            { country: '阿曼', volume: '3535.3', unit: '万吨', volumeType: 'source_exact', share: '' },
            { country: '安哥拉', volume: '2975.8', unit: '万吨', volumeType: 'source_exact', share: '' },
            { country: '科威特', volume: '1902.2', unit: '万吨', volumeType: 'source_exact', share: '' },
            { country: '加拿大', volume: '1632.4', unit: '万吨', volumeType: 'source_exact', share: '' }
        ]
    },
    import_lng: {
        id: 'import_lng',
        label: '液化天然气',
        color: '#06B6D4',
        categoryId: 'energy_resources',
        totalImport: '6843万吨',
        yoy: '',
        summary: '澳大利亚、卡塔尔、俄罗斯三国合计占比72.5%。',
        validation: {
            summarySourceCount: 5
        },
        sources: [
            { country: '澳大利亚', volume: '2038.99', unit: '万吨', volumeType: 'source_exact', share: '29.80%', shareType: 'source_exact' },
            { country: '卡塔尔', volume: '1943.80', unit: '万吨', volumeType: 'source_exact', share: '28.40%', shareType: 'source_exact' },
            { country: '俄罗斯联邦', volume: '979.94', unit: '万吨', volumeType: 'source_exact', share: '14.32%', shareType: 'source_exact' },
            { country: '马来西亚', volume: '721.57', unit: '万吨', volumeType: 'source_exact', share: '10.54%', shareType: 'source_exact' },
            { country: '印度尼西亚', volume: '401.42', unit: '万吨', volumeType: 'source_exact', share: '5.87%', shareType: 'source_exact' }
        ]
    },
    import_soybean: {
        id: 'import_soybean',
        label: '大豆',
        color: '#84CC16',
        categoryId: 'grain',
        totalImport: '11181.9万吨',
        yoy: '',
        summary: '大豆占粮食总进口量约80%，来源集中于巴西、美国、阿根廷。',
        validation: {
            summarySourceCount: 3
        },
        sources: [
            { country: '巴西', volume: '8232.8', unit: '万吨', volumeType: 'source_exact', share: '73.6%', shareType: 'source_exact' },
            { country: '美国', volume: '1680.1', unit: '万吨', volumeType: 'source_exact', share: '15.0%', shareType: 'source_exact' },
            { country: '阿根廷', volume: '789.0', unit: '万吨', volumeType: 'source_exact', share: '7.1%', shareType: 'source_exact' }
        ]
    },
    import_barley: {
        id: 'import_barley',
        label: '大麦',
        color: '#EAB308',
        categoryId: 'grain',
        totalImport: '1042.3万吨',
        yoy: '',
        summary: '主要来自澳大利亚，其次为加拿大、法国。',
        validation: {
            summarySourceCount: 3
        },
        sources: [
            { country: '澳大利亚', volume: '592.3', unit: '万吨', volumeType: 'source_exact', share: '56.8%', shareType: 'source_exact' },
            { country: '加拿大', volume: '主要来源（未给出具体量）', unit: '', volumeType: 'source_exact', share: '' },
            { country: '法国', volume: '主要来源（未给出具体量）', unit: '', volumeType: 'source_exact', share: '' }
        ]
    },
    import_sorghum: {
        id: 'import_sorghum',
        label: '高粱',
        color: '#FB923C',
        categoryId: 'grain',
        totalImport: '454.4万吨',
        yoy: '',
        summary: '进口高度集中在澳大利亚与阿根廷。',
        validation: {
            summarySourceCount: 2
        },
        sources: [
            { country: '澳大利亚', volume: '220.8', unit: '万吨', volumeType: 'source_exact', share: '48.6%', shareType: 'source_exact' },
            { country: '阿根廷', volume: '152.6', unit: '万吨', volumeType: 'source_exact', share: '33.6%', shareType: 'source_exact' }
        ]
    },
    import_rice: {
        id: 'import_rice',
        label: '稻米',
        color: '#10B981',
        categoryId: 'grain',
        totalImport: '310.2万吨',
        yoy: '',
        summary: '主要来源为缅甸、越南、泰国。',
        validation: {
            summarySourceCount: 3
        },
        sources: [
            { country: '缅甸', volume: '104.3', unit: '万吨', volumeType: 'source_exact', share: '33.6%', shareType: 'source_exact' },
            { country: '越南', volume: '71.6', unit: '万吨', volumeType: 'source_exact', share: '23.1%', shareType: 'source_exact' },
            { country: '泰国', volume: '68.0', unit: '万吨', volumeType: 'source_exact', share: '21.9%', shareType: 'source_exact' }
        ]
    },
    import_wheat: {
        id: 'import_wheat',
        label: '小麦',
        color: '#FACC15',
        categoryId: 'grain',
        totalImport: '385.1万吨',
        yoy: '',
        summary: '来源高度集中于加拿大和澳大利亚。',
        validation: {
            summarySourceCount: 2
        },
        sources: [
            { country: '加拿大', volume: '271.3', unit: '万吨', volumeType: 'source_exact', share: '70.4%', shareType: 'source_exact' },
            { country: '澳大利亚', volume: '102.1', unit: '万吨', volumeType: 'source_exact', share: '26.5%', shareType: 'source_exact' }
        ]
    },
    import_corn: {
        id: 'import_corn',
        label: '玉米',
        color: '#F59E0B',
        categoryId: 'grain',
        totalImport: '264.8万吨',
        yoy: '',
        summary: '巴西占比超过六成，其次为俄罗斯、缅甸。',
        validation: {
            summarySourceCount: 3
        },
        sources: [
            { country: '巴西', volume: '160.7', unit: '万吨', volumeType: 'source_exact', share: '60.7%', shareType: 'source_exact' },
            { country: '俄罗斯联邦', volume: '主要来源（未给出具体量）', unit: '', volumeType: 'source_exact', share: '' },
            { country: '缅甸', volume: '主要来源（未给出具体量）', unit: '', volumeType: 'source_exact', share: '' }
        ]
    }
};

export function getAllMineralImportCommodityIds() {
    return MINERAL_IMPORT_CATEGORIES.flatMap(category => category.items.map(item => item.id));
}

export function normalizeMineralImportCountryName(countryName) {
    const normalized = String(countryName || '').trim();
    return MINERAL_IMPORT_COUNTRY_ALIAS[normalized] || normalized;
}

export function getMineralImportCountryAlpha2(countryName) {
    const normalized = normalizeMineralImportCountryName(countryName);
    return MINERAL_IMPORT_COUNTRY_ALPHA2[normalized] || '';
}

export function getMineralImportCountryFlagUrl(countryName, size = 40) {
    const alpha2 = getMineralImportCountryAlpha2(countryName);
    if (!alpha2) return '';
    return `https://flagcdn.com/w${size}/${alpha2.toLowerCase()}.png`;
}

export function getMineralImportById(commodityId) {
    return MINERAL_IMPORT_DATA[commodityId] || null;
}

export function getMineralImportCategoryById(categoryId) {
    return MINERAL_IMPORT_CATEGORIES.find(category => category.id === categoryId) || null;
}

export function getMineralImportCommodityColor(commodityId) {
    const dataColor = MINERAL_IMPORT_DATA[commodityId]?.color;
    if (dataColor) return dataColor;

    for (const category of MINERAL_IMPORT_CATEGORIES) {
        const item = category.items.find(entry => entry.id === commodityId);
        if (item?.color) return item.color;
        if (item) return category.color;
    }
    return '#0EA5E9';
}

export function validateMineralImportData() {
    const issues = [];

    Object.values(MINERAL_IMPORT_DATA).forEach((item) => {
        if (item.validation?.summarySourceCount != null && Array.isArray(item.sources)) {
            if (item.sources.length !== item.validation.summarySourceCount) {
                issues.push(`${item.id}: sources 数量 ${item.sources.length} 与 summarySourceCount ${item.validation.summarySourceCount} 不一致`);
            }
        }

        if (Array.isArray(item.sources)) {
            item.sources.forEach((source, index) => {
                if (source.share && !source.shareType) {
                    issues.push(`${item.id}: source[${index}] 存在 share 但未标注 shareType`);
                }
                if (source.volume && !source.volumeType) {
                    issues.push(`${item.id}: source[${index}] 存在 volume 但未标注 volumeType`);
                }
                if (!source.share && source.shareType === 'derived') {
                    issues.push(`${item.id}: source[${index}] 标注了 derived shareType 但没有展示 share 值`);
                }
            });
        }
    });

    return issues;
}
