package com.beckn.skill_verification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class RealBecknClient implements BecknClient {

    @Override
    public void search(String candidateId, String skillName, String transactionId) {
        log.info("REAL BECKN CLIENT: Sending 'search' to ONEST network. Transaction: {}", transactionId);
        // This is where actual HTTP calls to the BAP/BPP will happen when configured.
    }

    @Override
    public void init(String transactionId, String providerId, String credentialId) {
        log.info("REAL BECKN CLIENT: Sending 'init' to ONEST network. Transaction: {}", transactionId);
    }

    @Override
    public void confirm(String transactionId, String providerId, String credentialId) {
        log.info("REAL BECKN CLIENT: Sending 'confirm' to ONEST network. Transaction: {}", transactionId);
    }
}
