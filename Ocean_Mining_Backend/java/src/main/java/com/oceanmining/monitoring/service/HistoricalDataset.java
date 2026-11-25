package com.oceanmining.monitoring.service;

public enum HistoricalDataset {
    WIND("wind","era5_monthly_wind"), WAVE("wave","era5_monthly_wave"), CURRENT("current","copernicus_monthly_current");
    public final String key, code;
    HistoricalDataset(String key,String code) { this.key=key;this.code=code; }
    public String dataTable() { return "historical_"+key+"_monthly_data"; }
    public String metaTable() { return "historical_"+key+"_metadata"; }
}
