# 深海采矿的海洋气象预报保障系统

一个基于 Vue 3 + Vite + Cesium 的海洋气象可视化系统，采用手工构建方式，适合学习现代前端工程化。

## ✨ 特性

- 🌍 **3D 地球可视化** - 基于 Cesium 实现的三维地球展示
- 🗺️ **天地图集成** - 使用天地图服务提供地图数据
- 🌪️ **Windy 气象图层** - 集成 Windy 实时气象数据可视化
- 📊 **数据可视化** - 矿区数据的多维度展示
- 🎨 **科技感 UI** - 现代化的用户界面设计
- ⚡ **快速开发** - Vite 提供极速的开发体验
- 📱 **响应式布局** - 适配不同屏幕尺寸

## 🚀 快速开始

### 前置要求

- Node.js >= 16.0.0
- npm >= 7.0.0

### 安装

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（可选）
# 编辑 .env.local 文件，设置 GEMINI_API_KEY

# 3. 启动开发服务器
npm run dev

# 4. 在浏览器中打开
# http://localhost:3000
```

### 构建

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 📚 完整文档

本项目包含详细的学习文档，帮助你理解如何从零构建 Vue 3 项目：

### 🎯 快速导航
所有文档都在 [docs/](./docs/) 目录中

### 📖 核心文档
1. **[快速开始](./docs/快速开始.md)** - 快速上手指南
2. **[开发指南](./docs/开发指南.md)** - 开发文档
3. **[项目结构说明](./docs/项目结构说明.md)** - 项目组织说明

### 🌪️ Windy 气象图层文档
4. **[Windy 集成说明](./docs/Windy集成说明.md)** - Windy 图层技术文档
5. **[Windy 使用示例](./docs/Windy使用示例.md)** - Windy 图层使用指南

## 🛠️ 技术栈

- **Vue 3.5.24** - 渐进式 JavaScript 框架
- **Vite 6.2.0** - 下一代前端构建工具
- **TypeScript 5.8.2** - JavaScript 的超集
- **Cesium 1.114** - 3D 地球和地图可视化库
- **Windy API** - 全球气象数据可视化服务
- **Tailwind CSS** - 实用优先的 CSS 框架
- **天地图** - 国家地理信息公共服务平台

## 📁 项目结构

```
deep-sea-mining-meteorological-system/
├── src/                    # 源代码目录 ✨
│   ├── components/        # Vue 组件
│   │   ├── Header.vue    # 顶部导航栏
│   │   ├── LeftPanel.vue # 左侧查询面板
│   │   ├── RightPanel.vue# 右侧工具面板
│   │   ├── MapContainer.vue # 地图容器
│   │   └── BottomTable.vue  # 底部数据表格
│   ├── assets/            # 静态资源
│   ├── App.vue            # 根组件
│   ├── main.js            # 应用入口
│   └── constants.js       # 常量定义
├── docs/                  # 项目文档 ✨
│   ├── 项目结构说明.md
│   ├── 快速开始.md
│   └── 开发指南.md
├── .vscode/               # VS Code 配置
├── index.html             # HTML 入口
├── vite.config.ts         # Vite 配置
├── tsconfig.json          # TypeScript 配置
├── package.json           # 项目配置
└── README.md              # 项目说明
```

详细说明请查看 [docs/项目结构说明.md](./docs/项目结构说明.md)

## 🎓 学习路径

### 初学者
1. 阅读 [docs/快速开始.md](./docs/快速开始.md)
2. 启动项目，查看效果
3. 学习 [docs/开发指南.md](./docs/开发指南.md)

### 进阶开发者
1. 查看 [docs/项目结构说明.md](./docs/项目结构说明.md)
2. 根据需求扩展功能

## 🌟 核心功能

### 1. 矿区查询系统
- 按矿种类型筛选（多金属结核、富钴铁锰结壳、多金属硫化物）
- 按大洋区域筛选（太平洋、印度洋、大西洋）
- 按国家筛选

### 2. 气象图层系统 🌪️ NEW!
- **Windy 气象图层**
  - 风场动画 - 实时风场流线可视化
  - 温度分布 - 全球温度分布图
  - 云层覆盖 - 云层覆盖情况
  - 降雨预报 - 降雨量预报
  - 海浪高度 - 海浪高度分布
  - 气压分布 - 大气压力分布
- **OpenWeatherMap 图层**
  - 云层、降水、温度、风速、气压
- **基础气象图层**
  - 风场、海浪、洋流预报

### 3. 图层控制
- 环境监测图层（风场、海浪、洋流、温盐）
- 灾害预警图层（台风、风暴潮、海啸）
- 历史数据图层

### 4. 数据展示
- 实时矿区数据表格
- 矿区详情弹窗
- 2D/3D 视图切换

## 🔧 开发指南

### 添加新组件

```vue
<!-- src/components/MyComponent.vue -->
<template>
  <div>{{ message }}</div>
</template>

<script>
import { ref } from 'vue';

export default {
  setup() {
    const message = ref('Hello Vue 3!');
    return { message };
  }
};
</script>
```

详细开发指南请查看 [docs/开发指南.md](./docs/开发指南.md)

### 使用环境变量

```javascript
// 在 .env 文件中定义
VITE_MY_VAR=value

// 在代码中使用
const myVar = import.meta.env.VITE_MY_VAR;
```

## 🐛 常见问题

### Q: 启动失败？
A: 确保已运行 `npm install` 安装依赖。

### Q: 地图不显示？
A: 检查网络连接，Cesium 和天地图需要联网。

### Q: 端口被占用？
A: 修改 `vite.config.ts` 中的 `server.port`。

更多问题请查看 [docs/快速开始.md](./docs/快速开始.md) 中的常见问题部分。

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

如有问题，请查看项目文档或提交 Issue。

---

**开始你的 Vue 3 学习之旅！** 🚀

查看 [docs/](./docs/) 目录获取完整的学习资源。
