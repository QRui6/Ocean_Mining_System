package com.oceanmining.monitoring.dto;

/**
 * 二维向量
 */
public class Vector2D {
    private double u;
    private double v;
    
    public Vector2D(double u, double v) {
        this.u = u;
        this.v = v;
    }
    
    public double getU() { return u; }
    public void setU(double u) { this.u = u; }
    
    public double getV() { return v; }
    public void setV(double v) { this.v = v; }
}
