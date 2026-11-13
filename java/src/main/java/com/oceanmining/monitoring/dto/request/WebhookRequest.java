package com.oceanmining.monitoring.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * 船讯网Webhook推送请求DTO
 */
public class WebhookRequest {
    
    /**
     * 区域ID
     */
    @JsonProperty("area_id")
    private String areaId;
    
    /**
     * 事件类型: 1=进入, 2=离开
     */
    @JsonProperty("event_type")
    private Integer eventType;
    
    /**
     * 船舶MMSI号
     */
    private Long mmsi;
    
    /**
     * 船舶名称
     */
    @JsonProperty("ship_name")
    private String shipName;
    
    /**
     * 纬度
     */
    private Double lat;
    
    /**
     * 经度
     */
    private Double lng;
    
    /**
     * 事件时间
     */
    @JsonProperty("event_time")
    private String eventTime;
    
    /**
     * UTC事件时间
     */
    @JsonProperty("event_time_utc")
    private Long eventTimeUtc;
    
    /**
     * IMO号
     */
    private String imo;
    
    /**
     * 呼号
     */
    @JsonProperty("call_sign")
    private String callSign;
    
    // Getters and Setters
    public String getAreaId() { return areaId; }
    public void setAreaId(String areaId) { this.areaId = areaId; }
    
    public Integer getEventType() { return eventType; }
    public void setEventType(Integer eventType) { this.eventType = eventType; }
    
    public Long getMmsi() { return mmsi; }
    public void setMmsi(Long mmsi) { this.mmsi = mmsi; }
    
    public String getShipName() { return shipName; }
    public void setShipName(String shipName) { this.shipName = shipName; }
    
    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }
    
    public Double getLng() { return lng; }
    public void setLng(Double lng) { this.lng = lng; }
    
    public String getEventTime() { return eventTime; }
    public void setEventTime(String eventTime) { this.eventTime = eventTime; }
    
    public Long getEventTimeUtc() { return eventTimeUtc; }
    public void setEventTimeUtc(Long eventTimeUtc) { this.eventTimeUtc = eventTimeUtc; }
    
    public String getImo() { return imo; }
    public void setImo(String imo) { this.imo = imo; }
    
    public String getCallSign() { return callSign; }
    public void setCallSign(String callSign) { this.callSign = callSign; }
}
