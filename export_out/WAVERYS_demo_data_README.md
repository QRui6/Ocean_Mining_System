# WAVERYS Demo 数据包说明（全球半天样例）

## 1. 数据来源
- 产品：Copernicus Marine – **Global Ocean Waves Reanalysis (WAVERYS)**  
- 产品 ID：`GLOBAL_MULTIYEAR_WAV_001_032`
- 数据集：`cmems_mod_glo_wav_my_0.2deg_PT3H-i`（全球 0.2° × 0.2°，3 小时步长的波浪平均场）
- 本次样例时间：**2020-01-01 00:00–12:00 UTC**
- 变量：显著波高（Hs）、波向（来向）、Stokes drift x/y
- 获取方式：`copernicusmarine` CLI 登录后使用 `subset` 下载；本地用 `export_demo.py` 导出二进制包

> 说明：该数据集为 3 小时步长（time step = 3h），全球范围 lon [-180, 179.8]、lat [-89.8, 89.8]，分辨率约 0.2°。

---

## 2. 输出目录结构
导出脚本 `export_demo.py` 生成目录：

```
export_out/
  meta.json
  hs_t00.bin
  hs_t01.bin
  hs_t02.bin
  hs_t03.bin
  hs_t04.bin
  stokes_u_t00.bin
  stokes_v_t00.bin
  ...
  dir_u_t00.bin
  dir_v_t00.bin
  ...
```

本次样例共有 **5 帧**（Frames = 5）：
- t00: 2020-01-01T00:00:00Z
- t01: 2020-01-01T03:00:00Z
- t02: 2020-01-01T06:00:00Z
- t03: 2020-01-01T09:00:00Z
- t04: 2020-01-01T12:00:00Z

---

## 3. 网格定义（来自 meta.json）
- 网格维度：`lat_size = 899`, `lon_size = 1800`
- 范围：
  - `lat_min = -89.800003...`, `lat_max = 89.800003...`
  - `lon_min = -180.0`, `lon_max = 179.800003...`
- 步长：
  - `lat_step ≈ 0.2000046°`
  - `lon_step ≈ 0.1999969°`

### 3.1 格点到经纬度的映射
对二维数组下标 `(i, j)`：
- `lat(i) = lat_min + i * lat_step`
- `lon(j) = lon_min + j * lon_step`

其中：
- `i ∈ [0, lat_size-1]`（纬向索引）
- `j ∈ [0, lon_size-1]`（经向索引）

---

## 4. 数据文件格式（.bin）
### 4.1 基本格式
- 类型：**float32**
- 形状：`[lat_size, lon_size]`（即 `[899, 1800]`）
- 存储顺序：**C order（行优先）**
  - 索引计算：`index = i * lon_size + j`
- 缺测值：**-9999.0**（float32）

### 4.2 文件含义
#### A) Hs 着色等值面（标量场）
- `hs_tXX.bin`
  - 内容：**显著波高 Hs（单位：m）**
  - 对应原始变量（NetCDF 变量名/short_name）：`VHM0`

#### B) 粒子动画（矢量场，推荐用 Stokes drift）
- `stokes_u_tXX.bin`
  - 内容：**Stokes drift 东向分量 u（单位：m/s）**
  - 对应原始变量：`VSDX`
- `stokes_v_tXX.bin`
  - 内容：**Stokes drift 北向分量 v（单位：m/s）**
  - 对应原始变量：`VSDY`

> 用途：做类似 windy 的粒子 advection（对 u/v 做双线性插值推进粒子）。

#### C) 箭头方向（单位矢量场，由波向计算）
- `dir_u_tXX.bin`
- `dir_v_tXX.bin`

说明：
- 由 `VMDR`（wave **from** direction，来向，单位 degree）转换得到“传播方向（to）”的单位向量：
  - `dir_to = (dir_from + 180) mod 360`
  - `u = sin(dir_to)`（东向单位向量）
  - `v = cos(dir_to)`（北向单位向量）
- 仅表达方向，不表达速度大小（箭头长度可固定或自行定义）

---

## 5. 渲染建议（实现要点）
### 5.1 Hs 图层（着色等值面）
- 将 `hs_tXX.bin` 作为规则经纬网格标量场
- 推荐：前端 WebGL shader 内做 color ramp 映射（更像 windy）
- 也可：服务端预渲染成 raster tiles（XYZ/WMTS），时间轴切换不同 time 的瓦片

### 5.2 粒子动画（推荐）
- 使用 `stokes_u/v_tXX.bin`
- 粒子推进步骤（核心逻辑）：
  1) 根据粒子当前位置（lon,lat）映射到网格坐标（i,j）
  2) 对 u/v 做双线性插值
  3) 用插值得到的速度更新粒子位置（必要时乘以 `speedScale` 增强观感）
- 性能建议：
  - 全球场建议先对矢量场降采样（每 2～4 格采样一次）
  - 粒子数量从 5k～20k 起步按性能调节

### 5.3 箭头层
- 使用 `dir_u/v_tXX.bin`（单位向量）
- 每隔 N 格点采样画箭头（如每 8×8 或 10×10 格点）

---

## 6. 注意事项
1) 时间为 **UTC**（如需本地显示可自行转换）。
2) 全局经度范围为 [-180, 180)；跨 ±180 经线时注意 wrap。
3) 缺测值为 -9999，需要在渲染/插值时跳过或 mask。
4) 本样例为 3 小时步长（不是 1 小时步长）；如需更细时间可插帧（线性插值 hs 与 u/v）。

---

## 7. 快速读取示例（伪代码）
```js
// meta.json
const { grid } = meta;
const W = grid.lon_size;
const H = grid.lat_size;

// 读二进制 float32
const buf = await fetch("hs_t00.bin").then(r => r.arrayBuffer());
const hs = new Float32Array(buf);

// 取格点值
function value(i, j) {
  return hs[i * W + j];
}
```
