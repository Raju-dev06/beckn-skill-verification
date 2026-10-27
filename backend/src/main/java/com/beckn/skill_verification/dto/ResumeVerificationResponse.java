package com.beckn.skill_verification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeVerificationResponse {
    private String fileName;
    private int totalLinksFound;
    private int validCertificatesCount;
    private int invalidCertificatesCount;
    @Builder.Default
    private List<ExtractedCertificateDto> extractedCertificates = new ArrayList<>();
    @Builder.Default
    private List<String> ignoredLinks = new ArrayList<>();
    private String summary;
}
