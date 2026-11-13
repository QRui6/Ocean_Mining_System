package com.oceanmining.monitoring.repository;

import com.oceanmining.monitoring.entity.MiningAreaMonitoring;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MiningAreaMonitoringRepository extends JpaRepository<MiningAreaMonitoring, Long> {
    
    /**
     * 根据矿区ID查找监测记录
     */
    Optional<MiningAreaMonitoring> findByMiningAreaId(Long miningAreaId);
    
    /**
     * 检查矿区是否已在监测列表中
     */
    boolean existsByMiningAreaId(Long miningAreaId);
    
    /**
     * 根据矿区ID删除监测记录
     */
    void deleteByMiningAreaId(Long miningAreaId);
    
    /**
     * 获取所有监测记录（按创建时间倒序）
     */
    List<MiningAreaMonitoring> findAllByOrderByCreatedAtDesc();
}
