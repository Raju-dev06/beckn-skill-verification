package com.beckn.skill_verification.dto;

import lombok.Data;
import java.util.List;

@Data
public class CandidateProfileDto {
    private Long candidateId;
    private String name;
    private String email;
    private String phone;
    private String education;
    private String college;
    private Integer graduationYear;
    private Integer overallVerificationScore;
    
    private List<CandidateSkillDto> skills;
}
