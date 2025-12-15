# 🔍 快速调试 - 风场按钮无反应

## 现在请这样做：

### 1. 刷新浏览器页面

按 **Ctrl + F5** 强制刷新（清除缓存）

### 2. 打开开发者工具

按 **F12** 键

### 3. 切换到 Console 标签页

点击顶部的 "Console" 标签

### 4. 点击风场按钮

点击地图右侧工具栏的箭头按钮 ➡️

### 5. 查看输出

你应该会看到类似这样的详细输出：

```
🔘 风场按钮被点击
📍 Viewer 状态: ✅ 存在
🌬️ WindLayer 状态: ⚠️ 未初始化
👁️ 当前显示状态: 隐藏中
⏳ 首次点击，开始初始化风场图层...
🔧 initWindLayer 被调用
   - viewer 存在: true
   - windLayer 已存在: false
🌬️ 开始加载风场数据...
⏳ 调用 generatePacificWindData()...
✅ 风场数据生成成功
📊 风场数据详情: {范围: "经度 -180° 到 -60°, 纬度 -60° 到 60°", 分辨率: "100 × 200", ...}
⏳ 创建 WindLayer 实例...
   - WindLayer 构造函数: function
✅ WindLayer 实例创建成功
   - windLayer 对象: WindLayer {...}
   - windLayer.show 方法: function
   - windLayer.hide 方法: function
✅ 风场图层初始化完成
✅ 初始化完成，windLayer: 成功
⏳ 正在显示风场...
✅ 风场已显示
🎨 已请求场景渲染
```

---

## 如果看到错误

### 错误 1: `WindLayer is not a constructor`

**说明**: cesium-wind-layer 未正确安装

**解决**:
```bash
npm install cesium-wind-layer@0.10.0
```

### 错误 2: `viewer 不存在`

**说明**: Cesium 地图未加载完成

**解决**: 等待几秒后再点击按钮

### 错误 3: 其他错误

**请将完整的错误信息发送给我**，包括：
- 红色的错误文本
- 错误堆栈信息

---

## 如果没有任何输出

说明按钮点击事件未触发，可能原因：

1. **按钮被遮挡** - 检查是否有其他元素覆盖
2. **事件未绑定** - 刷新页面重试
3. **JavaScript 错误** - 查看 Console 是否有其他错误

---

## 如果看到"风场已显示"但看不到效果

尝试以下方法：

### 方法 1: 调整相机位置

在 Console 中输入：
```javascript
viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(-120, 0, 8000000)
});
```

### 方法 2: 增加粒子数量

编辑 `src/components/MapContainer.vue`，找到：
```javascript
particlesTextureSize: 128
```
改为：
```javascript
particlesTextureSize: 256
```

### 方法 3: 增加线宽

找到：
```javascript
lineWidth: 3.0
```
改为：
```javascript
lineWidth: 8.0
```

---

## 需要帮助？

请截图或复制 Console 中的完整输出发送给我！
