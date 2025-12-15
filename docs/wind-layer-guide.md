# Cesium 风场图层集成指南

## 概述

已成功集成 `cesium-wind-layer` 插件到 MapContainer.vue 组件中，用于可视化海洋风场数据。

## 功能特性

- ✅ 风场粒子动画效果
- ✅ 自定义颜色渐变（根据风速）
- ✅ 可调节粒子密度和速度
- ✅ 一键显示/隐藏风场
- ✅ 支持太平洋区域风场数据

## 使用方法

### 1. 显示/隐藏风场

在地图右侧工具栏中，点击**风场按钮**（带箭头图标）即可切换风场显示状态。

### 2. 自定义风场参数

在 `MapContainer.vue` 的 `initWindLayer` 函数中，可以调整以下参数：

```javascript
windLayer = new WindLayer(viewer, windData, {
    particlesTextureSize: 128,  // 粒子纹理大小（64-256，越大粒子越多）
    particleHeight: 50000,      // 粒子高度（米）
    lineWidth: 3.0,             // 线宽（1.0-5.0）
    speedFactor: 0.8,           // 速度因子（0.1-2.0）
    dropRate: 0.003,            // 粒子消失率（0.001-0.01）
    dropRateBump: 0.01,         // 粒子消失率增量
    colors: [                   // 颜色渐变（从低速到高速）
        '#00ffff',  // 青色（低速）
        '#00ff00',  // 绿色
        '#ffff00',  // 黄色
        '#ff6600',  // 橙色
        '#ff0000'   // 红色（高速）
    ],
    frameRate: 20               // 帧率（10-60）
});
```

### 3. 加载真实风场数据

#### 方法 A：使用示例数据（当前）

```javascript
import { generatePacificWindData } from '../utils/windDataLoader.js';
const windData = generatePacificWindData();
```

#### 方法 B：从 JSON 文件加载

```javascript
import { loadWindDataFromJSON } from '../utils/windDataLoader.js';
const windData = await loadWindDataFromJSON('/data/wind-data.json');
```

JSON 数据格式：
```json
{
  "xmin": -180,
  "xmax": 180,
  "ymin": -90,
  "ymax": 90,
  "rows": 180,
  "cols": 360,
  "uData": [/* Float32Array 或数组 */],
  "vData": [/* Float32Array 或数组 */]
}
```

#### 方法 C：从气象 API 获取（推荐）

可以使用以下免费气象数据源：

1. **NOAA GFS 数据**
   - URL: https://nomads.ncep.noaa.gov/
   - 格式: GRIB2 / NetCDF
   - 需要后端转换

2. **OpenWeatherMap API**
   - URL: https://openweathermap.org/api
   - 格式: JSON
   - 需要 API Key

3. **Windy API**
   - URL: https://api.windy.com/
   - 格式: JSON
   - 需要 API Key

示例代码：
```javascript
async function loadRealWindData() {
    const response = await fetch('YOUR_API_ENDPOINT');
    const data = await response.json();
    
    // 转换为 cesium-wind-layer 格式
    return {
        xmin: data.bounds.west,
        xmax: data.bounds.east,
        ymin: data.bounds.south,
        ymax: data.bounds.north,
        rows: data.grid.rows,
        cols: data.grid.cols,
        uData: new Float32Array(data.u),
        vData: new Float32Array(data.v)
    };
}
```

## 风场数据说明

### 数据格式

- **uData**: U 分量（东西方向风速），正值表示向东，负值表示向西
- **vData**: V 分量（南北方向风速），正值表示向北，负值表示向南
- **单位**: 通常为 m/s（米/秒）

### 数据范围

- **经度 (xmin, xmax)**: -180° 到 180°
- **纬度 (ymin, ymax)**: -90° 到 90°
- **分辨率**: rows × cols（例如 180×360 表示 1° 分辨率）

### 当前示例数据

- **区域**: 太平洋（经度 -180° 到 -60°，纬度 -60° 到 60°）
- **分辨率**: 100 × 200
- **特点**: 模拟了信风带、西风带、赤道无风带等真实风场模式

## 性能优化建议

1. **降低粒子密度**
   ```javascript
   particlesTextureSize: 64  // 从 128 降到 64
   ```

2. **减少数据分辨率**
   ```javascript
   // 使用较低分辨率的风场数据（例如 90×180 而不是 180×360）
   ```

3. **按需加载**
   ```javascript
   // 只在用户点击按钮时才初始化风场图层（当前已实现）
   ```

4. **限制显示区域**
   ```javascript
   // 只加载感兴趣区域的风场数据（例如太平洋矿区）
   ```

## 故障排查

### 问题 1: 风场不显示

**解决方案**:
- 检查浏览器控制台是否有错误
- 确认风场数据格式正确
- 尝试调整 `particleHeight` 参数

### 问题 2: 性能卡顿

**解决方案**:
- 降低 `particlesTextureSize`
- 减少 `frameRate`
- 使用较低分辨率的风场数据

### 问题 3: 颜色不明显

**解决方案**:
- 调整 `colors` 数组，使用对比度更高的颜色
- 增加 `lineWidth`
- 调整 `speedFactor`

## 扩展功能

### 1. 添加风速图例

可以在界面上添加一个图例，显示颜色与风速的对应关系。

### 2. 实时更新风场

```javascript
setInterval(async () => {
    const newWindData = await loadRealWindData();
    windLayer.updateData(newWindData);
}, 3600000); // 每小时更新一次
```

### 3. 多时间层风场

加载多个时间点的风场数据，实现时间轴播放功能。

## 参考资源

- [cesium-wind-layer GitHub](https://github.com/hongfaqiu/cesium-wind-layer)
- [Cesium 官方文档](https://cesium.com/docs/)
- [NOAA 气象数据](https://nomads.ncep.noaa.gov/)
- [OpenWeatherMap API](https://openweathermap.org/api)

## 技术支持

如有问题，请查看：
1. 浏览器控制台日志
2. `src/utils/windDataLoader.js` 工具函数
3. GitHub Issues: https://github.com/hongfaqiu/cesium-wind-layer/issues
