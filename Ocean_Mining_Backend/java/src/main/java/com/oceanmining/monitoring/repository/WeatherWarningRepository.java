package com.oceanmining.monitoring.repository;

import com.oceanmining.monitoring.entity.WeatherWarning;
import com.oceanmining.monitoring.enums.WeatherWarningSeverity;
import com.oceanmining.monitoring.enums.WeatherWarningStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface WeatherWarningRepository
        extends JpaRepository<WeatherWarning, Long>, JpaSpecificationExecutor<WeatherWarning> {

    Optional<WeatherWarning> findByRegion_IdAndTimeRangeAndBaseDateAndRunCycle(
            Long regionId,
            String timeRange,
            LocalDate baseDate,
            String runCycle
    );

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    java.util.List<WeatherWarning> findByRegion_IdAndTimeRangeAndStatusOrderByBaseDateDescRunCycleDesc(Long regionId,String timeRange,WeatherWarningStatus status);
    long countByStatus(WeatherWarningStatus status);

    long countBySeverity(WeatherWarningSeverity severity);
}
