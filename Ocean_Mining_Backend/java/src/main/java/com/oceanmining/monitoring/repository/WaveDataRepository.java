package com.oceanmining.monitoring.repository;

import com.oceanmining.monitoring.entity.WaveData;
import com.oceanmining.monitoring.entity.WeatherMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 波浪数据Repository
 * 
 * @author Ocean Mining Team
 * @version 1.0.0
 */
@Repository
public interface WaveDataRepository extends JpaRepository<WaveData, Long> {
    
    /**
     * 根据元数据和时间索引查找波浪数据
     * 
     * @param metadata 元数据
     * @param timeIndex 时间索引
     * @return 波浪数据
     */
    Optional<WaveData> findByMetadataAndTimeIndex(WeatherMetadata metadata, Integer timeIndex);
    
    /**
     * 根据元数据查找所有波浪数据
     * 
     * @param metadata 元数据
     * @return 波浪数据列表
     */
    List<WaveData> findByMetadata(WeatherMetadata metadata);
    
    /**
     * 根据元数据ID查找所有时间索引
     * 
     * @param metadataId 元数据ID
     * @return 时间索引列表
     */
    @Query("SELECT w.timeIndex FROM WaveData w WHERE w.metadata.id = :metadataId ORDER BY w.timeIndex")
    List<Integer> findTimeIndicesByMetadataId(@Param("metadataId") Long metadataId);
}
