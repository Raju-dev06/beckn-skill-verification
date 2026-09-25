package com.beckn.skill_verification.service;
import com.beckn.skill_verification.dto.MockResponse;


public interface CredentialVerificationProvider {
    MockResponse verifyCredential(Long candidateId, String credentialId, String issuer);
}
