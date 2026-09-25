package com.beckn.skill_verification.service;
import com.beckn.skill_verification.dto.MockResponse;


import org.springframework.stereotype.Service;

@Service
public class MockAssessmentProvider implements AssessmentProvider {
    @Override
    public MockResponse getAssessmentResult(Long candidateId, String skillName) {
        if (skillName.equalsIgnoreCase("Java")) {
            return new MockResponse("VERIFIED", 36); // 36 points
        }
        return new MockResponse("VERIFIED", 30);
    }
}
