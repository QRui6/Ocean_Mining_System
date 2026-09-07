package com.oceanmining.monitoring.repository;

import com.oceanmining.monitoring.entity.EventLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 事件日志Repository
 */
@Repository
public interface EventLogRepository extends JpaRepository<EventLog, Long> {
    
    /**
     * 查询区域的事件日志（分页）
     */
    List<EventLog> findByArea_IdOrderByCreatedAtDesc(Long areaId, Pageable pageable);
    
    /**
     * 查询指定船舶的事件日志
     */
    List<EventLog> findByMmsiOrderByCreatedAtDesc(Long mmsi, Pageable pageable);
    
    /**
     * 查询指定事件类型的日志
     */
    List<EventLog> findByEventTypeOrderByCreatedAtDesc(String eventType, Pageable pageable);
    
    /**
     * 查询指定时间范围内的事件
     */
    List<EventLog> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end);
    
    /**
     * 查询区域内指定时间范围的事件
     */
    @Query("SELECT e FROM EventLog e WHERE e.area.id = :areaId " +
           "AND e.createdAt BETWEEN :start AND :end " +
           "ORDER BY e.createdAt DESC")
    List<EventLog> findByAreaAndTimeRange(@Param("areaId") Long areaId,
                                          @Param("start") LocalDateTime start,
                                          @Param("end") LocalDateTime end);
    
    /**
     * 统计区域的事件数量
     */
    long countByArea_Id(Long areaId);
    
    /**
     * 删除指定时间之前的日志（用于清理历史数据）
     */
    void deleteByCreatedAtBefore(LocalDateTime date);
}
