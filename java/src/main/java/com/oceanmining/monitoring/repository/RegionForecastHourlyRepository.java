package com.oceanmining.monitoring.repository;

import com.oceanmining.monitoring.entity.RegionForecastHourly;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RegionForecastHourlyRepository extends JpaRepository<RegionForecastHourly, Long> {

    List<RegionForecastHourly> findByRegion_IdAndIsLatestTrueOrderByForecastTimeAsc(Long regionId);

    List<RegionForecastHourly> findByRegion_IdAndForecastDateAndIsLatestTrueOrderByForecastTimeAsc(
            Long regionId,
            LocalDate forecastDate
    );
}
