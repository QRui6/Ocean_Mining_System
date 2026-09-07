package com.oceanmining.monitoring.converter;

import com.oceanmining.monitoring.enums.ShipStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * ShipStatus枚举转换器
 * 将Java枚举转换为数据库中的ship_status类型
 */
@Converter(autoApply = true)
public class ShipStatusConverter implements AttributeConverter<ShipStatus, String> {
    
    @Override
    public String convertToDatabaseColumn(ShipStatus attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getCode();
    }
    
    @Override
    public ShipStatus convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        return ShipStatus.fromCode(dbData);
    }
}
