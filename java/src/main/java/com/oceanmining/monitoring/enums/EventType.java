package com.oceanmining.monitoring.enums;

/**
 * 事件类型枚举
 */
public enum EventType {
    /**
     * 船舶进入区域
     */
    ENTER("enter", "船舶进入"),
    
    /**
     * 船舶离开区域
     */
    LEAVE("leave", "船舶离开"),
    
    /**
     * 预警事件
     */
    WARNING("warning", "预警"),
    
    /**
     * 状态更新
     */
    UPDATE("update", "状态更新");
    
    private final String code;
    private final String description;
    
    EventType(String code, String description) {
        this.code = code;
        this.description = description;
    }
    
    public String getCode() {
        return code;
    }
    
    public String getDescription() {
        return description;
    }
    
    /**
     * 根据code获取枚举
     */
    public static EventType fromCode(String code) {
        for (EventType type : values()) {
            if (type.code.equals(code)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown event type code: " + code);
    }
}
