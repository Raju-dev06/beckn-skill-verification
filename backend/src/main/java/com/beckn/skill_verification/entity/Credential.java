package com.beckn.skill_verification.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Credential {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long candidateId;
    private Long skillId;
    
    private String certificateName;
    private String credentialId;
    private String issuer;
    private String filePath;
    private String status; // "UPLOADED", "VERIFIED"
}
