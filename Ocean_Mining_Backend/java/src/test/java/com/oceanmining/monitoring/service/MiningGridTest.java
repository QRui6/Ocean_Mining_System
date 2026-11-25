package com.oceanmining.monitoring.service;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.io.WKTReader;
import java.nio.*;
import static org.junit.jupiter.api.Assertions.*;

class MiningGridTest {
    @Test void samplesEntirePolygonWithoutTwentyPointCap() throws Exception {
        var points=MiningGrid.sample(new WKTReader().read("POLYGON((0 0,2 0,2 2,0 2,0 0))"),25);
        assertTrue(points.size()>60);
        assertTrue(points.stream().anyMatch(p->p.lon()>1.5&&p.lat()>1.5));
    }
    @Test void datelineDoesNotSampleTheRestOfTheWorld() throws Exception {
        var points=MiningGrid.sample(new WKTReader().read("POLYGON((179 0,-179 0,-179 1,179 1,179 0))"),25);
        assertTrue(points.size()>20 && points.size()<100);
        assertTrue(points.stream().allMatch(p->Math.abs(p.lon())>=179));
    }
    @Test void retainsSmallDisconnectedParts() throws Exception {
        var points=MiningGrid.sample(new WKTReader().read("MULTIPOLYGON(((1 1,1.01 1,1.005 1.01,1 1)),((3 3,3.01 3,3.005 3.01,3 3)))"),25);
        assertEquals(2,points.size());
    }
    @Test void interpolationHonoursRowsZeroMissingAndBoundary() {
        byte[] raw=ByteBuffer.allocate(16).order(ByteOrder.LITTLE_ENDIAN).putFloat(0).putFloat(2).putFloat(4).putFloat(6).array();
        assertEquals(3,MiningGrid.interpolate(raw,2,2,0,0,1,1,new MiningGrid.Point(.5,.5)));
        assertEquals(0,MiningGrid.interpolate(raw,2,2,0,0,1,1,new MiningGrid.Point(0,1)));
        assertEquals(6,MiningGrid.interpolate(raw,2,2,0,0,1,1,new MiningGrid.Point(1,0)));
        ByteBuffer.wrap(raw).order(ByteOrder.LITTLE_ENDIAN).putFloat(12,Float.NaN);
        assertNull(MiningGrid.interpolate(raw,2,2,0,0,1,1,new MiningGrid.Point(.5,.5)));
        assertEquals(0,MiningGrid.interpolate(raw,2,2,0,0,1,1,new MiningGrid.Point(0,1)));
    }
    @Test void extractedNeighboursMatchFullGridAtEdgesAndAcrossZeroLongitude() {
        int width=8,height=5;
        byte[] raw=new byte[width*height*4];
        var buffer=ByteBuffer.wrap(raw).order(ByteOrder.LITTLE_ENDIAN);
        for(int i=0;i<width*height;i++)buffer.putFloat(i*4,(float)Math.sin(i));
        var random=new java.util.Random(14);
        for(int n=0;n<300;n++) {
            var point=new MiningGrid.Point(n==0?0:n==1?-1:random.nextDouble()*7,random.nextDouble()*4);
            var stencil=MiningGrid.stencil(width,height,0,0,7,4,point);
            byte[][] samples=new byte[4][];
            if(stencil!=null)for(int i=0;i<4;i++)samples[i]=java.util.Arrays.copyOfRange(raw,stencil.offsets()[i]-1,stencil.offsets()[i]+3);
            assertEquals(MiningGrid.interpolate(raw,width,height,0,0,7,4,point),MiningGrid.interpolate(stencil,samples));
        }
    }
    @Test void extractedMissingNeighbourOnlyInvalidatesPointsThatUseIt() {
        var corner=MiningGrid.stencil(2,2,0,0,1,1,new MiningGrid.Point(0,1));
        byte[] zero=ByteBuffer.allocate(4).order(ByteOrder.LITTLE_ENDIAN).putFloat(0).array();
        byte[][] samples={zero,null,null,null};
        assertEquals(0,MiningGrid.interpolate(corner,samples));
        var middle=MiningGrid.stencil(2,2,0,0,1,1,new MiningGrid.Point(.5,.5));
        assertNull(MiningGrid.interpolate(middle,samples));
        assertNull(MiningGrid.stencil(2,2,0,0,1,1,new MiningGrid.Point(2,0)));
    }
}
