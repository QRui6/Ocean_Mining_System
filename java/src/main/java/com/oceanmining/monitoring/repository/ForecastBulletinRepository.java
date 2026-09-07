package com.oceanmining.monitoring.repository;

import com.oceanmining.monitoring.entity.ForecastBulletin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface ForecastBulletinRepository extends JpaRepository<ForecastBulletin, Long> {

    Optional<ForecastBulletin> findByRegion_IdAndTimeRangeAndBaseDateAndRunCycle(
            Long regionId,
            String timeRange,
            LocalDate baseDate,
            String runCycle
    );

    Optional<ForecastBulletin> findTopByRegion_IdAndTimeRangeOrderByBaseDateDescCreatedAtDesc(
            Long regionId,
            String timeRange
    );
}
