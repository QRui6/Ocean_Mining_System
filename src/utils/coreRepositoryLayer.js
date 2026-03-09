import * as Cesium from 'cesium';

/**
 * 岩心库图层管理器
 * 负责加载和管理岩心库点位数据
 */
export class CoreRepositoryLayer {
    constructor(viewer) {
        this.viewer = viewer;
        this.dataSource = null; // 存储岩心库点位数据源
        this.isVisible = false; // 显示状态
        this.currentSelection = null; // 当前选中的国家
        
        // 岩心库配置 - 根据area属性映射
        this.repositories = {
            GCR: {
                id: 'usa',
                name: '美国岩心库 (GCR)',
                fullName: 'Gulf Coast Repository',
                url: 'https://www.iodp.org/resources/access-to-samples-and-data/gcr',
                color: Cesium.Color.fromCssColorString('#4169E1'), // 皇家蓝
                year: '2008年',
                coreCount: '61个',
                description: '作为IODP的三大岩芯库之一，GCR位于美国德克萨斯州，负责保存和管理来自墨西哥湾及周边海域的大洋钻探岩芯样品。该库拥有先进的保存设施和完善的样品管理系统。'
            },
            BCR: {
                id: 'germany',
                name: '德国岩心库 (BCR)',
                fullName: 'Bremen Core Repository',
                url: 'https://www.marum.de/en/infrastructure/Core-Repository.html',
                color: Cesium.Color.fromCssColorString('#FFD700'), // 金色
                year: '2003年',
                coreCount: '27个',
                description: '位于德国不来梅的BCR是欧洲最重要的海洋岩芯库之一，隶属于MARUM海洋环境科学中心。该库保存了大量来自大西洋、北冰洋等海域的珍贵岩芯样品，为全球海洋科学研究提供重要支撑。'
            },
            KCC: {
                id: 'japan',
                name: '日本岩心库 (KCC)',
                fullName: 'Kochi Core Center',
                url: 'https://www.jamstec.go.jp/kcc/e/',
                color: Cesium.Color.fromCssColorString('#DC143C'), // 深红色
                year: '2005年',
                coreCount: '11个',
                description: '日本高知岩芯中心(KCC)是JAMSTEC（日本海洋研究开发机构）的重要设施，主要保存来自西太平洋海域的大洋钻探岩芯。该中心配备了世界一流的岩芯分析设备和保存系统。'
            }
        };
        
        // 反向映射：从国家ID到area
        this.countryToArea = {
            'usa': 'GCR',
            'germany': 'BCR',
            'japan': 'KCC'
        };
    }
    
    /**
     * 加载岩心库点位数据
     */
    async load() {
        // 如果已经加载过，直接显示
        if (this.dataSource) {
            this.show();
            return true;
        }
        
        try {
            console.log('🔄 开始加载岩心库点位数据...');
            
            // 加载 core.geojson 数据
            const dataSource = await Cesium.GeoJsonDataSource.load('/data/YanXinKu_new/core.geojson', {
                clampToGround: true
            });
            
            // 设置点位样式
            const entities = dataSource.entities.values;
            entities.forEach(entity => {
                const area = entity.properties.area?.getValue();
                const config = this.repositories[area];
                
                if (config && entity.position) {
                    // 设置点样式
                    entity.billboard = {
                        image: this.createPinImage(config.color),
                        width: 40,
                        height: 40,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                        disableDepthTestDistance: Number.POSITIVE_INFINITY
                    };
                    
                    // 添加标签
                    entity.label = {
                        text: config.name,
                        font: '14px sans-serif',
                        fillColor: Cesium.Color.WHITE,
                        outlineColor: Cesium.Color.BLACK,
                        outlineWidth: 2,
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        pixelOffset: new Cesium.Cartesian2(0, -45),
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                        disableDepthTestDistance: Number.POSITIVE_INFINITY
                    };
                    
                    // 设置名称和描述
                    entity.name = config.name;
                    entity.description = `<div style="padding: 10px;">
                        <h3 style="margin: 0 0 10px 0; color: #06b6d4;">${config.name}</h3>
                        <p style="margin: 5px 0;">点击访问岩心库网站</p>
                        <a href="${config.url}" target="_blank" style="color: #06b6d4; text-decoration: none;">🔗 访问网站</a>
                    </div>`;
                    
                    // 存储area属性用于点击事件
                    entity.coreRepositoryArea = area;
                }
            });
            
            // 添加到场景
            await this.viewer.dataSources.add(dataSource);
            
            // 保存数据源
            this.dataSource = dataSource;
            this.isVisible = true;
            
            // 添加点击事件监听
            this.setupClickHandler();
            
            console.log('✅ 岩心库点位数据加载完成');
            
            return true;
        } catch (error) {
            console.error('❌ 加载岩心库点位数据失败:', error);
            return false;
        }
    }
    
