# Windy 图层故障排查指南

## 常见错误及解决方案

### 1. Cesium is not defined

**错误信息：**
```
ReferenceError: Cesium is not defined
at WindyLayerManager.getCesiumCenter
```

**原因：**
`windyLayer.js` 中没有导入 Cesium

**解决方案：**
在 `src/utils/windyLayer.js` 文件顶部添加：
```javascript
import * as Cesium from 'cesium';
```

### 2. windyInit is not defined

**错误信息：**
```
ReferenceError: windyInit is not defined
at WindyLayerManager.initialize
```

**原因：**
Windy API 脚本加载后，`windyInit` 函数需要时间才能在 `window` 对象上可用

**解决方案：**
已在代码中添加了以下修复：
1. 使用 `window.windyInit` 而不是直接使用 `windyInit`
2. 使用轮询方式等待 `windyInit` 函数可用（最多等待 5 秒）
3. 添加了详细的错误日志

如果仍然出现此错误：
1. 检查网络连接是否正常
2. 检查 Windy API 服务是否可用
3. 查看控制台的详细错误日志
4. 尝试刷新页面重新加载
5. 检查是否有防火墙或广告拦截器阻止了脚本加载

### 3. btoa is not defined / L is not defined

**错误信息：**
```
ReferenceError: btoa is not defined
ReferenceError: L is not defined
```

**原因：**
在某些构建环境中，全局函数（如 `btoa`、`atob`、`L` 等）可能不可用

**解决方案：**
已修复所有全局变量引用：
1. 将 `btoa(...)` 改为 `window.btoa(...)`
2. 将 `windyInit(...)` 改为 `window.windyInit(...)`

如果遇到其他类似错误：
- 将全局变量改为 `window.变量名`
- 例如：`fetch()` → `window.fetch()`
- 例如：`localStorage` → `window.localStorage`

### 4. handlePickPoint is not defined

**错误信息：**
```
[Vue warn]: Property "handlePickPoint" was accessed during render but is not defined on instance
```

**原因：**
`handlePickPoint` 函数定义了但没有在 return 语句中暴露

**解决方案：**
在 `MapContainer.vue` 的 return 语句中添加：
```javascript
return {
    // ... 其他属性
    handlePickPoint,  // 添加这一行
    // ... 其他属性
};
```

### 3. Windy 图层不显示

**可能原因：**
1. API Key 未配置或无效
2. 网络连接问题
3. Windy API 服务不可用
4. 初始化未完成

**排查步骤：**

#### 步骤 1：检查 API Key
```bash
# 查看 .env 文件
cat .env | grep WINDY
```

确保输出为：
```
VITE_WINDY_API_KEY="oB3mCLJA5EZIsILHbC1Ksim0g3hrNpXM"
```

#### 步骤 2：检查控制台
打开浏览器开发者工具（F12），查看 Console 标签页：
- 查找红色错误信息
- 查找 "Windy" 相关的日志
- 查找网络请求失败的信息

#### 步骤 3：检查网络
在 Network 标签页中：
- 查找 `api.windy.com` 的请求
- 检查请求状态是否为 200
- 检查是否有 CORS 错误

#### 步骤 4：重新加载
1. 刷新页面（Ctrl+R 或 Cmd+R）
2. 清除缓存后刷新（Ctrl+Shift+R 或 Cmd+Shift+R）
3. 重启开发服务器

### 4. 视角不同步

**症状：**
移动 Cesium 地图时，Windy 图层没有跟随

**可能原因：**
1. Windy 初始化未完成
2. 相机事件监听失败
3. 视角同步代码有问题

**解决方案：**

#### 方案 1：等待初始化
- 等待 2-3 秒让 Windy 完全初始化
- 然后再移动地图

#### 方案 2：检查控制台
查看是否有以下日志：
```
✅ Cesium-Windy 视角同步已启动
```

如果没有，说明同步未启动，需要检查代码。

#### 方案 3：手动触发同步
移动地图后，Windy 应该自动同步。如果没有，尝试：
1. 缩放地图
2. 旋转地图
3. 切换 2D/3D 视图

### 5. 图层切换失败

**症状：**
点击图层开关后，图层没有变化

**可能原因：**
1. 图层正在加载中
2. 上一个图层未正确清理
3. 图层配置错误

