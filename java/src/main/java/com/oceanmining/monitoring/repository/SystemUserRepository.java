package com.oceanmining.monitoring.repository;

import com.oceanmining.monitoring.entity.SystemUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SystemUserRepository extends JpaRepository<SystemUser, Long> {
    Optional<SystemUser> findByUsernameAndIsActiveTrue(String username);
}
