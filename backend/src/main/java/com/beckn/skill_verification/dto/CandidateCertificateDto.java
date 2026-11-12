package com.beckn.skill_verification.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CandidateCertificateDto {
    private Long id;
    private Long candidateId;
    private Long skillId;
    private String skillName;
    private String skillCategory;
    private String certificateName;
    private String credentialId;
    private String issuer;
    private String filePath;
    private String fileUrl;
    private String status; // "VERIFIED", "UPLOADED", "NOT VERIFIED"
    private String validity; // "VALID / AUTHENTIC", "PENDING AUDIT", "REVOKED / UNVERIFIED"
    private Integer confidenceScore; // e.g. 95
    private String competencyLevel; // "Advanced", "Intermediate", "Pending"
    private LocalDateTime verifiedAt;
    private String formattedDate;
    private String verificationProofUrn; // urn:onest:credential:...
    private boolean valid;
}