**解决方案：**

#### 方案 1：等待加载
- 图层切换需要 1-2 秒
- 等待加载完成后再操作

#### 方案 2：检查配置
在 `src/constants.js` 中检查图层配置：
```javascript
{
    id: 'windy_wind',
    label: '风场动画',
    active: false,
    hasTimeline: true,
    dataSource: 'Windy',
    type: 'windy',
    layer: 'wind'  // 确保这个值正确
}
```

#### 方案 3：重置状态
1. 关闭所有 Windy 图层
2. 等待 2 秒
3. 重新激活需要的图层

### 6. 内存泄漏

**症状：**
- 页面越来越慢
- 浏览器占用内存越来越大
- 最终浏览器崩溃

**可能原因：**
1. Windy 实例未正确销毁
2. 事件监听器未移除
3. 图层切换时未清理旧图层

**解决方案：**

#### 方案 1：检查销毁代码
在 `MapContainer.vue` 的 `onUnmounted` 中确保有：
```javascript
if (windyLayerManager) {
    windyLayerManager.destroy();
    windyLayerManager = null;
}
```

#### 方案 2：定期刷新
如果长时间使用，建议定期刷新页面：
- 每 30 分钟刷新一次
- 或在切换功能模块时刷新

#### 方案 3：监控内存
使用浏览器的 Performance 工具监控内存使用：
1. 打开开发者工具
2. 切换到 Performance 标签
3. 点击 Memory 复选框
4. 开始录制
5. 操作一段时间后停止
6. 查看内存曲线是否持续上升

### 7. 构建错误

**错误信息：**
```
Build failed
```

**排查步骤：**

#### 步骤 1：检查语法错误
```bash
npm run build
```

查看错误信息，定位到具体文件和行号。

#### 步骤 2：检查导入
确保所有导入都正确：
```javascript
// windyLayer.js
import * as Cesium from 'cesium';

// MapContainer.vue
import { WindyLayerManager } from '../utils/windyLayer.js';
```

#### 步骤 3：清理缓存
```bash
# 删除 node_modules 和 dist
rm -rf node_modules dist

# 重新安装依赖
npm install

# 重新构建
npm run build
```

### 8. 开发服务器启动失败

**错误信息：**
```
Error: Cannot find module 'xxx'
```

**解决方案：**

#### 方案 1：重新安装依赖
```bash
npm install
```

#### 方案 2：检查 Node 版本
```bash
node --version
```

确保 Node.js 版本 >= 16.0.0

#### 方案 3：清理缓存
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 调试技巧

### 1. 启用详细日志

在 `windyLayer.js` 中添加更多日志：
```javascript
console.log('🌪️ Windy 状态:', {
    isInitialized: this.isInitialized,
    currentLayer: this.currentLayer,
    windyAPI: !!this.windyAPI,
    windyMap: !!this.windyMap
});
```

### 2. 使用浏览器调试器

在关键位置设置断点：
1. `windyLayer.js` 的 `initialize()` 方法
2. `windyLayer.js` 的 `showLayer()` 方法
3. `MapContainer.vue` 的 `updateWeatherLayersVisibility()` 方法

### 3. 检查网络请求

在 Network 标签页中：
1. 筛选 `api.windy.com`
2. 查看请求和响应
3. 检查请求头和响应头
4. 查看响应内容

### 4. 性能分析

使用 Performance 工具：
1. 录制操作过程
2. 查看函数调用时间
3. 找出性能瓶颈
4. 优化慢速代码

## 获取帮助

如果以上方法都无法解决问题：

1. **查看文档**
   - [Windy 集成说明](./Windy集成说明.md)
   - [Windy 使用示例](./Windy使用示例.md)
   - [Windy API 官方文档](https://api.windy.com/map-forecast/api)

2. **收集信息**
   - 浏览器类型和版本
   - 操作系统
   - 错误信息截图
   - 控制台日志
   - 复现步骤

3. **提交 Issue**
   - 在项目仓库提交 Issue
   - 附上收集的信息
   - 描述期望的行为和实际行为

4. **联系技术支持**
   - 提供详细的问题描述
   - 附上相关日志和截图

---

**更新时间**: 2024-12-25  
**版本**: v1.0
