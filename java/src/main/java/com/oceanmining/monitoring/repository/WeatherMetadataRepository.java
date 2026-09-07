package com.oceanmining.monitoring.repository;

import com.oceanmining.monitoring.entity.WeatherMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 气象数据元数据Repository
 * 
 * @author Ocean Mining Team
 * @version 1.0.0
 */
@Repository
public interface WeatherMetadataRepository extends JpaRepository<WeatherMetadata, Long> {
    
    /**
     * 根据数据类型代码查找元数据
     * 
     * @param typeCode 类型代码
     * @return 元数据
     */
    @Query("SELECT m FROM WeatherMetadata m JOIN FETCH m.dataType dt WHERE dt.typeCode = :typeCode")
    Optional<WeatherMetadata> findByDataType_TypeCode(@Param("typeCode") String typeCode);
}
