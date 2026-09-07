package com.oceanmining.monitoring.converter;

import com.oceanmining.monitoring.enums.WarningSeverity;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * WarningSeverity枚举转换器
 * 将Java枚举转换为数据库中的warning_severity类型
 */
@Converter(autoApply = true)
public class WarningSeverityConverter implements AttributeConverter<WarningSeverity, String> {
    
    @Override
    public String convertToDatabaseColumn(WarningSeverity attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getCode();
    }
    
    @Override
    public WarningSeverity convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        return WarningSeverity.fromCode(dbData);
    }
}
