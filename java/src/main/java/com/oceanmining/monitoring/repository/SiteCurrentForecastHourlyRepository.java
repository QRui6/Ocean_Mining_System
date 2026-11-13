package com.oceanmining.monitoring.repository;

import com.oceanmining.monitoring.entity.SiteCurrentForecastHourly;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SiteCurrentForecastHourlyRepository extends JpaRepository<SiteCurrentForecastHourly, Long> {

    List<SiteCurrentForecastHourly> findBySite_IdAndIsLatestTrueOrderByForecastTimeAsc(Long siteId);

    List<SiteCurrentForecastHourly> findBySite_IdAndForecastDateAndIsLatestTrueOrderByForecastTimeAsc(
            Long siteId,
            LocalDate forecastDate
    );
}
