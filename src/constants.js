
export const APP_TITLE = "深海采矿的海洋气象预报保障系统";

// 1. 矿种类型 (只保留前三类)
export const MINERAL_TYPES = ['多金属结核', '富钴铁锰结壳', '多金属硫化物'];

// 2. 大洋区域
export const OCEANS = ['太平洋', '印度洋', '大西洋'];

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
                { id: 'tsunami', label: '海啸传播预警', active: false },
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

// 顶部选项卡（4个，左2右2）
export const TOP_TABS = [
    '矿区总览',
    '采矿系统',
    '环境监测',
    '预报中心',
    '预警中心',
    '历史数据'
];

// 选项卡图标
export const TAB_ICONS = {
    '矿区总览': '',
    '采矿系统': '',
    '环境监测': '',
    '历史数据': ''
};

// 选项卡与右侧功能的映射关系
export const TAB_TOOLS_MAPPING = {
    '矿区总览': [
        '地图工具',
        '矿区查询',
        '图层控制',
        '矿区气象',
        '矿区科普'
    ],
    '采矿系统': [
        '地图工具',
        '管道评估',
        '船舶搜索',
        '航线规划',
        '航线动态',
        '区域监控'
    ],
    '预警中心': [
        '地图工具',
        '气象预警',
        '监控事件'
    ],
    '环境监测': [
        '地图工具',
        '浮标监测',
        '气象图层'
    ],
    '预报中心': [
        '地图工具',
        '常规预报'
    ],
    '历史数据': [
        '地图工具',
        '历史台风',
        '历史海况'
    ],
    '数据导出': [
        '地图工具',
        '统计报表',
        '数据导出',
        '历史查询'
    ]
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
            { id: 'internal_wave', label: '内波', active: false, hasTimeline: true, dataSource: 'NASA HRET14' }
        ]
    }
];
