package com.oceanmining.monitoring.enums;

/**
 * 船舶状态枚举
 * 对应数据库中的 ship_status 类型
 */
public enum ShipStatus {
    /**
     * 在区域内
     */
    IN_AREA("in_area", "在区域内"),
    
    /**
     * 已离开
     */
    LEFT("left", "已离开"),
    
    /**
     * 预警状态
     */
    WARNING("warning", "预警状态");
    
    private final String code;
    private final String description;
    
    ShipStatus(String code, String description) {
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
    public static ShipStatus fromCode(String code) {
        for (ShipStatus status : values()) {
            if (status.code.equals(code)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown ship status code: " + code);
    }
}
