
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
export const getLayersByOcean = (oceanName) => {
    return [
        {
            id: 'env_monitor',
            label: `${oceanName}环境监测`,
            active: true,
            subLayers: [
                { id: 'wind', label: '10日风场预报', active: true },
                { id: 'wave', label: '10日海浪预报', active: true },
                { id: 'current', label: '10日洋流预报', active: false },
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

export const RIGHT_TOOLS = [
    '地图工具',
    '矿区查询',
    '图层控制',
    '矿区列表',
    '预报中心',
    '图件导出'
];

// 选项卡与右侧功能的映射关系
export const TAB_TOOLS_MAPPING = {
    '一图一表': ['地图工具', '矿区查询', '图层控制', '矿区列表','预报中心','图件导出'],
    '预报预警': ['地图工具','预报中心', '灾害预警', '气象分析', '预警推送'],
    '协同工作': ['地图工具','任务管理', '团队协作', '文档共享', '消息通知'],
    '调度会商': ['地图工具','会议室', '视频会议', '调度指挥', '决策支持'],
    '数据中心': ['地图工具','数据管理', '统计分析', '数据导出', '数据备份'],
    '系统配置': ['地图工具','用户管理', '权限设置', '系统日志', '参数配置']
};
