package com.oceanmining.monitoring.repository;

import com.oceanmining.monitoring.entity.Warning;
import com.oceanmining.monitoring.enums.WarningSeverity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 预警记录Repository
 */
@Repository
public interface WarningRepository extends JpaRepository<Warning, Long> {
    
    /**
     * 查询区域内未解决的预警
     */
    List<Warning> findByArea_IdAndIsResolvedFalse(Long areaId);
    
    /**
     * 查询指定船舶未解决的预警
     */
    List<Warning> findByMmsiAndIsResolvedFalse(Long mmsi);
    
    /**
     * 查询区域内指定船舶未解决的预警
     */
    List<Warning> findByArea_IdAndMmsiAndIsResolvedFalse(Long areaId, Long mmsi);
    
    /**
     * 查询所有未解决的预警，按严重程度和创建时间排序
     */
    @Query("SELECT w FROM Warning w WHERE w.isResolved = FALSE " +
           "ORDER BY w.severity DESC, w.createdAt DESC")
    List<Warning> findActiveWarningsOrderBySeverity();
    
    /**
     * 查询指定时间范围内的预警
     */
    List<Warning> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    
    /**
     * 统计区域内未解决的预警数量
     */
    long countByArea_IdAndIsResolvedFalse(Long areaId);
    
    /**
     * 查询指定严重程度的未解决预警
     */
    List<Warning> findBySeverityAndIsResolvedFalse(WarningSeverity severity);
    
    /**
     * 查询最近1小时内的相同类型预警（用于避免重复预警）
     */
    @Query("SELECT w FROM Warning w WHERE w.area.id = :areaId " +
           "AND w.mmsi = :mmsi " +
           "AND w.isResolved = FALSE " +
           "AND w.createdAt > :oneHourAgo")
    List<Warning> findRecentWarnings(@Param("areaId") Long areaId, 
                                     @Param("mmsi") Long mmsi,
                                     @Param("oneHourAgo") LocalDateTime oneHourAgo);
    
    /**
     * 查询区域内指定船舶在指定时间之后的未解决预警
     */
    List<Warning> findByArea_IdAndMmsiAndIsResolvedFalseAndCreatedAtAfter(
            Long areaId, Long mmsi, LocalDateTime createdAt);
    
    /**
     * 查询区域的预警记录（分页，按创建时间倒序）
     */
    List<Warning> findByArea_IdOrderByCreatedAtDesc(Long areaId, org.springframework.data.domain.Pageable pageable);
}
