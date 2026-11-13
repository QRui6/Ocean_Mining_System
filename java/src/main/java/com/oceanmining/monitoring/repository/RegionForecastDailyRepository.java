package com.oceanmining.monitoring.repository;

import com.oceanmining.monitoring.entity.RegionForecastDaily;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RegionForecastDailyRepository extends JpaRepository<RegionForecastDaily, Long> {

    List<RegionForecastDaily> findByRegion_IdAndIsLatestTrueOrderByForecastDateAsc(Long regionId);
}
