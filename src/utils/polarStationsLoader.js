import * as Cesium from 'cesium';

/**
 * 国家颜色配置 - 确保每个国家都有唯一且差异明显的颜色
 */
const COUNTRY_COLORS = {
    '中国': '#FF0000',           // 鲜红色
    '美国': '#0066FF',           // 纯蓝色
    '俄罗斯': '#FFD700',         // 金黄色
    '英国': '#00FFFF',           // 青色
    '日本': '#FF1493',           // 深粉红
    '澳大利亚': '#00FF00',       // 纯绿色
    '阿根廷': '#87CEEB',         // 天蓝色
    '智利': '#FF6600',           // 橙色
    '法国': '#9370DB',           // 中紫色
    '德国': '#FFFFFF',           // 白色
    '韩国': '#FF00FF',           // 洋红色
    '印度': '#FFA500',           // 橙黄色
    '挪威': '#DC143C',           // 猩红色
    '新西兰': '#00CED1',         // 深绿松石
    '乌克兰': '#1E90FF',         // 道奇蓝
    '波兰': '#FF69B4',           // 热粉红
    '乌拉圭': '#4169E1',         // 皇家蓝
    '意大利': '#32CD32',         // 酸橙绿
    '法国、意大利': '#BA55D3',   // 中兰花紫
    '法国、德国、挪威': '#8B008B', // 深洋红
    '阿根廷、智利': '#6A5ACD',   // 板岩蓝
    '丹麦': '#ADFF2F',           // 黄绿色
    '瑞典': '#FFE4B5',           // 鹿皮色
    '芬兰': '#20B2AA',           // 浅海绿
    '加拿大': '#FF4500',         // 橙红色
    '冰岛': '#7FFFD4'            // 碧绿色
};

/**
 * 极地科考站加载器
 */
export class PolarStationsLoader {
    constructor(viewer) {
        this.viewer = viewer;
        this.antarcticDataSource = null;
        this.arcticDataSource = null;
        this.isLoaded = false;
        this.antarcticCountries = new Set(); // 存储南极国家
        this.arcticCountries = new Set(); // 存储北极国家
    }

    /**
     * 获取国家颜色
     */
    getCountryColor(country) {
        return COUNTRY_COLORS[country] || '#808080'; // 默认灰色
    }

    /**
     * 获取所有国家及其颜色（分南极和北极）
     */
    getCountryList() {
        return {
            antarctic: Array.from(this.antarcticCountries).map(country => ({
                name: country,
                color: this.getCountryColor(country)
            })).sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')),
            arctic: Array.from(this.arcticCountries).map(country => ({
                name: country,
                color: this.getCountryColor(country)
            })).sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
        };
    }

    /**
     * 加载所有极地科考站
     */
    async loadAllStations() {
        if (this.isLoaded) {
            console.log('📦 极地科考站已加载，跳过');
            return;
        }

        console.log('🏔️ 开始加载极地科考站数据...');
        
        try {
            await Promise.all([
                this.loadAntarcticStations(),
                this.loadArcticStations()
            ]);
            
            this.isLoaded = true;
            console.log('✅ 极地科考站数据加载完成');
        } catch (error) {
            console.error('❌ 加载极地科考站失败:', error);
            throw error;
        }
    }

    /**
     * 加载南极科考站
     */
    async loadAntarcticStations() {
        const filePath = '/data/JD/NJ/antarctic_research_stations.geojson';
        
        try {
            console.log('🇦🇶 加载南极科考站...');
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const geojson = await response.json();
            
            // 创建数据源
            const dataSource = new Cesium.GeoJsonDataSource('南极科考站');
            await dataSource.load(geojson);
            
            // 设置样式
            const entities = dataSource.entities.values;
            entities.forEach(entity => {
                if (entity.position) {
                    const props = entity.properties;
                    const country = props.country?.getValue() || '未知';
                    const stationName = props.stationName?.getValue() || '未知站点';
                    
                    // 添加国家到南极集合
                    this.antarcticCountries.add(country);
                    
                    // 获取国家颜色
                    const countryColor = this.getCountryColor(country);
                    
                    // 移除默认样式
                    entity.billboard = undefined;
                    entity.point = undefined;
                    
                    // 创建科考站标记（使用国家颜色）
                    entity.billboard = new Cesium.BillboardGraphics({
                        image: this.createStationMarker(countryColor, country),
                        width: 24,
                        height: 24,
                        verticalOrigin: Cesium.VerticalOrigin.CENTER,
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                        disableDepthTestDistance: Number.POSITIVE_INFINITY
                    });
                    
                    // 添加描述信息
                    entity.description = `
                        <div style="padding: 10px; min-width: 200px;">
                            <h3 style="margin: 0 0 10px 0; color: #00CED1;">🇦🇶 ${stationName}</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr style="border-bottom: 1px solid #333;">
                                    <td style="padding: 5px; color: #999;">国家：</td>
                                    <td style="padding: 5px; color: #fff;">${country}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #333;">
                                    <td style="padding: 5px; color: #999;">建立时间：</td>
                                    <td style="padding: 5px; color: #fff;">${props.establishedDate?.getValue() || '未知'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 5px; color: #999;">人员配置：</td>
                                    <td style="padding: 5px; color: #fff;">${props.personnel?.getValue() || '未知'}</td>
                                </tr>
                            </table>
                        </div>
                    `;
                }
            });
            
            // 添加到场景
            await this.viewer.dataSources.add(dataSource);
            this.antarcticDataSource = dataSource;
            
            console.log(`✅ 南极科考站加载完成: ${entities.length} 个站点`);
        } catch (error) {
            console.error('❌ 加载南极科考站失败:', error);
            throw error;
        }
    }

