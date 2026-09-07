package com.oceanmining.monitoring.enums;

/**
 * 预警严重程度枚举
 * 对应数据库中的 warning_severity 类型
 */
public enum WarningSeverity {
    /**
     * 低
     */
    LOW("low", "低", 1),
    
    /**
     * 中等
     */
    MEDIUM("medium", "中等", 2),
    
    /**
     * 高
     */
    HIGH("high", "高", 3),
    
    /**
     * 严重
     */
    CRITICAL("critical", "严重", 4);
    
    private final String code;
    private final String description;
    private final int severity;
    
    WarningSeverity(String code, String description, int severity) {
        this.code = code;
        this.description = description;
        this.severity = severity;
    }
    
    public String getCode() {
        return code;
    }
    
    public String getDescription() {
        return description;
    }
    
    public int getSeverity() {
        return severity;
    }
    
    /**
     * 根据code获取枚举
     */
    public static WarningSeverity fromCode(String code) {
        for (WarningSeverity severity : values()) {
            if (severity.code.equals(code)) {
                return severity;
            }
        }
        throw new IllegalArgumentException("Unknown warning severity code: " + code);
    }
    
    /**
     * 根据风险等级获取预警严重程度
     */
    public static WarningSeverity fromRiskLevel(RiskLevel riskLevel) {
        return switch (riskLevel) {
            case LOW -> LOW;
            case MEDIUM -> MEDIUM;
            case HIGH -> HIGH;
            default -> LOW;
        };
    }
}
