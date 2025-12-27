# 🔧 解决 grib2json 问题

## 问题说明

后端启动时报错：
```
❌ grib2json 工具未安装
```

这是因为需要一个工具来将 GRIB2 格式（气象数据标准格式）转换为 JSON。

---

## ✅ 解决方案（选择其一）

### 方案一：安装 Python pygrib（推荐，最简单）

#### 一键安装（推荐）

```bash
cd backend
./install-pygrib.sh
```

#### 手动安装

```bash
# 1. 安装系统依赖
sudo apt-get update
sudo apt-get install -y python3-pip libeccodes-dev build-essential python3-dev

# 2. 安装 Python 包
pip3 install pygrib numpy

# 3. 验证
python3 -c "import pygrib; print('✅ 安装成功')"
```

---

### 方案二：安装 grib2json 命令行工具

```bash
cd backend
./install-grib2json.sh
```

---

## 🚀 安装完成后

### 1. 重启后端服务

停止当前服务（Ctrl+C），然后：

```bash
cd backend
npm start
```

你应该看到：
```
✅ Python pygrib 已安装
或
✅ grib2json 工具已安装（命令行版本）
```

### 2. 触发数据下载

在新终端运行：

```bash
curl -X POST http://localhost:5678/api/noaa/update \
  -H "Content-Type: application/json" \
  -d '{"type": "wind"}'
```

### 3. 观察日志

后端会显示下载和转换进度：
```
📡 下载 wind 数据 (预报+0h)...
✅ 下载完成
🔄 转换 GRIB2 到 JSON...
✅ 转换完成
```

---

## 📊 预计时间

- **安装工具**：2-5 分钟
- **首次下载数据**：5-10 分钟（仅风场）

---

## ❓ 常见问题

### Q: 安装 pygrib 失败？

A: 确保安装了编译工具：
```bash
sudo apt-get install build-essential python3-dev libeccodes-dev
```

### Q: 找不到 eccodes？

A: 安装 eccodes 库：
```bash
sudo apt-get install libeccodes-dev
```

### Q: 没有 sudo 权限？

A: 使用用户级安装：
```bash
pip3 install --user pygrib numpy
```

---

## 📚 详细文档

- **安装指南**：`backend/GRIB2工具安装指南.md`
- **快速启动**：`NOAA_快速启动.md`
- **技术文档**：`docs/NOAA_NOMADS_实施方案.md`

---

## 🎯 快速验证

安装完成后，运行这个命令验证：

```bash
# 验证 pygrib
python3 -c "import pygrib; print('✅ pygrib OK')"

# 或验证 grib2json
grib2json --help
```

如果看到 ✅，说明安装成功！
