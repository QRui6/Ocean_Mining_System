package com.oceanmining.monitoring.repository;

import com.oceanmining.monitoring.entity.InternalWaveMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 内波元数据Repository
 */
@Repository
public interface InternalWaveMetadataRepository extends JpaRepository<InternalWaveMetadata, Long> {
    
    /**
     * 根据类型查找元数据
     */
    Optional<InternalWaveMetadata> findByType(String type);
}
