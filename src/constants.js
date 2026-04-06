
export const APP_TITLE = "海洋地质调查信息监测与管理平台";

// 0. 资源分布类型（新增）
export const RESOURCE_TYPES = ['多金属结核', '富钴铁锰结壳', '多金属硫化物', '深海稀土'];

// 深海稀土资源分布区域（根据图片经纬度坐标精确定位）
export const RARE_EARTH_ZONES = [
    {
        id: 'central_east_pacific',
        name: '中-东太平洋深海稀土成矿带',
        color: '#FF69B4', // 粉红色
        // 图片中位置：约120°W-180°W, 0°-30°N
        coordinates: [
            [-175, 25], [-170, 28], [-165, 30], [-160, 30], [-155, 28],
            [-150, 26], [-145, 23], [-140, 20], [-135, 17], [-130, 14],
            [-125, 11], [-122, 8], [-120, 5], [-120, 0], [-122, -3],
            [-125, -5], [-130, -6], [-135, -5], [-140, -3], [-145, 0],
            [-150, 3], [-155, 6], [-160, 9], [-165, 12], [-170, 15],
            [-175, 18], [-178, 21], [-175, 25]
        ],
        center: { lng: -148, lat: 12, height: 3000000 }
    },
    {
        id: 'central_indian_ocean',
        name: '中印度洋深海稀土成矿带',
        color: '#FF69B4',
        // 图片中位置：约60°E-90°E, 30°S-30°N
        coordinates: [
            [65, 20], [70, 22], [75, 23], [80, 22], [85, 20],
            [88, 16], [90, 10], [90, 4], [88, -2], [85, -8],
            [80, -14], [75, -19], [70, -23], [65, -25], [60, -25],
            [55, -23], [52, -19], [50, -14], [50, -8], [52, -2],
            [55, 4], [58, 10], [60, 16], [65, 20]
        ],
        center: { lng: 70, lat: -2, height: 3000000 }
    },
    {
        id: 'southeast_pacific',
        name: '东南太平洋深海稀土成矿带',
        color: '#FF69B4',
        // 图片中位置：约90°W-120°W, 30°S-60°S
        coordinates: [
            [-115, -10], [-110, -8], [-105, -10], [-100, -14], [-95, -18],
            [-90, -23], [-87, -28], [-85, -34], [-85, -40], [-87, -45],
            [-90, -48], [-95, -50], [-100, -50], [-105, -48], [-110, -45],
            [-113, -40], [-115, -34], [-117, -28], [-118, -22], [-118, -16],
            [-115, -10]
        ],
        center: { lng: -101, lat: -30, height: 3000000 }
    },
    {
        id: 'north_pacific',
        name: '西太平洋深海稀土成矿区',
        color: '#FFB6C1', // 浅粉色
        // 图片中位置：约150°E-180°E, 30°N-60°N
        coordinates: [
            [150, 45], [155, 48], [160, 50], [165, 51], [170, 50],
            [175, 48], [178, 45], [180, 41], [180, 36], [178, 32],
            [175, 29], [170, 27], [165, 27], [160, 28], [155, 30],
            [150, 33], [147, 37], [147, 41], [150, 45]
        ],
        center: { lng: 164, lat: 39, height: 3000000 }
    },
    {
        id: 'south_atlantic',
        name: '南大西洋深海稀土富集区',
        color: '#FFB6C1',
        // 图片中位置：约30°W-60°W, 30°S-60°S
        coordinates: [
            [-45, -10], [-40, -8], [-35, -10], [-30, -14], [-27, -19],
            [-25, -25], [-25, -31], [-27, -37], [-30, -42], [-35, -46],
            [-40, -48], [-45, -48], [-50, -46], [-53, -42], [-55, -37],
            [-55, -31], [-53, -25], [-50, -19], [-48, -14], [-45, -10]
        ],
        center: { lng: -40, lat: -29, height: 3000000 }
    }
];

