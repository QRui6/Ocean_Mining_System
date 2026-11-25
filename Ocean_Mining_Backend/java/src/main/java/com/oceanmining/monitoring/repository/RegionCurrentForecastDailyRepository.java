package com.oceanmining.monitoring.repository;

import com.oceanmining.monitoring.entity.RegionCurrentForecastDaily;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RegionCurrentForecastDailyRepository extends JpaRepository<RegionCurrentForecastDaily, Long> {

    List<RegionCurrentForecastDaily> findByRegion_IdAndIsLatestTrueOrderByForecastDateAsc(Long regionId);
}
