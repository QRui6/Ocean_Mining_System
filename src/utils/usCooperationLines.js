import * as Cesium from 'cesium';

/**
 * 美国深海采矿合作关系数据
 */
export const US_COOPERATION_DATA = [
    {
        country: '日本',
        countryCode: 'JP',
        coordinates: [139.6917, 35.6895], // 东京
        cooperationType: '双边贸易与投资协议\n资本与技术的深度绑定',
        mainAreas: '联合勘探与开发：日本寻求与美国在南鸟岛周边海域联合开发深海稀土',
        details: '日美领导人计划在2026年3月峰会商讨联合开发深海稀土',
        color: Cesium.Color.fromCssColorString('#3b82f6')
    },
    {
        country: '韩国',
        countryCode: 'KR',
        coordinates: [126.9780, 37.5665], // 首尔
        cooperationType: '资本与技术合作',
        mainAreas: '冶炼',
        details: 'TMC与韩国锌业公司达成战略资协议',
        color: Cesium.Color.fromCssColorString('#8b5cf6')
    },
    {
        country: '库克群岛',
        countryCode: 'CK',
        coordinates: [-159.7777, -21.2367], // 拉罗汤加
        cooperationType: '《关键矿产合作框架》（非约束性）',
        mainAreas: '1. 联合科研与勘探：包括地质填图、信息共享\n2. 产业链建设：促进投资、支持下游加工、回收和市场准入\n3. 规则制定：就公平定价、高环境标准等进行对话',
        details: '框架旨在建立美-库克群岛工作组，协调合作；库克群岛海域蕴藏约67亿吨多金属结核，富含钴、镍、稀土',
        color: Cesium.Color.fromCssColorString('#06b6d4')
    },
    {
        country: '汤加',
        countryCode: 'TO',
        coordinates: [-175.2018, -21.1789], // 努库阿洛法
        cooperationType: '《海洋科学研究合作联合声明》',
        mainAreas: '1. 海洋科学研究：为负责任的深海资源勘探提供科学支撑\n2. 全球监管框架：共同研究制定适合的全球监管框架和标准',
        details: '合作强调尊重汤加的海洋管理传统和国际法义务；这是继库克群岛后，美国在太平洋岛国签署的第二个海底采矿相关协议',
        color: Cesium.Color.fromCssColorString('#10b981')
    },
    {
        country: '瑙鲁',
        countryCode: 'NR',
        coordinates: [166.9315, -0.5228], // 亚伦
        cooperationType: 'TMC的担保国',
        mainAreas: '合作伙伴与利益共同体，TMC向国际海底管理局申请勘探合同的担保国',
        details: '瑙鲁政府代表团于2025年8月访问白宫，与美国政府高官会晤，讨论加强包括深海采矿在内的经济合作；美国支持加快审理由瑙鲁赞助的TMC公司的采矿申请',
        color: Cesium.Color.fromCssColorString('#f59e0b')
    }
];

/**
 * 美国坐标
 */
export const US_COORDINATES = [-77.0369, 38.9072]; // 华盛顿特区

/**
 * 美国深海采矿合作关系线管理器
 */
export class USCooperationLinesManager {
    constructor(viewer) {
        this.viewer = viewer;
        this.entities = [];
        this.isVisible = false;
    }

