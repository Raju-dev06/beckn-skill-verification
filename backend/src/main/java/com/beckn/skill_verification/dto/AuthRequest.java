package com.beckn.skill_verification.dto;

import lombok.Data;

@Data
public class AuthRequest {
    private String email;
    private String password;
}
