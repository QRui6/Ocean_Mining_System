package com.oceanmining.monitoring.util;

import org.locationtech.jts.geom.*;

import java.util.List;

/**
 * 几何工具类
 * 用于处理PostGIS几何对象
 */
public class GeometryUtil {
    
    private static final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
    
    /**
     * 创建多边形
     * @param coordinates 坐标列表 [[lng, lat], [lng, lat], ...]
     * @return Polygon对象
     */
    public static Polygon createPolygon(List<List<Double>> coordinates) {
        if (coordinates == null || coordinates.size() < 3) {
            throw new IllegalArgumentException("多边形至少需要3个点");
        }
        
        // 确保多边形闭合（首尾点相同）
        List<List<Double>> coords = coordinates;
        List<Double> first = coords.get(0);
        List<Double> last = coords.get(coords.size() - 1);
        
        if (!first.equals(last)) {
            coords.add(first);
        }
        
        // 创建坐标数组
        Coordinate[] coordArray = coords.stream()
                .map(coord -> new Coordinate(coord.get(0), coord.get(1)))
                .toArray(Coordinate[]::new);
        
        // 创建线性环
        LinearRing shell = geometryFactory.createLinearRing(coordArray);
        
        // 创建多边形
        return geometryFactory.createPolygon(shell);
    }
    
    /**
     * 创建点
     * @param lng 经度
     * @param lat 纬度
     * @return Point对象
     */
    public static Point createPoint(Double lng, Double lat) {
        return geometryFactory.createPoint(new Coordinate(lng, lat));
    }
    
    /**
     * 计算多边形的边界范围
     */
    public static Bounds calculateBounds(List<List<Double>> polygon) {
        if (polygon == null || polygon.isEmpty()) {
            return new Bounds(0.0, 0.0, 0.0, 0.0);
        }
        
        double minLng = polygon.get(0).get(0);
        double maxLng = polygon.get(0).get(0);
        double minLat = polygon.get(0).get(1);
        double maxLat = polygon.get(0).get(1);
        
        for (List<Double> coord : polygon) {
            double lng = coord.get(0);
            double lat = coord.get(1);
            
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
        }
        
        return new Bounds(minLng, maxLng, minLat, maxLat);
    }
    
    /**
     * 计算多边形面积（平方公里）
     * 使用球面三角形公式
     */
    public static double calculateArea(List<List<Double>> polygon) {
        if (polygon == null || polygon.size() < 3) {
            return 0;
        }
        
        final double EARTH_RADIUS = 6371.0; // 地球半径（公里）
        
        double area = 0;
        int n = polygon.size();
        
        for (int i = 0; i < n; i++) {
            int j = (i + 1) % n;
            List<Double> p1 = polygon.get(i);
            List<Double> p2 = polygon.get(j);
            
            double lng1 = p1.get(0);
            double lat1 = p1.get(1);
            double lng2 = p2.get(0);
            double lat2 = p2.get(1);
            
            double lat1Rad = Math.toRadians(lat1);
            double lat2Rad = Math.toRadians(lat2);
            double lngDiff = Math.toRadians(lng2 - lng1);
            
            area += lngDiff * (2 + Math.sin(lat1Rad) + Math.sin(lat2Rad));
        }
        
        area = Math.abs(area * EARTH_RADIUS * EARTH_RADIUS / 2);
        
        return Math.round(area * 100.0) / 100.0; // 保留2位小数
    }
    
    /**
     * 边界范围类
     */
    public static class Bounds {
        public final double minLng;
        public final double maxLng;
        public final double minLat;
        public final double maxLat;
        
        public Bounds(double minLng, double maxLng, double minLat, double maxLat) {
            this.minLng = minLng;
            this.maxLng = maxLng;
            this.minLat = minLat;
            this.maxLat = maxLat;
        }
    }
}
