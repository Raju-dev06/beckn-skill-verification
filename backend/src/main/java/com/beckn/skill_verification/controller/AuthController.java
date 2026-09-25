package com.beckn.skill_verification.controller;

import com.beckn.skill_verification.dto.AuthRequest;
import com.beckn.skill_verification.dto.AuthResponse;
import com.beckn.skill_verification.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;
    
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        try {
            return ResponseEntity.ok(authService.login(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody com.beckn.skill_verification.dto.SignupRequest request) {
        try {
            return ResponseEntity.ok(authService.register(request));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/debug")
    public ResponseEntity<java.util.Map<String, Long>> debug() {
        java.util.Map<String, Long> map = new java.util.HashMap<>();
        map.put("users", authService.getUserCount());
        map.put("skills", authService.getSkillCount());
        return ResponseEntity.ok(map);
    }
}
