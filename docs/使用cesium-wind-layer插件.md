# 使用 cesium-wind-layer 插件实现风场可视化

## 📋 改进说明

已将自定义的 `CanvasWindLayer` 替换为官方的 `cesium-wind-layer` 插件。

## 🔄 主要变更

### 1. 新增适配器文件

**文件**: `src/utils/cesiumWindLayerAdapter.js`

提供了以下功能：
- `convertToWindLayerFormat()`: 将稀疏数据转换为插件所需的网格格式
- `createWindLayer()`: 创建 WindLayer 实例
- `CesiumWindLayerWrapper`: 包装类，提供统一接口

### 2. 修改 MapContainer.vue

**变更内容**:
```javascript
// 之前：使用自定义 CanvasWindLayer
import { CanvasWindLayer } from '../utils/CanvasWindLayer.js';
windLayer = new CanvasWindLayer(viewer, windData, {...});

// 现在：使用官方插件
import { CesiumWindLayerWrapper } from '../utils/cesiumWindLayerAdapter.js';
windLayer = new CesiumWindLayerWrapper(viewer, windData, {...});
```

## ✨ 优势对比

| 特性 | 自定义 CanvasWindLayer | cesium-wind-layer 插件 |
|------|----------------------|----------------------|
| 渲染方式 | Canvas 2D | WebGL (Primitive) |
| 性能 | 较低（CPU计算） | 高（GPU加速） |
| 与Cesium集成 | 叠加层 | 原生集成 |
| 相机移动 | 闪烁 | 平滑 |
| 3D支持 | 有限 | 完整支持 |
| 坐标转换 | 每帧转换 | 无需转换 |
| 维护性 | 需自行维护 | 社区维护 |

## 🎨 配置选项

### 粒子系统配置

```javascript
{
    particleSystemOptions: {
        maxParticles: 64 * 64,        // 粒子数量（4096）
        particleHeight: 100.0,         // 粒子高度（米）
        fadeOpacity: 0.996,            // 淡出速度（0-1）
        dropRate: 0.003,               // 粒子重生率
        dropRateBump: 0.01,            // 粒子重生率增量
        speedFactor: 1.0,              // 速度因子
        lineWidth: 4.0                 // 线宽（像素）
    }
}
```

### 参数说明

- **maxParticles**: 粒子总数，影响视觉密度和性能
- **particleHeight**: 粒子距离地面的高度
- **fadeOpacity**: 粒子淡出速度，越接近1拖尾越长
- **dropRate**: 粒子重生的基础概率
- **dropRateBump**: 粒子重生的额外概率
- **speedFactor**: 粒子移动速度的缩放因子
- **lineWidth**: 粒子轨迹的线宽

## 🔧 数据格式转换

### 输入格式（稀疏数据）
```javascript
{
    sparseData: [
        { lat: 87.0, lon: -180.0, u: 0.52, v: 4.69 },
        ...
    ],
    bounds: { west, south, east, north }
}
```

### 输出格式（网格数据）
```javascript
{
    u: {
        array: Float32Array,  // nx * ny 大小
        min: number,
        max: number
    },
    v: {
        array: Float32Array,
        min: number,
        max: number
    },
    width: nx,
    height: ny,
    bounds: { west, south, east, north }
}
```

## 📊 性能优化

### 1. 粒子数量调整
```javascript
// 低端设备
maxParticles: 32 * 32  // 1024个粒子

// 中端设备
maxParticles: 64 * 64  // 4096个粒子（默认）

// 高端设备
maxParticles: 128 * 128  // 16384个粒子
```

### 2. 淡出速度调整
```javascript
// 快速淡出（短拖尾）
fadeOpacity: 0.98

// 中等淡出（默认）
fadeOpacity: 0.996

// 慢速淡出（长拖尾）
fadeOpacity: 0.999
```

## 🧪 测试

### 运行测试页面
```bash
# 启动开发服务器
npm run dev

# 访问测试页面
http://localhost:3000/test-cesium-wind-plugin.html
```

### 测试检查项
- ✅ Cesium 版本 1.108.0
- ✅ cesium-wind-layer 插件加载
- ✅ 风场数据加载
- ✅ 风场显示正常
- ✅ 粒子流动平滑

## 🐛 常见问题

### Q1: 风场不显示
**检查**:
1. 浏览器控制台是否有错误
2. 数据是否正确加载
3. windLayer.show 是否为 true

### Q2: 粒子太少或太多
**调整**: 修改 `maxParticles` 参数

### Q3: 拖尾太长或太短
**调整**: 修改 `fadeOpacity` 参数

### Q4: 粒子移动太快或太慢
**调整**: 修改 `speedFactor` 参数

## 📚 参考资源

- [cesium-wind-layer GitHub](https://github.com/hongfaqiu/cesium-wind-layer)
- [Cesium 官方文档](https://cesium.com/docs/)
- [WebGL 粒子系统](https://webglfundamentals.org/)

## 🎯 下一步优化

1. **添加颜色映射**: 根据风速显示不同颜色
2. **时间序列**: 支持风场动画
3. **多层风场**: 显示不同高度的风场
4. **交互控制**: UI面板调整参数
5. **性能监控**: 显示FPS和粒子数

## ✅ 完成状态

- ✅ 替换为官方插件
- ✅ 数据格式转换
- ✅ 配置参数优化
- ✅ 测试页面创建
- ✅ 文档编写完成

---

**更新时间**: 2024-12-15  
**版本**: cesium-wind-layer@0.10.0  
**Cesium版本**: 1.108.0
