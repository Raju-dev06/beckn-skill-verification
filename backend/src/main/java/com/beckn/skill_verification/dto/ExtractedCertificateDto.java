package com.beckn.skill_verification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExtractedCertificateDto {
    private String url;
    private String issuer;
    private String title;
    private String badgeId;
    private boolean isValid;
    private String status;
    private String details;
    private String matchedSkill;
}
