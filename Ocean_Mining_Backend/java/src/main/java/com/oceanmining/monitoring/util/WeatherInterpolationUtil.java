package com.oceanmining.monitoring.util;

import com.oceanmining.monitoring.dto.GridData;
import com.oceanmining.monitoring.dto.Vector2D;
import com.oceanmining.monitoring.dto.response.WeatherPointQueryDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 气象数据插值工具类
 * 
 * @author Ocean Mining Team
 * @version 1.0.0
 */
public class WeatherInterpolationUtil {
    
    private static final Logger log = LoggerFactory.getLogger(WeatherInterpolationUtil.class);
    
    /**
     * 双线性插值获取指定经纬度的向量值
     * 
     * @param grid 网格数据
     * @param lat 纬度
     * @param lon 经度
     * @return 插值后的向量，如果超出边界则返回null
     */
    public static Vector2D bilinearInterpolation(GridData grid, double lat, double lon) {
        if (grid == null || grid.getU() == null || grid.getV() == null) {
            log.warn("网格数据不完整");
            return null;
        }
        
        // 坐标转换：处理0-360度问题
        double adjustedLon = adjustLongitude(lon, grid.getWest(), grid.getEast());
        
        // 将经纬度转换为网格坐标（浮点数）
        double x = ((adjustedLon - grid.getWest()) / (grid.getEast() - grid.getWest())) * (grid.getWidth() - 1);
        double y = ((grid.getNorth() - lat) / (grid.getNorth() - grid.getSouth())) * (grid.getHeight() - 1);
        
        // 边界检查
        if (x < 0 || x >= grid.getWidth() - 1 || y < 0 || y >= grid.getHeight() - 1) {
            log.warn("坐标超出边界: lat={}, lon={}, x={}, y={}, bounds=[{},{},{},{}]", 
                    lat, lon, x, y, grid.getWest(), grid.getSouth(), grid.getEast(), grid.getNorth());
            return null;
        }
        
        // 获取四个角点的索引
        int x0 = (int) Math.floor(x);
        int x1 = x0 + 1;
        int y0 = (int) Math.floor(y);
        int y1 = y0 + 1;
        
        // 计算插值权重
        double wx = x - x0;
        double wy = y - y0;
        
        // 获取四个角点的U和V值
        float u00 = grid.getU()[y0][x0];
        float u01 = grid.getU()[y0][x1];
        float u10 = grid.getU()[y1][x0];
        float u11 = grid.getU()[y1][x1];
        
        float v00 = grid.getV()[y0][x0];
        float v01 = grid.getV()[y0][x1];
        float v10 = grid.getV()[y1][x0];
        float v11 = grid.getV()[y1][x1];
        
        // 双线性插值
        double u = (1 - wx) * (1 - wy) * u00 +
                   wx * (1 - wy) * u01 +
                   (1 - wx) * wy * u10 +
                   wx * wy * u11;
        
        double v = (1 - wx) * (1 - wy) * v00 +
                   wx * (1 - wy) * v01 +
                   (1 - wx) * wy * v10 +
                   wx * wy * v11;
        
        return new Vector2D(u, v);
    }
    
    /**
     * 坐标转换：处理Cesium的-180到180度与数据的0到360度之间的转换
     * 
     * @param lon 原始经度
     * @param west 数据西边界
     * @param east 数据东边界
     * @return 调整后的经度
     */
    private static double adjustLongitude(double lon, double west, double east) {
        // 如果数据使用0-360度格式
        if (west >= 0 && east > 180) {
            // 将负经度转换为0-360度
            if (lon < 0) {
                lon += 360;
            }
        }
        return lon;
    }
    
    /**
     * 计算向量的速度和方向
     * 
     * @param vector 向量
     * @return 气象向量（包含速度和方向）
     */
    public static WeatherPointQueryDTO.WeatherVector calculateSpeedAndDirection(Vector2D vector) {
        if (vector == null) {
            return null;
        }
        
        // 计算速度（向量模）
        double speed = Math.sqrt(vector.getU() * vector.getU() + vector.getV() * vector.getV());
        
        // 计算方向（度）
        // atan2(u, v) 给出从北方顺时针的角度
        double direction = Math.toDegrees(Math.atan2(vector.getU(), vector.getV()));
        if (direction < 0) {
            direction += 360;
        }
        
        return new WeatherPointQueryDTO.WeatherVector(
                vector.getU(),
                vector.getV(),
                speed,
                direction
        );
    }
    
