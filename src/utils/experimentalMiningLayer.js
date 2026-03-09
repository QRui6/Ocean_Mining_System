/**
 * 试验试采图层管理器
 * 用于在地图上显示历史试验试采位置和信息
 */
import * as Cesium from 'cesium';

// 时间段颜色配置
export const PERIOD_COLORS = {
    '1970-1990': '#FFD700',  // 金黄色
    '1991-2010': '#FF8C00',  // 橙色
    '2011-now': '#FF0000'    // 红色
};

// 试验试采数据（根据图片中的位置和信息精确标注）
export const EXPERIMENTAL_MINING_DATA = [
    // ========== 图3.8：1970-1990年主要国家深海采矿技术试验情况 ==========
    
    // 红圈1：红海
    {
        id: 'red_sea',
        name: '红海',
        year: '1979年',
        period: '1970-1990',
        organization: '德国海洋地质研究所（BGR）',
        type: '多金属硫化物',
        depth: '2200m',
        description: '进行了海底采矿系统试验',
        position: { lng: 38, lat: 20 }
    },
    
    // 红圈2：加利福尼亚圣地戈西南海域
    {
        id: 'california_san_diego',
        name: '加利福尼亚圣地戈西南海域',
        year: '1970年',
        period: '1970-1990',
        organization: '美国国际镍公司（IMI）',
        type: '多金属结核',
        depth: '5500m',
        description: '进行了海底采矿系统试验',
        position: { lng: -115, lat: 30 }
    },
    
    // 红圈3：夏威夷檀香山东南海域
    {
        id: 'hawaii_honolulu_southeast',
        name: '夏威夷檀香山东南海域',
        year: '1978年',
        period: '1970-1990',
        organization: '美国海洋矿产公司（OMI）',
        type: '多金属结核',
        depth: '3200m',
        description: '进行了海底采矿系统试验',
        position: { lng: -155, lat: 20 }
    },
    
    // 红圈4：夏威夷南部海域
    {
        id: 'hawaii_south',
        name: '夏威夷南部海域',
        year: '1979年',
        period: '1970-1990',
        organization: '美国海洋矿产公司（OMI）',
        type: '多金属结核',
        depth: '5000m',
        description: '进行了海底采矿系统试验',
        position: { lng: -155, lat: 18 }
    },
    
    // 红圈5：夏威夷西南部海域
    {
        id: 'hawaii_southwest',
        name: '夏威夷西南部海域',
        year: '1979年',
        period: '1970-1990',
        organization: '美国海洋矿产公司（OMI）',
        type: '多金属结核',
        depth: '5000m',
        description: '进行了海底采矿系统试验',
        position: { lng: -157, lat: 19 }
    },
    
    // ========== 图3.9：1991-2010年部分国家深海采矿技术试验情况 ==========
    
    // 红圈1：北太平洋马库斯海
    {
        id: 'north_pacific_marcus',
        name: '北太平洋马库斯海',
        year: '1997年',
        period: '1991-2010',
        organization: '日本石油天然气金属矿产公司（JOGMEC）',
        type: '多金属结核',
        depth: '2200m',
        description: '进行了海底采矿系统试验',
        position: { lng: 145, lat: 18 }
    },
    
    // 红圈2：韩国东海Hupo港
    {
        id: 'korea_east_sea_hupo',
        name: '韩国东海Hupo港',
        year: '2009年',
        period: '1991-2010',
        organization: '韩国海洋研究开发研究所（KORDI）',
        type: '多金属结核',
        depth: '100m',
        description: '进行了100m级海试，机械性能测试',
        position: { lng: 129.5, lat: 37 }
    },
    
    // 红圈3：印度洋阿拉伯海马尔文海岸
    {
        id: 'india_ocean_arabian_malvan',
        name: '印度洋阿拉伯海马尔文海岸',
        year: '2000年',
        period: '1991-2010',
        organization: '印度国家海洋技术研究所（NIOT）',
        type: '多金属结核',
        depth: '550m',
        description: '进行了海底采矿系统试验',
        position: { lng: 74, lat: 18 }
    },
    
    // ========== 图3.10：2011以来部分国家深海采矿试验情况（日本、韩国）==========
    
    // 红圈1：韩国东海
    {
        id: 'korea_east_sea',
        name: '韩国东海',
        year: '2024年',
        period: '2011-now',
        organization: '韩国海洋科学技术院（KIOST）',
        type: '多金属结核',
        depth: '1300m',
        description: '进行了海底采矿系统试验',
        position: { lng: 130, lat: 38 }
    },
    
    // 红圈2：茨城县近海
    {
        id: 'ibaraki_offshore',
        name: '茨城县近海',
        year: '2024年',
        period: '2011-now',
        organization: '日本石油天然气金属矿产公司（JOGMEC）',
        type: '多金属结核',
        depth: '1300m',
        description: '进行了海底采矿系统试验',
        position: { lng: 141, lat: 36 }
    },
    
    // 红圈3：冲绳县近海
    {
        id: 'okinawa_offshore',
        name: '冲绳县近海',
        year: '2017年',
        period: '2011-now',
        organization: '日本石油天然气金属矿产公司（JOGMEC）',
        type: '多金属硫化物',
        depth: '500m',
        description: '进行了海底采矿系统试验',
        position: { lng: 128, lat: 26 }
    },
    
    // 红圈4：南鸟岛南部
    {
        id: 'south_bird_island',
        name: '南鸟岛南部',
        year: '2020年',
        period: '2011-now',
        organization: '日本石油天然气金属矿产公司（JOGMEC）',
        type: '稀土泥',
        depth: '900m',
        description: '进行了海底采矿系统试验',
        position: { lng: 154, lat: 24 }
    },
    
    // 红圈5：冲绳海槽
    {
        id: 'okinawa_trough',
        name: '冲绳海槽',
        year: '2017年',
        period: '2011-now',
        organization: '日本石油天然气金属矿产公司（JOGMEC）',
        type: '多金属硫化物',
        depth: '1600m',
        description: '进行了海底采矿系统试验',
        position: { lng: 127, lat: 25 }
    },
    
    // ========== 图3.11：2011以来部分国家深海采矿试验情况（加拿大和比利时等）==========
    
    // 红圈1：西马里亚纳海盆海域
    {
        id: 'west_mariana_basin',
        name: '西班牙马拉加湾海域',
        year: '2019年',
        period: '2011-now',
        organization: '加拿大海洋矿产公司（OMI）',
        type: '多金属结核',
        depth: '5500m',
        description: '进行了海底采矿系统试验，但未取得大量矿石',
        position: { lng: -4, lat: 36 }
    },
    
    // 红圈2：大西洋靠近美国海域
    {
        id: 'atlantic_us',
        name: '大西洋靠近美国海域',
        year: '1970年',
        period: '2011-now',
        organization: '美国国际镍公司（INCO）',
        type: '多金属结核',
        depth: '5000m',
        description: '进行了海底采矿系统试验',
        position: { lng: -73, lat: 35 }
    },
    
    // 红圈3：东太平洋CCZ
    {
        id: 'pacific_ccz',
        name: '东太平洋CCZ',
        year: '2021年',
        period: '2011-now',
        organization: '比利时GSR公司（DEME集团）',
        type: '多金属结核',
        depth: '4500m',
        description: '成功进行了采矿车海试，采集了约10吨矿石',
        position: { lng: -125, lat: 12 }
    },
    
    // 红圈4：巴布亚新几内亚海域
    {
        id: 'papua_new_guinea',
        name: '巴布亚新几内亚海域',
        year: '2017年',
        period: '2011-now',
        organization: '加拿大海洋矿产公司（OMI）',
        type: '多金属硫化物',
        depth: '1600m',
        description: '进行了海底采矿系统试验，但未取得大量矿石',
        position: { lng: 152, lat: -5 }
    }
];

