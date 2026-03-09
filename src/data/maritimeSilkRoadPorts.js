/**
 * 海上丝绸之路主要港口数据配置
 * Maritime Silk Road Major Ports Configuration
 */

export const MARITIME_SILK_ROAD_PORTS = [
    // ==================== 中国段 ====================
    {
        id: 'quanzhou',
        name: '泉州港',
        nameEn: 'Quanzhou Port',
        country: '中国',
        coordinates: [118.5833, 24.9139],
        importance: 'high', // high, medium, low
        type: 'historical', // historical, modern, strategic
        description: '古代海上丝绸之路的起点，世界文化遗产'
    },
    {
        id: 'guangzhou',
        name: '广州港',
        nameEn: 'Guangzhou Port',
        country: '中国',
        coordinates: [113.2644, 23.1291],
        importance: 'high',
        type: 'modern',
        description: '中国第五大港口，华南地区最大综合性港口'
    },
    {
        id: 'shenzhen',
        name: '深圳港',
        nameEn: 'Shenzhen Port',
        country: '中国',
        coordinates: [114.0579, 22.5431],
        importance: 'high',
        type: 'modern',
        description: '全球第四大集装箱港口'
    },
    {
        id: 'shanghai',
        name: '上海港',
        nameEn: 'Shanghai Port',
        country: '中国',
        coordinates: [121.4737, 31.2304],
        importance: 'high',
        type: 'modern',
        description: '全球最大的集装箱港口'
    },
    {
        id: 'ningbo',
        name: '宁波舟山港',
        nameEn: 'Ningbo-Zhoushan Port',
        country: '中国',
        coordinates: [121.5500, 29.8683],
        importance: 'high',
        type: 'modern',
        description: '全球货物吞吐量第一大港'
    },
    {
        id: 'fuzhou',
        name: '福州港',
        nameEn: 'Fuzhou Port',
        country: '中国',
        coordinates: [119.2965, 26.0745],
        importance: 'medium',
        type: 'modern',
        description: '福建省主要港口'
    },
    {
        id: 'xiamen',
        name: '厦门港',
        nameEn: 'Xiamen Port',
        country: '中国',
        coordinates: [118.0894, 24.4798],
        importance: 'medium',
        type: 'modern',
        description: '东南沿海重要港口'
    },

    // ==================== 东南亚段 ====================
    {
        id: 'singapore',
        name: '新加坡港',
        nameEn: 'Port of Singapore',
        country: '新加坡',
        coordinates: [103.8198, 1.2644],
        importance: 'high',
        type: 'strategic',
        description: '全球最繁忙的转口港和集装箱港口之一'
    },
    {
        id: 'jakarta',
        name: '雅加达港',
        nameEn: 'Port of Jakarta',
        country: '印度尼西亚',
        coordinates: [106.8456, -6.1045],
        importance: 'medium',
        type: 'modern',
        description: '印尼最大港口'
    },
    {
        id: 'manila',
        name: '马尼拉港',
        nameEn: 'Port of Manila',
        country: '菲律宾',
        coordinates: [120.9842, 14.5995],
        importance: 'medium',
        type: 'modern',
        description: '菲律宾最大港口'
    },
    {
        id: 'bangkok',
        name: '曼谷港',
        nameEn: 'Port of Bangkok',
        country: '泰国',
        coordinates: [100.5018, 13.7563],
        importance: 'medium',
        type: 'modern',
        description: '泰国最大港口'
    },
    {
        id: 'hochiminh',
        name: '胡志明港',
        nameEn: 'Port of Ho Chi Minh',
        country: '越南',
        coordinates: [106.6297, 10.8231],
        importance: 'medium',
        type: 'modern',
        description: '越南最大港口'
    },

    // ==================== 南亚段 ====================
    {
        id: 'colombo',
        name: '科伦坡港',
        nameEn: 'Port of Colombo',
        country: '斯里兰卡',
        coordinates: [79.8612, 6.9271],
        importance: 'high',
        type: 'strategic',
        description: '南亚重要的转运枢纽'
    },
    {
        id: 'mumbai',
        name: '孟买港',
        nameEn: 'Port of Mumbai',
        country: '印度',
        coordinates: [72.8777, 18.9220],
        importance: 'high',
        type: 'modern',
        description: '印度最大港口'
    },
    {
        id: 'kolkata',
        name: '加尔各答港',
        nameEn: 'Port of Kolkata',
        country: '印度',
        coordinates: [88.3639, 22.5726],
        importance: 'medium',
        type: 'modern',
        description: '印度东部主要港口'
    },
    {
        id: 'chittagong',
        name: '吉大港',
        nameEn: 'Port of Chittagong',
        country: '孟加拉国',
        coordinates: [91.8123, 22.3569],
        importance: 'medium',
        type: 'modern',
        description: '孟加拉国最大港口'
    },

    // ==================== 中东段 ====================
    {
        id: 'dubai',
        name: '迪拜港',
        nameEn: 'Port of Dubai',
        country: '阿联酋',
        coordinates: [55.2708, 25.2048],
        importance: 'high',
        type: 'strategic',
        description: '中东地区最大港口'
    },
    {
        id: 'abudhabi',
        name: '阿布扎比港',
        nameEn: 'Port of Abu Dhabi',
        country: '阿联酋',
        coordinates: [54.3773, 24.4539],
        importance: 'medium',
        type: 'modern',
        description: '阿联酋重要港口'
    },
    {
        id: 'jeddah',
        name: '吉达港',
        nameEn: 'Port of Jeddah',
        country: '沙特阿拉伯',
        coordinates: [39.1925, 21.5169],
        importance: 'high',
        type: 'strategic',
        description: '红海最大港口'
    },
    {
        id: 'aden',
        name: '亚丁港',
        nameEn: 'Port of Aden',
        country: '也门',
        coordinates: [45.0187, 12.7855],
        importance: 'medium',
        type: 'strategic',
        description: '亚丁湾重要港口'
    },

    // ==================== 非洲段 ====================
    {
        id: 'djibouti',
        name: '吉布提港',
        nameEn: 'Port of Djibouti',
        country: '吉布提',
        coordinates: [43.1456, 11.5721],
        importance: 'high',
        type: 'strategic',
        description: '非洲之角战略要地'
    },
    {
        id: 'mombasa',
        name: '蒙巴萨港',
        nameEn: 'Port of Mombasa',
        country: '肯尼亚',
        coordinates: [39.6682, -4.0435],
        importance: 'medium',
        type: 'modern',
        description: '东非最大港口'
    },
    {
        id: 'daressalaam',
        name: '达累斯萨拉姆港',
        nameEn: 'Port of Dar es Salaam',
        country: '坦桑尼亚',
        coordinates: [39.2833, -6.8000],
        importance: 'medium',
        type: 'modern',
        description: '坦桑尼亚最大港口'
    },
    {
        id: 'suez',
        name: '苏伊士港',
        nameEn: 'Port of Suez',
        country: '埃及',
        coordinates: [32.5498, 29.9668],
        importance: 'high',
        type: 'strategic',
        description: '苏伊士运河南端'
    },

    // ==================== 欧洲段 ====================
    {
        id: 'piraeus',
        name: '比雷埃夫斯港',
        nameEn: 'Port of Piraeus',
        country: '希腊',
        coordinates: [23.6478, 37.9364],
        importance: 'high',
        type: 'strategic',
        description: '地中海重要门户，中远海运运营'
    },
    {
        id: 'venice',
        name: '威尼斯港',
        nameEn: 'Port of Venice',
        country: '意大利',
        coordinates: [12.3155, 45.4408],
        importance: 'medium',
        type: 'historical',
        description: '历史悠久的贸易港口'
    },
    {
        id: 'rotterdam',
        name: '鹿特丹港',
        nameEn: 'Port of Rotterdam',
        country: '荷兰',
        coordinates: [4.4777, 51.9225],
        importance: 'high',
        type: 'modern',
        description: '欧洲最大港口'
    },
    {
        id: 'hamburg',
        name: '汉堡港',
        nameEn: 'Port of Hamburg',
        country: '德国',
        coordinates: [9.9937, 53.5511],
        importance: 'medium',
        type: 'modern',
        description: '德国最大港口'
    },
    {
        id: 'antwerp',
        name: '安特卫普港',
        nameEn: 'Port of Antwerp',
        country: '比利时',
        coordinates: [4.4025, 51.2194],
        importance: 'medium',
        type: 'modern',
        description: '欧洲第二大港口'
    }
];

/**
 * 根据重要性获取港口颜色
 */
export function getPortColor(importance) {
    const colors = {
        high: '#FFD700',    // 金色 - 高重要性
        medium: '#4A90E2',  // 蓝色 - 中等重要性
        low: '#95A5A6'      // 灰色 - 低重要性
    };
    return colors[importance] || colors.medium;
}

/**
 * 根据重要性获取港口图标大小
 */
export function getPortSize(importance) {
    const sizes = {
        high: 48,
        medium: 36,
        low: 24
    };
    return sizes[importance] || sizes.medium;
}

/**
 * 根据类型获取港口图标
 */
export function getPortIcon(type) {
    // 这里可以返回不同的图标路径
    // 暂时都使用同一个图标
    return '⚓'; // 船锚符号
}
