package com.oceanmining.monitoring.repository;

import com.oceanmining.monitoring.entity.SiteForecastDaily;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SiteForecastDailyRepository extends JpaRepository<SiteForecastDaily, Long> {

    List<SiteForecastDaily> findBySite_IdAndIsLatestTrueOrderByForecastDateAsc(Long siteId);
}
