package com.oceanmining.monitoring.repository;

import com.oceanmining.monitoring.entity.MiningRegion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MiningRegionRepository extends JpaRepository<MiningRegion, Long> {

    List<MiningRegion> findByIsActiveTrueOrderByRegionNameAsc();

    Optional<MiningRegion> findByRegionCode(String regionCode);
}
