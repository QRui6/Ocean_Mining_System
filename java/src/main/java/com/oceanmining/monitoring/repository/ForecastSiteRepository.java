package com.oceanmining.monitoring.repository;

import com.oceanmining.monitoring.entity.ForecastSite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ForecastSiteRepository extends JpaRepository<ForecastSite, Long> {

    List<ForecastSite> findByIsActiveTrueOrderBySiteCodeAsc();

    List<ForecastSite> findByRegion_IdAndIsActiveTrueOrderBySiteCodeAsc(Long regionId);
}
