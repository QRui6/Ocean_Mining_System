# GLORYS12V1 全球洋流 Demo 数据（1 天）说明

## 1) 数据是什么
- 产品：Copernicus Marine – **Global Ocean Physics Reanalysis (GLORYS12V1)**
- Product ID：`GLOBAL_MULTIYEAR_PHY_001_030`
- 数据集：`cmems_mod_glo_phy_my_0.083deg_P1D-m`
- 时间分辨率：**日平均（P1D）**
- 空间分辨率：**1/12°（约 0.0833°）规则经纬网**
- 核心变量（本 demo 只用这两个即可做 windy 风格海流）：
  - `uo`：eastward sea water velocity（东向流速，m/s）
  - `vo`：northward sea water velocity（北向流速，m/s）

> `copernicusmarine describe` 输出已确认变量名就是 `uo` / `vo`，并带有 `depth` 坐标（50 层），最浅层约 **0.494 m**。

---

## 2) 如何下载“先跑通 demo 的 1 天（表层）”
建议先只取表层（减少数据量），用 `subset`：

```bat
copernicusmarine subset ^
  -i cmems_mod_glo_phy_my_0.083deg_P1D-m ^
  --minimum-longitude -180 --maximum-longitude 179.91667 ^
  --minimum-latitude -80 --maximum-latitude 90 ^
  --start-datetime 2020-01-01T00:00:00 ^
  --end-datetime   2020-01-02T00:00:00 ^
  --minimum-depth 0 --maximum-depth 1 ^
  -v uo ^
  -v vo ^
  --file-format netcdf ^
  --output-filename currents_global_surface_20200101.nc
```

说明：
- `--minimum-depth 0 --maximum-depth 1` 通常会把最浅那一层（约 0.494m）筛出来（具体以下载后的 NetCDF 为准）。
- 如果你不筛深度，会把 50 层都下载下来，体积会非常大，不适合先做样例。

---

## 3) 如何导出成前端好吃的二进制（推荐）
把 NetCDF 导出为规则网格帧（float32）：

```bat
python export_currents_demo.py currents_global_surface_20200101.nc export_currents_out
```

导出结果：
```
export_currents_out/
  meta.json
  u_t00.bin
  v_t00.bin
  speed_t00.bin
  dir_u_t00.bin
  dir_v_t00.bin
  ...
```

- `.bin` 为 **float32**，二维 `[lat, lon]`，行优先（C-order）
- 缺测值统一为 **-9999.0**

---

## 4) 前端（Cesium + WebGL）怎么用
### A) 粒子流线（windy 风格）
推荐直接用 `uo/vo` 当速度场推进粒子（对 u/v 做双线性插值）：
1) 粒子位置（lon,lat）→ 网格坐标（i,j）
2) 双线性插值取 u/v
3) 用 u/v（m/s）推进粒子

**单位换算（非常重要）**：你在经纬度空间推进，需要把 m/s 转为 deg/s：
- `dlat = v / R * 180/pi`
- `dlon = u / (R*cos(lat)) * 180/pi`
- `R = 6371000 m`

### B) 箭头层
用 `dir_u/dir_v`（单位向量）更方便画箭头方向：
- 每隔 N 个格点抽样（比如 N=8 或 10）渲染箭头
- 箭头长度可固定或用 `speed` 做缩放

---

## 5) 注意事项
1) 时间是 **UTC**（meta.json 里也标了）。
2) 经度范围是 [-180, 180)；跨 ±180 经线时注意 wrap。
3) 建议对全球 1/12° 数据做降采样后再做实时粒子（性能会更稳）。
