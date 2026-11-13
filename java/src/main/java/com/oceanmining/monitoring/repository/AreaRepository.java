package com.oceanmining.monitoring.repository;

import com.oceanmining.monitoring.entity.MonitoringArea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 监控区域Repository
 */
@Repository
public interface AreaRepository extends JpaRepository<MonitoringArea, Long> {
    
    /**
     * 根据船讯网区域ID查询
     */
    Optional<MonitoringArea> findByAreaId(String areaId);
    
    /**
     * 查询所有激活的区域
     */
    List<MonitoringArea> findByIsActiveTrue();
    
    /**
     * 根据名称查询
     */
    Optional<MonitoringArea> findByName(String name);
    
    /**
     * 查询包含指定点的所有区域（使用PostGIS空间查询）
     */
    @Query(value = "SELECT * FROM monitoring_areas WHERE is_active = TRUE " +
                   "AND ST_Contains(geometry, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))", 
           nativeQuery = true)
    List<MonitoringArea> findAreasContainingPoint(@Param("lng") Double lng, @Param("lat") Double lat);
    
    /**
     * 统计激活的区域数量
     */
    long countByIsActiveTrue();
}
