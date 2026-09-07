package com.oceanmining.monitoring.repository;

import com.oceanmining.monitoring.entity.OceanCurrentData;
import com.oceanmining.monitoring.entity.WeatherMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 洋流数据Repository
 * 
 * @author Ocean Mining Team
 * @version 1.0.0
 */
@Repository
public interface OceanCurrentDataRepository extends JpaRepository<OceanCurrentData, Long> {
    
    /**
     * 根据元数据和时间索引查找洋流数据
     * 
     * @param metadata 元数据
     * @param timeIndex 时间索引
     * @return 洋流数据
     */
    Optional<OceanCurrentData> findByMetadataAndTimeIndex(WeatherMetadata metadata, Integer timeIndex);
    
    /**
     * 根据元数据查找所有洋流数据
     * 
     * @param metadata 元数据
     * @return 洋流数据列表
     */
    List<OceanCurrentData> findByMetadata(WeatherMetadata metadata);
    
    /**
     * 根据元数据ID查找所有时间索引
     * 
     * @param metadataId 元数据ID
     * @return 时间索引列表
     */
    @Query("SELECT o.timeIndex FROM OceanCurrentData o WHERE o.metadata.id = :metadataId ORDER BY o.timeIndex")
    List<Integer> findTimeIndicesByMetadataId(@Param("metadataId") Long metadataId);
}
