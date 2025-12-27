#!/bin/bash

# 自动下载 Copernicus Marine 数据

echo "🌊 开始下载 Copernicus Marine 数据..."

# 使用数据集中可用的日期（2025-10-30 到 2025-10-31）
START_DATE="2025-10-30"
END_DATE="2025-10-31"

echo "📅 时间范围: $START_DATE 到 $END_DATE"

# 下载海浪数据
echo ""
echo "📡 下载海浪数据..."
copernicusmarine subset \
  --dataset-id cmems_mod_glo_wav_my_0.2deg_PT3H-i \
  --variable VHM0 \
  --variable VSDX \
  --variable VSDY \
  --start-datetime ${START_DATE}T00:00:00 \
  --end-datetime ${END_DATE}T00:00:00 \
  --minimum-longitude 100 \
  --maximum-longitude 180 \
  --minimum-latitude -10 \
  --maximum-latitude 50 \
  --output-filename wave_data.nc

if [ $? -eq 0 ]; then
    echo "✅ 海浪数据下载完成"
else
    echo "❌ 海浪数据下载失败"
    exit 1
fi

# 下载洋流数据
echo ""
echo "📡 下载洋流数据..."
copernicusmarine subset \
  --dataset-id cmems_mod_glo_phy_my_0.083deg_P1D-m \
  --variable uo \
  --variable vo \
  --start-datetime $START_DATE \
  --end-datetime $END_DATE \
  --minimum-longitude 100 \
  --maximum-longitude 180 \
  --minimum-latitude -10 \
  --maximum-latitude 50 \
  --output-filename current_data.nc

if [ $? -eq 0 ]; then
    echo "✅ 洋流数据下载完成"
else
    echo "❌ 洋流数据下载失败"
    exit 1
fi

# 转换数据
echo ""
echo "🔄 转换数据格式..."
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
python3 "$SCRIPT_DIR/convert_copernicus_data.py" "$SCRIPT_DIR/../wave_data.nc" "$SCRIPT_DIR/../current_data.nc"

if [ $? -eq 0 ]; then
    echo "✅ 数据转换完成"
    
    # 清理 NetCDF 文件（可选）
    # rm -f ../wave_data.nc ../current_data.nc
    
    echo ""
    echo "🎉 所有数据更新完成！"
else
    echo "❌ 数据转换失败"
    exit 1
fi
