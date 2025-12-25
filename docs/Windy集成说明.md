# Windy 气象图层集成说明

## 概述

已成功将 Windy 气象图层集成到深海采矿海洋气象预报保障系统中。Windy 提供了高质量的全球气象数据可视化，包括风场、温度、云层、降雨、海浪和气压等多种气象要素。

## 功能特性

### 支持的图层

1. **风场动画** - 实时风场流线动画
2. **温度分布** - 全球温度分布图
3. **云层覆盖** - 云层覆盖情况
4. **降雨预报** - 降雨量预报
5. **海浪高度** - 海浪高度分布
6. **气压分布** - 大气压力分布

### 主要特点

- ✅ 与 Cesium 地图无缝集成
- ✅ 支持时间轴控制（查看未来预报）
- ✅ 自动同步 Cesium 和 Windy 的视角
- ✅ 支持多图层切换
- ✅ 高质量的气象数据可视化

## 使用方法

### 1. 打开气象图层面板

在主界面左侧，点击"气象图层"按钮，展开气象图层控制面板。

### 2. 选择 Windy 图层

在气象图层面板中，找到"Windy 气象图层"分组，点击展开。

### 3. 激活图层

点击任意子图层（如"风场动画"、"温度分布"等）右侧的开关，即可激活该图层。

### 4. 切换图层

- 同一时间只能显示一个 Windy 图层
- 切换到其他图层时，当前图层会自动隐藏
- 关闭图层开关可以隐藏 Windy 图层

## 技术实现

### 文件结构

```
src/
├── utils/
│   └── windyLayer.js          # Windy 图层管理器
├── components/
│   ├── MapContainer.vue       # 地图容器（集成 Windy）
│   └── LeftPanel.vue          # 左侧面板（气象图层控制）
├── constants.js               # 配置常量（包含 Windy 图层定义）
└── .env                       # 环境变量（Windy API Key）
```

### 核心类：WindyLayerManager

位置：`src/utils/windyLayer.js`

主要方法：
- `initialize()` - 初始化 Windy API
- `showLayer(layerName)` - 显示指定图层
- `hideLayer()` - 隐藏当前图层
- `toggleLayer(layerName, visible)` - 切换图层显示状态
- `destroy()` - 销毁图层管理器

### 配置说明

#### API Key 配置

在 `.env` 文件中配置 Windy API Key：

```env
VITE_WINDY_API_KEY="oB3mCLJA5EZIsILHbC1Ksim0g3hrNpXM"
```

#### 图层配置

在 `src/constants.js` 中的 `WEATHER_LAYER_GROUPS` 数组中配置 Windy 图层：

```javascript
{
    id: 'windy',
    label: 'Windy 气象图层',
    active: true,
    subLayers: [
        { 
            id: 'windy_wind', 
            label: '风场动画', 
            active: false, 
            hasTimeline: true, 
            dataSource: 'Windy',
            type: 'windy',
            layer: 'wind'
        },
        // ... 其他图层
    ]
}
```

## 视角同步机制

Windy 图层会自动与 Cesium 地图的视角保持同步：

1. 当用户在 Cesium 地图上移动、缩放时
2. WindyLayerManager 会监听相机移动事件
3. 自动更新 Windy 地图的中心点和缩放级别
4. 实现两个地图的视角一致

## 注意事项

1. **性能考虑**
   - Windy 图层会占用一定的系统资源
   - 建议在需要时才激活图层
   - 不使用时及时关闭

2. **网络要求**
   - Windy 图层需要联网加载数据
   - 首次加载可能需要几秒钟
   - 建议在良好的网络环境下使用

3. **浏览器兼容性**
   - 推荐使用 Chrome、Edge、Firefox 等现代浏览器
   - 需要支持 WebGL 和 ES6+

4. **API Key 限制**
   - 免费版 API Key 有请求次数限制
   - 如需大量使用，建议升级到付费版

## 故障排查

### 问题：Windy 图层无法显示

**可能原因：**
1. API Key 未配置或无效
2. 网络连接问题
3. Windy API 服务不可用

**解决方法：**
1. 检查 `.env` 文件中的 API Key 是否正确
2. 打开浏览器控制台查看错误信息
3. 检查网络连接是否正常
4. 访问 https://api.windy.com 检查服务状态

### 问题：视角不同步

**可能原因：**
1. 初始化未完成
2. 相机事件监听失败

**解决方法：**
1. 等待几秒钟让 Windy 完全初始化
2. 刷新页面重新加载
3. 查看控制台是否有错误信息

## 未来改进

- [ ] 支持时间轴控制（查看历史和未来预报）
- [ ] 添加图层透明度调节
- [ ] 支持自定义配色方案
- [ ] 添加图层图例说明
- [ ] 优化加载性能

## 参考资料

- [Windy API 官方文档](https://api.windy.com/map-forecast/api)
- [Cesium 官方文档](https://cesium.com/docs/)
- [项目技术文档](./03-后端实现.md)

## 更新日志

### 2024-12-25
- ✅ 完成 Windy 图层基础集成
- ✅ 实现视角自动同步
- ✅ 添加 6 种气象图层支持
- ✅ 完成配置和文档