// 1. 矿区分布类型（原矿种类型）
export const MINERAL_TYPES = ['多金属结核', '富钴铁锰结壳', '多金属硫化物'];

// 2. 大洋区域
export const OCEANS = ['太平洋', '印度洋', '大西洋'];

// 3. 科技进展类型（新增）
export const TECH_PROGRESS = ['采矿车', '提升系统', '采矿平台', '环境监测', '试验试采'];

// 3.5 经济评价类型（新增）
export const ECONOMIC_EVALUATION = ['产能与价值分析', '模型对比', '经济分析', '可行性分析', '情景模拟'];

// 4. 政策法规类型（新增）
export const POLICY_REGULATIONS = ['开发规章时间线', '政策动态', '各国态度'];

// 各国态度分类数据
export const COUNTRY_ATTITUDES = {
    // 1. 暂停 moratorium（黄色）
    moratorium: {
        label: '暂停 moratorium',
        color: '#FFD700', // 金黄色
        countries: ['帕劳', '斐济', '萨摩亚', '密克罗尼西亚联邦', '瑞士', '加拿大', '英国', '马绍尔群岛']
    },
    // 2. 预防性暂停 precautionary pause（橙色）
    precautionaryPause: {
        label: '预防性暂停 precautionary pause',
        color: '#FF8C00', // 深橙色
        countries: ['智利', '哥斯达黎加', '厄瓜多尔', '西班牙', '新西兰', '德国', '巴拿马', '瓦努阿图', '多米尼加', '瑞典', '爱尔兰', '巴西', '芬兰', '葡萄牙', '摩纳哥', '墨西哥','丹麦', '希腊', '秘鲁', '马耳他', '洪都拉斯', '图瓦卢', '危地马拉', '奥地利', '卢森堡', '斯洛文尼亚', '塞浦路斯', '拉脱维亚']
    },
    // 3. 禁止 ban（大红色）
    ban: {
        label: '禁止 ban',
        color: '#FF0000', // 大红色
        countries: ['法国']
    }
};

// 5. 中国进展类型（新增）
export const CHINA_PROGRESS = ['企业主体', '技术成熟度'];

// 极地科考站国家配置（从实际数据中提取）
export const POLAR_STATION_COUNTRIES = {
    antarctic: [
        { id: 'china', label: '中国', color: '#FF0000' },
        { id: 'usa', label: '美国', color: '#0052B4' },
        { id: 'russia', label: '俄罗斯', color: '#D52B1E' },
        { id: 'australia', label: '澳大利亚', color: '#00008B' },
        { id: 'argentina', label: '阿根廷', color: '#74ACDF' },
        { id: 'chile', label: '智利', color: '#D52B1E' },
        { id: 'japan', label: '日本', color: '#BC002D' },
        { id: 'france', label: '法国', color: '#0055A4' },
        { id: 'germany', label: '德国', color: '#000000' },
        { id: 'korea', label: '韩国', color: '#003478' },
        { id: 'india', label: '印度', color: '#FF9933' },
        { id: 'uk', label: '英国', color: '#012169' },
        { id: 'ukraine', label: '乌克兰', color: '#005BBB' },
        { id: 'newzealand', label: '新西兰', color: '#00247D' },
        { id: 'norway', label: '挪威', color: '#BA0C2F' },
        { id: 'uruguay', label: '乌拉圭', color: '#0038A8' },
        { id: 'poland', label: '波兰', color: '#DC143C' },
        { id: 'france_italy', label: '法国、意大利', color: '#0055A4' }
    ],
    arctic: [
        { id: 'china', label: '中国', color: '#FF0000' },
        { id: 'norway', label: '挪威', color: '#BA0C2F' },
        { id: 'france_germany_norway', label: '法国、德国、挪威', color: '#0055A4' },
        { id: 'uk', label: '英国', color: '#012169' },
        { id: 'japan', label: '日本', color: '#BC002D' },
        { id: 'italy', label: '意大利', color: '#009246' },
        { id: 'korea', label: '韩国', color: '#003478' },
        { id: 'india', label: '印度', color: '#FF9933' },
        { id: 'usa', label: '美国', color: '#0052B4' },
        { id: 'canada', label: '加拿大', color: '#FF0000' },
        { id: 'russia', label: '俄罗斯', color: '#D52B1E' },
        { id: 'denmark', label: '丹麦', color: '#C60C30' },
        { id: 'sweden', label: '瑞典', color: '#006AA7' },
        { id: 'finland', label: '芬兰', color: '#003580' }
    ]
};

