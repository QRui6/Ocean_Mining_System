# GFS 数据完整清单

## 一、GFS 包含的所有气象要素

### 1.1 完整的 GFS GRIB2 文件包含 100+ 个变量

**一个完整的 gfs.t00z.pgrb2.0p25.f000 文件（约 500 MB）包含**：

```
地面和近地面变量：
├── 地面气压 (PRES)
├── 海平面气压 (PRMSL)
├── 2m 温度 (TMP)
├── 2m 露点温度 (DPT)
├── 2m 相对湿度 (RH)
├── 10m U 风速分量 (UGRD) ✅ 我们需要
├── 10m V 风速分量 (VGRD) ✅ 我们需要
├── 10m 风速 (WIND)
├── 10m 风向 (WDIR)
├── 降水量 (APCP)
├── 对流降水 (ACPCP)
├── 总云量 (TCDC)
├── 低云量 (LCDC)
├── 中云量 (MCDC)
├── 高云量 (HCDC)
├── 能见度 (VIS)
├── 雷暴概率 (TSTM)
├── 冰雹概率 (HAIL)
├── 龙卷风概率 (TORN)
├── 积雪深度 (SNOD)
├── 积雪水当量 (WEASD)
├── 土壤温度 (TSOIL)
├── 土壤湿度 (SOILW)
├── 植被覆盖 (VEG)
├── 地表粗糙度 (SFCR)
├── 地表反照率 (ALBDO)
├── 向下短波辐射 (DSWRF)
├── 向上短波辐射 (USWRF)
├── 向下长波辐射 (DLWRF)
├── 向上长波辐射 (ULWRF)
├── 潜热通量 (LHTFL)
├── 感热通量 (SHTFL)
├── 地表蒸发 (EVP)
├── 地表径流 (RUNOF)
└── ... (还有 70+ 个变量)

高空变量 (多个气压层)：
├── 位势高度 (HGT)
│   ├── 1000 hPa
│   ├── 925 hPa
│   ├── 850 hPa
│   ├── 700 hPa
│   ├── 500 hPa ✅ 常用
│   ├── 300 hPa
│   ├── 250 hPa
│   ├── 200 hPa
│   └── 100 hPa
├── 温度 (TMP)
│   ├── 各气压层
├── U 风速分量 (UGRD)
│   ├── 各气压层
├── V 风速分量 (VGRD)
│   ├── 各气压层
├── 垂直速度 (VVEL)
│   ├── 各气压层
├── 相对湿度 (RH)
│   ├── 各气压层
└── 绝对涡度 (ABSV)
    ├── 各气压层

海洋变量：
├── 海表温度 (WTMP) ✅ 可能需要
├── 海冰覆盖 (ICEC)
├── 海冰厚度 (ICETK)
└── 海浪高度 (HTSGW) ⚠️ GFS 的波浪数据不准确

其他变量：
├── 对流有效位能 (CAPE)
├── 对流抑制能量 (CIN)
├── 抬升凝结高度 (LCL)
├── 自由对流高度 (LFC)
├── 平衡高度 (EL)
├── 风暴相对螺旋度 (HLCY)
├── 垂直风切变 (VWSH)
└── ... (还有更多)
```

---

## 二、你需要的气象数据

### 2.1 核心需求：风、浪、流

根据你的需求，你需要：

#### 1. 风场数据 (Wind) ✅ 从 GFS 获取

**变量**：
- `UGRD:10 m above ground` - U 分量（东西向风速）
- `VGRD:10 m above ground` - V 分量（南北向风速）

**为什么是 10m？**
- 10m 是标准气象观测高度
- 代表近地面风速
- 适用于海洋表面

**数据格式**：
```json
{
  "refTime": "2024-01-08T00:00:00Z",
  "forecastTime": 0,
  "data": [
    {
      "u": 5.2,    // m/s，正值向东
      "v": -3.1    // m/s，正值向北
    },
    ...
  ]
}
```

