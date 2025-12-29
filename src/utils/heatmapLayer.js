/**
 * 热力图图层工具
 * 用于在Cesium地图上渲染气象数据的热力图
 */
import * as Cesium from 'cesium';

export class HeatmapLayer {
    constructor(viewer) {
        this.viewer = viewer;
        this.imageryLayer = null;
        this.heatmapEntity = null;
        this.canvas = null;
        this.ctx = null;
    }
    
    /**
     * 创建热力图
     * @param {Object} data - 气象数据 { u: {array, min, max}, v: {array, min, max}, width, height, bounds }
     * @param {Array} colorScale - 颜色映射数组
     * @param {Object} options - 配置选项
     */
    async createHeatmap(data, colorScale, options = {}) {
        const {
            alpha = 0.6,
            bounds = data.bounds || { west: -180, south: -80, east: 180, north: 90 }
        } = options;
        
        console.log('🎨 开始创建热力图...');
        console.log('   - 原始数据尺寸:', data.width, 'x', data.height);
        console.log('   - 边界:', bounds);
        
        // 使用适中的渲染分辨率
        const renderWidth = Math.min(data.width, 1440);
        const renderHeight = Math.min(data.height, 720);
        
        console.log('   - 渲染尺寸:', renderWidth, 'x', renderHeight);
        
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
        }
        
        this.canvas.width = renderWidth;
        this.canvas.height = renderHeight;
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        
        // 创建ImageData
        const imageData = this.ctx.createImageData(renderWidth, renderHeight);
        const pixels = imageData.data;
        
        // 获取数据数组
        const uArray = data.u.array;
        const vArray = data.v.array;
        const dataWidth = data.width;
        const dataHeight = data.height;
        
        console.log('📊 开始计算像素颜色（双线性插值）...');
        
        // 使用双线性插值计算每个像素的颜色
        for (let y = 0; y < renderHeight; y++) {
            for (let x = 0; x < renderWidth; x++) {
                // 映射到原始数据坐标（浮点数）
                const srcX = (x / renderWidth) * dataWidth;
                const srcY = (y / renderHeight) * dataHeight;
                
                // 双线性插值
                const magnitude = this.bilinearInterpolate(
                    uArray, vArray, 
                    srcX, srcY, 
                    dataWidth, dataHeight
                );
                
                const pixelIdx = (y * renderWidth + x) * 4;
                
                // 归一化到 0-1（根据数据类型调整范围）
                let displayMin = 0;
                let displayMax = 6;  // 波高默认 0-6米
                
                // 如果是洋流数据（速度较小），调整范围
                if (data.u.max < 10) {
                    displayMax = 2;  // 洋流 0-2 m/s
                }
                
                const normalized = Math.max(0, Math.min(1, (magnitude - displayMin) / (displayMax - displayMin)));
                
                // 根据归一化值选择颜色
                const color = this.getColorFromScale(normalized, colorScale);
                
                pixels[pixelIdx] = color.r;
                pixels[pixelIdx + 1] = color.g;
                pixels[pixelIdx + 2] = color.b;
                pixels[pixelIdx + 3] = color.a * alpha * 255;
            }
        }
        
        console.log('✅ 像素颜色计算完成');
        
        // 绘制到Canvas
        this.ctx.putImageData(imageData, 0, 0);
        
        // 应用轻微模糊，让过渡更平滑（减少模糊强度）
        this.ctx.filter = 'blur(1px)';
        this.ctx.drawImage(this.canvas, 0, 0);
        this.ctx.filter = 'none';
        
        console.log('✅ 应用轻微模糊效果');
        
        // 确保bounds是数字
        const west = parseFloat(bounds.west);
        const south = parseFloat(bounds.south);
        const east = parseFloat(bounds.east);
        const north = parseFloat(bounds.north);
        
        console.log('📍 热力图边界:', { west, south, east, north });
        
        // 验证bounds是否有效
        if (!Number.isFinite(west) || !Number.isFinite(south) || !Number.isFinite(east) || !Number.isFinite(north)) {
            console.error('❌ 无效的bounds值:', { west, south, east, north });
            throw new Error('Invalid bounds values');
        }
        
        // 将Canvas转换为Blob URL
        const blob = await new Promise(resolve => this.canvas.toBlob(resolve, 'image/png'));
        const imageUrl = URL.createObjectURL(blob);
        
        console.log('🖼️ 图片URL已创建');
        
        // 创建Rectangle
        const rectangle = Cesium.Rectangle.fromDegrees(west, south, east, north);
        
        // 移除旧图层
        if (this.heatmapEntity) {
            this.viewer.entities.remove(this.heatmapEntity);
            this.heatmapEntity = null;
        }
        