// 极地资源分类配置（新增）
export const POLAR_RESOURCE_CATEGORIES = {
    // 能源矿产
    energy_minerals: {
        label: '能源矿产',
        color: '#FFD700',
        resources: [
            { id: 'coal', label: '煤炭', file: '/data/JD/NJ/煤炭.geojson', icon: '⚫' },
            { id: 'oil_gas', label: '石油天然气', file: '/data/JD/NJ/石油天然气.geojson', icon: '🛢️' },
            { id: 'natural_gas', label: '天然气', file: '/data/JD/NJ/天然气.geojson', icon: '💨' },
            { id: 'uranium', label: '铀', file: '/data/JD/NJ/铀.geojson', icon: '☢️' }
        ]
    },
    // 金属矿产
    metal_minerals: {
        label: '金属矿产',
        color: '#C0C0C0',
        resources: [
            { id: 'iron', label: '铁', file: '/data/JD/NJ/铁.geojson', icon: '🔩' },
            { id: 'copper', label: '铜', file: '/data/JD/NJ/铜.geojson', icon: '🟤' },
            { id: 'lead', label: '铅', file: '/data/JD/NJ/铅.geojson', icon: '⚪' },
            { id: 'gold', label: '金', file: '/data/JD/NJ/金.geojson', icon: '🟡' },
            { id: 'silver', label: '银', file: '/data/JD/NJ/银.geojson', icon: '⚪' },
            { id: 'platinum', label: '白金', file: '/data/JD/NJ/白金.geojson', icon: '💎' },
            { id: 'tin', label: '锡', file: '/data/JD/NJ/锡.geojson', icon: '⚫' },
            { id: 'molybdenum', label: '钼', file: '/data/JD/NJ/钼.geojson', icon: '🔘' },
            { id: 'tin_cobalt_chrome', label: '锡钴铬', file: '/data/JD/NJ/锡钴铬.geojson', icon: '🔵' }
        ]
    },
    // 非金属矿产及特殊资源
    non_metal_special: {
        label: '非金属矿产及特殊资源',
        color: '#90EE90',
        resources: [
            { id: 'sulfur', label: '硫黄', file: '/data/JD/NJ/硫黄.geojson', icon: '🟡' },
            { id: 'phosphorus', label: '磷', file: '/data/JD/NJ/磷.geojson', icon: '🟢' }
        ]
    }
};

