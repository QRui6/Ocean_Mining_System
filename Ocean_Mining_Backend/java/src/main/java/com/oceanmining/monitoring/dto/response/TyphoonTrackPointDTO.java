package com.oceanmining.monitoring.dto.response;

import java.time.OffsetDateTime;

public class TyphoonTrackPointDTO {

    private OffsetDateTime time;
    private Double lat;
    private Double lon;
    private Double wmoWind;
    private Double wmoPres;
    private Double distanceToAreaKm;
    private Boolean inBuffer;

    public OffsetDateTime getTime() { return time; }
    public void setTime(OffsetDateTime time) { this.time = time; }

    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }

    public Double getLon() { return lon; }
    public void setLon(Double lon) { this.lon = lon; }

    public Double getWmoWind() { return wmoWind; }
    public void setWmoWind(Double wmoWind) { this.wmoWind = wmoWind; }

    public Double getWmoPres() { return wmoPres; }
    public void setWmoPres(Double wmoPres) { this.wmoPres = wmoPres; }

    public Double getDistanceToAreaKm() { return distanceToAreaKm; }
    public void setDistanceToAreaKm(Double distanceToAreaKm) { this.distanceToAreaKm = distanceToAreaKm; }

    public Boolean getInBuffer() { return inBuffer; }
    public void setInBuffer(Boolean inBuffer) { this.inBuffer = inBuffer; }
}