    /**
     * 解析二进制数据为网格数据（U和V分量分开存储）
     * 
     * @param uData U分量二进制数据
     * @param vData V分量二进制数据
     * @param width 网格宽度
     * @param height 网格高度
     * @param west 西边界
     * @param south 南边界
     * @param east 东边界
     * @param north 北边界
     * @return 网格数据
     */
    public static GridData parseBinaryData(byte[] uData, byte[] vData, int width, int height, 
                                          double west, double south, double east, double north) {
        GridData grid = new GridData(width, height, west, south, east, north);
        
        int totalPoints = width * height;
        int bytesPerFloat = 4;
        int expectedSize = totalPoints * bytesPerFloat;
        
        log.debug("解析二进制数据: width={}, height={}, totalPoints={}, uSize={}, vSize={}", 
                width, height, totalPoints, uData.length, vData.length);
        
        // 检查数据大小
        if (uData.length < expectedSize) {
            log.error("U分量数据大小不足: 实际={}, 期望={}", uData.length, expectedSize);
            throw new IllegalArgumentException(
                    String.format("U分量数据大小不足: 实际=%d, 期望=%d", uData.length, expectedSize));
        }
        
        if (vData.length < expectedSize) {
            log.error("V分量数据大小不足: 实际={}, 期望={}", vData.length, expectedSize);
            throw new IllegalArgumentException(
                    String.format("V分量数据大小不足: 实际=%d, 期望=%d", vData.length, expectedSize));
        }
        
        for (int i = 0; i < height; i++) {
            for (int j = 0; j < width; j++) {
                int index = i * width + j;
                int offset = index * bytesPerFloat;
                
                // 读取U分量
                grid.getU()[i][j] = bytesToFloat(uData, offset);
                
                // 读取V分量
                grid.getV()[i][j] = bytesToFloat(vData, offset);
            }
        }
        
        return grid;
    }
    
    /**
     * 将字节数组转换为float
     * 
     * @param bytes 字节数组
     * @param offset 偏移量
     * @return float值
     */
    private static float bytesToFloat(byte[] bytes, int offset) {
        int intBits = ((bytes[offset] & 0xFF)) |
                     ((bytes[offset + 1] & 0xFF) << 8) |
                     ((bytes[offset + 2] & 0xFF) << 16) |
                     ((bytes[offset + 3] & 0xFF) << 24);
        return Float.intBitsToFloat(intBits);
    }
    
    /**
     * 解析单通道二进制数据为网格数据（用于浪高等标量数据）
     * 
     * @param data 二进制数据
     * @param width 网格宽度
     * @param height 网格高度
     * @param west 西边界
     * @param south 南边界
     * @param east 东边界
     * @param north 北边界
     * @return 网格数据（只有U分量有效，V分量为null）
     */
    public static GridData parseBinaryDataSingleChannel(byte[] data, int width, int height, 
                                                       double west, double south, double east, double north) {
        GridData grid = new GridData(width, height, west, south, east, north);
        
        int totalPoints = width * height;
        int bytesPerFloat = 4;
        int expectedSize = totalPoints * bytesPerFloat;
        
        log.debug("解析单通道二进制数据: width={}, height={}, totalPoints={}, dataSize={}", 
                width, height, totalPoints, data.length);
        
        // 检查数据大小
        if (data.length < expectedSize) {
            log.error("数据大小不足: 实际={}, 期望={}", data.length, expectedSize);
            throw new IllegalArgumentException(
                    String.format("数据大小不足: 实际=%d, 期望=%d", data.length, expectedSize));
        }
        
        for (int i = 0; i < height; i++) {
            for (int j = 0; j < width; j++) {
                int index = i * width + j;
                int offset = index * bytesPerFloat;
                
                // 读取数据到U分量
                grid.getU()[i][j] = bytesToFloat(data, offset);
            }
        }
        
        return grid;
    }
    
    /**
     * 双线性插值获取指定经纬度的标量值（用于浪高等单通道数据）
     * 
     * @param grid 网格数据（只使用U分量）
     * @param lat 纬度
     * @param lon 经度
     * @return 插值后的标量值，如果超出边界则返回-9999
     */
    public static double bilinearInterpolationSingleValue(GridData grid, double lat, double lon) {
        if (grid == null || grid.getU() == null) {
            log.warn("网格数据不完整");
            return -9999.0;
        }
        
        // 坐标转换：处理0-360度问题
        double adjustedLon = adjustLongitude(lon, grid.getWest(), grid.getEast());
        
        // 将经纬度转换为网格坐标（浮点数）
        double x = ((adjustedLon - grid.getWest()) / (grid.getEast() - grid.getWest())) * (grid.getWidth() - 1);
        double y = ((grid.getNorth() - lat) / (grid.getNorth() - grid.getSouth())) * (grid.getHeight() - 1);
        
        // 边界检查
        if (x < 0 || x >= grid.getWidth() - 1 || y < 0 || y >= grid.getHeight() - 1) {
            log.warn("坐标超出边界: lat={}, lon={}, x={}, y={}, bounds=[{},{},{},{}]", 
                    lat, lon, x, y, grid.getWest(), grid.getSouth(), grid.getEast(), grid.getNorth());
            return -9999.0;
        }
        
        // 获取四个角点的索引
        int x0 = (int) Math.floor(x);
        int x1 = x0 + 1;
        int y0 = (int) Math.floor(y);
        int y1 = y0 + 1;
        
        // 计算插值权重
        double wx = x - x0;
        double wy = y - y0;
        
        // 获取四个角点的值
        float val00 = grid.getU()[y0][x0];
        float val01 = grid.getU()[y0][x1];
        float val10 = grid.getU()[y1][x0];
        float val11 = grid.getU()[y1][x1];
        
        // 检查是否有无效值
        if (val00 < -9000 || val01 < -9000 || val10 < -9000 || val11 < -9000) {
            return -9999.0;
        }
        
        // 双线性插值
        double value = (1 - wx) * (1 - wy) * val00 +
                      wx * (1 - wy) * val01 +
                      (1 - wx) * wy * val10 +
                      wx * wy * val11;
        
        return value;
    }
}