**计算风速和风向**：
```javascript
// 风速 (m/s)
const windSpeed = Math.sqrt(u * u + v * v);

// 风向 (度，0=北，90=东，180=南，270=西)
const windDirection = (Math.atan2(u, v) * 180 / Math.PI + 360) % 360;

// 风力等级 (蒲福风级)
const beaufortScale = getBeaufortScale(windSpeed);
```

#### 2. 波浪数据 (Wave) ⚠️ 不要从 GFS 获取

**问题**：GFS 的波浪数据不准确
- GFS 主要是大气模型
- 波浪数据是附带的，精度低
- 不适合专业应用

**正确做法**：使用 **NOAA WaveWatch III**

**变量**：
- `HTSGW` - 有效波高 (Significant Wave Height)
- `PERPW` - 波浪周期 (Peak Wave Period)
- `DIRPW` - 波浪方向 (Peak Wave Direction)

**数据源**：
```
https://polar.ncep.noaa.gov/waves/
模型：WaveWatch III
分辨率：0.5° (约 50km)
更新频率：每 6 小时
```

**数据格式**：
```json
{
  "refTime": "2024-01-08T00:00:00Z",
  "data": [
    {
      "height": 2.5,      // 有效波高 (米)
      "period": 8.0,      // 波浪周期 (秒)
      "direction": 270    // 波浪方向 (度)
    },
    ...
  ]
}
```

**波浪等级**：
```javascript
function getSeaState(waveHeight) {
  if (waveHeight < 0.1) return { level: 0, desc: '无浪' };
  if (waveHeight < 0.5) return { level: 1, desc: '微浪' };
  if (waveHeight < 1.25) return { level: 2, desc: '小浪' };
  if (waveHeight < 2.5) return { level: 3, desc: '轻浪' };
  if (waveHeight < 4.0) return { level: 4, desc: '中浪' };
  if (waveHeight < 6.0) return { level: 5, desc: '大浪' };
  if (waveHeight < 9.0) return { level: 6, desc: '巨浪' };
  if (waveHeight < 14.0) return { level: 7, desc: '狂浪' };
  return { level: 8, desc: '怒浪' };
}
```

#### 3. 洋流数据 (Ocean Current) ⚠️ 不要从 GFS 获取

**问题**：GFS 没有洋流数据
- GFS 是大气模型，不包含海洋环流

**正确做法**：使用 **HYCOM**

**变量**：
- `water_u` - U 分量（东西向流速）
- `water_v` - V 分量（南北向流速）
- `water_temp` - 海水温度（可选）
- `salinity` - 盐度（可选）

**数据源**：
```
https://www.hycom.org/
模型：HYCOM (Hybrid Coordinate Ocean Model)
分辨率：1/12° (约 8km)
更新频率：每天
深度：表层 (0m)
```

**数据格式**：
```json
{
  "refTime": "2024-01-08T00:00:00Z",
  "data": [
    {
      "u": 0.5,        // 东西向流速 (m/s)
      "v": -0.3,       // 南北向流速 (m/s)
      "temp": 25.3,    // 海水温度 (°C)
      "salinity": 35.0 // 盐度 (PSU)
    },
    ...
  ]
}
```

**计算流速和流向**：
```javascript
// 流速 (m/s)
const currentSpeed = Math.sqrt(u * u + v * v);

// 流向 (度)
const currentDirection = (Math.atan2(u, v) * 180 / Math.PI + 360) % 360;

// 转换为节 (knots)
const currentSpeedKnots = currentSpeed * 1.94384;
```

---

## 三、数据源总结

### 3.1 推荐的数据源组合

| 数据类型 | 数据源 | 变量 | 分辨率 | 更新频率 |
|---------|--------|------|--------|---------|
| **风场** | NOAA GFS | UGRD, VGRD (10m) | 0.25° | 6 小时 |
| **波浪** | NOAA WaveWatch III | HTSGW, PERPW, DIRPW | 0.5° | 6 小时 |
| **洋流** | HYCOM | water_u, water_v | 1/12° | 24 小时 |

