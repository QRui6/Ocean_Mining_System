import * as Cesium from 'cesium';

/**
 * 南极资源配置 - 不同资源类型对应不同的颜色和图标
 */
const RESOURCE_CONFIG = {
    '石油天然气': { color: '#000000', icon: '🛢️', shape: 'circle' },
    '天然气': { color: '#4169E1', icon: '💨', shape: 'circle' },
    '煤炭': { color: '#2C2C2C', icon: '⚫', shape: 'square' },
    '铁': { color: '#8B4513', icon: '🔩', shape: 'triangle' },
    '铜': { color: '#B87333', icon: '🔶', shape: 'circle' },
    '金': { color: '#FFD700', icon: '💰', shape: 'star' },
    '银': { color: '#C0C0C0', icon: '⚪', shape: 'circle' },
    '铅': { color: '#5C5C5C', icon: '⬛', shape: 'square' },
    '锡': { color: '#A8A8A8', icon: '🔘', shape: 'circle' },
    '钼': { color: '#708090', icon: '⚙️', shape: 'triangle' },
    '铀': { color: '#00FF00', icon: '☢️', shape: 'diamond' },
    '白金': { color: '#E5E4E2', icon: '💎', shape: 'star' },
    '磷': { color: '#FF6347', icon: '🔴', shape: 'circle' },
    '硫黄': { color: '#FFFF00', icon: '🟡', shape: 'circle' },
    '锡钴铬': { color: '#9370DB', icon: '🔷', shape: 'triangle' }
};

/**
 * 南极资源图层管理器
 */
export class AntarcticResourceLoader {
    constructor(viewer) {
        this.viewer = viewer;
        this.dataSources = new Map(); // 存储各个资源类型的数据源
        this.isLoaded = false;
    }

    /**
     * 加载所有南极资源数据
     */
    async loadAllResources() {
        if (this.isLoaded) {
            console.log('📦 南极资源已加载，跳过');
            return;
        }

        console.log('🌍 开始加载南极资源数据...');
        const resourceTypes = Object.keys(RESOURCE_CONFIG);
        console.log(`📋 共有 ${resourceTypes.length} 种资源类型:`, resourceTypes);
        
        let successCount = 0;
        let failCount = 0;
        
        for (const resourceType of resourceTypes) {
            try {
                await this.loadResourceType(resourceType);
                successCount++;
            } catch (error) {
                console.warn(`⚠️ 加载 ${resourceType} 数据失败:`, error);
                failCount++;
            }
        }

        this.isLoaded = true;
        console.log(`✅ 南极资源数据加载完成: 成功 ${successCount}/${resourceTypes.length}, 失败 ${failCount}`);
    }

