package com.beckn.skill_verification.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class VerificationResultDto {
    private String skillName;
    private String category;
    private String competencyLevel;
    private Integer confidenceScore;
    private String status;
    private LocalDateTime verifiedAt;
    
    private String credentialStatus;
    private String educationStatus;
    private String assessmentStatus;
    private String certificateName;
    private String credentialId;
    private String issuer;
}
