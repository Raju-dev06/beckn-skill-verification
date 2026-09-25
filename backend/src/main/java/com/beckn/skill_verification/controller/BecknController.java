package com.beckn.skill_verification.controller;
import com.beckn.skill_verification.repository.BecknTransactionRepository;


import com.beckn.skill_verification.service.VerificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/beckn")
@RequiredArgsConstructor
public class BecknController {

    private final BecknTransactionRepository transactionRepository;
    private final VerificationService verificationService; // Note: We will handle circular dependencies or use ApplicationEventPublisher if needed

    @PostMapping("/on_search")
    public ResponseEntity<?> onSearch(@RequestBody Object payload) {
        // Real implementation parses Beckn context from payload
        return ResponseEntity.ok().build();
    }
    
    // Internal simulation methods (usually these would parse the raw HTTP POST payload)
    public void handleOnSearch(String transactionId, String providerId, String message) {
        log.info("Received on_search callback for transaction: {}", transactionId);
        verificationService.processOnSearch(transactionId, providerId);
    }

    public void handleOnInit(String transactionId, String message) {
        log.info("Received on_init callback for transaction: {}", transactionId);
        verificationService.processOnInit(transactionId);
    }

    public void handleOnConfirm(String transactionId, String status, int confidenceScore) {
        log.info("Received on_confirm callback for transaction: {}", transactionId);
        verificationService.processOnConfirm(transactionId, status, confidenceScore);
    }
}