    /**
     * 加载北极科考站
     */
    async loadArcticStations() {
        const filePath = '/data/JD/BJ/arctic_research_stations.geojson';
        
        try {
            console.log('🧊 加载北极科考站...');
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const geojson = await response.json();
            
            // 创建数据源
            const dataSource = new Cesium.GeoJsonDataSource('北极科考站');
            await dataSource.load(geojson);
            
            // 设置样式
            const entities = dataSource.entities.values;
            entities.forEach(entity => {
                if (entity.position) {
                    const props = entity.properties;
                    const country = props.country?.getValue() || '未知';
                    const stationName = props.stationName?.getValue() || '未知站点';
                    
                    // 添加国家到北极集合
                    this.arcticCountries.add(country);
                    
                    // 获取国家颜色
                    const countryColor = this.getCountryColor(country);
                    
                    // 移除默认样式
                    entity.billboard = undefined;
                    entity.point = undefined;
                    
                    // 创建科考站标记（使用国家颜色）
                    entity.billboard = new Cesium.BillboardGraphics({
                        image: this.createStationMarker(countryColor, country),
                        width: 24,
                        height: 24,
                        verticalOrigin: Cesium.VerticalOrigin.CENTER,
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                        disableDepthTestDistance: Number.POSITIVE_INFINITY
                    });
                    
                    // 添加描述信息
                    const location = props.location?.getValue() || '未知';
                    const stationType = props.stationType?.getValue() || '未知';
                    const personnel = props.personnel?.getValue() || '未知';
                    
                    entity.description = `
                        <div style="padding: 10px; min-width: 200px;">
                            <h3 style="margin: 0 0 10px 0; color: #4169E1;">🧊 ${stationName}</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr style="border-bottom: 1px solid #333;">
                                    <td style="padding: 5px; color: #999;">国家：</td>
                                    <td style="padding: 5px; color: #fff;">${country}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #333;">
                                    <td style="padding: 5px; color: #999;">位置：</td>
                                    <td style="padding: 5px; color: #fff;">${location}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #333;">
                                    <td style="padding: 5px; color: #999;">类型：</td>
                                    <td style="padding: 5px; color: #fff;">${stationType}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 5px; color: #999;">人员配置：</td>
                                    <td style="padding: 5px; color: #fff;">${personnel}</td>
                                </tr>
                            </table>
                        </div>
                    `;
                }
            });
            
            // 添加到场景
            await this.viewer.dataSources.add(dataSource);
            this.arcticDataSource = dataSource;
            
            console.log(`✅ 北极科考站加载完成: ${entities.length} 个站点`);
        } catch (error) {
            console.error('❌ 加载北极科考站失败:', error);
            throw error;
        }
    }

    /**
     * 创建科考站标记图标
     */
    createStationMarker(color, country) {
        const canvas = document.createElement('canvas');
        canvas.width = 48;
        canvas.height = 48;
        const ctx = canvas.getContext('2d');
        
        // 绘制外圆（边框）
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(24, 24, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制内圆（主体）
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(24, 24, 17, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制科考站图标（建筑物）
        ctx.fillStyle = '#FFFFFF';
        
        // 绘制房子主体
        ctx.fillRect(14, 22, 20, 12);
        
        // 绘制屋顶
        ctx.beginPath();
        ctx.moveTo(24, 14);
        ctx.lineTo(12, 22);
        ctx.lineTo(36, 22);
        ctx.closePath();
        ctx.fill();
        
        // 绘制门
        ctx.fillStyle = color;
        ctx.fillRect(21, 28, 6, 6);
        
        // 绘制窗户
        ctx.fillRect(15, 25, 4, 4);
        ctx.fillRect(29, 25, 4, 4);
        
        return canvas.toDataURL();
    }

    /**
     * 显示所有科考站
     */
    showAll() {
        if (this.antarcticDataSource) {
            this.antarcticDataSource.show = true;
        }
        if (this.arcticDataSource) {
            this.arcticDataSource.show = true;
        }
    }

    /**
     * 隐藏所有科考站
     */
    hideAll() {
        if (this.antarcticDataSource) {
            this.antarcticDataSource.show = false;
        }
        if (this.arcticDataSource) {
            this.arcticDataSource.show = false;
        }
    }

    /**
     * 显示南极科考站
     */
    showAntarctic() {
        if (this.antarcticDataSource) {
            this.antarcticDataSource.show = true;
        }
    }

    /**
     * 隐藏南极科考站
     */
    hideAntarctic() {
        if (this.antarcticDataSource) {
            this.antarcticDataSource.show = false;
        }
    }

    /**
     * 显示北极科考站
     */
    showArctic() {
        if (this.arcticDataSource) {
            this.arcticDataSource.show = true;
        }
    }

    /**
     * 隐藏北极科考站
     */
    hideArctic() {
        if (this.arcticDataSource) {
            this.arcticDataSource.show = false;
        }
    }

    /**
     * 清除所有科考站
     */
    clear() {
        if (this.antarcticDataSource) {
            this.viewer.dataSources.remove(this.antarcticDataSource);
            this.antarcticDataSource = null;
        }
        if (this.arcticDataSource) {
            this.viewer.dataSources.remove(this.arcticDataSource);
            this.arcticDataSource = null;
        }
        this.isLoaded = false;
    }
}
