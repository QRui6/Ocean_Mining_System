# 🎛️ 风场参数调整指南

## 🎯 快速调整

根据实际效果，你可以快速调整这些参数来达到理想效果。

## 📍 参数位置

**文件**: `src/components/MapContainer.vue`  
**函数**: `initWindLayer()`  
**位置**: 第 562 行左右

## 🔧 核心参数

### 1. 粒子密度 (particlesTextureSize)

**控制**: 流线的密集程度

```javascript
particlesTextureSize: 1024  // 当前值
```

| 值 | 粒子数 | 效果 | 性能 |
|---|--------|------|------|
| 512 | 262K | 稀疏 | 高 |
| 768 | 590K | 适中 | 中高 |
| 1024 | 1.05M | 密集 ✅ | 中 |
| 1536 | 2.36M | 很密集 | 低 |
| 2048 | 4.19M | 极密集 | 很低 |

**调整建议**:
- 太稀疏 → 增加到 1536
- 太密集 → 降低到 768
- 性能不足 → 降低到 512

### 2. 线条宽度 (lineWidth)

**控制**: 流线的粗细

```javascript
lineWidth: { min: 0.8, max: 2.0 }  // 当前值
```

| 配置 | 效果 |
|------|------|
| `{ min: 0.5, max: 1.5 }` | 极细，精致 |
| `{ min: 0.8, max: 2.0 }` | 细，清晰 ✅ |
| `{ min: 1.0, max: 2.5 }` | 适中 |
| `{ min: 1.5, max: 3.0 }` | 粗，明显 |
| `{ min: 2.0, max: 4.0 }` | 很粗 |

**调整建议**:
- 看不清 → 增加到 `{ min: 1.5, max: 3.0 }`
- 太粗糙 → 降低到 `{ min: 0.5, max: 1.5 }`

### 3. 拖尾长度 (lineLength)

**控制**: 流线的长度

```javascript
lineLength: { min: 80, max: 200 }  // 当前值
```

| 配置 | 效果 |
|------|------|
| `{ min: 40, max: 100 }` | 短，点状 |
| `{ min: 60, max: 150 }` | 适中 |
| `{ min: 80, max: 200 }` | 长，流线 ✅ |
| `{ min: 100, max: 250 }` | 很长 |
| `{ min: 150, max: 300 }` | 极长 |

**调整建议**:
- 不够连续 → 增加到 `{ min: 100, max: 250 }`
- 太长太乱 → 降低到 `{ min: 60, max: 150 }`

### 4. 流动速度 (speedFactor)

**控制**: 粒子移动速度

```javascript
speedFactor: 1.5  // 当前值
```

| 值 | 效果 |
|---|------|
| 0.5 | 很慢 |
| 1.0 | 慢 |
| 1.5 | 适中 ✅ |
| 2.0 | 快 |
| 3.0 | 很快 |

**调整建议**:
- 太快看不清 → 降低到 1.0
- 太慢不流畅 → 增加到 2.0

### 5. 消失率 (dropRate)

**控制**: 粒子消失速度

```javascript
dropRate: 0.0005  // 当前值
```

| 值 | 效果 |
|---|------|
| 0.0003 | 极慢消失，轨迹很长 |
| 0.0005 | 慢消失，轨迹长 ✅ |
| 0.001 | 适中消失 |
| 0.003 | 快消失 |
| 0.01 | 很快消失，轨迹短 |

**调整建议**:
- 轨迹太短 → 降低到 0.0003
- 轨迹太长太乱 → 增加到 0.001

### 6. 颜色方案 (colors)

**控制**: 流线颜色

```javascript
colors: ['#00ffff', '#00eeff', '#00ddff', '#00ccff', '#00bbff']  // 当前：青色渐变
```

**预设方案**:

#### 青色系（当前）✅
```javascript
colors: ['#00ffff', '#00eeff', '#00ddff', '#00ccff', '#00bbff']
```

#### 绿色系
```javascript
colors: ['#00ff00', '#00ee00', '#00dd00', '#00cc00', '#00bb00']
```

#### 蓝色系
```javascript
colors: ['#0088ff', '#0077ee', '#0066dd', '#0055cc', '#0044bb']
```

#### 紫色系
```javascript
colors: ['#8800ff', '#7700ee', '#6600dd', '#5500cc', '#4400bb']
```

