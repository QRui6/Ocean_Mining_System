# 时间轴调试指南

## 问题现象
拖动时间轴滑块时，风浪、洋流和内波数据不更新，始终显示第一帧数据。

## 调试步骤

### 1. 打开浏览器控制台
按 F12 打开开发者工具，切换到 Console 标签页

### 2. 启动应用
```bash
cd demo
npm run dev
```

### 3. 打开测试页面
在浏览器中访问：
- 主应用: http://localhost:5173
- 测试页面: http://localhost:5173/test-timeline-update.html

### 4. 在测试页面中验证后端API
1. 点击"测试后端API"按钮
2. 观察是否成功加载元数据和数据
3. 点击"加载索引 0/5/10/15"按钮
4. 观察不同索引的数据是否不同
5. 点击"对比索引 0 vs 5"按钮
6. 确认数据确实有差异

### 5. 在主应用中测试
1. 切换到"气象监测"选项卡
2. 点击"气象图层"按钮
3. 激活任意气象图层（如"风场"）
4. 等待数据加载完成
5. 观察底部是否出现时间轴
6. 打开浏览器控制台
7. 拖动时间轴滑块

### 6. 检查控制台日志

应该看到类似以下的日志序列：

```
⏰ TimelineControl.onTimeChange 触发: { currentIndex: "5", timeIndex: 5, ... }
⏰ App.vue 收到时间轴变化: { time: ..., index: 5, layerId: "wind" }
   - 时间索引: 5
   - mapContainerRef存在: true
   - updateWeatherTime方法存在: true
✅ 调用 MapContainer.updateWeatherTime，时间索引: 5
⏰ MapContainer.updateWeatherTime 被调用
   - 接收到的 timeIndex: 5 类型: number
   - showWind: true
   - 转换后的 index: 5
🌬️  重新加载风场数据，时间帧: 5
📡 请求气象数据(二进制): /api/backend/api/weather/data/wind/5/binary
✅ 气象数据(二进制)加载成功: { type: "wind", timeIndex: 5, size: 8306104 }
✅ 风场数据已更新
✅ updateWeatherTime 调用成功
```

### 7. 常见问题排查

#### 问题1: 没有看到 "TimelineControl.onTimeChange 触发"
**原因**: 时间轴组件没有正确触发事件
**解决**: 
- 检查时间轴是否显示
- 检查是否有气象图层被激活
- 尝试刷新页面

#### 问题2: 看到 "mapContainerRef存在: false"
**原因**: MapContainer 组件的 ref 没有正确绑定
**解决**:
- 检查 App.vue 中的 ref 绑定
- 确保组件已经挂载

#### 问题3: 看到 "updateWeatherTime方法存在: false"
**原因**: MapContainer 没有正确暴露 updateWeatherTime 方法
**解决**:
- 检查 MapContainer.vue 的 return 语句
- 确保 updateWeatherTime 在返回对象中

#### 问题4: 看到 "❌ 更新气象数据失败"
**原因**: 数据加载或图层更新失败
**解决**:
- 查看完整的错误信息
- 检查网络请求是否成功
- 检查后端API是否正常

#### 问题5: 日志显示成功但地图没有变化
**原因**: 图层没有正确更新或渲染
**解决**:
- 检查 waveLayer/windLayer 等变量是否为 null
- 检查图层的 show 属性是否为 true
- 尝试手动调用 viewer.scene.requestRender()

### 8. 手动测试 API

在浏览器控制台中执行：

```javascript
// 测试加载不同时间索引的数据
async function testTimeIndex(index) {
    const response = await fetch(`/api/backend/api/weather/data/wind/${index}/binary`);
    const buffer = await response.arrayBuffer();
    console.log(`索引 ${index} 数据大小:`, buffer.byteLength);
    
    // 解析数据
    const view = new DataView(buffer);
    const headerLength = view.getInt32(0, false);
    const headerBytes = new Uint8Array(buffer, 4, headerLength);
    const headerText = new TextDecoder().decode(headerBytes);
    const header = JSON.parse(headerText);
    
    console.log(`索引 ${index} 数据范围:`, {
        uMin: header.uMin,
        uMax: header.uMax,
        vMin: header.vMin,
        vMax: header.vMax
    });
}

// 测试索引 0 和 5
await testTimeIndex(0);
await testTimeIndex(5);
```

### 9. 强制更新测试

在浏览器控制台中执行：

```javascript
// 获取 Vue 应用实例（需要 Vue DevTools）
// 或者直接调用全局方法

// 方法1: 通过 window 对象（如果暴露了）
if (window.__VUE_APP__) {
    const app = window.__VUE_APP__;
    // 调用更新方法
}

// 方法2: 通过 Vue DevTools
// 选择 MapContainer 组件
// 在控制台中执行: $vm.updateWeatherTime(5)
```

### 10. 检查数据加载器

确认数据加载器正确使用时间索引：

```javascript
// 在 windDataLoaderAPI.js 中添加日志
export async function loadGlobalWindData(timeIndex = 0) {
    console.log('🔍 loadGlobalWindData 被调用，timeIndex:', timeIndex);
    // ... 其余代码
}
```

## 预期结果

正常情况下，拖动时间轴滑块应该：
1. 触发 TimelineControl 的 onTimeChange 事件
2. App.vue 接收事件并调用 MapContainer.updateWeatherTime()
3. MapContainer 重新加载对应时间索引的数据
4. 创建新的图层并替换旧图层
5. 地图上的气象数据可视化更新

## 如果问题仍然存在

请提供以下信息：
1. 完整的浏览器控制台日志
2. Network 标签页中的 API 请求记录
3. 是否有任何错误信息
4. 测试页面的测试结果
5. 浏览器版本和操作系统信息
