# GeoJSON 数据加载说明

## 📁 文件位置

请将 `ocean_mining_final.geojson` 文件放置在：
```
public/data/ocean_mining_final.geojson
```

## ✅ 已实现功能

### 1. 自动加载数据
- 系统启动后自动加载 GeoJSON 数据
- 数据以青色半透明多边形显示在地图上
- 边框为青色，宽度 2px

### 2. 点击交互
- 点击任意矿区多边形
- 自动显示该区域的详细信息弹窗
- 选中区域会高亮显示（黄色）

### 3. 数据字段映射
系统会自动识别以下字段（中英文均支持）：
- `contractor` / `承包者` - 承包者名称
- `guarantor` / `担保国` - 担保国家
- `type` / `矿种类型` - 矿种类型
- `location` / `矿区位置` - 位置信息
- `startDate` / `开始日期` - 合同开始日期
- `endDate` / `结束日期` - 合同结束日期
- `area` / `面积` - 矿区面积

## 🎨 自定义样式

### 修改默认颜色
在 `MapContainer.vue` 的 `loadMiningData` 函数中修改：

```javascript
dataSource = await loadGeoJson(viewer, '/data/ocean_mining_final.geojson', {
    strokeColor: Cesium.Color.RED,  // 边框颜色
    fillColor: Cesium.Color.RED.withAlpha(0.5),  // 填充颜色
    strokeWidth: 3,  // 边框宽度
    clampToGround: false
});
```

### 根据属性设置不同颜色
取消注释这行代码：
```javascript
styleByProperty(dataSource, 'type', ColorSchemes.mineralType);
```

这会根据矿种类型自动设置不同颜色：
- 多金属结核 → 黄色
- 富钴结壳 → 橙色
- 多金属硫化物 → 红色
- 稀土 → 紫色

### 自定义颜色方案
在 `geoJsonLoader.js` 中修改 `ColorSchemes` 对象。

## 🔧 工具函数

### loadGeoJson
加载 GeoJSON 文件到 Cesium

```javascript
const dataSource = await loadGeoJson(viewer, url, options);
```

### styleByProperty
根据属性值设置不同颜色

```javascript
styleByProperty(dataSource, 'propertyName', colorFunction);
```

### setupClickHandler
设置点击事件处理

```javascript
const handler = setupClickHandler(viewer, (properties, entity) => {
    console.log('点击的属性:', properties);
});
```

### highlightEntity
高亮显示实体

```javascript
highlightEntity(entity, Cesium.Color.YELLOW.withAlpha(0.8));
```

## 📊 数据格式要求

GeoJSON 文件应符合标准格式：

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[lon, lat], [lon, lat], ...]]
      },
      "properties": {
        "contractor": "承包者名称",
        "guarantor": "担保国",
        "type": "矿种类型",
        "location": "位置",
        "startDate": "2020-01-01",
        "endDate": "2035-12-31",
        "area": "1000"
      }
    }
  ]
}
```

## 🚀 使用步骤

1. 将 GeoJSON 文件放到 `public/data/` 目录
2. 启动项目：`npm run dev`
3. 打开浏览器，数据会自动加载
4. 点击地图上的矿区查看详细信息

## ⚠️ 注意事项

- 确保 GeoJSON 文件格式正确
- 大文件可能需要较长加载时间
- 建议文件大小不超过 10MB
- 如果数据量很大，考虑使用 3D Tiles 格式

## 🐛 故障排查

### 数据不显示
1. 检查浏览器控制台是否有错误
2. 确认文件路径正确：`public/data/ocean_mining_final.geojson`
3. 检查 GeoJSON 格式是否正确

### 点击无反应
1. 确保数据已加载完成（查看控制台日志）
2. 检查数据是否有 polygon 几何类型
3. 尝试放大地图后再点击