### 3.2 下载 URL

#### GFS 风场
```bash
# 基础 URL
https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl

# 参数
?file=gfs.t00z.pgrb2.0p25.f000          # 文件名
&lev_10_m_above_ground=on               # 10m 高度
&var_UGRD=on                            # U 分量
&var_VGRD=on                            # V 分量
&dir=%2Fgfs.20240108%2F00%2Fatmos       # 目录

# 完整 URL
https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl?file=gfs.t00z.pgrb2.0p25.f000&lev_10_m_above_ground=on&var_UGRD=on&var_VGRD=on&dir=%2Fgfs.20240108%2F00%2Fatmos
```

#### WaveWatch III 波浪
```bash
# 基础 URL
https://nomads.ncep.noaa.gov/cgi-bin/filter_wave.pl

# 参数
?file=multi_1.glo_30m.t00z.f000.grib2   # 文件名
&lev_surface=on                         # 表层
&var_HTSGW=on                           # 有效波高
&var_PERPW=on                           # 波浪周期
&var_DIRPW=on                           # 波浪方向
&dir=%2Fmulti_1.20240108                # 目录

# 完整 URL
https://nomads.ncep.noaa.gov/cgi-bin/filter_wave.pl?file=multi_1.glo_30m.t00z.f000.grib2&lev_surface=on&var_HTSGW=on&var_PERPW=on&var_DIRPW=on&dir=%2Fmulti_1.20240108
```

#### HYCOM 洋流
```bash
# 基础 URL
https://tds.hycom.org/thredds/dodsC/GLBy0.08/expt_93.0

# 使用 OPeNDAP 协议
# 需要使用 Python 的 netCDF4 库或 Node.js 的 netcdf4 包

# 或者使用 HTTP 下载
https://tds.hycom.org/thredds/fileServer/GLBy0.08/expt_93.0/data/2024/01/hycom_glby_930_2024010800_t000.nc
```

---

## 四、其他可能需要的气象数据

### 4.1 海表温度 (SST)

**用途**：
- 影响船舶航行
- 影响气象条件
- 渔业应用

**数据源**：
- GFS: `WTMP:surface`
- 或 NOAA OISST (更准确)

**下载**：
```bash
# 从 GFS 获取
https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl?file=gfs.t00z.pgrb2.0p25.f000&lev_surface=on&var_WTMP=on&dir=%2Fgfs.20240108%2F00%2Fatmos
```

### 4.2 降水量

**用途**：
- 能见度影响
- 雷达反射
- 安全预警

**数据源**：GFS
**变量**：
- `APCP` - 累积降水量
- `PRATE` - 降水率

### 4.3 能见度

**用途**：
- 航行安全
- 雾预警

**数据源**：GFS
**变量**：`VIS:surface`

### 4.4 雷暴概率

**用途**：
- 极端天气预警
- 航行安全

**数据源**：GFS
**变量**：`TSTM:surface`

---

## 五、数据下载脚本

### 5.1 下载风场数据

```javascript
// downloadWind.js
const axios = require('axios');
const fs = require('fs');

async function downloadWind(date, hour, forecast) {
  const baseUrl = 'https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl';
  
  const params = new URLSearchParams({
    file: `gfs.t${hour}z.pgrb2.0p25.f${forecast}`,
    lev_10_m_above_ground: 'on',
    var_UGRD: 'on',
    var_VGRD: 'on',
    dir: `/gfs.${date}/${hour}/atmos`
  });
  
  const url = `${baseUrl}?${params}`;
  
  console.log(`下载风场数据: ${date} ${hour}:00 f${forecast}`);
  
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 60000
  });
  
  const filename = `wind_${date}_${hour}_f${forecast}.grib2`;
  fs.writeFileSync(filename, response.data);
  
  console.log(`✅ 下载完成: ${filename} (${response.data.length} bytes)`);
  
  return filename;
}

// 使用示例
downloadWind('20240108', '00', '000');
```

### 5.2 下载波浪数据

