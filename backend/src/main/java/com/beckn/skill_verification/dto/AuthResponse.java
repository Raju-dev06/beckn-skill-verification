package com.beckn.skill_verification.dto;

import com.beckn.skill_verification.entity.User;
import lombok.Data;

@Data
public class AuthResponse {
    private String token;
    private User user;
}
