package com.oceanmining.monitoring.dto;

/**
 * 网格数据结构
 */
public class GridData {
    private int width;
    private int height;
    private double west;
    private double south;
    private double east;
    private double north;
    private float[][] u;
    private float[][] v;

    public GridData(int width, int height, double west, double south, double east, double north) {
        this.width = width;
        this.height = height;
        this.west = west;
        this.south = south;
        this.east = east;
        this.north = north;
        this.u = new float[height][width];
        this.v = new float[height][width];
    }
    
    // Getters and Setters
    public int getWidth() { return width; }
    public void setWidth(int width) { this.width = width; }
    
    public int getHeight() { return height; }
    public void setHeight(int height) { this.height = height; }
    
    public double getWest() { return west; }
    public void setWest(double west) { this.west = west; }
    
    public double getSouth() { return south; }
    public void setSouth(double south) { this.south = south; }
    
    public double getEast() { return east; }
    public void setEast(double east) { this.east = east; }
    
    public double getNorth() { return north; }
    public void setNorth(double north) { this.north = north; }
    
    public float[][] getU() { return u; }
    public void setU(float[][] u) { this.u = u; }
    
    public float[][] getV() { return v; }
    public void setV(float[][] v) { this.v = v; }
}