        // 使用Entity创建矩形覆盖物
        this.heatmapEntity = this.viewer.entities.add({
            name: 'Heatmap Layer',
            rectangle: {
                coordinates: rectangle,
                material: new Cesium.ImageMaterialProperty({
                    image: imageUrl,
                    transparent: true
                }),
                height: 0,  // 贴地
                classificationType: Cesium.ClassificationType.TERRAIN
            }
        });
        
        console.log('✅ 热力图实体已创建');
    }
    
    /**
     * 双线性插值
     * @param {Float32Array} uArray - U分量数组
     * @param {Float32Array} vArray - V分量数组
     * @param {number} x - X坐标（浮点数）
     * @param {number} y - Y坐标（浮点数）
     * @param {number} width - 数据宽度
     * @param {number} height - 数据高度
     * @returns {number} 插值后的强度值
     */
    bilinearInterpolate(uArray, vArray, x, y, width, height) {
        // 边界处理
        x = Math.max(0, Math.min(width - 1.001, x));
        y = Math.max(0, Math.min(height - 1.001, y));
        
        // 获取四个相邻点的索引
        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const x1 = Math.min(x0 + 1, width - 1);
        const y1 = Math.min(y0 + 1, height - 1);
        
        // 计算插值权重
        const wx = x - x0;
        const wy = y - y0;
        
        // 获取四个角的值
        const idx00 = y0 * width + x0;
        const idx10 = y0 * width + x1;
        const idx01 = y1 * width + x0;
        const idx11 = y1 * width + x1;
        
        // 计算四个角的强度
        const mag00 = Math.sqrt(uArray[idx00] * uArray[idx00] + vArray[idx00] * vArray[idx00]);
        const mag10 = Math.sqrt(uArray[idx10] * uArray[idx10] + vArray[idx10] * vArray[idx10]);
        const mag01 = Math.sqrt(uArray[idx01] * uArray[idx01] + vArray[idx01] * vArray[idx01]);
        const mag11 = Math.sqrt(uArray[idx11] * uArray[idx11] + vArray[idx11] * vArray[idx11]);
        
        // 双线性插值
        const mag0 = mag00 * (1 - wx) + mag10 * wx;
        const mag1 = mag01 * (1 - wx) + mag11 * wx;
        const magnitude = mag0 * (1 - wy) + mag1 * wy;
        
        return magnitude;
    }
    
    /**
     * 从颜色映射中获取颜色
     * @param {Number} value - 归一化值 (0-1)
     * @param {Array} colorScale - 颜色数组
     */
    getColorFromScale(value, colorScale) {
        if (value <= 0) return this.parseColor(colorScale[0]);
        if (value >= 1) return this.parseColor(colorScale[colorScale.length - 1]);
        
        const index = value * (colorScale.length - 1);
        const lowerIndex = Math.floor(index);
        const upperIndex = Math.ceil(index);
        const fraction = index - lowerIndex;
        
        const lowerColor = this.parseColor(colorScale[lowerIndex]);
        const upperColor = this.parseColor(colorScale[upperIndex]);
        
        return {
            r: Math.round(lowerColor.r + (upperColor.r - lowerColor.r) * fraction),
            g: Math.round(lowerColor.g + (upperColor.g - lowerColor.g) * fraction),
            b: Math.round(lowerColor.b + (upperColor.b - lowerColor.b) * fraction),
            a: lowerColor.a + (upperColor.a - lowerColor.a) * fraction
        };
    }
    
    /**
     * 解析rgba颜色字符串
     * @param {String} colorStr - 'rgba(r, g, b, a)' 格式
     */
    parseColor(colorStr) {
        const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (match) {
            return {
                r: parseInt(match[1]),
                g: parseInt(match[2]),
                b: parseInt(match[3]),
                a: match[4] ? parseFloat(match[4]) : 1.0
            };
        }
        return { r: 0, g: 0, b: 255, a: 1.0 };
    }
    
    /**
     * 移除热力图
     */
    remove() {
        if (this.imageryLayer) {
            this.viewer.imageryLayers.remove(this.imageryLayer);
            this.imageryLayer = null;
        }
        if (this.heatmapEntity) {
            this.viewer.entities.remove(this.heatmapEntity);
            this.heatmapEntity = null;
        }
        if (this.canvas) {
            this.canvas = null;
            this.ctx = null;
        }
    }
    
    /**
     * 设置透明度
     * @param {Number} alpha - 透明度 (0-1)
     */
    setAlpha(alpha) {
        if (this.imageryLayer) {
            this.imageryLayer.alpha = alpha;
        }
    }
    
    /**
     * 显示/隐藏
     * @param {Boolean} show
     */
    setShow(show) {
        if (this.imageryLayer) {
            this.imageryLayer.show = show;
        }
    }
}
