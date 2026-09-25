package com.beckn.skill_verification.service;
import com.beckn.skill_verification.dto.MockResponse;


public interface CertificationProvider {
    MockResponse verifyCertification(String credentialId);
}
