package com.oceanmining.monitoring.repository;

import com.oceanmining.monitoring.entity.SiteCurrentForecastDaily;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SiteCurrentForecastDailyRepository extends JpaRepository<SiteCurrentForecastDaily, Long> {

    List<SiteCurrentForecastDaily> findBySite_IdAndIsLatestTrueOrderByForecastDateAsc(Long siteId);
}
