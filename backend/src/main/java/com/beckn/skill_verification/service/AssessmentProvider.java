package com.beckn.skill_verification.service;
import com.beckn.skill_verification.dto.MockResponse;


public interface AssessmentProvider {
    MockResponse getAssessmentResult(Long candidateId, String skillName);
}