/**
 * 试验试采图层管理器类
 */
export class ExperimentalMiningLayer {
    constructor(viewer) {
        this.viewer = viewer;
        this.entities = [];
        this.isActive = false;
    }

    /**
     * 显示试验试采标记
     */
    show() {
        if (this.isActive) {
            console.log('试验试采图层已激活');
            return;
        }

        console.log('🔴 显示试验试采标记，共', EXPERIMENTAL_MINING_DATA.length, '个位置');

        EXPERIMENTAL_MINING_DATA.forEach(site => {
            // 根据时间段获取颜色
            const colorHex = PERIOD_COLORS[site.period];
            const color = Cesium.Color.fromCssColorString(colorHex);
            
            // 创建点标记（可点击）
            const pointEntity = this.viewer.entities.add({
                id: `experimental_point_${site.id}`,
                position: Cesium.Cartesian3.fromDegrees(site.position.lng, site.position.lat),
                point: {
                    pixelSize: 12,
                    color: color,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 2,
                    heightReference: Cesium.HeightReference.NONE,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                },
                properties: {
                    type: 'experimental_mining',
                    siteData: site
                }
            });

            this.entities.push(pointEntity);
        });

        this.isActive = true;
        console.log('✅ 试验试采标记显示完成');
    }

    /**
     * 隐藏试验试采标记
     */
    hide() {
        if (!this.isActive) {
            return;
        }

        console.log('🔴 隐藏试验试采标记');

        this.entities.forEach(entity => {
            this.viewer.entities.remove(entity);
        });

        this.entities = [];
        this.isActive = false;

        console.log('✅ 试验试采标记已隐藏');
    }

    /**
     * 切换显示状态
     */
    toggle() {
        if (this.isActive) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * 销毁图层
     */
    destroy() {
        this.hide();
        this.viewer = null;
    }
}
