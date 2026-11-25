package com.oceanmining.monitoring.service;
import org.locationtech.jts.geom.*;
import java.util.*;
import java.nio.*;

public final class MiningGrid {
    public record Point(double lon,double lat) {}
    public record Stencil(int[] offsets,double[] weights) {}
    public static List<Point> sample(Geometry geometry, double km) {
        if(geometry==null || geometry.isEmpty()) throw new IllegalArgumentException("矿区缺少边界");
        if(km<1 || km>100) throw new IllegalArgumentException("采样间距无效");
        Map<String,Point> result=new LinkedHashMap<>();
        for(int part=0;part<geometry.getNumGeometries();part++) {
            Geometry g=geometry.getGeometryN(part).copy();
            double anchor=g.getCoordinates()[0].x;
            g.apply((CoordinateFilter)c->{while(c.x-anchor>180)c.x-=360;while(c.x-anchor< -180)c.x+=360;});g.geometryChanged();
            var e=g.getEnvelopeInternal(); int before=result.size();
            double dy=km/111.195;
            for(double lat=e.getMinY();lat<=e.getMaxY()+1e-9;lat+=dy) {
                double dx=km/(111.195*Math.max(0.001,Math.cos(Math.toRadians(lat))));
                for(double lon=e.getMinX();lon<=e.getMaxX()+1e-9;lon+=dx) {
                    if(g.covers(g.getFactory().createPoint(new Coordinate(lon,lat)))) add(result,lon,lat);
                }
            }
            if(result.size()==before) {var p=g.getInteriorPoint();add(result,p.getX(),p.getY());}
        }
        return List.copyOf(result.values());
    }
    private static void add(Map<String,Point> out,double lon,double lat) {
        lon=((lon+180)%360+360)%360-180;
        out.put(String.format(Locale.ROOT,"%.7f,%.7f",lon,lat),new Point(lon,lat));
    }
    /** Source grid is north-to-south, little endian float32. Missing neighbours remain missing. */
    public static Double interpolate(byte[] data,int width,int height,double west,double south,double east,double north,Point p) {
        if(data==null || width<2 || height<2 || data.length!=(long)width*height*4) return null;
        Stencil stencil=stencil(width,height,west,south,east,north,p);
        if(stencil==null)return null;
        var buffer=ByteBuffer.wrap(data).order(ByteOrder.LITTLE_ENDIAN);double sum=0;
        for(int i=0;i<4;i++){
            if(stencil.weights[i]==0)continue;
            float value=buffer.getFloat(stencil.offsets[i]-1);
            if(!Float.isFinite(value)||Math.abs(value)>1e10)return null;
            sum+=stencil.weights[i]*value;
        }
        return sum;
    }
    public static Stencil stencil(int width,int height,double west,double south,double east,double north,Point p) {
        if(width<2||height<2||east<=west||north<=south)return null;
        double lon=p.lon; if(west>=0 && lon<0)lon+=360;
        double x=(lon-west)/(east-west)*(width-1), y=(north-p.lat)/(north-south)*(height-1);
        if(!Double.isFinite(x)||!Double.isFinite(y)||x<0||x>width-1||y<0||y>height-1)return null;
        int x0=Math.min(width-2,(int)Math.floor(x)),y0=Math.min(height-2,(int)Math.floor(y));
        double wx=x-x0,wy=y-y0;int[] offsets=new int[4];double[] weights=new double[4];
        for(int j=0;j<2;j++)for(int i=0;i<2;i++) {
            int index=j*2+i;
            offsets[index]=((y0+j)*width+x0+i)*4+1;
            weights[index]=(i==0?1-wx:wx)*(j==0?1-wy:wy);
        }
        return new Stencil(offsets,weights);
    }
    public static Double interpolate(Stencil stencil,byte[][] samples) {
        if(stencil==null||samples==null||samples.length!=4)return null;
        double sum=0;
        for(int i=0;i<4;i++) {
            if(stencil.weights[i]==0)continue;
            if(samples[i]==null||samples[i].length!=4)return null;
            float value=ByteBuffer.wrap(samples[i]).order(ByteOrder.LITTLE_ENDIAN).getFloat();
            if(!Float.isFinite(value)||Math.abs(value)>1e10)return null;
            sum+=stencil.weights[i]*value;
        }
        return sum;
    }
}
