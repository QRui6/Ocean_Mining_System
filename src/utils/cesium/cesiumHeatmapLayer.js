/**
 * Cesium 原生热力图层
 * 使用 Primitive + 自定义着色器实现高性能热力图
 * 效果接近 Windy
 */
import * as Cesium from 'cesium';

export class CesiumHeatmapLayer {
    constructor(viewer) {
        this.viewer = viewer;
        this.entity = null;
    }
    
    /**
     * 创建热力图
     * @param {Object} data - 气象数据
     * @param {Array} colorScale - 颜色映射
     * @param {Object} options - 配置选项
     */
    async createHeatmap(data, colorScale, options = {}) {
        const {
            alpha = 0.7,
            bounds = data.bounds
        } = options;
        
        console.log('🎨 创建 Cesium 原生热力图...');
        
        // 1. 生成热力图纹理
        const canvas = this.generateHeatmapTexture(data, colorScale, alpha);
        
        // 2. 创建矩形几何体
        const rectangle = Cesium.Rectangle.fromDegrees(
            bounds.west,
            bounds.south,
            bounds.east,
            bounds.north
        );
        
        // 3. 移除旧的实体
        if (this.entity) {
            this.viewer.entities.remove(this.entity);
        }
        
        // 4. 使用 Entity 方式（更简单，更可靠）
        this.entity = this.viewer.entities.add({
            name: 'Cesium Heatmap Layer',
            rectangle: {
                coordinates: rectangle,
                material: new Cesium.ImageMaterialProperty({
                    image: canvas,
                    transparent: true
                }),
                height: 0,
                classificationType: Cesium.ClassificationType.TERRAIN
            }
        });
        
        console.log('✅ Cesium 原生热力图创建成功');
    }
    
    /**
     * 生成热力图纹理（使用双线性插值）
     * 返回 Canvas 对象
     */
    generateHeatmapTexture(data, colorScale, alpha) {
        const width = Math.min(data.width, 2048);
        const height = Math.min(data.height, 1024);
        
        // 创建 Canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        // 创建 ImageData
        const imageData = ctx.createImageData(width, height);
        const pixels = imageData.data;
        
        const uArray = data.u.array;
        const vArray = data.v.array;
        const dataWidth = data.width;
        const dataHeight = data.height;
        
        // 使用双线性插值填充像素
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const srcX = (x / width) * dataWidth;
                const srcY = (y / height) * dataHeight;
                
                const magnitude = this.bilinearInterpolate(
                    uArray, vArray,
                    srcX, srcY,
                    dataWidth, dataHeight
                );
                
                const pixelIdx = (y * width + x) * 4;
                
                // 归一化
                let displayMax = 6;
                if (data.u.max < 10) displayMax = 2;
                
                const normalized = Math.max(0, Math.min(1, magnitude / displayMax));
                const color = this.getColorFromScale(normalized, colorScale);
                
                pixels[pixelIdx] = color.r;
                pixels[pixelIdx + 1] = color.g;
                pixels[pixelIdx + 2] = color.b;
                pixels[pixelIdx + 3] = color.a * alpha * 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // 应用轻微模糊
        ctx.filter = 'blur(1px)';
        ctx.drawImage(canvas, 0, 0);
        ctx.filter = 'none';
        
        return canvas;
    }
    
    /**
     * 双线性插值
     */
    bilinearInterpolate(uArray, vArray, x, y, width, height) {
        x = Math.max(0, Math.min(width - 1.001, x));
        y = Math.max(0, Math.min(height - 1.001, y));
        
        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const x1 = Math.min(x0 + 1, width - 1);
        const y1 = Math.min(y0 + 1, height - 1);
        
        const wx = x - x0;
        const wy = y - y0;
        
        const idx00 = y0 * width + x0;
        const idx10 = y0 * width + x1;
        const idx01 = y1 * width + x0;
        const idx11 = y1 * width + x1;
        
        const mag00 = Math.sqrt(uArray[idx00] * uArray[idx00] + vArray[idx00] * vArray[idx00]);
        const mag10 = Math.sqrt(uArray[idx10] * uArray[idx10] + vArray[idx10] * vArray[idx10]);
        const mag01 = Math.sqrt(uArray[idx01] * uArray[idx01] + vArray[idx01] * vArray[idx01]);
        const mag11 = Math.sqrt(uArray[idx11] * uArray[idx11] + vArray[idx11] * vArray[idx11]);
        
        const mag0 = mag00 * (1 - wx) + mag10 * wx;
        const mag1 = mag01 * (1 - wx) + mag11 * wx;
        
        return mag0 * (1 - wy) + mag1 * wy;
    }
    
    /**
     * 从颜色映射中获取颜色
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
     * 解析颜色字符串
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
        if (this.entity) {
            this.viewer.entities.remove(this.entity);
            this.entity = null;
        }
    }
    
    /**
     * 显示/隐藏
     */
    setShow(show) {
        if (this.entity) {
            this.entity.show = show;
        }
    }
}
