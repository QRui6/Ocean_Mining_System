#!/usr/bin/env python3
"""检查 NOAA GFS 最新发布时间"""

from datetime import datetime, timedelta

# 当前时间
now = datetime.utcnow()
print(f'当前 UTC 时间: {now.strftime("%Y-%m-%d %H:%M:%S")}')
print()

# GFS 发布时间是每天 00, 06, 12, 18 UTC
# 数据通常在发布后 3-4 小时可用
run_hours = [0, 6, 12, 18]

print('GFS 发布周期:')
print('  每天 4 次: 00Z, 06Z, 12Z, 18Z')
print('  数据延迟: 约 3-4 小时')
print()

# 计算最近可用的发布
forecast_run = None
forecast_date_obj = now

for run_hour in reversed(run_hours):
    if now.hour >= run_hour + 3:  # 至少延迟3小时
        forecast_run = run_hour
        break

if forecast_run is None:
    # 使用昨天的最后一次
    forecast_date_obj = now - timedelta(days=1)
    forecast_run = 18

forecast_date = forecast_date_obj.strftime('%Y%m%d')
forecast_hour = f'{forecast_run:02d}'
forecast_time = datetime(forecast_date_obj.year, forecast_date_obj.month, 
                        forecast_date_obj.day, forecast_run, 0, 0)

print(f'预计最新可用的 GFS 发布:')
print(f'  日期: {forecast_date}')
print(f'  时次: {forecast_hour}Z')
print(f'  完整时间: {forecast_time.strftime("%Y-%m-%d %H:%M")} UTC')
print()

# 构建 URL
opendap_url = f'https://nomads.ncep.noaa.gov/dods/gfs_0p25/gfs{forecast_date}/gfs_0p25_{forecast_hour}z'
print(f'OpenDAP URL:')
print(f'  {opendap_url}')
print()

# 尝试连接
print('尝试连接到 OpenDAP 服务器...')
try:
    import netCDF4 as nc
    ds = nc.Dataset(opendap_url)
    print('✅ 连接成功!')
    print()
    print(f'数据集信息:')
    if 'time' in ds.variables:
        time_var = ds.variables['time']
        print(f'  时间维度: {len(time_var)} 个预报时次')
        print(f'  预报范围: 0-{len(time_var)-1} 小时')
    if 'lat' in ds.variables:
        print(f'  纬度点数: {len(ds.variables["lat"])}')
    if 'lon' in ds.variables:
        print(f'  经度点数: {len(ds.variables["lon"])}')
    
    # 检查风场变量
    if 'ugrd10m' in ds.variables and 'vgrd10m' in ds.variables:
        print(f'  ✅ 10米风场数据可用')
    else:
        print(f'  ❌ 10米风场数据不可用')
        print(f'  可用变量: {list(ds.variables.keys())[:10]}')
    
    ds.close()
except Exception as e:
    print(f'❌ 连接失败: {e}')
    print()
    print('可能的原因:')
    print('  1. 数据还未发布（需要等待发布后3-4小时）')
    print('  2. 网络连接问题')
    print('  3. NOAA 服务器维护')
