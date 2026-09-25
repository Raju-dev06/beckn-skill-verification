package com.beckn.skill_verification.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class CandidateProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long userId;
    private String phone;
    private String education;
    private String college;
    private Integer graduationYear;
}
