# 🔍 风场可见性测试指南

## ✅ 当前状态

- ✅ 没有报错
- ✅ WindLayer 实例创建成功
- ✅ 绿色指示灯显示
- ⚠️ 粒子不可见

## 🎯 可能的原因

### 1. 相机位置不对
粒子可能在视野之外。

### 2. 粒子参数太小
粒子可能太小或太透明。

### 3. 渲染模式问题
Cesium 的按需渲染可能影响动画。

## 🔧 已应用的修复

### 增加粒子可见性
```javascript
particlesTextureSize: 256,  // 从 128 增加到 256（更多粒子）
particleHeight: 100000,     // 从 50000 增加到 100000（更高）
lineWidth: {
    min: 2.0,
    max: 8.0                // 从 3.0 增加到 8.0（更粗）
},
speedFactor: 1.5,           // 从 0.8 增加到 1.5（更快）
colors: ['#ffffff', ...],   // 添加白色，更明显
dynamic: true               // 确保动画开启
```

### 自动飞到风场区域
初始化后会自动飞到太平洋中部（经度 -120°，纬度 0°），高度 8000km，倾斜 45°。

## 🧪 测试步骤

### 步骤 1: 刷新并初始化
1. 按 `Ctrl + Shift + R` 强制刷新
2. 点击风场按钮 ➡️
3. 等待相机自动飞到风场区域（2秒）

### 步骤 2: 检查控制台
应该看到：
```
✅ 风场已显示
   - windLayer.show 当前值: true
   - windLayer._show 内部值: true
   - 粒子系统: [Object]
🎨 已请求场景渲染
🎯 飞往风场区域...
```

### 步骤 3: 手动调整视角
如果还是看不到，在控制台输入：

```javascript
// 方法 1: 更近的视角
viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(-120, 0, 5000000),
    orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-30),
        roll: 0
    },
    duration: 2
});
```

```javascript
// 方法 2: 俯视视角
viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(-120, 0, 10000000),
    orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-90),
        roll: 0
    },
    duration: 2
});
```

```javascript
// 方法 3: 飞到太平洋矿区
viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(-140, 10, 8000000),
    duration: 2
});
```

### 步骤 4: 调整粒子参数
如果还是看不到，在控制台输入：

```javascript
// 增加粒子数量和大小
windLayer.updateOptions({
    particlesTextureSize: 512,
    lineWidth: {
        min: 5.0,
        max: 15.0
    },
    speedFactor: 2.0,
    colors: ['#ffffff', '#ffffff', '#00ffff', '#ffff00', '#ff0000']
});
```

### 步骤 5: 检查渲染模式
在控制台输入：

```javascript
// 禁用按需渲染，改为持续渲染
viewer.scene.requestRenderMode = false;
console.log('已切换到持续渲染模式');
```

### 步骤 6: 检查粒子系统
在控制台输入：

```javascript
// 检查粒子系统状态
console.log('WindLayer 状态:', {
    show: windLayer.show,
    _show: windLayer._show,
    particleSystem: windLayer.particleSystem,
    primitives: windLayer.primitives,
    windData: windLayer.windData
});
```

## 🎨 预期效果

成功后应该看到：
- ✅ 流动的彩色粒子线条
- ✅ 粒子从青色到红色渐变（根据风速）
- ✅ 粒子沿着风向移动
- ✅ 动画流畅

## 🐛 如果还是看不到

### 检查 1: 数据范围
在控制台输入：
```javascript
console.log('风场数据范围:', windLayer.windData.bounds);
console.log('当前相机位置:', viewer.camera.positionCartographic);
```

确认相机在数据范围内：
- 经度: -180° 到 -60°
- 纬度: -60° 到 60°

### 检查 2: WebGL 支持
在控制台输入：
```javascript
console.log('WebGL 支持:', viewer.scene.context.webgl2);
console.log('最大纹理大小:', viewer.scene.context.maximumTextureSize);
```

### 检查 3: 尝试全球数据
如果太平洋数据有问题，可以尝试全球数据。

在控制台输入：
```javascript
import { generateSampleWindData } from './src/utils/windDataLoader.js';
const globalData = generateSampleWindData();
windLayer.updateWindData(globalData);
windLayer.zoomTo(2);
```

## 📝 报告问题

如果以上方法都不行，请提供：
1. 控制台完整输出
2. 浏览器和版本
3. 显卡信息
4. 截图

## 🚀 下一步

一旦粒子可见，可以：
1. 调整颜色方案
2. 加载真实气象数据
3. 添加图例和控制面板
4. 优化性能