// 6. 大洋钻探类型（新增）
export const DRILLING_CATEGORIES = {
    // 第一类：钻孔站位（按阶段）
    DRILLING_SITES: {
        label: '钻孔站位',
        items: [
            { id: 'dsdp', label: '深海钻探计划（DSDP）', nameEn: 'Deep Sea Drilling Project', period: '1968-1983' },
            { id: 'odp', label: '大洋钻探计划（ODP）', nameEn: 'Ocean Drilling Program', period: '1985-2003' },
            { id: 'iodp1', label: '综合大洋钻探计划（IODP1）', nameEn: 'Integrated Ocean Drilling Program', period: '2003-2013' },
            { id: 'iodp2', label: '国际大洋发现计划（IODP2）', nameEn: 'International Ocean Discovery Program', period: '2013-至今' }
        ]
    },
    // 第二类：依托平台
    PLATFORMS: {
        label: '依托平台',
        items: [
            { id: 'challenger', label: '挑战者号', nameEn: 'D/V Glomar Challenger', period: '1968-1983', program: 'DSDP' },
            { id: 'resolution', label: '决心号', nameEn: 'JOIDES Resolution', period: '1985-至今', program: 'ODP/IODP' },
            { id: 'chikyu', label: '地球号', nameEn: 'D/V Chikyu', period: '2005-至今', program: 'IODP' },
            { id: 'msp', label: '特定任务平台', nameEn: 'Mission Specific Platform', period: '2013-至今', program: 'IODP' },
            { id: 'mengxiang', label: '梦想号', nameEn: 'Meng Xiang', period: '2024-至今', program: 'China' }
        ]
    },
    // 第三类：岩芯库
    CORE_REPOSITORIES: {
        label: '岩芯库',
        items: [
            { id: 'usa', label: '美国', nameEn: 'USA Core Repository', location: 'Texas A&M University', country: 'USA' },
            { id: 'germany', label: '德国', nameEn: 'Germany Core Repository', location: 'MARUM, Bremen', country: 'Germany' },
            { id: 'japan', label: '日本', nameEn: 'Japan Core Repository', location: 'Kochi Core Center', country: 'Japan' },
            { id: 'china', label: '中国', nameEn: 'China Core Repository', location: 'Tongji University', country: 'China' }
        ]
    },
    // 第四类：管理框架
    MANAGEMENT: {
        label: '管理框架',
        items: [
            { id: 'usa_mgmt', label: '美国', nameEn: 'USA Management', organization: 'NSF (National Science Foundation)' },
            { id: 'japan_mgmt', label: '日本', nameEn: 'Japan Management', organization: 'JAMSTEC' },
            { id: 'europe_mgmt', label: '欧洲', nameEn: 'Europe Management', organization: 'ECORD (European Consortium)' }
        ]
    }
};

// 钻孔站位颜色配置
export const DRILLING_COLORS = {
    'dsdp': '#FF6B6B',      // 红色 - 深海钻探计划
    'odp': '#4ECDC4',       // 青色 - 大洋钻探计划
    'iodp1': '#FFD93D',     // 黄色 - 综合大洋钻探计划
    'iodp2': '#95E1D3',     // 绿色 - 国际大洋发现计划
    'challenger': '#FF6B6B',
    'resolution': '#4ECDC4',
    'chikyu': '#FFD93D',
    'msp': '#95E1D3',
    'mengxiang': '#F38181'
};

