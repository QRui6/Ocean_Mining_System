package com.oceanmining.monitoring.repository;

import com.oceanmining.monitoring.entity.MiningArea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface MiningAreaRepository extends JpaRepository<MiningArea, Long> {
    Optional<MiningArea> findByAreaId(String areaId);
    boolean existsByAreaId(String areaId);
    List<MiningArea> findByCategory(String category);
    List<MiningArea> findBySponsor(String sponsor);
    List<MiningArea> findByStatus(String status);
    List<MiningArea> findByCategoryAndSponsor(String category, String sponsor);
    
    @Query(value = "SELECT * FROM mining_areas WHERE ST_Contains(geometry, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))", nativeQuery = true)
    List<MiningArea> findAreasContainingPoint(@Param("lng") Double lng, @Param("lat") Double lat);
    
    @Query("SELECT DISTINCT m.category FROM MiningArea m ORDER BY m.category")
    List<String> findAllCategories();
    
    @Query("SELECT DISTINCT m.sponsor FROM MiningArea m ORDER BY m.sponsor")
    List<String> findAllSponsors();
    
    @Query("SELECT DISTINCT m.status FROM MiningArea m ORDER BY m.status")
    List<String> findAllStatuses();
}
