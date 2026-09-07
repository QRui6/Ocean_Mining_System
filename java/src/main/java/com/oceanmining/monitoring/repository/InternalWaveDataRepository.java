package com.oceanmining.monitoring.repository;

import com.oceanmining.monitoring.entity.InternalWaveData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 内波数据Repository
 */
@Repository
public interface InternalWaveDataRepository extends JpaRepository<InternalWaveData, Long> {
    
    /**
     * 根据时间索引查找数据
     */
    Optional<InternalWaveData> findByTimeIndex(Integer timeIndex);
    
    /**
     * 获取所有可用的时间索引
     */
    @Query("SELECT i.timeIndex FROM InternalWaveData i ORDER BY i.timeIndex")
    List<Integer> findAllTimeIndices();
    
    /**
     * 获取时间索引数量
     */
    long countByTimeIndexIsNotNull();
}
