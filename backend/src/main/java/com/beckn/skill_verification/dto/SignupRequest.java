package com.beckn.skill_verification.dto;

import lombok.Data;

@Data
public class SignupRequest {
    private String name;
    private String email;
    private String password;
    private String role; // "CANDIDATE" or "EMPLOYER"
    
    // Candidate profile fields
    private String phone;
    private String education;
    private String college;
    private Integer graduationYear;
}
