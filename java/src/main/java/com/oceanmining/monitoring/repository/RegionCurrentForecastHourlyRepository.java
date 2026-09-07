package com.oceanmining.monitoring.repository;

import com.oceanmining.monitoring.entity.RegionCurrentForecastHourly;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RegionCurrentForecastHourlyRepository extends JpaRepository<RegionCurrentForecastHourly, Long> {

    List<RegionCurrentForecastHourly> findByRegion_IdAndIsLatestTrueOrderByForecastTimeAsc(Long regionId);

    List<RegionCurrentForecastHourly> findByRegion_IdAndForecastDateAndIsLatestTrueOrderByForecastTimeAsc(
            Long regionId,
            LocalDate forecastDate
    );
}
