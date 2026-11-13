package com.oceanmining.monitoring.converter;

import com.oceanmining.monitoring.enums.RiskLevel;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * RiskLevel枚举转换器
 * 将Java枚举转换为数据库中的risk_level类型
 */
@Converter(autoApply = true)
public class RiskLevelConverter implements AttributeConverter<RiskLevel, String> {
    
    @Override
    public String convertToDatabaseColumn(RiskLevel attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getCode();
    }
    
    @Override
    public RiskLevel convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        return RiskLevel.fromCode(dbData);
    }
}
