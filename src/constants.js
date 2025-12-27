
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

// 顶部选项卡（6个，左3右3）
export const TOP_TABS = [
    '态势总览',
    '矿区管理',
    '气象监测',
    '船舶追踪',
    '预警保障',
    '数据中心'
];

// 选项卡图标（已移除emoji）
export const TAB_ICONS = {
    '态势总览': '',
    '矿区管理': '',
    '气象监测': '',
    '船舶追踪': '',
    '预警保障': '',
    '数据中心': ''
};

// 选项卡与右侧功能的映射关系
export const TAB_TOOLS_MAPPING = {
    '态势总览': [
        '地图工具',
        '全局概览',
        '快速定位',
        '图件导出'
    ],
    '矿区管理': [
        '地图工具',
        '矿区查询',
        '图层控制',
        '矿区列表'
    ],
    '气象监测': [
        '地图工具',
        '气象图层',
        '气象分析'
    ],
    '船舶追踪': [
        '地图工具',
        '船舶搜索',
        '船舶列表',
        '历史轨迹',
        '航线规划',
        '航线气象',
        '区域监控'
    ],
    '预警保障': [
        '地图工具',
        '预警列表',
        '风险评估',
        '台风预警',
        '预警设置'
    ],
    '数据中心': [
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
        id: 'windy',
        label: 'Windy 气象图层',
        active: true,
        subLayers: [
            { 
                id: 'windy_wind', 
                label: '风场动画', 
                active: false, 
                hasTimeline: true, 
                dataSource: 'Windy',
                type: 'windy',
                layer: 'wind'
            },
            { 
                id: 'windy_temp', 
                label: '温度分布', 
                active: false, 
                hasTimeline: true, 
                dataSource: 'Windy',
                type: 'windy',
                layer: 'temp'
            },
            { 
                id: 'windy_clouds', 
                label: '云层覆盖', 
                active: false, 
                hasTimeline: true, 
                dataSource: 'Windy',
                type: 'windy',
                layer: 'clouds'
            },
            { 
                id: 'windy_rain', 
                label: '降雨预报', 
                active: false, 
                hasTimeline: true, 
                dataSource: 'Windy',
                type: 'windy',
                layer: 'rain'
            },
            { 
                id: 'windy_waves', 
                label: '海浪高度', 
                active: false, 
                hasTimeline: true, 
                dataSource: 'Windy',
                type: 'windy',
                layer: 'waves'
            },
            { 
                id: 'windy_pressure', 
                label: '气压分布', 
                active: false, 
                hasTimeline: true, 
                dataSource: 'Windy',
                type: 'windy',
                layer: 'pressure'
            }
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
            { id: 'internal_wave', label: '内波', active: false, hasTimeline: true, dataSource: 'HYCOM' }
        ]
    }
];