    /**
     * 创建图钉图像
     */
    createPinImage(color) {
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 40;
        const ctx = canvas.getContext('2d');
        
        // 绘制图钉
        ctx.beginPath();
        ctx.arc(20, 15, 12, 0, Math.PI * 2);
        ctx.fillStyle = color.toCssColorString();
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 绘制底部尖角
        ctx.beginPath();
        ctx.moveTo(20, 27);
        ctx.lineTo(15, 35);
        ctx.lineTo(25, 35);
        ctx.closePath();
        ctx.fillStyle = color.toCssColorString();
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        return canvas.toDataURL();
    }
    
    /**
     * 设置点击事件处理
     */
    setupClickHandler() {
        const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        
        handler.setInputAction((click) => {
            const pickedObject = this.viewer.scene.pick(click.position);
            
            if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.coreRepositoryArea) {
                const area = pickedObject.id.coreRepositoryArea;
                const config = this.repositories[area];
                
                if (config) {
                    console.log(`🏛️ 点击岩心库: ${config.name}`);
                    
                    // 触发点击事件，传递岩心库数据
                    if (this.onRepositoryClick) {
                        this.onRepositoryClick(config, area);
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        
        this.clickHandler = handler;
    }
    
    /**
     * 设置点击回调函数
     */
    setClickCallback(callback) {
        this.onRepositoryClick = callback;
    }
    
    /**
     * 显示岩心库点位
     */
    show() {
        if (this.dataSource) {
            this.dataSource.show = true;
            this.isVisible = true;
            console.log('✅ 显示岩心库点位');
        }
    }
    
    /**
     * 隐藏岩心库点位
     */
    hide() {
        if (this.dataSource) {
            this.dataSource.show = false;
            this.isVisible = false;
            console.log('✅ 隐藏岩心库点位');
        }
    }
    
    /**
     * 选择岩心库并飞到对应点位
     * @param {string|null} countryId - 国家ID (usa, germany, japan) 或 null
     */
    async select(countryId) {
        console.log('🏛️ CoreRepositoryLayer.select: 收到选择', countryId);
        
        // 如果传入null，隐藏所有点位
        if (countryId === null) {
            console.log('🏛️ CoreRepositoryLayer: 隐藏点位');
            this.hide();
            this.currentSelection = null;
            return true;
        }
        
        // 如果还没加载数据，先加载
        if (!this.dataSource) {
            console.log('🏛️ CoreRepositoryLayer: 数据未加载，开始加载');
            await this.load();
        } else {
            console.log('🏛️ CoreRepositoryLayer: 数据已加载');
        }
        
        // 显示数据源
        this.show();
        this.currentSelection = countryId;
        
        // 飞到对应的点位
        const area = this.countryToArea[countryId];
        console.log('🏛️ CoreRepositoryLayer: 国家ID映射到area', countryId, '->', area);
        if (area) {
            this.flyToPoint(area);
        } else {
            console.error('❌ CoreRepositoryLayer: 未找到对应的area', countryId);
        }
        
        return true;
    }
    
    /**
     * 飞行到指定岩心库点位
     * @param {string} area - 区域代码 (GCR, BCR, KCC)
     */
    flyToPoint(area) {
        if (!this.dataSource) return;
        
        const entities = this.dataSource.entities.values;
        const targetEntity = entities.find(entity => {
            const entityArea = entity.properties.area?.getValue();
            return entityArea === area;
        });
        
        if (targetEntity && targetEntity.position) {
            const position = targetEntity.position.getValue(Cesium.JulianDate.now());
            this.viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromRadians(
                    Cesium.Cartographic.fromCartesian(position).longitude,
                    Cesium.Cartographic.fromCartesian(position).latitude,
                    5000000 // 高度5000km
                ),
                duration: 2,
                orientation: {
                    heading: Cesium.Math.toRadians(0),
                    pitch: Cesium.Math.toRadians(-45),
                    roll: 0.0
                }
            });
            console.log(`✈️ 飞行到${this.repositories[area].name}`);
        }
    }
    
    /**
     * 清除岩心库数据
     */
    clear() {
        if (this.dataSource) {
            this.viewer.dataSources.remove(this.dataSource);
            this.dataSource = null;
        }
        
        if (this.clickHandler) {
            this.clickHandler.destroy();
            this.clickHandler = null;
        }
        
        this.isVisible = false;
        this.currentSelection = null;
        console.log('✅ 清除岩心库数据');
    }
    
    /**
     * 获取显示状态
     */
    isShown() {
        return this.isVisible;
    }
}
