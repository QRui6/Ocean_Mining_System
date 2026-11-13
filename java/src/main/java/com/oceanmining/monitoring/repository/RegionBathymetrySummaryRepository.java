package com.oceanmining.monitoring.repository;

import com.oceanmining.monitoring.entity.RegionBathymetrySummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface RegionBathymetrySummaryRepository extends JpaRepository<RegionBathymetrySummary, Long> {

    List<RegionBathymetrySummary> findByRegion_IdIn(Collection<Long> regionIds);
}
