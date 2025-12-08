# 🌊 风场流线效果配置

## ✨ 新的流线效果

已将风场从稀疏的点状粒子改为**密集的流线效果**，类似你提供的图片！

## 🎯 区域设置

### 小区域高密度显示
- **区域**: 中国东海到西太平洋
- **经度**: 110° 到 150°（40度范围）
- **纬度**: 10° 到 40°（30度范围）
- **分辨率**: 60 × 80（高密度网格）

### 风场模式
创建了一个**旋转涡旋**（类似台风）：
- **中心位置**: 经度 130°，纬度 25°
- **效果**: 逆时针旋转 + 向外扩散
- **风速**: 中心最强，向外递减

## 🎨 流线效果参数

### 超高密度粒子
```javascript
particlesTextureSize: 512  // 512×512 = 262,144 个粒子！
```

### 细长流线
```javascript
lineWidth: {
    min: 1.5,
    max: 3.0    // 细线条
},
lineLength: {
    min: 50,
    max: 150    // 长拖尾，形成流线
}
```

### 持久流动
```javascript
dropRate: 0.001,      // 粒子存活更久
dropRateBump: 0.005,  // 缓慢消失
speedFactor: 2.0      // 快速流动
```

### 青色系配色
```javascript
colors: [
    '#00ffff',  // 青色
    '#00ff88',  // 青绿
    '#00ffaa',  // 浅青
    '#00ffcc',  // 亮青
    '#00ffff'   // 青色
]
```

## 🚀 测试步骤

1. **刷新浏览器**
   ```
   按 Ctrl + Shift + R
   ```

2. **点击风场按钮** ➡️

3. **等待相机飞行**
   - 会自动飞到中国东海上空
   - 高度 3000km，俯视角度 60°

4. **观察效果**
   - 应该看到密集的青色流线
   - 流线呈旋转涡旋状
   - 中心风速最快，向外递减

## 🎛️ 调整效果

### 如果流线太密集
在控制台输入：
```javascript
windLayer.updateOptions({
    particlesTextureSize: 256,  // 减少粒子
    lineLength: { min: 30, max: 80 }  // 缩短拖尾
});
```

### 如果流线太稀疏
在控制台输入：
```javascript
windLayer.updateOptions({
    particlesTextureSize: 1024,  // 增加粒子（最大值）
    lineLength: { min: 80, max: 200 }  // 加长拖尾
});
```

### 如果想要不同颜色
在控制台输入：
```javascript
// 蓝色系
windLayer.updateOptions({
    colors: ['#0000ff', '#0088ff', '#00aaff', '#00ccff', '#00ffff']
});

// 绿色系
windLayer.updateOptions({
    colors: ['#00ff00', '#00ff88', '#88ff88', '#aaffaa', '#ccffcc']
});

// 彩虹色
windLayer.updateOptions({
    colors: ['#00ffff', '#00ff00', '#ffff00', '#ff6600', '#ff0000']
});
```

### 调整相机位置
```javascript
// 更近的视角
viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(130, 25, 2000000),
    duration: 2
});

// 更远的视角
viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(130, 25, 5000000),
    duration: 2
});

// 正俯视
viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(130, 25, 3000000),
    orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-90),
        roll: 0
    },
    duration: 2
});
```

## 🌀 风场模式说明

当前的涡旋风场模拟了类似**台风**的效果：

1. **旋转分量**: 逆时针旋转（北半球台风特征）
2. **径向分量**: 向外扩散
3. **随机扰动**: 让流场更自然

### 数学公式
```javascript
// 切向速度（旋转）
windSpeed = 15 * exp(-distance / 10)
tangentialU = -windSpeed * sin(angle)
tangentialV = windSpeed * cos(angle)

// 径向速度（扩散）
radialSpeed = 5 * (1 - exp(-distance / 5))
radialU = radialSpeed * cos(angle)
radialV = radialSpeed * sin(angle)
```

## 🎯 预期效果

成功后应该看到：
- ✅ 密集的青色流线
- ✅ 流线呈旋转涡旋状
- ✅ 流线长度不一，形成层次感
- ✅ 流动平滑自然
- ✅ 类似你提供的图片效果

## 📝 下一步

如果效果满意，可以：
1. 调整涡旋参数（位置、强度、大小）
2. 添加多个涡旋
3. 加载真实气象数据
4. 添加时间轴动画
5. 添加交互控制面板

## 🎉 完成！

现在应该能看到漂亮的流线效果了！🌊✨
