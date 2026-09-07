package com.oceanmining.monitoring.repository;

import com.oceanmining.monitoring.entity.SiteBathymetry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface SiteBathymetryRepository extends JpaRepository<SiteBathymetry, Long> {

    List<SiteBathymetry> findBySite_IdIn(Collection<Long> siteIds);
}
