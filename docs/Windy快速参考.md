# Windy 气象图层快速参考

## 🚀 快速启用

```
1. 点击顶部"气象监测"选项卡
2. 点击右侧"气象图层"按钮
3. 展开"Windy 气象图层"
4. 激活任意子图层
```

## 📊 可用图层

| 图层名称 | 说明 | 用途 |
|---------|------|------|
| 🌬️ 风场动画 | 实时风场流线 | 航线规划、风险评估 |
| 🌡️ 温度分布 | 全球温度图 | 气候分析 |
| ☁️ 云层覆盖 | 云层分布 | 天气预判 |
| 🌧️ 降雨预报 | 降雨量预报 | 作业计划 |
| 🌊 海浪高度 | 海浪分布 | 海上安全 |
| 📊 气压分布 | 气压系统 | 天气系统分析 |

## ⚙️ 配置文件

### 环境变量 (.env)
```env
VITE_WINDY_API_KEY="oB3mCLJA5EZIsILHbC1Ksim0g3hrNpXM"
```

### 图层配置 (src/constants.js)
```javascript
{
    id: 'windy',
    label: 'Windy 气象图层',
    active: true,
    subLayers: [...]
}
```

## 🔧 核心 API

### WindyLayerManager

```javascript
// 初始化
await windyLayerManager.initialize();

// 显示图层
await windyLayerManager.showLayer('wind');

// 隐藏图层
windyLayerManager.hideLayer();

// 切换图层
await windyLayerManager.toggleLayer('temp', true);

// 销毁
windyLayerManager.destroy();
```

## 📝 图层参数

| 参数 | 类型 | 说明 |
|-----|------|------|
| wind | string | 风场 |
| temp | string | 温度 |
| clouds | string | 云层 |
| rain | string | 降雨 |
| waves | string | 海浪 |
| pressure | string | 气压 |

## 🎯 使用技巧

### ✅ 推荐做法
- 根据需求选择合适的图层
- 不使用时及时关闭
- 结合其他数据源对比分析

### ❌ 避免做法
- 同时激活多个 Windy 图层
- 长时间开启动画图层
- 在低配置设备上过度使用

## 🐛 故障排查

### 图层不显示
```
1. 检查 API Key 是否正确
2. 查看浏览器控制台错误
3. 确认网络连接正常
4. 刷新页面重试
```

### 视角不同步
```
1. 等待初始化完成
2. 移动地图触发同步
3. 刷新页面重新加载
```

### 加载缓慢
```
1. 检查网络速度
2. 等待数据加载完成
3. 考虑使用其他图层
```

## 📚 相关文档

- [Windy 集成说明](./Windy集成说明.md) - 技术文档
- [Windy 使用示例](./Windy使用示例.md) - 使用指南
- [Windy API 官方文档](https://api.windy.com/map-forecast/api)

## 🔗 快速链接

- 配置文件: `src/constants.js`
- 管理器: `src/utils/windyLayer.js`
- 地图组件: `src/components/MapContainer.vue`
- 面板组件: `src/components/LeftPanel.vue`

## 💡 提示

- Windy 图层需要联网使用
- 首次加载需要几秒钟
- 支持时间轴控制（未来版本）
- 数据每 3-6 小时更新一次

---

**快速参考卡片 v1.0** | 更新时间: 2024-12-25
