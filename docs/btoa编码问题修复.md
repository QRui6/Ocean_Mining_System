# btoa 编码问题修复

## 问题描述

在点击避让点或途经点的"选点"按钮后，虽然能够点击地图，但会报错：

```
Uncaught InvalidCharacterError: Failed to execute 'btoa' on 'Window': 
The string to be encoded contains characters outside of the Latin1 range.
```

## 问题原因

`btoa()` 函数只能编码 Latin1 字符（ASCII 0-255），不能编码 Unicode 字符（如中文、特殊符号）。

在代码中，我们使用了以下字符作为标记符号：
- 避让点：`×`（Unicode U+00D7）
- 途经点：`●`（Unicode U+25CF）

这些字符超出了 Latin1 范围，导致 `btoa()` 编码失败。

## 解决方案

将标记符号改为 ASCII 字符：

### 修改前
```javascript
case 'avoid':
    markerColor = '#f97316';
    markerLabel = '避让点';
    markerText = '×';  // Unicode 字符，btoa() 无法编码
    break;
case 'through':
    markerColor = '#3b82f6';
    markerLabel = '途经点';
    markerText = '●';  // Unicode 字符，btoa() 无法编码
    break;
```

### 修改后
```javascript
case 'avoid':
    markerColor = '#f97316';
    markerLabel = '避让点';
    markerText = 'X';  // ASCII 字符，btoa() 可以编码
    break;
case 'through':
    markerColor = '#3b82f6';
    markerLabel = '途经点';
    markerText = 'T';  // ASCII 字符，btoa() 可以编码
    break;
```

## 标记符号说明

修改后的标记符号：

| 类型 | 颜色 | 符号 | 标签 | 说明 |
|------|------|------|------|------|
| 起点 | 🟢 绿色 | A | 起点 | ASCII 字符 |
| 终点 | 🔴 红色 | B | 终点 | ASCII 字符 |
| 避让点 | 🟠 橙色 | X | 避让点 | ASCII 字符（代表"禁止"） |
| 途经点 | 🔵 蓝色 | T | 途经点 | ASCII 字符（Through 的首字母） |

## 其他解决方案（未采用）

### 方案1：使用 encodeURIComponent

```javascript
image: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
    <svg>...</svg>
`)
```

**优点**：可以使用任何 Unicode 字符
**缺点**：URL 会变得很长

### 方案2：使用 TextEncoder

```javascript
const encoder = new TextEncoder();
const data = encoder.encode(svgString);
const base64 = btoa(String.fromCharCode(...data));
```

**优点**：可以使用任何 Unicode 字符
**缺点**：代码复杂，性能较差

### 方案3：使用 Canvas 绘制

不使用 SVG，直接用 Canvas 绘制标记。

**优点**：完全控制渲染
**缺点**：代码复杂度高

## 为什么选择 ASCII 字符

1. **简单直接**：不需要额外的编码处理
2. **性能好**：`btoa()` 是最快的编码方式
3. **兼容性好**：所有浏览器都支持
4. **足够清晰**：
   - `X` 代表"禁止"、"避开"，符合避让点的含义
   - `T` 是 Through 的首字母，符合途经点的含义

## 测试验证

修复后，应该能够正常：
1. ✅ 点击避让点的"选点"按钮
2. ✅ 在地图上点击选择位置
3. ✅ 看到橙色标记，符号为 X
4. ✅ 坐标自动填入输入框
5. ✅ 没有任何错误

同样适用于途经点（蓝色标记，符号为 T）。

## 相关文件

- `src/components/MapContainer.vue` - 修复了 btoa 编码问题

## 更新日志

- **2024-12-19**: 修复 btoa 编码问题，将 Unicode 字符改为 ASCII 字符
