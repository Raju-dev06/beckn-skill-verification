package com.beckn.skill_verification.service;

public interface BecknClient {
    void search(String candidateId, String skillName, String transactionId);
    void init(String transactionId, String providerId, String credentialId);
    void confirm(String transactionId, String providerId, String credentialId);
}