    /**
     * 加载特定类型的资源
     */
    async loadResourceType(resourceType) {
        const config = RESOURCE_CONFIG[resourceType];
        if (!config) {
            console.warn(`⚠️ 未知的资源类型: ${resourceType}`);
            return;
        }

        const filePath = `/data/JD/NJ/${resourceType}.geojson`;
        console.log(`📂 正在加载: ${filePath}`);
        
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const geojson = await response.json();
            console.log(`📄 ${resourceType} GeoJSON 数据:`, geojson.features?.length || 0, '个要素');
            
            // 创建数据源
            const dataSource = new Cesium.GeoJsonDataSource(resourceType);
            await dataSource.load(geojson);
            
            // 设置样式
            const entities = dataSource.entities.values;
            console.log(`🎨 为 ${resourceType} 设置样式: ${entities.length} 个实体`);
            entities.forEach(entity => {
                // 设置点的样式
                if (entity.position) {
                    entity.billboard = undefined; // 移除默认的 billboard
                    
                    // 根据形状类型创建不同的图形
                    this.setEntityStyle(entity, config, resourceType);
                    
                    // 只在点击时显示描述信息，不显示标签
                    entity.description = `
                        <div style="padding: 10px;">
                            <h3 style="margin: 0 0 10px 0; color: ${config.color};">${config.icon} ${resourceType}</h3>
                            <p><strong>类型：</strong>${resourceType}</p>
                            <p><strong>位置：</strong>南极地区</p>
                        </div>
                    `;
                }
            });
            
            // 添加到场景
            await this.viewer.dataSources.add(dataSource);
            this.dataSources.set(resourceType, dataSource);
            
            console.log(`✅ 加载 ${resourceType}: ${entities.length} 个点`);
        } catch (error) {
            console.error(`❌ 加载 ${resourceType} 失败:`, error);
            throw error;
        }
    }

    /**
     * 根据配置设置实体样式
     */
    setEntityStyle(entity, config, resourceType) {
        const color = Cesium.Color.fromCssColorString(config.color);
        
        switch (config.shape) {
            case 'circle':
                entity.point = new Cesium.PointGraphics({
                    pixelSize: 12,
                    color: color,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 2,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                });
                break;
                
            case 'square':
                entity.billboard = new Cesium.BillboardGraphics({
                    image: this.createSquareImage(config.color),
                    width: 16,
                    height: 16,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                });
                break;
                
            case 'triangle':
                entity.billboard = new Cesium.BillboardGraphics({
                    image: this.createTriangleImage(config.color),
                    width: 18,
                    height: 18,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                });
                break;
                
            case 'star':
                entity.billboard = new Cesium.BillboardGraphics({
                    image: this.createStarImage(config.color),
                    width: 20,
                    height: 20,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                });
                break;
                
            case 'diamond':
                entity.billboard = new Cesium.BillboardGraphics({
                    image: this.createDiamondImage(config.color),
                    width: 16,
                    height: 16,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                });
                break;
                
            default:
                entity.point = new Cesium.PointGraphics({
                    pixelSize: 12,
                    color: color,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 2,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                });
        }
    }

    /**
     * 创建正方形图标
     */
    createSquareImage(color) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = color;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.fillRect(6, 6, 20, 20);
        ctx.strokeRect(6, 6, 20, 20);
        
        return canvas.toDataURL();
    }

    /**
     * 创建三角形图标
     */
    createTriangleImage(color) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = color;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(16, 6);
        ctx.lineTo(26, 26);
        ctx.lineTo(6, 26);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        return canvas.toDataURL();
    }

    /**
     * 创建星形图标
     */
    createStarImage(color) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = color;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        
        const centerX = 16;
        const centerY = 16;
        const outerRadius = 12;
        const innerRadius = 5;
        const points = 5;
        
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI / points) * i - Math.PI / 2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        return canvas.toDataURL();
    }

    /**
     * 创建菱形图标
     */
    createDiamondImage(color) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = color;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(16, 6);
        ctx.lineTo(26, 16);
        ctx.lineTo(16, 26);
        ctx.lineTo(6, 16);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        return canvas.toDataURL();
    }

    /**
     * 显示所有资源
     */
    showAll() {
        this.dataSources.forEach(dataSource => {
            dataSource.show = true;
        });
    }

    /**
     * 隐藏所有资源
     */
    hideAll() {
        this.dataSources.forEach(dataSource => {
            dataSource.show = false;
        });
    }

    /**
     * 显示特定类型的资源
     */
    showResourceType(resourceType) {
        const dataSource = this.dataSources.get(resourceType);
        if (dataSource) {
            dataSource.show = true;
        }
    }

    /**
     * 隐藏特定类型的资源
     */
    hideResourceType(resourceType) {
        const dataSource = this.dataSources.get(resourceType);
        if (dataSource) {
            dataSource.show = false;
        }
    }

    /**
     * 清除所有资源
     */
    clear() {
        this.dataSources.forEach(dataSource => {
            this.viewer.dataSources.remove(dataSource);
        });
        this.dataSources.clear();
        this.isLoaded = false;
    }

    /**
     * 获取资源配置（用于图例）
     */
    getResourceConfig() {
        return RESOURCE_CONFIG;
    }
}
