package com.oceanmining.monitoring.repository;

import com.oceanmining.monitoring.entity.SiteForecastHourly;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SiteForecastHourlyRepository extends JpaRepository<SiteForecastHourly, Long> {

    List<SiteForecastHourly> findBySite_IdAndIsLatestTrueOrderByForecastTimeAsc(Long siteId);

    List<SiteForecastHourly> findBySite_IdAndForecastDateAndIsLatestTrueOrderByForecastTimeAsc(
            Long siteId,
            LocalDate forecastDate
    );
}
