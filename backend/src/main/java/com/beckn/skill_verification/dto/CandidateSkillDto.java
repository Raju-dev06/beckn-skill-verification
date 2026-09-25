package com.beckn.skill_verification.dto;

import lombok.Data;

@Data
public class CandidateSkillDto {
    private Long skillId;
    private String name;
    private String category;
    private String competencyLevel;
    private String verificationStatus;
    private Integer confidenceScore;
}
