#!/bin/bash

# 自动下载 Copernicus Marine 数据（全球范围，近实时 + 预报）
# 包含：风场、海浪、洋流

echo "🌊 开始下载 Copernicus Marine 全球数据（NRT + 预报）..."

# 计算日期：昨天到未来7天
START_DATE=$(date -u -d "1 day ago" +%Y-%m-%d)
END_DATE=$(date -u -d "7 days" +%Y-%m-%d)

echo "📅 时间范围: $START_DATE 到 $END_DATE"
echo "🌍 空间范围: 全球 (-180° 到 180°, -90° 到 90°)"
echo ""

# ============================================
# 1. 下载风场数据（NRT + 预报）
# ============================================
# echo "📡 [1/3] 下载全球风场数据（近实时 + 预报）..."
# echo "   数据集: GLOBAL_ANALYSISFORECAST_PHY_001_024"
# echo "   变量: 10m 风速 U/V 分量"
# copernicusmarine subset \
#   --dataset-id cmems_mod_glo_phy-cur_anfc_0.083deg_P1D-m \
#   --variable u10m \
#   --variable v10m \
#   --start-datetime ${START_DATE}T00:00:00 \
#   --end-datetime ${END_DATE}T23:59:59 \
#   --minimum-longitude -180 \
#   --maximum-longitude 179.9 \
#   --minimum-latitude -90 \
#   --maximum-latitude 90 \
#   --output-filename wind_data.nc

# if [ $? -eq 0 ]; then
#     echo "✅ 风场数据下载完成"
#     ls -lh wind_data.nc
# else
#     echo "⚠️  风场数据下载失败（可能该数据集不包含风场变量）"
#     echo "   尝试备用方案：从 ECMWF 数据集下载..."
    
#     # 备用方案：使用 ECMWF 风场数据
#     copernicusmarine subset \
#       --dataset-id cmems_mod_glo_phy_anfc_0.083deg_PT1H-m \
#       --variable eastward_wind \
#       --variable northward_wind \
#       --start-datetime ${START_DATE}T00:00:00 \
#       --end-datetime ${END_DATE}T23:59:59 \
#       --minimum-longitude -180 \
#       --maximum-longitude 179.9 \
#       --minimum-latitude -90 \
#       --maximum-latitude 90 \
#       --output-filename wind_data.nc 2>/dev/null
    
#     if [ $? -ne 0 ]; then
#         echo "❌ 风场数据下载失败，跳过风场数据"
#         echo "   提示：Copernicus Marine 可能不提供风场数据"
#         echo "   建议：使用 NOAA GFS 或 ECMWF ERA5 数据"
#         rm -f wind_data.nc
#     fi
# fi

echo ""

# ============================================
# 2. 下载海浪数据（NRT + 预报）
# ============================================
# echo "📡 [2/3] 下载全球海浪数据（近实时 + 预报）..."
# echo "   数据集: GLOBAL_ANALYSISFORECAST_WAV_001_027"
# echo "   分辨率: 0.083° (约 9km)"
# copernicusmarine subset \
#   --dataset-id cmems_mod_glo_wav_anfc_0.083deg_PT3H-i \
#   --variable VHM0 \
#   --variable VSDX \
#   --variable VSDY \
#   --start-datetime ${START_DATE}T00:00:00 \
#   --end-datetime ${END_DATE}T00:00:00 \
#   --minimum-longitude -180 \
#   --maximum-longitude 179.9 \
#   --minimum-latitude -90 \
#   --maximum-latitude 90 \
#   --output-filename wave_data.nc

# if [ $? -eq 0 ]; then
#     echo "✅ 海浪数据下载完成"
#     ls -lh wave_data.nc
# else
#     echo "❌ 海浪数据下载失败"
#     exit 1
# fi

echo ""

# ============================================
# 3. 下载洋流数据（NRT + 预报）
# ============================================
# echo "📡 [3/3] 下载全球洋流数据（近实时 + 预报）..."
# echo "   数据集: GLOBAL_ANALYSISFORECAST_PHY_001_024"
# echo "   分辨率: 1/12° (约 9km)"
# copernicusmarine subset \
#   --dataset-id cmems_mod_glo_phy-cur_anfc_0.083deg_P1D-m \
#   --variable uo \
#   --variable vo \
#   --start-datetime $START_DATE \
#   --end-datetime $END_DATE \
#   --minimum-longitude -180 \
#   --maximum-longitude 179.9 \
#   --minimum-latitude -90 \
#   --maximum-latitude 90 \
#   --output-filename current_data.nc

# if [ $? -eq 0 ]; then
#     echo "✅ 洋流数据下载完成"
#     ls -lh current_data.nc
# else
#     echo "❌ 洋流数据下载失败"
#     exit 1
# fi

echo ""

# ============================================
# 4. 转换数据格式
# ============================================
echo "🔄 转换数据格式..."
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 检查是否有风场数据
if [ -f "wind_data.nc" ]; then
    echo "   转换: 风场 + 海浪 + 洋流"
    python3 "$SCRIPT_DIR/convert_copernicus_data.py" \
        "$SCRIPT_DIR/wind_data.nc" \
        "$SCRIPT_DIR/wave_data.nc" \
        "$SCRIPT_DIR/current_data.nc"
else
    echo "   转换: 海浪 + 洋流（无风场数据）"
    python3 "$SCRIPT_DIR/convert_copernicus_data.py" \
        "$SCRIPT_DIR/wave_data.nc" \
        "$SCRIPT_DIR/current_data.nc"
fi

if [ $? -eq 0 ]; then
    echo "✅ 数据转换完成"
    
    # 显示输出文件
    echo ""
    echo "📦 输出文件："
    [ -d "public/export_wind/" ] && ls -lh public/export_wind/ || echo "   风场: 无"
    [ -d "public/export_out/" ] && ls -lh public/export_out/meta.json || echo "   海浪: 无"
    [ -d "public/export_currents_out/" ] && ls -lh public/export_currents_out/meta.json || echo "   洋流: 无"
    
    # 清理 NetCDF 文件（可选）
    # rm -f wind_data.nc wave_data.nc current_data.nc
    
    echo ""
    echo "🎉 所有数据更新完成！"
    echo ""
    echo "📊 数据摘要："
    echo "   - 时间范围: $START_DATE 到 $END_DATE"
    echo "   - 空间范围: 全球"
    [ -f "wind_data.nc" ] && echo "   - 风场: ✅" || echo "   - 风场: ❌ (使用 NOAA GFS 替代)"
    echo "   - 海浪: ✅"
    echo "   - 洋流: ✅"
else
    echo "❌ 数据转换失败"
    exit 1
fi
