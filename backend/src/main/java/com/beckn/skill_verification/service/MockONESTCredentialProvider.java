package com.beckn.skill_verification.service;
import com.beckn.skill_verification.dto.MockResponse;


import org.springframework.stereotype.Service;

@Service
public class MockONESTCredentialProvider implements CredentialVerificationProvider {
    @Override
    public MockResponse verifyCredential(Long candidateId, String credentialId, String issuer) {
        if (credentialId == null || credentialId.isEmpty()) {
            return new MockResponse("FAILED", 0);
        }
        // Deterministic mock logic
        if (credentialId.startsWith("JAVA")) {
            return new MockResponse("VERIFIED", 30); // 30 points
        }
        return new MockResponse("VERIFIED", 25);
    }
}
