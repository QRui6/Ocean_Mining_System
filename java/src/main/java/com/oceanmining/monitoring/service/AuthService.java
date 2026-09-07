package com.oceanmining.monitoring.service;

import com.oceanmining.monitoring.entity.SystemUser;
import com.oceanmining.monitoring.repository.SystemUserRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final SystemUserRepository systemUserRepository;

    public AuthService(SystemUserRepository systemUserRepository) {
        this.systemUserRepository = systemUserRepository;
    }

    public Optional<SystemUser> authenticate(String username, String password) {
        return systemUserRepository.findByUsernameAndIsActiveTrue(username)
                .filter(user -> user.getPassword().equals(password));
    }
}
