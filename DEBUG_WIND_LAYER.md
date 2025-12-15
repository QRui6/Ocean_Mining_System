# 🔍 风场图层调试指南

## 问题：点击风场按钮没有反应

### 调试步骤

#### 1. 打开浏览器开发者工具

按 **F12** 或右键点击页面选择"检查"

#### 2. 查看 Console 标签页

点击风场按钮后，查看控制台输出：

**预期输出**（首次点击）：
```
🌬️ 开始加载风场数据...
📊 风场数据: {范围: "经度 -180° 到 -60°, 纬度 -60° 到 60°", 分辨率: "100 × 200", 数据点: 20000}
✅ 风场图层初始化成功
🌬️ 风场已显示
```

**预期输出**（再次点击）：
```
🌬️ 风场已隐藏
```

#### 3. 检查错误信息

如果看到红色错误信息，请记录下来：

**常见错误**：

##### 错误 1: `WindLayer is not a constructor`
```
TypeError: WindLayer is not a constructor
```

**解决方案**：
```bash
npm install cesium-wind-layer@0.10.0
```

##### 错误 2: `Cannot read property 'scene' of null`
```
TypeError: Cannot read property 'scene' of null
```

**原因**：Cesium viewer 未初始化完成

**解决方案**：等待地图完全加载后再点击

##### 错误 3: `windData is undefined`
```
TypeError: windData is undefined
```

**解决方案**：检查 `windDataLoader.js` 是否正确导入

#### 4. 检查网络请求

在开发者工具的 **Network** 标签页中：
- 确认没有失败的请求（红色）
- 确认 Cesium 资源加载成功

#### 5. 检查元素

在开发者工具的 **Elements** 标签页中：
- 找到风场按钮元素
- 确认按钮有 `@click="toggleWindLayer"` 属性
- 确认按钮可以点击（没有被遮挡）

#### 6. 手动测试

在 Console 中输入以下命令测试：

```javascript
// 测试 1: 检查 viewer 是否存在
console.log('Viewer:', window.viewer);

// 测试 2: 检查风场数据生成
import { generatePacificWindData } from './src/utils/windDataLoader.js';
const windData = generatePacificWindData();
console.log('Wind Data:', windData);

// 测试 3: 检查 WindLayer 是否可用
import { WindLayer } from 'cesium-wind-layer';
console.log('WindLayer:', WindLayer);
```

### 常见问题

#### Q1: 按钮可以点击，但没有任何输出

**可能原因**：
1. 函数未正确绑定
2. viewer 未初始化
3. JavaScript 错误阻止执行

**检查**：
1. 查看 Console 是否有错误
2. 确认地图已完全加载
3. 刷新页面重试

#### Q2: 看到"开始加载风场数据"但没有后续输出

**可能原因**：
1. WindLayer 初始化失败
2. 风场数据格式错误
3. Cesium 版本不兼容

**检查**：
1. 查看完整的错误信息
2. 确认 Cesium 版本是 1.108.0
3. 确认 cesium-wind-layer 版本是 0.10.0

#### Q3: 看到"风场已显示"但看不到效果

**可能原因**：
1. 粒子太小或太少
2. 相机位置不对
3. 风场数据范围不对

**解决方案**：

1. **增加粒子数量**
   编辑 `MapContainer.vue`：
   ```javascript
   particlesTextureSize: 256  // 从 128 改为 256
   ```

2. **增加线宽**
   ```javascript
   lineWidth: 5.0  // 从 3.0 改为 5.0
   ```

3. **调整相机位置**
   在 Console 中输入：
   ```javascript
   viewer.camera.flyTo({
       destination: Cesium.Cartesian3.fromDegrees(-140, 10, 5000000)
   });
   ```

4. **使用全球数据**
   编辑 `MapContainer.vue`，替换：
   ```javascript
   import { generateSampleWindData } from '../utils/windDataLoader.js';
   const windData = generateSampleWindData();  // 使用全球数据
   ```

### 完整测试代码

在 Console 中粘贴以下代码进行完整测试：

```javascript
// 完整测试脚本
(async function testWindLayer() {
    console.log('=== 开始风场图层测试 ===');
    
    // 1. 检查依赖
    console.log('1. 检查 Cesium:', typeof Cesium !== 'undefined' ? '✅' : '❌');
    
    // 2. 检查 viewer
    const viewer = document.querySelector('.cesium-viewer');
    console.log('2. 检查 Viewer:', viewer ? '✅' : '❌');
    
    // 3. 检查按钮
    const windButton = document.querySelector('[title*="风场"]');
    console.log('3. 检查风场按钮:', windButton ? '✅' : '❌');
    
    // 4. 模拟点击
    if (windButton) {
        console.log('4. 模拟点击按钮...');
        windButton.click();
        
        // 等待 2 秒查看结果
        setTimeout(() => {
            console.log('=== 测试完成，请查看上方输出 ===');
        }, 2000);
    }
})();
```

### 获取帮助

如果以上步骤都无法解决问题，请提供：

1. **浏览器控制台的完整输出**（包括错误信息）
2. **浏览器版本**（Chrome/Firefox/Edge）
3. **操作系统**（Windows/Mac/Linux）
4. **package.json 中的版本信息**

---

## 快速修复

### 方案 1: 重新安装依赖

```bash
npm install
```

### 方案 2: 清除缓存

```bash
npm run dev -- --force
```

### 方案 3: 使用全球风场数据

编辑 `src/components/MapContainer.vue`：

```javascript
// 替换这一行
const windData = generatePacificWindData();

// 改为
import { generateSampleWindData } from '../utils/windDataLoader.js';
const windData = generateSampleWindData();
```

### 方案 4: 增加调试输出

在 `toggleWindLayer` 函数开头添加：

```javascript
const toggleWindLayer = async () => {
    console.log('🔘 风场按钮被点击');
    console.log('📍 Viewer 状态:', viewer ? '存在' : '不存在');
    console.log('🌬️ WindLayer 状态:', windLayer ? '已初始化' : '未初始化');
    console.log('👁️ 显示状态:', showWind.value);
    
    if (!viewer) {
        console.error('❌ Viewer 不存在，无法初始化风场');
        return;
    }
    
    // ... 原有代码
};
```

---

**需要更多帮助？** 请将浏览器控制台的输出截图发送给我。
