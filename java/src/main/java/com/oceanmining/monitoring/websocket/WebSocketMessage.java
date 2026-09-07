package com.oceanmining.monitoring.websocket;

/**
 * WebSocket消息格式
 */
public class WebSocketMessage {
    
    /**
     * 消息类型
     * area_created - 区域创建
     * area_deleted - 区域删除
     * ship_enter - 船舶进入
     * ship_leave - 船舶离开
     * ship_update - 船舶状态更新
     * warning - 预警
     */
    private String type;
    
    /**
     * 消息负载
     */
    private Object payload;
    
    /**
     * 时间戳
     */
    private Long timestamp;
    
    // Constructors
    public WebSocketMessage() {}
    
    public WebSocketMessage(String type, Object payload, Long timestamp) {
        this.type = type;
        this.payload = payload;
        this.timestamp = timestamp;
    }
    
    // Getters and Setters
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    
    public Object getPayload() { return payload; }
    public void setPayload(Object payload) { this.payload = payload; }
    
    public Long getTimestamp() { return timestamp; }
    public void setTimestamp(Long timestamp) { this.timestamp = timestamp; }
    
    /**
     * 创建消息
     */
    public static WebSocketMessage create(String type, Object payload) {
        return new WebSocketMessage(type, payload, System.currentTimeMillis());
    }
}