    /**
     * 显示合作关系线
     */
    show() {
        if (this.isVisible) return;
        
        this.clear();
        
        US_COOPERATION_DATA.forEach(cooperation => {
            // 创建弧线路径
            const positions = this.createArcPositions(
                US_COORDINATES,
                cooperation.coordinates
            );

            // 创建线实体
            const lineEntity = this.viewer.entities.add({
                name: `US-${cooperation.country}-cooperation`,
                polyline: {
                    positions: positions,
                    width: 4,
                    material: new Cesium.PolylineGlowMaterialProperty({
                        glowPower: 0.25,
                        taperPower: 0.8,
                        color: cooperation.color
                    }),
                    clampToGround: false,
                    arcType: Cesium.ArcType.NONE, // 不使用自动弧线，我们已经手动计算了
                    granularity: Cesium.Math.RADIANS_PER_DEGREE // 细分粒度
                },
                properties: {
                    type: 'us-cooperation',
                    country: cooperation.country,
                    cooperationType: cooperation.cooperationType,
                    mainAreas: cooperation.mainAreas,
                    details: cooperation.details
                }
            });

            // 创建目标国家标记点
            const markerEntity = this.viewer.entities.add({
                name: `${cooperation.country}-marker`,
                position: Cesium.Cartesian3.fromDegrees(
                    cooperation.coordinates[0],
                    cooperation.coordinates[1],
                    100000
                ),
                point: {
                    pixelSize: 15,
                    color: cooperation.color,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 3,
                    heightReference: Cesium.HeightReference.NONE,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                },
                label: {
                    text: cooperation.country,
                    font: '16px "Noto Sans SC", sans-serif',
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 3,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -20),
                    heightReference: Cesium.HeightReference.NONE,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                },
                properties: {
                    type: 'us-cooperation-marker',
                    country: cooperation.country,
                    cooperationType: cooperation.cooperationType,
                    mainAreas: cooperation.mainAreas,
                    details: cooperation.details
                }
            });

            this.entities.push(lineEntity, markerEntity);
        });

        // 添加美国标记点
        const usMarker = this.viewer.entities.add({
            name: 'US-marker',
            position: Cesium.Cartesian3.fromDegrees(
                US_COORDINATES[0],
                US_COORDINATES[1],
                100000
            ),
            point: {
                pixelSize: 18,
                color: Cesium.Color.RED,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 4,
                heightReference: Cesium.HeightReference.NONE,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            },
            label: {
                text: '美国',
                font: 'bold 18px "Noto Sans SC", sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 3,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -22),
                heightReference: Cesium.HeightReference.NONE,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
        });

        this.entities.push(usMarker);
        this.isVisible = true;
    }

    /**
     * 隐藏合作关系线
     */
    hide() {
        this.clear();
        this.isVisible = false;
    }

    /**
     * 切换显示状态
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * 清除所有实体
     */
    clear() {
        this.entities.forEach(entity => {
            this.viewer.entities.remove(entity);
        });
        this.entities = [];
    }

    /**
     * 创建弧线路径点 - 使用大圆弧线
     */
    createArcPositions(startCoords, endCoords) {
        const startLon = startCoords[0];
        const startLat = startCoords[1];
        const endLon = endCoords[0];
        const endLat = endCoords[1];

        // 使用Cesium的EllipsoidGeodesic来计算大圆弧线
        const startCartographic = Cesium.Cartographic.fromDegrees(startLon, startLat);
        const endCartographic = Cesium.Cartographic.fromDegrees(endLon, endLat);
        
        const geodesic = new Cesium.EllipsoidGeodesic(startCartographic, endCartographic);
        const distance = geodesic.surfaceDistance; // 表面距离

        // 弧线高度根据距离动态调整
        const arcHeight = distance * 0.08; // 降低高度系数，使弧线更贴近地球
        const numPoints = 150;
        const positions = [];

        for (let i = 0; i <= numPoints; i++) {
            const fraction = i / numPoints;
            
            // 使用geodesic插值获取大圆弧线上的点
            const interpolatedCartographic = geodesic.interpolateUsingSurfaceDistance(
                distance * fraction
            );
            
            // 计算抛物线高度
            const height = arcHeight * Math.sin(fraction * Math.PI) * (1 - Math.abs(fraction - 0.5) * 0.3);
            
            positions.push(
                Cesium.Cartesian3.fromRadians(
                    interpolatedCartographic.longitude,
                    interpolatedCartographic.latitude,
                    height
                )
            );
        }

        return positions;
    }

    /**
     * 销毁管理器
     */
    destroy() {
        this.clear();
        this.viewer = null;
    }
}