```javascript
// downloadWave.js
async function downloadWave(date, hour, forecast) {
  const baseUrl = 'https://nomads.ncep.noaa.gov/cgi-bin/filter_wave.pl';
  
  const params = new URLSearchParams({
    file: `multi_1.glo_30m.t${hour}z.f${forecast}.grib2`,
    lev_surface: 'on',
    var_HTSGW: 'on',
    var_PERPW: 'on',
    var_DIRPW: 'on',
    dir: `/multi_1.${date}`
  });
  
  const url = `${baseUrl}?${params}`;
  
  console.log(`下载波浪数据: ${date} ${hour}:00 f${forecast}`);
  
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 60000
  });
  
  const filename = `wave_${date}_${hour}_f${forecast}.grib2`;
  fs.writeFileSync(filename, response.data);
  
  console.log(`✅ 下载完成: ${filename}`);
  
  return filename;
}
```

### 5.3 下载洋流数据

```javascript
// downloadCurrent.js
// 注意：HYCOM 使用 NetCDF 格式，需要特殊处理

const axios = require('axios');

async function downloadCurrent(date) {
  // HYCOM 的 URL 格式
  const year = date.substring(0, 4);
  const month = date.substring(4, 6);
  const day = date.substring(6, 8);
  
  const url = `https://tds.hycom.org/thredds/fileServer/GLBy0.08/expt_93.0/data/${year}/${month}/hycom_glby_930_${date}00_t000.nc`;
  
  console.log(`下载洋流数据: ${date}`);
  
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 120000
  });
  
  const filename = `current_${date}.nc`;
  fs.writeFileSync(filename, response.data);
  
  console.log(`✅ 下载完成: ${filename}`);
  
  return filename;
}
```

---

## 六、数据文件大小

### 6.1 原始 GRIB2 文件大小

| 数据类型 | 完整文件 | 过滤后 | 压缩后 |
|---------|---------|--------|--------|
| GFS 风场 | 500 MB | 50 MB | 2 MB |
| WaveWatch III | 200 MB | 20 MB | 1 MB |
| HYCOM 洋流 | 300 MB | 100 MB | 3 MB |

### 6.2 存储需求估算

**每次更新（6 小时）**：
- 风场：29 个文件 × 2 MB = 58 MB
- 波浪：29 个文件 × 1 MB = 29 MB
- 洋流：1 个文件 × 3 MB = 3 MB
- **总计**：90 MB

**每天**：
- 4 次更新 × 90 MB = 360 MB

**保留 14 天**：
- 14 天 × 360 MB = 5 GB

---

## 七、总结

### 你需要的数据

```
1. 风场 (Wind) ✅
   - 数据源：NOAA GFS
   - 变量：UGRD, VGRD (10m)
   - 用途：风速风向动画

2. 波浪 (Wave) ✅
   - 数据源：NOAA WaveWatch III
   - 变量：HTSGW, PERPW, DIRPW
   - 用途：海浪高度方向

3. 洋流 (Current) ✅
   - 数据源：HYCOM
   - 变量：water_u, water_v
   - 用途：洋流流速流向

可选：
4. 海表温度 (SST)
5. 降水量 (Precipitation)
6. 能见度 (Visibility)
7. 雷暴概率 (Thunderstorm)
```

### 下载策略

```javascript
// 每 6 小时运行一次
cron.schedule('0 4,10,16,22 * * *', async () => {
  const date = getCurrentDate();
  const hour = getCurrentHour();
  
  // 1. 下载风场数据 (GFS)
  for (let f = 0; f <= 168; f += 6) {
    await downloadWind(date, hour, f);
  }
  
  // 2. 下载波浪数据 (WaveWatch III)
  for (let f = 0; f <= 168; f += 6) {
    await downloadWave(date, hour, f);
  }
  
  // 3. 下载洋流数据 (HYCOM) - 每天一次
  if (hour === '00') {
    await downloadCurrent(date);
  }
});
```

**现在清楚了吗？** 😊