// 中国企业主体数据
export const CHINA_ENTERPRISES = [
    {
        id: 'minmetals',
        name: '中国五矿集团',
        nameEn: 'China Minmetals Corporation',
        city: '北京',
        location: { lng: 116.4074, lat: 39.9042 },
        color: '#FF6B6B',
        expertise: '国际海底资源开发权获取、深海采矿系统集成与合规运营',
        highlights: [
            '国际矿权主导者：拥有国际海底管理局（ISA）批准的太平洋CCZ区多金属结核专属勘探合同区，是中国唯一具备国际深海矿产"合法开采资格"的企业主体。',
            '系统集成与项目总包：作为深海采矿国家专项的牵头单位，统筹协调装备研发、环境评估、海试验证与商业化路径，具备全链条项目管理能力。',
            '深海技术科研平台：依托长沙矿冶研究院和"深海矿产资源开发利用技术国家重点实验室"，在矿物识别、采集工艺、环境监测等方面具有深厚积累。',
            '国际规则话语权：积极参与ISA规则制定，2025年率先获得环境影响声明批准，展现其在合规性、环保标准和国际履约方面的领先能力。'
        ],
        summary: '五矿是深海采矿的"国家队队长"——拿矿权、定标准、统全局。'
    },
    {
        id: 'cmg',
        name: '招商局集团',
        nameEn: 'China Merchants Group',
        city: '香港',
        location: { lng: 114.1694, lat: 22.3193 },
        color: '#4ECDC4',
        expertise: '绿色智能装备设计、关键材料研发与深海产业生态构建',
        highlights: [
            '环保型采矿技术创新：聚焦"羽流防控""低扰动开采"等前沿方向，研发带环境友好功能的采矿车，强调可持续开发。',
            '轻量化与智能化装备：在深海装备结构优化、能耗控制、智能控制系统方面布局大量专利，提升作业效率与可靠性。',
            '产学研协同平台建设：通过三亚深海科技城，整合高校、科研院所与制造企业资源，打造从技术研发到产业落地的闭环生态。',
            '高端材料与部件攻关：联合中科院、高校等机构，突破耐压、耐腐蚀、抗磨损等深海特种材料瓶颈。'
        ],
        summary: '招商局是深海采矿的"绿色智创引擎"——重环保、强设计、搭平台。'
    },
    {
        id: 'cssc',
        name: '中国船舶集团',
        nameEn: 'China State Shipbuilding Corporation',
        city: '上海',
        location: { lng: 121.4737, lat: 31.2304 },
        color: '#FFD93D',
        expertise: '重型深海装备研制、核心系统工程与水面支持体系',
        highlights: [
            '深海重型机械制造：具备设计制造6000米级深海采矿车、硬岩切割装置、大功率推进系统的能力，代表国家高端装备制造水平。',
            '矿物输送"咽喉"技术：自主研发全球最大流量（2000 m³/h）深海粗颗粒泵送系统，解决矿石从海底到船上的高效、可靠输送难题。',
            '布放回收与动力定位：掌握超深水重型绞车、A字架、动态定位等关键技术，保障复杂海况下装备安全作业。',
            '水面母船与系统集成：可提供包括专用采矿船、科考支持船（如"梦想"号）在内的完整水面支持平台，实现"船-机-控"一体化。'
        ],
        summary: '中国船舶是深海采矿的"大国重器锻造者"——造硬装备、攻核心、保作业。'
    }
];

// 3. 国家映射 (基于大洋)
export const COUNTRY_MAPPING = {
    '太平洋': ['中国', '日本', '俄罗斯', '韩国', '美国'],
    '印度洋': ['印度', '法国', '德国'],
    '大西洋': ['俄罗斯', '法国', '波兰']
};

// 图层数据模板 (根据大洋动态生成)
export const getLayersByOcean = () => {
    return [
        {
            id: 'env_monitor',
            label: '气象监测',
            active: true,
            subLayers: [
                { id: 'wind', label: '近日风场预报', active: false },
                { id: 'wave', label: '近日海浪预报', active: false },
                { id: 'current', label: '近日洋流预报', active: false },
            ]
        },
        {
            id: 'disaster_warn',
            label: '灾害预警',
            active: true,
            subLayers: [
                { id: 'typhoon', label: '台风路径预警', active: false },
                { id: 'surge', label: '风暴潮预警', active: false },
                { id: 'tsunami', label: '海啸传播预警', active: false },
                { id: 'extreme_ocean', label: '极端海洋环境', active: false },
                { id: 'extreme_atmosphere', label: '极端大气环境', active: false },
                { id: 'internal_wave', label: '内波', active: false },
            ]
        },
        {
            id: 'history_data',
            label: '历史整编数据',
            active: false,
            subLayers: [
                { id: 'history_wind', label: '历史风场统计', active: false },
                { id: 'history_wave', label: '历史波浪统计', active: false },
            ]
        }
    ];
};

