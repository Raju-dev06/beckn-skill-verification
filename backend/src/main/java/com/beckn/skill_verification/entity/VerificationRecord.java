package com.beckn.skill_verification.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class VerificationRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long candidateId;
    private Long skillId;
    
    private String credentialStatus; // e.g. "VERIFIED", "FAILED"
    private String educationStatus;
    private String assessmentStatus;
    
    private Integer confidenceScore;
    private String competencyLevel;
    
    private String finalStatus;
    private LocalDateTime verifiedAt;
}
