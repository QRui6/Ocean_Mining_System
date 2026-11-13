package com.oceanmining.monitoring.enums;

/**
 * 风险等级枚举
 * 对应数据库中的 risk_level 类型
 */
public enum RiskLevel {
    /**
     * 安全
     */
    SAFE("safe", "安全", 0),
    
    /**
     * 低风险
     */
    LOW("low", "低风险", 1),
    
    /**
     * 中等风险
     */
    MEDIUM("medium", "中等风险", 2),
    
    /**
     * 高风险
     */
    HIGH("high", "高风险", 3);
    
    private final String code;
    private final String description;
    private final int level;
    
    RiskLevel(String code, String description, int level) {
        this.code = code;
        this.description = description;
        this.level = level;
    }
    
    public String getCode() {
        return code;
    }
    
    public String getDescription() {
        return description;
    }
    
    public int getLevel() {
        return level;
    }
    
    /**
     * 根据code获取枚举
     */
    public static RiskLevel fromCode(String code) {
        for (RiskLevel riskLevel : values()) {
            if (riskLevel.code.equals(code)) {
                return riskLevel;
            }
        }
        throw new IllegalArgumentException("Unknown risk level code: " + code);
    }
    
    /**
     * 判断是否需要预警
     */
    public boolean needsWarning() {
        return this.level >= MEDIUM.level;
    }
}