#### 彩虹渐变
```javascript
colors: ['#00ffff', '#00ff00', '#ffff00', '#ff8800', '#ff0000']
```

#### 单色（纯青）
```javascript
colors: ['#00ffff', '#00ffff', '#00ffff', '#00ffff', '#00ffff']
```

## 🎨 常见效果配置

### 配置 1: 极密集流线（类似参考图片）

```javascript
{
    particlesTextureSize: 1536,
    lineWidth: { min: 0.6, max: 1.8 },
    lineLength: { min: 100, max: 250 },
    speedFactor: 1.2,
    dropRate: 0.0003,
    dropRateBump: 0.001,
    colors: ['#00ffff', '#00eeff', '#00ddff', '#00ccff', '#00bbff']
}
```

### 配置 2: 平衡性能与效果

```javascript
{
    particlesTextureSize: 768,
    lineWidth: { min: 1.0, max: 2.5 },
    lineLength: { min: 70, max: 180 },
    speedFactor: 1.5,
    dropRate: 0.0008,
    dropRateBump: 0.003,
    colors: ['#00ffff', '#00eeff', '#00ddff', '#00ccff', '#00bbff']
}
```

### 配置 3: 高性能（低端设备）

```javascript
{
    particlesTextureSize: 512,
    lineWidth: { min: 1.2, max: 2.8 },
    lineLength: { min: 60, max: 150 },
    speedFactor: 2.0,
    dropRate: 0.002,
    dropRateBump: 0.005,
    colors: ['#00ffff', '#00eeff', '#00ddff', '#00ccff', '#00bbff']
}
```

### 配置 4: 极致效果（高端设备）

```javascript
{
    particlesTextureSize: 2048,
    lineWidth: { min: 0.5, max: 1.5 },
    lineLength: { min: 120, max: 300 },
    speedFactor: 1.0,
    dropRate: 0.0002,
    dropRateBump: 0.0008,
    colors: ['#00ffff', '#00eeff', '#00ddff', '#00ccff', '#00bbff']
}
```

## 🔄 如何修改

### 步骤 1: 打开文件
```
src/components/MapContainer.vue
```

### 步骤 2: 找到配置
搜索 `new WindLayer(viewer, windData, {`

### 步骤 3: 修改参数
根据上面的指南修改参数

### 步骤 4: 保存并刷新
保存文件，刷新浏览器查看效果

## 💡 调整技巧

### 技巧 1: 逐步调整
一次只改一个参数，观察效果

### 技巧 2: 记录配置
找到满意的配置后，记录下来

### 技巧 3: 性能监控
打开浏览器性能监控（F12 → Performance）

### 技巧 4: 对比测试
准备几套配置，对比效果

## 🎯 目标效果检查清单

- [ ] 流线密集均匀
- [ ] 线条细腻清晰
- [ ] 流动连续平滑
- [ ] 颜色协调美观
- [ ] 性能流畅（30+ FPS）
- [ ] 类似参考图片

## 🐛 常见问题

### Q1: 流线太稀疏
**A**: 增加 `particlesTextureSize` 到 1536 或 2048

### Q2: 流线不连续
**A**: 增加 `lineLength` 到 `{ min: 100, max: 250 }`

### Q3: 性能卡顿
**A**: 降低 `particlesTextureSize` 到 768 或 512

### Q4: 看不清流线
**A**: 增加 `lineWidth` 到 `{ min: 1.5, max: 3.0 }`

### Q5: 流动太快
**A**: 降低 `speedFactor` 到 1.0

### Q6: 颜色不明显
**A**: 使用对比度更高的颜色方案

## 📊 性能参考

| 配置 | 粒子数 | 预期 FPS | 内存 | 适用设备 |
|------|--------|----------|------|----------|
| 512 | 262K | 60 | 50MB | 低端 |
| 768 | 590K | 45-60 | 80MB | 中端 |
| 1024 | 1.05M | 30-45 | 120MB | 中高端 ✅ |
| 1536 | 2.36M | 20-30 | 200MB | 高端 |
| 2048 | 4.19M | 15-25 | 350MB | 极高端 |

## ✅ 推荐配置

**当前配置已经是推荐配置**，适合大多数场景。

如果需要调整：
- **性能优先** → 使用配置 3
- **效果优先** → 使用配置 1 或 4
- **平衡** → 保持当前配置

---

**更新时间**: 2025-12-05  
**当前配置**: 流线型，密集效果  
**状态**: ✅ 已优化