// 矿区地理分区配置
export const MINING_REGIONS = [
    {
        id: 'pacific_ccz',
        label: '太平洋CCZ区',
        description: 'Clarion-Clipperton Zone',
        active: true,  // 默认打开
        count: 0, // 将在运行时计算
        // 筛选条件
        filter: {
            location: ['太平洋 (CCZ)']
        },
        // 定位坐标(中心点)
        center: { lng: -130, lat: 12, height: 5000000 }
    },
    {
        id: 'pacific_other',
        label: '太平洋其他区',
        description: '太平洋其他海域',
        active: true,  // 默认打开
        count: 0,
        filter: {
            location: ['太平洋'], // 不包含CCZ的太平洋区域
            excludeLocation: ['太平洋 (CCZ)']
        },
        center: { lng: 150, lat: 15, height: 5000000 }
    },
    {
        id: 'indian_ocean',
        label: '印度洋区',
        description: '印度洋矿区',
        active: true,  // 默认打开
        count: 0,
        filter: {
            location: ['印度洋']
        },
        center: { lng: 75, lat: -10, height: 5000000 }
    },
    {
        id: 'atlantic_ocean',
        label: '大西洋区',
        description: '大西洋矿区',
        active: true,  // 默认打开
        count: 0,
        filter: {
            location: ['大西洋']
        },
        center: { lng: -30, lat: 30, height: 5000000 }
    },
    {
        id: 'apei',
        label: '环境保护区',
        description: 'APEI区域',
        active: true,  // 默认打开
        count: 0,
        filter: {
            category: ['APEI']
        },
        center: { lng: -140, lat: 15, height: 6000000 }
    }
];

export const MOCK_MINING_INFO = {
    id: 'CCZ-01',
    name: 'CCZ多金属结核矿区',
    contractor: '中国五矿集团',
    guarantor: '中国',
    type: '多金属结核',
    location: '太平洋CCZ',
    startDate: '2017年05月12日',
    endDate: '2032年05月11日',
    area: 72740
};

// ==================== 顶部选项卡配置 ====================

// 顶部选项卡（6个，左4右2）
export const TOP_TABS = [
    '态势总览',
    '矿区管理',
    '地质调查',
    '大洋钻探',
    '船舶追踪',
    '气象监测',
    '极地科考',
    '数据中心',
];

// 选项卡图标
export const TAB_ICONS = {
    '态势总览': '',
    '矿区管理': '',
    '地质调查': '',
    '大洋钻探': '',
    '船舶追踪': '',
    '气象监测': '',
    '极地科考':'',
    '数据中心': '',
};

// 选项卡与右侧功能的映射关系
export const TAB_TOOLS_MAPPING = {
    '态势总览': [
        '地图工具',
        '光缆列表',
        '光缆统计',
        '北极航线列表',
        '北极航线统计',
        '海洋装备',
        '海洋机构',
    ],
    '矿区管理': [
        '地图工具',
        '矿区查询',
        '图层控制',
        '矿区列表',
        '矿区气象',
        '数据统计'
    ],
    '地质调查': [
        '地图工具',
        '调查目录',
    ],
    '大洋钻探': [
        '地图工具',
        '钻孔面板',
        '数据统计',
    ],
    '船舶追踪': [
        '地图工具',
        '科考船列表',
        '船舶搜索',
        '船舶列表',
        '历史轨迹',
        '航线规划',
        '航线气象',
        '航线动态',
        '区域监控'
    ],
    '气象监测': [
        '地图工具',
        '气象图层',
        '气象分析',
        '预警列表',
        '风险评估',
        '台风预警',
        '预警设置'
    ],
    '极地科考':[
        '地图工具',
        '态势总览',
        '坐标采集',
        '区域勾面',
        '极地面板',
        '资源潜力',
        '科考站点',
        '科考装备',
        '主权主张',
        '制度框架'
    ],
    '数据中心': [
        '地图工具',
        '统计报表',
        '数据导出',
        '历史查询'
    ],
};

// OpenWeatherMap API Key
export const OPENWEATHERMAP_API_KEY = 'e38083a03cfa6c139f0067249c4f7b19';

