package com.oceanmining.monitoring.repository;

import com.oceanmining.monitoring.entity.WeatherDataType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 气象数据类型Repository
 * 
 * @author Ocean Mining Team
 * @version 1.0.0
 */
@Repository
public interface WeatherDataTypeRepository extends JpaRepository<WeatherDataType, Long> {
    
    /**
     * 根据类型代码查找数据类型
     * 
     * @param typeCode 类型代码 (wind, ocean_current, wave)
     * @return 数据类型
     */
    Optional<WeatherDataType> findByTypeCode(String typeCode);
}
