package com.oceanmining.monitoring.repository;

import com.oceanmining.monitoring.entity.WeatherMetadata;
import com.oceanmining.monitoring.entity.WindData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 风场数据Repository
 * 
 * @author Ocean Mining Team
 * @version 1.0.0
 */
@Repository
public interface WindDataRepository extends JpaRepository<WindData, Long> {
    
    /**
     * 根据元数据和时间索引查找风场数据
     * 
     * @param metadata 元数据
     * @param timeIndex 时间索引
     * @return 风场数据
     */
    Optional<WindData> findByMetadataAndTimeIndex(WeatherMetadata metadata, Integer timeIndex);
    
    /**
     * 根据元数据查找所有风场数据
     * 
     * @param metadata 元数据
     * @return 风场数据列表
     */
    List<WindData> findByMetadata(WeatherMetadata metadata);
    
    /**
     * 根据元数据ID查找所有时间索引
     * 
     * @param metadataId 元数据ID
     * @return 时间索引列表
     */
    @Query("SELECT w.timeIndex FROM WindData w WHERE w.metadata.id = :metadataId ORDER BY w.timeIndex")
    List<Integer> findTimeIndicesByMetadataId(@Param("metadataId") Long metadataId);
}