// 气象图层配置（分组结构，参考图层控制）
export const WEATHER_LAYER_GROUPS = [
    {
        id: 'basic_weather',
        label: '基础气象',
        active: true,
        subLayers: [
            { id: 'wind', label: '近日风场预报', active: false, hasTimeline: true, dataSource: 'NOAA GFS' },
            { id: 'wave', label: '近日海浪预报', active: false, hasTimeline: true, dataSource: 'WaveWatch III' },
            { id: 'current', label: '近日洋流预报', active: false, hasTimeline: true, dataSource: 'HYCOM' }
        ]
    },
    {
        id: 'openweathermap',
        label: 'OpenWeatherMap',
        active: true,
        subLayers: [
            { 
                id: 'owm_clouds', 
                label: '云层覆盖', 
                active: false, 
                hasTimeline: false, 
                dataSource: 'OpenWeatherMap',
                type: 'imagery',
                url: `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${OPENWEATHERMAP_API_KEY}`
            },
            { 
                id: 'owm_precipitation', 
                label: '降水分布', 
                active: false, 
                hasTimeline: false, 
                dataSource: 'OpenWeatherMap',
                type: 'imagery',
                url: `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OPENWEATHERMAP_API_KEY}`
            },
            { 
                id: 'owm_temp', 
                label: '温度分布', 
                active: false, 
                hasTimeline: false, 
                dataSource: 'OpenWeatherMap',
                type: 'imagery',
                url: `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${OPENWEATHERMAP_API_KEY}`
            },
            { 
                id: 'owm_wind', 
                label: '风速分布', 
                active: false, 
                hasTimeline: false, 
                dataSource: 'OpenWeatherMap',
                type: 'imagery',
                url: `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${OPENWEATHERMAP_API_KEY}`
            },
            { 
                id: 'owm_pressure', 
                label: '气压分布', 
                active: false, 
                hasTimeline: false, 
                dataSource: 'OpenWeatherMap',
                type: 'imagery',
                url: `https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${OPENWEATHERMAP_API_KEY}`
            }
        ]
    },
    {
        id: 'disaster_warning',
        label: '灾害预警',
        active: true,
        subLayers: [
            { id: 'typhoon', label: '台风路径预警', active: false, hasTimeline: false, dataSource: '船讯网API' },
            { id: 'tsunami', label: '海啸传播预警', active: false, hasTimeline: true, dataSource: 'NOAA PTWC' },
            { id: 'storm_surge', label: '风暴潮预警', active: false, hasTimeline: true, dataSource: 'NOAA' }
        ]
    },
    {
        id: 'extreme_environment',
        label: '极端环境',
        active: true,
        subLayers: [
            { id: 'extreme_ocean', label: '极端海洋环境', active: false, hasTimeline: true, dataSource: 'NOAA' },
            { id: 'extreme_atmosphere', label: '极端大气环境', active: false, hasTimeline: true, dataSource: 'ECMWF' },
            { id: 'internal_wave', label: '内波', active: false, hasTimeline: true, dataSource: 'NASA HRET14' }
        ]
    }
];

// ==================== 态势总览配置 ====================

// 态势总览 - 海上丝绸之路
export const MARITIME_SILK_ROAD = {
    label: '海上丝绸之路',
    items: [
        { id: 'major_ports', label: '主要港口' },
        { id: 'major_routes', label: '主要航线' },
        { id: 'mineral_imports', label: '矿产品进口' },
        { id: 'arctic_routes', label: '北极航线' }
    ]
};

// 航线可视化配置
export const ROUTE_CONFIG = {
    // 航线颜色
    colors: {
        normal: '#FFD700',      // 金色 - 普通航线
        highlighted: '#FF4444', // 红色 - 高亮航线
        alternative: '#FF8C00'  // 橙色 - 备选颜色
    },
    
    // 航线宽度（像素）
    width: {
        normal: 3,
        highlighted: 5
    },
    
    // 发光效果强度
    glowPower: {
        normal: 0.2,
        highlighted: 0.4
    },
    
    // 航线筛选地理边界
    regions: {
        // 中国段
        china: {
            minLng: 100,
            maxLng: 130,
            minLat: 15,
            maxLat: 40
        },
        // 东南亚段
        southeastAsia: {
            minLng: 95,
            maxLng: 125,
            minLat: -10,
            maxLat: 25
        },
        // 南亚段
        southAsia: {
            minLng: 60,
            maxLng: 100,
            minLat: -5,
            maxLat: 30
        },
        // 中东段
        middleEast: {
            minLng: 35,
            maxLng: 65,
            minLat: 10,
            maxLat: 30
        },
        // 非洲段
        africa: {
            minLng: 30,
            maxLng: 55,
            minLat: -30,
            maxLat: 15
        },
        // 欧洲段
        europe: {
            minLng: -10,
            maxLng: 40,
            minLat: 30,
            maxLat: 60
        }
    },
    
    // 港口附近航线判定阈值（度）
    portProximityThreshold: 2.0
};

