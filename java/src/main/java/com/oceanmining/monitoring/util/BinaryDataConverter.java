package com.oceanmining.monitoring.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;

/**
 * 二进制数据转换工具类
 * 用于Float32Array与byte[]之间的转换
 * 
 * @author Ocean Mining Team
 * @version 1.0.0
 */
public class BinaryDataConverter {
    
    private static final Logger log = LoggerFactory.getLogger(BinaryDataConverter.class);
    
    /**
     * 将float数组转换为byte数组
     * 使用小端字节序（Little Endian），与JavaScript Float32Array兼容
     * 
     * @param floats float数组
     * @return byte数组
     */
    public static byte[] floatArrayToBytes(float[] floats) {
        if (floats == null || floats.length == 0) {
            return new byte[0];
        }
        
        ByteBuffer buffer = ByteBuffer.allocate(floats.length * 4);
        buffer.order(ByteOrder.LITTLE_ENDIAN);
        
        for (float f : floats) {
            buffer.putFloat(f);
        }
        
        return buffer.array();
    }
    
    /**
     * 将byte数组转换为float数组
     * 使用小端字节序（Little Endian），与JavaScript Float32Array兼容
     * 
     * @param bytes byte数组
     * @return float数组
     */
    public static float[] bytesToFloatArray(byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            return new float[0];
        }
        
        if (bytes.length % 4 != 0) {
            log.warn("字节数组长度不是4的倍数: {}", bytes.length);
            throw new IllegalArgumentException("Invalid byte array length: " + bytes.length);
        }
        
        ByteBuffer buffer = ByteBuffer.wrap(bytes);
        buffer.order(ByteOrder.LITTLE_ENDIAN);
        
        float[] floats = new float[bytes.length / 4];
        for (int i = 0; i < floats.length; i++) {
            floats[i] = buffer.getFloat();
        }
        
        return floats;
    }
    
    /**
     * 计算float数组的最小值
     * 
     * @param floats float数组
     * @return 最小值
     */
    public static float findMin(float[] floats) {
        if (floats == null || floats.length == 0) {
            return 0f;
        }
        
        float min = Float.POSITIVE_INFINITY;
        for (float f : floats) {
            if (Float.isFinite(f) && f < min) {
                min = f;
            }
        }
        
        return Float.isInfinite(min) ? 0f : min;
    }
    
    /**
     * 计算float数组的最大值
     * 
     * @param floats float数组
     * @return 最大值
     */
    public static float findMax(float[] floats) {
        if (floats == null || floats.length == 0) {
            return 0f;
        }
        
        float max = Float.NEGATIVE_INFINITY;
        for (float f : floats) {
            if (Float.isFinite(f) && f > max) {
                max = f;
            }
        }
        
        return Float.isInfinite(max) ? 0f : max;
    }
    
    /**
     * 验证float数组中的所有值是否有效（非NaN和非Infinity）
     * 
     * @param floats float数组
     * @return 是否所有值都有效
     */
    public static boolean validateFloatArray(float[] floats) {
        if (floats == null || floats.length == 0) {
            return false;
        }
        
        for (float f : floats) {
            if (!Float.isFinite(f)) {
                return false;
            }
        }
        
        return true;
    }
}
