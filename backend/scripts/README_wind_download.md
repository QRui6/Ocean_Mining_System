# GFS 风场数据下载指南

## 数据获取策略

要获取 **2025年12月26日 - 2026年1月3日** 的风场数据，采用"拼接法"：

### 1. 历史分析场（12月26-28日）
- 下载每天的分析场（f000）
- 时次：00z, 06z, 12z, 18z
- 这是对当时真实大气状态的记录

### 2. 最新预报场（12月29日-1月3日）
- 使用今天最新的一次预报
- 下载对应未来时刻的预报文件
- 预报小时数：f012, f015, f018 ... f144

## 数据源

使用 **AWS Open Data**（推荐）：
- URL: `https://noaa-gfs-bdp-pds.s3.amazonaws.com`
- 优点：速度快，稳定，包含最近30天数据
- 无需认证

NOAA NOMADS（备选）：
- 经常限速或封IP
- 不推荐直接使用

## 使用步骤

### 1. 安装依赖

```bash
cd backend/scripts
pip install -r requirements.txt
```

注意：`pygrib` 需要 ECCODES 库支持：

```bash
# Ubuntu/Debian
sudo apt-get install libeccodes-dev

# macOS
brew install eccodes

# 然后安装 pygrib
pip install pygrib
```

### 2. 下载数据

```bash
python3 download_gfs_wind_aws.py
```

这个脚本会：
1. 下载历史分析场（12.26-12.28）
2. 下载最新预报场（12.29-01.03）
3. 合并为一个 NetCDF 文件：`wind_data.nc`
4. 自动清理临时 GRIB2 文件

### 3. 转换为二进制

```bash
python3 convert_wind_to_binary.py
```

这会生成前端需要的二进制文件和 meta.json。

## 文件格式

### GRIB2 文件命名
- 分析场：`gfs_YYYYMMDD_HHz_f000.grib2`
- 预报场：`gfs_YYYYMMDD_HHz_fXXX.grib2`

### NetCDF 文件结构
```
dimensions:
  time = 65
  latitude = 721
  longitude = 1440

variables:
  valid_time(time): 时间戳（秒）
  latitude(latitude): 纬度（-90 到 90）
  longitude(longitude): 经度（0 到 360）
  u10(time, latitude, longitude): U 分量（m/s）
  v10(time, latitude, longitude): V 分量（m/s）
```

## 时间计算

- 目标时间范围：2025-12-26 00:00 - 2026-01-03 00:00
- 时间步长：3 小时
- 总帧数：65 帧

## 常见问题

### Q: 下载失败怎么办？
A: 检查网络连接，或者等待几小时后重试（GFS 数据发布后需要3-4小时才能完全可用）

### Q: pygrib 安装失败？
A: 确保先安装了 ECCODES 库，参考上面的安装命令

### Q: 数据不完整？
A: 如果当前时间太早，部分历史分析场可能还未发布，脚本会自动跳过

### Q: 如何验证数据？
A: 下载完成后，检查 `wind_data.nc` 文件：
```bash
ncdump -h wind_data.nc
```

## 数据更新频率

GFS 每天发布 4 次：
- 00z（UTC 00:00）
- 06z（UTC 06:00）
- 12z（UTC 12:00）
- 18z（UTC 18:00）

每次发布后约 3-4 小时数据完全可用。
