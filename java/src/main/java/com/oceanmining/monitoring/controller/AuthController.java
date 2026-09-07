package com.oceanmining.monitoring.controller;

import com.oceanmining.monitoring.dto.request.LoginRequest;
import com.oceanmining.monitoring.dto.response.ApiResponse;
import com.oceanmining.monitoring.dto.response.LoginResponse;
import com.oceanmining.monitoring.entity.SystemUser;
import com.oceanmining.monitoring.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        Optional<SystemUser> userOpt = authService.authenticate(request.getUsername(), request.getPassword());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("用户名或密码不正确"));
        }

        SystemUser user = userOpt.get();
        LoginResponse response = new LoginResponse();
        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setDisplayName(user.getDisplayName());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
