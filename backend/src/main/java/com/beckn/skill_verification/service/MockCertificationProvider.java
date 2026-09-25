package com.beckn.skill_verification.service;
import com.beckn.skill_verification.dto.MockResponse;


import org.springframework.stereotype.Service;

@Service
public class MockCertificationProvider implements CertificationProvider {
    @Override
    public MockResponse verifyCertification(String credentialId) {
        if (credentialId == null || credentialId.isEmpty()) {
            return new MockResponse("FAILED", 0);
        }
        if (credentialId.startsWith("JAVA")) {
            return new MockResponse("VERIFIED", 20); // 20 points
        }
        return new MockResponse("VERIFIED", 15);
    }
}
