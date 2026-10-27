package com.beckn.skill_verification.service;

import com.beckn.skill_verification.dto.ResumeVerificationResponse;
import com.beckn.skill_verification.repository.SkillRepository;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

public class ResumeVerificationServiceTest {

    @Test
    void testResumeExtractionAndFiltering() {
        SkillRepository skillRepo = Mockito.mock(SkillRepository.class);
        Mockito.when(skillRepo.findAll()).thenReturn(Collections.emptyList());

        ResumeVerificationService service = new ResumeVerificationService(skillRepo);

        String sampleText = """
            John Candidate
            GitHub: https://github.com/candidate/test-repo
            LinkedIn Profile: https://linkedin.com/in/johndoe
            Personal Blog: https://medium.com/@john/my-story
            
            Certifications:
            - Real AWS Badge: https://www.credly.com/org/amazon-web-services/badge/aws-certified-solutions-architect-associate
            - Fake Tampered Badge: https://www.credly.com/badges/fake-uuid-not-exist-000000000
            """;

        ResumeVerificationResponse response = service.verifyResumeText(sampleText);

        assertNotNull(response);
        assertEquals(5, response.getTotalLinksFound(), "Should find 5 total links");
        assertEquals(2, response.getExtractedCertificates().size(), "Should extract exactly 2 certificate links");
        assertEquals(3, response.getIgnoredLinks().size(), "Should ignore 3 non-certificate links (GitHub, LinkedIn profile, Medium)");

        // Verify that the real badge is valid and the fake badge is invalid
        var validCert = response.getExtractedCertificates().stream()
                .filter(c -> c.getUrl().contains("aws-certified"))
                .findFirst().orElse(null);
        assertNotNull(validCert);
        System.out.println("DEBUG validCert status=" + validCert.getStatus() + ", details=" + validCert.getDetails() + ", title=" + validCert.getTitle());
        assertTrue(validCert.isValid(), "Real badge should be valid");

        var fakeCert = response.getExtractedCertificates().stream()
                .filter(c -> c.getUrl().contains("fake-uuid"))
                .findFirst().orElse(null);
        assertNotNull(fakeCert);
        assertFalse(fakeCert.isValid(), "Fake badge should be invalid");

        System.out.println("Test PASSED: Summary = " + response.getSummary());
    }
}