// 态势总览 - 海洋保护区
export const MARINE_PROTECTED_AREAS = {
    label: '海洋保护区',
    description: '全球海洋保护区分布'
};

// 态势总览 - 海底观测网
// 海底观测网国家颜色配置（使用高区分度颜色）
export const SEAFLOOR_OBSERVATION_COLORS = {
    '美国': '#0EA5E9',    // 天蓝色 (Sky Blue)
    '欧洲': '#8B5CF6',    // 紫色 (Purple)
    '加拿大': '#EF4444',  // 红色 (Red)
    '日本': '#F59E0B',    // 橙色 (Orange)
    '中国': '#10B981'     // 绿色 (Green)
};

// 态势总览 - 海底观测网
export const SEAFLOOR_OBSERVATION = {
    label: '海底观测网',
    countries: [
        { id: 'seafloor_usa', label: '美国', color: SEAFLOOR_OBSERVATION_COLORS['美国'] },
        { id: 'seafloor_eu', label: '欧盟', color: SEAFLOOR_OBSERVATION_COLORS['欧洲'] },
        { id: 'seafloor_canada', label: '加拿大', color: SEAFLOOR_OBSERVATION_COLORS['加拿大'] },
        { id: 'seafloor_japan', label: '日本', color: SEAFLOOR_OBSERVATION_COLORS['日本'] },
        { id: 'seafloor_china', label: '中国', color: SEAFLOOR_OBSERVATION_COLORS['中国'] }
    ]
};

// 态势总览 - 海底光缆
export const SUBMARINE_CABLES = {
    label: '海底光缆',
    description: '全球海底光缆网络'
};

// 主要研究机构国家颜色配置（使用高区分度颜色）
export const RESEARCH_INSTITUTION_COLORS = {
    'usa': '#0EA5E9',      // 天蓝色 (Sky Blue)
    'uk': '#EF4444',       // 红色 (Red)
    'france': '#8B5CF6',   // 紫色 (Purple)
    'germany': '#F59E0B',  // 橙色 (Orange)
    'canada': '#EC4899',   // 粉色 (Pink)
    'australia': '#10B981',// 绿色 (Green)
    'russia': '#6366F1',   // 靛蓝色 (Indigo)
    'japan': '#F97316'     // 深橙色 (Deep Orange)
};

// 态势总览 - 主要研究机构
export const RESEARCH_INSTITUTIONS = {
    label: '主要研究机构',
    countries: [
        { id: 'research_usa', label: '美国', color: RESEARCH_INSTITUTION_COLORS.usa },
        { id: 'research_uk', label: '英国', color: RESEARCH_INSTITUTION_COLORS.uk },
        { id: 'research_france', label: '法国', color: RESEARCH_INSTITUTION_COLORS.france },
        { id: 'research_germany', label: '德国', color: RESEARCH_INSTITUTION_COLORS.germany },
        { id: 'research_canada', label: '加拿大', color: RESEARCH_INSTITUTION_COLORS.canada },
        { id: 'research_australia', label: '澳大利亚', color: RESEARCH_INSTITUTION_COLORS.australia },
        { id: 'research_russia', label: '俄罗斯', color: RESEARCH_INSTITUTION_COLORS.russia },
        { id: 'research_japan', label: '日本', color: RESEARCH_INSTITUTION_COLORS.japan }
    ]
};

// 态势总览 - 海洋装备
export const MARINE_EQUIPMENT = {
    label: '海洋装备'
};

